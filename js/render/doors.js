;(function (IS) {
  'use strict'
  /*
   * Door painter. Drawn in a 100-unit space where -y points OUT of the room (the
   * caller rotates the canvas per wall). The doorway fills the 80px wall band: a
   * stone frame, a dark opening, and two door leaves that slide apart when open
   * (t.charge = openness 0..1). Each room type gets its own trim, like Isaac's
   * treasure (gold), boss (skull + teeth), curse (spikes), devil/angel doors.
   */
  var A = IS.art, sh = A.sh, al = A.al, TAU = Math.PI * 2

  var STYLE = {
    normal: { leaf: '#6a4a32', trim: '#4a4440' },
    treasure: { leaf: '#8a6a2a', trim: '#c8a43c', glow: '#f2d050' },
    shop: { leaf: '#5a4a38', trim: '#3a6a8a' },
    boss: { leaf: '#5a2428', trim: '#4a3a38', glow: '#d83a2a' },
    secret: { leaf: '#5a5048', trim: '#4a4440' },
    'super-secret': { leaf: '#4a4a58', trim: '#3a3a48' },
    'ultra-secret': { leaf: '#3a3040', trim: '#2a2230' },
    curse: { leaf: '#2a1418', trim: '#3a2a2e', glow: '#a81a28' },
    devil: { leaf: '#3a1014', trim: '#2a1418', glow: '#e02a2a' },
    angel: { leaf: '#e4ddc4', trim: '#d8ccb0', glow: '#fff2b0' },
    arcade: { leaf: '#2a3a6a', trim: '#4a3a5a' },
    library: { leaf: '#4a5a2a', trim: '#4a3a28' },
    sacrifice: { leaf: '#6a2a28', trim: '#4a4440', glow: '#a81a1a' },
    challenge: { leaf: '#7a2a28', trim: '#4a3a38', glow: '#e8402a' },
    'boss-rush': { leaf: '#6a1a24', trim: '#8a6a2a', glow: '#e8402a' },
    dice: { leaf: '#d8d4cc', trim: '#6a6a6a' },
    planetarium: { leaf: '#1a2048', trim: '#3a3a6a', glow: '#8aa8ff' },
    vault: { leaf: '#7a7e86', trim: '#5a5e66' },
    bedroom: { leaf: '#b8788a', trim: '#8a5a6a' },
    'black-market': { leaf: '#18141c', trim: '#2a2230' },
    mineshaft: { leaf: '#5a4a38', trim: '#4a4440' },
    locked: { leaf: '#5a4a38', trim: '#4a4440' },
    'mom-locked': { leaf: '#6a3a38', trim: '#4a3a38', glow: '#c83a3a' }
  }

  function leaf (g, x, w, st, kind, open) {
    /* one door leaf: x = inner edge, w = signed width (towards the wall side) */
    var x0 = Math.min(x, x + w), ww = Math.abs(w), c = st.leaf
    if (ww < 1) return
    g.save(); g.beginPath(); g.rect(x0, -34, ww, 66); g.clip()
    var gr = g.createLinearGradient(0, -34, 0, 32); gr.addColorStop(0, sh(c, .12)); gr.addColorStop(1, sh(c, -.3))
    g.fillStyle = gr; g.fillRect(x0, -34, ww, 66)
    if (/treasure|boss-rush/.test(kind)) { g.fillStyle = al('#f2d050', .85); g.fillRect(x0, -34, ww, 4); g.fillRect(x0, 28, ww, 4) }
    if (/dice/.test(kind)) { /* pips */ }
    else if (/vault/.test(kind)) { for (var ry = -24; ry < 30; ry += 18) A.line(g, '#4a4e56', 2, [x0, ry, x0 + ww, ry]) }
    else if (/angel/.test(kind)) { for (var i = 0; i < 3; i++) A.line(g, al('#cfc2a0', .8), 1.6, [x0 + ww * (i + 1) / 4, -34, x0 + ww * (i + 1) / 4, 32]) }
    else { for (i = 1; i < 4; i++) A.line(g, al(sh(c, -.55), .7), 1.4, [x0 + ww * i / 4 + (kind === 'normal' ? 0 : 0), -34, x0 + ww * i / 4, 32]) }
    for (var rv = -26; rv <= 24; rv += 25) { A.flat(g, x0 + ww * .5, rv, 1.8, 1.8, '#1a1412') }
    g.restore()
    g.strokeStyle = sh(c, -.7); g.lineWidth = 1.6; g.strokeRect(x0, -34, ww, 66)
  }

  A.door = function (g, s, t, kind) {
    var k = s / 100; g.save(); g.scale(k, k)
    A.begin(t)
    var n = String(kind || 'normal').toLowerCase(), st = STYLE[n] || STYLE.normal
    var open = A.clamp01(+t.charge || 0), locked = /lock/.test(String(t.variant || '')) || /^locked|mom-locked$/.test(n)
    var secret = /secret/.test(n), T = A.T
    var stone = '#5a524c'
    /* frame */
    g.fillStyle = sh(stone, -.35); g.fillRect(-56, -42, 112, 84)
    var fgr = g.createLinearGradient(0, -42, 0, 42); fgr.addColorStop(0, sh(stone, .15)); fgr.addColorStop(1, sh(stone, -.25))
    g.fillStyle = fgr; g.fillRect(-52, -40, 104, 78)
    for (var b = 0; b < 6; b++) { var bx = -52 + b * 17.4; A.line(g, al('#1a1412', .5), 1.4, [bx, -40, bx, -30]); A.line(g, al('#1a1412', .5), 1.4, [bx + 8, 28, bx + 8, 38]) }
    if (secret) {
      /* cracked wall plug instead of a door; only drawn when the door is revealed */
      var op = open
      g.fillStyle = '#16100e'; g.beginPath(); g.moveTo(-34, 34); g.lineTo(-34, -22); g.quadraticCurveTo(0, -42, 34, -22); g.lineTo(34, 34); g.fill()
      if (op < .98) {
        g.save(); g.globalAlpha = 1 - op; g.fillStyle = sh(stone, -.1); g.beginPath(); g.moveTo(-34, 34); g.lineTo(-34, -22); g.quadraticCurveTo(0, -42, 34, -22); g.lineTo(34, 34); g.fill()
        A.line(g, '#0e0a08', 2.2, [-6, -34, 2, -18, -8, -4, 4, 10, -2, 34]); A.line(g, '#0e0a08', 1.6, [2, -18, 14, -12, 20, 0]); A.line(g, '#0e0a08', 1.6, [-8, -4, -22, 2])
        g.restore()
      }
      return g.restore()
    }
    /* opening */
    g.beginPath(); g.moveTo(-34, 34); g.lineTo(-34, -20); g.quadraticCurveTo(0, -44, 34, -20); g.lineTo(34, 34); g.closePath()
    var og = g.createLinearGradient(0, -40, 0, 34); og.addColorStop(0, '#080506'); og.addColorStop(1, '#261a16'); g.fillStyle = og; g.fill()
    if (open > .02 && st.glow) A.glow(g, 0, 4, 40, st.glow, .22 * open)
    /* leaves */
    g.save(); g.beginPath(); g.moveTo(-34, 34); g.lineTo(-34, -20); g.quadraticCurveTo(0, -44, 34, -20); g.lineTo(34, 34); g.closePath(); g.clip()
    var lw = 34 * (1 - open)
    if (lw > .5) { leaf(g, 0, -lw - 0, st, n, open); leaf(g, 0, lw, st, n, open) }
    if (lw > 6) {
      if (/treasure/.test(n)) { A.ball(g, 0, 0, 7, 8, '#e8c44a', { lw: 1.4 }); A.rect(g, -2, 2, 4, 9, '#e8c44a', 1); A.flat(g, 0, -1, 2, 2.4, '#3a2a10') }
      else if (/shop/.test(n)) { A.ball(g, 0, -4, 8, 8, '#e8c44a', { lw: 1.4 }); A.line(g, '#8a6a1a', 2, [0, -8, 0, 0]); A.rect(g, -12, 10, 24, 8, '#3a6a8a', 2) }
      else if (/boss/.test(n)) { A.skull(g, 0, -2, 11, '#d8ccb0', { eyec: st.glow }); A.line(g, '#2a1014', 2, [-14, 14, 14, 14]) }
      else if (/curse/.test(n)) { A.flat(g, 0, 0, 9, 11, '#0e0608'); A.dot(g, -3, -2, 1.8, '#e83a4a'); A.dot(g, 3, -2, 1.8, '#e83a4a') }
      else if (/devil/.test(n)) { A.horn(g, -5, -6, -2.4, 14, 6, '#1a0a0c', -.3); A.horn(g, 5, -6, -.74, 14, 6, '#1a0a0c', .3); A.flat(g, 0, 4, 6, 7, '#e02a2a') }
      else if (/angel/.test(n)) { A.halo(g, 0, -6, 9, 3, '#e8c44a'); A.wing(g, -2, 6, 14, -2.7, '#fffdf4', { feather: true, flap: 0 }); A.wing(g, 2, 6, 14, -.44, '#fffdf4', { feather: true, flap: 0 }) }
      else if (/arcade/.test(n)) { A.rect(g, -10, -12, 20, 18, '#101420', 2); A.flat(g, 0, -3, 5, 4, '#6ad8ff'); A.flat(g, -4, 11, 2.4, 2.4, '#e84a4a') }
      else if (/library/.test(n)) { A.rect(g, -9, -10, 18, 20, '#8a2a2a', 2); A.line(g, '#e8c44a', 1.6, [-5, -6, 5, -6]) }
      else if (/sacrifice/.test(n)) { for (var i = -2; i <= 2; i++) A.poly(g, [i * 6 - 3, 30, i * 6, 14, i * 6 + 3, 30], '#cfc8b4') }
      else if (/challenge|boss-rush/.test(n)) { A.skull(g, 0, -2, 10, '#d8ccb0', { eyec: '#ff5a3a' }); A.line(g, '#e8c44a', 2.2, [-10, 13, 10, 13]) }
      else if (/dice/.test(n)) { for (var d = 0; d < 5; d++) A.flat(g, [-7, 7, 0, -7, 7][d], [-8, -8, 0, 8, 8][d], 2.4, 2.4, '#1a1a1a') }
      else if (/planetarium/.test(n)) { for (var q = 0; q < 6; q++) A.flat(g, (A.rnd(q) - .5) * 40, (A.rnd(q + 9) - .5) * 40, 1.6, 1.6, '#e8f0ff'); A.ball(g, 0, 0, 7, 7, '#6a7ad8') }
      else if (/vault/.test(n)) { A.ball(g, 0, 0, 10, 10, '#9aa0aa'); A.line(g, '#3a3e46', 2, [-8, 0, 8, 0]); A.line(g, '#3a3e46', 2, [0, -8, 0, 8]) }
      else if (/bedroom/.test(n)) A.heart(g, 0, 0, 8, 12, '#e8586a')
      else if (/black-market/.test(n)) { A.flat(g, 0, 0, 8, 8, '#2a2230'); A.dot(g, 0, 0, 3, '#e8c44a') }
      else if (/mineshaft/.test(n)) { A.line(g, '#7a7a82', 3, [-10, 8, 10, -8]); A.line(g, '#4a3a28', 3, [-4, 4, 6, -2]) }
      else if (/mom/.test(n)) { A.eye(g, 0, 0, 8, { col: '#c83a3a', lid: 0, react: false }) }
    }
    g.restore()
    /* locked: chain + padlock over the leaves */
    if (locked && open < .98) {
      g.globalAlpha = 1 - open
      A.line(g, '#8a8a92', 3, [-36, -8, 36, 10]); A.line(g, '#8a8a92', 3, [-36, 10, 36, -8])
      A.rect(g, -8, -6, 16, 14, '#d8b43c', 2); g.strokeStyle = '#8a8a92'; g.lineWidth = 3; g.beginPath(); g.arc(0, -6, 6, Math.PI, 0); g.stroke(); A.flat(g, 0, 2, 2, 2.6, '#2a1a08')
      g.globalAlpha = 1
    }
    /* trim on top of the frame */
    var gl = st.glow
    if (/boss$|boss-rush|challenge/.test(n)) {
      A.skull(g, 0, -38, 9, '#d8ccb0', { eyec: gl })
      for (var j = -4; j <= 4; j++) if (j) A.poly(g, [j * 7 - 3, -40, j * 7 + 3, -40, j * 7, -30], '#e4d6b4')
    } else if (/curse/.test(n)) {
      for (j = -5; j <= 5; j++) { A.poly(g, [j * 6 - 3, -42, j * 6 + 3, -42, j * 6, -28 + Math.abs(j)], '#3a2a2e'); A.poly(g, [j * 6 - 3, 40, j * 6 + 3, 40, j * 6, 28 - Math.abs(j)], '#3a2a2e') }
    } else if (/devil/.test(n)) {
      A.horn(g, -30, -36, -2.5, 20, 9, '#1a0a0c', -.4); A.horn(g, 30, -36, -.64, 20, 9, '#1a0a0c', .4)
      A.glow(g, 0, -34, 22, '#e02a2a', .45 + Math.sin(T * 4) * .1)
    } else if (/angel/.test(n)) {
      A.halo(g, 0, -38, 18, 4, '#e8c44a'); A.glow(g, 0, -10, 46, '#fff2b0', .3)
    } else if (/treasure/.test(n)) {
      g.fillStyle = '#c8a43c'; g.fillRect(-52, -40, 104, 4); g.fillRect(-52, 34, 104, 4)
      for (j = -3; j <= 3; j++) A.flat(g, j * 15, -38, 2.4, 2.4, '#f6e08a')
    } else if (/shop/.test(n)) {
      A.rect(g, -22, -42, 44, 11, '#3a6a8a', 2); A.flat(g, 0, -36, 3.4, 3.4, '#e8c44a')
    } else if (/sacrifice/.test(n)) {
      for (j = -5; j <= 5; j++) A.poly(g, [j * 8 - 3, -40, j * 8 + 3, -40, j * 8, -31], '#cfc8b4')
    } else if (/planetarium/.test(n)) {
      for (j = 0; j < 5; j++) A.flat(g, -40 + j * 20, -38, 1.6, 1.6, '#cfe0ff')
    }
    if (gl && open < .98) A.glow(g, 0, 0, 48, gl, .12 + Math.sin(T * 3) * .04)
    g.restore()
  }

  function reg (name, kind) {
    var prev = IS.sprites && IS.sprites[name]
    var fn = function (g, s, t) { A.door(g, s, t || {}, kind) }
    if (IS.sprites) IS.sprites[name] = fn; else if (IS.defineSprite) IS.defineSprite(name, fn)
    return prev
  }
  ;(IS.DOOR_KIND_LIST || Object.keys(STYLE)).forEach(function (n) { reg('door:' + n, n); reg(n + '-door', n) })
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
