;(function (IS) {
  'use strict'
  /*
   * Hand-drawn illustrations for the menus, all procedural and original:
   *   IS.scenes.title(g, l, t)        the cover: a cellar hatch glowing amber, hands on its rim, the lone protagonist
   *   IS.scenes.hatchDoodle(g, x, y, s)  a pen sketch of the same hatch for paper pages
   *   IS.scenes.stage(g, x, y, w, h)  the spotlit floor the select carousel stands on
   * The static parts render once into an offscreen canvas per screen size; only light, dust and eyes move.
   */
  var S = IS.scenes = {}, TAU = Math.PI * 2, cache = {}
  function rnd (i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
  function canvasFor (key, l, paint) {
    var k = key + l.w + 'x' + l.h, c = cache[k]
    if (c === undefined) {
      if (typeof document === 'undefined' || !document.createElement) { cache[k] = null; return null }
      c = document.createElement('canvas'); c.width = l.w; c.height = l.h
      var g = c.getContext('2d'); g.save(); g.scale(l.u, l.u); g.translate((l.w / l.u - 1280) / 2, (l.h / l.u - 720) / 2); paint(g); g.restore()
      cache[k] = c
    }
    return c
  }
  function hand (g, x, y, ang, s, seed) {
    // a long-fingered grey claw gripping the rim: palm, four jointed fingers, a thumb
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round'
    var skin = '#4d4048', dark = '#2a1f26'
    for (var f = -2; f <= 1; f++) {
      var fl = 40 + rnd(seed + f) * 16, bend = (rnd(seed * 3 + f) - .5) * 10
      g.strokeStyle = '#150b0c'; g.lineWidth = 15; g.beginPath(); g.moveTo(f * 11 + 5, 0); g.lineTo(f * 11 + 5 + bend, -fl * .55); g.lineTo(f * 11 + 5 + bend * 2.2, -fl); g.stroke()
      g.strokeStyle = skin; g.lineWidth = 10; g.stroke()
      g.fillStyle = '#d7cbb4'; g.beginPath(); g.arc(f * 11 + 5 + bend * 2.2, -fl - 2, 4, 0, TAU); g.fill()
    }
    g.beginPath(); g.ellipse(0, 12, 28, 20, 0, 0, TAU); g.fillStyle = skin; g.fill(); g.lineWidth = 4; g.strokeStyle = '#150b0c'; g.stroke()
    g.fillStyle = dark; g.beginPath(); g.ellipse(-6, 18, 14, 7, 0, 0, TAU); g.fill()
    g.restore()
  }
  function paintTitle (g) {
    var i, gr
    gr = g.createLinearGradient(0, -400, 0, 1200); gr.addColorStop(0, '#0b0807'); gr.addColorStop(.55, '#241812'); gr.addColorStop(1, '#0d0908'); g.fillStyle = gr; g.fillRect(-600, -400, 2480, 1520)
    // floorboards, converging gently on the hatch
    for (i = 0; i < 16; i++) {
      var bx = -300 + i * 130; g.fillStyle = i % 2 ? '#3a281e' : '#33231a'
      g.beginPath(); g.moveTo(640 + (bx - 640) * .32, 330); g.lineTo(640 + (bx - 640) * 1.8, 760); g.lineTo(640 + (bx + 130 - 640) * 1.8, 760); g.lineTo(640 + (bx + 130 - 640) * .32, 330); g.closePath(); g.fill()
      g.strokeStyle = 'rgba(8,4,3,.8)'; g.lineWidth = 3; g.stroke()
      for (var k = 0; k < 3; k++) { var yy = 380 + rnd(i * 9 + k) * 330, xx = 640 + (bx + 30 + rnd(i + k) * 70 - 640) * (.32 + (yy - 330) / 430 * 1.48); g.fillStyle = 'rgba(10,5,3,.5)'; g.fillRect(xx, yy, 30 + rnd(k + i) * 30, 3) }
    }
    g.fillStyle = 'rgba(8,4,3,.5)'; g.fillRect(-600, 300, 2480, 40)
    // stains
    for (i = 0; i < 12; i++) { g.fillStyle = 'rgba(8,4,3,.22)'; g.beginPath(); g.ellipse(rnd(i) * 1280, 400 + rnd(i + 9) * 300, 40 + rnd(i + 2) * 90, 10 + rnd(i + 4) * 26, 0, 0, TAU); g.fill() }
    // the hatch: stone rim, then the glowing shaft
    var cx = 640, cy = 480
    g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(cx + 6, cy + 22, 290, 128, 0, 0, TAU); g.fill()
    g.fillStyle = '#6a5d52'; g.strokeStyle = '#150b0c'; g.lineWidth = 8; g.beginPath(); g.ellipse(cx, cy, 282, 122, 0, 0, TAU); g.fill(); g.stroke()
    for (i = 0; i < 26; i++) { var a = i / 26 * TAU, x = cx + Math.cos(a) * 252, y = cy + Math.sin(a) * 106; g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = i % 3 ? '#85786b' : '#756a5e'; g.strokeStyle = '#1d120e'; g.lineWidth = 3; g.beginPath(); if (g.roundRect) g.roundRect(-24, -15, 48, 30, 6); else g.rect(-24, -15, 48, 30); g.fill(); g.stroke(); g.restore() }
    g.fillStyle = '#0d0605'; g.strokeStyle = '#150b0c'; g.lineWidth = 6; g.beginPath(); g.ellipse(cx, cy + 4, 208, 84, 0, 0, TAU); g.fill(); g.stroke()
    gr = g.createRadialGradient(cx, cy + 40, 10, cx, cy + 10, 220); gr.addColorStop(0, 'rgba(255,196,92,.95)'); gr.addColorStop(.45, 'rgba(214,106,36,.7)'); gr.addColorStop(1, 'rgba(60,18,8,.0)')
    g.save(); g.beginPath(); g.ellipse(cx, cy + 4, 205, 82, 0, 0, TAU); g.clip(); g.fillStyle = gr; g.fillRect(cx - 220, cy - 90, 440, 200); g.restore()
    // crooked ladder rungs going down
    g.strokeStyle = '#2a1810'; g.lineWidth = 9; g.beginPath(); g.moveTo(cx + 62, cy - 38); g.lineTo(cx + 40, cy + 70); g.moveTo(cx + 122, cy - 28); g.lineTo(cx + 102, cy + 66); g.stroke()
    g.lineWidth = 7; for (i = 0; i < 4; i++) { g.beginPath(); g.moveTo(cx + 62 - i * 6, cy - 30 + i * 24); g.lineTo(cx + 122 - i * 6, cy - 21 + i * 24); g.stroke() }
    // clawed hands on the rim
    var hs = [[420, 430, -.9, 1], [520, 392, -.3, 1.1], [760, 388, .25, 1.15], [868, 428, .85, 1], [600, 590, 3.3, .9], [820, 570, 2.9, 1]]
    for (i = 0; i < hs.length; i++) hand(g, hs[i][0], hs[i][1], hs[i][2], hs[i][3], i * 5 + 1)
    // hanging lantern, upper right
    g.strokeStyle = '#150b0c'; g.lineWidth = 4; g.beginPath(); g.moveTo(1040, -20); g.lineTo(1040, 120); g.stroke()
    g.fillStyle = '#3b2a20'; g.strokeStyle = '#150b0c'; g.lineWidth = 5; g.beginPath(); if (g.roundRect) g.roundRect(1018, 120, 44, 56, 8); else g.rect(1018, 120, 44, 56); g.fill(); g.stroke()
    g.fillStyle = '#ffcf7a'; g.fillRect(1028, 132, 24, 34)
    // cobweb, upper left
    g.strokeStyle = 'rgba(224,214,190,.35)'; g.lineWidth = 1.6; for (i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(i * .3) * 210, Math.sin(i * .3) * 210); g.stroke() } for (i = 1; i < 5; i++) { g.beginPath(); g.arc(0, 0, i * 46, 0, Math.PI / 2); g.stroke() }
  }
  S.title = function (g, l, t, o) {
    o = o || {}; var u = l.u, c = canvasFor('title', l, paintTitle), ox = (l.w / u - 1280) / 2, oy = (l.h / u - 720) / 2
    if (c) g.drawImage(c, 0, 0); else { g.fillStyle = '#171314'; g.fillRect(0, 0, l.w, l.h) }
    g.save(); g.scale(u, u); g.translate(ox, oy)
    var flick = IS.reduceMotion ? .8 : .8 + Math.sin(t * 7) * .06 + Math.sin(t * 13.3) * .04
    // light shaft out of the hatch
    var gr = g.createLinearGradient(0, 100, 0, 520); gr.addColorStop(0, 'rgba(255,190,90,0)'); gr.addColorStop(.7, 'rgba(255,190,90,' + (.3 * flick).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,190,90,0)')
    g.fillStyle = gr; g.beginPath(); g.moveTo(560, 120); g.lineTo(720, 120); g.lineTo(860, 500); g.lineTo(420, 500); g.closePath(); g.fill()
    // lantern glow
    var lg = g.createRadialGradient(1040, 148, 4, 1040, 148, 260); lg.addColorStop(0, 'rgba(255,200,110,' + (.5 * flick).toFixed(3) + ')'); lg.addColorStop(1, 'rgba(255,200,110,0)'); g.fillStyle = lg; g.fillRect(780, -120, 520, 540)
    // eyes in the shaft
    for (var i = 0; i < 9; i++) {
      var ex = 470 + rnd(i * 3) * 340, ey = 470 + rnd(i * 5 + 1) * 40, blink = Math.sin(t * .9 + i * 2.3) > .93 ? .1 : 1
      g.fillStyle = 'rgba(255,230,110,' + (.9 * (IS.reduceMotion ? 1 : (.7 + .3 * Math.sin(t * 2 + i)))).toFixed(2) + ')'; g.beginPath(); g.ellipse(ex - 7, ey, 4, 5 * blink, 0, 0, TAU); g.ellipse(ex + 7, ey, 4, 5 * blink, 0, 0, TAU); g.fill()
    }
    // the protagonist, from behind, at the rim
    if (IS.drawSprite && IS.sprite && IS.sprite('player:' + (o.charId || 'isaac'))) {
      g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(332, 604, 54, 15, 0, 0, TAU); g.fill()
      IS.drawSprite(g, 'player:' + (o.charId || 'isaac'), 332, 552, 190, { time: t, headDir: { x: 0.35, y: -1 }, walkDir: { x: 0.3, y: -1 }, moving: false, walkT: 0 })
    }
    // dust
    for (i = 0; i < 46; i++) { var px = 400 + rnd(i) * 480 + Math.sin(t * .4 + i) * 20, py = 520 - ((t * (10 + rnd(i + 3) * 18) + rnd(i + 8) * 420) % 420); g.fillStyle = 'rgba(255,214,140,' + (.12 + rnd(i + 5) * .25).toFixed(2) + ')'; g.fillRect(px, py, 2.2, 2.2) }
    g.restore()
  }
  /* pen sketch of the hatch for paper pages: ink ellipses and hatching */
  S.hatchDoodle = function (g, x, y, s, t) {
    g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round'
    g.strokeStyle = '#2a1712'; g.lineWidth = 3 / s * 1.2
    g.beginPath(); g.ellipse(0, 0, 150, 66, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(0, 4, 118, 46, 0, 0, TAU); g.fillStyle = '#2a1712'; g.fill()
    var gr = g.createRadialGradient(0, 10, 4, 0, 6, 110); gr.addColorStop(0, 'rgba(230,150,60,.95)'); gr.addColorStop(1, 'rgba(230,150,60,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 4, 116, 45, 0, 0, TAU); g.fill()
    for (var i = 0; i < 18; i++) { var a = i / 18 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 150, Math.sin(a) * 66); g.lineTo(Math.cos(a) * 166, Math.sin(a) * 74); g.stroke() }
    for (i = 0; i < 6; i++) { var q = rnd(i) * 2 + .6; g.fillStyle = 'rgba(255,230,110,' + (.7 + Math.sin((t || 0) * 2 + i) * .3).toFixed(2) + ')'; g.fillRect(-70 + i * 26, -4 + (i % 2) * 10, 5, 4 * q); g.fillRect(-60 + i * 26, -4 + (i % 2) * 10, 5, 4 * q) }
    g.restore()
  }
  /* spotlight on a dark floor behind the carousel */
  S.stage = function (g, l, cx, cy, rx, ry) {
    g.save()
    var gr = g.createRadialGradient(cx, cy, 4, cx, cy, rx); gr.addColorStop(0, 'rgba(255,200,120,.32)'); gr.addColorStop(.6, 'rgba(255,170,90,.1)'); gr.addColorStop(1, 'rgba(255,170,90,0)')
    g.translate(cx, cy); g.scale(1, ry / rx); g.translate(-cx, -cy); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, rx, 0, TAU); g.fill()
    g.restore()
  }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
