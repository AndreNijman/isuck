;(function (IS) {
  'use strict'

  var banners = [], activeBanner = null, bannerT = 0, lastReady = Object.create(null)
  IS.hud = IS.hud || {}
  function text (g, s, x, y, size, align, colour) { g.font = 'bold ' + size + 'px monospace'; g.textAlign = align || 'left'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(20,12,9,.7)'; g.fillText(String(s), x + 2, y + 2); g.fillStyle = colour || '#eadcc7'; g.fillText(String(s), x, y) }
  function icon (g, name, x, y, s, t) { if (IS.drawSprite) IS.drawSprite(g, name, x, y, s, t || {}); else { g.fillStyle = '#b99362'; g.fillRect(x - s / 4, y - s / 4, s / 2, s / 2) } }
  function heart (g, kind, half, x, y, keeper) {
    if (keeper) { icon(g, 'coin-penny', x, y, 27, { variant: half ? 'half' : '' }); return }
    var name = kind === 'red' ? 'heart-' + (half ? 'half' : 'full') : kind === 'soul' ? 'heart-soul' : kind === 'black' ? 'heart-black' : kind === 'bone' ? 'heart-bone' : kind === 'rotten' ? 'heart-rotten' : 'heart-' + kind
    icon(g, name, x, y, 30, {})
  }
  function hearts (g, p, u) {
    var h = p.hearts || {}, cells = [], i
    for (i = 0; i < (h.bone || 0); i += 2) cells.push(['bone', h.bone - i === 1])
    for (i = 0; i < (h.red || 0); i += 2) cells.push([i < (h.rotten || 0) ? 'rotten' : 'red', h.red - i === 1])
    for (i = 0; i < (h.soul || 0); i += 2) cells.push(['soul', h.soul - i === 1])
    for (i = 0; i < (h.black || 0); i += 2) cells.push(['black', h.black - i === 1])
    if (h.eternal) cells.push(['eternal', true]); if (h.gold) cells.push(['gold', false])
    for (i = 0; i < (h.broken || 0); i++) cells.push(['broken', false])
    for (i = 0; i < cells.length; i++) heart(g, cells[i][0], cells[i][1], 26 * u + (i % 6) * 31 * u, 25 * u + ((i / 6) | 0) * 29 * u, p.flags && p.flags.has('keeperHearts'))
  }
  function consumables (g, p, u) {
    var y = 86 * u, vals = [['coin-penny', p.coins], ['bomb', p.bombs], ['key', p.keys]]
    for (var i = 0; i < vals.length; i++) { icon(g, vals[i][0], 28 * u, y + i * 29 * u, 25 * u, {}); text(g, String(vals[i][1] || 0).padStart(2, '0') + (i === 1 && p.goldenBomb ? '*' : i === 2 && p.goldenKey ? '*' : ''), 48 * u, y + i * 29 * u, 18 * u) }
  }
  function actives (g, p, u) {
    for (var i = 0; i < 2; i++) { var a = p.active && p.active[i]; if (!a) continue; var x = 1230 * u - i * 72 * u, y = 72 * u, r = 28 * u, ratio = a.maxCharge ? Math.min(1, a.charge / a.maxCharge) : 1
      g.fillStyle = 'rgba(28,18,13,.8)'; g.fillRect(x - 34 * u, y - 34 * u, 68 * u, 68 * u); icon(g, 'item:' + a.id, x, y, 50 * u, {})
      g.strokeStyle = '#3b2b22'; g.lineWidth = 6 * u; g.beginPath(); g.arc(x, y, r + 5 * u, 0, Math.PI * 2); g.stroke(); g.strokeStyle = ratio >= 1 ? '#e2bd62' : '#a4633f'; g.beginPath(); g.arc(x, y, r + 5 * u, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio); g.stroke()
      if (ratio >= 1 && !lastReady[i]) { lastReady[i] = true; if (IS.audio && IS.audio.sfx) IS.audio.sfx('charge-ready') } else if (ratio < 1) lastReady[i] = false
    }
  }
  IS.hud.minimap = function (g, run) {
    var floor = run.floor; if (!floor || ((run.curses || floor.curses || 0) & (IS.CURSE && IS.CURSE.LOST || 4))) return
    var cells = floor.mapOffsets || (floor.layout && floor.layout.grid) || [], expanded = !!(IS.input && IS.input.down && IS.input.down('map'))
    var s = expanded ? 28 : 11, bx = expanded ? 640 - 6.5 * s : 1112, by = expanded ? 360 - 6.5 * s : 18
    if (expanded) { g.fillStyle = 'rgba(17,11,9,.82)'; g.fillRect(380, 100, 520, 520) }
    for (var i = 0; i < cells.length; i++) { var r = floor.rooms[i], c = cells[i], known = r && (r.visited || r.mapKnown); if (!known) continue; var x = bx + c.x * s, y = by + c.y * s
      g.fillStyle = i === run.roomIndex ? '#e0b963' : r.cleared ? '#aa9578' : r.visited ? '#75634f' : '#3a3028'; g.fillRect(x, y, s - 2, s - 2)
      if (r.type && r.type !== 'default' && r.type !== 'start') { text(g, ({ treasure: 'T', shop: '$', boss: 'B', secret: '?', devil: 'D', angel: 'A', planetarium: '*' })[r.type] || '·', x + (s - 2) / 2, y + (s - 2) / 2, Math.max(7, s * .45), 'center', '#291c16') }
    }
  }
  IS.hud.pickupBanner = function (textValue, subtext) { banners.push({ text: textValue || '', sub: subtext || '' }); return banners.length }
  function drawBanner (g, dt) {
    if (!activeBanner && banners.length) { activeBanner = banners.shift(); bannerT = 0 }
    if (!activeBanner) return; bannerT += dt || IS.DT || 1 / 60; var a = Math.min(1, bannerT * 5, (3.2 - bannerT) * 3)
    if (bannerT >= 3.2) { activeBanner = null; return }
    g.globalAlpha = Math.max(0, a); g.fillStyle = 'rgba(30,18,13,.88)'; g.fillRect(390, 622, 500, 70); g.fillStyle = '#b78d52'; g.fillRect(390, 622, 6, 70); text(g, activeBanner.text, 640, 645, 22, 'center'); text(g, activeBanner.sub, 640, 671, 13, 'center', '#bda98e'); g.globalAlpha = 1
  }
  IS.hud.draw = function (g, run) {
    if (!g || !run || !run.player) return; var u = Math.min((IS.VIEW_W || 1280) / 1280, (IS.VIEW_H || 720) / 720)
    hearts(g, run.player, u); consumables(g, run.player, u); actives(g, run.player, u); IS.hud.minimap(g, run)
    var pockets = run.player.pocket || []; for (var i = 0; i < pockets.length; i++) { var p = pockets[i], name = p.kind === 'pill' ? 'pill:' + p.id : 'card:' + p.id; icon(g, name, (1240 - i * 48) * u, 670 * u, 38 * u, { variant: run.pillColours && run.pillColours[p.id] }) }
    var tr = run.player.trinkets || []; for (i = 0; i < tr.length; i++) if (tr[i]) icon(g, 'item:' + tr[i], (28 + i * 42) * u, 674 * u, 34 * u, {})
    var mins = Math.floor((run.time || 0) / 60), secs = Math.floor(run.time || 0) % 60; text(g, (run.floor && run.floor.def && run.floor.def.name) || (run.floor && run.floor.id) || '', 18, 186, 14); text(g, mins + ':' + String(secs).padStart(2, '0'), 18, 207, 13, 'left', '#bba88c')
    if (IS.save && IS.save.option && IS.save.option('seedDisplay')) text(g, run.seedStr || '', 18, 228, 12, 'left', '#9e8a70')
    drawBanner(g, IS.DT)
  }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
