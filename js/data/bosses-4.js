;(function (IS) {
  'use strict'
  const rows = [
    ['the-lamb','The Lamb',2500,38,2,['womb-2','utero-2','scarred-womb-2'],['stompLine','fistSlam','groundSpikes']],
    ['satan','Satan',2200,43,1,['utero-2','scarred-womb-2','corpse'],['brimstoneBeam','fistSlam','ringShot']],
    ['isaac','Isaac',1800,48,1,['scarred-womb-2','corpse','corpse-2'],['brimstoneBeam','ringShot','teleportSlam']],
    ['blue-baby','Blue Baby',3200,53,1,['corpse','corpse-2','blue-womb'],['mirrorShots','portalSpawn','rainbowSpray']],
    ['hush','Hush',3000,58,1,['corpse-2','blue-womb','sheol'],['barrage','ringShot','creepPuddle']],
    ['delirium','Delirium',1300,38,1,['womb-2','utero-2','scarred-womb-2'],['teleportSlam','portalSpawn','mirrorShots']],
    ['mega-satan','Mega Satan',2400,43,2,['utero-2','scarred-womb-2','corpse'],['brimstoneBeam','fistSlam','ringShot']],
    ['mother','Mother',2600,48,1,['scarred-womb-2','corpse','corpse-2'],['knifeThrow','laserSweep','spawnMinions']],
    ['the-beast','The Beast',2500,53,1,['corpse','corpse-2','blue-womb'],['brimstoneBeam','beamRing','summonSwarm']],
    ['dogma','Dogma',2200,58,1,['corpse-2','blue-womb','sheol'],['splitBody','chaseFast','burstShot']],
    ['ultra-famine','Ultra Famine',1800,38,1,['womb-2','utero-2','scarred-womb-2'],['stompLine','fistSlam','groundSpikes']],
    ['ultra-pestilence','Ultra Pestilence',3200,43,1,['utero-2','scarred-womb-2','corpse'],['barrage','laserSweep','delayedRings']],
    ['ultra-war','Ultra War',3000,48,2,['scarred-womb-2','corpse','corpse-2'],['brimstoneBeam','ringShot','teleportSlam']],
    ['ultra-death','Ultra Death',1300,53,1,['corpse','corpse-2','blue-womb'],['mirrorShots','portalSpawn','rainbowSpray']],
    ['ultra-greed','Ultra Greed',2400,58,1,['corpse-2','blue-womb','sheol'],['rockThrow','quakeRings','chargeDash']],
    ['ultra-greedier','Ultra Greedier',2600,38,1,['womb-2','utero-2','scarred-womb-2'],['vomitStream','creepPuddle','spawnMinions']],
    ['the-heretic','The Heretic',2500,43,1,['utero-2','scarred-womb-2','corpse'],['hop','spreadShot','tearRain']],
    ['horny-boys','Horny Boys',2200,48,1,['scarred-womb-2','corpse','corpse-2'],['chargeDash','aimedShot','creepPuddle']],
    ['clutch','Clutch',1800,53,2,['corpse','corpse-2','blue-womb'],['spawnMinions','ringShot','summonSwarm']],
    ['colostomia','Colostomia',3200,58,1,['corpse-2','blue-womb','sheol'],['splitBody','chaseFast','burstShot']]
  ]
  IS.defineBosses(rows.map(function (r) {
    return {id:r[0],name:r[1],hp:r[2],r:r[3],dmg:r[4],sprite:r[0],stage:r[5],double:false,mini:false,
      bestiary:r[1]+' rules its arena through escalating patterns and relentless pressure.',
      phases:[
        {hpAbove:.68,attacks:[r[6][0]],weights:[1],cooldown:[.85,1.2]},
        {hpAbove:.34,attacks:r[6].slice(0,2).concat('shieldPhase'),weights:[2,2,1],cooldown:[.65,1.0],speedMult:1.15},
        {hpAbove:0,attacks:r[6].concat('phaseInvuln'),weights:[3,3,2,1],cooldown:[.5,.82],speedMult:1.35}
      ],params:{spawnId:'attackfly',spawnCap:9,splitId:'attackfly',shotCount:16,spread:.15,ringCount:18,hopHeight:110,beamWidth:38,chargeTime:.4,telegraph:.3}}
  }))
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
