// Regression checks for the items in js/data/items-5.js rewritten by the 5b audit.
export default h => {
  const IS = h.IS
  const withAim = (dir, fn) => {
    const old = IS.input
    IS.input = Object.assign({}, old, { shoot: () => dir })
    try { return fn() } finally { IS.input = old }
  }
  return {
    'tech-x': () => {
      const w = h.fresh(); h.give(w, 'tech-x')
      // holding fire: engine straight lasers get swallowed, nothing released yet
      w.room.lasers = w.room.lasers || []
      w.room.lasers.push({ x: 0, y: 0, angle: 0, len: 1500, width: 9, life: 0.1, friendly: true, hit: new Map() })
      withAim({ x: 1, y: 0 }, () => h.tick(w, 0.5))
      h.ok(w.room.lasers.every(l => !(l.width === 9 && l.len === 1500) || l.dead), 'straight laser removed')
      h.eq(w.room.lasers.filter(l => l.techx && !l.dead).length, 0, 'no ring while charging')
      // release
      h.tick(w, 1 / 60)
      const ring = w.room.lasers.filter(l => l.techx && !l.dead)
      h.eq(ring.length, 12, 'ring of 12 segments')
      const x0 = ring[0].x
      h.tick(w, 0.1)
      h.ok(Math.abs(ring[0].x - x0) > 5, 'ring travels')
    },
    'marked': () => {
      const w = h.fresh(); h.give(w, 'marked')
      h.eq(w.p.flags.has('homingTears'), false, 'no homing stand-in')
      withAim({ x: 1, y: 0 }, () => h.tick(w, 0.5))
      h.gt(w.p.cache.marked.x, w.p.x + 50, 'target moved with the fire key')
      // no key held: tears still fire at the mark
      w.p.nextShot = 0
      const n = w.room.tears.length
      h.tick(w, 1 / 60)
      h.gt(w.room.tears.length, n, 'auto fired')
      const t = w.room.tears[w.room.tears.length - 1]
      h.gt(t.vx, 0, 'aimed at the mark')
    },
    'd12': () => {
      const w = h.fresh(); h.give(w, 'd12')
      IS.addGrid(w.room, 'rock', 200, 200)
      IS.addGrid(w.room, 'metal', 300, 200)
      const before = w.room.grid.filter(g => !g.broken).length
      IS.fireHook(w.p, 'onUse', [], w.ctx)
      h.ok(w.room.grid.some(g => g.kind === 'metal' && !g.broken), 'metal kept')
      h.ok(w.room.grid.filter(g => !g.broken).length >= before - 1, 'obstacles replaced, not just destroyed')
    },
    'restock': () => {
      const w = h.fresh(); h.give(w, 'restock')
      w.room.type = 'shop'
      const n = w.room.pickups.length
      IS.fireHook(w.p, 'onPurchase', [{ kind: 'bomb', x: 300, y: 300, price: 5 }], w.ctx)
      h.eq(w.room.pickups.length, n + 1, 'restocked')
      h.eq(w.room.pickups[n].kind, 'bomb', 'same kind restocked')
    },
    'serpents-kiss': () => {
      const w = h.fresh(); h.give(w, 'serpents-kiss')
      const e = h.enemy(w, 'fly')
      IS.fireHook(w.p, 'onTearHit', [{ dmg: 1, flags: new Set(['poison']) }, e], w.ctx)
      h.ok(e.serpentKissed, 'tear poison counts for the black heart drop')
    }
  }
}
