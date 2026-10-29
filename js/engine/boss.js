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
    // a phase change drops whatever it was doing; B.phase(b,phase,c) may start a transition (b.ai.tr seconds, invulnerable) of its own
    if(phase!==b.ai.phase){const first=!b.ai.phase;if(!first&&IS.fx){IS.fx.shake(6,.4);IS.fx.flash('rgba(255,255,255,.25)',.12);ctx.sfx&&ctx.sfx('boss-roar')}b.ai.phase=phase;b.speed=(b.baseSpeed||b.speed)*(phase.speedMult||1)
      if(!first){if(b.attack)endAttack(b);b.attackT=ctx.range(...(phase.cooldown||[1,2]));if(B&&B.phase)B.phase(b,phase,ctx)}}
    if(B&&B.tick)B.tick(b,dt,ctx)
    if(b.ai.tr>0){b.ai.tr-=dt;b.invuln=true;b.vx*=.8;b.vy*=.8;b.ai.telegraph=b.ai.tt?Math.min(1,1-b.ai.tr/b.ai.tt):0;if(b.ai.tr<=0){b.ai.tr=0;b.invuln=false;b.ai.telegraph=0}return}
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
  const stomp=(count,spread,r,wind)=>(b,dt,s,c)=>{if(once(s,'m')){s.m=[];const a=aim(b,c);for(let i=0;i<count;i++){const k=count===1?0:i-(count-1)/2;const x=IS.clamp(c.player.x+Math.cos(a)*k*spread,r,room(c).pxW-r),y=IS.clamp(c.player.y+Math.sin(a)*k*spread,r,room(c).pxH-r);s.m.push(marker(c,x,y,r,wind+i*.12))}}b.ai.telegraph=s.t<wind?s.t/wind:0;s.m.forEach((m,i)=>{if(at(s,dt,wind+i*.12)){slam(c,m.x,m.y,m.r,4+count);if(count===1)ring({x:m.x,y:m.y,dmg:1},c,8,{speed:230})}});b.vx*=.85;b.vy*=.85;return s.t>wind+count*.12+.25}
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

  // ---- shared pieces for the rest of the roster ----
  // spit: wind up, then n tears in a fan.  call: wind up, then summon n of one enemy.
  const spit=(n,sp,o,wind)=>(b,dt,s,c)=>{b.vx*=.8;b.vy*=.8;const w=wind||.5;if(!tele(b,s,w))return false;if(once(s,'f'))fire(b,c,Object.assign({count:n,spread:sp},o));return s.t>w+.3}
  const call=(id,n,where,wind)=>(b,dt,s,c)=>{b.vx*=.8;b.vy*=.8;const w=wind||.5;if(!tele(b,s,w))return false;if(once(s,'f')){summon(b,c,n,where,id);c.sfx&&c.sfx('boss-roar')}return s.t>w+.3}
  // volley: fn(b,c,i,s) runs n times, `gap` seconds apart, after the windup
  const volley=(n,gap,fn,wind)=>(b,dt,s,c)=>{const w=wind||.45;if(!tele(b,s,w))return false;for(let i=0;i<n;i++)if(at(s,dt,w+i*gap))fn(b,c,i,s);return s.t>w+n*gap+.2}
  const plus=(b,c,o)=>ring(b,c,4,Object.assign({off:c.range(0,1)<.5?0:Math.PI/4},o))
  // n short hops toward you; land(b,c,i) runs on each landing
  const hopper=(n,maxD,T,land,hgt)=>(b,dt,s,c)=>{const R=room(c),i=Math.floor(s.t/T)
    if(!s.undo)s.undo=()=>{b.harmless=false;b.z=0}
    if(i>=n)return true
    const lt=s.t-i*T
    if(s.i!==i){s.i=i;const q=IS.norm(c.player.x-b.x,c.player.y-b.y),d=Math.min(maxD,IS.dist(b.x,b.y,c.player.x,c.player.y));s.sx=b.x;s.sy=b.y;s.tx=IS.clamp(b.x+q.x*d,b.r,R.pxW-b.r);s.ty=IS.clamp(b.y+q.y*d,b.r,R.pxH-b.r)}
    b.vx=b.vy=0
    if(lt<.2){b.ai.telegraph=lt/.2*.5;b.z=0;b.harmless=false;return false}
    b.ai.telegraph=0;const k=Math.min(1,(lt-.2)/(T-.3));b.x=IS.lerp(s.sx,s.tx,k);b.y=IS.lerp(s.sy,s.ty,k);b.z=Math.sin(k*Math.PI)*(hgt||60);b.harmless=k<1
    if(k>=1&&s.l!==i){s.l=i;b.z=0;dust(b,b.r);IS.fx&&IS.fx.shake(3,.15);c.sfx&&c.sfx('stomp');land&&land(b,c,i)}
    return false}
  // vanish, reappear across the room, then after(b,c)
  const blink=after=>(b,dt,s,c)=>{b.vx=b.vy=0
    if(once(s,'v')){IS.fx&&IS.fx.poof(b.x,b.y,'#6a3b52');b.hidden=b.invuln=b.harmless=true;s.undo=()=>{b.hidden=b.invuln=b.harmless=false}}
    if(s.t<.55)return false
    if(once(s,'m')){const R=room(c);let p=null;for(let i=0;i<12&&!p;i++){const q=place(c,c.range(b.r,R.pxW-b.r),c.range(b.r,R.pxH-b.r),b.r);if(IS.dist(q.x,q.y,c.player.x,c.player.y)>200)p=q}p=p||place(c,R.pxW-c.player.x,R.pxH-c.player.y,b.r);b.x=p.x;b.y=p.y;s.undo();IS.fx&&IS.fx.poof(b.x,b.y,'#6a3b52')}
    if(s.t>=.85&&once(s,'f'))after(b,c)
    return s.t>1.2}
  // a boss that comes apart into smaller ones when it dies
  const kids=(b,c,id,n,hpk,rk,extra)=>{const R=room(c);for(let i=0;i<n;i++){const a=i*Math.PI*2/n+c.range(0,1),hp=Math.max(10,Math.round(b.maxHp*hpk)),k=IS.spawnBoss(R,id,IS.clamp(b.x+Math.cos(a)*b.r*.7,40,R.pxW-40),IS.clamp(b.y+Math.sin(a)*b.r*.7,40,R.pxH-40),Object.assign({r:Math.max(16,Math.round(b.r*rk)),hp,maxHp:hp},extra));if(k){k.ai.setup=true;k.spawnT=.35;IS.knockback(k,b.x,b.y,500)}}}
  // two bodies sharing a fight (each keeps half the health); the survivor speeds up
  const pair=(roles,dx,more)=>({
    setup:(b,c)=>{if(b.role)return;const R=room(c);b.role=roles[0];const p=IS.spawnBoss(R,b.def.id,IS.clamp(b.x+dx,60,R.pxW-60),b.y,{role:roles[1],variant:1});if(p){R.boss=b;b.mate=p;p.mate=b;p.ai.setup=true;b.hp=b.maxHp=p.hp=p.maxHp=Math.round(b.maxHp/2);p.spawnT=b.spawnT}},
    tick:(b,dt,c)=>{if(b.mate&&b.mate.dead&&!b.ai.rg){b.ai.rg=1;b.baseSpeed=(b.baseSpeed||b.speed)*1.35;b.speed*=1.35}more&&more(b,dt,c)}})

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
  const SEGS={'larry-jr':[8,'#7e9144'],'chub':[3,'#cfa57d'],'the-hollow':[6,'#9a3f3f'],'carrion-queen':[3,'#7e6a50'],'c-h-a-d':[3,'#b0705a']}
  const segDef={id:'worm-segment',archetype:'idle',hp:1,dmg:1,speed:0,sprite:'worm-segment',name:'Worm'}
  function makeSegs(b,c){const [n,tint]=SEGS[b.def.id],R=room(c);b.segs=[];let px=b.x
    for(let i=0;i<n;i++){const r=Math.max(b.r*.45,b.r*(.86-.06*i));px-=(b.r+r)*.8;const e=IS.makeEntity(Object.assign({},segDef,{r}),px,b.y,{});e.room=R;e.segOf=b;e.variant=i;e.tint=tint;e.spawnT=0;e.dmg=b.dmg;e.flying=b.flying;R.enemies.push(e);b.segs.push(e)}}
  function followSegs(b){let p=b;for(const s of b.segs){const dx=p.x-s.x,dy=p.y-s.y,d=Math.hypot(dx,dy)||1,want=(p.r+s.r)*.8;if(d>want){s.x+=dx/d*(d-want);s.y+=dy/d*(d-want)}s.vx=s.vy=0;s.dir=b.dir;p=s}}
  const worm={
    setup:makeSegs,
    move:weave(.9,.6),
    tick:(b,dt,c)=>{if(!b.segs)return;followSegs(b);if(b.def.id==='larry-jr'||b.def.id==='chub'||b.def.id==='c-h-a-d'){b.ai.cr=(b.ai.cr||0)-dt;if(b.ai.cr<=0&&!b.hidden){b.ai.cr=.45;const t=b.segs[b.segs.length-1];c.spawnCreep(t.x,t.y,24,{life:3,dmg:1})}}},
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

  // ---- Gemini (and Steven, Blighted Ovum): Contusion hounds you, Suture hangs back on a leash and shoots;
  // the umbilical (drawn in render.js) snaps once either is below half health ----
  const suture=b=>b.role==='suture'
  BESPOKE['gemini']={
    setup:(b,c)=>{if(b.role)return;const R=room(c);b.role='contusion';const p=IS.spawnBoss(R,b.def.id,IS.clamp(b.x+150,60,R.pxW-60),b.y,{role:'suture',variant:1});if(p){R.boss=b;b.mate=p;p.mate=b;p.ai.setup=true;b.hp=b.maxHp=p.hp=p.maxHp=Math.round(b.maxHp/2);p.spawnT=b.spawnT}},
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
  const popUp=(ringN,hold,after)=>(b,dt,s,c)=>{
    if(once(s,'v')){IS.fx&&IS.fx.poof(b.x,b.y,'#5a4a3f');b.hidden=b.invuln=b.harmless=true;s.m=mk(c,c.player.x,c.player.y,b.r*1.2,1.35);s.m.hole=true;mk(c,b.x,b.y,b.r*1.1,.9).hole='dive';s.undo=()=>{b.hidden=false;b.invuln=false;b.harmless=false;b.z=0}}
    b.vx=b.vy=0
    if(s.t<.8){follow(s.m,c,dt,b.r);return false}
    if(s.t>=1.3&&once(s,'l')){b.x=s.m.x;b.y=s.m.y;s.undo();slam(c,b.x,b.y,b.r*1.3,7);ring(b,c,ringN,{speed:225,off:c.range(0,1)});mk(c,b.x,b.y,b.r*1.1,1.8).hole='dive';after&&after(b,c,s)}
    return s.t>1.3+hold}
  // ---- Little Horn: troll bombs, a hole in the floor, a dash ----
  BESPOKE['little-horn']={
    atk:{
      teleportSlam:popUp(8,.5),
      bombDrop:(b,dt,s,c)=>{if(!tele(b,s,.45))return false;if(once(s,'f')){for(let i=0;i<3;i++){const a=c.range(0,6.28),d=c.range(60,170),p=place(c,c.player.x+Math.cos(a)*d,c.player.y+Math.sin(a)*d,30);mk(c,p.x,p.y,100,1.1);c.spawnBomb(p.x,p.y,{friendly:false,fuse:1.1})}}return s.t>.8}
    }
  }
  // ---- Loki: blinks across the room and answers with a + or an x of shots ----
  const crossShots=(b,c)=>{const x=c.range(0,1)<.5;ring(b,c,x?8:4,{speed:240,r:11,off:x?0:Math.PI/4*(c.range(0,1)<.5?0:1)})}
  BESPOKE['loki']={
    move:weave(.35,.3),
    atk:{
      teleportSlam:blink(crossShots),
      ringShot:(b,dt,s,c)=>{if(!tele(b,s,.45))return false;if(once(s,'f'))crossShots(b,c);return s.t>.8},
      spawnMinions:(b,dt,s,c)=>{if(!tele(b,s,.5))return false;if(once(s,'f'))summon(b,c,2,null,'attackfly');return s.t>.8}
    }
  }

  // ---- Baby Plum: ricocheting dash, spinning spray, runs when nearly beaten ----
  BESPOKE['baby-plum']={
    move:(b,dt,c)=>{const ph=IS.bossPhaseFor(b);if(!ph.flee)return weave(.7,.5)(b,dt,c);const n=IS.norm(b.x-c.player.x,b.y-c.player.y);b.vx=IS.approach(b.vx,n.x*b.speed*1.1,b.speed*4*dt);b.vy=IS.approach(b.vy,n.y*b.speed*1.1,b.speed*4*dt)},
    atk:{dashRingCombo:bounceDash(3,520,(b,c)=>ring(b,c,8,{speed:230}))}
  }

  BESPOKE['big-horn']=BESPOKE['little-horn']

  // ---- Chapter one and two: the rest of the roster ----
  const S=(move,atk,more)=>Object.assign({move,atk:atk||{}},more)
  // Famine: charges, shotgun spread, calls his locusts
  BESPOKE['famine']=S(weave(.8,.4),{chargeDash:multiDash(2,520),spreadShot:spit(3,.3,{speed:290,r:10}),summonSwarm:call('locust-of-famine',2)})
  // Gurdy Jr.: crawls, then ricochets off the walls; hatches Pooters
  BESPOKE['gurdy-jr']=S(weave(.35,.3),{chargeDash:bounceDash(2,520,(b,c)=>ring(b,c,6,{speed:220})),spawnMinions:call('pooter',2),spreadShot:spit(3,.25,{speed:280})})
  // Fistula: a bouncing sack of gore that bursts into two smaller Fistulas, twice over
  BESPOKE['fistula']=S(wanderMove(.8),{ringShot:timedRing(10,.5),chargeDash:spit(3,.3,{speed:300}),splitBody:spit(5,.25)},{die:(b,c)=>{const g=b.gen||0;if(g<2)kids(b,c,b.def.id,2,.4,.72,{gen:g+1})}})
  // Widow: hops about, her landings spill creep; spiderlings crawl out
  BESPOKE['widow']=S(wanderMove(.45),{hop:hopper(2,200,.8,(b,c)=>{c.spawnCreep(b.x,b.y,55,{life:6,dmg:1});ring(b,c,6,{speed:200,off:c.range(0,1)})},70),creepPuddle:attacks.creepPuddle,spawnMinions:call('maggot',3)})
  BESPOKE['the-stain']=S(still,{teleportSlam:popUp(8,.7),spawnMinions:call('dip',3),spreadShot:spit(5,.25,{speed:280})})
  // Rag Man: blinks about, rings of tears, Raglings from his rags
  BESPOKE['rag-man']=S(weave(.4,.4),{teleportSlam:blink((b,c)=>ring(b,c,8,{speed:240,r:11,off:c.range(0,1)})),spawnMinions:call('ragling',2),ringShot:timedRing(10)})
  BESPOKE['rag-mega']=S(weave(.4,.4),{teleportSlam:blink((b,c)=>ring(b,c,8,{speed:250,r:11,off:c.range(0,1)})),spawnMinions:call('ragling',2),brimstoneBeam:attacks.brimstoneBeam})
  // Turdlings burst into Turdlets
  BESPOKE['the-turdlings']=S(wanderMove(.5),{hop:hopper(2,180,.8,(b,c)=>c.spawnCreep(b.x,b.y,44,{life:5,dmg:1})),spreadShot:spit(3,.3),spawnMinions:(b,dt,s,c)=>{if(minions(b,c)>=4)return true;return call('dip',2)(b,dt,s,c)}},{die:(b,c)=>kids(b,c,'turdlet',3,.2,.7)})
  BESPOKE['turdlet']=S(wanderMove(.6),{hop:hopper(2,160,.7),spreadShot:spit(3,.3),creepPuddle:attacks.creepPuddle})
  // Teratoma, The Bloat, The Wretched, The Pile: slow, bloated, spit and spawn
  BESPOKE['teratoma']=S(weave(.3,.3),{spreadShot:spit(5,.22,{speed:260,r:11}),spawnMinions:call('tumor',2),ringShot:timedRing(10)})
  BESPOKE['the-bloat']=S(wanderMove(.4),{spreadShot:spit(5,.22),ringShot:timedRing(8),spawnMinions:call('boom-fly',2)})
  BESPOKE['the-wretched']=S(wanderMove(.35),{spreadShot:spit(3,.3),ringShot:timedRing(8),spawnMinions:call('leech',2)})
  BESPOKE['the-pile']=S(weave(.25,.3),{spawnMinions:call('dip',3),spreadShot:spit(5,.25),ringShot:timedRing(10)})
  // Chub and his kin: a straight, fast charge that leaves creep behind
  const wormAtk=(id,atk)=>{BESPOKE[id]=Object.assign({},worm,{atk})}
  wormAtk('chub',{chargeDash:multiDash(1,640),creepPuddle:attacks.creepPuddle})
  wormAtk('c-h-a-d',{chargeDash:multiDash(2,580),spreadShot:spit(3,.3,{speed:280}),creepPuddle:attacks.creepPuddle})
  wormAtk('carrion-queen',{chargeDash:multiDash(1,600),summonSwarm:call('attackfly',3),ringShot:timedRing(10)})
  wormAtk('the-hollow',{spreadShot:spit(3,.3,{speed:280}),chargeDash:multiDash(1,560),ringShot:timedRing(10)})
  // Peep: drifts about, spits, pops an eye that comes for you
  BESPOKE['peep']=S(wanderMove(.5),{spreadShot:spit(3,.28),spawnMinions:call('bloodshot-eye',2)})
  // The Haunt: drifts, spits homing tears, lets one Lil' Haunt out at a time
  BESPOKE['the-haunt']=S(weave(.7,.8),{homingShots:attacks.homingShots,spawnMinions:(b,dt,s,c)=>{if(minions(b,c)>=2)return true;return call('lil-haunt',1)(b,dt,s,c)}})
  // Gurdy and Mama Gurdy sit at the top: rings, Chargers, hands
  BESPOKE['gurdy']={setup:(b,c)=>{b.y=b.r+10},move:still,atk:{spawnMinions:call('charger',2),ringShot:timedRing(12)}}
  BESPOKE['mama-gurdy']={setup:(b,c)=>{b.y=b.r+10},move:still,atk:{spawnMinions:call('charger',2),ringShot:timedRing(14)}}
  BESPOKE['gish']=S(wanderMove(.5),{hop:hopper(2,220,.8,(b,c)=>{c.spawnCreep(b.x,b.y,50,{life:6,dmg:1});plus(b,c,{speed:240})},60),spreadShot:(b,dt,s,c)=>{b.vx*=.8;b.vy*=.8;if(!tele(b,s,.5))return false;if(once(s,'f')){plus(b,c,{speed:250});plus(b,c,{speed:200,off:Math.PI/4})}return s.t>.8},creepPuddle:attacks.creepPuddle})
  BESPOKE['lokii']=BESPOKE['loki']
  BESPOKE['the-gate']=S(still,{spinShot:attacks.spinShot,spawnMinions:call('maw',2),ringShot:timedRing(12)})
  BESPOKE['the-cage']=S(weave(.4,.4),{chargeDash:bounceDash(3,540,(b,c)=>ring(b,c,8,{speed:230})),spreadShot:spit(3,.3),ringShot:timedRing(10)})
  BESPOKE['mega-maw']=S(wanderMove(.35),{spreadShot:spit(3,.3),spawnMinions:call('attackfly',3)})
  BESPOKE['reap-creep']=S(weave(.4,.5),{spreadShot:spit(4,.3),spawnMinions:call('deaths-head',2),ringShot:timedRing(8)})
  BESPOKE['dangle']=S(weave(.5,.4),{chargeDash:bounceDash(2,500,(b,c)=>ring(b,c,8,{speed:230})),rainbowSpray:attacks.barrage,spawnMinions:call('boom-fly',2)})
  BESPOKE['the-matriarch']=S(weave(.3,.3),{hop:hopper(2,200,.8,(b,c)=>{c.spawnCreep(b.x,b.y,60,{life:6,dmg:1});ring(b,c,8,{speed:210})},60),creepPuddle:attacks.creepPuddle,summonSwarm:call('maggot',3)})
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

  // ---- Womb, Corpse and Mausoleum ----
  BESPOKE['colostomia']=S(wanderMove(.3),{vomitStream:attacks.vomitStream,spawnMinions:call('maggot',3),ringShot:timedRing(10)})
  BESPOKE['chimera']=S(weave(.6,.5),{chargeDash:bounceDash(3,540,(b,c)=>ring(b,c,8,{speed:230})),spreadShot:spit(5,.25,{speed:290}),ringShot:timedRing(10)})
  BESPOKE['rotgut']=S(still,{vomitStream:attacks.vomitStream,spawnMinions:call('maggot',3),ringShot:timedRing(12)},{setup:(b,c)=>{const R=room(c);b.x=R.pxW/2;b.y=R.pxH*.4}})
  BESPOKE['the-heretic']=S(weave(.35,.3),{teleportSlam:blink((b,c)=>fire(b,c,{count:5,spread:.22,speed:290,r:10})),spreadShot:spit(5,.22),ringShot:timedRing(10),summonSwarm:call('holy-keeper',1)})
  BESPOKE['the-visage']=S(wanderMove(.45),{homingShots:attacks.homingShots,ringShot:timedRing(12),summonSwarm:call('attackfly',3)})
  BESPOKE['the-adversary']=S(weave(.4,.4),{teleportSlam:blink((b,c)=>fire(b,c,{count:3,spread:.3,speed:300,r:10})),spreadShot:spit(5,.22),brimstoneBeam:attacks.brimstoneBeam})
  BESPOKE['brownie']=S(wanderMove(.5),{spreadShot:spit(5,.25),spawnMinions:call('dip',3),ringShot:timedRing(10)})
  BESPOKE['the-forsaken']=S(weave(.5,.4),{chargeDash:multiDash(2,560),spreadShot:spit(3,.3),ringShot:timedRing(10)})
  BESPOKE['the-scourge']=S(weave(.5,.5),{tentacleWhip:attacks.tentacleWhip,spawnMinions:call('deaths-head',2),ringShot:timedRing(12)})
  // twin bosses
  BESPOKE['sisters-vis']=Object.assign(pair(['elder','younger'],160),{move:wanderMove(.5),atk:{spreadShot:spit(3,.3),chargeDash:multiDash(1,540),ringShot:timedRing(10)}})
  BESPOKE['tuff-twins']=Object.assign(pair(['tuff','twin'],160),{move:weave(.6,.4),atk:{chargeDash:bounceDash(2,560,(b,c)=>ring(b,c,6,{speed:230})),spreadShot:spit(3,.3),ringShot:timedRing(10)}})
  BESPOKE['horny-boys']=Object.assign(pair(['horn','boy'],160),{move:weave(.6,.4),atk:{chargeDash:multiDash(2,580),spreadShot:spit(3,.3),ringShot:timedRing(10)}})
  BESPOKE['the-shell']=S(weave(.5,.4),{chargeDash:bounceDash(3,520,(b,c)=>ring(b,c,8,{speed:230})),ringShot:timedRing(10)})
  BESPOKE['clutch']=S(wanderMove(.5),{wallBounceShots:attacks.wallBounceShots,spawnMinions:call('attackfly',3),ringShot:timedRing(12)})

  // ---- the endgame fights: each one scripted the way Isaac plays it ----
  // plan(wind,build,tail,per): build queues q(time,fn) events once; time counts from the attack's start and includes the windup
  const plan=(wind,build,tail,per)=>(b,dt,s,c)=>{
    if(!s.q){s.q=[];s.last=0;build(b,c,s,(t,fn)=>{s.q.push({t,fn});if(t>s.last)s.last=t})}
    if(s.t<wind){b.ai.telegraph=s.t/wind;b.vx*=.85;b.vy*=.85}else b.ai.telegraph=0
    per&&per(b,dt,s,c)
    for(const e of s.q)if(!e.d&&s.t>=e.t){e.d=1;e.fn(b,c,s)}
    return s.t>=s.last+(tail==null?.3:tail)&&s.q.every(e=>e.d)}
  const srcAt=(b,x,y)=>({x,y,dmg:b.dmg,r:8})
  const fireAt=(b,c,x,y,o)=>IS.enemyShoot(srcAt(b,x,y),Object.assign({speed:270},o),c)
  const ringAt=(b,c,x,y,n,o)=>{const off=(o&&o.off)||0;for(let i=0;i<n;i++)fireAt(b,c,x,y,Object.assign({},o,{angle:off+i*Math.PI*2/n}))}
  // a ring with a hole in it, aimed at you: the way through is the way you are standing
  const gapRing=(b,c,x,y,n,gap,o)=>{const a=IS.angleTo(x,y,c.player.x,c.player.y);for(let i=0;i<n;i++){const t=i*Math.PI*2/n;if(Math.abs(Math.atan2(Math.sin(t-a),Math.cos(t-a)))>gap)fireAt(b,c,x,y,Object.assign({},o,{angle:t}))}}
  const lead=(c,t,r)=>{const p=c.player;return place(c,p.x+(p.vx||0)*t,p.y+(p.vy||0)*t,r||30)}
  // a landing: the floor is marked for `d` seconds, then it comes down
  const strike=(b,c,s,q,x,y,r,d,fn,sh)=>{mk(c,x,y,r,d);q(s.t+d,()=>{slam(c,x,y,r,sh||6);fn&&fn(x,y)})}
  const stand=(fx,fy)=>(b,c)=>{const R=room(c);b.x=R.pxW*fx;b.y=R.pxH*fy}
  const hide=b=>{b.hidden=b.invuln=b.harmless=true;b.z=0}
  const show=b=>{b.hidden=b.invuln=b.harmless=false}
  const phaseId=b=>IS.bossPhaseFor(b).id
  const roar=(c,n)=>{IS.fx&&(IS.fx.shake(n||8,.6),IS.fx.flash('rgba(255,255,255,.3)',.2));c.sfx&&c.sfx('boss-roar')}
  const trans=(b,c,secs,n)=>{b.ai.tr=b.ai.tt=secs;roar(c,n)}
  const byPhase=(p1,p2)=>(b,dt,c)=>(phaseId(b)==='p1'?p1:p2)(b,dt,c)
  // beams from fixed points. spec(b,c) -> [{x,y,off,dir}]: each shows where it starts, fires, and sweeps `span` radians (direction `dir`) about you + off
  const rays=(wind,spec,span,dur,width)=>(b,dt,s,c)=>{
    const ang=i=>IS.angleTo(s.P[i].x,s.P[i].y,c.player.x,c.player.y)+s.P[i].off-s.P[i].dir*span/2
    if(!s.w){s.P=spec(b,c);s.w=s.P.map(p=>beam(b,c,s,{x:p.x,y:p.y,angle:0}))}
    if(s.t<wind){b.ai.telegraph=s.t/wind;b.vx*=.85;b.vy*=.85;if(s.t<wind*.6)s.w.forEach((l,i)=>{l.angle=ang(i)});return false}
    b.ai.telegraph=0;b.vx*=.9;b.vy*=.9
    if(!s.L){s.a0=s.w.map(l=>l.angle);s.w.forEach(l=>{l.life=0});s.L=s.P.map((p,i)=>laser(b,c,s,{x:p.x,y:p.y,angle:s.a0[i],width:width||24}));c.sfx&&c.sfx('brimstone-fire');IS.fx&&IS.fx.shake(3,dur)}
    const k=Math.min(1,(s.t-wind)/dur);s.L.forEach((l,i)=>{l.angle=s.a0[i]+s.P[i].dir*span*k});return k>=1}
  const from1=(dx,dy,offs)=>b=>offs.map(o=>({x:b.x+dx*b.r,y:b.y+dy*b.r,off:o,dir:o<0?-1:1}))
  const eyes=(dx,n)=>b=>{const r=[];for(let i=0;i<n;i++)r.push({x:b.x+(i%2?dx:-dx),y:b.y+b.r*.15,off:(i%2?-.25:.25)*(1+(i>>1)),dir:i%2?-1:1});return r}
  // a pillar of light: a thin line shows where, then it comes straight down
  const column=(b,c,s,q,x,d,w)=>{const R=room(c),warn=beam(b,c,s,{x,y:0,angle:Math.PI/2,len:R.pxH+40});q(s.t+d,()=>{warn.life=0;laser(b,c,s,{x,y:0,angle:Math.PI/2,len:R.pxH+40,width:w||46,life:.4});c.sfx&&c.sfx('laser-fire');IS.fx&&IS.fx.shake(3,.2)})}
  // a leap with a shadow that tracks you, then locks and lands in a ring of tears
  const leap=(ringN,hgt,rk,wind)=>(b,dt,s,c)=>{const w=wind||.55
    if(once(s,'m')){s.m=mk(c,c.player.x,c.player.y,b.r*(rk||1.15),w+.9);s.undo=()=>{b.harmless=false;b.z=0;b.ai.telegraph=0}}
    b.vx=b.vy=0
    if(s.t<w){b.ai.telegraph=s.t/w;follow(s.m,c,dt,b.r);return false}
    b.ai.telegraph=0
    if(once(s,'j')){s.sx=b.x;s.sy=b.y;s.tx=s.m.x;s.ty=s.m.y;b.harmless=true;c.sfx&&c.sfx('boss-roar')}
    const k=Math.min(1,(s.t-w)/.85);b.x=IS.lerp(s.sx,s.tx,k);b.y=IS.lerp(s.sy,s.ty,k);b.z=Math.sin(k*Math.PI)*(hgt||250)
    if(k>=1&&once(s,'l')){b.z=0;b.harmless=false;slam(c,b.x,b.y,b.r*(rk||1.15),9);ring(b,c,ringN||10,{speed:230,off:c.range(0,1)})}
    return s.t>w+1}
  const spiral=(dur,every,arms,spd,turn)=>stream(dur,every,(b,c,s)=>{s.a=(s.a==null?aim(b,c):s.a)+(turn||.4);for(let i=0;i<arms;i++)fire(b,c,{angle:s.a+i*Math.PI*2/arms,speed:spd||230})})

  // ---- Mother: a face on the ceiling with wall hands, eye lasers, knives and worms; then her body walks ----
  const wallHands=(n,gap,r)=>plan(.55,(b,c,s,q)=>{const R=room(c);let side=c.int(2)
    for(let i=0;i<n;i++,side^=1){const sd=side;q(.55+i*gap,(b,c,s)=>{const p=lead(c,.35),wx=sd?R.pxW-40:40;mk(c,p.x,p.y,r,.8);for(let k=1;k<4;k++)mk(c,IS.lerp(wx,p.x,k/4),p.y,r*.3,.2+k*.15)
      q(s.t+.8,()=>{slam(c,p.x,p.y,r,7);fireAt(b,c,p.x,p.y,{angle:sd?Math.PI:0,count:3,spread:.5,speed:260})})})}},.4)
  const knives=(n,vol)=>plan(.5,(b,c,s,q)=>{for(let i=0;i<vol;i++)q(.5+i*.45,(b,c)=>fire(b,c,{count:n,spread:.16,speed:560,r:7,angle:aim(b,c)}))},.5)
  const worms=(n,k)=>plan(.4,(b,c,s,q)=>{for(let i=0;i<n;i++){const a=c.range(0,6.28),d=i?c.range(60,200):0,p=place(c,c.player.x+Math.cos(a)*d,c.player.y+Math.sin(a)*d,30),t=.1+i*.3;q(t,()=>{mk(c,p.x,p.y,40,.7).hole=true});q(t+.7,()=>{slam(c,p.x,p.y,40,4);ringAt(b,c,p.x,p.y,k,{speed:200,off:c.range(0,1)});IS.fx&&IS.fx.poof(p.x,p.y,'#7a3b3b')})}},.4)
  BESPOKE['mother']=S(byPhase(still,weave(.28,.3)),{
    wallHands:wallHands(3,.6,60),eyeLasers:rays(.8,eyes(16,2),1.7,1.4,22),knifeFan:knives(7,2),wormBurst:worms(3,6),
    bodySlam:leap(14,260,1.2),handsFast:wallHands(5,.45,58),eyeStorm:rays(.7,eyes(16,4),2.4,1.8,22),wormSwarm:worms(5,8),
    tearSpin:spiral(1.8,.1,2,230,.45),knifeStorm:knives(9,3)
  },{setup:stand(.5,.3),phase:(b,ph,c)=>{if(ph.id==='p2')trans(b,c,1.8,12)}})

  // ---- Satan: a statue that wakes, a head with brimstone and two fists; then his legs come down ----
  const foot=(b,c,s,q,m,t,fn,hold)=>{q(t-.3,()=>{b.x=m.x;b.y=m.y;show(b);b.harmless=true;b.invuln=true;s.z0=s.t});q(t,()=>{b.z=0;s.z0=null;b.invuln=false;b.harmless=false;slam(c,m.x,m.y,m.r,9);fn&&fn()});hold&&q(t+hold,()=>hide(b))}
  const legPer=(b,dt,s)=>{if(s.z0!=null)b.z=IS.lerp(360,0,Math.min(1,(s.t-s.z0)/.3)**2)}
  const stompLegs=n=>plan(.3,(b,c,s,q)=>{s.undo=()=>{show(b);b.z=0};for(let i=0;i<n;i++){const t=.5+i*.85,side=i%2?1:-1;q(t-.5,(b,c,s)=>{const p=lead(c,.3,60),m=mk(c,p.x+side*70,p.y,86,.5);foot(b,c,s,q,m,s.t+.5,()=>ringAt(b,c,m.x,m.y,10,{speed:210,off:c.range(0,1)}),i===n-1?.5:.35)})}},.4,legPer)
  const fistShot=(b,c)=>(x,y)=>fireAt(b,c,x,y,{count:5,spread:.4,speed:240,angle:Math.PI/2})
  const fists=plan(.6,(b,c,s,q)=>{q(.6,(b,c,s)=>{const p=lead(c,.4);strike(b,c,s,q,p.x,p.y,66,.8,fistShot(b,c))})
    q(1.5,(b,c,s)=>{const p=lead(c,.4);strike(b,c,s,q,p.x,p.y,66,.7,fistShot(b,c))})
    q(2.3,(b,c,s)=>{const p=place(c,c.player.x,c.player.y,70);for(const d of [-125,125]){const l=place(c,p.x+d,p.y,60);strike(b,c,s,q,l.x,l.y,60,.8)}})},.6)
  const debris=n=>plan(.4,(b,c,s,q)=>{for(let i=0;i<n;i++)q(.3+i*.28,(b,c,s)=>{const p=i%2?lead(c,.3):place(c,c.player.x+c.range(-170,170),c.player.y+c.range(-120,120),40);strike(b,c,s,q,p.x,p.y,48,.8,(x,y)=>ringAt(b,c,x,y,4,{speed:200,off:c.range(0,1)}))})},.5)
  BESPOKE['satan']=S(still,{
    mouth:rays(.9,from1(0,.5,[0]),1.5,1.3,32),mouthFan:rays(1,from1(0,.5,[-.5,0,.5]),1,1.1,28),fists,imps:call('imp',2),
    legs:Object.assign(stompLegs(3),{solo:1}),debris:debris(6),flies:call('fly',3)
  },{setup:(b,c)=>{stand(.5,.28)(b,c);b.ai.statue=1;b.ai.tr=b.ai.tt=2.4;b.ai.tint=b.tint;b.tint='#8a8a86'},
    tick:(b,dt,c)=>{if(b.ai.statue&&!(b.ai.tr>0)){b.ai.statue=0;b.tint=b.ai.tint;roar(c,12);IS.fx&&IS.fx.poof(b.x,b.y,'#8a8a86')}
      },
    phase:(b,ph,c)=>{if(ph.id==='p2'){b.ai.legs=1;trans(b,c,2,12)}}})

  // ---- The Lamb: a head that floats and breathes brimstone, a body that charges; both have to go ----
  const lamb=(head,body)=>(b,dt,s,c)=>(b.role==='head'?head:body)(b,dt,s,c)
  BESPOKE['the-lamb']=S((b,dt,c)=>(b.role==='head'?weave(.55,.6):weave(.4,.3))(b,dt,c),{
    lbBrim:lamb(rays(.9,from1(0,0,[0]),1.6,1.2,30),multiDash(2,520,(b,c)=>ring(b,c,6,{speed:220}))),
    lbSpin:lamb(spiral(1.6,.09,2,230,.42),spiral(1.2,.12,3,210,.5)),
    lbCross:lamb(radial(4,.6),leap(12,200,1.1)),
    lbSummon:lamb(call('deaths-head',2),call('bony',2))
  },{setup:(b,c)=>{if(b.role)return;const R=room(c),hp=b.maxHp;b.role='body';const p=IS.spawnBoss(R,b.def.id,b.x,b.y-100,{role:'head',variant:1,flying:true,r:Math.round(b.r*.8)});if(p){R.boss=b;b.mate=p;p.mate=b;p.ai.setup=true;b.hp=b.maxHp=Math.round(hp*.6);p.hp=p.maxHp=Math.round(hp*.4);p.spawnT=b.spawnT}},
    tick:(b,dt,c)=>{if(b.mate&&b.mate.dead&&!b.ai.rg){b.ai.rg=1;b.speed*=1.4;b.baseSpeed=(b.baseSpeed||b.speed)*1.4;roar(c,6)}}})

  // ---- Isaac: tears and flies, then pillars of light and angel orbs, then wings ----
  BESPOKE['isaac']=S(weave(.5,.4),{
    isTears:spit(5,.25,{speed:290}),isCharge:multiDash(2,560,(b,c)=>ring(b,c,8,{speed:230,off:c.range(0,1)})),isFlies:call('attackfly',3),
    isLight:plan(.6,(b,c,s,q)=>{const n=phaseId(b)==='p3'?5:3;for(let i=0;i<n;i++)q(.1+i*.5,(b,c,s)=>column(b,c,s,q,lead(c,.5).x,.9))},1.1),
    isOrbs:plan(.6,(b,c,s,q)=>{q(.6,()=>ringAt(b,c,b.x,b.y,8,{speed:120,r:14,life:7,homing:.5}));q(1.2,()=>fire(b,c,{count:5,spread:.3,speed:150,r:13,homing:.8,life:6}))},.7),
    isWings:plan(.5,(b,c,s,q)=>{for(let i=0;i<4;i++)q(.5+i*.35,()=>{ringAt(b,c,b.x,b.y,10,{speed:200,off:i*.3});fire(b,c,{count:3,spread:.2,speed:320})})},.4)
  },{phase:(b,ph,c)=>{trans(b,c,1.4,8);if(ph.id==='p3')b.flying=true}})

  // ---- ???: swarms of flies, patterned tears, and a stretch spent invisible ----
  const unseen=(dur,every,spin)=>(b,dt,s,c)=>{if(once(s,'v')){hide(b);IS.fx&&IS.fx.poof(b.x,b.y,'#5a7ab0');s.undo=()=>show(b)}
    const n=IS.norm(c.player.x-b.x,c.player.y-b.y),k=Math.sin(s.t*2.2);b.vx=IS.approach(b.vx,(n.x-n.y*k)*b.speed*1.1,b.speed*4*dt);b.vy=IS.approach(b.vy,(n.y+n.x*k)*b.speed*1.1,b.speed*4*dt)
    s.e=(s.e||0)-dt;if(s.e<=0){s.e=every;s.a=(s.a||0)+spin;ringAt(b,c,b.x,b.y,3,{off:s.a,speed:200})}
    if(s.t>dur){show(b);IS.fx&&IS.fx.poof(b.x,b.y,'#5a7ab0');gapRing(b,c,b.x,b.y,16,.35,{speed:220});return true}return false}
  BESPOKE['blue-baby']=S(wanderMove(.45),{
    bbSpiral:spiral(1.8,.09,3,220,.35),bbGap:plan(.5,(b,c,s,q)=>{for(let i=0;i<3;i++)q(.5+i*.4,()=>gapRing(b,c,b.x,b.y,18,.3,{speed:200+i*20}))},.5),
    bbFlies:plan(.6,(b,c,s,q)=>{q(.6,()=>{summon(b,c,3,null,'attackfly');if(c.spawnPoop)for(let i=0;i<2;i++){const p=c.freeFloorPos();c.spawnPoop(p.x,p.y)}c.sfx&&c.sfx('boss-roar')})},.4),
    bbTears:spit(7,.2,{speed:280,r:10}),bbInvisible:unseen(2.6,.28,.5),bbRush:multiDash(2,560,(b,c)=>gapRing(b,c,b.x,b.y,14,.3,{speed:220}))
  },{phase:(b,ph,c)=>{if(ph.id==='p2')trans(b,c,1.2,8)}})

  // ---- Hush: a fast face that fills the room with patterned tears, then goes red and fires lasers ----
  BESPOKE['hush']=S(byPhase(wanderMove(.5),wanderMove(.8)),{
    hsSpiral:spiral(2,.07,3,210,.3),hsGap:plan(.4,(b,c,s,q)=>{for(let i=0;i<4;i++)q(.4+i*.3,()=>gapRing(b,c,b.x,b.y,22,.28,{speed:190+i*15}))},.5),
    hsFlies:call('attackfly',4),
    hsLines:plan(.7,(b,c,s,q)=>{const R=room(c),y0=c.player.y;for(let i=0;i<4;i++){const y=IS.clamp(i*R.pxH/4+80,80,R.pxH-60);if(Math.abs(y-y0)<50)continue;const w=beam(b,c,s,{x:0,y,angle:0,len:R.pxW+40});q(.7+i*.15,()=>{w.life=0;laser(b,c,s,{x:0,y,angle:0,len:R.pxW+40,width:30,life:.45});c.sfx&&c.sfx('brimstone-fire')})}},.7),
    hsRush:multiDash(2,600,(b,c)=>ring(b,c,10,{speed:230})),hsSweep:rays(.7,from1(0,0,[-.6,.6]),2,1.4,26),
    hsStorm:stream(1.8,.05,(b,c,s)=>{s.a=(s.a||0)+.9;fire(b,c,{angle:s.a+c.range(-.3,.3),speed:c.range(170,260)})}),hsFlies2:call('attackfly',5)
  },{phase:(b,ph,c)=>{if(ph.id==='p2'){trans(b,c,1.4,12);b.tint='#d87060'}}})

  // ---- Mega Satan: two hands that slam and a head that burns; then the skull comes loose ----
  BESPOKE['mega-satan']=S(byPhase(still,weave(.35,.3)),{
    msHands:plan(.6,(b,c,s,q)=>{q(.6,(b,c,s)=>{const p=place(c,c.player.x,c.player.y,70);for(const d of [-150,150]){const l=place(c,p.x+d,p.y,60);strike(b,c,s,q,l.x,l.y,64,.8,(x,y)=>fireAt(b,c,x,y,{count:3,spread:.5,speed:230,angle:Math.PI/2}))}})
      q(1.9,(b,c,s)=>{const p=lead(c,.4);strike(b,c,s,q,p.x,p.y,72,.7,(x,y)=>ringAt(b,c,x,y,6,{speed:200}))})},.6),
    msBrim:rays(1,from1(0,.5,[-.45,0,.45]),1.1,1.2,30),msSweep:rays(.8,from1(0,.5,[0]),2.2,1.6,34),msRing:timedRing(14,.5),msImps:call('imp',2),
    msSkull:bounceDash(3,520,(b,c)=>ring(b,c,10,{speed:230})),msCross:radial(4,.8),
    msBarrage:plan(.5,(b,c,s,q)=>{for(let i=0;i<5;i++)q(.4+i*.3,(b,c,s)=>{const p=i%2?lead(c,.3):place(c,c.player.x+c.range(-200,200),c.player.y+c.range(-120,120),50);strike(b,c,s,q,p.x,p.y,56,.7)})},.8),msBones:call('black-bony',2)
  },{setup:stand(.5,.3),phase:(b,ph,c)=>{if(ph.id==='p2')trans(b,c,1.8,14)}})

  // ---- The Beast: the four Ultra Horsemen ride in one at a time, then the Beast itself ----
  const HORSES=['ultra-famine','ultra-pestilence','ultra-war','ultra-death']
  const curtain=(rows,gap)=>plan(.7,(b,c,s,q)=>{const R=room(c),gx=c.player.x;q(.2,()=>{for(let k=0;k<2;k++)beam(b,c,s,{x:IS.clamp(gx+k*40-20,80,R.pxW-80),y:0,angle:Math.PI/2,len:R.pxH})})
    for(let r=0;r<rows;r++)q(.7+r*.4,()=>{for(let x=70;x<R.pxW-40;x+=64)if(Math.abs(x-gx)>gap)fireAt(b,c,x,40,{angle:Math.PI/2,speed:220,r:10});c.sfx&&c.sfx('enemy-shoot')})},.6)
  BESPOKE['the-beast']=S((b,dt,c)=>b.ai.up?weave(.3,.3)(b,dt,c):still(b,dt),{
    bsBrim:rays(1,from1(0,.5,[0]),1.8,1.4,40),bsCurtain:curtain(4,90),bsStomp:leap(14,240,1.2),bsFlies:call('attackfly',4),
    bsRush:bounceDash(3,540,(b,c)=>ring(b,c,12,{speed:230})),bsRays:radial(4,.7),bsHowl:attacks.screamPush,bsCurtain2:curtain(6,70)
  },{setup:(b,c)=>{stand(.5,.3)(b,c);hide(b);b.ai.stage=0},
    tick:(b,dt,c)=>{if(b.ai.up)return;b.attackT=Math.max(b.attackT,1.5);const R=room(c);if(R.enemies.some(e=>!e.dead&&e.horse))return
      if(b.ai.stage<4){const id=HORSES[b.ai.stage++],d=IS.bossesById[id],hp=Math.round(d.hp*.2),h=IS.spawnBoss(R,id,R.pxW/2,R.pxH*.65,{hp,maxHp:hp,horse:true});R.boss=b;if(h){h.ai.setup=true;roar(c,8);IS.fx&&IS.fx.poof(h.x,h.y,'#7d6a5a')}}
      else{b.ai.up=1;show(b);trans(b,c,1.6,14)}},
    phase:(b,ph,c)=>{if(ph.id==='p2')trans(b,c,1.4,12)}})

  // ---- Dogma: a television that sheds static and scan lines, then the angel inside ----
  // scan lines: a laser enters from one side and walks down (or up) the room; the far side stays clear
  const scan=(rows,spd)=>plan(.6,(b,c,s,q)=>{const R=room(c),span=R.pxH-140;s.rows=[];for(let i=0;i<rows;i++){const dir=i%2?-1:1,y0=dir>0?70:R.pxH-70,x0=i%2?R.pxW:0,a=i%2?Math.PI:0;s.rows.push({dir,y0,x0,a,w:beam(b,c,s,{x:x0,y:y0,angle:a,len:R.pxW*.62})})}
    q(.6,(b,c,s)=>{s.rows.forEach(r=>{r.w.life=0;r.L=laser(b,c,s,{x:r.x0,y:r.y0,angle:r.a,len:R.pxW*.62,width:20,life:3});c.sfx&&c.sfx('laser-fire')});s.go=s.t});q(.6+span/spd,()=>{})},.3,(b,dt,s,c)=>{if(s.go!=null)s.rows.forEach(r=>{if(r.L)r.L.y=r.y0+r.dir*Math.min(room(c).pxH-140,(s.t-s.go)*spd)})})
  const static_=plan(.5,(b,c,s,q)=>{q(.5,()=>{IS.fx&&IS.fx.flash('rgba(220,220,230,.3)',.15);ringAt(b,c,b.x,b.y,16,{speed:220,off:c.range(0,1)})});q(.95,()=>ringAt(b,c,b.x,b.y,16,{speed:180,off:.2}))},.4)
  BESPOKE['dogma']=S(byPhase(still,wanderMove(.5)),{
    dgStatic:static_,dgPlus:plan(.5,(b,c,s,q)=>{for(let i=0;i<4;i++)q(.5+i*.3,()=>ringAt(b,c,b.x,b.y,4,{speed:260,off:i%2?Math.PI/4:0}))},.4),dgScan:scan(2,260),dgSpirits:call('angelic-baby',2),
    dgLight:plan(.6,(b,c,s,q)=>{for(let i=0;i<5;i++)q(.1+i*.4,(b,c,s)=>column(b,c,s,q,i%2?lead(c,.5).x:place(c,c.player.x+c.range(-160,160),c.player.y,30).x,.9))},1.1),
    dgSpin:rays(.7,from1(0,0,[0,Math.PI/2,Math.PI,-Math.PI/2]),2.2,1.7,24),dgOrbs:plan(.5,(b,c,s,q)=>{q(.5,()=>ringAt(b,c,b.x,b.y,10,{speed:130,r:14,life:7,homing:.5}));q(1.1,()=>fire(b,c,{count:7,spread:.25,speed:160,r:13,homing:.8,life:6}))},.6),
    dgDive:multiDash(2,600,(b,c)=>ring(b,c,12,{speed:230})),dgFeathers:plan(.45,(b,c,s,q)=>{for(let i=0;i<3;i++)q(.45+i*.3,()=>fire(b,c,{count:9,spread:.16,speed:330,r:8}))},.4)
  },{setup:stand(.5,.3),phase:(b,ph,c)=>{if(ph.id==='p2'){trans(b,c,1.8,14);b.flying=true}}})

  // ---- Ultra Greed: gold coins, bombs, a heavy leap; his armour cracks halfway and he gets angrier ----
  const greed=k=>({
    ugCoins:spiral(1.6,.1/k,2,240,.45),ugLeap:leap(10+4*k,220,1.1),ugBombs:plan(.4,(b,c,s,q)=>{for(let i=0;i<2+k;i++)q(.4+i*.15,()=>{const p=place(c,c.player.x+c.range(-110,110),c.player.y+c.range(-90,90),30);mk(c,p.x,p.y,80,1.2);c.spawnBomb(p.x,p.y,{friendly:false,fuse:1.2})})},.8),
    ugSummon:call('ultra-coin',3),ugBarrage:plan(.45,(b,c,s,q)=>{for(let i=0;i<3+k;i++)q(.45+i*.28,()=>fire(b,c,{count:5+k,spread:.2,speed:300,r:9,angle:aim(b,c)}))},.4),
    ugBeam:rays(.8,from1(0,0,[-.4,.4]),1.3,1.2,26),ugRain:debris(7)})
  const ultraGreed=k=>S(byPhase(wanderMove(.25),wanderMove(.45)),greed(k),{phase:(b,ph,c)=>{if(ph.id==='p2'){trans(b,c,1.2,10);b.tint='#f0c040'}}})
  BESPOKE['ultra-greed']=ultraGreed(1);BESPOKE['ultra-greedier']=ultraGreed(2)

  // ---- The Fallen and Krampus: the devil's cast-offs ----
  BESPOKE['the-fallen']=S(weave(.6,.4),{
    flCharge:multiDash(2,580,(b,c)=>fire(b,c,{count:5,spread:.25,speed:300})),flFan:spit(7,.2,{speed:300,r:10}),flImps:call('imp',2),
    flFire:plan(.5,(b,c,s,q)=>{for(let i=0;i<3;i++)q(.5+i*.3,()=>{fire(b,c,{count:3,spread:.3,speed:320,r:10});c.spawnCreep(b.x,b.y,40,{life:4,dmg:1})})},.4),flHell:rays(.8,from1(0,0,[0]),1.3,1.1,28)
  },{phase:(b,ph,c)=>{if(ph.id==='p2')trans(b,c,1,8)}})
  BESPOKE['krampus']=S(weave(.6,.4),{
    kpCharge:bounceDash(2,580,(b,c)=>ring(b,c,8,{speed:230})),kpHorns:spit(5,.3,{speed:320,r:11}),kpCoal:plan(.5,(b,c,s,q)=>{for(let i=0;i<3;i++)q(.5+i*.3,()=>{const p=lead(c,.3);mk(c,p.x,p.y,70,.9);c.spawnBomb(p.x,p.y,{friendly:false,fuse:.9})})},.8),
    kpFlames:plan(.5,(b,c,s,q)=>{for(let i=0;i<3;i++)q(.5+i*.35,()=>{ringAt(b,c,b.x,b.y,8,{speed:210,off:i*.4});c.spawnCreep(b.x,b.y,40,{life:4,dmg:1})})},.4),kpKnives:knives(5,2)
  },{phase:(b,ph,c)=>{if(ph.id==='p2')trans(b,c,1,8)}})

  // ---- the Ultra Horsemen ----
  BESPOKE['ultra-famine']=S(weave(.8,.4),{ufCharge:multiDash(3,580,(b,c)=>fire(b,c,{count:5,spread:.25,speed:300})),ufX:plan(.5,(b,c,s,q)=>{for(let i=0;i<3;i++)q(.5+i*.3,()=>ringAt(b,c,b.x,b.y,8,{speed:250,off:Math.PI/8+i*.2}))},.4),ufLocusts:call('locust-of-famine',3)})
  BESPOKE['ultra-pestilence']=S(weave(.6,.5),{upCloud:plan(.5,(b,c,s,q)=>{for(let i=0;i<3;i++)q(.5+i*.4,()=>{ringAt(b,c,b.x,b.y,7,{speed:150+i*20,off:i*.3,r:12});c.spawnCreep(b.x,b.y,50,{life:5,dmg:1})})},.5),upLocusts:call('locust-of-pestilence',3),upSpit:spit(5,.25,{speed:280}),upSpin:spiral(1.6,.1,3,200,.4)})
  BESPOKE['ultra-war']=S(weave(.7,.4),{uwBombs:plan(.4,(b,c,s,q)=>{for(let i=0;i<4;i++)q(.4+i*.2,()=>{const p=place(c,c.player.x+c.range(-130,130),c.player.y+c.range(-100,100),30);mk(c,p.x,p.y,80,1.1);c.spawnBomb(p.x,p.y,{friendly:false,fuse:1.1})})},.8),uwCharge:multiDash(2,600,(b,c)=>ring(b,c,10,{speed:240})),uwSpit:spit(5,.25,{speed:300}),uwThrow:leap(10,200,1)})
  BESPOKE['ultra-death']=S(weave(.6,.4),{udCharge:multiDash(2,600,(b,c)=>fire(b,c,{count:3,spread:.3,speed:320})),udScythe:rays(.7,from1(0,0,[0]),1.6,1.0,26),udBones:call('bony',2),udFan:spit(7,.2,{speed:300})})

  // ---- Delirium: forever turning into other bosses and fighting with their real moves, teleporting between them ----
  const FORMS=['monstro','larry-jr','famine','gurdy-jr','widow','chub','peep','loki','little-horn','baby-plum','the-husk','the-hollow','fistula','the-haunt','gish','the-bloat','teratoma']
  const LATE=['mother','satan','the-lamb','isaac','hush','mega-satan','blue-baby','ultra-war','ultra-famine','the-fallen','krampus','dogma']
  const hue=c=>'hsl('+c.int(360)+',55%,70%)'
  const pickForm=(c,late)=>{const id=c.pick(late?LATE:FORMS),M=BESPOKE[id]||{},d=IS.bossesById[id]
    let names=Object.keys(M.atk||{});if(!names.length)names=[].concat(...((d&&d.phases)||[]).map(p=>p.attacks))
    names=names.filter(k=>!(M.atk&&M.atk[k]&&M.atk[k].solo));return{id,M,name:c.pick(names.length?names:['spreadShot'])}}
  const mimic=(b,dt,s,c)=>{if(!s.mm){s.mm=pickForm(c,phaseId(b)==='p2');b.ai.mim=s.mm.id;b.tint=hue(c)}
    const f=s.mm,fn=(f.M.atk&&f.M.atk[f.name])||IS.attacks[f.name]||attacks.spreadShot,r=fn(b,dt,s,c)
    // whatever the borrowed attack hid or froze, Delirium comes back whole
    if(s.undo!==s.wu){const u=s.undo;s.wu=()=>{u&&u();show(b);b.z=0;b.harmless=false};s.undo=s.wu}
    return r}
  const freeSpot=(b,c,d)=>{const R=room(c);for(let i=0;i<14;i++){const q=place(c,c.range(b.r,R.pxW-b.r),c.range(b.r,R.pxH-b.r),b.r);if(IS.dist(q.x,q.y,c.player.x,c.player.y)>d)return q}return place(c,R.pxW-c.player.x,R.pxH-c.player.y,b.r)}
  BESPOKE['delirium']=S((b,dt,c)=>{const M=BESPOKE[b.ai.mim];(M&&M.move&&M.move!==still&&!M.role?M.move:drift)(b,dt,c)},{
    dlMimic:mimic,
    dlTeleport:(b,dt,s,c)=>{b.vx=b.vy=0;if(once(s,'v')){s.p=freeSpot(b,c,220);mk(c,s.p.x,s.p.y,b.r*1.2,.9);s.undo=()=>show(b)}
      b.ai.telegraph=s.t<.35?s.t/.35:0
      if(s.t>=.35&&once(s,'g')){IS.fx&&IS.fx.poof(b.x,b.y,'#c05ad0');hide(b)}
      if(s.t>=.9&&once(s,'a')){b.x=s.p.x;b.y=s.p.y;show(b);b.tint=hue(c);IS.fx&&IS.fx.poof(b.x,b.y,'#c05ad0');ring(b,c,10,{speed:230,off:aim(b,c)})}
      return s.t>1.3},
    dlGlitch:plan(.4,(b,c,s,q)=>{s.undo=()=>show(b);for(let i=0;i<4;i++)q(.4+i*.4,()=>{const a=c.range(0,6.28),p=place(c,c.player.x+Math.cos(a)*250,c.player.y+Math.sin(a)*250,b.r);IS.fx&&IS.fx.poof(b.x,b.y,'#c05ad0');b.x=p.x;b.y=p.y;b.tint=hue(c);fire(b,c,{count:5,spread:.22,speed:300})})},.5)
  },{phase:(b,ph,c)=>{if(ph.id==='p2')trans(b,c,1.2,10)}})

  // ---- Pin, Frail, Wormwood: underground and unseen for everything but the pop-up ----
  const burrow=o=>(b,dt,s,c)=>{
    if(once(s,'v')){hide(b);s.m=mk(c,c.player.x,c.player.y,b.r*1.2,1.25);s.m.hole=true;s.undo=()=>hide(b)}
    b.vx=b.vy=0
    if(s.t<.8){follow(s.m,c,dt,b.r);return false}
    const hold=o.hold||1.6
    if(s.t>=1.25&&once(s,'l')){b.x=s.m.x;b.y=s.m.y;show(b);slam(c,b.x,b.y,b.r*1.3,7);if(o.ring)ring(b,c,o.ring,{speed:225,off:c.range(0,1)});if(o.fan)fire(b,c,{count:o.fan,spread:o.sp||.25,speed:280})
      if(o.beams)for(const d of [-.6,0,.6])laser(b,c,s,{x:b.x,y:b.y,angle:aim(b,c)+d,width:22,life:.5});mk(c,b.x,b.y,b.r*1.1,hold+.3).hole='dive'}
    for(const d of o.echo||[])if(at(s,dt,1.25+d))ring(b,c,o.ring||8,{speed:200,off:d})
    return s.t>1.25+hold}
  const digger=atk=>({move:still,atk,setup:b=>{hide(b);b.attackT=.5}})
  BESPOKE['pin']=digger({teleportSlam:burrow({ring:10}),spreadShot:burrow({fan:5}),delayedRings:burrow({ring:8,echo:[.4,.8],hold:1.8})})
  BESPOKE['frail']=digger({teleportSlam:burrow({ring:8}),spreadShot:burrow({fan:5}),brimstoneBeam:burrow({beams:1,fan:3,sp:.4})})
  BESPOKE['wormwood']=digger({teleportSlam:burrow({ring:6}),spreadShot:burrow({fan:3,sp:.3}),ringShot:burrow({ring:8})})

  // ---- Steven and Blighted Ovum: not Gemini ----
  const by=m=>(b,dt,s,c)=>(m[b.role]||m[Object.keys(m)[0]])(b,dt,s,c)
  const twin=(roles,dx,hpk,rk,spd,more)=>({
    setup:(b,c)=>{if(b.role)return;const R=room(c),hp=b.maxHp;b.role=roles[0];const p=IS.spawnBoss(R,b.def.id,IS.clamp(b.x+dx,60,R.pxW-60),b.y,{role:roles[1],variant:1,r:Math.max(16,Math.round(b.r*rk))});if(p){R.boss=b;b.mate=p;p.mate=b;p.ai.setup=true;b.hp=b.maxHp=Math.round(hp*hpk);p.hp=p.maxHp=Math.round(hp*(1-hpk));p.spawnT=b.spawnT;p.speed=p.baseSpeed=(p.speed||b.speed)*spd}},
    tick:(b,dt,c)=>{if(b.mate&&b.mate.dead&&!b.ai.rg){b.ai.rg=1;b.baseSpeed=(b.baseSpeed||b.speed)*1.35;b.speed*=1.35;roar(c,5)}more&&more(b,dt,c)}})
  const kite=(b,dt,c)=>{const d=IS.dist(b.x,b.y,c.player.x,c.player.y),n=IS.norm(c.player.x-b.x,c.player.y-b.y),k=d<260?-1:d>430?.6:0;b.vx=IS.approach(b.vx,n.x*b.speed*k,b.speed*3*dt);b.vy=IS.approach(b.vy,n.y*b.speed*k,b.speed*3*dt)}
  // Steven bullies you with charges; Little Steven keeps his distance, shoots and hatches flies. No cord between them.
  BESPOKE['steven']=Object.assign(twin(['steven','little'],150,.62,.62,1.3),{
    move:by({steven:weave(1,.4),little:kite}),
    atk:{chaseFast:by({steven:multiDash(2,560,(b,c)=>fire(b,c,{count:3,spread:.3,speed:300})),little:attacks.retreatVolley}),aimedShot:by({steven:spit(5,.2,{speed:300,r:11}),little:attacks.burstShot}),spawnMinions:call('attackfly',2)}})
  // Blighted Ovum: the Ovum hops and leaks, the Sac stays put, pulses and breeds
  BESPOKE['blighted-ovum']=Object.assign(twin(['ovum','sac'],150,.6,.72,.5),{
    move:by({ovum:weave(.6,.5),sac:wanderMove(.2)}),
    atk:{chaseFast:by({ovum:hopper(3,200,.7,(b,c)=>{c.spawnCreep(b.x,b.y,40,{life:5,dmg:1});ring(b,c,6,{speed:200,off:c.range(0,1)})},60),sac:timedRing(10,.6)}),aimedShot:by({ovum:spit(3,.3,{speed:280}),sac:spit(5,.25)}),spawnMinions:call('maggot',2)}})
  IS.ATTACK_LIST.forEach(n=>IS.defineAttack(n,attacks[n]||shots(4,.2)))
  // The vocabulary the data validates against is fixed (IS.ATTACK_LIST, 45 names). Scripts above are written under
  // readable names; each takes the next free vocabulary slot, and IS.bossVocab[id][readable] says which, for tuning.
  IS.bossVocab={}
  Object.keys(BESPOKE).forEach(id=>{const A=BESPOKE[id].atk;if(!A)return;const free=IS.ATTACK_LIST.filter(n=>!A[n]),m=IS.bossVocab[id]=IS.bossVocab[id]||{}
    for(const k of Object.keys(A).filter(k=>!IS.ATTACK_LIST.includes(k))){const v=free.shift();m[k]=v;A[v]=A[k];delete A[k]}})
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
