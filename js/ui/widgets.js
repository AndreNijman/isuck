;(function (IS) {
  'use strict'

  var ui = IS.ui = IS.ui || {}
  var C = ui.colours = { ink:'#211916', paper:'#d9c7a3', paper2:'#bda77e', blood:'#8f2024', bone:'#eee0bd', ash:'#766b60', stone:'#302a28', dark:'#171314' }
  var mouseWasDown = false

  function input () { return IS.input || {} }
  function pressed (name) { var i=input(); return !!(i.pressed && i.pressed(name)) }
  // menus answer to the arrow keys as well as WASD (arrows are the shoot keys in play)
  var ARROW={up:'shootUp',down:'shootDown',left:'shootLeft',right:'shootRight'}
  function nav (name) { return pressed(name) || (!!ARROW[name] && pressed(ARROW[name])) }
  ui.nav = nav
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
    var col=String(o.colour||C.bone),dk=/^#[0-9a-f]{6}$/i.test(col)&&(parseInt(col.slice(1,3),16)*.3+parseInt(col.slice(3,5),16)*.59+parseInt(col.slice(5,7),16)*.11)<110
    if(o.shadow!==false&&!(dk&&o.shadow===undefined)){g.shadowColor=o.shadowColour||C.dark;g.shadowBlur=o.shadowBlur||0;g.shadowOffsetX=2;g.shadowOffsetY=2}
    var s=String(str==null?'':str); if(o.maxWidth) g.fillText(s,x,y,o.maxWidth); else g.fillText(s,x,y)
    g.restore()
  }
  var HAND = 'Georgia, "Times New Roman", serif'
  // paper pages: torn card with tape, shared look for every screen (IS.hudKit.paper does the drawing)
  ui.panel = function (g,x,y,w,h,o) {
    if(!g)return;o=o||{}
    if(IS.hudKit){IS.hudKit.paper(g,x,y,w,h,{seed:o.seed||((x*7+y*13+w)|0),rot:o.rot==null?-.004:o.rot,fill:o.fill,line:o.line||3.5});if(o.tape!==false){g.save();g.fillStyle='rgba(205,185,135,.7)';g.translate(x+w*.12,y+3);g.rotate(-.45);g.fillRect(-20,-8,40,16);g.restore();g.save();g.fillStyle='rgba(205,185,135,.7)';g.translate(x+w*.88,y+3);g.rotate(.5);g.fillRect(-20,-8,40,16);g.restore()}return}
    g.save();g.fillStyle=o.fill||C.paper;g.strokeStyle=C.ink;g.lineWidth=4;g.fillRect(x,y,w,h);g.strokeRect(x,y,w,h);g.restore()
  }
  // dark table the pages lie on, cached per size
  var tableCache=null,tableKey=''
  ui.table = function (g,l) {
    var k=l.w+'x'+l.h
    if(typeof document!=='undefined'&&(!tableCache||tableKey!==k)){tableCache=document.createElement('canvas');tableCache.width=l.w;tableCache.height=l.h;tableKey=k;var t=tableCache.getContext('2d'),u=l.u
      t.fillStyle='#1d1512';t.fillRect(0,0,l.w,l.h)
      for(var i=0;i<14;i++){var y=i*l.h/14;t.fillStyle=i%2?'rgba(60,38,26,.35)':'rgba(10,6,4,.3)';t.fillRect(0,y,l.w,l.h/14);t.fillStyle='rgba(0,0,0,.5)';t.fillRect(0,y,l.w,2*u)}
      for(i=0;i<70;i++){var x=((Math.sin(i*91.3)+1)/2)*l.w,yy=((Math.sin(i*37.7+2)+1)/2)*l.h;t.strokeStyle='rgba(15,9,6,.5)';t.lineWidth=1.5*u;t.beginPath();t.moveTo(x,yy);t.bezierCurveTo(x+40*u,yy-4*u,x+80*u,yy+5*u,x+150*u,yy);t.stroke()}
      var gr=t.createRadialGradient(l.cx,l.cy,l.h*.25,l.cx,l.cy,l.w*.62);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.7)');t.fillStyle=gr;t.fillRect(0,0,l.w,l.h)}
    if(tableCache)g.drawImage(tableCache,0,0);else{g.fillStyle='#1d1512';g.fillRect(0,0,l.w,l.h)}
  }
  // house lettering: fat serif capitals with a heavy ink outline
  ui.title = function (g,str,x,y,size,o) {
    o=o||{};if(IS.hudKit){IS.hudKit.text(g,str,x,y,size,{align:o.align||'left',colour:o.colour||C.blood,ink:o.ink||C.ink,rot:o.rot,outline:o.outline==null?Math.max(4,size*.16):o.outline,font:HAND,maxWidth:o.maxWidth});return}
    ui.text(g,str,x,y,{size:size,weight:'bold',colour:o.colour||C.blood,align:o.align})
  }
  // marker highlight under the chosen entry, with a small inked pointer
  function marker(g,r,seed,colour){g.save();g.fillStyle=colour;g.beginPath();var n=10,i,x,y;for(i=0;i<=n;i++){x=r.x+r.w*i/n;y=r.y+2+Math.sin(seed+i*1.7)*2;i?g.lineTo(x,y):g.moveTo(x,y)}for(i=n;i>=0;i--){x=r.x+r.w*i/n;y=r.y+r.h-2+Math.sin(seed*1.3+i*2.1)*2;g.lineTo(x,y)}g.closePath();g.fill();g.lineWidth=3;g.strokeStyle=C.ink;g.lineJoin='round';g.stroke();g.restore()}
  ui.menuItem = function (g,label,r,o) {
    o=o||{};var hover=hit(r,ui.pointer||pointer()), active=!!o.selected||hover, size=o.size||22
    g.save();if(active)marker(g,r,r.x*.01+r.y*.02,o.disabled?'#6d6257':C.blood)
    ui.text(g,label,r.x+(active?30:18),r.y+r.h/2,{size:size,colour:o.disabled?C.ash:(active?C.bone:(o.colour||C.ink)),weight:active?'bold':'normal',maxWidth:r.w-(active?44:30),shadow:false})
    if(active){g.fillStyle=C.bone;g.strokeStyle=C.ink;g.lineWidth=2;var cx=r.x+14,cy=r.y+r.h/2;g.beginPath();g.moveTo(cx-6,cy-size*.3);g.lineTo(cx+6,cy);g.lineTo(cx-6,cy+size*.3);g.closePath();g.fill();g.stroke()}
    g.restore();return hover
  }
  ui.button = ui.menuItem
  ui.menu = function (state, items, opts) {
    opts=opts||{};state=state||{};items=items||[];if(state.cursor==null)state.cursor=0
    var moved=0;if(nav('up')||nav('left'))moved=-1;if(nav('down')||nav('right'))moved=1
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
