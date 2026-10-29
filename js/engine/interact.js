;(function (IS) {
  'use strict'
  // Everything the player does by touching things: picking up pickups, paying for
  // them (coins, red heart containers, soul hearts, Keeper's coins), opening
  // chests, and walking through doors. Beggars and machines live in machines.js.

  // ---- hearts -------------------------------------------------------------
  // hearts.red/soul/black/bone/gold/rotten/broken are half-heart counts; eternal is 0 or 1.
  IS.addEternalHeart=(p,n)=>{for(let i=0;i<(n||1);i++){if(p.hearts.eternal<1)p.hearts.eternal=1;else{IS.addMaxHearts(p,2,true)}}return p.hearts.eternal}
  IS.addGoldHearts=(p,n)=>(p.hearts.gold+=n||2)
  IS.addRottenHearts=(p,n)=>(p.hearts.rotten=Math.min(p.hearts.maxRed,(p.hearts.rotten||0)+(n||2)))
  // a broken heart takes the place of a red container and stays broken
  IS.addBrokenHearts=(p,n,ctx)=>{n=n||1;p.hearts.broken=Math.min(12,(p.hearts.broken||0)+n);IS.addMaxHearts(p,0);if(p.hearts.broken>=12&&!p.dead&&ctx)IS.killPlayer(p,ctx);return p.hearts.broken}
  // eternal hearts become a heart container on the next floor
  IS.floorStartHearts=p=>{if(p.hearts.eternal>0){p.hearts.eternal=0;IS.addMaxHearts(p,2,true)}}
  // damage eats eternal, gold, soul, black, then red (rotten red hatches a blue fly) and bone
  IS.absorbDamage=(p,left,ctx)=>{for(const k of ['eternal','gold','soul','black','red','bone']){const d=Math.min(p.hearts[k]||0,left);if(!d)continue;p.hearts[k]-=d;left-=d;if(k==='red'&&p.hearts.rotten>0){p.hearts.rotten=Math.max(0,Math.min(p.hearts.rotten,p.hearts.red));try{ctx?.spawnFamiliar&&ctx.spawnFamiliar('blue-fly')}catch(e){}}if(!left)break}return left}
  // item grants: containers, heart types, consumables
  IS.applyGrant=(p,g,ctx)=>{IS.addMaxHearts(p,g.maxHearts||0,!!g.heal);IS.healRed(p,g.heal||0);IS.addSoulHearts(p,g.soul||0);IS.addBlackHearts(p,g.black||0);IS.addBoneHearts(p,g.bone||0);if(g.eternal)IS.addEternalHeart(p,g.eternal);if(g.gold)IS.addGoldHearts(p,g.gold);if(g.rotten)IS.addRottenHearts(p,g.rotten);if(g.broken)IS.addBrokenHearts(p,g.broken,ctx);IS.addCoins(p,g.coins||0);IS.addBombs(p,g.bombs||0);IS.addKeys(p,g.keys||0);if(g.goldenBomb)p.goldenBomb=true;if(g.goldenKey)p.goldenKey=true}

  // ---- prices -------------------------------------------------------------
  // null means free. Otherwise {type:'coin'|'heart'|'soul', amount, ok}. Heart prices are
  // half hearts of red container (2 = one container); with no containers to give the
  // deal costs soul hearts instead, and Keeper pays 15 coins per container.
  IS.priceOf=(p,x)=>{if(!x||x.priceType==='free'||!(x.price>0))return null
    if(x.priceType==='heart'){if(p.flags.has('freeDevilDeals'))return null
      if(p.flags.has('keeperHearts')){const a=Math.ceil(x.price/2)*15;return{type:'coin',amount:a,ok:p.coins>=a}}
      const left=IS.totalHearts(p)-x.price
      if(p.hearts.maxRed>=x.price&&left>0)return{type:'heart',amount:x.price,ok:true}
      const s=x.soulPrice||6;return{type:'soul',amount:s,ok:p.hearts.soul+p.hearts.black>=s&&IS.totalHearts(p)-s>0}}
    if(p.flags.has('freeShopItems'))return null
    return{type:'coin',amount:x.price,ok:p.coins>=x.price}}
  IS.pay=(p,c)=>{if(c.type==='coin')p.coins-=c.amount
    else if(c.type==='heart'){p.hearts.maxRed-=c.amount;p.hearts.red=Math.min(p.hearts.red,p.hearts.maxRed);p.hearts.rotten=Math.min(p.hearts.rotten||0,p.hearts.maxRed)}
    else{let n=c.amount;for(const k of ['black','soul']){const d=Math.min(p.hearts[k],n);p.hearts[k]-=d;n-=d}}}

  // ---- collecting ---------------------------------------------------------
  const heal=(p,n)=>p.flags.has('keeperHearts')?0:IS.healRed(p,n)
  const redFull=p=>p.hearts.red>=p.hearts.maxRed||p.flags.has('cantHeal')
  function takeHeart(p,x,ctx){const a=x.amount||2
    switch(x.variant){
      case'eternal':IS.addEternalHeart(p,1);return true
      case'bone':IS.addBoneHearts(p,2);return true
      case'gold':IS.addGoldHearts(p,2);return true
      case'blended':{const r=redFull(p)?0:heal(p,1);IS.addSoulHearts(p,2-r);return true}
      case'rotten':if(redFull(p))return false;heal(p,2);IS.addRottenHearts(p,2);return true
      default:if(redFull(p))return false;heal(p,a);return true}}
  function takeBattery(p,x){let ok=false;for(let s=0;s<p.active.length;s++){const a=p.active[s];if(!a||!a.maxCharge)continue
    if(x.variant==='mega'){if(a.charge<a.maxCharge||!a.batteryCharge){a.charge=a.maxCharge;a.batteryCharge=a.maxCharge;ok=true}}
    else if(a.charge<a.maxCharge){IS.addCharge(p,x.variant==='micro'?2:a.maxCharge,s);ok=true}
    if(ok)break}return ok}
  function takeTrinket(p,x,ctx){const id=x.id||ctx.rollTrinket();if(!id)return false;if(IS.giveTrinket(p,id))return true;IS.dropTrinket(p,0,ctx);return IS.giveTrinket(p,id)}
  function collect(p,x,ctx){switch(x.kind){
    case'coin':if(p.flags.has('keeperHearts')){p.hearts.red=Math.min(p.hearts.maxRed,p.hearts.red+(x.amount||1))}IS.addCoins(p,x.amount||1);if(x.lucky){p.base.luck=(p.base.luck||0)+1;IS.recalcStats(p)}return true
    case'bomb':if(x.golden)p.goldenBomb=true;else IS.addBombs(p,x.amount||1);return true
    case'key':if(x.golden)p.goldenKey=true;else IS.addKeys(p,x.amount||1);return true
    case'heart':return takeHeart(p,x,ctx)
    case'soul':IS.addSoulHearts(p,x.amount||2);return true
    case'black':IS.addBlackHearts(p,x.amount||2);return true
    case'battery':return takeBattery(p,x)
    case'item':{const ok=IS.giveItem(p,x.id,{ctx});if(ok){const d=IS.itemsById[x.id];IS.holdPose(p,x.id);if(d&&ctx.banner)ctx.banner(d.name||x.id,d.desc||d.description||d.quote||'')}return ok}
    case'trinket':return takeTrinket(p,x,ctx)
    case'card':case'rune':return IS.givePocket(p,x.kind,x.id||ctx.rollCard())
    case'pill':return IS.givePocket(p,'pill',x.id||ctx.rollPill())
    default:return false}}

  const BAG_KINDS=new Set(['coin','key','bomb','heart','soul','black','card','pill','rune','battery'])
  IS.tryTakePickup=(p,x,ctx)=>{if(x.dead||x.taken||x.removed)return false
    if(x.kind==='chest'||x.kind==='sack')return IS.touchChest(p,x,ctx)
    if(!(x.price>0)&&BAG_KINDS.has(x.kind)&&p.active.some(a=>a&&IS.itemsById[a.id]?.consumesPickups)){const bag=p.cache.bag||(p.cache.bag=[]);if(bag.length<8){bag.push(x.kind);x.dead=x.taken=true;ctx.sfx&&ctx.sfx('item-pickup');return true}}
    const cost=IS.priceOf(p,x);if(cost&&!cost.ok)return false
    if(!collect(p,x,ctx))return false
    if(cost){IS.pay(p,cost);if(x.priceType==='heart'){ctx.run.devilDealsTaken=(ctx.run.devilDealsTaken||0)+1;ctx.sfx&&ctx.sfx('devil-deal')}else ctx.sfx&&ctx.sfx('shop-buy');IS.fireHook(p,'onPurchase',[x],ctx)}
    x.dead=x.taken=true;IS.fireHook(p,'onPickup',[x.kind,x.amount||1],ctx);return true}

  // ---- chests -------------------------------------------------------------
  // needs: 'key' (a golden key works too), 'bomb' (opened by an explosion). item: chance of
  // a pedestal from the chest's pool; n: how many pickups; mix: weighted pickup kinds.
  const MIX={coin:30,heart:20,bomb:14,key:14,card:10,pill:7,trinket:2}
  const CHEST={
    normal:{n:[1,3],mix:MIX},
    golden:{needs:'key',n:[2,4],mix:MIX,item:.3,pool:'golden-chest'},
    red:{n:[1,3],mix:{heart:30,black:6,soul:10,key:10,coin:10,card:8,pill:6},item:.25,pool:'red-chest',spider:.12,hurt:.1},
    spiked:{spike:1,n:[2,4],mix:MIX,item:.35,pool:'golden-chest'},
    mimic:{mimic:1,n:[0,0],mix:MIX},
    haunted:{haunt:1,n:[0,0],mix:MIX},
    old:{n:[1,3],mix:MIX,item:.2,pool:'old-chest',spider:.2},
    mega:{needs:'key',n:[1,2],mix:MIX,item:1,pool:'treasure'},
    bomb:{bomb:1,n:[2,4],mix:{bomb:60,coin:10,key:10,heart:10}},
    eternal:{needs:'key',n:[1,2],mix:{eternal:50,soul:30,card:10,key:10},item:.2,pool:'angel'},
    stone:{needs:'bomb',n:[2,4],mix:{bomb:25,key:25,coin:25,card:12,trinket:5,heart:8},item:.1,pool:'treasure'},
    wooden:{n:[1,3],mix:MIX,item:.15,pool:'wooden-chest'},
    sack:{n:[1,3],mix:{coin:30,heart:20,bomb:15,key:15}},
    black:{n:[1,3],mix:{heart:20,black:10,soul:20,bomb:15,key:10,coin:10},blackSack:1}}
  IS.CHEST_RULES=CHEST
  const rule=x=>CHEST[x.kind==='sack'?(x.variant==='black'?'black':'sack'):(x.variant||'normal')]||CHEST.normal
  const entry=k=>k==='eternal'?{kind:'heart',variant:'eternal'}:k==='black'||k==='soul'?{kind:k}:{kind:k}
  // Contents are rolled when the chest spawns so Guppy's Eye can show them (pu.revealed).
  IS.rollChestContents=(room,x,run,rng)=>{const r=rule(x),out=[];if(!rng)return out
    if(r.item&&rng.chance(r.item)&&run&&IS.rollItem){const id=IS.rollItem(run,r.pool);if(id)out.push({kind:'item',id,pool:r.pool})}
    const n=r.n[0]+(r.n[1]>r.n[0]?rng.int(r.n[1]-r.n[0]+1):0),keys=Object.keys(r.mix)
    for(let i=0;i<n;i++)out.push(entry(rng.pickWeighted(keys,keys.map(k=>r.mix[k]))))
    if(r.spider&&rng.chance(r.spider))out.push({special:'spider'});else if(r.hurt&&rng.chance(r.hurt))out.push({special:'hurt'})
    if(r.bomb)out.push({special:'bomb'})
    return out}
  IS.openChest=(room,x,ctx,p)=>{if(x.opened)return false;x.opened=true;x.openT=0;const r=rule(x);ctx.sfx&&ctx.sfx('chest-open')
    p=p||ctx.player
    if(r.spike)IS.damagePlayer(p,1,{name:'a spiked chest',kind:'chest'},ctx)
    if(r.mimic){IS.damagePlayer(p,1,{name:'a mimic chest',kind:'chest'},ctx);for(let i=0;i<2;i++)ctx.spawnEnemy&&ctx.spawnEnemy('attackfly',x.x+(i?30:-30),x.y)}
    if(r.haunt&&IS.enemiesById['lil-haunt']&&ctx.spawnEnemy)ctx.spawnEnemy('lil-haunt',x.x,x.y)
    const list=x.contents||(x.contents=IS.rollChestContents(room,x,ctx.run,room.rng))
    for(const e of list){
      if(e.special==='spider'){for(let i=0;i<3;i++)ctx.spawnEnemy&&ctx.spawnEnemy('fly',x.x+ctx.range(-40,40),x.y+ctx.range(-30,30));continue}
      if(e.special==='hurt'){IS.damagePlayer(p,1,{name:'a red chest',kind:'chest'},ctx);continue}
      if(e.special==='bomb'){IS.spawnBomb(x.x,x.y,{fuse:1.2,dmg:40,r:90,friendly:false},ctx);continue}
      const a=ctx.range(0,6.28),o={variant:e.variant,id:e.id,toss:true,tossAngle:a,pool:e.pool,rng:room.rng,run:ctx.run}
      IS.spawnPickup(room,e.kind,x.x+Math.cos(a)*34,x.y+Math.sin(a)*34,o)}
    if(x.kind==='sack')x.removed=true
    return true}
  IS.touchChest=(p,x,ctx)=>{if(x.opened)return false;const r=rule(x),room=ctx.room||ctx.run.room
    if(r.needs==='bomb')return false
    if(r.needs==='key'){if(!p.goldenKey&&p.keys<1)return false;if(!p.goldenKey)p.keys--;x.locked=false}
    return IS.openChest(room,x,ctx,p)}

  // ---- doors, trapdoors, deals --------------------------------------------
  IS.tryDoor=(p,d,ctx)=>{if(d.hidden)return false;if(!d.open){const room=ctx.room||ctx.run&&ctx.run.room;if(room&&!room.cleared)return false;if(d.locked&&!p.goldenKey){if(!p.keys)return false;p.keys--}d.locked=false;d.open=true;IS.fireHook(p,'onDoorOpen',[d],ctx)}if(d.target!=null){const from=ctx.run.roomIndex;IS.enterRoom(ctx.run,d.target,IS.DIR_OPPOSITE[d.dir],ctx);if(ctx.run.roomIndex!==from)IS.beginTransition(d.dir,from,ctx.run.roomIndex)}return true}
  IS.buy=(room,e,ctx)=>{if(e.sold)return false;const c=IS.priceOf(ctx.player,e);if(c&&!c.ok)return false;if(c)IS.pay(ctx.player,c);e.sold=true;if(e.itemId)IS.giveItem(ctx.player,e.itemId,{ctx});else IS.tryTakePickup(ctx.player,e,ctx);IS.fireHook(ctx.player,'onPurchase',[e],ctx);return true}
  IS.donate=(room,m,n,ctx)=>{n=Math.min(n||1,ctx.player.coins);ctx.player.coins-=n;m.coins=(m.coins||0)+n;IS.progress.record('donation',{amount:n},ctx.run);return n}
  IS.sacrifice=(room,ctx)=>IS.damagePlayer(ctx.player,2,{kind:'sacrifice'},ctx)
  IS.spawnTrapdoor=(room,x,y,o)=>{room.trapdoor=Object.assign({x:x??room.pxW/2,y:y??room.pxH/2,open:true},o);return room.trapdoor}
  IS.spawnCrawlspace=(room,x,y)=>{room.crawlspace={x:x??room.pxW/2,y:y??room.pxH/2};return room.crawlspace}
  IS.useTrapdoor=(run,ctx)=>{const n=IS.nextFloorIds(run);return n.normal?IS.startFloor(run,n.normal,ctx):null}
  IS.spawnDevilDeal=(room,run,ctx)=>{for(let i=0;i<2;i++)IS.spawnPedestal(room,(ctx&&ctx.rollItem?ctx.rollItem('devil'):IS.rollItem(run,'devil')),room.pxW/2+(i*2-1)*80,room.pxH/2,room.type==='devil'?{deal:'devil'}:{price:2,priceType:'heart',soulPrice:6,deal:'devil'});return room.pickups}
  IS.spawnAngelDeal=(room,run)=>IS.spawnPedestal(room,IS.rollItem(run,'angel'),room.pxW/2,room.pxH/2,{deal:'angel'})
  IS.rerollPedestals=(room,run,ctx)=>{for(const p of room.pickups)if(p.kind==='item'&&!p.dead)p.id=IS.rollItem(run,p.pool||'treasure');ctx?.sfx('reroll');return room.pickups}
  IS.updateInteractions=(room,dt,ctx)=>{const p=ctx.player;if(!p||p.dead)return
    for(const x of room.pickups)if(!x.dead&&!x.taken&&!x.removed&&IS.entityHit(x,p))IS.tryTakePickup(p,x,ctx)
    for(const d of room.doors)if(IS.dist(p.x,p.y,d.x,d.y)<72)IS.tryDoor(p,d,ctx)}
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
