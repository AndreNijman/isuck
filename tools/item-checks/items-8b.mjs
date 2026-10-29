export default h => ({
  'glitched-crown': () => {
    const w = h.fresh(); h.IS.initPools(w.run); h.give(w, 'glitched-crown')
    const pu = h.IS.spawnPedestal(w.room, 'the-sad-onion', 300, 300)
    h.tick(w, 0.5)
    h.ok(pu.glitch && pu.glitch.length >= 2, 'glitch list built')
    const seen = new Set()
    for (let i = 0; i < 12; i++) { h.tick(w, 0.41); seen.add(pu.id) }
    h.gt(seen.size, 1, 'pedestal cycles')
    h.eq(pu.itemId, pu.id)
  },
  'belly-jelly': () => {
    const w = h.fresh(); h.give(w, 'belly-jelly')
    w.p.hearts.red = w.p.hearts.maxRed = 24
    let cancelled = 0
    for (let i = 0; i < 40; i++) { w.p.hearts.red = 24; const e ={ name: 'x', kind: 'contact', x: w.p.x + 30, y: w.p.y }; if (!h.hurt(w, 1, e)) cancelled++; h.ok(e.kbx > 0, 'enemy knocked away') }
    h.gt(cancelled, 5); h.lt(cancelled, 35)
    const shot = { friendly: false, vx: 200, vy: 0, flags: new Set(), dmg: 1 }
    let rev = 0
    for (let i = 0; i < 40; i++) { w.p.hearts.red = 24; shot.vx = 200; shot.friendly = false; h.hurt(w, 1, shot); if (shot.friendly) rev++ }
    h.gt(rev, 5); h.lt(rev, 35)
  },
  'sacred-orb': () => {
    const w = h.fresh(); h.IS.initPools(w.run); h.give(w, 'sacred-orb')
    const IS = h.IS
    const low = Object.keys(IS.itemsById).find(id => (IS.itemsById[id].quality || 0) <= 1 && (IS.itemsById[id].pools || []).includes('treasure'))
    h.ok(low, 'a low quality item exists')
    const pu = IS.spawnPedestal(w.room, low, 300, 300)
    h.tick(w, 0.1)
    h.ok(pu.sacredChecked)
    h.ok((IS.itemsById[pu.id].quality || 0) >= 2, 'rerolled to quality >= 2')
  },
  'sanguine-bond': () => {
    const w = h.fresh(); h.give(w, 'sanguine-bond')
    const room = h.newRoom(w.run, w.ctx, 'devil'); w.room = room
    h.IS.fireHook(w.p, 'onRoomEnter', [room], w.ctx)
    h.ok(room.grid.some(g => g.kind === 'spikes'), 'spikes spawned')
    let acted = 0
    for (let i = 0; i < 60; i++) {
      const before = w.p.hearts.black + w.p.coins + (w.p.cache.sbUps || 0) + room.pickups.length + (w.p.transforms.leviathan || 0)
      w.p.hearts.red = w.p.hearts.maxRed
      h.hurt(w, 1, 'spikes')
      const after = w.p.hearts.black + w.p.coins + (w.p.cache.sbUps || 0) + room.pickups.length + (w.p.transforms.leviathan || 0)
      if (after > before) acted++
    }
    h.gt(acted, 10)
    h.gt(w.p.cache.sbUps || 0, 0)
    const w2 = h.fresh(); h.give(w2, 'sanguine-bond'); const d0 = w2.p.stats.damage
    w2.p.cache.sbUps = 2; h.IS.recalcStats(w2.p); h.gt(w2.p.stats.damage, d0)
  },
  'the-swarm': () => {
    const w = h.fresh(); h.give(w, 'the-swarm')
    h.eq(w.p.familiars.length, 8)
    h.enemy(w, 'fly'); h.clearRoom(w)
    h.eq(w.p.familiars.length, 9)
  },
  'bloody-gust': () => {
    const w = h.fresh(); h.give(w, 'bloody-gust')
    const sp = w.p.stats.speed, t = w.p.stats.tears
    h.hurt(w, 1)
    h.gt(w.p.stats.speed, sp); h.gt(w.p.stats.tears, t)
    for (let i = 0; i < 10; i++) { w.p.hearts.red = w.p.hearts.maxRed; h.hurt(w, 1) }
    h.ok(w.p.stats.speed <= sp + 1.03, 'speed cap')
    h.newFloor(w)
    h.eq(w.p.stats.speed, sp)
  },
  'salvation': () => {
    const w = h.fresh(); h.give(w, 'salvation')
    const e = h.enemy(w, 'fly', w.p.x + 60, w.p.y)
    const far = h.enemy(w, 'fly', w.p.x + 600, w.p.y)
    e.hp = 100000; far.hp = 100000
    const hp = e.hp, fhp = far.hp
    h.tick(w, 1.8)
    h.lt(e.hp, hp, 'enemy in halo hit')
    h.eq(far.hp, fhp, 'enemy outside untouched')
  },
  'twisted-pair': () => {
    const w = h.fresh(); h.give(w, 'twisted-pair')
    h.eq(w.p.familiars.length, 2)
    h.ok(w.p.familiars.every(f => f.def.params.inherit === 0.375))
  },
  'azazels-rage': () => {
    const w = h.fresh(); h.give(w, 'azazels-rage')
    for (let i = 0; i < 3; i++) h.IS.fireHook(w.p, 'onRoomClear', [w.room], w.ctx)
    h.IS.fireHook(w.p, 'onRoomEnter', [w.room], w.ctx)
    h.eq((w.room.lasers || []).length, 0, 'no beam before 4 clears')
    h.IS.fireHook(w.p, 'onRoomClear', [w.room], w.ctx)
    h.IS.fireHook(w.p, 'onRoomEnter', [w.room], w.ctx)
    h.eq(w.room.lasers.length, 1, 'beam fired')
    h.eq(w.p.cache.rage, 0)
  },
  'echo-chamber': () => {
    const w = h.fresh(); h.give(w, 'echo-chamber')
    const IS = h.IS
    const ids = Object.keys(IS.cardsById).filter(id => typeof IS.cardsById[id].use === 'function').slice(0, 3)
    const counts = {}
    ids.forEach(id => { counts[id] = 0; IS.cardsById[id].use = () => { counts[id]++ } })
    w.ctx.useCard(ids[0])
    h.eq(counts[ids[0]], 1, 'first use has nothing to echo')
    w.ctx.useCard(ids[1])
    h.eq(counts[ids[0]], 2, 'first card echoed')
    h.eq(counts[ids[1]], 1)
    w.ctx.useCard(ids[2])
    h.eq(counts[ids[0]], 3); h.eq(counts[ids[1]], 2); h.eq(counts[ids[2]], 1)
    h.eq(w.p.cache.echo.length, 3)
  },
  'isaacs-tomb': () => {
    const w = h.fresh(); h.give(w, 'isaacs-tomb')
    h.newFloor(w)
    h.ok(w.room.pickups.some(p => p.kind === 'chest' && p.variant === 'old'), 'old chest in start room')
  },
  'vengeful-spirit': () => {
    const w = h.fresh(); h.give(w, 'vengeful-spirit')
    for (let i = 0; i < 9; i++) { w.p.hearts.red = 6; h.hurt(w, 1) }
    h.eq(w.p.familiars.length, 6, 'capped at 6')
    h.newFloor(w)
    h.eq(w.p.familiars.length, 0)
  },
  'keepers-sack': () => {
    const w = h.fresh(); h.give(w, 'keepers-sack')
    h.eq(w.room.pickups.filter(p => p.kind === 'coin').length, 3)
    h.eq(w.room.pickups.filter(p => p.kind === 'key').length, 1)
    w.p.coins = 10; h.tick(w, 0.05)
    const before = [w.p.stats.speed, w.p.stats.damage, w.p.stats.range]
    w.p.coins = 7; h.tick(w, 0.05)
    const after = [w.p.stats.speed, w.p.stats.damage, w.p.stats.range]
    h.ok(after.some((v, i) => v > before[i]), 'spending 3 coins grants a stat')
  },
  'keepers-kin': () => {
    const w = h.fresh(); h.give(w, 'keepers-kin')
    const g = h.IS.addGrid(w.room, 'rock', 200, 200, null)
    h.ok(g, 'grid placed')
    h.IS.destroyGrid(w.room, g, w.ctx)
    h.eq(w.p.familiars.filter(f => f.id === 'blue-spider').length, 2)
  },
  'tmtrainer': () => {
    const w = h.fresh(); h.give(w, 'tmtrainer')
    h.ok(!w.p.cache.tmG, 'no glitch yet')
    h.give(w, 'the-sad-onion')
    h.ok(w.p.cache.tmG, 'glitch applied after pickup')
    const v = JSON.stringify(w.p.cache.tmG)
    h.give(w, 'the-inner-eye')
    h.ok(JSON.stringify(w.p.cache.tmG) !== v, 'another glitch')
  },
  'hypercoagulation': () => {
    const w = h.fresh(); h.give(w, 'hypercoagulation')
    h.hurt(w, 1)
    let hp = w.room.pickups.filter(p => p.kind === 'heart')
    h.eq(hp.length, 1); h.eq(hp[0].amount, 1)
    h.hurt(w, 2)
    hp = w.room.pickups.filter(p => p.kind === 'heart')
    h.eq(hp.length, 2); h.eq(hp[1].amount, 2)
  },
  'hemoptysis': () => {
    const w = h.fresh(); h.give(w, 'hemoptysis')
    const IS = h.IS, orig = IS.input.shoot
    let on = false
    IS.input.shoot = () => on ? { x: 1, y: 0 } : { x: 0, y: 0 }
    try {
      const n0 = (w.room.tears || []).length
      on = true; h.tick(w, 0.05); on = false; h.tick(w, 0.05); on = true; h.tick(w, 0.05)
      h.gt((w.room.tears || []).length, n0 + 5, 'sneeze tears spawned')
    } finally { IS.input.shoot = orig }
  },
  'stye': () => {
    const w = h.fresh(); h.give(w, 'stye')
    const mk = () => ({ dmg: 3.5, vx: 400, vy: 0, life: 1, flags: new Set() })
    w.p.eye = -1; const l = mk(); h.IS.fireHook(w.p, 'onTearFire', [l], w.ctx)
    h.eq(l.dmg, 3.5)
    w.p.eye = 1; const r = mk(); h.IS.fireHook(w.p, 'onTearFire', [r], w.ctx)
    h.ok(Math.abs(r.dmg - 3.5 * 1.28) < 1e-9); h.gt(r.life, 1); h.lt(r.vx, 400)
  }
})
