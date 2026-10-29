;(function(IS){'use strict'
  function screen(def){return Object.assign({enter:function(){},exit:function(){},key:function(){}},def)}
  function R(u,x,y,w,h){return{x:x*u,y:y*u,w:w*u,h:h*u}}
  function ink(g,u,fn){g.save();g.scale(u,u);fn();g.restore()}
  function anyInput(){var i=IS.input||{};return !!((i.anyPressed&&i.anyPressed())||(i.mouse&&i.mouse.down))}
  function slotSave(){return IS.slots}

  // ---- title: the cellar hatch cover, hand-lettered logo, blinking prompt
  var title={t:0,armed:false}
  IS.defineScreen('title',screen({enter:function(){title.t=0;title.armed=false},update:function(dt){title.t+=dt;if(title.t<.25)return;if(anyInput()&&!title.armed){title.armed=true;if(IS.audio&&IS.audio.resume)IS.audio.resume();IS.go(IS.slots?'slots':'menu')}},draw:function(g){var l=IS.ui.layout(g),u=l.u
    if(IS.scenes)IS.scenes.title(g,l,title.t,{charId:'isaac'});else{g.fillStyle='#171314';g.fillRect(0,0,l.w,l.h)}
    var vg=g.createRadialGradient(l.cx,l.cy,l.h*.3,l.cx,l.cy,l.w*.62);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.72)');g.fillStyle=vg;g.fillRect(0,0,l.w,l.h)
    IS.ui.title(g,'ISUCK',l.cx,150*u,150*u,{align:'center',colour:'#a3262b',rot:-.03,outline:18*u})
    IS.ui.text(g,'A  B A S E M E N T  R O G U E L I K E',l.cx,248*u,{align:'center',size:19*u,colour:'#eee0bd',shadowBlur:6*u})
    var b=IS.reduceMotion?1:.55+.45*Math.sin(title.t*3.2)
    g.save();g.globalAlpha=b;IS.ui.title(g,'PRESS START',l.cx,672*u,34*u,{align:'center',colour:'#eee0bd',outline:8*u});g.restore()
    IS.ui.text(g,'v'+(IS.VERSION||'0.1.0'),l.w-18*u,l.h-15*u,{align:'right',size:13*u,colour:'#766b60',shadow:false})}}))

  // ---- save slots: three paper cards
  var sl={cursor:0,rects:[],confirm:-1}
  IS.defineScreen('slots',screen({enter:function(){var S=slotSave();sl.cursor=S&&S.store.last>=0?S.store.last:0;sl.confirm=-1},update:function(){var S=slotSave();if(!S)return IS.go('menu')
    if(IS.input.pressed('cancel')||IS.input.pressed('pause')){if(sl.confirm>=0)sl.confirm=-1;else IS.go('title');return}
    if(IS.input.pressed('restart')&&S.info(sl.cursor)){if(sl.confirm===sl.cursor){S.erase(sl.cursor);sl.confirm=-1}else sl.confirm=sl.cursor;return}
    var prev=sl.cursor,n=IS.ui.menu(sl,[{},{},{}],{rects:sl.rects});if(sl.cursor!==prev)sl.confirm=-1
    if(n>=0){S.choose(n);IS.go('menu')}},
  draw:function(g){var l=IS.ui.layout(g),u=l.u,S=slotSave();IS.ui.begin();IS.ui.table(g,l)
    IS.ui.title(g,'CHOOSE A PAGE',l.cx,85*u,56*u,{align:'center',colour:'#eee0bd',ink:'#150b0c'})
    sl.rects=[]
    for(var i=0;i<3;i++){var x=105+i*370,y=150+(i===sl.cursor?-10:6),r=R(u,x,y,330,430);sl.rects.push(R(u,x,150,330,430))
      IS.ui.panel(g,r.x,r.y,r.w,r.h,{seed:i*31+5,rot:(i-1)*.014,line:i===sl.cursor?5:3})
      var f=S&&S.info(i),cx=(x+165)*u
      IS.ui.title(g,'No. '+(i+1),cx,(y+55)*u,40*u,{align:'center',colour:'#8f2024'})
      if(i===sl.cursor){g.save();g.strokeStyle='#8f2024';g.lineWidth=4*u;g.beginPath();g.moveTo((x+40)*u,(y+82)*u);g.bezierCurveTo((x+120)*u,(y+92)*u,(x+210)*u,(y+74)*u,(x+290)*u,(y+84)*u);g.stroke();g.restore()}
      if(!f||f.empty){if(IS.scenes){g.save();g.globalAlpha=.3;IS.scenes.hatchDoodle(g,cx,(y+345)*u,.5*u,0);g.restore()}IS.ui.text(g,'EMPTY',cx,(y+190)*u,{align:'center',size:30*u,weight:'bold',colour:'#766b60',shadow:false});IS.ui.text(g,'start a new story',cx,(y+230)*u,{align:'center',size:16*u,colour:'#766b60',shadow:false})}
      else{if(IS.scenes)IS.scenes.hatchDoodle(g,cx,(y+170)*u,.5*u,IS.state.time);var rows=[['MARKS',f.marks],['ITEMS SEEN',f.items],['UNLOCKS',f.unlocks],['BEST STREAK',f.streak]]
        for(var k=0;k<rows.length;k++){IS.ui.text(g,rows[k][0],(x+40)*u,(y+250+k*30)*u,{size:15*u,colour:'#211916',shadow:false});IS.ui.text(g,String(rows[k][1]),(x+290)*u,(y+250+k*30)*u,{align:'right',size:18*u,weight:'bold',colour:'#8f2024',shadow:false})}
        if(f.hasRun)IS.ui.text(g,'RUN IN PROGRESS',cx,(y+392)*u,{align:'center',size:14*u,colour:'#40633d',weight:'bold',shadow:false})}
      if(sl.confirm===i)IS.ui.text(g,'R AGAIN TO ERASE',cx,(y+412)*u,{align:'center',size:15*u,colour:'#8f2024',weight:'bold',shadow:false})}
    IS.ui.text(g,'ENTER  select      R  erase      ESC  back',l.cx,660*u,{align:'center',size:16*u,colour:'#d9c7a3'})
    IS.ui.end()}}))

  // ---- main menu: a drawn paper page
  var menu={cursor:0,rects:[],t:0}, labels=['New Run','Continue','Challenges','Collection','Bestiary','Stats','Secrets','Options','Controls']
  function hasRun(){return !!(IS.save&&IS.save.hasRun&&IS.save.hasRun())}
  IS.defineScreen('menu',screen({enter:function(){menu.cursor=0;menu.t=0},update:function(dt){menu.t+=dt||0;var entries=labels.map(function(x){return{disabled:x==='Continue'&&!hasRun()}})
    if(entries[menu.cursor]&&entries[menu.cursor].disabled&&menu.cursor===1)menu.cursor=0
    if(IS.input.pressed('cancel')&&IS.slots)return IS.go('slots')
    var n=IS.ui.menu(menu,entries,{rects:menu.rects});if(n<0)return;var routes=['char-select','game','challenge-select','collection','bestiary','stats','secrets','options','controls'];if(n===1){var snap=IS.save.takeRun&&IS.save.takeRun();IS.startRun(snap||{})}else IS.go(routes[n])},
  draw:function(g){IS.ui.begin();var l=IS.ui.layout(g),u=l.u;IS.ui.table(g,l)
    IS.ui.panel(g,60*u,40*u,500*u,640*u,{seed:11,rot:-.012})
    IS.ui.title(g,'ISUCK',310*u,112*u,86*u,{align:'center',colour:'#8f2024',rot:-.02})
    g.save();g.strokeStyle='#211916';g.lineWidth=3*u;g.beginPath();g.moveTo(130*u,160*u);g.bezierCurveTo(230*u,170*u,380*u,150*u,490*u,162*u);g.stroke();g.restore()
    menu.rects=[];for(var i=0;i<labels.length;i++){var r={x:100*u,y:(185+i*53)*u,w:420*u,h:46*u};menu.rects.push(r);IS.ui.menuItem(g,labels[i],r,{selected:i===menu.cursor,disabled:i===1&&!hasRun(),size:22*u})}
    // right page: the hatch sketch, taped
    IS.ui.panel(g,640*u,70*u,570*u,400*u,{seed:23,rot:.015})
    if(IS.scenes)IS.scenes.hatchDoodle(g,925*u,290*u,1.4*u,menu.t)
    IS.ui.title(g,'down we go',925*u,125*u,34*u,{align:'center',colour:'#211916',outline:0})
    var st=(IS.save&&IS.save.data&&IS.save.data.stats)||{},marks=0,gl=(IS.save&&IS.save.data&&IS.save.data.goals)||{};for(var k in gl)marks+=Object.keys(gl[k]||{}).length
    IS.ui.panel(g,700*u,510*u,450*u,130*u,{seed:3,rot:-.01,tape:false})
    IS.ui.text(g,'STREAK',740*u,552*u,{size:18*u,colour:'#211916',shadow:false});IS.ui.text(g,String(st.streak||0),1110*u,552*u,{align:'right',size:26*u,weight:'bold',colour:'#8f2024',shadow:false})
    IS.ui.text(g,'MARKS',740*u,598*u,{size:18*u,colour:'#211916',shadow:false});IS.ui.text(g,String(marks),1110*u,598*u,{align:'right',size:26*u,weight:'bold',colour:'#8f2024',shadow:false})
    IS.ui.end()}}))
})(typeof window!=='undefined'?(window.IS=window.IS||{}):(globalThis.IS=globalThis.IS||{}))
