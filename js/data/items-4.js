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
      tearFlags: ["fear"],
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
      tearFlags: ["charm"],
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
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
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
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.rerollPlayerItems !== 'function') return { fail: true }; ctx.rerollPlayerItems() } },
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
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
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
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
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
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
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
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.spawnFamiliar !== 'function') return { fail: true }; ctx.spawnFamiliar('box-of-spiders', {life:10}) } },
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
      tearFlags: ["burn"],
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
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
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
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
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
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
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.addBlack !== 'function') return { fail: true }; ctx.addBlack(2) } },
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
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
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
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
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
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
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
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.addBlack !== 'function') return { fail: true }; ctx.addBlack(2) } },
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
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.spawnFamiliar !== 'function') return { fail: true }; ctx.spawnFamiliar('pandoras-box', {life:10}) } },
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
      hooks: { onUse: function (p, ctx) { if (!p.status) p.status={}; p.status.invincible=6 } },
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
      tearFlags: ["slow"],
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
      grant: {"coins":6},
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
      stats: {"tears":0.5,"damage":0.5,"speed":0.1,"range":30},
      grant: {"maxHearts":2,"heal":2,"coins":1},
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
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
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
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.teleport !== 'function') return { fail: true }; ctx.teleport('random') } },
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
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.spawnFamiliar !== 'function') return { fail: true }; ctx.spawnFamiliar('scissors', {life:10}) } },
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
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.spawnFamiliar !== 'function') return { fail: true }; ctx.spawnFamiliar('breath-of-life', {life:10}) } },
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
          var c = p.cache
          var have = IS.itemCount(p, 'lazarus-rags') || 1
          if ((c.ragsUsed || 0) >= have) return undefined
          c.ragsUsed = (c.ragsUsed || 0) + 1
          var h = p.hearts
          h.maxRed = 2; h.red = 2; h.soul = 0; h.black = 0; h.eternal = 0; h.bone = 0; h.rotten = 0; h.gold = 0
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
      stats: {"shotSpeed":-0.4,"range":-80},
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
      hooks: { onTearFire: function (p, tear, ctx) { if(ctx && ctx.roll(0.25,0.05,1)){ for(var i=0;i<["slow"].length;i++) tear.flags.add(["slow"][i]) } } },
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
      tearFlags: ["boomerang"],
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
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
      stats: {"shotSpeed":0.16,"range":80},
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
      grant: {"soul":2},
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
      grant: {"black":2},
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
      stats: {"damage":1,"range":80},
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
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
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
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
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
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.spawnPickup !== 'function') return { fail: true }; ctx.spawnPickup('coin', p.x, p.y, {}) } },
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
      tearFlags: ["poison"],
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
      tearFlags: ["poison"],
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.livingEnemies !== 'function') return { fail: true }; var es=ctx.livingEnemies(); for(var i=0;i<es.length;i++) ctx.applyStatus(es[i], 'petrify', 3) } },
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
      tearFlags: ["spectral", "piercing"],
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
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
      stats: {"luck":1,"range":35.2},
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
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.spawnFamiliar !== 'function') return { fail: true }; ctx.spawnFamiliar('box-of-friends', {life:10}) } },
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
      tearFlags: ["slow"],
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
    { id: "lil-haunt", name: "Lil Haunt", sprite: "lil-haunt", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, dmg: 4, fireDelay: 0.75, range: 520, hp: 0, blockShots: false, life: 0, tearFlags: ["fear"] } },
    { id: "punching-bag", name: "Punching Bag", sprite: "punching-bag", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, dmg: 3.5, fireDelay: 0.75, range: 520, hp: 0, blockShots: false, life: 0 } },
    { id: "gemini", name: "Gemini", sprite: "gemini", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, dmg: 6, fireDelay: 0.75, range: 520, hp: 0, blockShots: false, life: 0 } },
    { id: "cains-other-eye", name: "Cain's Other Eye", sprite: "cains-other-eye", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, dmg: 75, fireDelay: 0.75, range: 520, hp: 0, blockShots: false, life: 0 } },
    { id: "s-only-friend", name: "???'s Only Friend", sprite: "s-only-friend", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, dmg: 15, fireDelay: 0.75, range: 520, hp: 0, blockShots: false, life: 0 } },
    { id: "mongo-baby", name: "Mongo Baby", sprite: "mongo-baby", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, dmg: 3.5, fireDelay: 0.75, range: 520, hp: 0, blockShots: false, life: 0 } },
    { id: "incubus", name: "Incubus", sprite: "incubus", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, dmg: 75, fireDelay: 0.75, range: 520, hp: 0, blockShots: false, life: 0 } },
    { id: "fates-reward", name: "Fate's Reward", sprite: "fates-reward", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, dmg: 3.5, fireDelay: 0.75, range: 520, hp: 0, blockShots: false, life: 0 } },
    { id: "lost-fly", name: "Lost Fly", sprite: "lost-fly", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, dmg: 30, fireDelay: 0.75, range: 520, hp: 0, blockShots: false, life: 0 } },
    { id: "dark-bum", name: "Dark Bum", behaviour: 'collector', params: { r: 16, speed: 260, collects: ['heart'], every: 3, reward: 'black' } },
    { id: "big-fan", name: "Big Fan", behaviour: 'orbital', params: { r: 26, orbitR: 95, orbitSpeed: 1.8, dmg: 3, cooldown: 0.35 } },
    { id: "friend-zone", name: "Friend Zone", behaviour: 'orbital', params: { r: 12, orbitR: 130, orbitSpeed: 2.6, dmg: 4.5, cooldown: 0.35 } },
    { id: "sworn-protector", name: "Sworn Protector", behaviour: 'orbital', params: { r: 18, orbitR: 80, orbitSpeed: 2.2, dmg: 7, cooldown: 0.35, blockShots: true } },
    { id: "samsons-ball", name: "Samson's Ball", behaviour: 'orbital', params: { r: 24, orbitR: 110, orbitSpeed: 2.4, dmg: 3, cooldown: 0.35 } }
  ])

})(window.IS)
