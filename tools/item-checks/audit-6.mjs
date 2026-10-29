// Regression checks for the items in js/data/items-6.js rewritten by the audit.
export default h => {
  const IS = h.IS
  const fireOne = w => {
    IS.firePlayerTears(w.p, { x: 1, y: 0 }, w.ctx)
    return w.room.tears[w.room.tears.length - 1]
  }
  return {
    'jacobs-ladder': () => {
      const w = h.fresh(); h.give(w, 'jacobs-ladder')
      const a = h.enemy(w, 'fly', 300, 300), b = h.enemy(w, 'fly', 380, 300)
      a.hp = b.hp = 1000
      const hp0 = b.hp
      IS.fireHook(w.p, 'onTearHit', [{ dmg: 10, flags: new Set() }, a], w.ctx)
      h.lt(b.hp, hp0, 'spark reached the second enemy')
      h.eq(a.hp, 1000, 'spark skips the enemy that was hit')
    },
    'pop': () => {
      const w = h.fresh(); h.give(w, 'pop')
      const t = fireOne(w)
      h.ok(t.flags.has('bouncing'), 'bouncing flag')
      h.gt(t.bounce, 10, 'many bounces')
      h.gt(t.life, 5, 'long lived')
    },
    'eye-of-belial': () => {
      const w = h.fresh()
      const r0 = w.p.stats.range
      h.give(w, 'eye-of-belial')
      h.eq(Math.round(w.p.stats.range - r0), 120, '+1.5 range')
    },
    'haemolacria': () => {
      const w = h.fresh(); h.give(w, 'haemolacria')
      const t = fireOne(w)
      h.ok(t.lob, 'tear arcs')
    },
    'schoolbag': () => {
      const w = h.fresh(); h.give(w, 'schoolbag')
      w.p.active[0] = { id: 'the-poop', charge: 0, maxCharge: 1, batteryCharge: 0 }
      w.p.active[1] = { id: 'd6', charge: 0, maxCharge: 6, batteryCharge: 0 }
      const op = IS.input.pressed
      IS.input.pressed = a => a === 'pocketSwap'
      try { h.tick(w, 0.02) } finally { IS.input.pressed = op }
      h.eq(w.p.active[0].id, 'd6', 'slot 0 swapped')
      h.eq(w.p.active[1].id, 'the-poop', 'slot 1 swapped')
    }
  }
}
