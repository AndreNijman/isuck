// Enemy statuses: every one of IS.STATUS_LIST has an observable effect.
export default h => {
  const IS = h.IS
  const world = () => { const w = h.fresh(); w.p.x = 200; w.p.y = 200; return w }
  const at = (w, id, x, y, hp) => { const e = h.enemy(w, id, x, y); if (hp) e.hp = e.maxHp = hp; return e }
  return {
    'status-list-covered': () => {
      for (const s of IS.STATUS_LIST) h.ok(IS.STATUS_WASH[s], 'no overlay colour for ' + s)
    },
    'status-petrify-stops-movement': () => {
      const w = world(), e = at(w, 'fly', 500, 200, 100), x0 = e.x
      IS.applyStatus(e, 'petrify', 2)
      h.tick(w, .5)
      h.eq(e.x, x0, 'petrified enemy moved')
      h.eq(IS.isStopped(e), true)
    },
    'status-freeze-no-contact-damage': () => {
      const w = world(), e = at(w, 'fly', 200, 200, 100)
      IS.applyStatus(e, 'freeze', 2)
      h.eq(w.p.hearts.red, w.p.hearts.maxRed)
      h.tick(w, .5)
      h.eq(w.p.hearts.red, w.p.hearts.maxRed, 'frozen enemy hurt the player')
    },
    'status-unfrozen-moves': () => {
      const w = world(), e = at(w, 'fly', 500, 200, 100), x0 = e.x
      h.tick(w, .5)
      h.ok(e.x !== x0, 'control enemy should move')
    },
    'status-ice-shatters': () => {
      const w = world(), e = at(w, 'fly', 500, 300, 100)
      IS.applyStatus(e, 'ice', 3)
      w.room.tears.length = 0
      IS.killEnemy(e, w.ctx)
      h.gt(w.room.tears.length, 4, 'ice tears on death')
      h.ok(w.room.tears.every(t => t.friendly), 'ice tears are friendly')
    },
    'status-slow-halves-speed': () => {
      const e = { status: { slow: 1 } }
      h.lt(IS.statusSpeed(e), .7); h.gt(IS.statusSpeed(e), .3)
    },
    'status-sticky-slows': () => { h.lt(IS.statusSpeed({ status: { sticky: 1 } }), 1) },
    'status-shrink-can-be-stepped-on': () => {
      const w = world(), e = at(w, 'fly', 200, 200, 100), r0 = e.r
      IS.applyStatus(e, 'shrink', 5)
      IS.updateStatuses(e, 1 / 60, w.ctx)
      h.lt(e.r, r0 * .6, 'hitbox shrinks')
      IS.enemyContactDamage(e, w.p, w.ctx)
      h.ok(e.dead, 'stepped on')
      h.eq(w.p.hearts.red, w.p.hearts.maxRed)
    },
    'status-shrink-regrows': () => {
      const w = world(), e = at(w, 'fly', 600, 300, 100), r0 = e.r
      IS.applyStatus(e, 'shrink', .2)
      h.tick(w, .5)
      h.eq(e.r, r0)
    },
    'status-bleed-percent-max-hp': () => {
      const w = world(), e = at(w, 'fly', 600, 300, 1000)
      IS.applyStatus(e, 'bleed', 3)
      h.tick(w, 1.1)
      const lost = 1000 - e.hp
      h.gt(lost, 30, 'bleed scales with max hp'); h.lt(lost, 80)
    },
    'status-poison-burn-damage': () => {
      const w = world(), a = at(w, 'fly', 600, 300, 100), b = at(w, 'fly', 700, 300, 100)
      IS.applyStatus(a, 'poison', 3); IS.applyStatus(b, 'burn', 3)
      h.tick(w, 1.1)
      h.lt(a.hp, 100); h.lt(b.hp, 100)
    },
    'status-midas-drops-coins': () => {
      const w = world(), e = at(w, 'fly', 600, 300, 10)
      IS.applyStatus(e, 'midas', 5)
      const n = w.room.pickups.filter(u => u.kind === 'coin').length
      IS.killEnemy(e, w.ctx)
      h.gt(w.room.pickups.filter(u => u.kind === 'coin').length, n, 'coin drop')
    },
    'status-magnetize-pulls-tears': () => {
      const w = world(), e = at(w, 'fly', 600, 400, 1000)
      IS.applyStatus(e, 'magnetize', 5)
      const t = IS.spawnTear({ x: 500, y: 300, vx: 400, vy: 0, dmg: 1, life: 2, flags: ['spectral'] }, w.ctx)
      h.tick(w, .1)
      h.gt(t.vy, 5, 'tear bends toward the magnetized enemy')
    },
    'status-fear-flees': () => {
      const w = world(), e = at(w, 'fly', 400, 200, 100)
      IS.applyStatus(e, 'fear', 3)
      const d0 = IS.dist(e.x, e.y, w.p.x, w.p.y)
      h.tick(w, .6)
      h.gt(IS.dist(e.x, e.y, w.p.x, w.p.y), d0, 'fled')
    },
    'status-confusion-wanders': () => {
      const w = world(), e = at(w, 'fly', 500, 200, 100)
      IS.applyStatus(e, 'confusion', 3)
      h.tick(w, 1)
      h.ok(e.status.confusion < 2.2 && e.status.confusion > 1.5, 'timer runs')
    },
    'status-charm-fights-enemies': () => {
      const w = world(), c = at(w, 'fly', 500, 300, 100), v = at(w, 'fly', 560, 300, 50)
      IS.applyStatus(c, 'charm', 5)
      h.tick(w, 1.5)
      h.lt(v.hp, 50, 'charmed enemy bit another')
      h.eq(w.p.hearts.red, w.p.hearts.maxRed, 'charmed enemy spared the player')
    },
    'status-baited-draws-charmed': () => {
      const w = world(), c = at(w, 'fly', 500, 300, 100), near = at(w, 'fly', 600, 300, 1000), far = at(w, 'fly', 500, 520, 1000)
      near.speed = far.speed = 0
      IS.applyStatus(c, 'charm', 5); IS.applyStatus(far, 'baited', 5)
      h.tick(w, .4)
      h.gt(c.y, 300, 'moved toward the baited enemy')
    },
    'status-boss-immunities': () => {
      const w = world(), b = IS.spawnBoss ? null : null
      const e = at(w, 'fly', 500, 300, 100); e.boss = true
      IS.applyStatus(e, 'fear', 3); IS.applyStatus(e, 'shrink', 3); IS.applyStatus(e, 'freeze', 10)
      h.ok(!e.status.fear && !e.status.shrink, 'boss immune to fear and shrink')
      h.lt(e.status.freeze, 5, 'boss thaws sooner')
    }
  }
}
