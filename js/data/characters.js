;(function (IS) {
  'use strict'

  // ---------------------------------------------------------------------------
  // ISUCK — the 34 playable characters (17 regular, 17 tainted).
  //
  // Stats follow The Binding of Isaac: Repentance. `base.damage` is Isaac's 3.5
  // times the character's damage multiplier and `base.tears` is the base fire
  // rate times the character's fire-rate multiplier, because IS.recalcStats
  // treats both as multiplicands (see js/engine/player.js). `base.range` is in
  // engine units (80 per Isaac range point). Hearts are half-heart units.
  //
  // `pAct` describes a character's pocket active (a non-item active used with
  // the pocket key): `gain` says what charges it. The mechanics themselves live
  // in js/engine/characters.js; this file is data only.
  // ---------------------------------------------------------------------------

  var BT = IS.BASE_TEARS || 30 / 11

  // dm = damage multiplier, tm = fire-rate multiplier, sp = speed, rg = range
  // in tiles, ss = shot speed, lk = luck
  function st (dm, tm, sp, rg, ss, lk) {
    return { damage: +(3.5 * dm).toFixed(3), tears: +(BT * tm).toFixed(4), range: Math.round(80 * rg), shotSpeed: ss, speed: sp, luck: lk }
  }

  var defs = [
    // ---- regular characters -------------------------------------------------
    { id: 'isaac', name: 'Isaac', base: st(1, 1, 1, 6.5, 1, 0), hearts: { red: 6, maxRed: 6 }, items: ['the-d6'],
      desc: 'Three hearts and a D6.', special: 'Starts with The D6.' },
    { id: 'magdalene', name: 'Magdalene', base: st(1, 1, 0.85, 6.5, 1, 0), hearts: { red: 8, maxRed: 8 }, items: ['yum-heart'],
      desc: 'Four hearts, slow feet, and a Yum Heart.', special: 'Four heart containers and Yum Heart; slowest of the lot.' },
    { id: 'cain', name: 'Cain', base: st(1.2, 1, 1.3, 6.5, 1, 0), hearts: { red: 4, maxRed: 4 }, items: ['lucky-foot'], keys: 1,
      flags: ['oneEye'], desc: 'Fast, hard-hitting and lucky.', special: 'Lucky Foot, one eye: tears leave from the centre of his head.' },
    { id: 'judas', name: 'Judas', base: st(1.35, 1, 1, 6.5, 1, 0), hearts: { red: 2, maxRed: 2 }, items: ['the-book-of-belial'], coins: 3,
      desc: 'One heart, enormous damage, Book of Belial.', special: 'Book of Belial; 1.35x damage.' },
    { id: 'blue-baby', name: '???', base: st(1.05, 1, 1.1, 6.5, 1, 0), hearts: { red: 0, maxRed: 0, soul: 6 }, items: ['the-poop'],
      flags: ['noRedHearts'], desc: 'Soul hearts only. Poop.', special: 'Three soul hearts, cannot hold red hearts, The Poop.' },
    { id: 'eve', name: 'Eve', base: st(0.75, 1, 1, 6.5, 1, 0), hearts: { red: 4, maxRed: 4 }, items: ['whore-of-babylon', 'dead-bird', 'razor-blade'],
      desc: 'Weak, but strongest when nearly dead.', special: 'Whore of Babylon, Dead Bird and Razor Blade; 0.75x damage.' },
    { id: 'samson', name: 'Samson', base: st(1, 1, 1.1, 6.5, 1, 0), hearts: { red: 6, maxRed: 6 }, items: ['bloody-lust'],
      desc: 'Pain makes him stronger.', special: 'Bloody Lust: every hit taken is a damage up until the floor ends.' },
    { id: 'azazel', name: 'Azazel', base: st(1.5, 1, 1, 3.5, 1, 0), hearts: { red: 0, maxRed: 0, black: 6 }, flags: ['flying', 'brimstone'],
      desc: 'Short-range brimstone and flight.', special: 'Flies. Charges a short, wide Brimstone beam instead of firing tears. Three black hearts.' },
    { id: 'lazarus', name: 'Lazarus', base: st(1, 1, 1, 6.5, 1, 0), hearts: { red: 6, maxRed: 6 }, items: ['lazarus-rags'],
      desc: 'Dies once, rises as Lazarus Risen.', special: "Lazarus' Rags: the first death revives him as Lazarus Risen with Anemic." },
    { id: 'eden', name: 'Eden', base: st(1, 1, 1, 6.5, 1, 0), hearts: { red: 4, maxRed: 4 }, items: [],
      desc: 'Random stats, a random active and passive every run.', special: 'Stats, items and pocket card are rolled from the run seed.' },
    { id: 'the-lost', name: 'The Lost', base: st(1, 1, 1, 6.5, 1, 0), hearts: { red: 0, maxRed: 0 }, items: ['holy-mantle'],
      flags: ['flying', 'spectralTears', 'noRedHearts', 'freeDevilDeals'],
      desc: 'Spectral flight; dies in one hit.', special: 'No hearts. Flying, spectral tears, devil deals cost nothing, starts with Holy Mantle.' },
    { id: 'lilith', name: 'Lilith', base: st(1, 1, 1, 6.5, 1, 0), hearts: { red: 2, maxRed: 2, soul: 2 }, items: ['incubus', 'box-of-friends', 'cambion-conception'],
      flags: ['cantShoot'], desc: 'Cannot shoot; her Incubus does.', special: 'Cannot fire tears. Incubus, Box of Friends, Cambion Conception.' },
    { id: 'keeper', name: 'Keeper', base: st(1, 0.5, 1, 6.5, 1, 0), hearts: { red: 4, maxRed: 4 }, items: ['wooden-nickel'], trinkets: ['store-credit'], coins: 15,
      flags: ['keeperHearts', 'cantHeal', 'tripleShot'], desc: 'Coin hearts, triple shot, and coins heal.', special: 'Two coin hearts that only coins heal, triple shot, Wooden Nickel, Store Credit.' },
    { id: 'apollyon', name: 'Apollyon', base: st(1, 1, 1, 6.5, 1, 0), hearts: { red: 6, maxRed: 6 }, items: ['void'],
      desc: 'Starts with Void.', special: 'Void: absorbs pedestals in the room for permanent stats.' },
    { id: 'the-forgotten', name: 'The Forgotten', base: st(1.5, 1, 1, 4.5, 1, 0), hearts: { red: 0, maxRed: 0, bone: 4 }, flags: ['boneHearts', 'melee'],
      desc: 'A bone club, and The Soul to swap with.', special: 'Taps swing the bone club (and block shots), holds throw it. The swap key switches to The Soul: flying, spectral, with its own soul hearts.' },
    { id: 'bethany', name: 'Bethany', base: st(1, 1, 1, 6.5, 1, 0), hearts: { red: 4, maxRed: 4, soul: 2 }, flags: ['bookOfVirtues'],
      pAct: { id: 'book-of-virtues', name: 'Book of Virtues', max: 4, gain: { souls: 0.5 } },
      desc: 'Soul hearts charge her actives.', special: 'Soul hearts charge active items and the Book of Virtues, which kindles orbiting wisps. She can pay soul hearts to use an uncharged active.' },
    { id: 'jacob-and-esau', name: 'Jacob & Esau', base: st(1, 1, 1, 6.5, 1, 0), hearts: { red: 6, maxRed: 6 }, flags: ['twins'],
      desc: 'Two bodies, one set of controls.', special: 'Esau follows your inputs with his own stats and hearts. If either dies, the run is over.' },

    // ---- tainted characters -------------------------------------------------
    { id: 'tainted-isaac', name: 'Tainted Isaac', tainted: true, altOf: 'isaac', base: st(1, 1, 1, 6.5, 1, 0), hearts: { red: 4, maxRed: 4 }, flags: ['itemLimit'],
      desc: 'Hoards eight items; the rest sit in an inventory.', special: 'Holds at most 8 items. Extras are stored; the swap key cycles the inventory.' },
    { id: 'tainted-magdalene', name: 'Tainted Magdalene', tainted: true, altOf: 'magdalene', base: st(1, 1, 0.85, 6.5, 1, 0), hearts: { red: 6, maxRed: 6 }, flags: ['melee', 'tempHearts'],
      desc: 'Her hearts rot away; her hug heals them.', special: 'Hearts above one container decay over time. Hold to hug nearby enemies; each hit restores health.' },
    { id: 'tainted-cain', name: 'Tainted Cain', tainted: true, altOf: 'cain', base: st(1.1, 1, 1.3, 6.5, 1, 0), hearts: { red: 4, maxRed: 4 }, flags: ['bagOfCrafting'],
      desc: 'Crafts items from scavenged pickups.', special: 'Bag of Crafting: every pickup goes into the bag; eight make an item whose quality follows their combined value.' },
    { id: 'tainted-judas', name: 'Tainted Judas', tainted: true, altOf: 'judas', base: st(1.35, 1, 1, 6.5, 1, 0), hearts: { red: 0, maxRed: 0, black: 4 },
      pAct: { id: 'dark-arts', name: 'Dark Arts', max: 4, gain: { room: 1, kill: 0.25 } },
      desc: 'A shadow that cannot be touched.', special: 'Dark Arts: dash as an invulnerable shadow that damages everything it passes through.' },
    { id: 'tainted-blue-baby', name: 'Tainted ???', tainted: true, altOf: 'blue-baby', base: st(1, 1, 1.1, 6.5, 1, 0), hearts: { red: 0, maxRed: 0, soul: 6 }, flags: ['noRedHearts', 'poopTears'],
      pAct: { id: 'hold', name: 'Hold', max: 2, gain: { room: 1 } },
      desc: 'Fires poop and casts poop spells.', special: 'Poop tears. Hold casts a random poop spell: stinky, corny, burning, explosive, black or holy.' },
    { id: 'tainted-eve', name: 'Tainted Eve', tainted: true, altOf: 'eve', base: st(0.75, 1, 1, 6.5, 1, 0), hearts: { red: 4, maxRed: 4 },
      pAct: { id: 'sumptorium', name: 'Sumptorium', max: 0, gain: {} },
      desc: 'Turns her blood into clots.', special: 'Sumptorium: spend red health to spawn a blood clot ally; clots also burst from her wounds.' },
    { id: 'tainted-samson', name: 'Tainted Samson', tainted: true, altOf: 'samson', base: st(1, 1, 1.1, 6.5, 1, 0), hearts: { red: 6, maxRed: 6 },
      pAct: { id: 'berserk', name: 'Berserk', max: 6, gain: { damageDealt: 0.04 } },
      desc: 'Deals damage to fill a berserk rage.', special: 'Berserk: charged by damage dealt. While it lasts he is faster, hits harder and tramples enemies.' },
    { id: 'tainted-azazel', name: 'Tainted Azazel', tainted: true, altOf: 'azazel', base: st(1.2, 1, 1, 3.5, 1, 0), hearts: { red: 0, maxRed: 0, black: 4 }, flags: ['flying', 'brimstone'],
      pAct: { id: 'hemoptysis', name: 'Hemoptysis', max: 2, gain: { room: 1 } },
      desc: 'Sneezes a cone of blood.', special: 'Flies. Short Brimstone beam, and Hemoptysis sneezes a spread of piercing blood tears.' },
    { id: 'tainted-lazarus', name: 'Tainted Lazarus', tainted: true, altOf: 'lazarus', base: st(1, 1, 1, 6.5, 1, 0), hearts: { red: 6, maxRed: 6 }, flags: ['flipForms'],
      pAct: { id: 'flip', name: 'Flip', max: 1, gain: { room: 1 } },
      desc: 'Two bodies; Flip swaps between them.', special: 'Flip swaps between Lazarus and Dead Lazarus (more damage, slower), each with their own hearts. A dying form flips automatically.' },
    { id: 'tainted-eden', name: 'Tainted Eden', tainted: true, altOf: 'eden', base: st(1, 1, 1, 6.5, 1, 0), hearts: { red: 2, maxRed: 2 }, flags: ['rerollOnHit'],
      desc: 'Every hit rerolls her build.', special: 'Taking damage rerolls her passive items and her stats.' },
    { id: 'tainted-the-lost', name: 'Tainted Lost', tainted: true, altOf: 'the-lost', base: st(1, 1, 1, 6.5, 1, 0), hearts: { red: 0, maxRed: 0 }, pocket: [{ kind: 'card', id: 'holy-card' }],
      flags: ['flying', 'spectralTears', 'noRedHearts', 'freeDevilDeals', 'holyCards'],
      desc: 'No Holy Mantle, but Holy Cards.', special: 'One hit kills. No Holy Mantle; instead he carries Holy Cards and rooms may drop more.' },
    { id: 'tainted-lilith', name: 'Tainted Lilith', tainted: true, altOf: 'lilith', base: st(1, 1, 1, 6.5, 1, 0), hearts: { red: 4, maxRed: 4 }, flags: ['cantShoot', 'melee'],
      desc: 'Swings Gello on an umbilical cord.', special: 'Cannot fire tears. Gello is whipped out on its cord in the direction you aim.' },
    { id: 'tainted-keeper', name: 'Tainted Keeper', tainted: true, altOf: 'keeper', base: st(1, 0.5, 1, 6.5, 1, 0), hearts: { red: 4, maxRed: 4 }, coins: 15,
      flags: ['keeperHearts', 'cantHeal', 'quadShot'], desc: 'Quad shot; enemies drop coins.', special: 'Four-tear volleys, coins heal him, and enemies drop coins when they die.' },
    { id: 'tainted-apollyon', name: 'Tainted Apollyon', tainted: true, altOf: 'apollyon', base: st(1, 1, 1, 6.5, 1, 0), hearts: { red: 4, maxRed: 4, black: 2 },
      pAct: { id: 'abyss', name: 'Abyss', max: 4, gain: { room: 1 } },
      desc: 'Devours items into locusts.', special: 'Abyss: devours your most recent item and releases locusts whose number scales with its quality.' },
    { id: 'tainted-the-forgotten', name: 'Tainted Forgotten', tainted: true, altOf: 'the-forgotten', base: st(1.5, 1, 1, 4.5, 1, 0), hearts: { red: 0, maxRed: 0, bone: 4, soul: 2 }, flags: ['boneHearts', 'melee', 'skeletonThrow'],
      desc: 'Carries the skeleton and throws it.', special: 'Swings a bone club. The swap key throws the skeleton, who fights alone where he lands; press it near him to pick him back up.' },
    { id: 'tainted-bethany', name: 'Tainted Bethany', tainted: true, altOf: 'bethany', base: st(1, 1, 1, 6.5, 1, 0), hearts: { red: 4, maxRed: 4 },
      pAct: { id: 'lemegeton', name: 'Lemegeton', max: 6, gain: { hearts: 1 } },
      desc: 'Red hearts charge the Lemegeton.', special: 'Every red heart, even at full health, charges Lemegeton, which conjures wisps.' },
    { id: 'tainted-jacob-and-esau', name: 'Tainted Jacob', tainted: true, altOf: 'jacob-and-esau', base: st(1, 1, 1.05, 6.5, 1, 0), hearts: { red: 6, maxRed: 6 }, flags: ['esauGhost'],
      pAct: { id: 'anima-sola', name: 'Anima Sola', max: 3, gain: { room: 1 } },
      desc: 'Hunted by a dark Esau.', special: 'Dark Esau chases you through every uncleared room and hurts on touch. Tears push him back; Anima Sola chains him.' }
  ]

  defs.forEach(function (d) {
    d.flags = d.flags || []
    d.items = d.items || []
    d.trinkets = d.trinkets || []
    d.pocket = d.pocket || []
  })

  IS.defineCharacters(defs)
  defs.forEach(Object.freeze)
  Object.freeze(defs)
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
