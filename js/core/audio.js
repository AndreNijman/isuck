;(function (IS) {
  'use strict'
  let ac = null; const defs = {}
  const vols = { master: .8, sfx: .8, music: .65 }
  IS.audio = { muted:false,
    init () { if (!ac && typeof AudioContext !== 'undefined') ac = new AudioContext(); return ac },
    resume () { this.init(); if (ac && ac.state === 'suspended') return ac.resume() },
    defineSfx (name, spec) { defs[name] = spec || {} },
    sfx (name, opts) { if (this.muted) return; this.init(); if (!ac) return; const d=Object.assign({freq:180,duration:.08,type:'sine',vol:.12},defs[name],opts); const o=ac.createOscillator(),g=ac.createGain(); o.type=d.type;o.frequency.value=d.freq*(d.rate||1);g.gain.setValueAtTime(0,ac.currentTime);g.gain.linearRampToValueAtTime(d.vol*vols.sfx*vols.master,ac.currentTime+.005);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+d.duration);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+d.duration+.01) },
    music (cmd) { this._music = cmd === 'stop' ? null : cmd }, setFloorMusic (floor) { this._floorMusic = floor && floor.music; this.music('floor') },
    volume (kind, v) { if (v === undefined) return vols[kind]; vols[kind] = Math.max(0,Math.min(1,v)); return vols[kind] }
  }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
