;(function (IS) {
  'use strict'
  const ACTIONS = ['up','down','left','right','shootUp','shootDown','shootLeft','shootRight','bomb','use','pocket','pocketSwap','drop','map','pause','confirm','cancel','restart']
  const defaults = { up:['KeyW'],down:['KeyS'],left:['KeyA'],right:['KeyD'],shootUp:['ArrowUp'],shootDown:['ArrowDown'],shootLeft:['ArrowLeft'],shootRight:['ArrowRight'],bomb:['KeyE'],use:['Space'],pocket:['KeyQ'],pocketSwap:['KeyZ'],drop:['ShiftLeft','ShiftRight'],map:['Tab'],pause:['Escape'],confirm:['Enter'],cancel:['Backspace'],restart:['KeyR'] }
  const held = new Set(); const press = new Set(); const release = new Set()
  const input = IS.input = { ACTIONS, bindings: defaults, mouse: { x:0,y:0,down:false,world:{x:0,y:0} }, gamepad: false,
    init (canvas) { if (this._ready || typeof window === 'undefined') return; this._ready = true; const action = code => ACTIONS.find(a => this.bindings[a].includes(code)); addEventListener('keydown', e => { const a = action(e.code); if (a) { if (!held.has(a)) press.add(a); held.add(a); e.preventDefault() } }); addEventListener('keyup', e => { const a = action(e.code); if (a) { held.delete(a); release.add(a); e.preventDefault() } }); if (canvas) { const pos = e => { const r=canvas.getBoundingClientRect(); this.mouse.x=(e.clientX-r.left)*canvas.width/r.width; this.mouse.y=(e.clientY-r.top)*canvas.height/r.height }; canvas.addEventListener('mousemove',pos); canvas.addEventListener('mousedown',e=>{pos(e);this.mouse.down=true}); addEventListener('mouseup',()=>{this.mouse.down=false}) } },
    update () { press.clear(); release.clear(); const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : []; this.gamepad = !!(pads && pads[0]) },
    down:a=>held.has(a), pressed:a=>press.has(a), released:a=>release.has(a), consume:a=>press.delete(a), anyPressed:()=>press.size>0,
    move () { return IS.norm((held.has('right')?1:0)-(held.has('left')?1:0),(held.has('down')?1:0)-(held.has('up')?1:0)) },
    shoot () { return IS.norm((held.has('shootRight')?1:0)-(held.has('shootLeft')?1:0),(held.has('shootDown')?1:0)-(held.has('shootUp')?1:0)) },
    rebind (a, code) { if (ACTIONS.includes(a) && code) this.bindings[a] = [code] }
  }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
