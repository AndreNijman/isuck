// Game-feel state from docs/PARITY.md "Shared state contract": door slide, tear height and
// drift, item pickup pose, streaks, boss intro card, hit i-frames and head/walk facing.
export default h => {
  const { IS } = h
  const withInput = (move, shoot, fn) => {
    const old = IS.input; IS.input = { move: () => move, shoot: () => shoot, pressed: () => false, down: () => false, consume() {}, update() {} }
    try { return fn() } finally { IS.input = old }
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  const realCtx = w => { w.ctx = IS.makeCtx(w.run); IS.refreshCtx(w.ctx, w.run.room, IS.DT); return w.ctx }
  return {
    'stage-banner-sets-streak': () => {
      const w = h.fresh(); const ctx = realCtx(w)
      ctx.banner('Title', 'Sub'); const s = w.run.streak
      h.ok(s && s.title === 'Title' && s.sub === 'Sub' && s.t === 0 && s.dur > 1, 'streak {title, sub, t, dur}')
      ctx.banner('Second'); h.eq(w.run.streak, s, 'the second banner waits its turn')
      IS.updateStreak(w.run, s.dur + .01); h.eq(w.run.streak.title, 'Second')
      IS.updateStreak(w.run, 99); h.eq(w.run.streak, null)
    },
    'stage-pedestal-pickup-holds-item-and-streaks': () => {
      const w = h.fresh(); const ctx = realCtx(w)
      const ped = IS.spawnPedestal(w.room, 'the-sad-onion', w.p.x, w.p.y, {})
      h.ok(IS.tryTakePickup(w.p, ped, ctx), 'taken')
      h.ok(w.p.holdItem && w.p.holdItem.id === 'the-sad-onion' && w.p.holdItem.t === 0, 'p.holdItem {id, t}')
      h.eq(w.run.streak.title, IS.itemsById['the-sad-onion'].name); h.ok(w.run.streak.sub.length > 0, 'one-line description')
      withInput({ x: 0, y: 0 }, { x: 0, y: 0 }, () => {
        for (let i = 0; i < 30; i++) IS.updatePlayer(w.p, IS.DT, ctx)
        h.ok(w.p.holdItem && w.p.holdItem.t > .4, 't counts up and the sim is not frozen')
        for (let i = 0; i < 40; i++) IS.updatePlayer(w.p, IS.DT, ctx)
      })
      h.eq(w.p.holdItem, null, 'pose ends after about a second')
    },
    'stage-door-starts-slide': () => {
      const w = h.fresh(); const ctx = realCtx(w); h.newFloor(w); realCtx(w)
      const room = w.run.room, d = room.doors.find(x => x.target != null && !x.hidden), from = w.run.roomIndex
      room.cleared = true; d.open = true; d.locked = false
      IS.tryDoor(w.p, d, w.ctx)
      const t = IS.state.transition
      h.ok(t && t.dir === d.dir && t.from === from && t.to === w.run.roomIndex && t.to !== from && t.t === 0, 'IS.state.transition set')
      h.ok(IS.updateTransition(.1) && IS.state.transition.t > .3 && IS.state.transition.t < .5, 'mid-slide after 100 ms')
      h.ok(!IS.updateTransition(.2) && IS.state.transition === null, 'ends after about 0.25 s')
    },
    'stage-boss-intro-and-spawn-grace': () => {
      const w = h.fresh(); h.newFloor(w); const ctx = realCtx(w); const run = w.run
      const bi = run.floor.rooms.findIndex(r => r && r.type === 'boss'); h.ok(bi >= 0, 'floor has a boss room')
      IS.enterRoom(run, bi, 'left', ctx)
      const intro = run.bossIntro; h.ok(intro && intro.bossId && intro.name && intro.t === 0 && intro.dur > 1.2, 'run.bossIntro set on entry')
      h.ok(IS.updateBossIntro(run, .5, ctx) && run.bossIntro, 'card still up after 0.5 s')
      IS.updateBossIntro(run, 1.2, ctx); h.eq(run.bossIntro, null, 'cleared after the card')
      run.time += 1.4; h.ok(!IS.damagePlayer(run.player, 1, { name: 'boss' }, ctx), 'no damage 1.4 s after the card')
      run.time += .5; h.ok(IS.damagePlayer(run.player, 1, { name: 'boss' }, ctx), 'grace ends')
      IS.enterRoom(run, run.floor.startIndex, 'left', ctx); h.eq(run.bossIntro, null, 'an ordinary room has no card')
    },
    'stage-one-hit-per-invuln-time': () => {
      const w = h.fresh(); w.p.hearts.red = w.p.hearts.maxRed = 20; const run = w.run; const ctx = realCtx(w)
      h.enemy(w, 'gaper', w.p.x, w.p.y); let hits = 0, secs = 3
      const o = IS.damagePlayer; IS.damagePlayer = function () { const r = o.apply(this, arguments); if (r) hits++; return r }
      try { for (let i = 0; i < secs * 60; i++) { run.time += IS.DT; w.room.enemies.forEach(e => { e.x = w.p.x; e.y = w.p.y }); IS.updateRoom(w.room, IS.DT, ctx) } } finally { IS.damagePlayer = o }
      h.ok(hits >= 2 && hits <= Math.ceil(secs / IS.INVULN_TIME), `${hits} hits in ${secs} s with an enemy glued to the player (INVULN_TIME ${IS.INVULN_TIME})`)
    },
    'stage-tear-drops-to-the-floor': () => {
      const w = h.fresh(); const ctx = realCtx(w); const zs = []
      const t = IS.spawnTear({ x: w.p.x, y: w.p.y, vx: 200, vy: 0, life: .5 }, ctx); h.ok(t.z > 0, 'flies at a height')
      for (let i = 0; i < 40 && !t.dead; i++) { IS.updateProjectiles(w.room, IS.DT, ctx); zs.push(t.z) }
      h.ok(t.dead && zs[zs.length - 1] === 0, 'z is 0 at range end (' + zs.slice(-3).join(',') + ')'); h.ok(zs.every(z => z >= 0), 'never below the floor')
      const drop = zs.filter(z => z < 22 && z > 0).length; h.ok(drop >= 4 && zs.some((z, i) => i && z < zs[i - 1]), 'an arc, not a vanish')
    },
    'stage-tear-inherits-perpendicular-motion': () => {
      const w = h.fresh(); const ctx = realCtx(w); w.p.vy = 150
      IS.firePlayerTears(w.p, { x: 1, y: 0 }, ctx); const t = w.room.tears[w.room.tears.length - 1]
      h.ok(t.vx > 300 && t.vy > 20, `sideways velocity (${t.vx.toFixed(0)}, ${t.vy.toFixed(0)})`)
      const eyes = []; for (let i = 0; i < 4; i++) { IS.firePlayerTears(w.p, { x: 1, y: 0 }, ctx); const u = w.room.tears[w.room.tears.length - 1]; eyes.push(Math.sign(Math.round(u.y - w.p.y))) }
      h.ok(eyes.includes(1) && eyes.includes(-1), 'left and right eye alternate: ' + eyes)
    },
    'stage-head-and-walk-direction': () => {
      const w = h.fresh(); const ctx = realCtx(w)
      withInput({ x: 1, y: 0 }, { x: 0, y: -1 }, () => IS.updatePlayer(w.p, IS.DT, ctx))
      h.ok(same(w.p.walkDir, { x: 1, y: 0 }) && same(w.p.headDir, { x: 0, y: -1 }), 'head to the shot, body to the walk')
      withInput({ x: 0, y: 1 }, { x: 0, y: 0 }, () => { for (let i = 0; i < 40; i++) IS.updatePlayer(w.p, IS.DT, ctx) })
      h.ok(same(w.p.walkDir, { x: 0, y: 1 }) && same(w.p.headDir, { x: 0, y: 1 }), 'head follows the walk when not shooting')
    }
  }
}
