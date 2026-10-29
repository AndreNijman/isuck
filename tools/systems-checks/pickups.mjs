// Chests, hearts and pickup grants.
export default h => {
  const { IS } = h
  const chest = (w, variant) => IS.spawnPickup(w.room, 'chest', w.p.x + 200, w.p.y, { rng: w.room.rng, run: w.run, variant })
  const VARIANTS = ['normal', 'golden', 'red', 'spiked', 'mimic', 'haunted', 'old', 'mega', 'bomb', 'eternal', 'stone', 'wooden']
  const out = {}
  for (const v of VARIANTS) {
    out['chest-' + v + '-opens'] = () => {
      const w = h.fresh(); const c = chest(w, v)
      h.ok(Array.isArray(c.contents), 'contents rolled at spawn')
      h.ok(IS.sprite(IS.pickupSprite(c)), 'sprite resolves')
      h.ok(IS.sprite(IS.pickupSprite(Object.assign({}, c, { opened: true }))), 'open sprite resolves')
      if (v === 'stone') {
        h.ok(!IS.touchChest(w.p, c, w.ctx), 'stone needs a bomb')
        IS.blastInteractables(c.x, c.y, 80, w.ctx); h.ok(c.opened, 'bomb opens stone'); return
      }
      w.p.keys = 1; w.p.hearts.red = w.p.hearts.maxRed
      IS.touchChest(w.p, c, w.ctx)
      if (v === 'bomb' || v === 'old' || v === 'wooden' || v === 'normal') h.ok(c.opened, 'opened')
    }
  }
  return Object.assign(out, {
    'chest-golden-needs-key': () => {
      const w = h.fresh(); const c = chest(w, 'golden'); w.p.keys = 0; w.p.goldenKey = false
      h.ok(!IS.touchChest(w.p, c, w.ctx)); w.p.keys = 1; h.ok(IS.touchChest(w.p, c, w.ctx)); h.eq(w.p.keys, 0)
    },
    'chest-revealed-contents-are-what-spawns': () => {
      const w = h.fresh(); const c = chest(w, 'normal'); const kinds = c.contents.filter(e => !e.special).map(e => e.kind).sort().join()
      const before = w.room.pickups.length
      IS.openChest(w.room, c, w.ctx, w.p)
      const got = w.room.pickups.slice(before).map(u => u.kind).sort().join(); h.eq(got, kinds)
    },
    'heart-absorb-order': () => {
      const w = h.fresh(); const p = w.p; p.hearts.eternal = 0; p.hearts.gold = 1; p.hearts.soul = 1; p.hearts.black = 0
      const left = IS.absorbDamage(p, 2, w.ctx); h.eq(left, 0); h.eq(p.hearts.gold, 0); h.eq(p.hearts.soul, 0)
    },
    'heart-eternal-gives-container-next-floor': () => {
      const w = h.fresh(); const max = w.p.hearts.maxRed; IS.addEternalHeart(w.p, 1)
      h.eq(w.p.hearts.eternal, 1); IS.fireHook(w.p, 'onNewFloor', [], w.ctx)
      h.eq(w.p.hearts.maxRed, max + 2); h.eq(w.p.hearts.eternal, 0)
    },
    'heart-gold-counts': () => {
      const w = h.fresh(); const t = IS.totalHearts(w.p); IS.addGoldHearts(w.p, 2); h.eq(IS.totalHearts(w.p), t + 2)
    },
    'grant-keys-apply': () => {
      const w = h.fresh(); const p = w.p
      IS.applyGrant(p, { coins: 5, bombs: 2, keys: 1, goldenKey: true, goldenBomb: true, eternal: 1 }, w.ctx)
      h.ok(p.goldenKey && p.goldenBomb); h.eq(p.hearts.eternal, 1); h.ok(p.coins >= 5)
    }
  })
}
