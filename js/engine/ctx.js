;(function (IS) {
  'use strict'

  // ---------------------------------------------------------------------------
  // ISUCK — ctx, the one object every hook receives.
  //
  // Built once per run by IS.makeCtx(run) and mutated in place by
  // IS.refreshCtx(ctx, room, dt) every frame, so a hook may safely hold a
  // reference to it. Every method is bound once here — nothing in this file
  // allocates a closure per frame.
  //
  // This is the only file in the project allowed to be a pass-through layer:
  // each method defaults its arguments and forwards to the owning subsystem
  // (see docs/ENGINE-API.md). The surface is ARCHITECTURE.md §9, exactly.
  //
  // Hooks can fire during transitions, so every method tolerates a null room
  // and a null player by returning a harmless value instead of throwing.
  // ---------------------------------------------------------------------------

  var LOG_CAP = 300

  var warned = Object.create(null)

  function warnOnce (key, msg) {
    if (warned[key]) return
    warned[key] = true
    console.warn(msg)
  }

  // Resolve an engine function, complaining at most once if it is not loaded.
  // Keeps ctx usable in the node harness, where whole layers are absent.
  function fn (name) {
    var f = IS[name]
    if (typeof f === 'function') return f
    warnOnce('fn:' + name, 'ctx: IS.' + name + ' is not loaded; call ignored')
    return null
  }

  function noop () {}

  // Shallow-copy opts so defaulting never mutates a literal a hook reuses.
  function withPos (opts, dx, dy, friendly) {
    var o = {}
    if (opts) for (var k in opts) o[k] = opts[k]
    if (o.x == null) o.x = dx
    if (o.y == null) o.y = dy
    if (friendly != null && o.friendly == null) o.friendly = friendly
    return o
  }

  IS.makeCtx = function (run) {
    if (!run || typeof run !== 'object') {
      warnOnce('no-run', 'ctx: makeCtx called without a run; using an empty stub')
      run = {}
    }

    var ctx = {}

    // --- internal accessors --------------------------------------------------
    // Read through ctx/run at call time: refreshCtx swaps these out under us.

    function R () { return ctx.room || run.room || null }
    function P () { return ctx.player || run.player || null }
    function F () { return ctx.floor || run.floor || null }

    function rngOr () {
      var r = ctx.rng || run.rng
      if (r) return r
      warnOnce('no-rng', 'ctx: run has no rng; rolls return their neutral value')
      return null
    }

    function living () {
      var room = R()
      if (!room) return []
      var f = IS.roomEnemies
      if (typeof f === 'function') {
        var list = f(room)
        return Array.isArray(list) ? list : []
      }
      if (!Array.isArray(room.enemies)) return []
      var out = []
      for (var i = 0; i < room.enemies.length; i++) {
        var e = room.enemies[i]
        if (e && !e.dead && !e.friendly) out.push(e)
      }
      return out
    }

    function centreOf (room) {
      if (!room) return { x: 0, y: 0 }
      var w = room.pxW == null ? IS.ROOM_PX_W : room.pxW
      var h = room.pxH == null ? IS.ROOM_PX_H : room.pxH
      return { x: w / 2, y: h / 2 }
    }

    // Room index for a teleport target: number, room-type string, or null.
    function resolveRoomIndex (target) {
      var floor = F()
      if (!floor || !Array.isArray(floor.rooms) || !floor.rooms.length) return -1
      var rooms = floor.rooms
      var i

      if (typeof target === 'number') {
        var idx = target | 0
        return idx >= 0 && idx < rooms.length && rooms[idx] ? idx : -1
      }
      if (typeof target !== 'string' || !target) return -1

      if (target === 'start' && floor.startIndex != null && rooms[floor.startIndex]) return floor.startIndex
      if (target === 'boss' && floor.bossIndex != null && rooms[floor.bossIndex]) return floor.bossIndex

      var here = R()
      var hereIndex = here && here.index != null ? here.index : -1
      var matches = []

      if (target === 'random') {
        for (i = 0; i < rooms.length; i++) if (rooms[i] && i !== hereIndex) matches.push(i)
      } else {
        for (i = 0; i < rooms.length; i++) {
          var rm = rooms[i]
          if (!rm) continue
          if (rm.type === target) matches.push(i)
          else if (target === 'secret' && (rm.type === 'super-secret' || rm.type === 'ultra-secret')) matches.push(i)
        }
      }
      if (!matches.length) return -1
      if (matches.length === 1) return matches[0]
      var r = rngOr()
      return r ? matches[r.int(matches.length)] : matches[0]
    }

    // --- the surface (ARCHITECTURE.md §9) ------------------------------------

    ctx.run = run
    ctx.floor = run.floor || null
    ctx.room = run.room || null
    ctx.player = run.player || null
    ctx.rng = run.rng || null
    ctx.dt = IS.DT

    // --- spawning ------------------------------------------------------------

    ctx.spawnEnemy = function (id, x, y, opts) {
      var room = R()
      if (!room || !id) return null
      var f = fn('spawnEnemy')
      if (!f) return null
      if (x == null || y == null) {
        var pos = ctx.freeFloorPos()
        if (x == null) x = pos.x
        if (y == null) y = pos.y
      }
      return f(room, id, x, y, opts)
    }

    ctx.spawnBoss = function (id, x, y, opts) {
      var room = R()
      if (!room || !id) return null
      var f = fn('spawnBoss')
      if (!f) return null
      var c = centreOf(room)
      if (x == null) x = c.x
      if (y == null) y = c.y
      return f(room, id, x, y, opts)
    }

    ctx.spawnTear = function (opts) {
      var f = fn('spawnTear')
      if (!f) return null
      var p = P()
      var c = centreOf(R())
      return f(withPos(opts, p ? p.x : c.x, p ? p.y : c.y, true), ctx)
    }

    ctx.spawnEnemyShot = function (opts) {
      var f = fn('spawnEnemyShot')
      if (!f) return null
      var src = opts && opts.src ? opts.src : null
      var c = centreOf(R())
      return f(withPos(opts, src ? src.x : c.x, src ? src.y : c.y, false), ctx)
    }

    ctx.spawnBomb = function (x, y, opts) {
      var f = fn('spawnBomb')
      if (!f) return null
      var p = P()
      var c = centreOf(R())
      if (x == null) x = p ? p.x : c.x
      if (y == null) y = p ? p.y : c.y
      return f(x, y, opts, ctx)
    }

    ctx.spawnPickup = function (kind, x, y, opts) {
      var room = R()
      if (!room) return null
      if (x == null || y == null) {
        var pos = ctx.freeFloorPos()
        if (x == null) x = pos.x
        if (y == null) y = pos.y
      }
      if (kind === 'item') {
        var ped = fn('spawnPedestal')
        if (!ped) return null
        var itemId = (opts && (opts.itemId || opts.id)) || ctx.rollItem((opts && opts.pool) || 'treasure')
        if (!itemId) return null
        return ped(room, itemId, x, y, opts)
      }
      var f = fn('spawnPickup')
      if (!f) return null
      return f(room, kind, x, y, opts)
    }

    ctx.spawnLaser = function (opts) {
      var f = fn('spawnLaser')
      if (!f) return null
      var p = P()
      var c = centreOf(R())
      return f(withPos(opts, p ? p.x : c.x, p ? p.y : c.y, true), ctx)
    }

    ctx.spawnKnife = function (opts) {
      var f = fn('spawnKnife')
      if (!f) return null
      var p = P()
      var c = centreOf(R())
      return f(withPos(opts, p ? p.x : c.x, p ? p.y : c.y, true), ctx)
    }

    // Presentation-only: mapped onto the fx layer, which may be absent.
    ctx.spawnEffect = function (name, x, y, opts) {
      if (!IS.fx) return null
      opts = opts || {}
      var colour = opts.colour || opts.color || '#e8e4dc'
      var n = opts.n == null ? 10 : opts.n
      if (x == null || y == null) {
        var c = centreOf(R())
        if (x == null) x = c.x
        if (y == null) y = c.y
      }
      switch (name) {
        case 'particles':
          if (IS.fx.particles) return IS.fx.particles(withPos(opts, x, y))
          break
        case 'burst':
          if (IS.fx.burst) return IS.fx.burst(x, y, colour, n)
          break
        case 'blood':
          if (IS.fx.blood) return IS.fx.blood(x, y, n, colour)
          break
        case 'ring':
          if (IS.fx.ring) return IS.fx.ring(x, y, opts)
          break
        case 'flash':
          if (IS.fx.flash) return IS.fx.flash(colour, opts.secs == null ? 0.15 : opts.secs)
          break
        case 'decal':
          if (IS.fx.decal) return IS.fx.decal(x, y, opts.r == null ? 24 : opts.r, colour)
          break
        case 'beam':
          if (IS.fx.beam) return IS.fx.beam(x, y, opts.angle || 0, opts.len == null ? 200 : opts.len, opts)
          break
        default:
          break
      }
      if (IS.fx.poof) return IS.fx.poof(x, y, colour)
      return null
    }

    ctx.spawnFamiliar = function (id, opts) {
      var p = P()
      if (!p || !id) return null
      var f = fn('spawnFamiliar')
      if (!f) return null
      var fam = f(p, id, ctx)
      if (fam && opts) for (var k in opts) fam[k] = (k === 'life' && !opts[k]) ? null : opts[k] /* 0 or unset means permanent */
      return fam
    }

    ctx.spawnCreep = function (x, y, r, opts) {
      if (!IS.fx || typeof IS.fx.creep !== 'function') return null
      if (x == null || y == null) {
        var p = P()
        var c = centreOf(R())
        if (x == null) x = p ? p.x : c.x
        if (y == null) y = p ? p.y : c.y
      }
      return IS.fx.creep(x, y, r == null ? 40 : r, opts)
    }

    // room.js owns the grid; if it exposes no adder we build a minimal entry
    // keyed by the same value string const.js uses for the 'P' grid char.
    ctx.spawnPoop = function (x, y) {
      var room = R()
      if (!room || !Array.isArray(room.grid)) return null
      if (typeof IS.addGrid === 'function') return IS.addGrid(room, 'poop', x, y)
      var cell = typeof IS.cellOf === 'function'
        ? IS.cellOf(x, y)
        : { col: (x / IS.TILE) | 0, row: (y / IS.TILE) | 0 }
      if (typeof IS.gridAt === 'function') {
        var existing = IS.gridAt(room, cell.col, cell.row)
        if (existing) return existing
      }
      var c = typeof IS.cellCenter === 'function' ? IS.cellCenter(cell.col, cell.row) : { x: x, y: y }
      var g = {
        kind: 'poop', char: 'P', col: cell.col, row: cell.row, x: c.x, y: c.y,
        r: 30, hp: 4, maxHp: 4, solid: true, broken: false, spawned: true
      }
      room.grid.push(g)
      return g
    }

    // --- player shortcuts ----------------------------------------------------

    ctx.damagePlayer = function (n, src) {
      var p = P()
      if (!p) return false
      var f = fn('damagePlayer')
      if (!f) return false
      return !!f(p, n == null ? 1 : n, src, ctx)
    }

    ctx.healRed = function (n) {
      var p = P()
      if (!p) return
      var f = fn('healRed')
      if (f) f(p, n == null ? 1 : n)
    }

    ctx.addSoul = function (n) {
      var p = P()
      if (!p) return
      var f = fn('addSoulHearts')
      if (f) f(p, n == null ? 1 : n)
    }

    ctx.addBlack = function (n) {
      var p = P()
      if (!p) return
      var f = fn('addBlackHearts')
      if (f) f(p, n == null ? 1 : n)
    }

    ctx.addBone = function (n) {
      var p = P()
      if (!p) return
      var f = fn('addBoneHearts')
      if (f) f(p, n == null ? 1 : n)
    }

    ctx.addMaxHearts = function (n, heal) {
      var p = P()
      if (!p) return
      var f = fn('addMaxHearts')
      if (f) f(p, n == null ? 2 : n, heal)
    }

    ctx.addCoins = function (n) {
      var p = P()
      if (!p) return
      var f = fn('addCoins')
      if (f) f(p, n == null ? 1 : n)
    }

    ctx.addBombs = function (n) {
      var p = P()
      if (!p) return
      var f = fn('addBombs')
      if (f) f(p, n == null ? 1 : n)
    }

    ctx.addKeys = function (n) {
      var p = P()
      if (!p) return
      var f = fn('addKeys')
      if (f) f(p, n == null ? 1 : n)
    }

    ctx.addCharge = function (n, slot) {
      var p = P()
      if (!p) return
      var f = fn('addCharge')
      if (f) f(p, n == null ? 1 : n, slot)
    }

    ctx.giveItem = function (id, opts) {
      var p = P()
      if (!p || !id) return false
      var f = fn('giveItem')
      if (!f) return false
      return !!f(p, id, opts)
    }

    ctx.removeItem = function (id) {
      var p = P()
      if (!p || !id) return false
      var f = fn('removeItem')
      if (!f) return false
      return !!f(p, id)
    }

    ctx.hasItem = function (id) {
      var p = P()
      if (!p || !id) return false
      var f = IS.hasItem
      if (typeof f === 'function') return !!f(p, id)
      return Array.isArray(p.items) && p.items.indexOf(id) >= 0
    }

    ctx.giveTrinket = function (id) {
      var p = P()
      if (!p || !id) return false
      var f = fn('giveTrinket')
      if (!f) return false
      return !!f(p, id)
    }

    ctx.givePocket = function (kind, id) {
      var p = P()
      if (!p || !id) return false
      var f = fn('givePocket')
      if (!f) return false
      return !!f(p, kind, id)
    }

    // A card is content: contain its exceptions here so one bad card cannot
    // brick the run.
    ctx.useCard = function (id) {
      var p = P()
      if (!p || !id) return false
      var hook = IS.fireHook
      if (typeof hook === 'function') {
        var rets = hook(p, 'onCardUse', [id], ctx)
        if (Array.isArray(rets)) {
          for (var i = 0; i < rets.length; i++) if (rets[i] && rets[i].cancel) return false
        }
      }
      var def = IS.cardsById ? IS.cardsById[id] : null
      if (!def || typeof def.use !== 'function') {
        warnOnce('card:' + id, 'ctx: card "' + id + '" has no use() — ignored')
        return false
      }
      ctx.sfx('card-use')
      try {
        def.use(p, ctx)
      } catch (err) {
        warnOnce('card-threw:' + id, 'ctx: card "' + id + '" threw: ' + (err && err.message))
        return false
      }
      return true
    }

    ctx.usePill = function (id, horse) {
      var p = P()
      if (!p || !id) return false
      var hook = IS.fireHook
      if (typeof hook === 'function') {
        var rets = hook(p, 'onPillUse', [id], ctx)
        if (Array.isArray(rets)) {
          for (var i = 0; i < rets.length; i++) if (rets[i] && rets[i].cancel) return false
        }
      }
      var def = IS.pillsById ? IS.pillsById[id] : null
      if (!def || typeof def.use !== 'function') {
        warnOnce('pill:' + id, 'ctx: pill "' + id + '" has no use() — ignored')
        return false
      }
      ctx.sfx('pill-swallow')
      try {
        def.use(p, ctx, !!horse)
      } catch (err) {
        warnOnce('pill-threw:' + id, 'ctx: pill "' + id + '" threw: ' + (err && err.message))
        return false
      }
      return true
    }

    ctx.applyStatus = function (ent, s, secs) {
      if (!ent || !s) return
      var f = fn('applyStatus')
      if (f) f(ent, s, secs == null ? 3 : secs, ctx)
    }

    // --- queries -------------------------------------------------------------

    ctx.enemies = function () {
      var room = R()
      return room && Array.isArray(room.enemies) ? room.enemies : []
    }

    ctx.livingEnemies = living

    ctx.nearestEnemy = function (x, y) {
      var list = living()
      if (!list.length) return null
      if (x == null || y == null) {
        var p = P()
        var c = centreOf(R())
        if (x == null) x = p ? p.x : c.x
        if (y == null) y = p ? p.y : c.y
      }
      var best = null
      var bestD = Infinity
      for (var i = 0; i < list.length; i++) {
        var e = list[i]
        var dx = e.x - x
        var dy = e.y - y
        var d = dx * dx + dy * dy
        if (d < bestD) { bestD = d; best = e }
      }
      return best
    }

    ctx.randomEnemy = function () {
      var list = living()
      if (!list.length) return null
      var r = rngOr()
      return r ? list[r.int(list.length)] : list[0]
    }

    ctx.freeFloorPos = function (opts) {
      var room = R()
      if (!room) return { x: 0, y: 0 }
      var f = IS.freeFloorPos
      if (typeof f === 'function') {
        var pos = f(room, rngOr() || room.rng || null, opts)
        if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') return pos
      } else {
        warnOnce('fn:freeFloorPos', 'ctx: IS.freeFloorPos is not loaded; using room centre')
      }
      return centreOf(room)
    }

    ctx.gridObjects = function () {
      var room = R()
      return room && Array.isArray(room.grid) ? room.grid : []
    }

    ctx.pickups = function () {
      var room = R()
      return room && Array.isArray(room.pickups) ? room.pickups : []
    }

    ctx.roomCleared = function () {
      var room = R()
      return !!(room && room.cleared)
    }

    ctx.isBossRoom = function () {
      var room = R()
      if (!room) return false
      return room.type === 'boss' || room.type === 'boss-double' ||
        room.type === 'boss-rush' || !!room.boss
    }

    ctx.floorDepth = function () {
      var floor = F()
      if (floor && typeof floor.depth === 'number') return floor.depth
      if (typeof run.floorIndex === 'number') return run.floorIndex + 1
      return 0
    }

    // --- rolls ---------------------------------------------------------------

    ctx.roll = function (base, perLuck, cap) {
      var r = rngOr()
      if (!r) return false
      var p = P()
      var luck = p && p.stats && typeof p.stats.luck === 'number' ? p.stats.luck : 0
      var b = base == null ? 0 : base
      var per = perLuck == null ? 0 : perLuck
      var c = cap == null ? 1 : cap
      var pr = typeof IS.luckChance === 'function'
        ? IS.luckChance(b, per, c, luck)
        : Math.max(0, Math.min(c, b + per * luck))
      return r.chance(pr)
    }

    ctx.chance = function (pr) {
      var r = rngOr()
      if (!r) return false
      return r.chance(pr == null ? 0 : pr)
    }

    ctx.pick = function (arr) {
      if (!Array.isArray(arr) || !arr.length) return undefined
      var r = rngOr()
      return r ? r.pick(arr) : arr[0]
    }

    ctx.int = function (n) {
      var max = n == null ? 0 : n | 0
      if (max <= 0) return 0
      var r = rngOr()
      return r ? r.int(max) : 0
    }

    ctx.range = function (a, b) {
      var lo = a == null ? 0 : a
      var hi = b == null ? 1 : b
      var r = rngOr()
      return r ? r.range(lo, hi) : lo
    }

    // --- world actions -------------------------------------------------------

    ctx.clearRoom = function () {
      var room = R()
      if (!room) return false
      var kill = fn('killEnemy')
      // Snapshot: killEnemy resolves splitInto and mutates room.enemies.
      var list = Array.isArray(room.enemies) ? room.enemies.slice() : []
      for (var i = 0; i < list.length; i++) {
        var e = list[i]
        if (!e || e.dead || e.friendly) continue
        if (kill) kill(e, ctx)
        else e.dead = true
      }
      var check = IS.checkClear
      if (typeof check === 'function') check(room, ctx)
      return true
    }

    ctx.openDoors = function () {
      var room = R()
      if (!room) return
      var f = fn('openDoors')
      if (f) f(room, ctx)
    }

    ctx.unlockDoor = function (kind) {
      var room = R()
      if (!room || !Array.isArray(room.doors)) return false
      var any = false
      for (var i = 0; i < room.doors.length; i++) {
        var d = room.doors[i]
        if (!d) continue
        if (kind != null && d.kind !== kind) continue
        if (!d.locked && d.open) continue
        d.locked = false
        d.open = true
        any = true
      }
      if (any) ctx.sfx('door-open')
      return any
    }

    ctx.spawnTrapdoor = function (x, y, opts) {
      var room = R()
      if (!room) return null
      var f = fn('spawnTrapdoor')
      if (!f) return null
      var c = centreOf(room)
      if (x == null) x = c.x
      if (y == null) y = c.y
      return f(room, x, y, opts)
    }

    ctx.spawnCrawlspace = function (x, y) {
      var room = R()
      if (!room) return null
      var f = fn('spawnCrawlspace')
      if (!f) return null
      var c = centreOf(room)
      if (x == null) x = c.x
      if (y == null) y = c.y
      return f(room, x, y)
    }

    ctx.rerollPedestals = function () {
      var room = R()
      if (!room) return false
      var f = fn('rerollPedestals')
      if (!f) return false
      f(room, run, ctx)
      return true
    }

    // D4: swap every passive for a fresh treasure-pool roll.
    ctx.rerollPlayerItems = function () {
      var p = P()
      if (!p || !Array.isArray(p.items)) return 0
      var remove = fn('removeItem')
      var give = fn('giveItem')
      if (!remove || !give) return 0
      var ids = p.items.slice()
      var swapped = 0
      for (var i = 0; i < ids.length; i++) {
        var def = IS.itemsById ? IS.itemsById[ids[i]] : null
        if (!def || def.kind !== 'passive') continue
        var next = ctx.rollItem('treasure')
        if (!next || next === ids[i]) continue
        if (!remove(p, ids[i])) continue
        give(p, next, { noAnim: true, fromPool: 'treasure' })
        swapped++
      }
      if (swapped) {
        var rec = fn('recalcStats')
        if (rec) rec(p)
      }
      return swapped
    }

    ctx.teleport = function (target) {
      if (typeof target === 'string' && IS.floorsById && IS.floorsById[target]) {
        var start = fn('startFloor')
        if (!start) return false
        start(run, target, ctx)
        return true
      }
      var enter = fn('enterRoom')
      if (!enter) return false
      var idx = resolveRoomIndex(target == null ? 'random' : target)
      if (idx < 0) return false
      enter(run, idx, null, ctx)
      return true
    }

    // Glowing Hourglass: step back to the room we came from. No history is a
    // normal state, not a fault.
    ctx.rewind = function () {
      var enter = fn('enterRoom')
      if (!enter) return false
      var floor = F()
      var prev = run.prevRoomIndex
      if (prev == null || !floor || !Array.isArray(floor.rooms) || !floor.rooms[prev]) return false
      enter(run, prev, null, ctx)
      return true
    }

    ctx.bombExplode = function (x, y, opts) {
      var f = fn('bombExplode')
      if (!f) return
      var p = P()
      var c = centreOf(R())
      if (x == null) x = p ? p.x : c.x
      if (y == null) y = p ? p.y : c.y
      f(x, y, opts, ctx)
    }

    ctx.destroyGrid = function (g) {
      var room = R()
      if (!room || !g) return
      var f = fn('destroyGrid')
      if (f) f(room, g, ctx)
    }

    ctx.charmAllEnemies = function (secs) {
      var f = fn('applyStatus')
      if (!f) return 0
      var list = living()
      var n = 0
      for (var i = 0; i < list.length; i++) {
        f(list[i], 'charm', secs == null ? 5 : secs, ctx)
        n++
      }
      return n
    }

    // --- pools ---------------------------------------------------------------

    ctx.rollItem = function (pool, opts) {
      var f = fn('rollItem')
      if (!f) return null
      return f(run, pool == null ? 'treasure' : pool, opts) || null
    }

    ctx.rollTrinket = function (opts) {
      var f = fn('rollTrinket')
      if (!f) return null
      return f(run, opts) || null
    }

    ctx.rollCard = function (opts) {
      var f = fn('rollCard')
      if (!f) return null
      return f(run, opts) || null
    }

    ctx.rollPill = function (opts) {
      var f = fn('rollPill')
      if (!f) return null
      return f(run, opts) || null
    }

    ctx.rollRune = function (opts) {
      var f = fn('rollRune')
      if (!f) return null
      return f(run, opts) || null
    }

    // --- presentation --------------------------------------------------------
    // All optional: the node harness has no canvas and no AudioContext.

    ctx.sfx = function (name, opts) {
      if (IS.audio && typeof IS.audio.sfx === 'function') IS.audio.sfx(name, opts)
    }

    ctx.music = function (cmd, opts) {
      if (IS.audio && typeof IS.audio.music === 'function') IS.audio.music(cmd, opts)
    }

    ctx.shake = function (amount, secs) {
      if (IS.fx && typeof IS.fx.shake === 'function') {
        IS.fx.shake(amount == null ? 4 : amount, secs == null ? 0.25 : secs)
      }
    }

    ctx.floater = function (text, x, y, colour) {
      if (!IS.fx || typeof IS.fx.floater !== 'function') return
      if (x == null || y == null) {
        var p = P()
        var c = centreOf(R())
        if (x == null) x = p ? p.x : c.x
        if (y == null) y = p ? p.y - 40 : c.y
      }
      IS.fx.floater(text, x, y, colour)
    }

    ctx.banner = function (title, subtitle) {
      if (IS.hud && typeof IS.hud.pickupBanner === 'function') IS.hud.pickupBanner(title, subtitle)
    }

    ctx.log = function (msg) {
      if (msg == null) return
      if (!Array.isArray(run.log)) run.log = []
      run.log.push(typeof msg === 'string' ? msg : String(msg))
      if (run.log.length > LOG_CAP) run.log.splice(0, run.log.length - LOG_CAP)
    }

    // --- meta ----------------------------------------------------------------
    // IS.fireHook rewrites these before each hook call.

    ctx.goldenTrinket = false
    ctx.fromTrinket = false
    ctx.sourceItemId = null

    return ctx
  }

  IS.refreshCtx = function (ctx, room, dt) {
    if (!ctx) return ctx
    var run = ctx.run || {}
    ctx.room = room === undefined ? (run.room || null) : (room || null)
    ctx.dt = typeof dt === 'number' && dt === dt ? dt : IS.DT
    ctx.floor = run.floor || null
    ctx.player = run.player || null
    if (run.rng) ctx.rng = run.rng
    ctx.goldenTrinket = false
    ctx.fromTrinket = false
    ctx.sourceItemId = null
    return ctx
  }

  // Same object, presentation silenced — for tools/smoke.mjs and
  // tools/balance.mjs, which run without window, canvas or audio.
  IS.headlessCtx = function (run) {
    var ctx = IS.makeCtx(run)
    ctx.sfx = noop
    ctx.music = noop
    ctx.shake = noop
    ctx.floater = noop
    ctx.banner = noop
    return ctx
  }

})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
