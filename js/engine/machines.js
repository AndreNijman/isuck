;(function (IS) {
  'use strict'
  // Beggars and machines: solid things in a room that take a payment on contact and
  // sometimes pay out. room.machines holds them; sprites are 'machine:<type>'
  // (js/render/sprites-machines.js). Randomness comes from ctx, never the platform.

  const BASIC=[['coin',34],['heart',20],['bomb',14],['key',14],['card',10],['pill',8]]
  const FORTUNES=['Today is a good day to die','You will find what you seek','Beware the unlit room','A stranger holds your fate','Your luck is changing','Look behind the rocks','Mom is watching','Seek the third door','The next floor is kinder']
  const pickW=(ctx,list)=>{let t=0;for(const e of list)t+=e[e.length-1];let r=ctx.range(0,t);for(const e of list){r-=e[e.length-1];if(r<=0)return e}return list[list.length-1]}
  const drop=(room,ctx,m,kind,o)=>{const a=ctx.range(.6,2.5);return IS.spawnPickup(room,kind,m.x+Math.cos(a)*10,m.y+30,Object.assign({toss:true,tossAngle:a,rng:room.rng,run:ctx.run},o))}
  const basic=(room,ctx,m)=>{const e=pickW(ctx,BASIC);return drop(room,ctx,m,e[0])}
  const leave=(room,ctx,m)=>{m.gone=true;IS.fx&&IS.fx.poof&&IS.fx.poof(m.x,m.y,'#cfc8bd')}
  const itemFrom=(room,ctx,m,pool)=>{const id=ctx.rollItem(pool);if(!id)return false;IS.spawnPedestal(room,id,m.x,m.y+62,{pool,announce:true});return true}
  const payCoin=n=>(p)=>p.coins>=n&&(p.coins-=n,true)

  // a beggar: each payment may pay out one of `drops`; sooner or later he hands over an
  // item from his pool and wanders off
  const beggar=(o)=>({r:26,cost:o.cost||payCoin(1),use:(m,p,ctx,room)=>{
    m.paid++;ctx.sfx&&ctx.sfx(o.sfx||'coin')
    if(o.donation&&IS.progress)IS.progress.record('donation',{amount:1},ctx.run)
    if(!ctx.chance(o.chance))return
    m.payouts++
    if(o.pool&&ctx.chance(o.item*(m.payouts>=2?1:.5))&&itemFrom(room,ctx,m,o.pool)){leave(room,ctx,m);return}
    const e=pickW(ctx,o.drops);if(e[0]==='fly'){ctx.spawnFamiliar&&ctx.spawnFamiliar('blue-fly');ctx.spawnFamiliar&&ctx.spawnFamiliar('blue-fly');return}drop(room,ctx,m,e[0],e[1])}})
  const TYPES={
    'beggar':beggar({chance:.35,item:.15,pool:'beggar',donation:true,drops:BASIC}),
    // pays with a full red heart; gives black hearts, keys and devil items
    'devil-beggar':beggar({chance:.4,item:.2,pool:'demon-beggar',sfx:'devil-deal',cost:p=>p.hearts.red>=3&&(p.hearts.red-=2,true),drops:[['black',34],['coin',20],['key',12],['bomb',12],['card',10]]}),
    'key-beggar':beggar({chance:.4,item:.15,pool:'key-master',cost:p=>p.keys>=1&&(p.keys--,true),sfx:'key',drops:[['key',60],['coin',20],['card',20]]}),
    'bomb-bum':beggar({chance:.4,item:.1,pool:'bomb-bum',drops:[['bomb',70],['bomb',['golden'],4],['coin',20]].map(e=>e.length===3?['bomb',{variant:'golden'},e[2]]:e)}),
    'battery-bum':beggar({chance:.4,item:.1,pool:'battery-bum',drops:[['battery',{variant:'micro'},50],['battery',{variant:'normal'},35],['battery',{variant:'mega'},5],['coin',10]]}),
    'rotten-beggar':beggar({chance:.45,item:.1,pool:'rotten-beggar',drops:[['heart',{variant:'rotten'},50],['fly',30],['coin',20]]}),
    'slot-machine':{r:28,cost:payCoin(1),use:(m,p,ctx,room)=>{
      ctx.sfx&&ctx.sfx('coin');m.anim=.6
      const e=pickW(ctx,[['none',46],['coins',16],['pickup',16],['card',8],['trinket',3],['flies',4],['jackpot',2],['coin1',5]])
      if(e[0]==='coins'){for(let i=0,n=2+ctx.int(3);i<n;i++)drop(room,ctx,m,'coin')}
      else if(e[0]==='coin1')drop(room,ctx,m,'coin')
      else if(e[0]==='pickup')drop(room,ctx,m,ctx.pick(['heart','bomb','key']))
      else if(e[0]==='card')drop(room,ctx,m,ctx.pick(['card','pill']))
      else if(e[0]==='trinket')drop(room,ctx,m,'trinket')
      else if(e[0]==='flies'){for(let i=0;i<3;i++)ctx.spawnEnemy&&ctx.spawnEnemy('attackfly',m.x+(i-1)*34,m.y+44)}
      else if(e[0]==='jackpot'&&itemFrom(room,ctx,m,'treasure'))m.broken=true}},
    'fortune-machine':{r:28,cost:payCoin(1),use:(m,p,ctx,room)=>{
      ctx.sfx&&ctx.sfx('coin');m.anim=.6;m.fortune=ctx.pick(FORTUNES);ctx.banner&&ctx.banner('Fortune',m.fortune)
      if(ctx.chance(.3))drop(room,ctx,m,ctx.pick(['coin','key','heart','card']))}},
    // gives coins for blood, now and then a heart container
    'blood-donation-machine':{r:28,cost:p=>p.hearts.red>=2&&(p.hearts.red-=1,true),use:(m,p,ctx,room)=>{
      ctx.sfx&&ctx.sfx('player-hurt');m.anim=.6;m.paid++;IS.fx&&IS.fx.blood&&IS.fx.blood(p.x,p.y,4)
      if(ctx.chance(.07)){IS.addMaxHearts(p,2,true);ctx.floater&&ctx.floater('+1 heart container')}
      else if(ctx.chance(.35))for(let i=0,n=1+ctx.int(3);i<n;i++)drop(room,ctx,m,'coin')}},
    // pay to restock the shop's empty slots
    'restock-box':{r:26,price:5,can:(p,m,room)=>room.type==='shop'&&emptySlots(room).length>0,cost:payCoin(5),use:(m,p,ctx,room)=>{
      ctx.sfx&&ctx.sfx('shop-buy');m.anim=.6
      const slots=emptySlots(room),mid=Math.floor((room.meta.shopSlots||[]).length/2),kinds=['heart','bomb','key','pill','card','battery','soul','sack']
      for(const s of slots){const x=s.col*IS.TILE+IS.TILE/2,y=s.row*IS.TILE+IS.TILE/2
        if(s.i===mid){const id=ctx.rollItem('shop');if(id&&IS.spawnPedestal(room,id,x,y,{shop:true,slot:s.i}))continue}
        IS.spawnPickup(room,ctx.pick(kinds),x,y,{rng:room.rng,run:ctx.run,shop:true,slot:s.i})}}},
    'confessional':{r:30,free:true,cost:()=>true,use:(m,p,ctx,room)=>{
      ctx.sfx&&ctx.sfx('angel-deal');m.anim=.8;m.uses=(m.uses||0)+1
      const e=pickW(ctx,[['soul',35],['eternal',14],['black',10],['card',15],['key',10],['none',16]])
      if(e[0]==='eternal')drop(room,ctx,m,'heart',{variant:'eternal'})
      else if(e[0]!=='none')drop(room,ctx,m,e[0])
      if(m.uses>=3)m.broken=true}}
  }
  IS.MACHINE_TYPES=Object.keys(TYPES)
  function emptySlots(room){const out=[];(room.meta.shopSlots||[]).forEach((s,i)=>{const x=s.col*IS.TILE+IS.TILE/2,y=s.row*IS.TILE+IS.TILE/2;if(!room.pickups.some(u=>!u.taken&&!u.removed&&!u.dead&&IS.dist(u.x,u.y,x,y)<30))out.push({col:s.col,row:s.row,i})});return out}

  IS.spawnMachine=(room,type,x,y)=>{const d=TYPES[type];if(!d)return null
    const m={type,x,y,r:d.r,cool:0,anim:0,t:0,paid:0,payouts:0,gone:false,broken:false,price:d.price||0};(room.machines||(room.machines=[])).push(m);return m}

  IS.updateMachines=(room,dt,ctx)=>{const ms=room.machines;if(!ms||!ms.length)return;const p=ctx&&ctx.player
    for(const m of ms){m.t+=dt;m.cool=Math.max(0,m.cool-dt);m.anim=Math.max(0,m.anim-dt)
      if(m.gone||!p||p.dead)continue
      const dx=p.x-m.x,dy=p.y-m.y,d=Math.hypot(dx,dy),min=p.r*.7+m.r
      if(d<min&&d>.01){p.x=m.x+dx/d*min;p.y=m.y+dy/d*min}
      if(m.broken||m.cool>0||d>min+10)continue
      const T=TYPES[m.type];m.cool=.6
      if(T.can&&!T.can(p,m,room))continue
      if(!T.cost(p,m,room))continue
      T.use(m,p,ctx,room);IS.fireHook&&IS.fireHook(p,'onPurchase',[{kind:'machine',machine:m.type,price:m.price||0}],ctx)}
    room.machines=ms.filter(m=>!m.gone)}

  // explosions: beggars die and spill pickups, machines break and spill coins, stone chests open
  IS.blastInteractables=(x,y,R,ctx)=>{const room=(ctx&&ctx.room)||(ctx&&ctx.run&&ctx.run.room);if(!room)return
    for(const m of room.machines||[]){if(m.gone||IS.dist(x,y,m.x,m.y)>R+m.r)continue
      if(/beggar|bum/.test(m.type)){m.gone=true;IS.progress&&IS.progress.record('beggar-bombed',{},ctx.run);for(let i=0;i<2+ctx.int(2);i++)basic(room,ctx,m)}
      else if(!m.broken){m.broken=true;for(let i=0,n=1+ctx.int(3);i<n;i++)drop(room,ctx,m,'coin')}}
    for(const u of room.pickups||[])if(u.kind==='chest'&&u.variant==='stone'&&!u.opened&&IS.dist(x,y,u.x,u.y)<R+20)IS.openChest(room,u,ctx,ctx.player)}

  // machines turn up now and then: arcades are full of them, shops sometimes hold a
  // restock box or a beggar, and an ordinary room has a small chance of one
  const LOOSE=[['beggar',40],['devil-beggar',10],['key-beggar',14],['bomb-bum',10],['battery-bum',8],['rotten-beggar',5],['slot-machine',30],['fortune-machine',12],['blood-donation-machine',12]]
  IS.populateMachines=(room,ctx,rng)=>{if(!rng||room.index<0)return
    const t=room.type,mid=room.w>>1,midr=room.h>>1,spots=[]
    for(let row=1;row<room.h-1;row++)for(let col=2;col<room.w-2;col++){if(col===mid||row===midr)continue;if(IS.gridAt&&IS.gridAt(room,col,row))continue;if(room.meta.safe&&room.meta.safe[row*room.w+col])continue;spots.push({x:col*IS.TILE+IS.TILE/2,y:row*IS.TILE+IS.TILE/2})}
    if(!spots.length)return
    const spot=()=>{const i=rng.int(spots.length),s=spots[i];spots.splice(i,1);return s}
    const wpick=list=>{const w=list.map(e=>e[1]);return rng.pickWeighted(list.map(e=>e[0]),w)}
    if(t==='arcade'){const n=2+rng.int(2);for(let i=0;i<n&&spots.length;i++){const s=spot();IS.spawnMachine(room,wpick(LOOSE),s.x,s.y)}}
    else if(t==='shop'){if(rng.chance(.3)&&spots.length){const s=spot();IS.spawnMachine(room,'restock-box',s.x,s.y)}if(rng.chance(.1)&&spots.length){const s=spot();IS.spawnMachine(room,'beggar',s.x,s.y)}}
    else if(t==='default'&&rng.chance(.04)){const s=spot();IS.spawnMachine(room,wpick(LOOSE),s.x,s.y)}
    else if(t==='curse'&&rng.chance(.15)){const s=spot();IS.spawnMachine(room,'devil-beggar',s.x,s.y)}
    else if(t==='secret'&&rng.chance(.12)){const s=spot();IS.spawnMachine(room,'confessional',s.x,s.y)}}
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
