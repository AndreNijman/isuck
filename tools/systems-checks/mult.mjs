// The damage multiplier channel in IS.recalcStats.
export default h => {
  const IS = h.IS
  // add an item without its grants, so the check does not depend on pickup code
  const raw = (w, id) => { w.p.items.push(id); w.p.itemCounts[id] = (w.p.itemCounts[id] || 0) + 1; IS.recalcStats(w.p) }
  return {
    'mult-item-declared': () => {
      const w = h.fresh(); h.give(w, 'soy-milk')
      h.ok(Math.abs(w.p.stats.damage - 0.7) < .01, 'soy milk x0.2 of 3.5, got ' + w.p.stats.damage)
    },
    'mult-order-flat-then-character': () => {
      // flat damage (Ipecac +40) is multiplied by the character's multiplier too
      const a = h.fresh(), b = h.fresh({ char: 'judas' })
      h.give(a, 'ipecac'); h.give(b, 'ipecac')
      const ratio = b.p.stats.damage / a.p.stats.damage, want = IS.charactersById.judas.base.damage / 3.5
      h.ok(Math.abs(ratio - want) < .01, 'ratio ' + ratio + ' want ' + want)
    },
    'mult-order-multiplier-after-ups': () => {
      // x2 applies after the sqrt of damage ups: 2 * 3.5 * sqrt(1 + 1.2 * 1) with a Pentagram
      const w = h.fresh(); h.give(w, 'pentagram'); h.give(w, 'eves-mascara')
      const ups = w.p.stats.damageUps
      h.ok(Math.abs(w.p.stats.damage - 2 * 3.5 * Math.sqrt(1 + 1.2 * ups)) < .02, 'got ' + w.p.stats.damage)
    },
    'mult-onstats-channel': () => {
      // Crown of Light sets x2 from an onStats hook through the third argument
      const w = h.fresh(); const base = w.p.stats.damage
      raw(w, 'crown-of-light')
      h.ok(Math.abs(w.p.stats.damage - base * 2) < .02, 'crown x2, got ' + w.p.stats.damage)
    },
    'mult-hook-only-items-match-flat-ups': () => {
      const w = h.fresh(); h.give(w, 'hallowed-ground')
      w.p.cache.hallowedAura = true; IS.recalcStats(w.p)
      h.ok(Math.abs(w.p.stats.damage - 3.5 * 1.2) < .02, 'x1.2 damage, got ' + w.p.stats.damage)
      h.gt(w.p.stats.tears, 2.73 * 2, 'x2.5 tears')
    },
    'mult-d8-real-multiplier': () => {
      const w = h.fresh(); h.give(w, 'd8')
      w.p.cache.d8 = { damage: 2, tears: 1, range: 1, speed: 1 }; IS.recalcStats(w.p)
      h.ok(Math.abs(w.p.stats.damage - 7) < .02, 'd8 x2, got ' + w.p.stats.damage)
    },
    'mult-dead-eye-streak': () => {
      const w = h.fresh(); h.give(w, 'dead-eye')
      const d0 = w.p.stats.damage
      const e = h.enemy(w, 'fly'); e.hp = 1000
      for (let i = 0; i < 4; i++) IS.fireHook(w.p, 'onTearHit', [{ flags: new Set(), dmg: 1 }, e], w.ctx)
      h.ok(Math.abs(w.p.stats.damage - d0 * 2) < .02, 'x2 at full streak')
    },
    'mult-shares-one-and-a-half': () => {
      const w = h.fresh(); raw(w, 'crickets-head'); const d = w.p.stats.damage; raw(w, 'magic-mushroom')
      h.lt(w.p.stats.damage, d * 1.3, 'x1.5 does not stack')
    }
  }
}
