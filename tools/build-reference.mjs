#!/usr/bin/env node
//
// Builds docs/reference/*.json — the offline content reference the data-writing
// phases work from. Names, stat deltas, effect text, pool membership and unlock
// conditions are facts about the game we are homaging; getting them from a
// dataset instead of from recall is the difference between "700 items" and "700
// items that are actually the right 700 items".
//
// Sources (fetched once into a scratch dir, then committed here as JSON so the
// build is reproducible offline and a resumed session needs no network):
//   items.json, itempools.json, achievements.json  — Zamiell/isaac-save-viewer
//   ab+/en_us.lua, rep/en_us.lua                   — wofsauge/External-Item-Descriptions
//
// Usage: node tools/build-reference.mjs --src <dir-with-downloads>

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcIdx = process.argv.indexOf('--src')
const SRC = srcIdx > -1 ? process.argv[srcIdx + 1] : path.join(ROOT, '.ref-src')
const OUT = path.join(ROOT, 'docs/reference')
fs.mkdirSync(path.join(OUT, 'slices'), { recursive: true })

const read = f => fs.readFileSync(path.join(SRC, f), 'utf8')
const readJson = f => JSON.parse(read(f))

// --- EID lua parsing -------------------------------------------------------
// Entries are one per line, in two shapes:
//   {"1", "The Sad Onion", "↑ {{Tears}} +0.7 Tears"},
//   [46] = {"46", "Lucky Foot", "↑ {{Luck}} +1 Luck#..."},
const ENTRY = /\{\s*"(\d+)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\}/

function sections (text, markers) {
  const lines = text.split('\n')
  const starts = []
  for (let i = 0; i < lines.length; i++) {
    for (const [key, re] of Object.entries(markers)) {
      if (re.test(lines[i])) starts.push({ key, line: i })
    }
  }
  starts.sort((a, b) => a.line - b.line)
  const out = {}
  for (let s = 0; s < starts.length; s++) {
    const from = starts[s].line
    let to = s + 1 < starts.length ? starts[s + 1].line : lines.length
    // A table ends at its own closing brace. Without this the last section runs
    // to EOF and swallows every unrelated table after it.
    for (let i = from + 1; i < to; i++) {
      if (/^\}/.test(lines[i]) || /^EID[:.]/.test(lines[i]) || /^local\s/.test(lines[i])) {
        to = i
        break
      }
    }
    const bucket = (out[starts[s].key] = out[starts[s].key] || {})
    for (let i = from; i < to; i++) {
      const m = lines[i].match(ENTRY)
      if (m) bucket[Number(m[1])] = { name: m[2], raw: m[3] }
    }
  }
  return out
}

function cleanDesc (raw) {
  const lines = String(raw)
    .split('#')
    .map(s => s
      .replace(/\{\{[^}]*\}\}/g, '')          // EID icon tags
      .replace(/\\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim())
    .filter(Boolean)
  return lines
}

const base = sections(read('abp_en_us.lua'), {
  collectibles: /^EID\.descriptions\[languageCode\]\.collectibles\s*=/,
  trinkets: /^EID\.descriptions\[languageCode\]\.trinkets\s*=/,
  cards: /^EID\.descriptions\[languageCode\]\.cards\s*=/,
  pills: /^EID\.descriptions\[languageCode\]\.pills\s*=/
})

const rep = sections(read('rep_en_us.lua'), {
  collectibles: /local\s+repCollectibles\s*=/,
  trinkets: /local\s+repTrinkets\s*=/,
  cards: /local\s+repCards\s*=/,
  pills: /local\s+repPills\s*=/
})

function merged (key) {
  const out = {}
  for (const [id, v] of Object.entries(base[key] || {})) out[id] = v
  for (const [id, v] of Object.entries(rep[key] || {})) out[id] = v // Repentance wins
  return out
}

// --- stat deltas + transformation flags from the tracker dataset -----------
const tracker = readJson('items.json')
const STAT_MAP = {
  tears: 'tears', tears_x: 'tearsMult', dmg: 'damage', dmg_x: 'damageMult',
  range: 'range', height: 'rangeHeight', shot_speed: 'shotSpeed', speed: 'speed',
  luck: 'luck', health: 'maxHearts', soul_hearts: 'soul', sin_hearts: 'black',
  bone_hearts: 'bone'
}
const TRANSFORM_MAP = {
  guppy: 'guppy', leviathan: 'leviathan', funguy: 'fun-guy', seraphim: 'seraphim',
  bob: 'bob', spun: 'spun', yesmother: 'mom', beelzebub: 'fly', ohcrap: 'poop',
  bookworm: 'bookworm', conjoined: 'conjoined', spiderbaby: 'spider',
  superbum: 'super-bum'
}

function trackerFor (id) {
  const t = tracker[String(id)]
  if (!t) return {}
  const stats = {}
  for (const [k, v] of Object.entries(STAT_MAP)) {
    if (t[k] !== undefined) stats[v] = Number(t[k])
  }
  const transforms = []
  for (const [k, v] of Object.entries(TRANSFORM_MAP)) if (t[k]) transforms.push(v)
  return {
    stats: Object.keys(stats).length ? stats : undefined,
    transforms: transforms.length ? transforms : undefined,
    active: t.space === true || undefined,
    healthOnly: t.health_only === true || undefined,
    dlc: t.introduced_in || undefined,
    trackerText: t.text || undefined
  }
}

// --- pools -----------------------------------------------------------------
const POOL_NAME = {
  treasure: 'treasure', shop: 'shop', boss: 'boss', devil: 'devil', angel: 'angel',
  secret: 'secret', library: 'library', shellGame: 'shell-game',
  goldenChest: 'golden-chest', redChest: 'red-chest', beggar: 'beggar',
  demonBeggar: 'demon-beggar', curse: 'curse', keyMaster: 'key-master',
  batteryBum: 'battery-bum', momsChest: 'moms-chest',
  greedTreasure: 'greed-treasure', greedBoss: 'greed-boss', greedShop: 'greed-shop',
  greedCurse: 'greed-curse', greedDevil: 'greed-devil', greedAngel: 'greed-angel',
  greedSecret: 'greed-secret', craneGame: 'crane-game', ultraSecret: 'ultra-secret',
  bombBum: 'bomb-bum', planetarium: 'planetarium', oldChest: 'old-chest',
  babyShop: 'baby-shop', woodenChest: 'wooden-chest', rottenBeggar: 'rotten-beggar'
}
const poolsRaw = readJson('itempools.json').ItemPools.Pool
const poolsById = {}
for (const pool of poolsRaw) {
  const name = POOL_NAME[pool._Name] || pool._Name
  const items = Array.isArray(pool.Item) ? pool.Item : [pool.Item].filter(Boolean)
  for (const entry of items) {
    const id = Number(entry._Id)
    if (!poolsById[id]) poolsById[id] = []
    if (!poolsById[id].includes(name)) poolsById[id].push(name)
  }
}

// --- kebab ids -------------------------------------------------------------
const usedIds = new Set()
function kebab (name, num) {
  let id = String(name)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/[''’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!id) id = 'item-' + num
  if (usedIds.has(id)) id = id + '-' + num
  usedIds.add(id)
  return id
}

// --- build -----------------------------------------------------------------
// Cards and pills live in their own id spaces, so they must NOT read stat
// deltas or pool membership out of the collectible-indexed tracker data.
function build (key, idOffset, kindLabel) {
  const src = merged(key)
  const useTracker = kindLabel === 'collectible' || kindLabel === 'trinket'
  const out = []
  for (const num of Object.keys(src).map(Number).sort((a, b) => a - b)) {
    const e = src[num]
    const t = useTracker ? trackerFor(num + idOffset) : {}
    const lines = cleanDesc(e.raw)
    out.push({
      num,
      id: kebab(e.name, num),
      name: e.name,
      kind: kindLabel,
      lines,
      info: lines.join(' · '),
      ...t,
      pools: kindLabel === 'collectible' ? (poolsById[num] || []) : undefined
    })
  }
  return out
}

const collectibles = build('collectibles', 0, 'collectible')
const trinkets = build('trinkets', 2000, 'trinket')
const cards = build('cards', 0, 'card')
const pills = build('pills', 0, 'pill')

const achRaw = readJson('achievements.json')
const achievements = Object.keys(achRaw)
  .filter(k => /^\d+$/.test(k))
  .map(Number).sort((a, b) => a - b)
  .map(num => ({
    num,
    name: achRaw[num].name,
    unlocks: achRaw[num].link || achRaw[num].name,
    inGame: achRaw[num].inGameDescription || '',
    condition: achRaw[num].unlockDescription || ''
  }))

const write = (f, data) => {
  fs.writeFileSync(path.join(OUT, f), JSON.stringify(data, null, 1) + '\n')
  console.log(`${f}: ${Array.isArray(data) ? data.length : Object.keys(data).length} entries`)
}

write('collectibles.json', collectibles)
write('trinkets.json', trinkets)
write('cards.json', cards)
write('pills.json', pills)
write('achievements.json', achievements)

// --- work slices ----------------------------------------------------------
function slice (name, arr, parts) {
  const per = Math.ceil(arr.length / parts)
  for (let i = 0; i < parts; i++) {
    const chunk = arr.slice(i * per, (i + 1) * per)
    if (!chunk.length) continue
    fs.writeFileSync(
      path.join(OUT, 'slices', `${name}-${i + 1}.json`),
      JSON.stringify(chunk, null, 1) + '\n'
    )
    console.log(`slices/${name}-${i + 1}.json: ${chunk.length} (nums ${chunk[0].num}–${chunk[chunk.length - 1].num})`)
  }
}
slice('items', collectibles, 8)
slice('trinkets', trinkets, 2)

console.log('\nreference built into docs/reference/')
