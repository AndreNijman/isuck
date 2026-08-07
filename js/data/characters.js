;(function (IS) {
  'use strict'

  var normal = [
    ['isaac', 'Isaac', {}, { red: 6, maxRed: 6 }, {}, 'Balanced and dependable.'],
    ['magdalene', 'Magdalene', { speed: 0.85 }, { red: 8, maxRed: 8 }, {}, 'Healthy, but slow.'],
    ['cain', 'Cain', { damage: 4.2, range: 430, luck: 1.0 }, { red: 4, maxRed: 4 }, { keys: 1 }, 'Lucky and hard-hitting.'],
    ['judas', 'Judas', { damage: 4.72 }, { red: 2, maxRed: 2 }, { coins: 3 }, 'Fragile with exceptional damage.'],
    ['blue-baby', '???', { speed: 1.1 }, { red: 0, maxRed: 0, soul: 6 }, {}, 'Cannot gain red hearts.'],
    ['eve', 'Eve', { damage: 2.62, speed: 1.23 }, { red: 4, maxRed: 4 }, {}, 'Fast, strongest when wounded.'],
    ['samson', 'Samson', { tears: 2.31 }, { red: 6, maxRed: 6 }, {}, 'Builds momentum from pain.'],
    ['azazel', 'Azazel', { damage: 5.0, range: 240, speed: 1.25 }, { red: 0, maxRed: 0, black: 6 }, { flags: ['flying', 'brimstone'] }, 'Short-range brimstone and flight.'],
    ['lazarus', 'Lazarus', { luck: -1 }, { red: 6, maxRed: 6 }, {}, 'Carries a second chance.'],
    ['eden', 'Eden', { damage: 3.2, tears: 2.9, range: 500, speed: 1.05, luck: 1 }, { red: 4, maxRed: 4, soul: 2 }, {}, 'A strange, variable wanderer.'],
    ['the-lost', 'The Lost', { damage: 3.5, speed: 1.2 }, { red: 0, maxRed: 0, soul: 1 }, { flags: ['flying', 'spectralTears', 'noRedHearts', 'freeDevilDeals'] }, 'Spectral flight; one hit from death.'],
    ['lilith', 'Lilith', { damage: 3.5, speed: 0.85 }, { red: 2, maxRed: 2, black: 4 }, {}, 'Blind, commanding familiars.'],
    ['keeper', 'Keeper', { damage: 4.2, tears: 1.36, luck: -2 }, { red: 4, maxRed: 4 }, { coins: 1, flags: ['keeperHearts', 'cantHeal'] }, 'Heals with coins, not hearts.'],
    ['apollyon', 'Apollyon', {}, { red: 4, maxRed: 4, black: 2 }, {}, 'Feeds the void to grow.'],
    ['the-forgotten', 'The Forgotten', { damage: 5.25, range: 300, speed: 1.1 }, { red: 0, maxRed: 0, bone: 6 }, { flags: ['boneHearts'] }, 'A skeleton with a powerful melee swing.'],
    ['bethany', 'Bethany', {}, { red: 6, maxRed: 6 }, { flags: ['bookOfVirtues'] }, 'Red-heart charges kindle wisps.'],
    ['jacob-and-esau', 'Jacob & Esau', { damage: 4.0, tears: 2.5, speed: 0.95 }, { red: 6, maxRed: 6, soul: 2 }, {}, 'Two brothers move as one.']
  ]

  var taintedNames = ['Isaac', 'Magdalene', 'Cain', 'Judas', '???', 'Eve', 'Samson', 'Azazel', 'Lazarus', 'Eden', 'The Lost', 'Lilith', 'Keeper', 'Apollyon', 'The Forgotten', 'Bethany', 'Jacob & Esau']
  var defs = normal.map(function (x) {
    var extra = x[4]
    return {
      id: x[0], name: x[1], base: Object.assign({ damage: 3.5, tears: 30 / 11, range: 520, shotSpeed: 1, speed: 1, luck: 0 }, x[2]),
      hearts: x[3], items: [], trinkets: [], pocket: [], flags: extra.flags || [], coins: extra.coins || 0,
      bombs: extra.bombs == null ? 1 : extra.bombs, keys: extra.keys || 0, desc: x[5], special: x[5], unlock: null
    }
  })
  normal.forEach(function (x, i) {
    var id = 'tainted-' + x[0]
    var base = Object.assign({}, defs[i].base, { damage: defs[i].base.damage * 1.08, speed: Math.min(1.3, defs[i].base.speed + 0.05) })
    defs.push({
      id: id, name: 'Tainted ' + taintedNames[i], tainted: true, altOf: x[0], base: base,
      hearts: Object.assign({}, defs[i].hearts), items: [], trinkets: [], pocket: [], flags: defs[i].flags.slice(),
      coins: defs[i].coins, bombs: defs[i].bombs, keys: defs[i].keys,
      desc: 'A corrupted rule-breaking form of ' + taintedNames[i] + '.', special: 'Alternate mechanics and a harsher start.', unlock: null
    })
  })

  IS.defineCharacters(defs)
  defs.forEach(Object.freeze)
  Object.freeze(defs)
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
