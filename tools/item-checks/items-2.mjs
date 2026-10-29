// Checks for the items in js/data/items-2.js that used to have no effect.
export default h => {
  const IS = h.IS
  const tear = (o) => Object.assign({ x: 300, y: 300, vx: 400, vy: 0, dmg: 4, r: 8, life: 1, flags: new Set() }, o)
  const pickups = (w, kind) => w.room.pickups.filter(u => u.kind === kind && !u.dead)

  return {
    'the-parasite': () => {
      const w = h.fresh(); h.give(w, 'the-parasite')
      const t = tear({ dmg: 4 }); const before = (w.room.tears || []).length
      IS.fireHook(w.p, 'onTearHit', [t, null], w.ctx)
      const kids = (w.room.tears || []).slice(before)
      h.eq(kids.length, 2); h.eq(kids[0].dmg, 2); h.ok(kids[0].split)
      h.ok(kids[0].vy * kids[1].vy < 0, 'opposite sides')
      IS.fireHook(w.p, 'onTearHit', [kids[0], null], w.ctx)
      h.eq((w.room.tears || []).length, before + 2, 'no recursion')
    },
    'the-wafer': () => {
      const w = h.fresh(); h.give(w, 'the-wafer')
      const r = w.p.hearts.red; h.hurt(w, 4); h.eq(w.p.hearts.red, r - 1)
    },
    'money-power': () => {
      const w = h.fresh(); h.give(w, 'money-power'); h.tick(w, 0.1)
      const a = w.p.stats.damage; w.p.coins = 50; h.tick(w, 0.1)
      h.gt(w.p.stats.damage, a)
    },
    'guardian-angel': () => {
      const w = h.fresh(); h.give(w, 'guardian-angel'); h.eq(w.p.familiars.length, 1)
      const e = h.enemy(w, 'fly'); const f = w.p.familiars[0]; e.x = f.x; e.y = f.y; const hp = e.hp; h.tick(w, 0.2)
      h.lt(e.hp, hp)
    },
    '9-volt': () => {
      const w = h.fresh(); h.give(w, 'the-d6'); w.p.active[0].charge = 0
      h.give(w, '9-volt'); h.eq(w.p.active[0].charge, w.p.active[0].maxCharge)
      w.p.active[0].charge = 0; h.clearRoom(w); h.gt(w.p.active[0].charge, 0)
    },
    'forever-alone': () => {
      const w = h.fresh(); h.give(w, 'forever-alone'); h.eq(w.p.familiars.length, 1)
      const e = h.enemy(w, 'fly'); const f = w.p.familiars[0]; e.x = f.x; e.y = f.y; const hp = e.hp; h.tick(w, 0.2)
      h.lt(e.hp, hp)
    },
    'a-lump-of-coal': () => {
      const w = h.fresh(); h.give(w, 'a-lump-of-coal'); h.ok(w.p.tearFlags.has('lump'))
    },
    'guppys-tail': () => {
      const w = h.fresh(); h.give(w, 'guppys-tail')
      const IS2 = h.IS; let chest = 0, none = 0
      for (let i = 0; i < 40; i++) {
        w.room.pickups.length = 0; w.room.cleared = false
        IS.fireHook(w.p, 'onRoomClear', [w.room], w.ctx)
        if (pickups(w, 'chest').length) chest++
        const fake = { kind: 'coin', x: 1, y: 1, dead: false }; w.room.pickups.push(fake)
        h.tick(w, 0.05)
        if (fake.dead) none++
      }
      h.gt(chest, 0); h.gt(none, 0); h.lt(none, 40); void IS2
    },
    'moms-purse': () => {
      const w = h.fresh(); h.give(w, 'moms-purse'); h.eq(pickups(w, 'trinket').length, 1)
      h.give(w, 'the-d6'); h.eq(pickups(w, 'trinket').length, 1, 'once only')
    },
    'pageant-boy': () => {
      const w = h.fresh(); h.give(w, 'pageant-boy'); h.eq(pickups(w, 'coin').length, 7)
    },
    'scapular': () => {
      const w = h.fresh(); h.give(w, 'scapular')
      w.p.hearts.maxRed = 4; w.p.hearts.red = 2; w.p.hearts.soul = 0; w.p.hearts.black = 0
      h.hurt(w, 1); h.eq(w.p.hearts.red, 1); h.eq(w.p.hearts.soul, 2)
    },
    'bum-friend': () => {
      const w = h.fresh(); h.give(w, 'bum-friend'); h.eq(w.p.familiars.length, 1)
      const f = w.p.familiars[0]
      for (let i = 0; i < 4; i++) IS.spawnPickup(w.room, 'coin', f.x + 5, f.y + 5, { variant: 'penny' })
      h.tick(w, 3)
      h.eq(pickups(w, 'coin').length < 4, true, 'collected')
    },
    'infestation': () => {
      const w = h.fresh(); h.give(w, 'infestation'); w.p.hearts.maxRed = 6; w.p.hearts.red = 6
      h.hurt(w, 1); h.gt(w.p.familiars.length, 1)
    },
    'tough-love': () => {
      const w = h.fresh(); h.give(w, 'tough-love'); w.p.stats.luck = 9
      const t = tear({ dmg: 4 }); IS.fireHook(w.p, 'onTearFire', [t], w.ctx)
      h.ok(t.dmg > 12.7, 'dmg x3.2')
    },
    'the-mulligan': () => {
      const w = h.fresh(); h.give(w, 'the-mulligan')
      for (let i = 0; i < 60; i++) IS.fireHook(w.p, 'onTearHit', [tear(), null], w.ctx)
      h.gt(w.p.familiars.length, 0)
    },
    'chemical-peel': () => {
      const w = h.fresh(); h.give(w, 'chemical-peel')
      w.p.eye = -1; const a = tear({ dmg: 4 }); IS.fireHook(w.p, 'onTearFire', [a], w.ctx)
      w.p.eye = 1; const b = tear({ dmg: 4 }); IS.fireHook(w.p, 'onTearFire', [b], w.ctx)
      h.eq(a.dmg, 6); h.eq(b.dmg, 4)
    },
    'habit': () => {
      const w = h.fresh(); h.give(w, 'the-d6'); w.p.active[0].charge = 0; h.give(w, 'habit')
      h.hurt(w, 1); h.eq(w.p.active[0].charge, 1)
    },
    'bloody-lust': () => {
      const w = h.fresh(); h.give(w, 'bloody-lust'); const d = w.p.stats.damage
      h.hurt(w, 1); h.gt(w.p.stats.damage, d)
      w.p.hearts.maxRed = 24; w.p.hearts.red = 24
      for (let i = 0; i < 9; i++) h.hurt(w, 1)
      h.eq(w.p.cache.bl, 6)
      h.newFloor(w); h.eq(w.p.cache.bl, 0)
    },
    'ankh': () => {
      const w = h.fresh(); h.give(w, 'ankh')
      w.p.hearts.red = 1; h.hurt(w, 10)
      h.eq(w.p.dead, false); h.eq(w.p.hearts.soul, 6); h.eq(w.p.hearts.maxRed, 0)
      h.hurt(w, 10); h.ok(w.p.dead, 'single use')
    },
    'celtic-cross': () => {
      const w = h.fresh(); h.give(w, 'celtic-cross'); w.p.stats.luck = 27
      h.hurt(w, 1); h.gt(w.p.status.invincible, 0)
    },
    'sacrificial-dagger': () => {
      const w = h.fresh(); h.give(w, 'sacrificial-dagger'); h.eq(w.p.familiars.length, 1)
      const e = h.enemy(w, 'fly'); const f = w.p.familiars[0]; e.x = f.x; e.y = f.y; const hp = e.hp; h.tick(w, 0.2)
      h.lt(e.hp, hp)
    },
    'mitre': () => {
      const w = h.fresh(); h.give(w, 'mitre')
      for (let i = 0; i < 60; i++) IS.spawnPickup(w.room, 'heart', 100 + i * 10, 200, { variant: 'full' })
      h.tick(w, 0.5)
      const n = pickups(w, 'soul').length
      h.gt(n, 0); h.lt(n, 60)
    },
    'holy-water': () => {
      const w = h.fresh(); h.give(w, 'holy-water')
      const t = tear({ dmg: 3.5 }); IS.fireHook(w.p, 'onTearFire', [t], w.ctx)
      h.eq(t.dmg, 7); h.ok(t.flags.has('holywater'))
      const t2 = tear({ dmg: 3.5 }); IS.fireHook(w.p, 'onTearFire', [t2], w.ctx); h.eq(t2.dmg, 3.5, 'cooldown')
      IS.fireHook(w.p, 'onTearDeath', [t], w.ctx)
      h.eq((w.room.puddles || []).length, 1)
      IS.fireHook(w.p, 'onTearHit', [t, null], w.ctx); h.eq((w.room.puddles || []).length, 1, 'once')
    },
    'fate': () => {
      const w = h.fresh(); const e = w.p.hearts.eternal || 0; h.give(w, 'fate')
      h.eq(w.p.hearts.eternal, e + 1); h.ok(w.p.flags.has('flying'))
    }
  }
}
