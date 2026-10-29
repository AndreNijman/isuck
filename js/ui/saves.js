;(function (IS) {
  'use strict'
  /*
   * Three save slots, kept entirely in the UI layer on top of IS.save.
   * Slot data lives under its own localStorage key; the active slot is swapped into IS.save.data
   * and every IS.save.flush() also mirrors into the slot, so the engine and core code stay unaware.
   * The first launch adopts the legacy single save as slot 1.
   */
  var KEY = 'isuck-slots-v1', S = IS.slots = { count: 3, active: -1, store: { slots: [null, null, null], last: -1 } }
  function read () { try { var raw = typeof localStorage !== 'undefined' && localStorage.getItem(KEY); if (raw) { var o = JSON.parse(raw); if (o && o.slots && o.slots.length === 3) return o } } catch (_) {} return null }
  function write () { try { if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(S.store)) } catch (_) {} }
  function blank () { var keep = IS.save.data.options; IS.save.data = { version: 1, unlocks: {}, items: {}, bestiary: {}, stats: {}, options: Object.assign({}, keep), goals: {}, run: null }; return IS.save.data }
  function used (d) { return !!d && (Object.keys(d.unlocks || {}).length + Object.keys(d.items || {}).length + Object.keys(d.stats || {}).length + Object.keys(d.goals || {}).length > 0 || !!d.run) }
  S.init = function () {
    var o = read()
    if (!o) { o = { slots: [null, null, null], last: -1 }; if (used(IS.save.data)) { o.slots[0] = JSON.parse(JSON.stringify(IS.save.data)); o.last = 0 } }
    S.store = o
    var orig = IS.save.flush
    IS.save.flush = function () { var r = orig.call(IS.save); if (S.active >= 0) { S.store.slots[S.active] = IS.save.data; write() } return r }
    write()
  }
  S.info = function (i) {
    var d = S.active === i ? IS.save.data : S.store.slots[i]
    if (!d) return null
    var marks = 0, k, g = d.goals || {}; for (k in g) marks += Object.keys(g[k] || {}).length
    return { marks: marks, items: Object.keys(d.items || {}).length, unlocks: Object.keys(d.unlocks || {}).length, runs: (d.stats && (d.stats.runs || d.stats['runs-started'])) || 0, streak: (d.stats && d.stats.streak) || 0, hasRun: !!d.run, empty: !used(d) }
  }
  S.choose = function (i) {
    if (S.active >= 0) { S.store.slots[S.active] = IS.save.data }
    var d = S.store.slots[i]
    if (d) { IS.save.data = Object.assign({ version: 1, unlocks: {}, items: {}, bestiary: {}, stats: {}, options: {}, goals: {}, run: null }, d) } else blank()
    S.active = i; S.store.last = i; S.store.slots[i] = IS.save.data; write()
    if (IS.audio && IS.audio.applyOptions) { try { IS.audio.applyOptions() } catch (_) {} }
  }
  S.erase = function (i) {
    S.store.slots[i] = null
    if (S.active === i) { blank(); S.store.slots[i] = IS.save.data }
    write()
  }
  S.init()
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
