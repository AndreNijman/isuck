;(function (IS) {
  'use strict'

  // ---------------------------------------------------------------------------
  // ISUCK — constants, enums and every content registry.
  //
  // This file must load first. It creates the registries that the data files in
  // js/data/ push into, and freezes the vocabularies that
  // tools/validate-content.mjs checks against. Adding a value to one of the
  // *_LIST arrays below is the only legal way to widen a vocabulary — see
  // ARCHITECTURE.md §5.2 through §8.5.
  // ---------------------------------------------------------------------------

  IS.VERSION = '1.0.0'

  // --- space and time --------------------------------------------------------
  IS.TILE = 80
  IS.ROOM_W = 13
  IS.ROOM_H = 7
  IS.ROOM_PX_W = IS.ROOM_W * IS.TILE // 1040
  IS.ROOM_PX_H = IS.ROOM_H * IS.TILE // 560
  IS.WALL = 80
  IS.VIEW_W = 1280
  IS.VIEW_H = 720
  IS.DT = 1 / 60
  IS.FPS = 60

  // --- reference stats -------------------------------------------------------
  IS.BASE_DAMAGE = 3.5
  IS.BASE_DELAY_FRAMES = 10
  IS.BASE_TEARS = 30 / (IS.BASE_DELAY_FRAMES + 1) // 2.7273 shots/s
  IS.BASE_RANGE = 520
  IS.BASE_SHOT_SPEED = 1
  IS.TEAR_SPEED = 620 // units/s at shotSpeed 1
  IS.BASE_SPEED = 1
  IS.MOVE_SPEED = 300 // units/s at speed 1
  IS.SPEED_CAP = 2
  IS.TEARS_CAP = 30
  IS.BASE_BOMB_DAMAGE = 60
  IS.PLAYER_R = 26
  IS.INVULN_TIME = 0.9
  IS.MAX_HEART_CONTAINERS = 24 // half-hearts (12 containers)
  IS.MAX_SOUL_HEARTS = 24
  IS.PICKUP_CAP = 99

  // --- room geometry helpers (values only; functions live in math.js) --------
  IS.DIRS = ['left', 'right', 'up', 'down']
  IS.DIR_VEC = {
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 }
  }
  IS.DIR_OPPOSITE = { left: 'right', right: 'left', up: 'down', down: 'up' }

  IS.SHAPES = {
    '1x1': { w: 13, h: 7 },
    '1x2': { w: 13, h: 14 },
    '2x1': { w: 26, h: 7 },
    '2x2': { w: 26, h: 14 },
    LTL: { w: 26, h: 14, missing: 'tl' },
    LTR: { w: 26, h: 14, missing: 'tr' },
    LBL: { w: 26, h: 14, missing: 'bl' },
    LBR: { w: 26, h: 14, missing: 'br' }
  }
  IS.SHAPE_LIST = Object.keys(IS.SHAPES)

  // --- vocabularies (frozen — see ARCHITECTURE.md) ---------------------------

  IS.HOOK_LIST = [
    'onInit', 'onRemove', 'onStats', 'onUpdate',
    'onTearFire', 'onTearHit', 'onTearDeath',
    'onEnemyDamage', 'onEnemyKill',
    'onPlayerDamage', 'onPlayerDeath',
    'onRoomEnter', 'onRoomClear', 'onNewFloor', 'onFloorClear',
    'onPickup', 'onBombExplode', 'onGridBreak',
    'onUse', 'onCardUse', 'onPillUse', 'onPurchase', 'onDoorOpen', 'onCurseEval'
  ]

  IS.STAT_KEYS = [
    'damage', 'tears', 'fireDelay', 'range', 'shotSpeed', 'speed', 'luck',
    'tearSize', 'multishot', 'devilChance', 'angelChance', 'bombDamage',
    'shieldCount'
  ]

  IS.MULT_KEYS = ['damage', 'fireDelay', 'range', 'shotSpeed', 'speed', 'tearSize', 'bombDamage']

  IS.GRANT_KEYS = [
    'maxHearts', 'heal', 'soul', 'black', 'bone', 'eternal', 'gold', 'rotten',
    'broken', 'bombs', 'keys', 'coins', 'cards', 'pills', 'runes', 'trinkets',
    'goldenBomb', 'goldenKey', 'charge'
  ]

  IS.TEAR_FLAG_LIST = [
    'piercing', 'spectral', 'homing', 'bouncing', 'splitting', 'continuous', 'explosive',
    'poison', 'burn', 'freeze', 'slow', 'charm', 'fear', 'confusion',
    'bleed', 'shrink', 'petrify', 'baited', 'magnetize', 'midas', 'knockback',
    'light', 'holy', 'ice', 'rock', 'booger', 'sticky', 'lodge',
    'tinyplanet', 'wiggle', 'sinusoid', 'boomerang', 'chain', 'orbit', 'spin',
    'laser', 'brimstone', 'knife', 'ludo', 'cupid', 'technology', 'godhead',
    'lump', 'pop', 'nail', 'glitter', 'black-hole', 'quad-shot'
  ]

  IS.PLAYER_FLAG_LIST = [
    'flying', 'spectralTears', 'piercingTears', 'homingTears', 'ignoreRocks',
    'noRedHearts', 'keeperHearts', 'boneHearts', 'soulOnly', 'cantHeal',
    'brimstone', 'laser', 'knife', 'bookOfVirtues', 'bloodOath',
    'seeSecretRooms', 'seeItemPools', 'seeEnemyHealth', 'seeMinimap', 'fullMinimap',
    'freeDevilDeals', 'freeShopItems', 'cursedDoors', 'luckyFooting', 'noKnockback',
    'doubleTears', 'quadTears', 'eternalDeath', 'gnawedLeaf', 'camoUndies'
  ]

  IS.STATUS_LIST = [
    'poison', 'burn', 'freeze', 'slow', 'charm', 'fear', 'confusion',
    'bleed', 'shrink', 'petrify', 'baited', 'magnetize', 'midas', 'ice', 'sticky'
  ]

  IS.POOL_LIST = [
    'treasure', 'shop', 'boss', 'devil', 'angel', 'secret', 'library', 'curse',
    'golden-chest', 'red-chest', 'beggar', 'demon-beggar', 'key-master',
    'battery-bum', 'moms-chest', 'crane-game', 'bomb-bum', 'planetarium',
    'old-chest', 'baby-shop', 'wooden-chest', 'rotten-beggar', 'ultra-secret',
    'greed-treasure', 'greed-boss', 'greed-shop', 'greed-devil', 'greed-angel',
    'greed-curse', 'greed-secret', 'greed-library'
  ]

  IS.ROOM_TYPE_LIST = [
    'default', 'treasure', 'shop', 'boss', 'secret', 'super-secret',
    'ultra-secret', 'curse', 'sacrifice', 'arcade', 'library', 'devil', 'angel',
    'challenge', 'boss-rush', 'dice', 'planetarium', 'vault', 'bedroom',
    'dirty-bedroom', 'black-market', 'miniboss', 'error', 'start', 'crawlspace',
    'boss-double', 'mineshaft', 'chest-room', 'ascent-mirror'
  ]

  IS.DOOR_KIND_LIST = [
    'normal', 'treasure', 'shop', 'boss', 'secret', 'super-secret',
    'ultra-secret', 'devil', 'angel', 'curse', 'arcade', 'library', 'sacrifice',
    'challenge', 'boss-rush', 'dice', 'planetarium', 'vault', 'bedroom',
    'black-market', 'mineshaft', 'locked', 'mom-locked'
  ]

  IS.GRID_CHARS = {
    '.': 'empty', '#': 'rock', x: 'tinted-rock', X: 'marked-skull', M: 'metal',
    B: 'pillar', P: 'poop', G: 'golden-poop', R: 'red-poop', C: 'corn-poop',
    S: 'spikes', s: 'retract-spikes', O: 'pit', o: 'pit-bridge', W: 'web',
    F: 'fire', f: 'blue-fire', T: 'tnt', K: 'key-block', L: 'locked-chest',
    H: 'mushroom', V: 'vase', '~': 'water', '%': 'crawlspace', '!': 'pickup',
    $: 'shop-slot', '@': 'safe'
  }

  IS.ARCHETYPE_LIST = [
    'idle', 'chaser', 'chaserSlow', 'wanderer', 'patroller', 'charger', 'leaper',
    'jumper', 'flyerChase', 'flyerDrift', 'flyerOrbit', 'flyerDart', 'shooter',
    'shooterMobile', 'spitter', 'sprayer', 'laserer', 'burrower', 'teleporter',
    'splitter', 'exploder', 'summoner', 'shielded', 'trailLayer', 'boomerang',
    'mimic', 'sucker', 'guard', 'spinner', 'swarm', 'wallHugger', 'grid',
    'ghost', 'bomber', 'grubber', 'climber'
  ]

  IS.ATTACK_LIST = [
    'hop', 'chargeDash', 'spreadShot', 'ringShot', 'aimedShot',
    'barrage', 'burstShot', 'spinShot', 'tearRain', 'homingShots',
    'laserSweep', 'laserCross', 'brimstoneBeam', 'chargeBeam', 'beamRing',
    'spawnMinions', 'summonSwarm', 'splitBody', 'shieldPhase', 'creepPuddle',
    'groundSpikes', 'stompLine', 'fistSlam', 'teleportSlam', 'quakeRings',
    'bombDrop', 'rockThrow', 'vomitStream', 'wallBounceShots', 'retreatVolley',
    'chaseFast', 'orbitalShots', 'tentacleWhip', 'portalSpawn', 'delayedRings',
    'rainbowSpray', 'suctionPull', 'dashRingCombo', 'crawlCharge', 'mirrorShots',
    'knifeThrow', 'bookRain', 'heartBeam', 'screamPush', 'phaseInvuln'
  ]

  IS.FAMILIAR_BEHAVIOUR_LIST = [
    'follower', 'orbitShooter', 'orbital', 'chaser', 'stationaryDrop',
    'wanderer', 'collector', 'buffer', 'laserFamiliar', 'bomber', 'shielder',
    'summoner', 'copycat'
  ]

  IS.TRANSFORM_LIST = [
    'guppy', 'leviathan', 'fun-guy', 'seraphim', 'bob', 'spun', 'mom',
    'mushroom', 'angel', 'bookworm', 'adult', 'spider', 'stompy', 'conjoined'
  ]

  IS.TRANSFORM_NAMES = {
    guppy: 'Guppy', leviathan: 'Leviathan', 'fun-guy': 'Fun Guy',
    seraphim: 'Seraphim', bob: 'Bob', spun: 'Spun', mom: 'Mom',
    mushroom: 'Mushroom', angel: 'Angel', bookworm: 'Bookworm',
    adult: 'Adult', spider: 'Spider Baby', stompy: 'Stompy',
    conjoined: 'Conjoined'
  }

  IS.CURSE = {
    DARKNESS: 1, LABYRINTH: 2, LOST: 4, UNKNOWN: 8, MAZE: 16, BLIND: 32, GIANT: 64
  }
  IS.CURSE_NAMES = {
    1: 'Curse of the Darkness!', 2: 'Curse of the Labyrinth!',
    4: 'Curse of the Lost!', 8: 'Curse of the Unknown!',
    16: 'Curse of the Maze!', 32: 'Curse of the Blind!',
    64: 'Curse of the Giant!'
  }

  IS.CHAMPIONS = {
    red: { hp: 1.6, dmgTaken: 1, tint: '#d03a30', drop: 'heart' },
    'flashing-red': { hp: 1, speed: 1.5, tint: '#ff5a4a', flash: true, drop: 'coin' },
    black: { hp: 2, speed: 0.75, tint: '#3a3038', drop: 'ring', deathRing: true },
    blue: { hp: 1, tint: '#4a7ad0', drop: 'coin', splash: true },
    green: { hp: 1.25, tint: '#4aa050', drop: 'creep', creep: true },
    yellow: { hp: 0.8, speed: 1.4, tint: '#d8c040', drop: 'key' },
    white: { hp: 1, tint: '#e8e4dc', drop: 'soul', shieldShots: true },
    pink: { hp: 1.1, tint: '#e090b8', drop: 'pill', shrink: true },
    orange: { hp: 1, tint: '#e08a30', drop: 'bomb', explode: true },
    grey: { hp: 1.5, tint: '#8a8a8a', drop: 'coin', rockSkin: true },
    purple: { hp: 1.2, tint: '#8a52c0', drop: 'card', ghostOnDeath: true },
    camo: { hp: 1, tint: '#7a8a5a', drop: 'trinket', invisible: true }
  }
  IS.CHAMPION_LIST = Object.keys(IS.CHAMPIONS)

  IS.PILL_COLOURS = [
    { id: 'blue-blue', name: 'Blue Blue', a: '#5a7ad8', b: '#5a7ad8' },
    { id: 'white-blue', name: 'White Blue', a: '#e8e4dc', b: '#5a7ad8' },
    { id: 'orange-orange', name: 'Orange Orange', a: '#e09030', b: '#e09030' },
    { id: 'white-white', name: 'White White', a: '#e8e4dc', b: '#e8e4dc' },
    { id: 'red-red', name: 'Red Red', a: '#d04030', b: '#d04030' },
    { id: 'red-dot-red', name: 'Spotted Red', a: '#d04030', b: '#8a2018' },
    { id: 'yellow-white', name: 'Yellow White', a: '#e0d040', b: '#e8e4dc' },
    { id: 'pink-red', name: 'Pink Red', a: '#e090b8', b: '#d04030' },
    { id: 'black-yellow', name: 'Black Yellow', a: '#302a30', b: '#e0d040' },
    { id: 'white-yellow', name: 'White Yellow', a: '#e8e4dc', b: '#e0d040' },
    { id: 'orange-white', name: 'Orange White', a: '#e09030', b: '#e8e4dc' },
    { id: 'green-blue', name: 'Green Blue', a: '#50a860', b: '#5a7ad8' },
    { id: 'wtf', name: 'WTF', a: '#c040c0', b: '#40c0c0' }
  ]

  IS.GOAL_LIST = [
    'mom', 'mom-heart', 'isaac', '???', 'satan', 'lamb', 'mega-satan',
    'delirium', 'hush', 'mother', 'beast', 'boss-rush', 'depth-2', 'greed', 'greedier'
  ]

  IS.CONDITION_TYPE_LIST = [
    'defeat-boss', 'defeat-boss-as', 'complete-floor', 'complete-challenge',
    'coins-in-run', 'bombs-in-run', 'keys-in-run', 'items-in-run', 'donate',
    'donate-greed', 'blow-up-beggars', 'full-hp-boss', 'no-damage-floor',
    'streak-wins', 'kill-count', 'use-item', 'visit-room', 'beat-boss-rush',
    'beat-hush', 'beat-delirium', 'beat-mother', 'beat-beast', 'beat-dogma',
    'beat-mega-satan', 'all-marks', 'custom'
  ]

  IS.SFX_LIST = [
    'tear-fire', 'tear-hit', 'tear-splat', 'enemy-hurt', 'enemy-die',
    'player-hurt', 'player-die', 'coin', 'key', 'bomb-pickup', 'bomb-fuse',
    'bomb-explode', 'heart-pickup', 'item-pickup', 'pedestal-appear',
    'door-open', 'door-close', 'door-locked', 'rock-break', 'poop-break',
    'chest-open', 'card-use', 'pill-use', 'pill-swallow', 'devil-deal',
    'angel-deal', 'shop-buy', 'boss-roar', 'boss-die', 'floor-clear',
    'trapdoor', 'secret-found', 'charge-up', 'charge-ready', 'menu-move',
    'menu-select', 'menu-back', 'curse-sting', 'holy-shield', 'laser-fire',
    'brimstone-fire', 'knife-throw', 'familiar-spawn', 'transform', 'fart',
    'web-shot', 'beep'
  ]

  IS.SCREEN_LIST = [
    'title', 'menu', 'char-select', 'challenge-select', 'seed-entry', 'options',
    'controls', 'stats', 'collection', 'bestiary', 'secrets', 'pause', 'game',
    'death', 'victory', 'credits', 'challenge-list', 'run-summary'
  ]

  IS.PICKUP_KINDS = [
    'coin', 'key', 'bomb', 'heart', 'soul', 'black', 'card', 'pill', 'rune',
    'trinket', 'battery', 'chest', 'sack', 'item'
  ]

  // --- registries ------------------------------------------------------------

  IS.items = []
  IS.itemsById = Object.create(null)
  IS.trinkets = []
  IS.trinketsById = Object.create(null)
  IS.cards = []
  IS.cardsById = Object.create(null)
  IS.pills = []
  IS.pillsById = Object.create(null)
  IS.enemies = []
  IS.enemiesById = Object.create(null)
  IS.bosses = []
  IS.bossesById = Object.create(null)
  IS.rooms = []
  IS.roomsById = Object.create(null)
  IS.floors = []
  IS.floorsById = Object.create(null)
  IS.characters = []
  IS.charactersById = Object.create(null)
  IS.challenges = []
  IS.challengesById = Object.create(null)
  IS.achievements = []
  IS.achievementsById = Object.create(null)
  IS.familiars = []
  IS.familiarsById = Object.create(null)
  IS.sprites = Object.create(null)
  IS.animatedSprites = Object.create(null)
  IS.archetypes = Object.create(null)
  IS.attacks = Object.create(null)
  IS.screens = Object.create(null)

  IS.defineErrors = []

  function register (list, byId, defs, label, defaults) {
    if (!Array.isArray(defs)) defs = [defs]
    for (var i = 0; i < defs.length; i++) {
      var d = defs[i]
      if (!d || typeof d !== 'object') {
        IS.defineErrors.push(label + ': entry ' + i + ' is not an object')
        continue
      }
      if (!d.id) {
        IS.defineErrors.push(label + ': entry ' + i + ' (' + (d.name || '?') + ') has no id')
        continue
      }
      if (byId[d.id]) {
        IS.defineErrors.push(label + ': duplicate id "' + d.id + '"')
        continue
      }
      if (defaults) {
        for (var k in defaults) if (d[k] === undefined) d[k] = defaults[k]
      }
      byId[d.id] = d
      list.push(d)
    }
    return defs
  }

  IS.defineItems = function (defs) {
    return register(IS.items, IS.itemsById, defs, 'items', {
      kind: 'passive', quality: 1, pools: ['treasure'], tags: [], desc: '',
      info: '', unlock: null
    })
  }
  IS.defineTrinkets = function (defs) {
    return register(IS.trinkets, IS.trinketsById, defs, 'trinkets', {
      kind: 'trinket', quality: 1, pools: ['treasure'], tags: [], desc: '',
      info: '', unlock: null
    })
  }
  IS.defineCards = function (defs) {
    return register(IS.cards, IS.cardsById, defs, 'cards', {
      kind: 'card', cardType: 'tarot', desc: ''
    })
  }
  IS.definePills = function (defs) {
    return register(IS.pills, IS.pillsById, defs, 'pills', {
      kind: 'pill', good: true, horse: false, desc: ''
    })
  }
  IS.defineEnemies = function (defs) {
    return register(IS.enemies, IS.enemiesById, defs, 'enemies', {
      hp: 10, r: 22, speed: 100, dmg: 1, flying: false, archetype: 'chaser',
      params: {}, champion: true, boss: false, mini: false, floors: ['*'],
      bestiary: ''
    })
  }
  IS.defineBosses = function (defs) {
    var out = register(IS.bosses, IS.bossesById, defs, 'bosses', {
      hp: 200, r: 44, dmg: 1, flying: false, archetype: 'idle', params: {},
      champion: false, boss: true, mini: false, stage: ['basement'],
      double: false, bestiary: '', phases: []
    })
    // bosses are also enemies for spawning purposes
    if (!Array.isArray(out)) out = [out]
    for (var i = 0; i < out.length; i++) {
      var b = out[i]
      if (b && b.id && !IS.enemiesById[b.id]) {
        IS.enemiesById[b.id] = b
      }
    }
    return out
  }
  IS.defineRooms = function (defs) {
    return register(IS.rooms, IS.roomsById, defs, 'rooms', {
      type: 'default', shape: '1x1', floors: ['*'], weight: 1, difficulty: 1,
      subtype: 0, legend: {}
    })
  }
  IS.defineFloors = function (defs) {
    return register(IS.floors, IS.floorsById, defs, 'floors', {
      variants: [], altPath: null, rooms: [6, 9], bosses: [], enemyPool: [],
      hazards: [], curseWeights: {}
    })
  }
  IS.defineCharacters = function (defs) {
    return register(IS.characters, IS.charactersById, defs, 'characters', {
      tainted: false, altOf: null, items: [], trinkets: [], pocket: [],
      flags: [], special: '', desc: '', unlock: null,
      coins: 0, bombs: 1, keys: 0
    })
  }
  IS.defineChallenges = function (defs) {
    return register(IS.challenges, IS.challengesById, defs, 'challenges', {
      items: [], trinkets: [], pocket: [], curses: [], rules: {}, goal: 'mom',
      desc: '', unlock: null
    })
  }
  IS.defineAchievements = function (defs) {
    return register(IS.achievements, IS.achievementsById, defs, 'achievements', {
      kind: 'item', unlocks: {}, condition: { type: 'custom' }, desc: ''
    })
  }
  IS.defineFamiliars = function (defs) {
    return register(IS.familiars, IS.familiarsById, defs, 'familiars', {
      behaviour: 'follower', params: {}, sprite: 'familiar-generic'
    })
  }

  IS.defineSprite = function (name, fn) {
    if (IS.sprites[name]) IS.defineErrors.push('sprites: duplicate "' + name + '"')
    IS.sprites[name] = fn
    return fn
  }
  IS.spriteAnimated = function (name) { IS.animatedSprites[name] = true }
  IS.sprite = function (name) { return IS.sprites[name] || null }

  IS.defineArchetype = function (name, fn) {
    if (IS.archetypes[name]) IS.defineErrors.push('archetypes: duplicate "' + name + '"')
    IS.archetypes[name] = fn
    return fn
  }
  IS.defineAttack = function (name, fn) {
    if (IS.attacks[name]) IS.defineErrors.push('attacks: duplicate "' + name + '"')
    IS.attacks[name] = fn
    return fn
  }
  IS.defineScreen = function (name, obj) {
    IS.screens[name] = obj
    return obj
  }

  // Lookup that spans items + trinkets (a lot of code wants "the collectible").
  IS.lookup = function (id) {
    return IS.itemsById[id] || IS.trinketsById[id] || IS.cardsById[id] ||
      IS.pillsById[id] || null
  }

  // Global run/game state container. main.js owns it; everything else reads it.
  IS.state = { screen: 'title', run: null, paused: false, time: 0, frame: 0 }

})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
