;(function (IS) {
  'use strict'

  // ---------------------------------------------------------------------------
  // ISUCK — boss tuning. Runs after every boss file has registered: which
  // attacks each phase uses, which bosses fly, and hit points per chapter.
  // ---------------------------------------------------------------------------

  IS.applyBossTuning = function () {
    var BOSSES = {
      'monstro': [['hop', 'vomitStream'], ['hop', 'vomitStream', 'barrage']],
      'larry-jr': [['chargeDash', 'creepPuddle'], ['chargeDash', 'creepPuddle', 'spawnMinions']],
      'the-duke-of-flies': [['summonSwarm', 'ringShot'], ['summonSwarm', 'screamPush', 'ringShot']],
      'gemini': [['chargeDash', 'spawnMinions'], ['chaseFast', 'aimedShot', 'spawnMinions']],
      'steven': [['chaseFast', 'spreadShot'], ['chaseFast', 'burstShot', 'spreadShot']],
      'dingle': [['chargeDash', 'spreadShot'], ['chargeDash', 'spreadShot', 'spawnMinions']],
      'dangle': [['chargeDash', 'rainbowSpray'], ['chargeDash', 'rainbowSpray', 'spawnMinions']],
      'blighted-ovum': [['spawnMinions', 'ringShot'], ['chargeDash', 'ringShot', 'spawnMinions']],
      'the-haunt': [['homingShots', 'spawnMinions'], ['vomitStream', 'homingShots', 'spawnMinions']],
      'little-horn': [['bombDrop', 'teleportSlam'], ['bombDrop', 'teleportSlam', 'spreadShot']],
      'baby-plum': [['dashRingCombo', 'spinShot'], ['dashRingCombo', 'spinShot', 'delayedRings']],
      'famine': [['chargeDash', 'summonSwarm'], ['chargeDash', 'summonSwarm', 'barrage']],
      'gurdy-jr': [['chargeDash', 'spreadShot'], ['chargeDash', 'spreadShot', 'summonSwarm']],
      'fistula': [['ringShot', 'chargeDash'], ['ringShot', 'chargeDash', 'splitBody']],
      'widow': [['hop', 'creepPuddle'], ['hop', 'creepPuddle', 'spawnMinions']],
      'pin': [['teleportSlam', 'spreadShot'], ['teleportSlam', 'spreadShot', 'delayedRings']],
      'gurdy': [['spawnMinions', 'ringShot'], ['spawnMinions', 'ringShot', 'barrage']],
      'monstro-ii': [['hop', 'vomitStream', 'brimstoneBeam'], ['hop', 'vomitStream', 'brimstoneBeam', 'spawnMinions']],
      'mom': [['stompLine', 'spawnMinions'], ['stompLine', 'fistSlam', 'spawnMinions']]
    }
    var FLYERS = /duke-of-flies|haunt|famine|the-hollow|peep|frail|the-bloat|mega-maw/
    ;(IS.bosses || []).forEach(function (b) {
      var a = BOSSES[b.id]
      if (a && b.phases && b.phases.length >= 2) {
        b.phases[0].attacks = a[0]; b.phases[0].weights = a[0].map(function () { return 1 })
        b.phases[1].attacks = a[1]; b.phases[1].weights = a[1].map(function () { return 1 })
      }
      if (FLYERS.test(b.id)) b.flying = true
      // chapter two bosses were set up for a character three items in; trim them
      var d = 99
      ;(b.stage || []).forEach(function (fid) { var f = IS.floorsById && IS.floorsById[fid]; if (f && f.depth < d) d = f.depth })
      if (d >= 3 && d <= 4) b.hp = Math.round(b.hp * .72)
      if (!b.speed) b.speed = b.flying ? 110 : 95
    })
  }

  IS.applyBossTuning()
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
