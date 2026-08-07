;(function (IS) {
  'use strict'
  IS.initPools=run=>{run.pools={};for(const n of IS.POOL_LIST)run.pools[n]=Object.values(IS.items).filter(d=>(d.pools||[]).includes(n)&&(!IS.save||IS.save.itemUnlocked(d.id))).map(d=>d.id);run.seenItems={};IS.assignPillColours(run);return run.pools}
  IS.rollItem=(run,pool,opts)=>{opts=opts||{};if(!run.pools)IS.initPools(run);let a=(run.pools[pool]||run.pools.treasure||[]).filter(id=>{const d=IS.itemsById[id];return(opts.quality==null||d.quality===opts.quality)&&(!opts.tag||(d.tags||[]).includes(opts.tag))});if(!a.length)return null;const id=run.poolRng.pick(a);if(!opts.noRemove)IS.removeFromPools(run,id);run.seenItems[id]=(run.seenItems[id]||0)+1;return id}
  IS.removeFromPools=(run,id)=>{for(const k in run.pools)run.pools[k]=run.pools[k].filter(x=>x!==id)}
  const rollRegistry=(run,obj,filter)=>{const a=Object.values(obj).filter(filter||(()=>true));return a.length?run.poolRng.pick(a).id:null}
  IS.rollTrinket=(run)=>rollRegistry(run,IS.trinkets);IS.rollCard=(run)=>rollRegistry(run,IS.cards,d=>d.cardType!=='rune');IS.rollRune=(run)=>rollRegistry(run,IS.cards,d=>d.cardType==='rune'||d.cardType==='soul-stone');IS.rollPill=(run)=>rollRegistry(run,IS.pills)
  IS.devilChance=run=>IS.clamp((run.devilBase==null?.33:run.devilBase)+(run.player.stats.devilChance||0),0,1)
  IS.planetariumChance=run=>IS.clamp((run.planetariumBase||.01)+(run.treasuresSkipped||0)*.2,0,1)
  IS.assignPillColours=run=>{const ids=run.poolRng.shuffle(Object.keys(IS.pills));run.pillColours={};run.identifiedPills={};for(let i=0;i<ids.length;i++)run.pillColours[i%13]=ids[i];return run.pillColours}
  IS.pillFor=(run,c)=>run.pillColours?.[c]||null;IS.identifyPill=(run,c)=>{run.identifiedPills[c]=true;return IS.pillFor(run,c)}
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
