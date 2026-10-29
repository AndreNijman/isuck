;(function (IS) {
  'use strict'

  var WALL = IS.WALL || 80
  var TILE = IS.TILE || 80
  var cache = Object.create(null)

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

  function floorTile (g, fam, x, y, h, seed, p, col, row) {
    var base = h > 0.48 ? p.floor : p.floorAlt
    g.fillStyle = base; g.fillRect(x, y, TILE + 1, TILE + 1)
    var i
    /* soft speckle */
    for (i = 0; i < 9; i++) { g.fillStyle = rr(seed + col * 5 + row * 11, i) > .5 ? 'rgba(255,240,220,.05)' : 'rgba(0,0,0,.06)'; g.fillRect(x + rr(seed + col, i + 20) * 74, y + rr(seed + row, i + 40) * 74, 3 + rr(i, col + row) * 7, 2 + rr(col, i + row) * 5) }
    if (fam === 'wood') {
      for (i = 0; i < 4; i++) { var py = y + i * 20; g.fillStyle = i % 2 ? 'rgba(0,0,0,.07)' : 'rgba(255,230,190,.04)'; g.fillRect(x, py, TILE, 20); g.fillStyle = 'rgba(25,14,8,.45)'; g.fillRect(x, py + 19, TILE, 2); var jx = x + rr(seed + row * 4 + i, col) * 70; g.fillRect(jx, py, 2, 20) }
      g.strokeStyle = 'rgba(40,22,12,.22)'; g.lineWidth = 1
      for (i = 0; i < 5; i++) { var gy = y + rr(seed + col + i, row) * 76; g.beginPath(); g.moveTo(x + 4, gy); g.bezierCurveTo(x + 26, gy - 3, x + 50, gy + 3, x + 76, gy - 1); g.stroke() }
      return
    }
    if (fam === 'flesh') {
      g.fillStyle = 'rgba(80,10,16,.14)'; g.beginPath(); g.ellipse(x + 20 + rr(seed + col, row) * 40, y + 20 + rr(seed + row, col) * 40, 26, 18, rr(col, row) * 3, 0, TAU); g.fill()
      g.strokeStyle = 'rgba(120,20,34,.34)'; g.lineWidth = 1.6
      for (i = 0; i < 2; i++) { var vx = x + rr(seed + col + i * 3, row) * 80, vy = y + rr(seed + row + i * 5, col) * 80; g.beginPath(); g.moveTo(vx, vy); g.bezierCurveTo(vx + 16, vy - 12, vx + 22, vy + 14, vx + 40, vy + 6); g.stroke() }
      if (h < .1) { g.fillStyle = 'rgba(255,170,170,.12)'; g.beginPath(); g.ellipse(x + 40, y + 40, 18, 9, 0, 0, TAU); g.fill() }
      return
    }
    g.strokeStyle = fam === 'marble' ? 'rgba(90,80,70,.28)' : fam === 'gold' ? 'rgba(80,50,10,.35)' : fam === 'dark' ? 'rgba(160,140,200,.07)' : 'rgba(25,16,12,.2)'; g.lineWidth = 1.4
    g.strokeRect(x + .5, y + .5, TILE - 1, TILE - 1)
    if (fam !== 'dark') { g.fillStyle = 'rgba(255,240,215,.06)'; g.fillRect(x + 1, y + 1, TILE - 2, 3); g.fillRect(x + 1, y + 1, 3, TILE - 2) }
    if (fam === 'marble') {
      g.strokeStyle = 'rgba(120,110,130,.22)'; g.lineWidth = 1.2
      for (i = 0; i < 2; i++) { var mx = x + rr(seed + col, row + i) * 60, my = y + rr(seed + row, col + i) * 60; g.beginPath(); g.moveTo(mx, my); g.bezierCurveTo(mx + 20, my + 6, mx + 8, my + 30, mx + 30, my + 44); g.stroke() }
    }
    if (fam === 'gold') { g.fillStyle = 'rgba(255,230,120,.12)'; g.fillRect(x + 6, y + 6, TILE - 12, 3) }
    if (fam === 'wet' && h < .22) {
      g.fillStyle = 'rgba(40,90,120,.34)'; g.beginPath(); g.ellipse(x + 18 + rr(seed, col + row) * 44, y + 20 + rr(seed + 3, row) * 40, 26, 11, 0, 0, TAU); g.fill()
      g.strokeStyle = 'rgba(190,230,255,.22)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(x + 40, y + 40, 16, 6, 0, 0, TAU); g.stroke()
    }
    if (fam === 'fire' && h > .55) {
      g.strokeStyle = 'rgba(255,110,30,.55)'; g.lineWidth = 2; g.beginPath()
      var fx = x + 10 + rr(seed + col, row) * 40, fy = y + 14 + rr(seed + row, col) * 40
      g.moveTo(fx, fy); g.lineTo(fx + 12, fy + 8); g.lineTo(fx + 8, fy + 20); g.lineTo(fx + 24, fy + 30); g.stroke()
      g.strokeStyle = 'rgba(255,220,120,.35)'; g.lineWidth = 1; g.stroke()
    }
    if (fam === 'bone' && h < .09) {
      g.fillStyle = 'rgba(225,215,190,.5)'; g.beginPath(); g.ellipse(x + 30, y + 40, 12, 9, .4, 0, TAU); g.fill()
      g.fillStyle = 'rgba(20,14,10,.75)'; g.fillRect(x + 25, y + 38, 4, 5); g.fillRect(x + 32, y + 38, 4, 5)
    }
    if (fam === 'dark' && h < .06) { g.fillStyle = 'rgba(210,200,255,.6)'; g.fillRect(x + 20 + rr(seed, col) * 40, y + 20 + rr(seed, row) * 40, 2, 2) }
    if (h > .83) {
      var cx = x + 12 + rr(seed + col * 71, row) * 52, cy = y + 15 + rr(seed + row * 83, col) * 48
      g.strokeStyle = 'rgba(30,20,14,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 9, cy - 2); g.lineTo(cx, cy); g.lineTo(cx + 7, cy + 8); g.stroke()
    }
    if (h < .055) { g.fillStyle = 'rgba(38,24,20,.2)'; g.beginPath(); g.ellipse(x + 40, y + 43, 21, 9, h * 9, 0, TAU); g.fill() }
  }

  /* Wall face texture inside a rect. */
  function wallTex (g, fam, rx, ry, rw, rh, p, seed) {
    g.save(); g.beginPath(); g.rect(rx, ry, rw, rh); g.clip()
    var i, vert = rw < rh
    var gr = vert ? g.createLinearGradient(rx, 0, rx + rw, 0) : g.createLinearGradient(0, ry, 0, ry + rh)
    gr.addColorStop(0, sh(p.wall, .08)); gr.addColorStop(1, sh(p.wall, -.12)); g.fillStyle = gr; g.fillRect(rx, ry, rw, rh)
    if (fam === 'flesh') {
      for (i = 0; i < (rw * rh) / 420; i++) { g.fillStyle = i % 3 ? 'rgba(60,6,12,.28)' : 'rgba(255,140,140,.12)'; g.beginPath(); g.ellipse(rx + rr(seed + rx, i) * rw, ry + rr(seed + ry, i + 99) * rh, 8 + rr(i, rx) * 10, 5 + rr(i, ry) * 6, rr(i, 3) * 3, 0, TAU); g.fill() }
      g.strokeStyle = 'rgba(110,16,30,.5)'; g.lineWidth = 2
      for (i = 0; i < (rw * rh) / 2400; i++) { var vx = rx + rr(seed + i, rx) * rw, vy = ry + rr(seed + i, ry) * rh; g.beginPath(); g.moveTo(vx, vy); g.bezierCurveTo(vx + 10, vy + 14, vx - 8, vy + 24, vx + 6, vy + 38); g.stroke() }
    } else if (fam === 'wood') {
      for (i = 0; i < (vert ? rh : rw) / 24 + 1; i++) { g.fillStyle = 'rgba(20,10,6,.5)'; if (vert) g.fillRect(rx, ry + i * 24, rw, 2); else g.fillRect(rx + i * 24, ry, 2, rh) }
    } else if (fam === 'bone') {
      for (i = 0; i < (vert ? rh : rw) / 22 + 1; i++) {
        g.fillStyle = 'rgba(230,220,195,.28)'; g.beginPath()
        if (vert) g.ellipse(rx + rw / 2, ry + i * 22 + 8, rw * .38, 7, 0, 0, TAU); else g.ellipse(rx + i * 22 + 8, ry + rh / 2, 7, rh * .38, 0, 0, TAU)
        g.fill(); g.strokeStyle = 'rgba(20,14,10,.5)'; g.lineWidth = 1.4; g.stroke()
      }
    } else {
      var bh = fam === 'rock' ? 22 : 16, bw = fam === 'rock' ? 40 : 34
      g.strokeStyle = 'rgba(14,9,7,.55)'; g.lineWidth = 1.8
      var r0 = Math.floor(ry / bh), r1 = Math.ceil((ry + rh) / bh)
      for (var r = r0; r <= r1; r++) {
        var yy = r * bh; g.beginPath(); g.moveTo(rx, yy); g.lineTo(rx + rw, yy); g.stroke()
        var off = (r & 1) * bw / 2, c0 = Math.floor((rx - off) / bw), c1 = Math.ceil((rx + rw - off) / bw)
        for (var c = c0; c <= c1; c++) {
          var xx = c * bw + off; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + bh); g.stroke()
          var hh = rr(seed + r * 13, c)
          if (hh > .7) { g.fillStyle = 'rgba(255,240,215,.07)'; g.fillRect(xx + 1, yy + 1, bw - 2, bh - 2) } else if (hh < .22) { g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(xx + 1, yy + 1, bw - 2, bh - 2) }
        }
      }
      if (fam === 'fire') { g.strokeStyle = 'rgba(255,100,30,.4)'; g.lineWidth = 1.6; for (i = 0; i < (rw * rh) / 3000; i++) { var qx = rx + rr(seed + i, rx) * rw, qy = ry + rr(seed + i, ry) * rh; g.beginPath(); g.moveTo(qx, qy); g.lineTo(qx + 10, qy + 8); g.lineTo(qx + 6, qy + 18); g.stroke() } }
      if (fam === 'marble' || fam === 'gold') { g.strokeStyle = fam === 'gold' ? 'rgba(255,225,120,.35)' : 'rgba(255,255,255,.2)'; g.lineWidth = 1; g.strokeRect(rx + 1, ry + 1, rw - 2, rh - 2) }
    }
    g.restore()
  }

  function build (room, p, fam) {
    if (typeof document === 'undefined') return null
    var c = document.createElement('canvas')
    c.width = room.pxW + WALL * 2
    c.height = room.pxH + WALL * 2
    var g = c.getContext('2d'), seed = room.seed | 0
    g.translate(WALL, WALL)
    g.fillStyle = p.backdrop
    g.fillRect(-WALL, -WALL, room.pxW + WALL * 2, room.pxH + WALL * 2)
    var row, col, h, x0, y0
    for (row = 0; row < room.h; row++) for (col = 0; col < room.w; col++) {
      if (!inShape(room, col, row)) continue
      h = hash(seed + row * 131 + col * 977)
      floorTile(g, fam, col * TILE, row * TILE, h, seed, p, col, row)
    }
    /* Edges are derived from occupied cells, so L-room cut-outs get real walls. */
    for (row = 0; row < room.h; row++) for (col = 0; col < room.w; col++) {
      if (!inShape(room, col, row)) continue
      x0 = col * TILE; y0 = row * TILE
      var L = !inShape(room, col - 1, row), R = !inShape(room, col + 1, row), U = !inShape(room, col, row - 1), D = !inShape(room, col, row + 1)
      g.fillStyle = p.wallDark
      if (L) g.fillRect(x0 - WALL, y0, WALL, TILE + 1)
      if (R) g.fillRect(x0 + TILE, y0, WALL, TILE + 1)
      if (U) g.fillRect(x0, y0 - WALL, TILE + 1, WALL)
      if (D) g.fillRect(x0, y0 + TILE, TILE + 1, WALL)
      if (L) wallTex(g, fam, x0 - 47, y0, 47, TILE + 1, p, seed)
      if (R) wallTex(g, fam, x0 + TILE, y0, 47, TILE + 1, p, seed)
      if (U) wallTex(g, fam, x0, y0 - 47, TILE + 1, 47, p, seed)
      if (D) wallTex(g, fam, x0, y0 + TILE, TILE + 1, 47, p, seed)
      /* inner shadow cast onto the floor */
      var sg
      if (L) { sg = g.createLinearGradient(x0, 0, x0 + 34, 0); sg.addColorStop(0, 'rgba(10,5,4,.5)'); sg.addColorStop(1, 'rgba(10,5,4,0)'); g.fillStyle = sg; g.fillRect(x0, y0, 34, TILE + 1) }
      if (R) { sg = g.createLinearGradient(x0 + TILE, 0, x0 + TILE - 34, 0); sg.addColorStop(0, 'rgba(10,5,4,.5)'); sg.addColorStop(1, 'rgba(10,5,4,0)'); g.fillStyle = sg; g.fillRect(x0 + TILE - 34, y0, 34, TILE + 1) }
      if (U) { sg = g.createLinearGradient(0, y0, 0, y0 + 38); sg.addColorStop(0, 'rgba(10,5,4,.55)'); sg.addColorStop(1, 'rgba(10,5,4,0)'); g.fillStyle = sg; g.fillRect(x0, y0, TILE + 1, 38) }
      if (D) { sg = g.createLinearGradient(0, y0 + TILE, 0, y0 + TILE - 30); sg.addColorStop(0, 'rgba(10,5,4,.4)'); sg.addColorStop(1, 'rgba(10,5,4,0)'); g.fillStyle = sg; g.fillRect(x0, y0 + TILE - 30, TILE + 1, 30) }
    }
    g.lineWidth = 4
    g.strokeStyle = fam === 'flesh' ? 'rgba(255,150,150,.2)' : fam === 'gold' ? 'rgba(255,230,130,.3)' : 'rgba(224,180,118,.16)'
    for (row = 0; row < room.h; row++) for (col = 0; col < room.w; col++) if (inShape(room, col, row)) {
      x0 = col * TILE; y0 = row * TILE
      g.beginPath()
      if (!inShape(room, col - 1, row)) { g.moveTo(x0, y0); g.lineTo(x0, y0 + TILE) }
      if (!inShape(room, col + 1, row)) { g.moveTo(x0 + TILE, y0); g.lineTo(x0 + TILE, y0 + TILE) }
      if (!inShape(room, col, row - 1)) { g.moveTo(x0, y0); g.lineTo(x0 + TILE, y0) }
      if (!inShape(room, col, row + 1)) { g.moveTo(x0, y0 + TILE); g.lineTo(x0 + TILE, y0 + TILE) }
      g.stroke()
    }
    return c
  }

  IS.drawBackdrop = function (g, room, floor) {
    if (!g || !room) return
    var p = palette(room, floor), fam = family(floor), key = [room.index, room.seed, room.shape, p.wall, p.floor, p.floorAlt, fam].join('|')
    var c = cache[key] || (cache[key] = build(room, p, fam))
    if (c) g.drawImage(c, -WALL, -WALL)
    else { g.fillStyle = p.floor; g.fillRect(0, 0, room.pxW, room.pxH) }
    var grad = g.createRadialGradient(room.pxW / 2, room.pxH / 2, Math.min(room.pxW, room.pxH) * .2, room.pxW / 2, room.pxH / 2, Math.max(room.pxW, room.pxH) * .72)
    grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(12,8,6,.36)')
    g.fillStyle = grad; g.fillRect(-WALL, -WALL, room.pxW + WALL * 2, room.pxH + WALL * 2)
  }

  function sprite (g, name, x, y, s, t) {
    if (typeof IS.drawSprite === 'function' && IS.sprite && IS.sprite(name)) IS.drawSprite(g, name, x, y, s, t)
    else { g.fillStyle = (t && t.tint) || '#5a4537'; g.fillRect(x - s * .35, y - s * .3, s * .7, s * .6) }
  }

  IS.drawGridObjects = function (g, room) {
    if (!room || !room.grid) return
    var list = room.grid.slice().sort(function (a, b) { return a.y - b.y })
    for (var i = 0; i < list.length; i++) {
      var o = list[i]; if (!o || o.broken || o.kind === 'pit') continue
      g.fillStyle = 'rgba(20,13,10,.28)'; g.beginPath(); g.ellipse(o.x, o.y + 23, 29, 10, 0, 0, Math.PI * 2); g.fill()
      sprite(g, o.kind, o.x, o.y, TILE, { frame: room.time || 0, time: room.time || 0, variant: o.variant, tint: o.tint, charge: o.kind === 'retract-spikes' ? (o.up ? 1 : 0) : (o.lit ? 1 : 0), hp01: o.maxHp ? o.hp / o.maxHp : 1 })
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
