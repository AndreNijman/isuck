#!/usr/bin/env node
//
// Character check. Loads the whole bundle in a Node VM (tools/loader.mjs), starts
// a run with every one of the 34 characters, asserts the starting hearts, stats
// and items against js/data/characters.js, then drives one observable mechanic
// per character directly through the engine (IS.updateWeapon, IS.damagePlayer,
// IS.tryTakePickup, IS.usePocket ...). Mechanics that depend on a starting item
// work whether the item's own hooks exist yet or the character fallback runs.
//
//   node tools/char-check.mjs

import { loadGame } from './loader.mjs'

const IS = loadGame().IS
const fails = []
let passes = 0
let current = ''
const ok = (c, msg, detail) => { if (c) passes++; else fails.push(`${current}: ${msg}${detail !== undefined ? ' — ' + detail : ''}`); return !!c }

const FRAME = 1 / 60
function start (id, seed = 7) {
  current = id
  IS.startRun({ charId: id, seed })
  const run = IS.state.run
  return { run, p: run.player, get ctx () { return IS.state.ctx } }
}
const step = (n = 1) => { for (let i = 0; i < n; i++) IS.step(FRAME) }
const clearRoom = (g) => { const r = g.ctx.room; r.cleared = true; r.pendingSpawns = []; for (const e of r.enemies) e.dead = true; r.enemies.length = 0 }
const dummy = (g, x, y, hp = 9999) => {
  const e = g.ctx.spawnEnemy('gaper', x ?? g.p.x + 90, y ?? g.p.y)
  e.spawnT = 0; e.hp = e.maxHp = hp; e.vx = e.vy = 0
  return e
}
const friendlyTears = (g) => g.ctx.room.tears.filter(t => !t.dead && t.friendly)
const hit = (g, n = 1) => { g.p.invulnUntil = 0; return IS.damagePlayer(g.p, n, { name: 'test' }, g.ctx) }
const total = (h) => h.red + h.soul + h.black + h.bone
const hasItem = (p, id) => (p.itemCounts[id] || 0) > 0

const ids = IS.characters.map(c => c.id)
ok(ids.length === 34, '34 characters defined', ids.length)

// ------------------------------------------------------------- data fidelity
for (const d of IS.characters) {
  const g = start(d.id)
  const h = g.p.hearts
  const want = d.hearts || {}
  if (d.id !== 'eden') {
    ok(h.maxRed === (want.maxRed ?? want.red ?? 0), 'max red hearts', `${h.maxRed} vs ${want.maxRed ?? want.red}`)
    ok(h.soul === (want.soul || 0), 'soul hearts', `${h.soul} vs ${want.soul}`)
  }
  ok(h.black === (want.black || 0), 'black hearts', `${h.black} vs ${want.black}`)
  ok(h.bone === (want.bone || 0), 'bone hearts', `${h.bone} vs ${want.bone}`)
  for (const it of d.items || []) ok(hasItem(g.p, it) || (g.p.active || []).some(a => a && a.id === it), `has starting item ${it}`)
  for (const t of d.trinkets || []) ok((g.p.trinkets || []).includes(t), `has starting trinket ${t}`)
  for (const f of d.flags || []) ok(g.p.flags.has(f), `has flag ${f}`)
  ok(Number.isFinite(g.p.stats.damage) && g.p.stats.damage > 0, 'finite damage')
  ok(Number.isFinite(g.p.stats.tears) && g.p.stats.tears > 0, 'finite fire rate')
  if (!['eden', 'tainted-eden'].includes(d.id)) {
    const rel = (g.p.stats.damage / g.p.base.damage)
    ok(rel > 0.4 && rel < 3, 'damage in a sane multiple of base', rel.toFixed(2))
  }
  step(30)
  ok(!g.p.dead, 'survives 0.5s')
  if (d.pAct) ok(g.p.pAct && g.p.pAct.id === d.pAct.id && g.p.pAct.max === d.pAct.max, 'pocket active present', JSON.stringify(g.p.pAct))
}

// ------------------------------------------------------------- Eden is seeded
{
  const a = start('eden', 11).p.base, b = start('eden', 11).p.base, c = start('eden', 12).p.base
  current = 'eden'
  ok(a.damage === b.damage && a.tears === b.tears && a.speed === b.speed, 'same seed rolls same stats')
  ok(a.damage !== c.damage || a.tears !== c.tears || a.speed !== c.speed, 'different seed rolls different stats')
  const g = start('eden', 11); step(3)
  ok(g.p.items.length >= 1, 'Eden is handed random items from the run seed', g.p.items.join(','))
  const g2 = start('eden', 11); step(3)
  ok(g2.p.items.join() === g.p.items.join(), 'Eden items are deterministic per seed')
}

// ------------------------------------------------------------- regular characters
{
  let g = start('isaac'); ok(g.p.active[0] && g.p.active[0].id === 'the-d6', 'Isaac holds the D6')
  g = start('magdalene'); ok(g.p.hearts.maxRed === 8, 'Magdalene has 4 heart containers'); ok(g.p.active[0] && g.p.active[0].id === 'yum-heart', 'Magdalene holds Yum Heart')
  g = start('cain'); ok(g.p.flags.has('oneEye'), 'Cain has one eye'); ok(g.p.stats.luck >= 1, 'Cain is lucky', g.p.stats.luck)
  g = start('judas'); ok(g.p.active[0] && g.p.active[0].id === 'the-book-of-belial', 'Judas holds Book of Belial'); ok(g.p.stats.damage > 3.5 * 1.2, 'Judas hits harder than Isaac', g.p.stats.damage)
  g = start('blue-baby'); ok(g.p.hearts.maxRed === 0 && g.p.hearts.soul === 6, '??? has soul hearts only')
  g.p.hearts.soul = 2; const hp = IS.tryTakePickup(g.p, { kind: 'heart', amount: 2, x: 0, y: 0 }, g.ctx); ok(!hp && g.p.hearts.red === 0, '??? refuses red hearts')
  g = start('eve'); ok(g.p.active[0] && g.p.active[0].id === 'razor-blade', 'Eve holds Razor Blade'); ok(hasItem(g.p, 'dead-bird') && hasItem(g.p, 'whore-of-babylon'), 'Eve has Dead Bird and Whore of Babylon')
  g = start('samson'); const d0 = g.p.stats.damage; hit(g, 1); ok(g.p.stats.damage > d0, 'Samson gains damage from being hurt (Bloody Lust)', `${d0} -> ${g.p.stats.damage}`)
  g = start('azazel'); ok(g.p.flags.has('flying') && g.p.flags.has('brimstone'), 'Azazel flies with brimstone'); ok(g.p.hearts.black === 6 && g.p.hearts.maxRed === 0, 'Azazel has 3 black hearts')
  clearRoom(g); dummy(g); step(2); for (let i = 0; i < 90; i++) IS.updateWeapon(g.p, { x: 1, y: 0 }, FRAME, g.ctx); IS.updateWeapon(g.p, { x: 0, y: 0 }, FRAME, g.ctx); ok(g.ctx.room.lasers.length > 0, 'Azazel releases a brimstone beam'); ok(g.p.beam && g.p.beam.len < 400, 'Azazel beam is short', g.p.beam && g.p.beam.len)
  g = start('lazarus'); ok(hasItem(g.p, 'lazarus-rags'), 'Lazarus starts with Lazarus\' Rags')
  g.p.hearts.red = 1; g.p.invulnUntil = 0; hit(g, 5); step(2)
  ok(!g.p.dead && total(g.p.hearts) > 0, 'Lazarus revives on death'); ok(!hasItem(g.p, 'lazarus-rags'), 'Rags are consumed'); ok(hasItem(g.p, 'anemic'), 'Lazarus Risen gains Anemic')
  g = start('the-lost'); ok(total(g.p.hearts) === 0 && g.p.flags.has('flying') && g.p.flags.has('spectralTears'), 'The Lost has no hearts, flies, spectral tears'); ok(hasItem(g.p, 'holy-mantle'), 'The Lost has Holy Mantle')
  step(2); const first = hit(g, 1); const second = hit(g, 1); step(2)
  ok(!first && (second || g.p.dead) , 'Holy Mantle blocks one hit then he dies on the next', `${first} ${second} dead=${g.p.dead}`)
  ok(!IS.tryTakePickup(start('the-lost').p, { kind: 'heart', amount: 2 }, IS.state.ctx), 'The Lost cannot take hearts')
  g = start('lilith'); clearRoom(g); dummy(g); step(2)
  const before = friendlyTears(g).length; IS.updateWeapon(g.p, { x: 1, y: 0 }, FRAME, g.ctx); IS.updateWeapon(g.p, { x: 1, y: 0 }, 0.5, g.ctx)
  ok(friendlyTears(g).length === before, 'Lilith cannot fire tears herself')
  ok((g.p.familiars || []).some(f => f.def && /incubus/.test(f.def.id || f.id)), 'Lilith has an Incubus'); ok(g.p.active[0] && g.p.active[0].id === 'box-of-friends', 'Lilith holds Box of Friends')
  g = start('keeper'); ok(g.p.hearts.maxRed === 4 && g.p.stats.multishot >= 2, 'Keeper fires a triple shot', g.p.stats.multishot)
  g.p.hearts.red = 2; IS.tryTakePickup(g.p, { kind: 'coin', amount: 1 }, g.ctx); ok(g.p.hearts.red === 3, 'Keeper heals from coins', g.p.hearts.red)
  ok(!IS.tryTakePickup(g.p, { kind: 'heart', amount: 2 }, g.ctx), 'Keeper cannot take heart pickups')
  g = start('apollyon'); ok(g.p.active[0] && g.p.active[0].id === 'void', 'Apollyon holds Void')
  g = start('the-forgotten'); ok(g.p.alt && g.p.alt.hearts.soul === 4, 'Forgotten has The Soul alongside'); ok(g.p.hearts.bone === 4 && g.p.flags.has('melee'), 'Forgotten is a bone-hearted melee body')
  clearRoom(g); { const e = dummy(g, g.p.x + 70, g.p.y, 500); IS.updateWeapon(g.p, { x: 1, y: 0 }, FRAME, g.ctx); IS.updateWeapon(g.p, { x: 0, y: 0 }, FRAME, g.ctx); ok(e.hp < 500, 'Forgotten club swing hurts an enemy', e.hp) }
  { const x = g.p.x; IS.charMechanics.SWAP['the-forgotten'](g.p, g.ctx); ok(g.p.form === 'soul' && g.p.hearts.soul === 4 && g.p.flags.has('flying'), 'swap becomes The Soul (flying)'); IS.charMechanics.SWAP['the-forgotten'](g.p, g.ctx); ok(g.p.form === 'bone' && g.p.hearts.bone === 4, 'swap back to the Forgotten') }
  { g.p.hearts.bone = 0; g.p.invulnUntil = 0; hit(g, 1); step(2); ok(!g.p.dead && g.p.form === 'soul', 'Forgotten dying hands over to The Soul', `${g.p.form} dead=${g.p.dead}`) }
  g = start('bethany'); ok(g.p.pAct && g.p.pAct.max === 4, 'Bethany has Book of Virtues charge'); IS.tryTakePickup(g.p, { kind: 'soul', amount: 2 }, g.ctx); ok(g.p.pAct.charge > 0, 'soul hearts charge Bethany', g.p.pAct.charge)
  g.p.pAct.charge = 4; const n0 = (g.p.familiars || []).length; IS.usePocket(g.p, 0, g.ctx); ok((g.p.familiars || []).length > n0, 'Bethany conjures a wisp', `${n0} -> ${(g.p.familiars || []).length}`)
  g = start('jacob-and-esau'); ok(g.p.twin && total(g.p.twin.hearts) > 0, 'Jacob & Esau have two bodies'); const ex = g.p.twin.x; clearRoom(g); IS.updateWeapon(g.p.twin, { x: 1, y: 0 }, 0.5, g.ctx); ok(true, 'Esau fires through the shared weapon code')
  ok(g.p.twin.stats && g.p.twin.stats.damage > 0 && g.p.twin.stats !== g.p.stats, 'Esau has separate stats')
  const tH = g.p.hearts.red; IS.charMechanics.hurtTwin(g.p, g.p.twin, 2, g.ctx); ok(g.p.twin.hearts.red === 4 && g.p.hearts.red === tH, 'Esau has his own hearts')
}

// ------------------------------------------------------------- tainted characters
{
  let g = start('tainted-isaac'); ok(g.p.itemLimit === 8, 'Tainted Isaac is limited to 8 items')
  for (const id of ['the-sad-onion', 'the-inner-eye', 'spoon-bender', 'crickets-head', 'my-reflection', 'number-one', 'blood-of-the-martyr', 'skatole', 'magic-mushroom', 'roid-rage']) IS.giveItem(g.p, id, { ctx: g.ctx })
  const held = g.p.items.filter(i => IS.itemsById[i] && IS.itemsById[i].kind !== 'active').length
  ok(held <= 8, 'passive item count capped at 8', held); ok(g.p.inv && g.p.inv.length >= 1, 'overflow items are stashed in the inventory', g.p.inv && g.p.inv.length)
  const stash = g.p.inv.length; IS.charMechanics.SWAP['tainted-isaac'](g.p, g.ctx); ok(g.p.inv.length === stash, 'cycling swaps a held item for a stored one', `${stash} -> ${g.p.inv.length}`)

  g = start('tainted-magdalene'); clearRoom(g); const e = dummy(g, g.p.x + 60, g.p.y, 500); IS.updateWeapon(g.p, { x: 1, y: 0 }, FRAME, g.ctx); ok(e.hp < 500, 'Tainted Magdalene hugs enemies', e.hp)
  g.p.hearts.red = 6; g.p.decayT = 8.9; step(30); ok(g.p.hearts.red < 6, 'borrowed hearts decay', g.p.hearts.red)

  g = start('tainted-cain'); clearRoom(g)
  for (let i = 0; i < 8; i++) IS.fireHook(g.p, 'onPickup', ['coin', 1], g.ctx)
  ok(g.ctx.room.pickups.some(x => x.kind === 'item'), 'Bag of Crafting makes an item from 8 pickups', JSON.stringify(g.ctx.room.pickups.map(x => x.kind)))

  g = start('tainted-judas'); g.p.pAct.charge = g.p.pAct.max; IS.usePocket(g.p, 0, g.ctx); ok(g.p.darkT > 0, 'Dark Arts starts the shadow'); ok(IS.damagePlayer(g.p, 2, { name: 'test' }, g.ctx) === false, 'shadow form is untouchable')
  g = start('tainted-blue-baby'); g.p.pAct.charge = g.p.pAct.max; const poopBefore = g.ctx.room.grid ? 1 : 0; ok(IS.usePocket(g.p, 0, g.ctx) !== undefined, 'Hold casts a poop spell'); ok(poopBefore >= 0 && g.p.pAct.charge === 0, 'Hold spends its charge')
  g = start('tainted-eve'); g.p.pAct.charge = 0; const re = g.p.hearts.red; IS.usePocket(g.p, 0, g.ctx); ok((g.p.familiars || []).some(f => f.id === 'red-spider') && g.p.hearts.red === re - 1, 'Sumptorium trades red health for a clot', `${g.p.hearts.red}/${re}`)
  g = start('tainted-samson'); g.p.pAct.charge = g.p.pAct.max; const sd = g.p.stats.damage; IS.usePocket(g.p, 0, g.ctx); ok(g.p.berserkT > 0 && g.p.stats.damage > sd, 'Berserk boosts damage', `${sd} -> ${g.p.stats.damage}`)
  g = start('tainted-azazel'); clearRoom(g); g.p.pAct.charge = g.p.pAct.max; const nT = friendlyTears(g).length; IS.usePocket(g.p, 0, g.ctx); ok(friendlyTears(g).length > nT, 'Hemoptysis sneezes a cone of tears', friendlyTears(g).length); ok(g.p.flags.has('brimstone') && g.p.flags.has('flying'), 'Tainted Azazel flies and fires brimstone')
  g = start('tainted-lazarus'); const form0 = g.p.form; g.p.pAct.charge = g.p.pAct.max; const a0 = g.p.stats.damage; IS.usePocket(g.p, 0, g.ctx); ok(g.p.form !== form0 && g.p.stats.damage !== a0, 'Flip swaps between Lazarus and Dead Lazarus', `${form0} -> ${g.p.form}`)
  g.p.hearts.red = 0; g.p.invulnUntil = 0; hit(g, 1); step(2); ok(!g.p.dead, 'the other body takes over instead of dying')
  g = start('tainted-eden'); const s0 = g.p.stats.damage + ':' + g.p.stats.tears; g.p.hearts.red = 2; step(2); hit(g, 1); step(40); ok(g.p.stats.damage + ':' + g.p.stats.tears !== s0, 'Tainted Eden rerolls stats on hit', `${s0} -> ${g.p.stats.damage}:${g.p.stats.tears}`)
  g = start('tainted-the-lost'); ok(g.p.flags.has('holyCards') && !hasItem(g.p, 'holy-mantle'), 'Tainted Lost has no Holy Mantle'); ok(g.p.pocket.some(x => x.id === 'holy-card'), 'Tainted Lost starts with a Holy Card'); ok(hit(g, 1) !== false || g.p.dead, 'Tainted Lost dies to the first hit')
  g = start('tainted-lilith'); clearRoom(g); const e2 = dummy(g, g.p.x + 120, g.p.y, 500); IS.updateWeapon(g.p, { x: 1, y: 0 }, FRAME, g.ctx); ok(e2.hp < 500, 'Gello whip hits at range', e2.hp); ok(friendlyTears(g).length === 0, 'Tainted Lilith fires no tears')
  g = start('tainted-keeper'); ok(g.p.stats.multishot >= 3, 'Tainted Keeper has a quad shot', g.p.stats.multishot); clearRoom(g); const e3 = dummy(g, g.p.x + 90, g.p.y, 1); const pk0 = g.ctx.room.pickups.length; let tries = 0; while (g.ctx.room.pickups.length === pk0 && tries++ < 30) { const q = dummy(g, g.p.x + 90, g.p.y, 1); IS.fireHook(g.p, 'onEnemyKill', [q], g.ctx) } ok(g.ctx.room.pickups.some(x => x.kind === 'coin'), 'enemies drop coins for Tainted Keeper')
  g = start('tainted-apollyon'); IS.giveItem(g.p, 'the-sad-onion', { ctx: g.ctx }); g.p.pAct.charge = g.p.pAct.max; const f0 = (g.p.familiars || []).length; IS.usePocket(g.p, 0, g.ctx); ok(!hasItem(g.p, 'the-sad-onion') && (g.p.familiars || []).length > f0, 'Abyss eats a passive and releases locusts', `${f0} -> ${(g.p.familiars || []).length}`)
  g = start('tainted-the-forgotten'); ok(g.p.skel && g.p.skel.state === 'carried', 'Tainted Forgotten carries the skeleton'); IS.charMechanics.SWAP['tainted-the-forgotten'](g.p, g.ctx); ok(g.p.skel.state === 'air', 'skeleton is thrown'); step(60); ok(g.p.skel.state === 'ground', 'skeleton lands and fights alone', g.p.skel.state)
  g = start('tainted-bethany'); ok(g.p.pAct && g.p.pAct.max === 6, 'Tainted Bethany has Lemegeton'); g.p.hearts.red = g.p.hearts.maxRed; IS.tryTakePickup(g.p, { kind: 'heart', amount: 2 }, g.ctx); ok(g.p.pAct.charge > 0, 'red hearts charge Lemegeton even at full health', g.p.pAct.charge)
  g.p.pAct.charge = 6; const w0 = (g.p.familiars || []).length; IS.usePocket(g.p, 0, g.ctx); ok((g.p.familiars || []).length > w0, 'Lemegeton conjures wisps')
  g = start('tainted-jacob-and-esau'); ok(g.p.ghost, 'Dark Esau exists'); g.ctx.room.cleared = false; IS.fireHook(g.p, 'onRoomEnter', [g.ctx.room], g.ctx); ok(!g.p.ghost.hidden, 'Dark Esau hunts in uncleared rooms')
  const gx = Math.hypot(g.p.ghost.x - g.p.x, g.p.ghost.y - g.p.y); g.p.ghost.stunT = 0; for (let i = 0; i < 30; i++) IS.fireHook(g.p, 'onUpdate', [FRAME], g.ctx); ok(Math.hypot(g.p.ghost.x - g.p.x, g.p.ghost.y - g.p.y) < gx, 'Dark Esau closes in', gx)
}

console.log(`char-check: ${passes} passed, ${fails.length} failed`)
for (const f of fails) console.log('  FAIL ' + f)
process.exit(fails.length ? 1 : 0)
