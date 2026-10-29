import path from 'node:path'
import { launch, ROOT } from './cdp.mjs'
const OUT = process.argv[2] || path.join(ROOT, 'shots/walkthrough'); (await import('node:fs')).mkdirSync(OUT, { recursive: true })
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
  await page.goto('file://' + path.join(ROOT, 'index.html')); await page.wait(1000)
  await shot('00-title'); await page.press('enter'); await page.wait(500); await shot('01-slots'); await page.press('enter'); await page.wait(500); await shot('01b-menu'); await page.press('enter'); await page.wait(400); await shot('02-select'); await page.press('enter'); await page.wait(900); await shot('03-start'); await log('start')
  // screenshots take seconds in software render while the game runs in real time, so the
  // player is shielded for the tour; combat timing is checked on sim time in walkthrough-engine.mjs
  await ev(`IS.state.run.player.status.invincible=1e9; return 1`)
  await ev(`IS.state.run.player.invulnUntil = 0; return 1`)
  // tears while moving
  await page.key('d'); await page.key('up'); await page.wait(350); await shot('04-tears-moving'); await page.wait(500); await shot('05-tears-range'); await page.key('d', 'keyUp'); await page.key('up', 'keyUp')
  await enterVia('treasure', '10-treasure')
  const ped = await ev(`var r=IS.state.run,pu=(r.room.pickups||[]).find(function(x){return x.kind==='item'}); if(!pu) return 'none'; r.player.x=pu.x; r.player.y=pu.y+70; return pu.id`)
  console.log('pedestal', ped); await page.hold(['w'], 350); await shot('11-pickup-0'); await page.wait(400); await shot('12-pickup-1'); await log('after-pickup')
  await enterVia('shop', '20-shop')
  await ev(`IS.state.run.player.coins=0; return 1`)
  const shopItem = await ev(`var r=IS.state.run,pu=(r.room.pickups||[]).find(function(x){return x.price}); if(!pu) return 'none'; r.player.x=pu.x; r.player.y=pu.y+70; return pu.kind+'$'+pu.price`)
  console.log('shop item', shopItem); await page.hold(['w'], 400); await shot('21-shop-broke'); await log('shop-broke')
  await ev(`IS.state.run.player.coins=30; var r=IS.state.run,pu=(r.room.pickups||[]).find(function(x){return x.price&&!x.dead}); if(pu){r.player.x=pu.x; r.player.y=pu.y+70} return 1`); await page.hold(['w'], 400); await shot('22-shop-bought'); await log('shop-bought')
  // full-health heart and consumables
  await ev(`var r=IS.state.run,p=r.player,c=IS.state.ctx; p.hearts.red=p.hearts.maxRed; c.spawnPickup('heart',p.x+80,p.y,{}); c.spawnPickup('coin',p.x+160,p.y,{}); c.spawnPickup('key',p.x+240,p.y,{}); c.spawnPickup('bomb',p.x+320,p.y,{}); return 1`)
  await page.hold(['d'], 1300); await shot('30-pickups'); await log('pickups')
  // get hit
  await ev(`var r=IS.state.run,p=r.player; r.room.enemies=[]; var e=IS.spawnEnemy(r.room,'gaper',p.x+40,p.y,{}); e.spawnT=0; p.invulnUntil=0; delete p.status.invincible; p.hurtAt=-1; return 1`)
  // screenshots take seconds in software render, so remove the gaper as soon as it lands one hit
  for (let i = 0; i < 60 && await ev('return IS.state.run.player.hurtAt') < 0; i++) await page.wait(20)
  await ev(`IS.state.run.room.enemies=[]; return 1`); await shot('40-hit-a'); await page.wait(120); await shot('41-hit-b'); await log('hit')
  await ev(`IS.state.run.player.status.invincible=1e9; return 1`)
  // map and pause
  await page.key('tab'); await page.wait(250); await shot('50-map'); await page.key('tab', 'keyUp')
  await page.press('escape'); await page.wait(300); await shot('51-pause'); await page.press('escape'); await page.wait(200)
  // boss entry
  await enterVia('boss', '60-boss')
  await ev(`var r=IS.state.run; if (!r.room.enemies.some(function(e){return e.boss})) IS.spawnBoss(r.room,'monstro',r.room.pxW/2,r.room.pxH/2-40,{}); return 1`)
  await page.wait(700); await shot('61-boss-0.7s')
  await ev(`var r=IS.state.run; r.room.enemies.forEach(function(e){ if(e.boss) IS.damageEnemy(e, 99999, {}, IS.state.ctx) }); return 1`); await page.wait(900); await shot('62-boss-dead'); await log('boss-dead')
  // death
  await ev(`var r=IS.state.run,p=r.player; p.invulnUntil=0; delete p.status.invincible; p.hearts.red=1; p.hearts.soul=0; IS.damagePlayer(p, 4, {name:'test'}, IS.state.ctx); return 1`); await page.wait(1500); await shot('70-death'); await log('death')
  console.log('errors', page.console.errors.length, page.console.errors.slice(0, 3).join(' | '), page.console.exceptions.slice(0, 2).join(' | '))
} finally { await page.close() }
