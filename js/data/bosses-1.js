;(function (IS) {
  'use strict'
  const rows = [
    ['monstro','Monstro',220,38,1,['basement','cellar','burning-basement'],['chargeDash','aimedShot','creepPuddle'],true],
    ['larry-jr','Larry Jr.',238,43,1,['cellar','burning-basement','basement-2'],['spawnMinions','ringShot','summonSwarm'],true],
    ['the-duke-of-flies','The Duke of Flies',256,48,1,['burning-basement','basement-2','cellar-2'],['splitBody','chaseFast','burstShot'],true],
    ['gemini','Gemini',274,53,1,['basement-2','cellar-2','burning-basement-2'],['stompLine','fistSlam','groundSpikes'],true],
    ['steven','Steven',292,58,1,['cellar-2','burning-basement-2','downpour'],['barrage','laserSweep','delayedRings'],true],
    ['dingle','Dingle',310,38,1,['basement','cellar','burning-basement'],['brimstoneBeam','ringShot','teleportSlam'],true],
    ['dangle','Dangle',220,43,1,['cellar','burning-basement','basement-2'],['mirrorShots','portalSpawn','rainbowSpray'],true],
    ['blighted-ovum','Blighted Ovum',238,48,1,['burning-basement','basement-2','cellar-2'],['rockThrow','quakeRings','chargeDash'],true],
    ['the-haunt','The Haunt',256,53,1,['basement-2','cellar-2','burning-basement-2'],['vomitStream','creepPuddle','spawnMinions'],true],
    ['little-horn','Little Horn',274,58,1,['cellar-2','burning-basement-2','downpour'],['hop','spreadShot','tearRain'],true],
    ['baby-plum','Baby Plum',292,38,1,['basement','cellar','burning-basement'],['chargeDash','aimedShot','creepPuddle'],true],
    ['famine','Famine',310,43,1,['cellar','burning-basement','basement-2'],['spawnMinions','ringShot','summonSwarm'],true],
    ['gurdy-jr','Gurdy Jr.',220,48,1,['burning-basement','basement-2','cellar-2'],['splitBody','chaseFast','burstShot'],false],
    ['fistula','Fistula',238,53,1,['basement-2','cellar-2','burning-basement-2'],['stompLine','fistSlam','groundSpikes'],false],
    ['widow','Widow',256,58,1,['cellar-2','burning-basement-2','downpour'],['barrage','laserSweep','delayedRings'],false],
    ['pin','Pin',274,38,1,['basement','cellar','burning-basement'],['brimstoneBeam','ringShot','teleportSlam'],false],
    ['rag-man','Rag Man',292,43,1,['cellar','burning-basement','basement-2'],['mirrorShots','portalSpawn','rainbowSpray'],false],
    ['the-turdlings','The Turdlings',310,48,1,['burning-basement','basement-2','cellar-2'],['rockThrow','quakeRings','chargeDash'],false],
    ['turdlet','Turdlet',220,53,1,['basement-2','cellar-2','burning-basement-2'],['vomitStream','creepPuddle','spawnMinions'],false],
    ['wormwood','Wormwood',238,58,1,['cellar-2','burning-basement-2','downpour'],['hop','spreadShot','tearRain'],false]
  ]
  IS.defineBosses(rows.map(function (r) {
    return {id:r[0],name:r[1],hp:r[2],r:r[3],dmg:r[4],sprite:r[0],stage:r[5],double:r[7],mini:false,
      bestiary:r[1]+' rules its arena through escalating patterns and relentless pressure.',
      phases:[
        {hpAbove:.55,attacks:r[6].slice(0,2),weights:[2,1],cooldown:[1.35,2.2]},
        {hpAbove:0,attacks:r[6],weights:[2,2,1],cooldown:[1.2,1.8],speedMult:1.18}
      ],params:{spawnId:'attackfly',spawnCap:5,splitId:'attackfly',shotCount:8,spread:.22,ringCount:10,hopHeight:80,beamWidth:24,chargeTime:.65,telegraph:.45}}
  }))
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
