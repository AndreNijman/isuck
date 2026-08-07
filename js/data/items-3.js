;(function (IS) {
  'use strict'

  // ---------------------------------------------------------------------------
  // ISUCK — collectibles 185…276 (Dead Dove … Isaac's Heart).
  //
  // Schema: ARCHITECTURE.md §5.1. Hook vocabulary: §5.2. Everything a hook
  // reaches for comes off `ctx` (§9) or the IS.* surface in docs/ENGINE-API.md.
  //
  // Two rules this file is built around:
  //
  //  1. `ctx.room` is NOT guaranteed. tools/validate-content.mjs pokes every
  //     item on a dummy run that has no room, and calls onRoomEnter/onNewFloor
  //     with a null room/floor. Every hook that spawns anything or walks
  //     room.tears / room.shots / room.pickups goes through room(ctx) first and
  //     bails when there is nothing to spawn into.
  //  2. A familiar def's `params` object is shared by every instance of that
  //     familiar. Hooks that scale a live familiar only ever write instance
  //     fields (f.dmg / f.r / f.scale) behind a one-shot marker, never params.
  //
  // Item-owned familiars are defined at the bottom of this file with the same
  // id as the item that grants them, so the sprite phase can register one draw
  // function per id. The params contract is the one documented in
  // js/data/familiars.js.
  // ---------------------------------------------------------------------------

  // --- local helpers (never leak: everything lives in this IIFE) -------------

  function cache (p) {
    if (!p) return {}
    if (!p.cache) p.cache = {}
    return p.cache
  }

  function room (ctx) { return (ctx && ctx.room) || null }

  function fn (o, k) { return !!(o && typeof o[k] === 'function') }

  function living (ctx) {
    if (!fn(ctx, 'livingEnemies')) return []
    var l = ctx.livingEnemies()
    return Array.isArray(l) ? l : []
  }

  function dist (ax, ay, bx, by) {
    var dx = (ax || 0) - (bx || 0)
    var dy = (ay || 0) - (by || 0)
    return Math.sqrt(dx * dx + dy * dy)
  }

  function roll (ctx, base, perLuck, cap) {
    return fn(ctx, 'roll') ? !!ctx.roll(base, perLuck, cap) : false
  }

  function chance (ctx, pr) { return fn(ctx, 'chance') ? !!ctx.chance(pr) : false }

  function intOf (ctx, n) {
    if (!(n > 0)) return 0
    return fn(ctx, 'int') ? ctx.int(n) : 0
  }

  function rangeOf (ctx, a, b) {
    return fn(ctx, 'range') ? ctx.range(a, b) : (a + b) / 2
  }

  function pickOf (ctx, arr) {
    if (!Array.isArray(arr) || !arr.length) return null
    return fn(ctx, 'pick') ? ctx.pick(arr) : arr[0]
  }

  function sfx (ctx, name) { if (fn(ctx, 'sfx')) ctx.sfx(name) }

  // Tear flags are a Set at runtime (§5.3) but tolerate an array or nothing.
  function addTearFlag (tear, flag) {
    if (!tear) return
    if (tear.flags && typeof tear.flags.add === 'function') tear.flags.add(flag)
    else if (Array.isArray(tear.flags)) {
      if (tear.flags.indexOf(flag) < 0) tear.flags.push(flag)
    } else tear.flags = [flag]
  }

  function flagsOf (tear) {
    var out = []
    if (!tear || !tear.flags) return out
    if (Array.isArray(tear.flags)) return tear.flags.slice()
    if (typeof tear.flags.forEach === 'function') {
      tear.flags.forEach(function (f) { out.push(f) })
    }
    return out
  }

  // A spot next to the player, clamped inside the room. `i` fans several drops.
  function dropSpot (p, ctx, i) {
    var r = room(ctx)
    var x = (p && typeof p.x === 'number') ? p.x : 520
    var y = (p && typeof p.y === 'number') ? p.y : 280
    if (i) {
      var a = i * 1.15
      x += Math.cos(a) * 58
      y += Math.sin(a) * 58
    }
    if (r) {
      x = Math.max(34, Math.min((r.pxW || 1040) - 34, x))
      y = Math.max(34, Math.min((r.pxH || 560) - 34, y))
    }
    return { x: x, y: y }
  }

  function drop (p, ctx, kind, i, opts) {
    if (!room(ctx) || !fn(ctx, 'spawnPickup')) return false
    var s = dropSpot(p, ctx, i)
    ctx.spawnPickup(kind, s.x, s.y, opts || {})
    return true
  }

  function hurtAll (p, ctx, dmg, status, secs) {
    var list = living(ctx)
    var n = 0
    for (var i = 0; i < list.length; i++) {
      var e = list[i]
      if (!e || e.dead) continue
      if (status && fn(ctx, 'applyStatus')) ctx.applyStatus(e, status, secs)
      if (dmg > 0 && typeof IS.damageEnemy === 'function') {
        IS.damageEnemy(e, dmg, { src: p }, ctx)
      }
      n++
    }
    return n
  }

  function killShot (s) {
    if (!s) return
    s.dead = true
    s.life = 0
  }

  // Live familiar instances. p.familiars is not in the §4 contract, so every
  // caller treats an absent list as "not reachable" rather than an error.
  function familiarInstances (p) {
    var l = p && p.familiars
    return Array.isArray(l) ? l : []
  }

  function isBlastSource (source) {
    if (!source) return false
    var s = typeof source === 'string'
      ? source
      : (source.id || source.kind || source.type || source.sprite || '')
    return /bomb|explos|blast|tnt|nova|fire|flame/i.test(String(s))
  }

  function isFireSource (source) {
    if (!source) return false
    var s = typeof source === 'string'
      ? source
      : (source.id || source.kind || source.type || source.sprite || '')
    return /fire|flame|burn/i.test(String(s))
  }

  // Shared "leave a creep trail under the player" ticker.
  function creepTrail (p, dt, ctx, key, every, radius, opts) {
    if (!p || !room(ctx) || !fn(ctx, 'spawnCreep')) return
    var c = cache(p)
    c[key] = (c[key] || 0) - (dt || 0)
    if (c[key] > 0) return
    c[key] = every
    ctx.spawnCreep(p.x, p.y, radius, opts)
  }

  var PICKUP_KINDS = ['coin', 'key', 'bomb', 'heart']

  // 3 Dollar Bill's rotating effects. Deliberately excludes the flags that
  // replace the tear wholesale (brimstone/knife/laser/ludo/technology/godhead/
  // continuous) — those are weapon conversions, not "a random tear effect".
  var BILL_FLAGS = [
    'piercing', 'spectral', 'homing', 'bouncing', 'splitting', 'explosive',
    'poison', 'burn', 'freeze', 'slow', 'charm', 'fear', 'confusion', 'bleed',
    'shrink', 'petrify', 'magnetize', 'knockback', 'light', 'ice', 'booger',
    'sticky', 'tinyplanet', 'wiggle', 'sinusoid', 'boomerang', 'spin',
    'glitter', 'pop', 'nail', 'lump'
  ]

  // Experimental Treatment's candidate stats and the size of one step.
  var EXP_KEYS = ['damage', 'tears', 'range', 'shotSpeed', 'speed', 'luck', 'tearSize']
  var EXP_DELTA = {
    damage: 1, tears: 0.4, range: 60, shotSpeed: 0.2, speed: 0.15, luck: 1,
    tearSize: 0.2
  }

  // Both Key Pieces together. The Mega Satan door itself is floor-side, so the
  // pieces record the completion on run.flags for js/engine/floor.js and, as
  // the one thing data can honestly do here, pop the locked doors of the room
  // they are carried into.
  function keyPieceCheck (p, ctx) {
    if (!fn(ctx, 'hasItem')) return
    if (!ctx.hasItem('key-piece-1') || !ctx.hasItem('key-piece-2')) return
    if (ctx.run && ctx.run.flags) ctx.run.flags.keyPiecesComplete = true
    var r = room(ctx)
    if (!r || !Array.isArray(r.doors) || !fn(ctx, 'unlockDoor')) return
    for (var i = 0; i < r.doors.length; i++) {
      var d = r.doors[i]
      if (!d || !d.locked) continue
      if (d.kind === 'locked' || d.kind === 'mom-locked') ctx.unlockDoor(d.kind)
    }
  }

  // Double a familiar's damage once, on the instance only. `key` namespaces the
  // marker so BFFS! and Hive Mind stack instead of fighting over one flag.
  function scaleFamiliars (p, key, factor, match) {
    var list = familiarInstances(p)
    for (var i = 0; i < list.length; i++) {
      var f = list[i]
      if (!f || f[key]) continue
      if (match && !match(f)) continue
      f[key] = 1
      if (typeof f.dmg === 'number') f.dmg *= factor
      if (typeof f.scale === 'number') f.scale *= 1 + (factor - 1) * 0.25
    }
  }

  function isSwarmFamiliar (f) {
    var id = String((f && (f.id || f.defId)) || '')
    return /fly|spider|locust/i.test(id)
  }

  // ---------------------------------------------------------------------------

  IS.defineItems([

    {
      id: 'dead-dove',
      num: 185,
      name: 'Dead Dove',
      desc: 'Flight and spectral tears',
      info: 'Spectral tears · Flight',
      kind: 'passive',
      quality: 2,
      pools: ['angel', 'greed-angel'],
      tags: ['offensive', 'utility', 'angel'],
      dlc: 'rebirth',
      flags: ['flying', 'spectralTears'],
      transform: 'seraphim'
    },

    {
      id: 'blood-rights',
      num: 186,
      name: 'Blood Rights',
      desc: 'Your blood for their blood',
      info: 'Deals 40 damage to every enemy · Costs 1 heart, then half a heart for the rest of the room',
      kind: 'active',
      quality: 2,
      // Chargeless: the cost is paid in health, not in rooms (§5.1 charge 0).
      charge: 0,
      chargeType: 'normal',
      pools: ['treasure', 'greed-treasure'],
      tags: ['offensive', 'chargeless', 'hearts'],
      dlc: 'rebirth',
      hooks: {
        onRoomEnter: function (p, r, ctx) {
          cache(p).bloodRightsUsed = false
        },
        // "Removes Red Hearts first" is the engine's depletion order inside
        // IS.damagePlayer (§4.2) and is not overridable from data.
        onUse: function (p, ctx) {
          if (!p || !ctx) return { fail: true }
          var c = cache(p)
          var cost = c.bloodRightsUsed ? 1 : 2
          c.bloodRightsUsed = true
          if (fn(ctx, 'damagePlayer')) ctx.damagePlayer(cost, 'blood-rights')
          hurtAll(p, ctx, 40, null, 0)
          sfx(ctx, 'player-hurt')
          if (fn(ctx, 'shake')) ctx.shake(4, 0.2)
          return { keepCharge: true }
        }
      }
    },

    {
      id: 'guppys-hairball',
      num: 187,
      name: "Guppy's Hairball",
      desc: 'A hairball on a chain',
      info: 'Swings around Isaac as he moves · Grows and hits harder with every kill',
      kind: 'familiar',
      quality: 2,
      pools: ['devil', 'greed-devil'],
      tags: ['familiar', 'orbital', 'guppy', 'devil'],
      dlc: 'rebirth',
      familiars: ['guppys-hairball'],
      transform: 'guppy',
      hooks: {
        // APPROXIMATED: the params contract has no runtime-mutable size, so the
        // growth is written onto the live instance when p.familiars is
        // reachable, and the base params are already tuned to a mid-sized
        // hairball so the item is never a no-op if it is not.
        onEnemyKill: function (p, enemy, ctx) {
          var c = cache(p)
          var n = Math.min(24, (c.hairballKills || 0) + 1)
          c.hairballKills = n
          var grow = 1 + n * 0.05
          var list = familiarInstances(p)
          for (var i = 0; i < list.length; i++) {
            var f = list[i]
            if (!f || f.id !== 'guppys-hairball') continue
            if (typeof f.baseDmg !== 'number' && typeof f.dmg === 'number') f.baseDmg = f.dmg
            if (typeof f.baseDmg === 'number') f.dmg = f.baseDmg * grow
            if (typeof f.scale === 'number') f.scale = grow
          }
        }
      }
    },

    {
      id: 'abel',
      num: 188,
      name: 'Abel',
      desc: "Isaac's brother",
      info: "Mirrors Isaac's movement and shoots · 3.5 damage per tear",
      kind: 'familiar',
      quality: 2,
      pools: ['treasure', 'greed-treasure', 'baby-shop'],
      tags: ['familiar', 'follower', 'baby'],
      dlc: 'rebirth',
      familiars: ['abel'],
      transform: 'conjoined'
      // APPROXIMATED: 'follower' is the closest behaviour in §7.4 — there is no
      // mirrored-movement familiar, so Abel trails Isaac and shoots instead of
      // inverting his inputs.
    },

    {
      id: 'smb-super-fan',
      num: 189,
      name: 'SMB Super Fan',
      desc: 'All stats up',
      info: '+0.2 tears · +0.3 damage · +0.2 speed · +2.5 range · +1 container · Full health',
      kind: 'passive',
      quality: 3,
      pools: ['treasure', 'greed-treasure', 'crane-game'],
      tags: ['damage', 'tears', 'speed', 'range', 'hearts'],
      dlc: 'rebirth',
      stats: { tears: 0.2, damage: 0.3, speed: 0.2, range: 100 },
      grant: { maxHearts: 2, heal: 24 }
    },

    {
      id: 'pyro',
      num: 190,
      name: 'Pyro',
      desc: '+99 bombs',
      info: '+99 Bombs',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'secret', 'greed-secret', 'bomb-bum'],
      tags: ['bombs', 'utility'],
      dlc: 'rebirth',
      grant: { bombs: 99 }
    },

    {
      id: '3-dollar-bill',
      num: 191,
      name: '3 Dollar Bill',
      desc: 'Random tear effects',
      info: 'Isaac’s tears get random effects every 2-3 seconds',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure'],
      tags: ['offensive', 'tears', 'utility'],
      dlc: 'rebirth',
      hooks: {
        onInit: function (p, ctx) {
          var c = cache(p)
          if (!c.billFlags) c.billFlags = ['homing']
          if (!c.billT) c.billT = 0
        },
        onUpdate: function (p, dt, ctx) {
          var c = cache(p)
          c.billT = (c.billT || 0) - (dt || 0)
          if (c.billT > 0) return
          c.billT = rangeOf(ctx, 2, 3)
          var a = pickOf(ctx, BILL_FLAGS)
          var b = pickOf(ctx, BILL_FLAGS)
          var out = []
          if (a) out.push(a)
          if (b && b !== a) out.push(b)
          if (out.length) c.billFlags = out
        },
        onTearFire: function (p, tear, ctx) {
          var list = (p && p.cache && p.cache.billFlags) || null
          if (!list || !tear) return
          for (var i = 0; i < list.length; i++) addTearFlag(tear, list[i])
        }
      }
    },

    {
      id: 'telepathy-for-dummies',
      num: 192,
      name: 'Telepathy for Dummies',
      desc: 'Homing tears for the room',
      info: 'For the room: +3 range and homing tears',
      kind: 'active',
      quality: 2,
      charge: 4,
      chargeType: 'normal',
      pools: ['treasure', 'library', 'greed-treasure'],
      tags: ['book', 'offensive', 'tears'],
      dlc: 'rebirth',
      transform: 'bookworm',
      hooks: {
        onUse: function (p, ctx) {
          if (!p) return { fail: true }
          cache(p).telepathyRoom = true
          if (typeof IS.recalcStats === 'function') IS.recalcStats(p)
          sfx(ctx, 'charge-ready')
        },
        onRoomEnter: function (p, r, ctx) {
          var c = cache(p)
          if (!c.telepathyRoom) return
          c.telepathyRoom = false
          if (typeof IS.recalcStats === 'function') IS.recalcStats(p)
        },
        onStats: function (p, s) {
          if (!s || !p || !p.cache || !p.cache.telepathyRoom) return
          s.range = (s.range || 0) + 120
        },
        onTearFire: function (p, tear, ctx) {
          if (p && p.cache && p.cache.telepathyRoom) addTearFlag(tear, 'homing')
        }
      }
    },

    {
      id: 'meat',
      num: 193,
      name: 'MEAT!',
      desc: 'Damage and health up',
      info: '+0.3 damage · +1 heart container · Heals 1 heart',
      kind: 'passive',
      quality: 2,
      pools: ['boss', 'greed-boss', 'ultra-secret'],
      tags: ['damage', 'hearts'],
      dlc: 'rebirth',
      stats: { damage: 0.3 },
      grant: { maxHearts: 2, heal: 2 }
    },

    {
      id: 'magic-8-ball',
      num: 194,
      name: 'Magic 8 Ball',
      desc: 'Shot speed up, a free card',
      info: '+0.16 shot speed · Spawns 1 card · +15% Planetarium chance',
      kind: 'passive',
      quality: 2,
      pools: ['boss', 'golden-chest', 'greed-boss', 'crane-game'],
      tags: ['card', 'utility'],
      dlc: 'rebirth',
      stats: { shotSpeed: 0.16 },
      hooks: {
        onInit: function (p, ctx) {
          if (ctx && ctx.run && typeof ctx.run.planetariumChance === 'number') {
            ctx.run.planetariumChance += 0.15
          } else if (ctx && ctx.run) {
            ctx.run.planetariumChance = 0.15
          }
          var c = cache(p)
          if (c.magic8Given || !room(ctx)) return
          c.magic8Given = true
          drop(p, ctx, 'card', 0)
        }
      }
    },

    {
      id: 'moms-coin-purse',
      num: 195,
      name: "Mom's Coin Purse",
      desc: 'Four pills',
      info: 'Spawns 4 pills',
      kind: 'passive',
      quality: 1,
      pools: ['shop', 'boss', 'beggar', 'demon-beggar', 'moms-chest', 'greed-boss', 'old-chest'],
      tags: ['pill', 'utility'],
      dlc: 'rebirth',
      grant: { pills: 4 },
      transform: 'mom'
    },

    {
      id: 'squeezy',
      num: 196,
      name: 'Squeezy',
      desc: 'Tears up, soul hearts',
      info: '+0.4 tears · +2 soul hearts',
      kind: 'passive',
      quality: 1,
      pools: ['boss', 'golden-chest', 'greed-boss', 'crane-game'],
      tags: ['tears', 'hearts'],
      dlc: 'rebirth',
      stats: { tears: 0.4 },
      grant: { soul: 4 }
    },

    {
      id: 'jesus-juice',
      num: 197,
      name: 'Jesus Juice',
      desc: 'Damage and range up',
      info: '+0.5 damage · +1.5 range',
      kind: 'passive',
      quality: 2,
      pools: ['boss', 'greed-boss', 'greed-angel'],
      tags: ['damage', 'range'],
      dlc: 'rebirth',
      stats: { damage: 0.5, range: 35.2 }
    },

    {
      id: 'box',
      num: 198,
      name: 'Box',
      desc: 'One of everything',
      info: 'Spawns 1 pickup of each type',
      kind: 'passive',
      quality: 1,
      pools: ['boss', 'beggar', 'greed-boss'],
      tags: ['utility', 'consumable'],
      dlc: 'rebirth',
      hooks: {
        onInit: function (p, ctx) {
          var c = cache(p)
          if (c.boxOpened || !room(ctx)) return
          c.boxOpened = true
          var kinds = ['coin', 'key', 'bomb', 'heart', 'card', 'pill', 'trinket']
          for (var i = 0; i < kinds.length; i++) drop(p, ctx, kinds[i], i + 1)
          sfx(ctx, 'chest-open')
        }
      }
    },

    {
      id: 'moms-key',
      num: 199,
      name: "Mom's Key",
      desc: 'Keys, and richer chests',
      info: '+2 keys · Chests contain more pickups',
      kind: 'passive',
      quality: 2,
      pools: ['shop', 'key-master', 'moms-chest', 'greed-boss', 'old-chest'],
      tags: ['keys', 'utility'],
      dlc: 'rebirth',
      grant: { keys: 2 },
      transform: 'mom',
      hooks: {
        onPickup: function (p, kind, amount, ctx) {
          if (kind !== 'chest' || !room(ctx)) return
          var c = cache(p)
          if (c.momsKeyBusy) return
          c.momsKeyBusy = true
          try {
            var n = 1 + intOf(ctx, 2)
            for (var i = 0; i < n; i++) {
              drop(p, ctx, pickOf(ctx, PICKUP_KINDS) || 'coin', i + 1)
            }
          } finally { c.momsKeyBusy = false }
        }
      }
    },

    {
      id: 'moms-eyeshadow',
      num: 200,
      name: "Mom's Eyeshadow",
      desc: 'Chance for charming tears',
      info: '10% chance to shoot charming tears (100% at 27 luck)',
      kind: 'passive',
      quality: 1,
      pools: ['treasure', 'moms-chest', 'greed-treasure', 'old-chest'],
      tags: ['offensive', 'tears', 'luck'],
      dlc: 'rebirth',
      transform: 'mom',
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (roll(ctx, 0.1, 0.9 / 27, 1)) addTearFlag(tear, 'charm')
        }
      }
    },

    {
      id: 'iron-bar',
      num: 201,
      name: 'Iron Bar',
      desc: 'Damage up, concussive tears',
      info: '+0.3 damage · 10% chance to shoot concussive tears (100% at 27 luck)',
      kind: 'passive',
      quality: 1,
      pools: ['treasure', 'greed-treasure'],
      tags: ['damage', 'offensive', 'tears'],
      dlc: 'rebirth',
      stats: { damage: 0.3 },
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (roll(ctx, 0.1, 0.9 / 27, 1)) addTearFlag(tear, 'confusion')
        }
      }
    },

    {
      id: 'midas-touch',
      num: 202,
      name: "Midas' Touch",
      desc: 'Turn enemies to gold',
      info: 'Touching enemies petrifies and gilds them · Contact damage scales with your coins · Gilded kills drop coins',
      kind: 'passive',
      quality: 2,
      pools: ['treasure'],
      tags: ['offensive', 'coins', 'utility'],
      dlc: 'rebirth',
      hooks: {
        onUpdate: function (p, dt, ctx) {
          if (!p || !room(ctx)) return
          var c = cache(p)
          c.midasT = (c.midasT || 0) - (dt || 0)
          if (c.midasT > 0) return
          var list = living(ctx)
          for (var i = 0; i < list.length; i++) {
            var e = list[i]
            if (!e || e.dead || e.boss) continue
            if (dist(p.x, p.y, e.x, e.y) > (p.r || 26) + (e.r || 22) + 6) continue
            if (fn(ctx, 'applyStatus')) {
              ctx.applyStatus(e, 'midas', 8)
              ctx.applyStatus(e, 'petrify', 1.6)
            }
            if (typeof IS.damageEnemy === 'function') {
              IS.damageEnemy(e, Math.max(1, p.coins || 0), { src: p }, ctx)
            }
            c.midasT = 0.4
            return
          }
        },
        onEnemyKill: function (p, enemy, ctx) {
          if (!enemy || !enemy.status || !enemy.status.midas) return
          if (!room(ctx) || !fn(ctx, 'spawnPickup')) return
          var n = 1 + intOf(ctx, 3)
          for (var i = 0; i < n; i++) {
            ctx.spawnPickup('coin', enemy.x + rangeOf(ctx, -22, 22), enemy.y + rangeOf(ctx, -22, 22), {})
          }
        },
        // APPROXIMATED: the golden-poop clause has no ctx surface (grid kinds
        // are engine-owned), so the gold comes out of the poop Isaac breaks
        // instead of the poop he leaves behind.
        onGridBreak: function (p, grid, ctx) {
          if (!grid || !room(ctx) || !fn(ctx, 'spawnPickup')) return
          var kind = String(grid.kind || grid.type || '')
          if (!/poop/i.test(kind)) return
          if (!chance(ctx, 0.5)) return
          ctx.spawnPickup('coin', grid.x || p.x, grid.y || p.y, {})
        }
      }
    },

    {
      id: 'humbleing-bundle',
      num: 203,
      name: 'Humbleing Bundle',
      desc: 'Pickups may double',
      info: 'Pickups have a 50% chance to be doubled',
      kind: 'passive',
      quality: 2,
      pools: ['shop'],
      tags: ['utility', 'coins', 'keys', 'bombs'],
      dlc: 'rebirth',
      hooks: {
        onPickup: function (p, kind, amount, ctx) {
          if (!p || !ctx) return
          var c = cache(p)
          if (c.bundleBusy) return
          var n = (typeof amount === 'number' && amount > 0) ? amount : 1
          if (!chance(ctx, 0.5)) return
          c.bundleBusy = true
          try {
            if (kind === 'coin' && fn(ctx, 'addCoins')) ctx.addCoins(n)
            else if (kind === 'key' && fn(ctx, 'addKeys')) ctx.addKeys(n)
            else if (kind === 'bomb' && fn(ctx, 'addBombs')) ctx.addBombs(n)
            else if (kind === 'heart' && fn(ctx, 'healRed')) ctx.healRed(n)
            else if (kind === 'soul' && fn(ctx, 'addSoul')) ctx.addSoul(n)
            else if (kind === 'black' && fn(ctx, 'addBlack')) ctx.addBlack(n)
          } finally { c.bundleBusy = false }
        }
      }
    },

    {
      id: 'fanny-pack',
      num: 204,
      name: 'Fanny Pack',
      desc: 'Getting hit drops pickups',
      info: 'Taking damage has a 50% chance to spawn a random pickup',
      kind: 'passive',
      quality: 1,
      pools: ['shop', 'beggar', 'greed-shop'],
      tags: ['utility', 'defensive'],
      dlc: 'rebirth',
      hooks: {
        onPlayerDamage: function (p, amount, source, ctx) {
          if (!chance(ctx, 0.5)) return
          drop(p, ctx, pickOf(ctx, ['coin', 'key', 'bomb', 'heart', 'card', 'pill']) || 'coin', 1)
        }
      }
    },

    {
      id: 'sharp-plug',
      num: 205,
      name: 'Sharp Plug',
      desc: 'Blood for charge',
      info: 'Pays half a heart per charge · Half a heart of damage tops your active item up',
      kind: 'passive',
      quality: 1,
      pools: ['shop', 'battery-bum'],
      tags: ['charge', 'hearts', 'utility'],
      dlc: 'rebirth',
      hooks: {
        // APPROXIMATED: no hook observes an attempt to use an *uncharged*
        // active, so the trigger moved — the exchange rate is untouched (one
        // charge per half heart), but it is paid when Isaac takes damage rather
        // than when he clicks a dead item.
        onPlayerDamage: function (p, amount, source, ctx) {
          if (!p || !fn(ctx, 'addCharge')) return
          var n = (typeof amount === 'number' && amount > 0) ? amount : 1
          if (Array.isArray(p.active)) {
            if (p.active[0]) ctx.addCharge(n, 0)
            if (p.active[1]) ctx.addCharge(n, 1)
          } else ctx.addCharge(n, 0)
          sfx(ctx, 'charge-up')
        }
      }
    },

    {
      id: 'guillotine',
      num: 206,
      name: 'Guillotine',
      desc: 'Your head flies free',
      info: '+0.5 tears · +1 damage · Isaac’s head orbits, shoots and blocks shots',
      kind: 'familiar',
      quality: 2,
      pools: ['treasure', 'greed-treasure'],
      tags: ['familiar', 'orbital', 'damage', 'tears'],
      dlc: 'rebirth',
      stats: { tears: 0.5, damage: 1 },
      familiars: ['guillotine']
    },

    {
      id: 'ball-of-bandages',
      num: 207,
      name: 'Ball of Bandages',
      desc: 'A charmed orbital',
      info: 'Orbital that shoots charming tears · Extra copies add another orbital',
      kind: 'familiar',
      quality: 1,
      pools: ['baby-shop'],
      tags: ['familiar', 'orbital'],
      dlc: 'rebirth',
      familiars: ['ball-of-bandages']
      // APPROXIMATED: Lv1-4 upgrades (up to Super Bandage Girl) have no
      // representation in the familiar contract, so each copy of the item adds
      // another orbital instead of upgrading the first.
    },

    {
      id: 'champion-belt',
      num: 208,
      name: 'Champion Belt',
      desc: 'Damage up, tougher enemies',
      info: '+1 damage · 15% of the enemies in a room become champions',
      kind: 'passive',
      quality: 2,
      pools: ['shop', 'greed-shop', 'crane-game', 'ultra-secret'],
      tags: ['damage', 'curse', 'utility'],
      dlc: 'rebirth',
      stats: { damage: 1 },
      hooks: {
        onRoomEnter: function (p, r, ctx) {
          if (!room(ctx) || typeof IS.rollChampion !== 'function') return
          var rng = (ctx && ctx.rng) || null
          if (!rng) return
          var list = living(ctx)
          for (var i = 0; i < list.length; i++) {
            var e = list[i]
            if (!e || e.dead || e.boss || e.champion) continue
            if (!chance(ctx, 0.15)) continue
            IS.rollChampion(e, rng)
          }
        }
      }
    },

    {
      id: 'butt-bombs',
      num: 209,
      name: 'Butt Bombs',
      desc: 'Bombs shake the whole room',
      info: '+5 bombs · Explosions confuse and damage every enemy in the room',
      kind: 'passive',
      quality: 2,
      // 'shell-game' from the source data is not in IS.POOL_LIST and is dropped.
      pools: ['treasure', 'greed-treasure', 'bomb-bum'],
      tags: ['bombs', 'offensive'],
      dlc: 'rebirth',
      grant: { bombs: 5 },
      hooks: {
        onBombExplode: function (p, bomb, ctx) {
          hurtAll(p, ctx, 10, 'confusion', 2.5)
          sfx(ctx, 'fart')
          if (fn(ctx, 'shake')) ctx.shake(5, 0.25)
        }
      }
    },

    {
      id: 'gnawed-leaf',
      num: 210,
      name: 'Gnawed Leaf',
      desc: 'Stand still to turn to stone',
      info: 'After 1 second of standing still Isaac becomes invincible',
      kind: 'passive',
      quality: 1,
      pools: ['treasure', 'greed-treasure'],
      tags: ['defensive', 'utility'],
      dlc: 'rebirth',
      flags: ['gnawedLeaf']
    },

    {
      id: 'spiderbaby',
      num: 211,
      name: 'Spiderbaby',
      desc: 'Getting hit spits spiders',
      info: 'Taking damage spawns 3-5 blue spiders',
      kind: 'passive',
      quality: 2,
      pools: ['treasure'],
      tags: ['spider', 'offensive', 'defensive'],
      dlc: 'rebirth',
      transform: 'spider',
      hooks: {
        onPlayerDamage: function (p, amount, source, ctx) {
          if (!room(ctx) || !fn(ctx, 'spawnFamiliar')) return
          var n = 3 + intOf(ctx, 3)
          for (var i = 0; i < n; i++) ctx.spawnFamiliar('blue-spider', { life: 0 })
          sfx(ctx, 'web-shot')
        }
      }
    },

    {
      id: 'guppys-collar',
      num: 212,
      name: "Guppy's Collar",
      desc: 'Nine lives, roughly',
      info: '50% chance to revive with half a heart on death',
      kind: 'passive',
      quality: 2,
      pools: ['devil', 'red-chest', 'curse', 'greed-curse', 'greed-devil', 'crane-game'],
      tags: ['revive', 'guppy', 'devil'],
      dlc: 'rebirth',
      transform: 'guppy',
      hooks: {
        onPlayerDeath: function (p, ctx) {
          if (!p || !chance(ctx, 0.5)) return
          var maxRed = (p.hearts && p.hearts.maxRed) || 0
          if (maxRed > 0 && fn(ctx, 'healRed')) ctx.healRed(1)
          else if (fn(ctx, 'addSoul')) ctx.addSoul(1)
          sfx(ctx, 'holy-shield')
          return { revive: true }
        }
      }
    },

    {
      id: 'lost-contact',
      num: 213,
      name: 'Lost Contact',
      desc: 'Tears swat enemy shots',
      info: '-0.15 shot speed · Isaac’s tears destroy enemy shots',
      kind: 'passive',
      quality: 1,
      pools: ['treasure', 'secret', 'greed-treasure', 'greed-secret'],
      tags: ['defensive', 'tears'],
      dlc: 'rebirth',
      stats: { shotSpeed: -0.15 },
      hooks: {
        onUpdate: function (p, dt, ctx) {
          var r = room(ctx)
          if (!r || !Array.isArray(r.tears) || !Array.isArray(r.shots)) return
          for (var i = 0; i < r.tears.length; i++) {
            var t = r.tears[i]
            if (!t || t.dead || t.friendly === false) continue
            for (var j = 0; j < r.shots.length; j++) {
              var s = r.shots[j]
              if (!s || s.dead || s.friendly) continue
              if (dist(t.x, t.y, s.x, s.y) > (t.r || 10) + (s.r || 8) + 2) continue
              killShot(s)
              sfx(ctx, 'tear-splat')
              break
            }
          }
        }
      }
    },

    {
      id: 'anemic',
      num: 214,
      name: 'Anemic',
      desc: 'Bleed on the floor',
      info: '+1.5 range · Taking damage leaves a blood creep trail for the room (20 damage/second)',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure', 'ultra-secret'],
      tags: ['range', 'offensive', 'defensive'],
      dlc: 'rebirth',
      stats: { range: 60 },
      hooks: {
        onPlayerDamage: function (p, amount, source, ctx) {
          cache(p).anemicRoom = true
        },
        onRoomEnter: function (p, r, ctx) {
          cache(p).anemicRoom = false
        },
        onUpdate: function (p, dt, ctx) {
          if (!p || !p.cache || !p.cache.anemicRoom) return
          creepTrail(p, dt, ctx, 'anemicT', 0.14, 34, {
            colour: '#8a1c16', kind: 'red', dmg: 20, life: 12
          })
        }
      }
    },

    {
      id: 'goat-head',
      num: 215,
      name: 'Goat Head',
      desc: 'The deal is always open',
      info: '100% Devil/Angel Room chance',
      kind: 'passive',
      quality: 3,
      pools: ['devil', 'curse'],
      tags: ['devil', 'angel', 'utility'],
      dlc: 'rebirth',
      stats: { devilChance: 1, angelChance: 1 }
    },

    {
      id: 'ceremonial-robes',
      num: 216,
      name: 'Ceremonial Robes',
      desc: 'Damage up, black hearts',
      info: '+1 damage · +3 black hearts',
      kind: 'passive',
      quality: 2,
      pools: ['devil', 'demon-beggar', 'curse', 'greed-curse', 'greed-devil'],
      tags: ['damage', 'hearts', 'devil'],
      dlc: 'rebirth',
      stats: { damage: 1 },
      grant: { black: 6 }
    },

    {
      id: 'moms-wig',
      num: 217,
      name: "Mom's Wig",
      desc: 'Shooting spits spiders',
      info: 'Heals 1 heart · 5% chance to spawn a blue spider when firing (100% at 10 luck)',
      kind: 'passive',
      quality: 1,
      pools: ['treasure', 'moms-chest', 'greed-treasure', 'old-chest'],
      tags: ['spider', 'offensive', 'luck'],
      dlc: 'rebirth',
      grant: { heal: 2 },
      transform: 'mom',
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (!room(ctx) || !fn(ctx, 'spawnFamiliar')) return
          if (!roll(ctx, 0.05, 0.95 / 10, 1)) return
          ctx.spawnFamiliar('blue-spider', { life: 0 })
        }
      }
    },

    {
      id: 'placenta',
      num: 218,
      name: 'Placenta',
      desc: 'Slow regeneration',
      info: '+1 heart container · Heals 1 heart · 50% chance to heal half a heart every minute',
      kind: 'passive',
      quality: 2,
      pools: ['boss'],
      tags: ['hearts', 'defensive'],
      dlc: 'rebirth',
      grant: { maxHearts: 2, heal: 2 },
      hooks: {
        onUpdate: function (p, dt, ctx) {
          var c = cache(p)
          c.placentaT = (c.placentaT || 0) + (dt || 0)
          if (c.placentaT < 60) return
          c.placentaT = 0
          if (!chance(ctx, 0.5)) return
          if (fn(ctx, 'healRed')) ctx.healRed(1)
          sfx(ctx, 'heart-pickup')
        }
      }
    },

    {
      id: 'old-bandage',
      num: 219,
      name: 'Old Bandage',
      desc: 'An empty container',
      info: '+1 empty heart container · Taking damage has a 20% chance to drop a Red Heart',
      kind: 'passive',
      quality: 1,
      pools: ['boss'],
      tags: ['hearts', 'defensive'],
      dlc: 'rebirth',
      grant: { maxHearts: 2 },
      hooks: {
        onPlayerDamage: function (p, amount, source, ctx) {
          if (!chance(ctx, 0.2)) return
          drop(p, ctx, 'heart', 1)
        }
      }
    },

    {
      id: 'sad-bombs',
      num: 220,
      name: 'Sad Bombs',
      desc: 'Bombs cry tears',
      info: '+5 bombs · Bombs fire 10 tears in a circle when they explode',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure', 'bomb-bum'],
      tags: ['bombs', 'offensive'],
      dlc: 'rebirth',
      grant: { bombs: 5 },
      hooks: {
        onBombExplode: function (p, bomb, ctx) {
          if (!room(ctx) || !fn(ctx, 'spawnTear') || !bomb) return
          var dmg = (p && p.stats && p.stats.damage) || 3.5
          var speed = 480
          for (var i = 0; i < 10; i++) {
            var a = (i / 10) * Math.PI * 2
            ctx.spawnTear({
              x: bomb.x, y: bomb.y,
              vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
              dmg: dmg, friendly: true, life: 0.9
            })
          }
        }
      }
    },

    {
      id: 'rubber-cement',
      num: 221,
      name: 'Rubber Cement',
      desc: 'Bouncy tears',
      info: 'Isaac’s tears bounce off enemies and obstacles',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure'],
      tags: ['offensive', 'tears'],
      dlc: 'rebirth',
      tearFlags: ['bouncing']
    },

    {
      id: 'anti-gravity',
      num: 222,
      name: 'Anti-Gravity',
      desc: 'Tears hang in the air',
      info: '+1 tears · Tears hover briefly, then rush off in the direction they were fired',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure'],
      tags: ['tears', 'offensive'],
      dlc: 'rebirth',
      stats: { tears: 1 },
      hooks: {
        // APPROXIMATED: a hook cannot see the fire button being *held*, so the
        // hover is a fixed 0.35s window rather than lasting until release. The
        // velocity is scaled to 5% instead of zeroed so IS.updateProjectiles
        // never mistakes a hovering tear for a dead one.
        onTearFire: function (p, tear, ctx) {
          if (!tear) return
          var vx = tear.vx || 0
          var vy = tear.vy || 0
          if (!vx && !vy) return
          tear.agVx = vx
          tear.agVy = vy
          tear.agHold = 0.35
          tear.vx = vx * 0.05
          tear.vy = vy * 0.05
          if (typeof tear.life === 'number') tear.life += 0.35
        },
        onUpdate: function (p, dt, ctx) {
          var r = room(ctx)
          if (!r || !Array.isArray(r.tears)) return
          for (var i = 0; i < r.tears.length; i++) {
            var t = r.tears[i]
            if (!t || t.agHold == null) continue
            t.agHold -= (dt || 0)
            if (t.agHold > 0) continue
            t.vx = t.agVx
            t.vy = t.agVy
            t.agHold = null
          }
        }
      }
    },

    {
      id: 'pyromaniac',
      num: 223,
      name: 'Pyromaniac',
      desc: 'Explosions heal you',
      info: '+5 bombs · Immune to explosions and fire · Explosions heal half a heart',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure'],
      tags: ['bombs', 'defensive', 'hearts'],
      dlc: 'rebirth',
      grant: { bombs: 5 },
      hooks: {
        onPlayerDamage: function (p, amount, source, ctx) {
          if (!isBlastSource(source)) return
          if (fn(ctx, 'healRed')) ctx.healRed(1)
          sfx(ctx, 'heart-pickup')
          return { cancel: true }
        }
      }
    },

    {
      id: 'crickets-body',
      num: 224,
      name: "Cricket's Body",
      desc: 'Tears burst into four',
      info: '+0.5 tears · -1.3 range · Tears split into 4 on hit, each for half damage',
      kind: 'passive',
      quality: 3,
      pools: ['treasure', 'greed-treasure'],
      tags: ['tears', 'offensive', 'range'],
      dlc: 'rebirth',
      stats: { tears: 0.5, range: -52 },
      tearFlags: ['splitting']
    },

    {
      id: 'gimpy',
      num: 225,
      name: 'Gimpy',
      desc: 'Pain pays out',
      info: 'Taking damage has an 8% chance (+2%/luck) to drop a soul heart · Enemies may drop half a Red Heart',
      kind: 'passive',
      quality: 1,
      pools: ['treasure', 'devil', 'demon-beggar', 'curse', 'greed-curse', 'greed-devil'],
      tags: ['hearts', 'devil', 'luck'],
      dlc: 'rebirth',
      hooks: {
        onPlayerDamage: function (p, amount, source, ctx) {
          if (!roll(ctx, 0.08, 0.02, 1)) return
          drop(p, ctx, 'soul', 1)
        },
        onEnemyKill: function (p, enemy, ctx) {
          if (!enemy || !room(ctx) || !fn(ctx, 'spawnPickup')) return
          if (!roll(ctx, 0.08, 0.01, 0.25)) return
          ctx.spawnPickup('heart', enemy.x, enemy.y, { half: true })
        }
      }
    },

    {
      id: 'black-lotus',
      num: 226,
      name: 'Black Lotus',
      desc: 'Every kind of heart',
      info: '+1 heart container · Heals 1 heart · +1 soul heart · +1 black heart',
      kind: 'passive',
      quality: 2,
      pools: ['secret', 'greed-treasure', 'greed-secret'],
      tags: ['hearts', 'defensive'],
      dlc: 'rebirth',
      grant: { maxHearts: 2, heal: 2, soul: 2, black: 2 }
    },

    {
      id: 'piggy-bank',
      num: 227,
      name: 'Piggy Bank',
      desc: 'Getting hit shakes out coins',
      info: '+3 coins · Taking damage spawns 1-2 coins',
      kind: 'passive',
      quality: 1,
      pools: ['treasure', 'shop', 'crane-game'],
      tags: ['coins', 'utility'],
      dlc: 'rebirth',
      grant: { coins: 3 },
      hooks: {
        onPlayerDamage: function (p, amount, source, ctx) {
          if (!room(ctx)) return
          var n = 1 + intOf(ctx, 2)
          for (var i = 0; i < n; i++) drop(p, ctx, 'coin', i + 1)
          sfx(ctx, 'coin')
        }
      }
    },

    {
      id: 'moms-perfume',
      num: 228,
      name: "Mom's Perfume",
      desc: 'Tears up, fear tears',
      info: '+0.5 tears · 15% chance to shoot fear tears',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'moms-chest', 'greed-treasure', 'old-chest'],
      tags: ['tears', 'offensive'],
      dlc: 'rebirth',
      stats: { tears: 0.5 },
      transform: 'mom',
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (chance(ctx, 0.15)) addTearFlag(tear, 'fear')
        }
      }
    },

    {
      id: 'monstros-lung',
      num: 229,
      name: "Monstro's Lung",
      desc: 'Shotgun tears',
      info: 'x0.23 tears · Tears charge up and fire as a shotgun blast',
      kind: 'passive',
      quality: 3,
      pools: ['treasure', 'greed-treasure'],
      tags: ['offensive', 'tears'],
      dlc: 'rebirth',
      mult: { tears: 0.231 },
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (!p || !tear || !room(ctx) || !fn(ctx, 'spawnTear')) return
          var c = cache(p)
          if (c.lungBusy) return
          var vx = tear.vx || 0
          var vy = tear.vy || 0
          var sp = Math.sqrt(vx * vx + vy * vy)
          if (sp < 1) return
          var base = Math.atan2(vy, vx)
          var flags = flagsOf(tear)
          c.lungBusy = true
          try {
            for (var i = 0; i < 7; i++) {
              var a = base + rangeOf(ctx, -0.3, 0.3)
              var s = sp * rangeOf(ctx, 0.72, 1.16)
              ctx.spawnTear({
                x: tear.x, y: tear.y,
                vx: Math.cos(a) * s, vy: Math.sin(a) * s,
                dmg: tear.dmg, r: tear.r, flags: flags, friendly: true,
                life: tear.life
              })
            }
          } finally { c.lungBusy = false }
        }
      }
    },

    {
      id: 'abaddon',
      num: 230,
      name: 'Abaddon',
      desc: 'Red hearts become black',
      info: '+1.5 damage · +0.2 speed · All containers become black hearts · +2 black hearts · 15% fear tears',
      kind: 'passive',
      quality: 3,
      pools: ['devil', 'demon-beggar', 'greed-devil', 'ultra-secret'],
      tags: ['damage', 'speed', 'hearts', 'devil'],
      dlc: 'rebirth',
      stats: { damage: 1.5, speed: 0.2 },
      grant: { black: 4 },
      flags: ['noRedHearts'],
      transform: 'leviathan',
      hooks: {
        onInit: function (p, ctx) {
          if (!p || !p.hearts) return
          var containers = p.hearts.maxRed || 0
          if (containers <= 0) return
          if (fn(ctx, 'addMaxHearts')) ctx.addMaxHearts(-containers, false)
          if (fn(ctx, 'addBlack')) ctx.addBlack(containers)
        },
        onTearFire: function (p, tear, ctx) {
          if (chance(ctx, 0.15)) addTearFlag(tear, 'fear')
        }
      }
    },

    {
      id: 'ball-of-tar',
      num: 231,
      name: 'Ball of Tar',
      desc: 'Slowing tears and creep',
      info: '10% chance to shoot slowing tears (100% at 18 luck) · Leaves a trail of slowing creep',
      kind: 'passive',
      quality: 1,
      pools: ['treasure', 'greed-treasure'],
      tags: ['offensive', 'utility', 'luck'],
      dlc: 'rebirth',
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (roll(ctx, 0.1, 0.9 / 18, 1)) addTearFlag(tear, 'slow')
        },
        onUpdate: function (p, dt, ctx) {
          creepTrail(p, dt, ctx, 'tarT', 0.2, 32, {
            colour: '#241f24', kind: 'black', slow: 0.5, life: 14
          })
        }
      }
    },

    {
      id: 'stop-watch',
      num: 232,
      name: 'Stop Watch',
      desc: 'The room runs slow',
      info: '+0.3 speed · Enemies are permanently slowed',
      kind: 'passive',
      quality: 2,
      pools: ['shop', 'crane-game'],
      tags: ['speed', 'utility', 'defensive'],
      dlc: 'rebirth',
      stats: { speed: 0.3 },
      hooks: {
        // The 80%-of-normal figure is the engine's 'slow' status (§4.3 owns the
        // magnitude); the item's job is to keep it permanently reapplied.
        onUpdate: function (p, dt, ctx) {
          if (!room(ctx)) return
          var c = cache(p)
          c.watchT = (c.watchT || 0) - (dt || 0)
          if (c.watchT > 0) return
          c.watchT = 0.75
          hurtAll(p, ctx, 0, 'slow', 1.5)
        }
      }
    },

    {
      id: 'tiny-planet',
      num: 233,
      name: 'Tiny Planet',
      desc: 'Tears orbit you',
      info: '+6.5 range · Spectral tears · Tears orbit Isaac',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure'],
      tags: ['range', 'offensive', 'tears'],
      dlc: 'rebirth',
      stats: { range: 280 },
      tearFlags: ['tinyplanet', 'spectral']
    },

    {
      id: 'infestation-2',
      num: 234,
      name: 'Infestation 2',
      desc: 'Kills sprout spiders',
      info: 'Killing an enemy spawns a blue spider',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure'],
      tags: ['spider', 'offensive'],
      dlc: 'rebirth',
      transform: 'spider',
      hooks: {
        onEnemyKill: function (p, enemy, ctx) {
          if (!room(ctx) || !fn(ctx, 'spawnFamiliar')) return
          ctx.spawnFamiliar('blue-spider', { life: 0 })
        }
      }
    },

    {
      // Collectible 235 is a genuine gap in Isaac's numbering. It is defined so
      // the id resolves for anything that cross-references by number, and given
      // an explicitly empty pool list so it can never roll onto a pedestal.
      id: 'item-235',
      num: 235,
      name: 'Item 235',
      desc: 'Nothing at all',
      info: 'This collectible number does not exist and never appears in a pool',
      kind: 'passive',
      quality: 0,
      pools: [],
      tags: ['utility'],
      dlc: 'rebirth'
    },

    {
      id: 'e-coli',
      num: 236,
      name: 'E. Coli',
      desc: 'Touch turns them to poop',
      info: 'Touching an enemy turns it into poop',
      kind: 'passive',
      quality: 1,
      pools: ['treasure', 'greed-treasure'],
      tags: ['offensive', 'poop', 'utility'],
      dlc: 'rebirth',
      hooks: {
        onUpdate: function (p, dt, ctx) {
          if (!p || !room(ctx)) return
          var c = cache(p)
          c.coliT = (c.coliT || 0) - (dt || 0)
          if (c.coliT > 0) return
          var list = living(ctx)
          for (var i = 0; i < list.length; i++) {
            var e = list[i]
            if (!e || e.dead || e.boss) continue
            if (dist(p.x, p.y, e.x, e.y) > (p.r || 26) + (e.r || 22) + 6) continue
            if (fn(ctx, 'spawnPoop')) ctx.spawnPoop(e.x, e.y)
            if (typeof IS.killEnemy === 'function') IS.killEnemy(e, ctx)
            sfx(ctx, 'poop-break')
            c.coliT = 0.35
            return
          }
        }
      }
    },

    {
      id: 'deaths-touch',
      num: 237,
      name: "Death's Touch",
      desc: 'Big piercing scythes',
      info: '+1.5 damage · x2 tear size · -0.6 tears · Piercing tears',
      kind: 'passive',
      quality: 3,
      pools: ['treasure', 'devil', 'greed-treasure', 'greed-devil'],
      tags: ['damage', 'offensive', 'devil'],
      dlc: 'rebirth',
      stats: { damage: 1.5, tears: -0.6 },
      mult: { tearSize: 2 },
      tearFlags: ['piercing']
    },

    {
      id: 'key-piece-1',
      num: 238,
      name: 'Key Piece 1',
      desc: 'Half a golden key',
      info: 'Both pieces open the golden door · +25% Angel Room chance',
      kind: 'passive',
      quality: 1,
      pools: ['angel'],
      tags: ['angel', 'keys', 'utility'],
      dlc: 'rebirth',
      stats: { angelChance: 0.25 },
      hooks: {
        onInit: function (p, ctx) { keyPieceCheck(p, ctx) },
        onRoomEnter: function (p, r, ctx) { keyPieceCheck(p, ctx) },
        onNewFloor: function (p, floor, ctx) { keyPieceCheck(p, ctx) }
      }
    },

    {
      id: 'key-piece-2',
      num: 239,
      name: 'Key Piece 2',
      desc: 'The other half',
      info: 'Both pieces open the golden door · +25% Angel Room chance',
      kind: 'passive',
      quality: 1,
      pools: ['angel'],
      tags: ['angel', 'keys', 'utility'],
      dlc: 'rebirth',
      stats: { angelChance: 0.25 },
      hooks: {
        onInit: function (p, ctx) { keyPieceCheck(p, ctx) },
        onRoomEnter: function (p, r, ctx) { keyPieceCheck(p, ctx) },
        onNewFloor: function (p, floor, ctx) { keyPieceCheck(p, ctx) }
      }
    },

    {
      id: 'experimental-treatment',
      num: 240,
      name: 'Experimental Treatment',
      desc: 'Four up, two down',
      info: 'Raises 4 random stats and lowers 2 others',
      kind: 'passive',
      quality: 1,
      pools: ['treasure', 'boss', 'demon-beggar', 'greed-boss'],
      tags: ['syringe', 'quality-shift', 'utility'],
      dlc: 'rebirth',
      transform: 'spun',
      hooks: {
        onInit: function (p, ctx) {
          var c = cache(p)
          if (c.expTreatment) return
          var keys = EXP_KEYS.slice()
          var up = []
          var down = []
          var i
          for (i = 0; i < 4 && keys.length; i++) up.push(keys.splice(intOf(ctx, keys.length), 1)[0])
          for (i = 0; i < 2 && keys.length; i++) down.push(keys.splice(intOf(ctx, keys.length), 1)[0])
          c.expTreatment = { up: up, down: down }
          if (typeof IS.recalcStats === 'function') IS.recalcStats(p)
        },
        onStats: function (p, s) {
          var c = p && p.cache && p.cache.expTreatment
          if (!c || !s) return
          var i, k
          for (i = 0; i < c.up.length; i++) {
            k = c.up[i]
            s[k] = (s[k] || 0) + (EXP_DELTA[k] || 0)
          }
          for (i = 0; i < c.down.length; i++) {
            k = c.down[i]
            s[k] = (s[k] || 0) - (EXP_DELTA[k] || 0)
          }
        }
      }
    },

    {
      id: 'contract-from-below',
      num: 241,
      name: 'Contract from Below',
      desc: 'Double or nothing',
      info: 'Doubles room clear rewards · 33% chance of no reward at all',
      kind: 'passive',
      quality: 2,
      pools: ['devil', 'demon-beggar', 'curse'],
      tags: ['devil', 'utility', 'coins'],
      dlc: 'rebirth',
      hooks: {
        // APPROXIMATED: the room-clear drop itself is engine-owned and there is
        // no reliable ordering to delete it from, so the 33% "no reward" clause
        // is expressed as a 33% chance that no bonus drop is added.
        onRoomClear: function (p, r, ctx) {
          if (!room(ctx)) return
          if (chance(ctx, 0.33)) return
          drop(p, ctx, pickOf(ctx, PICKUP_KINDS) || 'coin', 1)
        }
      }
    },

    {
      id: 'infamy',
      num: 242,
      name: 'Infamy',
      desc: 'Half the shots bounce off',
      info: '50% chance to block enemy shots',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'secret', 'greed-treasure', 'greed-secret'],
      tags: ['defensive'],
      dlc: 'rebirth',
      hooks: {
        onUpdate: function (p, dt, ctx) {
          var r = room(ctx)
          if (!p || !r || !Array.isArray(r.shots)) return
          for (var i = 0; i < r.shots.length; i++) {
            var s = r.shots[i]
            if (!s || s.dead || s.friendly || s.infamyRolled) continue
            if (dist(p.x, p.y, s.x, s.y) > (p.r || 26) + (s.r || 8) + 10) continue
            s.infamyRolled = 1
            if (!chance(ctx, 0.5)) continue
            killShot(s)
            sfx(ctx, 'tear-splat')
          }
        }
      }
    },

    {
      id: 'trinity-shield',
      num: 243,
      name: 'Trinity Shield',
      desc: 'Blocks shots from the front',
      info: 'Blocks enemy shots coming from the direction Isaac is firing',
      kind: 'passive',
      quality: 2,
      pools: ['angel', 'greed-angel'],
      tags: ['defensive', 'angel'],
      dlc: 'rebirth',
      hooks: {
        onUpdate: function (p, dt, ctx) {
          var r = room(ctx)
          if (!p || !r || !Array.isArray(r.shots)) return
          var hx = (p.head && p.head.x) || 0
          var hy = (p.head && p.head.y) || 0
          var hl = Math.sqrt(hx * hx + hy * hy)
          if (hl < 0.01) return
          hx /= hl
          hy /= hl
          for (var i = 0; i < r.shots.length; i++) {
            var s = r.shots[i]
            if (!s || s.dead || s.friendly) continue
            var d = dist(p.x, p.y, s.x, s.y)
            if (d > (p.r || 26) + (s.r || 8) + 26) continue
            var ux = (s.x - p.x) / (d || 1)
            var uy = (s.y - p.y) / (d || 1)
            if (ux * hx + uy * hy < 0.35) continue
            killShot(s)
            sfx(ctx, 'holy-shield')
          }
        }
      }
    },

    {
      id: 'tech-5',
      num: 244,
      name: 'Tech.5',
      desc: 'Occasional free lasers',
      info: 'Firing sometimes adds a laser on top of the tear',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure', 'crane-game'],
      tags: ['laser', 'offensive'],
      dlc: 'rebirth',
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (!p || !tear || !room(ctx) || !fn(ctx, 'spawnLaser')) return
          if (!roll(ctx, 0.2, 0.02, 0.5)) return
          var a = Math.atan2(tear.vy || 0, tear.vx || 1)
          ctx.spawnLaser({
            x: p.x, y: p.y, angle: a,
            len: (p.stats && p.stats.range) || 520,
            dmg: (p.stats && p.stats.damage) || 3.5,
            width: 9, life: 0.2, friendly: true
          })
          sfx(ctx, 'laser-fire')
        }
      }
    },

    {
      id: '20-20',
      num: 245,
      name: '20/20',
      desc: 'Double shot',
      info: 'x0.75 damage · Isaac shoots 2 tears at once',
      kind: 'passive',
      quality: 3,
      pools: ['treasure', 'greed-treasure'],
      tags: ['offensive', 'tears'],
      dlc: 'rebirth',
      stats: { multishot: 1 },
      mult: { damage: 0.75 }
    },

    {
      id: 'blue-map',
      num: 246,
      name: 'Blue Map',
      desc: 'Secret rooms revealed',
      info: 'Reveals Secret and Super Secret Room locations on the map',
      kind: 'passive',
      quality: 1,
      pools: ['shop', 'beggar', 'greed-shop'],
      tags: ['utility'],
      dlc: 'rebirth',
      flags: ['seeSecretRooms']
    },

    {
      id: 'bffs',
      num: 247,
      name: 'BFFS!',
      desc: 'Familiars hit twice as hard',
      info: 'Familiars deal double damage',
      kind: 'passive',
      quality: 3,
      pools: ['shop', 'greed-shop', 'ultra-secret'],
      tags: ['familiar', 'offensive'],
      dlc: 'rebirth',
      hooks: {
        // The multiplier is recorded on p.cache for js/engine/familiar.js AND
        // applied straight onto each live instance (never onto the shared
        // params object) so the item still does something if familiar.js never
        // reads the cache. A per-instance marker keeps it from compounding.
        onInit: function (p, ctx) {
          cache(p).bffsMult = 2
        },
        onUpdate: function (p, dt, ctx) {
          if (!p) return
          var c = cache(p)
          c.bffsT = (c.bffsT || 0) - (dt || 0)
          if (c.bffsT > 0) return
          c.bffsT = 0.5
          scaleFamiliars(p, 'bffsScaled', 2, null)
        }
      }
    },

    {
      id: 'hive-mind',
      num: 248,
      name: 'Hive Mind',
      desc: 'Bigger flies and spiders',
      info: 'Blue spiders and flies deal double damage · Spider and fly familiars grow stronger',
      kind: 'passive',
      quality: 2,
      pools: ['shop', 'greed-shop'],
      tags: ['familiar', 'spider', 'fly', 'offensive'],
      dlc: 'rebirth',
      transform: 'spider',
      hooks: {
        onInit: function (p, ctx) {
          cache(p).hiveMult = 2
        },
        onUpdate: function (p, dt, ctx) {
          if (!p) return
          var c = cache(p)
          c.hiveT = (c.hiveT || 0) - (dt || 0)
          if (c.hiveT > 0) return
          c.hiveT = 0.5
          scaleFamiliars(p, 'hiveScaled', 2, isSwarmFamiliar)
        }
      }
    },

    {
      id: 'theres-options',
      num: 249,
      name: "There's Options",
      desc: 'Two boss rewards',
      info: 'A second item appears after beating a boss',
      kind: 'passive',
      quality: 2,
      pools: ['shop'],
      tags: ['utility'],
      dlc: 'rebirth',
      hooks: {
        // APPROXIMATED: there is no "pick one of two pedestals" grouping in the
        // engine, so the second boss item is simply offered alongside the
        // first; nothing stops a player taking both.
        onFloorClear: function (p, floor, ctx) {
          var r = room(ctx)
          if (!r || typeof IS.spawnPedestal !== 'function' || !fn(ctx, 'rollItem')) return
          var id = ctx.rollItem('boss', {})
          if (!id) return
          var cx = (r.pxW || 1040) / 2
          var cy = (r.pxH || 560) / 2
          IS.spawnPedestal(r, id, cx + 120, cy, {})
          sfx(ctx, 'pedestal-appear')
        }
      }
    },

    {
      id: 'bogo-bombs',
      num: 250,
      name: 'Bogo Bombs',
      desc: 'Bomb drops doubled',
      info: 'All bomb drops become double bombs',
      kind: 'passive',
      quality: 1,
      pools: ['shop'],
      tags: ['bombs', 'utility'],
      dlc: 'rebirth',
      hooks: {
        onPickup: function (p, kind, amount, ctx) {
          if (kind !== 'bomb' || !fn(ctx, 'addBombs')) return
          var c = cache(p)
          if (c.bogoBusy) return
          c.bogoBusy = true
          try {
            ctx.addBombs((typeof amount === 'number' && amount > 0) ? amount : 1)
          } finally { c.bogoBusy = false }
        }
      }
    },

    {
      id: 'starter-deck',
      num: 251,
      name: 'Starter Deck',
      desc: 'Pills become cards',
      info: 'Spawns 1 card · Picking up a pill also yields a card',
      kind: 'passive',
      quality: 1,
      pools: ['shop', 'greed-shop', 'crane-game'],
      tags: ['card', 'pill', 'utility'],
      dlc: 'rebirth',
      hooks: {
        onInit: function (p, ctx) {
          var c = cache(p)
          if (c.starterDeckGiven || !room(ctx)) return
          c.starterDeckGiven = true
          drop(p, ctx, 'card', 0)
        },
        // APPROXIMATED: pickup substitution and the second pocket slot are both
        // engine-owned (§4 fixes p.pocket's slot count), so "turns pills into
        // cards" is expressed as a card on top of the pill rather than instead
        // of it.
        onPickup: function (p, kind, amount, ctx) {
          if (kind !== 'pill' || !room(ctx)) return
          var c = cache(p)
          if (c.starterBusy) return
          c.starterBusy = true
          try { drop(p, ctx, 'card', 1) } finally { c.starterBusy = false }
        }
      }
    },

    {
      id: 'little-baggy',
      num: 252,
      name: 'Little Baggy',
      desc: 'Cards become pills',
      info: 'Spawns 1 pill · Picking up a card also yields a pill',
      kind: 'passive',
      quality: 1,
      pools: ['shop', 'greed-shop'],
      tags: ['pill', 'card', 'utility'],
      dlc: 'rebirth',
      grant: { pills: 1 },
      hooks: {
        // Same approximation as Starter Deck, mirrored.
        onPickup: function (p, kind, amount, ctx) {
          if (kind !== 'card' || !room(ctx)) return
          var c = cache(p)
          if (c.baggyBusy) return
          c.baggyBusy = true
          try { drop(p, ctx, 'pill', 1) } finally { c.baggyBusy = false }
        }
      }
    },

    {
      id: 'magic-scab',
      num: 253,
      name: 'Magic Scab',
      desc: 'Health and luck up',
      info: '+1 heart container · +1 luck · Heals 1 heart',
      kind: 'passive',
      quality: 2,
      pools: ['boss', 'greed-boss', 'ultra-secret'],
      tags: ['luck', 'hearts'],
      dlc: 'rebirth',
      stats: { luck: 1 },
      grant: { maxHearts: 2, heal: 2 }
    },

    {
      id: 'blood-clot',
      num: 254,
      name: 'Blood Clot',
      desc: 'The left eye hits harder',
      info: '+1 damage and +2.75 range on every other tear',
      kind: 'passive',
      quality: 1,
      pools: ['boss', 'greed-treasure', 'greed-boss', 'ultra-secret'],
      tags: ['damage', 'range'],
      dlc: 'rebirth',
      hooks: {
        // Isaac has no per-eye tear stream in this engine, so the left eye is
        // modelled as every second tear — the same average uplift.
        onTearFire: function (p, tear, ctx) {
          if (!p || !tear) return
          var c = cache(p)
          c.clotLeft = !c.clotLeft
          if (!c.clotLeft) return
          if (typeof tear.dmg === 'number') tear.dmg += 1
          if (typeof tear.life === 'number') {
            var range = (p.stats && p.stats.range) || 520
            tear.life *= 1 + 110 / Math.max(160, range)
          }
        }
      }
    },

    {
      id: 'screw',
      num: 255,
      name: 'Screw',
      desc: 'Tears and shot speed up',
      info: '+0.5 tears · +0.2 shot speed',
      kind: 'passive',
      quality: 2,
      pools: ['boss', 'golden-chest', 'greed-boss', 'crane-game'],
      tags: ['tears', 'offensive'],
      dlc: 'rebirth',
      stats: { tears: 0.5, shotSpeed: 0.2 }
    },

    {
      id: 'hot-bombs',
      num: 256,
      name: 'Hot Bombs',
      desc: 'Bombs leave fire',
      info: '+5 bombs · Bombs leave a burning patch · Fire immunity',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure', 'bomb-bum'],
      tags: ['bombs', 'offensive', 'defensive'],
      dlc: 'rebirth',
      grant: { bombs: 5 },
      hooks: {
        // APPROXIMATED: fireplaces are grid objects the ctx surface cannot
        // place, so the flame left behind is a damaging creep patch.
        onBombExplode: function (p, bomb, ctx) {
          if (!bomb || !room(ctx) || !fn(ctx, 'spawnCreep')) return
          ctx.spawnCreep(bomb.x, bomb.y, 58, {
            colour: '#e06a20', kind: 'red', dmg: 22, life: 22
          })
        },
        onPlayerDamage: function (p, amount, source, ctx) {
          if (!isFireSource(source)) return
          return { cancel: true }
        }
      }
    },

    {
      id: 'fire-mind',
      num: 257,
      name: 'Fire Mind',
      desc: 'Burning, bursting tears',
      info: 'Tears set enemies on fire · 10% chance to explode on impact (100% at 13 luck)',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure'],
      tags: ['offensive', 'tears', 'bombs'],
      dlc: 'rebirth',
      tearFlags: ['burn'],
      hooks: {
        onTearHit: function (p, tear, enemy, ctx) {
          if (!tear || !room(ctx) || !fn(ctx, 'bombExplode')) return
          if (!roll(ctx, 0.1, 0.9 / 13, 1)) return
          var dmg = 2 * ((p && p.stats && p.stats.damage) || 3.5) + 22
          ctx.bombExplode(tear.x, tear.y, { dmg: dmg, r: 72, friendly: false })
        }
      }
    },

    {
      id: 'missing-no',
      num: 258,
      name: 'Missing No.',
      desc: 'Rerolls everything',
      info: 'Rerolls all of Isaac’s items on pickup and on every new floor',
      kind: 'passive',
      quality: 0,
      pools: ['secret', 'greed-treasure', 'greed-secret'],
      tags: ['utility', 'quality-shift', 'downgrade'],
      dlc: 'rebirth',
      hooks: {
        // The reroll is queued rather than run inside onInit: rerollPlayerItems
        // removes and re-grants items, which would re-enter this hook.
        onInit: function (p, ctx) {
          cache(p).missingNoQueued = true
        },
        onUpdate: function (p, dt, ctx) {
          var c = cache(p)
          if (!c.missingNoQueued || c.missingNoBusy) return
          if (!fn(ctx, 'rerollPlayerItems')) { c.missingNoQueued = false; return }
          c.missingNoQueued = false
          c.missingNoBusy = true
          try { ctx.rerollPlayerItems() } finally { c.missingNoBusy = false }
        },
        onNewFloor: function (p, floor, ctx) {
          var c = cache(p)
          if (c.missingNoBusy) return
          c.missingNoQueued = true
        }
      }
    },

    {
      id: 'dark-matter',
      num: 259,
      name: 'Dark Matter',
      desc: 'Damage up, fear tears',
      info: '+1 damage · 33% chance to shoot fear tears (100% at 20 luck)',
      kind: 'passive',
      quality: 2,
      pools: ['devil', 'demon-beggar', 'greed-devil'],
      tags: ['damage', 'offensive', 'devil'],
      dlc: 'rebirth',
      stats: { damage: 1 },
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (roll(ctx, 0.33, 0.67 / 20, 1)) addTearFlag(tear, 'fear')
        }
      }
    },

    {
      id: 'black-candle',
      num: 260,
      name: 'Black Candle',
      desc: 'Immune to curses',
      info: 'Immune to curses · +1 black heart · +15% Devil/Angel Room chance',
      kind: 'passive',
      quality: 3,
      pools: ['shop', 'curse', 'greed-shop', 'greed-curse'],
      tags: ['curse', 'devil', 'angel', 'utility'],
      dlc: 'rebirth',
      stats: { devilChance: 0.15, angelChance: 0.15 },
      grant: { black: 2 },
      hooks: {
        onCurseEval: function (p, curses, ctx) {
          return 0
        }
      }
    },

    {
      id: 'proptosis',
      num: 261,
      name: 'Proptosis',
      desc: 'Point blank is triple',
      info: '+0.5 damage · Tears deal 3x damage up close and fade to nothing over 0.8 seconds',
      kind: 'passive',
      quality: 3,
      pools: ['treasure', 'greed-treasure', 'ultra-secret'],
      tags: ['damage', 'offensive', 'tears'],
      dlc: 'rebirth',
      stats: { damage: 0.5 },
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (!tear) return
          if (tear.propBase != null) return
          tear.propBase = (typeof tear.dmg === 'number')
            ? tear.dmg
            : ((p && p.stats && p.stats.damage) || 3.5)
          tear.propAge = 0
        },
        onUpdate: function (p, dt, ctx) {
          var r = room(ctx)
          if (!r || !Array.isArray(r.tears)) return
          for (var i = 0; i < r.tears.length; i++) {
            var t = r.tears[i]
            if (!t || t.propBase == null) continue
            t.propAge = (t.propAge || 0) + (dt || 0)
            var k = 3 * (1 - t.propAge / 0.8)
            t.dmg = Math.max(0, t.propBase * k)
          }
        }
      }
    },

    {
      id: 'missing-page-2',
      num: 262,
      name: 'Missing Page 2',
      desc: 'Low health hurts them',
      info: '+1 black heart · Being knocked to 1 heart damages every enemy in the room',
      kind: 'passive',
      quality: 2,
      pools: ['devil', 'secret', 'demon-beggar', 'greed-secret'],
      tags: ['devil', 'offensive', 'book'],
      dlc: 'rebirth',
      grant: { black: 2 },
      hooks: {
        // The black-heart damage doubling is applied by the engine where black
        // hearts resolve; this hook owns the low-health room nuke.
        onPlayerDamage: function (p, amount, source, ctx) {
          if (!p || typeof IS.totalHearts !== 'function') return
          var n = (typeof amount === 'number' && amount > 0) ? amount : 1
          if (IS.totalHearts(p) - n > 2) return
          hurtAll(p, ctx, 80, null, 0)
          sfx(ctx, 'curse-sting')
          if (fn(ctx, 'shake')) ctx.shake(6, 0.3)
        }
      }
    },

    {
      id: 'clear-rune',
      num: 263,
      name: 'Clear Rune',
      desc: 'Copies your rune',
      info: 'Spawns 1 rune · Triggers the rune Isaac is holding without spending it',
      kind: 'active',
      quality: 2,
      charge: 4,
      chargeType: 'normal',
      pools: ['secret', 'greed-secret', 'crane-game'],
      tags: ['consumable', 'utility'],
      dlc: 'repentance',
      rep: true,
      hooks: {
        onInit: function (p, ctx) {
          var c = cache(p)
          if (c.clearRuneGiven || !room(ctx)) return
          c.clearRuneGiven = true
          drop(p, ctx, 'rune', 0)
        },
        onUse: function (p, ctx) {
          if (!p || !Array.isArray(p.pocket) || !fn(ctx, 'useCard')) return { fail: true }
          for (var i = 0; i < p.pocket.length; i++) {
            var slot = p.pocket[i]
            if (!slot || !slot.id) continue
            if (slot.kind !== 'rune' && slot.kind !== 'soulstone') continue
            ctx.useCard(slot.id)
            sfx(ctx, 'card-use')
            return
          }
          return { fail: true }
        }
      }
    },

    {
      id: 'smart-fly',
      num: 264,
      name: 'Smart Fly',
      desc: 'An angry orbital fly',
      info: 'Orbital fly that attacks when Isaac takes damage · 6.5 contact damage/second',
      kind: 'familiar',
      quality: 2,
      pools: ['treasure', 'key-master', 'greed-treasure', 'baby-shop'],
      tags: ['familiar', 'fly', 'orbital'],
      dlc: 'rebirth',
      familiars: ['smart-fly'],
      hooks: {
        // APPROXIMATED: a familiar cannot change behaviour at runtime, so the
        // "breaks orbit and hunts" reaction is a short-lived charmed fly sent
        // after the enemies instead of the orbital itself leaving.
        onPlayerDamage: function (p, amount, source, ctx) {
          if (!room(ctx) || !fn(ctx, 'spawnFamiliar')) return
          ctx.spawnFamiliar('charmed-fly', { life: 7 })
        }
      }
    },

    {
      id: 'dry-baby',
      num: 265,
      name: 'Dry Baby',
      desc: 'A shot-eating skull',
      info: 'Blocks enemy shots · 10% chance to deal 40 damage to the whole room when it blocks',
      kind: 'familiar',
      quality: 1,
      pools: ['treasure', 'greed-treasure', 'baby-shop'],
      tags: ['familiar', 'defensive', 'baby'],
      dlc: 'rebirth',
      familiars: ['dry-baby'],
      transform: 'conjoined',
      hooks: {
        // APPROXIMATED: no hook reports a familiar blocking a shot, so the proc
        // watches for hostile shots arriving next to Isaac (where the shielder
        // sits) and rolls there, on a cooldown so one volley cannot chain.
        onUpdate: function (p, dt, ctx) {
          var r = room(ctx)
          if (!p || !r || !Array.isArray(r.shots)) return
          var c = cache(p)
          c.dryBabyT = (c.dryBabyT || 0) - (dt || 0)
          if (c.dryBabyT > 0) return
          for (var i = 0; i < r.shots.length; i++) {
            var s = r.shots[i]
            if (!s || s.dead || s.friendly) continue
            if (dist(p.x, p.y, s.x, s.y) > (p.r || 26) + (s.r || 8) + 34) continue
            c.dryBabyT = 0.5
            if (!chance(ctx, 0.1)) return
            hurtAll(p, ctx, 40, null, 0)
            sfx(ctx, 'curse-sting')
            return
          }
        }
      }
    },

    {
      id: 'juicy-sack',
      num: 266,
      name: 'Juicy Sack',
      desc: 'Slime and spiders',
      info: 'Leaves slowing creep · Spawns 1-2 blue spiders after each room is cleared',
      kind: 'familiar',
      quality: 2,
      pools: ['treasure', 'greed-treasure', 'baby-shop'],
      tags: ['familiar', 'spider', 'utility'],
      dlc: 'rebirth',
      familiars: ['juicy-sack'],
      transform: 'spider',
      hooks: {
        // The creep is laid under Isaac rather than under the sack: the sack is
        // a follower, so the trail lands in the same place either way.
        onUpdate: function (p, dt, ctx) {
          creepTrail(p, dt, ctx, 'juicyT', 0.22, 30, {
            colour: '#4a7a3a', kind: 'green', slow: 0.5, life: 12
          })
        },
        onRoomClear: function (p, r, ctx) {
          if (!room(ctx) || !fn(ctx, 'spawnFamiliar')) return
          var n = 1 + intOf(ctx, 2)
          for (var i = 0; i < n; i++) ctx.spawnFamiliar('blue-spider', { life: 0 })
        }
      }
    },

    {
      id: 'robo-baby-2-0',
      num: 267,
      name: 'Robo-Baby 2.0',
      desc: 'A steerable laser baby',
      info: 'Shoots lasers for 3.5 damage · Moves in the direction Isaac is firing',
      kind: 'familiar',
      quality: 2,
      pools: ['treasure', 'greed-treasure', 'crane-game', 'baby-shop'],
      tags: ['familiar', 'laser', 'baby'],
      dlc: 'rebirth',
      familiars: ['robo-baby-2-0'],
      transform: 'conjoined'
    },

    {
      id: 'rotten-baby',
      num: 268,
      name: 'Rotten Baby',
      desc: 'Firing spits blue flies',
      info: 'Spawns blue flies while Isaac shoots',
      kind: 'familiar',
      quality: 2,
      pools: ['treasure', 'devil', 'greed-treasure', 'greed-devil', 'baby-shop', 'rotten-beggar'],
      tags: ['familiar', 'fly', 'baby'],
      dlc: 'rebirth',
      familiars: ['rotten-baby'],
      transform: 'conjoined',
      hooks: {
        // The fly stream is driven from onTearFire (faithful to "when Isaac
        // shoots") rather than from a 'summoner' cadence, throttled so a high
        // fire rate cannot flood the room. The flies are given a lifetime for
        // the same reason.
        onTearFire: function (p, tear, ctx) {
          if (!p || !room(ctx) || !fn(ctx, 'spawnFamiliar')) return
          var c = cache(p)
          var now = (ctx.run && ctx.run.time) || 0
          if (c.rottenAt && now - c.rottenAt < 1.1 && now >= c.rottenAt) return
          c.rottenAt = now
          ctx.spawnFamiliar('blue-fly', { life: 18 })
        }
      }
    },

    {
      id: 'headless-baby',
      num: 269,
      name: 'Headless Baby',
      desc: 'A bleeding follower',
      info: 'Leaves creep that deals 6 damage per second',
      kind: 'familiar',
      quality: 2,
      pools: ['treasure', 'devil', 'greed-treasure', 'greed-devil', 'baby-shop'],
      tags: ['familiar', 'offensive', 'baby'],
      dlc: 'rebirth',
      familiars: ['headless-baby'],
      transform: 'conjoined',
      hooks: {
        onUpdate: function (p, dt, ctx) {
          creepTrail(p, dt, ctx, 'headlessT', 0.24, 30, {
            colour: '#9a2020', kind: 'red', dmg: 6, life: 10
          })
        }
      }
    },

    {
      id: 'leech',
      num: 270,
      name: 'Leech',
      desc: 'Feeds you on its kills',
      info: 'Chases enemies for 3.2 damage/second · Its kills heal half a heart',
      kind: 'familiar',
      quality: 1,
      pools: ['treasure', 'greed-devil', 'baby-shop'],
      tags: ['familiar', 'hearts', 'chaser'],
      dlc: 'rebirth',
      familiars: ['leech'],
      hooks: {
        // APPROXIMATED: onEnemyKill does not say which entity landed the kill,
        // so the heal is a luck-scaled roll on any kill, tuned to roughly the
        // share of kills a leech actually finishes.
        onEnemyKill: function (p, enemy, ctx) {
          if (!roll(ctx, 0.12, 0.01, 0.3)) return
          if (fn(ctx, 'healRed')) ctx.healRed(1)
          sfx(ctx, 'heart-pickup')
        }
      }
    },

    {
      id: 'mystery-sack',
      num: 271,
      name: 'Mystery Sack',
      desc: 'A sack of surprises',
      info: 'Spawns a random pickup every 5-6 rooms',
      kind: 'familiar',
      quality: 1,
      pools: ['treasure', 'secret', 'beggar', 'greed-treasure', 'greed-secret'],
      tags: ['familiar', 'utility', 'consumable'],
      dlc: 'rebirth',
      familiars: ['mystery-sack'],
      hooks: {
        onRoomClear: function (p, r, ctx) {
          if (!p || !room(ctx)) return
          var c = cache(p)
          if (!c.sackNeed) c.sackNeed = 5 + intOf(ctx, 2)
          c.sackCount = (c.sackCount || 0) + 1
          if (c.sackCount < c.sackNeed) return
          c.sackCount = 0
          c.sackNeed = 5 + intOf(ctx, 2)
          drop(p, ctx, pickOf(ctx, ['coin', 'key', 'bomb', 'heart', 'card', 'pill']) || 'coin', 1)
        }
      }
    },

    {
      id: 'bbf',
      num: 272,
      name: 'BBF',
      desc: 'A suicidal fly',
      info: 'Friendly fly that explodes for 100 damage · The blast can hurt Isaac',
      kind: 'familiar',
      quality: 2,
      pools: ['treasure', 'key-master', 'baby-shop'],
      tags: ['familiar', 'fly', 'bombs', 'offensive'],
      dlc: 'rebirth',
      familiars: ['bbf']
    },

    {
      id: 'bobs-brain',
      num: 273,
      name: "Bob's Brain",
      desc: 'A poisonous torpedo',
      info: 'Dashes where Isaac aims and explodes for 100 damage plus poison · The blast can hurt Isaac',
      kind: 'familiar',
      quality: 2,
      pools: ['treasure', 'greed-treasure', 'baby-shop', 'rotten-beggar'],
      tags: ['familiar', 'bombs', 'offensive'],
      dlc: 'rebirth',
      familiars: ['bobs-brain'],
      transform: 'bob'
    },

    {
      id: 'best-bud',
      num: 274,
      name: 'Best Bud',
      desc: 'A friend when it hurts',
      info: 'Taking damage summons an orbital fly for the room · 150 contact damage/second',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure', 'baby-shop'],
      tags: ['familiar', 'fly', 'defensive', 'offensive'],
      dlc: 'rebirth',
      hooks: {
        // The familiar def lives at the bottom of this file but is deliberately
        // not listed in `familiars`: it is summoned by damage, not by pickup,
        // and cleared again when Isaac leaves the room.
        onPlayerDamage: function (p, amount, source, ctx) {
          if (!room(ctx) || !fn(ctx, 'spawnFamiliar')) return
          var c = cache(p)
          if (c.bestBudOut) return
          c.bestBudOut = true
          ctx.spawnFamiliar('best-bud', { life: 0 })
          sfx(ctx, 'familiar-spawn')
        },
        onRoomEnter: function (p, r, ctx) {
          var c = cache(p)
          if (!c.bestBudOut) return
          c.bestBudOut = false
          if (typeof IS.removeFamiliar === 'function') IS.removeFamiliar(p, 'best-bud')
        }
      }
    },

    {
      id: 'lil-brimstone',
      num: 275,
      name: 'Lil Brimstone',
      desc: 'A tiny blood beam',
      info: 'Charges and fires a blood beam for 24 damage',
      kind: 'familiar',
      quality: 3,
      pools: ['treasure', 'devil', 'baby-shop'],
      tags: ['familiar', 'brimstone', 'laser', 'devil'],
      dlc: 'rebirth',
      familiars: ['lil-brimstone'],
      transform: 'conjoined'
    },

    {
      id: 'isaacs-heart',
      num: 276,
      name: "Isaac's Heart",
      desc: 'Your heart beats outside',
      info: 'A heart familiar carries Isaac’s vulnerability · It absorbs one hit per room and fires bursts of tears',
      kind: 'familiar',
      quality: 2,
      pools: ['treasure', 'ultra-secret'],
      tags: ['familiar', 'defensive', 'hearts'],
      dlc: 'rebirth',
      familiars: ['isaacs-heart'],
      // APPROXIMATED: the engine cannot move the player's hitbox onto a
      // familiar, so "Isaac becomes invincible, but the heart is the weak
      // point" is expressed with the engine's own shieldCount stat — one hit
      // per room lands on the heart instead of on Isaac. Declared rather than
      // written from a hook, because p.stats is never mutated from data.
      stats: { shieldCount: 1 }
    }

  ])

  // ---------------------------------------------------------------------------
  // Familiars owned by the collectibles above (ARCHITECTURE.md §7.3).
  //
  // `id` matches the granting item's id, and `sprite` matches `id`, so the
  // sprite phase registers exactly one draw function per familiar. The params
  // keys are the contract documented at the top of js/data/familiars.js:
  // speed is units/second, dmg is in player damage units (a base tear is 3.5),
  // fireDelay and cooldown are seconds, hp 0 means indestructible, life 0 means
  // it lasts for the run.
  // ---------------------------------------------------------------------------

  IS.defineFamiliars([

    {
      id: 'guppys-hairball',
      name: "Guppy's Hairball",
      sprite: 'guppys-hairball',
      behaviour: 'orbital',
      params: {
        r: 18, speed: 300, flying: false,
        orbitR: 96, orbitSpeed: 3.1,
        dmg: 5, cooldown: 0.2,
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'abel',
      name: 'Abel',
      sprite: 'abel',
      behaviour: 'follower',
      params: {
        r: 16, speed: 330, flying: false,
        dmg: 3.5, fireDelay: 0.55, range: 520,
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'guillotine',
      name: 'Guillotine',
      sprite: 'guillotine',
      behaviour: 'orbitShooter',
      params: {
        r: 20, speed: 300, flying: true,
        orbitR: 84, orbitSpeed: 2.2,
        dmg: 7, fireDelay: 0.5, range: 520, cooldown: 0.25,
        hp: 0, blockShots: true, life: 0
      }
    },

    {
      id: 'ball-of-bandages',
      name: 'Ball of Bandages',
      sprite: 'ball-of-bandages',
      behaviour: 'orbital',
      params: {
        r: 16, speed: 300, flying: true,
        orbitR: 70, orbitSpeed: 2.4,
        dmg: 7, cooldown: 0.25,
        tearFlags: ['charm'],
        hp: 0, blockShots: true, life: 0
      }
    },

    {
      id: 'smart-fly',
      name: 'Smart Fly',
      sprite: 'smart-fly',
      behaviour: 'orbital',
      params: {
        r: 12, speed: 300, flying: true,
        orbitR: 66, orbitSpeed: 2.8,
        dmg: 1.5, cooldown: 0.23,
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'dry-baby',
      name: 'Dry Baby',
      sprite: 'dry-baby',
      behaviour: 'shielder',
      params: {
        r: 16, speed: 340, flying: false,
        dmg: 2, cooldown: 0.5,
        hp: 0, blockShots: true, life: 0
      }
    },

    {
      id: 'juicy-sack',
      name: 'Juicy Sack',
      sprite: 'juicy-sack',
      behaviour: 'buffer',
      params: {
        r: 16, speed: 320, flying: false,
        dmg: 0,
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'robo-baby-2-0',
      name: 'Robo-Baby 2.0',
      sprite: 'robo-baby-2-0',
      behaviour: 'laserFamiliar',
      params: {
        r: 16, speed: 340, flying: false,
        dmg: 3.5, fireDelay: 0.6, range: 560,
        tearFlags: ['laser'],
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'rotten-baby',
      name: 'Rotten Baby',
      sprite: 'rotten-baby',
      behaviour: 'buffer',
      params: {
        r: 16, speed: 320, flying: false,
        dmg: 0,
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'headless-baby',
      name: 'Headless Baby',
      sprite: 'headless-baby',
      behaviour: 'buffer',
      params: {
        r: 16, speed: 320, flying: false,
        dmg: 0,
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'leech',
      name: 'Leech',
      sprite: 'leech',
      behaviour: 'chaser',
      params: {
        r: 15, speed: 300, flying: false,
        dmg: 1.5, range: 900, cooldown: 0.47,
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'mystery-sack',
      name: 'Mystery Sack',
      sprite: 'mystery-sack',
      behaviour: 'buffer',
      params: {
        r: 16, speed: 315, flying: false,
        dmg: 0,
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'bbf',
      name: 'BBF',
      sprite: 'bbf',
      behaviour: 'chaser',
      params: {
        r: 14, speed: 430, flying: true,
        dmg: 100, range: 1000, cooldown: 2.4,
        tearFlags: ['explosive'],
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'bobs-brain',
      name: "Bob's Brain",
      sprite: 'bobs-brain',
      behaviour: 'chaser',
      params: {
        r: 17, speed: 470, flying: false,
        dmg: 100, range: 700, cooldown: 2.2,
        tearFlags: ['explosive', 'poison'],
        status: 'poison', statusSecs: 5,
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      // Summoned by Best Bud when Isaac is hit, and removed on room change —
      // hence no `familiars` entry on the item.
      id: 'best-bud',
      name: 'Best Bud',
      sprite: 'best-bud',
      behaviour: 'orbital',
      params: {
        r: 15, speed: 300, flying: true,
        orbitR: 104, orbitSpeed: 2.6,
        dmg: 10, cooldown: 0.07,
        hp: 0, blockShots: true, life: 0
      }
    },

    {
      id: 'lil-brimstone',
      name: 'Lil Brimstone',
      sprite: 'lil-brimstone',
      behaviour: 'laserFamiliar',
      params: {
        r: 17, speed: 330, flying: false,
        dmg: 20, fireDelay: 2.4, range: 620,
        tearFlags: ['brimstone', 'piercing'],
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'isaacs-heart',
      name: "Isaac's Heart",
      sprite: 'isaacs-heart',
      behaviour: 'follower',
      params: {
        r: 18, speed: 340, flying: true,
        dmg: 3.5, fireDelay: 0.45, range: 520,
        hp: 0, blockShots: true, life: 0
      }
    }

  ])

})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
