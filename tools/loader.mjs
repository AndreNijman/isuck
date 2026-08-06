#!/usr/bin/env node
//
// Loads the whole ISUCK bundle into a Node VM with just enough of a browser
// around it to run. Shared by validate-content.mjs and balance.mjs so the
// validator can poke at real item defs, real enemy spawns and real sprite draw
// calls without launching a browser.
//
// The script list is read FROM index.html, in order, on purpose: that makes an
// unwired file impossible to miss, because the loader simply never sees it.

import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export function scriptList () {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
  const out = []
  const re = /<script\s+src="([^"]+)"><\/script>/g
  let m
  while ((m = re.exec(html))) out.push(m[1])
  return out
}

// A 2D context stand-in that swallows anything a sprite function does. Any
// unknown property is a method returning the same proxy, so chained calls like
// createLinearGradient().addColorStop() work; the handful of properties code
// reads as numbers return numbers.
function fakeCtx () {
  const NUMERIC = new Set(['width', 'height', 'lineWidth', 'globalAlpha', 'miterLimit',
    'lineDashOffset', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY',
    'actualBoundingBoxLeft', 'actualBoundingBoxRight', 'actualBoundingBoxAscent',
    'actualBoundingBoxDescent', 'fontBoundingBoxAscent', 'fontBoundingBoxDescent'])
  const store = Object.create(null)
  const target = function () {}
  const proxy = new Proxy(target, {
    get (_t, prop) {
      if (prop === Symbol.toPrimitive) return () => 0
      if (prop === 'then') return undefined
      if (prop in store) return store[prop]
      if (NUMERIC.has(prop)) return 0
      if (prop === 'canvas') return fakeCanvas()
      if (prop === 'data') return new Uint8ClampedArray(4)
      return (...args) => proxy
    },
    set (_t, prop, value) { store[prop] = value; return true },
    has () { return true },
    apply () { return proxy }
  })
  return proxy
}

function fakeCanvas (w = 1280, h = 720) {
  return {
    width: w,
    height: h,
    style: {},
    getContext: () => fakeCtx(),
    toDataURL: () => 'data:,',
    addEventListener () {},
    removeEventListener () {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: w, height: h, right: w, bottom: h })
  }
}

function fakeAudioNode () {
  const node = {
    connect: () => node,
    disconnect () {},
    start () {},
    stop () {},
    setPeriodicWave () {},
    frequency: { value: 440, setValueAtTime () {}, linearRampToValueAtTime () {}, exponentialRampToValueAtTime () {}, cancelScheduledValues () {} },
    detune: { value: 0, setValueAtTime () {}, linearRampToValueAtTime () {}, exponentialRampToValueAtTime () {} },
    gain: { value: 1, setValueAtTime () {}, linearRampToValueAtTime () {}, exponentialRampToValueAtTime () {}, setTargetAtTime () {}, cancelScheduledValues () {} },
    Q: { value: 1, setValueAtTime () {} },
    pan: { value: 0, setValueAtTime () {} },
    playbackRate: { value: 1, setValueAtTime () {} },
    type: 'sine',
    buffer: null,
    loop: false,
    onended: null
  }
  return node
}

export function makeSandbox () {
  const logs = { warn: [], error: [], log: [] }

  const localStore = new Map()
  const localStorage = {
    getItem: k => (localStore.has(k) ? localStore.get(k) : null),
    setItem: (k, v) => localStore.set(k, String(v)),
    removeItem: k => localStore.delete(k),
    clear: () => localStore.clear()
  }

  const doc = {
    documentElement: { style: {}, classList: { add () {}, remove () {}, toggle () {} } },
    body: { style: {}, appendChild () {}, addEventListener () {}, classList: { add () {}, remove () {} } },
    createElement: tag => (tag === 'canvas' ? fakeCanvas() : { style: {}, classList: { add () {}, remove () {} }, appendChild () {}, addEventListener () {}, setAttribute () {} }),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener () {},
    removeEventListener () {},
    hidden: false,
    fonts: { ready: Promise.resolve(), add () {} }
  }

  class FakeAudioContext {
    constructor () {
      this.currentTime = 0
      this.sampleRate = 48000
      this.state = 'running'
      this.destination = fakeAudioNode()
      this.listener = {}
    }
    createOscillator () { return fakeAudioNode() }
    createGain () { return fakeAudioNode() }
    createBiquadFilter () { return fakeAudioNode() }
    createBufferSource () { return fakeAudioNode() }
    createStereoPanner () { return fakeAudioNode() }
    createDynamicsCompressor () { return fakeAudioNode() }
    createWaveShaper () { return fakeAudioNode() }
    createDelay () { return fakeAudioNode() }
    createConvolver () { return fakeAudioNode() }
    createPeriodicWave () { return {} }
    createBuffer (ch, len) {
      return { length: len, numberOfChannels: ch, sampleRate: 48000, getChannelData: () => new Float32Array(len) }
    }
    resume () { return Promise.resolve() }
    suspend () { return Promise.resolve() }
    close () { return Promise.resolve() }
  }

  const win = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    localStorage,
    location: { href: 'file:///isuck/index.html', search: '', hash: '' },
    navigator: { userAgent: 'node', getGamepads: () => [], maxTouchPoints: 0, language: 'en' },
    performance: { now: () => 0 },
    addEventListener () {},
    removeEventListener () {},
    requestAnimationFrame: () => 0,
    cancelAnimationFrame () {},
    setTimeout: () => 0,
    clearTimeout () {},
    setInterval: () => 0,
    clearInterval () {},
    AudioContext: FakeAudioContext,
    webkitAudioContext: FakeAudioContext,
    matchMedia: () => ({ matches: false, addEventListener () {}, addListener () {} }),
    document: doc,
    Image: class { constructor () { this.width = 0; this.height = 0 } },
    OffscreenCanvas: class { constructor (w, h) { Object.assign(this, fakeCanvas(w, h)) } },
    Path2D: class { constructor () {} addPath () {} moveTo () {} lineTo () {} arc () {} rect () {} closePath () {} bezierCurveTo () {} quadraticCurveTo () {} ellipse () {} },
    isTrusted: true
  }

  const sandbox = {
    window: win,
    document: doc,
    localStorage,
    navigator: win.navigator,
    performance: win.performance,
    location: win.location,
    devicePixelRatio: 1,
    requestAnimationFrame: win.requestAnimationFrame,
    cancelAnimationFrame: win.cancelAnimationFrame,
    setTimeout: win.setTimeout,
    clearTimeout: win.clearTimeout,
    setInterval: win.setInterval,
    clearInterval: win.clearInterval,
    AudioContext: FakeAudioContext,
    webkitAudioContext: FakeAudioContext,
    OffscreenCanvas: win.OffscreenCanvas,
    Image: win.Image,
    Path2D: win.Path2D,
    matchMedia: win.matchMedia,
    console: {
      log: (...a) => logs.log.push(a.join(' ')),
      warn: (...a) => logs.warn.push(a.join(' ')),
      error: (...a) => logs.error.push(a.join(' ')),
      info: () => {},
      debug: () => {}
    },
    Math,
    JSON,
    Date,
    Set,
    Map,
    WeakMap,
    WeakSet,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Symbol,
    Promise,
    Error,
    TypeError,
    RangeError,
    RegExp,
    Float32Array,
    Float64Array,
    Uint8Array,
    Uint8ClampedArray,
    Uint16Array,
    Uint32Array,
    Int8Array,
    Int16Array,
    Int32Array,
    ArrayBuffer,
    isNaN,
    isFinite,
    parseInt,
    parseFloat,
    encodeURIComponent,
    decodeURIComponent,
    structuredClone
  }
  sandbox.globalThis = sandbox
  sandbox.self = sandbox
  win.self = win

  return { sandbox, logs, fakeCtx, fakeCanvas }
}

// Loads every script in index.html order. Returns the IS global plus a report.
export function loadGame (opts = {}) {
  const { sandbox, logs, fakeCtx, fakeCanvas } = makeSandbox()
  const context = vm.createContext(sandbox)
  const loaded = []
  const failures = []

  for (const rel of scriptList()) {
    const abs = path.join(ROOT, rel)
    if (!fs.existsSync(abs)) {
      failures.push({ file: rel, error: 'file does not exist (listed in index.html)' })
      continue
    }
    const code = fs.readFileSync(abs, 'utf8')
    try {
      new vm.Script(code, { filename: rel }).runInContext(context, { timeout: opts.timeout || 20000 })
      loaded.push(rel)
    } catch (e) {
      failures.push({ file: rel, error: (e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : String(e)) })
    }
  }

  return {
    IS: sandbox.window.IS || sandbox.IS,
    sandbox,
    logs,
    loaded,
    failures,
    fakeCtx,
    fakeCanvas
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = loadGame()
  console.log(`loaded ${r.loaded.length} files, ${r.failures.length} failed`)
  for (const f of r.failures) console.log(`  FAIL ${f.file}: ${f.error}`)
  if (r.IS) {
    console.log(`IS registries: items=${r.IS.items?.length ?? '?'} trinkets=${r.IS.trinkets?.length ?? '?'} cards=${r.IS.cards?.length ?? '?'} enemies=${r.IS.enemies?.length ?? '?'} bosses=${r.IS.bosses?.length ?? '?'} rooms=${r.IS.rooms?.length ?? '?'} floors=${r.IS.floors?.length ?? '?'} chars=${r.IS.characters?.length ?? '?'}`)
    if (r.IS.defineErrors?.length) console.log(`defineErrors: ${r.IS.defineErrors.length}\n  ` + r.IS.defineErrors.slice(0, 10).join('\n  '))
  } else {
    console.log('no IS global — const.js did not load')
  }
  if (r.logs.warn.length) console.log(`warns: ${r.logs.warn.length} (first: ${r.logs.warn[0]})`)
}
