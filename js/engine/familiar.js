;(function (IS) {
  'use strict'
  IS.familiarBehaviours={}
  IS.defineFamiliarBehaviour=(n,fn)=>{IS.familiarBehaviours[n]=fn}
  IS.spawnFamiliar=(p,id,ctx)=>{const d=IS.familiarsById[id];if(!d)return null;const f={id,def:d,x:p.x,y:p.y,vx:0,vy:0,r:16,t:0,shotT:0,angle:(p.familiars||[]).length};(p.familiars||(p.familiars=[])).push(f);return f}
  IS.removeFamiliar=(p,id)=>{const i=(p.familiars||[]).findIndex(f=>f.id===id);if(i<0)return false;p.familiars.splice(i,1);return true}
  function follow(f,dt,ctx){const p=ctx.player,n=IS.norm(p.x-f.x,p.y-f.y);f.vx+=n.x*500*dt;f.vy+=n.y*500*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.9;f.vy*=.9}
  function shoot(f,ctx){const e=ctx.nearestEnemy(f.x,f.y);if(!e)return;const a=IS.angleTo(f.x,f.y,e.x,e.y),s=IS.TEAR_SPEED;ctx.spawnTear({x:f.x,y:f.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,dmg:f.def.params?.dmg||3.5,r:7,life:1.2,friendly:true})}
  IS.defineFamiliarBehaviour('follower',(f,dt,c)=>{follow(f,dt,c);f.shotT-=dt;if(f.shotT<=0){shoot(f,c);f.shotT=f.def.params?.fireDelay||1}})
  IS.defineFamiliarBehaviour('orbitShooter',(f,dt,c)=>{f.angle+=dt*2;const r=f.def.params?.orbitR||70;f.x=c.player.x+Math.cos(f.angle)*r;f.y=c.player.y+Math.sin(f.angle)*r;f.shotT-=dt;if(f.shotT<=0){shoot(f,c);f.shotT=f.def.params?.fireDelay||1}})
  ;['orbital','chaser','stationaryDrop','wanderer','collector','buffer','laserFamiliar','bomber','shielder','summoner','copycat'].forEach(n=>IS.defineFamiliarBehaviour(n,follow))
  IS.updateFamiliars=(p,dt,ctx)=>{for(const f of p.familiars||[]){f.t+=dt;(IS.familiarBehaviours[f.def.behaviour]||follow)(f,dt,ctx)}}
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
