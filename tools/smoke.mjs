#!/usr/bin/env node
//
// Headless play-through in a real browser. validate-content.mjs proves the
// content is well-formed; this proves the game actually runs: boots clean, takes
// input, fires tears, clears rooms, generates floors, survives a descent, and
// never logs an error while doing it.
//
//   node tools/smoke.mjs                 # full run
//   node tools/smoke.mjs --floors 5      # descend further
//   node tools/smoke.mjs --shots         # also write shots/*.png
//   node tools/smoke.mjs --keep-going    # report every failure instead of bailing

import path from 'node:path'
import { launch, ROOT } from './cdp.mjs'

const arg = (name, dflt) => {
  const i = process.argv.indexOf('--' + name)
  return i > -1 ? (process.argv[i + 1] ?? true) : dflt
}
const FLOORS = Number(arg('floors', 3))
const SHOTS = process.argv.includes('--shots')

const fails = []
const passes = []
const ok = (cond, msg, detail) => {
  if (cond) passes.push(msg)
  else fails.push(detail ? `${msg} — ${detail}` : msg)
  return !!cond
}

const page = await launch()

try {
  // ------------------------------------------------------------------ 1. boot
  await page.goto('file://' + path.join(ROOT, 'index.html'))
  await page.wait(900)

  ok(await page.evaluate('typeof window.IS') === 'object', 'IS global exists')

  const missingFiles = page.console.errors.filter(e => /ERR_FILE_NOT_FOUND/.test(e)).length
  ok(missingFiles === 0, 'every script in index.html loaded', `${missingFiles} file(s) 404ed`)

  const defineErrors = await page.evaluate('(window.IS && IS.defineErrors) ? IS.defineErrors.slice(0,8) : ["no IS"]')
  ok(!defineErrors.length, 'no registry define errors', JSON.stringify(defineErrors))

  const counts = await page.evaluate(`JSON.stringify({
    items: IS.items.length, trinkets: IS.trinkets.length, cards: IS.cards.length,
    pills: IS.pills.length, chars: IS.characters.length, enemies: IS.enemies.length,
    bosses: IS.bosses.length, rooms: IS.rooms.length, floors: IS.floors.length,
    sprites: Object.keys(IS.sprites).length, archetypes: Object.keys(IS.archetypes).length,
    attacks: Object.keys(IS.attacks).length, screens: Object.keys(IS.screens).length
  })`)
  const c = JSON.parse(counts)
  console.log('registries:', counts)
  ok(c.items > 600, 'item registry is populated', `${c.items} items`)
  ok(c.chars >= 30, 'character registry is populated', `${c.chars} characters`)
  ok(c.enemies > 100, 'enemy registry is populated', `${c.enemies} enemies`)
  ok(c.bosses > 50, 'boss registry is populated', `${c.bosses} bosses`)
  ok(c.rooms > 100, 'room templates are populated', `${c.rooms} rooms`)
  ok(c.floors > 20, 'floor registry is populated', `${c.floors} floors`)
  ok(c.archetypes === 36, 'every enemy archetype is registered', `${c.archetypes}/36`)
  ok(c.attacks === 45, 'every boss attack is registered', `${c.attacks}/45`)

  const bootErrors = page.console.errors.filter(e => !/ERR_FILE_NOT_FOUND/.test(e))
  ok(bootErrors.length === 0, 'no console errors during boot', bootErrors.slice(0, 4).join(' | '))
  ok(page.console.exceptions.length === 0, 'no uncaught exceptions during boot', page.console.exceptions.slice(0, 3).join(' | '))

  // frames are actually being produced
  const f1 = await page.evaluate('IS.state.frame|0')
  await page.wait(600)
  const f2 = await page.evaluate('IS.state.frame|0')
  ok(f2 > f1, 'the main loop is running', `frame ${f1} -> ${f2}`)

  if (SHOTS) await page.screenshot(path.join(ROOT, 'shots/1-title.png'))

  // ------------------------------------------------------------- 2. start a run
  const started = await page.evaluate(`
    try { IS.startRun({ charId: 'isaac', seed: 20260806 }); return IS.state.run ? 'ok' : 'no run' }
    catch (e) { return 'threw: ' + e.message }
  `)
  ok(started === 'ok', 'IS.startRun starts a run', started)

  await page.wait(500)
  const runInfo = await page.evaluate(`JSON.stringify({
    screen: IS.state.screen,
    hasPlayer: !!(IS.state.run && IS.state.run.player),
    hasFloor: !!(IS.state.run && IS.state.run.floor),
    hasRoom: !!(IS.state.run && IS.state.run.room),
    hasCtx: !!IS.state.ctx,
    roomCount: IS.state.run && IS.state.run.floor ? IS.state.run.floor.rooms.length : 0,
    hp: IS.state.run && IS.state.run.player ? IS.state.run.player.hearts.red : -1,
    dmg: IS.state.run && IS.state.run.player ? Math.round(IS.state.run.player.stats.damage*100)/100 : -1
  })`)
  const r = JSON.parse(runInfo)
  console.log('run:', runInfo)
  ok(r.screen === 'game', 'the game screen is active', r.screen)
  ok(r.hasPlayer && r.hasFloor && r.hasRoom, 'run has a player, a floor and a room')
  ok(r.hasCtx, 'IS.state.ctx exposes the live ctx (the harness needs it)')
  ok(r.roomCount >= 6, 'floor generated a sensible number of rooms', String(r.roomCount))
  ok(r.dmg > 0, 'player stats were computed', `damage ${r.dmg}`)

  await page.call('Emulation.setDeviceMetricsOverride', { width: 1900, height: 1060, deviceScaleFactor: 1, mobile: false })
  await page.wait(180)
  const canvasFit = JSON.parse(await page.evaluate(`return JSON.stringify((function () {
    const canvas = document.getElementById('game'), r = canvas.getBoundingClientRect()
    return { cssW:r.width, cssH:r.height, backingW:canvas.width, backingH:canvas.height,
      dpr:devicePixelRatio, scale:IS.camera.scale }
  })())`))
  ok(Math.abs(canvasFit.backingW - canvasFit.cssW * canvasFit.dpr) <= 1 &&
    Math.abs(canvasFit.backingH - canvasFit.cssH * canvasFit.dpr) <= 1,
  'the canvas backing buffer matches its large CSS viewport', JSON.stringify(canvasFit))

  const graphInfo = JSON.parse(await page.evaluate(`return JSON.stringify((function () {
    const floor = IS.state.run.floor, seen = new Set([floor.startIndex]), todo = [floor.startIndex]
    let reciprocal = true, dangling = false
    while (todo.length) {
      const i = todo.shift(), room = floor.rooms[i]
      for (const d of room.doors) {
        const other = floor.rooms[d.target]
        if (!other) { dangling = true; continue }
        if (!other.doors.some(x => x.target === i && x.dir === IS.DIR_OPPOSITE[d.dir])) reciprocal = false
        if (!seen.has(d.target)) { seen.add(d.target); todo.push(d.target) }
      }
    }
    return { reached: seen.size, total: floor.rooms.length, reciprocal, dangling, startDoors: floor.rooms[floor.startIndex].doors.length }
  })())`))
  ok(graphInfo.startDoors > 0, 'the starting room has an exit', JSON.stringify(graphInfo))
  ok(graphInfo.reached === graphInfo.total && graphInfo.reciprocal && !graphInfo.dangling,
    'the generated floor is connected by reciprocal doors', JSON.stringify(graphInfo))
  // Big rooms scroll like Isaac's: the camera keeps a readable zoom and follows
  // the player, so the check is that wherever the player stands in any room, at
  // any door, the player is on screen.
  const cameraFollows = await page.evaluate(`
    const run = IS.state.run, saved = { x: run.player.x, y: run.player.y }
    const VW = IS.VIEW_W, VH = IS.VIEW_H
    const ok = run.floor.rooms.every(room => {
      const spots = room.doors.map(d => ({ x: d.x, y: d.y })).concat([{ x: 0, y: 0 }, { x: room.pxW, y: room.pxH }, { x: room.pxW / 2, y: room.pxH / 2 }])
      return spots.every(s => {
        run.player.x = s.x; run.player.y = s.y
        IS.camera.roomIndex = -99
        IS.updateCamera(room, run.player, 1/60)
        const p = IS.worldToScreen(s.x, s.y)
        return IS.camera.zoom >= 0.8 && p.x >= -1 && p.y >= -1 && p.x <= VW + 1 && p.y <= VH + 1
      })
    })
    run.player.x = saved.x; run.player.y = saved.y; IS.camera.roomIndex = -99
    return ok
  `)
  ok(cameraFollows, 'the camera keeps the player and every door on screen in every room')

  // ------------------------------------------------------- 3. input and combat
  const before = await page.evaluate('JSON.stringify({x: IS.state.run.player.x, y: IS.state.run.player.y})')
  await page.hold(['d'], 420)
  await page.wait(120)
  const after = await page.evaluate('JSON.stringify({x: IS.state.run.player.x, y: IS.state.run.player.y})')
  const b = JSON.parse(before); const a = JSON.parse(after)
  ok(Math.abs(a.x - b.x) > 8, 'holding a movement key moves the player', `${b.x.toFixed(1)} -> ${a.x.toFixed(1)}`)

  await page.hold(['right'], 400)
  const firedEver = await page.evaluate('IS.state.run.stats && IS.state.run.stats.tearsFired ? IS.state.run.stats.tearsFired : (IS.state.run.room.tears.length)')
  ok(Number(firedEver) > 0, 'holding a shoot key fires tears', `saw ${firedEver}`)

  // Traverse a real door with normal movement input. Previous versions called
  // enterRoom() directly here and therefore missed a shipped floor with no
  // doors at all, plus an interaction radius the player could not reach.
  const doorWalk = JSON.parse(await page.evaluate(`return JSON.stringify((function () {
    const run = IS.state.run, room = run.room, p = run.player
    const d = room.doors.find(x => x.open && x.target != null)
    if (!d) return { error: 'no open door', from: room.index }
    const gap = 34
    if (d.dir === 'right') { p.x = room.pxW - p.r - gap; p.y = d.y }
    if (d.dir === 'left') { p.x = p.r + gap; p.y = d.y }
    if (d.dir === 'down') { p.x = d.x; p.y = room.pxH - p.r - gap }
    if (d.dir === 'up') { p.x = d.x; p.y = p.r + gap }
    return { from: room.index, target: d.target, dir: d.dir }
  })())`))
  if (!doorWalk.error) {
    const moveKey = { right: 'd', left: 'a', up: 'w', down: 's' }[doorWalk.dir]
    await page.hold([moveKey], 700)
    await page.wait(100)
  }
  const afterDoor = await page.evaluate('IS.state.run.room.index')
  ok(!doorWalk.error && afterDoor === doorWalk.target, 'movement through a door enters the connected room', JSON.stringify({ doorWalk, afterDoor }))

  // ------------------------------------------------- 4. descend several floors
  let reached = 0
  let descendError = null
  for (let depth = 0; depth < FLOORS; depth++) {
    const res = await page.evaluate(`
      try {
        const run = IS.state.run, ctx = IS.state.ctx
        if (!run || !run.floor) return 'no run'
        // walk every room on the floor, clearing as we go
        for (let i = 0; i < run.floor.rooms.length; i++) {
          IS.enterRoom(run, i, 'left', ctx)
          const room = run.room
          for (let g = 0; g < 400 && IS.roomEnemies(room).length; g++) {
            for (const e of IS.roomEnemies(room).slice()) IS.damageEnemy(e, 9999, {}, ctx)
            IS.updateRoom(room, 1/60, ctx)
          }
          for (let t = 0; t < 30; t++) IS.updateRoom(room, 1/60, ctx)
        }
        return 'walked'
      } catch (e) { return 'threw: ' + (e && e.message) }
    `)
    if (String(res).startsWith('threw') || res === 'no run') { descendError = res; break }

    const next = await page.evaluate(`
      try {
        const run = IS.state.run, ctx = IS.state.ctx
        const ids = IS.nextFloorIds(run)
        const target = ids && (ids.normal || ids.alt)
        if (!target) return 'no next floor'
        IS.startFloor(run, target, ctx)
        return 'floor:' + run.floor.id
      } catch (e) { return 'threw: ' + (e && e.message) }
    `)
    if (String(next).startsWith('floor:')) reached++
    else { descendError = next; break }
    await page.wait(150)
  }
  ok(reached >= FLOORS, `descended ${FLOORS} floors`, `reached ${reached}${descendError ? ' — ' + descendError : ''}`)

  if (SHOTS) await page.screenshot(path.join(ROOT, 'shots/2-play.png'))

  // --------------------------------------------------- 5. give every item once
  const itemSweep = await page.evaluate(`
    try {
      const run = IS.state.run, ctx = IS.state.ctx
      const bad = []
      for (const it of IS.items) {
        try {
          const p = IS.makePlayer('isaac', run)
          run.player = p
          IS.giveItem(p, it.id, { noAnim: true })
          IS.recalcStats(p)
          IS.updatePlayer(p, 1/60, ctx)
          if (!isFinite(p.stats.damage) || !isFinite(p.stats.tears) || !isFinite(p.stats.speed)) {
            bad.push(it.id + ':nan-stats')
          }
        } catch (e) { bad.push(it.id + ':' + (e && e.message)) }
        if (bad.length > 12) break
      }
      return JSON.stringify(bad)
    } catch (e) { return JSON.stringify(['sweep threw: ' + e.message]) }
  `)
  const badItems = JSON.parse(itemSweep)
  ok(badItems.length === 0, 'every item can be granted without throwing or producing NaN stats', badItems.join(' | '))

  // ------------------------------------------------- 6. bosses actually fight
  const bossSweep = await page.evaluate(`
    try {
      const run = IS.state.run, ctx = IS.state.ctx
      const bad = []
      for (const b of IS.bosses) {
        try {
          const room = IS.makeRoom(IS.rooms[0], run.floor.def, run, { type: 'boss' })
          run.room = room; ctx.room = room
          const e = IS.spawnBoss(room, b.id, room.pxW/2, room.pxH/2, {})
          if (!e) { bad.push(b.id + ':no-spawn'); continue }
          for (let i = 0; i < 240; i++) IS.updateRoom(room, 1/60, ctx)
        } catch (err) { bad.push(b.id + ':' + (err && err.message)) }
        if (bad.length > 10) break
      }
      return JSON.stringify(bad)
    } catch (e) { return JSON.stringify(['boss sweep threw: ' + e.message]) }
  `)
  const badBosses = JSON.parse(bossSweep)
  ok(badBosses.length === 0, 'every boss spawns and runs 4 seconds of its own attacks', badBosses.join(' | '))

  // ------------------------------------------------------------ 7. clean logs
  const runtimeErrors = page.console.errors.filter(e => !/ERR_FILE_NOT_FOUND/.test(e))
  ok(runtimeErrors.length === 0, 'no console errors across the whole session', runtimeErrors.slice(0, 5).join(' | '))
  ok(page.console.exceptions.length === 0, 'no uncaught exceptions across the whole session', page.console.exceptions.slice(0, 3).join(' | '))

  const warnCount = page.console.warnings.length
  if (warnCount) console.log(`note: ${warnCount} console.warn (first: ${page.console.warnings[0]})`)

  if (SHOTS) {
    await page.evaluate(`IS.go('collection')`).catch(() => {})
    await page.wait(400)
    await page.screenshot(path.join(ROOT, 'shots/3-collection.png'))
  }
} catch (e) {
  fails.push('harness threw: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e))
} finally {
  await page.close()
}

console.log('\nsmoke: ' + passes.length + ' passed, ' + fails.length + ' failed')
for (const p of passes) console.log('  ok   ' + p)
for (const f of fails) console.log('  FAIL ' + f)
process.exit(fails.length ? 1 : 0)
