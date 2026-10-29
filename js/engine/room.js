;(function (IS) {
  'use strict'

  // ---------------------------------------------------------------------------
  // ISUCK — the room instance: its grid objects, its pickups and the clear
  // logic. Owns everything in the js/engine/room.js block of docs/ENGINE-API.md.
  //
  // Three rules this file lives by:
  //
  //  1. Content is never trusted. A template row of the wrong length, an
  //     unknown grid character, a legend letter with no enemy behind it, an
  //     item id that no data file defined — each of those produces exactly one
  //     console.warn (keyed by template id + fault) and is skipped. One bad
  //     template must not be able to break floor generation.
  //  2. A room is fully usable the instant IS.makeRoom returns, before
  //     IS.buildRoomContents has ever run. The test harnesses build rooms and
  //     immediately run IS.updateRoom / IS.updateEnemies on them, and
  //     IS.solidAt is called by entity.js on rooms that were never built.
  //  3. Randomness comes from room.rng (layout, re-derived from room.seed so a
  //     room's contents are stable across leave-and-re-enter) or from ctx.rng /
  //     run.rng (live gameplay rolls). Never from the platform generator.
  //
  // ---------------------------------------------------------------------------
  // CROSS-FILE SHAPES — other files code against these.
  //
  // room.obstacles is a FLAT Array(w*h) of grid|null, indexed row*w+col. It is
  // NOT a list of the solid objects; it is the cell -> object index that
  // IS.gridAt and IS.solidAt read. room.grid is the list (broken objects stay
  // in it so the renderer can draw rubble).
  //
  // Grid object (room.grid entries, all of them):
  //   { kind, char, col, row, x, y, r, solid, destructible, bombOnly, hazard,
  //     pit, bridged, web, water, fire, tnt, needsKey, rockFamily, hp, maxHp,
  //     dmg, slow, up, lit, fuse, broken, spawned, variant, tint, meta }
  //   `solid` blocks ground movement. `up` is the live state of retracting
  //   spikes. `slow` is a speed multiplier for whoever stands in the cell
  //   (webs, water, corny poop). `bridged` pits are walkable.
  //
  // Pickup (room.pickups entries):
  //   { kind, variant, id, itemId, def, amount, x, y, r, z, vz, vx, vy, bob,
  //     age, life, magnet, price, priceType, soulPrice, shop, slot,
  //     optionsGroup, locked, opened, contents, live, taken, removed, meta }
  //   `kind` is exactly one of IS.PICKUP_KINDS and matches the onPickup hook
  //   vocabulary ('soul' and 'black' stay 'soul'/'black'); `heart === true`
  //   marks the whole heart family. interact.js consumes a pickup by setting
  //   `taken = true` (or `removed = true` to make it vanish); IS.updateRoom
  //   reaps them and resolves 'options' groups.
  //
  // Door (room.doors entries):
  //   { dir, kind, x, y, cx, cy, insideX, insideY, w, h, locked, keys, open,
  //     hidden, target, slot }
  //   `x, y` is the door's centre, which sits in the wall (outside the walkable
  //   box). `insideX, insideY` is where a player entering through it stands.
  //
  // IS.enterRoom(run, index, fromDir, ctx): `fromDir` is the wall of the room
  // being ENTERED that the player arrives at — the side they came from. So
  // walking through a right-hand door calls
  //   IS.enterRoom(run, door.target, IS.DIR_OPPOSITE[door.dir], ctx)
  // A dir with no matching door falls back to the opposite wall, then the room
  // centre, so a mismatched caller misplaces the player but never throws.
  // ---------------------------------------------------------------------------

  var TILE = IS.TILE || 80
  var CELL_W = IS.ROOM_W || 13 // walkable tiles per room slot, across
  var CELL_H = IS.ROOM_H || 7 // and down
  var EMPTY = {}

  var warned = Object.create(null)

  function warnOnce (key, msg) {
    if (warned[key]) return
    warned[key] = true
    console.warn('room: ' + msg)
  }

  function num (v, d) {
    return typeof v === 'number' && v === v ? v : d
  }

  // Layout rng: stable for a given room across re-entry. Gameplay rng: the run
  // stream, so drops do not depend on how many rooms you walked through.
  function playRng (room, ctx) {
    if (ctx && ctx.rng) return ctx.rng
    if (ctx && ctx.run && ctx.run.rng) return ctx.run.rng
    return room ? room.rng : null
  }

  function weighted (rng, list) {
    var total = 0
    var i
    for (i = 0; i < list.length; i++) total += list[i].w
    if (total <= 0) return list[0]
    var roll = (rng ? rng.next() : 0.5) * total
    for (i = 0; i < list.length; i++) {
      roll -= list[i].w
      if (roll < 0) return list[i]
    }
    return list[list.length - 1]
  }

  function chance (rng, p) {
    if (!rng) return false
    return rng.chance ? rng.chance(p) : rng.next() < p
  }

  function pickOne (rng, arr) {
    if (!arr || !arr.length) return null
    if (!rng) return arr[0]
    return rng.pick ? rng.pick(arr) : arr[(rng.next() * arr.length) | 0]
  }

  function hasFlag (p, flag) {
    if (!p) return false
    if (typeof IS.playerFlag === 'function') return !!IS.playerFlag(p, flag)
    return !!(p.flags && typeof p.flags.has === 'function' && p.flags.has(flag))
  }

  function floorDefOf (floor) {
    if (!floor) return null
    return floor.def || floor
  }

  // ---------------------------------------------------------------------------
  // Grid vocabulary. One entry per value in IS.GRID_CHARS that becomes a real
  // grid object; the rest ('.', '!', '$', '@', '%', 'L') are spawn markers and
  // are resolved in buildRoomContents.
  // ---------------------------------------------------------------------------

  var GRID = {
    rock: { solid: 1, hp: 2, destructible: 1, rockFamily: 1, sfx: 'rock-break' },
    'tinted-rock': { solid: 1, hp: 2, destructible: 1, rockFamily: 1, drop: 'tinted', sfx: 'rock-break' },
    'marked-skull': { solid: 1, hp: 3, destructible: 1, rockFamily: 1, drop: 'marked', sfx: 'rock-break' },
    metal: { solid: 1, hp: 0, destructible: 0, rockFamily: 1 },
    pillar: { solid: 1, hp: 0, destructible: 1, bombOnly: 1, rockFamily: 1, sfx: 'rock-break' },
    poop: { solid: 1, hp: 4, destructible: 1, drop: 'poop', sfx: 'poop-break' },
    'golden-poop': { solid: 1, hp: 6, destructible: 1, drop: 'golden-poop', sfx: 'poop-break' },
    'red-poop': { solid: 1, hp: 4, destructible: 1, drop: 'red-poop', creep: 'red', sfx: 'poop-break' },
    'corn-poop': { solid: 1, hp: 5, destructible: 1, drop: 'corn-poop', sfx: 'poop-break' },
    'corny-poop': { solid: 0, hp: 0, destructible: 0, slow: 0.55, hazard: 1, dmg: 0 },
    spikes: { solid: 0, hp: 0, destructible: 0, hazard: 1, dmg: 1 },
    'retract-spikes': { solid: 0, hp: 0, destructible: 0, hazard: 1, dmg: 1, retract: 1 },
    pit: { solid: 1, hp: 0, destructible: 1, bombOnly: 1, pit: 1, hazard: 1 },
    'pit-bridge': { solid: 0, hp: 0, destructible: 0, pit: 1, bridged: 1 },
    web: { solid: 0, hp: 1, destructible: 1, web: 1, slow: 0.35 },
    fire: { solid: 1, hp: 3, destructible: 1, fire: 1, dmg: 1, hazard: 1 },
    'blue-fire': { solid: 1, hp: 3, destructible: 1, fire: 1, dmg: 1, hazard: 1, shoots: 1 },
    tnt: { solid: 1, hp: 3, destructible: 1, tnt: 1, sfx: 'rock-break' },
    'key-block': { solid: 1, hp: 0, destructible: 0, needsKey: 1 },
    mushroom: { solid: 1, hp: 2, destructible: 1, drop: 'mushroom', sfx: 'poop-break' },
    vase: { solid: 1, hp: 1, destructible: 1, drop: 'vase', sfx: 'rock-break' },
    water: { solid: 0, hp: 0, destructible: 0, water: 1, slow: 0.78 }
  }

  var DOOR_KINDS = {
    normal: { locked: false },
    treasure: { locked: true, keys: 1 },
    shop: { locked: true, keys: 1 },
    boss: { locked: false, big: true },
    secret: { locked: false, hidden: true, bomb: true },
    'super-secret': { locked: false, hidden: true, bomb: true },
    'ultra-secret': { locked: false, hidden: true, bomb: true },
    devil: { locked: false, deal: true },
    angel: { locked: false, deal: true },
    curse: { locked: false, cost: 'heart' },
    arcade: { locked: false },
    library: { locked: true, keys: 1 },
    sacrifice: { locked: false },
    challenge: { locked: false },
    'boss-rush': { locked: false, big: true },
    dice: { locked: false },
    planetarium: { locked: false },
    vault: { locked: true, keys: 2 },
    bedroom: { locked: false },
    'black-market': { locked: false },
    mineshaft: { locked: false },
    locked: { locked: true, keys: 1 },
    'mom-locked': { locked: true, keys: 0, event: 'mom' }
  }

  // --- pickup variant tables -------------------------------------------------

  var COINS = [
    { v: 'penny', w: 74, amount: 1 },
    { v: 'nickel', w: 12, amount: 5 },
    { v: 'dime', w: 4, amount: 10 },
    { v: 'lucky', w: 5, amount: 1, lucky: true },
    { v: 'sticky-nickel', w: 5, amount: 5, sticky: true }
  ]
  var HEARTS = [
    { v: 'full', w: 44, amount: 2 },
    { v: 'half', w: 34, amount: 1 },
    { v: 'bone', w: 6, amount: 2 },
    { v: 'rotten', w: 5, amount: 2 },
    { v: 'eternal', w: 4, amount: 1 },
    { v: 'blended', w: 4, amount: 2 },
    { v: 'gold', w: 3, amount: 2 }
  ]
  var HEART_AMOUNT = {
    half: 1, full: 2, soul: 2, black: 2, eternal: 1, gold: 2, bone: 2,
    rotten: 2, blended: 2
  }
  var CHESTS = [
    { v: 'normal', w: 60 },
    { v: 'golden', w: 10, locked: true },
    { v: 'red', w: 7 },
    { v: 'spiked', w: 6 },
    { v: 'mimic', w: 5 },
    { v: 'haunted', w: 4 },
    { v: 'old', w: 3 },
    { v: 'mega', w: 3, locked: true },
    { v: 'bomb', w: 2 }
  ]
  var BOMBS = [
    { v: 'normal', w: 84, amount: 1 },
    { v: 'double', w: 12, amount: 2 },
    { v: 'golden', w: 4, amount: 1, golden: true }
  ]
  var KEYS = [
    { v: 'normal', w: 84, amount: 1 },
    { v: 'double', w: 10, amount: 2 },
    { v: 'golden', w: 4, amount: 1, golden: true },
    { v: 'charged', w: 2, amount: 1 }
  ]
  var BATTERIES = [
    { v: 'normal', w: 76 },
    { v: 'micro', w: 16 },
    { v: 'mega', w: 8 }
  ]
  var SACKS = [
    { v: 'normal', w: 88 },
    { v: 'black', w: 12 }
  ]
  // '!' in a template, and every generic "drop something" roll.
  var RANDOM_PICKUPS = [
    { v: 'coin', w: 40 }, { v: 'heart', w: 20 }, { v: 'bomb', w: 12 },
    { v: 'key', w: 12 }, { v: 'card', w: 6 }, { v: 'pill', w: 5 },
    { v: 'chest', w: 3 }, { v: 'battery', w: 1 }, { v: 'trinket', w: 1 }
  ]

  var PICKUP_R = {
    coin: 18, key: 18, bomb: 19, heart: 20, soul: 20, black: 20, card: 20,
    pill: 18, rune: 20, trinket: 18, battery: 20, chest: 26, sack: 22, item: 30
  }
  var SHOP_PRICE = {
    coin: 0, key: 5, bomb: 5, heart: 3, soul: 6, black: 6, card: 5, pill: 5,
    rune: 6, trinket: 5, battery: 9, sack: 7, chest: 0, item: 15
  }

  var SPIKE_CYCLE = 2.4 // seconds for a full up/down cycle of retracting spikes
  var SPIKE_UP = 1.25 // seconds of that cycle spent extended
  var HAZARD_TICK = 0.2 // how often creep / web checks run
  var CREEP_TICK = 0.55 // minimum seconds between two creep damage ticks

  // ---------------------------------------------------------------------------
  // Geometry
  // ---------------------------------------------------------------------------

  function cellInShape (room, col, row) {
    if (col < 0 || row < 0 || col >= room.w || row >= room.h) return false
    var miss = room.missing
    if (!miss) return true
    var left = col < (room.w >> 1)
    var top = row < (room.h >> 1)
    if (miss === 'tl') return !(left && top)
    if (miss === 'tr') return !(!left && top)
    if (miss === 'bl') return !(left && !top)
    return !(!left && !top)
  }

  IS.solidAt = function (room, x, y, opts) {
    if (!room) return true
    var o = opts || EMPTY
    var col = Math.floor(x / TILE)
    var row = Math.floor(y / TILE)
    if (!cellInShape(room, col, row)) return !o.ignoreWalls
    if (o.flying || o.spectral) return false
    var g = room.obstacles ? room.obstacles[row * room.w + col] : null
    if (!g || g.broken || !g.solid) return false
    if (g.pit) return g.bridged ? false : !o.ignorePits
    if (o.ignoreRocks && g.rockFamily) return false
    return true
  }

  IS.gridAt = function (room, col, row) {
    if (!room || !room.obstacles) return null
    if (col < 0 || row < 0 || col >= room.w || row >= room.h) return null
    var g = room.obstacles[row * room.w + col]
    if (!g || g.broken) return null
    return g
  }

  function gridUnder (room, x, y) {
    return IS.gridAt(room, Math.floor(x / TILE), Math.floor(y / TILE))
  }

  function safeCell (room, col, row) {
    return !!(room.meta && room.meta.safe && room.meta.safe[row * room.w + col])
  }

  function cellFree (room, col, row, o) {
    if (!cellInShape(room, col, row)) return false
    if (!o.allowSafe && safeCell(room, col, row)) return false
    var g = room.obstacles ? room.obstacles[row * room.w + col] : null
    if (g && !g.broken) {
      if (g.solid && !(o.flying && !g.pit)) return false
      if (g.solid && g.pit && !o.flying) return false
      if (g.hazard && !o.allowHazard) return false
    }
    return true
  }

  IS.freeFloorPos = function (room, rng, opts) {
    if (!room) return { x: 0, y: 0 }
    var o = opts || EMPTY
    var r = rng || room.rng || null
    var minD = num(o.minPlayerDist, 0)
    var p = o.player || (IS.state && IS.state.run ? IS.state.run.player : null)
    var avoidPickups = o.avoidPickups !== false
    var tries = num(o.tries, 48) | 0
    var cx, cy, col, row, x, y, i

    function ok (px, py) {
      if (minD > 0 && p) {
        var dx = px - p.x
        var dy = py - p.y
        if (dx * dx + dy * dy < minD * minD) return false
      }
      if (avoidPickups && room.pickups) {
        for (var k = 0; k < room.pickups.length; k++) {
          var pu = room.pickups[k]
          if (!pu || pu.removed) continue
          var ax = pu.x - px
          var ay = pu.y - py
          if (ax * ax + ay * ay < 34 * 34) return false
        }
      }
      return true
    }

    for (i = 0; i < tries; i++) {
      col = r ? (r.int ? r.int(room.w) : (r.next() * room.w) | 0) : (room.w >> 1)
      row = r ? (r.int ? r.int(room.h) : (r.next() * room.h) | 0) : (room.h >> 1)
      if (!cellFree(room, col, row, o)) continue
      x = col * TILE + TILE / 2 + (r ? (r.next() - 0.5) * 26 : 0)
      y = row * TILE + TILE / 2 + (r ? (r.next() - 0.5) * 26 : 0)
      if (ok(x, y)) return { x: x, y: y }
    }

    // Deterministic sweep out from the centre — guarantees a sane answer in a
    // cramped room where the random darts all missed.
    cx = room.w >> 1
    cy = room.h >> 1
    for (var ring = 0; ring < room.w + room.h; ring++) {
      for (row = cy - ring; row <= cy + ring; row++) {
        for (col = cx - ring; col <= cx + ring; col++) {
          if (Math.abs(row - cy) !== ring && Math.abs(col - cx) !== ring) continue
          if (!cellFree(room, col, row, o)) continue
          x = col * TILE + TILE / 2
          y = row * TILE + TILE / 2
          if (ok(x, y)) return { x: x, y: y }
        }
      }
    }
    return { x: room.pxW / 2, y: room.pxH / 2 }
  }

  IS.roomEnemies = function (room) {
    var out = []
    if (!room || !room.enemies) return out
    for (var i = 0; i < room.enemies.length; i++) {
      var e = room.enemies[i]
      if (e && !e.dead && !e.friendly) out.push(e)
    }
    return out
  }

  // ---------------------------------------------------------------------------
  // Construction
  // ---------------------------------------------------------------------------

  IS.makeRoom = function (def, floor, run, opts) {
    var o = opts || EMPTY
    if (!def || typeof def !== 'object') {
      warnOnce('no-def', 'makeRoom called without a template; using an empty 1x1')
      def = { id: '(none)', type: 'default', shape: '1x1', layout: null, legend: {} }
    }

    var shapeId = o.shape || def.shape || '1x1'
    var shape = (IS.SHAPES && IS.SHAPES[shapeId]) || null
    if (!shape) {
      warnOnce('shape:' + shapeId, 'template "' + def.id + '" has unknown shape "' + shapeId + '"; using 1x1')
      shapeId = '1x1'
      shape = (IS.SHAPES && IS.SHAPES['1x1']) || { w: CELL_W, h: CELL_H }
    }

    var fdef = floorDefOf(floor)
    var floorRng = (floor && floor.rng) || (run && run.floorRng) || (run && run.rng) || null

    var seed
    if (o.seed != null) {
      seed = o.seed >>> 0
    } else if (floorRng && typeof floorRng.fork === 'function') {
      seed = floorRng.fork().int(0x7fffffff) >>> 0
    } else if (floorRng) {
      seed = floorRng.int(0x7fffffff) >>> 0
    } else if (typeof IS.hashString === 'function') {
      seed = IS.hashString(String(def.id) + ':' + num(o.index, -1)) >>> 0
    } else {
      seed = 1
    }

    var w = shape.w
    var h = shape.h

    var room = {
      index: num(o.index, -1),
      def: def,
      type: o.type || def.type || 'default',
      shape: shapeId,
      missing: shape.missing || null,
      w: w,
      h: h,
      pxW: w * TILE,
      pxH: h * TILE,
      floor: floor || null,
      palette: (fdef && fdef.palette) || null,
      grid: [],
      obstacles: new Array(w * h),
      enemies: [],
      pickups: [],
      tears: [],
      shots: [],
      bombs: [],
      lasers: [],
      knives: [],
      effects: [],
      doors: [],
      pendingSpawns: [],
      cleared: false,
      clearing: false,
      clearT: 0,
      firstVisit: true,
      visited: false,
      mapKnown: false,
      built: false,
      hadEnemies: false,
      boss: o.boss || null,
      seed: seed,
      rng: IS.RNG ? new IS.RNG(seed) : floorRng,
      entryDir: o.entryDir || null,
      obstacleCount: 0,
      decor: [],
      ambush: null,
      ambushWave: 0,
      dark: false,
      time: 0,
      meta: { safe: Object.create(null), spawns: [], shopSlots: [], crawlspaces: [] }
    }

    for (var i = 0; i < room.obstacles.length; i++) room.obstacles[i] = null
    return room
  }

  // Insert a grid object, replacing whatever broken remains occupied the cell.
  // ctx.js probes for this so ctx.spawnPoop lands a real poop.
  IS.addGrid = function (room, kind, x, y, opts) {
    if (!room) return null
    var spec = GRID[kind]
    if (!spec) {
      warnOnce('addGrid:' + kind, 'addGrid got unknown kind "' + kind + '"')
      return null
    }
    var col = Math.floor(x / TILE)
    var row = Math.floor(y / TILE)
    if (!cellInShape(room, col, row)) return null
    var idx = row * room.w + col
    var existing = room.obstacles[idx]
    if (existing && !existing.broken) return existing
    var g = makeGrid(room, kind, spec, col, row, null, opts)
    g.spawned = true
    room.grid.push(g)
    room.obstacles[idx] = g
    return g
  }

  function makeGrid (room, kind, spec, col, row, ch, opts) {
    var o = opts || EMPTY
    var rng = room.rng
    var g = {
      kind: kind,
      char: ch || null,
      col: col,
      row: row,
      x: col * TILE + TILE / 2,
      y: row * TILE + TILE / 2,
      r: TILE / 2,
      solid: !!spec.solid,
      destructible: !!spec.destructible,
      bombOnly: !!spec.bombOnly,
      hazard: !!spec.hazard,
      pit: !!spec.pit,
      bridged: !!spec.bridged,
      web: !!spec.web,
      water: !!spec.water,
      fire: !!spec.fire,
      tnt: !!spec.tnt,
      needsKey: !!spec.needsKey,
      rockFamily: !!spec.rockFamily,
      shoots: !!spec.shoots,
      retract: !!spec.retract,
      drop: spec.drop || null,
      sfx: spec.sfx || null,
      hp: num(o.hp, spec.hp || 0),
      maxHp: num(o.hp, spec.hp || 0),
      dmg: num(spec.dmg, 0),
      slow: num(spec.slow, 0),
      up: true,
      lit: false,
      fuse: 0,
      broken: false,
      spawned: false,
      variant: o.variant != null ? o.variant : (rng ? (rng.int ? rng.int(4) : 0) : 0),
      tint: o.tint || null,
      shootT: spec.shoots ? 1.4 + (rng ? rng.next() * 1.6 : 0.6) : 0,
      flicker: rng ? rng.next() * 6.283 : 0,
      meta: {}
    }
    return g
  }

  // ---------------------------------------------------------------------------
  // Doors
  // ---------------------------------------------------------------------------

  // Wall-segment midpoints for one side, one per room slot along that side,
  // skipping slots that the shape does not include.
  function doorSlots (room, dir) {
    var out = []
    var cellsX = Math.max(1, Math.round(room.w / CELL_W))
    var cellsY = Math.max(1, Math.round(room.h / CELL_H))
    var i, col, row

    if (dir === 'left' || dir === 'right') {
      col = dir === 'left' ? 0 : room.w - 1
      for (i = 0; i < cellsY; i++) {
        row = i * CELL_H + (CELL_H >> 1)
        if (!cellInShape(room, col, row)) continue
        out.push({
          slot: i,
          x: dir === 'left' ? -TILE / 2 : room.pxW + TILE / 2,
          y: i * CELL_H * TILE + (CELL_H * TILE) / 2,
          insideX: dir === 'left' ? TILE * 0.75 : room.pxW - TILE * 0.75,
          insideY: i * CELL_H * TILE + (CELL_H * TILE) / 2
        })
      }
      return out
    }

    row = dir === 'up' ? 0 : room.h - 1
    for (i = 0; i < cellsX; i++) {
      col = i * CELL_W + (CELL_W >> 1)
      if (!cellInShape(room, col, row)) continue
      out.push({
        slot: i,
        x: i * CELL_W * TILE + (CELL_W * TILE) / 2,
        y: dir === 'up' ? -TILE / 2 : room.pxH + TILE / 2,
        insideX: i * CELL_W * TILE + (CELL_W * TILE) / 2,
        insideY: dir === 'up' ? TILE * 0.75 : room.pxH - TILE * 0.75
      })
    }
    return out
  }

  IS.addDoor = function (room, dir, kind, target, slot) {
    if (!room) return null
    if (!IS.DIR_VEC || !IS.DIR_VEC[dir]) {
      warnOnce('door-dir:' + dir, 'addDoor got bad dir "' + dir + '"')
      return null
    }
    var k = kind || 'normal'
    var spec = DOOR_KINDS[k]
    if (!spec) {
      warnOnce('door-kind:' + k, 'addDoor got unknown kind "' + k + '"; using normal')
      k = 'normal'
      spec = DOOR_KINDS.normal
    }

    var slots = doorSlots(room, dir)
    if (!slots.length) return null
    var chosen = null
    // a big room has one slot per map cell along each wall; the floor
    // generator names the one that faces the neighbour
    if (slot != null) for (var s0 = 0; s0 < slots.length; s0++) if (slots[s0].slot === slot) chosen = slots[s0]
    for (var i = 0; i < slots.length && !chosen; i++) {
      var taken = false
      for (var j = 0; j < room.doors.length; j++) {
        var d = room.doors[j]
        if (d.dir === dir && d.slot === slots[i].slot) taken = true
      }
      if (!taken) chosen = slots[i]
    }
    if (!chosen) return null

    var door = {
      dir: dir,
      kind: k,
      slot: chosen.slot,
      x: chosen.x,
      y: chosen.y,
      cx: chosen.x,
      cy: chosen.y,
      insideX: chosen.insideX,
      insideY: chosen.insideY,
      w: dir === 'left' || dir === 'right' ? TILE : TILE * 1.6,
      h: dir === 'left' || dir === 'right' ? TILE * 1.6 : TILE,
      locked: !!spec.locked,
      keys: num(spec.keys, spec.locked ? 1 : 0),
      hidden: !!spec.hidden,
      big: !!spec.big,
      deal: !!spec.deal,
      cost: spec.cost || null,
      event: spec.event || null,
      open: !spec.locked && !spec.hidden,
      target: target == null ? null : target
    }
    room.doors.push(door)
    return door
  }

  IS.openDoors = function (room, ctx) {
    if (!room || !room.doors) return
    var opened = 0
    var p = ctx ? ctx.player : null
    for (var i = 0; i < room.doors.length; i++) {
      var d = room.doors[i]
      if (!d || d.hidden || d.locked || d.open) continue
      d.open = true
      opened++
      if (p && typeof IS.fireHook === 'function') IS.fireHook(p, 'onDoorOpen', [d], ctx)
    }
    if (opened && ctx && ctx.sfx) ctx.sfx('door-open')
  }

  function shutDoors (room) {
    if (!room || !room.doors) return
    for (var i = 0; i < room.doors.length; i++) {
      var d = room.doors[i]
      if (!d || d.hidden || d.locked) continue
      d.open = false
    }
  }

  function entryDoor (room, dir, fromIndex) {
    if (!room.doors || !room.doors.length) return null
    var i, d
    if (fromIndex != null) {
      for (i = 0; i < room.doors.length; i++) {
        d = room.doors[i]
        if (d.target === fromIndex && (!dir || d.dir === dir)) return d
      }
    }
    if (dir) {
      for (i = 0; i < room.doors.length; i++) {
        d = room.doors[i]
        if (d.dir === dir) return d
      }
      var opp = IS.DIR_OPPOSITE ? IS.DIR_OPPOSITE[dir] : null
      if (opp) {
        for (i = 0; i < room.doors.length; i++) {
          d = room.doors[i]
          if (d.dir === opp) return d
        }
      }
    }
    return null
  }

  // A bombed cell on the room's edge exposes any hidden door on that wall.
  function revealSecret (room, g, ctx) {
    if (!room.doors || !room.doors.length) return
    var sides = []
    if (g.col === 0 || !cellInShape(room, g.col - 1, g.row)) sides.push('left')
    if (g.col === room.w - 1 || !cellInShape(room, g.col + 1, g.row)) sides.push('right')
    if (g.row === 0 || !cellInShape(room, g.col, g.row - 1)) sides.push('up')
    if (g.row === room.h - 1 || !cellInShape(room, g.col, g.row + 1)) sides.push('down')
    if (!sides.length) return

    var found = 0
    for (var i = 0; i < room.doors.length; i++) {
      var d = room.doors[i]
      if (!d || !d.hidden) continue
      if (sides.indexOf(d.dir) < 0) continue
      var along = d.dir === 'left' || d.dir === 'right'
        ? Math.abs(d.y - g.y)
        : Math.abs(d.x - g.x)
      var span = d.dir === 'left' || d.dir === 'right' ? CELL_H * TILE / 2 : CELL_W * TILE / 2
      if (along > span) continue
      d.hidden = false
      d.open = !d.locked
      found++
      if (ctx && ctx.player && typeof IS.fireHook === 'function') {
        IS.fireHook(ctx.player, 'onDoorOpen', [d], ctx)
      }
    }
    if (found && ctx) {
      if (ctx.sfx) ctx.sfx('secret-found')
      if (ctx.shake) ctx.shake(5, 0.3)
    }
  }

  // ---------------------------------------------------------------------------
  // Pickups
  // ---------------------------------------------------------------------------

  IS.spawnPickup = function (room, kind, x, y, opts) {
    if (!room) return null
    var o = opts || EMPTY
    if (kind === 'item') return IS.spawnPedestal(room, o.itemId || o.id, x, y, opts)
    if (!IS.PICKUP_KINDS || IS.PICKUP_KINDS.indexOf(kind) < 0) {
      warnOnce('pickup-kind:' + kind, 'spawnPickup got unknown kind "' + kind + '"')
      return null
    }

    var rng = o.rng || room.rng
    var run = o.run || (IS.state && IS.state.run) || null
    var pu = {
      kind: kind,
      variant: o.variant || null,
      id: o.id || null,
      itemId: null,
      def: null,
      amount: num(o.amount, 1),
      heart: kind === 'heart' || kind === 'soul' || kind === 'black',
      x: num(x, room.pxW / 2),
      y: num(y, room.pxH / 2),
      vx: 0,
      vy: 0,
      z: 0,
      vz: 0,
      r: num(o.r, PICKUP_R[kind] || 20),
      bob: rng ? rng.next() * 6.283 : 0,
      age: 0,
      life: num(o.life, 0),
      magnet: num(o.magnet, 0),
      price: num(o.price, 0),
      priceType: o.priceType || null,
      soulPrice: num(o.soulPrice, 0),
      shop: !!o.shop,
      slot: num(o.slot, -1),
      optionsGroup: o.options != null ? String(o.options) : (o.optionsGroup != null ? String(o.optionsGroup) : null),
      locked: !!o.locked,
      opened: false,
      contents: o.contents || null,
      live: !!o.live,
      taken: false,
      removed: false,
      colour: o.colour || null,
      meta: {}
    }

    var v
    switch (kind) {
      case 'coin':
        v = pu.variant ? findVariant(COINS, pu.variant) : weighted(rng, COINS)
        pu.variant = v.v
        pu.amount = num(o.amount, v.amount)
        pu.lucky = !!v.lucky
        pu.sticky = !!v.sticky
        break
      case 'heart':
        v = pu.variant ? findVariant(HEARTS, pu.variant) : weighted(rng, HEARTS)
        pu.variant = pu.variant || v.v
        pu.amount = num(o.amount, HEART_AMOUNT[pu.variant] || 2)
        break
      case 'soul':
      case 'black':
        pu.variant = pu.variant || kind
        pu.amount = num(o.amount, 2)
        break
      case 'bomb':
        v = pu.variant ? findVariant(BOMBS, pu.variant) : weighted(rng, BOMBS)
        pu.variant = v.v
        pu.amount = num(o.amount, v.amount)
        pu.golden = !!v.golden
        break
      case 'key':
        v = pu.variant ? findVariant(KEYS, pu.variant) : weighted(rng, KEYS)
        pu.variant = v.v
        pu.amount = num(o.amount, v.amount)
        pu.golden = !!v.golden
        break
      case 'battery':
        v = pu.variant ? findVariant(BATTERIES, pu.variant) : weighted(rng, BATTERIES)
        pu.variant = v.v
        break
      case 'sack':
        v = pu.variant ? findVariant(SACKS, pu.variant) : weighted(rng, SACKS)
        pu.variant = v.v
        break
      case 'chest':
        v = pu.variant ? findVariant(CHESTS, pu.variant) : weighted(rng, CHESTS)
        pu.variant = v.v
        pu.locked = o.locked != null ? !!o.locked : !!v.locked
        break
      case 'card':
        pu.id = pu.id || rollContent(run, 'rollCard', rng, IS.cards)
        pu.variant = pu.variant || 'tarot'
        if (pu.id && IS.cardsById && IS.cardsById[pu.id]) {
          pu.def = IS.cardsById[pu.id]
          pu.variant = pu.def.cardType || pu.variant
        }
        break
      case 'rune':
        pu.id = pu.id || rollContent(run, 'rollRune', rng, IS.cards)
        pu.variant = 'rune'
        if (pu.id && IS.cardsById) pu.def = IS.cardsById[pu.id] || null
        break
      case 'pill':
        pu.id = pu.id || rollContent(run, 'rollPill', rng, IS.pills)
        if (pu.id && IS.pillsById) pu.def = IS.pillsById[pu.id] || null
        pu.colour = pu.colour || pillColour(run, rng)
        break
      case 'trinket':
        pu.id = pu.id || rollContent(run, 'rollTrinket', rng, IS.trinkets)
        if (pu.id && IS.trinketsById) pu.def = IS.trinketsById[pu.id] || null
        break
      default:
        break
    }

    // chests and sacks pick their contents now so a revealed chest can show them
    if ((kind === 'chest' || kind === 'sack') && !pu.contents && typeof IS.rollChestContents === 'function') {
      pu.contents = IS.rollChestContents(room, pu, run, rng)
    }

    if (o.price == null && (o.shop || pu.shop)) {
      var base = SHOP_PRICE[kind]
      if (kind === 'heart' && pu.variant === 'soul') base = SHOP_PRICE.soul
      pu.price = num(base, 5)
      pu.priceType = pu.priceType || 'coin'
    }
    if (pu.price > 0 && !pu.priceType) pu.priceType = 'coin'

    if (o.toss) tossPickup(pu, rng, o)
    room.pickups.push(pu)
    return pu
  }

  function findVariant (list, v) {
    for (var i = 0; i < list.length; i++) if (list[i].v === v) return list[i]
    return { v: v, w: 1, amount: 1 }
  }

  // Pool rolls degrade to a straight registry pick, so a room still gets a card
  // when pool.js has not initialised the run's pools yet.
  function rollContent (run, fnName, rng, registry) {
    if (run && typeof IS[fnName] === 'function') {
      var id = IS[fnName](run)
      if (id) return id
    }
    if (registry && registry.length) {
      var pick = pickOne(rng, registry)
      if (pick) return pick.id
    }
    warnOnce('roll:' + fnName, fnName + ' produced nothing; pickup spawns without an id')
    return null
  }

  function pillColour (run, rng) {
    if (run && run.pillColours) {
      var keys = Object.keys(run.pillColours)
      if (keys.length) return pickOne(rng, keys)
    }
    var list = IS.PILL_COLOURS || []
    var c = pickOne(rng, list)
    return c ? c.id : null
  }

  function tossPickup (pu, rng, o) {
    var a = o.tossAngle != null ? o.tossAngle : (rng ? rng.next() * 6.283 : 0)
    var sp = num(o.tossSpeed, 90)
    pu.vx = Math.cos(a) * sp
    pu.vy = Math.sin(a) * sp
    pu.z = 6
    pu.vz = num(o.tossUp, 150)
  }

  IS.spawnPedestal = function (room, itemId, x, y, opts) {
    if (!room) return null
    var o = opts || EMPTY
    if (!itemId) {
      warnOnce('pedestal-null', 'spawnPedestal called without an item id; nothing spawned')
      return null
    }
    var def = IS.itemsById ? IS.itemsById[itemId] : null
    if (!def) {
      warnOnce('pedestal:' + itemId, 'spawnPedestal got unknown item "' + itemId + '"; nothing spawned')
      return null
    }

    var pu = {
      kind: 'item',
      variant: def.kind || 'passive',
      id: itemId,
      itemId: itemId,
      def: def,
      amount: 1,
      heart: false,
      x: num(x, room.pxW / 2),
      y: num(y, room.pxH / 2),
      vx: 0,
      vy: 0,
      z: 0,
      vz: 0,
      r: PICKUP_R.item,
      bob: room.rng ? room.rng.next() * 6.283 : 0,
      age: 0,
      life: 0,
      magnet: 0,
      price: 0,
      priceType: null,
      soulPrice: 0,
      shop: !!o.shop,
      slot: num(o.slot, -1),
      pool: o.pool || null,
      optionsGroup: o.options != null ? String(o.options) : (o.optionsGroup != null ? String(o.optionsGroup) : null),
      locked: false,
      opened: false,
      contents: null,
      live: false,
      taken: false,
      removed: false,
      pedestal: true,
      meta: {}
    }

    if (o.price != null) {
      pu.price = num(o.price, 0)
      pu.priceType = o.priceType || (pu.price > 0 ? 'coin' : null)
    } else if (o.shop || room.type === 'shop' || room.type === 'black-market') {
      pu.shop = true
      pu.price = SHOP_PRICE.item
      pu.priceType = 'coin'
    } else if (room.type === 'devil') {
      // Devil deals are paid in half-hearts of container, or three soul hearts
      // when the player has no containers left to give.
      pu.priceType = 'heart'
      pu.price = num(def.quality, 1) >= 4 ? 4 : 2
      pu.soulPrice = 6
    } else if (room.type === 'angel' || room.type === 'planetarium') {
      pu.priceType = 'free'
    }

    room.pickups.push(pu)
    if (o.announce && typeof IS.audio !== 'undefined' && IS.audio && IS.audio.sfx) {
      IS.audio.sfx('pedestal-appear')
    }
    return pu
  }

  // 'options' groups: taking one pedestal makes its siblings vanish.
  function resolveOptions (room, group, ctx) {
    if (!group) return
    for (var i = 0; i < room.pickups.length; i++) {
      var pu = room.pickups[i]
      if (!pu || pu.removed || pu.taken) continue
      if (pu.optionsGroup !== group) continue
      pu.removed = true
      if (IS.fx && IS.fx.poof) IS.fx.poof(pu.x, pu.y, '#e8e4dc')
    }
    if (ctx && ctx.sfx) ctx.sfx('beep')
  }

  // ---------------------------------------------------------------------------
  // Template -> contents
  // ---------------------------------------------------------------------------

  IS.buildRoomContents = function (room, ctx) {
    if (!room || room.built) return
    room.built = true

    var def = room.def || EMPTY
    var id = def.id || '(anon)'
    var rng = IS.RNG ? new IS.RNG(room.seed) : room.rng
    room.rng = rng

    var layout = def.layout
    var legend = def.legend || EMPTY
    var chars = IS.GRID_CHARS || EMPTY
    var spawns = room.meta.spawns = []
    var pickupSpots = []
    var chestSpots = []
    var row, col, line, ch, kind

    if (!Array.isArray(layout)) {
      if (def.layout != null) warnOnce(id + ':layout', 'template "' + id + '" has a layout that is not an array; room left empty')
    } else {
      if (layout.length !== room.h) {
        warnOnce(id + ':rows', 'template "' + id + '" has ' + layout.length + ' rows, shape ' + room.shape + ' needs ' + room.h)
      }
      var rows = Math.min(layout.length, room.h)
      for (row = 0; row < rows; row++) {
        line = layout[row]
        if (typeof line !== 'string') {
          warnOnce(id + ':row-type', 'template "' + id + '" row ' + row + ' is not a string; skipped')
          continue
        }
        if (line.length !== room.w) {
          warnOnce(id + ':row-len', 'template "' + id + '" row ' + row + ' is ' + line.length + ' chars, shape ' + room.shape + ' needs ' + room.w)
        }
        var cols = Math.min(line.length, room.w)
        for (col = 0; col < cols; col++) {
          // L shapes are validated at the full w x h, so the missing quadrant
          // legitimately holds filler characters: skip before interpreting.
          if (!cellInShape(room, col, row)) continue
          ch = line.charAt(col)
          if (ch === '.') continue

          kind = chars[ch]
          if (kind === undefined) {
            var enemyId = legend[ch]
            if (enemyId == null) {
              warnOnce(id + ':char:' + ch, 'template "' + id + '" uses "' + ch + '" which is neither a grid character nor a legend entry; cell skipped')
              continue
            }
            placeLegend(room, ctx, id, ch, String(enemyId), col, row, spawns)
            continue
          }

          switch (kind) {
            case 'empty':
              break
            case 'safe':
              room.meta.safe[row * room.w + col] = true
              break
            case 'pickup':
              pickupSpots.push({ col: col, row: row })
              break
            case 'shop-slot':
              room.meta.shopSlots.push({ col: col, row: row })
              break
            case 'crawlspace':
              room.meta.crawlspaces.push(row * room.w + col)
              break
            case 'locked-chest':
              chestSpots.push({ col: col, row: row })
              break
            default:
              addTemplateGrid(room, kind, col, row, ch)
              break
          }
        }
      }
    }

    var i, spot
    for (i = 0; i < pickupSpots.length; i++) {
      spot = pickupSpots[i]
      var pick = weighted(rng, RANDOM_PICKUPS)
      IS.spawnPickup(room, pick.v, cellX(spot.col), cellY(spot.row), { rng: rng })
    }
    for (i = 0; i < chestSpots.length; i++) {
      spot = chestSpots[i]
      IS.spawnPickup(room, 'chest', cellX(spot.col), cellY(spot.row), {
        rng: rng, variant: 'golden', locked: true
      })
    }

    populateByType(room, ctx, rng)
    if (typeof IS.populateMachines === 'function') IS.populateMachines(room, ctx, rng)

    if (IS.roomEnemies(room).length) room.hadEnemies = true
    scatterDecor(room, rng)
  }

  function cellX (col) { return col * TILE + TILE / 2 }
  function cellY (row) { return row * TILE + TILE / 2 }

  function addTemplateGrid (room, kind, col, row, ch) {
    var spec = GRID[kind]
    if (!spec) {
      warnOnce('grid-kind:' + kind, 'grid kind "' + kind + '" has no definition; cell skipped')
      return null
    }
    var idx = row * room.w + col
    if (room.obstacles[idx]) return room.obstacles[idx]
    var g = makeGrid(room, kind, spec, col, row, ch, null)
    room.grid.push(g)
    room.obstacles[idx] = g
    room.obstacleCount++
    if (spec.creep && IS.fx && IS.fx.creep) {
      IS.fx.creep(g.x, g.y, TILE * 0.55, { kind: spec.creep, life: 0, slow: 0.7 })
    }
    return g
  }

  function placeLegend (room, ctx, id, ch, value, col, row, spawns) {
    var isBoss = value.indexOf('boss:') === 0
    var eid = isBoss ? value.slice(5) : value
    if (!eid || !IS.enemiesById || !IS.enemiesById[eid]) {
      warnOnce(id + ':legend:' + ch, 'template "' + id + '" legend "' + ch + '" -> "' + value + '" is not a known enemy; cell skipped')
      return null
    }
    var def = IS.enemiesById[eid]
    var x = cellX(col)
    var y = cellY(row)
    var e = null
    if (isBoss || def.boss) {
      // the first boss of a boss room stands in the middle, not wherever the legend put it
      if (room.type === 'boss' && !room.boss && room.pxW) { x = room.pxW / 2; y = room.pxH / 2 - 40 }
      if (typeof IS.spawnBoss === 'function') e = IS.spawnBoss(room, eid, x, y, {})
      room.boss = room.boss || eid
    } else if (typeof IS.spawnEnemy === 'function') {
      e = IS.spawnEnemy(room, eid, x, y, {})
    }
    if (!e) {
      warnOnce(id + ':spawn:' + eid, 'could not spawn "' + eid + '" for template "' + id + '"')
      return null
    }
    spawns.push({ id: eid, x: x, y: y, boss: !!(isBoss || def.boss) })
    room.hadEnemies = true
    return e
  }

  // Re-entering an uncleared room restores its original enemy set (Isaac does
  // the same); grid state and pickups persist from the first visit.
  function respawnEnemies (room, ctx) {
    var list = room.meta && room.meta.spawns
    if (!list || !list.length) return
    room.enemies.length = 0
    for (var i = 0; i < list.length; i++) {
      var s = list[i]
      if (s.boss && typeof IS.spawnBoss === 'function') IS.spawnBoss(room, s.id, s.x, s.y, {})
      else if (typeof IS.spawnEnemy === 'function') IS.spawnEnemy(room, s.id, s.x, s.y, {})
    }
    if (room.enemies.length) room.hadEnemies = true
  }

  function scatterDecor (room, rng) {
    if (!rng) return
    var n = 6 + rng.int(6)
    for (var i = 0; i < n; i++) {
      room.decor.push({
        kind: rng.int(3) === 0 ? 'crack' : 'pebble',
        x: rng.range(20, room.pxW - 20),
        y: rng.range(20, room.pxH - 20),
        r: rng.range(4, 13),
        rot: rng.range(0, 6.283)
      })
    }
  }

  // Rooms whose contents are a rule rather than a template.
  function populateByType (room, ctx, rng) {
    var fdef = floorDefOf(room.floor)
    var cx = room.pxW / 2
    var cy = room.pxH / 2
    var run = ctx ? ctx.run : null
    var i, id

    function pedestal (pool, x, y, opts) {
      var itemId = null
      if (ctx && typeof ctx.rollItem === 'function') itemId = ctx.rollItem(pool)
      else if (run && typeof IS.rollItem === 'function') itemId = IS.rollItem(run, pool)
      if (!itemId) {
        var list = IS.items || []
        var pickItem = pickOne(rng, list)
        itemId = pickItem ? pickItem.id : null
      }
      if (!itemId) return null
      var o = opts || {}
      o.pool = pool
      return IS.spawnPedestal(room, itemId, x, y, o)
    }

    function hasPedestal () {
      for (var k = 0; k < room.pickups.length; k++) {
        if (room.pickups[k] && room.pickups[k].kind === 'item') return true
      }
      return false
    }

    function ensureBoss (n) {
      var have = 0
      for (var k = 0; k < room.meta.spawns.length; k++) if (room.meta.spawns[k].boss) have++
      if (have >= n) return
      var pool = []
      var src = (fdef && fdef.bosses) || []
      for (i = 0; i < src.length; i++) if (IS.enemiesById && IS.enemiesById[src[i]]) pool.push(src[i])
      if (room.boss && IS.enemiesById && IS.enemiesById[room.boss]) pool.unshift(room.boss)
      if (!pool.length) {
        warnOnce('boss-pool:' + (fdef ? fdef.id : '?'), 'no known boss for this floor; boss room left empty')
        return
      }
      for (i = have; i < n; i++) {
        id = i === 0 && room.boss && IS.enemiesById[room.boss] ? room.boss : pickOne(rng, pool)
        var x = n > 1 ? cx + (i === 0 ? -150 : 150) : cx
        if (typeof IS.spawnBoss !== 'function') break
        var b = IS.spawnBoss(room, id, x, cy - 40, { double: n > 1 })
        if (!b) continue
        room.boss = room.boss || id
        room.meta.spawns.push({ id: id, x: x, y: cy - 40, boss: true })
        room.hadEnemies = true
      }
    }

    switch (room.type) {
      case 'boss':
        ensureBoss(1)
        break
      case 'boss-double':
        ensureBoss(2)
        break
      case 'miniboss':
        ensureBoss(1)
        break
      case 'treasure':
        if (!hasPedestal()) {
          var opt = room.def && room.def.subtype === 2
          if (opt) {
            pedestal('treasure', cx - 150, cy, { options: 'treasure-' + room.seed, announce: true })
            pedestal('treasure', cx + 150, cy, { options: 'treasure-' + room.seed, announce: true })
          } else {
            pedestal('treasure', cx, cy, { announce: true })
          }
        }
        break
      case 'shop':
      case 'black-market':
        fillShop(room, ctx, rng, pedestal)
        break
      case 'devil':
        if (typeof IS.spawnDevilDeal === 'function' && run) IS.spawnDevilDeal(room, run, ctx)
        else if (!hasPedestal()) pedestal('devil', cx, cy)
        break
      case 'angel':
        if (typeof IS.spawnAngelDeal === 'function' && run) IS.spawnAngelDeal(room, run, ctx)
        else if (!hasPedestal()) pedestal('angel', cx, cy)
        break
      case 'library':
        if (!hasPedestal()) {
          pedestal('library', cx - 170, cy)
          pedestal('library', cx + 170, cy)
        }
        break
      case 'planetarium':
        if (!hasPedestal()) pedestal('planetarium', cx, cy, { announce: true })
        break
      case 'ultra-secret':
        if (!hasPedestal()) pedestal('ultra-secret', cx, cy)
        break
      case 'curse':
        if (!hasPedestal()) pedestal('curse', cx, cy)
        break
      case 'vault':
        IS.spawnPickup(room, 'chest', cx - 110, cy, { rng: rng, variant: 'golden', locked: true })
        IS.spawnPickup(room, 'chest', cx + 110, cy, { rng: rng, variant: 'golden', locked: true })
        break
      case 'chest-room':
        var n = 4 + (rng ? rng.int(3) : 0)
        for (i = 0; i < n; i++) {
          var pos = IS.freeFloorPos(room, rng, { minPlayerDist: 0 })
          IS.spawnPickup(room, 'chest', pos.x, pos.y, { rng: rng })
        }
        break
      case 'bedroom':
        IS.spawnPickup(room, 'heart', cx - 60, cy + 60, { rng: rng, variant: 'full' })
        IS.spawnPickup(room, 'heart', cx + 60, cy + 60, { rng: rng, variant: 'full' })
        break
      case 'dirty-bedroom':
        IS.addGrid(room, 'poop', cx, cy + 80, null)
        IS.spawnPickup(room, 'heart', cx, cy + 60, { rng: rng, variant: 'half' })
        break
      case 'sacrifice':
        if (!gridUnder(room, cx, cy)) IS.addGrid(room, 'spikes', cx, cy, null)
        break
      case 'crawlspace':
        // the ladder back up; down here sits an underground shop, an item or a stash
        room.ladder = { x: cx, y: room.pxH - TILE * 1.2 }
        var roll = rng ? rng.next() : 0
        if (roll < 0.4) { room.meta.shopSlots = [{ col: 3, row: 2 }, { col: 6, row: 2 }, { col: 9, row: 2 }]; fillShop(room, ctx, rng, pedestal) }
        else if (roll < 0.8) { if (!hasPedestal()) pedestal('treasure', cx, cy - 60, { announce: true }) }
        else {
          IS.spawnPickup(room, 'chest', cx, cy - 40, { rng: rng })
          IS.spawnPickup(room, 'coin', cx - 70, cy, { rng: rng })
        }
        break
      case 'secret':
      case 'super-secret':
        if (!room.pickups.length) {
          IS.spawnPickup(room, 'coin', cx, cy, { rng: rng })
          IS.spawnPickup(room, 'heart', cx + 90, cy, { rng: rng })
        }
        break
      default:
        break
    }
  }

  function fillShop (room, ctx, rng, pedestal) {
    var slots = room.meta.shopSlots
    if (!slots.length) {
      var cy = Math.floor(room.h / 2)
      var mid = Math.floor(room.w / 2)
      slots = [
        { col: mid - 3, row: cy }, { col: mid, row: cy }, { col: mid + 3, row: cy }
      ]
      room.meta.shopSlots = slots
    }
    var consumables = ['heart', 'bomb', 'key', 'pill', 'card', 'battery', 'soul', 'sack']
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i]
      var x = cellX(s.col)
      var y = cellY(s.row)
      if (!cellInShape(room, s.col, s.row)) continue
      // The middle slot of a shop always sells a collectible; the rest sell
      // consumables, which is what makes an early shop worth entering.
      if (i === Math.floor(slots.length / 2) || (rng && rng.chance(0.25))) {
        var pu = pedestal(room.type === 'black-market' ? 'shop' : 'shop', x, y, { shop: true, slot: i })
        if (pu) continue
      }
      var kind = pickOne(rng, consumables) || 'heart'
      IS.spawnPickup(room, kind, x, y, { rng: rng, shop: true, slot: i })
    }
  }

  // ---------------------------------------------------------------------------
  // Destroying grid objects
  // ---------------------------------------------------------------------------

  IS.destroyGrid = function (room, g, ctx) {
    if (!room || !g || g.broken) return
    if (!g.destructible) return

    // Pits do not break — a blast bridges them.
    if (g.pit && !g.bridged) {
      g.bridged = true
      g.solid = false
      g.hazard = false
      if (ctx && ctx.sfx) ctx.sfx('rock-break')
      if (IS.fx && IS.fx.particles) {
        IS.fx.particles({ x: g.x, y: g.y, n: 8, colour: '#8a7461', speed: 90, life: 0.4, size: 4, spread: 6.283 })
      }
      return
    }

    g.broken = true
    g.solid = false
    g.hazard = false
    var idx = g.row * room.w + g.col
    if (room.obstacles[idx] === g) room.obstacles[idx] = g // keep for rubble art; solidAt skips broken

    var rng = playRng(room, ctx)
    if (ctx && ctx.sfx) ctx.sfx(g.sfx || 'rock-break')
    if (IS.fx) {
      var col = g.tint || rubbleColour(room, g)
      if (IS.fx.particles) {
        IS.fx.particles({ x: g.x, y: g.y, n: 10, colour: col, speed: 130, life: 0.45, size: 5, spread: 6.283, gravity: 320 })
      }
      if (IS.fx.decal) IS.fx.decal(g.x, g.y, 22, col)
    }

    if (g.tnt) {
      explodeTnt(room, g, ctx)
    } else if (g.drop) {
      dropFor(room, g, ctx, rng)
    }

    if (g.kind === 'red-poop' && IS.fx && IS.fx.creep) {
      IS.fx.creep(g.x, g.y, TILE * 0.7, { kind: 'red', dmg: 0, slow: 0.7, life: 0 })
    }
    if (g.kind === 'corn-poop') {
      var corny = IS.addGrid(room, 'corny-poop', g.x, g.y, null)
      if (corny) corny.meta.fromCorn = true
      if (ctx && ctx.sfx) ctx.sfx('fart')
      if (IS.fx && IS.fx.creep) IS.fx.creep(g.x, g.y, TILE * 0.6, { kind: 'green', dmg: 0, slow: 0.6, life: 0 })
    }

    revealSecret(room, g, ctx)

    // A crawlspace candidate cell sometimes hides a hatch.
    var spots = room.meta.crawlspaces
    if (spots && spots.length && spots.indexOf(idx) >= 0 && typeof IS.spawnCrawlspace === 'function') {
      if (chance(rng, 0.35)) {
        IS.spawnCrawlspace(room, g.x, g.y)
        if (ctx && ctx.sfx) ctx.sfx('secret-found')
      }
    }

    if (ctx && ctx.player && typeof IS.fireHook === 'function') {
      IS.fireHook(ctx.player, 'onGridBreak', [g], ctx)
    }
  }

  function rubbleColour (room, g) {
    var pal = room.palette
    if (g.kind === 'poop' || g.kind === 'corn-poop') return '#6b4b2a'
    if (g.kind === 'golden-poop') return '#d8b040'
    if (g.kind === 'red-poop') return '#8a2018'
    if (g.fire) return '#e08a30'
    if (pal && pal.wall) return pal.wall
    return '#8a7461'
  }

  function dropFor (room, g, ctx, rng) {
    var run = ctx ? ctx.run : null
    var roll
    switch (g.drop) {
      case 'tinted':
        // Tinted rocks always pay out; a soul heart is the classic result.
        roll = weighted(rng, [
          { v: 'soul', w: 30 }, { v: 'coin', w: 24 }, { v: 'card', w: 14 },
          { v: 'pill', w: 10 }, { v: 'trinket', w: 10 }, { v: 'key', w: 12 }
        ]).v
        IS.spawnPickup(room, roll, g.x, g.y, { rng: rng, run: run, toss: true })
        break
      case 'marked':
        // Marked skulls are the rare "super" rock: an item, or a fat consolation.
        var itemId = ctx && typeof ctx.rollItem === 'function' ? ctx.rollItem('secret') : null
        if (itemId) {
          IS.spawnPedestal(room, itemId, g.x, g.y, { pool: 'secret', announce: true })
        } else {
          IS.spawnPickup(room, 'soul', g.x, g.y, { rng: rng, run: run, toss: true })
          IS.spawnPickup(room, 'coin', g.x + 30, g.y, { rng: rng, run: run, variant: 'nickel', toss: true })
        }
        break
      case 'poop':
        if (chance(rng, 0.05)) IS.spawnPickup(room, 'coin', g.x, g.y, { rng: rng, run: run, variant: 'penny', toss: true })
        break
      case 'golden-poop':
        var n = 1 + (rng ? rng.int(3) : 1)
        for (var i = 0; i < n; i++) {
          IS.spawnPickup(room, 'coin', g.x, g.y, {
            rng: rng, run: run, variant: chance(rng, 0.25) ? 'nickel' : 'penny', toss: true
          })
        }
        break
      case 'red-poop':
        break
      case 'corn-poop':
        if (chance(rng, 0.35)) IS.spawnPickup(room, 'coin', g.x, g.y, { rng: rng, run: run, toss: true })
        break
      case 'vase':
        roll = rng ? rng.next() : 0.5
        if (roll < 0.4) IS.spawnPickup(room, 'coin', g.x, g.y, { rng: rng, run: run, toss: true })
        else if (roll < 0.6) IS.spawnPickup(room, 'heart', g.x, g.y, { rng: rng, run: run, variant: 'half', toss: true })
        else if (roll < 0.8) spawnCritters(room, g, ctx, rng, 'spider', 2)
        break
      case 'mushroom':
        roll = rng ? rng.next() : 0.5
        if (roll < 0.45) {
          IS.spawnPickup(room, weighted(rng, RANDOM_PICKUPS).v, g.x, g.y, { rng: rng, run: run, toss: true })
        } else if (roll < 0.7) {
          spawnCritters(room, g, ctx, rng, 'mushroom', 1)
        }
        break
      default:
        break
    }
  }

  // Only ever used with ids that may not exist in the registry yet.
  function spawnCritters (room, g, ctx, rng, id, n) {
    if (!IS.enemiesById || !IS.enemiesById[id] || typeof IS.spawnEnemy !== 'function') return
    for (var i = 0; i < n; i++) {
      var a = (rng ? rng.next() : 0.25) * 6.283 + i
      IS.spawnEnemy(room, id, g.x + Math.cos(a) * 18, g.y + Math.sin(a) * 18, {})
    }
    room.hadEnemies = true
  }

  function explodeTnt (room, g, ctx) {
    var rng = playRng(room, ctx)
    var dmg = 60
    if (ctx && ctx.player && ctx.player.stats && ctx.player.stats.bombDamage) {
      dmg = ctx.player.stats.bombDamage
    }
    if (ctx && ctx.sfx) ctx.sfx('bomb-explode')
    if (ctx && ctx.shake) ctx.shake(7, 0.3)

    if (typeof IS.bombExplode === 'function') {
      IS.bombExplode(g.x, g.y, { r: 110, dmg: dmg, tnt: true, friendly: false }, ctx)
    } else {
      // No projectile layer (harness): still take the neighbours down.
      for (var d = 0; d < 4; d++) {
        var dir = IS.DIRS[d]
        var v = IS.DIR_VEC[dir]
        var nb = IS.gridAt(room, g.col + v.x, g.row + v.y)
        if (nb && nb.destructible) IS.destroyGrid(room, nb, ctx)
      }
    }

    // Chain: light every barrel just outside the blast so it goes up in sequence.
    var lit = 0
    for (var i = 0; i < room.grid.length; i++) {
      var o = room.grid[i]
      if (!o || o === g || o.broken || !o.tnt || o.lit) continue
      var dx = o.x - g.x
      var dy = o.y - g.y
      if (dx * dx + dy * dy > 170 * 170) continue
      o.lit = true
      o.fuse = 0.22 + lit * 0.12 + (rng ? rng.next() * 0.08 : 0)
      lit++
    }
  }

  // ---------------------------------------------------------------------------
  // Per-tick room update
  // ---------------------------------------------------------------------------

  IS.updateRoom = function (room, dt, ctx) {
    if (!room) return
    if (typeof dt !== 'number' || dt !== dt || dt < 0) dt = IS.DT
    room.time += dt
    if (room.cleared) room.clearT += dt

    updateGridObjects(room, dt, ctx)
    updateHazards(room, dt, ctx)
    updatePickups(room, dt, ctx)
    if (typeof IS.updateMachines === 'function') IS.updateMachines(room, dt, ctx)
    drainPending(room, dt, ctx)

    if (typeof IS.updateEnemies === 'function') IS.updateEnemies(room, dt, ctx)
    if (typeof IS.updateProjectiles === 'function') IS.updateProjectiles(room, dt, ctx)

    if (IS.roomEnemies(room).length) room.hadEnemies = true
    updateAmbush(room, dt, ctx)
    IS.checkClear(room, ctx)
  }

  function updateGridObjects (room, dt, ctx) {
    var list = room.grid
    if (!list.length) return
    var spikeT = (room.meta.spikeT = (room.meta.spikeT || 0) + dt) % SPIKE_CYCLE
    var spikesUp = spikeT < SPIKE_UP
    var p = ctx ? ctx.player : null

    for (var i = 0; i < list.length; i++) {
      var g = list[i]
      if (!g || g.broken) continue

      if (g.retract) {
        g.up = spikesUp
        g.warn = !spikesUp && spikeT > SPIKE_CYCLE - 0.35
        continue
      }

      if (g.fire) {
        g.flicker += dt * 7
        if (g.shoots) {
          g.shootT -= dt
          if (g.shootT <= 0) {
            g.shootT = 2.2 + (room.rng ? room.rng.next() * 1.4 : 0.7)
            fireBlueFlame(room, g, ctx, p)
          }
        }
        continue
      }

      if (g.tnt && g.lit) {
        g.fuse -= dt
        if (g.fuse <= 0) IS.destroyGrid(room, g, ctx)
      }
    }
  }

  function fireBlueFlame (room, g, ctx, p) {
    if (typeof IS.spawnEnemyShot !== 'function') return
    var ang = 0
    if (p) ang = Math.atan2(p.y - g.y, p.x - g.x)
    IS.spawnEnemyShot({
      x: g.x, y: g.y, angle: ang, speed: 220, dmg: 1, r: 10,
      flags: ['homing'], friendly: false, life: 3.2, src: g
    }, ctx)
    if (ctx && ctx.sfx) ctx.sfx('web-shot')
  }

  function updateHazards (room, dt, ctx) {
    var p = ctx ? ctx.player : null
    var m = room.meta
    m.hazT = (m.hazT || 0) + dt
    var slowTick = m.hazT >= HAZARD_TICK
    if (slowTick) m.hazT = 0

    if (p && !p.dead) {
      var flying = hasFlag(p, 'flying')
      var g = gridUnder(room, p.x, p.y)

      if (g && !flying) {
        if (g.hazard && g.dmg > 0 && (!g.retract || g.up)) {
          if (typeof IS.damagePlayer === 'function') IS.damagePlayer(p, g.dmg, 'spikes', ctx)
        }
        if (g.web && slowTick && typeof IS.applyStatus === 'function') {
          IS.applyStatus(p, 'slow', 0.35, ctx)
        }
      }

      // Fireplaces are solid, so touching one is a proximity test.
      if (!flying) touchFire(room, p, ctx)

      if (IS.fx && typeof IS.fx.creepAt === 'function') {
        var creep = IS.fx.creepAt(p.x, p.y)
        if (creep) {
          if (creep.dmg > 0 && !creep.friendly) {
            m.creepT = (m.creepT || 0) + dt
            if (m.creepT >= CREEP_TICK) {
              m.creepT = 0
              if (typeof IS.damagePlayer === 'function') IS.damagePlayer(p, creep.dmg, 'creep', ctx)
            }
          }
          if (creep.slow && slowTick && typeof IS.applyStatus === 'function') {
            IS.applyStatus(p, 'slow', 0.3, ctx)
          }
        } else {
          m.creepT = 0
        }
      }
    }

    // Friendly creep (Lemegeton-style pools, holy water) eats into enemies.
    if (!slowTick || !IS.fx || typeof IS.fx.creepAt !== 'function') return
    var list = room.enemies
    for (var i = 0; i < list.length; i++) {
      var e = list[i]
      if (!e || e.dead || e.flying) continue
      var c = IS.fx.creepAt(e.x, e.y)
      if (!c) continue
      if (c.dmg > 0 && c.friendly && typeof IS.damageEnemy === 'function') {
        IS.damageEnemy(e, c.dmg * HAZARD_TICK, { src: 'creep' }, ctx)
      }
      if (c.slow && typeof IS.applyStatus === 'function') IS.applyStatus(e, 'slow', 0.3, ctx)
      var wg = gridUnder(room, e.x, e.y)
      if (wg && wg.web && typeof IS.applyStatus === 'function') IS.applyStatus(e, 'slow', 0.35, ctx)
    }
  }

  function touchFire (room, p, ctx) {
    var col = Math.floor(p.x / TILE)
    var row = Math.floor(p.y / TILE)
    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        var g = IS.gridAt(room, col + dx, row + dy)
        if (!g || !g.fire) continue
        var ax = p.x - g.x
        var ay = p.y - g.y
        var rad = (p.r || 26) + TILE * 0.4
        if (ax * ax + ay * ay > rad * rad) continue
        if (typeof IS.damagePlayer === 'function') IS.damagePlayer(p, g.dmg || 1, 'fire', ctx)
        return
      }
    }
  }

  function updatePickups (room, dt, ctx) {
    var list = room.pickups
    if (!list.length) return
    var p = ctx ? ctx.player : null

    for (var i = list.length - 1; i >= 0; i--) {
      var pu = list[i]
      if (!pu) { list.splice(i, 1); continue }

      if (pu.taken) {
        if (pu.optionsGroup) resolveOptions(room, pu.optionsGroup, ctx)
        list.splice(i, 1)
        continue
      }
      if (pu.removed) { list.splice(i, 1); continue }

      pu.age += dt
      pu.bob += dt * 3.4

      if (pu.z > 0 || pu.vz !== 0) {
        pu.vz -= 700 * dt
        pu.z += pu.vz * dt
        pu.x += pu.vx * dt
        pu.y += pu.vy * dt
        pu.vx *= 0.92
        pu.vy *= 0.92
        if (pu.z <= 0) { pu.z = 0; pu.vz = 0; pu.vx = 0; pu.vy = 0 }
        clampPickup(room, pu)
      }

      if (pu.magnet > 0 && p && !p.dead) {
        var dx = p.x - pu.x
        var dy = p.y - pu.y
        var d2 = dx * dx + dy * dy
        if (d2 > 1 && d2 < pu.magnet * pu.magnet) {
          var d = Math.sqrt(d2)
          var sp = 260 * dt
          pu.x += (dx / d) * sp
          pu.y += (dy / d) * sp
        }
      }

      if (pu.life > 0) {
        pu.life -= dt
        if (pu.life <= 0) {
          if (IS.fx && IS.fx.poof) IS.fx.poof(pu.x, pu.y, '#8a7461')
          list.splice(i, 1)
        }
      }
    }
  }

  function clampPickup (room, pu) {
    if (typeof IS.clampToRoom === 'function') { IS.clampToRoom(room, pu); return }
    var r = pu.r || 18
    if (pu.x < r) pu.x = r
    if (pu.y < r) pu.y = r
    if (pu.x > room.pxW - r) pu.x = room.pxW - r
    if (pu.y > room.pxH - r) pu.y = room.pxH - r
  }

  // room.pendingSpawns holds { id, x, y, t, boss, opts } — anything can queue a
  // delayed spawn, and an unfinished queue blocks the room from clearing.
  function drainPending (room, dt, ctx) {
    var q = room.pendingSpawns
    if (!q || !q.length) return
    for (var i = q.length - 1; i >= 0; i--) {
      var s = q[i]
      if (!s) { q.splice(i, 1); continue }
      s.t = num(s.t, 0) - dt
      if (s.t > 0) continue
      q.splice(i, 1)
      var pos = s.x == null || s.y == null
        ? IS.freeFloorPos(room, playRng(room, ctx), { minPlayerDist: 140 })
        : { x: s.x, y: s.y }
      if (s.boss && typeof IS.spawnBoss === 'function') IS.spawnBoss(room, s.id, pos.x, pos.y, s.opts || {})
      else if (typeof IS.spawnEnemy === 'function') IS.spawnEnemy(room, s.id, pos.x, pos.y, s.opts || {})
      if (IS.fx && IS.fx.poof) IS.fx.poof(pos.x, pos.y, '#b04a3a')
      room.hadEnemies = true
    }
  }

  // ---------------------------------------------------------------------------
  // Ambush waves (challenge rooms, boss rush)
  // ---------------------------------------------------------------------------

  function buildWaves (room) {
    var fdef = floorDefOf(room.floor)
    var rng = room.rng
    var waves = []
    var i, j, id

    if (room.type === 'boss-rush') {
      var bosses = []
      var src = (fdef && fdef.bosses) || []
      for (i = 0; i < src.length; i++) if (IS.enemiesById && IS.enemiesById[src[i]]) bosses.push(src[i])
      if (!bosses.length) return waves
      var pairs = Math.min(8, Math.max(2, Math.ceil(bosses.length / 2)))
      for (i = 0; i < pairs; i++) {
        var wave = []
        for (j = 0; j < 2; j++) {
          id = bosses[(i * 2 + j) % bosses.length]
          wave.push({ id: id, boss: true })
        }
        waves.push(wave)
      }
      return waves
    }

    var pool = []
    var ep = (fdef && fdef.enemyPool) || []
    for (i = 0; i < ep.length; i++) if (IS.enemiesById && IS.enemiesById[ep[i]]) pool.push(ep[i])
    if (!pool.length) return waves
    for (i = 0; i < 3; i++) {
      var w = []
      var n = 3 + i
      for (j = 0; j < n; j++) w.push({ id: pickOne(rng, pool), boss: false })
      waves.push(w)
    }
    return waves
  }

  function startAmbush (room, ctx) {
    if (room.cleared) return
    if (room.ambush && (room.ambush.pending || room.ambush.done)) return
    var waves = buildWaves(room)
    room.ambush = {
      active: waves.length > 0,
      pending: waves.length > 0,
      done: waves.length === 0,
      waves: waves,
      wave: -1,
      timer: 0,
      delay: room.type === 'boss-rush' ? 1.6 : 1.1
    }
    room.ambushWave = 0
    if (!waves.length) {
      warnOnce('ambush:' + (room.def ? room.def.id : '?'), 'no enemies available for the ambush in "' + room.type + '"; room clears immediately')
      return
    }
    shutDoors(room)
    if (ctx && ctx.music) ctx.music('chase')
  }

  function updateAmbush (room, dt, ctx) {
    var a = room.ambush
    if (!a || !a.pending) return
    if (IS.roomEnemies(room).length) { a.timer = 0; return }
    if (room.pendingSpawns && room.pendingSpawns.length) { a.timer = 0; return }
    a.timer += dt
    if (a.timer < a.delay) return
    a.timer = 0
    a.wave++
    room.ambushWave = a.wave
    if (a.wave >= a.waves.length) {
      a.pending = false
      a.active = false
      a.done = true
      return
    }
    var wave = a.waves[a.wave]
    var rng = playRng(room, ctx)
    for (var i = 0; i < wave.length; i++) {
      var pos = IS.freeFloorPos(room, rng, { minPlayerDist: 200, allowSafe: false })
      room.pendingSpawns.push({
        id: wave[i].id, x: pos.x, y: pos.y, boss: wave[i].boss, t: 0.35 + i * 0.12
      })
    }
    if (ctx && ctx.sfx) ctx.sfx(wave[0] && wave[0].boss ? 'boss-roar' : 'beep')
    shutDoors(room)
  }

  // ---------------------------------------------------------------------------
  // Clear logic
  // ---------------------------------------------------------------------------

  IS.checkClear = function (room, ctx) {
    if (!room) return false
    if (room.cleared) return true
    if (room.clearing) return false
    if (IS.roomEnemies(room).length) return false
    if (room.pendingSpawns && room.pendingSpawns.length) return false
    if (room.ambush && room.ambush.pending) return false

    room.clearing = true
    try {
      finishClear(room, ctx)
    } catch (err) {
      warnOnce('clear-threw', 'clearing "' + (room.def ? room.def.id : '?') + '" threw: ' + (err && err.message))
    }
    room.clearing = false
    return true
  }

  function finishClear (room, ctx) {
    room.cleared = true
    room.clearT = 0
    if (room.ambush) { room.ambush.active = false; room.ambush.pending = false; room.ambush.done = true }

    IS.openDoors(room, ctx)

    var run = ctx ? ctx.run : null
    var p = ctx ? ctx.player : null

    if (p && typeof IS.fireHook === 'function') IS.fireHook(p, 'onRoomClear', [room], ctx)

    // Only a fight charges an active item.
    if (p && room.hadEnemies && !(p.flags && p.flags.has && p.flags.has('noRoomCharge')) && typeof IS.addCharge === 'function' && Array.isArray(p.active)) {
      for (var s = 0; s < p.active.length; s++) {
        var slot = p.active[s]
        if (!slot || !slot.id) continue
        var adef = IS.itemsById ? IS.itemsById[slot.id] : null
        if (adef && adef.chargeType === 'timed') continue
        IS.addCharge(p, 1, s)
      }
    }

    if (run) {
      if (!run.stats) run.stats = {}
      run.stats.roomsCleared = num(run.stats.roomsCleared, 0) + 1
    }
    var floor = ctx ? ctx.floor : null
    if (floor) floor.clearedCount = num(floor.clearedCount, 0) + 1

    rollReward(room, ctx, run, floor, p)

    if (ctx && ctx.music) ctx.music('floor')
  }

  function rollReward (room, ctx, run, floor, p) {
    var rng = playRng(room, ctx)
    var cx = room.pxW / 2
    var cy = room.pxH / 2

    switch (room.type) {
      case 'boss':
      case 'boss-double': {
        var itemId = ctx && typeof ctx.rollItem === 'function' ? ctx.rollItem('boss') : null
        if (run && run.flags && run.flags.satanicBible && room.type === 'boss' && typeof IS.spawnDevilDeal === 'function') {
          // Satanic Bible used before the fight: the reward is a devil deal instead of the boss item
          run.flags.satanicBible = false
          IS.spawnDevilDeal(room, run, ctx)
        } else if (itemId) IS.spawnPedestal(room, itemId, cx, cy - 50, { pool: 'boss', announce: true })

        // The room the harness builds standalone has index -1 and is not on the
        // floor: no trapdoor, no floor progress from it.
        // Curse of the Labyrinth floors have two bosses: the way down opens with the last one
        var bosses = floor && floor.bossIndices
        var lastBoss = !bosses || bosses.every(function (bi) { return !floor.rooms[bi] || floor.rooms[bi].cleared })
        if (room.index >= 0 && lastBoss) {
          if (typeof IS.spawnTrapdoor === 'function' && hasNextFloor(run)) {
            IS.spawnTrapdoor(room, cx, cy + 110, {})
          }
          if (floor && !floor.cleared) {
            floor.cleared = true
            if (IS.progress && typeof IS.progress.record === 'function') {
              IS.progress.record('floor-cleared', { floor: floor.id || (floor.def && floor.def.id) || null }, run)
            }
            if (p && typeof IS.fireHook === 'function') IS.fireHook(p, 'onFloorClear', [floor], ctx)
            if (typeof IS.rollBossDoors === 'function') IS.rollBossDoors(floor, run, ctx)
          }
        }
        if (ctx && ctx.sfx) ctx.sfx('floor-clear')
        break
      }
      case 'miniboss': {
        if (chance(rng, 0.4)) IS.spawnPickup(room, 'chest', cx, cy, { rng: rng, run: run, toss: true })
        else IS.spawnPickup(room, weighted(rng, RANDOM_PICKUPS).v, cx, cy, { rng: rng, run: run, toss: true })
        break
      }
      case 'challenge':
      case 'boss-rush': {
        var reward = ctx && typeof ctx.rollItem === 'function' ? ctx.rollItem('boss') : null
        if (reward) IS.spawnPedestal(room, reward, cx, cy, { pool: 'boss', announce: true })
        if (room.type === 'boss-rush') {
          if (run) {
            if (!run.flags) run.flags = {}
            run.flags.bossRushDone = true
          }
          if (IS.progress && typeof IS.progress.record === 'function') {
            IS.progress.record('boss-killed', { id: 'boss-rush', bossRush: true }, run)
          }
        }
        if (ctx && ctx.sfx) ctx.sfx('floor-clear')
        break
      }
      default:
        break
    }
  }

  function hasNextFloor (run) {
    if (!run) return false
    if (typeof IS.nextFloorIds !== 'function') return true
    try {
      var ids = IS.nextFloorIds(run)
      return !!(ids && (ids.normal || ids.alt))
    } catch (err) {
      return false
    }
  }

  // ---------------------------------------------------------------------------
  // Transitions
  // ---------------------------------------------------------------------------

  function musicFor (room) {
    switch (room.type) {
      case 'boss':
      case 'boss-double':
      case 'boss-rush':
        return 'boss'
      case 'shop':
      case 'library':
      case 'arcade':
      case 'vault':
      case 'bedroom':
      case 'dirty-bedroom':
      case 'planetarium':
      case 'black-market':
        return 'shop'
      case 'devil':
      case 'angel':
        return 'devil'
      default:
        return 'floor'
    }
  }

  function nudgeInside (room, p) {
    if (!p) return
    var cx = room.pxW / 2
    var cy = room.pxH / 2
    var opts = { flying: hasFlag(p, 'flying') }
    for (var i = 0; i < 14; i++) {
      if (!IS.solidAt(room, p.x, p.y, opts)) return
      p.x += (cx - p.x) * 0.22
      p.y += (cy - p.y) * 0.22
    }
    p.x = cx
    p.y = cy
  }

  IS.enterRoom = function (run, roomIndex, fromDir, ctx) {
    if (!run) return null
    var floor = run.floor
    if (!floor || !Array.isArray(floor.rooms)) {
      warnOnce('enter-no-floor', 'enterRoom called with no generated floor')
      return null
    }
    var room = floor.rooms[roomIndex]
    if (!room) {
      warnOnce('enter-bad-index', 'enterRoom got index ' + roomIndex + ', which is not a room on this floor')
      return null
    }

    // Curse of the Maze: a door sometimes leads to a different ordinary room
    if (fromDir && IS.CURSE && (num(run.curses, 0) & IS.CURSE.MAZE) && room.type === 'default' && run.rng && run.rng.chance(0.4)) {
      var alts = floor.rooms.filter(function (r) { return r && r.type === 'default' && r !== room && r !== run.room && !r.virtual })
      if (alts.length) { room = run.rng.pick(alts); roomIndex = room.index; fromDir = null }
    }

    var old = run.room
    if (old && old !== room) {
      // Projectiles never survive a transition; grid, pickups and clear state do.
      old.tears.length = 0
      old.shots.length = 0
      old.lasers.length = 0
      old.knives.length = 0
      old.effects.length = 0
      old.bombs.length = 0
      if (old.meta) { old.meta.hazT = 0; old.meta.creepT = 0 }
      run.prevRoomIndex = old.index
      old.leftAt = num(run.time, 0)
    }

    if (IS.fx && typeof IS.fx.reset === 'function') IS.fx.reset()

    room.firstVisit = !room.visited
    room.visited = true
    room.mapKnown = true
    room.entryDir = fromDir || null
    room.dark = !!(num(run.curses, 0) & (IS.CURSE ? IS.CURSE.DARKNESS : 0))
    run.room = room
    run.roomIndex = roomIndex
    floor.current = roomIndex
    floor.currentIndex = roomIndex
    if (room.firstVisit) floor.visitedCount = num(floor.visitedCount, 0) + 1

    if (ctx) IS.refreshCtx(ctx, room, ctx.dt)

    var p = run.player
    if (p) {
      var d = entryDoor(room, fromDir, run.prevRoomIndex)
      if (d) { p.x = d.insideX; p.y = d.insideY } else { p.x = room.pxW / 2; p.y = room.pxH / 2 }
      p.vx = 0
      p.vy = 0
      nudgeInside(room, p)
    }

    if (!room.built) IS.buildRoomContents(room, ctx)
    else if (!room.cleared) respawnEnemies(room, ctx)

    // Reveal the neighbours on the map, the way walking into a room does.
    for (var i = 0; i < room.doors.length; i++) {
      var door = room.doors[i]
      if (!door || door.target == null || door.hidden) continue
      var nb = floor.rooms[door.target]
      if (nb) nb.mapKnown = true
    }
    if (typeof IS.applyMapFlags === 'function') IS.applyMapFlags(run)

    if (!room.cleared && (room.type === 'challenge' || room.type === 'boss-rush')) {
      startAmbush(room, ctx)
    }

    if (room.cleared) IS.openDoors(room, ctx)
    else if (IS.roomEnemies(room).length || (room.ambush && room.ambush.pending)) shutDoors(room)

    if (ctx && ctx.music) ctx.music(musicFor(room))

    if (p && typeof IS.fireHook === 'function') IS.fireHook(p, 'onRoomEnter', [room], ctx)

    if (IS.progress && typeof IS.progress.record === 'function') {
      IS.progress.record('room-visited', {
        index: roomIndex, type: room.type, firstVisit: room.firstVisit
      }, run)
    }

    // An already-empty room (start, shop, treasure) counts as cleared on entry.
    IS.checkClear(room, ctx)
    return room
  }

})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
