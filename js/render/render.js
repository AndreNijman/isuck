;(function (IS) {
  'use strict'

  var VW = IS.VIEW_W || 1280, VH = IS.VIEW_H || 720
  // Big rooms are not shrunk to fit: below this zoom everything becomes too small
  // to read, so the camera follows the player and clamps to the room instead.
  var MIN_ZOOM = 0.82
  IS.camera = IS.camera || { x: (IS.ROOM_PX_W || 1040) / 2, y: (IS.ROOM_PX_H || 560) / 2, zoom: 1, shakeX: 0, shakeY: 0, scale: 1, offsetX: 0, offsetY: 0 }

  IS.cameraTarget = function (room, p, zoom) {
    var wall = IS.WALL || 80, halfW = VW / 2 / zoom, halfH = VH / 2 / zoom
    var tx = room.pxW / 2, ty = room.pxH / 2
    if (room.pxW + wall * 2 > halfW * 2 && p) tx = IS.clamp(p.x, halfW - wall, room.pxW + wall - halfW)
    if (room.pxH + wall * 2 > halfH * 2 && p) ty = IS.clamp(p.y, halfH - wall, room.pxH + wall - halfH)
    return { x: tx, y: ty }
  }

  IS.updateCamera = function (room, p, dt) {
    if (!room) return IS.camera
    var c = IS.camera, wall = IS.WALL || 80
    var fit = Math.min(1, VW / (room.pxW + wall * 2), VH / (room.pxH + wall * 2))
    c.zoom = Math.max(MIN_ZOOM, fit)
    var t = IS.cameraTarget(room, p, c.zoom)
    if (c.roomIndex !== room.index) { c.roomIndex = room.index; c.x = t.x; c.y = t.y; return c }
    var k = 1 - Math.exp(-Math.max(0, dt || 0) * 8)
    c.x += (t.x - c.x) * k; c.y += (t.y - c.y) * k
    return c
  }

  IS.worldToScreen = function (x, y) { var c = IS.camera; return { x: (x - c.x + c.shakeX) * c.zoom + VW / 2, y: (y - c.y + c.shakeY) * c.zoom + VH / 2 } }
  IS.screenToWorld = function (x, y) { var c = IS.camera; return { x: (x - VW / 2) / c.zoom + c.x - c.shakeX, y: (y - VH / 2) / c.zoom + c.y - c.shakeY } }

  function spr (g, name, e, size, extra) {
    if (!e) return
    var t = Object.assign({ frame: e.frame || 0, time: (IS.state && IS.state.time) || 0, dir: e.dir, hurt: e.hurtT > 0, tint: e.tint, hp01: e.maxHp ? e.hp / e.maxHp : 1, charge: (e.ai && e.ai.telegraph) || 0, variant: e.variant }, extra || {})
    if (typeof IS.drawSprite === 'function') { if (!(extra && extra.ink && inked(g, name, e.x, e.y - (e.z || 0), size, t))) IS.drawSprite(g, name, e.x, e.y - (e.z || 0), size, t) }
    else { g.fillStyle = e.tint || '#d8c3a7'; g.beginPath(); g.arc(e.x, e.y, size * .4, 0, Math.PI * 2); g.fill() }
  }

  // Ink outline: enemies and bosses are painted once into a scratch canvas, a flat dark silhouette of
  // that is stamped around the sprite in eight directions, then the sprite goes on top. That gives every
  // creature the same heavy outline whatever its painter did, for the price of ten small blits.
  var inkA = null, inkB = null
  function inked (g, name, x, y, size, t) {
    if (typeof document === 'undefined' || !document.createElement || size < 26 || IS.noInk) return false
    var cam = IS.camera, k = Math.min(2, Math.max(1, (cam.scale || 1) * (cam.zoom || 1))), pad = Math.ceil(size * 1.8), px = Math.ceil(pad * k)
    if (!inkA) { inkA = document.createElement('canvas'); inkB = document.createElement('canvas') }
    if (inkA.width < px) { inkA.width = inkA.height = inkB.width = inkB.height = px }
    var a = inkA.getContext('2d'), b = inkB.getContext('2d')
    if (!a || !b) return false
    a.setTransform(1, 0, 0, 1, 0, 0); a.clearRect(0, 0, inkA.width, inkA.height)
    a.setTransform(k, 0, 0, k, 0, 0); IS.drawSprite(a, name, pad / 2, pad / 2, size, t); a.setTransform(1, 0, 0, 1, 0, 0)
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, inkB.width, inkB.height)
    b.drawImage(inkA, 0, 0, px, px, 0, 0, px, px); b.globalCompositeOperation = 'source-in'; b.fillStyle = '#150b0a'; b.fillRect(0, 0, px, px); b.globalCompositeOperation = 'source-over'
    var o = Math.max(1.6, Math.min(4, size * .026)), dx = x - pad / 2, dy = y - pad / 2
    for (var i = 0; i < 8; i++) { var an = i * Math.PI / 4; g.drawImage(inkB, 0, 0, px, px, dx + Math.cos(an) * o, dy + Math.sin(an) * o, pad, pad) }
    g.drawImage(inkA, 0, 0, px, px, dx, dy, pad, pad)
    return true
  }
  // soft drop shadow: a flattened radial falloff, not a hard ellipse. Actors that hover get a smaller, fainter one.
  function shadow (g, e, k) {
    var r = (e.r || 18) * (k || 1), lift = Math.max(.35, 1 - (e.z || 0) / 220), sy = e.y + r * .55, rx = r * 1.05 * lift
    if (e.charId) { sy = e.y + 20; rx = 27 }
    var a = .42 * lift
    g.save(); g.translate(e.x, sy); g.scale(1, .34)
    var gr = g.createRadialGradient(0, 0, rx * .15, 0, 0, rx); gr.addColorStop(0, 'rgba(10,6,5,' + a.toFixed(3) + ')'); gr.addColorStop(.6, 'rgba(10,6,5,' + (a * .6).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(10,6,5,0)')
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill(); g.restore()
  }

  // Enemy statuses read at a glance: a colour wash over the body plus a small mark above it.
  // The wash is an ellipse over the sprite, so it tints without needing an offscreen buffer.
  var STATUS_WASH = { freeze: '120,200,255', ice: '170,230,255', petrify: '130,130,130', midas: '240,190,50', poison: '90,190,60', burn: '255,120,30', bleed: '170,20,30', slow: '90,120,200', sticky: '110,170,60', charm: '240,110,170', baited: '230,150,90', fear: '150,90,190', confusion: '200,200,90', magnetize: '210,60,60', shrink: '230,230,230' }
  IS.STATUS_WASH = STATUS_WASH
  function statusOverlay (g, e, size, t) {
    var st = e.status; if (!st) return
    var keys = Object.keys(st); if (!keys.length) return
    var x = e.x, y = e.y - (e.z || 0), r = size * .36, i, k
    var wash = ['petrify', 'ice', 'freeze', 'midas', 'burn', 'poison', 'bleed', 'slow', 'sticky', 'charm', 'fear', 'confusion', 'magnetize', 'baited', 'shrink']
    for (i = 0; i < wash.length; i++) { k = wash[i]; if (!st[k]) continue
      var a = (k === 'petrify' || k === 'midas' || k === 'ice' || k === 'freeze') ? .45 : .24
      g.fillStyle = 'rgba(' + STATUS_WASH[k] + ',' + a + ')'; g.beginPath(); g.ellipse(x, y, r, r * 1.05, 0, 0, Math.PI * 2); g.fill()
      if (a > .4) break
    }
    var my = y - size * .5, n = 0
    function mark (fn) { g.save(); g.translate(x + (n - (keys.length - 1) / 2) * 12, my); fn(); g.restore(); n++ }
    for (i = 0; i < keys.length; i++) { k = keys[i]
      if (k === 'burn') mark(function () { var f = Math.sin(t * 18 + i) * 2; g.fillStyle = '#ff8a1e'; g.beginPath(); g.moveTo(-4, 5); g.quadraticCurveTo(-5 + f, -3, 0, -9); g.quadraticCurveTo(5 + f, -3, 4, 5); g.fill(); g.fillStyle = '#ffd25a'; g.fillRect(-1.5, 0, 3, 5) })
      else if (k === 'poison') mark(function () { g.fillStyle = '#7ed04a'; for (var j = 0; j < 3; j++) { g.beginPath(); g.arc(-4 + j * 4, 2 - ((t * 9 + j * 3) % 8), 2.2, 0, 7); g.fill() } })
      else if (k === 'bleed') mark(function () { g.fillStyle = '#b3141c'; g.beginPath(); g.moveTo(0, -5); g.quadraticCurveTo(5, 2, 0, 5); g.quadraticCurveTo(-5, 2, 0, -5); g.fill() })
      else if (k === 'freeze' || k === 'ice') mark(function () { g.strokeStyle = '#e8f8ff'; g.lineWidth = 2; g.beginPath(); g.moveTo(-6, 0); g.lineTo(6, 0); g.moveTo(0, -6); g.lineTo(0, 6); g.moveTo(-4, -4); g.lineTo(4, 4); g.moveTo(4, -4); g.lineTo(-4, 4); g.stroke() })
      else if (k === 'petrify') mark(function () { g.fillStyle = '#8e8e8e'; g.fillRect(-5, -5, 10, 10); g.fillStyle = '#5c5c5c'; g.fillRect(-1, -5, 2, 10) })
      else if (k === 'midas') mark(function () { g.fillStyle = '#f2c230'; g.beginPath(); g.arc(0, 0, 5, 0, 7); g.fill(); g.strokeStyle = '#8a6a10'; g.lineWidth = 1.5; g.stroke() })
      else if (k === 'charm') mark(function () { g.fillStyle = '#ee6fa6'; g.beginPath(); g.arc(-2.5, -1, 3, 0, 7); g.arc(2.5, -1, 3, 0, 7); g.fill(); g.beginPath(); g.moveTo(-5.5, 0); g.lineTo(0, 6); g.lineTo(5.5, 0); g.fill() })
      else if (k === 'fear') mark(function () { g.fillStyle = '#b48ae0'; g.font = 'bold 14px monospace'; g.textAlign = 'center'; g.fillText('!', 0, 5) })
      else if (k === 'confusion') mark(function () { g.strokeStyle = '#e8e07a'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 5, t * 8, t * 8 + 4.6); g.stroke() })
      else if (k === 'slow') mark(function () { g.fillStyle = '#7da0e8'; g.beginPath(); g.moveTo(0, 5); g.lineTo(-5, -4); g.lineTo(5, -4); g.fill() })
      else if (k === 'sticky') mark(function () { g.fillStyle = '#86c24a'; g.beginPath(); g.arc(-2, 1, 4, 0, 7); g.arc(3, 3, 3, 0, 7); g.fill() })
      else if (k === 'magnetize') mark(function () { g.strokeStyle = '#d83a3a'; g.lineWidth = 3; g.beginPath(); g.arc(0, 1, 5, Math.PI, 0); g.stroke(); g.fillStyle = '#e8e8e8'; g.fillRect(-7, 0, 4, 4); g.fillRect(3, 0, 4, 4) })
      else if (k === 'baited') mark(function () { g.strokeStyle = '#e29a5a'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 5, 0, 7); g.moveTo(-8, 0); g.lineTo(8, 0); g.stroke() })
      else if (k === 'shrink') mark(function () { g.fillStyle = '#eee'; g.beginPath(); g.moveTo(-5, -4); g.lineTo(0, 0); g.lineTo(-5, 4); g.moveTo(5, -4); g.lineTo(0, 0); g.lineTo(5, 4); g.fill() })
    }
  }

  // The player is one tile tall, standing with their feet near the collision circle. Head and body face
  // separately: the head toward the shot (p.headDir, else the last shot direction while firing, else the way
  // they walk), the body toward the walk (p.walkDir, else velocity). Missing fields fall back to the old ones.
  var PLAYER_LIFT = 12
  function unit (v) { if (!v) return null; var l = Math.hypot(v.x || 0, v.y || 0); return l > .01 ? { x: v.x / l, y: v.y / l } : null }
  function playerPose (p) {
    var speed = Math.hypot(p.vx || 0, p.vy || 0), moving = speed > 20 || (p.walkT || 0) > 0
    var walk = unit(p.walkDir) || (speed > 20 ? { x: p.vx / speed, y: p.vy / speed } : null)
    var shooting = (p.nextShot || 0) > 0
    var head = unit(p.headDir) || (shooting && unit(p.head)) || walk || { x: 0, y: 1 }
    return { headDir: head, walkDir: walk || head, moving: moving, shooting: shooting || !!unit(p.headDir) }
  }
  function playerSprite (g, p, run, size, hurt) {
    var pose = playerPose(p), id = p.charId, name = IS.sprite && IS.sprite('player:' + id) ? 'player:' + id : id
    var t = { frame: 0, time: (IS.state && IS.state.time) || 0, hurt: hurt, tint: p.tint, hp01: 1, headDir: pose.headDir, walkDir: pose.walkDir, walkT: p.walkT || 0, moving: pose.moving, shooting: pose.shooting, holdItem: p.holdItem || null, charge: p.charge || 0 }
    IS.drawSprite(g, name, p.x, p.y - PLAYER_LIFT, size, t)
    var h = p.holdItem
    if (h && h.id && IS.sprite('item:' + h.id)) {
      // the item is lifted overhead: pops in, bobs, with a soft glow behind
      var k = Math.min(1, (h.t || 0) * 7), pop = 1 - Math.pow(1 - k, 3), bob = Math.sin(((h.t || 0)) * 6) * 2, cy = p.y - PLAYER_LIFT - size * .52 - 24 * pop + bob
      g.save(); g.globalAlpha = .55 * pop; var gl = g.createRadialGradient(p.x, cy, 2, p.x, cy, 40); gl.addColorStop(0, 'rgba(255,240,190,.9)'); gl.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = gl; g.fillRect(p.x - 40, cy - 40, 80, 80); g.restore()
      g.save(); g.translate(p.x, cy); g.scale(pop, pop); IS.drawSprite(g, 'item:' + h.id, 0, 0, 50, { time: (IS.state && IS.state.time) || 0 }); g.restore()
    }
  }

  // An actor: shadow already drawn. Windups swell and flash; spawning fades in;
  // the player blinks through invulnerability.
  function actor (g, e, run) {
    if (e.hidden) return
    var isPlayer = e === run.player
    var size = isPlayer ? (IS.TILE || 80) : (e.r || 24) * (e.boss ? 3 : 2.6)
    var tele = (e.ai && e.ai.telegraph) || 0
    var alpha = 1
    if (e.spawnT > 0) alpha = Math.max(0, 1 - e.spawnT / .7)
    var now = run.time || 0
    if (isPlayer && now < e.invulnUntil && Math.floor(now * 14) % 2 === 0) alpha = .3
    var sx = 1, sy = 1
    if (tele > 0) { sx = 1 + tele * .14; sy = 1 + tele * .1 - Math.sin(tele * 22) * .03 }
    if (isPlayer && e.recoil > 0) { sx *= 1 + e.recoil * 1.2; sy *= 1 - e.recoil * 1.2 }
    if (e.kbx || e.kby) { sx *= 1.06; sy *= .94 }
    g.save()
    g.globalAlpha = alpha
    g.translate(e.x, e.y); g.scale(sx, sy); g.translate(-e.x, -e.y)
    var flash = tele > .55 && Math.floor(tele * 18) % 2 === 0
    var hurtPlayer = isPlayer && now - (e.hurtAt || -9) < .12
    if (isPlayer) playerSprite(g, e, run, size, e.hurtT > 0 || hurtPlayer)
    else spr(g, e.sprite || e.id, e, size, { hurt: e.hurtT > 0 || flash, flip: e.dir < 0, ink: !e.familiar })
    if (!isPlayer) statusOverlay(g, e, size, (IS.state && IS.state.time) || 0)
    if (e.shielded) { g.strokeStyle = 'rgba(232,226,200,.75)'; g.lineWidth = 4; g.beginPath(); g.arc(e.x, e.y - (e.z || 0), size * .55, 0, Math.PI * 2); g.stroke() }
    g.restore()
  }

  // what the player is holding: Mom's Knife, a charge bar, an Epic Fetus target
  function weaponOverlay (g, p) {
    var t = (IS.state && IS.state.time) || 0
    if (p.weapon === 'knife' && p.knife) {
      g.save(); g.translate(p.knife.x, p.knife.y - 10); g.rotate(p.knife.angle)
      IS.drawSprite(g, 'knife', 0, 0, 46, { time: t }); g.restore()
    }
    if (p.charge > 0) {
      var w = 40, x = p.x - w / 2, y = p.y - p.r * 2.4
      g.fillStyle = 'rgba(15,10,8,.7)'; g.fillRect(x - 2, y - 2, w + 4, 9)
      g.fillStyle = p.charge >= 1 ? (Math.floor(t * 16) % 2 ? '#f3e2b0' : '#d8322a') : '#d8322a'; g.fillRect(x, y, w * p.charge, 5)
    }
    if (p.target) {
      g.strokeStyle = 'rgba(220,40,30,.9)'; g.lineWidth = 3
      g.beginPath(); g.arc(p.target.x, p.target.y, 26, 0, Math.PI * 2); g.stroke()
      g.beginPath(); g.moveTo(p.target.x - 38, p.target.y); g.lineTo(p.target.x + 38, p.target.y); g.moveTo(p.target.x, p.target.y - 38); g.lineTo(p.target.x, p.target.y + 38); g.stroke()
    }
  }

  function markers (g, room) {
    var list = room.markers || [], t = (IS.state && IS.state.time) || 0
    for (var i = 0; i < list.length; i++) {
      var m = list[i], k = Math.min(1, m.t / m.dur)
      if (m.hole) {
        // a hole in the floor: dark pit with a lip (a boss digging in or out)
        var hr = m.r * (m.hole === 'dive' ? Math.max(.25, 1 - Math.max(0, k - .7) * 3) : .85)
        g.fillStyle = 'rgba(6,3,2,.9)'; g.beginPath(); g.ellipse(m.x, m.y + m.r * .25, hr, hr * .55, 0, 0, Math.PI * 2); g.fill()
        g.strokeStyle = 'rgba(92,66,48,.9)'; g.lineWidth = 4; g.stroke()
        if (m.hole === 'dive') continue
      }
      g.fillStyle = 'rgba(160,20,20,' + (.12 + k * .22).toFixed(3) + ')'
      g.beginPath(); g.arc(m.x, m.y, m.r, 0, Math.PI * 2); g.fill()
      g.strokeStyle = 'rgba(230,70,60,' + (.5 + Math.sin(t * 20) * .2).toFixed(3) + ')'; g.lineWidth = 3
      g.beginPath(); g.arc(m.x, m.y, m.r * (1 - k) + 4, 0, Math.PI * 2); g.stroke()
      g.beginPath(); g.arc(m.x, m.y, m.r, 0, Math.PI * 2); g.stroke()
    }
  }

  // Gemini, Steven, Blighted Ovum: the umbilical cord between the twins while it holds
  function tethers (g, room) {
    var list = room.enemies || []
    for (var i = 0; i < list.length; i++) {
      var a = list[i], m = a && a.mate
      if (!a || a.role !== 'contusion' || !m || a.dead || m.dead || a.hidden || (a.ai && a.ai.cut)) continue
      var dx = m.x - a.x, dy = m.y - a.y, d = Math.sqrt(dx * dx + dy * dy), sag = Math.max(0, 340 - d) * .35 + 14
      var mx = (a.x + m.x) / 2, my = (a.y + m.y) / 2 + sag
      g.lineCap = 'round'
      g.strokeStyle = 'rgba(60,20,22,.9)'; g.lineWidth = 9
      g.beginPath(); g.moveTo(a.x, a.y); g.quadraticCurveTo(mx, my, m.x, m.y); g.stroke()
      g.strokeStyle = '#b5555c'; g.lineWidth = 5
      g.beginPath(); g.moveTo(a.x, a.y); g.quadraticCurveTo(mx, my, m.x, m.y); g.stroke()
    }
  }

  function pickupName (p) { if (IS.pickupSprite) return IS.pickupSprite(p); if (p.kind === 'item') return 'item-pedestal'; if (p.kind === 'card') return 'card-back'; return p.variant ? p.kind + '-' + p.variant : p.kind }
  function projectiles (g, room) {
    var groups = [['tears', 'tear'], ['shots', 'enemy-shot'], ['bombs', 'bomb'], ['knives', 'knife']]
    var a, i, list, p
    for (a = 0; a < groups.length; a++) for (i = 0, list = room[groups[a][0]] || []; i < list.length; i++) { p = list[i]; if (p.z) shadow(g, p, .7) }
    for (a = 0; a < groups.length; a++) for (i = 0, list = room[groups[a][0]] || []; i < list.length; i++) {
      p = list[i]
      // a bomb's r is its blast radius, not its body
      var size = groups[a][0] === 'bombs' ? 40 * (p.scale || 1) : Math.max(16, (p.r || 8) * 2.6)
      if (p.fuse0 && p.fuse < .5 && Math.floor(p.fuse * 20) % 2 === 0) size *= 1.15
      spr(g, p.sprite || groups[a][1], p, size)
    }
    for (i = 0; i < (room.arcs || []).length; i++) { var ar = room.arcs[i]; g.strokeStyle = 'rgba(150,215,255,' + (1 - ar.t / .25).toFixed(2) + ')'; g.lineWidth = 3; for (a = 0; a < ar.to.length; a++) { g.beginPath(); g.moveTo(ar.x, ar.y); g.lineTo((ar.x + ar.to[a].x) / 2 + Math.sin(i * 7 + a) * 12, (ar.y + ar.to[a].y) / 2 - 8); g.lineTo(ar.to[a].x, ar.to[a].y); g.stroke() } }
    for (i = 0; i < (room.beams || []).length; i++) { var bm = room.beams[i], f = 1 - bm.t / .25; g.fillStyle = 'rgba(255,244,190,' + (.55 * f).toFixed(2) + ')'; g.fillRect(bm.x - 26 * f - 6, bm.y - 600, 52 * f + 12, 600); g.fillStyle = 'rgba(255,255,235,' + f.toFixed(2) + ')'; g.fillRect(bm.x - 8 * f, bm.y - 600, 16 * f, 600) }
    for (i = 0; i < (room.lasers || []).length; i++) {
      var l = room.lasers[i], ex = l.x + Math.cos(l.angle || 0) * (l.len || 900), ey = l.y + Math.sin(l.angle || 0) * (l.len || 900)
      g.lineCap = 'round'
      if (l.warn) {
        g.strokeStyle = 'rgba(240,80,60,.45)'; g.lineWidth = 3; g.setLineDash([16, 10])
        g.beginPath(); g.moveTo(l.x, l.y); g.lineTo(ex, ey); g.stroke(); g.setLineDash([])
        continue
      }
      var w = (l.width || 12) * (1 + Math.sin(((IS.state && IS.state.time) || 0) * 40) * .08)
      g.strokeStyle = l.friendly ? 'rgba(200,40,30,.55)' : 'rgba(150,20,20,.55)'; g.lineWidth = w * 1.7
      g.beginPath(); g.moveTo(l.x, l.y); g.lineTo(ex, ey); g.stroke()
      g.strokeStyle = l.friendly ? '#e65b43' : '#d8322a'; g.lineWidth = w
      g.beginPath(); g.moveTo(l.x, l.y); g.lineTo(ex, ey); g.stroke()
      g.strokeStyle = '#ffe2c8'; g.lineWidth = w * .3
      g.beginPath(); g.moveTo(l.x, l.y); g.lineTo(ex, ey); g.stroke()
    }
  }

  // holes in the floor: the trapdoor to the next floor, a crawlspace hatch and the ladder out of one
  function portals (g, room) {
    var t = (IS.state && IS.state.time) || 0, list = [room.trapdoor, room.crawlspace, room.ladder], i, o
    for (i = 0; i < list.length; i++) {
      o = list[i]; if (!o) continue
      var ladder = o === room.ladder, hatch = o === room.crawlspace
      g.fillStyle = ladder ? '#2a1d14' : 'rgba(6,3,2,.95)'; g.beginPath(); g.ellipse(o.x, o.y, 38, 26, 0, 0, Math.PI * 2); g.fill()
      g.strokeStyle = hatch ? '#6a5a48' : '#5c4230'; g.lineWidth = 5; g.stroke()
      if (ladder) { g.strokeStyle = '#a88a5c'; g.lineWidth = 4; g.beginPath(); g.moveTo(o.x - 12, o.y - 20); g.lineTo(o.x - 12, o.y + 20); g.moveTo(o.x + 12, o.y - 20); g.lineTo(o.x + 12, o.y + 20); for (var r = -12; r <= 12; r += 12) { g.moveTo(o.x - 12, o.y + r); g.lineTo(o.x + 12, o.y + r) } g.stroke() }
      else { g.strokeStyle = 'rgba(200,170,120,' + (.25 + Math.sin(t * 3) * .1).toFixed(2) + ')'; g.lineWidth = 2; g.beginPath(); g.ellipse(o.x, o.y, 26, 17, 0, 0, Math.PI * 2); g.stroke() }
    }
  }

  function bossBar (g, room) {
    var b = (room.enemies || []).filter(function (e) { return e.boss && !e.dead })
    if (!b.length) return
    var hp = 0, max = 0
    for (var i = 0; i < b.length; i++) { hp += Math.max(0, b[i].hp); max += b[i].maxHp }
    var w = 520, h = 16, x = (VW - w) / 2, y = VH - 46
    g.fillStyle = 'rgba(12,8,7,.75)'; g.fillRect(x - 4, y - 4, w + 8, h + 8)
    g.fillStyle = '#3a1513'; g.fillRect(x, y, w, h)
    g.fillStyle = '#b8261f'; g.fillRect(x, y, w * Math.max(0, hp / max), h)
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x, y, w * Math.max(0, hp / max), h * .4)
    g.font = 'bold 15px ui-monospace, Menlo, Consolas, monospace'; g.textAlign = 'center'; g.fillStyle = '#ead9c0'
    g.fillText((b[0].def && b[0].def.name) || 'Boss', VW / 2, y - 10)
    g.textAlign = 'left'
  }

  // one room: floor, props, actors, projectiles, effects, doors. The player is only drawn in the layer they stand in.
  function drawWorld (g, room, run, hasPlayer) {
    var pl = hasPlayer ? run.player : null
    IS.drawBackdrop(g, room, run.floor)
    if (IS.fx && IS.fx.draw) IS.fx.draw(g, 'under')
    markers(g, room)
    portals(g, room)
    for (var i = 0; i < room.grid.length; i++) if (room.grid[i] && room.grid[i].kind === 'pit' && !room.grid[i].broken) spr(g, 'pit', room.grid[i], IS.TILE || 80)
    for (i = 0; i < room.pickups.length; i++) { var p = room.pickups[i]; if (!p.taken && !p.removed) { shadow(g, p); spr(g, pickupName(p), p, p.kind === 'item' ? 72 : p.kind === 'chest' ? 56 : 44); if (IS.drawPickupExtras) IS.drawPickupExtras(g, p, run); if (p.kind === 'item' && p.id && (run.curses || 0) & (IS.CURSE && IS.CURSE.BLIND || 32)) { g.font = 'bold 34px monospace'; g.textAlign = 'center'; g.fillStyle = '#e8dcc0'; g.fillText('?', p.x, p.y - 22); g.textAlign = 'left' } else if (p.kind === 'item' && p.id) spr(g, 'item:' + p.id, { x: p.x, y: p.y - 32 + Math.sin(((IS.state && IS.state.time) || 0) * 3) * 4, z: p.z || 0, variant: p.variant }, 42) } }
    if (IS.drawMachines) IS.drawMachines(g, room)
    var actors = (room.enemies || []).slice(); if (pl) actors.push(pl); Array.prototype.push.apply(actors, pl && pl.familiars || [])
    actors.sort(function (a, b) { return a.y - b.y })
    for (i = 0; i < actors.length; i++) if (!actors[i].hidden) shadow(g, actors[i])
    IS.drawGridObjects(g, room, run.floor)
    tethers(g, room)
    for (i = 0; i < actors.length; i++) actor(g, actors[i], run)
    projectiles(g, room)
    if (pl) weaponOverlay(g, pl)
    var mk = pl && pl.cache && pl.cache.marked
    if (mk && pl.cache.markedRoom === room) { var mt = ((IS.state && IS.state.time) || 0) * 2; g.save(); g.translate(mk.x, mk.y); g.rotate(mt); g.strokeStyle = 'rgba(214,60,52,.85)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 18, 0, Math.PI * 2); g.moveTo(-26, 0); g.lineTo(-10, 0); g.moveTo(26, 0); g.lineTo(10, 0); g.moveTo(0, -26); g.lineTo(0, -10); g.moveTo(0, 26); g.lineTo(0, 10); g.stroke(); g.restore() }
    if (IS.fx && IS.fx.draw) IS.fx.draw(g, 'over')
    IS.drawDoors(g, room)
  }

  // the rooms being slid out of / into while IS.state.transition runs (set by the engine): both are drawn, offset, at once
  function transitionRooms (run) {
    var tr = IS.state && IS.state.transition
    if (!tr || !run.floor || !run.floor.rooms) return null
    var a = run.floor.rooms[tr.from], b = run.floor.rooms[tr.to]
    if (!a || !b || !a.grid || !b.grid || a === b) return null
    return { tr: tr, from: a, to: b }
  }
  var DIRV = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }
  function layerCamera (room, p) {
    var wall = IS.WALL || 80, fit = Math.min(1, VW / (room.pxW + wall * 2), VH / (room.pxH + wall * 2)), z = Math.max(MIN_ZOOM, fit)
    var t = IS.cameraTarget(room, p, z)
    return { x: t.x, y: t.y, zoom: z }
  }

  IS.render = function (g, dt) {
    var run = IS.state && IS.state.run, room = run && run.room
    if (!g || !room) return
    var canvas = g.canvas
    var scale = Math.min((canvas ? canvas.width : VW) / VW, (canvas ? canvas.height : VH) / VH)
    var ox = ((canvas ? canvas.width : VW) - VW * scale) / 2, oy = ((canvas ? canvas.height : VH) - VH * scale) / 2
    IS.camera.scale = scale; IS.camera.offsetX = ox; IS.camera.offsetY = oy
    IS.updateCamera(room, run.player, dt)
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#120e0c'; g.fillRect(0, 0, canvas ? canvas.width : VW, canvas ? canvas.height : VH)
    g.setTransform(scale, 0, 0, scale, ox, oy)
    var tx = transitionRooms(run)
    var layers = tx ? [{ room: tx.from, k: -tx.tr.t }, { room: tx.to, k: 1 - tx.tr.t }] : [{ room: room, k: 0 }]
    var dv = tx ? (DIRV[tx.tr.dir] || [0, 0]) : [0, 0], saved = { x: IS.camera.x, y: IS.camera.y, zoom: IS.camera.zoom }
    for (var li = 0; li < layers.length; li++) {
      var L = layers[li], hasPlayer = tx ? (L.room === room || (room !== tx.from && room !== tx.to && L.room === tx.to)) : true
      var cam = (!tx || L.room === room) ? saved : layerCamera(L.room, run.player)
      IS.camera.x = cam.x; IS.camera.y = cam.y; IS.camera.zoom = cam.zoom
      g.save()
      g.translate(VW / 2 + IS.camera.shakeX * cam.zoom + dv[0] * L.k * VW, VH / 2 + IS.camera.shakeY * cam.zoom + dv[1] * L.k * VH)
      g.scale(cam.zoom, cam.zoom); g.translate(-cam.x, -cam.y)
      drawWorld(g, L.room, run, hasPlayer)
      g.restore()
    }
    IS.camera.x = saved.x; IS.camera.y = saved.y; IS.camera.zoom = saved.zoom
    /* Warm darkness: one mask, with a clear player-safe light aperture. */
    var dark = ((run.curses || 0) & (IS.CURSE && IS.CURSE.DARKNESS || 1)) !== 0
    var ps = IS.worldToScreen(run.player.x, run.player.y), radius = dark ? 180 : 520
    var light = g.createRadialGradient(ps.x, ps.y, radius * .18, ps.x, ps.y, radius)
    light.addColorStop(0, 'rgba(15,10,8,0)'); light.addColorStop(1, dark ? 'rgba(10,7,6,.78)' : 'rgba(10,7,6,.16)')
    g.fillStyle = light; g.fillRect(0, 0, VW, VH)
    if (!tx) bossBar(g, room)
    if (IS.hud && IS.hud.draw) IS.hud.draw(g, run)
    if (IS.state.paused) { g.fillStyle = 'rgba(12,9,8,.55)'; g.fillRect(0, 0, VW, VH) }
    g.setTransform(1, 0, 0, 1, 0, 0)
  }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
