// Engine fixes from the items audit: permanent familiars, removeItem on actives, stat
// multipliers, broken hearts, bomb hook, noRoomCharge, flight, decoys, rock tears,
// the Marked target, Bag of Crafting, Satanic Bible and the range unit.
export default h => {
  const { IS } = h
  return {
    'familiar-life-zero-is-permanent': () => {
      const w = h.fresh(); const f = w.ctx.spawnFamiliar('blue-spider', { life: 0 })
      h.eq(f.life, null); h.tick(w, 2); h.ok(w.p.familiars.includes(f) && !f.dead, 'still alive after 2s')
    },
    'remove-active-clears-slot': () => {
      const w = h.fresh(); h.give(w, 'the-bible'); h.eq(w.p.active[0].id, 'the-bible')
      IS.removeItem(w.p, 'the-bible', w.ctx); h.ok(!w.p.active[0], 'slot emptied')
    },
    'mult-bomb-damage-mr-mega': () => {
      const w = h.fresh(); const b = w.p.stats.bombDamage; h.give(w, 'mr-mega')
      h.ok(Math.abs(w.p.stats.bombDamage - b * 1.85) < .01, 'x1.85 from mult'); h.ok(!IS.itemsById['mr-mega'].hooks, 'no onStats workaround')
    },
    'mult-range-shotspeed-ipecac': () => {
      const w = h.fresh(); const r = w.p.stats.range, s = w.p.stats.shotSpeed; h.give(w, 'ipecac')
      h.ok(Math.abs(w.p.stats.range - r * .8) < .01, 'range x0.8 once'); h.ok(Math.abs(w.p.stats.shotSpeed - s * .8) < .001, 'shot speed x0.8 once')
      h.ok(!(IS.itemsById.ipecac.hooks && IS.itemsById.ipecac.hooks.onStats), 'no onStats workaround')
    },
    'broken-hearts-cap-containers': () => {
      const w = h.fresh(); IS.addMaxHearts(w.p, 40); h.eq(w.p.hearts.maxRed, 24)
      IS.addBrokenHearts(w.p, 3, w.ctx); h.eq(w.p.hearts.broken, 3); h.eq(w.p.hearts.maxRed, 18)
      IS.addMaxHearts(w.p, 40); h.eq(w.p.hearts.maxRed, 18, 'cannot refill past broken hearts')
    },
    'broken-hearts-twelve-kills': () => {
      const w = h.fresh(); IS.addBrokenHearts(w.p, 12, w.ctx); h.ok(w.p.dead, 'dead at 12 broken hearts')
    },
    'bomb-explode-fires-hook': () => {
      const w = h.fresh(); let n = 0
      IS.itemsById['probe-bomb'] = { id: 'probe-bomb', kind: 'passive', hooks: { onBombExplode: () => { n++ } } }
      w.p.items.push('probe-bomb'); w.p.itemCounts['probe-bomb'] = 1
      IS.spawnBomb(w.p.x + 200, w.p.y, { fuse: .02, dmg: 10 }, w.ctx); h.tick(w, .2)
      h.eq(n, 1); delete IS.itemsById['probe-bomb']
    },
    'no-room-charge-flag': () => {
      const w = h.fresh(); h.give(w, 'the-bible'); h.enemy(w); w.p.active[0].charge = 0; h.clearRoom(w)
      h.eq(w.p.active[0].charge, 1, 'charges normally')
      const v = h.fresh(); h.give(v, 'the-bible'); h.give(v, '4-5-volt'); h.ok(v.p.flags.has('noRoomCharge'), 'flag set'); h.enemy(v); v.p.active[0].charge = 0; h.clearRoom(v)
      h.eq(v.p.active[0].charge, 0, 'no charge from clearing')
    },
    'flight-flag-from-astral-projection': () => {
      const w = h.fresh(); h.give(w, 'astral-projection'); h.ok(!w.p.flags.has('flying'))
      w.p.cache.astralBoostOn = true; w.p.cache.astralBoost = 1e9; IS.recalcStats(w.p); h.ok(w.p.flags.has('flying'), 'flying while boosted')
    },
    'enemies-target-decoy': () => {
      const w = h.fresh(); const e = h.enemy(w, 'fly', w.p.x + 300, w.p.y)
      h.eq(IS.enemyTarget(e, w.ctx), w.p)
      const f = w.ctx.spawnFamiliar('best-friend'); f.x = e.x - 50; f.y = e.y
      h.eq(IS.enemyTarget(e, w.ctx), f, 'decoy preferred')
    },
    'rock-tear-breaks-rocks': () => {
      const w = h.fresh(); const g = IS.addGrid(w.room, 'rock', 7.5 * IS.TILE, 3.5 * IS.TILE); h.ok(g, 'rock placed')
      IS.spawnTear({ x: g.x - 120, y: g.y, vx: 600, vy: 0, life: 2, flags: ['rock'] }, w.ctx); h.tick(w, .5)
      h.ok(g.broken || g.hp <= 0 || !w.room.grid.includes(g) || g.destroyed, 'rock tear destroyed the rock')
      const v = h.fresh(); const g2 = IS.addGrid(v.room, 'rock', 7.5 * IS.TILE, 3.5 * IS.TILE)
      IS.spawnTear({ x: g2.x - 120, y: g2.y, vx: 600, vy: 0, life: 2, flags: [] }, v.ctx); h.tick(v, .5)
      h.ok(!(g2.broken || g2.hp <= 0), 'plain tear leaves it')
    },
    'marked-target-in-cache': () => {
      const w = h.fresh(); h.give(w, 'marked'); h.tick(w, .1)
      h.ok(w.p.cache.marked && typeof w.p.cache.marked.x === 'number', 'target exists for the renderer')
    },
    'bag-of-crafting-consumes-pickups': () => {
      const w = h.fresh(); h.give(w, 'bag-of-crafting'); const c = w.p.coins
      IS.spawnPickup(w.room, 'coin', w.p.x, w.p.y, { rng: w.room.rng, run: w.run })
      IS.updateInteractions(w.room, 1 / 60, w.ctx)
      h.eq(w.p.coins, c, 'coin went into the bag'); h.eq(w.p.cache.bag.length, 1)
    },
    'satanic-bible-makes-boss-reward-a-devil-deal': () => {
      const w = h.fresh({ roomType: 'boss' }); delete w.run.pools; w.room.type = 'boss'; w.room.cleared = false; h.give(w, 'satanic-bible')
      IS.useActive(w.p, 0, w.ctx); w.p.active[0].charge = w.p.active[0].maxCharge; IS.useActive(w.p, 0, w.ctx)
      h.ok(w.run.flags.satanicBible, 'flag set when used before the boss dies')
      w.room.hadEnemies = true; IS.checkClear(w.room, w.ctx); h.tick(w, 1)
      const deal = w.room.pickups.filter(u => u.kind === 'item' && u.priceType === 'heart')
      h.gt(deal.length, 0, 'devil deal pedestals')
    },
    'range-unit-is-eighty': () => {
      const w = h.fresh(); const r = w.p.stats.range; h.give(w, 'magic-mushroom')
      h.ok(Math.abs(w.p.stats.range - r - 200) < 1 || w.p.stats.range > r, 'magic mushroom range raised')
      h.eq(IS.itemsById['magic-mushroom'].stats.range, 200)
    }
  }
}
