;(function (IS) {
  'use strict'
  // Presentation state the renderer draws and the game screen freezes the simulation for:
  // the room slide, the top streak (item / floor / card), the item-over-head pose and the
  // boss versus card. Shapes are the contract in docs/PARITY.md.
  const SLIDE = .25, STREAK = 2.4, HOLD = 1, INTRO = 1.6, GRACE = 1.6, QUEUE = 4
  IS.TRANSITION_TIME = SLIDE; IS.BOSS_INTRO_TIME = INTRO; IS.BOSS_GRACE = GRACE; IS.HOLD_ITEM_TIME = HOLD

  // streak: one at a time, the rest wait their turn
  IS.pushStreak = (run, title, sub, dur) => { if (!run) return null; const s = { title: String(title == null ? '' : title), sub: String(sub == null ? '' : sub), t: 0, dur: dur || STREAK }
    if (!run.streak) run.streak = s; else { const q = run.streakQueue || (run.streakQueue = []); q.push(s); while (q.length > QUEUE) q.shift() }
    return s }
  IS.updateStreak = (run, dt) => { const s = run && run.streak; if (!s) return; if ((s.t += dt) >= s.dur) run.streak = (run.streakQueue && run.streakQueue.shift()) || null }

  IS.holdPose = (p, id) => { if (p && id) p.holdItem = { id, t: 0 }; return p && p.holdItem }

  // room slide: `dir` is the door walked through, from/to are room indices
  IS.beginTransition = (dir, from, to) => { if (!IS.state) return null; return (IS.state.transition = { dir, t: 0, from, to }) }
  // true while the slide is running (the caller freezes the simulation)
  IS.updateTransition = dt => { const s = IS.state, tr = s && s.transition; if (!tr) return false; tr.t += dt / SLIDE; if (tr.t >= 1) { s.transition = null; return false } return true }

  // boss versus card: set when an uncleared boss room is entered, the room is frozen meanwhile
  IS.beginBossIntro = (run, room) => { if (!run) return null; run.bossIntro = null; if (!room || room.type !== 'boss' || room.cleared) return null
    const b = (room.enemies || []).find(e => e.boss && !e.dead); if (!b) return null
    return (run.bossIntro = { bossId: b.id, name: (b.def && b.def.name) || b.id, t: 0, dur: INTRO }) }
  IS.finishBossIntro = (run, ctx) => { if (!run || !run.bossIntro) return false; run.bossIntro = null; const p = run.player
    if (p) p.invulnUntil = Math.max(p.invulnUntil || 0, (run.time || 0) + GRACE)
    return true }
  IS.updateBossIntro = (run, dt, ctx) => { const b = run && run.bossIntro; if (!b) return false; if ((b.t += dt) >= b.dur) IS.finishBossIntro(run, ctx); return true }

  IS.clearStage = run => { if (IS.state) IS.state.transition = null; if (run) { run.bossIntro = null; run.streak = null; run.streakQueue = []; if (run.player) run.player.holdItem = null } }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
