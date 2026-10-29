;(function (IS) {
  'use strict'

  // Generated from docs/reference/slices/items-2.json. Declarative effects are
  // preferred; hooks use only ARCHITECTURE §5.2 names and seeded ctx RNG.

  function puddle(tear, ctx) {
    if (!tear || !tear.flags || !tear.flags.has("holywater") || tear.hwDone || !ctx) return
    tear.hwDone = true
    IS.spawnPuddle({ x: tear.x, y: tear.y, r: 70, dmg: 3, life: 4, status: [["freeze", 1.5]], colour: "#7fb8e8" }, ctx)
  }

  // ---- shared helpers for the hooks below ----------------------------------------

  function cacheOf(p) { return p.cache || (p.cache = {}) }

  // true on every nth call; the room-clear counters of Sack of Pennies and friends
  function everyRooms(p, key, n) {
    var c = cacheOf(p)
    c[key] = (c[key] || 0) + 1
    if (c[key] < n) return false
    c[key] = 0
    return true
  }

  // a pickup tossed out beside Isaac
  function drop(ctx, p, kind, opts) {
    if (!ctx || !ctx.room || !kind) return null
    var o = { toss: true }
    for (var k in opts) o[k] = opts[k]
    return ctx.spawnPickup(kind, p.x, p.y, o)
  }

  function findFamiliar(p, id) {
    var list = p.familiars || []
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]
    return null
  }

  // the held fire direction, or null when Isaac is not shooting
  function shootDir() {
    var d = IS.input && IS.input.shoot ? IS.input.shoot() : null
    return d && (d.x || d.y) ? d : null
  }

  // self-inflicted damage (Razor Blade, IV Bag): red hearts go first, no invulnerability frames
  function selfHurt(p, n, ctx, name) {
    var h = p.hearts
    var take = Math.min(h.red, n)
    h.red -= take
    n -= take
    if (n > 0) IS.damagePlayer(p, n, { name: name, self: true }, ctx)
    else if (IS.totalHearts(p) <= 0) IS.killPlayer(p, ctx)
  }

  // A Pony / White Pony: a short burst of speed in the direction Isaac is moving that
  // hurts what it runs through. onStep runs every 0.1 s of the dash.
  function startDash(p, secs) {
    var m = IS.input && IS.input.move ? IS.input.move() : null
    var d = m && (m.x || m.y) ? m : (p.head || { x: 1, y: 0 })
    var n = IS.norm(d.x, d.y)
    cacheOf(p).dash = { t: secs, dx: n.x, dy: n.y, hit: [], step: 0 }
  }

  function updateDash(p, dt, ctx, onStep) {
    var d = p.cache && p.cache.dash
    if (!d) return
    d.t -= dt
    if (d.t <= 0) { p.cache.dash = null; return }
    p.vx = d.dx * 900
    p.vy = d.dy * 900
    if (!ctx || !ctx.room) return
    ctx.livingEnemies().forEach(function (e) {
      if (d.hit.indexOf(e) >= 0 || IS.dist(p.x, p.y, e.x, e.y) > p.r + e.r) return
      d.hit.push(e)
      IS.damageEnemy(e, p.stats.damage * 2, { silent: true }, ctx)
    })
    d.step -= dt
    if (d.step <= 0) { d.step = 0.1; if (onStep) onStep(p, ctx) }
  }

  // a baby that fires its own pattern while Isaac shoots; fireTear(p, f, angle, ctx) per familiar
  function babyFire(p, dt, ctx, id, key, delay, fireTear) {
    if (!ctx || !ctx.room) return
    var c = cacheOf(p)
    c[key] = (c[key] || 0) - dt
    if (c[key] > 0) return
    var d = shootDir()
    if (!d) return
    c[key] = delay
    var a = Math.atan2(d.y, d.x)
    ;(p.familiars || []).forEach(function (f) { if (f.id === id) fireTear(p, f, a, ctx) })
  }

  function babyTear(ctx, f, a, dmg, flags) {
    var s = IS.TEAR_SPEED
    return ctx.spawnTear({ x: f.x, y: f.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, dmg: dmg, r: 7, life: 520 / s, flags: flags || new Set(), friendly: true })
  }

  IS.defineItems([
    {
      id: "the-gamekid",
      num: 93,
      name: "The Gamekid",
      desc: "Receive for 6.5 seconds:",
      info: "Receive for 6.5 seconds: · Invincibility · Isaac can't shoot but deals 40 contact damage per second · Killing 2 enemies heals half a heart · Fears all enemies in the room",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-treasure", "crane-game"],
      tags: ["offensive", "defensive", "hearts", "utility", "charge"],
      dlc: "rebirth",
      charge: 2,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          var c = cacheOf(p)
          c.gamekid = 6.5
          c.gamekidKills = 0
          c.gamekidTick = 0
          if (!p.status) p.status = {}
          p.status.invincible = Math.max(p.status.invincible || 0, 6.5)
          if (ctx && ctx.room) ctx.livingEnemies().forEach(function (e) { IS.applyStatus(e, 'fear', 6.5, ctx) })
        },
        onUpdate: function (p, dt, ctx) {
          var c = p.cache
          if (!c || !(c.gamekid > 0) || !ctx || !ctx.room) return
          c.gamekid -= dt
          c.gamekidTick -= dt
          if (c.gamekidTick > 0) return
          c.gamekidTick = 0.1
          // 40 contact damage per second, in 0.1 s ticks
          ctx.livingEnemies().forEach(function (e) {
            if (IS.dist(p.x, p.y, e.x, e.y) < p.r + e.r + 6) IS.damageEnemy(e, 4, { silent: true }, ctx)
          })
        },
        // Isaac can't shoot while the effect lasts
        onTearFire: function (p, tear) { if (p.cache && p.cache.gamekid > 0) { tear.dead = true; tear.life = 0 } },
        onEnemyKill: function (p, e, ctx) {
          var c = p.cache
          if (!c || !(c.gamekid > 0)) return
          c.gamekidKills = (c.gamekidKills || 0) + 1
          if (c.gamekidKills >= 2) { c.gamekidKills = 0; IS.healRed(p, 1) }
        }
      },
      unlock: null
    },

    {
      id: "sack-of-pennies",
      num: 94,
      name: "Sack of Pennies",
      desc: "Spawns a random coin every 2 rooms",
      info: "Spawns a random coin every 2 rooms",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["coins"],
      dlc: "rebirth",
      hooks: { onRoomClear: function (p, room, ctx) { var c=p.cache||(p.cache={}); c["sack-of-penniesRooms"]=(c["sack-of-penniesRooms"]||0)+1; if(c["sack-of-penniesRooms"]>=2 && ctx && typeof ctx.spawnPickup==='function'){c["sack-of-penniesRooms"]=0;ctx.spawnPickup("coin",p.x,p.y,{})} } },
      unlock: null
    },

    {
      id: "robo-baby",
      num: 95,
      name: "Robo-Baby",
      desc: "Shoots lasers",
      info: "Shoots lasers · Deals 3.5 damage per shot",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "greed-treasure", "crane-game", "baby-shop"],
      tags: ["familiar", "baby", "offensive"],
      dlc: "rebirth",
      transform: "conjoined",
      familiars: ["robo-baby"],
      hooks: {
        // fires a thin laser in the direction Isaac shoots
        onUpdate: function (p, dt, ctx) {
          babyFire(p, dt, ctx, 'robo-baby', 'roboT', 0.5, function (pl, f, a, c) {
            c.spawnLaser({ x: f.x, y: f.y - 8, angle: a, len: 420, width: 6, life: 0.12, tick: 0.5, dmg: 3.5 })
            c.sfx('laser-fire')
          })
        }
      },
      unlock: null
    },

    {
      id: "little-c-h-a-d",
      num: 96,
      name: "Little C.H.A.D.",
      desc: "Spawns a half Red Heart every 3 rooms",
      info: "Spawns a half Red Heart every 3 rooms",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure", "ultra-secret", "baby-shop"],
      tags: ["defensive", "hearts"],
      dlc: "rebirth",
      hooks: { onRoomClear: function (p, room, ctx) { if (everyRooms(p, 'chad', 3)) drop(ctx, p, 'heart', { variant: 'half' }) } },
      unlock: null
    },

    {
      id: "the-book-of-sin",
      num: 97,
      name: "The Book of Sin",
      desc: "Spawns 1 random pickup",
      info: "Spawns 1 random pickup",
      kind: "active",
      quality: 2,
      pools: ["treasure", "devil", "library", "greed-treasure", "greed-devil"],
      tags: ["utility", "charge", "book"],
      dlc: "rebirth",
      transform: "bookworm",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          drop(ctx, p, ctx.pick(['coin', 'coin', 'coin', 'heart', 'heart', 'bomb', 'key', 'card', 'pill', 'battery']))
        }
      },
      unlock: null
    },

    {
      id: "the-relic",
      num: 98,
      name: "The Relic",
      desc: "Spawns 1 Soul Heart every 7-8 rooms",
      info: "Spawns 1 Soul Heart every 7-8 rooms",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "angel", "greed-treasure"],
      tags: ["defensive", "hearts"],
      dlc: "rebirth",
      hooks: {
        // every 7th or 8th room
        onRoomClear: function (p, room, ctx) {
          var c = cacheOf(p)
          c.relic = (c.relic || 0) + 1
          if (c.relic < (c.relicNeed || 7)) return
          c.relic = 0
          c.relicNeed = 7 + ctx.int(2)
          drop(ctx, p, 'soul')
        }
      },
      unlock: null
    },

    {
      id: "little-gish",
      num: 99,
      name: "Little Gish",
      desc: "Shoots slowing tears",
      info: "Shoots slowing tears · Deals 3.5 damage per tear",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "greed-treasure", "baby-shop"],
      tags: ["familiar", "baby", "offensive", "tears"],
      dlc: "rebirth",
      familiars: ["little-gish"],
      unlock: null
    },

    {
      id: "little-steven",
      num: 100,
      name: "Little Steven",
      desc: "Shoots homing tears",
      info: "Shoots homing tears · Deals 3.5 damage per tear",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "greed-treasure", "baby-shop"],
      tags: ["familiar", "baby", "offensive", "tears"],
      dlc: "rebirth",
      transform: "conjoined",
      familiars: ["little-steven"],
      unlock: null
    },

    {
      id: "the-halo",
      num: 101,
      name: "The Halo",
      desc: "↑ +1 Health",
      info: "↑ +1 Health · ↑ +0.3 Speed · ↑ +0.2 Tears · ↑ +0.3 Damage · ↑ +1.5 Range · Heals 1 heart",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "angel", "greed-treasure", "greed-boss"],
      tags: ["offensive", "tears", "defensive", "hearts"],
      dlc: "rebirth",
      stats: {"tears":0.2,"damage":0.3,"speed":0.3,"range":120},
      grant: {"maxHearts":2,"heal":2},
      transform: "seraphim",
      unlock: null
    },

    {
      id: "moms-bottle-of-pills",
      num: 102,
      name: "Mom's Bottle of Pills",
      desc: "Spawns 1 pill",
      info: "Spawns 1 pill",
      kind: "active",
      quality: 2,
      pools: ["treasure", "shop", "beggar", "demon-beggar", "moms-chest", "greed-treasure", "crane-game", "old-chest"],
      tags: ["utility", "charge"],
      dlc: "rebirth",
      transform: "mom",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          drop(ctx, p, 'pill')
        }
      },
      unlock: null
    },

    {
      id: "the-common-cold",
      num: 103,
      name: "The Common Cold",
      desc: "25% chance to shoot poison tears",
      info: "25% chance to shoot poison tears · 100% chance at 12 luck",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (ctx && ctx.roll(0.25, 0.0625, 1)) { tear.flags.add('poison'); tear.tint = '#8ec63f' }
        }
      },
      unlock: null
    },

    {
      id: "the-parasite",
      num: 104,
      name: "The Parasite",
      desc: "Tears split in two on contact",
      info: "Tears split in two on contact · Split tears deal half damage",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      // Tears split into two half-damage tears at +-90 degrees when they hit an enemy.,
      hooks: {
        onTearHit: function (p, tear, enemy, ctx) {
          if (!tear || tear.split || !ctx) return
          var sp = Math.sqrt(tear.vx * tear.vx + tear.vy * tear.vy) || 1
          var a = Math.atan2(tear.vy, tear.vx)
          for (var i = 0; i < 2; i++) {
            var q = a + (i ? Math.PI / 2 : -Math.PI / 2)
            var c = ctx.spawnTear({ x: tear.x, y: tear.y, vx: Math.cos(q) * sp * 0.8, vy: Math.sin(q) * sp * 0.8, dmg: tear.dmg * 0.5, r: (tear.r || 8) * 0.7, life: 0.45, flags: new Set(tear.flags) })
            if (c) c.split = true
          }
        }
      },
      unlock: null
    },

    {
      id: "the-d6",
      num: 105,
      name: "The D6",
      desc: "Rerolls pedestal items in the room",
      info: "Rerolls pedestal items in the room",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-shop", "crane-game", "ultra-secret"],
      tags: ["utility", "charge"],
      dlc: "rebirth",
      charge: 6,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.rerollPedestals !== 'function') return { fail: true }; ctx.rerollPedestals() } },
      unlock: null
    },

    {
      id: "mr-mega",
      num: 106,
      name: "Mr. Mega",
      desc: "↑ x1.85 Bomb damage",
      info: "↑ x1.85 Bomb damage · +5 Bombs",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure", "bomb-bum"],
      tags: ["offensive", "bombs"],
      dlc: "rebirth",
      grant: {"bombs":5},
      mult: {"bombDamage":1.85},
      unlock: null
    },

    {
      id: "the-pinking-shears",
      num: 107,
      name: "The Pinking Shears",
      desc: "Receive for the room:",
      info: "Receive for the room: · Flight · Isaac's body separates from his head and attacks enemies with 23.5 contact damage per second",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        // for the room Isaac flies and his body runs around biting enemies on its own
        onUse: function (p, ctx) {
          cacheOf(p).shears = true
          IS.recalcStats(p)
          if (ctx && ctx.room && !findFamiliar(p, 'pinking-body')) ctx.spawnFamiliar('pinking-body')
        },
        onStats: function (p, s) { if (p.cache && p.cache.shears) p.flags.add('flying') },
        onRoomEnter: function (p) {
          if (!p.cache || !p.cache.shears) return
          p.cache.shears = false
          IS.removeFamiliar(p, 'pinking-body')
          IS.recalcStats(p)
        }
      },
      unlock: null
    },

    {
      id: "the-wafer",
      num: 108,
      name: "The Wafer",
      desc: "Reduces most damage taken to half a heart",
      info: "Reduces most damage taken to half a heart",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "angel", "greed-treasure"],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "rebirth",
      hooks: {
        onPlayerDamage: function (p, n, src) {
          if (src === "sacrifice" || (src && (src.self || src.kind === "sacrifice"))) return n
          return n > 1 ? 1 : n
        }
      },
      unlock: null
    },

    {
      id: "money-power",
      num: 109,
      name: "Money = Power",
      desc: "↑ +0.04 Damage for every coin Isaac has",
      info: "↑ +0.04 Damage for every coin Isaac has",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "devil", "greed-devil", "ultra-secret"],
      tags: ["offensive", "coins"],
      dlc: "rebirth",
      hooks: {
        onStats: function (p, s) { s.damage += 0.04 * (p.coins || 0) },
        onUpdate: function (p) {
          if (!p.cache) return
          if (p.cache.mp !== p.coins) { p.cache.mp = p.coins; IS.recalcStats(p) }
        }
      },
      unlock: null
    },

    {
      id: "moms-contacts",
      num: 110,
      name: "Mom's Contacts",
      desc: "↑ +1.5 Range",
      info: "↑ +1.5 Range · 20% chance to shoot petrifying tears · 50% chance at 20 luck",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "moms-chest", "greed-treasure", "ultra-secret", "old-chest"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      stats: {"range":120},
      transform: "mom",
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (ctx && ctx.roll(0.2, 0.015, 0.5)) { tear.flags.add('petrify'); tear.tint = '#9a9a9a' }
        }
      },
      unlock: null
    },

    {
      id: "the-bean",
      num: 111,
      name: "The Bean",
      desc: "Deals 5 damage to enemies nearby and poisons them",
      info: "Deals 5 damage to enemies nearby and poisons them · The poison deals Isaac's damage 6 times",
      kind: "active",
      quality: 2,
      pools: ["treasure", "beggar", "greed-treasure"],
      tags: ["offensive", "utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          ctx.sfx('fart')
          IS.spawnPuddle({ x: p.x, y: p.y, r: 130, dmg: 0, life: 3, status: [['poison', 3]], colour: '#8ec63f' }, ctx)
          ctx.livingEnemies().forEach(function (e) {
            if (IS.dist(p.x, p.y, e.x, e.y) > 260) return
            IS.damageEnemy(e, 5, { silent: true }, ctx)
            IS.applyStatus(e, 'poison', 3, ctx)
            IS.knockback(e, p.x, p.y, e.boss ? 0 : 420)
          })
        }
      },
      unlock: null
    },

    {
      id: "guardian-angel",
      num: 112,
      name: "Guardian Angel",
      desc: "Orbital",
      info: "Orbital · Speeds up all other orbitals · Blocks projectiles · Deals 105 contact damage per second",
      kind: "passive",
      quality: 2,
      pools: ["angel", "greed-angel", "baby-shop"],
      tags: ["offensive"],
      dlc: "rebirth",
      transform: "conjoined",
      familiars: ["guardian-angel"],
      unlock: null
    },

    {
      id: "demon-baby",
      num: 113,
      name: "Demon Baby",
      desc: "Shoots enemies that get close to him",
      info: "Shoots enemies that get close to him · Deals 3 damage per tear",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "devil", "greed-devil", "baby-shop"],
      tags: ["familiar", "baby", "offensive", "tears"],
      dlc: "rebirth",
      transform: "conjoined",
      familiars: ["demon-baby"],
      unlock: null
    },

    {
      id: "moms-knife",
      num: 114,
      name: "Mom's Knife",
      desc: "Isaac's tears are replaced by a throwable knife",
      info: "Isaac's tears are replaced by a throwable knife · The knife deals 2x Isaac's damage while held and caps at 6x damage at 1/3 charge · Charging further only increases throwing range · Damage reduces to 2x when returning to Isaac",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "devil", "moms-chest", "greed-treasure", "greed-devil", "old-chest"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      transform: "mom",
      unlock: null
    },

    {
      id: "ouija-board",
      num: 115,
      name: "Ouija Board",
      desc: "↑ +0.5 Tears",
      info: "↑ +0.5 Tears · Spectral tears",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "devil", "greed-treasure", "greed-devil"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      tearFlags: ["spectral"],
      stats: {"tears":0.5},
      unlock: null
    },

    {
      id: "9-volt",
      num: 116,
      name: "9 Volt",
      desc: "Automatically charges the first bar of active items",
      info: "Automatically charges the first bar of active items · Fully recharges the active item on pickup",
      kind: "passive",
      quality: 2,
      pools: ["shop", "battery-bum", "greed-shop", "crane-game"],
      tags: ["utility"],
      dlc: "rebirth",
      hooks: {
        onInit: function (p) {
          if (!p.cache) p.cache = {}; if (p.cache["9-volt:init"]) return; p.cache["9-volt:init"] = true; for (var i = 0; i < 2; i++) { var a = p.active && p.active[i]; if (a) a.charge = a.maxCharge }
        },
        onRoomClear: function (p, room, ctx) {
          if (!ctx || !p.active) return
          for (var i = 0; i < 2; i++) if (p.active[i]) ctx.addCharge(1, i)
        }
      },
      unlock: null
    },

    {
      id: "dead-bird",
      num: 117,
      name: "Dead Bird",
      desc: "Taking damage spawns a bird that attacks enemies",
      info: "Taking damage spawns a bird that attacks enemies · The bird deals 4.3 contact damage per second",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "greed-treasure", "greed-devil", "baby-shop"],
      tags: ["familiar", "baby", "offensive"],
      dlc: "rebirth",
      hooks: {
        // a bird per hit, until Isaac leaves the room
        onPlayerHurt: function (p, n, src, ctx) { if (ctx && ctx.room) ctx.spawnFamiliar('dead-bird-bird') },
        onRoomEnter: function (p) { while (IS.removeFamiliar(p, 'dead-bird-bird')) { /* clear */ } }
      },
      unlock: null
    },

    {
      id: "brimstone",
      num: 118,
      name: "Brimstone",
      desc: "↓ x0.33 Fire rate multiplier",
      info: "↓ x0.33 Fire rate multiplier · Isaac's tears are replaced by a chargeable blood beam · It deals 9x Isaac's damage over 0.63 seconds",
      kind: "passive",
      quality: 2,
      pools: ["devil", "greed-devil", "ultra-secret"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      mult: {"tears":0.33},
      transform: "leviathan",
      unlock: null
    },

    {
      id: "blood-bag",
      num: 119,
      name: "Blood Bag",
      desc: "↑ +1 Health",
      info: "↑ +1 Health · ↑ +0.3 Speed · Heals 4 hearts",
      kind: "passive",
      quality: 2,
      pools: ["ultra-secret"],
      tags: ["defensive", "hearts"],
      dlc: "rebirth",
      stats: {"speed":0.3},
      grant: {"maxHearts":2,"heal":8},
      unlock: null
    },

    {
      id: "odd-mushroom-thin",
      num: 120,
      name: "Odd Mushroom (Thin)",
      desc: "↑ +0.3 Speed",
      info: "↑ +0.3 Speed · ↑ +1.7 Tears · ↓ x0.9 Damage multiplier · ↓ -0.4 Damage",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "secret", "greed-treasure", "greed-boss", "greed-secret"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      stats: {"tears":1.7,"damage":-0.4,"speed":0.3},
      mult: {"damage":0.9},
      transform: "fun-guy",
      unlock: null
    },

    {
      id: "odd-mushroom-large",
      num: 121,
      name: "Odd Mushroom (Large)",
      desc: "↑ +1 Health",
      info: "↑ +1 Health · ↑ +1 Damage · ↑ +1.5 Range · ↓ -0.2 Speed",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "secret", "greed-secret"],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "rebirth",
      stats: {"damage":1,"speed":-0.2,"range":120},
      grant: {"maxHearts":2,"heal":2},
      transform: "fun-guy",
      unlock: null
    },

    {
      id: "whore-of-babylon",
      num: 122,
      name: "Whore of Babylon",
      desc: "When on half a Red Heart or less:",
      info: "When on half a Red Heart or less: · ↑ +0.3 Speed · ↑ +1.5 Damage",
      kind: "passive",
      quality: 2,
      pools: ["devil", "demon-beggar", "greed-devil", "ultra-secret"],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "rebirth",
      hooks: {
        onStats: function (p, s) { if (p.hearts && p.hearts.red <= 1) { s.damage += 1.5; s.speed += 0.3 } },
        onUpdate: function (p) {
          var c = cacheOf(p)
          var low = p.hearts.red <= 1
          if (c.whore !== low) { c.whore = low; IS.recalcStats(p) }
        }
      },
      unlock: null
    },

    {
      id: "monster-manual",
      num: 123,
      name: "Monster Manual",
      desc: "Spawns a random familiar for the floor",
      info: "Spawns a random familiar for the floor",
      kind: "active",
      quality: 2,
      pools: ["treasure", "devil", "library", "greed-devil"],
      tags: ["utility", "charge"],
      dlc: "rebirth",
      transform: "bookworm",
      charge: 4,
      chargeType: "normal",
      hooks: {
        // a random baby for the rest of the floor
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          var ids = []
          IS.items.forEach(function (d) { if (d.kind === 'familiar' && d.familiars && d.familiars.length) ids.push(d.familiars[0]) })
          var f = ctx.spawnFamiliar(ctx.pick(ids))
          if (!f) return { fail: true }
          f.floorOnly = true
        },
        onNewFloor: function (p) { p.familiars = (p.familiars || []).filter(function (f) { return !f.floorOnly }) }
      },
      unlock: null
    },

    {
      id: "dead-sea-scrolls",
      num: 124,
      name: "Dead Sea Scrolls",
      desc: "Triggers a random active item effect",
      info: "Triggers a random active item effect · Chooses the effect from a fixed list of items",
      kind: "active",
      quality: 2,
      pools: ["treasure", "angel", "greed-treasure"],
      tags: ["utility", "charge"],
      dlc: "rebirth",
      charge: 2,
      chargeType: "normal",
      hooks: {
        // a random effect out of a fixed list of actives
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          var pool = []
          ;['the-d6', 'the-bean', 'the-gamekid', 'the-candle', 'razor-blade', 'crack-the-sky', 'spider-butt', 'dads-key', 'the-book-of-sin', 'monster-manual', 'guppys-head', 'crystal-ball', 'd20', 'iv-bag'].forEach(function (id) {
            var d = IS.itemsById[id]
            if (d && d.hooks && d.hooks.onUse) pool.push(d)
          })
          while (pool.length) {
            var i = ctx.int(pool.length)
            var d = pool.splice(i, 1)[0]
            var r = d.hooks.onUse(p, ctx) || {}
            if (!r.fail) return {}
          }
          return { fail: true }
        }
      },
      unlock: null
    },

    {
      id: "bobby-bomb",
      num: 125,
      name: "Bobby-Bomb",
      desc: "+5 Bombs",
      info: "+5 Bombs · Homing bombs",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure", "bomb-bum"],
      tags: ["bombs"],
      dlc: "rebirth",
      grant: {"bombs":5},
      hooks: {
        // Isaac's bombs crawl towards the nearest enemy
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          var bombs = ctx.room.bombs || []
          for (var i = 0; i < bombs.length; i++) {
            var b = bombs[i]
            if (b.dead || b.friendly === false) continue
            var e = ctx.nearestEnemy(b.x, b.y)
            if (!e || IS.dist(b.x, b.y, e.x, e.y) > 520) continue
            var n = IS.norm(e.x - b.x, e.y - b.y)
            b.vx = (b.vx || 0) + n.x * 600 * dt
            b.vy = (b.vy || 0) + n.y * 600 * dt
          }
        }
      },
      unlock: null
    },

    {
      id: "razor-blade",
      num: 126,
      name: "Razor Blade",
      desc: "↑ +1.2 Damage for the room",
      info: "↑ +1.2 Damage for the room · Deals 1 heart of damage to Isaac · After the first use in a room, deals half a heart instead · Removes Red Hearts first",
      kind: "active",
      quality: 2,
      pools: ["devil", "demon-beggar"],
      tags: ["offensive", "defensive", "hearts", "utility", "charge"],
      dlc: "rebirth",
      charge: 2,
      chargeType: "normal",
      hooks: {
        // 1 heart the first time in a room, half a heart after that
        onUse: function (p, ctx) {
          var c = cacheOf(p)
          selfHurt(p, c.razorRoom ? 1 : 2, ctx, 'Razor Blade')
          c.razorRoom = true
          c.razorUps = (c.razorUps || 0) + 1
          IS.recalcStats(p)
        },
        onStats: function (p, s) { s.damage += 1.2 * ((p.cache && p.cache.razorUps) || 0) },
        onRoomEnter: function (p) {
          var c = p.cache
          if (!c || !(c.razorUps || c.razorRoom)) return
          c.razorUps = 0
          c.razorRoom = false
          IS.recalcStats(p)
        }
      },
      unlock: null
    },

    {
      id: "forget-me-now",
      num: 127,
      name: "Forget Me Now",
      desc: "Rerolls and restarts the entire floor",
      info: "Rerolls and restarts the entire floor",
      kind: "active",
      quality: 2,
      pools: ["treasure", "devil", "secret", "demon-beggar", "greed-secret"],
      tags: ["utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        // same depth, brand new layout
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room || !ctx.floor || !ctx.floor.id) return { fail: true }
          return ctx.teleport(ctx.floor.id) ? {} : { fail: true }
        }
      },
      unlock: null
    },

    {
      id: "forever-alone",
      num: 128,
      name: "Forever Alone",
      desc: "Long range fly orbital",
      info: "Long range fly orbital · Deals 30 contact damage per second",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "key-master", "greed-treasure", "baby-shop"],
      tags: ["offensive"],
      dlc: "rebirth",
      familiars: ["forever-alone"],
      unlock: null
    },

    {
      id: "bucket-of-lard",
      num: 129,
      name: "Bucket of Lard",
      desc: "↑ +2 Health",
      info: "↑ +2 Health · ↓ -0.2 Speed",
      kind: "passive",
      quality: 2,
      pools: ["treasure"],
      tags: ["defensive", "hearts"],
      dlc: "rebirth",
      stats: {"speed":-0.2},
      grant: {"maxHearts":4,"heal":4},
      unlock: null
    },

    {
      id: "a-pony",
      num: 130,
      name: "A Pony",
      desc: "While held:",
      info: "While held: · Sets your Speed to at least 1.5 · Flight · Upon use, dashes in the direction of Isaac's movement",
      kind: "active",
      quality: 2,
      pools: [],
      tags: ["utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onStats: function (p, s) { if (s.speed < 1.5) s.speed = 1.5 },
        onUse: function (p) { startDash(p, 0.45) },
        onUpdate: function (p, dt, ctx) { updateDash(p, dt, ctx) }
      },
      flags: ["flying"],
      unlock: null
    },

    {
      id: "bomb-bag",
      num: 131,
      name: "Bomb Bag",
      desc: "Spawns 1 bomb pickup every 3 rooms",
      info: "Spawns 1 bomb pickup every 3 rooms",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["bombs"],
      dlc: "rebirth",
      hooks: { onRoomClear: function (p, room, ctx) { if (everyRooms(p, 'bombBag', 3)) drop(ctx, p, 'bomb') } },
      unlock: null
    },

    {
      id: "a-lump-of-coal",
      num: 132,
      name: "A Lump of Coal",
      desc: "Tears deal more damage the further they travel",
      info: "Tears deal more damage the further they travel",
      kind: "passive",
      quality: 2,
      pools: ["greed-treasure", "greed-boss", "greed-devil"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      tearFlags: ["lump"],
      unlock: null
    },

    {
      id: "guppys-paw",
      num: 133,
      name: "Guppy's Paw",
      desc: "Converts 1 heart container into 3 Soul Hearts",
      info: "Converts 1 heart container into 3 Soul Hearts",
      kind: "active",
      quality: 2,
      pools: ["devil", "red-chest", "curse", "greed-curse", "greed-devil"],
      tags: ["defensive", "hearts", "utility", "charge"],
      dlc: "rebirth",
      transform: "guppy",
      charge: 4,
      chargeType: "normal",
      hooks: {
        // one heart container becomes 3 soul hearts
        onUse: function (p) {
          if (!p.hearts || p.hearts.maxRed < 2) return { fail: true }
          IS.addMaxHearts(p, -2)
          IS.addSoulHearts(p, 6)
        }
      },
      unlock: null
    },

    {
      id: "guppys-tail",
      num: 134,
      name: "Guppy's Tail",
      desc: "33% chance to replace the room clear reward with a chest",
      info: "33% chance to replace the room clear reward with a chest · 22% chance to spawn no room clear reward",
      kind: "passive",
      quality: 2,
      pools: ["devil", "red-chest", "curse", "greed-curse", "greed-devil"],
      tags: ["utility"],
      dlc: "rebirth",
      transform: "guppy",
      // APPROXIMATE: the clear reward spawns right after onRoomClear, so the 22% "no reward" case
      // removes pickups that appear in the next frame instead of preventing them.,
      hooks: {
        onRoomClear: function (p, room, ctx) {
          if (!ctx || !ctx.room) return
          if (!p.cache) p.cache = {}
          if (ctx.chance(0.33)) ctx.spawnPickup("chest", ctx.room.pxW / 2, ctx.room.pxH / 2)
          if (ctx.chance(0.22)) p.cache.tailSnap = (ctx.room.pickups || []).slice()
        },
        onUpdate: function (p, dt, ctx) {
          if (!p.cache || !p.cache.tailSnap || !ctx || !ctx.room) return
          var snap = p.cache.tailSnap
          p.cache.tailSnap = null
          var list = ctx.room.pickups || []
          for (var i = 0; i < list.length; i++) {
            var u = list[i]
            if (snap.indexOf(u) < 0 && !u.shop && !u.price && u.kind !== "item" && !u.dead) u.dead = true
          }
        }
      },
      unlock: null
    },

    {
      id: "iv-bag",
      num: 135,
      name: "IV Bag",
      desc: "Hurts Isaac for half a heart and spawns 1-2 coins",
      info: "Hurts Isaac for half a heart and spawns 1-2 coins · Removes Red Hearts first",
      kind: "active",
      quality: 2,
      pools: ["ultra-secret"],
      tags: ["defensive", "hearts", "coins", "utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          selfHurt(p, 1, ctx, 'IV Bag')
          var n = 1 + ctx.int(2)
          for (var i = 0; i < n; i++) drop(ctx, p, 'coin')
        }
      },
      unlock: null
    },

    {
      id: "best-friend",
      num: 136,
      name: "Best Friend",
      desc: "Spawns a decoy Isaac that attracts enemies and explodes after 5 seconds",
      info: "Spawns a decoy Isaac that attracts enemies and explodes after 5 seconds",
      kind: "active",
      quality: 2,
      pools: ["treasure", "crane-game"],
      tags: ["utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          while (IS.removeFamiliar(p, 'best-friend')) { /* one decoy at a time */ }
          if (!ctx.spawnFamiliar('best-friend')) return { fail: true }
        },
        onRoomEnter: function (p) { while (IS.removeFamiliar(p, 'best-friend')) { /* clear */ } }
      },
      unlock: null
    },

    {
      id: "remote-detonator",
      num: 137,
      name: "Remote Detonator",
      desc: "+5 Bombs",
      info: "+5 Bombs · Isaac's bombs no longer explode automatically · Upon use, detonates all of Isaac's bombs at once",
      kind: "active",
      quality: 2,
      pools: ["treasure", "shop", "greed-treasure", "crane-game", "ultra-secret", "bomb-bum"],
      tags: ["bombs", "utility", "charge"],
      dlc: "rebirth",
      grant: {"bombs":5},
      charge: 2,
      chargeType: "normal",
      hooks: {
        // bombs sit where they fall until the item is used
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          var bombs = ctx.room.bombs || []
          for (var i = 0; i < bombs.length; i++) {
            var b = bombs[i]
            if (b.dead || b.friendly === false || b.detonated) continue
            b.remote = true
            b.fuse = 99
          }
        },
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          var bombs = ctx.room.bombs || []
          for (var i = 0; i < bombs.length; i++) if (bombs[i].remote && !bombs[i].dead) { bombs[i].detonated = true; bombs[i].fuse = 0 }
        }
      },
      unlock: null
    },

    {
      id: "stigmata",
      num: 138,
      name: "Stigmata",
      desc: "↑ +1 Health",
      info: "↑ +1 Health · ↑ +0.3 Damage · Heals 1 heart",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure", "greed-angel", "wooden-chest"],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "rebirth",
      stats: {"damage":0.3},
      grant: {"maxHearts":2,"heal":2},
      unlock: null
    },

    {
      id: "moms-purse",
      num: 139,
      name: "Mom's Purse",
      desc: "Spawns 1 random trinket",
      info: "Spawns 1 random trinket · Isaac can hold 2 trinkets",
      kind: "passive",
      quality: 2,
      pools: ["shop", "moms-chest", "greed-shop", "old-chest"],
      tags: ["utility"],
      dlc: "rebirth",
      transform: "mom",
      hooks: {
        onInit: function (p, ctx) {
          if (!ctx || !ctx.room) return
          if (!p.cache) p.cache = {}; if (p.cache["moms-purse:init"]) return; p.cache["moms-purse:init"] = true; ctx.spawnPickup("trinket", p.x + 50, p.y, { id: ctx.rollTrinket() })
        }
      },
      unlock: null
    },

    {
      id: "bobs-curse",
      num: 140,
      name: "Bob's Curse",
      desc: "+5 Bombs",
      info: "+5 Bombs · Isaac's bombs create a cloud of poison · Poison immunity",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "red-chest", "greed-treasure", "bomb-bum", "rotten-beggar"],
      tags: ["bombs"],
      dlc: "rebirth",
      grant: {"bombs":5},
      transform: "bob",
      hooks: {
        onBombExplode: function (p, bomb, ctx) {
          if (!ctx || !ctx.room || !bomb || bomb.friendly === false) return
          IS.spawnPuddle({ x: bomb.x, y: bomb.y, r: 110, dmg: 0, life: 4, status: [['poison', 3]], colour: '#8ec63f' }, ctx)
        }
      },
      unlock: null
    },

    {
      id: "pageant-boy",
      num: 141,
      name: "Pageant Boy",
      desc: "Spawns 7 random coins",
      info: "Spawns 7 random coins",
      kind: "passive",
      quality: 2,
      pools: ["boss"],
      tags: ["coins"],
      dlc: "rebirth",
      hooks: {
        onInit: function (p, ctx) {
          if (!ctx || !ctx.room) return
          if (!p.cache) p.cache = {}; if (p.cache["pageant-boy:init"]) return; p.cache["pageant-boy:init"] = true; for (var i = 0; i < 7; i++) { var a = i * Math.PI * 2 / 7; ctx.spawnPickup("coin", p.x + Math.cos(a) * 70, p.y + Math.sin(a) * 70) }
        }
      },
      unlock: null
    },

    {
      id: "scapular",
      num: 142,
      name: "Scapular",
      desc: "Isaac gains 1 Soul Heart when damaged down to half a heart",
      info: "Isaac gains 1 Soul Heart when damaged down to half a heart · Can only happen once per room · Exiting and re-entering the room allows the effect to trigger again · Doesn't trigger from health donations",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "angel", "greed-treasure"],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "rebirth",
      hooks: {
        onPlayerHurt: function (p, n, src, ctx) {
          if (!p.cache || p.cache.scapular) return
          var h = p.hearts
          if (h.red + h.soul + h.black + (h.bone || 0) !== 1) return
          p.cache.scapular = true
          IS.addSoulHearts(p, 2)
        },
        onRoomEnter: function (p) { if (p.cache) p.cache.scapular = false }
      },
      unlock: null
    },

    {
      id: "speed-ball",
      num: 143,
      name: "Speed Ball",
      desc: "↑ +0.3 Speed",
      info: "↑ +0.3 Speed · ↑ +0.2 Shot speed",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "boss", "demon-beggar", "greed-boss"],
      tags: ["offensive"],
      dlc: "rebirth",
      stats: {"shotSpeed":0.2,"speed":0.3},
      transform: "spun",
      unlock: null
    },

    {
      id: "bum-friend",
      num: 144,
      name: "Bum Friend",
      desc: "Picks up nearby coins",
      info: "Picks up nearby coins · Spawns random pickups every 3-4 coins",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "beggar", "baby-shop"],
      tags: ["coins"],
      dlc: "rebirth",
      familiars: ["bum-friend"],
      unlock: null
    },

    {
      id: "guppys-head",
      num: 145,
      name: "Guppy's Head",
      desc: "Spawns 2-4 blue flies",
      info: "Spawns 2-4 blue flies",
      kind: "active",
      quality: 2,
      pools: ["devil", "red-chest", "curse", "greed-curse", "greed-devil"],
      tags: ["utility", "charge"],
      dlc: "rebirth",
      transform: "guppy",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          var n = 2 + ctx.int(3)
          for (var i = 0; i < n; i++) ctx.spawnFamiliar('blue-fly')
        }
      },
      unlock: null
    },

    {
      id: "prayer-card",
      num: 146,
      name: "Prayer Card",
      desc: "+1 Eternal Heart",
      info: "+1 Eternal Heart",
      kind: "active",
      quality: 2,
      pools: ["treasure", "angel", "greed-treasure"],
      tags: ["defensive", "hearts", "utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          p.hearts.eternal = (p.hearts.eternal || 0) + 1
          if (ctx && ctx.sfx) ctx.sfx('heart-pickup')
        }
      },
      unlock: null
    },

    {
      id: "notched-axe",
      num: 147,
      name: "Notched Axe",
      desc: "Using the item makes Isaac hold the axe",
      info: "Using the item makes Isaac hold the axe · Holding the axe allows Isaac to break rocks, secret room entrances and damage enemies · Landing a hit with the axe reduces its charge · Entering a new floor fully recharges the axe",
      kind: "active",
      quality: 2,
      pools: ["shop", "crane-game"],
      tags: ["offensive", "utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          var h = p.head || { x: 1, y: 0 }
          var cx = p.x + h.x * 70
          var cy = p.y + h.y * 70
          ctx.sfx('knife-throw')
          ctx.livingEnemies().forEach(function (e) {
            if (IS.dist(cx, cy, e.x, e.y) < 150 + e.r) {
              IS.damageEnemy(e, p.stats.damage * 3, { silent: true }, ctx)
              IS.knockback(e, p.x, p.y, e.boss ? 0 : 380)
            }
          })
          ctx.gridObjects().slice().forEach(function (g) {
            if (g && g.destructible && !g.bombOnly && !g.broken && IS.dist(cx, cy, g.x, g.y) < 150) ctx.destroyGrid(g)
          })
        },
        // entering a new floor fully recharges the axe
        onNewFloor: function (p) {
          for (var i = 0; i < 2; i++) { var a = p.active && p.active[i]; if (a && a.id === 'notched-axe') a.charge = a.maxCharge }
        }
      },
      unlock: null
    },

    {
      id: "infestation",
      num: 148,
      name: "Infestation",
      desc: "Taking damage spawns 2-6 blue flies",
      info: "Taking damage spawns 2-6 blue flies",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive"],
      dlc: "rebirth",
      hooks: {
        onPlayerHurt: function (p, n, src, ctx) {
          if (!ctx || !ctx.room) return
          var k = 2 + ctx.int(5)
          for (var i = 0; i < k; i++) ctx.spawnFamiliar("blue-fly")
        }
      },
      unlock: null
    },

    {
      id: "ipecac",
      num: 149,
      name: "Ipecac",
      desc: "↑ +40 Damage",
      info: "↑ +40 Damage · ↓ x0.33 Fire rate multiplier · ↓ x0.8 Range multiplier · ↓ x0.8 Shot speed multiplier · Isaac's tears are fired in an arc · The tears explode and poison enemies where they land",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      stats: {"damage":40},
      mult: {"tears":0.33,"range":0.8,"shotSpeed":0.8},
      transform: "bob",
      tearFlags: ["poison"],
      unlock: null
    },

    {
      id: "tough-love",
      num: 150,
      name: "Tough Love",
      desc: "10% chance to shoot teeth that deal 3.2x Isaac's damage",
      info: "10% chance to shoot teeth that deal 3.2x Isaac's damage · 100% chance at 9 luck",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive"],
      dlc: "rebirth",
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (!ctx || !ctx.roll(0.1, 0.1, 1)) return
          tear.dmg *= 3.2
          tear.tint = "#f4eed8"
        }
      },
      unlock: null
    },

    {
      id: "the-mulligan",
      num: 151,
      name: "The Mulligan",
      desc: "Tears have a 1/6 chance to spawn a blue fly when hitting an enemy",
      info: "Tears have a 1/6 chance to spawn a blue fly when hitting an enemy",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      hooks: {
        onTearHit: function (p, tear, enemy, ctx) {
          if (!ctx || !ctx.room || p.familiars.length > 40) return
          if (ctx.chance(1 / 6)) ctx.spawnFamiliar("blue-fly")
        }
      },
      unlock: null
    },

    {
      id: "technology-2",
      num: 152,
      name: "Technology 2",
      desc: "↓ x0.67 Fire rate multiplier",
      info: "↓ x0.67 Fire rate multiplier · Replaces Isaac's right eye tears with a continuous laser · The laser deals 2x Isaac's damage per second",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure", "crane-game"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      mult: {"tears":0.66},
      unlock: null
    },

    {
      id: "mutant-spider",
      num: 153,
      name: "Mutant Spider",
      desc: "↓ x0.42 Fire rate multiplier",
      info: "↓ x0.42 Fire rate multiplier · Isaac shoots 4 tears at once",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure", "crane-game"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      mult: {"tears":0.42},
      transform: "spider",
      stats: {"multishot":3},
      unlock: null
    },

    {
      id: "chemical-peel",
      num: 154,
      name: "Chemical Peel",
      desc: "↑ +2 Damage for the left eye",
      info: "↑ +2 Damage for the left eye",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive"],
      dlc: "rebirth",
      // Engine flips p.eye each shot; negative is treated as the left eye.,
      hooks: {
        onTearFire: function (p, tear) { if (p.eye < 0) tear.dmg += 2 }
      },
      unlock: null
    },

    {
      id: "the-peeper",
      num: 155,
      name: "The Peeper",
      desc: "↑ x1.35 Damage multiplier for the left eye",
      info: "↑ x1.35 Damage multiplier for the left eye · Floats around the room · Deals 17.1 contact damage per second",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "greed-treasure", "baby-shop"],
      tags: ["familiar", "baby", "offensive"],
      dlc: "rebirth",
      familiars: ["the-peeper"],
      hooks: { onTearFire: function (p, tear) { if (p.eye < 0) tear.dmg *= 1.35 } },
      unlock: null
    },

    {
      id: "habit",
      num: 156,
      name: "Habit",
      desc: "Taking damage adds 1 charge to the active item",
      info: "Taking damage adds 1 charge to the active item",
      kind: "passive",
      quality: 2,
      pools: ["shop", "angel", "greed-shop"],
      tags: ["offensive"],
      dlc: "rebirth",
      hooks: {
        onPlayerHurt: function (p, n, src, ctx) { if (ctx) ctx.addCharge(1) }
      },
      unlock: null
    },

    {
      id: "bloody-lust",
      num: 157,
      name: "Bloody Lust",
      desc: "↑ Taking damage grants a damage up",
      info: "↑ Taking damage grants a damage up · Applies up to 6 times per floor · Lasts for the whole floor",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "devil", "greed-treasure", "greed-devil", "ultra-secret"],
      tags: ["offensive"],
      dlc: "rebirth",
      hooks: {
        onPlayerHurt: function (p) {
          if (!p.cache) return
          if ((p.cache.bl || 0) >= 6) return
          p.cache.bl = (p.cache.bl || 0) + 1
          IS.recalcStats(p)
        },
        onStats: function (p, s) { s.damage += 0.5 * ((p.cache && p.cache.bl) || 0) },
        onNewFloor: function (p) { if (p.cache && p.cache.bl) { p.cache.bl = 0; IS.recalcStats(p) } }
      },
      unlock: null
    },

    {
      id: "crystal-ball",
      num: 158,
      name: "Crystal Ball",
      desc: "Spawns a Soul Heart, rune or card",
      info: "Spawns a Soul Heart, rune or card · Full mapping effect for the floor (except Super/Ultra Secret Room) · While held: · +15% Planetarium chance · +100% if a Treasure Room was skipped",
      kind: "active",
      quality: 2,
      pools: [],
      tags: ["defensive", "hearts", "utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          drop(ctx, p, ctx.pick(['soul', 'card', 'rune']))
          var rooms = (ctx.floor && ctx.floor.rooms) || []
          for (var i = 0; i < rooms.length; i++) {
            var r = rooms[i]
            if (r && r.type !== 'super-secret' && r.type !== 'ultra-secret') r.mapKnown = true
          }
        }
      },
      unlock: null
    },

    {
      id: "spirit-of-the-night",
      num: 159,
      name: "Spirit of the Night",
      desc: "Spectral tears",
      info: "Spectral tears · Flight",
      kind: "passive",
      quality: 2,
      pools: ["devil", "demon-beggar", "greed-devil", "ultra-secret"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      transform: "leviathan",
      tearFlags: ["spectral"],
      flags: ["flying"],
      unlock: null
    },

    {
      id: "crack-the-sky",
      num: 160,
      name: "Crack the Sky",
      desc: "Spawns 5 beams of light near enemies",
      info: "Spawns 5 beams of light near enemies · Each beam deals 8x Isaac's damage + 160 over 0.8 seconds",
      kind: "active",
      quality: 2,
      pools: ["treasure"],
      tags: ["offensive", "utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        // 5 beams of light land on enemies, 8x damage + 160 over 0.8 s
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          var enemies = ctx.livingEnemies()
          var tick = (8 * p.stats.damage + 160) / 2
          for (var i = 0; i < 5; i++) {
            var t = enemies.length ? ctx.pick(enemies) : ctx.freeFloorPos()
            IS.spawnPuddle({ x: t.x, y: t.y, r: 70, dmg: tick, life: 0.8, colour: '#fff3b0' }, ctx)
          }
          ctx.sfx('holy-shield')
        }
      },
      unlock: null
    },

    {
      id: "ankh",
      num: 161,
      name: "Ankh",
      desc: "Respawn as ??? (Blue Baby) on death",
      info: "Respawn as ??? (Blue Baby) on death",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["utility"],
      dlc: "rebirth",
      hooks: {
        onPlayerDeath: function (p, ctx) {
          if (!p.cache) p.cache = {}
          var used = p.cache.ankhUsed || 0
          if (used >= Math.max(1, IS.itemCount(p, "ankh"))) return undefined
          p.cache.ankhUsed = used + 1
          var h = p.hearts
          h.maxRed = 0; h.red = 0; h.black = 0; h.bone = 0; h.rotten = 0; h.gold = 0; h.eternal = 0
          h.soul = 6
          return { revive: true }
        }
      },
      unlock: null
    },

    {
      id: "celtic-cross",
      num: 162,
      name: "Celtic Cross",
      desc: "Taking damage has a 20% chance to make Isaac temporarily invincible",
      info: "Taking damage has a 20% chance to make Isaac temporarily invincible · 100% chance at 27 luck",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "angel", "greed-treasure", "greed-angel"],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "rebirth",
      transform: "seraphim",
      hooks: {
        onPlayerHurt: function (p, n, src, ctx) {
          if (!ctx || !ctx.roll(0.2, 0.03, 1)) return
          if (!p.status) p.status = {}
          p.status.invincible = 3
        }
      },
      unlock: null
    },

    {
      id: "ghost-baby",
      num: 163,
      name: "Ghost Baby",
      desc: "Shoots spectral tears",
      info: "Shoots spectral tears · Deals 3.5 damage per tear",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "devil", "greed-treasure", "baby-shop"],
      tags: ["familiar", "baby", "offensive", "tears"],
      dlc: "rebirth",
      transform: "conjoined",
      familiars: ["ghost-baby"],
      unlock: null
    },

    {
      id: "the-candle",
      num: 164,
      name: "The Candle",
      desc: "Throws a blue flame",
      info: "Throws a blue flame · It deals contact damage, blocks enemy tears, and despawns after 2 seconds",
      kind: "active",
      quality: 2,
      pools: ["shop"],
      tags: ["offensive", "tears", "utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          var h = p.head || { x: 1, y: 0 }
          IS.spawnPuddle({ x: p.x + h.x * 160, y: p.y + h.y * 160, r: 40, dmg: Math.max(2, p.stats.damage), life: 2, status: [['burn', 2]], colour: '#6ab0ff' }, ctx)
        }
      },
      unlock: null
    },

    {
      id: "cat-o-nine-tails",
      num: 165,
      name: "Cat-o-nine-tails",
      desc: "↑ +1 Damage",
      info: "↑ +1 Damage · ↑ +0.23 Shot speed",
      kind: "passive",
      quality: 2,
      pools: ["boss"],
      tags: ["offensive"],
      dlc: "rebirth",
      stats: {"damage":1,"shotSpeed":0.23},
      unlock: null
    },

    {
      id: "d20",
      num: 166,
      name: "D20",
      desc: "Rerolls all pickups in the room",
      info: "Rerolls all pickups in the room",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-shop", "crane-game", "ultra-secret"],
      tags: ["utility", "charge"],
      dlc: "rebirth",
      charge: 6,
      chargeType: "normal",
      hooks: {
        // every loose pickup turns into a different random one
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          var kinds = ['coin', 'key', 'bomb', 'heart', 'soul', 'black', 'card', 'pill', 'rune', 'battery']
          var old = ctx.pickups().filter(function (u) { return !u.dead && !u.taken && !u.price && !u.shop && kinds.indexOf(u.kind) >= 0 })
          old.forEach(function (u) {
            u.dead = true
            ctx.spawnPickup(ctx.pick(['coin', 'coin', 'heart', 'heart', 'bomb', 'key', 'card', 'pill', 'battery']), u.x, u.y, { toss: true })
          })
        }
      },
      unlock: null
    },

    {
      id: "harlequin-baby",
      num: 167,
      name: "Harlequin Baby",
      desc: "Shoots two tears in a V-shaped pattern",
      info: "Shoots two tears in a V-shaped pattern · Deals 4 damage per tear",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "greed-treasure", "ultra-secret", "baby-shop"],
      tags: ["familiar", "baby", "offensive", "tears"],
      dlc: "rebirth",
      transform: "conjoined",
      familiars: ["harlequin-baby"],
      hooks: {
        // two tears in a V
        onUpdate: function (p, dt, ctx) {
          babyFire(p, dt, ctx, 'harlequin-baby', 'harlequinT', 0.75, function (pl, f, a, c) {
            babyTear(c, f, a - 0.2, 4)
            babyTear(c, f, a + 0.2, 4)
          })
        }
      },
      unlock: null
    },

    {
      id: "epic-fetus",
      num: 168,
      name: "Epic Fetus",
      desc: "Instead of shooting tears, aim a crosshair",
      info: "Instead of shooting tears, aim a crosshair · A missile lands on the crosshair after 1.5 seconds · Missiles deal 20x Isaac's damage",
      kind: "passive",
      quality: 2,
      pools: ["secret", "greed-secret"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      unlock: null
    },

    {
      id: "polyphemus",
      num: 169,
      name: "Polyphemus",
      desc: "↑ +4 Damage",
      info: "↑ +4 Damage · ↑ x2 Damage multiplier · ↓ x0.42 Fire rate multiplier · Tears pierce killed enemies if there is leftover damage",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      stats: {"damage":4},
      mult: {"tears":0.42,"damage":2},
      unlock: null
    },

    {
      id: "daddy-longlegs",
      num: 170,
      name: "Daddy Longlegs",
      desc: "Stomps on a nearby enemy every 4 seconds",
      info: "Stomps on a nearby enemy every 4 seconds · Deals 40 damage per second",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "greed-treasure", "baby-shop"],
      tags: ["familiar", "baby", "offensive"],
      dlc: "rebirth",
      transform: "spider",
      familiars: ["daddy-longlegs"],
      hooks: {
        // stomps the nearest enemy every 4 seconds
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          var c = cacheOf(p)
          c.dll = (c.dll == null ? 4 : c.dll) - dt
          if (c.dll > 0) return
          var e = ctx.nearestEnemy(p.x, p.y)
          if (!e || IS.dist(p.x, p.y, e.x, e.y) > 420) { c.dll = 0.4; return }
          c.dll = 4
          IS.damageEnemy(e, 40, { silent: true }, ctx)
          ctx.sfx('stomp')
          var f = findFamiliar(p, 'daddy-longlegs')
          if (f) { f.x = e.x; f.y = e.y }
        }
      },
      unlock: null
    },

    {
      id: "spider-butt",
      num: 171,
      name: "Spider Butt",
      desc: "Slows down enemies for 4 seconds",
      info: "Slows down enemies for 4 seconds · Deals 10 damage to all enemies · Enemies killed by the item spawn blue spiders",
      kind: "active",
      quality: 2,
      pools: ["treasure"],
      tags: ["offensive", "utility", "charge"],
      dlc: "rebirth",
      transform: "spider",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          ctx.livingEnemies().slice().forEach(function (e) {
            IS.applyStatus(e, 'slow', 4, ctx)
            IS.damageEnemy(e, 10, { silent: true }, ctx)
            if (e.dead || e.hp <= 0) ctx.spawnFamiliar('blue-spider')
          })
        }
      },
      unlock: null
    },

    {
      id: "sacrificial-dagger",
      num: 172,
      name: "Sacrificial Dagger",
      desc: "Orbital",
      info: "Orbital · Blocks enemy shots · Deals 112.5 contact damage per second",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "devil", "greed-treasure", "greed-devil", "baby-shop"],
      tags: ["offensive"],
      dlc: "rebirth",
      familiars: ["sacrificial-dagger"],
      unlock: null
    },

    {
      id: "mitre",
      num: 173,
      name: "Mitre",
      desc: "33% chance that Red Hearts spawn as Soul Hearts instead",
      info: "33% chance that Red Hearts spawn as Soul Hearts instead",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "angel"],
      tags: ["defensive", "hearts"],
      dlc: "rebirth",
      transform: "seraphim",
      hooks: {
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room || !p.cache) return
          p.cache.mitreT = (p.cache.mitreT || 0) + dt
          if (p.cache.mitreT < 0.2) return
          p.cache.mitreT = 0
          var list = ctx.pickups()
          for (var i = 0; i < list.length; i++) {
            var u = list[i]
            if (u.kind !== "heart" || u.mitre || u.dead || u.taken || u.shop || u.price) continue
            u.mitre = true
            if (ctx.chance(0.33)) { u.kind = "soul"; u.variant = "soul"; u.amount = 2; u.heart = true }
          }
        }
      },
      unlock: null
    },

    {
      id: "rainbow-baby",
      num: 174,
      name: "Rainbow Baby",
      desc: "Shoots random tears",
      info: "Shoots random tears · Deals 3-5 damage per tear",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "greed-treasure", "baby-shop"],
      tags: ["familiar", "baby", "offensive", "tears"],
      dlc: "rebirth",
      transform: "conjoined",
      familiars: ["rainbow-baby"],
      hooks: {
        // random damage and a random tear effect on every shot
        onUpdate: function (p, dt, ctx) {
          babyFire(p, dt, ctx, 'rainbow-baby', 'rainbowT', 0.7, function (pl, f, a, c) {
            var flags = new Set()
            flags.add(c.pick(['poison', 'slow', 'burn', 'charm', 'fear', 'confusion', 'petrify', 'homing', 'bouncing', 'freeze']))
            babyTear(c, f, a, c.range(3, 5), flags)
          })
        }
      },
      unlock: null
    },

    {
      id: "dads-key",
      num: 175,
      name: "Dad's Key",
      desc: "Opens all doors in the room, including Secret Rooms, Challenge Rooms, and the Mega Satan door",
      info: "Opens all doors in the room, including Secret Rooms, Challenge Rooms, and the Mega Satan door",
      kind: "active",
      quality: 2,
      pools: ["treasure", "key-master", "greed-treasure", "old-chest"],
      tags: ["keys", "utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.openDoors !== 'function') return { fail: true }; ctx.openDoors() } },
      unlock: null
    },

    {
      id: "stem-cells",
      num: 176,
      name: "Stem Cells",
      desc: "↑ +1 Health",
      info: "↑ +1 Health · ↑ +0.16 Shot speed · Heals 1 heart",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "boss", "greed-boss", "ultra-secret"],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "rebirth",
      stats: {"shotSpeed":0.16},
      grant: {"maxHearts":2,"heal":2},
      unlock: null
    },

    {
      id: "portable-slot",
      num: 177,
      name: "Portable Slot",
      desc: "Spend 1 coin for a chance to spawn a pickup",
      info: "Spend 1 coin for a chance to spawn a pickup",
      kind: "active",
      quality: 2,
      pools: ["shop", "beggar", "ultra-secret"],
      tags: ["coins", "utility", "charge"],
      dlc: "rebirth",
      charge: 0,
      hooks: {
        // APPROXIMATE: payout odds are a guess at the slot machine's
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room || !(p.coins >= 1)) return { fail: true }
          IS.addCoins(p, -1)
          ctx.sfx('coin')
          if (ctx.chance(0.55)) return {}
          drop(ctx, p, ctx.pick(['coin', 'coin', 'heart', 'bomb', 'key', 'card', 'pill', 'battery']))
        }
      },
      unlock: null
    },

    {
      id: "holy-water",
      num: 178,
      name: "Holy Water",
      desc: "Launches itself in the direction Isaac shoots",
      info: "Launches itself in the direction Isaac shoots · Breaks and deals 7 damage upon hitting an enemy · Leaves a pool of petrifying + damaging creep",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "angel", "greed-angel"],
      tags: ["offensive"],
      dlc: "rebirth",
      // APPROXIMATE: Isaac's potion is a thrown arc; here every 2.5s one shot becomes a 7 damage
      // tear that leaves a freezing puddle where it lands or hits.,
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (!ctx || !ctx.run || !p.cache) return
          if (ctx.run.time < (p.cache.hwNext || 0)) return
          p.cache.hwNext = ctx.run.time + 2.5
          tear.flags.add("holywater")
          tear.tint = "#9fd0ff"
          tear.dmg = 7
        },
        onTearHit: function (p, tear, enemy, ctx) { puddle(tear, ctx) },
        onTearDeath: function (p, tear, ctx) { puddle(tear, ctx) }
      },
      unlock: null
    },

    {
      id: "fate",
      num: 179,
      name: "Fate",
      desc: "+1 Eternal Heart",
      info: "+1 Eternal Heart · Flight",
      kind: "passive",
      quality: 2,
      pools: ["golden-chest"],
      tags: ["defensive", "hearts"],
      dlc: "rebirth",
      flags: ["flying"],
      hooks: {
        onInit: function (p) {
          if (!p.cache) p.cache = {}; if (p.cache["fate:init"]) return; p.cache["fate:init"] = true; p.hearts.eternal = (p.hearts.eternal || 0) + 1
        }
      },
      unlock: null
    },

    {
      id: "the-black-bean",
      num: 180,
      name: "The Black Bean",
      desc: "Isaac farts multiple times when damaged",
      info: "Isaac farts multiple times when damaged · The farts leave poison clouds and deflects projectiles",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "beggar"],
      tags: ["offensive"],
      dlc: "rebirth",
      hooks: {
        // three farts: poison clouds that also shove enemies and wipe nearby shots
        onPlayerHurt: function (p, n, src, ctx) {
          var c = cacheOf(p)
          c.beanFarts = 3
          c.beanT = 0
        },
        onUpdate: function (p, dt, ctx) {
          var c = p.cache
          if (!c || !(c.beanFarts > 0) || !ctx || !ctx.room) return
          c.beanT -= dt
          if (c.beanT > 0) return
          c.beanT = 0.45
          c.beanFarts--
          ctx.sfx('fart')
          IS.spawnPuddle({ x: p.x, y: p.y, r: 120, dmg: 0, life: 5, status: [['poison', 3]], colour: '#8ec63f' }, ctx)
          ;(ctx.room.shots || []).forEach(function (s) { if (!s.friendly && !s.dead && IS.dist(p.x, p.y, s.x, s.y) < 150) s.dead = true })
          ctx.livingEnemies().forEach(function (e) { if (!e.boss && IS.dist(p.x, p.y, e.x, e.y) < 150) IS.knockback(e, p.x, p.y, 300) })
        }
      },
      unlock: null
    },

    {
      id: "white-pony",
      num: 181,
      name: "White Pony",
      desc: "Sets your Speed to at least 1.5",
      info: "Sets your Speed to at least 1.5 · Flight while held · Using the item dashes in the direction of Isaac's movement, leaving behind beams of light",
      kind: "active",
      quality: 2,
      pools: [],
      tags: ["utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onStats: function (p, s) { if (s.speed < 1.5) s.speed = 1.5 },
        onUse: function (p) { startDash(p, 0.45) },
        // beams of light in its wake
        onUpdate: function (p, dt, ctx) {
          updateDash(p, dt, ctx, function (pl, c) {
            IS.spawnPuddle({ x: pl.x, y: pl.y, r: 34, dmg: 3, life: 0.8, colour: '#fff3b0' }, c)
          })
        }
      },
      flags: ["flying"],
      unlock: null
    },

    {
      id: "sacred-heart",
      num: 182,
      name: "Sacred Heart",
      desc: "↑ +1 Health",
      info: "↑ +1 Health · ↑ x2.3 Damage multiplier · ↑ +1 Damage · ↓ -0.4 Tears · ↓ -0.25 Shot speed · Full health · Homing tears",
      kind: "passive",
      quality: 2,
      pools: ["angel", "greed-angel", "ultra-secret"],
      tags: ["offensive", "tears", "defensive", "hearts"],
      dlc: "rebirth",
      stats: {"tears":-0.4,"damage":1,"shotSpeed":-0.25,"range":50},
      mult: {"damage":2.3},
      transform: "seraphim",
      tearFlags: ["homing"],
      grant: {"maxHearts":2,"heal":99},
      unlock: null
    },

    {
      id: "tooth-picks",
      num: 183,
      name: "Tooth Picks",
      desc: "↑ +0.7 Tears",
      info: "↑ +0.7 Tears · ↑ +0.16 Shot speed",
      kind: "passive",
      quality: 2,
      pools: ["boss", "greed-boss", "wooden-chest"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      stats: {"tears":0.72,"shotSpeed":0.16},
      unlock: null
    },

    {
      id: "holy-grail",
      num: 184,
      name: "Holy Grail",
      desc: "↑ +1 Health",
      info: "↑ +1 Health · Heals 1 heart · Flight",
      kind: "passive",
      quality: 2,
      pools: ["angel", "greed-angel"],
      tags: ["defensive", "hearts"],
      dlc: "rebirth",
      grant: {"maxHearts":2,"heal":2},
      transform: "seraphim",
      flags: ["flying"],
      unlock: null
    }
  ])

  IS.defineFamiliars([

    { id: "guardian-angel", name: "Guardian Angel", behaviour: 'orbital', params: { r: 14, speed: 300, flying: true, orbitR: 80, orbitSpeed: 2.2, dmg: 3.5, cooldown: 0.35, hp: 0, blockShots: true, life: 0 } },
    { id: "forever-alone", name: "Forever Alone", behaviour: 'orbital', params: { r: 12, speed: 300, flying: true, orbitR: 130, orbitSpeed: 2, dmg: 3, cooldown: 0.35, hp: 0, blockShots: false, life: 0 } },
    { id: "sacrificial-dagger", name: "Sacrificial Dagger", behaviour: 'orbital', params: { r: 14, speed: 300, flying: true, orbitR: 70, orbitSpeed: 2.6, dmg: 4, cooldown: 0.35, hp: 0, blockShots: true, life: 0 } },
    { id: "bum-friend", name: "Bum Friend", behaviour: 'collector', params: { r: 16, speed: 220, flying: false, collects: ["coin"], every: 3.5, reward: 'random', hp: 0, blockShots: false, life: 0 } },
    // the beams come from the item's onUpdate hook, so the body only follows
    { id: "robo-baby", name: "Robo-Baby", sprite: "robo-baby", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, hp: 0, blockShots: false, life: 0 } },
    { id: "little-gish", name: "Little Gish", sprite: "little-gish", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, dmg: 3.5, fireDelay: 0.75, range: 520, hp: 0, blockShots: false, life: 0, tearFlags: ["slow"] } },
    { id: "little-steven", name: "Little Steven", sprite: "little-steven", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, dmg: 3.5, fireDelay: 0.75, range: 520, hp: 0, blockShots: false, life: 0, tearFlags: ["homing"] } },
    // shoots at enemies that come within range of its orbit
    { id: "demon-baby", name: "Demon Baby", sprite: "demon-baby", behaviour: 'orbitShooter', params: { r: 16, speed: 300, flying: true, orbitR: 70, orbitSpeed: 1.6, dmg: 3, fireDelay: 0.75, range: 260, hp: 0, blockShots: false, life: 0 } },
    // the bird Dead Bird spawns when Isaac is hurt: 1.5 damage every 0.35 s, about 4.3 per second
    { id: "dead-bird-bird", name: "Dead Bird", sprite: "dead-bird", behaviour: 'chaser', params: { r: 14, speed: 280, flying: true, dmg: 1.5, cooldown: 0.35, range: 900, hp: 0, blockShots: false, life: 0 } },
    // Isaac's body while Pinking Shears is active: about 23.5 contact damage per second
    { id: "pinking-body", name: "Isaac's Body", behaviour: 'chaser', params: { r: 16, speed: 260, flying: true, dmg: 8, cooldown: 0.34, range: 900, hp: 0, blockShots: false, life: 0 } },
    // Best Friend's decoy: stands still, blows up when its 5 seconds run out
    { id: "best-friend", name: "Best Friend", behaviour: 'wanderer', params: { r: 18, speed: 0, invulnerable: true, decoy: true, life: 5, explode: { dmg: 100, r: 130 } } },
    { id: "the-peeper", name: "The Peeper", sprite: "the-peeper", behaviour: 'wanderer', params: { r: 16, speed: 90, flying: true, dmg: 6, cooldown: 0.35, hp: 0, blockShots: false, life: 0 } },
    { id: "ghost-baby", name: "Ghost Baby", sprite: "ghost-baby", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, dmg: 3.5, fireDelay: 0.75, range: 520, hp: 0, blockShots: false, life: 0, tearFlags: ["spectral"] } },
    // its V of tears comes from the item's onUpdate hook
    { id: "harlequin-baby", name: "Harlequin Baby", sprite: "harlequin-baby", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, hp: 0, blockShots: false, life: 0 } },
    // the stomp comes from the item's onUpdate hook
    { id: "daddy-longlegs", name: "Daddy Longlegs", sprite: "daddy-longlegs", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, hp: 0, blockShots: false, life: 0 } },
    // its random tears come from the item's onUpdate hook
    { id: "rainbow-baby", name: "Rainbow Baby", sprite: "rainbow-baby", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, hp: 0, blockShots: false, life: 0 } }
  ])

})(window.IS)
