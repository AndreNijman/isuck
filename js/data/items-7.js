;(function (IS) {
  'use strict'

  // ---------------------------------------------------------------------------
  // ISUCK — collectibles 553 … 644 (the Antibirth/Repentance block).
  //
  // Schema: ARCHITECTURE.md §5.1. Hook vocabulary: §5.2 — nothing outside that
  // list, ever. Randomness comes only from the seeded context helpers (§9) in
  // js/data. Stats are never written to p.stats: an item either declares
  // `stats`/`mult`/`grant`, or edits the block handed to `onStats`.
  //
  // Everything in this file is dlc 'repentance' / rep:true — Antibirth content
  // shipped to the real game as part of Repentance, so that is the DLC gate.
  //
  // Temporary buffs (Golden Razor, Paschal Candle, Sol, Mega Mush, …) live in
  // p.cache under the 'i7.' namespace, are read back in `onStats`, and call
  // IS.recalcStats(p) when they change. That is the only sanctioned way to make
  // a stat move at runtime.
  //
  // Familiar defs for the items in this file are at the bottom of the file
  // (IS.defineFamiliars), one per owning item id, with sprite === id.
  // ---------------------------------------------------------------------------

  var TAU = Math.PI * 2

  // --- cache plumbing --------------------------------------------------------
  // 'i7.' keeps every key in this file out of the way of the other data files;
  // p.cache is explicitly the scratch space for item hooks (§4).

  var NS = 'i7.'

  function bag (p) {
    if (!p.cache) p.cache = {}
    return p.cache
  }

  function referenceHooks (info, active, id) {
    var text = String(info || '').toLowerCase()
    if (active) return {
      onUse: function (p, ctx) {
        if (!ctx) return { fail: true }
        if (text.indexOf('creep') >= 0 && typeof ctx.spawnCreep === 'function') ctx.spawnCreep(p.x, p.y, 180, { kind: 'yellow', dmg: 24, life: 8 })
        else if (text.indexOf('bomb') >= 0 && typeof ctx.spawnBomb === 'function') ctx.spawnBomb(p.x, p.y, { fuse: 1.2, friendly: true })
        else if (text.indexOf('card') >= 0 && typeof ctx.spawnPickup === 'function') ctx.spawnPickup('card')
        else if (text.indexOf('key') >= 0 && typeof ctx.spawnPickup === 'function') ctx.spawnPickup('key')
        else if (typeof ctx.spawnEffect === 'function') ctx.spawnEffect('burst', num(p.x, 0), num(p.y, 0), { colour: '#d8c890', n: 10 })
      }
    }
    return {
      onTearFire: function (p, tear, ctx) {
        if (!tear || !ctx) return
        var chance = text.indexOf('chance') >= 0 ? 0.14 : 0.04
        if (typeof ctx.chance === 'function' && !ctx.chance(chance)) return
        if (text.indexOf('poison') >= 0) addFlag(tear, 'poison')
        else if (text.indexOf('charm') >= 0) addFlag(tear, 'charm')
        else if (text.indexOf('freeze') >= 0 || text.indexOf('petrif') >= 0) addFlag(tear, 'freeze')
        else if (text.indexOf('knockback') >= 0) addFlag(tear, 'knockback')
        else tear.referenceEffect = id
      }
    }
  }

  function get (p, key, dflt) {
    var c = bag(p)
    var k = NS + key
    if (c[k] === undefined) c[k] = dflt
    return c[k]
  }

  function set (p, key, v) {
    bag(p)[NS + key] = v
    return v
  }

  // True exactly once per player per key — onInit also fires on run resume, so
  // anything that spawns pickups has to be gated on this.
  function once (p, key) {
    var c = bag(p)
    var k = NS + 'once.' + key
    if (c[k]) return false
    c[k] = true
    return true
  }

  function recalc (p) {
    if (typeof IS.recalcStats === 'function') IS.recalcStats(p)
  }

  // --- small numeric helpers -------------------------------------------------

  function num (v, d) {
    return typeof v === 'number' && v === v ? v : d
  }

  function clamp (v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v)
  }

  function copy (o) {
    var r = {}
    if (o) for (var k in o) r[k] = o[k]
    return r
  }

  function pstat (p, key, dflt) {
    return p && p.stats && typeof p.stats[key] === 'number' ? p.stats[key] : dflt
  }

  function dmgOf (p) {
    return pstat(p, 'damage', IS.BASE_DAMAGE)
  }

  // Accumulating tick timer: returns how many whole periods elapsed this frame.
  function timer (p, key, dt, period) {
    var t = get(p, key, 0) + num(dt, 0)
    var n = 0
    while (t >= period && n < 8) { t -= period; n++ }
    set(p, key, t)
    return n
  }

  // --- per-room work queues --------------------------------------------------
  // Spores, rifts and fires are objects with a lifetime that no engine system
  // owns, so they live in the cache and are ticked from onUpdate. Every owner
  // clears its queue in onRoomEnter: none of them survive a room change.

  function queue (p, key) {
    var q = get(p, key, null)
    if (!Array.isArray(q)) q = set(p, key, [])
    return q
  }

  function tickQueue (p, key, dt, each) {
    var q = get(p, key, null)
    if (!Array.isArray(q) || !q.length) return
    for (var i = q.length - 1; i >= 0; i--) {
      var it = q[i]
      if (!it) { q.splice(i, 1); continue }
      it.t = num(it.t, 0) - num(dt, 0)
      var keep = false
      try { keep = each(it) !== false } catch (e) { keep = false }
      if (!keep) q.splice(i, 1)
    }
  }

  // --- world helpers ---------------------------------------------------------

  function theRoom (room, ctx) {
    if (room && typeof room === 'object') return room
    return (ctx && ctx.room) || null
  }

  function theFloor (floor, ctx) {
    if (floor && typeof floor === 'object') return floor
    return (ctx && ctx.floor) || null
  }

  function living (ctx) {
    var list = ctx && typeof ctx.livingEnemies === 'function' ? ctx.livingEnemies() : null
    return Array.isArray(list) ? list : []
  }

  function nearby (ctx, x, y, r) {
    var out = []
    var list = living(ctx)
    var r2 = r * r
    for (var i = 0; i < list.length; i++) {
      var e = list[i]
      if (!e || e.dead) continue
      var dx = num(e.x, 0) - x
      var dy = num(e.y, 0) - y
      if (dx * dx + dy * dy <= r2) out.push(e)
    }
    return out
  }

  function hurt (e, dmg, ctx) {
    if (!e || e.dead || !(dmg > 0)) return
    if (typeof IS.damageEnemy === 'function') IS.damageEnemy(e, dmg, { src: 'item' }, ctx)
  }

  function shove (e, fromX, fromY, force) {
    if (!e || typeof IS.knockback !== 'function') return
    IS.knockback(e, fromX, fromY, force)
  }

  // Aim direction as a unit vector; never returns {0,0} so no caller divides by
  // zero or fires a tear with no velocity by accident.
  function aim (p) {
    var h = p && p.head
    var x = num(h && h.x, 0)
    var y = num(h && h.y, 0)
    var l = Math.sqrt(x * x + y * y)
    if (l < 0.0001) return { x: 1, y: 0 }
    return { x: x / l, y: y / l }
  }

  // tear.flags is a Set at runtime; tolerate an array too.
  function addFlag (t, f) {
    if (!t || !f) return
    if (t.flags && typeof t.flags.add === 'function') { t.flags.add(f); return }
    if (Array.isArray(t.flags)) { if (t.flags.indexOf(f) < 0) t.flags.push(f); return }
    t.flags = [f]
  }

  // Spawn a player tear on top of IS.tearBaseOpts so extra tears inherit the
  // player's own flags, sprite and size instead of silently coming out plain.
  function fireTear (ctx, p, x, y, angle, speed, dmg, extra, life) {
    var base = null
    if (typeof IS.tearBaseOpts === 'function') {
      try { base = IS.tearBaseOpts(p) } catch (e) { base = null }
    }
    var o = copy(base && typeof base === 'object' ? base : null)
    o.x = x
    o.y = y
    o.vx = Math.cos(angle) * speed
    o.vy = Math.sin(angle) * speed
    o.friendly = true
    if (dmg != null) o.dmg = dmg
    if (life != null) o.life = life
    if (extra && extra.length) {
      var f = []
      if (Array.isArray(o.flags)) f = o.flags.slice()
      else if (o.flags && typeof o.flags.forEach === 'function') o.flags.forEach(function (v) { f.push(v) })
      for (var i = 0; i < extra.length; i++) if (f.indexOf(extra[i]) < 0) f.push(extra[i])
      o.flags = f
    }
    return ctx.spawnTear(o)
  }

  // Turn nearby enemy shots around. Used by the shield items.
  function reflectShots (p, ctx, r) {
    var room = ctx && ctx.room
    if (!room || !Array.isArray(room.shots)) return 0
    var n = 0
    var r2 = r * r
    for (var i = 0; i < room.shots.length; i++) {
      var s = room.shots[i]
      if (!s || s.friendly || s.reflected) continue
      var dx = num(s.x, 0) - num(p.x, 0)
      var dy = num(s.y, 0) - num(p.y, 0)
      if (dx * dx + dy * dy > r2) continue
      s.vx = -num(s.vx, 0)
      s.vy = -num(s.vy, 0)
      s.friendly = true
      s.reflected = true
      n++
    }
    return n
  }

  function eatShots (ctx, x, y, r) {
    var room = ctx && ctx.room
    if (!room || !Array.isArray(room.shots)) return 0
    var n = 0
    var r2 = r * r
    for (var i = room.shots.length - 1; i >= 0; i--) {
      var s = room.shots[i]
      if (!s || s.friendly) continue
      var dx = num(s.x, 0) - x
      var dy = num(s.y, 0) - y
      if (dx * dx + dy * dy > r2) continue
      room.shots.splice(i, 1)
      n++
    }
    return n
  }

  // Damage sources arrive as entities, ids or plain strings depending on who
  // called IS.damagePlayer, so match loosely.
  function srcIs (source, names) {
    if (!source) return false
    var k = typeof source === 'string'
      ? source
      : String(source.kind || source.type || source.id || source.name || '')
    if (!k) return false
    k = k.toLowerCase()
    for (var i = 0; i < names.length; i++) if (k.indexOf(names[i]) >= 0) return true
    return false
  }

  function activeSlot (p, id) {
    if (!p || !Array.isArray(p.active)) return -1
    for (var i = 0; i < p.active.length; i++) {
      var a = p.active[i]
      if (a && a.id === id) return i
    }
    return -1
  }

  function findFamiliar (p, ctx, id) {
    var lists = [
      p && p.familiars,
      ctx && ctx.run && ctx.run.familiars,
      ctx && ctx.room && ctx.room.familiars
    ]
    for (var i = 0; i < lists.length; i++) {
      var l = lists[i]
      if (!Array.isArray(l)) continue
      for (var j = 0; j < l.length; j++) {
        var f = l[j]
        if (f && (f.id === id || (f.def && f.def.id === id))) return f
      }
    }
    return null
  }

  // The pickup shape is room.js's business, so probe rather than assume.
  function isPedestal (pk) {
    if (!pk || pk.taken || pk.dead) return false
    if (pk.kind === 'item' || pk.kind === 'pedestal' || pk.kind === 'collectible') return true
    return !!(pk.itemId || (pk.item && pk.item.id))
  }

  function pedestalId (pk) {
    if (!pk) return null
    if (typeof pk.itemId === 'string') return pk.itemId
    if (pk.item && typeof pk.item.id === 'string') return pk.item.id
    if (typeof pk.collectible === 'string') return pk.collectible
    if (typeof pk.id === 'string' && IS.itemsById && IS.itemsById[pk.id]) return pk.id
    return null
  }

  function fullHealth (p) {
    var h = p && p.hearts
    if (!h) return false
    return num(h.maxRed, 0) > 0 && num(h.red, 0) >= num(h.maxRed, 0)
  }

  // Which pool a room's pedestal would have come from.
  var ROOM_POOL = {
    treasure: 'treasure', shop: 'shop', boss: 'boss', 'boss-double': 'boss',
    devil: 'devil', angel: 'angel', secret: 'secret', 'super-secret': 'secret',
    'ultra-secret': 'ultra-secret', library: 'library', curse: 'curse',
    planetarium: 'planetarium', 'boss-rush': 'boss', challenge: 'boss',
    'black-market': 'shop', vault: 'golden-chest', bedroom: 'treasure'
  }

  var CRUSHABLE = {
    rock: 1, 'tinted-rock': 1, 'marked-skull': 1, poop: 1, 'golden-poop': 1,
    'red-poop': 1, 'corn-poop': 1, tnt: 1, vase: 1, mushroom: 1, web: 1,
    pillar: 1
  }

  var FORTUNES = [
    'The house always wins.',
    'A closed door hides an open one.',
    'Your mother knows what you did.',
    'Coins are heavier than they look.',
    'The basement remembers every step.',
    'Something down here is counting.'
  ]

  // The worm trinkets and the tear-shape items Almond Milk borrows from.
  var MILK_FLAGS = [
    'wiggle', 'homing', 'spectral', 'piercing', 'bouncing', 'sinusoid',
    'magnetize', 'knockback', 'booger', 'lodge', 'shrink'
  ]

  // Playdough Cookie cycles its tear colours; each colour is a status.
  var PLAYDOUGH_FLAGS = [
    'poison', 'petrify', 'homing', 'fear', 'freeze', 'slow', 'charm',
    'confusion', 'bleed', 'burn'
  ]

  var NANCY_EFFECTS = ['poison', 'burn', 'holy', 'rock', 'pull', 'scatter', 'giant']

  // ---------------------------------------------------------------------------
  // 553 … 570
  // ---------------------------------------------------------------------------

  IS.defineItems([

    {
      id: 'mucormycosis',
      num: 553,
      name: 'Mucormycosis',
      desc: 'Spore tears',
      info: '25% chance to shoot a sticky spore tear · Spores blow up after 2.5 seconds, dealing damage, poisoning nearby enemies and releasing more spores',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure'],
      tags: ['offensive', 'tears', 'mushroom'],
      transform: 'fun-guy',
      rep: true,
      dlc: 'repentance',
      hooks: {
        onTearFire: function (p, tear, ctx) {
          // Fixed 25%: the item explicitly does not scale with luck.
          if (!tear || !ctx.chance(0.25)) return
          addFlag(tear, 'sticky')
          addFlag(tear, 'poison')
          tear.i7Spore = true
        },
        onTearHit: function (p, tear, enemy, ctx) {
          if (!tear || !tear.i7Spore || !enemy) return
          queue(p, 'spores').push({
            t: 2.5, x: num(enemy.x, 0), y: num(enemy.y, 0), e: enemy, dmg: dmgOf(p)
          })
        },
        onUpdate: function (p, dt, ctx) {
          tickQueue(p, 'spores', dt, function (it) {
            if (it.t > 0) {
              if (it.e && !it.e.dead) { it.x = num(it.e.x, it.x); it.y = num(it.e.y, it.y) }
              return true
            }
            var hits = nearby(ctx, it.x, it.y, 95)
            for (var i = 0; i < hits.length; i++) {
              hurt(hits[i], it.dmg, ctx)
              ctx.applyStatus(hits[i], 'poison', 4)
            }
            for (var a = 0; a < 4; a++) {
              fireTear(ctx, p, it.x, it.y, a * TAU / 4 + 0.4, 250, it.dmg * 0.5, ['poison', 'sticky'], 0.9)
            }
            ctx.spawnEffect('burst', it.x, it.y, { colour: '#8ab04a', n: 12 })
            ctx.sfx('tear-splat')
            return false
          })
        },
        onRoomEnter: function (p) {
          set(p, 'spores', [])
        }
      }
    },

    {
      id: '2spooky',
      num: 554,
      name: '2Spooky',
      desc: 'Fear aura',
      info: 'Fears enemies in a small radius around Isaac',
      kind: 'passive',
      quality: 1,
      pools: ['devil', 'greed-devil', 'ultra-secret'],
      tags: ['defensive', 'utility', 'devil'],
      rep: true,
      dlc: 'repentance',
      hooks: {
        onUpdate: function (p, dt, ctx) {
          if (!timer(p, 'spooky', dt, 0.5)) return
          var list = nearby(ctx, num(p.x, 0), num(p.y, 0), 135)
          for (var i = 0; i < list.length; i++) ctx.applyStatus(list[i], 'fear', 1.4)
        }
      }
    },

    {
      id: 'golden-razor',
      num: 555,
      name: 'Golden Razor',
      desc: 'Blood money',
      info: '+5 coins on pickup · Pay 5 coins for +1.2 damage for the room',
      kind: 'active',
      quality: 1,
      pools: ['treasure', 'greed-treasure'],
      tags: ['offensive', 'coins', 'damage'],
      charge: 0,
      chargeType: 'normal',
      grant: { coins: 5 },
      rep: true,
      dlc: 'repentance',
      hooks: {
        onUse: function (p, ctx) {
          if (num(p.coins, 0) < 5) {
            ctx.floater('5 coins', num(p.x, 0), num(p.y, 0) - 40, '#e0c040')
            return { fail: true }
          }
          ctx.addCoins(-5)
          set(p, 'razor', get(p, 'razor', 0) + 1.2)
          recalc(p)
          ctx.spawnEffect('blood', num(p.x, 0), num(p.y, 0), { n: 8, colour: '#a01c1c' })
          ctx.sfx('shop-buy')
          return { keepCharge: true }
        },
        onStats: function (p, s) {
          var v = get(p, 'razor', 0)
          if (v) s.damage = num(s.damage, 0) + v
        },
        onRoomEnter: function (p) {
          if (get(p, 'razor', 0)) { set(p, 'razor', 0); recalc(p) }
        }
      }
    },

    {
      id: 'sulfur',
      num: 556,
      name: 'Sulfur',
      desc: 'Brimstone for the room',
      info: 'Brimstone for the room · Using it multiple times in one room grants increased damage and a larger beam',
      kind: 'active',
      quality: 2,
      pools: ['devil', 'greed-devil', 'ultra-secret'],
      tags: ['offensive', 'brimstone', 'devil'],
      charge: 6,
      chargeType: 'normal',
      transform: 'leviathan',
      rep: true,
      dlc: 'repentance',
      hooks: {
        onUse: function (p, ctx) {
          set(p, 'sulfur', get(p, 'sulfur', 0) + 1)
          ctx.spawnEffect('flash', num(p.x, 0), num(p.y, 0), { colour: '#8a2020', secs: 0.2 })
          ctx.sfx('brimstone-fire')
        },
        onTearFire: function (p, tear, ctx) {
          var n = get(p, 'sulfur', 0)
          if (!n || !tear) return
          // The engine owns what 'brimstone' does; stacking uses only scale it.
          addFlag(tear, 'brimstone')
          addFlag(tear, 'piercing')
          tear.dmg = num(tear.dmg, dmgOf(p)) * (1 + 0.25 * (n - 1))
          tear.r = num(tear.r, 8) * (1 + 0.2 * (n - 1))
        },
        onRoomEnter: function (p) {
          if (get(p, 'sulfur', 0)) set(p, 'sulfur', 0)
        }
      }
    },

    {
      id: 'fortune-cookie',
      num: 557,
      name: 'Fortune Cookie',
      desc: 'A little luck',
      info: 'Grants one of: a fortune, a Soul Heart, a Rune or Soul Stone, a Tarot card, a Trinket',
      kind: 'active',
      quality: 1,
      pools: ['treasure', 'greed-treasure'],
      tags: ['utility', 'consumable', 'card'],
      charge: 4,
      chargeType: 'normal',
      rep: true,
      dlc: 'repentance',
      hooks: {
        onUse: function (p, ctx) {
          var roll = ctx.int(5)
          if (roll === 0) {
            ctx.banner('A FORTUNE', ctx.pick(FORTUNES) || '')
            ctx.sfx('beep')
            return
          }
          if (roll === 1) {
            ctx.spawnPickup('soul', null, null, {})
          } else if (roll === 2) {
            ctx.spawnPickup('rune', null, null, { id: ctx.rollRune() })
          } else if (roll === 3) {
            ctx.spawnPickup('card', null, null, { id: ctx.rollCard() })
          } else {
            ctx.spawnPickup('trinket', null, null, { id: ctx.rollTrinket() })
          }
          ctx.sfx('item-pickup')
        }
      }
    },

    {
      id: 'eye-sore',
      num: 558,
      name: 'Eye Sore',
      desc: 'Wild extra tears',
      info: 'Chance to shoot 1-3 extra tears in random directions · Not affected by luck',
      kind: 'passive',
      quality: 1,
      pools: ['treasure', 'greed-treasure'],
      tags: ['offensive', 'tears'],
      rep: true,
      dlc: 'repentance',
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (!tear || !ctx.chance(0.2)) return
          var sp = Math.sqrt(num(tear.vx, 0) * num(tear.vx, 0) + num(tear.vy, 0) * num(tear.vy, 0)) || IS.TEAR_SPEED
          var n = 1 + ctx.int(3)
          for (var i = 0; i < n; i++) {
            fireTear(ctx, p, num(tear.x, num(p.x, 0)), num(tear.y, num(p.y, 0)), ctx.range(0, TAU), sp, num(tear.dmg, dmgOf(p)), null, null)
          }
        }
      }
    },

    {
      id: '120-volt',
      num: 559,
      name: '120 Volt',
      desc: 'Zaps everything close',
      info: "Repeatedly zaps nearby enemies for up to 3.75x Isaac's damage per second · Sparks arc to up to 4 other enemies",
      kind: 'passive',
      quality: 3,
      pools: ['treasure', 'battery-bum', 'greed-treasure'],
      tags: ['offensive', 'damage'],
      rep: true,
      dlc: 'repentance',
      hooks: {
        onUpdate: function (p, dt, ctx) {
          var n = timer(p, 'volt', dt, 0.25)
          if (!n) return
          var px = num(p.x, 0)
          var py = num(p.y, 0)
          var first = ctx.nearestEnemy(px, py)
          if (!first) return
          var dx = num(first.x, 0) - px
          var dy = num(first.y, 0) - py
          if (dx * dx + dy * dy > 215 * 215) return
          var dmg = dmgOf(p) * 3.75 * 0.25 * n
          hurt(first, dmg, ctx)
          ctx.spawnEffect('beam', px, py, {
            angle: Math.atan2(dy, dx), len: Math.sqrt(dx * dx + dy * dy), colour: '#9ad8ff'
          })
          var chain = [first]
          var from = first
          for (var i = 0; i < 4; i++) {
            var list = nearby(ctx, num(from.x, 0), num(from.y, 0), 145)
            var next = null
            for (var j = 0; j < list.length; j++) {
              if (chain.indexOf(list[j]) < 0) { next = list[j]; break }
            }
            if (!next) break
            hurt(next, dmg * 0.6, ctx)
            ctx.spawnEffect('beam', num(from.x, 0), num(from.y, 0), {
              angle: Math.atan2(num(next.y, 0) - num(from.y, 0), num(next.x, 0) - num(from.x, 0)),
              len: 145, colour: '#9ad8ff'
            })
            chain.push(next)
            from = next
          }
          ctx.sfx('laser-fire', { vol: 0.3 })
        }
      }
    },

    {
      id: 'it-hurts',
      num: 560,
      name: 'It Hurts',
      desc: 'Pain makes you faster',
      info: 'Taking damage grants +1.2 fire rate for the room (+0.4 per further hit) and releases a ring of 10 tears',
      kind: 'passive',
      quality: 1,
      pools: ['treasure', 'greed-treasure'],
      tags: ['offensive', 'tears', 'defensive'],
      rep: true,
      dlc: 'repentance',
      hooks: {
        onPlayerDamage: function (p, amount, source, ctx) {
          set(p, 'itHurts', get(p, 'itHurts', 0) + 1)
          recalc(p)
          for (var i = 0; i < 10; i++) {
            fireTear(ctx, p, num(p.x, 0), num(p.y, 0), i * TAU / 10, 430, dmgOf(p), null, null)
          }
          ctx.sfx('tear-fire')
        },
        onStats: function (p, s) {
          var h = get(p, 'itHurts', 0)
          if (h > 0) s.tears = num(s.tears, 0) + 1.2 + 0.4 * (h - 1)
        },
        onRoomEnter: function (p) {
          if (get(p, 'itHurts', 0)) { set(p, 'itHurts', 0); recalc(p) }
        }
      }
    },

    {
      id: 'almond-milk',
      num: 561,
      name: 'Almond Milk',
      desc: 'A hail of weak tears',
      info: 'x4 fire rate, x0.3 damage, -0.16 tear size · Tears gain random worm trinket effects',
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure'],
      tags: ['offensive', 'tears', 'damage', 'quality-shift'],
      stats: { tearSize: -0.16 },
      mult: { tears: 4, damage: 0.3 },
      rep: true,
      dlc: 'repentance',
      hooks: {
        onTearFire: function (p, tear, ctx) {
          if (!tear) return
          addFlag(tear, ctx.pick(MILK_FLAGS) || 'wiggle')
        }
      }
    },

    {
      id: 'rock-bottom',
      num: 562,
      name: 'Rock Bottom',
      desc: 'Stats never drop',
      info: 'Prevents stats from being lowered for the rest of the run',
      kind: 'passive',
      quality: 3,
      pools: ['secret', 'greed-secret'],
      tags: ['utility', 'damage', 'tears'],
      rep: true,
      dlc: 'repentance',
      hooks: {
        // A high-water mark, taken inside onStats so it sees the finished block.
        // max() is idempotent, which is what §5.2 asks of onStats; it clamps
        // declarative stat-downs and hook-driven ones alike, because both have
        // already been applied by the time the last hook in the chain runs.
        onStats: function (p, s) {
          var hi = get(p, 'rockBottom', null)
          if (!hi || typeof hi !== 'object') hi = set(p, 'rockBottom', {})
          var keys = ['damage', 'tears', 'range', 'shotSpeed', 'speed', 'luck', 'tearSize', 'multishot']
          for (var i = 0; i < keys.length; i++) {
            var k = keys[i]
            var v = num(s[k], 0)
            if (hi[k] === undefined || v > hi[k]) hi[k] = v
            else s[k] = hi[k]
          }
        }
      }
    },

    {
      id: 'nancy-bombs',
      num: 563,
      name: 'Nancy Bombs',
      desc: 'Bombs with a surprise',
      info: "+5 bombs · Isaac's bombs explode with random effects",
      kind: 'passive',
      quality: 1,
      pools: ['treasure', 'greed-treasure', 'bomb-bum'],
      tags: ['bombs', 'offensive'],
      grant: { bombs: 5 },
      rep: true,
      dlc: 'repentance',
      hooks: {
        onBombExplode: function (p, bomb, ctx) {
          // ctx.bombExplode re-enters this hook, so the flag is load-bearing.
          if (get(p, 'nancyBusy', false)) return
          set(p, 'nancyBusy', true)
          try {
            var x = num(bomb && bomb.x, num(p.x, 0))
            var y = num(bomb && bomb.y, num(p.y, 0))
            var kind = ctx.pick(NANCY_EFFECTS) || 'poison'
            var list = nearby(ctx, x, y, 150)
            var i
            if (kind === 'poison') {
              for (i = 0; i < list.length; i++) ctx.applyStatus(list[i], 'poison', 5)
              ctx.spawnCreep(x, y, 70, { colour: '#7ab04a', kind: 'green', dmg: 8, life: 12 })
            } else if (kind === 'burn') {
              for (i = 0; i < list.length; i++) ctx.applyStatus(list[i], 'burn', 4)
              ctx.spawnEffect('burst', x, y, { colour: '#e08030', n: 18 })
            } else if (kind === 'holy') {
              for (i = 0; i < 8; i++) fireTear(ctx, p, x, y, i * TAU / 8, 420, dmgOf(p) * 1.5, ['holy', 'light'], 0.8)
            } else if (kind === 'rock') {
              for (i = 0; i < 8; i++) fireTear(ctx, p, x, y, i * TAU / 8 + 0.4, 380, dmgOf(p), ['rock', 'knockback'], 0.8)
            } else if (kind === 'pull') {
              for (i = 0; i < list.length; i++) {
                var e = list[i]
                e.x = num(e.x, 0) + (x - num(e.x, 0)) * 0.5
                e.y = num(e.y, 0) + (y - num(e.y, 0)) * 0.5
                hurt(e, num(p.stats && p.stats.bombDamage, IS.BASE_BOMB_DAMAGE) * 0.3, ctx)
              }
              ctx.spawnEffect('ring', x, y, { colour: '#2a1a3a', r0: 120, r1: 10, life: 0.35 })
            } else if (kind === 'scatter') {
              for (i = 0; i < 3; i++) {
                ctx.bombExplode(x + ctx.range(-110, 110), y + ctx.range(-110, 110), { dmg: num(p.stats && p.stats.bombDamage, IS.BASE_BOMB_DAMAGE) * 0.6, r: 70 })
              }
            } else {
              ctx.bombExplode(x, y, { dmg: num(p.stats && p.stats.bombDamage, IS.BASE_BOMB_DAMAGE) * 1.5, r: 160 })
              ctx.shake(7, 0.3)
            }
          } finally {
            set(p, 'nancyBusy', false)
          }
        }
      }
    },

    {
      id: 'a-bar-of-soap',
      num: 564,
      name: 'A Bar of Soap',
      desc: 'Tears up, shot speed up',
      info: '+0.5 tears · +0.2 shot speed',
      kind: 'passive',
      quality: 2,
      pools: ['boss', 'greed-boss'],
      tags: ['tears', 'offensive'],
      stats: { tears: 0.5, shotSpeed: 0.2 },
      rep: true,
      dlc: 'repentance'
    },

    {
      id: 'blood-puppy',
      num: 565,
      name: 'Blood Puppy',
      desc: 'Good boy. For now',
      info: 'Chases enemies · After 15 kills it hits harder, drops hearts and snaps at Isaac · After 40 kills it is stronger again',
      kind: 'familiar',
      quality: 2,
      pools: ['treasure', 'red-chest', 'curse', 'greed-treasure', 'greed-curse', 'ultra-secret'],
      tags: ['familiar', 'offensive', 'pet'],
      familiars: ['blood-puppy'],
      rep: true,
      dlc: 'repentance',
      hooks: {
        onEnemyKill: function (p, enemy, ctx) {
          var k = get(p, 'puppyKills', 0) + 1
          set(p, 'puppyKills', k)
          if (k === 15 || k === 40) {
            // ctx.spawnFamiliar copies opts onto the instance, so a respawn is
            // how the puppy's own damage grows.
            if (typeof IS.removeFamiliar === 'function') IS.removeFamiliar(p, 'blood-puppy')
            ctx.spawnFamiliar('blood-puppy', k >= 40
              ? { dmg: 20, r: 26, speed: 410, cooldown: 0.35 }
              : { dmg: 11, r: 22, speed: 375, cooldown: 0.4 })
            ctx.banner('BLOOD PUPPY', k >= 40 ? 'It has grown' : 'It has tasted blood')
            ctx.sfx('familiar-spawn')
          }
          if (k >= 15 && k % 10 === 0) {
            ctx.spawnPickup('heart', enemy ? num(enemy.x, null) : null, enemy ? num(enemy.y, null) : null, { half: k < 40 })
          }
          if (k >= 15 && ctx.chance(0.06)) ctx.damagePlayer(1, 'blood-puppy')
        },
        // APPROXIMATED: nothing can shoot a familiar, so "damage it back to its
        // first phase" is settled by a floor change instead.
        onNewFloor: function (p, floor, ctx) {
          if (get(p, 'puppyKills', 0) < 15) return
          set(p, 'puppyKills', 0)
          if (typeof IS.removeFamiliar === 'function') IS.removeFamiliar(p, 'blood-puppy')
          ctx.spawnFamiliar('blood-puppy', {})
        }
      }
    },

    {
      id: 'dream-catcher',
      num: 566,
      name: 'Dream Catcher',
      desc: 'See what is coming',
      info: "+1 half Soul Heart on every new floor · Reveals the next floor's boss and Treasure Room",
      kind: 'passive',
      quality: 2,
      pools: ['shop', 'greed-shop'],
      tags: ['utility', 'hearts'],
      rep: true,
      dlc: 'repentance',
      hooks: {
        onNewFloor: function (p, floor, ctx) {
          ctx.addSoul(1)
          var f = theFloor(floor, ctx)
          if (!f || !Array.isArray(f.rooms)) return
          var bossName = null
          for (var i = 0; i < f.rooms.length; i++) {
            var rm = f.rooms[i]
            if (!rm || (rm.type !== 'boss' && rm.type !== 'treasure')) continue
            rm.mapped = true
            if (rm.meta && typeof rm.meta === 'object') rm.meta.revealed = true
            if (rm.type === 'boss' && rm.boss) {
              bossName = (typeof rm.boss === 'string' ? rm.boss : (rm.boss.name || rm.boss.id)) || bossName
            }
          }
          // The stage-transition nightmare is a cutscene we do not have; the
          // reveal lands on the map instead.
          ctx.banner('DREAM CATCHER', bossName ? 'Ahead: ' + bossName : 'The floor is revealed')
        }
      }
    },

    {
      id: 'paschal-candle',
      num: 567,
      name: 'Paschal Candle',
      desc: 'Burns brighter unhurt',
      info: 'Clearing a room without taking damage grants +0.4 fire rate, up to +2 · Resets when hit',
      kind: 'passive',
      quality: 3,
      pools: ['angel', 'greed-angel'],
      tags: ['tears', 'offensive', 'angel'],
      rep: true,
      dlc: 'repentance',
      hooks: {
        onRoomClear: function (p, room, ctx) {
          if (get(p, 'paschalHit', false)) return
          var v = Math.min(2, get(p, 'paschal', 0) + 0.4)
          if (v !== get(p, 'paschal', 0)) {
            set(p, 'paschal', v)
            recalc(p)
            ctx.spawnEffect('flash', num(p.x, 0), num(p.y, 0), { colour: '#f0d060', secs: 0.15 })
          }
        },
        onPlayerDamage: function (p) {
          set(p, 'paschalHit', true)
          if (get(p, 'paschal', 0)) { set(p, 'paschal', 0); recalc(p) }
        },
        onRoomEnter: function (p) {
          set(p, 'paschalHit', false)
        },
        onStats: function (p, s) {
          var v = get(p, 'paschal', 0)
          if (v) s.tears = num(s.tears, 0) + v
        }
      }
    },

    {
      id: 'divine-intervention',
      num: 568,
      name: 'Divine Intervention',
      desc: 'A shield on demand',
      info: 'Re-opening fire creates a 1 second shield that pushes enemies away and reflects projectiles',
      kind: 'passive',
      quality: 2,
      pools: ['angel', 'greed-angel'],
      tags: ['defensive', 'angel'],
      transform: 'seraphim',
      rep: true,
      dlc: 'repentance',
      hooks: {
        // APPROXIMATED: no hook sees raw key edges, so the "double tap" trigger
        // is modelled as opening fire again after a short pause, on a cooldown.
        onTearFire: function (p, tear, ctx) {
          var gap = get(p, 'diGap', 99)
          set(p, 'diGap', 0)
          if (gap < 0.35 || get(p, 'diCd', 0) > 0) return
          set(p, 'diCd', 2)
          set(p, 'diShield', 1)
          var list = nearby(ctx, num(p.x, 0), num(p.y, 0), 140)
          for (var i = 0; i < list.length; i++) shove(list[i], num(p.x, 0), num(p.y, 0), 620)
          reflectShots(p, ctx, 140)
          ctx.spawnEffect('ring', num(p.x, 0), num(p.y, 0), { colour: '#f0e8b0', r0: 20, r1: 140, life: 0.35, width: 6 })
          ctx.sfx('holy-shield')
        },
        onUpdate: function (p, dt, ctx) {
          set(p, 'diGap', get(p, 'diGap', 99) + num(dt, 0))
          var cd = get(p, 'diCd', 0)
          if (cd > 0) set(p, 'diCd', Math.max(0, cd - num(dt, 0)))
          var s = get(p, 'diShield', 0)
          if (s <= 0) return
          set(p, 'diShield', Math.max(0, s - num(dt, 0)))
          reflectShots(p, ctx, 140)
        },
        onPlayerDamage: function (p) {
          if (get(p, 'diShield', 0) > 0) return { cancel: true }
        }
      }
    },

    {
      id: 'blood-oath',
      num: 569,
      name: 'Blood Oath',
      desc: 'Blood for power',
      info: 'Entering a new floor drains your Red Hearts and grants damage and speed for each half lost',
      kind: 'passive',
      quality: 1,
      pools: ['devil', 'curse', 'greed-curse', 'greed-devil'],
      tags: ['devil', 'damage', 'speed', 'hearts'],
      rep: true,
      dlc: 'repentance',
      hooks: {
        // APPROXIMATED: each half-heart cannot be charged as a separate hit —
        // IS.damagePlayer grants invulnerability after the first — so the oath
        // takes the hearts directly and leaves half a heart behind.
        onNewFloor: function (p, floor, ctx) {
          var h = p.hearts
          if (!h) return
          var drained = Math.max(0, num(h.red, 0) - 1)
          if (drained > 0) {
            h.red = 1
            set(p, 'oath', drained)
            ctx.spawnEffect('blood', num(p.x, 0), num(p.y, 0), { n: 18, colour: '#a01c1c' })
            ctx.sfx('player-hurt')
          } else {
            set(p, 'oath', 0)
          }
          recalc(p)
        },
        onStats: function (p, s) {
          var n = get(p, 'oath', 0)
          if (!n) return
          s.damage = num(s.damage, 0) + 0.35 * n
          s.speed = num(s.speed, 0) + 0.03 * n
        }
      }
    },

    {
      id: 'playdough-cookie',
      num: 570,
      name: 'Playdough Cookie',
      desc: 'Every tear a different colour',
      info: "Each of Isaac's tears has a different colour and status effect",
      kind: 'passive',
      quality: 2,
      pools: ['treasure', 'greed-treasure'],
      tags: ['offensive', 'tears'],
      rep: true,
      dlc: 'repentance',
      hooks: {
        onTearFire: function (p, tear) {
          if (!tear) return
          var i = get(p, 'playdough', 0)
          set(p, 'playdough', i + 1)
          addFlag(tear, PLAYDOUGH_FLAGS[i % PLAYDOUGH_FLAGS.length])
        }
      }
    },

    {
      id: "orphan-socks",
      num: 571,
      name: "Orphan Socks",
      desc: "↑ +0.3 Speed",
      info: "↑ +0.3 Speed · +2 Soul Hearts · Immune to creep and floor spikes",
      kind: 'passive',
      quality: 2,
      pools: ["secret","golden-chest","greed-secret"],
      tags: ["hearts"],
      dlc: "antibirth",
      stats: {"speed":0.3},
      grant: {"soul":4},
      hooks: referenceHooks("↑ +0.3 Speed · +2 Soul Hearts · Immune to creep and floor spikes", false, "orphan-socks")
    },

    {
      id: "eye-of-the-occult",
      num: 572,
      name: "Eye of the Occult",
      desc: "↑ +1 Damage",
      info: "↑ +1 Damage · ↑ +2 Range · ↓ -0.16 Shot speed · Isaac's tears can be controlled in mid-air",
      kind: 'passive',
      quality: 2,
      pools: ["devil","greed-devil","ultra-secret"],
      tags: ["damage","offensive"],
      dlc: "antibirth",
      stats: {"damage":1,"range":80,"shotSpeed":-0.16},
      transform: "leviathan",
      hooks: referenceHooks("↑ +1 Damage · ↑ +2 Range · ↓ -0.16 Shot speed · Isaac's tears can be controlled in mid-air", false, "eye-of-the-occult")
    },

    {
      id: "immaculate-heart",
      num: 573,
      name: "Immaculate Heart",
      desc: "↑ +1 Health",
      info: "↑ +1 Health · ↑ x1.2 Damage multiplier · Full health · 20% chance to shoot an extra orbiting spectral tear",
      kind: 'passive',
      quality: 2,
      pools: ["angel","greed-angel","ultra-secret"],
      tags: ["damage","offensive"],
      dlc: "antibirth",
      mult: {"damage":1.2},
      grant: {"maxHearts":2},
      transform: "seraphim",
      hooks: referenceHooks("↑ +1 Health · ↑ x1.2 Damage multiplier · Full health · 20% chance to shoot an extra orbiting spectral tear", false, "immaculate-heart")
    },

    {
      id: "monstrance",
      num: 574,
      name: "Monstrance",
      desc: "Isaac is surrounded by a damaging aura",
      info: "Isaac is surrounded by a damaging aura · The closer enemies are to Isaac, the more damage the aura deals to them",
      kind: 'passive',
      quality: 2,
      pools: ["angel","greed-angel"],
      tags: ["damage"],
      dlc: "antibirth",
      hooks: referenceHooks("Isaac is surrounded by a damaging aura · The closer enemies are to Isaac, the more damage the aura deals to them", false, "monstrance")
    },

    {
      id: "the-intruder",
      num: 575,
      name: "The Intruder",
      desc: "Buries itself in Isaac's head and shoots 4 extra slowing tears that deal 1.5 damage",
      info: "Buries itself in Isaac's head and shoots 4 extra slowing tears that deal 1.5 damage · Taking damage has a 25% chance to make the spider exit the head and chase enemies",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure","baby-shop"],
      tags: ["damage","offensive","spider"],
      dlc: "antibirth",
      transform: "spider",
      hooks: referenceHooks("Buries itself in Isaac's head and shoots 4 extra slowing tears that deal 1.5 damage · Taking damage has a 25% chance to make the spider exit the head and chase enemies", false, "the-intruder")
    },

    {
      id: "dirty-mind",
      num: 576,
      name: "Dirty Mind",
      desc: "All Dip (small poop) enemies are friendly",
      info: "All Dip (small poop) enemies are friendly · Destroying poop spawns 1-4 Dips · Dip type depends on the poop type · Rocks have a 6.25% chance to be replaced with poop",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","beggar","greed-treasure"],
      tags: [],
      dlc: "antibirth",
      hooks: referenceHooks("All Dip (small poop) enemies are friendly · Destroying poop spawns 1-4 Dips · Dip type depends on the poop type · Rocks have a 6.25% chance to be replaced with poop", false, "dirty-mind")
    },

    {
      id: "damocles",
      num: 577,
      name: "Damocles",
      desc: "Hangs a sword above Isaac's head, which doubles all pedestal items",
      info: "Hangs a sword above Isaac's head, which doubles all pedestal items · Does not double items that have a price or come from chests · After taking any damage, the sword has an extremely low chance to instantly kill Isaac every frame · Invincibility effects can prevent the death",
      kind: 'active',
      quality: 2,
      pools: ["devil","greed-devil"],
      tags: ["damage"],
      dlc: "antibirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Hangs a sword above Isaac's head, which doubles all pedestal items · Does not double items that have a price or come from chests · After taking any damage, the sword has an extremely low chance to instantly kill Isaac every frame · Invincibility effects can prevent the death", true, "damocles")
    },

    {
      id: "free-lemonade",
      num: 578,
      name: "Free Lemonade",
      desc: "Creates a large pool of yellow creep",
      info: "Creates a large pool of yellow creep · The creep deals 24 damage per second",
      kind: 'active',
      quality: 2,
      pools: ["treasure","greed-treasure"],
      tags: ["damage"],
      dlc: "antibirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Creates a large pool of yellow creep · The creep deals 24 damage per second", true, "free-lemonade")
    },

    {
      id: "spirit-sword",
      num: 579,
      name: "Spirit Sword",
      desc: "Instead of shooting tears, swing a sword",
      info: "Instead of shooting tears, swing a sword · The sword deals 3x Isaac's damage +3.5 and swings as fast as the fire button is tapped · Charging does a spin attack + projectile shot · Shoots projectiles with swings at full health",
      kind: 'passive',
      quality: 2,
      pools: ["angel","greed-angel"],
      tags: ["damage","offensive"],
      dlc: "antibirth",
      hooks: referenceHooks("Instead of shooting tears, swing a sword · The sword deals 3x Isaac's damage +3.5 and swings as fast as the fire button is tapped · Charging does a spin attack + projectile shot · Shoots projectiles with swings at full health", false, "spirit-sword")
    },

    {
      id: "red-key",
      num: 580,
      name: "Red Key",
      desc: "Creates a red room adjacent to a regular room, indicated by a door outline",
      info: "Creates a red room adjacent to a regular room, indicated by a door outline · Red Rooms can be special rooms · Entering a room outside the 13x13 floor map teleports Isaac to the I AM ERROR room",
      kind: 'active',
      quality: 2,
      pools: ["secret","red-chest","curse","key-master","moms-chest","ultra-secret"],
      tags: [],
      dlc: "antibirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Creates a red room adjacent to a regular room, indicated by a door outline · Red Rooms can be special rooms · Entering a room outside the 13x13 floor map teleports Isaac to the I AM ERROR room", true, "red-key")
    },

    {
      id: "psy-fly",
      num: 581,
      name: "Psy Fly",
      desc: "Chases and blocks enemy projectiles",
      info: "Chases and blocks enemy projectiles · Deals 15 contact damage per second",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","key-master","greed-treasure","baby-shop"],
      tags: ["damage"],
      dlc: "antibirth",
      hooks: referenceHooks("Chases and blocks enemy projectiles · Deals 15 contact damage per second", false, "psy-fly")
    },

    {
      id: "wavy-cap",
      num: 582,
      name: "Wavy Cap",
      desc: "↑ +0.75 Fire rate",
      info: "↑ +0.75 Fire rate · ↓ -0.03 Speed · Distorts the screen · Takes longer to recharge each use · Leaving or clearing rooms reduces the effects",
      kind: 'active',
      quality: 2,
      pools: ["secret","greed-secret"],
      tags: [],
      dlc: "antibirth",
      charge: 6,
      chargeType: 'normal',
      transform: "fun-guy",
      hooks: referenceHooks("↑ +0.75 Fire rate · ↓ -0.03 Speed · Distorts the screen · Takes longer to recharge each use · Leaving or clearing rooms reduces the effects", true, "wavy-cap")
    },

    {
      id: "rocket-in-a-jar",
      num: 583,
      name: "Rocket in a Jar",
      desc: "+5 Bombs",
      info: "+5 Bombs · Placing a bomb while shooting fires a rocket in that direction instead",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure","bomb-bum"],
      tags: ["bombs"],
      dlc: "antibirth",
      hooks: referenceHooks("+5 Bombs · Placing a bomb while shooting fires a rocket in that direction instead", false, "rocket-in-a-jar")
    },

    {
      id: "book-of-virtues",
      num: 584,
      name: "Book of Virtues",
      desc: "+12.5% Angel Room chance while held",
      info: "+12.5% Angel Room chance while held · Spawns an orbital wisp familiar that shoots spectral tears but can be destroyed · Can be combined with a second active item to create special wisps · Turns the first Devil Room into an Angel Room · Allows Angel Rooms to spawn after taking a Devil deal",
      kind: 'passive',
      quality: 2,
      pools: ["angel","library","greed-angel"],
      tags: ["offensive","angel","devil","familiar"],
      dlc: "antibirth",
      transform: "bookworm",
      hooks: referenceHooks("+12.5% Angel Room chance while held · Spawns an orbital wisp familiar that shoots spectral tears but can be destroyed · Can be combined with a second active item to create special wisps · Turns the first Devil Room into an Angel Room · Allows Angel Rooms to spawn after taking a Devil deal", false, "book-of-virtues")
    },

    {
      id: "alabaster-box",
      num: 585,
      name: "Alabaster Box",
      desc: "Must be charged by picking up Soul Hearts, then spawns:",
      info: "Must be charged by picking up Soul Hearts, then spawns: · Three Soul Hearts · Two Angel Room items · Only spawns 2 Soul Hearts and 1 Angel item if a Devil deal was taken previously",
      kind: 'active',
      quality: 2,
      pools: ["shop","greed-shop"],
      tags: ["hearts","angel","devil"],
      dlc: "antibirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Must be charged by picking up Soul Hearts, then spawns: · Three Soul Hearts · Two Angel Room items · Only spawns 2 Soul Hearts and 1 Angel item if a Devil deal was taken previously", true, "alabaster-box")
    },

    {
      id: "the-stairway",
      num: 586,
      name: "The Stairway",
      desc: "Spawns a ladder in the first room of every floor that leads to a unique Angel Room shop with items and pickups",
      info: "Spawns a ladder in the first room of every floor that leads to a unique Angel Room shop with items and pickups",
      kind: 'passive',
      quality: 2,
      pools: ["angel","greed-angel"],
      tags: ["angel"],
      dlc: "antibirth",
      hooks: referenceHooks("Spawns a ladder in the first room of every floor that leads to a unique Angel Room shop with items and pickups", false, "the-stairway")
    },

    {
      id: "item-587",
      num: 587,
      name: "Item 587",
      desc: "\u003cItem does not exist>",
      info: "\u003cItem does not exist>",
      kind: 'passive',
      quality: 2,
      pools: [],
      tags: [],
      dlc: "repentance",
      hooks: referenceHooks("\u003cItem does not exist>", false, "item-587")
    },

    {
      id: "sol",
      num: 588,
      name: "Sol",
      desc: "Reveals the location of the Boss Room",
      info: "Reveals the location of the Boss Room · When the floor boss is defeated, receive for the floor: · ↑ +3 Damage · ↑ +1 Luck · The Sun effect · Fully recharges the active item · Removes any curses",
      kind: 'passive',
      quality: 2,
      pools: ["planetarium"],
      tags: ["damage"],
      dlc: "antibirth",
      hooks: referenceHooks("Reveals the location of the Boss Room · When the floor boss is defeated, receive for the floor: · ↑ +3 Damage · ↑ +1 Luck · The Sun effect · Fully recharges the active item · Removes any curses", false, "sol")
    },

    {
      id: "luna",
      num: 589,
      name: "Luna",
      desc: "Adds an extra Secret Room and Super Secret Room to each floor",
      info: "Adds an extra Secret Room and Super Secret Room to each floor · Reveals one Secret Room each floor · Secret Rooms contain a beam of light that grant for the floor: · ↑ +0.5 Fire rate · ↑ Additional +0.5 Fire rate from the first beam per floor · Half a Soul Heart",
      kind: 'passive',
      quality: 2,
      pools: ["planetarium"],
      tags: ["hearts"],
      dlc: "antibirth",
      hooks: referenceHooks("Adds an extra Secret Room and Super Secret Room to each floor · Reveals one Secret Room each floor · Secret Rooms contain a beam of light that grant for the floor: · ↑ +0.5 Fire rate · ↑ Additional +0.5 Fire rate from the first beam per floor · Half a Soul Heart", false, "luna")
    },

    {
      id: "mercurius",
      num: 590,
      name: "Mercurius",
      desc: "↑ +0.4 Speed",
      info: "↑ +0.4 Speed · Most doors stay permanently open",
      kind: 'passive',
      quality: 2,
      pools: ["planetarium"],
      tags: [],
      dlc: "antibirth",
      stats: {"speed":0.4},
      hooks: referenceHooks("↑ +0.4 Speed · Most doors stay permanently open", false, "mercurius")
    },

    {
      id: "venus",
      num: 591,
      name: "Venus",
      desc: "↑ +1 Health",
      info: "↑ +1 Health · Heals 1 heart · Charms nearby enemies",
      kind: 'passive',
      quality: 2,
      pools: ["planetarium"],
      tags: ["hearts"],
      dlc: "antibirth",
      grant: {"maxHearts":2},
      hooks: referenceHooks("↑ +1 Health · Heals 1 heart · Charms nearby enemies", false, "venus")
    },

    {
      id: "terra",
      num: 592,
      name: "Terra",
      desc: "↑ +1 Damage",
      info: "↑ +1 Damage · Replaces Isaac's tears with rocks · Rocks deal variable damage, can destroy obstacles and have increased knockback",
      kind: 'passive',
      quality: 2,
      pools: ["planetarium"],
      tags: ["damage","offensive"],
      dlc: "antibirth",
      stats: {"damage":1},
      hooks: referenceHooks("↑ +1 Damage · Replaces Isaac's tears with rocks · Rocks deal variable damage, can destroy obstacles and have increased knockback", false, "terra")
    },

    {
      id: "mars",
      num: 593,
      name: "Mars",
      desc: "Double-tapping a movement key makes Isaac dash",
      info: "Double-tapping a movement key makes Isaac dash · During a dash, Isaac is invincible and deals 4x his damage +8 · 3 seconds cooldown",
      kind: 'passive',
      quality: 2,
      pools: ["planetarium"],
      tags: ["damage","keys"],
      dlc: "antibirth",
      hooks: referenceHooks("Double-tapping a movement key makes Isaac dash · During a dash, Isaac is invincible and deals 4x his damage +8 · 3 seconds cooldown", false, "mars")
    },

    {
      id: "jupiter",
      num: 594,
      name: "Jupiter",
      desc: "↑ +2 Empty heart containers",
      info: "↑ +2 Empty heart containers · ↓ -0.3 Speed · Heals half a heart · Speed builds up to +0.5 while standing still · Moving releases poison clouds · Poison immunity",
      kind: 'passive',
      quality: 2,
      pools: ["planetarium"],
      tags: ["hearts"],
      dlc: "repentance",
      stats: {"speed":0.2},
      hooks: referenceHooks("↑ +2 Empty heart containers · ↓ -0.3 Speed · Heals half a heart · Speed builds up to +0.5 while standing still · Moving releases poison clouds · Poison immunity", false, "jupiter")
    },

    {
      id: "saturnus",
      num: 595,
      name: "Saturnus",
      desc: "Entering a room causes 7 tears to orbit Isaac",
      info: "Entering a room causes 7 tears to orbit Isaac · Those tears last for 13 seconds and deal 1.5x Isaac's damage +5 · Enemy projectiles have a chance to orbit Isaac",
      kind: 'passive',
      quality: 2,
      pools: ["planetarium"],
      tags: ["damage","offensive"],
      dlc: "antibirth",
      hooks: referenceHooks("Entering a room causes 7 tears to orbit Isaac · Those tears last for 13 seconds and deal 1.5x Isaac's damage +5 · Enemy projectiles have a chance to orbit Isaac", false, "saturnus")
    },

    {
      id: "uranus",
      num: 596,
      name: "Uranus",
      desc: "Isaac shoots petrifying tears that freeze enemies on death",
      info: "Isaac shoots petrifying tears that freeze enemies on death · Touching a frozen enemy makes it slide away and explode into 10 ice shards",
      kind: 'passive',
      quality: 2,
      pools: ["planetarium"],
      tags: ["offensive"],
      dlc: "antibirth",
      hooks: referenceHooks("Isaac shoots petrifying tears that freeze enemies on death · Touching a frozen enemy makes it slide away and explode into 10 ice shards", false, "uranus")
    },

    {
      id: "neptunus",
      num: 597,
      name: "Neptunus",
      desc: "Not shooting builds up a tear bonus over 3 seconds",
      info: "Not shooting builds up a tear bonus over 3 seconds · The tear bonus decreases as Isaac shoots",
      kind: 'passive',
      quality: 2,
      pools: ["planetarium"],
      tags: ["offensive"],
      dlc: "repentance",
      hooks: referenceHooks("Not shooting builds up a tear bonus over 3 seconds · The tear bonus decreases as Isaac shoots", false, "neptunus")
    },

    {
      id: "pluto",
      num: 598,
      name: "Pluto",
      desc: "↑ +0.7 Tears",
      info: "↑ +0.7 Tears · Significantly shrinks Isaac, allowing him to squeeze between objects · Projectiles can pass over him",
      kind: 'passive',
      quality: 2,
      pools: ["planetarium"],
      tags: ["offensive"],
      dlc: "antibirth",
      stats: {"tears":0.72},
      hooks: referenceHooks("↑ +0.7 Tears · Significantly shrinks Isaac, allowing him to squeeze between objects · Projectiles can pass over him", false, "pluto")
    },

    {
      id: "voodoo-head",
      num: 599,
      name: "Voodoo Head",
      desc: "Spawns an additional Curse Room each floor",
      info: "Spawns an additional Curse Room each floor · Improves Curse Room layouts and rewards · Spawns a coin in every Curse Room",
      kind: 'passive',
      quality: 2,
      pools: ["shop","crane-game"],
      tags: ["coins"],
      dlc: "antibirth",
      hooks: referenceHooks("Spawns an additional Curse Room each floor · Improves Curse Room layouts and rewards · Spawns a coin in every Curse Room", false, "voodoo-head")
    },

    {
      id: "eye-drops",
      num: 600,
      name: "Eye Drops",
      desc: "↑ x1.4 Fire rate multiplier for the left eye",
      info: "↑ x1.4 Fire rate multiplier for the left eye",
      kind: 'passive',
      quality: 2,
      pools: ["boss","greed-boss"],
      tags: [],
      dlc: "antibirth",
      hooks: referenceHooks("↑ x1.4 Fire rate multiplier for the left eye", false, "eye-drops")
    },

    {
      id: "act-of-contrition",
      num: 601,
      name: "Act of Contrition",
      desc: "↑ +0.7 Tears",
      info: "↑ +0.7 Tears · +1 Eternal Heart · Allows Angel Rooms to spawn even after taking a devil deal · Taking Red Heart damage doesn't reduce Devil/Angel Room chance as much",
      kind: 'passive',
      quality: 2,
      pools: ["angel","greed-angel"],
      tags: ["damage","offensive","hearts","angel","devil"],
      dlc: "antibirth",
      stats: {"tears":0.72},
      hooks: referenceHooks("↑ +0.7 Tears · +1 Eternal Heart · Allows Angel Rooms to spawn even after taking a devil deal · Taking Red Heart damage doesn't reduce Devil/Angel Room chance as much", false, "act-of-contrition")
    },

    {
      id: "member-card",
      num: 602,
      name: "Member Card",
      desc: "Opens a trapdoor in every Shop",
      info: "Opens a trapdoor in every Shop · The trapdoor leads to an underground shop that sells trinkets, runes, cards, special hearts and items from any pool",
      kind: 'passive',
      quality: 2,
      pools: ["shop"],
      tags: ["hearts"],
      dlc: "antibirth",
      hooks: referenceHooks("Opens a trapdoor in every Shop · The trapdoor leads to an underground shop that sells trinkets, runes, cards, special hearts and items from any pool", false, "member-card")
    },

    {
      id: "battery-pack",
      num: 603,
      name: "Battery Pack",
      desc: "Spawns 2-4 batteries",
      info: "Spawns 2-4 batteries · Fully recharges the active item",
      kind: 'passive',
      quality: 2,
      pools: ["shop","battery-bum","greed-shop"],
      tags: [],
      dlc: "antibirth",
      hooks: referenceHooks("Spawns 2-4 batteries · Fully recharges the active item", false, "battery-pack")
    },

    {
      id: "moms-bracelet",
      num: 604,
      name: "Mom's Bracelet",
      desc: "Allows Isaac to pick up and throw rocks, TNT, poops, friendly Dips, Hosts and other obstacles",
      info: "Allows Isaac to pick up and throw rocks, TNT, poops, friendly Dips, Hosts and other obstacles · Allows carrying them between rooms",
      kind: 'active',
      quality: 2,
      pools: ["shop","greed-shop","crane-game","old-chest"],
      tags: [],
      dlc: "antibirth",
      charge: 6,
      chargeType: 'normal',
      transform: "mom",
      hooks: referenceHooks("Allows Isaac to pick up and throw rocks, TNT, poops, friendly Dips, Hosts and other obstacles · Allows carrying them between rooms", true, "moms-bracelet")
    },

    {
      id: "the-scooper",
      num: 605,
      name: "The Scooper",
      desc: "↑ x1.35 Damage multiplier for the right eye",
      info: "↑ x1.35 Damage multiplier for the right eye · Summons a Peeper familiar for the room, which leaves a trail of red creep and deals 36 contact damage per second",
      kind: 'active',
      quality: 2,
      pools: ["treasure","greed-treasure"],
      tags: ["damage","familiar"],
      dlc: "antibirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("↑ x1.35 Damage multiplier for the right eye · Summons a Peeper familiar for the room, which leaves a trail of red creep and deals 36 contact damage per second", true, "the-scooper")
    },

    {
      id: "ocular-rift",
      num: 606,
      name: "Ocular Rift",
      desc: "5% chance to shoot tears that create rifts where they land",
      info: "5% chance to shoot tears that create rifts where they land · 20% chance at 15 luck · Rifts do 3x Isaac's damage per second and pull in nearby enemies, pickups, and projectiles",
      kind: 'passive',
      quality: 2,
      pools: ["devil","greed-devil","ultra-secret"],
      tags: ["damage","offensive"],
      dlc: "antibirth",
      hooks: referenceHooks("5% chance to shoot tears that create rifts where they land · 20% chance at 15 luck · Rifts do 3x Isaac's damage per second and pull in nearby enemies, pickups, and projectiles", false, "ocular-rift")
    },

    {
      id: "boiled-baby",
      num: 607,
      name: "Boiled Baby",
      desc: "Shoots chaotic bursts of tears in all directions",
      info: "Shoots chaotic bursts of tears in all directions · Deals 3.5 or 5.25 damage per tear",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure","ultra-secret","baby-shop"],
      tags: ["damage","offensive"],
      dlc: "antibirth",
      transform: "conjoined",
      hooks: referenceHooks("Shoots chaotic bursts of tears in all directions · Deals 3.5 or 5.25 damage per tear", false, "boiled-baby")
    },

    {
      id: "freezer-baby",
      num: 608,
      name: "Freezer Baby",
      desc: "Shoots petrifying tears that deal 3.5 damage",
      info: "Shoots petrifying tears that deal 3.5 damage · Freezes enemies upon killing them",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure","baby-shop"],
      tags: ["damage","offensive"],
      dlc: "antibirth",
      transform: "conjoined",
      hooks: referenceHooks("Shoots petrifying tears that deal 3.5 damage · Freezes enemies upon killing them", false, "freezer-baby")
    },

    {
      id: "eternal-d6",
      num: 609,
      name: "Eternal D6",
      desc: "Rerolls all pedestal items in the room",
      info: "Rerolls all pedestal items in the room · Has a 25% chance to delete items instead of rerolling them",
      kind: 'active',
      quality: 2,
      pools: ["treasure","secret","greed-treasure","greed-secret","crane-game"],
      tags: [],
      dlc: "antibirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Rerolls all pedestal items in the room · Has a 25% chance to delete items instead of rerolling them", true, "eternal-d6")
    },

    {
      id: "bird-cage",
      num: 610,
      name: "Bird Cage",
      desc: "Leaps on the enemy that deals the first damage to Isaac in a room",
      info: "Leaps on the enemy that deals the first damage to Isaac in a room · Deals 45 damage and releases a rock wave · Chases enemies afterwards for 6.5 contact damage per second",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure","baby-shop"],
      tags: ["damage"],
      dlc: "antibirth",
      hooks: referenceHooks("Leaps on the enemy that deals the first damage to Isaac in a room · Deals 45 damage and releases a rock wave · Chases enemies afterwards for 6.5 contact damage per second", false, "bird-cage")
    },

    {
      id: "larynx",
      num: 611,
      name: "Larynx",
      desc: "Isaac screams, damages and knocks back nearby enemies",
      info: "Isaac screams, damages and knocks back nearby enemies · The scream gets stronger the more charges the item has",
      kind: 'active',
      quality: 2,
      pools: ["treasure","greed-treasure"],
      tags: ["damage"],
      dlc: "repentance",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Isaac screams, damages and knocks back nearby enemies · The scream gets stronger the more charges the item has", true, "larynx")
    },

    {
      id: "lost-soul",
      num: 612,
      name: "Lost Soul",
      desc: "Dies in one hit and respawns at the start of the next floor",
      info: "Dies in one hit and respawns at the start of the next floor · If it is brought alive to the next floor, it can spawn: · 3 Soul Hearts · 2 Eternal Hearts · A Treasure Room item · An Angel Room item",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","secret","greed-treasure","greed-secret","baby-shop"],
      tags: ["hearts","angel"],
      dlc: "antibirth",
      hooks: referenceHooks("Dies in one hit and respawns at the start of the next floor · If it is brought alive to the next floor, it can spawn: · 3 Soul Hearts · 2 Eternal Hearts · A Treasure Room item · An Angel Room item", false, "lost-soul")
    },

    {
      id: "item-613",
      num: 613,
      name: "Item 613",
      desc: "\u003cItem does not exist>",
      info: "\u003cItem does not exist>",
      kind: 'passive',
      quality: 2,
      pools: [],
      tags: [],
      dlc: "repentance",
      hooks: referenceHooks("\u003cItem does not exist>", false, "item-613")
    },

    {
      id: "blood-bombs",
      num: 614,
      name: "Blood Bombs",
      desc: "↑ +1 Health",
      info: "↑ +1 Health · Heals 4 hearts · If Isaac has no bombs, one can be placed at the cost of half a heart · Isaac's bombs leave red creep",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure","ultra-secret","bomb-bum"],
      tags: ["hearts","bombs"],
      dlc: "antibirth",
      grant: {"maxHearts":2},
      hooks: referenceHooks("↑ +1 Health · Heals 4 hearts · If Isaac has no bombs, one can be placed at the cost of half a heart · Isaac's bombs leave red creep", false, "blood-bombs")
    },

    {
      id: "lil-dumpy",
      num: 615,
      name: "Lil Dumpy",
      desc: "Deflects an enemy or projectile right before Isaac would take damage from it",
      info: "Deflects an enemy or projectile right before Isaac would take damage from it · Needs to be touched after deflecting to be reactivated",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure","baby-shop"],
      tags: ["damage"],
      dlc: "antibirth",
      hooks: referenceHooks("Deflects an enemy or projectile right before Isaac would take damage from it · Needs to be touched after deflecting to be reactivated", false, "lil-dumpy")
    },

    {
      id: "birds-eye",
      num: 616,
      name: "Bird's Eye",
      desc: "8% chance to shoot a red fire that blocks enemy shots and deals contact damage",
      info: "8% chance to shoot a red fire that blocks enemy shots and deals contact damage · 50% chance at 10 luck · Fires disappear after blocking 4 shots, dealing damage 4 times or after 10 seconds",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure","ultra-secret"],
      tags: ["damage"],
      dlc: "antibirth",
      hooks: referenceHooks("8% chance to shoot a red fire that blocks enemy shots and deals contact damage · 50% chance at 10 luck · Fires disappear after blocking 4 shots, dealing damage 4 times or after 10 seconds", false, "birds-eye")
    },

    {
      id: "lodestone",
      num: 617,
      name: "Lodestone",
      desc: "17% chance to shoot magnetizing tears",
      info: "17% chance to shoot magnetizing tears · 100% chance at 5 luck · Magnetized enemies attract nearby pickups, projectiles and enemies",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure","crane-game"],
      tags: ["offensive"],
      dlc: "antibirth",
      hooks: referenceHooks("17% chance to shoot magnetizing tears · 100% chance at 5 luck · Magnetized enemies attract nearby pickups, projectiles and enemies", false, "lodestone")
    },

    {
      id: "rotten-tomato",
      num: 618,
      name: "Rotten Tomato",
      desc: "17% chance to shoot tears that mark enemies",
      info: "17% chance to shoot tears that mark enemies · 100% chance at 5 luck · Marked enemies are targeted by other enemies",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure","ultra-secret","rotten-beggar"],
      tags: ["offensive"],
      dlc: "antibirth",
      hooks: referenceHooks("17% chance to shoot tears that mark enemies · 100% chance at 5 luck · Marked enemies are targeted by other enemies", false, "rotten-tomato")
    },

    {
      id: "birthright",
      num: 619,
      name: "Birthright",
      desc: "Has a different effect for each character",
      info: "Has a different effect for each character",
      kind: 'passive',
      quality: 2,
      pools: ["shop","greed-shop"],
      tags: [],
      dlc: "antibirth",
      hooks: referenceHooks("Has a different effect for each character", false, "birthright")
    },

    {
      id: "item-620",
      num: 620,
      name: "Item 620",
      desc: "\u003cItem does not exist>",
      info: "\u003cItem does not exist>",
      kind: 'passive',
      quality: 2,
      pools: [],
      tags: [],
      dlc: "repentance",
      hooks: referenceHooks("\u003cItem does not exist>", false, "item-620")
    },

    {
      id: "red-stew",
      num: 621,
      name: "Red Stew",
      desc: "↑ +21.6 Damage",
      info: "↑ +21.6 Damage · Full health · The damage up wears off over 3 minutes · Killing enemies while the effect is active extends it",
      kind: 'passive',
      quality: 2,
      pools: ["shop","greed-shop","ultra-secret"],
      tags: ["damage"],
      dlc: "antibirth",
      hooks: referenceHooks("↑ +21.6 Damage · Full health · The damage up wears off over 3 minutes · Killing enemies while the effect is active extends it", false, "red-stew")
    },

    {
      id: "genesis",
      num: 622,
      name: "Genesis",
      desc: "Removes all of Isaac's items and pickups",
      info: "Removes all of Isaac's items and pickups · Teleports Isaac to a bedroom with pickups and chests · For every item removed, Isaac can choose between 3 items from the same pool · Leaving the bedroom takes Isaac to the next floor",
      kind: 'active',
      quality: 2,
      pools: ["angel","greed-angel"],
      tags: [],
      dlc: "repentance",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Removes all of Isaac's items and pickups · Teleports Isaac to a bedroom with pickups and chests · For every item removed, Isaac can choose between 3 items from the same pool · Leaving the bedroom takes Isaac to the next floor", true, "genesis")
    },

    {
      id: "sharp-key",
      num: 623,
      name: "Sharp Key",
      desc: "+5 Keys",
      info: "+5 Keys · Throws one of Isaac's keys in the direction he shoots · Thrown keys deal damage, destroy obstacles, and open doors · Enemies killed with keys can spawn the contents of a chest, including items",
      kind: 'active',
      quality: 2,
      pools: ["shop","greed-shop"],
      tags: ["damage","keys"],
      dlc: "antibirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("+5 Keys · Throws one of Isaac's keys in the direction he shoots · Thrown keys deal damage, destroy obstacles, and open doors · Enemies killed with keys can spawn the contents of a chest, including items", true, "sharp-key")
    },

    {
      id: "booster-pack",
      num: 624,
      name: "Booster Pack",
      desc: "Spawns 5 random cards",
      info: "Spawns 5 random cards",
      kind: 'passive',
      quality: 2,
      pools: ["shop","boss","greed-boss","greed-shop","crane-game"],
      tags: [],
      dlc: "antibirth",
      hooks: referenceHooks("Spawns 5 random cards", false, "booster-pack")
    },

    {
      id: "mega-mush",
      num: 625,
      name: "Mega Mush",
      desc: "Gigantifies Isaac and grants:",
      info: "Gigantifies Isaac and grants: · ↑ x4 Damage multiplier · ↑ +2 Range · ↓ -1.9 Tears · Invincibility · Ability to crush enemies and obstacles · Lasts for 30 seconds and persists between rooms and floors",
      kind: 'active',
      quality: 2,
      pools: ["treasure","secret","greed-treasure","greed-secret"],
      tags: ["damage","offensive"],
      dlc: "antibirth",
      charge: 6,
      chargeType: 'normal',
      transform: "fun-guy",
      hooks: referenceHooks("Gigantifies Isaac and grants: · ↑ x4 Damage multiplier · ↑ +2 Range · ↓ -1.9 Tears · Invincibility · Ability to crush enemies and obstacles · Lasts for 30 seconds and persists between rooms and floors", true, "mega-mush")
    },

    {
      id: "knife-piece-1",
      num: 626,
      name: "Knife Piece 1",
      desc: "Turns into a throwable knife that deals 25 damage when combined with Knife Piece 2",
      info: "Turns into a throwable knife that deals 25 damage when combined with Knife Piece 2 · The knife can open a door made of flesh",
      kind: 'passive',
      quality: 2,
      pools: [],
      tags: ["damage"],
      dlc: "antibirth",
      hooks: referenceHooks("Turns into a throwable knife that deals 25 damage when combined with Knife Piece 2 · The knife can open a door made of flesh", false, "knife-piece-1")
    },

    {
      id: "knife-piece-2",
      num: 627,
      name: "Knife Piece 2",
      desc: "Turns into a throwable knife that deals 25 damage when combined with Knife Piece 1",
      info: "Turns into a throwable knife that deals 25 damage when combined with Knife Piece 1 · The knife can open a door made of flesh",
      kind: 'passive',
      quality: 2,
      pools: [],
      tags: ["damage"],
      dlc: "antibirth",
      hooks: referenceHooks("Turns into a throwable knife that deals 25 damage when combined with Knife Piece 1 · The knife can open a door made of flesh", false, "knife-piece-2")
    },

    {
      id: "death-certificate",
      num: 628,
      name: "Death Certificate",
      desc: "Teleports Isaac to a floor that contains every item in the game",
      info: "Teleports Isaac to a floor that contains every item in the game · Choosing an item from this floor teleports Isaac back to the room he came from",
      kind: 'active',
      quality: 2,
      pools: ["secret","greed-secret"],
      tags: [],
      dlc: "repentance",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Teleports Isaac to a floor that contains every item in the game · Choosing an item from this floor teleports Isaac back to the room he came from", true, "death-certificate")
    },

    {
      id: "bot-fly",
      num: 629,
      name: "Bot Fly",
      desc: "Shoots shielded tears to destroy enemy projectiles",
      info: "Shoots shielded tears to destroy enemy projectiles · Deals 3 contact damage per second",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","key-master","greed-treasure","crane-game","baby-shop"],
      tags: ["damage","offensive"],
      dlc: "antibirth",
      hooks: referenceHooks("Shoots shielded tears to destroy enemy projectiles · Deals 3 contact damage per second", false, "bot-fly")
    },

    {
      id: "item-630",
      num: 630,
      name: "Item 630",
      desc: "\u003cItem does not exist>",
      info: "\u003cItem does not exist>",
      kind: 'passive',
      quality: 2,
      pools: [],
      tags: [],
      dlc: "repentance",
      hooks: referenceHooks("\u003cItem does not exist>", false, "item-630")
    },

    {
      id: "meat-cleaver",
      num: 631,
      name: "Meat Cleaver",
      desc: "Splits all enemies in the room into 2 smaller versions with 40% health",
      info: "Splits all enemies in the room into 2 smaller versions with 40% health · Enemies that naturally split (like Envy) take enough damage to split instead · Deals 25 damage to enemies that can't be split",
      kind: 'active',
      quality: 2,
      pools: ["treasure","greed-treasure"],
      tags: ["damage"],
      dlc: "antibirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Splits all enemies in the room into 2 smaller versions with 40% health · Enemies that naturally split (like Envy) take enough damage to split instead · Deals 25 damage to enemies that can't be split", true, "meat-cleaver")
    },

    {
      id: "evil-charm",
      num: 632,
      name: "Evil Charm",
      desc: "↑ +2 Luck",
      info: "↑ +2 Luck · Immune to burn, confusion, fear, and poison effects",
      kind: 'passive',
      quality: 2,
      pools: ["secret","greed-secret"],
      tags: [],
      dlc: "antibirth",
      stats: {"luck":2},
      hooks: referenceHooks("↑ +2 Luck · Immune to burn, confusion, fear, and poison effects", false, "evil-charm")
    },

    {
      id: "dogma",
      num: 633,
      name: "Dogma",
      desc: "↑ +0.1 Speed",
      info: "↑ +0.1 Speed · ↑ +2 Damage · Flight and one-time Holy Mantle shield · Heals Isaac with Red and Soul Hearts if he has less than 6 hearts",
      kind: 'passive',
      quality: 2,
      pools: [],
      tags: ["damage","hearts"],
      dlc: "repentance",
      stats: {"damage":2,"speed":0.1},
      hooks: referenceHooks("↑ +0.1 Speed · ↑ +2 Damage · Flight and one-time Holy Mantle shield · Heals Isaac with Red and Soul Hearts if he has less than 6 hearts", false, "dogma")
    },

    {
      id: "purgatory",
      num: 634,
      name: "Purgatory",
      desc: "Red cracks spawn on the ground in hostile rooms",
      info: "Red cracks spawn on the ground in hostile rooms · Walking over the cracks summons homing exploding ghosts",
      kind: 'passive',
      quality: 2,
      pools: ["devil","angel","greed-devil","greed-angel"],
      tags: [],
      dlc: "repentance",
      hooks: referenceHooks("Red cracks spawn on the ground in hostile rooms · Walking over the cracks summons homing exploding ghosts", false, "purgatory")
    },

    {
      id: "stitches",
      num: 635,
      name: "Stitches",
      desc: "Spawns a familiar that moves in the direction Isaac shoots",
      info: "Spawns a familiar that moves in the direction Isaac shoots · On use, Isaac swaps places with the familiar and becomes briefly invincible · Teleporting onto things can damage or destroy them",
      kind: 'active',
      quality: 2,
      pools: ["treasure","greed-treasure","baby-shop"],
      tags: ["damage","fly","familiar"],
      dlc: "antibirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Spawns a familiar that moves in the direction Isaac shoots · On use, Isaac swaps places with the familiar and becomes briefly invincible · Teleporting onto things can damage or destroy them", true, "stitches")
    },

    {
      id: "r-key",
      num: 636,
      name: "R Key",
      desc: "Restarts the entire run",
      info: "Restarts the entire run · All items, trinkets, stats and pickups collected are kept · The timer does not reset",
      kind: 'active',
      quality: 2,
      pools: ["secret","greed-shop","greed-secret"],
      tags: [],
      dlc: "antibirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Restarts the entire run · All items, trinkets, stats and pickups collected are kept · The timer does not reset", true, "r-key")
    },

    {
      id: "knockout-drops",
      num: 637,
      name: "Knockout Drops",
      desc: "10% chance to shoot a fist that inflicts confusion and extreme knockback",
      info: "10% chance to shoot a fist that inflicts confusion and extreme knockback · 100% chance at 9 luck · Enemies take damage when they get knocked into a wall/obstacle",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure","ultra-secret"],
      tags: ["damage"],
      dlc: "antibirth",
      hooks: referenceHooks("10% chance to shoot a fist that inflicts confusion and extreme knockback · 100% chance at 9 luck · Enemies take damage when they get knocked into a wall/obstacle", false, "knockout-drops")
    },

    {
      id: "eraser",
      num: 638,
      name: "Eraser",
      desc: "Throws an eraser that instantly kills an enemy",
      info: "Throws an eraser that instantly kills an enemy · Prevents the erased enemy from spawning for the rest of the run · Deals 15 damage to bosses · Can only be used once per floor",
      kind: 'active',
      quality: 2,
      pools: ["shop","greed-shop","crane-game"],
      tags: ["damage"],
      dlc: "antibirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Throws an eraser that instantly kills an enemy · Prevents the erased enemy from spawning for the rest of the run · Deals 15 damage to bosses · Can only be used once per floor", true, "eraser")
    },

    {
      id: "yuck-heart",
      num: 639,
      name: "Yuck Heart",
      desc: "+1 Rotten Heart",
      info: "+1 Rotten Heart",
      kind: 'active',
      quality: 2,
      pools: ["treasure","greed-treasure","rotten-beggar"],
      tags: ["hearts"],
      dlc: "antibirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("+1 Rotten Heart", true, "yuck-heart")
    },

    {
      id: "urn-of-souls",
      num: 640,
      name: "Urn of Souls",
      desc: "Spews a stream of flames",
      info: "Spews a stream of flames · Killing an enemy adds a charge to the urn",
      kind: 'active',
      quality: 2,
      pools: ["angel","greed-angel"],
      tags: [],
      dlc: "repentance",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Spews a stream of flames · Killing an enemy adds a charge to the urn", true, "urn-of-souls")
    },

    {
      id: "akeldama",
      num: 641,
      name: "Akeldama",
      desc: "Creates a chain of tears behind Isaac in hostile rooms",
      info: "Creates a chain of tears behind Isaac in hostile rooms · The tears deal 3.5 damage",
      kind: 'passive',
      quality: 2,
      pools: ["treasure","greed-treasure"],
      tags: ["damage","offensive"],
      dlc: "antibirth",
      hooks: referenceHooks("Creates a chain of tears behind Isaac in hostile rooms · The tears deal 3.5 damage", false, "akeldama")
    },

    {
      id: "magic-skin",
      num: 642,
      name: "Magic Skin",
      desc: "Spawns an item from the current room's item pool",
      info: "Spawns an item from the current room's item pool · Turns 1 heart container or 1 Bone Heart or 2 Soul Hearts into a Broken Heart · Replaces future items if Isaac isn't holding it (33% after 1 use, 50% after 2, 100% after 3) · Lower chance if Magic Skin is on a pedestal on the current floor",
      kind: 'active',
      quality: 2,
      pools: ["shop","red-chest","curse","greed-curse"],
      tags: ["hearts"],
      dlc: "antibirth",
      charge: 6,
      chargeType: 'normal',
      hooks: referenceHooks("Spawns an item from the current room's item pool · Turns 1 heart container or 1 Bone Heart or 2 Soul Hearts into a Broken Heart · Replaces future items if Isaac isn't holding it (33% after 1 use, 50% after 2, 100% after 3) · Lower chance if Magic Skin is on a pedestal on the current floor", true, "magic-skin")
    },

    {
      id: "revelation",
      num: 643,
      name: "Revelation",
      desc: "+2 Soul Hearts",
      info: "+2 Soul Hearts · Flight · Chargeable high damage holy beam · Does not replace Isaac's tears",
      kind: 'passive',
      quality: 2,
      pools: ["angel","greed-angel"],
      tags: ["damage","offensive","hearts"],
      dlc: "antibirth",
      grant: {"soul":4},
      transform: "seraphim",
      hooks: referenceHooks("+2 Soul Hearts · Flight · Chargeable high damage holy beam · Does not replace Isaac's tears", false, "revelation")
    },

    {
      id: "consolation-prize",
      num: 644,
      name: "Consolation Prize",
      desc: "↑ Increases Isaac's lowest stat out of Speed, Fire rate, Damage, and Range",
      info: "↑ Increases Isaac's lowest stat out of Speed, Fire rate, Damage, and Range · Spawns either 3 coins, 1 bomb, or 1 key depending on what Isaac has the least of",
      kind: 'passive',
      quality: 2,
      pools: ["boss","golden-chest","greed-boss","crane-game"],
      tags: ["damage","bombs","coins","keys"],
      dlc: "antibirth",
      hooks: referenceHooks("↑ Increases Isaac's lowest stat out of Speed, Fire rate, Damage, and Range · Spawns either 3 coins, 1 bomb, or 1 key depending on what Isaac has the least of", false, "consolation-prize")
    }

  ])

  IS.defineFamiliars([
    { id: 'blood-puppy', name: 'Blood Puppy', sprite: 'blood-puppy', behaviour: 'chaser', params: { r: 18, speed: 350, flying: false, dmg: 6, range: 900, cooldown: 0.45, hp: 0, blockShots: false, life: 0 } }
  ])

})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
