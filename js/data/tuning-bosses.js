;(function (IS) {
  'use strict'

  // ---------------------------------------------------------------------------
  // ISUCK — boss tuning. Runs after every boss file has registered: which
  // attacks each phase uses, which bosses fly, and hit points per chapter.
  // ---------------------------------------------------------------------------

  IS.applyBossTuning = function () {
    // [phase one, phase two] attack names. The names are a fixed vocabulary; boss.js
    // re-scripts them per boss (Monstro's 'stompLine' is his big leap, Mom's is her foot).
    var BOSSES = {
      'monstro': [['hop', 'spreadShot'], ['hop', 'stompLine', 'spreadShot']],
      'larry-jr': [['chargeDash', 'creepPuddle'], ['chargeDash', 'creepPuddle', 'chargeDash']],
      'the-duke-of-flies': [['summonSwarm', 'screamPush'], ['summonSwarm', 'screamPush', 'spawnMinions']],
      'gemini': [['chaseFast', 'aimedShot'], ['chaseFast', 'aimedShot', 'spawnMinions']],
      'steven': [['chaseFast', 'spreadShot'], ['chaseFast', 'burstShot', 'spreadShot']],
      'dingle': [['chargeDash', 'spawnMinions'], ['chargeDash', 'chargeDash', 'spawnMinions']],
      'dangle': [['chargeDash', 'rainbowSpray'], ['chargeDash', 'rainbowSpray', 'spawnMinions']],
      'blighted-ovum': [['spawnMinions', 'ringShot'], ['chargeDash', 'ringShot', 'spawnMinions']],
      'the-haunt': [['homingShots', 'spawnMinions'], ['vomitStream', 'homingShots', 'spawnMinions']],
      'little-horn': [['bombDrop', 'teleportSlam'], ['bombDrop', 'teleportSlam', 'chargeDash']],
      'baby-plum': [['dashRingCombo', 'spinShot'], ['dashRingCombo', 'spinShot', 'delayedRings']],
      'famine': [['chargeDash', 'summonSwarm'], ['chargeDash', 'summonSwarm', 'barrage']],
      'gurdy-jr': [['chargeDash', 'spreadShot'], ['chargeDash', 'spreadShot', 'summonSwarm']],
      'fistula': [['ringShot', 'chargeDash'], ['ringShot', 'chargeDash', 'splitBody']],
      'widow': [['hop', 'creepPuddle'], ['hop', 'creepPuddle', 'spawnMinions']],
      'pin': [['teleportSlam', 'spreadShot'], ['teleportSlam', 'spreadShot', 'delayedRings']],
      'gurdy': [['spawnMinions', 'ringShot'], ['spawnMinions', 'ringShot', 'barrage']],
      'monstro-ii': [['hop', 'spreadShot', 'brimstoneBeam'], ['hop', 'stompLine', 'spreadShot', 'brimstoneBeam']],
      'chub': [['chargeDash', 'creepPuddle'], ['chargeDash', 'creepPuddle', 'spawnMinions']],
      'the-hollow': [['spreadShot', 'chargeDash'], ['spreadShot', 'chargeDash', 'ringShot']],
      'carrion-queen': [['chargeDash', 'summonSwarm'], ['chargeDash', 'summonSwarm', 'ringShot']],
      'peep': [['spreadShot', 'spawnMinions'], ['spreadShot', 'barrage', 'spawnMinions']],
      'moms-heart': [['ringShot', 'spreadShot'], ['ringShot', 'spreadShot', 'summonSwarm']],
      'it-lives': [['ringShot', 'spreadShot'], ['ringShot', 'spreadShot', 'summonSwarm']],
      'mom': [['stompLine', 'stompLine', 'fistSlam'], ['stompLine', 'fistSlam', 'spawnMinions']]
    }
    // Repentance hit points where they are known; everything else keeps its data value.
    var HP = { 'monstro': 250, 'the-duke-of-flies': 110, 'larry-jr': 200, 'gemini': 180, 'dingle': 250, 'mom': 500 }
    // attack pacing, seconds between attacks (phase one, phase two)
    var COOLDOWN = { 'mom': [[.7, 1.1], [.5, .9]], 'monstro': [[.9, 1.5], [.7, 1.2]], 'the-duke-of-flies': [[1.2, 1.8], [1, 1.5]] }
    var FLYERS = /duke-of-flies|haunt|famine|the-hollow|peep|frail|the-bloat|mega-maw/
    ;(IS.bosses || []).forEach(function (b) {
      var a = BOSSES[b.id]
      if (a && b.phases && b.phases.length >= 2) {
        b.phases[0].attacks = a[0]; b.phases[0].weights = a[0].map(function () { return 1 })
        b.phases[1].attacks = a[1]; b.phases[1].weights = a[1].map(function () { return 1 })
      }
      if (FLYERS.test(b.id)) b.flying = true
      if (HP[b.id]) b.hp = HP[b.id]
      if (COOLDOWN[b.id] && b.phases && b.phases.length >= 2) { b.phases[0].cooldown = COOLDOWN[b.id][0]; b.phases[1].cooldown = COOLDOWN[b.id][1] }
      // Baby Plum runs for it when nearly beaten, still spitting spin shots
      if (b.id === 'baby-plum' && b.phases.length === 2) {
        b.phases[1].hpAbove = .2
        b.phases.push({ hpAbove: 0, attacks: ['spinShot'], weights: [1], cooldown: [.7, 1.1], speedMult: 1.3, flee: true })
      }
      // chapter two bosses were set up for a character three items in; trim them
      var d = 99
      ;(b.stage || []).forEach(function (fid) { var f = IS.floorsById && IS.floorsById[fid]; if (f && f.depth < d) d = f.depth })
      if (d >= 3 && d <= 4) b.hp = Math.round(b.hp * .72)
      if (!b.speed) b.speed = b.flying ? 110 : 95
    })
  }

  IS.applyBossTuning()
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
