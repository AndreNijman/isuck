#!/usr/bin/env node
//
// Regression test for js/engine/enemy.js, no browser needed:
//   - every regular enemy has a per-id behaviour (none falls back to its archetype)
//   - every enemy runs 20 seconds against a moving player without throwing or
//     producing NaN, then dies (death rattle, champion effects) without throwing
//   - champions: rollChampion picks from the champion table, applies hp, speed and
//     colour, and the drop comes from the table
//   - spawn grace: enemies present on room entry are awake at once, the player gets
//     brief invulnerability, enemies spawned mid-fight play a short appear
//
//   node tools/enemy-ai.mjs [enemy-id]

import { loadGame } from './loader.mjs'

const g = loadGame()
const IS = g.IS || g
let failed = 0
const bad = (m) => { failed++; console.log('  FAIL', m) }
const ok = (c, m) => { if (!c) bad(m); return c }

const mkRun = () => {
  const run = { seed: 12345, seedStr: 'TEST TEST', rng: new IS.RNG(12345), floorRng: new IS.RNG(222), poolRng: new IS.RNG(333), charId: 'isaac', floorIndex: 0, pools: {}, curses: 0, stats: {}, flags: {}, time: 0, floorTime: 0, itemsTaken: [], bossesKilled: [], log: [], devilDealsTaken: 0, donation: 0 }
  run.player = IS.makePlayer('isaac', run)
  IS.recalcStats(run.player)
  return run
}
const run = mkRun()
const ctx = IS.headlessCtx(run)
const freshRoom = () => {
  const room = IS.makeRoom(IS.rooms[0], IS.floors[0], run, { type: 'default' })
  run.room = room; ctx.room = room
  if (IS.refreshCtx) IS.refreshCtx(ctx, room, 1 / 60)
  room.enemies.length = 0; room.shots.length = 0
  return room
}
const tick = (room, i) => {
  const p = run.player
  run.time += 1 / 60; ctx.dt = 1 / 60
  p.x = 300 + Math.sin(i / 70) * 200; p.y = 300 + Math.cos(i / 90) * 120
  IS.updateEnemies(room, 1 / 60, ctx)
  room.shots.length = 0
}

console.log('enemy behaviour table')
const only = process.argv[2]
const BEH = IS.enemyBehaviours || {}
const ids = IS.enemies.filter(d => !d.boss).map(d => d.id)
const missing = ids.filter(id => !BEH[id])
ok(!missing.length, `${missing.length} enemies fall back to an archetype: ${missing.join(' ')}`)

console.log('every enemy runs, then dies')
for (const d of IS.enemies) {
  if (d.boss || (only && d.id !== only)) continue
  try {
    const room = freshRoom()
    const p = run.player
    p.hearts.red = 99; p.invulnUntil = 1e9
    const e = IS.spawnEnemy(room, d.id, 640, 300, {})
    if (!e) { bad(`${d.id} did not spawn`); continue }
    for (let i = 0; i < 1200 && room.enemies.includes(e); i++) {
      tick(room, i)
      if (!isFinite(e.x) || !isFinite(e.y) || !isFinite(e.vx) || !isFinite(e.vy)) { bad(`${d.id} went NaN`); break }
    }
    if (room.enemies.includes(e)) {
      IS.rollChampion(e, new IS.RNG(11))
      IS.killEnemy(e, ctx)
      for (let i = 0; i < 30; i++) tick(room, i)
    }
  } catch (err) { bad(`${d.id} threw: ${err.message}`) }
}

console.log('champions')
{
  const room = freshRoom()
  const seen = new Set()
  for (let s = 1; s <= 200; s++) {
    const e = IS.makeEntity(IS.enemiesById.gaper, 400, 300, {})
    const hp = e.hp, sp = e.speed
    const k = IS.rollChampion(e, new IS.RNG(s))
    if (!ok(k && IS.CHAMPIONS[k], `rollChampion(seed ${s}) returned ${k}`)) break
    const t = IS.CHAMPIONS[k]
    ok(e.champion === k && e.tint === t.tint, `champion ${k} did not take its colour`)
    ok(Math.abs(e.hp - hp * (t.hp || 1)) < 1e-6 && e.maxHp === e.hp, `champion ${k} hp not scaled`)
    ok(Math.abs(e.speed - sp * (t.speed || 1)) < 1e-6, `champion ${k} speed not scaled`)
    ok(IS.rollChampion(e, new IS.RNG(s)) === null, 'a champion rolled twice')
    seen.add(k)
  }
  ok(seen.size === IS.CHAMPION_LIST.length, `only ${seen.size} of ${IS.CHAMPION_LIST.length} champion colours rolled`)
  const dropped = []
  const realPickup = ctx.spawnPickup
  ctx.spawnPickup = (kind) => { dropped.push(kind) }
  const e = IS.makeEntity(IS.enemiesById.gaper, 400, 300, {}); e.room = room; IS.rollChampion(e, { pick: () => 'red', chance: () => true })
  IS.enemyDrops(e, ctx)
  const plain = IS.makeEntity(IS.enemiesById.gaper, 400, 300, {}); plain.room = room; IS.enemyDrops(plain, ctx)
  ctx.spawnPickup = realPickup
  ok(dropped.length === 1 && dropped[0] === IS.CHAMPIONS.red.drop, `red champion drop was ${dropped}`)
}

console.log('spawn grace')
{
  const room = freshRoom()
  const p = run.player
  p.invulnUntil = 0
  const early = IS.spawnEnemy(room, 'gaper', 600, 300, {})
  ok(early.spawnT === 0, `an enemy placed on room entry is not awake at once (spawnT ${early.spawnT})`)
  tick(room, 0)
  ok(p.invulnUntil > run.time, 'entering a room gave the player no invulnerability')
  const late = IS.spawnEnemy(room, 'gaper', 600, 300, {})
  ok(late.spawnT > 0 && late.spawnT <= .5, `an enemy spawned mid-fight did not appear (spawnT ${late.spawnT})`)
}

console.log(failed ? `enemy-ai: FAIL (${failed})` : 'enemy-ai: PASS')
process.exit(failed ? 1 : 0)
