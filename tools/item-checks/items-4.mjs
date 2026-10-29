// Behaviour checks for the items in js/data/items-4.js that used to do nothing.
export default h => {
  const IS = h.IS
  const withInput = (move, shoot, fn) => {
    const om = IS.input.move, os = IS.input.shoot
    IS.input.move = () => move || { x: 0, y: 0 }
    IS.input.shoot = () => shoot || { x: 0, y: 0 }
    try { fn() } finally { IS.input.move = om; IS.input.shoot = os }
  }
  const orbitalHits = (id) => {
    const w = h.fresh(); h.give(w, id)
    h.eq(w.p.familiars.filter(f => f.id === id).length, 1, 'familiar spawned')
    const f = w.p.familiars[0]
    const e = h.enemy(w, 'fly', f.x, f.y)
    e.hp = 1000
    const hp0 = e.hp
    for (let i = 0; i < 30; i++) { const ff = w.p.familiars[0]; e.x = ff.x; e.y = ff.y; h.tick(w, 0.1) }
    h.lt(e.hp, hp0, id + ' damaged an enemy')
    return w
  }
  const rockNear = (w, x, y) => {
    const g = IS.addGrid(w.room, 'rock', x, y, {})
    h.ok(g, 'rock added')
    return g
  }
  const reveal = w => {
    const f = h.newFloor(w)
    return f
  }

  return {
    'dark-bum': () => {
      const w = h.fresh(); h.give(w, 'dark-bum')
      h.eq(w.p.familiars.length, 1)
      const f = w.p.familiars[0]
      const shop = IS.spawnPickup(w.room, 'heart', f.x + 30, f.y, { amount: 2, shop: true, price: 3 })
      const a = IS.spawnPickup(w.room, 'heart', f.x + 30, f.y, { amount: 2 })
      const b = IS.spawnPickup(w.room, 'heart', f.x + 40, f.y, { amount: 2 })
      for (let i = 0; i < 120; i++) h.tick(w, 0.05)
      h.ok(a.taken || a.dead, 'ate floor heart')
      h.ok(b.taken || b.dead, 'ate second heart')
      h.ok(!shop.taken && !shop.dead, 'ignored shop heart')
      h.ok(w.room.pickups.some(p => p.kind === 'black' && !p.taken), 'spawned a black heart')
    },
    'big-fan': () => { orbitalHits('big-fan') },
    'friend-zone': () => { orbitalHits('friend-zone') },
    'sworn-protector': () => {
      const w = orbitalHits('sworn-protector')
      const f = w.p.familiars[0]
      for (let i = 0; i < 10; i++) {
        (w.room.shots || (w.room.shots = [])).push({ x: f.x, y: f.y, r: 6, vx: 0, vy: 0, friendly: false, dead: false })
      }
      h.tick(w, 0.1)
      h.gt(f.blocked, 9, 'blocked shots')
      h.tick(w, 0.1)
      h.ok(w.room.pickups.some(p => p.kind === 'heart' && p.variant === 'eternal'), 'eternal heart spawned')
    },
    'leo': () => {
      const w = h.fresh(); h.give(w, 'leo')
      const g = rockNear(w, w.p.x + 160, w.p.y)
      w.p.x = g.x - g.r - w.p.r - 2; w.p.y = g.y
      h.tick(w, 0.1)
      h.ok(!g.broken, 'standing still does not break rock')
      withInput({ x: 1, y: 0 }, null, () => { h.tick(w, 0.1) })
      h.ok(g.broken, 'walking into a rock breaks it')
    },
    'virgo': () => {
      const w = h.fresh(); h.give(w, 'virgo')
      w.p.stats.luck = 10
      h.hurt(w, 1)
      h.gt(w.p.status.invincible, 0, 'temporarily invincible at 10 luck')
      const bad = IS.pills.find(p => p.good === false)
      const w2 = h.fresh(); h.give(w2, 'virgo')
      w2.p.pocket.push({ kind: 'pill', id: bad.id })
      const used = []
      const orig = w2.ctx.usePill
      w2.ctx.usePill = function (id, horse) { used.push(id); return orig.call(this, id, horse) }
      IS.usePocket(w2.p, 0, w2.ctx)
      h.eq(used.length, 1, 'a replacement pill was used')
      h.ok(used[0] !== bad.id && IS.pillsById[used[0]].good, 'replacement is a good pill')
      h.eq(w2.p.pocket.length, 0, 'pill consumed')
    },
    'aquarius': () => {
      const w = h.fresh(); h.give(w, 'aquarius')
      withInput({ x: 1, y: 0 }, null, () => { h.tick(w, 1) })
      h.gt((w.room.puddles || []).length, 2, 'creep trail')
    },
    'judas-shadow': () => {
      const w = h.fresh(); h.give(w, 'judas-shadow')
      const d0 = w.p.stats.damage
      w.p.hearts.red = 1
      h.hurt(w, 4)
      h.ok(!w.p.dead, 'revived')
      h.eq(w.p.hearts.black, 2)
      h.eq(w.p.hearts.maxRed, 0)
      h.eq(w.p.hearts.red, 0)
      h.ok(w.p.stats.damage > d0 * 1.9, 'damage doubled')
      h.hurt(w, 4)
      h.ok(w.p.dead, 'only once')
    },
    'holy-mantle': () => {
      const w = h.fresh(); h.give(w, 'holy-mantle')
      const hp = w.p.hearts.red
      h.hurt(w, 2)
      h.eq(w.p.hearts.red, hp, 'first hit negated')
      h.hurt(w, 2)
      h.eq(w.p.hearts.red, hp - 2, 'second hit lands')
      IS.fireHook(w.p, 'onRoomEnter', [w.room], w.ctx)
      h.hurt(w, 2)
      h.eq(w.p.hearts.red, hp - 2, 'negated again in a new room')
    },
    'strange-attractor': () => {
      const w = h.fresh(); h.give(w, 'strange-attractor')
      h.ok(w.p.tearFlags.has('magnetize'))
    },
    'cursed-eye': () => {
      const w = h.fresh(); h.give(w, 'cursed-eye')
      const n0 = (w.room.tears || []).length
      withInput(null, { x: 1, y: 0 }, () => { h.tick(w, 1.7) })
      h.ok((w.room.tears || []).length >= n0 + 5, 'wave of 5 tears')
      const tp = []
      w.ctx.teleport = t => { tp.push(t) }
      withInput(null, { x: 1, y: 0 }, () => { w.run.time += 5; h.tick(w, 0.1); IS.damagePlayer(w.p, 1, { name: 'test' }, w.ctx) })
      h.eq(tp.length, 1, 'teleported when hurt while shooting')
    },
    'mysterious-liquid': () => {
      const w = h.fresh(); h.give(w, 'mysterious-liquid')
      const t = { x: w.p.x + 100, y: w.p.y, vx: 0, vy: 0, dmg: 3.5, flags: new Set(), friendly: true }
      IS.fireHook(w.p, 'onTearDeath', [t], w.ctx)
      h.eq((w.room.puddles || []).length, 1, 'puddle left')
      IS.fireHook(w.p, 'onTearHit', [t, null], w.ctx)
      h.eq(w.room.puddles.length, 1, 'no duplicate for the same tear')
    },
    'samsons-chains': () => {
      const w = h.fresh(); h.give(w, 'samsons-chains')
      h.eq(w.p.familiars.length, 1)
      const f = w.p.familiars[0]
      const g = rockNear(w, f.x, f.y)
      h.tick(w, 0.1)
      h.ok(g.broken, 'ball smashed a rock')
    },
    'the-polaroid': () => {
      const w = h.fresh(); h.give(w, 'the-polaroid')
      w.p.hearts.red = 6
      h.hurt(w, 1)
      h.ok(!(w.p.status.invincible > 0), 'not triggered at high health')
      w.p.hearts.red = 2
      h.hurt(w, 1)
      h.ok(w.p.status.invincible > 4, 'invincible for 5s at half a heart')
    },
    'lazarus-rags': () => {
      const w = h.fresh(); h.give(w, 'lazarus-rags')
      h.hurt(w, 99)
      h.ok(!w.p.dead, 'revived')
      h.eq(w.p.hearts.red, 2)
      h.eq(w.p.hearts.maxRed, 2)
      h.hurt(w, 99)
      h.ok(w.p.dead, 'only once')
    },
    'the-mind': () => {
      const w = h.fresh(); h.give(w, 'the-mind')
      h.ok(w.p.flags.has('fullMinimap'))
      reveal(w)
      const rooms = w.run.floor.rooms
      h.ok(rooms.length > 2)
      const normal = rooms.filter(r => r.type !== 'secret' && r.type !== 'super-secret')
      h.ok(normal.every(r => r.mapKnown), 'all ordinary rooms revealed')
      h.ok(rooms.filter(r => r.type === 'secret' || r.type === 'super-secret').every(r => r.mapKnown), 'the item carries seeSecretRooms, so the engine reveals secrets too')
    },
    'lil-chest': () => {
      const w = h.fresh(); h.give(w, 'lil-chest')
      let spawned = 0
      for (let i = 0; i < 40; i++) {
        const n = w.room.pickups.length
        IS.fireHook(w.p, 'onRoomClear', [w.room], w.ctx)
        if (w.room.pickups.length > n) spawned++
      }
      h.gt(spawned, 3, 'sometimes spawns a pickup')
      h.lt(spawned, 40, 'not every time')
    },
    'epiphora': () => {
      const w = h.fresh(); h.give(w, 'epiphora')
      const count = secs => {
        const w2 = h.fresh(); h.give(w2, 'epiphora')
        let n = 0
        const orig = IS.fireHook
        withInput(null, { x: 1, y: 0 }, () => {
          const t0 = (w2.room.tears || []).length
          for (let i = 0; i < Math.round(secs * 60); i++) {
            w2.run.time += IS.DT
            IS.refreshCtx(w2.ctx, w2.run.room, IS.DT)
            IS.updateWeapon(w2.p, { x: 1, y: 0 }, IS.DT, w2.ctx)
            IS.fireHook(w2.p, 'onUpdate', [IS.DT], w2.ctx)
            IS.updateRoom(w2.run.room, IS.DT, w2.ctx)
          }
          n = (w2.room.tears || []).length - t0
        })
        return n
      }
      const early = count(3)
      // fire rate after ramp: shoot 3s more, count only the second 3s
      const w3 = h.fresh(); h.give(w3, 'epiphora')
      let late = 0
      withInput(null, { x: 1, y: 0 }, () => {
        const shots = []
        for (let i = 0; i < 360; i++) {
          w3.run.time += IS.DT
          IS.refreshCtx(w3.ctx, w3.run.room, IS.DT)
          const before = w3.p.nextShot
          IS.updateWeapon(w3.p, { x: 1, y: 0 }, IS.DT, w3.ctx)
          if (w3.p.nextShot > before) shots.push(i)
          IS.fireHook(w3.p, 'onUpdate', [IS.DT], w3.ctx)
        }
        late = shots.filter(i => i >= 240).length
        const first = shots.filter(i => i < 120).length
        h.gt(late, first * 1.5, 'fire rate ramps up (' + first + ' -> ' + late + ')')
      })
      h.ok(early > 0)
      // accuracy: tears get angular spread once ramped
      w.p.cache.epiT = 3
      const t = { x: 0, y: 0, vx: 100, vy: 0, flags: new Set() }
      let spread = false
      for (let i = 0; i < 10; i++) { t.vx = 100; t.vy = 0; IS.fireHook(w.p, 'onTearFire', [t], w.ctx); if (Math.abs(t.vy) > 0.5) spread = true }
      h.ok(spread, 'accuracy decreases')
    }
  }
}
