;(function (IS) {
  'use strict'
  IS.makeEntity = (def, x, y, opts) => Object.assign({ id:def.id,def,x,y,vx:0,vy:0,kbx:0,kby:0,r:def.r||22,hp:def.hp||10,maxHp:def.hp||10,dmg:def.dmg||1,speed:def.speed==null?100:def.speed,flying:!!def.flying,dead:false,hurtT:0,status:{},ai:{},champion:null,room:null,spawnedBy:null,invuln:false,boss:!!def.boss,phase:0,attack:null,attackT:0,sprite:def.sprite||def.id,tint:def.tint||'#fff',scale:1,frame:0,dir:1,friendly:false,spawnT:0},opts)
  IS.entityHit = (a,b) => !!a && !!b && !a.dead && !b.dead && IS.circleHit(a.x,a.y,a.r||0,b.x,b.y,b.r||0)
  // Statuses are seconds remaining. Bosses shrug off the ones that would trivialise a fight
  // and thaw faster from the ones that stop them.
  const BOSS_IMMUNE=new Set(['fear','charm','confusion','shrink','baited','magnetize','sticky'])
  const BOSS_SHORT=new Set(['freeze','petrify','ice'])
  // freeze, ice and petrify stop an enemy dead: no movement, no attacks, no contact damage
  IS.isStopped = e => !!(e && e.status && (e.status.freeze||e.status.petrify||e.status.ice))
  IS.applyStatus = (e,s,secs) => { if (!e||!e.status||!IS.STATUS_LIST.includes(s)) return e; if (e.boss&&BOSS_IMMUNE.has(s)) return e; secs=(secs||0)*(e.boss&&BOSS_SHORT.has(s)?.4:1); if (e.def&&e.def.immune&&e.def.immune.includes&&e.def.immune.includes(s)) return e; e.status[s]=Math.max(e.status[s]||0,secs); return e }
  // speed multiplier from statuses (stopped statuses are handled by the AI loop skipping the enemy)
  IS.statusSpeed = e => { const s=e&&e.status; if(!s)return 1; return (s.slow?.55:1)*(s.sticky?.5:1)*(IS.isStopped(e)?0:1) }
  IS.updateStatuses = (e,dt,ctx) => {
    if (!e || !e.status) return
    const run=ctx&&ctx.run, dmgP=ctx&&ctx.player&&ctx.player.stats?ctx.player.stats.damage:3.5
    // a shrunk enemy has half the hitbox (and can be stepped on); it regrows when the status ends
    if (e.status.shrink) { if (!e.rBase) e.rBase=e.r; e.r=e.rBase*.5 } else if (e.rBase) { e.r=e.rBase; e.rBase=0 }
    const tick=(k,every,fn)=>{ if (!e.status[k]) return; e.st=e.st||{}; e.st[k]=(e.st[k]||0)+dt; while (e.st[k]>=every) { e.st[k]-=every; fn() } }
    tick('poison',.5,()=>IS.damageEnemy(e,Math.max(.5,dmgP*.2),{silent:true,dot:true},ctx))
    tick('burn',.5,()=>IS.damageEnemy(e,Math.max(.5,dmgP*.2),{silent:true,dot:true},ctx))
    // bleeding costs a slice of max health, so it matters most against big enemies
    tick('bleed',.5,()=>IS.damageEnemy(e,Math.max(.4,e.maxHp*.02),{silent:true,dot:true},ctx))
    for (const s of Object.keys(e.status)) { e.status[s]-=dt; if (e.status[s]<=0) { delete e.status[s]; if (e.st) delete e.st[s] } }
  }

  // Knockback lives in its own decaying channel. AI steering and player input
  // both overwrite vx/vy every frame, so an impulse added there is eaten at once.
  IS.knockback = (e,x,y,f) => { if (!e) return; const n=IS.norm(e.x-x,e.y-y);e.kbx=(e.kbx||0)+n.x*f;e.kby=(e.kby||0)+n.y*f }

  // Push a circle out of every solid cell it overlaps. Walls outside an L-shaped
  // room's footprint count as solid; flyers ignore rocks and pits, not walls.
  IS.collideGrid = (e,room) => {
    if (!room || !IS.solidAt) return false
    const T=IS.TILE, r=e.r||0, opts={flying:false,ignorePits:false}
    const fly = e.flying || (e.flags && e.flags.has && e.flags.has('flying'))
    let hit=false
    const c0=Math.floor((e.x-r)/T), c1=Math.floor((e.x+r)/T), r0=Math.floor((e.y-r)/T), r1=Math.floor((e.y+r)/T)
    for (let row=r0; row<=r1; row++) for (let col=c0; col<=c1; col++) {
      if (col<0||row<0||col>=room.w||row>=room.h) continue
      const cx=col*T+T/2, cy=row*T+T/2
      const solid = fly ? IS.solidAt(room,cx,cy,{flying:true}) : IS.solidAt(room,cx,cy,opts)
      if (!solid) continue
      const nx=IS.clamp(e.x,col*T,col*T+T), ny=IS.clamp(e.y,row*T,row*T+T)
      const dx=e.x-nx, dy=e.y-ny, d2=dx*dx+dy*dy
      if (d2>=r*r) continue
      if (d2===0) {
        // centre inside the cell: leave by the nearest face
        const l=e.x-col*T, rt=col*T+T-e.x, t=e.y-row*T, b=row*T+T-e.y, m=Math.min(l,rt,t,b)
        if (m===l) e.x=col*T-r; else if (m===rt) e.x=col*T+T+r; else if (m===t) e.y=row*T-r; else e.y=row*T+T+r
      } else { const d=Math.sqrt(d2); e.x+=dx/d*(r-d); e.y+=dy/d*(r-d) }
      hit=true
    }
    return hit
  }

  IS.moveEntity = (e,dt,room) => {
    if (!e || e.dead) return
    const slow=IS.statusSpeed(e)
    const k=Math.exp(-dt*9)
    e.x+=((e.vx||0)*slow+(e.kbx||0))*dt; e.y+=((e.vy||0)*slow+(e.kby||0))*dt
    e.kbx=(e.kbx||0)*k; e.kby=(e.kby||0)*k
    if (Math.abs(e.kbx)<1) e.kbx=0
    if (Math.abs(e.kby)<1) e.kby=0
    e.bumped = room && room.obstacles ? IS.collideGrid(e,room) : false
    IS.clampToRoom(room,e)
  }

  // Soft separation so a room of chasers reads as a crowd instead of one blob.
  IS.separateEnemies = (list) => {
    for (let i=0;i<list.length;i++) { const a=list[i]; if (a.dead||a.boss) continue
      for (let j=i+1;j<list.length;j++) { const b=list[j]; if (b.dead||b.boss||a.flying!==b.flying) continue
        const dx=b.x-a.x, dy=b.y-a.y, min=(a.r+b.r)*.9, d2=dx*dx+dy*dy
        if (d2>=min*min||d2===0) continue
        const d=Math.sqrt(d2), p=(min-d)*.5/d
        a.x-=dx*p; a.y-=dy*p; b.x+=dx*p; b.y+=dy*p } }
  }

  IS.damageEnemy = (e,dmg,opts,ctx) => {
    if (!e || e.dead || e.invuln) return false
    opts=opts||{}
    let n=Math.max(0,dmg||0)
    if (ctx && ctx.player && IS.fireHook) { const rs=IS.fireHook(ctx.player,'onEnemyDamage',[e,n],ctx); rs.forEach(v=>{if(typeof v==='number')n=v}) }
    e.hp-=n; e.hurtT=.1
    if (!opts.silent) {
      const src=opts.src
      if (src && !e.boss && !e.def.heavy) { const s=IS.norm(src.vx||0,src.vy||0); e.kbx=(e.kbx||0)+s.x*(opts.knock||260); e.kby=(e.kby||0)+s.y*(opts.knock||260) }
      if (e.boss && IS.fx) IS.fx.shake(1.5,.08)
      if (ctx && ctx.sfx) ctx.sfx('enemy-hurt',{rate:.9+((e.hp|0)%5)*.04})
    }
    if (e.hp<=0) return IS.killEnemy(e,ctx)
    return false
  }

  IS.killEnemy = (e,ctx) => {
    if (!e||e.dead) return false
    e.dead=true; e.hp=0
    if (IS.fx) {
      const blood = e.def && /bony|bone|ghost|wizoob|host/.test(e.id) ? '#d8cfb7' : '#8e1f18'
      IS.fx.blood(e.x,e.y,e.boss?28:Math.round(6+e.r/4),blood)
      IS.fx.decal && IS.fx.decal(e.x,e.y+e.r*.4,e.r*(e.boss?1.6:1.1),'rgba(110,24,20,.55)')
      IS.fx.poof(e.x,e.y,'#cfc8bd')
      IS.fx.shake(e.boss?10:2.5,e.boss?.5:.12)
    }
    if (ctx && ctx.sfx) ctx.sfx(e.boss?'boss-die':'enemy-die')
    if (e.status && e.status.midas && ctx && ctx.spawnPickup) { const n=e.boss?4:1+(e.maxHp>20?1:0); for (let i=0;i<n;i++) ctx.spawnPickup('coin',e.x+ctx.range(-18,18),e.y+ctx.range(-18,18),{variant:'penny',toss:true}) }
    if (e.status && e.status.ice && ctx && ctx.player) { const d=Math.max(1,(ctx.player.stats.damage||3.5)*.5); for (let i=0;i<8;i++) { const a=i*Math.PI/4+Math.PI/8; IS.spawnTear({x:e.x,y:e.y,vx:Math.cos(a)*420,vy:Math.sin(a)*420,dmg:d,r:6,life:.45,flags:new Set(['spectral']),tint:'#bfe8ff'},ctx) } if (IS.fx) IS.fx.poof(e.x,e.y,'#bfe8ff') }
    if (e.boss && e.attack && IS.endBossAttack) IS.endBossAttack(e)
    if (IS.enemyDeathRattle) IS.enemyDeathRattle(e,ctx)
    if (e.def&&e.def.splitInto&&ctx) e.def.splitInto.forEach((id,i)=>{const c=ctx.spawnEnemy(id,e.x+(i?14:-14),e.y); if (c) { c.spawnT=.35; IS.knockback(c,e.x,e.y,240) }})
    if (ctx&&ctx.player&&IS.fireHook) IS.fireHook(ctx.player,'onEnemyKill',[e],ctx)
    if (IS.enemyDrops) IS.enemyDrops(e,ctx)
    if (IS.save) IS.save.seeEnemy(e.id,true)
    return true
  }

  IS.enemyShoot = (e,o,ctx) => { o=o||{};const count=o.count||1,spread=o.spread||0,a=o.angle==null?IS.angleTo(e.x,e.y,ctx.player.x,ctx.player.y):o.angle;for(let i=0;i<count;i++){const q=a+(i-(count-1)/2)*spread;ctx.spawnEnemyShot({x:e.x,y:e.y,vx:Math.cos(q)*(o.speed||300),vy:Math.sin(q)*(o.speed||300),dmg:o.dmg||e.dmg||1,r:o.r||9,flags:o.flags||[],life:o.life||4,gravity:o.gravity||0,homing:o.homing||0,accel:o.accel||0})}if(ctx.sfx)ctx.sfx('enemy-shoot') }
  IS.enemyContactDamage = (e,p,ctx) => { if(e.spawnT>0||e.harmless||IS.isStopped(e))return; if(e.status&&e.status.shrink&&!e.boss&&IS.entityHit(e,p)){IS.killEnemy(e,ctx);return}; if(IS.entityHit(e,p)&&IS.damagePlayer(p,e.dmg||1,e,ctx))IS.knockback(p,e.x,e.y,520) }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
