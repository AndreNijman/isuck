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

  function build (room, p) {
    if (typeof document === 'undefined') return null
    var c = document.createElement('canvas')
    c.width = room.pxW + WALL * 2
    c.height = room.pxH + WALL * 2
    var g = c.getContext('2d'), seed = room.seed | 0
    g.translate(WALL, WALL)
    g.fillStyle = p.backdrop
    g.fillRect(-WALL, -WALL, room.pxW + WALL * 2, room.pxH + WALL * 2)
    for (var row = 0; row < room.h; row++) for (var col = 0; col < room.w; col++) {
      if (!inShape(room, col, row)) continue
      var h = hash(seed + row * 131 + col * 977)
      g.fillStyle = h > 0.48 ? p.floor : p.floorAlt
      g.fillRect(col * TILE, row * TILE, TILE + 1, TILE + 1)
      g.strokeStyle = 'rgba(35,24,18,.14)'; g.lineWidth = 1
      g.strokeRect(col * TILE + .5, row * TILE + .5, TILE - 1, TILE - 1)
      if (h > .83) {
        var x = col * TILE + 12 + hash(seed + col * 71 + row) * 52
        var y = row * TILE + 15 + hash(seed + row * 83 + col) * 48
        g.strokeStyle = 'rgba(45,31,24,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 9, y - 2); g.lineTo(x, y); g.lineTo(x + 7, y + 8); g.stroke()
      }
      if (h < .055) {
        g.fillStyle = 'rgba(38,24,20,.23)'; g.beginPath(); g.ellipse(col * TILE + 40, row * TILE + 43, 21, 9, h * 9, 0, Math.PI * 2); g.fill()
      }
    }
    /* Edges are derived from occupied cells, so L-room cut-outs get real walls. */
    for (row = 0; row < room.h; row++) for (col = 0; col < room.w; col++) {
      if (!inShape(room, col, row)) continue
      var x0 = col * TILE, y0 = row * TILE
      g.fillStyle = p.wallDark
      if (!inShape(room, col - 1, row)) g.fillRect(x0 - WALL, y0, WALL, TILE + 1)
      if (!inShape(room, col + 1, row)) g.fillRect(x0 + TILE, y0, WALL, TILE + 1)
      if (!inShape(room, col, row - 1)) g.fillRect(x0, y0 - WALL, TILE + 1, WALL)
      if (!inShape(room, col, row + 1)) g.fillRect(x0, y0 + TILE, TILE + 1, WALL)
      g.fillStyle = p.wall
      if (!inShape(room, col - 1, row)) g.fillRect(x0 - 47, y0, 47, TILE + 1)
      if (!inShape(room, col + 1, row)) g.fillRect(x0 + TILE, y0, 47, TILE + 1)
      if (!inShape(room, col, row - 1)) g.fillRect(x0, y0 - 47, TILE + 1, 47)
      if (!inShape(room, col, row + 1)) g.fillRect(x0, y0 + TILE, TILE + 1, 47)
    }
    g.strokeStyle = 'rgba(224,180,118,.16)'; g.lineWidth = 5
    for (row = 0; row < room.h; row++) for (col = 0; col < room.w; col++) if (inShape(room, col, row)) {
      x0 = col * TILE; y0 = row * TILE; g.beginPath()
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
    var p = palette(room, floor), key = [room.index, room.seed, room.shape, p.wall, p.floor, p.floorAlt].join('|')
    var c = cache[key] || (cache[key] = build(room, p))
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
