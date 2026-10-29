;(function(IS){'use strict'
  function base(){return{cursor:0,rects:[],enter:function(){this.cursor=0},exit:function(){},key:function(){}}}
  function unlocked(d){return !d.unlock||(IS.save&&(IS.save.unlocked(d.unlock)||IS.save.unlocked(d.id)))}
  function sprite(g,name,x,y,s){if(!IS.ui.drawSprite(g,name,x,y,s,IS.state.time)){g.fillStyle='#211916';g.beginPath();g.arc(x,y,s*.28,0,Math.PI*2);g.fill()}}
  // ---- character select: a rotating carousel of portraits under a spotlight
  var cs=base();cs.tab=0;cs.pos=0;cs.t=0;cs.hit=[]
  function roster(){return(IS.characters||[]).filter(function(c){return!!c.tainted===!!cs.tab})}
  function portrait(g,id,x,y,s,t,dim){
    g.save()
    if(IS.drawPortrait)IS.drawPortrait(g,id,x,y,s,{time:t,dim:dim})
    else sprite(g,'player:'+id,x,y,s)
    g.restore()
  }
  function glyph(g,kind,x,y,s){
    g.save();g.translate(x,y);g.scale(s/20,s/20);g.lineJoin='round';g.lineCap='round';g.strokeStyle='#150b0c';g.lineWidth=3
    if(kind==='damage'){g.fillStyle='#b5322d';g.beginPath();for(var i=0;i<16;i++){var a=i/16*6.283,r=i%2?5:11;g.lineTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();g.fill();g.stroke()}
    else if(kind==='tears'){g.fillStyle='#6fa8d8';g.beginPath();g.moveTo(0,-11);g.bezierCurveTo(10,0,9,10,0,10);g.bezierCurveTo(-9,10,-10,0,0,-11);g.fill();g.stroke()}
    else if(kind==='range'){g.fillStyle='#d8b45a';g.beginPath();g.moveTo(-11,0);g.lineTo(-4,-6);g.lineTo(-4,-2);g.lineTo(4,-2);g.lineTo(4,-6);g.lineTo(11,0);g.lineTo(4,6);g.lineTo(4,2);g.lineTo(-4,2);g.lineTo(-4,6);g.closePath();g.fill();g.stroke()}
    else if(kind==='speed'){g.fillStyle='#8bbf6a';g.beginPath();g.moveTo(-10,-8);g.lineTo(0,0);g.lineTo(-10,8);g.lineTo(-5,8);g.lineTo(5,0);g.lineTo(-5,-8);g.closePath();g.fill();g.stroke();g.beginPath();g.moveTo(1,-8);g.lineTo(11,0);g.lineTo(1,8);g.stroke()}
    else{g.fillStyle='#4f9a4f';for(var q=0;q<4;q++){g.beginPath();g.arc(Math.cos(q*1.571+.785)*5,Math.sin(q*1.571+.785)*5,5,0,6.283);g.fill();g.stroke()}g.beginPath();g.moveTo(0,2);g.lineTo(3,11);g.stroke()}
    g.restore()
  }
  function statFrac(n,v){v=+v||0;if(n==='damage')return v/6;if(n==='tears')return v/5;if(n==='range')return v/600;if(n==='speed')return v/1.5;return .1+v/6}
  function heartsRow(g,d,x,y,s){
    var hh=d.hearts||{},cells=[],i;for(i=0;i<(hh.maxRed||0)/2;i++)cells.push(['red',(hh.red||0)>=(i+1)*2?1:((hh.red||0)>i*2?.5:0)]);for(i=0;i<(hh.bone||0)/2;i++)cells.push(['bone',1]);for(i=0;i<Math.ceil((hh.soul||0)/2);i++)cells.push(['soul',(hh.soul-i*2)>=2?1:.5]);for(i=0;i<Math.ceil((hh.black||0)/2);i++)cells.push(['black',(hh.black-i*2)>=2?1:.5])
    if(!cells.length){IS.ui.text(g,'no hearts at all',x,y,{size:s*.7,colour:'#766b60',shadow:false});return}
    for(i=0;i<cells.length;i++)IS.hudKit.heart(g,cells[i][0],cells[i][1],x+s*.6+i*s*1.05,y,false,s)
  }
  cs.enter=function(){cs.cursor=0;cs.pos=0;cs.t=0;cs.tab=0}
  cs.update=function(dt){
    cs.t+=dt||0;var all=roster();
    if(IS.input.pressed&&IS.input.pressed('map')){cs.tab=1-cs.tab;cs.cursor=0;cs.pos=0;all=roster()}
    var n=IS.ui.menu(cs,all.map(function(c){return{}}));
    var d=all[cs.cursor];
    if(IS.ui.clicked&&cs.hit){var p=IS.ui.pointer||{x:-1,y:-1};for(var k=0;k<cs.hit.length;k++){var h=cs.hit[k];if(p.x>=h.x&&p.x<=h.x+h.w&&p.y>=h.y&&p.y<=h.y+h.h){if(h.i===cs.cursor)n=cs.cursor;else cs.cursor=h.i;break}}}
    cs.pos+=(cs.cursor-cs.pos)*Math.min(1,(dt||.016)*11);if(Math.abs(cs.cursor-cs.pos)<.002)cs.pos=cs.cursor
    d=all[cs.cursor]
    if(n>=0&&d&&unlocked(d))IS.startRun({charId:d.id})
    if(IS.input.pressed&&IS.input.pressed('pocket')&&d&&unlocked(d))IS.go('seed-entry',{charId:d.id})
    if(IS.ui.cancelled())IS.go('menu')
  }
  cs.draw=function(g){
    IS.ui.begin();var l=IS.ui.layout(g),u=l.u,all=roster(),t=IS.state.time||cs.t
    IS.ui.table(g,l)
    if(IS.scenes)IS.scenes.stage(g,l,l.cx,430*u,420*u,95*u)
    IS.ui.title(g,'CHOOSE YOUR WRETCH',l.cx,52*u,44*u,{align:'center',colour:'#eee0bd'})
    var tw=170*u;for(var tb=0;tb<2;tb++){var tr={x:l.cx-tw+tb*tw,y:84*u,w:tw,h:38*u};IS.ui.menuItem(g,tb?'TAINTED':'ORIGINAL',tr,{selected:cs.tab===tb,size:17*u,colour:'#d9c7a3'})}
    // carousel
    cs.hit=[];var order=[];for(var i=0;i<all.length;i++){var dd=i-cs.pos;if(Math.abs(dd)<3.2)order.push([Math.abs(dd),i])}order.sort(function(a,b){return b[0]-a[0]})
    for(var o=0;o<order.length;o++){var ix=order[o][1],c=all[ix],dist=ix-cs.pos,ad=Math.abs(dist),sc=Math.max(.35,1-ad*.28),px=l.cx+Math.sin(dist*.62)*470*u,py=(370-ad*16)*u,size=330*sc*u,ok=unlocked(c)
      g.save();g.globalAlpha=Math.max(.2,1-ad*.3)
      g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(px,py+size*.42,size*.32,size*.07,0,0,6.283);g.fill()
      if(ok)portrait(g,c.id,px,py,size,t+ix,ad>.5)
      else{g.save();g.globalAlpha=g.globalAlpha*.9;if(IS.drawPortrait)IS.drawPortrait(g,c.id,px,py,size,{time:t,locked:true});g.restore();g.fillStyle='rgba(8,5,4,.75)';g.beginPath();g.ellipse(px,py,size*.26,size*.38,0,0,6.283);g.fill();IS.ui.text(g,'?',px,py,{align:'center',size:size*.4,weight:'bold',colour:'#6d6257',shadow:false})}
      g.restore();cs.hit.push({i:ix,x:px-size*.32,y:py-size*.45,w:size*.64,h:size*.9})}
    var d=all[cs.cursor];if(!d){IS.ui.end();return}
    var ok=unlocked(d)
    // name plate
    IS.ui.panel(g,100*u,525*u,1080*u,160*u,{seed:19,rot:.006})
    IS.ui.title(g,ok?d.name:'LOCKED',130*u,572*u,44*u,{colour:'#8f2024'})
    if(ok){heartsRow(g,d,135*u,622*u,34*u)
      IS.ui.marquee(g,d.desc||d.special||'',130*u,660*u,470*u,{size:15*u,colour:'#211916',time:t,shadow:false})
      var names=['damage','tears','range','speed','luck'],stats=d.base||{}
      for(var j=0;j<names.length;j++){var sx=640*u,sy=(556+j*25)*u,fr=Math.max(.06,Math.min(1,statFrac(names[j],stats[names[j]])))
        glyph(g,names[j],sx+10*u,sy,18*u);IS.ui.text(g,names[j].toUpperCase(),sx+30*u,sy,{size:12*u,colour:'#211916',shadow:false})
        g.fillStyle='rgba(33,25,22,.25)';g.fillRect(sx+112*u,sy-5*u,170*u,10*u);g.fillStyle='#8f2024';g.fillRect(sx+112*u,sy-5*u,170*u*fr,10*u);g.strokeStyle='#211916';g.lineWidth=2*u;g.strokeRect(sx+112*u,sy-5*u,170*u,10*u)}
      var its=(d.items||[]).map(function(i){var it=IS.itemsById&&IS.itemsById[i];return it&&it.name||i}).concat(d.pAct?[d.pAct.name]:[]).join(', ')
      IS.ui.text(g,'STARTS WITH',945*u,556*u,{size:12*u,colour:'#766b60',shadow:false});IS.ui.text(g,its||'nothing',945*u,580*u,{size:14*u,colour:'#211916',maxWidth:215*u,shadow:false})
      var ni=(d.items||[]);for(var q=0;q<Math.min(4,ni.length);q++)IS.ui.drawSprite(g,'item:'+ni[q],(965+q*44)*u,630*u,38*u,t)
    }else IS.ui.text(g,d.unlockHint||String(d.unlock||'Unknown condition'),130*u,622*u,{size:17*u,colour:'#211916',maxWidth:1000*u,shadow:false})
    IS.ui.text(g,'← →  turn      ENTER  begin      TAB  tainted roster      Q  seed      ESC  back',l.cx,706*u,{align:'center',size:14*u,colour:'#d9c7a3'})
    IS.ui.end()
  }
  IS.defineScreen('char-select',cs)
  var ch=base();ch.update=function(){var a=IS.challenges||[],n=IS.ui.menu(ch,a.map(function(d){return{disabled:!unlocked(d)}}),{rects:ch.rects});if(n>=0){var d=a[n];IS.startRun({charId:d.charId||d.character||'isaac',challengeId:d.id})}if(IS.ui.cancelled())IS.go('menu')};ch.draw=function(g){IS.ui.begin();var l=IS.ui.layout(g),u=l.u,a=IS.challenges||[];IS.ui.table(g,l);IS.ui.panel(g,45*u,55*u,1190*u,610*u);IS.ui.text(g,'CHALLENGES',75*u,95*u,{size:32*u,weight:'bold',colour:'#8f2024'});ch.rects=[];var vis=IS.ui.scroller(ch,a.length,10);for(var i=vis.scroll;i<Math.min(a.length,vis.scroll+10);i++){var d=a[i],r={x:75*u,y:(125+(i-vis.scroll)*48)*u,w:520*u,h:44*u};ch.rects.push(r);IS.ui.menuItem(g,(i+1)+'. '+(unlocked(d)?d.name:'LOCKED'),r,{selected:i===ch.cursor,disabled:!unlocked(d),size:18*u})}var x=a[ch.cursor];if(x){IS.ui.text(g,unlocked(x)?x.name:'???',650*u,150*u,{size:28*u,weight:'bold',colour:'#211916'});IS.ui.text(g,unlocked(x)?(x.desc||''):(x.unlockHint||String(x.unlock||'')),650*u,205*u,{size:17*u,colour:'#211916',maxWidth:510*u});IS.ui.text(g,'GOAL: '+(x.goal||'mom'),650*u,275*u,{size:18*u,colour:'#8f2024'});IS.ui.text(g,'CHARACTER: '+(x.charId||x.character||'isaac'),650*u,315*u,{size:17*u,colour:'#211916'});IS.ui.text(g,'ITEMS: '+(x.items||[]).join(', '),650*u,365*u,{size:15*u,colour:'#211916',maxWidth:510*u});var done=IS.save&&IS.save.data&&IS.save.data.challengesDone;IS.ui.text(g,done&&done[x.id]?'COMPLETED ✓':'NOT YET COMPLETE',650*u,550*u,{size:18*u,colour:done&&done[x.id]?'#40633d':'#766b60'})}IS.ui.end()};IS.defineScreen('challenge-select',ch)
  var se=base();se.value='';se.args={};se.enter=function(a){se.args=a||{};se.value=IS.seedToString?IS.seedToString(IS.randomSeed()):''};se.update=function(){if(IS.input.pressed&&IS.input.pressed('restart'))se.value=IS.seedToString(IS.randomSeed());if(IS.input.pressed&&IS.input.pressed('confirm')){var n=IS.stringToSeed&&IS.stringToSeed(se.value);if(n!=null)IS.startRun({charId:se.args.charId,seed:n})}if(IS.ui.cancelled())IS.go('char-select')};se.key=function(e){if(!e)return;var k=e.key||'';if(/^[A-Za-z0-9]$/.test(k)&&se.value.length<8)se.value+=k.toUpperCase();if(k==='Backspace')se.value=se.value.slice(0,-1)};se.draw=function(g){var l=IS.ui.layout(g),u=l.u;IS.ui.table(g,l);IS.ui.panel(g,300*u,175*u,680*u,360*u);IS.ui.text(g,'ENTER SEED',l.cx,235*u,{align:'center',size:34*u,weight:'bold',colour:'#8f2024'});IS.ui.text(g,(se.value+'________').slice(0,8).split('').join(' '),l.cx,340*u,{align:'center',size:42*u,colour:'#211916'});IS.ui.text(g,'R: RANDOMISE  ·  ENTER: BEGIN',l.cx,425*u,{align:'center',size:17*u,colour:'#211916'});IS.ui.text(g,'Seeded runs use the normal progress path and count for unlocks.',l.cx,480*u,{align:'center',size:15*u,colour:'#766b60'})};IS.defineScreen('seed-entry',se)
})(typeof window!=='undefined'?(window.IS=window.IS||{}):(globalThis.IS=globalThis.IS||{}))
