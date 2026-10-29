;(function (IS) {
  'use strict'
  /*
   * Bespoke boss painters, part 2 (Caves, Depths, Womb, Sheol, Dark Room and
   * beyond). Same house style as part 1: heavy outline, two-tone chunky
   * shading lit from the top-left, grimy palettes, slit-pupil lamp-eyes. Shared
   * helpers come from IS.bossArt (sprites-bosses.js).
   */
  var A = IS.art, sh = A.sh, mix = A.mix, al = A.al, TAU = Math.PI * 2
  var B = IS.bossArt, reg = B.reg, solid = B.solid, plate = B.plate, lamp = B.lamp, gear = B.gear, rivets = B.rivets, gloss = B.gloss

  /* ---- Turdlet, Turdlings: tar slugs ---------------------------------- */
  function slug (g, x, y, k, c, ph) {
    var w = Math.sin(A.T * 3 + ph) * 3, ch = A.ch
    g.save(); g.translate(x, y); g.scale(k, k)
    A.ball(g, 28 + w * .4, 12, 17, 11, sh(c, -.12), { rot: -.2 })
    A.ball(g, 0, 6, 36, 24, c)
    A.flat(g, 0, 24, 32, 4, al(sh(c, .35), .6))
    A.ball(g, 8, -2, 19, 13, sh(c, -.18), { lw: 2.4 })
    A.line(g, c, 5, [-22, -6, -28, -24 + w]); A.line(g, c, 5, [-14, -10, -14, -28 - w])
    lamp(g, -28, -27 + w, 5, '#d8e048', { lw: 2 }); lamp(g, -14, -31 - w, 5, '#d8e048', { lw: 2 })
    A.line(g, '#120a08', 3, [-34, 10, -26, 14 + ch * 3, -20, 11])
    for (var i = 0; i < 5; i++) A.flat(g, -6 + i * 9, -4 + (i % 2) * 14, 2.4, 2, al('#d8a030', .8))
    gloss(g, -12, -4, 11, 4)
    g.restore()
  }
  reg('turdlet', function (g) { slug(g, 0, 4, 1, '#3e4a34', 0) })
  reg('the-turdlings', function (g) { slug(g, -26, 18, .6, '#3e4a34', 0); slug(g, 24, 22, .6, '#4a3a44', 1.5); slug(g, 0, -12, .72, '#4a4a2a', 3) })

  /* ---- Teratoma: egg-jelly brood sac ---------------------------------- */
  reg('teratoma', function (g) {
    var c = '#b8a0c8', ch = A.ch, i
    A.blob(g, 0, 2, 45, 41, c, { n: 12, wob: .08, seed: 14 })
    A.flat(g, 0, 4, 37, 33, al('#6a4a88', .3))
    var em = [[-28, -12], [-22, 14], [-10, 28], [18, 24], [28, 6], [24, -20], [-4, -30], [-30, 20], [10, -32]]
    em.forEach(function (e, j) {
      var bx = e[0], by = e[1] + Math.sin(A.T * 2 + j) * 2
      A.ball(g, bx, by, 5.4, 4.4, '#2a1a30', { lw: 1.6 }); A.line(g, '#2a1a30', 2.2, [bx + 4, by, bx + 10, by + 3 + Math.sin(A.T * 6 + j) * 2]); A.flat(g, bx - 1.5, by - 1, 1.3, 1.3, '#d8ff7a')
    })
    A.ball(g, 0, 2, 18, 16, '#4a2a5a')
    lamp(g, 0, 2, 10 + ch * 2, '#d8ff7a')
    for (i = 0; i < 3; i++) A.line(g, al('#ffffff', .4), 1.6, [-30 + i * 8, -28 + i * 3, -22 + i * 8, -34 + i * 2])
    gloss(g, -22, -24, 12, 5)
  })

  /* ---- The Bloat: spiked puffer --------------------------------------- */
  reg('the-bloat', function (g) {
    var c = '#6a8aa8', ch = A.ch, br = Math.sin(A.T * 2.6), k = 1 + br * .03 + ch * .14, wag = Math.sin(A.T * 5) * .2
    A.ball(g, -46 * k, 6, 8, 13, '#4a6a88', { rot: .4 + wag }); A.ball(g, 46 * k, 6, 8, 13, '#4a6a88', { rot: -.4 - wag })
    A.spikes(g, 0, 2, 41 * k, 16, 8 + ch * 8, '#e8e0c8', .2)
    A.ball(g, 0, 2, 42 * k, 40 * k, c)
    A.ball(g, 0, 22 * k, 30 * k, 15 * k, '#cfd8cc', { ol: false })
    A.warts(g, 0, -6, 30, 6, '#4a6a88', 3)
    lamp(g, -20 * k, -8, 8, '#e8d040'); lamp(g, 20 * k, -8, 8, '#e8d040')
    A.ball(g, 0, 14, 10, 8, '#c8786a'); A.flat(g, 0, 14, 4.4, 3 + ch * 4, '#240a10')
    gloss(g, -20, -26, 12, 5)
  })

  /* ---- The Husk: empty suit of armour --------------------------------- */
  reg('the-husk', function (g) {
    var ch = A.ch, br = Math.sin(A.T * 2), i
    g.save(); g.translate(0, br)
    A.ball(g, -34, 4, 14, 12, '#6a6a72'); A.ball(g, 34, 4, 14, 12, '#6a6a72')
    for (var q = -1; q <= 1; q += 2) for (i = 0; i < 3; i++) A.poly(g, [q * (30 + i * 6) - 3, -4 + i * 4, q * (30 + i * 6) + 3, -4 + i * 4, q * (36 + i * 6), -14 + i * 3], '#4a4a52', { lw: 2 })
    solid(g, [-24, 6, 24, 6, 28, 42, -28, 42], '#5a5a64')
    A.line(g, '#2a2024', 4, [-26, 30, 26, 30]); rivets(g, [-18, 14, 18, 14, -18, 36, 18, 36], '#5a5a64')
    A.warts(g, 0, 26, 20, 4, '#7a4a2a', 4)
    for (i = 0; i < 4; i++) { var f = (A.T * .5 + i / 4) % 1; A.flat(g, -8 + i * 5 + Math.sin(A.T + i) * 4, -40 - f * 20, 3 + f * 4, 3 + f * 4, al('#8a8a92', (1 - f) * .5)) }
    A.poly(g, [-4, -38, 4, -38, 18, -56, 8, -34], '#8a2a2a')
    solid(g, [-24, -34, 0, -42, 24, -34, 28, 0, 20, 12, -20, 12, -28, 0], '#7a7a84')
    A.line(g, '#4a4a52', 3, [0, -42, 0, -14])
    A.poly(g, [-21, -14, 21, -14, 19, -2, -19, -2], '#0e0808')
    lamp(g, -9, -8, 4.2, '#ffa040', { hz: true, sq: .9 }); lamp(g, 9, -8, 4.2, '#ffa040', { hz: true, sq: .9 })
    for (i = -2; i <= 2; i++) A.line(g, '#2a2024', 2.4, [i * 6, 4, i * 6, 10 + ch * 3])
    gloss(g, -16, -28, 8, 4)
    g.restore()
  })

  /* ---- The Gate: portcullis arch -------------------------------------- */
  reg('the-gate', function (g) {
    var ch = A.ch, c = '#7a6e66', i
    A.rect(g, -44, -40, 24, 84, c, 2); A.rect(g, 20, -40, 24, 84, c, 2)
    g.beginPath(); g.moveTo(-44, -10); g.quadraticCurveTo(-44, -54, 0, -54); g.quadraticCurveTo(44, -54, 44, -10); g.lineTo(20, -10); g.quadraticCurveTo(20, -30, 0, -30); g.quadraticCurveTo(-20, -30, -20, -10); g.closePath()
    g.fillStyle = sh(c, .06); g.fill(); g.lineWidth = 3; g.strokeStyle = sh(c, -.65); g.stroke()
    var gr = g.createRadialGradient(0, 0, 2, 0, 0, 34); gr.addColorStop(0, '#5a1a0a'); gr.addColorStop(1, '#0a0406')
    g.fillStyle = gr; g.fillRect(-20, -30, 40, 74)
    A.glow(g, 0, 0, 34 + ch * 12, '#ff7a2a', .35 + ch * .4)
    var drop = 74 - ch * 36
    for (i = -2; i <= 2; i++) { A.line(g, '#0e0a0a', 6.4, [i * 8, -30, i * 8, -30 + drop]); A.line(g, '#8a8a92', 3, [i * 8, -30, i * 8, -30 + drop]); A.poly(g, [i * 8 - 3, -30 + drop, i * 8 + 3, -30 + drop, i * 8, -22 + drop], '#8a8a92', { lw: 2 }) }
    A.line(g, '#0e0a0a', 6, [-20, 0, 20, 0]); A.line(g, '#6a6a72', 3, [-20, 0, 20, 0])
    lamp(g, 0, -42, 7, '#ff5a3a')
    A.crack(g, -38, -4, 18, 1.2); A.warts(g, -32, 22, 10, 3, '#5a7a3a', 5); A.warts(g, 32, 24, 10, 3, '#5a7a3a', 9)
    A.rect(g, -48, 40, 96, 10, sh(c, -.2), 2)
  }, { R: 26 })

  /* ---- The Cage: hanging wire birdcage -------------------------------- */
  reg('the-cage', function (g) {
    var ch = A.ch, br = Math.sin(A.T * 3), bar = '#4a4448', i
    A.glow(g, 0, 8, 46, '#ffd060', .45 + ch * .3)
    A.ball(g, 0, 14, 20 + br, 18 - br, '#5a4a52')
    A.poly(g, [-18, 8, -34, 2, -22, 18], '#3a2a34'); A.poly(g, [18, 8, 34, 2, 22, 18], '#3a2a34')
    lamp(g, -8, 8, 4.6, '#ff7a4a', { lw: 2 }); lamp(g, 8, 8, 4.6, '#ff7a4a', { lw: 2 })
    A.poly(g, [-3, 14, 3, 14, 0, 22 + ch * 6], '#d8a060', { lw: 2 })
    for (i = -5; i <= 5; i++) { var pts = [i * 2.5, -44, i * 10, 0, i * 8, 44]; A.line(g, sh(bar, -.6), 6.2, pts); A.line(g, bar, 3.2, pts); A.line(g, al('#a8a4aa', .6), 1, [i * 2.5 - 1, -42, i * 10 - 1, -2]) }
    for (i = 0; i < 2; i++) { var y = -18 + i * 38; g.beginPath(); g.ellipse(0, y, 44 - Math.abs(y) * .1, 9, 0, 0, TAU); g.lineWidth = 6.4; g.strokeStyle = sh(bar, -.6); g.stroke(); g.lineWidth = 3.2; g.strokeStyle = bar; g.stroke() }
    A.ball(g, 0, 46, 44, 7, bar); A.ball(g, 0, -46, 11, 6, bar)
    g.beginPath(); g.ellipse(0, -56, 7, 8, 0, 0, TAU); g.lineWidth = 5.4; g.strokeStyle = sh(bar, -.6); g.stroke(); g.lineWidth = 2.6; g.strokeStyle = '#8a8a92'; g.stroke()
  })

  /* ---- Mega Maw: boiler furnace --------------------------------------- */
  reg('mega-maw', function (g) {
    var c = '#7a4a3a', ch = A.ch, i
    for (var q = -1; q <= 1; q += 2) {
      plate(g, q * 28, -46, 14, 26, '#4a3a38', { r: 3 })
      for (i = 0; i < 3; i++) { var f = (A.T * .5 + i / 3 + (q > 0 ? .3 : 0)) % 1; A.flat(g, q * 28 + Math.sin(A.T * 2 + i) * 4, -58 - f * 22, 4 + f * 6, 4 + f * 6, al('#8a8a92', (1 - f) * .6)) }
    }
    plate(g, 0, 4, 92, 82, c, { r: 16, bolts: true })
    for (q = -1; q <= 1; q += 2) {
      var gx = q * 26, gy = -22
      A.ball(g, gx, gy, 12, 12, '#cfc8b0'); A.flat(g, gx, gy, 9, 9, '#2a2420')
      for (i = 0; i < 5; i++) { var ta = -2.6 + i * .55; A.line(g, '#cfc8b0', 1.4, [gx + Math.cos(ta) * 7, gy + Math.sin(ta) * 7, gx + Math.cos(ta) * 9, gy + Math.sin(ta) * 9]) }
      var na = -2.5 + ch * 2.4 + Math.sin(A.T * 6 + q) * .1
      A.line(g, '#ff4a2a', 2.2, [gx, gy, gx + Math.cos(na) * 8, gy + Math.sin(na) * 8]); A.flat(g, gx, gy, 2, 2, '#cfc8b0')
    }
    var mh = 16 + ch * 8
    A.ball(g, 0, 16, 36, mh + 4, '#1a0a08', { lw: 3.4 })
    g.save(); g.beginPath(); g.ellipse(0, 16, 34, mh + 2, 0, 0, TAU); g.clip()
    A.glow(g, 0, 22, 40, '#ff8a28', .7)
    for (i = 0; i < 7; i++) { var fl = Math.sin(A.T * 9 + i * 1.7) * .5 + .5; A.flat(g, -27 + i * 9, 30, 6, 10 + fl * (8 + ch * 14), i % 2 ? '#ffd040' : '#ff8a28') }
    for (i = 0; i < 7; i++) { A.poly(g, [-30 + i * 10 - 4, 16 - mh - 2, -30 + i * 10 + 4, 16 - mh - 2, -30 + i * 10, 16 - mh + 9], '#9a9aa2', { lw: 1.8 }); A.poly(g, [-30 + i * 10 - 4, 16 + mh + 2, -30 + i * 10 + 4, 16 + mh + 2, -30 + i * 10, 16 + mh - 9], '#9a9aa2', { lw: 1.8 }) }
    g.restore()
    A.line(g, '#4a3a38', 5, [-44, 44, 44, 44])
    gloss(g, -30, -30, 14, 5)
  })

  /* ---- The Wretched: plague doctor ------------------------------------ */
  reg('the-wretched', function (g) {
    var ch = A.ch, sw = Math.sin(A.T * 2.2) * 3
    solid(g, [-20, -8, 20, -8, 36, 44, 0, 38, -36, 44], '#2c2a34')
    A.line(g, al('#000', .5), 2.6, [-10, 6, -18, 40]); A.line(g, al('#000', .5), 2.6, [10, 6, 18, 40])
    A.ball(g, 0, -8, 27, 9, '#3a3844')
    A.ball(g, -32, 20, 7, 11, '#4a4450', { rot: .3 }); A.ball(g, 32, 20, 7, 11, '#4a4450', { rot: -.3 })
    A.line(g, '#6a6a72', 2.2, [34, 28, 34 + sw * .3, 34]); A.glow(g, 34, 42, 24, '#ffb040', .6); A.ball(g, 34 + sw * .3, 42, 7, 8, '#e8a030', { lw: 2.4 })
    A.ball(g, sw * .3, -28, 19, 19, '#9a8a70')
    solid(g, [-7 + sw * .3, -24, 7 + sw * .3, -24, sw * .3, 6 + ch * 4], '#a89878')
    A.line(g, '#4a3a2a', 2, [sw * .3, -22, sw * .3, 2])
    A.ball(g, -9 + sw * .3, -30, 8.5, 8.5, '#3a2a18', { lw: 2.4 }); A.ball(g, 9 + sw * .3, -30, 8.5, 8.5, '#3a2a18', { lw: 2.4 })
    lamp(g, -9 + sw * .3, -30, 5.4, '#c8e890', { lw: 1.6 }); lamp(g, 9 + sw * .3, -30, 5.4, '#c8e890', { lw: 1.6 })
    A.ball(g, sw * .3, -42, 32, 8, '#1e1c24'); solid(g, [-14 + sw * .3, -42, -10 + sw * .3, -60, 10 + sw * .3, -60, 14 + sw * .3, -42], '#26242e')
    A.line(g, '#8a2a30', 4, [-12 + sw * .3, -48, 12 + sw * .3, -48])
  })

  /* ---- Peep: lantern angler ------------------------------------------- */
  reg('peep', function (g) {
    var c = '#3a5a6a', ch = A.ch, br = Math.sin(A.T * 2.2), i
    A.ball(g, -46, 8, 9, 14, '#2a4a5a', { rot: .4 }); A.ball(g, 46, 8, 9, 14, '#2a4a5a', { rot: -.4 })
    for (i = -2; i <= 2; i++) A.poly(g, [i * 14 - 5, -32 + Math.abs(i) * 4, i * 14 + 5, -32 + Math.abs(i) * 4, i * 14, -44 + Math.abs(i) * 4], '#1e3a48', { lw: 2.4 })
    A.blob(g, 0, 6, 44 + br, 38 - br, c, { n: 12, wob: .06, seed: 22 })
    for (i = 0; i < 9; i++) A.line(g, al('#1a3040', .7), 2, [-30 + i * 7.5, -20 + (i % 3) * 14, -26 + i * 7.5, -16 + (i % 3) * 14])
    A.line(g, '#1a1018', 4.4, [0, -30, 8, -52, 22, -56]); A.line(g, '#4a3a44', 2, [0, -30, 8, -52, 22, -56])
    var fk = A.hp < .5 ? (Math.sin(A.T * 22) > 0 ? 1 : .3) : 1
    A.glow(g, 22, -56, 24 + ch * 14, '#d8ff9a', (.6 + ch * .3) * fk); A.ball(g, 22, -56, 6.5, 6.5, '#e8ffb0', { lw: 2.4 })
    lamp(g, -22, -14, 6.4, '#ffd050'); lamp(g, 22, -14, 6.4, '#ffd050')
    A.mouth(g, 0, 18, 34, 12 + ch * 10, { n: 10, tl: .9, col: '#14080c', tongue: false })
    gloss(g, -22, -24, 12, 5)
  })

  /* ---- The Pile: scrap-metal heap ------------------------------------- */
  reg('the-pile', function (g) {
    var ch = A.ch, i
    A.ball(g, 0, 26, 46, 20, '#4a4a50')
    A.line(g, '#1a1a1e', 10, [-42, 32, -32, -6, -14, -22]); A.line(g, '#6a6a72', 6, [-42, 32, -32, -6, -14, -22])
    solid(g, [14, -4, 44, 8, 40, 40, 10, 34], '#6a6a72'); rivets(g, [20, 4, 36, 12, 34, 32, 16, 28], '#6a6a72')
    A.ball(g, -24, 20, 17, 21, '#7a4a34'); for (i = 0; i < 2; i++) A.line(g, '#2a2024', 4, [-40, 12 + i * 16, -24, 16 + i * 16, -8, 12 + i * 16])
    gear(g, 24, 14, 16, 10, '#8a7a5a'); gear(g, -2, -10, 12, 8, '#7a6a4a')
    A.ball(g, 4, -16, 24, 20, '#5a5a64', { lw: 3.4 })
    lamp(g, 4, -16, 11 + ch * 2, '#ff9a3a')
    for (i = 0; i < 5; i++) A.line(g, '#1a1a1e', 2.4, [30 + i * 2, -22 - i * 2 + (i % 2) * 3, 36 + i * 2, -26 - i * 2 - (i % 2) * 3])
    A.line(g, '#8a8a92', 2, [-6, -34, -10, -52]); A.flat(g, -10, -52, 3, 3, '#ff5a3a')
    if (ch > .1) for (i = 0; i < 4; i++) A.flat(g, 4 + (A.rnd(Math.floor(A.T * 14) + i) - .5) * 50, -16 + (A.rnd(Math.floor(A.T * 14) + i * 4) - .5) * 40, 2, 2, '#ffe060')
    A.drip(g, -34, 40, 10, '#8a4a2a', 2.2)
  })

  /* ---- Gish: ink cuttlefish ------------------------------------------- */
  reg('gish', function (g) {
    var c = '#1e2a38', ch = A.ch, br = Math.sin(A.T * 3), i
    for (i = -3; i <= 3; i++) A.tent(g, i * 9, 26, Math.PI / 2 + i * .22, 26, 8, '#243242', { amp: 4, ph: i * 1.3, taper: .8, rage: 1 })
    A.tent(g, -14, 22, Math.PI / 2 + .5, 40, 5, '#1a2430', { amp: 7, ph: 2, taper: .3 }); A.tent(g, 14, 22, Math.PI / 2 - .5, 40, 5, '#1a2430', { amp: 7, ph: 4, taper: .3 })
    A.ball(g, -34, -4, 9, 26, '#2a3a4a', { rot: .12 }); A.ball(g, 34, -4, 9, 26, '#2a3a4a', { rot: -.12 })
    A.ball(g, 0, -8, 30, 38 + br, c)
    A.ball(g, 0, 18, 28, 17, '#243242')
    for (i = 0; i < 9; i++) A.flat(g, -18 + (i % 3) * 18, -30 + Math.floor(i / 3) * 10, 2.4, 2.4, al('#6ab8d8', .7))
    lamp(g, -18, 12, 8.4, '#f0e8c0', { hz: true }); lamp(g, 18, 12, 8.4, '#f0e8c0', { hz: true })
    A.poly(g, [-5, 24, 5, 24, 0, 34 + ch * 4], '#d8a070', { lw: 2.4 })
    A.drip(g, -30, 20, 14, '#0a0e14', 3); A.drip(g, 28, 22, 12, '#0a0e14', 2.6)
    gloss(g, -14, -34, 8, 4)
  }, { R: 26 })

  /* ---- Loki, Lokii: jester masks -------------------------------------- */
  function jester (g, x, y, k, c1, c2) {
    var ch = A.ch, br = Math.sin(A.T * 2.4 + x), i
    g.save(); g.translate(x, y); g.scale(k, k)
    for (var q = -1; q <= 1; q += 2) { solid(g, [q * 30, -12, q * 26, -26, q * 46, -46, q * 14, -30, q * 6, -18], c1); A.ball(g, q * 46, -46 + br * .5, 5.4, 5.4, '#e0b838', { lw: 2.4 }) }
    solid(g, [-12, -18, -6, -36, 0, -60, 6, -36, 12, -18], c2); A.ball(g, 0, -60 + br * .5, 5.4, 5.4, '#e0b838', { lw: 2.4 })
    A.line(g, al(c1, .6), 2, [-8, -28, 8, -28]); A.line(g, al(c1, .6), 2, [-10, -22, 10, -22])
    solid(g, [-28, 26, -22, 38, -15, 26, -8, 38, -1, 26, 6, 38, 13, 26, 20, 38, 27, 26], c2)
    A.ball(g, 0, 6 + br * .5, 28, 27, '#e0d4c0')
    A.poly(g, [-30, -14, 30, -14, 28, -8, -28, -8], c2, { lw: 2.4 })
    for (q = -1; q <= 1; q += 2) { A.poly(g, [q * 14, -2, q * 8, -8, q * 2, -2, q * 8, 4], '#14080c', { lw: 2 }); A.flat(g, q * 8, -2, 1.8, 2.4, mix('#ffd040', '#fff', ch * .5)); A.poly(g, [q * 20, 8, q * 15, 4, q * 10, 8, q * 15, 12], c1, { lw: 1.6 }) }
    A.mouth(g, 0, 17 + br * .4, 15, 2 + ch * 8, { n: 8, tl: .5, col: '#1a0a10', tongue: false })
    g.restore()
  }
  reg('loki', function (g) { jester(g, 0, 0, 1.12, '#8a2a40', '#2a2a5a') })
  reg('lokii', function (g) { jester(g, -28, 8, .72, '#2a4a7a', '#d8a030'); jester(g, 28, 8, .72, '#2a6a4a', '#8a2a40'); jester(g, 0, -4, .9, '#8a2a40', '#2a2a5a') })

  /* ---- The Stain: oil slick ------------------------------------------- */
  reg('the-stain', function (g) {
    var ch = A.ch, c = '#1e2a2e', i
    g.save(); g.scale(1 + ch * .12, 1 - ch * .08)
    A.tent(g, -40, 16, Math.PI, 16, 9, c, { amp: 3, taper: .6 }); A.tent(g, 40, 16, 0, 16, 9, c, { amp: 3, taper: .6, ph: 2 })
    A.blob(g, 0, 12, 46, 28, c, { n: 14, wob: .14, seed: 18, sp: 2 })
    A.flat(g, -12, 8, 22, 7, al('#a060e0', .38), -.3); A.flat(g, 12, 16, 20, 6, al('#40e0a0', .32), .2); A.flat(g, 0, 2, 16, 4, al('#e0c040', .28), .1)
    for (i = 0; i < 4; i++) { var bx = -26 + i * 17, by = 14 + (i % 2) * 8 + Math.sin(A.T * 2 + i) * 1.5; A.ball(g, bx, by, 5, 5, '#6a8a8e', { lw: 2 }); A.flat(g, bx - 1.6, by - 1.6, 1.4, 1.4, '#fff') }
    for (var q = -1; q <= 1; q += 2) {
      var sx = q * 15, sw = Math.sin(A.T * 2.4 + q) * 3
      A.line(g, '#0a1214', 7, [sx, 10, sx + sw, -12, sx - sw * .5, -28]); A.line(g, '#3a4a50', 3.4, [sx, 10, sx + sw, -12, sx - sw * .5, -28])
      lamp(g, sx - sw * .5, -30, 6.4, '#a0ff60')
    }
    g.restore()
  })

  /* ---- Mom, Mom's foot / hand / eye: hydraulic stomper, claw, porthole */
  function stomper (g, ch) {
    var lift = ch * 12, i
    g.save(); g.translate(0, -lift); g.scale(1 + ch * .05, 1 + ch * .05)
    plate(g, 0, -34, 30, 66, '#8a7a74', { r: 4 })
    for (i = 0; i < 4; i++) A.line(g, al('#000', .35), 2.4, [-14, -56 + i * 14, 14, -52 + i * 14])
    plate(g, 0, -4, 42, 10, '#6a5a56', { r: 3 })
    plate(g, 0, 22, 78, 32, '#7a6660', { r: 8, bolts: true })
    g.save(); g.beginPath(); g.rect(-38, 28, 76, 8); g.clip()
    for (i = -6; i < 7; i++) A.poly(g, [i * 12, 36, i * 12 + 7, 36, i * 12 + 15, 28, i * 12 + 8, 28], '#d8b030', { ol: false })
    g.restore()
    A.ball(g, -24, 42, 14, 7, '#a8343c'); A.ball(g, 0, 44, 15, 7, '#a8343c'); A.ball(g, 24, 42, 14, 7, '#a8343c')
    A.drip(g, -30, 44, 10, '#7a2a30', 2.4); gloss(g, -22, 14, 14, 4, -.1)
    g.restore()
  }
  reg('mom', function (g) { g.save(); g.translate(0, 14); stomper(g, A.ch); g.restore() }, { R: 20 })
  reg('mom-foot', function (g) { g.save(); g.translate(0, 14); stomper(g, A.ch); g.restore() }, { noWounds: true })
  reg('mom-hand', function (g) {
    var ch = A.ch, c = '#b8a89a'
    g.save(); g.translate(0, 8); g.rotate(Math.sin(A.T * 3) * .05)
    plate(g, 0, 40, 26, 46, '#8a7a74', { r: 4 }); A.line(g, al('#000', .35), 2.4, [-12, 34, 12, 34]); A.line(g, al('#000', .35), 2.4, [-12, 46, 12, 46])
    var an = [-2.45, -2.0, -1.14, -.69]
    for (var i = 0; i < 4; i++) { var a = an[i] + (i < 2 ? -1 : 1) * ch * .35; A.horn(g, Math.cos(a) * 14, 12 + Math.sin(a) * 8, a, 42, 15, c, i < 2 ? -.22 : .22) }
    A.horn(g, -18, 18, 2.9, 22, 11, c, .3)
    A.ball(g, 0, 12, 27, 22, '#7a6660')
    lamp(g, 0, 12, 8, '#ff7a4a'); rivets(g, [-18, 4, 18, 4, -16, 22, 16, 22], '#7a6660')
    g.restore()
  }, { noWounds: true })
  reg('mom-eye', function (g) {
    var ch = A.ch
    plate(g, 0, 0, 76, 88, '#6a4a3a', { r: 10, bolts: true })
    A.ball(g, 0, 0, 31, 31, '#4a4a52', { lw: 3.4 })
    A.flat(g, 0, 0, 24, 24, '#10080a')
    A.glow(g, 0, 0, 36, '#4aa8e8', .3 + ch * .3)
    lamp(g, 0, 0, 17, '#4aa8e8')
    A.line(g, al('#8ab8d8', .5), 1.6, [-24, 0, 24, 0]); A.line(g, al('#8ab8d8', .5), 1.6, [0, -24, 0, 24])
    for (var i = 0; i < 8; i++) { var a = i / 8 * TAU + .4; A.flat(g, Math.cos(a) * 28, Math.sin(a) * 28, 1.8, 1.8, '#8a8a92') }
  }, { noWounds: true })

  /* ---- Mom's Heart, It Lives: ruby cores ------------------------------ */
  function core (c, o) {
    return function (g) {
      var ch = A.ch, ph = (A.T * (1.6 + ch * 2) + (o.ph || 0)) % 1
      var beat = Math.exp(-ph * 9) * .09 + (ph > .22 ? Math.exp(-(ph - .22) * 9) * .06 : 0)
      var k = 1 + beat + ch * .04, i
      g.save(); g.scale(k, k)
      A.tent(g, -16, 40, 2.3, 26, 9, '#3a2a30', { amp: 2, taper: .3 }); A.tent(g, 16, 40, .8, 26, 9, '#3a2a30', { amp: 2, taper: .3, ph: 1 }); A.tent(g, 0, 44, Math.PI / 2, 22, 11, '#4a343a', { amp: 2, taper: .3, ph: 2 })
      A.glow(g, 0, 0, 58, o.glow || c, .4 + beat * 3 + ch * .2)
      if (o.thorns) A.spikes(g, 0, 0, 38, 10, 12, '#3a2a34', .3)
      solid(g, [0, -52, 32, -24, 32, 20, 0, 50, -32, 20, -32, -24], c)
      A.poly(g, [0, -52, -32, -24, 0, -6], sh(c, .3), { lw: 1.8 }); A.poly(g, [0, -52, 32, -24, 0, -6], sh(c, .05), { lw: 1.8 })
      A.poly(g, [-32, -24, -32, 20, 0, 50, 0, -6], sh(c, -.08), { lw: 1.8 }); A.poly(g, [32, -24, 32, 20, 0, 50, 0, -6], sh(c, -.4), { lw: 1.8 })
      for (i = 0; i < 4; i++) { var a = i / 4 * TAU + .8; A.poly(g, [Math.cos(a) * 40 - 4, Math.sin(a) * 40 - 4, Math.cos(a) * 40 + 4, Math.sin(a) * 40 + 4, Math.cos(a) * 24, Math.sin(a) * 24], '#8a8a92', { lw: 2 }) }
      if (o.eye) { lamp(g, 0, 0, 13, '#ffd060', { sq: 1.5 }); A.crack(g, -20, -30, 22, 1.8); A.crack(g, 20, 20, 20, 2.3) } else { A.flat(g, 0, 0, 9, 14, al('#ffb0b8', .35 + beat * 3)); gloss(g, -14, -16, 6, 12, -.2) }
      g.restore()
    }
  }
  reg('moms-heart', core('#c23a46', { glow: '#ff5a6a' }))
  reg('it-lives', core('#6a2a8a', { ph: .5, eye: true, thorns: true, glow: '#a05ae8' }))

  /* ---- The Fallen: carrion crow, Krampus: bog stag -------------------- */
  reg('the-fallen', function (g) {
    var c = '#2a2030', ch = A.ch
    A.wing(g, -8, -4, 52, -2.8, '#1e1626', { feather: true, dir: 1, flap: Math.sin(A.T * 3) * .1 })
    A.wing(g, 8, -4, 52, -.34, '#1e1626', { feather: true, dir: 1, flap: -Math.sin(A.T * 3) * .1 })
    solid(g, [-10, 24, 10, 24, 18, 48, 6, 54, 0, 50, -6, 54, -18, 48], '#241a2c')
    A.ball(g, 0, 4, 22, 30, c)
    A.line(g, '#6a5a80', 1.6, [-8, -6, -10, 20]); A.line(g, '#6a5a80', 1.6, [8, -6, 10, 20])
    A.ball(g, 0, -18, 17, 16, c)
    A.poly(g, [-8, -30, -2, -42, 2, -30], c); A.poly(g, [2, -30, 8, -40, 10, -28], sh(c, .08))
    solid(g, [-7, -14, 7, -14, 0, 4 + ch * 5], '#8a6a3a')
    lamp(g, -9, -22, 4.6, '#ff4020'); lamp(g, 9, -22, 4.6, '#ff4020')
    A.line(g, '#cfc8d0', 2.4, [-10, 30, -12, 42]); A.line(g, '#cfc8d0', 2.4, [10, 30, 12, 42])
    gloss(g, -8, -26, 5, 3)
  })
  function antler (g, q, sp) {
    var main = [q * 16, -24, q * (28 + sp), -42, q * (34 + sp), -60]
    A.line(g, '#2a2014', 8, main); A.line(g, '#d8ccb0', 4.4, main)
    var tines = [[q * 28, -42, q * (46 + sp), -44], [q * (33 + sp), -54, q * (48 + sp), -64], [q * 22, -34, q * 22, -52]]
    tines.forEach(function (tn) { A.line(g, '#2a2014', 6, tn); A.line(g, '#d8ccb0', 3, tn) })
  }
  reg('krampus', function (g) {
    var c = '#5a4434', ch = A.ch, sp = ch * 8
    antler(g, -1, sp); antler(g, 1, sp)
    A.ball(g, -28, -12, 10, 6, sh(c, -.1), { rot: -.4 }); A.ball(g, 28, -12, 10, 6, sh(c, -.1), { rot: .4 })
    solid(g, [-22, -24, 22, -24, 26, 0, 14, 40, -14, 40, -26, 0], c)
    for (var i = 0; i < 6; i++) A.line(g, al(sh(c, -.5), .7), 2, [-18 + i * 7, -22, -16 + i * 7, -10])
    A.warts(g, 0, -14, 18, 4, '#6a8a3a', 2)
    A.ball(g, 0, 30, 14, 11, '#3a2a22'); A.flat(g, 0, 38, 6, 4, '#120a0a')
    A.poly(g, [-26, -8, -8, -2, -8, 2, -24, 0], sh(c, -.45)); A.poly(g, [26, -8, 8, -2, 8, 2, 24, 0], sh(c, -.45))
    lamp(g, -13, 2, 6, '#ff4a2a'); lamp(g, 13, 2, 6, '#ff4a2a')
    A.line(g, '#120a0a', 3, [-8, 24, -10, 18]); A.line(g, '#120a0a', 3, [8, 24, 10, 18])
    gloss(g, -14, -18, 7, 4)
  })

  /* ---- Sisters Vis: standing stone ------------------------------------ */
  reg('sisters-vis', function (g) {
    var c = '#8a8478', ch = A.ch, br = Math.sin(A.T * 2.4), i
    var rocks = []
    for (i = 0; i < 3; i++) { var a = A.T * 1.2 + i * 2.1; rocks.push([Math.cos(a) * 44, Math.sin(a) * 16 + 4, Math.sin(a) > 0]) }
    rocks.forEach(function (r) { if (!r[2]) A.ball(g, r[0], r[1], 8, 7, '#6a645a', { lw: 2.4 }) })
    g.save(); g.translate(0, br)
    solid(g, [-26, -40, -8, -48, 12, -46, 28, -36, 32, -4, 30, 40, -30, 40, -32, -4], c)
    A.flat(g, -18, -34, 10, 5, al('#6a8a3a', .8), .2); A.flat(g, 16, 36, 12, 4, al('#6a8a3a', .7)); A.warts(g, -20, -30, 8, 3, '#6a8a3a', 4)
    A.poly(g, [-26, -16, 26, -16, 22, -10, -22, -10], sh(c, -.4))
    lamp(g, -12, -4, 6.4, '#e8d880'); lamp(g, 12, -4, 6.4, '#e8d880')
    solid(g, [-4, 0, 4, 0, 7, 14, -7, 14], sh(c, -.25), { lw: 2 })
    var my = 26 + ch * 2; A.line(g, '#1a1612', 5, [-14, my - 2, 0, my + 2, 14, my - 2]); A.line(g, mix('#e8d880', '#fff', ch * .5), 1.8, [-14, my - 2, 0, my + 2, 14, my - 2])
    for (i = 0; i < 3; i++) A.line(g, al('#e8d880', .7), 2, [-6 + i * 6, -34, -6 + i * 6, -26])
    A.crack(g, 22, -6, 22, 1.9)
    g.restore()
    rocks.forEach(function (r) { if (r[2]) A.ball(g, r[0], r[1] + br, 8, 7, '#6a645a', { lw: 2.4 }) })
  })

  /* ---- Tuff Twins: bramble balls (variant = parched twin) ------------- */
  reg('tuff-twins', function (g, t) {
    var dry = +t.variant === 1, c = dry ? '#8a6a34' : '#4a6a2a', ch = A.ch, k, i
    A.ball(g, 0, 0, 30, 28, '#1a1208', { lw: 2 })
    for (k = 0; k < 4; k++) {
      var rx = 42 - k * 4, ry = 28 + k * 3, rot = k * .8 + Math.sin(A.T * .8 + k) * .08
      g.save(); g.rotate(rot); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.lineWidth = 8; g.strokeStyle = '#120a06'; g.stroke(); g.lineWidth = 4.6; g.strokeStyle = sh(c, k * .06 - .08); g.stroke()
      for (i = 0; i < 6; i++) { var a = i / 6 * TAU + k; var tx = Math.cos(a) * rx, ty = Math.sin(a) * ry; A.poly(g, [tx - Math.sin(a) * 3, ty + Math.cos(a) * 3, tx + Math.sin(a) * 3, ty - Math.cos(a) * 3, tx * 1.14, ty * 1.14], '#d8cca8', { lw: 1.6 }) }
      g.restore()
    }
    A.ball(g, 0, 0, 22, 20, '#120a06', { lw: 2 })
    lamp(g, -9, -2, 6, dry ? '#ffb040' : '#c8ff60'); lamp(g, 9, -2, 6, dry ? '#ffb040' : '#c8ff60')
    A.line(g, '#d8cca8', 2.4, [-8, 10, -4, 13 + ch * 3, 0, 10, 4, 13 + ch * 3, 8, 10])
  })

  /* ---- The Shell: armoured tortoise ----------------------------------- */
  reg('the-shell', function (g) {
    var ch = A.ch, c = '#6a7a4a', i
    for (var q = -1; q <= 1; q += 2) { A.ball(g, q * 38, -18, 10, 12, '#4a5a34', { rot: q * .4 }); A.ball(g, q * 38, 22, 10, 12, '#4a5a34', { rot: -q * .4 }) }
    A.ball(g, 0, -42, 6, 8, '#4a5a34', { lw: 2 })
    var hy = 38 + ch * 8
    A.ball(g, 0, hy, 14, 15, '#8a9a58')
    A.poly(g, [-6, hy + 4, 6, hy + 4, 0, hy + 14], '#d8c8a0', { lw: 2 })
    lamp(g, -7, hy - 5, 3.8, '#ffd050', { lw: 1.8 }); lamp(g, 7, hy - 5, 3.8, '#ffd050', { lw: 1.8 })
    A.spikes(g, 0, -2, 40, 10, 7, '#d8c8a0', .2 + ch * .2)
    A.ball(g, 0, -2, 42, 38, c)
    var hex = []; for (i = 0; i < 6; i++) hex.push(Math.cos(i / 6 * TAU) * 14, -2 + Math.sin(i / 6 * TAU) * 13)
    A.poly(g, hex, sh(c, .1), { lw: 2.6, ol: sh(c, -.6) })
    for (i = 0; i < 6; i++) A.line(g, sh(c, -.6), 2.6, [hex[i * 2], hex[i * 2 + 1], hex[i * 2] * 2.6, -2 + (hex[i * 2 + 1] + 2) * 2.6])
    A.warts(g, 0, -2, 36, 5, '#8a9a58', 3)
    A.crack(g, -24, -20, 18, 2.4)
    gloss(g, -22, -24, 12, 5)
  })

  /* ---- The Matriarch: brood queen ------------------------------------- */
  reg('the-matriarch', function (g) {
    var ch = A.ch, br = Math.sin(A.T * 2), i
    for (var q = -1; q <= 1; q += 2) for (i = 0; i < 3; i++) A.leg(g, q * 18, -8 + i * 14, q * (36 + i * 3), 0 + i * 14 + Math.sin(A.T * 4 + i + q) * 3, q * (46 - i * 2), 14 + i * 14, 5, '#6a4a2a')
    A.blob(g, 0, 14, 40 + br, 38 + br, '#c8a870', { n: 12, wob: .05, seed: 27 })
    for (i = 0; i < 3; i++) A.line(g, al('#4a2a14', .75), 3.4, [-34, 4 + i * 14, 0, 10 + i * 14, 34, 4 + i * 14])
    var eg = [[-18, 6], [14, 0], [-4, 20], [22, 24], [-22, 30], [6, 36], [0, -2]]
    eg.forEach(function (e, j) { var pu = 1 + Math.max(0, Math.sin(A.T * 3 + j * 2)) * .25 + ch * .2; A.ball(g, e[0], e[1] + 8, 6 * pu, 7 * pu, '#efe6c8', { lw: 2 }) })
    A.ball(g, 0, -20, 22, 13, '#8a6a40')
    A.ball(g, 0, -34, 17, 13, '#6a4a2a')
    for (i = -2; i <= 2; i++) A.poly(g, [i * 6 - 3, -44, i * 6 + 3, -44, i * 6, -54 + Math.abs(i)], '#d8b848', { lw: 2 })
    lamp(g, -8, -36, 4.6, '#ff8a3a'); lamp(g, 8, -36, 4.6, '#ff8a3a')
    A.horn(g, -8, -26, 1.9 + ch * .3, 20, 8, '#d8c8a8', -.5); A.horn(g, 8, -26, 1.24 - ch * .3, 20, 8, '#d8c8a8', .5)
    gloss(g, -22, -2, 11, 5)
  })

  /* ---- Chimera: scorpion-tailed manticore ----------------------------- */
  reg('chimera', function (g) {
    var ch = A.ch, i
    A.wing(g, -16, 6, 38, -2.5, '#5a3a3a', { dir: 1, flap: Math.sin(A.T * 3) * .08 }); A.wing(g, 16, 6, 38, -.64, '#5a3a3a', { dir: 1, flap: -Math.sin(A.T * 3) * .08 })
    var tp = [22, 30, 46, 24, 52, -2, 40, -32, 20 - ch * 6, -46 + ch * 8]
    A.line(g, '#1a1208', 11, tp); A.line(g, '#8a6a3a', 6.4, tp)
    for (i = 0; i < 4; i++) A.ball(g, tp[2 + i * 2], tp[3 + i * 2], 4.6, 4.6, '#a8803e', { lw: 2 })
    A.poly(g, [tp[8] - 4, tp[9] - 3, tp[8] + 4, tp[9] - 3, tp[8] - 2 - ch * 3, tp[9] + 14], '#c84a2a', { lw: 2 })
    A.ball(g, 0, 26, 28, 20, '#a8783e')
    A.spikes(g, 0, -8, 32, 14, 12, '#7a3a18', 0)
    A.ball(g, 0, -8, 34, 32, '#8a4a20')
    A.ball(g, 0, -6, 24, 22, '#c89858')
    A.ball(g, 0, 6, 12, 9, '#d8b078'); A.poly(g, [-4, 2, 4, 2, 0, 7], '#2a1208', { lw: 1.6 })
    A.poly(g, [-22, -22, -14, -34, -8, -22], '#8a4a20'); A.poly(g, [22, -22, 14, -34, 8, -22], '#8a4a20')
    lamp(g, -11, -10, 5.4, '#ffd040'); lamp(g, 11, -10, 5.4, '#ffd040')
    A.mouth(g, 0, 14, 9, 2 + ch * 7, { n: 4, tl: .6, col: '#2a0a08', tongue: false })
    gloss(g, -14, -20, 8, 4)
  })

  /* ---- Rotgut: brimming ooze vat -------------------------------------- */
  reg('rotgut', function (g) {
    var c = '#7a5a3a', ch = A.ch, br = Math.sin(A.T * 2.6), i
    for (var q = -1; q <= 1; q += 2) A.ball(g, q * 24, 46, 10, 5, '#3a2a1a', { lw: 2 })
    solid(g, [-30, -26, 30, -26, 38, 0, 32, 38, -32, 38, -38, 0], c)
    for (i = -3; i <= 3; i++) A.line(g, al(sh(c, -.6), .8), 2.2, [i * 9, -26, i * 11, 38])
    for (i = 0; i < 2; i++) { var y = -12 + i * 34; A.line(g, '#1a1a1e', 8, [-37, y, 0, y + 4, 37, y]); A.line(g, '#5a5a62', 4.4, [-37, y, 0, y + 4, 37, y]) }
    A.ball(g, 0, -27, 30, 9, '#3a2a1a'); A.ball(g, 0, -29 + br * .5, 25, 6, '#8aa83a', { lw: 2.4 })
    A.drip(g, -26, -22, 24, '#8aa83a', 4.4); A.drip(g, 14, -24, 18, '#8aa83a', 4); A.drip(g, 30, -18, 12, '#8aa83a', 3)
    for (i = 0; i < 3; i++) { var f = (A.T * .6 + i / 3) % 1; A.ball(g, -10 + i * 10, -34 - f * 12, 3 + f * 3, 3 + f * 3, '#b8d86a', { lw: 1.4 }) }
    lamp(g, -12, 6, 6.4, '#e8e060'); lamp(g, 12, 6, 6.4, '#e8e060')
    A.mouth(g, 0, 24, 14, 3 + ch * 9, { n: 6, tl: .6, col: '#1a1a08', tongue: false })
    gloss(g, -26, 0, 4, 18, -.1)
  })

  /* ---- The Adversary: black sun ---------------------------------------- */
  reg('the-adversary', function (g) {
    var ch = A.ch, i
    A.glow(g, 0, 0, 62, '#ffd060', .4 + ch * .3)
    for (i = 0; i < 24; i++) {
      var a = i / 24 * TAU + A.T * .25, l = (i % 2 ? 50 : 42) + ch * 10 + Math.sin(A.T * 3 + i) * 2
      A.poly(g, [Math.cos(a - .07) * 30, Math.sin(a - .07) * 30, Math.cos(a) * l, Math.sin(a) * l, Math.cos(a + .07) * 30, Math.sin(a + .07) * 30], '#e8b838', { lw: 1.8 })
    }
    A.ball(g, 0, 0, 33, 33, '#14101a', { lw: 3.4 })
    g.beginPath(); g.arc(0, 0, 27, 0, TAU); g.lineWidth = 3; g.strokeStyle = '#d8a830'; g.stroke()
    lamp(g, 0, 0, 15, '#ffd060', { sq: 1.3 })
    gloss(g, -14, -18, 9, 4)
  })

  /* ---- Brownie: spined hedgehog --------------------------------------- */
  reg('brownie', function (g) {
    var ch = A.ch, c = '#7a5a3a', i
    for (i = 0; i < 24; i++) {
      var a = i / 24 * TAU, l = 48 + (i % 3) * 3 + ch * 8 + Math.sin(A.T * 3 + i) * 1.4
      A.poly(g, [Math.cos(a - .1) * 34, 2 + Math.sin(a - .1) * 32, Math.cos(a) * l, 2 + Math.sin(a) * l * .96, Math.cos(a + .1) * 34, 2 + Math.sin(a + .1) * 32], i % 2 ? '#4a3220' : '#6a4a2c', { lw: 2.2 })
    }
    A.ball(g, 0, 2, 38, 36, c)
    A.ball(g, -26, 0, 8, 8, '#c8a078', { lw: 2.2 }); A.ball(g, 26, 0, 8, 8, '#c8a078', { lw: 2.2 })
    A.ball(g, 0, 14, 22, 20, '#c8a078')
    A.ball(g, 0, 26, 10, 8, '#d8b890'); A.flat(g, 0, 29, 4, 3, '#1a0e0a')
    lamp(g, -11, 6, 5, '#d8a030'); lamp(g, 11, 6, 5, '#d8a030')
    A.poly(g, [-6, 33, -2, 33, -4, 39 + ch * 3], '#efe6d0', { lw: 1.6 }); A.poly(g, [6, 33, 2, 33, 4, 39 + ch * 3], '#efe6d0', { lw: 1.6 })
    gloss(g, -18, -10, 10, 5)
  })

  /* ---- The Forsaken: brass deep-sea diver ----------------------------- */
  reg('the-forsaken', function (g) {
    var ch = A.ch, br = Math.sin(A.T * 2.2) * 2, i
    g.save(); g.translate(0, br)
    A.tent(g, -26, -26, 2.7, 34, 7, '#2a2a30', { amp: 6, ph: 1 }); A.tent(g, 26, -26, .45, 34, 7, '#2a2a30', { amp: 6, ph: 3 })
    for (var q = -1; q <= 1; q += 2) A.ball(g, q * 16, 44, 12, 7, '#5a4a2a')
    solid(g, [-26, -4, 26, -4, 34, 36, -34, 36], '#3a4a48')
    for (i = 0; i < 3; i++) A.line(g, al('#000', .4), 2.4, [-30 + i * 2, 8 + i * 9, 30 - i * 2, 8 + i * 9])
    plate(g, 0, 10, 30, 22, '#8a6a2a', { r: 4, bolts: true })
    A.ball(g, -38, 14, 9, 16, '#3a4a48', { rot: .3 }); A.ball(g, 38, 14, 9, 16, '#3a4a48', { rot: -.3 })
    A.ball(g, -40, 28, 7, 5, '#8a6a2a', { lw: 2 }); A.ball(g, 40, 28, 7, 5, '#8a6a2a', { lw: 2 })
    A.ball(g, 0, -28, 27, 26, '#a8802a')
    A.ball(g, 0, -26, 16, 16, '#3a2a14', { lw: 2.6 }); A.flat(g, 0, -26, 12, 12, '#06100e')
    lamp(g, 0, -26, 8.6, '#5affc0', { sq: 1.15 })
    for (i = 0; i < 8; i++) { var a = i / 8 * TAU; A.flat(g, Math.cos(a) * 14.4, -26 + Math.sin(a) * 14.4, 1.5, 1.5, '#3a2a14') }
    A.ball(g, 0, -53, 5, 5, '#8a6a2a', { lw: 2 })
    A.ball(g, -26, -28, 4, 7, '#8a6a2a', { lw: 2 }); A.ball(g, 26, -28, 4, 7, '#8a6a2a', { lw: 2 })
    gloss(g, -14, -42, 8, 4)
    g.restore()
  })

  /* ---- Big Horn: rhinoceros beetle ------------------------------------ */
  reg('big-horn', function (g) {
    var c = '#2a4a3a', ch = A.ch, q, i
    for (q = -1; q <= 1; q += 2) for (i = 0; i < 3; i++) A.leg(g, q * 24, -2 + i * 14, q * (40 + i * 2), 4 + i * 14 + Math.sin(A.T * 5 + i + q) * 2, q * (48 - i * 2), 18 + i * 14, 5, '#1a2a22')
    A.ball(g, 0, 14, 34, 36, c)
    A.line(g, sh(c, -.6), 3, [0, -20, 0, 50])
    A.flat(g, -16, 8, 6, 20, al('#8ad8b0', .3), -.15); A.flat(g, 16, 14, 4, 16, al('#8ad8b0', .2), .15)
    A.ball(g, 0, -14, 26, 15, '#34503e')
    A.ball(g, 0, -30 + ch * 4, 14, 11, '#2a4a3a')
    A.horn(g, 0, -36 + ch * 4, -1.57, 34, 15, '#1e2a22', .12)
    A.horn(g, 0, -56 + ch * 4, -2.3, 14, 7, '#1e2a22', -.3); A.horn(g, 0, -56 + ch * 4, -.84, 14, 7, '#1e2a22', .3)
    lamp(g, -9, -29 + ch * 4, 4.4, '#ffa040'); lamp(g, 9, -29 + ch * 4, 4.4, '#ffa040')
    gloss(g, -14, -4, 8, 4)
  })

  /* ---- The Visage: orrery of stone rings ------------------------------ */
  reg('the-visage', function (g) {
    var ch = A.ch, br = Math.sin(A.T * 2) * 3, i
    A.glow(g, 0, br, 56, '#8ab8ff', .25 + ch * .25)
    g.save(); g.translate(0, br)
    A.ball(g, 0, 48, 14, 5, '#6a6a78', { lw: 2.4 })
    for (i = 0; i < 3; i++) {
      g.save(); g.rotate(i * 1.05 + A.T * (.3 + i * .12)); g.beginPath(); g.ellipse(0, 0, 44 - i * 4, 15 + i * 8, 0, 0, TAU)
      g.lineWidth = 7.4; g.strokeStyle = '#1a1a26'; g.stroke(); g.lineWidth = 4; g.strokeStyle = i % 2 ? '#aab8c8' : '#d8b848'; g.stroke(); g.restore()
    }
    A.ball(g, 0, 0, 18, 18, '#2a3a58', { lw: 3.4 })
    lamp(g, 0, 0, 12, '#9ad0ff')
    var pc = ['#d8b848', '#8ad8b0', '#e87a5a']
    for (i = 0; i < 3; i++) { var a = A.T * (1 + i * .4) + i * 2; A.ball(g, Math.cos(a) * 40, Math.sin(a) * (16 + i * 8), 5.4, 5.4, pc[i], { lw: 2 }) }
    g.restore()
  })

  /* ---- Clutch: brittle star ------------------------------------------- */
  reg('clutch', function (g) {
    var ch = A.ch
    for (var i = 0; i < 7; i++) {
      var a = i / 7 * TAU + Math.sin(A.T + i) * .08, l = 38 + ch * 6 + Math.sin(A.T * 4 + i * 2) * 3
      var tp = A.tent(g, Math.cos(a) * 10, Math.sin(a) * 10, a, l, 15, '#b8683a', { amp: 3, ph: i, taper: .75, hi: true })
      A.poly(g, [tp.x + Math.cos(a + 1.57) * 3, tp.y + Math.sin(a + 1.57) * 3, tp.x + Math.cos(a - 1.57) * 3, tp.y + Math.sin(a - 1.57) * 3, tp.x + Math.cos(a) * 9, tp.y + Math.sin(a) * 9], '#d8c8a0', { lw: 2 })
      for (var j = 1; j < 4; j++) A.flat(g, Math.cos(a) * (10 + j * 8), Math.sin(a) * (10 + j * 8), 1.8, 1.8, al('#3a1a10', .8))
    }
    A.ball(g, 0, 0, 23, 23, '#7a3a2a')
    for (i = 0; i < 6; i++) { var b = i / 6 * TAU + .3; A.flat(g, Math.cos(b) * 18, Math.sin(b) * 18, 2, 2, '#d8c8a0') }
    lamp(g, 0, 0, 13, '#f0e060')
  }, { R: 22 })

  /* ---- Colostomia: trilobite ------------------------------------------ */
  reg('colostomia', function (g) {
    var c = '#9a7a9a', ch = A.ch, br = Math.sin(A.T * 2.4), i
    for (var q = -1; q <= 1; q += 2) for (i = 0; i < 5; i++) A.line(g, '#3a2a3a', 3.4, [q * 26, -8 + i * 9, q * (38 + Math.sin(A.T * 5 + i) * 2), -4 + i * 9 + 4])
    A.ball(g, 0, 40, 17, 11, sh(c, -.1))
    for (i = 0; i < 4; i++) { A.ball(g, 0, -2 + i * 10 + br * .4, 30 - i * 3, 8, sh(c, i * .02 - .04)); A.line(g, al('#3a2a3a', .6), 1.8, [-24 + i * 3, -2 + i * 10, 24 - i * 3, -2 + i * 10]) }
    A.flat(g, 0, 18, 8, 28, al('#fff', .16)); A.line(g, al('#3a2a3a', .7), 2, [-8, -2, -8, 38]); A.line(g, al('#3a2a3a', .7), 2, [8, -2, 8, 38])
    A.ball(g, 0, -24, 30, 19, c)
    A.poly(g, [-30, -20, -42, 2, -26, -8], sh(c, -.1)); A.poly(g, [30, -20, 42, 2, 26, -8], sh(c, -.1))
    A.flat(g, 0, -28, 8, 12, sh(c, .18))
    lamp(g, -18, -26, 6, '#e8d040', { sq: 1.3 }); lamp(g, 18, -26, 6, '#e8d040', { sq: 1.3 })
    A.mouth(g, 0, -10, 6, 1.5 + ch * 5, { n: 0, tongue: false })
    gloss(g, -16, -32, 9, 4)
  })

  /* ---- The Lamb: ember basalt golem ----------------------------------- */
  reg('the-lamb', function (g) {
    var ch = A.ch, br = Math.sin(A.T * 2.6), i
    A.glow(g, 0, 6, 58, '#ff5a1a', .3 + ch * .3)
    for (i = -2; i <= 2; i++) { var f = Math.sin(A.T * 10 + i * 1.7) * 3; A.poly(g, [i * 9 - 6, -36, i * 9 + 6, -36, i * 9 + f, -52 - (2 - Math.abs(i)) * 5 - ch * 8], i % 2 ? '#ffd040' : '#ff8a28', { lw: 2 }) }
    A.ball(g, -42, 14, 12, 17, '#4a4046', { rot: .2 }); A.ball(g, 42, 14, 12, 17, '#4a4046', { rot: -.2 })
    solid(g, [-30, -14, -12, -26, 12, -26, 30, -14, 38, 20, 26, 44, -26, 44, -38, 20], '#3a3236')
    var cr = [[-22, -8, -10, 12, -20, 34], [18, -12, 8, 6, 20, 30], [-4, 4, 4, 22, -2, 40]]
    cr.forEach(function (p) { A.line(g, '#8a2a0a', 6, p); A.line(g, mix('#ff8a2a', '#ffe070', ch * .6), 3, p) })
    solid(g, [-16, -30, -6, -42, 10, -40, 18, -28, 14, -14, -14, -14], '#4a4046')
    lamp(g, -6, -27 + br * .3, 4.4, '#ff8a2a'); lamp(g, 8, -27 + br * .3, 4.4, '#ff8a2a')
    gloss(g, -22, -16, 9, 4)
  })

  /* ---- Satan, Mega Satan: abyss wyrm ---------------------------------- */
  function wyrm (g, k, c, ec, mega) {
    var ch = A.ch, br = Math.sin(A.T * 2), i
    g.save(); g.scale(k, k)
    A.glow(g, 0, 6, 56, '#a81a18', .3 + ch * .25)
    for (i = -5; i <= 5; i++) { var fa = -1.57 + i * .27, fl = 58 - Math.abs(i) * 2.4; solid(g, [Math.cos(fa - .12) * 30, -6 + Math.sin(fa - .12) * 30, Math.cos(fa) * fl, -6 + Math.sin(fa) * fl, Math.cos(fa + .12) * 30, -6 + Math.sin(fa + .12) * 30], mega ? '#b88a2a' : '#5a1a1a', { lw: 2.4 }) }
    A.ball(g, 0, 36, 26, 16, c)
    if (mega) { A.hand(g, -46, 30, 14, '#2a1a20', -.3); A.hand(g, 46, 30, 14, '#2a1a20', .3) }
    A.poly(g, [-30, -10, -48, -22, -34, 4], sh(c, -.1)); A.poly(g, [30, -10, 48, -22, 34, 4], sh(c, -.1))
    solid(g, [-30, -18 + br, 0, -30 + br, 30, -18 + br, 34, 6 + br, 18, 30 + br, -18, 30 + br, -34, 6 + br], sh(c, .06))
    A.poly(g, [-28, -18 + br, -8, -8 + br, -8, -2 + br, -26, -8 + br], '#1a0a0c'); A.poly(g, [28, -18 + br, 8, -8 + br, 8, -2 + br, 26, -8 + br], '#1a0a0c')
    lamp(g, -15, -5 + br, 6.8, ec); lamp(g, 15, -5 + br, 6.8, ec)
    A.flat(g, -4, 8 + br, 1.8, 3, '#0a0408'); A.flat(g, 4, 8 + br, 1.8, 3, '#0a0408')
    A.glow(g, 0, 20 + br, 18 + ch * 14, '#ff7a2a', .5)
    A.mouth(g, 0, 20 + br, 16, 4 + ch * 11, { n: 8, tl: .7, col: '#8a1a0a', tongue: false })
    if (mega) A.crown(g, 0, -34 + br, 18, 14, '#e0b83c')
    g.restore()
  }
  reg('satan', function (g) { wyrm(g, 1, '#3a1a1e', '#e84a2a') })
  reg('mega-satan', function (g) { wyrm(g, 1.12, '#241418', '#ff2a1a', true) })

  /* ---- Boss Isaac: porcelain doll, Blue Baby: tin automaton ----------- */
  function windkey (g, x, y, c) {
    A.line(g, '#2a2a30', 6, [x - 12, y, x, y]); A.line(g, '#8a8a92', 3, [x - 12, y, x, y])
    var s = Math.cos(A.T * 2) * 1
    A.ball(g, x + 4, y - 6 * s, 6, 4, c, { lw: 2 }); A.ball(g, x + 4, y + 6 * s, 6, 4, c, { lw: 2 })
  }
  reg('boss-isaac', function (g) {
    var c = '#eadcc8', ch = A.ch, br = Math.sin(A.T * 3)
    A.glow(g, 0, 0, 60, '#cfe6ff', .2)
    windkey(g, 38, 6, '#d8b848')
    solid(g, [-16, 12, 16, 12, 32, 48, -32, 48], '#b8a8d0')
    for (var i = -3; i <= 3; i++) A.poly(g, [i * 9 - 5, 44, i * 9 + 5, 44, i * 9, 52], '#d8c8e8', { lw: 2 })
    A.ball(g, -26, 24, 7, 11, c, { rot: .5 }); A.ball(g, 26, 24, 7, 11, c, { rot: -.5 })
    A.ball(g, -34, -6, 9, 12, '#3a2a22', { rot: .3 }); A.ball(g, 34, -6, 9, 12, '#3a2a22', { rot: -.3 })
    A.ball(g, 0, -8 + br, 34, 31, c)
    A.ball(g, 0, -34 + br, 31, 12, '#8a7aa0')
    for (i = -3; i <= 3; i++) A.ball(g, i * 9, -37 + br, 5, 4, '#a898c0', { lw: 1.6 })
    A.blush(g, -20, 2 + br, 7); A.blush(g, 20, 2 + br, 7)
    A.eye(g, -12, -9 + br, 8, { sc: '#f4eee4', col: '#3a5a8a', lid: 0, pu: 1.4 }); A.eye(g, 12, -9 + br, 8, { sc: '#f4eee4', col: '#3a5a8a', lid: 0, pu: 1.4 })
    A.crack(g, -4, -34 + br, 30, 1.7); A.crack(g, 18, -14 + br, 14, .6)
    A.mouth(g, 0, 14 + br, 5 + ch * 3, 2 + ch * 7, { n: 0, tongue: false, col: '#a02a3a' })
    gloss(g, -18, -22 + br, 9, 4)
  })
  reg('boss-blue-baby', function (g) {
    var c = '#5a8a9a', ch = A.ch, br = Math.sin(A.T * 3), i
    windkey(g, -38, 4, '#c8c8d0')
    for (var q = -1; q <= 1; q += 2) { A.line(g, '#8a8a92', 3.4, [q * 12, 36, q * 14, 40, q * 10, 44, q * 14, 48]); A.ball(g, q * 12, 50, 9, 4, '#6a6a72', { lw: 2 }) }
    plate(g, 0, 28, 40, 24, '#4a7a8a', { r: 6, bolts: true })
    A.ball(g, -36, 20, 8, 12, '#8a8a92', { rot: .3 }); A.ball(g, 36, 20, 8, 12, '#8a8a92', { rot: -.3 })
    plate(g, 0, -8 + br, 72, 58, c, { r: 12, bolts: true })
    plate(g, 0, -8 + br, 58, 44, '#1a2a30', { r: 7, lw: 2.4 })
    lamp(g, -15, -14 + br, 10, '#ffd050'); lamp(g, 15, -14 + br, 10, '#ffd050')
    for (i = 0; i < 6; i++) { A.line(g, '#0a1214', 3.6, [-15 + i * 6, 6 + br, -15 + i * 6, 14 + br]); A.line(g, mix('#8ab0b8', '#ff5a3a', ch), 1.8, [-15 + i * 6, 6 + br, -15 + i * 6, 14 + br]) }
    A.line(g, '#8a8a92', 3, [0, -38 + br, 0, -52 + br]); A.ball(g, 0, -54 + br, 5, 5, Math.sin(A.T * 6) > 0 ? '#ff5a4a' : '#8a2a2a', { lw: 2 })
    A.flat(g, 24, 4 + br, 6, 12, al('#2a3a30', .5), .3)
    gloss(g, -26, -28 + br, 12, 4)
  })

  /* ---- Hush: thunderhead ---------------------------------------------- */
  reg('hush', function (g) {
    var c = '#5a6078', ch = A.ch, i
    for (i = 0; i < 6; i++) { var f = (A.T * 1.4 + i / 6) % 1; A.line(g, al('#9ac8ff', .6), 1.8, [-36 + i * 14, 20 + f * 30, -38 + i * 14, 28 + f * 30]) }
    if (Math.sin(A.T * 12) > -.2 + ch * -.6) { A.glow(g, 0, 40, 34, '#fff070', .35); A.poly(g, [-4, 24, 8, 24, 2, 38, 12, 38, -8, 60, -2, 44, -10, 44], '#fff070', { lw: 2 }) }
    var back = [[-30, 10, 18], [-10, 16, 20], [14, 14, 20], [32, 8, 16]]
    back.forEach(function (b, j) { A.ball(g, b[0], b[1] + Math.sin(A.T * 2 + j) * 1.4, b[2], b[2] * .8, '#3e4458') })
    var top = [[-30, -8, 20], [-14, -24, 22], [12, -26, 24], [30, -8, 20], [0, -6, 28]]
    top.forEach(function (b, j) { A.ball(g, b[0], b[1] + Math.sin(A.T * 2 + j * 1.3) * 1.4, b[2], b[2] * .88, c) })
    lamp(g, -14, -4, 7.4, '#ffe860', { hz: true }); lamp(g, 14, -4, 7.4, '#ffe860', { hz: true })
    A.line(g, '#1a1c28', 3.4, [-10, 14 + ch * 2, 0, 10 + ch * 3, 10, 14 + ch * 2])
    gloss(g, -22, -26, 12, 5)
  })

  /* ---- Delirium: glitch (kept: already an original design) ------------ */
  reg('delirium', function (g, t) {
    var f = Math.floor(A.T * 12), ch = A.ch
    var cols = ['#e83a5a', '#3ae8d8', '#e8d83a']
    for (var k = 0; k < 3; k++) {
      var dx = (A.rnd(f + k * 7) - .5) * (4 + ch * 12), dy = (A.rnd(f + k * 13) - .5) * 4
      g.save(); g.translate(dx, dy); g.globalAlpha = k ? .35 : 1
      A.blob(g, 0, 0, 40 + (A.rnd(f + k) - .5) * 8, 40, k ? cols[k - 1] : '#16121c', { n: 14, wob: .12, seed: f + k * 5, sp: 6 })
      g.restore(); g.globalAlpha = 1
    }
    for (var i = 0; i < 7; i++) {
      var a = A.rnd(f * 3 + i) * TAU, d = 8 + A.rnd(f + i * 9) * 30
      A.eye(g, Math.cos(a) * d, Math.sin(a) * d, 4 + A.rnd(i * 5) * 7, { sc: '#e8e0f0', col: cols[i % 3], lid: 0, lx: Math.cos(f + i), ly: Math.sin(f * 2 + i) })
    }
    for (i = 0; i < 4; i++) A.flat(g, (A.rnd(f + i * 4) - .5) * 100, (A.rnd(f + i * 6) - .5) * 100, 8 + A.rnd(i + f) * 16, 2, al(cols[i % 3], .55))
    A.mouth(g, 0, 20, 14 + A.rnd(f) * 12, 3 + ch * 12, { n: 8, tl: .6, col: '#000', tongue: false })
  }, { R: 26 })

  /* ---- Mother: great moth --------------------------------------------- */
  reg('mother', function (g) {
    var ch = A.ch, br = Math.sin(A.T * 1.8) * 2, fl = 1 + Math.sin(A.T * 5) * .04, i
    A.glow(g, 0, 0, 62, '#ff9aa0', .25)
    for (var q = -1; q <= 1; q += 2) {
      g.save(); g.scale(q * fl, 1)
      A.ball(g, 32, 20, 22, 17, '#8a5a8a', { rot: .5 }); A.ball(g, 32, -14, 31, 22, '#a87aa8', { rot: -.5 })
      for (i = 0; i < 3; i++) A.flat(g, 38, -20, 11 - i * 3.4, 9 - i * 2.8, ['#e8c0d0', '#3a1a3a', '#ffd070'][i], -.5)
      A.line(g, al('#4a2a4a', .6), 2, [14, -14, 40, -30]); A.line(g, al('#4a2a4a', .6), 2, [14, -8, 44, -6])
      A.line(g, '#3a2a3a', 2.4, [q * 0 + 4, -36, 14, -52]); A.line(g, '#3a2a3a', 1.6, [10, -46, 18, -44]); A.line(g, '#3a2a3a', 1.6, [12, -50, 20, -49])
      g.restore()
    }
    A.ball(g, 0, 6 + br, 14, 30, '#d8c8b0')
    for (i = 0; i < 5; i++) A.line(g, al('#6a5a4a', .7), 2.4, [-12, -8 + i * 9 + br, 0, -5 + i * 9 + br, 12, -8 + i * 9 + br])
    A.ball(g, 0, -26 + br, 13, 12, '#cdbca0')
    lamp(g, -6, -27 + br, 4.8, '#ff6a8a', { lw: 2 }); lamp(g, 6, -27 + br, 4.8, '#ff6a8a', { lw: 2 })
    A.poly(g, [-3, -18 + br, 3, -18 + br, 0, -10 + br + ch * 4], '#6a4a4a', { lw: 1.6 })
  })

  /* ---- The Beast: ember hellhound ------------------------------------- */
  reg('the-beast', function (g) {
    var c = '#2a1c1c', ch = A.ch, i
    A.glow(g, 0, 0, 62, '#a81a18', .3 + ch * .3)
    for (i = 0; i < 11; i++) { var a = -3.0 + i * .28, l = 54 + Math.sin(A.T * 8 + i) * 3 + ch * 6; A.poly(g, [Math.cos(a - .12) * 36, -4 + Math.sin(a - .12) * 36, Math.cos(a) * l, -4 + Math.sin(a) * l, Math.cos(a + .12) * 36, -4 + Math.sin(a + .12) * 36], i % 2 ? '#ff8a28' : '#d82a18', { lw: 2.2 }) }
    solid(g, [-30, -24, -22, -44, -10, -26, 10, -26, 22, -44, 30, -24, 34, 6, 20, 40, -20, 40, -34, 6], c)
    A.poly(g, [-26, -28, -22, -40, -14, -28], '#5a2a2a', { lw: 2 }); A.poly(g, [26, -28, 22, -40, 14, -28], '#5a2a2a', { lw: 2 })
    solid(g, [-16, 6, 16, 6, 12, 34, -12, 34], '#1e1414')
    A.ball(g, 0, 10, 8, 5, '#0a0606', { lw: 2 })
    lamp(g, -17, -8, 6.4, '#ff5a1a'); lamp(g, 17, -8, 6.4, '#ff5a1a')
    A.crack(g, 22, -20, 20, 1.9)
    A.mouth(g, 0, 31, 13, 3 + ch * 11, { n: 8, tl: .8, col: '#8a2a0a', tongue: false })
    gloss(g, -16, -20, 8, 4)
  })

  /* ---- Dogma: refracting prism ---------------------------------------- */
  reg('dogma', function (g) {
    var ch = A.ch, f = Math.floor(A.T * 20), i
    A.glow(g, 0, 0, 64, '#fff6c8', .3 + ch * .3)
    var rb = ['#ff5a7a', '#5affc8', '#6a8aff']
    for (i = 0; i < 3; i++) { var off = (3 + ch * 7) * (i - 1); g.save(); g.translate(off, 0); g.globalAlpha = .3; A.poly(g, [0, -56, 22, -30, 22, 24, 0, 50, -22, 24, -22, -30], rb[i], { ol: false }); g.restore() }
    solid(g, [0, -56, 24, -30, 24, 24, 0, 52, -24, 24, -24, -30], '#d8e8f0')
    A.poly(g, [0, -56, -24, -30, 0, -8], '#ffffff', { lw: 1.8, ol: '#7a8aa0' }); A.poly(g, [0, -56, 24, -30, 0, -8], '#b8d0e0', { lw: 1.8, ol: '#7a8aa0' })
    A.poly(g, [-24, -30, -24, 24, 0, 52, 0, -8], '#a8c0d8', { lw: 1.8, ol: '#7a8aa0' }); A.poly(g, [24, -30, 24, 24, 0, 52, 0, -8], '#7a98b8', { lw: 1.8, ol: '#7a8aa0' })
    for (i = 0; i < 6; i++) { var a = i / 6 * TAU + A.rnd(f) * .3, c2 = rb[i % 3]; A.line(g, al(c2, .7), 2.4, [Math.cos(a) * 10, -4 + Math.sin(a) * 10, Math.cos(a) * 58, -4 + Math.sin(a) * 58]) }
    lamp(g, 0, -4, 11, '#ffe890')
    for (i = 0; i < 3; i++) { var sa = A.T * (1.2 + i * .3) + i * 2.1; A.poly(g, [Math.cos(sa) * 46 - 3, Math.sin(sa) * 24 - 4, Math.cos(sa) * 46 + 3, Math.sin(sa) * 24 - 4, Math.cos(sa) * 46, Math.sin(sa) * 24 + 5], '#d8e8f0', { lw: 2 }) }
  })

  /* ---- Ultra Greed, Ultra Greedier: vault piggy banks ----------------- */
  function bank (c, ac, o) {
    return function (g) {
      var ch = A.ch, br = Math.sin(A.T * 2.4), i
      A.glow(g, 0, 0, 62, ac, .28 + ch * .25)
      for (i = 0; i < 3; i++) { var a = A.T * 1.3 + i * 2.1; A.ball(g, Math.cos(a) * 46, Math.sin(a) * 14 - 6, 6, 3.6, '#fff070', { lw: 2 }) }
      A.ball(g, -22, 44, 10, 6, sh(c, -.3), { lw: 2.4 }); A.ball(g, 22, 44, 10, 6, sh(c, -.3), { lw: 2.4 })
      if (o.spikes) A.spikes(g, 0, 6 + br, 43, 11, 9, ac, -1.57 - .9)
      A.poly(g, [-34, -22, -20, -42, -10, -24], sh(c, -.1)); A.poly(g, [34, -22, 20, -42, 10, -24], sh(c, -.1))
      A.ball(g, 0, 6 + br, 44, 38, c)
      A.line(g, '#120c04', 7, [-14, -29 + br, 14, -29 + br]); A.ball(g, 6, -32 + br, 8, 4, '#fff070', { lw: 2 })
      A.ball(g, 0, 18, 17, 12, sh(c, .12)); A.flat(g, -6, 18, 2.6, 4, '#2a1a08'); A.flat(g, 6, 18, 2.6, 4, '#2a1a08')
      lamp(g, -17, -6 + br, 6.4, ac); lamp(g, 17, -6 + br, 6.4, ac)
      A.crack(g, 22, -12, 24, 1.6); A.stitches(g, -38, 8, -24, 24, 4, '#2a1a08', 3)
      A.mouth(g, 0, 32, 12, 1.5 + ch * 6, { n: 6, tl: .5, col: '#2a1a08', tongue: false, teeth: '#fff0a0' })
      gloss(g, -24, -14 + br, 12, 5)
    }
  }
  reg('ultra-greed', bank('#d8ac36', '#ff3a2a', {}))
  reg('ultra-greedier', bank('#d8808a', '#7a2aff', { spikes: true }))

  /* ---- The Heretic: burning wicker effigy ----------------------------- */
  reg('the-heretic', function (g) {
    var ch = A.ch, br = Math.sin(A.T * 2.2) * 2, w = '#8a6a3a', i
    g.save(); g.translate(0, br)
    A.glow(g, 0, -20, 54, '#ff7a2a', .35 + ch * .3)
    for (var q = -1; q <= 1; q += 2) { A.line(g, '#2a1a0c', 11, [q * 8, 26, q * 12, 52]); A.line(g, w, 6.4, [q * 8, 26, q * 12, 52]); A.line(g, '#2a1a0c', 11, [q * 18, -4, q * 46, -16]); A.line(g, w, 6.4, [q * 18, -4, q * 46, -16]) }
    solid(g, [-18, -6, 18, -6, 22, 30, -22, 30], w)
    g.save(); g.beginPath(); g.moveTo(-18, -6); g.lineTo(18, -6); g.lineTo(22, 30); g.lineTo(-22, 30); g.closePath(); g.clip()
    for (i = -6; i < 7; i++) { A.line(g, al('#2a1a0c', .7), 1.8, [i * 7 - 14, -6, i * 7 + 14, 30]); A.line(g, al('#2a1a0c', .7), 1.8, [i * 7 + 14, -6, i * 7 - 14, 30]) }
    g.restore()
    A.ball(g, 0, -26, 19, 20, w)
    g.save(); g.beginPath(); g.ellipse(0, -26, 18, 19, 0, 0, TAU); g.clip()
    for (i = -4; i < 5; i++) { A.line(g, al('#2a1a0c', .7), 1.8, [i * 7 - 14, -46, i * 7 + 14, -6]); A.line(g, al('#2a1a0c', .7), 1.8, [i * 7 + 14, -46, i * 7 - 14, -6]) }
    g.restore()
    lamp(g, -7, -27, 4.8, '#ff9a2a'); lamp(g, 7, -27, 4.8, '#ff9a2a')
    A.line(g, '#d8c890', 2.4, [-20, 4, 20, 8]); A.line(g, '#d8c890', 2.4, [-18, -8, 18, -8])
    for (i = -2; i <= 2; i++) { var fl = Math.sin(A.T * 11 + i * 1.9) * 3; A.poly(g, [i * 7 - 6, -40, i * 7 + 6, -40, i * 7 + fl, -58 - (3 - Math.abs(i)) * 3 - ch * 6], i % 2 ? '#ffd040' : '#ff7a28', { lw: 2 }) }
    for (q = -1; q <= 1; q += 2) A.poly(g, [q * 40 - 4, -14, q * 40 + 4, -14, q * 40 + Math.sin(A.T * 9 + q) * 2, -30 - ch * 4], '#ff8a28', { lw: 2 })
    g.restore()
  })

  /* ---- Horny Boys: twin pincer crabs ---------------------------------- */
  reg('horny-boys', function (g, t) {
    var c = +t.variant === 1 ? '#6a7a9a' : '#9a5a44', ch = A.ch, q, i
    for (q = -1; q <= 1; q += 2) for (i = 0; i < 3; i++) A.leg(g, q * 22, 18 + i * 8, q * (38 + i * 3), 26 + i * 8 + Math.sin(A.T * 5 + i + q) * 2, q * (44 + i * 2), 40 + i * 6, 5, sh(c, -.3))
    for (q = -1; q <= 1; q += 2) {
      A.leg(g, q * 22, 6, q * 42, -6, q * 40, -28, 9, c)
      A.horn(g, q * 40, -28, q < 0 ? -1.2 - ch * .3 : -1.94 + ch * .3, 26, 12, '#d8a888', q < 0 ? .3 : -.3); A.horn(g, q * 40, -28, q < 0 ? -2.2 + ch * .3 : -.94 - ch * .3, 22, 10, '#c89878', q < 0 ? -.3 : .3)
    }
    A.ball(g, 0, 14, 36, 28, c)
    A.line(g, sh(c, -.55), 3, [0, -12, 0, 40]); for (i = -2; i <= 2; i++) A.poly(g, [i * 10 - 4, -10 + Math.abs(i) * 2, i * 10 + 4, -10 + Math.abs(i) * 2, i * 10, -20 + Math.abs(i) * 2], sh(c, -.25), { lw: 2 })
    for (q = -1; q <= 1; q += 2) { A.line(g, sh(c, -.6), 6, [q * 10, -4, q * 14, -22]); A.line(g, c, 3.4, [q * 10, -4, q * 14, -22]); lamp(g, q * 14, -26, 5.4, '#ffe060') }
    A.poly(g, [-6, 28, 6, 28, 0, 38], '#2a1410')
    gloss(g, -18, 4, 10, 4)
  })
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
