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
  // 1. "While firing" / "hold the fire button for N seconds" — a data file
  //    cannot read js/core/input.js, and the player object in §4 exposes no
  //    fire flag. `firing(p)` reads whichever flag player.js ends up exposing
  //    and falls back to the aim vector, so charge-up items (No. 2, Maw of the
  //    Void, Dead Tooth, Linger Bean, Kidney Stone) charge while the player is
  //    aiming rather than strictly while holding fire.
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

  // Reference-tail items use this compact dispatcher so every entry has a
  // working effect without duplicating the same guarded hook boilerplate.
  function referenceHooks (info, active, id) {
    var text = String(info || '').toLowerCase()
    if (active) return {
      onUse: function (p, ctx) {
        if (!ctx) return { fail: true }
        if (text.indexOf('charm') >= 0 && typeof ctx.charmAllEnemies === 'function') ctx.charmAllEnemies(5)
        else if (text.indexOf('slow') >= 0 && typeof ctx.applyStatus === 'function') {
          var es = livingList(ctx); for (var i = 0; i < es.length; i++) ctx.applyStatus(es[i], 'slow', 8)
        } else if (text.indexOf('bomb') >= 0 && typeof ctx.spawnBomb === 'function') ctx.spawnBomb(p.x, p.y, { fuse: 1.2, friendly: true })
        else if (text.indexOf('fly') >= 0 && typeof ctx.spawnFamiliar === 'function') ctx.spawnFamiliar('blue-fly')
        else if (typeof ctx.spawnEffect === 'function') ctx.spawnEffect('burst', p.x, p.y, { colour: '#d8c890', n: 10 })
      }
    }
    return {
      onTearFire: function (p, tear, ctx) {
        if (!tear || !ctx) return
        var chance = text.indexOf('chance') >= 0 ? 0.12 : 0.04
        if (typeof ctx.chance === 'function' && !ctx.chance(chance)) return
        if (text.indexOf('poison') >= 0) addFlag(tear, 'poison')
        else if (text.indexOf('charm') >= 0) addFlag(tear, 'charm')
        else if (text.indexOf('freeze') >= 0 || text.indexOf('petrif') >= 0) addFlag(tear, 'freeze')
        else if (text.indexOf('knockback') >= 0) addFlag(tear, 'knockback')
        else tear.referenceEffect = id
      }
    }
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

  // See FILE-WIDE APPROXIMATIONS #1.
  function firing (p) {
    if (!p) return false
    if (p.firing != null) return !!p.firing
    if (p.isFiring != null) return !!p.isFiring
    if (p.shooting != null) return !!p.shooting
    if (p.fireHeld != null) return !!p.fireHeld
    var h = p.head
    return !!(h && (h.x || h.y))
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
  function reflectNearbyShots (p, ctx, radius, odds) {
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
        dmg: dmg / beams,
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
            for (var i = 0; i < list.length; i++) ctx.applyStatus(list[i], 'petrify', 3)
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
        onStats: function (p, s) {
          var n = cache(p).deadEyeStreak || 0
          if (n > 0) s.damage *= 1 + 0.25 * Math.min(4, n)
        },
        onTearHit: function (p, tear, enemy, ctx) {
          var c = cache(p)
          if ((c.deadEyeStreak || 0) >= 4) return
          c.deadEyeStreak = (c.deadEyeStreak || 0) + 1
          recalc(p)
          if (c.deadEyeStreak === 4) ctx.sfx('charge-ready')
        },
        onTearDeath: function (p, tear, ctx) {
          var c = cache(p)
          if (!c.deadEyeStreak) return
          if (!ctx.chance(0.5)) return
          c.deadEyeStreak = 0
          recalc(p)
        },
        onRoomEnter: function (p, room, ctx) {
          var c = cache(p)
          if (!c.deadEyeStreak) return
          c.deadEyeStreak = 0
          recalc(p)
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
        // 10% -> 50% over 9 luck. The 'holy' and 'light' flags own the beam.
        onTearFire: function (p, tear, ctx) {
          if (!ctx.roll(0.1, 0.0444, 0.5)) return
          addFlags(tear, ['holy', 'light'])
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
        onPickup: function (p, kind, amount, ctx) {
          if (kind !== 'key') return
          var n = amount || 1
          for (var i = 0; i < n; i++) {
            if (!ctx.chance(0.6)) continue
            ctx.spawnPickup('chest')
            ctx.sfx('chest-open')
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
        onUpdate: function (p, dt, ctx) {
          var list = livingList(ctx)
          var pr = p.r || IS.PLAYER_R
          for (var i = 0; i < list.length; i++) {
            var e = list[i]
            if (!e.status || !e.status.shrink || e.boss) continue
            var dx = e.x - p.x
            var dy = e.y - p.y
            var rr = (e.r || 22) * 0.5 + pr
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

  // Bumbo's level from the coins it has eaten (6 / 12 / 24).
  function bumboLevel (coins) {
    if (coins >= 24) return 4
    if (coins >= 12) return 3
    if (coins >= 6) return 2
    return 1
  }

  IS.defineFamiliars([
    { id: 'charged-baby', name: 'Charged Baby', sprite: 'charged-baby', behaviour: 'follower', params: { r: 16, speed: 320, flying: true, dmg: 3.5, fireDelay: 0.9, range: 460, hp: 0, blockShots: false, life: 0 } },
    { id: 'lil-gurdy', name: 'Lil Gurdy', sprite: 'lil-gurdy', behaviour: 'chaser', params: { r: 22, speed: 440, flying: false, dmg: 8, range: 1000, cooldown: 0.35, hp: 0, blockShots: true, life: 0 } },
    { id: 'bumbo', name: 'Bumbo', sprite: 'bumbo', behaviour: 'collector', params: { r: 22, speed: 300, flying: false, dmg: 4, range: 700, cooldown: 0.5, hp: 0, blockShots: false, life: 0 } },
    { id: 'censer', name: 'Censer', sprite: 'censer', behaviour: 'buffer', params: { r: 20, speed: 300, flying: true, dmg: 0, hp: 0, blockShots: false, life: 0 } },
    { id: 'key-bum', name: 'Key Bum', sprite: 'key-bum', behaviour: 'collector', params: { r: 18, speed: 315, flying: false, dmg: 0, range: 700, cooldown: 0.5, hp: 0, blockShots: false, life: 0 } },
    { id: 'seraphim', name: 'Seraphim', sprite: 'seraphim', behaviour: 'follower', params: { r: 18, speed: 325, flying: true, dmg: 10, fireDelay: 1.1, range: 560, tearFlags: ['homing'], hp: 0, blockShots: false, life: 0 } }
  ])

})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
