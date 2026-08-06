# ISUCK — engine API index

Companion to `ARCHITECTURE.md`. This lists **every** `IS.*` function, which file
owns it, and its exact signature. If you are writing one of these files you must
define everything in your block, and you may only call things defined in other
blocks. Do not invent names. Do not rename. Do not move ownership.

`ctx` is always the object from ARCHITECTURE.md §9.
`room` / `run` / `p` (player) are the objects from §4 and §8.
Angles are radians, `0` = right, y down. Distances in logical units. Time in seconds.

---

## js/core/math.js

```js
IS.clamp(v, lo, hi)                 IS.lerp(a, b, t)
IS.sign(v)                          IS.approach(cur, target, maxDelta)
IS.dist(ax, ay, bx, by)             IS.dist2(ax, ay, bx, by)
IS.len(x, y)                        IS.norm(x, y)            -> {x, y}
IS.angleTo(ax, ay, bx, by)          IS.angleDiff(a, b)
IS.rotate(x, y, a)                  -> {x, y}
IS.fromAngle(a, mag)                -> {x, y}
IS.easeIn(t) IS.easeOut(t) IS.easeInOut(t)
IS.circleHit(ax, ay, ar, bx, by, br)            -> bool
IS.circleRect(cx, cy, cr, rx, ry, rw, rh)       -> bool
IS.rectHit(ax, ay, aw, ah, bx, by, bw, bh)      -> bool
IS.cellCenter(col, row)             -> {x, y}
IS.cellOf(x, y)                     -> {col, row}
IS.inBounds(room, x, y, r)          -> bool     // inside the walkable polygon
IS.clampToRoom(room, ent)                        // mutates ent.x/ent.y
IS.shade(hex, amount)               -> hex      // amount -1..1
IS.mix(hexA, hexB, t)               -> hex
IS.alpha(hex, a)                    -> 'rgba(...)'
IS.hexToRgb(hex)                    -> {r, g, b}
```

## js/core/rng.js

```js
new IS.RNG(seed)  ->  { next, int, range, pick, pickWeighted, shuffle, chance,
                        fork, state, setState }
  rng.next()                  -> [0,1)
  rng.int(n)                  -> [0,n)
  rng.range(a, b)             -> [a,b)
  rng.pick(arr)               -> element (undefined for empty)
  rng.pickWeighted(arr, wts)  -> element
  rng.shuffle(arr)            -> new array
  rng.chance(p)               -> bool
  rng.fork()                  -> new IS.RNG
IS.randomSeed()               -> uint32          // may use Math.random, boot only
IS.seedToString(n)            -> 'ABCD EFGH'
IS.stringToSeed(str)          -> uint32 | null
IS.hashString(str)            -> uint32
IS.luckChance(base, perLuck, cap, luck)  -> probability 0..1
```

## js/core/save.js

```js
IS.save.data                                     // see ARCHITECTURE.md §15
IS.save.load()                IS.save.flush()
IS.save.unlocked(achId)       -> bool
IS.save.unlock(achId)         -> bool newlyUnlocked
IS.save.itemUnlocked(itemId)  -> bool            // resolves item.unlock
IS.save.seeItem(itemId)       IS.save.seeEnemy(enemyId, killed)
IS.save.option(key, value)    -> value           // getter when value undefined
IS.save.addStat(key, n)
IS.save.markGoal(charId, goal)
IS.save.reset()
IS.save.storeRun(snapshot)    IS.save.takeRun() -> snapshot|null
IS.save.hasRun()              -> bool
```

## js/core/input.js

```js
IS.input.init(canvas)         IS.input.update()          // call once per frame, after logic
IS.input.down(action)         -> bool
IS.input.pressed(action)      -> bool   // this frame only
IS.input.released(action)     -> bool
IS.input.consume(action)               // clears the pressed edge
IS.input.move()               -> {x, y}   // normalised move vector
IS.input.shoot()              -> {x, y}   // normalised fire vector, {0,0} = not firing
IS.input.mouse                -> {x, y, down, world:{x,y}}
IS.input.anyPressed()         -> bool
IS.input.bindings             -> { action: [codes…] }
IS.input.rebind(action, code)
IS.input.gamepad              -> bool connected
IS.input.ACTIONS              -> ['up','down','left','right','shootUp','shootDown',
                                  'shootLeft','shootRight','bomb','use','pocket',
                                  'pocketSwap','drop','map','pause','confirm',
                                  'cancel','restart']
```

## js/core/audio.js

```js
IS.audio.init()               IS.audio.resume()      // after a user gesture
IS.audio.defineSfx(name, spec)
IS.audio.sfx(name, opts)                  // opts {vol, rate, pan}
IS.audio.music(cmd, opts)                 // 'floor'|'boss'|'shop'|'devil'|'title'|
                                          // 'stop'|'gameover'|'victory'|'chase'
IS.audio.setFloorMusic(floorDef)
IS.audio.volume(kind, v)                  // 'master'|'sfx'|'music'
IS.audio.muted               -> bool
```

## js/core/fx.js

```js
IS.fx.reset()                 IS.fx.update(dt)        IS.fx.draw(g, layer)
                                                      // layer 'under'|'over'
IS.fx.particles(opts)         // {x,y,n,colour,speed,life,size,gravity,spread,angle}
IS.fx.burst(x, y, colour, n)
IS.fx.blood(x, y, n, colour)
IS.fx.floater(text, x, y, colour)
IS.fx.shake(amount, secs)
IS.fx.ring(x, y, opts)        // expanding ring, {colour,r0,r1,life,width}
IS.fx.poof(x, y, colour)
IS.fx.flash(colour, secs)
IS.fx.creep(x, y, r, opts)    // {colour, kind:'red'|'green'|'black'|'white'|'holy',
                              //  dmg, slow, life}
IS.fx.creepAt(x, y)           -> creep|null
IS.fx.decal(x, y, r, colour)
IS.fx.beam(x, y, angle, len, opts)
IS.fx.list                    -> array (render reads this)
```

## js/engine/entity.js

```js
IS.makeEntity(def, x, y, opts)      -> entity
IS.damageEnemy(e, dmg, opts, ctx)   -> bool died      // opts {src, flags, crit, silent}
IS.killEnemy(e, ctx)
IS.applyStatus(ent, status, secs, ctx)
IS.updateStatuses(ent, dt, ctx)
IS.knockback(ent, fromX, fromY, force)
IS.moveEntity(ent, dt, room, ctx)                     // walls, rocks, pits, webs
IS.enemyShoot(e, opts, ctx)         // {angle, speed, dmg, count, spread, arc,
                                    //  flags, sprite, r, life, gravity}
IS.entityHit(a, b)                  -> bool
IS.enemyContactDamage(e, p, ctx)
```

Entity shape (both enemies and bosses):
```js
{ id, def, x, y, vx, vy, r, hp, maxHp, dmg, speed, flying, dead, hurtT,
  status:{}, ai:{}, champion:null, room, spawnedBy, invuln, boss, phase,
  attack:null, attackT, sprite, tint, scale, frame, dir, friendly }
```

## js/engine/tears.js

```js
IS.firePlayerTears(p, dir, ctx)                 // handles multishot/flags/sfx
IS.spawnTear(opts, ctx)             -> tear     // {x,y,vx,vy,dmg,r,flags,life,
                                                //  friendly,sprite,height,falls}
IS.spawnEnemyShot(opts, ctx)        -> shot
IS.spawnBomb(x, y, opts, ctx)       -> bomb     // {fuse,dmg,r,flags,friendly}
IS.bombExplode(x, y, opts, ctx)
IS.spawnLaser(opts, ctx)            -> laser    // {x,y,angle,len,dmg,width,life,
                                                //  brimstone,friendly,thick}
IS.spawnKnife(opts, ctx)            -> knife
IS.applyTearFlags(tear, p)
IS.onTearImpact(tear, target, ctx)
IS.updateProjectiles(room, dt, ctx)             // tears, shots, bombs, lasers, knives
IS.tearBaseOpts(p)                  -> opts
```

## js/engine/player.js

```js
IS.makePlayer(charId, run)      -> p
IS.recalcStats(p)
IS.updatePlayer(p, dt, ctx)
IS.fireHook(p, hookName, args, ctx)   -> array of hook return values
IS.damagePlayer(p, halfHearts, source, ctx)  -> bool tookDamage
IS.healRed(p, n)               IS.addSoulHearts(p, n)   IS.addBlackHearts(p, n)
IS.addBoneHearts(p, n)         IS.addMaxHearts(p, n, alsoHeal)
IS.addCoins(p, n)              IS.addBombs(p, n)        IS.addKeys(p, n)
IS.totalHearts(p)              -> half-hearts of effective HP
IS.giveItem(p, itemId, opts)   -> bool
IS.removeItem(p, itemId)       -> bool
IS.hasItem(p, itemId)          -> bool
IS.itemCount(p, itemId)        -> number
IS.giveTrinket(p, id)          IS.dropTrinket(p, slot, ctx)
IS.givePocket(p, kind, id)     -> bool
IS.usePocket(p, slot, ctx)
IS.useActive(p, slot, ctx)
IS.addCharge(p, n, slot)
IS.killPlayer(p, ctx)
IS.checkTransforms(p, ctx)
IS.playerFlag(p, flag)         -> bool
```

`IS.fireHook` is the **only** way hooks are dispatched: it walks
`p.items` in pickup order, then trinkets (setting `ctx.goldenTrinket`), and calls
`def.hooks[name]`. It sets `ctx.sourceItemId` before each call and swallows
per-item exceptions with a `console.warn` so one bad item cannot brick a run.

## js/engine/familiar.js

```js
IS.familiarBehaviours                  // registry object
IS.defineFamiliarBehaviour(name, fn)   // fn(f, dt, ctx)
IS.spawnFamiliar(p, familiarId, ctx)   -> familiar
IS.removeFamiliar(p, familiarId)
IS.updateFamiliars(p, dt, ctx)
```

## js/engine/enemy.js

```js
IS.spawnEnemy(room, id, x, y, opts)   -> enemy
IS.spawnBoss(room, id, x, y, opts)    -> enemy
IS.updateEnemies(room, dt, ctx)
IS.rollChampion(e, rng)
IS.enemyDrops(e, ctx)
// plus IS.defineArchetype(...) for every name in IS.ARCHETYPE_LIST
```

## js/engine/boss.js

```js
IS.updateBoss(b, dt, ctx)
IS.bossPhaseFor(b)                    -> phase def
IS.startAttack(b, name, ctx)
// plus IS.defineAttack(...) for every name in IS.ATTACK_LIST
```

Attack functions have the signature `fn(b, dt, st, ctx) -> bool done`, where
`st` is `b.attackState` — a scratch object the engine clears when the attack
starts. Return `true` when finished; the controller then picks the next attack
after the phase cooldown.

## js/engine/room.js

```js
IS.makeRoom(def, floor, run, opts)    -> room
IS.buildRoomContents(room, ctx)                  // template -> grid + entities
IS.enterRoom(run, roomIndex, fromDir, ctx)
IS.updateRoom(room, dt, ctx)
IS.checkClear(room, ctx)
IS.spawnPickup(room, kind, x, y, opts)  -> pickup
IS.spawnPedestal(room, itemId, x, y, opts) -> pickup
IS.destroyGrid(room, g, ctx)
IS.gridAt(room, col, row)             -> grid|null
IS.solidAt(room, x, y, opts)          -> bool
IS.freeFloorPos(room, rng, opts)      -> {x, y}
IS.roomEnemies(room)                  -> array (living, non-friendly)
IS.openDoors(room, ctx)
IS.addDoor(room, dir, kind, target)
```

Room shape:
```js
{ index, def, type, shape, w, h, pxW, pxH, floor, grid:[], enemies:[], pickups:[],
  tears:[], shots:[], bombs:[], lasers:[], knives:[], effects:[], doors:[],
  cleared, firstVisit, visited, boss, seed, rng, entryDir, obstacles, decor,
  ambush, ambushWave, dark, meta:{} }
```

## js/engine/pool.js

```js
IS.initPools(run)
IS.rollItem(run, pool, opts)   -> itemId|null    // opts {noRemove, quality, tag}
IS.removeFromPools(run, itemId)
IS.rollTrinket(run, opts)      -> trinketId
IS.rollCard(run, opts)         -> cardId
IS.rollPill(run, opts)         -> pillId
IS.rollRune(run, opts)         -> cardId (rune)
IS.devilChance(run)            -> 0..1
IS.planetariumChance(run)      -> 0..1
IS.assignPillColours(run)
IS.pillFor(run, colourId)      -> pillId
IS.identifyPill(run, colourId)
```

## js/engine/floor.js

```js
IS.generateFloor(run, floorId, opts)  -> floor
IS.nextFloorIds(run)                  -> {normal, alt}     // where you may go next
IS.rollCurses(run, floor)             -> bitmask
IS.floorDef(floorId)                  -> def
IS.startFloor(run, floorId, ctx)
```

Floor shape:
```js
{ id, def, depth, rooms:[], startIndex, bossIndex, curses, visitedCount,
  layout:{ grid, w, h }, rng, altPath, mapOffsets }
```

Layout generation follows Isaac's shape: a random walk on a 13×13 grid seeded at
the centre, room count `depth`-scaled, then special rooms placed on dead ends
(treasure, shop, boss last-and-farthest), secret rooms adjacent to ≥3 neighbours.

## js/engine/interact.js

```js
IS.updateInteractions(room, dt, ctx)
IS.tryTakePickup(p, pickup, ctx)      -> bool consumed
IS.openChest(room, chest, ctx)
IS.tryDoor(p, door, ctx)
IS.buy(room, entry, ctx)              -> bool
IS.donate(room, machine, coins, ctx)
IS.sacrifice(room, ctx)
IS.spawnTrapdoor(room, x, y, opts)
IS.spawnCrawlspace(room, x, y)
IS.useTrapdoor(run, ctx)
IS.spawnDevilDeal(room, run, ctx)
IS.spawnAngelDeal(room, run, ctx)
IS.rerollPedestals(room, run, ctx)
```

## js/engine/progress.js

```js
IS.progress.record(event, data, run)  // the one funnel; event names below
IS.progress.check(run)
IS.progress.completeRun(run, goal)
IS.progress.EVENTS                    -> ['boss-killed','floor-cleared','item-taken',
                                          'coins','bombs','keys','donation','beggar-bombed',
                                          'room-visited','enemy-killed','item-used',
                                          'challenge-done','run-won','run-lost','damage-taken']
```

## js/engine/ctx.js

```js
IS.makeCtx(run)   -> ctx      // built once per run, mutated per frame
IS.refreshCtx(ctx, room, dt)
```

Implements every field in ARCHITECTURE.md §9 by delegating to the functions
above. It is the only file allowed to be a thin pass-through layer.

## js/render/*

```js
IS.drawSprite(g, name, x, y, size, t)
IS.spriteCanvas(name, size, t)        -> canvas   // cache, sprites.js
IS.camera                             -> {x, y, zoom, shakeX, shakeY}
IS.updateCamera(room, p, dt)
IS.worldToScreen(x, y)                -> {x, y}
IS.screenToWorld(x, y)                -> {x, y}
IS.render(g, dt)                      // whole scene for IS.state.run
IS.drawBackdrop(g, room, floor)
IS.drawGridObjects(g, room, floor)
IS.drawDoors(g, room)
IS.hud.draw(g, run)
IS.hud.minimap(g, run)
IS.hud.pickupBanner(text, subtext)
```

## js/main.js

```js
IS.boot()                             // called on DOMContentLoaded
IS.go(screenName, args)
IS.startRun(opts)                     // {charId, seed, challengeId, greed}
IS.endRun(reason, goal)
IS.state                              // {screen, run, paused, time, frame, ctx}
IS.canvas, IS.g                       // the canvas + 2d context
IS.simulate(opts)                     // headless auto-play, see below
```

Two requirements the test harness depends on — treat them as part of the contract:

1. **`IS.state.ctx` must hold the live ctx for the current run**, refreshed each
   frame. `tools/smoke.mjs` drives the game through it; without it the harness
   cannot reach the engine.
2. **`IS.simulate(opts)` must run a whole run with no canvas, no audio and no
   input**, stepping the fixed timestep in a plain loop:
   `IS.simulate({ charId, seed, maxFloors, maxSeconds, policy })` → a result
   object `{ floorsCleared, depth, died, seconds, itemsTaken, error }`. A crude
   built-in `policy` (walk toward the nearest enemy, fire at it, take the
   trapdoor when the room is clear) is enough — `tools/balance.mjs` runs a few
   hundred seeded runs through it to prove floors are completable and nothing
   throws deep into a run. It must work when `window` is undefined.

Run shape:
```js
{ seed, seedStr, rng, floorRng, poolRng, player, floor, floorIndex, room,
  charId, challengeId, greed, pools:{}, curses, stats:{}, flags:{},
  time, floorTime, devilDealsTaken, dealChanceMods, pillColours:{}, identified:{},
  bossesKilled:[], itemsTaken:[], donation, planetariumChance, altPath,
  ascent, mausoleumHeartKilled, knifePieces, deaths, log:[] }
```
