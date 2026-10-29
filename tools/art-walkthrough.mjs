import path from 'node:path'
import { launch, ROOT } from './cdp.mjs'
const OUT = process.argv[2] || path.join(ROOT, 'shots/art'); (await import('node:fs')).mkdirSync(OUT, { recursive: true })
const page = await launch({ width: 1280, height: 720 })
const shot = n => page.screenshot(path.join(OUT, n + '.png'))
const ev = s => page.evaluate(s)
const log = async (tag, extra = '') => console.log(tag, await ev(`var r=IS.state.run,p=r&&r.player; return IS.state.screen + (p ? ' room='+r.room.index+'/'+r.room.type+' p='+Math.round(p.x)+','+Math.round(p.y)+' hp='+JSON.stringify(p.hearts)+' coins='+p.coins+' items='+p.items.length+' pickups='+(r.room.pickups||[]).filter(x=>!x.dead).map(x=>x.kind+(x.price?'$'+x.price:'')).join(',')+' ${extra}' : '')`))
// put the player next to a door (in-game state), then walk through it with real keys
const toDoor = (type) => ev(`var r=IS.state.run,f=r.floor,cur=r.room; var d=cur.doors.find(function(d){var t=f.rooms[d.target];return t&&t.type==='${type}'&&!d.hidden}); if(!d) return 'none'; cur.cleared=true; d.open=true; d.locked=false; var p=r.player; p.x=d.insideX; p.y=d.insideY; return d.dir`)
const walkDir = { up: 'w', down: 's', left: 'a', right: 'd' }
async function enterVia (type, tag) {
  // walk the floor graph until a room adjacent to the target type is current
  const dir = await ev(`var r=IS.state.run,f=r.floor; var idx=f.rooms.findIndex(function(x){return x&&x.type==='${type}'}); if(idx<0) return 'none'; var nb=f.rooms.findIndex(function(x){return x&&x.doors&&x.doors.some(function(d){return d.target===idx})}); IS.enterRoom(r, nb, null, IS.state.ctx); r.room.enemies=[]; r.room.cleared=true; return 'ok'`)
  if (dir === 'none') return console.log(tag, 'no room of type', type)
  const d = await toDoor(type); if (d === 'none') return console.log(tag, 'no door')
  await page.key(walkDir[d]); await page.wait(60); await shot(tag + '-a-transition'); await page.wait(140); await shot(tag + '-b-transition'); await page.wait(500); await page.key(walkDir[d], 'keyUp'); await shot(tag + '-c-arrived'); await log(tag)
}
try {
  await page.goto('file://' + path.join(ROOT, 'index.html')); await page.wait(1200)
  await shot('00-title'); await page.wait(700); await shot('00b-title')
  await page.press('enter'); await page.wait(500); await shot('01-slots'); await page.press('right'); await page.wait(400); await shot('01b-slots-2')
  await page.press('enter'); await page.wait(500); await shot('02-menu'); await page.press('down'); await page.press('down'); await page.wait(300); await shot('02b-menu-sel')
  await page.press('up'); await page.press('up'); await page.press('enter'); await page.wait(600); await shot('03-select')
  await page.press('right'); await page.wait(500); await shot('03b-select-2'); await page.press('right'); await page.wait(500); await shot('03c-select-3')
  await page.press('tab'); await page.wait(500); await shot('04-select-tainted'); await page.press('right'); await page.wait(500); await shot('04b-select-tainted-2'); await page.press('tab'); await page.wait(400)
  await page.press('left'); await page.press('left'); await page.wait(500)
  await page.press('enter'); await page.wait(1200); await shot('05-game-hud')
  await ev(`IS.state.run.player.invulnUntil = 0; return 1`)
  await page.key('d'); await page.key('up'); await page.wait(350); await shot('06-tears-moving'); await page.key('d', 'keyUp'); await page.key('up', 'keyUp')
  await enterVia('treasure', '10-treasure')
  const ped = await ev(`var r=IS.state.run,pu=(r.room.pickups||[]).find(function(x){return x.kind==='item'}); if(!pu) return 'none'; r.player.x=pu.x; r.player.y=pu.y+70; return pu.id`)
  console.log('pedestal', ped); await page.hold(['w'], 350); await shot('11-pickup-0'); await page.wait(500); await shot('12-pickup-1'); await page.wait(900); await shot('13-pickup-2')
  await enterVia('shop', '20-shop'); await page.wait(400); await shot('21-shop')
  await page.key('tab'); await page.wait(250); await shot('50-map'); await page.key('tab', 'keyUp')
  await page.press('escape'); await page.wait(300); await shot('51-pause'); await page.press('escape'); await page.wait(200)
  await ev(`var r=IS.state.run,b=IS.bosses[0]; r.bossIntro={bossId:b.id,name:b.name,t:1.0,dur:2.2}; return 1`); await page.wait(250); await shot('60-boss-intro'); await ev(`IS.state.run.bossIntro=null; return 1`)
  await enterVia('boss', '61-boss')
  await ev(`var r=IS.state.run; if (!r.room.enemies.some(function(e){return e.boss})) IS.spawnBoss(r.room,'monstro',r.room.pxW/2,r.room.pxH/2-40,{}); return 1`)
  await page.wait(900); await shot('62-boss-fight')
  await ev(`var r=IS.state.run,p=r.player; p.invulnUntil=0; p.hearts.red=1; p.hearts.soul=0; IS.damagePlayer(p, 4, {name:'test'}, IS.state.ctx); return 1`); await page.wait(1800); await shot('70-death'); await log('death')
  console.log('errors', page.console.errors.length, page.console.errors.slice(0, 3).join(' | '), page.console.exceptions.slice(0, 2).join(' | '))
} finally { await page.close() }
