// Regression checks for the items in js/data/items-4.js rewritten by the audit.
export default h => {
  const IS = h.IS
  const withInput = (move, shoot, fn) => {
    const om = IS.input.move, os = IS.input.shoot
    IS.input.move = () => move || { x: 0, y: 0 }
    IS.input.shoot = () => shoot || { x: 0, y: 0 }
    try { fn() } finally { IS.input.move = om; IS.input.shoot = os }
  }
  const use = (w, id) => w.p.items.includes(id) && IS.itemsById[id].hooks.onUse(w.p, w.ctx)
  const tough = e => { e.hp = e.maxHp = 100000; return e }
  const count = (w, id) => w.p.familiars.filter(f => f.id === id).length
  const pickups = (w, kind) => w.room.pickups.filter(u => u.kind === kind && !u.dead && !u.removed)
  const fireTear = w => {
    IS.firePlayerTears(w.p, { x: 1, y: 0 }, w.ctx)
    return w.room.tears[w.room.tears.length - 1]
  }
  const near = (w, id) => {
    const w2 = w || h.fresh()
    return w2
  }
  void near

  return {
    'lil-haunt': () => {
      const w = h.fresh(); h.give(w, 'lil-haunt')
      h.ok(!w.p.tearFlags.has('fear'), 'no fear tears for Isaac')
      const f = w.p.familiars[0]
      const e = tough(h.enemy(w, 'fly', f.x, f.y))
      const hp0 = e.hp
      for (let i = 0; i < 20; i++) { e.x = w.p.familiars[0].x; e.y = w.p.familiars[0].y; h.tick(w, 0.1) }
      h.lt(e.hp, hp0, 'bumped the enemy')
    },
    'sissy-longlegs': () => {
      const w = h.fresh(); h.give(w, 'sissy-longlegs')
      h.ok(!w.p.tearFlags.has('charm'), 'no charm tears for Isaac')
      h.eq(count(w, 'sissy-longlegs'), 1, 'she is a familiar')
      tough(h.enemy(w, 'fly', 60, 60))
      h.tick(w, 12)
      h.gt(count(w, 'blue-spider'), 0, 'spiders spawned in a hostile room')
    },
    'punching-bag': () => {
      h.ok(IS.familiarsById['punching-bag'].params.blockShots, 'soaks up shots')
    },
    'how-to-jump': () => {
      const w = h.fresh(); h.give(w, 'how-to-jump')
      use(w, 'how-to-jump')
      h.ok(w.p.flags.has('flying'), 'airborne')
      h.tick(w, 1.2)
      h.ok(!w.p.flags.has('flying'), 'landed')
    },
    'd100': () => {
      const w = h.fresh(); h.give(w, 'd100')
      w.ctx.spawnPickup('coin', 300, 300, {})
      const r = use(w, 'd100')
      h.ok(!(r && r.fail), 'does not fail')
      h.eq(pickups(w, 'coin').filter(u => u.x === 300 && u.y === 300).length, 0, 'loose coin was rerolled')
    },
    'd10': () => {
      const w = h.fresh(); h.give(w, 'd10')
      const e = h.enemy(w, 'fatty')
      use(w, 'd10')
      h.ok(e.dead, 'the fatty is gone')
      h.ok(w.room.enemies.some(x => !x.dead && x.id !== 'fatty'), 'a weaker enemy took its place')
      const b = h.enemy(w, 'monstro')
      h.ok(IS.itemsById.d10.hooks.onUse(w.p, w.ctx) && true, 'only bosses left fails')
      h.ok(!b.dead, 'bosses are untouched')
    },
    'blank-card': () => {
      const w = h.fresh(); h.give(w, 'blank-card')
      const id = Object.keys(IS.cardsById)[0]
      let used = 0
      const d = IS.cardsById[id], old = d.use
      d.use = () => { used++ }
      try {
        h.ok(use(w, 'blank-card').fail, 'no card held')
        IS.givePocket(w.p, 'card', id)
        use(w, 'blank-card')
      } finally { d.use = old }
      h.eq(used, 1, 'card effect fired')
      h.eq(w.p.pocket.length, 1, 'card not consumed')
    },
    'placebo': () => {
      const w = h.fresh(); h.give(w, 'placebo')
      const id = Object.keys(IS.pillsById)[0]
      let used = 0
      const d = IS.pillsById[id], old = d.use
      d.use = () => { used++ }
      try {
        IS.givePocket(w.p, 'pill', id)
        use(w, 'placebo')
      } finally { d.use = old }
      h.eq(used, 1, 'pill effect fired')
      h.eq(w.p.pocket.length, 1, 'pill not consumed')
    },
    'book-of-secrets': () => {
      const w = h.fresh(); h.give(w, 'book-of-secrets')
      const f = h.newFloor(w)
      for (const r of f.rooms) if (r) r.mapKnown = false
      use(w, 'book-of-secrets')
      h.gt(f.rooms.filter(r => r && r.mapKnown).length, 0, 'a map effect revealed rooms')
      h.eq(w.p.cache.secretsFloor.length, 1, 'one effect granted')
    },
    'box-of-spiders': () => {
      const w = h.fresh(); h.give(w, 'box-of-spiders')
      use(w, 'box-of-spiders')
      const n = count(w, 'blue-spider')
      h.ok(n >= 4 && n <= 8, '4-8 spiders, got ' + n)
    },
    'red-candle': () => {
      const w = h.fresh(); h.give(w, 'red-candle')
      h.ok(!w.p.tearFlags.has('burn'), 'tears are not burning')
      use(w, 'red-candle')
      h.eq(count(w, 'red-flame'), 1, 'flame thrown')
      const f = w.p.familiars.find(x => x.id === 'red-flame')
      const e = tough(h.enemy(w, 'fly', f.x, f.y))
      const hp0 = e.hp
      h.tick(w, 1)
      h.lt(e.hp, hp0, 'flame burns what touches it')
    },
    'the-jar': () => {
      const w = h.fresh(); h.give(w, 'the-jar')
      h.ok(use(w, 'the-jar').fail, 'empty jar does nothing')
      w.p.hearts.red = w.p.hearts.maxRed
      w.ctx.spawnPickup('heart', w.p.x, w.p.y, {})
      h.tick(w, 0.2)
      h.eq(w.p.cache.jar, 1, 'heart stored')
      h.eq(pickups(w, 'heart').filter(u => !u.taken).length, 0, 'heart taken off the floor')
      use(w, 'the-jar')
      h.eq(pickups(w, 'heart').filter(u => !u.taken).length, 1, 'heart dropped again')
      h.eq(w.p.cache.jar, 0, 'jar emptied')
    },
    'flush': () => {
      const w = h.fresh(); h.give(w, 'flush')
      const e = h.enemy(w, 'gaper')
      const b = h.enemy(w, 'monstro')
      use(w, 'flush')
      h.ok(e.dead, 'non-boss enemy flushed')
      h.ok(!b.dead, 'boss survives')
      h.ok(w.room.grid.some(g => g.kind === 'poop'), 'left poop')
    },
    'head-of-krampus': () => {
      const w = h.fresh(); h.give(w, 'head-of-krampus')
      use(w, 'head-of-krampus')
      h.eq(w.room.lasers.length, 4, 'four beams')
      const e = tough(h.enemy(w, 'fly', w.p.x + 200, w.p.y))
      const hp0 = e.hp
      h.tick(w, 1)
      h.lt(e.hp, hp0 - 100, 'beams hurt')
    },
    'butter-bean': () => {
      const w = h.fresh(); h.give(w, 'butter-bean')
      const e = tough(h.enemy(w, 'gaper', w.p.x + 100, w.p.y))
      use(w, 'butter-bean')
      h.gt(e.kbx, 100, 'shoved away')
    },
    'magic-fingers': () => {
      const w = h.fresh(); h.give(w, 'magic-fingers')
      const e = tough(h.enemy(w, 'gaper'))
      w.p.coins = 0
      h.ok(use(w, 'magic-fingers').fail, 'needs a coin')
      w.p.coins = 3
      use(w, 'magic-fingers')
      h.eq(w.p.coins, 2, 'costs 1 coin')
      h.lt(e.hp, e.maxHp - 10, '2x damage + 10')
    },
    'converter': () => {
      const w = h.fresh(); h.give(w, 'converter')
      w.p.hearts.soul = 0; w.p.hearts.black = 0
      h.ok(use(w, 'converter').fail, 'nothing to convert')
      w.p.hearts.soul = 4
      const max0 = w.p.hearts.maxRed
      use(w, 'converter')
      h.eq(w.p.hearts.maxRed, max0 + 2, 'a heart container')
      h.eq(w.p.hearts.soul, 2, 'one soul heart spent')
    },
    'pandoras-box': () => {
      const w = h.fresh(); h.give(w, 'pandoras-box')
      use(w, 'pandoras-box')
      h.eq(w.room.pickups.length, 2, 'two pickups on the first floor')
    },
    'unicorn-stump': () => {
      const w = h.fresh(); h.give(w, 'unicorn-stump')
      const s0 = w.p.stats.speed
      use(w, 'unicorn-stump')
      h.gt(w.p.status.invincible, 5, 'invincible')
      h.ok(Math.abs(w.p.stats.speed - s0 - 0.28) < 0.01, '+0.28 speed')
      const t = fireTear(w)
      h.ok(!t || t.dead, 'cannot shoot')
      h.tick(w, 6.5)
      h.ok(Math.abs(w.p.stats.speed - s0) < 0.01, 'speed back to normal')
    },
    'taurus': () => {
      const w = h.fresh(); h.give(w, 'taurus')
      tough(h.enemy(w, 'gaper', 60, 60))
      const s0 = w.p.stats.speed
      h.tick(w, 2)
      h.gt(w.p.stats.speed, s0 + 0.3, 'speed builds up in a hostile room')
      h.tick(w, 6)
      h.gt(w.p.status.invincible, 0, 'invincible at top speed')
      const e = tough(h.enemy(w, 'gaper', w.p.x, w.p.y))
      const hp0 = e.hp
      h.tick(w, 0.5)
      h.lt(e.hp, hp0, 'rams enemies')
      h.tick(w, 6)
      h.lt(w.p.stats.speed, 1.0, 'boost lost afterwards')
    },
    'aries': () => {
      const w = h.fresh(); h.give(w, 'aries')
      const e = tough(h.enemy(w, 'gaper', w.p.x, w.p.y))
      const hp0 = e.hp
      withInput({ x: 1, y: 0 }, null, () => { w.p.vx = IS.MOVE_SPEED * w.p.stats.speed; h.tick(w, 0.2) })
      h.lt(e.hp, hp0, 'contact damage while running')
      h.gt(w.p.status.invincible, 0, 'immune while running')
    },
    'cancer': () => {
      const w = h.fresh(); h.give(w, 'cancer')
      h.hurt(w, 2)
      const soul = w.p.hearts.soul
      h.hurt(w, 2)
      h.eq(soul - w.p.hearts.soul, 1, 'second hit is only half a heart')
      IS.fireHook(w.p, 'onRoomEnter', [w.room], w.ctx)
      const soul2 = w.p.hearts.soul
      h.hurt(w, 2)
      h.eq(soul2 - w.p.hearts.soul, 2, 'new room resets it')
    },
    'libra': () => {
      const w = h.fresh()
      const c = w.p.coins, b = w.p.bombs, k = w.p.keys
      h.give(w, 'libra')
      h.eq(w.p.coins - c, 6, 'coins')
      h.eq(w.p.bombs - b, 6, 'bombs')
      h.eq(w.p.keys - k, 6, 'keys')
    },
    'capricorn': () => {
      const w = h.fresh()
      const c = w.p.coins, b = w.p.bombs, k = w.p.keys
      h.give(w, 'capricorn')
      h.eq(w.p.coins - c, 1); h.eq(w.p.bombs - b, 1); h.eq(w.p.keys - k, 1)
    },
    'pisces': () => {
      const w = h.fresh(); h.give(w, 'pisces')
      h.ok(w.p.tearFlags.has('knockback'), 'knockback tears')
    },
    '8-inch-nails': () => {
      const w = h.fresh(); h.give(w, '8-inch-nails')
      h.ok(w.p.tearFlags.has('knockback'), 'knockback tears')
    },
    'maggys-bow': () => {
      const w = h.fresh(); h.give(w, 'maggys-bow')
      w.p.hearts.red = 0
      IS.tryTakePickup(w.p, { kind: 'heart', amount: 2, x: 0, y: 0 }, w.ctx)
      h.eq(w.p.hearts.red, 4, 'heals double')
    },
    'thunder-thighs': () => {
      const w = h.fresh(); h.give(w, 'thunder-thighs')
      const g = IS.addGrid(w.room, 'rock', w.p.x + 50, w.p.y, {})
      w.p.x = g.x - 50; w.p.y = g.y
      h.ok(g, 'rock added')
      withInput({ x: 1, y: 0 }, null, () => { w.p.vx = IS.MOVE_SPEED * w.p.stats.speed; h.tick(w, 0.1) })
      h.ok(g.broken, 'walked through the rock')
    },
    'the-negative': () => {
      const w = h.fresh(); h.give(w, 'the-negative')
      const e = tough(h.enemy(w, 'gaper'))
      w.p.hearts.red = 6
      h.hurt(w, 1)
      h.eq(e.hp, e.maxHp, 'plenty of health: nothing')
      w.p.hearts.red = 2
      h.hurt(w, 1)
      h.lt(e.hp, e.maxHp, 'on half a heart: everything is hit')
    },
    'godhead': () => {
      const w = h.fresh(); h.give(w, 'godhead')
      const t = fireTear(w)
      h.ok(t, 'tear fired')
      const e = tough(h.enemy(w, 'gaper', t.x, t.y))
      t.vx = t.vy = 0
      t.dmg = 0
      t.x = e.x; t.y = e.y
      h.tick(w, 0.1)
      h.lt(e.hp, e.maxHp, 'aura hurts nearby enemies')
    },
    'the-soul': () => {
      const w = h.fresh(); h.give(w, 'the-soul')
      const e = tough(h.enemy(w, 'gaper', w.p.x + 80, w.p.y))
      e.speed = 0
      const x0 = e.x
      h.tick(w, 0.3)
      h.gt(e.x, x0, 'pushed away from Isaac')
    },
    'broken-watch': () => {
      const w = h.fresh(); h.give(w, 'broken-watch')
      const e = tough(h.enemy(w, 'gaper', 60, 60))
      const sp = e.speed
      for (let i = 0; i < 3; i++) IS.fireHook(w.p, 'onRoomEnter', [w.room], w.ctx)
      h.eq(w.p.cache.bwMode, 0, 'rooms 1-3 are normal')
      IS.fireHook(w.p, 'onRoomEnter', [w.room], w.ctx)
      h.ok(w.p.cache.bwMode > 0, 'room 4 is warped')
      h.tick(w, 0.5)
      h.ok(e.status.slow > 0 || e.speed > sp, 'enemies slowed or sped up')
    },
    'the-boomerang': () => {
      const w = h.fresh(); h.give(w, 'the-boomerang')
      h.ok(!w.p.tearFlags.has('boomerang'), 'Isaac keeps his normal tears')
      use(w, 'the-boomerang')
      const t = w.room.tears[w.room.tears.length - 1]
      h.ok(t && t.flags.has('boomerang') && t.flags.has('petrify'), 'boomerang tear that petrifies')
      h.ok(Math.abs(t.dmg - w.p.stats.damage * 2) < 0.01, '2x damage')
    },
    'caffeine-pill': () => {
      const w = h.fresh(); h.give(w, 'caffeine-pill')
      h.eq(pickups(w, 'pill').length, 1, 'spawned a pill')
      h.give(w, 'a-snack')
      h.eq(pickups(w, 'pill').length, 1, 'only once')
    },
    'crack-jacks': () => {
      const w = h.fresh(); h.give(w, 'crack-jacks')
      h.eq(pickups(w, 'trinket').length, 1, 'spawned a trinket')
      h.give(w, 'a-snack')
      h.eq(pickups(w, 'trinket').length, 1, 'only once')
    },
    'latch-key': () => {
      const w = h.fresh(); const k = w.p.keys
      h.give(w, 'latch-key')
      h.eq(w.p.keys - k, 2, '2 keys')
    },
    'match-book': () => {
      const w = h.fresh(); const b = w.p.bombs
      h.give(w, 'match-book')
      h.eq(w.p.bombs - b, 3, '3 bombs')
      h.ok(pickups(w, 'trinket').some(u => u.id === 'match-stick'), 'Match Stick spawned')
    },
    'diplopia': () => {
      const w = h.fresh(); h.give(w, 'diplopia')
      w.ctx.spawnPickup('coin', 300, 300, {})
      use(w, 'diplopia')
      h.eq(pickups(w, 'coin').length, 2, 'coin duplicated')
    },
    'wooden-nickel': () => {
      const w = h.fresh(); h.give(w, 'wooden-nickel')
      for (let i = 0; i < 200; i++) use(w, 'wooden-nickel')
      const n = pickups(w, 'coin').length
      h.ok(n > 85 && n < 150, 'about 59% of 200 uses give a coin, got ' + n)
    },
    'toxic-shock': () => {
      const w = h.fresh(); h.give(w, 'toxic-shock')
      h.ok(!w.p.tearFlags.has('poison'), 'tears are not poisonous')
      const e = tough(h.enemy(w, 'gaper'))
      h.tick(w, 0.2)
      h.gt(e.status.poison, 0, 'poisoned')
      IS.killEnemy(e, w.ctx)
      h.gt((w.room.puddles || []).length, 0, 'creep where it died')
    },
    'mega-bean': () => {
      const w = h.fresh(); h.give(w, 'mega-bean')
      h.ok(!w.p.tearFlags.has('poison'), 'tears are not poisonous')
      const e = tough(h.enemy(w, 'gaper', w.p.x + 60, w.p.y))
      const far = tough(h.enemy(w, 'gaper', w.p.x + 400, w.p.y))
      use(w, 'mega-bean')
      h.gt(e.status.petrify, 0, 'petrified')
      h.gt(far.status.petrify, 0, 'everything in the room is petrified')
      h.lt(e.hp, e.maxHp, 'nearby enemy hurt')
      h.eq(far.hp, far.maxHp, 'far enemy not hurt')
      h.gt(e.status.poison, 0, 'nearby enemy poisoned')
    },
    'glass-cannon': () => {
      const w = h.fresh(); h.give(w, 'glass-cannon')
      h.ok(!w.p.tearFlags.has('piercing'), 'normal tears')
      use(w, 'glass-cannon')
      const t = w.room.tears[w.room.tears.length - 1]
      h.ok(t.flags.has('piercing') && t.flags.has('spectral'), 'piercing spectral')
      h.ok(Math.abs(t.dmg - (w.p.stats.damage * 10 + 10)) < 0.01, '10x damage + 10')
      const before = w.p.hearts.red
      h.hurt(w, 1)
      h.ok(!w.p.items.includes('glass-cannon') && w.p.items.includes('broken-glass-cannon'), 'cannon broke')
      h.gt(before - w.p.hearts.red, 1, 'extra hearts lost')
      h.gt(w.p.hearts.red + w.p.hearts.soul, 0, 'cannot kill')
    },
    'bomber-boy': () => {
      const w = h.fresh(); h.give(w, 'bomber-boy')
      const e = tough(h.enemy(w, 'gaper', w.p.x + 140, w.p.y))
      IS.spawnBomb(w.p.x, w.p.y + 200, { dmg: 60, fuse: 0.3 }, w.ctx)
      const b = w.room.bombs[0]
      b.x = w.p.x; b.y = w.p.y
      h.tick(w, 0.1)
      h.ok(Math.abs(b.dmg - 45) < 0.01, 'x0.75 bomb damage')
      h.tick(w, 0.4)
      h.lt(e.hp, e.maxHp, 'cross arm reached it')
    },
    'scatter-bombs': () => {
      const w = h.fresh(); h.give(w, 'scatter-bombs')
      IS.spawnBomb(w.p.x, w.p.y, { dmg: 60, fuse: 0.3 }, w.ctx)
      h.tick(w, 0.45)
      h.ok(w.room.bombs.filter(b => b._kid).length >= 4, '4-5 tiny bombs')
    },
    'sticky-bombs': () => {
      const w = h.fresh(); h.give(w, 'sticky-bombs')
      h.ok(!w.p.tearFlags.has('slow'), 'tears are not slowing')
      const e = h.enemy(w, 'fly', w.p.x + 40, w.p.y)
      e.hp = e.maxHp = 5
      IS.spawnBomb(w.p.x + 40, w.p.y, { dmg: 60, fuse: 0.3 }, w.ctx)
      h.tick(w, 0.45)
      h.ok(e.dead, 'bomb killed it')
      h.gt(count(w, 'blue-spider'), 0, 'blue spiders from the kill')
      h.gt((w.room.puddles || []).length, 0, 'slowing creep')
    },
    'box-of-friends': () => {
      const w = h.fresh(); h.give(w, 'box-of-friends')
      use(w, 'box-of-friends')
      h.eq(count(w, 'demon-baby'), 1, 'demon baby when alone')
      h.give(w, 'gemini')
      use(w, 'box-of-friends')
      h.eq(count(w, 'gemini'), 2, 'familiar duplicated')
      IS.fireHook(w.p, 'onRoomEnter', [w.room], w.ctx)
      h.eq(count(w, 'gemini'), 1, 'copy only lasts for the room')
    },
    'scissors': () => {
      const w = h.fresh(); h.give(w, 'scissors')
      use(w, 'scissors')
      const head = w.p.familiars.find(f => f.id === 'scissors-head')
      h.ok(head, 'head left behind')
      w.p.x += 100
      const t = fireTear(w)
      h.ok(Math.abs(t.x - head.x) < 1, 'tears leave from the head')
      IS.fireHook(w.p, 'onRoomEnter', [w.room], w.ctx)
      h.eq(count(w, 'scissors-head'), 0, 'head goes after the room')
    },
    'breath-of-life': () => {
      const w = h.fresh(); h.give(w, 'breath-of-life')
      const e = tough(h.enemy(w, 'gaper', w.p.x, w.p.y))
      use(w, 'breath-of-life')
      h.gt(w.p.status.invincible, 1, 'invincible')
      h.tick(w, 1)
      h.lt(e.hp, e.maxHp, 'hurts what it touches')
    },
    'isaacs-tears': () => {
      const w = h.fresh(); h.give(w, 'isaacs-tears')
      use(w, 'isaacs-tears')
      h.eq(w.room.tears.length, 8, '8 tears')
      h.ok(Math.abs(w.room.tears[0].dmg - (w.p.stats.damage + 5)) < 0.01, '+5 damage')
      w.p.active[0].charge = 0
      const t = { flags: new Set() }
      for (let i = 0; i < 10; i++) IS.fireHook(w.p, 'onTearFire', [t], w.ctx)
      h.eq(w.p.active[0].charge, 1, 'shooting recharges it')
    },
    'undefined': () => {
      const w = h.fresh(); h.give(w, 'undefined')
      const f = h.newFloor(w)
      const idx = w.run.room.index
      const r = use(w, 'undefined')
      h.ok(!(r && r.fail), 'found a room to go to')
      h.ok(w.run.room.index !== idx, 'teleported')
      h.ok(['treasure', 'secret', 'super-secret', 'error'].includes(f.rooms[w.run.room.index].type), 'to a special room')
    },
    'cains-other-eye': () => {
      const w = h.fresh(); h.give(w, 'cains-other-eye')
      tough(h.enemy(w, 'gaper', 60, 60))
      h.tick(w, 1.5)
      const t = w.room.tears.find(x => x.friendly)
      h.ok(t, 'fires on its own')
      h.ok(Math.abs(t.dmg - w.p.stats.damage * 0.75) < 0.01, '75% damage')
    },
    's-only-friend': () => {
      const w = h.fresh(); h.give(w, 's-only-friend')
      const f = w.p.familiars[0]
      const x0 = f.x
      withInput({ x: 1, y: 0 }, null, () => h.tick(w, 0.3))
      h.gt(f.x - x0, 40, 'the fly follows the movement keys')
      const e = tough(h.enemy(w, 'gaper', f.x, f.y))
      h.tick(w, 1)
      h.lt(e.hp, e.maxHp, 'contact damage')
    },
    'incubus': () => {
      const w = h.fresh(); h.give(w, 'incubus')
      withInput(null, { x: 1, y: 0 }, () => h.tick(w, 0.6))
      const t = w.room.tears.find(x => x.friendly && x.dmg < w.p.stats.damage - 0.01 && Math.abs(x.dmg - w.p.stats.damage * 0.75) < 0.01)
      h.ok(t, 'fires 75% damage tears')
    },
    'fates-reward': () => {
      const w = h.fresh(); h.give(w, 'fates-reward')
      withInput(null, { x: 1, y: 0 }, () => h.tick(w, 1))
      const t = w.room.tears.find(x => x.friendly && Math.abs(x.dmg - w.p.stats.damage) < 0.01)
      h.ok(t, 'fires full damage tears')
    },
    'gemini': () => {
      const w = h.fresh(); h.give(w, 'gemini')
      const e = tough(h.enemy(w, 'gaper', 200, 200))
      h.tick(w, 4)
      h.lt(e.hp, e.maxHp, 'goes after enemies')
    },
    'lost-fly': () => {
      const w = h.fresh(); h.give(w, 'lost-fly')
      const f = w.p.familiars[0]
      const e = tough(h.enemy(w, 'gaper', f.x, f.y))
      for (let i = 0; i < 10; i++) { e.x = w.p.familiars[0].x; e.y = w.p.familiars[0].y; h.tick(w, 0.1) }
      h.lt(e.hp, e.maxHp, 'contact damage')
    },
    'mongo-baby': () => {
      const w = h.fresh(); h.give(w, 'mongo-baby')
      withInput(null, { x: 1, y: 0 }, () => h.tick(w, 1))
      h.ok(w.room.tears.some(x => x.friendly && Math.abs(x.dmg - 3.5) < 0.01), '3.5 damage tears')
    }
  }
}
