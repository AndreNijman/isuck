;(function (IS) {
  'use strict'
  // Every boss attack is a little script over its own clock, `s.t`. Each one opens
  // with a windup the player can read (b.ai.telegraph swells the sprite; floor
  // markers show where something will land), and any state an attack changes on
  // the boss is put back by `s.undo` when it ends, so nothing leaks between attacks.
  IS.bossPhaseFor=b=>{const frac=b.hp/b.maxHp;return (b.def.phases||[]).find(p=>frac>=(p.hpAbove||0))||(b.def.phases||[]).slice(-1)[0]||{attacks:['aimedShot'],cooldown:[1,2]}}
  IS.startAttack=(b,name,ctx)=>{b.attack=name;b.attackState={t:0};b.attackT=0;return !!IS.attacks[name]}
  const endAttack=IS.endBossAttack=b=>{const s=b.attackState;if(s&&s.undo)s.undo();if(b.def&&b.def.r)b.z=0;if(s&&s.lasers)s.lasers.forEach(l=>{l.life=0});b.ai.telegraph=0;b.attack=null;b.attackState=null}
  IS.updateBoss=(b,dt,ctx)=>{const phase=IS.bossPhaseFor(b);if(phase!==b.ai.phase){if(b.ai.phase&&IS.fx){IS.fx.shake(6,.4);IS.fx.flash('rgba(255,255,255,.25)',.12);ctx.sfx&&ctx.sfx('boss-roar')}b.ai.phase=phase;b.speed=(b.baseSpeed||b.speed)*(phase.speedMult||1)}
    if(b.attack){const fn=IS.attacks[b.attack];b.attackState.t+=dt;if(!fn||fn(b,dt,b.attackState,ctx)){endAttack(b);b.attackT=ctx.range(...(phase.cooldown||[1,2]))}}
    else{drift(b,dt,ctx);b.attackT-=dt;if(b.attackT<=0)IS.startAttack(b,ctx.rng.pickWeighted(phase.attacks||['aimedShot'],phase.weights||[]),ctx)}}
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
  const minionIds=c=>{const pool=((c.run.floor&&c.run.floor.def&&c.run.floor.def.enemyPool)||[]).filter(id=>IS.enemiesById[id]);const flies=pool.filter(id=>/fly|pooter/.test(id));return flies.length?flies:pool.length?pool:['attackfly']}
  const minions=(b,c)=>room(c).enemies.filter(e=>!e.dead&&e.spawnedBy===b).length
  const summon=(b,c,n,where)=>{const ids=minionIds(c);for(let i=0;i<n;i++){if(minions(b,c)>=5)return;const p=where?where():{x:b.x+c.range(-40,40),y:b.y+c.range(-40,40)};const m=c.spawnEnemy(c.pick(ids),p.x,p.y);if(m){m.spawnedBy=b;m.spawnT=.45;IS.fx&&IS.fx.poof(p.x,p.y,'#7d6a5a')}}}
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

  const attacks={
    hop,
    chargeDash:(b,dt,s,c)=>tele(b,s,.55)&&dash(b,c,s,560,.9),
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
  IS.ATTACK_LIST.forEach(n=>IS.defineAttack(n,attacks[n]||shots(4,.2)))
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
