;(function (IS) {
  'use strict'

  // ---------------------------------------------------------------------------
  // ISUCK — enemy tuning. Runs after every enemy file has registered, and
  // rewrites the numbers that decide how a fight feels: hit points, speed and
  // which behaviour an enemy uses. Bosses are tuned in tuning-bosses.js.
  //
  // The generated rosters gave a Basement fly 38 HP (eleven tears at base
  // damage) and gave half the early enemies the wrong archetype. A starting
  // character deals 3.5 a tear at 2.7 tears a second, so the targets here are:
  //   fodder (flies)        1–2 tears
  //   standard enemies      3–4 tears
  //   tough enemies         5–8 tears
  // and every later chapter adds roughly a third on top.
  // ---------------------------------------------------------------------------

  // id: [hp, speed, archetype?, params?]
  var EARLY = {
    'fly': [5, 85, 'flyerDrift', { pull: .25 }],
    'attackfly': [5, 125, 'flyerChase'],
    'gaper': [10, 120, 'chaser', { jitter: .2 }],
    'frowning-gaper': [10, 135, 'chaser', { jitter: .25 }],
    'horf': [10, 0, 'shooter', { fireDelay: 1.5, shotSpeed: 330, windup: .4 }],
    'hopper': [10, 150, 'leaper', { hopDelay: .8, hopHeight: 60 }],
    'blurb': [15, 100, 'jumper', { hopDelay: 1.4 }],
    'clotty': [13, 80, 'sprayer', { fireDelay: 2, shotSpeed: 240 }],
    'charger': [13, 110, 'charger', { dashSpeed: 470, windup: .3 }],
    'drowned-charger': [15, 110, 'charger', { dashSpeed: 500, windup: .3 }],
    'boom-fly': [15, 140, 'exploder'],
    'mulligan': [15, 80, 'summoner', { fireDelay: 2.6, spawnCap: 3, spawns: 'fly' }],
    'mole': [12, 140, 'burrower', { submergeTime: 1.4 }],
    'grackle': [14, 70, 'spitter', { burstCount: 3, fireDelay: 2, shotSpeed: 260 }],
    'pooter': [8, 70, 'shooterMobile', { fireDelay: 1.8, shotSpeed: 280 }],
    // caves
    'hive': [25, 50, 'summoner', { fireDelay: 2.4, spawnCap: 3, spawns: 'attackfly' }],
    'nest': [22, 50, 'summoner', { fireDelay: 2.6, spawnCap: 2, spawns: 'fly' }],
    'vis': [20, 0, 'laserer', { fireDelay: 2.4, windup: .7 }],
    'maggot': [8, 70, 'chaserSlow'],
    'wall-creep': [16, 0, 'guard'],
    'black-globin': [18, 120, 'chaser'],
    'coal-boy': [18, 60, 'spinner'],
    'bony': [12, 90, 'shooterMobile', { fireDelay: 1.8, shotSpeed: 300 }],
    'swarmer': [12, 0, 'grid', { fireDelay: 2 }],
    'boil': [20, 0, 'shooter', { fireDelay: 1.4, burstCount: 1 }],
    'rock-spider': [12, 150, 'leaper', { hopDelay: .6 }],
    'fissure': [16, 140, 'burrower'],
    'poly': [16, 0, 'teleporter'],
    'cinder': [12, 140, 'exploder'],
    // depths
    'knight': [25, 90, 'shielded'],
    'selfless-knight': [25, 100, 'shielded'],
    'imp': [20, 0, 'teleporter', { fireDelay: 1.4 }],
    'poof': [14, 110, 'ghost'],
    'guts': [22, 80, 'trailLayer'],
    'snapper': [18, 160, 'charger', { dashSpeed: 520 }],
    'wall-hugger': [30, 0, 'guard'],
    'blood-puppy': [20, 140, 'chaser'],
    'wizoob': [18, 90, 'teleporter', { fireDelay: 1.6 }],
    'hell-bird': [18, 140, 'flyerDart'],
    'deaths-head': [30, 90, 'exploder'],
    'grudge-bat': [16, 150, 'flyerDart'],
    // womb
    'walking-sack': [30, 80, 'summoner', { spawns: 'attackfly' }],
    'gurgle': [26, 120, 'burrower'],
    'bloodshot-eye': [26, 0, 'laserer', { fireDelay: 2.2 }],
    'fly-bomb': [10, 150, 'exploder'],
    'conjoined-fatty': [40, 80, 'sprayer'],
    'lump': [24, 0, 'burrower'],
    'swinger': [26, 120, 'flyerOrbit'],
    'angelic-baby': [28, 120, 'teleporter'],
    'spitty': [24, 90, 'spitter', { burstCount: 3 }],
    'big-bony': [40, 80, 'shooterMobile', { burstCount: 3 }],
    'blood-hulk': [40, 90, 'chaser'],
    'null': [30, 0, 'teleporter']
  }

  // A sensible baseline for anything not listed, by archetype, before depth scaling.
  var BASE_HP = {
    flyerDrift: 6, flyerChase: 6, swarm: 4, flyerDart: 10, flyerOrbit: 10,
    chaser: 12, chaserSlow: 12, wanderer: 12, patroller: 12, charger: 14,
    leaper: 12, jumper: 16, shooter: 12, shooterMobile: 12, spitter: 14,
    sprayer: 14, laserer: 18, burrower: 16, teleporter: 16, splitter: 14,
    exploder: 12, summoner: 20, shielded: 24, trailLayer: 16, ghost: 14
  }
  var FLYING = /^(flyerDrift|flyerChase|flyerOrbit|flyerDart|swarm|ghost)$/

  function depthOf (e) {
    var d = 99
    ;(e.floors || []).forEach(function (fid) {
      var f = IS.floorsById ? IS.floorsById[fid] : null
      if (f && f.depth < d) d = f.depth
    })
    return d === 99 ? 5 : d
  }

  IS.applyEnemyTuning = function () {
    ;(IS.enemies || []).forEach(function (e) {
      var t = EARLY[e.id]
      if (t) {
        e.hp = t[0]
        e.speed = t[1] || 0
        if (t[2]) e.archetype = t[2]
        if (t[3]) e.params = Object.assign({}, e.params, t[3])
      } else {
        var d = depthOf(e)
        e.hp = Math.round((BASE_HP[e.archetype] || 14) * (1 + .3 * (d - 1)))
        e.speed = Math.max(60, Math.min(170, e.speed))
      }
      if (FLYING.test(e.archetype)) e.flying = true
      // keep bodies readable: nothing smaller than a tear-and-a-half
      e.r = Math.max(e.r || 18, e.flying ? 15 : 18)
    })
  }

  IS.applyEnemyTuning()
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
