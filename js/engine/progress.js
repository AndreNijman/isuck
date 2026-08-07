;(function (IS) {
  'use strict'
  const EVENTS=['boss-killed','floor-cleared','item-taken','coins','bombs','keys','donation','beggar-bombed','room-visited','enemy-killed','item-used','challenge-done','run-won','run-lost','damage-taken']
  IS.progress={EVENTS,
    record(event,data,run){if(!EVENTS.includes(event))return false;run=run||{};(run.events||(run.events=[])).push({event,data:data||{},time:run.time||0});IS.save?.addStat(event,1);this.check(run);return true},
    condition(c,run,save){
      if(!c)return false
      const events=(run&&run.events)||[], stat=(k)=>(save&&save.stats&&save.stats[k])||0
      const has=(name,test)=>events.some(e=>e.event===name&&(!test||test(e.data||{})))
      const player=run&&run.player||{}, type=c.type
      if(type==='custom')return typeof c.check==='function'&&c.check.call(c,save||{},run||{})
      if(type==='coins-in-run'||type==='bombs-in-run'||type==='keys-in-run')return (player[type.split('-')[0]]||0)>=(c.value||0)
      if(type==='items-in-run')return ((player.items&&player.items.length)||0)>=(c.value||0)
      if(type==='defeat-boss')return has('boss-killed',d=>!c.boss||d.id===c.boss||d.boss===c.boss)
      if(type==='defeat-boss-as')return player.charId===c.charId&&has('boss-killed',d=>!c.boss||d.id===c.boss||d.boss===c.boss)
      if(type==='complete-floor')return has('floor-cleared',d=>!c.floor||d.id===c.floor||d.floor===c.floor)
      if(type==='complete-challenge')return has('challenge-done',d=>!c.challenge||d.id===c.challenge)
      if(type==='donate'||type==='donate-greed')return stat(type==='donate'?'donation':'donation-greed')>=(c.value||1)
      if(type==='blow-up-beggars')return stat('beggar-bombed')>=(c.value||1)
      if(type==='kill-count')return stat('enemy-killed')>=(c.value||1)
      if(type==='use-item')return has('item-used',d=>!c.item||d.id===c.item)
      if(type==='visit-room')return has('room-visited',d=>!c.room||d.type===c.room||d.id===c.room)
      if(type==='no-damage-floor')return has('floor-cleared')&&!has('damage-taken')
      if(type==='full-hp-boss')return has('boss-killed')&&(player.hp==null||player.hp>=player.maxHp)
      if(type==='streak-wins')return stat('run-won')>=(c.value||1)
      const goals={'beat-boss-rush':'boss-rush','beat-hush':'hush','beat-delirium':'delirium','beat-mother':'mother','beat-beast':'beast','beat-dogma':'dogma','beat-mega-satan':'mega-satan'}
      if(goals[type])return has('run-won',d=>d.goal===goals[type])||has('boss-killed',d=>d.id===goals[type]||d.boss===goals[type])
      if(type==='all-marks'){const marks=save&&save.goals&&save.goals[c.charId||player.charId];return !!marks&&Object.keys(marks).length>=(c.value||9)}
      return false
    },
    check(run){for(const a of Object.values(IS.achievements)){if(IS.save?.unlocked(a.id))continue;let ok=false;try{ok=typeof a.check==='function'?a.check(run,IS.save.data):this.condition(a.condition,run,IS.save.data)}catch(_){}if(ok)IS.save.unlock(a.id)}},
    completeRun(run,goal){if(run?.player)IS.save?.markGoal(run.player.charId,goal);this.record('run-won',{goal},run);return true}
  }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
