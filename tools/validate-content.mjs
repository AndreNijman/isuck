#!/usr/bin/env node
//
// The gate. Catches the failure mode that no smoke test can: content that loads
// perfectly and silently does nothing, because a data file invented a hook name,
// referenced a sprite that was never registered, or was never wired into
// index.html at all.
//
//   node tools/validate-content.mjs           # errors fail the build
//   node tools/validate-content.mjs --warn    # also list warnings
//   node tools/validate-content.mjs --coverage # content accounting only

import fs from 'node:fs'
import path from 'node:path'
import { loadGame, scriptList, ROOT } from './loader.mjs'

const errors = []
const warns = []
const err = (where, msg) => errors.push(`${where}: ${msg}`)
const warn = (where, msg) => warns.push(`${where}: ${msg}`)

// ---------------------------------------------------------------- 1. loading
const game = loadGame()
const IS = game.IS

for (const f of game.failures) err('load', `${f.file} — ${f.error}`)
if (!IS) {
  console.error('FATAL: no IS global; js/core/const.js failed to load')
  process.exit(1)
}
for (const e of IS.defineErrors || []) err('define', e)

// every js file on disk must be referenced by index.html
const listed = new Set(scriptList())
const onDisk = []
;(function walk (dir) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`
    if (entry.isDirectory()) walk(rel)
    else if (entry.name.endsWith('.js')) onDisk.push(rel)
  }
})('js')
for (const f of onDisk) if (!listed.has(f)) err('wiring', `${f} exists but is not in index.html — it will never load`)

// ------------------------------------------------------- 2. engine API surface
// Parsed straight out of the contract, so a missing function is caught here
// rather than as a mystery crash three phases later.
const apiDoc = fs.readFileSync(path.join(ROOT, 'docs/ENGINE-API.md'), 'utf8')
const apiNames = new Set()
for (const m of apiDoc.matchAll(/^\s*IS\.([A-Za-z0-9_.]+)\s*\(/gm)) apiNames.add(m[1])
for (const name of [...apiNames].sort()) {
  const parts = name.split('.')
  let cur = IS
  for (const p of parts) { cur = cur == null ? undefined : cur[p] }
  if (typeof cur !== 'function') {
    // registries defined as objects rather than functions are fine
    if (cur === undefined) err('api', `IS.${name} is documented in ENGINE-API.md but not defined`)
  }
}

// --------------------------------------------------------- 3. vocabulary sets
const set = a => new Set(a || [])
const HOOKS = set(IS.HOOK_LIST)
const TEAR_FLAGS = set(IS.TEAR_FLAG_LIST)
const PFLAGS = set(IS.PLAYER_FLAG_LIST)
const POOLS = set(IS.POOL_LIST)
const STATS = set(IS.STAT_KEYS)
const MULTS = set(IS.MULT_KEYS)
const GRANTS = set(IS.GRANT_KEYS)
const TRANSFORMS = set(IS.TRANSFORM_LIST)
const ROOM_TYPES = set(IS.ROOM_TYPE_LIST)
const GOALS = set(IS.GOAL_LIST)
const CONDITIONS = set(IS.CONDITION_TYPE_LIST)
const SFX = set(IS.SFX_LIST)
const GRID_CHARS = set(Object.keys(IS.GRID_CHARS || {}))
const FAMILIAR_BEHAVIOURS = set(IS.FAMILIAR_BEHAVIOUR_LIST)

const spriteExists = n => !!(IS.sprites && IS.sprites[n])
const enemyExists = n => !!(IS.enemiesById && IS.enemiesById[n])
const itemExists = n => !!(IS.itemsById && IS.itemsById[n])

function checkCollectible (d, label) {
  const w = `${label} ${d.id}`
  if (d.hooks) {
    for (const k of Object.keys(d.hooks)) {
      if (!HOOKS.has(k)) err(w, `unknown hook "${k}" — it will never fire (see ARCHITECTURE.md §5.2)`)
      else if (typeof d.hooks[k] !== 'function') err(w, `hook "${k}" is not a function`)
    }
  }
  for (const f of d.tearFlags || []) if (!TEAR_FLAGS.has(f)) err(w, `unknown tear flag "${f}"`)
  for (const f of d.flags || []) if (!PFLAGS.has(f)) err(w, `unknown player flag "${f}"`)
  for (const p of d.pools || []) if (!POOLS.has(p)) err(w, `unknown pool "${p}"`)
  for (const k of Object.keys(d.stats || {})) if (!STATS.has(k)) err(w, `unknown stat key "${k}"`)
  for (const k of Object.keys(d.mult || {})) if (!MULTS.has(k)) err(w, `unknown mult key "${k}"`)
  for (const k of Object.keys(d.grant || {})) if (!GRANTS.has(k)) err(w, `unknown grant key "${k}"`)
  if (d.transform && !TRANSFORMS.has(d.transform)) err(w, `unknown transform "${d.transform}"`)
  for (const f of d.familiars || []) {
    if (!(IS.familiarsById && IS.familiarsById[f])) err(w, `familiar "${f}" is not defined`)
  }
  if (d.quality != null && (d.quality < 0 || d.quality > 4)) err(w, `quality ${d.quality} out of range`)
  if (label === 'item' && !['passive', 'active', 'familiar'].includes(d.kind)) err(w, `bad kind "${d.kind}"`)
  if (d.kind === 'active' && d.charge == null) warn(w, 'active item has no charge')
  if (d.unlock && IS.achievementsById && !IS.achievementsById[d.unlock]) err(w, `unlock "${d.unlock}" is not an achievement`)
  if (!d.name) err(w, 'no name')
}

for (const d of IS.items || []) checkCollectible(d, 'item')
for (const d of IS.trinkets || []) checkCollectible(d, 'trinket')

for (const d of IS.cards || []) {
  if (typeof d.use !== 'function') err(`card ${d.id}`, 'no use(p, ctx) function')
}
for (const d of IS.pills || []) {
  if (typeof d.use !== 'function') err(`pill ${d.id}`, 'no use(p, ctx, horse) function')
}

for (const d of IS.familiars || []) {
  const w = `familiar ${d.id}`
  const known = (IS.familiarBehaviours && IS.familiarBehaviours[d.behaviour]) || FAMILIAR_BEHAVIOURS.has(d.behaviour)
  if (!known) err(w, `unknown behaviour "${d.behaviour}"`)
  if (d.sprite && !spriteExists(d.sprite)) err(w, `sprite "${d.sprite}" is not registered`)
}

for (const d of IS.enemies || []) {
  const w = `enemy ${d.id}`
  if (!d.boss) {
    if (!IS.archetypes || !IS.archetypes[d.archetype]) err(w, `unknown archetype "${d.archetype}"`)
  }
  if (d.sprite && !spriteExists(d.sprite)) err(w, `sprite "${d.sprite}" is not registered`)
  for (const s of d.splitInto || []) if (!enemyExists(s)) err(w, `splitInto "${s}" is not an enemy`)
  if (!(d.hp > 0)) err(w, `hp is ${d.hp}`)
}

for (const d of IS.bosses || []) {
  const w = `boss ${d.id}`
  if (d.sprite && !spriteExists(d.sprite)) err(w, `sprite "${d.sprite}" is not registered`)
  if (!d.phases || !d.phases.length) err(w, 'no phases')
  for (const ph of d.phases || []) {
    if (!ph.attacks || !ph.attacks.length) err(w, 'a phase has no attacks')
    for (const a of ph.attacks || []) {
      if (!IS.attacks || !IS.attacks[a]) err(w, `unknown attack "${a}"`)
    }
    if (ph.weights && ph.weights.length !== ph.attacks.length) {
      err(w, `phase weights (${ph.weights.length}) do not match attacks (${ph.attacks.length})`)
    }
  }
  for (const s of d.stage || []) {
    if (IS.floors && IS.floors.length && !IS.floorsById[s]) warn(w, `stage "${s}" is not a floor id`)
  }
}

for (const d of IS.rooms || []) {
  const w = `room ${d.id}`
  if (!ROOM_TYPES.has(d.type)) err(w, `unknown room type "${d.type}"`)
  const shape = IS.SHAPES[d.shape]
  if (!shape) { err(w, `unknown shape "${d.shape}"`); continue }
  if (!Array.isArray(d.layout)) { err(w, 'no layout'); continue }
  if (d.layout.length !== shape.h) err(w, `layout has ${d.layout.length} rows, shape ${d.shape} needs ${shape.h}`)
  d.layout.forEach((row, i) => {
    if (typeof row !== 'string') { err(w, `row ${i} is not a string`); return }
    if (row.length !== shape.w) err(w, `row ${i} is ${row.length} chars, shape ${d.shape} needs ${shape.w}`)
    for (const ch of row) {
      if (!GRID_CHARS.has(ch) && !/[a-z0-9]/.test(ch)) err(w, `illegal grid char "${ch}" in row ${i}`)
      if (/[a-z0-9]/.test(ch) && !GRID_CHARS.has(ch) && !(d.legend && d.legend[ch])) {
        err(w, `legend char "${ch}" used in row ${i} but not defined in legend`)
      }
    }
  })
  for (const [ch, val] of Object.entries(d.legend || {})) {
    const id = String(val).replace(/^boss:/, '')
    if (!enemyExists(id)) err(w, `legend "${ch}" -> "${val}" is not a known enemy or boss`)
  }
  for (const f of d.floors || []) {
    if (f !== '*' && IS.floors.length && !IS.floorsById[f]) warn(w, `floors entry "${f}" is not a floor id`)
  }
}

for (const d of IS.floors || []) {
  const w = `floor ${d.id}`
  for (const b of d.bosses || []) if (!enemyExists(b)) err(w, `boss "${b}" is not defined`)
  for (const e of d.enemyPool || []) if (!enemyExists(e)) err(w, `enemyPool entry "${e}" is not defined`)
  for (const v of d.variants || []) if (!IS.floorsById[v]) warn(w, `variant "${v}" is not a floor id`)
  if (d.altPath && !IS.floorsById[d.altPath]) warn(w, `altPath "${d.altPath}" is not a floor id`)
  if (!d.palette || !d.palette.floor || !d.palette.wall) err(w, 'palette needs at least wall and floor')
  if (!d.bosses || !d.bosses.length) warn(w, 'no bosses')
}

for (const d of IS.characters || []) {
  const w = `character ${d.id}`
  for (const i of d.items || []) if (!itemExists(i)) err(w, `starting item "${i}" is not defined`)
  for (const t of d.trinkets || []) if (!(IS.trinketsById && IS.trinketsById[t])) err(w, `starting trinket "${t}" is not defined`)
  for (const f of d.flags || []) if (!PFLAGS.has(f)) err(w, `unknown player flag "${f}"`)
  if (d.sprite && !spriteExists(d.sprite)) err(w, `sprite "${d.sprite}" is not registered`)
  if (d.altOf && !IS.charactersById[d.altOf]) err(w, `altOf "${d.altOf}" is not a character`)
  if (!d.base || !(d.base.damage > 0)) err(w, 'no base damage')
}

for (const d of IS.challenges || []) {
  const w = `challenge ${d.id}`
  if (!IS.charactersById[d.charId]) err(w, `charId "${d.charId}" is not a character`)
  for (const i of d.items || []) if (!itemExists(i)) err(w, `item "${i}" is not defined`)
  if (!GOALS.has(d.goal)) err(w, `unknown goal "${d.goal}"`)
}

for (const d of IS.achievements || []) {
  const w = `achievement ${d.id}`
  const t = d.condition && d.condition.type
  if (!CONDITIONS.has(t)) err(w, `unknown condition type "${t}"`)
  if (t === 'custom' && typeof d.condition.check !== 'function') err(w, 'custom condition has no check()')
  const u = d.unlocks || {}
  const targets = {
    character: id => IS.charactersById[id], item: id => IS.itemsById[id],
    trinket: id => IS.trinketsById[id], card: id => IS.cardsById[id],
    pill: id => IS.pillsById[id], challenge: id => IS.challengesById[id],
    floor: id => IS.floorsById[id], room: () => true, cosmetic: () => true
  }
  for (const [kind, id] of Object.entries(u)) {
    if (!targets[kind]) { err(w, `unknown unlock kind "${kind}"`); continue }
    if (!targets[kind](id)) err(w, `unlocks.${kind} "${id}" does not exist`)
  }
}

// -------------------------------------------------- 4. sfx names used in code
for (const rel of onDisk) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8')
  for (const m of src.matchAll(/(?:ctx\.sfx|IS\.audio\.sfx)\(\s*'([^']+)'/g)) {
    if (!SFX.has(m[1])) err(`sfx ${rel}`, `"${m[1]}" is not in IS.SFX_LIST`)
  }
  if (/js\/(engine|data)\//.test(rel) && /Math\.random\s*\(/.test(src)) {
    err(`determinism ${rel}`, 'Math.random() in the sim layer breaks seeded runs')
  }
}

// ------------------------------------------------------ 5. runtime smoke pokes
function tryRun (label, fn) {
  try { fn() } catch (e) { err(label, `threw: ${e && e.message ? e.message : e}`) }
}

let dummyRun = null
if (typeof IS.makePlayer === 'function' && IS.charactersById && IS.charactersById.isaac) {
  tryRun('runtime', () => {
    dummyRun = {
      seed: 12345, seedStr: 'TEST TEST', rng: new IS.RNG(12345),
      floorRng: new IS.RNG(222), poolRng: new IS.RNG(333),
      charId: 'isaac', floorIndex: 0, pools: {}, curses: 0, stats: {}, flags: {},
      time: 0, floorTime: 0, itemsTaken: [], bossesKilled: [], log: [],
      devilDealsTaken: 0, donation: 0
    }
    dummyRun.player = IS.makePlayer('isaac', dummyRun)
    IS.recalcStats(dummyRun.player)
  })
}

if (dummyRun && typeof IS.headlessCtx === 'function') {
  const ctx = IS.headlessCtx(dummyRun)

  // every item, granted and removed on a fresh player
  let broken = 0
  for (const d of IS.items || []) {
    try {
      const p = IS.makePlayer('isaac', dummyRun)
      dummyRun.player = p
      IS.giveItem(p, d.id, { noAnim: true })
      IS.recalcStats(p)
      if (d.hooks) {
        for (const hook of ['onUpdate', 'onRoomEnter', 'onRoomClear', 'onNewFloor', 'onStats']) {
          if (!d.hooks[hook]) continue
          const args = hook === 'onUpdate' ? [p, 1 / 60] : hook === 'onStats' ? [p, p.stats] : [p, null]
          try { d.hooks[hook](...args, ctx) } catch (e) { err(`item ${d.id}`, `${hook} threw: ${e.message}`); broken++ }
        }
      }
      IS.removeItem(p, d.id)
      IS.recalcStats(p)
    } catch (e) {
      err(`item ${d.id}`, `give/remove threw: ${e.message}`)
      broken++
    }
    if (broken > 40) { err('runtime', 'too many broken items, stopping early'); break }
  }

  // every enemy and boss spawns and survives 60 ticks
  if (typeof IS.makeRoom === 'function' && typeof IS.spawnEnemy === 'function') {
    const roomDef = IS.rooms && IS.rooms[0]
    const floorDef = IS.floors && IS.floors[0]
    if (roomDef && floorDef) {
      let brokenE = 0
      for (const d of [...(IS.enemies || []), ...(IS.bosses || [])]) {
        try {
          const room = IS.makeRoom(roomDef, floorDef, dummyRun, { type: 'default' })
          dummyRun.room = room
          ctx.room = room
          const e = d.boss
            ? IS.spawnBoss(room, d.id, 520, 280, {})
            : IS.spawnEnemy(room, d.id, 520, 280, {})
          if (!e) { warn(`enemy ${d.id}`, 'spawn returned null'); continue }
          for (let i = 0; i < 60; i++) IS.updateEnemies(room, 1 / 60, ctx)
        } catch (e2) {
          err(`${d.boss ? 'boss' : 'enemy'} ${d.id}`, `spawn/update threw: ${e2.message}`)
          if (++brokenE > 25) { err('runtime', 'too many broken enemies, stopping early'); break }
        }
      }
    }
  }
}

// every registered sprite draws without throwing
if (IS.sprites) {
  const g = game.fakeCtx()
  for (const [name, fn] of Object.entries(IS.sprites)) {
    for (const t of [{ frame: 0, time: 0, dir: 'down' }, { frame: 3, time: 1.5, dir: 'up', hurt: 1, hp01: 0.4, variant: 1, flip: true, charge: 0.5 }]) {
      try { fn(g, 48, t) } catch (e) { err(`sprite ${name}`, `threw: ${e.message}`); break }
    }
  }
}

// ------------------------------------------------------------- 6. accounting
function implemented (d) {
  return !!(d.stats || d.mult || d.grant || (d.flags && d.flags.length) ||
    (d.tearFlags && d.tearFlags.length) || (d.familiars && d.familiars.length) ||
    d.transform || (d.hooks && Object.keys(d.hooks).length))
}
function behavioural (d) {
  return !!(d.hooks && Object.keys(d.hooks).length) ||
    !!(d.tearFlags && d.tearFlags.length) || !!(d.familiars && d.familiars.length) ||
    !!(d.flags && d.flags.length)
}

const ref = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/reference/collectibles.json'), 'utf8')) } catch { return [] }
})()

const coverage = {
  items: { total: IS.items.length, target: ref.length || 732, withEffect: IS.items.filter(implemented).length, withBehaviour: IS.items.filter(behavioural).length },
  trinkets: { total: IS.trinkets.length, target: 189, withEffect: IS.trinkets.filter(implemented).length },
  cards: { total: IS.cards.length, target: 97 },
  pills: { total: IS.pills.length, target: 50 },
  characters: { total: IS.characters.length, target: 34 },
  familiars: { total: IS.familiars.length },
  enemies: { total: IS.enemies.length - IS.bosses.length },
  bosses: { total: IS.bosses.length },
  rooms: { total: IS.rooms.length },
  floors: { total: IS.floors.length },
  challenges: { total: IS.challenges.length, target: 45 },
  achievements: { total: IS.achievements.length, target: 637 },
  sprites: { total: Object.keys(IS.sprites || {}).length },
  archetypes: { total: Object.keys(IS.archetypes || {}).length, target: (IS.ARCHETYPE_LIST || []).length },
  attacks: { total: Object.keys(IS.attacks || {}).length, target: (IS.ATTACK_LIST || []).length }
}

// missing archetypes/attacks are a hard error: a boss with no attack freezes
for (const name of IS.ARCHETYPE_LIST || []) {
  if (!IS.archetypes[name]) err('archetypes', `IS.ARCHETYPE_LIST has "${name}" but no archetype is registered`)
}
for (const name of IS.ATTACK_LIST || []) {
  if (!IS.attacks[name]) err('attacks', `IS.ATTACK_LIST has "${name}" but no attack is registered`)
}

// ---------------------------------------------------------------- 7. report
const onlyCoverage = process.argv.includes('--coverage')

console.log('ISUCK content report')
console.log('─'.repeat(72))
console.log(`files loaded            ${game.loaded.length}/${listed.size}`)
for (const [k, v] of Object.entries(coverage)) {
  const t = v.target ? `/${v.target}` : ''
  const extra = v.withEffect != null ? `   (${v.withEffect} with effects, ${v.withBehaviour ?? '–'} with behaviour hooks)` : ''
  console.log(`${k.padEnd(23)} ${String(v.total).padStart(4)}${t}${extra}`)
}
console.log('─'.repeat(72))

if (onlyCoverage) process.exit(0)

if (warns.length && (process.argv.includes('--warn') || warns.length < 30)) {
  console.log(`\n${warns.length} warning(s):`)
  for (const w of warns.slice(0, 60)) console.log(`  ~ ${w}`)
  if (warns.length > 60) console.log(`  … and ${warns.length - 60} more`)
} else if (warns.length) {
  console.log(`\n${warns.length} warning(s) (pass --warn to list)`)
}

if (game.logs.warn.length) {
  console.log(`\n${game.logs.warn.length} console.warn during load:`)
  for (const w of [...new Set(game.logs.warn)].slice(0, 15)) console.log(`  ! ${w}`)
}

if (errors.length) {
  console.log(`\n${errors.length} ERROR(S):`)
  const shown = errors.slice(0, 80)
  for (const e of shown) console.log(`  ✗ ${e}`)
  if (errors.length > shown.length) console.log(`  … and ${errors.length - shown.length} more`)
  process.exit(1)
}

console.log('\nvalidate-content: PASS')
