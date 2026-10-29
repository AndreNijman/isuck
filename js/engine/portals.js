;(function (IS) {
  'use strict'
  // Things Isaac walks into rather than touches: the trapdoor after a boss, the
  // crawlspace hatch under a rock and the ladder that climbs back out of it.
  const REACH = 46
  const near = (p, o) => o && IS.dist(p.x, p.y, o.x, o.y) < REACH

  IS.enterCrawlspace = (run, ctx) => {
    const room = run.room, p = run.player
    const c = room && room.crawlspace && IS.crawlspaceFor(run, room)
    if (!c) return false
    c.returnPos = { x: room.crawlspace.x, y: room.crawlspace.y }
    IS.enterRoom(run, c.index, null, ctx)
    p.x = c.pxW / 2; p.y = c.pxH / 2 - 60; p.portalCool = 1
    ctx.sfx && ctx.sfx('trapdoor')
    return true
  }

  IS.leaveCrawlspace = (run, ctx) => {
    const c = run.room, p = run.player, back = run.floor.rooms[c.returnIndex]
    if (!back) return false
    IS.enterRoom(run, back.index, null, ctx)
    const at = (c.returnPos) || { x: back.pxW / 2, y: back.pxH / 2 }
    p.x = at.x; p.y = at.y + 60; p.portalCool = 1
    ctx.sfx && ctx.sfx('door-open')
    return true
  }

  IS.updatePortals = (room, dt, ctx) => {
    const run = ctx && ctx.run, p = ctx && ctx.player
    if (!room || !run || !p || p.dead) return false
    if (p.portalCool > 0) { p.portalCool = Math.max(0, p.portalCool - dt); return false }
    if (room.trapdoor && room.trapdoor.open && room.cleared && near(p, room.trapdoor)) {
      const n = IS.nextFloorIds(run)
      if (!n.normal) return false
      ctx.sfx && ctx.sfx('trapdoor')
      run.floorIndex = (run.floorIndex || 0) + 1; run.floorTime = 0
      IS.startFloor(run, n.normal, ctx)
      p.portalCool = 1
      return true
    }
    if (room.crawlspace && !room.crawlspace.hidden && near(p, room.crawlspace)) return IS.enterCrawlspace(run, ctx)
    if (room.ladder && near(p, room.ladder)) return IS.leaveCrawlspace(run, ctx)
    return false
  }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
