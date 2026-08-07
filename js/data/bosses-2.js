;(function (IS) {
  'use strict'
  const rows = [
    ['teratoma','Teratoma',470,38,1,['caves','catacombs','flooded-caves'],['spawnMinions','ringShot','summonSwarm']],
    ['the-bloat','The Bloat',515,43,1,['catacombs','flooded-caves','caves-2'],['splitBody','chaseFast','burstShot']],
    ['chub','Chub',560,48,1,['flooded-caves','caves-2','mines'],['stompLine','fistSlam','groundSpikes']],
    ['c-h-a-d','C.H.A.D.',605,53,1,['caves-2','mines','ashpit'],['barrage','laserSweep','delayedRings']],
    ['the-husk','The Husk',650,58,1,['mines','ashpit','depths'],['brimstoneBeam','ringShot','teleportSlam']],
    ['the-hollow','The Hollow',695,38,1,['caves','catacombs','flooded-caves'],['mirrorShots','portalSpawn','rainbowSpray']],
    ['carrion-queen','Carrion Queen',470,43,1,['catacombs','flooded-caves','caves-2'],['rockThrow','quakeRings','chargeDash']],
    ['the-gate','The Gate',515,48,1,['flooded-caves','caves-2','mines'],['vomitStream','creepPuddle','spawnMinions']],
    ['the-cage','The Cage',560,53,1,['caves-2','mines','ashpit'],['hop','spreadShot','tearRain']],
    ['mega-maw','Mega Maw',605,58,1,['mines','ashpit','depths'],['chargeDash','aimedShot','creepPuddle']],
    ['the-wretched','The Wretched',650,38,1,['caves','catacombs','flooded-caves'],['spawnMinions','ringShot','summonSwarm']],
    ['frail','Frail',695,43,1,['catacombs','flooded-caves','caves-2'],['splitBody','chaseFast','burstShot']],
    ['peep','Peep',470,48,1,['flooded-caves','caves-2','mines'],['stompLine','fistSlam','groundSpikes']],
    ['the-pile','The Pile',515,53,1,['caves-2','mines','ashpit'],['barrage','laserSweep','delayedRings']],
    ['gurdy','Gurdy',560,58,1,['mines','ashpit','depths'],['brimstoneBeam','ringShot','teleportSlam']],
    ['monstro-ii','Monstro II',605,38,1,['caves','catacombs','flooded-caves'],['mirrorShots','portalSpawn','rainbowSpray']],
    ['gish','Gish',650,43,1,['catacombs','flooded-caves','caves-2'],['rockThrow','quakeRings','chargeDash']],
    ['loki','Loki',695,48,1,['flooded-caves','caves-2','mines'],['vomitStream','creepPuddle','spawnMinions']],
    ['lokii','Lokii',470,53,1,['caves-2','mines','ashpit'],['hop','spreadShot','tearRain']],
    ['the-stain','The Stain',515,58,1,['mines','ashpit','depths'],['chargeDash','aimedShot','creepPuddle']]
  ]
  IS.defineBosses(rows.map(function (r) {
    return {id:r[0],name:r[1],hp:r[2],r:r[3],dmg:r[4],sprite:r[0],stage:r[5],double:false,mini:false,
      bestiary:r[1]+' rules its arena through escalating patterns and relentless pressure.',
      phases:[{hpAbove:.55,attacks:r[6].slice(0,2),weights:[2,1],cooldown:[1.15,1.85]},
        {hpAbove:0,attacks:r[6],weights:[2,2,1],cooldown:[.9,1.5],speedMult:1.22}],
      params:{spawnId:'attackfly',spawnCap:6,splitId:'attackfly',shotCount:10,spread:.2,ringCount:12,hopHeight:90,beamWidth:28,chargeTime:.55,telegraph:.4}}
  }))
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
