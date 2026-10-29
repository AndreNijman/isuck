;(function (IS) {
  'use strict'

  function swapPedestal (pu, id) {
    var def = IS.itemsById[id]
    if (!def) return
    pu.id = id
    pu.itemId = id
    pu.def = def
    pu.variant = def.kind || 'passive'
  }

  // Echo Chamber: remember the last 3 cards/pills used and replay them with every new one.
  function echoUse (p, kind, id, ctx) {
    if (!ctx || p.cache.echoBusy) return
    var list = p.cache.echo || (p.cache.echo = [])
    p.cache.echoBusy = true
    try {
      for (var i = 0; i < list.length; i++) {
        if (list[i].kind === 'pill') ctx.usePill(list[i].id)
        else ctx.useCard(list[i].id)
      }
    } finally { p.cache.echoBusy = false }
    list.push({ kind: kind, id: id })
    while (list.length > 3) list.shift()
  }

  // TMTRAINER: one random permanent "glitch" stat change.
  function tmGlitch (p, ctx) {
    var g = p.cache.tmG || (p.cache.tmG = { damage: 0, tears: 0, speed: 0, range: 0, luck: 0, shotSpeed: 0 })
    var k = ['damage', 'tears', 'speed', 'range', 'luck', 'shotSpeed'][ctx.int(6)]
    var span = { damage: [-0.5, 1], tears: [-0.4, 0.8], speed: [-0.1, 0.2], range: [-40, 60], luck: [-1, 2], shotSpeed: [-0.15, 0.2] }[k]
    g[k] += ctx.range(span[0], span[1])
    IS.recalcStats(p)
  }

  // Generated from docs/reference/slices/items-8.json. Declarative effects are
  // preferred; hooks use only ARCHITECTURE §5.2 names and seeded ctx RNG.

  IS.defineItems([
    {
      id: "tinytoma",
      familiars: ["tinytoma-big"],
      num: 645,
      name: "Tinytoma",
      desc: "Large orbital that blocks shots",
      info: "Large orbital that blocks shots · Deals 3.5 contact damage per second · Splits into smaller versions of itself upon taking 3 hits · The smaller versions break into blue spiders · Respawns 5 seconds after fully disappearing",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure", "baby-shop"],
      tags: ["offensive"],
      dlc: "antibirth",
      unlock: null
    },

    {
      id: "brimstone-bombs",
      num: 646,
      name: "Brimstone Bombs",
      desc: "+5 Bombs",
      info: "+5 Bombs · Isaac's bombs release a 4-way blood beam · The beams don't hurt Isaac",
      kind: "passive",
      quality: 2,
      pools: ["devil", "greed-devil", "bomb-bum"],
      tags: ["bombs"],
      dlc: "repentance",
      grant: {"bombs":5},
      unlock: null
    },

    {
      id: "4-5-volt",
      num: 647,
      name: "4.5 Volt",
      desc: "Clearing rooms no longer charges active items",
      info: "Clearing rooms no longer charges active items · Dealing damage to enemies slowly fills up the charge bar · Damage needed per charge increases each floor",
      kind: "passive",
      quality: 2,
      pools: ["shop", "battery-bum", "greed-shop"],
      tags: ["offensive"],
      dlc: "repentance",
      tearFlags: ["slow"],
      unlock: null
    },

    {
      id: "item-648",
      num: 648,
      name: "Unused Item 648",
      desc: "<Item does not exist>",
      info: "<Item does not exist>",
      kind: "passive",
      quality: 2,
      pools: [],
      tags: ["utility"],
      dlc: "rebirth",
      unlock: null
    },

    {
      id: "fruity-plum",
      num: 649,
      name: "Fruity Plum",
      desc: "Propels herself diagonally around the room, firing tears in her path that deal 3 damage",
      info: "Propels herself diagonally around the room, firing tears in her path that deal 3 damage · Deals 6 contact damage per second",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "key-master", "greed-treasure", "crane-game", "baby-shop"],
      tags: ["familiar", "baby", "offensive", "tears"],
      dlc: "repentance",
      familiars: ["fruity-plum"],
      unlock: null
    },

    {
      id: "plum-flute",
      num: 650,
      name: "Plum Flute",
      desc: "Summons a friendly Baby Plum in the room for 10 seconds",
      info: "Summons a friendly Baby Plum in the room for 10 seconds",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-treasure", "ultra-secret"],
      tags: ["utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.spawnFamiliar !== 'function') return { fail: true }; ctx.spawnFamiliar('plum-flute', {life:10}) } },
      unlock: null
    },

    {
      id: "star-of-bethlehem",
      num: 651,
      name: "Star of Bethlehem",
      desc: "Slowly travels from the first room of the floor to the Boss Room",
      info: "Slowly travels from the first room of the floor to the Boss Room · Moves faster if you're ahead of it, and slower if you're behind it · Standing in its aura grants: · ↑ x2.5 Tears multiplier · ↑ x1.8 Damage multiplier · Homing tears · 50% chance to ignore damage",
      kind: "passive",
      quality: 2,
      pools: ["angel", "greed-angel"],
      tags: ["offensive", "tears"],
      dlc: "repentance",
      hooks: { onTearFire: function (p, tear, ctx) { if(ctx && ctx.roll(0.25,0.05,1)){ for(var i=0;i<["homing","slow"].length;i++) tear.flags.add(["homing","slow"][i]) } } },
      unlock: null
    },

    {
      id: "cube-baby",
      num: 652,
      name: "Cube Baby",
      desc: "Can be kicked around by walking into it",
      info: "Can be kicked around by walking into it · Slows and deals up to 17.5 contact damage depending on speed · Freezes enemies it kills",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["familiar", "baby", "offensive"],
      dlc: "repentance",
      transform: "conjoined",
      tearFlags: ["slow", "freeze"],
      familiars: ["cube-baby"],
      unlock: null
    },

    {
      id: "vade-retro",
      num: 653,
      name: "Vade Retro",
      desc: "Holding the item causes non-ghost enemies to spawn small red ghosts on death",
      info: "Holding the item causes non-ghost enemies to spawn small red ghosts on death · Using the item causes the ghosts to explode · Using the item also kills any ghost enemies (including bosses) that have less than 50% HP left",
      kind: "active",
      quality: 2,
      pools: ["angel", "greed-angel"],
      tags: ["utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.spawnFamiliar !== 'function') return { fail: true }; ctx.spawnFamiliar('vade-retro', {life:10}) } },
      unlock: null
    },

    {
      id: "false-phd",
      num: 654,
      name: "False PHD",
      desc: "+1 Black Heart",
      info: "+1 Black Heart · Identifies all pills · Converts all good pills into bad pills · ↑ Eating a stat down pill grants +0.6 damage · Eating other bad pills spawns a Black Heart",
      kind: "passive",
      quality: 2,
      pools: ["devil", "red-chest", "curse", "greed-curse", "greed-devil", "ultra-secret"],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "repentance",
      grant: {"black":2},
      unlock: null
    },

    {
      id: "spin-to-win",
      num: 655,
      name: "Spin to Win",
      desc: "Passively grants an orbital that blocks enemy shots and deals 10.5 contact damage per second",
      info: "Passively grants an orbital that blocks enemy shots and deals 10.5 contact damage per second · Using the item grants: · ↑ +0.5 Speed · Increases speed and damage of orbitals",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-treasure", "crane-game"],
      tags: ["offensive", "utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
      unlock: null
    },

    {
      id: "damocles-656",
      // APPROXIMATE: only pedestals present when a room is first entered are doubled (items that appear later, e.g. boss rewards, are not).
      hooks: {
        onRoomEnter: function (p, room, ctx) {
          if (!ctx || !room || !room.firstVisit || room.type === 'shop' || !room.pickups) return
          var list = room.pickups.slice()
          for (var i = 0; i < list.length; i++) {
            var pu = list[i]
            if (!pu || pu.kind !== 'item' || pu.taken || pu.dead || pu.removed || pu.price > 0 || pu.shop || pu.meta && pu.meta.damocles) continue
            var c = IS.spawnPedestal(room, pu.itemId || pu.id, pu.x + 60, pu.y, { pool: pu.pool })
            if (c) { c.meta = c.meta || {}; c.meta.damocles = true; pu.meta = pu.meta || {}; pu.meta.damocles = true }
          }
        },
        onPlayerHurt: function (p) { p.cache.dam = true },
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !p.cache.dam || p.dead || !ctx.run) return
          if ((p.status && p.status.invincible > 0) || ctx.run.time < p.invulnUntil) return
          if (!ctx.chance(0.00005)) return
          p.hearts.red = 0; p.hearts.soul = 0; p.hearts.black = 0; p.hearts.bone = 0
          IS.killPlayer(p, ctx)
        }
      },
      num: 656,
      name: "Damocles",
      desc: "Hangs a sword above Isaac's head, which doubles all pedestal items",
      info: "Hangs a sword above Isaac's head, which doubles all pedestal items · Does not double items that have a price or come from chests · After taking any damage, the sword has an extremely low chance to instantly kill Isaac every frame · Invincibility effects can prevent the death",
      kind: "passive",
      quality: 2,
      pools: [],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "antibirth",
      unlock: null
    },

    {
      id: "vasculitis",
      hooks: {
        onEnemyKill: function (p, enemy, ctx) {
          if (!ctx || !enemy) return
          var a0 = ctx.range(0, 6.2832)
          for (var i = 0; i < 5; i++) {
            var a = a0 + i * 6.2832 / 5
            var t = IS.spawnTear({ x: enemy.x, y: enemy.y, vx: Math.cos(a) * IS.TEAR_SPEED * 0.8, vy: Math.sin(a) * IS.TEAR_SPEED * 0.8, dmg: 0.6 * p.stats.damage, r: 7, life: 0.5, friendly: true, flags: new Set() }, ctx)
            if (t) IS.applyTearFlags(t, p)
          }
        }
      },
      num: 657,
      name: "Vasculitis",
      desc: "Enemies explode into tears upon death, which inherit the effects upon death",
      info: "Enemies explode into tears upon death, which inherit the effects upon death",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure", "ultra-secret"],
      tags: ["offensive", "tears"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "giant-cell",
      hooks: {
        onPlayerHurt: function (p, n, src, ctx) {
          if (!ctx || typeof ctx.spawnFamiliar !== 'function') return
          var alive = 0
          for (var i = 0; i < (p.familiars || []).length; i++) if (p.familiars[i].id === 'minisaac') alive++
          if (alive < 4) ctx.spawnFamiliar('minisaac')
        }
      },
      num: 658,
      name: "Giant Cell",
      desc: "Taking damage spawns a Minisaac",
      info: "Taking damage spawns a Minisaac · Minisaacs chase and shoot at nearby enemies",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "tropicamide",
      num: 659,
      name: "Tropicamide",
      desc: "↑ +2.5 Range",
      info: "↑ +2.5 Range · ↑ +0.22 Tear size",
      kind: "passive",
      quality: 2,
      pools: ["boss", "greed-boss"],
      tags: ["offensive", "tears"],
      dlc: "repentance",
      stats: {"range":60},
      unlock: null
    },

    {
      id: "card-reading",
      // APPROXIMATE: three portals (red boss, yellow treasure, blue secret) in the first room of each floor; walking into one teleports to that room type (no teleport if the floor has no such room).
      hooks: {
        onNewFloor: function (p, floor, ctx) {
          var room = ctx && (ctx.room || (ctx.run && ctx.run.room))
          if (!room || !room.pxW) return
          var y = room.pxH * 0.3
          p.cache.portals = { room: room, fx: 0, list: [
            { kind: 'boss', colour: '#d03030', x: room.pxW * 0.3, y: y },
            { kind: 'treasure', colour: '#e8c840', x: room.pxW * 0.5, y: y },
            { kind: 'secret', colour: '#4080e0', x: room.pxW * 0.7, y: y }
          ] }
        },
        onUpdate: function (p, dt, ctx) {
          var pt = p.cache.portals
          if (!pt || !ctx) return
          if (ctx.room !== pt.room) { p.cache.portals = null; return }
          pt.fx -= dt
          for (var i = 0; i < pt.list.length; i++) {
            var q = pt.list[i]
            if (pt.fx <= 0) ctx.spawnEffect('ring', q.x, q.y, { colour: q.colour, r0: 6, r1: 30, life: 0.5, width: 3 })
            if (IS.dist(p.x, p.y, q.x, q.y) < 40) {
              p.cache.portals = null
              if (!ctx.teleport(q.kind)) p.cache.portals = pt
              return
            }
          }
          if (pt.fx <= 0) pt.fx = 0.6
        }
      },
      num: 660,
      name: "Card Reading",
      desc: "Spawns two portals in the first room of each floor",
      info: "Spawns two portals in the first room of each floor · Leaving the room despawns the portals · Red: Boss Room · Yellow: Item Room · Blue: Secret Room",
      kind: "passive",
      quality: 2,
      pools: ["shop"],
      tags: ["utility"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "quints",
      num: 661,
      name: "Quints",
      desc: "Killing an enemy spawns a stationary familiar in its place",
      info: "Killing an enemy spawns a stationary familiar in its place · Caps at 5 familiars",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "greed-treasure", "baby-shop"],
      tags: ["familiar", "baby", "offensive"],
      dlc: "repentance",
      transform: "conjoined",
      familiars: ["quints"],
      unlock: null
    },

    {
      id: "item-662",
      num: 662,
      name: "Unused Item 662",
      desc: "<Item does not exist>",
      info: "<Item does not exist>",
      kind: "passive",
      quality: 2,
      pools: [],
      tags: ["utility"],
      dlc: "rebirth",
      unlock: null
    },

    {
      id: "tooth-and-nail",
      hooks: {
        onUpdate: function (p, dt) {
          p.cache.tnT = (p.cache.tnT || 0) + dt
          if (p.cache.tnT >= 6) { p.cache.tnT -= 6; p.status.invincible = Math.max(p.status.invincible || 0, 1) }
        }
      },
      num: 663,
      name: "Tooth and Nail",
      desc: "1 second of invincibility every 6 seconds",
      info: "1 second of invincibility every 6 seconds · Isaac flashes right before the effect triggers",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["defensive", "hearts"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "binge-eater",
      num: 664,
      name: "Binge Eater",
      desc: "↑ +1 Health",
      info: "↑ +1 Health · Full health · Item pedestals cycle between their item and a food item · Picking up a food item grants: · Heal 2 hearts · ↑ Temporary +3.6 damage · ↑ 2 permanent stat ups (depending on the food) · ↓ -0.03 speed",
      kind: "passive",
      quality: 2,
      pools: ["secret", "greed-secret"],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "repentance",
      grant: {"maxHearts":2,"heal":2},
      unlock: null
    },

    {
      id: "guppys-eye",
      // APPROXIMATE: marks chests and sacks as pu.revealed = true, but no renderer reads it yet (see ENGINE REQUESTS).
      hooks: {
        onUpdate: function (p, dt, ctx) {
          var room = ctx && ctx.room
          if (!room || !room.pickups) return
          for (var i = 0; i < room.pickups.length; i++) {
            var pu = room.pickups[i]
            if (pu && (pu.kind === 'chest' || pu.kind === 'sack') && !pu.revealed) pu.revealed = true
          }
        }
      },
      num: 665,
      name: "Guppy's Eye",
      desc: "Reveals the contents of chests, sacks, shopkeepers, and fireplaces before they're opened or destroyed",
      info: "Reveals the contents of chests, sacks, shopkeepers, and fireplaces before they're opened or destroyed",
      kind: "passive",
      quality: 2,
      pools: ["devil", "red-chest", "greed-devil"],
      tags: ["utility"],
      dlc: "repentance",
      transform: "guppy",
      unlock: null
    },

    {
      id: "item-666",
      num: 666,
      name: "Unused Item 666",
      desc: "<Item does not exist>",
      info: "<Item does not exist>",
      kind: "passive",
      quality: 2,
      pools: [],
      tags: ["utility"],
      dlc: "rebirth",
      unlock: null
    },

    {
      id: "strawman",
      num: 667,
      name: "Strawman",
      desc: "+1 Bomb",
      info: "+1 Bomb · Spawns Keeper as a second character · When he dies, spawns blue spiders and permanently removes Strawman and any item that he has picked up from the inventory · Devil Room items cost coins while Strawman is alive · Strawman can pick up story items",
      kind: "familiar",
      quality: 2,
      pools: ["secret", "greed-shop", "greed-secret"],
      tags: ["familiar", "baby", "coins", "bombs"],
      dlc: "repentance",
      grant: {"bombs":1},
      familiars: ["strawman"],
      unlock: null
    },

    {
      id: "dads-note",
      // APPROXIMATE: sets run.flags.ascent = true; floor.js does not read it yet and trinket-to-cracked-key conversion is skipped (see ENGINE REQUESTS).
      hooks: {
        onInit: function (p, ctx) {
          if (!ctx || !ctx.run || p.cache['dads-note:init']) return
          p.cache['dads-note:init'] = true
          ctx.run.flags = ctx.run.flags || {}
          ctx.run.flags.ascent = true
        }
      },
      num: 668,
      name: "Dad's Note",
      desc: "Begins the Ascent",
      info: "Begins the Ascent · Trinkets left in previous Treasure or Boss Rooms turn into Cracked Keys",
      kind: "passive",
      quality: 2,
      pools: [],
      tags: ["keys"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "sausage",
      num: 669,
      name: "Sausage",
      desc: "↑ +1 Health",
      info: "↑ +1 Health · ↑ +0.2 Speed · ↑ +0.5 Tears · ↑ +0.5 Damage · ↑ +2.5 Range · ↑ +0.16 Shot speed · ↑ +1 Luck · Full health · ↑ +6.9% Devil/Angel Room chance · ↑ +6.9% Planetarium chance",
      kind: "passive",
      quality: 2,
      pools: ["secret", "greed-secret"],
      tags: ["offensive", "tears", "defensive", "hearts"],
      dlc: "antibirth",
      stats: {"tears":0.5,"damage":0.5,"shotSpeed":0.16,"speed":0.2,"luck":1,"range":60},
      grant: {"maxHearts":2,"heal":2},
      unlock: null
    },

    {
      id: "options",
      // APPROXIMATE: the engine has no baseline room reward to double, so it offers a choice of two random basic pickups after clearing a combat room.
      hooks: {
        onRoomClear: function (p, room, ctx) {
          if (!ctx || !room || !room.hadEnemies || room.type !== 'default' || !room.pxW) return
          var kinds = ['coin', 'heart', 'bomb', 'key']
          var a = ctx.pick(kinds)
          var rest = []
          for (var i = 0; i < kinds.length; i++) if (kinds[i] !== a) rest.push(kinds[i])
          var b = ctx.pick(rest)
          var g = 'opt' + room.index
          IS.spawnPickup(room, a, room.pxW / 2 - 50, room.pxH / 2, { options: g })
          IS.spawnPickup(room, b, room.pxW / 2 + 50, room.pxH / 2, { options: g })
        }
      },
      num: 670,
      name: "Options?",
      desc: "Allows Isaac to choose from two different room clear rewards",
      info: "Allows Isaac to choose from two different room clear rewards",
      kind: "passive",
      quality: 2,
      pools: ["shop"],
      tags: ["utility"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "candy-heart",
      // APPROXIMATE: every red heart picked up gives one random small permanent stat up (stat amounts are estimates).
      hooks: {
        onInit: function (p, ctx) {
          if (!ctx || !ctx.room || p.cache['candy-heart:init']) return
          p.cache['candy-heart:init'] = true
          IS.spawnPickup(ctx.room, 'heart', p.x + 50, p.y, {})
        },
        onPickup: function (p, kind, amount, ctx) {
          if (kind !== 'heart' || !ctx) return
          var i = ctx.int(5)
          if (i === 0) p.base.damage += 0.3
          else if (i === 1) p.base.tears += 0.2
          else if (i === 2) p.base.speed += 0.03
          else if (i === 3) p.base.range += 10
          else p.base.luck += 0.2
          IS.recalcStats(p)
        }
      },
      num: 671,
      name: "Candy Heart",
      desc: "↑ Healing with Red Hearts grants random permanent stat ups",
      info: "↑ Healing with Red Hearts grants random permanent stat ups · Spawns a Red Heart",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure", "ultra-secret"],
      tags: ["defensive", "hearts"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "a-pound-of-flesh",
      // APPROXIMATE: Devil Room deals are re-priced in coins (15) and Shop items in heart containers (2 half hearts) by editing pedestal priceType/price; the engine does not yet charge priceType 'heart' for shop pedestals (see ENGINE REQUESTS).
      hooks: {
        onRoomEnter: function (p, room, ctx) {
          if (!room || !room.pickups || (room.type !== 'devil' && room.type !== 'shop')) return
          for (var i = 0; i < room.pickups.length; i++) {
            var pu = room.pickups[i]
            if (!pu || pu.kind !== 'item' || pu.taken || pu.dead || pu.removed || (pu.meta && pu.meta.flesh)) continue
            pu.meta = pu.meta || {}
            pu.meta.flesh = true
            if (room.type === 'devil' && pu.priceType === 'heart') { pu.priceType = 'coin'; pu.price = 15; pu.soulPrice = 0 }
            else if (room.type === 'shop' && pu.price > 0 && pu.priceType === 'coin') { pu.priceType = 'heart'; pu.price = 2; pu.soulPrice = 0 }
          }
        }
      },
      num: 672,
      name: "A Pound of Flesh",
      desc: "Devil Room items cost coins",
      info: "Devil Room items cost coins · Shop items cost hearts · Consumables in Shops are surrounded by spikes",
      kind: "passive",
      quality: 2,
      pools: ["devil", "demon-beggar"],
      tags: ["defensive", "hearts", "coins"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "redemption",
      hooks: {
        onRoomEnter: function (p, room, ctx) {
          if (!room || room.type !== 'devil' || !room.pickups || p.cache.redRoom === room) return
          var n = 0
          for (var i = 0; i < room.pickups.length; i++) { var pu = room.pickups[i]; if (pu && pu.kind === 'item' && !pu.taken && !pu.dead && !pu.removed) n++ }
          p.cache.redRoom = room
          p.cache.redCount = n
        },
        onNewFloor: function (p, floor, ctx) {
          var room = p.cache.redRoom
          if (!room) return
          p.cache.redRoom = null
          var n = 0
          for (var i = 0; i < (room.pickups || []).length; i++) { var pu = room.pickups[i]; if (pu && pu.kind === 'item' && !pu.taken && !pu.dead && !pu.removed) n++ }
          if (p.cache.redCount > 0 && n === p.cache.redCount) {
            p.cache.redUps = (p.cache.redUps || 0) + 1
            IS.addSoulHearts(p, 2)
            IS.recalcStats(p)
          }
        },
        onStats: function (p, s) { s.damage += p.cache.redUps || 0 }
      },
      num: 673,
      name: "Redemption",
      desc: "Entering a new floor after visiting a Devil Room and not taking any item/pickup grants:",
      info: "Entering a new floor after visiting a Devil Room and not taking any item/pickup grants: · ↑ +1 Damage · +1 Soul Heart",
      kind: "passive",
      quality: 2,
      pools: [],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "spirit-shackles",
      // APPROXIMATE: revives with half a heart and 3s invincibility instead of the 10s ghost form; recharges when a soul/black heart is picked up.
      hooks: {
        onPlayerDeath: function (p, ctx) {
          if (p.cache.shackles === 'used') return
          p.cache.shackles = 'used'
          p.hearts.maxRed = Math.max(p.hearts.maxRed, 1)
          p.hearts.red = 1; p.hearts.soul = 0; p.hearts.black = 0
          p.status.invincible = 3
          return { revive: true }
        },
        onPickup: function (p, kind) { if (kind === 'soul' || kind === 'black') p.cache.shackles = 'ready' }
      },
      num: 674,
      name: "Spirit Shackles",
      desc: "Taking fatal damage transforms Isaac into a ghost chained to his dead body and allows him to continue to fight with half a heart",
      info: "Taking fatal damage transforms Isaac into a ghost chained to his dead body and allows him to continue to fight with half a heart · If the ghost survives, Isaac revives after 10 seconds · Must be recharged by picking up a Soul Heart",
      kind: "passive",
      quality: 2,
      pools: ["secret", "greed-shop", "greed-secret"],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "cracked-orb",
      // APPROXIMATE: unlocks locked doors, reveals one random unknown room and breaks tinted rocks; secret-room walls and crawlspaces are not affected.
      hooks: {
        onPlayerHurt: function (p, n, src, ctx) {
          var room = ctx && ctx.room
          if (!room) return
          var doors = room.doors || []
          for (var i = 0; i < doors.length; i++) {
            var d = doors[i]
            if (d && d.locked) { d.locked = false; d.keys = 0; if (!d.hidden && (room.cleared || !(room.enemies && room.enemies.length))) d.open = true }
          }
          var rooms = (ctx.run && ctx.run.floor && ctx.run.floor.rooms) || []
          var unknown = []
          for (var j = 0; j < rooms.length; j++) if (rooms[j] && !rooms[j].mapKnown && !rooms[j].visited) unknown.push(rooms[j])
          if (unknown.length) ctx.pick(unknown).mapKnown = true
          var grid = (room.grid || []).slice()
          for (var k = 0; k < grid.length; k++) if (grid[k] && grid[k].kind === 'tinted-rock') IS.destroyGrid(room, grid[k], ctx)
        }
      },
      num: 675,
      name: "Cracked Orb",
      desc: "Taking damage:",
      info: "Taking damage: · Unlocks all locked doors in the room · Reveals a random room on the map · Destroys all tinted and crawlspace rocks",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "secret", "greed-treasure"],
      tags: ["offensive", "keys"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "empty-heart",
      hooks: {
        onNewFloor: function (p) { if (p.hearts.red <= 1) IS.addMaxHearts(p, 2, false) }
      },
      num: 676,
      name: "Empty Heart",
      desc: "+1 Empty heart container when at 1 Red Heart or less at the start of a new floor",
      info: "+1 Empty heart container when at 1 Red Heart or less at the start of a new floor",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "demon-beggar", "greed-treasure"],
      tags: ["defensive", "hearts"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "astral-projection",
      num: 677,
      name: "Astral Projection",
      desc: "Taking damage in an uncleared room grants for the fight:",
      info: "Taking damage in an uncleared room grants for the fight: · Spectral tears · Flight · Negates the next damage taken · Stops time for 2 seconds · Greatly increases speed and fire rate for 2 seconds",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "secret", "greed-treasure", "greed-secret"],
      tags: ["offensive", "tears"],
      dlc: "repentance",
      tearFlags: ["spectral"],
      unlock: null
    },

    {
      id: "c-section",
      num: 678,
      name: "C Section",
      desc: "Replaces Isaac's tears with a charge attack that shoots homing, spectral fetus tears",
      info: "Replaces Isaac's tears with a charge attack that shoots homing, spectral fetus tears · Fetus tears deal about 2.8x Isaac's damage per second",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears"],
      dlc: "repentance",
      tearFlags: ["spectral", "homing"],
      unlock: null
    },

    {
      id: "lil-abaddon",
      num: 679,
      name: "Lil Abaddon",
      desc: "Familiar that charges and unleashes a Maw of the Void circle",
      info: "Familiar that charges and unleashes a Maw of the Void circle · It deals 52.5 damage over 1 second",
      kind: "familiar",
      quality: 2,
      pools: ["devil", "greed-devil", "baby-shop"],
      tags: ["familiar", "baby", "offensive"],
      dlc: "repentance",
      transform: "conjoined",
      familiars: ["lil-abaddon"],
      unlock: null
    },

    {
      id: "montezumas-revenge",
      // APPROXIMATE: while firing, charges 1.2s then releases a 200-unit cone blast behind Isaac for 4x damage (the real item fires a backwards charged beam).
      hooks: {
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room || !IS.input || !IS.input.shoot) return
          var d = IS.input.shoot()
          if (!d || (!d.x && !d.y)) { p.cache.mrT = 0; return }
          p.cache.mrT = (p.cache.mrT || 0) + dt
          if (p.cache.mrT < 1.2) return
          p.cache.mrT = 0
          var ang = Math.atan2(-d.y, -d.x)
          var es = IS.roomEnemies(ctx.room)
          for (var i = 0; i < es.length; i++) {
            var e = es[i]
            if (!e || e.dead || e.friendly || IS.dist(p.x, p.y, e.x, e.y) > 200 + e.r) continue
            var diff = Math.atan2(e.y - p.y, e.x - p.x) - ang
            diff = Math.atan2(Math.sin(diff), Math.cos(diff))
            if (Math.abs(diff) <= 0.6) IS.damageEnemy(e, 4 * p.stats.damage, { src: p, silent: true }, ctx)
          }
          IS.spawnLaser({ x: p.x, y: p.y, angle: ang, len: 200, width: 20, life: 0.25, dmg: 0, friendly: true }, ctx)
        }
      },
      num: 680,
      name: "Montezuma's Revenge",
      desc: "Firing charges up a short-ranged high damage backwards beam",
      info: "Firing charges up a short-ranged high damage backwards beam · Does not replace Isaac's tears",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "lil-portal",
      num: 681,
      name: "Lil Portal",
      desc: "Deals contact damage and flies forward",
      info: "Deals contact damage and flies forward · Consumes pickups in its path · Each pickup consumed increases its size, damage, and spawns a blue fly · Consuming four pickups spawns a portal to an unexplored room",
      kind: "familiar",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["familiar", "baby", "offensive"],
      dlc: "repentance",
      familiars: ["lil-portal"],
      unlock: null
    },

    {
      id: "worm-friend",
      num: 682,
      name: "Worm Friend",
      desc: "Sometimes bursts out of the ground and grabs an enemy",
      info: "Sometimes bursts out of the ground and grabs an enemy · Grabbed enemies take 8 damage per second, are slowed and cannot move",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure", "ultra-secret", "baby-shop"],
      tags: ["offensive"],
      dlc: "repentance",
      tearFlags: ["slow"],
      unlock: null
    },

    {
      id: "bone-spurs",
      hooks: {
        onEnemyKill: function (p, enemy, ctx) {
          if (!ctx || !enemy || typeof ctx.spawnFamiliar !== 'function') return
          var n = 0
          for (var i = 0; i < (p.familiars || []).length; i++) if (p.familiars[i].id === 'bone-shard') n++
          if (n >= 8) return
          var f = ctx.spawnFamiliar('bone-shard')
          if (f) { f.x = enemy.x; f.y = enemy.y }
        }
      },
      num: 683,
      name: "Bone Spurs",
      desc: "Enemies spawn bone shards on death",
      info: "Enemies spawn bone shards on death · Bones block projectiles and deal contact damage",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "hungry-soul",
      hooks: {
        onEnemyKill: function (p, enemy, ctx) {
          if (!ctx || !enemy || typeof ctx.spawnFamiliar !== 'function' || !ctx.chance(0.33)) return
          var f = ctx.spawnFamiliar('hungry-ghost')
          if (f) { f.x = enemy.x; f.y = enemy.y }
        }
      },
      num: 684,
      name: "Hungry Soul",
      desc: "Killing an enemy has a 33% chance to spawn a ghost",
      info: "Killing an enemy has a 33% chance to spawn a ghost · Ghosts chase enemies, deal contact damage and explode after 5 seconds · Isaac doesn't take damage from the explosion",
      kind: "passive",
      quality: 2,
      pools: ["devil", "greed-devil", "ultra-secret"],
      tags: ["offensive"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "jar-of-wisps",
      num: 685,
      name: "Jar of Wisps",
      desc: "Spawns a random wisp",
      info: "Spawns a random wisp · Spawns one additional wisp with each use, up to 12",
      kind: "active",
      quality: 2,
      pools: ["angel", "greed-angel"],
      tags: ["utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.spawnFamiliar !== 'function') return { fail: true }; ctx.spawnFamiliar('jar-of-wisps', {life:10}) } },
      unlock: null
    },

    {
      id: "soul-locket",
      num: 686,
      name: "Soul Locket",
      desc: "↑ Picking up Soul Hearts grants random permanent stat ups",
      info: "↑ Picking up Soul Hearts grants random permanent stat ups · Spawns a Soul Heart",
      kind: "passive",
      quality: 2,
      pools: ["angel", "greed-angel"],
      tags: ["defensive", "hearts"],
      dlc: "repentance",
      grant: {"soul":2},
      unlock: null
    },

    {
      id: "friend-finder",
      num: 687,
      name: "Friend Finder",
      desc: "Spawns a random friendly monster that mimics Isaac's movements and attacks",
      info: "Spawns a random friendly monster that mimics Isaac's movements and attacks",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-treasure", "crane-game"],
      tags: ["utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.spawnFamiliar !== 'function') return { fail: true }; ctx.spawnFamiliar('friend-finder', {life:10}) } },
      unlock: null
    },

    {
      id: "inner-child",
      // APPROXIMATE: the size shrink is cosmetic and skipped; each copy gives one revive (half a red heart) and +0.2 speed.
      hooks: {
        onPlayerDeath: function (p, ctx) {
          if ((p.cache.icUsed || 0) >= IS.itemCount(p, 'inner-child')) return
          p.cache.icUsed = (p.cache.icUsed || 0) + 1
          p.hearts.maxRed = Math.max(p.hearts.maxRed, 1)
          p.hearts.red = 1; p.hearts.soul = 0; p.hearts.black = 0
          p.base.speed += 0.2
          IS.recalcStats(p)
          return { revive: true }
        }
      },
      num: 688,
      name: "Inner Child",
      desc: "+1 Life",
      info: "+1 Life · Upon death: · Respawns Isaac in the same room with half a heart · ↑ +0.2 Speed · ↑ Massive size down",
      kind: "passive",
      quality: 2,
      pools: ["secret", "greed-shop", "greed-secret"],
      tags: ["defensive", "hearts"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "glitched-crown",
      hooks: {
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          p.cache.gcT = (p.cache.gcT || 0) - dt
          if (p.cache.gcT > 0) return
          p.cache.gcT = 0.4
          var list = ctx.pickups()
          for (var i = 0; i < list.length; i++) {
            var pu = list[i]
            if (!pu || pu.kind !== 'item' || pu.taken || pu.dead || pu.price || pu.shop) continue
            if (!pu.glitch) {
              pu.glitch = [pu.id]
              for (var k = 0; k < 4; k++) {
                var nid = IS.rollItem(ctx.run, pu.pool || 'treasure', { noRemove: true })
                if (nid) pu.glitch.push(nid)
              }
              pu.glitchI = 0
            }
            pu.glitchI = (pu.glitchI + 1) % pu.glitch.length
            swapPedestal(pu, pu.glitch[pu.glitchI])
          }
        }
      },
      num: 689,
      name: "Glitched Crown",
      desc: "Item pedestals quickly cycle between 5 random items",
      info: "Item pedestals quickly cycle between 5 random items",
      kind: "passive",
      quality: 2,
      pools: ["secret", "greed-shop", "greed-secret"],
      tags: ["utility"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "belly-jelly",
      // APPROXIMATE: enemy bounce happens on overlap each 0.25s (no true elastic collision); lasers and slams are not deflected.
      hooks: {
        onPlayerDamage: function (p, n, src, ctx) {
          if (!src || typeof src === 'string' || !ctx) return
          var enemy = src.def != null || src.kind === 'contact'
          if (enemy) {
            if (src.x != null) IS.knockback(src, p.x, p.y, 500)
            if (ctx.chance(0.5)) return { cancel: true }
            return
          }
          if (src.friendly === false && src.vx !== undefined && src.flags) {
            if (ctx.chance(0.5)) {
              src.vx = -src.vx
              src.vy = -src.vy
              src.friendly = true
              return { cancel: true }
            }
          }
        },
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          var list = IS.roomEnemies(ctx.room)
          for (var i = 0; i < list.length; i++) {
            var e = list[i]
            if (!e || e.dead || e.boss || e.spawnT > 0) continue
            if ((e.bellyT || 0) > ctx.run.time) continue
            if (IS.dist(p.x, p.y, e.x, e.y) < (e.r || 16) + p.r) {
              IS.knockback(e, p.x, p.y, 360)
              e.bellyT = ctx.run.time + 0.25
            }
          }
        }
      },
      num: 690,
      name: "Belly Jelly",
      desc: "Enemies bounce off of Isaac",
      info: "Enemies bounce off of Isaac · 50% chance to negate contact damage · 50% chance to deflect enemy projectiles",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "sacred-orb",
      // APPROXIMATE: pedestals already spawned are rerolled (quality 0-1 always, quality 4 with 33%); the item pools themselves are untouched.
      hooks: {
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          var list = ctx.pickups()
          for (var i = 0; i < list.length; i++) {
            var pu = list[i]
            if (!pu || pu.kind !== 'item' || pu.taken || pu.dead || pu.sacredChecked || pu.glitch) continue
            pu.sacredChecked = true
            var def = IS.itemsById[pu.id]
            if (!def) continue
            var q = def.quality || 0
            if (q <= 1 || (q >= 4 && ctx.chance(0.33))) {
              for (var t = 0; t < 6; t++) {
                var nid = IS.rollItem(ctx.run, pu.pool || 'treasure')
                var nd = nid && IS.itemsById[nid]
                if (nd && (nd.quality || 0) >= 2 && (nd.quality || 0) < 4) { swapPedestal(pu, nid); break }
              }
            }
          }
        }
      },
      num: 691,
      name: "Sacred Orb",
      desc: "Prevents Quality / items from spawning",
      info: "Prevents Quality / items from spawning · Quality items have a 33% chance to be rerolled",
      kind: "passive",
      quality: 2,
      pools: ["angel", "secret", "greed-shop", "greed-angel", "greed-secret"],
      tags: ["utility"],
      dlc: "repentance",
      transform: "seraphim",
      unlock: null
    },

    {
      id: "sanguine-bond",
      hooks: {
        onRoomEnter: function (p, room, ctx) {
          if (!room || !ctx || room.type !== 'devil' || room.sbSpikes) return
          room.sbSpikes = true
          var cx = room.pxW / 2, cy = room.pxH / 2, T = IS.TILE || 80
          var spots = [[0, 2], [0, -2], [2, 2], [-2, 2], [2, -2], [-2, -2]]
          for (var i = 0; i < spots.length; i++) {
            if (IS.addGrid(room, 'spikes', cx + spots[i][0] * T, cy + spots[i][1] * T, null)) break
          }
        },
        onPlayerHurt: function (p, n, src, ctx) {
          if (src !== 'spikes' || !ctx || !ctx.room || ctx.room.type !== 'devil') return
          var r = ctx.range(0, 1)
          if (r < 0.35) return
          if (r < 0.68) { p.cache.sbUps = (p.cache.sbUps || 0) + 1; IS.recalcStats(p); return }
          if (r < 0.83) { ctx.addCoins(6); return }
          if (r < 0.93) { IS.addBlackHearts(p, 4); return }
          if (r < 0.98) {
            var id = IS.rollItem(ctx.run, 'devil')
            if (id) IS.spawnPedestal(ctx.room, id, ctx.room.pxW / 2, ctx.room.pxH / 2 - 120)
            return
          }
          p.transforms.leviathan = 3
          IS.checkTransforms(p, ctx)
        },
        onStats: function (p, s) { s.damage += 0.5 * (p.cache.sbUps || 0) }
      },
      num: 692,
      name: "Sanguine Bond",
      desc: "Spawns a set of spikes in the Devil Room",
      info: "Spawns a set of spikes in the Devil Room · Taking damage on the spikes grants: · 35%: Nothing · 33%: ↑ +0.5 Damage · 15%: 6 pennies · 10%: 2 Black Hearts · 5%: Random Devil item · 2%: Leviathan transformation",
      kind: "passive",
      quality: 2,
      pools: ["devil", "curse", "greed-shop", "greed-curse", "greed-devil", "ultra-secret"],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "the-swarm",
      familiars: ["swarm-fly", "swarm-fly", "swarm-fly", "swarm-fly", "swarm-fly", "swarm-fly", "swarm-fly", "swarm-fly"],
      hooks: {
        onRoomClear: function (p, room, ctx) {
          if (ctx && ctx.spawnFamiliar) ctx.spawnFamiliar('swarm-fly')
        }
      },
      num: 693,
      name: "The Swarm",
      desc: "Grants 8 orbital flies",
      info: "Grants 8 orbital flies · Clearing a room spawns a new fly · Flies turn into blue flies after blocking a shot",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "key-master", "greed-treasure"],
      tags: ["offensive"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "heartbreak",
      num: 694,
      name: "Heartbreak",
      desc: "↑ +0.25 Damage for each Broken Heart",
      info: "↑ +0.25 Damage for each Broken Heart · +3 Broken Hearts · Every fatal hit grants +2 Broken Hearts · Isaac dies at 12 Broken Hearts",
      kind: "passive",
      quality: 2,
      pools: ["devil", "curse", "greed-curse", "greed-devil", "ultra-secret"],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "repentance",
      stats: {"damage":0.75},
      unlock: null
    },

    {
      id: "bloody-gust",
      hooks: {
        onPlayerHurt: function (p) {
          if ((p.cache.gust || 0) >= 6) return
          p.cache.gust = (p.cache.gust || 0) + 1
          IS.recalcStats(p)
        },
        onNewFloor: function (p) {
          if (!p.cache.gust) return
          p.cache.gust = 0
          IS.recalcStats(p)
        },
        onStats: function (p, s) {
          var g = p.cache.gust || 0
          s.speed += 0.17 * g
          s.tears += 0.5 * g
        }
      },
      num: 695,
      name: "Bloody Gust",
      desc: "When taking damage, receive for the floor:",
      info: "When taking damage, receive for the floor: · ↑ Speed up · ↑ Fire rate up · Caps at +1.02 speed and +3 fire rate",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "devil", "greed-treasure", "greed-devil", "ultra-secret"],
      tags: ["offensive", "tears"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "salvation",
      // APPROXIMATE: the cross-shaped beam is a direct hit plus a ring effect, not a drawn beam.
      hooks: {
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.room) return
          var rad = 120 + 20 * (p.cache.halo || 0)
          var list = IS.roomEnemies(ctx.room)
          for (var i = 0; i < list.length; i++) {
            var e = list[i]
            if (!e || e.dead || e.spawnT > 0) continue
            if (IS.dist(p.x, p.y, e.x, e.y) <= rad + (e.r || 0)) {
              e.salv = (e.salv || 0) + dt
              if (e.salv >= 1.5) {
                e.salv = 0
                IS.damageEnemy(e, p.stats.damage * 2, { silent: true }, ctx)
                if (IS.fx && IS.fx.ring) IS.fx.ring(e.x, e.y, { colour: '#fff3b0', r0: 10, r1: 70, life: 0.3, width: 6 })
              }
            } else e.salv = 0
          }
        },
        onPlayerHurt: function (p) { p.cache.halo = (p.cache.halo || 0) + 1 },
        onNewFloor: function (p) { p.cache.halo = 0 }
      },
      num: 696,
      name: "Salvation",
      desc: "Isaac is surrounded by a halo",
      info: "Isaac is surrounded by a halo · Enemies that stand in the halo for too long are hit by a cross-shaped beam of light · Taking damage increases the size of the halo for the floor",
      kind: "passive",
      quality: 2,
      pools: ["angel", "greed-angel"],
      tags: ["offensive"],
      dlc: "repentance",
      transform: "seraphim",
      unlock: null
    },

    {
      id: "vanishing-twin",
      num: 697,
      name: "Vanishing Twin",
      desc: "Entering a boss room spawns a clone of the boss",
      info: "Entering a boss room spawns a clone of the boss · Defeating the clone spawns an extra item · The clone is slower and has 75% health",
      kind: "familiar",
      quality: 2,
      pools: ["secret", "curse"],
      tags: ["familiar", "baby", "defensive", "hearts"],
      dlc: "repentance",
      tearFlags: ["slow"],
      familiars: ["vanishing-twin"],
      unlock: null
    },

    {
      id: "twisted-pair",
      familiars: ["twisted-pair-a", "twisted-pair-b"],
      num: 698,
      name: "Twisted Pair",
      desc: "Two familiars that shoot tears with the same stats and effects as Isaac",
      info: "Two familiars that shoot tears with the same stats and effects as Isaac · They deal 37.5% of Isaac's damage",
      kind: "passive",
      quality: 2,
      pools: ["devil", "greed-devil", "baby-shop"],
      tags: ["offensive", "tears"],
      dlc: "repentance",
      transform: "conjoined",
      unlock: null
    },

    {
      id: "azazels-rage",
      hooks: {
        onRoomClear: function (p) {
          p.cache.rage = (p.cache.rage || 0) + 1
          if (p.cache.rage >= 4) p.cache.rageReady = true
        },
        onRoomEnter: function (p, room, ctx) {
          if (!room || !ctx || !p.cache.rageReady) return
          p.cache.rageReady = false
          p.cache.rage = 0
          var h = p.head || { x: 1, y: 0 }
          ctx.spawnLaser({ x: p.x, y: p.y - 10, angle: Math.atan2(h.y, h.x), len: 1600, width: 60, life: 0.8, tick: 0.06, dmg: p.stats.damage * 3, friendly: true })
        }
      },
      num: 699,
      name: "Azazel's Rage",
      desc: "Clearing 4 rooms fires a large Brimstone beam upon entering the next room",
      info: "Clearing 4 rooms fires a large Brimstone beam upon entering the next room",
      kind: "passive",
      quality: 2,
      pools: ["devil", "greed-devil"],
      tags: ["utility"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "echo-chamber",
      hooks: {
        onCardUse: function (p, id, ctx) { echoUse(p, 'card', id, ctx) },
        onPillUse: function (p, id, ctx) { echoUse(p, 'pill', id, ctx) }
      },
      num: 700,
      name: "Echo Chamber",
      desc: "Using a rune, card or pill also uses a copy of the last 3 runes/cards/pills used after picking up Echo Chamber",
      info: "Using a rune, card or pill also uses a copy of the last 3 runes/cards/pills used after picking up Echo Chamber",
      kind: "passive",
      quality: 2,
      pools: ["secret", "greed-shop", "greed-secret", "ultra-secret"],
      tags: ["utility"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "isaacs-tomb",
      hooks: {
        onNewFloor: function (p, floor, ctx) {
          if (!ctx || !ctx.room) return
          var room = ctx.room
          IS.spawnPickup(room, 'chest', room.pxW / 2 + 110, room.pxH / 2, { variant: 'old', locked: true })
        }
      },
      num: 701,
      name: "Isaac's Tomb",
      desc: "Spawns an Old Chest at the start of every floor",
      info: "Spawns an Old Chest at the start of every floor · Old Chests require a key to unlock and can contain Soul Hearts, trinkets or Mom, Dad and Angel items",
      kind: "passive",
      quality: 2,
      pools: ["secret", "greed-shop", "greed-secret"],
      tags: ["defensive", "hearts", "keys"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "vengeful-spirit",
      hooks: {
        onPlayerHurt: function (p, n, src, ctx) {
          if (!ctx || !ctx.spawnFamiliar) return
          var c = 0
          for (var i = 0; i < p.familiars.length; i++) if (p.familiars[i].id === 'vengeful-wisp') c++
          if (c < 6) ctx.spawnFamiliar('vengeful-wisp')
        },
        onNewFloor: function (p) {
          while (IS.removeFamiliar(p, 'vengeful-wisp')) { /* wisps do not last past the floor */ }
        }
      },
      num: 702,
      name: "Vengeful Spirit",
      desc: "Taking damage spawns an orbital wisp",
      info: "Taking damage spawns an orbital wisp · Wisps shoot tears, do not block shots and disappear on the next floor · Caps at 6 wisps",
      kind: "passive",
      quality: 2,
      pools: ["devil", "curse", "greed-curse", "greed-devil", "ultra-secret"],
      tags: ["offensive", "tears"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "esau-jr",
      num: 703,
      name: "Esau Jr.",
      desc: "Swaps between the current character and Esau Jr.",
      info: "Swaps between the current character and Esau Jr. · Esau Jr. has 3 Black Hearts, +2 Damage, flight, and random items equal to the number of items the player has the first time this item is used · Characters have independent items and health · Dying as either character ends the run",
      kind: "active",
      quality: 2,
      pools: ["treasure", "secret", "greed-treasure", "greed-shop", "greed-secret", "ultra-secret"],
      tags: ["offensive", "defensive", "hearts", "utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.addBlack !== 'function') return { fail: true }; ctx.addBlack(2) } },
      unlock: null
    },

    {
      id: "berserk",
      num: 704,
      name: "Berserk!",
      desc: "Charges with damage dealt",
      info: "Charges with damage dealt · Receive for 5 seconds: · ↑ +0.4 Speed · ↓ x0.5 Fire rate multiplier · ↑ +2 Fire rate · ↑ +3 Damage · Restricts attacks to a melee that reflects shots · Each kill increases the duration by 1 second and grants brief invincibility",
      kind: "active",
      quality: 2,
      pools: ["devil", "greed-devil", "ultra-secret"],
      tags: ["offensive", "tears", "defensive", "hearts", "utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { if (!p.status) p.status={}; p.status.invincible=6 } },
      unlock: null
    },

    {
      id: "dark-arts",
      num: 705,
      name: "Dark Arts",
      desc: "Receive for 1 second (or until shooting):↑ +1 Speed",
      info: "Receive for 1 second (or until shooting):↑ +1 Speed · Isaac can pass through enemies/projectiles and paralyzes them · When the effect ends, damages paralyzed enemies, removes paralyzed projectiles and creates a blast at Isaac's location · The attacks and blast are more powerful the more enemies/projectiles have been hit",
      kind: "active",
      quality: 2,
      pools: ["devil", "greed-devil", "ultra-secret"],
      tags: ["offensive", "utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { if (!p.status) p.status={}; p.status.invincible=6 } },
      unlock: null
    },

    {
      id: "abyss",
      num: 706,
      name: "Abyss",
      desc: "Consumes all item pedestals in the room and spawns a locust familiar for each one",
      info: "Consumes all item pedestals in the room and spawns a locust familiar for each one · Locusts deal Isaac's damage 2-3 times an attack · Some items spawn a special locust when consumed",
      kind: "active",
      quality: 2,
      pools: ["devil", "greed-devil", "ultra-secret"],
      tags: ["offensive", "utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.spawnFamiliar !== 'function') return { fail: true }; ctx.spawnFamiliar('abyss', {life:10}) } },
      unlock: null
    },

    {
      id: "supper",
      num: 707,
      name: "Supper",
      desc: "↑ +1 Health",
      info: "↑ +1 Health · Heals 1 heart",
      kind: "passive",
      quality: 2,
      pools: ["boss", "beggar", "greed-boss"],
      tags: ["defensive", "hearts"],
      dlc: "repentance",
      grant: {"maxHearts":2,"heal":2},
      unlock: null
    },

    {
      id: "stapler",
      num: 708,
      name: "Stapler",
      desc: "↑ +1 Damage",
      info: "↑ +1 Damage · All of Isaac's tears are shot from the right eye",
      kind: "passive",
      quality: 2,
      pools: ["boss", "golden-chest", "greed-boss"],
      tags: ["offensive", "tears"],
      dlc: "repentance",
      stats: {"damage":1},
      unlock: null
    },

    {
      id: "suplex",
      num: 709,
      name: "Suplex!",
      desc: "Isaac dashes in the direction he moves",
      info: "Isaac dashes in the direction he moves · Dashing into an enemy or boss picks it up and slams it into the ground · Slam deals damage and spawns rock waves based on Isaac's size · You're invincible during the dash and slam",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-treasure", "crane-game"],
      tags: ["offensive", "defensive", "hearts", "utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.spawnFamiliar !== 'function') return { fail: true }; ctx.spawnFamiliar('suplex', {life:10}) } },
      unlock: null
    },

    {
      id: "bag-of-crafting",
      num: 710,
      name: "Bag of Crafting",
      desc: "Collects up to 8 pickups which cannot be dropped",
      info: "Collects up to 8 pickups which cannot be dropped · Using the item with 8 pickups in the bag crafts an item · Item quality is based on the quality of the pickups",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
      unlock: null
    },

    {
      id: "flip",
      num: 711,
      name: "Flip",
      desc: "Entering a room with item pedestals displays a ghostly second item on the pedestals",
      info: "Entering a room with item pedestals displays a ghostly second item on the pedestals · Using the item flips the real and ghostly item · Using Flip after taking the first item allows Isaac to pick up the other item · Ghostly items alone on pedestals disappear after leaving the room",
      kind: "active",
      quality: 2,
      pools: ["secret", "curse", "greed-shop", "greed-curse", "greed-secret", "ultra-secret"],
      tags: ["utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
      unlock: null
    },

    {
      id: "lemegeton",
      num: 712,
      name: "Lemegeton",
      desc: "Spawns an orbital that grants a random item's effect",
      info: "Spawns an orbital that grants a random item's effect · The items have a 25% chance to be from the current room's item pool and 75% chance to be from a random item pool",
      kind: "active",
      quality: 2,
      pools: ["devil", "library", "greed-devil"],
      tags: ["utility", "charge"],
      dlc: "repentance",
      transform: "bookworm",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.spawnFamiliar !== 'function') return { fail: true }; ctx.spawnFamiliar('lemegeton', {life:10}) } },
      unlock: null
    },

    {
      id: "sumptorium",
      num: 713,
      name: "Sumptorium",
      desc: "Removes half a heart and creates a clot",
      info: "Removes half a heart and creates a clot · Clots copy Isaac's tears · Each type of heart generates a clot with different HP, damage and tear effect",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears", "defensive", "hearts", "utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.spawnFamiliar !== 'function') return { fail: true }; ctx.spawnFamiliar('sumptorium', {life:10}) } },
      unlock: null
    },

    {
      id: "recall",
      num: 714,
      name: "Recall",
      desc: "Retrieves the Forgotten's body from any distance",
      info: "Retrieves the Forgotten's body from any distance · The Soul is invincible while the Forgotten is returning",
      kind: "active",
      quality: 2,
      pools: [],
      tags: ["defensive", "hearts", "utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { if (!p.status) p.status={}; p.status.invincible=6 } },
      unlock: null
    },

    {
      id: "hold",
      num: 715,
      name: "Hold",
      desc: "Using the item when empty stores the next poop inside",
      info: "Using the item when empty stores the next poop inside · Using the item with a poop inside uses that poop",
      kind: "active",
      quality: 2,
      pools: [],
      tags: ["utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
      unlock: null
    },

    {
      id: "keepers-sack",
      hooks: {
        onInit: function (p, ctx) {
          if (p.cache['keepers-sack:init']) return
          p.cache['keepers-sack:init'] = true
          p.cache.ksCoins = p.coins
          if (!ctx || !ctx.room) return
          for (var i = 0; i < 3; i++) ctx.spawnPickup('coin', p.x - 90 + i * 90, p.y + 90, { variant: 'penny', toss: true })
          ctx.spawnPickup('key', p.x, p.y - 90, { variant: 'normal', toss: true })
        },
        onUpdate: function (p, dt, ctx) {
          if (!ctx) return
          if (p.cache.ksCoins == null) p.cache.ksCoins = p.coins
          if (p.coins < p.cache.ksCoins) p.cache.ksSpent = (p.cache.ksSpent || 0) + (p.cache.ksCoins - p.coins)
          p.cache.ksCoins = p.coins
          var changed = false
          while ((p.cache.ksSpent || 0) >= 3) {
            p.cache.ksSpent -= 3
            var k = ctx.int(3)
            if (k === 0) p.cache.ksSpeed = (p.cache.ksSpeed || 0) + 0.03
            else if (k === 1) p.cache.ksDmg = (p.cache.ksDmg || 0) + 0.5
            else p.cache.ksRange = (p.cache.ksRange || 0) + 10
            changed = true
          }
          if (changed) IS.recalcStats(p)
        },
        onStats: function (p, s) {
          s.speed += p.cache.ksSpeed || 0
          s.damage += p.cache.ksDmg || 0
          s.range += p.cache.ksRange || 0
        }
      },
      num: 716,
      name: "Keeper's Sack",
      desc: "Spawns 3 coins and 1 key",
      info: "Spawns 3 coins and 1 key · Spending 3 coins grants either: · ↑ +0.03 Speed · ↑ +0.5 Damage · ↑ +0.25 Range",
      kind: "passive",
      quality: 2,
      pools: ["shop", "secret", "greed-treasure", "greed-secret"],
      tags: ["offensive", "coins", "keys"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "keepers-kin",
      // APPROXIMATE: the occasional rock spider in hostile rooms is not implemented.
      hooks: {
        onGridBreak: function (p, g, ctx) {
          if (!g || !ctx || !ctx.spawnFamiliar) return
          for (var i = 0; i < 2; i++) {
            var f = ctx.spawnFamiliar('blue-spider')
            if (f) { f.x = g.x; f.y = g.y }
          }
        }
      },
      num: 717,
      name: "Keeper's Kin",
      desc: "Rocks and other obstacles spawn 2 blue spiders when destroyed",
      info: "Rocks and other obstacles spawn 2 blue spiders when destroyed · Rocks can occasionally spawn blue spiders in hostile rooms",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "secret", "greed-treasure", "greed-secret"],
      tags: ["utility"],
      dlc: "repentance",
      transform: "spider",
      unlock: null
    },

    {
      id: "item-718",
      num: 718,
      name: "Unused Item 718",
      desc: "<Item does not exist>",
      info: "<Item does not exist>",
      kind: "passive",
      quality: 2,
      pools: [],
      tags: ["utility"],
      dlc: "rebirth",
      unlock: null
    },

    {
      id: "keepers-box",
      num: 719,
      name: "Keeper's Box",
      desc: "Spawns a random Shop item/pickup to be purchased",
      info: "Spawns a random Shop item/pickup to be purchased",
      kind: "active",
      quality: 2,
      pools: ["shop", "secret", "greed-treasure", "greed-secret", "wooden-chest"],
      tags: ["utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.spawnFamiliar !== 'function') return { fail: true }; ctx.spawnFamiliar('keepers-box', {life:10}) } },
      unlock: null
    },

    {
      id: "everything-jar",
      num: 720,
      name: "Everything Jar",
      desc: "Spawns pickups based on the number of charges",
      info: "Spawns pickups based on the number of charges · Charge Rewards: · 1: 2: 3: 4: · 5: 6: 7: 8: · 9: 10: 11: · Triggers a powerful random effect at 12 charges",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-treasure", "crane-game"],
      tags: ["utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.spawnFamiliar !== 'function') return { fail: true }; ctx.spawnFamiliar('everything-jar', {life:10}) } },
      unlock: null
    },

    {
      id: "tmtrainer",
      // APPROXIMATE: glitched items are modelled as one random stat change per item picked up afterwards (and one per floor).
      hooks: {
        onInit: function (p, ctx) {
          if (!ctx) return
          if (p.cache.tmN == null || p.items.length < p.cache.tmN) { p.cache.tmN = p.items.length; return }
          var n = p.items.length - p.cache.tmN
          p.cache.tmN = p.items.length
          for (var i = 0; i < n; i++) tmGlitch(p, ctx)
        },
        onNewFloor: function (p, floor, ctx) { if (ctx && ctx.run) tmGlitch(p, ctx) },
        onStats: function (p, s) {
          var g = p.cache.tmG
          if (!g) return
          s.damage += g.damage; s.tears += g.tears; s.speed += g.speed
          s.range += g.range; s.luck += g.luck; s.shotSpeed += g.shotSpeed
        }
      },
      num: 721,
      name: "TMTRAINER",
      desc: "Causes all future items to be glitched",
      info: "Causes all future items to be glitched · Glitched items have completely random effects",
      kind: "passive",
      quality: 2,
      pools: ["secret", "greed-treasure", "greed-shop", "greed-secret"],
      tags: ["utility"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "anima-sola",
      num: 722,
      name: "Anima Sola",
      desc: "Chains down the nearest enemy for 5 seconds",
      info: "Chains down the nearest enemy for 5 seconds · Chained enemies cannot move or attack",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-treasure", "greed-shop"],
      tags: ["offensive", "utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
      unlock: null
    },

    {
      id: "spindown-dice",
      num: 723,
      name: "Spindown Dice",
      desc: "Rerolls all items in the room by decreasing their internal ID by one",
      info: "Rerolls all items in the room by decreasing their internal ID by one",
      kind: "active",
      quality: 2,
      pools: ["treasure", "secret", "greed-treasure", "greed-shop", "greed-secret", "crane-game"],
      tags: ["utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.rerollPedestals !== 'function') return { fail: true }; ctx.rerollPedestals() } },
      unlock: null
    },

    {
      id: "hypercoagulation",
      hooks: {
        onPlayerHurt: function (p, n, src, ctx) {
          if (!ctx || !ctx.room) return
          var full = Math.ceil(n) >= 2
          ctx.spawnPickup('heart', p.x, p.y, { variant: full ? 'full' : 'half', amount: full ? 2 : 1, life: 1.5, toss: true })
        }
      },
      num: 724,
      name: "Hypercoagulation",
      desc: "Taking damage drops a half or full Red Heart depending on how much Isaac lost",
      info: "Taking damage drops a half or full Red Heart depending on how much Isaac lost · The hearts launch out and despawn after 1.5 seconds",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure", "ultra-secret"],
      tags: ["offensive", "defensive", "hearts"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "ibs",
      num: 725,
      name: "IBS",
      desc: "Dealing enough damage causes Isaac to flash red",
      info: "Dealing enough damage causes Isaac to flash red · Releasing the fire button while Isaac is flashing either: · Throws a random poop · Creates buffing creep · Farts a poison cloud · Spawns 5 live bombs",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "bombs"],
      dlc: "repentance",
      tearFlags: ["poison"],
      unlock: null
    },

    {
      id: "hemoptysis",
      // APPROXIMATE: the sneeze is a cone of short piercing tears; the extra Brimstone damage on affected enemies is not implemented.
      hooks: {
        onUpdate: function (p, dt, ctx) {
          if (!ctx || !ctx.run) return
          var d = IS.input.shoot()
          var down = !!(d.x || d.y)
          var c = p.cache
          if (down && !c.hemoDown) {
            var now = ctx.run.time
            if (c.hemoTap != null && now - c.hemoTap <= 0.3 && now >= (c.hemoCd || 0)) {
              c.hemoCd = now + 1
              c.hemoTap = null
              var a0 = Math.atan2(d.y, d.x)
              for (var i = 0; i < 7; i++) {
                var a = a0 + (i - 3) * 0.12
                var sp = IS.TEAR_SPEED * (0.9 + 0.05 * (i % 3))
                ctx.spawnTear({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: 1.5 * p.stats.damage, r: 10, life: 0.25, flags: new Set(['piercing', 'spectral']), friendly: true })
              }
            } else c.hemoTap = now
          }
          c.hemoDown = down
        }
      },
      num: 726,
      name: "Hemoptysis",
      desc: "Double-tapping a fire button makes Isaac sneeze blood",
      info: "Double-tapping a fire button makes Isaac sneeze blood · The sneeze deals 1.5x Isaac's damage · 1 second cooldown · Affected enemies take extra damage from Brimstone beams",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure", "ultra-secret"],
      tags: ["offensive"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "ghost-bombs",
      num: 727,
      name: "Ghost Bombs",
      desc: "+5 Bombs",
      info: "+5 Bombs · Isaac's bombs spawn ghosts that chase enemies · Ghosts deal 2x Isaac's damage per second and explode after 10 seconds",
      kind: "passive",
      quality: 2,
      pools: ["treasure", "greed-treasure", "bomb-bum"],
      tags: ["offensive", "bombs"],
      dlc: "repentance",
      grant: {"bombs":5},
      unlock: null
    },

    {
      id: "gello",
      num: 728,
      name: "Gello",
      desc: "A demon familiar bursts out of Isaac for the room",
      info: "A demon familiar bursts out of Isaac for the room · The demon shoots towards the nearest enemy, mimicing Isaac's tears, stats and effects · Its tears deal 75% of Isaac's damage",
      kind: "active",
      quality: 2,
      pools: ["treasure", "devil", "greed-treasure", "greed-devil", "ultra-secret"],
      tags: ["offensive", "tears", "utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { if (!ctx || typeof ctx.spawnFamiliar !== 'function') return { fail: true }; ctx.spawnFamiliar('gello', {life:10}) } },
      unlock: null
    },

    {
      id: "decap-attack",
      num: 729,
      name: "Decap Attack",
      desc: "Throws Isaac's head in a direction",
      info: "Throws Isaac's head in a direction · The head deals contact damage and shoots tears from where it lands · Using the item again or stepping on the head reattaches it",
      kind: "active",
      quality: 2,
      pools: ["treasure", "greed-treasure"],
      tags: ["offensive", "tears", "utility", "charge"],
      dlc: "repentance",
      charge: 4,
      chargeType: "normal",
      hooks: { onUse: function (p, ctx) { return { fail: true } } },
      unlock: null
    },

    {
      id: "glass-eye",
      num: 730,
      name: "Glass Eye",
      desc: "↑ +0.75 Damage",
      info: "↑ +0.75 Damage · ↑ +1 Luck",
      kind: "passive",
      quality: 2,
      pools: ["boss", "golden-chest", "greed-boss", "crane-game"],
      tags: ["offensive"],
      dlc: "repentance",
      stats: {"damage":0.75,"luck":1},
      unlock: null
    },

    {
      id: "stye",
      hooks: {
        onTearFire: function (p, tear) {
          if (!(p.eye > 0)) return
          var ss = p.stats.shotSpeed
          var ratio = Math.max(0.6, ss - 0.3) / ss
          var rng = p.stats.range
          tear.dmg *= 1.28
          tear.vx *= ratio
          tear.vy *= ratio
          tear.life = tear.life * (rng + 260) / rng / ratio
          tear.life0 = tear.life
        }
      },
      num: 731,
      name: "Stye",
      desc: "↑ x1.28 Damage multiplier for the right eye",
      info: "↑ x1.28 Damage multiplier for the right eye · ↑ +6.5 Range for the right eye · ↓ -0.3 Shot speed for the right eye",
      kind: "passive",
      quality: 2,
      pools: ["boss", "greed-boss"],
      tags: ["offensive"],
      dlc: "repentance",
      unlock: null
    },

    {
      id: "moms-ring",
      num: 732,
      name: "Mom's Ring",
      desc: "↑ +1 Damage",
      info: "↑ +1 Damage · Spawns a random rune or soul stone",
      kind: "passive",
      quality: 2,
      pools: ["golden-chest", "moms-chest", "greed-shop"],
      tags: ["offensive"],
      dlc: "repentance",
      stats: {"damage":1},
      transform: "mom",
      unlock: null
    }
  ])

  IS.defineFamiliars([
    { id: "tinytoma-big", name: "Tinytoma", behaviour: 'orbital', params: { r: 22, orbitR: 85, orbitSpeed: 1.6, dmg: 1.75, cooldown: 0.5, hp: 3, blockShots: true, onDeath: { familiars: ["tinytoma-small", "tinytoma-small"], respawn: 5 } } },
    { id: "tinytoma-small", name: "Small Tinytoma", behaviour: 'orbital', params: { r: 14, orbitR: 70, orbitSpeed: 1.8, dmg: 1.75, cooldown: 0.5, hp: 1, blockShots: true, onDeath: { familiars: ["blue-spider", "blue-spider"] } } },
    { id: "minisaac", name: "Minisaac", behaviour: 'chaser', params: { r: 14, speed: 330, range: 700, dmg: 3.5, cooldown: 0.4, hp: 4 } },
    { id: "bone-shard", name: "Bone Spur", behaviour: 'wanderer', params: { r: 14, speed: 0, dmg: 3, cooldown: 0.5, hp: 2, blockShots: true, life: 20 } },
    { id: "hungry-ghost", name: "Hungry Ghost", behaviour: 'chaser', params: { r: 16, speed: 300, range: 800, dmg: 3, cooldown: 0.4, invulnerable: true, life: 5, explode: { dmg: 20, r: 90 } } }
  ])

  IS.defineFamiliars([
    { id: "swarm-fly", name: "Swarm Fly", behaviour: 'orbital', params: { r: 10, flying: true, orbitR: 80, orbitSpeed: 2.2, dmg: 3, cooldown: 0.5, blockShots: true, hp: 1, onDeath: { familiars: ['blue-fly'] } } },
    { id: "twisted-pair-a", name: "Twisted Pair", behaviour: 'follower', params: { r: 16, speed: 330, flying: true, inherit: 0.375, fireDelay: 0.35, range: 520 } },
    { id: "twisted-pair-b", name: "Twisted Pair", behaviour: 'follower', params: { r: 16, speed: 330, flying: true, inherit: 0.375, fireDelay: 0.35, range: 520 } },
    { id: "vengeful-wisp", name: "Vengeful Wisp", sprite: "wisp", behaviour: 'orbitShooter', params: { r: 13, speed: 300, flying: true, orbitR: 62, orbitSpeed: 1.7, dmg: 3.5, fireDelay: 0.65, range: 420, blockShots: false } },
    { id: "fruity-plum", name: "Fruity Plum", sprite: "fruity-plum", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, dmg: 3, fireDelay: 0.75, range: 520, hp: 0, blockShots: false, life: 0 } },
    { id: "cube-baby", name: "Cube Baby", sprite: "cube-baby", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, dmg: 3.5, fireDelay: 0.75, range: 520, hp: 0, blockShots: false, life: 0, tearFlags: ["slow", "freeze"] } },
    { id: "quints", name: "Quints", sprite: "quints", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, dmg: 3.5, fireDelay: 0.75, range: 520, hp: 0, blockShots: false, life: 0 } },
    { id: "strawman", name: "Strawman", sprite: "strawman", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, dmg: 3.5, fireDelay: 0.75, range: 520, hp: 0, blockShots: false, life: 0 } },
    { id: "lil-abaddon", name: "Lil Abaddon", sprite: "lil-abaddon", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, dmg: 52.5, fireDelay: 0.75, range: 520, hp: 0, blockShots: false, life: 0 } },
    { id: "lil-portal", name: "Lil Portal", sprite: "lil-portal", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, dmg: 3.5, fireDelay: 0.75, range: 520, hp: 0, blockShots: false, life: 0 } },
    { id: "vanishing-twin", name: "Vanishing Twin", sprite: "vanishing-twin", behaviour: 'follower', params: { r: 16, speed: 300, flying: true, dmg: 3.5, fireDelay: 0.75, range: 520, hp: 0, blockShots: false, life: 0, tearFlags: ["slow"] } }
  ])

})(window.IS)
