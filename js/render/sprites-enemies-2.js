;(function (IS) {
  'use strict'
  // ---------------------------------------------------------------------------
  // Enemy sprites, part 2: the long tail. Same conventions as sprites-enemies.js
  // (s = sprite size, local coords -s/2..s/2, t = time/hurt/charge/hp01/variant,
  // C() flashes on hurt). Families share drawing code and differ by palette and
  // a feature or two, one body, new palette and trim.
  // The generic fallbacks for anything still undrawn live at the bottom.
  // ---------------------------------------------------------------------------
  // Restyle layer: every painter below draws through these outlined, two-tone
  // helpers (thick dark outline, light top-left, dark underside), so the whole
  // roster shares one hand-inked look. S tracks the current sprite size.
  var K = IS.spriteKit, C = K.C, cracks = K.cracks, kdef = K.def
  var TAU = Math.PI * 2, EW = '#efe6d2', DARK = '#1a1214', MOUTH = '#2a090c', S = 80
  function rgb (c) {
    var m = /^#([0-9a-f]{6})$/i.exec(c), n
    if (m) { n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255] }
    m = /^#([0-9a-f]{3})$/i.exec(c)
    return m ? [parseInt(m[1][0] + m[1][0], 16), parseInt(m[1][1] + m[1][1], 16), parseInt(m[1][2] + m[1][2], 16)] : null
  }
  function sh (c, a) {
    var q = rgb(c); if (!q) return c
    var f = a < 0 ? 1 + a : 1, add = a > 0 ? 255 * a : 0
    return '#' + q.map(function (v) { v = Math.round(v * f + add); v = v < 0 ? 0 : v > 255 ? 255 : v; return (v < 16 ? '0' : '') + v.toString(16) }).join('')
  }
  function lwOf (m) { return Math.max(.8, Math.min(S * .032, m * .45)) }
  function O (g, x, y, rx, ry, c, rot) {
    rx = Math.max(.1, rx); ry = Math.max(.1, ry)
    g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU)
    var m = Math.min(rx, ry)
    if (!rgb(c) || m < S * .03) { g.fillStyle = c; g.fill(); return }
    var gr = g.createLinearGradient(x - rx * .7, y - ry * .8, x + rx * .6, y + ry * .9)
    gr.addColorStop(0, sh(c, .16)); gr.addColorStop(.5, c); gr.addColorStop(1, sh(c, -.28))
    g.fillStyle = gr; g.fill(); g.lineWidth = lwOf(m); g.strokeStyle = sh(c, -.7); g.stroke()
    if (m > S * .07) { g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.ellipse(x - rx * .35, y - ry * .42, rx * .26, ry * .14, -.5, 0, TAU); g.fill() }
  }
  function Pg (g, c, p, flat) {
    g.beginPath(); g.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath()
    if (!rgb(c)) { g.fillStyle = c; g.fill(); return }
    if (flat) { g.fillStyle = c; g.fill(); return }
    var y0 = 1e9, y1 = -1e9; for (i = 1; i < p.length; i += 2) { if (p[i] < y0) y0 = p[i]; if (p[i] > y1) y1 = p[i] }
    var gr = g.createLinearGradient(0, y0, 0, y1 + .01); gr.addColorStop(0, sh(c, .14)); gr.addColorStop(1, sh(c, -.22))
    g.fillStyle = gr; g.fill(); g.lineJoin = 'round'; g.lineWidth = S * .028; g.strokeStyle = sh(c, -.68); g.stroke()
  }
  function L (g, c, w, p) {
    g.lineCap = 'round'; g.lineJoin = 'round'
    var i, fat = w >= S * .035 && rgb(c)
    for (var pass = fat ? 0 : 1; pass < 2; pass++) {
      g.strokeStyle = pass ? c : sh(c, -.68); g.lineWidth = pass ? w : w + S * .055
      g.beginPath(); g.moveTo(p[0], p[1]); for (i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke()
    }
  }
  // fill the current path with a vertical two-tone gradient and a thick outline
  function FO (g, c, y0, y1) {
    var gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, sh(c, .16)); gr.addColorStop(.5, c); gr.addColorStop(1, sh(c, -.28))
    g.fillStyle = gr; g.fill(); g.lineJoin = 'round'; g.lineWidth = S * .032; g.strokeStyle = sh(c, -.7); g.stroke()
  }
  // tapered stroked body (outline pass first so segments do not cut into each other)
  function TL (g, c, w0, w1, p) {
    var n = p.length / 2 - 1, i
    g.lineCap = 'round'
    for (var pass = 0; pass < 2; pass++) for (i = 0; i < n; i++) {
      var w = w0 + (w1 - w0) * i / Math.max(1, n - 1)
      g.strokeStyle = pass ? c : sh(c, -.7); g.lineWidth = pass ? w : w + S * .055
      g.beginPath(); g.moveTo(p[i * 2], p[i * 2 + 1]); g.lineTo(p[i * 2 + 2], p[i * 2 + 3]); g.stroke()
    }
  }
  function spiral (g, cx, cy, r0, r1, turns, c, w) { var p = [], n = 30, j; for (j = 0; j <= n; j++) { var a = j / n * turns * TAU, r = r0 + (r1 - r0) * j / n; p.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r * .92) } L(g, c, w, p) }
  function eye (g, x, y, r, c, pc, dy) { O(g, x, y, r, r * 1.1, c); O(g, x, y + (dy || 0), r * .5, r * .6, pc || DARK); O(g, x - r * .2, y - r * .2, r * .16, r * .16, '#ffffff') }
  function sw (t, id, f, a) { return Math.sin(t.time * f + id.length * 1.7) * a }
  function ch (t) { return t.charge || 0 }
  function wings (g, s, t, x, y, col, f, big) { var fl = Math.sin(t.time * f) * s * .07; O(g, -x, y + fl, s * (big || .18), s * .1, col); O(g, x, y - fl, s * (big || .18), s * .1, col) }
  function mouth (g, s, x, y, w, open, c) { O(g, x, y, s * w, s * open, c || MOUTH) }
  function teeth (g, s, x, y, n, w, h, c) { for (var i = 0; i < n; i++) Pg(g, c || '#e8ddc2', [x + (i - (n - 1) / 2) * w * s, y, x + (i - (n - 1) / 2) * w * s + w * s * .5, y + h * s, x + (i - (n - 1) / 2) * w * s - w * s * .5, y + h * s], true) }
  function pupilEye (g, s, x, y, r, t, c) { var lk = Math.sin(t.time * 1.3) * r * .3; O(g, x, y, r, r * 1.05, c || EW); O(g, x + lk, y, r * .5, r * .6, DARK); O(g, x - r * .25, y - r * .3, r * .15, r * .15, '#ffffff') }
  function def (ids, fn) { kdef(ids, function (id) { var p = fn(id); return function (g, s, t) { S = s; p(g, s, t) } }) }

  // --- small blobs ----------------------------------------------------------
  var BLOBS = {
    'i-blob': { c: '#d3c4ad', k: 'plain' }, 'spit': { c: '#e6d6c0', k: 'spit' }, 'drop': { c: '#b8504c', k: 'tear' },
    'splasher': { c: '#a54a52', k: 'splat' }, 'cyclopia': { c: '#e4cdb8', k: 'cyclops' }, 'roundy': { c: '#c07d6f', k: 'round' },
    'dip': { c: '#8a6643', k: 'swirl' }, 'dank-dip': { c: '#4d5a45', k: 'swirl' }, 'squirt': { c: '#a7826a', k: 'swirl', hop: true },
    'oob': { c: '#c9b9a3', k: 'oob' }
  }
  function blob (id) { var k = BLOBS[id]; return function (g, s, t) {
    var w = Math.sin(t.time * 6 + id.length), sq = w * s * .025, c = C(t, k.c), d = C(t, sh(k.c, -.28)), l = C(t, sh(k.c, .14)), c2 = ch(t), i
    if (k.k === 'swirl') {
      // a slime-snail: long foot, raised head on eyestalks, spiral shell on its back
      var hop = k.hop ? -Math.abs(Math.sin(t.time * 5)) * s * .1 : 0, cr = Math.sin(t.time * 4) * s * .02, dk = id === 'dank-dip'
      O(g, s * .08, s * .27 + hop, s * .38, s * .12 - sq * .4, d)
      O(g, -s * .13 + cr, s * .13 + hop, s * .21, s * .15, l)
      for (var sd = -1; sd <= 1; sd += 2) L(g, d, s * .035, [-s * .15 + cr, s * .04 + hop, -s * .17 + sd * s * .09 + cr, -s * .13 + hop, -s * .15 + sd * s * .12 + cr, -s * .22 + hop])
      O(g, s * .13, s * .03 + hop, s * .27, s * .25, c); spiral(g, s * .13, s * .03 + hop, s * .02, s * .2, 2.2, d, s * .028)
      if (dk) for (i = 0; i < 4; i++) { var a = -2.7 + i * .55, bx = s * .13 + Math.cos(a) * s * .25, by = s * .03 + hop + Math.sin(a) * s * .23; Pg(g, d, [bx - s * .04, by + s * .03, bx + Math.cos(a) * s * .1, by + Math.sin(a) * s * .1, bx + s * .04, by + s * .03]) }
      for (sd = -1; sd <= 1; sd += 2) eye(g, -s * .15 + sd * s * .12 + cr, -s * .25 + hop, s * .05, EW)
      mouth(g, s, -s * .19 + cr, s * .19 + hop, .05, .02 + .05 * c2)
    } else if (k.k === 'tear') {
      // a ripe pus-blister: pointed crest, pimples and a drip
      g.beginPath(); g.moveTo(0, -s * .46 + sq); g.quadraticCurveTo(s * .1, -s * .2, s * .3, s * .08); g.quadraticCurveTo(s * .34, s * .4, 0, s * .4); g.quadraticCurveTo(-s * .34, s * .4, -s * .3, s * .08); g.quadraticCurveTo(-s * .1, -s * .2, 0, -s * .46 + sq); FO(g, c, -s * .46, s * .4)
      O(g, -s * .13, -s * .0, s * .06, s * .08, 'rgba(255,215,190,.45)'); O(g, s * .2, s * .26, s * .05, s * .05, l); O(g, -s * .22, s * .24, s * .04, s * .04, d)
      eye(g, -s * .1, s * .12, s * .06, EW); eye(g, s * .1, s * .12, s * .06, EW); L(g, '#3a0c10', s * .03, [-s * .18, s * .03, -s * .04, s * .08]); L(g, '#3a0c10', s * .03, [s * .18, s * .03, s * .04, s * .08]); mouth(g, s, 0, s * .27, .08, .03 + .05 * c2)
      O(g, s * .12, s * .4 + (t.time * 2 % 1) * s * .08, s * .025, s * .04, l)
    } else if (k.k === 'splat') {
      for (i = 0; i < 7; i++) { var a2 = i / 7 * TAU + .3; O(g, Math.cos(a2) * s * (.33 + c2 * .06), Math.sin(a2) * s * (.27 + c2 * .05), s * .07, s * .06, d) }
      O(g, 0, s * .04, s * (.34 + sq / s * 2), s * .28, c); O(g, 0, -s * .06, s * .2, s * .1, C(t, sh(k.c, .15)))
      eye(g, -s * .1, 0, s * .06, EW); eye(g, s * .1, 0, s * .06, EW); mouth(g, s, 0, s * .17, .12, .03 + .08 * c2); O(g, s * .2, s * .25 + (t.time * 30 % 1) * s * .1, s * .03, s * .045, '#8a2a30')
    } else if (k.k === 'cyclops') {
      // a squat shell-helmeted eye in a bowl of flesh
      O(g, 0, s * .1, s * .32, s * .28 + sq, d); O(g, 0, s * .2, s * .26, s * .12, l)
      O(g, 0, -s * .02, s * .24, s * .22, EW); var lk = Math.sin(t.time * 1.5) * s * .05; O(g, lk, -s * .02, s * .12, s * .13, '#6a8fa8'); O(g, lk, -s * .02, s * .06, s * .07, DARK); O(g, lk - s * .03, -s * .06, s * .025, s * .025, '#fff')
      g.beginPath(); g.moveTo(-s * .32, s * .0); g.quadraticCurveTo(-s * .3, -s * .42, 0, -s * .4); g.quadraticCurveTo(s * .3, -s * .42, s * .32, s * .0); g.lineTo(s * .22, -s * .1); g.lineTo(s * .1, -s * .02); g.lineTo(0, -s * .12); g.lineTo(-s * .1, -s * .02); g.lineTo(-s * .22, -s * .1); g.closePath(); FO(g, c, -s * .4, s * .0)
      L(g, d, s * .02, [-s * .12, -s * .34, -s * .06, -s * .2]); L(g, d, s * .02, [s * .14, -s * .34, s * .1, -s * .22]); mouth(g, s, 0, s * .27, .1, .03 + .04 * c2)
    } else if (k.k === 'round') {
      // armadillo ball: banded shell, head and feet poking out
      var sp = t.time * 3
      O(g, -s * .15, s * .34, s * .08, s * .05, d); O(g, s * .15, s * .34, s * .08, s * .05, d)
      O(g, 0, 0, s * .36, s * .35, c)
      for (i = -2; i <= 2; i++) { g.beginPath(); g.ellipse(0, 0, s * .36 * Math.sqrt(Math.max(0, 1 - Math.pow(i * .27, 2))), s * .35, 0, 0, TAU); g.lineWidth = s * .02; g.strokeStyle = sh(k.c, -.45); g.stroke() }
      O(g, s * .0, -s * .24 + Math.sin(sp) * s * .01, s * .17, s * .14, C(t, sh(k.c, .1)))
      eye(g, -s * .07, -s * .27, s * .045, EW); eye(g, s * .07, -s * .27, s * .045, EW); mouth(g, s, 0, -s * .17, .07, .02 + .05 * c2)
    } else if (k.k === 'oob') {
      // slab-browed brute head: ridge, jug ears, underbite tusks
      var hb = Math.abs(Math.sin(t.time * 4)) * s * .03
      O(g, -s * .12, s * .4, s * .08, s * .05, d); O(g, s * .12, s * .4, s * .08, s * .05, d)
      O(g, -s * .38, -s * .06 - hb, s * .07, s * .1, d); O(g, s * .38, -s * .06 - hb, s * .07, s * .1, d)
      O(g, 0, -s * .06 - hb, s * .35, s * .33, c); O(g, 0, s * .16 - hb, s * .26, s * .15, C(t, sh(k.c, -.12)))
      L(g, sh(k.c, -.5), s * .06, [-s * .26, -s * .18 - hb, -s * .08, -s * .13 - hb, s * .08, -s * .13 - hb, s * .26, -s * .18 - hb])
      O(g, -s * .1, -s * .08 - hb, s * .05, s * .045, EW); O(g, s * .1, -s * .08 - hb, s * .05, s * .045, EW); O(g, -s * .1, -s * .08 - hb, s * .02, s * .025, DARK); O(g, s * .1, -s * .08 - hb, s * .02, s * .025, DARK)
      mouth(g, s, 0, s * .16 - hb, .15, .02 + .06 * c2); Pg(g, '#f1ead2', [-s * .1, s * .15 - hb, -s * .06, s * .15 - hb, -s * .08, s * .04 - hb], true); Pg(g, '#f1ead2', [s * .1, s * .15 - hb, s * .06, s * .15 - hb, s * .08, s * .04 - hb], true)
    } else if (k.k === 'spit') {
      // slit-grinned pod that dribbles
      O(g, 0, s * .06 + sq, s * .34, s * .33, c); O(g, 0, s * .24, s * .27, s * .1, d)
      pupilEye(g, s, -s * .12, -s * .14, s * .06, t); pupilEye(g, s, s * .12, -s * .14, s * .06, t)
      mouth(g, s, 0, s * .1, .22, .05 + .09 * c2, '#3a0c10'); teeth(g, s, 0, s * .06, 7, .06, .035); O(g, 0, s * .15, s * .07, s * .035, '#a8484f'); O(g, s * .14, s * (.24 + (t.time * 3 % 1) * .1), s * .03, s * .04, '#cdb89a')
    } else {
      // putty lump: dorsal bumps, nostril pores and one heavy-lidded eye
      O(g, 0, s * .3, s * .28, s * .08, d); O(g, 0, s * .05, s * .33 + sq, s * .3, c)
      for (i = -1; i <= 1; i++) O(g, i * s * .16, -s * .22 + Math.abs(i) * s * .05, s * .07, s * .06, l)
      O(g, -s * .08, s * .17, s * .02, s * .015, d); O(g, s * .08, s * .17, s * .02, s * .015, d)
      pupilEye(g, s, 0, -s * .02, s * .12, t, EW); g.save(); g.beginPath(); g.ellipse(0, -s * .02, s * .12, s * .13, 0, 0, TAU); g.clip(); g.fillStyle = c; g.fillRect(-s * .13, -s * .16, s * .26, s * (.1 + .08 * Math.max(0, Math.sin(t.time * 1.3)))); g.restore(); L(g, d, s * .02, [-s * .13, -s * .06, s * .13, -s * .06])
      mouth(g, s, 0, s * .2, .06, .02 + .04 * c2)
    }
    cracks(g, s, t)
  } }
  def(Object.keys(BLOBS), blob)

  // The Keeper enemy: a hopping clay coin-pot with a stitched face and a coin in its grin.
  def(['keeper-enemy'], function () { return function (g, s, t) {
    var hop = Math.abs(Math.sin(t.time * 5)) * s * .08, c = C(t, '#b0764a'), d = C(t, '#7a4a2c')
    O(g, 0, s * .36, s * .24, s * .06, 'rgba(0,0,0,.25)')
    O(g, -s * .2, s * .3 - hop * .5, s * .08, s * .06, d); O(g, s * .2, s * .3 - hop * .5, s * .08, s * .06, d)
    O(g, 0, s * .06 - hop, s * .32, s * .34, c); O(g, 0, -s * .24 - hop, s * .24, s * .09, C(t, '#c88a5a')); O(g, 0, -s * .25 - hop, s * .1, s * .025, '#1a0e0a')
    L(g, '#3a2418', s * .025, [-s * .3, -s * .1 - hop, -s * .3, s * .22 - hop]); L(g, '#3a2418', s * .025, [s * .3, -s * .1 - hop, s * .3, s * .22 - hop])
    for (var i = -1; i <= 1; i += 2) { L(g, '#f0e4c8', s * .02, [i * s * .17 - s * .06, -s * .1 - hop, i * s * .17 + s * .06, s * .0 - hop]); L(g, '#f0e4c8', s * .02, [i * s * .17 - s * .06, s * .0 - hop, i * s * .17 + s * .06, -s * .1 - hop]) }
    O(g, 0, s * .16 - hop, s * .18, s * .07 + (t.charge || 0) * s * .05, '#2a1214'); O(g, 0, s * .17 - hop, s * .06, s * .055, C(t, '#e2b84a'))
    for (i = -3; i <= 3; i++) L(g, '#f0e4c8', s * .012, [i * s * .05, s * .11 - hop, i * s * .05, s * .17 - hop])
  } })

  // --- flesh, sacks and guts ------------------------------------------------
  var FLESH = {
    'sack-enemy': { k: 'sack', c: '#a8814f' }, 'fat-sack': { k: 'sack', c: '#8a847c', fat: true }, 'sack-of-sacks': { k: 'sack', c: '#9a7448', kids: true },
    'chubber': { k: 'grub', c: '#b9a48a' }, 'gut': { k: 'gut', c: '#c4757c' }, 
    'walking-boil': { k: 'boil', c: '#c9988a', legs: true }, 'blue-boil': { k: 'boil', c: '#7b95a8' },
    'blue-fatty': { k: 'fat', c: '#8ea6b4' }, 'blue-conjoined-fatty': { k: 'fat', c: '#8ea6b4', two: true },
    'blue-tumor': { k: 'tumor', c: '#5f86a8' }, 'tissue': { k: 'tissue', c: '#d79aa2' }, 'membrane': { k: 'tissue', c: '#b9788c', eyes: true },
    'the-thing': { k: 'mass', c: '#a8626a' }, 'sanguine-bond': { k: 'bond', c: '#a8323b' }
  }
  function flesh (id) { var k = FLESH[id]; return function (g, s, t) {
    var w = Math.sin(t.time * 4 + id.length), c = C(t, k.c), d = C(t, sh(k.c, -.3)), c2 = ch(t), i
    if (k.k === 'sack') {
      var b = Math.abs(Math.sin(t.time * 6)) * s * .03, wd = k.fat ? .42 : .34
      L(g, d, s * .08, [-s * .12, s * .3, -s * .14, s * .42]); L(g, d, s * .08, [s * .12, s * .3, s * .14, s * .42])
      O(g, 0, s * .1 - b, s * wd, s * .32, c); O(g, 0, s * .16 - b, s * wd * .8, s * .2, C(t, sh(k.c, .08)))
      Pg(g, c, [-s * .12, -s * .16 - b, s * .12, -s * .16 - b, s * .07, -s * .3 - b, -s * .07, -s * .3 - b]); L(g, '#4a3220', s * .03, [-s * .1, -s * .2 - b, s * .1, -s * .24 - b]); O(g, 0, -s * .33 - b, s * .06, s * .04, d)
      for (i = -1; i <= 1; i += 2) L(g, '#3a2a1a', s * .015, [i * s * .2, s * .0 - b, i * s * .1, s * .08 - b])
      eye(g, -s * .1, s * .02 - b, s * .06, EW); eye(g, s * .1, s * .02 - b, s * .06, EW); mouth(g, s, 0, s * .2 - b, .1, .03 + .06 * c2)
      if (k.kids) for (i = -1; i <= 1; i += 2) { O(g, i * s * .3, s * .2, s * .1, s * .12, C(t, sh(k.c, .1))); L(g, '#3a2a1a', s * .015, [i * s * .26, s * .12, i * s * .34, s * .12]) }
    } else if (k.k === 'grub') {
      // armoured larva: plated segments with dorsal spikes, pincer jaws and orange eyespots
      for (i = 4; i >= 0; i--) {
        var gx = (i - 2) * s * .14 + s * .06, gy = s * .1 + Math.sin(t.time * 6 + i * .8) * s * .035, gr = s * (.2 - i * .012)
        Pg(g, d, [gx - s * .035, gy - gr * .8, gx, gy - gr * 1.3, gx + s * .035, gy - gr * .8])
        O(g, gx, gy, gr * .82, gr, C(t, sh(k.c, -i * .03))); L(g, d, s * .018, [gx - gr * .45, gy - gr * .55, gx, gy - gr * .72, gx + gr * .45, gy - gr * .55])
      }
      O(g, -s * .35, s * .06, s * .13, s * .15, C(t, sh(k.c, .1)))
      L(g, d, s * .04, [-s * .42, s * .0, -s * .5, s * .06, -s * .46, s * .12]); L(g, d, s * .04, [-s * .42, s * .14, -s * .5, s * .1 + c2 * s * .06, -s * .46, s * .06])
      O(g, -s * .37, -s * .01, s * .035, s * .035, '#e8782c'); O(g, -s * .31, s * .1, s * .03, s * .03, '#e8782c')
    } else if (k.k === 'gut') {
      var n = k.big ? 3 : 2
      for (i = 0; i < n; i++) { var oy = (i - (n - 1) / 2) * s * .22; L(g, d, s * .17, [-s * .3, oy, -s * .1, oy + Math.sin(t.time * 4 + i) * s * .08, s * .1, oy - Math.sin(t.time * 4 + i) * s * .08, s * .3, oy]); L(g, c, s * .12, [-s * .3, oy, -s * .1, oy + Math.sin(t.time * 4 + i) * s * .08, s * .1, oy - Math.sin(t.time * 4 + i) * s * .08, s * .3, oy]) }
      O(g, -s * .2, -s * .02, s * .06, s * .06, EW); O(g, -s * .2, -s * .02, s * .03, s * .03, DARK); mouth(g, s, s * .25, s * .04, .05, .03 + .05 * c2)
    } else if (k.k === 'boil') {
      var by = k.legs ? Math.abs(Math.sin(t.time * 9)) * s * .02 : 0
      if (k.legs) { L(g, d, s * .07, [-s * .12, s * .2, -s * .14 + Math.sin(t.time * 9) * s * .05, s * .4]); L(g, d, s * .07, [s * .12, s * .2, s * .14 - Math.sin(t.time * 9) * s * .05, s * .4]) }
      O(g, 0, s * .06 - by, s * .34, s * .32 + w * s * .01, c); for (i = 0; i < 6; i++) O(g, Math.cos(i * 1.1) * s * .22, Math.sin(i * 1.3) * s * .2 + s * .06, s * .06, s * .06, C(t, sh(k.c, i % 2 ? .1 : -.12)))
      O(g, 0, -s * .06 - by, s * .15, s * .13 + c2 * s * .04, C(t, '#e8e0c2')); O(g, 0, -s * .04 - by, s * .06, s * .06, C(t, '#d2b866')); eye(g, -s * .13, s * .12, s * .035, EW); eye(g, s * .13, s * .12, s * .035, EW)
    } else if (k.k === 'fat') {
      // frost-toad: wide squat body, turret eyes, splayed webbed feet, throat sac
      var two = k.two, bxs = two ? [-.2, .22] : [0]
      if (two) O(g, s * .01, s * .12, s * .14, s * .14, d)
      bxs.forEach(function (x, j) {
        var rx = s * (two ? (j ? .24 : .27) : .4), ry = rx * .84, X = s * x, Y = s * (two ? .12 : .12)
        O(g, X - rx * .85, Y + ry * .75, rx * .28, ry * .17, d); O(g, X + rx * .85, Y + ry * .75, rx * .28, ry * .17, d)
        O(g, X, Y + w * s * .01, rx, ry, c); O(g, X, Y + ry * .45, rx * .7, ry * .5, C(t, sh(k.c, .12)))
        O(g, X - rx * .42, Y - ry * .85, rx * .26, rx * .26, c); O(g, X + rx * .42, Y - ry * .85, rx * .26, rx * .26, c)
        eye(g, X - rx * .42, Y - ry * .88, rx * .15, EW); eye(g, X + rx * .42, Y - ry * .88, rx * .15, EW)
        O(g, X - rx * .2, Y - ry * .35, rx * .06, rx * .06, d); O(g, X + rx * .3, Y - ry * .25, rx * .05, rx * .05, d)
        L(g, sh(k.c, -.6), s * .025, [X - rx * .6, Y + ry * .1, X - rx * .2, Y + ry * .22, X + rx * .2, Y + ry * .22, X + rx * .6, Y + ry * .1])
        if (c2 > .05) O(g, X, Y + ry * .24, rx * .42, s * (.02 + .07 * c2), '#2a1a2a')
      })
    } else if (k.k === 'tumor') {
      var r = s * .33 + w * s * .015
      for (i = 0; i < 8; i++) O(g, Math.cos(i * 0.785) * r * .85, Math.sin(i * 0.785) * r * .85, s * .11, s * .11, d)
      O(g, 0, 0, r, r, c); O(g, -s * .08, -s * .1, s * .09, s * .06, 'rgba(210,235,255,.4)'); pupilEye(g, s, -s * .1, s * .02, s * .06, t); pupilEye(g, s, s * .1, s * .02, s * .06, t); mouth(g, s, 0, s * .17, .09, .03 + .05 * c2)
    } else if (k.k === 'tissue') {
      var pul = 1 + w * .03
      g.fillStyle = IS.alpha ? IS.alpha(k.c, .75) : k.c; g.beginPath(); g.ellipse(0, 0, s * .42 * pul, s * .34 * pul, 0, 0, TAU); g.fill()
      if (t.hurt) O(g, 0, 0, s * .42, s * .34, '#f6f0e4'); L(g, d, s * .018, [-s * .35, -s * .05, -s * .1, 0, s * .1, -s * .08, s * .34, s * .02]); L(g, d, s * .018, [-s * .1, 0, -s * .2, s * .22]); L(g, d, s * .018, [s * .1, -s * .08, s * .2, -s * .24])
      O(g, 0, s * .02, s * .13, s * .13, C(t, sh(k.c, -.4)))
      if (k.eyes) { eye(g, -s * .24, -s * .1, s * .05, EW); eye(g, s * .25, s * .1, s * .05, EW); eye(g, s * .05, -s * .22, s * .04, EW) } else mouth(g, s, 0, s * .03, .06, .03 + .05 * c2, '#3a0f18')
    } else if (k.k === 'mass') {
      var lump = [[-.22, .08, .22], [.2, .12, .2], [0, -.14, .24], [-.08, .26, .16], [.26, -.12, .14], [-.28, -.16, .13]]
      lump.forEach(function (p, j) { O(g, p[0] * s, p[1] * s + Math.sin(t.time * 3 + j) * s * .015, p[2] * s, p[2] * s, C(t, sh(k.c, j % 2 ? .08 : -.1))) })
      eye(g, -s * .2, s * .06, s * .06, EW); eye(g, s * .02, -s * .15, s * .07, '#e8d070'); eye(g, s * .22, s * .14, s * .05, EW); eye(g, -s * .1, s * .26, s * .04, EW); mouth(g, s, s * .02, s * .08, .08, .03 + .06 * c2, '#2a0a0e'); teeth(g, s, s * .02, s * .07, 4, .04, .05)
    } else {
      var sp = Math.sin(t.time * 6) * s * .03
      L(g, d, s * .06, [-s * .3, s * .1, -s * .1, -s * .12 + sp, s * .1, s * .12 - sp, s * .3, -s * .1]); L(g, c, s * .035, [-s * .3, s * .1, -s * .1, -s * .12 + sp, s * .1, s * .12 - sp, s * .3, -s * .1])
      O(g, -s * .3, s * .1, s * .09, s * .09, d); O(g, s * .3, -s * .1, s * .09, s * .09, d); eye(g, -s * .3, s * .1, s * .045, EW); eye(g, s * .3, -s * .1, s * .045, EW); O(g, 0, 0, s * .1, s * .1, c); O(g, 0, 0, s * .05, s * .05, '#e8a0a8')
    }
    cracks(g, s, t)
  } }
  def(Object.keys(FLESH), flesh)

  // --- arachnids and creeps -------------------------------------------------
  var ARACH = {
    'trite': { c: '#c9b79e', k: 'jumper' }, 'para-bite': { c: '#c9a24a', k: 'beetle' }, 'tinted-rock-spider': { c: '#8a7f78', k: 'rock' },
    'baby-long-legs': { c: '#c8b89c', k: 'long', sm: true }, 'crazy-long-legs': { c: '#a88a72', k: 'long' },
    'blind-creep': { c: '#a89a8c', k: 'creep' }, 'rage-creep': { c: '#a8403f', k: 'creep', rage: true }
  }
  function arach (id) { var k = ARACH[id]; return function (g, s, t) {
    var c = C(t, k.c), d = C(t, sh(k.c, -.38)), l = C(t, sh(k.c, .1)), c2 = ch(t), i, sd, ph = t.time * 10
    if (k.k === 'jumper') {
      // flea: tall pill body, coiled hind legs that fling out on the hop, long feelers
      var hop = -Math.abs(Math.sin(t.time * 4)) * s * .1, ex = Math.max(0, -hop / (s * .1))
      for (sd = -1; sd <= 1; sd += 2) {
        L(g, d, s * .05, [sd * s * .1, s * .08 + hop, sd * s * (.3 + ex * .06), s * .0 + hop * .6, sd * s * (.2 + ex * .22), s * (.3 + ex * .1) + hop * .2])
        L(g, d, s * .03, [sd * s * .09, -s * .02 + hop, sd * s * .24, -s * .1 + hop, sd * s * .3, -s * .02 + hop])
        L(g, d, s * .02, [sd * s * .05, -s * .3 + hop, sd * s * .14, -s * .42 + hop, sd * s * .22, -s * .4 + hop])
      }
      O(g, 0, s * .08 + hop, s * .19, s * .27, c); for (i = 0; i < 3; i++) L(g, d, s * .02, [-s * .14, s * (.04 + i * .09) + hop, s * .14, s * (.04 + i * .09) + hop])
      O(g, 0, -s * .17 + hop, s * .15, s * .12, l); eye(g, -s * .07, -s * .2 + hop, s * .055, '#e8d070'); eye(g, s * .07, -s * .2 + hop, s * .055, '#e8d070')
      Pg(g, '#2a1a1a', [-s * .03, -s * .1 + hop, s * .03, -s * .1 + hop, 0, -s * .03 - c2 * s * .04 + hop])
    } else if (k.k === 'beetle') {
      // stag beetle: split glossy elytra, hooked mandibles
      for (sd = -1; sd <= 1; sd += 2) for (i = 0; i < 3; i++) L(g, d, s * .035, [sd * s * .16, -s * .02 + i * s * .12, sd * s * (.32 + (i === 1 ? .04 : 0)), s * (.04 + i * .12) + Math.sin(ph + i + sd) * s * .03])
      O(g, -s * .1, s * .1, s * .13, s * .28, c); O(g, s * .1, s * .1, s * .13, s * .28, c); L(g, d, s * .02, [0, -s * .16, 0, s * .36])
      O(g, 0, -s * .2, s * .13, s * .1, l)
      for (sd = -1; sd <= 1; sd += 2) { L(g, d, s * .05, [sd * s * .07, -s * .26, sd * s * .2, -s * .36 - c2 * s * .04, sd * s * .08, -s * .46]); Pg(g, d, [sd * s * .08, -s * .46, sd * s * .04, -s * .42, sd * s * .1, -s * .4], true); eye(g, sd * s * .07, -s * .21, s * .035, '#e86a3a') }
    } else if (k.k === 'rock') {
      // rock-crab: faceted boulder shell on six legs, eyes peeking from the front rim
      for (sd = -1; sd <= 1; sd += 2) for (i = 0; i < 3; i++) L(g, d, s * .04, [sd * s * .16, s * (-.02 + i * .1), sd * s * .32, s * (.0 + i * .1) + Math.sin(ph + i * 1.3 + sd) * s * .04, sd * s * .42, s * (.1 + i * .1)])
      for (sd = -1; sd <= 1; sd += 2) { L(g, d, s * .03, [sd * s * .09, -s * .12, sd * s * .12, -s * .24]); eye(g, sd * s * .12, -s * .27, s * .045, '#d8c98a') }
      Pg(g, c, [-s * .28, s * .06, -s * .2, -s * .12, -s * .02, -s * .2, s * .18, -s * .14, s * .29, s * .04, s * .22, s * .24, -s * .02, s * .28, -s * .2, s * .22])
      Pg(g, l, [-s * .2, -s * .1, -s * .02, -s * .17, s * .14, -s * .11, s * .0, s * .02, -s * .14, s * .03]); Pg(g, d, [s * .0, s * .06, s * .16, s * .04, s * .18, s * .2, s * .0, s * .24], true)
      L(g, sh(k.c, -.6), s * .02, [-s * .14, s * .1, -s * .06, s * .2]); mouth(g, s, 0, -s * .02, .05, .015 + .04 * c2)
    } else if (k.k === 'long') {
      // stilt-walker: six jointed hooked legs round a plated disc with one big eye
      var r = k.sm ? .8 : 1
      for (i = 0; i < 6; i++) {
        var la = i / 6 * TAU + .3, wv = Math.sin(ph * .6 + i * 1.7) * s * .03, ca = Math.cos(la), sa = Math.sin(la)
        L(g, d, s * .03, [ca * s * .1 * r, sa * s * .1 * r, ca * s * .3 + wv, sa * s * .3 - s * .08, ca * s * .46 * r + wv, sa * s * .42 * r])
        L(g, d, s * .03, [ca * s * .46 * r + wv, sa * s * .42 * r, ca * s * .5 * r + wv, sa * s * .46 * r + s * .02])
      }
      O(g, 0, 0, s * .2 * r, s * .19 * r, c); O(g, 0, -s * .02, s * .15 * r, s * .13 * r, l)
      O(g, 0, -s * .02, s * .1 * r, s * .1 * r, EW); O(g, Math.sin(t.time * 1.6) * s * .03, -s * .02, s * .05 * r, s * .07 * r, '#c0382c'); O(g, Math.sin(t.time * 1.6) * s * .03, -s * .02, s * .015, s * .06 * r, DARK)
      if (!k.sm) mouth(g, s, 0, s * .12, .06, .02 + .05 * c2)
    } else {
      // creep: low skittering body on stalked eyes
      for (sd = -1; sd <= 1; sd += 2) for (i = 0; i < 3; i++) { var yy = (i - 1) * s * .13, ww = Math.sin(ph + i * 1.3 + (sd > 0 ? 1.7 : 0)) * s * .04; L(g, d, s * .04, [sd * s * .12, yy * .6 + s * .08, sd * s * .3 + ww, yy + s * .14, sd * s * .38, yy + s * .2]) }
      for (sd = -1; sd <= 1; sd += 2) L(g, d, s * .03, [sd * s * .1, s * .0, sd * s * .15, -s * .24])
      O(g, 0, s * .08, s * .26, s * .2, c); O(g, 0, s * .02, s * .2, s * .1, l)
      for (sd = -1; sd <= 1; sd += 2) { O(g, sd * s * .15, -s * .27, s * .07, s * .07, EW); O(g, sd * s * .15, -s * .27, s * .035, s * .035, k.rage ? '#d82a2a' : '#7a8a9a') }
      if (k.rage) { L(g, '#2a0a0c', s * .04, [-s * .22, -s * .36, -s * .08, -s * .28]); L(g, '#2a0a0c', s * .04, [s * .22, -s * .36, s * .08, -s * .28]) } else L(g, d, s * .02, [-s * .2, -s * .27, -s * .1, -s * .27])
      mouth(g, s, 0, s * .14, .08, .03 + .06 * c2); if (k.rage) teeth(g, s, 0, s * .11, 4, .04, .04)
    }
    cracks(g, s, t)
  } }
  def(Object.keys(ARACH), arach)

  // --- worms, leeches and tendrils ------------------------------------------
  var LEECH = { 'small-leech': { c: '#9c4a52', sm: true }, 'black-leech': { c: '#34303a' }, 'red-leech': { c: '#b8323a' }, 'kamikaze-leech': { c: '#6a5a8a', bomb: true } }
  function leech (id) { var k = LEECH[id]; return function (g, s, t) {
    // mud-eel: one smooth tapering body with a back ridge and a ring-toothed sucker mouth
    var n = 9, rr = k.sm ? .75 : 1, pts = [], i, c = C(t, k.c), d = C(t, sh(k.c, -.35)), l = C(t, sh(k.c, .16))
    for (i = 0; i < n; i++) { var f = i / (n - 1); pts.push(s * (-.34 + f * .8 * rr), Math.sin(t.time * 8 - f * 5) * s * .07 * rr * (.3 + f) + s * .08) }
    TL(g, c, s * .2 * rr, s * .05 * rr, pts)
    for (i = 1; i < n - 1; i += 2) Pg(g, d, [pts[i * 2] - s * .03, pts[i * 2 + 1] - s * .08 * rr, pts[i * 2], pts[i * 2 + 1] - s * .15 * rr, pts[i * 2] + s * .03, pts[i * 2 + 1] - s * .08 * rr])
    var q = [], j; for (j = 1; j < n - 1; j++) q.push(pts[j * 2], pts[j * 2 + 1] - s * .03 * rr); L(g, l, s * .022, q)
    var hx = pts[0], hy = pts[1]
    O(g, hx, hy, s * .14 * rr, s * .13 * rr, l); O(g, hx - s * .06 * rr, hy, s * .07 * rr, s * (.05 + .05 * ch(t)) * rr, MOUTH)
    for (i = 0; i < 6; i++) { var ta = i / 6 * TAU; Pg(g, '#e8ddc2', [hx - s * .06 * rr + Math.cos(ta - .3) * s * .07 * rr, hy + Math.sin(ta - .3) * s * .06 * rr, hx - s * .06 * rr + Math.cos(ta) * s * .02, hy + Math.sin(ta) * s * .015, hx - s * .06 * rr + Math.cos(ta + .3) * s * .07 * rr, hy + Math.sin(ta + .3) * s * .06 * rr], true) }
    O(g, hx + s * .06 * rr, hy - s * .07 * rr, s * .025, s * .03, '#e8e0a0'); O(g, hx + s * .06 * rr, hy + s * .07 * rr, s * .025, s * .03, '#e8e0a0')
    if (k.bomb) { var bx = pts[8], by = pts[9] - s * .1; O(g, bx, by, s * .09, s * .09, '#2a2430'); L(g, '#c8a050', s * .018, [bx, by - s * .08, bx + s * .05, by - s * .15]); O(g, bx + s * .05, by - s * .16 + Math.sin(t.time * 20) * s * .01, s * .03, s * .03, '#f6c85a') }
    cracks(g, s, t)
  } }
  def(Object.keys(LEECH), leech)

  var BURROW = { 'round-worm': { c: '#c79a86', k: 'pop' }, 'tainted-round-worm': { c: '#5a5560', k: 'pop', taint: true }, 'night-crawler': { c: '#3c3544', k: 'crawl' }, 'cod-worm': { c: '#b8736a', k: 'cod' }, 'needle': { c: '#b0453f', k: 'needle' }, 'prey': { c: '#c58a6e', k: 'prey' }, 'nerve-ending': { c: '#b88878', k: 'nerve' } }
  function burrow (id) { var k = BURROW[id]; return function (g, s, t) {
    var c = C(t, k.c), d = C(t, sh(k.c, -.3)), c2 = ch(t), i, up = k.k === 'pop' ? .12 * Math.abs(Math.sin(t.time * 3)) : 0
    if (k.k === 'pop') {
      // lamprey-borer: stacked trunk, head is a toothed ring mouth that faces the viewer
      O(g, 0, s * .3, s * .38, s * .12, '#2a1a16'); O(g, 0, s * .28, s * .3, s * .08, '#120a08')
      for (i = 3; i >= 0; i--) O(g, Math.sin(t.time * 4 + i) * s * .03, s * .24 - i * s * (.12 + up), s * (.17 - i * .005), s * .1, C(t, sh(k.c, -i * .04)))
      var hy2 = -s * .16 - up * s
      O(g, 0, hy2, s * .25, s * .22, C(t, sh(k.c, .06))); O(g, 0, hy2, s * .17, s * .15, '#3a1418')
      for (i = 0; i < 10; i++) { var ta = i / 10 * TAU + t.time; Pg(g, '#e8ddc2', [Math.cos(ta - .2) * s * .165, hy2 + Math.sin(ta - .2) * s * .14, Math.cos(ta) * s * .07, hy2 + Math.sin(ta) * s * .06, Math.cos(ta + .2) * s * .165, hy2 + Math.sin(ta + .2) * s * .14], true) }
      O(g, 0, hy2, s * .05, s * (.03 + .05 * c2), '#12080a')
      for (i = -1; i <= 1; i += 2) { O(g, i * s * .2, hy2 - s * .13, s * .045, s * .045, k.taint ? '#d8d860' : EW); O(g, i * s * .2, hy2 - s * .13, s * .02, s * .02, DARK) }
      if (k.taint) for (i = -1; i <= 1; i += 2) Pg(g, d, [i * s * .14, hy2 - s * .16, i * s * .24, hy2 - s * .3, i * s * .06, hy2 - s * .2])
    } else if (k.k === 'crawl') {
      // centipede: tall armoured plates, a pair of legs per plate, feelers
      for (i = 6; i >= 0; i--) {
        var cx = (i - 3) * s * .12 + s * .1, cy = Math.sin(t.time * 7 - i * .7) * s * .06 + s * .05, lg = Math.sin(t.time * 12 + i * 1.3) * s * .04
        L(g, d, s * .03, [cx, cy - s * .04, cx + lg * .5, cy - s * .2, cx + lg, cy - s * .25]); L(g, d, s * .03, [cx, cy + s * .04, cx - lg * .5, cy + s * .2, cx - lg, cy + s * .25])
        O(g, cx, cy, s * .075, s * .13, C(t, sh(k.c, i % 2 ? -.12 : 0)))
      }
      var hx2 = -s * .4, hy3 = Math.sin(t.time * 7 + .7) * s * .06 + s * .05
      L(g, d, s * .02, [hx2 - s * .04, hy3 - s * .06, hx2 - s * .14, hy3 - s * .2]); L(g, d, s * .02, [hx2 - s * .04, hy3 + s * .06, hx2 - s * .14, hy3 + s * .2])
      O(g, hx2, hy3, s * .1, s * .12, C(t, sh(k.c, .1))); eye(g, hx2 - s * .02, hy3 - s * .05, s * .035, '#e8d34a'); eye(g, hx2 - s * .02, hy3 + s * .05, s * .035, '#e8d34a')
    } else if (k.k === 'cod') {
      L(g, d, s * .18, [s * .2, s * .1, s * .02, s * .02 + Math.sin(t.time * 6) * s * .04, -s * .22, s * .1]); L(g, c, s * .13, [s * .2, s * .1, s * .02, s * .02 + Math.sin(t.time * 6) * s * .04, -s * .22, s * .1])
      Pg(g, d, [s * .3, s * .1, s * .46, -s * .06, s * .44, s * .26]); O(g, -s * .26, s * .1, s * .14, s * .13, C(t, sh(k.c, .08))); eye(g, -s * .3, s * .04, s * .04, EW); mouth(g, s, -s * .34, s * .14, .05, .02 + .06 * c2); Pg(g, d, [-s * .06, -s * .06, s * .0, -s * .2, s * .08, -s * .04])
    } else if (k.k === 'needle') {
      for (i = 0; i < 3; i++) { var a = -1.1 + i * 1.1 + Math.sin(t.time * 5) * .05; Pg(g, '#cfc7b6', [Math.cos(a) * s * .18, -Math.abs(Math.sin(a)) * s * .06 + s * .05 - s * .05, Math.cos(a) * s * .46, -s * .3 - Math.sin(a) * s * .1, Math.cos(a) * s * .24 + s * .04, s * .0]) }
      O(g, 0, s * .1, s * .26, s * .24, c); for (i = -2; i <= 2; i++) Pg(g, '#dcd4c0', [i * s * .1, s * .02, i * s * .1 + s * .03, -s * .14, i * s * .1 - s * .03, s * .02]); eye(g, -s * .08, s * .1, s * .045, '#e8d070'); eye(g, s * .08, s * .1, s * .045, '#e8d070'); mouth(g, s, 0, s * .22, .08, .02 + .05 * c2)
    } else if (k.k === 'prey') {
      O(g, 0, s * .28, s * .3, s * .1, '#2a1a16'); for (i = 2; i >= 0; i--) O(g, 0, s * (.2 - i * .16), s * (.16 - i * .01), s * .1, C(t, sh(k.c, -i * .05)))
      O(g, 0, -s * .2, s * .24, s * .22, C(t, sh(k.c, .05))); eye(g, -s * .09, -s * .24, s * .06, EW); eye(g, s * .09, -s * .24, s * .06, EW); L(g, '#3a1a14', s * .03, [-s * .16, -s * .34, -s * .04, -s * .28]); L(g, '#3a1a14', s * .03, [s * .16, -s * .34, s * .04, -s * .28])
      mouth(g, s, 0, -s * .1, .12, .05 + .1 * c2); teeth(g, s, 0, -s * .14, 5, .045, .05); teeth(g, s, 0, -s * .05, 4, -.045, -.04)
    } else {
      var sw2 = Math.sin(t.time * 3) * s * .06
      L(g, d, s * .07, [0, s * .4, sw2, s * .1, -sw2, -s * .12, sw2 * .5, -s * .28]); L(g, c, s * .045, [0, s * .4, sw2, s * .1, -sw2, -s * .12, sw2 * .5, -s * .28])
      for (i = -1; i <= 1; i += 2) L(g, d, s * .03, [sw2 * .5, -s * .28, sw2 * .5 + i * s * .12, -s * .36])
      O(g, sw2 * .5, -s * .3, s * .12, s * .12, C(t, sh(k.c, .1))); pupilEye(g, s, sw2 * .5, -s * .3, s * .07, t); O(g, 0, s * .4, s * .16, s * .04, '#2a1a16')
    }
    cracks(g, s, t)
  } }
  def(Object.keys(BURROW), burrow)

  // --- maws and hosts -------------------------------------------------------
  var MAWS = { 'maw': { c: '#c87e78' }, 'blue-maw': { c: '#6e8ea4' }, 'black-maw': { c: '#3a343c', glow: true }, 'gaping-maw': { c: '#b07670', big: true }, 'psychic-maw': { c: '#9a7ab0', aura: true }, 'mr-maw': { c: '#d0a89a', tail: true } }
  function mawFam (id) { var k = MAWS[id]; return function (g, s, t) {
    // pit-flower: a ring of leaf-spikes round a round bulb whose wide jaw gapes open
    var c = C(t, k.c), d = C(t, sh(k.c, -.3)), c2 = ch(t), bb = Math.sin(t.time * 5) * s * .025, open = (k.big ? .2 : .14) + .12 * c2 + Math.abs(Math.sin(t.time * 3)) * .03, i
    if (k.aura) O(g, 0, 0, s * .46, s * .42, 'rgba(170,130,220,' + (.18 + .1 * Math.sin(t.time * 6)) + ')')
    if (k.tail) for (i = 3; i >= 1; i--) O(g, Math.sin(t.time * 5 - i) * s * .05, s * (.2 + i * .1), s * (.12 - i * .02), s * .08, C(t, sh(k.c, -i * .06)))
    var w = k.big ? .4 : .34, np = k.big ? 9 : 7
    for (i = 0; i < np; i++) { var a = i / np * TAU + Math.sin(t.time * 2 + i) * .05, r0 = s * .3, r1 = s * (k.big ? .5 : .46); Pg(g, d, [Math.cos(a - .3) * r0, Math.sin(a - .3) * r0 * .92 + bb, Math.cos(a) * r1, Math.sin(a) * r1 * .92 + bb, Math.cos(a + .3) * r0, Math.sin(a + .3) * r0 * .92 + bb]) }
    O(g, 0, bb, s * w, s * (k.big ? .34 : .31), c)
    O(g, 0, s * .04 + bb, s * w * .82, s * open + s * .05, '#1c070a'); O(g, 0, s * (.04 + open * .55) + bb, s * .15, s * .05 + s * .04 * c2, '#a8404a')
    teeth(g, s, 0, s * (.04 - open - .05) + bb, 7, .09, .08, '#e6dac0'); teeth(g, s, 0, s * (.04 + open + .05) + bb, 6, -.09, -.07, '#e6dac0')
    L(g, d, s * .035, [-s * w * .8, s * .04 + bb, -s * w * .86, s * .04 - open * s * .5 + bb]); L(g, d, s * .035, [s * w * .8, s * .04 + bb, s * w * .86, s * .04 - open * s * .5 + bb])
    for (i = -1; i <= 1; i += 2) { L(g, d, s * .03, [i * s * .1, -s * .2 + bb, i * s * .13, -s * .3 + bb]); eye(g, i * s * .13, -s * .31 + bb, s * .05, k.glow ? '#e8503a' : EW, k.glow ? '#1a0808' : DARK) }
    cracks(g, s, t)
  } }
  def(Object.keys(MAWS), mawFam)

  var HOSTS = { 'host': '#c99a8a', 'red-host': '#a8403f' }
  function hostFam (id) { var col = HOSTS[id], red = id === 'red-host'; return function (g, s, t) {
    // clam: scalloped upper shell lifts to show a pearl-eye on a tongue
    var cyc = (Math.sin(t.time * 1.4) + 1) / 2, open = Math.max(cyc > .55 ? 1 : 0, ch(t)), lift = open ? s * .17 : 0, i
    O(g, 0, s * .26, s * .4, s * .1, 'rgba(0,0,0,.25)')
    O(g, 0, s * .12, s * .4, s * .26, C(t, sh(col, -.2)))
    if (open) {
      O(g, 0, s * .1, s * .32, s * .17, '#5a1a2a'); L(g, '#c8606e', s * .06, [-s * .14, s * .2, 0, s * .12, s * .14, s * .2])
      O(g, 0, s * .06, s * .13, s * .12, C(t, '#e8e0c8')); O(g, 0, s * .07, s * .06, s * .07, red ? '#c02a2a' : '#3a5a8a'); O(g, 0, s * .07, s * .028, s * .045, DARK)
      teeth(g, s, 0, s * .17, 7, .08, .05, '#efe6d2')
    }
    g.save(); g.translate(0, -lift)
    O(g, 0, -s * .02, s * .4, s * .3, C(t, col))
    for (i = -3; i <= 3; i++) { L(g, sh(col, -.4), s * .018, [i * s * .04, s * .22, i * s * .1, s * .06, i * s * .13, -s * .2]); O(g, i * s * .12 + (i === 0 ? 0 : 0), s * .27 - Math.abs(i) * s * .015, s * .05, s * .04, C(t, sh(col, -.08))) }
    if (red) for (i = -2; i <= 2; i++) Pg(g, C(t, '#e0b08a'), [i * s * .13 - s * .04, -s * .22 + Math.abs(i) * s * .03, i * s * .13, -s * .36 + Math.abs(i) * s * .04, i * s * .13 + s * .04, -s * .22 + Math.abs(i) * s * .03])
    O(g, 0, -s * .26, s * .1, s * .04, sh(col, .18))
    g.restore(); cracks(g, s, t)
  } }
  def(Object.keys(HOSTS), hostFam)

  // --- skeletons, bats and winged things ------------------------------------
  var BONES = { 'black-bony': { c: '#4a4650', eye: '#c84040' }, 'revenant': { c: '#cfc3a6', eye: '#e86a3a', flame: true, fly: true }, 'spiked-revenant': { c: '#bcb09a', eye: '#e86a3a', flame: true, fly: true, spikes: true }, 'holy-bony': { c: '#f0ead2', eye: '#e8c850', halo: true }, 'cursed-deaths-head': { c: '#5a4a6a', eye: '#d8a0f0', skullOnly: true, flame: true } }
  function bony (id) { var k = BONES[id]; return function (g, s, t) {
    // relic-skull: a floating skull with a loose jaw, circled by orbiting bone shards
    var c = C(t, k.c), d = C(t, sh(k.c, -.3)), c2 = ch(t), b = Math.sin(t.time * 3) * s * .03, i
    var ns = k.spikes ? 4 : 3, rot = t.time * (k.fly ? 2.4 : 1.6), hy = (k.skullOnly ? .0 : -.02) * s + b, sr = s * (k.skullOnly ? .3 : .27)
    function shard (j) {
      var a = rot + j * TAU / ns, x = Math.cos(a) * s * .38, y = hy + Math.sin(a) * s * .3 + s * .1, ta = a + 1.3, dx = Math.cos(ta) * s * .09, dy = Math.sin(ta) * s * .09
      L(g, c, s * .045, [x - dx, y - dy, x + dx, y + dy]); O(g, x - dx, y - dy, s * .04, s * .04, c); O(g, x + dx, y + dy, s * .04, s * .04, c)
      if (k.spikes) Pg(g, d, [x - s * .03, y - s * .05, x, y - s * .15, x + s * .03, y - s * .05])
    }
    for (i = 0; i < ns; i++) if (Math.sin(rot + i * TAU / ns) < 0) shard(i)
    if (k.flame) { O(g, 0, hy - sr * 1.2, s * .1, s * (.11 + .03 * Math.sin(t.time * 13)), k.skullOnly ? '#9a4ad0' : '#e9822c'); O(g, 0, hy - sr * 1.1, s * .05, s * .07, k.skullOnly ? '#e0b0f8' : '#fbe08a') }
    if (k.halo) { g.strokeStyle = '#f2d66a'; g.lineWidth = s * .03; g.beginPath(); g.ellipse(0, hy - sr * 1.15, s * .17, s * .05, 0, 0, TAU); g.stroke() }
    O(g, 0, hy + sr * .78 + c2 * s * .05, sr * .55, s * (.07 + .06 * c2), d)
    teeth(g, s, 0, hy + sr * .62, 6, .05, .06, '#e6dac0')
    O(g, 0, hy, sr, sr * .92, c)
    O(g, -s * .1, hy - s * .02, s * .08, s * .1, '#1e171a'); O(g, s * .1, hy - s * .02, s * .08, s * .1, '#1e171a'); O(g, -s * .1, hy - s * .01, s * .03, s * .04, k.eye); O(g, s * .1, hy - s * .01, s * .03, s * .04, k.eye)
    Pg(g, '#1e171a', [0, hy + s * .06, -s * .035, hy + s * .13, s * .035, hy + s * .13], true); L(g, d, s * .018, [s * .12, hy - sr * .8, s * .06, hy - sr * .45, s * .1, hy - sr * .2])
    for (i = 0; i < ns; i++) if (Math.sin(rot + i * TAU / ns) >= 0) shard(i)
    cracks(g, s, t)
  } }
  def(Object.keys(BONES), bony)

  var WING = {
    'sucker': { c: '#b8504c', k: 'sucker' }, 'blue-sucker': { c: '#5f86a8', k: 'sucker' }, 'soul-sucker': { c: '#e4e0f0', k: 'sucker', ghost: true },
    'eternal-heart-fly': { c: '#d8d4e0', k: 'heartfly' }, 'fat-bat': { c: '#6a5a70', k: 'bat', fat: true }, 'hanger': { c: '#7a2a3a', k: 'hanger' },
    'one-tooth': { c: '#8a7a68', k: 'tooth' }, 'red-floater': { c: '#c04a40', k: 'floater' }, 'brimstone-head': { c: '#3a2a30', k: 'brim' },
    'angelic-baby': { c: '#efe2d2', k: 'cherub' }, 'willo': { c: '#e8708a', k: 'wisp' }, 'lil-haunt': { c: '#a8a8c0', k: 'haunt' }
  }
  function winged (id) { var k = WING[id]; return function (g, s, t) {
    var c = C(t, k.c), d = C(t, sh(k.c, -.3)), l = C(t, sh(k.c, .14)), c2 = ch(t), bob = Math.sin(t.time * 5 + id.length) * s * .03, i, sd
    g.save(); g.translate(0, bob)
    if (k.k === 'sucker') {
      // mosquito: slim striped body, needle proboscis, big compound eyes, long veined wings
      var fw = Math.sin(t.time * 28) * s * .05
      for (sd = -1; sd <= 1; sd += 2) { g.save(); g.translate(sd * s * .08, -s * .02); g.rotate(sd * (.9 + fw / s * 2)); O(g, 0, -s * .24, s * .06, s * .27, k.ghost ? 'rgba(220,225,245,.55)' : 'rgba(205,225,220,.55)'); g.restore() }
      for (sd = -1; sd <= 1; sd += 2) { L(g, d, s * .025, [sd * s * .07, s * .08, sd * s * .22, s * .16, sd * s * .26, s * .3]); L(g, d, s * .025, [sd * s * .07, s * .02, sd * s * .27, s * .06, sd * s * .34, s * .2]) }
      O(g, 0, s * .22, s * .09, s * .2, c); for (i = 0; i < 3; i++) L(g, d, s * .022, [-s * .08, s * (.12 + i * .08), s * .08, s * (.12 + i * .08)])
      O(g, 0, -s * .02, s * .13, s * .14, l)
      O(g, 0, -s * .17, s * .12, s * .1, c); eye(g, -s * .08, -s * .2, s * .06, k.ghost ? '#7a7ab0' : '#c83a3a', '#2a0a0a'); eye(g, s * .08, -s * .2, s * .06, k.ghost ? '#7a7ab0' : '#c83a3a', '#2a0a0a')
      Pg(g, '#2a1a1a', [-s * .025, -s * .24, s * .025, -s * .24, 0, -s * (.4 + .06 * c2)])
    } else if (k.k === 'heartfly') {
      // dust-moth: broad scaled wings with a heart mark, furry body, feathery feelers
      var fw2 = Math.sin(t.time * 18) * s * .05
      for (sd = -1; sd <= 1; sd += 2) {
        Pg(g, 'rgba(235,232,245,.92)', [sd * s * .08, -s * .06, sd * s * .3, -s * .26 + fw2, sd * s * .48, -s * .12 + fw2, sd * s * .44, s * .12 + fw2 * .5, sd * s * .24, s * .24, sd * s * .08, s * .1])
        Pg(g, C(t, '#e8a0b8'), [sd * s * .3, s * .02, sd * s * .22, -s * .08, sd * s * .27, -s * .13, sd * s * .33, -s * .08, sd * s * .38, -s * .13, sd * s * .43, -s * .06, sd * s * .36, s * .06], true)
        L(g, d, s * .018, [sd * s * .05, -s * .26, sd * s * .1, -s * .38, sd * s * .18, -s * .4])
      }
      O(g, 0, s * .06, s * .11, s * .22, d); O(g, 0, -s * .12, s * .11, s * .1, C(t, '#f0e8f8')); eye(g, -s * .05, -s * .14, s * .035, '#2a1a24', '#d83a4a'); eye(g, s * .05, -s * .14, s * .035, '#2a1a24', '#d83a4a')
    } else if (k.k === 'bat' || k.k === 'hanger') {
      var fl = Math.sin(t.time * 12) * s * .12, big = k.fat ? 1.15 : 1
      for (sd = -1; sd <= 1; sd += 2) { Pg(g, d, [sd * s * .12, -s * .06, sd * s * .48, -s * .2 - fl, sd * s * .5, s * .02 - fl * .6, sd * s * .34, s * .1 - fl * .4, sd * s * .26, s * .0 - fl * .3, sd * s * .16, s * .12]) }
      O(g, 0, s * .06, s * .2 * big, s * .22 * big, c); O(g, 0, -s * .12, s * .16, s * .14, l)
      Pg(g, c, [-s * .12, -s * .2, -s * .08, -s * .34, -s * .02, -s * .22]); Pg(g, c, [s * .12, -s * .2, s * .08, -s * .34, s * .02, -s * .22])
      eye(g, -s * .06, -s * .13, s * .04, '#f0c840'); eye(g, s * .06, -s * .13, s * .04, '#f0c840'); mouth(g, s, 0, -s * .04, .05, .02 + .05 * c2); teeth(g, s, 0, -s * .05, 2, .05, .05)
      if (k.k === 'hanger') L(g, '#cfc7b6', s * .02, [0, s * .28, 0, s * .42])
    } else if (k.k === 'tooth') {
      // flying jaw: wide upper jaw with one huge fang and a single stalked eye
      wings(g, s, t, s * .27, -s * .05, 'rgba(205,215,205,.55)', 30)
      O(g, 0, s * .06, s * .3, s * .2, c); O(g, 0, s * .0, s * .24, s * .12, l); O(g, 0, s * .14, s * .22, s * .06, '#3a1418')
      for (sd = -1; sd <= 1; sd += 2) Pg(g, '#e6dac0', [sd * s * .1, s * .1, sd * s * .16, s * .1, sd * s * .13, s * .2], true)
      Pg(g, '#f3ecd6', [-s * .06, s * .1, s * .06, s * .1, s * .04, s * (.3 + .03 * c2), -s * .04, s * (.3 + .03 * c2)])
      L(g, d, s * .03, [0, -s * .04, 0, -s * .16]); eye(g, 0, -s * .2, s * .07, EW, '#7a1a1a')
    } else if (k.k === 'floater') {
      // puffer: spiked balloon with fins and a pouting mouth
      for (i = 0; i < 9; i++) { var a = i / 9 * TAU + t.time * .6; Pg(g, d, [Math.cos(a - .2) * s * .28, Math.sin(a - .2) * s * .26, Math.cos(a) * s * .42, Math.sin(a) * s * .4, Math.cos(a + .2) * s * .28, Math.sin(a + .2) * s * .26]) }
      O(g, 0, s * .0, s * .32 + c2 * s * .03, s * .3 + c2 * s * .03, c); O(g, 0, s * .12, s * .22, s * .14, l)
      eye(g, -s * .13, -s * .06, s * .08, '#f0d050', '#2a0a0a'); eye(g, s * .13, -s * .06, s * .08, '#f0d050', '#2a0a0a'); L(g, '#2a0a0a', s * .035, [-s * .22, -s * .16, -s * .06, -s * .12]); L(g, '#2a0a0a', s * .035, [s * .22, -s * .16, s * .06, -s * .12])
      mouth(g, s, 0, s * .16, .07, .04 + .08 * c2)
    } else if (k.k === 'brim') {
      O(g, 0, s * .0, s * .34, s * .32, C(t, '#d0c0a8')); O(g, 0, s * .0, s * .3, s * .28, c); O(g, 0, s * .02, s * .2 + c2 * s * .1, s * .14 + c2 * s * .1, 'rgba(240,70,50,' + (.5 + c2 * .4) + ')'); O(g, 0, s * .02, s * .1, s * .08, '#fbd86a')
      for (i = -1; i <= 1; i += 2) { Pg(g, '#d0c0a8', [i * s * .18, -s * .22, i * s * .3, -s * .42, i * s * .1, -s * .28]); eye(g, i * s * .15, -s * .1, s * .045, '#e8503a') }
    } else if (k.k === 'cherub') {
      // wheel-angel: a ring of feathered blades round one great eye, halo above
      var rot2 = t.time * .8
      for (i = 0; i < 8; i++) { var a3 = rot2 + i / 8 * TAU, bx = Math.cos(a3), by = Math.sin(a3); Pg(g, C(t, i % 2 ? '#f6f2ea' : '#e2d6c4'), [bx * s * .2 - by * s * .07, by * s * .2 + bx * s * .07, bx * s * .46, by * s * .46, bx * s * .2 + by * s * .07, by * s * .2 - bx * s * .07]) }
      O(g, 0, 0, s * .24, s * .24, c); O(g, 0, 0, s * .17, s * .17, EW)
      var lk3 = Math.sin(t.time * 1.4) * s * .03; O(g, lk3, 0, s * .1, s * .1, '#6aa0d0'); O(g, lk3, 0, s * .05, s * .05, DARK); O(g, lk3 - s * .03, -s * .04, s * .02, s * .02, '#fff')
      g.strokeStyle = '#f2d66a'; g.lineWidth = s * .035; g.beginPath(); g.ellipse(0, -s * .42, s * .15, s * .04, 0, 0, TAU); g.stroke()
      if (c2 > .05) O(g, 0, s * .14, s * .06, s * (.01 + .04 * c2), MOUTH)
    } else if (k.k === 'wisp') {
      // lantern spirit: a flame caged in a glass lantern with a ring handle
      var fl2 = Math.sin(t.time * 10) * s * .03
      O(g, 0, s * .0, s * .36, s * .36, 'rgba(255,120,150,.2)')
      g.strokeStyle = sh('#7a6a60', -.5); g.lineWidth = s * .04; g.beginPath(); g.arc(0, -s * .3, s * .08, Math.PI, 0); g.stroke()
      Pg(g, C(t, '#6a5a50'), [-s * .13, -s * .26, s * .13, -s * .26, s * .2, -s * .18, -s * .2, -s * .18])
      O(g, 0, s * .03, s * .22, s * .24, C(t, '#c8dce4'))
      Pg(g, C(t, '#e8708a'), [-s * .13, s * .12, -s * .1, -s * .06, -s * .02, -s * .16 + fl2, 0, -s * .06, s * .07, -s * .24 - fl2, s * .12, -s * .04, s * .13, s * .12], true); O(g, 0, s * .08, s * .09, s * .08, C(t, '#fff0d8'))
      O(g, -s * .04, s * .06, s * .018, s * .03, DARK); O(g, s * .04, s * .06, s * .018, s * .03, DARK)
      Pg(g, C(t, '#6a5a50'), [-s * .18, s * .22, s * .18, s * .22, s * .12, s * .32, -s * .12, s * .32])
    } else {
      // jelly-ghost: translucent dome with dangling tendrils
      var gc = t.hurt ? '#f6f0e4' : k.c
      for (i = -2; i <= 2; i++) { L(g, IS.alpha ? IS.alpha(gc, .75) : gc, s * .045, [i * s * .1, s * .1, i * s * .1 + Math.sin(t.time * 4 + i) * s * .05, s * .24, i * s * .1 - Math.sin(t.time * 4 + i) * s * .04, s * (.34 + Math.abs(i) * .02)]) }
      g.beginPath(); g.moveTo(-s * .3, s * .14); g.quadraticCurveTo(-s * .36, -s * .34, 0, -s * .34); g.quadraticCurveTo(s * .36, -s * .34, s * .3, s * .14); g.quadraticCurveTo(0, s * .22, -s * .3, s * .14); g.closePath()
      g.save(); g.globalAlpha = .82; FO(g, gc, -s * .34, s * .2); g.restore()
      eye(g, -s * .1, -s * .08, s * .055, '#f4f0e0', '#3a3a5a'); eye(g, s * .1, -s * .08, s * .055, '#f4f0e0', '#3a3a5a'); mouth(g, s, 0, s * .06, .06, .02 + .05 * c2)
    }
    g.restore(); cracks(g, s, t)
  } }
  def(Object.keys(WING), winged)

  // --- grimaces and stone faces ---------------------------------------------
  var GRIM = { 'grimace': { c: '#8a8690' }, 'stone-grimace': { c: '#6a6872', rune: true }, 'vomit-grimace': { c: '#7a8a6a', vomit: true }, 'quake-grimace': { c: '#9a6a5a', quake: true }, 'stone-eye': { c: '#7c7884', one: true } }
  function grimace (id) { var k = GRIM[id]; return function (g, s, t) {
    // carved idol: a chipped octagonal stone disc with a bowl mouth and gem eyes
    var c = C(t, k.c), d = C(t, sh(k.c, -.32)), l = C(t, sh(k.c, .12)), c2 = ch(t), shake = k.quake ? Math.sin(t.time * 40) * s * .012 * (.4 + c2) : 0, i, oc = []
    for (i = 0; i < 8; i++) { var a = i / 8 * TAU + TAU / 16; oc.push(Math.cos(a) * s * .44, Math.sin(a) * s * .44) }
    g.save(); g.translate(shake, 0)
    Pg(g, d, oc.map(function (v, j) { return j % 2 ? v + s * .04 : v })); Pg(g, c, oc)
    g.beginPath(); g.arc(0, 0, s * .34, 0, TAU); g.lineWidth = s * .025; g.strokeStyle = sh(k.c, -.5); g.stroke()
    L(g, d, s * .018, [-s * .36, -s * .12, -s * .28, -s * .02]); L(g, d, s * .018, [s * .36, s * .16, s * .26, s * .24])
    if (k.one) {
      O(g, 0, -s * .04, s * .22, s * .17, '#d6d0c4'); var lk = Math.sin(t.time * 1.2) * s * .06; O(g, lk, -s * .04, s * .1, s * .1, '#c04a40'); O(g, lk, -s * .04, s * .05, s * .06, DARK)
      Pg(g, d, [-s * .24, -s * .06, 0, -s * .24, s * .24, -s * .06, s * .24, -s * .12, 0, -s * .3, -s * .24, -s * .12]); L(g, d, s * .035, [-s * .3, s * .22, s * .3, s * .22])
    } else {
      O(g, 0, -s * .24, s * .045, s * .06, k.quake ? '#f08a3a' : '#7ad0b8')
      for (i = -1; i <= 1; i += 2) { Pg(g, '#1a1416', [i * s * .3, -s * .16, i * s * .1, -s * .08, i * s * .26, -s * .02]); O(g, i * s * .2, -s * .09, s * .03, s * .03, k.quake ? '#f08a3a' : '#e8d070') }
      var op = .08 + .1 * c2 + Math.abs(Math.sin(t.time * 2)) * .02
      O(g, 0, s * .16, s * .2, s * (op + .03), '#140a0c'); teeth(g, s, 0, s * (.16 - op - .02), 5, .08, .05, '#cfc9b8')
      if (k.vomit) { O(g, 0, s * (.26 + .06 * c2), s * .06, s * (.04 + .05 * c2), '#8aa84a'); O(g, s * .1, s * (.34 + (t.time * 2 % 1) * .06), s * .025, s * .035, '#8aa84a') }
      if (k.rune) { L(g, '#4a4854', s * .02, [-s * .24, s * .3, -s * .16, s * .26, -s * .08, s * .3]); L(g, '#4a4854', s * .02, [s * .24, s * .3, s * .16, s * .26, s * .08, s * .3]) }
      if (k.quake) { L(g, '#3a1a14', s * .03, [-s * .1, -s * .34, -s * .16, -s * .18, -s * .06, -s * .12]); L(g, '#f08a3a', s * .01, [-s * .1, -s * .34, -s * .16, -s * .18, -s * .06, -s * .12]) }
    }
    g.restore(); cracks(g, s, t)
  } }
  def(Object.keys(GRIM), grimace)

  // --- small humanoids and cultists -----------------------------------------
  // A shared walking body (legs, torso, arms, head) with per-id dress.
  var KIDS = {
    'baby': { skin: '#e9d2bc', body: '#e9d2bc', eyes: 'big' }, 'evil-twin': { skin: '#6a5a66', body: '#4a3f4c', eyes: 'red', tears: '#2a1a24', hair: '#2a1e1e' },
    'begotten': { skin: '#a9988e', body: '#7a5c54', eyes: 'none', headless: true }, 'ragling': { skin: '#a4604a', body: '#6a3a30', eyes: 'dots', rag: true },
    'homunculus': { skin: '#d4a8a0', body: '#d4a8a0', eyes: 'big', cord: true }, 'faceless': { skin: '#c7766e', body: '#b4605a', eyes: 'none', raw: true },
    'flesh-maiden': { skin: '#d4a090', body: '#b4706a', eyes: 'sew', stitch: true }, 'ministro': { skin: '#8a8690', body: '#4a4650', eyes: 'dots', hood: true },
    'vassal': { skin: '#9a9aa8', body: '#58586a', eyes: 'dots', hood: true, glow: true }, 'null': { skin: '#1c1a22', body: '#14121a', eyes: 'void', blank: true },
    'whipper': { skin: '#a8908a', body: '#5a4a50', eyes: 'dots', whip: true }, 'bishop': { skin: '#d0c4b0', body: '#8a2a3a', eyes: 'dots', mitre: true },
    'reaper': { skin: '#e2dcc8', body: '#2a2630', eyes: 'void', hood: true, scythe: true }, 'ball-and-chain': { skin: '#c09a88', body: '#6a5a58', eyes: 'dots', ball: true },
    'fred': { skin: '#c4a090', body: '#5a4a5a', eyes: 'dots', fin: true }, 'camillo-jr': { skin: '#d4b89c', body: '#8a6a4a', eyes: 'cyclops', small: true },
    'camillo': { skin: '#d4b89c', body: '#8a6a4a', eyes: 'cyclops', horns: true }, 'mask': { skin: '#e8dcc4', body: '#8a2a30', eyes: 'mask' },
    'grudge': { skin: '#7a2a2c', body: '#4a1a1c', eyes: 'angry', flame: true }, 'poison-mind': { skin: '#9ab870', body: '#6a8a50', eyes: 'dots', fume: true }
  }
  function kid (id) { var k = KIDS[id]; return function (g, s, t) {
    var step = Math.sin(t.time * 10), b = Math.abs(step) * s * .02, sk = C(t, k.skin), bd = C(t, k.body), dk = C(t, sh(k.body, -.35)), c2 = ch(t), i
    var sc = k.small ? .85 : 1, hy = (k.headless ? -s * .24 : -s * .2) - b, hr = k.small ? .26 : .3
    if (k.scythe) { L(g, '#6a5a44', s * .03, [s * .34, -s * .36, s * .3, s * .36]); Pg(g, '#cfd4d8', [s * .34, -s * .38, s * .06, -s * .36, s * .0, -s * .26, s * .3, -s * .3]) }
    if (k.hood) { Pg(g, dk, [-s * .26, s * .4, -s * .3, s * .0, 0, -s * .46, s * .3, s * .0, s * .26, s * .4]) }
    else { L(g, dk, s * .08, [-s * .08, s * .22, -s * .1 + step * s * .04, s * .42]); L(g, dk, s * .08, [s * .08, s * .22, s * .1 - step * s * .04, s * .42]) }
    var tw = s * .2 * sc + (k.hood ? s * .04 : 0)
    Pg(g, bd, [-tw, s * .0 - b, -tw * .45, -s * .07 - b, tw * .45, -s * .07 - b, tw, s * .0 - b, tw * .72, s * .32 - b, -tw * .72, s * .32 - b]); L(g, dk, s * .03, [-tw * .7, s * .22 - b, tw * .7, s * .22 - b])
    if (k.stitch) { L(g, '#4a2a2a', s * .015, [-s * .1, s * .02, s * .1, s * .2]); L(g, '#4a2a2a', s * .015, [s * .1, s * .02, -s * .1, s * .2]) }
    if (k.cord) L(g, '#c88a8a', s * .035, [0, s * .28, s * .1, s * .4, s * .0, s * .46])
    if (k.raw) { O(g, -s * .06, s * .1, s * .05, s * .04, '#e8a0a0'); O(g, s * .08, s * .2, s * .04, s * .04, '#8a2a30') }
    if (k.ball) { L(g, '#6a6a70', s * .025, [s * .2, s * .1, s * .34, s * .28, s * .38 + Math.sin(t.time * 5) * s * .02, s * .38]); O(g, s * .38, s * .36, s * .1, s * .1, '#4a4a54'); O(g, s * .35, s * .33, s * .03, s * .03, '#8a8a94') }
    if (k.whip) L(g, '#8a3a2a', s * .025, [s * .2, s * .06, s * .36 + Math.sin(t.time * 12) * s * .06, -s * .12, s * .44, s * .12 + Math.sin(t.time * 12) * s * .1])
    if (k.fin) Pg(g, '#5a7a8a', [0, -s * .46, s * .1, -s * .3, -s * .1, -s * .3])
    var arm = k.hood ? s * .0 : 1
    if (arm) { L(g, sk, s * .06, [-s * .17, s * .02 - b, -s * .3, s * .2 + step * s * .03, -s * .28, s * .32 + step * s * .03]); L(g, sk, s * .06, [s * .17, s * .02 - b, s * .3, s * .2 - step * s * .03, s * .28, s * .32 - step * s * .03]); O(g, -s * .28, s * .34 + step * s * .03, s * .055, s * .05, sk); O(g, s * .28, s * .34 - step * s * .03, s * .055, s * .05, sk) }
    if (k.headless) { O(g, 0, s * .0 - b, s * .08, s * .05, '#8a2a30'); for (i = 0; i < 3; i++) O(g, (i - 1) * s * .05, s * .05 + ((t.time * 2 + i * .3) % 1) * s * .12 - b, s * .018, s * .03, '#9a2a30'); O(g, 0, -s * .14 - b, s * .035, s * .02, '#c8605a'); L(g, '#9a9aa4', s * .025, [-s * .1, -s * .0 - b, -s * .2, s * .1, -s * .28, s * .26]) ; return }
    // head: smaller and wobbling on the shoulders
    g.save(); g.translate(0, hy + s * .05); g.rotate(Math.sin(t.time * 3 + id.length) * .07 + (k.small ? 0 : 0)); g.scale(.82, .82); g.translate(0, -hy - s * .05); S = s / .82
    O(g, 0, hy, s * hr, s * (hr * .98), sk)
    if (k.hair) { Pg(g, C(t, k.hair), [-s * hr, hy - s * .04, -s * .22, hy - s * .28, 0, hy - s * .16, s * .22, hy - s * .28, s * hr, hy - s * .04, s * .2, hy - s * .12, -s * .2, hy - s * .12]) }
    if (k.hat) { Pg(g, C(t, k.hat), [-s * .24, hy - s * .18, -s * .12, hy - s * .46, s * .12, hy - s * .46, s * .24, hy - s * .18]); L(g, sh(k.hat, -.3), s * .03, [-s * .26, hy - s * .18, s * .26, hy - s * .18]) }
    if (k.mitre) { Pg(g, C(t, '#d8b84a'), [-s * .18, hy - s * .2, 0, hy - s * .5, s * .18, hy - s * .2]); L(g, '#8a2a3a', s * .03, [0, hy - s * .46, 0, hy - s * .24]) }
    if (k.halo) { g.strokeStyle = '#f2d66a'; g.lineWidth = s * .03; g.beginPath(); g.ellipse(0, hy - s * .38, s * .14, s * .04, 0, 0, TAU); g.stroke() }
    if (k.horns) { Pg(g, '#d8d0b8', [-s * .2, hy - s * .18, -s * .3, hy - s * .4, -s * .1, hy - s * .26]); Pg(g, '#d8d0b8', [s * .2, hy - s * .18, s * .3, hy - s * .4, s * .1, hy - s * .26]) }
    if (k.rag) { L(g, '#d8cdb0', s * .035, [-s * .28, hy - s * .02, s * .28, hy - s * .1]); L(g, '#d8cdb0', s * .035, [-s * .26, hy + s * .08, s * .26, hy + s * .02]) }
    if (k.flame) { O(g, 0, hy - s * .3, s * .12, s * (.12 + .03 * Math.sin(t.time * 12)), '#e8582a'); O(g, 0, hy - s * .28, s * .06, s * .07, '#fbd86a') }
    if (k.fume) { for (i = 0; i < 3; i++) O(g, Math.sin(t.time * 3 + i * 2) * s * .1, hy - s * .3 - ((t.time + i * .33) % 1) * s * .14, s * .05, s * .05, 'rgba(150,200,90,.55)') }
    if (k.blank) { O(g, 0, hy, s * hr, s * hr, '#1c1a22'); O(g, -s * .08, hy - s * .02, s * .09, s * .06, 'rgba(180,170,220,.5)'); O(g, s * .08, hy - s * .02, s * .09, s * .06, 'rgba(180,170,220,.5)'); mouth(g, s, 0, hy + s * .12, .09, .02 + .05 * c2, 'rgba(180,170,220,.35)') }
    else if (k.eyes === 'big') { O(g, -s * .1, hy + s * .02, s * .09, s * .11, EW); O(g, s * .1, hy + s * .02, s * .09, s * .11, EW); O(g, -s * .09, hy + s * .05, s * .05, s * .06, '#3a5a8a'); O(g, s * .09, hy + s * .05, s * .05, s * .06, '#3a5a8a'); O(g, -s * .08, hy + s * .03, s * .02, s * .02, '#fff'); O(g, s * .1, hy + s * .03, s * .02, s * .02, '#fff'); mouth(g, s, 0, hy + s * .2, .05, .02 + .05 * c2) }
    else if (k.eyes === 'red') { O(g, -s * .1, hy + s * .01, s * .07, s * .08, '#1a1012'); O(g, s * .1, hy + s * .01, s * .07, s * .08, '#1a1012'); O(g, -s * .1, hy + s * .01, s * .03, s * .04, '#e83a3a'); O(g, s * .1, hy + s * .01, s * .03, s * .04, '#e83a3a'); L(g, k.tears, s * .03, [-s * .1, hy + s * .08, -s * .12, hy + s * .22]); L(g, k.tears, s * .03, [s * .1, hy + s * .08, s * .12, hy + s * .22]); mouth(g, s, 0, hy + s * .2, .06, .02 + .05 * c2) }
    else if (k.eyes === 'x') { for (i = -1; i <= 1; i += 2) { L(g, DARK, s * .03, [i * s * .1 - s * .04, hy - s * .04, i * s * .1 + s * .04, hy + s * .05]); L(g, DARK, s * .03, [i * s * .1 + s * .04, hy - s * .04, i * s * .1 - s * .04, hy + s * .05]) } mouth(g, s, 0, hy + s * .17, .09, .03 + .06 * c2); teeth(g, s, 0, hy + s * .15, 4, .04, .045) }
    else if (k.eyes === 'cyclops') { O(g, 0, hy + s * .0, s * .14, s * .12, EW); var lk = Math.sin(t.time * 1.6) * s * .05; O(g, lk, hy, s * .07, s * .08, '#c8504a'); O(g, lk, hy, s * .035, s * .045, DARK); mouth(g, s, 0, hy + s * .15, .08, .03 + .06 * c2); Pg(g, '#f3ecd6', [-s * .03, hy + s * .13, s * .03, hy + s * .13, 0, hy + s * .22]) }
    else if (k.eyes === 'sew') { for (i = -1; i <= 1; i += 2) { L(g, DARK, s * .03, [i * s * .1 - s * .06, hy, i * s * .1 + s * .06, hy]); for (var j = 0; j < 3; j++) L(g, DARK, s * .015, [i * s * .1 - s * .04 + j * s * .04, hy - s * .035, i * s * .1 - s * .04 + j * s * .04, hy + s * .035]) } L(g, '#4a2a2a', s * .025, [-s * .08, hy + s * .16, s * .08, hy + s * .16]); mouth(g, s, 0, hy + s * .16, .06, .01 + .04 * c2) }
    else if (k.eyes === 'angry') { O(g, -s * .1, hy + s * .02, s * .06, s * .07, '#f8d86a'); O(g, s * .1, hy + s * .02, s * .06, s * .07, '#f8d86a'); L(g, '#1a0808', s * .05, [-s * .2, hy - s * .08, -s * .04, hy - s * .02]); L(g, '#1a0808', s * .05, [s * .2, hy - s * .08, s * .04, hy - s * .02]); mouth(g, s, 0, hy + s * .17, .12, .04 + .08 * c2, '#1a0808'); teeth(g, s, 0, hy + s * .14, 5, .045, .05) }
    else if (k.eyes === 'mask') { O(g, 0, hy, s * .27, s * .29, '#efe8d8'); O(g, -s * .1, hy - s * .02, s * .07, s * .05, '#2a2024'); O(g, s * .1, hy - s * .02, s * .07, s * .05, '#2a2024'); L(g, '#b04a50', s * .02, [-s * .14, hy + s * .16, s * .14, hy + s * .16]); mouth(g, s, 0, hy + s * .15, .06, .02 + .04 * c2) }
    else if (k.eyes === 'void') { O(g, -s * .09, hy + s * .0, s * .06, s * .08, k.scythe ? '#6a1a1a' : '#1a1218'); O(g, s * .09, hy + s * .0, s * .06, s * .08, k.scythe ? '#6a1a1a' : '#1a1218'); O(g, -s * .09, hy, s * .02, s * .03, '#f0e070'); O(g, s * .09, hy, s * .02, s * .03, '#f0e070') }
    else if (k.eyes === 'dots') { O(g, -s * .1, hy + s * .02, s * .04, s * .06, k.glow ? '#8ad0e8' : DARK); O(g, s * .1, hy + s * .02, s * .04, s * .06, k.glow ? '#8ad0e8' : DARK); mouth(g, s, 0, hy + s * .17, .07, .02 + .06 * c2) }
    else { mouth(g, s, 0, hy + s * .17, .1, .03 + .06 * c2); if (k.raw) { O(g, 0, hy, s * .14, s * .14, '#d08a84'); O(g, -s * .04, hy - s * .02, s * .03, s * .02, '#e8a8a4') } }
    if (k.hood) { g.fillStyle = dk; g.beginPath(); g.arc(0, hy, s * (hr + .04), Math.PI * 1.05, Math.PI * 1.95); g.fill() }
    g.restore(); S = s
    cracks(g, s, t)
  } }
  def(Object.keys(KIDS), kid)

  // --- hoppers, brains and hearts, hands, mines -----------------------------
  var ODD = { 'flaming-hopper': 'fhop', 'leaper': 'leap', 'brain': 'brain', 'heart': 'heart', 'moms-hand': 'hand', 'moms-dead-hand': 'hand', 'corn-mine': 'corn', 'mr-mine': 'bomb', 'ultra-coin': 'coin', 'pincushion': 'pin', 'double-vis': 'dvis', 'gurgling': 'gurg', 'handsome-gurgle': 'gurg' }
  function odd (id) { var k = ODD[id]; return function (g, s, t) {
    var c2 = ch(t), i, w = Math.sin(t.time * 6)
    if (k === 'fhop' || k === 'leap') {
      var col = k === 'fhop' ? '#7a3a30' : '#7e8a5a', jump = -Math.abs(Math.sin(t.time * 4)) * s * .1
      O(g, -s * .16, s * .3, s * .1, s * .07, C(t, sh(col, -.2))); O(g, s * .16, s * .3, s * .1, s * .07, C(t, sh(col, -.2))); O(g, 0, s * .1 + jump, s * .28, s * .24, C(t, col)); O(g, 0, -s * .12 + jump, s * .22, s * .18, C(t, sh(col, .08)))
      eye(g, -s * .1, -s * .2 + jump, s * .06, k === 'fhop' ? '#f0b040' : EW); eye(g, s * .1, -s * .2 + jump, s * .06, k === 'fhop' ? '#f0b040' : EW); mouth(g, s, 0, -s * .06 + jump, .14, .03 + .06 * c2); L(g, sh(col, -.3), s * .04, [-s * .24, s * .08 + jump, -s * .3, s * .24]); L(g, sh(col, -.3), s * .04, [s * .24, s * .08 + jump, s * .3, s * .24])
      if (k === 'fhop') { O(g, 0, -s * .36 + jump, s * .1, s * (.11 + .03 * Math.sin(t.time * 13)), '#e9822c'); O(g, 0, -s * .34 + jump, s * .05, s * .07, '#fbe08a'); O(g, -s * .16, -s * .3 + jump, s * .05, s * .07, '#e9822c'); O(g, s * .16, -s * .3 + jump, s * .05, s * .07, '#e9822c') }
    } else if (k === 'brain') {
      // specimen jar: a brain and a loose eye floating in murky fluid, jar on spindly legs
      var p = 1 + w * .03
      L(g, '#5a5a62', s * .03, [-s * .14, s * .3, -s * .22, s * .38, -s * .18, s * .45]); L(g, '#5a5a62', s * .03, [s * .14, s * .3, s * .22, s * .38, s * .18, s * .45]); L(g, '#5a5a62', s * .03, [0, s * .32, s * .02, s * .46])
      O(g, 0, s * .06, s * .3, s * .32, C(t, '#7ea89c')); O(g, 0, s * .1, s * .25, s * .26, C(t, '#a2cdbf'))
      O(g, 0, s * .06, s * .2 * p, s * .15 * p, C(t, '#d890a0')); for (i = 0; i < 3; i++) L(g, '#a85a6c', s * .02, [-s * .14 + i * s * .1, -s * .0, -s * .1 + i * s * .1, s * .06, -s * .14 + i * s * .1, s * .12])
      pupilEye(g, s, s * .04, s * .06, s * .06, t)
      Pg(g, C(t, '#5a5a62'), [-s * .22, -s * .24, s * .22, -s * .24, s * .16, -s * .32, -s * .16, -s * .32]); O(g, 0, -s * .33, s * .06, s * .03, '#7a7a84')
      for (i = 0; i < 3; i++) O(g, Math.sin(t.time * 3 + i * 2) * s * .1, s * .2 - ((t.time * .6 + i * .33) % 1) * s * .36, s * .02, s * .02, 'rgba(255,255,255,.55)')
    } else if (k === 'heart') {
      // raw anatomical heart: valves and arteries sprout, one slit eye in the muscle
      var hb = 1 + Math.max(0, Math.sin(t.time * 9)) * .08 + c2 * .08
      g.save(); g.scale(hb, hb)
      L(g, '#5a7a9a', s * .06, [s * .08, -s * .24, s * .16, -s * .4, s * .24, -s * .42]); L(g, '#a82a34', s * .06, [-s * .06, -s * .24, -s * .12, -s * .4, -s * .2, -s * .44])
      Pg(g, C(t, '#b8323c'), [0, s * .36, -s * .34, s * .02, -s * .32, -s * .2, -s * .16, -s * .3, 0, -s * .16, s * .16, -s * .3, s * .32, -s * .2, s * .34, s * .02]); O(g, -s * .16, -s * .14, s * .18, s * .16, C(t, '#b8323c')); O(g, s * .16, -s * .14, s * .18, s * .16, C(t, '#b8323c')); O(g, -s * .12, -s * .2, s * .05, s * .07, 'rgba(255,200,200,.35)')
      L(g, '#7a1a22', s * .02, [-s * .2, -s * .06, -s * .1, s * .08, -s * .14, s * .2]); L(g, '#7a1a22', s * .02, [s * .2, -s * .04, s * .12, s * .1, s * .16, s * .2])
      g.restore()
      O(g, 0, s * .06, s * .11, s * .08, '#e8d060'); O(g, 0, s * .06, s * .022, s * .07, DARK)

    } else if (k === 'hand') {
      var dead = id === 'moms-dead-hand', sk = dead ? '#8a9aa4' : '#e2bfa8', fl = Math.sin(t.time * 5) * s * .02
      L(g, C(t, sh(sk, -.15)), s * .18, [0, s * .46, 0, s * .2])
      for (i = -2; i <= 2; i++) { var fx = i * s * .1, fy = -s * (.26 + (2 - Math.abs(i)) * .035) + fl * (i % 2); L(g, C(t, sk), s * .08, [fx * .7, s * .06, fx, fy]); O(g, fx, fy, s * .045, s * .045, C(t, sh(sk, -.1))); O(g, fx, fy - s * .01, s * .02, s * .02, dead ? '#cfd8d8' : '#f0d8c8') }
      L(g, C(t, sk), s * .09, [-s * .2, s * .12, -s * .36, -s * .02]); O(g, 0, s * .1, s * .26, s * .2, C(t, sk)); L(g, sh(sk, -.25), s * .015, [-s * .1, s * .02, s * .0, s * .12, s * .1, s * .04]); L(g, sh(sk, -.25), s * .015, [-s * .12, s * .16, s * .08, s * .2])
      if (dead) { eye(g, 0, s * .1, s * .06, EW) } else { O(g, 0, s * .1, s * .08, s * .05, '#8a2a2a') }
    } else if (k === 'dvis') {
      var vc = '#9a8478'
      for (i = -1; i <= 1; i += 2) { L(g, C(t, sh(vc, -.3)), s * .06, [i * s * .12, s * .24, i * s * .14, s * .42]); O(g, i * s * .17, -s * .06 + w * s * .02 * i, s * .2, s * .21, C(t, vc)); O(g, i * s * .17, -s * .05 + w * s * .02 * i, s * .13, s * .14, EW); var lk2 = Math.sin(t.time * 1.4 + i) * s * .04; O(g, i * s * .17 + lk2, -s * .04 + w * s * .02 * i, s * .07, s * .08, '#b8483e'); O(g, i * s * .17 + lk2, -s * .04 + w * s * .02 * i, s * .035, s * .045, DARK) }
      O(g, 0, s * .2, s * .2, s * .14, C(t, sh(vc, -.1))); mouth(g, s, 0, s * .22, .1, .02 + .06 * c2)
    } else if (k === 'gurg') {
      var hs = id === 'handsome-gurgle', gc = hs ? '#c8946a' : '#5a9a88'
      O(g, 0, s * .3, s * .3, s * .09, C(t, sh(gc, -.3))); O(g, 0, s * .08 + w * s * .015, s * .34, s * .33, C(t, gc)); O(g, 0, s * .16, s * .24, s * .2, C(t, sh(gc, .1)))
      eye(g, -s * .12, -s * .06, s * .07, EW); eye(g, s * .12, -s * .06, s * .07, EW); mouth(g, s, 0, s * .14, .16, .06 + .1 * c2); teeth(g, s, 0, s * .1, 6, .05, .05, '#e8e0c8')
      if (hs) { L(g, '#3a2418', s * .04, [-s * .16, s * .06, -s * .06, s * .09, 0, s * .06, s * .06, s * .09, s * .16, s * .06]); L(g, '#3a2418', s * .03, [-s * .2, -s * .16, -s * .06, -s * .12]); L(g, '#3a2418', s * .03, [s * .2, -s * .16, s * .06, -s * .12]); Pg(g, '#3a2418', [-s * .2, -s * .26, 0, -s * .38, s * .2, -s * .26, 0, -s * .22]) }
      else { O(g, -s * .24, s * .18 + Math.sin(t.time * 5) * s * .02, s * .05, s * .06, C(t, sh(gc, -.2))); O(g, s * .24, s * .18 - Math.sin(t.time * 5) * s * .02, s * .05, s * .06, C(t, sh(gc, -.2))); O(g, 0, s * (.22 + (t.time * 1.5 % 1) * .1), s * .025, s * .04, '#a8d8a0') }
    } else if (k === 'corn') {
      var tw = Math.sin(t.time * 8) * s * .02; O(g, 0, s * .1, s * .26, s * .36, C(t, '#d8b83a')); for (i = 0; i < 4; i++) for (var j = 0; j < 3; j++) O(g, (j - 1) * s * .1, -s * .16 + i * s * .11, s * .04, s * .04, C(t, i % 2 ? '#f0d860' : '#c8a028'))
      Pg(g, '#6a8a3a', [-s * .26, s * .4, -s * .1, s * .1, 0, s * .4]); Pg(g, '#6a8a3a', [s * .26, s * .4, s * .1, s * .1, 0, s * .4]); eye(g, -s * .08, -s * .02 + tw, s * .05, EW); eye(g, s * .08, -s * .02 + tw, s * .05, EW); mouth(g, s, 0, s * .12, .08, .03 + .06 * c2)
      for (i = -1; i <= 1; i++) Pg(g, '#5a5a62', [i * s * .1 - s * .03, -s * .2, i * s * .1, -s * .34, i * s * .1 + s * .03, -s * .2])
    } else if (k === 'bomb') {
      // powder keg: hooped barrel with a carved scowl and a sparking fuse
      var pu = 1 + c2 * .1 + w * .015
      O(g, 0, s * .1, s * .3 * pu, s * .32 * pu, C(t, '#8a5a38')); for (i = -1; i <= 1; i += 2) L(g, '#3a3a44', s * .04, [-s * .28 * pu, s * (.1 + i * .17), s * .28 * pu, s * (.1 + i * .17)])
      L(g, '#5a3a22', s * .015, [-s * .12, s * -.18, -s * .14, s * .38]); L(g, '#5a3a22', s * .015, [s * .12, s * -.18, s * .14, s * .38])
      Pg(g, C(t, '#5a5a64'), [-s * .12, -s * .2, s * .12, -s * .2, s * .08, -s * .28, -s * .08, -s * .28]); L(g, '#c8a050', s * .02, [0, -s * .28, s * .08, -s * .4]); O(g, s * .08, -s * .42 + Math.sin(t.time * 20) * s * .01, s * .045, s * .045, '#f6c85a')
      eye(g, -s * .1, s * .02, s * .06, EW, '#a02a2a'); eye(g, s * .1, s * .02, s * .06, EW, '#a02a2a'); L(g, '#1a1a20', s * .035, [-s * .18, -s * .08, -s * .04, -s * .02]); L(g, '#1a1a20', s * .035, [s * .18, -s * .08, s * .04, -s * .02]); mouth(g, s, 0, s * .17, .1, .03 + .06 * c2); teeth(g, s, 0, s * .14, 4, .045, .05)
    } else if (k === 'coin') {
      var wd = Math.abs(Math.cos(t.time * 3)) * .3 + .06; O(g, 0, 0, s * wd * 1.4, s * .34, C(t, '#b8902a')); O(g, 0, 0, s * wd * 1.2, s * .28, C(t, '#f0d050')); if (wd > .15) { eye(g, -s * wd * .5, -s * .06, s * .045, '#7a5a10', '#1a1204'); eye(g, s * wd * .5, -s * .06, s * .045, '#7a5a10', '#1a1204'); mouth(g, s, 0, s * .12, wd * .3, .03 + .05 * c2, '#6a4a0a') } L(g, '#b8902a', s * .02, [-s * .06, -s * .24, s * .06, -s * .24])
    } else {
      O(g, 0, s * .1, s * .3, s * .26, C(t, '#b04a50')); O(g, 0, s * .06, s * .22, s * .18, C(t, '#c86068'))
      for (i = 0; i < 9; i++) { var a = i * 2.1, px = Math.cos(a) * s * .24 * (.4 + (i % 3) * .3), py = s * .06 + Math.sin(a) * s * .16 * (.4 + (i % 3) * .3); L(g, '#cfc7b6', s * .02, [px, py, px + (px > 0 ? 1 : -1) * s * .06, py - s * .22]); O(g, px + (px > 0 ? 1 : -1) * s * .06, py - s * .22, s * .025, s * .025, ['#e8d34a', '#e8503a', '#4aa0e8'][i % 3]) }
      eye(g, -s * .08, s * .1, s * .05, EW); eye(g, s * .08, s * .1, s * .05, EW); mouth(g, s, 0, s * .22, .08, .03 + .05 * c2)
    }
    cracks(g, s, t)
  } }
  def(Object.keys(ODD), odd)

  // --- the seven sins (and their super and ultra forms) ---------------------
  // Each sin keeps its own silhouette; "super" swaps to a darker palette and a
  // crown of spikes, "ultra" adds a gold crown and a glow.
  var SINS = {
    'sloth': { k: 'sloth', c: '#b8bf94' }, 'super-sloth': { k: 'sloth', c: '#6a8a6a', sup: 1 },
    'lust': { k: 'lust', c: '#e098a8' }, 'super-lust': { k: 'lust', c: '#a84a6a', sup: 1 },
    'pride': { k: 'pride', c: '#d8c4a8' }, 'super-pride': { k: 'pride', c: '#8a7a9a', sup: 1 }, 'ultra-pride': { k: 'pride', c: '#d8b84a', sup: 2 },
    'envy': { k: 'envy', c: '#8ab87a' }, 'super-envy': { k: 'envy', c: '#4a7a5a', sup: 1 },
    'wrath': { k: 'wrath', c: '#c8483a' }, 'super-wrath': { k: 'wrath', c: '#7a2430', sup: 1 },
    'gluttony': { k: 'glut', c: '#d8b4a0' }, 'super-gluttony': { k: 'glut', c: '#8a6a60', sup: 1 },
    'greed': { k: 'greed', c: '#d8b040' }, 'super-greed': { k: 'greed', c: '#a88a30', sup: 1 }
  }
  function sin (id) { var k = SINS[id]; return function (g, s, t) {
    var step = Math.sin(t.time * 6), b = Math.abs(step) * s * .02, c = C(t, k.c), d = C(t, sh(k.c, -.3)), l = C(t, sh(k.c, .12)), c2 = ch(t), sup = k.sup || 0, i, sd, kd = k.k
    if (sup === 2) { O(g, 0, 0, s * .48, s * .46, 'rgba(240,200,80,' + (.14 + .06 * Math.sin(t.time * 4)) + ')') }
    else if (sup === 1) { O(g, 0, s * .02, s * .44, s * .42, 'rgba(60,20,30,.18)') }
    if (kd === 'sloth') {
      // moss-furred hanger: huge hunched fur mound, long hooked arms, sleepy mask face
      for (sd = -1; sd <= 1; sd += 2) { L(g, d, s * .08, [sd * s * .3, s * .0, sd * s * .42, s * .2, sd * s * .34, s * .4]); for (i = -1; i <= 1; i++) Pg(g, '#e6dac0', [sd * s * .34 + i * s * .04 - s * .015, s * .38, sd * s * .34 + i * s * .05, s * .48, sd * s * .34 + i * s * .04 + s * .015, s * .38], true) }
      O(g, 0, s * .12 - b, s * .38, s * .32, c)
      for (i = 0; i < 9; i++) { var fa = Math.PI + i / 8 * Math.PI; Pg(g, d, [Math.cos(fa - .12) * s * .34, s * .12 + Math.sin(fa - .12) * s * .3, Math.cos(fa) * s * .44, s * .12 + Math.sin(fa) * s * .4, Math.cos(fa + .12) * s * .34, s * .12 + Math.sin(fa + .12) * s * .3]) }
      O(g, 0, s * .2 - b, s * .26, s * .14, l)
      O(g, 0, -s * .14 - b, s * .2, s * .17, C(t, '#d8cfb0'))
      for (sd = -1; sd <= 1; sd += 2) { O(g, sd * s * .09, -s * .15 - b, s * .08, s * .06, d, sd * .5); O(g, sd * s * .09, -s * .14 - b, s * .035, s * (.015 + .03 * Math.max(0, Math.sin(t.time * .9))), EW) }
      O(g, 0, -s * .04 - b, s * .035, s * (.02 + .05 * c2), '#3a1a1a'); O(g, 0, -s * .08 - b, s * .025, s * .02, d)
    } else if (kd === 'lust') {
      // orchid-mantis: a collar of petals round a heart-eyed face on a slim body with folded foreclaws
      O(g, 0, s * .22 - b, s * .13, s * .24, d)
      for (sd = -1; sd <= 1; sd += 2) { L(g, d, s * .045, [sd * s * .1, s * .06 - b, sd * s * .28, s * .1, sd * s * .24, s * .3]); L(g, d, s * .03, [sd * s * .24, s * .3, sd * s * .16, s * .18]) }
      L(g, d, s * .03, [s * .06, s * .4, s * .26, s * .4 + Math.sin(t.time * 4) * s * .04, s * .34, s * .26])
      for (i = 0; i < 9; i++) { var pa = i / 9 * TAU, pr = s * (.4 + (sup ? .04 : 0)); Pg(g, i % 2 ? c : l, [Math.cos(pa - .3) * s * .16, -s * .18 - b + Math.sin(pa - .3) * s * .16, Math.cos(pa) * pr * .9, -s * .18 - b + Math.sin(pa) * pr * .85, Math.cos(pa + .3) * s * .16, -s * .18 - b + Math.sin(pa + .3) * s * .16]) }
      O(g, 0, -s * .18 - b, s * .19, s * .19, C(t, '#f0d4c4'))
      for (sd = -1; sd <= 1; sd += 2) { O(g, sd * s * .08, -s * .2 - b, s * .06, s * .07, EW); Pg(g, '#c83a5a', [sd * s * .08, -s * .15 - b, sd * s * .04, -s * .21 - b, sd * s * .08, -s * .23 - b, sd * s * .12, -s * .21 - b], true) }
      O(g, 0, -s * .09 - b, s * .06, s * (.02 + .04 * c2), '#8a1a2a')
      for (i = 0; i < 2; i++) { var hx = Math.sin(t.time * 2 + i * 3) * s * .3, hy = -s * .4 - ((t.time * .8 + i * .5) % 1) * s * .1; Pg(g, 'rgba(240,80,130,.7)', [hx, hy + s * .05, hx - s * .04, hy, hx - s * .02, hy - s * .03, hx, hy - s * .01, hx + s * .02, hy - s * .03, hx + s * .04, hy], true) }
    } else if (kd === 'pride') {
      // peacock: a fan of eyed tail feathers behind a crested, beaked head
      var fc = sup === 2 ? '#e8c04a' : sup ? '#6a5a9a' : '#3a8a9a'
      for (i = 0; i < 7; i++) { var fa2 = -Math.PI * .98 + i / 6 * Math.PI * .96, fx = Math.cos(fa2) * s * .26, fy = s * .08 + Math.sin(fa2) * s * .22 + Math.sin(t.time * 3 + i) * s * .01; O(g, fx, fy, s * .12, s * .17, C(t, i % 2 ? fc : sh(fc, -.12)), fa2 + Math.PI / 2); O(g, fx * 1.22, fy * 1.05 - s * .03, s * .05, s * .07, '#e8d070', fa2 + Math.PI / 2); O(g, fx * 1.22, fy * 1.05 - s * .03, s * .025, s * .035, '#1a3a4a', fa2 + Math.PI / 2) }
      O(g, 0, s * .14 - b, s * .2, s * .26, c); O(g, 0, s * .2 - b, s * .13, s * .16, l)
      for (sd = -1; sd <= 1; sd += 2) L(g, d, s * .04, [sd * s * .08, s * .34, sd * s * .1, s * .46])
      O(g, 0, -s * .16 - b, s * .16, s * .15, C(t, sh(k.c, .05)))
      for (i = -1; i <= 1; i++) { L(g, '#4a3a2a', s * .015, [i * s * .04, -s * .28 - b, i * s * .08, -s * .38 - b]); O(g, i * s * .08, -s * .4 - b, s * .035, s * .035, sup === 2 ? '#f6d65a' : '#3a8a9a') }
      eye(g, -s * .07, -s * .18 - b, s * .045, EW); eye(g, s * .07, -s * .18 - b, s * .045, EW)
      Pg(g, '#d8a040', [-s * .05, -s * .12 - b, s * .05, -s * .12 - b, 0, -s * (.0 - .03 * c2) - b]); L(g, DARK, s * .03, [-s * .13, -s * .26 - b, -s * .03, -s * .22 - b]); L(g, DARK, s * .03, [s * .13, -s * .26 - b, s * .03, -s * .22 - b])
    } else if (kd === 'envy') {
      // chameleon: curled tail, ridge of spines, two eye-turrets that swivel on their own, flicking tongue
      var tg = Math.sin(t.time * 3) * s * .06
      spiral(g, s * .28, s * .24, s * .02, s * .13, 1.7, d, s * .05)
      for (sd = -1; sd <= 1; sd += 2) { L(g, d, s * .06, [sd * s * .2, s * .12, sd * s * .34, s * .2, sd * s * .32, s * .32]); O(g, sd * s * .33, s * .34, s * .06, s * .045, d) }
      O(g, 0, s * .1, s * .3, s * .28, c); for (i = -2; i <= 2; i++) Pg(g, d, [i * s * .07 - s * .03, -s * .14, i * s * .07, -s * .24, i * s * .07 + s * .03, -s * .14])
      O(g, 0, s * .16, s * .2, s * .16, l); for (i = 0; i < 6; i++) O(g, Math.cos(i * 1.9) * s * .2, s * .08 + Math.sin(i * 2.3) * s * .12, s * .025, s * .025, d)
      L(g, '#c8506a', s * .035, [0, s * .24, tg * .5, s * (.34 + c2 * .08), tg, s * (.44 + c2 * .06)]); O(g, tg, s * (.46 + c2 * .06), s * .045, s * .045, '#e8708a')
      for (sd = -1; sd <= 1; sd += 2) { O(g, sd * s * .14, -s * .12, s * .1, s * .1, c); O(g, sd * s * .14, -s * .12, s * .06, s * .06, '#e8e8a0'); O(g, sd * s * .14 + Math.sin(t.time * 2 + sd) * s * .025, -s * .12, s * .03, s * .03, '#2a3a1a') }
    } else if (kd === 'wrath') {
      // furnace-kettle: riveted iron-red pot with a handle, steam, stubby fists and a scowl
      var st = t.time * 1.6
      for (i = 0; i < 3; i++) { var sp2 = (st + i * .33) % 1; O(g, Math.sin(i * 2 + st) * s * .1 + (i - 1) * s * .12, -s * .42 - sp2 * s * .12, s * (.05 + sp2 * .04), s * (.05 + sp2 * .04), 'rgba(230,220,210,' + (.5 - sp2 * .4) + ')') }
      g.strokeStyle = sh('#4a3a3a', -.4); g.lineWidth = s * .045; g.beginPath(); g.arc(0, -s * .1, s * .3, Math.PI * 1.1, Math.PI * 1.9); g.stroke()
      for (sd = -1; sd <= 1; sd += 2) { L(g, d, s * .09, [sd * s * .28, s * .04, sd * s * .4, s * .16, sd * s * .38, s * .0 + step * s * .04]); O(g, sd * s * .38, step * s * .04 - s * .02, s * .1, s * .1, d) }
      O(g, 0, s * .12 - b, s * .32, s * .32, c); O(g, 0, -s * .14 - b, s * .3, s * .07, l)
      for (i = -2; i <= 2; i++) O(g, i * s * .12, -s * .0 - b, s * .018, s * .018, d)
      for (sd = -1; sd <= 1; sd += 2) { O(g, sd * s * .12, s * .04 - b, s * .06, s * .05, '#f8d050'); L(g, '#1a0808', s * .05, [sd * s * .2, -s * .04 - b, sd * s * .05, s * .02 - b]) }
      mouth(g, s, 0, s * .22 - b, .13, .03 + .08 * c2, '#1a0808'); teeth(g, s, 0, s * .2 - b, 6, .05, .05); L(g, d, s * .02, [-s * .1, s * .36, -s * .1, s * .44]); L(g, d, s * .02, [s * .1, s * .36, s * .1, s * .44])
    } else if (kd === 'glut') {
      // gulper: a vast pouch body with eye-stalks on top and a cavernous hinge-jaw
      for (sd = -1; sd <= 1; sd += 2) { L(g, d, s * .045, [sd * s * .36, s * .0, sd * s * .46, s * .16]); L(g, d, s * .04, [sd * s * .16, s * .36, sd * s * .2, s * .46]) }
      O(g, 0, s * .12 - b, s * .42, s * .36, c); O(g, 0, s * .16 - b, s * .3, s * .26, l)
      O(g, 0, s * .12 - b, s * .26, s * (.12 + .08 * c2 + Math.abs(Math.sin(t.time * 3)) * .02), '#2a0a0e'); teeth(g, s, 0, s * .0 - b, 7, .07, .08); teeth(g, s, 0, s * .26 - b, 6, -.07, -.07); O(g, 0, s * .15, s * .1, s * .04, '#a8404a')
      for (sd = -1; sd <= 1; sd += 2) { L(g, d, s * .035, [sd * s * .1, -s * .16 - b, sd * s * .14, -s * .3 - b]); eye(g, sd * s * .14, -s * .33 - b, s * .06, EW) }
    } else {
      // coin-hoarder: a crab-like heap of gold coins with pincer claws and eyes peeking over the pile
      var coin = function (x, y, r, col) { O(g, x, y, r, r * .9, col); O(g, x, y, r * .6, r * .55, sh(col, -.2)) }
      for (sd = -1; sd <= 1; sd += 2) { L(g, d, s * .07, [sd * s * .24, s * .06 - b, sd * s * .4, s * .0, sd * s * .38, -s * .16]); Pg(g, C(t, '#f0d860'), [sd * s * .34, -s * .14, sd * s * .46, -s * .3 - c2 * s * .04, sd * s * .44, -s * .12, sd * s * .38, -s * .06]); Pg(g, C(t, '#a88a28'), [sd * s * .38, -s * .06, sd * s * .5, -s * .1, sd * s * .44, s * .02]) }
      O(g, 0, s * .14 - b, s * .3, s * .26, c)
      for (i = 0; i < 9; i++) coin(Math.cos(i * 2.4) * s * .24, s * .14 + Math.sin(i * 2.4) * s * .2 - b, s * .06, C(t, i % 2 ? '#f0d860' : '#a88a28'))
      for (sd = -1; sd <= 1; sd += 2) { L(g, d, s * .035, [sd * s * .09, -s * .04 - b, sd * s * .11, -s * .16 - b]); eye(g, sd * s * .11, -s * .2 - b, s * .06, '#f8e070', '#7a5a10') }
      L(g, '#7a5a10', s * .03, [-s * .12, s * .06 - b, 0, s * .12 - b, s * .12, s * .06 - b]); teeth(g, s, 0, s * .08 - b, 4, .05, .05, '#f8e070')
      for (sd = -1; sd <= 1; sd += 2) L(g, d, s * .045, [sd * s * .14, s * .34, sd * s * .18, s * .46])
    }
    if (sup === 1 && kd !== 'pride') for (i = -1; i <= 1; i++) Pg(g, '#2a1a2a', [i * s * .1 - s * .04, -s * .38 - b, i * s * .1, -s * .52 - b + Math.abs(i) * s * .04, i * s * .1 + s * .04, -s * .38 - b])
    cracks(g, s, t)
  } }
  def(Object.keys(SINS), sin)

  // --- generic fallbacks for the long tail ----------------------------------
  function oval (g, x, y, rx, ry) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill() }
  function stroke (g, c, w, p) { L(g, c, w, p) }
  function colour (t, d) { var c = t.tint || d.tint || '#8d665d'; return t.hurt ? '#f5efe3' : c }
  function damage (g, s, t) { cracks(g, s, t) }
  function face (g, s, t, d, wide) { var c = colour(t, d); g.fillStyle = IS.shade(c, -.3); oval(g, 0, s * .08, s * (wide ? .46 : .37), s * (wide ? .37 : .43)); g.fillStyle = c; oval(g, 0, -s * .03, s * (wide ? .42 : .34), s * (wide ? .34 : .39)); g.fillStyle = '#21191b'; oval(g, -s * .14, -s * .08, s * .045, s * .07); oval(g, s * .14, -s * .08, s * .045, s * .07); g.fillStyle = '#3b1719'; g.beginPath(); g.arc(0, s * .1, s * .14, 0, Math.PI); g.fill(); damage(g, s, t) }
  function fly (g, s, t, d) { var c = colour(t, d), w = Math.sin((t.time || 0) * 14) * s * .04; g.fillStyle = IS.alpha('#cbd4c5', .5); oval(g, -s * .28, -s * .08 + w, s * .25, s * .14); oval(g, s * .28, -s * .08 - w, s * .25, s * .14); g.fillStyle = c; oval(g, 0, 0, s * .29, s * .32); g.fillStyle = '#171619'; oval(g, 0, -s * .06, s * .12, s * .14); damage(g, s, t) }
  function spiderG (g, s, t, d) { var c = colour(t, d); for (var i = -1; i <= 1; i += 2) { stroke(g, IS.shade(c, -.35), s * .045, [i * s * .12, -s * .05, i * s * .42, -s * .28, i * s * .52, -s * .16]); stroke(g, IS.shade(c, -.35), s * .045, [i * s * .14, s * .08, i * s * .45, s * .2, i * s * .5, s * .38]) } g.fillStyle = c; oval(g, 0, 0, s * .3, s * .25); g.fillStyle = '#d8d2b9'; for (i = -1; i <= 1; i += 2) oval(g, i * s * .1, -s * .07, s * .045, s * .055); damage(g, s, t) }
  function wormG (g, s, t, d) { var c = colour(t, d); for (var i = 4; i >= 0; i--) { g.fillStyle = IS.shade(c, -i * .06); oval(g, (i - 2) * s * .17, Math.sin(i + (t.frame || 0)) * .08 * s, s * (.22 - i * .015), s * (.2 - i * .01)) } g.fillStyle = '#211719'; oval(g, -s * .35, -s * .04, s * .04, s * .05); damage(g, s, t) }
  function boneG (g, s, t, d) { g.fillStyle = colour(t, { tint: '#d8cfb7' }); oval(g, 0, -s * .16, s * .3, s * .27); g.fillStyle = '#272126'; oval(g, -s * .11, -s * .18, s * .07, s * .09); oval(g, s * .11, -s * .18, s * .07, s * .09); stroke(g, '#d8cfb7', s * .06, [0, s * .05, 0, s * .42]); for (var i = -1; i <= 1; i += 2) stroke(g, '#d8cfb7', s * .045, [0, s * (.14 + i * .02), i * s * .27, s * .25]); damage(g, s, t) }
  function maw (g, s, t, d) { var c = colour(t, d), open = .18 + .2 * (t.charge || 0); g.fillStyle = c; oval(g, 0, 0, s * .45, s * .4); g.fillStyle = '#251619'; oval(g, 0, s * .02, s * .3, s * open); g.fillStyle = '#ded0b1'; for (var i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * s * .1, -s * open); g.lineTo(i * s * .1 + s * .045, -s * .03); g.lineTo(i * s * .1 - s * .045, -s * .03); g.fill() } damage(g, s, t) }
  function ghostG (g, s, t, d) { var c = colour(t, d); g.fillStyle = IS.alpha(c, .65); g.beginPath(); g.moveTo(-s * .35, s * .45); g.quadraticCurveTo(-s * .5, -s * .25, 0, -s * .48); g.quadraticCurveTo(s * .5, -s * .25, s * .35, s * .45); g.lineTo(s * .17, s * .32); g.lineTo(0, s * .46); g.lineTo(-s * .17, s * .32); g.fill(); g.fillStyle = '#eee9d9'; oval(g, -s * .1, -s * .12, s * .045, s * .07); oval(g, s * .1, -s * .12, s * .045, s * .07) }
  function host (g, s, t, d) { var c = colour(t, d); g.fillStyle = IS.shade(c, -.35); g.fillRect(-s * .3, -s * .02, s * .6, s * .38); g.fillStyle = c; g.beginPath(); g.arc(0, 0, s * .42, Math.PI, Math.PI * 2); g.fill(); g.fillStyle = '#25191b'; g.fillRect(-s * .24, -s * .08, s * .48, s * .1); damage(g, s, t) }
  function family (d) { var n = (d.name || d.id).toLowerCase(); if (/fly|pooter/.test(n)) return fly; if (/spider|trite|para-bite|crawler/.test(n)) return spiderG; if (/worm|leech|turdlet|nerve ending/.test(n)) return wormG; if (/bony|bone|revenant/.test(n)) return boneG; if (/maw|grimace|mouth/.test(n)) return maw; if (/ghost|haunt|wizoob|whipper/.test(n)) return ghostG; if (/host/.test(n)) return host; if (/fat|bloated|conjoined|globin|boil|gut|gel/.test(n)) return function (g, s, t, x) { face(g, s, t, x, true) }; return function (g, s, t, x) { face(g, s, t, x, false) } }
  ;(IS.enemies || []).forEach(function (d) { if (d.boss) return; var fn = family(d), name = d.sprite || d.id; if (!IS.sprite(name)) IS.defineSprite(name, function (g, s, t) { fn(g, s, t, d) }); if (/fly|spider|worm|hopper|leaper|cinder/.test((d.name || '').toLowerCase())) IS.spriteAnimated(name) })
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
