;(function (IS) {
  'use strict'
  /*
   * Grid objects (rocks, poop, TNT, spikes, pits, fires ...), the placed bomb and the
   * explosion painter. Every painter works in an 80-unit tile space centred on (0,0)
   * (the sprite wrapper scales by size/80), light from the upper left, a ~3px dark
   * outline and two-tone shading. Registered by direct assignment so these override the
   * placeholder shapes in sprites-core.js (this file loads after it).
   * t.variant carries a per-object seed so no two rocks look alike.
   */
  var A = IS.art, sh = A.sh, al = A.al, TAU = Math.PI * 2
  var OL = '#150e0b'

  function hstr (s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
  function seedOf (t) { var v = t && t.variant; return typeof v === 'number' ? (v | 0) : v ? hstr(v) : 0 }
  function rnd (seed) {
    var s = (seed | 0) >>> 0
    return function () {
      s = (s + 0x6d2b79f5) >>> 0
      var q = Math.imul(s ^ (s >>> 15), 1 | s)
      q = (q + Math.imul(q ^ (q >>> 7), 61 | q)) ^ q
      return ((q ^ (q >>> 14)) >>> 0) / 4294967296
    }
  }
  function clamp (v, a, b) { return v < a ? a : v > b ? b : v }
  function tinted (t, c) { var k = t && t.tint; return (k && k !== '#fff' && k !== '#ffffff' && /^#[0-9a-f]{6}$/i.test(k)) ? k : c }

  /* smooth closed lumpy path (current path is left set for fill/clip/stroke) */
  function lumpPath (g, R, cx, cy, rx, ry, n, j) {
    var pts = [], i, a, k, P = new Path2D()
    for (i = 0; i < n; i++) { a = (i + R() * .35) / n * TAU - 1.2; k = 1 - j * R(); pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]) }
    P.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2)
    for (i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; P.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2) }
    P.closePath()
    return P
  }
  function ell (cx, cy, rx, ry) { var P = new Path2D(); P.ellipse(cx, cy, rx, ry, 0, 0, TAU); return P }
  function rrect (x, y, w, h, r) { var P = new Path2D(); if (P.roundRect) P.roundRect(x, y, w, h, r); else P.rect(x, y, w, h); return P }

  /* fill the current path with two-tone shading, clip to it, call extra(g) for details, outline it */
  function solid (g, P, base, cx, cy, rx, ry, extra, lw) {
    g.save()
    g.fillStyle = base; g.fill(P); g.clip(P)
    var gr = g.createRadialGradient(cx - rx * .35, cy - ry * .42, Math.min(rx, ry) * .1, cx, cy, Math.max(rx, ry) * 1.15)
    gr.addColorStop(0, sh(base, .26)); gr.addColorStop(.5, base); gr.addColorStop(1, sh(base, -.5))
    g.fillStyle = gr; g.fillRect(cx - rx * 1.5, cy - ry * 1.5, rx * 3, ry * 3)
    /* dark underside: everything outside a window shifted up-left */
    g.beginPath(); g.rect(cx - rx * 2, cy - ry * 2, rx * 4, ry * 4); g.ellipse(cx - rx * .12, cy - ry * .2, rx * .98, ry * .9, 0, 0, TAU, true)
    g.fillStyle = 'rgba(8,4,3,.3)'; g.fill('evenodd')
    if (extra) extra(g)
    g.restore()
    g.lineWidth = lw || 3.4; g.lineJoin = 'round'; g.strokeStyle = OL; g.stroke(P)
  }
  function hilite (g, x, y, rx, ry, rot, a) {
    g.fillStyle = 'rgba(255,248,230,' + (a || .3) + ')'; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); g.fill()
  }
  function polyline (g, col, w, pts) {
    g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0], pts[1])
    for (var i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.stroke()
  }
  function crackAt (g, R, x, y, ang, len, w, col) {
    var pts = [x, y], n = 3 + (R() * 2 | 0)
    for (var i = 0; i < n; i++) { ang += (R() - .5) * 1.3; x += Math.cos(ang) * len / n; y += Math.sin(ang) * len / n; pts.push(x, y) }
    polyline(g, 'rgba(255,245,225,.16)', w + 1, pts.map(function (v, i) { return i % 2 ? v + 1.4 : v + .8 }))
    polyline(g, col || 'rgba(12,7,5,.8)', w, pts)
  }
  /* Static painters render once into a 256px canvas (2px per unit, +-64 units) keyed by quantised
     seed/hp/charge, so a room full of rocks costs a drawImage each instead of dozens of gradients. */
  var sheetCache = Object.create(null)
  function reg (name, fn, animated, cache) {
    IS.sprites[name] = function (g, s, t) {
      var k = s / 80, hp = t.hp01 == null ? 1 : t.hp01
      if (cache && typeof document !== 'undefined') {
        var hq = hp > .75 ? 1 : hp > .5 ? .7 : hp > .25 ? .4 : .2, cq = Math.round(clamp(t.charge || 0, 0, 1) * 4) / 4, sq = (seedOf(t) >>> 0) % 16
        var key = name + '|' + sq + '|' + hq + '|' + cq + '|' + (t.tint || '')
        var c = sheetCache[key]
        if (!c) {
          c = sheetCache[key] = document.createElement('canvas'); c.width = c.height = 256
          var cg = c.getContext('2d'); cg.translate(128, 128); cg.scale(2, 2)
          var t2 = Object.assign({}, t, { hp01: hq, charge: cq, time: 0, variant: sq * 40503 + 7, noFlies: true })
          A.begin(t2); fn(cg, t2, rnd(seedOf(t2) * 7919 + 17))
        }
        g.drawImage(c, -64 * k, -64 * k, 128 * k, 128 * k)
        return
      }
      g.save(); g.scale(k, k); A.begin(t); fn(g, t, rnd(seedOf(t) * 7919 + 17)); g.restore()
    }
    if (animated) IS.spriteAnimated(name)
  }
  function alias (names, fn, animated, cache) { names.split(' ').forEach(function (n) { reg(n, fn, animated, cache) }) }

  /* ---------------- rocks ---------------- */
  function rockBody (g, t, R, base, o) {
    o = o || {}
    var rx = 38 + R() * 2, ry = 31 + R() * 3, cy = 5 - R() * 2
    var P = lumpPath(g, R, 0, cy, rx, ry, 7 + (R() * 3 | 0), o.jag == null ? .3 : o.jag)
    var chips = []
    for (var c = 0; c < 3; c++) chips.push([-18 + R() * 36, cy - 14 + R() * 24, 3 + R() * 4, R() * 3])
    var cr = [[-8 + R() * 16, cy - 20 + R() * 8, 1.4 + R() * 1.2, 20 + R() * 12], [-20 + R() * 8, cy + R() * 8, .2 + R() * 1.6, 14 + R() * 10]]
    solid(g, P, base, 0, cy, rx, ry, function (g) {
      /* chiselled facets */
      g.fillStyle = 'rgba(255,245,225,.07)'; g.beginPath(); g.moveTo(-rx, cy - 4); g.lineTo(-rx * .2, cy - ry); g.lineTo(rx * .5, cy - ry * .9); g.lineTo(-rx * .1, cy - ry * .2); g.closePath(); g.fill()
      g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.moveTo(rx, cy + 2); g.lineTo(rx * .1, cy + ry * .2); g.lineTo(rx * .3, cy + ry); g.lineTo(rx, cy + ry); g.closePath(); g.fill()
      if (o.inside) o.inside(g, R, rx, ry, cy)
      for (var i = 0; i < chips.length; i++) { var ch = chips[i]; g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(ch[0] + 1, ch[1] + 1.6, ch[2], ch[2] * .6, ch[3], 0, TAU); g.fill(); g.fillStyle = 'rgba(255,245,225,.2)'; g.beginPath(); g.ellipse(ch[0] - .6, ch[1] - 1, ch[2] * .8, ch[2] * .45, ch[3], 0, TAU); g.fill() }
      for (i = 0; i < cr.length; i++) crackAt(g, R, cr[i][0], cr[i][1], cr[i][2], cr[i][3], 2)
      hilite(g, -rx * .38, cy - ry * .5, rx * .34, ry * .16, -.55, .34)
      hilite(g, -rx * .55, cy - ry * .28, 3, 2, -.6, .55)
    })
  }
  reg('rock', function (g, t, R) {
    var base = tinted(t, ['#8a8478', '#7f7a72', '#908a7c', '#85807a'][(R() * 4) | 0])
    rockBody(g, t, R, base)
    if (R() < .55) {
      /* a smaller boulder wedged against the big one */
      var sx = (R() < .5 ? -1 : 1) * (22 + R() * 6), sy = 20 + R() * 5, sr = 12 + R() * 4
      solid(g, lumpPath(g, R, sx, sy, sr, sr * .8, 7, .3), sh(base, -.1), sx, sy, sr, sr * .8, function (g) { hilite(g, sx - sr * .35, sy - sr * .35, sr * .35, sr * .16, -.5, .3); crackAt(g, R, sx - 2, sy - 3, 1, 8, 1.4) }, 3)
    }
  }, false, true)
  reg('tinted-rock', function (g, t, R) {
    rockBody(g, t, R, tinted(t, '#7b6f86'), { inside: function (g, R, rx, ry, cy) {
      for (var i = 0; i < 3; i++) {
        var x = -rx * .6 + R() * rx * 1.1, y = cy - ry * .5 + R() * ry, pts = [x, y]
        for (var k = 0; k < 4; k++) { x += 4 + R() * 7; y += (R() - .4) * 9; pts.push(x, y) }
        polyline(g, 'rgba(120,230,255,.3)', 6, pts); polyline(g, '#8fe6ff', 2.4, pts); polyline(g, '#f0ffff', 1, pts)
      }
      for (i = 0; i < 4; i++) { var gx = -rx * .5 + R() * rx, gy = cy - ry * .4 + R() * ry * .9; g.fillStyle = '#d8f8ff'; g.beginPath(); g.moveTo(gx, gy - 3.2); g.lineTo(gx + 2.2, gy); g.lineTo(gx, gy + 3.2); g.lineTo(gx - 2.2, gy); g.closePath(); g.fill() }
    } })
  }, false, true)
  alias('skull-rock marked-skull', function (g, t, R) {
    rockBody(g, t, R, tinted(t, '#84807a'), { jag: .14, inside: function (g, R, rx, ry, cy) {
      var sx = 0, sy = cy - 2
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(sx + 2, sy + 2.5, 17, 15, 0, 0, TAU); g.fill()
      g.beginPath(); g.moveTo(sx - 15, sy + 1); g.bezierCurveTo(sx - 16, sy - 17, sx + 16, sy - 17, sx + 15, sy + 1); g.bezierCurveTo(sx + 15, sy + 7, sx + 9, sy + 8, sx + 9, sy + 13); g.lineTo(sx - 9, sy + 13); g.bezierCurveTo(sx - 9, sy + 8, sx - 15, sy + 7, sx - 15, sy + 1); g.closePath()
      var gr = g.createRadialGradient(sx - 6, sy - 8, 2, sx, sy, 20); gr.addColorStop(0, '#f2ead2'); gr.addColorStop(1, '#a99e82'); g.fillStyle = gr; g.fill(); g.lineWidth = 2; g.strokeStyle = OL; g.stroke()
      g.fillStyle = '#17100d'; g.beginPath(); g.ellipse(sx - 6, sy - 1, 4.4, 5.2, .1, 0, TAU); g.ellipse(sx + 6, sy - 1, 4.4, 5.2, -.1, 0, TAU); g.fill()
      g.beginPath(); g.moveTo(sx, sy + 3); g.lineTo(sx - 2.2, sy + 8); g.lineTo(sx + 2.2, sy + 8); g.closePath(); g.fill()
      polyline(g, '#17100d', 1.6, [sx - 5, sy + 13, sx - 5, sy + 10, sx, sy + 13, sx, sy + 10, sx + 5, sy + 13, sx + 5, sy + 10])
      crackAt(g, R, sx + 9, sy - 13, 1.9, 12, 1.6)
    } })
  }, false, true)

  alias('metal metal-block', function (g, t, R) {
    var c = tinted(t, '#59606a'), x0 = -34, y0 = -30, w = 68, h = 66
    solid(g, rrect(x0, y0, w, h, 8), c, 0, 3, 34, 33, function (g) {
      /* bevel: lit top-left rim, dark bottom-right rim, flat inner plate */
      g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + w, y0); g.lineTo(x0 + w - 9, y0 + 9); g.lineTo(x0 + 9, y0 + 9); g.lineTo(x0 + 9, y0 + h - 9); g.lineTo(x0, y0 + h); g.closePath(); g.fill()
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.moveTo(x0 + w, y0 + h); g.lineTo(x0, y0 + h); g.lineTo(x0 + 9, y0 + h - 9); g.lineTo(x0 + w - 9, y0 + h - 9); g.lineTo(x0 + w - 9, y0 + 9); g.lineTo(x0 + w, y0); g.closePath(); g.fill()
      g.strokeStyle = 'rgba(8,6,6,.7)'; g.lineWidth = 1.6; g.strokeRect(x0 + 9, y0 + 9, w - 18, h - 18)
      g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(x0 + 10, y0 + 10, w - 20, 5)
      for (var i = 0; i < 5; i++) { var sx = x0 + 16 + R() * 36, sy = y0 + 16 + R() * 34; polyline(g, 'rgba(255,255,255,.18)', 1, [sx, sy, sx + 6 + R() * 6, sy - 3 + R() * 3]) }
      var rv = [[x0 + 5, y0 + 5], [x0 + w - 5, y0 + 5], [x0 + 5, y0 + h - 5], [x0 + w - 5, y0 + h - 5]]
      for (i = 0; i < 4; i++) { A.flat(g, rv[i][0] + .8, rv[i][1] + 1.2, 3.4, 3.4, 'rgba(0,0,0,.5)'); A.flat(g, rv[i][0], rv[i][1], 3.2, 3.2, '#8b929c'); A.flat(g, rv[i][0] - 1, rv[i][1] - 1, 1.2, 1.2, '#e8eef5') }
    }, 3.6)
  }, false, true)

  reg('pillar', function (g, t, R) {
    var c = tinted(t, '#8e887c')
    function slab (x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); g.fill() }
    /* shaft */
    var gr = g.createLinearGradient(-20, 0, 20, 0); gr.addColorStop(0, sh(c, .3)); gr.addColorStop(.45, c); gr.addColorStop(1, sh(c, -.5))
    g.beginPath(); g.moveTo(-18, -26); g.lineTo(-21, 26); g.lineTo(21, 26); g.lineTo(18, -26); g.closePath(); g.fillStyle = gr; g.fill(); g.lineWidth = 3.2; g.lineJoin = 'round'; g.strokeStyle = OL; g.stroke()
    for (var i = -1; i <= 1; i++) polyline(g, 'rgba(10,6,4,.35)', 1.6, [i * 9, -24, i * 10.5, 24])
    crackAt(g, R, -4 + R() * 8, -8, 1.6, 22, 2)
    /* plinth and capital */
    var parts = [[-30, 24, 60, 15], [-27, -39, 54, 15]]
    for (i = 0; i < 2; i++) {
      var p = parts[i], pg = g.createLinearGradient(p[0], p[1], p[0] + p[2], p[1] + p[3])
      pg.addColorStop(0, sh(c, .32)); pg.addColorStop(.6, sh(c, .02)); pg.addColorStop(1, sh(c, -.45))
      g.fillStyle = pg; slab(p[0], p[1], p[2], p[3], 4); g.lineWidth = 3.2; g.strokeStyle = OL; g.stroke()
      g.fillStyle = 'rgba(255,248,230,.3)'; g.fillRect(p[0] + 4, p[1] + 2, p[2] - 14, 2.4)
    }
  }, false, true)

  /* ---------------- organic / misc ---------------- */
  reg('web', function (g, t, R) {
    var arms = 8, rings = [10, 19, 28, 36], i, k
    g.lineCap = 'round'; g.lineJoin = 'round'
    function strands (col, w, dx, dy) {
      g.strokeStyle = col; g.lineWidth = w; g.beginPath()
      for (i = 0; i < arms; i++) { var a = i / arms * TAU + .2; g.moveTo(dx, dy); g.lineTo(dx + Math.cos(a) * 38, dy + Math.sin(a) * 36) }
      for (k = 0; k < rings.length; k++) for (i = 0; i < arms; i++) {
        var a0 = i / arms * TAU + .2, a1 = (i + 1) / arms * TAU + .2, r = rings[k], am = (a0 + a1) / 2, sag = r * .82
        g.moveTo(dx + Math.cos(a0) * r, dy + Math.sin(a0) * r * .95)
        g.quadraticCurveTo(dx + Math.cos(am) * sag, dy + Math.sin(am) * sag * .95, dx + Math.cos(a1) * r, dy + Math.sin(a1) * r * .95)
      }
      g.stroke()
    }
    strands('rgba(10,8,8,.5)', 4.2, 1.5, 2); strands('rgba(240,240,236,.92)', 2, 0, 0)
    g.fillStyle = 'rgba(255,255,255,.9)'; for (i = 0; i < 5; i++) { var a = R() * TAU, r = 10 + R() * 24; g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, 1.6, 0, TAU); g.fill() }
  }, false, true)

  reg('mushroom', function (g, t, R) {
    var cap = tinted(t, '#b83a52')
    /* stalk */
    var sg = g.createLinearGradient(-12, 0, 12, 0); sg.addColorStop(0, '#f4ecd6'); sg.addColorStop(1, '#a89c80')
    g.beginPath(); g.moveTo(-9, -2); g.bezierCurveTo(-12, 12, -14, 22, -16, 30); g.lineTo(16, 30); g.bezierCurveTo(14, 22, 12, 12, 9, -2); g.closePath()
    g.fillStyle = sg; g.fill(); g.lineWidth = 3.2; g.lineJoin = 'round'; g.strokeStyle = OL; g.stroke()
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, -2, 10, 3, 0, 0, Math.PI); g.fill()
    /* gill underside */
    /* cap dome */
    var capP = new Path2D(); capP.moveTo(-38, 4); capP.bezierCurveTo(-40, -30, -18, -40, 0, -40); capP.bezierCurveTo(20, -40, 40, -30, 38, 4); capP.bezierCurveTo(24, 10, -24, 10, -38, 4); capP.closePath()
    solid(g, capP, cap, 0, -12, 38, 28, function (g) {
      g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(0, 6, 38, 6, 0, 0, TAU); g.fill()
      for (var i = 0; i < 6; i++) { var sx = -26 + R() * 52, sy = -30 + R() * 28, sr = 3 + R() * 4; g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(sx + 1, sy + 1.4, sr, sr * .8, 0, 0, TAU); g.fill(); g.fillStyle = '#f7efe0'; g.beginPath(); g.ellipse(sx, sy, sr, sr * .8, 0, 0, TAU); g.fill() }
      hilite(g, -18, -30, 14, 5, -.4, .4)
    })
  }, false, true)

  reg('vase', function (g, t, R) {
    var c = tinted(t, '#b5683a'), hp = t.hp01 == null ? 1 : t.hp01
    var vaseP = new Path2D(); vaseP.moveTo(-12, -30); vaseP.bezierCurveTo(-13, -22, -28, -14, -28, 6); vaseP.bezierCurveTo(-28, 24, -16, 32, -13, 33); vaseP.lineTo(13, 33); vaseP.bezierCurveTo(16, 32, 28, 24, 28, 6); vaseP.bezierCurveTo(28, -14, 13, -22, 12, -30); vaseP.closePath()
    solid(g, vaseP, c, 0, 2, 28, 32, function (g) {
      g.fillStyle = 'rgba(40,10,0,.3)'; g.fillRect(-30, -9, 60, 4); g.fillRect(-30, 14, 60, 4)
      g.fillStyle = 'rgba(255,225,170,.3)'; g.fillRect(-30, -5, 60, 2)
      for (var i = 0; i < 7; i++) { var a = -26 + i * 8.6; g.fillStyle = 'rgba(40,10,0,.34)'; g.beginPath(); g.moveTo(a, -2); g.lineTo(a + 4.3, 9); g.lineTo(a + 8.6, -2); g.closePath(); g.fill() }
      hilite(g, -15, -4, 3.4, 15, .1, .38)
      if (hp < 1) {
        polyline(g, '#1b0c06', 2.4, [-4, -30, 3, -18, -3, -8, 5, 4, 0, 14, 8, 24, 4, 33])
        polyline(g, 'rgba(255,225,170,.3)', 1, [-3, -30, 4, -18, -2, -8, 6, 4, 1, 14, 9, 24])
        if (hp <= .5) { g.fillStyle = '#150b07'; g.beginPath(); g.moveTo(12, -8); g.lineTo(26, 2); g.lineTo(20, 12); g.lineTo(10, 4); g.closePath(); g.fill() }
      }
    })
    /* lip */
    g.beginPath(); g.ellipse(0, -31, 16, 6, 0, 0, TAU); g.fillStyle = sh(c, .1); g.fill(); g.lineWidth = 3; g.strokeStyle = OL; g.stroke()
    g.beginPath(); g.ellipse(0, -31, 11, 3.6, 0, 0, TAU); g.fillStyle = '#2a140a'; g.fill()
    hilite(g, -7, -33, 6, 1.6, 0, .4)
  }, false, true)

  reg('key-block', function (g, t, R) {
    var x0 = -34, y0 = -30, w = 68, h = 66
    solid(g, rrect(x0, y0, w, h, 10), tinted(t, '#7f7a70'), 0, 3, 34, 33, function (g) {
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x0, y0, w, 8)
      crackAt(g, R, -30, 18, -.4, 18, 1.8)
      /* gold padlock plate */
      var gr = g.createLinearGradient(-16, -14, 16, 22); gr.addColorStop(0, '#ffe69a'); gr.addColorStop(.5, '#d8a634'); gr.addColorStop(1, '#8a5e14')
      g.beginPath(); if (g.roundRect) g.roundRect(-18, -14, 36, 34, 6); else g.rect(-18, -14, 36, 34)
      g.fillStyle = gr; g.fill(); g.lineWidth = 2.6; g.strokeStyle = OL; g.stroke()
      g.beginPath(); g.arc(0, -14, 10, Math.PI, 0); g.lineWidth = 5; g.strokeStyle = OL; g.stroke(); g.lineWidth = 2.4; g.strokeStyle = '#d8a634'; g.stroke()
      g.fillStyle = OL; g.beginPath(); g.arc(0, -1, 4.4, 0, TAU); g.fill(); g.beginPath(); g.moveTo(-2.4, 2); g.lineTo(2.4, 2); g.lineTo(3.6, 12); g.lineTo(-3.6, 12); g.closePath(); g.fill()
      hilite(g, -9, -9, 5, 2, -.5, .5)
    }, 3.6)
  }, false, true)

  /* ---------------- TNT ---------------- */
  reg('tnt', function (g, t, R) {
    var lit = t.charge > 0, T = A.T, flash = lit && Math.floor(T * 12) % 2 === 0
    var body = flash ? '#f5d8c8' : '#b5372b'
    /* three dynamite sticks poking out of a crate */
    function stick (x, y, h, col) {
      var gr = g.createLinearGradient(x - 7, 0, x + 7, 0); gr.addColorStop(0, sh(col, .3)); gr.addColorStop(.5, col); gr.addColorStop(1, sh(col, -.5))
      g.beginPath(); if (g.roundRect) g.roundRect(x - 7, y, 14, h, 4); else g.rect(x - 7, y, 14, h)
      g.fillStyle = gr; g.fill(); g.lineWidth = 3; g.strokeStyle = OL; g.stroke()
      g.fillStyle = '#e6d7a8'; g.fillRect(x - 6.4, y + 5, 12.8, 5); g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x - 6.4, y + 8, 12.8, 2)
      g.beginPath(); g.ellipse(x, y + 1, 6, 2.4, 0, 0, TAU); g.fillStyle = sh(col, -.35); g.fill()
    }
    stick(-17, -30, 22, body); stick(17, -30, 22, body); stick(0, -36, 24, body)
    /* wooden crate */
    var bx = -32, by = -12, bw = 64, bh = 42
    solid(g, rrect(bx, by, bw, bh, 5), flash ? '#e9c7a2' : '#9a6a3c', 0, 9, 32, 21, function (g) {
      for (var i = 1; i < 4; i++) { g.fillStyle = 'rgba(20,10,4,.45)'; g.fillRect(bx, by + i * 10.5 - 1, bw, 1.8) }
      g.fillStyle = 'rgba(255,230,190,.2)'; g.fillRect(bx, by, bw, 4)
      g.fillStyle = '#2e2a28'; g.fillRect(bx, by + 3, 7, bh - 6); g.fillRect(bx + bw - 7, by + 3, 7, bh - 6)
      g.fillStyle = '#8f8a84'; A.flat(g, bx + 3.5, by + 8, 1.6, 1.6, '#8f8a84'); A.flat(g, bx + bw - 3.5, by + 8, 1.6, 1.6, '#8f8a84'); A.flat(g, bx + 3.5, by + bh - 9, 1.6, 1.6, '#8f8a84'); A.flat(g, bx + bw - 3.5, by + bh - 9, 1.6, 1.6, '#8f8a84')
      g.font = 'bold 20px Impact, Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
      g.lineWidth = 3.4; g.strokeStyle = '#1c0e08'; g.strokeText('TNT', 0, by + 22); g.fillStyle = '#f3e4b8'; g.fillText('TNT', 0, by + 22)
    }, 3.4)
    /* fuse and spark */
    var fx = 0, fy = -60
    polyline(g, OL, 4.6, [0, -36, -3, -44, 5, -52, 1, -59]); polyline(g, '#c8b58a', 2.2, [0, -36, -3, -44, 5, -52, 1, -59])
    if (lit || (Math.sin(T * 9) > -.2)) {
      var f = .8 + .3 * Math.sin(T * 31) + .15 * Math.sin(T * 17)
      g.save(); g.translate(1, fy)
      var gl = g.createRadialGradient(0, 0, 0, 0, 0, 14 * f); gl.addColorStop(0, 'rgba(255,220,120,.9)'); gl.addColorStop(1, 'rgba(255,120,30,0)'); g.fillStyle = gl; g.fillRect(-16, -16, 32, 32)
      g.rotate(T * 7); g.fillStyle = '#ffb030'; g.beginPath()
      for (var i = 0; i < 8; i++) { var r = (i & 1 ? 3 : 8) * f; g.lineTo(Math.cos(i / 8 * TAU) * r, Math.sin(i / 8 * TAU) * r) }
      g.closePath(); g.fill(); g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(0, 0, 2.2 * f, 0, TAU); g.fill(); g.restore()
    }
  }, true)

  /* ---------------- poop ---------------- */
  function poop (base, o) {
    o = o || {}
    return function (g, t, R) {
      var hp = t.hp01 == null ? 1 : t.hp01, T = A.T, c = base
      if (o.rainbow) c = 'hsl(' + ((T * 90) % 360 | 0) + ',72%,52%)'
      var scale = .72 + .28 * clamp(hp, 0, 1)
      var tiers = [[0, 24, 31, 14], [0, 9, 24, 12], [0, -5, 16, 11]]
      var nt = hp > .66 ? 3 : hp > .33 ? 2 : 2
      g.save(); g.translate(0, 8); g.scale(scale, scale); g.translate(0, -8)
      for (var i = 0; i < nt; i++) {
        var tr = tiers[i], k = i === 2 ? 1 : 1
        var cc = o.rainbow ? 'hsl(' + (((T * 90) + i * 60) % 360 | 0) + ',74%,' + (50 + i * 3) + '%)' : sh(c, i * .05)
        solid(g, ell(tr[0], tr[1], tr[2], tr[3]), cc, tr[0], tr[1], tr[2], tr[3], function (g) {
          g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(-40, tr[1] - 14, 80, 5)
          if (o.corn) { for (var j = 0; j < 7; j++) { g.fillStyle = 'rgba(255,245,170,.55)'; g.beginPath(); g.ellipse(-tr[2] * .7 + j * tr[2] * .23, tr[1] + (j % 2) * 3 - 2, 2.2, 3, 0, 0, TAU); g.fill() } }
          hilite(g, tr[0] - tr[2] * .4, tr[1] - tr[3] * .45, tr[2] * .3, tr[3] * .16, -.2, .38)
        })
      }
      if (nt === 3) {
        var tc = o.rainbow ? 'hsl(' + (((T * 90) + 180) % 360 | 0) + ',76%,54%)' : sh(c, .06)
        var tipP = new Path2D(); tipP.moveTo(-9, -12); tipP.bezierCurveTo(-8, -20, -2, -22, 1, -30); tipP.bezierCurveTo(6, -24, 11, -20, 10, -12); tipP.bezierCurveTo(4, -9, -4, -9, -9, -12); tipP.closePath()
        solid(g, tipP, tc, 0, -18, 10, 12, function (g) { hilite(g, -3, -18, 2.4, 5, .3, .45) })
      }
      /* swirl grooves */
      for (i = 0; i < nt; i++) polyline(g, 'rgba(20,8,2,.35)', 1.8, [-tiers[i][2] * .6, tiers[i][1] + tiers[i][3] * .4, 0, tiers[i][1] + tiers[i][3] * .7, tiers[i][2] * .6, tiers[i][1] + tiers[i][3] * .35])
      if (o.gold) { for (i = 0; i < 4; i++) { var sx = -16 + i * 11 + ((T * 3 + i) % 1), sy = -8 + (i % 2) * 14; g.strokeStyle = 'rgba(255,255,230,' + (.4 + .4 * Math.sin(T * 6 + i)).toFixed(2) + ')'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(sx - 3, sy); g.lineTo(sx + 3, sy); g.moveTo(sx, sy - 3); g.lineTo(sx, sy + 3); g.stroke() } }
      g.restore()
      /* a couple of flies on the fresh stuff */
      if (!o.gold && !o.rainbow && !t.noFlies) for (i = 0; i < 2; i++) {
        var fa = T * (3 + i) + i * 3, fx = Math.cos(fa) * (22 - i * 6), fy = -22 + Math.sin(fa * 1.3) * 7 - i * 4
        g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(fx - 1, fy - 2, 2.6, 1.4, -.5, 0, TAU); g.ellipse(fx + 2, fy - 2, 2.6, 1.4, .5, 0, TAU); g.fill()
        g.fillStyle = '#17100d'; g.beginPath(); g.arc(fx, fy, 1.9, 0, TAU); g.fill()
      }
    }
  }
  /* the flies buzz live on top of the cached mound */
  reg('poop-flies', function (g, t) {
    var T = A.T
    for (var i = 0; i < 2; i++) {
      var fa = T * (3 + i) + i * 3, fx = Math.cos(fa) * (22 - i * 6), fy = -22 + Math.sin(fa * 1.3) * 7 - i * 4
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(fx - 1, fy - 2, 2.6, 1.4, -.5, 0, TAU); g.ellipse(fx + 2, fy - 2, 2.6, 1.4, .5, 0, TAU); g.fill()
      g.fillStyle = '#17100d'; g.beginPath(); g.arc(fx, fy, 1.9, 0, TAU); g.fill()
    }
  }, true)
  reg('poop', poop('#7b4a27'), false, true)
  reg('red-poop', poop('#a83223'), false, true)
  alias('gold-poop golden-poop', poop('#e2b327', { gold: 1 }), true)
  reg('rainbow-poop', poop('#8a5a30', { rainbow: 1 }), true)
  alias('corn-poop corny-poop', poop('#d8b438', { corn: 1 }), false, true)

  /* ---------------- floor hazards ---------------- */
  function plate (g, c) {
    solid(g, rrect(-34, -30, 68, 64, 8), c, 0, 2, 34, 32, function (g) {
      g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(-34, -30, 68, 4)
      g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1.6; g.strokeRect(-28, -24, 56, 52)
      var rv = [[-29, -25], [29, -25], [-29, 29], [29, 29]]
      for (var i = 0; i < 4; i++) { A.flat(g, rv[i][0] + .6, rv[i][1] + 1, 2.8, 2.8, 'rgba(0,0,0,.5)'); A.flat(g, rv[i][0], rv[i][1], 2.6, 2.6, '#838a94'); A.flat(g, rv[i][0] - .8, rv[i][1] - .8, 1, 1, '#eef2f6') }
    }, 3.4)
  }
  function spikesDraw (g, h) {
    /* 3x3 spikes; h in 0..1 is how far they are up */
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
      var x = -19 + c * 19, y = -14 + r * 19
      if (h <= .04) { g.fillStyle = '#0c0807'; g.beginPath(); g.ellipse(x, y + 4, 5, 3, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y + 4.8, 5, 3, 0, 0, Math.PI); g.stroke(); continue }
      var ht = 4 + 24 * h, bw = 7.5
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(x + 3, y + 5, bw + 1, 3, 0, 0, TAU); g.fill()
      g.beginPath(); g.moveTo(x - bw, y + 4); g.lineTo(x, y + 4 - ht); g.lineTo(x + bw, y + 4); g.closePath()
      g.fillStyle = '#7e8590'; g.fill(); g.lineWidth = 2.6; g.lineJoin = 'round'; g.strokeStyle = OL; g.stroke()
      g.fillStyle = '#d7dde5'; g.beginPath(); g.moveTo(x - bw + 1.2, y + 3.4); g.lineTo(x, y + 4 - ht + 1.6); g.lineTo(x, y + 3.4); g.closePath(); g.fill()
      g.fillStyle = '#4d535c'; g.beginPath(); g.moveTo(x + bw - 1.2, y + 3.4); g.lineTo(x, y + 4 - ht + 1.6); g.lineTo(x, y + 3.4); g.closePath(); g.fill()
    }
  }
  reg('spikes', function (g, t) { plate(g, '#4a4f58'); spikesDraw(g, 1) }, false, true)
  alias('retract-spikes retracting-spikes', function (g, t) { plate(g, '#4a4f58'); spikesDraw(g, clamp(t.charge == null ? 1 : t.charge, 0, 1)) }, false, true)

  function holePath (g, R, rx, ry, j) { return lumpPath(g, R, 0, 2, rx, ry, 10, j) }
  function pitBase (g, R) {
    /* stone lip */
    var rim = holePath(g, R, 39, 35, .1)
    g.save(); g.fillStyle = '#6f665b'; g.fill(rim); g.clip(rim)
    var lg = g.createLinearGradient(-34, -30, 34, 34); lg.addColorStop(0, '#a89c8c'); lg.addColorStop(.5, '#6f665b'); lg.addColorStop(1, '#3c352f'); g.fillStyle = lg; g.fillRect(-40, -36, 80, 76)
    g.restore(); g.lineWidth = 3.4; g.lineJoin = 'round'; g.strokeStyle = OL; g.stroke(rim)
    /* the hole */
    var hole = holePath(g, rnd(99), 31, 27, .12)
    g.save(); g.clip(hole)
    var hg = g.createRadialGradient(4, 8, 2, 0, 2, 34); hg.addColorStop(0, '#000000'); hg.addColorStop(.6, '#0a0706'); hg.addColorStop(1, '#2a221d'); g.fillStyle = hg; g.fillRect(-36, -30, 72, 64)
    /* far wall in shadow, near wall catches a little light */
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(-36, -30, 72, 12)
    var wg = g.createLinearGradient(0, 14, 0, 30); wg.addColorStop(0, 'rgba(120,104,90,0)'); wg.addColorStop(1, 'rgba(120,104,90,.4)'); g.fillStyle = wg; g.fillRect(-36, 14, 72, 18)
    g.restore(); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(hole)
  }
  reg('pit', function (g, t, R) { pitBase(g, R) }, false, true)
  alias('pit-bridge', function (g, t, R) {
    pitBase(g, R)
    for (var i = 0; i < 5; i++) {
      var y = -26 + i * 12.4, j = (R() - .5) * 3
      g.beginPath(); if (g.roundRect) g.roundRect(-36, y + j, 72, 11, 2); else g.rect(-36, y + j, 72, 11)
      var pg = g.createLinearGradient(0, y, 0, y + 11); pg.addColorStop(0, '#c08a52'); pg.addColorStop(1, '#7a4e28'); g.fillStyle = pg; g.fill(); g.lineWidth = 2.6; g.strokeStyle = OL; g.stroke()
      g.strokeStyle = 'rgba(60,30,10,.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-30, y + j + 5); g.lineTo(-4, y + j + 4); g.moveTo(8, y + j + 6); g.lineTo(30, y + j + 5); g.stroke()
      g.fillStyle = '#2a1a10'; g.beginPath(); g.arc(-31, y + j + 5.5, 1.5, 0, TAU); g.arc(31, y + j + 5.5, 1.5, 0, TAU); g.fill()
    }
  }, false, true)

  alias('crawlspace', function (g, t, R) {
    pitBase(g, rnd(5))
    for (var i = 0; i < 4; i++) { var y = -12 + i * 10; polyline(g, OL, 5, [-12, y, 12, y]); polyline(g, '#9a6a3c', 2.6, [-12, y, 12, y]) }
    polyline(g, OL, 5.4, [-12, -20, -12, 30]); polyline(g, '#b8844a', 3, [-12, -20, -12, 30]); polyline(g, OL, 5.4, [12, -20, 12, 30]); polyline(g, '#8a5a30', 3, [12, -20, 12, 30])
  }, false, true)

  /* ---------------- fire ---------------- */
  function flame (blue, big) {
    return function (g, t, R) {
      var T = A.T, hp = t.hp01 == null ? 1 : t.hp01, ph = R() * 6
      var cols = blue ? ['#2358c8', '#4fa2ff', '#d8f2ff'] : ['#d63d14', '#f79a22', '#fff0a0']
      /* hearth: ring of stones and logs */
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2, 22, 34, 10, 0, 0, TAU); g.fill()
      for (var i = 0; i < 7; i++) {
        var a = Math.PI * (.05 + i / 6 * .9), sx = Math.cos(a) * 28 * (big ? 1.05 : 1), sy = 14 + Math.sin(a) * 12
        solid(g, lumpPath(g, R, sx, sy, 10, 8, 7, .18), ['#7d786f', '#6c675f', '#8a857a'][i % 3], sx, sy, 10, 8, function (g) { hilite(g, sx - 3, sy - 3, 4, 1.8, -.4, .35) }, 2.8)
      }
      g.save(); g.translate(0, 14); g.rotate(.35); g.fillStyle = OL; g.fillRect(-26, -5, 52, 11); g.fillStyle = '#6a4326'; g.fillRect(-24.5, -3.5, 49, 8); g.fillStyle = '#2a170a'; g.fillRect(-24.5, 2, 49, 2.5); g.restore()
      g.save(); g.translate(0, 14); g.rotate(-.35); g.fillStyle = OL; g.fillRect(-26, -5, 52, 11); g.fillStyle = '#7a4e2c'; g.fillRect(-24.5, -3.5, 49, 8); g.fillStyle = '#2a170a'; g.fillRect(-24.5, 2, 49, 2.5); g.restore()
      var gl = g.createRadialGradient(0, -6, 2, 0, -6, 46); gl.addColorStop(0, blue ? 'rgba(90,160,255,.45)' : 'rgba(255,150,40,.45)'); gl.addColorStop(1, 'rgba(255,120,20,0)'); g.fillStyle = gl; g.fillRect(-48, -52, 96, 96)
      /* layered flame tongues */
      var scale = (big ? 1.15 : .95) * (.55 + .45 * clamp(hp, 0, 1))
      for (var L = 0; L < 3; L++) {
        var h = (46 - L * 14) * scale, w = (26 - L * 7) * scale
        for (var k = 0; k < (L === 0 ? 3 : 2); k++) {
          var off = (k - (L === 0 ? 1 : .5)) * w * .55, fl = Math.sin(T * (9 + k * 3) + ph + k * 2), hh = h * (.85 + .2 * fl) * (k === 1 && L === 0 ? 1.15 : .85), sw = Math.sin(T * 6 + ph + k) * 4
          g.beginPath(); g.moveTo(off - w * .5, 14); g.bezierCurveTo(off - w * .7, 0, off - w * .2 + sw, -hh * .5, off + sw * 1.6, 14 - hh); g.bezierCurveTo(off + w * .2 + sw, -hh * .5, off + w * .7, 0, off + w * .5, 14); g.closePath()
          g.fillStyle = cols[L]; g.fill()
          if (L === 0) { g.lineWidth = 3; g.lineJoin = 'round'; g.strokeStyle = blue ? '#0b1a48' : '#5a1608'; g.stroke() }
        }
      }
      for (i = 0; i < 4; i++) { var u = (T * .9 + i * .27 + ph) % 1; g.fillStyle = 'rgba(' + (blue ? '170,220,255' : '255,200,90') + ',' + (1 - u).toFixed(2) + ')'; g.beginPath(); g.arc(Math.sin(ph + i * 2 + u * 4) * 16, 4 - u * 56 * scale, 1.8 * (1 - u * .5), 0, TAU); g.fill() }
    }
  }
  alias('fire fireplace', flame(false, true), true)
  alias('blue-fire blue-fireplace', flame(true, true), true)

  /* ---------------- water ---------------- */
  reg('water', function (g, t, R) {
    var T = A.T
    solid(g, lumpPath(g, R, 0, 2, 38, 34, 10, .1), '#2f6e8a', 0, 2, 38, 34, function (g) {
      var wg = g.createLinearGradient(0, -30, 0, 36); wg.addColorStop(0, 'rgba(160,220,240,.45)'); wg.addColorStop(1, 'rgba(10,40,70,.3)'); g.fillStyle = wg; g.fillRect(-40, -32, 80, 72)
      for (var i = 0; i < 3; i++) { var u = (T * .5 + i / 3) % 1; g.strokeStyle = 'rgba(210,245,255,' + (.5 * (1 - u)).toFixed(2) + ')'; g.lineWidth = 1.8; g.beginPath(); g.ellipse(-6 + i * 8, 0 + i * 4, 6 + u * 24, 3 + u * 12, 0, 0, TAU); g.stroke() }
      hilite(g, -18, -16, 11, 3, -.3, .5)
    }, 3)
  }, true)

  /* ---------------- the placed bomb ---------------- */
  function bombBody (g, t, T, fuseLen) {
    /* shadowless: the renderer draws the ground shadow */
    solid(g, ell(0, 7, 29, 28), '#2b2e33', 0, 7, 29, 28, function (g) {
      /* rim light on the lower right, stitched seam, glossy highlights */
      g.strokeStyle = 'rgba(120,170,220,.28)'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 7, 26, 25, 0, .15, 1.5); g.stroke()
      g.setLineDash([4, 3.4]); g.strokeStyle = 'rgba(205,205,200,.55)'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(-1, -18); g.bezierCurveTo(14, -4, 14, 16, -2, 33); g.stroke(); g.setLineDash([])
      g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(1, -18); g.bezierCurveTo(16, -4, 16, 16, 0, 33); g.stroke()
      hilite(g, -12, -7, 10, 5.6, -.7, .45)
      hilite(g, -16, -2, 3, 1.8, -.7, .8)
    }, 3.6)
    /* brass cap */
    var cg = g.createLinearGradient(-9, 0, 9, 0); cg.addColorStop(0, '#f6d682'); cg.addColorStop(.5, '#b98a2c'); cg.addColorStop(1, '#6a4a12')
    g.beginPath(); if (g.roundRect) g.roundRect(-9, -26, 18, 11, 3); else g.rect(-9, -26, 18, 11)
    g.fillStyle = cg; g.fill(); g.lineWidth = 3; g.lineJoin = 'round'; g.strokeStyle = OL; g.stroke()
    g.fillStyle = 'rgba(255,255,230,.5)'; g.fillRect(-7, -24, 4, 2.2)
    g.fillStyle = OL; g.fillRect(-4, -29, 8, 4)
    /* fuse */
    var fx = 16, fy = -44
    polyline(g, OL, 5.2, [0, -28, 4, -38, 14, -39, fx, fy]); polyline(g, '#cdb88a', 2.6, [0, -28, 4, -38, 14, -39, fx, fy])
    var f = .8 + .25 * Math.sin(T * 33) + .15 * Math.sin(T * 19 + 1)
    g.save(); g.translate(fx, fy)
    var gl = g.createRadialGradient(0, 0, 0, 0, 0, 18 * f); gl.addColorStop(0, 'rgba(255,230,140,.95)'); gl.addColorStop(.5, 'rgba(255,140,40,.4)'); gl.addColorStop(1, 'rgba(255,100,20,0)'); g.fillStyle = gl; g.fillRect(-20, -20, 40, 40)
    g.rotate(T * 9); g.fillStyle = '#ff9a24'; g.beginPath()
    for (var i = 0; i < 10; i++) { var r = (i & 1 ? 3.4 : 10) * f; g.lineTo(Math.cos(i / 10 * TAU) * r, Math.sin(i / 10 * TAU) * r) }
    g.closePath(); g.fill(); g.fillStyle = '#fff8d0'; g.beginPath(); g.arc(0, 0, 3 * f, 0, TAU); g.fill(); g.restore()
    for (i = 0; i < 4; i++) { var u = (T * 3 + i * .25) % 1, a = i * 1.9 + Math.floor(T * 3 + i * .25) * 2.3; g.fillStyle = 'rgba(255,' + (190 - u * 80 | 0) + ',60,' + (1 - u).toFixed(2) + ')'; g.fillRect(fx + Math.cos(a) * u * 15 - 1, fy + Math.sin(a) * u * 15 - 1 - u * 4, 2.2, 2.2) }
  }
  reg('bomb', function (g, t) { bombBody(g, t, A.T) }, true)

  /* ---------------- explosion ---------------- */
  function ease (p) { return 1 - Math.pow(1 - p, 3) }
  /* progress 0..1; (x, y) centre; radius is the blast radius in world px */
  IS.drawExplosion = function (g, x, y, radius, p) {
    p = clamp(p, 0, 1); var e = ease(p), R = rnd(Math.round(x * 13 + y * 7)), i, a
    g.save(); g.translate(x, y)
    /* shock ring */
    g.strokeStyle = 'rgba(255,240,200,' + (.7 * (1 - p)).toFixed(3) + ')'; g.lineWidth = 7 * (1 - p) + 1; g.beginPath(); g.arc(0, 0, radius * (.3 + .85 * e), 0, TAU); g.stroke()
    /* smoke ring: dark puffs that swell and fade late */
    if (p > .12) {
      var sp = (p - .12) / .88
      for (i = 0; i < 10; i++) {
        a = i / 10 * TAU + R() * .5; var rr = radius * (.5 + .5 * ease(sp)) * (.85 + R() * .25), pr = radius * (.2 + .12 * sp) * (.8 + R() * .5)
        g.fillStyle = 'rgba(22,16,14,' + (.65 * (1 - sp * sp)).toFixed(3) + ')'; g.beginPath(); g.arc(Math.cos(a) * rr * .9, Math.sin(a) * rr * .9 - sp * 10, pr, 0, TAU); g.fill()
        g.fillStyle = 'rgba(80,66,60,' + (.4 * (1 - sp)).toFixed(3) + ')'; g.beginPath(); g.arc(Math.cos(a) * rr * .9 - pr * .25, Math.sin(a) * rr * .9 - sp * 10 - pr * .25, pr * .55, 0, TAU); g.fill()
      }
    }
    /* fireball: lumpy blobs, dark outline underneath for the chunky look */
    var fr = radius * (.25 + .6 * e), fa = 1 - p * p, lumps = []
    for (i = 0; i < 8; i++) { a = i / 8 * TAU + R(); lumps.push([Math.cos(a) * fr * .5, Math.sin(a) * fr * .5, fr * (.45 + R() * .25)]) }
    lumps.push([0, 0, fr * .8])
    g.globalAlpha = fa
    for (i = 0; i < lumps.length; i++) { g.fillStyle = '#3a1208'; g.beginPath(); g.arc(lumps[i][0], lumps[i][1], lumps[i][2] + 3.4, 0, TAU); g.fill() }
    for (i = 0; i < lumps.length; i++) { g.fillStyle = '#d9391a'; g.beginPath(); g.arc(lumps[i][0], lumps[i][1], lumps[i][2], 0, TAU); g.fill() }
    for (i = 0; i < lumps.length; i++) { g.fillStyle = '#f68a1e'; g.beginPath(); g.arc(lumps[i][0] - 1, lumps[i][1] - 2, lumps[i][2] * .74, 0, TAU); g.fill() }
    var cg = g.createRadialGradient(-fr * .1, -fr * .12, 0, 0, 0, fr * .62); cg.addColorStop(0, '#ffffff'); cg.addColorStop(.45, '#ffe98a'); cg.addColorStop(1, 'rgba(255,200,60,0)')
    g.fillStyle = cg; g.beginPath(); g.arc(0, 0, fr * .62, 0, TAU); g.fill()
    g.globalAlpha = 1
    /* initial white flash */
    if (p < .22) { g.fillStyle = 'rgba(255,255,240,' + (.8 * (1 - p / .22)).toFixed(3) + ')'; g.beginPath(); g.arc(0, 0, radius * (.5 + p), 0, TAU); g.fill() }
    /* sparks */
    for (i = 0; i < 16; i++) {
      a = i / 16 * TAU + R() * .4; var d = radius * (.25 + (.55 + R() * .7) * e), sz = 3.4 * (1 - p) + .6
      g.fillStyle = i % 3 ? 'rgba(255,214,90,' + (1 - p).toFixed(2) + ')' : 'rgba(255,120,30,' + (1 - p).toFixed(2) + ')'
      g.save(); g.translate(Math.cos(a) * d, Math.sin(a) * d + p * p * 14); g.rotate(a); g.fillRect(-sz * 1.6, -sz * .5, sz * 3.2, sz); g.restore()
    }
    g.restore()
  }
  function progress (t, period) { return t.charge > 0 ? t.charge : ((t.time || 0) % period) / period }
  IS.sprites['explosion-core'] = function (g, s, t) { IS.drawExplosion(g, 0, 0, s / 2, progress(t, .6)) }
  IS.spriteAnimated('explosion-core')
  IS.sprites['poof'] = function (g, s, t) {
    var p = progress(t, .5), R = rnd(31)
    for (var i = 0; i < 6; i++) { var a = i / 6 * TAU + R(), d = s * (.12 + .32 * ease(p)), r = s * (.17 + .08 * p); g.fillStyle = 'rgba(26,20,18,' + (.5 * (1 - p)).toFixed(2) + ')'; g.beginPath(); g.arc(Math.cos(a) * d + 1.5, Math.sin(a) * d + 1.5, r + 2, 0, TAU); g.fill(); g.fillStyle = 'rgba(225,215,200,' + (.85 * (1 - p)).toFixed(2) + ')'; g.beginPath(); g.arc(Math.cos(a) * d, Math.sin(a) * d, r, 0, TAU); g.fill() }
  }
  IS.sprites['tear-splash'] = function (g, s, t) {
    var p = progress(t, .35), R = rnd(7)
    g.strokeStyle = 'rgba(190,230,255,' + (.8 * (1 - p)).toFixed(2) + ')'; g.lineWidth = 2.4 * (1 - p) + .6; g.beginPath(); g.ellipse(0, 0, s * (.12 + .3 * p), s * (.07 + .17 * p), 0, 0, TAU); g.stroke()
    for (var i = 0; i < 6; i++) { var a = i / 6 * TAU + R() * .5, d = s * (.1 + .32 * ease(p)); g.fillStyle = 'rgba(' + '130,200,235,' + (1 - p).toFixed(2) + ')'; g.beginPath(); g.arc(Math.cos(a) * d, Math.sin(a) * d * .8 - p * s * .1, s * .05 * (1 - p * .5), 0, TAU); g.fill() }
  }
  IS.sprites['blood-splatter'] = function (g, s, t) {
    var p = progress(t, .5), R = rnd(11)
    g.fillStyle = 'rgba(110,16,22,' + (.9 * (1 - p * .6)).toFixed(2) + ')'; g.beginPath(); g.ellipse(0, 0, s * (.14 + .18 * ease(p)), s * (.09 + .12 * ease(p)), 0, 0, TAU); g.fill()
    for (var i = 0; i < 7; i++) { var a = i / 7 * TAU + R(), d = s * (.12 + .3 * ease(p) * (.6 + R() * .6)); g.fillStyle = 'rgba(150,26,34,' + (1 - p * .7).toFixed(2) + ')'; g.beginPath(); g.arc(Math.cos(a) * d, Math.sin(a) * d * .85, s * (.03 + R() * .04), 0, TAU); g.fill() }
  }
  ;['poof', 'tear-splash', 'blood-splatter'].forEach(function (n) { IS.spriteAnimated(n) })

  /* Placed bombs explode through IS.bombExplode (engine) which only emits particles; hook it so the
     fireball is drawn in the 'over' fx layer without any render.js change. */
  var booms = []
  if (typeof IS.bombExplode === 'function' && !IS.bombExplode.__boom) {
    var orig = IS.bombExplode
    IS.bombExplode = function (x, y, o) {
      var r = orig.apply(this, arguments)
      booms.push({ x: x, y: y, r: Math.max(60, (o && o.r) || 120) * .9, t: 0 })
      if (booms.length > 12) booms.shift()
      return r
    }
    IS.bombExplode.__boom = true
  }
  if (IS.fx && typeof IS.fx.update === 'function' && !IS.fx.update.__boom) {
    var upd = IS.fx.update
    IS.fx.update = function (dt) { for (var i = booms.length - 1; i >= 0; i--) { booms[i].t += dt; if (booms[i].t > .6) booms.splice(i, 1) } return upd.apply(this, arguments) }
    IS.fx.update.__boom = true
  }
  if (IS.fx && typeof IS.fx.draw === 'function' && !IS.fx.draw.__boom) {
    var drw = IS.fx.draw
    IS.fx.draw = function (g, layer) {
      var r = drw.apply(this, arguments)
      if (layer === 'over') for (var i = 0; i < booms.length; i++) IS.drawExplosion(g, booms[i].x, booms[i].y, booms[i].r, booms[i].t / .6)
      return r
    }
    IS.fx.draw.__boom = true
  }

  /* ---------------- item pedestal ---------------- */
  IS.sprites['item-pedestal'] = function (g, s, t) {
    g.save(); g.scale(s / 80, s / 80)
    var T = +t.time || 0
    function slab (x, y, w, h, r, c) {
      g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h)
      var gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, sh(c, .3)); gr.addColorStop(.6, c); gr.addColorStop(1, sh(c, -.45))
      g.fillStyle = gr; g.fill(); g.lineWidth = 3.2; g.lineJoin = 'round'; g.strokeStyle = OL; g.stroke()
      g.fillStyle = 'rgba(255,248,230,.3)'; g.fillRect(x + 4, y + 2, w * .55, 2.2)
    }
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(2, 31, 30, 8, 0, 0, TAU); g.fill()
    slab(-26, 20, 52, 12, 3, '#7a746b')
    slab(-17, 4, 34, 18, 3, '#8c867b')
    slab(-30, -6, 60, 12, 4, '#a69f92')
    var gl = g.createRadialGradient(0, -8, 2, 0, -8, 24); gl.addColorStop(0, 'rgba(255,238,160,' + (.45 + .1 * Math.sin(T * 3)).toFixed(2) + ')'); gl.addColorStop(1, 'rgba(255,238,160,0)'); g.fillStyle = gl; g.fillRect(-26, -32, 52, 52)
    g.restore()
  }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
