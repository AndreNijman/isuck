;(function (IS) {
  'use strict'
  // Synthesised sound. Each effect is a few layers: an oscillator sweeping from
  // f0 to f1, or filtered noise, each with its own envelope. Variation comes from
  // opts.rate (pitch) so repeated sounds do not machine-gun identically.
  let ac = null, out = null, noiseBuf = null
  const defs = {}
  const vols = { master: .8, sfx: .8, music: .65 }
  const last = {}
  const S = (type, f0, f1, dur, vol, extra) => Object.assign({ type, f0, f1, dur, vol }, extra)
  const N = (dur, vol, freq, q, extra) => Object.assign({ type: 'noise', dur, vol, freq, q: q || 1 }, extra)
  const BANK = {
    'tear-fire': [S('sine', 520, 300, .07, .12), N(.04, .05, 2400, 1.5)],
    'tear': [S('sine', 520, 300, .07, .12)],
    'tear-hit': [N(.06, .12, 1400, 1.2), S('sine', 260, 140, .06, .08)],
    'tear-splat': [N(.07, .07, 900, 1), S('sine', 200, 90, .06, .05)],
    'enemy-hurt': [S('square', 220, 120, .06, .06), N(.05, .08, 1800, 2)],
    'enemy-die': [N(.22, .18, 700, .8, { sweep: 200 }), S('sawtooth', 180, 50, .2, .08)],
    'enemy-shoot': [S('triangle', 340, 180, .1, .07), N(.05, .04, 1200, 1)],
    'player-hurt': [S('square', 320, 90, .25, .14), N(.18, .1, 900, 1)],
    'player-die': [S('sawtooth', 300, 40, .9, .16), N(.6, .1, 500, .7)],
    'coin': [S('square', 988, 988, .06, .07), S('square', 1319, 1319, .2, .07, { at: .06 })],
    'key': [S('triangle', 1200, 1600, .12, .08), S('triangle', 1800, 2200, .1, .06, { at: .07 })],
    'bomb-pickup': [S('triangle', 300, 500, .12, .1)],
    'bomb-fuse': [N(.3, .04, 4000, 3)],
    'bomb-explode': [N(.7, .35, 400, .6, { sweep: 60 }), S('sine', 120, 30, .6, .3)],
    'heart-pickup': [S('sine', 440, 660, .12, .1), S('sine', 660, 880, .14, .08, { at: .08 })],
    'item-pickup': [S('triangle', 523, 523, .14, .1), S('triangle', 659, 659, .14, .1, { at: .11 }), S('triangle', 784, 784, .14, .1, { at: .22 }), S('triangle', 1047, 1047, .35, .1, { at: .33 })],
    'pedestal-appear': [S('sine', 400, 900, .3, .08), N(.25, .04, 3000, 2)],
    'door-open': [N(.25, .1, 300, .8), S('square', 90, 70, .2, .05)],
    'door-close': [N(.2, .12, 220, .8), S('square', 80, 55, .2, .07)],
    'door-locked': [S('square', 160, 150, .12, .07)],
    'rock-break': [N(.3, .2, 500, .7, { sweep: 150 })],
    'poop-break': [N(.22, .16, 320, 1.2), S('sine', 140, 60, .18, .08)],
    'chest-open': [N(.15, .1, 700, 1), S('triangle', 600, 900, .2, .08, { at: .08 })],
    'card-use': [N(.12, .06, 3000, 1.5), S('sine', 700, 1100, .2, .07)],
    'pill-use': [S('sine', 500, 300, .25, .08)],
    'pill-swallow': [S('sine', 260, 520, .12, .09), S('sine', 520, 260, .18, .07, { at: .12 })],
    'devil-deal': [S('sawtooth', 110, 104, .7, .1), S('sawtooth', 165, 156, .7, .06)],
    'angel-deal': [S('sine', 880, 880, .6, .07), S('sine', 1320, 1320, .6, .05)],
    'shop-buy': [S('square', 1047, 1047, .08, .06), S('square', 1568, 1568, .2, .06, { at: .08 })],
    'boss-roar': [S('sawtooth', 90, 60, .8, .14), N(.7, .12, 260, .6)],
    'boss-die': [N(1.2, .3, 300, .6, { sweep: 50 }), S('sawtooth', 160, 30, 1.2, .14)],
    'floor-clear': [S('triangle', 392, 392, .15, .08), S('triangle', 523, 523, .15, .08, { at: .15 }), S('triangle', 659, 659, .3, .08, { at: .3 })],
    'trapdoor': [S('sine', 300, 60, .6, .12)],
    'secret-found': [S('triangle', 784, 784, .1, .07), S('triangle', 988, 988, .1, .07, { at: .1 }), S('triangle', 1175, 1175, .1, .07, { at: .2 }), S('triangle', 1568, 1568, .3, .07, { at: .3 })],
    'charge-up': [S('sine', 200, 800, .4, .06)],
    'charge-ready': [S('square', 880, 880, .06, .05), S('square', 1320, 1320, .1, .05, { at: .07 })],
    'menu-move': [S('square', 600, 600, .03, .04)],
    'menu-select': [S('square', 700, 1000, .08, .05)],
    'menu-back': [S('square', 500, 300, .08, .05)],
    'curse-sting': [S('sawtooth', 220, 207, .8, .08), S('sawtooth', 233, 220, .8, .06)],
    'holy-shield': [S('sine', 1200, 1600, .25, .07)],
    'laser-fire': [S('sawtooth', 900, 400, .2, .07)],
    'brimstone-fire': [S('sawtooth', 70, 60, .8, .14), N(.8, .1, 600, .5)],
    'knife-throw': [N(.12, .08, 2500, 2)],
    'familiar-spawn': [S('sine', 600, 1200, .15, .06)],
    'transform': [S('triangle', 300, 1200, .6, .09)],
    'fart': [S('sawtooth', 90, 60, .3, .12), N(.3, .08, 200, .7)],
    'web-shot': [N(.1, .06, 1500, 2)],
    'beep': [S('square', 880, 880, .08, .05)],
    'charge': [N(.15, .08, 600, 1), S('square', 140, 220, .15, .06)],
    'stomp': [N(.35, .28, 220, .6, { sweep: 60 }), S('sine', 90, 35, .35, .25)]
  }

  function noise () {
    if (noiseBuf) return noiseBuf
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate)
    const d = noiseBuf.getChannelData(0)
    let s = 1234567
    for (let i = 0; i < d.length; i++) { s = (s * 1103515245 + 12345) >>> 0; d[i] = (s / 4294967296) * 2 - 1 }
    return noiseBuf
  }

  function layer (L, t0, rate, gainMul) {
    const t = t0 + (L.at || 0), g = ac.createGain()
    const v = L.vol * gainMul
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(v, t + .005)
    g.gain.exponentialRampToValueAtTime(.0001, t + L.dur)
    g.connect(out)
    if (L.type === 'noise') {
      const src = ac.createBufferSource(), f = ac.createBiquadFilter()
      src.buffer = noise(); src.loop = true
      f.type = 'bandpass'; f.Q.value = L.q
      f.frequency.setValueAtTime(L.freq * rate, t)
      if (L.sweep) f.frequency.exponentialRampToValueAtTime(L.sweep * rate, t + L.dur)
      src.connect(f).connect(g)
      src.start(t, (t * 7919) % .9); src.stop(t + L.dur + .02)
    } else {
      const o = ac.createOscillator()
      o.type = L.type
      o.frequency.setValueAtTime(L.f0 * rate, t)
      if (L.f1 !== L.f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, L.f1 * rate), t + L.dur)
      o.connect(g)
      o.start(t); o.stop(t + L.dur + .02)
    }
  }

  IS.audio = { muted:false,
    init () {
      if (!ac && typeof AudioContext !== 'undefined') {
        // a partial AudioContext (old browsers, test stubs) means silence, not a crash
        try {
          ac = new AudioContext()
          const comp = ac.createDynamicsCompressor()
          comp.threshold.value = -14; comp.ratio.value = 6
          out = ac.createGain(); out.connect(comp).connect(ac.destination)
        } catch (e) { ac = null; out = null; this.muted = true }
      }
      return ac
    },
    resume () { this.init(); if (ac && ac.state === 'suspended') return ac.resume() },
    defineSfx (name, spec) { defs[name] = spec || {} },
    sfx (name, opts) {
      if (this.muted) return; this.init(); if (!ac || ac.state !== 'running') return
      const now = ac.currentTime
      // the same sound more than ~30 times a second is noise, not feedback
      if (last[name] && now - last[name] < .03) return
      last[name] = now
      const o = opts || {}, rate = o.rate || 1, gain = vols.sfx * vols.master * (o.vol || 1)
      const recipe = BANK[name]
      if (recipe) { for (const L of recipe) layer(L, now, rate, gain); return }
      const d = Object.assign({ freq: 180, duration: .08, type: 'sine', vol: .12 }, defs[name])
      layer(S(d.type, d.freq, d.freq, d.duration, d.vol), now, rate, gain)
    },
    music (cmd) { this._music = cmd === 'stop' ? null : cmd }, setFloorMusic (floor) { this._floorMusic = floor && floor.music; this.music('floor') },
    volume (kind, v) { if (v === undefined) return vols[kind]; vols[kind] = Math.max(0,Math.min(1,v)); return vols[kind] }
  }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
