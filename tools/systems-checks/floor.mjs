// Floor flags: curses, Labyrinth, Dad's Note, Duality, Eucharist, red rooms.
export default h => {
  const { IS } = h
  const hookItem = (w, mask) => { IS.itemsById['test-curse'] = { id: 'test-curse', hooks: { onCurseEval: () => mask } }; w.p.items.push('test-curse') }
  const bossRoom = f => f.rooms[f.bossIndex]
  return {
    'curse-eval-hook-sets-curse': () => {
      const w = h.fresh(); hookItem(w, IS.CURSE.DARKNESS | IS.CURSE.BLIND)
      const f = h.newFloor(w, 'basement-2')
      h.eq(w.run.curses, IS.CURSE.DARKNESS | IS.CURSE.BLIND, 'run.curses follows the hook'); h.eq(f.curses, w.run.curses)
      delete IS.itemsById['test-curse']
    },
    'curse-none-on-first-floor': () => {
      const w = h.fresh(); h.newFloor(w, 'basement'); h.eq(w.run.curses, 0, 'no curse rolls on the first floor')
    },
    'curse-labyrinth-two-bosses': () => {
      const w = h.fresh(); hookItem(w, IS.CURSE.LABYRINTH); const f = h.newFloor(w, 'basement-2')
      h.eq(f.bossIndices.length, 2, 'two boss rooms'); h.ok(f.rooms.length >= 12, 'XL floor: ' + f.rooms.length)
      delete IS.itemsById['test-curse']
    },
    'ascent-flag-routes-up': () => {
      const w = h.fresh(); w.run.flags.ascent = true
      h.newFloor(w, 'mausoleum-2'); h.eq(IS.nextFloorIds(w.run).normal, 'ascent-1')
      h.newFloor(w, 'ascent-1'); h.eq(IS.nextFloorIds(w.run).normal, 'ascent-2')
    },
    'ascent-off-goes-down': () => {
      const w = h.fresh(); h.newFloor(w, 'mausoleum-2'); h.ok(IS.nextFloorIds(w.run).normal !== 'ascent-1')
    },
    'deal-duality-offers-both': () => {
      const w = h.fresh(); const f = h.newFloor(w, 'basement-2'); w.run.flags.duality = true; w.run.rng = { chance: () => true, pick: a => a[0], int: () => 0 }
      const got = IS.rollBossDoors(f, w.run, w.ctx); h.eq(got.slice().sort().join(), 'angel,devil')
      h.ok(f.rooms.some(r => r.type === 'devil') && f.rooms.some(r => r.type === 'angel'), 'both rooms exist')
    },
    'deal-force-angel': () => {
      const w = h.fresh(); const f = h.newFloor(w, 'basement-2'); w.run.flags.forceAngel = true
      h.eq(IS.rollBossDoors(f, w.run, w.ctx).join(), 'angel')
    },
    'deal-none-on-first-floor': () => {
      const w = h.fresh(); const f = h.newFloor(w, 'basement'); w.run.flags.forceAngel = true
      h.eq(IS.rollBossDoors(f, w.run, w.ctx).length, 0)
    },
    'red-room-adds-room-with-door': () => {
      const w = h.fresh(); const f = h.newFloor(w, 'basement-2'); const n = f.rooms.length
      const r = IS.openRedRoom(w.run, w.ctx); h.ok(r && r.red, 'red room'); h.eq(f.rooms.length, n + 1)
      h.ok(w.run.room.doors.some(d => d.target === r.index), 'door to it'); h.ok(r.doors.some(d => d.target === w.run.room.index), 'door back')
    },
    'crawlspace-room-is-cached': () => {
      const w = h.fresh(); h.newFloor(w, 'basement-2'); const a = IS.crawlspaceFor(w.run, w.run.room)
      h.ok(a && a.type === 'crawlspace'); h.eq(IS.crawlspaceFor(w.run, w.run.room), a)
    }
  }
}
