;(function (IS) {
  'use strict'
  /*
   * Bespoke boss painters, part 1 (Basement through Caves). Every boss id in
   * IS.bosses gets its own composition; shared builders (worm, spider,
   * horseman, Gurdy...) are parameterised so each member of a family differs in
   * palette, silhouette and props. All painters draw in 100-unit space via
   * IS.art (art-kit.js) and react to charge / hp01 / hurt / time.
   */
  var A = IS.art, sh = A.sh, mix = A.mix, al = A.al, TAU = Math.PI * 2
  var reg = A.register
  var B = IS.bossArt = IS.bossArt || {}
  B.reg = reg

  /* ---- Monstro family ------------------------------------------------ */
  function monstro (c, o) {
    o = o || {}
    return function (g, t) {
      var br = Math.sin(A.T * 2.4), ch = A.ch
      g.save(); g.translate(0, 8); g.scale(1 + ch * .1 + br * .015, 1 - ch * .1 - br * .02)
      A.blob(g, 0, 0, 47, 40, c, { n: 13, wob: .06, seed: o.seed || 2 })
      A.veins(g, 0, -4, 42, sh(c, -.4), 8, o.seed || 3)
      A.warts(g, 0, 0, 40, 7, sh(c, .06), 9)
      if (o.horns) { A.horn(g, -26, -28, -2.2, 24, 12, '#d8c9a8', -.4); A.horn(g, 26, -28, -.94, 24, 12, '#d8c9a8', .4) }
      A.eye(g, -17, -22, 8.5, { lid: .28, lc: sh(c, -.08), col: o.eye || '#7a5a3a' })
      A.eye(g, 17, -22, 8.5, { lid: .28, lc: sh(c, -.08), col: o.eye || '#7a5a3a' })
      A.brow(g, -27, -33, -9, -27, sh(c, -.55), 3.6); A.brow(g, 27, -33, 9, -27, sh(c, -.55), 3.6)
      if (o.third) A.eye(g, 0, -34, 6, { col: '#d23a32', lid: .1, lc: sh(c, -.1) })
      A.mouth(g, 0, 10, 37, 9 + ch * 17, { n: 9, tl: .55 })
      A.line(g, sh(c, -.5), 2.4, [-37, 8, -41, 4]); A.line(g, sh(c, -.5), 2.4, [37, 8, 41, 4])
      g.restore()
    }
  }
  reg('monstro', monstro('#cfa496'))
  reg('monstro-ii', monstro('#c25a5c', { horns: true, third: true, eye: '#d8a030', seed: 6 }))

  /* ---- Larry Jr. ----------------------------------------------------- */
  function wormHead (c, o) {
    o = o || {}
    return function (g, t) {
      var ch = A.ch, br = Math.sin(A.T * 3) * 1.5
      A.ball(g, 0, 22 + br * .3, 22, 18, sh(c, -.12))
      A.line(g, sh(c, -.45), 2, [-16, 24, 16, 24]); A.line(g, sh(c, -.45), 2, [-12, 31, 12, 31])
      A.ball(g, 0, -2 + br, 35, 31, c)
      for (var i = -1; i <= 1; i++) A.line(g, al(sh(c, -.5), .55), 2, [i * 14 - 4, -22 + br, i * 15, -10 + br])
      A.eye(g, -14, -9 + br, 9.5, { lid: .2, lc: sh(c, -.1), col: o.eye || '#c89a2a', red: !!o.red })
      A.eye(g, 14, -9 + br, 9.5, { lid: .2, lc: sh(c, -.1), col: o.eye || '#c89a2a', red: !!o.red })
      A.brow(g, -25, -22 + br, -6, -17 + br, sh(c, -.6), 3.4); A.brow(g, 25, -22 + br, 6, -17 + br, sh(c, -.6), 3.4)
      if (o.skull) { A.ball(g, 0, 4 + br, 33, 29, c); A.flat(g, -13, -4 + br, 9, 10, '#120808'); A.flat(g, 13, -4 + br, 9, 10, '#120808'); A.dot(g, -13, -3 + br, 2.4, '#ff9a6a', '#d84a2a'); A.dot(g, 13, -3 + br, 2.4, '#ff9a6a', '#d84a2a') }
      if (o.crown) A.crown(g, 0, -28 + br, 15, 15, '#e0b83c')
      A.mouth(g, 0, 13 + br, o.mw || 15, 3 + ch * 10 + (o.gape || 0), { n: o.fangs ? 7 : 5, tl: .5 })
      if (o.fangs) { A.poly(g, [-9, 8 + br, -5, 8 + br, -7, 22 + br], '#efe6d0'); A.poly(g, [9, 8 + br, 5, 8 + br, 7, 22 + br], '#efe6d0') }
      A.warts(g, 0, -4, 30, 4, sh(c, .1), 4)
    }
  }
  /* Segmented bosses (see BESPOKE worms in boss.js): the boss is only the head and
   its body is a chain of separate 'worm-segment' enemies tinted with the same colour. */
  reg('larry-jr', wormHead('#7e9144', { eye: '#d8c030' }))
  reg('chub', wormHead('#cfa57d', { fangs: true, mw: 19, gape: 2, eye: '#8a3a2a' }))
  reg('the-hollow', wormHead('#9a3f3f', { skull: true }))
  reg('carrion-queen', wormHead('#7e6a50', { crown: true, fangs: true, mw: 18, eye: '#e8d84a' }))
  reg('wormwood', wormHead('#7a5a3a', { eye: '#c8d048', red: true, gape: 1 }))
  function segment (c0) {
    return function (g, t) {
      var c = A.tint(t, c0), pulse = 1 + Math.sin(A.T * 5 + (t.frame | 0) * .7) * .04
      A.ball(g, 0, 0, 43 * pulse, 41 * pulse, c)
      g.save(); g.beginPath(); g.ellipse(0, 0, 43 * pulse, 41 * pulse, 0, 0, TAU); g.clip()
      for (var i = -1; i <= 1; i++) A.line(g, al(sh(c, -.55), .6), 2.4, [i * 18 - 9, -41, i * 18 + 5, 0, i * 18 - 9, 41])
      g.restore()
      A.flat(g, -10, -14, 9, 5, al(sh(c, .5), .55), -.5)
    }
  }
  /* kept as a plain override so both Larry's body and other worms look right */
  reg('worm-segment', segment('#7e9144'), { noWounds: true })

  /* ---- Duke of Flies ------------------------------------------------- */
  reg('the-duke-of-flies', function (g, t) {
    var c = '#cdb468', ch = A.ch, br = Math.sin(A.T * 2.2)
    A.wing(g, -28, -14, 30, -2.5, '#dfe6ea', { feather: true, dir: 1, flap: Math.sin(A.T * 30) * .12 })
    A.wing(g, 28, -14, 30, -.64, '#dfe6ea', { feather: true, dir: 1, flap: -Math.sin(A.T * 30) * .12 })
    A.blob(g, 0, 8 + br, 41, 38 + br, c, { n: 12, wob: .045, seed: 5 })
    A.line(g, al(sh(c, -.5), .6), 2, [0, -26 + br, -3, 8, 0, 44])
    A.veins(g, 0, 10, 38, '#8a7440', 6, 8); A.warts(g, 0, 10, 34, 6, '#e2cc82', 3)
    A.ball(g, 0, -17 + br, 21, 17, sh(c, .08))
    A.eye(g, -9, -19 + br, 6.5, { lid: .45, lc: sh(c, -.1), col: '#a08838' }); A.eye(g, 9, -19 + br, 6.5, { lid: .45, lc: sh(c, -.1), col: '#a08838' })
    A.mouth(g, 0, -7 + br, 12, 3 + ch * 9, { n: 4, tl: .5, col: '#3a2a10' })
    A.stitches(g, -22, 24, 22, 26, 7, '#6a5420', 3)
    A.flies(g, 7, 54, 4.5, 2.2, 4)
    if (ch > .3) A.flies(g, 4, 30 + ch * 18, 4, -3.5, 4)
  })

  /* ---- Gemini, Steven ------------------------------------------------ */
  function twin (t) { return /suture/.test(t.role || '') || +t.variant === 1 }
  reg('gemini', function (g, t) {
    var s2 = twin(t), ch = A.ch, br = Math.sin(A.T * 3 + (s2 ? 1 : 0)), d = s2 ? -1 : 1
    var c = s2 ? '#e0d0c0' : '#c4766a'
    A.tent(g, -d * 20, 22, s2 ? 0 : Math.PI, 36, 6, '#b8545e', { amp: 4, taper: .2, hi: true })
    A.ball(g, 0, 22, 22, 20, sh(c, -.08)); A.ball(g, -17, 30, 7, 6, c); A.ball(g, 17, 30, 7, 6, c)
    A.ball(g, -22, 18, 6, 9, c, { rot: .4 }); A.ball(g, 22, 18, 6, 9, c, { rot: -.4 })
    A.ball(g, 0, -8 + br, 34, 31, c)
    if (s2) {
      A.eye(g, -12, -9 + br, 7.5, { sc: '#dde0d8', col: '#2a2a3a', lid: .15, lc: c, pu: 1.6 }); A.eye(g, 12, -9 + br, 7.5, { sc: '#dde0d8', col: '#2a2a3a', lid: .15, lc: c, pu: 1.6 })
      A.stitches(g, -30, -26 + br, 24, -26 + br, 7, '#3a2a30', 4); A.stitches(g, -11, 9 + br, 11, 9 + br, 5, '#3a2a30', 3.4)
      A.tears(g, -12, -3 + br, 14, '#8fc4de'); A.tears(g, 12, -3 + br, 14, '#8fc4de')
      if (ch > .1) A.mouth(g, 0, 11 + br, 8, 2 + ch * 8, { n: 0, tongue: false })
    } else {
      A.flat(g, -18, -18 + br, 11, 8, al('#5a3a8a', .5), -.5); A.flat(g, 16, 2 + br, 9, 6, al('#5a3a8a', .45), .4)
      A.eye(g, -12, -9 + br, 7.5, { col: '#6a3a2a', lid: .35, lc: c, red: true }); A.eye(g, 12, -9 + br, 7.5, { col: '#6a3a2a', lid: .35, lc: c, red: true })
      A.brow(g, -22, -22 + br, -6, -17 + br, sh(c, -.6), 3.2); A.brow(g, 22, -22 + br, 6, -17 + br, sh(c, -.6), 3.2)
      A.mouth(g, 0, 12 + br, 13, 4 + ch * 12, { n: 4, tl: .4 })
    }
    A.flat(g, 0, -34 + br, 3, 4, sh(c, -.3)); A.line(g, sh(c, -.55), 1.6, [0, -38 + br, 3, -42 + br])
  }, { R: 28 })
  reg('steven', function (g, t) {
    var c = '#b4a8c8', ch = A.ch, br = Math.sin(A.T * 2.8)
    A.ball(g, 22, 4 + br, 24, 22, sh(c, -.1))
    A.eye(g, 18, 0 + br, 5.5, { col: '#2a2030', lid: .3, lc: c }); A.eye(g, 32, 0 + br, 5.5, { col: '#2a2030', lid: .3, lc: c })
    A.mouth(g, 26, 14 + br, 7, 2 + ch * 6, { n: 3, tl: .5 })
    A.ball(g, -8, -4 + br, 36, 33, c)
    A.eye(g, -22, -9 + br, 7, { col: '#2a2030', lid: .25, lc: c, red: true }); A.eye(g, -2, -9 + br, 7, { col: '#2a2030', lid: .25, lc: c, red: true })
    A.brow(g, -32, -20 + br, -17, -16 + br, '#2a2030', 3); A.brow(g, 8, -20 + br, -8, -16 + br, '#2a2030', 3)
    A.mouth(g, -12, 14 + br, 15, 4 + ch * 12, { n: 5, tl: .45 })
    A.stitches(g, -30, -30 + br, 4, -26 + br, 7, '#2a2030', 3.4)
    A.horn(g, -28, -28 + br, -2.1, 14, 7, '#cfc6a6', -.3); A.horn(g, 4, -30 + br, -1.1, 14, 7, '#cfc6a6', .3)
  })

  /* ---- Dingle, Dangle ------------------------------------------------ */
  function demonHead (c, o) {
    return function (g, t) {
      var ch = A.ch, br = Math.sin(A.T * 2.5)
      if (o.hang) for (var i = -2; i <= 2; i++) A.tent(g, i * 12, 18, Math.PI / 2 + i * .12, 38 - Math.abs(i) * 5, 6, sh(c, -.15), { amp: 5, ph: i, taper: .6 })
      A.horn(g, -24, -22, -2.3, 30, 14, '#cdbf9a', -.45); A.horn(g, 24, -22, -.84, 30, 14, '#cdbf9a', .45)
      A.ball(g, 0, 0 + br, 38, 36, c)
      A.warts(g, 0, 0, 33, 5, sh(c, -.1), 12)
      A.eye(g, -16, -3 + br, 7.5, { col: o.eye, lid: .3, lc: c, red: true }); A.eye(g, 16, -3 + br, 7.5, { col: o.eye, lid: .3, lc: c, red: true })
      A.brow(g, -28, -14 + br, -8, -8 + br, sh(c, -.6), 3.4); A.brow(g, 28, -14 + br, 8, -8 + br, sh(c, -.6), 3.4)
      var er = 6 + ch * 4; A.glow(g, 0, -22 + br, 16 + ch * 14, o.third, .35 + ch * .4)
      A.eye(g, 0, -22 + br, er, { sc: '#f0d0c0', col: o.third, hot: '#ffd070', lid: 0 })
      A.mouth(g, 0, 17 + br, 18, 6 + ch * 10, { n: 5, tl: .55 })
    }
  }
  reg('dingle', demonHead('#9a7a66', { eye: '#c8a038', third: '#d8402a' }))
  reg('dangle', demonHead('#7a8ca4', { eye: '#e8d870', third: '#78d4e8', hang: true }))

  /* ---- Blighted Ovum ------------------------------------------------- */
  reg('blighted-ovum', function (g, t) {
    var c = '#c8c0b8', ch = A.ch, br = Math.sin(A.T * 2)
    A.ball(g, 0, 2, 44 + br, 42 - br, '#d6cfc8')
    A.veins(g, 0, 2, 44, '#b05a62', 9, 21)
    A.flat(g, -22, 12, 9, 6, al('#6a7a4a', .5), .5); A.flat(g, 18, -18, 7, 5, al('#6a7a4a', .45), -.4)
    A.ball(g, 4, 8, 26, 22, '#c98c90', { rot: .3 })
    A.ball(g, -16, 22, 8, 6, '#c98c90'); A.ball(g, 14, 26, 8, 6, '#c98c90')
    A.eye(g, -6, 2, 10, { sc: '#e8d8d0', col: '#3a2a4a', lid: .15, lc: '#c98c90', pu: 1.4 })
    A.eye(g, 16, 6, 5, { sc: '#e8d8d0', col: '#3a2a4a', lid: .4, lc: '#c98c90' })
    A.mouth(g, 4, 20, 6, 1.5 + ch * 7, { n: 0, tongue: false })
    A.tent(g, 22, 22, .6, 30, 5, '#b85a64', { amp: 5, taper: .2 })
    A.flat(g, -22, -24, 9, 4, al('#ffffff', .5), -.6)
  })

  /* ---- The Haunt ----------------------------------------------------- */
  reg('the-haunt', function (g, t) {
    var c = '#a7b2c4', ch = A.ch, bob = Math.sin(A.T * 2) * 3
    g.save(); g.translate(0, bob)
    for (var i = -2; i <= 2; i++) A.tent(g, i * 12, 22, Math.PI / 2 + i * .1, 34 - Math.abs(i) * 3, 12, sh(c, -.1), { amp: 6, ph: i, taper: .85 })
    A.ball(g, 0, -4, 40, 36, c)
    A.flat(g, 0, 22, 30, 6, al('#586278', .35))
    A.poly(g, [-26, -14, -8, -6, -26, 4], '#10080e'); A.poly(g, [26, -14, 8, -6, 26, 4], '#10080e')
    A.dot(g, -17, -6, 3, '#ffd870', '#e8a830'); A.dot(g, 17, -6, 3, '#ffd870', '#e8a830')
    A.mouth(g, 0, 15, 20, 7 + ch * 12, { n: 6, tl: .5, col: '#10080e', tongue: false })
    A.tent(g, 0, 18, Math.PI / 2, 22 + ch * 10, 6, '#c4505e', { amp: 3, taper: .3 })
    g.restore()
  })

  /* ---- Little Horn --------------------------------------------------- */
  reg('little-horn', function (g, t) {
    var c = '#b8998a', ch = A.ch, br = Math.sin(A.T * 4)
    A.ball(g, 0, 24, 20, 17, sh(c, -.1))
    A.ball(g, -22, 8 + br, 7, 12, c, { rot: .5 }); A.ball(g, 22, 8 + br, 7, 12, c, { rot: -.5 })
    var bs = 1 + ch * .5
    A.line(g, '#73502a', 2.4, [10, -30, 14, -44])
    A.ball(g, 8, -24, 11 * bs, 11 * bs, '#2c2c30'); A.flat(g, 5, -27, 3, 2, al('#fff', .5), -.5)
    A.glow(g, 14, -45, 8 + 6 * Math.sin(A.T * 18), '#ffa030', .8)
    A.ball(g, 0, 4, 31, 29, c)
    A.horn(g, 0, -22, -1.57, 26, 14, '#e2d4b0', .25)
    A.eye(g, -11, 0, 6.5, { sc: '#ece0cc', col: '#2a1a14', lid: .35, lc: c, pu: 1.3 }); A.eye(g, 11, 0, 6.5, { sc: '#ece0cc', col: '#2a1a14', lid: .35, lc: c, pu: 1.3 })
    A.brow(g, -18, -9, -4, -5, '#3a2a24', 3); A.brow(g, 18, -9, 4, -5, '#3a2a24', 3)
    A.mouth(g, 0, 15, 12, 3 + ch * 8, { n: 4, tl: .6 })
  }, { R: 26 })

  /* ---- Baby Plum ----------------------------------------------------- */
  reg('baby-plum', function (g, t) {
    var c = '#c98aa8', ch = A.ch, br = Math.sin(A.T * 3)
    A.ball(g, 0, 26, 25, 18, '#a8688a')
    A.ball(g, -22, 24, 8, 10, c, { rot: .5 }); A.ball(g, 22, 24, 8, 10, c, { rot: -.5 })
    A.ball(g, 0, -4 + br, 38, 34, c)
    A.line(g, '#4a2a3a', 3, [-4, -38 + br, 0, -46 + br, 6, -38 + br]); A.line(g, '#4a2a3a', 3, [4, -38 + br, 10, -44 + br])
    A.poly(g, [0, -36 + br, 12, -42 + br, 14, -33 + br], '#6aa84a')
    A.blush(g, -24, 6 + br, 8, '#d03a5a'); A.blush(g, 24, 6 + br, 8, '#d03a5a')
    A.eye(g, -13, -8 + br, 8, { sc: '#f0e2e6', col: '#3a2a4a', lid: .15, lc: c, pu: 1.5 }); A.eye(g, 13, -8 + br, 8, { sc: '#f0e2e6', col: '#3a2a4a', lid: .15, lc: c, pu: 1.5 })
    A.tears(g, -13, 0 + br, 12); A.tears(g, 13, 0 + br, 12)
    A.mouth(g, 0, 14 + br, 13, 6 + ch * 11, { n: 0, col: '#4a1a2a', tn: '#e0707e' })
    A.drip(g, 6, 22 + br, 10, al('#bfe0f0', .8), 1.8)
  }, { R: 28 })

  /* ---- Horsemen ------------------------------------------------------ */
  function horseman (o) {
    return function (g, t) {
      var ch = A.ch, br = Math.sin(A.T * 2.6), c = o.coat
      if (o.aura) A.glow(g, 0, 0, 62, o.eye, .35)
      for (var i = 0; i < 4; i++) { var lx = -18 + i * 14 + (i % 2 ? 2 : -2), sw = Math.sin(A.T * 5 + i * 1.6) * 4; A.leg(g, lx, 26, lx + sw * .5, 38, lx + sw, 47, 6.5, sh(c, -.2)) }
      A.ball(g, 6, 14, 33, 20, c)
      A.line(g, o.mane, 3, [-14, -4, -8, 2, -2, -4]); A.tent(g, 36, 12, .3, 22, 7, o.mane, { amp: 6, taper: .8 })
      A.poly(g, [-14, 4, -36, -10, -50, 10, -41, 20, -22, 22], sh(c, .02))
      A.poly(g, [-14, 4, -22, -22, -32, -26, -34, -12, -36, -10], sh(c, -.05))
      A.poly(g, [-28, -24, -31, -37, -22, -27], c); A.poly(g, [-18, -26, -17, -39, -11, -26], c)
      A.line(g, o.mane, 3.4, [-14, -22, -4, -12, 2, 0])
      A.dot(g, -34, -4, 3.6, o.eye, o.eye)
      A.flat(g, -47, 12, 2, 2, '#10080e'); A.flat(g, -43, 15, 2, 2, '#10080e')
      A.mouth(g, -34, 17, 10 + ch * 2, 1.5 + ch * 5, { n: 5, tl: .5, col: '#10080e', tongue: false })
      /* rider */
      A.poly(g, [-2, -8, 28, -8, 34, 8, -6, 8], o.cloak)
      A.poly(g, [4, -10, 22, -10, 28, -30, 10, -34], sh(o.cloak, .05))
      A.ball(g, 14, -36 + br * .5, 11, 12, o.cloak)
      A.skull(g, 14, -35 + br * .5, 8, '#e0d6bc', { eyec: o.eye })
      A.line(g, sh(o.cloak, -.4), 2, [10, -30, 18, -30])
      o.emblem(g, ch)
    }
  }
  function emblemScales (g, ch) { A.line(g, '#6a5a2a', 2.4, [34, -46, 34, -6]); A.line(g, '#caa84a', 2.4, [24, -42, 44, -42]); for (var i = -1; i <= 1; i += 2) { A.line(g, '#caa84a', 1.2, [34 + i * 10, -42, 34 + i * 12, -32]); A.ball(g, 34 + i * 12, -30 + ch * -4, 6, 2.5, '#d8bc54') } }
  function emblemBow (g, ch) { g.strokeStyle = '#4a3820'; g.lineWidth = 3; g.beginPath(); g.arc(36, -26, 22, -1.2, 1.2); g.stroke(); A.line(g, '#d8d0b0', 1, [36 + Math.cos(1.2) * 22, -26 + Math.sin(1.2) * 22, 36 - ch * 10, -26, 36 + Math.cos(-1.2) * 22, -26 + Math.sin(-1.2) * 22]) }
  function emblemSword (g, ch) { A.line(g, '#2a2024', 5, [34, -6, 34, -50]); A.line(g, '#cfd0d4', 3, [34, -6, 34, -52 - ch * 6]); A.line(g, '#8a6a2a', 3.4, [28, -10, 40, -10]) }
  function emblemScythe (g, ch) { A.line(g, '#4a3a2a', 3, [32, 0, 36, -52]); g.strokeStyle = '#d0d2d8'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(36, -52); g.quadraticCurveTo(16 - ch * 6, -66, 6, -44); g.stroke() }
  reg('famine', horseman({ coat: '#8d8250', mane: '#2a2418', cloak: '#3a3524', eye: '#e8d050', emblem: emblemScales }))
  reg('ultra-famine', horseman({ coat: '#b3a24a', mane: '#3a3018', cloak: '#4a4020', eye: '#fff070', emblem: emblemScales, aura: true }))
  reg('ultra-pestilence', horseman({ coat: '#7fa04a', mane: '#26361a', cloak: '#2a3a20', eye: '#c8ff60', emblem: emblemBow, aura: true }))
  reg('ultra-war', horseman({ coat: '#a63a34', mane: '#2a1010', cloak: '#3a1414', eye: '#ff7040', emblem: emblemSword, aura: true }))
  reg('ultra-death', horseman({ coat: '#cfc9b6', mane: '#1a1a1e', cloak: '#18181c', eye: '#a0e0ff', emblem: emblemScythe, aura: true }))

  /* ---- Gurdy family -------------------------------------------------- */
  function gurdy (c, o) {
    o = o || {}
    return function (g, t) {
      var ch = A.ch, br = Math.sin(A.T * 2.4), k = o.k || 1
      g.save(); g.scale(k, k)
      A.ball(g, -34, 20, 11, 15, c, { rot: .3 }); A.ball(g, 34, 20, 11, 15, c, { rot: -.3 })
      if (o.spikes) { A.spikes(g, -34, 20, 11, 6, 7, '#d8c9a8', 0); A.spikes(g, 34, 20, 11, 6, 7, '#d8c9a8', 1) }
      A.blob(g, 0, 2, 44, 40 + br, c, { n: 12, wob: .05, seed: o.seed || 8 })
      A.warts(g, 0, 0, 38, 8, sh(c, -.12), 5)
      if (o.spikes) { for (var i = -2; i <= 2; i++) A.horn(g, i * 14, -34 + Math.abs(i) * 3, -1.57 + i * .25, 18, 9, '#d8c9a8', i * .08) }
      A.eye(g, -17, -13, 6.5, { col: '#6a3a2a', lid: .3, lc: sh(c, -.08), red: true }); A.eye(g, 17, -13, 6.5, { col: '#6a3a2a', lid: .3, lc: sh(c, -.08), red: true })
      A.flat(g, -17, -5, 9, 3, al('#3a1a2a', .35)); A.flat(g, 17, -5, 9, 3, al('#3a1a2a', .35))
      A.flat(g, -4, -3, 2, 2.4, '#3a1a22'); A.flat(g, 4, -3, 2, 2.4, '#3a1a22')
      A.mouth(g, 0, 15, 27, 7 + ch * 16, { n: 8, tl: .5 })
      A.stitches(g, -35, 3, -26, 11, 3, '#3a1a22', 3); A.stitches(g, 35, 3, 26, 11, 3, '#3a1a22', 3)
      if (o.vein) A.flat(g, 0, -28, 4, 7 + Math.sin(A.T * 8) * 2, '#a02a34')
      g.restore()
    }
  }
  reg('gurdy-jr', gurdy('#b6786a', { k: .8, vein: true }))
  reg('gurdy', gurdy('#9a8492', { k: 1 }))
  reg('mama-gurdy', gurdy('#8a6a7e', { k: 1.08, spikes: true, seed: 3 }))

  /* ---- Fistula ------------------------------------------------------- */
  reg('fistula', function (g, t) {
    var c = '#c8686e', ch = A.ch, br = Math.sin(A.T * 3)
    A.blob(g, 0, 0, 43 + br, 42 - br, c, { n: 11, wob: .08, seed: 12, sp: 2.4 })
    A.veins(g, 0, 0, 42, '#7a2430', 8, 17)
    for (var i = 0; i < 6; i++) {
      var a = i / 6 * TAU + .4, x = Math.cos(a) * 26, y = Math.sin(a) * 24
      A.flat(g, x, y, 8, 6.5, sh(c, -.55)); A.flat(g, x, y, 5.5, 4.2, '#2a0a10'); A.flat(g, x, y - 1, 3, 2, '#d25a4a')
    }
    A.eye(g, 0, -4, 14 + ch * 3, { sc: '#f0e2d8', col: '#c8a030', lid: .1, lc: c, red: true, pu: 1.3 })
    A.drip(g, -14, 30, 12, '#d8a8a0', 2.2); A.drip(g, 20, 28, 10, '#d8a8a0', 2)
  })

  /* ---- Spiders ------------------------------------------------------- */
  function spider (c, o) {
    return function (g, t) {
      var ch = A.ch, wk = A.T * (3 + ch * 3)
      for (var q = -1; q <= 1; q += 2) for (var i = 0; i < 4; i++) {
        var ph = Math.sin(wk + i * 1.3 + (q > 0 ? 1.6 : 0)) * 4, yy = -14 + i * 11
        A.leg(g, q * 12, yy * .6, q * (36 + (i === 1 || i === 2 ? 6 : 0)), yy - 14 + ph, q * (52 - i * 2), yy + 12 + ph, o.lw, sh(c, -.15))
      }
      A.ball(g, 0, 14, o.ab[0], o.ab[1], c)
      o.mark(g, c)
      A.ball(g, 0, -16, 19, 16, sh(c, .05))
      if (o.face) { A.eye(g, -8, -18, 6, { col: '#6a3a2a', lid: .25, lc: c }); A.eye(g, 8, -18, 6, { col: '#6a3a2a', lid: .25, lc: c }); A.mouth(g, 0, -6, 9, 3 + ch * 8, { n: 4, tl: .6 }) }
      else {
        var hot = al('#ff3a2a', .5 + ch * .5)
        ;[[-5, -22, 3.6], [5, -22, 3.6], [-11, -17, 2.4], [11, -17, 2.4], [-3, -15, 1.8], [3, -15, 1.8]].forEach(function (e) { A.dot(g, e[0], e[1], e[2], ch > .2 ? '#ff5a3a' : '#d83a3a', o.glow); g.fillStyle = hot })
        A.poly(g, [-7, -6, -3, -6, -5, 2 + ch * 3], '#e6dcc0'); A.poly(g, [7, -6, 3, -6, 5, 2 + ch * 3], '#e6dcc0')
      }
    }
  }
  reg('widow', spider('#3a2c36', { lw: 3.4, ab: [28, 30], glow: '#d83a3a', mark: function (g) { A.poly(g, [-7, 6, 7, 6, 0, 16], '#c0302c'); A.poly(g, [-7, 28, 7, 28, 0, 16], '#c0302c') } }))
  reg('reap-creep', spider('#d8a88e', { lw: 5, ab: [32, 28], face: true, mark: function (g, c) { A.veins(g, 0, 14, 28, '#9a4a54', 6, 31); A.warts(g, 0, 14, 24, 5, sh(c, .06), 2) } }))

  /* ---- Worms (Pin, Chub family, Frail, Hollow, Scourge...) ----------- */
  function worm (c, o) {
    return function (g, t) {
      var ch = A.ch, N = o.n || 6, hx = o.horiz ? -28 : 0, hy = o.horiz ? 0 : -26
      for (var i = N; i >= 1; i--) {
        var f = i / N, x, y, r = (o.r || 24) * (1 - f * .45)
        if (o.horiz) { x = hx + 22 + i * 14; y = Math.sin(A.T * 3 + i * .9) * 8 * f + 4 } else { x = Math.sin(A.T * 2.6 + i * .8) * 14 * f; y = hy + 20 + i * 12 }
        A.ball(g, x, y, r, r * .92, sh(c, -f * .2))
        if (o.ribs) { A.line(g, al(o.ribs, .9), 2.4, [x - r * .8, y - 2, x, y + 4, x + r * .8, y - 2]) } else A.line(g, al(sh(c, -.55), .55), 2, [x - r * .7, y - r * .55, x - r * .75, y + r * .5])
        if (o.spikes) A.poly(g, [x - 5, y - r * .8, x + 5, y - r * .8, x, y - r * 1.4], o.spikes)
      }
      var hr = (o.hr || 26)
      A.ball(g, hx, hy, hr, hr * .94, c)
      if (o.crown) A.crown(g, hx, hy - hr * .8, 14, 14, '#e0b83c')
      if (o.skull) { A.skull(g, hx, hy, hr * .9, c, { eyec: o.eye }); return }
      A.eye(g, hx - hr * .42, hy - hr * .25, hr * .26, { col: o.eye || '#c8a02a', lid: .2, lc: c, red: !!o.red }); A.eye(g, hx + hr * .42, hy - hr * .25, hr * .26, { col: o.eye || '#c8a02a', lid: .2, lc: c, red: !!o.red })
      A.mouth(g, hx, hy + hr * .35, hr * (o.mw || .6), hr * (.12 + ch * .34 + (o.gape || 0)), { n: o.teeth || 6, tl: .6, tc: '#e4d6b4' })
      if (o.fangs) { A.poly(g, [hx - hr * .5, hy + hr * .2, hx - hr * .35, hy + hr * .2, hx - hr * .42, hy + hr * .75], '#efe6d0'); A.poly(g, [hx + hr * .5, hy + hr * .2, hx + hr * .35, hy + hr * .2, hx + hr * .42, hy + hr * .75], '#efe6d0') }
    }
  }
  reg('pin', worm('#a8826e', { n: 6, spikes: '#e2d4b0', eye: '#d83a32', hr: 24, gape: .08, fangs: true }))
  reg('c-h-a-d', worm('#9ab4c0', { n: 5, horiz: true, r: 23, hr: 30, eye: '#3a4a7a', mw: .55, gape: .1 }))
  reg('frail', worm('#d8ccb0', { n: 5, r: 20, hr: 24, ribs: '#6a5a44', skull: true, eye: '#d83a32' }))
  reg('the-scourge', worm('#c8b8a8', { n: 6, r: 22, hr: 26, spikes: '#8a2a30', skull: true, eye: '#ff5a3a', ribs: '#7a2028' }))

  /* ---- Rag Man ------------------------------------------------------- */
  function ragman (c, o) {
    o = o || {}
    return function (g, t) {
      var ch = A.ch, sway = Math.sin(A.T * 2.6) * 3
      for (var i = 0; i < 7; i++) A.tent(g, -30 + i * 10, 18, Math.PI / 2 + (i - 3) * .06, 34 + (i % 2) * 8, 11, sh(c, (i % 3 - 1) * .1), { amp: 5, ph: i, taper: .9 })
      A.poly(g, [-26, -4, 26, -4, 36, 30, 0, 36, -36, 30], c)
      A.line(g, sh(c, -.4), 2, [-24, 6, 24, 14]); A.line(g, sh(c, -.4), 2, [-30, 18, 28, 8])
      if (o.chains) { A.line(g, '#8a8a92', 3, [-30, 0, -10, 14, 10, 4, 30, 16]) }
      A.ball(g, -34, 12 + sway, 8, 12, '#d8c8b8', { rot: .4 }); A.ball(g, 34, 12 - sway, 8, 12, '#d8c8b8', { rot: -.4 })
      A.ball(g, sway * .4, -22, 27, 25, '#d8c8b8')
      A.line(g, c, 8, [-22, -30, 0, -38, 22, -30]); A.line(g, sh(c, .1), 5, [-26, -18, -28, -6])
      A.eye(g, -9 + sway * .4, -22, 6.5, { col: '#6a2a2a', lid: .15, lc: '#d8c8b8', pu: 1.4 })
      A.flat(g, 10 + sway * .4, -22, 6, 6, '#2a2a30'); A.flat(g, 10 + sway * .4, -22, 3.6, 3.6, '#6a6a76'); A.line(g, '#d8d0c0', 1, [7, -22, 13, -22])
      A.stitches(g, -14 + sway * .4, -8, 14 + sway * .4, -8, 6, '#2a1a20', 4 + ch * 3)
      if (ch > .15) A.mouth(g, sway * .4, -8, 12, 1 + ch * 6, { n: 0, tongue: false })
    }
  }
  reg('rag-man', ragman('#6c4a74'))
  reg('rag-mega', ragman('#a43a3c', { chains: true }))
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
