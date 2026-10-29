#!/usr/bin/env node
//
// A bot plays the Basement in a real browser and the run is judged the way a
// player would judge it. smoke.mjs proves the game runs; this proves a fight
// can be won: every combat room clears, the boss dies in reasonable time, and
// nothing is logged as an error.
//
// The bot is a poor player, so it is not allowed to die: every hit still lands
// (knockback, invulnerability frames) but the hearts are given back and counted.
// The count is how hard each room hit a player who stands and trades; a normal
// room that lands more than its hit cap is a tuning failure. Caps and time
// limits grow with the number of enemies in the room. Do not weaken enemies to
// get this bot through a room: if the bot is the problem, fix the bot.
//
// Past the Basement the bot carries the stat ups a player would have found by
// then (KIT, two per chapter), so later floors are judged against a realistic
// character rather than a fresh Isaac.
//
// The simulation is stepped by hand (IS.step) so a run takes seconds, not
// minutes, and is the same every time for a given seed.
//
//   node tools/playtest.mjs                    # seeds 1..3
//   node tools/playtest.mjs --seeds 7,8,9
//   node tools/playtest.mjs --shots            # write shots/playtest-*.png
//   node tools/playtest.mjs --char cain
//   node tools/playtest.mjs --boss monstro-ii        # fight a specific boss in the boss room
//   node tools/playtest.mjs --floor caves --seeds 1   # play another floor by id (default: the Basement)

import path from 'node:path'
import { launch, ROOT } from './cdp.mjs'

const arg = (name, dflt) => {
  const i = process.argv.indexOf('--' + name)
  return i > -1 ? (process.argv[i + 1] ?? true) : dflt
}
const SEEDS = String(arg('seeds', '1,2,3')).split(',').map(Number)
const CHAR = arg('char', 'isaac')
const FLOOR = arg('floor', null)
const BOSS = arg('boss', null) // swap the boss room's boss for this id
const SHOTS = process.argv.includes('--shots')
const roomLimit = n => 20 + 8 * n // seconds of game time to clear a room of n enemies
const BOSS_LIMIT = 90
const hitCap = n => 6 + 2 * n // hits taken
const BOSS_HIT_CAP = 24

// stat ups gathered by the start of each chapter: [damage up, tears up] per chapter
const KIT = [[], ['pentagram', 'the-sad-onion'], ['growth-hormones', 'wire-coat-hanger'], ['steven', 'torn-photo']]
const kitFor = depth => KIT.slice(0, Math.ceil(depth / 2)).flat()

const fails = []
const ok = (cond, msg) => { if (!cond) fails.push(msg); return !!cond }

// Runs in the page. Aims along the axis an enemy is closest to, lines up on the
// other axis, keeps its distance, and sidesteps shots that are about to land.
const BOT = `
window.__bot = function () {
  var run = IS.state.run, p = run.player, room = run.room
  var mv = { x: 0, y: 0 }, sh = { x: 0, y: 0 }
  // everything that keeps the room shut, including a downed globin's goo
  var es = IS.roomEnemies(room)
  var cx = room.pxW / 2, cy = room.pxH / 2
  if (es.length) {
    var n = es[0], best = 1e9
    es.forEach(function (e) { var d = Math.hypot(e.x - p.x, e.y - p.y); if (d < best) { best = d; n = e } })
    var dx = n.x - p.x, dy = n.y - p.y
    // a rock in the line of fire: walk (breadth-first over the grid) to the
    // nearest cell that shares a row or column with the target and sees it
    var T = IS.TILE, clear = function (ax, ay, bx, by) {
      for (var k = 1; k < 16; k++) if (IS.solidAt(room, ax + (bx - ax) * k / 16, ay + (by - ay) * k / 16, { ignorePits: true })) return false
      return true
    }
    var pathing = !clear(p.x, p.y, n.x, n.y)
    if (pathing) {
      var start = Math.floor(p.y / T) * room.w + Math.floor(p.x / T), prev = {}, q = [start], goal = -1
      prev[start] = start
      var tc = Math.floor(n.x / T), tr = Math.floor(n.y / T)
      while (q.length && goal < 0) {
        var c = q.shift(), col = c % room.w, row = (c / room.w) | 0
        if (c !== start && (col === tc || row === tr) && Math.abs(col - tc) + Math.abs(row - tr) >= 2 && clear(col * T + T / 2, row * T + T / 2, n.x, n.y)) { goal = c; break }
        ;[[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          var nc = col + d[0], nr = row + d[1], id = nr * room.w + nc
          if (nc < 0 || nr < 0 || nc >= room.w || nr >= room.h || id in prev) return
          if (IS.solidAt(room, nc * T + T / 2, nr * T + T / 2)) return
          prev[id] = c; q.push(id)
        })
      }
      if (goal >= 0) {
        var step = goal
        while (prev[step] !== start && prev[step] !== step) step = prev[step]
        var gx = (step % room.w) * T + T / 2, gy = ((step / room.w) | 0) * T + T / 2
        var gd = Math.hypot(gx - p.x, gy - p.y) || 1
        mv.x += (gx - p.x) / gd * 3; mv.y += (gy - p.y) / gd * 3
      }
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      sh.x = Math.sign(dx)
      if (!pathing) {
        if (Math.abs(dy) > 10) mv.y = Math.sign(dy)
        if (Math.abs(dx) < 170) mv.x = -Math.sign(dx); else if (Math.abs(dx) > 340) mv.x = Math.sign(dx)
      }
    } else {
      sh.y = Math.sign(dy)
      if (!pathing) {
        if (Math.abs(dx) > 10) mv.x = Math.sign(dx)
        if (Math.abs(dy) < 170) mv.y = -Math.sign(dy); else if (Math.abs(dy) > 340) mv.y = Math.sign(dy)
      }
    }
    es.forEach(function (e) {
      var d = Math.hypot(e.x - p.x, e.y - p.y)
      if (d < 110) { mv.x += (p.x - e.x) / d * 2.2; mv.y += (p.y - e.y) / d * 2.2 }
    })
  }
  ;(room.shots || []).forEach(function (s) {
    if (s.dead || s.friendly) return
    var rx = p.x - s.x, ry = p.y - s.y, d = Math.hypot(rx, ry), v = Math.hypot(s.vx, s.vy) || 1
    if (d > 140 || (rx * s.vx + ry * s.vy) < 0) return
    var side = (s.vx * ry - s.vy * rx) > 0 ? 1 : -1
    mv.x += -s.vy / v * side * 2.5; mv.y += s.vx / v * side * 2.5
  })
  // drift off walls and out of corners
  mv.x += (cx - p.x) / room.pxW * 1.2; mv.y += (cy - p.y) / room.pxH * 1.2
  window.__mv = IS.norm(mv.x, mv.y); window.__sh = sh
}
window.__hits = 0
if (!IS.__realDamage) IS.__realDamage = IS.damagePlayer
IS.damagePlayer = function (p, n, src, ctx) {
  var before = JSON.stringify(p.hearts), hit = IS.__realDamage(p, n, src, ctx)
  // hits, not half-hearts: later chapters deal a full heart a hit
  if (hit) { window.__hits += 1; p.hearts = JSON.parse(before); p.dead = false }
  return hit
}
IS.input.move = function () { return window.__mv || { x: 0, y: 0 } }
IS.input.shoot = function () { return window.__sh || { x: 0, y: 0 } }
window.__play = function (seconds) {
  var steps = Math.round(seconds / IS.DT), run = IS.state.run
  for (var i = 0; i < steps; i++) {
    if (IS.state.screen !== 'game' || !run.room) break
    window.__bot(); IS.step(IS.DT)
    if (run.room.cleared && !run.room.enemies.some(function (e) { return !e.dead })) break
  }
}
`

const state = `return JSON.stringify((function () {
  var run = IS.state.run, p = run.player, room = run.room
  return {
    screen: IS.state.screen, cleared: !!room.cleared, time: +room.time.toFixed(1),
    hits: window.__hits,
    alive: room.enemies.filter(function (e) { return !e.dead }).map(function (e) {
      return e.id + ' ' + Math.round(e.hp) + 'hp @' + Math.round(e.x) + ',' + Math.round(e.y)
    })
  }
})())`

const page = await launch({ width: 1280, height: 720 })
try {
  await page.goto('file://' + path.join(ROOT, 'index.html'))
  await page.wait(800)
  for (const seed of SEEDS) {
    const depth = await page.evaluate(`IS.state.manual = true; IS.state.run = null; IS.startRun({ charId: ${JSON.stringify(CHAR)}, seed: ${seed} }); ${FLOOR ? `IS.startFloor(IS.state.run, ${JSON.stringify(FLOOR)}, IS.state.ctx);` : ''} ${BOT}; return IS.state.run.floor.depth || 1`)
    const kit = kitFor(depth)
    if (kit.length) await page.evaluate(`var p = IS.state.run.player; ${JSON.stringify(kit)}.forEach(function (id) { IS.giveItem(p, id, {}) }); IS.recalcStats(p); return 1`)
    const rooms = JSON.parse(await page.evaluate(`return JSON.stringify(IS.state.run.floor.rooms.map(function (r, i) {
      return r && (r.type === 'default' || r.type === 'boss') ? { i: i, type: r.type } : null
    }).filter(Boolean).sort(function (a, b) { return (a.type === 'boss') - (b.type === 'boss') }))`))
    let roomsCleared = 0, hits = 0, fights = 0
    for (const r of rooms) {
      await page.evaluate(`window.__hits = 0; IS.enterRoom(IS.state.run, ${r.i}, 'left', IS.state.ctx); ${BOSS && r.type === 'boss' ? `var R = IS.state.run.room; R.enemies = []; IS.spawnBoss(R, ${JSON.stringify(BOSS)}, R.pxW / 2, R.pxH / 2 - 40, {});` : ''} return 1`)
      const start = JSON.parse(await page.evaluate(state))
      if (!start.alive.length) continue
      fights++
      const limit = r.type === 'boss' ? BOSS_LIMIT : roomLimit(start.alive.length)
      let s = start
      for (let t = 0; t < limit; t += 5) {
        await page.evaluate(`window.__play(5); return 1`)
        s = JSON.parse(await page.evaluate(state))
        if (s.cleared || s.screen !== 'game') break
      }
      hits += s.hits
      const tag = `seed ${seed} ${r.type} room ${r.i}`
      if (SHOTS) await page.screenshot(path.join(ROOT, `shots/playtest-${seed}-${r.i}.png`))
      if (!ok(s.screen === 'game', `${tag}: left the game screen (${s.screen})`)) break
      const cleared = ok(s.cleared, `${tag}: not cleared after ${s.time}s — still alive: ${s.alive.join('; ')}`)
      if (cleared) roomsCleared++
      const cap = r.type === 'boss' ? BOSS_HIT_CAP : hitCap(start.alive.length)
      const fair = ok(s.hits <= cap, `${tag}: ${s.hits} hits from ${start.alive.map(a => a.split(' ')[0]).join(', ')}`)
      console.log(`  ${cleared && fair ? 'ok ' : 'FAIL'} ${tag.padEnd(28)} ${String(s.time).padStart(5)}s  hits ${String(s.hits).padStart(2)}  ${start.alive.map(a => a.split(' ')[0]).join(', ')}`)
    }
    console.log(`seed ${seed}: ${roomsCleared}/${fights} fights won, ${hits} hits taken`)
  }
  const errors = page.console.errors.filter(e => !/favicon/.test(e))
  ok(!errors.length, 'console errors: ' + errors.slice(0, 5).join(' | '))
} finally {
  await page.close()
}

if (fails.length) {
  console.log('\nplaytest: FAIL')
  for (const f of fails) console.log('  - ' + f)
  process.exit(1)
}
console.log('\nplaytest: PASS')
