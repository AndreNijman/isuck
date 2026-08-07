;(function (IS) {
  'use strict'

  var ui = IS.ui = IS.ui || {}
  var C = ui.colours = { ink:'#211916', paper:'#d9c7a3', paper2:'#bda77e', blood:'#8f2024', bone:'#eee0bd', ash:'#766b60', stone:'#302a28', dark:'#171314' }
  var mouseWasDown = false

  function input () { return IS.input || {} }
  function pressed (name) { var i=input(); return !!(i.pressed && i.pressed(name)) }
  function pointer () { return input().mouse || { x:-1, y:-1, down:false } }
  function hit (r, p) { return p.x >= r.x && p.y >= r.y && p.x <= r.x+r.w && p.y <= r.y+r.h }
  function click () { var p=pointer(), v=p.down && !mouseWasDown; mouseWasDown=!!p.down; return v }
  function sound (name) { if (IS.audio && IS.audio.play) IS.audio.play(name) }

  ui.begin = function () { ui.clicked = click(); ui.pointer = pointer() }
  ui.end = function () {}
  ui.layout = function (g) {
    var w=(g&&g.canvas&&g.canvas.width)||IS.LOGICAL_W||1280, h=(g&&g.canvas&&g.canvas.height)||IS.LOGICAL_H||720
    var u=Math.min(w/1280,h/720)
    return { w:w,h:h,u:u,cx:w/2,cy:h/2,x:function(n){return n*u},y:function(n){return n*u},rect:function(x,y,rw,rh){return{x:x*u,y:y*u,w:rw*u,h:rh*u}} }
  }
  ui.text = function (g, str, x, y, o) {
    if (!g) return; o=o||{}; var size=o.size||22
    g.save(); g.font=(o.weight||'normal')+' '+size+'px "Courier New", monospace'; g.textAlign=o.align||'left'; g.textBaseline=o.baseline||'middle'
    g.fillStyle=o.colour||C.bone
    if(o.shadow!==false){g.shadowColor=o.shadowColour||C.dark;g.shadowBlur=o.shadowBlur||0;g.shadowOffsetX=2;g.shadowOffsetY=2}
    var s=String(str==null?'':str); if(o.maxWidth) g.fillText(s,x,y,o.maxWidth); else g.fillText(s,x,y)
    g.restore()
  }
  ui.panel = function (g,x,y,w,h,o) {
    if(!g)return;o=o||{};g.save();g.fillStyle=o.fill||C.paper;g.strokeStyle=o.border||C.ink;g.lineWidth=o.line||4
    g.beginPath();g.moveTo(x+5,y);g.lineTo(x+w-7,y+2);g.lineTo(x+w,y+h-6);g.lineTo(x+3,y+h);g.closePath();g.fill();g.stroke()
    g.globalAlpha=.13;g.strokeStyle=C.ink;for(var i=14;i<h;i+=19){g.beginPath();g.moveTo(x+8,y+i);g.lineTo(x+w-9,y+i+((i%3)-1)*2);g.stroke()}g.restore()
  }
  ui.menuItem = function (g,label,r,o) {
    o=o||{};var hover=hit(r,ui.pointer||pointer()), active=!!o.selected||hover
    g.save();if(active){g.fillStyle=o.disabled?'#6d6257':C.blood;g.fillRect(r.x,r.y,r.w,r.h);g.strokeStyle=C.ink;g.lineWidth=3;g.strokeRect(r.x+2,r.y+2,r.w-4,r.h-4)}
    ui.text(g,(active?'› ':'  ')+label,r.x+16,r.y+r.h/2,{size:o.size||22,colour:o.disabled?C.ash:(active?C.bone:C.ink),weight:active?'bold':'normal',maxWidth:r.w-24})
    g.restore();return hover
  }
  ui.button = ui.menuItem
  ui.menu = function (state, items, opts) {
    opts=opts||{};state=state||{};items=items||[];if(state.cursor==null)state.cursor=0
    var moved=0;if(pressed('up')||pressed('left'))moved=-1;if(pressed('down')||pressed('right'))moved=1
    if(moved&&items.length){var start=state.cursor;do{state.cursor=(state.cursor+moved+items.length)%items.length}while(items[state.cursor]&&items[state.cursor].disabled&&state.cursor!==start);sound('menu-move')}
    if(opts.rects){for(var i=0;i<opts.rects.length;i++)if(hit(opts.rects[i],ui.pointer||pointer()))state.cursor=i}
    var choose=pressed('confirm')||(ui.clicked&&opts.rects&&opts.rects[state.cursor]&&hit(opts.rects[state.cursor],ui.pointer||pointer()))
    if(choose&&items[state.cursor]&&!items[state.cursor].disabled){sound('menu-select');return state.cursor}return -1
  }
  ui.scroller = function (state,total,visible) { state=state||{};visible=Math.max(1,visible||8);state.cursor=Math.max(0,Math.min(total-1,state.cursor||0));if(state.cursor<state.scroll)state.scroll=state.cursor;if(state.cursor>=(state.scroll||0)+visible)state.scroll=state.cursor-visible+1;state.scroll=Math.max(0,Math.min(Math.max(0,total-visible),state.scroll||0));return state }
  ui.grid = function (index,cols,x,y,cw,ch) { return {x:x+(index%cols)*cw,y:y+Math.floor(index/cols)*ch,w:cw,h:ch} }
  ui.slider = function (g,label,r,value,selected) { value=Math.max(0,Math.min(1,+value||0));ui.text(g,label,r.x,r.y+12,{size:18,colour:selected?C.blood:C.ink});g.fillStyle=C.ash;g.fillRect(r.x,r.y+30,r.w,8);g.fillStyle=C.blood;g.fillRect(r.x,r.y+30,r.w*value,8);g.fillStyle=C.bone;g.strokeStyle=C.ink;g.fillRect(r.x+r.w*value-7,r.y+23,14,22);g.strokeRect(r.x+r.w*value-7,r.y+23,14,22);return value }
  ui.tabs = function (g,tabs,current,r) { var w=r.w/Math.max(1,tabs.length);for(var i=0;i<tabs.length;i++){var q={x:r.x+i*w,y:r.y,w:w,h:r.h};ui.menuItem(g,tabs[i],q,{selected:i===current,size:16})}return current }
  ui.modal = function (g,title,body,yes,state) { var l=ui.layout(g),r={x:l.cx-260*l.u,y:l.cy-130*l.u,w:520*l.u,h:260*l.u};ui.panel(g,r.x,r.y,r.w,r.h);ui.text(g,title,l.cx,r.y+45*l.u,{align:'center',size:28*l.u,weight:'bold',colour:C.blood});ui.text(g,body,l.cx,r.y+100*l.u,{align:'center',size:17*l.u,colour:C.ink,maxWidth:r.w-40*l.u});ui.text(g,(state&&state.cursor?'  NO  ':'[ YES ]')+(state&&state.cursor?'[ NO ]':'  NO  '),l.cx,r.y+190*l.u,{align:'center',size:20*l.u,colour:C.ink});return yes }
  ui.marquee = function (g,str,x,y,w,o) { o=o||{};var size=o.size||18,limit=Math.max(4,Math.floor(w/(size*.62))),s=String(str||'');if(s.length>limit){var n=Math.floor(((o.time||0)*5)%(s.length+6));s=(s+'      '+s).slice(n,n+limit)}ui.text(g,s,x,y,Object.assign({},o,{size:size,maxWidth:w})) }
  ui.drawSprite = function(g,name,x,y,size,t){if(IS.drawSprite){IS.drawSprite(g,name,x,y,size,t||0);return true}return false}
  ui.cancelled = function(){return pressed('cancel')||pressed('pause')}
})(typeof window !== 'undefined' ? (window.IS=window.IS||{}) : (globalThis.IS=globalThis.IS||{}))
