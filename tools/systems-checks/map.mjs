// Map flags: fullMinimap, seeMinimap, seeSecretRooms.
export default h => {
  const { IS } = h
  const secret = r => r.type === 'secret' || r.type === 'super-secret'
  const setup = flag => { const w = h.fresh(); const f = h.newFloor(w, 'basement-2'); for (const r of f.rooms) r.mapKnown = false
    f.rooms[f.startIndex].mapKnown = true; if (flag) w.p.flags.add(flag); IS.applyMapFlags(w.run); return f }
  const known = (f, fn) => f.rooms.filter(fn).every(r => r.mapKnown)
  return {
    'map-none-shows-nothing-extra': () => { const f = setup(null); h.ok(f.rooms.some(r => r.type === 'boss' && !r.mapKnown)) },
    'map-full-minimap': () => { const f = setup('fullMinimap'); h.ok(known(f, r => !secret(r) && r.type !== 'ultra-secret'), 'every ordinary room'); h.ok(f.rooms.filter(secret).every(r => !r.mapKnown), 'secrets stay hidden') },
    'map-see-minimap-icons': () => { const f = setup('seeMinimap'); h.ok(known(f, r => r.type !== 'default' && r.type !== 'start' && !secret(r) && r.type !== 'ultra-secret'), 'special rooms'); h.ok(f.rooms.some(r => r.type === 'default' && !r.mapKnown), 'ordinary rooms still dark') },
    'map-see-secret-rooms': () => { const f = setup('seeSecretRooms'); h.ok(f.rooms.some(secret), 'floor has a secret room'); h.ok(known(f, secret), 'secrets shown') }
  }
}
