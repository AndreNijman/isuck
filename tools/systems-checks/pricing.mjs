// Pricing: coin, heart-container, soul and Keeper payment, free deals, no-kill rule.
export default h => {
  const { IS } = h
  const put = (w, kind, o) => IS.spawnPickup(w.room, kind, w.p.x, w.p.y, Object.assign({ rng: w.room.rng, run: w.run }, o))
  return {
    'price-coin-blocks-when-poor': () => {
      const w = h.fresh(); w.p.coins = 2
      const pu = put(w, 'key', { price: 5, priceType: 'coin', shop: true })
      IS.updateInteractions(w.room, 1 / 60, w.ctx); h.ok(!pu.taken && !pu.dead, 'not taken'); h.eq(w.p.coins, 2)
    },
    'price-coin-charges': () => {
      const w = h.fresh(); w.p.coins = 7; const k = w.p.keys
      put(w, 'key', { price: 5, priceType: 'coin', shop: true })
      IS.updateInteractions(w.room, 1 / 60, w.ctx); h.eq(w.p.coins, 2); h.eq(w.p.keys, k + 1)
    },
    'price-heart-takes-container': () => {
      const w = h.fresh(); const max = w.p.hearts.maxRed
      const q = put(w, 'soul', { price: 2, priceType: 'heart' })
      IS.updateInteractions(w.room, 1 / 60, w.ctx); h.ok(q.taken || q.dead, 'bought'); h.eq(w.p.hearts.maxRed, max - 2)
    },
    'price-heart-never-kills': () => {
      const w = h.fresh(); w.p.hearts.maxRed = 2; w.p.hearts.red = 2
      const pu = put(w, 'key', { price: 2, priceType: 'heart', soulPrice: 6 })
      IS.updateInteractions(w.room, 1 / 60, w.ctx); h.ok(!pu.taken, 'refused'); h.eq(w.p.hearts.maxRed, 2); h.ok(!w.p.dead)
    },
    'price-keeper-pays-coins-for-hearts': () => {
      const w = h.fresh(); w.p.flags.add("keeperHearts")
      const c = IS.priceOf(w.p, { price: 2, priceType: 'heart' })
      h.eq(c.type, 'coin'); h.eq(c.amount, 15)
    },
    'price-free-flags': () => {
      const w = h.fresh(); w.p.flags.add('freeShopItems'); h.eq(IS.priceOf(w.p, { price: 9, priceType: 'coin' }), null)
      w.p.flags.add('freeDevilDeals'); h.eq(IS.priceOf(w.p, { price: 2, priceType: 'heart' }), null)
    }
  }
}
