;(function (IS) {
  'use strict'

  // Canonical metadata: docs/reference/cards.json. Random effects use ctx only.
  function spawn (ctx, kind, p, opts) {
    if (!ctx || typeof ctx.spawnPickup !== 'function') return null
    return ctx.spawnPickup(kind, p && p.x, p && p.y, opts || {})
  }
  function many (n, fn) { for (var i = 0; i < n; i++) fn(i) }
  function enemies (ctx) {
    return ctx && typeof ctx.livingEnemies === 'function' ? ctx.livingEnemies() : []
  }
  function statusAll (ctx, status, secs) {
    if (!ctx || typeof ctx.applyStatus !== 'function') return
    var list = enemies(ctx)
    for (var i = 0; i < list.length; i++) ctx.applyStatus(list[i], status, secs)
  }
  function cacheUntil (p, ctx, key, secs) {
    if (!p) return
    if (!p.cache) p.cache = {}
    var now = ctx && ctx.run && typeof ctx.run.time === 'number' ? ctx.run.time : 0
    p.cache['card:' + key] = Math.max(p.cache['card:' + key] || 0, now + secs)
  }
  function randomPickup (ctx, p, kinds, n) {
    many(n || 1, function () { spawn(ctx, ctx && ctx.pick ? ctx.pick(kinds) : kinds[0], p) })
  }
  function doubleResource (p, ctx, key, add) {
    var n = p && typeof p[key] === 'number' ? p[key] : 0
    if (ctx && typeof ctx[add] === 'function') ctx[add](n)
  }
  function mapFloor (ctx) {
    if (ctx && ctx.run) {
      if (!ctx.run.flags) ctx.run.flags = {}
      ctx.run.flags.fullMap = true
    }
  }
  function useFor (num) {
    return function (p, ctx) {
      var i
      switch (num) {
        case 1: return ctx && ctx.teleport && ctx.teleport('start')
        case 2: cacheUntil(p, ctx, 'homing', 9999); return statusAll(ctx, 'marked', 8)
        case 3: var target = ctx && ctx.randomEnemy && ctx.randomEnemy(); return target ? ctx.bombExplode(target.x, target.y, { damage: 100 }) : ctx.damagePlayer(2, 'high-priestess')
        case 4: cacheUntil(p, ctx, 'empress', 9999); return statusAll(ctx, 'fear', 2)
        case 5: return ctx && ctx.teleport && ctx.teleport('boss')
        case 6: return many(2, function () { spawn(ctx, 'soul-heart', p) })
        case 7: return many(2, function () { spawn(ctx, 'heart', p) })
        case 8: cacheUntil(p, ctx, 'chariot', 6); return statusAll(ctx, 'fear', 6)
        case 9: return ['heart', 'coin', 'bomb', 'key'].forEach(function (k) { spawn(ctx, k, p) })
        case 10: return ctx && ctx.teleport && ctx.teleport('shop')
        case 11: return spawn(ctx, ctx && ctx.chance && ctx.chance(0.25) ? 'fortune-machine' : 'slot-machine', p)
        case 12: if (ctx && ctx.addMaxHearts) ctx.addMaxHearts(2, true); cacheUntil(p, ctx, 'strength', 9999); return statusAll(ctx, 'fear', 2)
        case 13: return cacheUntil(p, ctx, 'flight', 9999)
        case 14: return many(4, function () { ctx && ctx.bombExplode && ctx.bombExplode(null, null, { damage: 40 }) })
        case 15: return spawn(ctx, 'blood-donation-machine', p)
        case 16: return cacheUntil(p, ctx, 'devil', 9999)
        case 17: return many(6, function () { ctx && ctx.spawnBomb && ctx.spawnBomb(null, null, { troll: true, fuse: 0.8 }) })
        case 18: return ctx && ctx.teleport && (ctx.teleport('planetarium') || ctx.teleport('treasure'))
        case 19: return ctx && ctx.teleport && ctx.teleport('secret')
        case 20: if (ctx && ctx.healRed) ctx.healRed(24); mapFloor(ctx); return many(8, function () { ctx && ctx.bombExplode && ctx.bombExplode(null, null, { damage: 100 }) })
        case 21: return spawn(ctx, ctx && ctx.chance && ctx.chance(0.33) ? 'devil-beggar' : 'beggar', p)
        case 22: return mapFloor(ctx)
        case 23: return doubleResource(p, ctx, 'bombs', 'addBombs')
        case 24: return doubleResource(p, ctx, 'coins', 'addCoins')
        case 25: return doubleResource(p, ctx, 'keys', 'addKeys')
        case 26: return ctx && ctx.healRed && ctx.healRed(p && p.hearts ? p.hearts.red || 0 : 0)
        case 27: case 28: case 29: case 30:
          var aceKinds = {27:'bomb',28:'coin',29:'key',30:'heart'}; return randomPickup(ctx, p, [aceKinds[num]], enemies(ctx).length + ((ctx && ctx.pickups && ctx.pickups().length) || 0))
        case 31: return ctx && ctx.teleport && (ctx.teleport(ctx.chance && ctx.chance(0.5) ? 'angel' : 'devil'))
        case 32: var gs = ctx && ctx.gridObjects ? ctx.gridObjects().slice() : []; for (i = 0; i < gs.length; i++) if (/rock/.test(gs[i].kind || '')) ctx.destroyGrid(gs[i]); return
        case 33: var ps = ctx && ctx.pickups ? ctx.pickups().slice() : []; for (i = 0; i < ps.length; i++) spawn(ctx, ps[i].kind, p); return
        case 34: return ctx && ctx.spawnTrapdoor && ctx.spawnTrapdoor()
        case 35: if (ctx && ctx.addSoul) ctx.addSoul(2); if (ctx && ctx.run) ctx.run.curse = null; return
        case 36: return mapFloor(ctx)
        case 37: return ctx && ctx.rerollPedestals && ctx.rerollPedestals()
        case 38: return randomPickup(ctx, p, ['spider'], 3) || randomPickup(ctx, p, ['fly'], 3)
        case 39: return cacheUntil(p, ctx, 'invuln', 20)
        case 40: case 55: var runes = [32,33,34,35,36,37,38,39]; return useFor(runes[ctx && ctx.int ? ctx.int(runes.length) : 0])(p, ctx)
        case 41: if (ctx && ctx.rerollPedestals) ctx.rerollPedestals(); return randomPickup(ctx, p, ['fly'], ((ctx && ctx.pickups && ctx.pickups().length) || 0))
        case 42: var e = ctx && ctx.randomEnemy && ctx.randomEnemy(); return e && ctx.bombExplode(e.x, e.y, { damage: 99999 })
        case 43: if (ctx && ctx.room) ctx.room.freeShop = true; return
        case 44: return ctx && ctx.banner && ctx.banner('Rules Card', 'Walls are excellent listeners.')
        case 45: return many(24, function () { ctx && ctx.spawnPoop && ctx.spawnPoop() })
        case 46: randomPickup(ctx, p, ['heart','coin','bomb','key','item'], 10); return ctx && ctx.damagePlayer && ctx.damagePlayer(999, 'suicide-king')
        case 47: case 83: return ctx && ctx.openDoors && ctx.openDoors()
        case 48: return ctx && ctx.addCharge && ctx.addCharge(99)
        case 49: case 90: return ctx && ctx.rerollPedestals && ctx.rerollPedestals()
        case 50: return many(2, function () { var x = ctx && ctx.randomEnemy && ctx.randomEnemy(); if (x) ctx.applyStatus(x, 'petrify', 5) })
        case 51: return cacheUntil(p, ctx, 'holy-mantle', 999999)
        case 52: cacheUntil(p, ctx, 'huge-growth', 9999); return statusAll(ctx, 'fear', 3)
        case 53: return many(3, function () { spawn(ctx, 'card', p, { id: ctx && ctx.rollCard && ctx.rollCard() }) })
        case 54: cacheUntil(p, ctx, 'era-walk', 9999); return statusAll(ctx, 'slow', 9999)
        case 56: randomPickup(ctx, p, ['heart','coin','bomb','key'], 8); return
        case 57: cacheUntil(p, ctx, 'repel', 60); return statusAll(ctx, 'fear', 60)
        case 58: return many(6, function () { ctx && ctx.spawnBomb && ctx.spawnBomb(p.x, p.y, { fuse: 10 }) })
        case 59: if (ctx && ctx.addMaxHearts) ctx.addMaxHearts(4, true); return cacheUntil(p, ctx, 'empress-reversed', 60)
        case 60: return ctx && ctx.teleport && ctx.teleport('boss')
        case 61: return ctx && ctx.addBone && ctx.addBone(2)
        case 62: return spawn(ctx, 'item', p, { pool: ctx && ctx.room && ctx.room.type || 'treasure' })
        case 63: return cacheUntil(p, ctx, 'chariot-reversed', 10)
        case 64: return many(3, function () { spawn(ctx, 'golden-chest', p) })
        case 65: var count = ((ctx && ctx.pickups && ctx.pickups().length) || 0); return many(Math.max(1,count), function(){spawn(ctx,'coin',p)})
        case 66: var dice = [32,33,37,41,49]; return useFor(dice[ctx && ctx.int ? ctx.int(dice.length) : 0])(p,ctx)
        case 67: return statusAll(ctx, 'slow', 30)
        case 68: return cacheUntil(p, ctx, 'hanged-reversed', 30)
        case 69: return many(enemies(ctx).length, function(){ctx && ctx.spawnFamiliar && ctx.spawnFamiliar('bone-orbital',{life:9999})})
        case 70: return many(5, function(){var id=ctx&&ctx.rollPill&&ctx.rollPill(); if(id&&ctx.usePill)ctx.usePill(id)})
        case 71: cacheUntil(p,ctx,'flight',30); return ctx&&ctx.spawnFamiliar&&ctx.spawnFamiliar('seraphim',{life:30})
        case 72: return many(14,function(){ctx&&ctx.spawnPoop&&ctx.spawnPoop()})
        case 73: return many(2,function(){spawn(ctx,'item',p,{pool:ctx&&ctx.room&&ctx.room.type||'treasure'})})
        case 74: return ctx&&ctx.teleport&&ctx.teleport('ultra-secret')
        case 75: return cacheUntil(p,ctx,'sun-reversed',999999)
        case 76: return spawn(ctx,'restock-machine',p)
        case 77: return ctx&&ctx.spawnCrawlspace&&ctx.spawnCrawlspace()
        case 78: return ctx&&ctx.run&&IS.openRedRoom?IS.openRedRoom(ctx.run,ctx):null
        case 79: return many(1+(ctx&&ctx.int?ctx.int(20):0),function(){spawn(ctx,'heart',p)})
        case 80: var last=ctx&&ctx.run&&ctx.run.lastPocket; return last&&ctx.useCard&&ctx.useCard(last.id)
        case 81: return ctx&&ctx.rerollPedestals&&ctx.rerollPedestals()
        case 82: return cacheUntil(p,ctx,'magdalene-soul',9999)
        case 84: return cacheUntil(p,ctx,'dark-arts',3)
        case 85: many(8,function(){ctx&&ctx.spawnCreep&&ctx.spawnCreep(p.x,p.y,42,{colour:'#79502d'})}); return many(7,function(){ctx&&ctx.spawnBomb&&ctx.spawnBomb(null,null,{butt:true})})
        case 86: return many(14,function(){ctx&&ctx.spawnFamiliar&&ctx.spawnFamiliar('dead-bird',{life:9999})})
        case 87: return cacheUntil(p,ctx,'berserk',10)
        case 88: return ctx&&ctx.spawnLaser&&ctx.spawnLaser({angle:Math.atan2((p.head&&p.head.y)||0,(p.head&&p.head.x)||1),life:7.5,damage:20})
        case 89: if(ctx&&ctx.healRed)ctx.healRed(1); return cacheUntil(p,ctx,'lazarus-soul',999999)
        case 91: return cacheUntil(p,ctx,'lost-soul',9999)
        case 92: var fams=['brother-bobby','sister-maggy','little-steven','demon-baby']; return ctx&&ctx.spawnFamiliar&&ctx.spawnFamiliar(fams[ctx.int?ctx.int(fams.length):0],{})
        case 93: return many(1+(ctx&&ctx.int?ctx.int(25):0),function(){spawn(ctx,'coin',p)})
        case 94: return many(15,function(){spawn(ctx,'locust',p)})
        case 95: return ctx&&ctx.spawnFamiliar&&ctx.spawnFamiliar('the-forgotten',{life:9999})
        case 96: return many(6,function(){ctx&&ctx.spawnFamiliar&&ctx.spawnFamiliar('wisp',{life:9999})})
        case 97: return ctx&&ctx.spawnFamiliar&&ctx.spawnFamiliar('esau',{life:9999})
        default: return ctx && ctx.spawnEffect && ctx.spawnEffect('burst', p && p.x, p && p.y)
      }
    }
  }

  var defs = [
  {
    "id": "0-the-fool",
    "num": 1,
    "name": "0 - The Fool",
    "cardType": "tarot",
    "desc": "Teleports Isaac to the first room of the floor"
  },
  {
    "id": "i-the-magician",
    "num": 2,
    "name": "I - The Magician",
    "cardType": "tarot",
    "desc": "Receive for the room: · ↑ +3 Range · Homing tears"
  },
  {
    "id": "ii-the-high-priestess",
    "num": 3,
    "name": "II - The High Priestess",
    "cardType": "tarot",
    "desc": "Mom's Foot stomps on an enemy · Mom's Foot stomps Isaac if there are no enemies"
  },
  {
    "id": "iii-the-empress",
    "num": 4,
    "name": "III - The Empress",
    "cardType": "tarot",
    "desc": "Receive for the room: · ↑ +0.3 Speed · ↑ +1.5 Damage"
  },
  {
    "id": "iv-the-emperor",
    "num": 5,
    "name": "IV - The Emperor",
    "cardType": "tarot",
    "desc": "Teleports Isaac to the Boss Room"
  },
  {
    "id": "v-the-hierophant",
    "num": 6,
    "name": "V - The Hierophant",
    "cardType": "tarot",
    "desc": "Spawns 2 Soul Hearts"
  },
  {
    "id": "vi-the-lovers",
    "num": 7,
    "name": "VI - The Lovers",
    "cardType": "tarot",
    "desc": "Spawns 2 Red Hearts"
  },
  {
    "id": "vii-the-chariot",
    "num": 8,
    "name": "VII - The Chariot",
    "cardType": "tarot",
    "desc": "Receive for 6 seconds: · ↑ +0.28 Speed · Invincibility · Isaac can't shoot but deals 40 contact damage per second"
  },
  {
    "id": "viii-justice",
    "num": 9,
    "name": "VIII - Justice",
    "cardType": "tarot",
    "desc": "Spawns a random heart, coin, bomb and key"
  },
  {
    "id": "ix-the-hermit",
    "num": 10,
    "name": "IX - The Hermit",
    "cardType": "tarot",
    "desc": "Teleports Isaac to the Shop"
  },
  {
    "id": "x-wheel-of-fortune",
    "num": 11,
    "name": "X - Wheel of Fortune",
    "cardType": "tarot",
    "desc": "Spawns a Slot Machine · 25% chance for it to be a Fortune Telling Machine"
  },
  {
    "id": "xi-strength",
    "num": 12,
    "name": "XI - Strength",
    "cardType": "tarot",
    "desc": "Receive for the room: · ↑ +1 Health · ↑ +0.3 Speed · ↑ +0.3 Damage · ↑ x1.5 Damage multiplier · ↑ +2.5 Range"
  },
  {
    "id": "xii-the-hanged-man",
    "num": 13,
    "name": "XII - The Hanged Man",
    "cardType": "tarot",
    "desc": "Flight for the room"
  },
  {
    "id": "xiii-death",
    "num": 14,
    "name": "XIII - Death",
    "cardType": "tarot",
    "desc": "Deals 40 damage to all enemies in the room"
  },
  {
    "id": "xiv-temperance",
    "num": 15,
    "name": "XIV - Temperance",
    "cardType": "tarot",
    "desc": "Spawns a Blood Donation Machine"
  },
  {
    "id": "xv-the-devil",
    "num": 16,
    "name": "XV - The Devil",
    "cardType": "tarot",
    "desc": "Receive for the room: · ↑ +2 Damage"
  },
  {
    "id": "xvi-the-tower",
    "num": 17,
    "name": "XVI - The Tower",
    "cardType": "tarot",
    "desc": "Spawns 6 Troll Bombs"
  },
  {
    "id": "xvii-the-stars",
    "num": 18,
    "name": "XVII - The Stars",
    "cardType": "tarot",
    "desc": "Teleports Isaac to the Treasure Room · If there is a Planetarium, it teleports there instead"
  },
  {
    "id": "xviii-the-moon",
    "num": 19,
    "name": "XVIII - The Moon",
    "cardType": "tarot",
    "desc": "Teleports Isaac to the Secret Room"
  },
  {
    "id": "xix-the-sun",
    "num": 20,
    "name": "XIX - The Sun",
    "cardType": "tarot",
    "desc": "Full health · Deals 100 damage to all enemies · Full mapping effect for the floor (except Super / Ultra Secret Room) · Removes Curse of Darkness"
  },
  {
    "id": "xx-judgement",
    "num": 21,
    "name": "XX - Judgement",
    "cardType": "tarot",
    "desc": "Spawns a Beggar · 33% chance for it to be a Devil Beggar · 5% chance for it to be a Key Master, Bomb Bum, Battery Bum, or Rotten Beggar"
  },
  {
    "id": "xxi-the-world",
    "num": 22,
    "name": "XXI - The World",
    "cardType": "tarot",
    "desc": "Full mapping effect for the floor (except Super / Ultra Secret Room)"
  },
  {
    "id": "2-of-clubs",
    "num": 23,
    "name": "2 of Clubs",
    "cardType": "suit",
    "desc": "Doubles Isaac's number of bombs"
  },
  {
    "id": "2-of-diamonds",
    "num": 24,
    "name": "2 of Diamonds",
    "cardType": "suit",
    "desc": "Doubles Isaac's number of coins"
  },
  {
    "id": "2-of-spades",
    "num": 25,
    "name": "2 of Spades",
    "cardType": "suit",
    "desc": "Doubles Isaac's number of keys"
  },
  {
    "id": "2-of-hearts",
    "num": 26,
    "name": "2 of Hearts",
    "cardType": "suit",
    "desc": "Doubles Isaac's number of Red Hearts (not containers)"
  },
  {
    "id": "ace-of-clubs",
    "num": 27,
    "name": "Ace of Clubs",
    "cardType": "suit",
    "desc": "Turns all pickups, chests and non-boss enemies into random bombs"
  },
  {
    "id": "ace-of-diamonds",
    "num": 28,
    "name": "Ace of Diamonds",
    "cardType": "suit",
    "desc": "Turns all pickups, chests and non-boss enemies into random coins"
  },
  {
    "id": "ace-of-spades-29",
    "num": 29,
    "name": "Ace of Spades",
    "cardType": "suit",
    "desc": "Turns all pickups, chests and non-boss enemies into random keys"
  },
  {
    "id": "ace-of-hearts",
    "num": 30,
    "name": "Ace of Hearts",
    "cardType": "suit",
    "desc": "Turns all pickups, chests and non-boss enemies into random hearts"
  },
  {
    "id": "joker",
    "num": 31,
    "name": "Joker",
    "cardType": "special",
    "desc": "Teleports Isaac to the Devil or Angel Room"
  },
  {
    "id": "hagalaz",
    "num": 32,
    "name": "Hagalaz",
    "cardType": "rune",
    "desc": "Destroy all rocks in the room"
  },
  {
    "id": "jera",
    "num": 33,
    "name": "Jera",
    "cardType": "rune",
    "desc": "Duplicates all pickups in room"
  },
  {
    "id": "ehwaz",
    "num": 34,
    "name": "Ehwaz",
    "cardType": "rune",
    "desc": "Spawns a trapdoor to the next floor · Spawns a crawlspace if used on a decorative floor tile (grass, small rocks, papers, gems, etc.)"
  },
  {
    "id": "dagaz",
    "num": 35,
    "name": "Dagaz",
    "cardType": "rune",
    "desc": "+1 Soul Heart · Removes all curses for the floor"
  },
  {
    "id": "ansuz",
    "num": 36,
    "name": "Ansuz",
    "cardType": "rune",
    "desc": "Full mapping effect for the floor"
  },
  {
    "id": "perthro",
    "num": 37,
    "name": "Perthro",
    "cardType": "rune",
    "desc": "Rerolls all pedestal items in the room"
  },
  {
    "id": "berkano",
    "num": 38,
    "name": "Berkano",
    "cardType": "rune",
    "desc": "Summons 3 blue spiders and 3 blue flies"
  },
  {
    "id": "algiz",
    "num": 39,
    "name": "Algiz",
    "cardType": "rune",
    "desc": "Makes Isaac invincible for 20 seconds"
  },
  {
    "id": "blank-rune",
    "num": 40,
    "name": "Blank Rune",
    "cardType": "rune",
    "desc": "Triggers a random rune effect · 25% chance to duplicate itself when used"
  },
  {
    "id": "black-rune",
    "num": 41,
    "name": "Black Rune",
    "cardType": "rune",
    "desc": "Deals 40 damage to all enemies · Converts all pedestal items in the room into random stat ups · Converts all pickups in the room into blue flies"
  },
  {
    "id": "chaos-card",
    "num": 42,
    "name": "Chaos Card",
    "cardType": "special",
    "desc": "Using the card throws it in the direction Isaac is moving · Instantly kills ANY enemy it touches (except Delirium or the Beast)"
  },
  {
    "id": "credit-card",
    "num": 43,
    "name": "Credit Card",
    "cardType": "special",
    "desc": "Makes all items and pickups in a Shop or Devil Room free"
  },
  {
    "id": "rules-card",
    "num": 44,
    "name": "Rules Card",
    "cardType": "special",
    "desc": "Displays \\\"helpful\\\" tips on use"
  },
  {
    "id": "a-card-against-humanity",
    "num": 45,
    "name": "A Card Against Humanity",
    "cardType": "special",
    "desc": "Fills the whole room with poop"
  },
  {
    "id": "suicide-king",
    "num": 46,
    "name": "Suicide King",
    "cardType": "special",
    "desc": "Instantly kills Isaac and spawns 10 pickups or items on the floor · Spawned items will use the current room's item pool"
  },
  {
    "id": "get-out-of-jail-free-card",
    "num": 47,
    "name": "Get Out Of Jail Free Card",
    "cardType": "special",
    "desc": "Open all doors in the room"
  },
  {
    "id": "card",
    "num": 48,
    "name": "? Card",
    "cardType": "special",
    "desc": "Uses Isaac's active item for free"
  },
  {
    "id": "dice-shard",
    "num": 49,
    "name": "Dice Shard",
    "cardType": "special",
    "desc": "Rerolls all item pedestals and pickups in the room"
  },
  {
    "id": "emergency-contact",
    "num": 50,
    "name": "Emergency Contact",
    "cardType": "special",
    "desc": "Two of Mom's Hands come down and grab an enemy each"
  },
  {
    "id": "holy-card",
    "num": 51,
    "name": "Holy Card",
    "cardType": "special",
    "desc": "A one-use Holy Mantle shield (prevents damage once)"
  },
  {
    "id": "huge-growth",
    "num": 52,
    "name": "Huge Growth",
    "cardType": "special",
    "desc": "Receive for the room: · ↑ +7 Damage · ↑ +3 Range · Size up · Allows Isaac to destroy rocks by walking into them"
  },
  {
    "id": "ancient-recall",
    "num": 53,
    "name": "Ancient Recall",
    "cardType": "special",
    "desc": "Spawns 3 random cards"
  },
  {
    "id": "era-walk",
    "num": 54,
    "name": "Era Walk",
    "cardType": "special",
    "desc": "Receive for the room: · ↑ +0.5 Speed · ↓ -1 Shot speed · Slow down enemies"
  },
  {
    "id": "rune-shard",
    "num": 55,
    "name": "Rune Shard",
    "cardType": "rune",
    "desc": "Activates a random rune effect · The rune effect is weaker"
  },
  {
    "id": "0-the-fool-56",
    "num": 56,
    "name": "0 - The Fool?",
    "cardType": "reverse-tarot",
    "desc": "Drops all of Isaac's hearts but one and all of his pickups on the floor · Coins and bombs are dropped as The Quarter or Boom! if possible"
  },
  {
    "id": "i-the-magician-57",
    "num": 57,
    "name": "I - The Magician?",
    "cardType": "reverse-tarot",
    "desc": "Grants an aura that repels enemies and projectiles for 60 seconds"
  },
  {
    "id": "ii-the-high-priestess-58",
    "num": 58,
    "name": "II - The High Priestess?",
    "cardType": "reverse-tarot",
    "desc": "Mom's Foot tries to stomp Isaac for 60 seconds"
  },
  {
    "id": "iii-the-empress-59",
    "num": 59,
    "name": "III - The Empress?",
    "cardType": "reverse-tarot",
    "desc": "Receive for 60 seconds: · ↑ +2 Health · ↑ +1.5 Fire rate · ↓ -0.1 Speed"
  },
  {
    "id": "iv-the-emperor-60",
    "num": 60,
    "name": "IV - The Emperor?",
    "cardType": "reverse-tarot",
    "desc": "Teleports Isaac to an extra Boss room that can be defeated for an item · The boss is chosen from two floors deeper than the current one"
  },
  {
    "id": "v-the-hierophant-61",
    "num": 61,
    "name": "V - The Hierophant?",
    "cardType": "reverse-tarot",
    "desc": "Spawns 2 Bone Hearts"
  },
  {
    "id": "vi-the-lovers-62",
    "num": 62,
    "name": "VI - The Lovers?",
    "cardType": "reverse-tarot",
    "desc": "Spawns an item from the current room's item pool · Converts 1 heart container or 2 Soul Hearts into a Broken Heart"
  },
  {
    "id": "vii-the-chariot-63",
    "num": 63,
    "name": "VII - The Chariot?",
    "cardType": "reverse-tarot",
    "desc": "Receive for 10 seconds: · ↑ x4 Fire rate multiplier · Invincible but can't move"
  },
  {
    "id": "viii-justice-64",
    "num": 64,
    "name": "VIII - Justice?",
    "cardType": "reverse-tarot",
    "desc": "Spawns 2-4 golden chests"
  },
  {
    "id": "ix-the-hermit-65",
    "num": 65,
    "name": "IX - The Hermit?",
    "cardType": "reverse-tarot",
    "desc": "Turns all pickups and items in the room into a number of coins equal to their Shop value · If there is nothing to turn, spawns a Penny instead"
  },
  {
    "id": "x-wheel-of-fortune-66",
    "num": 66,
    "name": "X - Wheel of Fortune?",
    "cardType": "reverse-tarot",
    "desc": "Triggers a random Dice Room effect"
  },
  {
    "id": "xi-strength-67",
    "num": 67,
    "name": "XI - Strength?",
    "cardType": "reverse-tarot",
    "desc": "Enemies in the room are slowed and take double damage for 30 seconds"
  },
  {
    "id": "xii-the-hanged-man-68",
    "num": 68,
    "name": "XII - The Hanged Man?",
    "cardType": "reverse-tarot",
    "desc": "Receive for 30 seconds: · ↓ -0.1 Speed · Triple shot · Killed enemies drop coins"
  },
  {
    "id": "xiii-death-69",
    "num": 69,
    "name": "XIII - Death?",
    "cardType": "reverse-tarot",
    "desc": "Activates Book of the Dead · Spawns friendly Bone entities for each enemy killed in room"
  },
  {
    "id": "xiv-temperance-70",
    "num": 70,
    "name": "XIV - Temperance?",
    "cardType": "reverse-tarot",
    "desc": "Forces Isaac to eat 5 random pills"
  },
  {
    "id": "xv-the-devil-71",
    "num": 71,
    "name": "XV - The Devil?",
    "cardType": "reverse-tarot",
    "desc": "Receive for 30 seconds: · Activates The Bible (flight) · Seraphim familiar · Kills Mom's Foot and Mom's Heart instantly · Kills Isaac when used on Satan"
  },
  {
    "id": "xvi-the-tower-72",
    "num": 72,
    "name": "XVI - The Tower?",
    "cardType": "reverse-tarot",
    "desc": "Spawns 7 clusters of random rocks and obstacles · Clusters often contain Tinted Rocks"
  },
  {
    "id": "xvii-the-stars-73",
    "num": 73,
    "name": "XVII - The Stars?",
    "cardType": "reverse-tarot",
    "desc": "Removes Isaac's oldest collected passive item (ignoring starting items) · Spawns 2 random items from the current room's item pool"
  },
  {
    "id": "xviii-the-moon-74",
    "num": 74,
    "name": "XVIII - The Moon?",
    "cardType": "reverse-tarot",
    "desc": "Teleports Isaac to the Ultra Secret Room · Pathway back will be made of red rooms"
  },
  {
    "id": "xix-the-sun-75",
    "num": 75,
    "name": "XIX - The Sun?",
    "cardType": "reverse-tarot",
    "desc": "Receive for the floor: · ↑ +1.5 Damage · Flight and spectral tears · Converts heart containers into Bone Hearts (reverts) · Curse of Darkness"
  },
  {
    "id": "xx-judgement-76",
    "num": 76,
    "name": "XX - Judgement?",
    "cardType": "reverse-tarot",
    "desc": "Spawns a Restock Machine"
  },
  {
    "id": "xxi-the-world-77",
    "num": 77,
    "name": "XXI - The World?",
    "cardType": "reverse-tarot",
    "desc": "Spawns a trapdoor to a crawlspace"
  },
  {
    "id": "cracked-key",
    "num": 78,
    "name": "Cracked Key",
    "cardType": "special",
    "desc": "Single-use Red Key"
  },
  {
    "id": "queen-of-hearts",
    "num": 79,
    "name": "Queen of Hearts",
    "cardType": "special",
    "desc": "Spawns 1-20 Red Hearts"
  },
  {
    "id": "wild-card",
    "num": 80,
    "name": "Wild Card",
    "cardType": "special",
    "desc": "Copies the effect of your most recently used pill, card, rune, soul stone or activated item"
  },
  {
    "id": "soul-of-isaac",
    "num": 81,
    "name": "Soul of Isaac",
    "cardType": "soul",
    "desc": "Makes all item pedestals in the room cycle between two different items"
  },
  {
    "id": "soul-of-magdalene",
    "num": 82,
    "name": "Soul of Magdalene",
    "cardType": "soul",
    "desc": "Effect lasts for the room: · Enemies killed drop half Red Hearts that disappear after 2 seconds"
  },
  {
    "id": "soul-of-cain",
    "num": 83,
    "name": "Soul of Cain",
    "cardType": "soul",
    "desc": "Opens all doors in the room · Creates red rooms on every wall possible"
  },
  {
    "id": "soul-of-judas",
    "num": 84,
    "name": "Soul of Judas",
    "cardType": "soul",
    "desc": "Activates Dark Arts with a 3 second duration · Temporary ↑ damage up for every enemy/projectile hit"
  },
  {
    "id": "soul-of",
    "num": 85,
    "name": "Soul of ???",
    "cardType": "soul",
    "desc": "Causes 8 poison farts with brown creep, then quickly spawns 7 Butt Bombs · Standing on the creep grants: · ↑ +1.5 Fire rate · ↑ +1 Damage"
  },
  {
    "id": "soul-of-eve",
    "num": 86,
    "name": "Soul of Eve",
    "cardType": "soul",
    "desc": "14 Dead Bird familiars fly in and attack enemies for the room"
  },
  {
    "id": "soul-of-samson",
    "num": 87,
    "name": "Soul of Samson",
    "cardType": "soul",
    "desc": "Activates Berserk! for 10 seconds · Each kill increases the duration by 1 second"
  },
  {
    "id": "soul-of-azazel",
    "num": 88,
    "name": "Soul of Azazel",
    "cardType": "soul",
    "desc": "Fires a Mega Blast beam for 7.5 seconds"
  },
  {
    "id": "soul-of-lazarus",
    "num": 89,
    "name": "Soul of Lazarus",
    "cardType": "soul",
    "desc": "Isaac dies and immediately revives at half a heart · This item is automatically used upon taking fatal damage (acts as an extra life)"
  },
  {
    "id": "soul-of-eden",
    "num": 90,
    "name": "Soul of Eden",
    "cardType": "soul",
    "desc": "Rerolls item pedestals and pickups in the room · The rerolled items come from random item pools"
  },
  {
    "id": "soul-of-the-lost",
    "num": 91,
    "name": "Soul of the Lost",
    "cardType": "soul",
    "desc": "Turns the player into The Lost for the room · Allows taking one Devil Room item for free · Allows entering the Mausoleum or Gehenna door for free"
  },
  {
    "id": "soul-of-lilith",
    "num": 92,
    "name": "Soul of Lilith",
    "cardType": "soul",
    "desc": "Permanently grants a random familiar"
  },
  {
    "id": "soul-of-the-keeper",
    "num": 93,
    "name": "Soul of the Keeper",
    "cardType": "soul",
    "desc": "Spawns 1-25 random coins"
  },
  {
    "id": "soul-of-apollyon",
    "num": 94,
    "name": "Soul of Apollyon",
    "cardType": "soul",
    "desc": "Spawns 15 random locusts"
  },
  {
    "id": "soul-of-the-forgotten",
    "num": 95,
    "name": "Soul of the Forgotten",
    "cardType": "soul",
    "desc": "Spawns The Forgotten as a secondary character for the room"
  },
  {
    "id": "soul-of-bethany",
    "num": 96,
    "name": "Soul of Bethany",
    "cardType": "soul",
    "desc": "Spawns 6 random Book of Virtues wisps"
  },
  {
    "id": "soul-of-jacob-and-esau",
    "num": 97,
    "name": "Soul of Jacob and Esau",
    "cardType": "soul",
    "desc": "Spawns Esau as a secondary character for the room · He spawns with as many passive items as the player"
  }
]
  for (var i = 0; i < defs.length; i++) defs[i].use = useFor(defs[i].num)
  IS.defineCards(defs)
})(window.IS)

