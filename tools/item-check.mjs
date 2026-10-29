#!/usr/bin/env node
//
// Behavioural check for the items that used to do nothing. validate-content.mjs
// proves every item has *some* effect declared; this gives each one to a fresh
// player, drives the engine entry point that should trigger it (take damage,
// clear a room, enter a floor, use an active ...) and asserts an observable change.
//
//   node tools/item-check.mjs              # every check
//   node tools/item-check.mjs the-wafer    # one item
//
// The checks live in tools/item-checks/*.mjs. Each exports a default function
// (h) => ({ 'item-id': () => { ...assertions via h.eq / h.ok... } }). The
// harness `h` builds a fresh run, player, ctx and room per item.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { loadGame } from './loader.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const game = loadGame()
const IS = game.IS
if (game.failures.length) { console.error('load failures', game.failures); process.exit(1) }

export const failures = []
let passed = 0

// --- harness -----------------------------------------------------------------

export function fresh (opts = {}) {
  const run = {
    seed: 4242, seedStr: 'TEST TEST', rng: new IS.RNG(4242), floorRng: new IS.RNG(222), poolRng: new IS.RNG(333),
    charId: opts.char || 'isaac', floorIndex: 0, pools: {}, curses: 0, stats: {}, flags: {},
    time: 100, floorTime: 0, itemsTaken: [], bossesKilled: [], log: [], devilDealsTaken: 0, donation: 0
  }
  const p = IS.makePlayer(run.charId, run)
  // checks start empty-handed: Isaac's D6 would drop as a pedestal when a test hands him an active
  if (!opts.keepKit) { p.active = [null, null]; p.pocket = [] }
  run.player = p
  const ctx = IS.headlessCtx(run)
  const room = newRoom(run, ctx, opts.roomType || 'default')
  p.x = room.pxW / 2; p.y = room.pxH / 2
  return { run, p, ctx, room, IS }
}

export function newRoom (run, ctx, type = 'default') {
  const room = IS.makeRoom(IS.rooms[0], IS.floors[0], run, { type })
  room.enemies.length = 0
  room.pickups.length = 0
  run.room = room
  ctx.room = room
  IS.refreshCtx(ctx, room, IS.DT)
  return room
}

// A floor to enter: startFloor builds the floor and fires onNewFloor.
export function newFloor (w, id = 'basement-1') {
  const floor = (IS.floors.find(f => f.id === id) || IS.floors[0]).id
  IS.startFloor(w.run, floor, w.ctx)
  w.room = w.run.room
  return w.run.floor
}

export function give (w, id) {
  if (!IS.giveItem(w.p, id, { ctx: w.ctx })) throw new Error('giveItem failed for ' + id)
  return w.p
}

// Advance the simulation: the player's own update (hooks, familiars) plus the room.
export function tick (w, secs = 1 / 60, keep = true) {
  const n = Math.max(1, Math.round(secs * 60))
  for (let i = 0; i < n; i++) {
    w.run.time += IS.DT
    IS.refreshCtx(w.ctx, w.run.room, IS.DT)
    w.room = w.run.room
    if (!w.p.dead) { IS.fireHook(w.p, 'onUpdate', [IS.DT], w.ctx); IS.updateFamiliars(w.p, IS.DT, w.ctx) }
    IS.updateRoom(w.run.room, IS.DT, w.ctx)
  }
}

export function enemy (w, id = 'fly', x, y) {
  const room = w.run.room
  const e = IS.spawnEnemy(room, id, x ?? room.pxW / 2 + 120, y ?? room.pxH / 2, {})
  if (!e) throw new Error('no enemy ' + id)
  e.spawnT = 0
  return e
}

export function hurt (w, n = 1, src = { name: 'test', kind: 'contact' }) {
  w.run.time += 5 // clear invulnerability frames
  return IS.damagePlayer(w.p, n, src, w.ctx)
}

export function clearRoom (w) {
  w.room.hadEnemies = true
  for (const e of w.room.enemies) IS.killEnemy(e, w.ctx)
  w.room.enemies.length = 0
  w.room.cleared = false
  IS.checkClear(w.room, w.ctx)
  for (let i = 0; i < 90 && !w.room.cleared; i++) tick(w)
}

const failMsg = []
export const h = {
  fresh, newRoom, newFloor, give, tick, enemy, hurt, clearRoom, IS,
  ok (cond, msg) { if (!cond) throw new Error(msg || 'expected truthy') },
  eq (a, b, msg) { if (a !== b) throw new Error((msg ? msg + ': ' : '') + `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`) },
  gt (a, b, msg) { if (!(a > b)) throw new Error((msg ? msg + ': ' : '') + `expected ${a} > ${b}`) },
  lt (a, b, msg) { if (!(a < b)) throw new Error((msg ? msg + ': ' : '') + `expected ${a} < ${b}`) }
}

// --- run ---------------------------------------------------------------------

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const only = process.argv.slice(2).filter(a => !a.startsWith('--'))
  const dir = path.join(HERE, 'item-checks')
  const checks = {}
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.mjs')).sort()) {
      const mod = await import(path.join(dir, f))
      Object.assign(checks, mod.default(h))
    }
  }

  // every formerly dead item must have a check
  const PLACEHOLDERS = new Set(['item-43', 'item-61', 'item-235', 'item-648', 'item-662', 'item-666', 'item-718'])
  const dead = JSON.parse(fs.readFileSync(path.join(dir, 'dead-items.json'), 'utf8'))
  for (const id of dead) if (!only.length && !PLACEHOLDERS.has(id) && !checks[id]) failures.push(`${id}: no check written`)

  for (const id of Object.keys(checks)) {
    if (only.length && !only.includes(id)) continue
    if (!IS.itemsById[id]) { failures.push(`${id}: not an item`); continue }
    try { checks[id](); passed++ } catch (e) { failures.push(`${id}: ${e.message}`) }
  }

  console.log(`item-check: ${passed} passed, ${failures.length} failed`)
  for (const f of failures) console.log('  FAIL ' + f)
  process.exit(failures.length ? 1 : 0)

}
