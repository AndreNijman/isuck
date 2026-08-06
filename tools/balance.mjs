#!/usr/bin/env node
//
// Seeded auto-runs, no browser. Proves the deep end of the game is reachable:
// that floors generate and complete, that item pools do not run dry, that
// nothing throws six floors in, and that the difficulty curve is not a wall.
//
//   node tools/balance.mjs                    # 100 runs as Isaac
//   node tools/balance.mjs --runs 300
//   node tools/balance.mjs --char tainted-lost --floors 12
//   node tools/balance.mjs --verbose          # print each run
//
// A run that throws is a FAILURE. A run that dies is data.

import { loadGame } from './loader.mjs'

const arg = (name, dflt) => {
  const i = process.argv.indexOf('--' + name)
  return i > -1 ? (process.argv[i + 1] ?? true) : dflt
}
const RUNS = Number(arg('runs', 100))
const MAX_FLOORS = Number(arg('floors', 8))
const CHARS = String(arg('char', '')).split(',').filter(Boolean)
const VERBOSE = process.argv.includes('--verbose')

const game = loadGame()
const IS = game.IS

if (!IS) {
  console.error('FATAL: bundle did not load')
  process.exit(1)
}
if (game.failures.length) {
  console.error(`FATAL: ${game.failures.length} file(s) failed to load:`)
  for (const f of game.failures.slice(0, 8)) console.error(`  ${f.file}: ${f.error}`)
  process.exit(1)
}
if (typeof IS.simulate !== 'function') {
  console.error('FATAL: IS.simulate(opts) is missing — see docs/ENGINE-API.md (js/main.js). tools/balance.mjs cannot run without it.')
  process.exit(1)
}

const chars = CHARS.length ? CHARS : (IS.characters || []).filter(c => !c.unlock).map(c => c.id)
if (!chars.length) {
  console.error('FATAL: no characters registered')
  process.exit(1)
}

const results = []
const thrown = []
const depthHist = new Map()

for (let i = 0; i < RUNS; i++) {
  const charId = chars[i % chars.length]
  const seed = 1000003 + i * 7919
  let r
  try {
    r = IS.simulate({ charId, seed, maxFloors: MAX_FLOORS, maxSeconds: 60 * 40 })
  } catch (e) {
    thrown.push({ charId, seed, error: (e && e.message) || String(e) })
    continue
  }
  if (!r || typeof r !== 'object') {
    thrown.push({ charId, seed, error: 'simulate returned ' + typeof r })
    continue
  }
  if (r.error) thrown.push({ charId, seed, error: r.error })
  results.push({ charId, seed, ...r })
  const d = r.depth || r.floorsCleared || 0
  depthHist.set(d, (depthHist.get(d) || 0) + 1)
  if (VERBOSE) {
    console.log(`${String(i).padStart(4)} ${charId.padEnd(18)} seed ${seed}  depth ${d}  ${r.died ? 'died' : 'alive'}  ${r.itemsTaken ?? '?'} items  ${Math.round(r.seconds || 0)}s`)
  }
}

const num = a => a.reduce((s, v) => s + v, 0)
const avg = a => (a.length ? num(a) / a.length : 0)
const depths = results.map(r => r.depth || r.floorsCleared || 0)
const deaths = results.filter(r => r.died).length

console.log('\nISUCK balance report')
console.log('─'.repeat(64))
console.log(`runs                 ${results.length}/${RUNS}`)
console.log(`characters           ${chars.length}`)
console.log(`threw                ${thrown.length}`)
console.log(`died                 ${deaths} (${Math.round(100 * deaths / Math.max(1, results.length))}%)`)
console.log(`mean depth reached   ${avg(depths).toFixed(2)} of ${MAX_FLOORS}`)
console.log(`min / max depth      ${Math.min(...depths, 0)} / ${Math.max(...depths, 0)}`)
console.log(`mean items per run   ${avg(results.map(r => r.itemsTaken || 0)).toFixed(1)}`)
console.log('\ndepth histogram')
for (const d of [...depthHist.keys()].sort((a, b) => a - b)) {
  const n = depthHist.get(d)
  console.log(`  ${String(d).padStart(2)}  ${'█'.repeat(Math.ceil(40 * n / Math.max(...depthHist.values())))} ${n}`)
}

// per-character reachability: a character who can never clear floor 1 is broken
const byChar = new Map()
for (const r of results) {
  if (!byChar.has(r.charId)) byChar.set(r.charId, [])
  byChar.get(r.charId).push(r.depth || r.floorsCleared || 0)
}
const stuck = [...byChar.entries()].filter(([, ds]) => Math.max(...ds) < 1).map(([c]) => c)

console.log('\nper character (mean depth)')
for (const [c, ds] of [...byChar.entries()].sort((a, b) => avg(a[1]) - avg(b[1]))) {
  console.log(`  ${c.padEnd(20)} ${avg(ds).toFixed(2)}  max ${Math.max(...ds)}`)
}

if (thrown.length) {
  console.log(`\n${thrown.length} run(s) threw:`)
  const seen = new Set()
  for (const t of thrown) {
    if (seen.has(t.error)) continue
    seen.add(t.error)
    console.log(`  ✗ ${t.charId} seed ${t.seed}: ${t.error}`)
    if (seen.size > 12) break
  }
}
if (stuck.length) console.log(`\n${stuck.length} character(s) never cleared a floor: ${stuck.join(', ')}`)

const fail = thrown.length > 0 || stuck.length > 0 || avg(depths) < 1
console.log('\nbalance: ' + (fail ? 'FAIL' : 'PASS'))
process.exit(fail ? 1 : 0)
