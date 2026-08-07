;(function (IS) {
  'use strict'
  const rows = [
    ['mom','Mom',700,38,1,['depths-2','necropolis-2','dank-depths-2'],['fistSlam','stompLine','spawnMinions']],
    ['moms-heart',"Mom's Heart",755,43,1,['necropolis-2','dank-depths-2','mausoleum'],['stompLine','fistSlam','groundSpikes']],
    ['it-lives','It Lives',810,48,1,['dank-depths-2','mausoleum','gehenna'],['barrage','laserSweep','delayedRings']],
    ['the-fallen','The Fallen',865,53,1,['mausoleum','gehenna','womb'],['brimstoneBeam','ringShot','teleportSlam']],
    ['krampus','Krampus',920,58,1,['gehenna','womb','utero'],['mirrorShots','portalSpawn','rainbowSpray']],
    ['sisters-vis','Sisters Vis',975,38,1,['depths-2','necropolis-2','dank-depths-2'],['rockThrow','quakeRings','chargeDash']],
    ['reap-creep','Reap Creep',1030,43,1,['necropolis-2','dank-depths-2','mausoleum'],['vomitStream','creepPuddle','spawnMinions']],
    ['tuff-twins','Tuff Twins',700,48,1,['dank-depths-2','mausoleum','gehenna'],['hop','spreadShot','tearRain']],
    ['the-shell','The Shell',755,53,1,['mausoleum','gehenna','womb'],['chargeDash','aimedShot','creepPuddle']],
    ['the-matriarch','The Matriarch',810,58,1,['gehenna','womb','utero'],['spawnMinions','ringShot','summonSwarm']],
    ['the-scourge','The Scourge',865,38,1,['depths-2','necropolis-2','dank-depths-2'],['splitBody','chaseFast','burstShot']],
    ['chimera','Chimera',920,43,1,['necropolis-2','dank-depths-2','mausoleum'],['stompLine','fistSlam','groundSpikes']],
    ['rotgut','Rotgut',975,48,1,['dank-depths-2','mausoleum','gehenna'],['barrage','laserSweep','delayedRings']],
    ['mama-gurdy','Mama Gurdy',1030,53,1,['mausoleum','gehenna','womb'],['brimstoneBeam','ringShot','teleportSlam']],
    ['the-adversary','The Adversary',700,58,1,['gehenna','womb','utero'],['mirrorShots','portalSpawn','rainbowSpray']],
    ['brownie','Brownie',755,38,1,['depths-2','necropolis-2','dank-depths-2'],['rockThrow','quakeRings','chargeDash']],
    ['the-forsaken','The Forsaken',810,43,1,['necropolis-2','dank-depths-2','mausoleum'],['vomitStream','creepPuddle','spawnMinions']],
    ['big-horn','Big Horn',865,48,1,['dank-depths-2','mausoleum','gehenna'],['hop','spreadShot','tearRain']],
    ['rag-mega','Rag Mega',920,53,1,['mausoleum','gehenna','womb'],['chargeDash','aimedShot','creepPuddle']],
    ['the-visage','The Visage',975,58,1,['gehenna','womb','utero'],['spawnMinions','ringShot','summonSwarm']]
  ]
  IS.defineBosses(rows.map(function (r) {
    return {id:r[0],name:r[1],hp:r[2],r:r[3],dmg:r[4],sprite:r[0],stage:r[5],double:false,mini:false,
      bestiary:r[1]+' rules its arena through escalating patterns and relentless pressure.',
      phases:[{hpAbove:.6,attacks:r[6].slice(0,2),weights:[2,1],cooldown:[.95,1.55]},
        {hpAbove:0,attacks:r[6],weights:[2,2,2],cooldown:[.72,1.22],speedMult:1.28}],
      params:{spawnId:'attackfly',spawnCap:7,splitId:'attackfly',shotCount:12,spread:.18,ringCount:14,hopHeight:100,beamWidth:32,chargeTime:.5,telegraph:.35}}
  }))
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
