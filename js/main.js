;(function (IS) {
  'use strict'

  IS.state = { screen: 'title', run: null, paused: false, time: 0, frame: 0, ctx: null, args: null }
  IS.canvas = null
  IS.g = null

  function announce (message) {
    if (typeof document === 'undefined') return
    var node = document.getElementById('game-status')
    if (node) node.textContent = message || ''
  }

  function snapshot (run) {
    if (!run) return null
    return {
      version: 1, seed: run.seed, charId: run.charId,
      challengeId: run.challengeId, greed: run.greed,
      floorId: run.floor && run.floor.id, roomIndex: run.roomIndex || 0,
      time: run.time, itemsTaken: (run.itemsTaken || []).slice()
    }
  }

  function firstFloorId (greed) {
    var list = IS.floors || []
    var found = list.find(function (f) { return greed ? /^greed-/.test(f.id) : f.depth === 1 && !/^greed-/.test(f.id) })
    return found ? found.id : (list[0] && list[0].id)
  }

  function makeRun (opts) {
    opts = opts || {}
    var seed = opts.seed == null ? IS.randomSeed() : opts.seed >>> 0
    var root = new IS.RNG(seed)
    var run = {
      seed: seed, seedStr: IS.seedToString(seed), rng: root,
      floorRng: root.fork(), poolRng: root.fork(), player: null,
      floor: null, floorIndex: 0, room: null, roomIndex: 0,
      charId: opts.charId || ((IS.characters[0] && IS.characters[0].id) || 'isaac'),
      challengeId: opts.challengeId || null, greed: !!opts.greed,
      pools: {}, curses: 0, stats: { tearsFired: 0 }, flags: {},
      time: 0, floorTime: 0, devilDealsTaken: 0, dealChanceMods: {},
      pillColours: {}, identified: {}, identifiedPills: {}, bossesKilled: [],
      itemsTaken: [], donation: 0, planetariumChance: .01, altPath: false,
      ascent: false, mausoleumHeartKilled: false, knifePieces: 0,
      deaths: 0, log: []
    }
    run.player = IS.makePlayer(run.charId, run)
    IS.initPools(run)
    var challenge = run.challengeId && IS.challengesById[run.challengeId]
    if (challenge) {
      ;(challenge.items || []).forEach(function (id) { IS.giveItem(run.player, id, { noAnim: true }) })
      ;(challenge.trinkets || []).forEach(function (id) { IS.giveTrinket(run.player, id) })
      ;(challenge.pocket || []).forEach(function (x) { IS.givePocket(run.player, x.kind || 'card', x.id || x) })
      if (challenge.hearts) Object.assign(run.player.hearts, challenge.hearts)
      run.challengeRules = Object.assign({}, challenge.rules)
    }
    return run
  }

  IS.go = function (name, args) {
    var next = IS.screens[name]
    if (!next) {
      console.warn('Unknown screen "' + name + '"')
      name = IS.screens.title ? 'title' : name
      next = IS.screens[name]
    }
    var old = IS.screens[IS.state.screen]
    if (old && typeof old.exit === 'function') old.exit()
    IS.state.screen = name
    IS.state.args = args || null
    if (next && typeof next.enter === 'function') next.enter(args || {})
    announce(name === 'game' ? 'Run started. Escape pauses.' : name.replace(/-/g, ' '))
    return name
  }

  IS.startRun = function (opts) {
    var run = makeRun(opts)
    var floorId = firstFloorId(run.greed)
    if (!floorId) throw new Error('No floor definitions are registered')
    IS.state.run = run
    IS.state.ctx = IS.makeCtx(run)
    IS.startFloor(run, floorId, IS.state.ctx)
    IS.state.paused = false
    IS.save.storeRun(snapshot(run))
    IS.go('game')
    return run
  }

  IS.endRun = function (reason, goal) {
    var run = IS.state.run
    if (!run) return false
    if (goal) IS.progress.completeRun(run, goal)
    else IS.progress.record('run-lost', { reason: reason }, run)
    IS.save.storeRun(null)
    IS.go(goal ? 'victory' : 'death', { reason: reason, goal: goal, run: run })
    announce(goal ? 'Victory: ' + goal : 'Run ended')
    return true
  }

  function step (dt) {
    IS.state.time += dt
    IS.state.frame++
    var run = IS.state.run
    if (run && !IS.state.paused) {
      run.time += dt
      run.floorTime += dt
      IS.refreshCtx(IS.state.ctx, run.room, dt)
    }
    var screen = IS.screens[IS.state.screen]
    if (screen && typeof screen.update === 'function') screen.update(dt, IS.state.args)
    if (IS.input && typeof IS.input.update === 'function') IS.input.update()
  }

  function draw (dt) {
    if (!IS.g) return
    var screen = IS.screens[IS.state.screen]
    if (screen && typeof screen.draw === 'function') screen.draw(IS.g, dt, IS.state.args)
    else if (IS.state.run && typeof IS.render === 'function') IS.render(IS.g, dt)
  }

  IS.boot = function () {
    if (typeof document === 'undefined' || IS.canvas) return false
    var canvas = document.getElementById('game')
    if (!canvas) return false
    IS.canvas = canvas
    IS.g = canvas.getContext('2d', { alpha: false })
    IS.input.init(canvas)
    IS.reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    IS.save.load()
    IS.fx.reset()
    canvas.focus({ preventScroll: true })
    var boot = document.getElementById('boot')
    if (boot) boot.classList.add('gone')
    var last = performance.now(), accumulator = 0
    function frame (now) {
      var elapsed = Math.min(.1, Math.max(0, (now - last) / 1000))
      last = now
      accumulator += elapsed
      var count = 0
      while (accumulator >= IS.DT && count++ < 5) { step(IS.DT); accumulator -= IS.DT }
      draw(elapsed)
      requestAnimationFrame(frame)
    }
    window.addEventListener('blur', function () {
      if (IS.state.screen === 'game' && !IS.state.paused) { IS.state.paused = true; IS.go('pause') }
    })
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && IS.state.screen === 'game' && !IS.state.paused) { IS.state.paused = true; IS.go('pause') }
    })
    document.addEventListener('keydown', function (event) {
      var active = IS.screens[IS.state.screen]
      if (active && typeof active.key === 'function') active.key(event)
    })
    IS.go(IS.screens.title ? 'title' : Object.keys(IS.screens)[0])
    requestAnimationFrame(frame)
    return true
  }

  IS.simulate = function (opts) {
    opts = opts || {}
    var result = { floorsCleared: 0, depth: 0, died: false, seconds: 0, itemsTaken: 0, error: null }
    try {
      var run = makeRun(opts), floorId = firstFloorId(run.greed)
      if (!floorId) throw new Error('No floor definitions are registered')
      var ctx = IS.makeCtx(run)
      IS.startFloor(run, floorId, ctx)
      var maxFloors = opts.maxFloors || 8, maxSeconds = opts.maxSeconds || 2400
      while (!run.player.dead && result.floorsCleared < maxFloors && run.time < maxSeconds) {
        for (var ri = 0; ri < run.floor.rooms.length && !run.player.dead; ri++) {
          IS.enterRoom(run, ri, 'left', ctx)
          IS.refreshCtx(ctx, run.room, IS.DT)
          var guard = 0
          while (IS.roomEnemies(run.room).length && guard++ < 1200) {
            var enemy = IS.roomEnemies(run.room)[0]
            var dir = IS.norm(enemy.x - run.player.x, enemy.y - run.player.y)
            IS.firePlayerTears(run.player, dir, ctx)
            IS.damageEnemy(enemy, Math.max(1, run.player.stats.damage), { src: run.player }, ctx)
            IS.updateRoom(run.room, IS.DT, ctx)
            run.time += IS.DT
          }
          for (var pi = 0; pi < run.room.pickups.length; pi++) {
            var pickup = run.room.pickups[pi]
            if (pickup.kind === 'item' && IS.tryTakePickup(run.player, pickup, ctx)) run.itemsTaken.push(pickup.id)
          }
        }
        result.floorsCleared++
        result.depth = Math.max(result.depth, run.floor.depth || result.floorsCleared)
        var next = IS.nextFloorIds(run)
        if (result.floorsCleared >= maxFloors || !next || !(next.normal || next.alt)) break
        IS.startFloor(run, next.normal || next.alt, ctx)
      }
      result.died = !!run.player.dead
      result.seconds = run.time
      result.itemsTaken = run.itemsTaken.length
    } catch (e) { result.error = e && e.message ? e.message : String(e) }
    return result
  }

  IS.debug = {
    giveItem: function (id) { return IS.state.run && IS.giveItem(IS.state.run.player, id, { ctx: IS.state.ctx }) },
    clear: function () { return IS.state.ctx && IS.state.ctx.clearRoom() },
    warp: function (id) { return IS.state.run && IS.startFloor(IS.state.run, id, IS.state.ctx) },
    god: function () { if (!IS.state.run) return false; IS.state.run.player.invulnUntil = Infinity; return true },
    spawn: function (id) { var r = IS.state.run; return r && IS.spawnEnemy(r.room, id, r.player.x + 120, r.player.y, {}) }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', IS.boot)
    else setTimeout(IS.boot, 0)
  }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
