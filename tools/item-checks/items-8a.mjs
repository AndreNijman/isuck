export default h => {
  const IS = h.IS
  const fam = (w, id) => w.p.familiars.filter(f => f.id === id).length
  const itemId = () => IS.items.find(i => i.kind === 'passive' && i.id !== 'damocles-656').id
  return {
    'tinytoma': () => {
      const w = h.fresh(); h.give(w, 'tinytoma')
      h.eq(fam(w, 'tinytoma-big'), 1)
      const f = w.p.familiars[0]
      w.room.shots = w.room.shots || []
      for (let i = 0; i < 3; i++) w.room.shots.push({ x: f.x, y: f.y, r: 5, friendly: false, dead: false })
      h.tick(w, 1 / 60)
      h.eq(fam(w, 'tinytoma-big'), 0, 'big dies after 3 blocked shots')
      h.eq(fam(w, 'tinytoma-small'), 2)
      const s = w.p.familiars.find(x => x.id === 'tinytoma-small')
      w.room.shots.push({ x: s.x, y: s.y, r: 5, friendly: false, dead: false })
      h.tick(w, 1 / 60)
      h.eq(fam(w, 'tinytoma-small'), 1)
      h.eq(fam(w, 'blue-spider'), 2)
      h.tick(w, 5.1)
      h.eq(fam(w, 'tinytoma-big'), 1, 'respawns after 5s')
    },
    'damocles-656': () => {
      const w = h.fresh(); h.give(w, 'damocles-656')
      w.room.firstVisit = true
      IS.spawnPedestal(w.room, itemId(), 200, 200, {})
      IS.spawnPedestal(w.room, itemId(), 300, 200, { price: 15 })
      IS.fireHook(w.p, 'onRoomEnter', [w.room], w.ctx)
      h.eq(w.room.pickups.filter(u => u.kind === 'item').length, 3, 'only the unpriced pedestal doubles')
      h.hurt(w, 1)
      h.ok(w.p.cache.dam)
      w.run.time += 5; w.p.invulnUntil = 0
      w.ctx.chance = () => true
      h.tick(w, 1 / 60)
      h.ok(w.p.dead, 'sword kills')
      const v = h.fresh(); h.give(v, 'damocles-656'); v.p.cache.dam = true; v.ctx.chance = () => true
      v.p.status.invincible = 2; h.tick(v, 1 / 60); h.ok(!v.p.dead, 'invincible prevents death')
    },
    'vasculitis': () => {
      const w = h.fresh(); h.give(w, 'vasculitis')
      const e = h.enemy(w, 'fly'); const n = w.room.tears.length
      IS.killEnemy(e, w.ctx)
      h.eq(w.room.tears.length - n, 5)
    },
    'giant-cell': () => {
      const w = h.fresh(); h.give(w, 'giant-cell')
      h.hurt(w, 1); h.eq(fam(w, 'minisaac'), 1)
      for (let i = 0; i < 6; i++) h.hurt(w, 1)
      h.eq(fam(w, 'minisaac'), 4, 'capped at 4')
    },
    'card-reading': () => {
      const w = h.fresh(); h.give(w, 'card-reading')
      h.newFloor(w)
      const pt = w.p.cache.portals
      h.ok(pt && pt.list.length === 3)
      const boss = pt.list[0]
      const start = w.run.roomIndex
      w.p.x = boss.x; w.p.y = boss.y
      h.tick(w, 1 / 60)
      h.ok(w.run.roomIndex !== start, 'teleported to boss room')
      h.eq(w.run.room.type, 'boss')
      h.ok(!w.p.cache.portals)
    },
    'tooth-and-nail': () => {
      const w = h.fresh(); h.give(w, 'tooth-and-nail')
      h.tick(w, 5.5); h.ok(!(w.p.status.invincible > 0))
      h.tick(w, 0.6); h.gt(w.p.status.invincible, 0)
    },
    'guppys-eye': () => {
      const w = h.fresh(); h.give(w, 'guppys-eye')
      const c = IS.spawnPickup(w.room, 'chest', 300, 300, {})
      h.tick(w, 1 / 60); h.ok(c.revealed)
    },
    'dads-note': () => {
      const w = h.fresh(); h.give(w, 'dads-note')
      h.ok(w.run.flags.ascent)
    },
    'options': () => {
      const w = h.fresh(); h.give(w, 'options')
      h.clearRoom(w)
      const ps = w.room.pickups.filter(u => u.optionsGroup)
      h.eq(ps.length, 2)
      ps[0].taken = true
      h.tick(w, 0.1)
      h.eq(w.room.pickups.filter(u => !u.taken && u.optionsGroup).length, 0, 'sibling vanishes')
    },
    'candy-heart': () => {
      const w = h.fresh(); h.give(w, 'candy-heart')
      const hs = w.room.pickups.filter(u => u.kind === 'heart')
      h.eq(hs.length, 1)
      const snap = () => JSON.stringify([w.p.base.damage, w.p.base.tears, w.p.base.speed, w.p.base.range, w.p.base.luck])
      const before = snap()
      IS.fireHook(w.p, 'onPickup', ['heart', 2], w.ctx)
      h.ok(before !== snap())
    },
    'a-pound-of-flesh': () => {
      const w = h.fresh({ roomType: 'devil' }); h.give(w, 'a-pound-of-flesh')
      const pu = IS.spawnPedestal(w.room, itemId(), 300, 300, {})
      h.eq(pu.priceType, 'heart')
      IS.fireHook(w.p, 'onRoomEnter', [w.room], w.ctx)
      h.eq(pu.priceType, 'coin'); h.eq(pu.price, 15)
      const s = h.fresh({ roomType: 'shop' }); h.give(s, 'a-pound-of-flesh')
      const sp = IS.spawnPedestal(s.room, itemId(), 300, 300, {})
      IS.fireHook(s.p, 'onRoomEnter', [s.room], s.ctx)
      h.eq(sp.priceType, 'heart')
    },
    'redemption': () => {
      const w = h.fresh({ roomType: 'devil' }); h.give(w, 'redemption')
      IS.spawnPedestal(w.room, itemId(), 300, 300, {})
      IS.fireHook(w.p, 'onRoomEnter', [w.room], w.ctx)
      const dmg = w.p.stats.damage, soul = w.p.hearts.soul
      h.newFloor(w)
      h.gt(w.p.stats.damage, dmg); h.eq(w.p.hearts.soul, soul + 2)
      const v = h.fresh({ roomType: 'devil' }); h.give(v, 'redemption')
      const pu = IS.spawnPedestal(v.room, itemId(), 300, 300, {})
      IS.fireHook(v.p, 'onRoomEnter', [v.room], v.ctx)
      pu.taken = true; v.room.pickups.length = 0
      const d2 = v.p.stats.damage
      h.newFloor(v); h.eq(v.p.stats.damage, d2, 'taking an item forfeits the reward')
    },
    'spirit-shackles': () => {
      const w = h.fresh(); h.give(w, 'spirit-shackles')
      w.p.hearts.red = 0; w.p.hearts.soul = 0; w.p.hearts.black = 0
      h.eq(IS.killPlayer(w.p, w.ctx), false)
      h.eq(w.p.hearts.red, 1); h.gt(w.p.status.invincible, 0)
      h.eq(IS.killPlayer(w.p, w.ctx), true, 'only once')
      w.p.dead = false
      IS.fireHook(w.p, 'onPickup', ['soul', 2], w.ctx)
      w.p.hearts.red = 0
      h.eq(IS.killPlayer(w.p, w.ctx), false, 'recharged by soul heart')
    },
    'cracked-orb': () => {
      const w = h.fresh(); h.give(w, 'cracked-orb')
      IS.addGrid(w.room, 'tinted-rock', 300, 300)
      const g = w.room.grid.find(x => x.kind === 'tinted-rock'); h.ok(g)
      w.room.doors = [{ kind: 'treasure', locked: true, keys: 1, open: false }]
      const fl = IS.generateFloor(w.run, IS.floors[0].id, {}); w.run.floor = fl
      const unk = () => fl.rooms.filter(r => r.mapKnown).length
      const k0 = unk()
      h.hurt(w, 1)
      h.eq(w.room.doors[0].locked, false)
      h.gt(unk(), k0)
      h.ok(g.broken || !w.room.grid.includes(g), 'tinted rock destroyed')
    },
    'empty-heart': () => {
      const w = h.fresh(); h.give(w, 'empty-heart')
      w.p.hearts.red = 1
      const m = w.p.hearts.maxRed
      h.newFloor(w); h.eq(w.p.hearts.maxRed, m + 2)
    },
    'montezumas-revenge': () => {
      const w = h.fresh(); h.give(w, 'montezumas-revenge')
      const e = h.enemy(w, 'fly', w.p.x - 100, w.p.y); const hp = e.hp
      const old = IS.input.shoot
      IS.input.shoot = () => ({ x: 1, y: 0 })
      try { h.tick(w, 1.3) } finally { IS.input.shoot = old }
      h.lt(e.hp, hp)
    },
    'bone-spurs': () => {
      const w = h.fresh(); h.give(w, 'bone-spurs')
      const e = h.enemy(w, 'fly'); IS.killEnemy(e, w.ctx)
      h.eq(fam(w, 'bone-shard'), 1)
    },
    'hungry-soul': () => {
      const w = h.fresh(); h.give(w, 'hungry-soul')
      w.ctx.chance = () => true
      const e = h.enemy(w, 'fly'); IS.killEnemy(e, w.ctx)
      h.eq(fam(w, 'hungry-ghost'), 1)
    },
    'inner-child': () => {
      const w = h.fresh(); h.give(w, 'inner-child')
      w.p.hearts.red = 0; w.p.hearts.soul = 0; w.p.hearts.black = 0
      const sp = w.p.stats.speed
      h.eq(IS.killPlayer(w.p, w.ctx), false)
      h.eq(w.p.hearts.red, 1); h.gt(w.p.stats.speed, sp)
      w.p.hearts.red = 0
      h.eq(IS.killPlayer(w.p, w.ctx), true, 'one revive per copy')
    }
  }
}
