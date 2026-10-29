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

  function child (g, s, t, def) {
    var n = ((def && def.name) || '').toLowerCase(); var tainted = !!(def && def.tainted)
    var skin = bodyColour(t, /azazel/.test(n) ? '#681f24' : /lost/.test(n) ? '#d9e0df' : /keeper/.test(n) ? '#b69652' : /blue|\?\?\?/.test(n) ? '#71858b' : '#c9957f')
    if (tainted) skin = IS.mix ? IS.mix(skin, '#342d39', .45) : '#765e68'
    var bob = (t.frame & 1) ? s * .025 : 0; var side = t.dir === 1 ? -s * .04 : t.dir === 3 ? s * .04 : 0
    g.fillStyle = IS.shade ? IS.shade(skin, -.3) : '#563b38'; oval(g, 0, s * .2 + bob, s * .19, s * .25)
    line(g, IS.shade ? IS.shade(skin, -.35) : '#553b38', s * .075, [-s * .1, s * .32, -s * .15, s * .5 + bob]); line(g, g.strokeStyle, s * .075, [s * .1, s * .32, s * .15, s * .5 - bob])
    g.fillStyle = skin; oval(g, side, -s * .13 + bob, s * .38, s * .34)
    if (/magdalene|eve|lazarus|eden|lilith/.test(n)) { g.fillStyle = /eve|lilith/.test(n) ? '#211b20' : '#633b29'; g.beginPath(); g.arc(side, -s * .17, s * .38, Math.PI, Math.PI * 2); g.lineTo(side + s * .34, 0); g.lineTo(side - s * .34, 0); g.fill() }
    g.fillStyle = '#211b20'; var ey = -s * .14; oval(g, side - s * .13, ey, s * .035, s * .055); oval(g, side + s * .13, ey, s * .035, s * .055)
    if (/cain/.test(n)) { g.fillRect(side + s * .05, ey - s * .05, s * .18, s * .1); line(g, '#211b20', s * .025, [side, ey - s * .08, side + s * .25, ey + s * .07]) }
    if (/lilith/.test(n)) { g.fillStyle = '#1d171b'; g.fillRect(side - s * .26, ey - s * .06, s * .52, s * .13) }
    if (/forgotten/.test(n)) { g.fillStyle = '#e2d8bd'; oval(g, side, -s * .13, s * .35, s * .31); line(g, '#e2d8bd', s * .07, [s * .2, s * .2, s * .48, -s * .2]) }
    if (/azazel/.test(n)) { g.fillStyle = '#21171b'; g.beginPath(); g.moveTo(-s * .24, -s * .38); g.lineTo(-s * .08, -s * .62); g.lineTo(-s * .02, -s * .34); g.fill(); g.beginPath(); g.moveTo(s * .24, -s * .38); g.lineTo(s * .08, -s * .62); g.lineTo(s * .02, -s * .34); g.fill() }
    g.fillStyle = IS.alpha ? IS.alpha('#78b9cf', .75) : '#78b9cf'; oval(g, side - s * .13, ey + s * .1, s * .025, s * .11)
    if (tainted) { g.fillStyle = '#d8c14c'; oval(g, side, s * .02, s * .045, s * .045) }
  }
  ;(IS.characters || []).forEach(function (d) { var draw=function (g,s,t) { child(g,s,t,d) }; if (!IS.sprite(d.id)) IS.defineSprite(d.id,draw); if (!IS.sprite('player:'+d.id)) IS.defineSprite('player:'+d.id,draw) })

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
