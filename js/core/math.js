;(function (IS) {
  'use strict'
  IS.clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
  IS.lerp = (a, b, t) => a + (b - a) * t
  IS.sign = v => v < 0 ? -1 : v > 0 ? 1 : 0
  IS.approach = (v, target, d) => v < target ? Math.min(target, v + d) : Math.max(target, v - d)
  IS.dist2 = (ax, ay, bx, by) => (ax - bx) ** 2 + (ay - by) ** 2
  IS.dist = (ax, ay, bx, by) => Math.sqrt(IS.dist2(ax, ay, bx, by))
  IS.len = (x, y) => Math.sqrt(x * x + y * y)
  IS.norm = (x, y) => { const l = IS.len(x, y); return l ? { x: x / l, y: y / l } : { x: 0, y: 0 } }
  IS.angleTo = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax)
  IS.angleDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a))
  IS.rotate = (x, y, a) => ({ x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) })
  IS.fromAngle = (a, m) => ({ x: Math.cos(a) * (m == null ? 1 : m), y: Math.sin(a) * (m == null ? 1 : m) })
  IS.easeIn = t => t * t
  IS.easeOut = t => 1 - (1 - t) * (1 - t)
  IS.easeInOut = t => t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2
  IS.circleHit = (ax, ay, ar, bx, by, br) => IS.dist2(ax, ay, bx, by) <= (ar + br) ** 2
  IS.circleRect = (cx, cy, cr, rx, ry, rw, rh) => IS.dist2(cx, cy, IS.clamp(cx, rx, rx + rw), IS.clamp(cy, ry, ry + rh)) <= cr * cr
  IS.rectHit = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
  IS.cellCenter = (col, row) => ({ x: col * IS.TILE + IS.TILE / 2, y: row * IS.TILE + IS.TILE / 2 })
  IS.cellOf = (x, y) => ({ col: IS.clamp(Math.floor(x / IS.TILE), 0, IS.ROOM_W - 1), row: IS.clamp(Math.floor(y / IS.TILE), 0, IS.ROOM_H - 1) })
  IS.inBounds = (room, x, y, r) => x >= r && y >= r && x <= room.pxW - r && y <= room.pxH - r
  IS.clampToRoom = (room, e) => { e.x = IS.clamp(e.x, e.r || 0, room.pxW - (e.r || 0)); e.y = IS.clamp(e.y, e.r || 0, room.pxH - (e.r || 0)); return e }
  IS.hexToRgb = hex => { const h = String(hex || '#000').replace('#', ''); const s = h.length === 3 ? h.replace(/./g, c => c + c) : h; return { r: parseInt(s.slice(0, 2), 16) || 0, g: parseInt(s.slice(2, 4), 16) || 0, b: parseInt(s.slice(4, 6), 16) || 0 } }
  IS.shade = (hex, amount) => { const c = IS.hexToRgb(hex); const f = amount < 0 ? 1 + amount : 1; const add = amount > 0 ? 255 * amount : 0; return '#' + [c.r, c.g, c.b].map(v => Math.round(v * f + add).toString(16).padStart(2, '0')).join('') }
  IS.mix = (a, b, t) => { const x = IS.hexToRgb(a); const y = IS.hexToRgb(b); return '#' + ['r', 'g', 'b'].map(k => Math.round(IS.lerp(x[k], y[k], t)).toString(16).padStart(2, '0')).join('') }
  IS.alpha = (hex, a) => { const c = IS.hexToRgb(hex); return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')' }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
