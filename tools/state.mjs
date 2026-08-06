#!/usr/bin/env node
//
// Derives BUILD_STATE.json from what is actually on disk. State is never
// something a session remembers — it is something this script recomputes, so a
// build interrupted by a laptop shutting down resumes exactly where it stopped.
//
//   node tools/state.mjs           # recompute, write BUILD_STATE.json, print summary
//   node tools/state.mjs --json    # print the machine-readable state only
//   node tools/state.mjs --next    # print just the next actionable step
//
// A file counts as DONE when it exists, is non-trivial, and (for .js) passes
// `node --check`. A phase is DONE when every file in it is DONE.

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PLAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/FILE-PLAN.json'), 'utf8'))

const MIN_BYTES = { '.md': 200, '.json': 40, '.js': 300, '.mjs': 300, '.html': 400, '.css': 100, '.png': 500, '.txt': 10, '.xml': 40, '.webmanifest': 40 }

function statusOf (rel) {
  const abs = path.join(ROOT, rel)
  if (!fs.existsSync(abs)) return { state: 'missing' }
  const size = fs.statSync(abs).size
  const ext = path.extname(rel)
  const min = MIN_BYTES[ext] ?? 1
  if (size < min) return { state: 'stub', size }
  if (ext === '.js' || ext === '.mjs') {
    try {
      execFileSync(process.execPath, ['--check', abs], { stdio: 'pipe' })
    } catch (e) {
      const msg = String(e.stderr || e.message).split('\n').slice(0, 3).join(' ').trim()
      return { state: 'syntax-error', size, error: msg }
    }
    // an unwired js file is as good as absent
    if (rel.startsWith('js/')) {
      const html = fs.existsSync(path.join(ROOT, 'index.html'))
        ? fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
        : ''
      if (html && !html.includes(rel)) return { state: 'unwired', size }
    }
  }
  return { state: 'done', size }
}

function gitInfo () {
  const out = {}
  try {
    out.head = execFileSync('git', ['-C', ROOT, 'rev-parse', '--short', 'HEAD'], { stdio: 'pipe' }).toString().trim()
    out.branch = execFileSync('git', ['-C', ROOT, 'rev-parse', '--abbrev-ref', 'HEAD'], { stdio: 'pipe' }).toString().trim()
    out.dirty = execFileSync('git', ['-C', ROOT, 'status', '--porcelain'], { stdio: 'pipe' }).toString().trim().length > 0
    out.remote = execFileSync('git', ['-C', ROOT, 'remote', '-v'], { stdio: 'pipe' }).toString().trim().split('\n')[0] || null
  } catch {
    out.head = null
  }
  return out
}

function gateResult (name, cmd, args) {
  try {
    const out = execFileSync(cmd, args, { cwd: ROOT, stdio: 'pipe', timeout: 900000 }).toString()
    return { name, pass: true, tail: out.trim().split('\n').slice(-3).join('\n') }
  } catch (e) {
    const text = String(e.stdout || '') + String(e.stderr || e.message || '')
    return { name, pass: false, tail: text.trim().split('\n').slice(-6).join('\n') }
  }
}

const runGates = process.argv.includes('--gates')

const phases = PLAN.phases.map(ph => {
  const files = ph.files.map(rel => ({ file: rel, ...statusOf(rel) }))
  const done = files.filter(f => f.state === 'done').length
  return {
    id: ph.id,
    title: ph.title,
    files,
    deploy: ph.deploy ?? null,
    done,
    total: files.length,
    complete: done === files.length
  }
})

const missing = []
for (const ph of phases) {
  for (const f of ph.files) {
    if (f.state !== 'done') missing.push({ phase: ph.id, ...f })
  }
}

const firstIncomplete = phases.find(p => !p.complete)

const state = {
  project: PLAN.project,
  generated: 'derived-from-disk',
  git: gitInfo(),
  phases: phases.map(p => ({ id: p.id, title: p.title, done: p.done, total: p.total, complete: p.complete })),
  currentPhase: firstIncomplete ? firstIncomplete.id : 'complete',
  currentPhaseTitle: firstIncomplete ? firstIncomplete.title : 'all phases complete',
  missing,
  missingByPhase: Object.fromEntries(
    phases.map(p => [p.id, p.files.filter(f => f.state !== 'done').map(f => f.file)])
  ),
  gates: runGates
    ? [
        gateResult('validate-content', process.execPath, ['tools/validate-content.mjs']),
        gateResult('smoke', process.execPath, ['tools/smoke.mjs'])
      ]
    : 'not-run (pass --gates)'
}

fs.writeFileSync(path.join(ROOT, 'BUILD_STATE.json'), JSON.stringify(state, null, 2) + '\n')

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(state, null, 2))
  process.exit(0)
}

if (process.argv.includes('--next')) {
  if (!firstIncomplete) console.log('all phases complete — run the gates and ship')
  else console.log(`${firstIncomplete.id} ${firstIncomplete.title}: ${firstIncomplete.total - firstIncomplete.done} file(s) left\n` +
    firstIncomplete.files.filter(f => f.state !== 'done').map(f => `  ${f.state.padEnd(13)} ${f.file}`).join('\n'))
  process.exit(0)
}

console.log(`ISUCK build state  ·  git ${state.git.head || 'no-commit'}${state.git.dirty ? ' (dirty)' : ''}`)
console.log('─'.repeat(64))
for (const p of phases) {
  const bar = p.complete ? '✓' : p.done ? '·' : ' '
  console.log(`${bar} ${p.id}  ${String(p.done).padStart(2)}/${String(p.total).padEnd(2)}  ${p.title}`)
  for (const f of p.files) {
    if (f.state !== 'done') console.log(`       ${f.state.padEnd(13)} ${f.file}${f.error ? '  ← ' + f.error : ''}`)
  }
}
console.log('─'.repeat(64))
console.log(`next: ${state.currentPhase} — ${state.currentPhaseTitle}`)
if (runGates) {
  for (const g of state.gates) console.log(`gate ${g.name}: ${g.pass ? 'PASS' : 'FAIL'}\n${g.tail}`)
}
