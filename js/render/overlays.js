;(function (IS) {
  'use strict'
  /*
   * Screen-space overlays drawn over the live game, all in 1280x720 view units:
   *   IS.hudKit      shared hand-inked drawing helpers (text, paper strips, slots, room icons)
   *   IS.drawStreak  the paper strip across the top for run.streak {title, sub, t, dur}
   *   IS.drawBossIntro  the full-width versus card for run.bossIntro {bossId, name, t, dur}
   *   IS.drawMap     the enlarged floor map shown while Tab is held
   * Every field is read defensively: an absent field draws nothing.
   */
  var TAU = Math.PI * 2, VW = IS.VIEW_W || 1280, VH = IS.VIEW_H || 720
  var INK = '#1b100d', PAPER = '#dccaa4', PAPER2 = '#bfa97c', BLOOD = '#8f2024', BONE = '#eee0bd'
  var FONT = 'Georgia, "Times New Roman", serif'
  var K = IS.hudKit = { INK: INK, PAPER: PAPER, PAPER2: PAPER2, BLOOD: BLOOD, BONE: BONE, FONT: FONT }

  function ease (k) { k = k < 0 ? 0 : k > 1 ? 1 : k; return 1 - Math.pow(1 - k, 3) }
  function rnd (i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

  /* text with a thick dark outline, the house lettering */
  K.text = function (g, s, x, y, size, o) {
    o = o || {}
    g.save(); g.font = (o.weight || 'bold') + ' ' + size + 'px ' + (o.font || FONT); g.textAlign = o.align || 'left'; g.textBaseline = o.baseline || 'middle'
    g.lineJoin = 'round'; s = String(s == null ? '' : s)
    if (o.rot) { g.translate(x, y); g.rotate(o.rot); x = 0; y = 0 }
    if (o.outline !== 0) { g.lineWidth = o.outline || Math.max(3, size * .2); g.strokeStyle = o.ink || INK; g.strokeText(s, x, y) }
    g.fillStyle = o.colour || BONE; if (o.maxWidth) g.fillText(s, x, y, o.maxWidth); else g.fillText(s, x, y)
    g.restore()
  }
  /* a wobbly closed path: the hand-cut edge of a paper scrap */
  K.scrap = function (g, x, y, w, h, seed, wob) {
    wob = wob == null ? 2.2 : wob
    var n = Math.max(6, Math.round((w + h) / 30)), i, px, py
    g.beginPath()
    for (i = 0; i <= n * 2; i++) {
      var k = i / (n * 2), side = k * 4, e = Math.floor(side), f = side - e, hx, hy
      if (e === 0) { hx = x + w * f; hy = y } else if (e === 1) { hx = x + w; hy = y + h * f } else if (e === 2) { hx = x + w * (1 - f); hy = y + h } else { hx = x; hy = y + h * (1 - f) }
      px = hx + (rnd(seed + i * 3) - .5) * wob * 2; py = hy + (rnd(seed + i * 3 + 1) - .5) * wob * 2
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py)
    }
    g.closePath()
  }
  /* a torn paper strip / card with shadow, edge stains and ruled lines */
  K.paper = function (g, x, y, w, h, o) {
    o = o || {}; var seed = o.seed || 1
    g.save()
    if (o.rot) { g.translate(x + w / 2, y + h / 2); g.rotate(o.rot); g.translate(-w / 2 - x, -h / 2 - y) }
    g.save(); g.translate(5, 7); K.scrap(g, x, y, w, h, seed); g.fillStyle = 'rgba(8,4,3,.5)'; g.fill(); g.restore()
    K.scrap(g, x, y, w, h, seed); g.fillStyle = o.fill || PAPER; g.fill()
    g.save(); K.scrap(g, x, y, w, h, seed); g.clip()
    var gr = g.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * .2, x + w / 2, y + h / 2, Math.max(w, h) * .7)
    gr.addColorStop(0, 'rgba(255,240,200,.18)'); gr.addColorStop(1, 'rgba(70,40,20,.34)'); g.fillStyle = gr; g.fillRect(x, y, w, h)
    for (var i = 0; i < Math.round(w * h / 9000); i++) { g.fillStyle = 'rgba(90,55,30,' + (.05 + rnd(seed + i) * .06) + ')'; g.beginPath(); g.ellipse(x + rnd(seed + i * 5) * w, y + rnd(seed + i * 7) * h, 8 + rnd(i) * 26, 5 + rnd(i + 9) * 14, rnd(i) * 3, 0, TAU); g.fill() }
    g.restore()
    K.scrap(g, x, y, w, h, seed); g.lineJoin = 'round'; g.lineWidth = o.line || 3.5; g.strokeStyle = INK; g.stroke()
    g.restore()
  }
  /* item slot: dark box with a bone-coloured inner rim */
  K.slot = function (g, x, y, s, o) {
    o = o || {}
    g.save(); g.fillStyle = 'rgba(8,4,3,.4)'; g.fillRect(x + 3, y + 4, s, s)
    g.fillStyle = o.fill || '#2a1f1a'; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); if (g.roundRect) g.roundRect(x, y, s, s, 6); else g.rect(x, y, s, s); g.fill(); g.stroke()
    g.strokeStyle = o.rim || 'rgba(222,200,150,.45)'; g.lineWidth = 1.5; g.beginPath(); if (g.roundRect) g.roundRect(x + 3.5, y + 3.5, s - 7, s - 7, 4); else g.rect(x + 3.5, y + 3.5, s - 7, s - 7); g.stroke()
    g.restore()
  }

  /* room-type icons for the maps, drawn in a 1-unit box about (cx, cy) of side s; all original marks */
  K.roomIcon = function (g, type, cx, cy, s, red) {
    g.save(); g.translate(cx, cy); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round'
    var lw = 1.8 / s
    function o (fill) { if (fill) { g.fillStyle = fill; g.fill() } g.lineWidth = lw; g.strokeStyle = INK; g.stroke() }
    if (red) type = 'red'
    switch (type) {
      case 'treasure': g.beginPath(); g.rect(-.34, -.06, .68, .36); o('#c9962f'); g.beginPath(); g.moveTo(-.34, -.06); g.quadraticCurveTo(0, -.46, .34, -.06); g.closePath(); o('#e0b34a'); g.beginPath(); g.rect(-.05, -.04, .1, .14); o('#4a2f12'); break
      case 'shop': g.beginPath(); g.arc(0, 0, .34, 0, TAU); o('#e0b34a'); g.beginPath(); g.moveTo(.08, -.2); g.quadraticCurveTo(-.2, -.2, -.12, -.04); g.quadraticCurveTo(0, .04, .12, .06); g.quadraticCurveTo(.2, .2, -.1, .2); g.moveTo(0, -.28); g.lineTo(0, .28); g.lineWidth = lw * 1.3; g.strokeStyle = '#4a2f12'; g.stroke(); break
      case 'boss': case 'boss-double': case 'miniboss': case 'boss-rush': g.beginPath(); g.moveTo(-.34, -.05); g.bezierCurveTo(-.36, -.42, .36, -.42, .34, -.05); g.lineTo(.2, .08); g.lineTo(.2, .3); g.lineTo(-.2, .3); g.lineTo(-.2, .08); g.closePath(); o(type === 'miniboss' ? '#d9824a' : '#d8cdb0'); g.fillStyle = INK; g.beginPath(); g.arc(-.14, -.07, .08, 0, TAU); g.arc(.14, -.07, .08, 0, TAU); g.fill(); g.beginPath(); g.moveTo(-.34, -.3); g.lineTo(-.22, -.18); g.lineTo(-.3, -.1); g.moveTo(.34, -.3); g.lineTo(.22, -.18); g.lineTo(.3, -.1); g.lineWidth = lw * 1.4; g.strokeStyle = BLOOD; g.stroke(); break
      case 'secret': case 'super-secret': case 'ultra-secret': g.beginPath(); for (var i = 0; i < 6; i++) { var a = i / 6 * TAU - TAU / 4; g.lineTo(Math.cos(a) * .36, Math.sin(a) * .36) } g.closePath(); o('#5a4a78'); K.text(g, '?', 0, .02, 1 * .56, { align: 'center', outline: 0, colour: '#f0e4ff' }); break
      case 'devil': g.beginPath(); g.arc(0, .06, .26, 0, TAU); o('#7a1a22'); g.beginPath(); g.moveTo(-.2, -.12); g.lineTo(-.3, -.4); g.lineTo(-.06, -.2); g.moveTo(.2, -.12); g.lineTo(.3, -.4); g.lineTo(.06, -.2); g.lineWidth = lw * 1.6; g.strokeStyle = '#d83a46'; g.stroke(); break
      case 'angel': g.beginPath(); g.ellipse(0, -.28, .18, .06, 0, 0, TAU); g.lineWidth = lw * 1.4; g.strokeStyle = '#f0d97a'; g.stroke(); g.beginPath(); g.moveTo(0, .12); g.quadraticCurveTo(-.5, -.1, -.38, .22); g.quadraticCurveTo(-.18, .12, 0, .28); g.quadraticCurveTo(.18, .12, .38, .22); g.quadraticCurveTo(.5, -.1, 0, .12); o('#f1eadb'); break
      case 'planetarium': g.beginPath(); g.arc(0, 0, .22, 0, TAU); o('#6fa3d8'); g.beginPath(); g.ellipse(0, 0, .42, .12, -.4, 0, TAU); g.lineWidth = lw * 1.5; g.strokeStyle = '#f0d97a'; g.stroke(); break
      case 'curse': g.beginPath(); for (var j = 0; j < 8; j++) { var b = j / 8 * TAU, r = j % 2 ? .18 : .38; g.lineTo(Math.cos(b) * r, Math.sin(b) * r) } g.closePath(); o('#7a2a3a'); break
      case 'sacrifice': g.beginPath(); g.moveTo(-.34, .3); g.lineTo(0, -.36); g.lineTo(.34, .3); g.closePath(); o('#a03a3a'); break
      case 'arcade': case 'dice': case 'challenge': g.beginPath(); g.rect(-.28, -.28, .56, .56); o(type === 'challenge' ? '#b4402f' : '#7ab0d8'); g.fillStyle = INK; for (var d = 0; d < 3; d++) { g.beginPath(); g.arc(-.14 + d * .14, -.14 + d * .14, .05, 0, TAU); g.fill() } break
      case 'library': case 'bedroom': case 'dirty-bedroom': case 'vault': case 'black-market': case 'chest-room': case 'mineshaft': case 'error': g.beginPath(); g.rect(-.3, -.3, .6, .6); o(type === 'vault' ? '#e0b34a' : type === 'black-market' ? '#3a3a48' : '#8a7a5a'); g.beginPath(); g.moveTo(-.16, 0); g.lineTo(.16, 0); g.moveTo(0, -.16); g.lineTo(0, .16); g.lineWidth = lw; g.strokeStyle = INK; g.stroke(); break
      case 'red': g.beginPath(); g.rect(-.26, -.26, .52, .52); o('#b83a32'); break
      case 'start': g.beginPath(); g.arc(0, 0, .16, 0, TAU); g.fillStyle = 'rgba(30,18,12,.75)'; g.fill(); break
      default: break
    }
    g.restore()
  }
  K.ROOM_COLOUR = function (r, current) { return current ? '#f0cf74' : r.cleared ? '#c4b08c' : r.visited ? '#a08a68' : '#6c5c4a' }

  /* ---- streak ------------------------------------------------------------ */
  var legacy = null, legacyT = 0
  // the old bottom banner API becomes a streak: callers keep working
  IS.hud = IS.hud || {}
  IS.hud.pickupBanner = IS.hud.pickupBanner || function () {}
  K.queueLegacy = function (title, sub) { legacy = { title: title || '', sub: sub || '', t: 0, dur: 2.6 }; legacyT = 0 }

  IS.drawStreak = function (g, run, dt) {
    var s = run && run.streak
    if (!s && legacy) { legacy.t += dt || 1 / 60; if (legacy.t >= legacy.dur) legacy = null; else s = legacy }
    if (!s || !(s.dur > 0)) return
    var t = s.t || 0, dur = s.dur, slideIn = ease(t / .28), slideOut = ease((dur - t) / .28), k = Math.min(slideIn, slideOut)
    if (k <= 0) return
    var h = s.sub ? 96 : 72, y = 14 - (1 - k) * (h + 30), w = Math.min(900, 160 + String(s.title || '').length * 30 + (s.sub ? 40 : 0))
    w = Math.max(w, Math.min(1000, 120 + String(s.sub || '').length * 11))
    var x = (VW - w) / 2
    g.save()
    K.paper(g, x, y, w, h, { seed: 7 + String(s.title || '').length, rot: -.012 })
    // two strips of tape
    g.fillStyle = 'rgba(210,190,140,.75)'; g.save(); g.translate(x + 26, y + 2); g.rotate(-.5); g.fillRect(-18, -7, 36, 14); g.restore(); g.save(); g.translate(x + w - 26, y + 2); g.rotate(.5); g.fillRect(-18, -7, 36, 14); g.restore()
    K.text(g, s.title, VW / 2, y + (s.sub ? 38 : h / 2), s.sub ? 38 : 40, { align: 'center', colour: '#2a1712', ink: PAPER, outline: 0, maxWidth: w - 50 })
    g.fillStyle = BLOOD; g.fillRect(x + 36, y + (s.sub ? 59 : h - 12), w - 72, 2.5)
    if (s.sub) K.text(g, s.sub, VW / 2, y + 78, 18, { align: 'center', colour: '#4a3326', outline: 0, weight: 'normal', maxWidth: w - 50 })
    g.restore()
  }

  /* ---- boss versus card -------------------------------------------------- */
  IS.drawBossIntro = function (g, run) {
    var b = run && run.bossIntro
    if (!b) return
    var dur = b.dur || 1.6, t = b.t || 0, k = Math.min(ease(t / .28), ease((dur - t) / .22))
    if (k <= 0) return
    var p = run.player, cy = 330, band = 250 * k
    g.save()
    g.fillStyle = 'rgba(8,4,3,' + (.55 * k).toFixed(3) + ')'; g.fillRect(0, 0, VW, VH)
    // the band: two torn halves meeting on a slanted seam
    g.save(); g.beginPath(); g.rect(0, cy - band / 2, VW, band); g.clip()
    var seam = 60
    g.fillStyle = '#2a1a16'; g.fillRect(0, cy - band / 2, VW, band)
    g.beginPath(); g.moveTo(0, cy - 150); g.lineTo(VW / 2 + seam, cy - 150); g.lineTo(VW / 2 - seam, cy + 150); g.lineTo(0, cy + 150); g.closePath(); g.fillStyle = '#35505c'; g.fill()
    g.beginPath(); g.moveTo(VW / 2 + seam, cy - 150); g.lineTo(VW, cy - 150); g.lineTo(VW, cy + 150); g.lineTo(VW / 2 - seam, cy + 150); g.closePath(); g.fillStyle = '#5a1e22'; g.fill()
    for (var i = 0; i < 26; i++) { g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(rnd(i) * VW, cy - 130 + rnd(i + 40) * 260, 30 + rnd(i + 9) * 70, 6 + rnd(i + 3) * 10, 0, 0, TAU); g.fill() }
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(VW / 2 + seam, cy - 150); g.lineTo(VW / 2 - seam, cy + 150); g.stroke()
    g.restore()
    g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.moveTo(0, cy - band / 2); g.lineTo(VW, cy - band / 2); g.moveTo(0, cy + band / 2); g.lineTo(VW, cy + band / 2); g.stroke()
    // fighters slide in from either side
    var inK = ease(t / .45), lx = 310 - (1 - inK) * 520, rx = 940 + (1 - inK) * 520, bob = Math.sin(t * 5) * 3
    var bossDef = (IS.bossesById && IS.bossesById[b.bossId]) || (IS.bosses || []).find(function (d) { return d.id === b.bossId }) || null
    var bname = b.name || (bossDef && bossDef.name) || 'Boss'
    var sprite = (bossDef && (bossDef.sprite || bossDef.id)) || b.bossId
    if (p && IS.drawPortrait) { g.save(); g.translate(lx, cy + 10 + bob); IS.drawPortrait(g, p.charId, 0, 0, 250, { time: t }); g.restore() }
    else if (p && IS.drawSprite) IS.drawSprite(g, 'player:' + p.charId, lx, cy + bob, 210, { time: t, headDir: { x: 1, y: 0 }, walkDir: { x: 1, y: 0 } })
    if (IS.drawSprite && sprite && IS.sprite(sprite)) IS.drawSprite(g, sprite, rx, cy + 6 - bob, 250, { time: IS.state.time, hp01: 1, dir: -1, tint: bossDef && bossDef.tint })
    // VS in the seam: scratched lettering
    var vk = ease((t - .2) / .25), vs = 92 * (1 + (1 - vk) * .8)
    g.save(); g.translate(VW / 2, cy); g.rotate(-.12); K.text(g, 'VS', 0, 0, vs, { align: 'center', colour: '#f0d89a', ink: INK, outline: 12, font: FONT }); g.restore()
    // name ribbon
    var ry = cy + band / 2 + 18, nk = ease((t - .25) / .3)
    if (nk > 0) {
      var w = Math.min(980, 200 + bname.length * 34)
      g.save(); g.globalAlpha = nk; K.paper(g, (VW - w) / 2, ry + (1 - nk) * 30, w, 82, { seed: 31, rot: .01 })
      K.text(g, bname, VW / 2, ry + 41 + (1 - nk) * 30, 46, { align: 'center', colour: '#2a1712', ink: PAPER, outline: 0, maxWidth: w - 40 }); g.restore()
    }
    if (p) K.text(g, ((IS.charactersById && IS.charactersById[p.charId]) || { name: '' }).name || '', lx, cy - band / 2 - 20, 24, { align: 'center', colour: BONE })
    g.restore()
  }

  /* ---- enlarged map ------------------------------------------------------ */
  K.mapLayout = function (run, maxW, maxH, maxCell, knownOnly) {
    var floor = run.floor, cells = floor && (floor.mapOffsets || (floor.layout && floor.layout.grid)) || [], list = [], x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9
    for (var i = 0; i < cells.length; i++) {
      var r = floor.rooms[i], c = cells[i]; if (!r || !c) continue
      var known = r.visited || (r.mapKnown && !r.virtual); if (knownOnly !== false && !known) continue
      list.push({ i: i, r: r, c: c }); x0 = Math.min(x0, c.x); y0 = Math.min(y0, c.y); x1 = Math.max(x1, c.x + (c.w || 1)); y1 = Math.max(y1, c.y + (c.h || 1))
    }
    if (!list.length) return null
    var cols = x1 - x0, rows = y1 - y0, cs = Math.min(maxCell, maxW / cols, maxH / rows)
    return { list: list, x0: x0, y0: y0, cols: cols, rows: rows, cs: cs, w: cols * cs, h: rows * cs }
  }
  /* draws a laid-out map with its top-left at (bx, by). gap = spacing between rooms */
  K.drawMapCells = function (g, run, L, bx, by, o) {
    o = o || {}
    var cs = L.cs, gap = o.gap == null ? 2 : o.gap, t = (IS.state && IS.state.time) || 0, i, q
    // corridors first so rooms sit on top
    var byPos = {}
    for (i = 0; i < L.list.length; i++) { q = L.list[i]; for (var yy = 0; yy < (q.c.h || 1); yy++) for (var xx = 0; xx < (q.c.w || 1); xx++) byPos[(q.c.x + xx) + ',' + (q.c.y + yy)] = q }
    g.save(); g.lineCap = 'butt'
    for (i = 0; i < L.list.length; i++) {
      q = L.list[i]; var doors = q.r.doors || []
      for (var d = 0; d < doors.length; d++) { var tg = doors[d].target, n = tg != null && L.list.find(function (z) { return z.i === tg }); if (!n || n.i < q.i) continue
        var ax = bx + (q.c.x - L.x0 + (q.c.w || 1) / 2) * cs, ay = by + (q.c.y - L.y0 + (q.c.h || 1) / 2) * cs, cx = bx + (n.c.x - L.x0 + (n.c.w || 1) / 2) * cs, cy = by + (n.c.y - L.y0 + (n.c.h || 1) / 2) * cs
        g.strokeStyle = INK; g.lineWidth = Math.max(4, cs * .22); g.beginPath(); g.moveTo(ax, ay); g.lineTo(cx, cy); g.stroke()
        g.strokeStyle = '#6a5a46'; g.lineWidth = Math.max(2, cs * .12); g.beginPath(); g.moveTo(ax, ay); g.lineTo(cx, cy); g.stroke() }
    }
    g.restore()
    for (i = 0; i < L.list.length; i++) {
      q = L.list[i]; var cur = q.i === run.roomIndex, w = (q.c.w || 1) * cs - gap * 2, h = (q.c.h || 1) * cs - gap * 2, x = bx + (q.c.x - L.x0) * cs + gap, y = by + (q.c.y - L.y0) * cs + gap
      var known = q.r.visited || (q.r.mapKnown && !q.r.virtual), seen = q.r.visited
      g.fillStyle = INK; g.fillRect(x - 2, y - 2, w + 4, h + 4)
      g.fillStyle = K.ROOM_COLOUR(q.r, cur); g.fillRect(x, y, w, h)
      g.fillStyle = 'rgba(255,245,215,.22)'; g.fillRect(x, y, w, Math.max(2, h * .12)); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, y + h - Math.max(2, h * .14), w, Math.max(2, h * .14))
      var ty = q.r.type
      if (ty && ty !== 'default' && ty !== 'normal' && ty !== 'start' || q.r.red) K.roomIcon(g, ty, x + w / 2, y + h / 2, Math.min(w, h) * (o.iconScale || .78), q.r.red)
      else if (ty === 'start' && cs > 20) K.roomIcon(g, 'start', x + w / 2, y + h / 2, Math.min(w, h) * .8)
      if (cur) { g.strokeStyle = 'rgba(255,250,225,' + (.65 + Math.sin(t * 6) * .3).toFixed(2) + ')'; g.lineWidth = Math.max(2, cs * .09); g.strokeRect(x - 3, y - 3, w + 6, h + 6) }
      if (!seen && known) { g.fillStyle = 'rgba(20,12,9,.35)'; g.fillRect(x, y, w, h) }
    }
  }
  IS.drawMap = function (g, run) {
    if (!run || !run.floor || ((run.curses || 0) & (IS.CURSE && IS.CURSE.LOST || 4))) return
    var L = K.mapLayout(run, 880, 440, 78); if (!L) return
    var t = (IS.state && IS.state.time) || 0
    g.save(); g.fillStyle = 'rgba(10,6,5,.74)'; g.fillRect(0, 0, VW, VH)
    var bx = (VW - L.w) / 2, by = (VH - L.h) / 2 + 20
    var pad = 36; K.paper(g, bx - pad, by - pad, L.w + pad * 2, L.h + pad * 2, { seed: 5, fill: '#2f2420', line: 4 })
    K.drawMapCells(g, run, L, bx, by, { gap: Math.max(2, L.cs * .05), iconScale: .72 })
    var fname = (run.floor.def && run.floor.def.name) || run.floor.id || ''
    K.text(g, String(fname).toUpperCase(), VW / 2, by - pad - 26, 34, { align: 'center', colour: BONE })
    // legend of the marks that appear on this floor
    var seen = {}, names = { treasure: 'Treasure', shop: 'Shop', boss: 'Boss', secret: 'Secret', 'super-secret': 'Secret', devil: 'Devil', angel: 'Angel', planetarium: 'Planetarium', curse: 'Curse', sacrifice: 'Sacrifice', arcade: 'Arcade', library: 'Library', challenge: 'Challenge', dice: 'Dice', miniboss: 'Mini-boss', vault: 'Vault' }, leg = []
    for (var i = 0; i < L.list.length; i++) { var ty = L.list[i].r.type; if (names[ty] && !seen[names[ty]]) { seen[names[ty]] = 1; leg.push([ty, names[ty]]) } }
    var lx = (VW - leg.length * 118) / 2, ly = by + L.h + pad + 28
    for (i = 0; i < leg.length; i++) { K.roomIcon(g, leg[i][0], lx + i * 118 + 12, ly, 22); K.text(g, leg[i][1], lx + i * 118 + 28, ly, 15, { colour: BONE, weight: 'normal', outline: 3 }) }
    K.text(g, 'TAB  close', VW / 2, VH - 22, 14, { align: 'center', colour: '#b9a98a', weight: 'normal', outline: 3 })
    g.restore()
  }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
