;(function (IS) {
  'use strict'
  const put=(kind,o,ctx)=>{const r=ctx.room||ctx.run.room;(r[kind]||(r[kind]=[])).push(o);return o}
  const TEAR_Z=22 // tears fly at shoulder height and drop over the last stretch of their range
  IS.tearBaseOpts=p=>({x:p.x,y:p.y,vx:(p.head?.x||1)*IS.TEAR_SPEED*p.stats.shotSpeed,vy:(p.head?.y||0)*IS.TEAR_SPEED*p.stats.shotSpeed,dmg:p.stats.damage,r:8*p.stats.tearSize,flags:new Set(),life:p.stats.range/(IS.TEAR_SPEED*p.stats.shotSpeed),friendly:true,sprite:'tear'})
  IS.applyTearFlags=(t,p)=>{(p.tearFlags||[]).forEach(f=>t.flags.add(f));if(p.flags?.has('spectralTears'))t.flags.add('spectral');if(p.flags?.has('piercingTears'))t.flags.add('piercing');if(p.flags?.has('homingTears'))t.flags.add('homing');if(IS.hasItem&&IS.hasItem(p,'ipecac')){t.flags.add('explosive');t.lob=true;t.tint='#8fcf55'}if(t.flags.has('pop')){t.flags.add('bouncing');t.life=Math.max(t.life,8);t.life0=t.life;t.tint='#e8e0d0'}if(t.flags.has('bouncing'))t.bounce=t.flags.has('pop')?99:1;if(t.flags.has('boomerang'))t.boomerang=true;if(t.flags.has('wiggle')||t.flags.has('sinusoid'))t.wiggle=0;if(t.flags.has('tinyplanet')){t.orbit=Math.atan2(t.y-p.y,t.x-p.x);t.orbitR=p.r+30;t.life=Math.max(t.life,3);t.life0=t.life}return t}
  IS.spawnTear=(o,ctx)=>{const t=put('tears',Object.assign({x:0,y:0,vx:0,vy:0,dmg:3.5,r:8,flags:new Set(),life:2,friendly:true,sprite:'tear',height:0,falls:0,dead:false},o,{flags:o.flags instanceof Set?o.flags:new Set(o.flags||[])}),ctx);t.life0=t.life;t.z=TEAR_Z;return t}
  IS.spawnEnemyShot=(o,ctx)=>{if(o.angle!=null&&!o.vx&&!o.vy){const s=o.speed||260;o.vx=Math.cos(o.angle)*s;o.vy=Math.sin(o.angle)*s}const t=put('shots',Object.assign({x:0,y:0,vx:0,vy:0,dmg:1,r:9,flags:new Set(),life:4,friendly:false,dead:false},o,{flags:o.flags instanceof Set?o.flags:new Set(o.flags||[])}),ctx);t.life0=t.life;t.z=14;return t}
  IS.spawnBomb=(x,y,o,ctx)=>{const b=put('bombs',Object.assign({x,y,fuse:1.5,dmg:60,r:120,flags:new Set(),friendly:true,dead:false},o),ctx);b.fuse0=b.fuse;ctx.sfx&&ctx.sfx('bomb-fuse');return b}
  // Bombs hurt everything in the blast, the player included, as they should.
  IS.bombExplode=(x,y,o,ctx)=>{o=o||{};const room=ctx.room,R=o.r||120;IS.blastInteractables&&IS.blastInteractables(x,y,R,ctx);for(const e of IS.roomEnemies(room))if(IS.dist(x,y,e.x,e.y)<R+e.r){IS.damageEnemy(e,o.dmg||60,{src:o.src,flags:o.flags,silent:true},ctx);IS.knockback(e,x,y,e.boss?0:520)}for(const g of room.grid||[])if(IS.dist(x,y,g.x,g.y)<R)IS.destroyGrid(room,g,ctx);const p=ctx.player;if(p&&!p.dead&&!o.playerSafe&&!p.flags?.has('bombImmune')&&!p.flags?.has('pyromaniac')&&IS.dist(x,y,p.x,p.y)<R*.85+p.r){if(IS.damagePlayer(p,o.playerDmg||2,{name:'a bomb',kind:'bomb'},ctx))IS.knockback(p,x,y,700)}if(IS.fx){IS.fx.burst(x,y,'#f2b24a',22);IS.fx.ring(x,y,{colour:'#fff1c4',r0:20,r1:R*1.15,life:.3,width:8});IS.fx.decal&&IS.fx.decal(x,y,R*.55,'rgba(20,14,12,.6)');IS.fx.shake(9,.35);IS.fx.flash&&IS.fx.flash('rgba(255,236,190,.35)',.08)}ctx.sfx&&ctx.sfx('bomb-explode');if(o.friendly&&p)IS.fireHook(p,'onBombExplode',[Object.assign({x,y},o)],ctx);return true}
  IS.spawnLaser=(o,ctx)=>put('lasers',Object.assign({x:0,y:0,angle:0,len:600,dmg:3.5,width:12,life:.3,friendly:true,dead:false,hit:new Map()},o,{hit:new Map()}),ctx)
  // a friendly damaging puddle (Holy Water, Mysterious Liquid, Aquarius): hurts enemies standing in it every half second
  IS.spawnPuddle=(o,ctx)=>{const u=put('puddles',Object.assign({x:0,y:0,r:50,dmg:0,life:3,tick:0,status:[]},o),ctx);IS.fx?.creep&&IS.fx.creep(u.x,u.y,u.r,{life:u.life,colour:u.colour});return u}
  IS.spawnKnife=(o,ctx)=>put('knives',Object.assign({x:0,y:0,vx:0,vy:0,dmg:10,r:14,life:.6,friendly:true,dead:false},o),ctx)
  // Multishot patterns as in Isaac: The Inner Eye is a tight fan, Mutant Spider a
  // wide one, 20/20 two parallel tears, The Wiz two diagonals. Anything else fans.
  IS.shotAngles=(p,a)=>{const n=1+(p.stats.multishot||0),has=id=>IS.hasItem(p,id);if(has('the-wiz'))return [{a:a-Math.PI/4,o:0},{a:a+Math.PI/4,o:0}].concat(n>2?[{a,o:0}]:[]);if(n===1)return [{a,o:0}];if(n===2&&has('20-20'))return [{a,o:-14},{a,o:14}];const spread=has('mutant-spider')?.2:.11;const out=[];for(let i=0;i<n;i++)out.push({a:a+(i-(n-1)/2)*spread,o:0});return out}
  IS.firePlayerTears=(p,dir,ctx)=>{const base=IS.tearBaseOpts(p),s=IS.TEAR_SPEED*p.stats.shotSpeed,shots=IS.shotAngles(p,Math.atan2(dir.y,dir.x));
    // alternate eyes so a stream of tears doesn't read as one dotted line
    p.eye=-(p.eye||1)
    for(const sh of shots){const a=sh.a
      // a little of the player's own motion carries into the tear, as in Isaac
      const t=IS.spawnTear(Object.assign({},base,{vx:Math.cos(a)*s+(p.vx||0)*.3,vy:Math.sin(a)*s+(p.vy||0)*.3}),ctx)
      const off=shots.length===1?p.r*.35*p.eye:sh.o;t.x+=-Math.sin(a)*off;t.y+=Math.cos(a)*off;IS.applyTearFlags(t,p);IS.fireHook(p,'onTearFire',[t],ctx)}
    if(ctx.run&&ctx.run.stats)ctx.run.stats.tearsFired=(ctx.run.stats.tearsFired||0)+shots.length;p.recoil=.08;IS.audio?.sfx('tear-fire',{rate:.92+((ctx.run?.stats?.tearsFired||0)%4)*.05})}

  // ---- weapons -------------------------------------------------------------
  // Isaac's weapon-replacing items, in the game's priority order.
  IS.playerWeapon=p=>{const has=id=>IS.hasItem(p,id);return has('epic-fetus')?'epic':has('moms-knife')||p.flags.has('knife')?'knife':has('brimstone')||p.flags.has('brimstone')?'brimstone':has('dr-fetus')?'fetus':has('technology')||has('technology-2')||has('tech-x')||p.flags.has('laser')?'tech':has('the-ludovico-technique')?'ludo':'tears'}
  const cooldown=(p,held,dt,fn)=>{p.nextShot=(p.nextShot||0)-dt;if(held&&p.nextShot<=0){fn();p.nextShot=p.stats.fireDelay}else if(!held)p.nextShot=Math.max(0,p.nextShot)}
  const dirOf=(p,d)=>(d.x||d.y)?d:(p.head||{x:1,y:0})
  IS.updateWeapon=(p,d,dt,ctx)=>{const w=IS.playerWeapon(p),held=!!(d.x||d.y),room=ctx.room||ctx.run.room;p.weapon=w
    if(w!=='brimstone'&&w!=='knife')p.charge=0
    if(w==='tears')return cooldown(p,held,dt,()=>IS.firePlayerTears(p,d,ctx))
    if(w==='tech')return cooldown(p,held,dt,()=>{for(const sh of IS.shotAngles(p,Math.atan2(d.y,d.x)))ctx.spawnLaser({x:p.x,y:p.y-10,angle:sh.a,len:1500,width:9,life:.1,tick:.5,dmg:p.stats.damage,friendly:true});IS.audio?.sfx('laser-fire')})
    if(w==='fetus')return cooldown(p,held,dt,()=>{const v=IS.TEAR_SPEED*.85*p.stats.shotSpeed;for(const sh of IS.shotAngles(p,Math.atan2(d.y,d.x)))ctx.spawnBomb(p.x+Math.cos(sh.a)*p.r,p.y+Math.sin(sh.a)*p.r,{vx:Math.cos(sh.a)*v+p.vx*.3,vy:Math.sin(sh.a)*v+p.vy*.3,fuse:1.1,contact:true,dmg:p.stats.damage*5+30,r:100,friendly:true})})
    if(w==='brimstone'){
      if(p.beam&&p.beam.life>0&&(room.lasers||[]).includes(p.beam)){p.beam.x=p.x;p.beam.y=p.y-10;return}
      const full=Math.max(.3,p.stats.fireDelay*(IS.hasItem(p,'brimstone')?1:2.4))
      if(held){p.charge=Math.min(1,(p.charge||0)+dt/full);p.chargeDir=d;if(p.charge>=1&&!p.chargeReady){p.chargeReady=true;IS.audio?.sfx('charge-ready')}return}
      if(p.charge>=1){const a=Math.atan2(p.chargeDir.y,p.chargeDir.x),short=p.charId==='azazel'&&!IS.hasItem(p,'brimstone');for(const sh of IS.shotAngles(p,a)){p.beam=ctx.spawnLaser({x:p.x,y:p.y-10,angle:sh.a,len:short?p.stats.range*.9:1600,width:32,life:.8,tick:.06,dmg:p.stats.damage,friendly:true})}IS.audio?.sfx('brimstone-fire');IS.fx&&IS.fx.shake(3,.5)}
      p.charge=0;p.chargeReady=false;return}
    if(w==='knife'){const k=p.knife||(p.knife={state:'held',dist:0,charge:0,hit:new Map(),dx:1,dy:0})
      if(k.state==='held'){const v=dirOf(p,d);k.dx=v.x;k.dy=v.y;if(held){k.charge=Math.min(1,k.charge+dt/Math.max(.25,p.stats.fireDelay*1.5));p.charge=k.charge}else if(k.charge>.12){k.state='out';k.max=60+k.charge*p.stats.range*1.1;k.power=k.charge;k.charge=0;p.charge=0;IS.audio?.sfx('knife-throw')}else{k.charge=0;p.charge=0}}
      else if(k.state==='out'){k.dist+=1100*dt;if(k.dist>=k.max)k.state='back'}
      else{k.dist-=900*dt;if(k.dist<=0){k.dist=0;k.state='held';k.hit.clear()}}
      k.x=p.x+k.dx*(p.r+22+k.dist);k.y=p.y+k.dy*(p.r+22+k.dist);k.angle=Math.atan2(k.dy,k.dx)
      const dmg=p.stats.damage*(k.state==='held'?2:2+4*(k.power||0))
      for(const e of IS.roomEnemies(room)){if(IS.dist(k.x,k.y,e.x,e.y)>e.r+16)continue;const last=k.hit.get(e)||-9;if(room.time-last<(k.state==='held'?.25:.1))continue;k.hit.set(e,room.time);IS.damageEnemy(e,dmg,{src:{vx:k.dx*500,vy:k.dy*500}},ctx)}
      return}
    // Ludovico Technique: one big spectral tear that stays and drifts where the fire keys point, hurting what it overlaps
    if(w==='ludo'){let t=p.ludo;const live=t&&!t.dead&&(room.tears||[]).includes(t);if(!live){if(!held)return;t=p.ludo=IS.spawnTear({x:p.x+d.x*50,y:p.y+d.y*50,vx:0,vy:0,dmg:p.stats.damage,r:20*p.stats.tearSize,life:1e9,flags:new Set(['spectral','piercing','ludo'])},ctx);IS.applyTearFlags(t,p);t.ludoV=IS.TEAR_SPEED*.9;t.flags.add('ludo');IS.audio?.sfx('tear-fire')}
      const v=t.ludoV;t.vx=IS.approach(t.vx,d.x*v,v*5*dt);t.vy=IS.approach(t.vy,d.y*v,v*5*dt);t.dmg=p.stats.damage;t.hitT=(t.hitT||0)+dt;if(t.hitT>.25){t.hitT=0;t.hitSet=null}return}
    if(w==='epic'){p.missiles=p.missiles||[]
      if(held){const t=p.target||(p.target={x:p.x,y:p.y});t.x=IS.clamp(t.x+d.x*620*dt,0,room.pxW);t.y=IS.clamp(t.y+d.y*620*dt,0,room.pxH);p.nextShot=(p.nextShot||0)-dt;if(p.nextShot<=0){p.nextShot=Math.max(.8,p.stats.fireDelay*2.5);p.missiles.push({x:t.x,y:t.y,t:0,room});(room.markers||(room.markers=[])).push({x:t.x,y:t.y,r:70,t:0,dur:.55})}}
      else p.target=null
      for(const m of p.missiles){m.t+=dt;if(m.t>=.55&&!m.done){m.done=true;IS.bombExplode(m.x,m.y,{dmg:p.stats.damage*20,r:110},ctx)}}
      p.missiles=p.missiles.filter(m=>!m.done&&m.room===room)}
  }
  // Jacob's Ladder: the tear sparks to up to four other enemies near the one it hit, for half damage
  function chainArc(t,e,ctx){const room=ctx.room||ctx.run.room,near=[];for(const o of IS.roomEnemies(room)){if(o===e||o.dead||o.hidden)continue;const d=IS.dist(e.x,e.y,o.x,o.y);if(d<=260)near.push([d,o])}near.sort((a,b)=>a[0]-b[0]);const hit=near.slice(0,4);for(const [,o] of hit){IS.damageEnemy(o,t.dmg*.5,{silent:true},ctx);if(IS.fx)IS.fx.ring(o.x,o.y,{colour:'#8ad0f0',r0:3,r1:22,life:.18,width:2})}if(hit.length)(room.arcs||(room.arcs=[])).push({x:e.x,y:e.y,to:hit.map(n=>({x:n[1].x,y:n[1].y})),t:0})}
  // A beam of light falls from above: damages every enemy in a small circle
  IS.lightBeam=(x,y,dmg,ctx)=>{const room=ctx.room||ctx.run.room;for(const e of IS.roomEnemies(room))if(!e.hidden&&IS.dist(x,y,e.x,e.y)<55+e.r)IS.damageEnemy(e,dmg,{silent:true},ctx);(room.beams||(room.beams=[])).push({x,y,t:0});if(IS.fx)IS.fx.ring(x,y,{colour:'#fff2b0',r0:6,r1:55,life:.25,width:3})}
  IS.onTearImpact=(t,e,ctx)=>{for(const [f,st,secs] of [['poison','poison',3],['burn','burn',3],['slow','slow',2],['freeze','freeze',1],['charm','charm',3],['fear','fear',3],['confusion','confusion',3],['petrify','petrify',1.5],['ice','ice',1.2],['bleed','bleed',3],['shrink','shrink',3],['midas','midas',6],['magnetize','magnetize',3],['sticky','sticky',3],['baited','baited',4]])if(t.flags.has(f))IS.applyStatus(e,st,secs,ctx);if(t.flags.has('chain')&&!t.ladderSpark)chainArc(t,e,ctx);if(t.flags.has('holy')&&ctx.chance&&ctx.chance(.12+Math.max(0,ctx.player.stats.luck||0)*.03))IS.lightBeam(e.x,e.y,t.dmg*2,ctx);if(t.flags.has('knockback')&&!e.boss)IS.knockback(e,t.x-t.vx,t.y-t.vy,520);IS.fireHook(ctx.player,'onTearHit',[t,e],ctx);if(t.flags.has('explosive'))IS.bombExplode(t.x,t.y,{dmg:t.dmg+30,r:90,playerSafe:true},ctx);if(t.flags.has('splitting')&&!t.split)splitTear(t,ctx)}
  // Cricket's Body and friends: the tear bursts into four quarter-size tears
  function splitTear(t,ctx){const a=Math.atan2(t.vy,t.vx);for(let i=0;i<4;i++){const q=a+Math.PI/4+i*Math.PI/2,s=IS.len(t.vx,t.vy)*.8;const c=IS.spawnTear({x:t.x,y:t.y,vx:Math.cos(q)*s,vy:Math.sin(q)*s,dmg:t.dmg*.5,r:t.r*.6,life:.35,flags:new Set([...t.flags].filter(f=>f!=='splitting'))},ctx);c.split=true}}
  const splash=(p,ctx,col)=>{if(IS.fx){IS.fx.particles({x:p.x,y:p.y-(p.z||0)*.5,n:5,colour:col,speed:120,life:.22,size:3.5,drag:4});IS.fx.ring(p.x,p.y-(p.z||0)*.5,{colour:col,r0:3,r1:p.r*2.2,life:.16,width:2})}}
  // Tears chip poop, fire and TNT; rocks only stop them.
  function hitGrid(p,room,ctx){if(p.flags.has('spectral'))return false;const T=IS.TILE,col=Math.floor(p.x/T),row=Math.floor(p.y/T);if(!IS.solidAt(room,p.x,p.y,{ignorePits:true}))return false;const g=IS.gridAt(room,col,row);if(g&&p.friendly&&g.destructible&&!g.bombOnly&&!g.rockFamily&&g.hp>0){g.hp-=1;g.hurtT=.1;if(g.hp<=0)IS.destroyGrid(room,g,ctx)}return true}
  const segDist=(l,x,y)=>{const dx=Math.cos(l.angle),dy=Math.sin(l.angle),t=IS.clamp((x-l.x)*dx+(y-l.y)*dy,0,l.len);return IS.dist(x,y,l.x+dx*t,l.y+dy*t)}
  IS.updateProjectiles=(room,dt,ctx)=>{const player=ctx.player
    for(const key of ['tears','shots','knives'])for(const p of room[key]||[]){if(p.dead)continue
      if(p.homing&&player){const want=IS.angleTo(p.x,p.y,player.x,player.y),cur=Math.atan2(p.vy,p.vx),sp=IS.len(p.vx,p.vy),na=cur+IS.clamp(IS.angleDiff(cur,want),-p.homing*dt,p.homing*dt);p.vx=Math.cos(na)*sp;p.vy=Math.sin(na)*sp}
      if(p.friendly&&p.flags.has('lump')){p.dmg0=p.dmg0||p.dmg;p.dmg=p.dmg0*(1+(1-p.life/(p.life0||p.life||1)))}
      if(p.friendly&&p.flags.has('magnetize')){const k=1+(1-p.life/(p.life0||1))*2.5;for(const e of IS.roomEnemies(room))if(!e.boss&&IS.dist(p.x,p.y,e.x,e.y)<150){const n=IS.norm(p.x-e.x,p.y-e.y);e.x+=n.x*90*k*dt;e.y+=n.y*90*k*dt}for(const u of room.pickups||[])if(!u.shop&&!u.price&&IS.dist(p.x,p.y,u.x,u.y)<150){const n=IS.norm(p.x-u.x,p.y-u.y);u.x+=n.x*120*k*dt;u.y+=n.y*120*k*dt}}
      if(p.friendly&&!p.flags.has('homing')){let m=null,md=300;for(const e of IS.roomEnemies(room))if(e.status.magnetize&&!e.dead){const d=IS.dist(p.x,p.y,e.x,e.y);if(d<md){md=d;m=e}}if(m){const want=IS.angleTo(p.x,p.y,m.x,m.y),cur=Math.atan2(p.vy,p.vx),sp=IS.len(p.vx,p.vy),na=cur+IS.clamp(IS.angleDiff(cur,want),-6*dt,6*dt);p.vx=Math.cos(na)*sp;p.vy=Math.sin(na)*sp}}
      if(p.friendly&&p.flags.has('light')&&p.hitSet){p.hitT=(p.hitT||0)+dt;if(p.hitT>.12){p.hitT=0;p.hitSet=null}}
      if(p.accel){const sp=IS.len(p.vx,p.vy),k=(sp+p.accel*dt)/(sp||1);p.vx*=k;p.vy*=k}
      if(p.friendly&&p.flags.has('homing')){const t=IS.roomEnemies(room).reduce((b,e)=>{const d=IS.dist(p.x,p.y,e.x,e.y);return d<(b?b.d:320)?{e,d}:b},null);if(t){const want=IS.angleTo(p.x,p.y,t.e.x,t.e.y),cur=Math.atan2(p.vy,p.vx),sp=IS.len(p.vx,p.vy),na=cur+IS.clamp(IS.angleDiff(cur,want),-5*dt,5*dt);p.vx=Math.cos(na)*sp;p.vy=Math.sin(na)*sp}}
      if(p.orbit!=null&&player){p.orbit+=dt*5;p.orbitR+=dt*40;p.x=player.x+Math.cos(p.orbit)*p.orbitR;p.y=player.y+Math.sin(p.orbit)*p.orbitR;p.vx=-Math.sin(p.orbit)*300;p.vy=Math.cos(p.orbit)*300}
      else{p.x+=p.vx*dt;p.y+=p.vy*dt}
      if(p.wiggle!=null){p.wiggle+=dt*14;const n=IS.norm(-p.vy,p.vx),w=Math.cos(p.wiggle)*90*dt;p.x+=n.x*w;p.y+=n.y*w}
      if(p.boomerang&&!p.turned&&p.life<p.life0*.55){p.turned=true;const n=IS.norm(player.x-p.x,player.y-p.y),sp=IS.len(p.vx,p.vy);p.vx=n.x*sp;p.vy=n.y*sp;p.hitSet=null}
      if(p.friendly&&p.flags.has('continuum')&&!IS.inBounds(room,p.x,p.y,p.r)){p.x=(p.x+room.pxW)%room.pxW;p.y=(p.y+room.pxH)%room.pxH}
      p.life-=dt
      if(p.life0&&p.z!=null){const k=p.life/p.life0;p.z=p.lob?TEAR_Z+Math.sin((1-k)*Math.PI)*90:k<.22?(p.friendly?TEAR_Z:14)*(k/.22):(p.friendly?TEAR_Z:14)}
      if(p.friendly){for(const e of IS.roomEnemies(room)){if(e.hidden||e.spawnT>0&&!e.boss)continue;if(IS.entityHit(p,e)){if(p.hitSet&&p.hitSet.has(e))continue;IS.damageEnemy(e,p.dmg,{src:p,flags:p.flags},ctx);IS.onTearImpact(p,e,ctx);splash(p,ctx,'#a8d4f0');if(!p.flags?.has('piercing')){p.dead=true;break}(p.hitSet||(p.hitSet=new Set())).add(e)}}}
      else if(IS.entityHit(p,player)){if(IS.damagePlayer(player,p.dmg,p,ctx))IS.knockback(player,p.x-p.vx,p.y-p.vy,380);p.dead=true;splash(p,ctx,'#c74a3a')}
      if(!p.dead&&p.bounce>0&&!IS.inBounds(room,p.x,p.y,p.r)){p.bounce--;if(p.x<p.r||p.x>room.pxW-p.r)p.vx=-p.vx;if(p.y<p.r||p.y>room.pxH-p.r)p.vy=-p.vy;IS.clampToRoom(room,p)}
      if(!p.dead&&p.bounce>0&&p.life>0&&hitGrid(p,room,ctx)){p.bounce--;p.x-=p.vx*dt;p.y-=p.vy*dt;const T=IS.TILE;if(IS.solidAt(room,p.x+p.vx*dt,p.y,{ignorePits:true}))p.vx=-p.vx;else p.vy=-p.vy}
      if(!p.dead&&(p.life<=0||!IS.inBounds(room,p.x,p.y,p.r)||hitGrid(p,room,ctx))){p.dead=true;splash(p,ctx,p.friendly?(p.lob?'#9fd46a':'#a8d4f0'):'#c74a3a');if(p.friendly&&p.flags.has('explosive'))IS.bombExplode(p.x,p.y,{dmg:p.dmg+30,r:90,playerSafe:true},ctx);else if(p.friendly&&p.flags.has('splitting')&&!p.split)splitTear(p,ctx);if(p.friendly&&IS.audio)IS.audio.sfx('tear-splat');if(p.friendly&&!p.split&&!p.noDeathHook)IS.fireHook(player,'onTearDeath',[p],ctx)}}
    for(const u of room.puddles||[]){u.life-=dt;u.tick=(u.tick||0)-dt;if(u.tick<=0){u.tick=.5;for(const e of IS.roomEnemies(room))if(!e.hidden&&IS.dist(u.x,u.y,e.x,e.y)<u.r+e.r*.5){u.dmg>0&&IS.damageEnemy(e,u.dmg,{silent:true},ctx);(u.status||[]).forEach(([s,n])=>IS.applyStatus(e,s,n,ctx))}}}room.puddles=(room.puddles||[]).filter(u=>u.life>0)
    for(const b of room.bombs||[]){b.fuse-=dt;if(b.vx||b.vy){const k=Math.exp(-dt*2.5);b.r0=b.r0||14;const e={x:b.x,y:b.y,r:b.r0,vx:b.vx,vy:b.vy};IS.moveEntity(e,dt,room);if(e.bumped){b.vx=-b.vx*.5;b.vy=-b.vy*.5}b.x=e.x;b.y=e.y;b.vx*=k;b.vy*=k}
      if(b.contact&&!b.dead&&IS.roomEnemies(room).some(e=>IS.dist(b.x,b.y,e.x,e.y)<e.r+16))b.fuse=0
      if(b.fuse<=0&&!b.dead){b.dead=true;IS.bombExplode(b.x,b.y,b,ctx)}}
    for(const l of room.lasers||[]){l.life-=dt;if(l.warn)continue
      if(l.friendly){for(const e of IS.roomEnemies(room)){const last=l.hit.get(e)||-1;if(room.time-last<(l.tick||.12))continue;if(segDist(l,e.x,e.y)<e.r+l.width/2){l.hit.set(e,room.time);IS.damageEnemy(e,l.dmg,{silent:true},ctx)}}}
      else if(player&&!player.dead&&segDist(l,player.x,player.y)<player.r*.7+l.width/2)IS.damagePlayer(player,l.dmg||1,l,ctx)}
    for(const k of ['arcs','beams'])if(room[k])room[k]=room[k].filter(x=>(x.t+=dt)<.25)
    for(const k of ['tears','shots','bombs','lasers','knives'])room[k]=(room[k]||[]).filter(x=>!x.dead&&x.life!==0&&(x.life==null||x.life>0))}
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
