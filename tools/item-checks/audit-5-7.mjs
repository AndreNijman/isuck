// Behaviour checks for items in js/data/items-5.js and items-7.js that used to be generated stubs.
export default h => {
  const IS = h.IS
  const withInput = (move, shoot, fn) => {
    const om = IS.input.move, os = IS.input.shoot
    IS.input.move = () => move || { x: 0, y: 0 }
    IS.input.shoot = () => shoot || { x: 0, y: 0 }
    try { fn() } finally { IS.input.move = om; IS.input.shoot = os }
  }
  const charged = (w, id) => {
    h.give(w, id)
    const a = w.p.active.find(x => x && x.id === id)
    a.charge = a.maxCharge
    return IS.useActive(w.p, w.p.active.indexOf(a), w.ctx)
  }
  const tearOf = () => ({ x: 0, y: 0, vx: 600, vy: 0, dmg: 3.5, r: 8, life: 1, flags: new Set(), friendly: true })

  return {
    // --- items-5 ---
    'dead-eye': () => {
      const w = h.fresh(); h.give(w, 'dead-eye')
      const e = h.enemy(w, 'fly'); e.hp = 1000
      const t0 = tearOf()
      IS.fireHook(w.p, 'onTearFire', [t0], w.ctx)
      for (let i = 0; i < 3; i++) { const t = tearOf(); IS.fireHook(w.p, 'onTearFire', [t], w.ctx); IS.fireHook(w.p, 'onTearHit', [t, e], w.ctx) }
      const t1 = tearOf(); IS.fireHook(w.p, 'onTearFire', [t1], w.ctx)
      h.gt(t1.dmg, t0.dmg, 'streak of hits raises tear damage')
      IS.fireHook(w.p, 'onTearDeath', [tearOf()], w.ctx)
      const t2 = tearOf(); IS.fireHook(w.p, 'onTearFire', [t2], w.ctx)
      h.lt(t2.dmg, t1.dmg, 'a miss resets the streak')
    },
    'farting-baby': () => {
      const w = h.fresh(); h.give(w, 'farting-baby')
      h.eq(w.p.familiars.filter(f => f.id === 'farting-baby').length, 1)
    },
    'lil-loki': () => {
      const w = h.fresh(); h.give(w, 'lil-loki')
      h.eq(w.p.familiars.filter(f => f.id === 'lil-loki').length, 1)
      const e = h.enemy(w, 'fly'); e.hp = 1000
      withInput(null, { x: 1, y: 0 }, () => h.tick(w, 1.5))
      h.ok(w.room.tears.length > 0 || e.hp < 1000, 'Loki fires')
    },
    // --- items-7 ---
    'orphan-socks': () => {
      const w = h.fresh(); h.give(w, 'orphan-socks')
      const tot = () => w.p.hearts.red + (w.p.hearts.soul || 0)
      const r0 = tot()
      h.hurt(w, 1, { kind: 'creep' })
      h.eq(tot(), r0, 'creep does nothing')
      h.hurt(w, 1, { kind: 'contact' })
      h.lt(tot(), r0, 'other damage still hurts')
    },
    monstrance: () => {
      const w = h.fresh(); h.give(w, 'monstrance')
      const near = h.enemy(w, 'fly', w.p.x + 40, w.p.y); near.hp = 1000
      const far = h.enemy(w, 'fly', w.p.x + 110, w.p.y); far.hp = 1000
      near.speed = far.speed = 0
      h.tick(w, 1)
      h.lt(near.hp, 1000, 'close enemy burns')
      h.lt(near.hp, far.hp, 'closer takes more')
    },
    'free-lemonade': () => {
      const w = h.fresh()
      const e = h.enemy(w, 'fly', w.p.x + 60, w.p.y); e.hp = 1000
      charged(w, 'free-lemonade')
      h.tick(w, 2)
      h.lt(e.hp, 1000, 'creep hurts enemies')
    },
    larynx: () => {
      const w = h.fresh()
      const e = h.enemy(w, 'fly', w.p.x + 80, w.p.y); e.hp = 1000
      charged(w, 'larynx')
      h.lt(e.hp, 1000, 'scream hurts')
    },
    sulfur: () => {
      const w = h.fresh()
      charged(w, 'sulfur')
      h.ok(w.p.flags.has('brimstone'), 'brimstone flag while active')
      h.newRoom(w.run, w.ctx)
      IS.fireHook(w.p, 'onRoomEnter', [w.run.room], w.ctx)
      h.ok(!w.p.flags.has('brimstone'), 'ends on room change')
    },
    'red-stew': () => {
      const w = h.fresh(); h.give(w, 'red-stew')
      h.gt(w.p.stats.damage, 8, 'huge damage up')
    },
    'booster-pack': () => {
      const w = h.fresh(); h.give(w, 'booster-pack')
      h.eq(w.room.pickups.filter(p => p.kind === 'card').length, 5)
    },
    'battery-pack': () => {
      const w = h.fresh(); h.give(w, 'battery-pack')
      h.gt(w.room.pickups.filter(p => p.kind === 'battery').length, 1)
    },
    'meat-cleaver': () => {
      const w = h.fresh()
      const a = h.enemy(w, 'fly', w.p.x + 100, w.p.y); a.hp = 20; a.maxHp = 20
      const n0 = w.room.enemies.length
      charged(w, 'meat-cleaver')
      h.gt(w.room.enemies.length, n0, 'enemy split')
      h.lt(a.hp, 20, 'health reduced')
    },
    'knife-piece-1': () => {
      const w = h.fresh(); h.give(w, 'knife-piece-1')
      h.ok(!w.p.flags.has('knife'))
      h.give(w, 'knife-piece-2')
      h.ok(w.p.flags.has('knife'), 'both pieces make a knife')
    },
    revelation: () => {
      const w = h.fresh(); h.give(w, 'revelation')
      h.ok(w.p.flags.has('flying'))
    },
    dogma: () => {
      const w = h.fresh(); h.give(w, 'dogma')
      h.ok(w.p.flags.has('flying'))
    },
    'evil-charm': () => {
      const w = h.fresh(); h.give(w, 'evil-charm')
      w.p.status.poison = 5
      h.tick(w, 0.1)
      h.ok(!w.p.status.poison, 'poison immunity')
    },
    uranus: () => {
      const w = h.fresh(); h.give(w, 'uranus')
      const t = tearOf(); IS.fireHook(w.p, 'onTearFire', [t], w.ctx)
      h.ok(t.flags.has('freeze') || (Array.isArray(t.flags) && t.flags.includes('freeze')))
    },
    'mega-mush': () => {
      const w = h.fresh()
      const d0 = w.p.stats.damage
      charged(w, 'mega-mush')
      h.gt(w.p.stats.damage, d0 * 2, 'x4 damage')
      h.ok(w.p.status.invincible > 10, 'invincible')
    },
    'urn-of-souls': () => {
      const w = h.fresh()
      charged(w, 'urn-of-souls')
      withInput(null, { x: 1, y: 0 }, () => h.tick(w, 0.5))
      h.gt(w.room.tears.length, 0, 'flames')
    },
    jupiter: () => {
      const w = h.fresh(); h.give(w, 'jupiter')
      h.gt(w.p.hearts.maxRed, 6)
    },
    'lost-soul': () => {
      const w = h.fresh(); h.give(w, 'lost-soul')
      h.eq(w.p.familiars.filter(f => f.id === 'lost-soul').length, 1)
    },
    'sharp-key': () => {
      const w = h.fresh()
      const k0 = w.p.keys
      charged(w, 'sharp-key')
      h.eq(w.p.keys, k0 + 5 - 1, '+5 keys, one thrown')
    },
    'rocket-in-a-jar': () => {
      const w = h.fresh(); const b0 = w.p.bombs
      h.give(w, 'rocket-in-a-jar')
      h.eq(w.p.bombs, b0 + 5)
    }
  }
}
