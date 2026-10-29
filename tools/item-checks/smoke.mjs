export default h => ({
  'the-battery': () => {
    const w = h.fresh(); h.give(w, 'the-d6'); h.give(w, 'the-battery')
    const a = w.p.active[0]; a.charge = 0
    h.IS.addCharge(w.p, 12, 0); h.eq(a.charge, a.maxCharge); h.eq(a.batteryCharge, a.maxCharge)
    h.ok(h.IS.useActive(w.p, 0, w.ctx)); h.eq(a.charge, a.maxCharge, 'second bar refills the active')
  }
})
