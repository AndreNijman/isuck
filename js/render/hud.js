;(function (IS) {
  'use strict'
  /*
   * Heads-up display, in 1280x720 view units:
   *   top left       active item slot with a vertical charge bar, then the hearts
   *   left edge      coin / bomb / key counters, then floor name and timer
   *   bottom left    trinkets
   *   bottom right   pocket item (card or pill) with its name
   *   top right      minimap
   *   top centre     the streak strip (run.streak) and the boss versus card (run.bossIntro), in overlays.js
   */
  var lastReady = Object.create(null)
  IS.hud = IS.hud || {}
  var K = function () { return IS.hudKit }
  function text (g, s, x, y, size, align, colour) { var k = K(); if (k) k.text(g, s, x, y, size, { align: align, colour: colour, font: 'ui-monospace, Menlo, Consolas, monospace', outline: Math.max(3, size * .24) }); else { g.font = 'bold ' + size + 'px monospace'; g.textAlign = align || 'left'; g.textBaseline = 'middle'; g.fillStyle = colour || '#eadcc7'; g.fillText(String(s), x, y) } }
  function icon (g, name, x, y, s, t) { if (IS.drawSprite && IS.sprite && IS.sprite(name)) IS.drawSprite(g, name, x, y, s, t || {}); else { g.fillStyle = '#b99362'; g.fillRect(x - s / 4, y - s / 4, s / 2, s / 2) } }
  // Hearts are drawn here rather than from the pickup sprites so a half heart is
  // visibly half and an empty container reads as an outline.
  var HEART = { red: '#d42a2a', rotten: '#7d8a3a', soul: '#8aa6d8', black: '#2b2430', bone: '#e6dfcc', eternal: '#f4f4f4', gold: '#e8c040', broken: '#5a4a4a' }
  function heartPath (g, x, y, s) { g.beginPath(); g.moveTo(x, y + s * .42); g.bezierCurveTo(x - s * .55, y + s * .08, x - s * .45, y - s * .42, x, y - s * .14); g.bezierCurveTo(x + s * .45, y - s * .42, x + s * .55, y + s * .08, x, y + s * .42); g.closePath() }
  function heart (g, kind, fill, x, y, keeper, s) {
    if (keeper) { icon(g, 'penny', x, y, 27, { variant: fill < 1 ? 'half' : '' }); return }
    g.save()
    heartPath(g, x + 1.5, y + 2.5, s); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill()
    heartPath(g, x, y, s); g.fillStyle = 'rgba(30,14,14,.7)'; g.fill()
    if (fill > 0) {
      g.save(); heartPath(g, x, y, s); g.clip()
      g.fillStyle = HEART[kind] || '#d42a2a'; g.fillRect(x - s * .6, y - s * .6, fill >= 1 ? s * 1.2 : s * .6, s * 1.2)
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x - s * .6, y + s * .18, s * 1.2, s * .3)
      g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(x - s * .2, y - s * .12, s * .1, s * .06, -.6, 0, 7); g.fill()
      g.restore()
    }
    heartPath(g, x, y, s); g.lineJoin = 'round'; g.lineWidth = Math.max(2.4, s * .1); g.strokeStyle = kind === 'broken' ? '#8a7070' : '#150a0a'; g.stroke()
    if (kind === 'broken') { g.beginPath(); g.moveTo(x, y - s * .14); g.lineTo(x - s * .08, y + s * .08); g.lineTo(x + s * .06, y + s * .16); g.lineTo(x, y + s * .42); g.stroke() }
    if (kind === 'eternal' || kind === 'gold') { heartPath(g, x, y, s * .55); g.lineWidth = 1; g.strokeStyle = kind === 'gold' ? '#fff3b0' : '#c8c8c8'; g.stroke() }
    g.restore()
  }
  var HX = 112, HY = 28
  function hearts (g, p, u) {
    var h = p.hearts || {}, cells = [], i
    var red = h.red || 0, max = h.maxRed || 0
    for (i = 0; i < max; i += 2) cells.push([i < (h.rotten || 0) ? 'rotten' : 'red', Math.max(0, Math.min(2, red - i)) / 2])
    for (i = 0; i < (h.bone || 0); i += 2) cells.push(['bone', Math.min(2, h.bone - i) / 2])
    for (i = 0; i < (h.soul || 0); i += 2) cells.push(['soul', Math.min(2, h.soul - i) / 2])
    for (i = 0; i < (h.black || 0); i += 2) cells.push(['black', Math.min(2, h.black - i) / 2])
    if (h.eternal) cells.push(['eternal', 1])
    for (i = 0; i < (h.broken || 0); i++) cells.push(['broken', 0])
    var keeper = p.flags && p.flags.has && p.flags.has('keeperHearts')
    for (i = 0; i < cells.length; i++) heart(g, cells[i][0], cells[i][1], HX * u + (i % 6) * 32 * u, HY * u + ((i / 6) | 0) * 30 * u, keeper, 31 * u)
    for (i = 0; i < (h.gold || 0) && i < cells.length; i++) { var gx = HX * u + (i % 6) * 32 * u, gy = HY * u + ((i / 6) | 0) * 30 * u; heartPath(g, gx, gy, 31 * u); g.lineWidth = 2.5 * u; g.strokeStyle = HEART.gold; g.stroke() }
  }
  function consumables (g, p, u, y0) {
    var vals = [['penny', p.coins], ['bomb', p.bombs], ['key', p.keys]]
    for (var i = 0; i < vals.length; i++) { var y = y0 + i * 32 * u; icon(g, vals[i][0], 30 * u, y, 28 * u, {}); text(g, String(vals[i][1] || 0).padStart(2, '0') + (i === 1 && p.goldenBomb ? '*' : i === 2 && p.goldenKey ? '*' : ''), 54 * u, y, 20 * u) }
  }
  // the active item: a slot with a vertical charge bar down its right side
  function actives (g, p, u) {
    var k = K(), n = 0
    for (var i = 0; i < 2; i++) {
      var a = p.active && p.active[i]; if (!a) continue
      var big = i === 0, s = (big ? 66 : 44) * u, x = 14 * u, y = (big ? 12 : 84) * u, ratio = a.maxCharge ? Math.min(1, a.charge / a.maxCharge) : 1
      if (k) k.slot(g, x, y, s); else { g.fillStyle = 'rgba(28,18,13,.8)'; g.fillRect(x, y, s, s) }
      icon(g, 'item:' + a.id, x + s / 2, y + s / 2, s * .78, {})
      var bx = x + s + 7 * u, bh = s, bw = 10 * u
      g.fillStyle = '#150a0a'; g.fillRect(bx - 2, y - 2, bw + 4, bh + 4)
      g.fillStyle = '#3a2a22'; g.fillRect(bx, y, bw, bh)
      g.fillStyle = ratio >= 1 ? (Math.floor(((IS.state && IS.state.time) || 0) * 6) % 2 ? '#f2d680' : '#e2bd62') : '#c46a3a'; g.fillRect(bx, y + bh * (1 - ratio), bw, bh * ratio)
      var cells = Math.min(12, a.maxCharge || 0); g.fillStyle = 'rgba(21,10,10,.8)'; for (var c = 1; c < cells; c++) g.fillRect(bx, y + bh * (c / cells) - .5, bw, 1.5)
      if (ratio >= 1 && !lastReady[i]) { lastReady[i] = true; if (IS.audio && IS.audio.sfx) IS.audio.sfx('charge-ready') } else if (ratio < 1) lastReady[i] = false
      n++
    }
    return n
  }
  function drawLabelled (g, name, x, y, size, align) { text(g, name, x, y, size, align) }
  function pocketName (p, x, run) {
    var d = x.kind === 'pill' ? (IS.pillsById && IS.pillsById[x.id]) : (IS.cardsById && IS.cardsById[x.id])
    if (x.kind === 'pill') { var known = run && ((run.identifiedPills && run.identifiedPills[x.id]) || (run.identified && run.identified[x.id])); return known && d ? d.name : 'Pill' }
    return (d && d.name) || x.id
  }
  function pockets (g, run, p, u) {
    var list = p.pocket || []; if (!list.length) return
    var k = K(), first = list[0], s = 56 * u, x = 1280 * u - 22 * u - s, y = 720 * u - 18 * u - s
    if (k) k.slot(g, x, y, s); icon(g, first.kind === 'pill' ? 'pill:' + first.id : 'card:' + first.id, x + s / 2, y + s / 2, s * .8, { variant: run.pillColours && run.pillColours[first.id] })
    drawLabelled(g, pocketName(p, first, run), x - 12 * u, y + s / 2, 17 * u, 'right')
    for (var i = 1; i < list.length && i < 3; i++) { var q = list[i], qs = 34 * u, qx = x - i * 40 * u - 8 * u, qy = y - qs - 8 * u; if (k) k.slot(g, qx - 80 * u + 80 * u, qy, qs); icon(g, q.kind === 'pill' ? 'pill:' + q.id : 'card:' + q.id, qx + qs / 2, qy + qs / 2, qs * .78, { variant: run.pillColours && run.pillColours[q.id] }) }
  }
  function trinkets (g, p, u) {
    var k = K(), tr = p.trinkets || []
    for (var i = 0; i < tr.length; i++) if (tr[i]) { var s = 52 * u, x = 18 * u + i * 60 * u, y = 720 * u - 18 * u - s; if (k) k.slot(g, x, y, s); icon(g, 'item:' + tr[i], x + s / 2, y + s / 2, s * .76, {}) }
  }

  // the corner minimap: only rooms the player knows of, fitted into a fixed box at the top right
  IS.hud.minimap = function (g, run) {
    var floor = run.floor; if (!floor || ((run.curses || 0) & (IS.CURSE && IS.CURSE.LOST || 4)) || !K()) return
    if (IS.input && IS.input.down && IS.input.down('map')) return // the full map is up instead
    var L = K().mapLayout(run, 156, 126, 26); if (!L) return
    var bx = 1280 - 18 - L.w, by = 16
    g.save(); g.fillStyle = 'rgba(14,8,6,.38)'; g.fillRect(bx - 8, by - 8, L.w + 16, L.h + 16); g.restore()
    K().drawMapCells(g, run, L, bx, by, { gap: 1.5, iconScale: .8 })
  }
  IS.hud.pickupBanner = function (textValue, subtext) { if (K()) K().queueLegacy(textValue, subtext); return 1 }
  IS.hud.draw = function (g, run) {
    if (!g || !run || !run.player) return; var u = Math.min((IS.VIEW_W || 1280) / 1280, (IS.VIEW_H || 720) / 720), p = run.player
    var nAct = actives(g, p, u)
    if ((run.curses || 0) & (IS.CURSE && IS.CURSE.UNKNOWN || 8)) text(g, '???', HX * u, HY * u, 24 * u, 'left', '#d8b0a0'); else hearts(g, p, u)
    var cy = nAct > 1 ? 160 : 124; consumables(g, p, u, cy * u)
    var fy = cy + 3 * 32 + 14
    var mins = Math.floor((run.time || 0) / 60), secs = Math.floor(run.time || 0) % 60
    text(g, (run.floor && run.floor.def && run.floor.def.name) || (run.floor && run.floor.id) || '', 16 * u, fy * u, 14 * u, 'left', '#d9c9a8')
    text(g, mins + ':' + String(secs).padStart(2, '0'), 16 * u, (fy + 20) * u, 13 * u, 'left', '#bba88c')
    if (IS.save && IS.save.option && IS.save.option('seedDisplay')) text(g, run.seedStr || '', 16 * u, (fy + 40) * u, 12 * u, 'left', '#9e8a70')
    trinkets(g, p, u); pockets(g, run, p, u); IS.hud.minimap(g, run)
    if (IS.charHud) IS.charHud(g, run, u) // characters worker: pocket-active ring, extra bodies, counters
    if (IS.input && IS.input.down && IS.input.down('map') && IS.drawMap) IS.drawMap(g, run)
    if (IS.drawStreak) IS.drawStreak(g, run, IS.DT)
    if (IS.drawBossIntro) IS.drawBossIntro(g, run)
  }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
