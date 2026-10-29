;(function (IS) {
  'use strict'

  // ---------------------------------------------------------------------------
  // ISUCK — boss tuning. Runs after every boss file has registered: which
  // attacks each phase uses, which bosses fly, and hit points per chapter.
  // ---------------------------------------------------------------------------

  IS.applyBossTuning = function () {
    // [phase one, phase two] attack names; a third phase repeats the second list. The names are a
    // fixed vocabulary; boss.js re-scripts them per boss (Monstro's 'stompLine' is his big leap,
    // Mom's is her foot, Pin's 'teleportSlam' is his dive into a hole).
    var BOSSES = {
      // chapter one
      'monstro': [['hop', 'spreadShot'], ['hop', 'stompLine', 'spreadShot']],
      'larry-jr': [['chargeDash', 'creepPuddle'], ['chargeDash', 'creepPuddle', 'chargeDash']],
      'the-duke-of-flies': [['summonSwarm', 'screamPush'], ['summonSwarm', 'screamPush', 'spawnMinions']],
      'gemini': [['chaseFast', 'aimedShot'], ['chaseFast', 'aimedShot', 'spawnMinions']],
      'steven': [['chaseFast', 'aimedShot'], ['chaseFast', 'aimedShot', 'spawnMinions']],
      'blighted-ovum': [['chaseFast', 'aimedShot'], ['chaseFast', 'aimedShot', 'spawnMinions']],
      'dingle': [['chargeDash', 'spawnMinions'], ['chargeDash', 'chargeDash', 'spawnMinions']],
      'dangle': [['chargeDash', 'rainbowSpray'], ['chargeDash', 'rainbowSpray', 'spawnMinions']],
      'the-haunt': [['homingShots', 'spawnMinions'], ['homingShots', 'spawnMinions', 'homingShots']],
      'little-horn': [['bombDrop', 'teleportSlam'], ['bombDrop', 'teleportSlam', 'chargeDash']],
      'baby-plum': [['dashRingCombo', 'spinShot'], ['dashRingCombo', 'spinShot', 'delayedRings']],
      'famine': [['chargeDash', 'spreadShot'], ['chargeDash', 'spreadShot', 'summonSwarm']],
      'the-husk': [['summonSwarm', 'screamPush', 'spreadShot'], ['summonSwarm', 'screamPush', 'spreadShot', 'spawnMinions']],
      // downpour, dross
      'the-turdlings': [['hop', 'spreadShot'], ['hop', 'spreadShot', 'spawnMinions']],
      'turdlet': [['hop', 'spreadShot'], ['hop', 'creepPuddle', 'spreadShot']],
      'wormwood': [['teleportSlam', 'spreadShot'], ['teleportSlam', 'spreadShot', 'ringShot']],
      // chapter two
      'gurdy-jr': [['chargeDash', 'spawnMinions'], ['chargeDash', 'spreadShot', 'spawnMinions']],
      'fistula': [['ringShot', 'chargeDash'], ['ringShot', 'chargeDash', 'splitBody']],
      'widow': [['hop', 'creepPuddle'], ['hop', 'creepPuddle', 'spawnMinions']],
      'pin': [['teleportSlam', 'spreadShot'], ['teleportSlam', 'spreadShot', 'delayedRings']],
      'frail': [['teleportSlam', 'spreadShot'], ['teleportSlam', 'spreadShot', 'brimstoneBeam']],
      'chub': [['chargeDash', 'creepPuddle'], ['chargeDash', 'creepPuddle', 'chargeDash']],
      'c-h-a-d': [['chargeDash', 'spreadShot'], ['chargeDash', 'spreadShot', 'creepPuddle']],
      'carrion-queen': [['chargeDash', 'summonSwarm'], ['chargeDash', 'summonSwarm', 'ringShot']],
      'the-hollow': [['spreadShot', 'chargeDash'], ['spreadShot', 'chargeDash', 'ringShot']],
      'teratoma': [['spreadShot', 'spawnMinions'], ['spreadShot', 'spawnMinions', 'ringShot']],
      'the-bloat': [['spreadShot', 'ringShot'], ['spreadShot', 'ringShot', 'spawnMinions']],
      'the-wretched': [['spreadShot', 'spawnMinions'], ['spreadShot', 'ringShot', 'spawnMinions']],
      'peep': [['spreadShot', 'spawnMinions'], ['spreadShot', 'barrage', 'spawnMinions']],
      // mines, ashpit
      'the-pile': [['spawnMinions', 'spreadShot'], ['spawnMinions', 'spreadShot', 'ringShot']],
      'the-shell': [['chargeDash', 'ringShot'], ['chargeDash', 'ringShot', 'chargeDash']],
      'tuff-twins': [['chargeDash', 'spreadShot'], ['chargeDash', 'spreadShot', 'ringShot']],
      'horny-boys': [['chargeDash', 'spreadShot'], ['chargeDash', 'spreadShot', 'ringShot']],
      // chapter three
      'gurdy': [['spawnMinions', 'ringShot'], ['spawnMinions', 'ringShot', 'barrage']],
      'monstro-ii': [['hop', 'spreadShot', 'brimstoneBeam'], ['hop', 'stompLine', 'spreadShot', 'brimstoneBeam']],
      'gish': [['hop', 'spreadShot'], ['hop', 'spreadShot', 'creepPuddle']],
      'loki': [['teleportSlam', 'ringShot', 'spawnMinions'], ['teleportSlam', 'ringShot', 'teleportSlam', 'spawnMinions']],
      'lokii': [['teleportSlam', 'ringShot', 'spawnMinions'], ['teleportSlam', 'ringShot', 'teleportSlam', 'spawnMinions']],
      'the-stain': [['teleportSlam', 'spawnMinions'], ['teleportSlam', 'spawnMinions', 'spreadShot']],
      'rag-man': [['teleportSlam', 'spawnMinions'], ['teleportSlam', 'ringShot', 'spawnMinions']],
      'rag-mega': [['teleportSlam', 'spawnMinions'], ['teleportSlam', 'brimstoneBeam', 'spawnMinions']],
      'big-horn': [['bombDrop', 'teleportSlam'], ['bombDrop', 'teleportSlam', 'chargeDash']],
      'the-gate': [['spinShot', 'spawnMinions'], ['spinShot', 'ringShot', 'spawnMinions']],
      'the-cage': [['chargeDash', 'spreadShot'], ['chargeDash', 'spreadShot', 'ringShot']],
      'mega-maw': [['brimstoneBeam', 'spreadShot'], ['brimstoneBeam', 'spreadShot', 'spawnMinions']],
      'reap-creep': [['spreadShot', 'spawnMinions'], ['spreadShot', 'ringShot', 'spawnMinions']],
      'mom': [['stompLine', 'stompLine', 'fistSlam'], ['stompLine', 'fistSlam', 'spawnMinions']],
      // Mausoleum, Gehenna
      'the-heretic': [['spreadShot', 'teleportSlam'], ['spreadShot', 'ringShot', 'teleportSlam', 'summonSwarm']],
      'the-visage': [['homingShots', 'ringShot'], ['homingShots', 'ringShot', 'summonSwarm']],
      'the-adversary': [['teleportSlam', 'spreadShot'], ['teleportSlam', 'spreadShot', 'brimstoneBeam']],
      'sisters-vis': [['spreadShot', 'chargeDash'], ['spreadShot', 'chargeDash', 'ringShot']],
      'brownie': [['spreadShot', 'spawnMinions'], ['spreadShot', 'ringShot', 'spawnMinions']],
      'the-forsaken': [['chargeDash', 'spreadShot'], ['chargeDash', 'spreadShot', 'ringShot']],
      'the-scourge': [['tentacleWhip', 'spawnMinions'], ['tentacleWhip', 'ringShot', 'spawnMinions']],
      'the-fallen': [['chargeDash', 'spreadShot'], ['chargeDash', 'spreadShot', 'ringShot']],
      'krampus': [['chargeDash', 'spreadShot'], ['chargeDash', 'spreadShot', 'ringShot']],
      // Womb, Utero, Corpse
      'moms-heart': [['ringShot', 'spreadShot'], ['ringShot', 'spreadShot', 'summonSwarm']],
      'it-lives': [['ringShot', 'spreadShot'], ['ringShot', 'spreadShot', 'summonSwarm']],
      'the-matriarch': [['hop', 'creepPuddle'], ['hop', 'creepPuddle', 'summonSwarm']],
      'mama-gurdy': [['spawnMinions', 'ringShot'], ['spawnMinions', 'ringShot', 'fistSlam']],
      'colostomia': [['vomitStream', 'spawnMinions'], ['vomitStream', 'ringShot', 'spawnMinions']],
      'chimera': [['chargeDash', 'spreadShot'], ['chargeDash', 'spreadShot', 'ringShot']],
      'rotgut': [['vomitStream', 'spawnMinions'], ['vomitStream', 'ringShot', 'spawnMinions']],
      'mother': [['stompLine', 'ringShot', 'spreadShot'], ['stompLine', 'laserSweep', 'ringShot', 'spawnMinions']],
      // the end
      'satan': [['spreadShot', 'stompLine', 'spawnMinions'], ['spreadShot', 'stompLine', 'brimstoneBeam', 'spawnMinions']],
      'the-lamb': [['ringShot', 'laserSweep', 'spawnMinions'], ['ringShot', 'beamRing', 'laserSweep', 'spawnMinions']],
      'isaac': [['spreadShot', 'summonSwarm', 'ringShot'], ['chargeDash', 'spreadShot', 'summonSwarm', 'ringShot']],
      'blue-baby': [['spreadShot', 'ringShot', 'spinShot'], ['spreadShot', 'ringShot', 'homingShots', 'summonSwarm']],
      'hush': [['spinShot', 'ringShot', 'summonSwarm'], ['laserSweep', 'spinShot', 'summonSwarm', 'chaseFast']],
      'delirium': [['chargeDash', 'spreadShot', 'ringShot', 'teleportSlam'], ['hop', 'stompLine', 'spawnMinions', 'brimstoneBeam', 'bombDrop', 'chargeDash', 'spreadShot', 'ringShot']],
      'mega-satan': [['fistSlam', 'ringShot', 'laserSweep'], ['fistSlam', 'brimstoneBeam', 'ringShot', 'spawnMinions']],
      'the-beast': [['stompLine', 'beamRing', 'summonSwarm'], ['stompLine', 'brimstoneBeam', 'beamRing', 'teleportSlam']],
      'dogma': [['spinShot', 'laserSweep', 'ringShot'], ['spinShot', 'laserCross', 'homingShots', 'ringShot']],
      'ultra-famine': [['chargeDash', 'spreadShot', 'summonSwarm'], ['chargeDash', 'spreadShot', 'summonSwarm']],
      'ultra-pestilence': [['summonSwarm', 'spreadShot', 'spinShot'], ['summonSwarm', 'spreadShot', 'spinShot']],
      'ultra-war': [['bombDrop', 'chargeDash', 'spreadShot'], ['bombDrop', 'chargeDash', 'spreadShot']],
      'ultra-death': [['chargeDash', 'spreadShot', 'spawnMinions'], ['chargeDash', 'spreadShot', 'spawnMinions']],
      'ultra-greed': [['rockThrow', 'ringShot', 'summonSwarm'], ['rockThrow', 'ringShot', 'summonSwarm']],
      'ultra-greedier': [['rockThrow', 'ringShot', 'summonSwarm'], ['rockThrow', 'ringShot', 'summonSwarm']],
      'clutch': [['wallBounceShots', 'spawnMinions'], ['wallBounceShots', 'spawnMinions', 'ringShot']]
    }
    // Repentance hit points where I know them, best recollection elsewhere. These are the pre-trim values.
    var HP = {
      'monstro': 250, 'larry-jr': 200, 'the-duke-of-flies': 110, 'gemini': 180, 'steven': 180, 'blighted-ovum': 160, 'dingle': 250, 'dangle': 250,
      'the-haunt': 200, 'little-horn': 250, 'baby-plum': 160, 'famine': 270, 'the-husk': 350, 'the-turdlings': 270, 'turdlet': 150, 'wormwood': 250,
      'gurdy-jr': 250, 'fistula': 220, 'widow': 250, 'pin': 250, 'frail': 280, 'chub': 300, 'c-h-a-d': 300, 'carrion-queen': 300, 'the-hollow': 250,
      'teratoma': 300, 'the-bloat': 300, 'the-wretched': 300, 'peep': 300, 'the-pile': 300, 'the-shell': 450, 'tuff-twins': 400, 'horny-boys': 600,
      'gurdy': 450, 'monstro-ii': 450, 'gish': 400, 'loki': 350, 'lokii': 350, 'the-stain': 400, 'rag-man': 320, 'rag-mega': 450, 'big-horn': 400,
      'the-gate': 300, 'the-cage': 350, 'mega-maw': 350, 'reap-creep': 350, 'mom': 500,
      'the-heretic': 800, 'the-visage': 600, 'the-adversary': 500, 'sisters-vis': 400, 'brownie': 500, 'the-forsaken': 500, 'the-scourge': 600,
      'the-fallen': 400, 'krampus': 500, 'moms-heart': 600, 'it-lives': 650, 'the-matriarch': 600, 'mama-gurdy': 600, 'colostomia': 800,
      'chimera': 500, 'rotgut': 600, 'mother': 2400
    }
    // attack pacing, seconds between attacks (phase one, phase two)
    var COOLDOWN = { 'mom': [[.7, 1.1], [.5, .9]], 'monstro': [[.9, 1.5], [.7, 1.2]], 'the-duke-of-flies': [[1.2, 1.8], [1, 1.5]], 'the-husk': [[1.1, 1.7], [.9, 1.4]], 'the-haunt': [[1.4, 2.1], [1.2, 1.8]] }
    var FLYERS = /duke-of-flies|the-husk|haunt|famine|the-hollow|peep|frail|the-bloat|mega-maw|the-visage|blue-baby|hush|dogma|ultra-pestilence/
    ;(IS.bosses || []).forEach(function (b) {
      // where a boss can appear is whatever the floor boss pools say; the data rows' own lists are only a default
      var pooled = (IS.floors || []).filter(function (f) { return (f.bosses || []).indexOf(b.id) >= 0 }).map(function (f) { return f.id })
      b.stage = pooled
      var a = BOSSES[b.id]
      if (a && b.phases) {
        b.phases.forEach(function (ph, i) {
          var list = a[Math.min(i, a.length - 1)]
          ph.attacks = list; ph.weights = list.map(function () { return 1 })
        })
      }
      if (FLYERS.test(b.id)) b.flying = true
      if (HP[b.id]) b.hp = HP[b.id]
      if (COOLDOWN[b.id] && b.phases && b.phases.length === 2) { b.phases[0].cooldown = COOLDOWN[b.id][0]; b.phases[1].cooldown = COOLDOWN[b.id][1] }
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
