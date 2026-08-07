;(function (IS) {
  'use strict'

  // ---------------------------------------------------------------------------
  // ISUCK — all 50 pill effects.
  //
  // Schema (ARCHITECTURE.md §5.9): { id, num, name, kind:'pill', good, horse,
  // desc, info, use(p, ctx, horse) }. Pills have NO hooks — IS.fireHook only
  // walks p.items and p.trinkets, so a hook here would never fire. Everything a
  // pill does happens inside its single `use()` call.
  //
  // `horse` on the definition stays false: the horse-pill variant is this same
  // def called with the third argument true, so every `use()` below reads
  // `horse` and does the doubled / nastier thing itself.
  //
  // Pill colours are assigned per run by IS.assignPillColours(run) — nothing in
  // this file knows or cares which colour it is wearing.
  //
  // Randomness comes only from ctx (ctx.chance / ctx.int / ctx.range /
  // ctx.pick). Unseeded random calls are banned in the sim layer.
  //
  // ---------------------------------------------------------------------------
  // PERMANENT STAT CHANGES — why these write p.base
  //
  // The stat-up / stat-down pills (Range, Speed, Tears, Luck, Shot speed) are
  // permanent for the run and are not attached to any collectible, so there is
  // nothing for IS.recalcStats to re-derive them from: p.stats is rebuilt from
  // scratch on every recalc, and mutating it would be undone by the next item
  // pickup. The game models these pills as changes to the character's *base*
  // stats, so that is what they do here: adjust p.base.<key> (clamped to the
  // contract's floors and caps) and then call IS.recalcStats(p). This is the
  // only sanctioned writer of p.base outside character setup.
  //
  // ---------------------------------------------------------------------------
  // TIMED / SCOPED STATE — the reader contract for player.js and render.js
  //
  // Several pills are timed or room-scoped effects with no per-tick hook to run
  // them from and no entry in IS.STATUS_LIST that matches. Those write a
  // namespaced expiry into p.cache (a documented scratch space, §4) or into
  // run.flags. Expiries are ABSOLUTE run.time values, so a reader only has to
  // compare — nothing needs to be ticked down. Every key this file can write:
  //
  //   p.cache['pill:history']        array of pill ids, most recent first.
  //                                  Written by every pill except Vurp!; read
  //                                  by Vurp!. Already fully implemented here.
  //   p.cache['pill:noShootUntil']   run.time until which firing is suppressed
  //                                  (Power Pill!, Feels like I'm walking on
  //                                  sunshine!).
  //   p.cache['pill:invulnUntil']    run.time until which the player takes no
  //                                  damage. Mirror of p.invulnUntil, written
  //                                  because the clock p.invulnUntil is compared
  //                                  against is player.js's choice.
  //   p.cache['pill:contactUntil']   run.time until which the player deals
  //                                  PILL_CONTACT_DPS (40) damage per second to
  //                                  anything he touches (Power Pill!).
  //   p.cache['pill:killHealEvery']  n: heal half a red heart every n kills
  //                                  while pill:contactUntil is live.
  //   p.cache['pill:diagonalUntil']  run.time until which tears fire on the four
  //                                  diagonals only (R U A Wizard?).
  //   p.cache['pill:hasteUntil']     run.time until which the player moves
  //                                  PILL_HASTE (×1.35) faster (I'm Excited!!).
  //   p.cache['pill:percsRoom']      room object; while ctx.room is identically
  //                                  this room, damage taken is clamped to 1
  //                                  half-heart (Percs!).
  //   p.cache['pill:addictedRoom']   room object; while ctx.room is identically
  //                                  this room, damage taken is raised to at
  //                                  least 2 half-hearts (Addicted!).
  //   p.cache['pill:sizeScale']      multiplier for the player's drawn size.
  //                                  Render-only; the hitbox is p.r, which the
  //                                  small pill changes for real.
  //   p.cache['pill:adult']          count mirror of p.transforms.adult, so the
  //                                  Puberty count survives a recalc that
  //                                  rebuilds p.transforms from items.
  //   run.flags.retroVisionUntil     run.time until which render.js should
  //                                  pixelate the frame (Retro Vision).
  //
  // IS.pillState(p, run, key) below is the one reader for the p.cache expiries,
  // so no other file has to know the key spelling.
  // ---------------------------------------------------------------------------

  var PILL_CONTACT_DPS = 40
  var PILL_HASTE = 1.35

  // --- small guarded helpers -------------------------------------------------
  // Every IS.* call is typeof-guarded: this file loads long before player.js,
  // entity.js or fx.js, and a pill must never throw.

  function nowT (ctx) {
    var run = ctx && ctx.run
    return run && typeof run.time === 'number' ? run.time : 0
  }

  function cacheOf (p) {
    if (!p) return null
    if (!p.cache || typeof p.cache !== 'object') p.cache = {}
    return p.cache
  }

  // Absolute expiry, never shortened by a weaker second dose.
  function until (p, ctx, key, secs) {
    var c = cacheOf(p)
    if (!c) return 0
    var t = nowT(ctx) + secs
    var cur = c[key]
    c[key] = (typeof cur === 'number' && cur > t) ? cur : t
    return c[key]
  }

  function runFlagUntil (ctx, key, secs) {
    var run = ctx && ctx.run
    if (!run) return 0
    if (!run.flags || typeof run.flags !== 'object') run.flags = {}
    var t = nowT(ctx) + secs
    var cur = run.flags[key]
    run.flags[key] = (typeof cur === 'number' && cur > t) ? cur : t
    return run.flags[key]
  }

  function sfx (ctx, name) {
    if (ctx && typeof ctx.sfx === 'function') ctx.sfx(name)
  }

  function say (ctx, text, colour) {
    if (ctx && typeof ctx.floater === 'function') ctx.floater(text, null, null, colour || '#e8e4dc')
  }

  function intOf (ctx, n) {
    if (ctx && typeof ctx.int === 'function') return ctx.int(n)
    return 0
  }

  function rangeOf (ctx, a, b) {
    if (ctx && typeof ctx.range === 'function') return ctx.range(a, b)
    return a
  }

  function chanceOf (ctx, pr) {
    if (ctx && typeof ctx.chance === 'function') return ctx.chance(pr)
    return false
  }

  function livingOf (ctx) {
    if (ctx && typeof ctx.livingEnemies === 'function') {
      var list = ctx.livingEnemies()
      if (Array.isArray(list)) return list
    }
    return []
  }

  function gridOf (ctx) {
    if (ctx && typeof ctx.gridObjects === 'function') {
      var list = ctx.gridObjects()
      if (Array.isArray(list)) return list
    }
    return []
  }

  function playerPos (p, ctx) {
    if (p && typeof p.x === 'number' && typeof p.y === 'number') return { x: p.x, y: p.y }
    var room = ctx && ctx.room
    var w = room && room.pxW != null ? room.pxW : (IS.ROOM_PX_W || 1040)
    var h = room && room.pxH != null ? room.pxH : (IS.ROOM_PX_H || 560)
    return { x: w / 2, y: h / 2 }
  }

  function aimOf (p) {
    var h = p && p.head
    if (h && (h.x || h.y)) {
      var l = Math.sqrt(h.x * h.x + h.y * h.y) || 1
      return { x: h.x / l, y: h.y / l }
    }
    return { x: 0, y: -1 }
  }

  function statOf (p, key, fallback) {
    var s = p && p.stats
    return s && typeof s[key] === 'number' ? s[key] : fallback
  }

  function recalc (p) {
    if (typeof IS.recalcStats === 'function') IS.recalcStats(p)
  }

  function halfHearts (p) {
    if (typeof IS.totalHearts === 'function') {
      var t = IS.totalHearts(p)
      if (typeof t === 'number' && t === t) return t
    }
    var h = p && p.hearts
    if (!h) return 0
    return (h.red || 0) + (h.soul || 0) + (h.black || 0) + (h.bone || 0) +
      (h.rotten || 0) + (h.gold || 0) + (h.eternal || 0)
  }

  function fullHeal (p, ctx) {
    var max = p && p.hearts && p.hearts.maxRed ? p.hearts.maxRed : (IS.MAX_HEART_CONTAINERS || 24)
    if (ctx && typeof ctx.healRed === 'function') ctx.healRed(max)
    else if (typeof IS.healRed === 'function') IS.healRed(p, max)
  }

  function clamp (v, lo, hi) {
    if (lo != null && v < lo) v = lo
    if (hi != null && v > hi) v = hi
    return v
  }

  // The permanent stat pills. One table so the up pill, the down pill and
  // Experimental Pill can never drift apart.
  var STAT_PILLS = [
    { key: 'range', name: 'Range', up: 100, down: -80, lo: 160, hi: null },
    { key: 'speed', name: 'Speed', up: 0.15, down: -0.12, lo: 0.1, hi: IS.SPEED_CAP || 2 },
    { key: 'tears', name: 'Tears', up: 0.35, down: -0.28, lo: 0.5, hi: IS.TEARS_CAP || 30 },
    { key: 'luck', name: 'Luck', up: 1, down: -1, lo: null, hi: null },
    { key: 'shotSpeed', name: 'Shot speed', up: 0.15, down: -0.15, lo: 0.3, hi: 3 }
  ]

  function statPill (key) {
    for (var i = 0; i < STAT_PILLS.length; i++) if (STAT_PILLS[i].key === key) return STAT_PILLS[i]
    return null
  }

  // Permanent base-stat change (see the header block on p.base).
  function adjustBase (p, ctx, key, delta, lo, hi, label, colour) {
    if (!p || !p.base || typeof p.base[key] !== 'number' || !delta) return false
    var before = p.base[key]
    p.base[key] = clamp(before + delta, lo, hi)
    if (p.base[key] === before) return false
    recalc(p)
    if (label) say(ctx, label, colour || (delta > 0 ? '#8ad06a' : '#d06a5a'))
    return true
  }

  function applyStatPill (p, ctx, key, dir, horse) {
    var s = statPill(key)
    if (!s) return false
    var d = (dir > 0 ? s.up : s.down) * (horse ? 2 : 1)
    return adjustBase(p, ctx, key, d, s.lo, s.hi, s.name + (dir > 0 ? ' up' : ' down'))
  }

  // --- the Vurp! memory ------------------------------------------------------

  var HISTORY_KEY = 'pill:history'

  function remember (p, id) {
    var c = cacheOf(p)
    if (!c) return
    var h = c[HISTORY_KEY]
    if (!Array.isArray(h)) { h = []; c[HISTORY_KEY] = h }
    h.unshift(id)
    if (h.length > 8) h.length = 8
  }

  function history (p) {
    var c = p && p.cache
    var h = c && c[HISTORY_KEY]
    return Array.isArray(h) ? h : []
  }

  // --- public reader ---------------------------------------------------------
  // One place for player.js / render.js to ask "is this pill effect live?".
  // Pass a bare key name ('noShoot', 'diagonal', 'haste', 'contact', 'invuln').

  IS.pillState = function (p, run, key) {
    var c = p && p.cache
    if (!c) return false
    var t = run && typeof run.time === 'number' ? run.time : 0
    var v = c['pill:' + key + 'Until']
    return typeof v === 'number' && v > t
  }

  IS.PILL_CONTACT_DPS = PILL_CONTACT_DPS
  IS.PILL_HASTE = PILL_HASTE

  var SECRETISH = { secret: 1, 'super-secret': 1, 'ultra-secret': 1 }

  // ---------------------------------------------------------------------------

  var defs = [

    // -- 0 ------------------------------------------------------------------
    {
      id: 'bad-gas',
      num: 0,
      name: 'Bad Gas',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Poison fart',
      info: 'Isaac farts and poisons nearby enemies',
      use: function (p, ctx, horse) {
        if (!p) return
        var pos = playerPos(p, ctx)
        var r = horse ? 240 : 140
        var secs = horse ? 8 : 5
        var list = livingOf(ctx)
        var hit = 0
        for (var i = 0; i < list.length; i++) {
          var e = list[i]
          if (!e) continue
          var dx = e.x - pos.x
          var dy = e.y - pos.y
          if (dx * dx + dy * dy > r * r) continue
          if (ctx && typeof ctx.applyStatus === 'function') ctx.applyStatus(e, 'poison', secs)
          hit++
        }
        if (ctx && typeof ctx.spawnEffect === 'function') {
          ctx.spawnEffect('ring', pos.x, pos.y, { colour: '#8ac05a', r0: 10, r1: r, life: 0.5, width: 8 })
          ctx.spawnEffect('burst', pos.x, pos.y, { colour: '#8ac05a', n: horse ? 26 : 16 })
        }
        sfx(ctx, 'fart')
        say(ctx, hit ? 'Bad Gas' : 'Pffft', '#8ac05a')
      }
    },

    // -- 1 ------------------------------------------------------------------
    {
      id: 'bad-trip',
      num: 1,
      name: 'Bad Trip',
      kind: 'pill',
      good: false,
      horse: false,
      desc: 'Costs a heart',
      info: 'Deals 1 heart of damage to Isaac · Becomes a Full Health pill at 1 heart or less',
      use: function (p, ctx, horse) {
        if (!p) return
        // At one heart or less the game flips it into Full Health rather than
        // killing you outright.
        if (halfHearts(p) <= 2) {
          fullHeal(p, ctx)
          sfx(ctx, 'heart-pickup')
          say(ctx, 'Full Health', '#e05a6a')
          return
        }
        if (ctx && typeof ctx.damagePlayer === 'function') ctx.damagePlayer(horse ? 4 : 2, 'pill')
        say(ctx, 'Bad Trip', '#a05ac0')
      }
    },

    // -- 2 ------------------------------------------------------------------
    {
      id: 'balls-of-steel',
      num: 2,
      name: 'Balls of Steel',
      kind: 'pill',
      good: true,
      horse: false,
      desc: '+2 soul hearts',
      info: '+2 Soul Hearts',
      use: function (p, ctx, horse) {
        if (!p) return
        // Half-heart units: 4 halves = the 2 full soul hearts on the tin.
        if (ctx && typeof ctx.addSoul === 'function') ctx.addSoul(horse ? 8 : 4)
        sfx(ctx, 'heart-pickup')
        say(ctx, 'Balls of Steel', '#c8c8e0')
      }
    },

    // -- 3 ------------------------------------------------------------------
    {
      id: 'bombs-are-key',
      num: 3,
      name: 'Bombs are Key',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Bombs become keys',
      info: "Swaps Isaac's number of bombs and keys · Golden bombs and keys are also swapped",
      use: function (p, ctx, horse) {
        if (!p) return
        var cap = IS.PICKUP_CAP || 99
        var b = typeof p.bombs === 'number' ? p.bombs : 0
        var k = typeof p.keys === 'number' ? p.keys : 0
        // Set directly: a swap routed through two add() calls half-applies the
        // moment one of them clamps.
        p.bombs = clamp(k, 0, cap)
        p.keys = clamp(b, 0, cap)
        var gb = !!p.goldenBomb
        p.goldenBomb = !!p.goldenKey
        p.goldenKey = gb
        // Horse: the swap plus one of each, so the pill is never a total waste.
        if (horse) {
          p.bombs = clamp(p.bombs + 1, 0, cap)
          p.keys = clamp(p.keys + 1, 0, cap)
        }
        sfx(ctx, 'key')
        say(ctx, 'Bombs are Key', '#d8c040')
      }
    },

    // -- 4 ------------------------------------------------------------------
    {
      id: 'explosive-diarrhea',
      num: 4,
      name: 'Explosive Diarrhea',
      kind: 'pill',
      good: true,
      horse: false,
      desc: '5 lit bombs',
      info: 'Isaac quickly spawns 5 lit bombs',
      use: function (p, ctx, horse) {
        if (!p || !ctx || typeof ctx.spawnBomb !== 'function') return
        var pos = playerPos(p, ctx)
        var n = horse ? 10 : 5
        var base = rangeOf(ctx, 0, Math.PI * 2)
        // APPROXIMATED: "quickly spawns" is a drop cadence over about a second
        // and a pill has no per-tick hook, so all the bombs are placed at once
        // in a spiral behind Isaac with staggered fuses — the bang pattern is
        // the same, the walk is not.
        for (var i = 0; i < n; i++) {
          var a = base + i * 2.399963
          var d = 20 + i * 13
          ctx.spawnBomb(pos.x + Math.cos(a) * d, pos.y + Math.sin(a) * d, {
            fuse: 0.7 + i * 0.28,
            friendly: true
          })
        }
        sfx(ctx, 'bomb-fuse')
        say(ctx, 'Explosive Diarrhea', '#c09050')
      }
    },

    // -- 5 ------------------------------------------------------------------
    {
      id: 'full-health',
      num: 5,
      name: 'Full Health',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Full heal',
      info: 'Fully heals all heart containers',
      use: function (p, ctx, horse) {
        if (!p) return
        fullHeal(p, ctx)
        // Horse Full Health has nothing to double once every container is
        // full, so it tops off with a soul heart instead of wasting the dose.
        if (horse && ctx && typeof ctx.addSoul === 'function') ctx.addSoul(2)
        sfx(ctx, 'heart-pickup')
        say(ctx, 'Full Health', '#e05a6a')
      }
    },

    // -- 6 ------------------------------------------------------------------
    {
      id: 'health-down',
      num: 6,
      name: 'Health Down',
      kind: 'pill',
      good: false,
      horse: false,
      desc: '-1 heart container',
      info: '↓ -1 Health · Becomes a Health Up pill at 0 or 1 heart containers',
      use: function (p, ctx, horse) {
        if (!p) return
        var maxRed = p.hearts && typeof p.hearts.maxRed === 'number' ? p.hearts.maxRed : 0
        // One container or fewer: the game flips it into Health Up.
        if (maxRed <= 2) {
          if (ctx && typeof ctx.addMaxHearts === 'function') ctx.addMaxHearts(horse ? 4 : 2, false)
          sfx(ctx, 'heart-pickup')
          say(ctx, 'Health Up', '#8ad06a')
          return
        }
        if (ctx && typeof ctx.addMaxHearts === 'function') ctx.addMaxHearts(horse ? -4 : -2, false)
        say(ctx, 'Health Down', '#d06a5a')
      }
    },

    // -- 7 ------------------------------------------------------------------
    {
      id: 'health-up',
      num: 7,
      name: 'Health Up',
      kind: 'pill',
      good: true,
      horse: false,
      desc: '+1 heart container',
      info: '↑ +1 Empty heart container',
      use: function (p, ctx, horse) {
        if (!p) return
        // Empty container: no heal, exactly as the pill states.
        if (ctx && typeof ctx.addMaxHearts === 'function') ctx.addMaxHearts(horse ? 4 : 2, false)
        sfx(ctx, 'heart-pickup')
        say(ctx, 'Health Up', '#8ad06a')
      }
    },

    // -- 8 ------------------------------------------------------------------
    {
      id: 'i-found-pills',
      num: 8,
      name: 'I Found Pills',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'No effect',
      info: 'No effect',
      use: function (p, ctx, horse) {
        // Genuinely nothing: this pill exists to waste your pill. The only
        // thing it owes the player is the feedback that it did nothing, and the
        // history entry that lets Vurp! cough it back up.
        if (!p) return
        say(ctx, horse ? 'I found pills!!' : 'I found pills!', '#c0b8a8')
      }
    },

    // -- 9 ------------------------------------------------------------------
    {
      id: 'puberty',
      num: 9,
      name: 'Puberty',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Eat three to grow up',
      info: 'No effect · Eating 3 grants the Adult transformation: ↑ +1 Health',
      use: function (p, ctx, horse) {
        if (!p) return
        if (!p.transforms || typeof p.transforms !== 'object') p.transforms = {}
        var add = horse ? 2 : 1
        p.transforms.adult = (p.transforms.adult || 0) + add
        // Mirror the count: IS.recalcStats rebuilds p.transforms from the item
        // list, and no item contributes 'adult', so the pill count needs a home
        // that a recalc cannot wipe. IS.checkTransforms should prefer the higher
        // of the two.
        var c = cacheOf(p)
        if (c) c['pill:adult'] = (c['pill:adult'] || 0) + add
        if (typeof IS.checkTransforms === 'function') IS.checkTransforms(p, ctx)
        say(ctx, 'Puberty', '#e0a0c0')
      }
    },

    // -- 10 -----------------------------------------------------------------
    {
      id: 'pretty-fly',
      num: 10,
      name: 'Pretty Fly',
      kind: 'pill',
      good: true,
      horse: false,
      desc: '+1 fly orbital',
      info: '+1 Fly orbital',
      use: function (p, ctx, horse) {
        if (!p || !ctx || typeof ctx.spawnFamiliar !== 'function') return
        var n = horse ? 2 : 1
        // APPROXIMATED: there is no dedicated fly-orbital familiar def, so this
        // spawns the shared blue fly and overrides its behaviour on the
        // instance (ctx.spawnFamiliar copies opts onto it). If familiar.js
        // reads the behaviour off the def instead, the player still gets a
        // working extra fly — it rams instead of orbiting.
        for (var i = 0; i < n; i++) {
          ctx.spawnFamiliar('blue-fly', {
            behaviour: 'orbital',
            params: {
              r: 11, speed: 345, flying: true,
              orbitR: 72 + i * 18, orbitSpeed: 2.2,
              dmg: 3, cooldown: 0.4, hp: 0, blockShots: true, life: 0
            }
          })
        }
        sfx(ctx, 'familiar-spawn')
        say(ctx, 'Pretty Fly', '#7ab0e0')
      }
    },

    // -- 11 -----------------------------------------------------------------
    {
      id: 'range-down',
      num: 11,
      name: 'Range Down',
      kind: 'pill',
      good: false,
      horse: false,
      desc: 'Range down',
      info: '↓ -1 Range',
      use: function (p, ctx, horse) {
        // -1 range = one tile less = -80 units (ARCHITECTURE.md §4.1).
        applyStatPill(p, ctx, 'range', -1, horse)
      }
    },

    // -- 12 -----------------------------------------------------------------
    {
      id: 'range-up',
      num: 12,
      name: 'Range Up',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Range up',
      info: '↑ +1.25 Range',
      use: function (p, ctx, horse) {
        // +1.25 range = 1.25 tiles = +100 units.
        applyStatPill(p, ctx, 'range', 1, horse)
      }
    },

    // -- 13 -----------------------------------------------------------------
    {
      id: 'speed-down',
      num: 13,
      name: 'Speed Down',
      kind: 'pill',
      good: false,
      horse: false,
      desc: 'Speed down',
      info: '↓ -0.12 Speed',
      use: function (p, ctx, horse) {
        applyStatPill(p, ctx, 'speed', -1, horse)
      }
    },

    // -- 14 -----------------------------------------------------------------
    {
      id: 'speed-up',
      num: 14,
      name: 'Speed Up',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Speed up',
      info: '↑ +0.15 Speed',
      use: function (p, ctx, horse) {
        applyStatPill(p, ctx, 'speed', 1, horse)
      }
    },

    // -- 15 -----------------------------------------------------------------
    {
      id: 'tears-down',
      num: 15,
      name: 'Tears Down',
      kind: 'pill',
      good: false,
      horse: false,
      desc: 'Tears down',
      info: '↓ -0.28 Tears',
      use: function (p, ctx, horse) {
        // Additive in tears-per-second space, like every other tears change.
        applyStatPill(p, ctx, 'tears', -1, horse)
      }
    },

    // -- 16 -----------------------------------------------------------------
    {
      id: 'tears-up',
      num: 16,
      name: 'Tears Up',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Tears up',
      info: '↑ +0.35 Tears',
      use: function (p, ctx, horse) {
        applyStatPill(p, ctx, 'tears', 1, horse)
      }
    },

    // -- 17 -----------------------------------------------------------------
    {
      id: 'luck-down',
      num: 17,
      name: 'Luck Down',
      kind: 'pill',
      good: false,
      horse: false,
      desc: 'Luck down',
      info: '↓ -1 Luck',
      use: function (p, ctx, horse) {
        applyStatPill(p, ctx, 'luck', -1, horse)
      }
    },

    // -- 18 -----------------------------------------------------------------
    {
      id: 'luck-up',
      num: 18,
      name: 'Luck Up',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Luck up',
      info: '↑ +1 Luck',
      use: function (p, ctx, horse) {
        applyStatPill(p, ctx, 'luck', 1, horse)
      }
    },

    // -- 19 -----------------------------------------------------------------
    {
      id: 'telepills',
      num: 19,
      name: 'Telepills',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Random teleport',
      info: 'Teleports Isaac to a random room · Small chance to teleport Isaac to the I AM ERROR room',
      use: function (p, ctx, horse) {
        if (!p || !ctx || typeof ctx.teleport !== 'function') return
        // Horse Telepills is far keener on the Error room; ctx.teleport returns
        // false when the floor has none, so fall through to a normal jump.
        var wantError = chanceOf(ctx, horse ? 0.5 : 0.02)
        var done = false
        if (wantError) done = ctx.teleport('error')
        if (!done) done = ctx.teleport('random')
        if (done) {
          sfx(ctx, 'trapdoor')
          say(ctx, 'Telepills', '#a0e0e0')
        }
      }
    },

    // -- 20 -----------------------------------------------------------------
    {
      id: '48-hour-energy',
      num: 20,
      name: '48 Hour Energy!',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Recharges your active',
      info: 'Fully recharges the active item · Spawns 1-2 batteries',
      use: function (p, ctx, horse) {
        if (!p || !ctx) return
        if (typeof ctx.addCharge === 'function') {
          // Overshoot and let IS.addCharge clamp to each slot's maxCharge.
          ctx.addCharge(99, 0)
          ctx.addCharge(99, 1)
        }
        var n = horse ? 2 + intOf(ctx, 3) : 1 + intOf(ctx, 2)
        if (typeof ctx.spawnPickup === 'function') {
          for (var i = 0; i < n; i++) {
            var pos = typeof ctx.freeFloorPos === 'function' ? ctx.freeFloorPos() : playerPos(p, ctx)
            ctx.spawnPickup('battery', pos.x, pos.y, null)
          }
        }
        sfx(ctx, 'charge-ready')
        say(ctx, '48 Hour Energy!', '#e0d040')
      }
    },

    // -- 21 -----------------------------------------------------------------
    {
      id: 'hematemesis',
      num: 21,
      name: 'Hematemesis',
      kind: 'pill',
      good: false,
      horse: false,
      desc: 'Blood for hearts',
      info: 'Drains all but one heart container · Spawns 1-4 Red Hearts',
      use: function (p, ctx, horse) {
        if (!p) return
        var keep = horse ? 1 : 2
        if (p.hearts && typeof p.hearts.red === 'number' && p.hearts.red > keep) {
          // A drain, not a hit: no invulnerability frames, no damage hooks, and
          // it can never kill — which is why it writes p.hearts.red directly
          // instead of going through IS.damagePlayer.
          p.hearts.red = keep
        }
        var n = horse ? 2 + intOf(ctx, 5) : 1 + intOf(ctx, 4)
        if (ctx && typeof ctx.spawnPickup === 'function') {
          for (var i = 0; i < n; i++) {
            var pos = typeof ctx.freeFloorPos === 'function' ? ctx.freeFloorPos() : playerPos(p, ctx)
            ctx.spawnPickup('heart', pos.x, pos.y, null)
          }
        }
        if (ctx && typeof ctx.spawnEffect === 'function') {
          var at = playerPos(p, ctx)
          ctx.spawnEffect('blood', at.x, at.y, { n: 18, colour: '#a02028' })
        }
        say(ctx, 'Hematemesis', '#a02028')
      }
    },

    // -- 22 -----------------------------------------------------------------
    {
      id: 'paralysis',
      num: 22,
      name: 'Paralysis',
      kind: 'pill',
      good: false,
      horse: false,
      desc: 'Frozen stiff',
      info: 'Prevents Isaac from moving and shooting for 2 seconds',
      use: function (p, ctx, horse) {
        if (!p) return
        var secs = horse ? 4 : 2
        // 'petrify' is the engine's cannot-move-or-act status and applies to any
        // entity, the player included, so this is the real thing rather than a
        // bespoke timer. The no-shoot expiry is written too, because suppressing
        // fire is the half of paralysis a movement status might not cover.
        if (ctx && typeof ctx.applyStatus === 'function') ctx.applyStatus(p, 'petrify', secs)
        until(p, ctx, 'pill:noShootUntil', secs)
        say(ctx, 'Paralysis', '#8a9ab0')
      }
    },

    // -- 23 -----------------------------------------------------------------
    {
      id: 'i-can-see-forever',
      num: 23,
      name: 'I can see forever!',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Secret rooms open',
      info: 'Opens all secret room entrances on the floor',
      use: function (p, ctx, horse) {
        if (!p || !ctx) return
        var floor = ctx.floor || (ctx.run && ctx.run.floor) || null
        var rooms = floor && Array.isArray(floor.rooms) ? floor.rooms : []
        var opened = 0
        for (var i = 0; i < rooms.length; i++) {
          var rm = rooms[i]
          if (!rm) continue
          var doors = Array.isArray(rm.doors) ? rm.doors : []
          for (var j = 0; j < doors.length; j++) {
            var d = doors[j]
            if (!d || !SECRETISH[d.kind]) continue
            d.locked = false
            d.open = true
            d.found = true
            opened++
          }
          if (!rm.meta || typeof rm.meta !== 'object') rm.meta = {}
          // Horse: the whole floor goes on the map, not just the secrets.
          if (horse || SECRETISH[rm.type]) rm.meta.revealed = true
        }
        // Horse also leaves the sight behind as a permanent flag. It is a bonus
        // on top of the doors above, never the only effect, because
        // IS.recalcStats may rebuild p.flags from the item list.
        if (horse && p.flags && typeof p.flags.add === 'function') p.flags.add('seeSecretRooms')
        if (opened) sfx(ctx, 'secret-found')
        say(ctx, 'I can see forever!', '#e0e0a0')
      }
    },

    // -- 24 -----------------------------------------------------------------
    {
      id: 'pheromones',
      num: 24,
      name: 'Pheromones',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Charms the room',
      info: 'Charms all enemies in the room',
      use: function (p, ctx, horse) {
        if (!p || !ctx || typeof ctx.charmAllEnemies !== 'function') return
        // APPROXIMATED: the charm lasts "for the room", and statuses are timed,
        // so this is a duration long enough to outlast any fight.
        var n = ctx.charmAllEnemies(horse ? 240 : 120)
        if (ctx.spawnEffect) {
          var at = playerPos(p, ctx)
          ctx.spawnEffect('ring', at.x, at.y, { colour: '#e090c8', r0: 8, r1: 220, life: 0.6, width: 6 })
        }
        say(ctx, n ? 'Pheromones' : 'Pheromones…', '#e090c8')
      }
    },

    // -- 25 -----------------------------------------------------------------
    {
      id: 'amnesia',
      num: 25,
      name: 'Amnesia',
      kind: 'pill',
      good: false,
      horse: false,
      desc: 'Map hidden',
      info: 'Hides the map for the floor',
      use: function (p, ctx, horse) {
        if (!p || !ctx) return
        var C = IS.CURSE || {}
        // Hiding the map is exactly Curse of the Lost, which the engine already
        // owns, so the pill sets the curse bit on both the run and the floor.
        // Horse also hides the health bar (Curse of the Unknown).
        var bits = (C.LOST || 0) | (horse ? (C.UNKNOWN || 0) : 0)
        var run = ctx.run
        if (run) run.curses = (run.curses || 0) | bits
        var floor = ctx.floor || (run && run.floor) || null
        if (floor) floor.curses = (floor.curses || 0) | bits
        sfx(ctx, 'curse-sting')
        say(ctx, 'Amnesia', '#8a8a9a')
      }
    },

    // -- 26 -----------------------------------------------------------------
    {
      id: 'lemon-party',
      num: 26,
      name: 'Lemon Party',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Damaging puddle',
      info: 'Spawns a large puddle on the ground which damages enemies',
      use: function (p, ctx, horse) {
        if (!p || !ctx || typeof ctx.spawnCreep !== 'function') return
        var at = playerPos(p, ctx)
        var big = horse ? 1.6 : 1
        // One large puddle plus a few overlapping blobs, so the pool has an
        // irregular edge instead of being a perfect disc.
        ctx.spawnCreep(at.x, at.y, 110 * big, {
          colour: '#e8d048', kind: 'green', dmg: horse ? 4 : 2, life: horse ? 45 : 30
        })
        for (var i = 0; i < 4; i++) {
          var a = rangeOf(ctx, 0, Math.PI * 2)
          var d = rangeOf(ctx, 30, 70) * big
          ctx.spawnCreep(at.x + Math.cos(a) * d, at.y + Math.sin(a) * d, 60 * big, {
            colour: '#e0c840', kind: 'green', dmg: horse ? 4 : 2, life: horse ? 45 : 30
          })
        }
        sfx(ctx, 'fart')
        say(ctx, 'Lemon Party', '#e8d048')
      }
    },

    // -- 27 -----------------------------------------------------------------
    {
      id: 'r-u-a-wizard',
      num: 27,
      name: 'R U A Wizard?',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Diagonal tears',
      info: 'Isaac shoots diagonally for 30 seconds',
      use: function (p, ctx, horse) {
        if (!p) return
        // APPROXIMATED: a firing-direction override needs the fire path, and a
        // pill has no per-tick hook, so the expiry goes in the documented
        // p.cache channel (see the header) for player.js to read. Horse doubles
        // the duration.
        until(p, ctx, 'pill:diagonalUntil', horse ? 60 : 30)
        say(ctx, 'R U A Wizard?', '#a08ae0')
      }
    },

    // -- 28 -----------------------------------------------------------------
    {
      id: 'percs',
      num: 28,
      name: 'Percs!',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Damage capped',
      info: 'Reduces all damage taken to half a heart for the room',
      use: function (p, ctx, horse) {
        if (!p) return
        var c = cacheOf(p)
        if (!c) return
        // APPROXIMATED: room-scoped damage clamping lives in the damage path.
        // The room object itself is the token — identity comparison against
        // ctx.room, so it expires the moment Isaac leaves. Horse also clears any
        // Addicted! in force and hands over a soul heart.
        c['pill:percsRoom'] = (ctx && ctx.room) || null
        if (horse) {
          c['pill:addictedRoom'] = null
          if (ctx && typeof ctx.addSoul === 'function') ctx.addSoul(2)
        }
        say(ctx, 'Percs!', '#e0e0e0')
      }
    },

    // -- 29 -----------------------------------------------------------------
    {
      id: 'addicted',
      num: 29,
      name: 'Addicted!',
      kind: 'pill',
      good: false,
      horse: false,
      desc: 'Damage doubled',
      info: 'Increases all damage taken to a full heart for the room',
      use: function (p, ctx, horse) {
        if (!p) return
        var c = cacheOf(p)
        if (!c) return
        // APPROXIMATED: same channel as Percs!, opposite sign — the damage path
        // raises every hit to at least 2 half-hearts while this room is current.
        c['pill:addictedRoom'] = (ctx && ctx.room) || null
        c['pill:percsRoom'] = null
        // Horse: nastier still — take the hit right now as well.
        if (horse && ctx && typeof ctx.damagePlayer === 'function') ctx.damagePlayer(2, 'pill')
        say(ctx, 'Addicted!', '#c05a5a')
      }
    },

    // -- 30 -----------------------------------------------------------------
    {
      id: 're-lax',
      num: 30,
      name: 'Re-Lax',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Poop trail',
      info: 'Isaac spawns poop behind him for 2 seconds',
      use: function (p, ctx, horse) {
        if (!p || !ctx || typeof ctx.spawnPoop !== 'function') return
        var at = playerPos(p, ctx)
        var aim = aimOf(p)
        // APPROXIMATED: the trail is laid over 2 seconds of walking and a pill
        // cannot tick, so the whole line is placed at once behind Isaac, using
        // his aim as the "behind" direction. Same number of poops, no walk.
        var n = horse ? 6 : 3
        var tile = IS.TILE || 80
        for (var i = 0; i < n; i++) {
          ctx.spawnPoop(at.x - aim.x * tile * (i + 1) * 0.8, at.y - aim.y * tile * (i + 1) * 0.8)
        }
        sfx(ctx, 'fart')
        say(ctx, 'Re-Lax', '#9a7a4a')
      }
    },

    // -- 31 -----------------------------------------------------------------
    {
      id: 'item-31',
      num: 31,
      name: '???',
      kind: 'pill',
      good: false,
      horse: false,
      desc: 'Curse of the Maze',
      info: 'Curse of the Maze effect for the floor',
      use: function (p, ctx, horse) {
        if (!p || !ctx) return
        var C = IS.CURSE || {}
        // Horse: the maze plus the dark, which is what makes it a horse pill.
        var bits = (C.MAZE || 0) | (horse ? (C.DARKNESS || 0) : 0)
        var run = ctx.run
        if (run) run.curses = (run.curses || 0) | bits
        var floor = ctx.floor || (run && run.floor) || null
        if (floor) floor.curses = (floor.curses || 0) | bits
        sfx(ctx, 'curse-sting')
        say(ctx, '???', '#8a6a9a')
      }
    },

    // -- 32 -----------------------------------------------------------------
    {
      id: 'one-makes-you-larger',
      num: 32,
      name: 'One makes you larger',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Bigger',
      info: "Increases Isaac's size · Doesn't affect his hitbox",
      use: function (p, ctx, horse) {
        if (!p) return
        var c = cacheOf(p)
        if (!c) return
        // APPROXIMATED: render-only, so the scale goes in the documented cache
        // channel for the player draw call. The hitbox is p.r and is
        // deliberately left alone — the pill says so.
        var s = typeof c['pill:sizeScale'] === 'number' ? c['pill:sizeScale'] : 1
        c['pill:sizeScale'] = clamp(s * (horse ? 1.6 : 1.3), 0.5, 2.5)
        say(ctx, 'One makes you larger', '#c0d060')
      }
    },

    // -- 33 -----------------------------------------------------------------
    {
      id: 'one-makes-you-small',
      num: 33,
      name: 'One makes you small',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Smaller',
      info: "Decreases Isaac's size · Also decreases his hitbox",
      use: function (p, ctx, horse) {
        if (!p) return
        var c = cacheOf(p)
        if (!c) return
        var s = typeof c['pill:sizeScale'] === 'number' ? c['pill:sizeScale'] : 1
        c['pill:sizeScale'] = clamp(s * (horse ? 0.62 : 0.78), 0.4, 2.5)
        // The hitbox half is real: p.r is the player's collision radius.
        if (typeof p.r === 'number') p.r = clamp(p.r * (horse ? 0.7 : 0.85), 12, IS.PLAYER_R || 26)
        say(ctx, 'One makes you small', '#60c0d0')
      }
    },

    // -- 34 -----------------------------------------------------------------
    {
      id: 'infested',
      num: 34,
      name: 'Infested!',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Spiders from poop',
      info: 'Spawns 1 blue spider for each poop in the room',
      use: function (p, ctx, horse) {
        if (!p || !ctx || typeof ctx.spawnFamiliar !== 'function') return
        var grid = gridOf(ctx)
        var per = horse ? 2 : 1
        var n = 0
        for (var i = 0; i < grid.length; i++) {
          var g = grid[i]
          if (!g || g.broken) continue
          var kind = typeof g.kind === 'string' ? g.kind : ''
          if (kind.indexOf('poop') < 0) continue
          for (var j = 0; j < per; j++) { ctx.spawnFamiliar('blue-spider', null); n++ }
        }
        if (n) sfx(ctx, 'familiar-spawn')
        say(ctx, n ? 'Infested!' : 'No poop here', '#7ab0e0')
      }
    },

    // -- 35 -----------------------------------------------------------------
    {
      id: 'infested-35',
      num: 35,
      name: 'Infested?',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Spiders from enemies',
      info: 'Spawn 1 blue spider for each enemy in the room · Spawns 1-3 blue spiders if there are no enemies',
      use: function (p, ctx, horse) {
        if (!p || !ctx || typeof ctx.spawnFamiliar !== 'function') return
        var list = livingOf(ctx)
        var per = horse ? 2 : 1
        var n = list.length * per
        if (!list.length) n = (horse ? 2 : 1) + intOf(ctx, horse ? 5 : 3)
        for (var i = 0; i < n; i++) ctx.spawnFamiliar('blue-spider', null)
        if (n) sfx(ctx, 'familiar-spawn')
        say(ctx, 'Infested?', '#7ab0e0')
      }
    },

    // -- 36 -----------------------------------------------------------------
    {
      id: 'power-pill',
      num: 36,
      name: 'Power Pill!',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Waka waka',
      info: '6.5s: invincible, cannot shoot, 40 contact damage/s, heals per 2 kills, fears all enemies',
      use: function (p, ctx, horse) {
        if (!p) return
        var secs = horse ? 13 : 6.5
        var list = livingOf(ctx)
        // Real half: every enemy in the room runs away, and Isaac is untouchable.
        for (var i = 0; i < list.length; i++) {
          if (ctx && typeof ctx.applyStatus === 'function') ctx.applyStatus(list[i], 'fear', secs)
        }
        var t = nowT(ctx) + secs
        if (typeof p.invulnUntil === 'number' && p.invulnUntil < t) p.invulnUntil = t
        else if (typeof p.invulnUntil !== 'number') p.invulnUntil = t
        // APPROXIMATED: contact damage, the shooting lock-out and the heal-every
        // -two-kills rider need the player update path, so they go in the
        // documented cache channel. p.cache['pill:invulnUntil'] mirrors
        // p.invulnUntil because the clock that field is compared against is
        // player.js's to choose.
        until(p, ctx, 'pill:invulnUntil', secs)
        until(p, ctx, 'pill:contactUntil', secs)
        until(p, ctx, 'pill:noShootUntil', secs)
        var c = cacheOf(p)
        if (c) c['pill:killHealEvery'] = 2
        sfx(ctx, 'holy-shield')
        say(ctx, 'Power Pill!', '#e0d040')
      }
    },

    // -- 37 -----------------------------------------------------------------
    {
      id: 'retro-vision',
      num: 37,
      name: 'Retro Vision',
      kind: 'pill',
      good: false,
      horse: false,
      desc: 'Pixelated',
      info: 'Pixelates the screen for 30 seconds',
      use: function (p, ctx, horse) {
        if (!p || !ctx) return
        // APPROXIMATED: purely a post-process, which lives in render.js. The
        // expiry goes on run.flags (see the header) because the effect belongs
        // to the screen, not to the player. Horse doubles the duration.
        runFlagUntil(ctx, 'retroVisionUntil', horse ? 60 : 30)
        if (typeof ctx.spawnEffect === 'function') ctx.spawnEffect('flash', null, null, { colour: '#6a5a8a', secs: 0.2 })
        say(ctx, 'Retro Vision', '#8a7ab0')
      }
    },

    // -- 38 -----------------------------------------------------------------
    {
      id: 'friends-till-the-end',
      num: 38,
      name: 'Friends Till The End!',
      kind: 'pill',
      good: true,
      horse: false,
      desc: '3 blue flies',
      info: 'Spawns 3 blue flies',
      use: function (p, ctx, horse) {
        if (!p || !ctx || typeof ctx.spawnFamiliar !== 'function') return
        var n = horse ? 6 : 3
        for (var i = 0; i < n; i++) ctx.spawnFamiliar('blue-fly', null)
        sfx(ctx, 'familiar-spawn')
        say(ctx, 'Friends Till The End!', '#7ab0e0')
      }
    },

    // -- 39 -----------------------------------------------------------------
    {
      id: 'x-lax',
      num: 39,
      name: 'X-Lax',
      kind: 'pill',
      good: false,
      horse: false,
      desc: 'Slippery creep',
      info: 'Spawns a pool of slippery creep',
      use: function (p, ctx, horse) {
        if (!p || !ctx || typeof ctx.spawnCreep !== 'function') return
        var at = playerPos(p, ctx)
        var big = horse ? 1.6 : 1
        // APPROXIMATED: IS.fx.creep has no slippery kind, so the pool is spawned
        // as white creep — it is really there and really visible, but the
        // sliding is fx-side and does not happen yet.
        ctx.spawnCreep(at.x, at.y, 100 * big, {
          colour: '#c8b078', kind: 'white', life: horse ? 60 : 40
        })
        for (var i = 0; i < 3; i++) {
          var a = rangeOf(ctx, 0, Math.PI * 2)
          var d = rangeOf(ctx, 25, 65) * big
          ctx.spawnCreep(at.x + Math.cos(a) * d, at.y + Math.sin(a) * d, 55 * big, {
            colour: '#c8b078', kind: 'white', life: horse ? 60 : 40
          })
        }
        sfx(ctx, 'fart')
        say(ctx, 'X-Lax', '#c8b078')
      }
    },

    // -- 40 -----------------------------------------------------------------
    {
      id: 'somethings-wrong',
      num: 40,
      name: "Something's wrong...",
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Slowing creep',
      info: 'Spawns a pool of slowing creep',
      use: function (p, ctx, horse) {
        if (!p || !ctx || typeof ctx.spawnCreep !== 'function') return
        var at = playerPos(p, ctx)
        var big = horse ? 1.6 : 1
        ctx.spawnCreep(at.x, at.y, 100 * big, {
          colour: '#3a3040', kind: 'black', slow: horse ? 0.65 : 0.45, life: horse ? 60 : 40
        })
        for (var i = 0; i < 3; i++) {
          var a = rangeOf(ctx, 0, Math.PI * 2)
          var d = rangeOf(ctx, 25, 65) * big
          ctx.spawnCreep(at.x + Math.cos(a) * d, at.y + Math.sin(a) * d, 55 * big, {
            colour: '#3a3040', kind: 'black', slow: horse ? 0.65 : 0.45, life: horse ? 60 : 40
          })
        }
        sfx(ctx, 'fart')
        say(ctx, "Something's wrong...", '#6a5a7a')
      }
    },

    // -- 41 -----------------------------------------------------------------
    {
      id: 'im-drowsy',
      num: 41,
      name: "I'm Drowsy...",
      kind: 'pill',
      good: false,
      horse: false,
      desc: 'Everything slows',
      info: 'Slows Isaac and all enemies in the room',
      use: function (p, ctx, horse) {
        if (!p || !ctx || typeof ctx.applyStatus !== 'function') return
        var secs = horse ? 30 : 15
        // 'slow' is a real engine status and applies to any entity, so both
        // halves of this pill are the genuine article.
        ctx.applyStatus(p, 'slow', secs)
        var list = livingOf(ctx)
        for (var i = 0; i < list.length; i++) ctx.applyStatus(list[i], 'slow', secs)
        say(ctx, "I'm Drowsy...", '#7a8ab0')
      }
    },

    // -- 42 -----------------------------------------------------------------
    {
      id: 'im-excited',
      num: 42,
      name: "I'm Excited!!",
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Everything speeds up',
      info: 'Speeds up Isaac and all enemies in the room · Triggers again after 30 and 60 seconds',
      use: function (p, ctx, horse) {
        if (!p) return
        // The enemy half is real and immediate: entity speed is a plain field
        // and enemies are room-scoped, so the boost dies with the room.
        var list = livingOf(ctx)
        var mult = horse ? PILL_HASTE * PILL_HASTE : PILL_HASTE
        for (var i = 0; i < list.length; i++) {
          var e = list[i]
          if (e && typeof e.speed === 'number') e.speed *= mult
        }
        // APPROXIMATED: there is no haste status for the player and no per-tick
        // hook to re-trigger from, so Isaac's side is one continuous window in
        // the documented cache channel (90s) instead of three separate pulses at
        // 0s, 30s and 60s.
        until(p, ctx, 'pill:hasteUntil', horse ? 180 : 90)
        say(ctx, "I'm Excited!!", '#e0a040')
      }
    },

    // -- 43 -----------------------------------------------------------------
    {
      id: 'gulp',
      num: 43,
      name: 'Gulp!',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Eats your trinket',
      info: "Consumes Isaac's trinket and grants its effects permanently",
      use: function (p, ctx, horse) {
        if (!p || !Array.isArray(p.trinkets)) return
        var slots = horse ? [0, 1] : [0]
        var eaten = 0
        for (var s = 0; s < slots.length; s++) {
          var slot = slots[s]
          var id = p.trinkets[slot]
          if (!id) {
            // Nothing in that slot: try the other one before giving up.
            for (var k = 0; k < p.trinkets.length; k++) {
              if (p.trinkets[k]) { slot = k; id = p.trinkets[k]; break }
            }
          }
          if (!id) continue
          var def = IS.trinketsById ? IS.trinketsById[id] : null
          p.trinkets[slot] = null
          // APPROXIMATED: smelting is "effects without a slot", and the engine
          // has no smelted list yet. The declarative half is folded into p.base
          // here and is therefore genuinely permanent; the id is recorded on
          // p.smelted as the channel a future player.js walks to replay the
          // trinket's hooks. A reader must NOT re-apply stats/mult from
          // p.smelted — they are already in p.base.
          if (def && p.base) {
            var st = def.stats || null
            var ml = def.mult || null
            var key
            if (st) {
              for (key in st) {
                if (typeof p.base[key] !== 'number' || typeof st[key] !== 'number') continue
                p.base[key] = p.base[key] + st[key]
              }
            }
            if (ml) {
              for (key in ml) {
                if (typeof p.base[key] !== 'number' || typeof ml[key] !== 'number') continue
                p.base[key] = p.base[key] * ml[key]
              }
            }
          }
          if (!Array.isArray(p.smelted)) p.smelted = []
          p.smelted.push(id)
          eaten++
        }
        if (!eaten) { say(ctx, 'Nothing to gulp', '#a09888'); return }
        recalc(p)
        sfx(ctx, 'item-pickup')
        say(ctx, 'Gulp!', '#c0a060')
      }
    },

    // -- 44 -----------------------------------------------------------------
    {
      id: 'horf',
      num: 44,
      name: 'Horf!',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'One Ipecac shot',
      info: 'Shoots one Ipecac tear',
      use: function (p, ctx, horse) {
        if (!p || !ctx || typeof ctx.spawnTear !== 'function') return
        var at = playerPos(p, ctx)
        var aim = aimOf(p)
        var sp = (IS.TEAR_SPEED || 620) * statOf(p, 'shotSpeed', 1) * 0.8
        var dmg = statOf(p, 'damage', IS.BASE_DAMAGE || 3.5) * 2
        var n = horse ? 3 : 1
        var spread = 0.32
        for (var i = 0; i < n; i++) {
          var a = Math.atan2(aim.y, aim.x) + (i - (n - 1) / 2) * spread
          ctx.spawnTear({
            x: at.x,
            y: at.y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            dmg: dmg,
            r: 14,
            // The engine owns what these flags do; the pill only asks for them.
            flags: ['explosive', 'poison'],
            friendly: true
          })
        }
        sfx(ctx, 'tear-fire')
        say(ctx, 'Horf!', '#8ac05a')
      }
    },

    // -- 45 -----------------------------------------------------------------
    {
      id: 'feels-like-im-walking-on-sunshine',
      num: 45,
      name: "Feels like I'm walking on sunshine!",
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Invincible, unarmed',
      info: "Receive for 6 seconds: invincibility · Isaac can't shoot (no contact damage)",
      use: function (p, ctx, horse) {
        if (!p) return
        var secs = horse ? 12 : 6
        var t = nowT(ctx) + secs
        if (typeof p.invulnUntil === 'number' && p.invulnUntil < t) p.invulnUntil = t
        else if (typeof p.invulnUntil !== 'number') p.invulnUntil = t
        // Mirrored into the cache channel as well: p.invulnUntil's clock is
        // player.js's choice, and one of the two will be the one it reads.
        until(p, ctx, 'pill:invulnUntil', secs)
        // APPROXIMATED: suppressing fire needs the fire path, so it is the
        // documented no-shoot expiry rather than something this pill can do.
        until(p, ctx, 'pill:noShootUntil', secs)
        if (ctx && typeof ctx.spawnEffect === 'function') {
          var at = playerPos(p, ctx)
          ctx.spawnEffect('ring', at.x, at.y, { colour: '#f0e090', r0: 6, r1: 90, life: 0.5, width: 5 })
        }
        sfx(ctx, 'holy-shield')
        say(ctx, 'Walking on sunshine!', '#f0e090')
      }
    },

    // -- 46 -----------------------------------------------------------------
    {
      id: 'vurp',
      num: 46,
      name: 'Vurp!',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Coughs up the last pill',
      info: 'Spawns the last pill used before Vurp!',
      use: function (p, ctx, horse) {
        if (!p || !ctx) return
        // Every other pill records itself in p.cache['pill:history'] (the
        // wrapper at the bottom of this file), and Vurp! deliberately does not,
        // so index 0 really is "the last pill used before Vurp!".
        var h = history(p)
        if (!h.length) { say(ctx, 'Nothing to bring up', '#a09888'); return }
        var wanted = [h[0]]
        if (horse) {
          for (var i = 1; i < h.length; i++) { if (h[i] !== h[0]) { wanted.push(h[i]); break } }
          if (wanted.length === 1) wanted.push(h[0])
        }
        var spawned = 0
        for (var j = 0; j < wanted.length; j++) {
          var id = wanted[j]
          if (!id) continue
          var pos = playerPos(p, ctx)
          var a = rangeOf(ctx, 0, Math.PI * 2)
          var ok = null
          if (typeof ctx.spawnPickup === 'function') {
            ok = ctx.spawnPickup('pill', pos.x + Math.cos(a) * 36, pos.y + Math.sin(a) * 36, { id: id, pillId: id })
          }
          // No room to drop it in (a transition): put it straight in a pocket.
          if (!ok && typeof ctx.givePocket === 'function') ok = ctx.givePocket('pill', id)
          if (ok) spawned++
        }
        if (spawned) sfx(ctx, 'pill-use')
        say(ctx, 'Vurp!', '#8aa050')
      }
    },

    // -- 47 -----------------------------------------------------------------
    {
      id: 'shot-speed-down',
      num: 47,
      name: 'Shot speed Down',
      kind: 'pill',
      good: false,
      horse: false,
      desc: 'Shot speed down',
      info: '↓ -0.15 Shot speed',
      use: function (p, ctx, horse) {
        applyStatPill(p, ctx, 'shotSpeed', -1, horse)
      }
    },

    // -- 48 -----------------------------------------------------------------
    {
      id: 'shot-speed-up',
      num: 48,
      name: 'Shot speed Up',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'Shot speed up',
      info: '↑ +0.15 Shot speed',
      use: function (p, ctx, horse) {
        applyStatPill(p, ctx, 'shotSpeed', 1, horse)
      }
    },

    // -- 49 -----------------------------------------------------------------
    {
      id: 'experimental-pill',
      num: 49,
      name: 'Experimental Pill',
      kind: 'pill',
      good: true,
      horse: false,
      desc: 'One up, one down',
      info: '↑ Increases 1 random stat · ↓ Decreases 1 random stat',
      use: function (p, ctx, horse) {
        if (!p) return
        // Two distinct stats from the same table the stat pills use, so the
        // magnitudes can never drift apart. Both rolls come from ctx.
        var n = STAT_PILLS.length
        var i = intOf(ctx, n)
        var j = intOf(ctx, n - 1)
        if (j >= i) j++
        if (j >= n) j = (i + 1) % n
        applyStatPill(p, ctx, STAT_PILLS[i].key, 1, horse)
        applyStatPill(p, ctx, STAT_PILLS[j].key, -1, horse)
        say(ctx, 'Experimental Pill', '#c090e0')
      }
    }

  ]

  // --- Vurp! bookkeeping -----------------------------------------------------
  // Wrap every use() so it records itself in p.cache['pill:history'] before it
  // runs. Vurp! is excluded on purpose: it must not overwrite the memory it
  // reads. Doing it here rather than in 49 hand-written calls means a new pill
  // cannot forget.

  function wrapRemember (id, use) {
    return function (p, ctx, horse) {
      if (p) remember(p, id)
      return use(p, ctx, horse)
    }
  }

  for (var w = 0; w < defs.length; w++) {
    var d = defs[w]
    if (!d || typeof d.use !== 'function' || d.id === 'vurp') continue
    d.use = wrapRemember(d.id, d.use)
  }

  IS.definePills(defs)

})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
