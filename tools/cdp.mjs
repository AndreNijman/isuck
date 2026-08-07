#!/usr/bin/env node
//
// A minimal Chrome DevTools Protocol driver. No dependencies — Node 22 ships a
// global WebSocket, and the house rule is that this project adds no packages, so
// the test harness borrows the Chrome that is already on the machine rather than
// pulling a browser automation stack into a game that has none.
//
// Chrome binary resolution order:
//   $ISUCK_CHROME
//   tools/.chrome-path (one line)
//   ~/.local/share/overpop-tools/chrome-headless-shell-linux64/chrome-headless-shell
//   chromium / google-chrome-stable / google-chrome on PATH

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function which (bin) {
  try { return execFileSync('sh', ['-c', `command -v ${bin}`], { stdio: 'pipe' }).toString().trim() || null } catch { return null }
}

export function findChrome () {
  if (process.env.ISUCK_CHROME && fs.existsSync(process.env.ISUCK_CHROME)) return process.env.ISUCK_CHROME
  const pathFile = path.join(ROOT, 'tools/.chrome-path')
  if (fs.existsSync(pathFile)) {
    const p = fs.readFileSync(pathFile, 'utf8').trim()
    if (p && fs.existsSync(p)) return p
  }
  const shared = path.join(os.homedir(), '.local/share/overpop-tools/chrome-headless-shell-linux64/chrome-headless-shell')
  if (fs.existsSync(shared)) return shared
  for (const bin of ['chromium', 'chromium-browser', 'google-chrome-stable', 'google-chrome', 'brave']) {
    const p = which(bin)
    if (p) return p
  }
  return null
}

export async function launch (opts = {}) {
  const chrome = findChrome()
  if (!chrome) throw new Error('no Chrome found — set ISUCK_CHROME or write tools/.chrome-path')

  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'isuck-cdp-'))
  const args = [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${userDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    '--mute-audio',
    '--allow-file-access-from-files',
    '--autoplay-policy=no-user-gesture-required',
    `--window-size=${opts.width || 1280},${opts.height || 720}`,
    'about:blank'
  ]
  if (opts.hostResolverRules) args.splice(args.length - 1, 0, `--host-resolver-rules=${opts.hostResolverRules}`)

  const proc = spawn(chrome, args, { stdio: ['ignore', 'pipe', 'pipe'] })

  const wsUrl = await new Promise((resolve, reject) => {
    let buf = ''
    const timer = setTimeout(() => reject(new Error('chrome did not report a devtools endpoint in 20s')), 20000)
    const onData = d => {
      buf += d.toString()
      const m = buf.match(/ws:\/\/[^\s]+/)
      if (m) { clearTimeout(timer); resolve(m[0]) }
    }
    proc.stderr.on('data', onData)
    proc.stdout.on('data', onData)
    proc.on('exit', code => { clearTimeout(timer); reject(new Error(`chrome exited early (${code}): ${buf.slice(-400)}`)) })
  })

  const ws = new WebSocket(wsUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', () => reject(new Error('devtools websocket failed')), { once: true })
  })

  let nextId = 1
  const pending = new Map()
  const listeners = []

  ws.addEventListener('message', ev => {
    let msg
    try { msg = JSON.parse(ev.data) } catch { return }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) reject(new Error(`${msg.error.message} (${JSON.stringify(msg.params || {})})`))
      else resolve(msg.result)
    } else if (msg.method) {
      for (const fn of listeners) fn(msg)
    }
  })

  function send (method, params, sessionId) {
    const id = nextId++
    const payload = { id, method, params: params || {} }
    if (sessionId) payload.sessionId = sessionId
    ws.send(JSON.stringify(payload))
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject })
      setTimeout(() => {
        if (pending.has(id)) { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)) }
      }, opts.timeout || 60000)
    })
  }

  // one tab, one session
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  const call = (method, params) => send(method, params, sessionId)

  const console_ = { errors: [], warnings: [], logs: [], exceptions: [] }
  listeners.push(msg => {
    if (msg.sessionId !== sessionId) return
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = (msg.params.args || []).map(a =>
        a.value !== undefined ? String(a.value) : (a.description || a.type)).join(' ')
      if (msg.params.type === 'error') console_.errors.push(text)
      else if (msg.params.type === 'warning') console_.warnings.push(text)
      else console_.logs.push(text)
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails
      console_.exceptions.push(d.exception?.description || d.text || 'unknown exception')
    } else if (msg.method === 'Log.entryAdded') {
      const e = msg.params.entry
      if (e.level === 'error') console_.errors.push(`[${e.source}] ${e.text}`)
    }
  })

  await call('Runtime.enable')
  await call('Page.enable')
  await call('Log.enable')

  const page = {
    proc,
    ws,
    call,
    console: console_,

    async goto (url) {
      await call('Page.navigate', { url })
      await new Promise(r => setTimeout(r, 250))
      // wait for load
      for (let i = 0; i < 80; i++) {
        const st = await page.evaluate('document.readyState')
        if (st === 'complete') return
        await new Promise(r => setTimeout(r, 100))
      }
    },

    async evaluate (expr) {
      const r = await call('Runtime.evaluate', {
        expression: `(function(){ ${expr.includes('return') ? expr : 'return (' + expr + ')'} })()`,
        returnByValue: true,
        awaitPromise: true
      })
      if (r.exceptionDetails) {
        throw new Error('evaluate threw: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text))
      }
      return r.result?.value
    },

    async key (name, type = 'keyDown') {
      const K = KEYS[name]
      if (!K) throw new Error('unknown key ' + name)
      await call('Input.dispatchKeyEvent', {
        type,
        key: K.key,
        code: K.code,
        windowsVirtualKeyCode: K.vk,
        nativeVirtualKeyCode: K.vk,
        text: type === 'keyDown' && K.text ? K.text : undefined
      })
    },

    async press (name, ms = 40) {
      await page.key(name, 'keyDown')
      await new Promise(r => setTimeout(r, ms))
      await page.key(name, 'keyUp')
    },

    async hold (names, ms) {
      for (const n of names) await page.key(n, 'keyDown')
      await new Promise(r => setTimeout(r, ms))
      for (const n of names) await page.key(n, 'keyUp')
    },

    async click (x, y) {
      for (const type of ['mousePressed', 'mouseReleased']) {
        await call('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 })
      }
    },

    async screenshot (file, clip) {
      const r = await call('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: !!clip })
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, Buffer.from(r.data, 'base64'))
      return file
    },

    async wait (ms) { return new Promise(r => setTimeout(r, ms)) },

    async close () {
      try { ws.close() } catch {}
      try { proc.kill('SIGKILL') } catch {}
      try { fs.rmSync(userDir, { recursive: true, force: true }) } catch {}
    }
  }

  await call('Emulation.setDeviceMetricsOverride', {
    width: opts.width || 1280, height: opts.height || 720, deviceScaleFactor: 1, mobile: false
  }).catch(() => {})

  return page
}

const KEYS = {
  w: { key: 'w', code: 'KeyW', vk: 87, text: 'w' },
  a: { key: 'a', code: 'KeyA', vk: 65, text: 'a' },
  s: { key: 's', code: 'KeyS', vk: 83, text: 's' },
  d: { key: 'd', code: 'KeyD', vk: 68, text: 'd' },
  e: { key: 'e', code: 'KeyE', vk: 69, text: 'e' },
  q: { key: 'q', code: 'KeyQ', vk: 81, text: 'q' },
  r: { key: 'r', code: 'KeyR', vk: 82, text: 'r' },
  m: { key: 'm', code: 'KeyM', vk: 77, text: 'm' },
  up: { key: 'ArrowUp', code: 'ArrowUp', vk: 38 },
  down: { key: 'ArrowDown', code: 'ArrowDown', vk: 40 },
  left: { key: 'ArrowLeft', code: 'ArrowLeft', vk: 37 },
  right: { key: 'ArrowRight', code: 'ArrowRight', vk: 39 },
  space: { key: ' ', code: 'Space', vk: 32, text: ' ' },
  enter: { key: 'Enter', code: 'Enter', vk: 13, text: '\r' },
  escape: { key: 'Escape', code: 'Escape', vk: 27 },
  tab: { key: 'Tab', code: 'Tab', vk: 9 },
  shift: { key: 'Shift', code: 'ShiftLeft', vk: 16 },
  backspace: { key: 'Backspace', code: 'Backspace', vk: 8 }
}

export { KEYS }

if (import.meta.url === `file://${process.argv[1]}`) {
  const page = await launch()
  await page.goto('file://' + path.join(ROOT, 'index.html'))
  console.log('title:', await page.evaluate('document.title'))
  console.log('IS present:', await page.evaluate('typeof window.IS'))
  console.log('console errors:', page.console.errors.length, page.console.errors.slice(0, 3))
  await page.close()
}
