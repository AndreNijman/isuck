;(function (IS) {
  'use strict'
  /*
   * Bespoke boss painters, part 1 (Basement through Caves). Every boss id in
   * IS.bosses gets its own composition. House style for all bosses: top-down
   * three-quarter view, heavy dark outline (3 units), chunky two-tone shading
   * lit from the top-left, grimy earth palettes with one sickly accent colour,
   * and glowing lamp-eyes with slit pupils instead of cartoon faces. Shared
   * helpers (solid, plate, lamp, gear...) are exported on IS.bossArt for part 2.
   * All painters draw in 100-unit space via IS.art (art-kit.js) and react to
   * charge (windup telegraph), hp01, hurt and time.
   */
  var A = IS.art, sh = A.sh, mix = A.mix, al = A.al, TAU = Math.PI * 2
  var B = IS.bossArt = IS.bossArt || {}
  /* restyled bosses use a thicker outline than the kit default */
  function reg (id, fn, o) { A.register(id, function (g, t) { A.lw = 3; return fn(g, t) }, o) }
  B.reg = reg

  /* ---- shared helpers ------------------------------------------------ */
  /* two-tone shaded polygon with a heavy outline */
  function solid (g, p, c, o) {
    o = o || {}
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, i
    for (i = 0; i < p.length; i += 2) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]) }
    var gr = g.createLinearGradient(x0, y0, x1, y1)
    gr.addColorStop(0, sh(c, .22)); gr.addColorStop(.5, c); gr.addColorStop(1, sh(c, -.4))
    g.beginPath(); g.moveTo(p[0], p[1]); for (i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath()
    g.fillStyle = gr; g.fill()
    g.lineJoin = 'round'; g.lineWidth = o.lw || 3; g.strokeStyle = o.ol || sh(c, -.72); g.stroke()
  }
  /* rounded slab with optional corner bolts */
  function plate (g, x, y, w, h, c, o) {
    o = o || {}
    var r = o.r == null ? 5 : o.r
    g.beginPath()
    if (g.roundRect) g.roundRect(x - w / 2, y - h / 2, w, h, r); else g.rect(x - w / 2, y - h / 2, w, h)
    var gr = g.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2)
    gr.addColorStop(0, sh(c, .22)); gr.addColorStop(.5, c); gr.addColorStop(1, sh(c, -.4))
    g.fillStyle = gr; g.fill(); g.lineWidth = o.lw || 3; g.strokeStyle = sh(c, -.72); g.stroke()
    if (o.bolts) for (var i = 0; i < 4; i++) A.flat(g, x + (i % 2 ? 1 : -1) * (w / 2 - 5), y + (i < 2 ? -1 : 1) * (h / 2 - 5), 1.7, 1.7, sh(c, -.55))
  }
  /* glowing lamp-eye: dark socket, hot iris, slit pupil; flares with the windup */
  function lamp (g, x, y, r, c, o) {
    o = o || {}
    var ch = A.ch, sq = o.sq || 1.12, hz = o.hz
    A.glow(g, x, y, r * 2.4, c, .28 + ch * .35)
    A.ball(g, x, y, r * 1.12, r * sq, '#1c1216', { lw: o.lw || 2.4 })
    var ir = r * (.78 + ch * .12)
    A.flat(g, x, y, ir, ir * sq, mix(c, '#ffffff', ch * .3))
    if (hz) A.flat(g, x, y, ir * .85, ir * .2, '#140a0c'); else A.flat(g, x, y, ir * .22, ir * .85 * sq, '#140a0c')
    A.flat(g, x - r * .3, y - r * .35, r * .2, r * .16, '#fff')
  }
  function gear (g, x, y, r, n, c) {
    var p = [], i, a, w = TAU / n * .22
    for (i = 0; i < n; i++) { a = i / n * TAU; p.push(x + Math.cos(a - w * 1.6) * r * .82, y + Math.sin(a - w * 1.6) * r * .82, x + Math.cos(a - w) * r, y + Math.sin(a - w) * r, x + Math.cos(a + w) * r, y + Math.sin(a + w) * r, x + Math.cos(a + w * 1.6) * r * .82, y + Math.sin(a + w * 1.6) * r * .82) }
    solid(g, p, c, { lw: 2.4 }); A.flat(g, x, y, r * .32, r * .32, '#17100e')
  }
  function rivets (g, pts, c) { for (var i = 0; i < pts.length; i += 2) { A.flat(g, pts[i], pts[i + 1], 1.9, 1.9, sh(c, -.6)); A.flat(g, pts[i] - .5, pts[i + 1] - .6, .8, .8, sh(c, .5)) } }
  function gloss (g, x, y, rx, ry, rot) { A.flat(g, x, y, rx, ry, al('#ffffff', .32), rot == null ? -.5 : rot) }
  B.solid = solid; B.plate = plate; B.lamp = lamp; B.gear = gear; B.rivets = rivets; B.gloss = gloss

  /* ---- Monstro family: armoured ram-husk charger ---------------------- */
  function ramhusk (c, o) {
    o = o || {}
    return function (g, t) {
      var ch = A.ch, br = Math.sin(A.T * 2.4)
      for (var q = -1; q <= 1; q += 2) { A.leg(g, q * 28, 22, q * 44, 30, q * 42, 46, 10, sh(c, -.3)); A.ball(g, q * 42, 47, 9, 5.5, sh(c, -.5), { lw: 2 }) }
      g.save(); g.translate(0, ch * 5); g.scale(1 + ch * .06, 1 - ch * .06 + br * .01)
      solid(g, [-46, 8, -38, -22, -16, -36, 16, -36, 38, -22, 46, 8, 38, 38, 0, 44, -38, 38], c)
      for (var i = 0; i < 3; i++) A.line(g, al(sh(c, -.6), .8), 3.4, [-32, -18 + i * 13, 0, -26 + i * 13, 32, -18 + i * 13])
      for (i = -2; i <= 2; i++) { var sx = i * 12, sy = -33 + Math.abs(i) * 2.5, sl = (o.horns ? 20 : 13) - Math.abs(i) * 2; A.poly(g, [sx - 6, sy, sx + 6, sy, sx, sy - sl], o.horns ? '#d8c9a8' : sh(c, -.25)) }
      A.poly(g, [-34, -6, -6, 4, -6, 10, -32, 0], sh(c, -.45)); A.poly(g, [34, -6, 6, 4, 6, 10, 32, 0], sh(c, -.45))
      lamp(g, -16, 10, 6.5, o.eye || '#e8c040'); lamp(g, 16, 10, 6.5, o.eye || '#e8c040')
      if (o.third) lamp(g, 0, -10, 5, '#ff4a3a')
      solid(g, [-28, 22, 28, 22, 22, 38, -22, 38], sh(c, -.25))
      A.mouth(g, 0, 29, 20, 3 + ch * 8, { n: 7, tl: .55, col: '#1a0a0c', tongue: false })
      A.horn(g, -26, 32, -2.2, 24, 10, '#d8c9a8', -.35); A.horn(g, 26, 32, -.94, 24, 10, '#d8c9a8', .35)
      g.restore()
    }
  }
  reg('monstro', ramhusk('#8a7a64'))
  reg('monstro-ii', ramhusk('#9a3a34', { horns: true, third: true, eye: '#ff7a3a' }))

  /* ---- Larry Jr. family: lamprey-mouthed worm heads ------------------- */
  function sucker (g, x, y, R, n, lip, tooth, ch) {
    A.ball(g, x, y, R, R * .94, lip)
    var h = R * (.62 + ch * .14), i, a, w
    A.flat(g, x, y, h, h * .94, '#1a0a0e')
    for (i = 0; i < n; i++) {
      a = i / n * TAU + A.T * .5; w = .17
      A.poly(g, [x + Math.cos(a - w) * h, y + Math.sin(a - w) * h * .94, x + Math.cos(a + w) * h, y + Math.sin(a + w) * h * .94, x + Math.cos(a) * h * .28, y + Math.sin(a) * h * .26], tooth, { lw: 1, ol: sh(tooth, -.55) })
    }
    g.beginPath(); g.ellipse(x, y, h, h * .94, 0, 0, TAU); g.lineWidth = 2.2; g.strokeStyle = '#1a0a0e'; g.stroke()
  }
  function wormHead (c, o) {
    o = o || {}
    return function (g, t) {
      var ch = A.ch, br = Math.sin(A.T * 3) * 1.5, i
      if (o.frill) for (i = -5; i <= 5; i++) { var fa = -1.57 + i * .3, fl = 50 - Math.abs(i) * 1.5; A.poly(g, [Math.cos(fa - .13) * 30, -2 + Math.sin(fa - .13) * 30, Math.cos(fa) * fl, -2 + Math.sin(fa) * fl, Math.cos(fa + .13) * 30, -2 + Math.sin(fa + .13) * 30], '#c8a23a') }
      if (o.twigs) for (i = -2; i <= 2; i++) { A.line(g, '#4a3420', 3.4, [i * 10, -28 + br, i * 14, -42 + br, i * 14 + (i % 2 ? 7 : -7), -52 + br]); A.line(g, '#4a3420', 2.2, [i * 14, -42 + br, i * 14 + (i % 2 ? -6 : 6), -50 + br]) }
      A.ball(g, 0, -2 + br, 36, 34, c)
      for (i = 0; i < 3; i++) { A.line(g, al(sh(c, -.6), .8), 2.4, [-33, -12 + i * 6, -28, -8 + i * 6]); A.line(g, al(sh(c, -.6), .8), 2.4, [33, -12 + i * 6, 28, -8 + i * 6]) }
      if (o.bone) { A.crack(g, -20, -26 + br, 16, 1.3); A.crack(g, 22, -22 + br, 14, 1.7) }
      if (o.moss) A.warts(g, 0, -10, 30, 6, '#6a8a3a', 11)
      lamp(g, -17, -20 + br, o.bone ? 7.5 : 5.8, o.eye); lamp(g, 17, -20 + br, o.bone ? 7.5 : 5.8, o.eye)
      sucker(g, 0, 11 + br, 22 + (o.big || 0) + ch * 3, o.n || 14, o.lip || sh(c, .12), o.tooth || '#e8dcc0', ch)
    }
  }
  reg('larry-jr', wormHead('#7a8a3c', { eye: '#e0d040' }))
  reg('chub', wormHead('#c8a284', { eye: '#c84a3a', big: 3, n: 18, lip: '#b86a64' }))
  reg('the-hollow', wormHead('#c4b8a0', { eye: '#ff7a4a', bone: true, lip: '#8a7a66', tooth: '#efe6d0' }))
  reg('carrion-queen', wormHead('#6a5a48', { eye: '#e8d84a', frill: true, tooth: '#e8c860', lip: '#8a4a3a' }))
  reg('wormwood', wormHead('#6a4c30', { eye: '#c8e048', twigs: true, moss: true, lip: '#8a6a3a' }))
  /* body of Larry and the other chain worms: banded armoured segments */
  function segment (c0) {
    return function (g, t) {
      var c = A.tint(t, c0), pulse = 1 + Math.sin(A.T * 5 + (t.frame | 0) * .7) * .04
      A.ball(g, 0, 0, 43 * pulse, 41 * pulse, c)
      g.save(); g.beginPath(); g.ellipse(0, 0, 43 * pulse, 41 * pulse, 0, 0, TAU); g.clip()
      for (var i = -1; i <= 1; i++) A.line(g, al(sh(c, -.6), .75), 3.4, [-44, i * 19 - 5, -22, i * 19 + 2, 0, i * 19 + 5, 22, i * 19 + 2, 44, i * 19 - 5])
      for (i = -2; i <= 2; i++) A.flat(g, i * 15, (i % 2 ? -11 : 11), 2.6, 2.6, al(sh(c, -.55), .8))
      g.restore()
      gloss(g, -14, -18, 11, 5)
    }
  }
  reg('worm-segment', segment('#7a8a3c'), { noWounds: true })

  /* ---- Duke of Flies: spore puffball ---------------------------------- */
  reg('the-duke-of-flies', function (g, t) {
    var c = '#d2b866', ch = A.ch, br = Math.sin(A.T * 2.2), i
    for (i = -2; i <= 2; i++) A.leg(g, i * 14, 26, i * 18, 38, i * 20 + (i % 2 ? 3 : -3), 47, 6, '#8a7440')
    A.blob(g, 0, 2 + br, 44, 40, c, { n: 14, wob: .04, seed: 5 })
    for (i = 0; i < 12; i++) { var a = A.rnd(i * 3) * TAU, d = 14 + A.rnd(i * 7) * 24, r = 2.2 + A.rnd(i) * 2.6; A.flat(g, Math.cos(a) * d, 4 + Math.sin(a) * d * .8, r, r * .8, al('#5a4418', .85)); A.flat(g, Math.cos(a) * d - .6, 3.4 + Math.sin(a) * d * .8, r * .5, r * .4, al('#fff', .25)) }
    A.flat(g, 0, 34, 38, 7, al('#3a2c10', .35))
    A.ball(g, 0, -29 + br, 11, 6, '#4a3a14', { lw: 2.4 })
    for (i = 0; i < 10; i++) {
      var f = (A.T * .6 + i / 10) % 1, sx = Math.sin(i * 2.1 + A.T) * (10 + f * 16 + ch * 10), sy = -32 - f * (22 + ch * 22)
      A.flat(g, sx, sy + br, 2 + (1 - f) * 2.6, 2 + (1 - f) * 2.6, al('#eee6a8', (1 - f) * .9))
    }
    lamp(g, 0, 6 + br, 10, '#9ad04a')
    gloss(g, -22, -14, 12, 6)
  })

  /* ---- Gemini (clay and porcelain golems), Steven (bronze bell) ------- */
  function twin (t) { return /suture/.test(t.role || '') || +t.variant === 1 }
  reg('gemini', function (g, t) {
    var s2 = twin(t), c = s2 ? '#d8d0c0' : '#b4663c', ec = s2 ? '#5ad8f0' : '#ff7a2a', ch = A.ch, br = Math.sin(A.T * 3 + (s2 ? 1 : 0))
    solid(g, [-22, 12, 22, 12, 28, 44, -28, 44], sh(c, -.12))
    A.line(g, al(sh(c, -.6), .8), 3, [-12, 22, -14, 40]); A.line(g, al(sh(c, -.6), .8), 3, [12, 22, 14, 40])
    A.ball(g, -36, 26 + br, 10, 15, c, { rot: .25 }); A.ball(g, 36, 26 - br, 10, 15, c, { rot: -.25 })
    solid(g, [-34, -34 + br, 34, -34 + br, 40, -6, 30, 14, -30, 14, -40, -6], c)
    A.poly(g, [-28, -13 + br, 28, -13 + br, 24, 3 + br, -24, 3 + br], '#1a1014')
    lamp(g, -12, -5 + br, 5, ec, { hz: true, sq: .9 }); lamp(g, 12, -5 + br, 5, ec, { hz: true, sq: .9 })
    if (s2) { A.line(g, '#d8b040', 2.6, [2, -34 + br, -3, -22 + br, 3, -10 + br, -2, -13 + br]); A.line(g, '#d8b040', 2.6, [-30, 6, -20, 10]) } else { A.crack(g, 6, -34 + br, 24, 1.8); A.crack(g, -26, 0, 16, .4) }
    for (var i = -2; i <= 2; i++) A.line(g, '#1a1014', 2.6, [i * 6, 6 + br, i * 6, 12 + br + ch * 4])
    rivets(g, [-30, -28 + br, 30, -28 + br], c)
    A.poly(g, [-8, -34 + br, 8, -34 + br, 0, -46 + br - ch * 4], s2 ? '#d8b040' : sh(c, -.3))
    gloss(g, -20, -22 + br, 9, 4)
  }, { R: 28 })
  reg('steven', function (g, t) {
    var c = '#6e8c6c', ch = A.ch, sw = Math.sin(A.T * 3) * (3 + ch * 8)
    g.beginPath(); g.ellipse(0, -44, 7, 8, 0, 0, TAU); g.lineWidth = 5; g.strokeStyle = '#2a3a2c'; g.stroke(); g.lineWidth = 2; g.strokeStyle = '#8aa48a'; g.stroke()
    solid(g, [-12, -38, 12, -38, 18, -22, 24, -4, 34, 16, 44, 32, -44, 32, -34, 16, -24, -4, -18, -22], c)
    A.flat(g, 0, 32, 41, 6, '#14100e'); A.line(g, sh(c, -.7), 3, [-44, 32, 44, 32])
    A.line(g, '#14100e', 2, [0, 33, sw * .4, 40]); A.ball(g, sw, 44, 8, 8, '#8a6a30', { lw: 2.4 })
    A.line(g, '#d8b848', 3, [-30, 14, 0, 18, 30, 14]); A.line(g, '#d8b848', 3, [-24, 4, 0, 8, 24, 4])
    A.warts(g, 0, 0, 22, 4, '#a8c8a0', 3)
    lamp(g, 0, -12, 10, '#7ae0a0')
    A.crack(g, 22, -4, 22, 2.3); A.crack(g, -26, 12, 18, 2.8)
    gloss(g, -16, -20, 4, 12, -.2)
  })

  /* ---- Dingle, Dangle: iron censers ----------------------------------- */
  function censer (c, o) {
    return function (g, t) {
      var ch = A.ch, br = Math.sin(A.T * 2.5) * 2, i
      if (o.hang) for (i = -3; i <= 3; i++) { A.line(g, '#8a8a96', 2.6, [i * 11, 22, i * 12, 38 + (i % 2) * 6]); A.ball(g, i * 12, 41 + (i % 2) * 6, 3.4, 4, '#6a7080', { lw: 1.6 }) }
      for (i = 0; i < 3; i++) A.ball(g, 0, -52 + i * 6, 3.4, 4.4, '#6a6a74', { lw: 1.6 })
      A.ball(g, -22, 38, 9, 6, sh(c, -.3)); A.ball(g, 22, 38, 9, 6, sh(c, -.3))
      A.ball(g, 0, br, 40, 38, c)
      g.save(); g.beginPath(); g.ellipse(0, br, 39, 37, 0, 0, TAU); g.clip()
      for (i = -2; i <= 2; i++) { var sx = i * 15; A.flat(g, sx, br + 2, 5.4, 26 - Math.abs(i) * 2.5, '#160a08'); A.flat(g, sx, br + 2, 3, 22 - Math.abs(i) * 2.5, mix(o.fire, '#ffffff', ch * .3)) }
      g.restore()
      for (i = 0; i < 2; i++) { g.beginPath(); g.ellipse(0, br, 40, 38, 0, i ? .3 : Math.PI + .3, i ? Math.PI - .3 : TAU - .3); g.lineWidth = 3.6; g.strokeStyle = sh(c, -.55); g.stroke() }
      A.glow(g, 0, br, 38, o.fire, .25 + ch * .3)
      lamp(g, 0, br - 2, 10, o.fire)
      if (o.spikes) for (i = -2; i <= 2; i++) A.poly(g, [i * 13 - 5, -34 + br + Math.abs(i) * 3, i * 13 + 5, -34 + br + Math.abs(i) * 3, i * 13, -46 + br + Math.abs(i) * 3], sh(c, -.3))
      gloss(g, -22, -22 + br, 11, 5)
    }
  }
  reg('dingle', censer('#58525e', { fire: '#ff7a2a', spikes: true }))
  reg('dangle', censer('#8a9cb0', { fire: '#7ad8ff', hang: true }))

  /* ---- Blighted Ovum: cracked geode ----------------------------------- */
  reg('blighted-ovum', function (g, t) {
    var ch = A.ch, br = Math.sin(A.T * 2), shell = '#8a7a6a', i, a, p = []
    A.ball(g, 0, 2, 43 + br, 46 - br, shell)
    A.crack(g, -22, -30, 22, 1.7); A.crack(g, 28, 14, 18, 2.6)
    for (i = 0; i < 16; i++) { a = i / 16 * TAU; var rr = i % 2 ? 1 : 1.2; p.push(4 + Math.cos(a) * 32 * rr, 8 + Math.sin(a) * 34 * rr) }
    solid(g, p, sh(shell, -.2))
    A.ball(g, 4, 8, 30, 32, '#3a2250', { lw: 2.6 })
    for (i = 0; i < 9; i++) {
      a = i / 9 * TAU + .3; var bx = 4 + Math.cos(a) * 26, by = 8 + Math.sin(a) * 28, tx = 4 + Math.cos(a) * 11, ty = 8 + Math.sin(a) * 12, nx = -Math.sin(a) * 4.5, ny = Math.cos(a) * 4.5
      A.poly(g, [bx - nx, by - ny, bx + nx, by + ny, tx, ty], i % 2 ? '#b98ae8' : '#8a5ac8', { lw: 1.8 })
    }
    lamp(g, 4, 8, 11, '#ffd060')
    gloss(g, -22, -26, 12, 5)
  })

  /* ---- The Haunt: guttering wax candle -------------------------------- */
  reg('the-haunt', function (g, t) {
    var ch = A.ch, c = '#ddd2b4', fl = Math.sin(A.T * 18) * 1.6 + Math.sin(A.T * 11) * 1.2, i
    A.flat(g, 0, 42, 38, 8, '#cfc4a2')
    A.glow(g, 0, -40, 36 + ch * 14, '#ff9a30', .4 + ch * .3)
    solid(g, [-24, -18, 24, -18, 28, 8, 34, 42, -34, 42, -28, 8], c)
    A.ball(g, 0, -18, 24, 8, '#efe6cc')
    for (i = 0; i < 4; i++) A.drip(g, -20 + i * 13, -14, 18 + (i % 2) * 10, '#efe6cc', 3)
    A.line(g, '#2a1a14', 3, [0, -20, 1, -31])
    A.poly(g, [-8, -32, -5, -44, 0, -58 + fl, 5, -44, 8, -32], '#ff9a30'); A.poly(g, [-4, -33, 0, -50 + fl, 4, -33], '#ffe070', { ol: false })
    A.flat(g, -10, 2, 5.4, 8, '#2a1a14', .1); A.flat(g, 10, 2, 5.4, 8, '#2a1a14', -.1)
    A.flat(g, -10, 4, 2, 2.6, '#ff9a30'); A.flat(g, 10, 4, 2, 2.6, '#ff9a30')
    A.mouth(g, 0, 20, 9, 3 + ch * 9, { n: 0, tongue: false, col: '#241008' })
    A.flat(g, -19, 10, 4, 20, al('#fff', .35), -.05)
  })

  /* ---- Little Horn: swamp toad ---------------------------------------- */
  reg('little-horn', function (g, t) {
    var ch = A.ch, c = '#858a4a', br = Math.sin(A.T * 4)
    A.ball(g, -36, 22, 13, 20, sh(c, -.15), { rot: .3 }); A.ball(g, 36, 22, 13, 20, sh(c, -.15), { rot: -.3 })
    A.leg(g, -18, 30, -30, 40, -24, 48, 8, sh(c, -.08)); A.leg(g, 18, 30, 30, 40, 24, 48, 8, sh(c, -.08))
    A.ball(g, 0, 6, 33, 29, c)
    A.ball(g, 0, 25, 14 + ch * 9, 9 + ch * 10, '#d0988a')
    A.warts(g, 0, 0, 30, 6, sh(c, -.22), 4)
    A.flat(g, -29, -2, 6, 9, sh(c, .22), .2); A.flat(g, 29, -2, 6, 9, sh(c, .22), -.2)
    A.ball(g, -18, -18 + br * .3, 12, 11, c); A.ball(g, 18, -18 + br * .3, 12, 11, c)
    lamp(g, -18, -19 + br * .3, 7, '#e8b830', { hz: true }); lamp(g, 18, -19 + br * .3, 7, '#e8b830', { hz: true })
    A.line(g, '#1a0c08', 3.6, [-30, 6, -14, 14, 0, 15, 14, 14, 30, 6])
    A.flat(g, -4, -2, 1.8, 2.4, '#1a0c08'); A.flat(g, 4, -2, 1.8, 2.4, '#1a0c08')
    gloss(g, -14, -6, 9, 4)
  }, { R: 26 })

  /* ---- Baby Plum: rotting fruit --------------------------------------- */
  reg('baby-plum', function (g, t) {
    var ch = A.ch, c = '#6a3a7a', br = Math.sin(A.T * 3)
    for (var q = -1; q <= 1; q += 2) A.ball(g, q * 17, 42, 8, 5, '#4a3a2a', { lw: 2 })
    g.save(); g.scale(1 + ch * .08, 1 - ch * .08)
    A.ball(g, 0, 2 + br, 39, 37 + br, c)
    A.flat(g, 10, 12, 20, 15, al('#b8a8d8', .18))
    A.line(g, sh(c, -.55), 3, [0, -32 + br, 3, -12, -1, 12, 2, 36])
    A.ball(g, -20, 16, 13, 10, '#7a8a70', { lw: 2.2 }); for (var i = 0; i < 6; i++) A.flat(g, -26 + A.rnd(i) * 12, 11 + A.rnd(i + 9) * 10, 1.5, 1.5, '#e8e8d8')
    A.tent(g, -26, 10, 2.8, 14, 4, '#e0d4b0', { amp: 2 })
    A.line(g, '#4a3020', 4, [0, -34 + br, 2, -46 + br, 9, -52 + br]); A.poly(g, [9, -48 + br, 26, -54 + br, 20, -40 + br], '#5a8a3a')
    A.dot(g, -13, -6, 5, '#120a12'); A.dot(g, 13, -6, 5, '#120a12')
    A.brow(g, -20, -15, -6, -11, '#2a1030', 3.4); A.brow(g, 20, -15, 6, -11, '#2a1030', 3.4)
    A.mouth(g, 5, 17, 12, 3 + ch * 9, { n: 6, tl: .5, col: '#2a0a1a' })
    gloss(g, -20, -16, 10, 5)
    g.restore()
  }, { R: 28 })

  /* ---- Four wraith-effigies (Famine and the Ultra set) ---------------- */
  function wraith (o) {
    return function (g, t) {
      var ch = A.ch, br = Math.sin(A.T * 2.4) * 3, c = o.cloak
      if (o.aura) A.glow(g, 0, 0, 62, o.eye, .35)
      g.save(); g.translate(0, br)
      solid(g, [-14, -12, 14, -12, 26, 10, 38, 40, 30, 46, 22, 40, 14, 48, 6, 42, 0, 48, -6, 42, -14, 48, -22, 40, -30, 46, -38, 40, -26, 10], c)
      A.line(g, al(sh(c, -.6), .8), 2.6, [-6, 0, -12, 40]); A.line(g, al(sh(c, -.6), .8), 2.6, [8, 0, 14, 42])
      solid(g, [-20, -6, -46, 8, -42, 28, -20, 14], sh(c, .04)); solid(g, [20, -6, 46, 8, 42, 28, 20, 14], sh(c, .04))
      A.ball(g, 0, -12, 24, 7, o.trim)
      solid(g, [-18, -34, 0, -58, 18, -34, 22, -12, -22, -12], sh(c, .08))
      A.ball(g, 0, -26, 15, 17, '#0c080c', { lw: 2.4 })
      lamp(g, -6.5, -26, 4.4, o.eye, { hz: true, sq: .9 }); lamp(g, 6.5, -26, 4.4, o.eye, { hz: true, sq: .9 })
      if (o.extra) o.extra(g, ch)
      g.restore()
      g.save(); g.translate(0, Math.sin(A.T * 2.4 + 1) * 3); o.emblem(g, ch); g.restore()
    }
  }
  function emblemScales (g, ch) { A.line(g, '#6a5a2a', 2.8, [34, -46, 34, -6]); A.line(g, '#caa84a', 2.8, [24, -42, 44, -42]); for (var i = -1; i <= 1; i += 2) { A.line(g, '#caa84a', 1.4, [34 + i * 10, -42, 34 + i * 12, -32]); A.ball(g, 34 + i * 12, -30 + ch * -4, 6, 2.5, '#d8bc54', { lw: 2 }) } }
  function emblemBow (g, ch) { g.strokeStyle = '#2a1c10'; g.lineWidth = 6; g.beginPath(); g.arc(36, -26, 22, -1.2, 1.2); g.stroke(); g.strokeStyle = '#6a4a28'; g.lineWidth = 3; g.stroke(); A.line(g, '#d8d0b0', 1.2, [36 + Math.cos(1.2) * 22, -26 + Math.sin(1.2) * 22, 36 - ch * 10, -26, 36 + Math.cos(-1.2) * 22, -26 + Math.sin(-1.2) * 22]) }
  function emblemSword (g, ch) { A.line(g, '#2a2024', 6, [34, -6, 34, -50]); A.line(g, '#cfd0d4', 3, [34, -6, 34, -52 - ch * 6]); A.line(g, '#8a6a2a', 3.6, [28, -10, 40, -10]) }
  function emblemScythe (g, ch) { A.line(g, '#4a3a2a', 3.4, [32, 0, 36, -52]); g.strokeStyle = '#18181c'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(36, -52); g.quadraticCurveTo(16 - ch * 6, -66, 6, -44); g.stroke(); g.strokeStyle = '#d0d2d8'; g.lineWidth = 3.4; g.stroke() }
  reg('famine', wraith({ cloak: '#6a6038', trim: '#8a7a3a', eye: '#e8d050', emblem: emblemScales }))
  reg('ultra-famine', wraith({ cloak: '#8a7a30', trim: '#caa84a', eye: '#fff070', emblem: emblemScales, aura: true }))
  reg('ultra-pestilence', wraith({ cloak: '#4a6a34', trim: '#7a8a3a', eye: '#c8ff60', emblem: emblemBow, aura: true, extra: function (g) { A.warts(g, 0, 20, 22, 6, '#8aa84a', 5) } }))
  reg('ultra-war', wraith({ cloak: '#7a2a28', trim: '#3a1414', eye: '#ff7040', emblem: emblemSword, aura: true, extra: function (g) { A.poly(g, [-44, 8, -52, -8, -38, 2], '#2a1a1e'); A.poly(g, [44, 8, 52, -8, 38, 2], '#2a1a1e') } }))
  reg('ultra-death', wraith({ cloak: '#2a2a34', trim: '#cfc9b6', eye: '#a0e0ff', emblem: emblemScythe, aura: true }))

  /* ---- Gurdy family: ceramic urns ------------------------------------- */
  function urn (c, o) {
    o = o || {}
    return function (g, t) {
      var ch = A.ch, br = Math.sin(A.T * 2.4), k = o.k || 1, i
      g.save(); g.scale(k, k)
      for (var q = -1; q <= 1; q += 2) { g.beginPath(); g.ellipse(q * 38, -2, 10, 17, 0, q < 0 ? Math.PI / 2 : -Math.PI / 2, q < 0 ? Math.PI * 1.5 : Math.PI / 2); g.lineWidth = 11; g.strokeStyle = sh(c, -.7); g.stroke(); g.lineWidth = 5.4; g.strokeStyle = sh(c, -.1); g.stroke() }
      A.ball(g, 0, 44, 22, 6, sh(c, -.35), { lw: 2.4 })
      A.ball(g, 0, 6 + br * .5, 40, 38 + br * .5, c)
      solid(g, [-16, -30, 16, -30, 21, -18, -21, -18], sh(c, -.05))
      A.ball(g, 0, -31, 21, 6, sh(c, .12), { lw: 2.6 })
      g.save(); g.beginPath(); g.ellipse(0, 6, 39, 37, 0, 0, TAU); g.clip()
      A.line(g, sh(o.band || c, -.5), 4, [-40, -8, 0, -2, 40, -8]); A.line(g, sh(o.band || c, -.5), 4, [-40, 30, 0, 36, 40, 30])
      g.restore()
      if (o.spikes) for (i = -3; i <= 3; i++) A.poly(g, [i * 11 - 4, -16 + Math.abs(i) * 3, i * 11 + 4, -16 + Math.abs(i) * 3, i * 11, -30 + Math.abs(i) * 2], '#3a3438')
      var e = o.eyes || 2
      if (e === 1) lamp(g, 0, 4, 8, o.fire); else { lamp(g, -14, 4, 6.4, o.fire); lamp(g, 14, 4, 6.4, o.fire) }
      var my = 22 + ch * 6, pts = [-20, 20, -12, my - 6, -6, my + 2, 0, my - 6, 6, my + 2, 12, my - 6, 20, 20]
      A.line(g, '#1a0a0c', 6.4, pts); A.line(g, mix(o.fire, '#fff', ch * .4), 2.4, pts)
      if (o.seal) { A.ball(g, 0, -33, 15, 7, '#a02a30', { lw: 2.4 }); A.drip(g, -8, -30, 18, '#a02a30', 3); A.drip(g, 9, -30, 12, '#a02a30', 2.6) }
      if (o.cork) A.rect(g, -8, -44, 16, 14, '#b8906a', 3)
      if (o.flame) { A.glow(g, 0, -44, 30, '#ff8a2a', .6); A.poly(g, [-10, -34, -5, -46, 0, -58 + Math.sin(A.T * 16) * 2, 5, -46, 10, -34], '#ff9a30') }
      gloss(g, -24, -14, 10, 5)
      g.restore()
    }
  }
  reg('gurdy-jr', urn('#b0704c', { k: .8, cork: true, fire: '#ffb040' }))
  reg('gurdy', urn('#7a8a98', { k: 1, seal: true, fire: '#7ae0a0' }))
  reg('mama-gurdy', urn('#6a4c5a', { k: 1.08, spikes: true, flame: true, eyes: 1, fire: '#ff5a3a', band: '#2a2428' }))

  /* ---- Fistula: barnacle boulder -------------------------------------- */
  reg('fistula', function (g, t) {
    var ch = A.ch, br = Math.sin(A.T * 3), c = '#7a7468'
    A.blob(g, 0, 0, 44 + br, 42 - br, c, { n: 11, wob: .08, seed: 12, sp: 2 })
    A.crack(g, -26, -30, 22, 1.6); A.crack(g, 30, 22, 18, 2.4)
    var bs = [[-28, -16, 9], [26, -24, 8], [-32, 14, 8], [30, 10, 10], [-8, 30, 9], [10, -36, 7], [-12, -34, 6], [16, 32, 7]]
    bs.forEach(function (b) {
      var x = b[0], y = b[1], r = b[2]
      A.poly(g, [x - r, y + r * .4, x - r * .6, y - r * .5, x + r * .6, y - r * .5, x + r, y + r * .4], '#cdc4a8')
      A.flat(g, x, y - r * .5, r * .6, r * .32, '#2a1a18')
      A.line(g, '#d8a090', 1.8, [x, y - r * .5, x + Math.sin(A.T * 4 + x) * 2.4, y - r * (1.2 + ch * .5)])
    })
    A.ball(g, 0, -2, 18, 16, '#2a2224')
    lamp(g, 0, -2, 11 + ch * 2, '#e8c040')
    A.drip(g, -14, 34, 12, '#8ab8c8', 2.2); A.drip(g, 22, 30, 10, '#8ab8c8', 2)
    gloss(g, -22, -26, 12, 5)
  })

  /* ---- Widow: needle mantis, Reap Creep: engorged tick ---------------- */
  reg('widow', function (g, t) {
    var ch = A.ch, c = '#3c4a34', ac = '#c8402c', wk = A.T * 4, q, i
    for (q = -1; q <= 1; q += 2) for (i = 0; i < 2; i++) A.leg(g, q * 10, 6 + i * 10, q * (30 + i * 6), 14 + i * 12 + Math.sin(wk + i + q) * 3, q * (42 + i * 4), 40 + i * 4, 5, sh(c, -.2))
    A.ball(g, 0, 24, 15, 24, c)
    for (i = 0; i < 3; i++) A.line(g, ac, 3, [-12, 14 + i * 10, 0, 18 + i * 10, 12, 14 + i * 10])
    A.flat(g, -13, 12, 9, 24, al('#a8c888', .45), .15); A.flat(g, 13, 12, 9, 24, al('#a8c888', .45), -.15)
    solid(g, [-9, -8, 9, -8, 14, 12, -14, 12], sh(c, .05))
    for (q = -1; q <= 1; q += 2) {
      A.leg(g, q * 10, -6, q * 36, -8 - ch * 14, q * 28, -36 - ch * 10, 7, sh(c, .06))
      for (i = 0; i < 3; i++) A.poly(g, [q * (30 - i * 2), -16 - ch * 12 - i * 6, q * (38 - i * 2), -16 - ch * 12 - i * 6, q * (32 - i * 2), -22 - ch * 12 - i * 6], '#d8d0b0', { lw: 1.4 })
    }
    solid(g, [-19, -34, 19, -34, 8, -12, -8, -12], c)
    lamp(g, -13, -29, 7, '#d8e040'); lamp(g, 13, -29, 7, '#d8e040')
    A.line(g, c, 2, [-5, -36, -12, -52, -24, -56]); A.line(g, c, 2, [5, -36, 12, -52, 24, -56])
    A.poly(g, [-6, -14, -2, -14, -4, -6 + ch * 3], '#e6dcc0', { lw: 1.4 }); A.poly(g, [6, -14, 2, -14, 4, -6 + ch * 3], '#e6dcc0', { lw: 1.4 })
  })
  reg('reap-creep', function (g, t) {
    var ch = A.ch, br = Math.sin(A.T * 2.6), q, i
    for (q = -1; q <= 1; q += 2) for (i = 0; i < 4; i++) { var ly = -10 + i * 14 + Math.sin(A.T * 3 + i * 1.4 + q) * 3; A.leg(g, q * 28, ly * .8, q * 42, ly - 6, q * 47, ly + 8, 5, '#4a3036') }
    A.blob(g, 0, 12, 37 + br + ch * 4, 33 + br + ch * 4, '#8a5a6a', { n: 12, wob: .05, seed: 31 })
    A.flat(g, -8, 10, 18, 13, al('#a02030', .4), .3)
    A.veins(g, 0, 12, 30, '#5a2a3a', 6, 31)
    A.ball(g, 0, -12, 18, 13, '#d4b48a'); A.line(g, al('#6a4a28', .7), 2, [-12, -12, 0, -6, 12, -12])
    A.ball(g, 0, -28, 12, 9, '#3a2a2e')
    A.poly(g, [-3, -34, 3, -34, 0, -50 - ch * 6], '#cfc0a0', { lw: 2 })
    for (q = -1; q <= 1; q += 2) A.poly(g, [q * 8, -32, q * 18, -42, q * 12, -28], '#2a1c20', { lw: 2 })
    lamp(g, -9, -13, 3.4, '#ff5a4a', { lw: 1.6 }); lamp(g, 9, -13, 3.4, '#ff5a4a', { lw: 1.6 })
    gloss(g, -20, 2, 10, 5)
  })

  /* ---- Crawlers: centipede (Pin), eel (C.H.A.D.), spine (Frail), flail (Scourge) */
  function crawler (c, o) {
    return function (g, t) {
      var ch = A.ch, N = o.n || 6, hx = o.horiz ? -28 : 0, hy = o.horiz ? 0 : -26, i
      for (i = N; i >= 1; i--) {
        var f = i / N, x, y, r = (o.r || 24) * (1 - f * .45)
        if (o.horiz) { x = hx + 22 + i * 14; y = Math.sin(A.T * 3 + i * .9) * 8 * f + 4 } else { x = Math.sin(A.T * 2.6 + i * .8) * 14 * f; y = hy + 20 + i * 12 }
        var sc = sh(c, -f * .2)
        if (o.kind === 'centi') {
          A.line(g, sh(c, -.5), 3.2, [x - r, y, x - r - 11, y + 6 + Math.sin(A.T * 6 + i) * 2]); A.line(g, sh(c, -.5), 3.2, [x + r, y, x + r + 11, y + 6 + Math.sin(A.T * 6 + i + 2) * 2])
          A.ball(g, x, y, r * 1.12, r * .78, sc); A.line(g, al(sh(c, -.6), .7), 2, [x - r * .7, y - 2, x, y + 3, x + r * .7, y - 2])
        } else if (o.kind === 'eel') {
          A.poly(g, [x - 8, y - r * .8, x + 8, y - r * .8, x, y - r * 1.55 - Math.sin(A.T * 5 + i) * 2], '#4a8a8a')
          A.ball(g, x, y, r, r * .92, sc); A.flat(g, x, y + r * .4, r * .8, r * .4, al('#e8f0d8', .35))
        } else if (o.kind === 'spine') {
          A.line(g, '#8a7a60', 4, [x - r * 1.1, y + 4, x - r * .5, y - 2]); A.line(g, '#8a7a60', 4, [x + r * 1.1, y + 4, x + r * .5, y - 2])
          A.ball(g, x, y, r * .72, r * .6, sc); A.poly(g, [x - 3, y - r * .55, x + 3, y - r * .55, x, y - r * 1.05], sh(c, -.2), { lw: 2 })
        } else {
          A.poly(g, [x, y - r * 1.05, x + r * .95, y, x, y + r * 1.05, x - r * .95, y], sc)
          A.poly(g, [x - r * .95, y, x - r * 1.5, y - 4, x - r * .95, y - 8], '#8a2a30', { lw: 2 }); A.poly(g, [x + r * .95, y, x + r * 1.5, y - 4, x + r * .95, y - 8], '#8a2a30', { lw: 2 })
          A.flat(g, x, y, r * .3, r * .3, '#8a2a30')
        }
      }
      var hr = o.hr || 26
      if (o.kind === 'centi') {
        A.line(g, sh(c, -.4), 2.4, [-8, hy - hr * .8, -16, hy - hr - 10 + Math.sin(A.T * 4) * 3]); A.line(g, sh(c, -.4), 2.4, [8, hy - hr * .8, 16, hy - hr - 10 - Math.sin(A.T * 4) * 3])
        A.ball(g, hx, hy, hr, hr * .9, c)
        A.horn(g, -9, hy + hr * .6, 1.2 + ch * .3, 20, 8, '#d8c8a8', -.5); A.horn(g, 9, hy + hr * .6, 1.94 - ch * .3, 20, 8, '#d8c8a8', .5)
        lamp(g, hx - 10, hy - 6, 5.6, o.eye); lamp(g, hx + 10, hy - 6, 5.6, o.eye)
      } else if (o.kind === 'eel') {
        A.ball(g, hx - 2, hy, hr, hr * .82, c)
        for (i = 0; i < 3; i++) A.line(g, al(sh(c, -.6), .8), 2.4, [hx + 8 + i * 4, hy - 12, hx + 11 + i * 4, hy + 8])
        lamp(g, hx - 6, hy - 11, 5.4, o.eye)
        A.mouth(g, hx - 12, hy + 8, hr * .6, 2 + ch * 9, { n: 8, tl: .8, col: '#1a0a0c', tongue: false, top: false })
      } else if (o.kind === 'spine') {
        A.ball(g, hx, hy, hr, hr * .9, '#d8ccb0')
        A.poly(g, [hx - 9, hy + 8, hx + 9, hy + 8, hx, hy + hr + 12 + ch * 4], '#b8a888')
        for (i = -1; i <= 1; i++) A.poly(g, [hx + i * 8 - 3, hy - hr * .85, hx + i * 8 + 3, hy - hr * .85, hx + i * 8, hy - hr - 8], '#b8a888', { lw: 2 })
        A.flat(g, hx - 10, hy - 4, 6, 7, '#140a0a'); A.flat(g, hx + 10, hy - 4, 6, 7, '#140a0a'); A.dot(g, hx - 10, hy - 3, 2.6, '#ff7a4a', '#e8502a'); A.dot(g, hx + 10, hy - 3, 2.6, '#ff7a4a', '#e8502a')
      } else {
        solid(g, [hx - 26, hy - 8, hx, hy - 30, hx + 26, hy - 8, hx + 14, hy + 22, hx - 14, hy + 22], c)
        A.poly(g, [hx - 26, hy - 8, hx - 40, hy - 22, hx - 14, hy - 18], '#8a2a30'); A.poly(g, [hx + 26, hy - 8, hx + 40, hy - 22, hx + 14, hy - 18], '#8a2a30')
        lamp(g, hx, hy - 4, 8, '#ff5a3a'); A.line(g, '#8a2a30', 3, [hx - 8, hy + 12, hx, hy + 18, hx + 8, hy + 12])
      }
    }
  }
  reg('pin', crawler('#a8603a', { kind: 'centi', n: 6, eye: '#e8d04a', hr: 24 }))
  reg('c-h-a-d', crawler('#5a8a96', { kind: 'eel', n: 5, horiz: true, r: 23, hr: 30, eye: '#e8d86a' }))
  reg('frail', crawler('#d8ccb0', { kind: 'spine', n: 5, r: 20, hr: 24 }))
  reg('the-scourge', crawler('#6a5a52', { kind: 'flail', n: 6, r: 22, hr: 26 }))

  /* ---- Rag Man: stitched scarecrow ------------------------------------ */
  function scarecrow (c, o) {
    o = o || {}
    return function (g, t) {
      var ch = A.ch, sw = Math.sin(A.T * 2.6) * 3, i
      A.line(g, '#1a120a', 10, [0, -10, 0, 48]); A.line(g, '#5a4428', 6, [0, -10, 0, 48])
      A.line(g, '#1a120a', 11, [-46, 4 + sw * .3, 46, 4 - sw * .3]); A.line(g, '#5a4428', 6, [-46, 4 + sw * .3, 46, 4 - sw * .3])
      for (var q = -1; q <= 1; q += 2) for (i = 0; i < 5; i++) A.line(g, '#d8b848', 2.6, [q * 46, 4 - sw * .3 * q, q * (52 + i * 1.6), -6 + i * 5 - sw * .3 * q])
      solid(g, [-22, -6, 22, -6, 30, 36, -30, 36], c)
      A.rect(g, -15, 8, 13, 13, sh(c, .22), 2); A.rect(g, 4, 16, 14, 11, sh(c, -.2), 2)
      A.stitches(g, -15, 8, -2, 8, 3, '#1a1010', 2.4)
      for (i = -4; i <= 4; i++) A.line(g, '#d8b848', 2.6, [i * 7, 34, i * 7 + (i % 2 ? 3 : -3), 46 + (i % 3) * 2])
      if (o.chains) { A.line(g, '#8a8a92', 3.6, [-28, -2, -12, 14, 6, 6, 26, 18]) }
      var hx = sw * .4
      A.ball(g, hx, -26, 22, 23, o.bucket ? '#7a7a84' : '#cdb078')
      if (o.bucket) { A.rect(g, hx - 22, -42, 44, 10, '#5a5a64', 3); A.poly(g, [hx - 20, -30, hx + 20, -30, hx + 16, -22, hx - 16, -22], '#14101a') }
      lamp(g, hx - 8, -26, 5, o.eye || '#e8a030'); lamp(g, hx + 8, -26, 5, o.eye || '#e8a030')
      if (!o.bucket) { A.line(g, '#2a1a10', 2.4, [hx - 13, -31, hx - 3, -21]); A.line(g, '#2a1a10', 2.4, [hx - 3, -31, hx - 13, -21]); A.line(g, '#2a1a10', 2.4, [hx + 3, -31, hx + 13, -21]); A.line(g, '#2a1a10', 2.4, [hx + 13, -31, hx + 3, -21]) }
      var my = -12; A.line(g, '#2a1a10', 3, [hx - 13, my, hx - 8, my + 4, hx - 4, my, hx, my + 4, hx + 4, my, hx + 8, my + 4, hx + 13, my])
      if (ch > .15) A.mouth(g, hx, my + 2, 12, 1 + ch * 6, { n: 0, tongue: false })
      if (!o.bucket) { A.ball(g, hx, -45, 30, 6, '#3a2e24'); solid(g, [hx - 15, -45, hx - 11, -64, hx + 11, -64, hx + 15, -45], '#4a3a2c') }
      if (o.nails) for (i = -3; i <= 3; i++) A.poly(g, [hx + i * 6 - 2, -42, hx + i * 6 + 2, -42, hx + i * 6, -54 + Math.abs(i)], '#cfd0d4', { lw: 1.6 })
    }
  }
  reg('rag-man', scarecrow('#7a5a8a', {}))
  reg('rag-mega', scarecrow('#8a2a2c', { chains: true, bucket: true, nails: true, eye: '#ff6a3a' }))
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
