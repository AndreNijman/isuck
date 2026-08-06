# ISUCK — engine contract

A from-scratch browser roguelike in the shape of *The Binding of Isaac: Repentance*.
Original code, original procedural art, synthesised audio. Item, enemy, boss and
floor **names** are the real ones; every pixel and sample is generated at runtime.

This document is **frozen**. Every file codes against these signatures. If you
must change something here, change it deliberately, bump the *Revision*, and
re-run `node tools/validate-content.mjs && node tools/smoke.mjs`. A silent
divergence between this file and the code is the most expensive failure mode in
this project — a data file that loads fine and silently no-ops.

**Revision:** 1 · 2026-08-06

---

## 0. Hard constraints

| Constraint | Why |
|---|---|
| Vanilla JS. No dependencies, no build step, no bundler. | House style — matches `AndreNijman/overpop`, `AndreNijman/topout`. |
| **Classic `<script src>` only. No ES modules in the browser bundle.** | The game must run by double-clicking `index.html`. ES modules fail under `file://` (CORS). |
| Every file wraps itself in an IIFE and attaches to the single global `IS`. | No leaked top-level bindings, no load-order surprises beyond the declared one. |
| **All paths relative.** Never `/js/x.js`, always `js/x.js`. | Ships on GitHub Project Pages at `/isuck/`, so absolute paths 404. |
| All art drawn procedurally on canvas. All audio synthesised in WebAudio. | Zero asset files. |
| The sim reads randomness **only** from an `IS.RNG` instance. `Math.random()` is banned outside `js/render/` and `js/core/audio.js`. | Seeded runs must replay identically. |
| No `innerHTML` with interpolated data, no `eval`. | Trivially avoidable class of bug. |
| Every new `js/**/*.js` file MUST be added to the `<script>` list in `index.html`. | An unwired file is the other silent failure mode. `tools/validate-content.mjs` enforces it. |

### File preamble (every JS file, no exceptions)

```js
;(function (IS) {
  'use strict'
  // ...
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
```

### Registration style

Data files **push into registries** that `js/core/const.js` created. They never
assume they are first or last:

```js
IS.defineItems([ {...}, {...} ])      // items, actives, familiars-as-items
IS.defineTrinkets([ {...} ])
IS.defineCards([ {...} ])             // cards, runes, soul stones, special
IS.definePills([ {...} ])
IS.defineEnemies([ {...} ])
IS.defineBosses([ {...} ])
IS.defineRooms([ {...} ])
IS.defineFloors([ {...} ])
IS.defineCharacters([ {...} ])
IS.defineChallenges([ {...} ])
IS.defineAchievements([ {...} ])
IS.defineFamiliars([ {...} ])         // familiar behaviour defs (see §7)
IS.defineSprite(name, drawFn)         // see §12
IS.defineArchetype(name, fn)          // enemy AI (see §6)
IS.defineAttack(name, fn)             // boss attack (see §7)
```

Each `defineX` throws on a duplicate `id`. That is intentional — collisions are
bugs, not merges.

---

## 1. Units, coordinates, grid

| Quantity | Unit |
|---|---|
| Space | Logical units. `IS.TILE = 80`. |
| Time | Seconds. Fixed tick `IS.DT = 1/60`. |
| Speed | Units per second. |
| Angle | Radians, `0` = +x (right), increasing clockwise on screen (y down). |

A **standard room** is 13 × 7 walkable tiles.

```
IS.TILE      = 80
IS.ROOM_W    = 13                       // walkable tiles across
IS.ROOM_H    = 7                        // walkable tiles down
IS.ROOM_PX_W = 13 * 80 = 1040           // walkable width  in units
IS.ROOM_PX_H = 7  * 80 = 560            // walkable height in units
IS.VIEW_W    = 1280                     // logical canvas
IS.VIEW_H    = 720
```

**World space** = room-local units. The walkable interior of a 1×1 room is
`x ∈ [0, 1040]`, `y ∈ [0, 560]`. Walls occupy the border *outside* that box; a
wall is 80 units thick and is not walkable. Grid cell `(col, row)` with
`col ∈ [0,12]`, `row ∈ [0,6]` has centre `(col*80 + 40, row*80 + 40)`.

Helpers (in `js/core/math.js`, do not reimplement):

```js
IS.cellCenter(col, row)   -> {x, y}
IS.cellOf(x, y)           -> {col, row}          // clamped to the room
IS.inBounds(room, x, y, r)-> bool                // r = entity radius
IS.clampToRoom(room, ent)                        // mutates ent.x/ent.y
```

**Room shapes.** `shape` is one of `'1x1' | '1x2' | '2x1' | '2x2' | 'LTL' | 'LTR' | 'LBL' | 'LBR'`
(`1x2` = two rooms tall, `2x1` = two rooms wide, `L*` = 2×2 with one quadrant
missing, named for the missing corner). `room.w` / `room.h` are the walkable
extents **in tiles**, so a `2x1` room is `w=26, h=7` and `x ∈ [0, 2080]`. The
camera (§13) pans for anything bigger than 1×1. Never hardcode 1040/560 outside
`const.js`; use `room.pxW`, `room.pxH`.

**Doors** sit at the midpoint of each wall segment: for a 1×1 room, `left` at
`(-40, 280)`, `right` at `(1080, 280)`, `up` at `(520, -40)`, `down` at
`(520, 600)`. `room.doors` is an array of `{dir, x, y, kind, locked, open, target}`
where `dir ∈ 'left'|'right'|'up'|'down'` and `kind ∈ 'normal'|'treasure'|'shop'|
'boss'|'secret'|'super-secret'|'ultra-secret'|'devil'|'angel'|'curse'|'arcade'|
'library'|'sacrifice'|'challenge'|'boss-rush'|'dice'|'planetarium'|'vault'|
'bedroom'|'black-market'|'mineshaft'|'locked'|'mom-locked'`.

---

## 2. Namespace map and load order

`index.html` loads, in this order (this *is* the dependency order):

```
js/core/const.js      IS.TILE…, all enums, every defineX registry
js/core/math.js       vectors, geometry, easing, grid helpers
js/core/rng.js        IS.RNG, seed strings
js/core/save.js       localStorage: unlocks, bestiary, stats, options, continue-run
js/core/audio.js      IS.audio.*  (synth sfx + procedural floor music)
js/core/input.js      IS.input.*  (keyboard, mouse, gamepad, rebinding)
js/core/fx.js         IS.fx.*     (particles, shake, floaters, decals, creep)

js/engine/entity.js   base entity ops: damage, knockback, status effects
js/engine/tears.js    player tears, enemy shots, lasers, knives, bombs
js/engine/player.js   stat recalc, movement, firing, hearts, actives, pockets
js/engine/familiar.js familiar update dispatch
js/engine/enemy.js    enemy spawn/update/death, champions
js/engine/boss.js     boss phase controller + attack dispatch
js/engine/room.js     room instance, grid objects, clear logic, pickups
js/engine/pool.js     item pools, weighted pick, devil/angel/planetarium odds
js/engine/floor.js    floor layout generation, special rooms, alt paths, curses
js/engine/interact.js doors, trapdoors, crawlspaces, chests, shops, machines
js/engine/progress.js achievements, unlocks, bestiary, challenge rules

js/data/*.js          content (order-independent among themselves)

js/render/sprites-*.js procedural sprite draw functions
js/render/backdrop.js  floor/wall/obstacle art per palette
js/render/render.js    camera, scene composition, lighting
js/render/hud.js       hearts, consumables, active, pockets, minimap
js/ui/*.js             screens (title, character select, pause, stats, …)

js/main.js            boot, screen state machine, fixed-step loop
```

`js/main.js` is always last. Data files never call engine functions at load
time — only inside hooks.

---

## 3. Randomness and determinism

```js
const rng = new IS.RNG(seedNumber)
rng.next()                 -> float [0,1)
rng.int(n)                 -> int [0,n)
rng.range(a, b)            -> float [a,b)
rng.pick(array)            -> element
rng.shuffle(array)         -> new shuffled array
rng.chance(p)              -> bool
rng.fork()                 -> new independent IS.RNG        // for sub-generators
IS.seedToString(n)         -> 'AB1C 2D3E'   (Isaac-style, 8 chars, no I/O/U/V/1/0/5)
IS.stringToSeed(s)         -> number | null
```

A run holds `run.rng` (gameplay), `run.floorRng` (layout, forked per floor) and
`run.poolRng` (item picks). Never reach for a different stream than the one the
subsystem owns — that is what makes seeds reproducible.

**Luck-aware chances.** All proc rolls go through:

```js
IS.luckChance(base, perLuck, cap, luck)   -> probability
// e.g. IS.luckChance(0.05, 0.05, 0.5, p.stats.luck)
ctx.roll(base, perLuck, cap)              -> bool, uses run.rng and player luck
```

---

## 4. The player and the stat block

`run.player` (also `p`) is a plain object. The only fields data files may touch
are documented here.

```js
p = {
  charId: 'isaac',
  x, y, vx, vy, r: 26,           // r = collision radius in units
  head: {x, y},                  // aim direction unit vector
  items: ['sad-onion', ...],     // collectible ids in pickup order
  itemCounts: {'sad-onion': 1},
  trinkets: [null, null],        // ids, slot 2 unlocked by Mom's Purse
  active: [ {id, charge, maxCharge, batteryCharge} | null, null ],
  pocket: [ {kind:'card'|'pill'|'rune'|'soulstone', id} , ...],   // 1–4 slots
  hearts: {
    red: 6, maxRed: 6,           // half-heart units! 2 = one full heart
    soul: 0, black: 0, eternal: 0, gold: 0, bone: 0, rotten: 0,
    broken: 0
  },
  coins: 0, bombs: 1, keys: 0,   // 99 caps; goldenBomb/goldenKey are flags
  goldenBomb: false, goldenKey: false,
  stats: { …see below… },
  base:  { …character base stats… },
  flags: Set,                    // see §5.4
  status: {},                    // active status effects on the player
  transforms: {},                // 'guppy': 2   (count of contributing items)
  invulnUntil: 0, dead: false,
  cache: {}                      // scratch for item hooks — namespace your keys!
}
```

### 4.1 Stat block

`p.stats` is recomputed from scratch by `IS.recalcStats(p)` whenever items
change. **Never mutate `p.stats` directly from a hook** — declare `stats` /
`mult` on the item, or use `onStats`.

```js
p.stats = {
  damage,        // final per-tear damage. Isaac base 3.5
  tears,         // tears per second (see formula below). base 2.73
  fireDelay,     // seconds between shots = 1/tears (derived, do not set)
  range,         // tear travel distance in units. base 520
  shotSpeed,     // multiplier on tear velocity. base 1.0 -> 620 units/s
  speed,         // multiplier on move speed. base 1.0 -> 300 units/s, cap 2.0
  luck,          // base 0
  tearSize,      // tear radius multiplier, base 1.0
  multishot,     // extra simultaneous tears, base 0
  devilChance,   // additive bonus, base 0
  angelChance,
  bombDamage,    // base 60
  shieldCount    // Holy Mantle-style pre-hit shields
}
```

**Damage** (faithful): `damage = (base + Σ flatUp) * Π mult`, where a "damage up"
of `+1` is `flatUp += 1`. Items that state a multiplier use `mult`.
Floor: `damage = max(damage, 1)`.

**Tears / fire delay** (faithful): Isaac stores `maxFireDelay` in frames, and
`tears = 30/(delay+1)`. A "tears up" of `+0.7` is applied in *tears* space:

```js
IS.tearsToDelay(tears)  -> frames = 30/tears - 1
IS.delayToTears(frames) -> 30/(frames+1)
// base delay 10 frames -> 2.7273 tears/s
```
Additive `stats.tears` sums in tears space, then `fireDelay = 1/tears` seconds.
`mult.fireDelay` multiplies the *delay* (so `0.5` = twice as fast). Cap:
`tears ≤ 30` (delay 0 frames).

**Range** is distance in units, base `520` (6.5 tiles). `stats.range += 80` is
"one tile more". Floor `160`.

**Speed** caps at `2.0` and floors at `0.1`.

### 4.2 Hearts

All heart amounts are in **half-heart units**. `maxRed: 6` = three full
containers. Damage subtracts from soul/black hearts first (Isaac order:
`bone → red/rotten → black/soul` for *shields*, and `soul/black → red` for
depletion order — implemented once in `IS.damagePlayer`, never duplicated).
`p.hearts.broken` (Broken Hearts) reduces effective max containers.

### 4.3 Player API (engine-owned, callable from hooks)

```js
IS.recalcStats(p)
IS.damagePlayer(p, halfHearts, source, ctx)   -> bool actually took damage
IS.healRed(p, halfHearts)
IS.addSoulHearts(p, n) / IS.addBlackHearts(p, n) / IS.addBoneHearts(p, n)
IS.addMaxHearts(p, n, alsoHeal)
IS.addCoins(p, n) / IS.addBombs(p, n) / IS.addKeys(p, n)
IS.giveItem(p, itemId, opts)      // opts: {noAnim, fromPool}
IS.removeItem(p, itemId)
IS.hasItem(p, itemId)             -> bool
IS.giveTrinket(p, id) / IS.dropTrinket(p, slot)
IS.givePocket(p, kind, id)        // card/pill/rune/soulstone
IS.addCharge(p, slot, n)
IS.applyStatus(ent, status, seconds, ctx)
IS.killPlayer(p, ctx)             // runs revive hooks first
```

---

## 5. Collectibles: items, trinkets, cards, pills

### 5.1 Item definition

```js
{
  id: 'sad-onion',            // kebab-case, unique across ALL items
  num: 1,                     // real Isaac collectible number, for reference/sort
  name: 'Sad Onion',
  desc: 'Tears up',           // the pickup banner text
  info: '+0.7 tears',         // one-line mechanical note for the collection screen
  kind: 'passive',            // 'passive' | 'active' | 'familiar'
  quality: 1,                 // 0..4
  pools: ['treasure', 'shop'],
  tags: ['tears', 'offensive'],           // free-form, see §5.5
  rep: true,                  // optional: added in Repentance
  dlc: 'rebirth'|'afterbirth'|'afterbirth+'|'repentance',

  // declarative effects — prefer these over hooks
  stats:  { tears: 0.7 },                 // additive, keys from §4.1
  mult:   { damage: 1.5, fireDelay: 0.5 },
  grant:  { maxHearts: 2, heal: 2, soul: 1, black: 1, bombs: 5, keys: 1,
            coins: 10, cards: ['the-fool'], pills: 1, trinkets: ['petrified-poop'] },
  flags:  ['flying', 'spectral'],          // §5.4
  tearFlags: ['piercing', 'poison'],       // §5.3 — applied to every tear
  familiars: ['brother-bobby'],            // §7.3 ids, spawned on pickup
  transform: 'guppy',                      // §5.6

  // actives only
  charge: 4,                  // room charges; 0 = always usable
  chargeType: 'normal',       // 'normal' | 'timed' | 'special' | 'battery-only'
  chargeTime: 0,              // seconds, for chargeType 'timed'

  hooks: { … §5.2 … },
  unlock: null                // achievement id required, or null for always-on
}
```

### 5.2 Hook vocabulary — **THE COMPLETE LIST**

Any key in `hooks` outside this list is a validation error. Every hook receives
`ctx` (§9) as its last argument. Hooks are called in item pickup order.

| Hook | Signature | Notes |
|---|---|---|
| `onInit` | `(p, ctx)` | item granted (also on run resume) |
| `onRemove` | `(p, ctx)` | item lost (Black Candle, D4 reroll…) |
| `onStats` | `(p, s)` | mutate stat block `s` during recalc. **Must be pure & idempotent.** No RNG, no spawning. |
| `onUpdate` | `(p, dt, ctx)` | every tick |
| `onTearFire` | `(p, tear, ctx)` | mutate the tear just created; may spawn extra |
| `onTearHit` | `(p, tear, enemy, ctx)` | tear connected with an enemy |
| `onTearDeath` | `(p, tear, ctx)` | tear expired or hit a wall |
| `onEnemyDamage` | `(p, enemy, dmg, ctx)` | return a number to override damage |
| `onEnemyKill` | `(p, enemy, ctx)` | |
| `onPlayerDamage` | `(p, amount, source, ctx)` | return `{cancel:true}` to negate, or a number to change the amount |
| `onPlayerDeath` | `(p, ctx)` | return `{revive:true}` to resurrect |
| `onRoomEnter` | `(p, room, ctx)` | check `room.firstVisit` |
| `onRoomClear` | `(p, room, ctx)` | |
| `onNewFloor` | `(p, floor, ctx)` | |
| `onPickup` | `(p, kind, amount, ctx)` | `kind ∈ 'coin'|'key'|'bomb'|'heart'|'soul'|'black'|'card'|'pill'|'rune'|'trinket'|'battery'|'chest'|'sack'|'item'` |
| `onBombExplode` | `(p, bomb, ctx)` | |
| `onGridBreak` | `(p, grid, ctx)` | rock/poop/TNT/mushroom destroyed |
| `onUse` | `(p, ctx)` | **actives only.** Return `{consumed:true}` to remove the item, `{keepCharge:true}` to not discharge, `{fail:true}` to refund |
| `onCardUse` | `(p, cardId, ctx)` | fires before the card resolves; return `{cancel:true}` |
| `onPillUse` | `(p, pillId, ctx)` | |
| `onPurchase` | `(p, entry, ctx)` | shop/devil/angel purchase completed |
| `onDoorOpen` | `(p, door, ctx)` | |
| `onFloorClear` | `(p, floor, ctx)` | boss of the floor died |
| `onCurseEval` | `(p, curses, ctx)` | return a modified curse bitmask |

There is no `onSecond`, no `onFrame`, no `onKill`, no `onHit`, no `onDamage`.
Use the exact names above.

### 5.3 Tear flags — **THE COMPLETE LIST**

`tearFlags` on an item, or `tear.flags` (a `Set`) at runtime:

```
piercing  spectral  homing  bouncing  splitting  continuous  explosive
poison    burn      freeze  slow      charm      fear        confusion
bleed     shrink    petrify baited    magnetize  midas       knockback
light     holy      ice     rock      booger    sticky      lodge
tinyplanet  wiggle   sinusoid  boomerang  chain   orbit      spin
laser     brimstone knife    ludo      cupid     technology  godhead
lump      pop       nail     glitter  black-hole  quad-shot
```

Runtime application is centralised in `IS.applyTearFlags(tear, p)` and
`IS.onTearImpact(tear, enemy, ctx)` — data files never implement a flag's
behaviour themselves.

### 5.4 Player flags — **THE COMPLETE LIST**

```
flying  spectralTears  piercingTears  homingTears  ignoreRocks
noRedHearts  keeperHearts  boneHearts  soulOnly  cantHeal
brimstone  laser  knife  bookOfVirtues  bloodOath
seeSecretRooms  seeItemPools  seeEnemyHealth  seeMinimap  fullMinimap
freeDevilDeals  freeShopItems  cursedDoors  luckyFooting  noKnockback
doubleTears  quadTears  eternalDeath  gnawedLeaf  camoUndies
```

### 5.5 Tag vocabulary (free-form but prefer these)

`offensive defensive utility familiar consumable tears damage speed range luck
hearts bombs keys coins devil angel guppy fly poop spider syringe mushroom baby
book pill card battery beggar shop curse revive charge chargeless orbital
follower laser brimstone knife pet transformation stat-down downgrade
quality-shift greed challenge-only unlockable`

### 5.6 Transformations

`transform` is one of `guppy leviathan fun-guy seraphim bob spun mom mushroom
angel bookworm adult spider stompy conjoined`. Three contributing items grant
the transformation; `IS.checkTransforms(p, ctx)` handles it.

### 5.7 Trinkets

Same schema, `kind: 'trinket'`, plus `golden: true` support is automatic
(Mom's Box / golden trinkets double `stats`/`mult` and set
`ctx.goldenTrinket === true` inside hooks).

### 5.8 Cards, runes, soul stones, special

```js
{ id:'the-fool', num:1, name:'0 - The Fool', kind:'card',
  cardType:'tarot'|'reverse-tarot'|'rune'|'soul-stone'|'special'|'suit',
  desc:'Teleports you to the starting room',
  use(p, ctx) { … } }        // NOT hooks — a single `use` function
```

### 5.9 Pills

```js
{ id:'balls-of-steel', name:'Balls of Steel', good:true,
  horse:false,               // true = the horse-pill variant is defined separately
  desc:'+2 soul hearts',
  use(p, ctx, horse) { … } }
```

Pill *colours* are assigned per-run by `IS.assignPillColours(run)`; data files
never hardcode a colour.

---

## 6. Enemies

```js
{
  id: 'gaper', name: 'Gaper',
  hp: 10, r: 22,                  // radius in units
  speed: 110,                     // units/s
  dmg: 1,                         // half-hearts on contact
  flying: false,                  // ignores pits/rocks, renders with shadow
  archetype: 'chaser',            // §6.1 — must exist in the registry
  params: { accel: 700, jitter: 0.2 },
  sprite: 'gaper',                // §12 — must exist in the sprite registry
  tint: '#c9b7a0',
  champion: true,                 // may roll a champion variant
  splitInto: null,                // e.g. ['baby-gaper','baby-gaper'] on death
  friendlyFireImmune: false,
  boss: false,
  mini: false,                    // mini-boss (Sloth, Envy, …)
  floors: ['basement','caves'],   // where it may appear (informational; room
                                  // templates decide actual placement)
  bestiary: 'One line of flavour for the bestiary screen.'
}
```

### 6.1 Archetypes — **THE COMPLETE LIST**

Registered in `js/engine/enemy.js`. `IS.defineArchetype(name, fn)` where
`fn(e, dt, ctx)` runs each tick. Data may only reference these:

```
idle          stationary, contact damage only
chaser        walks straight at the player
chaserSlow    chaser with slow acceleration and overshoot
wanderer      random walk, changes direction on a timer
patroller     paces along an axis, reverses on walls
charger       winds up, then dashes in a straight line
leaper        hops toward the player in arcs
jumper        vertical hop, lands with a shockwave
flyerChase    flying chaser, ignores obstacles
flyerDrift    flying sine-wave drift
flyerOrbit    orbits the player at a radius
flyerDart     hovers, then darts fast in a straight line
shooter       stationary, fires aimed shots on a cadence
shooterMobile walks and fires
spitter       lobs arcing projectiles
sprayer       fires a fan/ring on a cadence
laserer       telegraphs then fires a beam
burrower      submerges, moves underground, resurfaces near the player
teleporter    blinks around the room
splitter      chaser that splits on death (see splitInto)
exploder      chases and self-destructs
summoner      spawns other enemies on a cadence
shielded      immune from the front; must be hit from behind
trailLayer    leaves creep/fire behind it
boomerang     flies out and returns
mimic         disguised as a pickup until approached
sucker        latches onto the player and drains
guard         stands in front of another enemy and blocks shots
spinner       spins in place firing radially
swarm         moves as a loose flock with siblings
wallHugger    crawls along the walls
grid          fixed to a grid cell (fires, poop-bound)
ghost         spectral: passes through everything, phases in and out
bomber        drops live bombs
grubber       burrows in a straight line, damaging the floor
climber       clings to the ceiling and drops
```

### 6.2 Enemy API

```js
IS.spawnEnemy(room, id, x, y, opts)  -> enemy
IS.damageEnemy(enemy, dmg, opts, ctx)
IS.killEnemy(enemy, ctx)
IS.enemyShoot(enemy, opts, ctx)      // opts: {angle, speed, dmg, flags, count, spread, arc}
IS.applyStatus(enemy, status, seconds, ctx)
```

Champion variants (`IS.CHAMPIONS`) are engine-side: `red flashing-red black
blue green yellow white pink orange grey purple camo` with their canonical
modifiers. Data files do not implement champions.

---

## 7. Bosses, familiars, attacks

### 7.1 Boss definition

```js
{
  id: 'monstro', name: 'Monstro',
  hp: 250, r: 46, dmg: 1,
  sprite: 'monstro',
  stage: ['basement'],            // floors it can be the boss of
  double: true,                   // may appear as a double-trouble pair
  mini: false,
  bestiary: '…',
  phases: [
    { hpAbove: 0.5,               // active while hp fraction > 0.5
      attacks: ['hop', 'spreadShot'],
      weights: [2, 1],
      cooldown: [1.1, 1.8] },     // seconds between attacks, random in range
    { hpAbove: 0,
      attacks: ['hop', 'spreadShot', 'tearRain'],
      weights: [2, 2, 1],
      cooldown: [0.8, 1.4],
      speedMult: 1.25 }
  ],
  onSpawn(b, ctx) {},             // optional
  onDeath(b, ctx) {},             // optional; engine handles the boss-death drop
  params: { hopHeight: 90 }
}
```

### 7.2 Attack library — **THE COMPLETE LIST**

`IS.defineAttack(name, fn)` where `fn(b, dt, state, ctx) -> bool done`.
Bosses reference these by name only:

```
hop            chargeDash      spreadShot      ringShot       aimedShot
barrage        burstShot       spinShot        tearRain       homingShots
laserSweep     laserCross      brimstoneBeam   chargeBeam     beamRing
spawnMinions   summonSwarm     splitBody       shieldPhase    creepPuddle
groundSpikes   stompLine       fistSlam        teleportSlam   quakeRings
bombDrop       rockThrow       vomitStream     wallBounceShots retreatVolley
chaseFast      orbitalShots    tentacleWhip    portalSpawn    delayedRings
rainbowSpray   suctionPull     dashRingCombo   crawlCharge    mirrorShots
knifeThrow     bookRain        heartBeam       screamPush     phaseInvuln
```

### 7.3 Familiars

```js
{ id:'brother-bobby', name:'Brother Bobby', sprite:'bobby',
  behaviour:'orbitShooter',        // §7.4
  params:{ dmg:3.5, fireDelay:0.5, range:520, orbitR:70 } }
```

### 7.4 Familiar behaviours — **THE COMPLETE LIST**

```
follower        trails the player, fires at nearest enemy
orbitShooter    orbits the player, fires
orbital         orbits and body-blocks shots
chaser          flies at enemies and rams them
stationaryDrop  stays where dropped, fires
wanderer        wanders the room, contact damage
collector       picks up nearby pickups / drops coins
buffer          passive: buffs the player, no combat
laserFamiliar   fires a beam on a cadence
bomber          drops bombs
shielder        blocks projectiles in front of the player
summoner        spawns temporary allies
copycat         mirrors the player's tears at reduced damage
```

---

## 8. Rooms and floors

### 8.1 Room template

ASCII layouts. **Exactly `w` characters per row, `h` rows** for the shape.

```js
{
  id: 'basement-c-004',
  type: 'default',             // §8.2
  shape: '1x1',
  floors: ['basement','cellar','burning-basement'],   // or ['*']
  weight: 1,
  difficulty: 1,               // 1..5, gates by floor depth
  subtype: 0,                  // for shops/challenge rooms etc.
  layout: [
    '.............',
    '..#.......#..',
    '.....a.a.....',
    '..#.......#..',
    '.....a.a.....',
    '..#.......#..',
    '.............'
  ],
  legend: { a: 'gaper' }       // letters -> enemy id (or 'boss:monstro')
}
```

**Grid characters — THE COMPLETE LIST** (anything else is a validation error):

| Char | Meaning |
|---|---|
| `.` | empty floor |
| `#` | rock |
| `x` | tinted rock (drops a pickup) |
| `X` | super tinted / marked skull rock |
| `M` | metal block (indestructible) |
| `B` | bomb-only block (pillar) |
| `P` | poop |
| `G` | golden poop |
| `R` | red poop |
| `C` | corn poop (Repentance) |
| `S` | spikes |
| `s` | retracting spikes |
| `O` | pit |
| `o` | pit with a bridge |
| `W` | spider web |
| `F` | fireplace |
| `f` | blue fireplace |
| `T` | TNT barrel |
| `K` | key block |
| `L` | locked chest spawn |
| `H` | mushroom (Repentance) |
| `V` | vase / pot |
| `~` | water / slow floor |
| `%` | crawlspace hatch candidate |
| `!` | pickup spawn (random) |
| `$` | shop slot |
| `@` | player-safe zone (never spawn anything here) |
| `a`–`z`, `0`–`9` | legend entry |

### 8.2 Room types

```
default treasure shop boss secret super-secret ultra-secret curse sacrifice
arcade library devil angel challenge boss-rush dice planetarium vault bedroom
dirty-bedroom black-market miniboss error start crawlspace boss-double
mineshaft chest-room ascent-mirror
```

### 8.3 Floor definition

```js
{
  id: 'basement', name: 'Basement', depth: 1,
  variants: ['cellar','burning-basement'],
  altPath: 'downpour',            // Repentance alt floor at this depth, or null
  rooms: [6, 9],                  // min/max non-special rooms
  bosses: ['monstro','larry-jr','dingle','gemini','duke-of-flies','famine',
           'the-haunt','little-horn','baby-plum'],
  enemyPool: ['gaper','pooter','fly','clotty','horf','mulligan'],
  palette: { wall:'#6c5a4a', wallDark:'#4a3d31', floor:'#8a7461',
             floorAlt:'#7c6754', accent:'#b04a3a', creep:'#7a2a22',
             backdrop:'#2b241d' },
  music: { root: 'A', mode:'aeolian', tempo: 96, mood:'calm' },
  hazards: ['spikes','fire'],
  curseWeights: { darkness: 1, labyrinth: 1, lost: 1, maze: 1, blind: 1 }
}
```

Floor ids (all of Repentance, in depth order):

```
depth 1: basement | cellar | burning-basement || downpour | dross
depth 2: basement-2 …                          || downpour-2 | dross-2
depth 3: caves | catacombs | flooded-caves     || mines | ashpit
depth 4: caves-2 …                             || mines-2 | ashpit-2
depth 5: depths | necropolis | dank-depths     || mausoleum | gehenna
depth 6: depths-2 …                            || mausoleum-2 | gehenna-2
depth 7: womb | utero | scarred-womb           || corpse
depth 8: womb-2 …                              || corpse-2
depth 9: blue-womb (⌛)
depth 10: sheol | cathedral
depth 11: dark-room | the-chest
depth 12: the-void
ascent: ascent-1 … ascent-4, home, mothers-shadow
greed:  greed-basement … greed-shop, greed-ultra
```

### 8.4 Curses

```
IS.CURSE = { DARKNESS:1, LABYRINTH:2, LOST:4, UNKNOWN:8, MAZE:16, BLIND:32, GIANT:64 }
```

### 8.5 Item pools — **THE COMPLETE LIST**

```
treasure shop boss devil angel secret library curse golden-chest red-chest
beggar demon-beggar key-master battery-bum moms-chest crane-game bomb-bum
planetarium old-chest baby-shop wooden-chest rotten-beggar ultra-secret
greed-treasure greed-boss greed-shop greed-devil greed-angel greed-curse
greed-secret greed-library
```

---

## 9. `ctx` — the one object every hook gets

```js
ctx = {
  run, floor, room, player, rng,        // rng === run.rng
  dt,
  // spawning
  spawnEnemy(id, x, y, opts), spawnBoss(id, x, y, opts),
  spawnTear(opts), spawnEnemyShot(opts), spawnBomb(x, y, opts),
  spawnPickup(kind, x, y, opts),        // kind: 'coin'|'key'|'bomb'|'heart'|
                                        // 'soul'|'black'|'card'|'pill'|'rune'|
                                        // 'trinket'|'battery'|'chest'|'sack'|'item'
  spawnLaser(opts), spawnKnife(opts), spawnEffect(name, x, y, opts),
  spawnFamiliar(id, opts), spawnCreep(x, y, r, opts), spawnPoop(x, y),
  // player shortcuts (thin wrappers over §4.3)
  damagePlayer(n, src), healRed(n), addSoul(n), addBlack(n), addBone(n),
  addMaxHearts(n, heal), addCoins(n), addBombs(n), addKeys(n), addCharge(n, slot),
  giveItem(id, opts), removeItem(id), hasItem(id), giveTrinket(id),
  givePocket(kind, id), useCard(id), usePill(id), applyStatus(ent, s, secs),
  // queries
  enemies(), livingEnemies(), nearestEnemy(x, y), randomEnemy(),
  freeFloorPos(), gridObjects(), pickups(),
  roomCleared(), isBossRoom(), floorDepth(),
  // rolls
  roll(base, perLuck, cap), chance(p), pick(arr), int(n), range(a, b),
  // world actions
  clearRoom(), openDoors(), unlockDoor(kind), spawnTrapdoor(), spawnCrawlspace(),
  rerollPedestals(), rerollPlayerItems(), teleport(target), rewind(),
  bombExplode(x, y, opts), destroyGrid(g), charmAllEnemies(secs),
  // pools
  rollItem(pool, opts) -> itemId, rollTrinket(), rollCard(), rollPill(), rollRune(),
  // presentation
  sfx(name, opts), music(cmd), shake(amount, secs), floater(text, x, y, colour),
  banner(title, subtitle), log(msg),
  // meta
  goldenTrinket: false, fromTrinket: false, sourceItemId: 'sad-onion'
}
```

If a hook needs something not on this list, add it to `js/engine/ctx.js`'s
builder **and to this table**, in the same commit.

---

## 10. Characters

```js
{
  id:'isaac', name:'Isaac',
  tainted:false, altOf:null,          // tainted Isaac: {tainted:true, altOf:'isaac'}
  sprite:'isaac',
  base:{ damage:3.5, tears:2.7273, range:520, shotSpeed:1, speed:1, luck:0 },
  hearts:{ red:6, maxRed:6, soul:0, black:0, bone:0, broken:0 },
  coins:0, bombs:1, keys:0,
  items:['d6'], trinkets:[], pocket:[],
  flags:[],                            // e.g. ['flying','noRedHearts']
  special:'',                          // engine-side special rule key, see below
  desc:'The everyman. Starts with the D6.',
  unlock:null
}
```

`special` keys the engine implements: `''` (none), `blue-baby`, `the-lost`,
`keeper`, `apollyon`, `forgotten`, `bethany`, `jacob-esau`, `eden`,
`tainted-isaac`, `tainted-magdalene`, `tainted-cain`, `tainted-judas`,
`tainted-blue-baby`, `tainted-eve`, `tainted-samson`, `tainted-azazel`,
`tainted-lazarus`, `tainted-eden`, `tainted-lost`, `tainted-lilith`,
`tainted-keeper`, `tainted-apollyon`, `tainted-forgotten`, `tainted-bethany`,
`tainted-jacob`.

---

## 11. Challenges and achievements

```js
// challenge
{ id:'pitch-black', num:1, name:'Pitch Black', charId:'isaac',
  items:['the-halo-of-flies'], trinkets:[], pocket:[],
  hearts:{ maxRed:6, red:6 }, curses:['darkness'],
  goal:'mom',                          // 'mom'|'mom-heart'|'isaac'|'???'|'satan'|
                                       // 'lamb'|'mega-satan'|'delirium'|'mother'|
                                       // 'beast'|'boss-rush'|'depth-2'
  rules:{ noItems:false, noHeartDrops:false, forcedFloor:null, big:false },
  desc:'…', unlock:null }

// achievement
{ id:'ach-cain', name:'Cain', kind:'character',
  unlocks:{ character:'cain' },        // or { item:'…' }, { trinket:'…' },
                                       // { card:'…' }, { pill:'…' }, { challenge:'…' },
                                       // { floor:'…' }, { room:'…' }, { cosmetic:'…' }
  condition:{ type:'coins-in-run', value:55 },
  desc:'Hold 55 coins at once.' }
```

Condition types the engine evaluates (`js/engine/progress.js`):
`defeat-boss`, `defeat-boss-as`, `complete-floor`, `complete-challenge`,
`coins-in-run`, `bombs-in-run`, `keys-in-run`, `items-in-run`, `donate`,
`donate-greed`, `blow-up-beggars`, `full-hp-boss`, `no-damage-floor`,
`streak-wins`, `kill-count`, `use-item`, `visit-room`, `beat-boss-rush`,
`beat-hush`, `beat-delirium`, `beat-mother`, `beat-beast`, `beat-dogma`,
`beat-mega-satan`, `all-marks`, `custom` (with a `check(save, run)` function).

---

## 12. Sprites — procedural, cached

```js
IS.defineSprite('gaper', function (g, s, t) { … })
// g = CanvasRenderingContext2D, origin at the entity's CENTRE, y down
// s = size in units (draw within roughly -s/2..s/2)
// t = { frame, time, dir, hurt, tint, variant, flip, charge, hp01 }
```

Rules:
- Draw with paths and gradients. No image loading, no external fonts.
- Keep it inside the box: `[-s*0.6, s*0.6]`.
- Deterministic for a given `t` — the renderer caches static sprites to
  offscreen canvases keyed by `name|size|tint|variant`. If your sprite animates,
  set `IS.spriteAnimated('gaper')` so it is not cached.
- `IS.sprite(name)` returns the fn; `IS.drawSprite(g, name, x, y, s, t)` draws.
- Every `sprite:` string used in `js/data/**` must be registered. The validator
  checks this.

Palette helpers: `IS.shade(hex, amount)`, `IS.mix(a, b, t)`, `IS.alpha(hex, a)`.

---

## 13. Render, camera, HUD

```js
IS.camera = { x, y, zoom, shakeX, shakeY }
IS.render(g, dt)              // draws the whole scene for the active room
IS.hud.draw(g, run)
IS.worldToScreen(x, y) -> {x, y}
```

For 1×1 rooms the camera is fixed and the whole room fits. For larger shapes it
follows the player with a dead zone, clamped to the room bounds.

---

## 14. Audio

```js
IS.audio.sfx(name, opts)      // opts: {vol, rate, pan}
IS.audio.music(cmd, opts)     // cmd: 'floor'|'boss'|'shop'|'devil'|'title'|
                              // 'stop'|'gameover'|'victory'|'chase'
IS.audio.defineSfx(name, spec)
```

Sfx names available (add via `defineSfx`, never assume an unlisted one exists):
`tear-fire tear-hit tear-splat enemy-hurt enemy-die player-hurt player-die
coin key bomb-pickup bomb-fuse bomb-explode heart-pickup item-pickup
pedestal-appear door-open door-close door-locked rock-break poop-break
chest-open card-use pill-use pill-swallow devil-deal angel-deal shop-buy
boss-roar boss-die floor-clear trapdoor secret-found charge-up charge-ready
menu-move menu-select menu-back curse-sting holy-shield laser-fire
brimstone-fire knife-throw familiar-spawn transform fart web-shot beep`

---

## 15. Save and progress

```js
IS.save.load() / IS.save.flush()
IS.save.data = {
  version, unlocks:{}, achievements:{}, bestiary:{}, itemsSeen:{},
  challengesDone:{}, marks:{}, stats:{}, options:{}, run:null, streak:0,
  donation:0, greedDonation:0, eden:0
}
IS.save.unlocked(id) -> bool
IS.save.unlock(achId, ctx)
IS.progress.record(event, data, run)   // the one funnel for achievement checks
```

Storage key: `isuck.save.v1`. Corrupt/incompatible saves are reset, never
thrown on.

---

## 16. Screens

`IS.screens` is a registry: `IS.defineScreen(name, { enter, exit, update, draw, key })`.
Screen names: `title menu char-select challenge-select seed-entry options
controls stats collection bestiary secrets pause game death victory credits
challenge-list run-summary`.

`IS.go(screenName, args)` switches. `IS.state.screen` holds the active name.

---

## 17. Testing gates (must pass before deploy)

```
node tools/validate-content.mjs   # schema + cross-reference + wiring audit
node tools/smoke.mjs              # headless: boot, no console errors, play 3 floors
node tools/balance.mjs            # 200 seeded auto-runs, reports depth reached
```

`validate-content.mjs` asserts, at minimum:
1. every `hooks` key is in §5.2; every `flags`/`tearFlags` value is in §5.3/§5.4
2. every `pools` value is in §8.5; every `archetype` in §6.1; `attacks` in §7.2;
   `behaviour` in §7.4; `sprite` registered in §12; `sfx` names in §14
3. ids unique per registry; `legend` letters map to real enemy ids
4. room layouts have exactly the right dimensions and only legal characters
5. every `js/**/*.js` appears in a `<script src>` in `index.html`
6. instantiating every item on a dummy player throws nothing; every enemy and
   boss spawns and updates for 60 ticks without throwing
7. every character's `items` exist; every challenge's `items`/`charId` exist;
   every achievement's `unlocks` target exists
