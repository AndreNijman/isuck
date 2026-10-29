;(function (IS) {
  'use strict'

  // ---------------------------------------------------------------------------
  // ISUCK — collectibles 461-552.
  //
  // Afterbirth+ proper, the five Booster Packs, and one Repentance stray
  // (Broken Glass Cannon). Schema: ARCHITECTURE.md §5.1. Hook names: §5.2.
  //
  // House rules obeyed here:
  //   * randomness only through ctx (roll/chance/int/range/pick) — never Math.random
  //   * p.stats is never mutated from a hook; stat changes are declarative
  //     (stats/mult), accumulated in p.cache and applied in onStats, or
  //     applied to the stat block `s` that onStats receives
  //   * tear flags are declared, never re-implemented; adding a flag to a live
  //     tear's Set is the only runtime flag work done here
  //   * every hook is written to survive a null room, a missing p.cache and a
  //     ctx whose optional helpers are not there yet
  //
  // APPROXIMATION, stated once for the whole file: there is no ctx call that
  // removes a pickup or an enemy projectile. The items that eat pickups (Void,
  // Compost, Crooked Penny, Moving Box) and the ones that erase enemy shots
  // (Broken Modem, Telekinesis) mark the object `dead = true` and `life = 0`,
  // which is what the engine's own update loops test. If room.js ever grows a
  // removal call, swap `kill()` below for it and nothing else changes.
  // ---------------------------------------------------------------------------

  // --- helpers ---------------------------------------------------------------

  function cache (p) {
    if (!p) return {}
    if (!p.cache) p.cache = {}
    return p.cache
  }

  function stat (p, key, dflt) {
    return (p && p.stats && typeof p.stats[key] === 'number') ? p.stats[key] : dflt
  }

  function dmgOf (p) { return stat(p, 'damage', IS.BASE_DAMAGE || 3.5) }

  function theRoom (room, ctx) { return room || (ctx && ctx.room) || null }

  function d (ax, ay, bx, by) {
    if (typeof IS.dist === 'function') return IS.dist(ax, ay, bx, by)
    var dx = (ax || 0) - (bx || 0)
    var dy = (ay || 0) - (by || 0)
    return Math.sqrt(dx * dx + dy * dy)
  }

  // --- guarded ctx wrappers (a hook must never throw) ------------------------

  function roll (ctx, base, perLuck, cap) {
    try { return !!(ctx && typeof ctx.roll === 'function' && ctx.roll(base, perLuck, cap)) } catch (e) { return false }
  }
  function chance (ctx, pr) {
    try { return !!(ctx && typeof ctx.chance === 'function' && ctx.chance(pr)) } catch (e) { return false }
  }
  function intOf (ctx, n) {
    try {
      var v = ctx && typeof ctx.int === 'function' ? ctx.int(n) : 0
      return typeof v === 'number' ? v : 0
    } catch (e) { return 0 }
  }
  function rangeOf (ctx, a, b) {
    try {
      var v = ctx && typeof ctx.range === 'function' ? ctx.range(a, b) : a
      return typeof v === 'number' ? v : a
    } catch (e) { return a }
  }
  function pickOf (ctx, arr) {
    if (!arr || !arr.length) return null
    try {
      var v = ctx && typeof ctx.pick === 'function' ? ctx.pick(arr) : arr[0]
      return v == null ? arr[0] : v
    } catch (e) { return arr[0] }
  }

  function foes (ctx) {
    var list = null
    try { if (ctx && typeof ctx.livingEnemies === 'function') list = ctx.livingEnemies() } catch (e) { list = null }
    if (Array.isArray(list)) return list
    var room = ctx && ctx.room
    var src = room && Array.isArray(room.enemies) ? room.enemies : []
    var out = []
    for (var i = 0; i < src.length; i++) {
      var e = src[i]
      if (e && !e.dead && !e.friendly) out.push(e)
    }
    return out
  }

  function pickupsOf (ctx) {
    var list = null
    try { if (ctx && typeof ctx.pickups === 'function') list = ctx.pickups() } catch (e) { list = null }
    if (Array.isArray(list)) return list
    var room = ctx && ctx.room
    return room && Array.isArray(room.pickups) ? room.pickups : []
  }

  function gridsOf (ctx) {
    var list = null
    try { if (ctx && typeof ctx.gridObjects === 'function') list = ctx.gridObjects() } catch (e) { list = null }
    if (Array.isArray(list)) return list
    var room = ctx && ctx.room
    return room && Array.isArray(room.grid) ? room.grid : []
  }

  function shotsOf (ctx) {
    var room = ctx && ctx.room
    return room && Array.isArray(room.shots) ? room.shots : []
  }

  function tearsOf (ctx) {
    var room = ctx && ctx.room
    return room && Array.isArray(room.tears) ? room.tears : []
  }

  function kill (o) { if (!o) return; o.dead = true; o.life = 0 }

  function hurt (e, dmg, ctx) {
    if (!e || e.dead || !(dmg > 0)) return
    if (typeof IS.damageEnemy === 'function') {
      try { IS.damageEnemy(e, dmg, { src: 'item' }, ctx); return } catch (err) {}
    }
    if (typeof e.hp === 'number') e.hp -= dmg
  }

  function slay (e, ctx) {
    if (!e || e.dead) return
    if (typeof IS.killEnemy === 'function') {
      try { IS.killEnemy(e, ctx); return } catch (err) {}
    }
    hurt(e, 99999, ctx)
  }

  function shove (e, fromX, fromY, force) {
    if (!e) return
    if (typeof IS.knockback === 'function') {
      try { IS.knockback(e, fromX, fromY, force); return } catch (err) {}
    }
    var dx = (e.x || 0) - (fromX || 0)
    var dy = (e.y || 0) - (fromY || 0)
    var l = Math.sqrt(dx * dx + dy * dy) || 1
    if (typeof e.vx === 'number') e.vx += (dx / l) * force
    if (typeof e.vy === 'number') e.vy += (dy / l) * force
  }

  function status (ctx, e, s, secs) {
    if (!e) return
    try { if (ctx && typeof ctx.applyStatus === 'function') ctx.applyStatus(e, s, secs) } catch (err) {}
  }

  function addFlag (tear, f) {
    if (tear && tear.flags && typeof tear.flags.add === 'function') tear.flags.add(f)
  }

  function spawnFam (ctx, id, opts) {
    try { if (ctx && typeof ctx.spawnFamiliar === 'function') return ctx.spawnFamiliar(id, opts || {}) } catch (e) {}
    return null
  }
  function spawnPick (ctx, kind, x, y, opts) {
    try { if (ctx && typeof ctx.spawnPickup === 'function') return ctx.spawnPickup(kind, x, y, opts || {}) } catch (e) {}
    return null
  }
  function spawnTear (ctx, opts) {
    try { if (ctx && typeof ctx.spawnTear === 'function') return ctx.spawnTear(opts || {}) } catch (e) {}
    return null
  }
  function spawnCreep (ctx, x, y, r, opts) {
    try { if (ctx && typeof ctx.spawnCreep === 'function') return ctx.spawnCreep(x, y, r, opts || {}) } catch (e) {}
    return null
  }
  function spawnLaser (ctx, opts) {
    try { if (ctx && typeof ctx.spawnLaser === 'function') return ctx.spawnLaser(opts || {}) } catch (e) {}
    return null
  }
  function boom (ctx, x, y, opts) {
    try { if (ctx && typeof ctx.bombExplode === 'function') ctx.bombExplode(x, y, opts || {}) } catch (e) {}
  }
  function smash (ctx, g) {
    try { if (ctx && typeof ctx.destroyGrid === 'function') ctx.destroyGrid(g) } catch (e) {}
  }
  function poopAt (ctx, x, y) {
    try { if (ctx && typeof ctx.spawnPoop === 'function') return ctx.spawnPoop(x, y) } catch (e) {}
    return null
  }
  function unlock (ctx, kind) {
    try { if (ctx && typeof ctx.unlockDoor === 'function') ctx.unlockDoor(kind) } catch (e) {}
  }
  function say (ctx, text, x, y, colour) {
    try { if (ctx && typeof ctx.floater === 'function') ctx.floater(text, x, y, colour || '#e8e4dc') } catch (e) {}
  }
  function noise (ctx, name) {
    try { if (ctx && typeof ctx.sfx === 'function') ctx.sfx(name) } catch (e) {}
  }
  function quake (ctx, amount, secs) {
    try { if (ctx && typeof ctx.shake === 'function') ctx.shake(amount, secs) } catch (e) {}
  }
  function recalc (p) {
    if (typeof IS.recalcStats === 'function') { try { IS.recalcStats(p) } catch (e) {} }
  }
  function unfamiliar (p, id) {
    if (typeof IS.removeFamiliar === 'function') { try { IS.removeFamiliar(p, id) } catch (e) {} }
  }

  function freeSpot (ctx, p) {
    try {
      var v = ctx && typeof ctx.freeFloorPos === 'function' ? ctx.freeFloorPos() : null
      if (v && typeof v.x === 'number' && typeof v.y === 'number') return v
    } catch (e) {}
    return {
      x: p && typeof p.x === 'number' ? p.x : 520,
      y: p && typeof p.y === 'number' ? p.y : 280
    }
  }

  function aim (p) {
    var h = p && p.head
    var x = h && typeof h.x === 'number' ? h.x : 0
    var y = h && typeof h.y === 'number' ? h.y : 0
    var l = Math.sqrt(x * x + y * y)
    if (l < 0.001) return { x: 0, y: 1 }
    return { x: x / l, y: y / l }
  }

  function roomPool (ctx) {
    var room = ctx && ctx.room
    var t = room && room.type
    var map = {
      treasure: 'treasure', shop: 'shop', boss: 'boss', devil: 'devil',
      angel: 'angel', secret: 'secret', 'super-secret': 'secret',
      'ultra-secret': 'ultra-secret', library: 'library', curse: 'curse',
      planetarium: 'planetarium'
    }
    return (t && map[t]) || 'treasure'
  }

  function rollItemId (ctx, pool) {
    try {
      var id = ctx && typeof ctx.rollItem === 'function' ? ctx.rollItem(pool, {}) : null
      if (id && IS.itemsById && IS.itemsById[id]) return id
    } catch (e) {}
    return null
  }

  function pedestal (ctx, p, itemId) {
    if (!itemId) return
    var s = freeSpot(ctx, p)
    spawnPick(ctx, 'item', s.x, s.y, { itemId: itemId })
  }

  // pickup shape is engine-owned; these are the plausible carriers of an item id
  function itemIdOf (pk) {
    if (!pk) return null
    var id = pk.itemId || pk.item || pk.collectible || null
    if (!id && pk.kind === 'item' && typeof pk.id === 'string') id = pk.id
    return (id && IS.itemsById && IS.itemsById[id]) ? id : null
  }

  // Additive stat parcels used by the "random stat up" items (Void, Dataminer).
  var STAT_UPS = [
    { k: 'damage', v: 0.5 }, { k: 'tears', v: 0.2 }, { k: 'range', v: 40 },
    { k: 'shotSpeed', v: 0.1 }, { k: 'speed', v: 0.06 }, { k: 'luck', v: 0.5 }
  ]
  var STAT_DOWNS = [
    { k: 'damage', v: -0.4 }, { k: 'tears', v: -0.2 }, { k: 'range', v: -40 },
    { k: 'shotSpeed', v: -0.1 }, { k: 'speed', v: -0.06 }, { k: 'luck', v: -0.5 }
  ]
  var ROOM_TEAR_FLAGS = [
    'piercing', 'spectral', 'homing', 'bouncing', 'poison', 'burn', 'freeze',
    'slow', 'charm', 'fear', 'confusion', 'bleed', 'shrink', 'knockback'
  ]

  function applyParcel (s, key, amount) {
    if (!s || typeof amount !== 'number') return
    if (typeof s[key] === 'number') s[key] += amount
  }

  function applyBag (s, bag) {
    if (!s || !bag) return
    for (var k in bag) applyParcel(s, k, bag[k])
  }

  // Copies a def's declarative stats/mult onto a stat block. Used by Metronome
  // (borrowed item) and by Smelter / Marbles (smelted trinkets).
  function applyDefStats (def, s) {
    if (!def || !s) return
    var k
    if (def.stats) {
      for (k in def.stats) {
        if (k === 'fireDelay') continue
        if (typeof s[k] === 'number' && typeof def.stats[k] === 'number') s[k] += def.stats[k]
      }
    }
    if (def.mult) {
      for (k in def.mult) {
        if (typeof s[k] === 'number' && typeof def.mult[k] === 'number') s[k] *= def.mult[k]
      }
    }
  }

  // Smelting: the trinket leaves the slot and its declarative stats become
  // permanent through onStats.
  // APPROXIMATED: a smelted trinket's *hooks* stop firing, because IS.fireHook
  // only walks p.items and p.trinkets and a data file cannot register a new
  // hook source. Stat/mult trinkets smelt perfectly; hook trinkets keep only
  // their numbers.
  function smelt (p, id) {
    if (!id) return false
    var c = cache(p)
    if (!Array.isArray(c.smeltedTrinkets)) c.smeltedTrinkets = []
    c.smeltedTrinkets.push(id)
    return true
  }
  function smeltedStats (p, s) {
    var list = cache(p).smeltedTrinkets
    if (!Array.isArray(list)) return
    for (var i = 0; i < list.length; i++) {
      applyDefStats(IS.trinketsById ? IS.trinketsById[list[i]] : null, s)
    }
  }
  function eatHeldTrinkets (p) {
    if (!p || !Array.isArray(p.trinkets)) return 0
    var n = 0
    for (var i = 0; i < p.trinkets.length; i++) {
      var id = p.trinkets[i]
      if (!id) continue
      if (smelt(p, id)) { p.trinkets[i] = null; n++ }
    }
    return n
  }

  // point-to-segment distance, for Technology Zero's arcs
  function segDist (px, py, ax, ay, bx, by) {
    var vx = bx - ax
    var vy = by - ay
    var wx = px - ax
    var wy = py - ay
    var len2 = vx * vx + vy * vy
    var t = len2 > 0.0001 ? (wx * vx + wy * vy) / len2 : 0
    if (t < 0) t = 0
    if (t > 1) t = 1
    return d(px, py, ax + vx * t, ay + vy * t)
  }

  // ---------------------------------------------------------------------------
  // familiar defs — one per item that grants or spawns a body of its own.
  // params keys are the contract documented in js/data/familiars.js.
  // `sprite` always equals `id`; the sprite phase registers one per familiar id.
  // ---------------------------------------------------------------------------

  IS.defineFamiliars([

    {
      id: 'finger',
      name: 'Finger!',
      sprite: 'finger',
      behaviour: 'laserFamiliar',
      // APPROXIMATED: the real Finger! is a continuous tick of 10% damage in the
      // direction it points. There is no continuous-contact behaviour, so it is
      // a very short, very fast beam instead — same dps, same reach.
      params: {
        r: 14, speed: 330, flying: true, orbitR: 44, orbitSpeed: 1.1,
        dmg: 0.4, fireDelay: 0.15, range: 220, tearFlags: ['piercing'],
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'shade',
      name: 'Shade',
      sprite: 'shade',
      // APPROXIMATED: Shade trails the player on a 0.66s delay and damages by
      // contact. 'follower' is the only player-trailing behaviour, and it
      // attacks by shooting, so its reach is cut to body length (170) and its
      // cadence raised until the dps matches.
      behaviour: 'follower',
      params: {
        r: 24, speed: 300, flying: true, dmg: 5, fireDelay: 0.28, range: 170,
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'depression',
      name: 'Depression',
      sprite: 'depression',
      // the cloud itself does nothing; the item's onUpdate lays the creep and
      // calls down the light beams
      behaviour: 'buffer',
      params: { r: 18, speed: 330, flying: true, dmg: 0, hp: 0, blockShots: false, life: 0 }
    },

    {
      id: 'hushy',
      name: 'Hushy',
      sprite: 'hushy',
      behaviour: 'wanderer',
      params: {
        r: 22, speed: 250, flying: true, dmg: 4, cooldown: 0.4,
        hp: 0, blockShots: true, life: 0
      }
    },

    {
      id: 'lil-monstro',
      name: 'Lil Monstro',
      sprite: 'lil-monstro',
      // APPROXIMATED: the params contract has no shot-count key, so the charged
      // shotgun burst is one heavier knockback shot on a slow cadence.
      behaviour: 'follower',
      params: {
        r: 18, speed: 330, flying: true, dmg: 3.5, fireDelay: 1, range: 420,
        tearFlags: ['knockback'], hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'king-baby',
      name: 'King Baby',
      sprite: 'king-baby',
      behaviour: 'follower',
      params: {
        r: 20, speed: 300, flying: false, dmg: 3.5, fireDelay: 0.8, range: 460,
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'big-chubby',
      name: 'Big Chubby',
      sprite: 'big-chubby',
      behaviour: 'chaser',
      params: {
        r: 30, speed: 95, flying: false, dmg: 5.5, range: 1200, cooldown: 0.4,
        hp: 0, blockShots: true, life: 0
      }
    },

    {
      id: 'brown-nugget',
      name: 'Fly Turret',
      sprite: 'brown-nugget',
      behaviour: 'stationaryDrop',
      params: {
        r: 14, speed: 0, flying: true, dmg: 3.5, fireDelay: 0.6, range: 420,
        hp: 0, blockShots: false, life: 45
      }
    },

    {
      id: 'ghost-pepper',
      name: 'Blue Fire',
      sprite: 'ghost-pepper',
      // a fire is a stationary body: speed 0 wanderer, blocks shots, burns on
      // contact, gone in two seconds
      behaviour: 'wanderer',
      params: {
        r: 16, speed: 0, flying: false, dmg: 4, cooldown: 0.3,
        status: 'burn', statusSecs: 2, hp: 0, blockShots: true, life: 2
      }
    },

    {
      id: 'acid-baby',
      name: 'Acid Baby',
      sprite: 'acid-baby',
      behaviour: 'follower',
      params: {
        r: 16, speed: 330, flying: true, dmg: 3.5, fireDelay: 0.8, range: 460,
        tearFlags: ['poison'], hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'yo-listen',
      name: 'YO LISTEN!',
      sprite: 'yo-listen',
      behaviour: 'buffer',
      params: { r: 12, speed: 360, flying: true, dmg: 0, hp: 0, blockShots: false, life: 0 }
    },

    {
      id: 'sack-of-sacks',
      name: 'Sack of Sacks',
      sprite: 'sack-of-sacks',
      behaviour: 'buffer',
      params: { r: 18, speed: 300, flying: false, dmg: 0, hp: 0, blockShots: false, life: 0 }
    },

    {
      id: 'moms-razor',
      name: "Mom's Razor",
      sprite: 'moms-razor',
      behaviour: 'orbital',
      params: {
        r: 15, speed: 300, flying: true, orbitR: 76, orbitSpeed: 2.6,
        dmg: 5, cooldown: 0.5, status: 'bleed', statusSecs: 8,
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'bloodshot-eye',
      name: 'Bloodshot Eye',
      sprite: 'bloodshot-eye',
      behaviour: 'orbitShooter',
      params: {
        r: 16, speed: 300, flying: true, orbitR: 70, orbitSpeed: 2.2,
        dmg: 3.5, fireDelay: 0.33, range: 400, cooldown: 0.4,
        hp: 0, blockShots: true, life: 0
      }
    },

    {
      id: 'angry-fly',
      name: 'Angry Fly',
      sprite: 'angry-fly',
      // APPROXIMATED: it orbits one chosen enemy until that enemy dies. No
      // familiar behaviour orbits an enemy, so it rams instead — same target
      // selection, same damage, different geometry.
      behaviour: 'chaser',
      params: {
        r: 13, speed: 400, flying: true, dmg: 4, range: 1200, cooldown: 0.3,
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'sprinkler',
      name: 'Sprinkler',
      sprite: 'sprinkler',
      behaviour: 'stationaryDrop',
      params: {
        r: 18, speed: 0, flying: false, dmg: 3.5, fireDelay: 0.22, range: 380,
        hp: 0, blockShots: false, life: 40
      }
    },

    {
      id: 'buddy-in-a-box',
      name: 'Buddy in a Box',
      sprite: 'buddy-in-a-box',
      behaviour: 'follower',
      params: {
        r: 17, speed: 320, flying: true, dmg: 3.5, fireDelay: 0.7, range: 500,
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'lil-delirium',
      name: 'Lil Delirium',
      sprite: 'lil-delirium',
      behaviour: 'chaser',
      params: {
        r: 18, speed: 380, flying: true, dmg: 4, range: 1100, cooldown: 0.4,
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'leprosy',
      name: 'Leprosy',
      sprite: 'leprosy',
      behaviour: 'orbital',
      params: {
        r: 17, speed: 300, flying: true, orbitR: 66, orbitSpeed: 2.2,
        dmg: 4, cooldown: 0.4, hp: 6, blockShots: true, life: 0
      }
    },

    {
      id: '7-seals',
      name: 'Horseman',
      sprite: '7-seals',
      behaviour: 'summoner',
      params: {
        r: 18, speed: 300, flying: true, dmg: 4, cooldown: 5, range: 700,
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'angelic-prism',
      name: 'Angelic Prism',
      sprite: 'angelic-prism',
      behaviour: 'orbital',
      params: {
        r: 18, speed: 300, flying: true, orbitR: 90, orbitSpeed: 1.6,
        dmg: 0, cooldown: 1, hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'lil-spewer',
      name: 'Lil Spewer',
      sprite: 'lil-spewer',
      behaviour: 'follower',
      params: {
        r: 16, speed: 320, flying: false, dmg: 3, fireDelay: 0.9, range: 320,
        tearFlags: ['poison'], status: 'poison', statusSecs: 4,
        hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'mystery-egg',
      name: 'Mystery Egg',
      sprite: 'mystery-egg',
      behaviour: 'buffer',
      params: { r: 14, speed: 300, flying: false, dmg: 0, hp: 0, blockShots: false, life: 0 }
    },

    {
      id: 'slipped-rib',
      name: 'Slipped Rib',
      sprite: 'slipped-rib',
      // APPROXIMATED: reflection is not in the params contract, so the rib eats
      // shots (blockShots) instead of returning them. It deals no contact
      // damage, exactly like the real one.
      behaviour: 'orbital',
      params: {
        r: 20, speed: 300, flying: true, orbitR: 84, orbitSpeed: 2,
        dmg: 0, hp: 0, blockShots: true, life: 0
      }
    },

    {
      id: 'pointy-rib',
      name: 'Pointy Rib',
      sprite: 'pointy-rib',
      // APPROXIMATED: "levitates in front of Isaac" becomes a very tight, very
      // fast orbit — the closest thing the behaviour list has to a held blade.
      behaviour: 'orbital',
      params: {
        r: 16, speed: 300, flying: true, orbitR: 58, orbitSpeed: 3,
        dmg: 6, cooldown: 0.3, hp: 0, blockShots: false, life: 0
      }
    },

    {
      id: 'jaw-bone',
      name: 'Jaw Bone',
      sprite: 'jaw-bone',
      behaviour: 'collector',
      params: {
        r: 16, speed: 400, flying: true, dmg: 5, cooldown: 0.5, range: 500,
        hp: 0, blockShots: false, life: 0
      }
    }

  ])

  // ---------------------------------------------------------------------------
  // collectibles
  // ---------------------------------------------------------------------------

  IS.defineItems([

    {
      num: 461,
      id: 'parasitoid',
      name: 'Parasitoid',
      desc: 'Egg tears',
      info: '15% chance to shoot egg sacks (50% at 5 luck) that leave slowing creep and hatch 1-2 blue spiders or flies',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure'],
      tags: ['tears', 'spider', 'fly', 'offensive'],
      transform: 'spider',
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (!tear) return
          if (!roll(ctx, 0.15, 0.07, 0.5)) return
          tear.parasitoidEgg = true
          if (typeof tear.r === 'number') tear.r *= 1.25
        },
        onTearHit: function (p, tear, enemy, ctx) {
          if (!tear || !tear.parasitoidEgg) return
          tear.parasitoidEgg = false
          var x = enemy ? enemy.x : tear.x
          var y = enemy ? enemy.y : tear.y
          spawnCreep(ctx, x, y, 46, { kind: 'white', slow: true, life: 6 })
          var n = 1 + intOf(ctx, 2)
          for (var i = 0; i < n; i++) {
            spawnFam(ctx, chance(ctx, 0.5) ? 'blue-spider' : 'blue-fly', { x: x, y: y })
          }
        }
      }
    },

    {
      num: 462,
      id: 'eye-of-belial',
      name: 'Eye of Belial',
      desc: 'Piercing, hungrier tears',
      info: '+1.5 range, piercing tears; the first enemy a tear hits doubles its damage and makes it homing',
      kind: 'passive',
      quality: 3,
      dlc: 'afterbirth+',
      pools: ['devil', 'greed-devil', 'ultra-secret'],
      tags: ['tears', 'range', 'offensive', 'devil'],
      stats: { range: 120 },
      tearFlags: ['piercing'],
      hooks: {
        onTearHit: function (p, tear) {
          if (!tear || tear.belialCharged) return
          tear.belialCharged = true
          if (typeof tear.dmg === 'number') tear.dmg *= 2
          addFlag(tear, 'homing')
        }
      }
    },

    {
      num: 463,
      id: 'sulfuric-acid',
      name: 'Sulfuric Acid',
      desc: 'Acid tears',
      info: '+0.3 damage; tears have a 25% chance to melt rocks and eat through locked doors',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure'],
      tags: ['damage', 'tears', 'utility'],
      stats: { damage: 0.3 },
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (!tear) return
          if (chance(ctx, 0.25)) tear.sulfuric = true
        },
        onTearDeath: function (p, tear, ctx) {
          if (!tear || !tear.sulfuric) return
          tear.sulfuric = false
          var i
          var gs = gridsOf(ctx)
          for (i = 0; i < gs.length; i++) {
            var g = gs[i]
            if (!g || g.dead) continue
            if (d(tear.x, tear.y, g.x, g.y) < 62) { smash(ctx, g); break }
          }
          var room = ctx && ctx.room
          var doors = room && Array.isArray(room.doors) ? room.doors : []
          for (i = 0; i < doors.length; i++) {
            var dr = doors[i]
            if (!dr || (!dr.locked && dr.open)) continue
            if (d(tear.x, tear.y, dr.x, dr.y) < 90) { unlock(ctx, dr.kind); break }
          }
        }
      }
    },

    {
      num: 464,
      id: 'glyph-of-balance',
      name: 'Glyph of Balance',
      desc: 'The drop you need',
      info: '+2 soul hearts; clearing a room also drops whatever pickup Isaac is shortest of',
      kind: 'active' === 'x' ? 'active' : 'passive',
      quality: 3,
      dlc: 'afterbirth+',
      pools: ['angel', 'greed-angel'],
      tags: ['hearts', 'utility', 'angel'],
      grant: { soul: 4 },
      hooks: {
        // APPROXIMATED: a hook cannot replace the engine's own room-clear drop,
        // so this adds the neediest pickup on top of it rather than swapping it.
        onRoomClear: function (p, room, ctx) {
          room = theRoom(room, ctx)
          if (!room || !p) return
          var kind = 'coin'
          var h = p.hearts || {}
          if ((p.bombs || 0) <= 0) kind = 'bomb'
          else if ((p.keys || 0) <= 0) kind = 'key'
          else if ((h.red || 0) + (h.soul || 0) + (h.black || 0) <= 2) kind = 'heart'
          else if ((p.coins || 0) < 15) kind = 'coin'
          else if ((p.bombs || 0) < 4) kind = 'bomb'
          else kind = 'key'
          var s = freeSpot(ctx, p)
          spawnPick(ctx, kind, s.x, s.y, {})
        }
      }
    },

    {
      num: 465,
      id: 'analog-stick',
      name: 'Analog Stick',
      desc: 'Free aim',
      info: '+0.35 tears; Isaac can fire in any direction, not just the four cardinals',
      kind: 'passive',
      quality: 1,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure', 'crane-game'],
      tags: ['tears', 'utility'],
      // APPROXIMATE: input.shoot() already blends held arrow keys into 8 directions; there is no analog/mouse aim
      stats: { tears: 0.35 },
      hooks: {
        // APPROXIMATED: 360-degree aiming is an input-layer feature and there is
        // no player flag for it, so the item publishes p.cache.freeAim for
        // js/core/input.js to read. The tears up is real either way.
        onInit: function (p) { cache(p).freeAim = true },
        onRemove: function (p) { cache(p).freeAim = false }
      }
    },

    {
      num: 466,
      id: 'contagion',
      name: 'Contagion',
      desc: 'Exploding corpses',
      info: 'The first enemy killed each room explodes and poisons everything nearby; poisoned deaths chain the same way',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure', 'ultra-secret'],
      tags: ['offensive', 'bombs'],
      hooks: {
        onRoomEnter: function (p) {
          var c = cache(p)
          c.contagionUsed = false
          c.contagionDepth = 0
        },
        onEnemyKill: function (p, enemy, ctx) {
          if (!enemy) return
          var c = cache(p)
          var poisoned = !!(enemy.status && enemy.status.poison)
          if (!poisoned && c.contagionUsed) return
          if ((c.contagionDepth || 0) >= 3) return
          c.contagionUsed = true
          c.contagionDepth = (c.contagionDepth || 0) + 1
          var es = foes(ctx)
          for (var i = 0; i < es.length; i++) {
            var e = es[i]
            if (!e || e === enemy) continue
            if (d(enemy.x, enemy.y, e.x, e.y) <= 120) status(ctx, e, 'poison', 5)
          }
          boom(ctx, enemy.x, enemy.y, { dmg: dmgOf(p) * 2, r: 90, friendly: true })
          c.contagionDepth -= 1
        }
      }
    },

    {
      num: 467,
      id: 'finger',
      name: 'Finger!',
      desc: 'It points',
      info: 'A floating hand that constantly deals a tenth of Isaac’s damage in the direction it points',
      kind: 'familiar',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure'],
      tags: ['familiar', 'offensive'],
      familiars: ['finger']
    },

    {
      num: 468,
      id: 'shade',
      name: 'Shade',
      desc: 'Your own shadow',
      info: 'A shadow that trails Isaac and grinds anything it touches; once it has fed enough it is absorbed for +1 damage and two friendly minions',
      kind: 'familiar',
      quality: 3,
      dlc: 'afterbirth+',
      pools: ['devil', 'curse', 'greed-curse', 'greed-devil', 'baby-shop'],
      tags: ['familiar', 'offensive', 'devil'],
      familiars: ['shade'],
      hooks: {
        // APPROXIMATED: absorption triggers on 666 damage dealt by the familiar,
        // and familiar damage is never reported to item hooks. Rooms cleared is
        // the honest proxy: twelve rooms of grinding, then the same payoff.
        onRoomClear: function (p, room, ctx) {
          var c = cache(p)
          if (c.shadeAbsorbed) return
          c.shadeFed = (c.shadeFed || 0) + 1
          if (c.shadeFed < 12) return
          c.shadeAbsorbed = true
          unfamiliar(p, 'shade')
          spawnFam(ctx, 'charmed-minion', { life: 0 })
          spawnFam(ctx, 'charmed-minion', { life: 0 })
          recalc(p)
          say(ctx, 'Absorbed!', p ? p.x : 520, p ? p.y : 280, '#8a52c0')
        },
        onStats: function (p, s) {
          if (cache(p).shadeAbsorbed) applyParcel(s, 'damage', 1)
        }
      }
    },

    {
      num: 469,
      id: 'depression',
      name: 'Depression',
      desc: 'A rain cloud',
      info: 'A cloud that trails Isaac leaving damaging creep; enemies caught in it get struck by a beam of light',
      kind: 'familiar',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure'],
      tags: ['familiar', 'offensive'],
      familiars: ['depression'],
      hooks: {
        onUpdate: function (p, dt, ctx) {
          if (!p) return
          var c = cache(p)
          c.depressionT = (c.depressionT || 0) + (dt || 0)
          if (c.depressionT < 0.25) return
          c.depressionT = 0
          spawnCreep(ctx, p.x, p.y, 34, { kind: 'white', dmg: 6, slow: true, life: 4 })
          var es = foes(ctx)
          if (!es.length) return
          var onCreep = null
          for (var i = 0; i < es.length; i++) {
            var e = es[i]
            if (!e) continue
            var wet = false
            if (IS.fx && typeof IS.fx.creepAt === 'function') {
              try { wet = !!IS.fx.creepAt(e.x, e.y) } catch (err) { wet = false }
            }
            if (!wet) wet = d(e.x, e.y, p.x, p.y) < 70
            if (wet) { onCreep = e; break }
          }
          if (!onCreep) return
          if (!roll(ctx, 0.12, 0.02, 0.3)) return
          spawnLaser(ctx, {
            x: onCreep.x, y: onCreep.y - 220, angle: Math.PI / 2, len: 240,
            dmg: dmgOf(p) * 1.5, width: 26, life: 0.25, friendly: true, thick: true
          })
          noise(ctx, 'holy-shield')
        }
      }
    },

    {
      num: 470,
      id: 'hushy',
      name: 'Hushy',
      desc: 'Bouncing blob',
      info: 'A blob that bounces around the room dealing contact damage and eating shots; it holds still while Isaac fires',
      kind: 'familiar',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure', 'baby-shop'],
      tags: ['familiar', 'offensive', 'defensive'],
      familiars: ['hushy']
    },

    {
      num: 471,
      id: 'lil-monstro',
      name: 'Lil Monstro',
      desc: 'Tiny lung',
      info: 'A familiar that charges up a Monstro’s Lung shot for 3.5 damage a tear',
      kind: 'familiar',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure', 'baby-shop'],
      tags: ['familiar', 'offensive'],
      familiars: ['lil-monstro']
    },

    {
      num: 472,
      id: 'king-baby',
      name: 'King Baby',
      desc: 'Familiars follow him',
      info: 'Leads the other familiars and shoots at enemies; he holds still while Isaac fires',
      kind: 'familiar',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['shop', 'greed-shop', 'baby-shop'],
      tags: ['familiar', 'offensive'],
      transform: 'conjoined',
      familiars: ['king-baby']
      // APPROXIMATED: "other familiars follow it" is a familiar-manager ordering
      // rule with no hook or param behind it; King Baby leads by shooting.
    },

    {
      num: 473,
      id: 'big-chubby',
      name: 'Big Chubby',
      desc: 'Slow, fat, deadly',
      info: 'A huge familiar that grinds slowly forward, blocks shots and chews anything it reaches',
      kind: 'familiar',
      quality: 1,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure', 'baby-shop'],
      tags: ['familiar', 'offensive', 'defensive'],
      familiars: ['big-chubby']
    },

    {
      num: 474,
      id: 'broken-glass-cannon',
      name: 'Broken Glass Cannon',
      desc: 'Reassembles itself',
      info: 'Using it puts the Glass Cannon back together',
      kind: 'active',
      quality: 1,
      dlc: 'repentance',
      rep: true,
      charge: 6,
      chargeType: 'normal',
      pools: ['treasure'],
      tags: ['charge', 'downgrade'],
      hooks: {
        onUse: function (p, ctx) {
          if (!IS.itemsById || !IS.itemsById['glass-cannon']) {
            say(ctx, 'Cracked', p ? p.x : 520, p ? p.y : 280, '#8ad0e0')
            return { fail: true }
          }
          try { if (ctx && typeof ctx.giveItem === 'function') ctx.giveItem('glass-cannon', { noAnim: false }) } catch (e) {}
          noise(ctx, 'item-pickup')
          return { consumed: true }
        }
      }
    },

    {
      num: 475,
      id: 'plan-c',
      name: 'Plan C',
      desc: 'Kill everything, then yourself',
      info: 'Deals 9,999,999 damage to every enemy in the room; Isaac dies three seconds later',
      kind: 'active',
      quality: 3,
      dlc: 'afterbirth+',
      charge: 1,
      chargeType: 'normal',
      pools: ['shop', 'devil', 'red-chest', 'demon-beggar', 'curse', 'greed-shop', 'greed-curse', 'ultra-secret'],
      tags: ['offensive', 'devil', 'charge'],
      hooks: {
        onUse: function (p, ctx) {
          var es = foes(ctx)
          for (var i = 0; i < es.length; i++) hurt(es[i], 9999999, ctx)
          quake(ctx, 12, 0.5)
          noise(ctx, 'bomb-explode')
          cache(p).planCFuse = 3
          return {}
        },
        onUpdate: function (p, dt, ctx) {
          var c = cache(p)
          if (!(c.planCFuse > 0)) return
          c.planCFuse -= (dt || 0)
          if (c.planCFuse > 0) return
          c.planCFuse = 0
          if (typeof IS.killPlayer === 'function') { try { IS.killPlayer(p, ctx) } catch (e) {} }
        }
      }
    },

    {
      num: 476,
      id: 'd1',
      name: 'D1',
      desc: 'Duplicates a pickup',
      info: 'Copies a random pickup in the room; the copy is not always the same kind',
      kind: 'active',
      quality: 2,
      dlc: 'afterbirth+',
      charge: 4,
      chargeType: 'normal',
      pools: ['treasure', 'greed-shop', 'crane-game'],
      tags: ['utility', 'charge'],
      hooks: {
        onUse: function (p, ctx) {
          var ps = pickupsOf(ctx)
          var live = []
          for (var i = 0; i < ps.length; i++) if (ps[i] && !ps[i].dead) live.push(ps[i])
          if (!live.length) return { fail: true }
          var src = pickOf(ctx, live)
          var kinds = ['coin', 'key', 'bomb', 'heart', 'card', 'pill']
          var kind = (src && typeof src.kind === 'string') ? src.kind : 'coin'
          if (chance(ctx, 0.3) || kind === 'item') kind = pickOf(ctx, kinds)
          var s = freeSpot(ctx, p)
          spawnPick(ctx, kind, s.x, s.y, {})
          noise(ctx, 'item-pickup')
          return {}
        }
      }
    },

    {
      num: 477,
      id: 'void',
      name: 'Void',
      desc: 'Eats pedestals',
      info: 'Absorbs every pedestal item in the room: passives become two random stat ups, actives fire with every future use',
      kind: 'active',
      quality: 3,
      dlc: 'afterbirth+',
      charge: 6,
      chargeType: 'normal',
      pools: ['devil', 'angel', 'greed-shop'],
      tags: ['utility', 'devil', 'angel', 'charge'],
      hooks: {
        onUse: function (p, ctx) {
          var c = cache(p)
          if (!Array.isArray(c.voidActives)) c.voidActives = []
          if (!c.voidStats) c.voidStats = {}
          var ps = pickupsOf(ctx)
          var eaten = 0
          var i, j
          for (i = 0; i < ps.length; i++) {
            var pk = ps[i]
            if (!pk || pk.dead) continue
            var id = itemIdOf(pk)
            if (!id) continue
            var def = IS.itemsById[id]
            kill(pk)
            eaten++
            if (def.kind === 'active') {
              if (c.voidActives.indexOf(id) < 0) c.voidActives.push(id)
            } else {
              for (j = 0; j < 2; j++) {
                var up = pickOf(ctx, STAT_UPS)
                if (up) c.voidStats[up.k] = (c.voidStats[up.k] || 0) + up.v
              }
            }
          }
          for (i = 0; i < c.voidActives.length; i++) {
            var ad = IS.itemsById ? IS.itemsById[c.voidActives[i]] : null
            if (ad && ad.hooks && typeof ad.hooks.onUse === 'function' && ad.id !== 'void') {
              try { ad.hooks.onUse(p, ctx) } catch (e) {}
            }
          }
          recalc(p)
          noise(ctx, 'devil-deal')
          if (!eaten && !c.voidActives.length) return { fail: true }
          return {}
        },
        onStats: function (p, s) { applyBag(s, cache(p).voidStats) }
      }
    },

    {
      num: 478,
      id: 'pause',
      name: 'Pause',
      desc: 'Freeze the room',
      info: 'Petrifies every enemy in the room for up to 30 seconds; they still hurt on contact',
      kind: 'active',
      quality: 2,
      dlc: 'afterbirth+',
      charge: 6,
      chargeType: 'normal',
      pools: ['treasure', 'greed-shop', 'crane-game'],
      tags: ['utility', 'defensive', 'charge'],
      hooks: {
        onUse: function (p, ctx) {
          var es = foes(ctx)
          if (!es.length) return { fail: true }
          for (var i = 0; i < es.length; i++) status(ctx, es[i], 'petrify', 30)
          cache(p).pauseActive = true
          noise(ctx, 'beep')
          return {}
        },
        // the real Pause ends the moment Isaac shoots
        onTearFire: function (p, tear, ctx) {
          var c = cache(p)
          if (!c.pauseActive) return
          c.pauseActive = false
          var es = foes(ctx)
          for (var i = 0; i < es.length; i++) status(ctx, es[i], 'petrify', 0)
        }
      }
    },

    {
      num: 479,
      id: 'smelter',
      name: 'Smelter',
      desc: 'Eat your trinkets',
      info: 'Consumes the trinkets Isaac is holding and keeps their effects for the rest of the run',
      kind: 'active',
      quality: 3,
      dlc: 'afterbirth+',
      charge: 6,
      chargeType: 'normal',
      pools: ['shop'],
      tags: ['utility', 'charge'],
      hooks: {
        onUse: function (p, ctx) {
          var n = eatHeldTrinkets(p)
          if (!n) return { fail: true }
          recalc(p)
          noise(ctx, 'item-pickup')
          say(ctx, 'Smelted!', p ? p.x : 520, p ? p.y : 280, '#e0d040')
          return {}
        },
        onStats: function (p, s) { smeltedStats(p, s) }
      }
    },

    {
      num: 480,
      id: 'compost',
      name: 'Compost',
      desc: 'Pickups into swarm',
      info: 'Turns the pickups in the room into blue flies and spiders, and doubles the swarm you already have',
      kind: 'active',
      quality: 1,
      dlc: 'afterbirth+',
      charge: 4,
      chargeType: 'normal',
      pools: ['shop', 'rotten-beggar'],
      tags: ['utility', 'fly', 'spider', 'charge'],
      hooks: {
        // APPROXIMATED: there is no way to enumerate the player's live swarm, so
        // "doubles all blue flies and spiders" becomes two hatchlings per
        // converted pickup instead of a true doubling.
        onUse: function (p, ctx) {
          var ps = pickupsOf(ctx)
          var made = 0
          for (var i = 0; i < ps.length; i++) {
            var pk = ps[i]
            if (!pk || pk.dead || pk.kind === 'item') continue
            var x = typeof pk.x === 'number' ? pk.x : (p ? p.x : 520)
            var y = typeof pk.y === 'number' ? pk.y : (p ? p.y : 280)
            kill(pk)
            for (var j = 0; j < 2; j++) {
              spawnFam(ctx, chance(ctx, 0.5) ? 'blue-spider' : 'blue-fly', { x: x, y: y })
              made++
            }
          }
          if (!made) spawnFam(ctx, chance(ctx, 0.5) ? 'blue-spider' : 'blue-fly', {})
          noise(ctx, 'fart')
          return {}
        }
      }
    },

    {
      num: 481,
      id: 'dataminer',
      name: 'Dataminer',
      desc: 'Corrupt the room',
      info: 'One random stat up, one random stat down and a random tear effect, all until the next room',
      kind: 'active',
      quality: 1,
      dlc: 'afterbirth+',
      charge: 6,
      chargeType: 'normal',
      pools: ['treasure', 'greed-shop', 'ultra-secret'],
      tags: ['utility', 'quality-shift', 'charge'],
      hooks: {
        onUse: function (p, ctx) {
          var c = cache(p)
          var up = pickOf(ctx, STAT_UPS)
          var down = pickOf(ctx, STAT_DOWNS)
          c.dataminer = {}
          if (up) c.dataminer[up.k] = (c.dataminer[up.k] || 0) + up.v * 2
          if (down) c.dataminer[down.k] = (c.dataminer[down.k] || 0) + down.v
          c.dataminerFlag = pickOf(ctx, ROOM_TEAR_FLAGS)
          recalc(p)
          noise(ctx, 'beep')
          return {}
        },
        onRoomEnter: function (p) {
          var c = cache(p)
          if (!c.dataminer && !c.dataminerFlag) return
          c.dataminer = null
          c.dataminerFlag = null
          recalc(p)
        },
        onStats: function (p, s) { applyBag(s, cache(p).dataminer) },
        onTearFire: function (p, tear) {
          var f = cache(p).dataminerFlag
          if (f) addFlag(tear, f)
        }
      }
    },

    {
      num: 482,
      id: 'clicker',
      name: 'Clicker',
      desc: 'Become someone else',
      info: 'Turns Isaac into a random character and takes away the last item he picked up',
      kind: 'active',
      quality: 1,
      dlc: 'afterbirth+',
      charge: 6,
      chargeType: 'normal',
      pools: ['treasure', 'greed-shop'],
      tags: ['utility', 'charge'],
      hooks: {
        // APPROXIMATED: a full character swap is engine surgery (items, pockets,
        // hearts, specials). This swaps identity and base stats, which is the
        // part that changes how the run plays, and drops the newest item.
        onUse: function (p, ctx) {
          if (!p) return { fail: true }
          if (Array.isArray(p.items) && p.items.length) {
            var last = p.items[p.items.length - 1]
            if (last && last !== 'clicker') {
              try { if (ctx && typeof ctx.removeItem === 'function') ctx.removeItem(last) } catch (e) {}
            }
          }
          var pool = []
          var all = IS.characters || []
          for (var i = 0; i < all.length; i++) {
            var ch = all[i]
            if (ch && ch.id && ch.id !== p.charId && ch.base && ch.base.damage > 0) pool.push(ch)
          }
          var pickChar = pickOf(ctx, pool)
          if (pickChar) {
            p.charId = pickChar.id
            var nb = {}
            for (var k in pickChar.base) nb[k] = pickChar.base[k]
            p.base = nb
          }
          recalc(p)
          noise(ctx, 'curse-sting')
          return {}
        }
      }
    },

    {
      num: 483,
      id: 'mama-mega',
      name: 'Mama Mega!',
      desc: 'Blow up the floor',
      info: 'Explodes everything in the room, deals 200 damage to all enemies, opens secret rooms and forces Boss Rush and Hush open',
      kind: 'active',
      quality: 2,
      dlc: 'afterbirth+',
      charge: 6,
      chargeType: 'normal',
      pools: ['shop', 'greed-shop', 'bomb-bum'],
      tags: ['offensive', 'bombs', 'charge'],
      hooks: {
        // APPROXIMATED: "affects the whole floor" needs floor.js to walk every
        // room. The current room is fully resolved here, and run.flags.mamaMega
        // is published so the floor layer can honour the rest.
        onUse: function (p, ctx) {
          var i
          var es = foes(ctx)
          for (i = 0; i < es.length; i++) hurt(es[i], 200, ctx)
          var gs = gridsOf(ctx)
          for (i = 0; i < gs.length; i++) if (gs[i] && !gs[i].dead) smash(ctx, gs[i])
          unlock(ctx, 'secret')
          unlock(ctx, 'super-secret')
          unlock(ctx, 'boss-rush')
          if (ctx && ctx.run) {
            if (!ctx.run.flags) ctx.run.flags = {}
            ctx.run.flags.mamaMega = true
            ctx.run.flags.bossRushOpen = true
            ctx.run.flags.hushOpen = true
          }
          quake(ctx, 16, 0.8)
          noise(ctx, 'bomb-explode')
          return { consumed: true }
        }
      }
    },

    {
      num: 484,
      id: 'wait-what',
      name: 'Wait What?',
      desc: 'Rock wave',
      info: 'Shoves enemies back and sends a wave of rock through the room that breaks obstacles and opens walls',
      kind: 'active',
      quality: 1,
      dlc: 'afterbirth+',
      charge: 4,
      chargeType: 'normal',
      pools: ['treasure', 'greed-treasure'],
      tags: ['offensive', 'bombs', 'charge'],
      hooks: {
        onUse: function (p, ctx) {
          if (!p) return { fail: true }
          var dir = aim(p)
          var i
          var es = foes(ctx)
          for (i = 0; i < es.length; i++) {
            var e = es[i]
            if (e && d(e.x, e.y, p.x, p.y) < 220) shove(e, p.x, p.y, 520)
          }
          var bd = stat(p, 'bombDamage', IS.BASE_BOMB_DAMAGE || 60)
          for (i = 1; i <= 3; i++) {
            boom(ctx, p.x + dir.x * 74 * i, p.y + dir.y * 74 * i, { dmg: bd * 0.6, r: 74, friendly: true })
          }
          quake(ctx, 9, 0.4)
          noise(ctx, 'rock-break')
          return {}
        }
      }
    },

    {
      num: 485,
      id: 'crooked-penny',
      name: 'Crooked Penny',
      desc: 'Double or nothing',
      info: '50% chance to double every item, pickup and chest in the room; otherwise they all vanish and leave one coin',
      kind: 'active',
      quality: 3,
      dlc: 'afterbirth+',
      charge: 6,
      chargeType: 'normal',
      pools: ['treasure', 'shop', 'beggar', 'greed-shop'],
      tags: ['utility', 'coins', 'charge'],
      hooks: {
        onUse: function (p, ctx) {
          var ps = pickupsOf(ctx)
          var live = []
          var i
          for (i = 0; i < ps.length; i++) if (ps[i] && !ps[i].dead) live.push(ps[i])
          if (!live.length) return { fail: true }
          if (chance(ctx, 0.5)) {
            for (i = 0; i < live.length; i++) {
              var pk = live[i]
              var s = freeSpot(ctx, p)
              var id = itemIdOf(pk)
              if (id) spawnPick(ctx, 'item', s.x, s.y, { itemId: id })
              else spawnPick(ctx, typeof pk.kind === 'string' ? pk.kind : 'coin', s.x, s.y, {})
            }
            noise(ctx, 'coin')
            say(ctx, 'Heads!', p ? p.x : 520, p ? p.y : 280, '#e0d040')
          } else {
            for (i = 0; i < live.length; i++) kill(live[i])
            spawnPick(ctx, 'coin', p ? p.x : 520, p ? p.y : 280, {})
            noise(ctx, 'curse-sting')
            say(ctx, 'Tails…', p ? p.x : 520, p ? p.y : 280, '#8a8a8a')
          }
          return {}
        }
      }
    },

    {
      num: 486,
      id: 'dull-razor',
      name: 'Dull Razor',
      desc: 'Hurt without harm',
      info: 'Cuts Isaac for no health, but fires every on-damage effect he owns',
      kind: 'active',
      quality: 2,
      dlc: 'afterbirth+',
      charge: 2,
      chargeType: 'normal',
      pools: ['shop', 'greed-shop'],
      tags: ['utility', 'charge'],
      hooks: {
        onUse: function (p, ctx) {
          if (!p || !Array.isArray(p.items)) return { fail: true }
          for (var i = 0; i < p.items.length; i++) {
            var id = p.items[i]
            if (!id || id === 'dull-razor') continue
            var def = IS.itemsById ? IS.itemsById[id] : null
            if (!def || !def.hooks || typeof def.hooks.onPlayerDamage !== 'function') continue
            try { def.hooks.onPlayerDamage(p, 1, 'dull-razor', ctx) } catch (e) {}
          }
          noise(ctx, 'player-hurt')
          return {}
        }
      }
    },

    {
      num: 487,
      id: 'potato-peeler',
      name: 'Potato Peeler',
      desc: 'A container for damage',
      info: 'Trades one heart container for +0.2 damage and a Cube of Meat, plus +1.5 range and a blood trail for the room',
      kind: 'active',
      quality: 2,
      dlc: 'afterbirth+',
      charge: 1,
      chargeType: 'normal',
      pools: ['shop', 'demon-beggar', 'greed-shop'],
      tags: ['damage', 'hearts', 'charge'],
      hooks: {
        onUse: function (p, ctx) {
          if (!p || !p.hearts || (p.hearts.maxRed || 0) < 2) return { fail: true }
          if (typeof IS.addMaxHearts === 'function') { try { IS.addMaxHearts(p, -2, false) } catch (e) {} }
          var c = cache(p)
          c.potatoDamage = (c.potatoDamage || 0) + 0.2
          c.potatoRoom = true
          if (IS.itemsById && IS.itemsById['cube-of-meat']) {
            try { if (ctx && typeof ctx.giveItem === 'function') ctx.giveItem('cube-of-meat', {}) } catch (e2) {}
          }
          recalc(p)
          noise(ctx, 'player-hurt')
          return {}
        },
        onRoomEnter: function (p) {
          var c = cache(p)
          if (!c.potatoRoom) return
          c.potatoRoom = false
          recalc(p)
        },
        onStats: function (p, s) {
          var c = cache(p)
          applyParcel(s, 'damage', c.potatoDamage || 0)
          if (c.potatoRoom) applyParcel(s, 'range', 60)
        },
        onUpdate: function (p, dt, ctx) {
          var c = cache(p)
          if (!c.potatoRoom || !p) return
          c.potatoCreepT = (c.potatoCreepT || 0) + (dt || 0)
          if (c.potatoCreepT < 0.2) return
          c.potatoCreepT = 0
          spawnCreep(ctx, p.x, p.y, 30, { kind: 'red', dmg: 4, life: 4 })
        }
      }
    },

    {
      num: 488,
      id: 'metronome',
      name: 'Metronome',
      desc: 'Borrowed power',
      info: 'Borrows a random item’s effect until the next room',
      kind: 'active',
      quality: 1,
      dlc: 'afterbirth+',
      charge: 6,
      chargeType: 'normal',
      pools: ['treasure', 'greed-shop', 'crane-game', 'wooden-chest'],
      tags: ['utility', 'charge'],
      hooks: {
        // APPROXIMATED: only the borrowed item's declarative stats/mult are
        // applied. Running another item's onInit would leave permanent debris
        // behind when the borrow expires, which is worse than a smaller effect.
        onUse: function (p, ctx) {
          var pool = []
          var all = IS.items || []
          for (var i = 0; i < all.length; i++) {
            var it = all[i]
            if (!it || it.id === 'metronome') continue
            if (it.kind !== 'passive') continue
            if (!it.stats && !it.mult) continue
            pool.push(it.id)
          }
          if (!pool.length) return { fail: true }
          var c = cache(p)
          c.metronomeItem = pickOf(ctx, pool)
          recalc(p)
          var def = IS.itemsById ? IS.itemsById[c.metronomeItem] : null
          if (def) say(ctx, def.name || '?', p ? p.x : 520, p ? p.y : 280, '#8ad0e0')
          noise(ctx, 'beep')
          return {}
        },
        onRoomEnter: function (p) {
          var c = cache(p)
          if (!c.metronomeItem) return
          c.metronomeItem = null
          recalc(p)
        },
        onStats: function (p, s) {
          var id = cache(p).metronomeItem
          if (id && IS.itemsById) applyDefStats(IS.itemsById[id], s)
        }
      }
    },

    {
      num: 489,
      id: 'd-infinity',
      name: 'D Infinity',
      desc: 'Every die at once',
      info: 'Acts as one of the die items each time it is used',
      kind: 'active',
      quality: 3,
      dlc: 'afterbirth+',
      charge: 6,
      chargeType: 'normal',
      pools: ['secret', 'greed-shop', 'greed-secret'],
      tags: ['utility', 'charge'],
      hooks: {
        // APPROXIMATED: picking the die with the drop button is an input-layer
        // feature. Here a random owned-pool die is rolled per use, which is the
        // same set of outcomes without the manual choice.
        onUse: function (p, ctx) {
          var dice = ['d1', 'd4', 'd6', 'd7', 'd8', 'd10', 'd12', 'd20', 'd100', 'dice-shard']
          var have = []
          for (var i = 0; i < dice.length; i++) {
            var def = IS.itemsById ? IS.itemsById[dice[i]] : null
            if (def && def.id !== 'd-infinity' && def.hooks && typeof def.hooks.onUse === 'function') have.push(def)
          }
          var chosen = pickOf(ctx, have)
          if (chosen) {
            try { chosen.hooks.onUse(p, ctx) } catch (e) {}
            say(ctx, chosen.name || 'Die', p ? p.x : 520, p ? p.y : 280, '#e8e4dc')
            return {}
          }
          try { if (ctx && typeof ctx.rerollPedestals === 'function') ctx.rerollPedestals() } catch (e2) {}
          return {}
        }
      }
    },

    {
      num: 490,
      id: 'edens-soul',
      name: "Eden's Soul",
      desc: 'Two free items',
      info: 'Spawns two items from the current room’s pool; starts with no charge',
      kind: 'active',
      quality: 4,
      dlc: 'afterbirth+',
      charge: 12,
      chargeType: 'normal',
      pools: ['angel', 'greed-angel'],
      tags: ['utility', 'angel', 'charge'],
      hooks: {
        onInit: function (p) {
          if (!p || !Array.isArray(p.active)) return
          for (var i = 0; i < p.active.length; i++) {
            var a = p.active[i]
            if (a && a.id === 'edens-soul') a.charge = 0
          }
        },
        onUse: function (p, ctx) {
          var pool = roomPool(ctx)
          var made = 0
          for (var i = 0; i < 2; i++) {
            var id = rollItemId(ctx, pool)
            if (!id) continue
            pedestal(ctx, p, id)
            made++
          }
          if (!made) return { fail: true }
          noise(ctx, 'pedestal-appear')
          return {}
        }
      }
    },

    {
      num: 491,
      id: 'acid-baby',
      name: 'Acid Baby',
      desc: 'Pills and poison',
      info: 'Drops a pill every seven rooms; swallowing a pill poisons and hurts every enemy in the room',
      kind: 'familiar',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'baby-shop'],
      tags: ['familiar', 'pill', 'offensive'],
      transform: 'conjoined',
      familiars: ['acid-baby'],
      hooks: {
        onRoomClear: function (p, room, ctx) {
          var c = cache(p)
          c.acidBabyRooms = (c.acidBabyRooms || 0) + 1
          if (c.acidBabyRooms < 7) return
          c.acidBabyRooms = 0
          var s = freeSpot(ctx, p)
          spawnPick(ctx, 'pill', s.x, s.y, {})
        },
        onPillUse: function (p, pillId, ctx) {
          var es = foes(ctx)
          for (var i = 0; i < es.length; i++) {
            status(ctx, es[i], 'poison', 6)
            hurt(es[i], 10, ctx)
          }
          noise(ctx, 'pill-swallow')
        }
      }
    },

    {
      num: 492,
      id: 'yo-listen',
      name: 'YO LISTEN!',
      desc: 'Finds the secrets',
      info: '+1 luck; a fairy that shows secret rooms, tinted rocks and crawlspaces',
      kind: 'familiar',
      quality: 1,
      dlc: 'afterbirth+',
      pools: ['treasure', 'key-master', 'baby-shop'],
      tags: ['familiar', 'luck', 'utility'],
      stats: { luck: 1 },
      flags: ['seeSecretRooms'],
      familiars: ['yo-listen'],
      hooks: {
        // the flag covers secret rooms; the fairy also points at the tinted
        // rocks and crawlspace tiles in the room she is in
        onRoomEnter: function (p, room, ctx) {
          room = theRoom(room, ctx)
          if (!room) return
          var gs = gridsOf(ctx)
          for (var i = 0; i < gs.length; i++) {
            var g = gs[i]
            if (!g || g.dead) continue
            var t = g.type || g.kind
            if (t === 'tinted-rock' || t === 'marked-skull' || t === 'crawlspace') {
              say(ctx, 'Hey!', g.x, g.y, '#8ad0e0')
            }
          }
        }
      }
    },

    {
      num: 493,
      id: 'adrenaline',
      name: 'Adrenaline',
      desc: 'Damage from emptiness',
      info: 'Damage up for every empty heart container, and each further empty container is worth more than the last',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'demon-beggar', 'greed-treasure'],
      tags: ['damage', 'hearts'],
      transform: 'spun',
      hooks: {
        onStats: function (p, s) {
          var h = p && p.hearts
          if (!h) return
          var empty = Math.floor((((h.maxRed || 0) - (h.red || 0)) / 2))
          if (empty < 1) return
          if (empty > 12) empty = 12
          // escalating series: 0.5, +0.75, +1.0, ... per further empty container
          var bonus = 0
          for (var i = 1; i <= empty; i++) bonus += 0.5 + 0.25 * (i - 1)
          applyParcel(s, 'damage', bonus)
        }
      }
    },

    {
      num: 494,
      id: 'jacobs-ladder',
      name: "Jacob's Ladder",
      desc: 'Arcing tears',
      info: 'Tears spark on impact for half damage and the spark arcs to up to four more enemies',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'battery-bum', 'greed-treasure', 'crane-game'],
      tags: ['tears', 'offensive'],
      // the engine reads the 'chain' tear flag (tears.js chainArc)
      tearFlags: ['chain']
    },

    {
      num: 495,
      id: 'ghost-pepper',
      name: 'Ghost Pepper',
      desc: 'Blue fire tears',
      info: '8% chance (50% at 10 luck) to spit a blue fire that blocks shots and burns on contact for two seconds',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure'],
      tags: ['tears', 'offensive', 'defensive'],
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (!p || !roll(ctx, 0.08, 0.042, 0.5)) return
          var dir = aim(p)
          spawnFam(ctx, 'ghost-pepper', {
            x: p.x + dir.x * 46,
            y: p.y + dir.y * 46,
            life: 2,
            dmg: 2 + dmgOf(p) * 0.5
          })
          noise(ctx, 'fart')
        }
      }
    },

    {
      num: 496,
      id: 'euthanasia',
      name: 'Euthanasia',
      desc: 'Needle tears',
      info: '3.33% chance (25% at 13 luck) to fire a needle: it pops normal enemies into ten tears and deals triple damage to bosses',
      kind: 'passive',
      quality: 3,
      dlc: 'afterbirth+',
      pools: ['treasure', 'demon-beggar', 'curse', 'greed-treasure', 'greed-curse'],
      tags: ['tears', 'offensive', 'syringe'],
      transform: 'spun',
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (!tear || !roll(ctx, 0.0333, 0.01667, 0.25)) return
          tear.euthanasiaNeedle = true
          if (typeof tear.r === 'number') tear.r *= 0.7
        },
        onTearHit: function (p, tear, enemy, ctx) {
          if (!tear || !tear.euthanasiaNeedle || !enemy || enemy.dead) return
          tear.euthanasiaNeedle = false
          if (enemy.boss) { hurt(enemy, dmgOf(p) * 3, ctx); return }
          var x = enemy.x
          var y = enemy.y
          slay(enemy, ctx)
          var speed = 560 * stat(p, 'shotSpeed', 1)
          for (var i = 0; i < 10; i++) {
            var a = (Math.PI * 2 * i) / 10
            spawnTear(ctx, {
              x: x, y: y,
              vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
              dmg: dmgOf(p), friendly: true, r: 8
            })
          }
          noise(ctx, 'tear-splat')
        }
      }
    },

    {
      num: 497,
      id: 'camo-undies',
      name: 'Camo Undies',
      desc: 'Cloaked on entry',
      info: 'Entering a room cloaks Isaac and confuses every enemy until he shoots; +0.5 speed while cloaked, and uncloaking blasts everything around him',
      kind: 'passive',
      quality: 1,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure'],
      tags: ['utility', 'speed', 'defensive'],
      flags: ['camoUndies'],
      hooks: {
        onRoomEnter: function (p, room, ctx) {
          room = theRoom(room, ctx)
          if (!room) return
          var c = cache(p)
          c.camoCloaked = true
          var es = foes(ctx)
          for (var i = 0; i < es.length; i++) status(ctx, es[i], 'confusion', 30)
          recalc(p)
        },
        onTearFire: function (p, tear, ctx) {
          var c = cache(p)
          if (!c.camoCloaked) return
          c.camoCloaked = false
          c.camoBurst = 1.5
          var es = foes(ctx)
          for (var i = 0; i < es.length; i++) {
            var e = es[i]
            if (!e || !p) continue
            if (d(e.x, e.y, p.x, p.y) < 150) {
              hurt(e, dmgOf(p) * 2, ctx)
              status(ctx, e, 'confusion', 0)
              shove(e, p.x, p.y, 340)
            }
          }
          quake(ctx, 5, 0.2)
          recalc(p)
        },
        onUpdate: function (p, dt, ctx) {
          var c = cache(p)
          if (!(c.camoBurst > 0)) return
          c.camoBurst -= (dt || 0)
          if (c.camoBurst > 0) return
          c.camoBurst = 0
          recalc(p)
        },
        onStats: function (p, s) {
          var c = cache(p)
          if (c.camoCloaked) applyParcel(s, 'speed', 0.5)
          if (c.camoBurst > 0) {
            applyParcel(s, 'damage', 1.5)
            applyParcel(s, 'tears', 1.5)
          }
        }
      }
    },

    {
      num: 498,
      id: 'duality',
      name: 'Duality',
      desc: 'Devil and Angel',
      info: 'Whenever a Devil or Angel room would appear, both do; taking one closes the other',
      kind: 'passive',
      quality: 3,
      dlc: 'afterbirth+',
      pools: ['devil', 'angel'],
      tags: ['devil', 'angel', 'utility'],
      // APPROXIMATE: floor/room generation never reads run.flags.duality, so only the chance stats apply
      stats: { devilChance: 0.06, angelChance: 0.06 },
      hooks: {
        // APPROXIMATED: pairing the two doors is floor-generation work. The item
        // publishes run.flags.duality for js/engine/floor.js and nudges both
        // deal chances so it is never a dead pickup in the meantime.
        onInit: function (p, ctx) {
          if (ctx && ctx.run) {
            if (!ctx.run.flags) ctx.run.flags = {}
            ctx.run.flags.duality = true
          }
        },
        onRemove: function (p, ctx) {
          if (ctx && ctx.run && ctx.run.flags) ctx.run.flags.duality = false
        },
        onFloorClear: function (p, floor, ctx) {
          var room = ctx && ctx.room
          var doors = room && Array.isArray(room.doors) ? room.doors : []
          var hasDevil = false
          var hasAngel = false
          for (var i = 0; i < doors.length; i++) {
            if (!doors[i]) continue
            if (doors[i].kind === 'devil') hasDevil = true
            if (doors[i].kind === 'angel') hasAngel = true
          }
          if (hasDevil && !hasAngel) unlock(ctx, 'angel')
          else if (hasAngel && !hasDevil) unlock(ctx, 'devil')
        }
      }
    },

    {
      num: 499,
      id: 'eucharist',
      name: 'Eucharist',
      desc: 'Angel rooms always',
      info: 'Angel rooms appear whenever one possibly could',
      kind: 'passive',
      quality: 3,
      dlc: 'afterbirth+',
      pools: ['angel', 'greed-angel'],
      tags: ['angel', 'utility'],
      // APPROXIMATE: floor/room generation never reads run.flags.forceAngel, so only angelChance applies
      stats: { angelChance: 1 },
      hooks: {
        onInit: function (p, ctx) {
          if (ctx && ctx.run) {
            if (!ctx.run.flags) ctx.run.flags = {}
            ctx.run.flags.forceAngel = true
          }
        },
        onRemove: function (p, ctx) {
          if (ctx && ctx.run && ctx.run.flags) ctx.run.flags.forceAngel = false
        }
      }
    },

    {
      num: 500,
      id: 'sack-of-sacks',
      name: 'Sack of Sacks',
      desc: 'Sacks of sacks',
      info: 'A familiar that drops a grab bag every seven or eight rooms',
      kind: 'familiar',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['secret', 'greed-shop', 'greed-secret'],
      tags: ['familiar', 'utility'],
      familiars: ['sack-of-sacks'],
      hooks: {
        onRoomClear: function (p, room, ctx) {
          var c = cache(p)
          c.sackRooms = (c.sackRooms || 0) + 1
          var need = c.sackNeed || (7 + intOf(ctx, 2))
          c.sackNeed = need
          if (c.sackRooms < need) return
          c.sackRooms = 0
          c.sackNeed = 7 + intOf(ctx, 2)
          var s = freeSpot(ctx, p)
          spawnPick(ctx, 'sack', s.x, s.y, {})
        }
      }
    },

    {
      num: 501,
      id: 'greeds-gullet',
      name: "Greed's Gullet",
      desc: 'Coins into containers',
      info: 'One extra heart container for every 25 coins Isaac is carrying',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['secret', 'greed-secret'],
      tags: ['hearts', 'coins'],
      hooks: {
        onInit: function (p, ctx) { syncGullet(p, ctx) },
        onRemove: function (p, ctx) {
          var c = cache(p)
          if (c.gulletGiven > 0 && typeof IS.addMaxHearts === 'function') {
            try { IS.addMaxHearts(p, -2 * c.gulletGiven, false) } catch (e) {}
          }
          c.gulletGiven = 0
        },
        onPickup: function (p, kind, amount, ctx) {
          if (kind === 'coin') syncGullet(p, ctx)
        },
        onRoomEnter: function (p, room, ctx) { syncGullet(p, ctx) },
        onPurchase: function (p, entry, ctx) { syncGullet(p, ctx) }
      }
    },

    {
      num: 502,
      id: 'large-zit',
      name: 'Large Zit',
      desc: 'Creep tears',
      info: 'Sometimes fires a white creep tear for double damage that slows what it hits; taking damage fires one too',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure'],
      tags: ['tears', 'offensive'],
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (!tear || !roll(ctx, 0.1, 0.03, 0.33)) return
          tear.largeZit = true
          if (typeof tear.dmg === 'number') tear.dmg *= 2
          if (typeof tear.r === 'number') tear.r *= 1.3
          addFlag(tear, 'slow')
        },
        onTearDeath: function (p, tear, ctx) {
          if (!tear || !tear.largeZit) return
          tear.largeZit = false
          spawnCreep(ctx, tear.x, tear.y, 44, { kind: 'white', slow: true, life: 8 })
        },
        onPlayerDamage: function (p, amount, source, ctx) {
          if (!p) return
          var a = rangeOf(ctx, 0, Math.PI * 2)
          var speed = 520 * stat(p, 'shotSpeed', 1)
          var t = spawnTear(ctx, {
            x: p.x, y: p.y,
            vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
            dmg: dmgOf(p) * 2, friendly: true, r: 14
          })
          if (t) { t.largeZit = true; addFlag(t, 'slow') }
        }
      }
    },

    {
      num: 503,
      id: 'little-horn',
      name: 'Little Horn',
      desc: 'Void tears',
      info: '5% chance (20% at 15 luck) to fire a void tear that summons a Big Horn hand: instant death for normal enemies, 36 damage to bosses',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['demon-beggar', 'curse', 'greed-treasure', 'greed-curse', 'greed-devil'],
      tags: ['tears', 'offensive', 'devil'],
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (!tear || !roll(ctx, 0.05, 0.01, 0.2)) return
          tear.littleHorn = true
          addFlag(tear, 'spectral')
        },
        onTearHit: function (p, tear, enemy, ctx) {
          if (!tear || !tear.littleHorn || !enemy || enemy.dead) return
          tear.littleHorn = false
          quake(ctx, 6, 0.25)
          noise(ctx, 'rock-break')
          if (enemy.boss) hurt(enemy, 36, ctx)
          else slay(enemy, ctx)
        }
      }
    },

    {
      num: 504,
      id: 'brown-nugget',
      name: 'Brown Nugget',
      desc: 'A fly turret',
      info: 'Drops a fly turret that shoots at enemies for 3.5 damage a shot',
      kind: 'active',
      quality: 1,
      dlc: 'afterbirth+',
      charge: 4,
      chargeType: 'normal',
      // 'shell-game' from the reference is not in IS.POOL_LIST, so it is dropped
      pools: ['treasure', 'greed-treasure'],
      tags: ['familiar', 'offensive', 'poop', 'charge'],
      hooks: {
        onUse: function (p, ctx) {
          if (!p) return { fail: true }
          var dir = aim(p)
          spawnFam(ctx, 'brown-nugget', {
            x: p.x + dir.x * 50, y: p.y + dir.y * 50, life: 45
          })
          noise(ctx, 'poop-break')
          return {}
        }
      }
    },

    {
      num: 505,
      id: 'poke-go',
      name: 'Poke Go',
      desc: 'Catch a friend',
      info: 'Entering a hostile room has a 20% chance to hatch a friendly monster for it',
      kind: 'passive',
      quality: 1,
      dlc: 'afterbirth+',
      pools: ['shop', 'greed-shop', 'crane-game'],
      tags: ['familiar', 'utility'],
      hooks: {
        onRoomEnter: function (p, room, ctx) {
          room = theRoom(room, ctx)
          if (!room || room.cleared) return
          if (!foes(ctx).length) return
          if (!roll(ctx, 0.2, 0.02, 0.4)) return
          var who = pickOf(ctx, ['charmed-fly', 'charmed-spider', 'charmed-minion'])
          spawnFam(ctx, who, { life: 0 })
          noise(ctx, 'familiar-spawn')
        }
      }
    },

    {
      num: 506,
      id: 'backstabber',
      name: 'Backstabber',
      desc: 'Stab them in the back',
      info: 'Hitting an enemy from behind deals double damage and makes it bleed',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure', 'ultra-secret'],
      tags: ['tears', 'offensive'],
      hooks: {
        onTearHit: function (p, tear, enemy, ctx) {
          if (!tear || !enemy || enemy.dead) return
          if (enemy.status && enemy.status.bleed) return
          var ex = typeof enemy.vx === 'number' ? enemy.vx : 0
          var ey = typeof enemy.vy === 'number' ? enemy.vy : 0
          var tx = typeof tear.vx === 'number' ? tear.vx : 0
          var ty = typeof tear.vy === 'number' ? tear.vy : 0
          if (Math.abs(ex) + Math.abs(ey) < 4) return
          // same-direction travel means the tear came in behind the enemy
          if (ex * tx + ey * ty <= 0) return
          hurt(enemy, dmgOf(p), ctx)
          status(ctx, enemy, 'bleed', 12)
          say(ctx, 'Backstab!', enemy.x, enemy.y, '#d03a30')
        }
      }
    },

    {
      num: 507,
      id: 'sharp-straw',
      name: 'Sharp Straw',
      desc: 'Drain the room',
      info: 'Drains every enemy for Isaac’s damage plus a tenth of its maximum health, with a 15% chance of a half heart each',
      kind: 'active',
      quality: 2,
      dlc: 'afterbirth+',
      charge: 6,
      chargeType: 'normal',
      pools: ['treasure', 'greed-treasure'],
      tags: ['offensive', 'hearts', 'charge'],
      hooks: {
        onUse: function (p, ctx) {
          var es = foes(ctx)
          if (!es.length) return { fail: true }
          for (var i = 0; i < es.length; i++) {
            var e = es[i]
            if (!e) continue
            var extra = typeof e.maxHp === 'number' ? e.maxHp * 0.1 : 0
            hurt(e, dmgOf(p) + extra, ctx)
            if (roll(ctx, 0.15, 0.03, 0.4)) spawnPick(ctx, 'heart', e.x, e.y, { half: true })
          }
          noise(ctx, 'enemy-hurt')
          return {}
        }
      }
    },

    {
      num: 508,
      id: 'moms-razor',
      name: "Mom's Razor",
      desc: 'Bleeding orbital',
      info: 'An orbital blade that cuts for 1.5x Isaac’s damage a second and leaves enemies bleeding',
      kind: 'familiar',
      quality: 3,
      dlc: 'afterbirth+',
      pools: ['treasure', 'curse', 'moms-chest', 'greed-treasure', 'greed-curse', 'old-chest'],
      tags: ['familiar', 'orbital', 'offensive'],
      transform: 'mom',
      familiars: ['moms-razor']
    },

    {
      num: 509,
      id: 'bloodshot-eye',
      name: 'Bloodshot Eye',
      desc: 'Orbiting eye',
      info: 'An orbital eye that blocks shots and fires a 3.5 damage tear three times a second',
      kind: 'familiar',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure', 'baby-shop'],
      tags: ['familiar', 'orbital', 'offensive', 'defensive'],
      familiars: ['bloodshot-eye']
    },

    {
      num: 510,
      id: 'delirious',
      name: 'Delirious',
      desc: 'A friendly boss',
      info: 'Summons a friendly Delirium copy of a boss for the room',
      kind: 'active',
      quality: 2,
      dlc: 'afterbirth+',
      charge: 6,
      chargeType: 'normal',
      pools: ['angel'],
      tags: ['utility', 'angel', 'charge'],
      hooks: {
        onUse: function (p, ctx) {
          var room = ctx && ctx.room
          if (!room) return { fail: true }
          var ids = []
          var bs = IS.bosses || []
          for (var i = 0; i < bs.length; i++) if (bs[i] && bs[i].id && !bs[i].mini) ids.push(bs[i].id)
          var id = pickOf(ctx, ids)
          var s = freeSpot(ctx, p)
          if (id) {
            var e = null
            try {
              if (ctx && typeof ctx.spawnBoss === 'function') {
                e = ctx.spawnBoss(id, s.x, s.y, { friendly: true, charmed: true })
              }
            } catch (err) { e = null }
            if (e) {
              e.friendly = true
              status(ctx, e, 'charm', 999)
              noise(ctx, 'boss-roar')
              return {}
            }
          }
          spawnFam(ctx, 'charmed-minion', { life: 0 })
          noise(ctx, 'familiar-spawn')
          return {}
        }
      }
    },

    {
      num: 511,
      id: 'angry-fly',
      name: 'Angry Fly',
      desc: 'Picks a victim',
      info: 'A fly that latches onto one enemy until it dies, chewing anything else it touches',
      kind: 'familiar',
      quality: 1,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure', 'ultra-secret', 'baby-shop'],
      tags: ['familiar', 'fly', 'offensive'],
      familiars: ['angry-fly']
    },

    {
      num: 512,
      id: 'black-hole',
      name: 'Black Hole',
      desc: 'Throwable singularity',
      info: 'Throws a black hole that pulls everything in, deals 6 damage a second and crushes nearby rocks for six seconds',
      kind: 'active',
      quality: 3,
      dlc: 'afterbirth+',
      charge: 4,
      chargeType: 'normal',
      pools: ['treasure', 'greed-treasure', 'greed-shop'],
      tags: ['offensive', 'utility', 'charge'],
      hooks: {
        onUse: function (p, ctx) {
          if (!p) return { fail: true }
          var dir = aim(p)
          var c = cache(p)
          if (!Array.isArray(c.blackHoles)) c.blackHoles = []
          c.blackHoles.push({
            x: p.x + dir.x * 130, y: p.y + dir.y * 130, t: 6, tick: 0
          })
          noise(ctx, 'bomb-fuse')
          return {}
        },
        onRoomEnter: function (p) { cache(p).blackHoles = [] },
        onUpdate: function (p, dt, ctx) {
          var c = cache(p)
          var holes = c.blackHoles
          if (!Array.isArray(holes) || !holes.length) return
          dt = dt || 0
          var es = foes(ctx)
          var gs = gridsOf(ctx)
          for (var i = holes.length - 1; i >= 0; i--) {
            var h = holes[i]
            if (!h) { holes.splice(i, 1); continue }
            h.t -= dt
            h.tick += dt
            var j
            for (j = 0; j < es.length; j++) {
              var e = es[j]
              if (!e) continue
              var dd = d(e.x, e.y, h.x, h.y)
              if (dd > 220 || dd < 0.001) continue
              var pull = 190 * dt * (1 - dd / 240)
              e.x += ((h.x - e.x) / dd) * pull
              e.y += ((h.y - e.y) / dd) * pull
            }
            if (h.tick >= 0.25) {
              h.tick = 0
              for (j = 0; j < es.length; j++) {
                if (es[j] && d(es[j].x, es[j].y, h.x, h.y) < 110) hurt(es[j], 1.5, ctx)
              }
              for (j = 0; j < gs.length; j++) {
                var g = gs[j]
                if (g && !g.dead && d(g.x, g.y, h.x, h.y) < 90) smash(ctx, g)
              }
              var shots = shotsOf(ctx)
              for (j = 0; j < shots.length; j++) {
                if (shots[j] && !shots[j].friendly && d(shots[j].x, shots[j].y, h.x, h.y) < 70) kill(shots[j])
              }
            }
            if (h.t <= 0) holes.splice(i, 1)
          }
        }
      }
    },

    {
      num: 513,
      id: 'bozo',
      name: 'Bozo',
      desc: 'Clown mask',
      info: '+0.1 damage, +1 soul heart; enemies randomly get charmed or scared, and taking damage can drop a rainbow poop',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure'],
      tags: ['damage', 'hearts', 'utility'],
      stats: { damage: 0.1 },
      grant: { soul: 2 },
      hooks: {
        onUpdate: function (p, dt, ctx) {
          var c = cache(p)
          c.bozoT = (c.bozoT || 0) + (dt || 0)
          if (c.bozoT < 3) return
          c.bozoT = 0
          var es = foes(ctx)
          if (!es.length) return
          var e = pickOf(ctx, es)
          status(ctx, e, chance(ctx, 0.5) ? 'charm' : 'fear', 2.5)
        },
        onPlayerDamage: function (p, amount, source, ctx) {
          if (!p) return
          if (!chance(ctx, 0.05)) return
          poopAt(ctx, p.x, p.y)
          noise(ctx, 'poop-break')
        }
      }
    },

    {
      num: 514,
      id: 'broken-modem',
      name: 'Broken Modem',
      desc: 'Lag the room',
      info: 'Enemies and their shots stutter at random, the shots simply vanish, and room clears have a 25% chance to pay twice',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['shop', 'greed-treasure'],
      tags: ['utility', 'defensive'],
      hooks: {
        onUpdate: function (p, dt, ctx) {
          var c = cache(p)
          c.modemT = (c.modemT || 0) + (dt || 0)
          var wait = c.modemWait || 5
          if (c.modemT < wait) return
          c.modemT = 0
          c.modemWait = rangeOf(ctx, 4, 7)
          var i
          var es = foes(ctx)
          for (i = 0; i < es.length; i++) if (chance(ctx, 0.6)) status(ctx, es[i], 'petrify', 0.5)
          var shots = shotsOf(ctx)
          for (i = 0; i < shots.length; i++) {
            if (shots[i] && !shots[i].friendly && chance(ctx, 0.5)) kill(shots[i])
          }
          noise(ctx, 'beep')
        },
        onRoomClear: function (p, room, ctx) {
          room = theRoom(room, ctx)
          if (!room) return
          if (!roll(ctx, 0.25, 0.05, 0.5)) return
          var s = freeSpot(ctx, p)
          spawnPick(ctx, pickOf(ctx, ['coin', 'key', 'bomb', 'heart']), s.x, s.y, {})
        }
      }
    },

    {
      num: 515,
      id: 'mystery-gift',
      name: 'Mystery Gift',
      desc: 'A wrapped item',
      info: 'Spawns an item from the current room’s pool — sometimes just a Lump of Coal or The Poop',
      kind: 'active',
      quality: 2,
      dlc: 'afterbirth+',
      charge: 6,
      chargeType: 'normal',
      pools: ['shop', 'greed-treasure', 'greed-shop', 'crane-game'],
      tags: ['utility', 'charge'],
      hooks: {
        onUse: function (p, ctx) {
          var junk = []
          var i
          var candidates = ['lump-of-coal', 'the-poop']
          for (i = 0; i < candidates.length; i++) {
            if (IS.itemsById && IS.itemsById[candidates[i]]) junk.push(candidates[i])
          }
          var id = null
          if (junk.length && chance(ctx, 0.25)) id = pickOf(ctx, junk)
          if (!id) id = rollItemId(ctx, roomPool(ctx))
          if (!id && junk.length) id = pickOf(ctx, junk)
          if (!id) return { fail: true }
          pedestal(ctx, p, id)
          noise(ctx, 'pedestal-appear')
          return {}
        }
      }
    },

    {
      num: 516,
      id: 'sprinkler',
      name: 'Sprinkler',
      desc: 'Tears everywhere',
      info: 'Drops a sprinkler that sprays Isaac’s tears in a circle around itself',
      kind: 'active',
      quality: 2,
      dlc: 'afterbirth+',
      charge: 4,
      chargeType: 'normal',
      pools: ['treasure', 'greed-treasure', 'greed-shop', 'crane-game'],
      tags: ['familiar', 'offensive', 'charge'],
      hooks: {
        onUse: function (p, ctx) {
          if (!p) return { fail: true }
          spawnFam(ctx, 'sprinkler', {
            x: p.x, y: p.y, life: 40, dmg: dmgOf(p)
          })
          noise(ctx, 'familiar-spawn')
          return {}
        }
      }
    },

    {
      num: 517,
      id: 'fast-bombs',
      name: 'Fast Bombs',
      desc: 'Bomb spam',
      info: '+7 bombs; no delay between placements and bombs no longer shove each other',
      kind: 'passive',
      quality: 1,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure', 'bomb-bum'],
      tags: ['bombs', 'utility'],
      grant: { bombs: 7 },
      hooks: {
        // APPROXIMATED: the placement cooldown and bomb-vs-bomb knockback live
        // in js/engine/player.js and tears.js. The item publishes the two
        // markers those files read; the +7 bombs is real.
        onInit: function (p) {
          var c = cache(p)
          c.fastBombs = true
          c.bombNoKnockback = true
        },
        onRemove: function (p) {
          var c = cache(p)
          c.fastBombs = false
          c.bombNoKnockback = false
        }
      }
    },

    {
      num: 518,
      id: 'buddy-in-a-box',
      name: 'Buddy in a Box',
      desc: 'A random baby',
      info: 'A co-op baby familiar whose tear effect is rerolled on every new floor',
      kind: 'familiar',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['shop', 'greed-treasure', 'greed-shop', 'crane-game', 'baby-shop'],
      tags: ['familiar', 'baby', 'offensive'],
      transform: 'conjoined',
      familiars: ['buddy-in-a-box'],
      hooks: {
        onInit: function (p, ctx) { rerollBuddy(p, ctx) },
        onNewFloor: function (p, floor, ctx) { rerollBuddy(p, ctx) }
      }
    },

    {
      num: 519,
      id: 'lil-delirium',
      name: 'Lil Delirium',
      desc: 'Shifting familiar',
      info: 'A familiar that reshapes itself into a different one every ten seconds',
      kind: 'familiar',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['devil', 'angel', 'greed-devil', 'baby-shop'],
      tags: ['familiar', 'offensive', 'devil', 'angel'],
      familiars: ['lil-delirium'],
      hooks: {
        // APPROXIMATED: a familiar instance keeps the behaviour of its def, so
        // "becomes a random familiar" is a respawn with rerolled numbers and a
        // rerolled status every ten seconds rather than a behaviour swap.
        onUpdate: function (p, dt, ctx) {
          var c = cache(p)
          c.lilDelT = (c.lilDelT || 0) + (dt || 0)
          if (c.lilDelT < 10) return
          c.lilDelT = 0
          unfamiliar(p, 'lil-delirium')
          spawnFam(ctx, 'lil-delirium', {
            dmg: rangeOf(ctx, 3, 6),
            speed: rangeOf(ctx, 300, 460),
            cooldown: rangeOf(ctx, 0.3, 0.6),
            status: pickOf(ctx, ['poison', 'burn', 'slow', 'fear', 'charm', 'bleed']),
            statusSecs: 3,
            life: 0
          })
          noise(ctx, 'transform')
        }
      }
    },

    {
      num: 520,
      id: 'jumper-cables',
      name: 'Jumper Cables',
      desc: 'Kills into charge',
      info: 'Every fifteen enemies killed adds a charge to the held active item',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['shop', 'battery-bum', 'greed-treasure'],
      tags: ['charge', 'battery', 'utility'],
      hooks: {
        onEnemyKill: function (p, enemy, ctx) {
          var c = cache(p)
          c.jumperKills = (c.jumperKills || 0) + 1
          if (c.jumperKills < 15) return
          c.jumperKills = 0
          try { if (ctx && typeof ctx.addCharge === 'function') ctx.addCharge(1, 0) } catch (e) {}
          noise(ctx, 'charge-up')
        }
      }
    },

    {
      num: 521,
      id: 'coupon',
      name: 'Coupon',
      desc: 'One thing for free',
      info: 'Makes one item in the shop or Devil room free, and always keeps one shop item on sale',
      kind: 'active',
      quality: 2,
      dlc: 'afterbirth+',
      charge: 4,
      chargeType: 'normal',
      pools: ['shop'],
      tags: ['shop', 'coins', 'charge'],
      hooks: {
        onUse: function (p, ctx) {
          var ps = pickupsOf(ctx)
          var priced = []
          for (var i = 0; i < ps.length; i++) {
            if (ps[i] && !ps[i].dead && typeof ps[i].price === 'number' && ps[i].price > 0) priced.push(ps[i])
          }
          if (!priced.length) return { fail: true }
          var t = pickOf(ctx, priced)
          t.price = 0
          say(ctx, 'Free!', t.x, t.y, '#e0d040')
          noise(ctx, 'shop-buy')
          return {}
        },
        onRoomEnter: function (p, room, ctx) {
          room = theRoom(room, ctx)
          if (!room || room.type !== 'shop') return
          var ps = pickupsOf(ctx)
          for (var i = 0; i < ps.length; i++) {
            var pk = ps[i]
            if (!pk || pk.dead || typeof pk.price !== 'number' || pk.price <= 1) continue
            pk.price = Math.max(1, Math.floor(pk.price / 2))
            say(ctx, 'Sale!', pk.x, pk.y, '#e0d040')
            return
          }
        }
      }
    },

    {
      num: 522,
      id: 'telekinesis',
      name: 'Telekinesis',
      desc: 'Hold their shots',
      info: 'For three seconds every enemy shot near Isaac hangs in the air and enemies are pushed back; then the shots are hurled away',
      kind: 'active',
      quality: 2,
      dlc: 'afterbirth+',
      charge: 4,
      chargeType: 'normal',
      pools: ['treasure', 'greed-treasure'],
      tags: ['defensive', 'utility', 'charge'],
      hooks: {
        onUse: function (p, ctx) {
          var c = cache(p)
          c.tkTime = 3
          c.tkHeld = []
          noise(ctx, 'holy-shield')
          return {}
        },
        onRoomEnter: function (p) {
          var c = cache(p)
          c.tkTime = 0
          c.tkHeld = []
        },
        onUpdate: function (p, dt, ctx) {
          var c = cache(p)
          if (!(c.tkTime > 0) || !p) return
          var i
          var held = Array.isArray(c.tkHeld) ? c.tkHeld : (c.tkHeld = [])
          c.tkTime -= (dt || 0)
          var shots = shotsOf(ctx)
          for (i = 0; i < shots.length; i++) {
            var sh = shots[i]
            if (!sh || sh.dead || sh.friendly || sh.tkHeld) continue
            if (d(sh.x, sh.y, p.x, p.y) > 210) continue
            sh.tkHeld = true
            sh.tkVx = sh.vx
            sh.tkVy = sh.vy
            sh.vx = 0
            sh.vy = 0
            held.push(sh)
          }
          var es = foes(ctx)
          for (i = 0; i < es.length; i++) {
            if (es[i] && d(es[i].x, es[i].y, p.x, p.y) < 170) shove(es[i], p.x, p.y, 220 * (dt || 0) * 60)
          }
          if (c.tkTime > 0) return
          c.tkTime = 0
          for (i = 0; i < held.length; i++) {
            var s2 = held[i]
            if (!s2 || s2.dead) continue
            s2.tkHeld = false
            var dx = (s2.x || 0) - p.x
            var dy = (s2.y || 0) - p.y
            var l = Math.sqrt(dx * dx + dy * dy) || 1
            var sp = Math.sqrt((s2.tkVx || 0) * (s2.tkVx || 0) + (s2.tkVy || 0) * (s2.tkVy || 0)) || 380
            s2.vx = (dx / l) * sp * 1.4
            s2.vy = (dy / l) * sp * 1.4
          }
          c.tkHeld = []
          noise(ctx, 'web-shot')
        }
      }
    },

    {
      num: 523,
      id: 'moving-box',
      name: 'Moving Box',
      desc: 'Pack it up',
      info: 'Packs up to ten pickups and items from the room, then unpacks them wherever it is used next',
      kind: 'active',
      quality: 1,
      dlc: 'afterbirth+',
      charge: 4,
      chargeType: 'normal',
      pools: ['shop'],
      tags: ['utility', 'charge'],
      hooks: {
        onUse: function (p, ctx) {
          var c = cache(p)
          if (!Array.isArray(c.movingBox)) c.movingBox = []
          var i
          if (c.movingBox.length) {
            for (i = 0; i < c.movingBox.length; i++) {
              var box = c.movingBox[i]
              var s = freeSpot(ctx, p)
              if (box.itemId) spawnPick(ctx, 'item', s.x, s.y, { itemId: box.itemId })
              else spawnPick(ctx, box.kind || 'coin', s.x, s.y, {})
            }
            c.movingBox = []
            noise(ctx, 'chest-open')
            return {}
          }
          var ps = pickupsOf(ctx)
          for (i = 0; i < ps.length && c.movingBox.length < 10; i++) {
            var pk = ps[i]
            if (!pk || pk.dead) continue
            var id = itemIdOf(pk)
            c.movingBox.push({ kind: typeof pk.kind === 'string' ? pk.kind : 'coin', itemId: id })
            kill(pk)
          }
          if (!c.movingBox.length) return { fail: true }
          noise(ctx, 'chest-open')
          return {}
        }
      }
    },

    {
      num: 524,
      id: 'technology-zero',
      name: 'Technology Zero',
      desc: 'Wired tears',
      info: 'Isaac’s tears are strung together with electricity that shreds anything the wire crosses',
      kind: 'passive',
      quality: 3,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure', 'crane-game'],
      tags: ['tears', 'offensive', 'laser'],
      hooks: {
        onUpdate: function (p, dt, ctx) {
          if (!p) return
          var c = cache(p)
          c.techZeroT = (c.techZeroT || 0) + (dt || 0)
          if (c.techZeroT < 0.1) return
          c.techZeroT = 0
          var all = tearsOf(ctx)
          var mine = []
          for (var i = 0; i < all.length && mine.length < 8; i++) {
            var t = all[i]
            if (t && !t.dead && t.friendly !== false) mine.push(t)
          }
          if (mine.length < 2) return
          var es = foes(ctx)
          if (!es.length) return
          var per = dmgOf(p) * 0.45
          for (var a = 0; a < mine.length - 1; a++) {
            var t1 = mine[a]
            var t2 = mine[a + 1]
            if (d(t1.x, t1.y, t2.x, t2.y) > 340) continue
            for (var j = 0; j < es.length; j++) {
              var e = es[j]
              if (!e || e.dead) continue
              if (segDist(e.x, e.y, t1.x, t1.y, t2.x, t2.y) <= (e.r || 22) + 8) hurt(e, per, ctx)
            }
          }
        }
      }
    },

    {
      num: 525,
      id: 'leprosy',
      name: 'Leprosy',
      desc: 'Shed a shield',
      info: 'Taking damage sheds a chunk of flesh that orbits Isaac, blocks shots and grinds enemies; up to three at once',
      kind: 'passive',
      quality: 1,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure'],
      tags: ['orbital', 'defensive', 'offensive'],
      hooks: {
        // the cap is tracked per room: a shed orbital that gets shot down frees
        // its slot when the next room starts, which is as close as a hook can
        // get without being told the orbital died
        onRoomEnter: function (p) { cache(p).leprosyCount = 0 },
        onPlayerDamage: function (p, amount, source, ctx) {
          var c = cache(p)
          if ((c.leprosyCount || 0) >= 3) return
          c.leprosyCount = (c.leprosyCount || 0) + 1
          spawnFam(ctx, 'leprosy', { life: 0 })
          noise(ctx, 'familiar-spawn')
        }
      }
    },

    {
      num: 526,
      id: '7-seals',
      name: '7 Seals',
      desc: 'A little horseman',
      info: 'A miniature horseman that spawns locusts and changes which horseman it is every ten seconds',
      kind: 'familiar',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['devil', 'angel', 'greed-devil', 'greed-angel'],
      tags: ['familiar', 'offensive', 'devil', 'angel'],
      familiars: ['7-seals'],
      hooks: {
        // APPROXIMATED: which locust a summoner spawns is not a params key, so
        // the horseman swap rerolls its numbers and its contact status instead
        // of choosing a locust type.
        onUpdate: function (p, dt, ctx) {
          var c = cache(p)
          c.sealsT = (c.sealsT || 0) + (dt || 0)
          if (c.sealsT < 10) return
          c.sealsT = 0
          unfamiliar(p, '7-seals')
          spawnFam(ctx, '7-seals', {
            dmg: rangeOf(ctx, 3.5, 6),
            cooldown: rangeOf(ctx, 4, 6),
            status: pickOf(ctx, ['burn', 'poison', 'slow', 'fear']),
            statusSecs: 3,
            life: 0
          })
          noise(ctx, 'transform')
        }
      }
    },

    {
      num: 527,
      id: 'mr-me',
      name: 'Mr. ME!',
      desc: 'Send the ghost',
      info: 'Sends a ghost to do one job: fight an enemy, steal a price tag, crack open the room, or fetch what is lying around',
      kind: 'active',
      quality: 2,
      dlc: 'afterbirth+',
      charge: 6,
      chargeType: 'normal',
      pools: ['shop', 'key-master', 'greed-shop', 'crane-game', 'wooden-chest'],
      tags: ['utility', 'charge'],
      hooks: {
        // APPROXIMATED: the real Mr. ME! shows a movable cursor and does
        // whatever is under it. There is no cursor surface in ctx, so the ghost
        // picks the most useful job available, in the game's own priority order.
        onUse: function (p, ctx) {
          var i
          var room = ctx && ctx.room
          if (!room) return { fail: true }
          // 1. a locked door
          var doors = Array.isArray(room.doors) ? room.doors : []
          for (i = 0; i < doors.length; i++) {
            if (doors[i] && doors[i].locked) {
              unlock(ctx, doors[i].kind)
              noise(ctx, 'door-open')
              return {}
            }
          }
          // 2. something with a price tag — half the time the ghost steals it
          var ps = pickupsOf(ctx)
          for (i = 0; i < ps.length; i++) {
            var pk = ps[i]
            if (!pk || pk.dead || typeof pk.price !== 'number' || pk.price <= 0) continue
            if (chance(ctx, 0.5)) {
              pk.price = 0
              say(ctx, 'Stolen!', pk.x, pk.y, '#8a52c0')
            } else {
              say(ctx, 'Caught!', pk.x, pk.y, '#d03a30')
            }
            noise(ctx, 'shop-buy')
            return {}
          }
          // 3. an enemy — the ghost worries it to death
          var es = foes(ctx)
          if (es.length) {
            var target = es[0]
            for (i = 1; i < es.length; i++) {
              if (es[i] && p && d(es[i].x, es[i].y, p.x, p.y) < d(target.x, target.y, p.x, p.y)) target = es[i]
            }
            hurt(target, dmgOf(p) * 6, ctx)
            noise(ctx, 'enemy-hurt')
            return {}
          }
          // 4. nothing to do but wreck the furniture
          var gs = gridsOf(ctx)
          var wrecked = 0
          for (i = 0; i < gs.length && wrecked < 4; i++) {
            if (gs[i] && !gs[i].dead) { smash(ctx, gs[i]); wrecked++ }
          }
          if (wrecked) { noise(ctx, 'rock-break'); return {} }
          return { fail: true }
        }
      }
    },

    {
      num: 528,
      id: 'angelic-prism',
      name: 'Angelic Prism',
      desc: 'Splits your tears',
      info: 'An orbiting prism; Isaac’s tears passing through it split into four',
      kind: 'familiar',
      quality: 3,
      dlc: 'afterbirth+',
      pools: ['angel', 'greed-angel'],
      tags: ['familiar', 'orbital', 'offensive', 'angel'],
      familiars: ['angelic-prism'],
      hooks: {
        // APPROXIMATED: hooks cannot read a familiar's live position, so the
        // split happens on the prism's orbit ring (radius 90 around Isaac)
        // rather than at the prism itself.
        onUpdate: function (p, dt, ctx) {
          if (!p) return
          var ts = tearsOf(ctx)
          for (var i = 0; i < ts.length; i++) {
            var t = ts[i]
            if (!t || t.dead || t.prismSplit || t.friendly === false) continue
            var dd = d(t.x, t.y, p.x, p.y)
            if (dd < 78 || dd > 102) continue
            t.prismSplit = true
            var sp = Math.sqrt((t.vx || 0) * (t.vx || 0) + (t.vy || 0) * (t.vy || 0))
            if (sp < 1) continue
            var base = Math.atan2(t.vy || 0, t.vx || 0)
            var offs = [-0.4, -0.14, 0.14]
            for (var j = 0; j < offs.length; j++) {
              var a = base + offs[j]
              var extra = spawnTear(ctx, {
                x: t.x, y: t.y,
                vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                dmg: typeof t.dmg === 'number' ? t.dmg : dmgOf(p),
                r: typeof t.r === 'number' ? t.r : 12,
                friendly: true
              })
              if (extra) extra.prismSplit = true
            }
          }
        }
      }
    },

    {
      num: 529,
      id: 'pop',
      name: 'Pop!',
      desc: 'Eyeball tears',
      info: 'Tears become eyeballs that roll on forever and bounce off each other',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure'],
      tags: ['tears', 'range', 'offensive'],
      // the engine reads the 'pop' tear flag: eyeballs bounce off walls and rocks and live long
      // APPROXIMATE: tears do not bounce off each other
      tearFlags: ['pop']
    },

    {
      num: 530,
      id: 'deaths-list',
      name: "Death's List",
      desc: 'Kill in order',
      info: 'Enemies are numbered; killing them in the marked order pays out a pickup or a stat up',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['devil', 'greed-devil'],
      tags: ['utility', 'devil'],
      hooks: {
        onRoomEnter: function (p, room, ctx) {
          room = theRoom(room, ctx)
          var c = cache(p)
          c.deathsOrder = []
          c.deathsIdx = 0
          if (!room) return
          var es = foes(ctx)
          if (es.length < 2) return
          var pool = es.slice(0)
          while (pool.length) {
            var i = intOf(ctx, pool.length)
            if (i < 0 || i >= pool.length) i = 0
            c.deathsOrder.push(pool[i])
            pool.splice(i, 1)
          }
          for (var j = 0; j < c.deathsOrder.length; j++) {
            var e = c.deathsOrder[j]
            if (e) say(ctx, String(j + 1), e.x, e.y - 20, '#e8e4dc')
          }
        },
        onEnemyKill: function (p, enemy, ctx) {
          var c = cache(p)
          var order = c.deathsOrder
          if (!Array.isArray(order) || !order.length) return
          var idx = c.deathsIdx || 0
          if (idx >= order.length) return
          if (order[idx] !== enemy) {
            // wrong target: the list resets
            c.deathsOrder = []
            c.deathsIdx = 0
            return
          }
          c.deathsIdx = idx + 1
          if (c.deathsIdx < order.length) return
          c.deathsOrder = []
          c.deathsIdx = 0
          if (chance(ctx, 0.5)) {
            var up = pickOf(ctx, STAT_UPS)
            if (up) {
              if (!c.deathsStats) c.deathsStats = {}
              c.deathsStats[up.k] = (c.deathsStats[up.k] || 0) + up.v
              recalc(p)
              say(ctx, 'Marked!', p ? p.x : 520, p ? p.y : 280, '#8a52c0')
            }
          } else {
            var s = freeSpot(ctx, p)
            spawnPick(ctx, pickOf(ctx, ['coin', 'key', 'bomb', 'heart', 'card', 'pill']), s.x, s.y, {})
          }
          noise(ctx, 'secret-found')
        },
        onStats: function (p, s) { applyBag(s, cache(p).deathsStats) }
      }
    },

    {
      num: 531,
      id: 'haemolacria',
      name: 'Haemolacria',
      desc: 'Bursting blood tears',
      info: '+1 and x1.5 damage, much slower fire rate and shorter range; tears arc and burst into smaller ones on impact',
      kind: 'passive',
      quality: 3,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure', 'ultra-secret'],
      tags: ['tears', 'damage', 'offensive'],
      stats: { tears: 0.22, damage: 1, range: -52 },
      mult: { tears: 0.264, damage: 1.5 },
      tearFlags: ['splitting'],
      hooks: {
        // the arc: tears.js lobs a tear in a parabola when tear.lob is set
        onTearFire: function (p, tear) {
          if (!tear) return
          tear.lob = true
          if (typeof tear.r === 'number') tear.r *= 1.35
        }
      }
    },

    {
      num: 532,
      id: 'lachryphagy',
      name: 'Lachryphagy',
      desc: 'Hungry tears',
      info: 'Tears slow to a halt and then burst into five to eight smaller ones',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure'],
      tags: ['tears', 'offensive'],
      hooks: {
        // APPROXIMATED: tears merging into bigger tears needs collision work in
        // tears.js. The slow-stop-burst half is implemented here in full.
        onTearFire: function (p, tear) {
          if (!tear) return
          tear.lachry = true
          tear.life = typeof tear.life === 'number' ? tear.life + 1.5 : 3
        },
        onUpdate: function (p, dt, ctx) {
          var ts = tearsOf(ctx)
          if (!ts.length) return
          dt = dt || 0
          var decay = Math.pow(0.4, dt)
          for (var i = 0; i < ts.length; i++) {
            var t = ts[i]
            if (!t || t.dead || !t.lachry) continue
            t.vx = (t.vx || 0) * decay
            t.vy = (t.vy || 0) * decay
            var sp = Math.sqrt((t.vx || 0) * (t.vx || 0) + (t.vy || 0) * (t.vy || 0))
            if (sp > 70) continue
            t.lachry = false
            var n = 5 + intOf(ctx, 4)
            var out = 480 * stat(p, 'shotSpeed', 1)
            var dmg = (typeof t.dmg === 'number' ? t.dmg : dmgOf(p)) * 0.6
            for (var j = 0; j < n; j++) {
              var a = (Math.PI * 2 * j) / n
              spawnTear(ctx, {
                x: t.x, y: t.y,
                vx: Math.cos(a) * out, vy: Math.sin(a) * out,
                dmg: dmg, r: 9, friendly: true
              })
            }
            kill(t)
            noise(ctx, 'tear-splat')
          }
        }
      }
    },

    {
      num: 533,
      id: 'trisagion',
      name: 'Trisagion',
      desc: 'Beams of light',
      info: 'Tears become short piercing beams of light that deal a third of Isaac’s damage but hit over and over',
      kind: 'passive',
      quality: 3,
      dlc: 'afterbirth+',
      pools: ['angel', 'greed-angel'],
      tags: ['tears', 'laser', 'offensive', 'angel'],
      mult: { damage: 0.33 },
      flags: ['laser'],
      tearFlags: ['light', 'piercing', 'holy']
    },

    {
      num: 534,
      id: 'schoolbag',
      name: 'Schoolbag',
      desc: 'Two actives',
      info: 'Isaac can carry a second active item and swap between them',
      kind: 'passive',
      quality: 3,
      dlc: 'afterbirth+',
      pools: ['shop', 'golden-chest', 'greed-shop'],
      tags: ['utility', 'charge'],
      hooks: {
        // the second slot exists in p.active already; this opens it and tells
        // js/engine/player.js that swapping is allowed
        onInit: function (p) {
          if (!p) return
          cache(p).schoolbag = true
          if (Array.isArray(p.active) && p.active.length < 2) p.active.push(null)
        },
        onRemove: function (p) { cache(p).schoolbag = false },
        // the swap key (Z) is handled by js/engine/player.js (IS.swapActives)
      }
    },

    {
      num: 535,
      id: 'blanket',
      name: 'Blanket',
      desc: 'Safe in boss rooms',
      info: 'Heals one heart, +1 soul heart, and walking into a boss room hands Isaac a one-hit shield',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['shop', 'greed-shop'],
      tags: ['hearts', 'defensive'],
      grant: { heal: 2, soul: 2 },
      hooks: {
        onRoomEnter: function (p, room, ctx) {
          room = theRoom(room, ctx)
          if (!room) return
          var c = cache(p)
          var boss = room.type === 'boss' || room.type === 'boss-double' || !!room.boss
          if (boss === !!c.blanketShield) return
          c.blanketShield = boss
          recalc(p)
          if (boss) noise(ctx, 'holy-shield')
        },
        onStats: function (p, s) {
          if (cache(p).blanketShield) applyParcel(s, 'shieldCount', 1)
        }
      }
    },

    {
      num: 536,
      id: 'sacrificial-altar',
      name: 'Sacrificial Altar',
      desc: 'Trade familiars for deals',
      info: 'Sacrifices up to two familiar items and lays out a Devil room item for each one',
      kind: 'active',
      quality: 2,
      dlc: 'afterbirth+',
      charge: 6,
      chargeType: 'normal',
      pools: ['devil', 'curse', 'greed-curse', 'greed-devil'],
      tags: ['devil', 'utility', 'charge'],
      hooks: {
        // APPROXIMATED: the blue-flies-into-coins half needs the live swarm,
        // which no ctx call exposes; a coin is paid per sacrifice instead.
        onUse: function (p, ctx) {
          if (!p || !Array.isArray(p.items)) return { fail: true }
          var victims = []
          for (var i = 0; i < p.items.length && victims.length < 2; i++) {
            var id = p.items[i]
            var def = id && IS.itemsById ? IS.itemsById[id] : null
            if (!def || def.id === 'sacrificial-altar') continue
            if (def.kind !== 'familiar' && !(def.familiars && def.familiars.length)) continue
            victims.push(id)
          }
          if (!victims.length) return { fail: true }
          for (i = 0; i < victims.length; i++) {
            try { if (ctx && typeof ctx.removeItem === 'function') ctx.removeItem(victims[i]) } catch (e) {}
            var devilId = rollItemId(ctx, 'devil')
            if (devilId) pedestal(ctx, p, devilId)
            spawnPick(ctx, 'coin', freeSpot(ctx, p).x, freeSpot(ctx, p).y, {})
          }
          noise(ctx, 'devil-deal')
          return {}
        }
      }
    },

    {
      num: 537,
      id: 'lil-spewer',
      name: 'Lil Spewer',
      desc: 'Spits creep',
      info: 'A familiar that spits a line of creep; swallowing a pill changes what the creep does. Comes with a pill',
      kind: 'familiar',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure', 'baby-shop'],
      tags: ['familiar', 'pill', 'offensive'],
      grant: { pills: 1 },
      familiars: ['lil-spewer'],
      hooks: {
        onPillUse: function (p, pillId, ctx) {
          var kinds = ['poison', 'burn', 'slow', 'charm', 'fear']
          var s = pickOf(ctx, kinds)
          var flag = s === 'burn' ? 'burn' : (s === 'poison' ? 'poison' : 'slow')
          unfamiliar(p, 'lil-spewer')
          spawnFam(ctx, 'lil-spewer', {
            status: s, statusSecs: 4, tearFlags: [flag], life: 0
          })
          noise(ctx, 'pill-use')
        }
      }
    },

    {
      num: 538,
      id: 'marbles',
      name: 'Marbles',
      desc: 'A mouthful of trinkets',
      info: 'Coughs up three random trinkets; taking damage has a 10% chance to swallow the held trinket and keep it forever',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['boss', 'greed-boss', 'crane-game'],
      tags: ['utility', 'unlockable'],
      hooks: {
        onInit: function (p, ctx) {
          for (var i = 0; i < 3; i++) {
            var s = freeSpot(ctx, p)
            spawnPick(ctx, 'trinket', s.x, s.y, {})
          }
        },
        onPlayerDamage: function (p, amount, source, ctx) {
          if (!roll(ctx, 0.1, 0.02, 0.25)) return
          if (!p || !Array.isArray(p.trinkets)) return
          for (var i = 0; i < p.trinkets.length; i++) {
            var id = p.trinkets[i]
            if (!id) continue
            smelt(p, id)
            p.trinkets[i] = null
            recalc(p)
            say(ctx, 'Gulp!', p.x, p.y, '#e0d040')
            return
          }
        },
        onStats: function (p, s) { smeltedStats(p, s) }
      }
    },

    {
      num: 539,
      id: 'mystery-egg',
      name: 'Mystery Egg',
      desc: 'Hatches on hit',
      info: 'Taking damage hatches a friendly monster; the longer Isaac goes unhurt, the better the friend',
      kind: 'familiar',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure'],
      tags: ['familiar', 'utility'],
      familiars: ['mystery-egg'],
      hooks: {
        onRoomClear: function (p) {
          var c = cache(p)
          c.eggStreak = (c.eggStreak || 0) + 1
        },
        onPlayerDamage: function (p, amount, source, ctx) {
          var c = cache(p)
          var streak = c.eggStreak || 0
          c.eggStreak = 0
          var who = streak >= 4 ? 'charmed-minion' : (streak >= 2 ? 'charmed-spider' : 'charmed-fly')
          spawnFam(ctx, who, { life: 0 })
          noise(ctx, 'familiar-spawn')
        }
      }
    },

    {
      num: 540,
      id: 'flat-stone',
      name: 'Flat Stone',
      desc: 'Skipping tears',
      info: 'Tears skip along the floor, splashing everything nearby on each bounce',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure'],
      tags: ['tears', 'offensive'],
      tearFlags: ['bouncing'],
      hooks: {
        onTearDeath: function (p, tear, ctx) {
          if (!tear) return
          var es = foes(ctx)
          var splash = (typeof tear.dmg === 'number' ? tear.dmg : dmgOf(p)) * 0.25
          for (var i = 0; i < es.length; i++) {
            var e = es[i]
            if (e && d(e.x, e.y, tear.x, tear.y) < 48) hurt(e, splash, ctx)
          }
        }
      }
    },

    {
      num: 541,
      id: 'marrow',
      name: 'Marrow',
      desc: 'Bone and blood',
      info: '+1 bone heart and three red hearts on the floor',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['boss', 'greed-boss', 'ultra-secret'],
      tags: ['hearts', 'defensive'],
      grant: { bone: 2 },
      hooks: {
        onInit: function (p, ctx) {
          for (var i = 0; i < 3; i++) {
            var s = freeSpot(ctx, p)
            spawnPick(ctx, 'heart', s.x, s.y, {})
          }
        }
      }
    },

    {
      num: 542,
      id: 'slipped-rib',
      name: 'Slipped Rib',
      desc: 'Shot-eating orbital',
      info: 'An orbiting rib that stops enemy shots dead; it does no damage of its own',
      kind: 'familiar',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure'],
      tags: ['familiar', 'orbital', 'defensive'],
      familiars: ['slipped-rib']
    },

    {
      num: 543,
      id: 'hallowed-ground',
      name: 'Hallowed Ground',
      desc: 'Holy poop',
      info: 'Taking damage drops a white poop; inside its aura Isaac gets x2.5 fire rate, x1.2 damage, homing tears and a coin flip against damage',
      kind: 'passive',
      quality: 3,
      dlc: 'afterbirth+',
      pools: ['treasure', 'angel', 'greed-treasure', 'greed-angel'],
      tags: ['defensive', 'poop', 'angel'],
      hooks: {
        onRoomEnter: function (p) {
          var c = cache(p)
          c.hallowedPoops = []
          if (c.hallowedAura) { c.hallowedAura = false; recalc(p) }
        },
        onPlayerDamage: function (p, amount, source, ctx) {
          var c = cache(p)
          if (c.hallowedAura && chance(ctx, 0.5)) {
            noise(ctx, 'holy-shield')
            return { cancel: true }
          }
          if (!Array.isArray(c.hallowedPoops)) c.hallowedPoops = []
          if (p && c.hallowedPoops.length < 6) {
            poopAt(ctx, p.x, p.y)
            c.hallowedPoops.push({ x: p.x, y: p.y })
          }
        },
        onUpdate: function (p, dt, ctx) {
          var c = cache(p)
          var list = c.hallowedPoops
          if (!p) return
          var inside = false
          if (Array.isArray(list)) {
            for (var i = 0; i < list.length; i++) {
              if (list[i] && d(p.x, p.y, list[i].x, list[i].y) < 95) { inside = true; break }
            }
          }
          if (inside === !!c.hallowedAura) return
          c.hallowedAura = inside
          recalc(p)
        },
        onStats: function (p, s, mult) {
          if (!cache(p).hallowedAura || !s) return
          mult.tears *= 2.5
          mult.damage *= 1.2
        },
        onTearFire: function (p, tear) {
          if (cache(p).hallowedAura) addFlag(tear, 'homing')
        }
      }
    },

    {
      num: 544,
      id: 'pointy-rib',
      name: 'Pointy Rib',
      desc: 'A held blade',
      info: 'A rib that hovers by Isaac and shreds whatever it touches for six times his damage a second',
      kind: 'familiar',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure'],
      tags: ['familiar', 'orbital', 'offensive'],
      familiars: ['pointy-rib']
    },

    {
      num: 545,
      id: 'book-of-the-dead',
      name: 'Book of the Dead',
      desc: 'Raise the dead',
      info: 'Turns the enemies killed in this room into bone orbitals and friendly bonies, up to eight',
      kind: 'active',
      quality: 2,
      dlc: 'afterbirth+',
      charge: 4,
      chargeType: 'normal',
      pools: ['treasure', 'devil', 'library', 'greed-treasure', 'greed-devil'],
      tags: ['book', 'orbital', 'offensive', 'charge'],
      transform: 'bookworm',
      hooks: {
        onRoomEnter: function (p) { cache(p).botdKills = 0 },
        onEnemyKill: function (p) {
          var c = cache(p)
          c.botdKills = (c.botdKills || 0) + 1
        },
        onUse: function (p, ctx) {
          var c = cache(p)
          var n = c.botdKills || 0
          if (n < 1) return { fail: true }
          if (n > 8) n = 8
          c.botdKills = 0
          for (var i = 0; i < n; i++) {
            if (chance(ctx, 0.6)) spawnFam(ctx, 'bone-orbital', { life: 0 })
            else spawnFam(ctx, 'charmed-minion', { life: 0 })
          }
          noise(ctx, 'familiar-spawn')
          return {}
        }
      }
    },

    {
      num: 546,
      id: 'dads-ring',
      name: "Dad's Ring",
      desc: 'Petrifying aura',
      info: 'A yellow ring around Isaac that petrifies any enemy that steps into it',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['secret', 'greed-secret', 'old-chest'],
      tags: ['defensive', 'utility'],
      hooks: {
        onUpdate: function (p, dt, ctx) {
          if (!p) return
          var c = cache(p)
          c.ringT = (c.ringT || 0) + (dt || 0)
          if (c.ringT < 0.3) return
          c.ringT = 0
          var es = foes(ctx)
          for (var i = 0; i < es.length; i++) {
            var e = es[i]
            if (e && !e.boss && d(e.x, e.y, p.x, p.y) < 115) status(ctx, e, 'petrify', 0.8)
          }
        }
      }
    },

    {
      num: 547,
      id: 'divorce-papers',
      name: 'Divorce Papers',
      desc: 'Signed and sealed',
      info: '+0.72 tears, +1 bone heart, and the Mysterious Paper trinket',
      kind: 'passive',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['boss', 'greed-boss', 'old-chest'],
      tags: ['tears', 'hearts'],
      stats: { tears: 0.72 },
      grant: { bone: 2 },
      hooks: {
        onInit: function (p, ctx) {
          if (IS.trinketsById && IS.trinketsById['mysterious-paper']) {
            var s = freeSpot(ctx, p)
            spawnPick(ctx, 'trinket', s.x, s.y, { trinketId: 'mysterious-paper', id: 'mysterious-paper' })
            return
          }
          var s2 = freeSpot(ctx, p)
          spawnPick(ctx, 'trinket', s2.x, s2.y, {})
        }
      }
    },

    {
      num: 548,
      id: 'jaw-bone',
      name: 'Jaw Bone',
      desc: 'Fetching jaw',
      info: 'A jaw that flies out, bites for seven damage and drags pickups back to Isaac',
      kind: 'familiar',
      quality: 2,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure'],
      tags: ['familiar', 'offensive', 'utility'],
      familiars: ['jaw-bone']
    },

    {
      num: 549,
      id: 'brittle-bones',
      name: 'Brittle Bones',
      desc: 'Six bone hearts',
      info: 'Swaps every red heart container for six empty bone hearts; losing one gives +0.4 tears and fires ten bone tears in all directions',
      kind: 'passive',
      quality: 1,
      dlc: 'afterbirth+',
      pools: ['treasure', 'greed-treasure'],
      tags: ['hearts', 'tears', 'stat-down'],
      grant: { bone: 12 },
      flags: ['boneHearts', 'noRedHearts'],
      hooks: {
        onInit: function (p) {
          if (!p || !p.hearts) return
          var red = p.hearts.maxRed || 0
          if (red > 0 && typeof IS.addMaxHearts === 'function') {
            try { IS.addMaxHearts(p, -red, false) } catch (e) {}
          }
          cache(p).brittleBoneLast = p.hearts.bone || 0
        },
        onUpdate: function (p, dt, ctx) {
          if (!p || !p.hearts) return
          var c = cache(p)
          var now = p.hearts.bone || 0
          if (typeof c.brittleBoneLast !== 'number') { c.brittleBoneLast = now; return }
          if (now >= c.brittleBoneLast) { c.brittleBoneLast = now; return }
          var lost = Math.max(1, Math.floor((c.brittleBoneLast - now) / 2))
          c.brittleBoneLast = now
          c.brittleTears = (c.brittleTears || 0) + 0.4 * lost
          recalc(p)
          var speed = 520 * stat(p, 'shotSpeed', 1)
          for (var i = 0; i < 10; i++) {
            var a = (Math.PI * 2 * i) / 10
            var t = spawnTear(ctx, {
              x: p.x, y: p.y,
              vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
              dmg: dmgOf(p), r: 11, friendly: true
            })
            if (t) addFlag(t, 'rock')
          }
          noise(ctx, 'rock-break')
        },
        onStats: function (p, s) {
          applyParcel(s, 'tears', cache(p).brittleTears || 0)
        }
      }
    },

    {
      num: 550,
      id: 'broken-shovel',
      name: 'Broken Shovel',
      desc: "Mom's foot follows",
      info: "Mom's foot keeps trying to stomp Isaac; using the shovel stops the stomping for the room",
      kind: 'active',
      quality: 0,
      dlc: 'afterbirth+',
      charge: 4,
      chargeType: 'normal',
      pools: ['treasure'],
      tags: ['curse', 'challenge-only', 'charge'],
      hooks: {
        onUse: function (p, ctx) {
          var c = cache(p)
          c.shovelStopped = true
          c.stompT = 0
          c.stompMark = null
          noise(ctx, 'menu-back')
          return {}
        },
        onRoomEnter: function (p) {
          var c = cache(p)
          c.shovelStopped = false
          c.stompT = 0
          c.stompMark = null
        },
        onUpdate: function (p, dt, ctx) {
          if (!p) return
          var c = cache(p)
          if (c.shovelStopped) return
          var room = ctx && ctx.room
          if (!room) return
          dt = dt || 0
          if (c.stompMark) {
            c.stompMark.t -= dt
            if (c.stompMark.t > 0) return
            var m = c.stompMark
            c.stompMark = null
            quake(ctx, 10, 0.35)
            noise(ctx, 'bomb-explode')
            if (d(p.x, p.y, m.x, m.y) < 70) {
              try { if (ctx && typeof ctx.damagePlayer === 'function') ctx.damagePlayer(1, 'moms-foot') } catch (e) {}
            }
            var es = foes(ctx)
            for (var i = 0; i < es.length; i++) {
              if (es[i] && d(es[i].x, es[i].y, m.x, m.y) < 80) hurt(es[i], 20, ctx)
            }
            return
          }
          c.stompT = (c.stompT || 0) + dt
          if (c.stompT < 3.5) return
          c.stompT = 0
          c.stompMark = { x: p.x, y: p.y, t: 0.8 }
          say(ctx, '!', p.x, p.y - 40, '#d03a30')
          noise(ctx, 'charge-up')
        }
      }
    },

    {
      num: 551,
      id: 'broken-shovel-551',
      name: 'Broken Shovel',
      desc: 'The other half',
      info: 'The second half of the shovel; with both halves Mom’s Shovel is whole. Use it on the mound of dirt in the "Dark Room"',
      kind: 'passive',
      quality: 0,
      dlc: 'afterbirth+',
      pools: ['treasure'],
      tags: ['utility', 'challenge-only'],
      hooks: {
        onInit: function (p, ctx) {
          if (!p || !ctx) return
          var hasFirst = false
          try { hasFirst = typeof ctx.hasItem === 'function' ? !!ctx.hasItem('broken-shovel') : false } catch (e) { hasFirst = false }
          if (!hasFirst || !IS.itemsById || !IS.itemsById['moms-shovel']) return
          try { ctx.removeItem('broken-shovel') } catch (e2) {}
          try { ctx.removeItem('broken-shovel-551') } catch (e3) {}
          try { ctx.giveItem('moms-shovel', {}) } catch (e4) {}
          noise(ctx, 'secret-found')
        }
      }
    },

    {
      num: 552,
      id: 'moms-shovel',
      name: "Mom's Shovel",
      desc: 'Dig anywhere',
      info: 'Digs a trapdoor to the next floor, or a crawlspace on decorative ground. Use it on the mound of dirt in the "Dark Room"',
      kind: 'active',
      quality: 2,
      dlc: 'afterbirth+',
      charge: 4,
      chargeType: 'normal',
      pools: ['treasure', 'secret'],
      tags: ['utility', 'charge'],
      transform: 'mom',
      hooks: {
        onUse: function (p, ctx) {
          var room = ctx && ctx.room
          if (!room) return { fail: true }
          if (chance(ctx, 0.1)) {
            try { if (typeof ctx.spawnCrawlspace === 'function') ctx.spawnCrawlspace() } catch (e) {}
            noise(ctx, 'secret-found')
            return {}
          }
          try { if (typeof ctx.spawnTrapdoor === 'function') ctx.spawnTrapdoor() } catch (e2) {}
          noise(ctx, 'trapdoor')
          return {}
        }
      }
    }

  ])

  // --- helpers that hooks above close over -----------------------------------

  // Greed's Gullet: containers follow the coin count, so the grant has to be
  // reconciled rather than applied once.
  function syncGullet (p, ctx) {
    if (!p || !p.hearts) return
    var c = cache(p)
    var want = Math.floor((p.coins || 0) / 25)
    if (want > 6) want = 6
    var have = c.gulletGiven || 0
    if (want === have) return
    var delta = (want - have) * 2
    if (typeof IS.addMaxHearts === 'function') {
      try { IS.addMaxHearts(p, delta, delta > 0) } catch (e) { return }
    }
    c.gulletGiven = want
    if (delta > 0) noise(ctx, 'heart-pickup')
  }

  // Buddy in a Box: a familiar instance takes its opts from the spawn call, so a
  // new tear effect means a respawn.
  function rerollBuddy (p, ctx) {
    var flag = pickOf(ctx, ROOM_TEAR_FLAGS)
    unfamiliar(p, 'buddy-in-a-box')
    spawnFam(ctx, 'buddy-in-a-box', {
      tearFlags: flag ? [flag] : [],
      dmg: 3.5,
      fireDelay: 0.7,
      range: 500,
      life: 0
    })
    cache(p).buddyFlag = flag
  }

})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
