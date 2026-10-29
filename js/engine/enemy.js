;(function (IS) {
  'use strict'
  // Spawning. As in Isaac, whatever stands in a room when you walk in is awake at
  // once; the player gets a beat of invulnerability on entry instead (see
  // updateEnemies). Only enemies that appear while a fight is already running,
  // spawned by hives, bursts and splits, play a short appear animation.
  const APPEAR = .35, ENTRY_IFRAMES = .6
  let liveRoom = null
  IS.spawnEnemy=(room,id,x,y,opts)=>{const d=IS.enemiesById[id];if(!d)return null;opts=opts||{};const e=IS.makeEntity(d,x,y,opts);e.room=room;e.spawnT=opts.spawnT!=null?opts.spawnT:(room===liveRoom&&room.ticked?APPEAR:0);if(d.champion&&room.rng)IS.rollChampion(e,room.rng,.05);room.enemies.push(e);IS.save?.seeEnemy(id,false);return e}
  IS.spawnBoss=(room,id,x,y,opts)=>{const d=IS.bossesById[id];if(!d)return null;const e=IS.makeEntity(Object.assign({},d,{boss:true}),x,y,Object.assign({boss:true},opts));e.room=room;e.spawnT=1.2;e.baseSpeed=e.speed;room.enemies.push(e);room.boss=e;if(d.onSpawn)d.onSpawn(e,opts?.ctx);return e}
  // Basic colour champions (IS.CHAMPIONS in core/const.js). spawnEnemy rolls with a
  // chance; called bare (Champion Belt) it always makes one.
  IS.rollChampion=(e,rng,p)=>{if(!e||e.champion||e.boss||!rng)return null;if(p!=null&&!rng.chance(p))return null;const k=rng.pick(IS.CHAMPION_LIST),t=IS.CHAMPIONS[k];if(!t)return null;e.champion=k;e.hp*=t.hp||1;e.maxHp=e.hp;e.speed*=t.speed||1;e.tint=t.tint;if(t.shrink)e.r*=.8;if(t.invisible)e.camo=true;return k}
  // Regular enemies drop nothing (the room-clear roll pays out); a champion drops
  // the pickup its colour names. Ring, creep and the rest are death effects.
  IS.enemyDrops=(e,ctx)=>{if(!ctx||!e.room||e.boss||!e.champion)return;const t=IS.CHAMPIONS[e.champion];if(t&&IS.PICKUP_KINDS.includes(t.drop))ctx.spawnPickup(t.drop,e.x,e.y)}

  // params come from the def, or from e.po when a BEH entry overrides them per id
  const P=(e,k,d)=>{const v=e.po&&e.po[k]!=null?e.po[k]:e.def.params&&e.def.params[k];return v==null?d:v}
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
  function wander(e,dt,c,m){if(!e.speed){stop(e,dt);return}e.ai.t=(e.ai.t||0)-dt;if(e.ai.t<=0||e.bumped||e.ai.a==null){e.ai.t=c.range(.6,P(e,'turnDelay',1.6));e.ai.a=c.chance(.35)?IS.angleTo(e.x,e.y,c.player.x,c.player.y):c.range(0,Math.PI*2)}const v=IS.fromAngle(e.ai.a,e.speed*(m||1));steer(e,v.x/e.speed,v.y/e.speed,e.speed,e.speed*5,dt)}
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
    const n=toPlayer(e,c),reach=Math.min(distPlayer(e,c),big?260:P(e,'hopReach',200))*c.range(.7,1.1),ang=Math.atan2(n.y,n.x)+c.range(-.5,.5)
    a.air=true;a.t=0;a.dur=big?.75:P(e,'hopTime',.5);a.sx=e.x;a.sy=e.y;const room=e.room||c.room;a.tx=IS.clamp(e.x+Math.cos(ang)*reach,e.r,room.pxW-e.r);a.ty=IS.clamp(e.y+Math.sin(ang)*reach,e.r,room.pxH-e.r)
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
    if(a.surf>0){stop(e,dt);a.surf-=dt;e.ai.telegraph=1-a.surf/.5;if(a.surf<=0){e.hidden=false;e.harmless=false;e.ai.telegraph=0;if(P(e,'pattern','cross')==='aimed')aimed(e,c);else cross(e,c)}return}
    stop(e,dt);if(a.t<=0){a.under=true;a.t=P(e,'submergeTime',1.3);IS.fx&&IS.fx.poof(e.x,e.y,'#7a5f48')}}
  function teleporter(e,dt,c){const a=e.ai;a.tp=(a.tp==null?c.range(1.5,3):a.tp)-dt;wander(e,dt,c,.5);if(a.tp<=0){if(!windup(e,dt,.5))return;IS.fx&&IS.fx.poof(e.x,e.y,'#9b7fd0');const p=c.freeFloorPos();if(p&&IS.dist(p.x,p.y,c.player.x,c.player.y)>180){e.x=p.x;e.y=p.y}IS.fx&&IS.fx.poof(e.x,e.y,'#9b7fd0');e.spawnT=.35;a.tp=c.range(2,3.5);a.fire=.5}gun(e,dt,c,aimed)}
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

  // ---------------------------------------------------------------------------
  // Per-ID behaviour. An enemy whose id is listed here ignores its archetype and
  // plays like its Isaac namesake; everything else falls back to the archetype.
  // ---------------------------------------------------------------------------
  const spawnKid=(e,c,kind,cap)=>{const room=e.room||c.room;if(cap&&room.enemies.filter(x=>!x.dead&&x.spawnedBy===e).length>=cap)return false;const m=c.spawnEnemy(IS.enemiesById[kind]?kind:'fly',e.x,e.y);if(!m)return false;m.spawnedBy=e;m.spawnT=.3;IS.knockback(m,e.x+c.range(-5,5),e.y+c.range(-5,5),220);return true}
  const burst=(e,c,kind,n)=>{for(let i=0;i<n;i++){const m=c.spawnEnemy(IS.enemiesById[kind]?kind:'fly',e.x+Math.cos(i*6.283/n)*12,e.y+Math.sin(i*6.283/n)*12);if(m){m.spawnT=.35;IS.knockback(m,e.x,e.y,260)}}}
  const turnTo=(a,n,k)=>{a.fx+=(n.x-a.fx)*k;a.fy+=(n.y-a.fy)*k;const l=Math.hypot(a.fx,a.fy)||1;a.fx/=l;a.fy/=l}
  // Knights wear their armour on the front: facing is tracked, rendered as e.variant
  // (0 side, 1 toward camera, 3 away) and read by the damage guard below. As in
  // Isaac they plod in straight cardinal lines, turn at walls and now and then
  // toward you, and charge only when you stand in line ahead of them; flanking
  // them is how you get at the soft back.
  const CARD=[[1,0],[-1,0],[0,1],[0,-1]]
  function knight(e,dt,c,m){const a=e.ai,k=m||1
    if(a.fx==null){const d=c.pick(CARD);a.fx=d[0];a.fy=d[1];a.t=c.range(.8,1.6)}
    e.variant=a.fx?0:a.fy>0?1:3
    if(a.rest>0){a.rest-=dt;stop(e,dt);return}
    if(a.ch>0){a.ch-=dt;steer(e,a.fx,a.fy,e.speed*k*2.8,e.speed*12,dt);if(e.bumped||a.ch<=0){a.ch=0;a.rest=.5;IS.fx&&e.bumped&&IS.fx.shake(2,.12)}return}
    const px=c.player.x-e.x,py=c.player.y-e.y,ahead=px*a.fx+py*a.fy,side=Math.abs(px*a.fy-py*a.fx)
    if(ahead>0&&ahead<420&&side<28){a.ch=1.1;c.sfx&&c.sfx('charge');return}
    a.t-=dt
    if(e.bumped||a.t<=0){
      const toward=Math.abs(px)>Math.abs(py)?[Math.sign(px),0]:[0,Math.sign(py)]
      const opts=CARD.filter(d=>!(e.bumped&&d[0]===a.fx&&d[1]===a.fy))
      const d=c.range(0,1)<.5&&!(e.bumped&&toward[0]===a.fx&&toward[1]===a.fy)?toward:c.pick(opts)
      a.fx=d[0];a.fy=d[1];a.t=c.range(1.2,2.6)}
    steer(e,a.fx,a.fy,e.speed*k*.7,e.speed*6,dt)}
  // Gooey enemies collapse instead of dying and stand back up unless hit while down.
  function globin(e,dt,c){const a=e.ai;if(a.goo>0){a.goo-=dt;stop(e,dt);e.harmless=true;e.variant=1;if(a.goo<=0){a.goo=0;e.hp=e.maxHp*.6;e.harmless=false;e.variant=0;IS.fx&&IS.fx.poof(e.x,e.y,'#3b3027')}return}e.variant=0;chase(e,dt,c,1)}
  // Wall hugger: slides round the room's edge, firing as it passes.
  function hugger(e,dt,c){if(gun(e,dt,c,aimed)){stop(e,dt);return}const room=e.room||c.room,m=e.r+6,W=room.pxW,H=room.pxH,a=e.ai;if(a.dir==null)a.dir=1;if(e.bumped)a.dir=-a.dir
    const tx=IS.clamp(e.x,m,W-m),ty=IS.clamp(e.y,m,H-m),dl=e.x-m,dr=W-m-e.x,dtp=e.y-m,db=H-m-e.y,k=Math.min(dl,dr,dtp,db)
    let vx=0,vy=0;if(k>10){if(k===dl)vx=-1;else if(k===dr)vx=1;else if(k===dtp)vy=-1;else vy=1}
    else if(dtp<=10&&dr>10){vx=1}else if(dr<=10&&db>10){vy=1}else if(db<=10&&dl>10){vx=-1}else vy=-1
    if(k<=10){vx*=a.dir;vy*=a.dir}steer(e,vx,vy,e.speed,e.speed*6,dt)}
  function mulligan(e,dt,c){const a=e.ai,d=distPlayer(e,c);if(a.side==null)a.side=c.chance(.5)?1:-1;if(e.bumped)a.side=-a.side
    if(gun(e,dt,c,(e,c)=>{spawnKid(e,c,P(e,'spawns','fly'),P(e,'spawnCap',3))},P(e,'fireDelay',2.8))){stop(e,dt);return}
    if(d<240){const n=toPlayer(e,c);steer(e,-n.x-n.y*.7*a.side,-n.y+n.x*.7*a.side,e.speed*1.15,e.speed*5,dt)}else if(d>420)chase(e,dt,c,.6);else wander(e,dt,c,.5)}
  function clotty(e,dt,c){if(gun(e,dt,c,cross)){stop(e,dt);return}e.ai.hop=(e.ai.hop==null?c.range(0,1):e.ai.hop)+dt;if(e.ai.hop%1<.45)wander(e,dt,c,1.5);else stop(e,dt)}
  // --- families: parametrised behaviours the table below maps ids onto ---------
  const fan=(n,sp,o)=>(e,c)=>shoot(e,c,Object.assign({count:n,spread:sp},o))
  const ring=(n,o)=>(e,c)=>{for(let i=0;i<n;i++)shoot(e,c,Object.assign({angle:i*6.283/n+(n%4?0:.39)},o))}
  // fires along whichever axis the player is nearest to (Spitty, Grimace)
  const axis=(e,c)=>{const dx=c.player.x-e.x,dy=c.player.y-e.y;shoot(e,c,{angle:Math.abs(dx)>Math.abs(dy)?(dx>0?0:Math.PI):(dy>0?Math.PI/2:-Math.PI/2)})}
  const home=(e,c)=>shoot(e,c,{homing:2.2,speed:200,life:3.2})
  const laser=(n,sp)=>(e,c)=>{for(let i=0;i<n;i++)c.spawnLaser({x:e.x,y:e.y,angle:IS.angleTo(e.x,e.y,c.player.x,c.player.y)+(i-(n-1)/2)*(sp||0),len:1400,width:16,life:.35,dmg:1,friendly:false})}
  const W=m=>(e,d,c)=>chase(e,d,c,m)
  const still=(fn,dl)=>(e,d,c)=>{stop(e,d);gun(e,d,c,fn,dl)}
  const plod=(m,fn,dl)=>(e,d,c)=>{if(gun(e,d,c,fn,dl))stop(e,d);else wander(e,d,c,m)}
  const chaseGun=(m,fn,dl)=>(e,d,c)=>{if(gun(e,d,c,fn,dl))stop(e,d);else chase(e,d,c,m)}
  const flyGun=(fn,dl,mv)=>(e,d,c)=>{if(gun(e,d,c,fn,dl))stop(e,d);else(mv||flyDrift)(e,d,c)}
  const B=(f,o)=>(e,d,c)=>{if(o&&!e.po)e.po=o;f(e,d,c)}
  const hop=(o,big)=>B((e,d,c)=>leaper(e,d,c,big),o)
  const nest=(kind,cap,dl)=>B(summoner,{spawns:kind,spawnCap:cap,fireDelay:dl})
  const K=n=>(e,d,c)=>map[n](e,d,c)
  const ground=f=>(e,d,c)=>{e.flying=false;f(e,d,c)}
  // creep-laying walkers (fire and gut trails)
  function trailW(e,dt,c,m,life){chase(e,dt,c,m);e.ai.cr=(e.ai.cr||0)-dt;if(e.ai.cr<=0){e.ai.cr=.3;c.spawnCreep(e.x,e.y,20,{life:life||2,dmg:1})}}
  // erratic start-stop scuttling (Spiders, Rock Spiders)
  function skitter(e,dt,c,m){const a=e.ai;a.t=(a.t==null?c.range(.2,.5):a.t)-dt;if(a.t<=0){a.go=!a.go;a.t=a.go?c.range(.25,.5):c.range(.1,.25)}if(a.go)chase(e,dt,c,m||1.1);else stop(e,dt)}
  // Leeches crawl, and when you line up on an axis they flinch and lunge.
  function leech(e,dt,c){const a=e.ai
    if(a.dash>0){a.dash-=dt;steer(e,a.dx,a.dy,e.speed*P(e,'lunge',3.2),e.speed*14,dt);if(e.bumped)a.dash=0;if(a.dash<=0)a.rest=.5;return}
    if(a.rest>0){a.rest-=dt;stop(e,dt);return}
    if(a.wind){stop(e,dt);if(windup(e,dt,.3)){a.wind=false;a.dash=.4}return}
    chase(e,dt,c,.55);a.cd=(a.cd||0)-dt
    const dx=c.player.x-e.x,dy=c.player.y-e.y,lane=e.r+c.player.r*.5
    if(a.cd<=0&&distPlayer(e,c)<340&&(Math.abs(dx)<lane||Math.abs(dy)<lane)&&sees(e.room||c.room,e.x,e.y,c.player.x,c.player.y)){a.cd=c.range(1.2,2);a.wind=true;if(Math.abs(dx)<lane){a.dx=0;a.dy=IS.sign(dy)}else{a.dx=IS.sign(dx);a.dy=0}}}
  // Kamikaze Leech runs at you and blows itself up on contact.
  function kamikaze(e,dt,c){chase(e,dt,c,1.15);if(distPlayer(e,c)<e.r+c.player.r+4)IS.killEnemy(e,c)}
  // Hosts and Red Hosts are invulnerable while closed; they rise, fire, and shut again.
  function host(e,dt,c,fn){const a=e.ai;stop(e,dt);if(a.t==null)a.t=c.range(.6,1.6)
    if(a.open>0){a.open-=dt;if(!a.shot&&a.open<.75){a.shot=1;fn(e,c)}if(a.open<=0){e.invuln=true;e.variant=0;a.t=c.range(1.4,2.2)}return}
    e.invuln=true;e.variant=0;a.t-=dt;if(a.t<=0){a.open=1.3;a.shot=0;e.invuln=false;e.variant=1}}
  // Mom's Hand: tracks you unseen, flashes a shadow, then slams down and lingers.
  function hand(e,dt,c){const a=e.ai;e.flying=true;if(a.s==null){a.s=0;a.t=c.range(1,2)}a.t-=dt
    if(a.s===0){e.hidden=true;e.harmless=true;const n=toPlayer(e,c);steer(e,n.x,n.y,e.speed*1.4,e.speed*5,dt);if(a.t<=0){a.s=1;a.t=.7}return}
    if(a.s===1){stop(e,dt);a.telegraph=1-a.t/.7;if(a.t<=0){a.s=2;a.t=P(e,'stay',1.6);e.hidden=false;e.harmless=false;a.telegraph=0;IS.fx&&IS.fx.shake(3,.15);c.sfx&&c.sfx('stomp')}return}
    stop(e,dt);if(a.t<=0){a.s=0;a.t=c.range(1.5,2.5)}}
  // Evil Twin mirrors you across the room's centre and fires back.
  function twin(e,dt,c){const room=e.room||c.room,tx=room.pxW-c.player.x,ty=room.pxH-c.player.y,n=IS.norm(tx-e.x,ty-e.y);if(gun(e,dt,c,fan(2,.3),1.6)){stop(e,dt);return}steer(e,n.x,n.y,Math.min(e.speed,IS.dist(e.x,e.y,tx,ty)*4),e.speed*6,dt)}
  // Keepers hop at you and fire a pair of tears between hops.
  function keeper(e,dt,c){const a=e.ai;leaper(e,dt,c,false);a.kf=(a.kf==null?c.range(.8,1.6):a.kf)-dt;if(a.kf<=0&&!a.air){a.kf=c.range(1.4,2.2);shoot(e,c,{count:2,spread:.3})}}
  const SINS={sloth:chaseGun(.7,aimed,2.4),'super-sloth':chaseGun(.9,fan(3,.3),2),lust:plod(.9,fan(3,.3),2),'super-lust':plod(1,ring(6),2.2),gluttony:chaseGun(.6,ring(8),2.6),'super-gluttony':chaseGun(.7,ring(8),2),wrath:K('bomber'),'super-wrath':(e,d,c)=>{map.bomber(e,d,c);chase(e,d,c,.4)},envy:W(.9),'super-envy':W(1.1),pride:flyGun(fan(3,.3),2.2,flyChase),'super-pride':flyGun(ring(8),2.4,flyChase),'ultra-pride':flyGun(ring(8),1.8,flyChase),greed:nest('fly',3,3),'super-greed':nest('attackfly',3,2.6)}
  const BEH={
    // basement, cellar, burning basement
    gaper:W(1), 'frowning-gaper':W(1), 'flaming-gaper':(e,d,c)=>trailW(e,d,c,1,1.4), 'poppy-gaper':W(1),
    pooter:flyGun(aimed,null), 'super-pooter':flyGun(fan(2,.3),1.6),
    fatty:W(1), 'flaming-fatty':(e,d,c)=>trailW(e,d,c,1,1.6), 'gutted-fatty':chaseGun(1,fan(3,.3),2.6),
    horf:still(aimed), 'blue-horf':still(aimed),
    clotty, 'grilled-clotty':clotty, 'i-blob':clotty,
    hopper:hop(null), trite:hop({hopDelay:.3,hopReach:230,hopTime:.4,hopHeight:55}), heart:hop(null), roundy:hop({hopDelay:.9,hopReach:170}), 'flaming-hopper':hop(null),
    leaper:hop({hopDelay:.9,hopReach:290,hopTime:.55,hopHeight:90}), splasher:hop(null,true), blurb:hop(null,true),
    fly:flyDrift, attackfly:flyChase, pot:flyDrift, dinga:bouncer,
    squirt:nest('dip',2,3.2), dip:W(.9), 'dank-dip':W(1),
    charger:charger, 'drowned-charger':charger, 'blind-creep':charger, snapper:charger,
    'boom-fly':bouncer, 'red-boom-fly':bouncer, 'drowned-boom-fly':bouncer, 'fly-bomb':bouncer, 'ultra-coin':bouncer,
    sucker:flyChase, 'blue-sucker':flyChase, 'soul-sucker':flyChase,
    spit:plod(.4,axis,1.8), spitty:plod(.4,axis,1.8), drop:plod(.5,aimed,2),
    mulligan, mulliboom:B(mulligan,{spawns:'fly',spawnCap:2,fireDelay:3.2}), gusher:(e,d,c)=>wander(e,d,c,1), maggot:(e,d,c)=>wander(e,d,c,1),
    baby:chaseGun(.6,aimed,2.4), cyclopia:plod(.5,fan(3,.3),2.4), mask:plod(.6,fan(3,.25),2.2),
    host:(e,d,c)=>host(e,d,c,aimed), 'red-host':(e,d,c)=>host(e,d,c,fan(3,.3)),
    // maws
    maw:plod(.35,aimed,1.8), 'mr-maw':plod(.5,aimed,2), 'psychic-maw':plod(.35,home,2.2), 'black-maw':plod(.4,fan(3,.3),2), 'blue-maw':plod(.35,aimed,2), 'gaping-maw':still(aimed,2),
    'nerve-ending':ground((e,d)=>stop(e,d)),
    // worms and burrowers
    mole:B(burrower,{pattern:'aimed'}), 'round-worm':B(burrower,{pattern:'aimed'}), 'night-crawler':B(burrower,{pattern:'aimed'}), 'cod-worm':K('burrower'), needle:K('burrower'), 'tainted-round-worm':K('burrower'),
    fissure:K('burrower'), gurgle:K('burrower'), 'handsome-gurgle':K('burrower'), lump:K('burrower'), 'the-thing':K('burrower'),
    'para-bite':flyChase,
    // leeches and long legs
    leech, 'small-leech':B(leech,{lunge:2.4}), 'black-leech':leech, 'red-leech':B(leech,{lunge:3.6}), 'kamikaze-leech':kamikaze,
    'baby-long-legs':W(.7), 'crazy-long-legs':W(.8),
    grackle:plod(.4,fan(3,.25),2),
    // caves and catacombs
    hive:nest('attackfly',3,2.4), 'drowned-hive':nest('attackfly',3,3), nest:nest('fly',2,2.6), sack:nest('fly',3,3), 'fat-sack':nest('fly',4,3), 'sack-of-sacks':nest('fly',4,2.8),
    chubber:plod(.4,fan(3,.3),2.2), prey:nest('attackfly',3,3.2), membrane:nest('attackfly',3,3.2), 'walking-sack':nest('attackfly',3,3.2),
    vis:plod(.35,laser(1),2.6), 'double-vis':plod(.4,laser(2,.45),2.8),
    globin, 'black-globin':globin, 'blue-globin':globin,
    bony:plod(.6,aimed), 'black-bony':plod(.6,fan(2,.3),1.8), revenant:flyGun(cross,2.4), 'spiked-revenant':flyGun(ring(8),2.6),
    homunculus:plod(.5,cross,2.4), tumor:flyGun(cross,2.4), 'blue-tumor':flyGun(cross,2.4),
    'camillo-jr':K('spinner'),'eternal-fly':B(flyDrift,{pull:.5}), swarmer:K('grid'),
    boil:still(aimed,1.4), 'blue-boil':still(aimed,1.4), gut:plod(.5,aimed,2.2), 'walking-boil':plod(.5,aimed,2.2),
    'rock-spider':skitter, 'tinted-rock-spider':skitter,
    'wall-creep':hugger, 'rage-creep':B(hugger,{fireDelay:1.4}), 'wall-hugger':hugger, whipper:hugger, pincushion:hugger, 'mr-mine':hugger, grudge:K('wallHugger'),
    ministro:flyGun(fan(3,.3),2.2), poly:K('teleporter'), 'ash-pile':K('ghost'), cinder:K('exploder'), 'molten-baby':K('flyerChase'), 'coal-boy':K('spinner'),
    faceless:(e,d,c)=>trailW(e,d,c,.9,2.4), stonehead:still(aimed,1.8), 'ball-and-chain':W(1), gurgling:still(aimed,1.8), oob:K('shooterMobile'), dust:K('shielded'),
    bishop:plod(.4,fan(3,.25),2), 'quake-grimace':still(axis,2.2),
    // depths, necropolis, dank depths
    knight:(e,d,c)=>knight(e,d,c,1), 'selfless-knight':(e,d,c)=>knight(e,d,c,1.15), 'floating-knight':(e,d,c)=>{e.flying=true;knight(e,d,c,.9)}, 'loose-knight':(e,d,c)=>knight(e,d,c,1),
    brain:chaseGun(.8,cross,2.8), guts:(e,d,c)=>trailW(e,d,c,.8,2.5), imp:K('teleporter'), wizoob:K('teleporter'),
    grimace:still(axis,2.2), 'stone-grimace':still(ring(4),2.6), 'vomit-grimace':still(fan(3,.3),2.2),
    'red-ghost':flyGun(ring(8),2.6,flyChase), poof:K('ghost'), 'lil-haunt':K('ghost'), reaper:K('ghost'),
    fred:K('flyerChase'), 'poison-mind':flyGun(fan(3,.3),2.4), ragling:W(1.1), 'blood-feeder':W(1.1), 'blood-hulk':W(1),
    'deaths-head':flyChase, 'cursed-deaths-head':flyChase, 'hell-bird':K('flyerDart'), 'grudge-bat':K('flyerDart'), 'fat-bat':K('flyerDart'),
    'sanguine-bond':plod(.5,aimed,2.2), 'blood-puppy':(e,d,c)=>chase(e,d,c,e.hp<e.maxHp*.5?1.5:1), 'lil-blub':W(.8),
    'bloodshot-eye':still(aimed), 'conjoined-fatty':chaseGun(.7,cross,2.4), 'blue-conjoined-fatty':chaseGun(.7,cross,2.4), 'blue-fatty':W(1), 'bloated-fatty':(e,d,c)=>trailW(e,d,c,.9,2),
    swinger:K('flyerOrbit'), 'corn-mine':K('spinner'), camillo:K('wanderer'), 'flesh-maiden':plod(.5,fan(3,.3),2.4), tissue:chaseGun(.6,cross,2.6),
    'moms-hand':hand, 'moms-dead-hand':B(hand,{stay:2.2}), keeper, 'holy-keeper':keeper, 'stone-eye':still(aimed,1.8), 'brimstone-head':still(laser(1),2.8), 'red-floater':flyDrift,
    // womb, utero, scarred womb, corpse and beyond
    'locust-of-famine':flyChase, 'locust-of-pestilence':flyChase, 'locust-of-war':flyChase, 'locust-of-death':flyChase,
    willo:flyGun(aimed,2.2), hanger:flyDrift, 'one-tooth':flyGun(fan(3,.3),2.4), 'eternal-heart-fly':flyDrift,
    'big-bony':chaseGun(.7,fan(3,.3),2.4), null:K('teleporter'), 'angelic-baby':flyGun(fan(3,.3),2.4), 'holy-bony':plod(.6,aimed),
    vassal:plod(.5,ring(8),2.6), 'blue-gaper':W(1.05), 'evil-twin':twin, begotten:plod(.5,cross,2.2)
  }
  Object.assign(BEH,SINS);IS.enemyBehaviours=BEH
  const GUARDED={knight:1,'selfless-knight':1,'floating-knight':1,'loose-knight':1}
  const REGEN={globin:1,'black-globin':1,'blue-globin':1}
  // Isaac's knights shrug off anything that hits their front; globins collapse.
  // This wraps the base damage rule (entity.js) rather than replacing it.
  const baseDamage=IS.damageEnemy
  IS.damageEnemy=(e,dmg,opts,ctx)=>{
    if(e&&!e.dead&&!e.boss&&!e.invuln&&e.ai){
      const s=opts&&opts.src
      if(GUARDED[e.id]&&s&&(s.vx||s.vy)&&e.ai.fx!=null&&!(e.spawnT>0)){const n=IS.norm(s.vx,s.vy);if(n.x*e.ai.fx+n.y*e.ai.fy<-.35){if(ctx&&ctx.sfx)ctx.sfx('tear-hit');return false}}
      if(REGEN[e.id]&&!(e.ai.goo>0)&&e.hp-(dmg||0)<=0){e.ai.goo=P(e,'gooTime',2.8);e.hp=1;e.hurtT=.1;e.harmless=true;e.variant=1;if(IS.fx)IS.fx.blood(e.x,e.y,8,'#2a211a');if(ctx&&ctx.sfx)ctx.sfx('enemy-hurt');return false}
    }
    return baseDamage(e,dmg,opts,ctx)
  }

  // death throes, by id (never by archetype: a Psychic Maw is not a bomb)
  const diag=(e,c)=>{for(let i=0;i<4;i++)IS.enemyShoot(e,{angle:i*Math.PI/2+Math.PI/4,speed:240},c)}
  const orth=(e,c)=>{for(let i=0;i<4;i++)IS.enemyShoot(e,{angle:i*Math.PI/2,speed:230},c)}
  const boom=(e,c)=>IS.bombExplode(e.x,e.y,{dmg:40,r:100,hurtsPlayer:true},c)
  const DEATH={
    mulligan:(e,c)=>burst(e,c,'fly',3), hive:(e,c)=>burst(e,c,'attackfly',2), 'drowned-hive':(e,c)=>burst(e,c,'attackfly',2), nest:(e,c)=>burst(e,c,'fly',2),
    'walking-sack':(e,c)=>burst(e,c,'attackfly',2), 'deaths-head':diag, 'cursed-deaths-head':diag, gusher:orth,
    sucker:diag, 'blue-sucker':diag, 'soul-sucker':diag,
    'boom-fly':boom, 'red-boom-fly':(e,c)=>{boom(e,c);orth(e,c)}, 'drowned-boom-fly':boom, 'fly-bomb':boom, mulliboom:boom, 'locust-of-war':boom, 'kamikaze-leech':boom,
    'mr-maw':(e,c)=>burst(e,c,'maw',1), 'baby-long-legs':(e,c)=>burst(e,c,'small-leech',2), 'crazy-long-legs':(e,c)=>burst(e,c,'small-leech',3),
    chubber:(e,c)=>burst(e,c,'maggot',2), 'poppy-gaper':(e,c)=>burst(e,c,'fly',1), 'sack-of-sacks':(e,c)=>burst(e,c,'fly',3), 'fat-sack':(e,c)=>burst(e,c,'fly',2), sack:(e,c)=>burst(e,c,'fly',2)
  }
  // a champion's colour adds its own death effect on top
  const CHAMP_DEATH=(e,c)=>{const t=IS.CHAMPIONS[e.champion];if(!t)return;if(t.deathRing)for(let i=0;i<8;i++)IS.enemyShoot(e,{angle:i*Math.PI/4,speed:240},c);if(t.splash)diag(e,c);if(t.explode)boom(e,c);if(t.ghostOnDeath&&IS.enemiesById.poof)burst(e,c,'poof',1);if(t.creep)c.spawnCreep(e.x,e.y,50,{life:5,dmg:1})}
  IS.enemyDeathRattle=(e,ctx)=>{if(!ctx||e.boss)return;const f=DEATH[e.id];if(f)f(e,ctx);if(e.champion)CHAMP_DEATH(e,ctx)}

  // A charmed enemy fights for Isaac: it chases the nearest other enemy (a baited one first) and bites it.
  function charmFight(e,room,dt,ctx){let best=null,bd=1e9;for(const o of room.enemies){if(o===e||o.dead||o.status.charm||o.hidden||o.spawnT>0)continue;const d=IS.dist(e.x,e.y,o.x,o.y)-(o.status.baited?400:0);if(d<bd){bd=d;best=o}}if(!best)return false
    const n=IS.norm(best.x-e.x,best.y-e.y);steer(e,n.x,n.y,e.speed||90,(e.speed||90)*5,dt);e.ai.bite=(e.ai.bite||0)-dt;if(e.ai.bite<=0&&IS.entityHit(e,best)){e.ai.bite=.5;IS.damageEnemy(best,Math.max(1,e.dmg||1),{silent:true},ctx)}return true}
  IS.updateEnemies=(room,dt,ctx)=>{
    // Walking into a room: everything in it is already awake, so Isaac gets a short
    // window of invulnerability instead of the enemies being frozen.
    if(room!==liveRoom){liveRoom=room;room.ticked=false;const p=ctx.player;if(p&&room.enemies.length)p.invulnUntil=Math.max(p.invulnUntil||0,(ctx.run&&ctx.run.time||0)+ENTRY_IFRAMES)}
    for(const e of room.enemies){
      if(e.dead)continue
      if(e.hurtT>0)e.hurtT=Math.max(0,e.hurtT-dt)
      e.frame+=dt*8
      if(e.spawnT>0){e.spawnT-=dt;e.vx*=.8;e.vy*=.8;IS.moveEntity(e,dt,room,ctx);continue}
      IS.updateStatuses(e,dt,ctx);if(IS.isStopped(e)){e.vx=0;e.vy=0;IS.moveEntity(e,dt,room,ctx);continue}
      if(!e.boss&&(e.status.fear||e.status.confusion||e.status.charm)){if(e.status.fear){const n=toPlayer(e,ctx);steer(e,-n.x,-n.y,e.speed||90,(e.speed||90)*5,dt)}else if(e.status.charm&&charmFight(e,room,dt,ctx))null;else wander(e,dt,ctx,.6)}
      else if(e.boss)IS.updateBoss(e,dt,ctx);else(BEH[e.id]||IS.archetypes[e.def.archetype]||map.wanderer)(e,dt,ctx)
      if(e.vx)e.dir=e.vx<0?-1:1
      if(e.champion==='green'&&!e.harmless){e.ai.gc=(e.ai.gc||0)-dt;if(e.ai.gc<=0){e.ai.gc=.5;ctx.spawnCreep(e.x,e.y,18,{life:3,dmg:1})}}
      IS.moveEntity(e,dt,room,ctx);if(!e.status.charm)IS.enemyContactDamage(e,ctx.player,ctx)
    }
    IS.separateEnemies(room.enemies);room.ticked=true
    if(room.markers&&room.markers.length){for(const m of room.markers)m.t+=dt;room.markers=room.markers.filter(m=>m.t<m.dur)}
    room.enemies=room.enemies.filter(e=>!e.dead)
  }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
