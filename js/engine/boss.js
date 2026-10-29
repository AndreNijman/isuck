;(function (IS) {
  'use strict'
  // Every boss attack is a little script over its own clock, `s.t`. Each one opens
  // with a windup the player can read (b.ai.telegraph swells the sprite; floor
  // markers show where something will land), and any state an attack changes on
  // the boss is put back by `s.undo` when it ends, so nothing leaks between attacks.
  IS.bossPhaseFor=b=>{const frac=b.hp/b.maxHp;return (b.def.phases||[]).find(p=>frac>=(p.hpAbove||0))||(b.def.phases||[]).slice(-1)[0]||{attacks:['aimedShot'],cooldown:[1,2]}}
  IS.startAttack=(b,name,ctx)=>{b.attack=name;b.attackState={t:0};b.attackT=0;return !!IS.attacks[name]}
  const endAttack=IS.endBossAttack=b=>{const s=b.attackState;if(s&&s.undo)s.undo();if(b.def&&b.def.r)b.z=0;if(s&&s.lasers)s.lasers.forEach(l=>{l.life=0});b.ai.telegraph=0;b.attack=null;b.attackState=null}
  IS.updateBoss=(b,dt,ctx)=>{const B=BESPOKE[b.def.id],phase=IS.bossPhaseFor(b)
    if(B&&B.setup&&once(b.ai,'setup'))B.setup(b,ctx)
    if(phase!==b.ai.phase){if(b.ai.phase&&IS.fx){IS.fx.shake(6,.4);IS.fx.flash('rgba(255,255,255,.25)',.12);ctx.sfx&&ctx.sfx('boss-roar')}b.ai.phase=phase;b.speed=(b.baseSpeed||b.speed)*(phase.speedMult||1)}
    if(B&&B.tick)B.tick(b,dt,ctx)
    if(b.attack){const fn=(B&&B.atk&&B.atk[b.attack])||IS.attacks[b.attack];b.attackState.t+=dt;if(!fn||fn(b,dt,b.attackState,ctx)){endAttack(b);b.attackT=ctx.range(...(phase.cooldown||[1,2]))}}
    else{(B&&B.move||drift)(b,dt,ctx);b.attackT-=dt;if(b.attackT<=0)IS.startAttack(b,ctx.rng.pickWeighted(phase.attacks||['aimedShot'],phase.weights||[]),ctx)}}
  // between attacks a boss closes the distance, but never sits on the player
  function drift(b,dt,c){const d=IS.dist(b.x,b.y,c.player.x,c.player.y),n=IS.norm(c.player.x-b.x,c.player.y-b.y),s=d>220?b.speed*.55:-b.speed*.25;b.vx=IS.approach(b.vx,n.x*s,b.speed*3*dt);b.vy=IS.approach(b.vy,n.y*s,b.speed*3*dt)}

  const room=c=>c.room||c.run.room
  const tele=(b,s,secs)=>{if(s.t<secs){b.ai.telegraph=s.t/secs;b.vx*=.85;b.vy*=.85;return false}b.ai.telegraph=0;return true}
  const once=(s,k)=>s[k]?false:(s[k]=true)
  const at=(s,dt,time)=>s.t>=time&&s.t-dt<time
  const aim=(b,c)=>IS.angleTo(b.x,b.y,c.player.x,c.player.y)
  const fire=(b,c,o)=>IS.enemyShoot(b,Object.assign({speed:270},o),c)
  const ring=(b,c,n,o)=>{const off=(o&&o.off)||0;for(let i=0;i<n;i++)fire(b,c,Object.assign({},o,{angle:off+i*Math.PI*2/n}))}
  const marker=(c,x,y,r,dur)=>{const R=room(c);(R.markers||(R.markers=[])).push({x,y,r,t:0,dur});return{x,y,r}}
  const slam=(c,x,y,r,shake)=>{const p=c.player;if(p&&!p.dead&&IS.dist(x,y,p.x,p.y)<r+p.r*.6&&IS.damagePlayer(p,1,{name:'a slam'},c))IS.knockback(p,x,y,600);if(IS.fx){IS.fx.ring(x,y,{colour:'#e8d6b8',r0:r*.3,r1:r*1.3,life:.3,width:6,layer:'under'});IS.fx.particles({x,y,n:10,colour:'#8a7461',speed:200,life:.4,size:5,drag:3});IS.fx.shake(shake||6,.25)}c.sfx&&c.sfx('stomp')}
  const minionIds=c=>{const pool=((c.run.floor&&c.run.floor.def&&c.run.floor.def.enemyPool)||[]).filter(id=>IS.enemiesById[id]);const flies=pool.filter(id=>/fly|pooter/.test(id));return flies.length?flies:['attackfly','pooter','fly'].filter(id=>IS.enemiesById[id])}
  const minions=(b,c)=>room(c).enemies.filter(e=>!e.dead&&e.spawnedBy===b).length
  const summon=(b,c,n,where,id)=>{const ids=id&&IS.enemiesById[id]?[id]:minionIds(c);for(let i=0;i<n;i++){if(minions(b,c)>=5)return;const p=where?where():{x:b.x+c.range(-40,40),y:b.y+c.range(-40,40)};const m=c.spawnEnemy(c.pick(ids),p.x,p.y);if(m){m.spawnedBy=b;m.spawnT=.45;IS.fx&&IS.fx.poof(p.x,p.y,'#7d6a5a')}}}
  const laser=(b,c,s,o)=>{const l=c.spawnLaser(Object.assign({x:b.x,y:b.y,len:1600,width:26,life:9,dmg:1,friendly:false},o));(s.lasers||(s.lasers=[])).push(l);return l}
  const beam=(b,c,s,o)=>{const L=laser(b,c,s,Object.assign({warn:true,width:4},o));return L}
  const dash=(b,c,s,speed,dur)=>{if(once(s,'dash')){const n=IS.norm(c.player.x-b.x,c.player.y-b.y);s.dx=n.x;s.dy=n.y;c.sfx&&c.sfx('charge')}b.vx=s.dx*speed;b.vy=s.dy*speed;if(b.bumped&&!s.bonk){s.bonk=true;IS.fx&&IS.fx.shake(5,.2)}return s.bonk||s.t>dur}

  const shots=(n,spread,o)=>(b,dt,s,c)=>{if(!tele(b,s,.45))return false;if(once(s,'f'))fire(b,c,Object.assign({count:n,spread},o));return s.t>.75}
  const timedRing=(n,wind)=>(b,dt,s,c)=>{if(!tele(b,s,wind||.5))return false;if(once(s,'f'))ring(b,c,n,{off:aim(b,c)});return s.t>(wind||.5)+.3}
  const stream=(dur,every,make)=>(b,dt,s,c)=>{if(!tele(b,s,.45))return false;s.e=(s.e||0)-dt;if(s.e<=0){s.e=every;make(b,c,s)}b.vx*=.8;b.vy*=.8;return s.t>.45+dur}
  const sweep=(span,dur,width)=>(b,dt,s,c)=>{if(once(s,'w')){s.a0=aim(b,c)-span/2;s.warn=beam(b,c,s,{angle:s.a0})}s.warn.x=b.x;s.warn.y=b.y;if(!tele(b,s,.7))return false;if(once(s,'l')){s.warn.life=0;s.L=laser(b,c,s,{angle:s.a0,width:width||26});c.sfx&&c.sfx('brimstone-fire');IS.fx&&IS.fx.shake(3,dur)}const k=Math.min(1,(s.t-.7)/dur);s.L.angle=s.a0+span*k;s.L.x=b.x;s.L.y=b.y;return k>=1}
  const radial=(n,spin)=>(b,dt,s,c)=>{if(once(s,'w')){s.off=aim(b,c);s.w=[];for(let i=0;i<n;i++)s.w.push(beam(b,c,s,{angle:s.off+i*Math.PI*2/n}))}if(!tele(b,s,.8))return false;if(once(s,'l')){s.w.forEach(l=>{l.life=0});s.L=[];for(let i=0;i<n;i++)s.L.push(laser(b,c,s,{angle:s.off+i*Math.PI*2/n,width:22}));c.sfx&&c.sfx('brimstone-fire');IS.fx&&IS.fx.shake(4,.6)}s.L.forEach((l,i)=>{l.angle=s.off+i*Math.PI*2/n+(s.t-.8)*(spin||0);l.x=b.x;l.y=b.y});b.vx=b.vy=0;return s.t>1.6}
  // stomp-style: mark the floor, then land on it
  const stomp=(count,spread,r,wind)=>(b,dt,s,c)=>{if(once(s,'m')){s.m=[];const a=aim(b,c);for(let i=0;i<count;i++){const k=count===1?0:i-(count-1)/2;const x=IS.clamp(c.player.x+Math.cos(a)*k*spread,r,room(c).pxW-r),y=IS.clamp(c.player.y+Math.sin(a)*k*spread,r,room(c).pxH-r);s.m.push(marker(c,x,y,r,wind+i*.12))}}b.ai.telegraph=Math.min(1,s.t/wind);s.m.forEach((m,i)=>{if(at(s,dt,wind+i*.12)){slam(c,m.x,m.y,m.r,4+count);if(count===1)ring({x:m.x,y:m.y,dmg:1},c,8,{speed:230})}});b.vx*=.85;b.vy*=.85;return s.t>wind+count*.12+.25}
  const hop=(b,dt,s,c)=>{if(!tele(b,s,.4))return false;if(once(s,'j')){s.sx=b.x;s.sy=b.y;const n=IS.norm(c.player.x-b.x,c.player.y-b.y),d=Math.min(320,IS.dist(b.x,b.y,c.player.x,c.player.y));s.tx=IS.clamp(b.x+n.x*d,b.r,room(c).pxW-b.r);s.ty=IS.clamp(b.y+n.y*d,b.r,room(c).pxH-b.r);marker(c,s.tx,s.ty,b.r*1.2,.8);b.harmless=true;s.undo=()=>{b.harmless=false;b.z=0}}const k=Math.min(1,(s.t-.4)/.8);b.x=IS.lerp(s.sx,s.tx,k);b.y=IS.lerp(s.sy,s.ty,k);b.z=Math.sin(k*Math.PI)*170;b.vx=b.vy=0;if(k>=1&&once(s,'land')){b.harmless=false;b.z=0;slam(c,b.x,b.y,b.r*1.2,8);ring(b,c,10,{speed:220,off:c.range(0,1)})}return s.t>1.45}

  // wind up with a warning line on the floor, lock the direction, charge until a wall stops you.
  // `count` charges in a row, then `end` (a volley, a summon) once.
  function multiDash(count,speed,end){return (b,dt,s,c)=>{
    if(s.mode==null){s.mode='w';s.n=0;s.t0=0;s.warn=beam(b,c,s,{angle:aim(b,c)})}
    const lt=s.t-s.t0
    if(s.mode==='w'){if(lt<=.3)s.warn.angle=aim(b,c);s.warn.x=b.x;s.warn.y=b.y;b.ai.telegraph=Math.min(1,lt/.5);b.vx*=.8;b.vy*=.8;if(lt<.5)return false
      s.a=s.warn.angle;s.warn.life=0;s.dx=Math.cos(s.a);s.dy=Math.sin(s.a);s.mode='g';s.t0=s.t;b.ai.telegraph=0;c.sfx&&c.sfx('charge');return false}
    if(s.mode==='g'){b.vx=s.dx*speed;b.vy=s.dy*speed;if((b.bumped&&lt>.12)||lt>.8){b.vx=b.vy=0;s.n++;s.mode='r';s.t0=s.t;IS.fx&&IS.fx.shake(4,.2)}return false}
    if(lt<(s.n<count?.4:.25))return false
    if(s.n>=count){if(end&&once(s,'e'))end(b,c);return lt>(end?.5:.25)}
    s.mode='w';s.t0=s.t;s.warn=beam(b,c,s,{angle:aim(b,c)});return false}}
  // like multiDash but the charge ricochets off the walls
  function bounceDash(maxB,speed,after){return (b,dt,s,c)=>{const R=room(c)
    if(s.mode==null){s.mode='w';s.warn=beam(b,c,s,{angle:aim(b,c)})}
    if(s.mode==='w'){if(s.t<=.3)s.warn.angle=aim(b,c);s.warn.x=b.x;s.warn.y=b.y;if(!tele(b,s,.55))return false;s.a=s.warn.angle;s.warn.life=0;s.dx=Math.cos(s.a);s.dy=Math.sin(s.a);s.mode='g';s.n=0;s.g0=s.t;c.sfx&&c.sfx('charge')}
    b.vx=s.dx*speed;b.vy=s.dy*speed;const m=b.r+6
    if((b.x<m&&s.dx<0)||(b.x>R.pxW-m&&s.dx>0)){s.dx=-s.dx;s.n++;IS.fx&&IS.fx.shake(3,.12)}
    if((b.y<m&&s.dy<0)||(b.y>R.pxH-m&&s.dy>0)){s.dy=-s.dy;s.n++;IS.fx&&IS.fx.shake(3,.12)}
    if(b.bumped&&s.t-(s.lb||0)>.15){s.dx=-s.dx;s.dy=-s.dy;s.lb=s.t;s.n++}
    if(s.n>=maxB||s.t-s.g0>2.2){b.vx=b.vy=0;if(after)after(b,c);return true}return false}}

  const attacks={
    hop,
    chargeDash:multiDash(1,560),
    crawlCharge:(b,dt,s,c)=>{if(s.t<.8){const n=IS.norm(c.player.x-b.x,c.player.y-b.y);b.vx=n.x*b.speed*.4;b.vy=n.y*b.speed*.4;b.ai.telegraph=s.t/.8;return false}b.ai.telegraph=0;return dash(b,c,s,640,.5)},
    dashRingCombo:(b,dt,s,c)=>{if(!tele(b,s,.5))return false;if(!s.done&&dash(b,c,s,520,.8)){s.done=true;s.end=s.t;ring(b,c,12,{speed:240})}return s.done&&s.t>s.end+.3},
    aimedShot:stream(.6,.2,(b,c)=>fire(b,c,{speed:340})),
    spreadShot:shots(5,.2),
    burstShot:stream(.7,.25,(b,c)=>fire(b,c,{count:3,spread:.12,speed:320})),
    ringShot:timedRing(12),
    spinShot:stream(1.6,.09,(b,c,s)=>{s.a=(s.a||aim(b,c))+.42;fire(b,c,{angle:s.a,speed:230});fire(b,c,{angle:s.a+Math.PI,speed:230})}),
    orbitalShots:stream(1.2,.15,(b,c,s)=>{s.a=(s.a||0)+.5;ring(b,c,3,{off:s.a,speed:200})}),
    barrage:stream(.9,.06,(b,c)=>fire(b,c,{angle:aim(b,c)+c.range(-.45,.45),speed:c.range(200,330)})),
    vomitStream:stream(1.1,.05,(b,c)=>fire(b,c,{angle:aim(b,c)+c.range(-.35,.35),speed:c.range(160,300),r:c.range(8,13)})),
    rainbowSpray:stream(1,.06,(b,c,s)=>{s.k=(s.k||0)+1;fire(b,c,{angle:aim(b,c)-1.2+((s.k*.15)%2.4),speed:250})}),
    homingShots:shots(3,.5,{speed:190,homing:1.4,life:5}),
    retreatVolley:(b,dt,s,c)=>{const n=IS.norm(b.x-c.player.x,b.y-c.player.y);if(s.t<.5){b.vx=n.x*b.speed*1.4;b.vy=n.y*b.speed*1.4;b.ai.telegraph=s.t/.5;return false}b.ai.telegraph=0;if(once(s,'f'))fire(b,c,{count:5,spread:.18,speed:300});return s.t>.8},
    tearRain:stomp(5,110,34,.8), bookRain:stomp(5,110,34,.8),
    delayedRings:(b,dt,s,c)=>{if(!tele(b,s,.45))return false;for(let i=0;i<3;i++)if(at(s,dt,.45+i*.35))ring(b,c,10,{off:i*.31,speed:210});return s.t>1.3},
    quakeRings:(b,dt,s,c)=>{if(!tele(b,s,.5))return false;for(let i=0;i<3;i++)if(at(s,dt,.5+i*.4)){slam(c,b.x,b.y,b.r*1.4,4);ring(b,c,14,{off:i*.22,speed:190})}return s.t>1.4},
    mirrorShots:(b,dt,s,c)=>{if(!tele(b,s,.5))return false;if(once(s,'f')){const R=room(c),y=c.player.y;for(const x of [20,R.pxW-20])for(let i=-1;i<=1;i++)c.spawnEnemyShot({x,y:y+i*60,angle:x<R.pxW/2?0:Math.PI,speed:260,dmg:1});IS.fx&&IS.fx.flash('rgba(160,120,220,.18)',.1)}return s.t>.8},
    wallBounceShots:shots(6,.35,{bounce:2,speed:300,life:6}),
    knifeThrow:(b,dt,s,c)=>{if(once(s,'w')){s.a=aim(b,c);s.w=beam(b,c,s,{angle:s.a})}s.w.x=b.x;s.w.y=b.y;if(!tele(b,s,.55))return false;if(once(s,'f')){s.w.life=0;fire(b,c,{angle:s.a,speed:620,count:3,spread:.09,r:11})}return s.t>.8},
    rockThrow:shots(3,.4,{speed:200,r:16}),
    laserSweep:sweep(1.4,1.1), tentacleWhip:sweep(2,.5,18),
    brimstoneBeam:sweep(0,.9,34), chargeBeam:sweep(0,1.2,44), heartBeam:sweep(0,1,34),
    laserCross:radial(4,.6), beamRing:radial(8,0),
    spawnMinions:(b,dt,s,c)=>{if(!tele(b,s,.5))return false;if(once(s,'f'))summon(b,c,2);return s.t>.8},
    summonSwarm:(b,dt,s,c)=>{if(!tele(b,s,.6))return false;if(once(s,'f')){summon(b,c,4);c.sfx&&c.sfx('boss-roar')}return s.t>.9},
    portalSpawn:(b,dt,s,c)=>{if(!tele(b,s,.6))return false;if(once(s,'f'))summon(b,c,2,()=>c.freeFloorPos());return s.t>.9},
    splitBody:(b,dt,s,c)=>{if(!tele(b,s,.6))return false;if(once(s,'f')){summon(b,c,2);ring(b,c,8,{speed:220})}return s.t>.9},
    creepPuddle:(b,dt,s,c)=>{if(!tele(b,s,.45))return false;if(once(s,'f')){c.spawnCreep(b.x,b.y,90,{life:6,dmg:1});ring(b,c,8,{speed:220})}return s.t>.75},
    groundSpikes:stomp(4,95,40,.7), stompLine:stomp(1,0,95,.9), fistSlam:stomp(3,120,60,.75),
    teleportSlam:(b,dt,s,c)=>{if(once(s,'v')){IS.fx&&IS.fx.poof(b.x,b.y,'#5a4a5f');b.hidden=true;b.harmless=true;b.invuln=true;s.undo=()=>{b.hidden=false;b.harmless=false;b.invuln=false}}if(s.t<.5)return false;if(once(s,'m')){const R=room(c);s.x=IS.clamp(c.player.x,b.r,R.pxW-b.r);s.y=IS.clamp(c.player.y,b.r,R.pxH-b.r);marker(c,s.x,s.y,b.r*1.3,.7)}if(s.t<1.2)return false;if(once(s,'l')){b.x=s.x;b.y=s.y;s.undo();slam(c,b.x,b.y,b.r*1.3,8);ring(b,c,8,{speed:220})}return s.t>1.5},
    bombDrop:(b,dt,s,c)=>{if(!tele(b,s,.4))return false;if(once(s,'f'))for(let i=0;i<3;i++)c.spawnBomb(b.x+c.range(-90,90),b.y+c.range(-90,90),{friendly:false,fuse:1.3});return s.t>.7},
    suctionPull:(b,dt,s,c)=>{if(!tele(b,s,.4))return false;const p=c.player,n=IS.norm(b.x-p.x,b.y-p.y);p.kbx=(p.kbx||0)+n.x*900*dt;p.kby=(p.kby||0)+n.y*900*dt;IS.fx&&s.t%.1<dt&&IS.fx.ring(b.x,b.y,{colour:'#c8b8e0',r0:220,r1:b.r,life:.3,width:2});if(at(s,dt,1.5))ring(b,c,12,{speed:240});return s.t>1.7},
    screamPush:(b,dt,s,c)=>{if(!tele(b,s,.5))return false;if(once(s,'f')){IS.knockback(c.player,b.x,b.y,900);IS.fx&&IS.fx.ring(b.x,b.y,{colour:'#efe3c8',r0:b.r,r1:400,life:.4,width:8});IS.fx&&IS.fx.shake(6,.3);ring(b,c,16,{speed:200})}return s.t>.9},
    chaseFast:(b,dt,s,c)=>{if(!tele(b,s,.35))return false;const n=IS.norm(c.player.x-b.x,c.player.y-b.y),sp=(b.baseSpeed||b.speed)*2;b.vx=IS.approach(b.vx,n.x*sp,sp*4*dt);b.vy=IS.approach(b.vy,n.y*sp,sp*4*dt);return s.t>1.8},
    shieldPhase:(b,dt,s,c)=>{if(once(s,'i')){b.invuln=true;b.shielded=true;s.undo=()=>{b.invuln=false;b.shielded=false}}b.vx*=.9;b.vy*=.9;if(at(s,dt,.6)||at(s,dt,1.2))ring(b,c,10,{speed:220,off:s.t});return s.t>1.4},
    phaseInvuln:(b,dt,s,c)=>{if(once(s,'i')){b.invuln=true;b.shielded=true;s.undo=()=>{b.invuln=false;b.shielded=false}}s.e=(s.e||0)-dt;if(s.e<=0){s.e=.12;s.a=(s.a||0)+.5;fire(b,c,{angle:s.a,speed:220})}return s.t>1.4}
  }

  // ---------------------------------------------------------------------------
  // Per-boss behaviour. The 45 attack names are a fixed vocabulary (tuning picks
  // which a boss uses); BESPOKE[id].atk re-scripts a name for one boss so it
  // fights like its Isaac counterpart. A boss entry may also carry:
  //   setup(b,c)  once, on the first update      move(b,dt,c)  idle movement
  //   tick(b,dt,c) every frame                   die(b,c)      when it is killed
  // ---------------------------------------------------------------------------
  const BESPOKE={}
  const place=(c,x,y,r)=>({x:IS.clamp(x,r,room(c).pxW-r),y:IS.clamp(y,r,room(c).pxH-r)})
  // a floor marker we keep hold of, so a shadow can follow the player and then lock
  const mk=(c,x,y,r,dur)=>{const R=room(c),m={x,y,r,t:0,dur};(R.markers||(R.markers=[])).push(m);return m}
  const follow=(m,c,dt,r)=>{const p=place(c,c.player.x,c.player.y,r);m.x=IS.lerp(m.x,p.x,Math.min(1,dt*6));m.y=IS.lerp(m.y,p.y,Math.min(1,dt*6))}
  const still=(b,dt)=>{b.vx=IS.approach(b.vx,0,b.speed*6*dt);b.vy=IS.approach(b.vy,0,b.speed*6*dt)}
  const wanderMove=k=>(b,dt,c)=>{b.ai.wa=(b.ai.wa==null?c.range(0,6.28):b.ai.wa)+c.range(-2.5,2.5)*dt;if(b.bumped)b.ai.wa+=Math.PI*.6;const n=IS.norm(c.player.x-b.x,c.player.y-b.y),v=IS.fromAngle(b.ai.wa,b.speed*k);b.vx=IS.approach(b.vx,v.x+n.x*b.speed*.15,b.speed*3*dt);b.vy=IS.approach(b.vy,v.y+n.y*b.speed*.15,b.speed*3*dt)}
  const weave=(k,amp)=>(b,dt,c)=>{const n=IS.norm(c.player.x-b.x,c.player.y-b.y);b.ai.w=(b.ai.w||0)+dt*2.2;const w=Math.sin(b.ai.w)*amp,sp=b.speed*k;b.vx=IS.approach(b.vx,(n.x-n.y*w)*sp,b.speed*3*dt);b.vy=IS.approach(b.vy,(n.y+n.x*w)*sp,b.speed*3*dt)}
  const dust=(b,r)=>{if(IS.fx)IS.fx.ring(b.x,b.y+b.r*.5,{colour:'#c9b9a0',r0:r*.5,r1:r*1.5,life:.25,width:4,layer:'under'})}

  // ---- Monstro: small hops, a big leap that lands on you, spat blood tears ----
  const monstro={
    move:still,
    atk:{
      hop:(b,dt,s,c)=>{const R=room(c),T=.7,i=Math.floor(s.t/T)
        if(!s.undo)s.undo=()=>{b.harmless=false;b.z=0}
        if(i>=3)return true
        const lt=s.t-i*T
        if(s.i!==i){s.i=i;const n=IS.norm(c.player.x-b.x,c.player.y-b.y),d=Math.min(160,IS.dist(b.x,b.y,c.player.x,c.player.y));s.sx=b.x;s.sy=b.y;s.tx=IS.clamp(b.x+n.x*d,b.r,R.pxW-b.r);s.ty=IS.clamp(b.y+n.y*d,b.r,R.pxH-b.r)}
        b.vx=b.vy=0
        if(lt<.2){b.ai.telegraph=lt/.2*.5;b.z=0;b.harmless=false;return false}
        b.ai.telegraph=0;const k=Math.min(1,(lt-.2)/.4);b.x=IS.lerp(s.sx,s.tx,k);b.y=IS.lerp(s.sy,s.ty,k);b.z=Math.sin(k*Math.PI)*55;b.harmless=k<1
        if(k>=1&&s.l!==i){s.l=i;b.z=0;dust(b,b.r);IS.fx&&IS.fx.shake(3,.15);c.sfx&&c.sfx('stomp')}
        return false},
      // the big leap: a shadow follows you, locks, and Monstro comes down on it in a ring of tears
      stompLine:(b,dt,s,c)=>{
        if(once(s,'m')){s.m=mk(c,c.player.x,c.player.y,b.r*1.15,1.45);s.undo=()=>{b.harmless=false;b.z=0;b.ai.telegraph=0}}
        b.vx=b.vy=0
        if(s.t<.55){b.ai.telegraph=s.t/.55;follow(s.m,c,dt,b.r);return false}
        if(once(s,'j')){s.sx=b.x;s.sy=b.y;s.tx=s.m.x;s.ty=s.m.y;b.harmless=true;b.ai.telegraph=0;c.sfx&&c.sfx('boss-roar')}
        const k=Math.min(1,(s.t-.55)/.85);b.x=IS.lerp(s.sx,s.tx,k);b.y=IS.lerp(s.sy,s.ty,k);b.z=Math.sin(k*Math.PI)*250
        if(k>=1&&once(s,'l')){b.z=0;b.harmless=false;slam(c,b.x,b.y,b.r*1.15,9);ring(b,c,10,{speed:230,off:c.range(0,1)});for(let i=0;i<6;i++)fire(b,c,{angle:aim(b,c)+c.range(-.5,.5),speed:c.range(160,300),r:11})}
        return s.t>1.8},
      // spit: mouth opens wide, then a spread of blood at you
      spreadShot:(b,dt,s,c)=>{b.vx=b.vy=0;if(!tele(b,s,.65))return false;if(once(s,'f')){const a=aim(b,c);for(let i=0;i<9;i++)fire(b,c,{angle:a+c.range(-.42,.42),speed:c.range(170,340),r:c.range(8,12)});IS.fx&&IS.fx.shake(3,.2)}return s.t>1}
    }
  }
  BESPOKE['monstro']=monstro;BESPOKE['monstro-ii']=monstro

  // ---- Worms (Larry Jr., Chub, The Hollow...): a head and a chain of bodies ----
  // Every body is a real, hittable enemy; damage to any of them lands on the head,
  // so the whole worm shares one health bar, and walking into any part hurts.
  const SEGS={'larry-jr':[8,'#7e9144'],'chub':[3,'#cfa57d'],'the-hollow':[6,'#9a3f3f'],'carrion-queen':[3,'#7e6a50'],'wormwood':[5,'#7a5a3a']}
  const segDef={id:'worm-segment',archetype:'idle',hp:1,dmg:1,speed:0,sprite:'worm-segment',name:'Worm'}
  function makeSegs(b,c){const [n,tint]=SEGS[b.def.id],R=room(c);b.segs=[];let px=b.x
    for(let i=0;i<n;i++){const r=Math.max(b.r*.45,b.r*(.86-.06*i));px-=(b.r+r)*.8;const e=IS.makeEntity(Object.assign({},segDef,{r}),px,b.y,{});e.room=R;e.segOf=b;e.variant=i;e.tint=tint;e.spawnT=0;e.dmg=b.dmg;e.flying=b.flying;R.enemies.push(e);b.segs.push(e)}}
  function followSegs(b){let p=b;for(const s of b.segs){const dx=p.x-s.x,dy=p.y-s.y,d=Math.hypot(dx,dy)||1,want=(p.r+s.r)*.8;if(d>want){s.x+=dx/d*(d-want);s.y+=dy/d*(d-want)}s.vx=s.vy=0;s.dir=b.dir;p=s}}
  const worm={
    setup:makeSegs,
    move:weave(.9,.6),
    tick:(b,dt,c)=>{if(!b.segs)return;followSegs(b);if(b.def.id==='larry-jr'||b.def.id==='chub'){b.ai.cr=(b.ai.cr||0)-dt;if(b.ai.cr<=0&&!b.hidden){b.ai.cr=.45;const t=b.segs[b.segs.length-1];c.spawnCreep(t.x,t.y,24,{life:3,dmg:1})}}},
    die:(b)=>{(b.segs||[]).forEach(s=>{s.dead=true;IS.fx&&IS.fx.poof(s.x,s.y,'#8a7a50')})}
  }
  Object.keys(SEGS).forEach(id=>{BESPOKE[id]=worm})
  {const kd=IS.killEnemy,dd=IS.damageEnemy
    IS.killEnemy=(e,c)=>{const r=kd(e,c);if(r&&e.boss){const B=BESPOKE[e.def.id];if(B&&B.die)B.die(e,c)
      // as in Isaac, the last boss falling takes everything else in the room with it
      const R=c&&(c.room||c.run&&c.run.room);if(R&&!R.enemies.some(x=>x.boss&&!x.dead&&!x.segOf))R.enemies.forEach(x=>{if(!x.dead&&!x.friendly){x.dead=true;IS.fx&&IS.fx.poof(x.x,x.y,'#7d6a5a')}})}return r}
    IS.damageEnemy=(e,n,o,c)=>{if(e&&e.segOf){const h=e.segOf;if(h.dead)return false;const t=c&&c.run?c.run.time:0;if(o&&o.silent&&h.ai.sT===t&&h.ai.sN===n)return false;h.ai.sT=t;h.ai.sN=n;const r=dd(h,n,o,c);h.segs.forEach(s=>{s.hurtT=.1});return r}
      return dd(e,n,o,c)}}

  // ---- The Duke of Flies: drifts, wears a ring of flies, shoves them out ----
  const orbiters=(b,c)=>room(c).enemies.filter(e=>!e.dead&&e.orbit===b)
  function addOrbiters(b,c,n){for(let i=0;i<n;i++){if(orbiters(b,c).length>=5)return;const m=c.spawnEnemy('attackfly',b.x,b.y);if(m){m.orbit=b;m.spawnedBy=b;m.spawnT=.3;m.def0=m.def;m.def=Object.assign({},m.def,{archetype:'idle'});IS.fx&&IS.fx.poof(b.x,b.y,'#7d6a5a')}}}
  function release(m,b){m.orbit=null;if(m.def0)m.def=m.def0;m.ai={};IS.knockback(m,b.x,b.y,950)}
  BESPOKE['the-duke-of-flies']={
    setup:(b,c)=>addOrbiters(b,c,3),
    move:wanderMove(.55),
    tick:(b,dt,c)=>{const f=orbiters(b,c);b.ai.oa=(b.ai.oa||0)+dt*2.4;f.forEach((m,i)=>{const a=b.ai.oa+i*Math.PI*2/f.length,R=b.r+44;m.x=b.x+Math.cos(a)*R;m.y=b.y+Math.sin(a)*R;m.vx=m.vy=0})},
    die:(b,c)=>{orbiters(b,c).forEach(m=>{m.dead=true;IS.fx&&IS.fx.poof(m.x,m.y,'#7d6a5a')})},
    atk:{
      summonSwarm:(b,dt,s,c)=>{if(!tele(b,s,.6))return false;if(once(s,'f')){addOrbiters(b,c,3);c.sfx&&c.sfx('boss-roar')}return s.t>.9},
      screamPush:(b,dt,s,c)=>{if(!tele(b,s,.5))return false;if(once(s,'f')){orbiters(b,c).forEach(m=>release(m,b));IS.fx&&(IS.fx.ring(b.x,b.y,{colour:'#d8cdb0',r0:b.r,r1:340,life:.4,width:8}),IS.fx.shake(5,.3));c.sfx&&c.sfx('boss-roar')}return s.t>.9}
    }
  }

  // ---- The Husk: the Caves Duke; the same fly ring, plus burped Pooters and a blood spit ----
  BESPOKE['the-husk']=Object.assign({},BESPOKE['the-duke-of-flies'],{
    atk:Object.assign({},BESPOKE['the-duke-of-flies'].atk,{
      spreadShot:(b,dt,s,c)=>{if(!tele(b,s,.5))return false;if(once(s,'f'))fire(b,c,{count:3,spread:.28,speed:260,r:11});return s.t>.8},
      spawnMinions:(b,dt,s,c)=>{if(!tele(b,s,.5))return false;if(once(s,'f'))summon(b,c,1,null,'pooter');return s.t>.8}
    })
  })

  // ---- Gemini: Contusion hounds you, Suture hangs back on a leash and shoots ----
  const suture=b=>b.role==='suture'
  BESPOKE['gemini']={
    setup:(b,c)=>{if(b.role)return;const R=room(c);b.role='contusion';const p=IS.spawnBoss(R,'gemini',IS.clamp(b.x+150,60,R.pxW-60),b.y,{role:'suture',variant:1});if(p){R.boss=b;b.mate=p;p.mate=b;p.ai.setup=true;b.hp=b.maxHp=p.hp=p.maxHp=Math.round(b.maxHp/2);p.spawnT=b.spawnT}},
    move:(b,dt,c)=>{if(!suture(b))return weave(1.1,.5)(b,dt,c);const d=IS.dist(b.x,b.y,c.player.x,c.player.y),n=IS.norm(c.player.x-b.x,c.player.y-b.y),k=d<250?-.9:d>420?.6:0;b.vx=IS.approach(b.vx,n.x*b.speed*k,b.speed*3*dt);b.vy=IS.approach(b.vy,n.y*b.speed*k,b.speed*3*dt)},
    tick:(b,dt,c)=>{const m=b.mate;if(!m||m.dead||b.ai.cut)return;if(b.hp/b.maxHp<.5||m.hp/m.maxHp<.5){b.ai.cut=m.ai.cut=true;IS.fx&&IS.fx.shake(4,.3);return}if(suture(b)){const d=IS.dist(b.x,b.y,m.x,m.y);if(d>320){const n=IS.norm(m.x-b.x,m.y-b.y);b.x+=n.x*(d-320);b.y+=n.y*(d-320)}}},
    atk:{
      chaseFast:(b,dt,s,c)=>(suture(b)?attacks.burstShot:attacks.chaseFast)(b,dt,s,c),
      aimedShot:(b,dt,s,c)=>(suture(b)?attacks.spreadShot:(s.md||(s.md=multiDash(1,540))))(b,dt,s,c)
    }
  }

  // ---- Dingle: three charges in a row, then a three-tear spread; calls Dips ----
  const dingleDash=multiDash(3,450,(b,c)=>fire(b,c,{count:3,spread:.3,speed:300,r:11}))
  BESPOKE['dingle']={
    move:weave(.5,.4),
    atk:{
      chargeDash:dingleDash,
      spawnMinions:(b,dt,s,c)=>{if(!tele(b,s,.5))return false;if(once(s,'f'))summon(b,c,3,null,'dip');return s.t>.8}
    }
  }

  // ---- floor pop-ups: dive, a hole opens under you, he bursts out of it ----
  const popUp=(ringN,hold)=>(b,dt,s,c)=>{
    if(once(s,'v')){IS.fx&&IS.fx.poof(b.x,b.y,'#5a4a3f');b.hidden=b.invuln=b.harmless=true;s.m=mk(c,c.player.x,c.player.y,b.r*1.2,1.35);s.undo=()=>{b.hidden=false;b.invuln=false;b.harmless=false;b.z=0}}
    b.vx=b.vy=0
    if(s.t<.8){follow(s.m,c,dt,b.r);return false}
    if(s.t>=1.3&&once(s,'l')){b.x=s.m.x;b.y=s.m.y;s.undo();slam(c,b.x,b.y,b.r*1.3,7);ring(b,c,ringN,{speed:225,off:c.range(0,1)})}
    return s.t>1.3+hold}
  // ---- Little Horn: troll bombs, a hole in the floor, a dash ----
  BESPOKE['little-horn']={
    atk:{
      teleportSlam:popUp(8,.5),
      bombDrop:(b,dt,s,c)=>{if(!tele(b,s,.45))return false;if(once(s,'f')){for(let i=0;i<3;i++){const a=c.range(0,6.28),d=c.range(60,170),p=place(c,c.player.x+Math.cos(a)*d,c.player.y+Math.sin(a)*d,30);mk(c,p.x,p.y,100,1.1);c.spawnBomb(p.x,p.y,{friendly:false,fuse:1.1})}}return s.t>.8}
    }
  }
  BESPOKE['pin']={atk:{teleportSlam:popUp(10,.6)}}
  // ---- Loki: blinks across the room and answers with a + or an x of shots ----
  const crossShots=(b,c)=>{const x=c.range(0,1)<.5;ring(b,c,x?8:4,{speed:240,r:11,off:x?0:Math.PI/4*(c.range(0,1)<.5?0:1)})}
  BESPOKE['loki']={
    move:weave(.35,.3),
    atk:{
      teleportSlam:(b,dt,s,c)=>{b.vx=b.vy=0
        if(once(s,'v')){IS.fx&&IS.fx.poof(b.x,b.y,'#6a3b52');b.hidden=b.invuln=b.harmless=true;s.undo=()=>{b.hidden=b.invuln=b.harmless=false}}
        if(s.t<.55)return false
        if(once(s,'m')){const R=room(c);let p=null;for(let i=0;i<12&&!p;i++){const q=place(c,c.range(b.r,R.pxW-b.r),c.range(b.r,R.pxH-b.r),b.r);if(IS.dist(q.x,q.y,c.player.x,c.player.y)>200)p=q}p=p||place(c,R.pxW-c.player.x,R.pxH-c.player.y,b.r);b.x=p.x;b.y=p.y;s.undo();IS.fx&&IS.fx.poof(b.x,b.y,'#6a3b52')}
        if(s.t>=.85&&once(s,'f'))crossShots(b,c)
        return s.t>1.2},
      ringShot:(b,dt,s,c)=>{if(!tele(b,s,.45))return false;if(once(s,'f'))crossShots(b,c);return s.t>.8},
      spawnMinions:(b,dt,s,c)=>{if(!tele(b,s,.5))return false;if(once(s,'f'))summon(b,c,2,null,'attackfly');return s.t>.8}
    }
  }

  // ---- Baby Plum: ricocheting dash, spinning spray, runs when nearly beaten ----
  BESPOKE['baby-plum']={
    move:(b,dt,c)=>{const ph=IS.bossPhaseFor(b);if(!ph.flee)return weave(.7,.5)(b,dt,c);const n=IS.norm(b.x-c.player.x,b.y-c.player.y);b.vx=IS.approach(b.vx,n.x*b.speed*1.1,b.speed*4*dt);b.vy=IS.approach(b.vy,n.y*b.speed*1.1,b.speed*4*dt)},
    atk:{dashRingCombo:bounceDash(3,520,(b,c)=>ring(b,c,8,{speed:230}))}
  }

  // ---- stationary / drifting bosses ----
  BESPOKE['gurdy']={setup:(b,c)=>{b.y=b.r+10},move:still}
  BESPOKE['gurdy-jr']={move:weave(.35,.3)}
  BESPOKE['the-haunt']={move:weave(.7,.8)}
  BESPOKE['peep']={move:wanderMove(.5)}
  BESPOKE['fistula']={move:weave(.5,.5)}
  const heart={move:still,atk:{
    ringShot:(b,dt,s,c)=>{if(!tele(b,s,.5))return false;if(at(s,dt,.5))ring(b,c,12,{off:aim(b,c),speed:230});if(at(s,dt,.78)){ring(b,c,12,{off:aim(b,c)+.26,speed:230});IS.fx&&IS.fx.shake(2,.15)}return s.t>1.1},
    spreadShot:(b,dt,s,c)=>{if(!tele(b,s,.45))return false;if(once(s,'f'))fire(b,c,{count:7,spread:.22,speed:290});return s.t>.8}
  }}
  BESPOKE['moms-heart']=heart;BESPOKE['it-lives']=heart

  // ---- Mom: a foot from above that stomps where you stand, hands from the doors ----
  const doorSpot=c=>{const R=room(c),k=c.int(4);return k<2?{x:k?R.pxW-50:50,y:R.pxH/2+c.range(-80,80)}:{x:R.pxW/2+c.range(-120,120),y:k===2?50:R.pxH-50}}
  const rise=b=>{b.hidden=true;b.invuln=true;b.harmless=true;b.z=0}
  BESPOKE['mom']={
    setup:(b,c)=>{const R=room(c);b.x=R.pxW/2;b.y=R.pxH*.42;rise(b)},
    move:b=>{rise(b);b.vx=b.vy=0},
    atk:{
      // the foot: a shadow tracks you, locks, the foot drops; it stays planted (and hittable) a while
      stompLine:(b,dt,s,c)=>{b.vx=b.vy=0
        if(once(s,'m')){s.m=mk(c,c.player.x,c.player.y,b.r*1.2,1.4);s.undo=()=>rise(b)}
        if(s.t<1)follow(s.m,c,dt,b.r)
        if(s.t>=1.1&&s.t<1.4){if(once(s,'d')){b.x=s.m.x;b.y=s.m.y;b.hidden=false}const k=(s.t-1.1)/.3;b.z=IS.lerp(420,0,k*k)}
        if(s.t>=1.4&&once(s,'l')){b.x=s.m.x;b.y=s.m.y;b.z=0;b.hidden=false;b.invuln=false;b.harmless=false;slam(c,b.x,b.y,b.r*1.25,10);ring(b,c,10,{speed:230,off:c.range(0,1)})}
        return s.t>3.7},
      // hands reach in from a wall in a line toward you
      fistSlam:(b,dt,s,c)=>{const R=room(c)
        if(once(s,'m')){const side=c.int(4),p=c.player,N=4,from=side<2?{x:side?R.pxW:0,y:p.y}:{x:p.x,y:side===2?0:R.pxH};s.h=[];for(let i=0;i<N;i++){const k=(i+1)/N,x=IS.lerp(from.x,p.x,k),y=IS.lerp(from.y,p.y,k),d=.7+i*.2;s.h.push({m:mk(c,IS.clamp(x,50,R.pxW-50),IS.clamp(y,50,R.pxH-50),58,d),d})}}
        s.h.forEach(h=>{if(at(s,dt,h.d))slam(c,h.m.x,h.m.y,h.m.r,5)});return s.t>1.7},
      // eyes open in the doorways
      spawnMinions:(b,dt,s,c)=>{if(once(s,'f'))summon(b,c,2,()=>doorSpot(c));return s.t>.8}
    }
  }

  IS.ATTACK_LIST.forEach(n=>IS.defineAttack(n,attacks[n]||shots(4,.2)))
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
