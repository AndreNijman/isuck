;(function (IS) {
  'use strict'

  // ---------------------------------------------------------------------------
  // ISUCK — character mechanics (all 34 characters).
  //
  // Everything here is wired by wrapping engine entry points that are looked up
  // on IS at call time (IS.fireHook, IS.updateWeapon, IS.makePlayer,
  // IS.recalcStats, IS.usePocket, IS.tryTakePickup, IS.giveItem, IS.healRed,
  // IS.useActive, IS.spawnFamiliar). No other engine file needs editing. Load
  // this file AFTER every other engine file (see index.html).
  //
  //   * Per-character hooks use the normal hook names (onUpdate, onPlayerDamage,
  //     onPlayerDeath, onRoomEnter, onRoomClear, onEnemyKill, onPickup,
  //     onNewFloor, onTearFire, onEnemyDamage) and run through IS.fireHook after
  //     the item hooks.
  //   * "Fallbacks" implement a starting item's effect only while that item has no
  //     hooks of its own, so the character is correct before and after the items
  //     worker lands the item (Lazarus' Rags, Holy Mantle, Whore of Babylon, Bloody
  //     Lust).
  //   * Pocket actives (p.pAct) are charged by room clears, kills, damage dealt,
  //     soul/red hearts, and are used with the pocket key.
  //   * Second bodies (The Soul, Dead Lazarus, Esau, the thrown skeleton, Dark
  //     Esau) are familiar-shaped objects in p.familiars, so the renderer draws
  //     them and nothing else has to know about them.
  // ---------------------------------------------------------------------------

  // character-only flags (data in js/data/characters.js; read here)
  ;['twins', 'itemLimit', 'melee', 'tempHearts', 'bagOfCrafting', 'poopTears', 'flipForms', 'rerollOnHit', 'holyCards', 'cantShoot', 'quadShot', 'skeletonThrow', 'esauGhost', 'oneEye', 'boneHearts', 'keeperHearts', 'tripleShot', 'bookOfVirtues', 'noRedHearts', 'freeDevilDeals'].forEach(function (f) { if (IS.PLAYER_FLAG_LIST.indexOf(f) < 0) IS.PLAYER_FLAG_LIST.push(f) })

  var HK = {}      // charId -> hookName -> [fn]
  var WEAPON = {}  // charId -> fn(p, d, dt, ctx, held) -> true when it replaced the weapon
  var PICK = {}    // charId -> fn(p, pickup, ctx, orig) -> true/false, or undefined to fall through
  var INIT = {}    // charId -> fn(p, run, def)
  var POST = {}    // charId -> fn(p, s) after IS.recalcStats
  var SWAP = {}    // charId -> fn(p, ctx) on the swap key
  var USE = {}     // pocket active id -> fn(p, ctx) (return false to refuse)
  var FALLBACK = {} // item id -> hookName -> fn

  // ---- small helpers --------------------------------------------------------
  function roomOf (ctx) { return ctx && (ctx.room || (ctx.run && ctx.run.room)) }
  function foes (ctx) { var r = roomOf(ctx); return r && IS.roomEnemies ? IS.roomEnemies(r) : [] }
  function nowOf (ctx) { return (ctx && ctx.run && ctx.run.time) || 0 }
  function sfx (ctx, n) { if (ctx && ctx.sfx) ctx.sfx(n) }
  function aim (p) { var h = p.head || { x: 1, y: 0 }, l = Math.hypot(h.x, h.y) || 1; return { x: h.x / l, y: h.y / l } }
  function banner (ctx, a, b) { if (ctx && ctx.banner) ctx.banner(a, b || '') }
  function fxRing (ctx, x, y, r1, colour) { if (ctx && ctx.spawnEffect) ctx.spawnEffect('ring', x, y, { colour: colour || '#e8e2d0', r0: 12, r1: r1, life: 0.16, width: 6 }) }
  function fxBurst (ctx, x, y, colour, n) { if (ctx && ctx.spawnEffect) ctx.spawnEffect('burst', x, y, { colour: colour || '#e8e2d0', n: n || 8 }) }
  function has (p, id) { return !!(p.itemCounts && p.itemCounts[id] > 0) }
  function itemImplemented (id) { var h = IS.itemsById && IS.itemsById[id] && IS.itemsById[id].hooks; return !!h && Object.keys(h).length > 0 }
  function defOf (p) { return (IS.charactersById && IS.charactersById[p.charId]) || {} }
  function isTainted (p) { return !!defOf(p).tainted }
  function addHook (id, name, fn) { var c = HK[id] || (HK[id] = {}); (c[name] || (c[name] = [])).push(fn) }
  function addHooks (ids, table) { [].concat(ids).forEach(function (id) { for (var n in table) addHook(id, n, table[n]) }) }
  function recalc (p) { return IS.recalcStats(p) }
  function pressed (a) { return !!(IS.input && IS.input.pressed && IS.input.pressed(a)) }

  // Give an item without marking it "seen" in the collection log.
  function grant (p, id, ctx) {
    var s = IS.save, keep = s && s.seeItem, ok = false
    try { if (s) s.seeItem = function () {} } catch (e) { /* frozen save: fall through */ }
    try { ok = IS.giveItem(p, id, { ctx: ctx, noAnim: true }) } finally { try { if (s) s.seeItem = keep } catch (e2) { /* ignore */ } }
    return ok
  }

  // Red health added directly, so it works for Keeper whose cantHeal blocks IS.healRed.
  function addRed (p, n) { var b = p.hearts.red; p.hearts.red = Math.min(p.hearts.maxRed, p.hearts.red + n); return p.hearts.red - b }

  // A melee swing: damages enemies in an arc and erases hostile shots inside it.
  function swing (p, ctx, dir, o) {
    var a0 = Math.atan2(dir.y, dir.x), hits = 0, room = roomOf(ctx)
    foes(ctx).forEach(function (e) {
      if (e.dead || e.hidden || (e.spawnT > 0 && !e.boss)) return
      var dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy)
      if (d > o.reach + e.r) return
      if (o.arc < 6.2 && d > e.r + 24 && Math.abs(IS.angleDiff(a0, Math.atan2(dy, dx))) > o.arc / 2) return
      IS.damageEnemy(e, o.dmg, { src: { vx: dx, vy: dy }, knock: o.knock }, ctx)
      hits++
    })
    if (o.blockShots && room) {
      ;(room.shots || []).forEach(function (s) {
        if (s.dead || s.friendly) return
        var dx = s.x - p.x, dy = s.y - p.y, d = Math.hypot(dx, dy)
        if (d > o.reach + 20) return
        if (o.arc < 6.2 && Math.abs(IS.angleDiff(a0, Math.atan2(dy, dx))) > o.arc / 2) return
        s.dead = true
      })
    }
    var cx = p.x + dir.x * o.reach * 0.55, cy = p.y + dir.y * o.reach * 0.55
    fxRing(ctx, cx, cy, o.reach * 0.7, o.colour)
    sfx(ctx, o.sfx || 'stomp')
    return hits
  }

  // ---- extra bodies -----------------------------------------------------------
  IS.defineFamiliarBehaviour && IS.defineFamiliarBehaviour('charBody', function (f, dt, ctx) {
    var p = ctx && ctx.player
    if (f.follow && p) {
      var d = Math.hypot(p.x - f.x, p.y - f.y)
      if (d > 90) { var n = IS.norm(p.x - f.x, p.y - f.y); f.x += n.x * 230 * dt; f.y += n.y * 230 * dt }
    }
  })
  function mkBody (p, o) {
    var b = Object.assign({ id: 'charbody', def: { id: 'charbody', behaviour: 'charBody', params: {} }, x: p.x + 50, y: p.y, vx: 0, vy: 0, r: 22, t: 0, shotT: 0, angle: 0, sprite: p.charId, isBody: true }, o)
    ;(p.familiars || (p.familiars = [])).push(b)
    return b
  }
  var TINT = { soul: '#8fc8ff', dead: '#8a8aa8', esau: '#ff9a7a', ghost: '#3a2a3a', skeleton: '#e8e2d0' }
  function formTotal (h) { return (h.red || 0) + (h.soul || 0) + (h.black || 0) + (h.bone || 0) }

  // Swap the controlled body with p.alt (The Soul, Dead Lazarus).
  function swapBody (p, ctx) {
    var b = p.alt
    if (!b) return false
    var h = p.hearts; p.hearts = b.hearts; b.hearts = h
    var x = p.x, y = p.y; p.x = b.x; p.y = b.y; b.x = x; b.y = y; b.vx = 0; b.vy = 0; p.vx = 0; p.vy = 0
    var f = p.form; p.form = b.form; b.form = f
    b.tint = f === 'bone' || f === 'lazarus' ? TINT[b.form] : TINT[b.form] || undefined
    b.follow = b.form === 'soul'
    applyForm(p)
    p.invulnUntil = Math.max(p.invulnUntil || 0, nowOf(ctx) + 0.5)
    fxBurst(ctx, p.x, p.y, '#cfe4ff', 10)
    sfx(ctx, 'transform')
    return true
  }
  function applyForm (p) {
    p.charFlags = new Set(); p.charMods = p.charMods || {}; p.charMult = {}
    if (p.charId === 'the-forgotten') {
      if (p.form === 'soul') { p.charFlags.add('flying'); p.charFlags.add('spectralTears'); p.charMult.damage = 1 / 1.5; p.charMult.speed = 1.15 }
    } else if (p.charId === 'tainted-lazarus') {
      if (p.form === 'dead') { p.charMult.damage = 1.35; p.charMult.tears = 0.85 } else { p.charMult.tears = 1.15 }
    }
    if (p.berserkT > 0) { p.charMult.tears = (p.charMult.tears || 1) * 1.6; p.charMult.damage = (p.charMult.damage || 1) * 1.5; p.charMult.speed = (p.charMult.speed || 1) * 1.25 }
    if (p.darkT > 0) p.charMult.speed = (p.charMult.speed || 1) * 1.7
    recalc(p)
  }
  // A dying body hands over to the other one instead of ending the run.
  function bodyDeath (p, ctx) {
    var b = p.alt
    if (b && formTotal(b.hearts) > 0) { swapBody(p, ctx); banner(ctx, p.form === 'soul' ? 'THE SOUL' : p.form === 'dead' ? 'DEAD LAZARUS' : defOf(p).name, 'The other body takes over'); return { revive: true } }
  }

  // ---- stat plumbing ----------------------------------------------------------
  // A hidden pseudo-item feeds character mods in BEFORE the damage/tears formulas.
  var MODS_ID = '__char'
  function ensureMods () { if (IS.itemsById && !Object.prototype.hasOwnProperty.call(IS.itemsById, MODS_ID)) {
    Object.defineProperty(IS.itemsById, MODS_ID, { enumerable: false, configurable: true, value: { id: MODS_ID, kind: 'passive', hooks: { onStats: function (p, s) {
      var m = p.charMods; if (!m) return
      if (m.damage) s.damage += m.damage
      if (m.tears) s.tears += m.tears
      if (m.speed) s.speed += m.speed
      if (m.range) s.range += m.range
      if (m.luck) s.luck += m.luck
    } } } })
  } }
  var origRecalc = IS.recalcStats
  IS.recalcStats = function (p) {
    ensureMods()
    var real = p.items, list = real.slice()
    if (p.hearts && p.itemCounts && p.itemCounts['whore-of-babylon'] && !itemImplemented('whore-of-babylon') && p.hearts.red > 1) list = list.filter(function (x) { return x !== 'whore-of-babylon' })
    list.push(MODS_ID)
    p.items = list
    var s
    try { s = origRecalc(p) } finally { p.items = real }
    var m = p.charMult
    if (m) {
      if (m.damage) s.damage *= m.damage
      if (m.tears) { s.tears = Math.min(IS.TEARS_CAP, s.tears * m.tears); s.fireDelay = 1 / s.tears }
      if (m.speed) s.speed = Math.min(IS.SPEED_CAP || 2, s.speed * m.speed)
    }
    if (p.charFlags) p.charFlags.forEach(function (f) { p.flags.add(f) })
    if (POST[p.charId]) POST[p.charId](p, s)
    if (p.twin && p.twin.statSrc !== s) p.twin.statSrc = null
    return s
  }

  // ---- hook plumbing ----------------------------------------------------------
  var origFire = IS.fireHook
  IS.fireHook = function (p, name, args, ctx) {
    var out = origFire(p, name, args, ctx)
    var callArgs = [p].concat(args || [], ctx), fns = (HK['*'] && HK['*'][name] || []).concat(HK[p.charId] && HK[p.charId][name] || [])
    if (fns) for (var i = 0; i < fns.length; i++) { try { out.push(fns[i].apply(null, callArgs)) } catch (e) { console.warn('char ' + name + ' ' + p.charId, e) } }
    var cnt = p.itemCounts
    if (cnt) for (var id in FALLBACK) {
      if (!(cnt[id] > 0) || itemImplemented(id) || !FALLBACK[id][name]) continue
      try { out.push(FALLBACK[id][name].apply(null, callArgs)) } catch (e2) { console.warn('fallback ' + name + ' ' + id, e2) }
    }
    return out
  }

  var origWeapon = IS.updateWeapon
  IS.updateWeapon = function (p, d, dt, ctx) {
    var w = WEAPON[p.charId]
    if (w && w(p, d, dt, ctx, !!(d.x || d.y)) === true) return
    var before = p.beam
    origWeapon(p, d, dt, ctx)
    // Tainted Azazel's beam is as short as Azazel's (tears.js only shortens his).
    if (p.charId === 'tainted-azazel' && p.beam && p.beam !== before) p.beam.len = Math.min(p.beam.len, p.stats.range * 0.9)
  }

  var origUsePocket = IS.usePocket
  IS.usePocket = function (p, slot, ctx) {
    var a = p.pAct
    if (a && !slot && a.charge >= a.max && USE[a.id]) {
      if (USE[a.id](p, ctx) !== false) { if (a.max > 0) a.charge = 0; return true }
    }
    return origUsePocket(p, slot, ctx)
  }

  var origTake = IS.tryTakePickup
  IS.tryTakePickup = function (p, x, ctx) {
    var f = PICK[p.charId]
    if (f) { var r = f(p, x, ctx, origTake); if (r !== undefined) return r }
    if (p.flags && p.flags.has('freeDevilDeals') && x.priceType === 'heart') x.price = 0
    return origTake(p, x, ctx)
  }

  var origHeal = IS.healRed
  IS.healRed = function (p, n) {
    if (p.charId === 'the-forgotten' || p.charId === 'tainted-the-forgotten') {
      var h = boneHearts(p), b = h.bone
      h.bone = Math.min(h.maxBone || 0, h.bone + n)
      return h.bone - b
    }
    return origHeal(p, n)
  }

  var origGive = IS.giveItem
  IS.giveItem = function (p, id, o) {
    var ok = origGive(p, id, o)
    if (ok && p.itemLimit) enforceLimit(p, o && o.ctx)
    return ok
  }

  var origUseActive = IS.useActive
  IS.useActive = function (p, slot, ctx) {
    var a = p.active && p.active[slot]
    // Bethany pays soul (then black) hearts for the charge an active item is missing.
    if (a && p.charId === 'bethany' && a.charge < a.maxCharge) {
      var need = Math.ceil(a.maxCharge - a.charge), avail = p.hearts.soul + p.hearts.black
      if (avail >= need) {
        var left = need, k
        for (var i = 0; i < 2; i++) { k = i ? 'black' : 'soul'; var t = Math.min(p.hearts[k], left); p.hearts[k] -= t; left -= t }
        a.charge = a.maxCharge
        sfx(ctx, 'heart-pickup')
      }
    }
    return origUseActive(p, slot, ctx)
  }

  var origSpawnFam = IS.spawnFamiliar
  IS.spawnFamiliar = function (p, id, ctx) {
    var f = origSpawnFam(p, id, ctx)
    // The generic follower would fire the Incubus's raw 75 "damage"; give it Isaac's rules.
    if (f && f.def && f.def.id === 'incubus' && f.def.behaviour === 'follower') f.def = Object.assign({}, f.def, { behaviour: 'charIncubus' })
    return f
  }
  IS.defineFamiliarBehaviour && IS.defineFamiliarBehaviour('charIncubus', function (f, dt, ctx) {
    var p = ctx.player
    if (!p) return
    var mine = (p.familiars || []).filter(function (x) { return x.def && x.def.behaviour === 'charIncubus' }), idx = mine.indexOf(f)
    var ox = (idx % 2 ? 1 : -1) * (44 + 16 * ((idx / 2) | 0)), oy = -16
    var k = Math.min(1, dt * 7)
    f.x += (p.x + ox - f.x) * k; f.y += (p.y + oy - f.y) * k
    f.shotT -= dt
    var d = IS.input && IS.input.shoot && IS.input.shoot()
    if (d && (d.x || d.y) && f.shotT <= 0 && !p.dead) {
      f.shotT = p.stats.fireDelay
      var base = IS.tearBaseOpts(p), a = Math.atan2(d.y, d.x), s = IS.TEAR_SPEED * p.stats.shotSpeed
      var t = ctx.spawnTear(Object.assign({}, base, { x: f.x, y: f.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, dmg: base.dmg * 0.75, r: base.r * 0.9 }))
      if (t) IS.applyTearFlags(t, p)
    }
  })

  // ---- makePlayer: stats, flags, starting kit ------------------------------------
  var origMake = IS.makePlayer
  IS.makePlayer = function (id, run) {
    var d = IS.charactersById && IS.charactersById[id]
    var p = origMake(id, run)
    if (!d) return p
    // recalcStats rebuilds p.flags from p.base.flags, so the character's own flags live there
    p.base.flags = (d.flags || []).slice()
    p.charMods = {}; p.charMult = {}; p.charFlags = new Set()
    p.hearts = Object.assign({ maxBone: 0 }, p.hearts)
    p.items = []; p.itemCounts = {}
    p.lust = 0; p.charMantle = false
    // starting kit, through giveItem so actives land in the active slot
    d.items.forEach(function (it) { grant(p, it, null) })
    d.trinkets.forEach(function (t) { IS.giveTrinket(p, t) })
    d.pocket.forEach(function (x) { IS.givePocket(p, x.kind || 'card', x.id || x) })
    if (d.pAct) p.pAct = { id: d.pAct.id, name: d.pAct.name, max: d.pAct.max, charge: 0, gain: d.pAct.gain || {} }
    if (INIT[id]) INIT[id](p, run, d)
    // Starting hearts after INIT so an INIT may adjust them
    recalc(p)
    return p
  }

  // ---- pocket actives: charging --------------------------------------------------
  function gainCharge (p, kind, amount) {
    var a = p.pAct
    if (!a || !a.gain || !a.gain[kind] || !a.max) return
    var before = a.charge
    a.charge = Math.min(a.max, a.charge + a.gain[kind] * (amount == null ? 1 : amount))
    if (a.charge >= a.max && before < a.max) { p.pActReadyFlash = 1 }
  }
  addHooks('*', {})
  var COMMON = {
    onRoomClear: function (p, room, ctx) {
      gainCharge(p, 'room', 1)
      if (p.flags.has('holyCards') && ctx.chance(0.2)) ctx.spawnPickup('card', p.x + 60, p.y, { id: 'holy-card' })
    },
    onEnemyKill: function (p, e, ctx) { gainCharge(p, 'kill', 1) },
    onEnemyDamage: function (p, e, n, ctx) { gainCharge(p, 'damageDealt', Math.min(n, e.hp)) },
    onPickup: function (p, kind, amount, ctx) {
      if (kind === 'soul' || kind === 'black') gainCharge(p, 'souls', amount || 2)
      if (kind === 'heart') gainCharge(p, 'hearts', 1)
    },
    onNewFloor: function (p, floor, ctx) { p.lust = 0; p.charMantle = true; recalc(p) },
    onRoomEnter: function (p, room, ctx) { p.charMantle = true }
  }
  var ALL = '*' // data files load after the engine, so common hooks are keyed '*'
  addHooks('*', COMMON)

  // ---- item fallbacks (only while the item has no hooks of its own) ----------------
  FALLBACK['bloody-lust'] = {
    onPlayerDamage: function (p, n, src, ctx) {
      if (p.lust < 6) { p.lust++; p.charMods.damage = (p.charMods.damage || 0) + 0.5; recalc(p) }
    }
  }
  FALLBACK['lazarus-rags'] = {
    onPlayerDeath: function (p, ctx) {
      IS.removeItem(p, 'lazarus-rags')
      grant(p, 'anemic', ctx)
      p.risen = true
      p.hearts.maxRed = Math.max(p.hearts.maxRed, 2); p.hearts.red = 2
      p.invulnUntil = nowOf(ctx) + 2
      banner(ctx, 'LAZARUS RISEN', 'Anemic')
      sfx(ctx, 'transform')
      return { revive: true }
    }
  }
  FALLBACK['holy-mantle'] = {
    onPlayerDamage: function (p, n, src, ctx) {
      if (p.charMantle) { p.charMantle = false; sfx(ctx, 'holy-shield'); p.invulnUntil = nowOf(ctx) + 0.5; return { cancel: true } }
    }
  }
  // Whore of Babylon is conditional on health: re-evaluate when red health crosses the threshold.
  addHooks('*', {})
  function whoreWatch (p) {
    if (!p.itemCounts['whore-of-babylon'] || itemImplemented('whore-of-babylon')) return
    var low = p.hearts.red <= 1
    if (p.whoreLow !== low) { p.whoreLow = low; recalc(p) }
  }

  // ---- Lilith: cannot shoot; her Incubus does --------------------------------------
  WEAPON.lilith = function (p) { return true }

  // ---- Cain: one eye ----------------------------------------------------------------
  addHook('cain', 'onTearFire', function (p, t) {
    if (p.stats.multishot > 0) return
    var sp = Math.hypot(t.vx, t.vy) || 1, nx = -t.vy / sp, ny = t.vx / sp, off = p.r * 0.35 * p.eye
    t.x -= nx * off; t.y -= ny * off
  })

  // ---- Keeper / Tainted Keeper ---------------------------------------------------
  POST.keeper = function (p, s) { s.multishot = Math.max(s.multishot || 0, 2) }
  POST['tainted-keeper'] = function (p, s) { s.multishot = Math.max(s.multishot || 0, 3) }
  ;['keeper', 'tainted-keeper'].forEach(function (id) {
    PICK[id] = function (p, x, ctx) { if (x.kind === 'heart' || x.kind === 'soul' || x.kind === 'black') return false }
    addHook(id, 'onPickup', function (p, kind, amount) { if (kind === 'coin') addRed(p, amount || 1) })
  })
  addHook('tainted-keeper', 'onEnemyKill', function (p, e, ctx) { if (!e.boss && ctx.chance(0.6)) ctx.spawnPickup('coin', e.x, e.y) })

  // ---- ??? / The Lost: heart restrictions ------------------------------------------
  PICK['blue-baby'] = PICK['tainted-blue-baby'] = function (p, x) { if (x.kind === 'heart') return false }
  PICK['the-lost'] = PICK['tainted-the-lost'] = function (p, x) { if (x.kind === 'heart' || x.kind === 'soul' || x.kind === 'black') return false }
  addHook('tainted-the-lost', 'onPlayerDamage', function () {}) // keeps the no-mantle rule explicit: only the Holy Card shields him

  // ---- Azazel: short brimstone is tears.js (charId === 'azazel'); flight is a base flag -----

  // ---- Eden / Tainted Eden ------------------------------------------------------------
  function edenRoll (p, r) {
    var b = p.base, BT = IS.BASE_TEARS
    b.damage = +(3.5 * r.range(0.8, 1.3)).toFixed(3)
    b.tears = +(BT * r.range(0.8, 1.3)).toFixed(4)
    b.speed = +r.range(0.85, 1.3).toFixed(3)
    b.range = Math.round(80 * r.range(5.2, 8))
    b.shotSpeed = +r.range(0.9, 1.25).toFixed(3)
    b.luck = r.int(4) - 1
  }
  INIT.eden = function (p, run) {
    var seed = run && run.seed
    if (seed == null) return
    var r = new IS.RNG((seed ^ 0x0ede9) >>> 0)
    edenRoll(p, r)
    p.hearts.red = p.hearts.maxRed = 4 + 2 * r.int(2)
    p.hearts.soul = 2 * r.int(2)
    p.edenPending = true
  }
  INIT['tainted-eden'] = function (p, run) {
    var seed = run && run.seed
    if (seed == null) return
    edenRoll(p, new IS.RNG((seed ^ 0x7a1e9) >>> 0))
    p.edenPending = true
  }
  function edenGive (p, ctx) {
    p.edenPending = false
    var want = p.charId === 'eden' ? ['active', 'passive'] : ['passive'], i, id, d
    want.forEach(function (kind) {
      for (i = 0; i < 80; i++) {
        id = ctx.rollItem('treasure'); d = IS.itemsById[id]
        if (d && d.kind === kind && !has(p, id)) { grant(p, id, ctx); return }
      }
    })
    if (p.charId === 'eden') { var c = ctx.rollCard(); if (c) IS.givePocket(p, 'card', c) }
    recalc(p)
  }
  addHook('tainted-eden', 'onPlayerDamage', function (p) { p.edenHit = true })
  function edenReroll (p, ctx) {
    p.edenHit = false
    var r = new IS.RNG((ctx.run.seed ^ ((ctx.run.time * 1000) | 0)) >>> 0)
    ctx.rerollPlayerItems && ctx.rerollPlayerItems()
    edenRoll(p, r)
    recalc(p)
    banner(ctx, 'REROLLED', 'Stats and items changed')
    sfx(ctx, 'reroll' in (IS.SFX_SET || {}) ? 'reroll' : 'card-use')
  }

  // ---- Magdalene (tainted) ---------------------------------------------------------
  WEAPON['tainted-magdalene'] = function (p, d, dt, ctx, held) {
    p.hugT = (p.hugT || 0) - dt
    if (held && p.hugT <= 0) {
      p.hugT = Math.max(0.3, p.stats.fireDelay * 1.2)
      var n = swing(p, ctx, { x: d.x, y: d.y }, { reach: 120, arc: 7, dmg: p.stats.damage * 1.5, knock: 300, colour: '#e08a8a', sfx: 'stomp' })
      if (n) { p.hugHits = (p.hugHits || 0) + n; while (p.hugHits >= 2) { p.hugHits -= 2; addRed(p, 1) } }
    }
    return true
  }
  addHook('tainted-magdalene', 'onUpdate', function (p, dt, ctx) {
    // Everything above the first heart container is borrowed health.
    p.decayT = (p.decayT || 0) + dt
    if (p.decayT >= 9) { p.decayT = 0; if (p.hearts.red > 2) { p.hearts.red--; fxBurst(ctx, p.x, p.y, '#a33', 4) } }
  })
  addHook('tainted-magdalene', 'onEnemyKill', function (p, e, ctx) { addRed(p, 1) })

  // ---- Cain (tainted): Bag of Crafting -----------------------------------------------
  var BAG_VALUE = { coin: 1, bomb: 2, key: 2, heart: 2, soul: 4, black: 4, battery: 3, card: 3, rune: 3, pill: 3, trinket: 5 }
  addHook('tainted-cain', 'onPickup', function (p, kind, amount, ctx) {
    if (!BAG_VALUE[kind]) return
    var bag = p.bag || (p.bag = [])
    bag.push(kind)
    if (bag.length >= 8) craft(p, ctx)
  })
  function craft (p, ctx) {
    var sum = p.bag.reduce(function (n, k) { return n + (BAG_VALUE[k] || 1) }, 0)
    var q = Math.max(0, Math.min(4, Math.floor(sum / 9))), best = null, bestD = 99, i, id, d
    for (i = 0; i < 40; i++) {
      id = ctx.rollItem('treasure'); d = IS.itemsById[id]
      if (!d || d.kind === 'familiar' && false) continue
      var diff = Math.abs((d.quality || 0) - q)
      if (diff < bestD) { best = id; bestD = diff }
      if (!diff) break
    }
    p.bag = []
    if (best) { ctx.spawnPickup('item', p.x + 80, p.y, { itemId: best }); banner(ctx, 'CRAFTED', (IS.itemsById[best].name || best) + ' (quality ' + q + ')'); sfx(ctx, 'item-pickup') }
  }

  // ---- Judas (tainted): Dark Arts ----------------------------------------------------
  USE['dark-arts'] = function (p, ctx) { p.darkT = 1.6; p.darkHit = new Map(); p.invulnUntil = Math.max(p.invulnUntil || 0, nowOf(ctx) + 1.6); applyForm(p); sfx(ctx, 'transform'); fxBurst(ctx, p.x, p.y, '#222', 12) }
  WEAPON['tainted-judas'] = function (p) { return p.darkT > 0 }
  function trample (p, dt, ctx, mult, tag) {
    var now = nowOf(ctx), m = p[tag] || (p[tag] = new Map())
    foes(ctx).forEach(function (e) {
      if (e.dead || e.hidden || IS.dist(p.x, p.y, e.x, e.y) > e.r + p.r + 8) return
      if (now - (m.get(e) || -9) < 0.25) return
      m.set(e, now)
      IS.damageEnemy(e, p.stats.damage * mult, { src: { vx: e.x - p.x, vy: e.y - p.y } }, ctx)
    })
  }
  addHook('tainted-judas', 'onUpdate', function (p, dt, ctx) {
    if (!(p.darkT > 0)) return
    p.darkT -= dt
    p.invulnUntil = Math.max(p.invulnUntil || 0, nowOf(ctx) + 0.1)
    trample(p, dt, ctx, 1.2, 'darkHit')
    if (p.darkT <= 0) { p.darkT = 0; applyForm(p) }
  })

  // ---- ??? (tainted): poop tears and poop spells ----------------------------------
  addHook('tainted-blue-baby', 'onTearFire', function (p, t, ctx) { t.tint = '#7a5230'; if (ctx.chance(0.2)) t.flags.add('slow') })
  var SPELLS = ['stinky', 'corny', 'burning', 'explosive', 'black', 'holy']
  USE.hold = function (p, ctx) {
    var spell = p.heldSpell || (p.heldSpell = SPELLS[ctx.int(SPELLS.length)]), a = aim(p), foesNow = foes(ctx)
    p.heldSpell = null
    if (ctx.spawnPoop) ctx.spawnPoop(p.x + a.x * 70, p.y + a.y * 70)
    if (spell === 'stinky') foesNow.forEach(function (e) { ctx.applyStatus(e, 'fear', 4) })
    else if (spell === 'corny') foesNow.forEach(function (e) { ctx.applyStatus(e, 'poison', 5) })
    else if (spell === 'burning') foesNow.forEach(function (e) { ctx.applyStatus(e, 'burn', 4) })
    else if (spell === 'black') foesNow.forEach(function (e) { ctx.applyStatus(e, 'slow', 5) })
    else if (spell === 'explosive') ctx.bombExplode(p.x + a.x * 120, p.y + a.y * 120, { dmg: 40 + p.stats.damage * 6, r: 120, playerSafe: true, src: p })
    else if (spell === 'holy') p.charMantle = true
    banner(ctx, spell.toUpperCase() + ' POOP', ''); sfx(ctx, 'fart')
    p.heldSpell = null
  }

  // ---- Eve (tainted): Sumptorium ----------------------------------------------------
  function spawnClot (p, ctx) {
    var n = (p.familiars || []).filter(function (f) { return f.id === 'red-spider' }).length
    if (n >= 8) return false
    return !!ctx.spawnFamiliar('red-spider')
  }
  USE.sumptorium = function (p, ctx) {
    if (p.hearts.red < 2) return false
    p.hearts.red -= 1
    if (!spawnClot(p, ctx)) { p.hearts.red += 1; return false }
    sfx(ctx, 'familiar-spawn'); fxBurst(ctx, p.x, p.y, '#a22', 6)
  }
  addHook('tainted-eve', 'onPlayerDamage', function (p, n, src, ctx) { if (ctx.chance(0.5)) spawnClot(p, ctx) })

  // ---- Samson (tainted): Berserk ---------------------------------------------------
  USE.berserk = function (p, ctx) { p.berserkT = 6; p.berserkHit = new Map(); applyForm(p); sfx(ctx, 'boss-roar'); banner(ctx, 'BERSERK', '') }
  addHook('tainted-samson', 'onUpdate', function (p, dt, ctx) {
    if (!(p.berserkT > 0)) return
    p.berserkT -= dt
    trample(p, dt, ctx, 0.9, 'berserkHit')
    if (p.berserkT <= 0) { p.berserkT = 0; applyForm(p) }
  })

  // ---- Azazel (tainted): Hemoptysis ------------------------------------------------
  USE.hemoptysis = function (p, ctx) {
    var a = Math.atan2(aim(p).y, aim(p).x), s = IS.TEAR_SPEED * 0.9
    for (var i = 0; i < 11; i++) {
      var q = a + (i - 5) * 0.12
      ctx.spawnTear({ x: p.x, y: p.y - 10, vx: Math.cos(q) * s, vy: Math.sin(q) * s, dmg: p.stats.damage * 0.9, r: 9, life: 0.55, flags: new Set(['piercing']), tint: '#a31' })
    }
    sfx(ctx, 'fart'); IS.fx && IS.fx.shake && IS.fx.shake(3, 0.2)
  }

  // ---- The Forgotten and The Soul (swap) ----------------------------------------------
  function boneHearts (p) { return p.charId === 'the-forgotten' && p.form === 'soul' && p.alt ? p.alt.hearts : p.hearts }
  INIT['the-forgotten'] = function (p) {
    p.form = 'bone'; p.hearts.maxBone = p.hearts.bone
    mkBody(p, { form: 'soul', hearts: { red: 0, maxRed: 0, soul: 4, black: 0, bone: 0, maxBone: 0, eternal: 0, gold: 0, rotten: 0, broken: 0 }, tint: TINT.soul, follow: true })
    p.alt = p.familiars[p.familiars.length - 1]
  }
  SWAP['the-forgotten'] = function (p, ctx) { swapBody(p, ctx) }
  addHook('the-forgotten', 'onPlayerDeath', function (p, ctx) { return bodyDeath(p, ctx) })
  PICK['the-forgotten'] = function (p, x, ctx) {
    var amt = x.amount || 2, done = false
    if (x.dead) return false
    if (x.kind === 'heart') { var h = boneHearts(p); if (h.bone >= h.maxBone) return false; h.bone = Math.min(h.maxBone, h.bone + amt); done = true }
    else if (x.kind === 'soul' || x.kind === 'black') {
      var soulBody = p.form === 'soul' ? p.hearts : p.alt.hearts
      soulBody[x.kind === 'soul' ? 'soul' : 'black'] += amt; done = true
    }
    if (done) { x.dead = true; sfx(ctx, 'heart-pickup'); IS.fireHook(p, 'onPickup', [x.kind, amt], ctx); return true }
  }

  // The bone club: tap to swing, hold to throw it out and back.
  function clubWeapon (p, d, dt, ctx, held) {
    p.clubCd = (p.clubCd || 0) - dt
    if (held) {
      p.clubCharge = (p.clubCharge || 0) + dt; p.clubDir = { x: d.x, y: d.y }
      if (p.clubCharge >= 0.6 && p.clubCd <= 0) { throwClub(p, ctx); p.clubCharge = 0; p.clubCd = Math.max(0.35, p.stats.fireDelay * 1.5) }
    } else if (p.clubCharge > 0) {
      if (p.clubCharge < 0.6 && p.clubCd <= 0) { swing(p, ctx, p.clubDir || aim(p), { reach: 110, arc: 2.1, dmg: p.stats.damage * 1.3, knock: 320, blockShots: true, sfx: 'knife-throw' }); p.clubCd = Math.max(0.2, p.stats.fireDelay * 0.9) }
      p.clubCharge = 0
    }
    return true
  }
  function throwClub (p, ctx) {
    var a = Math.atan2(p.clubDir.y, p.clubDir.x), s = IS.TEAR_SPEED * 0.8 * p.stats.shotSpeed
    var t = ctx.spawnTear({ x: p.x + Math.cos(a) * 30, y: p.y + Math.sin(a) * 30, vx: Math.cos(a) * s, vy: Math.sin(a) * s, dmg: p.stats.damage * 1.2, r: 15, life: p.stats.range / s * 1.7, flags: new Set(['piercing', 'spectral']), tint: '#e8e2d0' })
    if (t) { t.boomerang = true; t.flags.add('boomerang') }
    sfx(ctx, 'knife-throw')
  }
  WEAPON['the-forgotten'] = function (p, d, dt, ctx, held) { return p.form === 'soul' ? false : clubWeapon(p, d, dt, ctx, held) }
  WEAPON['tainted-the-forgotten'] = clubWeapon

  // ---- Tainted Forgotten: carry and throw the skeleton --------------------------------
  INIT['tainted-the-forgotten'] = function (p) {
    p.hearts.maxBone = p.hearts.bone
    p.skel = mkBody(p, { form: 'skeleton', hearts: {}, tint: TINT.skeleton, state: 'carried', sprite: 'the-forgotten', r: 20, atkT: 0 })
  }
  SWAP['tainted-the-forgotten'] = function (p, ctx) {
    var k = p.skel
    if (!k) return
    if (k.state === 'carried') { var a = aim(p); k.state = 'air'; k.vx = a.x * 760; k.vy = a.y * 760; k.airT = 0.35; sfx(ctx, 'knife-throw') }
    else if (k.state === 'ground' && IS.dist(p.x, p.y, k.x, k.y) < 140) { k.state = 'carried'; sfx(ctx, 'familiar-spawn') }
  }
  addHook('tainted-the-forgotten', 'onUpdate', function (p, dt, ctx) {
    var k = p.skel
    if (!k) return
    if (k.state === 'carried') { k.x = p.x; k.y = p.y - 34; return }
    if (k.state === 'air') {
      var e = { x: k.x, y: k.y, r: 14, vx: k.vx, vy: k.vy }
      IS.moveEntity(e, dt, ctx.room, ctx); k.x = e.x; k.y = e.y
      k.airT -= dt
      foes(ctx).forEach(function (en) { if (!en.dead && IS.dist(k.x, k.y, en.x, en.y) < en.r + 22 && !(k.hit && k.hit.has(en))) { (k.hit || (k.hit = new Set())).add(en); IS.damageEnemy(en, p.stats.damage * 2, { src: { vx: k.vx, vy: k.vy } }, ctx) } })
      if (k.airT <= 0) { k.state = 'ground'; k.hit = null }
      return
    }
    // on the ground he fights alone
    k.atkT -= dt
    if (k.atkT <= 0) {
      var near = null, bd = 150
      foes(ctx).forEach(function (en) { var dd = IS.dist(k.x, k.y, en.x, en.y); if (!en.dead && dd < bd) { bd = dd; near = en } })
      if (near) { var n = IS.norm(near.x - k.x, near.y - k.y); swing({ x: k.x, y: k.y }, ctx, n, { reach: 100, arc: 6.3, dmg: p.stats.damage * 1.5, knock: 280, sfx: 'knife-throw' }); k.atkT = 0.7 }
    }
  })

  // ---- Lazarus (tainted): Flip ----------------------------------------------------------
  INIT['tainted-lazarus'] = function (p) {
    p.form = 'lazarus'
    var h = Object.assign({}, p.hearts, { red: 6, maxRed: 6 })
    mkBody(p, { form: 'dead', hearts: h, tint: TINT.dead })
    p.alt = p.familiars[p.familiars.length - 1]
    applyForm(p)
  }
  USE.flip = function (p, ctx) { return swapBody(p, ctx) }
  addHook('tainted-lazarus', 'onPlayerDeath', function (p, ctx) { return bodyDeath(p, ctx) })

  // ---- Lilith (tainted): Gello whip -------------------------------------------------------
  WEAPON['tainted-lilith'] = function (p, d, dt, ctx, held) {
    p.whipT = (p.whipT || 0) - dt
    if (held && p.whipT <= 0) {
      p.whipT = Math.max(0.3, p.stats.fireDelay * 1.4)
      var q = { x: p.x, y: p.y }
      swing(q, ctx, { x: d.x, y: d.y }, { reach: 190, arc: 1.3, dmg: p.stats.damage * 1.6, knock: 360, colour: '#d9a1a1', sfx: 'knife-throw' })
    }
    return true
  }

  // ---- Apollyon (tainted): Abyss --------------------------------------------------------------
  var LOCUSTS = ['red-locust', 'locust-of-pestilence', 'locust-of-death']
  USE.abyss = function (p, ctx) {
    var start = defOf(p).items || [], i, id, d
    for (i = p.items.length - 1; i >= 0; i--) {
      id = p.items[i]; d = IS.itemsById[id]
      if (d && d.kind === 'passive' && start.indexOf(id) < 0) break
      id = null
    }
    if (!id) return false
    var q = (d.quality || 1)
    IS.removeItem(p, id)
    for (i = 0; i < 1 + q; i++) ctx.spawnFamiliar(LOCUSTS[Math.min(2, (q / 2) | 0)])
    banner(ctx, 'ABYSS', (d.name || id) + ' devoured'); sfx(ctx, 'boss-roar')
  }

  // ---- Bethany: Book of Virtues; Tainted Bethany: Lemegeton -------------------------------------
  function wisps (p, ctx, n, id) {
    for (var i = 0; i < n; i++) {
      var live = (p.familiars || []).filter(function (f) { return /wisp$/.test(f.id) })
      if (live.length >= 8) IS.removeFamiliar(p, live[0].id)
      ctx.spawnFamiliar(id || 'wisp')
    }
  }
  USE['book-of-virtues'] = function (p, ctx) { wisps(p, ctx, 1, ctx.chance(0.3) ? 'white-wisp' : 'wisp'); sfx(ctx, 'familiar-spawn') }
  USE.lemegeton = function (p, ctx) { wisps(p, ctx, 3, 'wisp'); banner(ctx, 'LEMEGETON', 'Wisps conjured'); sfx(ctx, 'familiar-spawn') }
  addHook('bethany', 'onPickup', function (p, kind, amount) { if ((kind === 'soul' || kind === 'black') && p.active[0]) IS.addCharge(p, (amount || 2) / 2, 0) })
  PICK['tainted-bethany'] = function (p, x, ctx, orig) {
    if (x.kind !== 'heart' || x.dead) return
    if (orig(p, x, ctx)) return true
    // at full health the heart still charges Lemegeton
    x.dead = true; gainCharge(p, 'hearts', 1); sfx(ctx, 'heart-pickup'); return true
  }

  // ---- Jacob & Esau ----------------------------------------------------------------------------
  function mkEsau (p) {
    var b = Object.assign({}, p.base, { damage: p.base.damage * 1.15, speed: Math.max(0.5, p.base.speed - 0.1) })
    var tw = mkBody(p, { id: 'esau', def: { id: 'esau', behaviour: 'charBody', params: {} }, charId: 'esau', isTwin: true, sprite: 'jacob-and-esau', tint: TINT.esau, r: 24, head: { x: 1, y: 0 },
      items: p.items, itemCounts: p.itemCounts, trinkets: p.trinkets, active: [null, null], base: b, flags: new Set(), tearFlags: new Set(), status: {}, transforms: {}, familiars: [], cache: {},
      invulnUntil: 0, nextShot: 0, goldenBomb: false, goldenKey: false, coins: 0, bombs: 0, keys: 0, pocket: [],
      hearts: { red: 6, maxRed: 6, soul: 0, black: 0, eternal: 0, gold: 0, bone: 0, rotten: 0, broken: 0, maxBone: 0 } })
    recalc(tw); tw.statSrc = p.stats
    return tw
  }
  INIT['jacob-and-esau'] = function (p) { p.twin = mkEsau(p) }
  function hurtTwin (p, tw, n, ctx) {
    var now = nowOf(ctx)
    if (now < tw.invulnUntil) return false
    var left = Math.ceil(n)
    for (var i = 0, ks = ['soul', 'black', 'red']; i < ks.length && left > 0; i++) { var t = Math.min(tw.hearts[ks[i]], left); tw.hearts[ks[i]] -= t; left -= t }
    tw.invulnUntil = now + IS.INVULN_TIME
    sfx(ctx, 'player-hurt'); fxBurst(ctx, tw.x, tw.y, '#a22', 6)
    if (formTotal(tw.hearts) <= 0) {
      for (var k in p.hearts) if (typeof p.hearts[k] === 'number') p.hearts[k] = 0
      if (!IS.killPlayer(p, ctx)) { tw.hearts.red = 2; p.hearts.red = 2 }
    }
    return true
  }
  addHook('jacob-and-esau', 'onUpdate', function (p, dt, ctx) {
    var tw = p.twin, room = roomOf(ctx)
    if (!tw || !room) return
    tw.items = p.items; tw.itemCounts = p.itemCounts; tw.trinkets = p.trinkets
    if (tw.statSrc !== p.stats) { recalc(tw); tw.statSrc = p.stats }
    var m = IS.input.move(), top = IS.MOVE_SPEED * tw.stats.speed, acc = (m.x || m.y ? 11 : 14) * top * dt
    tw.vx = IS.approach(tw.vx, m.x * top, acc); tw.vy = IS.approach(tw.vy, m.y * top, acc)
    IS.moveEntity(tw, dt, room, ctx)
    var d = IS.input.shoot()
    if (d.x || d.y) tw.head = d
    IS.updateWeapon(tw, d, dt, ctx)
    foes(ctx).forEach(function (e) { if (!e.dead && !e.harmless && !(e.spawnT > 0) && !e.hidden && IS.entityHit(e, tw)) { if (hurtTwin(p, tw, e.dmg || 1, ctx)) IS.knockback(tw, e.x, e.y, 420) } })
    ;(room.shots || []).forEach(function (s) { if (!s.dead && !s.friendly && IS.entityHit(s, tw)) { s.dead = true; hurtTwin(p, tw, s.dmg || 1, ctx) } })
    ;(room.pickups || []).forEach(function (pu) { if (!pu.dead && IS.entityHit(pu, tw)) IS.tryTakePickup(p, pu, ctx) })
  })
  addHook('jacob-and-esau', 'onRoomEnter', function (p, room, ctx) { if (p.twin) { var c = { x: room.pxW / 2, y: room.pxH / 2 }, n = IS.norm(c.x - p.x, c.y - p.y); p.twin.x = p.x + n.x * 60; p.twin.y = p.y + n.y * 60; p.twin.vx = p.twin.vy = 0 } })
  addHook('jacob-and-esau', 'onNewFloor', function (p) { if (p.twin) { p.twin.x = p.x + 50; p.twin.y = p.y } })

  // ---- Jacob (tainted): Dark Esau chases ---------------------------------------------------------------
  INIT['tainted-jacob-and-esau'] = function (p) {
    p.ghost = mkBody(p, { id: 'dark-esau', def: { id: 'dark-esau', behaviour: 'charBody', params: {} }, sprite: 'jacob-and-esau', tint: TINT.ghost, r: 26, hidden: true, stunT: 0, chainT: 0 })
  }
  USE['anima-sola'] = function (p, ctx) { if (!p.ghost || p.ghost.hidden) return false; p.ghost.chainT = 5; sfx(ctx, 'door-locked'); banner(ctx, 'ANIMA SOLA', 'Dark Esau is chained') }
  addHook('tainted-jacob-and-esau', 'onRoomEnter', function (p, room, ctx) {
    var g = p.ghost
    if (!g) return
    g.hidden = !!room.cleared
    g.stunT = 1.5
    // arrive on the far side of the room
    var corners = [[90, 90], [room.pxW - 90, 90], [90, room.pxH - 90], [room.pxW - 90, room.pxH - 90]], far = corners[0], fd = -1
    corners.forEach(function (c) { var dd = IS.dist(c[0], c[1], p.x, p.y); if (dd > fd) { fd = dd; far = c } })
    g.x = far[0]; g.y = far[1]
  })
  addHook('tainted-jacob-and-esau', 'onRoomClear', function (p) { if (p.ghost) p.ghost.hidden = true })
  addHook('tainted-jacob-and-esau', 'onUpdate', function (p, dt, ctx) {
    var g = p.ghost, room = roomOf(ctx)
    if (!g || g.hidden || !room || room.cleared) { if (g && room && room.cleared) g.hidden = true; return }
    g.stunT -= dt; g.chainT -= dt
    // tears that touch him push him back
    ;(room.tears || []).forEach(function (t) { if (!t.dead && t.friendly && IS.dist(t.x, t.y, g.x, g.y) < g.r + t.r) { t.dead = true; var n = IS.norm(g.x - p.x, g.y - p.y); g.x += n.x * 14; g.y += n.y * 14; g.stunT = Math.max(g.stunT, 0.12) } })
    if (g.stunT > 0 || g.chainT > 0) return
    var n2 = IS.norm(p.x - g.x, p.y - g.y), sp = IS.MOVE_SPEED * 0.55
    g.x += n2.x * sp * dt; g.y += n2.y * sp * dt
    if (IS.dist(g.x, g.y, p.x, p.y) < g.r + p.r - 6) {
      if (IS.damagePlayer(p, 2, { name: 'Dark Esau' }, ctx)) { var o = IS.norm(g.x - p.x, g.y - p.y); g.x += o.x * 120; g.y += o.y * 120; g.stunT = 2.5 }
    }
  })

  // ---- Tainted Isaac: item limit with an inventory cycle ------------------------------------------------
  function heldItems (p) { return p.items.filter(function (i) { var d = IS.itemsById[i]; return d && d.kind !== 'active' }) }
  function enforceLimit (p, ctx) {
    var held = heldItems(p), limit = p.itemLimit || 8
    while (held.length > limit) {
      var out = held.shift(), d = IS.itemsById[out]
      IS.removeItem(p, out);
      ;((d && d.familiars) || []).forEach(function (f) { IS.removeFamiliar(p, f) })
      ;(p.inv || (p.inv = [])).push(out)
    }
  }
  INIT['tainted-isaac'] = function (p) { p.itemLimit = 8; p.inv = [] }
  SWAP['tainted-isaac'] = function (p, ctx) {
    if (!p.inv || !p.inv.length) return
    var id = p.inv.shift()
    grant(p, id, ctx)
    sfx(ctx, 'card-use')
  }

  // ---- generic per-frame work ----------------------------------------------------------------------------------
  addHooks(ALL, {
    onUpdate: function (p, dt, ctx) {
      if (p.edenPending && ctx.run && ctx.run.pools) edenGive(p, ctx)
      if (p.edenHit) edenReroll(p, ctx)
      whoreWatch(p)
      var sw = SWAP[p.charId]
      if (sw && pressed('pocketSwap')) sw(p, ctx)
      if (p.charId === 'tainted-eden' && false) return
    }
  })

  // ---- HUD: pocket active, extra bodies, counters (called from js/render/hud.js) ---------------------------
  function miniHearts (g, h, x, y, u, label) {
    g.save()
    g.font = 'bold ' + (12 * u) + 'px sans-serif'; g.textBaseline = 'middle'; g.fillStyle = '#d9c9a8'; g.fillText(label, x, y)
    var cells = [], i
    for (i = 0; i < (h.maxRed || 0); i += 2) cells.push(['#c23030', Math.max(0, Math.min(2, h.red - i)) / 2])
    for (i = 0; i < (h.bone || 0); i += 2) cells.push(['#ddd6c0', Math.min(2, h.bone - i) / 2])
    for (i = 0; i < (h.soul || 0); i += 2) cells.push(['#6fa8e8', Math.min(2, h.soul - i) / 2])
    for (i = 0; i < (h.black || 0); i += 2) cells.push(['#2a2a33', Math.min(2, h.black - i) / 2])
    cells.forEach(function (c, j) {
      var cx = x + (22 + j * 17) * u
      g.fillStyle = 'rgba(20,12,10,.8)'; g.beginPath(); g.arc(cx, y, 7 * u, 0, 6.3); g.fill()
      if (c[1] > 0) { g.fillStyle = c[0]; g.beginPath(); g.arc(cx, y, 7 * u * (c[1] >= 1 ? 1 : 0.6), 0, 6.3); g.fill() }
    })
    g.restore()
  }
  IS.charHud = function (g, run, u) {
    var p = run && run.player
    if (!p) return
    g.save()
    var a = p.pAct
    if (a) {
      var x = 1236 * u, y = 590 * u, ratio = a.max ? Math.min(1, a.charge / a.max) : 1
      g.fillStyle = 'rgba(28,18,13,.8)'; g.fillRect(x - 34 * u, y - 34 * u, 68 * u, 68 * u)
      g.strokeStyle = '#3b2b22'; g.lineWidth = 6 * u; g.beginPath(); g.arc(x, y, 31 * u, 0, 6.3); g.stroke()
      g.strokeStyle = ratio >= 1 ? '#e2bd62' : '#a4633f'; g.beginPath(); g.arc(x, y, 31 * u, -1.5708, -1.5708 + 6.2832 * ratio); g.stroke()
      g.fillStyle = '#e6d8bd'; g.font = 'bold ' + (11 * u) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
      var words = String(a.name).split(' ')
      words.forEach(function (w, i) { g.fillText(w.toUpperCase(), x, y + (i - (words.length - 1) / 2) * 12 * u) })
      g.textAlign = 'left'
    }
    if (p.twin) miniHearts(g, p.twin.hearts, 20 * u, 168 * u, u, 'E')
    if (p.alt && p.alt.hearts) miniHearts(g, p.alt.hearts, 20 * u, 168 * u, u, p.alt.form === 'soul' ? 'SOUL' : p.alt.form === 'dead' ? 'DEAD' : '')
    var lines = []
    if (p.itemLimit) lines.push('ITEMS ' + heldItems(p).length + '/' + p.itemLimit + (p.inv && p.inv.length ? '  STORED ' + p.inv.length : ''))
    if (p.bag || p.flags.has('bagOfCrafting')) lines.push('BAG ' + (p.bag ? p.bag.length : 0) + '/8')
    if (p.heldSpell) lines.push('SPELL ' + p.heldSpell.toUpperCase())
    if (p.berserkT > 0) lines.push('BERSERK ' + p.berserkT.toFixed(1))
    if (p.darkT > 0) lines.push('SHADOW ' + p.darkT.toFixed(1))
    if (p.skel) lines.push('SKELETON ' + p.skel.state.toUpperCase())
    g.fillStyle = '#d9c9a8'; g.font = (12 * u) + 'px sans-serif'; g.textBaseline = 'middle'
    lines.forEach(function (t, i) { g.fillText(t, 18 * u, (250 + i * 16) * u) })
    g.restore()
  }

  IS.charMechanics = { HK: HK, WEAPON: WEAPON, USE: USE, SWAP: SWAP, FALLBACK: FALLBACK, swapBody: swapBody, craft: craft, edenReroll: edenReroll, gainCharge: gainCharge, hurtTwin: hurtTwin }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
