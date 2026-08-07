;(function (IS) {
  'use strict'

  // ---------------------------------------------------------------------------
  // ISUCK — collectibles 1..92 (The Sad Onion … Super Bandage).
  //
  // Source of truth for ids, nums, names and descriptions:
  //   docs/reference/slices/items-1.json
  //
  // Conversions applied to the reference `stats` block (ARCHITECTURE.md §4.1):
  //   tears -> stats.tears      tearsMult  -> mult.tears
  //   damage -> stats.damage    damageMult -> mult.damage
  //   (range + rangeHeight) * 40 -> stats.range      // one of our tiles is 80
  //   shotSpeed/speed/luck -> stats.*                // additive, base 1 / 1 / 0
  //   maxHearts/soul/black * 2 -> grant.*            // we count half-hearts
  //
  // The reference's range/shotSpeed numbers already fold in the multipliers the
  // description prints ("x2 Range multiplier", "x1.6 Shot speed multiplier"), so
  // those lines get no separate `mult` entry — cross-checked against Roid Rage,
  // Mom's Lipstick and Number One, which all line up only under that reading.
  //
  // Two source pool names are outside IS.POOL_LIST: 'shell-game' (Skatole, The
  // Poop) is mapped to 'beggar', the closest thing we model. Otherwise `pools`
  // is copied verbatim — including the items whose only listed pools are greed
  // or crane-game — so the eight item files cannot drift from the reference.
  // The three deliberate exceptions keep `pools: []`: collectible slots 43 and
  // 61 do not exist in the real game and slot 59 is a duplicate Book of Belial,
  // so none of them may ever roll.
  //
  // Hook discipline (the validator invokes hooks with a null room and a ctx
  // whose `room` may be unset): every room/floor hook opens by testing its
  // argument, and every world query opens by testing `ctx.room` *before* the
  // call, not just its return value.
  // ---------------------------------------------------------------------------

  var TAU = Math.PI * 2

  // Shared re-entrancy guard. Mom's Eye, Loki's Horns and Tammy's Head all
  // spawn tears from inside a tear-spawning path; if ctx.spawnTear re-enters
  // onTearFire this keeps the cascade to one generation.
  var echoing = false

  // Bad-pill conversion is claimed by both PHD and Lucky Foot. Both hooks fire
  // for the same pill in the same frame, so the swap is tokenised on
  // (pill id, run time) — a genuine second use of the same pill later in the
  // run has a different time and converts again.
  var lastPillSwap = null
  var pillSwapping = false

  function cacheOf (p) {
    if (!p) return null
    if (!p.cache) p.cache = {}
    return p.cache
  }

  function statOf (p, key, dflt) {
    return (p && p.stats && typeof p.stats[key] === 'number') ? p.stats[key] : dflt
  }

  function recalc (p) {
    if (p && typeof IS.recalcStats === 'function') IS.recalcStats(p)
  }

  // Unit aim vector. p.head is the aim direction; fall back to "down" so an
  // active used while not firing still goes somewhere sensible.
  function aim (p) {
    var h = p && p.head
    var x = (h && typeof h.x === 'number') ? h.x : 0
    var y = (h && typeof h.y === 'number') ? h.y : 0
    var l = Math.sqrt(x * x + y * y)
    if (!(l > 0.001)) return { x: 0, y: 1 }
    return { x: x / l, y: y / l }
  }

  function roomCentre (ctx) {
    var room = ctx && ctx.room
    var w = (room && room.pxW) || IS.ROOM_PX_W
    var h = (room && room.pxH) || IS.ROOM_PX_H
    return { x: w / 2, y: h / 2 }
  }

  // --- guarded world queries -------------------------------------------------

  function enemiesOf (ctx) {
    if (!ctx || !ctx.room || typeof ctx.livingEnemies !== 'function') return []
    var es
    try { es = ctx.livingEnemies() } catch (e) { return [] }
    return Array.isArray(es) ? es : []
  }

  function pickupsOf (ctx) {
    if (!ctx || !ctx.room || typeof ctx.pickups !== 'function') return []
    var ps
    try { ps = ctx.pickups() } catch (e) { return [] }
    return Array.isArray(ps) ? ps : []
  }

  function gridsOf (ctx) {
    if (!ctx || !ctx.room || typeof ctx.gridObjects !== 'function') return []
    var gs
    try { gs = ctx.gridObjects() } catch (e) { return [] }
    return Array.isArray(gs) ? gs : []
  }

  function hurtEnemy (e, dmg, p, ctx) {
    if (!e || e.dead || typeof IS.damageEnemy !== 'function') return
    IS.damageEnemy(e, dmg, { src: p }, ctx)
  }

  function statusAll (ctx, status, secs) {
    var es = enemiesOf(ctx)
    if (typeof ctx.applyStatus !== 'function') return 0
    var n = 0
    for (var i = 0; i < es.length; i++) {
      var e = es[i]
      if (!e || e.dead || e.friendly) continue
      ctx.applyStatus(e, status, secs)
      n++
    }
    return n
  }

  // Contact damage: everything the player is currently overlapping. Used by The
  // Virus, Mom's Heels, The Nail and My Little Unicorn, each on its own tick
  // interval so the per-second figure in the description comes out right.
  function touchDamage (p, ctx, dmg, status, secs) {
    var es = enemiesOf(ctx)
    var pr = (p && p.r) || IS.PLAYER_R
    for (var i = 0; i < es.length; i++) {
      var e = es[i]
      if (!e || e.dead || e.friendly) continue
      var rr = pr + ((e.r || 20)) + 6
      var dx = (e.x || 0) - p.x
      var dy = (e.y || 0) - p.y
      if (dx * dx + dy * dy > rr * rr) continue
      if (status && typeof ctx.applyStatus === 'function') ctx.applyStatus(e, status, secs || 4)
      hurtEnemy(e, dmg, p, ctx)
    }
  }

  // Fires `fn` once every `interval` seconds, keyed on a cache slot.
  function everyTick (p, dt, key, interval, fn) {
    var c = cacheOf(p)
    if (!c) return
    c[key] = (c[key] || 0) + dt
    if (c[key] < interval) return
    c[key] = 0
    fn()
  }

  // --- borrowed player flags -------------------------------------------------
  // A temporary flag is only ever removed if *we* were the one who added it, so
  // a permanent source of the same flag can never be stripped. The recalc on
  // return lets the engine reinstate anything an item legitimately grants.

  function lendFlag (p, flag, key) {
    var c = cacheOf(p)
    if (!c || !p.flags || typeof p.flags.has !== 'function') return
    if (p.flags.has(flag)) return
    c[key] = true
    p.flags.add(flag)
  }

  function returnFlag (p, flag, key) {
    var c = cacheOf(p)
    if (!c || !c[key]) return
    c[key] = false
    if (p.flags && typeof p.flags.delete === 'function') p.flags.delete(flag)
    recalc(p)
  }

  // --- extra tears -----------------------------------------------------------

  function tearFlagsOf (tear) {
    var f = tear && tear.flags
    if (!f) return []
    if (Array.isArray(f)) return f.slice()
    if (typeof f.forEach === 'function') {
      var out = []
      f.forEach(function (v) { out.push(v) })
      return out
    }
    return []
  }

  function extraTear (ctx, tear, vx, vy) {
    if (echoing || !ctx || typeof ctx.spawnTear !== 'function' || !tear) return null
    echoing = true
    var out = null
    try {
      out = ctx.spawnTear({
        x: tear.x, y: tear.y, vx: vx, vy: vy,
        dmg: tear.dmg, r: tear.r, life: tear.life,
        height: tear.height, sprite: tear.sprite,
        friendly: true, flags: tearFlagsOf(tear)
      })
    } finally {
      echoing = false
    }
    return out
  }

  // --- bad pill conversion (PHD, Lucky Foot) ---------------------------------

  function swapBadPill (p, pillId, ctx) {
    if (pillSwapping || !ctx) return undefined
    var def = IS.pillsById && IS.pillsById[pillId]
    if (!def || def.good !== false) return undefined

    var t = (ctx.run && typeof ctx.run.time === 'number') ? ctx.run.time : 0
    if (lastPillSwap && lastPillSwap.id === pillId && lastPillSwap.t === t) return { cancel: true }

    var good = []
    var list = IS.pills || []
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].good && list[i].id !== pillId) good.push(list[i].id)
    }
    if (!good.length) return undefined
    lastPillSwap = { id: pillId, t: t }

    var pick = (typeof ctx.pick === 'function') ? ctx.pick(good) : good[0]
    pillSwapping = true
    try {
      if (pick && typeof ctx.usePill === 'function') ctx.usePill(pick)
    } finally {
      pillSwapping = false
    }
    if (typeof ctx.floater === 'function') ctx.floater('Good pill!', p.x, p.y, '#e0d040')
    // onPillUse has no documented return contract, unlike onCardUse. We return
    // {cancel:true} anyway: if the engine honours it the bad effect is skipped,
    // and if it ignores it the good pill we just used still lands on top.
    return { cancel: true }
  }

  // --- Cube of Meat ladder ---------------------------------------------------
  // Each copy upgrades the previous familiar rather than adding one, so the
  // familiar is managed by hook instead of the declarative `familiars` key.

  var CUBE_STAGES = ['cube-of-meat', 'cube-of-meat-2', 'cube-of-meat-3', 'cube-of-meat-4']

  function syncCube (p, ctx) {
    if (!ctx || !ctx.room || typeof ctx.spawnFamiliar !== 'function') return
    if (typeof IS.removeFamiliar === 'function') {
      for (var i = 0; i < CUBE_STAGES.length; i++) IS.removeFamiliar(p, CUBE_STAGES[i])
    }
    var n = (typeof IS.itemCount === 'function') ? IS.itemCount(p, 'cube-of-meat') : 1
    if (!(n > 0)) return
    if (n > 4) n = 4
    ctx.spawnFamiliar(CUBE_STAGES[n - 1])
  }

  // Skatole / fly-family detection. Enemy defs carry no tag vocabulary, so the
  // family is matched on id — every fly variant in the game has "fly" in its
  // name, and Pooter/Moter are the two flying shooters that do not.
  function isFlyEnemy (e) {
    var id = String((e && e.id) || '')
    return id.indexOf('fly') >= 0 || id === 'pooter' || id === 'moter' ||
      id === 'super-pooter' || id === 'tainted-pooter'
  }

  // ===========================================================================
  // Familiars owned by items in this file (ARCHITECTURE.md §7.3). `sprite`
  // always equals `id`; the params keys are the contract documented at the top
  // of js/data/familiars.js.
  //
  // APPROXIMATED, once, for every contact familiar below: the descriptions give
  // Isaac's figures ("75 contact damage per second"), which assume Isaac's
  // 15-tick damage clock. js/data/familiars.js sets this engine's scale — a
  // blue fly is 3 damage every 0.35s, ~9 dps, about one base player's output —
  // so contact numbers here are converted into that scale relative to a blue
  // fly rather than copied literally, which would make a single orbital
  // stronger than the player.
  // ===========================================================================

  IS.defineFamiliars([

    {
      id: 'brother-bobby',
      name: 'Brother Bobby',
      sprite: 'brother-bobby',
      behaviour: 'follower',
      params: {
        r: 16, speed: 330, flying: true,
        dmg: 3.5, fireDelay: 0.6, range: 520,
        hp: 0, blockShots: false, life: 0
      }
    },

    // Two orbitals, so two defs: a repeated entry in an item's `familiars`
    // array would depend on whether the engine de-duplicates by id.
    {
      id: 'halo-of-flies',
      name: 'Halo of Flies',
      sprite: 'halo-of-flies',
      behaviour: 'orbital',
      params: {
        r: 12, speed: 300, flying: true,
        orbitR: 68, orbitSpeed: 2.3,
        dmg: 0, cooldown: 1,
        hp: 0, blockShots: true, life: 0
      }
    },
    {
      id: 'halo-of-flies-2',
      name: 'Halo of Flies',
      sprite: 'halo-of-flies-2',
      behaviour: 'orbital',
      params: {
        r: 12, speed: 300, flying: true,
        orbitR: 86, orbitSpeed: 1.9,
        dmg: 0, cooldown: 1,
        hp: 0, blockShots: true, life: 0
      }
    },

    {
      id: 'distant-admiration',
      name: 'Distant Admiration',
      sprite: 'distant-admiration',
      behaviour: 'orbital',
      params: {
        r: 14, speed: 300, flying: true,
        orbitR: 134, orbitSpeed: 1.5,
        dmg: 5, cooldown: 0.2,
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'sister-maggy',
      name: 'Sister Maggy',
      sprite: 'sister-maggy',
      behaviour: 'follower',
      params: {
        r: 17, speed: 315, flying: true,
        dmg: 6, fireDelay: 0.75, range: 520,
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'little-chubby',
      name: 'Little Chubby',
      sprite: 'little-chubby',
      behaviour: 'chaser',
      params: {
        r: 22, speed: 560, flying: false,
        dmg: 4, range: 1000, cooldown: 0.3,
        hp: 0, blockShots: true, life: 0
      }
    },

    // Cube of Meat, one def per level.
    {
      id: 'cube-of-meat',
      name: 'Cube of Meat',
      sprite: 'cube-of-meat',
      behaviour: 'orbital',
      params: {
        r: 18, speed: 300, flying: true,
        orbitR: 76, orbitSpeed: 2.4,
        dmg: 4, cooldown: 0.25,
        hp: 0, blockShots: true, life: 0
      }
    },
    {
      id: 'cube-of-meat-2',
      name: 'Shooting Cube of Meat',
      sprite: 'cube-of-meat-2',
      behaviour: 'orbitShooter',
      params: {
        r: 19, speed: 300, flying: true,
        orbitR: 80, orbitSpeed: 2.2,
        dmg: 4.5, fireDelay: 0.8, range: 480, cooldown: 0.25,
        hp: 0, blockShots: true, life: 0
      }
    },
    {
      id: 'cube-of-meat-3',
      name: 'Meat Boy',
      sprite: 'cube-of-meat-3',
      behaviour: 'chaser',
      params: {
        r: 22, speed: 420, flying: false,
        dmg: 6, range: 1100, cooldown: 0.35,
        hp: 0, blockShots: true, life: 0
      }
    },
    {
      id: 'cube-of-meat-4',
      name: 'Super Meat Boy',
      sprite: 'cube-of-meat-4',
      behaviour: 'chaser',
      params: {
        r: 25, speed: 540, flying: false,
        dmg: 9, range: 1300, cooldown: 0.3,
        hp: 0, blockShots: true, life: 0
      }
    }

  ])

  // ===========================================================================
  // Collectibles
  // ===========================================================================

  IS.defineItems([

    {
      id: 'the-sad-onion',
      num: 1,
      name: 'The Sad Onion',
      desc: 'Tears up',
      info: '↑ +0.7 Tears',
      kind: 'passive',
      quality: 1,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure', 'crane-game'],
      tags: ['tears', 'offensive'],
      stats: { tears: 0.72 }
    },

    {
      id: 'the-inner-eye',
      num: 2,
      name: 'The Inner Eye',
      desc: 'Triple shot',
      info: '↓ x0.51 Fire rate multiplier · Isaac shoots 3 tears at once',
      kind: 'passive',
      quality: 3,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure'],
      tags: ['tears', 'offensive'],
      mult: { tears: 0.51 },
      stats: { multishot: 2 }
    },

    {
      id: 'spoon-bender',
      num: 3,
      name: 'Spoon Bender',
      desc: 'Homing tears',
      info: 'Homing tears',
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure', 'crane-game'],
      tags: ['tears', 'offensive'],
      tearFlags: ['homing']
    },

    {
      id: 'crickets-head',
      num: 4,
      name: "Cricket's Head",
      desc: 'Damage up',
      info: '↑ +0.5 Damage · ↑ x1.5 Damage multiplier',
      kind: 'passive',
      quality: 3,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure', 'crane-game'],
      tags: ['damage', 'offensive'],
      stats: { damage: 0.5 },
      mult: { damage: 1.5 }
    },

    {
      id: 'my-reflection',
      num: 5,
      name: 'My Reflection',
      desc: 'Boomerang tears',
      info: '↑ +1.5 Damage · ↑ +1.5 Range · ↑ x2 Range multiplier · ↑ x1.6 Shot speed multiplier · ↓ -1 Luck · Tears get a boomerang effect',
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure', 'crane-game'],
      tags: ['damage', 'range', 'offensive'],
      // The reference stats block omits the damage and luck lines the
      // description prints; the description is the specification, so both are
      // declared here. range/shotSpeed already contain the printed multipliers.
      stats: { damage: 1.5, range: 256, shotSpeed: 0.6, luck: -1 },
      tearFlags: ['boomerang']
    },

    {
      id: 'number-one',
      num: 6,
      name: 'Number One',
      desc: 'Tears up, range down',
      info: '↑ +1.5 Tears · ↓ -1.5 Range · ↓ x0.8 Range multiplier',
      kind: 'passive',
      quality: 1,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure'],
      tags: ['tears', 'range', 'stat-down'],
      stats: { tears: 1.75, range: -82 }
    },

    {
      id: 'blood-of-the-martyr',
      num: 7,
      name: 'Blood of the Martyr',
      desc: 'Damage up',
      info: '↑ +1 Damage · x1.5 damage from The Book of Belial',
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      pools: ['treasure', 'angel', 'greed-treasure', 'greed-angel', 'wooden-chest'],
      tags: ['damage', 'offensive', 'angel'],
      // The Book of Belial reads this item in its own onStats.
      stats: { damage: 1 }
    },

    {
      id: 'brother-bobby',
      num: 8,
      name: 'Brother Bobby',
      desc: 'Familiar that shoots tears',
      info: 'Shoots normal tears · Deals 3.5 damage per tear',
      kind: 'familiar',
      quality: 2,
      dlc: 'rebirth',
      pools: ['treasure', 'devil', 'greed-treasure', 'baby-shop'],
      tags: ['familiar', 'follower', 'offensive'],
      transform: 'conjoined',
      familiars: ['brother-bobby']
    },

    {
      id: 'skatole',
      num: 9,
      name: 'Skatole',
      desc: 'Flies are friendly',
      info: 'All fly enemies are friendly',
      kind: 'passive',
      quality: 1,
      dlc: 'rebirth',
      // source pool 'shell-game' -> 'beggar'
      pools: ['beggar'],
      tags: ['fly', 'utility'],
      hooks: {
        onRoomEnter: function (p, room, ctx) {
          if (!room || !ctx) return
          var es = enemiesOf(ctx)
          if (typeof ctx.applyStatus !== 'function') return
          for (var i = 0; i < es.length; i++) {
            if (isFlyEnemy(es[i])) ctx.applyStatus(es[i], 'charm', 600)
          }
        },
        // Flies spawned mid-fight (Duke of Flies, Mulligan) have to be caught
        // too, so the charm is refreshed on a slow tick.
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room || typeof ctx.applyStatus !== 'function') return
          everyTick(p, dt, 'skatoleT', 0.5, function () {
            var es = enemiesOf(ctx)
            for (var i = 0; i < es.length; i++) {
              if (isFlyEnemy(es[i])) ctx.applyStatus(es[i], 'charm', 600)
            }
          })
        }
      }
    },

    {
      id: 'halo-of-flies',
      num: 10,
      name: 'Halo of Flies',
      desc: 'Two fly orbitals',
      info: '+2 Fly orbitals · Blocks enemy projectiles',
      kind: 'familiar',
      quality: 2,
      dlc: 'rebirth',
      pools: ['treasure', 'key-master', 'greed-treasure', 'baby-shop'],
      tags: ['familiar', 'orbital', 'fly', 'defensive'],
      // Non-damaging by design: these two block shots, they do not hit.
      familiars: ['halo-of-flies', 'halo-of-flies-2']
    },

    {
      id: '1up',
      num: 11,
      name: '1up!',
      desc: 'Extra life',
      info: '↑ +1 Life · Isaac respawns with full health on death',
      kind: 'passive',
      quality: 3,
      dlc: 'rebirth',
      pools: ['secret', 'greed-shop', 'greed-secret'],
      tags: ['revive', 'hearts'],
      transform: 'fun-guy',
      hooks: {
        onPlayerDeath: function (p, ctx) {
          var c = cacheOf(p)
          if (!c) return undefined
          var have = (typeof IS.itemCount === 'function') ? IS.itemCount(p, '1up') : 1
          var used = c.oneUpUsed || 0
          if (used >= Math.max(1, have)) return undefined
          c.oneUpUsed = used + 1
          var h = p.hearts
          if (h) {
            h.rotten = 0
            if (typeof ctx.healRed === 'function') ctx.healRed(Math.max(2, h.maxRed || 2))
          }
          if (ctx && typeof ctx.sfx === 'function') ctx.sfx('heart-pickup')
          return { revive: true }
        }
      }
    },

    {
      id: 'magic-mushroom',
      num: 12,
      name: 'Magic Mushroom',
      desc: 'All stats up',
      info: '↑ +1 Health · ↑ +0.3 Speed · ↑ +0.3 Damage · ↑ x1.5 Damage multiplier · ↑ +2.5 Range · Size up · Full health',
      kind: 'passive',
      quality: 4,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure', 'greed-boss', 'ultra-secret'],
      tags: ['damage', 'speed', 'range', 'hearts', 'mushroom'],
      transform: 'fun-guy',
      stats: { damage: 0.3, range: 80, speed: 0.3 },
      mult: { damage: 1.5 },
      grant: { maxHearts: 2, heal: 24 },
      hooks: {
        // "Size up" is a body-scale change; p.r is the only part of it with
        // gameplay meaning (a bigger hitbox), so that is what is applied.
        onInit: function (p) {
          var c = cacheOf(p)
          if (!c || c.magicMushR) return
          c.magicMushR = p.r || IS.PLAYER_R
          p.r = Math.min(40, c.magicMushR * 1.25)
        },
        onRemove: function (p) {
          var c = cacheOf(p)
          if (!c || !c.magicMushR) return
          p.r = c.magicMushR
          c.magicMushR = 0
        }
      }
    },

    {
      id: 'the-virus',
      num: 13,
      name: 'The Virus',
      desc: 'Poison touch',
      info: '↑ +0.2 Speed · Touching enemies poisons them · Isaac deals 48 contact damage per second',
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      pools: ['treasure', 'demon-beggar', 'greed-treasure', 'ultra-secret'],
      tags: ['speed', 'offensive', 'syringe'],
      transform: 'spun',
      stats: { speed: 0.2 },
      hooks: {
        // 12 damage four times a second = the stated 48/s.
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          everyTick(p, dt, 'virusT', 0.25, function () {
            touchDamage(p, ctx, 12, 'poison', 6)
          })
        }
      }
    },

    {
      id: 'roid-rage',
      num: 14,
      name: 'Roid Rage',
      desc: 'Speed and range up',
      info: '↑ +0.3 Speed · ↑ +2.5 Range',
      kind: 'passive',
      quality: 1,
      dlc: 'rebirth',
      pools: ['treasure', 'boss', 'demon-beggar', 'greed-boss'],
      tags: ['speed', 'range', 'syringe'],
      transform: 'spun',
      stats: { range: 80, speed: 0.3 }
    },

    {
      id: '3',
      num: 15,
      name: '<3',
      desc: 'Health up',
      info: '↑ +1 Health · Full health',
      kind: 'passive',
      quality: 1,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-boss', 'ultra-secret'],
      tags: ['hearts', 'defensive'],
      grant: { maxHearts: 2, heal: 24 }
    },

    {
      id: 'raw-liver',
      num: 16,
      name: 'Raw Liver',
      desc: 'Two health up',
      info: '↑ +2 Health · Full health',
      kind: 'passive',
      quality: 1,
      dlc: 'rebirth',
      pools: ['secret', 'greed-boss', 'greed-secret'],
      tags: ['hearts', 'defensive'],
      grant: { maxHearts: 4, heal: 24 }
    },

    {
      id: 'skeleton-key',
      num: 17,
      name: 'Skeleton Key',
      desc: '+99 keys',
      info: '+99 Keys',
      kind: 'passive',
      quality: 1,
      dlc: 'rebirth',
      pools: ['treasure', 'secret', 'greed-secret'],
      tags: ['keys', 'utility'],
      grant: { keys: 99 }
    },

    {
      id: 'a-dollar',
      num: 18,
      name: 'A Dollar',
      desc: '+100 coins',
      info: '+100 Coins',
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      // reference pools are empty; a money item belongs where money is spent
      pools: ['shop', 'golden-chest'],
      tags: ['coins', 'utility'],
      grant: { coins: 100 }
    },

    {
      id: 'boom',
      num: 19,
      name: 'Boom!',
      desc: '+10 bombs',
      info: '+10 Bombs',
      kind: 'passive',
      quality: 1,
      dlc: 'rebirth',
      pools: ['treasure'],
      tags: ['bombs', 'utility'],
      grant: { bombs: 10 }
    },

    {
      id: 'transcendence',
      num: 20,
      name: 'Transcendence',
      desc: 'Flight',
      info: 'Flight',
      kind: 'passive',
      quality: 3,
      dlc: 'rebirth',
      pools: ['secret', 'greed-secret'],
      tags: ['utility', 'defensive'],
      flags: ['flying']
    },

    {
      id: 'the-compass',
      num: 21,
      name: 'The Compass',
      desc: 'Reveals map icons',
      info: 'Reveals icons on the map · Does not reveal the layout of the map',
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      pools: ['shop', 'beggar', 'crane-game'],
      tags: ['utility'],
      // 'seeMinimap' is the icon-level reveal; Treasure Map takes
      // 'fullMinimap', which is the layout-level one.
      flags: ['seeMinimap']
    },

    {
      id: 'lunch',
      num: 22,
      name: 'Lunch',
      desc: 'Health up',
      info: '↑ +1 Health · Heals 1 heart',
      kind: 'passive',
      quality: 0,
      dlc: 'rebirth',
      pools: ['boss', 'beggar', 'greed-boss'],
      tags: ['hearts'],
      grant: { maxHearts: 2, heal: 2 }
    },

    {
      id: 'dinner',
      num: 23,
      name: 'Dinner',
      desc: 'Health up',
      info: '↑ +1 Health · Heals 1 heart',
      kind: 'passive',
      quality: 0,
      dlc: 'rebirth',
      pools: ['boss', 'beggar', 'greed-boss'],
      tags: ['hearts'],
      grant: { maxHearts: 2, heal: 2 }
    },

    {
      id: 'dessert',
      num: 24,
      name: 'Dessert',
      desc: 'Health up',
      info: '↑ +1 Health · Heals 1 heart',
      kind: 'passive',
      quality: 0,
      dlc: 'rebirth',
      pools: ['boss', 'beggar', 'greed-boss'],
      tags: ['hearts'],
      grant: { maxHearts: 2, heal: 2 }
    },

    {
      id: 'breakfast',
      num: 25,
      name: 'Breakfast',
      desc: 'Health up',
      info: '↑ +1 Health · Heals 1 heart',
      kind: 'passive',
      quality: 0,
      dlc: 'rebirth',
      pools: ['boss', 'beggar', 'greed-boss'],
      tags: ['hearts'],
      grant: { maxHearts: 2, heal: 2 }
    },

    {
      id: 'rotten-meat',
      num: 26,
      name: 'Rotten Meat',
      desc: 'Health up',
      info: '↑ +1 Health · Heals 1 heart',
      kind: 'passive',
      quality: 0,
      dlc: 'rebirth',
      pools: ['boss', 'beggar', 'greed-boss', 'rotten-beggar'],
      tags: ['hearts'],
      grant: { maxHearts: 2, heal: 2 }
    },

    {
      id: 'wooden-spoon',
      num: 27,
      name: 'Wooden Spoon',
      desc: 'Speed up',
      info: '↑ +0.3 Speed',
      kind: 'passive',
      quality: 1,
      dlc: 'rebirth',
      pools: ['boss', 'greed-boss', 'wooden-chest'],
      tags: ['speed'],
      stats: { speed: 0.3 }
    },

    {
      id: 'the-belt',
      num: 28,
      name: 'The Belt',
      desc: 'Speed up',
      info: '↑ +0.3 Speed',
      kind: 'passive',
      quality: 1,
      dlc: 'rebirth',
      pools: ['boss', 'golden-chest', 'greed-boss'],
      tags: ['speed'],
      stats: { speed: 0.3 }
    },

    {
      id: 'moms-underwear',
      num: 29,
      name: "Mom's Underwear",
      desc: 'Range up, blue flies',
      info: '↑ +2.5 Range · Spawns 3-6 blue flies',
      kind: 'passive',
      quality: 1,
      dlc: 'rebirth',
      pools: ['boss', 'golden-chest', 'moms-chest', 'greed-boss', 'old-chest'],
      tags: ['range', 'fly'],
      transform: 'mom',
      stats: { range: 80 },
      hooks: {
        onInit: function (p, ctx) {
          var c = cacheOf(p)
          if (!c || c.underwearFlies) return
          if (!ctx || !ctx.room || typeof ctx.spawnFamiliar !== 'function') return
          c.underwearFlies = true
          var n = 3 + ((typeof ctx.int === 'function') ? ctx.int(4) : 1)
          for (var i = 0; i < n; i++) ctx.spawnFamiliar('blue-fly')
          if (typeof ctx.sfx === 'function') ctx.sfx('familiar-spawn')
        }
      }
    },

    {
      id: 'moms-heels',
      num: 30,
      name: "Mom's Heels",
      desc: 'Range up, stomp',
      info: '↑ +2.5 Range · Isaac deals 24 contact damage per second',
      kind: 'passive',
      quality: 1,
      dlc: 'rebirth',
      pools: ['boss', 'moms-chest', 'greed-boss', 'ultra-secret', 'old-chest'],
      tags: ['range', 'offensive'],
      transform: 'mom',
      stats: { range: 80 },
      hooks: {
        // 12 damage twice a second = the stated 24/s.
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          everyTick(p, dt, 'heelsT', 0.5, function () {
            touchDamage(p, ctx, 12)
          })
        }
      }
    },

    {
      id: 'moms-lipstick',
      num: 31,
      name: "Mom's Lipstick",
      desc: 'Range up',
      info: '↑ +3.75 Range · Spawns 1 random heart',
      kind: 'passive',
      quality: 1,
      dlc: 'rebirth',
      pools: ['boss', 'moms-chest', 'greed-boss', 'ultra-secret', 'old-chest'],
      tags: ['range', 'hearts'],
      transform: 'mom',
      stats: { range: 110 },
      hooks: {
        onInit: function (p, ctx) {
          var c = cacheOf(p)
          if (!c || c.lipstickHeart) return
          if (!ctx || !ctx.room || typeof ctx.spawnPickup !== 'function') return
          c.lipstickHeart = true
          ctx.spawnPickup('heart', p.x, p.y)
        }
      }
    },

    {
      id: 'wire-coat-hanger',
      num: 32,
      name: 'Wire Coat Hanger',
      desc: 'Tears up',
      info: '↑ +0.7 Tears',
      kind: 'passive',
      quality: 1,
      dlc: 'rebirth',
      pools: ['boss', 'golden-chest', 'greed-boss', 'crane-game'],
      tags: ['tears'],
      stats: { tears: 0.72 }
    },

    {
      id: 'the-bible',
      num: 33,
      name: 'The Bible',
      desc: 'Flight for the room',
      info: "Flight for the room · Kills Mom's Foot and Mom's Heart instantly · Kills Isaac when used on Satan",
      kind: 'active',
      quality: 2,
      charge: 4,
      dlc: 'rebirth',
      pools: ['shop', 'angel', 'library'],
      tags: ['book', 'angel', 'utility'],
      // The Bible counts toward Seraphim *and* Bookworm in the real game;
      // `transform` is a single field, so the book half is kept.
      transform: 'bookworm',
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx) return { fail: true }
          var es = enemiesOf(ctx)
          var i, e, id
          for (i = 0; i < es.length; i++) {
            e = es[i]
            if (!e || !e.boss) continue
            id = String(e.id || '')
            if (id === 'satan') {
              if (typeof ctx.sfx === 'function') ctx.sfx('curse-sting')
              if (typeof IS.killPlayer === 'function') IS.killPlayer(p, ctx)
              else if (typeof ctx.damagePlayer === 'function') ctx.damagePlayer(99, 'the-bible')
              return undefined
            }
          }
          for (i = 0; i < es.length; i++) {
            e = es[i]
            if (!e || !e.boss) continue
            id = String(e.id || '')
            if (id.indexOf('mom') === 0 || id === 'it-lives') {
              hurtEnemy(e, (e.maxHp || 9999) * 2, p, ctx)
            }
          }
          lendFlag(p, 'flying', 'bibleFlight')
          if (typeof ctx.sfx === 'function') ctx.sfx('holy-shield')
          return undefined
        },
        onUpdate: function (p) {
          var c = cacheOf(p)
          if (c && c.bibleFlight && p.flags && typeof p.flags.add === 'function') p.flags.add('flying')
        },
        onRoomEnter: function (p, room) {
          if (!room) return
          returnFlag(p, 'flying', 'bibleFlight')
        }
      }
    },

    {
      id: 'the-book-of-belial',
      num: 34,
      name: 'The Book of Belial',
      desc: 'Damage up for the room',
      info: '+12.5% Devil/Angel Room chance while held · Receive for the room: ↑ +2 Damage',
      kind: 'active',
      quality: 3,
      charge: 3,
      dlc: 'rebirth',
      pools: ['devil', 'library', 'greed-treasure', 'greed-devil'],
      tags: ['book', 'devil', 'damage'],
      transform: 'bookworm',
      stats: { devilChance: 0.125, angelChance: 0.125 },
      hooks: {
        onUse: function (p, ctx) {
          var c = cacheOf(p)
          if (!c) return { fail: true }
          c.belialRoom = true
          recalc(p)
          if (ctx && typeof ctx.sfx === 'function') ctx.sfx('devil-deal')
          return undefined
        },
        onStats: function (p, s) {
          if (!p || !p.cache || !p.cache.belialRoom || !s) return
          s.damage += 2
          // Blood of the Martyr turns the flat bonus into a multiplier.
          if (typeof IS.hasItem === 'function' && IS.hasItem(p, 'blood-of-the-martyr')) s.damage *= 1.5
        },
        onRoomEnter: function (p, room) {
          if (!room) return
          var c = cacheOf(p)
          if (!c || !c.belialRoom) return
          c.belialRoom = false
          recalc(p)
        }
      }
    },

    {
      id: 'the-necronomicon',
      num: 35,
      name: 'The Necronomicon',
      desc: 'Damages every enemy',
      info: 'Deals 40 damage to all enemies in the room',
      kind: 'active',
      quality: 2,
      charge: 6,
      dlc: 'rebirth',
      pools: ['devil', 'secret', 'library', 'greed-treasure', 'greed-devil', 'greed-secret'],
      tags: ['book', 'devil', 'offensive'],
      transform: 'bookworm',
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx) return { fail: true }
          var es = enemiesOf(ctx)
          for (var i = 0; i < es.length; i++) {
            if (es[i] && !es[i].friendly) hurtEnemy(es[i], 40, p, ctx)
          }
          if (typeof ctx.shake === 'function') ctx.shake(7, 0.3)
          if (typeof ctx.sfx === 'function') ctx.sfx('curse-sting')
          return undefined
        }
      }
    },

    {
      id: 'the-poop',
      num: 36,
      name: 'The Poop',
      desc: 'Drops a poop',
      info: 'Spawns one poop and knocks back enemies · Can be bombed next to a pit to make a bridge',
      kind: 'active',
      quality: 0,
      charge: 1,
      dlc: 'rebirth',
      // source pool 'shell-game' -> 'beggar'
      pools: ['treasure', 'beggar'],
      tags: ['poop', 'utility'],
      // The source lists a 'poop' transformation; we do not model one.
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx) return { fail: true }
          if (typeof ctx.spawnPoop === 'function') ctx.spawnPoop(p.x, p.y + 48)
          var es = enemiesOf(ctx)
          for (var i = 0; i < es.length; i++) {
            var e = es[i]
            if (!e || e.dead) continue
            var dx = (e.x || 0) - p.x
            var dy = (e.y || 0) - p.y
            if (dx * dx + dy * dy > 150 * 150) continue
            if (typeof IS.knockback === 'function') IS.knockback(e, p.x, p.y, 340)
          }
          if (typeof ctx.sfx === 'function') ctx.sfx('fart')
          return undefined
        }
      }
    },

    {
      id: 'mr-boom',
      num: 37,
      name: 'Mr. Boom',
      desc: 'Drops a big bomb',
      info: 'Drops a large bomb below Isaac which deals 185 damage',
      kind: 'active',
      quality: 1,
      charge: 3,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure', 'bomb-bum'],
      tags: ['bombs', 'offensive'],
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || typeof ctx.spawnBomb !== 'function') return { fail: true }
          ctx.spawnBomb(p.x, p.y + 30, { fuse: 1.8, dmg: 185, r: 135, friendly: true })
          if (typeof ctx.sfx === 'function') ctx.sfx('bomb-fuse')
          return undefined
        }
      }
    },

    {
      id: 'tammys-head',
      num: 38,
      name: "Tammy's Head",
      desc: 'Ring of tears',
      info: "Shoots 10 tears in a circle around Isaac · The tears copy Isaac's tear effects, plus 25 damage",
      kind: 'active',
      quality: 2,
      charge: 3,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure', 'crane-game'],
      tags: ['offensive', 'tears'],
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || typeof ctx.spawnTear !== 'function') return { fail: true }
          var base = (typeof IS.tearBaseOpts === 'function') ? (IS.tearBaseOpts(p) || {}) : {}
          var speed = IS.TEAR_SPEED * statOf(p, 'shotSpeed', 1)
          var dmg = statOf(p, 'damage', IS.BASE_DAMAGE) + 25
          echoing = true
          try {
            for (var i = 0; i < 10; i++) {
              var a = (i / 10) * TAU
              var o = {}
              for (var k in base) o[k] = base[k]
              o.x = p.x
              o.y = p.y
              o.vx = Math.cos(a) * speed
              o.vy = Math.sin(a) * speed
              o.dmg = dmg
              o.friendly = true
              ctx.spawnTear(o)
            }
          } finally {
            echoing = false
          }
          if (typeof ctx.sfx === 'function') ctx.sfx('tear-fire')
          return undefined
        }
      }
    },

    {
      id: 'moms-bra',
      num: 39,
      name: "Mom's Bra",
      desc: 'Petrifies the room',
      info: 'Petrifies all enemies in the room for 4 seconds',
      kind: 'active',
      quality: 1,
      charge: 4,
      dlc: 'rebirth',
      pools: ['treasure', 'moms-chest', 'old-chest'],
      tags: ['utility', 'defensive'],
      transform: 'mom',
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx) return { fail: true }
          statusAll(ctx, 'petrify', 4)
          if (typeof ctx.sfx === 'function') ctx.sfx('curse-sting')
          return undefined
        }
      }
    },

    {
      id: 'kamikaze',
      num: 40,
      name: 'Kamikaze!',
      desc: 'Explode on the spot',
      info: "Causes a big explosion at Isaac's location · Deals 185 damage · Costs half a heart",
      kind: 'active',
      quality: 0,
      charge: 0,
      chargeType: 'normal',
      dlc: 'rebirth',
      pools: ['treasure', 'ultra-secret'],
      tags: ['bombs', 'offensive', 'chargeless'],
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || typeof ctx.bombExplode !== 'function') return { fail: true }
          // friendly:true so the blast itself does not hurt Isaac twice — the
          // half-heart cost is applied explicitly.
          ctx.bombExplode(p.x, p.y, { dmg: 185, r: 135, friendly: true })
          if (typeof ctx.damagePlayer === 'function') ctx.damagePlayer(1, 'kamikaze')
          if (typeof ctx.shake === 'function') ctx.shake(9, 0.35)
          return undefined
        }
      }
    },

    {
      id: 'moms-pad',
      num: 41,
      name: "Mom's Pad",
      desc: 'Fears the room',
      info: 'Fears all enemies in the room for 4 seconds · Spawns a blue fly',
      kind: 'active',
      quality: 1,
      charge: 4,
      dlc: 'rebirth',
      pools: ['treasure', 'moms-chest', 'old-chest'],
      tags: ['utility', 'fly'],
      transform: 'mom',
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx) return { fail: true }
          statusAll(ctx, 'fear', 4)
          if (ctx.room && typeof ctx.spawnFamiliar === 'function') ctx.spawnFamiliar('blue-fly')
          if (typeof ctx.sfx === 'function') ctx.sfx('fart')
          return undefined
        }
      }
    },

    {
      id: 'bobs-rotten-head',
      num: 42,
      name: "Bob's Rotten Head",
      desc: 'Throws a poison bomb',
      info: "Throws the head in the firing direction · It explodes and leaves a poison cloud · Deals Isaac's damage + 185",
      kind: 'active',
      quality: 2,
      charge: 3,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure', 'rotten-beggar'],
      tags: ['bombs', 'offensive'],
      transform: 'bob',
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || typeof ctx.spawnBomb !== 'function') return { fail: true }
          var d = aim(p)
          var b = ctx.spawnBomb(p.x + d.x * 150, p.y + d.y * 150, {
            fuse: 0.9,
            dmg: statOf(p, 'damage', IS.BASE_DAMAGE) + 185,
            r: 125,
            flags: ['poison'],
            friendly: true
          })
          if (b) b.bobRottenHead = true
          if (typeof ctx.sfx === 'function') ctx.sfx('bomb-fuse')
          return undefined
        },
        // The cloud is spawned when the head actually lands, not on use.
        onBombExplode: function (p, bomb, ctx) {
          if (!bomb || !bomb.bobRottenHead || !ctx || typeof ctx.spawnCreep !== 'function') return
          ctx.spawnCreep(bomb.x, bomb.y, 105, { kind: 'green', colour: '#6d9a3a', dmg: 5, life: 9 })
        }
      }
    },

    {
      // Collectible slot 43 does not exist in the real game; the reference
      // carries an empty name, which the content gate rejects, so it gets a
      // placeholder name and no pool. It can never roll.
      id: 'item-43',
      num: 43,
      name: 'Item 43',
      desc: 'Does not exist',
      info: '<item does not exist>',
      kind: 'passive',
      quality: 0,
      dlc: 'rebirth',
      pools: [],
      tags: []
    },

    {
      id: 'teleport',
      num: 44,
      name: 'Teleport!',
      desc: 'Teleports to a random room',
      info: 'Teleports Isaac into a random room, except I AM ERROR rooms',
      kind: 'active',
      quality: 2,
      charge: 4,
      dlc: 'rebirth',
      pools: ['treasure', 'crane-game'],
      tags: ['utility'],
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || typeof ctx.teleport !== 'function') return { fail: true }
          // ctx.teleport(target); 'random' is the room-picking target, as
          // opposed to the named targets the cards use.
          ctx.teleport('random')
          if (typeof ctx.sfx === 'function') ctx.sfx('secret-found')
          return undefined
        }
      }
    },

    {
      id: 'yum-heart',
      num: 45,
      name: 'Yum Heart',
      desc: 'Heals one heart',
      info: 'Heals 1 heart',
      kind: 'active',
      quality: 2,
      charge: 4,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure', 'ultra-secret'],
      tags: ['hearts', 'defensive'],
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || typeof ctx.healRed !== 'function') return { fail: true }
          ctx.healRed(2)
          if (typeof ctx.sfx === 'function') ctx.sfx('heart-pickup')
          return undefined
        }
      }
    },

    {
      id: 'lucky-foot',
      num: 46,
      name: 'Lucky Foot',
      desc: 'Luck up',
      info: '↑ +1 Luck · Better gambling odds · Bad pills become good ones',
      kind: 'passive',
      quality: 3,
      dlc: 'rebirth',
      pools: ['treasure', 'beggar', 'greed-shop', 'crane-game'],
      tags: ['luck', 'pill', 'utility'],
      stats: { luck: 1 },
      // 'luckyFooting' is the engine-side gambling/room-drop bonus.
      flags: ['luckyFooting'],
      hooks: {
        onPillUse: function (p, pillId, ctx) {
          return swapBadPill(p, pillId, ctx)
        }
      }
    },

    {
      id: 'doctors-remote',
      num: 47,
      name: "Doctor's Remote",
      desc: 'Calls in a missile',
      info: "A missile lands after 1.5 seconds and deals 20x Isaac's damage",
      kind: 'active',
      quality: 2,
      charge: 4,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure', 'crane-game'],
      tags: ['offensive', 'bombs'],
      hooks: {
        // APPROXIMATED: there is no player-driven crosshair in the ctx surface,
        // so the strike is aimed at a random enemy, or 200 units along the
        // firing direction when the room is empty. The 1.5s delay is real.
        onUse: function (p, ctx) {
          var c = cacheOf(p)
          if (!c || !ctx) return { fail: true }
          var es = enemiesOf(ctx)
          var t = (es.length && typeof ctx.pick === 'function') ? ctx.pick(es) : null
          var d = aim(p)
          c.remoteX = t ? t.x : p.x + d.x * 200
          c.remoteY = t ? t.y : p.y + d.y * 200
          c.remoteT = 1.5
          if (typeof ctx.sfx === 'function') ctx.sfx('beep')
          return undefined
        },
        onUpdate: function (p, dt, ctx) {
          var c = cacheOf(p)
          if (!c || !(c.remoteT > 0)) return
          c.remoteT -= dt
          if (c.remoteT > 0) return
          c.remoteT = 0
          if (!ctx || !ctx.room || typeof ctx.bombExplode !== 'function') return
          ctx.bombExplode(c.remoteX, c.remoteY, {
            dmg: statOf(p, 'damage', IS.BASE_DAMAGE) * 20, r: 110, friendly: true
          })
          if (typeof ctx.shake === 'function') ctx.shake(8, 0.3)
        },
        onRoomEnter: function (p, room) {
          if (!room) return
          var c = cacheOf(p)
          if (c) c.remoteT = 0
        }
      }
    },

    {
      id: 'cupids-arrow',
      num: 48,
      name: "Cupid's Arrow",
      desc: 'Piercing tears',
      info: 'Piercing tears',
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure', 'crane-game'],
      tags: ['tears', 'offensive'],
      tearFlags: ['piercing']
    },

    {
      id: 'shoop-da-whoop',
      num: 49,
      name: 'Shoop da Whoop!',
      desc: 'Fires a beam',
      info: "The next shot is replaced with a beam · It deals 24x Isaac's damage over 0.83 seconds",
      kind: 'active',
      quality: 2,
      charge: 2,
      dlc: 'rebirth',
      pools: ['treasure', 'crane-game', 'ultra-secret'],
      tags: ['laser', 'offensive'],
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || typeof ctx.spawnLaser !== 'function') return { fail: true }
          var d = aim(p)
          ctx.spawnLaser({
            x: p.x, y: p.y,
            angle: Math.atan2(d.y, d.x),
            len: 1100,
            // The beam ticks for its whole life; 2x per tick over 0.83s is the
            // stated 24x total.
            dmg: statOf(p, 'damage', IS.BASE_DAMAGE) * 2,
            width: 28,
            life: 0.83,
            brimstone: false,
            thick: true,
            friendly: true
          })
          if (typeof ctx.sfx === 'function') ctx.sfx('laser-fire')
          return undefined
        }
      }
    },

    {
      id: 'steven',
      num: 50,
      name: 'Steven',
      desc: 'Damage up',
      info: '↑ +1 Damage',
      kind: 'passive',
      quality: 1,
      dlc: 'rebirth',
      pools: ['greed-treasure'],
      tags: ['damage'],
      stats: { damage: 1 }
    },

    {
      id: 'pentagram',
      num: 51,
      name: 'Pentagram',
      desc: 'Damage up, deal chance up',
      info: '↑ +1 Damage · +10% Devil/Angel Room chance',
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      pools: ['boss', 'devil', 'demon-beggar', 'curse', 'greed-curse', 'greed-devil', 'crane-game', 'ultra-secret'],
      tags: ['damage', 'devil'],
      transform: 'leviathan',
      stats: { damage: 1, devilChance: 0.1, angelChance: 0.1 }
    },

    {
      id: 'dr-fetus',
      num: 52,
      name: 'Dr. Fetus',
      desc: 'Shoots bombs',
      info: "↓ x0.4 Fire rate multiplier · Isaac shoots bombs instead of tears · Bombs deal 10x tear damage, or 5x + 30 above 60",
      kind: 'passive',
      quality: 3,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure'],
      tags: ['bombs', 'offensive'],
      mult: { tears: 0.4 },
      tearFlags: ['explosive'],
      hooks: {
        // The bomb-damage curve is piecewise, so it cannot be a flat mult.
        // Pure and recalc-safe: the stat block is rebuilt from base every time.
        onStats: function (p, s) {
          if (!s || typeof s.damage !== 'number') return
          var full = s.damage * 10
          s.damage = full > 60 ? s.damage * 5 + 30 : full
        }
      }
    },

    {
      id: 'magneto',
      num: 53,
      name: 'Magneto',
      desc: 'Attracts pickups',
      info: 'Pickups are attracted to Isaac · Opens chests from 2 tiles away',
      kind: 'passive',
      quality: 1,
      dlc: 'rebirth',
      pools: ['treasure', 'ultra-secret'],
      tags: ['utility'],
      hooks: {
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          var ps = pickupsOf(ctx)
          for (var i = 0; i < ps.length; i++) {
            var pk = ps[i]
            if (!pk || pk.taken || pk.dead || pk.price > 0) continue
            var dx = p.x - (pk.x || 0)
            var dy = p.y - (pk.y || 0)
            var d = Math.sqrt(dx * dx + dy * dy)
            if (d > 900) continue
            if (pk.kind === 'chest' && d < 160 && !pk.opened) {
              if (typeof IS.openChest === 'function') IS.openChest(ctx.room, pk, ctx)
              continue
            }
            if (d > 4) {
              pk.x += (dx / d) * 220 * dt
              pk.y += (dy / d) * 220 * dt
            }
          }
        }
      }
    },

    {
      id: 'treasure-map',
      num: 54,
      name: 'Treasure Map',
      desc: 'Reveals the floor',
      info: 'Reveals the floor layout · Does not reveal room icons',
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      pools: ['shop', 'beggar'],
      tags: ['utility'],
      flags: ['fullMinimap']
    },

    {
      id: 'moms-eye',
      num: 55,
      name: "Mom's Eye",
      desc: 'Chance to shoot backwards',
      info: '50% chance to shoot an extra tear backwards · 100% chance at 5 luck',
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      pools: ['treasure', 'moms-chest', 'greed-treasure', 'old-chest'],
      tags: ['tears', 'offensive'],
      transform: 'mom',
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (!tear || !ctx || typeof ctx.roll !== 'function') return
          // 50% base, reaching 100% at 5 luck.
          if (!ctx.roll(0.5, 0.1, 1)) return
          extraTear(ctx, tear, -(tear.vx || 0), -(tear.vy || 0))
        }
      }
    },

    {
      id: 'lemon-mishap',
      num: 56,
      name: 'Lemon Mishap',
      desc: 'Spills damaging creep',
      info: 'Spills a pool of creep · The creep deals 24 damage per second',
      kind: 'active',
      quality: 1,
      charge: 2,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure'],
      tags: ['offensive', 'utility'],
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || typeof ctx.spawnCreep !== 'function') return { fail: true }
          // No yellow creep kind exists; 'green' is the damaging one, recoloured.
          ctx.spawnCreep(p.x, p.y, 95, { kind: 'green', colour: '#e6dc46', dmg: 24, life: 24 })
          if (typeof ctx.sfx === 'function') ctx.sfx('fart')
          return undefined
        }
      }
    },

    {
      id: 'distant-admiration',
      num: 57,
      name: 'Distant Admiration',
      desc: 'Fly orbital',
      info: 'Mid-range fly orbital · Deals 75 contact damage per second',
      kind: 'familiar',
      quality: 2,
      dlc: 'rebirth',
      pools: ['treasure', 'key-master', 'greed-treasure', 'baby-shop'],
      tags: ['familiar', 'orbital', 'fly', 'offensive'],
      familiars: ['distant-admiration']
    },

    {
      id: 'book-of-shadows',
      num: 58,
      name: 'Book of Shadows',
      desc: 'Invincibility',
      info: 'Invincibility for 10 seconds',
      kind: 'active',
      quality: 2,
      charge: 4,
      dlc: 'rebirth',
      pools: ['treasure', 'library'],
      tags: ['book', 'defensive'],
      transform: 'bookworm',
      hooks: {
        onUse: function (p, ctx) {
          var c = cacheOf(p)
          if (!c) return { fail: true }
          c.shadowsT = 10
          if (ctx && typeof ctx.sfx === 'function') ctx.sfx('holy-shield')
          return undefined
        },
        onUpdate: function (p, dt) {
          var c = cacheOf(p)
          if (!c || !(c.shadowsT > 0)) return
          c.shadowsT -= dt
          if (c.shadowsT < 0) c.shadowsT = 0
        },
        onPlayerDamage: function (p) {
          var c = cacheOf(p)
          if (c && c.shadowsT > 0) return { cancel: true }
          return undefined
        }
      }
    },

    {
      // Collectible slot 59 is a duplicate Book of Belial the real game never
      // hands out. Kept for numbering, deliberately in no pool.
      id: 'the-book-of-belial-59',
      num: 59,
      name: 'The Book of Belial',
      desc: 'Deal chance up',
      info: '+12.5% Devil/Angel Room chance while held',
      kind: 'passive',
      quality: 1,
      dlc: 'rebirth',
      pools: [],
      tags: ['book', 'devil'],
      stats: { devilChance: 0.125, angelChance: 0.125 }
    },

    {
      id: 'the-ladder',
      num: 60,
      name: 'The Ladder',
      desc: 'Cross one-tile gaps',
      info: 'Allows Isaac to cross 1-tile gaps',
      kind: 'passive',
      quality: 0,
      dlc: 'rebirth',
      pools: ['shop', 'wooden-chest'],
      tags: ['utility'],
      hooks: {
        // APPROXIMATED: there is no "bridge a pit" action in the ctx surface, so
        // the pit crossing is done by lending flight while Isaac is standing
        // next to a pit and taking it back the moment he is not. The lend/return
        // pair only ever removes the flag it added, so permanent flight from
        // another item is never stripped.
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          var gs = gridsOf(ctx)
          var near = false
          for (var i = 0; i < gs.length; i++) {
            var g = gs[i]
            if (!g) continue
            var kind = g.kind || g.type
            if (kind !== 'pit' && kind !== 'pit-bridge') continue
            var dx = (g.x || 0) - p.x
            var dy = (g.y || 0) - p.y
            if (dx * dx + dy * dy < 130 * 130) { near = true; break }
          }
          if (near) lendFlag(p, 'flying', 'ladderLift')
          else returnFlag(p, 'flying', 'ladderLift')
        }
      }
    },

    {
      // Collectible slot 61 does not exist in the real game — see slot 43.
      id: 'item-61',
      num: 61,
      name: 'Item 61',
      desc: 'Does not exist',
      info: '<item does not exist>',
      kind: 'passive',
      quality: 0,
      dlc: 'rebirth',
      pools: [],
      tags: []
    },

    {
      id: 'charm-of-the-vampire',
      num: 62,
      name: 'Charm of the Vampire',
      desc: 'Kills heal you',
      info: '↑ +0.3 Damage · Killing 13 enemies heals half a heart',
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure'],
      tags: ['damage', 'hearts', 'defensive'],
      stats: { damage: 0.3 },
      hooks: {
        onEnemyKill: function (p, enemy, ctx) {
          var c = cacheOf(p)
          if (!c || !ctx) return
          c.vampKills = (c.vampKills || 0) + 1
          if (c.vampKills < 13) return
          c.vampKills = 0
          if (typeof ctx.healRed === 'function') ctx.healRed(1)
          if (typeof ctx.sfx === 'function') ctx.sfx('heart-pickup')
        }
      }
    },

    {
      id: 'the-battery',
      num: 63,
      name: 'The Battery',
      desc: 'Double charge actives',
      info: 'Active items can be overcharged to two full charges',
      kind: 'passive',
      quality: 3,
      dlc: 'rebirth',
      pools: ['shop', 'battery-bum', 'greed-shop', 'crane-game'],
      tags: ['battery', 'charge', 'utility'],
      // Engine-owned, not a no-op: ARCHITECTURE.md §4 gives every active slot a
      // `batteryCharge` field alongside `charge`/`maxCharge`, and IS.addCharge
      // is the single funnel that fills it. Overcharge therefore belongs to
      // js/engine/player.js keyed on this id; a hook here could only duplicate
      // it and would fight the engine's own clamping.
      hooks: {}
    },

    {
      id: 'steam-sale',
      num: 64,
      name: 'Steam Sale',
      desc: 'Shop items cost less',
      info: 'Shop items cost 50% less',
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      pools: ['shop', 'greed-treasure'],
      tags: ['shop', 'coins', 'utility'],
      hooks: {
        // Prices are marked down once per shop, and stack per copy held
        // (1/2^n, as the real item does).
        onRoomEnter: function (p, room, ctx) {
          if (!room || room.type !== 'shop') return
          if (!room.meta) room.meta = {}
          if (room.meta.steamSale) return
          room.meta.steamSale = true
          var n = (typeof IS.itemCount === 'function') ? IS.itemCount(p, 'steam-sale') : 1
          var f = Math.pow(0.5, Math.max(1, n))
          var list = room.pickups || []
          var cut = 0
          for (var i = 0; i < list.length; i++) {
            var e = list[i]
            if (!e || typeof e.price !== 'number' || !(e.price > 0)) continue
            e.price = Math.max(1, Math.floor(e.price * f))
            cut++
          }
          if (cut && ctx && typeof ctx.sfx === 'function') ctx.sfx('coin')
        }
      }
    },

    {
      id: 'anarchist-cookbook',
      num: 65,
      name: 'Anarchist Cookbook',
      desc: 'Spawns troll bombs',
      info: 'Spawns 6 Troll Bombs near the center of the room',
      kind: 'active',
      quality: 1,
      charge: 4,
      dlc: 'rebirth',
      pools: ['treasure', 'library', 'greed-treasure'],
      tags: ['book', 'bombs', 'offensive'],
      transform: 'bookworm',
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room || typeof ctx.spawnBomb !== 'function') return { fail: true }
          var c = roomCentre(ctx)
          var dmg = statOf(p, 'bombDamage', IS.BASE_BOMB_DAMAGE)
          for (var i = 0; i < 6; i++) {
            var a = (typeof ctx.range === 'function') ? ctx.range(0, TAU) : (i / 6) * TAU
            var rr = (typeof ctx.range === 'function') ? ctx.range(20, 150) : 90
            // Troll bombs are not friendly — they hurt Isaac too.
            ctx.spawnBomb(c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr, {
              fuse: (typeof ctx.range === 'function') ? ctx.range(1.4, 3) : 2,
              dmg: dmg, r: 110, friendly: false
            })
          }
          if (typeof ctx.sfx === 'function') ctx.sfx('bomb-fuse')
          return undefined
        }
      }
    },

    {
      id: 'the-hourglass',
      num: 66,
      name: 'The Hourglass',
      desc: 'Slows enemies',
      info: 'Slows enemies down for 8 seconds',
      kind: 'active',
      quality: 1,
      charge: 4,
      dlc: 'rebirth',
      pools: ['treasure', 'crane-game'],
      tags: ['utility', 'defensive'],
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx) return { fail: true }
          statusAll(ctx, 'slow', 8)
          if (typeof ctx.sfx === 'function') ctx.sfx('charge-up')
          return undefined
        }
      }
    },

    {
      id: 'sister-maggy',
      num: 67,
      name: 'Sister Maggy',
      desc: 'Familiar that shoots tears',
      info: 'Shoots normal tears · Deals 6 damage per tear',
      kind: 'familiar',
      quality: 2,
      dlc: 'rebirth',
      pools: ['treasure', 'devil', 'greed-treasure', 'greed-devil', 'ultra-secret', 'baby-shop'],
      tags: ['familiar', 'follower', 'offensive'],
      transform: 'conjoined',
      familiars: ['sister-maggy']
    },

    {
      id: 'technology',
      num: 68,
      name: 'Technology',
      desc: 'Laser tears',
      info: 'Isaac shoots piercing lasers instead of tears',
      kind: 'passive',
      quality: 3,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure', 'greed-devil', 'crane-game'],
      tags: ['laser', 'offensive'],
      // The 'laser' player flag is what replaces the shot; piercing is the
      // laser's own property.
      flags: ['laser'],
      tearFlags: ['piercing']
    },

    {
      id: 'chocolate-milk',
      num: 69,
      name: 'Chocolate Milk',
      desc: 'Chargeable tears',
      info: 'Chargeable tears · Damage scales with charge time, up to 4x',
      kind: 'passive',
      quality: 3,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure'],
      tags: ['damage', 'tears', 'offensive'],
      // APPROXIMATED: the engine has no charge-shot state, so the item is
      // modelled as its sustained full-charge shot — the 4x damage and the
      // 2.5x delay that come with it — which is how it plays when held down.
      mult: { damage: 4, tears: 0.4 }
    },

    {
      id: 'growth-hormones',
      num: 70,
      name: 'Growth Hormones',
      desc: 'Damage and speed up',
      info: '↑ +0.2 Speed · ↑ +1 Damage',
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      pools: ['boss', 'demon-beggar', 'greed-boss'],
      tags: ['damage', 'speed', 'syringe'],
      transform: 'spun',
      stats: { damage: 1, speed: 0.2 }
    },

    {
      id: 'mini-mush',
      num: 71,
      name: 'Mini Mush',
      desc: 'Size down',
      info: '↑ +0.3 Speed · ↑ +2.5 Range · Size down',
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-boss'],
      tags: ['speed', 'range', 'mushroom'],
      transform: 'fun-guy',
      stats: { range: 120, speed: 0.3 },
      hooks: {
        // Size down is a smaller hitbox — the part of it that matters.
        onInit: function (p) {
          var c = cacheOf(p)
          if (!c || c.miniMushR) return
          c.miniMushR = p.r || IS.PLAYER_R
          p.r = Math.max(14, c.miniMushR * 0.7)
        },
        onRemove: function (p) {
          var c = cacheOf(p)
          if (!c || !c.miniMushR) return
          p.r = c.miniMushR
          c.miniMushR = 0
        }
      }
    },

    {
      id: 'rosary',
      num: 72,
      name: 'Rosary',
      desc: 'Tears and soul hearts up',
      info: "↑ +0.5 Tears · +3 Soul Hearts · The Bible is added to all item pools",
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      pools: ['treasure', 'angel', 'greed-angel', 'ultra-secret'],
      tags: ['tears', 'hearts', 'angel', 'book'],
      transform: 'seraphim',
      stats: { tears: 0.5 },
      grant: { soul: 6 },
      hooks: {
        // run.pools is the live pool state; there is no add-to-pool API, so the
        // entry is pushed directly, matching whichever entry shape the pool
        // builder used.
        onInit: function (p, ctx) {
          var pools = ctx && ctx.run && ctx.run.pools
          if (!pools || typeof pools !== 'object') return
          for (var name in pools) {
            var arr = pools[name]
            if (!Array.isArray(arr) || !arr.length) continue
            var sample = arr[0]
            if (typeof sample === 'string') {
              if (arr.indexOf('the-bible') < 0) arr.push('the-bible')
            } else if (sample && typeof sample === 'object' && sample.id !== undefined) {
              var found = false
              for (var i = 0; i < arr.length; i++) {
                if (arr[i] && arr[i].id === 'the-bible') { found = true; break }
              }
              if (!found) arr.push({ id: 'the-bible', weight: sample.weight != null ? sample.weight : 1 })
            }
          }
        }
      }
    },

    {
      id: 'cube-of-meat',
      num: 73,
      name: 'Cube of Meat',
      desc: 'Orbital that upgrades',
      info: 'Lv1: Orbital · Lv2: Shooting orbital · Lv3: Meat Boy · Lv4: Super Meat Boy',
      kind: 'familiar',
      quality: 3,
      dlc: 'rebirth',
      pools: ['greed-treasure', 'greed-boss', 'greed-shop', 'greed-curse', 'greed-devil', 'greed-angel', 'greed-secret', 'ultra-secret', 'baby-shop'],
      tags: ['familiar', 'orbital', 'offensive'],
      // No declarative `familiars`: each copy replaces the previous level
      // rather than adding a second body, so the ladder is driven by hook.
      hooks: {
        onInit: function (p, ctx) { syncCube(p, ctx) },
        onRemove: function (p, ctx) { syncCube(p, ctx) }
      }
    },

    {
      id: 'a-quarter',
      num: 74,
      name: 'A Quarter',
      desc: '+25 coins',
      info: '+25 Coins',
      kind: 'passive',
      quality: 1,
      dlc: 'rebirth',
      pools: ['devil', 'golden-chest', 'greed-devil'],
      tags: ['coins', 'utility'],
      grant: { coins: 25 }
    },

    {
      id: 'phd',
      num: 75,
      name: 'PHD',
      desc: 'Bad pills become good',
      info: 'Heals 2 hearts · Spawns 1 pill · Changes bad pills into good pills',
      kind: 'passive',
      quality: 3,
      dlc: 'rebirth',
      pools: ['treasure', 'shop', 'greed-shop'],
      tags: ['pill', 'hearts', 'utility'],
      grant: { heal: 4, pills: 1 },
      hooks: {
        // The extra coins from Blood Donation Machines are priced by
        // js/engine/interact.js, which reads the held item; the pill conversion
        // is the part the hook surface can own.
        onPillUse: function (p, pillId, ctx) {
          return swapBadPill(p, pillId, ctx)
        }
      }
    },

    {
      id: 'x-ray-vision',
      num: 76,
      name: 'X-Ray Vision',
      desc: 'Opens secret rooms',
      info: 'Opens all secret room entrances',
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-shop'],
      tags: ['utility'],
      flags: ['seeSecretRooms'],
      hooks: {
        onRoomEnter: function (p, room, ctx) {
          if (!room || !Array.isArray(room.doors)) return
          for (var i = 0; i < room.doors.length; i++) {
            var d = room.doors[i]
            if (!d) continue
            if (d.kind !== 'secret' && d.kind !== 'super-secret' && d.kind !== 'ultra-secret') continue
            if (d.open && !d.locked) continue
            d.locked = false
            d.open = true
            if (ctx && typeof ctx.unlockDoor === 'function') ctx.unlockDoor(d.kind)
            if (ctx && typeof ctx.sfx === 'function') ctx.sfx('secret-found')
          }
        }
      }
    },

    {
      id: 'my-little-unicorn',
      num: 77,
      name: 'My Little Unicorn',
      desc: 'Invincible ramming',
      info: "Receive for 6 seconds: ↑ +0.28 Speed · Invincibility · Isaac can't shoot but deals 40 contact damage per second",
      kind: 'active',
      quality: 2,
      charge: 6,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure', 'crane-game'],
      tags: ['offensive', 'defensive'],
      hooks: {
        onUse: function (p, ctx) {
          var c = cacheOf(p)
          if (!c) return { fail: true }
          c.unicornT = 6
          c.unicornTick = 0
          recalc(p)
          if (ctx && typeof ctx.sfx === 'function') ctx.sfx('charge-ready')
          return undefined
        },
        onStats: function (p, s) {
          if (!p || !p.cache || !(p.cache.unicornT > 0) || !s) return
          s.speed += 0.28
          // "Can't shoot" has no dedicated flag; a near-zero fire rate is the
          // honest expression of it inside the stat block.
          s.tears = 0.05
        },
        onUpdate: function (p, dt, ctx) {
          var c = cacheOf(p)
          if (!c || !(c.unicornT > 0)) return
          c.unicornT -= dt
          if (c.unicornT <= 0) {
            c.unicornT = 0
            recalc(p)
            return
          }
          if (!ctx || !ctx.room) return
          // 20 damage twice a second = the stated 40/s.
          everyTick(p, dt, 'unicornTick', 0.5, function () {
            touchDamage(p, ctx, 20)
          })
        },
        onPlayerDamage: function (p) {
          var c = cacheOf(p)
          if (c && c.unicornT > 0) return { cancel: true }
          return undefined
        }
      }
    },

    {
      id: 'book-of-revelations',
      num: 78,
      name: 'Book of Revelations',
      desc: 'Soul heart, horseman boss',
      info: "+1 Soul Heart · +17.5% Devil/Angel Room chance while held · Replaces the floor's boss with a horseman",
      kind: 'active',
      quality: 2,
      charge: 6,
      dlc: 'rebirth',
      pools: ['treasure', 'library', 'greed-treasure', 'greed-angel'],
      tags: ['book', 'hearts', 'devil', 'angel'],
      transform: 'bookworm',
      stats: { devilChance: 0.175, angelChance: 0.175 },
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx) return { fail: true }
          if (typeof ctx.addSoul === 'function') ctx.addSoul(2)
          var c = cacheOf(p)
          if (c) c.revFloor = (ctx.floor && ctx.floor.id) ? ctx.floor.id : true
          // Floor generation may not have placed the boss yet on an unvisited
          // floor, so the intent is also recorded on the run.
          if (ctx.run && ctx.run.flags) ctx.run.flags.revelationsHorseman = true
          if (typeof ctx.sfx === 'function') ctx.sfx('angel-deal')
          return undefined
        },
        // If the boss is already standing there, swap it out on arrival. The
        // old body is dropped from room.enemies rather than killed, so it pays
        // out no boss reward.
        onRoomEnter: function (p, room, ctx) {
          if (!room || !ctx || room.type !== 'boss') return
          var c = cacheOf(p)
          if (!c || !c.revFloor) return
          var here = (ctx.floor && ctx.floor.id) ? ctx.floor.id : true
          if (c.revFloor !== here) return
          var names = ['famine', 'pestilence', 'war', 'death', 'conquest', 'headless-horseman']
          var cands = []
          for (var i = 0; i < names.length; i++) {
            if (IS.enemiesById && IS.enemiesById[names[i]]) cands.push(names[i])
          }
          if (!cands.length || typeof ctx.spawnBoss !== 'function') return
          var arr = room.enemies
          if (!Array.isArray(arr)) return
          var swapped = false
          for (var j = arr.length - 1; j >= 0; j--) {
            var e = arr[j]
            if (!e || !e.boss || e.dead) continue
            e.dead = true
            arr.splice(j, 1)
            swapped = true
          }
          if (!swapped) return
          c.revFloor = null
          var pickId = (typeof ctx.pick === 'function') ? ctx.pick(cands) : cands[0]
          var mid = roomCentre(ctx)
          ctx.spawnBoss(pickId, mid.x, mid.y)
          if (typeof ctx.sfx === 'function') ctx.sfx('boss-roar')
        }
      }
    },

    {
      id: 'the-mark',
      num: 79,
      name: 'The Mark',
      desc: 'Damage up, black heart',
      info: '↑ +1 Damage · ↑ +0.2 Speed · +1 Black Heart',
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      pools: ['devil', 'demon-beggar', 'curse', 'greed-curse', 'greed-devil', 'ultra-secret'],
      tags: ['damage', 'speed', 'devil', 'hearts'],
      transform: 'leviathan',
      stats: { damage: 1, speed: 0.2 },
      grant: { black: 2 }
    },

    {
      id: 'the-pact',
      num: 80,
      name: 'The Pact',
      desc: 'Tears, damage, black hearts',
      info: '↑ +0.7 Tears · ↑ +0.5 Damage · +2 Black Hearts',
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      pools: ['devil', 'demon-beggar', 'curse', 'greed-curse', 'greed-devil', 'ultra-secret'],
      tags: ['tears', 'damage', 'devil', 'hearts'],
      transform: 'leviathan',
      stats: { tears: 0.72, damage: 0.5 },
      grant: { black: 4 }
    },

    {
      id: 'dead-cat',
      num: 81,
      name: 'Dead Cat',
      desc: 'Nine lives, one container',
      info: '↑ +9 Lives · Respawns with 1 heart container on death · Sets containers to 1 on pickup',
      kind: 'passive',
      quality: 3,
      dlc: 'rebirth',
      pools: ['devil', 'red-chest', 'curse', 'greed-curse', 'greed-devil'],
      tags: ['revive', 'hearts', 'devil', 'guppy'],
      transform: 'guppy',
      hooks: {
        onInit: function (p) {
          var c = cacheOf(p)
          if (!c || c.deadCatSet) return
          var h = p.hearts
          if (!h) return
          c.deadCatSet = true
          h.maxRed = 2
          if (!(h.red > 0) || h.red > 2) h.red = 2
          h.rotten = 0
        },
        onPlayerDeath: function (p, ctx) {
          var c = cacheOf(p)
          if (!c) return undefined
          var lives = c.deadCatLives || 0
          if (lives >= 9) return undefined
          c.deadCatLives = lives + 1
          var h = p.hearts
          if (h) {
            h.maxRed = 2
            h.red = 2
            h.soul = 0
            h.black = 0
            h.rotten = 0
          }
          if (ctx && typeof ctx.sfx === 'function') ctx.sfx('familiar-spawn')
          return { revive: true }
        }
      }
    },

    {
      id: 'lord-of-the-pit',
      num: 82,
      name: 'Lord of the Pit',
      desc: 'Flight and speed up',
      info: '↑ +0.3 Speed · Flight',
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      pools: ['devil', 'demon-beggar', 'greed-devil', 'ultra-secret'],
      tags: ['speed', 'devil', 'utility'],
      transform: 'leviathan',
      stats: { speed: 0.3 },
      flags: ['flying']
    },

    {
      id: 'the-nail',
      num: 83,
      name: 'The Nail',
      desc: 'Black heart and rock breaking',
      info: 'Upon use: + Half Black Heart · For the room: ↑ +2 Damage · ↓ -0.18 Speed · 40 contact damage per second · Breaks rocks by walking into them',
      kind: 'active',
      quality: 2,
      charge: 2,
      dlc: 'rebirth',
      pools: ['devil', 'demon-beggar', 'greed-devil'],
      tags: ['devil', 'damage', 'hearts'],
      transform: 'leviathan',
      hooks: {
        onUse: function (p, ctx) {
          var c = cacheOf(p)
          if (!c || !ctx) return { fail: true }
          if (typeof ctx.addBlack === 'function') ctx.addBlack(1)
          c.nailRoom = true
          c.nailTick = 0
          lendFlag(p, 'ignoreRocks', 'nailLift')
          recalc(p)
          if (typeof ctx.sfx === 'function') ctx.sfx('rock-break')
          return undefined
        },
        onStats: function (p, s) {
          if (!p || !p.cache || !p.cache.nailRoom || !s) return
          s.damage += 2
          s.speed -= 0.18
        },
        onUpdate: function (p, dt, ctx) {
          var c = cacheOf(p)
          if (!c || !c.nailRoom || !ctx || !ctx.room) return
          // 20 damage twice a second = the stated 40/s.
          everyTick(p, dt, 'nailTick', 0.5, function () {
            touchDamage(p, ctx, 20)
          })
        },
        onRoomEnter: function (p, room) {
          if (!room) return
          var c = cacheOf(p)
          if (!c || !c.nailRoom) return
          c.nailRoom = false
          returnFlag(p, 'ignoreRocks', 'nailLift')
          recalc(p)
        }
      }
    },

    {
      id: 'we-need-to-go-deeper',
      num: 84,
      name: 'We Need To Go Deeper!',
      desc: 'Digs a trapdoor',
      info: 'Opens a trapdoor to the next floor · Sometimes a crawlspace instead',
      kind: 'active',
      quality: 2,
      charge: 1,
      dlc: 'rebirth',
      pools: ['devil', 'secret', 'greed-shop', 'greed-secret'],
      tags: ['utility'],
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          var crawl = (typeof ctx.chance === 'function') ? ctx.chance(0.1) : false
          if (crawl && typeof ctx.spawnCrawlspace === 'function') ctx.spawnCrawlspace()
          else if (typeof ctx.spawnTrapdoor === 'function') ctx.spawnTrapdoor()
          else return { fail: true }
          if (typeof ctx.sfx === 'function') ctx.sfx('trapdoor')
          return undefined
        }
      }
    },

    {
      id: 'deck-of-cards',
      num: 85,
      name: 'Deck of Cards',
      desc: 'Spawns a card',
      info: 'Spawns 1 card',
      kind: 'active',
      quality: 2,
      charge: 4,
      dlc: 'rebirth',
      pools: ['treasure', 'shop', 'greed-treasure', 'crane-game'],
      tags: ['card', 'utility'],
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room || typeof ctx.spawnPickup !== 'function') return { fail: true }
          ctx.spawnPickup('card', p.x, p.y + 40)
          if (typeof ctx.sfx === 'function') ctx.sfx('card-use')
          return undefined
        }
      }
    },

    {
      id: 'monstros-tooth',
      num: 86,
      name: "Monstro's Tooth",
      desc: 'Monstro drops in',
      info: 'Monstro falls on an enemy and deals 120 damage · He lands on Isaac if the room is empty',
      kind: 'active',
      quality: 2,
      charge: 3,
      dlc: 'rebirth',
      pools: ['treasure'],
      tags: ['offensive'],
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          var es = enemiesOf(ctx)
          var t = (es.length && typeof ctx.pick === 'function') ? ctx.pick(es) : null
          var tx = t ? t.x : p.x
          var ty = t ? t.y : p.y
          for (var i = 0; i < es.length; i++) {
            var e = es[i]
            if (!e || e.dead || e.friendly) continue
            var dx = (e.x || 0) - tx
            var dy = (e.y || 0) - ty
            var rr = 95 + (e.r || 20)
            if (dx * dx + dy * dy > rr * rr) continue
            hurtEnemy(e, 120, p, ctx)
          }
          if (typeof ctx.shake === 'function') ctx.shake(9, 0.35)
          if (typeof ctx.sfx === 'function') ctx.sfx('boss-roar')
          return undefined
        }
      }
    },

    {
      id: 'lokis-horns',
      num: 87,
      name: "Loki's Horns",
      desc: 'Chance to shoot cross-shaped',
      info: '25% chance to shoot in 4 directions · 100% chance at 15 luck',
      kind: 'passive',
      quality: 3,
      dlc: 'rebirth',
      pools: ['treasure', 'demon-beggar', 'greed-treasure'],
      tags: ['tears', 'offensive'],
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (!tear || !ctx || typeof ctx.roll !== 'function') return
          // 25% base, reaching 100% at 15 luck.
          if (!ctx.roll(0.25, 0.05, 1)) return
          var vx = tear.vx || 0
          var vy = tear.vy || 0
          extraTear(ctx, tear, -vx, -vy)
          extraTear(ctx, tear, -vy, vx)
          extraTear(ctx, tear, vy, -vx)
        }
      }
    },

    {
      id: 'little-chubby',
      num: 88,
      name: 'Little Chubby',
      desc: 'Charging familiar',
      info: 'Charges forward in the direction Isaac is shooting · Deals 52.5 contact damage per second',
      kind: 'familiar',
      quality: 2,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure', 'baby-shop'],
      tags: ['familiar', 'offensive'],
      familiars: ['little-chubby']
    },

    {
      id: 'spider-bite',
      num: 89,
      name: 'Spider Bite',
      desc: 'Chance for slowing tears',
      info: '25% chance to shoot slowing tears · 100% chance at 15 luck',
      kind: 'passive',
      quality: 1,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-treasure', 'crane-game'],
      tags: ['tears', 'spider', 'offensive'],
      transform: 'spider',
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (!tear || !tear.flags || typeof tear.flags.add !== 'function') return
          if (!ctx || typeof ctx.roll !== 'function') return
          // 25% base, reaching 100% at 15 luck.
          if (!ctx.roll(0.25, 0.05, 1)) return
          tear.flags.add('slow')
        }
      }
    },

    {
      id: 'the-small-rock',
      num: 90,
      name: 'The Small Rock',
      desc: 'Damage up, speed down',
      info: '↑ +0.2 Tears · ↑ +1 Damage · ↓ -0.2 Speed',
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      pools: ['crane-game'],
      tags: ['damage', 'tears', 'stat-down'],
      stats: { tears: 0.2, damage: 1, speed: -0.2 }
    },

    {
      id: 'spelunker-hat',
      num: 91,
      name: 'Spelunker Hat',
      desc: 'Reveals nearby rooms',
      info: 'Rooms are revealed from further away · Reveals Secret Rooms · Prevents damage from falling projectiles',
      kind: 'passive',
      quality: 2,
      dlc: 'rebirth',
      pools: ['treasure', 'greed-shop', 'crane-game'],
      tags: ['utility', 'defensive'],
      flags: ['seeSecretRooms', 'seeMinimap'],
      hooks: {
        // APPROXIMATED: nothing in the damage source is guaranteed to say "this
        // fell from the ceiling", so the immunity keys off whichever marker the
        // projectile carries — a height/falls field or an explicit kind.
        onPlayerDamage: function (p, amount, source) {
          if (!source || typeof source !== 'object') return undefined
          if (source.falls || source.falling || source.kind === 'falling' ||
              (typeof source.height === 'number' && source.height > 0)) {
            return { cancel: true }
          }
          return undefined
        }
      }
    },

    {
      id: 'super-bandage',
      num: 92,
      name: 'Super Bandage',
      desc: 'Health and soul hearts up',
      info: '↑ +1 Health · Heals 1 heart · +2 Soul Hearts',
      kind: 'passive',
      quality: 1,
      dlc: 'rebirth',
      pools: ['treasure', 'boss'],
      tags: ['hearts', 'defensive'],
      grant: { maxHearts: 2, heal: 2, soul: 4 }
    }

  ])

})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
