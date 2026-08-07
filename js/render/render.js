;(function (IS) {
  'use strict'

  var VW = IS.VIEW_W || 1280, VH = IS.VIEW_H || 720
  IS.camera = IS.camera || { x: (IS.ROOM_PX_W || 1040) / 2, y: (IS.ROOM_PX_H || 560) / 2, zoom: 1, shakeX: 0, shakeY: 0, scale: 1, offsetX: 0, offsetY: 0 }

  IS.updateCamera = function (room, p, dt) {
    if (!room) return IS.camera
    var c = IS.camera, halfW = VW / (2 * c.zoom), halfH = VH / (2 * c.zoom)
    var tx = room.pxW / 2, ty = room.pxH / 2
    if ((room.pxW > IS.ROOM_PX_W || room.pxH > IS.ROOM_PX_H) && p) {
      var dzx = 120, dzy = 75
      tx = c.x + (p.x < c.x - dzx ? p.x - (c.x - dzx) : p.x > c.x + dzx ? p.x - (c.x + dzx) : 0)
      ty = c.y + (p.y < c.y - dzy ? p.y - (c.y - dzy) : p.y > c.y + dzy ? p.y - (c.y + dzy) : 0)
    }
    tx = Math.max(halfW - (IS.WALL || 80), Math.min(room.pxW + (IS.WALL || 80) - halfW, tx))
    ty = Math.max(halfH - (IS.WALL || 80), Math.min(room.pxH + (IS.WALL || 80) - halfH, ty))
    var k = 1 - Math.exp(-Math.max(0, dt || 0) * 9)
    c.x += (tx - c.x) * k; c.y += (ty - c.y) * k
    return c
  }

  IS.worldToScreen = function (x, y) { var c = IS.camera; return { x: (x - c.x + c.shakeX) * c.zoom + VW / 2, y: (y - c.y + c.shakeY) * c.zoom + VH / 2 } }
  IS.screenToWorld = function (x, y) { var c = IS.camera; return { x: (x - VW / 2) / c.zoom + c.x - c.shakeX, y: (y - VH / 2) / c.zoom + c.y - c.shakeY } }

  function spr (g, name, e, size, extra) {
    if (!e) return
    var t = Object.assign({ frame: e.frame || 0, time: (IS.state && IS.state.time) || 0, dir: e.dir, hurt: e.hurtT > 0, tint: e.tint, hp01: e.maxHp ? e.hp / e.maxHp : 1, charge: e.attackT || (e.ai && e.ai.charge) || 0, variant: e.variant }, extra || {})
    if (typeof IS.drawSprite === 'function') IS.drawSprite(g, name, e.x, e.y - (e.z || 0), size, t)
    else { g.fillStyle = e.tint || '#d8c3a7'; g.beginPath(); g.arc(e.x, e.y, size * .4, 0, Math.PI * 2); g.fill() }
  }
  function shadow (g, e) { g.fillStyle = 'rgba(13,9,7,.32)'; g.beginPath(); g.ellipse(e.x, e.y + (e.r || 18) * .55, (e.r || 18) * .85, (e.r || 18) * .3, 0, 0, Math.PI * 2); g.fill() }
  function telegraph (g, e) {
    var q = (e.ai && (e.ai.telegraph || e.ai.charge)) || e.attackT || 0
    if (!(q > 0)) return
    var r = (e.r || 24) + 18 + Math.min(1, q) * 22
    g.strokeStyle = 'rgba(245,198,78,.9)'; g.lineWidth = 5; g.setLineDash([12, 8]); g.beginPath(); g.arc(e.x, e.y, r, 0, Math.PI * 2); g.stroke(); g.setLineDash([])
  }
  function pickupName (p) { if (p.kind === 'item') return 'item-pedestal'; if (p.kind === 'card') return 'card-back'; return p.variant ? p.kind + '-' + p.variant : p.kind }
  function projectiles (g, room) {
    var groups = [['tears', 'tear'], ['shots', 'enemy-shot'], ['bombs', 'bomb'], ['knives', 'knife']]
    for (var a = 0; a < groups.length; a++) for (var i = 0, list = room[groups[a][0]] || []; i < list.length; i++) spr(g, list[i].sprite || groups[a][1], list[i], Math.max(14, (list[i].r || 8) * 2.5))
    for (i = 0; i < (room.lasers || []).length; i++) { var l = room.lasers[i]; g.strokeStyle = l.friendly ? '#e65b43' : '#f2c84c'; g.lineWidth = l.width || 12; g.beginPath(); g.moveTo(l.x, l.y); g.lineTo(l.x + Math.cos(l.angle || 0) * (l.len || 900), l.y + Math.sin(l.angle || 0) * (l.len || 900)); g.stroke() }
  }

  IS.render = function (g, dt) {
    var run = IS.state && IS.state.run, room = run && run.room
    if (!g || !room) return
    var canvas = g.canvas, cssW = canvas && (canvas.clientWidth || canvas.width) || VW, cssH = canvas && (canvas.clientHeight || canvas.height) || VH
    var dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1
    var scale = Math.min(cssW / VW, cssH / VH) * dpr, ox = ((canvas ? canvas.width : VW) - VW * scale) / 2, oy = ((canvas ? canvas.height : VH) - VH * scale) / 2
    IS.camera.scale = scale; IS.camera.offsetX = ox; IS.camera.offsetY = oy
    IS.updateCamera(room, run.player, dt)
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#120e0c'; g.fillRect(0, 0, canvas ? canvas.width : VW, canvas ? canvas.height : VH)
    g.setTransform(scale, 0, 0, scale, ox, oy)
    g.save(); g.translate(VW / 2 + IS.camera.shakeX, VH / 2 + IS.camera.shakeY); g.scale(IS.camera.zoom, IS.camera.zoom); g.translate(-IS.camera.x, -IS.camera.y)
    IS.drawBackdrop(g, room, run.floor)
    if (IS.fx && IS.fx.draw) IS.fx.draw(g, 'under')
    for (var i = 0; i < room.grid.length; i++) if (room.grid[i] && room.grid[i].kind === 'pit' && !room.grid[i].broken) spr(g, 'pit', room.grid[i], IS.TILE || 80)
    for (i = 0; i < room.pickups.length; i++) { var p = room.pickups[i]; if (!p.taken && !p.removed) { shadow(g, p); spr(g, pickupName(p), p, p.kind === 'item' ? 72 : 44); if (p.kind === 'item' && p.id) spr(g, 'item:' + p.id, { x: p.x, y: p.y - 32, z: p.z || 0, variant: p.variant }, 42) } }
    var actors = (room.enemies || []).slice(); if (run.player) actors.push(run.player); Array.prototype.push.apply(actors, run.player && run.player.familiars || [])
    actors.sort(function (a, b) { return a.y - b.y })
    for (i = 0; i < actors.length; i++) shadow(g, actors[i])
    for (i = 0; i < room.enemies.length; i++) telegraph(g, room.enemies[i])
    for (i = 0; i < actors.length; i++) { var e = actors[i]; spr(g, e === run.player ? run.player.charId : (e.sprite || e.id), e, (e.r || 24) * (e.boss ? 3 : 2.25)) }
    IS.drawGridObjects(g, room, run.floor)
    projectiles(g, room)
    if (IS.fx && IS.fx.draw) IS.fx.draw(g, 'over')
    IS.drawDoors(g, room)
    g.restore()
    /* Warm darkness: one mask, with a clear player-safe light aperture. */
    var dark = ((run.curses || 0) & (IS.CURSE && IS.CURSE.DARKNESS || 1)) !== 0
    var ps = IS.worldToScreen(run.player.x, run.player.y), radius = dark ? 180 : 410
    var light = g.createRadialGradient(ps.x, ps.y, radius * .18, ps.x, ps.y, radius)
    light.addColorStop(0, 'rgba(15,10,8,0)'); light.addColorStop(1, dark ? 'rgba(10,7,6,.78)' : 'rgba(10,7,6,.2)')
    g.fillStyle = light; g.fillRect(0, 0, VW, VH)
    if (IS.hud && IS.hud.draw) IS.hud.draw(g, run)
    if (IS.state.paused) { g.fillStyle = 'rgba(12,9,8,.55)'; g.fillRect(0, 0, VW, VH) }
    g.setTransform(1, 0, 0, 1, 0, 0)
  }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
