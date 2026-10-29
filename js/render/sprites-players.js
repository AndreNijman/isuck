;(function (IS) {
  'use strict'
  /*
   * ORIGINAL player art: every playable character is a spec (palette, head shape, body, hooks) drawn by one
   * figure painter. Head and body are drawn separately: the head looks along t.headDir (aim), the body along
   * t.walkDir. Painters have the sprite signature (g, size, t); IS.drawPortrait draws a bust for the select screen.
   * Spec colours are plain hex; a hurt flash maps every light colour to near-white (dark details survive).
   * Layout in 100-unit space: head centre y=-26, torso y=-12..26, feet y=43.
   */
  var TAU = Math.PI * 2, DARK = '#1b1317', WHITE = '#f7f0e6'
  var D = Object.create(null)

  function sh (c, a) { return IS.art.sh(c, a) }
  function mix (a, b, t) { return IS.art.mix(a, b, t) }
  function al (c, a) { return IS.art.al(c, a) }
  function ol (c) { return IS.art.mix(DARK, c, .2) }
  function K (c, col) {
    if (!c.hurt || !col || col.charAt(0) !== '#') return col
    var q = IS.hexToRgb(col); return (.3 * q.r + .59 * q.g + .11 * q.b) > 50 ? WHITE : col
  }
  /* path builders: fn(g) adds a subpath; S/F/Ou do the beginPath */
  function E (x, y, rx, ry, rot) { return function (g) { g.moveTo(x + Math.abs(rx), y); g.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU) } }
  function P (p) { return function (g) { g.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath() } }
  function Q (p) {
    return function (g) {
      var n = p.length / 2, i, j
      g.moveTo((p[0] + p[n * 2 - 2]) / 2, (p[1] + p[n * 2 - 1]) / 2)
      for (i = 0; i < n; i++) { j = (i + 1) % n; g.quadraticCurveTo(p[i * 2], p[i * 2 + 1], (p[i * 2] + p[j * 2]) / 2, (p[i * 2 + 1] + p[j * 2 + 1]) / 2) }
      g.closePath()
    }
  }
  function R (x, y, w, h, r) {
    return function (g) {
      var q = Math.min(r == null ? 3 : r, Math.abs(w) / 2, Math.abs(h) / 2)
      g.moveTo(x + q, y); g.arcTo(x + w, y, x + w, y + h, q); g.arcTo(x + w, y + h, x, y + h, q); g.arcTo(x, y + h, x, y, q); g.arcTo(x, y, x + w, y, q); g.closePath()
    }
  }
  /* chunky two-tone solid: dark base, lit shape shifted up-left inside it, thick dark outline */
  function S (c, fn, col, o) {
    o = o || {}; col = K(c, col); var g = c.g, d = o.d == null ? 2.4 : o.d
    g.beginPath(); fn(g); g.fillStyle = sh(col, -.3); g.fill()
    g.save(); g.beginPath(); fn(g); g.clip(); g.translate(-d, -d * .8); g.beginPath(); fn(g); g.fillStyle = col; g.fill(); g.restore()
    if (!o.nol) { g.beginPath(); fn(g); g.lineJoin = 'round'; g.lineWidth = o.lw || 2.3; g.strokeStyle = o.ol || ol(col); g.stroke() }
  }
  function F (c, fn, col) { var g = c.g; g.beginPath(); fn(g); g.fillStyle = K(c, col); g.fill() }
  function Ln (c, col, w, pts) { IS.art.line(c.g, K(c, col), w, pts) }
  function Lm (c, col, w, pts) { col = K(c, col); IS.art.line(c.g, ol(col), w + 2.7, pts); IS.art.line(c.g, col, w, pts) }
  function Ou (c, fn, col, w) { var g = c.g; g.beginPath(); fn(g); g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = w || 2; g.strokeStyle = K(c, col); g.stroke() }
  function stitch (c, x1, y1, x2, y2, n, col) {
    var dx = x2 - x1, dy = y2 - y1, l = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / l * 2.4, ny = dx / l * 2.4
    Ln(c, col || '#2b2028', 1.4, [x1, y1, x2, y2])
    for (var i = 0; i <= n; i++) { var px = x1 + dx * i / n, py = y1 + dy * i / n; Ln(c, col || '#2b2028', 1.3, [px - nx, py - ny, px + nx, py + ny]) }
  }
  function glow (c, x, y, r, col, a) { var g = c.g, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, al(col, a == null ? .5 : a)); gr.addColorStop(1, al(col, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2) }
  function rnd (i) { return IS.art.rnd(i) }

  function facing (v) {
    if (!v || (!v.x && !v.y)) return { f: 'd', sx: 1 }
    var ax = Math.abs(v.x), ay = Math.abs(v.y)
    if (ax > ay * 1.05) return { f: 's', sx: v.x < 0 ? -1 : 1 }
    return { f: v.y < 0 ? 'u' : 'd', sx: 1 }
  }
  function headPath (shape, hw, hh) {
    if (shape === 'square') return R(-hw, -hh, hw * 2, hh * 2, hw * .38)
    if (shape === 'pear') return Q([-hw * .62, -hh, hw * .62, -hh, hw * .98, -hh * .1, hw * .86, hh * .78, 0, hh * 1.04, -hw * .86, hh * .78, -hw * .98, -hh * .1])
    if (shape === 'jaw') return Q([-hw, -hh * .85, 0, -hh * 1.05, hw, -hh * .85, hw * .9, hh * .2, hw * .4, hh * .95, -hw * .4, hh * .95, -hw * .9, hh * .2])
    if (shape === 'skull') return Q([-hw * .95, -hh * .3, -hw * .7, -hh * .95, 0, -hh * 1.05, hw * .7, -hh * .95, hw * .95, -hh * .3, hw * .8, hh * .5, hw * .5, hh * .95, -hw * .5, hh * .95, -hw * .8, hh * .5])
    if (shape === 'tall') return E(0, 0, hw * .84, hh * 1.1)
    return E(0, 0, hw, hh)
  }

  /* ---------------------------------------------------------------- face */
  function eye (c, x, y, r, st) {
    var p = c.p, lx = c.look.x * r * .28, ly = c.look.y * r * .2, ec = p.eye || '#2c3a40'
    if (c.blink && st !== 'hollow' && st !== 'glow') { Ln(c, '#2a1a1c', 1.8, [x - r * .8, y + .5, x + r * .8, y + .5]); return }
    if (st === 'dot') { F(c, E(x, y, r * .78, r * .95), '#120b0e'); F(c, E(x - r * .22, y - r * .3, r * .24, r * .24), '#ffffff'); return }
    if (st === 'hollow') { F(c, E(x, y, r * .95, r * 1.12), '#0d0709'); F(c, E(x + lx * .5, y + ly * .5, r * .34, r * .34), ec); return }
    if (st === 'glow') { glow(c, x, y, r * 2.6, ec, .45); F(c, E(x, y, r * .9, r * 1.05), '#0d0709'); F(c, E(x + lx * .4, y + ly * .4, r * .55, r * .62), ec); F(c, E(x - r * .15, y - r * .2, r * .18, r * .18), '#fff'); return }
    if (st === 'slit') { S(c, E(x, y, r, r * .85), '#e6c850', { lw: 1.7, d: 1 }); F(c, P([x + lx * .4, y - r * .8, x + r * .22 + lx * .4, y, x + lx * .4, y + r * .8, x - r * .22 + lx * .4, y]), '#150a0c'); return }
    S(c, E(x, y, r, r * 1.08), p.sclera || '#f3ecdf', { lw: 1.7, d: 1 })
    F(c, E(x + lx, y + ly, r * .66, r * .72), ec); F(c, E(x + lx, y + ly, r * .36, r * .4), '#120b0e'); F(c, E(x + lx - r * .2, y + ly - r * .26, r * .2, r * .2), '#fff')
    if (st === 'sleepy' || c.shoot) {
      var g = c.g, ly2 = y - r * (st === 'sleepy' ? .02 : .38)
      g.save(); g.beginPath(); E(x, y, r, r * 1.08)(g); g.clip(); F(c, R(x - r - 1, y - r * 1.3, r * 2 + 2, ly2 - (y - r * 1.3), 0), p.lid || p.skin); g.restore()
      Ln(c, '#2a1a1c', 1.6, [x - r, ly2, x + r, ly2])
    }
  }
  function drawFace (c) {
    var s = c.spec, fc = s.face || {}, side = c.f === 's', hw = c.hw, hh = c.hh, p = c.p
    var ey = hh * (fc.ey == null ? .1 : fc.ey), er = fc.er || 3.7, st = fc.eyes || 'round', ex = [], i
    var fx = c.look.x * 1.6, fy = c.look.y * .8
    if (fc.one) ex = [side ? hw * .5 : fx * .5]
    else if (side) ex = [hw * .22, hw * .62]
    else ex = [-hw * (fc.sep || .42) + fx, hw * (fc.sep || .42) + fx]
    if (st !== 'none') for (i = 0; i < ex.length; i++) eye(c, ex[i], ey + fy, er * (side && i === 0 ? .85 : 1) * (fc.one ? 1.7 : 1), st)
    if (fc.brow !== false && st !== 'none' && !fc.one && !c.blink) {
      var bc = fc.brc || p.hair || '#2a1c1c', by = ey + fy - er - 2.6, tilt = c.shoot ? 2.2 : (fc.bt || 0)
      for (i = 0; i < ex.length; i++) {
        var q = side ? 1 : (i ? 1 : -1)
        Ln(c, bc, 2, [ex[i] - er * .95, by + q * tilt, ex[i] + er * .95, by - q * tilt])
      }
    }
    var mx = side ? hw * .55 : fx * .8, my = hh * (fc.my == null ? .58 : fc.my), mc = fc.mc || '#3a1418'
    if (fc.nose !== false && !fc.one) { if (side) S(c, E(hw * .92, ey + er * .9, 2.2, 2.4), p.skin, { lw: 1.6, d: 1 }); else F(c, E(fx * .7, ey + er * 1.55, 1.5, 1), al('#3a2018', .45)) }
    if (fc.mouth === 'none') { /* nothing */ } else if (c.shoot) {
      S(c, E(mx, my, 3.4, 3.6), mc, { lw: 1.6, d: 0, ol: '#1a0a0c' }); F(c, E(mx, my + 1.6, 2, 1.4), '#b8505c')
    } else if (fc.mouth === 'smile') Ln(c, '#3a1a1c', 1.7, [mx - 3.4, my - .5, mx, my + 1.6, mx + 3.4, my - .5])
    else if (fc.mouth === 'frown') Ln(c, '#3a1a1c', 1.7, [mx - 3.2, my + 1, mx, my - .6, mx + 3.2, my + 1])
    else if (fc.mouth === 'fang') { Ln(c, '#3a1a1c', 1.7, [mx - 4, my, mx + 4, my]); F(c, P([mx - 3, my, mx - 1.2, my, mx - 2.1, my + 3.2]), '#f4ecd8'); F(c, P([mx + 1.2, my, mx + 3, my, mx + 2.1, my + 3.2]), '#f4ecd8') }
    else Ln(c, '#3a1a1c', 1.7, [mx - 2.8, my, mx + 2.8, my])
    if (fc.blush) { F(c, E(side ? hw * .35 : -hw * .68 + fx, ey + er * 2.1, 3, 1.8), al(fc.blush, .5)); if (!side) F(c, E(hw * .68 + fx, ey + er * 2.1, 3, 1.8), al(fc.blush, .5)) }
  }

  /* ---------------------------------------------------------------- head */
  function drawHead (c) {
    var s = c.spec, hd = s.head || {}, g = c.g, hf = c.hf, f = hf.f, side = f === 's'
    var hw = hd.hw || 14, hh = hd.hh || 16
    c.f = f; c.hw = side ? hw * .9 : hw; c.hh = hh
    var hy = (hd.y == null ? -26 : hd.y) - c.bob * .7 - (c.shoot ? 1 : 0)
    g.save(); g.translate(c.lean * .6 + (f === 'd' ? c.look.x * 1.4 : 0), hy + (f === 'd' ? c.look.y * .8 : 0))
    if (side && hf.sx < 0) g.scale(-1, 1)
    if (f === 'd') g.rotate(c.look.x * .05 + (c.moving ? Math.sin(c.ph) * .03 : 0))
    var hook = s.hd, shape = headPath(hd.shape || 'round', c.hw, hh)
    c.hp = shape
    if (hook) hook(c, 0)
    if (!hd.none) S(c, shape, c.p.skin)
    if (f === 'u' && !hd.none) { var bk = c.p[s.back || 'hair']; if (bk) S(c, shape, bk) }
    if (hook) hook(c, 1)
    if (f !== 'u' && !hd.none && !(s.face && s.face.none)) drawFace(c)
    if (hook) hook(c, 2)
    g.restore()
  }

  /* ---------------------------------------------------------------- body */
  function torsoPts (tw, bw, top, bot) {
    var mid = (top + bot) / 2, w2 = tw + (bw - tw) * .5
    return [-tw, top + 1.5, 0, top - 1.8, tw, top + 1.5, w2, mid, bw, bot - 2, bw * .8, bot + .6, -bw * .8, bot + .6, -bw, bot - 2, -w2, mid]
  }
  function drawLegs (c) {
    var s = c.spec, b = s.body || {}, l = s.legs || {}, t = l.t || 'boots', side = c.f === 's', p = c.p
    var bot = b.bot || 26, y0 = bot - 5, y1 = 43, w = l.w || 5.4, a = c.moving ? Math.sin(c.ph) : 0, hipx = (b.bw || 12) * .42
    if (t === 'none' || t === 'float') return
    var col = p.pants || p.skin, boot = p.boot || '#3a2c26'
    for (var i = 0; i < 2; i++) {
      var q = i ? 1 : -1, lift, x, fx, ph = c.ph + (i ? Math.PI : 0)
      if (side) { x = c.moving ? Math.sin(ph) * 5.5 : (i ? 2.2 : -2.2); lift = c.moving ? Math.max(0, Math.cos(ph)) * 3 : 0; fx = x + 2.4 }
      else { x = q * hipx; lift = c.moving ? Math.max(0, q * a) * 3.4 : 0; fx = x }
      var fy = y1 - lift - 1.5, my = (y0 + fy) / 2 + 1
      if (t === 'bones') { Lm(c, p.bone || col, 3, [x * .6, y0, x, my, x, fy]); S(c, E(x, my, 2.4, 2.2), p.bone || col, { lw: 1.6, d: 1 }); S(c, E(fx + (side ? 1 : 0), fy + 1.6, 4.4, 2.5), p.bone || col, { lw: 1.8, d: 1 }) }
      else if (t === 'mech') { S(c, R(x - 3.2, y0, 6.4, fy - y0 - 1, 1.5), col, { lw: 2 }); S(c, R(fx - 5, fy - 3, 10, 5.5, 2), boot, { lw: 2 }) }
      else if (t === 'bare') { Lm(c, col, w, [x, y0, x, fy]); S(c, E(fx, fy + 1.2, 4.4, 2.6), col, { lw: 1.8, d: 1 }) }
      else { Lm(c, col, w, [x, y0, x, fy - 2]); S(c, E(fx + (side ? 1.2 : 0), fy + .8, side ? 5.8 : 5, 3.4), boot, { lw: 2, d: 1.4 }) }
    }
  }
  /* front/back arms (and raised arms for any facing) */
  function drawArms (c, raised) {
    var s = c.spec, b = s.body || {}, p = c.p, side = c.f === 's'
    var tw = b.tw || 11, top = b.top == null ? -12 : b.top, sl = p.sleeve || p.cloth || p.skin, hc = p.hand || p.skin
    if (b.noarms) return
    var a = c.moving ? Math.sin(c.ph) : 0
    for (var i = 0; i < 2; i++) {
      var q = i ? 1 : -1, sx = q * (tw + 1), sy = top + 5, hx, hy, ex, ey
      if (raised) { sx = side ? q * 2 : sx; hx = q * 7; hy = -50 + Math.sin(c.T * 6) * .5; ex = q * ((s.head && s.head.hw || 14) + 4); ey = -30 }
      else { hx = q * (tw + 3.4); hy = top + 22 - (c.moving ? Math.max(0, q * a) * 1.5 : 0) - (c.shoot ? 3 : 0); ex = q * (tw + 3); ey = (sy + hy) / 2 }
      Lm(c, sl, b.aw || 5, [sx, sy, ex, ey, hx, hy]); S(c, E(hx, hy + (raised ? -1 : 1.2), 3.2, 3.2), hc, { lw: 1.9, d: 1 })
    }
  }
  function sideArm (c, i) {
    var b = c.spec.body || {}, p = c.p, top = b.top == null ? -12 : b.top, sl = p.sleeve || p.cloth || p.skin, hc = p.hand || p.skin, a = c.moving ? Math.sin(c.ph) : 0
    if (b.noarms) return
    var q = i ? 1 : -1, hx = q * a * 5.5 + (c.shoot && i ? 2 : 0), hy = top + 22 - (c.shoot && i ? 3 : 0), sy = top + 5, far = !i
    Lm(c, far ? sh(sl, -.18) : sl, b.aw || 5, [0, sy, hx * .5 + .5, (sy + hy) / 2, hx, hy]); S(c, E(hx, hy + 1.2, 3.2, 3.2), far ? sh(hc, -.15) : hc, { lw: 1.9, d: 1 })
  }
  function drawBody (c, arms) {
    var s = c.spec, b = s.body || {}, g = c.g, bf = c.bf, f = bf.f, side = f === 's', hook = s.bd
    var tw = (b.tw || 11) * (side ? .78 : 1), bw = (b.bw || 12) * (side ? .78 : 1), top = b.top == null ? -12 : b.top, bot = b.bot || 26
    c.f = f; c.tw = tw; c.bw = bw; c.top = top; c.bot = bot
    var fl = s.fly ? Math.sin(c.T * 3.2) * 2 - 2 : 0
    g.save(); if (side && bf.sx < 0) g.scale(-1, 1)
    if (arms) { g.translate(0, -c.bob + fl); drawArms(c, true); g.restore(); return }
    g.translate(0, fl)
    if (hook) hook(c, 0)
    drawLegs(c)
    g.translate(0, -c.bob)
    var breathe = 1 + (c.moving ? 0 : Math.sin(c.T * 2.3) * .018)
    g.translate(0, bot); g.scale(1, breathe); g.translate(0, -bot)
    if (side && !c.hold) sideArm(c, 0)
    if (b.torso) b.torso(c, tw, bw, top, bot)
    else {
      var pts = torsoPts(tw, bw, top, bot), tcol = c.p[b.col || 'cloth']
      if (b.rag) {
        var n = b.rag, hp = [], i
        for (i = 0; i <= n; i++) hp.push(bw - bw * 2 * i / n, bot + (i % 2 ? 4.5 : .8))
        S(c, P(pts.slice(0, 8).concat([bw, bot - 2]).concat(hp).concat([-bw, bot - 2, -tw - (bw - tw) * .5, (top + bot) / 2])), tcol, { d: 2.6 })
      } else S(c, Q(pts), tcol, { d: 2.8 })
    }
    if (hook) hook(c, 1)
    if (!c.hold) { if (side) sideArm(c, 1); else drawArms(c, false) }
    if (hook) hook(c, 2)
    g.restore()
  }

  /* ---------------------------------------------------------------- figure */
  var FEET = 43, BODY_S = .7, HEAD_S = 1.4
  function figure (g, spec, c0) {
    var c = Object.assign({}, c0); c.g = g; c.spec = spec; c.p = c0.tint ? Object.assign({}, spec.pal, { skin: c0.tint }) : spec.pal
    if (spec.group) {
      spec.group.forEach(function (m, i) {
        g.save(); g.translate(m.x, 43 * (1 - m.s) + (m.y || 0)); g.scale(m.s, m.s)
        if (m.a != null) g.globalAlpha *= m.a
        var c2 = Object.assign({}, c0); c2.ph = c0.ph + i * 1.7; c2.T = c0.T + i * .6
        figure(g, D[m.id], c2); g.restore()
      })
      return
    }
    if (spec.alpha) g.globalAlpha *= spec.alpha
    c.blink = ((c.T + 1.5 + (spec.seed || 0)) % 3.7) < .13
    if (spec.pre) spec.pre(c)
    // in-game figures use big-head proportions: the body squashes toward the feet and the head
    // grows about the neck, so the overall height stays the same. Portraits keep the drawn shape.
    var chibi = !c.portrait, neck = (spec.body && spec.body.top != null) ? spec.body.top : -12
    var neckTo = FEET - (FEET - neck) * BODY_S
    if (chibi) { g.save(); g.translate(0, FEET); g.scale(1, BODY_S); g.translate(0, -FEET) }
    drawBody(c)
    if (chibi) { g.restore(); g.save(); g.translate(0, neckTo); g.scale(HEAD_S, HEAD_S); g.translate(0, -neck) }
    drawHead(c)
    if (c.hold) drawBody(c, true)
    if (chibi) g.restore()
    if (spec.post) spec.post(c)
  }

  function draw (g, size, t, id, opt) {
    var Ak = IS.art; if (!Ak) return
    t = t || {}; Ak.begin(t)
    var run = IS.state && IS.state.run, p = run && run.player
    if (p && p.charId !== id) p = null
    var T = Ak.T
    var hd = t.headDir && (t.headDir.x || t.headDir.y) ? t.headDir : (p && p.head && (p.head.x || p.head.y) ? p.head : null)
    var spd = p ? Math.abs(p.vx || 0) + Math.abs(p.vy || 0) : 0
    var wd = t.walkDir && (t.walkDir.x || t.walkDir.y) ? t.walkDir : (spd > 20 ? { x: p.vx, y: p.vy } : null)
    var wt = t.walkT != null ? t.walkT : (p && p.walkT)
    var moving = wt != null ? wt > 0 : spd > 20
    if (opt && opt.still) moving = false
    if (!hd) hd = wd || { x: 0, y: 1 }
    var hl = Math.hypot(hd.x, hd.y) || 1
    var shoot = t.shooting != null ? !!t.shooting : !!(p && p.head && (p.head.x || p.head.y) && (p.nextShot || 0) > (((p.stats && p.stats.fireDelay) || .4) * .45))
    var c = { T: T, hurt: !!t.hurt, tint: t.hurt ? null : Ak.tint(t, null), look: { x: hd.x / hl, y: hd.y / hl }, hf: facing(hd), bf: facing(wd), moving: moving, ph: wt > 0 ? wt * 14 : T * 13, shoot: shoot, hold: !!t.holdItem, portrait: !!(opt && opt.portrait) }
    c.bob = moving ? Math.abs(Math.sin(c.ph)) * 2.4 : (Math.sin(T * 2.3) * .6 + .6)
    c.lean = moving ? Math.sin(c.ph) * 1.2 : 0
    g.save(); g.scale(size / 100, size / 100); g.lineJoin = 'round'
    figure(g, D[id] || D.isaac, c)
    g.restore()
  }

  function clipHead (c, fn) { var g = c.g; g.save(); g.beginPath(); c.hp(g); g.clip(); fn(); g.restore() }
  function sway (c, a, sp, ph) { return Math.sin(c.T * (sp || 2.4) + (ph || 0)) * a + (c.moving ? Math.sin(c.ph + (ph || 0)) * a * .7 : 0) }
  function patch (c, x, y, w, h, col) { S(c, R(x, y, w, h, 1.2), col, { lw: 1.5, d: 1 }); Ln(c, '#2b2028', 1, [x + 1.2, y + 1.2, x + w - 1.2, y + h - 1.2]); Ln(c, '#2b2028', 1, [x + w - 1.2, y + 1.2, x + 1.2, y + h - 1.2]) }

  /* ===== Isaac: a scruffy lantern-keeper in a patched, pointed hood ===== */
  D.isaac = {
    pal: { skin: '#e9ddcb', cloth: '#5b7552', cloth2: '#a16f3a', hair: '#c4602c', eye: '#2d4650', boot: '#3b2a22', pants: '#4b4036' },
    head: { shape: 'pear', hw: 12.5, hh: 14.5 }, back: 'cloth', face: { er: 3.5, brc: '#8a4a22', blush: '#d88a7a' },
    body: { tw: 10, bw: 14.5, bot: 29, rag: 5 },
    hd: function (c, L) {
      var hw = c.hw, hh = c.hh, side = c.f === 's', u = c.f === 'u', p = c.p, sw = Math.sin(c.T * 2) * 1.2 + (c.moving ? Math.sin(c.ph) * 2 : 0)
      if (L === 0) {
        S(c, E(side ? -2.2 : 0, -1, hw + 4, hh + 3.4), p.cloth, { d: 3 })
        S(c, P(side ? [-2, -hh - 2, -hw - 11 + sw, -hh - 7, -hw * .7 - 2, -hh + 5] : [-7, -hh - 2, 11 + sw, -hh - 10, 9, -hh + 4]), p.cloth, { d: 1.6 })
      } else if (L === 1) {
        if (u) { Ln(c, '#1b1317', 1.6, [0, -hh - 2, 0, hh * .55]); patch(c, -4.5, -hh * .35, 9, 7.5, p.cloth2); return }
        clipHead(c, function () {
          var o = side ? hw * .2 : 0
          S(c, P([-hw * .9 + o, -hh * .15, -hw * .9 + o, -hh * 1.1, hw * 1.1 + o, -hh * 1.1, hw * 1.1 + o, -hh * .2, hw * .55 + o, -hh * .62, hw * .25 + o, -hh * .12, -hw * .05 + o, -hh * .6, -hw * .35 + o, -hh * .15, -hw * .6 + o, -hh * .52]), p.hair, { lw: 1.8, d: 1.4 })
        })
      } else if (!u) F(c, E(side ? hw * .35 : -hw * .5, hh * .4, 3.2, 1.8), al('#3a3028', .38))
    },
    bd: function (c, L) {
      var tw = c.tw, bw = c.bw, p = c.p, side = c.f === 's'
      if (L === 1) {
        if (!side) { patch(c, -bw * .72, 9, 8, 7, p.cloth2); patch(c, bw * .12, 15, 7, 6.5, '#7d4a34') } else patch(c, -2, 10, 7, 7, p.cloth2)
        S(c, R(-tw - 1, 3.5, tw * 2 + 2, 4, 1.6), '#7a5a34', { lw: 1.6, d: 1 }); S(c, E(side ? 2 : -3, 6, 2.6, 2.6), '#a8844c', { lw: 1.5, d: 1 })
      } else if (L === 2) {
        var lx = side ? bw * .3 : bw * .92, sw = sway(c, 1.2, 2.8), ly = 17
        Ln(c, '#2b2028', 1.4, [lx, 7, lx + sw * .4, ly]); glow(c, lx + sw * .4, ly + 5, 12, p.lamp || '#ffe2a0', .45)
        S(c, R(lx - 3 + sw * .4, ly, 6, 8, 1.6), p.lamp || '#efe2ae', { lw: 1.6, d: 1 }); F(c, R(lx - 1.4 + sw * .4, ly + 1.8, 2.8, 4.2, 1), '#fff6cc'); Ln(c, '#4a3a2a', 1.5, [lx - 3 + sw * .4, ly, lx + 3 + sw * .4, ly])
      }
    }
  }

  /* ===== Magdalene: rose shawl, cream kerchief, a long auburn braid ===== */
  D.magdalene = {
    pal: { skin: '#e8c6ab', cloth: '#b4586e', cloth2: '#f0dccb', hair: '#74391f', eye: '#4a3626', boot: '#5a3a30', pants: '#6a4a40' },
    head: { shape: 'round', hw: 14.5, hh: 14.5 }, back: 'hair', face: { er: 3.6, blush: '#e0707e', my: .56 },
    body: { tw: 12, bw: 16, bot: 27, aw: 5.5 },
    hd: function (c, L) {
      var hw = c.hw, hh = c.hh, side = c.f === 's', u = c.f === 'u', p = c.p
      if (L === 0) {
        S(c, Q([-hw - 3, -hh * .2, -hw * .7, -hh - 2, hw * .7, -hh - 2, hw + 3, -hh * .2, hw + 2, hh + 8, 0, hh + 3, -hw - 2, hh + 8]), p.hair, { d: 3 })
        var bx = side ? -hw * .6 : hw * .9, sw = sway(c, 1.5, 2.2)
        S(c, Q([bx - 3, hh * .5, bx + 3, hh * .5, bx + 4 + sw, hh + 14, bx + sw, hh + 22, bx - 4 + sw, hh + 14]), sh(p.hair, .06), { d: 1.6 })
        S(c, R(bx - 3 + sw * .6, hh + 11, 6, 3, 1), '#c43a52', { lw: 1.4, d: 1 })
      } else if (L === 1) {
        if (u) { S(c, Q([-hw - 1, -hh * .6, 0, -hh * 1.1, hw + 1, -hh * .6, hw * .6, hh * .1, -hw * .6, hh * .1]), p.cloth2, { d: 1.6 }); Ln(c, '#2b2028', 1.2, [-hw * .6, -hh * .1, hw * .6, -hh * .1]); return }
        clipHead(c, function () {
          S(c, P([-hw - 2, -hh * .1, -hw - 2, -hh - 2, hw + 2, -hh - 2, hw + 2, -hh * .1, hw * .7, -hh * .38, hw * .25, -hh * .12, -hw * .1, -hh * .42, -hw * .5, -hh * .16, -hw * .75, -hh * .4]), p.hair, { d: 1.4 })
          S(c, R(-hw - 2, -hh * .62, hw * 2 + 4, 5.2, 1), p.cloth2, { lw: 1.7, d: 1 })
        })
      } else if (!u) {
        var kx = side ? -hw * .85 : -hw - 1, sw2 = sway(c, 1.2, 3)
        S(c, P([kx, -hh * .55, kx - 7, -hh * .75 + sw2, kx - 5, -hh * .4, kx - 8 + sw2, -hh * .15, kx, -hh * .38]), p.cloth2, { lw: 1.6, d: 1 })
        IS.art.heart(c.g, side ? hw * .3 : hw * .55, -hh * .57, 2.6, 3, K(c, '#c4344a'), { ol: ol('#c4344a') })
      }
    },
    bd: function (c, L) {
      var tw = c.tw, bw = c.bw, top = c.top, p = c.p, side = c.f === 's'
      if (L === 1) {
        S(c, P([-bw - 1, bot0(c) - 8, bw + 1, bot0(c) - 8, bw + 2, c.bot + 1, -bw - 2, c.bot + 1]), '#8f4458', { lw: 1.8, d: 1.6 })
        S(c, Q([-tw - 3, top + 1, tw + 3, top + 1, tw * .7, top + 14, 0, top + 20, -tw * .7, top + 14]), p.cloth2, { d: 2 })
        for (var i = -2; i <= 2; i++) Ln(c, '#2b2028', 1, [i * 3.4, top + 6, i * 2.2, top + 15])
        if (!side) IS.art.heart(c.g, 0, top + 10, 3.2, 3.8, K(c, '#c4344a'), { ol: ol('#c4344a') })
      }
    }
  }
  function bot0 (c) { return c.bot }

  /* ===== Cain: lanky, aviator cap, a single big eye, red scarf, rabbit foot ===== */
  D.cain = {
    pal: { skin: '#d9b293', cloth: '#6b4a2e', cloth2: '#c9a152', hair: '#3a2616', eye: '#6fb04a', boot: '#3a2a1e', pants: '#4a3a30', scarf: '#aa3a2a' },
    head: { shape: 'square', hw: 12.5, hh: 14 }, back: 'cloth2', face: { one: true, er: 3.2, brow: false, mouth: 'smile', nose: false, my: .6 },
    body: { tw: 8.5, bw: 10, bot: 27, aw: 4.4 }, legs: { w: 4.4 },
    hd: function (c, L) {
      var hw = c.hw, hh = c.hh, side = c.f === 's', u = c.f === 'u', p = c.p
      if (L === 0) {
        if (!side) { S(c, Q([-hw - 5, -hh * .3, -hw - 1, -hh * .5, -hw - 1, hh * .6, -hw - 5, hh * .5]), '#5a3e26', { lw: 1.8, d: 1.2 }); S(c, Q([hw + 5, -hh * .3, hw + 1, -hh * .5, hw + 1, hh * .6, hw + 5, hh * .5]), '#5a3e26', { lw: 1.8, d: 1.2 }) }
        else S(c, Q([-hw * .6, -hh * .3, hw * .2, -hh * .3, hw * .3, hh * .5, -hw * .5, hh * .65]), '#5a3e26', { lw: 1.8, d: 1.2 })
      } else if (L === 1) {
        clipHead(c, function () {
          S(c, R(-hw - 2, -hh - 3, hw * 2 + 4, u ? hh * 2 + 6 : hh * .95, 4), '#6b4a2e', { d: 2 })
          if (!u) { Ln(c, '#2b2028', 1.4, [-hw, -hh * .1, hw, -hh * .1]); Ln(c, '#8a6a3a', 1, [-hw, -hh * .02, hw, -hh * .02]) }
        })
        if (u) { Ln(c, '#2b2028', 1.4, [0, -hh, 0, hh * .6]); S(c, R(-4, hh * .3, 8, 4, 1), p.cloth2, { lw: 1.4, d: .8 }) }
      } else if (!u) {
        S(c, R(side ? hw * .3 - 3.5 : -3.5, -hh * .85, 7, 4.6, 1.6), p.cloth2, { lw: 1.6, d: 1 }); F(c, E(side ? hw * .3 : 0, -hh * .85 + 2.3, 1.2, 1.2), '#2b2028')
        F(c, R(-hw * .7 + (side ? hw * .5 : 0), hh * .62, 5, 1.6, 0), al('#2a1a14', .55))
      }
    },
    bd: function (c, L) {
      var tw = c.tw, top = c.top, p = c.p, side = c.f === 's', sw = sway(c, 2, 3.4)
      if (L === 0 && c.f === 'u') S(c, Q([-3, top, 3, top, 5 + sw, top + 24, 0 + sw, top + 30, -5 + sw, top + 24]), p.scarf, { d: 1.8 })
      if (L === 1) { S(c, R(-tw, 8, tw * 2, 3.6, 1.4), '#2b2028', { lw: 1.4, d: 0 }); S(c, R(-2, 7.6, 4, 4.4, 1), p.cloth2, { lw: 1.4, d: .8 }); Ln(c, '#8a6a3a', 1.2, [0, top + 4, 0, 7.6]) }
      if (L === 2) {
        S(c, E(0, top + 1, tw + 1.5, 4), p.scarf, { d: 1.6 })
        if (c.f !== 'u') S(c, Q([side ? -3 : -tw, top + 2, side ? 2 : -tw + 5, top + 2, (side ? 0 : -tw + 4) + sw, top + 17, (side ? -5 : -tw - 1) + sw, top + 24, (side ? -9 : -tw - 4) + sw, top + 15]), p.scarf, { d: 1.8 })
        var fx = side ? 3 : tw + 1.5
        Ln(c, '#8a6a3a', 1.2, [fx, 11, fx + sw * .2, 16]); S(c, E(fx + sw * .2, 19.5, 2.4, 4.4, .2), '#e8e0d4', { lw: 1.5, d: 1 }); S(c, R(fx - 1.6 + sw * .2, 14.6, 3.2, 2.4, .8), p.cloth2, { lw: 1.2, d: 0 })
      }
    }
  }

  /* ===== Judas: tall pale face, slicked hair, black coat with crimson lapels ===== */
  D.judas = {
    pal: { skin: '#e4d1c0', cloth: '#2b2029', cloth2: '#8e1c2c', hair: '#15111a', eye: '#d0a030', boot: '#1a1316', pants: '#241b22' },
    head: { shape: 'jaw', hw: 12.5, hh: 16 }, back: 'hair', face: { eyes: 'sleepy', er: 3.3, mouth: 'smile', brc: '#15111a', bt: -.8, my: .62 },
    body: { tw: 10.5, bw: 15.5, bot: 31 }, legs: { w: 4.8 },
    hd: function (c, L) {
      var hw = c.hw, hh = c.hh, side = c.f === 's', u = c.f === 'u', p = c.p
      if (L === 1 && !u) clipHead(c, function () { var o = side ? -hw * .2 : 0; S(c, P([-hw - 1 + o, hh * -.05, -hw - 1 + o, -hh - 2, hw + 2 + o, -hh - 2, hw + 2 + o, -hh * .05, hw * .62 + o, -hh * .5, 0 + o, -hh * .12, -hw * .6 + o, -hh * .5]), p.hair, { d: 1.4 }) })
      if (L === 0) S(c, P([-hw - 1, -hh * .5, -hw - 3, hh * .5, -hw * .4, hh * .2, hw * .4, hh * .2, hw + 3, hh * .5, hw + 1, -hh * .5]), p.hair, { d: 1.4 })
      if (L === 2 && !u) F(c, E(side ? hw * .35 : 0, hh * .8, 2, 1), '#8a5a50')
    },
    bd: function (c, L) {
      var tw = c.tw, bw = c.bw, top = c.top, p = c.p, side = c.f === 's'
      if (L === 1) {
        if (c.f === 'u') { Ln(c, '#120d12', 1.5, [0, top + 4, 0, c.bot]) } else {
          S(c, P([-tw * .55, top, -tw * .15, top, tw * .3, c.bot - 2, -tw * .1, c.bot - 2]), p.cloth2, { lw: 1.6, d: 1 }); S(c, P([tw * .55, top, tw * .15, top, -tw * .3, c.bot - 2, tw * .1, c.bot - 2]), p.cloth2, { lw: 1.6, d: 1 })
        }
        S(c, R(-tw - 1, 9, tw * 2 + 2, 3.4, 1), '#120d12', { lw: 1.4, d: 0 }); F(c, R(-1.6, 9, 3.2, 3.4, .5), '#c0a050')
      }
      if (L === 2) { S(c, P([-tw - 2, top + 3, -tw * .5, top - 6, -tw * .15, top + 1, -tw * .5, top + 5]), p.cloth, { lw: 1.6, d: 1 }); S(c, P([tw + 2, top + 3, tw * .5, top - 6, tw * .15, top + 1, tw * .5, top + 5]), p.cloth, { lw: 1.6, d: 1 }) }
    }
  }

  /* ===== ???: a pale-blue sleepyhead in a long gown and a drooping nightcap ===== */
  D['blue-baby'] = {
    pal: { skin: '#86a4c2', cloth: '#d0d4e6', cloth2: '#4a5784', hair: '#e8e2f2', eye: '#0d0c16', boot: '#46527a', sclera: '#e8ecf6' },
    head: { shape: 'round', hw: 12.5, hh: 12.5, y: -24 }, back: 'cloth2', face: { eyes: 'dot', er: 4.6, mouth: 'none', brow: false, nose: false, blush: '#c07ab0', ey: .18 },
    body: { tw: 9, bw: 17, bot: 37, rag: 6, aw: 6.5 }, legs: { t: 'none' },
    hd: function (c, L) {
      var hw = c.hw, hh = c.hh, side = c.f === 's', u = c.f === 'u', p = c.p, sw = sway(c, 2, 2.6)
      if (L === 1 && !u) { F(c, E(side ? hw * .35 : 0, hh * .5, 2.2, 1.6), '#1a1020'); clipHead(c, function () { S(c, R(-hw - 2, -hh - 2, hw * 2 + 4, hh * .62, 2), p.cloth2, { lw: 1.6, d: 1.2 }) }) }
      if (L === 2) {
        var o = side ? -hw * .5 : 0
        if (!u) S(c, R(-hw - 2 + (side ? -1 : 0), -hh * .5, hw * 2 + 4, 4.4, 2), '#f0f0ff', { lw: 1.6, d: 1 })
        S(c, Q([-hw * .9 + o, -hh * .5, hw * .9 + o, -hh * .5, hw * .5 + o, -hh - 8, hw * .6 + sw * .4 + o + 8, -hh - 7 + sw * .3, hw + 6 + sw + o, -hh + 2 + sw * .4, hw * .2 + o, -hh - 2]), p.cloth2, { d: 1.8 })
        S(c, E(hw + 7 + sw + o, -hh + 3 + sw * .4, 3.6, 3.6), '#f0f0ff', { lw: 1.6, d: 1 })
      }
    },
    bd: function (c, L) {
      var bw = c.bw, top = c.top, p = c.p
      if (L === 0) { var q = c.moving ? Math.sin(c.ph) : 0; S(c, E(-5 + q * 2, 42, 4.6, 2.6), p.cloth2, { lw: 1.8, d: 1 }); S(c, E(5 - q * 2, 42, 4.6, 2.6), p.cloth2, { lw: 1.8, d: 1 }) }
      if (L === 1) { for (var i = -2; i <= 2; i++) Ln(c, p.cloth2, 2, [i * 5.4, top + 12, i * 6.8, c.bot - 1]); S(c, R(-bw * .5, top + 8, bw, 3.6, 1.4), p.cloth2, { lw: 1.5, d: .8 }) }
    }
  }

  /* ===== Eve: black bob, heavy fringe, thorn-trimmed dress, a crow on the shoulder ===== */
  D.eve = {
    pal: { skin: '#e5d0c5', cloth: '#261c27', cloth2: '#922434', hair: '#17111b', eye: '#7a2c34', boot: '#17111a', pants: '#2b2229' },
    head: { shape: 'round', hw: 13.5, hh: 15 }, back: 'hair', face: { er: 3.5, mouth: 'frown', brc: '#17111b', blush: '#a8404a', my: .6 },
    body: { tw: 8.5, bw: 14, bot: 30, rag: 5, aw: 4.4 }, legs: { w: 4.4 },
    hd: function (c, L) {
      var hw = c.hw, hh = c.hh, side = c.f === 's', u = c.f === 'u', p = c.p
      if (L === 0) S(c, Q([-hw - 3, -hh * .4, -hw * .6, -hh - 3, hw * .6, -hh - 3, hw + 3, -hh * .4, hw + 3.5, hh + 5, hw * .6, hh + 7, -hw * .6, hh + 7, -hw - 3.5, hh + 5]), p.hair, { d: 3 })
      if (L === 1 && !u) clipHead(c, function () {
        var o = side ? hw * .12 : 0
        S(c, P([-hw - 2 + o, 0, -hw - 2 + o, -hh - 2, hw + 2 + o, -hh - 2, hw + 2 + o, hh * .05, hw * .55 + o, -hh * .15, hw * .1 + o, -hh * .5, -hw * .2 + o, -hh * .15, -hw * .6 + o, hh * .35]), p.hair, { lw: 1.8, d: 1.4 })
      })
      if (L === 2 && !u) { var rx = side ? hw * .1 : hw * .7; S(c, E(rx, -hh * .62, 3.4, 3.4), '#b02a3e', { lw: 1.6, d: 1 }); F(c, E(rx, -hh * .62, 1.2, 1.2), '#6a141f') }
    },
    bd: function (c, L) {
      var tw = c.tw, bw = c.bw, top = c.top, p = c.p, side = c.f === 's', sw = sway(c, 1.2, 4)
      if (L === 1) {
        Ou(c, function (g) { g.moveTo(-bw + 1, c.bot - 1); for (var i = 1; i <= 8; i++) g.lineTo(-bw + 1 + (bw * 2 - 2) * i / 8, c.bot - 1 + (i % 2 ? -2.4 : 0)) }, p.cloth2, 1.8)
        S(c, R(-tw, 5, tw * 2, 3.2, 1), p.cloth2, { lw: 1.4, d: 0 })
        if (!side) Ln(c, p.cloth2, 1.6, [-tw * .6, top + 1, 0, top + 9, tw * .6, top + 1])
      }
      if (L === 2) {
        var cx = side ? 1 : tw - 1, cy = top - 2 + sw * .2
        S(c, Q([cx - 5, cy + 1, cx - 2, cy - 4, cx + 4, cy - 3, cx + 6, cy + 2, cx + 2, cy + 5, cx - 3, cy + 5]), '#16121a', { lw: 1.8, d: 1 })
        S(c, P([cx + 5, cy - 1, cx + 10, cy + 0, cx + 5, cy + 2]), '#c0a040', { lw: 1.3, d: 0 }); Ln(c, '#fff', 1.2, [cx + 1.6, cy - 1.8, cx + 2.6, cy - 1.8]); Ln(c, '#bbb', 1.2, [cx - 6, cy + 3, cx - 11, cy + 6 + sw * .2])
      }
    }
  }

  /* ===== Samson: wild golden mane, big beard, bare chest, brass armbands ===== */
  D.samson = {
    pal: { skin: '#d9a47c', cloth: '#8c3a2a', cloth2: '#c8a24c', hair: '#b07a2c', eye: '#4a2c18', boot: '#5a3a22', pants: '#d9a47c', beard: '#8a5624' },
    head: { shape: 'square', hw: 15, hh: 15 }, back: 'hair', face: { er: 3.5, brc: '#6a4416', bt: .5, my: .66 },
    body: { tw: 15, bw: 13.5, bot: 25, col: 'skin', aw: 7.2 }, legs: { w: 7 },
    hd: function (c, L) {
      var hw = c.hw, hh = c.hh, side = c.f === 's', u = c.f === 'u', p = c.p
      if (L === 0) { var sw = sway(c, 1.5, 2); S(c, Q([-hw - 9, -hh * .2, -hw - 5, -hh - 6, -hw * .4, -hh - 11, hw * .4, -hh - 11, hw + 5, -hh - 6, hw + 9, -hh * .2, hw + 8, hh + 6 + sw, hw * .4, hh * .5, -hw * .4, hh * .5, -hw - 8, hh + 6 - sw]), p.hair, { d: 3.4 }) }
      if (L === 1 && !u) {
        clipHead(c, function () { S(c, P([-hw - 2, -hh * .1, -hw - 2, -hh - 3, hw + 2, -hh - 3, hw + 2, -hh * .1, hw * .6, -hh * .52, hw * .2, -hh * .28, -hw * .3, -hh * .58, -hw * .7, -hh * .3]), p.hair, { d: 1.4 }) })
        var o = side ? hw * .3 : 0
        S(c, Q([-hw + 1 + o, hh * .15, hw - 1 + o * 1.2, hh * .15, hw * .8 + o, hh * .8, 0 + o, hh + 3, -hw * .8 + o, hh * .8]), p.beard, { d: 2 }); Ln(c, '#3a2410', 1.5, [-hw * .4 + o, hh * .62, hw * .4 + o, hh * .62])
      }
      if (L === 2 && !u) { var m = side ? hw * .35 : 0; S(c, Q([-hw * .45 + m, hh * .36, hw * .45 + m, hh * .36, hw * .2 + m, hh * .52, -hw * .2 + m, hh * .52]), p.beard, { lw: 1.4, d: 1 }) }
    },
    bd: function (c, L) {
      var tw = c.tw, bw = c.bw, top = c.top, p = c.p, side = c.f === 's'
      if (L === 1) {
        if (c.f === 'd') { Ln(c, sh(p.skin, -.4), 1.6, [0, top + 4, 0, top + 14]); Ou(c, function (g) { g.moveTo(-tw + 3, top + 12); g.quadraticCurveTo(-tw * .45, top + 18, -1.5, top + 13); g.moveTo(tw - 3, top + 12); g.quadraticCurveTo(tw * .45, top + 18, 1.5, top + 13) }, sh(p.skin, -.45), 1.6) }
        S(c, P([-bw - 1, 12, bw + 1, 12, bw + 3, 27, -bw - 3, 27]), p.cloth, { d: 2 })
        S(c, R(-bw - 1, 8, bw * 2 + 2, 5.6, 1.6), '#5a3a22', { lw: 1.8, d: 1 }); S(c, R(-3.4, 8.3, 6.8, 5, 1.2), p.cloth2, { lw: 1.5, d: .8 })
      }
      if (L === 2 && !side) { S(c, R(-tw - 5.4, top + 12, 6.4, 3.6, 1.4), p.cloth2, { lw: 1.5, d: .8 }); S(c, R(tw - 1, top + 12, 6.4, 3.6, 1.4), p.cloth2, { lw: 1.5, d: .8 }) }
    }
  }

  /* ===== Azazel: red imp with bat wings, curled horns and a glowing maw ===== */
  D.azazel = {
    fly: true,
    pal: { skin: '#a32c32', cloth: '#26151a', cloth2: '#4c2029', hair: '#140c10', eye: '#ffb02e', pants: '#26151a', horn: '#2b1418', wing: '#2a161c' },
    head: { shape: 'jaw', hw: 13, hh: 15 }, back: 'skin', face: { eyes: 'glow', er: 3.4, mouth: 'fang', brow: false, my: .62 },
    body: { tw: 8.5, bw: 12, bot: 27, rag: 5, col: 'skin', aw: 4.6 }, legs: { t: 'float' },
    hd: function (c, L) {
      var hw = c.hw, hh = c.hh, p = c.p, g = c.g
      if (L === 0) { var fl = c.hf.f === 's' ? 0 : 1; IS.art.horn(g, -hw * .7, -hh * .7, -2.2, 18, 8, K(c, p.horn), -.5); if (fl) IS.art.horn(g, hw * .7, -hh * .7, -.94, 18, 8, K(c, p.horn), .5); else IS.art.horn(g, hw * .3, -hh * .8, -1.2, 14, 7, K(c, p.horn), .5) }
      if (L === 2 && c.shoot && c.f !== 'u') glow(c, c.f === 's' ? c.hw * .55 : 0, hh * .6, 14, '#ff4a20', .75)
      if (L === 1 && c.f !== 'u') { F(c, P([-hw * .35, -hh * .55, 0, -hh * .1, hw * .35, -hh * .55, 0, -hh * .8]), p.cloth) }
    },
    bd: function (c, L) {
      var top = c.top, p = c.p, g = c.g, wf = Math.sin(c.T * 5) * .18 + (c.moving ? .1 : 0)
      if (L === 0) {
        if (c.f !== 's') { IS.art.wing(g, -7, top + 8, 30, -2.5, K(c, p.wing), { dir: 1, flap: wf }); IS.art.wing(g, 7, top + 8, 30, -.64, K(c, p.wing), { dir: 1, flap: -wf }) } else IS.art.wing(g, -2, top + 8, 30, -2.45, K(c, p.wing), { dir: 1, flap: wf })
        var tw = sway(c, 3, 3); Lm(c, '#7a2228', 2.2, [0, 22, -7 + tw, 30, -4 + tw, 38, 4 + tw * 1.4, 38]); S(c, P([4 + tw * 1.4, 34, 11 + tw * 1.4, 38, 4 + tw * 1.4, 42]), '#7a2228', { lw: 1.5, d: 0 })
      }
      if (L === 1 && c.f !== 'u') { S(c, R(-c.tw, 4, c.tw * 2, 4, 1), p.cloth2, { lw: 1.5, d: .8 }); Ln(c, sh(p.skin, -.45), 1.4, [-3, top + 8, 0, top + 11, 3, top + 8]) }
    }
  }

  /* ===== Lazarus: linen-wrapped riser with a mop of hair and one bandaged eye ===== */
  D.lazarus = {
    pal: { skin: '#9aa88c', cloth: '#d4ccae', cloth2: '#8e8466', hair: '#5c4a38', eye: '#d6cf6a', boot: '#d4ccae', pants: '#8e9c82', lid: '#8a9a7e' },
    head: { shape: 'tall', hw: 14, hh: 15.5 }, back: 'hair', face: { eyes: 'sleepy', er: 3.4, mouth: 'frown', brc: '#5c4a38', blush: '#7e8c70' },
    body: { tw: 10, bw: 12.5, bot: 28, rag: 5 },
    hd: function (c, L) {
      var hw = c.hw, hh = c.hh, side = c.f === 's', u = c.f === 'u', p = c.p, sw = sway(c, 2, 2.4), dx = side ? -1 : 1
      if (L === 0) S(c, Q([dx * hw * .5, -hh * .3, dx * (hw + 4), -hh * .2, dx * (hw + 11) + sw, hh * .35 + sw, dx * (hw + 5) + sw, hh * .5, dx * hw * .7, hh * .1]), p.cloth, { lw: 1.6, d: 1 })
      if (L === 1) {
        S(c, P([-hw * .7, -hh * .6, -hw * .55, -hh - 5, -hw * .15, -hh - 1, hw * .05, -hh - 8, hw * .3, -hh - 1, hw * .65, -hh - 4, hw * .65, -hh * .6]), p.hair, { lw: 1.6, d: 1 })
        if (u) { clipHead(c, function () { S(c, R(-hw - 2, -hh * .3, hw * 2 + 4, 6, 0), p.cloth, { lw: 1.4, d: .8 }); S(c, R(-hw - 2, hh * .25, hw * 2 + 4, 6, 0), p.cloth, { lw: 1.4, d: .8 }) }); return }
        clipHead(c, function () {
          S(c, R(-hw - 2, -hh * .62, hw * 2 + 4, 6, 0), p.cloth, { lw: 1.6, d: 1 }); Ln(c, p.cloth2, 1, [-hw, -hh * .5, hw, -hh * .55])
          if (!side) { S(c, P([-hw - 2, -3.5, -hw * .08, -5.8, -hw * .08, 6.4, -hw - 2, 7.8]), p.cloth, { lw: 1.6, d: 1 }); Ln(c, p.cloth2, 1, [-hw, 0, -hw * .1, 0.5]) }
          else S(c, R(-hw - 2, hh * .5, hw * 2 + 4, 5, 0), p.cloth, { lw: 1.6, d: 1 })
        })
      }
    },
    bd: function (c, L) {
      var tw = c.tw, top = c.top, p = c.p, sw = sway(c, 2.4, 2.8)
      if (L === 1) {
        var g = c.g; g.save(); g.beginPath(); Q(torsoPts(tw, c.bw, top, c.bot))(g); g.clip()
        for (var i = 0; i < 5; i++) { Ln(c, p.cloth2, 1.4, [-tw - 3, top + 4 + i * 7.5, tw + 3, top + 9 + i * 7.5]) }
        g.restore(); S(c, Q([tw * .5, 14, tw * .9 + 3, 18, tw * 1.2 + sw, 33 + sw, tw * .5 + sw, 30, tw * .3, 20]), p.cloth, { lw: 1.5, d: 1 })
        S(c, P([-tw - 1, top + 4, tw + 1, top + 8, tw + 1, top + 12, -tw - 1, top + 8]), p.cloth, { lw: 1.4, d: 1 })
      }
    }
  }

  /* ===== Eden: a harlequin glitch in a three-pointed jester cap ===== */
  D.eden = {
    pal: { skin: '#ecd0ba', cloth: '#2aa79f', cloth2: '#d6368a', hair: '#e8c030', eye: '#5a3a8a', boot: '#2b2038', pants: '#e0b838', glitch: '#8ae04a' },
    head: { shape: 'round', hw: 13.5, hh: 14.5 }, back: 'cloth', face: { er: 3.6, brc: '#2b2038', mouth: 'smile', blush: '#d6368a' },
    body: { tw: 10, bw: 13, bot: 27, torso: function (c, tw, bw, top, bot) {
      var g = c.g, pts = torsoPts(tw, bw, top, bot), p = c.p
      S(c, Q(pts), p.cloth, { d: 2.8 })
      g.save(); g.beginPath(); Q(pts)(g); g.clip(); S(c, R(0, top - 4, bw + 4, bot - top + 10, 0), p.cloth2, { nol: true, d: 2.6 })
      for (var i = 0; i < 4; i++) { Ln(c, al('#1b1317', .45), 1.2, [-bw, top + i * 9, 0, top + 4.5 + i * 9]); Ln(c, al('#1b1317', .45), 1.2, [0, top + 4.5 + i * 9, bw, top + i * 9]) }
      g.restore(); Ou(c, Q(pts), ol(p.cloth), 2.3); Ln(c, '#1b1317', 1.6, [0, top, 0, bot])
    } },
    hd: function (c, L) {
      var hw = c.hw, hh = c.hh, side = c.f === 's', u = c.f === 'u', p = c.p, sw = sway(c, 3, 3), cols = [p.cloth, p.cloth2, p.pants]
      if (L === 2) {
        S(c, R(-hw - 1, -hh * .72, hw * 2 + 2, 7, 2), p.pants, { lw: 1.7, d: 1 })
        var pts = [[-hw * .9, -.8, -hw - 12, 12 + sw, 0], [-3, -1, -4 - sw * .4, -hh - 14, 1], [hw * .9, -.8, hw + 12, 12 - sw, 2]]
        for (var i = 0; i < 3; i++) {
          var a = pts[i], bx = a[0], tx = a[2], ty = a[3] < 0 ? a[3] : -hh - 4 + a[3] * -.0 - 6 + (a[3] > 0 ? 0 : 0)
          var tipY = i === 1 ? -hh - 14 : -hh * .35 + 8, tipX = i === 1 ? -4 - sw * .4 : tx
          S(c, Q([bx - 5, -hh * .7, bx + 5, -hh * .7, (bx + tipX) / 2 + 3, (-hh * .7 + tipY) / 2 - 5, tipX, tipY, (bx + tipX) / 2 - 3, (-hh * .7 + tipY) / 2 - 2]), cols[i], { lw: 1.7, d: 1.4 })
          S(c, E(tipX, tipY, 2.6, 2.6), '#f0d060', { lw: 1.5, d: .8 })
        }
        if (!u) { F(c, P([-hw * .78, hh * .45, -hw * .66, hh * .66, -hw * .9, hh * .66]), p.cloth2); F(c, R(hw * .66, hh * .42, 2.6, 2.6, 0), p.glitch) }
      }
    },
    post: function (c) { for (var i = 0; i < 4; i++) { var ph = c.T * 2 + i * 1.6, a = (Math.sin(ph) + 1) / 2; if (a > .45) { c.g.globalAlpha = a; F(c, R(-26 + i * 17 + Math.sin(ph * 2) * 4, -44 + ((i * 37) % 70), 3, 3, 0), ['#2aa79f', '#d6368a', '#e8c030', '#8ae04a'][i]); c.g.globalAlpha = 1 } } }
  }

  /* ===== The Lost: a pale sheet-ghost with hollow eyes and a broken halo ===== */
  D['the-lost'] = {
    fly: true, alpha: .88, glow: '#8ab8d8',
    pal: { skin: '#e4ecee', cloth: '#d2dde2', cloth2: '#8ea8b8', eye: '#9ad8ee', sclera: '#e8f0f2' },
    head: { shape: 'tall', hw: 13.5, hh: 15 }, back: 'skin', face: { eyes: 'hollow', er: 4.2, mouth: 'none', brow: false, nose: false, ey: .12 },
    body: { tw: 10, bw: 16.5, bot: 38, rag: 6, aw: 5.4 }, legs: { t: 'float' },
    pre: function (c) { glow(c, 0, -4, 52, '#bfe4ff', .26) },
    hd: function (c, L) {
      var hw = c.hw, hh = c.hh, side = c.f === 's', u = c.f === 'u', p = c.p
      if (L === 1 && !u) {
        var mx = side ? hw * .55 : c.look.x * 1.2; S(c, E(mx, hh * .55, 2.8, 4), '#0d0709', { nol: true, d: 0 }); Ln(c, al('#9ad8ee', .8), 1.4, [mx - 6, hh * .1 + 3, mx - 7, hh * .3 + 5]); Ln(c, al('#9ad8ee', .8), 1.4, [mx + 6, hh * .1 + 3, mx + 7, hh * .3 + 5]) }
      if (L === 2) {
        Ou(c, function (g) { g.arc(0, -hh - 7, hw * .75, Math.PI * 1.1, Math.PI * 2.55) }, '#f6ecb0', 2.4)
      }
    },
    bd: function (c, L) {
      var bw = c.bw, top = c.top, sw = sway(c, 2.5, 2.2)
      if (L === 0) { S(c, Q([-bw * .6, 28, -bw * 1.1 + sw, 44, -bw * .3 + sw * 1.4, 50, bw * .2 + sw * 1.4, 44, bw * .9 + sw, 46, bw * .5, 28]), c.p.cloth2, { lw: 1.5, d: 1 }) }
      if (L === 1) { Ln(c, al('#8ea8b8', .8), 1.4, [-bw * .4, top + 14, -bw * .5, c.bot - 4]); Ln(c, al('#8ea8b8', .8), 1.4, [bw * .35, top + 16, bw * .45, c.bot - 6]) }
    }
  }

  /* ===== Lilith: plum hair, ram horns, a magenta blindfold, corset ===== */
  D.lilith = {
    pal: { skin: '#dcbcd4', cloth: '#2b2036', cloth2: '#c2487a', hair: '#4e2c6e', eye: '#c2487a', boot: '#17101e', pants: '#3a2a48', horn: '#e2d6bc', hand: '#dcbcd4' },
    head: { shape: 'round', hw: 13, hh: 14.5 }, back: 'hair', face: { eyes: 'none', mouth: 'smile', nose: false, my: .6 },
    body: { tw: 8.5, bw: 13.5, bot: 29, aw: 4.4 }, legs: { w: 4.6 },
    hd: function (c, L) {
      var hw = c.hw, hh = c.hh, side = c.f === 's', u = c.f === 'u', p = c.p, g = c.g
      if (L === 0) {
        S(c, Q([-hw - 4, -hh * .3, -hw * .5, -hh - 3, hw * .5, -hh - 3, hw + 4, -hh * .3, hw + 6, hh + 22, hw * .4, hh + 14, -hw * .4, hh + 14, -hw - 6, hh + 22]), p.hair, { d: 3 })
        for (var hi = 0; hi < 2; hi++) { var q = hi ? 1 : -1; if (side && hi) continue; var hp0 = [q * hw * .55, -hh * .62, q * (hw + 7), -hh * .98, q * (hw + 13), -hh * .5, q * (hw + 9), -hh * .12, q * (hw + 4.5), -hh * .3]; Lm(c, p.horn, 5.4, hp0); Lm(c, sh(p.horn, .1), 2.2, hp0.slice(0, 6)); S(c, E(q * (hw + 4.5), -hh * .3, 2, 2), p.horn, { lw: 1.4, d: .5 }) }
      }
      if (L === 1 && !u) clipHead(c, function () { var o = side ? hw * .2 : 0; S(c, P([-hw - 2 + o, 0, -hw - 2 + o, -hh - 3, hw + 2 + o, -hh - 3, hw + 2 + o, 0, hw * .8 + o, -hh * .2, hw * .2 + o, -hh * .55, o, -hh * .85, -hw * .2 + o, -hh * .55, -hw * .8 + o, -hh * .2]), p.hair, { lw: 1.8, d: 1.4 }) })
      if (L === 2 && !u) {
        S(c, R(-hw - 1, hh * .1 - 4.2, hw * 2 + 2, 8.4, 2), p.cloth2, { lw: 1.8, d: 1.2 }); Ln(c, al('#ffd8ea', .8), 1.1, [-hw * .5, hh * .1 - 1.5, -hw * .2, hh * .1 + 1.5, hw * .1, hh * .1 - 1.5, hw * .4, hh * .1 + 1.5])
        if (side) S(c, P([-hw * .6, hh * .1, -hw - 8, hh * .1 + 6 + sway(c, 2, 3), -hw - 4, hh * .1 - 3]), p.cloth2, { lw: 1.4, d: .8 })
      }
    },
    bd: function (c, L) {
      var tw = c.tw, bw = c.bw, top = c.top, p = c.p
      if (L === 1) {
        S(c, Q([-tw, top + 14, tw, top + 14, tw + 1, 14, bw * .8, c.bot - 2, -bw * .8, c.bot - 2, -tw - 1, 14]), p.cloth, { d: 2 }); S(c, R(-bw, 20, bw * 2, 3.4, 1), p.cloth2, { lw: 1.4, d: .8 })
        if (c.f === 'd') { Ou(c, function (g) { g.moveTo(0, top + 14); for (var i = 0; i < 5; i++) g.lineTo(i % 2 ? -2.4 : 2.4, top + 14 + (i + 1) * 3.4) }, p.cloth2, 1.3) }
        Ln(c, p.cloth2, 2.4, [-tw * .8, top + 2, tw * .8, top + 2])
      }
    }
  }

  /* ===== Keeper: a brass coin-counting automaton ===== */
  D.keeper = {
    pal: { skin: '#b98d3c', cloth: '#8d652a', cloth2: '#e0c26c', eye: '#2b1c10', boot: '#4a3418', pants: '#6c4c20', hand: '#d8b252', sleeve: '#a07830' },
    head: { shape: 'square', hw: 13, hh: 13, y: -25 }, back: 'cloth', face: { eyes: 'none', mouth: 'none', nose: false },
    body: { tw: 11, bw: 12.5, bot: 26, aw: 5 }, legs: { t: 'mech', w: 5 },
    hd: function (c, L) {
      var hw = c.hw, hh = c.hh, side = c.f === 's', u = c.f === 'u', p = c.p, sw = sway(c, 1.5, 2.2), lx = c.look.x, ly = c.look.y
      if (L === 0) { Ln(c, '#2b2018', 2, [0, -hh, 2 + sw * .4, -hh - 8]); S(c, E(2 + sw * .4, -hh - 10, 2.8, 2.8), p.cloth2, { lw: 1.6, d: .8 }) }
      if (L === 1 && !u) {
        clipHead(c, function () { S(c, R(-hw - 2, -hh * .38, hw * 2 + 4, hh * .95, 2), '#2a1c10', { lw: 1.6, d: 1 }) })
        var xs = side ? [hw * .22, hw * .62] : [-hw * .42 + lx * 1.4, hw * .42 + lx * 1.4]
        for (var i = 0; i < 2; i++) { S(c, E(xs[i], hh * .08, 4.8, 4.8), '#ecc946', { lw: 1.6, d: 1 }); Ou(c, E(xs[i], hh * .08, 2.9, 2.9), '#a8821c', 1); F(c, E(xs[i] + lx * 1.2, hh * .08 + ly, 1.3, 1.3), '#2b1c10') }
      }
      if (L === 2) {
        if (u) { for (var k = 0; k < 4; k++) Ln(c, '#4a3418', 1.4, [-hw * .5, -hh * .4 + k * 5, hw * .5, -hh * .4 + k * 5]); return }
        var mx = side ? hw * .5 : 0, op = c.shoot ? 2.4 : 0
        F(c, R(mx - 5.5, hh * .52 - op, 11, 4 + op * 2, 1), '#1c1209'); for (var j = -2; j <= 2; j++) Ln(c, '#8a6a2c', 1.1, [mx + j * 2.2, hh * .52 - op, mx + j * 2.2, hh * .52 + 4 + op])
        F(c, E(-hw * .78, -hh * .78, 1.3, 1.3), '#4a3418'); F(c, E(hw * .78, -hh * .78, 1.3, 1.3), '#4a3418')
      }
    },
    bd: function (c, L) {
      var tw = c.tw, top = c.top, p = c.p, side = c.f === 's'
      if (L === 1) {
        S(c, R(-tw - 2.5, top + 1, 6, 6, 2), p.cloth2, { lw: 1.7, d: 1 }); S(c, R(tw - 3.5, top + 1, 6, 6, 2), p.cloth2, { lw: 1.7, d: 1 })
        if (c.f === 'u') { for (var k = 0; k < 4; k++) Ln(c, '#4a3418', 1.4, [-tw * .6, top + 8 + k * 4, tw * .6, top + 8 + k * 4]); return }
        S(c, R(side ? -1 : -4, top + 11, 8, 7, 1.5), '#2a1c10', { lw: 1.6, d: 0 }); Ln(c, '#0e0905', 1.8, [side ? 0 : -2.6, top + 14.5, side ? 5 : 5.4, top + 14.5])
        S(c, E(side ? 4 : 5, top + 11.5, 3.2, 3.2), '#ecc946', { lw: 1.3, d: .8 }); Ou(c, E(side ? 4 : 5, top + 11.5, 1.6, 1.6), '#a8821c', 1)
        for (var i = 0; i < 3; i++) S(c, E(-5 + i * 5, 20.5, 2.5, 2.5), '#c9a23c', { lw: 1.3, d: .6 })
      }
    }
  }

  /* ===== Apollyon: locust-lord in void-black chitin, wings and a swirling chest ===== */
  D.apollyon = {
    glow: '#8a5ad0',
    pal: { skin: '#5d4380', cloth: '#251b38', cloth2: '#9a66dc', eye: '#e0b0ff', boot: '#1a1228', pants: '#3a2a58', hand: '#5d4380' },
    head: { shape: 'pear', hw: 13, hh: 15 }, back: 'skin', face: { eyes: 'none', mouth: 'none', nose: false },
    body: { tw: 11, bw: 13, bot: 27, aw: 4.8 }, legs: { w: 5 },
    hd: function (c, L) {
      var hw = c.hw, hh = c.hh, side = c.f === 's', u = c.f === 'u', p = c.p, sw = sway(c, 2, 2.6)
      if (L === 0) { for (var i = 0; i < 2; i++) { var q = i ? 1 : -1; if (side && i) continue; Ln(c, ol(p.cloth), 4.4, [q * 4, -hh + 1, q * 9, -hh - 9, q * 15 + sw * q, -hh - 14]); Ln(c, p.skin, 2, [q * 4, -hh + 1, q * 9, -hh - 9, q * 15 + sw * q, -hh - 14]); S(c, E(q * 15 + sw * q, -hh - 15, 2.4, 2.4), p.cloth2, { lw: 1.4, d: .6 }) } }
      if (L === 1) { Ln(c, sh(p.skin, -.4), 1.5, [0, -hh + 1, 0, -hh * .35]) }
      if (L === 2 && !u) {
        var lx = c.look.x * 1.2, xs = side ? [hw * .15, hw * .6] : [-hw * .46 + lx, hw * .46 + lx], q2 = 1
        for (var j = 0; j < 2; j++) { var s2 = side ? 1 : (j ? 1 : -1); S(c, E(xs[j], hh * .08, 4.6, 6.2, s2 * .35), '#150a1e', { lw: 1.8, d: 1 }); F(c, E(xs[j] - 1.2, hh * .08 - 2, 1.5, 2.2), al(p.eye, .9)); F(c, E(xs[j] + 1, hh * .08 + 2, 1, 1.2), p.cloth2) }
        var mx = side ? hw * .55 : lx
        Ln(c, '#e6d8f4', 2, [mx - 3, hh * .55, mx - 6, hh * .7, mx - 3, hh * .9]); if (!side) Ln(c, '#e6d8f4', 2, [mx + 3, hh * .55, mx + 6, hh * .7, mx + 3, hh * .9])
        if (c.shoot) glow(c, mx, hh * .65, 10, p.cloth2, .7)
      }
    },
    bd: function (c, L) {
      var tw = c.tw, top = c.top, p = c.p, g = c.g, fw = Math.sin(c.T * 14) * .2, side = c.f === 's'
      if (L === 0) {
        for (var i = 0; i < 2; i++) { var q = i ? 1 : -1; g.save(); g.translate(q * (side ? 2 : 6), top + 6); g.rotate(q * (-.8 + fw * q)); S(c, E(0, -14, 5.4, 15), al(p.wing || '#b890f0', .55), { lw: 1.8, d: 1, ol: ol('#5d4380') }); Ln(c, al('#e0c8ff', .7), 1, [0, -2, 0, -26]); g.restore() }
      }
      if (L === 1) {
        S(c, E(-tw - 1, top + 3, 7, 5), p.cloth, { lw: 2, d: 1.2 }); S(c, E(tw + 1, top + 3, 7, 5), p.cloth, { lw: 2, d: 1.2 })
        if (!side) { Ln(c, p.cloth2, 1.4, [-tw - 5, top + 2, -tw - 1, top - 3]); Ln(c, p.cloth2, 1.4, [tw + 5, top + 2, tw + 1, top - 3]) }
        var cy = top + 14, sx = side ? 2 : 0; S(c, E(sx, cy, 7.4, 7.4), '#0b0612', { lw: 1.8, d: 0 })
        for (var k = 0; k < 3; k++) Ou(c, function (gg) { var a0 = c.T * (1.4 - k * .3) + k * 2; gg.arc(sx, cy, 1.8 + k * 1.7, a0, a0 + 3.8) }, p.cloth2, 1.3)
        S(c, R(-tw, 8, tw * 2, 3.4, 1), p.cloth2, { lw: 1.5, d: .6 })
      }
    }
  }

  /* ===== The Forgotten: a tall skeleton in a rag scarf, spare femur on its back ===== */
  D['the-forgotten'] = {
    pal: { skin: '#e9e1c8', cloth: '#7e6c52', cloth2: '#9e8a6a', bone: '#e9e1c8', eye: '#7fe6cc', boot: '#e9e1c8', pants: '#e9e1c8', sleeve: '#e9e1c8', hand: '#e9e1c8' },
    head: { shape: 'skull', hw: 14, hh: 14.5 }, back: 'skin', face: { eyes: 'hollow', er: 4.4, mouth: 'none', brow: false, nose: false, ey: .02 }, glow: '#7fe6cc',
    body: { tw: 8, bw: 9, bot: 25, aw: 3, torso: function (c, tw, bw, top, bot) {
      var p = c.p
      S(c, Q([-tw, top + 2, 0, top - 1, tw, top + 2, tw * .8, top + 24, 0, bot, -tw * .8, top + 24]), '#3a2e24', { lw: 2, d: 0 })
      if (c.f === 'u') { Ln(c, p.bone, 3, [0, top + 1, 0, bot - 4]); for (var i = 0; i < 4; i++) { Ln(c, ol(p.bone), 4.4, [-tw * .7, top + 5 + i * 5, tw * .7, top + 5 + i * 5]); Ln(c, p.bone, 2.4, [-tw * .7, top + 5 + i * 5, tw * .7, top + 5 + i * 5]) } } else {
        Ln(c, p.bone, 2.4, [0, top + 1, 0, bot - 3])
        for (var j = 0; j < 4; j++) { var y = top + 4 + j * 5, w = tw * (.95 - j * .1); Ou(c, function (g) { g.moveTo(0, y); g.quadraticCurveTo(-w, y - 2, -w * .9, y + 4); g.moveTo(0, y); g.quadraticCurveTo(w, y - 2, w * .9, y + 4) }, p.bone, 2.6) }
      }
      S(c, E(0, bot - 1, tw * 1.1, 3.4), p.bone, { lw: 1.7, d: 1 })
    } },
    legs: { t: 'bones' },
    hd: function (c, L) {
      var hw = c.hw, hh = c.hh, side = c.f === 's', u = c.f === 'u', p = c.p
      if (L === 1 && !u) { F(c, P([side ? hw * .7 : -1.6, hh * .3, side ? hw * .7 + 3 : 1.6, hh * .3, side ? hw * .7 + 1.5 : 0, hh * .1 + 7.5]), '#1a1008') }
      if (L === 1 && u) Ln(c, sh(p.bone, -.4), 1.3, [hw * .3, -hh, hw * .1, -hh * .6, hw * .3, -hh * .35])
      if (L === 2 && !u) {
        var mx = side ? hw * .5 : 0, tl = c.shoot ? 3 : 0; S(c, R(mx - 6, hh * .55, 12, 4.8 + tl, 1.4), p.bone, { lw: 1.7, d: .8 }); for (var i = -2; i <= 2; i++) Ln(c, ol(p.bone), 1, [mx + i * 2.4, hh * .55, mx + i * 2.4, hh * .55 + 4.8 + tl])
      }
    },
    bd: function (c, L) {
      var tw = c.tw, top = c.top, p = c.p, sw = sway(c, 2, 3)
      if (L === 0) { S(c, R(-3, top - 4, 6, 34, 2), p.bone, { lw: 1.7, d: .8, ol: ol(p.bone) }); S(c, E(-1, top - 5, 3.6, 3), p.bone, { lw: 1.6, d: .6 }) }
      if (L === 1) { S(c, P([-6, c.bot - 3, 6, c.bot - 3, 8, c.bot + 7, 2 + sw * .3, c.bot + 12, -3, c.bot + 7]), p.cloth, { lw: 1.6, d: 1 }) }
      if (L === 2) {
        S(c, E(0, top + 1, tw + 1.5, 3.6), p.cloth2, { lw: 1.6, d: 1 })
        S(c, Q([tw - 2, top + 2, tw + 2, top + 3, tw + 5 + sw, top + 18, tw + 1 + sw, top + 24, tw - 2 + sw, top + 14]), p.cloth2, { lw: 1.5, d: 1 })
      }
    }
  }

  /* ===== Bethany: gold-haired priestess in a white robe, orbited by blue wisps ===== */
  D.bethany = {
    glow: '#6aa8e8',
    pal: { skin: '#f2dac6', cloth: '#f1ebdf', cloth2: '#5b8bcb', hair: '#e6c46c', eye: '#4a7ec0', boot: '#c8bca4', sleeve: '#f1ebdf' },
    head: { shape: 'round', hw: 13.5, hh: 14.5 }, back: 'hair', face: { er: 3.5, brc: '#b8943c', mouth: 'smile', blush: '#e8908a' },
    body: { tw: 9, bw: 15.5, bot: 37, aw: 5 }, legs: { t: 'none' },
    hd: function (c, L) {
      var hw = c.hw, hh = c.hh, side = c.f === 's', u = c.f === 'u', p = c.p
      if (L === 0) S(c, Q([-hw - 3, -hh * .3, -hw * .6, -hh - 3, hw * .6, -hh - 3, hw + 3, -hh * .3, hw + 3, hh + 18, hw * .3, hh + 12, -hw * .3, hh + 12, -hw - 3, hh + 18]), p.hair, { d: 3 })
      if (L === 1 && !u) clipHead(c, function () { var o = side ? hw * .2 : 0; S(c, P([-hw - 2 + o, hh * .1, -hw - 2 + o, -hh - 3, hw + 2 + o, -hh - 3, hw + 2 + o, hh * .1, hw * .8 + o, -hh * .25, hw * .3 + o, -hh * .6, -hw * .2 + o, -hh * .5, -hw * .7 + o, -hh * .15]), p.hair, { lw: 1.8, d: 1.4 }) })
      if (L === 2) {
        Ou(c, E(side ? -1 : 0, -hh * .5, hw * .98, hh * .28), '#d8b448', 2.2)
        if (!u) { S(c, P([(side ? hw * .35 : 0), -hh * .75, (side ? hw * .35 : 0) + 2.8, -hh * .5, (side ? hw * .35 : 0), -hh * .28, (side ? hw * .35 : 0) - 2.8, -hh * .5]), '#6aa8e8', { lw: 1.4, d: .8 }) }
        for (var i = 0; i < 3; i++) {
          var a = c.T * 1.7 + i * 2.1, x = Math.cos(a) * (hw + 10), y = -hh * .3 + Math.sin(a) * 5 - 2, fl = Math.sin(c.T * 9 + i) * .6
          glow(c, x, y + 1, 9, p.wisp || '#8ad0ff', .55); S(c, Q([x, y - 6 + fl, x + 3, y - 1, x + 2.4, y + 3, x - 2.4, y + 3, x - 3, y - 1]), p.wisp || '#7ec4ff', { lw: 1.3, d: .8 }); F(c, E(x, y + 1.4, 1.2, 1.6), '#eaf8ff')
        }
      }
    },
    bd: function (c, L) {
      var tw = c.tw, bw = c.bw, top = c.top, p = c.p, side = c.f === 's'
      if (L === 0) { var q = c.moving ? Math.sin(c.ph) : 0; S(c, E(-5 + q * 2, 42, 4.6, 2.6), p.boot, { lw: 1.8, d: 1 }); S(c, E(5 - q * 2, 42, 4.6, 2.6), p.boot, { lw: 1.8, d: 1 }) }
      if (L === 1) {
        S(c, R(-bw - .5, c.bot - 6, bw * 2 + 1, 4.4, 1.4), p.cloth2, { lw: 1.6, d: .8 }); S(c, R(-tw - 1, 6, tw * 2 + 2, 3.6, 1.4), p.cloth2, { lw: 1.6, d: .8 })
        if (c.f !== 'u') S(c, P([-tw * .5, top + 1, 0, top + 9, tw * .5, top + 1, 0, top - 1]), p.cloth2, { lw: 1.4, d: .6 })
        Ln(c, sh(p.cloth, -.15), 1.4, [-bw * .5, 12, -bw * .6, c.bot - 8]); Ln(c, sh(p.cloth, -.15), 1.4, [bw * .45, 12, bw * .6, c.bot - 8])
      }
      if (L === 2) {
        var bx = side ? 3 : bw * .9 + 2, by = 18 + Math.sin(c.T * 2.4) * 1.5; glow(c, bx, by, 13, p.wisp || '#a8dcff', .45)
        S(c, P([bx - 6, by - 1, bx, by + 2, bx, by + 9, bx - 6, by + 6]), p.book || '#c8d8f0', { lw: 1.5, d: .8 }); S(c, P([bx + 6, by - 1, bx, by + 2, bx, by + 9, bx + 6, by + 6]), '#dfe8f8', { lw: 1.5, d: .8 })
      }
    }
  }

  /* ===== Jacob & Esau: two brothers, one blond and slight, one red-furred and broad ===== */
  D.jacob = {
    pal: { skin: '#eed3bc', cloth: '#5b7fa4', cloth2: '#d8c690', hair: '#d9b44e', eye: '#4a6a8a', boot: '#5a3e2c', pants: '#6a5a46' },
    head: { shape: 'round', hw: 13, hh: 14.5 }, back: 'hair', face: { er: 3.6, brc: '#a8822c', mouth: 'smile', blush: '#e8908a' }, body: { tw: 9, bw: 12.5, bot: 27 },
    hd: function (c, L) {
      var hw = c.hw, hh = c.hh, side = c.f === 's', u = c.f === 'u', p = c.p
      if (L === 1 && !u) clipHead(c, function () { var o = side ? hw * .2 : 0; S(c, P([-hw - 2 + o, -hh * .05, -hw - 2 + o, -hh - 3, hw + 2 + o, -hh - 3, hw + 2 + o, -hh * .05, hw * .7 + o, -hh * .45, hw * .3 + o, -hh * .2, o, -hh * .55, -hw * .4 + o, -hh * .2, -hw * .75 + o, -hh * .5]), p.hair, { lw: 1.8, d: 1.4 }) })
      if (L === 2) S(c, R(-hw - .5, -hh * .52, hw * 2 + 1, 3.4, 1), p.cloth, { lw: 1.4, d: .6 })
    },
    bd: function (c, L) { var tw = c.tw; if (L === 1) { S(c, R(-tw - 1, 6, tw * 2 + 2, 3.4, 1), '#5a3e2c', { lw: 1.4, d: 0 }); Ln(c, '#2b2028', 1.2, [0, c.top + 4, 0, 6]); S(c, P([-tw * .6, c.top + 1, 0, c.top + 8, tw * .6, c.top + 1]), '#e8dcb0', { lw: 1.3, d: .6 }) } }
  }
  D.esau = {
    pal: { skin: '#c78a62', cloth: '#7b5a3a', cloth2: '#a8783c', hair: '#a23c22', eye: '#4a2c1c', boot: '#3a2a1e', pants: '#5a4430', beard: '#8a3320' },
    head: { shape: 'square', hw: 14, hh: 14 }, back: 'hair', face: { er: 3.4, brc: '#6a2414', bt: .8, mouth: 'frown', my: .62 }, body: { tw: 13.5, bw: 14, bot: 25, aw: 6.4 }, legs: { w: 6.4 },
    hd: function (c, L) {
      var hw = c.hw, hh = c.hh, side = c.f === 's', u = c.f === 'u', p = c.p
      if (L === 0) { var sw = sway(c, 1.2, 2); S(c, Q([-hw - 6, -hh * .3, -hw - 3, -hh - 5, 0, -hh - 8, hw + 3, -hh - 5, hw + 6, -hh * .3, hw + 5, hh * .5 + sw, -hw - 5, hh * .5 - sw]), p.hair, { d: 3 }) }
      if (L === 1 && !u) { var o = side ? hw * .3 : 0; clipHead(c, function () { S(c, P([-hw - 2, -hh * .1, -hw - 2, -hh - 3, hw + 2, -hh - 3, hw + 2, -hh * .1, hw * .5, -hh * .5, 0, -hh * .3, -hw * .5, -hh * .55]), p.hair, { d: 1.4 }) }); S(c, Q([-hw + 1 + o, hh * .2, hw - 1 + o, hh * .2, hw * .7 + o, hh * .85, o, hh + 3, -hw * .7 + o, hh * .85]), p.beard, { d: 2 }) }
    },
    bd: function (c, L) {
      var tw = c.tw, top = c.top, p = c.p
      if (L === 1) { S(c, Q([-tw - 1, top + 1, tw + 1, top + 1, tw, top + 18, 0, top + 22, -tw, top + 18]), p.cloth, { d: 2 }); for (var i = -3; i <= 3; i++) F(c, P([i * 3.6 - 1.6, top + 19, i * 3.6 + 1.6, top + 19, i * 3.6, top + 25]), p.cloth); S(c, R(-tw - 1, 8, tw * 2 + 2, 4, 1), '#3a2a1e', { lw: 1.5, d: 0 }) }
    }
  }
  D['jacob-and-esau'] = { group: [{ id: 'esau', x: 12, s: .8 }, { id: 'jacob', x: -12, s: .74 }] }

  /* ================================================================ tainted: grimier, stitched reinterpretations */
  function grime (pal) { var o = {}, k, v; for (k in pal) { v = pal[k]; o[k] = typeof v === 'string' && v.length === 7 ? mix(v, '#3c343a', .3) : v } return o }
  function variant (base, over) {
    var b = D[base], s = Object.assign({}, b, over)
    s.pal = Object.assign(grime(b.pal), over.pal || {})
    ;['hd', 'bd'].forEach(function (k) {
      var bh = over[k] || b[k], x = over[k + '2'], skip = over[k + 'Skip'] || []
      if (bh || x) s[k] = function (c, L) { if (bh && skip.indexOf(L) < 0) bh(c, L); if (x) x(c, L) }
    })
    return s
  }
  function hv (c) { return { hw: c.hw, hh: c.hh, side: c.f === 's', u: c.f === 'u', p: c.p } }

  /* Tainted Isaac: hunched under a bursting backpack of hoarded junk, mouth sewn shut */
  D['tainted-isaac'] = variant('isaac', {
    pal: { skin: '#cfc5bb', cloth: '#3e4a46', cloth2: '#7a5a40', hair: '#7e4c30', eye: '#a8d4b8', lamp: '#a8e8c8' },
    head: { shape: 'pear', hw: 12.5, hh: 14.5, y: -24 }, face: { eyes: 'hollow', er: 3.8, brc: '#5a3a28', mouth: 'none', nose: true },
    hd2: function (c, L) {
      var v = hv(c), hw = v.hw, hh = v.hh
      if (L === 2 && !v.u) { var mx = v.side ? hw * .55 : 0, my = hh * .58; F(c, E(v.side ? hw * .4 : -hw * .42, hh * .26, 4.2, 2), al('#2a2030', .4)); F(c, E(v.side ? hw * .72 : hw * .42, hh * .26, 4.2, 2), al('#2a2030', .4)); stitch(c, mx - 5, my, mx + 5, my, 5) }
    },
    bd2: function (c, L) {
      var bw = c.bw, top = c.top, side = c.f === 's', u = c.f === 'u', sw = sway(c, 1, 2)
      if ((L === 0 && !u) || (L === 2 && u)) {
        var pts = side ? [-3, -4, -12, -20, -19, -8, -20, 16, -11, 29, -2, 22] : [-bw - 9, -6, -bw * .5, -22, bw * .5, -22, bw + 9, -6, bw + 11, 18, 0, 31, -bw - 11, 18]
        S(c, Q(pts), '#7a6240', { d: 3 })
        if (!side) { Ln(c, '#2b2028', 1.4, [-bw - 5, 2, -bw * .4, 24]); Ln(c, '#2b2028', 1.4, [bw + 5, 2, bw * .4, 24]) }
        var sx = side ? -12 : bw + 3
        Ln(c, '#cfc8b4', 2, [sx, -16, sx + 3, -32 + sw]); S(c, E(sx + 3, -34 + sw, 2.8, 3.6), '#cfc8b4', { lw: 1.5, d: .8 })
        Ou(c, function (g) { g.arc(side ? -17 : -bw - 6, -14, 5, Math.PI, Math.PI * 2) }, '#8a8a92', 2.2); Ln(c, '#8a8a92', 2, [side ? -20 : -bw - 9, -14, side ? -20 : -bw - 9, -8])
        S(c, E(side ? -8 : -bw * .3, -21, 3, 3), '#b8a050', { lw: 1.4, d: .6 })
      }
      if (L === 1 && !side) Ln(c, '#2b2028', 2.4, [-c.tw * .8, top + 2, c.tw * .8, c.bot - 8])
    }
  })

  /* Tainted Magdalene: arms spread for the hug, rotting heart dripping */
  D['tainted-magdalene'] = variant('magdalene', {
    pal: { skin: '#d3aca2', cloth: '#7e4456', cloth2: '#b6a99d', hair: '#4a2a26', eye: '#c4404e' },
    body: { tw: 12, bw: 16, bot: 27, noarms: true }, face: { eyes: 'sleepy', er: 3.6, mouth: 'fang', my: .58, brc: '#3a2020' },
    hd2: function (c, L) {
      var v = hv(c), hw = v.hw, hh = v.hh
      if (L === 2 && !v.u) { F(c, E(-hw * .5, hh * .32, 3.6, 2.4), al('#5a7a5a', .5)); F(c, E(hw * .55, -hh * .1, 2.6, 2), al('#5a7a5a', .45)); stitch(c, -hw * .85, hh * .12, -hw * .35, hh * .3, 3) }
    },
    bd2: function (c, L) {
      var p = c.p, top = c.top, tw = c.tw, bob = Math.sin(c.T * 3) * 1.6, side = c.f === 's'
      if (L === 1) {
        for (var i = 0; i < 2; i++) {
          var q = i ? 1 : -1
          if (side) { var far = !i, hx = 17 + bob; Lm(c, far ? sh(p.cloth, -.18) : p.cloth, 5.4, [0, top + 5, hx * .55, top + 6 + bob * .4, hx, top + 7 - (far ? 1 : 0)]); S(c, E(hx + 1, top + 7, 3.8, 3.8), far ? sh(p.skin, -.15) : p.skin, { lw: 1.9, d: 1 }) }
          else { var hx2 = q * (tw + 21 + bob), hy = top + 3 - bob * .5; Lm(c, p.cloth, 5.4, [q * (tw + 1), top + 5, q * (tw + 12), top + 3 + bob * .3, hx2, hy]); S(c, E(hx2, hy, 3.8, 3.8), p.skin, { lw: 1.9, d: 1 }); Ln(c, ol(p.skin), 1.2, [hx2 + q * 1, hy - 3, hx2 + q * 4, hy - 4]) }
        }
      }
      if (L === 2 && !side) { IS.art.heart(c.g, 5, top + 21, 3.4, 3.8, K(c, '#5a1a3a'), { ol: ol('#5a1a3a') }); Ln(c, al('#a01c34', .9), 1.6, [5, top + 24, 5, top + 30 + Math.sin(c.T * 3) * 1.5]) }
    }
  })

  /* Tainted Cain: a stuffed crafting satchel, cracked eye, stitched cap */
  D['tainted-cain'] = variant('cain', {
    pal: { skin: '#b99b85', cloth: '#4b3828', cloth2: '#8a7040', hair: '#2a1c12', eye: '#e8a43c', scarf: '#7a2a22' },
    face: { one: true, er: 3.2, brow: false, eyes: 'sleepy', nose: false, mouth: 'frown', my: .62 },
    hd2: function (c, L) {
      var v = hv(c), hw = v.hw, hh = v.hh
      if (L === 2 && !v.u) { stitch(c, -hw, -hh * .5, hw, -hh * .45, 6); var cx = v.side ? hw * .5 : 0; Ln(c, '#1b1317', 1.3, [cx - 2, -4, cx + 1, 0, cx - 1, 3, cx + 2, 6]) }
    },
    bd2: function (c, L) {
      var tw = c.tw, top = c.top, side = c.f === 's', sw = sway(c, 1.4, 2.6)
      if (L === 1) Ln(c, '#2b2028', 3, [-tw * .9, top + 3, tw * .9, c.bot - 8])
      if (L === 2) {
        var x = side ? -3 : -tw - 4
        S(c, R(x - 6.5, 12 + sw * .2, 13, 13, 2.4), '#6c5232', { lw: 1.9, d: 1.4 }); S(c, P([x - 7, 12 + sw * .2, x + 7, 12 + sw * .2, x + 5, 18, x - 5, 18]), '#82653c', { lw: 1.6, d: 1 }); F(c, R(x - 1.4, 16.5 + sw * .2, 2.8, 3, .6), '#c9a23c')
        S(c, E(x - 2.5, 10 + sw * .2, 2.8, 2.8), '#3a3a42', { lw: 1.4, d: .6 }); Ln(c, '#7ab0c8', 1.8, [x + 2, 11, x + 4, 5 + sw * .3]); Ou(c, E(x + 5, 8, 2, 2), '#c9a23c', 1.3)
      }
    }
  })

  /* Tainted Judas: a living shadow, eyes burning red, crimson lapels the only colour */
  D['tainted-judas'] = variant('judas', {
    pal: { skin: '#3d3149', cloth: '#130e18', cloth2: '#c01f34', hair: '#09060b', eye: '#ff4646', boot: '#09060b', pants: '#130e18' },
    face: { eyes: 'glow', er: 3.4, mouth: 'fang', brow: false, my: .62 }, legs: { t: 'none' }, body: { tw: 10.5, bw: 15.5, bot: 33, rag: 7 },
    pre: function (c) { glow(c, 0, -4, 50, '#a01830', .24) },
    bd2: function (c, L) {
      var top = c.top, sw = sway(c, 3, 2.4), i
      if (L === 0) for (i = 0; i < 3; i++) S(c, Q([-12 + i * 12 + sw * (i - 1) * .4, 30, -8 + i * 12 + sw * .5, 40, -10 + i * 12 + sw, 51 - (i % 2) * 4, -14 + i * 12 + sw * .5, 40]), '#130e18', { lw: 1.4, d: .8 })
      if (L === 2) for (i = 0; i < 3; i++) { var x = -c.tw + i * c.tw, s2 = Math.sin(c.T * 3 + i * 2) * 2.4; Ln(c, al('#3a2a50', .75), 3, [x, top + 1, x + s2, top - 8, x - s2, top - 16]) }
    }
  })

  /* Tainted ???: a poop-swirl cap, stained gown, a cloud of flies */
  D['tainted-blue-baby'] = variant('blue-baby', {
    pal: { skin: '#7f9a8a', cloth: '#b9a98a', cloth2: '#6b4527', hair: '#4a3a2a', eye: '#0d0c16', sclera: '#e0e0cc' },
    face: { eyes: 'dot', er: 4.6, mouth: 'frown', brow: false, nose: false, ey: .18, my: .66 },
    hd: function (c, L) {
      var v = hv(c), hw = v.hw, hh = v.hh, sw = sway(c, 1.4, 2.6), o = v.side ? -hw * .2 : 0
      if (L === 2) {
        var br = '#6b4527'
        S(c, E(o, -hh + 1.5, hw * 1.05, 4.8), br, { lw: 1.8, d: 1.2 }); S(c, E(o + 1, -hh - 3.5, hw * .78, 4.4), sh(br, .04), { lw: 1.8, d: 1.2 }); S(c, E(o, -hh - 8.5, hw * .5, 4), sh(br, .08), { lw: 1.8, d: 1.2 })
        S(c, P([o - 3.5, -hh - 10.5, o + 5 + sw, -hh - 19, o + 3, -hh - 10]), sh(br, .1), { lw: 1.6, d: .6 })
        for (var i = 0; i < 3; i++) { var a = c.T * 2.6 + i * 2.1; IS.art.fly(c.g, Math.cos(a) * (hw + 12), -hh * .3 + Math.sin(a * 1.4) * 10, 3, i) }
      }
      if (L === 1 && !v.u) F(c, E(v.side ? hw * .55 : 0, hh * .68, 1.6, 2.6), al('#8ab0d0', .8))
    },
    bd2: function (c, L) {
      if (L === 1) { F(c, E(-6, 14, 4.4, 3), al('#6b4527', .55)); F(c, E(5, 24, 5.4, 3.4), al('#6b4527', .5)); F(c, E(-3, 31, 3, 2), al('#6b4527', .5)) }
    }
  })

  /* Tainted Eve: dress clotted with blood, weeping red, hair like wet rope */
  D['tainted-eve'] = variant('eve', {
    pal: { skin: '#c8b5ac', cloth: '#1d141d', cloth2: '#7e1526', hair: '#2b101a', eye: '#b0202e' }, bdSkip: [2],
    hd2: function (c, L) {
      var v = hv(c), hw = v.hw, hh = v.hh
      if (L === 2 && !v.u) { var xs = v.side ? [hw * .22, hw * .62] : [-hw * .42, hw * .42]; xs.forEach(function (x) { Ln(c, al('#a01828', .85), 2.2, [x, hh * .1 + 3, x - .6, hh * .1 + 9 + Math.sin(c.T * 2 + x) * 1.4]) }) }
    },
    bd2: function (c, L) {
      var top = c.top, tw = c.tw, bw = c.bw, sw = sway(c, 1, 3)
      if (L === 2) {
        function clot (x, y, rx, ry) { S(c, Q([x - rx, y, x - rx * .5, y - ry, x + rx * .6, y - ry * .9, x + rx, y + ry * .2, x + rx * .3, y + ry, x - rx * .6, y + ry * .8]), '#8a1628', { lw: 1.7, d: 1.2 }); F(c, E(x - rx * .3, y - ry * .3, rx * .22, ry * .2), al('#ffb0b8', .6)) }
        clot(-tw, top + 3, 5.4, 4.4); clot(tw * .8, top + 5, 4.2, 3.6); clot(side0(c) ? 0 : -3, 15, 4.4, 5)
        clot(bw * .5, c.bot - 2, 3.6, 3.2); Ln(c, al('#a01828', .9), 1.6, [bw * .5, c.bot, bw * .5, c.bot + 5 + sw])
      }
    }
  })
  function side0 (c) { return c.f === 's' }

  /* Tainted Samson: berserk, flushed red, hair on end, broken chains at the wrists */
  D['tainted-samson'] = variant('samson', {
    pal: { skin: '#bb513c', cloth: '#5a2420', cloth2: '#9a8040', hair: '#7e3c1a', eye: '#fff2cc', beard: '#4a2410', boot: '#3a2418' }, hdSkip: [0],
    face: { eyes: 'glow', er: 3.7, bt: 3, brc: '#3a1a10', my: .66 },
    pre: function (c) { glow(c, 0, -4, 54, '#ff4020', .22); c.g.translate(Math.sin(c.T * 40) * .35, 0) },
    hd2: function (c, L) {
      var v = hv(c), hw = v.hw, hh = v.hh, j = Math.sin(c.T * 9) * 1.2
      if (L === 0) S(c, P([-hw - 8, -hh * .2, -hw - 13, -hh - 8, -hw * .6, -hh - 2, -hw * .5, -hh - 17 + j, -hw * .1, -hh - 5, 0, -hh - 21 - j, hw * .2, -hh - 5, hw * .55, -hh - 16 + j, hw * .7, -hh - 2, hw + 12, -hh - 9, hw + 8, -hh * .2, hw + 4, hh * .4, -hw - 4, hh * .4]), v.p.hair, { d: 3 })
    },
    bd2: function (c, L) {
      var tw = c.tw, top = c.top, sw = sway(c, 1.6, 3)
      if (L === 1) { Ln(c, al('#4a1410', .6), 1.4, [-tw + 1, top + 6, -tw + 4, top + 10, -tw + 2, top + 15]); Ln(c, al('#4a1410', .6), 1.4, [tw - 1, top + 6, tw - 4, top + 11, tw - 2, top + 16]) }
      if (L === 2 && c.f !== 's') for (var i = 0; i < 2; i++) { var q = i ? 1 : -1, x = q * (tw + 3.4); for (var k = 0; k < 3; k++) S(c, E(x + q * k * .8 + sw * q * .3, top + 26 + k * 4.4, 2.2, 2.8, k % 2 ? 0 : 1.2), '#8a8a92', { lw: 1.4, d: .6 }) }
    }
  })

  /* Tainted Azazel: grey-horned and retching, mouth gaping blood, ribs showing */
  D['tainted-azazel'] = variant('azazel', {
    pal: { skin: '#7b2c3a', cloth: '#1e1218', cloth2: '#3a2028', hair: '#140c10', eye: '#ffd2a2', horn: '#cdc4ac', wing: '#382a32' },
    face: { eyes: 'glow', er: 3.4, mouth: 'none', brow: false }, hdSkip: [2],
    hd2: function (c, L) {
      var v = hv(c), hw = v.hw, hh = v.hh
      if (L === 2 && !v.u) {
        var mx = v.side ? hw * .55 : 0, o = c.shoot ? 1.8 : 0
        S(c, E(mx, hh * .55, 4.8 + o, 4.4 + o), '#2a0a10', { lw: 1.8, d: 0 }); F(c, E(mx, hh * .55 + 2.2, 3, 1.8 + o * .4), '#b02034'); F(c, P([mx - 3.6, hh * .55 - 2.6, mx - 1.8, hh * .55 - 2.6, mx - 2.7, hh * .55 + .4]), '#efe6d0'); F(c, P([mx + 1.8, hh * .55 - 2.6, mx + 3.6, hh * .55 - 2.6, mx + 2.7, hh * .55 + .4]), '#efe6d0')
        Ln(c, al('#a01828', .9), 2, [mx - 2, hh * .55 + 4, mx - 2.4, hh * .55 + 10 + Math.sin(c.T * 3) * 1.5])
        if (c.shoot) glow(c, mx, hh * .6, 14, '#ff4a20', .8)
      }
    },
    bd2: function (c, L) {
      var top = c.top
      if (L === 1 && c.f !== 'u') { stitch(c, -5, top + 9, 5, top + 15, 4); for (var i = 0; i < 2; i++) Ln(c, al('#e8dcc4', .75), 1.5, [-5, top + 3 + i * 3 + 14, 5, top + 3 + i * 3 + 14]) }
    }
  })

  /* Tainted Lazarus: Dead Lazarus, half of him already skull and rib */
  D['tainted-lazarus'] = variant('lazarus', {
    pal: { skin: '#6f806e', cloth: '#aaa288', cloth2: '#6a644c', hair: '#3a3028', eye: '#7aff9a', bone: '#e2dcc2' },
    face: { eyes: 'glow', er: 3.6, mouth: 'frown', brow: false }, pre: function (c) { glow(c, 0, -4, 50, '#5aff8a', .16) },
    hd2: function (c, L) {
      var v = hv(c), hw = v.hw, hh = v.hh, g = c.g, p = v.p
      if (L === 2 && !v.u) {
        var x0 = v.side ? hw * .1 : 0
        g.save(); g.beginPath(); c.hp(g); g.clip(); g.beginPath(); g.rect(-hw - 8, -hh - 8, x0 + hw + 8, hh * 2 + 16); g.clip()
        F(c, E(0, 0, hw + 4, hh + 4), p.bone)
        var ex = v.side ? hw * .22 : -hw * .42; F(c, E(ex, 1.6, 4.6, 5.4), '#0d0709'); F(c, E(ex + c.look.x, 1.6, 1.7, 1.9), p.eye)
        F(c, P([ex + 5, hh * .3, ex + 8, hh * .3, ex + 6.5, hh * .3 + 5]), '#1a1008')
        var tx = v.side ? hw * .1 : -hw * .62; F(c, R(tx, hh * .52, hw * .6, 5, 0), '#efe8d0'); for (var i = 1; i < 4; i++) Ln(c, '#8a8468', 1, [tx + i * hw * .15, hh * .52, tx + i * hw * .15, hh * .52 + 5])
        Ln(c, '#8a8468', 1.2, [-hw * .5, -hh, -hw * .3, -hh * .6, -hw * .5, -hh * .4])
        g.restore(); stitch(c, x0, -hh * .85, x0, hh * .85, 7)
      }
    },
    bd2: function (c, L) {
      var tw = c.tw, bw = c.bw, top = c.top, g = c.g, p = c.p
      if (L === 1 && c.f !== 'u') {
        g.save(); g.beginPath(); Q(torsoPts(tw, bw, top, c.bot))(g); g.clip(); g.beginPath(); g.rect(-bw - 4, top - 4, bw + 4, c.bot - top + 10); g.clip()
        F(c, R(-bw - 4, top - 4, bw + 4, c.bot - top + 10, 0), '#2a2218')
        Ln(c, p.bone, 2.2, [-1, top + 2, -1, c.bot - 3]); for (var i = 0; i < 4; i++) Ln(c, p.bone, 2.4, [-1, top + 4 + i * 5.4, -tw + i * .6, top + 2 + i * 5.4 + 2])
        g.restore(); Ln(c, '#2b2028', 1.4, [0, top + 1, 0, c.bot - 2])
      }
    }
  })

  /* Tainted Eden: inverted harlequin, a third eye, flickering glitch slices */
  D['tainted-eden'] = variant('eden', {
    pal: { skin: '#dac3b3', cloth: '#d6368a', cloth2: '#2aa79f', pants: '#7a3ad0', hair: '#e8c030', eye: '#2a2030', glitch: '#e8d030', boot: '#1c1028' },
    face: { er: 3.6, brc: '#2b2038', mouth: 'frown', blush: '#2aa79f' },
    hd2: function (c, L) {
      var v = hv(c), hw = v.hw, hh = v.hh
      if (L === 2 && !v.u) { var c2 = Object.assign({}, c, { p: Object.assign({}, c.p, { eye: '#8ae04a' }) }); eye(c2, v.side ? hw * .42 : 0, -hh * .36, 2.5, 'glow'); stitch(c, v.side ? hw * .1 : 0, hh * .2, v.side ? hw * .1 : 0, hh * .9, 4) }
    },
    post: function (c) {
      var k = Math.floor(c.T * 7), g = c.g
      for (var i = 0; i < 3; i++) { if (rnd(k * 3 + i) < .45) continue; var y = -42 + rnd(k + i * 9) * 84, dx = (rnd(k * 5 + i) - .5) * 10; F(c, R(-17 + dx, y, 34, 2.4, 0), al(i % 2 ? '#2aa79f' : '#d6368a', .55)) }
    }
  })

  /* Tainted Lost: an ash-grey, cracked shade with no mantle, a fan of holy cards */
  D['tainted-the-lost'] = variant('the-lost', {
    pal: { skin: '#b6b6c2', cloth: '#7f7f92', cloth2: '#54546a', eye: '#d8c8ff' }, glow: '#8a7ab8', hdSkip: [2],
    pre: function (c) { glow(c, 0, -4, 52, '#9a8ac8', .22) },
    hd2: function (c, L) {
      var v = hv(c), hw = v.hw, hh = v.hh
      if (L === 2) { var o = v.side ? hw * .2 : 0; Ln(c, al('#20182e', .85), 1.5, [o + hw * .25, -hh, o + hw * .05, -hh * .6, o + hw * .3, -hh * .3, o - hw * .05, -hh * .05, o + hw * .1, hh * .25]); Ln(c, al('#20182e', .85), 1.2, [o + hw * .05, -hh * .6, o - hw * .25, -hh * .5]) }
    },
    bd2: function (c, L) {
      if (L === 2) { var bx = c.f === 's' ? 5 : c.bw * .85 + 1; for (var i = 0; i < 3; i++) { c.g.save(); c.g.translate(bx, 16); c.g.rotate((i - 1) * .4 + Math.sin(c.T * 2) * .05); S(c, R(-3.4, -9, 6.8, 10, 1), '#efe3b4', { lw: 1.5, d: .8 }); Ou(c, R(-2, -7.6, 4, 7.2, .6), '#c9a23c', .9); c.g.restore() } }
    }
  })

  /* Tainted Lilith: umbilical cord to a swinging Gello, mouth stitched */
  D['tainted-lilith'] = variant('lilith', {
    pal: { skin: '#bda3b7', cloth: '#1c1522', cloth2: '#8e2242', hair: '#1c1424', eye: '#c04060', horn: '#aaa08a', boot: '#0d0911', pants: '#2a2034' },
    hd2: function (c, L) {
      var v = hv(c), hw = v.hw, hh = v.hh
      if (L === 2 && !v.u) { var mx = v.side ? hw * .55 : 0; for (var i = -1; i <= 1; i++) Ln(c, '#17101c', 1.3, [mx + i * 2.4, hh * .6 - 2.4, mx + i * 2.4, hh * .6 + 2.4]) }
    },
    bd2: function (c, L) {
      if (L === 2) {
        var sw = Math.sin(c.T * 2.6 + (c.moving ? c.ph : 0)), x = (c.f === 's' ? 9 : -15) + sw * 5, y = 40 + Math.abs(sw) * -3
        Lm(c, '#b46a6a', 2.4, [c.f === 's' ? 2 : -3, 14, (c.f === 's' ? 2 : -3) + sw * 3, 26, x, y - 7])
        S(c, E(x, y, 5, 6.4), '#c88f94', { lw: 1.8, d: 1.2 }); F(c, E(x - 1.8, y - 1, .9, 1.1), '#1a0a10'); F(c, E(x + 1.8, y - 1, .9, 1.1), '#1a0a10'); Ln(c, '#6a2a34', 1.2, [x - 2, y + 2.2, x + 2, y + 2.2])
      }
    }
  })

  /* Tainted Keeper: a rusted four-barrel head, one cracked coin eye, coins leaking from the chest */
  D['tainted-keeper'] = variant('keeper', {
    pal: { skin: '#8c6444', cloth: '#6e4a32', cloth2: '#b68642', sleeve: '#7e5636', hand: '#a07a48', boot: '#3a2818', pants: '#523820' }, hdSkip: [0],
    hd2: function (c, L) {
      var v = hv(c), hw = v.hw, hh = v.hh
      if (L === 0) for (var i = 0; i < 4; i++) { var x = (v.side ? -4 : -9) + i * (v.side ? 3.4 : 6); S(c, R(x - 2, -hh - 8, 4, 9, 1), '#3a2a1e', { lw: 1.6, d: .8 }); F(c, R(x - 2.4, -hh - 9, 4.8, 2.2, .6), '#b68642') }
      if (L === 2 && !v.u) { F(c, E(-hw * .6, hh * .2, 3.4, 2), al('#7a3a20', .7)); F(c, E(hw * .5, -hh * .55, 3, 1.8), al('#7a3a20', .7)); var x2 = v.side ? hw * .22 : -hw * .42 + c.look.x * 1.4; Ln(c, '#1b1317', 1.3, [x2 + 3, hh * .08 - 5, x2 - 1, hh * .08, x2 + 2, hh * .08 + 5]) }
    },
    bd2: function (c, L) {
      if (L === 2 && c.f !== 'u') for (var i = 0; i < 2; i++) { var f = (c.T * 1.2 + i * .5) % 1; S(c, E((c.f === 's' ? 4 : 5) + i * 2, c.top + 14 + f * 30, 2.4, 2.4), '#ecc946', { lw: 1.2, d: .5 }) }
    }
  })

  /* Tainted Apollyon: a toothy maw where the void was, orbited by locusts */
  D['tainted-apollyon'] = variant('apollyon', {
    pal: { skin: '#43523f', cloth: '#161c14', cloth2: '#a4d054', eye: '#e2ff92', wing: '#a8d868', boot: '#0e120c', pants: '#2a3426', hand: '#43523f' },
    bd2: function (c, L) {
      var top = c.top, sx = c.f === 's' ? 2 : 0, cy = top + 15
      if (L === 1 && c.f !== 'u') {
        S(c, E(sx, cy, 8.6, 6.8), '#080a05', { lw: 1.9, d: 0 }); F(c, E(sx, cy + 2.4, 5, 2.4), '#9a3040')
        for (var i = 0; i < 5; i++) { var x = sx - 6 + i * 3; F(c, P([x - 1.5, cy - 4.2, x + 1.5, cy - 4.2, x, cy - 1]), '#e6e8c8'); F(c, P([x - 1.5, cy + 5, x + 1.5, cy + 5, x, cy + 2]), '#e6e8c8') }
      }
      if (L === 2) for (var k = 0; k < 4; k++) {
        var a = c.T * 1.9 + k * 1.57, x2 = Math.cos(a) * 32, y2 = -2 + Math.sin(a * 1.3) * 24, fl = Math.sin(c.T * 30 + k) * 1.4
        S(c, E(x2, y2, 3.4, 1.7), '#7aa83a', { lw: 1.2, d: .4 }); Ln(c, al('#d8f0a0', .8), 1.2, [x2 - 1, y2 - 1, x2 - 3, y2 - 4 - fl]); Ln(c, al('#d8f0a0', .8), 1.2, [x2 + 1, y2 - 1, x2 + 1, y2 - 5 + fl])
      }
    }
  })

  /* Tainted Forgotten: ash-grey bones, a cracked skull, and a small skeleton slung on his back */
  D['tainted-the-forgotten'] = variant('the-forgotten', {
    pal: { skin: '#cdc4a6', bone: '#cdc4a6', boot: '#cdc4a6', pants: '#cdc4a6', sleeve: '#cdc4a6', hand: '#cdc4a6', cloth: '#5a2a2a', cloth2: '#7e3a36', eye: '#7ab8ff' },
    hd2: function (c, L) {
      var v = hv(c), hw = v.hw, hh = v.hh
      if (L === 2 && !v.u) { Ln(c, '#2b2018', 1.4, [-hw * .3, -hh, -hw * .1, -hh * .55, -hw * .35, -hh * .35, -hw * .2, -hh * .1]); glow(c, 0, -hh - 8, 10, '#7ab8ff', .5); S(c, Q([0, -hh - 14, 3, -hh - 9, 2.4, -hh - 5, -2.4, -hh - 5, -3, -hh - 9]), '#7ab8ff', { lw: 1.3, d: .6 }) }
    },
    bd2: function (c, L) {
      var tw = c.tw, top = c.top, p = c.p, sw = sway(c, 1.5, 3), b = p.bone, side = c.f === 's', u = c.f === 'u'
      if (L === 2) {
        if (u) { S(c, R(-6, top + 3, 12, 13, 3), '#3a2e24', { lw: 1.7, d: 0 }); for (var i = 0; i < 3; i++) Ln(c, b, 2, [-5, top + 6 + i * 3.4, 5, top + 6 + i * 3.4]); Lm(c, b, 2.6, [-3, top + 16, -4 + sw * .3, top + 26]); Lm(c, b, 2.6, [3, top + 16, 4 - sw * .3, top + 26]); S(c, E(0, top + 1, 5, 4.6), b, { lw: 1.6, d: .8 }) }
        else {
          var sx = side ? -8 : -tw - 5
          S(c, E(sx, top - 3, 5.2, 4.8), b, { lw: 1.7, d: .8 }); F(c, E(sx - 1.6, top - 3, 1.2, 1.6), '#17090c'); F(c, E(sx + 1.6, top - 3, 1.2, 1.6), '#17090c')
          Lm(c, b, 2.6, [sx - 1, top + 2, sx - 4 + sw * .3, top + 12, sx - 3, top + 22]); Lm(c, b, 2.6, [sx + 2, top + 3, sx + 3 + sw * .3, top + 14, sx + 2, top + 25])
        }
      }
    }
  })

  /* Tainted Bethany: blood-red robe and bleached hair, crimson wisps, a sigil at the heart */
  D['tainted-bethany'] = variant('bethany', {
    pal: { skin: '#e0c9b9', cloth: '#7c1f2e', cloth2: '#d4a84c', hair: '#cebfb9', eye: '#c03040', boot: '#3a1a20', wisp: '#ff6a4a', book: '#e8c8a8' },
    face: { er: 3.5, mouth: 'frown', brc: '#8a6a5a' },
    hd2: function (c, L) {
      var v = hv(c), hh = v.hh, hw = v.hw
      if (L === 2 && !v.u) { var x = v.side ? hw * .35 : 0; S(c, P([x, -hh * .75, x + 2.8, -hh * .5, x, -hh * .28, x - 2.8, -hh * .5]), '#e03a4a', { lw: 1.4, d: .8 }) }
    },
    bd2: function (c, L) {
      var top = c.top, p = c.p
      if (L === 2 && c.f !== 'u') {
        var cx = c.f === 's' ? 2 : 0; stitch(c, cx, top + 17, cx, c.bot - 8, 5, '#2b1018')
        Ou(c, E(cx, top + 10, 4.4, 4.4), p.cloth2, 1.3); Ou(c, P([cx, top + 5.8, cx + 2.6, top + 13.4, cx - 4.2, top + 8.4, cx + 4.2, top + 8.4, cx - 2.6, top + 13.4]), p.cloth2, 1.1)
      }
    }
  })

  /* Tainted Jacob: Jacob stitched and pale, with a dark Esau looming behind him */
  D['jacob-t'] = variant('jacob', {
    pal: { skin: '#cbb9a9', cloth: '#3c4c5c', cloth2: '#8e8460', hair: '#8a7438', eye: '#a8c8d8', boot: '#2a1e18' },
    face: { eyes: 'hollow', er: 3.7, mouth: 'frown', brow: false },
    hd2: function (c, L) { var v = hv(c); if (L === 2 && !v.u) stitch(c, v.side ? v.hw * .1 : -v.hw * .85, v.hh * .25, v.side ? v.hw * .6 : -v.hw * .3, v.hh * .4, 4) }
  })
  D['esau-dark'] = Object.assign({}, D.esau, {
    alpha: .66, pal: { skin: '#1c1320', cloth: '#0f0a12', cloth2: '#3c1a24', hair: '#0a070c', eye: '#ff3a3a', beard: '#0a070c', boot: '#0a070c', pants: '#0f0a12', sclera: '#ff6a5a' },
    face: { eyes: 'glow', er: 3.8, brow: false, mouth: 'fang', my: .62 }, pre: function (c) { glow(c, 0, -4, 54, '#a01830', .2) }
  })
  D['tainted-jacob-and-esau'] = { group: [{ id: 'esau-dark', x: 7, s: 1.08, y: 0 }, { id: 'jacob-t', x: -9, s: .8 }] }

  /* ================================================================ registration + portraits */
  var GLOW = { isaac: '#7aa06a' }
  function reg (id) {
    var fn = function (g, size, t) { draw(g, size, t, id) }
    IS.sprites['player:' + id] = fn; IS.sprites[id] = fn
    IS.spriteAnimated('player:' + id); IS.spriteAnimated(id)
  }
  ;(IS.characters || []).forEach(function (d) { reg(d.id) })

  var cache = Object.create(null)
  function hasDoc () { return typeof document !== 'undefined' && document.createElement }
  function backdrop (g, id, size) {
    var spec = D[id] || D.isaac, col = spec.glow || (spec.pal && (spec.pal.cloth2 || spec.pal.cloth)) || '#6a5a50', r = size / 2
    var gr = g.createRadialGradient(0, -r * .1, r * .05, 0, 0, r * 1.05)
    gr.addColorStop(0, al(sh(col, .05), .62)); gr.addColorStop(.6, al(sh(col, -.45), .85)); gr.addColorStop(1, '#120d0f')
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill()
    g.lineWidth = Math.max(1.5, size * .022); g.strokeStyle = '#0e0809'; g.stroke()
  }
  function bust (g, id, size, time, locked) {
    var k = size / 100 * 1.8
    g.save(); g.beginPath(); g.arc(0, 0, size / 2, 0, TAU); g.clip()
    g.translate(0, 18 * k)
    draw(g, size * 1.8, { time: time || 0, headDir: { x: Math.sin((time || 0) * .8) * .4 + .15, y: 1 }, walkDir: { x: 0, y: 1 }, shooting: false }, id, { still: true, portrait: true })
    g.restore()
  }
  function paintPortrait (g, id, cx, cy, size, o) {
    o = o || {}
    g.save(); g.translate(cx, cy)
    if (o.locked) {
      g.fillStyle = '#17120f'; g.beginPath(); g.arc(0, 0, size / 2, 0, TAU); g.fill()
      g.lineWidth = Math.max(1.5, size * .022); g.strokeStyle = '#0e0809'; g.stroke()
      var sil = hasDoc() ? silhouette(id, size) : null
      if (sil) g.drawImage(sil, -size / 2, -size / 2, size, size)
      g.fillStyle = '#6a5a50'; g.font = 'bold ' + Math.round(size * .42) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, size * .02)
    } else { backdrop(g, id, size); bust(g, id, size, o.time || 0) }
    g.restore()
  }
  function silhouette (id, size) {
    var key = 'sil|' + id + '|' + size; if (cache[key]) return cache[key]
    var s = Math.max(8, Math.round(size)), cv = document.createElement('canvas'); cv.width = cv.height = s
    var g = cv.getContext('2d'); g.translate(s / 2, s / 2); bust(g, id, s, 0)
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#050304'; g.fillRect(0, 0, s, s)
    return (cache[key] = cv)
  }
  IS.portraitCanvas = function (id, size, locked) {
    if (!hasDoc()) return null
    var s = Math.max(8, Math.round(size || 96)), key = id + '|' + s + '|' + (locked ? 1 : 0)
    if (cache[key]) return cache[key]
    var cv = document.createElement('canvas'); cv.width = cv.height = s
    paintPortrait(cv.getContext('2d'), id, s / 2, s / 2, s, { locked: !!locked, time: 0 })
    return (cache[key] = cv)
  }
  IS.drawPortrait = function (g, charId, cx, cy, size, opts) {
    opts = opts || {}
    if (!g) return
    if (opts.time == null || opts.static) {
      var cv = IS.portraitCanvas(charId, size, opts.locked)
      if (cv) { g.drawImage(cv, cx - size / 2, cy - size / 2, size, size); return }
    }
    paintPortrait(g, charId, cx, cy, size, opts)
  }
  IS.playerArt = { specs: D, draw: draw }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
