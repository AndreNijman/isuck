;(function (IS) {
  'use strict'
  // Familiars follow the params contract in js/data/familiars.js: contact familiars ('orbital', 'chaser',
  // 'wanderer') hit what they touch every params.cooldown, shooters fire params.dmg tears every
  // params.fireDelay, blockShots bodies eat enemy shots, hp/invulnerable/life/onDeath end them.
  IS.familiarBehaviours={}
  IS.defineFamiliarBehaviour=(n,fn)=>{IS.familiarBehaviours[n]=fn}
  IS.spawnFamiliar=(p,id,ctx)=>{const d=IS.familiarsById[id];if(!d)return null;const q=d.params||{},f={id,def:d,x:p.x,y:p.y,vx:0,vy:0,r:q.r||16,t:0,shotT:0,angle:(p.familiars||[]).length,hp:q.hp>0&&!q.invulnerable?q.hp:Infinity,life:q.life>0?q.life:null,rest:0,hit:new Map(),got:0};(p.familiars||(p.familiars=[])).push(f);return f}
  IS.removeFamiliar=(p,id)=>{const i=(p.familiars||[]).findIndex(f=>f.id===id);if(i<0)return false;p.familiars.splice(i,1);return true}
  const Q=f=>f.def.params||{},ease=(f,x,y,k,dt)=>{const a=Math.min(1,dt*k);f.x+=(x-f.x)*a;f.y+=(y-f.y)*a}
  function follow(f,dt,ctx){const p=ctx.player,n=IS.norm(p.x-f.x,p.y-f.y),d=IS.dist(p.x,p.y,f.x,f.y);if(d>46){f.vx+=n.x*500*dt;f.vy+=n.y*500*dt}f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.9;f.vy*=.9}
  // a tear a familiar fires: `inherit` makes it carry the player's tear effects at that fraction of their damage
  function shoot(f,a,ctx){const q=Q(f),p=ctx.player,s=IS.TEAR_SPEED,t=ctx.spawnTear({x:f.x,y:f.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,dmg:q.inherit?p.stats.damage*q.inherit:q.dmg||3.5,r:7,life:(q.range||520)/s,friendly:true});(q.tearFlags||[]).forEach(x=>t.flags.add(x));if(q.inherit)p.tearFlags.forEach(x=>t.flags.add(x));return t}
  const fires=f=>Q(f).fireDelay&&(Q(f).dmg>0||Q(f).inherit)
  function shooter(f,dt,ctx,aimAtEnemy){f.shotT-=dt;if(f.shotT>0||!fires(f))return;let a=null;if(aimAtEnemy){const e=ctx.nearestEnemy(f.x,f.y);if(e)a=IS.angleTo(f.x,f.y,e.x,e.y)}else{const d=IS.input.shoot();if(d.x||d.y)a=Math.atan2(d.y,d.x)}if(a==null)return;shoot(f,a,ctx);f.shotT=Q(f).fireDelay||1}
  // orbit slot: same-id familiars share a ring evenly; the whole ring turns with run time (Guardian Angel speeds the others up)
  function orbitPos(f,p,ctx){const q=Q(f),same=p.familiars.filter(x=>x.id===f.id),i=same.indexOf(f),sp=(q.orbitSpeed||2)*(IS.hasItem(p,'guardian-angel')&&f.id!=='guardian-angel'?1.4:1),a=(ctx.run?.time||f.t)*sp+Math.PI*2*i/same.length;f.angle=a;return {x:p.x+Math.cos(a)*(q.orbitR||70),y:p.y+Math.sin(a)*(q.orbitR||70)}}
  function contact(f,ctx){const q=Q(f),room=ctx.room||ctx.run.room,now=room.time||ctx.run?.time||0;if(!(q.dmg>0))return false;let hit=false;for(const e of IS.roomEnemies(room)){if(e.hidden||e.friendly||IS.dist(f.x,f.y,e.x,e.y)>e.r+f.r)continue;hit=true;if(now-(f.hit.get(e)||-9)<(q.cooldown||.5))continue;f.hit.set(e,now);IS.damageEnemy(e,q.dmg,{src:f,silent:true},ctx);if(q.status)IS.applyStatus(e,q.status,q.statusSecs||2,ctx)}return hit}
  function block(f,ctx){if(!Q(f).blockShots)return;const room=ctx.room||ctx.run.room;for(const s of room.shots||[])if(!s.dead&&!s.friendly&&IS.dist(f.x,f.y,s.x,s.y)<f.r+s.r){s.dead=true;f.blocked=(f.blocked||0)+1;if(f.hp!==Infinity&&--f.hp<=0){f.dead=true;break}}}
  IS.defineFamiliarBehaviour('follower',(f,dt,c)=>{follow(f,dt,c);shooter(f,dt,c,false)})
  IS.defineFamiliarBehaviour('orbitShooter',(f,dt,c)=>{const o=orbitPos(f,c.player,c);ease(f,o.x,o.y,10,dt);shooter(f,dt,c,true)})
  IS.defineFamiliarBehaviour('orbital',(f,dt,c)=>{const o=orbitPos(f,c.player,c);ease(f,o.x,o.y,12,dt);contact(f,c)})
  IS.defineFamiliarBehaviour('chaser',(f,dt,c)=>{const q=Q(f),p=c.player;f.rest-=dt;const e=f.rest<=0?c.nearestEnemy(f.x,f.y):null,tgt=e&&IS.dist(f.x,f.y,e.x,e.y)<(q.range||900)?e:p,n=IS.norm(tgt.x-f.x,tgt.y-f.y),sp=q.speed||300,k=f.rest>0&&f.rammed?-.5:1;f.vx=IS.approach(f.vx,k*n.x*sp,sp*6*dt);f.vy=IS.approach(f.vy,k*n.y*sp,sp*6*dt);f.x+=f.vx*dt;f.y+=f.vy*dt;if(tgt===p&&IS.dist(f.x,f.y,p.x,p.y)<60){f.vx*=.8;f.vy*=.8}if(contact(f,c)&&f.rest<=0){f.rest=q.cooldown||.4;f.rammed=true}else if(f.rest<=0)f.rammed=false})
  IS.defineFamiliarBehaviour('wanderer',(f,dt,c)=>{const q=Q(f);f.rest-=dt;if(f.rest<=0){f.rest=c.range(.6,1.8);f.wa=c.range(0,Math.PI*2)}const sp=q.speed||0;if(sp){f.x+=Math.cos(f.wa)*sp*.5*dt;f.y+=Math.sin(f.wa)*sp*.5*dt}contact(f,c)})
  // collectors (Bum Friend, Dark Bum, Bumbo) walk to the nearest wanted pickup, eat it, and pay out every q.every units
  IS.defineFamiliarBehaviour('collector',(f,dt,c)=>{const q=Q(f),room=c.room||c.run.room,want=q.collects||['coin','key','bomb'];let best=null,bd=q.range||700;for(const u of room.pickups||[]){if(u.dead||u.taken||u.shop||u.price||!want.includes(u.kind))continue;const d=IS.dist(f.x,f.y,u.x,u.y);if(d<bd){bd=d;best=u}}if(best){const n=IS.norm(best.x-f.x,best.y-f.y),sp=q.speed||300;f.x+=n.x*sp*dt;f.y+=n.y*sp*dt;if(IS.dist(f.x,f.y,best.x,best.y)<f.r+best.r){best.dead=best.taken=true;f.got+=best.amount||1;if(q.every&&f.got>=q.every){f.got-=q.every;c.spawnPickup(q.reward==='black'?'black':c.pick(['coin','heart','bomb','key']),f.x,f.y)}}}else follow(f,dt,c);contact(f,c)})
  ;['stationaryDrop','buffer','laserFamiliar','bomber','shielder','summoner','copycat'].forEach(n=>IS.defineFamiliarBehaviour(n,follow))
  function ending(p,f,ctx){const q=Q(f),d=q.onDeath;if(q.explode)IS.bombExplode(f.x,f.y,{dmg:q.explode.dmg,r:q.explode.r,playerSafe:true},ctx);if(d){for(const id of d.familiars||[]){const n=IS.spawnFamiliar(p,id,ctx);if(n){n.x=f.x;n.y=f.y}}if(d.respawn)(p.cache.famRespawn||(p.cache.famRespawn=[])).push({id:f.id,t:d.respawn})}}
  IS.updateFamiliars=(p,dt,ctx)=>{if(!ctx.room&&!ctx.run?.room)return;const rs=p.cache.famRespawn;if(rs&&rs.length){for(const r of rs)r.t-=dt;for(const r of rs.filter(r=>r.t<=0))IS.spawnFamiliar(p,r.id,ctx);p.cache.famRespawn=rs.filter(r=>r.t>0)}
    for(const f of (p.familiars||[]).slice()){f.t+=dt;(IS.familiarBehaviours[f.def.behaviour]||follow)(f,dt,ctx);block(f,ctx);if(f.life!=null&&(f.life-=dt)<=0)f.dead=true;if(f.dead)ending(p,f,ctx)}
    p.familiars=(p.familiars||[]).filter(f=>!f.dead)}
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
