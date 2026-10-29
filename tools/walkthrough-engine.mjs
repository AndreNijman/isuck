#!/usr/bin/env node
//
// Real-input check of the engine/game-feel items in docs/PARITY.md. Key presses go
// through tools/cdp.mjs (Input.dispatchKeyEvent) into the live game loop; the page
// state is only read, plus a few staging moves (put the player next to a door, give
// the boss a lethal hit). Every step is screenshotted: look at the pictures too.
//
//   node tools/walkthrough-engine.mjs [out-dir]     # default shots/walkthrough-engine
//
// Exits 1 if any assertion fails.

import fs from 'node:fs'
import path from 'node:path'
import { launch, ROOT } from './cdp.mjs'

const SEED = +(process.argv[3] || 7)
const OUT = process.argv[2] || path.join(ROOT, 'shots/walkthrough-engine')
fs.mkdirSync(OUT, { recursive: true })
const page = await launch({ width: 1280, height: 720 })
const shot = n => page.screenshot(path.join(OUT, n + '.png'))
const ev = s => page.evaluate(s)
const fails = []
const check = (cond, msg) => { console.log((cond ? '  ok   ' : '  FAIL ') + msg); if (!cond) fails.push(msg); return !!cond }
const WALK = { up: 'w', down: 's', left: 'a', right: 'd' }

const staged = (type) => ev(`var r=IS.state.run,f=r.floor; var idx=f.rooms.findIndex(function(x){return x&&x.type==='${type}'}); if(idx<0) return 'none'; var nb=f.rooms.findIndex(function(x){return x&&x.doors&&x.doors.some(function(d){return d.target===idx&&!d.hidden})}); if(nb<0) return 'none'; IS.enterRoom(r, nb, null, IS.state.ctx); IS.state.transition=null; r.bossIntro=null; var cur=r.room; cur.enemies=[]; cur.cleared=true; IS.openDoors&&IS.openDoors(cur, IS.state.ctx); var d=cur.doors.find(function(d){return d.target===idx&&!d.hidden}); d.open=true; d.locked=false; r.player.x=d.insideX; r.player.y=d.insideY; r.player.invulnUntil=0; return d.dir`)
const poll = async (expr, ms, every = 40) => { const out = []; const t0 = Date.now(); while (Date.now() - t0 < ms) { out.push(JSON.parse(await ev(`return JSON.stringify(${expr})`))); await page.wait(every) } return out }

try {
  await page.goto('file://' + path.join(ROOT, 'index.html')); await page.wait(1000)
  // title -> save slot -> main menu -> character carousel -> run
  for (const w of [500, 500, 600, 1200]) { await page.press('enter'); await page.wait(w) }
  // the menus were driven with real keys; pin the seed so the floor layout is the same every run
  await ev(`IS.startRun({ charId: IS.state.run.charId, seed: ${SEED} }); return 1`); await page.wait(500)
  check(await ev('return IS.state.screen') === 'game', 'run started through the menus with real keys')
  const streak0 = JSON.parse(await ev('return JSON.stringify(IS.state.run.streak)'))
  console.log('floor streak on start:', JSON.stringify(streak0))
  check(streak0 && /basement/i.test(streak0.title), 'floor-name streak set on entering the floor: ' + (streak0 && streak0.title))
  await shot('00-start'); await page.wait(2600)

  // ---- tear physics -------------------------------------------------------------
  await ev(`window.__land=[]; window.__eyes=[]; var up=IS.updateProjectiles; IS.updateProjectiles=function(room,dt,ctx){var b=(room.tears||[]).slice(); var r=up.apply(this,arguments); b.forEach(function(t){ if(t.dead) window.__land.push({z:t.z,vx:t.vx,vy:t.vy,life:t.life}) }); return r}; var fp=IS.firePlayerTears; IS.firePlayerTears=function(p,d,ctx){var r=fp.apply(this,arguments); var ts=ctx.room.tears; var t=ts[ts.length-1]; if(t) window.__eyes.push(Math.sign(Math.round(t.x-p.x+t.y-p.y))); return r}; return 1`)
  await ev('var p=IS.state.run.player; p.x=IS.state.run.room.pxW*.12; p.y=IS.state.run.room.pxH*.75; return 1')
  await page.key('w'); await page.key('right'); await page.wait(450); await shot('10-tears-moving'); await page.wait(250); await page.key('w', 'keyUp'); await page.wait(1100); await page.key('right', 'keyUp')
  const land = JSON.parse(await ev('return JSON.stringify(window.__land)')), eyes = JSON.parse(await ev('return JSON.stringify(window.__eyes)'))
  check(land.length > 3, `tears reached range end (${land.length} landed)`)
  const ended = land.filter(t => t.life <= 0)
  check(ended.length > 3 && ended.every(t => t.z === 0), `tear.z is 0 at range end (${ended.length} tears: ${ended.slice(0, 3).map(t => t.z).join(',')})`)
  check(land.some(t => Math.abs(t.vx) > 200 && Math.abs(t.vy) > 20), 'shot fired while walking perpendicular has a sideways velocity (vy=' + (land[0] && land[0].vy.toFixed(0)) + ')')
  check(eyes.includes(1) && eyes.includes(-1), 'shots alternate between left and right eye: ' + eyes.slice(0, 6).join(','))

  // page-side recorder, run inside the game screen's update so it sees every simulation step
  await ev(`window.__rec={maxHold:0,introEnd:null,introPos:{},tr100:null,trStart:null,pin:false,pinTr:null,dmg:[]}
    var gs=IS.screens.game,u=gs.update,od=IS.damagePlayer
    IS.damagePlayer=function(p,n,s,c){var r=od.apply(this,arguments); if(r) window.__rec.dmg.push({t:IS.state.run.time,src:s&&(s.id||s.name),hp:p.hearts.red,d:s&&s.x!=null?Math.hypot(p.x-s.x,p.y-s.y):0}); return r}
    gs.update=function(dt){var run=IS.state.run,R=window.__rec,had=!!run.bossIntro,hp=run.player.holdItem; if(hp) R.maxHold=Math.max(R.maxHold,hp.t)
      var r=u.apply(this,arguments); var tr=IS.state.transition
      if(tr){ if(R.trStart==null) R.trStart=IS.state.time; if(!R.tr100&&IS.state.time-R.trStart>=.1) R.tr100=JSON.parse(JSON.stringify(tr)); if(R.pinTr!=null) tr.t=R.pinTr } else R.trStart=null
      if(run.bossIntro){ var bp=JSON.stringify(run.room.enemies.filter(function(e){return e.boss}).map(function(e){return [Math.round(e.x),Math.round(e.y)]})); R.introPos[bp]=1; if(R.pin) run.bossIntro.t=Math.min(run.bossIntro.t,.6) }
      if(had&&!run.bossIntro) R.introEnd=run.time
      if(R.pin){ var h=run.player.holdItem; if(h) h.t=Math.min(h.t,.4); if(run.streak) run.streak.t=Math.min(run.streak.t,.9) }
      return r}
    return 1`)
  const rec = () => ev('return JSON.stringify(window.__rec)').then(JSON.parse)

  // ---- door slide ---------------------------------------------------------------
  let dir = await staged('treasure'); check(dir !== 'none', 'staged a door to the treasure room (' + dir + ')')
  const before = await ev('return IS.state.run.room.index')
  await page.key(WALK[dir]); for (let i = 0; i < 200 && !await ev('return !!window.__rec.tr100'); i++) await page.wait(10)
  await page.key(WALK[dir], 'keyUp')
  const tr = (await rec()).tr100; console.log('transition 100 ms (simulation time) after the door:', JSON.stringify(tr))
  check(tr && tr.t > 0.1 && tr.t < 0.9 && tr.dir === dir && tr.from === before && tr.to !== before, 'transition is mid-slide 100 ms after crossing the door')
  await page.wait(500)
  check(await ev('return IS.state.transition') === null, 'transition clears after the slide')
  check(await ev('return IS.state.run.room.type') === 'treasure', 'arrived in the treasure room')
  await shot('21-arrived')

  // ---- pedestal pickup ------------------------------------------------------------
  await ev(`IS.state.run.player.invulnUntil=0; IS.state.run.streak=null; IS.state.run.streakQueue=[]; return 1`)
  const ped = await ev(`var r=IS.state.run,pu=(r.room.pickups||[]).find(function(x){return x.kind==='item'&&!x.dead}); if(!pu) return 'none'; r.player.x=pu.x; r.player.y=pu.y+70; return pu.id`)
  check(ped !== 'none', 'treasure room has a pedestal: ' + ped)
  await page.key('w'); for (let i = 0; i < 100 && !await ev('return !!IS.state.run.player.holdItem'); i++) await page.wait(10)
  await page.key('w', 'keyUp')
  const pk = JSON.parse(await ev('return JSON.stringify({h:IS.state.run.player.holdItem,s:IS.state.run.streak})'))
  check(pk.h && pk.h.id === ped, 'p.holdItem set after the pedestal pickup: ' + JSON.stringify(pk.h))
  check(pk.s && pk.s.title && pk.s.sub && pk.s.dur > 1, 'run.streak holds the item name and description: ' + JSON.stringify(pk.s))
  await ev('window.__rec.pin=true; return 1'); await page.wait(200); await shot('30-pickup-pose'); await ev('window.__rec.pin=false; return 1')
  await page.wait(1600)
  const r2 = await rec(); check(r2.maxHold > 0.85 && r2.maxHold <= 1.1, `pose lasts about 1 s (holdItem.t reached ${r2.maxHold.toFixed(2)})`)
  check(await ev('return IS.state.run.player.holdItem') === null, 'pose ends')
  check(await ev('return IS.state.run.player.items.indexOf(' + JSON.stringify(ped) + ')') >= 0, 'item was taken')

  // ---- i-frames and knockback -----------------------------------------------------
  await ev(`var r=IS.state.run,p=r.player; r.room.enemies=[]; window.__rec.dmg=[]; p.hearts.red=p.hearts.maxRed; p.x=r.room.pxW/2; p.y=r.room.pxH/2+100; p.invulnUntil=0; var e=IS.spawnEnemy(r.room,'gaper',p.x+50,p.y,{}); e.spawnT=0; window.__gap=e; return 1`)
  const track = await poll('{d:Math.hypot(IS.state.run.player.x-window.__gap.x,IS.state.run.player.y-window.__gap.y),inv:IS.state.run.time<IS.state.run.player.invulnUntil}', 3000, 30)
  const dmg = (await rec()).dmg; await shot('40-iframes'); const INV = await ev('return IS.INVULN_TIME')
  const gaps = dmg.slice(1).map((h, i) => h.t - dmg[i].t)
  check(dmg.length >= 2, `the gaper hit the player ${dmg.length} time(s) in 3 s`)
  check(gaps.every(g => g >= INV - 0.02), `hits are at least INVULN_TIME (${INV}s) apart: ${gaps.map(g => g.toFixed(2)).join(', ') || 'n/a'}`)
  check(track.some(s => s.inv), 'the player is flagged invulnerable after a hit (renderer blinks on invulnUntil)')
  const maxD = Math.max(...track.map(s => s.d)); check(maxD > 65, 'knockback separates player and enemy (max distance ' + maxD.toFixed(0) + ')')
  await ev(`IS.state.run.room.enemies=[]; return 1`)

  // ---- boss room entry, intro card, death on entry --------------------------------
  dir = await staged('boss'); check(dir !== 'none', 'staged a door to the boss room (' + dir + ')')
  await ev(`var p=IS.state.run.player; p.hearts.red=3; p.hearts.soul=0; p.hearts.black=0; window.__rec.dmg=[]; window.__rec.pinTr=.5; return 1`)
  await page.key(WALK[dir]); for (let i = 0; i < 200 && !await ev('return !!IS.state.transition'); i++) await page.wait(10)
  await page.key(WALK[dir], 'keyUp'); await page.wait(150); await shot('49-boss-door-slide-pinned'); await ev('window.__rec.pinTr=null; return 1')
  for (let i = 0; i < 100 && !await ev('return !!IS.state.run.bossIntro'); i++) await page.wait(20)
  const intro = JSON.parse(await ev('return JSON.stringify(IS.state.run.bossIntro)'))
  check(intro && intro.name && intro.bossId && intro.dur > 1.2, 'run.bossIntro is set on boss-room entry: ' + JSON.stringify(intro))
  await ev('window.__rec.pin=true; return 1'); await page.wait(200); await shot('50-boss-intro'); await ev('window.__rec.pin=false; return 1')
  for (let i = 0; i < 100 && !await ev('return IS.state.run.bossIntro===null'); i++) await page.wait(30)
  check(await ev('return IS.state.run.bossIntro') === null, 'run.bossIntro cleared after the card')
  const R3 = await rec(); check(Object.keys(R3.introPos).length === 1, 'boss does not move while the card is up')
  // stand still for the 1.5 s after the card ends, in game time
  for (let i = 0; i < 200 && await ev('return IS.state.run.time') < R3.introEnd + 1.6; i++) await page.wait(30)
  const R4 = await rec(), early = R4.dmg.filter(d => d.t >= R4.introEnd && d.t < R4.introEnd + 1.5)
  check(R4.introEnd != null && early.length === 0, `no damage in the first 1.5 s after the card ends, standing still at the door (${R4.dmg.length} hits later, ${early.length} early)`)
  await ev('var r=IS.state.run; r.player.invulnUntil=r.time+99; return 1') // the screenshots below are slow; keep the fight survivable
  await shot('51-boss-after-card')
  await page.wait(1200); await shot('52-boss-fight')


  // ---- boss death, pedestal, trapdoor, descent -------------------------------------
  await ev(`var r=IS.state.run,p=r.player; p.invulnUntil=r.time+99; r.room.enemies.forEach(function(e){ if(e.boss) IS.damageEnemy(e, 99999, {}, IS.state.ctx) }); return 1`)
  await page.wait(1500); await shot('60-boss-dead')
  console.log('room after boss kill:', await ev(`var r=IS.state.run; return JSON.stringify({screen:IS.state.screen,paused:IS.state.paused,time:r.time,hp:r.player.hearts.red,dead:r.player.dead,cleared:r.room.cleared,en:r.room.enemies.map(function(e){return e.id+':'+e.hp+(e.dead?'x':'')}),pk:r.room.pickups.map(function(x){return x.kind+(x.dead?'x':'')}),tr:r.room.trapdoor,type:r.room.type})`))
  const after = JSON.parse(await ev(`var r=IS.state.run; return JSON.stringify({cleared:r.room.cleared, trap:r.room.trapdoor&&{x:r.room.trapdoor.x,y:r.room.trapdoor.y,open:r.room.trapdoor.open}, ped:(r.room.pickups||[]).filter(function(x){return x.kind==='item'&&!x.dead}).length, floor:r.floor.id, idx:r.floorIndex||0})`))
  check(after.cleared && after.ped >= 1, 'boss death drops the reward pedestal (' + after.ped + ')')
  check(after.trap && after.trap.open, 'boss death opens the trapdoor ' + JSON.stringify(after.trap))
  await ev(`var r=IS.state.run,t=r.room.trapdoor; r.player.x=t.x-130; r.player.y=t.y; r.player.vx=r.player.vy=0; return 1`)
  await page.key('d')
  for (let i = 0; i < 100 && await ev('return IS.state.run.floor.id') === after.floor; i++) await page.wait(20)
  await page.key('d', 'keyUp')
  const next = JSON.parse(await ev('return JSON.stringify({floor:IS.state.run.floor.id,streak:IS.state.run.streak,room:IS.state.run.room.type})'))
  check(next.floor !== after.floor, `walking onto the trapdoor reaches the next floor (${after.floor} -> ${next.floor})`)
  check(next.streak && next.streak.title.length > 0, 'floor-name streak on the new floor: ' + JSON.stringify(next.streak))
  await ev('window.__rec.pin=true; return 1'); await page.wait(100)
  await shot('62-next-floor')
  const errs = page.console.errors.filter(e => !/favicon/.test(e)); check(errs.length === 0 && page.console.exceptions.length === 0, 'no console errors ' + errs.slice(0, 2).join(' | '))
} finally { await page.close() }
if (fails.length) { console.log('\nwalkthrough-engine: FAIL'); fails.forEach(f => console.log('  - ' + f)); process.exit(1) }
console.log('\nwalkthrough-engine: PASS')
