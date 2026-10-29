#!/usr/bin/env node
//
// Behavioural check for the engine systems that items and rooms expect: enemy
// statuses, tear flags, the damage multiplier channel, pricing, map flags and
// curses, floor flags, active slots, beggars, machines, chests and hearts.
// No browser: it runs against the real bundle through tools/loader.mjs.
//
//   node tools/systems-check.mjs               # every check
//   node tools/systems-check.mjs status-ice    # one check
//
// Checks live in tools/systems-checks/*.mjs. Each exports a default function
// (h) => ({ 'check-name': () => { ...assertions via h.eq / h.ok... } }) and
// reuses the harness from item-check.mjs.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { h } from './item-check.mjs'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'systems-checks')
const only = process.argv.slice(2).filter(a => !a.startsWith('--'))
const checks = {}
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.mjs')).sort()) {
  Object.assign(checks, (await import(path.join(dir, f))).default(h))
}
const failures = []
let passed = 0
for (const name of Object.keys(checks)) {
  if (only.length && !only.includes(name)) continue
  try { checks[name](); passed++ } catch (e) { failures.push(`${name}: ${e.message}`) }
}
console.log(`systems-check: ${passed} passed, ${failures.length} failed`)
for (const f of failures) console.log('  FAIL ' + f)
process.exit(failures.length ? 1 : 0)
