;(function (IS) {
  'use strict'
  // ---------------------------------------------------------------------------
  // Enemy sprites (set 1). All original designs drawn procedurally in the
  // 100-unit sprite space of art-kit.js via A.register: thick dark outline,
  // flat two-tone shading (lit top-left, shadowed underside), grimy palette.
  // Roles stay readable: shamblers walk, flyers flap, shooters open a maw or
  // glow when t.charge rises, spawners pulse. The s-based helpers (C, O, L, Pg,
  // eye, cracks, def) are the old shared kit exported as IS.spriteKit and still
  // used by sprites-enemies-2.js.
  // ---------------------------------------------------------------------------
  var TAU = Math.PI * 2
  var A = IS.art
  function C (t, c) { return t.hurt ? '#f6f0e4' : c }
  function sh (c, a) { return IS.shade ? IS.shade(c, a) : c }
  function O (g, x, y, rx, ry, c) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, TAU); g.fill() }
  function L (g, c, w, p) { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke() }
  function Pg (g, c, p) { g.fillStyle = c; g.beginPath(); g.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill() }
  function eye (g, x, y, r, c, pc, dy) { O(g, x, y, r, r * 1.1, c); O(g, x, y + (dy || 0), r * .5, r * .6, pc || '#1a1214') }
  function cracks (g, s, t) { if ((t.hp01 == null ? 1 : t.hp01) < .45) { L(g, '#4a1a20', s * .03, [-s * .12, -s * .3, -s * .02, -s * .12, -s * .1, s * .02]); O(g, s * .14, s * .22, s * .03, s * .07, '#7a2229') } }
  function def (ids, fn) { ids.forEach(function (id) { IS.defineSprite(id, fn(id)); IS.spriteAnimated(id) }) }

  // --- local drawing kit (100-unit space) -----------------------------------
  function dk (c) { return A.sh(c, -.62) }
  function sx (c, a) { return A.sh(c, a) }
  /* outlined ellipse: shadow base, lit offset body, highlight fleck */
  function S (g, x, y, rx, ry, c, o) {
    o = o || {}; var rot = o.rot || 0
    g.save(); g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fillStyle = sx(c, -.3); g.fill(); g.clip()
    g.fillStyle = c; g.beginPath(); g.ellipse(x - rx * .14, y - ry * .16, rx * .92, ry * .9, rot, 0, TAU); g.fill()
    if (o.hi !== false) { g.fillStyle = sx(c, .28); g.beginPath(); g.ellipse(x - rx * .4, y - ry * .45, rx * .26, ry * .15, rot - .6, 0, TAU); g.fill() }
    g.restore()
    g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.lineWidth = o.lw || A.lw; g.strokeStyle = o.ol || dk(c); g.stroke()
  }
  /* outlined polygon with a darker lower-right half */
  function P (g, p, c, o) {
    o = o || {}; var i, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9
    g.beginPath(); g.moveTo(p[0], p[1]); for (i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fillStyle = c; g.fill()
    for (i = 0; i < p.length; i += 2) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]) }
    if (o.sd !== false) {
      g.save(); g.clip(); g.fillStyle = 'rgba(18,6,10,.26)'; g.beginPath(); g.moveTo(x0 + (x1 - x0) * .55, y0 - 2); g.lineTo(x1 + 2, y0 - 2); g.lineTo(x1 + 2, y1 + 2); g.lineTo(x0 - 2, y1 + 2); g.closePath(); g.fill(); g.restore()
    }
    g.beginPath(); g.moveTo(p[0], p[1]); for (i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath()
    g.lineJoin = 'round'; g.lineWidth = o.lw || A.lw; g.strokeStyle = o.ol || dk(c); g.stroke()
  }
  /* outlined thick limb */
  function LM (g, p, w, c) {
    L(g, dk(c), w + A.lw * 1.6, p); L(g, c, w, p)
    L(g, sx(c, .22), Math.max(1, w * .22), p.map(function (v, i) { return i % 2 ? v - w * .2 : v - w * .12 }))
  }
  function FL (g, x, y, w, h) {
    var f = Math.sin(A.T * 13 + x) * .14
    P(g, [x - w, y, x - w * .55, y - h * .55, x + f * w * 2, y - h * (1 + f), x + w * .5, y - h * .5, x + w, y], '#e9822c', { lw: 2, sd: false })
    P(g, [x - w * .5, y, x, y - h * .6, x + w * .5, y], '#f7d86a', { ol: false, sd: false })
  }
  function EY (g, x, y, r, sc, o) { o = o || {}; o.sc = sc || '#efe6d2'; A.eye(g, x, y, r, o) }
  function reg (ids, mk, R) { ids.forEach(function (id) { A.register(id, mk(id), { R: R || 28 }) }) }
  function stitchX (g, x, y, r, c) { A.line(g, c, 1.6, [x - r, y - r, x + r, y + r]); A.line(g, c, 1.6, [x + r, y - r, x - r, y + r]) }

  // --- drudges (was: gapers) ------------------------------------------------
  // shambling sack-headed rag men: one swollen lantern eye, stitched seams
  var DRUDGE = {
    'gaper': { sack: '#b9a070', rag: '#5c4a3c', eye: '#ddc860', blood: '#8f2a2a' },
    'frowning-gaper': { sack: '#8c9a86', rag: '#3c4540', eye: '#d0d8a0', blood: '#5c2a2e', brow: true },
    'flaming-gaper': { sack: '#c9a47a', rag: '#6a3a2a', eye: '#f0b040', blood: '#8f2a2a', fire: true },
    'gusher': { sack: '#caa08a', rag: '#7a3030', eye: '#e8c070', blood: '#b52a30', splash: true },
    'blue-gaper': { sack: '#7f9aae', rag: '#33465a', eye: '#c8e4f0', blood: '#3c5a74', drip: true },
    'poppy-gaper': { sack: '#d8b890', rag: '#7a4a3a', eye: '#f4c860', blood: '#8f2a2a', flower: true }
  }
  function drudge (id) { var k = DRUDGE[id]; return function (g, t) {
    A.lw = 3
    var T = A.T, ch = A.ch, step = Math.sin(T * 9), bob = Math.abs(step) * 2, sk = A.tint(t, k.sack), skin = sx(sk, -.12)
    LM(g, [-8, 28, -9 + step * 4, 41], 9, dk(k.rag)); LM(g, [8, 28, 9 - step * 4, 41], 9, dk(k.rag))
    S(g, -9 + step * 4, 44, 8, 4.5, '#2e2420'); S(g, 9 - step * 4, 44, 8, 4.5, '#2e2420')
    g.save(); g.translate(0, -bob)
    LM(g, [-18, 2, -27, 16, -25 + step * 3, 31], 7, skin); LM(g, [18, 2, 27, 16, 25 - step * 3, 31], 7, skin)
    S(g, -25 + step * 3, 33, 5.5, 5, skin); S(g, 25 - step * 3, 33, 5.5, 5, skin)
    P(g, [-19, -3, 19, -3, 23, 36, 13, 31, 7, 38, 0, 32, -7, 39, -13, 31, -23, 36], k.rag)
    A.line(g, '#2a1c14', 3, [-20, 12, 0, 16, 20, 12]); P(g, [-14, 20, -5, 19, -6, 28, -14, 29], sx(k.rag, .2), { lw: 2 })
    // sack head
    P(g, [-5, -35, -13, -50, -5, -42, 1, -53, 4, -41, 11, -48, 6, -35], sk, { lw: 2.6 })
    S(g, 0, -18, 22, 21, sk)
    A.line(g, '#4a3626', 3.4, [-14, -4, 0, -1, 14, -4])
    A.stitches(g, 8, -36, 13, -9, 5, '#2a1c14', 3)
    if (k.brow) {
      EY(g, -9, -19, 6, k.eye, { lid: .3, lc: sx(sk, -.2) }); EY(g, 9, -19, 6, k.eye, { lid: .3, lc: sx(sk, -.2) })
      A.line(g, '#2a1c14', 4, [-17, -28, -3, -22]); A.line(g, '#2a1c14', 4, [17, -28, 3, -22])
    } else {
      A.flat(g, -8, -20, 12, 12.5, '#2a1a14'); stitchX(g, 12, -26, 3.4, '#2a1c14')
      EY(g, -8, -20, 9.5, k.eye, { red: true, sq: 1.05 })
    }
    O(g, 0, -3, 9, 1.5 + ch * 7, '#1e0a0c')
    L(g, '#2a1c14', 3, [-11, -4, -3, -2, 5, -3, 12, -5]); for (var i = -3; i <= 3; i += 2) A.line(g, '#2a1c14', 1.6, [i * 3.2, -6, i * 3.2 + 1, 0])
    if (k.splash) { A.flat(g, 10, -8, 5, 9, k.blood); A.drip(g, 10, -4, 12, k.blood, 2.4); for (var d = 0; d < 3; d++) { var f = (T * 1.8 + d * .33) % 1; A.flat(g, -14 - d * 6 + f * -4, 4 + f * 26, 2.6 - f, 3 - f, k.blood) } }
    if (k.drip) { A.drip(g, -12, -3, 11, '#9ec4d8', 2.2); A.drip(g, 6, 6, 9, '#9ec4d8', 2) }
    if (k.fire) FL(g, 0, -42, 11, 20 + Math.sin(T * 12) * 3)
    if (k.flower) { for (var q = 0; q < 5; q++) { var a = q * TAU / 5; S(g, -12 + Math.cos(a) * 6, -38 + Math.sin(a) * 6, 5, 4.4, '#d0383a', { lw: 2, hi: false }) } S(g, -12, -38, 3, 3, '#2a1c14', { lw: 1.2, hi: false }) }
    g.restore()
  } }

  // --- tallow lumps (was: fatties) ------------------------------------------
  function tallow (id) {
    var base = { 'fatty': '#dccfa8', 'flaming-fatty': '#d9b88c', 'gutted-fatty': '#cfa6a0', 'bloated-fatty': '#c9d0a2', 'conjoined-fatty': '#d6c4b0' }[id] || '#dccfa8'
    var big = /bloated|conjoined/.test(id), fire = id === 'flaming-fatty', gut = id === 'gutted-fatty'
    return function (g, t) {
      A.lw = 3
      var T = A.T, ch = A.ch, wob = Math.sin(T * 3), c = A.tint(t, base)
      S(g, 0, 38, 38, 8, sx(c, -.25), { hi: false })
      ;[[-27, 33], [-12, 42], [14, 41], [28, 32]].forEach(function (d, i) { S(g, d[0], d[1], 5.5, 7 + (i % 2) * 2, c, { lw: 2.4 }) })
      S(g, 0, 12 + wob * .3, 35 + ch * 3, 30 - wob * .6 + ch * 2, c)
      A.stitches(g, -22, 20, 22, 24, 7, dk(c), 3)
      var hx = big ? -14 : 0
      S(g, hx, -18, big ? 16 : 18, 15, sx(c, .04))
      if (big) S(g, 20, -10, 15, 14, sx(c, .02))
      var heads = big ? [[hx, -18], [20, -10]] : [[0, -18]]
      heads.forEach(function (h) {
        var wy = h[1] - (big ? 15 : 15)
        A.line(g, dk(c), 3, [h[0] + 1, wy, h[0] + 3, wy - 7])
        if (fire) FL(g, h[0] + 3, wy - 6, 6, 14 + Math.sin(T * 12) * 2.5); else A.flat(g, h[0] + 3, wy - 7, 2, 2, '#c24a2a')
        S(g, h[0] - 6.5, h[1] - 1, 4.4, 5.2, '#2a1c1a', { lw: 2 }); S(g, h[0] + 6.5, h[1] - 1, 4.4, 5.2, '#2a1c1a', { lw: 2 })
        A.flat(g, h[0] - 6, h[1], 1.6, 2, '#e8ddc0'); A.flat(g, h[0] + 7, h[1], 1.6, 2, '#e8ddc0')
        A.line(g, dk(c), 2.4, [h[0] - 5, h[1] + 8, h[0], h[1] + 10 + ch * 3, h[0] + 5, h[1] + 8])
        A.drip(g, h[0] - 7, h[1] + 4, 8, sx(c, .12), 1.6)
      })
      if (gut) {
        O(g, 0, 14, 15, 6.5, '#2a0c10'); g.lineWidth = 3; g.strokeStyle = '#4a1218'; g.beginPath(); g.ellipse(0, 14, 15, 6.5, 0, 0, TAU); g.stroke()
        LM(g, [-6, 14, -10, 24, -4, 34 + Math.sin(T * 3) * 2, 2, 40], 5, '#c9707a'); LM(g, [5, 14, 12, 22, 8, 33], 4.5, '#b45a66')
      }
    }
  }

  // --- carrion beetles and moths (was: flies) -------------------------------
  var FLIES = {
    'fly': { body: '#2e2829', rx: .17, ry: .19, wing: .5, eye: '#c7a23a', span: .26 },
    'attackfly': { body: '#4d5d6c', rx: .2, ry: .2, wing: .65, eye: '#e9e27a', span: .34, sting: true },
    'pooter': { body: '#76804e', rx: .3, ry: .31, wing: .45, eye: '#b83c3c', span: .3, belly: true },
    'super-pooter': { body: '#5f7d8a', rx: .3, ry: .31, wing: .45, eye: '#e0d070', span: .3, belly: true },
    'boom-fly': { body: '#b02733', rx: .27, ry: .29, wing: .4, eye: '#f3d86a', span: .22, gloss: true },
    'red-boom-fly': { body: '#d2501f', rx: .27, ry: .29, wing: .4, eye: '#f3e8a0', span: .22, gloss: true },
    'drowned-boom-fly': { body: '#4f7380', rx: .27, ry: .29, wing: .4, eye: '#d8e8a0', span: .22, gloss: true },
    'fly-bomb': { body: '#6e7a62', rx: .27, ry: .29, wing: .4, eye: '#e8d8a0', span: .22, gloss: true },
    'dinga': { body: '#6f8795', rx: .2, ry: .2, wing: .5, eye: '#e8e0a0', span: .3 },
    'pot': { body: '#8a6a4f', rx: .2, ry: .2, wing: .5, eye: '#e8e0a0', span: .26 },
    'tumor': { body: '#7a4a58', rx: .22, ry: .22, wing: .4, eye: '#e8e0a0', span: .2 },
    'eternal-fly': { body: '#d8d0e0', rx: .18, ry: .2, wing: .7, eye: '#6a5a9a', span: .3, moth: true },
    'molten-baby': { body: '#9a3a22', rx: .22, ry: .22, wing: .3, eye: '#ffd86a', span: .2, flame: true },
    'holy-keeper': { body: '#e0d8b0', rx: .2, ry: .22, wing: .7, eye: '#c9a43a', span: .3, moth: true },
    'locust-of-pestilence': { body: '#6d7a52', rx: .15, ry: .22, wing: .6, eye: '#d8e0a0', span: .3, long: true },
    'locust-of-war': { body: '#a2503a', rx: .15, ry: .22, wing: .6, eye: '#f0d890', span: .3, long: true },
    'locust-of-famine': { body: '#6a4a38', rx: .15, ry: .22, wing: .6, eye: '#d8d090', span: .3, long: true },
    'locust-of-death': { body: '#4f5a52', rx: .15, ry: .22, wing: .6, eye: '#c8d0a0', span: .3, long: true }
  }
  function beetle (id) { var k = FLIES[id]; return function (g, t) {
    A.lw = 3
    var T = A.T, fp = Math.sin(T * (k.sting ? 34 : 26)), bob = Math.sin(T * 5 + id.length) * 1.6, col = A.tint(t, k.body)
    var rx = k.rx * 100 * .95, ry = k.ry * 100 * .95, by = 6, hy = by - ry * .92, hr = 8.5 + rx * .1
    g.save(); g.translate(0, bob)
    var wc = 'rgba(214,226,222,' + (.3 + k.wing * .45) + ')'
    if (k.moth) {
      var wcol = sx(col, .05)
      for (var sd = -1; sd <= 1; sd += 2) {
        g.save(); g.translate(0, -6); g.scale(1, .82 + .22 * fp)
        P(g, [sd * 5, -8, sd * 30, -34, sd * 46, -18, sd * 44, 6, sd * 32, 20, sd * 6, 10], wcol, { lw: 2.8 })
        S(g, sd * 30, -8, 8, 8, sx(col, -.35), { lw: 2, hi: false }); S(g, sd * 30, -8, 4.6, 4.6, k.eye, { lw: 1.6, hi: false })
        A.line(g, dk(wcol), 1.6, [sd * 8, 0, sd * 22, 10]); A.line(g, dk(wcol), 1.6, [sd * 8, -4, sd * 24, -24])
        g.restore()
      }
    } else {
      for (var sw = -1; sw <= 1; sw += 2) {
        var wy = -4 - fp * 5, wl = (k.long ? 30 : 22)
        g.beginPath(); g.ellipse(sw * (k.span * 100 + 2), wy, wl, (k.long ? 8 : 12) * (.75 + .25 * fp), sw * -.45, 0, TAU); g.fillStyle = wc; g.fill(); g.lineWidth = 2.4; g.strokeStyle = 'rgba(40,36,44,.75)'; g.stroke()
        A.line(g, 'rgba(40,36,44,.5)', 1.3, [sw * (k.span * 100 - 12), wy + 2, sw * (k.span * 100 + 16), wy - 4])
      }
    }
    for (var lg = 0; lg < 3; lg++) for (var ls = -1; ls <= 1; ls += 2) { var ly = by - ry * .3 + lg * ry * .5; LM(g, [ls * rx * .7, ly, ls * (rx + 8), ly + (lg - 1) * 5 + 4], 3, dk(col)) }
    if (k.sting) { P(g, [-6, by + ry - 5, 6, by + ry - 5, 0, by + ry + 14], sx(col, -.35)) }
    if (k.flame) FL(g, 0, hy - 8, 8, 16 + Math.sin(T * 14) * 3)
    var ew = k.long ? rx * .85 : rx
    S(g, 0, by, ew, ry, col)
    A.line(g, dk(col), 2.4, [0, by - ry * .55, 0, by + ry * .98])
    if (k.sting) { A.line(g, '#1c1a20', 3.4, [-ew * .8, by + 4, ew * .8, by + 4]); A.line(g, '#1c1a20', 3.4, [-ew * .6, by + 13, ew * .6, by + 13]) }
    if (k.belly) { S(g, -rx * .4, by + 8, 5, 5, sx(col, -.2), { lw: 2 }); S(g, rx * .45, by + 3, 4, 4, sx(col, -.2), { lw: 2 }); S(g, 0, by + ry * .62, 6, 4.5, sx(col, -.1), { lw: 2 }) }
    if (k.gloss) { var hot = .55 + A.ch * .45; A.glow(g, 0, by, ew * 1.2, '#ffb040', .35 * hot); A.line(g, '#ffd070', 2, [-ew * .5, by + 2, -ew * .2, by + 9, -ew * .45, by + 16]); A.line(g, '#ffd070', 2, [ew * .5, by - 2, ew * .25, by + 6, ew * .4, by + 14]); A.flat(g, 0, by + ry + 1, 2.6, 2.6, '#ffe890') }
    if (k.long) { A.line(g, dk(col), 2.2, [-ew * .8, by - 4, ew * .8, by - 4]); LM(g, [-6, hy + 4, -17, hy - 3, -14, hy - 15], 3.4, sx(col, -.1)); LM(g, [6, hy + 4, 17, hy - 3, 14, hy - 15], 3.4, sx(col, -.1)) }
    S(g, 0, by - ry * .55, ew * .75, 8, sx(col, .06))
    P(g, [-5, hy - 5, -9, hy - 15, -1, hy - 8], dk(col), { lw: 2 }); P(g, [5, hy - 5, 9, hy - 15, 1, hy - 8], dk(col), { lw: 2 })
    A.line(g, dk(col), 1.8, [-3, hy - 7, -9, hy - 18]); A.line(g, dk(col), 1.8, [3, hy - 7, 9, hy - 18])
    S(g, 0, hy, hr, hr * .9, sx(col, -.08))
    S(g, -hr * .55, hy - 1, 4.4, 4.8, k.eye, { lw: 2 }); S(g, hr * .55, hy - 1, 4.4, 4.8, k.eye, { lw: 2 })
    A.flat(g, -hr * .55, hy, 1.8, 2.2, '#140c10'); A.flat(g, hr * .55, hy, 1.8, 2.2, '#140c10')
    g.restore()
  } }

  // --- leather bat and ember crow --------------------------------------------
  function bat (id) { var hell = id === 'hell-bird', col = hell ? '#a8452e' : '#5a4a63'; return function (g, t) {
    A.lw = 3
    var T = A.T, f = Math.sin(T * 16) * 10, c = A.tint(t, col), sd
    for (sd = -1; sd <= 1; sd += 2) {
      if (hell) {
        P(g, [sd * 8, -2, sd * 46, -22 - f, sd * 38, -10 - f * .8, sd * 48, -4 - f * .5, sd * 38, 4, sd * 44, 14, sd * 26, 10, sd * 12, 12], sx(c, -.18))
        A.line(g, dk(c), 1.8, [sd * 10, 0, sd * 40, -10 - f * .7]); A.line(g, dk(c), 1.8, [sd * 10, 4, sd * 36, 8])
      } else {
        P(g, [sd * 8, -4, sd * 46, -26 - f, sd * 40, -4 - f * .4, sd * 38, 10, sd * 27, 2, sd * 22, 15, sd * 12, 6], sx(c, -.18))
        A.line(g, dk(c), 2, [sd * 8, -4, sd * 46, -26 - f]); A.line(g, dk(c), 1.6, [sd * 10, -2, sd * 38, 10]); A.line(g, dk(c), 1.6, [sd * 10, -2, sd * 24, 14])
      }
    }
    if (hell) { for (sd = -1; sd <= 1; sd += 2) P(g, [sd * 4, 26, sd * 10, 40, sd * 2, 34], sx(c, -.2), { lw: 2.4 }); FL(g, 0, 36 - 6, 6, 15 + Math.sin(T * 12) * 3) }
    S(g, 0, 8, 15, 20, c)
    if (hell) {
      S(g, 0, 10, 8, 11, sx(c, .22), { lw: 2 })
      S(g, 0, -12, 12, 11, sx(c, .06))
      FL(g, 0, -20, 6, 14 + Math.sin(T * 12) * 3)
      P(g, [-5, -9, 5, -9, 0, 3], '#f0a23a', { lw: 2.4 })
      S(g, -6, -14, 3.6, 3.6, '#ffe08a', { lw: 1.8, hi: false }); S(g, 6, -14, 3.6, 3.6, '#ffe08a', { lw: 1.8, hi: false })
      A.flat(g, -6, -14, 1.4, 1.4, '#1a0c08'); A.flat(g, 6, -14, 1.4, 1.4, '#1a0c08')
    } else {
      P(g, [-11, -16, -10, -37, -2, -20], sx(c, .05)); P(g, [11, -16, 10, -37, 2, -20], sx(c, .05))
      S(g, 0, -10, 13, 12, sx(c, .06))
      S(g, -5, -13, 4, 4, '#e8d870', { lw: 2, hi: false }); S(g, 5, -13, 4, 4, '#e8d870', { lw: 2, hi: false }); A.flat(g, -5, -13, 1.4, 2.4, '#140c10'); A.flat(g, 5, -13, 1.4, 2.4, '#140c10')
      P(g, [-5, -3, -2.5, -3, -3.5, 4], '#f1e8d6', { lw: 1.6, sd: false }); P(g, [5, -3, 2.5, -3, 3.5, 4], '#f1e8d6', { lw: 1.6, sd: false })
    }
  } }

  // --- crawlers --------------------------------------------------------------
  var WORMS = {
    'charger': { col: '#b27f6e', n: 4, rad: .17, kind: 'ram' },
    'drowned-charger': { col: '#6f9498', n: 4, rad: .17, kind: 'ram' },
    'maggot': { col: '#dcd6bf', n: 3, rad: .15, kind: 'grub' },
    'guts': { col: '#d98a8e', n: 5, rad: .13, kind: 'gut' },
    'leech': { col: '#7b3a42', n: 4, rad: .12, kind: 'leech' }
  }
  // armoured pill-bugs, grubs, gut-tubes, ring-mouthed leeches; head to the right
  function worm (id) { var k = WORMS[id]; return function (g, t) {
    A.lw = 3
    var T = A.T, w = T * 7, lift = A.ch * 8, c = A.tint(t, k.col), n = k.n, sp = 52 / n, i
    var xs = [], ys = [], rs = []
    for (i = 0; i < n; i++) { xs[i] = 14 - i * sp - (i === 0 ? 0 : 3); ys[i] = Math.sin(w - i * 1.1) * 3 + 8; rs[i] = Math.max(8, k.rad * 100 * (1 - i * .05)) }
    ys[0] -= lift
    for (i = n - 1; i >= 1; i--) {
      var x = xs[i], y = ys[i], r = rs[i]
      if (k.kind === 'ram' || k.kind === 'grub') { LM(g, [x - 3, y + r * .6, x - 5, y + r + 4], 3.4, dk(c)); LM(g, [x + 4, y + r * .6, x + 5, y + r + 4], 3.4, dk(c)) }
      if (k.kind === 'gut' || k.kind === 'leech') { S(g, x, y, r * 1.25, r, sx(c, i % 2 ? -.18 : 0)) } else S(g, x, y, r * 1.1, r * 1.05, sx(c, i % 2 ? -.2 : 0))
      if (k.kind === 'ram') { A.line(g, dk(c), 2.2, [x - 2, y - r, x - 4, y + r * .8]); P(g, [x - 5, y - r * .8, x - 1, y - r * 1.5, x + 3, y - r * .8], '#e0d2b0', { lw: 2 }) }
      if (k.kind === 'grub') A.line(g, dk(c), 1.8, [x, y - r * .9, x - 2, y + r * .5])
      if (k.kind === 'leech') A.line(g, '#d8a040', 2, [x - r, y - 2, x + r, y - 2])
      if (k.kind === 'gut') A.line(g, sx(c, .22), 1.6, [x - r, y - r * .5, x, y - r * .8, x + r, y - r * .5])
    }
    var hx = xs[0], hy = ys[0], hc = sx(c, -.1)
    if (k.kind === 'ram') {
      LM(g, [hx - 4, hy + 10, hx - 6, hy + 19], 3.4, dk(c))
      S(g, hx, hy, 18, 14, hc)
      P(g, [hx + 14, hy - 8, hx + 38, hy + 1, hx + 14, hy + 8], '#e0d2b0')
      A.line(g, dk('#e0d2b0'), 1.6, [hx + 18, hy - 3, hx + 30, hy + 1])
      EY(g, hx + 4, hy - 6, 4, '#f0eadc'); EY(g, hx + 4, hy + 4, 3.4, '#f0eadc')
    } else if (k.kind === 'grub') {
      S(g, hx, hy, 15, 13, '#7a6a58')
      P(g, [hx + 10, hy - 3, hx + 24, hy - 8, hx + 18, hy], '#3a2a22', { lw: 2 }); P(g, [hx + 10, hy + 4, hx + 24, hy + 9, hx + 18, hy + 1], '#3a2a22', { lw: 2 })
      A.flat(g, hx + 3, hy - 4, 2.4, 2.4, '#140c10')
    } else if (k.kind === 'gut') {
      S(g, hx, hy, 15, 13, hc)
      S(g, hx + 10, hy, 7, 8, '#8a2a34', { lw: 2.4 }); for (var q = 0; q < 5; q++) { var a = q * TAU / 5; A.line(g, '#f0e4cc', 1.8, [hx + 10 + Math.cos(a) * 3, hy + Math.sin(a) * 3.5, hx + 10 + Math.cos(a) * 6.5, hy + Math.sin(a) * 7]) }
      A.flat(g, hx - 4, hy - 7, 2, 2, '#1a1214')
    } else {
      S(g, hx, hy, 15, 12, hc)
      S(g, hx + 12, hy, 8, 9, '#c08a8e', { lw: 2.4 }); S(g, hx + 13, hy, 4, 5, '#2a0c12', { lw: 1.4, hi: false })
      for (var z = 0; z < 6; z++) { var b = z * TAU / 6; A.line(g, '#f0e4cc', 1.4, [hx + 13 + Math.cos(b) * 4, hy + Math.sin(b) * 4.5, hx + 13 + Math.cos(b) * 7.4, hy + Math.sin(b) * 8]) }
      A.flat(g, hx - 3, hy - 5, 1.8, 1.8, '#d8c8b0')
    }
  } }

  function snapper (g, t) {
    A.lw = 3
    var T = A.T, ch = A.ch, c = A.tint(t, '#6f8450'), bob = Math.sin(T * 6) * 1.2
    ;[[-18, 30], [8, 32]].forEach(function (l) { LM(g, [l[0], l[1] - 6, l[0] - 2, l[1] + 8], 8, sx(c, -.15)) })
    P(g, [-28, 12, -42, 20, -28, 20], sx(c, -.2), { lw: 2.4 })
    LM(g, [14, 10 + bob, 26, 6, 34, 2 - ch * 6], 11, sx(c, -.05))
    S(g, -6, 6, 31, 24, '#566a3a')
    ;[[-18, -6], [0, -10], [16, -4], [-22, 10], [-4, 6], [14, 12]].forEach(function (h) { P(g, [h[0] - 8, h[1], h[0] - 4, h[1] - 7, h[0] + 4, h[1] - 7, h[0] + 8, h[1], h[0] + 4, h[1] + 7, h[0] - 4, h[1] + 7], '#6a8248', { lw: 2, sd: false }) })
    S(g, 38, 0 - ch * 6, 11, 9, sx(c, .06))
    var jaw = 3 + ch * 9
    P(g, [34, 3 - ch * 6, 52, 3 - ch * 6 + jaw, 34, 8 - ch * 6 + jaw], sx(c, -.3), { lw: 2.4 })
    P(g, [34, -6 - ch * 6, 52, -3 - ch * 6, 38, 3 - ch * 6], '#d8cfa0', { lw: 2.4 })
    A.flat(g, 38, -4 - ch * 6, 2.6, 2.6, '#e8d070'); A.flat(g, 38, -4 - ch * 6, 1, 1.4, '#140c10')
    A.line(g, dk(c), 2, [20, -3, 24, 4])
  }

  // --- jellies (was: clotties / blurbs) --------------------------------------
  function jelly (id) {
    var k = { 'clotty': ['#b03a40', '#5a1018', '#e8905a'], 'grilled-clotty': ['#6a5040', '#2a1c14', '#ff9a40'], 'blurb': ['#5f9aae', '#1f4458', '#bfe8f0'], 'lil-blub': ['#8a6ab4', '#32204f', '#e0c8ff'] }[id]
    return function (g, t) {
      A.lw = 3
      var T = A.T, ch = A.ch, c = A.tint(t, k[0]), q = Math.sin(T * (id === 'clotty' ? 7 : 4)) * .05, w = 36 * (1 + q + ch * .08), h = 34 * (1 - q + ch * .08), y = 2, i
      for (i = 0; i < 4; i++) LM(g, [-24 + i * 16, y + 20, -26 + i * 16 + Math.sin(T * 3 + i) * 3, y + 30 + (i % 2) * 5, -24 + i * 16 + Math.sin(T * 3 + i + 1) * 4, y + 38 + (i % 2) * 4], 3.6, sx(c, -.15))
      function path () {
        g.beginPath(); g.moveTo(-w, y + 16); g.bezierCurveTo(-w, y - h * 1.35, w, y - h * 1.35, w, y + 16)
        for (var j = 0; j < 4; j++) { var x1 = w - (j + 1) * (w / 2), xm = w - (j + .5) * (w / 2); g.quadraticCurveTo(xm, y + 28 + Math.sin(T * 3 + j * 1.7) * 3, x1, y + 16) }
        g.closePath()
      }
      path(); g.fillStyle = sx(c, -.3); g.fill()
      g.save(); g.clip(); g.fillStyle = c; g.beginPath(); g.ellipse(-4, y - 6, w * .92, h * .9, 0, 0, TAU); g.fill()
      g.fillStyle = sx(c, .28); g.beginPath(); g.ellipse(-w * .4, y - h * .62, w * .24, h * .13, -.6, 0, TAU); g.fill()
      // nucleus seen through the skin
      S(g, 2, y + 1, 16, 14, id === 'blurb' ? '#2f6a82' : sx(k[1], .2), { lw: 2, hi: false })
      g.restore(); path(); g.lineWidth = A.lw; g.strokeStyle = dk(c); g.lineJoin = 'round'; g.stroke()
      var glow = 0
      if (id === 'grilled-clotty') { for (i = 0; i < 3; i++) A.line(g, k[2], 2, [-18 + i * 18, y - 22, -14 + i * 18, y - 12, -20 + i * 18, y - 2]) }
      else { for (i = 0; i < 3; i++) { var bx = [-20, 16, -2][i], by = [-12, -16, -26][i]; S(g, bx, y + by, 5 - i * .6, 5 - i * .6, k[2], { lw: 2, hi: false }); A.flat(g, bx, y + by, 2, 2, k[1]) } }
      if (id === 'lil-blub') { EY(g, 2, y + 1, 11, '#f0e8ff', { col: '#4a2a7a' }) }
      else { EY(g, -4, y - 1, 6, '#efe6d2'); EY(g, 9, y + 1, 5, '#efe6d2'); S(g, 2, y + 11, 4 + ch * 3, 2.4 + ch * 5, '#20090c', { lw: 2, hi: false }) }
      void glow
    }
  }

  // --- cricket (was: hopper) -------------------------------------------------
  function hopper (g, t) {
    A.lw = 3
    var T = A.T, ch = A.ch, sq = Math.sin(T * 8) * 1.4 + ch * 6, c = A.tint(t, '#8f7a42')
    LM(g, [18, 26, 22, 38], 6, sx(c, -.2)); LM(g, [8, 28, 10, 40], 6, sx(c, -.2))
    LM(g, [-10, 14 + sq, -34, -8 + sq, -40, 34], 12, sx(c, -.1)); S(g, -42, 36, 9, 4.5, dk(c), { lw: 2.4 })
    P(g, [-36, 24, -46, 30, -39, 36], '#d8c89a', { lw: 2 })
    S(g, -4, 8 + sq, 27, 16, c)
    P(g, [-28, 2 + sq, 22, -2 + sq, 14, 12 + sq, -24, 14 + sq], sx(c, .18), { lw: 2.4 })
    A.line(g, dk(c), 1.8, [-12, 0 + sq, -8, 12 + sq]); A.line(g, dk(c), 1.8, [2, -2 + sq, 4, 11 + sq])
    S(g, 20, 6 + sq * .6, 13, 12, sx(c, .06))
    S(g, 30, -6 + sq * .4, 12, 11, sx(c, .02))
    P(g, [36, 0 + sq * .4, 44, 8, 38, 9], '#2a1c14', { lw: 2, sd: false })
    S(g, 31, -9 + sq * .4, 5.2, 5.6, '#e8d070', { lw: 2 }); A.flat(g, 32, -9 + sq * .4, 2, 3, '#140c10')
    A.line(g, dk(c), 2, [32, -16 + sq * .4, 42, -30, 52, -32]); A.line(g, dk(c), 2, [26, -16 + sq * .4, 30, -32, 40, -40])
  }

  // --- bladder men (was: mulligans) ------------------------------------------
  function bladder (id) { var boom = id === 'mulliboom'; return function (g, t) {
    A.lw = 3
    var T = A.T, ch = A.ch, c = A.tint(t, boom ? '#b88a52' : '#c2c07a'), b = Math.sin(T * 4) * 1.2
    LM(g, [-8, 32, -9, 43], 8, sx(c, -.35)); LM(g, [8, 32, 9, 43], 8, sx(c, -.35))
    S(g, 0, 10 + b, 33 + ch * 3, 30 + ch * 3, c)
    if (boom) A.glow(g, 0, 12, 34, '#ff8a2a', .35 + ch * .4)
    A.veins(g, 0, 12, 28, boom ? '#d83a1a' : '#8a6a3a', 6, id.length * 9)
    A.line(g, '#3a2a1c', 3.4, [-30, 0, 30, 24]); A.line(g, '#3a2a1c', 3.4, [-30, 24, 30, 0])
    S(g, -14, 22, 5, 5, sx(c, -.25), { lw: 2 }); S(g, 16, 12, 4, 4, sx(c, -.25), { lw: 2 })
    LM(g, [-28, 2, -38, 16, -36, 30], 6, sx(c, -.12)); LM(g, [28, 2, 38, 16, 36, 30], 6, sx(c, -.12))
    S(g, 0, -26, 13, 12, sx(c, .06))
    P(g, [-12, -28, 12, -28, 10, -17, -10, -17], '#6a5a44', { lw: 2.4 })
    A.flat(g, -5, -23, 3, 3, '#e8dcc0'); A.flat(g, 5, -23, 3, 3, '#e8dcc0'); stitchX(g, -5, -23, 3.6, '#1a1210'); stitchX(g, 5, -23, 3.6, '#1a1210')
    if (boom) { A.line(g, '#2a1c14', 2.4, [0, -37, 4, -44]); A.flat(g, 4, -45, 3 + Math.sin(T * 20), 3 + Math.sin(T * 20), '#ffd070') }
    for (var i = 0; i < 3; i++) { var a = T * 3 + i * 2.1; S(g, Math.cos(a) * 42, -18 + Math.sin(a * 1.3) * 10, 3.4, 3, '#241f20', { lw: 1.6, hi: false }) }
  } }

  // --- spit urns (was: horfs) ------------------------------------------------
  function urn (id) { var col = id === 'blue-horf' ? '#5a82a0' : '#b0675a'; return function (g, t) {
    A.lw = 3
    var T = A.T, ch = A.ch, c = A.tint(t, col), bob = Math.sin(T * 3) * 1.6
    g.save(); g.translate(0, bob)
    function path () { g.beginPath(); g.moveTo(-15, -32); g.lineTo(15, -32); g.quadraticCurveTo(16, -22, 27, -12); g.bezierCurveTo(41, 0, 39, 28, 25, 40); g.lineTo(-25, 40); g.bezierCurveTo(-39, 28, -41, 0, -27, -12); g.quadraticCurveTo(-16, -22, -15, -32); g.closePath() }
    path(); g.fillStyle = sx(c, -.3); g.fill()
    g.save(); g.clip(); g.fillStyle = c; g.beginPath(); g.ellipse(-6, -4, 32, 40, 0, 0, TAU); g.fill(); g.fillStyle = sx(c, .26); g.beginPath(); g.ellipse(-24, -8, 5, 14, .2, 0, TAU); g.fill()
    A.line(g, dk(c), 3, [-40, 28, -20, 24, 0, 28, 20, 24, 40, 28]); A.line(g, sx(c, .3), 2, [-40, 33, -20, 29, 0, 33, 20, 29, 40, 33]); g.restore()
    path(); g.lineWidth = A.lw; g.strokeStyle = dk(c); g.lineJoin = 'round'; g.stroke()
    S(g, 0, -32, 17, 5.5, sx(c, .1)); S(g, 0, -32, 12, 3, '#1a0c0a', { lw: 1.6, hi: false })
    P(g, [-17, -6, -6, -11, -4, -4, -15, 0], '#ffe27a', { lw: 2.4, sd: false }); P(g, [17, -6, 6, -11, 4, -4, 15, 0], '#ffe27a', { lw: 2.4, sd: false })
    A.flat(g, -9, -7, 2, 2.6, '#2a1008'); A.flat(g, 9, -7, 2, 2.6, '#2a1008')
    A.mouth(g, 0, 15, 16, 3 + ch * 9, { tongue: false, n: 5, tl: .5, col: '#1a0808' })
    A.crack(g, 22, -2, 14, 2.2)
    g.restore()
  } }

  // --- hollow armour (was: knights) ------------------------------------------
  function knight (id) { var col = id === 'selfless-knight' ? '#6a5a82' : id === 'floating-knight' ? '#4a5c6a' : id === 'loose-knight' ? '#5a4a4a' : '#4f4a63', trim = '#aaa3c0'; return function (g, t) {
    A.lw = 3
    var T = A.T, c = A.tint(t, col), v = t.variant || 0, step = Math.sin(T * 8), fl = id === 'floating-knight', bob = fl ? Math.sin(T * 3) * 3 : 0
    if (fl) { P(g, [-18, 16, 18, 16, 8, 44, -2, 38, -8, 46], sx(c, -.3)) }
    else { LM(g, [-9, 26, -10, 42 + step * 2], 11, sx(c, -.35)); LM(g, [9, 26, 10, 42 - step * 2], 11, sx(c, -.35)); S(g, -10, 44 + step * 2, 9, 4.5, dk(c)); S(g, 10, 44 - step * 2, 9, 4.5, dk(c)) }
    g.save(); g.translate(0, bob)
    S(g, 0, 10, 24, 27, c); A.line(g, trim, 3, [-19, 0, 19, 0]); A.line(g, dk(c), 2, [0, 0, 0, 34])
    S(g, -28, 4, 8, 10, sx(c, .12)); S(g, 28, 4, 8, 10, sx(c, .12))
    S(g, 0, -20, 20, 20, sx(c, .08))
    P(g, [-6, -36, 0, -50, 6, -36], sx(c, .08), { lw: 2.6 })
    if (v === 3) { A.line(g, dk(c), 3, [0, -38, 0, -6]) }
    else { P(g, [-15, -25, 15, -25, 14, -18, -14, -18], '#120f16', { lw: 2.4, sd: false }); A.flat(g, -6, -21.5, 2, 1.4, '#c8503a'); A.flat(g, 6, -21.5, 2, 1.4, '#c8503a'); if (t.hp01 < .5) A.crack(g, 6, -34, 12, 1.8) }
    if (v !== 3) {
      var sxp = v === 0 ? 24 : 0, syp = v === 1 ? 6 : 8, sw = v === 1 ? 34 : 18, sh2 = 32
      g.beginPath(); if (g.roundRect) g.roundRect(sxp - sw / 2, syp - sh2 / 2, sw, sh2, 8); else g.rect(sxp - sw / 2, syp - sh2 / 2, sw, sh2)
      g.fillStyle = '#7d7692'; g.fill(); g.lineWidth = 3.4; g.strokeStyle = trim; g.stroke(); g.lineWidth = 1.6; g.strokeStyle = '#1a1620'; g.stroke()
      A.line(g, trim, 3, [sxp, syp - sh2 * .3, sxp, syp + sh2 * .3])
    }
    g.restore()
  } }

  // --- rattlers (was: bonies) ------------------------------------------------
  function bones (id) { var bone = id === 'deaths-head' ? '#e2d6b4' : '#d8cfb7'; return function (g, t) {
    A.lw = 3
    var T = A.T, b = A.tint(t, bone), big = id === 'big-bony'
    if (id === 'deaths-head') {
      var bob = Math.sin(T * 6) * 3
      g.save(); g.translate(0, bob)
      A.glow(g, 0, 0, 40, '#e0602a', .22 + A.ch * .25)
      A.horn(g, -18, -20, -2.3, 24, 9, '#3a2a2e', -.3); A.horn(g, 18, -20, -.84, 24, 9, '#3a2a2e', .3)
      A.skull(g, 0, 0, 27, b, { eyec: '#e0602a' })
      g.restore(); return
    }
    var k = big ? 1.12 : 1
    g.save(); g.scale(k, k); g.translate(0, big ? -3 : 0)
    LM(g, [-8, 30, -10, 40, -14, 46], 7, b); LM(g, [8, 30, 10, 40, 14, 46], 7, b)
    LM(g, [0, -2, 0, 32], 7, b)
    for (var i = 0; i < 3; i++) { LM(g, [-18, 6 + i * 8, 0, 8 + i * 8, 18, 6 + i * 8], 4.5, sx(b, -.04 * i)) }
    LM(g, [-18, 4, -30, 16, -30 + Math.sin(T * 6) * 4, 30], 5.5, b); LM(g, [18, 4, 30, 16, 30, 30], 5.5, b)
    A.skull(g, 0, -20, 17, b)
    g.restore()
  } }

  // --- clay golems (was: globins) --------------------------------------------
  function golem (id) { var col = id === 'black-globin' ? '#3a3238' : id === 'blue-globin' ? '#4f8b94' : '#9a7a58'; return function (g, t) {
    A.lw = 3
    var T = A.T, c = A.tint(t, col), glow = id === 'black-globin' ? '#e6e0d0' : '#ffd070'
    if (t.variant === 1) {
      S(g, 0, 26, 38, 13, sx(c, -.1)); S(g, -12, 20, 11, 7, sx(c, .1)); S(g, 16, 28, 8, 5, sx(c, .14))
      var up = (Math.sin(T * 10) + 1) * 2
      S(g, 2, 18 - up, 7, 7, c); A.flat(g, 0, 17 - up, 1.8, 1.8, glow); A.flat(g, 5, 17 - up, 1.8, 1.8, glow); return
    }
    var sq = Math.sin(T * 8) * 1.6
    LM(g, [-10, 28, -12, 42], 12, sx(c, -.3)); LM(g, [10, 28, 12, 42], 12, sx(c, -.3))
    S(g, 0, 14, 25 + sq, 24 - sq, sx(c, -.08))
    LM(g, [-22, 8, -32, 22, -30, 34], 10, sx(c, -.05)); LM(g, [22, 8, 32, 22, 30, 34], 10, sx(c, -.05)); S(g, -30, 36, 7.5, 7, c); S(g, 30, 36, 7.5, 7, c)
    S(g, 0, -10, 24, 21 - sq, c)
    ;[[-12, 14], [10, 20], [-4, 28], [15, 6]].forEach(function (p) { S(g, p[0], p[1], 4.4, 3.8, sx(c, -.2), { lw: 2, hi: false }) })
    A.line(g, dk(c), 2.4, [-14, -26, -8, -18, -12, -12]); A.line(g, dk(c), 2.4, [12, -24, 8, -14])
    S(g, -9, -11, 6, 7, '#1a1214', { lw: 2.2, hi: false }); S(g, 9, -11, 6, 7, '#1a1214', { lw: 2.2, hi: false })
    A.glow(g, -9, -11, 9, glow, .5); A.glow(g, 9, -11, 9, glow, .5)
    A.flat(g, -9, -11, 2.6, 3.2, glow); A.flat(g, 9, -11, 2.6, 3.2, glow)
    O(g, 0, 6, 10, 1.6 + A.ch * 5, '#140c10'); A.line(g, dk(c), 3, [-10, 6, 0, 8, 10, 6])
  } }

  // --- brood combs (was: hives) ----------------------------------------------
  function comb (id) { var nest = id === 'nest', col = nest ? '#6f5a42' : id === 'drowned-hive' ? '#7a8a8c' : '#c99a3a'; return function (g, t) {
    A.lw = 3
    var T = A.T, ch = A.ch, c = A.tint(t, col), b = Math.sin(T * 3) * 1
    function hexp (x, y, r) { var p = [], i; for (i = 0; i < 6; i++) { var a = TAU / 12 + i * TAU / 6; p.push(x + Math.cos(a) * r, y + Math.sin(a) * r) } return p }
    if (nest) {
      S(g, 0, 22, 38, 16, '#4a3a2a')
      for (var i = 0; i < 9; i++) { var a = i * TAU / 9 + .3; LM(g, [Math.cos(a) * 18, 12 + Math.sin(a) * 8, Math.cos(a + .5) * 30, 10 + Math.sin(a) * 18, Math.cos(a + .2) * 40, 8 + Math.sin(a) * 26], 4, sx(c, i % 2 ? -.2 : .12)) }
      S(g, 0, 10 + b, 24, 17, '#2a1c12', { lw: 3 })
      for (var q = 0; q < 3; q++) S(g, -9 + q * 9, 10 + b - q % 2 * 3, 4.6, 5.4, '#d8cfa8', { lw: 2 })
      S(g, 0, 12 + b, 32, 12, sx(c, -.1), { hi: false }); void 0
      return
    }
    g.save(); g.scale(1.22, 1.22)
    var ds = [[0, 0], [20.8, 0], [-20.8, 0], [10.4, 18], [-10.4, 18], [10.4, -18], [-10.4, -18]]
    ds.forEach(function (d, i) {
      var x = d[0], y = d[1] + b, hc = sx(c, i % 2 ? -.12 : 0)
      P(g, hexp(x, y, 12), hc, { lw: 3 })
      if (i === 0) {
        P(g, hexp(x, y, 8 + ch * 2), '#1c0e08', { lw: 2.4, sd: false }); S(g, x, y + 1, 4 + ch * 3, 4 + ch * 4, '#d8cfa8', { lw: 1.8, hi: false })
        A.flat(g, x - 1.5, y, 1.4, 1.4, '#140c10'); A.flat(g, x + 1.5, y, 1.4, 1.4, '#140c10')
      } else if (i % 3 === 0) { S(g, x + Math.sin(T * 4 + i) * 1.5, y + 1, 4.6, 6, '#e2d8b0', { lw: 1.8 }) } else { P(g, hexp(x, y, 6.5), sx(c, -.45), { lw: 1.8, sd: false }) }
    })
    g.restore()
    for (var f = 0; f < 3; f++) { var aa = T * 5 + f * 2.1; S(g, Math.cos(aa) * 36, -8 + Math.sin(aa * 1.4) * 22, 3.2, 2.8, '#241f20', { lw: 1.6, hi: false }) }
  } }

  // --- stalk eyes (was: vis) -------------------------------------------------
  function stalkEye (id) { var blood = id === 'bloodshot-eye'; return function (g, t) {
    A.lw = 3
    var T = A.T, ch = A.ch, c = A.tint(t, blood ? '#c89a88' : '#a96f58'), pul = Math.sin(T * 4) * 1
    ;[-1, 0, 1].forEach(function (d, i) { LM(g, [d * 8, 28, d * 20, 36, d * 30 + Math.sin(T * 2 + i) * 3, 42], 6, sx(c, -.3)) })
    S(g, 0, 18, 27, 20 + pul, c)
    P(g, [-10, 14, -4, 6, 0, 16], sx(c, -.15), { lw: 2, sd: false }); A.line(g, dk(c), 2, [10, 14, 16, 24])
    var r = blood ? 22 : 17
    S(g, 0, -4, r + 5, r + 4 + pul, sx(c, -.1), { lw: 3 })
    A.eye(g, 0, -4, r, { sc: blood ? '#efe4d8' : '#e8dccb', red: true, col: blood ? '#7a1219' : '#8a1a22', hot: '#ff3a2a', ir: .6 })
    if (!blood) { A.mouth(g, 0, 24, 10, 2 + ch * 5, { tongue: false, n: 5, tl: .6 }) }
    else { A.line(g, dk(c), 2.4, [-14, 28, -8, 24, -2, 29]) }
    A.line(g, dk(c), 3, [-r - 1, -16, -r + 7, -22]); A.line(g, dk(c), 3, [r + 1, -16, r - 7, -22])
  } }

  // --- ember gremlin and hooded cultist (was: imp / wizoob) ------------------
  function gremlin (id) { var wiz = id === 'wizoob'; return function (g, t) {
    A.lw = 3
    var T = A.T, ch = A.ch
    if (wiz) {
      var c = A.tint(t, '#6a6f92'), fl = Math.sin(T * 4) * 2
      g.save(); g.translate(0, fl)
      g.beginPath(); g.moveTo(-26, 40); g.bezierCurveTo(-38, -8, -18, -30, 0, -34); g.bezierCurveTo(18, -30, 38, -8, 26, 40)
      for (var i = 0; i < 4; i++) g.lineTo(26 - (i + 1) * 13 + (i % 2 ? 0 : 0), 40 + (i % 2 ? 0 : 6)); g.closePath()
      g.fillStyle = sx(c, -.3); g.fill(); g.save(); g.clip(); g.fillStyle = c; g.beginPath(); g.ellipse(-6, 0, 34, 46, 0, 0, TAU); g.fill(); g.restore()
      g.lineWidth = 3; g.strokeStyle = dk(c); g.lineJoin = 'round'; g.stroke()
      P(g, [-20, -20, 0, -52, 20, -20, 12, -26, -12, -26], sx(c, -.15))
      S(g, 0, -18, 14, 12, '#0e0e18', { lw: 2.6, hi: false })
      var eg = ch > .5 ? '#ffe36a' : '#f0e8a0'
      A.glow(g, -6, -18, 9, eg, .5); A.glow(g, 6, -18, 9, eg, .5); A.flat(g, -6, -18, 2.6, 3.4, eg); A.flat(g, 6, -18, 2.6, 3.4, eg)
      LM(g, [-24, 4, -34, 14, -26, 22], 7, sx(c, -.2)); LM(g, [24, 4, 34, 14, 26, 22], 7, sx(c, -.2))
      A.glow(g, 0, 24, 11 + ch * 8, '#9ab4ff', .6); S(g, 0, 24, 4 + ch * 2, 4 + ch * 2, '#cfe0ff', { lw: 2, hi: false })
      g.restore(); return
    }
    var c2 = A.tint(t, '#b4382b'), fw = Math.sin(T * 10) * 6
    for (var sd = -1; sd <= 1; sd += 2) P(g, [sd * 8, 0, sd * 44, -16 - fw, sd * 40, 0, sd * 33, 4, sd * 32, 14, sd * 22, 8, sd * 12, 12], sx(c2, -.32))
    LM(g, [10, 24, 28, 38, 36, 28], 4.5, sx(c2, -.3)); FL(g, 36, 26, 5, 13)
    S(g, 0, 10, 17, 20, c2); S(g, 0, -12, 17, 15, sx(c2, .06))
    P(g, [-9, -23, -5, -42, -1, -25], '#2a0c0a', { lw: 2.4 }); P(g, [-1, -25, 3, -46, 7, -25], '#2a0c0a', { lw: 2.4 }); P(g, [7, -25, 11, -39, 14, -22], '#2a0c0a', { lw: 2.4 })
    P(g, [-14, -14, -24, -12, -15, -6], sx(c2, -.1), { lw: 2.4 }); P(g, [14, -14, 24, -12, 15, -6], sx(c2, -.1), { lw: 2.4 })
    A.flat(g, -7, -14, 4.4, 2.6, '#f4e07a'); A.flat(g, 7, -14, 4.4, 2.6, '#f4e07a'); A.flat(g, -7, -14, 1.2, 2.4, '#1a0808'); A.flat(g, 7, -14, 1.2, 2.4, '#1a0808')
    A.mouth(g, 0, -3, 8, 2 + ch * 4, { tongue: false, n: 4, tl: .6 })
  } }

  // --- whole sack (was: walking-sack) ----------------------------------------
  function patchSack (g, t) {
    A.lw = 3
    var T = A.T, ch = A.ch, c = A.tint(t, '#b89f78'), b = Math.sin(T * 5) * 1.2
    LM(g, [-10, 32, -12, 42], 8, '#6b5a40'); LM(g, [10, 32, 12, 42], 8, '#6b5a40'); S(g, -13, 44, 9, 4.5, '#2e2420'); S(g, 13, 44, 9, 4.5, '#2e2420')
    LM(g, [-28, 12, -38, 22, -36, 32], 6, sx(c, -.2)); LM(g, [28, 12, 38, 22, 36, 32], 6, sx(c, -.2))
    S(g, 0, 8 + b, 31, 35, c)
    P(g, [-6, -22, -14, -36, -4, -30, 0, -42, 4, -30, 14, -36, 6, -22], sx(c, -.06), { lw: 2.6 })
    A.line(g, '#4a3626', 3.4, [-14, -22, 0, -19, 14, -22])
    P(g, [-24, 14, -10, 12, -12, 28, -24, 30], '#8f6a5a', { lw: 2, sd: false }); A.stitches(g, -24, 14, -10, 12, 4, '#2a1c14', 2.4)
    P(g, [10, 26, 24, 22, 22, 34, 12, 34], '#6a7a6a', { lw: 2, sd: false })
    A.crack(g, 8, -4, 12, 1.2, '#000')
    S(g, -10, -8 + b, 8, 7, '#20120c', { lw: 2.4, hi: false }); S(g, 10, -8 + b, 8, 7, '#20120c', { lw: 2.4, hi: false })
    A.flat(g, -10, -8 + b, 4.4, 4.4, '#e8dcc0'); A.flat(g, 10, -8 + b, 4.4, 4.4, '#e8dcc0'); A.flat(g, -10 + Math.cos(T) * 1.4, -8 + b, 2, 2.4, '#140c10'); A.flat(g, 10 + Math.cos(T) * 1.4, -8 + b, 2, 2.4, '#140c10')
    A.line(g, '#2a1c14', 3, [-12, 12 + b, -6, 8 + b - ch * 3, 0, 12 + b, 6, 8 + b - ch * 3, 12, 12 + b])
    for (var i = -3; i <= 3; i++) A.line(g, '#2a1c14', 1.6, [i * 4, 8 + b, i * 4 + (i % 2) * 2, 14 + b])
  }

  // --- butchers (was: bruisers) ----------------------------------------------
  function butcher (id) { var hulk = id === 'blood-hulk'; return function (g, t) {
    A.lw = 3
    var T = A.T, ch = A.ch, c = A.tint(t, hulk ? '#a3363a' : '#b88a96'), st = Math.sin(T * 8) * 2
    LM(g, [-12, 26, -13, 40 + st], 14, sx(c, -.4)); LM(g, [12, 26, 13, 40 - st], 14, sx(c, -.4)); S(g, -13, 43 + st, 10, 5, dk(c)); S(g, 13, 43 - st, 10, 5, dk(c))
    P(g, [-30, -8, 30, -8, 24, 34, -24, 34], c)
    P(g, [-18, 2, 18, 2, 15, 34, -15, 34], hulk ? '#d8c8b0' : '#e8dcc8', { lw: 2.6 })
    A.line(g, '#5a2a24', 2.6, [-9, 12, -4, 14, -8, 24]); A.flat(g, 6, 20, 3, 4, hulk ? '#8a2428' : '#b86a6a')
    LM(g, [-26, -4, -38, 12, -38, 24 + ch * -4], 12, sx(c, -.1)); LM(g, [26, -4, 38, 12, 38, 24 - ch * 4], 12, sx(c, -.1))
    S(g, -38, 28 - ch * 4, 11, 10.5, sx(c, .06)); S(g, 38, 28 - ch * 4, 11, 10.5, sx(c, .06))
    for (var i = -1; i <= 1; i++) { A.line(g, dk(c), 1.6, [-38 + i * 4, 24 - ch * 4, -38 + i * 4, 31 - ch * 4]); A.line(g, dk(c), 1.6, [38 + i * 4, 24 - ch * 4, 38 + i * 4, 31 - ch * 4]) }
    S(g, 0, -22, 15, 12, sx(c, .08))
    P(g, [-8, -12, -12, -2, -4, -9], '#eadfc4', { lw: 2, sd: false }); P(g, [8, -12, 12, -2, 4, -9], '#eadfc4', { lw: 2, sd: false })
    A.line(g, '#1c0c10', 4.4, [-11, -28, -3, -23]); A.line(g, '#1c0c10', 4.4, [11, -28, 3, -23])
    A.flat(g, -6, -22, 2.4, 2.4, '#f0d070'); A.flat(g, 6, -22, 2.4, 2.4, '#f0d070')
    A.line(g, '#1c0c10', 3, [-7, -13, 0, -11 - ch * 2, 7, -13])
    if (hulk) { A.line(g, '#8a8a92', 3, [24, 8, 24, 24, 20, 28]) }
  } }

  // --- ticks (was: spiders) --------------------------------------------------
  function tick (id) { var rock = id === 'rock-spider'; return function (g, t) {
    A.lw = 3
    var T = A.T, c = A.tint(t, rock ? '#8f8a82' : '#c8c49a'), w = Math.sin(T * 14) * 2.4, i, sd
    for (sd = -1; sd <= 1; sd += 2) for (i = 0; i < 4; i++) { var y = -8 + i * 10; A.leg(g, sd * 12, y, sd * 28, y - 9 + (i % 2 ? w : -w), sd * 38, y + 8, 3.6, sx(c, -.35)) }
    S(g, 0, 10, 25, 21, c)
    if (rock) { [[-12, 4, 9], [8, 0, 10], [-2, 16, 9], [16, 14, 7], [-16, 18, 6]].forEach(function (r) { P(g, [r[0] - r[2], r[1], r[0] - r[2] * .4, r[1] - r[2] * .8, r[0] + r[2] * .6, r[1] - r[2] * .7, r[0] + r[2], r[1] + r[2] * .3, r[0], r[1] + r[2] * .8], '#a8a39a', { lw: 2.2 }) }) }
    else { A.veins(g, 0, 12, 22, '#7a8a5a', 5, 11); S(g, 0, 20, 8, 5.4, '#2a2418', { lw: 2, hi: false }) }
    S(g, 0, -14, 12, 9, sx(c, .08))
    P(g, [-3.5, -20, 3.5, -20, 1.4, -35, -1.4, -35], '#c8a8a0', { lw: 2.2, sd: false })
    S(g, -6, -15, 2.8, 2.8, '#e8d070', { lw: 1.8, hi: false }); S(g, 6, -15, 2.8, 2.8, '#e8d070', { lw: 1.8, hi: false })
    for (sd = -1; sd <= 1; sd += 2) LM(g, [sd * 9, -17, sd * 15, -26, sd * 11, -33], 3.2, sx(c, -.2))
  } }

  // --- wisps (was: ghosts) ---------------------------------------------------
  function wisp (id) { var col = id === 'red-ghost' ? '#b24a52' : '#8a8aa8'; return function (g, t) {
    A.lw = 3
    var T = A.T, c = A.tint(t, col), w = Math.sin(T * 4) * 3, ch = A.ch
    A.glow(g, 0, 0, 52, c, .28)
    g.save(); g.translate(w, 0)
    function path () { g.beginPath(); g.moveTo(0, -42); g.bezierCurveTo(32, -20, 36, 14, 14, 30); g.quadraticCurveTo(6, 44, -14 + w, 44); g.quadraticCurveTo(-8, 36, -16, 28); g.bezierCurveTo(-36, 14, -32, -20, 0, -42); g.closePath() }
    path(); g.fillStyle = sx(c, -.3); g.fill(); g.save(); g.clip(); g.globalAlpha = .96; g.fillStyle = c; g.beginPath(); g.ellipse(-6, -6, 32, 44, 0, 0, TAU); g.fill(); g.fillStyle = sx(c, .3); g.beginPath(); g.ellipse(-16, -24, 5, 13, .4, 0, TAU); g.fill(); g.restore()
    path(); g.lineWidth = A.lw; g.strokeStyle = dk(c); g.lineJoin = 'round'; g.stroke()
    EY(g, 0, -6, 12, '#f4f0e0', { col: id === 'red-ghost' ? '#8a1a22' : '#3a3a6a' })
    A.line(g, dk(c), 3, [-12, 14, -4, 17 + ch * 3, 4, 14, 12, 17 + ch * 3])
    g.restore()
  } }

  // --- the rest: one bespoke design per id -----------------------------------
  var LUMPS = {
    'lump': function (g, t, c) { // sprouting turnip
      var T = A.T, ch = A.ch, p = Math.sin(T * 5)
      for (var i = -1; i <= 1; i++) { var lx = i * 9, sw = Math.sin(T * 3 + i) * 3; P(g, [lx - 5, -20, lx + sw - 3, -42 - Math.abs(i) * -3, lx + 5 + sw, -22], '#5a8a4a', { lw: 2.4 }); A.line(g, '#2e4a28', 1.6, [lx, -22, lx + sw, -38]) }
      P(g, [-6, 36, 0, 48, 6, 36], sx(c, -.3), { lw: 2.4 })
      S(g, 0, 10, 32, 30 + p, c)
      S(g, 0, -17, 12, 5, '#6a9a52', { lw: 2.4 })
      A.line(g, dk(c), 2, [-24, 4, -18, 14]); A.line(g, dk(c), 2, [22, 0, 17, 9])
      S(g, -10, 4, 5, 4.4, '#1a1214', { lw: 2, hi: false }); S(g, 10, 4, 5, 4.4, '#1a1214', { lw: 2, hi: false }); A.flat(g, -9, 4, 1.6, 1.8, '#e8dcc0'); A.flat(g, 11, 4, 1.6, 1.8, '#e8dcc0')
      A.line(g, '#1a1214', 3, [-14, -3, -6, 0]); A.line(g, '#1a1214', 3, [14, -3, 6, 0])
      O(g, 0, 18, 8, 2 + ch * 6, '#1e0a10'); L(g, '#1e0a10', 2.6, [-9, 17, 9, 17])
    },
    'gurgle': function (g, t, c) { // bog pitcher plant
      var T = A.T, ch = A.ch, sl = Math.sin(T * 3)
      for (var sd = -1; sd <= 1; sd += 2) P(g, [sd * 18, 24, sd * 42, 10 + sl * 2, sd * 40, 26, sd * 22, 34], sx(c, -.15))
      ;[-14, 0, 14].forEach(function (x, i) { LM(g, [x, 36, x + (i - 1) * 8, 44], 5, sx(c, -.4)) })
      g.beginPath(); g.moveTo(-14, -24); g.lineTo(14, -24); g.bezierCurveTo(30, -4, 30, 24, 16, 38); g.lineTo(-16, 38); g.bezierCurveTo(-30, 24, -30, -4, -14, -24); g.closePath()
      g.fillStyle = sx(c, -.3); g.fill(); g.save(); g.clip(); g.fillStyle = c; g.beginPath(); g.ellipse(-4, 4, 26, 36, 0, 0, TAU); g.fill(); g.fillStyle = sx(c, .26); g.beginPath(); g.ellipse(-14, -4, 4, 14, .2, 0, TAU); g.fill()
      for (var i = 0; i < 4; i++) A.line(g, sx(c, -.35), 2, [-24, 4 + i * 8, 24, 4 + i * 8 + 2]); g.restore()
      g.lineWidth = A.lw; g.strokeStyle = dk(c); g.lineJoin = 'round'; g.stroke()
      S(g, 0, -24, 18, 7, sx(c, .12)); S(g, 0, -24, 13, 4, '#2a3a1a', { lw: 1.6, hi: false }); S(g, -4 + sl * 4, -24 - ch * 4, 5, 3 + ch * 3, '#b8d870', { lw: 1.6, hi: false })
      P(g, [-14, -2, -6, -8, -4, 0, -12, 4], '#e8e070', { lw: 2.2, sd: false }); P(g, [14, -2, 6, -8, 4, 0, 12, 4], '#e8e070', { lw: 2.2, sd: false })
      A.flat(g, -8, -3, 1.8, 2.2, '#2a1c0a'); A.flat(g, 8, -3, 1.8, 2.2, '#2a1c0a')
      A.drip(g, 10, -20, 14 + ch * 6, '#b8d870', 2.2)
    },
    'spitty': function (g, t, c) { // cannon snail
      var T = A.T, ch = A.ch
      S(g, 0, 34, 38, 9, '#d9b58a')
      S(g, -8, 6, 28, 27, c)
      for (var r = 0; r < 4; r++) { g.beginPath(); g.ellipse(-8 - r * .5, 6, 22 - r * 5.5, 21 - r * 5.2, 0, -1.2, 4.4); g.lineWidth = 2.4; g.strokeStyle = dk(c); g.stroke() }
      LM(g, [14, 30, 26, 18, 30, 4], 12, '#d9b58a')
      S(g, 31, 0, 10, 9, '#d9b58a')
      P(g, [34, -6, 56, -9, 56, 6, 34, 8], '#7a7268'); P(g, [52, -11, 60, -12, 60, 9, 52, 8], '#5a5248', { lw: 2.4 })
      if (ch > 0) A.glow(g, 58, -1, 10 + ch * 10, '#d8e070', .5 + ch * .4)
      LM(g, [26, -4, 22, -20], 3, '#d9b58a'); LM(g, [34, -6, 36, -22], 3, '#d9b58a')
      EY(g, 22, -22, 4.6, '#efe6d2'); EY(g, 36, -24, 4.6, '#efe6d2')
    },
    'swinger': function (g, t, c) { // flail crawler
      var T = A.T, a = Math.sin(T * 3) * .9 - 2.2, bx = Math.cos(a) * 34, by = Math.sin(a) * 34 - 4
      LM(g, [-14, 28, -16, 40], 8, sx(c, -.3)); LM(g, [14, 28, 16, 40], 8, sx(c, -.3))
      S(g, 0, 12, 22, 22, '#6a6670'); S(g, 0, -12, 16, 15, sx(c, .06)); P(g, [-14, -14, 14, -14, 12, -8, -12, -8], '#120f16', { lw: 2.4, sd: false })
      A.flat(g, -5, -11, 1.8, 1.4, '#d0503a'); A.flat(g, 5, -11, 1.8, 1.4, '#d0503a')
      for (var i = 1; i < 5; i++) S(g, bx * i / 5, by * i / 5, 3.4, 2.6, '#4a4650', { lw: 2, hi: false, rot: a })
      A.spikes(g, bx, by, 11, 8, 8, '#a8a4ae', T); S(g, bx, by, 11, 11, '#6a6670')
    },
    'swarmer': function (g, t, c) { // frogspawn cluster
      var T = A.T, ch = A.ch
      S(g, 0, 34, 40, 9, sx(c, -.3), { hi: false })
      ;[[-22, 22], [-6, 28], [14, 26], [28, 18], [-30, 4], [-14, 8], [6, 10], [22, 0], [-20, -14], [0, -8], [16, -18], [-6, -26]].forEach(function (e, i) {
        var wb = Math.sin(T * 3 + i) * 1.2
        S(g, e[0], e[1] + wb, 11, 11, '#bcc4b4', { lw: 2.4 })
        S(g, e[0] + 1, e[1] + 1 + wb, 4.6, 5.4, ch > .3 ? '#c83a30' : '#2a2630', { lw: 1.6, hi: false })
      })
    },
    'boil': function (g, t, c) { // pustule mound
      var T = A.T, p = Math.sin(T * 5) * 1.4, ch = A.ch
      S(g, 0, 26, 42, 16, sx(c, -.15)); S(g, 0, 8, 32, 26 + p, c)
      S(g, 0, 2, 22, 17, '#c86a64', { lw: 2.4 }); A.veins(g, 0, 2, 22, '#7a2a30', 5, 4)
      S(g, 0, 0, 13 + ch * 3, 11 + ch * 3, '#ece2a0', { lw: 2.4 }); S(g, 0, 0, 5, 5, '#c9a43a', { lw: 1.6, hi: false })
      A.line(g, '#7a2a30', 2.4, [-30, 14, -20, 22]); A.line(g, '#7a2a30', 2.4, [28, 12, 20, 22])
    },
    'wall-hugger': function (g, t, c) { // limpet
      var T = A.T, ch = A.ch
      S(g, 0, 34, 42, 8, '#a8909a'); S(g, 0, 34, 20, 5, '#3a2430', { lw: 2, hi: false })
      P(g, [-36, 32, -26, 4, -8, -18, 0, -24, 8, -18, 26, 4, 36, 32], c)
      for (var i = -3; i <= 3; i++) A.line(g, dk(c), 2.4, [i * 3, -20, i * 11, 32])
      S(g, 0, -22, 5, 3.6, sx(c, .2), { lw: 2 })
      EY(g, -14, 38, 3.6, '#efe6d2'); EY(g, 14, 38, 3.6, '#efe6d2')
      O(g, 0, 28 + ch * 2, 12, 2 + ch * 3, '#1a0c10')
    },
    'fissure': function (g, t, c) { // cracked slab with eye
      var T = A.T, ch = A.ch
      P(g, [-34, 30, -38, 2, -24, -24, 4, -34, 30, -22, 38, 8, 30, 34], c)
      P(g, [-24, -24, 4, -34, 30, -22, 14, -14, -10, -12], sx(c, .14), { lw: 2.4, sd: false })
      A.glow(g, 0, 8, 30, '#ff7a2a', .3 + ch * .35)
      P(g, [-2, -16, 10, -4, 4, 6, 14, 20, 4, 30, -2, 14, -10, 4, -4, -6], '#1a0c08', { lw: 2.6, sd: false })
      A.line(g, '#ff9a3a', 2, [-2, -14, 6, -2, 0, 8, 8, 20])
      EY(g, 2, 6, 7, '#f0e0b0', { col: '#a02a10', sq: .8 })
      A.crack(g, -22, 12, 14, .4); A.crack(g, 22, 10, 12, 2.6)
    },
    'mole': function (g, t, c) { // digger
      var T = A.T, ch = A.ch, sw = Math.sin(T * 8) * 3
      S(g, 0, 30, 44, 15, '#5a402e'); S(g, 0, 10, 31, 27, c)
      for (var sd = -1; sd <= 1; sd += 2) { LM(g, [sd * 26, 22, sd * 36, 32 + sw * sd], 7, '#8a6a4f'); for (var f = 0; f < 3; f++) P(g, [sd * (34 + f * 3), 31 + sw * sd - 3, sd * (46 + f * 3), 36 + f * 3 + sw * sd, sd * (38 + f * 3), 38 + f * 3 + sw * sd], '#e8dcc0', { lw: 2, sd: false }) }
      S(g, 0, 4, 11, 9, '#d09090', { lw: 2.6 }); A.flat(g, -3, 3, 2, 2.4, '#2a1010'); A.flat(g, 3, 3, 2, 2.4, '#2a1010')
      A.flat(g, -9, -4, 2, 2, '#140c10'); A.flat(g, 9, -4, 2, 2, '#140c10')
      P(g, [-4, 10, -1, 10, -2, 18 + ch * 3], '#f1e8d6', { lw: 1.8, sd: false }); P(g, [4, 10, 1, 10, 2, 18 + ch * 3], '#f1e8d6', { lw: 1.8, sd: false })
    },
    'grackle': function (g, t, c) { // carrion bird
      var T = A.T, ch = A.ch, f = Math.sin(T * 6) * 2
      LM(g, [-8, 28, -9, 40], 4, '#c8a050'); LM(g, [8, 28, 9, 40], 4, '#c8a050')
      for (var sd = -1; sd <= 1; sd += 2) { P(g, [sd * 4, 22, sd * 8, 40, sd * 1, 34], sx(c, -.3), { lw: 2.4 }); P(g, [sd * 18, -2, sd * 36, 10 + f, sd * 26, 30, sd * 14, 26], sx(c, -.15)) }
      S(g, 0, 10, 21, 24, c); S(g, 0, 18, 11, 12, sx(c, .22), { lw: 2 })
      S(g, 0, -18, 14, 13, sx(c, .04))
      P(g, [-3, -30, 0, -40, 4, -30], sx(c, -.1), { lw: 2.2 })
      P(g, [-7, -14, 7, -14, 0, 2 + ch * 3], '#d8b84a', { lw: 2.6 }); A.line(g, dk('#d8b84a'), 1.6, [-5, -11, 5, -11])
      S(g, -7, -20, 4, 4, '#f0e8a0', { lw: 2, hi: false }); S(g, 7, -20, 4, 4, '#f0e8a0', { lw: 2, hi: false }); A.flat(g, -7, -20, 1.6, 1.6, '#140c10'); A.flat(g, 7, -20, 1.6, 1.6, '#140c10')
    },
    'poly': function (g, t, c) { // anemone
      var T = A.T, ch = A.ch
      S(g, 0, 36, 22, 8, sx(c, -.3)); LM(g, [0, 34, 2, 14, 0, 0], 18, sx(c, -.1))
      for (var i = 0; i < 8; i++) { var a = -Math.PI + (i + .5) * Math.PI / 8 * 1.0 - .0, wv = Math.sin(T * 3 + i) * 4, tx = Math.cos(a) * 36 + wv, ty = -4 + Math.sin(a) * 38; LM(g, [Math.cos(a) * 6, -2, Math.cos(a) * 20 + wv * .5, -4 + Math.sin(a) * 20, tx, ty], 6, sx(c, i % 2 ? 0 : .08)); S(g, tx, ty, 4.4, 4.4, '#d8c0f0', { lw: 2, hi: false }) }
      S(g, 0, 0, 15, 12, c); S(g, 0, 1, 9, 6 + ch * 4, '#2a1030', { lw: 2.4, hi: false })
      for (var k = -2; k <= 2; k++) P(g, [k * 3.4 - 1.4, -3, k * 3.4 + 1.4, -3, k * 3.4, 2 + ch * 2], '#f1e8d6', { lw: 1.2, sd: false })
    },
    'coal-boy': function (g, t, c) { // coal chunk
      var T = A.T, ch = A.ch
      P(g, [-30, 28, -34, 4, -22, -20, 0, -28, 24, -20, 34, 6, 28, 30, 0, 36], c)
      P(g, [-22, -20, 0, -28, 24, -20, 4, -10, -16, -8], '#5a5458', { lw: 2.2, sd: false })
      P(g, [-34, 4, -22, -20, -16, -8, -24, 12], '#4a4448', { lw: 2.2, sd: false })
      A.line(g, '#ff8a2a', 2.4, [-14, 14, -4, 22, 6, 18, 16, 28]); A.line(g, '#ff8a2a', 2, [18, -4, 24, 8])
      S(g, -9, -2, 5.6, 5.6, '#f0a030', { lw: 2.2, hi: false }); S(g, 9, -2, 5.6, 5.6, '#f0a030', { lw: 2.2, hi: false }); A.flat(g, -9, -2, 2, 3, '#1a0c08'); A.flat(g, 9, -2, 2, 3, '#1a0c08')
      O(g, 0, 12, 8, 1.6 + ch * 5, '#1a0c08')
      FL(g, 2, -26, 8, 18 + Math.sin(T * 12) * 3)
    },
    'stonehead': function (g, t, c) { // carved block
      var ch = A.ch
      P(g, [-30, -22, -22, -32, 22, -32, 30, -22, 30, 26, 22, 34, -22, 34, -30, 26], c)
      P(g, [-30, -22, -22, -32, 22, -32, 30, -22, 20, -18, -20, -18], sx(c, .14), { lw: 2.2, sd: false })
      P(g, [-24, -8, -4, -12, -4, -2, -22, 2], '#4a463e', { lw: 2.4, sd: false }); P(g, [24, -8, 4, -12, 4, -2, 22, 2], '#4a463e', { lw: 2.4, sd: false })
      A.flat(g, -12, -6, 3.4, 3, '#e8c060'); A.flat(g, 12, -6, 3.4, 3, '#e8c060')
      P(g, [-14, 16, 14, 16, 12, 22 + ch * 8, -12, 22 + ch * 8], '#1a1210', { lw: 2.2, sd: false })
      A.crack(g, 14, -30, 20, 1.8); S(g, -22, 28, 9, 5, '#5a8a4a', { lw: 2, hi: false })
    },
    'dust': function (g, t, c) { // dust bunny
      var T = A.T, ch = A.ch
      for (var i = 0; i < 16; i++) { var a = i * TAU / 16 + Math.sin(T * 2 + i) * .06, r1 = 24, r2 = 36 + (i % 3) * 3 + Math.sin(T * 4 + i) * 1.5; P(g, [Math.cos(a - .18) * r1, 6 + Math.sin(a - .18) * r1, Math.cos(a) * r2, 6 + Math.sin(a) * r2, Math.cos(a + .18) * r1, 6 + Math.sin(a + .18) * r1], sx(c, i % 2 ? -.1 : .1), { lw: 2, sd: false }) }
      S(g, 0, 6, 28, 26, c)
      S(g, -9, 0, 5.6, 5.6, '#2a2420', { lw: 2, hi: false }); S(g, 9, 0, 5.6, 5.6, '#2a2420', { lw: 2, hi: false }); A.flat(g, -8, -1, 1.8, 1.8, '#fff'); A.flat(g, 10, -1, 1.8, 1.8, '#fff')
      O(g, 0, 14, 6 + ch * 3, 2 + ch * 5, '#2a2420')
    },
    'ash-pile': function (g, t, c) { // smouldering heap
      var T = A.T, ch = A.ch
      S(g, 0, 26, 42, 14, sx(c, -.15)); S(g, 0, 10, 31, 26, c); S(g, -6, 4, 16, 14, sx(c, .12), { lw: 2.2 })
      for (var i = 0; i < 4; i++) A.line(g, '#ff8a2a', 2, [-16 + i * 11, 18, -14 + i * 11, 25])
      S(g, -9, 8, 4.6, 5, '#2a2420', { lw: 2, hi: false }); S(g, 9, 8, 4.6, 5, '#2a2420', { lw: 2, hi: false }); A.flat(g, -9, 8, 1.6, 2, '#ff9a3a'); A.flat(g, 9, 8, 1.6, 2, '#ff9a3a')
      O(g, 0, 20, 6, 1.6 + ch * 4, '#1a1410')
      for (var e = 0; e < 3; e++) { var f = (T * .7 + e * .33) % 1; A.flat(g, -14 + e * 14 + Math.sin(T * 3 + e) * 3, -10 - f * 28, 2.2 - f, 2.2 - f, '#ff9a3a') }
    },
    'cinder': function (g, t, c) { // live ember
      var T = A.T, ch = A.ch
      A.glow(g, 0, 4, 46, '#ff7a2a', .28 + ch * .3)
      for (var i = 0; i < 9; i++) { var a = i * TAU / 9 + T * .5; P(g, [Math.cos(a - .2) * 20, 6 + Math.sin(a - .2) * 20, Math.cos(a) * 34, 6 + Math.sin(a) * 34, Math.cos(a + .2) * 20, 6 + Math.sin(a + .2) * 20], '#3a2420', { lw: 2.2, sd: false }) }
      S(g, 0, 6, 25, 25, c)
      A.line(g, '#ff8a2a', 2.4, [-14, -6, -4, 4, -12, 14]); A.line(g, '#ff8a2a', 2.4, [12, -10, 6, 2, 14, 12])
      S(g, -8, 2, 4.6, 5, '#fff0b0', { lw: 2, hi: false }); S(g, 8, 2, 4.6, 5, '#fff0b0', { lw: 2, hi: false }); A.flat(g, -8, 3, 1.6, 2.2, '#1a0c08'); A.flat(g, 8, 3, 1.6, 2.2, '#1a0c08')
      FL(g, 0, -18, 9, 18 + Math.sin(T * 12) * 3)
    },
    'blood-puppy': function (g, t, c) { // gnasher hound
      var T = A.T, ch = A.ch, p = Math.sin(T * 9) * 2
      S(g, -12, 40, 7, 4, dk(c), { lw: 2.4 }); S(g, 12, 40, 7, 4, dk(c), { lw: 2.4 })
      S(g, 0, 18, 22, 21, c); S(g, 0, 22, 12, 12, sx(c, .2), { lw: 2 })
      P(g, [-20, -20, -34, -8 + p, -26, 10 + p, -14, -6], sx(c, -.3)); P(g, [20, -20, 34, -8 + p, 26, 10 + p, 14, -6], sx(c, -.3))
      S(g, 0, -12, 18, 16, sx(c, .04)); S(g, 0, -4, 11, 8, '#d8a090', { lw: 2.4 })
      S(g, 0, -8, 4, 3, '#1a0c10', { lw: 1.6, hi: false })
      A.line(g, '#2a0c10', 4.4, [-16, -22, -4, -16]); A.line(g, '#2a0c10', 4.4, [16, -22, 4, -16])
      S(g, -8, -14, 3.4, 3.4, '#f8d86a', { lw: 1.8, hi: false }); S(g, 8, -14, 3.4, 3.4, '#f8d86a', { lw: 1.8, hi: false })
      O(g, 0, 1, 8, 1.4 + ch * 4, '#1a0608'); P(g, [-6, 0, -3, 0, -4.5, 5], '#f1e8d6', { lw: 1.4, sd: false }); P(g, [6, 0, 3, 0, 4.5, 5], '#f1e8d6', { lw: 1.4, sd: false })
      for (var i = -3; i <= 3; i++) P(g, [i * 4 - 2, 10, i * 4 + 2, 10, i * 4, 15], '#c8c0b0', { lw: 1.6, sd: false })
    }
  }
  var LUMPCOL = { 'lump': '#8a5d7a', 'gurgle': '#4f8a80', 'spitty': '#c58a52', 'swinger': '#8f8a96', 'swarmer': '#8a9a7a', 'boil': '#d49a8a', 'wall-hugger': '#8a6a7a', 'fissure': '#8a6a58', 'mole': '#6a4f3a', 'grackle': '#3e4a38', 'poly': '#8a6aa8', 'coal-boy': '#2e2a2e', 'stonehead': '#8a857c', 'dust': '#a89878', 'ash-pile': '#6a6560', 'cinder': '#3a2a26', 'blood-puppy': '#9a3a3a' }
  function lump (id) { return function (g, t) { A.lw = 3; LUMPS[id](g, t, A.tint(t, LUMPCOL[id])) } }

  // --- registration ---------------------------------------------------------
  reg(Object.keys(DRUDGE), drudge, 30)
  reg(['fatty', 'flaming-fatty', 'gutted-fatty', 'bloated-fatty', 'conjoined-fatty'], tallow, 32)
  reg(Object.keys(FLIES), beetle, 26)
  reg(['hell-bird', 'grudge-bat'], bat, 26)
  reg(Object.keys(WORMS), worm, 26)
  reg(['snapper'], function () { return snapper }, 28)
  reg(['clotty', 'grilled-clotty', 'blurb', 'lil-blub'], jelly, 30)
  reg(['hopper'], function () { return hopper }, 28)
  reg(['mulligan', 'mulliboom'], bladder, 30)
  reg(['horf', 'blue-horf'], urn, 30)
  reg(['knight', 'selfless-knight', 'floating-knight', 'loose-knight'], knight, 28)
  reg(['bony', 'big-bony', 'deaths-head'], bones, 28)
  reg(['globin', 'black-globin', 'blue-globin'], golem, 28)
  reg(['hive', 'nest', 'drowned-hive'], comb, 30)
  reg(['vis', 'bloodshot-eye'], stalkEye, 28)
  reg(['imp', 'wizoob'], gremlin, 28)
  reg(['walking-sack'], function () { return patchSack }, 30)
  reg(['blood-hulk', 'blood-feeder'], butcher, 32)
  reg(['rock-spider', 'wall-creep'], tick, 28)
  reg(['poof-ghost', 'red-ghost'], wisp, 28)
  reg(Object.keys(LUMPS), lump, 30)

  IS.spriteKit = { C: C, sh: sh, O: O, L: L, Pg: Pg, eye: eye, cracks: cracks, def: def }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
