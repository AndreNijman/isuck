;(function (IS) {
  'use strict'

  var cache = Object.create(null)
  function state (t) { return Object.assign({ frame: 0, time: 0, dir: 2, hurt: 0, tint: null, variant: 0, flip: false, charge: 0, hp01: 1 }, t || {}) }
  function bodyColour (t, fallback) { return t.hurt ? '#f8f4e8' : (t.tint || fallback) }
  function oval (g, x, y, rx, ry) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill() }
  function line (g, colour, width, points) { g.strokeStyle = colour; g.lineWidth = width; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(points[0], points[1]); for (var i = 2; i < points.length; i += 2) g.lineTo(points[i], points[i + 1]); g.stroke() }
  function hash (s) { return IS.hashString ? IS.hashString(String(s)) : String(s).split('').reduce(function (h, c) { return ((h << 5) - h + c.charCodeAt(0)) | 0 }, 0) }

  IS.drawSprite = function (g, name, x, y, size, t) {
    var fn = IS.sprite(name) || IS.sprite('sprite-missing')
    if (!fn || !g) return
    g.save(); g.translate(x, y); if (t && t.flip) g.scale(-1, 1); fn(g, size, state(t)); g.restore()
  }
  IS.spriteCanvas = function (name, size, t) {
    t = state(t); var animated = !!IS.animatedSprites[name]
    var key = name + '|' + size + '|' + (t.tint || '') + '|' + (t.variant || '')
    if (!animated && cache[key]) return cache[key]
    if (typeof document === 'undefined' || !document.createElement) return null
    var pad = Math.ceil(size * 1.3); var c = document.createElement('canvas'); c.width = c.height = pad
    var g = c.getContext('2d'); IS.drawSprite(g, name, pad / 2, pad / 2, size, t)
    if (!animated) cache[key] = c
    return c
  }

  IS.defineSprite('sprite-missing', function (g, s, t) {
    g.fillStyle = bodyColour(t, '#8c2030'); oval(g, 0, 0, s * .43, s * .43)
    line(g, '#241719', s * .08, [-s * .2, -s * .2, s * .2, s * .2]); line(g, '#241719', s * .08, [s * .2, -s * .2, -s * .2, s * .2])
  })

  /*
   * Isaac-style player: a big round head on a tiny body, tear-streaked eyes, a head
   * that turns toward the firing (or walking) direction, a bob walk cycle and a
   * crying mouth while shooting. The live player is read from IS.state.run so the
   * sprite can see aim and movement without any render.js plumbing.
   */
  function child (g, s, t, def) {
    var A = IS.art, sh = A.sh, n = (def.name || '').toLowerCase(), tainted = !!def.tainted
    A.begin(t)
    var p = IS.state && IS.state.run && IS.state.run.player
    if (p && p.charId !== def.id) p = null
    var T = A.T, hx = 0, hy = 1, moving = false, shooting = false
    if (p) {
      var hd = p.head, mv = Math.abs(p.vx || 0) + Math.abs(p.vy || 0)
      moving = mv > 20
      if (hd && (hd.x || hd.y)) {
        hx = hd.x; hy = hd.y
        shooting = (p.nextShot || 0) > ((p.stats && p.stats.fireDelay) || .4) * .45
      } else if (moving) { var m = Math.hypot(p.vx, p.vy); hx = p.vx / m; hy = p.vy / m }
    }
    var up = hy < -.5 && Math.abs(hx) < .8
    var custom = A.tint(t, null)
    var skin = t.hurt ? '#fff4ec' : (custom || '#efc8b0'), hair = null, shirt = '#d8d4cc', eyeCol = '#3a4a6a'
    if (!custom && !t.hurt) {
      if (/magdalene/.test(n)) { hair = '#6a3a2a'; shirt = '#d8a0b0' } else if (/cain/.test(n)) { hair = '#4a3020'; shirt = '#7a5a3a' }
      else if (/judas/.test(n)) { hair = '#1c1418'; shirt = '#2a2024'; skin = '#e2b8a2' } else if (/\?\?\?|blue/.test(n)) { skin = '#7e96aa'; shirt = '#4a5a78'; eyeCol = '#1a1a2a' }
      else if (/eve/.test(n)) { hair = '#1c1418'; shirt = '#2a2024' } else if (/samson/.test(n)) { hair = '#3a2418'; shirt = '#c8a070' }
      else if (/azazel/.test(n)) { skin = '#6a2228'; shirt = '#1a1014'; eyeCol = '#e8a030' } else if (/lazarus/.test(n)) { hair = '#7a5a3a'; shirt = '#b8b4a0' }
      else if (/eden/.test(n)) { hair = '#a84ad8'; shirt = '#4ab8d8' } else if (/lost/.test(n)) { skin = '#e4eceb'; shirt = '#c8d4d2' }
      else if (/lilith/.test(n)) { hair = '#2a1a22'; shirt = '#5a3a5a' } else if (/keeper/.test(n)) { skin = '#c8a860'; shirt = '#a88840' }
      else if (/apollyon/.test(n)) { skin = '#6a587a'; shirt = '#2a2030' } else if (/forgotten/.test(n)) { skin = '#e6dcc0'; shirt = '#e6dcc0' }
      else if (/bethany/.test(n)) { hair = '#c8683a'; shirt = '#f0e8e0' } else if (/jacob|esau/.test(n)) { hair = '#b87a3a'; shirt = '#7a8aa8' }
    }
    if (tainted && !t.hurt) { skin = A.mix(skin, '#4a3f52', .45); shirt = A.mix(shirt, '#2a2430', .5) }
    var bob = moving ? Math.abs(Math.sin(T * 13)) * 3 : Math.sin(T * 2.4) * .8
    var lean = moving ? Math.sin(T * 13) * 2 : 0
    var tx = hx * 7, ty = hy * 4              /* head shifts toward facing */
    g.save()
    if (/lost/.test(n)) g.globalAlpha = .82
    var st = moving ? Math.sin(T * 13) * 5 : 0
    A.leg(g, -7, 30, -8 - st * .3, 38, -9 + st, 46, 6, sh(skin, -.12)); A.leg(g, 7, 30, 8 + st * .3, 38, 9 - st, 46, 6, sh(skin, -.12))
    A.flat(g, -9 + st, 47, 6, 3, '#2a2024'); A.flat(g, 9 - st, 47, 6, 3, '#2a2024')
    if (/azazel/.test(n)) { A.wing(g, -8, 14, 24, -2.6, '#1a1014', { dir: 1, flap: Math.sin(T * 5) * .15 }); A.wing(g, 8, 14, 24, -.54, '#1a1014', { dir: 1, flap: -Math.sin(T * 5) * .15 }) }
    A.ball(g, lean, 24 - bob * .4, 16, 17, shirt)
    A.line(g, sh(skin, -.1), 6, [-14 + lean, 22 - bob * .4, -22 + lean, 30 - bob * .4 + (shooting ? -6 : 0)]); A.line(g, sh(skin, -.1), 6, [14 + lean, 22 - bob * .4, 22 + lean, 30 - bob * .4 + (shooting ? -6 : 0)])
    if (/judas/.test(n)) A.poly(g, [-18, 12, 18, 12, 22, 44, -22, 44], '#8a1a24')
    if (/forgotten/.test(n)) { for (var r = 0; r < 3; r++) A.line(g, '#8a7a60', 1.6, [-9 + lean, 18 + r * 5 - bob * .4, 9 + lean, 18 + r * 5 - bob * .4]) }
    var hyc = -14 - bob + (shooting ? -1.5 : 0)
    var longHair = hair && /magdalene|eve|lilith|bethany/.test(n)
    if (longHair) A.poly(g, [-34 + tx, hyc - 6, -38 + tx, hyc + 30, 38 + tx, hyc + 30, 34 + tx, hyc - 6], hair)
    if (/jacob|esau/.test(n)) A.ball(g, 36, hyc + 6, 20, 19, sh(skin, -.05))
    if (/forgotten/.test(n)) A.skull(g, tx, hyc - 2 + ty, 34, skin, { eyec: '#7ad8c8' })
    else {
      A.ball(g, tx, hyc, 37, 34, skin)
      if (/apollyon/.test(n)) { A.horn(g, -18 + tx, hyc - 26, -2.2, 18, 8, '#3a2a48', -.4); A.horn(g, 18 + tx, hyc - 26, -.94, 18, 8, '#3a2a48', .4) }
      if (/azazel/.test(n)) { A.horn(g, -20 + tx, hyc - 26, -2.2, 16, 8, '#2a1014', -.4); A.horn(g, 20 + tx, hyc - 26, -.94, 16, 8, '#2a1014', .4) }
      if (hair) {
        g.save(); g.beginPath(); g.ellipse(tx, hyc, 37, 34, 0, 0, Math.PI * 2); g.clip(); g.fillStyle = hair
        g.beginPath(); g.ellipse(tx, hyc - (longHair ? 22 : 24), longHair ? 42 : 40, longHair ? 20 : 18, 0, 0, Math.PI * 2); g.fill()
        if (longHair) { g.fillRect(tx - 38, hyc - 22, 12, 40); g.fillRect(tx + 26, hyc - 22, 12, 40) }
        if (up) { g.beginPath(); g.ellipse(tx, hyc, 37, 34, 0, 0, Math.PI * 2); g.fill() }
        g.restore()
      }
      if (!up) {
        var ex = 12, ey = hyc + 4 + ty * .4, big = shooting ? 7.2 : 8.2
        var squint = shooting ? .35 : (Math.sin(T * .9) > .985 ? .8 : 0)
        ;[-1, 1].forEach(function (q) {
          var x = tx + q * ex + hx * 3
          A.eye(g, x, ey, big, { sc: tainted ? '#d8d0e0' : '#f4efe6', col: eyeCol, lx: hx * .5, ly: hy * .4, lid: squint, lc: skin, react: false, pu: 1.5 })
          var tl = shooting ? 22 : 14
          g.fillStyle = A.al('#8cc8e8', .9); g.beginPath(); g.moveTo(x - 2.4, ey + big * .8); g.lineTo(x + 2.4, ey + big * .8); g.lineTo(x + 3.4, ey + big * .8 + tl); g.lineTo(x - 3.4, ey + big * .8 + tl); g.fill()
          A.flat(g, x, ey + big * .8 + tl + 1, 3.4, 2.6, '#bfe4f4')
        })
        A.mouth(g, tx + hx * 3, hyc + 20 + ty * .3, shooting ? 7 : 5, shooting ? 6 : 1.2, { n: 0, tongue: shooting, col: '#4a1a22', tn: '#d4707e' })
        A.blush(g, tx - 26, hyc + 14, 6, '#d86a7a'); A.blush(g, tx + 26, hyc + 14, 6, '#d86a7a')
        if (/cain/.test(n)) { A.ball(g, tx + 12, ey, 9, 8, '#1a1418', { lw: 1.4 }); A.line(g, '#1a1418', 2, [tx - 30, hyc - 12, tx + 14, ey - 3]) }
        if (/lilith/.test(n)) A.rect(g, tx - 26, ey - 5, 52, 10, '#1a1418', 2)
        if (/eve/.test(n)) A.poly(g, [tx - 8, hyc - 34, tx, hyc - 28, tx + 8, hyc - 34, tx, hyc - 38], '#a01a2a')
        if (/samson/.test(n)) A.line(g, '#3a2418', 5, [tx - 14, hyc + 27, tx, hyc + 33, tx + 14, hyc + 27])
        if (/lazarus/.test(n)) A.line(g, '#cfc8b0', 3, [tx - 30, hyc - 8, tx + 30, hyc - 14])
        if (/magdalene/.test(n)) A.heart(g, tx + 24, hyc - 26, 5, 8, '#c82a3a')
        if (/keeper/.test(n)) { A.rect(g, tx - 28, hyc - 36, 56, 22, '#8a6a30', 3); A.flat(g, tx, hyc - 25, 4, 4, '#201810') }
        if (/bethany/.test(n)) A.halo(g, tx, hyc - 42, 14, 4, '#f8e8a0')
        if (/lost/.test(n)) A.halo(g, tx, hyc - 42, 14, 4, '#f8f4d0')
        if (/blue|\?\?\?/.test(n)) A.veins(g, tx, hyc, 34, '#4a5a78', 4, 3)
      }
    }
    if (tainted) { A.stitches(g, tx - 22, hyc - 18, tx + 22, hyc - 24, 6, '#2a2030', 3); A.flat(g, tx + 18, hyc + 12, 4, 4, '#d8c14c') }
    g.restore()
  }
  ;(IS.characters || []).forEach(function (d) { var draw = function (g, s, t) { g.save(); g.scale(s / 100, s / 100); g.translate(0, 4); child(g, s, t, d); g.restore() }; if (!IS.sprite(d.id)) IS.defineSprite(d.id, draw); if (!IS.sprite('player:' + d.id)) IS.defineSprite('player:' + d.id, draw); IS.spriteAnimated(d.id); IS.spriteAnimated('player:' + d.id) })

  function pickup (kind) { return function (g, s, t) {
    var k = kind.toLowerCase(), base = bodyColour(t, /gold/.test(k) ? '#d8ad39' : /soul/.test(k) ? '#75b9d0' : /black/.test(k) ? '#25222b' : '#9d2f35')
    if (/coin|penny|nickel|dime/.test(k)) { g.fillStyle = '#6f4b20'; oval(g, 0, 0, s * .4, s * .4); g.fillStyle = base; oval(g, 0, 0, s * .32, s * .32); line(g, '#f0d370', s * .04, [0, -s * .2, 0, s * .2]) }
    else if (/key/.test(k)) { line(g, base, s * .14, [0, -s * .3, 0, s * .35]); g.strokeStyle = base; g.lineWidth = s * .1; g.beginPath(); g.arc(0, -s * .3, s * .17, 0, Math.PI * 2); g.stroke(); line(g, base, s * .1, [0, s * .2, s * .2, s * .2, s * .2, s * .35]) }
    else if (/bomb/.test(k)) { g.fillStyle = '#27292b'; oval(g, 0, s * .06, s * .36, s * .36); line(g, '#73502a', s * .05, [s * .12, -s * .24, s * .25, -s * .48]); g.fillStyle = '#f0ad32'; oval(g, s * .28, -s * .5, s * .07, s * .07) }
    else if (/heart/.test(k)) { g.fillStyle = base; g.beginPath(); g.moveTo(0, s * .42); g.bezierCurveTo(-s * .5, s * .12, -s * .45, -s * .35, 0, -s * .1); g.bezierCurveTo(s * .45, -s * .35, s * .5, s * .12, 0, s * .42); g.fill() }
    else if (/pill/.test(k)) { g.save(); g.rotate(-.55); g.fillStyle = base; g.beginPath(); g.roundRect(-s * .42, -s * .18, s * .84, s * .36, s * .18); g.fill(); g.fillStyle = '#d7d4be'; g.fillRect(0, -s * .18, s * .24, s * .36); g.restore() }
    else if (/chest|sack/.test(k)) { g.fillStyle = base; g.fillRect(-s * .4, -s * .18, s * .8, s * .52); g.fillStyle = IS.shade ? IS.shade(base, .25) : '#d8b06a'; g.fillRect(-s * .42, -s * .3, s * .84, s * .2); g.fillStyle = '#3d2b20'; g.fillRect(-s * .05, -s * .08, s * .1, s * .22) }
    else { g.fillStyle = base; oval(g, 0, 0, s * .36, s * .36); line(g, '#eee5cf', s * .06, [-s * .18, 0, s * .18, 0]) }
  } }
  var pickups = ['penny','nickel','dime','lucky-penny','coin','key','golden-key','bomb','golden-bomb','red-heart','half-heart','soul-heart','black-heart','eternal-heart','gold-heart','bone-heart','rotten-heart','broken-heart','blended-heart','battery','mega-battery','card','pill','rune','trinket','sack','chest','golden-chest','spiked-chest','mimic-chest','red-chest','haunted-chest','old-chest','mega-chest','bomb-chest']
  pickups.forEach(function (n) { if (!IS.sprite(n)) IS.defineSprite(n, pickup(n)) })
  IS.defineSprite('item-pedestal', function (g, s, t) { g.fillStyle = bodyColour(t, '#77716a'); g.fillRect(-s * .32, s * .08, s * .64, s * .3); g.fillStyle = '#a49b8c'; g.fillRect(-s * .42, -s * .02, s * .84, s * .14); g.fillStyle = IS.alpha ? IS.alpha('#e2cc75', .25) : '#786d43'; oval(g, 0, -s * .2, s * .35, s * .12) })

  function grid (name) { return function (g, s, t) { var n = name.toLowerCase(); if (/pit/.test(n)) { g.fillStyle = '#171619'; oval(g, 0, .08 * s, .48 * s, .34 * s); g.strokeStyle = '#51453d'; g.lineWidth = .07 * s; g.stroke(); return } if (/spike/.test(n)) { g.fillStyle = '#a39b8a'; for (var i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * s * .25 - s * .1, s * .35); g.lineTo(i * s * .25, -s * (.15 + .3 * (t.charge == null ? 1 : t.charge))); g.lineTo(i * s * .25 + s * .1, s * .35); g.fill() } return } var c = /poop/.test(n) ? '#6d4528' : /fire/.test(n) ? '#7a3927' : /water/.test(n) ? '#375d68' : '#665f58'; g.fillStyle = bodyColour(t, c); g.beginPath(); g.moveTo(-s * .42, s * .38); g.lineTo(-s * .34, -s * .32); g.lineTo(s * .3, -s * .4); g.lineTo(s * .43, s * .34); g.closePath(); g.fill(); line(g, IS.shade ? IS.shade(c, .25) : '#92877d', s * .045, [-s * .25, -s * .15, s * .2, s * .1]); if (/fire/.test(n)) { g.fillStyle = /blue/.test(n) ? '#61aada' : '#e6812e'; oval(g, 0, -s * .4, s * .18, s * (.2 + .04 * Math.sin(t.time * 9))) } } }
  Object.keys(IS.GRID_CHARS || {}).forEach(function (k) { var n = IS.GRID_CHARS[k]; if (typeof n !== 'string') n = k.toLowerCase().replace(/_/g, '-'); if (!IS.sprite(n)) IS.defineSprite(n, grid(n)); if (/fire/.test(n)) IS.spriteAnimated(n) })
  ;['rock','tinted-rock','skull-rock','metal-block','pillar','poop','red-poop','gold-poop','rainbow-poop','spikes','retracting-spikes','pit','pit-bridge','web','fireplace','blue-fireplace','tnt','key-block','locked-chest-spawn','mushroom','vase','water','crawlspace'].forEach(function (n) { if (!IS.sprite(n)) IS.defineSprite(n, grid(n)); if (/fireplace/.test(n)) IS.spriteAnimated(n) })

  function door (kind) { return function (g, s, t) {
    var n = kind.toLowerCase(), c = /treasure|gold/.test(n) ? '#b68b33' : /devil|boss/.test(n) ? '#74292c' : /angel/.test(n) ? '#ddd6b9' : '#69615a'
    var open = Math.max(0, Math.min(1, t.charge || 0))
    g.fillStyle = '#302724'; g.fillRect(-s * .56, -s * .62, s * 1.12, s * 1.22)
    g.fillStyle = '#594b43'; g.fillRect(-s * .5, -s * .56, s, s * .13); g.fillRect(-s * .5, s * .43, s, s * .13)
    g.fillStyle = '#151011'; g.beginPath(); g.roundRect(-s * .41, -s * .45, s * .82, s * .9, s * .12); g.fill()
    if (open < .98) { g.fillStyle = bodyColour(t, c); g.beginPath(); g.roundRect(-s * .36, -s * .4, s * .72 * (1 - open), s * .8, s * .06); g.fill(); g.strokeStyle = IS.shade ? IS.shade(c, -.35) : '#403934'; g.lineWidth = s * .045; g.stroke() }
    if (/locked|shop|treasure/.test(n) && open < .98) { g.fillStyle = '#d4b043'; oval(g, 0, 0, s * .1, s * .13); g.fillRect(-s * .035, 0, s * .07, s * .19) }
    if (/boss|devil/.test(n)) { g.fillStyle = '#e1c4a5'; for (var i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * s * .14, -s * .53); g.lineTo(i * s * .14 + s * .05, -s * .42); g.lineTo(i * s * .14 - s * .05, -s * .42); g.fill() } }
  } }
  ;(IS.DOOR_KIND_LIST || []).forEach(function (n) { if (!IS.sprite('door:' + n)) IS.defineSprite('door:' + n, door(n)); if (!IS.sprite(n + '-door')) IS.defineSprite(n + '-door', door(n)) })

  function projectile (name) { return function (g, s, t) { var n = name; if (/beam|laser/.test(n)) { g.fillStyle = /tech/.test(n) ? '#e94f45' : '#b5222d'; g.fillRect(-s * .55, -s * .1, s * 1.1, s * .2); return } if (/knife/.test(n)) { g.fillStyle = '#d4d0c5'; g.beginPath(); g.moveTo(-s * .45, s * .12); g.lineTo(s * .5, 0); g.lineTo(-s * .45, -s * .12); g.fill(); return } g.fillStyle = t.tint && t.tint !== '#fff' ? t.tint : /blood|enemy|explosion/.test(n) ? '#a92d35' : /holy|spark/.test(n) ? '#e5d56b' : '#78b9d0'; oval(g, 0, 0, s * (.32 + .05 * (+t.variant || 0)), s * .38); g.fillStyle = IS.alpha ? IS.alpha('#f4eee0', .55) : '#d9e7e8'; oval(g, -s * .1, -s * .13, s * .08, s * .1) } }
  ;['tear','player-tear','blood-tear','enemy-shot','brimstone-beam','tech-laser','knife','tear-splash','blood-splatter','poof','explosion-core','spark','holy-shield','charge-ring'].forEach(function (n) { if (!IS.sprite(n)) IS.defineSprite(n, projectile(n)) })
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
