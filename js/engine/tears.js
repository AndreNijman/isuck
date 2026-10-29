;(function (IS) {
  'use strict'
  const put=(kind,o,ctx)=>{const r=ctx.room||ctx.run.room;(r[kind]||(r[kind]=[])).push(o);return o}
  const TEAR_Z=22 // tears fly at shoulder height and drop over the last stretch of their range
  IS.tearBaseOpts=p=>({x:p.x,y:p.y,vx:(p.head?.x||1)*IS.TEAR_SPEED*p.stats.shotSpeed,vy:(p.head?.y||0)*IS.TEAR_SPEED*p.stats.shotSpeed,dmg:p.stats.damage,r:8*p.stats.tearSize,flags:new Set(),life:p.stats.range/(IS.TEAR_SPEED*p.stats.shotSpeed),friendly:true,sprite:'tear'})
  IS.applyTearFlags=(t,p)=>{(p.tearFlags||[]).forEach(f=>t.flags.add(f));if(p.flags?.has('spectralTears'))t.flags.add('spectral');if(p.flags?.has('piercingTears'))t.flags.add('piercing');if(p.flags?.has('homingTears'))t.flags.add('homing');return t}
  IS.spawnTear=(o,ctx)=>{const t=put('tears',Object.assign({x:0,y:0,vx:0,vy:0,dmg:3.5,r:8,flags:new Set(),life:2,friendly:true,sprite:'tear',height:0,falls:0,dead:false},o,{flags:o.flags instanceof Set?o.flags:new Set(o.flags||[])}),ctx);t.life0=t.life;t.z=TEAR_Z;return t}
  IS.spawnEnemyShot=(o,ctx)=>{if(o.angle!=null&&!o.vx&&!o.vy){const s=o.speed||260;o.vx=Math.cos(o.angle)*s;o.vy=Math.sin(o.angle)*s}const t=put('shots',Object.assign({x:0,y:0,vx:0,vy:0,dmg:1,r:9,flags:new Set(),life:4,friendly:false,dead:false},o,{flags:o.flags instanceof Set?o.flags:new Set(o.flags||[])}),ctx);t.life0=t.life;t.z=14;return t}
  IS.spawnBomb=(x,y,o,ctx)=>{const b=put('bombs',Object.assign({x,y,fuse:1.5,dmg:60,r:120,flags:new Set(),friendly:true,dead:false},o),ctx);b.fuse0=b.fuse;ctx.sfx&&ctx.sfx('bomb-fuse');return b}
  // Bombs hurt everything in the blast, the player included, as they should.
  IS.bombExplode=(x,y,o,ctx)=>{o=o||{};const room=ctx.room,R=o.r||120;for(const e of IS.roomEnemies(room))if(IS.dist(x,y,e.x,e.y)<R+e.r){IS.damageEnemy(e,o.dmg||60,{src:o.src,flags:o.flags,silent:true},ctx);IS.knockback(e,x,y,e.boss?0:520)}for(const g of room.grid||[])if(IS.dist(x,y,g.x,g.y)<R)IS.destroyGrid(room,g,ctx);const p=ctx.player;if(p&&!p.dead&&!p.flags?.has('bombImmune')&&!p.flags?.has('pyromaniac')&&IS.dist(x,y,p.x,p.y)<R*.85+p.r){if(IS.damagePlayer(p,o.playerDmg||2,{name:'a bomb',kind:'bomb'},ctx))IS.knockback(p,x,y,700)}if(IS.fx){IS.fx.burst(x,y,'#f2b24a',22);IS.fx.ring(x,y,{colour:'#fff1c4',r0:20,r1:R*1.15,life:.3,width:8});IS.fx.decal&&IS.fx.decal(x,y,R*.55,'rgba(20,14,12,.6)');IS.fx.shake(9,.35);IS.fx.flash&&IS.fx.flash('rgba(255,236,190,.35)',.08)}ctx.sfx&&ctx.sfx('bomb-explode');return true}
  IS.spawnLaser=(o,ctx)=>put('lasers',Object.assign({x:0,y:0,angle:0,len:600,dmg:3.5,width:12,life:.3,friendly:true,dead:false,hit:new Map()},o,{hit:new Map()}),ctx)
  IS.spawnKnife=(o,ctx)=>put('knives',Object.assign({x:0,y:0,vx:0,vy:0,dmg:10,r:14,life:.6,friendly:true,dead:false},o),ctx)
  IS.firePlayerTears=(p,dir,ctx)=>{const n=1+(p.stats.multishot||0),base=IS.tearBaseOpts(p);for(let i=0;i<n;i++){const a=Math.atan2(dir.y,dir.x)+(i-(n-1)/2)*.12,s=IS.TEAR_SPEED*p.stats.shotSpeed;
      // a little of the player's own motion carries into the tear, as in Isaac
      const t=IS.spawnTear(Object.assign(base,{vx:Math.cos(a)*s+(p.vx||0)*.3,vy:Math.sin(a)*s+(p.vy||0)*.3}),ctx);
      // alternate eyes so a stream of tears doesn't read as one dotted line
      p.eye=-(p.eye||1);const off=p.r*.35*p.eye;t.x+=-Math.sin(a)*off;t.y+=Math.cos(a)*off;IS.applyTearFlags(t,p);IS.fireHook(p,'onTearFire',[t],ctx)}
    if(ctx.run&&ctx.run.stats)ctx.run.stats.tearsFired=(ctx.run.stats.tearsFired||0)+n;p.recoil=.08;IS.audio?.sfx('tear-fire',{rate:.92+((ctx.run?.stats?.tearsFired||0)%4)*.05})}
  IS.onTearImpact=(t,e,ctx)=>{if(t.flags.has('poison'))IS.applyStatus(e,'poison',3,ctx);if(t.flags.has('burn'))IS.applyStatus(e,'burn',3,ctx);if(t.flags.has('slow'))IS.applyStatus(e,'slow',2,ctx);if(t.flags.has('freeze'))IS.applyStatus(e,'freeze',1,ctx);IS.fireHook(ctx.player,'onTearHit',[t,e],ctx);if(t.flags.has('explosive'))IS.bombExplode(t.x,t.y,{dmg:t.dmg*5,r:90},ctx)}
  const splash=(p,ctx,col)=>{if(IS.fx){IS.fx.particles({x:p.x,y:p.y-(p.z||0)*.5,n:5,colour:col,speed:120,life:.22,size:3.5,drag:4});IS.fx.ring(p.x,p.y-(p.z||0)*.5,{colour:col,r0:3,r1:p.r*2.2,life:.16,width:2})}}
  // Tears chip poop, fire and TNT; rocks only stop them.
  function hitGrid(p,room,ctx){if(p.flags.has('spectral'))return false;const T=IS.TILE,col=Math.floor(p.x/T),row=Math.floor(p.y/T);if(!IS.solidAt(room,p.x,p.y,{ignorePits:true}))return false;const g=IS.gridAt(room,col,row);if(g&&p.friendly&&g.destructible&&!g.bombOnly&&!g.rockFamily&&g.hp>0){g.hp-=1;g.hurtT=.1;if(g.hp<=0)IS.destroyGrid(room,g,ctx)}return true}
  const segDist=(l,x,y)=>{const dx=Math.cos(l.angle),dy=Math.sin(l.angle),t=IS.clamp((x-l.x)*dx+(y-l.y)*dy,0,l.len);return IS.dist(x,y,l.x+dx*t,l.y+dy*t)}
  IS.updateProjectiles=(room,dt,ctx)=>{const player=ctx.player
    for(const key of ['tears','shots','knives'])for(const p of room[key]||[]){if(p.dead)continue
      if(p.homing&&player){const want=IS.angleTo(p.x,p.y,player.x,player.y),cur=Math.atan2(p.vy,p.vx),sp=IS.len(p.vx,p.vy),na=cur+IS.clamp(IS.angleDiff(cur,want),-p.homing*dt,p.homing*dt);p.vx=Math.cos(na)*sp;p.vy=Math.sin(na)*sp}
      if(p.accel){const sp=IS.len(p.vx,p.vy),k=(sp+p.accel*dt)/(sp||1);p.vx*=k;p.vy*=k}
      if(p.friendly&&p.flags.has('homing')){const t=IS.roomEnemies(room).reduce((b,e)=>{const d=IS.dist(p.x,p.y,e.x,e.y);return d<(b?b.d:320)?{e,d}:b},null);if(t){const want=IS.angleTo(p.x,p.y,t.e.x,t.e.y),cur=Math.atan2(p.vy,p.vx),sp=IS.len(p.vx,p.vy),na=cur+IS.clamp(IS.angleDiff(cur,want),-5*dt,5*dt);p.vx=Math.cos(na)*sp;p.vy=Math.sin(na)*sp}}
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt
      if(p.life0&&p.z!=null){const k=p.life/p.life0;p.z=k<.22?(p.friendly?TEAR_Z:14)*(k/.22):(p.friendly?TEAR_Z:14)}
      if(p.friendly){for(const e of IS.roomEnemies(room)){if(e.hidden||e.spawnT>0&&!e.boss)continue;if(IS.entityHit(p,e)){if(p.hitSet&&p.hitSet.has(e))continue;IS.damageEnemy(e,p.dmg,{src:p,flags:p.flags},ctx);IS.onTearImpact(p,e,ctx);splash(p,ctx,'#a8d4f0');if(!p.flags?.has('piercing')){p.dead=true;break}(p.hitSet||(p.hitSet=new Set())).add(e)}}}
      else if(IS.entityHit(p,player)){if(IS.damagePlayer(player,p.dmg,p,ctx))IS.knockback(player,p.x-p.vx,p.y-p.vy,380);p.dead=true;splash(p,ctx,'#c74a3a')}
      if(!p.dead&&p.bounce>0&&!IS.inBounds(room,p.x,p.y,p.r)){p.bounce--;if(p.x<p.r||p.x>room.pxW-p.r)p.vx=-p.vx;if(p.y<p.r||p.y>room.pxH-p.r)p.vy=-p.vy;IS.clampToRoom(room,p)}
      if(!p.dead&&(p.life<=0||!IS.inBounds(room,p.x,p.y,p.r)||hitGrid(p,room,ctx))){p.dead=true;splash(p,ctx,p.friendly?'#a8d4f0':'#c74a3a');if(p.friendly&&IS.audio)IS.audio.sfx('tear-splat')}}
    for(const b of room.bombs||[]){b.fuse-=dt;if(b.fuse<=0&&!b.dead){b.dead=true;IS.bombExplode(b.x,b.y,b,ctx)}}
    for(const l of room.lasers||[]){l.life-=dt;if(l.warn)continue
      if(l.friendly){for(const e of IS.roomEnemies(room)){const last=l.hit.get(e)||-1;if(room.time-last<.12)continue;if(segDist(l,e.x,e.y)<e.r+l.width/2){l.hit.set(e,room.time);IS.damageEnemy(e,l.dmg,{silent:true},ctx)}}}
      else if(player&&!player.dead&&segDist(l,player.x,player.y)<player.r*.7+l.width/2)IS.damagePlayer(player,l.dmg||1,l,ctx)}
    for(const k of ['tears','shots','bombs','lasers','knives'])room[k]=(room[k]||[]).filter(x=>!x.dead&&x.life!==0&&(x.life==null||x.life>0))}
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
