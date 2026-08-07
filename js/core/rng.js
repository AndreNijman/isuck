;(function (IS) {
  'use strict'
  function RNG (seed) { this._state = (seed >>> 0) || 0x6d2b79f5 }
  RNG.prototype.next = function () { let t = this._state += 0x6d2b79f5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296 }
  RNG.prototype.int = function (n) { return n > 0 ? Math.floor(this.next() * n) : 0 }
  RNG.prototype.range = function (a, b) { return a + this.next() * (b - a) }
  RNG.prototype.pick = function (a) { return a && a.length ? a[this.int(a.length)] : undefined }
  RNG.prototype.pickWeighted = function (a, w) { if (!a || !a.length) return undefined; let sum = w.reduce((n, x) => n + Math.max(0, x || 0), 0); if (!sum) return this.pick(a); let r = this.next() * sum; for (let i = 0; i < a.length; i++) { r -= Math.max(0, w[i] || 0); if (r <= 0) return a[i] } return a[a.length - 1] }
  RNG.prototype.shuffle = function (a) { const out = (a || []).slice(); for (let i = out.length - 1; i; i--) { const j = this.int(i + 1); [out[i], out[j]] = [out[j], out[i]] } return out }
  RNG.prototype.chance = function (p) { return this.next() < Math.max(0, Math.min(1, p || 0)) }
  RNG.prototype.fork = function () { return new RNG((this.next() * 4294967296) >>> 0) }
  RNG.prototype.state = function () { return this._state >>> 0 }
  RNG.prototype.setState = function (s) { this._state = s >>> 0; return this }
  IS.RNG = RNG
  IS.randomSeed = () => { if (typeof crypto !== 'undefined' && crypto.getRandomValues) return crypto.getRandomValues(new Uint32Array(1))[0]; return (Date.now() ^ Math.floor(Math.random() * 4294967296)) >>> 0 }
  IS.hashString = str => { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }
  const chars = 'ABCDEFGHJKLMNPQRSTWXYZ2346789'
  IS.seedToString = n => { let s = ''; let v = n >>> 0; for (let i = 0; i < 8; i++) { s += chars[v % chars.length]; v = (Math.floor(v / chars.length) ^ Math.imul(v, 2654435761)) >>> 0 } return s.slice(0, 4) + ' ' + s.slice(4) }
  IS.stringToSeed = str => { const s = String(str || '').toUpperCase().replace(/\s/g, ''); return s.length === 8 && [...s].every(c => chars.includes(c)) ? IS.hashString(s) : null }
  IS.luckChance = (base, perLuck, cap, luck) => Math.max(0, Math.min(cap == null ? 1 : cap, base + Math.max(0, luck || 0) * perLuck))
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
