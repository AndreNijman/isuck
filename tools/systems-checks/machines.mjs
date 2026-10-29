// Beggars, machines, blasts and restock.
export default h => {
  const { IS } = h
  const mk = (type, o = {}) => { const w = h.fresh(o); const m = IS.spawnMachine(w.room, type, w.p.x + 40, w.p.y); w.m = m; return w }
  const use = (w, n = 1) => { for (let i = 0; i < n; i++) { w.m.cool = 0; IS.updateMachines(w.room, 1 / 60, w.ctx) } }
  const out = {}
  for (const t of IS.MACHINE_TYPES) out['machine-' + t + '-sprite'] = () => { h.ok(IS.sprite('machine:' + t), 'sprite') }
  return Object.assign(out, {
    'machine-beggar-takes-coin': () => { const w = mk('beggar'); w.p.coins = 3; use(w); h.eq(w.p.coins, 2); h.eq(w.m.paid, 1) },
    'machine-beggar-needs-coin': () => { const w = mk('beggar'); w.p.coins = 0; use(w); h.eq(w.m.paid, 0) },
    'machine-beggar-eventually-pays': () => { const w = mk('beggar'); w.p.coins = 200; use(w, 150); h.gt(w.m.payouts, 0, 'payouts') },
    'machine-key-beggar-takes-key': () => { const w = mk('key-beggar'); w.p.keys = 2; use(w); h.eq(w.p.keys, 1) },
    'machine-devil-beggar-takes-heart': () => { const w = mk('devil-beggar'); w.p.hearts.red = 4; use(w); h.eq(w.p.hearts.red, 2) },
    'machine-devil-beggar-refuses-low-health': () => { const w = mk('devil-beggar'); w.p.hearts.red = 2; use(w); h.eq(w.p.hearts.red, 2) },
    'machine-bomb-bum-takes-coin': () => { const w = mk('bomb-bum'); w.p.coins = 1; use(w); h.eq(w.p.coins, 0) },
    'machine-battery-bum-takes-coin': () => { const w = mk('battery-bum'); w.p.coins = 1; use(w); h.eq(w.p.coins, 0) },
    'machine-rotten-beggar-takes-coin': () => { const w = mk('rotten-beggar'); w.p.coins = 1; use(w); h.eq(w.p.coins, 0) },
    'machine-slot-takes-coin': () => { const w = mk('slot-machine'); w.p.coins = 2; use(w); h.eq(w.p.coins, 1) },
    'machine-fortune-takes-coin-and-reads': () => { const w = mk('fortune-machine'); w.p.coins = 1; use(w); h.eq(w.p.coins, 0); h.ok(w.m.fortune, 'fortune text') },
    'machine-blood-donation': () => { const w = mk('blood-donation-machine'); w.p.hearts.red = 4; use(w); h.eq(w.p.hearts.red, 3) },
    'machine-blood-donation-refuses-at-one-heart': () => { const w = mk('blood-donation-machine'); w.p.hearts.red = 1; use(w); h.eq(w.p.hearts.red, 1) },
    'machine-confessional-free': () => { const w = mk('confessional'); const c = w.p.coins; use(w, 4); h.eq(w.p.coins, c); h.ok(w.m.broken, 'used up after three') },
    'machine-restock-refills': () => {
      const w = mk('restock-box'); w.room.type = 'shop'; w.room.meta.shopSlots = [{ col: 3, row: 2 }, { col: 6, row: 2 }]
      w.p.coins = 10; const n = w.room.pickups.length; use(w); h.eq(w.p.coins, 5); h.gt(w.room.pickups.length, n)
    },
    'machine-restock-refuses-when-full': () => {
      const w = mk('restock-box'); w.room.type = 'shop'; w.room.meta.shopSlots = []; w.p.coins = 10; use(w); h.eq(w.p.coins, 10)
    },
    'machine-bomb-kills-beggar': () => {
      const w = mk('beggar'); IS.blastInteractables(w.m.x, w.m.y, 80, w.ctx); IS.updateMachines(w.room, 1 / 60, w.ctx)
      h.eq(w.room.machines.length, 0); h.gt(w.room.pickups.length, 0, 'drops')
    },
    'machine-bomb-breaks-slot': () => {
      const w = mk('slot-machine'); IS.blastInteractables(w.m.x, w.m.y, 80, w.ctx); h.ok(w.m.broken); w.p.coins = 1; use(w); h.eq(w.p.coins, 1)
    }
  })
}
