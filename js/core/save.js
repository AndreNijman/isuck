;(function (IS) {
  'use strict'
  const KEY = 'isuck-save-v1'
  const fresh = () => ({ version: 1, unlocks: {}, items: {}, bestiary: {}, stats: {}, options: { master: 0.8, sfx: 0.8, music: 0.65 }, goals: {}, run: null })
  IS.save = {
    data: fresh(),
    load () { try { const raw = typeof localStorage !== 'undefined' && localStorage.getItem(KEY); this.data = Object.assign(fresh(), raw ? JSON.parse(raw) : {}); this.data.options = Object.assign(fresh().options, this.data.options) } catch (_) { this.data = fresh() } return this.data },
    flush () { try { if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(this.data)); return true } catch (_) { return false } },
    unlocked (id) { return !!this.data.unlocks[id] },
    unlock (id) { if (!id || this.unlocked(id)) return false; this.data.unlocks[id] = true; this.flush(); return true },
    itemUnlocked (id) { const d = IS.items && IS.itemsById[id]; return !!d && (!d.unlock || this.unlocked(d.unlock)) },
    seeItem (id) { if (id) this.data.items[id] = (this.data.items[id] || 0) + 1; this.flush() },
    seeEnemy (id, killed) { if (!id) return; const e = this.data.bestiary[id] || (this.data.bestiary[id] = { seen: 0, killed: 0 }); e.seen++; if (killed) e.killed++; this.flush() },
    option (key, value) { if (value === undefined) return this.data.options[key]; this.data.options[key] = value; this.flush(); return value },
    addStat (key, n) { this.data.stats[key] = (this.data.stats[key] || 0) + (n == null ? 1 : n); this.flush(); return this.data.stats[key] },
    markGoal (charId, goal) { const g = this.data.goals[charId] || (this.data.goals[charId] = {}); g[goal] = true; this.flush() },
    reset () { this.data = fresh(); this.flush() },
    storeRun (snapshot) { this.data.run = snapshot || null; this.flush() },
    takeRun () { const r = this.data.run; this.data.run = null; this.flush(); return r || null },
    hasRun () { return !!this.data.run }
  }
  IS.save.load()
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
