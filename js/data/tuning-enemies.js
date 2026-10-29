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
    'gaper': [10, 115, 'chaser', { jitter: .04, accel: 700 }],
    'gusher': [14, 150, 'wanderer', { turnDelay: 1.2 }],
    'fatty': [24, 55, 'chaserSlow', { r: 24 }],
    'frowning-gaper': [12, 150, 'chaser', { jitter: .04, accel: 900 }],
    'horf': [10, 0, 'shooter', { fireDelay: 1.6, shotSpeed: 300, windup: .4 }],
    'hopper': [10, 150, 'leaper', { hopDelay: .5, hopHeight: 42, hopReach: 130, hopTime: .38 }],
    'blurb': [15, 100, 'jumper', { hopDelay: 1.4 }],
    'clotty': [13, 110, 'sprayer', { fireDelay: 2.2, shotSpeed: 240 }],
    'charger': [13, 110, 'charger', { dashSpeed: 470, windup: .3 }],
    'drowned-charger': [15, 110, 'charger', { dashSpeed: 500, windup: .3 }],
    'boom-fly': [15, 140, 'exploder', { flying: true }],
    'red-boom-fly': [20, 120, 'exploder', { flying: true }],
    'drowned-boom-fly': [18, 140, 'exploder', { flying: true }],
    'mulliboom': [12, 100, 'exploder'],
    'mulligan': [15, 95, 'summoner', { fireDelay: 2.8, spawnCap: 3, spawns: 'fly', r: 22 }],
    'mole': [12, 140, 'burrower', { submergeTime: 1.4, pattern: 'aimed' }],
    'round-worm': [16, 105, 'burrower', { submergeTime: 1.3, pattern: 'aimed' }],
    'night-crawler': [21, 120, 'burrower', { submergeTime: 1.2, pattern: 'aimed' }],
    'grackle': [14, 70, 'spitter', { burstCount: 3, fireDelay: 2, shotSpeed: 260 }],
    'pooter': [8, 60, 'shooterMobile', { fireDelay: 2, shotSpeed: 270, flying: true, pull: .1 }],
    'globin': [14, 105, 'chaser'],
    // caves
    'hive': [25, 50, 'summoner', { fireDelay: 2.4, spawnCap: 3, spawns: 'attackfly' }],
    'nest': [22, 50, 'summoner', { fireDelay: 2.6, spawnCap: 2, spawns: 'fly' }],
    'vis': [20, 45, 'laserer', { fireDelay: 2.4, windup: .7 }],
    'maggot': [8, 60, 'chaserSlow'],
    'wall-creep': [16, 60, 'guard', { fireDelay: 2.2, shotSpeed: 260 }],
    'black-globin': [18, 120, 'chaser'],
    'coal-boy': [18, 60, 'spinner'],
    'bony': [12, 85, 'shooterMobile', { fireDelay: 1.8, shotSpeed: 300, burstCount: 1 }],
    'swarmer': [12, 0, 'grid', { fireDelay: 2 }],
    'boil': [20, 0, 'shooter', { fireDelay: 1.4, burstCount: 1 }],
    'rock-spider': [12, 150, 'leaper', { hopDelay: .6 }],
    'fissure': [16, 140, 'burrower'],
    'poly': [16, 0, 'teleporter'],
    'cinder': [12, 140, 'exploder'],
    // depths
    'knight': [25, 80, 'shielded', { turn: 1.8, r: 20 }],
    'selfless-knight': [25, 95, 'shielded', { turn: 2, r: 20 }],
    'floating-knight': [40, 70, 'shielded', { turn: 1.8, flying: true, r: 20 }],
    'loose-knight': [40, 95, 'shielded', { turn: 2 }],
    'imp': [20, 0, 'teleporter', { fireDelay: 1.4 }],
    'poof': [14, 110, 'ghost'],
    'guts': [22, 80, 'trailLayer'],
    'snapper': [18, 160, 'charger', { dashSpeed: 520 }],
    'wall-hugger': [30, 70, 'guard', { fireDelay: 2.4, shotSpeed: 260 }],
    'blood-puppy': [20, 140, 'chaser'],
    'wizoob': [18, 90, 'teleporter', { fireDelay: 1.6 }],
    'hell-bird': [18, 140, 'flyerDart'],
    'deaths-head': [30, 95, 'flyerChase'],
    'grudge-bat': [16, 150, 'flyerDart'],
    // womb
    'walking-sack': [30, 80, 'summoner', { spawns: 'attackfly' }],
    'gurgle': [26, 120, 'burrower'],
    'bloodshot-eye': [26, 0, 'shooter', { fireDelay: 2, burstCount: 3, windup: .6, shotSpeed: 250 }],
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

  // Whether an enemy flies is a property of the Isaac enemy, not of the archetype
  // it used to be filed under. Per-id overrides win over the archetype regex.
  var FLIES = ('fly attackfly pot pooter super-pooter sucker blue-sucker soul-sucker dinga para-bite tumor blue-tumor revenant ' +
    'spiked-revenant ministro red-ghost poof lil-haunt reaper fred poison-mind hell-bird grudge-bat fat-bat deaths-head ' +
    'cursed-deaths-head red-floater locust-of-famine locust-of-pestilence locust-of-war locust-of-death willo hanger one-tooth ' +
    'eternal-fly eternal-heart-fly angelic-baby molten-baby pride super-pride ultra-pride moms-hand moms-dead-hand swinger ' +
    'boom-fly red-boom-fly drowned-boom-fly fly-bomb floating-knight').split(' ')
  var GROUND = ('nerve-ending maw psychic-maw black-maw blue-maw mr-maw gaping-maw ash-pile null wrath super-wrath').split(' ')

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
      if (FLYING.test(e.archetype) || (e.params && e.params.flying)) e.flying = true
      if (FLIES.indexOf(e.id) > -1) e.flying = true
      if (GROUND.indexOf(e.id) > -1) e.flying = false
      if (t && t[3] && t[3].r) e.r = t[3].r
      // Sack and Keeper share their names with a pickup and a character
      if (e.id === 'sack' || e.id === 'keeper') e.sprite = e.id + '-enemy'
      // keep bodies readable: nothing smaller than a tear-and-a-half
      e.r = Math.max(e.r || 18, e.flying ? 15 : 18)
    })
  }

  IS.applyEnemyTuning()
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
