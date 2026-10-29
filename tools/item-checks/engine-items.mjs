// Items whose behaviour lives in js/engine rather than in item hooks.
export default h => ({
  'moms-knife': () => { const w = h.fresh(); h.eq(h.IS.playerWeapon(w.p), 'tears'); h.give(w, 'moms-knife'); h.eq(h.IS.playerWeapon(w.p), 'knife') },
  'epic-fetus': () => { const w = h.fresh(); h.give(w, 'epic-fetus'); h.eq(h.IS.playerWeapon(w.p), 'epic') },
  'the-ludovico-technique': () => { const w = h.fresh(); h.give(w, 'the-ludovico-technique'); h.eq(h.IS.playerWeapon(w.p), 'ludo') },
  'car-battery': () => {
    const w = h.fresh(); h.give(w, 'the-d6'); h.give(w, 'car-battery')
    const a = w.p.active[0]; a.charge = a.maxCharge
    const d = h.IS.itemsById['the-d6']; const old = d.hooks.onUse
    let n = 0
    d.hooks.onUse = (...args) => { n++; return old ? old(...args) : undefined }
    try { h.IS.useActive(w.p, 0, w.ctx) } finally { d.hooks.onUse = old }
    h.eq(n, 2, 'onUse fires twice with Car Battery')
  }
})
