;(function (IS) {
  'use strict'

  // Generated from docs/reference/slices/items-4.json. Declarative effects are
  // preferred; hooks use only ARCHITECTURE §5.2 names and seeded ctx RNG.

  // Break every plain rock within a box of half-size (g.r + reach) around (x, y).
  function smashRocks (ctx, x, y, reach) {
    var room = ctx.room, g = ctx.gridObjects()
    for (var i = 0; i < g.length; i++) {
      var o = g[i]
      if (!o || o.broken || !o.rockFamily || !o.destructible || o.bombOnly || o.pit) continue
      if (Math.abs(o.x - x) < o.r + reach && Math.abs(o.y - y) < o.r + reach) IS.destroyGrid(room, o, ctx)
    }
  }

  function liquidPuddle (p, tear, ctx) {
    if (!ctx || !ctx.room || !tear || tear._liquid) return
    tear._liquid = true
    IS.spawnPuddle({ x: tear.x, y: tear.y, r: 45, life: 3, dmg: p.stats.damage }, ctx)
  }

  function foes (ctx) { return ctx && ctx.room ? IS.roomEnemies(ctx.room) : [] }

  function nowOf (ctx) {
    if (ctx && ctx.room && ctx.room.time != null) return ctx.room.time
    return ctx && ctx.run ? ctx.run.time || 0 : 0
  }

  // Direction Isaac is shooting (or last shot) as a unit vector.
  function aimDir (p) {
    var d = IS.input && IS.input.shoot ? IS.input.shoot() : null
    if (d && (d.x || d.y)) return IS.norm(d.x, d.y)
    if (p.head && (p.head.x || p.head.y)) return IS.norm(p.head.x, p.head.y)
    return { x: 1, y: 0 }
  }

  function activeSlot (p, id) {
    for (var i = 0; i < 2; i++) if (p.active && p.active[i] && p.active[i].id === id) return i
    return -1
  }

  function keepInvincible (p, t) { p.status.invincible = Math.max(p.status.invincible || 0, t) }

  function hurtAll (ctx, dmg) {
    var list = foes(ctx)
    for (var i = 0; i < list.length; i++) if (!list[i].hidden) IS.damageEnemy(list[i], dmg, { silent: true }, ctx)
  }

  // Hurt every enemy Isaac is touching, at most once per `gap` seconds each.
  function bumpFoes (p, ctx, dmg, gap) {
    var list = foes(ctx), now = nowOf(ctx)
    for (var i = 0; i < list.length; i++) {
      var e = list[i]
      if (e.hidden || IS.dist(p.x, p.y, e.x, e.y) > e.r + p.r + 4) continue
      if (now - (e._bump || -9) < gap) continue
      e._bump = now
      IS.damageEnemy(e, dmg, { silent: true }, ctx)
    }
  }

  function moving (p, frac) {
    var top = IS.MOVE_SPEED * p.stats.speed
    return top > 0 && Math.hypot(p.vx || 0, p.vy || 0) >= top * frac
  }

  function setRoomsKnown (ctx, test) {
    var f = ctx && ctx.run && ctx.run.floor
    if (!f || !f.rooms) return
    for (var i = 0; i < f.rooms.length; i++) if (f.rooms[i] && test(f.rooms[i])) f.rooms[i].mapKnown = true
  }

  // Player bombs have no explode hook in the engine, so items that change how a bomb
  // goes off watch room.bombs themselves: onSpawn once per new bomb, onBlast after it blew.
  function watchBombs (p, ctx, key, onSpawn, onBlast) {
    if (!ctx || !ctx.room) return
    var seen = p.cache['bw_' + key] || (p.cache['bw_' + key] = [])
    var bombs = ctx.room.bombs || [], i
    for (i = 0; i < bombs.length; i++) {
      var b = bombs[i]
      if (!b || b._kid || b['_w_' + key] || b.friendly === false) continue
      b['_w_' + key] = true
      seen.push(b)
      if (onSpawn) onSpawn(b)
    }
    for (i = seen.length - 1; i >= 0; i--) {
      if (!seen[i].dead) continue
      var done = seen.splice(i, 1)[0]
      if (onBlast) onBlast(done)
    }
  }

  function dropFamiliars (p, test) {
    if (!p.familiars) return
    p.familiars = p.familiars.filter(function (f) { return !test(f) })
  }

  function spawnRingTears (p, ctx, n, dmg) {
    var speed = IS.TEAR_SPEED * p.stats.shotSpeed
    for (var i = 0; i < n; i++) {
      var a = Math.PI * 2 * i / n
      ctx.spawnTear({
        x: p.x, y: p.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        dmg: dmg, r: 8 * p.stats.tearSize, life: p.stats.range / speed, friendly: true,
        flags: new Set(p.tearFlags || [])
      })
    }
  }

  // Compass + Treasure Map + Blue Map: every room is shown, except secret rooms.
  function revealMap (ctx, floor) {
    var f = floor || (ctx && ctx.run && ctx.run.floor)
    if (!f || !f.rooms) return
    for (var i = 0; i < f.rooms.length; i++) {
      var r = f.rooms[i]
      if (r && r.type !== 'secret' && r.type !== 'super-secret') r.mapKnown = true
    }
  }

  IS.defineItems([
    {
      id: "lil-haunt",
      num: 277,
      name: "Lil Haunt",
      desc: "Chases and fears enemies",
      info: "Chases and fears enemies · Deals 4 contact damage per second",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "greed-treasure", "baby-shop"],
      tags: ["familiar", "baby", "offensive"],
      dlc: "rebirth",
      familiars: ["lil-haunt"],
      unlock: null
    },

    {
      id: "dark-bum",
      num: 278,
      name: "Dark Bum",
      desc: "Picks up nearby Red Hearts",
      info: "Picks up nearby Red Hearts · Spawns a Black Heart, rune, card, pill, or spider for every 1.5 hearts picked up",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "devil", "demon-beggar", "baby-shop"],
      tags: ["defensive", "hearts"],
      dlc: "rebirth",
      familiars: ["dark-bum"],
      unlock: null
    },

    {
      id: "big-fan",
      num: 279,
      name: "Big Fan",
      desc: "Large orbital",
      info: "Large orbital · Deals 30 contact damage per second",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "key-master", "greed-treasure", "baby-shop"],
      tags: ["offensive"],
      dlc: "rebirth",
      familiars: ["big-fan"],
      unlock: null
    },

    {
      id: "sissy-longlegs",
      num: 280,
      name: "Sissy Longlegs",
      desc: "Randomly spawns blue spiders in hostile rooms",
      info: "Randomly spawns blue spiders in hostile rooms · Charms enemies it comes in contact with",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure", "baby-shop"],
      tags: ["utility"],
      dlc: "rebirth",
      transform: "spider",
      familiars: ["sissy-longlegs"],
      hooks: {
        // spiders crawl out of her now and then while a room is hostile
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room || !ctx.roomCleared || ctx.roomCleared()) return
          var c = p.cache
          c.sissyT = (c.sissyT == null ? ctx.range(3, 6) : c.sissyT) - dt
          if (c.sissyT > 0) return
          c.sissyT = ctx.range(4, 9)
          ctx.spawnFamiliar('blue-spider')
        }
      },
      unlock: null
    },

    {
      id: "punching-bag",
      num: 281,
      name: "Punching Bag",
      desc: "Decoy familiar",
      info: "Decoy familiar · Enemies target him instead of Isaac",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "greed-treasure", "baby-shop"],
      tags: ["familiar", "baby"],
      dlc: "rebirth",
      familiars: ["punching-bag"],
      unlock: null
    },

    {
      id: "how-to-jump",
      num: 282,
      name: "How to Jump",
      desc: "Allows Isaac to jump over gaps and obstacles",
      info: "Allows Isaac to jump over gaps and obstacles",
      kind: "active",
      quality: 2,
      pools: ["treasure", "library"],
      tags: ["utility", "charge"],
      dlc: "rebirth",
      transform: "bookworm",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          // a short hop: airborne (ignores pits) for most of a second
          p.cache.jumpT = 0.8
          p.flags.add('flying')
          return {}
        },
        onUpdate: function (p, dt) {
          if (!(p.cache.jumpT > 0)) return
          p.cache.jumpT -= dt
          p.flags.add('flying')
          if (p.cache.jumpT <= 0) { p.cache.jumpT = 0; p.flags.delete('flying') }
        }
      },
      unlock: null
    },

    {
      id: "d100",
      num: 283,
      name: "D100",
      desc: "Duplicates 1 pickup in the room",
      info: "Duplicates 1 pickup in the room · Rerolls Isaac's speed, tears, damage, range and passive items · Rerolls all pedestal items, pickups and rocks in the room · Restarts the room, respawns all enemies and devolves them",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-shop", "crane-game"],
      tags: ["offensive", "tears", "utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room || typeof ctx.rerollPlayerItems !== 'function') return { fail: true }
          ctx.rerollPlayerItems()
          if (typeof ctx.rerollPedestals === 'function') ctx.rerollPedestals()
          // loose pickups come out as something else
          var list = ctx.pickups().slice()
          for (var i = 0; i < list.length; i++) {
            var u = list[i]
            if (u.dead || u.taken || u.removed || u.price || u.shop || u.locked || u.kind === 'item' || u.pedestal) continue
            u.removed = true
            ctx.spawnPickup(ctx.pick(['coin', 'bomb', 'key', 'heart', 'soul', 'card', 'pill']), u.x, u.y, {})
          }
        }
      },
      unlock: null
    },

    {
      id: "d4",
      num: 284,
      name: "D4",
      desc: "Reroll all of Isaac's passive items",
      info: "Reroll all of Isaac's passive items",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-shop", "crane-game"],
      tags: ["utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.rerollPlayerItems !== 'function') return { fail: true }; ctx.rerollPlayerItems() } },
      unlock: null
    },

    {
      id: "d10",
      num: 285,
      name: "D10",
      desc: "Devolves all enemies in the room",
      info: "Devolves all enemies in the room · For instance, all Red Flies become Black Flies",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-shop", "crane-game"],
      tags: ["utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          var list = foes(ctx), n = 0
          // APPROXIMATE: no devolution table exists, so an enemy turns into a weaker one of its own archetype
          var defs = IS.enemiesById || {}
          for (var i = 0; i < list.length; i++) {
            var e = list[i]
            if (e.boss || e.hidden || e.segOf) continue
            if (e.champion) { e.champion = null; n++; continue }
            var weaker = []
            for (var id in defs) {
              var d = defs[id]
              if (!d.boss && d.archetype === e.def.archetype && d.hp < e.maxHp && !d.mini && id !== e.id) weaker.push(id)
            }
            if (!weaker.length) continue
            var pick = ctx.pick(weaker)
            e.dead = true
            e.hp = 0
            var c = ctx.spawnEnemy(pick, e.x, e.y)
            if (c) c.spawnT = 0.3
            n++
          }
          if (!n) return { fail: true }
        }
      },
      unlock: null
    },

    {
      id: "blank-card",
      num: 286,
      name: "Blank Card",
      desc: "Triggers the effect of the card Isaac holds without using it",
      info: "Triggers the effect of the card Isaac holds without using it",
      kind: "active",
      quality: 2,
      pools: ["shop", "secret", "greed-shop", "greed-secret"],
      tags: ["utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          var x = p.pocket && p.pocket[0]
          if (!x || x.kind === 'pill') return { fail: true }
          var d = IS.cardsById && IS.cardsById[x.id]
          if (!d || typeof d.use !== 'function') return { fail: true }
          d.use(p, ctx, false)
        }
      },
      unlock: null
    },

    {
      id: "book-of-secrets",
      num: 287,
      name: "Book of Secrets",
      desc: "Highlights tinted and crawlspace rocks in the room",
      info: "Highlights tinted and crawlspace rocks in the room · Receive one of these effects for the floor: · Treasure Map · Compass · Blue Map · Only grants effects not already active · If all effects are active, grants X-Ray Vision",
      kind: "active",
      quality: 2,
      pools: ["treasure", "secret", "library"],
      tags: ["utility", "charge", "book"],
      dlc: "rebirth",
      transform: "bookworm",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          // tinted rocks and crawlspaces in this room light up
          var g = ctx.gridObjects()
          for (var i = 0; i < g.length; i++) if (g[i] && !g[i].broken && (g[i].tint || g[i].kind === 'crawlspace')) g[i].revealed = true
          // one map effect for the floor that Isaac does not have yet; X-Ray Vision once he has all three
          var c = p.cache
          if (!c.secretsFloor) c.secretsFloor = []
          var left = ['treasure-map', 'compass', 'blue-map'].filter(function (k) { return c.secretsFloor.indexOf(k) < 0 })
          if (!left.length) {
            c.secretsFloor.push('x-ray')
            setRoomsKnown(ctx, function () { return true })
            return
          }
          var got = ctx.pick(left)
          c.secretsFloor.push(got)
          if (got === 'blue-map') setRoomsKnown(ctx, function (r) { return r.type === 'secret' || r.type === 'super-secret' })
          else setRoomsKnown(ctx, function (r) { return r.type !== 'secret' && r.type !== 'super-secret' })
        },
        onNewFloor: function (p) { p.cache.secretsFloor = [] }
      },
      unlock: null
    },

    {
      id: "box-of-spiders",
      num: 288,
      name: "Box of Spiders",
      desc: "Spawns 4-8 blue spiders",
      info: "Spawns 4-8 blue spiders",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["utility", "charge"],
      dlc: "rebirth",
      transform: "spider",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          var n = 4 + ctx.int(5)
          for (var i = 0; i < n; i++) ctx.spawnFamiliar('blue-spider')
        }
      },
      unlock: null
    },

    {
      id: "red-candle",
      num: 289,
      name: "Red Candle",
      desc: "Throws a red flame",
      info: "Throws a red flame · It deals contact damage, blocks enemy tears, and disappears when it has dealt damage or blocked shots 4 times or after 10 seconds",
      kind: "active",
      quality: 2,
      pools: ["shop", "greed-shop", "ultra-secret"],
      tags: ["offensive", "tears", "utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          var d = aimDir(p)
          ctx.spawnFamiliar('red-flame', { x: p.x + d.x * 70, y: p.y + d.y * 70 })
        }
      },
      unlock: null
    },

    {
      id: "the-jar",
      num: 290,
      name: "The Jar",
      desc: "Picking up Red Hearts while at full health stores up to 4 of them in the Jar",
      info: "Picking up Red Hearts while at full health stores up to 4 of them in the Jar · Using the item drops all stored hearts on the floor",
      kind: "active",
      quality: 2,
      pools: ["shop"],
      tags: ["defensive", "hearts", "utility", "charge"],
      dlc: "rebirth",
      charge: 0,
      chargeType: "normal",
      hooks: {
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          var c = p.cache
          if (!c.jar) c.jar = 0
          // at full health the hearts Isaac walks over go into the jar instead
          if (c.jar >= 4 || p.hearts.red < p.hearts.maxRed) return
          var list = ctx.pickups()
          for (var i = 0; i < list.length && c.jar < 4; i++) {
            var u = list[i]
            if (u.kind !== 'heart' || u.dead || u.taken || u.removed || u.price || u.shop) continue
            if (IS.dist(p.x, p.y, u.x, u.y) < p.r + (u.r || 12) + 6) {
              u.taken = true
              c.jar++
              ctx.sfx('heart-pickup')
            }
          }
        },
        onUse: function (p, ctx) {
          var n = p.cache.jar || 0
          if (!n || !ctx || !ctx.room) return { fail: true }
          for (var i = 0; i < n; i++) ctx.spawnPickup('heart', p.x + (i - (n - 1) / 2) * 34, p.y + 40, {})
          p.cache.jar = 0
        }
      },
      unlock: null
    },

    {
      id: "flush",
      num: 291,
      name: "Flush!",
      desc: "Turns all non-boss enemies into poop",
      info: "Turns all non-boss enemies into poop · Instantly kills poop enemies and bosses · Extinguishes fire places and fills the room with water · Turns lava pits into walkable ground",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          var list = foes(ctx), i
          for (i = 0; i < list.length; i++) {
            var e = list[i]
            if (e.hidden) continue
            if (e.boss) {
              // poop bosses only
              if (/dingle|dangle|brownie|turd|dung/.test(e.id)) IS.damageEnemy(e, 99999, { silent: true }, ctx)
              continue
            }
            e.dead = true
            e.hp = 0
            ctx.spawnPoop(e.x, e.y)
          }
          var g = ctx.gridObjects()
          for (i = 0; i < g.length; i++) if (g[i] && g[i].fire && !g[i].broken) IS.destroyGrid(ctx.room, g[i], ctx)
        }
      },
      unlock: null
    },

    {
      id: "satanic-bible",
      num: 292,
      name: "Satanic Bible",
      desc: "+1 Black Heart",
      info: "+1 Black Heart · Using the item before a boss fight makes the boss reward a devil deal · Purchasing these devil deals has the same consequences as those in Devil Rooms · Does not affect item pedestals in The Void floor",
      kind: "active",
      quality: 2,
      pools: ["treasure", "devil", "library", "greed-devil"],
      tags: ["defensive", "hearts", "utility", "charge"],
      dlc: "rebirth",
      transform: "bookworm",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || typeof ctx.addBlack !== 'function') return { fail: true }
          ctx.addBlack(2)
          // used in an uncleared boss room: the boss reward becomes a devil deal (room.js rollReward)
          if (ctx.run && ctx.run.flags && ctx.room && ctx.room.type === 'boss' && !ctx.room.cleared) ctx.run.flags.satanicBible = true
        }
      },
      unlock: null
    },

    {
      id: "head-of-krampus",
      num: 293,
      name: "Head of Krampus",
      desc: "Shoot a 4-way blood beam",
      info: "Shoot a 4-way blood beam · They each deal 200 damage over 1.33 seconds",
      kind: "active",
      quality: 2,
      pools: [],
      tags: ["offensive", "utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          // 200 damage per beam over 1.33s: one hit every 0.12s
          for (var i = 0; i < 4; i++) {
            IS.spawnLaser({ x: p.x, y: p.y, angle: i * Math.PI / 2, len: 900, dmg: 18, width: 22, life: 1.33, tick: 0.12, friendly: true }, ctx)
          }
          ctx.sfx('laser-fire')
        }
      },
      unlock: null
    },

    {
      id: "butter-bean",
      num: 294,
      name: "Butter Bean",
      desc: "Knocks back nearby enemies and projectiles",
      info: "Knocks back nearby enemies and projectiles · Enemies pushed into obstacles take 10 damage",
      kind: "active",
      quality: 2,
      pools: ["treasure", "beggar"],
      tags: ["offensive", "utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        // APPROXIMATE: enemies are shoved away; the 10 damage for hitting an obstacle is not modelled
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          var R = 220, list = foes(ctx), i
          for (i = 0; i < list.length; i++) {
            var e = list[i]
            if (!e.hidden && !e.boss && IS.dist(p.x, p.y, e.x, e.y) < R + e.r) IS.knockback(e, p.x, p.y, 1100)
          }
          var shots = ctx.room.shots || []
          for (i = 0; i < shots.length; i++) {
            var s = shots[i]
            if (s.dead || s.friendly || IS.dist(p.x, p.y, s.x, s.y) > R) continue
            var n = IS.norm(s.x - p.x, s.y - p.y), sp = Math.hypot(s.vx || 0, s.vy || 0) || 200
            s.vx = n.x * sp * 1.5
            s.vy = n.y * sp * 1.5
          }
          ctx.shake && ctx.shake(5, 0.2)
        }
      },
      unlock: null
    },

    {
      id: "magic-fingers",
      num: 295,
      name: "Magic Fingers",
      desc: "Deals 2x Isaac's damage + 10 to all enemies in the room",
      info: "Deals 2x Isaac's damage + 10 to all enemies in the room · Costs 1 coin",
      kind: "active",
      quality: 2,
      pools: ["treasure", "shop"],
      tags: ["offensive", "coins", "utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room || p.coins < 1) return { fail: true }
          IS.addCoins(p, -1)
          hurtAll(ctx, p.stats.damage * 2 + 10)
        }
      },
      unlock: null
    },

    {
      id: "converter",
      num: 296,
      name: "Converter",
      desc: "Converts 1 Soul or Black Heart into 1 heart container",
      info: "Converts 1 Soul or Black Heart into 1 heart container",
      kind: "active",
      quality: 2,
      pools: ["shop"],
      tags: ["defensive", "hearts", "utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          var h = p.hearts
          if (h.soul < 1 && h.black < 1) return { fail: true }
          var k = h.soul > 0 ? 'soul' : 'black'
          h[k] -= Math.min(2, h[k])
          IS.addMaxHearts(p, 2, true)
        }
      },
      unlock: null
    },

    {
      id: "pandoras-box",
      num: 297,
      name: "Pandora's Box",
      desc: "Spawns rewards based on floor:",
      info: "Spawns rewards based on floor: · B1: 2; B2: 2 + 2 · C1: Boss item; C2: C1 + 2 · D1: 4; D2: 20 · W1: 2 Boss items · W2: The Bible · ???/Void: Nothing · Sheol: Devil item + 1 · Cathe: Angel item + 1 · Dark Room: Unlocks Moving Box · Chest: 1 · Home: Red Key",
      kind: "active",
      quality: 2,
      pools: ["shop", "red-chest", "greed-shop"],
      tags: ["keys", "utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          var fid = (ctx.run && ctx.run.floor && ctx.run.floor.id) || '', d = ctx.floorDepth()
          var loot = function (n) {
            for (var i = 0; i < n; i++) ctx.spawnPickup(ctx.pick(['coin', 'bomb', 'key', 'heart', 'soul', 'card', 'pill']), null, null, {})
          }
          var gift = function (pool, n) {
            for (var i = 0; i < n; i++) {
              var id = ctx.rollItem(pool)
              var pos = ctx.freeFloorPos()
              if (id) IS.spawnPedestal(ctx.room, id, pos.x, pos.y, {})
            }
          }
          if (fid === 'sheol') { gift('devil', 1); loot(1) }
          else if (fid === 'cathedral') { gift('angel', 1); loot(1) }
          else if (fid === 'the-chest') loot(1)
          else if (fid === 'dark-room' || fid === 'the-void' || fid === 'blue-womb' || fid === 'home') { if (fid === 'home') ctx.spawnPickup('key', null, null, {}) }
          else if (d <= 1) loot(2)
          else if (d === 2) loot(4)
          else if (d === 3) gift('boss', 1)
          else if (d === 4) { gift('boss', 1); loot(2) }
          else if (d === 5) loot(4)
          else if (d === 6) loot(20)
          else if (d === 7) gift('boss', 2)
          else if (d === 8) { var pos = ctx.freeFloorPos(); IS.spawnPedestal(ctx.room, 'the-bible', pos.x, pos.y, {}) }
        }
      },
      unlock: null
    },

    {
      id: "unicorn-stump",
      num: 298,
      name: "Unicorn Stump",
      desc: "Receive for 6 seconds:",
      info: "Receive for 6 seconds: · ↑ +0.28 Speed · Invincibility · Isaac can't shoot (No contact damage)",
      kind: "active",
      quality: 2,
      pools: ["treasure"],
      tags: ["offensive", "defensive", "hearts", "utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onStats: function (p, s) { if (p.cache.unicornT > 0) s.speed += 0.28 },
        onUse: function (p, ctx) {
          p.cache.unicornT = 6
          keepInvincible(p, 6)
          IS.recalcStats(p)
        },
        onUpdate: function (p, dt) {
          if (!(p.cache.unicornT > 0)) return
          p.cache.unicornT -= dt
          keepInvincible(p, 0.1)
          if (p.cache.unicornT <= 0) { p.cache.unicornT = 0; IS.recalcStats(p) }
        },
        // no shooting while it lasts
        onTearFire: function (p, tear) { if (p.cache.unicornT > 0) tear.dead = true }
      },
      unlock: null
    },

    {
      id: "taurus",
      num: 299,
      name: "Taurus",
      desc: "↓ -0.3 Speed",
      info: "↓ -0.3 Speed · ↑ Slowly gain speed while in hostile rooms · At 2 speed, Isaac becomes invincible and deals contact damage · Afterwards, lose the Taurus speed boost for the room",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "rebirth",
      stats: {"speed":-0.3},
      hooks: {
        onStats: function (p, s) { s.speed += p.cache.taurusBonus || 0 },
        onRoomEnter: function (p) {
          p.cache.taurusBonus = 0
          p.cache.taurusRush = 0
          p.cache.taurusSpent = false
          IS.recalcStats(p)
        },
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          var c = p.cache
          if (c.taurusRush > 0) {
            // at top speed: untouchable and hurts whatever it rams, then the boost is gone for the room
            c.taurusRush -= dt
            keepInvincible(p, 0.1)
            bumpFoes(p, ctx, 30, 0.3)
            if (c.taurusRush <= 0) { c.taurusRush = 0; c.taurusBonus = 0; c.taurusSpent = true; IS.recalcStats(p) }
            return
          }
          if (c.taurusSpent || !ctx.roomCleared || ctx.roomCleared()) return
          var before = Math.floor((c.taurusBonus || 0) * 20)
          c.taurusBonus = (c.taurusBonus || 0) + 0.25 * dt
          if (p.stats.speed >= (IS.SPEED_CAP || 2) - 0.001) c.taurusRush = 5
          if (Math.floor(c.taurusBonus * 20) !== before) IS.recalcStats(p)
        }
      },
      unlock: null
    },

    {
      id: "aries",
      num: 300,
      name: "Aries",
      desc: "↑ +0.25 Speed",
      info: "↑ +0.25 Speed · Moving above 0.85 Speed makes Isaac immune to contact damage and deals 25 damage to enemies",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive"],
      dlc: "rebirth",
      stats: {"speed":0.25},
      hooks: {
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room || !moving(p, 0.85)) return
          // running flat out: no contact damage taken, 25 dealt
          keepInvincible(p, 0.1)
          bumpFoes(p, ctx, 25, 0.3)
        }
      },
      unlock: null
    },

    {
      id: "cancer",
      num: 301,
      name: "Cancer",
      desc: "+3 Soul Hearts",
      info: "+3 Soul Hearts · Taking damage reduces all future damage in the room to half a heart",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "rebirth",
      grant: {"soul":6},
      hooks: {
        onRoomEnter: function (p) { p.cache.cancerHit = false },
        onPlayerHurt: function (p) { p.cache.cancerHit = true },
        // after the first hit in a room everything only takes half a heart
        onPlayerDamage: function (p, n) { if (p.cache.cancerHit && n > 1) return 1 }
      },
      unlock: null
    },

    {
      id: "leo",
      num: 302,
      name: "Leo",
      desc: "Size up",
      info: "Size up · Isaac can destroy rocks by walking into them",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["utility"],
      dlc: "rebirth",
      hooks: {
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          var m = IS.input && IS.input.move ? IS.input.move() : null
          if (!m || (!m.x && !m.y)) return
          smashRocks(ctx, p.x, p.y, p.r + 6)
        }
      },
      unlock: null
    },

    {
      id: "virgo",
      num: 303,
      name: "Virgo",
      desc: "Taking damage have a 25% chance to make Isaac temporarily invincible",
      info: "Taking damage have a 25% chance to make Isaac temporarily invincible · 100% chance at 10 luck · Converts negative pills into positive ones",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "rebirth",
      hooks: {
        onPlayerHurt: function (p, n, src, ctx) {
          if (ctx && ctx.roll(0.25, 0.075, 1)) p.status.invincible = 3
        },
        onPillUse: function (p, pillId, ctx) {
          var def = IS.pillsById && IS.pillsById[pillId]
          if (!ctx || p.cache.virgoSwap || !def || def.good !== false) return undefined
          var good = []
          var list = IS.pills || []
          for (var i = 0; i < list.length; i++) if (list[i] && list[i].good) good.push(list[i].id)
          if (!good.length) return undefined
          p.cache.virgoSwap = true
          try { ctx.usePill(ctx.pick(good)) } finally { p.cache.virgoSwap = false }
          // the engine keeps a cancelled pocket pill, so consume it here
          var pk = p.pocket && p.pocket[0]
          if (pk && pk.kind === 'pill' && pk.id === pillId) p.pocket.splice(0, 1)
          return { cancel: true }
        }
      },
      unlock: null
    },

    {
      id: "libra",
      num: 304,
      name: "Libra",
      desc: "+6 coins, bombs and keys",
      info: "+6 coins, bombs and keys · Balances Isaac's stats · Future stat changes will be spread across all stats",
      kind: "passive",
      quality: 2,
      pools: ["treasure"],
      tags: ["coins", "bombs", "keys"],
      dlc: "rebirth",
      grant: {"coins":6,"bombs":6,"keys":6},
      hooks: {
        // APPROXIMATE: evens out the damage and tears ups already gathered; later pickups are not spread
        onStats: function (p, s) {
          var m = (s.damage + s.tears) / 2
          s.damage = m
          s.tears = m
        }
      },
      unlock: null
    },

    {
      id: "scorpio",
      num: 305,
      name: "Scorpio",
      desc: "Poison tears",
      info: "Poison tears",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      tearFlags: ["poison"],
      unlock: null
    },

    {
      id: "sagittarius",
      num: 306,
      name: "Sagittarius",
      desc: "↑ +0.2 Speed",
      info: "↑ +0.2 Speed · Piercing tears",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      stats: {"speed":0.2},
      tearFlags: ["piercing"],
      unlock: null
    },

    {
      id: "capricorn",
      num: 307,
      name: "Capricorn",
      desc: "↑ +1 Health",
      info: "↑ +1 Health · ↑ +0.1 Speed · ↑ +0.5 Fire rate · ↑ +0.5 Damage · ↑ +0.75 Range · +1 coin, bomb and key · Heals 1 heart",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears", "defensive", "hearts", "coins", "bombs", "keys"],
      dlc: "rebirth",
      stats: {"tears":0.5,"damage":0.5,"speed":0.1,"range":60},
      grant: {"maxHearts":2,"heal":2,"coins":1,"bombs":1,"keys":1},
      unlock: null
    },

    {
      id: "aquarius",
      num: 308,
      name: "Aquarius",
      desc: "Isaac leaves a trail of creep",
      info: "Isaac leaves a trail of creep · The creep deals 666% of Isaac's damage per second and inherits his tear effects",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      hooks: {
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          var m = IS.input && IS.input.move ? IS.input.move() : null
          var c = p.cache
          c.aquaT = (c.aquaT || 0) - dt
          if (!m || (!m.x && !m.y) || c.aquaT > 0) return
          c.aquaT = 0.2
          var status = []
          var kinds = ['poison', 'burn', 'slow', 'freeze', 'fear', 'charm', 'confusion']
          for (var i = 0; i < kinds.length; i++) if (p.tearFlags.has(kinds[i])) status.push([kinds[i], 2])
          IS.spawnPuddle({ x: p.x, y: p.y, r: 45, life: 2.5, dmg: 0.5 * p.stats.damage, status: status }, ctx)
        }
      },
      unlock: null
    },

    {
      id: "pisces",
      num: 309,
      name: "Pisces",
      desc: "↑ +0.5 Fire rate",
      info: "↑ +0.5 Fire rate · ↑ +0.12 Tear size · Increases tear knockback",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      stats: {"tears":0.5},
      tearFlags: ["knockback"],
      unlock: null
    },

    {
      id: "eves-mascara",
      num: 310,
      name: "Eve's Mascara",
      desc: "↑ x2 Damage multiplier",
      info: "↑ x2 Damage multiplier · ↓ x0.66 Tears multiplier · ↓ -0.5 Shot speed",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      stats: {"shotSpeed":-0.5},
      mult: {"tears":0.66,"damage":2},
      unlock: null
    },

    {
      id: "judas-shadow",
      num: 311,
      name: "Judas' Shadow",
      desc: "When dead, respawn as Dark Judas with a x2 damage multiplier",
      info: "When dead, respawn as Dark Judas with a x2 damage multiplier",
      kind: "passive",
      quality: 2,
      pools: ["devil", "greed-devil"],
      tags: ["offensive"],
      dlc: "rebirth",
      hooks: {
        onPlayerDeath: function (p, ctx) {
          var c = p.cache
          var have = IS.itemCount(p, 'judas-shadow') || 1
          if ((c.judasUsed || 0) >= have) return undefined
          c.judasUsed = (c.judasUsed || 0) + 1
          var h = p.hearts
          h.maxRed = 0; h.red = 0; h.soul = 0; h.black = 2; h.eternal = 0; h.bone = 0; h.rotten = 0; h.gold = 0
          p.base.damage *= 2
          IS.recalcStats(p)
          return { revive: true }
        }
      },
      unlock: null
    },

    {
      id: "maggys-bow",
      num: 312,
      name: "Maggy's Bow",
      desc: "↑ +1 Health",
      info: "↑ +1 Health · Heals 1 heart · All Red Hearts heal double their value",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["defensive", "hearts"],
      dlc: "rebirth",
      grant: {"maxHearts":2,"heal":2},
      hooks: {
        // red hearts heal twice as much
        onPickup: function (p, kind, amount) { if (kind === 'heart') IS.healRed(p, amount || 1) }
      },
      unlock: null
    },

    {
      id: "holy-mantle",
      num: 313,
      name: "Holy Mantle",
      desc: "Negates the first hit taken once per room",
      info: "Negates the first hit taken once per room",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "angel", "greed-angel"],
      tags: ["utility"],
      dlc: "rebirth",
      transform: "seraphim",
      hooks: {
        onRoomEnter: function (p, room, ctx) { p.cache.mantleUsed = false },
        onPlayerDamage: function (p, n, src, ctx) {
          if (p.cache.mantleUsed) return undefined
          p.cache.mantleUsed = true
          p.invulnUntil = ((ctx && ctx.run && ctx.run.time) || 0) + 1
          return { cancel: true }
        }
      },
      unlock: null
    },

    {
      id: "thunder-thighs",
      num: 314,
      name: "Thunder Thighs",
      desc: "↑ +1 Health",
      info: "↑ +1 Health · ↓ -0.4 Speed · Heals 1 heart · Isaac can destroy rocks by walking into them",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-boss"],
      tags: ["defensive", "hearts"],
      dlc: "rebirth",
      stats: {"speed":-0.4},
      grant: {"maxHearts":2,"heal":2},
      hooks: {
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room || !moving(p, 0.3)) return
          smashRocks(ctx, p.x, p.y, p.r + 6)
        }
      },
      unlock: null
    },

    {
      id: "strange-attractor",
      num: 315,
      name: "Strange Attractor",
      desc: "Isaac's tears attract enemies, pickups and trinkets",
      info: "Isaac's tears attract enemies, pickups and trinkets · The attraction effect is much stronger at the end of the tears' path",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      tearFlags: ["magnetize"],
      unlock: null
    },

    {
      id: "cursed-eye",
      num: 316,
      name: "Cursed Eye",
      desc: "Charged wave of 5 tears",
      info: "Charged wave of 5 tears · Taking damage while partially charged teleports Isaac to a random room",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "secret", "red-chest", "greed-treasure", "greed-secret"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      // APPROXIMATE: the real item replaces the shot with a charged wave of 5; here, while the fire
      // button is held, a 5-tear fan is added every 1.5s, and getting hurt within 0.4s of shooting teleports.
      hooks: {
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.run) return
          var d = IS.input.shoot(), c = p.cache
          if (!d || (!d.x && !d.y)) { c.ceT = 0; return }
          c.ceFiring = ctx.run.time
          c.ceT = (c.ceT || 0) + dt
          if (c.ceT < 1.5) return
          c.ceT = 0
          var base = Math.atan2(d.y, d.x), sp = IS.TEAR_SPEED * (p.stats.shotSpeed || 1)
          for (var k = -2; k <= 2; k++) {
            var a = base + k * 0.18
            var t = ctx.spawnTear({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
              dmg: p.stats.damage, r: 8 * (p.stats.tearSize || 1), life: p.stats.range / sp, friendly: true })
            IS.applyTearFlags(t, p)
          }
        },
        onPlayerHurt: function (p, n, src, ctx) {
          if (ctx && ctx.run && p.cache.ceFiring != null && ctx.run.time - p.cache.ceFiring <= 0.4) ctx.teleport('random')
        }
      },
      unlock: null
    },

    {
      id: "mysterious-liquid",
      num: 317,
      name: "Mysterious Liquid",
      desc: "Isaac's tears leave creep",
      info: "Isaac's tears leave creep · The creep deals 30 damage per second",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      hooks: {
        onTearDeath: function (p, tear, ctx) { liquidPuddle(p, tear, ctx) },
        onTearHit: function (p, tear, enemy, ctx) { liquidPuddle(p, tear, ctx) }
      },
      unlock: null
    },

    {
      id: "gemini",
      num: 318,
      name: "Gemini",
      desc: "Close combat familiar",
      info: "Close combat familiar · Deals 6 contact damage per second",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["familiar", "baby", "offensive"],
      dlc: "rebirth",
      familiars: ["gemini"],
      unlock: null
    },

    {
      id: "cains-other-eye",
      num: 319,
      name: "Cain's Other Eye",
      desc: "Shoots tears in random directions with the same effects as Isaac",
      info: "Shoots tears in random directions with the same effects as Isaac · Deals 75% of Isaac's damage",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["familiar", "baby", "offensive", "tears"],
      dlc: "rebirth",
      familiars: ["cains-other-eye"],
      hooks: {
        // fires in random directions at 75% of Isaac's damage with his tear effects
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          var speed = IS.TEAR_SPEED
          for (var i = 0; i < (p.familiars || []).length; i++) {
            var f = p.familiars[i]
            if (f.id !== 'cains-other-eye') continue
            f.shotT = (f.shotT || 0) - dt
            if (f.shotT > 0) continue
            f.shotT = 0.7
            var a = ctx.range(0, Math.PI * 2)
            ctx.spawnTear({
              x: f.x, y: f.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, dmg: p.stats.damage * 0.75,
              r: 7, life: p.stats.range / speed, friendly: true, flags: new Set(p.tearFlags || [])
            })
          }
        }
      },
      unlock: null
    },

    {
      id: "s-only-friend",
      num: 320,
      name: "???'s Only Friend",
      desc: "Controllable fly",
      info: "Controllable fly · Deals 15 contact damage per second",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "key-master", "greed-treasure", "baby-shop"],
      tags: ["familiar", "baby", "offensive"],
      dlc: "rebirth",
      familiars: ["s-only-friend"],
      hooks: {
        // the fly flies where Isaac steers, a second pair of hands
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room || !IS.input || !IS.input.move) return
          var m = IS.input.move()
          for (var i = 0; i < (p.familiars || []).length; i++) {
            var f = p.familiars[i]
            if (f.id !== 's-only-friend') continue
            var e = { x: f.x, y: f.y, r: f.r, vx: m.x * 260, vy: m.y * 260, flying: true }
            IS.moveEntity(e, dt, ctx.room)
            f.x = e.x
            f.y = e.y
          }
        }
      },
      unlock: null
    },

    {
      id: "samsons-chains",
      num: 321,
      name: "Samson's Chains",
      desc: "Draggable ball that can destroy rocks",
      info: "Draggable ball that can destroy rocks · Deals 10.7 contact damage per second",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "secret", "greed-treasure", "greed-secret"],
      tags: ["offensive"],
      dlc: "rebirth",
      familiars: ["samsons-ball"],
      // APPROXIMATE: the real item is a ball tethered to Isaac that is dragged around; here it is a
      // fast orbital that deals contact damage and smashes rocks it touches.
      hooks: {
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          var fs = p.familiars || []
          for (var i = 0; i < fs.length; i++) {
            if (fs[i].id === 'samsons-ball') smashRocks(ctx, fs[i].x, fs[i].y, fs[i].r + 14)
          }
        }
      },
      unlock: null
    },

    {
      id: "mongo-baby",
      num: 322,
      name: "Mongo Baby",
      desc: "Mimics your baby familiars' tears",
      info: "Mimics your baby familiars' tears · If you have none, shoots normal 3.5 damage tears",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "greed-treasure", "baby-shop"],
      tags: ["familiar", "baby", "offensive", "tears"],
      dlc: "rebirth",
      transform: "conjoined",
      familiars: ["mongo-baby"],
      unlock: null
    },

    {
      id: "isaacs-tears",
      num: 323,
      name: "Isaac's Tears",
      desc: "Shoots 8 tears in all directions",
      info: "Shoots 8 tears in all directions · The tears copy Isaac's tear effects, plus 5 damage · Recharges by shooting tears",
      kind: "active",
      quality: 2,
      pools: ["treasure"],
      tags: ["offensive", "tears", "utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          spawnRingTears(p, ctx, 8, p.stats.damage + 5)
          ctx.sfx('tear-fire')
        },
        // shooting recharges it: one charge per ten tears
        onTearFire: function (p) {
          var slot = activeSlot(p, 'isaacs-tears')
          if (slot < 0) return
          p.cache.itShots = (p.cache.itShots || 0) + 1
          if (p.cache.itShots >= 10) { p.cache.itShots = 0; IS.addCharge(p, 1, slot) }
        }
      },
      unlock: null
    },

    {
      id: "undefined",
      num: 324,
      name: "Undefined",
      desc: "Teleports Isaac to the Treasure, Secret, Super Secret or I AM ERROR Room",
      info: "Teleports Isaac to the Treasure, Secret, Super Secret or I AM ERROR Room",
      kind: "active",
      quality: 2,
      pools: ["treasure"],
      tags: ["utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || typeof ctx.teleport !== 'function') return { fail: true }
          var kinds = ['treasure', 'secret', 'super-secret', 'error']
          while (kinds.length) {
            var k = kinds.splice(ctx.int(kinds.length), 1)[0]
            if (ctx.teleport(k)) return
          }
          return { fail: true }
        }
      },
      unlock: null
    },

    {
      id: "scissors",
      num: 325,
      name: "Scissors",
      desc: "Isaac's head turns into a stationary familiar for the room",
      info: "Isaac's head turns into a stationary familiar for the room · The body is controlled separately and gushes blood tears in the direction Isaac is shooting",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears", "utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        // APPROXIMATE: Isaac keeps moving as the body; his tears now leave from the head left behind
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          if (p.cache.scissorsHead) dropFamiliars(p, function (f) { return f === p.cache.scissorsHead })
          p.cache.scissorsHead = ctx.spawnFamiliar('scissors-head', { x: p.x, y: p.y })
        },
        onTearFire: function (p, tear) {
          var h = p.cache.scissorsHead
          if (h && p.familiars && p.familiars.indexOf(h) >= 0) { tear.x = h.x; tear.y = h.y }
        },
        onRoomEnter: function (p) {
          var h = p.cache.scissorsHead
          if (h) dropFamiliars(p, function (f) { return f === h })
          p.cache.scissorsHead = null
        }
      },
      unlock: null
    },

    {
      id: "breath-of-life",
      num: 326,
      name: "Breath of Life",
      desc: "Holding down the USE button empties the charge bar",
      info: "Holding down the USE button empties the charge bar · Isaac is temporarily invincible when the charge bar is empty · Isaac summons light beams on contact with enemies when invincible · If damage is blocked with perfect timing, shoot a 4-way holy beam and gain a brief shield · Holding it for too long deals damage to Isaac",
      kind: "active",
      quality: 2,
      pools: ["angel"],
      tags: ["offensive", "defensive", "hearts", "utility", "charge"],
      dlc: "rebirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        // APPROXIMATE: no hold-to-channel; one press gives a short invincible burst that hurts what Isaac touches
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          p.cache.breathT = 2.5
          keepInvincible(p, 2.5)
        },
        onUpdate: function (p, dt, ctx) {
          if (!(p.cache.breathT > 0) || !ctx || !ctx.room) return
          p.cache.breathT -= dt
          keepInvincible(p, 0.1)
          bumpFoes(p, ctx, 30, 0.25)
        }
      },
      unlock: null
    },

    {
      id: "the-polaroid",
      num: 327,
      name: "The Polaroid",
      desc: "Taking damage at half a Red Heart or none makes Isaac temporarily invincible for 5 seconds",
      info: "Taking damage at half a Red Heart or none makes Isaac temporarily invincible for 5 seconds",
      kind: "passive",
      quality: 2,
      pools: [],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "rebirth",
      hooks: {
        onPlayerHurt: function (p, n, src, ctx) {
          if (p.hearts.red <= 1) p.status.invincible = 5
        }
      },
      unlock: null
    },

    {
      id: "the-negative",
      num: 328,
      name: "The Negative",
      desc: "↑ +1 Damage",
      info: "↑ +1 Damage · Taking damage at half a Red Heart or none damages all enemies in the room",
      kind: "passive",
      quality: 2,
      pools: [],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "rebirth",
      stats: {"damage":1},
      hooks: {
        // hit while on half a red heart or none: everything in the room takes it too
        onPlayerHurt: function (p, n, src, ctx) {
          if (!ctx || !ctx.room || p.hearts.red > 1) return
          hurtAll(ctx, 40)
        }
      },
      unlock: null
    },

    {
      id: "the-ludovico-technique",
      num: 329,
      name: "The Ludovico Technique",
      desc: "Replaces Isaac's tears with one giant controllable tear",
      info: "Replaces Isaac's tears with one giant controllable tear",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      unlock: null
    },

    {
      id: "soy-milk",
      num: 330,
      name: "Soy Milk",
      desc: "↑ x5.5 Fire rate multiplier",
      info: "↑ x5.5 Fire rate multiplier · ↓ x0.2 Damage multiplier · ↓ -0.3 Tear size · Drastically reduces knockback",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      mult: {"tears":5.5,"damage":0.2},
      unlock: null
    },

    {
      id: "godhead",
      num: 331,
      name: "Godhead",
      desc: "↑ +0.5 Damage",
      info: "↑ +0.5 Damage · ↓ -0.3 Tears · ↓ -0.3 Shot speed · Homing tears · Tears gain an aura that deals 60 damage per second",
      kind: "passive",
      quality: 2,
      pools: ["angel", "greed-angel"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      stats: {"tears":-0.6,"damage":0.5,"shotSpeed":-0.3,"range":52},
      transform: "seraphim",
      tearFlags: ["homing"],
      hooks: {
        onTearFire: function (p, tear) { tear._godhead = true },
        // each tear carries an aura worth 60 damage a second
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          var tears = ctx.room.tears || [], list = foes(ctx)
          for (var i = 0; i < tears.length; i++) {
            var t = tears[i]
            if (!t._godhead || t.dead) continue
            t._gT = (t._gT || 0) - dt
            if (t._gT > 0) continue
            t._gT = 0.25
            for (var j = 0; j < list.length; j++) {
              if (!list[j].hidden && IS.dist(t.x, t.y, list[j].x, list[j].y) < 48 + list[j].r) IS.damageEnemy(list[j], 15, { silent: true }, ctx)
            }
          }
        }
      },
      unlock: null
    },

    {
      id: "lazarus-rags",
      num: 332,
      name: "Lazarus' Rags",
      desc: "When dead, revive as Lazarus (Risen)",
      info: "When dead, revive as Lazarus (Risen)",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "angel", "greed-treasure"],
      tags: ["utility"],
      dlc: "rebirth",
      hooks: {
        onPlayerDeath: function (p, ctx) {
          // revive as Lazarus Risen: the rags are spent and Anemic is gained
          IS.removeItem(p, 'lazarus-rags', ctx)
          var h = p.hearts
          h.maxRed = 2; h.red = 2; h.soul = 0; h.black = 0; h.eternal = 0; h.bone = 0; h.rotten = 0; h.gold = 0
          p.risen = true
          if (IS.itemsById.anemic) IS.giveItem(p, 'anemic', { ctx: ctx, noAnim: true })
          if (ctx && ctx.banner) ctx.banner('LAZARUS RISEN', 'Anemic')
          return { revive: true }
        }
      },
      unlock: null
    },

    {
      id: "the-mind",
      num: 333,
      name: "The Mind",
      desc: "Full mapping effect",
      info: "Full mapping effect",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "angel", "greed-treasure", "greed-angel"],
      tags: ["utility"],
      dlc: "rebirth",
      flags: ["fullMinimap", "seeSecretRooms"],
      // Nothing in the engine reads fullMinimap, so the map is revealed here (secret rooms stay hidden).
      hooks: {
        onNewFloor: function (p, floor, ctx) { revealMap(ctx, floor) },
        onRoomEnter: function (p, room, ctx) { revealMap(ctx) }
      },
      unlock: null
    },

    {
      id: "the-body",
      num: 334,
      name: "The Body",
      desc: "↑ +3 Health",
      info: "↑ +3 Health",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "angel", "greed-treasure", "greed-angel", "ultra-secret"],
      tags: ["defensive", "hearts"],
      dlc: "rebirth",
      grant: {"maxHearts":6,"heal":6},
      unlock: null
    },

    {
      id: "the-soul",
      num: 335,
      name: "The Soul",
      desc: "+2 Soul Hearts",
      info: "+2 Soul Hearts · Grants an aura that repels enemies and projectiles",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "angel", "greed-treasure", "greed-angel"],
      tags: ["defensive", "hearts"],
      dlc: "rebirth",
      grant: {"soul":4},
      hooks: {
        // an aura that pushes enemies and their shots away
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          var R = 110, list = foes(ctx), i
          for (i = 0; i < list.length; i++) {
            var e = list[i]
            if (!e.hidden && !e.boss && IS.dist(p.x, p.y, e.x, e.y) < R + e.r) IS.knockback(e, p.x, p.y, 700 * dt)
          }
          var shots = ctx.room.shots || []
          for (i = 0; i < shots.length; i++) {
            var s = shots[i]
            if (s.dead || s.friendly || IS.dist(p.x, p.y, s.x, s.y) > R) continue
            var n = IS.norm(s.x - p.x, s.y - p.y), sp = Math.hypot(s.vx || 0, s.vy || 0) || 200
            s.vx = n.x * sp
            s.vy = n.y * sp
          }
        }
      },
      unlock: null
    },

    {
      id: "dead-onion",
      num: 336,
      name: "Dead Onion",
      desc: "↑ +0.22 Tear size",
      info: "↑ +0.22 Tear size · ↓ -1.5 Range · ↓ -0.4 Shot speed · Piercing + spectral tears",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure", "rotten-beggar"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      stats: {"shotSpeed":-0.4,"range":-120},
      tearFlags: ["spectral", "piercing"],
      unlock: null
    },

    {
      id: "broken-watch",
      num: 337,
      name: "Broken Watch",
      desc: "Slows down every 4th room",
      info: "Slows down every 4th room · 13% chance to speed up the room instead",
      kind: "passive",
      quality: 2,
      pools: ["shop", "crane-game"],
      tags: ["utility"],
      dlc: "rebirth",
      hooks: {
        // every 4th room is slowed down; one in eight of those runs fast instead
        onRoomEnter: function (p, room, ctx) {
          var c = p.cache
          c.bwN = (c.bwN || 0) + 1
          c.bwMode = 0
          if (c.bwN % 4 === 0 && ctx) c.bwMode = ctx.chance(0.13) ? 2 : 1
        },
        onUpdate: function (p, dt, ctx) {
          var c = p.cache
          if (!c.bwMode || !ctx || !ctx.room) return
          c.bwT = (c.bwT || 0) - dt
          if (c.bwT > 0) return
          c.bwT = 0.4
          var list = foes(ctx)
          for (var i = 0; i < list.length; i++) {
            var e = list[i]
            if (c.bwMode === 1) IS.applyStatus(e, 'slow', 1)
            else if (!e._bwFast) { e._bwFast = true; e.speed *= 1.4 }
          }
        }
      },
      unlock: null
    },

    {
      id: "the-boomerang",
      num: 338,
      name: "The Boomerang",
      desc: "Throwable boomerang",
      info: "Throwable boomerang · Petrifies enemies and deals 2x Isaac's damage · Can grab and bring back items",
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
          var d = aimDir(p), sp = IS.TEAR_SPEED * 0.8
          ctx.spawnTear({
            x: p.x, y: p.y, vx: d.x * sp, vy: d.y * sp, dmg: p.stats.damage * 2, r: 14, life: 1.1,
            friendly: true, flags: new Set(['boomerang', 'piercing', 'spectral', 'petrify'])
          })
        }
      },
      unlock: null
    },

    {
      id: "safety-pin",
      num: 339,
      name: "Safety Pin",
      desc: "↑ +2.5 Range",
      info: "↑ +2.5 Range · ↑ +0.16 Shot speed · +1 Black Heart",
      kind: "passive",
      quality: 2,
      pools: ["boss", "greed-boss"],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "rebirth",
      stats: {"shotSpeed":0.16,"range":200},
      grant: {"black":2},
      unlock: null
    },

    {
      id: "caffeine-pill",
      num: 340,
      name: "Caffeine Pill",
      desc: "↑ +0.3 Speed",
      info: "↑ +0.3 Speed · ↑ Size down · Spawns a random pill",
      kind: "passive",
      quality: 2,
      pools: ["boss", "demon-beggar", "greed-boss"],
      tags: ["utility"],
      dlc: "rebirth",
      stats: {"speed":0.3},
      hooks: {
        onInit: function (p, ctx) {
          if (p.cache.caffeine || !ctx || !ctx.room) return
          p.cache.caffeine = true
          ctx.spawnPickup('pill', null, null, {})
        }
      },
      unlock: null
    },

    {
      id: "torn-photo",
      num: 341,
      name: "Torn Photo",
      desc: "↑ +0.7 Tears",
      info: "↑ +0.7 Tears · ↑ +0.16 Shot speed",
      kind: "passive",
      quality: 2,
      pools: ["boss", "golden-chest", "greed-boss", "old-chest"],
      tags: ["offensive", "tears"],
      dlc: "rebirth",
      stats: {"tears":0.72,"shotSpeed":0.16},
      unlock: null
    },

    {
      id: "blue-cap",
      num: 342,
      name: "Blue Cap",
      desc: "↑ +1 Health",
      info: "↑ +1 Health · ↑ +0.7 Tears · ↓ -0.16 Shot speed · Heals 1 heart",
      kind: "passive",
      quality: 2,
      pools: ["boss", "greed-boss"],
      tags: ["offensive", "tears", "defensive", "hearts"],
      dlc: "rebirth",
      stats: {"tears":0.72,"shotSpeed":-0.16},
      grant: {"maxHearts":2,"heal":2},
      transform: "fun-guy",
      unlock: null
    },

    {
      id: "latch-key",
      num: 343,
      name: "Latch Key",
      desc: "↑ +1 Luck",
      info: "↑ +1 Luck · +1 Soul Heart · Spawns 2 keys",
      kind: "passive",
      quality: 2,
      pools: ["boss", "golden-chest", "key-master", "greed-boss"],
      tags: ["defensive", "hearts", "keys"],
      dlc: "rebirth",
      stats: {"luck":1},
      grant: {"soul":2,"keys":2},
      unlock: null
    },

    {
      id: "match-book",
      num: 344,
      name: "Match Book",
      desc: "+1 Black Heart",
      info: "+1 Black Heart · Spawns 3 bombs · Spawns Match Stick",
      kind: "passive",
      quality: 2,
      pools: ["boss", "golden-chest", "greed-boss"],
      tags: ["defensive", "hearts", "bombs", "book"],
      dlc: "rebirth",
      grant: {"black":2,"bombs":3},
      hooks: {
        onInit: function (p, ctx) {
          if (p.cache.matchBook || !ctx || !ctx.room) return
          p.cache.matchBook = true
          ctx.spawnPickup('trinket', null, null, { id: 'match-stick' })
        }
      },
      unlock: null
    },

    {
      id: "synthoil",
      num: 345,
      name: "Synthoil",
      desc: "↑ +1 Damage",
      info: "↑ +1 Damage · ↑ +2.5 Range",
      kind: "passive",
      quality: 2,
      pools: ["boss", "demon-beggar", "greed-boss"],
      tags: ["offensive"],
      dlc: "rebirth",
      stats: {"damage":1,"range":200},
      transform: "spun",
      unlock: null
    },

    {
      id: "a-snack",
      num: 346,
      name: "A Snack",
      desc: "↑ +1 Health",
      info: "↑ +1 Health · Heals 1 heart",
      kind: "passive",
      quality: 2,
      pools: ["boss", "greed-boss"],
      tags: ["defensive", "hearts"],
      dlc: "rebirth",
      grant: {"maxHearts":2,"heal":2},
      unlock: null
    },

    {
      id: "diplopia",
      num: 347,
      name: "Diplopia",
      desc: "Duplicates all item pedestals and pickups in the room",
      info: "Duplicates all item pedestals and pickups in the room",
      kind: "active",
      quality: 2,
      pools: ["shop"],
      tags: ["utility", "charge"],
      dlc: "afterbirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          var list = ctx.pickups().slice()
          for (var i = 0; i < list.length; i++) {
            var u = list[i]
            if (u.dead || u.taken || u.removed || u.price || u.shop || u.locked) continue
            if (u.kind === 'item' || u.pedestal) {
              var id = u.itemId || u.id
              if (id) IS.spawnPedestal(ctx.room, id, u.x + 56, u.y, {})
            } else {
              ctx.spawnPickup(u.kind, u.x + 30, u.y + 12, { id: u.id, amount: u.amount })
            }
          }
        }
      },
      unlock: null
    },

    {
      id: "placebo",
      num: 348,
      name: "Placebo",
      desc: "Triggers the effect of the pill Isaac holds without using it",
      info: "Triggers the effect of the pill Isaac holds without using it",
      kind: "active",
      quality: 2,
      pools: ["shop", "secret", "greed-shop", "greed-secret"],
      tags: ["utility", "charge"],
      dlc: "afterbirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          var x = p.pocket && p.pocket[0]
          if (!x || x.kind !== 'pill') return { fail: true }
          var d = IS.pillsById && IS.pillsById[x.id]
          if (!d || typeof d.use !== 'function') return { fail: true }
          d.use(p, ctx, false)
        }
      },
      unlock: null
    },

    {
      id: "wooden-nickel",
      num: 349,
      name: "Wooden Nickel",
      desc: "59% chance to spawn a random coin",
      info: "59% chance to spawn a random coin",
      kind: "active",
      quality: 2,
      pools: ["shop", "greed-treasure", "wooden-chest"],
      tags: ["coins", "utility", "charge"],
      dlc: "afterbirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          // 59%: a coin lands at Isaac's feet
          if (ctx.chance(0.59)) ctx.spawnPickup('coin', p.x, p.y + 30, {})
        }
      },
      unlock: null
    },

    {
      id: "toxic-shock",
      num: 350,
      name: "Toxic Shock",
      desc: "Entering a room poisons all enemies",
      info: "Entering a room poisons all enemies · Enemies killed leave a puddle of creep · The creep deals 30 damage per second",
      kind: "passive",
      quality: 2,
      pools: ["treasure"],
      tags: ["offensive"],
      dlc: "afterbirth",
      hooks: {
        // every enemy in the room is poisoned, including ones that arrive later
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          var list = foes(ctx)
          for (var i = 0; i < list.length; i++) {
            if (list[i]._toxic) continue
            list[i]._toxic = true
            IS.applyStatus(list[i], 'poison', 99)
          }
        },
        // and what dies leaves creep that does 30 damage a second
        onEnemyKill: function (p, e, ctx) {
          if (!ctx || !ctx.room || !e._toxic) return
          IS.spawnPuddle({ x: e.x, y: e.y, r: 60, life: 6, dmg: 15, status: [['poison', 2]] }, ctx)
        }
      },
      unlock: null
    },

    {
      id: "mega-bean",
      num: 351,
      name: "Mega Bean",
      desc: "Petrifies all enemies in the room",
      info: "Petrifies all enemies in the room · Deals 5 damage and poisons any enemies nearby · Sends a rock wave in the direction Isaac is moving · The rock wave can open secret rooms and break rocks",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "utility", "charge"],
      dlc: "afterbirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          var list = foes(ctx), i
          for (i = 0; i < list.length; i++) {
            var e = list[i]
            if (e.hidden) continue
            IS.applyStatus(e, 'petrify', 3)
            if (IS.dist(p.x, p.y, e.x, e.y) < 160 + e.r) {
              IS.damageEnemy(e, 5, { silent: true }, ctx)
              IS.applyStatus(e, 'poison', 4)
            }
          }
          // rock wave in the direction Isaac is heading
          var m = IS.input && IS.input.move ? IS.input.move() : null
          var d = m && (m.x || m.y) ? IS.norm(m.x, m.y) : aimDir(p)
          for (i = 1; i <= 8; i++) smashRocks(ctx, p.x + d.x * i * 60, p.y + d.y * i * 60, 30)
          ctx.sfx('fart')
        }
      },
      unlock: null
    },

    {
      id: "glass-cannon",
      num: 352,
      name: "Glass Cannon",
      desc: "Shoots a large piercing spectral tear that does 10x Isaac's damage +10 damage",
      info: "Shoots a large piercing spectral tear that does 10x Isaac's damage +10 damage · While held, taking damage: · ↓ Removes an extra 2 hearts of health · ↓ Breaks the cannon for a few rooms · ↑ +1.5 Range and leaves a blood trail for the room · The extra damage can't kill Isaac · Self-damage does not trigger the effect",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-treasure", "crane-game"],
      tags: ["offensive", "tears", "defensive", "hearts", "utility", "charge"],
      dlc: "afterbirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          var d = aimDir(p), sp = IS.TEAR_SPEED * p.stats.shotSpeed
          ctx.spawnTear({
            x: p.x, y: p.y, vx: d.x * sp, vy: d.y * sp, dmg: p.stats.damage * 10 + 10, r: 26,
            life: p.stats.range / sp, friendly: true, flags: new Set(['piercing', 'spectral'])
          })
          ctx.sfx('tear-fire')
        },
        // holding it hurts: two more hearts go, it can't kill, and the cannon breaks
        onPlayerHurt: function (p, n, src, ctx) {
          var slot = activeSlot(p, 'glass-cannon')
          if (slot < 0 || (src && src.self)) return
          var left = Math.min(4, Math.max(0, p.hearts.soul + p.hearts.black + p.hearts.red - 1))
          var keys = ['soul', 'black', 'red']
          for (var i = 0; i < keys.length && left > 0; i++) {
            var t = Math.min(p.hearts[keys[i]], left)
            p.hearts[keys[i]] -= t
            left -= t
          }
          p.active[slot] = null
          IS.removeItem(p, 'glass-cannon', ctx)
          if (IS.itemsById['broken-glass-cannon']) IS.giveItem(p, 'broken-glass-cannon', { ctx: ctx })
        }
      },
      unlock: null
    },

    {
      id: "bomber-boy",
      num: 353,
      name: "Bomber Boy",
      desc: "+5 Bombs",
      info: "+5 Bombs · Bombs explode in a cross-shaped pattern · ↓ x0.75 Bomb damage",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure", "bomb-bum"],
      tags: ["offensive", "bombs"],
      dlc: "afterbirth",
      grant: {"bombs":5},
      hooks: {
        onRoomEnter: function (p) { p.cache.bw_cross = [] },
        onUpdate: function (p, dt, ctx) {
          watchBombs(p, ctx, 'cross', function (b) { b.dmg = (b.dmg || 60) * 0.75 }, function (b) {
            // the blast spreads along a cross
            var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
            for (var i = 0; i < dirs.length; i++) {
              for (var k = 1; k <= 2; k++) {
                IS.bombExplode(b.x + dirs[i][0] * 70 * k, b.y + dirs[i][1] * 70 * k, { dmg: b.dmg, r: 70, src: b }, ctx)
              }
            }
          })
        }
      },
      unlock: null
    },

    {
      id: "crack-jacks",
      num: 354,
      name: "Crack Jacks",
      desc: "↑ +1 Health",
      info: "↑ +1 Health · Heals 1 heart · Spawns a trinket",
      kind: "passive",
      quality: 2,
      pools: ["boss", "golden-chest", "greed-boss"],
      tags: ["defensive", "hearts"],
      dlc: "afterbirth",
      grant: {"maxHearts":2,"heal":2},
      hooks: {
        onInit: function (p, ctx) {
          if (p.cache.crackJacks || !ctx || !ctx.room) return
          p.cache.crackJacks = true
          ctx.spawnPickup('trinket', null, null, {})
        }
      },
      unlock: null
    },

    {
      id: "moms-pearls",
      num: 355,
      name: "Mom's Pearls",
      desc: "↑ +2.5 Range",
      info: "↑ +2.5 Range · ↑ +1 Luck · +1 Soul Heart",
      kind: "passive",
      quality: 2,
      pools: ["boss", "golden-chest", "moms-chest", "greed-boss", "old-chest"],
      tags: ["defensive", "hearts"],
      dlc: "afterbirth",
      stats: {"luck":1,"range":200},
      grant: {"soul":2},
      transform: "mom",
      unlock: null
    },

    {
      id: "car-battery",
      num: 356,
      name: "Car Battery",
      desc: "Using an active item triggers its effect twice",
      info: "Using an active item triggers its effect twice",
      kind: "passive",
      quality: 2,
      pools: ["shop", "battery-bum", "greed-shop"],
      tags: ["utility"],
      dlc: "afterbirth",
      unlock: null
    },

    {
      id: "box-of-friends",
      num: 357,
      name: "Box of Friends",
      desc: "Duplicates all your familiars for the room",
      info: "Duplicates all your familiars for the room · Grants a Demon Baby for the room if Isaac has no familiars",
      kind: "active",
      quality: 2,
      pools: ["shop", "greed-treasure", "crane-game"],
      tags: ["utility", "charge"],
      dlc: "afterbirth",
      charge: 4,
      chargeType: "normal",
      hooks: {
        onUse: function (p, ctx) {
          if (!ctx || !ctx.room) return { fail: true }
          var fams = (p.familiars || []).filter(function (f) { return !f._box })
          if (!fams.length) { ctx.spawnFamiliar('demon-baby', { _box: true }); return }
          for (var i = 0; i < fams.length; i++) ctx.spawnFamiliar(fams[i].id, { _box: true })
        },
        // the copies only last for the room
        onRoomEnter: function (p) { dropFamiliars(p, function (f) { return f._box }) }
      },
      unlock: null
    },

    {
      id: "the-wiz",
      num: 358,
      name: "The Wiz",
      desc: "Spectral tears",
      info: "Spectral tears · Isaac shoots 2 tears at once diagonally",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears"],
      dlc: "afterbirth",
      tearFlags: ["spectral"],
      unlock: null
    },

    {
      id: "8-inch-nails",
      num: 359,
      name: "8 Inch Nails",
      desc: "↑ +1.5 Damage",
      info: "↑ +1.5 Damage · Increases knockback",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive"],
      dlc: "afterbirth",
      stats: {"damage":1.5},
      tearFlags: ["knockback"],
      unlock: null
    },

    {
      id: "incubus",
      num: 360,
      name: "Incubus",
      desc: "Shoots tears with the same effects as Isaac",
      info: "Shoots tears with the same effects as Isaac · Deals 75% of Isaac's damage",
      kind: "familiar",
      quality: 2,
      pools: ["devil", "greed-devil", "baby-shop"],
      tags: ["familiar", "baby", "offensive", "tears"],
      dlc: "afterbirth",
      transform: "conjoined",
      familiars: ["incubus"],
      unlock: null
    },

    {
      id: "fates-reward",
      num: 361,
      name: "Fate's Reward",
      desc: "Shoots tears with the same damage and effects as Isaac",
      info: "Shoots tears with the same damage and effects as Isaac · Shoots at half the rate of other familiars",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "baby-shop"],
      tags: ["familiar", "baby", "offensive", "tears"],
      dlc: "afterbirth",
      familiars: ["fates-reward"],
      unlock: null
    },

    {
      id: "lil-chest",
      num: 362,
      name: "Lil Chest",
      desc: "35% chance to spawn a pickup every room",
      info: "35% chance to spawn a pickup every room",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "beggar", "greed-treasure", "crane-game", "wooden-chest"],
      tags: ["utility"],
      dlc: "afterbirth",
      hooks: {
        onRoomClear: function (p, room, ctx) {
          if (!ctx || !ctx.room || !ctx.chance(0.35)) return
          ctx.spawnPickup(ctx.pick(['coin', 'heart', 'bomb', 'key']), p.x, p.y + 60)
        }
      },
      unlock: null
    },

    {
      id: "sworn-protector",
      num: 363,
      name: "Sworn Protector",
      desc: "Orbital",
      info: "Orbital · Deals 105 contact damage per second · Blocks and attracts enemy shots · Blocking 10 shots in one room spawns an Eternal Heart",
      kind: "passive",
      quality: 2,
      pools: ["angel", "greed-angel", "baby-shop"],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "afterbirth",
      transform: "conjoined",
      familiars: ["sworn-protector"],
      hooks: {
        onRoomEnter: function (p, room, ctx) {
          var fs = p.familiars || []
          for (var i = 0; i < fs.length; i++) if (fs[i].id === 'sworn-protector') fs[i].blocked = 0
          p.cache.swornPaid = false
        },
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room || p.cache.swornPaid) return
          var fs = p.familiars || [], n = 0
          for (var i = 0; i < fs.length; i++) if (fs[i].id === 'sworn-protector') n += fs[i].blocked || 0
          if (n >= 10) {
            p.cache.swornPaid = true
            ctx.spawnPickup('heart', p.x, p.y + 60, { variant: 'eternal' })
          }
        }
      },
      unlock: null
    },

    {
      id: "friend-zone",
      num: 364,
      name: "Friend Zone",
      desc: "Midrange fly orbital",
      info: "Midrange fly orbital · Deals 45 contact damage per second",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "key-master", "greed-treasure", "baby-shop"],
      tags: ["offensive"],
      dlc: "afterbirth",
      familiars: ["friend-zone"],
      unlock: null
    },

    {
      id: "lost-fly",
      num: 365,
      name: "Lost Fly",
      desc: "Moves along walls/obstacles in the room",
      info: "Moves along walls/obstacles in the room · Deals 30 contact damage per second · Nearby enemies target the fly",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "key-master", "greed-treasure", "baby-shop"],
      tags: ["familiar", "baby", "offensive"],
      dlc: "afterbirth",
      familiars: ["lost-fly"],
      unlock: null
    },

    {
      id: "scatter-bombs",
      num: 366,
      name: "Scatter Bombs",
      desc: "+5 Bombs",
      info: "+5 Bombs · Isaac's bombs scatter into 4-5 tiny bombs",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure", "bomb-bum"],
      tags: ["bombs"],
      dlc: "afterbirth",
      grant: {"bombs":5},
      hooks: {
        onRoomEnter: function (p) { p.cache.bw_scatter = [] },
        // APPROXIMATE: the parent bomb still goes off, just smaller, and sheds its tiny bombs afterwards
        onUpdate: function (p, dt, ctx) {
          watchBombs(p, ctx, 'scatter', function (b) { b.r = (b.r || 120) * 0.6; b.dmg = (b.dmg || 60) * 0.6 }, function (b) {
            var n = 4 + (ctx.chance(0.5) ? 1 : 0)
            for (var i = 0; i < n; i++) {
              var a = ctx.range(0, Math.PI * 2)
              IS.spawnBomb(b.x, b.y, { fuse: ctx.range(0.5, 0.9), dmg: (b.dmg || 60) * 0.7, r: 70, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340, _kid: true }, ctx)
            }
          })
        }
      },
      unlock: null
    },

    {
      id: "sticky-bombs",
      num: 367,
      name: "Sticky Bombs",
      desc: "+5 Bombs",
      info: "+5 Bombs · Isaac's bombs stick to enemies and leave white slowing creep · Killing an enemy with a bomb spawns blue spiders",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure", "bomb-bum"],
      tags: ["offensive", "bombs"],
      dlc: "afterbirth",
      grant: {"bombs":5},
      transform: "spider",
      hooks: {
        onRoomEnter: function (p) { p.cache.bw_sticky = [] },
        onUpdate: function (p, dt, ctx) {
          watchBombs(p, ctx, 'sticky', null, function (b) {
            // white creep that slows what walks through it
            IS.spawnPuddle({ x: b.x, y: b.y, r: 70, life: 5, dmg: 0, status: [['slow', 1.5]] }, ctx)
          })
          if (!ctx || !ctx.room) return
          // a bomb that touches an enemy sticks to it
          var seen = p.cache.bw_sticky || [], list = foes(ctx)
          for (var i = 0; i < seen.length; i++) {
            var b = seen[i]
            if (b.dead) continue
            if (!b._stuck) {
              for (var j = 0; j < list.length; j++) {
                if (!list[j].hidden && IS.dist(b.x, b.y, list[j].x, list[j].y) < list[j].r + 20) { b._stuck = list[j]; break }
              }
            }
            if (b._stuck && !b._stuck.dead) { b.x = b._stuck.x; b.y = b._stuck.y; b.vx = 0; b.vy = 0 }
          }
        },
        // an enemy that dies to a bomb leaves blue spiders
        onEnemyKill: function (p, e, ctx) {
          if (!ctx || !ctx.room) return
          var bombs = ctx.room.bombs || []
          for (var i = 0; i < bombs.length; i++) {
            var b = bombs[i]
            if (b.dead && b.fuse <= 0 && IS.dist(b.x, b.y, e.x, e.y) < (b.r || 120) + e.r) {
              ctx.spawnFamiliar('blue-spider')
              ctx.spawnFamiliar('blue-spider')
              return
            }
          }
        }
      },
      unlock: null
    },

    {
      id: "epiphora",
      num: 368,
      name: "Epiphora",
      desc: "↑ Shooting in one direction gradually increases fire rate up to 200% and decreases accuracy",
      info: "↑ Shooting in one direction gradually increases fire rate up to 200% and decreases accuracy",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["tears"],
      dlc: "afterbirth",
      hooks: {
        onUpdate: function (p, dt, ctx) {
          var d = IS.input.shoot(), c = p.cache
          if (!d || (!d.x && !d.y)) { c.epiT = 0; c.epiDir = null; return }
          var key = Math.round(d.x) + ',' + Math.round(d.y)
          if (c.epiDir !== key) { c.epiDir = key; c.epiT = 0 }
          c.epiT += dt
          // ramps to +200% fire rate over 3s: an extra 2 seconds of cooldown tick per second
          p.nextShot -= dt * 2 * Math.min(1, c.epiT / 3)
        },
        onTearFire: function (p, tear, ctx) {
          var e = Math.min(1, (p.cache.epiT || 0) / 3)
          if (!(e > 0) || !ctx) return
          var a = ctx.range(-1, 1) * e * 0.3, cs = Math.cos(a), sn = Math.sin(a)
          var vx = tear.vx, vy = tear.vy
          tear.vx = vx * cs - vy * sn
          tear.vy = vx * sn + vy * cs
        }
      },
      unlock: null
    }
  ])

  IS.defineFamiliars([
    { id: "lil-haunt", name: "Lil Haunt", sprite: "lil-haunt", behaviour: 'chaser', params: { r: 16, speed: 260, flying: true, dmg: 2, cooldown: 0.5, range: 700, status: 'fear', statusSecs: 1.5 } },
    // APPROXIMATE: enemies do not retarget onto him, but he trails Isaac and soaks up enemy shots
    { id: "punching-bag", name: "Punching Bag", sprite: "punching-bag", behaviour: 'follower', params: { r: 18, speed: 300, flying: true, blockShots: true, decoy: true } },
    { id: "gemini", name: "Gemini", sprite: "gemini", behaviour: 'chaser', params: { r: 16, speed: 280, flying: true, dmg: 3, cooldown: 0.5, range: 360 } },
    { id: "cains-other-eye", name: "Cain's Other Eye", sprite: "cains-other-eye", behaviour: 'follower', params: { r: 16, speed: 300, flying: true } },
    { id: "s-only-friend", name: "???'s Only Friend", sprite: "s-only-friend", behaviour: 'wanderer', params: { r: 14, speed: 0, flying: true, dmg: 3, cooldown: 0.2 } },
    // APPROXIMATE: always the plain 3.5 damage tears; it does not copy other babies' tear types
    { id: "mongo-baby", name: "Mongo Baby", sprite: "mongo-baby", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, dmg: 3.5, fireDelay: 0.75, range: 520 } },
    { id: "incubus", name: "Incubus", sprite: "incubus", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, inherit: 0.75, fireDelay: 0.37, range: 520 } },
    { id: "fates-reward", name: "Fate's Reward", sprite: "fates-reward", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, inherit: 1, fireDelay: 0.8, range: 520 } },
    // APPROXIMATE: roams the room instead of hugging walls; enemies do not target it
    { id: "lost-fly", name: "Lost Fly", sprite: "lost-fly", behaviour: 'wanderer', params: { r: 14, speed: 240, flying: true, dmg: 7.5, cooldown: 0.25 } },
    { id: "dark-bum", name: "Dark Bum", behaviour: 'collector', params: { r: 16, speed: 260, collects: ['heart'], every: 3, reward: 'black' } },
    { id: "big-fan", name: "Big Fan", behaviour: 'orbital', params: { r: 26, orbitR: 95, orbitSpeed: 1.8, dmg: 3, cooldown: 0.35 } },
    { id: "friend-zone", name: "Friend Zone", behaviour: 'orbital', params: { r: 12, orbitR: 130, orbitSpeed: 2.6, dmg: 4.5, cooldown: 0.35 } },
    { id: "sworn-protector", name: "Sworn Protector", behaviour: 'orbital', params: { r: 18, orbitR: 80, orbitSpeed: 2.2, dmg: 7, cooldown: 0.35, blockShots: true } },
    { id: "sissy-longlegs", name: "Sissy Longlegs", behaviour: 'chaser', params: { r: 14, speed: 200, flying: true, dmg: 1, cooldown: 1.2, range: 600, status: 'charm', statusSecs: 4 } },
    { id: "red-flame", name: "Red Flame", behaviour: 'wanderer', params: { r: 16, speed: 0, dmg: 6, cooldown: 0.5, hp: 4, life: 10, blockShots: true, status: 'burn', statusSecs: 2 } },
    { id: "scissors-head", name: "Isaac's Head", behaviour: 'wanderer', params: { r: 16, speed: 0 } },
    { id: "samsons-ball", name: "Samson's Ball", behaviour: 'orbital', params: { r: 24, orbitR: 110, orbitSpeed: 2.4, dmg: 3, cooldown: 0.35 } }
  ])

})(window.IS)
