// Regression checks for the items rewritten in the items-2 audit.
export default h => {
  const IS = h.IS
  const full = w => { const a = w.p.active[0]; a.charge = a.maxCharge }
  const use = w => { full(w); return IS.useActive(w.p, 0, w.ctx) }
  const kinds = (w, k) => w.room.pickups.filter(u => u.kind === k && !u.dead)
  const familiars = (w, id) => w.p.familiars.filter(f => f.id === id)
  // pretend the fire / move keys are held for the length of fn
  const held = (shoot, move, fn) => {
    const s = IS.input.shoot, m = IS.input.move
    if (shoot) IS.input.shoot = () => shoot
    if (move) IS.input.move = () => move
    try { fn() } finally { IS.input.shoot = s; IS.input.move = m }
  }
  const nearEnemy = (w, id = 'fly') => { const e = h.enemy(w, id); e.x = w.p.x + 30; e.y = w.p.y; return e }
  const clears = (w, n) => { for (let i = 0; i < n; i++) IS.fireHook(w.p, 'onRoomClear', [w.room], w.ctx) }

  return {
    'the-gamekid': () => {
      const w = h.fresh(); h.give(w, 'the-gamekid'); h.eq(w.p.active[0].maxCharge, 2)
      h.ok(!w.p.tearFlags.has('fear'), 'no fear tears from just holding it')
      const e = nearEnemy(w, 'gaper'); const hp = e.hp
      h.ok(use(w)); h.gt(w.p.status.invincible, 6)
      h.gt(e.status.fear, 0, 'enemies are feared')
      h.tick(w, 0.3); h.lt(e.hp, hp, 'contact damage')
      const before = w.room.tears.length
      IS.firePlayerTears(w.p, { x: 1, y: 0 }, w.ctx)
      h.eq(w.room.tears.filter(t => !t.dead).length, before, 'cannot shoot')
      w.p.hearts.red = 2
      IS.fireHook(w.p, 'onEnemyKill', [e], w.ctx); IS.fireHook(w.p, 'onEnemyKill', [e], w.ctx)
      h.eq(w.p.hearts.red, 3, 'two kills heal half a heart')
      h.tick(w, 7)
      IS.firePlayerTears(w.p, { x: 1, y: 0 }, w.ctx)
      h.gt(w.room.tears.filter(t => !t.dead).length, before, 'shooting is back')
    },
    'robo-baby': () => {
      const w = h.fresh(); h.give(w, 'robo-baby')
      h.eq(w.room.lasers.length, 0)
      held({ x: 1, y: 0 }, null, () => h.tick(w, 0.1))
      h.gt(w.room.lasers.length, 0, 'fires a laser')
    },
    'little-c-h-a-d': () => {
      const w = h.fresh(); h.give(w, 'little-c-h-a-d')
      clears(w, 2); h.eq(kinds(w, 'heart').length, 0)
      clears(w, 1); h.eq(kinds(w, 'heart').length, 1, 'third room')
      h.eq(kinds(w, 'heart')[0].amount, 1, 'half a heart')
    },
    'the-book-of-sin': () => {
      const w = h.fresh(); h.give(w, 'the-book-of-sin'); h.ok(use(w))
      h.eq(w.room.pickups.filter(u => !u.dead).length, 1)
    },
    'the-relic': () => {
      const w = h.fresh(); h.give(w, 'the-relic')
      clears(w, 6); h.eq(kinds(w, 'soul').length, 0)
      clears(w, 2); h.eq(kinds(w, 'soul').length, 1, 'by the 8th room')
    },
    'little-gish': () => {
      const w = h.fresh(); h.give(w, 'little-gish'); h.ok(!w.p.tearFlags.has('slow'), "Isaac's own tears are not slowed")
    },
    'little-steven': () => {
      const w = h.fresh(); h.give(w, 'little-steven'); h.ok(!w.p.tearFlags.has('homing'), "Isaac's own tears do not home")
    },
    'ghost-baby': () => {
      const w = h.fresh(); h.give(w, 'ghost-baby'); h.ok(!w.p.tearFlags.has('spectral'), "Isaac's own tears are not spectral")
    },
    'moms-bottle-of-pills': () => {
      const w = h.fresh(); const max = w.p.hearts.maxRed; h.give(w, 'moms-bottle-of-pills')
      h.eq(w.p.hearts.maxRed, max, 'no health up'); h.ok(use(w)); h.eq(kinds(w, 'pill').length, 1)
    },
    'the-common-cold': () => {
      const w = h.fresh(); h.give(w, 'the-common-cold'); w.p.stats.luck = 15
      const t = { flags: new Set() }; IS.fireHook(w.p, 'onTearFire', [t], w.ctx); h.ok(t.flags.has('poison'), '100% by 16 luck')
    },
    'the-d6': () => { const w = h.fresh(); h.give(w, 'the-d6'); h.eq(w.p.active[0].maxCharge, 6) },
    'mr-mega': () => {
      const w = h.fresh(); const b = w.p.stats.bombDamage; h.give(w, 'mr-mega'); h.gt(w.p.stats.bombDamage, b * 1.8)
    },
    'the-pinking-shears': () => {
      const w = h.fresh(); h.give(w, 'the-pinking-shears'); h.eq(w.p.bombs, 1, 'no bombs granted')
      h.ok(use(w)); h.ok(w.p.flags.has('flying')); h.eq(familiars(w, 'pinking-body').length, 1)
      const e = h.enemy(w, 'gaper'); const hp = e.hp; e.x = w.p.x + 100; h.tick(w, 3); h.lt(e.hp, hp, 'the body bites')
      IS.fireHook(w.p, 'onRoomEnter', [w.room], w.ctx)
      h.ok(!w.p.flags.has('flying')); h.eq(familiars(w, 'pinking-body').length, 0)
    },
    'moms-contacts': () => {
      const w = h.fresh(); h.give(w, 'moms-contacts'); w.p.stats.luck = 20
      let n = 0
      for (let i = 0; i < 200; i++) { const t = { flags: new Set() }; IS.fireHook(w.p, 'onTearFire', [t], w.ctx); if (t.flags.has('petrify')) n++ }
      h.gt(n, 60); h.lt(n, 140)
    },
    'the-bean': () => {
      const w = h.fresh(); h.give(w, 'the-bean'); h.ok(!w.p.tearFlags.has('poison'), 'no poison tears')
      const e = nearEnemy(w, 'gaper'); const hp = e.hp; h.ok(use(w)); h.lt(e.hp, hp); h.gt(e.status.poison, 0)
    },
    'ouija-board': () => {
      const w = h.fresh(); const t = w.p.stats.tears; h.give(w, 'ouija-board'); h.gt(w.p.stats.tears, t); h.ok(w.p.tearFlags.has('spectral'))
    },
    'dead-bird': () => {
      const w = h.fresh(); h.give(w, 'dead-bird'); h.eq(familiars(w, 'dead-bird-bird').length, 0)
      h.hurt(w, 1); h.hurt(w, 1); h.eq(familiars(w, 'dead-bird-bird').length, 2, 'a bird per hit')
      const e = h.enemy(w, 'gaper'); const hp = e.hp; h.tick(w, 3); h.lt(e.hp, hp, 'the birds attack')
      IS.fireHook(w.p, 'onRoomEnter', [w.room], w.ctx); h.eq(familiars(w, 'dead-bird-bird').length, 0)
    },
    'odd-mushroom-thin': () => {
      const w = h.fresh(); const d = w.p.stats.damage, max = w.p.hearts.maxRed; h.give(w, 'odd-mushroom-thin')
      h.lt(w.p.stats.damage, d, 'damage goes down'); h.eq(w.p.hearts.maxRed, max, 'no health up')
    },
    'whore-of-babylon': () => {
      const w = h.fresh(); h.give(w, 'whore-of-babylon'); h.tick(w, 0.1)
      const d = w.p.stats.damage, s = w.p.stats.speed
      w.p.hearts.red = 1; h.tick(w, 0.1); h.gt(w.p.stats.damage, d); h.gt(w.p.stats.speed, s)
      w.p.hearts.red = 4; h.tick(w, 0.1); h.eq(w.p.stats.damage, d, 'back to normal')
    },
    'blood-bag': () => {
      const w = h.fresh(); w.p.hearts.red = 1; h.give(w, 'blood-bag'); h.eq(w.p.hearts.red, w.p.hearts.maxRed)
    },
    'monster-manual': () => {
      const w = h.fresh(); h.newFloor(w); h.give(w, 'monster-manual'); const n = w.p.familiars.length
      h.ok(use(w)); h.eq(w.p.familiars.length, n + 1)
      IS.fireHook(w.p, 'onNewFloor', [w.run.floor], w.ctx); h.eq(w.p.familiars.length, n)
    },
    'dead-sea-scrolls': () => {
      const w = h.fresh(); h.give(w, 'dead-sea-scrolls'); h.eq(w.p.active[0].maxCharge, 2)
      nearEnemy(w, 'gaper'); h.ok(use(w), 'always finds an effect')
    },
    'bobby-bomb': () => {
      const w = h.fresh(); h.give(w, 'bobby-bomb'); h.ok(!w.p.tearFlags.has('homing'), 'no homing tears')
      const e = h.enemy(w, 'gaper', w.p.x, w.p.y - 300); const b = w.ctx.spawnBomb(w.p.x, w.p.y, { fuse: 5 })
      h.tick(w, 0.5); h.lt(b.y, w.p.y - 20, 'the bomb crawls towards the enemy'); h.ok(e)
    },
    'razor-blade': () => {
      const w = h.fresh(); h.give(w, 'razor-blade'); h.eq(w.p.bombs, 1, 'no bombs granted'); const d = w.p.stats.damage
      h.ok(use(w)); h.eq(w.p.hearts.red, 4, 'a whole heart'); h.gt(w.p.stats.damage, d)
      h.ok(use(w)); h.eq(w.p.hearts.red, 3, 'half a heart the second time')
      IS.fireHook(w.p, 'onRoomEnter', [w.room], w.ctx); h.eq(w.p.stats.damage, d, 'lasts the room')
    },
    'forget-me-now': () => {
      const w = h.fresh(); h.newFloor(w); h.give(w, 'forget-me-now'); const f = w.run.floor
      h.ok(use(w)); h.ok(w.run.floor !== f, 'new floor object'); h.eq(w.run.floor.id, f.id)
    },
    'a-pony': () => {
      const w = h.fresh(); h.give(w, 'a-pony'); h.ok(w.p.flags.has('flying')); h.ok(w.p.stats.speed >= 1.5)
      held(null, { x: 1, y: 0 }, () => { h.ok(use(w)); h.tick(w, 0.1) })
      h.gt(w.p.vx, 600, 'dashes')
    },
    'white-pony': () => {
      const w = h.fresh(); h.give(w, 'white-pony'); h.ok(w.p.flags.has('flying')); h.ok(w.p.stats.speed >= 1.5)
      held(null, { x: 1, y: 0 }, () => { h.ok(use(w)); h.tick(w, 0.1) })
      h.gt(w.p.vx, 600, 'dashes'); h.gt(w.room.puddles.length, 0, 'beams of light')
    },
    'bomb-bag': () => {
      const w = h.fresh(); h.give(w, 'bomb-bag'); clears(w, 2); h.eq(kinds(w, 'bomb').length, 0)
      clears(w, 1); h.eq(kinds(w, 'bomb').length, 1); h.eq(kinds(w, 'coin').length, 0)
    },
    'guppys-paw': () => {
      const w = h.fresh(); h.give(w, 'guppys-paw'); const max = w.p.hearts.maxRed
      h.ok(use(w)); h.eq(w.p.hearts.maxRed, max - 2); h.eq(w.p.hearts.soul, 6, '3 soul hearts')
      w.p.hearts.maxRed = 0; h.ok(!use(w), 'needs a container')
    },
    'iv-bag': () => {
      const w = h.fresh(); h.give(w, 'iv-bag'); h.ok(use(w)); h.eq(w.p.hearts.red, 5, 'half a heart')
      h.gt(kinds(w, 'coin').length, 0)
    },
    'best-friend': () => {
      const w = h.fresh(); h.give(w, 'best-friend'); h.ok(use(w)); h.eq(familiars(w, 'best-friend').length, 1)
      const e = h.enemy(w, 'gaper'); e.x = w.p.x; e.y = w.p.y; const hp = e.hp
      h.tick(w, 5.5); h.eq(familiars(w, 'best-friend').length, 0, 'gone after 5 seconds'); h.lt(e.hp, hp, 'it explodes')
    },
    'remote-detonator': () => {
      const w = h.fresh(); h.give(w, 'remote-detonator'); const b = w.ctx.spawnBomb(w.p.x + 200, w.p.y, {})
      h.tick(w, 3); h.ok(!b.dead, 'does not go off on its own')
      h.ok(use(w)); h.tick(w, 0.2); h.ok(b.dead, 'detonated')
    },
    'stigmata': () => {
      const w = h.fresh(); const max = w.p.hearts.maxRed, bombs = w.p.bombs; h.give(w, 'stigmata')
      h.eq(w.p.hearts.maxRed, max + 2); h.eq(w.p.bombs, bombs, 'no bombs granted')
    },
    'moms-purse': () => {
      const w = h.fresh(); const max = w.p.hearts.maxRed; h.give(w, 'moms-purse'); h.eq(w.p.hearts.maxRed, max, 'no health up')
    },
    'pageant-boy': () => {
      const w = h.fresh(); const bombs = w.p.bombs; h.give(w, 'pageant-boy'); h.eq(w.p.bombs, bombs, 'no bombs granted')
    },
    'bobs-curse': () => {
      const w = h.fresh(); h.give(w, 'bobs-curse'); h.ok(!w.p.tearFlags.has('poison'), 'no poison tears')
      IS.fireHook(w.p, 'onBombExplode', [{ x: w.p.x, y: w.p.y }], w.ctx); h.eq(w.room.puddles.length, 1)
      h.eq(w.room.puddles[0].status[0][0], 'poison')
    },
    'guppys-head': () => {
      const w = h.fresh(); h.give(w, 'guppys-head'); h.ok(use(w)); const n = familiars(w, 'blue-fly').length; h.ok(n >= 2 && n <= 4)
    },
    'prayer-card': () => {
      const w = h.fresh(); h.give(w, 'prayer-card'); const e = w.p.hearts.eternal || 0; h.ok(use(w)); h.eq(w.p.hearts.eternal, e + 1)
    },
    'notched-axe': () => {
      const w = h.fresh(); h.give(w, 'notched-axe')
      const e = nearEnemy(w, 'gaper'); const hp = e.hp; h.ok(use(w)); h.lt(e.hp, hp, 'swing hurts')
      w.p.active[0].charge = 0; IS.fireHook(w.p, 'onNewFloor', [null], w.ctx); h.eq(w.p.active[0].charge, w.p.active[0].maxCharge)
    },
    'ipecac': () => {
      const w = h.fresh(); const r = w.p.stats.range, s = w.p.stats.shotSpeed; h.give(w, 'ipecac')
      h.ok(Math.abs(w.p.stats.range / r - 0.8) < 0.02, 'range x0.8'); h.ok(Math.abs(w.p.stats.shotSpeed / s - 0.8) < 0.02, 'shot speed x0.8')
    },
    'mutant-spider': () => {
      const w = h.fresh(); h.give(w, 'mutant-spider'); h.eq(IS.shotAngles(w.p, 0).length, 4)
    },
    'the-peeper': () => {
      const w = h.fresh(); h.give(w, 'the-peeper')
      const t = { dmg: 3 }; w.p.eye = -1; IS.fireHook(w.p, 'onTearFire', [t], w.ctx); h.ok(Math.abs(t.dmg - 4.05) < 1e-9)
      const u = { dmg: 3 }; w.p.eye = 1; IS.fireHook(w.p, 'onTearFire', [u], w.ctx); h.eq(u.dmg, 3)
      const e = h.enemy(w, 'gaper'); const hp = e.hp; e.x = w.p.x + 80; h.tick(w, 4); h.lt(e.hp, hp, 'floats into enemies')
    },
    'crystal-ball': () => {
      const w = h.fresh(); h.newFloor(w); h.give(w, 'crystal-ball'); h.ok(use(w)); h.eq(w.room.pickups.filter(u => !u.dead).length, 1)
      const rooms = w.run.floor.rooms
      h.eq(rooms.filter(r => r.mapKnown).length >= rooms.filter(r => r.type !== 'super-secret' && r.type !== 'ultra-secret').length, true, 'mapped')
      h.eq(rooms.filter(r => r.type === 'ultra-secret' && r.mapKnown && !r.visited).length, 0)
    },
    'spirit-of-the-night': () => { const w = h.fresh(); h.give(w, 'spirit-of-the-night'); h.ok(w.p.flags.has('flying')) },
    'holy-grail': () => { const w = h.fresh(); h.give(w, 'holy-grail'); h.ok(w.p.flags.has('flying')) },
    'crack-the-sky': () => {
      const w = h.fresh(); h.give(w, 'crack-the-sky'); const e = nearEnemy(w, 'gaper'); const hp = e.hp
      h.ok(use(w)); h.eq(w.room.puddles.length, 5, '5 beams'); h.tick(w, 0.2); h.lt(e.hp, hp)
    },
    'the-candle': () => {
      const w = h.fresh(); h.give(w, 'the-candle'); h.ok(!w.p.tearFlags.has('burn'), 'no burning tears')
      h.ok(use(w)); h.eq(w.room.puddles.length, 1)
    },
    'd20': () => {
      const w = h.fresh(); h.give(w, 'd20'); h.eq(w.p.active[0].maxCharge, 6)
      const c = w.ctx.spawnPickup('coin', 300, 300, { variant: 'penny' }); h.ok(use(w)); h.ok(c.dead, 'old pickup gone')
      h.eq(w.room.pickups.filter(u => !u.dead).length, 1, 'replaced')
    },
    'harlequin-baby': () => {
      const w = h.fresh(); h.give(w, 'harlequin-baby')
      held({ x: 1, y: 0 }, null, () => h.tick(w, 0.1))
      const t = w.room.tears.filter(t => t.friendly); h.eq(t.length, 2); h.ok(t[0].vy * t[1].vy < 0, 'V shape')
    },
    'rainbow-baby': () => {
      const w = h.fresh(); h.give(w, 'rainbow-baby')
      held({ x: 1, y: 0 }, null, () => h.tick(w, 0.1))
      const t = w.room.tears.filter(t => t.friendly); h.eq(t.length, 1); h.ok(t[0].dmg >= 3 && t[0].dmg <= 5); h.eq(t[0].flags.size, 1)
    },
    'daddy-longlegs': () => {
      const w = h.fresh(); h.give(w, 'daddy-longlegs'); const e = nearEnemy(w, 'gaper'); e.hp = 200; e.maxHp = 200
      h.tick(w, 3.8); h.eq(e.hp, 200, 'not yet'); h.tick(w, 0.5); h.lt(e.hp, 170, 'stomped for 40')
    },
    'polyphemus': () => {
      const w = h.fresh(); h.give(w, 'polyphemus'); h.ok(!w.p.tearFlags.has('piercing'), 'not piercing everything')
    },
    'spider-butt': () => {
      const w = h.fresh(); h.give(w, 'spider-butt'); h.ok(!w.p.tearFlags.has('slow'), 'no slow tears')
      const e = h.enemy(w, 'gaper'); e.hp = 100; e.maxHp = 100; const f = h.enemy(w, 'fly'); f.hp = 1
      h.ok(use(w)); h.eq(e.hp, 90); h.gt(e.status.slow, 0); h.eq(familiars(w, 'blue-spider').length, 1, 'kill spawns a spider')
    },
    'portable-slot': () => {
      const w = h.fresh(); h.give(w, 'portable-slot'); const max = w.p.hearts.maxRed
      w.p.coins = 0; h.ok(!IS.useActive(w.p, 0, w.ctx), 'needs a coin')
      w.p.coins = 5; h.ok(IS.useActive(w.p, 0, w.ctx)); h.eq(w.p.coins, 4); h.eq(w.p.hearts.maxRed, max)
    },
    'the-black-bean': () => {
      const w = h.fresh(); h.give(w, 'the-black-bean'); h.ok(!w.p.tearFlags.has('poison'), 'no poison tears')
      const s = IS.spawnEnemyShot({ x: w.p.x + 60, y: w.p.y, vx: 0, vy: 0, dmg: 1 }, w.ctx)
      h.hurt(w, 1); h.tick(w, 1.5); h.eq(w.room.puddles.length >= 3, true, 'several farts'); h.ok(s.dead, 'shot deflected')
    },
    'sacred-heart': () => {
      const w = h.fresh(); w.p.hearts.red = 1; h.give(w, 'sacred-heart'); h.eq(w.p.hearts.red, w.p.hearts.maxRed, 'full health')
    }
  }
}
