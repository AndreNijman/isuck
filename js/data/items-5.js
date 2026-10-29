;(function (IS) {
  'use strict'

  // ---------------------------------------------------------------------------
  // ISUCK — collectibles 369–460 (Afterbirth and Afterbirth+).
  //
  // Schema: ARCHITECTURE.md §5.1. Hook vocabulary: §5.2 (closed list).
  // Randomness comes only from the seeded context helpers (§9).
  // p.stats is never written directly — items declare `stats`/`mult` or use
  // `onStats`, and call IS.recalcStats(p) when a cached condition flips.
  //
  // Familiars owned by an item in this file are defined at the bottom with
  // IS.defineFamiliars, one def per item id (§7.3). Shared familiars
  // (blue-fly, blue-spider, …) live in js/data/familiars.js and are only
  // referenced here by id.
  //
  // ---------------------------------------------------------------------------
  // FILE-WIDE APPROXIMATIONS (each is also noted at its use site)
  //
  // 1. Charge-up items (No. 2, Maw of the Void, Dead Tooth, Linger Bean, Kidney Stone) read
  //    IS.input.shoot() through firing(p), so they charge while a fire key is held.
  //
  // 2. Familiar-anchored auras — ctx exposes no familiar positions, so the
  //    auras of Censer, Succubus and Circle of Protection are centred on the
  //    player. Those familiars trail the player closely in the real game, so
  //    the covered area is close; the difference is that the aura can never
  //    lag behind.
  // ---------------------------------------------------------------------------

  // --- small guarded helpers -------------------------------------------------

  function cache (p) {
    if (!p || typeof p !== 'object') return {}
    if (!p.cache) p.cache = {}
    return p.cache
  }

  // Items that are only stats/grants/familiars have no hooks; everything else is in IMPL below.
  function referenceHooks (info, active, id) {
    return IMPL[id]
  }

  function recalc (p) {
    if (p && typeof IS.recalcStats === 'function') IS.recalcStats(p)
  }

  function roomW (room) { return room && room.pxW != null ? room.pxW : IS.ROOM_PX_W }
  function roomH (room) { return room && room.pxH != null ? room.pxH : IS.ROOM_PX_H }

  // Unit aim vector; defaults to "right" so a hook never divides by zero.
  function aim (p) {
    var h = p && p.head
    if (h && (h.x || h.y)) {
      var l = Math.sqrt(h.x * h.x + h.y * h.y)
      if (l > 0.0001) return { x: h.x / l, y: h.y / l }
    }
    return { x: 1, y: 0 }
  }

  // True while a fire key is held (the player's shoot vector), not merely while a head direction exists.
  function firing (p) {
    if (!p) return false
    var s = IS.input && typeof IS.input.shoot === 'function' ? IS.input.shoot() : null
    return !!(s && (s.x || s.y))
  }

  function livingList (ctx) {
    if (!ctx || typeof ctx.livingEnemies !== 'function') return []
    var list = ctx.livingEnemies()
    return Array.isArray(list) ? list : []
  }

  function nearEnemies (ctx, x, y, r) {
    var out = []
    if (x == null || y == null || !(r > 0)) return out
    var list = livingList(ctx)
    var rr = r * r
    for (var i = 0; i < list.length; i++) {
      var e = list[i]
      if (!e || e.dead) continue
      var dx = e.x - x
      var dy = e.y - y
      if (dx * dx + dy * dy <= rr) out.push(e)
    }
    return out
  }

  function hurtEnemy (e, dmg, ctx) {
    if (!e || e.dead || !(dmg > 0)) return
    if (typeof IS.damageEnemy === 'function') IS.damageEnemy(e, dmg, {}, ctx)
  }

  function killIt (e, ctx) {
    if (e && !e.dead && typeof IS.killEnemy === 'function') IS.killEnemy(e, ctx)
  }

  function addFlag (tear, f) {
    if (tear && tear.flags && typeof tear.flags.add === 'function') tear.flags.add(f)
  }

  function addFlags (tear, arr) {
    if (!arr) return
    for (var i = 0; i < arr.length; i++) addFlag(tear, arr[i])
  }

  function friendlyTears (ctx) {
    var room = ctx && ctx.room
    var out = []
    if (!room || !Array.isArray(room.tears)) return out
    for (var i = 0; i < room.tears.length; i++) {
      var t = room.tears[i]
      if (!t || t.dead || t.friendly === false) continue
      out.push(t)
    }
    return out
  }

  function hostileShots (ctx) {
    var room = ctx && ctx.room
    var out = []
    if (!room || !Array.isArray(room.shots)) return out
    for (var i = 0; i < room.shots.length; i++) {
      var s = room.shots[i]
      if (!s || s.dead || s.friendly) continue
      out.push(s)
    }
    return out
  }

  // Shared by Host Hat, Circle of Protection and Metal Plate: roll once per
  // shot, then flip the survivors back at whoever fired them.
  function reflectNearbyShots (p, ctx, radius, odds, flag) {
    if (!p) return 0
    var list = hostileShots(ctx)
    var n = 0
    var rr = radius * radius
    for (var i = 0; i < list.length; i++) {
      var s = list[i]
      if (s.reflectRolled) continue
      var dx = s.x - p.x
      var dy = s.y - p.y
      if (dx * dx + dy * dy > rr) continue
      s.reflectRolled = true
      if (!ctx.chance(odds)) continue
      s.vx = -s.vx
      s.vy = -s.vy
      s.friendly = true
      if (p.stats && p.stats.damage > 0) s.dmg = p.stats.damage
      if (flag && s.flags && typeof s.flags.add === 'function') s.flags.add(flag)
      n++
    }
    if (n) ctx.sfx('tear-fire')
    return n
  }

  // A black brimstone ring (Maw of the Void, Athame): short radial beams that
  // grind whatever is standing in them. `dmg` is the total over `life`.
  function brimstoneRing (ctx, x, y, radius, dmg, life) {
    if (!ctx || typeof ctx.spawnLaser !== 'function') return
    var beams = 12
    for (var i = 0; i < beams; i++) {
      ctx.spawnLaser({
        x: x,
        y: y,
        angle: (i / beams) * Math.PI * 2,
        len: radius,
        dmg: dmg / (life / 0.25),
        tick: 0.25,
        width: 18,
        life: life,
        brimstone: true,
        friendly: true,
        thick: true
      })
    }
    ctx.spawnEffect('ring', x, y, { colour: '#2a1030', r0: 20, r1: radius, life: life, width: 14 })
    ctx.sfx('brimstone-fire')
  }

  // --- effect tables ---------------------------------------------------------

  // Zodiac cycles one of these per floor. Purely declarative so the three
  // hooks that read it stay tiny.
  var ZODIAC = [
    { name: 'Aries', stats: { speed: 0.28 }, tearFlag: 'piercing' },
    { name: 'Taurus', stats: { speed: 0.3 } },
    { name: 'Gemini', stats: { damage: 1 } },
    { name: 'Cancer', stats: { shieldCount: 1 } },
    { name: 'Leo', stats: { damage: 1 }, tearFlag: 'rock' },
    { name: 'Virgo', stats: { shieldCount: 1, luck: 1 } },
    { name: 'Libra', stats: { luck: 2 } },
    { name: 'Scorpio', stats: {}, tearFlag: 'poison' },
    { name: 'Sagittarius', stats: { speed: 0.2 }, tearFlag: 'piercing' },
    { name: 'Capricorn', stats: { damage: 0.5, tears: 0.5, range: 40, speed: 0.1, luck: 1 } },
    { name: 'Aquarius', stats: { tears: 0.5 }, creep: true },
    { name: 'Pisces', stats: { tears: 0.5 }, tearFlag: 'knockback' }
  ]

  // Purity's four auras, in the order the description lists them.
  var PURITY = [
    { name: 'Yellow', colour: '#e0d040', stats: { speed: 0.5 } },
    { name: 'Blue', colour: '#5a7ad8', stats: { tears: 2 } },
    { name: 'Red', colour: '#d04030', stats: { damage: 4 } },
    { name: 'Orange', colour: '#e09030', stats: { range: 120 } }
  ]

  // Fruit Cake picks one of these per tear.
  var FRUITCAKE = [
    'piercing', 'spectral', 'homing', 'bouncing', 'splitting', 'explosive',
    'poison', 'burn', 'freeze', 'slow', 'charm', 'fear', 'confusion', 'bleed',
    'shrink', 'petrify', 'magnetize', 'midas', 'knockback', 'light', 'holy',
    'ice', 'booger', 'sticky', 'tinyplanet', 'wiggle', 'sinusoid', 'boomerang',
    'chain', 'spin', 'lump', 'pop', 'nail', 'glitter'
  ]

  // Spider Mod's contact statuses (IS.STATUS_LIST subset that reads well).
  var SPIDER_MOD_STATUS = [
    'poison', 'burn', 'freeze', 'slow', 'charm', 'fear', 'confusion', 'bleed',
    'shrink', 'baited', 'magnetize'
  ]

  // ---------------------------------------------------------------------------
  // Real implementations for the items that used to be generated stubs.
  // referenceHooks(info, active, id) now returns IMPL[id] when one exists. Fields
  // that are not hooks (familiars, grants, stat fixes) are in PATCH, applied right
  // after IS.defineItems.
  // ---------------------------------------------------------------------------

  function shootTear (ctx, p, x, y, angle, speed, dmg, flags, life, r) {
    var base = typeof IS.tearBaseOpts === 'function' ? IS.tearBaseOpts(p) : {}
    var o = {}
    for (var k in base) o[k] = base[k]
    o.x = x
    o.y = y
    o.vx = Math.cos(angle) * speed
    o.vy = Math.sin(angle) * speed
    o.friendly = true
    if (dmg != null) o.dmg = dmg
    if (life != null) o.life = life
    if (r != null) o.r = r
    var f = []
    if (o.flags && typeof o.flags.forEach === 'function') o.flags.forEach(function (v) { f.push(v) })
    for (var i = 0; flags && i < flags.length; i++) if (f.indexOf(flags[i]) < 0) f.push(flags[i])
    o.flags = f
    return ctx.spawnTear(o)
  }

  function dmgNow (p) { return (p && p.stats && p.stats.damage) || IS.BASE_DAMAGE || 3.5 }
  function aimAngle (p) { var a = aim(p); return Math.atan2(a.y, a.x) }
  function pickups (ctx) { return (ctx && ctx.room && ctx.room.pickups) || [] }
  function famsOf (p, id) {
    var out = []
    var l = (p && p.familiars) || []
    for (var i = 0; i < l.length; i++) if (l[i] && l[i].id === id) out.push(l[i])
    return out
  }
  function tickList (c, key, dt, fn) {
    var q = c[key]
    if (!q || !q.length) return
    for (var i = q.length - 1; i >= 0; i--) {
      q[i].t -= dt
      if (fn(q[i]) === false || q[i].t <= 0) q.splice(i, 1)
    }
  }
  function every (c, key, dt, period) {
    c[key] = (c[key] || 0) + dt
    if (c[key] < period) return false
    c[key] -= period
    if (c[key] > period) c[key] = 0
    return true
  }
  // Scale the damage "ups" so the final damage is multiplied by m (player.js turns ups into damage
  // as charDamage * sqrt(1 + 1.2 * ups)); the multiplier can only be approximated from inside onStats.
  function damageMultUps (p, s, m) {
    var u = s.damage || 0
    s.damage = u + ((m * m) * (1 + 1.2 * u) - 1) / 1.2 - u
  }
  function hasRoom (ctx) { return !!(ctx && ctx.room) }
  function hostile (ctx) { return hasRoom(ctx) && !ctx.room.cleared }
  // Re-runs the stat pass only when a watched condition flips.
  function watch (p, key, now) {
    var c = cache(p)
    if (c[key] === now) return
    c[key] = now
    recalc(p)
  }
  function noRedHearts (p) { return !!p.hearts && p.hearts.red <= 0 }
  function fullRed (p) { return !!p.hearts && p.hearts.maxRed > 0 && p.hearts.red >= p.hearts.maxRed }
  function randomPickupKind (ctx) { return ctx.pick(['coin', 'key', 'bomb', 'heart', 'soul', 'card', 'pill']) || 'coin' }

  var CHAOS_POOLS = ['treasure', 'shop', 'boss', 'devil', 'angel', 'secret', 'curse', 'library', 'golden-chest', 'red-chest', 'planetarium']

  var IMPL = {
    explosivo: {
      onTearFire: function (p, tear, ctx) {
        if (!tear || !ctx.chance(0.25)) return
        addFlag(tear, 'sticky')
        tear.explosivo = true
      },
      onTearHit: function (p, tear, enemy, ctx) {
        if (!tear || !tear.explosivo || !enemy) return
        ctx.applyStatus(enemy, 'sticky', 2.5)
        var q = cache(p).explosivoQ || (cache(p).explosivoQ = [])
        q.push({ t: 2, e: enemy, x: enemy.x, y: enemy.y, dmg: (tear.dmg || dmgNow(p)) + 60 })
      },
      onUpdate: function (p, dt, ctx) {
        if (!hasRoom(ctx)) return
        tickList(cache(p), 'explosivoQ', dt, function (it) {
          if (it.e && !it.e.dead) { it.x = it.e.x; it.y = it.e.y }
          if (it.t > 0) return true
          ctx.bombExplode(it.x, it.y, { dmg: it.dmg, r: 90, playerSafe: true, friendly: true })
          return false
        })
      },
      onRoomEnter: function (p) { cache(p).explosivoQ = [] }
    },
    chaos: {
      onInit: function (p, ctx) {
        var c = cache(p)
        if (c.chaosGiven || !hasRoom(ctx)) return
        c.chaosGiven = 1
        var n = 1 + ctx.int(6)
        for (var i = 0; i < n; i++) ctx.spawnPickup(randomPickupKind(ctx))
      },
      onRoomEnter: function (p, room, ctx) {
        if (!hasRoom(ctx)) return
        var list = pickups(ctx)
        for (var i = 0; i < list.length; i++) {
          var pu = list[i]
          if (!pu || pu.kind !== 'item' || pu.taken || pu.price || pu.chaosRolled) continue
          pu.chaosRolled = true
          var id = ctx.rollItem(ctx.pick(CHAOS_POOLS) || 'treasure')
          var def = id && IS.itemsById && IS.itemsById[id]
          if (!def) continue
          pu.id = id
          pu.itemId = id
          pu.def = def
          pu.variant = def.kind || 'passive'
        }
      }
    },
    'spider-mod': {
      // APPROXIMATE: the damage / health bar overlay is not drawn.
      onUpdate: function (p, dt, ctx) {
        if (!hasRoom(ctx)) return
        var list = nearEnemies(ctx, p.x, p.y, (p.r || 26) + 34)
        for (var i = 0; i < list.length; i++) {
          if (list[i].spiderModded) continue
          list[i].spiderModded = true
          ctx.applyStatus(list[i], ctx.pick(SPIDER_MOD_STATUS) || 'slow', 3)
        }
      },
      onEnemyKill: function (p, e, ctx) {
        if (!hasRoom(ctx) || !e || !ctx.chance(0.1)) return
        if (ctx.chance(0.5)) ctx.spawnPickup('battery', e.x, e.y)
        else ctx.spawnFamiliar('blue-spider')
      }
    },
    'farting-baby': {
      onPlayerHurt: function (p, n, src, ctx) {
        if (!hasRoom(ctx) || !ctx.chance(0.1)) return
        var f = famsOf(p, 'farting-baby')[0]
        var x = f ? f.x : p.x
        var y = f ? f.y : p.y
        var list = nearEnemies(ctx, x, y, 150)
        var kind = ctx.pick(['charm', 'poison', 'knock']) || 'poison'
        for (var i = 0; i < list.length; i++) {
          hurtEnemy(list[i], 5 + ctx.int(2), ctx)
          if (kind === 'knock') { if (typeof IS.knockback === 'function' && !list[i].boss) IS.knockback(list[i], x, y, 560) } else ctx.applyStatus(list[i], kind, 3)
        }
        ctx.spawnEffect('burst', x, y, { colour: '#a0b040', n: 14 })
        ctx.sfx('fart')
      }
    },
    'gb-bug': {
      // APPROXIMATE: the bug wanders instead of being thrown with a double tap.
      onUpdate: function (p, dt, ctx) {
        if (!hasRoom(ctx)) return
        var bugs = famsOf(p, 'gb-bug')
        for (var b = 0; b < bugs.length; b++) {
          var f = bugs[b]
          var list = nearEnemies(ctx, f.x, f.y, (f.r || 14) + 22)
          for (var i = 0; i < list.length; i++) {
            var e = list[i]
            if (e.boss || e.gbBugged || e.friendly) continue
            var pool = (IS.enemies || []).filter(function (d) { return d && !d.boss && d.id !== e.id })
            var d = ctx.pick(pool)
            if (!d) continue
            var ne = ctx.spawnEnemy(d.id, e.x, e.y)
            if (!ne) continue
            ne.gbBugged = true
            e.gbBugged = true
            e.dead = true
            e.hp = 0
            ctx.spawnEffect('burst', e.x, e.y, { colour: '#6ad06a', n: 10 })
          }
          var pl = pickups(ctx)
          for (var j = 0; j < pl.length; j++) {
            var u = pl[j]
            if (!u || u.taken || u.removed || u.shop || u.price || u.gbBugged) continue
            if (u.kind !== 'coin' && u.kind !== 'key' && u.kind !== 'bomb' && u.kind !== 'heart') continue
            var dx = u.x - f.x
            var dy = u.y - f.y
            if (dx * dx + dy * dy > 40 * 40) continue
            u.taken = u.removed = true
            var np = ctx.spawnPickup(randomPickupKind(ctx), u.x, u.y)
            if (np) np.gbBugged = true
          }
        }
      }
    },
    d8: {
      onUse: function (p, ctx) {
        var c = cache(p)
        var r = function () { return 0.5 + ctx.range(0, 1.5) }
        c.d8 = { damage: r(), tears: r(), range: r(), speed: r() }
        recalc(p)
        ctx.sfx('charge-ready')
        ctx.floater('x' + c.d8.damage.toFixed(1) + ' dmg', p.x, p.y - 44, '#d8d8d8')
      },
      onStats: function (p, s) {
        var m = cache(p).d8
        if (!m) return
        damageMultUps(p, s, m.damage)
        s.tears += (m.tears - 1) * (2.73 + s.tears)
        s.range += (m.range - 1) * (s.range || 0)
        s.speed += (m.speed - 1) * (s.speed || 1)
      }
    },
    purity: {
      onInit: function (p, ctx) {
        var c = cache(p)
        if (c.purityIdx != null || !ctx) return
        c.purityIdx = ctx.int(PURITY.length)
        recalc(p)
      },
      onPlayerHurt: function (p) {
        var c = cache(p)
        c.purityIdx = -1
        recalc(p)
      },
      onRoomEnter: function (p, room, ctx) {
        var c = cache(p)
        if (c.purityIdx != null && c.purityIdx >= 0) return
        c.purityIdx = ctx.int(PURITY.length)
        recalc(p)
        ctx.banner('Purity', PURITY[c.purityIdx].name)
      },
      onStats: function (p, s) {
        var z = PURITY[cache(p).purityIdx]
        if (!z) return
        for (var k in z.stats) s[k] = (s[k] || 0) + z.stats[k]
      }
    },
    athame: {
      onEnemyKill: function (p, e, ctx) {
        if (!hasRoom(ctx) || !e || !ctx.roll(0.25, 0.025, 1)) return
        brimstoneRing(ctx, e.x, e.y, 120, dmgNow(p) * 30, 2)
      }
    },
    'empty-vessel': {
      // APPROXIMATE: the shield is a fixed 10s invincibility.
      onStats: function (p) { if (noRedHearts(p)) p.flags.add('flying') },
      onUpdate: function (p, dt, ctx) {
        var c = cache(p)
        watch(p, 'vesselNoRed', noRedHearts(p))
        if (!noRedHearts(p) || !hostile(ctx)) { c.vesselT = 0; return }
        if (every(c, 'vesselT', dt, 40)) { p.status.invincible = Math.max(p.status.invincible || 0, 10); ctx.sfx('holy-shield') }
      }
    },
    'evil-eye': {
      onTearFire: function (p, tear, ctx) {
        if (!tear || !ctx.roll(0.0333, 0.0033, 0.1)) return
        tear.vx *= 0.5
        tear.vy *= 0.5
        tear.life = Math.max(tear.life, 2.6)
        tear.life0 = tear.life
        tear.r = 14
        addFlag(tear, 'spectral')
        addFlag(tear, 'piercing')
        tear.evilEye = { dir: Math.atan2(tear.vy, tear.vx), t: 0.3 }
      },
      onUpdate: function (p, dt, ctx) {
        if (!hasRoom(ctx)) return
        var l = friendlyTears(ctx)
        for (var i = 0; i < l.length; i++) {
          var e = l[i].evilEye
          if (!e) continue
          e.t -= dt
          if (e.t > 0) continue
          e.t = 0.4
          shootTear(ctx, p, l[i].x, l[i].y, e.dir, IS.TEAR_SPEED, dmgNow(p) * 0.6)
        }
      }
    },
    'lusty-blood': {
      onEnemyKill: function (p) { var c = cache(p); c.lusty = Math.min(10, (c.lusty || 0) + 1); recalc(p) },
      onRoomEnter: function (p) { if (cache(p).lusty) { cache(p).lusty = 0; recalc(p) } },
      onStats: function (p, s) { s.damage += 0.5 * (cache(p).lusty || 0) }
    },
    'cambion-conception': {
      onPlayerHurt: function (p, n, src, ctx) {
        var c = cache(p)
        var have = famsOf(p, 'cambion-conception').length
        if (have >= 4) return
        c.cambionHits = (c.cambionHits || 0) + 1
        if (c.cambionHits < (have >= 2 ? 30 : 15)) return
        c.cambionHits = 0
        ctx.spawnFamiliar('cambion-conception')
        ctx.sfx('familiar-spawn')
      }
    },
    'immaculate-conception': {
      onPickup: function (p, kind, amount, ctx) {
        if (kind !== 'heart' && kind !== 'soul' && kind !== 'black' && kind !== 'eternal') return
        var c = cache(p)
        if (famsOf(p, 'immaculate-conception').length >= 5) return
        c.immacHearts = (c.immacHearts || 0) + 1
        if (c.immacHearts < 15) return
        c.immacHearts = 0
        ctx.spawnFamiliar('immaculate-conception')
        ctx.addSoul(1)
        ctx.sfx('familiar-spawn')
      }
    },
    'more-options': {
      onRoomEnter: function (p, room, ctx) {
        if (!hasRoom(ctx) || !room || room.type !== 'treasure' || room.moreOptionsDone) return
        room.moreOptionsDone = true
        var list = pickups(ctx).filter(function (u) { return u && u.kind === 'item' && !u.taken && !u.price })
        for (var i = 0; i < list.length; i++) {
          var grp = 'more-options-' + i
          list[i].optionsGroup = grp
          ctx.spawnPickup('item', list[i].x + 90, list[i].y, { pool: 'treasure', options: grp })
        }
      }
    },
    'crown-of-light': {
      onStats: function (p, s) {
        if (!fullRed(p) || cache(p).crownLost) return
        damageMultUps(p, s, 2)
        s.shotSpeed -= 0.3
      },
      onUpdate: function (p) { watch(p, 'crownFull', fullRed(p) && !cache(p).crownLost) },
      onPlayerHurt: function (p) { cache(p).crownLost = true; recalc(p) },
      onRoomEnter: function (p) { if (cache(p).crownLost) { cache(p).crownLost = false; recalc(p) } }
    },
    'deep-pockets': {
      // APPROXIMATE: the 999 coin cap needs an engine change (player.js add() caps everything at 99).
      onRoomClear: function (p, room, ctx) {
        cache(p).deepCheck = { t: 0.5, n: pickups(ctx).length }
      },
      onUpdate: function (p, dt, ctx) {
        var c = cache(p)
        var d = c.deepCheck
        if (!d || !hasRoom(ctx)) return
        d.t -= dt
        if (d.t > 0) return
        c.deepCheck = null
        if (pickups(ctx).length > d.n) return
        var n = 1 + ctx.int(3)
        for (var i = 0; i < n; i++) ctx.spawnPickup('coin', null, null, { variant: 'penny' })
      }
    },
    succubus: {
      onUpdate: function (p, dt, ctx) {
        if (!hasRoom(ctx)) return
        var c = cache(p)
        c.succubusIn = false
        var fs = famsOf(p, 'succubus')
        for (var i = 0; i < fs.length; i++) {
          var f = fs[i]
          var dx = p.x - f.x
          var dy = p.y - f.y
          if (dx * dx + dy * dy < 130 * 130) c.succubusIn = true
        }
        if (!fs.length || !every(c, 'succubusT', dt, 0.25)) return
        for (var k = 0; k < fs.length; k++) {
          var near = nearEnemies(ctx, fs[k].x, fs[k].y, 130)
          for (var j = 0; j < near.length; j++) hurtEnemy(near[j], 9 * 0.25, ctx)
        }
      },
      onEnemyDamage: function (p, e, dmg) { if (cache(p).succubusIn && dmg > 0) return dmg * 1.5 }
    },
    'fruit-cake': {
      onTearFire: function (p, tear, ctx) {
        var f = ctx.pick(FRUITCAKE) || 'poison'
        // tint + the flag; the engine reads the status/behaviour flags it knows, the rest are cosmetic.
        addFlag(tear, f)
        if (f === 'bleed') addFlag(tear, 'slow')
        if (f === 'shrink') tear.shrinkHit = true
        if (f === 'midas') tear.midasHit = true
        if (f === 'sticky' || f === 'booger') tear.stickyHit = true
      },
      onTearHit: function (p, tear, e, ctx) {
        if (!tear || !e) return
        if (tear.flags.has('bleed')) ctx.applyStatus(e, 'bleed', 3)
        if (tear.flags.has('shrink')) ctx.applyStatus(e, 'shrink', 4)
        if (tear.flags.has('midas')) ctx.applyStatus(e, 'midas', 6)
        if (tear.flags.has('magnetize')) ctx.applyStatus(e, 'magnetize', 3)
        if (tear.flags.has('sticky')) ctx.applyStatus(e, 'sticky', 3)
        if (tear.flags.has('holy') || tear.flags.has('light')) lightBeam(p, tear, e, ctx)
      }
    },
    'teleport-2-0': {
      onUse: function (p, ctx) {
        var floor = ctx.floor
        var here = ctx.room && ctx.room.index
        var list = []
        var rooms = (floor && floor.rooms) || []
        for (var i = 0; i < rooms.length; i++) {
          var r = rooms[i]
          if (!r || i === here || r.cleared || r.type === 'secret' || r.type === 'super-secret') continue
          list.push(i)
        }
        var pick = ctx.pick(list)
        if (pick == null) return { fail: true }
        ctx.teleport(pick)
      }
    },
    'black-powder': {
      // Walking a closed loop of at least ~500 units draws the pentagram: 130 damage over 4 seconds.
      onUpdate: function (p, dt, ctx) {
        if (!hasRoom(ctx)) return
        var c = cache(p)
        var path = c.bpPath || (c.bpPath = [])
        var last = path[path.length - 1]
        if (!last || Math.abs(last.x - p.x) + Math.abs(last.y - p.y) > 22) path.push({ x: p.x, y: p.y })
        if (path.length > 60) path.shift()
        if (path.length < 24) return
        var len = 0
        var cx = 0
        var cy = 0
        for (var i = 1; i < path.length; i++) len += Math.abs(path[i].x - path[i - 1].x) + Math.abs(path[i].y - path[i - 1].y)
        var a = path[0]
        var b = path[path.length - 1]
        if (len < 520 || Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 70) return
        for (var j = 0; j < path.length; j++) { cx += path[j].x; cy += path[j].y }
        c.bpPath = []
        IS.spawnPuddle({ x: cx / path.length, y: cy / path.length, r: 140, dmg: 130 / 8, life: 4, colour: '#401030' }, ctx)
        ctx.sfx('curse-sting')
      },
      onRoomEnter: function (p) { cache(p).bpPath = [] }
    },
    'kidney-bean': {
      onUse: function (p, ctx) {
        var list = nearEnemies(ctx, p.x, p.y, 220)
        for (var i = 0; i < list.length; i++) ctx.applyStatus(list[i], 'charm', 5)
        ctx.spawnEffect('ring', p.x, p.y, { colour: '#e89ab0', r0: 10, r1: 220, life: 0.4 })
        ctx.sfx('fart')
      }
    },
    'glowing-hourglass': {
      onUse: function (p, ctx) {
        var c = cache(p)
        if ((c.ghUses || 0) < 3 && ctx.rewind()) { c.ghUses = (c.ghUses || 0) + 1; return }
        var list = livingList(ctx)
        for (var i = 0; i < list.length; i++) ctx.applyStatus(list[i], 'slow', 8)
        ctx.sfx('charge-ready')
      },
      onNewFloor: function (p) { cache(p).ghUses = 0 }
    },
    'circle-of-protection': {
      onUpdate: function (p, dt, ctx) {
        if (!hasRoom(ctx)) return
        var c = cache(p)
        reflectNearbyShots(p, ctx, 125, 0.25)
        if (!every(c, 'cirT', dt, 0.25)) return
        var l = nearEnemies(ctx, p.x, p.y, 125)
        for (var i = 0; i < l.length; i++) hurtEnemy(l[i], dmgNow(p) * 0.25, ctx)
      }
    },
    'sack-head': {
      onInit: function (p, ctx) {
        var c = cache(p)
        if (c.sackGiven || !hasRoom(ctx)) return
        c.sackGiven = 1
        ctx.spawnPickup('sack')
      },
      onRoomEnter: function (p, room, ctx) {
        if (!hasRoom(ctx)) return
        var list = pickups(ctx)
        for (var i = 0; i < list.length; i++) {
          var u = list[i]
          if (!u || u.taken || u.shop || u.price || u.sackRolled) continue
          u.sackRolled = true
          var odds = u.kind === 'coin' ? 0.1 : (u.kind === 'key' || u.kind === 'bomb') ? 0.2 : 0
          if (!odds || !ctx.chance(odds)) continue
          u.taken = u.removed = true
          ctx.spawnPickup('sack', u.x, u.y)
        }
      }
    },
    'night-light': {
      // APPROXIMATE: the cone follows the aim direction; Curse of Darkness is not removed.
      onUpdate: function (p, dt, ctx) {
        if (!hasRoom(ctx) || !every(cache(p), 'nlT', dt, 0.3)) return
        var a = aimAngle(p)
        var l = livingList(ctx)
        for (var i = 0; i < l.length; i++) {
          var dx = l[i].x - p.x
          var dy = l[i].y - p.y
          var d = Math.sqrt(dx * dx + dy * dy)
          if (d > 300 || d < 1) continue
          var diff = Math.atan2(dy, dx) - a
          while (diff > Math.PI) diff -= Math.PI * 2
          while (diff < -Math.PI) diff += Math.PI * 2
          if (Math.abs(diff) < 0.5) ctx.applyStatus(l[i], 'slow', 0.6)
        }
      }
    },
    'obsessed-fan': {
      onUpdate: function (p, dt, ctx) { mimicContact(p, 'obsessed-fan', 30, ctx) }
    },
    'mine-crafter': {
      onUse: function (p, ctx) {
        var c = cache(p)
        var room = ctx.room
        if (!room || !IS.addGrid) return { fail: true }
        if (c.mineBarrel && c.mineRoom === room && c.mineBarrel.hp > 0 && room.grid.indexOf(c.mineBarrel) >= 0) {
          var g = c.mineBarrel
          c.mineBarrel = null
          IS.destroyGrid(room, g, ctx)
          return { keepCharge: false }
        }
        var a = aim(p)
        var g2 = IS.addGrid(room, 'tnt', p.x + a.x * 70, p.y + a.y * 70, {})
        if (!g2) return { fail: true }
        c.mineBarrel = g2
        c.mineRoom = room
      }
    },
    pjs: {
      onInit: function (p) {
        var c = cache(p)
        if (c.pjsDone) return
        c.pjsDone = 1
        IS.healRed(p, p.hearts.maxRed)
      }
    },
    'head-of-the-keeper': {
      onTearHit: function (p, tear, e, ctx) {
        if (hasRoom(ctx) && ctx.chance(0.05)) ctx.spawnPickup('coin', e ? e.x : p.x, e ? e.y : p.y, { variant: 'penny' })
      }
    },
    'papa-fly': {
      onUpdate: function (p, dt, ctx) {
        mimicContact(p, 'papa-fly', 0, ctx)
        var fs = famsOf(p, 'papa-fly')
        for (var i = 0; i < fs.length; i++) {
          var f = fs[i]
          f.papaT = (f.papaT || 0) - dt
          if (f.papaT > 0 || !hasRoom(ctx)) continue
          var e = ctx.nearestEnemy(f.x, f.y)
          if (!e || (e.x - f.x) * (e.x - f.x) + (e.y - f.y) * (e.y - f.y) > 420 * 420) continue
          f.papaT = Math.max(0.2, (p.stats && p.stats.fireDelay) || 0.4)
          shootTear(ctx, p, f.x, f.y, Math.atan2(e.y - f.y, e.x - f.x), IS.TEAR_SPEED, dmgNow(p), null, 1.1)
        }
      }
    },
    'multidimensional-baby': {
      onUpdate: function (p, dt, ctx) {
        mimicContact(p, 'multidimensional-baby', 0, ctx)
        if (!hasRoom(ctx)) return
        var fs = famsOf(p, 'multidimensional-baby')
        var l = friendlyTears(ctx)
        for (var i = 0; i < l.length; i++) {
          var t = l[i]
          if (t.mdbDone || t.noDeathHook) continue
          for (var k = 0; k < fs.length; k++) {
            var dx = t.x - fs[k].x
            var dy = t.y - fs[k].y
            if (dx * dx + dy * dy > 34 * 34) continue
            t.mdbDone = true
            t.vx *= 1.25
            t.vy *= 1.25
            t.life += 0.4
            var c = shootTear(ctx, p, t.x, t.y, Math.atan2(t.vy, t.vx), Math.sqrt(t.vx * t.vx + t.vy * t.vy), t.dmg, null, t.life)
            if (c) { c.mdbDone = true; c.noDeathHook = true; t.flags.forEach(function (f) { c.flags.add(f) }) }
            break
          }
        }
      }
    },
    'glitter-bombs': {
      onBombExplode: function (p, bomb, ctx) {
        if (!hasRoom(ctx) || !bomb) return
        var c = cache(p)
        var odds = Math.max(0, 0.63 - 0.01 * (c.glitterSpawns || 0))
        if (ctx.chance(odds)) { c.glitterSpawns = (c.glitterSpawns || 0) + 1; ctx.spawnPickup(randomPickupKind(ctx), bomb.x, bomb.y) }
        if (ctx.chance(0.15)) {
          var l = nearEnemies(ctx, bomb.x, bomb.y, 160)
          for (var i = 0; i < l.length; i++) ctx.applyStatus(l[i], 'charm', 4)
        }
      },
      onNewFloor: function (p) { cache(p).glitterSpawns = 0 }
    },
    'my-shadow': {
      onUpdate: function (p, dt, ctx) {
        if (!hasRoom(ctx)) return
        var f = famsOf(p, 'my-shadow')[0]
        if (!f) return
        var c = cache(p)
        c.shadowCd = Math.max(0, (c.shadowCd || 0) - dt)
        if (c.shadowCd > 0) return
        var l = nearEnemies(ctx, f.x, f.y, (f.r || 14) + 18)
        if (!l.length) return
        c.shadowCd = 4
        var ally = ctx.spawnEnemy('charger', f.x, f.y, { friendly: true, friendlyFireImmune: true })
        if (ally) ally.friendly = true
      }
    },
    'jar-of-flies': {
      onEnemyKill: function (p) { var c = cache(p); c.jarFlies = Math.min(20, (c.jarFlies || 0) + 1) },
      onUse: function (p, ctx) {
        var c = cache(p)
        var n = c.jarFlies || 0
        if (!n) return { fail: true }
        c.jarFlies = 0
        for (var i = 0; i < n; i++) ctx.spawnFamiliar('blue-fly')
        ctx.sfx('familiar-spawn')
      }
    },
    'lil-loki': {
      onUpdate: function (p, dt, ctx) { lokiFire(p, 'lil-loki', dt, ctx, 3.5, [0, 1, 2, 3]) }
    },
    milk: {
      onPlayerHurt: function (p) { cache(p).milkUp = true; recalc(p) },
      onRoomEnter: function (p) { if (cache(p).milkUp) { cache(p).milkUp = false; recalc(p) } },
      onStats: function (p, s) { if (cache(p).milkUp) s.tears += 1 }
    },
    d7: {
      onUse: function (p, ctx) {
        var room = ctx.room
        var list = room && room.meta && room.meta.spawns
        if (!list || !list.length) return { fail: true }
        room.cleared = false
        room.clearing = false
        room.pendingSpawns = room.pendingSpawns || []
        for (var i = 0; i < list.length; i++) {
          if (list[i].boss) continue
          room.pendingSpawns.push({ id: list[i].id, x: list[i].x, y: list[i].y, boss: false, t: 0.4 + i * 0.1 })
        }
        ctx.sfx('beep')
      }
    },
    'moms-box': {
      // APPROXIMATE: doubling of held trinket effects is not modelled; +1 Luck comes from the stat block.
      onUse: function (p, ctx) { ctx.spawnPickup('trinket') }
    },
    'kidney-stone': {
      onUpdate: function (p, dt, ctx) {
        var c = cache(p)
        if (!hasRoom(ctx) || !firing(p)) { c.stoneT = 0; return }
        c.stoneT = (c.stoneT || 0) + dt
        if (c.stoneNext == null) c.stoneNext = 9 + ctx.range(0, 6)
        if (c.stoneT < c.stoneNext) return
        c.stoneT = 0
        c.stoneNext = 9 + ctx.range(0, 6)
        for (var i = 0; i < 12; i++) shootTear(ctx, p, p.x, p.y, (i / 12) * Math.PI * 2, IS.TEAR_SPEED * 0.8, dmgNow(p) * 0.7)
        shootTear(ctx, p, p.x, p.y, aimAngle(p), IS.TEAR_SPEED * 0.9, dmgNow(p) * 3, ['piercing'], null, 18)
        ctx.shake(3, 0.2)
      }
    },
    'mega-blast': {
      // APPROXIMATE: the beam does not persist across rooms.
      onUse: function (p, ctx) {
        var c = cache(p)
        c.megaBeam = ctx.spawnLaser({ x: p.x, y: p.y - 10, angle: aimAngle(p), len: 1800, width: 90, life: 15, tick: 0.1, dmg: dmgNow(p) * 0.9, friendly: true, brimstone: true })
        ctx.sfx('brimstone-fire')
        ctx.shake(6, 0.6)
      },
      onUpdate: function (p, dt, ctx) {
        var b = cache(p).megaBeam
        if (!b) return
        if (b.dead || b.life <= 0) { cache(p).megaBeam = null; return }
        b.x = p.x
        b.y = p.y - 10
        var s = IS.input && IS.input.shoot ? IS.input.shoot() : null
        if (s && (s.x || s.y)) b.angle = Math.atan2(s.y, s.x)
      }
    },
    'dark-princes-crown': {
      onStats: function (p, s) {
        if (!p.hearts || p.hearts.red !== 2) return
        s.tears += 2
        s.range += 48
        s.shotSpeed += 0.2
      },
      onUpdate: function (p) { watch(p, 'dpcOn', !!p.hearts && p.hearts.red === 2) }
    },
    apple: {
      onTearFire: function (p, tear, ctx) {
        if (!tear || !ctx.roll(0.0666, 0.0667, 1)) return
        tear.dmg = (tear.dmg || dmgNow(p)) * 4
        addFlag(tear, 'piercing')
        tear.tint = '#c8c8d8'
      }
    },
    'lead-pencil': {
      onTearFire: function (p, tear, ctx) {
        var c = cache(p)
        c.pencilN = (c.pencilN || 0) + 1
        if (c.pencilN < 15) return
        c.pencilN = 0
        var a = Math.atan2(tear.vy, tear.vx)
        for (var i = 0; i < 12; i++) shootTear(ctx, p, tear.x, tear.y, a + ctx.range(-0.35, 0.35), IS.TEAR_SPEED * (0.7 + ctx.range(0, 0.5)), (tear.dmg || dmgNow(p)))
      }
    },
    'dead-tooth': {
      onUpdate: function (p, dt, ctx) {
        if (!hasRoom(ctx) || !firing(p) || !every(cache(p), 'deadToothT', dt, 0.4)) return
        var l = nearEnemies(ctx, p.x, p.y, 120)
        for (var i = 0; i < l.length; i++) ctx.applyStatus(l[i], 'poison', 2)
      }
    },
    'linger-bean': {
      onUpdate: function (p, dt, ctx) {
        var c = cache(p)
        if (!hasRoom(ctx) || !firing(p)) { c.lingerT = 0; return }
        c.lingerT = (c.lingerT || 0) + dt
        if (c.lingerT < 7.5) return
        c.lingerT = 0
        IS.spawnPuddle({ x: p.x, y: p.y, r: 70, dmg: dmgNow(p) * 2.5, life: 15, status: [['poison', 2]], colour: '#6a5a2a' }, ctx)
        ctx.sfx('fart')
      }
    },
    'shard-of-glass': {
      onPlayerHurt: function (p, n, src, ctx) {
        var c = cache(p)
        if (hasRoom(ctx) && ctx.chance(0.25)) ctx.spawnPickup('heart', null, null, { variant: 'red' })
        c.shardBleed = true
        c.shardT = 0
      },
      onPickup: function (p, kind) { if (kind === 'heart') cache(p).shardBleed = false },
      onUpdate: function (p, dt, ctx) {
        var c = cache(p)
        if (!c.shardBleed || !hasRoom(ctx)) return
        if (p.hearts.red <= 1) { c.shardBleed = false; return }
        c.shardTear = (c.shardTear || 0) + dt
        if (c.shardTear > 0.6 && firing(p)) { c.shardTear = 0; shootTear(ctx, p, p.x, p.y, aimAngle(p) + ctx.range(-0.25, 0.25), IS.TEAR_SPEED * 0.8, dmgNow(p) * 0.5, null, 0.5) }
        if (!every(c, 'shardT', dt, 20)) return
        p.hearts.red -= 1
        ctx.sfx('player-hurt')
      }
    },
    'metal-plate': {
      onUpdate: function (p, dt, ctx) { if (hasRoom(ctx)) reflectNearbyShots(p, ctx, 90, 0.25, 'confusion') }
    },
    'eye-of-greed': {
      onTearFire: function (p, tear, ctx) {
        var c = cache(p)
        c.greedN = (c.greedN || 0) + 1
        if (c.greedN < 20 || (p.coins || 0) < 1) return
        c.greedN = 0
        ctx.addCoins(-1)
        tear.dmg = (tear.dmg || dmgNow(p)) * 1.5 + 10
        tear.greedCoin = true
        tear.tint = '#e0c040'
      },
      onTearHit: function (p, tear, e, ctx) {
        if (tear && tear.greedCoin && e) { ctx.applyStatus(e, 'freeze', 2); ctx.applyStatus(e, 'midas', 30) }
      },
      onEnemyKill: function (p, e, ctx) {
        if (!e || !e.status || !e.status.midas || !hasRoom(ctx)) return
        var n = 1 + ctx.int(3)
        for (var i = 0; i < n; i++) ctx.spawnPickup('coin', e.x, e.y, { variant: 'penny' })
      }
    },
    'tarot-cloth': {
      // APPROXIMATE: the enhanced Tarot card effects are not modelled; only the card is granted.
      onInit: function (p, ctx) {
        var c = cache(p)
        if (c.clothGiven || !hasRoom(ctx)) return
        c.clothGiven = 1
        ctx.spawnPickup('card')
      }
    },
    'varicose-veins': {
      onPlayerHurt: function (p, n, src, ctx) {
        if (!hasRoom(ctx)) return
        for (var i = 0; i < 10; i++) shootTear(ctx, p, p.x, p.y, (i / 10) * Math.PI * 2, IS.TEAR_SPEED * 0.9, dmgNow(p) + 25)
        ctx.sfx('tear-fire')
      }
    },
    'compound-fracture': {
      onTearHit: function (p, tear, e, ctx) {
        if (!tear || tear.bone || !hasRoom(ctx)) return
        var n = 1 + ctx.int(3)
        for (var i = 0; i < n; i++) {
          var t = shootTear(ctx, p, tear.x, tear.y, ctx.range(0, Math.PI * 2), IS.TEAR_SPEED * 0.7, (tear.dmg || dmgNow(p)) * 0.5, null, 0.35, 5)
          if (t) { t.bone = true; t.noDeathHook = true }
        }
      }
    },
    polydactyly: {
      onInit: function (p, ctx) {
        var c = cache(p)
        if (c.polyGiven || !hasRoom(ctx)) return
        c.polyGiven = 1
        ctx.spawnPickup(ctx.pick(['card', 'rune', 'pill']) || 'card')
      }
    },
    'dads-lost-coin': {
      onInit: function (p, ctx) {
        var c = cache(p)
        if (c.dlcGiven || !hasRoom(ctx)) return
        c.dlcGiven = 1
        ctx.spawnPickup('coin', null, null, { variant: 'lucky' })
      }
    },
    'midnight-snack': {
      onInit: function (p) {
        var c = cache(p)
        if (c.snackDone) return
        c.snackDone = 1
        IS.healRed(p, 2)
      }
    },
    'cone-head': {
      onPlayerDamage: function (p, n, src, ctx) { if (ctx.chance(0.2)) { ctx.sfx('holy-shield'); return { cancel: true } } }
    },
    'belly-button': {
      onInit: function (p, ctx) {
        var c = cache(p)
        if (c.bellyGiven) return
        c.bellyGiven = 1
        if (p.trinkets.length < 3) p.trinkets.push(null)
        if (hasRoom(ctx)) ctx.spawnPickup('trinket')
      },
      onRemove: function (p) {
        while (p.trinkets.length > 2 && p.trinkets[p.trinkets.length - 1] == null) p.trinkets.pop()
      }
    },
    'sinus-infection': {
      onTearFire: function (p, tear, ctx) {
        if (!tear || !ctx.chance(0.2)) return
        addFlag(tear, 'sticky')
        tear.booger = true
        tear.tint = '#9ab050'
      },
      onTearHit: function (p, tear, e, ctx) {
        if (!tear || !tear.booger || !e) return
        ctx.applyStatus(e, 'sticky', 10)
        ;(cache(p).boogers || (cache(p).boogers = [])).push({ t: 10, e: e, tick: 1, dmg: tear.dmg || dmgNow(p) })
      },
      onUpdate: function (p, dt, ctx) {
        tickList(cache(p), 'boogers', dt, function (b) {
          if (!b.e || b.e.dead) return false
          b.tick -= dt
          if (b.tick <= 0) { b.tick = 1; hurtEnemy(b.e, b.dmg, ctx) }
          return true
        })
      },
      onRoomEnter: function (p) { cache(p).boogers = [] }
    },
    glaucoma: {
      // APPROXIMATE: the screen is not darkened.
      onTearFire: function (p, tear, ctx) {
        if (!tear || !ctx.chance(0.05)) return
        addFlag(tear, 'confusion')
        addFlag(tear, 'knockback')
      }
    }
  }

  // Helpers used by the table above (function declarations are hoisted).
  function lightBeam (p, tear, e, ctx) {
    if (!e || !hasRoom(ctx) || (tear && tear.holyDone)) return
    if (tear) tear.holyDone = true
    var d = ((tear && tear.dmg) || dmgNow(p)) * 3
    ctx.spawnEffect('beam', e.x, e.y - 160, { angle: Math.PI / 2, len: 160, colour: '#fff4b0' })
    hurtEnemy(e, d, ctx)
    ctx.sfx('holy-shield')
  }

  function lokiFire (p, id, dt, ctx, dmg, dirs) {
    if (!hasRoom(ctx)) return
    var fs = famsOf(p, id)
    var shooting = firing(p)
    for (var i = 0; i < fs.length; i++) {
      var f = fs[i]
      f.lokiT = (f.lokiT || 0) - dt
      if (f.lokiT > 0 || !shooting) continue
      f.lokiT = Math.max(0.25, (p.stats && p.stats.fireDelay) || 0.4) * 1.6
      var base = aimAngle(p)
      for (var k = 0; k < dirs.length; k++) shootTear(ctx, p, f.x, f.y, base + dirs[k] * Math.PI / 2, IS.TEAR_SPEED, dmg, null, 0.9)
    }
  }

  // Obsessed Fan / Papa Fly / Multidimensional Baby copy Isaac's movement 0.66s late.
  function mimicContact (p, id, dps, ctx) {
    if (!hasRoom(ctx)) return
    var c = cache(p)
    var fs = famsOf(p, id)
    if (!fs.length) return
    var tr = c.trail || (c.trail = [])
    var now = (ctx.run && ctx.run.time) || 0
    var last = tr[tr.length - 1]
    if (!last || last.t !== now) tr.push({ t: now, x: p.x, y: p.y })
    while (tr.length > 2 && tr[1].t < now - 0.66) tr.shift()
    var old = tr[0]
    for (var i = 0; i < fs.length; i++) {
      fs[i].mimic = true
      fs[i].x = old.x
      fs[i].y = old.y
      fs[i].vx = fs[i].vy = 0
    }
    if (!dps) return
    var f = fs[0]
    c.fanT = (c.fanT || 0) + (ctx.dt || 0.016)
    if (c.fanT < 0.25) return
    c.fanT = 0
    var l = nearEnemies(ctx, f.x, f.y, (f.r || 16) + 20)
    for (var j = 0; j < l.length; j++) hurtEnemy(l[j], dps * 0.25, ctx)
  }

  // The 'copycat' behaviour is only used by the mimic familiars above: park the familiar where the
  // hook put it (the stock behaviour would walk it back to the player).
  if (typeof IS.defineFamiliarBehaviour === 'function') IS.defineFamiliarBehaviour('copycat', function (f) {})

  IS.defineItems([

    // ---------------------------------------------------------------- 369
    {
      id: 'continuum',
      num: 369,
      name: 'Continuum',
      desc: 'Tears wrap around',
      info: '+3 Range · Spectral tears · Tears travel through one side of the room and out the other',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure'],
      tags: ['tears', 'range', 'offensive'],
      dlc: 'afterbirth',
      stats: { range: 180 },
      tearFlags: ['spectral'],
      hooks: {
        // The wrap itself: push any friendly tear that leaves the walkable box
        // out of the opposite side. room.pxW/pxH so it works in big rooms too.
        onUpdate: function (p, dt, ctx) {
          var room = ctx && ctx.room
          if (!room || !Array.isArray(room.tears)) return
          var w = roomW(room)
          var h = roomH(room)
          for (var i = 0; i < room.tears.length; i++) {
            var t = room.tears[i]
            if (!t || t.dead || t.friendly === false) continue
            if (t.x < 0) t.x += w
            else if (t.x > w) t.x -= w
            if (t.y < 0) t.y += h
            else if (t.y > h) t.y -= h
          }
        }
      }
    },

    // ---------------------------------------------------------------- 370
    {
      id: 'mr-dolly',
      num: 370,
      name: 'Mr. Dolly',
      desc: 'Tears up + hearts',
      info: '+0.7 Tears · +2.5 Range · Spawns 3 random hearts',
      kind: 'passive',
      quality: 2,
      pools: ['boss', 'golden-chest', 'greed-boss', 'crane-game'],
      tags: ['tears', 'range', 'hearts'],
      dlc: 'afterbirth',
      stats: { tears: 0.72, range: 80 },
      hooks: {
        onInit: function (p, ctx) {
          var c = cache(p)
          if (c.mrDollyGiven) return
          c.mrDollyGiven = 1
          for (var i = 0; i < 3; i++) {
            ctx.spawnPickup(ctx.pick(['heart', 'soul', 'black']) || 'heart')
          }
        }
      }
    },

    // ---------------------------------------------------------------- 371
    {
      id: 'curse-of-the-tower',
      num: 371,
      name: 'Curse of the Tower',
      desc: 'Bombs when hit',
      info: 'Taking damage spawns 6 Troll Bombs that inherit your bomb effects',
      kind: 'passive',
      quality: 1,
      pools: ['treasure', 'red-chest', 'curse', 'greed-treasure', 'greed-curse'],
      tags: ['bombs', 'curse', 'downgrade'],
      dlc: 'afterbirth',
      hooks: {
        onPlayerDamage: function (p, amount, source, ctx) {
          var c = cache(p)
          var now = (ctx && ctx.run && ctx.run.time) || 0
          // One volley per damage event: the bombs hurt Isaac too, and without
          // this guard a single explosion chains into an endless cascade.
          if (c.cotLast != null && now - c.cotLast < 1) return
          c.cotLast = now
          var dmg = (p.stats && p.stats.bombDamage) || IS.BASE_BOMB_DAMAGE
          for (var i = 0; i < 6; i++) {
            var a = (i / 6) * Math.PI * 2
            ctx.spawnBomb(p.x + Math.cos(a) * 60, p.y + Math.sin(a) * 60, {
              fuse: 2.2 + i * 0.1, dmg: dmg, friendly: false, troll: true
            })
          }
          ctx.sfx('bomb-fuse')
        }
      }
    },

    // ---------------------------------------------------------------- 372
    {
      id: 'charged-baby',
      num: 372,
      name: 'Charged Baby',
      desc: 'Battery familiar',
      info: 'Every 30s in an uncleared room: spawns a Battery, adds a charge, or petrifies every enemy',
      kind: 'familiar',
      quality: 2,
      pools: ['shop', 'battery-bum', 'greed-shop', 'baby-shop'],
      tags: ['familiar', 'battery', 'charge', 'baby'],
      dlc: 'afterbirth',
      familiars: ['charged-baby'],
      hooks: {
        onRoomEnter: function (p, room, ctx) {
          var c = cache(p)
          c.chargedBabyT = 0
          c.chargedBabyBatteries = 0
          c.chargedBabyCharges = 0
        },
        onUpdate: function (p, dt, ctx) {
          var room = ctx && ctx.room
          if (!room || room.cleared) return
          var c = cache(p)
          c.chargedBabyT = (c.chargedBabyT || 0) + dt
          if (c.chargedBabyT < 30) return
          c.chargedBabyT = 0
          var options = []
          if ((c.chargedBabyBatteries || 0) < 2) options.push('battery')
          if ((c.chargedBabyCharges || 0) < 2) options.push('charge')
          options.push('petrify')
          var pick = ctx.pick(options) || 'petrify'
          if (pick === 'battery') {
            c.chargedBabyBatteries = (c.chargedBabyBatteries || 0) + 1
            ctx.spawnPickup('battery')
          } else if (pick === 'charge') {
            c.chargedBabyCharges = (c.chargedBabyCharges || 0) + 1
            ctx.addCharge(1)
            ctx.sfx('charge-ready')
          } else {
            var list = livingList(ctx)
            for (var i = 0; i < list.length; i++) ctx.applyStatus(list[i], 'freeze', 3)
            ctx.sfx('beep')
          }
        }
      }
    },

    // ---------------------------------------------------------------- 373
    {
      id: 'dead-eye',
      num: 373,
      name: 'Dead Eye',
      desc: 'Accuracy damage',
      info: 'Consecutive tear hits grant +25% damage, up to +100%. Missing can reset the multiplier',
      kind: 'passive',
      quality: 3,
      pools: ['treasure', 'greed-treasure', 'ultra-secret'],
      tags: ['damage', 'offensive'],
      dlc: 'afterbirth',
      hooks: {
        // onStats only sees additive "ups", so the streak multiplier is applied to each tear as it is fired.
        onTearFire: function (p, tear) {
          var n = cache(p).deadEyeStreak || 0
          if (tear && n > 0) tear.dmg = (tear.dmg || p.stats.damage) * (1 + 0.25 * Math.min(4, n))
        },
        onTearHit: function (p, tear, enemy, ctx) {
          var c = cache(p)
          if ((c.deadEyeStreak || 0) >= 4) return
          c.deadEyeStreak = (c.deadEyeStreak || 0) + 1
          if (c.deadEyeStreak === 4) ctx.sfx('charge-ready')
        },
        onTearDeath: function (p, tear, ctx) {
          var c = cache(p)
          if (!c.deadEyeStreak) return
          c.deadEyeStreak = 0
        },
        onRoomEnter: function (p, room, ctx) {
          var c = cache(p)
          c.deadEyeStreak = 0
        }
      }
    },

    // ---------------------------------------------------------------- 374
    {
      id: 'holy-light',
      num: 374,
      name: 'Holy Light',
      desc: 'Holy tears',
      info: '10% chance (50% at 9 luck) to fire a holy tear that drops a light beam dealing 3x damage',
      kind: 'passive',
      quality: 3,
      pools: ['treasure', 'angel', 'greed-treasure'],
      tags: ['tears', 'angel', 'offensive'],
      dlc: 'afterbirth',
      transform: 'seraphim',
      hooks: {
        // 10% -> 50% over 9 luck. The engine ignores 'holy'/'light', so the beam is dealt here on hit.
        onTearFire: function (p, tear, ctx) {
          if (!ctx.roll(0.1, 0.0444, 0.5)) return
          addFlags(tear, ['holy', 'light'])
        },
        onTearHit: function (p, tear, enemy, ctx) {
          if (tear && tear.flags && tear.flags.has('holy')) lightBeam(p, tear, enemy, ctx)
        }
      }
    },

    // ---------------------------------------------------------------- 375
    {
      id: 'host-hat',
      num: 375,
      name: 'Host Hat',
      desc: 'Explosion immunity',
      info: 'Immune to explosions and falling projectiles · 20% chance to reflect enemy shots',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure'],
      tags: ['defensive', 'bombs'],
      dlc: 'afterbirth',
      hooks: {
        onPlayerDamage: function (p, amount, source, ctx) {
          if (!source) return
          var kind = source.kind || source.type || source.id || ''
          if (source.explosion || source.explosive || source.bomb ||
              source.falling || /bomb|explos|rock|spike-?fall/i.test(String(kind))) {
            ctx.sfx('holy-shield')
            return { cancel: true }
          }
        },
        onUpdate: function (p, dt, ctx) {
          reflectNearbyShots(p, ctx, 90, 0.2)
        }
      }
    },

    // ---------------------------------------------------------------- 376
    {
      id: 'restock',
      num: 376,
      name: 'Restock',
      desc: 'Shops restock',
      info: 'Buying from a Shop restocks the slot instantly, at a higher price each time',
      kind: 'passive',
      quality: 1,
      pools: ['shop', 'beggar'],
      tags: ['shop', 'utility', 'coins'],
      dlc: 'afterbirth',
      hooks: {
        // APPROXIMATED: the shop entry's internals belong to interact.js, so
        // rather than un-selling an object whose field names we would have to
        // guess, we spawn a fresh shop pedestal on the same spot and track the
        // escalating price ourselves.
        onPurchase: function (p, entry, ctx) {
          if (!entry || typeof entry.x !== 'number' || typeof entry.y !== 'number') return
          var room = ctx && ctx.room
          if (!room || (room.type !== 'shop' && room.type !== 'black-market')) return
          var c = cache(p)
          var n = (c.restockCount || 0) + 1
          c.restockCount = n
          var base = typeof entry.price === 'number' && entry.price > 0 ? entry.price : 15
          var price = Math.ceil(base * (1 + 0.5 * n))
          ctx.spawnPickup('item', entry.x, entry.y, { pool: 'shop', price: price, shop: true })
          ctx.sfx('pedestal-appear')
        }
      }
    },

    // ---------------------------------------------------------------- 377
    {
      id: 'bursting-sack',
      num: 377,
      name: 'Bursting Sack',
      desc: 'Spider immunity',
      info: 'Spider enemies no longer deal contact damage to you',
      kind: 'passive',
      quality: 1,
      pools: ['treasure', 'greed-treasure'],
      tags: ['spider', 'defensive'],
      dlc: 'afterbirth',
      transform: 'spider',
      hooks: {
        // APPROXIMATED: "no longer target" needs an enemy-AI hook, which the
        // closed list does not have. The contact-damage half is exact.
        onPlayerDamage: function (p, amount, source, ctx) {
          if (!source) return
          var id = String(source.id || (source.def && source.def.id) || '')
          if (/spider|sack/i.test(id)) return { cancel: true }
        }
      }
    },

    // ---------------------------------------------------------------- 378
    {
      id: 'no-2',
      num: 378,
      name: 'No. 2',
      desc: 'Butt bombs',
      info: 'Firing for 2.35 seconds spawns a lit Butt Bomb',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure'],
      tags: ['bombs', 'poop', 'offensive'],
      dlc: 'afterbirth',
      hooks: {
        // See FILE-WIDE APPROXIMATIONS #1 for how "firing" is detected.
        onUpdate: function (p, dt, ctx) {
          var c = cache(p)
          if (!firing(p)) { c.no2T = 0; return }
          c.no2T = (c.no2T || 0) + dt
          if (c.no2T < 2.35) return
          c.no2T = 0
          var dmg = (p.stats && p.stats.bombDamage) || IS.BASE_BOMB_DAMAGE
          ctx.spawnBomb(p.x, p.y, { fuse: 1.1, dmg: dmg, friendly: true, r: 130 })
          ctx.sfx('fart')
        }
      }
    },

    // ---------------------------------------------------------------- 379
    {
      id: 'pupula-duplex',
      num: 379,
      name: 'Pupula Duplex',
      desc: 'Wide tears',
      info: 'x2 Tear size · Spectral tears',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure'],
      tags: ['tears', 'offensive'],
      dlc: 'afterbirth',
      mult: { tearSize: 2 },
      tearFlags: ['spectral']
    },

    // ---------------------------------------------------------------- 380
    {
      id: 'pay-to-play',
      num: 380,
      name: 'Pay To Play',
      desc: 'Coins open locks',
      info: '+5 Coins · Locked blocks, doors and chests are opened with coins instead of keys',
      kind: 'passive',
      quality: 1,
      pools: ['shop', 'greed-treasure', 'greed-shop'],
      tags: ['coins', 'keys', 'utility'],
      dlc: 'afterbirth',
      grant: { coins: 5 },
      hooks: {
        // APPROXIMATED: the key check lives in interact.js and no hook fires
        // when a lock refuses to open. The playable half of the effect —
        // paying coins to get through locks — is implemented by buying a key
        // for 5 coins whenever the player stands in a room with a lock and has
        // no key. It never runs unprompted, so it cannot drain coins in a room
        // with nothing to unlock.
        onUpdate: function (p, dt, ctx) {
          var c = cache(p)
          c.ptpT = (c.ptpT || 0) + dt
          if (c.ptpT < 0.5) return
          c.ptpT = 0
          if ((p.keys || 0) > 0 || (p.coins || 0) < 5) return
          var room = ctx && ctx.room
          if (!room) return
          var i
          var locked = false
          if (Array.isArray(room.doors)) {
            for (i = 0; i < room.doors.length; i++) {
              var d = room.doors[i]
              if (d && (d.locked || d.kind === 'locked')) { locked = true; break }
            }
          }
          if (!locked) {
            var grid = ctx.gridObjects()
            for (i = 0; i < grid.length; i++) {
              var g = grid[i]
              if (!g || g.broken) continue
              if (g.kind === 'key-block' || g.kind === 'locked-chest') { locked = true; break }
            }
          }
          if (!locked) return
          ctx.addCoins(-5)
          ctx.addKeys(1)
          ctx.floater('-5c', p.x, p.y - 40, '#e0d040')
          ctx.sfx('key')
        }
      }
    },

    // ---------------------------------------------------------------- 381
    {
      id: 'edens-blessing',
      num: 381,
      name: "Eden's Blessing",
      desc: 'Tears up + a gift',
      info: '+0.7 Tears · Grants a random item at the start of the next run',
      kind: 'passive',
      quality: 1,
      pools: ['treasure'],
      tags: ['tears', 'utility'],
      dlc: 'afterbirth',
      stats: { tears: 0.72 },
      hooks: {
        // APPROXIMATED: nothing in the data layer survives to the next run —
        // IS.save's schema is owned by js/core/save.js and no other file would
        // read a key we invented, which would make the blessing a silent
        // no-op. The gift is therefore delivered on the next floor of this run.
        onNewFloor: function (p, floor, ctx) {
          var c = cache(p)
          if (c.edensBlessingGiven) return
          c.edensBlessingGiven = 1
          ctx.spawnPickup('item', null, null, { pool: 'treasure' })
          ctx.sfx('pedestal-appear')
        }
      }
    },

    // ---------------------------------------------------------------- 382
    {
      id: 'friendly-ball',
      num: 382,
      name: 'Friendly Ball',
      desc: 'Capture an enemy',
      info: 'Captures an enemy; using it again releases the capture as a friendly companion',
      kind: 'active',
      quality: 1,
      pools: ['treasure', 'greed-treasure', 'crane-game'],
      tags: ['utility', 'charge'],
      dlc: 'afterbirth',
      charge: 4,
      chargeType: 'normal',
      hooks: {
        onUse: function (p, ctx) {
          var c = cache(p)
          if (c.friendlyBallHeld) {
            var id = c.friendlyBallHeld
            c.friendlyBallHeld = null
            var ally = ctx.spawnEnemy(id, p.x + 60, p.y, { friendly: true, friendlyFireImmune: true })
            if (!ally) return { fail: true }
            ctx.sfx('familiar-spawn')
            return
          }
          var target = ctx.nearestEnemy(p.x, p.y)
          if (!target || target.boss) return { fail: true }
          var dx = target.x - p.x
          var dy = target.y - p.y
          if (dx * dx + dy * dy > 360 * 360) return { fail: true }
          c.friendlyBallHeld = target.id || (target.def && target.def.id) || null
          if (!c.friendlyBallHeld) return { fail: true }
          killIt(target, ctx)
          ctx.spawnEffect('poof', target.x, target.y, { colour: '#e05a8a' })
          ctx.sfx('enemy-die')
        }
      }
    },

    // ---------------------------------------------------------------- 383
    {
      id: 'tear-detonator',
      num: 383,
      name: 'Tear Detonator',
      desc: 'Split your tears',
      info: 'Splits every one of your tears on screen into a circle of 6 tears',
      kind: 'active',
      quality: 1,
      pools: ['shop', 'greed-treasure', 'crane-game'],
      tags: ['offensive', 'charge'],
      dlc: 'afterbirth',
      charge: 4,
      chargeType: 'normal',
      hooks: {
        onUse: function (p, ctx) {
          var list = friendlyTears(ctx)
          if (!list.length) return { fail: true }
          var speed = IS.TEAR_SPEED * 0.7
          for (var i = 0; i < list.length; i++) {
            var t = list[i]
            var dmg = t.dmg != null ? t.dmg : ((p.stats && p.stats.damage) || IS.BASE_DAMAGE)
            for (var k = 0; k < 6; k++) {
              var a = (k / 6) * Math.PI * 2
              var nt = ctx.spawnTear({
                x: t.x,
                y: t.y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                dmg: dmg * 0.6,
                friendly: true,
                life: 0.9
              })
              addFlag(nt, 'spectral')
            }
            t.dead = true
            t.life = 0
          }
          ctx.sfx('tear-splat')
        }
      }
    },

    // ---------------------------------------------------------------- 384
    {
      id: 'lil-gurdy',
      num: 384,
      name: 'Lil Gurdy',
      desc: 'Bouncing familiar',
      info: 'Launches and bounces around the room, dealing 5-20 contact damage depending on speed',
      kind: 'familiar',
      quality: 2,
      pools: ['treasure', 'greed-treasure', 'baby-shop'],
      tags: ['familiar', 'offensive'],
      dlc: 'afterbirth',
      familiars: ['lil-gurdy']
    },

    // ---------------------------------------------------------------- 385
    {
      id: 'bumbo',
      num: 385,
      name: 'Bumbo',
      desc: 'Coin familiar',
      info: 'Eats coins and levels up at 6, 12 and 24: room-clear items, coin tears, then bombs',
      kind: 'familiar',
      quality: 2,
      pools: ['treasure', 'beggar', 'baby-shop'],
      tags: ['familiar', 'coins', 'utility'],
      dlc: 'afterbirth',
      familiars: ['bumbo'],
      hooks: {
        // Levelling is item-side state: the familiar behaviour ('collector')
        // does the coin eating, these hooks add each level's extra.
        onPickup: function (p, kind, amount, ctx) {
          if (kind !== 'coin') return
          var c = cache(p)
          var before = bumboLevel(c.bumboCoins || 0)
          c.bumboCoins = (c.bumboCoins || 0) + (amount || 1)
          var after = bumboLevel(c.bumboCoins)
          if (after > before) {
            ctx.floater('Bumbo Lv' + after, p.x, p.y - 46, '#e0d040')
            ctx.sfx('transform')
          }
          if (after >= 4 && ctx.chance(0.04)) {
            ctx.spawnPickup('item', null, null, { pool: 'treasure' })
          }
        },
        onRoomClear: function (p, room, ctx) {
          if (bumboLevel(cache(p).bumboCoins || 0) < 2) return
          if (!ctx.chance(0.1)) return
          ctx.spawnPickup('item', null, null, { pool: 'treasure' })
          ctx.sfx('pedestal-appear')
        },
        onTearHit: function (p, tear, enemy, ctx) {
          if (bumboLevel(cache(p).bumboCoins || 0) < 3) return
          if (!ctx.roll(0.04, 0.01, 0.15)) return
          ctx.spawnPickup('coin', enemy ? enemy.x : p.x, enemy ? enemy.y : p.y)
        },
        onUpdate: function (p, dt, ctx) {
          var c = cache(p)
          if (bumboLevel(c.bumboCoins || 0) < 4) return
          var room = ctx && ctx.room
          if (!room || room.cleared) return
          c.bumboBombT = (c.bumboBombT || 0) + dt
          if (c.bumboBombT < 6) return
          c.bumboBombT = 0
          ctx.spawnBomb(p.x, p.y, {
            fuse: 1.6, friendly: true,
            dmg: (p.stats && p.stats.bombDamage) || IS.BASE_BOMB_DAMAGE
          })
        }
      }
    },

    // ---------------------------------------------------------------- 386
    {
      id: 'd12',
      num: 386,
      name: 'D12',
      desc: 'Reroll obstacles',
      info: 'Rerolls every obstacle in the room into another obstacle, rarely a crawlspace or trapdoor',
      kind: 'active',
      quality: 1,
      pools: ['treasure', 'greed-shop', 'crane-game'],
      tags: ['utility', 'charge'],
      dlc: 'afterbirth',
      charge: 6,
      chargeType: 'normal',
      hooks: {
        // APPROXIMATED: ctx can create poop, crawlspaces and trapdoors but has
        // no generic grid spawner, so a rerolled obstacle becomes poop unless
        // the rare roll turns it into a crawlspace or a trapdoor.
        onUse: function (p, ctx) {
          var grid = ctx.gridObjects()
          if (!grid.length) return { fail: true }
          var targets = []
          for (var i = 0; i < grid.length; i++) {
            var g = grid[i]
            if (!g || g.broken) continue
            if (g.kind === 'metal' || g.kind === 'pit' || g.kind === 'pit-bridge') continue
            targets.push(g)
          }
          if (!targets.length) return { fail: true }
          for (var k = 0; k < targets.length; k++) {
            var t = targets[k]
            var x = t.x
            var y = t.y
            ctx.destroyGrid(t)
            if (ctx.chance(0.04)) ctx.spawnCrawlspace(x, y)
            else if (ctx.chance(0.02)) ctx.spawnTrapdoor(x, y)
            else ctx.spawnPoop(x, y)
          }
          ctx.sfx('rock-break')
        }
      }
    },

    // ---------------------------------------------------------------- 387
    {
      id: 'censer',
      num: 387,
      name: 'Censer',
      desc: 'Slowing aura',
      info: 'Familiar wrapped in a huge aura of light that slows enemies and their shots',
      kind: 'familiar',
      quality: 2,
      pools: ['angel', 'greed-angel'],
      tags: ['familiar', 'angel', 'defensive'],
      dlc: 'afterbirth',
      familiars: ['censer'],
      hooks: {
        // See FILE-WIDE APPROXIMATIONS #2: the aura is centred on the player.
        onUpdate: function (p, dt, ctx) {
          var list = nearEnemies(ctx, p.x, p.y, 220)
          for (var i = 0; i < list.length; i++) ctx.applyStatus(list[i], 'slow', 0.5)
          var shots = hostileShots(ctx)
          for (var k = 0; k < shots.length; k++) {
            var s = shots[k]
            if (s.censed) continue
            var dx = s.x - p.x
            var dy = s.y - p.y
            if (dx * dx + dy * dy > 220 * 220) continue
            s.censed = true
            s.vx *= 0.55
            s.vy *= 0.55
          }
        }
      }
    },

    // ---------------------------------------------------------------- 388
    {
      id: 'key-bum',
      num: 388,
      name: 'Key Bum',
      desc: 'Keys into chests',
      info: 'Picks up nearby keys and pays them back as random chests',
      kind: 'familiar',
      quality: 2,
      pools: ['treasure', 'secret', 'key-master', 'baby-shop'],
      tags: ['familiar', 'keys', 'beggar'],
      dlc: 'afterbirth',
      familiars: ['key-bum'],
      hooks: {
        // The familiar eats keys lying on the floor (collector behaviour, collects: ['key']) and
        // each key it swallows has a chance to come back as a chest.
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          var fs = p.familiars || []
          for (var i = 0; i < fs.length; i++) {
            var f = fs[i]
            if (f.id !== 'key-bum') continue
            while (f.got >= 1) {
              f.got -= 1
              if (!ctx.chance(0.4)) continue
              ctx.spawnPickup('chest', f.x, f.y)
              ctx.sfx('chest-open')
            }
          }
        }
      }
    },

    // ---------------------------------------------------------------- 389
    {
      id: 'rune-bag',
      num: 389,
      name: 'Rune Bag',
      desc: 'Runes over time',
      info: 'Spawns a random rune or Soul Stone every 7-8 cleared rooms',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'secret', 'greed-treasure', 'greed-secret'],
      tags: ['utility', 'consumable'],
      dlc: 'afterbirth',
      hooks: {
        onRoomClear: function (p, room, ctx) {
          var c = cache(p)
          c.runeBagN = (c.runeBagN || 0) + 1
          if (c.runeBagTarget == null) c.runeBagTarget = 7 + ctx.int(2)
          if (c.runeBagN < c.runeBagTarget) return
          c.runeBagN = 0
          c.runeBagTarget = 7 + ctx.int(2)
          var id = ctx.rollRune()
          ctx.spawnPickup('rune', null, null, id ? { id: id } : null)
          ctx.sfx('secret-found')
        }
      }
    },

    // ---------------------------------------------------------------- 390
    {
      id: 'seraphim',
      num: 390,
      name: 'Seraphim',
      desc: 'Angel familiar',
      info: 'Familiar that fires homing Sacred Heart tears for 10 damage',
      kind: 'familiar',
      quality: 3,
      pools: ['treasure', 'angel', 'greed-angel', 'baby-shop'],
      tags: ['familiar', 'angel', 'offensive'],
      dlc: 'afterbirth',
      transform: 'conjoined',
      familiars: ['seraphim']
    },

    // ---------------------------------------------------------------- 391
    {
      id: 'betrayal',
      num: 391,
      name: 'Betrayal',
      desc: 'Enemies infight',
      info: 'Taking damage turns the room against itself — every enemy is charmed',
      kind: 'passive',
      quality: 1,
      pools: ['treasure', 'devil', 'greed-treasure', 'greed-devil'],
      tags: ['devil', 'utility'],
      dlc: 'afterbirth',
      hooks: {
        // APPROXIMATED: projectile friendly-fire is engine-side. Charm is the
        // mechanism the engine already owns for making enemies infight, so the
        // item applies that instead of rewriting shot ownership.
        onPlayerDamage: function (p, amount, source, ctx) {
          if (ctx.charmAllEnemies(5)) ctx.sfx('devil-deal')
        },
        onRoomEnter: function (p, room, ctx) {
          if (!room || room.cleared) return
          var e = ctx.randomEnemy()
          if (e) ctx.applyStatus(e, 'charm', 6)
        }
      }
    },

    // ---------------------------------------------------------------- 392
    {
      id: 'zodiac',
      num: 392,
      name: 'Zodiac',
      desc: 'A sign each floor',
      info: 'Grants a random zodiac item effect on every floor',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure'],
      tags: ['utility', 'quality-shift'],
      dlc: 'afterbirth',
      hooks: {
        onInit: function (p, ctx) {
          var c = cache(p)
          if (c.zodiacSign == null) c.zodiacSign = ctx.int(ZODIAC.length)
        },
        onNewFloor: function (p, floor, ctx) {
          var c = cache(p)
          c.zodiacSign = ctx.int(ZODIAC.length)
          recalc(p)
          var z = ZODIAC[c.zodiacSign]
          if (z) ctx.banner('Zodiac', z.name)
        },
        onStats: function (p, s) {
          var z = ZODIAC[cache(p).zodiacSign]
          if (!z || !z.stats) return
          for (var k in z.stats) if (s[k] != null) s[k] += z.stats[k]
        },
        onTearFire: function (p, tear, ctx) {
          var z = ZODIAC[cache(p).zodiacSign]
          if (z && z.tearFlag) addFlag(tear, z.tearFlag)
        },
        onUpdate: function (p, dt, ctx) {
          var z = ZODIAC[cache(p).zodiacSign]
          if (!z || !z.creep) return
          var c = cache(p)
          c.zodiacCreepT = (c.zodiacCreepT || 0) + dt
          if (c.zodiacCreepT < 0.25) return
          c.zodiacCreepT = 0
          ctx.spawnCreep(p.x, p.y, 34, { kind: 'blue', slow: 0.5, life: 12 })
        }
      }
    },

    // ---------------------------------------------------------------- 393
    {
      id: 'serpents-kiss',
      num: 393,
      name: "Serpent's Kiss",
      desc: 'Poison touch',
      info: '15% chance for poison tears · Poisons enemies on contact · Poison kills can drop a Black Heart',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure'],
      tags: ['tears', 'offensive', 'hearts'],
      dlc: 'afterbirth',
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (ctx.roll(0.15, 0.03, 1)) addFlag(tear, 'poison')
        },
        onUpdate: function (p, dt, ctx) {
          var list = livingList(ctx)
          var pr = p.r || IS.PLAYER_R
          for (var i = 0; i < list.length; i++) {
            var e = list[i]
            var dx = e.x - p.x
            var dy = e.y - p.y
            var rr = (e.r || 22) + pr
            if (dx * dx + dy * dy > rr * rr) continue
            if (e.status && e.status.poison) continue
            ctx.applyStatus(e, 'poison', 4)
            e.serpentKissed = true
          }
        },
        onEnemyKill: function (p, enemy, ctx) {
          if (!enemy || !enemy.serpentKissed) return
          if (!ctx.roll(0.2, 0.02, 0.5)) return
          ctx.spawnPickup('black', enemy.x, enemy.y)
        }
      }
    },

    // ---------------------------------------------------------------- 394
    {
      id: 'marked',
      num: 394,
      name: 'Marked',
      desc: 'Tears seek the mark',
      info: '+0.7 Tears · +3 Range · Tears chase a marked target on the ground',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure', 'ultra-secret'],
      tags: ['tears', 'range', 'offensive'],
      dlc: 'afterbirth',
      stats: { tears: 0.72, range: 132 },
      // APPROXIMATED: the movable red target needs the input layer, which no
      // data file can read. Homing tears are the closest honest stand-in — the
      // tears still choose their own target instead of the player's.
      flags: ['homingTears']
    },

    // ---------------------------------------------------------------- 395
    {
      id: 'tech-x',
      num: 395,
      name: 'Tech X',
      desc: 'Laser rings',
      info: 'Tears become a chargeable laser ring; size and damage scale with charge',
      kind: 'passive',
      quality: 4,
      pools: ['treasure', 'greed-treasure', 'crane-game'],
      tags: ['laser', 'offensive', 'tears'],
      dlc: 'afterbirth',
      flags: ['laser'],
      tearFlags: ['technology', 'piercing', 'spectral']
    },

    // ---------------------------------------------------------------- 396
    {
      id: 'ventricle-razor',
      num: 396,
      name: 'Ventricle Razor',
      desc: 'Portal pair',
      info: 'Places a portal; using it again travels back to the placed portal',
      kind: 'active',
      quality: 1,
      pools: ['shop'],
      tags: ['utility', 'charge'],
      dlc: 'afterbirth',
      charge: 2,
      chargeType: 'normal',
      hooks: {
        onUse: function (p, ctx) {
          var c = cache(p)
          var room = ctx && ctx.room
          if (c.razorMark == null) {
            if (!room || room.index == null) return { fail: true }
            c.razorMark = room.index
            ctx.spawnEffect('ring', p.x, p.y, { colour: '#c05a8a', r0: 8, r1: 60, life: 0.5 })
            ctx.floater('Portal', p.x, p.y - 40, '#c05a8a')
            return
          }
          var target = c.razorMark
          c.razorMark = null
          if (!ctx.teleport(target)) return { fail: true }
          ctx.sfx('trapdoor')
        }
      }
    },

    // ---------------------------------------------------------------- 397
    {
      id: 'tractor-beam',
      num: 397,
      name: 'Tractor Beam',
      desc: 'Tears on a rail',
      info: '+1 Fire rate · +2.5 Range · +0.16 Shot speed · Tears travel along a beam in front of you',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure', 'crane-game'],
      tags: ['tears', 'range', 'offensive'],
      dlc: 'afterbirth',
      stats: { tears: 1, range: 80, shotSpeed: 0.16 },
      hooks: {
        // The rail is real: each tear remembers the axis it was fired along and
        // is pulled back onto the line through the player every tick, so the
        // whole stream slides sideways when the player moves.
        onTearFire: function (p, tear, ctx) {
          if (!tear) return
          var l = Math.sqrt((tear.vx || 0) * (tear.vx || 0) + (tear.vy || 0) * (tear.vy || 0))
          if (l < 0.001) {
            var a = aim(p)
            tear.tbAx = a.x
            tear.tbAy = a.y
          } else {
            tear.tbAx = tear.vx / l
            tear.tbAy = tear.vy / l
          }
        },
        onUpdate: function (p, dt, ctx) {
          var list = friendlyTears(ctx)
          for (var i = 0; i < list.length; i++) {
            var t = list[i]
            if (t.tbAx == null) continue
            var dx = t.x - p.x
            var dy = t.y - p.y
            var along = dx * t.tbAx + dy * t.tbAy
            t.x = p.x + t.tbAx * along
            t.y = p.y + t.tbAy * along
          }
        }
      }
    },

    // ---------------------------------------------------------------- 398
    {
      id: 'gods-flesh',
      num: 398,
      name: "God's Flesh",
      desc: 'Shrinking tears',
      info: '10% chance to shrink enemies; shrunken enemies are crushed when you walk over them',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure'],
      tags: ['tears', 'mushroom', 'offensive'],
      dlc: 'afterbirth',
      transform: 'fun-guy',
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (ctx.roll(0.1, 0.02, 1)) addFlag(tear, 'shrink')
        },
        onTearHit: function (p, tear, enemy, ctx) {
          // The engine has no shrink effect: mark the status and halve the body.
          if (!tear || !enemy || !tear.flags.has('shrink') || enemy.boss || enemy.shrunk) return
          enemy.shrunk = true
          enemy.r = (enemy.r || 22) * 0.5
          ctx.applyStatus(enemy, 'shrink', 120)
        },
        onUpdate: function (p, dt, ctx) {
          var list = livingList(ctx)
          var pr = p.r || IS.PLAYER_R
          for (var i = 0; i < list.length; i++) {
            var e = list[i]
            if (!e.status || !e.status.shrink || e.boss) continue
            var dx = e.x - p.x
            var dy = e.y - p.y
            var rr = (e.r || 22) + pr
            if (dx * dx + dy * dy > rr * rr) continue
            killIt(e, ctx)
            ctx.spawnEffect('burst', e.x, e.y, { colour: '#d8c8a0', n: 12 })
            ctx.sfx('poop-break')
          }
        }
      }
    },

    // ---------------------------------------------------------------- 399
    {
      id: 'maw-of-the-void',
      num: 399,
      name: 'Maw of the Void',
      desc: 'Black brimstone ring',
      info: 'Firing for 2.35 seconds releases a black brimstone ring dealing 30x damage over 2 seconds',
      kind: 'passive',
      quality: 3,
      pools: ['devil', 'greed-devil', 'ultra-secret'],
      tags: ['devil', 'brimstone', 'offensive'],
      dlc: 'afterbirth',
      transform: 'leviathan',
      hooks: {
        // APPROXIMATED: the ring fires when the charge completes rather than
        // when the fire button is released — see FILE-WIDE APPROXIMATIONS #1.
        onUpdate: function (p, dt, ctx) {
          var c = cache(p)
          if (!firing(p)) { c.mawT = 0; return }
          c.mawT = (c.mawT || 0) + dt
          if (c.mawT < 2.35) return
          c.mawT = 0
          var dmg = ((p.stats && p.stats.damage) || IS.BASE_DAMAGE) * 30
          brimstoneRing(ctx, p.x, p.y, 190, dmg, 2)
          ctx.shake(3, 0.2)
        }
      }
    },

    // ---------------------------------------------------------------- 400
    {
      id: 'spear-of-destiny',
      num: 400,
      name: 'Spear of Destiny',
      desc: 'Holy spear',
      info: 'Replaces tears with a spear held in front of you, dealing twice your damage and fearing enemies',
      kind: 'passive',
      quality: 3,
      pools: ['angel', 'greed-angel'],
      tags: ['angel', 'knife', 'offensive'],
      dlc: 'afterbirth',
      mult: { damage: 2 },
      flags: ['knife'],
      tearFlags: ['fear', 'piercing']
    }

,
    {
      id: "explosivo",
      num: 401,
      name: "Explosivo",
      desc: "25% chance to shoot sticky tears",
      info: "25% chance to shoot sticky tears · Sticky tears grow and explode after a few seconds, dealing Isaac's damage +60",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure"],
      tags: ["damage","offensive"],
      dlc: "afterbirth",
      hooks: referenceHooks("25% chance to shoot sticky tears · Sticky tears grow and explode after a few seconds, dealing Isaac's damage +60", false, "explosivo")
    },

    {
      id: "chaos",
      num: 402,
      name: "Chaos",
      desc: "All items are chosen from random item pools",
      info: "All items are chosen from random item pools · Spawns 1-6 random pickups",
      kind: 'passive',
      quality: 2,
      pools: ["shop","secret","greed-shop","greed-secret"],
      tags: [],
      dlc: "afterbirth",
      hooks: referenceHooks("All items are chosen from random item pools · Spawns 1-6 random pickups", false, "chaos")
    },

    {
      id: "spider-mod",
      num: 403,
      name: "Spider Mod",
      desc: "Displays tear damage and health bars of all enemies",
      info: "Displays tear damage and health bars of all enemies · Inflicts random status effects to enemies on contact · Randomly spawns batteries or blue spiders",
      kind: 'passive',
      quality: 2,
      pools: ["shop","greed-shop","crane-game","baby-shop"],
      tags: ["damage","offensive","spider"],
      dlc: "afterbirth",
      transform: "spider",
      hooks: referenceHooks("Displays tear damage and health bars of all enemies · Inflicts random status effects to enemies on contact · Randomly spawns batteries or blue spiders", false, "spider-mod")
    },

    {
      id: "farting-baby",
      num: 404,
      name: "Farting Baby",
      desc: "Blocks projectiles",
      info: "Blocks projectiles · When hit, 10% chance to fart and charm, poison or knockback enemies · The farts deal 5-6 damage",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","baby-shop"],
      tags: ["damage"],
      dlc: "afterbirth",
      transform: "conjoined",
      hooks: referenceHooks("Blocks projectiles · When hit, 10% chance to fart and charm, poison or knockback enemies · The farts deal 5-6 damage", false, "farting-baby")
    },

    {
      id: "gb-bug",
      num: 405,
      name: "GB Bug",
      desc: "Throwable (double-tap shoot)",
      info: "Throwable (double-tap shoot) · Rerolls enemies and pickups it comes in contact with",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","secret","greed-shop","greed-secret"],
      tags: [],
      dlc: "afterbirth",
      hooks: referenceHooks("Throwable (double-tap shoot) · Rerolls enemies and pickups it comes in contact with", false, "gb-bug")
    },

    {
      id: "d8",
      num: 406,
      name: "D8",
      desc: "Multiplies Isaac's damage, tears, range and speed stats by between x0.5 and x2",
      info: "Multiplies Isaac's damage, tears, range and speed stats by between x0.5 and x2 · The multipliers are rerolled each use",
      kind: 'active',
      quality: 2,
      pools: ["treasure","greed-shop","crane-game"],
      tags: ["damage","offensive"],
      dlc: "afterbirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Multiplies Isaac's damage, tears, range and speed stats by between x0.5 and x2 · The multipliers are rerolled each use", true, "d8")
    },

    {
      id: "purity",
      num: 407,
      name: "Purity",
      desc: "↑ Boosts one of Isaac's stats depending on the color of the aura",
      info: "↑ Boosts one of Isaac's stats depending on the color of the aura · Taking damage removes the effect, and grants a new effect in the next room · Yellow = ↑ +0.5 Speed · Blue = ↑ +2 Fire rate · Red = ↑ +4 Damage · Orange = ↑ +3 Range",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure","greed-angel"],
      tags: ["damage"],
      dlc: "afterbirth",
      hooks: referenceHooks("↑ Boosts one of Isaac's stats depending on the color of the aura · Taking damage removes the effect, and grants a new effect in the next room · Yellow = ↑ +0.5 Speed · Blue = ↑ +2 Fire rate · Red = ↑ +4 Damage · Orange = ↑ +3 Range", false, "purity")
    },

    {
      id: "athame",
      num: 408,
      name: "Athame",
      desc: "25% chance for a black brimstone ring to spawn around killed enemies",
      info: "25% chance for a black brimstone ring to spawn around killed enemies · It deals 30x Isaac's damage over 2 seconds · +2.5% chance per luck",
      kind: 'passive',
      quality: 2,
      pools: ["devil","curse","greed-curse","greed-devil"],
      tags: ["damage"],
      dlc: "afterbirth",
      hooks: referenceHooks("25% chance for a black brimstone ring to spawn around killed enemies · It deals 30x Isaac's damage over 2 seconds · +2.5% chance per luck", false, "athame")
    },

    {
      id: "empty-vessel",
      num: 409,
      name: "Empty Vessel",
      desc: "+2 Black Hearts",
      info: "+2 Black Hearts · When Isaac has no Red Hearts: · Flight · Every 40 seconds while in a hostile room, gain a shield for 10 seconds",
      kind: 'passive',
      quality: 2,
      pools: ["devil","demon-beggar","greed-devil"],
      tags: ["hearts"],
      dlc: "afterbirth",
      grant: {"black":4},
      hooks: referenceHooks("+2 Black Hearts · When Isaac has no Red Hearts: · Flight · Every 40 seconds while in a hostile room, gain a shield for 10 seconds", false, "empty-vessel")
    },

    {
      id: "evil-eye",
      num: 410,
      name: "Evil Eye",
      desc: "3.33% chance to shoot an eye",
      info: "3.33% chance to shoot an eye · 10% chance at 20 luck · The eye moves in a straight line and shoots tears in the same direction as Isaac",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure"],
      tags: ["offensive"],
      dlc: "afterbirth",
      hooks: referenceHooks("3.33% chance to shoot an eye · 10% chance at 20 luck · The eye moves in a straight line and shoots tears in the same direction as Isaac", false, "evil-eye")
    },

    {
      id: "lusty-blood",
      num: 411,
      name: "Lusty Blood",
      desc: "↑ +0.5 Damage for each enemy killed in the room",
      info: "↑ +0.5 Damage for each enemy killed in the room · Caps at +5 Damage after 10 kills",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","devil","greed-treasure","greed-devil","ultra-secret"],
      tags: ["damage"],
      dlc: "afterbirth",
      hooks: referenceHooks("↑ +0.5 Damage for each enemy killed in the room · Caps at +5 Damage after 10 kills", false, "lusty-blood")
    },

    {
      id: "cambion-conception",
      num: 412,
      name: "Cambion Conception",
      desc: "Taking damage 15 times spawns a permanent demon familiar",
      info: "Taking damage 15 times spawns a permanent demon familiar · After two familiars, it takes 30 instead of 15 · Caps at 4 familiars",
      kind: 'passive',
      quality: 2,
      pools: ["devil","greed-devil","ultra-secret"],
      tags: ["damage","familiar"],
      dlc: "afterbirth",
      hooks: referenceHooks("Taking damage 15 times spawns a permanent demon familiar · After two familiars, it takes 30 instead of 15 · Caps at 4 familiars", false, "cambion-conception")
    },

    {
      id: "immaculate-conception",
      num: 413,
      name: "Immaculate Conception",
      desc: "Picking up 15 hearts spawns a permanent angelic familiar and a Soul Heart",
      info: "Picking up 15 hearts spawns a permanent angelic familiar and a Soul Heart · Caps at 5 familiars",
      kind: 'passive',
      quality: 2,
      pools: ["angel","greed-angel"],
      tags: ["hearts","angel","familiar"],
      dlc: "afterbirth",
      hooks: referenceHooks("Picking up 15 hearts spawns a permanent angelic familiar and a Soul Heart · Caps at 5 familiars", false, "immaculate-conception")
    },

    {
      id: "more-options",
      num: 414,
      name: "More Options",
      desc: "Allows Isaac to choose between 2 items in treasure rooms",
      info: "Allows Isaac to choose between 2 items in treasure rooms",
      kind: 'passive',
      quality: 2,
      pools: ["shop"],
      tags: [],
      dlc: "afterbirth",
      hooks: referenceHooks("Allows Isaac to choose between 2 items in treasure rooms", false, "more-options")
    },

    {
      id: "crown-of-light",
      num: 415,
      name: "Crown Of Light",
      desc: "+2 Soul Hearts",
      info: "+2 Soul Hearts · If Isaac has no damaged heart containers: · ↑ x2 Damage multiplier · ↓ -0.3 Shot speed · Taking any damage removes the effect for the room",
      kind: 'passive',
      quality: 2,
      pools: ["angel","greed-angel"],
      tags: ["damage","hearts"],
      dlc: "afterbirth",
      grant: {"soul":4},
      hooks: referenceHooks("+2 Soul Hearts · If Isaac has no damaged heart containers: · ↑ x2 Damage multiplier · ↓ -0.3 Shot speed · Taking any damage removes the effect for the room", false, "crown-of-light")
    },

    {
      id: "deep-pockets",
      num: 416,
      name: "Deep Pockets",
      desc: "If clearing a room would yield no reward, spawns 1-3 coins",
      info: "If clearing a room would yield no reward, spawns 1-3 coins · Increases the coin cap to 999",
      kind: 'passive',
      quality: 2,
      pools: ["shop","greed-treasure","greed-shop"],
      tags: ["coins"],
      dlc: "afterbirth",
      hooks: referenceHooks("If clearing a room would yield no reward, spawns 1-3 coins · Increases the coin cap to 999", false, "deep-pockets")
    },

    {
      id: "succubus",
      num: 417,
      name: "Succubus",
      desc: "Bounces around the room surrounded by a damaging aura that deals 7.5-10 damage per second",
      info: "Bounces around the room surrounded by a damaging aura that deals 7.5-10 damage per second · ↑ x1.5 Damage multiplier while standing in the aura",
      kind: 'passive',
      quality: 2,
      pools: ["devil","baby-shop"],
      tags: ["damage"],
      dlc: "afterbirth",
      hooks: referenceHooks("Bounces around the room surrounded by a damaging aura that deals 7.5-10 damage per second · ↑ x1.5 Damage multiplier while standing in the aura", false, "succubus")
    },

    {
      id: "fruit-cake",
      num: 418,
      name: "Fruit Cake",
      desc: "Each one of Isaac's tears gets a different effect",
      info: "Each one of Isaac's tears gets a different effect",
      kind: 'passive',
      quality: 2,
      pools: ["treasure"],
      tags: ["offensive"],
      dlc: "afterbirth",
      hooks: referenceHooks("Each one of Isaac's tears gets a different effect", false, "fruit-cake")
    },

    {
      id: "teleport-2-0",
      num: 419,
      name: "Teleport 2.0",
      desc: "Teleports Isaac to a room that has not been cleared yet",
      info: "Teleports Isaac to a room that has not been cleared yet · Hierarchy: >>>>>>>> >>>>>>>",
      kind: 'active',
      quality: 2,
      pools: ["treasure","crane-game"],
      tags: [],
      dlc: "afterbirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Teleports Isaac to a room that has not been cleared yet · Hierarchy: >>>>>>>> >>>>>>>", true, "teleport-2-0")
    },

    {
      id: "black-powder",
      num: 420,
      name: "Black Powder",
      desc: "Walking in a circle draws a pentagram on the floor, which deals 130 damage over 4 seconds",
      info: "Walking in a circle draws a pentagram on the floor, which deals 130 damage over 4 seconds",
      kind: 'passive',
      quality: 2,
      pools: ["devil","demon-beggar","greed-devil"],
      tags: ["damage"],
      dlc: "afterbirth",
      hooks: referenceHooks("Walking in a circle draws a pentagram on the floor, which deals 130 damage over 4 seconds", false, "black-powder")
    },

    {
      id: "kidney-bean",
      num: 421,
      name: "Kidney Bean",
      desc: "Charms all enemies in close range",
      info: "Charms all enemies in close range",
      kind: 'active',
      quality: 2,
      pools: ["treasure","greed-treasure","ultra-secret"],
      tags: [],
      dlc: "afterbirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Charms all enemies in close range", true, "kidney-bean")
    },

    {
      id: "glowing-hourglass",
      num: 422,
      name: "Glowing Hourglass",
      desc: "Brings Isaac back to the previous room and reverses all actions done in the room the item was used in",
      info: "Brings Isaac back to the previous room and reverses all actions done in the room the item was used in · The rewind can be used three times per floor · Acts as The Hourglass when out of rewinds, which slows enemies down for 8 seconds",
      kind: 'active',
      quality: 2,
      pools: ["treasure","shop","crane-game"],
      tags: [],
      dlc: "afterbirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Brings Isaac back to the previous room and reverses all actions done in the room the item was used in · The rewind can be used three times per floor · Acts as The Hourglass when out of rewinds, which slows enemies down for 8 seconds", true, "glowing-hourglass")
    },

    {
      id: "circle-of-protection",
      num: 423,
      name: "Circle of Protection",
      desc: "Surrounds Isaac with a large halo that deals his damage on contact per second",
      info: "Surrounds Isaac with a large halo that deals his damage on contact per second · Chance to reflect enemy projectiles",
      kind: 'passive',
      quality: 2,
      pools: ["angel","greed-angel"],
      tags: ["damage"],
      dlc: "afterbirth",
      hooks: referenceHooks("Surrounds Isaac with a large halo that deals his damage on contact per second · Chance to reflect enemy projectiles", false, "circle-of-protection")
    },

    {
      id: "sack-head",
      num: 424,
      name: "Sack Head",
      desc: "Pickups have a chance to be replaced with a sack:",
      info: "Pickups have a chance to be replaced with a sack: · : 10%, : 20% · Spawns a sack",
      kind: 'passive',
      quality: 2,
      pools: ["shop","secret","greed-secret"],
      tags: [],
      dlc: "afterbirth",
      hooks: referenceHooks("Pickups have a chance to be replaced with a sack: · : 10%, : 20% · Spawns a sack", false, "sack-head")
    },

    {
      id: "night-light",
      num: 425,
      name: "Night Light",
      desc: "Spawns a slowing cone of light in front of Isaac",
      info: "Spawns a slowing cone of light in front of Isaac · Removes Curse of Darkness for the current floor",
      kind: 'passive',
      quality: 2,
      pools: ["shop","greed-treasure","crane-game"],
      tags: [],
      dlc: "afterbirth",
      hooks: referenceHooks("Spawns a slowing cone of light in front of Isaac · Removes Curse of Darkness for the current floor", false, "night-light")
    },

    {
      id: "obsessed-fan",
      num: 426,
      name: "Obsessed Fan",
      desc: "Mimics Isaac's movement on a 0.66 second delay",
      info: "Mimics Isaac's movement on a 0.66 second delay · Deals 30 contact damage per second",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","key-master","greed-treasure","baby-shop"],
      tags: ["damage"],
      dlc: "afterbirth",
      hooks: referenceHooks("Mimics Isaac's movement on a 0.66 second delay · Deals 30 contact damage per second", false, "obsessed-fan")
    },

    {
      id: "mine-crafter",
      num: 427,
      name: "Mine Crafter",
      desc: "Spawns a pushable TNT barrel",
      info: "Spawns a pushable TNT barrel · Using the item a second time in the same room remotely detonates the barrel",
      kind: 'active',
      quality: 2,
      pools: ["treasure","crane-game"],
      tags: [],
      dlc: "afterbirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Spawns a pushable TNT barrel · Using the item a second time in the same room remotely detonates the barrel", true, "mine-crafter")
    },

    {
      id: "pjs",
      num: 428,
      name: "PJs",
      desc: "Full health",
      info: "Full health · +4 Soul Hearts",
      kind: 'passive',
      quality: 2,
      pools: ["boss","golden-chest","greed-boss"],
      tags: ["hearts"],
      dlc: "afterbirth",
      grant: {"soul":8},
      hooks: referenceHooks("Full health · +4 Soul Hearts", false, "pjs")
    },

    {
      id: "head-of-the-keeper",
      num: 429,
      name: "Head of the Keeper",
      desc: "Hitting an enemy with a tear has a 5% chance to spawn a Penny",
      info: "Hitting an enemy with a tear has a 5% chance to spawn a Penny",
      kind: 'passive',
      quality: 2,
      pools: [],
      tags: ["offensive"],
      dlc: "afterbirth",
      hooks: referenceHooks("Hitting an enemy with a tear has a 5% chance to spawn a Penny", false, "head-of-the-keeper")
    },

    {
      id: "papa-fly",
      num: 430,
      name: "Papa Fly",
      desc: "Mimics Isaac's movement on a 0.66 second delay",
      info: "Mimics Isaac's movement on a 0.66 second delay · Shoots tears at nearby enemies that deal Isaac's damage",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","key-master","greed-treasure","baby-shop"],
      tags: ["damage","offensive"],
      dlc: "afterbirth",
      hooks: referenceHooks("Mimics Isaac's movement on a 0.66 second delay · Shoots tears at nearby enemies that deal Isaac's damage", false, "papa-fly")
    },

    {
      id: "multidimensional-baby",
      num: 431,
      name: "Multidimensional Baby",
      desc: "Mimics Isaac's movement on a 0.66 second delay",
      info: "Mimics Isaac's movement on a 0.66 second delay · Tears that pass through it are doubled and gain a range + shot speed boost",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","devil","greed-treasure","greed-devil"],
      tags: ["offensive"],
      dlc: "afterbirth",
      transform: "conjoined",
      hooks: referenceHooks("Mimics Isaac's movement on a 0.66 second delay · Tears that pass through it are doubled and gain a range + shot speed boost", false, "multidimensional-baby")
    },

    {
      id: "glitter-bombs",
      num: 432,
      name: "Glitter Bombs",
      desc: "+5 Bombs",
      info: "+5 Bombs · Bombs have a 63% chance to drop a random pickup and a 15% chance to charm enemies when they explode · The pickup spawn chance goes down by 1% for each spawn this floor",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure","bomb-bum"],
      tags: ["bombs"],
      dlc: "afterbirth",
      hooks: referenceHooks("+5 Bombs · Bombs have a 63% chance to drop a random pickup and a 15% chance to charm enemies when they explode · The pickup spawn chance goes down by 1% for each spawn this floor", false, "glitter-bombs")
    },

    {
      id: "my-shadow",
      num: 433,
      name: "My Shadow",
      desc: "A small shadow follows Isaac",
      info: "A small shadow follows Isaac · When an enemy touches the shadow a friendly black charger spawns for the room · The charger deals 8.7 damage per hit",
      kind: 'passive',
      quality: 2,
      pools: ["devil","greed-devil"],
      tags: ["damage"],
      dlc: "afterbirth",
      hooks: referenceHooks("A small shadow follows Isaac · When an enemy touches the shadow a friendly black charger spawns for the room · The charger deals 8.7 damage per hit", false, "my-shadow")
    },

    {
      id: "jar-of-flies",
      num: 434,
      name: "Jar of Flies",
      desc: "Killing an enemy adds a blue fly to the jar, up to 20 flies",
      info: "Killing an enemy adds a blue fly to the jar, up to 20 flies · Using the item releases all the flies",
      kind: 'active',
      quality: 2,
      pools: ["shop","greed-treasure","greed-shop"],
      tags: ["fly"],
      dlc: "afterbirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Killing an enemy adds a blue fly to the jar, up to 20 flies · Using the item releases all the flies", true, "jar-of-flies")
    },

    {
      id: "lil-loki",
      num: 435,
      name: "Lil Loki",
      desc: "Shoots 4 tears in a cross pattern",
      info: "Shoots 4 tears in a cross pattern · Deals 3.5 damage per tear",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","ultra-secret","baby-shop"],
      tags: ["damage","offensive"],
      dlc: "afterbirth",
      hooks: referenceHooks("Shoots 4 tears in a cross pattern · Deals 3.5 damage per tear", false, "lil-loki")
    },

    {
      id: "milk",
      num: 436,
      name: "Milk!",
      desc: "Taking damage grants a Tears up for the duration of the room",
      info: "Taking damage grants a Tears up for the duration of the room",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure"],
      tags: ["damage","offensive"],
      dlc: "afterbirth",
      hooks: referenceHooks("Taking damage grants a Tears up for the duration of the room", false, "milk")
    },

    {
      id: "d7",
      num: 437,
      name: "D7",
      desc: "Restarts a room and respawns all enemies",
      info: "Restarts a room and respawns all enemies · Can be used to get multiple room clear rewards from a single room",
      kind: 'active',
      quality: 2,
      pools: ["treasure","crane-game"],
      tags: [],
      dlc: "afterbirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Restarts a room and respawns all enemies · Can be used to get multiple room clear rewards from a single room", true, "d7")
    },

    {
      id: "binky",
      num: 438,
      name: "Binky",
      desc: "↑ +0.75 Tears",
      info: "↑ +0.75 Tears · ↑ Size down · +1 Soul Heart",
      kind: 'passive',
      quality: 2,
      pools: ["boss","golden-chest","greed-boss","crane-game"],
      tags: ["offensive","hearts"],
      dlc: "afterbirth",
      stats: {"tears":0.77},
      grant: {"soul":2},
      hooks: referenceHooks("↑ +0.75 Tears · ↑ Size down · +1 Soul Heart", false, "binky")
    },

    {
      id: "moms-box",
      num: 439,
      name: "Mom's Box",
      desc: "Spawns a random trinket",
      info: "Spawns a random trinket · While held: · ↑ +1 Luck · Doubles trinket effects",
      kind: 'active',
      quality: 2,
      pools: ["shop","moms-chest","greed-shop","crane-game","old-chest","wooden-chest"],
      tags: [],
      dlc: "afterbirth",
      charge: 6,
      chargeType: 'normal',
      stats: {"luck":1},
      transform: "mom",
      hooks: referenceHooks("Spawns a random trinket · While held: · ↑ +1 Luck · Doubles trinket effects", true, "moms-box")
    },

    {
      id: "kidney-stone",
      num: 440,
      name: "Kidney Stone",
      desc: "Isaac occasionally stops firing and charges an attack that releases a burst of tears and a kidney stone",
      info: "Isaac occasionally stops firing and charges an attack that releases a burst of tears and a kidney stone",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure"],
      tags: ["offensive"],
      dlc: "afterbirth",
      stats: {"range":80},
      hooks: referenceHooks("Isaac occasionally stops firing and charges an attack that releases a burst of tears and a kidney stone", false, "kidney-stone")
    },

    {
      id: "mega-blast",
      num: 441,
      name: "Mega Blast",
      desc: "Fires a huge Mega Satan blood beam for 15 seconds",
      info: "Fires a huge Mega Satan blood beam for 15 seconds · The beam persists between rooms and floors",
      kind: 'active',
      quality: 2,
      pools: ["devil","greed-devil"],
      tags: [],
      dlc: "afterbirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Fires a huge Mega Satan blood beam for 15 seconds · The beam persists between rooms and floors", true, "mega-blast")
    },

    {
      id: "dark-princes-crown",
      num: 442,
      name: "Dark Prince's Crown",
      desc: "While at 1 full Red Heart:",
      info: "While at 1 full Red Heart: · ↑ +2 Fire rate · ↑ +1.5 Range · ↑ +0.2 Shot speed",
      kind: 'passive',
      quality: 2,
      pools: ["devil","curse","greed-curse","greed-devil"],
      tags: ["hearts"],
      dlc: "afterbirth+",
      hooks: referenceHooks("While at 1 full Red Heart: · ↑ +2 Fire rate · ↑ +1.5 Range · ↑ +0.2 Shot speed", false, "dark-princes-crown")
    },

    {
      id: "apple",
      num: 443,
      name: "Apple!",
      desc: "↑ +0.3 Tears",
      info: "↑ +0.3 Tears · 6.66% chance to shoot razor blades that deal 4x Isaac's damage · 100% chance at 14 luck",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure","ultra-secret"],
      tags: ["damage","offensive"],
      dlc: "afterbirth+",
      stats: {"tears":0.3},
      hooks: referenceHooks("↑ +0.3 Tears · 6.66% chance to shoot razor blades that deal 4x Isaac's damage · 100% chance at 14 luck", false, "apple")
    },

    {
      id: "lead-pencil",
      num: 444,
      name: "Lead Pencil",
      desc: "Isaac shoots a cluster of tears every 15 tears",
      info: "Isaac shoots a cluster of tears every 15 tears",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","golden-chest","greed-treasure","crane-game"],
      tags: ["offensive"],
      dlc: "afterbirth+",
      hooks: referenceHooks("Isaac shoots a cluster of tears every 15 tears", false, "lead-pencil")
    },

    {
      id: "dog-tooth",
      num: 445,
      name: "Dog Tooth",
      desc: "↑ +0.1 Speed",
      info: "↑ +0.1 Speed · ↑ +0.3 Damage · A wolf howls in rooms adjacent to a Secret/Super Secret Room · A dog barks in rooms with a crawlspace under a rock",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure"],
      tags: ["damage"],
      dlc: "afterbirth+",
      stats: {"damage":0.3,"speed":0.1},
      hooks: referenceHooks("↑ +0.1 Speed · ↑ +0.3 Damage · A wolf howls in rooms adjacent to a Secret/Super Secret Room · A dog barks in rooms with a crawlspace under a rock", false, "dog-tooth")
    },

    {
      id: "dead-tooth",
      num: 446,
      name: "Dead Tooth",
      desc: "While firing, Isaac is surrounded by a green aura that poisons enemies",
      info: "While firing, Isaac is surrounded by a green aura that poisons enemies",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure"],
      tags: [],
      dlc: "afterbirth+",
      hooks: referenceHooks("While firing, Isaac is surrounded by a green aura that poisons enemies", false, "dead-tooth")
    },

    {
      id: "linger-bean",
      num: 447,
      name: "Linger Bean",
      desc: "Firing without pause for 7.5 seconds spawns a poop cloud",
      info: "Firing without pause for 7.5 seconds spawns a poop cloud · The cloud deals Isaac's damage 5 times a second · The cloud lasts 15 seconds and can be moved by shooting it",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","beggar","greed-treasure"],
      tags: ["damage"],
      dlc: "afterbirth+",
      hooks: referenceHooks("Firing without pause for 7.5 seconds spawns a poop cloud · The cloud deals Isaac's damage 5 times a second · The cloud lasts 15 seconds and can be moved by shooting it", false, "linger-bean")
    },

    {
      id: "shard-of-glass",
      num: 448,
      name: "Shard of Glass",
      desc: "Upon taking damage:",
      info: "Upon taking damage: · 25% chance to spawn a Red Heart · Isaac bleeds, spewing tears in the direction he is shooting · The bleeding does half a Red Heart of damage every 20 seconds · The bleeding stops if a Red Heart is healed, all Red Hearts are empty, or the next damage would kill Isaac",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure"],
      tags: ["damage","offensive","hearts"],
      dlc: "afterbirth+",
      hooks: referenceHooks("Upon taking damage: · 25% chance to spawn a Red Heart · Isaac bleeds, spewing tears in the direction he is shooting · The bleeding does half a Red Heart of damage every 20 seconds · The bleeding stops if a Red Heart is healed, all Red Hearts are empty, or the next damage would kill Isaac", false, "shard-of-glass")
    },

    {
      id: "metal-plate",
      num: 449,
      name: "Metal Plate",
      desc: "+1 Soul Heart",
      info: "+1 Soul Heart · Enemy bullets have a 25% chance to be reflected as concussive tears",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure"],
      tags: ["offensive","hearts"],
      dlc: "repentance",
      grant: {"soul":2},
      hooks: referenceHooks("+1 Soul Heart · Enemy bullets have a 25% chance to be reflected as concussive tears", false, "metal-plate")
    },

    {
      id: "eye-of-greed",
      num: 450,
      name: "Eye of Greed",
      desc: "Every 20 tears, Isaac shoots a coin tear that deals x1.5 +10 damage",
      info: "Every 20 tears, Isaac shoots a coin tear that deals x1.5 +10 damage · Enemies hit with the coin get petrified and turn into gold · Killing a gold enemy drops 1-3 coins · Firing a coin tear costs 1 coin",
      kind: 'passive',
      quality: 2,
      pools: ["secret","greed-treasure","greed-secret"],
      tags: ["damage","offensive","coins"],
      dlc: "afterbirth+",
      hooks: referenceHooks("Every 20 tears, Isaac shoots a coin tear that deals x1.5 +10 damage · Enemies hit with the coin get petrified and turn into gold · Killing a gold enemy drops 1-3 coins · Firing a coin tear costs 1 coin", false, "eye-of-greed")
    },

    {
      id: "tarot-cloth",
      num: 451,
      name: "Tarot Cloth",
      desc: "Spawns a card",
      info: "Spawns a card · Tarot card effects are doubled or enhanced",
      kind: 'passive',
      quality: 2,
      pools: ["shop","curse","greed-shop","greed-curse","greed-devil","crane-game"],
      tags: [],
      dlc: "afterbirth+",
      hooks: referenceHooks("Spawns a card · Tarot card effects are doubled or enhanced", false, "tarot-cloth")
    },

    {
      id: "varicose-veins",
      num: 452,
      name: "Varicose Veins",
      desc: "Taking damage shoots 10 tears in a circle around Isaac",
      info: "Taking damage shoots 10 tears in a circle around Isaac · The tears deal Isaac's damage + 25 · 20% chance to activate the Anemic effect for 2 seconds",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure","ultra-secret"],
      tags: ["damage","offensive"],
      dlc: "afterbirth+",
      hooks: referenceHooks("Taking damage shoots 10 tears in a circle around Isaac · The tears deal Isaac's damage + 25 · 20% chance to activate the Anemic effect for 2 seconds", false, "varicose-veins")
    },

    {
      id: "compound-fracture",
      num: 453,
      name: "Compound Fracture",
      desc: "↑ +1.5 Range",
      info: "↑ +1.5 Range · Tears shatter into 1-3 bone shards upon hitting anything",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure"],
      tags: ["offensive"],
      dlc: "afterbirth+",
      stats: {"range":15.2},
      hooks: referenceHooks("↑ +1.5 Range · Tears shatter into 1-3 bone shards upon hitting anything", false, "compound-fracture")
    },

    {
      id: "polydactyly",
      num: 454,
      name: "Polydactyly",
      desc: "Spawns a rune, card or pill on pickup",
      info: "Spawns a rune, card or pill on pickup · Allows Isaac to carry 2 runes/cards/pills",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure"],
      tags: [],
      dlc: "afterbirth+",
      hooks: referenceHooks("Spawns a rune, card or pill on pickup · Allows Isaac to carry 2 runes/cards/pills", false, "polydactyly")
    },

    {
      id: "dads-lost-coin",
      num: 455,
      name: "Dad's Lost Coin",
      desc: "↑ +2.5 Range",
      info: "↑ +2.5 Range · Spawns a Lucky Penny",
      kind: 'passive',
      quality: 2,
      pools: ["boss","golden-chest","beggar","greed-boss","old-chest"],
      tags: [],
      dlc: "afterbirth+",
      stats: {"range":15.2},
      hooks: referenceHooks("↑ +2.5 Range · Spawns a Lucky Penny", false, "dads-lost-coin")
    },

    {
      id: "midnight-snack",
      num: 456,
      name: "Midnight Snack",
      desc: "↑ +1 Health",
      info: "↑ +1 Health · Heals 1 heart",
      kind: 'passive',
      quality: 2,
      pools: ["boss","golden-chest","beggar","greed-boss"],
      tags: ["hearts"],
      dlc: "afterbirth+",
      grant: {"maxHearts":2},
      hooks: referenceHooks("↑ +1 Health · Heals 1 heart", false, "midnight-snack")
    },

    {
      id: "cone-head",
      num: 457,
      name: "Cone Head",
      desc: "+1 Soul Heart",
      info: "+1 Soul Heart · 20% chance to negate damage taken",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure"],
      tags: ["damage","hearts"],
      dlc: "afterbirth+",
      grant: {"soul":2},
      hooks: referenceHooks("+1 Soul Heart · 20% chance to negate damage taken", false, "cone-head")
    },

    {
      id: "belly-button",
      num: 458,
      name: "Belly Button",
      desc: "Allows Isaac to carry 2 trinkets",
      info: "Allows Isaac to carry 2 trinkets · Spawns a random trinket",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure"],
      tags: [],
      dlc: "afterbirth+",
      hooks: referenceHooks("Allows Isaac to carry 2 trinkets · Spawns a random trinket", false, "belly-button")
    },

    {
      id: "sinus-infection",
      num: 459,
      name: "Sinus Infection",
      desc: "20% chance to shoot a sticky booger",
      info: "20% chance to shoot a sticky booger · Boogers deal Isaac's damage once a second and stick for 10 seconds · Not affected by luck",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure"],
      tags: ["damage"],
      dlc: "afterbirth+",
      hooks: referenceHooks("20% chance to shoot a sticky booger · Boogers deal Isaac's damage once a second and stick for 10 seconds · Not affected by luck", false, "sinus-infection")
    },

    {
      id: "glaucoma",
      num: 460,
      name: "Glaucoma",
      desc: "5% chance to shoot concussive tears",
      info: "5% chance to shoot concussive tears · Makes the screen slightly darker",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure"],
      tags: ["offensive"],
      dlc: "afterbirth+",
      hooks: referenceHooks("5% chance to shoot concussive tears · Makes the screen slightly darker", false, "glaucoma")
    }

  ])

  // Fields that are not hooks: familiars, stat and grant corrections.
  var PATCH = {
    continuum: { stats: { range: 96 } },
    marked: { stats: { tears: 0.72, range: 96 } },
    binky: { mult: { tearSize: 0.9 } },
    'dads-lost-coin': { stats: { range: 80 } },
    'compound-fracture': { stats: { range: 48 } },
    'jar-of-flies': { charge: 0 },
    'farting-baby': { familiars: ['farting-baby'] },
    'gb-bug': { familiars: ['gb-bug'] },
    succubus: { familiars: ['succubus'] },
    'obsessed-fan': { familiars: ['obsessed-fan'] },
    'papa-fly': { familiars: ['papa-fly'] },
    'multidimensional-baby': { familiars: ['multidimensional-baby'] },
    'my-shadow': { familiars: ['my-shadow'] },
    'lil-loki': { familiars: ['lil-loki'] }
  }
  Object.keys(PATCH).forEach(function (id) {
    var d = IS.itemsById && IS.itemsById[id]
    if (d) for (var k in PATCH[id]) d[k] = PATCH[id][k]
  })

  // Bumbo's level from the coins it has eaten (6 / 12 / 24).
  function bumboLevel (coins) {
    if (coins >= 24) return 4
    if (coins >= 12) return 3
    if (coins >= 6) return 2
    return 1
  }

  IS.defineFamiliars([
    { id: 'charged-baby', name: 'Charged Baby', sprite: 'charged-baby', behaviour: 'follower', params: { r: 16, speed: 320, flying: true, hp: 0, blockShots: false, life: 0 } },
    { id: 'lil-gurdy', name: 'Lil Gurdy', sprite: 'lil-gurdy', behaviour: 'chaser', params: { r: 22, speed: 440, flying: false, dmg: 8, range: 1000, cooldown: 0.35, hp: 0, blockShots: true, life: 0 } },
    { id: 'bumbo', name: 'Bumbo', sprite: 'bumbo', behaviour: 'collector', params: { r: 22, speed: 300, flying: false, dmg: 4, range: 700, cooldown: 0.5, hp: 0, blockShots: false, life: 0 } },
    { id: 'censer', name: 'Censer', sprite: 'censer', behaviour: 'buffer', params: { r: 20, speed: 300, flying: true, dmg: 0, hp: 0, blockShots: false, life: 0 } },
    { id: 'key-bum', name: 'Key Bum', sprite: 'key-bum', behaviour: 'collector', params: { r: 18, speed: 315, flying: false, dmg: 0, collects: ['key'], range: 700, cooldown: 0.5, hp: 0, blockShots: false, life: 0 } },
    { id: 'farting-baby', name: 'Farting Baby', sprite: 'farting-baby', behaviour: 'follower', params: { r: 16, speed: 300, flying: true, hp: 0, blockShots: true } },
    { id: 'gb-bug', name: 'GB Bug', sprite: 'gb-bug', behaviour: 'wanderer', params: { r: 14, speed: 160, flying: true, hp: 0 } },
    { id: 'cambion-conception', name: 'Demon Baby', sprite: 'cambion-conception', behaviour: 'follower', params: { r: 16, speed: 320, flying: true, dmg: 3.5, fireDelay: 0.5, range: 520, hp: 0 } },
    { id: 'immaculate-conception', name: 'Angelic Baby', sprite: 'immaculate-conception', behaviour: 'follower', params: { r: 16, speed: 320, flying: true, dmg: 3.5, fireDelay: 0.5, range: 520, hp: 0 } },
    { id: 'succubus', name: 'Succubus', sprite: 'succubus', behaviour: 'wanderer', params: { r: 20, speed: 240, flying: true, hp: 0 } },
    { id: 'obsessed-fan', name: 'Obsessed Fan', sprite: 'obsessed-fan', behaviour: 'copycat', params: { r: 16, speed: 0, flying: true, hp: 0 } },
    { id: 'papa-fly', name: 'Papa Fly', sprite: 'papa-fly', behaviour: 'copycat', params: { r: 16, speed: 0, flying: true, hp: 0 } },
    { id: 'multidimensional-baby', name: 'Multidimensional Baby', sprite: 'multidimensional-baby', behaviour: 'copycat', params: { r: 18, speed: 0, flying: true, hp: 0 } },
    { id: 'my-shadow', name: 'My Shadow', sprite: 'my-shadow', behaviour: 'follower', params: { r: 12, speed: 340, flying: true, hp: 0 } },
    { id: 'lil-loki', name: 'Lil Loki', sprite: 'lil-loki', behaviour: 'follower', params: { r: 16, speed: 320, flying: true, hp: 0 } },
    { id: 'seraphim', name: 'Seraphim', sprite: 'seraphim', behaviour: 'follower', params: { r: 18, speed: 325, flying: true, dmg: 10, fireDelay: 1.1, range: 560, tearFlags: ['homing'], hp: 0, blockShots: false, life: 0 } }
  ])

})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
