;(function (IS) {
  'use strict'
  // Spawn grace: a fresh enemy fades in, cannot hurt you and does not act. Entering
  // a room should never cost a heart before you can see what is in it.
  const SPAWN_GRACE = .7
  IS.spawnEnemy=(room,id,x,y,opts)=>{const d=IS.enemiesById[id];if(!d)return null;opts=opts||{};const e=IS.makeEntity(d,x,y,opts);e.room=room;if(opts.spawnT==null)e.spawnT=SPAWN_GRACE;if(d.champion&&room.rng)IS.rollChampion(e,room.rng);room.enemies.push(e);IS.save?.seeEnemy(id,false);return e}
  IS.spawnBoss=(room,id,x,y,opts)=>{const d=IS.bossesById[id];if(!d)return null;const e=IS.makeEntity(Object.assign({},d,{boss:true}),x,y,Object.assign({boss:true},opts));e.room=room;e.spawnT=1.2;e.baseSpeed=e.speed;room.enemies.push(e);room.boss=e;if(d.onSpawn)d.onSpawn(e,opts?.ctx);return e}
  IS.rollChampion=(e,rng)=>{if(!rng.chance(.05))return null;e.champion=rng.pick(IS.CHAMPIONS);e.hp*=1.5;e.maxHp=e.hp;e.dmg++;return e.champion}
  IS.enemyDrops=(e,ctx)=>{if(!ctx||!e.room||e.boss)return;if(ctx.chance(.06))ctx.spawnPickup(ctx.pick(['coin','heart','bomb','key']),e.x,e.y)}

  const P=(e,k,d)=>{const v=e.def.params&&e.def.params[k];return v==null?d:v}
  const toPlayer=(e,c)=>IS.norm(c.player.x-e.x,c.player.y-e.y)
  const distPlayer=(e,c)=>IS.dist(e.x,e.y,c.player.x,c.player.y)
  const steer=(e,tx,ty,s,accel,dt)=>{e.vx=IS.approach(e.vx,tx*s,accel*dt);e.vy=IS.approach(e.vy,ty*s,accel*dt)}
  const stop=(e,dt)=>steer(e,0,0,0,e.speed*6,dt)
  // Line of sight across the grid: rocks block a charger's view, pits do not.
  const sees=(room,ax,ay,bx,by)=>{const d=IS.dist(ax,ay,bx,by),n=Math.ceil(d/24);for(let i=1;i<n;i++){const t=i/n,x=ax+(bx-ax)*t,y=ay+(by-ay)*t;if(IS.solidAt(room,x,y,{ignorePits:true}))return false}return true}
  // A windup sets ai.telegraph, which the renderer draws as a ring and a swell.
  const windup=(e,dt,secs)=>{e.ai.tele=(e.ai.tele||0)+dt;e.ai.telegraph=Math.min(1,e.ai.tele/secs);if(e.ai.tele>=secs){e.ai.tele=0;e.ai.telegraph=0;return true}return false}
  const shoot=(e,c,o)=>IS.enemyShoot(e,Object.assign({speed:P(e,'shotSpeed',280)},o),c)

  function chase(e,dt,c,m){const n=toPlayer(e,c),s=e.speed*(m||1),j=P(e,'jitter',.15);e.ai.w=(e.ai.w||c.range(0,6))+dt*3;const w=Math.sin(e.ai.w)*j;steer(e,n.x-n.y*w,n.y+n.x*w,s,P(e,'accel',e.speed*5),dt)}
  function wander(e,dt,c,m){e.ai.t=(e.ai.t||0)-dt;if(e.ai.t<=0||e.bumped){e.ai.t=c.range(.6,P(e,'turnDelay',1.6));e.ai.a=c.chance(.35)?IS.angleTo(e.x,e.y,c.player.x,c.player.y):c.range(0,Math.PI*2)}const v=IS.fromAngle(e.ai.a,e.speed*(m||1));steer(e,v.x/e.speed,v.y/e.speed,e.speed,e.speed*5,dt)}
  // fire on a timer, with a visible windup; `fn` decides the pattern
  function gun(e,dt,c,fn,delay){if(e.ai.fire==null)e.ai.fire=c.range(.6,1.6);if(e.ai.winding){if(windup(e,dt,P(e,'windup',.45))){e.ai.winding=false;e.ai.fire=delay||P(e,'fireDelay',1.8);fn(e,c)}return true}e.ai.fire-=dt;if(e.ai.fire<=0&&distPlayer(e,c)<900)e.ai.winding=true;return false}
  const aimed=(e,c)=>{const n=P(e,'burstCount',1);shoot(e,c,{count:n,spread:n>1?.22:0})}
  const cross=(e,c)=>{const b=e.ai.rot?Math.PI/4:0;e.ai.rot=!e.ai.rot;for(let i=0;i<4;i++)shoot(e,c,{angle:b+i*Math.PI/2})}

  // Charger: patrol in straight lines, and when the player lines up on an axis,
  // flinch, then dash until something stops it.
  function charger(e,dt,c){const a=e.ai;if(a.mode==='dash'){a.t-=dt;e.vx=a.dx*P(e,'dashSpeed',460);e.vy=a.dy*P(e,'dashSpeed',460);if(e.bumped||a.t<=0){a.mode='rest';a.t=P(e,'recover',.6);if(e.bumped&&IS.fx){IS.fx.shake(2,.1);IS.fx.poof(e.x+a.dx*e.r,e.y+a.dy*e.r)}}return}
    if(a.mode==='wind'){stop(e,dt);if(windup(e,dt,P(e,'windup',.35))){a.mode='dash';a.t=1.4;c.sfx&&c.sfx('charge')}return}
    if(a.mode==='rest'){stop(e,dt);a.t-=dt;if(a.t<=0)a.mode=null;return}
    const dx=c.player.x-e.x,dy=c.player.y-e.y,lane=e.r+c.player.r*.6
    if((Math.abs(dy)<lane||Math.abs(dx)<lane)&&sees(e.room||c.room,e.x,e.y,c.player.x,c.player.y)){a.mode='wind';if(Math.abs(dy)<lane){a.dx=IS.sign(dx);a.dy=0}else{a.dx=0;a.dy=IS.sign(dy)}return}
    a.t=(a.t||0)-dt;if(a.t<=0||e.bumped){a.t=c.range(.7,1.5);const k=c.int(4);a.px=[1,-1,0,0][k];a.py=[0,0,1,-1][k]}steer(e,a.px||0,a.py||0,e.speed*.7,e.speed*6,dt)}

  // Hopper: crouch, leap in an arc toward (near) the player, land with a thud.
  // Airborne it neither collides nor hurts, which is the whole read of the enemy.
  function leaper(e,dt,c,big){const a=e.ai;if(a.air){a.t+=dt;const k=Math.min(1,a.t/a.dur);e.x=IS.lerp(a.sx,a.tx,k);e.y=IS.lerp(a.sy,a.ty,k);e.z=Math.sin(k*Math.PI)*P(e,'hopHeight',70)*(big?1.4:1);e.vx=e.vy=0;if(k>=1){a.air=false;e.z=0;e.harmless=false;e.flying=a.wasFlying;a.t=P(e,'hopDelay',1.1)*c.range(.7,1.2);if(IS.fx)IS.fx.ring(e.x,e.y+e.r*.5,{colour:'#c9b9a0',r0:e.r*.6,r1:e.r*2.2,life:.25,width:3,layer:'under'});if(big){IS.fx&&IS.fx.shake(3,.15);for(let i=0;i<6;i++)shoot(e,c,{angle:i*Math.PI/3,speed:220})}}return}
    stop(e,dt);a.t=(a.t==null?c.range(.3,1):a.t)-dt;if(a.t>0)return;if(!windup(e,dt,.25))return
    const n=toPlayer(e,c),reach=Math.min(distPlayer(e,c),big?260:200)*c.range(.7,1.1),ang=Math.atan2(n.y,n.x)+c.range(-.5,.5)
    a.air=true;a.t=0;a.dur=big?.75:.5;a.sx=e.x;a.sy=e.y;const room=e.room||c.room;a.tx=IS.clamp(e.x+Math.cos(ang)*reach,e.r,room.pxW-e.r);a.ty=IS.clamp(e.y+Math.sin(ang)*reach,e.r,room.pxH-e.r)
    if(IS.solidAt(room,a.tx,a.ty,{})){a.tx=e.x;a.ty=e.y}e.harmless=true;a.wasFlying=e.flying;e.flying=true}

  // Flies: drifters wobble about aimlessly, chasers home with a buzz, orbiters circle.
  function flyDrift(e,dt,c){e.ai.a=(e.ai.a==null?c.range(0,6.28):e.ai.a)+c.range(-4,4)*dt;const n=toPlayer(e,c),pull=P(e,'pull',.35),v=IS.fromAngle(e.ai.a,1);steer(e,v.x+n.x*pull,v.y+n.y*pull,e.speed,e.speed*4,dt)}
  function flyChase(e,dt,c){e.ai.w=(e.ai.w||c.range(0,6))+dt*9;const n=toPlayer(e,c),w=Math.sin(e.ai.w)*.6;steer(e,n.x-n.y*w,n.y+n.x*w,e.speed,e.speed*3,dt)}
  function flyOrbit(e,dt,c){e.ai.a=(e.ai.a==null?IS.angleTo(c.player.x,c.player.y,e.x,e.y):e.ai.a)+dt*1.4;const R=P(e,'radius',150),tx=c.player.x+Math.cos(e.ai.a)*R,ty=c.player.y+Math.sin(e.ai.a)*R,n=IS.norm(tx-e.x,ty-e.y);steer(e,n.x,n.y,e.speed*1.3,e.speed*6,dt)}
  function flyDart(e,dt,c){const a=e.ai;if(a.dash>0){a.dash-=dt;return}if(a.winding){stop(e,dt);if(windup(e,dt,.4)){a.winding=false;a.dash=.45;const n=toPlayer(e,c);e.vx=n.x*e.speed*3.4;e.vy=n.y*e.speed*3.4}return}flyDrift(e,dt,c);a.t=(a.t==null?c.range(1,2.5):a.t)-dt;if(a.t<=0){a.t=c.range(1.6,2.8);a.winding=true}}
  // Boom fly: ricochets diagonally off walls, explodes on death.
  function bouncer(e,dt,c){const a=e.ai;if(a.dx==null){a.dx=c.chance(.5)?1:-1;a.dy=c.chance(.5)?1:-1}const room=e.room||c.room;if(e.x<=e.r+1||e.x>=room.pxW-e.r-1)a.dx=e.x<room.pxW/2?1:-1;if(e.y<=e.r+1||e.y>=room.pxH-e.r-1)a.dy=e.y<room.pxH/2?1:-1;if(e.bumped){a.dx=-a.dx;a.dy=-a.dy}e.vx=a.dx*e.speed*.75;e.vy=a.dy*e.speed*.75}

  // Burrower: dives, tunnels toward you unseen, surfaces with a spray.
  function burrower(e,dt,c){const a=e.ai;a.t=(a.t==null?c.range(.5,1.5):a.t)-dt;if(a.under){e.harmless=true;e.hidden=true;chase(e,dt,c,1.2);if(a.t<=0){a.under=false;a.t=1.6;a.surf=.5}return}
    if(a.surf>0){stop(e,dt);a.surf-=dt;e.ai.telegraph=1-a.surf/.5;if(a.surf<=0){e.hidden=false;e.harmless=false;e.ai.telegraph=0;cross(e,c)}return}
    stop(e,dt);if(a.t<=0){a.under=true;a.t=P(e,'submergeTime',1.3);IS.fx&&IS.fx.poof(e.x,e.y,'#7a5f48')}}
  function teleporter(e,dt,c){const a=e.ai;a.t=(a.t==null?c.range(1.5,3):a.t)-dt;wander(e,dt,c,.5);if(a.t<=0){if(!windup(e,dt,.5))return;IS.fx&&IS.fx.poof(e.x,e.y,'#9b7fd0');const p=c.freeFloorPos();if(p&&IS.dist(p.x,p.y,c.player.x,c.player.y)>180){e.x=p.x;e.y=p.y}IS.fx&&IS.fx.poof(e.x,e.y,'#9b7fd0');e.spawnT=.35;a.t=c.range(2,3.5);a.fire=.5}gun(e,dt,c,aimed)}
  function summoner(e,dt,c){wander(e,dt,c,.45);const kind=P(e,'spawns','attackfly'),cap=P(e,'spawnCap',3);gun(e,dt,c,(e,c)=>{const room=e.room||c.room,mine=room.enemies.filter(x=>!x.dead&&x.spawnedBy===e).length;if(mine>=cap){aimed(e,c);return}const m=c.spawnEnemy(IS.enemiesById[kind]?kind:'attackfly',e.x,e.y);if(m){m.spawnedBy=e;m.spawnT=.3;IS.knockback(m,e.x+c.range(-5,5),e.y+c.range(-5,5),200)}},P(e,'fireDelay',3))}
  function spinner(e,dt,c){wander(e,dt,c,.4);e.ai.spin=(e.ai.spin||0)+dt*2.2;e.ai.s=(e.ai.s||0)-dt;if(e.ai.s<=0){e.ai.s=.45;for(let i=0;i<2;i++)shoot(e,c,{angle:e.ai.spin+i*Math.PI,speed:220})}}
  function turret(e,dt,c){stop(e,dt);gun(e,dt,c,cross)}
  function guard(e,dt,c){stop(e,dt);const dx=Math.abs(c.player.x-e.x),dy=Math.abs(c.player.y-e.y);e.ai.fire=(e.ai.fire||0)-dt;if((dx<30||dy<30)&&e.ai.fire<=0){e.ai.fire=1.2;shoot(e,c,{speed:360})}}
  function mimic(e,dt,c){if(!e.ai.woke){stop(e,dt);if(distPlayer(e,c)<160)e.ai.woke=true;return}chase(e,dt,c,1.4)}
  function bomber(e,dt,c){wander(e,dt,c,.6);e.ai.b=(e.ai.b==null?c.range(2,4):e.ai.b)-dt;if(e.ai.b<=0){e.ai.b=c.range(3,5);c.spawnBomb(e.x,e.y,{friendly:false,fuse:1.2,hurtsPlayer:true})}}
  function trail(e,dt,c){chase(e,dt,c,.8);e.ai.cr=(e.ai.cr||0)-dt;if(e.ai.cr<=0){e.ai.cr=.25;c.spawnCreep(e.x,e.y,22,{life:2.5,dmg:1})}}

  const map={
    idle:stop, chaser:(e,d,c)=>chase(e,d,c), chaserSlow:(e,d,c)=>chase(e,d,c,.6), wanderer:(e,d,c)=>wander(e,d,c), patroller:(e,d,c)=>wander(e,d,c),
    charger, leaper:(e,d,c)=>leaper(e,d,c,false), jumper:(e,d,c)=>leaper(e,d,c,true),
    flyerChase:flyChase, flyerDrift:flyDrift, flyerOrbit:flyOrbit, flyerDart:flyDart,
    shooter:(e,d,c)=>{if(!gun(e,d,c,aimed))wander(e,d,c,.35);else stop(e,d)},
    shooterMobile:(e,d,c)=>{gun(e,d,c,aimed);chase(e,d,c,.55)},
    spitter:(e,d,c)=>{if(!gun(e,d,c,aimed))wander(e,d,c,.4);else stop(e,d)},
    sprayer:(e,d,c)=>{if(!gun(e,d,c,cross))wander(e,d,c,.5);else stop(e,d)},
    laserer:(e,d,c)=>{if(!gun(e,d,c,(e,c)=>c.spawnLaser({x:e.x,y:e.y,angle:IS.angleTo(e.x,e.y,c.player.x,c.player.y),len:1400,width:16,life:.35,dmg:1,friendly:false}),2.6))wander(e,d,c,.4);else stop(e,d)},
    burrower, grubber:burrower, teleporter,
    splitter:(e,d,c)=>chase(e,d,c,.8), exploder:bouncer, summoner,
    shielded:(e,d,c)=>chase(e,d,c,.6), trailLayer:trail, boomerang:flyOrbit, mimic,
    sucker:flyChase, guard, spinner, swarm:(e,d,c)=>flyChase(e,d,c), wallHugger:guard, grid:turret,
    ghost:(e,d,c)=>{e.flying=true;flyChase(e,d,c)}, bomber, climber:(e,d,c)=>{if(!gun(e,d,c,aimed))wander(e,d,c,.5);else stop(e,d)}
  }
  IS.ARCHETYPE_LIST.forEach(n=>IS.defineArchetype(n,map[n]||map.wanderer))

  // death throes that the archetype implies
  IS.enemyDeathRattle=(e,ctx)=>{if(!ctx||e.boss)return;const a=e.def.archetype;if(a==='exploder')IS.bombExplode(e.x,e.y,{dmg:40,r:100,hurtsPlayer:true},ctx);else if(a==='sucker')for(let i=0;i<4;i++)IS.enemyShoot(e,{angle:i*Math.PI/2+Math.PI/4,speed:240},ctx)}

  IS.updateEnemies=(room,dt,ctx)=>{
    for(const e of room.enemies){
      if(e.dead)continue
      if(e.hurtT>0)e.hurtT=Math.max(0,e.hurtT-dt)
      e.frame+=dt*8
      if(e.spawnT>0){e.spawnT-=dt;e.vx*=.8;e.vy*=.8;IS.moveEntity(e,dt,room,ctx);continue}
      IS.updateStatuses(e,dt,ctx);if(e.status.freeze)continue
      if(!e.boss&&(e.status.fear||e.status.confusion||e.status.charm)){if(e.status.fear){const n=toPlayer(e,ctx);steer(e,-n.x,-n.y,e.speed||90,(e.speed||90)*5,dt)}else wander(e,dt,ctx,.6)}
      else if(e.boss)IS.updateBoss(e,dt,ctx);else(IS.archetypes[e.def.archetype]||map.wanderer)(e,dt,ctx)
      if(e.vx)e.dir=e.vx<0?-1:1
      IS.moveEntity(e,dt,room,ctx);if(!e.status.charm)IS.enemyContactDamage(e,ctx.player,ctx)
    }
    IS.separateEnemies(room.enemies)
    if(room.markers&&room.markers.length){for(const m of room.markers)m.t+=dt;room.markers=room.markers.filter(m=>m.t<m.dur)}
    room.enemies=room.enemies.filter(e=>!e.dead)
  }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
