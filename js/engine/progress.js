;(function (IS) {
  'use strict'
  const EVENTS=['boss-killed','floor-cleared','item-taken','coins','bombs','keys','donation','beggar-bombed','room-visited','enemy-killed','item-used','challenge-done','run-won','run-lost','damage-taken']
  IS.progress={EVENTS,
    record(event,data,run){if(!EVENTS.includes(event))return false;run=run||{};(run.events||(run.events=[])).push({event,data:data||{},time:run.time||0});IS.save?.addStat(event,1);this.check(run);return true},
    check(run){for(const a of Object.values(IS.achievements)){if(IS.save?.unlocked(a.id))continue;let ok=false;try{ok=typeof a.check==='function'&&a.check(run,IS.save.data)}catch(_){}if(ok)IS.save.unlock(a.id)}},
    completeRun(run,goal){if(run?.player)IS.save?.markGoal(run.player.charId,goal);this.record('run-won',{goal},run);return true}
  }
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
