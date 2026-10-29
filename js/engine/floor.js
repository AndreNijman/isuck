;(function (IS) {
  'use strict'
  IS.floorDef=id=>IS.floorsById[id]||null
  // Curses: none on the first floor, then each of the floor's weighted curses rolls
  // on its own. onCurseEval lets items (Black Candle) rewrite the mask; a number
  // returned by a hook replaces it. `floor` only needs { rng, def }.
  IS.rollCurses=(run,floor)=>{let mask=0;const w=floor.def.curseWeights||{};if((floor.def.depth||1)>1)for(const n in w)if(floor.rng.chance(.08*w[n]))mask|=IS.CURSE[n.toUpperCase().replace('-','_')]||0
    if(run.player&&IS.fireHook)for(const v of IS.fireHook(run.player,'onCurseEval',[mask],IS.state?.ctx||{run,player:run.player}))if(typeof v==='number')mask=v
    return mask}

  // ---------------------------------------------------------------------------
  // Floor layout, after Isaac: rooms grow breadth-first from the start cell on a
  // 13x13 map, a cell is only added when it would touch one existing room (so
  // the map branches instead of clumping), and the special rooms go on dead
  // ends — the boss on the one furthest from the start. Secret rooms sit in
  // empty cells walled in by rooms; big rooms span two or four map cells.
  // ---------------------------------------------------------------------------
  const SIZE=13, MID=6, DIRS=[[1,0,'right'],[-1,0,'left'],[0,1,'down'],[0,-1,'up']]
  const key=(x,y)=>x+','+y
  const SHAPE_CELLS={'1x1':[[0,0]],'2x1':[[0,0],[1,0]],'1x2':[[0,0],[0,1]],'2x2':[[0,0],[1,0],[0,1],[1,1]]}

  function roomCount(def,rng){
    // Isaac: min(20, rand(0..1) + 5 + floor(stage * 10 / 3))
    const n=Math.min(20,rng.int(2)+5+Math.floor((def.depth||1)*10/3))
    return Math.max(def.rooms?.[0]||0,n)
  }

  function grow(rng,target){
    const filled=new Set([key(MID,MID)]),cells=[{x:MID,y:MID}],queue=[cells[0]]
    const around=(x,y)=>DIRS.reduce((n,d)=>n+(filled.has(key(x+d[0],y+d[1]))?1:0),0)
    let guard=0
    while(queue.length&&cells.length<target&&guard++<2000){
      const c=queue.shift()
      for(const d of rng.shuffle(DIRS)){
        if(cells.length>=target)break
        const x=c.x+d[0],y=c.y+d[1]
        if(x<1||y<1||x>=SIZE-1||y>=SIZE-1||filled.has(key(x,y)))continue
        if(around(x,y)>1||rng.chance(.5))continue
        filled.add(key(x,y));const n={x,y};cells.push(n);queue.push(n)
      }
      // a stalled queue restarts from a random room, as Isaac re-seeds
      if(!queue.length&&cells.length<target)queue.push(rng.pick(cells))
    }
    return {cells,filled,around}
  }

  function distances(cells,filled){
    const dist=new Map([[key(MID,MID),0]]),q=[cells[0]]
    while(q.length){const c=q.shift(),d0=dist.get(key(c.x,c.y));for(const d of DIRS){const k=key(c.x+d[0],c.y+d[1]);if(filled.has(k)&&!dist.has(k)){dist.set(k,d0+1);q.push({x:c.x+d[0],y:c.y+d[1]})}}}
    return dist
  }

  function templates(id,type,shape){
    return Object.values(IS.rooms).filter(r=>r.type===type&&(!shape||(r.shape||'1x1')===shape)&&((r.floors||[]).includes(id)||(r.floors||[]).includes('*')))
  }
  function pickTemplate(rng,id,type,shape){
    let list=templates(id,type,shape)
    if(!list.length&&shape)list=templates(id,type,null)
    if(!list.length)return {id:'generated-'+type,type,shape:'1x1',layout:Array(7).fill('.............')}
    return rng.pickWeighted(list,list.map(r=>r.weight==null?1:r.weight))
  }

  // Extra dead ends become optional special rooms, each with an Isaac-like chance.
  function optionalSpecials(def,run,rng){
    const d=def.depth||1,out=[]
    if(d>1&&rng.chance(.5))out.push('curse')
    if(d%2===0&&rng.chance(.5))out.push('arcade')
    if(rng.chance(1/7))out.push('sacrifice')
    if(d>1&&rng.chance(.2))out.push('challenge')
    if(rng.chance(1/20))out.push('library')
    if(rng.chance(1/30))out.push('dice')
    if(d>1&&rng.chance(run?.planetariumChance||.01))out.push('planetarium')
    return rng.shuffle(out)
  }

  IS.generateFloor=(run,id,opts)=>{
    const def=IS.floorDef(id);if(!def)throw new Error('Unknown floor '+id)
    const rng=run.floorRng.fork(),curses=IS.rollCurses(run,{rng,def}),maze=!!(curses&IS.CURSE.LABYRINTH),late=(def.depth||1)>=10
    // Curse of the Labyrinth: an XL floor, two bosses, and a second treasure room and shop
    const target=maze?Math.min(28,Math.ceil(roomCount(def,rng)*1.7)):roomCount(def,rng)
    const need=late?1:maze?6:3
    let g=null,dead=[]
    for(let attempt=0;attempt<200;attempt++){
      g=grow(rng,target)
      dead=g.cells.slice(1).filter(c=>g.around(c.x,c.y)===1)
      if(g.cells.length>=target&&dead.length>=need)break
    }
    const dist=distances(g.cells,g.filled)
    dead.sort((a,b)=>dist.get(key(b.x,b.y))-dist.get(key(a.x,a.y)))

    // cell -> room type
    const type=new Map([[key(MID,MID),'start']])
    if(dead.length)type.set(key(dead[0].x,dead[0].y),'boss')
    if(maze&&dead.length>1)type.set(key(dead[1].x,dead[1].y),'boss')
    const rest=rng.shuffle(dead.slice(maze&&dead.length>1?2:1)),specials=late?[]:(maze?['treasure','shop','treasure','shop']:['treasure','shop']).concat(optionalSpecials(def,run,rng))
    for(let i=0;i<rest.length&&i<specials.length;i++)type.set(key(rest[i].x,rest[i].y),specials[i])

    // secret room: the empty cell with the most room neighbours (not the boss);
    // super secret: an empty cell touching exactly one ordinary room
    const isBoss=(x,y)=>type.get(key(x,y))==='boss'
    const empties=[]
    for(let y=1;y<SIZE-1;y++)for(let x=1;x<SIZE-1;x++){
      if(g.filled.has(key(x,y)))continue
      const nb=DIRS.map(d=>({x:x+d[0],y:y+d[1]})).filter(c=>g.filled.has(key(c.x,c.y)))
      if(!nb.length||nb.some(c=>isBoss(c.x,c.y)))continue
      empties.push({x,y,nb})
    }
    const secret=rng.shuffle(empties).sort((a,b)=>b.nb.length-a.nb.length)[0]
    const extras=[]
    if(secret)extras.push({x:secret.x,y:secret.y,type:'secret'})
    const supers=empties.filter(e=>e!==secret&&e.nb.length===1&&!type.has(key(e.nb[0].x,e.nb[0].y))&&!(secret&&Math.abs(e.x-secret.x)+Math.abs(e.y-secret.y)<=1))
    if(supers.length&&!late)extras.push(Object.assign({type:'super-secret'},rng.pick(supers)))
    for(const e of extras){g.cells.push({x:e.x,y:e.y});g.filled.add(key(e.x,e.y));type.set(key(e.x,e.y),e.type)}

    // group ordinary cells into big rooms where the floor has templates for them
    const owner=new Map(),groups=[]
    const free=c=>g.filled.has(key(c[0],c[1]))&&!type.has(key(c[0],c[1]))&&!owner.has(key(c[0],c[1]))
    const addGroup=(x,y,shape,t)=>{const gi=groups.length;groups.push({x,y,shape,type:t});for(const o of SHAPE_CELLS[shape])owner.set(key(x+o[0],y+o[1]),gi)}
    addGroup(MID,MID,'1x1','start')
    for(const c of g.cells){
      const k=key(c.x,c.y);if(owner.has(k))continue
      const t=type.get(k)
      if(t){addGroup(c.x,c.y,'1x1',t);continue}
      let shape='1x1'
      for(const s of rng.shuffle(['2x2','2x1','1x2'])){
        if(!rng.chance(s==='2x2'?.35:.45))continue
        if(!templates(id,'default',s).length)continue
        if(SHAPE_CELLS[s].every(o=>free([c.x+o[0],c.y+o[1]]))){shape=s;break}
      }
      addGroup(c.x,c.y,shape,'default')
    }

    const floor={id,def,depth:def.depth,rooms:[],startIndex:0,bossIndex:groups.findIndex(r=>r.type==='boss'),curses:0,bossIndices:groups.map((r,i)=>r.type==='boss'?i:-1).filter(i=>i>=0),visitedCount:0,layout:{grid:groups,w:SIZE,h:SIZE},rng,altPath:!!opts?.altPath,
      mapOffsets:groups.map(r=>({x:r.x,y:r.y,w:r.shape[0]|0,h:r.shape[2]|0}))}
    groups.forEach((r,i)=>floor.rooms.push(IS.makeRoom(pickTemplate(rng,id,r.type,r.shape),floor,run,{index:i,seed:rng.int(0xffffffff)})))

    // doors: one per pair of touching map cells, in the slot that faces it
    const DOOR={boss:'boss',treasure:'treasure',shop:'shop',secret:'secret','super-secret':'super-secret',curse:'curse',arcade:'arcade',sacrifice:'sacrifice',challenge:'challenge',library:'library',dice:'dice',planetarium:'planetarium'}
    const lockable=(def.depth||1)>1
    for(const c of g.cells){
      const i=owner.get(key(c.x,c.y)),a=groups[i]
      for(const d of DIRS){
        const nk=key(c.x+d[0],c.y+d[1]);if(!owner.has(nk))continue
        const j=owner.get(nk);if(j===i)continue
        const b=groups[j],slot=d[2]==='left'||d[2]==='right'?c.y-a.y:c.x-a.x
        // the door shows the special room it leads to, or the one it is in
        const kind=DOOR[b.type]||DOOR[a.type]||'normal'
        const door=IS.addDoor(floor.rooms[i],d[2],kind,j,slot)
        if(!door)continue
        // only the way IN is locked or hidden; from inside a special room you just leave
        const into=DOOR[b.type]===kind
        if(!into||(!lockable&&(kind==='treasure'||kind==='shop'))){door.locked=false;door.keys=0}
        if(!into){door.hidden=false}
        door.open=!door.locked&&!door.hidden
      }
    }
    floor.curses=curses;return floor}

  // Dad's Note (run.flags.ascent): after the second floor of the sixth stage the way up opens,
  // Ascent I..IV (stages 8..5, the floors you already crossed) and then Home.
  IS.nextFloorIds=run=>{const f=run.floor,d=f?.depth||0,id=f?.def?.id||f?.id||''
    if(run.flags?.ascent){
      const m=/^ascent-(\d)$/.exec(id)
      if(m)return{normal:IS.floorsById['ascent-'+(+m[1]+1)]?'ascent-'+(+m[1]+1):'home',alt:null}
      if(id==='home')return{normal:null,alt:null}
      if(d===6&&/-2$/.test(id))return{normal:'ascent-1',alt:null}
    }
    const all=Object.values(IS.floors).filter(f=>f.depth===d+1);return{normal:all.find(f=>!f.alt)?.id||all[0]?.id||null,alt:f?.def?.altPath||null}}

  // ---------------------------------------------------------------------------
  // Adding rooms to a finished floor: devil/angel rooms after the boss, red rooms
  // (Red Key, Cracked Key) and crawlspaces. The room takes a free cell beside `from`
  // and gets a door each way; with no free cell (or opts.virtual) it sits off the
  // map and is only reachable by that door.
  // ---------------------------------------------------------------------------
  const occupied=floor=>{const s=new Set();for(const g of floor.layout.grid)for(const o of SHAPE_CELLS[g.shape]||SHAPE_CELLS['1x1'])s.add(key(g.x+o[0],g.y+o[1]));return s}
  const doorFree=(room,dir,slot)=>!room.doors.some(d=>d.dir===dir&&d.slot===slot)
  IS.addFloorRoom=(floor,run,type,o)=>{o=o||{}
    const from=floor.rooms[o.from==null?floor.bossIndex:o.from],fg=from&&floor.layout.grid[from.index]
    if(!from||!fg)return null
    const occ=occupied(floor),prefer=o.dir?[o.dir]:['up','right','left','down']
    let spot=null
    if(!o.virtual)for(const dn of prefer){const d=DIRS.find(x=>x[2]===dn)
      for(const c of SHAPE_CELLS[fg.shape]||SHAPE_CELLS['1x1']){const cx=fg.x+c[0],cy=fg.y+c[1],x=cx+d[0],y=cy+d[1]
        if(x<0||y<0||x>=SIZE||y>=SIZE||occ.has(key(x,y)))continue
        const slot=dn==='left'||dn==='right'?cy-fg.y:cx-fg.x
        if(!doorFree(from,dn,slot))continue
        spot={x,y,dir:dn,slot};break}
      if(spot)break}
    if(!spot&&!o.virtual&&!o.virtualOk)return null
    const dir=spot?spot.dir:(o.dir||'up'),back=IS.DIR_OPPOSITE[dir],index=floor.rooms.length
    const room=IS.makeRoom(pickTemplate(floor.rng,floor.id,o.template||type,'1x1'),floor,run,{index,seed:floor.rng.int(0xffffffff),type})
    room.virtual=!spot;room.red=!!o.red;room.returnIndex=from.index
    floor.rooms.push(room)
    const x=spot?spot.x:0,y=spot?spot.y:0
    floor.layout.grid.push({x,y,shape:'1x1',type});floor.mapOffsets.push({x,y,w:1,h:1})
    if(o.noDoor)return room
    const kind=o.doorKind||(IS.DOOR_KIND_LIST.includes(type)?type:'normal')
    const door=IS.addDoor(from,dir,kind,index,spot?spot.slot:undefined)
    if(door){door.locked=false;door.keys=0;door.hidden=false;door.open=!!from.cleared||!IS.roomEnemies(from).length;door.red=!!o.red}
    const bd=IS.addDoor(room,back,kind,from.index,0);if(bd){bd.locked=false;bd.keys=0;bd.hidden=false;bd.open=true}
    return room}

  // After the last boss falls: maybe a devil and/or angel door. APPROXIMATE chances:
  // devilChance() (base .33 + the stat) to get a door at all from stage 2 on; then an
  // angel room instead of a devil one with 50% + angelChance (25% less once a deal is taken).
  // Duality offers both, Eucharist (forceAngel) always an angel room.
  IS.rollBossDoors=(floor,run,ctx)=>{
    if(!floor||floor.dealRolled||(floor.def?.depth||1)<2||(floor.def?.depth||1)>=12||run.flags?.ascent||/^greed-/.test(floor.id))return[]
    floor.dealRolled=true
    const st=run.player.stats,rng=run.rng||floor.rng,got=[]
    const door=rng.chance(IS.devilChance?IS.devilChance(run):.33)||run.flags?.forceAngel||run.flags?.duality&&rng.chance(.5)
    if(!door)return got
    const angelP=IS.clamp(.5+(st.angelChance||0)-((run.devilDealsTaken||0)>0?.25:0),0,1)
    let angel=run.flags?.forceAngel||rng.chance(angelP)
    const want=run.flags?.duality?['devil','angel']:[angel?'angel':'devil']
    for(const t of want)if(IS.addFloorRoom(floor,run,t,{from:floor.bossIndices?.[floor.bossIndices.length-1]??floor.bossIndex,virtualOk:true}))got.push(t)
    return got}

  // Red Key / Cracked Key: a red room beside the room Isaac is in. Returns the room or null.
  IS.openRedRoom=(run,ctx)=>{const floor=run.floor;if(!floor)return null
    const rng=run.rng||floor.rng,types=['default','default','default','treasure','shop','curse','arcade','sacrifice','library']
    const type=rng.pick(types),here=run.room?run.room.index:floor.startIndex
    return IS.addFloorRoom(floor,run,type==='default'?'default':type,{from:here,red:true,doorKind:'normal'})}

  // The hatch under a rock or a Crawlspace item: a one-room underground floor.
  IS.crawlspaceFor=(run,room)=>{const floor=run.floor;if(room.crawlIndex!=null&&floor.rooms[room.crawlIndex])return floor.rooms[room.crawlIndex]
    const c=IS.addFloorRoom(floor,run,'crawlspace',{from:room.index,virtual:true,noDoor:true});if(!c)return null
    c.returnIndex=room.index;room.crawlIndex=c.index;return c}

  // Compass / Mind / Spelunker Hat style flags decide what the map shows.
  const SECRETS=['secret','super-secret']
  IS.applyMapFlags=(run)=>{const f=run.floor,p=run.player;if(!f||!p)return
    const full=p.flags.has('fullMinimap'),see=p.flags.has('seeMinimap'),sec=p.flags.has('seeSecretRooms')
    if(!(full||see||sec))return
    for(const r of f.rooms){if(r.virtual||r.type==='crawlspace')continue
      const secret=SECRETS.includes(r.type)
      if(secret?sec:r.type==='ultra-secret'||r.type==='devil'||r.type==='angel'?false:full||(see&&r.type!=='default'&&r.type!=='start'))r.mapKnown=true}}

  IS.startFloor=(run,id,ctx)=>{run.floor=IS.generateFloor(run,id,{});run.curses=run.floor.curses;run.floor.damageStart=run.stats?.damageTaken||0;run.roomIndex=run.floor.startIndex;run.room=run.floor.rooms[run.roomIndex];run.room.visited=run.room.mapKnown=true;for(const d of run.room.doors){const n=d.target!=null&&run.floor.rooms[d.target];if(n&&!d.hidden)n.mapKnown=true}
    const p=run.player;if(p){p.x=run.room.pxW/2;p.y=run.room.pxH/2;p.vx=p.vy=0}
    IS.refreshCtx(ctx,run.room,0);IS.buildRoomContents(run.room,ctx);IS.fireHook(run.player,'onNewFloor',[run.floor],ctx);IS.applyMapFlags(run)
    if(run.curses&&ctx&&ctx.banner)for(const k in IS.CURSE_NAMES)if(run.curses&k)ctx.banner(IS.CURSE_NAMES[k],'')
    IS.audio?.setFloorMusic(run.floor.def);return run.floor}
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
