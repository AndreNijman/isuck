;(function (IS) {
  'use strict'
  // Procedural art for pickups (coin, heart, key, bomb, battery, card, chest and sack
  // variants), beggars and machines. Pickups are 'pk:<name>', machines 'machine:<type>'.
  // IS.pickupSprite resolves a pickup to a registered name, IS.drawPickupExtras adds the
  // price tag and the revealed-contents icon, IS.drawMachines draws room.machines.
  var A = IS.art
  if (!A || !A.register) return
  var al = A.al, sh = A.sh

  function coin (g, t, c, rim, mark) {
    var spin = Math.abs(Math.cos(((t.time || 0) * 2.4) % 6.283)) * .25 + .75
    A.ball(g, 0, 2, 30 * spin, 30, rim); A.ball(g, 0, 2, 23 * spin, 23, c)
    A.line(g, sh(rim, .3), 4, [0, -10, 0, 14]); if (mark) A.line(g, mark, 3, [-9, 2, 9, 2])
  }
  var COINS = { penny: ['#c98a45', '#8a5427'], nickel: ['#c9ccd0', '#7b8087'], dime: ['#e8eef2', '#8d99a3'], lucky: ['#e9c64f', '#9a7a1b', '#fff6c0'], 'sticky-nickel': ['#b8c4a0', '#6e7a55', '#7aa043'] }
  Object.keys(COINS).forEach(function (k) { var d = COINS[k]; A.register('pk:coin-' + k, function (g, t) { coin(g, t, d[0], d[1], d[2]); if (k === 'dime') A.line(g, '#fff', 3, [-8, -8, 8, -8]) }) })

  function heartSprite (c, o) {
    return function (g, t) {
      var bob = Math.sin((t.time || 0) * 3) * 1.5
      A.heart(g, 0, bob, 30, 30, c)
      A.flat(g, -12, -14 + bob, 7, 4, 'rgba(255,255,255,.55)', -.6)
      if (o && o.half) { A.line(g, '#2a1519', 3, [0, -12 + bob, 3, 0 + bob, -3, 8 + bob, 0, 24 + bob]); g.save(); g.globalCompositeOperation = 'source-over'; g.restore() }
      if (o && o.gold) { A.glow(g, 0, bob, 36, '#ffe58a', .35) }
      if (o && o.eternal) { A.glow(g, 0, bob, 38, '#ffffff', .45); A.line(g, '#fff6d8', 3, [-5, -2 + bob, 0, -8 + bob, 5, -2 + bob]); A.wing(g, -26, -10 + bob, 18, 2.6, '#fff', { s: -1 }); A.wing(g, 26, -10 + bob, 18, .5, '#fff', { s: 1 }) }
      if (o && o.bone) { A.line(g, '#eee5cf', 6, [-14, -4 + bob, 14, 6 + bob]); A.ball(g, -15, -5 + bob, 5, 5, '#eee5cf'); A.ball(g, 15, 7 + bob, 5, 5, '#eee5cf') }
      if (o && o.rotten) { A.flies(g, 2, 28, 5, 4, bob) ; A.blob(g, 10, 8 + bob, 5, 4, '#6e8a2d') }
      if (o && o.blended) { g.save(); g.beginPath(); g.rect(0, -40, 50, 80); g.clip(); A.heart(g, 0, bob, 30, 30, '#74b9d8'); g.restore() }
      if (o && o.broken) { A.line(g, '#120a0c', 4, [0, -10 + bob, -6, 0 + bob, 4, 8 + bob, -2, 22 + bob]) }
    }
  }
  var HEARTS = { red: ['#c23a45'], half: ['#c23a45', { half: 1 }], soul: ['#6db6d6'], black: ['#2b2631'], eternal: ['#f2f2ee', { eternal: 1 }], gold: ['#e2b93a', { gold: 1 }], bone: ['#d9cdb2', { bone: 1 }], rotten: ['#8c9a3c', { rotten: 1 }], blended: ['#c23a45', { blended: 1 }], broken: ['#4a2a30', { broken: 1 }] }
  Object.keys(HEARTS).forEach(function (k) { A.register('pk:heart-' + k, heartSprite(HEARTS[k][0], HEARTS[k][1])) })

  function key (g, t, c) { A.line(g, sh(c, -.5), 10, [0, -12, 0, 32]); A.line(g, c, 6, [0, -12, 0, 32]); A.ball(g, 0, -22, 14, 14, sh(c, -.5)); A.ball(g, 0, -22, 10, 10, c); A.ball(g, 0, -22, 4, 4, '#2a1c10'); A.line(g, c, 6, [0, 20, 12, 20]); A.line(g, c, 6, [0, 30, 10, 30]) }
  A.register('pk:key', function (g, t) { key(g, t, '#c9ccd0') })
  A.register('pk:key-golden', function (g, t) { A.glow(g, 0, 0, 40, '#ffe58a', .35); key(g, t, '#e2b93a') })
  function bomb (g, t, c) { A.ball(g, 0, 8, 28, 27, c); A.flat(g, -10, -4, 7, 4, 'rgba(255,255,255,.4)', -.7); A.rect(g, -8, -26, 16, 10, '#51555a', 2); A.line(g, '#8a6a3a', 4, [4, -26, 12, -36, 20, -34]); A.ball(g, 21, -35, 5 + Math.sin((t.time || 0) * 14) * 1.5, 5, '#f0ad32') }
  A.register('pk:bomb', function (g, t) { bomb(g, t, '#2a2d30') })
  A.register('pk:bomb-golden', function (g, t) { A.glow(g, 0, 4, 42, '#ffe58a', .35); bomb(g, t, '#d8ad39') })
  function battery (g, t, c, big, small) {
    var s = small ? .75 : big ? 1.12 : 1
    g.save(); g.scale(s, s); A.rect(g, -15, -26, 30, 54, '#3a3f45', 5); A.rect(g, -6, -34, 12, 9, '#b8bcc0', 2); A.rect(g, -15, -4, 30, 28, c, 4)
    A.line(g, '#fff', 4, [-4, 6, 2, 0, -2, 12, 4, 6]); g.restore()
    if (big) A.glow(g, 0, 0, 40, '#7fd2ff', .35 + Math.sin((t.time || 0) * 5) * .15)
  }
  A.register('pk:battery-normal', function (g, t) { battery(g, t, '#d6a93a') })
  A.register('pk:battery-micro', function (g, t) { battery(g, t, '#b7d05a', false, true) })
  A.register('pk:battery-mega', function (g, t) { battery(g, t, '#5ab2e8', true) })
  A.register('pk:card', function (g, t) { A.rect(g, -20, -28, 40, 56, '#e8dcc0', 4); A.rect(g, -15, -22, 30, 44, '#6b2f3a', 3); A.ball(g, 0, 0, 8, 8, '#e2b93a'); A.line(g, '#e2b93a', 3, [0, -14, 0, 14]) })
  A.register('pk:sack', function (g, t) { A.ball(g, 0, 10, 28, 24, '#a07a4a'); A.poly(g, [-14, -8, -10, -28, 10, -28, 14, -8], '#8a6638'); A.line(g, '#4a3118', 4, [-12, -12, 12, -12]); A.line(g, '#4a3118', 3, [-6, 10, 0, 4, 6, 10]) })
  A.register('pk:sack-black', function (g, t) { A.ball(g, 0, 10, 28, 24, '#2c2a33'); A.poly(g, [-14, -8, -10, -28, 10, -28, 14, -8], '#201e26'); A.line(g, '#6a2a3a', 4, [-12, -12, 12, -12]); A.line(g, '#8f5260', 3, [-6, 10, 0, 4, 6, 10]) })

  // chests: body colour, lid colour, band colour, extras by variant
  var CHESTS = {
    normal: ['#8a5a30', '#a8723c', '#c9a063'], golden: ['#d8ad39', '#efcb5a', '#fff0a8'], red: ['#a03038', '#c2434c', '#e07a80'], spiked: ['#7a3a40', '#964650', '#c9ccd0'],
    mimic: ['#7d4a2c', '#9a5c36', '#d9d0a0'], haunted: ['#4d4a68', '#6a6690', '#a8c4e8'], old: ['#5c5148', '#74685c', '#8f857a'], mega: ['#3a3f62', '#4d54800', '#e2b93a'],
    bomb: ['#3a3d40', '#52565a', '#d04a3a'], eternal: ['#e8e4dc', '#fdfaf0', '#f2d675'], stone: ['#6f7378', '#8a8f95', '#4d5156'], wooden: ['#7a5a3a', '#9a7448', '#4d3820']
  }
  CHESTS.mega[1] = '#4d5480'
  Object.keys(CHESTS).forEach(function (v) {
    var c = CHESTS[v]
    ;[false, true].forEach(function (open) {
      A.register('pk:chest-' + v + (open ? '-open' : ''), function (g, t) {
        var w = v === 'mega' ? 36 : 30, hov = v === 'haunted' ? Math.sin((t.time || 0) * 3) * 3 : 0
        g.save(); g.translate(0, hov)
        if (v === 'eternal' || v === 'golden') A.glow(g, 0, 0, 46, v === 'eternal' ? '#ffffff' : '#ffe58a', .3)
        A.rect(g, -w, -4, w * 2, 34, c[0], 4)
        if (open) { A.rect(g, -w + 3, -4, w * 2 - 6, 10, '#160c10', 2); A.rect(g, -w, -34, w * 2, 22, c[1], 4); A.rect(g, -w + 4, -30, w * 2 - 8, 8, sh(c[1], .2), 3) }
        else { A.rect(g, -w - 2, -22, w * 2 + 4, 24, c[1], 6); A.rect(g, -5, -2, 10, 14, c[2], 2); A.ball(g, 0, 6, 2, 2, '#1a1010') }
        A.rect(g, -w, 6, w * 2, 5, c[2], 1)
        if (v === 'spiked') for (var i = -2; i <= 2; i++) A.poly(g, [i * 12 - 5, -22, i * 12, -34, i * 12 + 5, -22], '#c9ccd0')
        if (v === 'mimic') { A.ball(g, -14, -10, 3, 3, '#fff'); A.ball(g, 14, -10, 3, 3, '#fff') }
        if (v === 'bomb') { A.ball(g, 0, 12, 6, 6, '#d04a3a'); A.line(g, '#d04a3a', 3, [-4, 12, 4, 12]) }
        if (v === 'stone') { A.line(g, '#4d5156', 3, [-18, -10, -8, -2, -14, 8]); A.line(g, '#4d5156', 3, [16, -14, 8, -4]) }
        if (v === 'wooden') { A.line(g, '#4d3820', 3, [-24, 4, -24, 26]); A.line(g, '#4d3820', 3, [24, 4, 24, 26]) }
        if (v === 'old') A.line(g, '#3a342e', 2, [-20, -16, -8, -6])
        if (v === 'red') A.line(g, '#2a1014', 3, [-14, 18, 14, 18])
        g.restore()
      })
    })
  })

  // beggars and machines
  function beggar (cloth, skin, cup, extra) {
    return function (g, t) {
      var bob = Math.sin((t.time || 0) * 2) * 1.2, a = t.anim || 0
      if (t.broken) { A.ball(g, 0, 30, 24, 7, 'rgba(0,0,0,.25)'); A.poly(g, [-26, 30, -18, 0, 18, 0, 26, 30], sh(cloth, -.4)); return }
      A.ball(g, 0, 34, 26, 7, 'rgba(0,0,0,.28)')
      A.poly(g, [-30, 34, -20, -6, 20, -6, 30, 34], cloth)
      A.line(g, sh(cloth, -.5), 3, [-8, 6, -4, 30]); A.line(g, sh(cloth, -.5), 3, [10, 4, 14, 28])
      A.ball(g, 0, -20 + bob, 16, 17, skin); A.poly(g, [-18, -22 + bob, 0, -44 + bob, 18, -22 + bob], cloth)
      A.ball(g, -6, -18 + bob, 2.6, 3, '#1a1010'); A.ball(g, 6, -18 + bob, 2.6, 3, '#1a1010'); A.line(g, '#1a1010', 2, [-6, -9 + bob, 0, -7 + bob, 6, -9 + bob])
      A.rect(g, 14, 6 - a * 6, 20, 14, cup, 3); A.ball(g, 24, 6 - a * 6, 10, 3, sh(cup, .3))
      if (extra) extra(g, t, bob)
    }
  }
  A.register('machine:beggar', beggar('#6b5a46', '#d9b48c', '#8a8f95'))
  A.register('machine:devil-beggar', beggar('#4a1d28', '#b6584c', '#2a2d30', function (g, t, b) { A.poly(g, [-12, -34 + b, -8, -50 + b, -3, -36 + b], '#2a1014'); A.poly(g, [12, -34 + b, 8, -50 + b, 3, -36 + b], '#2a1014') }))
  A.register('machine:key-beggar', beggar('#4a5a6b', '#d9b48c', '#c9ccd0', function (g) { A.ball(g, -26, 8, 6, 6, '#c9ccd0'); A.line(g, '#c9ccd0', 3, [-26, 12, -26, 26]) }))
  A.register('machine:bomb-bum', beggar('#3c3e42', '#c9a07a', '#2a2d30', function (g) { A.ball(g, -24, 10, 8, 8, '#2a2d30'); A.line(g, '#8a6a3a', 2, [-22, 2, -18, -4]) }))
  A.register('machine:battery-bum', beggar('#6b6a2e', '#d9b48c', '#d6a93a', function (g) { A.rect(g, -32, 2, 10, 18, '#3a3f45', 2) }))
  A.register('machine:rotten-beggar', beggar('#4d5a2e', '#a4b27a', '#5a6a2e', function (g, t) { A.flies(g, 3, 30, 5, 4, -20) }))

  function box (g, t, body, trim, dim) {
    if (t.broken) { A.rect(g, -28, -6, 56, 34, sh(body, -.5), 4); A.line(g, '#1a1010', 3, [-20, 0, -6, 16, 6, 4, 18, 24]); return }
    A.ball(g, 0, 36, 30, 7, 'rgba(0,0,0,.28)'); A.rect(g, -28, -40, 56, 74, body, 5); A.rect(g, -22, -34, 44, 20, dim || '#1a1620', 3); A.rect(g, -28, 24, 56, 10, trim, 2)
  }
  A.register('machine:slot-machine', function (g, t) {
    box(g, t, '#8a2a3a', '#d8ad39'); if (t.broken) return
    var sp = (t.anim || 0) > 0
    for (var i = 0; i < 3; i++) { A.rect(g, -19 + i * 13, -31, 11, 14, '#f4efe0', 2); var sy = sp ? Math.sin((t.time || 0) * 30 + i) * 4 : 0; A.ball(g, -13.5 + i * 13, -24 + sy, 3.5, 3.5, ['#c23a45', '#e2b93a', '#4a9a5a'][i]) }
    A.ball(g, 0, 2, 9, 9, '#e2b93a'); A.rect(g, 30, -22, 5, 26, '#c9ccd0', 2); A.ball(g, 33, -24, 6, 6, '#c23a45')
  })
  A.register('machine:fortune-machine', function (g, t) {
    box(g, t, '#4a3a7a', '#d8ad39'); if (t.broken) return
    A.ball(g, 0, -22, 14, 14, '#8ad0e8'); A.glow(g, 0, -22, 26, '#b8e8ff', .35 + Math.sin((t.time || 0) * 3) * .15); A.rect(g, -10, 2, 20, 14, '#e8dcc0', 2); A.line(g, '#6b2f3a', 2, [-6, 7, 6, 7])
  })
  A.register('machine:blood-donation-machine', function (g, t) {
    box(g, t, '#d6d2c8', '#a03038', '#2a1620'); if (t.broken) return
    A.heart(g, 0, -22, 12, 12, '#c23a45'); A.rect(g, -6, 2, 12, 8, '#a03038', 2); A.line(g, '#8a8f95', 3, [18, -4, 30, 10]); A.ball(g, 30, 12, 3, 3, '#c23a45')
  })
  A.register('machine:restock-box', function (g, t) {
    if (t.broken) { A.rect(g, -26, 0, 52, 30, '#5a4028', 3); return }
    A.ball(g, 0, 34, 28, 6, 'rgba(0,0,0,.28)'); A.rect(g, -28, -10, 56, 42, '#8a6a3a', 3); A.rect(g, -30, -16, 60, 10, '#a8854a', 3); A.line(g, '#4a3118', 3, [-28, 4, 28, 4]); A.line(g, '#e2b93a', 4, [-8, 22, -8, 12, -14, 16]); A.line(g, '#e2b93a', 4, [8, 12, 8, 22, 14, 18])
  })
  A.register('machine:confessional', function (g, t) {
    if (t.broken) { A.rect(g, -28, 0, 56, 34, '#2a1c14', 3); return }
    A.ball(g, 0, 38, 32, 7, 'rgba(0,0,0,.28)'); A.rect(g, -32, -46, 64, 84, '#4a3220', 4); A.rect(g, -20, -30, 40, 62, '#1a1210', 3); A.line(g, '#d8ad39', 4, [0, -42, 0, -32]); A.line(g, '#d8ad39', 4, [-5, -38, 5, -38])
    for (var i = 0; i < 4; i++) A.line(g, '#6a4a30', 2, [-18 + i * 11, -26, -18 + i * 11, -8])
    A.glow(g, 0, 0, 40, '#ffe9b0', .15 + (t.anim || 0) * .3)
  })

  // ---- engine-facing helpers ------------------------------------------------
  IS.pickupSprite = function (p) {
    var k = p.kind, v = p.variant, n
    if (k === 'coin') n = 'pk:coin-' + (COINS[v] ? v : 'penny')
    else if (k === 'heart') n = 'pk:heart-' + (v === 'full' || !v ? 'red' : HEARTS[v] ? v : 'red')
    else if (k === 'soul' || k === 'black') n = 'pk:heart-' + k
    else if (k === 'key') n = v === 'golden' ? 'pk:key-golden' : 'pk:key'
    else if (k === 'bomb') n = v === 'golden' ? 'pk:bomb-golden' : 'pk:bomb'
    else if (k === 'battery') n = 'pk:battery-' + (v === 'micro' || v === 'mega' ? v : 'normal')
    else if (k === 'card') n = 'pk:card'
    else if (k === 'chest') n = 'pk:chest-' + (CHESTS[v] ? v : 'normal') + (p.opened ? '-open' : '')
    else if (k === 'sack') n = v === 'black' ? 'pk:sack-black' : 'pk:sack'
    else if (k === 'item') return 'item-pedestal'
    else n = k
    return IS.sprite && IS.sprite(n) ? n : 'coin'
  }
  function tag (g, text, x, y, col) { g.save(); g.font = 'bold 18px monospace'; g.textAlign = 'center'; var w = g.measureText(text).width + 10; g.fillStyle = 'rgba(14,9,7,.78)'; g.fillRect(x - w / 2, y - 12, w, 20); g.fillStyle = col; g.fillText(text, x, y + 4); g.restore() }
  function hearts (g, n, x, y) { for (var i = 0; i < Math.ceil(n / 2); i++) IS.drawSprite(g, 'pk:heart-' + (i * 2 + 1 > n ? 'half' : 'red'), x + (i - (Math.ceil(n / 2) - 1) / 2) * 18, y, 18, { time: 0 }) }
  IS.drawPickupExtras = function (g, p, run) {
    if (p.taken || p.removed) return
    var y = p.y + 34
    if (p.price > 0 && p.priceType !== 'free' && !p.sold) {
      var pl = run && run.player, c = pl && IS.priceOf ? IS.priceOf(pl, p) : null
      if (c && c.type === 'heart') hearts(g, c.amount, p.x, y)
      else if (c && c.type === 'soul') tag(g, c.amount + ' soul', p.x, y, '#8ad0e8')
      else if (c) tag(g, c.amount + 'c', p.x, y, c.ok ? '#f0d370' : '#c88a7a')
      else if (p.priceType === 'heart') hearts(g, p.price, p.x, y)
      else tag(g, p.price + 'c', p.x, y, '#f0d370')
    }
    if (p.kind === 'chest' && p.revealed && p.contents && p.contents.length && !p.opened) {
      var e = p.contents[0], nm = e.kind === 'item' ? 'item-pedestal' : IS.pickupSprite({ kind: e.kind, variant: e.variant })
      g.save(); g.globalAlpha = .85; IS.drawSprite(g, nm, p.x, p.y - 44, 22, { time: 0 }); g.restore()
    }
  }
  IS.drawMachines = function (g, room) {
    var ms = room && room.machines; if (!ms) return
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i]; if (m.gone) continue
      IS.drawSprite(g, 'machine:' + m.type, m.x, m.y - 4, 84, { time: (IS.state && IS.state.time) || 0, broken: m.broken, anim: m.anim })
      if (m.type === 'restock-box' && !m.broken) tag(g, '5c', m.x, m.y + 48, '#f0d370')
    }
  }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
