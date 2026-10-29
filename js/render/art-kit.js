;(function (IS) {
  'use strict'
  /*
   * Procedural art kit shared by the boss, player and backdrop painters.
   * Everything draws in a 100-unit sprite space (centre 0,0; a boss body is
   * roughly +-45). A.begin() is called by the sprite wrapper and publishes the
   * animation state (time, windup charge, damage fraction) so the helpers
   * (eyes, mouths) can react without every sprite threading it through.
   * No offscreen canvases are allocated per frame; the hurt-flash canvas is a
   * single shared one that only ever grows.
   */
  var TAU = Math.PI * 2
  var A = IS.art = { T: 0, ch: 0, hp: 1, lw: 2.2, frame: 0 }

  function sh (c, a) {
    /* own shade: IS.shade can overflow a channel past 255 and emit an invalid colour */
    var q = IS.hexToRgb(c), f = a < 0 ? 1 + a : 1, add = a > 0 ? 255 * a : 0
    function ch (v) { v = Math.round(v * f + add); return (v < 0 ? 0 : v > 255 ? 255 : v).toString(16).padStart(2, '0') }
    return '#' + ch(q.r) + ch(q.g) + ch(q.b)
  }
  function mix (a, b, t) { return IS.mix(a, b, t) }
  function al (c, a) { return IS.alpha(c, a) }
  A.sh = sh; A.mix = mix; A.al = al
  A.rnd = function (i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
  A.clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v }

  A.begin = function (t) {
    A.T = +t.time || 0; A.frame = t.frame | 0
    A.ch = A.clamp01(+t.charge || 0); A.hp = t.hp01 == null ? 1 : t.hp01
    A.lw = 2.2
  }

  /* ---- basic solids -------------------------------------------------- */
  A.ball = function (g, x, y, rx, ry, c, o) {
    o = o || {}
    g.beginPath(); g.ellipse(x, y, Math.abs(rx), Math.abs(ry), o.rot || 0, 0, TAU)
    var m = Math.max(rx, ry)
    var gr = g.createRadialGradient(x - rx * .35, y - ry * .42, m * .08, x, y, m * 1.08)
    gr.addColorStop(0, sh(c, .3)); gr.addColorStop(.5, c); gr.addColorStop(1, sh(c, -.42))
    g.fillStyle = gr; g.fill()
    if (o.ol !== false) { g.lineWidth = o.lw || A.lw; g.strokeStyle = o.ol || sh(c, -.7); g.stroke() }
  }
  A.flat = function (g, x, y, rx, ry, c, rot) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); g.fill() }
  A.poly = function (g, p, c, o) {
    o = o || {}
    g.beginPath(); g.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath()
    g.fillStyle = c; g.fill()
    if (o.ol !== false) { g.lineJoin = 'round'; g.lineWidth = o.lw || A.lw; g.strokeStyle = o.ol || sh(c, -.65); g.stroke() }
  }
  A.line = function (g, c, w, p) {
    g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'
    g.beginPath(); g.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke()
  }
  A.rect = function (g, x, y, w, h, c, r) {
    g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r == null ? 3 : r); else g.rect(x, y, w, h)
    g.fillStyle = c; g.fill(); g.lineWidth = A.lw; g.strokeStyle = sh(c, -.65); g.stroke()
  }
  /* closed smooth path through points (midpoint quadratic) */
  function smooth (g, pts) {
    var n = pts.length / 2, i
    g.beginPath()
    g.moveTo((pts[0] + pts[(n - 1) * 2]) / 2, (pts[1] + pts[(n - 1) * 2 + 1]) / 2)
    for (i = 0; i < n; i++) {
      var j = (i + 1) % n
      g.quadraticCurveTo(pts[i * 2], pts[i * 2 + 1], (pts[i * 2] + pts[j * 2]) / 2, (pts[i * 2 + 1] + pts[j * 2 + 1]) / 2)
    }
    g.closePath()
  }
  /* lumpy living blob: radius wobbles with time so it breathes */
  A.blob = function (g, x, y, rx, ry, c, o) {
    o = o || {}
    var n = o.n || 12, wob = o.wob == null ? .07 : o.wob, seed = o.seed || 0, sp = o.sp == null ? 1.6 : o.sp, pts = [], i, a, r
    for (i = 0; i < n; i++) {
      a = i / n * TAU
      r = 1 + wob * (Math.sin(a * 3 + seed * 2.1 + A.T * sp) + .7 * Math.sin(a * 5 + seed * 3.7 - A.T * sp * .8) + .5 * (A.rnd(seed * 31 + i) - .5) * 2)
      pts.push(x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r)
    }
    smooth(g, pts)
    var m = Math.max(rx, ry), gr = g.createRadialGradient(x - rx * .35, y - ry * .45, m * .1, x, y, m * 1.15)
    gr.addColorStop(0, sh(c, .3)); gr.addColorStop(.5, c); gr.addColorStop(1, sh(c, -.45))
    g.fillStyle = gr; g.fill()
    g.lineJoin = 'round'; g.lineWidth = o.lw || A.lw; g.strokeStyle = o.ol || sh(c, -.7); g.stroke()
    return pts
  }

  /* ---- face parts ---------------------------------------------------- */
  A.eye = function (g, x, y, r, o) {
    o = o || {}
    var sc = o.sc || '#f1e8d6', ch = A.ch, T = A.T
    var lx = o.lx != null ? o.lx : Math.cos(T * .8 + x * .3) * .35, ly = o.ly != null ? o.ly : Math.sin(T * 1.1 + y * .2) * .2
    var ry = r * (o.sq || 1)
    A.ball(g, x, y, r, ry, sc, { ol: o.ol })
    if (o.red) { g.strokeStyle = al('#b0242c', .55); g.lineWidth = .8; for (var i = 0; i < 5; i++) { var a = i * 1.26 + 4; g.beginPath(); g.moveTo(x + Math.cos(a) * r * .95, y + Math.sin(a) * ry * .95); g.lineTo(x + Math.cos(a + .2) * r * .5, y + Math.sin(a + .2) * ry * .5); g.stroke() } }
    var ic = o.col || '#4a3a2c'
    if (ch > 0 && o.react !== false) ic = mix(ic, o.hot || '#ff4a2a', ch)
    var px = x + lx * r * .45, py = y + ly * ry * .45
    A.flat(g, px, py, r * (o.ir || .62), ry * (o.ir || .62), ic)
    A.flat(g, px, py, r * (.3 + ch * .12) * (o.pu || 1), ry * (.3 + ch * .12) * (o.pu || 1), '#120a0c')
    A.flat(g, px - r * .2, py - ry * .22, r * .13, ry * .13, '#ffffff')
    var lid = o.lid != null ? o.lid : 0
    if (lid > .01 || o.lc) {
      g.save(); g.beginPath(); g.ellipse(x, y, r, ry, 0, 0, TAU); g.clip()
      g.fillStyle = o.lc || '#8a6a5a'; g.fillRect(x - r - 1, y - ry - 1, r * 2 + 2, ry * 2 * lid + 1)
      g.restore(); A.line(g, sh(o.lc || '#8a6a5a', -.6), A.lw * .8, [x - r, y - ry + ry * 2 * lid, x + r, y - ry + ry * 2 * lid])
    }
    g.beginPath(); g.ellipse(x, y, r, ry, 0, 0, TAU); g.lineWidth = A.lw * .9; g.strokeStyle = o.ol || '#2a1519'; g.stroke()
  }
  /* round black eye (soulless) with a glint */
  A.dot = function (g, x, y, r, c, glow) {
    if (glow) A.flat(g, x, y, r * 1.5, r * 1.5, al(glow, .35 + A.ch * .3))
    A.flat(g, x, y, r, r * 1.15, c || '#0f0809'); A.flat(g, x - r * .3, y - r * .35, r * .25, r * .25, '#fff')
  }
  A.brow = function (g, x1, y1, x2, y2, c, w) { A.line(g, c || '#2a1519', w || 3, [x1, y1, x2, y2]) }
  A.mouth = function (g, x, y, w, h, o) {
    o = o || {}
    var inner = o.col || '#2b0b12', tn = o.tongue || '#c4505e', tc = o.teeth || '#ece0c4', n = o.n == null ? 6 : o.n
    g.save(); g.beginPath(); g.ellipse(x, y, w, Math.max(.5, h), 0, 0, TAU); g.clip()
    var gr = g.createRadialGradient(x, y, 1, x, y, w); gr.addColorStop(0, sh(inner, .1)); gr.addColorStop(1, sh(inner, -.5))
    g.fillStyle = gr; g.fillRect(x - w, y - h, w * 2, h * 2)
    if (o.tongue !== false && h > 3) A.flat(g, x + (o.tx || 0), y + h * .55, w * .55, h * .5, tn)
    g.fillStyle = tc
    for (var i = 0; i < n; i++) {
      var px = x - w + (i + .5) * (w * 2 / n), tl = h * (o.tl || .5)
      g.beginPath(); g.moveTo(px - w / n * .45, y - h - 1); g.lineTo(px + w / n * .45, y - h - 1); g.lineTo(px, y - h + tl); g.fill()
      if (!o.top) { g.beginPath(); g.moveTo(px - w / n * .45, y + h + 1); g.lineTo(px + w / n * .45, y + h + 1); g.lineTo(px, y + h - tl * .9); g.fill() }
    }
    g.restore()
    g.beginPath(); g.ellipse(x, y, w, Math.max(.5, h), 0, 0, TAU); g.lineWidth = A.lw; g.strokeStyle = o.ol || '#1e080c'; g.stroke()
  }
  A.stitches = function (g, x1, y1, x2, y2, n, c, len) {
    var dx = x2 - x1, dy = y2 - y1, l = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / l, ny = dx / l
    A.line(g, c || '#2a1519', 1.4, [x1, y1, x2, y2])
    for (var i = 0; i <= n; i++) { var px = x1 + dx * i / n, py = y1 + dy * i / n; A.line(g, c || '#2a1519', 1.4, [px - nx * (len || 3), py - ny * (len || 3), px + nx * (len || 3), py + ny * (len || 3)]) }
  }
  A.blush = function (g, x, y, r, c) { A.flat(g, x, y, r, r * .6, al(c || '#d04a5a', .45)) }
  A.tears = function (g, x, y, len, c) {
    var f = (A.T * 1.6) % 1
    g.fillStyle = al(c || '#8fc4de', .85)
    g.beginPath(); g.moveTo(x - 1.6, y); g.lineTo(x + 1.6, y); g.lineTo(x + 2.4, y + len); g.lineTo(x - 2.4, y + len); g.fill()
    A.flat(g, x, y + len * (.3 + f * .7), 2.2, 3, '#d9f0fa')
  }

  /* ---- organic limbs and ornaments ----------------------------------- */
  /* tapered wavy tentacle; returns tip */
  A.tent = function (g, x, y, ang, len, w, c, o) {
    o = o || {}
    var N = 10, ph = o.ph || 0, amp = o.amp == null ? 6 : o.amp, sp = o.sp || 3, pts = [], i, ca = Math.cos(ang), sa = Math.sin(ang)
    for (i = 0; i <= N; i++) {
      var f = i / N, off = Math.sin(A.T * sp + ph + f * 3.2) * amp * f * (1 + A.ch * (o.rage || 0))
      pts.push(x + ca * len * f - sa * off, y + sa * len * f + ca * off)
    }
    for (var pass = 0; pass < 2; pass++) for (i = 0; i < N; i++) {
      var tw = w * (1 - i / N * (o.taper == null ? .8 : o.taper))
      g.strokeStyle = pass ? c : sh(c, -.7); g.lineWidth = pass ? tw : tw + A.lw * 1.4; g.lineCap = 'round'
      g.beginPath(); g.moveTo(pts[i * 2], pts[i * 2 + 1]); g.lineTo(pts[i * 2 + 2], pts[i * 2 + 3]); g.stroke()
    }
    if (o.hi) A.line(g, al(sh(c, .4), .5), w * .22, [pts[0], pts[1] - w * .2, pts[6], pts[7] - w * .15, pts[10], pts[11] - w * .1])
    return { x: pts[N * 2], y: pts[N * 2 + 1], a: ang }
  }
  /* two-joint limb (spider leg, arm) */
  A.leg = function (g, x1, y1, x2, y2, x3, y3, w, c) {
    for (var pass = 0; pass < 2; pass++) {
      g.strokeStyle = pass ? c : sh(c, -.7); g.lineWidth = pass ? w : w + A.lw * 1.3; g.lineCap = 'round'; g.lineJoin = 'round'
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); g.stroke()
    }
  }
  A.horn = function (g, x, y, ang, len, w, c, curl) {
    curl = curl == null ? .5 : curl
    var ca = Math.cos(ang), sa = Math.sin(ang), nx = -sa, ny = ca
    var mx = x + ca * len * .55 + nx * len * curl * .5, my = y + sa * len * .55 + ny * len * curl * .5
    var tx = x + ca * len + nx * len * curl, ty = y + sa * len + ny * len * curl
    g.beginPath(); g.moveTo(x - nx * w / 2, y - ny * w / 2)
    g.quadraticCurveTo(mx - nx * w * .3, my - ny * w * .3, tx, ty)
    g.quadraticCurveTo(mx + nx * w * .3, my + ny * w * .3, x + nx * w / 2, y + ny * w / 2); g.closePath()
    var gr = g.createLinearGradient(x - nx * w, y - ny * w, x + nx * w, y + ny * w)
    gr.addColorStop(0, sh(c, .25)); gr.addColorStop(1, sh(c, -.35)); g.fillStyle = gr; g.fill()
    g.lineJoin = 'round'; g.lineWidth = A.lw; g.strokeStyle = sh(c, -.7); g.stroke()
    A.line(g, al(sh(c, -.4), .5), 1, [x + ca * len * .15, y + sa * len * .15, mx, my])
  }
  A.spikes = function (g, x, y, r, n, len, c, rot) {
    for (var i = 0; i < n; i++) {
      var a = (rot || 0) + i / n * TAU, w = .13
      A.poly(g, [x + Math.cos(a - w) * r, y + Math.sin(a - w) * r, x + Math.cos(a) * (r + len), y + Math.sin(a) * (r + len), x + Math.cos(a + w) * r, y + Math.sin(a + w) * r], c)
    }
  }
  A.veins = function (g, x, y, r, c, n, seed) {
    g.lineCap = 'round'
    for (var i = 0; i < n; i++) {
      var a = A.rnd(seed + i * 3) * TAU, l = r * (.45 + A.rnd(seed + i * 7) * .5), mx = x + Math.cos(a) * l * .5, my = y + Math.sin(a) * l * .5
      var bx = mx + Math.cos(a + .9) * l * .3, by = my + Math.sin(a + .9) * l * .3
      A.line(g, al(c, .6), 1.4, [x + Math.cos(a) * r * .12, y + Math.sin(a) * r * .12, mx + Math.sin(a) * 2, my - Math.cos(a) * 2, x + Math.cos(a) * l, y + Math.sin(a) * l])
      A.line(g, al(c, .45), 1, [mx, my, bx, by])
    }
  }
  A.warts = function (g, x, y, r, n, c, seed) {
    for (var i = 0; i < n; i++) {
      var a = A.rnd(seed + i * 5) * TAU, d = r * (.3 + A.rnd(seed + i * 11) * .6), s = 1.8 + A.rnd(seed + i * 13) * 2.6
      A.ball(g, x + Math.cos(a) * d, y + Math.sin(a) * d * .85, s, s * .85, c, { lw: 1.2 })
    }
  }
  A.crack = function (g, x, y, len, ang, c) {
    var p = [x, y], px = x, py = y, i
    for (i = 1; i <= 4; i++) { px += Math.cos(ang + (A.rnd(x * 7 + i + len) - .5) * 1.4) * len / 4; py += Math.sin(ang + (A.rnd(y * 5 + i * 2 + len) - .5) * 1.4) * len / 4; p.push(px, py) }
    A.line(g, '#2a0d12', 1.8, p); A.line(g, al('#a02830', .6), .8, p)
  }
  A.drip = function (g, x, y, len, c, w) {
    var f = (A.T * .9 + x * .13) % 1
    g.fillStyle = c; g.beginPath(); g.moveTo(x - (w || 2), y); g.lineTo(x + (w || 2), y); g.lineTo(x + (w || 2) * .6, y + len * (.5 + f * .5)); g.lineTo(x - (w || 2) * .6, y + len * (.5 + f * .5)); g.fill()
    A.flat(g, x, y + len * (.5 + f * .5), (w || 2) * .9, (w || 2) * 1.1, c)
  }
  A.fly = function (g, x, y, sz, ph) {
    var f = Math.sin(A.T * 40 + (ph || 0)) * .5 + .5
    g.fillStyle = 'rgba(220,232,240,.7)'
    A.flat(g, x - sz * .55, y - sz * .55, sz * .55, sz * (.25 + f * .3), 'rgba(220,232,240,.7)', -.6)
    A.flat(g, x + sz * .55, y - sz * .55, sz * .55, sz * (.25 + f * .3), 'rgba(220,232,240,.7)', .6)
    A.ball(g, x, y, sz * .6, sz * .75, '#3a3338', { lw: 1 })
    A.flat(g, x - sz * .25, y - sz * .45, sz * .22, sz * .22, '#d23a32'); A.flat(g, x + sz * .25, y - sz * .45, sz * .22, sz * .22, '#d23a32')
  }
  A.flies = function (g, n, rad, sz, spd, cy) {
    for (var i = 0; i < n; i++) {
      var a = A.T * (spd || 2) + i / n * TAU, rr = rad * (.8 + .25 * Math.sin(A.T * 3 + i * 2))
      A.fly(g, Math.cos(a) * rr, (cy || 0) + Math.sin(a * 1.3) * rr * .6, sz, i)
    }
  }
  A.heart = function (g, x, y, w, h, c, o) {
    g.beginPath(); g.moveTo(x, y + h * .5)
    g.bezierCurveTo(x - w * 1.15, y + h * .05, x - w * .95, y - h * .75, x, y - h * .28)
    g.bezierCurveTo(x + w * .95, y - h * .75, x + w * 1.15, y + h * .05, x, y + h * .5)
    var gr = g.createRadialGradient(x - w * .3, y - h * .3, 2, x, y, Math.max(w, h))
    gr.addColorStop(0, sh(c, .3)); gr.addColorStop(.55, c); gr.addColorStop(1, sh(c, -.45))
    g.fillStyle = gr; g.fill(); g.lineJoin = 'round'; g.lineWidth = A.lw * 1.1; g.strokeStyle = (o && o.ol) || sh(c, -.7); g.stroke()
  }
  A.skull = function (g, x, y, r, c, o) {
    o = o || {}
    A.ball(g, x, y - r * .1, r, r * .9, c)
    A.rect(g, x - r * .55, y + r * .45, r * 1.1, r * .55, sh(c, -.08), 2)
    g.fillStyle = '#17090c'
    var ec = o.eyec
    A.flat(g, x - r * .38, y - r * .05, r * .26, r * .3, '#17090c'); A.flat(g, x + r * .38, y - r * .05, r * .26, r * .3, '#17090c')
    if (ec) { var k = .5 + A.ch * .5; A.flat(g, x - r * .38, y - r * .05, r * .11 * k * 2, r * .11 * k * 2, ec); A.flat(g, x + r * .38, y - r * .05, r * .11 * k * 2, r * .11 * k * 2, ec) }
    A.poly(g, [x - r * .08, y + r * .22, x + r * .08, y + r * .22, x, y + r * .38], '#17090c', { ol: false })
    for (var i = -2; i <= 2; i++) A.line(g, '#17090c', 1, [x + i * r * .2, y + r * .62, x + i * r * .2, y + r * .98])
  }
  A.wing = function (g, x, y, len, ang, c, o) {
    o = o || {}
    var flap = o.flap == null ? Math.sin(A.T * (o.sp || 3)) * .12 : o.flap, dir = o.dir || 1
    g.save(); g.translate(x, y); g.scale(dir, 1); g.rotate(ang + flap)
    if (o.feather) {
      for (var i = 4; i >= 0; i--) { g.save(); g.rotate(-i * .16 + .25); A.ball(g, len * .45, 0, len * .5, len * .12, sh(c, -i * .04)); g.restore() }
    } else {
      var tip = [len, -len * .1, len * .95, len * .35, len * .6, len * .55, len * .3, len * .4]
      var pts = [0, 0, len * .3, -len * .45, len * .75, -len * .55, len, -len * .1, len * .9, len * .22, len * .72, len * .1, len * .58, len * .5, len * .4, len * .22, len * .2, len * .42, 0, len * .15]
      A.poly(g, pts, c)
      A.line(g, sh(c, -.6), 2.2, [0, 0, len * .3, -len * .45, len * .75, -len * .55, len, -len * .1])
      A.line(g, sh(c, -.5), 1.4, [len * .3, -len * .45, len * .58, len * .5]); A.line(g, sh(c, -.5), 1.4, [len * .55, -len * .5, len * .4, len * .22])
    }
    g.restore()
  }
  A.glow = function (g, x, y, r, c, a) {
    var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, al(c, a == null ? .5 : a)); gr.addColorStop(1, al(c, 0))
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2)
  }
  A.halo = function (g, x, y, rx, ry, c) {
    g.strokeStyle = al(c || '#f3d86a', .35); g.lineWidth = 6; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.stroke()
    g.strokeStyle = c || '#f3d86a'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.stroke()
  }
  A.crown = function (g, x, y, w, h, c) {
    A.poly(g, [x - w, y, x - w, y - h * .5, x - w * .5, y - h * .1, x, y - h, x + w * .5, y - h * .1, x + w, y - h * .5, x + w, y], c)
    A.flat(g, x, y - h * .35, 2.4, 2.4, '#d83a4a')
  }
  A.hand = function (g, x, y, r, c, ang, o) {
    o = o || {}
    g.save(); g.translate(x, y); g.rotate(ang || 0)
    var curl = o.curl == null ? .3 : o.curl
    for (var i = -2; i <= 2; i++) A.ball(g, i * r * .38, -r * (.75 + .2 * (1 - Math.abs(i) / 2)) * (1 - curl * .4), r * .22, r * .55, c, { lw: 1.4 })
    A.ball(g, 0, 0, r * .85, r * .75, c); A.ball(g, -r * .95, r * .1, r * .22, r * .5, c, { lw: 1.4, rot: -.6 })
    g.restore()
  }

  /* ---- sprite registration ------------------------------------------- */
  var fc = null, fg = null
  function flashCanvas (n) {
    if (typeof document === 'undefined' || !document.createElement) return null
    if (!fc) { fc = document.createElement('canvas'); fg = fc.getContext('2d') }
    if (fc.width < n) { fc.width = fc.height = n } else { fg.setTransform(1, 0, 0, 1, 0, 0); fg.clearRect(0, 0, fc.width, fc.height) }
    return fc
  }
  /* wounds appear as the boss loses health; drawn after the bespoke body */
  A.wounds = function (g, R) {
    var hp = A.hp, r = R || 30
    if (hp < .66) { A.crack(g, -r * .35, -r * .5, r * .5, 1.9); A.crack(g, r * .4, r * .1, r * .45, .5) }
    if (hp < .33) { A.crack(g, r * .1, -r * .6, r * .55, 1.2); g.fillStyle = al('#7a1a22', .75); A.flat(g, -r * .5, r * .25, r * .14, r * .22, al('#7a1a22', .75)); A.drip(g, -r * .5, r * .25, 12, '#8a1a24', 2.2) }
  }
  /*
   * Register a unit-space painter as a sprite. Direct assignment (not
   * IS.defineSprite) so the bespoke art deliberately replaces any earlier
   * generic sprite with the same id.
   */
  A.register = function (name, fn, opt) {
    opt = opt || {}
    var prior = IS.sprites[name]
    var painter = function (g, s, t) {
      var k = s / 100
      A.begin(t)
      if (t.hurt) {
        var pad = Math.ceil(s * 2.2), cv = flashCanvas(pad)
        if (cv) {
          fg.save(); fg.translate(pad / 2, pad / 2); fg.scale(k, k); fn(fg, t, A)
          if (!opt.noWounds) A.wounds(fg, opt.R)
          fg.restore(); fg.globalCompositeOperation = 'source-atop'; fg.fillStyle = 'rgba(255,244,236,.62)'; fg.fillRect(0, 0, pad, pad); fg.globalCompositeOperation = 'source-over'
          g.drawImage(cv, 0, 0, pad, pad, -pad / 2, -pad / 2, pad, pad)
          return
        }
      }
      g.save(); g.scale(k, k); fn(g, t, A); if (!opt.noWounds) A.wounds(g, opt.R); g.restore()
    }
    IS.sprites[name] = painter
    IS.spriteAnimated(name)
  }
  /* The default palette helper: ignore the engine's placeholder white tint. */
  A.tint = function (t, base) { return t && t.tint && !/^#f{3,6}$/i.test(t.tint) ? t.tint : base }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
