;(function (IS) {
  'use strict'

  // ---------------------------------------------------------------------------
  // ISUCK — fx: particles, decals, creep, floaters, screen shake and flashes.
  //
  // One flat pool. Live effects sit in `list` (which IS.fx.list exposes to the
  // renderer); dead ones sit in `pool` waiting to be handed back out. Nothing in
  // here allocates per frame: spawning reuses a pooled object, dying swaps the
  // effect out of `list` and pushes it back onto `pool`. When the pool is
  // exhausted at the hard cap the spawn is dropped rather than stealing a live
  // effect — a missing spark is invisible, a recycled one flickers.
  //
  // This layer is presentation only. It never damages anything, never reads run
  // state and never writes to the simulation. Creep is the one exception in the
  // other direction: it stores gameplay *data* (dmg, slow, friendly) that
  // js/engine/room.js reads through IS.fx.creepAt and applies itself.
  //
  // Math.random() is legal here (ARCHITECTURE.md §0) and is used for visual
  // jitter only. It is deliberately absent from every field the simulation can
  // observe: creep centres, radii, dmg, slow and lifetimes are all caller-given,
  // and blob shapes are derived from a monotonic integer seed at draw time.
  //
  // Note on determinism: creep puddles with a finite `life` age by whatever dt
  // update() is handed, so main.js must tick fx inside the fixed step. The
  // default (life 0 = lasts as long as the room) sidesteps this entirely.
  // ---------------------------------------------------------------------------

  var TAU = Math.PI * 2

  var POOL_PRE = 1200 // pre-allocated at load
  var POOL_CAP = 6000 // hard ceiling on live effects
  var DECAL_CAP = 140 // stains kept per room
  var FLOATER_CAP = 28 // concurrent damage numbers / pickup names
  var CREEP_CAP = 48
  var CREEP_RMAX = 160

  var FLOATER_FONT = 'bold 22px "Trebuchet MS", Verdana, Geneva, sans-serif'

  var CREEP_COLOURS = {
    red: '#7a1f18',
    green: '#3d7a2c',
    black: '#231e28',
    white: '#d6d2ca',
    holy: '#e8d68c'
  }

  var pool = []
  var list = []
  var creeps = []
  var counts = { decal: 0, floater: 0, flash: 0 }
  var bornSeq = 1

  var shakeAmp = 0
  var shakeT = 0
  var shakeDur = 0
  var shakePhase = 0

  var warned = Object.create(null)

  function warnOnce (key, msg) {
    if (warned[key]) return
    warned[key] = true
    console.warn(msg)
  }

  function num (v, d) {
    return typeof v === 'number' && isFinite(v) ? v : d
  }

  // Hooks in the wild write both spellings; ctx.spawnEffect forwards opts raw.
  function colourOf (opts, fallback) {
    if (!opts) return fallback
    var c = opts.colour == null ? opts.color : opts.colour
    return typeof c === 'string' && c ? c : fallback
  }

  function shift (hex, amount) {
    if (typeof IS.shade !== 'function') return hex
    if (typeof hex !== 'string' || hex.charAt(0) !== '#') return hex
    try {
      var out = IS.shade(hex, amount)
      return typeof out === 'string' && out ? out : hex
    } catch (err) {
      return hex
    }
  }

  function reducedFx () {
    if (!IS.save || typeof IS.save.option !== 'function') return false
    try {
      return !!IS.save.option('reducedFx')
    } catch (err) {
      return false
    }
  }

  // Read the option per spawn call, not per particle and not once at load: the
  // options screen can flip it mid-run.
  function scaleCount (n) {
    if (!(n > 0)) return 0
    n = Math.round(n)
    if (!reducedFx()) return n
    var out = Math.round(n * 0.35)
    return out < 1 ? 1 : out
  }

  // --- the pool --------------------------------------------------------------

  function makeEffect () {
    return {
      type: '', layer: 'over', alive: false, born: 0,
      x: 0, y: 0, vx: 0, vy: 0, z: 0, vz: 0,
      gravity: 0, drag: 0, bounce: 0,
      t: 0, life: 0, fade: 0,
      size: 4, size1: 0,
      r: 0, r0: 0, r1: 0, width: 2, len: 0,
      angle: 0, spin: 0,
      alpha: 1, colour: '#e8e4dc', colour2: '',
      text: '',
      kind: '', dmg: 0, slow: 1, friendly: false,
      seed: 0, li: -1, ci: -1
    }
  }

  function resetEffect (e) {
    e.type = ''
    e.layer = 'over'
    e.x = 0; e.y = 0; e.vx = 0; e.vy = 0; e.z = 0; e.vz = 0
    e.gravity = 0; e.drag = 0; e.bounce = 0
    e.t = 0; e.life = 0; e.fade = 0
    e.size = 4; e.size1 = 0
    e.r = 0; e.r0 = 0; e.r1 = 0; e.width = 2; e.len = 0
    e.angle = 0; e.spin = 0
    e.alpha = 1; e.colour = '#e8e4dc'; e.colour2 = ''
    e.text = ''
    e.kind = ''; e.dmg = 0; e.slow = 1; e.friendly = false
    e.seed = 0; e.li = -1; e.ci = -1
  }

  function alloc (type, layer) {
    var e
    if (pool.length) e = pool.pop()
    else if (list.length < POOL_CAP) e = makeEffect()
    else return null
    resetEffect(e)
    e.type = type
    e.layer = layer === 'under' ? 'under' : 'over'
    e.alive = true
    e.born = bornSeq++
    e.seed = e.born
    e.li = list.length
    list.push(e)
    return e
  }

  function unindexCreep (e) {
    var i = e.ci
    if (i < 0) return
    if (creeps[i] !== e) {
      i = creeps.indexOf(e)
      if (i < 0) { e.ci = -1; return }
    }
    var last = creeps.pop()
    if (last !== e) { creeps[i] = last; last.ci = i }
    e.ci = -1
  }

  function kill (e) {
    if (!e || !e.alive) return
    e.alive = false
    var i = e.li
    if (list[i] !== e) i = list.indexOf(e)
    if (i >= 0) {
      var last = list.pop()
      if (last !== e) { list[i] = last; last.li = i }
    }
    e.li = -1
    if (e.ci >= 0) unindexCreep(e)
    if (counts[e.type] !== undefined) counts[e.type]--
    pool.push(e)
  }

  // `list` is not age-ordered (swap-remove scrambles it), so age comes off the
  // monotonic `born` counter. Only ever called when a cap is hit.
  function killOldest (type) {
    var best = null
    for (var i = 0; i < list.length; i++) {
      var e = list[i]
      if (e.type !== type) continue
      if (!best || e.born < best.born) best = e
    }
    if (best) kill(best)
  }

  function oldestCreep () {
    var best = null
    for (var i = 0; i < creeps.length; i++) {
      if (!best || creeps[i].born < best.born) best = creeps[i]
    }
    return best
  }

  for (var pre = 0; pre < POOL_PRE; pre++) pool.push(makeEffect())

  // --- shared curves ---------------------------------------------------------

  function k01 (e) {
    if (e.life <= 0) return 0
    var k = e.t / e.life
    return k < 0 ? 0 : (k > 1 ? 1 : k)
  }

  function fadeOf (e) {
    if (e.life <= 0) return 1
    var k = e.t / e.life
    if (k >= 1) return 0
    if (k <= e.fade) return 1
    var span = 1 - e.fade
    return span > 0 ? 1 - (k - e.fade) / span : 0
  }

  function outQuad (k) { return 1 - (1 - k) * (1 - k) }

  // Deterministic per-effect jitter for blob shapes: same seed, same silhouette
  // every frame, so stains and puddles never shimmer.
  function jit (seed, salt) {
    var h = (Math.imul(seed + 1, 374761393) + Math.imul(salt + 1, 668265263)) | 0
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    return ((h ^ (h >>> 16)) & 0xffff) / 32768 - 1
  }

  function jit01 (seed, salt) { return jit(seed, salt) * 0.5 + 0.5 }

  // A puddle/stain silhouette built from overlapping discs, every one of which
  // stays inside `r` — the drawn shape must never imply a bigger hitbox than
  // creepAt actually reports.
  function drawBlob (g, x, y, r, seed, lobes) {
    if (!(r > 0)) return
    g.beginPath()
    g.moveTo(x + r * 0.6, y)
    g.arc(x, y, r * 0.6, 0, TAU)
    for (var i = 0; i < lobes; i++) {
      var a = (i / lobes) * TAU + jit(seed, i) * 0.5
      var d = r * (0.2 + 0.09 * jit01(seed, i + 11))
      var rr = r * (0.4 + 0.26 * jit01(seed, i + 23))
      var cx = x + Math.cos(a) * d
      var cy = y + Math.sin(a) * d
      g.moveTo(cx + rr, cy)
      g.arc(cx, cy, rr, 0, TAU)
    }
    g.fill()
  }

  // --- update ----------------------------------------------------------------

  function stepShake (dt) {
    if (shakeT > 0) {
      shakeT -= dt
      if (shakeT <= 0) { shakeT = 0; shakeAmp = 0; shakeDur = 0 }
    }
    var cam = IS.camera
    if (!cam) cam = IS.camera = { x: 0, y: 0, zoom: 1, shakeX: 0, shakeY: 0 }
    if (shakeT <= 0) { cam.shakeX = 0; cam.shakeY = 0; return }
    var k = shakeDur > 0 ? shakeT / shakeDur : 0
    var amp = shakeAmp * k * k
    shakePhase += dt * 47
    cam.shakeX = Math.cos(shakePhase) * amp * (0.65 + Math.random() * 0.7)
    cam.shakeY = Math.sin(shakePhase * 1.7) * amp * (0.65 + Math.random() * 0.7)
  }

  function landGib (e) {
    var r = e.size * 1.7
    if (r < 5) r = 5
    IS.fx.decal(e.x, e.y, r, e.colour2 || e.colour)
  }

  IS.fx = IS.fx || {}

  IS.fx.list = list
  IS.fx.creeps = creeps

  IS.fx.update = function (dt) {
    dt = num(dt, IS.DT)
    if (dt < 0) dt = 0
    if (dt > 0.25) dt = 0.25 // a tab-switch stall must not teleport gibs
    if (dt === 0) { stepShake(0); return }

    // Backwards, so swap-remove is safe and anything spawned mid-loop (a decal
    // from a landing gib) lands above `i` and skips this frame's tick.
    for (var i = list.length - 1; i >= 0; i--) {
      var e = list[i]
      if (!e.alive) continue
      e.t += dt

      switch (e.type) {
        case 'particle': {
          if (e.drag > 0) {
            var d = 1 - e.drag * dt
            if (d < 0) d = 0
            e.vx *= d; e.vy *= d
          }
          e.vy += e.gravity * dt
          e.x += e.vx * dt
          e.y += e.vy * dt
          e.angle += e.spin * dt
          break
        }
        case 'gib': {
          var gd = 1 - 1.4 * dt
          if (gd < 0) gd = 0
          e.vx *= gd; e.vy *= gd
          e.x += e.vx * dt
          e.y += e.vy * dt
          e.vz -= e.gravity * dt
          e.z += e.vz * dt
          e.angle += e.spin * dt
          if (e.z <= 0) {
            e.z = 0
            if (e.bounce > 0 && e.vz < -60) {
              e.bounce--
              e.vz = -e.vz * 0.34
              e.vx *= 0.45; e.vy *= 0.45
              e.spin *= 0.5
            } else {
              landGib(e)
              kill(e)
              continue
            }
          }
          break
        }
        case 'floater': {
          e.vy += 42 * dt // rise, then ease off
          e.x += e.vx * dt
          e.y += e.vy * dt
          break
        }
        case 'puff': {
          e.x += e.vx * dt
          e.y += e.vy * dt
          e.vx *= 0.94
          e.vy *= 0.94
          break
        }
        default:
          break // ring, beam, flash, decal, creep are static
      }

      if (e.life > 0 && e.t >= e.life) { kill(e); continue }
    }

    stepShake(dt)
  }

  // --- spawners --------------------------------------------------------------

  IS.fx.particles = function (opts) {
    opts = opts || {}
    var n = scaleCount(num(opts.n, 8))
    if (n <= 0) return 0
    var x = num(opts.x, 0)
    var y = num(opts.y, 0)
    var colour = colourOf(opts, '#e8e4dc')
    var speed = num(opts.speed, 150)
    var life = num(opts.life, 0.5)
    var size = num(opts.size, 5)
    var gravity = num(opts.gravity, 0)
    var spread = num(opts.spread, TAU)
    var base = num(opts.angle, 0)
    var drag = num(opts.drag, 2.4)
    var alpha = num(opts.alpha, 1)
    var size1 = num(opts.size1, size * 0.25)
    var spin = num(opts.spin, 0)
    var layer = opts.layer === 'under' ? 'under' : 'over'
    if (life <= 0) life = 0.5
    if (size <= 0) size = 1

    var made = 0
    for (var i = 0; i < n; i++) {
      var e = alloc('particle', layer)
      if (!e) break
      var a = spread >= TAU
        ? Math.random() * TAU
        : base + (Math.random() - 0.5) * spread
      var sp = speed * (0.55 + Math.random() * 0.7)
      e.x = x + Math.cos(a) * 2
      e.y = y + Math.sin(a) * 2
      e.vx = Math.cos(a) * sp
      e.vy = Math.sin(a) * sp
      e.gravity = gravity
      e.drag = drag
      e.life = life * (0.7 + Math.random() * 0.6)
      e.fade = 0.4
      e.size = size * (0.7 + Math.random() * 0.7)
      e.size1 = size1
      e.alpha = alpha
      e.spin = spin ? spin * (Math.random() * 2 - 1) : 0
      e.colour = colour
      made++
    }
    return made
  }

  IS.fx.burst = function (x, y, colour, n) {
    x = num(x, 0)
    y = num(y, 0)
    colour = typeof colour === 'string' && colour ? colour : '#e8e4dc'
    var count = num(n, 12)
    IS.fx.particles({
      x: x, y: y, n: count, colour: colour,
      speed: 230, life: 0.4, size: 6, drag: 3.4
    })
    IS.fx.ring(x, y, { colour: colour, r0: 6, r1: 42 + count * 1.2, life: 0.26, width: 3 })
    return count
  }

  IS.fx.blood = function (x, y, n, colour) {
    x = num(x, 0)
    y = num(y, 0)
    colour = typeof colour === 'string' && colour ? colour : '#8e1f18'
    var count = scaleCount(num(n, 7))
    if (count <= 0) return 0
    var stain = shift(colour, -0.22)
    var made = 0
    for (var i = 0; i < count; i++) {
      var e = alloc('gib', 'over')
      if (!e) break
      var a = Math.random() * TAU
      var sp = 60 + Math.random() * 190
      e.x = x
      e.y = y
      e.vx = Math.cos(a) * sp
      e.vy = Math.sin(a) * sp * 0.65
      e.z = 6 + Math.random() * 10
      e.vz = 130 + Math.random() * 190
      e.gravity = 980
      e.bounce = 1
      e.life = 2.2 // backstop: the z-landing normally ends it first
      e.fade = 1
      e.size = 3.5 + Math.random() * 4
      e.angle = Math.random() * TAU
      e.spin = (Math.random() * 2 - 1) * 9
      e.colour = colour
      e.colour2 = stain
      made++
    }
    // a short-lived spray so the hit reads before the gibs land
    IS.fx.particles({
      x: x, y: y, n: Math.max(2, count >> 1), colour: colour,
      speed: 190, life: 0.22, size: 4, drag: 5
    })
    return made
  }

  IS.fx.floater = function (text, x, y, colour) {
    if (text == null) return null
    var str = typeof text === 'string' ? text : String(text)
    if (!str) return null
    if (counts.floater >= FLOATER_CAP) killOldest('floater')
    var e = alloc('floater', 'over')
    if (!e) return null
    counts.floater++
    e.text = str
    e.x = num(x, 0)
    e.y = num(y, 0)
    e.vx = (Math.random() * 2 - 1) * 14
    e.vy = -62
    e.life = 0.95
    e.fade = 0.5
    e.colour = typeof colour === 'string' && colour ? colour : '#e8e4dc'
    return e
  }

  IS.fx.shake = function (amount, secs) {
    var amp = num(amount, 4)
    var dur = num(secs, 0.25)
    if (amp <= 0 || dur <= 0) return
    if (reducedFx()) amp *= 0.4
    var cur = shakeDur > 0 ? shakeAmp * (shakeT / shakeDur) : 0
    if (amp >= cur) {
      shakeAmp = amp
      shakeDur = dur > shakeT ? dur : shakeT
      shakeT = shakeDur
    } else if (dur > shakeT) {
      shakeT = dur
      if (dur > shakeDur) shakeDur = dur
    }
  }

  IS.fx.ring = function (x, y, opts) {
    opts = opts || {}
    var e = alloc('ring', opts.layer === 'under' ? 'under' : 'over')
    if (!e) return null
    e.x = num(x, 0)
    e.y = num(y, 0)
    e.r0 = num(opts.r0, 8)
    e.r1 = num(opts.r1, 90)
    e.life = num(opts.life, 0.35)
    if (e.life <= 0) e.life = 0.35
    e.fade = num(opts.fade, 0.15)
    e.width = num(opts.width, 4)
    e.alpha = num(opts.alpha, 0.9)
    e.colour = colourOf(opts, '#e8e4dc')
    return e
  }

  IS.fx.poof = function (x, y, colour) {
    x = num(x, 0)
    y = num(y, 0)
    colour = typeof colour === 'string' && colour ? colour : '#cfc8bd'
    var n = scaleCount(3)
    for (var i = 0; i < n; i++) {
      var e = alloc('puff', 'over')
      if (!e) break
      var a = Math.random() * TAU
      e.x = x + Math.cos(a) * 6
      e.y = y + Math.sin(a) * 5
      e.vx = Math.cos(a) * 34
      e.vy = Math.sin(a) * 26 - 18
      e.r0 = 7 + Math.random() * 5
      e.r1 = 24 + Math.random() * 16
      e.life = 0.36 + Math.random() * 0.2
      e.fade = 0.2
      e.alpha = 0.75
      e.colour = colour
    }
    IS.fx.particles({
      x: x, y: y, n: 5, colour: colour, speed: 120, life: 0.32, size: 4, drag: 4
    })
    return n
  }

  IS.fx.flash = function (colour, secs) {
    if (counts.flash >= 4) killOldest('flash')
    var e = alloc('flash', 'over')
    if (!e) return null
    counts.flash++
    e.colour = typeof colour === 'string' && colour ? colour : '#ffffff'
    e.life = num(secs, 0.15)
    if (e.life <= 0) e.life = 0.15
    e.fade = 0
    e.alpha = reducedFx() ? 0.25 : 0.55
    return e
  }

  IS.fx.decal = function (x, y, r, colour) {
    var rad = num(r, 20)
    if (rad <= 0) return null
    if (rad > 90) rad = 90
    if (counts.decal >= DECAL_CAP) killOldest('decal')
    var e = alloc('decal', 'under')
    if (!e) return null
    counts.decal++
    e.x = num(x, 0)
    e.y = num(y, 0)
    e.r = rad
    e.alpha = 0.5
    e.colour = typeof colour === 'string' && colour ? colour : '#6d1a14'
    e.colour2 = shift(e.colour, -0.2)
    return e
  }

  IS.fx.beam = function (x, y, angle, len, opts) {
    opts = opts || {}
    var e = alloc('beam', 'over')
    if (!e) return null
    e.x = num(x, 0)
    e.y = num(y, 0)
    e.angle = num(angle, 0)
    e.len = num(len, 200)
    e.width = num(opts.width, opts.thick ? 22 : 12)
    e.life = num(opts.life, 0.12)
    if (e.life <= 0) e.life = 0.12
    e.fade = num(opts.fade, 0.3)
    e.alpha = num(opts.alpha, 1)
    e.colour = colourOf(opts, opts.brimstone ? '#c81c1c' : '#f04a3a')
    e.colour2 = typeof opts.core === 'string' && opts.core
      ? opts.core
      : (opts.brimstone ? '#ffd0c0' : '#fff4e8')
    return e
  }

  // --- creep -----------------------------------------------------------------
  //
  // A puddle is a circle plus the gameplay data room.js needs. It is never
  // clamped to the room (fx has no room reference) and never jittered: the
  // renderer's blob silhouette is derived from `seed` at draw time and stays
  // inside `r`.

  IS.fx.creep = function (x, y, r, opts) {
    opts = opts || {}
    var cx = num(x, 0)
    var cy = num(y, 0)
    var rad = num(r, 40)
    if (rad < 6) rad = 6
    if (rad > CREEP_RMAX) rad = CREEP_RMAX

    var kind = 'red'
    if (opts.kind != null) {
      if (typeof opts.kind === 'string' && CREEP_COLOURS[opts.kind]) kind = opts.kind
      else warnOnce('creep-kind:' + opts.kind, 'fx.creep: unknown kind "' + opts.kind + '" — using red')
    }

    var colour = colourOf(opts, CREEP_COLOURS[kind])
    var dmg = num(opts.dmg, 0)
    if (dmg < 0) dmg = 0
    var slow = num(opts.slow, 1)
    if (slow <= 0) slow = 0.05
    if (slow > 1) slow = 1
    var friendly = !!opts.friendly
    var life = num(opts.life, 0)
    if (life < 0) life = 0

    // Merge conservatively: only when the new centre sits well inside an
    // existing puddle of the same kind and allegiance. Over-merging would widen
    // the region where creepAt reports a hit, which is gameplay, not polish.
    for (var i = 0; i < creeps.length; i++) {
      var c = creeps[i]
      if (c.kind !== kind || c.friendly !== friendly) continue
      var dx = cx - c.x
      var dy = cy - c.y
      var dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > c.r * 0.5) continue
      var grown = dist + rad
      if (grown < c.r) grown = c.r
      if (grown > CREEP_RMAX) grown = CREEP_RMAX
      c.r = grown
      if (dmg > c.dmg) c.dmg = dmg
      if (slow < c.slow) c.slow = slow
      if (life <= 0) c.life = 0
      else if (c.life > 0) {
        c.t = 0
        if (life > c.life) c.life = life
      }
      return c
    }

    if (creeps.length >= CREEP_CAP) {
      var old = oldestCreep()
      if (old) kill(old)
    }

    var e = alloc('creep', 'under')
    if (!e) return null
    e.x = cx
    e.y = cy
    e.r = rad
    e.kind = kind
    e.dmg = dmg
    e.slow = slow
    e.friendly = friendly
    e.life = life
    e.fade = 0.7
    e.alpha = kind === 'holy' ? 0.5 : 0.62
    e.colour = colour
    e.colour2 = (kind === 'holy' || kind === 'white') ? shift(colour, 0.25) : shift(colour, -0.28)
    e.ci = creeps.length
    creeps.push(e)
    return e
  }

  // Point query, called every frame per moving entity. Bounding-box reject
  // first, then the circle. Overlaps resolve newest-first: room.js reads
  // .dmg/.slow/.friendly off whatever it gets, so mixing a friendly puddle's
  // data into a hostile one's answer would be wrong.
  IS.fx.creepAt = function (x, y) {
    if (!creeps.length) return null
    var px = num(x, NaN)
    var py = num(y, NaN)
    if (px !== px || py !== py) return null
    var best = null
    for (var i = 0; i < creeps.length; i++) {
      var c = creeps[i]
      var r = c.r
      var dx = px - c.x
      if (dx > r || dx < -r) continue
      var dy = py - c.y
      if (dy > r || dy < -r) continue
      if (dx * dx + dy * dy > r * r) continue
      if (!best || c.born > best.born) best = c
    }
    return best
  }

  // --- reset -----------------------------------------------------------------

  IS.fx.reset = function () {
    for (var i = list.length - 1; i >= 0; i--) {
      var e = list[i]
      e.alive = false
      e.li = -1
      e.ci = -1
      pool.push(e)
    }
    list.length = 0
    creeps.length = 0
    counts.decal = 0
    counts.floater = 0
    counts.flash = 0
    shakeAmp = 0
    shakeT = 0
    shakeDur = 0
    var cam = IS.camera
    if (cam) { cam.shakeX = 0; cam.shakeY = 0 }
  }

  // --- draw ------------------------------------------------------------------

  function drawParticle (g, e) {
    var a = e.alpha * fadeOf(e)
    if (a <= 0) return
    var s = e.size + (e.size1 - e.size) * k01(e)
    if (s <= 0.4) return
    g.globalAlpha = a
    g.fillStyle = e.colour
    var y = e.y - e.z
    // fillRect is materially cheaper than arc, and below a few units nobody can
    // tell a square spark from a round one.
    if (s < 7) {
      g.fillRect(e.x - s * 0.5, y - s * 0.5, s, s)
      return
    }
    g.beginPath()
    g.arc(e.x, y, s * 0.5, 0, TAU)
    g.fill()
  }

  function drawGib (g, e) {
    var y = e.y - e.z
    g.globalAlpha = 0.22
    g.fillStyle = '#000000'
    g.beginPath()
    g.save()
    g.translate(e.x, e.y)
    g.scale(1, 0.42)
    g.arc(0, 0, e.size * 0.8, 0, TAU)
    g.restore()
    g.fill()

    g.globalAlpha = 1
    g.fillStyle = e.colour
    g.save()
    g.translate(e.x, y)
    g.rotate(e.angle)
    g.scale(1, 0.72)
    g.beginPath()
    g.arc(0, 0, e.size, 0, TAU)
    g.fill()
    g.restore()
  }

  function drawFloater (g, e) {
    var a = e.alpha * fadeOf(e)
    if (a <= 0) return
    g.save()
    g.globalAlpha = a
    g.font = FLOATER_FONT
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.lineJoin = 'round'
    g.lineWidth = 5
    g.strokeStyle = 'rgba(0,0,0,0.72)'
    g.strokeText(e.text, e.x, e.y)
    g.fillStyle = e.colour
    g.fillText(e.text, e.x, e.y)
    g.restore()
  }

  function drawRing (g, e) {
    var a = e.alpha * fadeOf(e)
    if (a <= 0) return
    var k = k01(e)
    var r = e.r0 + (e.r1 - e.r0) * outQuad(k)
    if (r <= 0) return
    var w = e.width * (1 - k * 0.65)
    if (w < 0.6) w = 0.6
    g.globalAlpha = a
    g.strokeStyle = e.colour
    g.lineWidth = w
    g.beginPath()
    g.arc(e.x, e.y, r, 0, TAU)
    g.stroke()
  }

  function drawPuff (g, e) {
    var a = e.alpha * fadeOf(e)
    if (a <= 0) return
    var r = e.r0 + (e.r1 - e.r0) * outQuad(k01(e))
    if (r <= 0) return
    g.fillStyle = e.colour
    g.globalAlpha = a * 0.5
    g.beginPath()
    g.arc(e.x, e.y, r, 0, TAU)
    g.fill()
    g.globalAlpha = a * 0.34
    g.beginPath()
    g.arc(e.x - r * 0.3, e.y - r * 0.26, r * 0.6, 0, TAU)
    g.fill()
  }

  function drawBeam (g, e) {
    var a = e.alpha * fadeOf(e)
    if (a <= 0) return
    var w = e.width * (0.86 + 0.14 * Math.sin(e.t * 60))
    if (w < 1) w = 1
    g.save()
    g.translate(e.x, e.y)
    g.rotate(e.angle)
    g.fillStyle = e.colour
    g.globalAlpha = a * 0.22
    g.fillRect(0, -w * 0.9, e.len, w * 1.8)
    g.globalAlpha = a * 0.7
    g.fillRect(0, -w * 0.45, e.len, w * 0.9)
    g.globalAlpha = a
    g.fillStyle = e.colour2 || e.colour
    g.fillRect(0, -w * 0.16, e.len, w * 0.32)
    g.restore()
  }

  function drawDecal (g, e) {
    g.globalAlpha = e.alpha
    g.fillStyle = e.colour
    drawBlob(g, e.x, e.y, e.r, e.seed, 4)
    g.globalAlpha = e.alpha * 0.55
    g.fillStyle = e.colour2 || e.colour
    drawBlob(g, e.x, e.y, e.r * 0.6, e.seed + 5, 3)
  }

  function drawCreep (g, e) {
    var a = e.alpha * fadeOf(e)
    if (a <= 0) return
    g.globalAlpha = a
    g.fillStyle = e.colour
    drawBlob(g, e.x, e.y, e.r, e.seed, 6)
    g.globalAlpha = a * 0.45
    g.fillStyle = e.colour2 || e.colour
    drawBlob(g, e.x, e.y, e.r * 0.66, e.seed + 3, 4)
  }

  // Full-screen wash: drop out of the camera transform entirely and cover the
  // backing store, whatever DPR scale main.js has applied.
  function drawFlash (g, e) {
    var a = e.alpha * fadeOf(e)
    if (a <= 0) return
    var canvas = g.canvas
    var w = canvas && canvas.width ? canvas.width : IS.VIEW_W
    var h = canvas && canvas.height ? canvas.height : IS.VIEW_H
    g.save()
    g.setTransform(1, 0, 0, 1, 0, 0)
    g.globalAlpha = a
    g.fillStyle = e.colour
    g.fillRect(0, 0, w, h)
    g.restore()
  }

  IS.fx.draw = function (g, layer) {
    if (!g) return
    var under = layer === 'under'
    var i, e

    g.save()

    if (under) {
      // Creep beneath stains, always: it is a wet floor, not a splatter.
      for (i = 0; i < creeps.length; i++) drawCreep(g, creeps[i])
      for (i = 0; i < list.length; i++) {
        e = list[i]
        if (e.layer !== 'under' || e.type === 'creep') continue
        if (e.type === 'decal') drawDecal(g, e)
        else if (e.type === 'ring') drawRing(g, e)
        else if (e.type === 'particle') drawParticle(g, e)
        else if (e.type === 'puff') drawPuff(g, e)
      }
      g.restore()
      return
    }

    for (i = 0; i < list.length; i++) {
      e = list[i]
      if (e.layer !== 'over') continue
      switch (e.type) {
        case 'particle': drawParticle(g, e); break
        case 'gib': drawGib(g, e); break
        case 'floater': drawFloater(g, e); break
        case 'ring': drawRing(g, e); break
        case 'puff': drawPuff(g, e); break
        case 'beam': drawBeam(g, e); break
        case 'decal': drawDecal(g, e); break
        default: break // flash is a second pass, below
      }
    }

    // Only worth a second sweep while a wash is actually live.
    if (counts.flash > 0) {
      for (i = 0; i < list.length; i++) {
        e = list[i]
        if (e.type === 'flash') drawFlash(g, e)
      }
    }

    g.restore()
  }

})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
