;(function (IS) {
  'use strict'

  var WALL = IS.WALL || 80
  var TILE = IS.TILE || 80
  var cache = Object.create(null), cacheN = 0

  function palette (room, floor) {
    var p = (floor && (floor.palette || (floor.def && floor.def.palette))) || room.palette || {}
    return {
      wall: p.wall || '#60483a', wallDark: p.wallDark || '#29201c',
      floor: p.floor || '#80664f', floorAlt: p.floorAlt || '#755b47',
      accent: p.accent || '#a98354', creep: p.creep || '#542b24', backdrop: p.backdrop || '#171311'
    }
  }

  function hash (n) {
    n = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b)
    n ^= n >>> 13
    return (n >>> 0) / 4294967295
  }

  function inShape (room, col, row) {
    if (col < 0 || row < 0 || col >= room.w || row >= room.h) return false
    if (!room.missing) return true
    var left = col < room.w / 2, top = row < room.h / 2
    return room.missing === 'tl' ? !(left && top) : room.missing === 'tr' ? !(!left && top) : room.missing === 'bl' ? !(left && !top) : !(!left && !top)
  }

  var TAU = Math.PI * 2
  function sh (hex, a) {
    var m = /^#([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return hex
    var n = parseInt(m[1], 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255
    function f (v) { return Math.max(0, Math.min(255, Math.round(a > 0 ? v + (255 - v) * a : v * (1 + a)))) }
    return 'rgb(' + f(r) + ',' + f(gg) + ',' + f(b) + ')'
  }

  /* Floor family from floor id: picks the tile, wall and decoration vocabulary. */
  function family (floor) {
    var id = String((floor && (floor.id || (floor.def && floor.def.id))) || '').replace(/-\d$/, '')
    if (/cellar/.test(id)) return 'wood'
    if (/burning|gehenna|sheol|ashpit/.test(id)) return 'fire'
    if (/downpour|flooded|dross/.test(id)) return 'wet'
    if (/womb|utero|corpse|scarred/.test(id)) return 'flesh'
    if (/necropolis|catacomb|mausoleum/.test(id)) return 'bone'
    if (/cathedral|home|greed|ascent/.test(id)) return 'marble'
    if (/chest/.test(id)) return 'gold'
    if (/void|dark-room|shadow/.test(id)) return 'dark'
    if (/caves|mines|dank|depths/.test(id)) return 'rock'
    return 'stone'
  }

  function rr (seed, i) { return hash(seed * 31 + i * 7919) }

  /* ------------------------------------------------------------------ */
  /* Seeded helpers                                                      */
  /* ------------------------------------------------------------------ */
  function rng (seed) {
    var s = (seed | 0) >>> 0
    return function () {
      s = (s + 0x6d2b79f5) >>> 0
      var t = Math.imul(s ^ (s >>> 15), 1 | s)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  function al (hex, a) {
    var m = /^#([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 'rgba(128,128,128,' + a + ')'
    var n = parseInt(m[1], 16)
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'
  }

  /* soft elliptical radial blob (no hard edge) */
  function soft (g, x, y, rx, ry, rot, col, a) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(1, ry / rx)
    var gr = g.createRadialGradient(0, 0, 0, 0, 0, rx)
    gr.addColorStop(0, al(col, a)); gr.addColorStop(.55, al(col, a * .65)); gr.addColorStop(1, al(col, 0))
    g.fillStyle = gr; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore()
  }

  /* irregular smooth blob path */
  function lump (g, R, x, y, rx, ry, n) {
    n = n || 10
    var pts = [], i, a, k
    for (i = 0; i < n; i++) { a = i / n * TAU; k = .68 + R() * .5; pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]) }
    g.beginPath()
    g.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2)
    for (i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2) }
    g.closePath()
  }

  /* a stain: flat blob with a slightly darker dried rim */
  function stain (g, R, x, y, rx, ry, col, a, rim) {
    lump(g, R, x, y, rx, ry, 11); g.fillStyle = al(col, a); g.fill()
    if (rim) { g.lineWidth = 1.5; g.strokeStyle = al(rim, a * .9); g.stroke() }
  }

  function crackPts (R, x, y, ang, len, wob) {
    var pts = [[x, y]], n = Math.max(2, Math.ceil(len / 13))
    for (var i = 0; i < n; i++) {
      ang += (R() - .5) * (wob || .9); x += Math.cos(ang) * 13 * (.7 + R() * .6); y += Math.sin(ang) * 13 * (.7 + R() * .6); pts.push([x, y])
    }
    return pts
  }
  function strokePts (g, pts, col, w, dx, dy) {
    g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath()
    g.moveTo(pts[0][0] + dx, pts[0][1] + dy); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0] + dx, pts[i][1] + dy); g.stroke()
  }
  /* scattered crack with branches; dark core with a faint lit lip below-right */
  function crack (g, R, x, y, ang, len, w, depth, o) {
    o = o || {}
    var pts = crackPts(R, x, y, ang, len, o.wob)
    if (o.glow) { strokePts(g, pts, al(o.glow, .22), w * 4.5, 0, 0); strokePts(g, pts, al(o.glow, .5), w * 2, 0, 0) }
    else strokePts(g, pts, al('#ffffff', .1), w + .6, 1, 1.4)
    strokePts(g, pts, o.glow ? al(o.core || '#ffe9a0', .95) : al(o.dark || '#0a0605', .62), o.glow ? w * .8 : w, 0, 0)
    if (depth < 2) for (var i = 2; i < pts.length - 1; i++) if (R() < .17) crack(g, R, pts[i][0], pts[i][1], Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]) + (R() < .5 ? -1 : 1) * (.6 + R() * .6), len * (.35 + R() * .25), w * .72, depth + 1, o)
  }

  var GRIT_D = 'rgba(8,5,4,.22)', GRIT_L = 'rgba(255,245,225,.13)', GRIT_M = 'rgba(8,5,4,.12)'
  function grit (g, R, W, H, density) {
    var n = (W * H / density) | 0, i, x, y, s, k
    for (i = 0; i < n; i++) {
      x = R() * W; y = R() * H; s = 1 + R() * 2.4; k = R()
      g.fillStyle = k < .5 ? GRIT_D : k < .8 ? GRIT_L : GRIT_M
      g.fillRect(x, y, s, s * (.6 + R() * .7))
    }
  }
  function pebble (g, R, x, y, r, col) {
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x + r * .25, y + r * .35, r * 1.05, r * .6, 0, 0, TAU); g.fill()
    lump(g, R, x, y, r, r * .75, 7); g.fillStyle = sh(col, -.2); g.fill()
    g.lineWidth = 1; g.strokeStyle = 'rgba(8,5,4,.5)'; g.stroke()
    g.fillStyle = 'rgba(255,245,225,.22)'; g.beginPath(); g.ellipse(x - r * .3, y - r * .28, r * .45, r * .26, -.5, 0, TAU); g.fill()
  }

  /* faint, broken tile seams (never a hard grid) */
  function tileHints (g, R, room, a, col) {
    var c, r
    g.lineCap = 'round'
    for (r = 0; r <= room.h; r++) for (c = 0; c < room.w; c++) {
      if (R() < .28) continue
      var y = r * TILE, x0 = c * TILE, wob = (R() - .5) * 3
      g.strokeStyle = al(col, a * (.5 + R() * .7)); g.lineWidth = 1.4
      g.beginPath(); g.moveTo(x0 - 2, y); g.lineTo(x0 + TILE * .5, y + wob); g.lineTo(x0 + TILE + 2, y); g.stroke()
      g.strokeStyle = 'rgba(255,245,225,' + (a * .35).toFixed(3) + ')'; g.beginPath(); g.moveTo(x0, y + 1.6); g.lineTo(x0 + TILE, y + 1.6); g.stroke()
    }
    for (c = 0; c <= room.w; c++) for (r = 0; r < room.h; r++) {
      if (R() < .28) continue
      var x = c * TILE, y0 = r * TILE, wb = (R() - .5) * 3
      g.strokeStyle = al(col, a * (.5 + R() * .7)); g.lineWidth = 1.4
      g.beginPath(); g.moveTo(x, y0 - 2); g.lineTo(x + wb, y0 + TILE * .5); g.lineTo(x, y0 + TILE + 2); g.stroke()
    }
    /* each tile gets a barely-there tone so the plane is not perfectly flat */
    for (r = 0; r < room.h; r++) for (c = 0; c < room.w; c++) {
      var k = R(); g.fillStyle = k > .5 ? 'rgba(255,240,215,' + ((k - .5) * .05).toFixed(3) + ')' : 'rgba(0,0,0,' + ((.5 - k) * .06).toFixed(3) + ')'
      g.fillRect(c * TILE + 3, r * TILE + 3, TILE - 6, TILE - 6)
    }
  }

  function floorPath (g, room) {
    g.beginPath()
    for (var row = 0; row < room.h; row++) for (var col = 0; col < room.w; col++) if (inShape(room, col, row)) g.rect(col * TILE, row * TILE, TILE, TILE)
  }

  function paintFloor (g, room, p, fam, R) {
    var W = room.pxW, H = room.pxH, i, n, x, y
    g.fillStyle = p.floor; g.fillRect(0, 0, W, H)
    /* broad low-frequency colour variation */
    n = Math.round(W * H / 26000)
    var tones = [p.floorAlt, sh(p.floor, .1), sh(p.floor, -.14), p.floorAlt]
    for (i = 0; i < n; i++) soft(g, R() * W, R() * H, 90 + R() * 150, 70 + R() * 110, R() * 3, tones[i & 3], .16 + R() * .16)
    for (i = 0; i < 3; i++) soft(g, R() * W, R() * H, 200 + R() * 120, 150 + R() * 80, R() * 3, '#000000', .09)

    if (fam === 'wood') {
      var ph = 26, rowN = Math.ceil(H / ph), pr, pw, tone
      for (pr = 0; pr < rowN; pr++) {
        x = -R() * 140
        while (x < W) {
          pw = 110 + R() * 190; tone = R()
          g.fillStyle = tone > .5 ? 'rgba(255,225,180,' + ((tone - .5) * .12).toFixed(3) + ')' : 'rgba(0,0,0,' + ((.5 - tone) * .2).toFixed(3) + ')'
          g.fillRect(x, pr * ph, pw, ph)
          g.fillStyle = 'rgba(14,7,3,.55)'; g.fillRect(x - 1, pr * ph + 1, 2.4, ph - 1)
          g.fillStyle = 'rgba(14,7,3,.8)'; g.fillRect(x + 5, pr * ph + 5, 1.8, 1.8); g.fillRect(x + 5, pr * ph + ph - 7, 1.8, 1.8)
          for (i = 0; i < 3; i++) {
            var gy = pr * ph + 4 + R() * (ph - 8)
            g.strokeStyle = 'rgba(30,16,8,' + (.1 + R() * .12).toFixed(2) + ')'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 6, gy)
            g.bezierCurveTo(x + pw * .3, gy - 2 + R() * 3, x + pw * .6, gy + 3 - R() * 3, x + pw - 6, gy + (R() - .5) * 2); g.stroke()
          }
          x += pw
        }
        g.fillStyle = 'rgba(14,7,3,.5)'; g.fillRect(0, pr * ph + ph - 1.5, W, 2.4)
        g.fillStyle = 'rgba(255,225,180,.06)'; g.fillRect(0, pr * ph + 1, W, 1.4)
      }
    } else if (fam === 'rock') {
      for (i = 0; i < 70; i++) { x = R() * W; y = R() * H; lump(g, R, x, y, 14 + R() * 30, 10 + R() * 18, 9); g.fillStyle = R() < .5 ? 'rgba(0,0,0,.09)' : 'rgba(255,240,215,.06)'; g.fill() }
    } else if (fam === 'stone' || fam === 'marble' || fam === 'gold' || fam === 'dark' || fam === 'fire') {
      tileHints(g, R, room, fam === 'dark' ? .07 : .11, fam === 'marble' ? '#4a4048' : fam === 'gold' ? '#4a3208' : '#0a0605')
    }

    /* stains / puddles */
    n = Math.round(W * H / 52000) + 3
    for (i = 0; i < n; i++) {
      x = R() * W; y = R() * H
      if (fam === 'wet') {
        var pw2 = 40 + R() * 70, ph2 = 24 + R() * 36
        stain(g, R, x, y, pw2, ph2, '#1e4a64', .42, '#0c2434')
        soft(g, x - pw2 * .2, y - ph2 * .25, pw2 * .6, ph2 * .5, 0, '#a8d8f0', .22)
        g.strokeStyle = 'rgba(210,240,255,.3)'; g.lineWidth = 1.6; g.beginPath(); g.ellipse(x - pw2 * .15, y - ph2 * .1, pw2 * .45, ph2 * .3, 0, 3.6, 5.4); g.stroke()
      } else if (fam === 'flesh') {
        stain(g, R, x, y, 30 + R() * 50, 20 + R() * 34, R() < .5 ? '#3a0610' : '#9a3a46', .26, null)
        soft(g, x - 6, y - 6, 22, 12, 0, '#ffc0c0', .13)
      } else if (fam === 'fire') {
        soft(g, x, y, 50 + R() * 50, 34 + R() * 30, R() * 3, '#050202', .35)
      } else if (fam === 'gold') {
        soft(g, x, y, 60 + R() * 60, 40 + R() * 30, R() * 3, R() < .5 ? '#fff0a0' : '#5a3a08', .12)
      } else if (fam === 'dark') {
        soft(g, x, y, 70 + R() * 60, 50 + R() * 40, R() * 3, R() < .5 ? '#2a2048' : '#000000', .25)
      } else {
        stain(g, R, x, y, 26 + R() * 50, 16 + R() * 30, fam === 'wood' ? '#1a0c06' : '#1a100c', .12 + R() * .1, R() < .5 ? '#0a0605' : null)
      }
    }

    /* family details */
    if (fam === 'flesh') {
      for (i = 0; i < 16; i++) crack(g, R, R() * W, R() * H, R() * TAU, 80 + R() * 120, 2.4, 0, { dark: '#4a0814', wob: 1.2 })
      for (i = 0; i < 40; i++) { x = R() * W; y = R() * H; g.fillStyle = 'rgba(255,200,200,.22)'; g.beginPath(); g.ellipse(x, y, 4 + R() * 6, 2 + R() * 2, R() * 3, 0, TAU); g.fill() }
    } else if (fam === 'fire') {
      for (i = 0; i < 16; i++) crack(g, R, R() * W, R() * H, R() * TAU, 90 + R() * 130, 2, 0, { glow: '#ff6a1a', core: '#ffd070' })
      for (i = 0; i < 60; i++) { g.fillStyle = 'rgba(255,' + (110 + (R() * 90 | 0)) + ',40,' + (.4 + R() * .4).toFixed(2) + ')'; g.fillRect(R() * W, R() * H, 2, 2) }
    } else if (fam === 'bone') {
      for (i = 0; i < 26; i++) {
        x = R() * W; y = R() * H; var ba = R() * TAU, bl = 12 + R() * 14
        g.save(); g.translate(x, y); g.rotate(ba)
        g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(-bl / 2 + 1, 2, bl, 4)
        g.fillStyle = 'rgba(214,204,176,.42)'; g.fillRect(-bl / 2, -2, bl, 4)
        g.beginPath(); g.arc(-bl / 2, -1.5, 3, 0, TAU); g.arc(-bl / 2, 1.8, 3, 0, TAU); g.arc(bl / 2, -1.5, 3, 0, TAU); g.arc(bl / 2, 1.8, 3, 0, TAU); g.fill()
        g.restore()
      }
      for (i = 0; i < 3; i++) {
        x = 80 + R() * (W - 160); y = 60 + R() * (H - 120)
        g.fillStyle = 'rgba(214,204,176,.3)'; g.beginPath(); g.ellipse(x, y, 12, 10, 0, 0, TAU); g.fill(); g.fillRect(x - 6, y + 6, 12, 7)
        g.fillStyle = 'rgba(12,8,6,.6)'; g.beginPath(); g.ellipse(x - 4.5, y, 3, 3.6, 0, 0, TAU); g.ellipse(x + 4.5, y, 3, 3.6, 0, 0, TAU); g.fill()
      }
    } else if (fam === 'marble') {
      for (i = 0; i < 12; i++) {
        var pts = crackPts(R, R() * W, R() * H, R() * TAU, 150 + R() * 200, .5)
        strokePts(g, pts, 'rgba(255,255,255,.2)', 3, 0, 0); strokePts(g, pts, 'rgba(80,70,95,.28)', 1.2, 0, 0)
      }
      var sg = g.createLinearGradient(0, 0, W, H); sg.addColorStop(0, 'rgba(255,255,255,.07)'); sg.addColorStop(.5, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(0,0,0,.08)'); g.fillStyle = sg; g.fillRect(0, 0, W, H)
    } else if (fam === 'gold') {
      var gg = g.createLinearGradient(0, 0, W, H); gg.addColorStop(0, 'rgba(255,236,150,.14)'); gg.addColorStop(.5, 'rgba(255,236,150,0)'); gg.addColorStop(1, 'rgba(90,50,0,.12)'); g.fillStyle = gg; g.fillRect(0, 0, W, H)
      for (i = 0; i < 14; i++) { x = R() * W; y = R() * H; g.strokeStyle = 'rgba(255,248,200,.5)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x + 4, y); g.moveTo(x, y - 4); g.lineTo(x, y + 4); g.stroke() }
    } else if (fam === 'dark') {
      for (i = 0; i < 70; i++) { g.fillStyle = 'rgba(190,175,255,' + (.1 + R() * .35).toFixed(2) + ')'; var ss = R() < .2 ? 2.2 : 1.2; g.fillRect(R() * W, R() * H, ss, ss) }
    }
    if (fam === 'rock' || fam === 'stone' || fam === 'bone' || fam === 'fire') {
      var pn = fam === 'rock' ? 46 : 18
      for (i = 0; i < pn; i++) pebble(g, R, R() * W, R() * H, 2 + R() * (fam === 'rock' ? 5 : 3.5), p.floorAlt)
    }
    if (fam !== 'fire' && fam !== 'flesh') {
      for (i = 0; i < 12; i++) crack(g, R, R() * W, R() * H, R() * TAU, 50 + R() * 120, fam === 'dark' ? 1.4 : 2.1, 0, fam === 'dark' ? { dark: '#000000' } : {})
    }
    grit(g, R, W, H, fam === 'dark' ? 160 : 85)

    /* soft edge falloff: the floor darkens toward the room perimeter */
    var vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .26, W / 2, H / 2, Math.max(W, H) * .66)
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(8,4,3,.4)'); g.fillStyle = vg; g.fillRect(0, 0, W, H)
    for (var row = 0; row < room.h; row++) for (var col = 0; col < room.w; col++) {
      if (!inShape(room, col, row)) continue
      var x0 = col * TILE, y0 = row * TILE, sg2
      /* soft wide falloff + tight contact shadow at the wall base */
      if (!inShape(room, col - 1, row)) { sg2 = g.createLinearGradient(x0, 0, x0 + 64, 0); sg2.addColorStop(0, 'rgba(8,4,3,.62)'); sg2.addColorStop(.25, 'rgba(8,4,3,.36)'); sg2.addColorStop(1, 'rgba(8,4,3,0)'); g.fillStyle = sg2; g.fillRect(x0, y0, 64, TILE + 1) }
      if (!inShape(room, col + 1, row)) { sg2 = g.createLinearGradient(x0 + TILE, 0, x0 + TILE - 64, 0); sg2.addColorStop(0, 'rgba(8,4,3,.55)'); sg2.addColorStop(.25, 'rgba(8,4,3,.3)'); sg2.addColorStop(1, 'rgba(8,4,3,0)'); g.fillStyle = sg2; g.fillRect(x0 + TILE - 64, y0, 64, TILE + 1) }
      if (!inShape(room, col, row - 1)) { sg2 = g.createLinearGradient(0, y0, 0, y0 + 72); sg2.addColorStop(0, 'rgba(8,4,3,.7)'); sg2.addColorStop(.22, 'rgba(8,4,3,.4)'); sg2.addColorStop(1, 'rgba(8,4,3,0)'); g.fillStyle = sg2; g.fillRect(x0, y0, TILE + 1, 72) }
      if (!inShape(room, col, row + 1)) { sg2 = g.createLinearGradient(0, y0 + TILE, 0, y0 + TILE - 56); sg2.addColorStop(0, 'rgba(8,4,3,.5)'); sg2.addColorStop(.25, 'rgba(8,4,3,.28)'); sg2.addColorStop(1, 'rgba(8,4,3,0)'); g.fillStyle = sg2; g.fillRect(x0, y0 + TILE - 56, TILE + 1, 56) }
    }
  }

  /* Wall face texture inside a rect. side = which wall this is: the floor edge is the dark base. */
  function wallTex (g, fam, rx, ry, rw, rh, p, seed, side) {
    g.save(); g.beginPath(); g.rect(rx, ry, rw, rh); g.clip()
    var i, vert = side === 'L' || side === 'R'
    /* gradient runs from the outer lip (lit) to the floor-side base (dark) */
    var ox = rx + (vert ? (side === 'L' ? 0 : rw) : 0), oy = ry + (vert ? 0 : (side === 'U' ? 0 : rh))
    var fx = rx + (vert ? (side === 'L' ? rw : 0) : 0), fy = ry + (vert ? 0 : (side === 'U' ? rh : 0))
    var gr = g.createLinearGradient(ox, oy, fx, fy)
    gr.addColorStop(0, sh(p.wall, .16)); gr.addColorStop(.55, sh(p.wall, -.04)); gr.addColorStop(1, sh(p.wall, -.42))
    g.fillStyle = gr; g.fillRect(rx, ry, rw, rh)
    if (fam === 'flesh') {
      for (i = 0; i < (rw * rh) / 420; i++) { g.fillStyle = i % 3 ? 'rgba(60,6,12,.28)' : 'rgba(255,140,140,.12)'; g.beginPath(); g.ellipse(rx + rr(seed + rx, i) * rw, ry + rr(seed + ry, i + 99) * rh, 8 + rr(i, rx) * 10, 5 + rr(i, ry) * 6, rr(i, 3) * 3, 0, TAU); g.fill() }
      g.strokeStyle = 'rgba(110,16,30,.5)'; g.lineWidth = 2.4
      for (i = 0; i < (rw * rh) / 2400; i++) { var vx = rx + rr(seed + i, rx) * rw, vy = ry + rr(seed + i, ry) * rh; g.beginPath(); g.moveTo(vx, vy); g.bezierCurveTo(vx + 10, vy + 14, vx - 8, vy + 24, vx + 6, vy + 38); g.stroke() }
    } else if (fam === 'wood') {
      for (i = 0; i < (vert ? rh : rw) / 26 + 2; i++) {
        var o0 = Math.floor((vert ? ry : rx) / 26) * 26 + i * 26
        g.fillStyle = 'rgba(20,10,6,.6)'; if (vert) g.fillRect(rx, o0, rw, 2.4); else g.fillRect(o0, ry, 2.4, rh)
        g.fillStyle = 'rgba(255,225,180,.07)'; if (vert) g.fillRect(rx, o0 + 2.4, rw, 1.6); else g.fillRect(o0 + 2.4, ry, 1.6, rh)
      }
    } else if (fam === 'bone') {
      for (i = 0; i < (vert ? rh : rw) / 22 + 2; i++) {
        var o1 = Math.floor((vert ? ry : rx) / 22) * 22 + i * 22
        g.fillStyle = 'rgba(230,220,195,.3)'; g.beginPath()
        if (vert) g.ellipse(rx + rw / 2, o1 + 8, rw * .4, 8, 0, 0, TAU); else g.ellipse(o1 + 8, ry + rh / 2, 8, rh * .4, 0, 0, TAU)
        g.fill(); g.strokeStyle = 'rgba(20,14,10,.55)'; g.lineWidth = 1.6; g.stroke()
      }
    } else {
      var bh = fam === 'rock' ? 22 : 18, bw = fam === 'rock' ? 40 : 36
      var r0 = Math.floor(ry / bh), r1 = Math.ceil((ry + rh) / bh)
      for (var r = r0; r <= r1; r++) {
        var yy = r * bh, off = (r & 1) * bw / 2, c0 = Math.floor((rx - off) / bw), c1 = Math.ceil((rx + rw - off) / bw)
        for (var c = c0; c <= c1; c++) {
          var xx = c * bw + off, hh = rr(seed + r * 13, c)
          if (hh > .68) { g.fillStyle = 'rgba(255,240,215,.07)'; g.fillRect(xx, yy, bw, bh) } else if (hh < .24) { g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(xx, yy, bw, bh) }
          g.fillStyle = 'rgba(255,240,215,.13)'; g.fillRect(xx + 1, yy + 1, bw - 2, 2)
          g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(xx + 1, yy + bh - 3, bw - 2, 2)
        }
        g.strokeStyle = 'rgba(12,8,6,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(rx, yy); g.lineTo(rx + rw, yy); g.stroke()
        for (c = c0; c <= c1; c++) { var xv = c * bw + off; g.beginPath(); g.moveTo(xv, yy); g.lineTo(xv, yy + bh); g.stroke() }
      }
      if (fam === 'fire') { g.strokeStyle = 'rgba(255,100,30,.45)'; g.lineWidth = 1.8; for (i = 0; i < (rw * rh) / 3000; i++) { var qx = rx + rr(seed + i, rx) * rw, qy = ry + rr(seed + i, ry) * rh; g.beginPath(); g.moveTo(qx, qy); g.lineTo(qx + 10, qy + 8); g.lineTo(qx + 6, qy + 18); g.stroke() } }
      if (fam === 'marble' || fam === 'gold') { g.strokeStyle = fam === 'gold' ? 'rgba(255,225,120,.4)' : 'rgba(255,255,255,.22)'; g.lineWidth = 1.2; g.strokeRect(rx + 1, ry + 1, rw - 2, rh - 2) }
    }
    for (i = 0; i < Math.max(1, (rw * rh) / 2600); i++) soft(g, rx + rr(seed + i * 3, rx) * rw, ry + rr(seed + i * 5, ry) * rh, 18 + rr(i, 9) * 22, 12 + rr(i, 11) * 14, 0, '#000000', .16)
    g.restore()
  }

  var WTEX = 60
  function build (room, p, fam) {
    if (typeof document === 'undefined') return null
    var c = document.createElement('canvas')
    c.width = room.pxW + WALL * 2
    c.height = room.pxH + WALL * 2
    var g = c.getContext('2d'), seed = (room.seed | 0) + (room.index | 0) * 7919, R = rng(seed * 2654435761 >>> 0)
    g.translate(WALL, WALL)
    g.fillStyle = p.backdrop
    g.fillRect(-WALL, -WALL, room.pxW + WALL * 2, room.pxH + WALL * 2)
    var row, col, x0, y0
    g.save(); floorPath(g, room); g.clip()
    paintFloor(g, room, p, fam, R)
    g.restore()

    /* Walls are derived from occupied cells, so L-room cut-outs get real walls. */
    var edges = []
    for (row = 0; row < room.h; row++) for (col = 0; col < room.w; col++) {
      if (!inShape(room, col, row)) continue
      x0 = col * TILE; y0 = row * TILE
      var L = !inShape(room, col - 1, row), Rr = !inShape(room, col + 1, row), U = !inShape(room, col, row - 1), D = !inShape(room, col, row + 1)
      if (L || Rr || U || D) edges.push([x0, y0, L, Rr, U, D])
      g.fillStyle = sh(p.wallDark, -.2)
      if (L) g.fillRect(x0 - WALL, y0, WALL, TILE + 1)
      if (Rr) g.fillRect(x0 + TILE, y0, WALL, TILE + 1)
      if (U) g.fillRect(x0, y0 - WALL, TILE + 1, WALL)
      if (D) g.fillRect(x0, y0 + TILE, TILE + 1, WALL)
      if (L && U) g.fillRect(x0 - WALL, y0 - WALL, WALL, WALL)
      if (Rr && U) g.fillRect(x0 + TILE, y0 - WALL, WALL, WALL)
      if (L && D) g.fillRect(x0 - WALL, y0 + TILE, WALL, WALL)
      if (Rr && D) g.fillRect(x0 + TILE, y0 + TILE, WALL, WALL)
    }
    var ei, e
    for (ei = 0; ei < edges.length; ei++) {
      e = edges[ei]; x0 = e[0]; y0 = e[1]
      if (e[2]) wallTex(g, fam, x0 - WTEX, y0, WTEX, TILE + 1, p, seed, 'L')
      if (e[3]) wallTex(g, fam, x0 + TILE, y0, WTEX, TILE + 1, p, seed, 'R')
      if (e[4]) wallTex(g, fam, x0, y0 - WTEX, TILE + 1, WTEX, p, seed, 'U')
      if (e[5]) wallTex(g, fam, x0, y0 + TILE, TILE + 1, WTEX, p, seed, 'D')
      if (e[2] && e[4]) wallTex(g, fam, x0 - WTEX, y0 - WTEX, WTEX, WTEX, p, seed, 'U')
      if (e[3] && e[4]) wallTex(g, fam, x0 + TILE, y0 - WTEX, WTEX, WTEX, p, seed, 'U')
      if (e[2] && e[5]) wallTex(g, fam, x0 - WTEX, y0 + TILE, WTEX, WTEX, p, seed, 'D')
      if (e[3] && e[5]) wallTex(g, fam, x0 + TILE, y0 + TILE, WTEX, WTEX, p, seed, 'D')
    }
    /* lit top lip (light from the upper left), then the thick dark outline where wall meets floor */
    var litCol = fam === 'flesh' ? 'rgba(255,170,170,' : fam === 'gold' ? 'rgba(255,236,150,' : 'rgba(236,205,160,'
    var lip = 9
    for (ei = 0; ei < edges.length; ei++) {
      e = edges[ei]; x0 = e[0]; y0 = e[1]
      g.lineWidth = 2.6; g.lineCap = 'butt'
      g.beginPath()
      if (e[2]) { g.moveTo(x0 - lip, y0); g.lineTo(x0 - lip, y0 + TILE) }
      if (e[4]) { g.moveTo(x0, y0 - lip); g.lineTo(x0 + TILE, y0 - lip) }
      g.strokeStyle = litCol + '.3)'; g.stroke(); g.beginPath()
      if (e[3]) { g.moveTo(x0 + TILE + lip, y0); g.lineTo(x0 + TILE + lip, y0 + TILE) }
      if (e[5]) { g.moveTo(x0, y0 + TILE + lip); g.lineTo(x0 + TILE, y0 + TILE + lip) }
      g.strokeStyle = litCol + '.12)'; g.stroke()
    }
    for (ei = 0; ei < edges.length; ei++) {
      e = edges[ei]; x0 = e[0]; y0 = e[1]
      g.lineWidth = 6; g.lineCap = 'square'; g.strokeStyle = 'rgba(6,3,2,.92)'; g.beginPath()
      if (e[2]) { g.moveTo(x0 - 1, y0); g.lineTo(x0 - 1, y0 + TILE) }
      if (e[3]) { g.moveTo(x0 + TILE + 1, y0); g.lineTo(x0 + TILE + 1, y0 + TILE) }
      if (e[4]) { g.moveTo(x0, y0 - 1); g.lineTo(x0 + TILE, y0 - 1) }
      if (e[5]) { g.moveTo(x0, y0 + TILE + 1); g.lineTo(x0 + TILE, y0 + TILE + 1) }
      g.stroke()
    }
    return c
  }

  IS.drawBackdrop = function (g, room, floor) {
    if (!g || !room) return
    var p = palette(room, floor), fam = family(floor), key = [room.index, room.seed, room.shape, p.wall, p.floor, p.floorAlt, fam].join('|')
    var c = cache[key]
    if (!c) { if (cacheN++ > 24) { cache = Object.create(null); cacheN = 0 } c = cache[key] = build(room, p, fam) }
    if (c) g.drawImage(c, -WALL, -WALL)
    else { g.fillStyle = p.floor; g.fillRect(0, 0, room.pxW, room.pxH) }
    var grad = g.createRadialGradient(room.pxW / 2, room.pxH / 2, Math.min(room.pxW, room.pxH) * .2, room.pxW / 2, room.pxH / 2, Math.max(room.pxW, room.pxH) * .72)
    grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(12,8,6,.2)')
    g.fillStyle = grad; g.fillRect(-WALL, -WALL, room.pxW + WALL * 2, room.pxH + WALL * 2)
  }

  function sprite (g, name, x, y, s, t) {
    if (typeof IS.drawSprite === 'function' && IS.sprite && IS.sprite(name)) IS.drawSprite(g, name, x, y, s, t)
    else { g.fillStyle = (t && t.tint) || '#5a4537'; g.fillRect(x - s * .35, y - s * .3, s * .7, s * .6) }
  }

  /* Flat floor features get no standing shadow; everything else gets a soft one (light from the upper left). */
  var FLAT = /^(spikes|retract-spikes|retracting-spikes|pit|pit-bridge|web|water|crawlspace|corny-poop)$/
  IS.drawGridObjects = function (g, room) {
    if (!room || !room.grid) return
    var list = room.grid.slice().sort(function (a, b) { return a.y - b.y }), now = room.time || 0
    for (var i = 0; i < list.length; i++) {
      var o = list[i]; if (!o || o.broken) continue
      var kind = o.kind
      if (o.kind === 'pit') { if (!o.bridged) continue; kind = 'pit-bridge' }
      if (!FLAT.test(kind)) {
        g.fillStyle = 'rgba(14,8,6,.3)'; g.beginPath(); g.ellipse(o.x + 5, o.y + 26, 31, 9, 0, 0, Math.PI * 2); g.fill()
      }
      var charge = o.lit ? 1 : 0
      if (o.kind === 'retract-spikes') {
        /* ease the plate between up and down so the spikes visibly slide */
        var target = o.up ? 1 : 0, dt = Math.min(.1, Math.max(0, now - (o._vt == null ? now : o._vt)))
        o._vc = o._vc == null ? target : o._vc + (target - o._vc) * Math.min(1, dt * 16); o._vt = now
        charge = o._vc
      }
      var seed = ((o.col | 0) * 73856093) ^ ((o.row | 0) * 19349663) ^ ((typeof o.variant === 'number' ? o.variant : 0) * 83492791)
      sprite(g, kind, o.x, o.y, TILE, { frame: now, time: now, variant: seed, tint: o.tint, charge: charge, hp01: o.maxHp ? o.hp / o.maxHp : 1 })
      if (kind === 'poop' || kind === 'red-poop' || kind === 'corn-poop') sprite(g, 'poop-flies', o.x, o.y + 8 * (1 - Math.max(.28, o.maxHp ? o.hp / o.maxHp : 1)), TILE, { time: now })
    }
  }

  IS.drawDoors = function (g, room) {
    if (!room || !room.doors) return
    for (var i = 0; i < room.doors.length; i++) {
      var d = room.doors[i]; if (!d || d.hidden) continue
      g.save(); g.translate(d.x, d.y)
      if (d.dir === 'left') g.rotate(-Math.PI / 2); else if (d.dir === 'right') g.rotate(Math.PI / 2); else if (d.dir === 'down') g.rotate(Math.PI)
      sprite(g, 'door:' + d.kind, 0, 0, 104, { charge: d.open ? 1 : 0, variant: d.locked ? 'locked' : '', time: room.time || 0 })
      g.restore()
    }
  }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
