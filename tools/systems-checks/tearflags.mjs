// Tear flags the engine reads: chain, pop, light, holy and the status flags.
export default h => {
  const IS = h.IS
  const world = () => { const w = h.fresh(); w.p.x = 100; w.p.y = 100; return w }
  const impact = (w, flag, e) => IS.onTearImpact({ dmg: 10, flags: new Set([flag]), x: e.x, y: e.y, vx: 1, vy: 0 }, e, w.ctx)
  return {
    'tearflag-status-flags-apply-statuses': () => {
      const map = { poison: 'poison', burn: 'burn', slow: 'slow', freeze: 'freeze', charm: 'charm', fear: 'fear', confusion: 'confusion', petrify: 'petrify', ice: 'ice', bleed: 'bleed', shrink: 'shrink', midas: 'midas', magnetize: 'magnetize', sticky: 'sticky', baited: 'baited' }
      for (const f in map) {
        const w = world(), e = h.enemy(w, 'fly', 600, 300)
        impact(w, f, e)
        h.ok(e.status[map[f]] > 0, f + ' flag did not apply ' + map[f])
      }
    },
    'tearflag-chain-arcs': () => {
      const w = world(), a = h.enemy(w, 'fly', 500, 300), b = h.enemy(w, 'fly', 560, 300), far = h.enemy(w, 'fly', 1000, 500)
      a.hp = b.hp = far.hp = 1000
      impact(w, 'chain', a)
      h.lt(b.hp, 1000, 'neighbour hit by the spark'); h.eq(far.hp, 1000, 'far enemy untouched'); h.eq(a.hp, 1000)
    },
    'tearflag-pop-bounces-long': () => {
      const w = world()
      w.p.tearFlags.add('pop')
      const t = IS.spawnTear({ x: 300, y: 300, vx: 100, vy: 0, life: 1 }, w.ctx)
      IS.applyTearFlags(t, w.p)
      h.ok(t.flags.has('bouncing')); h.gt(t.bounce, 10); h.gt(t.life, 5)
    },
    'tearflag-light-hits-repeatedly': () => {
      const w = world(), e = h.enemy(w, 'fly', 500, 300); e.hp = e.maxHp = 1000; e.speed = 0
      IS.spawnTear({ x: 500, y: 300, vx: 0, vy: 0, dmg: 1, life: 2, flags: ['light', 'piercing', 'spectral'] }, w.ctx)
      h.tick(w, .5)
      h.gt(1000 - e.hp, 2.5, 'light tear keeps hitting')
    },
    'tearflag-holy-light-beam': () => {
      const w = world(), e = h.enemy(w, 'fly', 500, 300), o = h.enemy(w, 'fly', 520, 300)
      e.hp = o.hp = 1000
      w.ctx.chance = () => true
      impact(w, 'holy', e)
      h.lt(o.hp, 1000, 'beam hit the neighbour'); h.eq(w.room.beams.length, 1)
    }
  }
}
