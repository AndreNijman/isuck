// Regression checks for the items in js/data/items-8.js rewritten by the audit.
export default h => {
  const IS = h.IS
  const fam = (w, id) => w.p.familiars.filter(f => f.id === id)
  const use = w => {
    const a = w.p.active[0]
    a.charge = a.maxCharge
    return IS.useActive(w.p, 0, w.ctx)
  }
  const killOne = (w, id = 'fly') => {
    const e = h.enemy(w, id)
    IS.killEnemy(e, w.ctx)
    return e
  }
  return {
    'brimstone-bombs': () => {
      const w = h.fresh(); h.give(w, 'brimstone-bombs')
      IS.fireHook(w.p, 'onBombExplode', [{ x: 300, y: 300 }], w.ctx)
      h.eq(w.room.lasers.length, 4)
    },
    '4-5-volt': () => {
      const w = h.fresh(); h.give(w, 'plum-flute'); h.give(w, '4-5-volt')
      h.ok(!w.p.tearFlags.has('slow'), 'no slow tears')
      w.p.active[0].charge = 0
      const e = h.enemy(w); e.hp = 1e6
      for (let i = 0; i < 40; i++) IS.fireHook(w.p, 'onEnemyDamage', [e, 20], w.ctx)
      h.gt(w.p.active[0].charge, 0, 'damage charges')
      const c = w.p.active[0].charge
      h.ok(w.p.flags.has('noRoomCharge'), 'noRoomCharge flag')
      h.enemy(w); h.clearRoom(w)
      h.eq(w.p.active[0].charge, c, 'clearing the room charges nothing')
    },
    'fruity-plum': () => {
      const w = h.fresh(); h.give(w, 'fruity-plum')
      const f = fam(w, 'fruity-plum')[0]
      const x0 = f.x, y0 = f.y
      h.tick(w, 1)
      h.ok(Math.hypot(f.x - x0, f.y - y0) > 100, 'plum flies')
      h.gt(w.room.tears.length, 0, 'fires tears')
    },
    'plum-flute': () => {
      const w = h.fresh(); h.give(w, 'plum-flute')
      h.ok(use(w), 'used')
      h.eq(fam(w, 'baby-plum').length, 1)
      h.tick(w, 10.5)
      h.eq(fam(w, 'baby-plum').length, 0, 'expires')
    },
    'star-of-bethlehem': () => {
      const w = h.fresh(); h.give(w, 'star-of-bethlehem')
      const dmg0 = w.p.stats.damage
      h.tick(w, 0.1)
      h.ok(w.p.cache.inStar, 'in aura at room centre')
      h.gt(w.p.stats.damage, dmg0)
      w.p.x = 100; w.p.y = 100
      h.tick(w, 0.1)
      h.eq(w.p.stats.damage, dmg0, 'buff gone outside aura')
    },
    'cube-baby': () => {
      const w = h.fresh(); h.give(w, 'cube-baby')
      const f = fam(w, 'cube-baby')[0]
      f.x = w.p.x + 30; f.y = w.p.y
      h.tick(w, 0.2)
      h.gt(f.x, w.p.x + 60, 'kicked away')
      h.ok(!w.p.tearFlags.has('freeze'), 'no freeze tears')
    },
    'vade-retro': () => {
      const w = h.fresh(); h.give(w, 'vade-retro')
      killOne(w); killOne(w)
      h.eq(fam(w, 'vade-ghost').length, 2)
      h.ok(use(w), 'used')
      h.tick(w, 1 / 30)
      h.eq(fam(w, 'vade-ghost').length, 0)
    },
    'false-phd': () => {
      const w = h.fresh(); h.give(w, 'false-phd')
      const good = Object.keys(IS.pillsById).find(k => IS.pillsById[k].good)
      const r = IS.fireHook(w.p, 'onPillUse', [good], w.ctx)
      h.ok(r.some(x => x && x.cancel), 'good pill replaced')
      const dmg0 = w.p.stats.damage
      const down = Object.keys(IS.pillsById).find(k => /down/.test(k))
      if (down) { IS.fireHook(w.p, 'onPillUse', [down], w.ctx); h.gt(w.p.stats.damage, dmg0, 'stat down gives damage') }
    },
    'spin-to-win': () => {
      const w = h.fresh(); h.give(w, 'spin-to-win')
      h.eq(fam(w, 'spin-orbital').length, 1)
      const s0 = w.p.stats.speed
      h.ok(use(w), 'used')
      h.gt(w.p.stats.speed, s0)
      h.tick(w, 0.1)
      h.eq(fam(w, 'spin-orbital')[0].def.params.orbitSpeed, 4.8)
      h.tick(w, 8.5)
      h.eq(w.p.stats.speed, s0, 'buff lapses')
    },
    'tropicamide': () => {
      const w = h.fresh(); const s0 = w.p.stats.tearSize; h.give(w, 'tropicamide')
      h.gt(w.p.stats.tearSize, s0)
    },
    'quints': () => {
      const w = h.fresh(); h.give(w, 'quints')
      for (let i = 0; i < 7; i++) killOne(w)
      h.eq(fam(w, 'quint').length, 5, 'capped at 5')
      h.enemy(w); h.tick(w, 0.3)
      h.gt(w.room.tears.length, 0, 'quints shoot')
    },
    'binge-eater': () => {
      const w = h.fresh(); h.give(w, 'binge-eater')
      const d0 = w.p.stats.damage
      w.p.hearts.red = 2
      h.give(w, 'breakfast')
      h.tick(w, 0.1)
      h.gt(w.p.hearts.red, 2, 'food heals')
      h.gt(w.p.stats.damage, d0)
    },
    'sausage': () => {
      const w = h.fresh(); const d0 = w.p.stats.devilChance || 0; h.give(w, 'sausage')
      h.gt(w.p.stats.devilChance, d0)
    },
    'astral-projection': () => {
      const w = h.fresh(); h.give(w, 'astral-projection')
      h.ok(!w.p.tearFlags.has('spectral'), 'not always spectral')
      const e = h.enemy(w)
      h.hurt(w, 1)
      h.gt(e.status.freeze || 0, 0, 'time stops')
      const hp = w.p.hearts.red
      h.hurt(w, 1)
      h.eq(w.p.hearts.red, hp, 'next hit negated')
    },
    'lil-abaddon': () => {
      const w = h.fresh(); h.give(w, 'lil-abaddon')
      const e = h.enemy(w, 'fly', w.p.x + 40, w.p.y); e.hp = 1000
      w.p.status.invincible = 1e9
      for (let i = 0; i < 90; i++) { e.x = w.p.x + 40; e.y = w.p.y; h.tick(w, 0.1) }
      h.lt(e.hp, 1000, 'maw hurts')
    },
    'lil-portal': () => {
      const w = h.fresh(); h.give(w, 'lil-portal')
      const f = fam(w, 'lil-portal')[0]
      const pu = IS.spawnPickup(w.room, 'coin', f.x, f.y)
      h.tick(w, 0.1)
      h.eq(f.eaten, 1)
      h.eq(fam(w, 'blue-fly').length, 1)
    },
    'worm-friend': () => {
      const w = h.fresh(); h.give(w, 'worm-friend')
      h.ok(!w.p.tearFlags.has('slow'), 'no slow tears')
      const e = h.enemy(w); e.hp = 1000
      h.tick(w, 14)
      h.lt(e.hp, 1000, 'grab hurts')
    },
    'jar-of-wisps': () => {
      const w = h.fresh(); h.give(w, 'jar-of-wisps')
      h.ok(use(w)); h.eq(w.p.familiars.length, 1)
      h.ok(use(w)); h.eq(w.p.familiars.length, 3)
    },
    'soul-locket': () => {
      const w = h.fresh(); h.give(w, 'soul-locket')
      const before = JSON.stringify(w.p.base)
      IS.fireHook(w.p, 'onPickup', ['soul', 2], w.ctx)
      h.ok(JSON.stringify(w.p.base) !== before, 'permanent stat up')
    },
    'friend-finder': () => {
      const w = h.fresh(); h.give(w, 'friend-finder')
      h.ok(use(w)); h.eq(fam(w, 'friend-pal').length, 1)
      IS.fireHook(w.p, 'onRoomEnter', [w.room], w.ctx); h.tick(w, 1 / 60)
      h.eq(fam(w, 'friend-pal').length, 0, 'leaves with the room')
    },
    'heartbreak': () => {
      const w = h.fresh(); const d0 = w.p.stats.damage; const m0 = w.p.hearts.maxRed; h.give(w, 'heartbreak')
      h.eq(w.p.hearts.broken, 3)
      h.eq(w.p.hearts.maxRed, m0 - 6)
      h.gt(w.p.stats.damage, d0)
    },
    'esau-jr': () => {
      const w = h.fresh(); h.give(w, 'esau-jr')
      const d0 = w.p.stats.damage
      h.ok(use(w)); h.eq(w.p.hearts.black, 6); h.gt(w.p.stats.damage, d0)
      h.ok(use(w)); h.eq(w.p.stats.damage, d0, 'toggles back')
    },
    'berserk': () => {
      const w = h.fresh(); h.give(w, 'berserk')
      const d0 = w.p.stats.damage
      w.p.active[0].charge = 0
      const e = h.enemy(w); e.hp = 1e6
      for (let i = 0; i < 10; i++) IS.fireHook(w.p, 'onEnemyDamage', [e, 40], w.ctx)
      h.gt(w.p.active[0].charge, 0, 'charges with damage')
      h.ok(use(w))
      h.gt(w.p.stats.damage, d0 + 2)
      h.tick(w, 5.5)
      h.eq(w.p.stats.damage, d0, 'buff lapses')
    },
    'dark-arts': () => {
      const w = h.fresh(); h.give(w, 'dark-arts')
      const e = h.enemy(w, 'fly', w.p.x + 20, w.p.y); e.hp = 1000
      h.ok(use(w))
      h.tick(w, 0.2)
      h.gt(e.status.petrify || 0, 0, 'paralyzed')
      h.tick(w, 1.2)
      h.lt(e.hp, 1000, 'blast hurts')
    },
    'abyss': () => {
      const w = h.fresh(); h.give(w, 'abyss')
      h.ok(!use(w), 'fails with no pedestals')
      IS.spawnPedestal(w.room, 'the-sad-onion', 300, 300, {})
      IS.spawnPedestal(w.room, 'the-sad-onion', 400, 300, {})
      h.ok(use(w))
      h.eq(w.p.familiars.length, 2)
      h.eq(w.room.pickups.filter(u => u.kind === 'item' && !u.taken && !u.removed).length, 0)
    },
    'stapler': () => {
      const w = h.fresh(); h.give(w, 'stapler')
      const a = []
      for (let i = 0; i < 4; i++) {
        IS.firePlayerTears(w.p, { x: 1, y: 0 }, w.ctx)
        a.push(w.room.tears[w.room.tears.length - 1].y)
      }
      h.ok(a.every(y => Math.abs(y - a[0]) < 0.01), 'always same eye')
    },
    'suplex': () => {
      const w = h.fresh(); h.give(w, 'suplex')
      const e = h.enemy(w, 'fly', w.p.x + 20, w.p.y); e.hp = 1000
      w.p.head = { x: 1, y: 0 }
      h.ok(use(w))
      h.tick(w, 0.3)
      h.lt(e.hp, 1000, 'slam hurts')
    },
    'bag-of-crafting': () => {
      const w = h.fresh(); h.IS.initPools(w.run); h.give(w, 'bag-of-crafting')
      h.ok(!use(w), 'needs 8 pickups')
      for (let i = 0; i < 8; i++) { IS.spawnPickup(w.room, 'coin', w.p.x, w.p.y, { rng: w.room.rng, run: w.run }); IS.updateInteractions(w.room, 1 / 60, w.ctx) }
      h.eq(w.p.cache.bag.length, 8, 'the bag took the coins')
      h.ok(use(w))
      h.eq(w.room.pickups.filter(u => u.kind === 'item').length, 1)
    },
    'flip': () => {
      const w = h.fresh(); h.IS.initPools(w.run); h.give(w, 'flip')
      const pu = IS.spawnPedestal(w.room, 'the-sad-onion', 300, 300, {})
      IS.fireHook(w.p, 'onRoomEnter', [w.room], w.ctx)
      h.ok(pu.alt, 'ghost item rolled')
      const alt = pu.alt
      h.ok(use(w))
      h.eq(pu.itemId, alt)
      h.eq(pu.alt, 'the-sad-onion')
    },
    'lemegeton': () => {
      const w = h.fresh(); h.IS.initPools(w.run); h.give(w, 'lemegeton')
      const n0 = w.p.items.length
      let ok = false
      for (let i = 0; i < 6 && !ok; i++) ok = use(w)
      h.ok(ok, 'used')
      h.gt(w.p.items.length, n0, 'wisp grants an item')
      for (const f of fam(w, 'lemegeton-wisp')) f.dead = true
      h.tick(w, 1 / 30)
      h.eq(fam(w, 'lemegeton-wisp').length, 0)
      h.eq(w.p.items.length, n0, 'effect lost with the wisp')
    },
    'sumptorium': () => {
      const w = h.fresh(); h.give(w, 'sumptorium')
      const r = w.p.hearts.red
      h.ok(use(w))
      h.eq(w.p.hearts.red, r - 1)
      h.eq(fam(w, 'clot-red').length, 1)
    },
    'recall': () => {
      const w = h.fresh(); h.give(w, 'recall')
      h.ok(use(w)); h.ok(w.p.status.invincible > 0 && w.p.status.invincible < 3)
    },
    'hold': () => {
      const w = h.fresh(); h.give(w, 'hold')
      h.ok(use(w), 'arms')
      h.eq(w.p.active[0].charge, w.p.active[0].maxCharge, 'arming is free')
      IS.fireHook(w.p, 'onGridBreak', [{ kind: 'poop' }], w.ctx)
      h.ok(w.p.cache.holdPoop)
      h.ok(use(w), 'releases')
      h.ok(!w.p.cache.holdPoop)
    },
    'keepers-box': () => {
      const w = h.fresh(); h.IS.initPools(w.run); h.give(w, 'keepers-box')
      h.ok(use(w))
      h.eq(w.room.pickups.filter(u => u.price > 0).length, 1)
    },
    'everything-jar': () => {
      const w = h.fresh(); h.give(w, 'everything-jar')
      h.ok(use(w))
      h.gt(w.room.pickups.length, 0)
    },
    'anima-sola': () => {
      const w = h.fresh(); h.give(w, 'anima-sola')
      h.ok(!use(w), 'needs an enemy')
      const e = h.enemy(w)
      h.ok(use(w)); h.gt(e.status.petrify || 0, 1)
    },
    'spindown-dice': () => {
      const w = h.fresh(); h.give(w, 'spindown-dice')
      const hi = IS.items.find(i => i.num === 100 && i.kind === 'passive') || IS.items.find(i => i.num > 50 && i.kind === 'passive')
      const pu = IS.spawnPedestal(w.room, hi.id, 300, 300, {})
      const n0 = IS.itemsById[pu.itemId].num
      h.ok(use(w))
      h.lt(IS.itemsById[pu.itemId].num, n0)
    },
    'ibs': () => {
      const w = h.fresh(); h.give(w, 'ibs')
      h.ok(!w.p.tearFlags.has('poison'), 'no poison tears')
      const e = h.enemy(w); e.hp = 1e6
      for (let i = 0; i < 6; i++) IS.fireHook(w.p, 'onEnemyDamage', [e, 20], w.ctx)
      h.ok(w.p.cache.ibsReady, 'flashing')
    },
    'ghost-bombs': () => {
      const w = h.fresh(); h.give(w, 'ghost-bombs')
      IS.fireHook(w.p, 'onBombExplode', [{ x: 300, y: 300 }], w.ctx)
      h.eq(fam(w, 'ghost-bomb').length, 1)
    },
    'gello': () => {
      const w = h.fresh(); h.give(w, 'gello')
      h.ok(use(w)); h.eq(fam(w, 'gello-demon').length, 1)
    },
    'decap-attack': () => {
      const w = h.fresh(); h.give(w, 'decap-attack')
      h.ok(use(w)); h.eq(w.room.tears.length, 1)
    },
    'moms-ring': () => {
      const w = h.fresh(); h.give(w, 'moms-ring')
      h.eq(w.room.pickups.filter(u => u.kind === 'rune').length, 1)
    }
  }
}
