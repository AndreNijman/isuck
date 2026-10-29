;(function (IS) {
  'use strict'
  // ---------------------------------------------------------------------------
  // Enemy sprites. Everything is drawn procedurally and each recognisable enemy
  // gets its own silhouette and palette, in the spirit of its Isaac namesake but
  // never a copy. s is the sprite size (about 2.6 x the body radius); local
  // coordinates run -s/2..s/2. t carries time, hurt, charge (the windup swell,
  // 0..1), hp01, dir and variant (knights: facing; globins: collapsed). Anything
  // not drawn here falls back to the generic families at the bottom.
  // ---------------------------------------------------------------------------
  var TAU = Math.PI * 2
  function C (t, c) { return t.hurt ? '#f6f0e4' : c }
  function sh (c, a) { return IS.shade ? IS.shade(c, a) : c }
  function O (g, x, y, rx, ry, c) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, TAU); g.fill() }
  function L (g, c, w, p) { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke() }
  function Pg (g, c, p) { g.fillStyle = c; g.beginPath(); g.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill() }
  function eye (g, x, y, r, c, pc, dy) { O(g, x, y, r, r * 1.1, c); O(g, x, y + (dy || 0), r * .5, r * .6, pc || '#1a1214') }
  function cracks (g, s, t) { if ((t.hp01 == null ? 1 : t.hp01) < .45) { L(g, '#4a1a20', s * .03, [-s * .12, -s * .3, -s * .02, -s * .12, -s * .1, s * .02]); O(g, s * .14, s * .22, s * .03, s * .07, '#7a2229') } }
  function def (ids, fn) { ids.forEach(function (id) { IS.defineSprite(id, fn(id)); IS.spriteAnimated(id) }) }

  // --- humanoids ------------------------------------------------------------
  var GAPERS = {
    'gaper': { skin: '#d2bda6', sock: '#2b0f12', blood: '#a3202a' },
    'frowning-gaper': { skin: '#a9b0a8', sock: '#1d1216', blood: '#7d1b25', brow: true },
    'flaming-gaper': { skin: '#e0c7ae', sock: '#2b0f12', blood: '#a3202a', fire: true },
    'gusher': { skin: '#d79c95', sock: '#3a1216', blood: '#c2242c', splash: true },
    'blue-gaper': { skin: '#7d98a8', sock: '#161a22', blood: '#3c5262' },
    'poppy-gaper': { skin: '#e4cdb8', sock: '#2b0f12', blood: '#a3202a', fire: true }
  }
  function gaper (id) { var k = GAPERS[id]; return function (g, s, t) {
    var step = Math.sin(t.time * 11), b = Math.abs(step) * s * .02, skin = C(t, k.skin)
    L(g, sh(k.skin, -.4), s * .1, [-s * .09, s * .2, -s * .11 + step * s * .04, s * .41]); L(g, sh(k.skin, -.4), s * .1, [s * .09, s * .2, s * .11 - step * s * .04, s * .41])
    O(g, 0, s * .14 - b, s * .19, s * .23, C(t, sh(k.skin, -.2)))
    L(g, C(t, sh(k.skin, -.3)), s * .06, [-s * .17, s * .06 - b, -s * .27, s * .22 + step * s * .03]); L(g, C(t, sh(k.skin, -.3)), s * .06, [s * .17, s * .06 - b, s * .27, s * .22 - step * s * .03])
    O(g, 0, -s * .14 - b, s * .3, s * .32, skin)
    O(g, -s * .12, -s * .2 - b, s * .08, s * .1, k.sock); O(g, s * .12, -s * .2 - b, s * .08, s * .1, k.sock)
    L(g, k.blood, s * .035, [-s * .12, -s * .12 - b, -s * .13, s * .02 - b]); L(g, k.blood, s * .035, [s * .12, -s * .12 - b, s * .14, s * .0 - b])
    if (k.brow) { L(g, sh(k.skin, -.5), s * .04, [-s * .22, -s * .33 - b, -s * .04, -s * .26 - b]); L(g, sh(k.skin, -.5), s * .04, [s * .22, -s * .33 - b, s * .04, -s * .26 - b]) }
    var open = .1 + .07 * (t.charge || 0)
    O(g, 0, -s * .0 - b, s * .1, s * open + s * .05, '#20090c'); O(g, 0, s * .02 - b, s * .05, s * .035, '#7a2229')
    if (k.splash) { O(g, -s * .05, s * .1, s * .045, s * .07, '#c2242c'); O(g, s * .08, s * .14, s * .03, s * .05, '#c2242c') }
    if (k.fire) { O(g, 0, -s * .46 - b, s * .1, s * (.09 + .03 * Math.sin(t.time * 12)), '#e9822c'); O(g, 0, -s * .44 - b, s * .05, s * .06, '#f6d36a') }
    cracks(g, s, t)
  } }

  function fatty (id) { var big = /conjoined|bloated/.test(id), col = id === 'gutted-fatty' ? '#c3a1a0' : '#e2c2b0'; return function (g, s, t) {
    var wob = Math.sin(t.time * 4) * s * .015
    L(g, sh(col, -.4), s * .09, [-s * .12, s * .32, -s * .14, s * .44]); L(g, sh(col, -.4), s * .09, [s * .12, s * .32, s * .14, s * .44])
    O(g, 0, s * .1, s * .42, s * .36 + wob, C(t, col)); O(g, 0, s * .2, s * .3, s * .2, C(t, sh(col, .08)))
    if (id === 'gutted-fatty') { L(g, '#7b2a2f', s * .05, [-s * .2, s * .1, -s * .05, s * .25, s * .12, s * .12, s * .22, s * .28]) }
    O(g, big ? -s * .17 : 0, -s * .22, s * .2, s * .19, C(t, sh(col, .04)))
    if (big) O(g, s * .2, -s * .18, s * .17, s * .16, C(t, sh(col, .02)))
    var xs = big ? [-.23, -.11, .14, .26] : [-.08, .08]; xs.forEach(function (x) { O(g, s * x, -s * .24, s * .03, s * .04, '#1c1214') })
    O(g, big ? -s * .17 : 0, -s * .12, s * .06, s * .045, '#4a1a20')
    if (/fatty/.test(id) && id !== 'gutted-fatty') O(g, s * .1, s * .02, s * .03, s * .03, '#a56a64')
    cracks(g, s, t)
  } }

  // --- fliers ---------------------------------------------------------------
  var FLIES = {
    'fly': { body: '#2e2829', rx: .17, ry: .19, wing: .5, eye: '#c7a23a', span: .26, hy: -.1 },
    'attackfly': { body: '#4d5d6c', rx: .2, ry: .2, wing: .65, eye: '#e9e27a', span: .34, hy: -.08, sting: true },
    'pooter': { body: '#76804e', rx: .3, ry: .31, wing: .45, eye: '#b83c3c', span: .3, hy: -.2, belly: true },
    'super-pooter': { body: '#5f7d8a', rx: .3, ry: .31, wing: .45, eye: '#e0d070', span: .3, hy: -.2, belly: true },
    'boom-fly': { body: '#b02733', rx: .27, ry: .29, wing: .4, eye: '#f3d86a', span: .22, hy: -.14, gloss: true },
    'red-boom-fly': { body: '#d2501f', rx: .27, ry: .29, wing: .4, eye: '#f3e8a0', span: .22, hy: -.14, gloss: true },
    'drowned-boom-fly': { body: '#4f7380', rx: .27, ry: .29, wing: .4, eye: '#d8e8a0', span: .22, hy: -.14, gloss: true },
    'fly-bomb': { body: '#6e7a62', rx: .27, ry: .29, wing: .4, eye: '#e8d8a0', span: .22, hy: -.14, gloss: true },
    'dinga': { body: '#6f8795', rx: .2, ry: .2, wing: .5, eye: '#e8e0a0', span: .3, hy: -.1 },
    'pot': { body: '#8a6a4f', rx: .2, ry: .2, wing: .5, eye: '#e8e0a0', span: .26, hy: -.1 },
    'tumor': { body: '#7a4a58', rx: .22, ry: .22, wing: .4, eye: '#e8e0a0', span: .2, hy: -.1 },
    'eternal-fly': { body: '#d8d0e0', rx: .18, ry: .2, wing: .7, eye: '#6a5a9a', span: .3, hy: -.1 },
    'molten-baby': { body: '#9a3a22', rx: .22, ry: .22, wing: .3, eye: '#ffd86a', span: .2, hy: -.1, flame: true },
    'holy-keeper': { body: '#e0d8b0', rx: .2, ry: .22, wing: .7, eye: '#c9a43a', span: .3, hy: -.1 },
    'locust-of-pestilence': { body: '#6d7a52', rx: .15, ry: .22, wing: .6, eye: '#d8e0a0', span: .3, hy: -.1, long: true },
    'locust-of-war': { body: '#a2503a', rx: .15, ry: .22, wing: .6, eye: '#f0d890', span: .3, hy: -.1, long: true },
    'locust-of-famine': { body: '#6a4a38', rx: .15, ry: .22, wing: .6, eye: '#d8d090', span: .3, hy: -.1, long: true },
    'locust-of-death': { body: '#4f5a52', rx: .15, ry: .22, wing: .6, eye: '#c8d0a0', span: .3, hy: -.1, long: true }
  }
  function flier (id) { var k = FLIES[id]; return function (g, s, t) {
    var flap = Math.sin(t.time * (k.sting ? 34 : 26)) * s * .07, bob = Math.sin(t.time * 5 + id.length) * s * .02
    g.save(); g.translate(0, bob)
    g.fillStyle = 'rgba(205,220,215,' + k.wing + ')'
    O(g, -s * k.span, -s * .1 + flap, s * .2, s * (k.long ? .09 : .13), 'rgba(205,220,215,' + k.wing + ')'); O(g, s * k.span, -s * .1 - flap, s * .2, s * (k.long ? .09 : .13), 'rgba(205,220,215,' + k.wing + ')')
    if (k.sting) Pg(g, C(t, sh(k.body, -.3)), [-s * .05, s * .18, s * .05, s * .18, 0, s * .36])
    if (k.flame) { O(g, 0, -s * .3, s * .1, s * (.12 + .03 * Math.sin(t.time * 14)), '#e9822c'); O(g, 0, -s * .28, s * .05, s * .07, '#fbe08a') }
    O(g, 0, s * .06, s * k.rx, s * k.ry, C(t, k.body))
    if (k.belly) { O(g, -s * .1, s * .14, s * .05, s * .05, C(t, sh(k.body, -.25))); O(g, s * .12, s * .08, s * .04, s * .04, C(t, sh(k.body, -.25))); O(g, 0, s * .22, s * .06, s * .045, C(t, sh(k.body, -.2))) }
    if (k.gloss) { O(g, -s * .1, -s * .03, s * .06, s * .09, 'rgba(255,225,215,.45)'); L(g, '#f3d86a', s * .03, [-s * .08, s * .22, s * .08, s * .22]) }
    if (k.long) { L(g, sh(k.body, -.4), s * .03, [-s * .12, s * .02, s * .12, s * .02]); L(g, sh(k.body, -.4), s * .03, [-s * .1, s * .14, s * .1, s * .14]) }
    O(g, 0, s * k.hy, s * .13, s * .12, C(t, sh(k.body, -.15)))
    eye(g, -s * .06, s * k.hy - s * .01, s * .045, k.eye, '#1a1214'); eye(g, s * .06, s * k.hy - s * .01, s * .045, k.eye, '#1a1214')
    g.restore(); cracks(g, s, t)
  } }

  function bat (id) { var col = id === 'hell-bird' ? '#a8452e' : '#5a4a63'; return function (g, s, t) {
    var f = Math.sin(t.time * 16) * s * .12
    Pg(g, C(t, sh(col, -.2)), [-s * .08, -s * .02, -s * .46, -s * .2 - f, -s * .36, s * .02, -s * .28, s * .1, -s * .14, s * .06])
    Pg(g, C(t, sh(col, -.2)), [s * .08, -s * .02, s * .46, -s * .2 - f, s * .36, s * .02, s * .28, s * .1, s * .14, s * .06])
    O(g, 0, s * .04, s * .16, s * .2, C(t, col)); O(g, 0, -s * .12, s * .13, s * .12, C(t, sh(col, .05)))
    Pg(g, C(t, col), [-s * .12, -s * .2, -s * .08, -s * .34, -s * .02, -s * .2]); Pg(g, C(t, col), [s * .12, -s * .2, s * .08, -s * .34, s * .02, -s * .2])
    eye(g, -s * .05, -s * .13, s * .035, '#e8d870'); eye(g, s * .05, -s * .13, s * .035, '#e8d870')
    if (id === 'hell-bird') O(g, 0, s * .26, s * .06, s * (.07 + .03 * Math.sin(t.time * 12)), '#f0902f')
    cracks(g, s, t)
  } }

  // --- crawlers and blobs ---------------------------------------------------
  var WORMS = {
    'charger': { col: '#c78974', n: 4, rad: .17, snout: '#6a3a34', spikes: true },
    'drowned-charger': { col: '#7d9ea0', n: 4, rad: .17, snout: '#3a5a60', spikes: true },
    'maggot': { col: '#d8d3c2', n: 3, rad: .15, snout: '#8f887a' },
    'guts': { col: '#d98a8e', n: 5, rad: .13, snout: '#8a3a44', tube: true },
    'leech': { col: '#7b3a42', n: 4, rad: .12, snout: '#3a1a22' },
    'snapper': { col: '#6f8450', n: 3, rad: .2, snout: '#3a4a2a', shell: true }
  }
  function worm (id) { var k = WORMS[id]; return function (g, s, t) {
    var w = t.time * 7, lift = (t.charge || 0) * s * .07
    for (var i = k.n - 1; i >= 0; i--) {
      var x = ((k.n - 1) / 2 - i) * s * (.5 / k.n) - s * .06, r = s * k.rad * (1 - i * .035)
      var y = Math.sin(w - i * 1.1) * s * .04 + s * .1
      if (i === 0) { O(g, x + s * .1, y - lift, s * .2, s * .17, C(t, sh(k.col, -.12))); O(g, x + s * .28, y - lift + s * .02, s * .07, s * .07, k.snout); eye(g, x + s * .16, y - lift - s * .06, s * .035, '#f0eadc'); eye(g, x + s * .16, y - lift + s * .03, s * .03, '#f0eadc') }
      else { O(g, x, y, r * 1.15, r, C(t, sh(k.col, i % 2 ? -.18 : 0))); if (k.spikes) Pg(g, C(t, k.snout), [x - s * .04, y - r * .8, x, y - r * 1.35, x + s * .04, y - r * .8]) }
    }
    if (k.shell) { O(g, -s * .05, s * .0, s * .27, s * .2, C(t, '#566a3a')); L(g, '#3a4a2a', s * .03, [-s * .2, -s * .08, s * .1, -s * .08]) }
    if (k.tube) L(g, '#a8505a', s * .025, [-s * .3, s * .12, -s * .1, s * .05, s * .1, s * .15])
    cracks(g, s, t)
  } }

  function blob (id) { var k = { 'clotty': ['#a02a33', '#5f1219', '#c4505a'], 'grilled-clotty': ['#5d4a3a', '#2a1c14', '#8a6a4a'], 'blurb': ['#5f84a0', '#2f4a60', '#8cb0c8'], 'lil-blub': ['#6a5a8f', '#352c50', '#9a88c4'] }[id]; return function (g, s, t) {
    var q = Math.sin(t.time * (id === 'clotty' ? 7 : 4)) * .04, ch = t.charge || 0
    O(g, 0, s * .12, s * .38 * (1 + q), s * .3 * (1 - q), C(t, k[0]))
    O(g, 0, -s * .06, s * .33, s * .3 * (1 - q), C(t, k[0]))
    ;[[-.2, -.14, .09], [.18, -.2, .08], [.04, -.28, .07], [-.28, .08, .07], [.28, .06, .08], [0, .22, .08]].forEach(function (b) { O(g, s * b[0], s * b[1], s * b[2], s * b[2] * .9, C(t, k[2])); O(g, s * b[0] + s * .02, s * b[1] + s * .02, s * b[2] * .45, s * b[2] * .4, k[1]) })
    if (id === 'clotty' || id === 'grilled-clotty') { ;[[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(function (d) { O(g, d[0] * s * .4, s * .08 + d[1] * s * .32, s * .05, s * .05, k[1]) }) }
    eye(g, -s * .1, -s * .04, s * .05, '#efe6d2'); eye(g, s * .1, -s * .04, s * .05, '#efe6d2')
    O(g, 0, s * .1, s * (.06 + .04 * ch), s * (.04 + .06 * ch), '#20090c')
    cracks(g, s, t)
  } }

  function hopper (g, s, t) {
    var sq = Math.sin(t.time * 8) * s * .015
    O(g, -s * .14, s * .3, s * .1, s * .08, C(t, '#8f7552')); O(g, s * .14, s * .3, s * .1, s * .08, C(t, '#8f7552'))
    L(g, C(t, '#9f845e'), s * .1, [-s * .12, s * .12, -s * .2, s * .26]); L(g, C(t, '#9f845e'), s * .1, [s * .12, s * .12, s * .2, s * .26])
    O(g, 0, s * .06 + sq, s * .26, s * .24, C(t, '#b8976a')); O(g, -s * .02, -s * .06, s * .2, s * .14, C(t, '#a78659'))
    L(g, C(t, '#9f845e'), s * .06, [-s * .24, -s * .02, -s * .3, s * .22]); L(g, C(t, '#9f845e'), s * .06, [s * .24, -s * .02, s * .3, s * .22])
    O(g, 0, -s * .2, s * .2, s * .17, C(t, '#c5a577'))
    eye(g, -s * .08, -s * .22, s * .045, '#e8d070'); eye(g, s * .08, -s * .22, s * .045, '#e8d070')
    L(g, '#3a1a1a', s * .03, [-s * .07, -s * .12, s * .07, -s * .12]); cracks(g, s, t)
  }

  function mulligan (g, s, t) {
    var b = Math.sin(t.time * 4) * s * .012
    L(g, '#9d977f', s * .08, [-s * .1, s * .3, -s * .12, s * .42]); L(g, '#9d977f', s * .08, [s * .1, s * .3, s * .12, s * .42])
    O(g, 0, s * .12, s * .38 + b, s * .33, C(t, '#d0c8a6')); O(g, -s * .12, s * .16, s * .06, s * .06, '#c98a52'); O(g, s * .14, s * .06, s * .05, s * .05, '#c98a52'); O(g, s * .04, s * .26, s * .05, s * .045, '#c98a52')
    L(g, C(t, '#bdb592'), s * .05, [-s * .3, s * .0, -s * .38, s * .2]); L(g, C(t, '#bdb592'), s * .05, [s * .3, s * .0, s * .38, s * .2])
    O(g, 0, -s * .2, s * .2, s * .17, C(t, '#dcd4b4'))
    O(g, -s * .08, -s * .22, s * .045, s * .06, '#2b2323'); O(g, s * .08, -s * .22, s * .045, s * .06, '#2b2323'); L(g, '#2b2323', s * .025, [-s * .14, -s * .3, -s * .04, -s * .27]); L(g, '#2b2323', s * .025, [s * .14, -s * .3, s * .04, -s * .27])
    O(g, 0, -s * .11, s * .05, s * (.04 + .04 * (t.charge || 0)), '#2b0f12')
    for (var i = 0; i < 3; i++) { var a = t.time * 3 + i * 2.1; O(g, Math.cos(a) * s * .42, -s * .22 + Math.sin(a * 1.3) * s * .1, s * .045, s * .04, '#241f20') }
    cracks(g, s, t)
  }

  function horf (id) { var col = id === 'blue-horf' ? '#7fa0b0' : '#c9847c'; return function (g, s, t) {
    var bob = Math.sin(t.time * 3) * s * .025, ch = t.charge || 0
    O(g, 0, s * .02 + bob, s * .37, s * .33, C(t, sh(col, -.2))); O(g, 0, -s * .02 + bob, s * .35, s * .31, C(t, col))
    L(g, '#8a3a40', s * .02, [-s * .28, -s * .1 + bob, -s * .2, -s * .02 + bob, -s * .24, s * .06 + bob]); L(g, '#8a3a40', s * .02, [s * .26, -s * .12 + bob, s * .2, -s * .04 + bob])
    L(g, '#3a1a20', s * .05, [-s * .22, -s * .16 + bob, -s * .06, -s * .1 + bob]); L(g, '#3a1a20', s * .05, [s * .22, -s * .16 + bob, s * .06, -s * .1 + bob])
    O(g, -s * .13, -s * .06 + bob, s * .05, s * .04, '#150d10'); O(g, s * .13, -s * .06 + bob, s * .05, s * .04, '#150d10')
    var mh = s * (.05 + .1 * ch); O(g, 0, s * .15 + bob, s * .22, mh, '#2a080c')
    g.fillStyle = '#eee3cc'; for (var i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * s * .06 - s * .025, s * .15 + bob - mh); g.lineTo(i * s * .06, s * .15 + bob - mh + s * .06); g.lineTo(i * s * .06 + s * .025, s * .15 + bob - mh); g.fill() }
    cracks(g, s, t)
  } }

  function knight (id) { var col = id === 'selfless-knight' ? '#6a5a82' : id === 'floating-knight' ? '#4a5c6a' : id === 'loose-knight' ? '#5a4a4a' : '#4f4a63', trim = '#9a93b0'; return function (g, s, t) {
    var v = t.variant || 0, step = Math.sin(t.time * 8), bob = id === 'floating-knight' ? Math.sin(t.time * 3) * s * .03 : 0
    if (id === 'floating-knight') { Pg(g, C(t, sh(col, -.3)), [-s * .2, s * .1, s * .2, s * .1, s * .08, s * .42, -s * .08, s * .36]) }
    else { L(g, sh(col, -.4), s * .12, [-s * .1, s * .2, -s * .11, s * .42 + step * s * .02]); L(g, sh(col, -.4), s * .12, [s * .1, s * .2, s * .11, s * .42 - step * s * .02]) }
    O(g, 0, s * .1 + bob, s * .25, s * .27, C(t, col)); L(g, trim, s * .03, [-s * .2, s * .0 + bob, s * .2, s * .0 + bob])
    O(g, -s * .27, s * .05 + bob, s * .07, s * .09, C(t, sh(col, .1))); O(g, s * .27, s * .05 + bob, s * .07, s * .09, C(t, sh(col, .1)))
    O(g, 0, -s * .2 + bob, s * .2, s * .2, C(t, sh(col, .08)))
    Pg(g, C(t, sh(col, .08)), [-s * .06, -s * .38 + bob, 0, -s * .48 + bob, s * .06, -s * .38 + bob])
    if (v === 3) { L(g, sh(col, -.35), s * .03, [0, -s * .38 + bob, 0, -s * .04 + bob]) }
    else { g.fillStyle = '#120f16'; g.fillRect(-s * .14, -s * .24 + bob, s * .28, s * .05); if (t.hp01 < .5) O(g, s * .05, -s * .22 + bob, s * .03, s * .02, '#d0504a') }
    if (v !== 3) {
      var sx = v === 0 ? s * .24 : 0, sy = v === 1 ? s * .06 : s * .08, sw = v === 1 ? s * .34 : s * .16, sh2 = s * .32
      g.fillStyle = C(t, '#7d7692'); g.beginPath(); g.roundRect(sx - sw / 2, sy - sh2 / 2 + bob, sw, sh2, s * .08); g.fill()
      g.strokeStyle = trim; g.lineWidth = s * .04; g.stroke(); L(g, trim, s * .035, [sx, sy - sh2 * .3 + bob, sx, sy + sh2 * .3 + bob])
    }
    cracks(g, s, t)
  } }

  function skull (id) { var bone = id === 'deaths-head' ? '#e2d6b4' : '#d8cfb7'; return function (g, s, t) {
    var bob = id === 'deaths-head' ? Math.sin(t.time * 6) * s * .03 : 0, big = id === 'big-bony'
    if (id !== 'deaths-head') { L(g, C(t, bone), s * .07, [0, s * .0, 0, s * .34]); for (var i = 0; i < 3; i++) L(g, C(t, bone), s * .045, [-s * .17, s * (.06 + i * .08), s * .17, s * (.06 + i * .08)]); L(g, C(t, bone), s * .05, [-s * .08, s * .34, -s * .12, s * .46]); L(g, C(t, bone), s * .05, [s * .08, s * .34, s * .12, s * .46]); L(g, C(t, bone), s * .05, [-s * .17, s * .1, -s * .3, s * .26 + Math.sin(t.time * 6) * s * .03]); L(g, C(t, bone), s * .05, [s * .17, s * .1, s * .3, s * .26]) }
    else { Pg(g, '#3a2a2e', [-s * .24, -s * .22 + bob, -s * .38, -s * .46 + bob, -s * .12, -s * .32 + bob]); Pg(g, '#3a2a2e', [s * .24, -s * .22 + bob, s * .38, -s * .46 + bob, s * .12, -s * .32 + bob]) }
    var cy = id === 'deaths-head' ? 0 : -s * .18
    O(g, 0, cy + bob, s * (big ? .32 : .3), s * .26, C(t, bone)); O(g, 0, cy + s * .22 + bob, s * .17, s * .1, C(t, sh(bone, -.08)))
    var ec = id === 'deaths-head' ? '#e0602a' : '#1e181c'
    O(g, -s * .11, cy - s * .02 + bob, s * .075, s * .09, '#1e181c'); O(g, s * .11, cy - s * .02 + bob, s * .075, s * .09, '#1e181c')
    if (id === 'deaths-head') { O(g, -s * .11, cy - s * .02 + bob, s * .035, s * .05, ec); O(g, s * .11, cy - s * .02 + bob, s * .035, s * .05, ec) }
    Pg(g, '#1e181c', [-s * .03, cy + s * .08 + bob, s * .03, cy + s * .08 + bob, 0, cy + s * .02 + bob])
    for (var j = -2; j <= 2; j++) L(g, '#1e181c', s * .018, [j * s * .045, cy + s * .2 + bob, j * s * .045, cy + s * .27 + bob])
    cracks(g, s, t)
  } }

  function globin (id) { var col = id === 'black-globin' ? '#2f2a32' : id === 'blue-globin' ? '#4f8b94' : '#7c8c66'; return function (g, s, t) {
    if (t.variant === 1) { O(g, 0, s * .26, s * .4, s * .13, C(t, sh(col, -.1))); O(g, -s * .1, s * .22, s * .1, s * .05, C(t, sh(col, .1))); O(g, s * .15, s * .28, s * .06, s * .035, C(t, sh(col, .15))); var up = (Math.sin(t.time * 10) + 1) * s * .02; O(g, 0, s * .2 - up, s * .06, s * .06, C(t, col)); return }
    var sq = Math.sin(t.time * 8) * s * .02
    L(g, sh(col, -.3), s * .09, [-s * .1, s * .25, -s * .12, s * .4]); L(g, sh(col, -.3), s * .09, [s * .1, s * .25, s * .12, s * .4])
    O(g, 0, s * .12, s * .27 + sq, s * .28 - sq, C(t, sh(col, -.1)))
    O(g, 0, -s * .08, s * .3, s * .3 - sq, C(t, col))
    ;[-.2, .0, .2].forEach(function (x, i) { O(g, s * x, s * .36 + i % 2 * s * .04, s * .03, s * .06, C(t, col)) })
    var eyec = id === 'black-globin' ? '#e6e0d0' : '#161414'; O(g, -s * .11, -s * .1, s * .07, s * .09, eyec); O(g, s * .11, -s * .1, s * .07, s * .09, eyec)
    O(g, 0, s * .06, s * .12, s * (.06 + .04 * (t.charge || 0)), id === 'black-globin' ? '#0f0c10' : '#1b1514')
    cracks(g, s, t)
  } }

  function hive (id) { var nest = id === 'nest', col = nest ? '#6f5a42' : id === 'drowned-hive' ? '#7a8a8c' : '#c99a3a'; return function (g, s, t) {
    var b = Math.sin(t.time * 3) * s * .015
    O(g, 0, s * .06 + b, s * .36, s * .38, C(t, sh(col, -.2))); O(g, 0, s * .02 + b, s * .33, s * .35, C(t, col))
    if (nest) { for (var i = 0; i < 7; i++) L(g, sh(col, i % 2 ? -.35 : .2), s * .035, [-s * .3 + i * s * .1, -s * .15, s * .1 - i * s * .08, s * .25]) }
    else { for (var r = 0; r < 3; r++) for (var c = 0; c < 2 + (r === 1 ? 1 : 0); c++) { var x = (c - (r === 1 ? 1 : .5)) * s * .18, y = -s * .16 + r * s * .17; O(g, x, y + b, s * .06, s * .06, '#3a2410'); O(g, x, y + b, s * .075, s * .075, 'rgba(120,80,20,.35)') } }
    O(g, 0, s * .28 + b, s * .1, s * (.05 + .04 * (t.charge || 0)), '#20140a')
    for (var f = 0; f < 3; f++) { var a = t.time * 5 + f * 2.1; O(g, Math.cos(a) * s * .4, -s * .1 + Math.sin(a * 1.4) * s * .2, s * .035, s * .03, '#241f20') }
    cracks(g, s, t)
  } }

  function visEye (id) { var col = id === 'bloodshot-eye' ? '#d8b4a8' : '#a96f58'; return function (g, s, t) {
    var ch = t.charge || 0, pul = Math.sin(t.time * 4) * s * .01
    O(g, 0, s * .06, s * .36, s * .34 + pul, C(t, sh(col, -.2))); O(g, 0, s * .02, s * .34, s * .32 + pul, C(t, col))
    if (id === 'bloodshot-eye') {
      O(g, 0, 0, s * .26, s * .22, C(t, '#f0e8de'))
      for (var i = 0; i < 8; i++) { var a = i * .8 + .3; L(g, '#b33a3e', s * .018, [Math.cos(a) * s * .25, Math.sin(a) * s * .21, Math.cos(a) * s * .13, Math.sin(a) * s * .11]) }
      O(g, 0, 0, s * (.1 + .04 * ch), s * (.1 + .04 * ch), '#7a1219'); O(g, 0, 0, s * .045, s * .045, '#0e0709')
    } else {
      O(g, 0, -s * .06, s * .17, s * .13, C(t, '#e8dccb')); O(g, 0, -s * .06, s * (.07 + .03 * ch), s * (.07 + .03 * ch), ch > .5 ? '#ff3a2a' : '#8a1a22'); O(g, 0, -s * .06, s * .03, s * .03, '#0e0709')
      L(g, '#4a2a22', s * .03, [-s * .2, -s * .22, -s * .06, -s * .17]); L(g, '#4a2a22', s * .03, [s * .2, -s * .22, s * .06, -s * .17])
      O(g, 0, s * .17, s * .15, s * (.035 + .05 * ch), '#2a090c')
    }
    cracks(g, s, t)
  } }

  function imp (id) { var col = id === 'wizoob' ? '#6a6f92' : '#b4382b'; return function (g, s, t) {
    var fl = Math.sin(t.time * 10) * s * .06
    if (id === 'wizoob') {
      g.fillStyle = C(t, col); g.beginPath(); g.moveTo(-s * .3, s * .42); g.quadraticCurveTo(-s * .42, -s * .1, 0, -s * .46); g.quadraticCurveTo(s * .42, -s * .1, s * .3, s * .42); g.lineTo(s * .12, s * .3); g.lineTo(0, s * .44); g.lineTo(-s * .12, s * .3); g.fill()
      Pg(g, C(t, sh(col, -.25)), [-s * .22, -s * .22, 0, -s * .5, s * .22, -s * .22]); eye(g, -s * .09, -s * .08, s * .05, '#f0e8a0', '#0e0e18'); eye(g, s * .09, -s * .08, s * .05, '#f0e8a0', '#0e0e18'); O(g, 0, s * .06, s * .06, s * (.03 + .04 * (t.charge || 0)), '#0e0e18'); return
    }
    Pg(g, C(t, sh(col, -.3)), [-s * .08, 0, -s * .44, -s * .16 - fl, -s * .32, s * .04, -s * .38, s * .12, -s * .1, s * .1]); Pg(g, C(t, sh(col, -.3)), [s * .08, 0, s * .44, -s * .16 - fl, s * .32, s * .04, s * .38, s * .12, s * .1, s * .1])
    L(g, '#5a1a14', s * .03, [s * .1, s * .22, s * .3, s * .36, s * .38, s * .3])
    O(g, 0, s * .1, s * .17, s * .2, C(t, col)); O(g, 0, -s * .12, s * .17, s * .15, C(t, sh(col, .06)))
    Pg(g, '#2a0c0a', [-s * .14, -s * .22, -s * .22, -s * .4, -s * .06, -s * .26]); Pg(g, '#2a0c0a', [s * .14, -s * .22, s * .22, -s * .4, s * .06, -s * .26])
    eye(g, -s * .06, -s * .14, s * .035, '#f4e07a'); eye(g, s * .06, -s * .14, s * .035, '#f4e07a'); L(g, '#2a0c0a', s * .025, [-s * .08, -s * .05, 0, -s * .02, s * .08, -s * .06]); cracks(g, s, t)
  } }

  function sack (id) { return function (g, s, t) {
    var b = Math.sin(t.time * 5) * s * .02
    L(g, '#8f7a5a', s * .08, [-s * .1, s * .3, -s * .12, s * .42]); L(g, '#8f7a5a', s * .08, [s * .1, s * .3, s * .12, s * .42])
    O(g, 0, s * .1 + b, s * .33, s * .34, C(t, '#b89f78')); O(g, 0, -s * .22, s * .1, s * .06, C(t, '#a38b66')); L(g, '#6b5a40', s * .03, [-s * .13, -s * .17, s * .13, -s * .17])
    L(g, '#5a4a38', s * .02, [0, -s * .05, 0, s * .32]); for (var i = 0; i < 4; i++) L(g, '#5a4a38', s * .02, [-s * .05, -s * .02 + i * s * .08, s * .05, s * .02 + i * s * .08])
    eye(g, -s * .13, -s * .0 + b, s * .05, '#efe6d2'); eye(g, s * .13, -s * .0 + b, s * .05, '#efe6d2'); O(g, 0, s * .2 + b, s * .1, s * (.04 + .03 * (t.charge || 0)), '#2a1a10'); cracks(g, s, t)
  } }

  function bruiser (id) { var col = id === 'blood-hulk' ? '#a3363a' : '#a77a8a'; return function (g, s, t) {
    var st = Math.sin(t.time * 8) * s * .03
    L(g, sh(col, -.4), s * .13, [-s * .13, s * .22, -s * .14, s * .42 + st]); L(g, sh(col, -.4), s * .13, [s * .13, s * .22, s * .14, s * .42 - st])
    O(g, 0, s * .06, s * .36, s * .3, C(t, col)); O(g, -s * .1, s * .12, s * .09, s * .06, C(t, sh(col, -.2))); O(g, s * .12, s * .08, s * .09, s * .06, C(t, sh(col, -.2)))
    L(g, C(t, sh(col, -.1)), s * .13, [-s * .3, s * .0, -s * .4, s * .22]); L(g, C(t, sh(col, -.1)), s * .13, [s * .3, s * .0, s * .4, s * .22])
    O(g, 0, -s * .22, s * .15, s * .13, C(t, sh(col, .08))); L(g, '#1c0c10', s * .04, [-s * .1, -s * .26, -s * .02, -s * .22]); L(g, '#1c0c10', s * .04, [s * .1, -s * .26, s * .02, -s * .22])
    O(g, 0, -s * .15, s * .06, s * (.03 + .03 * (t.charge || 0)), '#1c0c10'); cracks(g, s, t)
  } }

  function spider (id) { var col = id === 'rock-spider' ? '#8f8a82' : '#c8c49a'; return function (g, s, t) {
    var w = Math.sin(t.time * 14) * s * .04
    for (var i = -1; i <= 1; i += 2) for (var j = 0; j < 3; j++) { var y = -s * .1 + j * s * .12; L(g, sh(col, -.4), s * .035, [i * s * .1, y, i * s * .3, y - s * .1 + (j % 2 ? w : -w), i * s * .4, y + s * .12]) }
    O(g, 0, s * .06, s * .24, s * .2, C(t, col)); if (id === 'rock-spider') { L(g, '#66625c', s * .03, [-s * .14, -s * .02, 0, s * .08, s * .15, -s * .04]); L(g, '#66625c', s * .03, [-s * .05, s * .12, s * .1, s * .14]) }
    O(g, 0, -s * .12, s * .13, s * .11, C(t, sh(col, .06))); eye(g, -s * .05, -s * .14, s * .035, '#e8d070'); eye(g, s * .05, -s * .14, s * .035, '#e8d070')
    if (id === 'wall-creep') O(g, 0, s * .06, s * .09, s * .05, '#2a2418'); cracks(g, s, t)
  } }

  function ghostly (id) { var col = id === 'red-ghost' ? '#b24a52' : id === 'poof-ghost' ? '#8a8aa8' : '#9a9ab8'; return function (g, s, t) {
    var w = Math.sin(t.time * 4) * s * .03
    g.fillStyle = C(t, col); g.globalAlpha *= .85; g.beginPath(); g.moveTo(-s * .34, s * .42); g.quadraticCurveTo(-s * .5, -s * .2, 0, -s * .46 + w); g.quadraticCurveTo(s * .5, -s * .2, s * .34, s * .42)
    for (var i = 3; i >= -3; i--) g.lineTo(i * s * .1, s * (.34 + (i % 2 ? .06 : 0))); g.fill(); g.globalAlpha = 1
    eye(g, -s * .1, -s * .08, s * .06, '#f4f0e0', '#14121c'); eye(g, s * .1, -s * .08, s * .06, '#f4f0e0', '#14121c'); O(g, 0, s * .08, s * .06, s * (.04 + .05 * (t.charge || 0)), '#14121c')
  } }

  function lump (id) { var col = { 'lump': '#7a5d6d', 'gurgle': '#4f8a80', 'spitty': '#c58a52', 'swinger': '#8f8a96', 'swarmer': '#4a4650', 'boil': '#d49a8a', 'wall-hugger': '#6a5260', 'conjoined-fatty': '#d8b4a8', 'fissure': '#8a5a48', 'mole': '#8a6a4f', 'grackle': '#5a6a4a', 'poly': '#8a7aa8', 'coal-boy': '#3a3638', 'stonehead': '#8a857c', 'dust': '#a89878', 'ash-pile': '#6a6560', 'cinder': '#5a3a30', 'blood-puppy': '#9a3a3a' }[id] || '#8a7a7a'; return function (g, s, t) {
    var ch = t.charge || 0, pul = Math.sin(t.time * 5) * s * .015
    if (id === 'boil') { O(g, 0, s * .12, s * .38, s * .26, C(t, sh(col, -.2))); O(g, 0, s * .04, s * .3, s * .26 + pul, C(t, col)); O(g, 0, -s * .02, s * .13, s * .12, '#ece2a0'); O(g, 0, -s * .02, s * .05, s * .05, '#c9a43a'); L(g, '#a8505a', s * .025, [-s * .26, s * .0, -s * .15, s * .1]); cracks(g, s, t); return }
    if (id === 'swinger') { L(g, '#4a4650', s * .03, [0, 0, -s * .3, -s * .3]); O(g, -s * .3, -s * .3, s * .1, s * .1, C(t, '#6a6670')); for (var i = 0; i < 8; i++) { var a = i * TAU / 8; Pg(g, C(t, '#a8a4ae'), [Math.cos(a - .2) * s * .24, Math.sin(a - .2) * s * .24, Math.cos(a) * s * .38, Math.sin(a) * s * .38, Math.cos(a + .2) * s * .24, Math.sin(a + .2) * s * .24]) } }
    if (id === 'stonehead' || id === 'coal-boy') { g.fillStyle = C(t, col); g.beginPath(); g.roundRect(-s * .3, -s * .3, s * .6, s * .62, s * .1); g.fill(); L(g, sh(col, -.3), s * .03, [-s * .2, -s * .1, s * .1, s * .0, s * .0, s * .2]); eye(g, -s * .1, -s * .1, s * .05, id === 'coal-boy' ? '#f0a030' : '#2a2a2a', '#0e0e0e'); eye(g, s * .1, -s * .1, s * .05, id === 'coal-boy' ? '#f0a030' : '#2a2a2a', '#0e0e0e'); O(g, 0, s * .12, s * .1, s * (.03 + .05 * ch), '#1a1210'); if (id === 'coal-boy') O(g, 0, -s * .36, s * .08, s * (.08 + .03 * Math.sin(t.time * 12)), '#e9822c'); cracks(g, s, t); return }
    O(g, 0, s * .12, s * .34, s * .27, C(t, sh(col, -.2))); O(g, 0, s * .0, s * (id === 'conjoined-fatty' ? .4 : .32), s * .28 + pul, C(t, col)); if (id === 'conjoined-fatty') { O(g, s * .15, -s * .08, s * .22, s * .22, C(t, sh(col, .05))); eye(g, s * .1, -s * .1, s * .035, '#efe6d2'); eye(g, s * .22, -s * .1, s * .035, '#efe6d2') }
    var sp = id === 'swinger' || id === 'swarmer'; if (sp) { for (var k = 0; k < 6; k++) { var ax = (k - 2.5) * s * .1; eye(g, ax, -s * .1 + (k % 2) * s * .14, s * .04, '#efe6d2', '#1a1214') } }
    else { eye(g, -s * .11, -s * .1, s * .06, '#efe6d2'); eye(g, s * .11, -s * .1, s * .06, '#efe6d2'); O(g, 0, s * .1, s * (.09 + .04 * ch), s * (.05 + .07 * ch), '#2a090c'); if (id === 'spitty' || id === 'gurgle') { L(g, '#d8e0a0', s * .03, [-s * .04, s * .14, -s * .05, s * .24]); L(g, '#d8e0a0', s * .03, [s * .05, s * .14, s * .06, s * .22]) } }
    cracks(g, s, t)
  } }

  // --- registration ---------------------------------------------------------
  def(Object.keys(GAPERS), gaper)
  def(['fatty', 'flaming-fatty', 'gutted-fatty', 'bloated-fatty'], fatty)
  def(Object.keys(FLIES), flier)
  def(['hell-bird', 'grudge-bat'], bat)
  def(Object.keys(WORMS), worm)
  def(['clotty', 'grilled-clotty', 'blurb', 'lil-blub'], blob)
  def(['hopper'], function () { return hopper }); def(['mulligan', 'mulliboom'], function () { return mulligan })
  def(['horf', 'blue-horf'], horf)
  def(['knight', 'selfless-knight', 'floating-knight', 'loose-knight'], knight)
  def(['bony', 'big-bony', 'deaths-head'], skull)
  def(['globin', 'black-globin', 'blue-globin'], globin)
  def(['hive', 'nest', 'drowned-hive'], hive)
  def(['vis', 'bloodshot-eye'], visEye)
  def(['imp', 'wizoob'], imp)
  def(['walking-sack'], sack)
  def(['blood-hulk', 'blood-feeder'], bruiser)
  def(['rock-spider', 'wall-creep'], spider)
  def(['poof-ghost', 'red-ghost'], ghostly)
  def(['lump', 'gurgle', 'spitty', 'swinger', 'swarmer', 'boil', 'wall-hugger', 'conjoined-fatty', 'fissure', 'mole', 'grackle', 'poly', 'coal-boy', 'stonehead', 'dust', 'ash-pile', 'cinder', 'blood-puppy'], lump)

  IS.spriteKit = { C: C, sh: sh, O: O, L: L, Pg: Pg, eye: eye, cracks: cracks, def: def }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
