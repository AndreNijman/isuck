// Regression checks for items rewritten in the items-1 / items-3 audit.
export default h => {
  const rooms = w => (w.run.floor && w.run.floor.rooms) || []
  const known = (w, f) => rooms(w).filter(r => r.mapKnown && f(r)).length
  const secret = r => r.type === 'secret' || r.type === 'super-secret'

  return {
    'the-compass': () => {
      const w = h.fresh(); h.newFloor(w); h.give(w, 'the-compass')
      h.gt(rooms(w).length, 1, 'floor exists')
      h.eq(known(w, r => r.type === 'normal'), 0, 'normal rooms stay hidden')
      h.eq(known(w, secret), 0, 'secret rooms stay hidden')
    },
    'treasure-map': () => {
      const w = h.fresh(); h.newFloor(w); h.give(w, 'treasure-map')
      h.eq(known(w, r => !secret(r)), rooms(w).filter(r => !secret(r)).length, 'whole layout')
      h.eq(known(w, secret), 0, 'secret rooms stay hidden')
    },
    'blue-map': () => {
      const w = h.fresh(); h.newFloor(w); h.give(w, 'blue-map')
      h.eq(known(w, secret), rooms(w).filter(secret).length)
    },
    'spelunker-hat': () => {
      const w = h.fresh(); h.newFloor(w); h.give(w, 'spelunker-hat')
      h.eq(known(w, secret), rooms(w).filter(secret).length)
    },
    'gnawed-leaf': () => {
      const w = h.fresh(); h.give(w, 'gnawed-leaf')
      h.tick(w, 1.3)
      const r = w.p.hearts.red; h.hurt(w, 2); h.eq(w.p.hearts.red, r, 'blocked after standing still')
    },
    'black-candle': () => {
      const w = h.fresh(); h.newFloor(w); w.run.floor.curses = 7; h.give(w, 'black-candle')
      h.eq(w.run.floor.curses, 0)
      w.run.floor.curses = 7; h.newFloor(w)
      h.eq(w.run.floor.curses, 0)
    }
  }
}
