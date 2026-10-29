// Two active slots: Schoolbag, swap, dropping the old active without it.
export default h => {
  const { IS } = h
  const act = p => p.active.map(a => a && a.id).join()
  return {
    'active-without-bag-drops-old': () => {
      const w = h.fresh(); h.give(w, 'the-bible'); h.give(w, 'yum-heart'); h.eq(w.p.active[0].id, 'yum-heart'); h.ok(!w.p.active[1], 'no second slot')
      h.ok(w.room.pickups.some(pu => pu.kind === 'item' && pu.itemId === 'the-bible'), 'old active dropped')
    },
    'active-schoolbag-keeps-both': () => {
      const w = h.fresh(); h.give(w, 'schoolbag'); h.give(w, 'the-bible'); h.give(w, 'yum-heart')
      h.eq(act(w.p), 'yum-heart,the-bible')
    },
    'active-swap': () => {
      const w = h.fresh(); h.give(w, 'schoolbag'); h.give(w, 'the-bible'); h.give(w, 'yum-heart')
      IS.swapActives(w.p); h.eq(act(w.p), 'the-bible,yum-heart')
    }
  }
}
