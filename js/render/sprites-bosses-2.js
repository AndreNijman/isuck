;(function (IS) {
  'use strict'
  /* Bespoke boss painters, part 2 (Depths, Womb, Sheol, Dark Room and beyond). */
  var A = IS.art, sh = A.sh, mix = A.mix, al = A.al, TAU = Math.PI * 2
  var reg = A.register

  /* ---- Turds --------------------------------------------------------- */
  function poop (g, x, y, k, c, o) {
    var ch = A.ch, br = Math.sin(A.T * 3 + x)
    g.save(); g.translate(x, y); g.scale(k, k)
    A.ball(g, 0, 26, 40, 16, sh(c, -.1)); A.ball(g, 0, 8, 31, 15, c); A.ball(g, 0, -10 + br, 21, 12, sh(c, .06))
    A.poly(g, [-10, -18 + br, 4, -34 + br + ch * -3, 12, -17 + br], sh(c, .1)); A.line(g, al(sh(c, .35), .6), 2, [-6, -20 + br, 1, -30 + br])
    A.eye(g, -9, 6, 6.4, { sc: '#efe4cc', col: '#3a2418', lid: .2, lc: c, pu: 1.3 }); A.eye(g, 9, 6, 6.4, { sc: '#efe4cc', col: '#3a2418', lid: .2, lc: c, pu: 1.3 })
    A.mouth(g, 0, 19, 12, 3 + ch * 9, { n: 4, tl: .5 })
    if (o && o.worm) A.tent(g, 2, -30 + br, -1.57, 34, 8, '#d4a496', { amp: 6, hi: true })
    if (o && o.hat) { A.rect(g, -12, -38 + br, 24, 8, '#3a3a52'); A.rect(g, -8, -52 + br, 16, 16, '#4a4a68') }
    if (o && o.sick) A.flat(g, 22, 12, 5, 4, al('#8aa83a', .7))
    g.restore()
  }
  reg('turdlet', function (g) { poop(g, 0, 4, .85, '#7a5230', { hat: true }); A.flies(g, 3, 48, 4, 2.5, 0) })
  reg('the-turdlings', function (g) { poop(g, -26, 12, .62, '#7a5230'); poop(g, 26, 12, .62, '#6a4628'); poop(g, 0, -10, .75, '#86603a'); A.flies(g, 5, 52, 4, 2, 0) })

  /* ---- Teratoma ------------------------------------------------------ */
  reg('teratoma', function (g) {
    var c = '#d89aa0', ch = A.ch
    A.blob(g, 0, 2, 44, 40, c, { n: 12, wob: .1, seed: 14 })
    A.veins(g, 0, 0, 40, '#8a3a4a', 7, 5)
    for (var i = 0; i < 9; i++) A.line(g, '#2a1a16', 1.4, [-12 + i * 3, -38 + (i % 3), -16 + i * 3.6, -52 + (i % 4) * 2])
    A.eye(g, -18, -12, 10, { col: '#5a8a4a', lid: .15, lc: c }); A.eye(g, 10, -18, 6, { col: '#4a4a8a', lc: c, lid: .3 }); A.eye(g, 22, 0, 8, { col: '#8a4a3a', lc: c, lid: .2, red: true })
    A.mouth(g, -4, 14, 25, 8 + ch * 13, { n: 7, tl: .6, tc: '#e8dcc0' })
    A.ball(g, -34, 20, 8, 5, '#e8e0cc', { rot: .5 }); A.ball(g, 28, 24, 6, 4, '#e8e0cc')
    A.hand(g, 36, -28, 8, '#d8a898', .6, { curl: .5 })
  })

  /* ---- The Bloat ----------------------------------------------------- */
  reg('the-bloat', function (g) {
    var c = '#b4c4d2', ch = A.ch, br = Math.sin(A.T * 2.6), k = 1 + br * .03 + ch * .08
    A.ball(g, 0, 2, 42 * k, 40 / k, c)
    A.veins(g, 0, 2, 40, '#6a7a9a', 8, 9)
    A.flat(g, -20, -22, 12, 6, al('#ffffff', .4), -.5)
    A.eye(g, -17, -6, 9, { sc: '#dfe6ec', col: '#1a1a2a', lid: .35, lc: c, pu: 2 }); A.eye(g, 17, -6, 9, { sc: '#dfe6ec', col: '#1a1a2a', lid: .35, lc: c, pu: 2 })
    A.tears(g, -17, 4, 24, '#9ad0ea'); A.tears(g, 17, 4, 24, '#9ad0ea')
    A.mouth(g, 0, 18, 14, 5 + ch * 12, { n: 0, col: '#4a2a3a', tn: '#d4707e' })
    A.flat(g, 0, 4, 3, 4, '#8a9ab0')
  })

  /* ---- The Husk ------------------------------------------------------ */
  reg('the-husk', function (g) {
    var c = '#a89478', ch = A.ch, br = Math.sin(A.T * 2)
    g.save(); g.translate(0, br)
    A.poly(g, [-22, 34, -14, 18, 14, 18, 22, 34, 10, 44, -10, 44], '#6a5a46')
    A.line(g, '#cfc6b0', 3, [-18, 26, 18, 34]); A.line(g, '#cfc6b0', 3, [-18, 34, 18, 26])
    A.ball(g, 0, -10, 28, 34, c)
    A.line(g, al('#3a2a1e', .6), 1.6, [-14, -34, -10, -22]); A.line(g, al('#3a2a1e', .6), 1.6, [12, -34, 16, -20])
    A.flat(g, -17, -10, 11, 13, '#0e0808', .3); A.flat(g, 17, -10, 11, 13, '#0e0808', -.3)
    A.dot(g, -17, -9, 2.6, '#ffcf60', '#d89a30'); A.dot(g, 17, -9, 2.6, '#ffcf60', '#d89a30')
    A.flat(g, 0, 6, 3, 5, '#2a1a14')
    A.mouth(g, 0, 22 + ch * 4, 15, 9 + ch * 13, { n: 7, tl: .6, col: '#100606', tongue: false, teeth: '#d8ccb0' })
    A.flat(g, -22, 14, 6, 9, al('#3a2a1e', .5)); A.flat(g, 22, 14, 6, 9, al('#3a2a1e', .5))
    A.drip(g, -8, 32, 12, '#201410', 2.2)
    g.restore()
  })

  /* ---- The Gate ------------------------------------------------------ */
  reg('the-gate', function (g) {
    var ch = A.ch, c = '#7a6e66'
    A.rect(g, -44, -40, 24, 84, c, 2); A.rect(g, 20, -40, 24, 84, c, 2)
    g.beginPath(); g.moveTo(-44, -10); g.quadraticCurveTo(-44, -54, 0, -54); g.quadraticCurveTo(44, -54, 44, -10); g.lineTo(20, -10); g.quadraticCurveTo(20, -30, 0, -30); g.quadraticCurveTo(-20, -30, -20, -10); g.closePath()
    g.fillStyle = sh(c, .06); g.fill(); g.lineWidth = A.lw; g.strokeStyle = sh(c, -.65); g.stroke()
    var gr = g.createRadialGradient(0, 0, 2, 0, 0, 34); gr.addColorStop(0, '#3a0a14'); gr.addColorStop(1, '#0a0406')
    g.fillStyle = gr; g.fillRect(-20, -30, 40, 74)
    A.glow(g, 0, -6, 30 + ch * 12, '#d8402a', .3 + ch * .4)
    A.eye(g, 0, -6, 14 + ch * 3, { sc: '#e8d8b8', col: '#d84a2a', hot: '#ffd060', lid: Math.max(0, .5 - ch), lc: '#3a0a14', pu: 1.4 })
    for (var i = -2; i <= 2; i++) A.poly(g, [i * 8 - 3, -30, i * 8 + 3, -30, i * 8, -22], '#e4d6b4')
    for (i = -2; i <= 2; i++) A.poly(g, [i * 8 - 3, 44, i * 8 + 3, 44, i * 8, 36], '#e4d6b4')
    A.line(g, '#6a3a3a', 2, [-44, -20, -30, -4]); A.veins(g, -32, 10, 20, '#9a3a44', 3, 4); A.veins(g, 32, 10, 20, '#9a3a44', 3, 7)
    A.rect(g, -48, 40, 96, 10, sh(c, -.2), 2)
  }, { R: 26 })

  /* ---- The Cage ------------------------------------------------------ */
  reg('the-cage', function (g) {
    var ch = A.ch, br = Math.sin(A.T * 3), c = '#c88a8a'
    A.ball(g, 0, 10, 30 + br, 28 - br, c)
    A.eye(g, -11, 4, 7, { col: '#5a3a3a', lid: .15, lc: c, red: true, pu: 1.5 }); A.eye(g, 11, 4, 7, { col: '#5a3a3a', lid: .15, lc: c, red: true, pu: 1.5 })
    A.mouth(g, 0, 22, 15, 4 + ch * 12, { n: 6, tl: .5 })
    var bar = '#4a4448'
    g.lineCap = 'round'
    for (var i = -4; i <= 4; i++) {
      var x = i * 9, top = -44 + Math.abs(i) * 4
      A.line(g, sh(bar, -.5), 6, [x, top, x * 1.12, 44]); A.line(g, bar, 3.4, [x, top, x * 1.12, 44]); A.line(g, al('#9a949a', .6), 1, [x - 1, top + 2, x * 1.12 - 1, 40])
    }
    A.ball(g, 0, -48, 12, 6, bar); A.ball(g, 0, 46, 44, 7, bar)
    g.strokeStyle = bar; g.lineWidth = 3.4; g.beginPath(); g.ellipse(0, -4, 42, 10, 0, 0, TAU); g.stroke()
    g.beginPath(); g.ellipse(0, 22, 46, 10, 0, 0, Math.PI); g.stroke()
  })

  /* ---- Mega Maw ------------------------------------------------------ */
  reg('mega-maw', function (g) {
    var c = '#9a3a34', ch = A.ch
    A.horn(g, -28, -22, -2.3, 28, 14, '#d8c8a4', -.4); A.horn(g, 28, -22, -.84, 28, 14, '#d8c8a4', .4)
    A.ball(g, 0, 2, 45, 42, c)
    A.eye(g, -20, -22, 6, { col: '#e8c030', lid: .35, lc: c, sq: .8 }); A.eye(g, 20, -22, 6, { col: '#e8c030', lid: .35, lc: c, sq: .8 })
    A.brow(g, -30, -33, -10, -26, '#2a0c0c', 4); A.brow(g, 30, -33, 10, -26, '#2a0c0c', 4)
    A.flat(g, -4, -10, 2.4, 3.4, '#2a0c0c'); A.flat(g, 4, -10, 2.4, 3.4, '#2a0c0c')
    A.mouth(g, 0, 14, 34, 18 + ch * 8, { n: 9, tl: .45, col: '#e86a20', tongue: false })
    g.save(); g.beginPath(); g.ellipse(0, 14, 33, 17 + ch * 8, 0, 0, TAU); g.clip()
    for (var i = 0; i < 6; i++) { var f = Math.sin(A.T * 9 + i * 1.7) * .5 + .5; A.flat(g, -22 + i * 9, 24, 6, 10 + f * (8 + ch * 14), i % 2 ? '#ffd040' : '#ff8a28') }
    g.restore()
    A.spikes(g, 0, 4, 44, 0, 0, '#000', 0)
  })

  /* ---- The Wretched -------------------------------------------------- */
  reg('the-wretched', function (g) {
    var c = '#cbb2a4', ch = A.ch, sw = Math.sin(A.T * 2.2) * 3
    A.poly(g, [-26, -10, 26, -10, 34, 46, 0, 40, -34, 46], '#4a3a46')
    A.line(g, sh('#4a3a46', -.4), 2, [-12, 6, -16, 40]); A.line(g, sh('#4a3a46', -.4), 2, [10, 6, 14, 42])
    A.leg(g, -24, -4, -42, 18 + sw, -40, 40, 5, c); A.leg(g, 24, -4, 42, 18 - sw, 40, 40, 5, c)
    for (var q = -1; q <= 1; q += 2) for (var i = -1; i <= 1; i++) A.line(g, '#2a1e22', 2, [q * 40 + i * 3, 40, q * 40 + i * 4, 48])
    A.ball(g, sw * .4, -26, 24, 28, c, { rot: 0 })
    A.line(g, '#2a1e22', 1.4, [-12, -48, -8, -40]); A.line(g, '#2a1e22', 1.4, [4, -50, 10, -42])
    A.flat(g, -9 + sw * .4, -28, 6.5, 8.5, '#0e0808'); A.flat(g, 9 + sw * .4, -28, 6.5, 8.5, '#0e0808')
    A.dot(g, -9 + sw * .4, -27, 2.2, '#e8d890', '#c8a850'); A.dot(g, 9 + sw * .4, -27, 2.2, '#e8d890', '#c8a850')
    A.mouth(g, sw * .4, -10, 7 + ch * 3, 12 + ch * 6, { n: 4, tl: .4, col: '#100808', tongue: false })
    A.tears(g, -9 + sw * .4, -20, 22, '#7a1a22'); A.tears(g, 9 + sw * .4, -20, 22, '#7a1a22')
  })

  /* ---- Peep ---------------------------------------------------------- */
  reg('peep', function (g) {
    var c = '#d4c488', ch = A.ch, br = Math.sin(A.T * 2.2), hang = A.hp < .5
    A.blob(g, 0, 4, 44 + br, 40 - br, c, { n: 12, wob: .06, seed: 22 })
    A.veins(g, 0, 4, 40, '#9a7a3a', 8, 12); A.warts(g, 0, 8, 36, 5, '#e2d4a0', 7)
    var ex = hang ? 22 : 17, ey = hang ? -10 + Math.sin(A.T * 3) * 4 : -14
    if (hang) { A.line(g, '#9a3a44', 3, [-14, -18, -22, ey]); A.line(g, '#9a3a44', 3, [14, -18, 22, ey]) }
    A.eye(g, -ex, ey, 13, { sc: '#efe4cc', col: '#a89030', lid: hang ? 0 : .35, lc: sh(c, -.1), red: true, pu: 1.4 })
    A.eye(g, ex, ey, 13, { sc: '#efe4cc', col: '#a89030', lid: hang ? 0 : .35, lc: sh(c, -.1), red: true, pu: 1.4 })
    A.flat(g, -3, 4, 2, 3, '#6a4a2a'); A.flat(g, 3, 4, 2, 3, '#6a4a2a')
    A.mouth(g, 0, 22, 17, 5 + ch * 14, { n: 6, tl: .5, col: '#3a1a1a' })
    A.drip(g, -22, 30, 14, '#a89a50', 2.4)
  })

  /* ---- The Pile ------------------------------------------------------ */
  reg('the-pile', function (g) {
    var ch = A.ch
    var lumps = [[-26, 22, 20, 16, '#b86a74'], [24, 24, 22, 16, '#a85a66'], [0, 28, 26, 14, '#c0787e'], [-14, 4, 22, 18, '#c8848c'], [18, 6, 20, 17, '#b46a74'], [0, -14, 22, 18, '#d09098']]
    lumps.forEach(function (l, i) { A.ball(g, l[0], l[1] + Math.sin(A.T * 2 + i) * 1.2, l[2], l[3], l[4]) })
    A.line(g, '#e8dcc0', 4, [-34, 8, -44, -12]); A.line(g, '#e8dcc0', 4, [34, 2, 44, -18]); A.ball(g, -44, -14, 4, 4, '#e8dcc0'); A.ball(g, 44, -20, 4, 4, '#e8dcc0')
    A.eye(g, -6, -18, 8, { col: '#6a3a3a', lid: .25, lc: '#d09098', red: true }); A.eye(g, 10, -10, 5.5, { col: '#3a4a6a', lid: .2, lc: '#c8848c' }); A.eye(g, -22, 8, 5, { col: '#6a4a2a', lid: .3, lc: '#c8848c' })
    A.mouth(g, 8, 18, 14, 4 + ch * 11, { n: 5, tl: .5 })
    A.veins(g, 0, 4, 40, '#7a2a3a', 6, 3)
    A.drip(g, -30, 34, 10, '#8a2a34', 2.2)
  })

  /* ---- Gish ---------------------------------------------------------- */
  reg('gish', function (g) {
    var c = '#23202a', ch = A.ch, br = Math.sin(A.T * 3)
    A.blob(g, 0, 8, 46, 34 + br * 2, c, { n: 14, wob: .09, seed: 31, sp: 2.8 })
    A.ball(g, -26, 34, 12, 8, c, { ol: '#0a0810' }); A.ball(g, 26, 34, 14, 8, c, { ol: '#0a0810' })
    A.flat(g, -18, -6, 16, 5, al('#7a7a9a', .35), -.4)
    A.eye(g, -15, -6, 10, { sc: '#f4f0e6', col: '#1a1620', lid: .1, lc: c, ol: '#000' }); A.eye(g, 15, -6, 10, { sc: '#f4f0e6', col: '#1a1620', lid: .1, lc: c, ol: '#000' })
    A.mouth(g, 0, 14, 25, 8 + ch * 12, { n: 8, tl: .5, col: '#08060c', tongue: false, teeth: '#f4f0e6' })
    A.drip(g, -30, 24, 14, c, 3); A.drip(g, 30, 22, 12, c, 3); A.drip(g, 4, 38, 10, c, 2.4)
  }, { R: 26 })

  /* ---- Loki ---------------------------------------------------------- */
  function loki (g, x, y, k, c) {
    var ch = A.ch, br = Math.sin(A.T * 2.4 + x)
    g.save(); g.translate(x, y); g.scale(k, k)
    A.horn(g, -18, -24, -2.5, 36, 12, '#2a2030', -.55); A.horn(g, 18, -24, -.64, 36, 12, '#2a2030', .55)
    A.ball(g, 0, br * .6, 30, 32, c)
    A.poly(g, [-14, 22, 14, 22, 0, 52 + br], sh(c, -.25))
    A.eye(g, -12, -6 + br * .6, 7, { sc: '#e8e0cc', col: '#e8c040', lid: .35, lc: c, sq: .7 }); A.eye(g, 12, -6 + br * .6, 7, { sc: '#e8e0cc', col: '#e8c040', lid: .35, lc: c, sq: .7 })
    A.brow(g, -22, -18, -4, -10, '#1a1018', 3.6); A.brow(g, 22, -18, 4, -10, '#1a1018', 3.6)
    A.mouth(g, 0, 14 + br * .6, 17, 5 + ch * 9, { n: 8, tl: .6, col: '#1a0a10', tongue: false })
    A.line(g, '#1a1018', 2, [-14, 11, -22, 13]); A.line(g, '#1a1018', 2, [14, 11, 22, 13])
    g.restore()
  }
  reg('loki', function (g) { loki(g, 0, -6, 1.15, '#8a5a78') })
  reg('lokii', function (g) { loki(g, -28, 4, .8, '#6a5a98'); loki(g, 28, 4, .8, '#986a68'); loki(g, 0, -10, 1, '#8a5a78') })

  /* ---- The Stain ----------------------------------------------------- */
  reg('the-stain', function (g) {
    var c = '#8a7a4a', ch = A.ch
    for (var i = -2; i <= 2; i++) A.tent(g, i * 16, 14, Math.PI / 2 + i * .22, 40, 12, sh(c, -.12), { amp: 7, ph: i * 1.4, taper: .85, rage: 1 })
    A.blob(g, 0, -4, 42, 36, c, { n: 12, wob: .08, seed: 18 })
    A.warts(g, 0, -4, 36, 7, '#a8985c', 3)
    A.eye(g, -17, -18, 7.5, { col: '#c8d048', lid: .2, lc: c }); A.eye(g, 4, -22, 5.5, { col: '#c8d048', lid: .2, lc: c }); A.eye(g, 20, -12, 6.5, { col: '#c8d048', lid: .25, lc: c })
    A.mouth(g, 0, 8, 28, 10 + ch * 14, { n: 8, tl: .55, col: '#2a2008' })
    A.drip(g, -20, 20, 14, '#6a5a2a', 3)
  })

  /* ---- Mom (foot, hand, door-eye) ----------------------------------- */
  function leg (g, y0, ch) {
    var c = '#e4bba8'
    g.beginPath(); g.moveTo(-17, -66); g.lineTo(17, -66); g.lineTo(21, y0); g.lineTo(-21, y0); g.closePath()
    var gr = g.createLinearGradient(-20, 0, 20, 0); gr.addColorStop(0, sh(c, -.3)); gr.addColorStop(.4, sh(c, .1)); gr.addColorStop(1, sh(c, -.35))
    g.fillStyle = gr; g.fill(); g.lineWidth = A.lw; g.strokeStyle = sh(c, -.7); g.stroke()
    A.veins(g, 0, -20, 40, '#6a7ab8', 5, 41)
    A.line(g, al('#5a6aa8', .7), 1.6, [-8, -60, -4, -40, -9, -22, -5, 0]); A.line(g, al('#5a6aa8', .6), 1.4, [9, -56, 5, -36, 10, -14])
  }
  function foot (g, ch) {
    var c = '#e8c2ae', lift = ch * 10
    g.save(); g.translate(0, -lift); g.scale(1 + ch * .06, 1 + ch * .06)
    leg(g, 6, ch)
    A.ball(g, 0, 22, 34, 24, c)
    var toes = [[-27, 40, 7.5], [-14, 45, 7], [0, 47, 7], [14, 45, 7], [26, 41, 6]]
    toes.forEach(function (tp, i) { A.ball(g, tp[0], tp[1], tp[2], tp[2] * .9, c, { lw: 1.6 }); A.flat(g, tp[0], tp[1] + 1.5, tp[2] * .55, tp[2] * .4, '#b8283a') })
    A.flat(g, -8, 14, 12, 7, al('#fff', .25), -.4)
    g.restore()
  }
  reg('mom', function (g) { g.save(); g.translate(0, 10); foot(g, A.ch); g.restore() }, { R: 20 })
  reg('mom-foot', function (g) { g.save(); g.translate(0, 10); foot(g, A.ch); g.restore() }, { noWounds: true })
  reg('mom-hand', function (g) {
    var ch = A.ch, c = '#e8c2ae'
    g.save(); g.translate(0, 8); g.rotate(Math.sin(A.T * 3) * .05)
    A.rect(g, -14, 12, 28, 40, c, 3); A.veins(g, 0, 36, 24, '#6a7ab8', 3, 9)
    A.ball(g, 0, 6, 30, 26, c)
    var ang = [-.55, -.22, .08, .38, .7]
    for (var i = 0; i < 5; i++) { var a = -1.57 + ang[i] * (1 + ch * .3), len = 36 - Math.abs(i - 2) * 4 + (i === 4 ? -6 : 0); A.tent(g, Math.cos(a) * 16, Math.sin(a) * 12, a, len, 10, c, { amp: 2, taper: .3 }); A.flat(g, Math.cos(a) * (16 + len), Math.sin(a) * (12 + len), 3.6, 4.4, '#b8283a') }
    g.restore()
  }, { noWounds: true })
  reg('mom-eye', function (g) {
    var ch = A.ch
    A.rect(g, -36, -44, 72, 88, '#6a4a3a', 3)
    A.rect(g, -28, -36, 56, 76, '#1a0e10', 2)
    A.glow(g, 0, 0, 34, '#d8402a', .25 + ch * .3)
    A.eye(g, 0, 0, 22, { sc: '#f1e8d6', col: '#3a7ab8', lid: Math.max(0, .3 - ch), lc: '#e8c2ae', red: true, pu: 1.3 })
    A.line(g, '#2a1a16', 2, [-24, -26, -12, -30]); A.line(g, '#2a1a16', 2, [24, -26, 12, -30])
  }, { noWounds: true })

  /* ---- Mom's Heart, It Lives ---------------------------------------- */
  function bigHeart (c, o) {
    return function (g) {
      var ch = A.ch, ph = (A.T * (1.6 + ch * 2) + (o.ph || 0)) % 1
      var beat = Math.exp(-ph * 9) * .09 + Math.exp(-Math.max(0, ph - .22) * 9) * .06 * (ph > .22 ? 1 : 0)
      var k = 1 + beat + ch * .04
      g.save(); g.scale(k, k)
      A.tent(g, -14, -34, -1.9, 28, 11, '#a8343c', { amp: 1.5, taper: .3, hi: true }); A.tent(g, 6, -36, -1.4, 30, 13, '#b83c44', { amp: 1.5, taper: .3, hi: true }); A.tent(g, 20, -30, -.9, 24, 9, '#8a2a36', { amp: 1.5, taper: .3 })
      A.heart(g, 0, 6, 46, 78, c)
      A.veins(g, 0, 6, 54, sh(c, -.45), 9, o.seed || 1)
      A.flat(g, -18, -10, 10, 14, al('#fff', .22), -.5)
      A.line(g, al(sh(c, -.55), .7), 3, [-10, -4, 0, 14, 12, 30])
      A.warts(g, 0, 10, 40, 4, sh(c, .08), 6)
      if (o.face) {
        A.eye(g, -14, 4, 9, { sc: '#e8dcc8', col: '#d8a02a', lid: .4 - ch * .4, lc: c, red: true }); A.eye(g, 14, 4, 9, { sc: '#e8dcc8', col: '#d8a02a', lid: .4 - ch * .4, lc: c, red: true })
        A.mouth(g, 0, 28, 16, 3 + ch * 10, { n: 6, tl: .6 })
      }
      g.restore()
    }
  }
  reg('moms-heart', bigHeart('#c23a46', { seed: 5 }))
  reg('it-lives', bigHeart('#8a2a3e', { seed: 9, face: true, ph: .5 }))

  /* ---- The Fallen, Krampus ------------------------------------------ */
  reg('the-fallen', function (g) {
    var c = '#3a2630', ch = A.ch
    A.wing(g, -8, -8, 48, -2.7, '#241a22', { dir: 1, flap: Math.sin(A.T * 3) * .1 })
    A.wing(g, 8, -8, 48, -.44, '#241a22', { dir: 1, flap: -Math.sin(A.T * 3) * .1 })
    A.poly(g, [-18, 0, 18, 0, 22, 40, -22, 40], '#2a1a24')
    A.ball(g, 0, 0, 22, 24, c)
    A.horn(g, -14, -18, -2.2, 22, 10, '#c8b8a0', -.4); A.horn(g, 14, -18, -.94, 22, 10, '#c8b8a0', .4)
    A.glow(g, -9, -2, 14, '#ff4020', .4 + ch * .3); A.glow(g, 9, -2, 14, '#ff4020', .4 + ch * .3)
    A.poly(g, [-16, -6, -4, -2, -16, 4], '#ff5a30', { ol: false }); A.poly(g, [16, -6, 4, -2, 16, 4], '#ff5a30', { ol: false })
    A.mouth(g, 0, 12, 10, 2 + ch * 8, { n: 6, tl: .6, col: '#0e0608', tongue: false })
    A.halo(g, 0, -34 + Math.sin(A.T * 2) * 2, 18, 5, '#8a7a3a')
  })
  reg('krampus', function (g) {
    var c = '#6a4a34', ch = A.ch, br = Math.sin(A.T * 2.5)
    A.horn(g, -22, -22, -2.6, 42, 14, '#d8ccb0', -.7); A.horn(g, 22, -22, -.54, 42, 14, '#d8ccb0', .7)
    A.ball(g, 0, 2, 36, 38, c)
    for (var i = 0; i < 14; i++) { var a = i / 14 * TAU; A.line(g, sh(c, -.3), 2.4, [Math.cos(a) * 34, Math.sin(a) * 36 + 2, Math.cos(a) * 41, Math.sin(a) * 43 + 2]) }
    A.ball(g, 0, 14, 22, 20, '#7a5a40')
    A.eye(g, -14, -8, 6.5, { sc: '#e6d6a0', col: '#c82a2a', lid: .3, lc: c, sq: .7 }); A.eye(g, 14, -8, 6.5, { sc: '#e6d6a0', col: '#c82a2a', lid: .3, lc: c, sq: .7 })
    A.brow(g, -24, -19, -6, -13, '#2a1a10', 4); A.brow(g, 24, -19, 6, -13, '#2a1a10', 4)
    A.flat(g, -4, 6, 2.2, 3, '#2a1a10'); A.flat(g, 4, 6, 2.2, 3, '#2a1a10')
    A.mouth(g, 0, 18, 15, 5 + ch * 8, { n: 6, tl: .6, col: '#2a0a0a', tongue: false })
    A.tent(g, 0, 20, Math.PI / 2, 26 + ch * 12, 8, '#d04a5a', { amp: 4, taper: .4 })
    A.line(g, '#8a8a92', 3, [-30, 34, -12, 44, 12, 40, 30, 36])
  })

  /* ---- Sisters Vis --------------------------------------------------- */
  reg('sisters-vis', function (g, t) {
    var c = '#e4c4b8', ch = A.ch, br = Math.sin(A.T * 2.4)
    g.save(); g.translate(0, br * 2)
    A.tent(g, 0, 22, Math.PI / 2, 38, 18, '#8a2a3a', { amp: 4, taper: .7 })
    A.poly(g, [-34, -26, -40, 14, -30, 38, -22, 6], '#2a1a22'); A.poly(g, [34, -26, 40, 14, 30, 38, 22, 6], '#2a1a22')
    A.ball(g, 0, -4, 30, 34, c)
    A.poly(g, [-28, -20, 0, -40, 28, -20, 10, -26, 0, -34, -10, -26], '#2a1a22')
    A.flat(g, -11, -4, 8, 6, '#1a0e12'); A.flat(g, 11, -4, 8, 6, '#1a0e12')
    A.dot(g, -11, -4, 2.2, ch > .1 ? '#ff6a5a' : '#e8b0b0', '#c83a4a'); A.dot(g, 11, -4, 2.2, ch > .1 ? '#ff6a5a' : '#e8b0b0', '#c83a4a')
    A.tears(g, -11, 2, 24, '#8a1a2a'); A.tears(g, 11, 2, 24, '#8a1a2a')
    A.mouth(g, 0, 18, 8, 2 + ch * 9, { n: 0, tongue: false, col: '#3a0a12' })
    A.stitches(g, -20, 8, -8, 14, 3, '#5a2a34', 3)
    g.restore()
  })

  /* ---- Tuff Twins ---------------------------------------------------- */
  reg('tuff-twins', function (g, t) {
    var c = +t.variant === 1 ? '#8a98a4' : '#a89488', ch = A.ch
    A.ball(g, -30, 24, 14, 12, c); A.ball(g, 30, 24, 14, 12, c)
    A.ball(g, 0, 0, 40, 38, c)
    A.crack(g, -26, -22, 18, 1.2, ''); A.crack(g, 24, 10, 16, 2.2, '')
    A.eye(g, -15, -6, 7, { sc: '#e8e0cc', col: '#2a2a3a', lid: .4, lc: c, pu: .9 }); A.eye(g, 15, -6, 7, { sc: '#e8e0cc', col: '#2a2a3a', lid: .4, lc: c, pu: .9 })
    A.poly(g, [-30, -18, -4, -10, -4, -16, -28, -26], sh(c, -.45)); A.poly(g, [30, -18, 4, -10, 4, -16, 28, -26], sh(c, -.45))
    A.flat(g, -5, 6, 3, 4, sh(c, -.5)); A.flat(g, 5, 6, 3, 4, sh(c, -.5))
    A.mouth(g, 0, 20, 18, 4 + ch * 11, { n: 8, tl: .8, col: '#1a0c0c' })
    A.line(g, sh(c, -.6), 2.4, [-34, 18, -26, 28]); A.line(g, sh(c, -.6), 2.4, [34, 18, 26, 28])
  })

  /* ---- The Shell ----------------------------------------------------- */
  reg('the-shell', function (g) {
    var ch = A.ch, br = Math.sin(A.T * 2.4)
    A.ball(g, -30, 14, 20, 17, '#d8a8a0'); A.ball(g, -34, 26, 12, 10, '#c89890')
    A.tent(g, -38, 2, -2.3, 22, 4, '#d8a8a0', { amp: 2 }); A.tent(g, -28, -2, -1.5, 22, 4, '#d8a8a0', { amp: 2, ph: 1 })
    A.eye(g, -44, -14 + br, 5, { col: '#4a2a2a', lc: '#d8a8a0', lid: .1 }); A.eye(g, -30, -20 + br, 5, { col: '#4a2a2a', lc: '#d8a8a0', lid: .1 })
    A.mouth(g, -34, 22, 8, 2 + ch * 7, { n: 4, tl: .5 })
    A.ball(g, 12, 0, 38, 36, '#c8a878')
    for (var i = 1; i <= 4; i++) { g.strokeStyle = al('#5a3e22', .75); g.lineWidth = 2.4; g.beginPath(); g.ellipse(12 - i * 3, 0 + i, 38 - i * 8.5, 36 - i * 8, 0, 0, TAU); g.stroke() }
    A.flat(g, 12, 0, 4, 4, '#5a3e22')
    A.flat(g, 0, -22, 14, 5, al('#fff', .3), -.5)
    A.spikes(g, 12, 0, 36, 7, 7, '#e2d4b0', .2 + ch * .3)
  })

  /* ---- The Matriarch ------------------------------------------------- */
  reg('the-matriarch', function (g) {
    var c = '#d4a8a0', ch = A.ch, br = Math.sin(A.T * 2)
    for (var i = -3; i <= 3; i++) A.tent(g, i * 12, 22, Math.PI / 2 + i * .15, 30, 8, '#a8444e', { amp: 5, ph: i * 1.1, taper: .8 })
    A.blob(g, 0, 0, 46, 42, c, { n: 12, wob: .05, seed: 27 })
    for (i = 0; i < 12; i++) A.line(g, '#4a2a2a', 1.8, [-24 + i * 4.5, -38, -28 + i * 5, -50 + (i % 3) * 2])
    var es = [[-24, -18, 6], [-6, -26, 5], [14, -22, 7], [26, -10, 5], [-30, -2, 4]]
    es.forEach(function (e) { A.eye(g, e[0], e[1], e[2], { col: '#6a3a4a', lid: .2, lc: c, red: true }) })
    A.mouth(g, 0, 16, 32, 13 + ch * 14, { n: 10, tl: .6, tongue: true })
    A.veins(g, 0, 0, 44, '#8a2a3a', 6, 44)
  })

  /* ---- Chimera ------------------------------------------------------- */
  reg('chimera', function (g) {
    var ch = A.ch
    A.ball(g, 0, 22, 34, 22, '#9a7a72')
    A.tent(g, -22, 6, -2.2, 34, 14, '#8aa84e', { amp: 5, ph: 1 })
    A.ball(g, -30, -26, 14, 13, '#8aa84e'); A.eye(g, -34, -29, 4.5, { col: '#c8a02a', lc: '#8aa84e' }); A.eye(g, -24, -29, 4.5, { col: '#c8a02a', lc: '#8aa84e' }); A.mouth(g, -29, -19, 7, 2 + ch * 5, { n: 3 })
    A.tent(g, 22, 6, -.9, 34, 14, '#c8a49a', { amp: 5, ph: 2 })
    A.ball(g, 32, -24, 14, 14, '#c8a49a'); A.eye(g, 28, -27, 4.5, { col: '#4a3a6a', lc: '#c8a49a', lid: .2 }); A.eye(g, 37, -27, 4.5, { col: '#4a3a6a', lc: '#c8a49a', lid: .2 }); A.mouth(g, 32, -16, 7, 2 + ch * 5, { n: 3 })
    A.skull(g, 0, -20, 17, '#d8ceb2', { eyec: '#e85a3a' })
    A.flies(g, 3, 48, 4, 2.2, -4)
    A.warts(g, 0, 22, 28, 4, '#b89a90', 6)
  })

  /* ---- Rotgut -------------------------------------------------------- */
  reg('rotgut', function (g) {
    var c = '#9a8a5a', ch = A.ch
    for (var i = 0; i < 4; i++) { var y = 36 - i * 20, w = 38 - i * 3, br = Math.sin(A.T * 2.6 + i) * 2; A.ball(g, 0, y, w, 12 + br, sh(c, i * .02)); A.line(g, al(sh(c, -.5), .5), 1.6, [-w + 6, y, w - 6, y]) }
    A.ball(g, -22, -30, 18, 15, '#a89868')
    A.ball(g, 6, -34, 22, 18, '#b8a672')
    A.eye(g, -2, -40, 6, { col: '#7a3a2a', lc: '#b8a672', lid: .3, red: true }); A.eye(g, 14, -38, 5, { col: '#7a3a2a', lc: '#b8a672', lid: .3, red: true })
    A.mouth(g, 8, -24, 15, 4 + ch * 12, { n: 6, tl: .6, col: '#2a1a0a' })
    A.tent(g, 22, -30, -.3, 22, 6, '#c2a078', { amp: 4 })
    A.veins(g, 0, 10, 40, '#5a4a2a', 5, 6)
    A.drip(g, -28, 34, 10, '#4a5a22', 2.4)
  })

  /* ---- The Adversary ------------------------------------------------- */
  reg('the-adversary', function (g) {
    var ch = A.ch, br = Math.sin(A.T * 2)
    A.wing(g, -8, -4, 50, -2.8, '#cfc2a0', { feather: true, dir: 1, flap: Math.sin(A.T * 3) * .1 })
    A.wing(g, 8, -4, 50, -.34, '#cfc2a0', { feather: true, dir: 1, flap: -Math.sin(A.T * 3) * .1 })
    A.poly(g, [-18, -2, 18, -2, 30, 46, 0, 40, -30, 46], '#1c1824')
    A.line(g, '#3a2a4a', 2, [-8, 8, -12, 40]); A.line(g, '#3a2a4a', 2, [8, 8, 12, 40])
    A.ball(g, 0, -20 + br, 20, 22, '#1a1620')
    A.poly(g, [-18, -34 + br, -10, -24 + br, 10, -24 + br, 18, -34 + br, 8, -42 + br, -8, -42 + br], '#241c2c')
    A.glow(g, -7, -20 + br, 10, '#ff5a2a', .6); A.glow(g, 7, -20 + br, 10, '#ff5a2a', .6)
    A.flat(g, -7, -20 + br, 4, 3, '#ffc050'); A.flat(g, 7, -20 + br, 4, 3, '#ffc050')
    for (var i = -4; i <= 4; i++) A.line(g, '#8a6a2a', 1.8, [i * 4.6, -42 + br - Math.abs(i) * -.5, i * 5.4, -48 + br - (i % 2) * 3])
    A.mouth(g, 0, -8 + br, 7, 1 + ch * 6, { n: 0, col: '#ff6a2a', tongue: false })
    A.halo(g, 0, -52 + br, 16, 4.5, '#6a5a3a')
  })

  /* ---- Brownie ------------------------------------------------------- */
  reg('brownie', function (g) {
    var c = '#7a5238', ch = A.ch
    for (var i = 0; i < 30; i++) { var a = i / 30 * TAU, w = Math.sin(A.T * 3 + i) * 1.6; A.line(g, sh(c, -.25 + (i % 3) * .08), 3, [Math.cos(a) * 36, Math.sin(a) * 34, Math.cos(a) * (46 + w + (i % 4)), Math.sin(a) * (44 + w + (i % 4))]) }
    A.ball(g, 0, 2, 40, 38, c)
    for (i = 0; i < 9; i++) A.line(g, sh(c, .15), 2, [-26 + i * 6.5, -30 + (i % 3) * 6, -23 + i * 6.5, -22 + (i % 3) * 6])
    A.eye(g, -15, -8, 10, { sc: '#efe4cc', col: '#2a1a10', lid: .1, lc: c, pu: 1.5 }); A.eye(g, 15, -8, 10, { sc: '#efe4cc', col: '#2a1a10', lid: .1, lc: c, pu: 1.5 })
    A.flat(g, 0, 6, 4, 3, '#2a1a10')
    A.mouth(g, 0, 18, 20, 7 + ch * 12, { n: 6, tl: .7, col: '#2a0c0c' })
  })

  /* ---- The Forsaken -------------------------------------------------- */
  reg('the-forsaken', function (g) {
    var ch = A.ch, br = Math.sin(A.T * 2.2) * 2
    g.save(); g.translate(0, br)
    for (var i = -3; i <= 3; i++) A.tent(g, i * 10, 14, Math.PI / 2 + i * .08, 32 + (i % 2) * 8, 11, i % 2 ? '#2a2c3a' : '#1e2030', { amp: 5, ph: i, taper: .9 })
    A.poly(g, [-26, -20, 26, -20, 34, 24, -34, 24], '#242636')
    A.ball(g, 0, -22, 24, 24, '#202230')
    A.skull(g, 0, -22, 14, '#e8e4d4', { eyec: '#7affc8' })
    A.glow(g, -5, -24, 12, '#5affc0', .3 + ch * .4); A.glow(g, 5, -24, 12, '#5affc0', .3 + ch * .4)
    A.ball(g, -34, 16, 6, 10, '#e8e4d4', { rot: .4 }); A.ball(g, 34, 16, 6, 10, '#e8e4d4', { rot: -.4 })
    A.line(g, '#8a8a96', 2, [34, 10, 34, 36]); A.ball(g, 34, 42, 8, 8, '#5affc0'); A.glow(g, 34, 42, 20, '#5affc0', .5)
    g.restore()
  })

  /* ---- Big Horn ------------------------------------------------------ */
  reg('big-horn', function (g) {
    var c = '#b89a90', ch = A.ch
    A.hand(g, -42, 28, 14, c, -.3); A.hand(g, 42, 28, 14, c, .3)
    A.ball(g, 0, 8, 40, 36, c)
    A.horn(g, 0, -20, -1.57, 46, 24, '#e8dcc0', .35)
    A.line(g, al('#8a7a5a', .6), 2, [-6, -34, -4, -22]); A.line(g, al('#8a7a5a', .6), 2, [4, -40, 6, -26])
    A.eye(g, -17, 0, 5.5, { col: '#2a1a14', lid: .3, lc: c, sc: '#e8d8c8' }); A.eye(g, 17, 0, 5.5, { col: '#2a1a14', lid: .3, lc: c, sc: '#e8d8c8' })
    A.brow(g, -26, -9, -8, -4, sh(c, -.55), 3.6); A.brow(g, 26, -9, 8, -4, sh(c, -.55), 3.6)
    A.flat(g, -6, 10, 4, 5, '#2a1014'); A.flat(g, 6, 10, 4, 5, '#2a1014')
    A.mouth(g, 0, 24, 18, 5 + ch * 12, { n: 5, tl: .5, col: '#2a0c0c' })
  })

  /* ---- The Visage ---------------------------------------------------- */
  reg('the-visage', function (g) {
    var c = '#cdd6e0', ch = A.ch, br = Math.sin(A.T * 2) * 3
    A.glow(g, 0, br, 56, '#8ab8ff', .22 + ch * .25)
    g.save(); g.translate(0, br)
    A.hand(g, -44, 20, 12, '#aab8c8', -.5); A.hand(g, 44, 20, 12, '#aab8c8', .5)
    A.ball(g, 0, 0, 30, 42, c)
    A.flat(g, -12, -8, 8, 13, '#0a0c14', .15); A.flat(g, 12, -8, 8, 13, '#0a0c14', -.15)
    A.line(g, '#4a5a7a', 1.6, [-12, 4, -12, 34]); A.line(g, '#4a5a7a', 1.6, [12, 4, 12, 34])
    A.dot(g, -12, -8, 2, '#a8d0ff', '#6a9aff'); A.dot(g, 12, -8, 2, '#a8d0ff', '#6a9aff')
    A.flat(g, 0, 8, 2, 5, sh(c, -.4))
    A.mouth(g, 0, 24, 7, 3 + ch * 12, { n: 0, tongue: false, col: '#06080e' })
    A.line(g, '#4a5a7a', 1.4, [-22, -28, -10, -34]); A.line(g, '#4a5a7a', 1.4, [22, -28, 10, -34])
    g.restore()
  })

  /* ---- Clutch -------------------------------------------------------- */
  reg('clutch', function (g) {
    var ch = A.ch, c = '#8a6a60'
    for (var i = 0; i < 7; i++) {
      var a = i / 7 * TAU + A.T * .5, r = 44 + Math.sin(A.T * 4 + i * 2) * 4 + ch * 6
      A.tent(g, Math.cos(a) * 14, Math.sin(a) * 14, a, r - 14, 9, c, { amp: 2, ph: i, taper: .3 })
      A.hand(g, Math.cos(a) * r, Math.sin(a) * r, 8, '#a88a7c', a + 1.57, { curl: .6 })
    }
    A.ball(g, 0, 0, 22, 22, '#5a3a3e')
    A.eye(g, 0, 0, 13, { sc: '#e8d8c0', col: '#c8402a', lid: .1, lc: '#5a3a3e', red: true, pu: 1.3 })
  }, { R: 22 })

  /* ---- Colostomia ---------------------------------------------------- */
  reg('colostomia', function (g) {
    var c = '#d8909c', ch = A.ch, br = Math.sin(A.T * 2.4)
    for (var i = 0; i < 3; i++) { A.ball(g, (i % 2 ? 8 : -8), -20 + i * 22, 36 - i * 2, 13 + br, sh(c, i * .02)); A.line(g, al('#8a3a4a', .5), 1.6, [-28, -20 + i * 22, 28, -20 + i * 22]) }
    A.ball(g, 24, 30, 24, 20, '#9a7a4a'); A.rect(g, 12, 12, 24, 10, '#cfc6b0', 3)
    A.flat(g, 18, 26, 8, 5, al('#fff', .25), -.5)
    A.veins(g, 0, 0, 34, '#8a3a4a', 5, 15)
    A.eye(g, -18, -26, 7, { col: '#5a3a3a', lc: c, lid: .25, red: true }); A.eye(g, 4, -30, 5, { col: '#5a3a3a', lc: c, lid: .25 })
    A.mouth(g, -8, -6, 17, 5 + ch * 12, { n: 6, tl: .6 })
    A.drip(g, 32, 44, 10, '#6a4a22', 2.6)
  })

  /* ---- Sheol / Womb / finale ---------------------------------------- */
  reg('the-lamb', function (g) {
    var ch = A.ch, br = Math.sin(A.T * 2.6)
    A.horn(g, -24, -14, -2.5, 34, 14, '#cfc2a4', -.7); A.horn(g, 24, -14, -.64, 34, 14, '#cfc2a4', .7)
    var wool = [[-30, 6, 16], [-18, -12, 17], [0, -18, 18], [18, -12, 17], [30, 6, 16], [-22, 24, 16], [0, 28, 18], [22, 24, 16]]
    wool.forEach(function (w, i) { A.ball(g, w[0], w[1] + Math.sin(A.T * 2 + i) * 1, w[2], w[2], '#ece4d6') })
    A.ball(g, 0, 4, 24, 28, '#2a2228')
    A.glow(g, -9, -2, 12, '#ff3a2a', .5 + ch * .4); A.glow(g, 9, -2, 12, '#ff3a2a', .5 + ch * .4)
    A.flat(g, -9, -2, 5, 3.4, '#ff5a3a', -.3); A.flat(g, 9, -2, 5, 3.4, '#ff5a3a', .3)
    A.mouth(g, 0, 14, 10, 3 + ch * 10, { n: 5, tl: .6, col: '#ff4a2a', tongue: false })
    A.flat(g, -20, 20, 7, 12, al('#8a1a24', .65), .3); A.drip(g, -20, 26, 14, '#8a1a24', 2.4)
    A.halo(g, 0, -42 + br, 20, 5, '#cfa84a')
  })
  reg('satan', function (g) { satan(g, 1, '#241418', '#e84a2a') })
  reg('mega-satan', function (g) { satan(g, 1.12, '#171014', '#ff2a1a', true) })
  function satan (g, k, c, ec, hands) {
    var ch = A.ch, br = Math.sin(A.T * 2)
    g.save(); g.scale(k, k)
    A.wing(g, -14, -6, 52, -2.7, '#3a2028', { dir: 1, flap: Math.sin(A.T * 2.4) * .1 }); A.wing(g, 14, -6, 52, -.44, '#3a2028', { dir: 1, flap: -Math.sin(A.T * 2.4) * .1 })
    A.glow(g, 0, 6, 54, '#a81a18', .3 + ch * .25)
    A.ball(g, 0, 34, 28, 18, c)
    if (hands) { A.hand(g, -42, 30, 14, '#2a1a20', -.3); A.hand(g, 42, 30, 14, '#2a1a20', .3) }
    A.horn(g, -18, -26, -2.3, 40, 14, '#d8c8a4', -.55); A.horn(g, 18, -26, -.84, 40, 14, '#d8c8a4', .55)
    A.ball(g, 0, 0 + br, 30, 34, sh(c, .08))
    A.ball(g, 0, 22 + br, 12, 14, sh(c, .02))
    A.glow(g, -12, -8 + br, 13, ec, .6); A.glow(g, 12, -8 + br, 13, ec, .6)
    A.poly(g, [-22, -14 + br, -4, -4 + br, -20, 0 + br], ec, { ol: false }); A.poly(g, [22, -14 + br, 4, -4 + br, 20, 0 + br], ec, { ol: false })
    A.flat(g, -4, 14 + br, 1.8, 3, '#0a0408'); A.flat(g, 4, 14 + br, 1.8, 3, '#0a0408')
    A.mouth(g, 0, 24 + br, 12, 3 + ch * 12, { n: 7, tl: .6, col: '#3a0a0c', tongue: false })
    A.line(g, '#0a0408', 2, [-12, 18 + br, 0, 22 + br, 12, 18 + br])
    A.poly(g, [-5, 36 + br, 5, 36 + br, 0, 52 + br], c)
    g.restore()
  }
  reg('boss-isaac', function (g) {
    var c = '#ead4c2', ch = A.ch, br = Math.sin(A.T * 3)
    A.glow(g, 0, 0, 60, '#cfe6ff', .22)
    A.wing(g, -10, 0, 46, -2.75, '#f2f0f4', { feather: true, dir: 1, flap: Math.sin(A.T * 4) * .12 }); A.wing(g, 10, 0, 46, -.39, '#f2f0f4', { feather: true, dir: 1, flap: -Math.sin(A.T * 4) * .12 })
    A.ball(g, 0, 30, 19, 18, sh(c, -.08)); A.ball(g, -12, 44, 7, 6, c); A.ball(g, 12, 44, 7, 6, c)
    A.ball(g, -26, 20, 7, 10, c, { rot: .5 }); A.ball(g, 26, 20, 7, 10, c, { rot: -.5 })
    A.ball(g, 0, -6 + br, 36, 32, c)
    A.blush(g, -22, 2 + br, 7); A.blush(g, 22, 2 + br, 7)
    A.eye(g, -12, -8 + br, 8, { sc: '#e8e8f0', col: '#3a5a8a', lid: .4, lc: c, pu: 1.4 }); A.eye(g, 12, -8 + br, 8, { sc: '#e8e8f0', col: '#3a5a8a', lid: .4, lc: c, pu: 1.4 })
    A.tears(g, -12, 0 + br, 22); A.tears(g, 12, 0 + br, 22)
    A.mouth(g, 0, 16 + br, 8, 3 + ch * 9, { n: 0, col: '#4a1a22', tn: '#d4707e' })
    A.halo(g, 0, -42 + br, 20, 5, '#f3d86a')
  })
  reg('boss-blue-baby', function (g) {
    var c = '#7e94a8', ch = A.ch, br = Math.sin(A.T * 3)
    A.ball(g, 0, 30, 20, 18, sh(c, -.1)); A.ball(g, -12, 44, 7, 6, c); A.ball(g, 12, 44, 7, 6, c)
    A.ball(g, -26, 20, 7, 10, c, { rot: .5 }); A.ball(g, 26, 20, 7, 10, c, { rot: -.5 })
    A.ball(g, 0, -6 + br, 36, 32, c)
    A.line(g, '#3a3a4a', 3, [-6, -38 + br, 0, -44 + br, 8, -38 + br])
    A.flat(g, -12, -8 + br, 10, 9, al('#1a1a28', .8)); A.flat(g, 12, -8 + br, 10, 9, al('#1a1a28', .8))
    A.eye(g, -12, -8 + br, 6.5, { sc: '#d8dce4', col: '#2a2a3a', lid: .15, lc: c, pu: 1.8 }); A.eye(g, 12, -8 + br, 6.5, { sc: '#d8dce4', col: '#2a2a3a', lid: .15, lc: c, pu: 1.8 })
    A.tears(g, -12, 0 + br, 24, '#8a1a2a'); A.tears(g, 12, 0 + br, 24, '#8a1a2a')
    A.mouth(g, 0, 17 + br, 9, 3 + ch * 10, { n: 0, col: '#2a1a28', tn: '#a45a6a' })
    A.veins(g, 0, 0, 34, '#4a5a78', 5, 8)
    A.flat(g, 26, 36, 8, 5, al('#5a3a22', .8))
  })
  reg('hush', function (g) {
    var c = '#4a4a8a', ch = A.ch
    for (var i = -2; i <= 2; i++) A.tent(g, i * 14, 18, Math.PI / 2 + i * .25, 40, 10, sh(c, -.2), { amp: 8, ph: i * 1.5, taper: .8, rage: 1 })
    A.blob(g, 0, -2, 46, 42, c, { n: 14, wob: .06, seed: 40 })
    A.veins(g, 0, -2, 44, '#2a2a5a', 8, 40)
    var es = [[-20, -14, 10], [8, -18, 12], [28, -2, 7], [-26, 8, 6]]
    es.forEach(function (e, i) { A.eye(g, e[0], e[1], e[2], { sc: '#e8e8f4', col: '#1a1a3a', hot: '#ff4a6a', lid: 0, pu: 1.5 + ch }) })
    A.mouth(g, 2, 20, 26, 9 + ch * 13, { n: 9, tl: .55, col: '#0e0a24', tongue: false })
    A.drip(g, -30, 28, 12, '#2a2a5a', 2.6)
  })
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
  reg('mother', function (g) {
    var c = '#e8c8bc', ch = A.ch, br = Math.sin(A.T * 1.8) * 2
    A.glow(g, 0, 0, 62, '#ff9aa0', .25)
    A.poly(g, [-40, -30, -52, 20, -38, 52, -24, 10], '#3a1e26'); A.poly(g, [40, -30, 52, 20, 38, 52, 24, 10], '#3a1e26')
    A.ball(g, 0, br, 38, 46, c)
    A.poly(g, [-36, -22, -26, -48, -12, -34, 0, -54, 12, -34, 26, -48, 36, -22, 0, -36], '#3a1e26')
    A.flat(g, -15, -4 + br, 11, 9, '#1a0a10'); A.flat(g, 15, -4 + br, 11, 9, '#1a0a10')
    A.eye(g, -15, -4 + br, 8, { sc: '#f4ece4', col: '#c83a4a', hot: '#ff8a5a', lid: 0, pu: 1.4 }); A.eye(g, 15, -4 + br, 8, { sc: '#f4ece4', col: '#c83a4a', hot: '#ff8a5a', lid: 0, pu: 1.4 })
    A.tears(g, -15, 5 + br, 30, '#a01a2a'); A.tears(g, 15, 5 + br, 30, '#a01a2a')
    A.blush(g, -26, 12 + br, 8, '#d04a5a'); A.blush(g, 26, 12 + br, 8, '#d04a5a')
    A.mouth(g, 0, 26 + br, 13, 6 + ch * 14, { n: 6, tl: .5, col: '#4a0e1a', tn: '#d4707e' })
    A.spikes(g, 0, -34, 18, 0, 0, '#000')
  })
  reg('the-beast', function (g) {
    var c = '#1c1418', ch = A.ch, br = Math.sin(A.T * 2.2)
    A.glow(g, 0, 0, 62, '#a81a18', .3 + ch * .3)
    A.horn(g, -22, -28, -2.2, 38, 14, '#3a2a2e', -.5); A.horn(g, 22, -28, -.94, 38, 14, '#3a2a2e', .5)
    A.poly(g, [-26, -24, 0, -34, 26, -24, 34, 14, 14, 46, -14, 46, -34, 14], c)
    A.poly(g, [-14, -2, 14, -2, 10, 30, -10, 30], '#2c2024')
    for (var i = -3; i <= 3; i++) A.poly(g, [i * 9 - 3, -34, i * 9 + 3, -34, i * 9, -44 - Math.abs(i) * -1], '#3a2a2e')
    A.flat(g, -14, -10, 8, 4.4, '#ff4a1a', -.4); A.flat(g, 14, -10, 8, 4.4, '#ff4a1a', .4); A.glow(g, -14, -10, 14, '#ff4a1a', .5 + ch * .4); A.glow(g, 14, -10, 14, '#ff4a1a', .5 + ch * .4)
    A.flat(g, -4, 4, 2, 3, '#08040a'); A.flat(g, 4, 4, 2, 3, '#08040a')
    A.mouth(g, 0, 28, 16, 7 + ch * 12, { n: 8, tl: .7, col: '#6a1a0c', tongue: false })
    for (i = 0; i < 4; i++) A.flat(g, -9 + i * 6, 34 + br, 3, 5 + Math.sin(A.T * 10 + i) * 3 + ch * 6, i % 2 ? '#ffd040' : '#ff7a28')
  })
  reg('dogma', function (g) {
    var ch = A.ch, f = Math.floor(A.T * 20)
    A.glow(g, 0, 0, 64, '#fff6c8', .3 + ch * .3)
    A.wing(g, -14, -4, 52, -2.75, '#f6f2e8', { feather: true, dir: 1, flap: Math.sin(A.T * 4) * .1 }); A.wing(g, 14, -4, 52, -.39, '#f6f2e8', { feather: true, dir: 1, flap: -Math.sin(A.T * 4) * .1 })
    A.rect(g, -16, 20, 32, 26, '#c8b8d8', 4); A.ball(g, -22, 30, 6, 10, '#e8d8c8', { rot: .4 }); A.ball(g, 22, 30, 6, 10, '#e8d8c8', { rot: -.4 })
    A.rect(g, -32, -34, 64, 50, '#d8d0c0', 6)
    A.rect(g, -26, -28, 52, 38, '#101418', 3)
    g.save(); g.beginPath(); g.rect(-26, -28, 52, 38); g.clip()
    for (var i = 0; i < 38; i++) { var v = A.rnd(f * 7 + i * 3); g.fillStyle = v > .5 ? al('#e8e8f0', .15 + v * .5) : al('#7a7a88', .2 + v * .4); g.fillRect(-26 + (A.rnd(f + i) * 52), -28 + (A.rnd(f * 3 + i * 2) * 38), 10 + v * 16, 2) }
    A.eye(g, -10, -14, 6, { sc: '#e8e8f4', col: '#3a6ad8', hot: '#ffe060', lid: 0 }); A.eye(g, 10, -14, 6, { sc: '#e8e8f4', col: '#3a6ad8', hot: '#ffe060', lid: 0 })
    A.line(g, '#e8e8f0', 2, [-12, 2, 12, 2 + ch * 2])
    g.restore()
    A.line(g, '#8a8478', 3, [-8, -34, -16, -50]); A.line(g, '#8a8478', 3, [8, -34, 16, -50])
    A.halo(g, 0, -50, 20, 5, '#fff0a0')
  })
  function greed (c, ac, o) {
    return function (g) {
      var ch = A.ch, br = Math.sin(A.T * 2.4)
      A.glow(g, 0, 0, 62, ac, .28 + ch * .25)
      A.ball(g, -34, 18, 11, 16, c, { rot: .3 }); A.ball(g, 34, 18, 11, 16, c, { rot: -.3 })
      A.ball(g, 0, 22, 32, 28, sh(c, -.08))
      for (var i = -2; i <= 2; i++) A.ball(g, i * 11, 36, 7, 5, sh(c, .1), { lw: 1.4 })
      A.ball(g, 0, -10 + br, 34, 32, c)
      if (o.spikes) A.spikes(g, 0, -10 + br, 33, 9, 8, ac, -1.57 - .6)
      A.crown(g, 0, -36 + br, 20, 16, ac)
      A.rect(g, -8, -32 + br, 16, 3.4, sh(c, -.6), 1)
      A.eye(g, -14, -12 + br, 9, { sc: '#f6e8a8', col: ac, lid: .15, lc: c, pu: .6 }); A.eye(g, 14, -12 + br, 9, { sc: '#f6e8a8', col: ac, lid: .15, lc: c, pu: .6 })
      A.line(g, sh(c, -.6), 2, [-14, -16 + br, -14, -8 + br]); A.line(g, sh(c, -.6), 2, [14, -16 + br, 14, -8 + br])
      A.brow(g, -24, -24 + br, -6, -19 + br, sh(c, -.6), 3.4); A.brow(g, 24, -24 + br, 6, -19 + br, sh(c, -.6), 3.4)
      A.mouth(g, 0, 10 + br, 20, 6 + ch * 12, { n: 8, tl: .6, col: '#3a1a08', tongue: false, teeth: '#fff0a0' })
      A.flat(g, -22, -2 + br, 7, 4, al('#fff', .4), -.5)
    }
  }
  reg('ultra-greed', greed('#d8ac36', '#fff070', {}))
  reg('ultra-greedier', greed('#e0a070', '#ff8ac8', { spikes: true }))
  reg('the-heretic', function (g) {
    var ch = A.ch, br = Math.sin(A.T * 2.2) * 2
    g.save(); g.translate(0, br)
    for (var i = -3; i <= 3; i++) A.tent(g, i * 10, 8, Math.PI / 2 + i * .1, 38 + (i % 2) * 6, 11, '#1c1424', { amp: 5, ph: i, taper: .9 })
    A.poly(g, [-24, -16, 24, -16, 32, 24, -32, 24], '#241a2e')
    A.horn(g, -12, -34, -2.3, 28, 10, '#d8ccb0', -.5); A.horn(g, 12, -34, -.84, 28, 10, '#d8ccb0', .5)
    A.ball(g, 0, -24, 22, 24, '#150e1c')
    A.glow(g, 0, -24, 22 + ch * 10, '#fff2c0', .35 + ch * .3)
    A.line(g, '#fff2c0', 3.4, [0, -40, 0, -10]); A.line(g, '#fff2c0', 3.4, [-10, -28, 10, -28])
    A.dot(g, -12, -24, 3, '#d82a3a'); A.dot(g, 12, -24, 3, '#d82a3a')
    A.tears(g, -12, -20, 22, '#a01a2a'); A.tears(g, 12, -20, 22, '#a01a2a')
    A.halo(g, 0, -52, 18, 4.5, '#7a6a3a')
    g.restore()
  })
  reg('horny-boys', function (g, t) {
    var c = +t.variant === 1 ? '#7a8a9a' : '#9a6a54', ch = A.ch
    A.horn(g, -22, -22, -2.6, 40, 14, '#d8ccb0', -.8); A.horn(g, 22, -22, -.54, 40, 14, '#d8ccb0', .8)
    A.ball(g, -30, 6, 8, 12, c, { rot: .8 }); A.ball(g, 30, 6, 8, 12, c, { rot: -.8 })
    A.ball(g, 0, 4, 32, 36, c)
    A.poly(g, [-10, 22, 10, 22, 0, 46], sh(c, -.2))
    A.eye(g, -14, -8, 7.5, { sc: '#e8dca8', col: '#1a1010', lid: .25, lc: c, sq: .8 }); A.eye(g, 14, -8, 7.5, { sc: '#e8dca8', col: '#1a1010', lid: .25, lc: c, sq: .8 })
    A.flat(g, -14, -8, 1.8, 6, '#0a0606'); A.flat(g, 14, -8, 1.8, 6, '#0a0606')
    A.flat(g, -4, 8, 2, 3, '#2a1410'); A.flat(g, 4, 8, 2, 3, '#2a1410')
    A.mouth(g, 0, 18, 13, 4 + ch * 10, { n: 6, tl: .6, col: '#2a0c0c' })
  })
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
