;(function (IS) {
  'use strict'

  var palettes = {
    basement: ['#6c5a4a','#493b31','#8a7461','#796552','#b04a3a','#72291f','#251f1a'],
    cellar: ['#55514b','#35322f','#706b62','#615c55','#8d6950','#55443a','#1d1c1a'],
    burning: ['#493730','#261f1c','#684c3f','#54392f','#e06a32','#8c281d','#17110f'],
    downpour: ['#52636c','#303b42','#687b82','#587078','#74a9bc','#385d69','#172329'],
    dross: ['#5c6045','#393c2c','#747654','#656746','#a99c42','#59602d','#202217'],
    caves: ['#4c4745','#2c2928','#68605a','#58504b','#a64c43','#642a27','#181616'],
    catacombs: ['#655e50','#403b33','#7c725e','#6b624f','#8b7650','#4e5338','#211f1a'],
    flooded: ['#36565a','#23383b','#527275','#456468','#4ca0a4','#285b60','#112124'],
    mines: ['#3c4145','#222629','#575d60','#484e52','#d09642','#70502b','#141719'],
    ashpit: ['#514c49','#2c2927','#69615d','#5b5350','#df7139','#79402b','#1b1817'],
    depths: ['#29262f','#161419','#46404e','#393442','#76528e','#3b2948','#0d0b10'],
    necropolis: ['#4b292d','#29171a','#6b3b40','#583035','#9d3f49','#5f2029','#170c0e'],
    dank: ['#252d39','#151a21','#3d4857','#303b48','#477395','#293f58','#0b0f14'],
    mausoleum: ['#77736d','#4a4743','#99948b','#858078','#cfaa56','#665f53','#242321'],
    gehenna: ['#292225','#130f11','#493438','#39282c','#c73c36','#6e191d','#0a0708'],
    womb: ['#713638','#452022','#955052','#834144','#d35a61','#8d252c','#281012'],
    utero: ['#8b4f55','#573036','#ad6970','#985a62','#e08a91','#98444e','#32191d'],
    scarred: ['#80665f','#51413d','#a3847b','#90736b','#bc736c','#76504b','#2d2421'],
    corpse: ['#4f5b4d','#30382f','#687563','#5b6957','#82915c','#465438','#1a2119'],
    blue: ['#334c70','#1d2d45','#496b91','#3b5c80','#648fc5','#29476d','#101827'],
    sheol: ['#211b1b','#0d0a0a','#3b2e2c','#2f2423','#dc5b2e','#701d16','#060505'],
    cathedral: ['#d2cbb8','#8f8878','#e6dfca','#c9c1ac','#ddb95d','#a68b48','#4c493f'],
    dark: ['#171316','#080708','#302029','#24181f','#a72535','#58101c','#030203'],
    chest: ['#745334','#452f1c','#956d43','#825c37','#d4a743','#765823','#25180e'],
    void: ['#21182c','#0c0811','#39254c','#2d1d3d','#9d57c4','#4f266e','#050307'],
    home: ['#806b58','#514336','#a98d72','#94785f','#c79b6a','#76543c','#30271f'],
    greed: ['#65522d','#372b17','#836b39','#705a2f','#e0bd42','#826918','#211a0c']
  }
  function palette (key) {
    var p = palettes[key]
    return { wall:p[0], wallDark:p[1], floor:p[2], floorAlt:p[3], accent:p[4], creep:p[5], backdrop:p[6] }
  }
  var pools = {
    basement: ['gaper','frowning-gaper','pooter','fatty','clotty','horf','hopper','trite','attackfly','fly','dip','squirt','sucker','charger',
      'boom-fly','mulligan','host','hive','mr-maw','maw','leech','gusher','i-blob','round-worm'],
    cellar: ['gaper','frowning-gaper','pooter','fatty','clotty','horf','hopper','trite','attackfly','fly','dip','squirt','sucker','charger',
      'boom-fly','mulligan','host','hive','mr-maw','maw','leech','gusher','i-blob','round-worm','nest','rock-spider'],
    'burning-basement': ['gaper','frowning-gaper','pooter','fatty','clotty','horf','hopper','trite','attackfly','fly','dip','squirt','sucker',
      'charger','boom-fly','mulligan','host','hive','mr-maw','maw','leech','gusher','i-blob','round-worm','flaming-gaper','flaming-fatty',
      'flaming-hopper'],
    downpour: ['blurb','dinga','mole','drowned-boom-fly','drowned-charger','gutted-fatty','grackle','drowned-hive','attackfly','fly','gaper','pooter',
      'horf','clotty','dip','squirt','leech'],
    dross: ['blurb','dinga','mole','drowned-boom-fly','drowned-charger','gutted-fatty','grackle','drowned-hive','attackfly','fly','gaper','pooter',
      'horf','poppy-gaper','dank-dip','hopper'],
    caves: ['hive','maggot','globin','black-globin','vis','double-vis','chubber','bony','swarmer','boil','rock-spider','wall-creep','nest','host',
      'mulligan','round-worm','charger','boom-fly','fly','attackfly','sucker','pooter','fatty','gusher','leech','dip','squirt','frowning-gaper'],
    catacombs: ['hive','maggot','globin','black-globin','vis','double-vis','chubber','bony','swarmer','boil','rock-spider','wall-creep','nest','host',
      'mulligan','round-worm','charger','boom-fly','fly','attackfly','sucker','pooter','fatty','gusher','leech','revenant','black-bony',
      'tinted-rock-spider','camillo-jr'],
    'flooded-caves': ['hive','maggot','globin','black-globin','vis','double-vis','chubber','bony','swarmer','boil','rock-spider','wall-creep','nest',
      'host','mulligan','round-worm','charger','boom-fly','fly','attackfly','sucker','pooter','fatty','gusher','leech','drowned-hive',
      'drowned-boom-fly','drowned-charger','blurb'],
    mines: ['fissure','poly','dust','stonehead','bony','boil','swarmer','rock-spider','tinted-rock-spider','hive','maggot','charger','boom-fly',
      'mulligan','fly','attackfly','pooter','cinder','molten-baby','coal-boy','mr-mine','mole','wall-creep'],
    ashpit: ['fissure','poly','dust','stonehead','bony','boil','swarmer','rock-spider','tinted-rock-spider','hive','maggot','charger','boom-fly',
      'mulligan','fly','attackfly','pooter','cinder','molten-baby','coal-boy','ash-pile','grudge','imp'],
    depths: ['knight','selfless-knight','loose-knight','guts','imp','wall-hugger','wizoob','snapper','deaths-head','brain','stone-grimace','grimace',
      'vomit-grimace','whipper','ragling','poison-mind','fred','black-bony','host','bony','boil','vis','swarmer'],
    necropolis: ['knight','selfless-knight','loose-knight','guts','imp','wall-hugger','wizoob','snapper','deaths-head','brain','stone-grimace',
      'grimace','vomit-grimace','whipper','ragling','poison-mind','fred','black-bony','host','bony','boil','revenant','spiked-revenant',
      'cursed-deaths-head'],
    'dank-depths': ['knight','selfless-knight','loose-knight','guts','imp','wall-hugger','wizoob','snapper','deaths-head','brain','stone-grimace',
      'grimace','vomit-grimace','whipper','ragling','poison-mind','fred','black-bony','host','bony','boil','dank-dip','black-maw','black-globin'],
    ascent: ['knight','selfless-knight','loose-knight','guts','imp','wall-hugger','wizoob','snapper','deaths-head','brain','stone-grimace','grimace',
      'vomit-grimace','whipper','ragling','poison-mind','fred','black-bony','host','bony','boil'],
    mausoleum: ['poof','hell-bird','grudge-bat','blood-puppy','lil-blub','floating-knight','red-ghost','wizoob','imp','loose-knight',
      'cursed-deaths-head','ragling','whipper','stone-grimace','deaths-head','knight','selfless-knight','sanguine-bond'],
    gehenna: ['poof','hell-bird','grudge-bat','blood-puppy','lil-blub','floating-knight','red-ghost','wizoob','imp','loose-knight',
      'cursed-deaths-head','ragling','whipper','stone-grimace','deaths-head','knight','fred','poison-mind','grudge'],
    'mothers-shadow': ['poof','hell-bird','grudge-bat','blood-puppy','lil-blub','floating-knight','red-ghost','wizoob','imp','loose-knight',
      'cursed-deaths-head','ragling','whipper','stone-grimace','deaths-head','knight'],
    womb: ['walking-sack','bloodshot-eye','conjoined-fatty','gurgle','swinger','spitty','lump','blood-hulk','bloated-fatty','blood-feeder',
      'flesh-maiden','moms-hand','moms-dead-hand','membrane','leaper','tissue','camillo','brain','gurgling','tumor'],
    utero: ['walking-sack','bloodshot-eye','conjoined-fatty','gurgle','swinger','spitty','lump','blood-hulk','bloated-fatty','blood-feeder',
      'flesh-maiden','moms-hand','moms-dead-hand','membrane','leaper','tissue','camillo','brain','handsome-gurgle','red-floater','lil-haunt'],
    'scarred-womb': ['walking-sack','bloodshot-eye','conjoined-fatty','gurgle','swinger','spitty','lump','blood-hulk','bloated-fatty','blood-feeder',
      'flesh-maiden','moms-hand','moms-dead-hand','membrane','leaper','tissue','camillo','brain','walking-boil','stone-eye','corn-mine'],
    blue: ['blue-gaper','blue-maw','blue-boil','blue-globin','blue-conjoined-fatty','blue-fatty','blue-horf','blue-sucker','blue-tumor'],
    corpse: ['locust-of-famine','locust-of-pestilence','locust-of-war','locust-of-death','fly-bomb','willo','big-bony','kamikaze-leech','null',
      'hanger','one-tooth','fat-bat'],
    sheol: ['locust-of-famine','locust-of-pestilence','locust-of-war','locust-of-death','fly-bomb','willo','big-bony','kamikaze-leech','null',
      'hanger','one-tooth','fat-bat','imp','brimstone-head'],
    'dark-room': ['locust-of-famine','locust-of-pestilence','locust-of-war','locust-of-death','fly-bomb','willo','big-bony','kamikaze-leech','null',
      'hanger','one-tooth','fat-bat','sanguine-bond','red-ghost'],
    void: ['locust-of-famine','locust-of-pestilence','locust-of-war','locust-of-death','fly-bomb','willo','big-bony','kamikaze-leech','null','hanger',
      'one-tooth','fat-bat'],
    holy: ['angelic-baby','vassal','holy-keeper','holy-bony','soul-sucker','big-bony','eternal-fly','eternal-heart-fly'],
    greed: ['keeper','greed','super-greed','ultra-coin','pincushion','grilled-clotty']
  }
  // Repentance floor boss pools (from memory of the wiki; a few placements are best guesses).
  // The two Devil Room guardians (The Fallen, Krampus) are not floor bosses and sit in no pool.
  var bosses = {
    early: ['monstro','larry-jr','the-duke-of-flies','gemini','steven','blighted-ovum','dingle','the-haunt','little-horn','baby-plum','famine'],
    rain: ['the-turdlings','turdlet','wormwood','dangle'],
    cave: ['gurdy-jr','fistula','widow','pin','chub','the-husk','the-hollow','the-wretched','teratoma','the-bloat','c-h-a-d','peep','carrion-queen','frail'],
    mine: ['tuff-twins','the-shell','the-pile','horny-boys'],
    depth: ['gurdy','monstro-ii','gish','loki','lokii','the-stain','rag-man','rag-mega','big-horn','the-gate','the-cage','mega-maw','reap-creep'],
    maus: ['the-heretic','the-visage','the-adversary','sisters-vis','brownie','the-forsaken','the-scourge'],
    womb: ['the-matriarch','mama-gurdy'],
    corpse: ['colostomia','chimera','rotgut'],
    // the second floor of Depths, Womb and Corpse ends on the chapter boss
    depth2: ['mom'], womb2: ['moms-heart','it-lives'], corpse2: ['mother'],
    end: ['satan','isaac','blue-baby','hush','delirium','mega-satan','the-lamb'],
    greed: ['ultra-greed','ultra-greedier']
  }
  var defs = []
  function add (id, name, depth, key, enemyKey, bossKey, variants, altPath, roomRange, music, hazards, curses) {
    defs.push({ id:id, name:name, depth:depth, variants:variants || [], altPath:altPath || null,
      rooms:roomRange || [7,11], bosses:(/-2$/.test(id) && bosses[bossKey + '2']) || bosses[bossKey], enemyPool:pools[enemyKey], palette:palette(key),
      music:music, hazards:hazards || ['spikes'], curseWeights:curses || { darkness:1, lost:1, unknown:1, maze:1, blind:1 } })
  }
  var calm={root:'A',mode:'aeolian',tempo:96,mood:'calm'}, wet={root:'D',mode:'dorian',tempo:82,mood:'melancholy'},
    tense={root:'E',mode:'phrygian',tempo:116,mood:'tense'}, dread={root:'B',mode:'locrian',tempo:126,mood:'dread'},
    sacred={root:'C',mode:'lydian',tempo:76,mood:'sacred'}
  var earlyCurse={darkness:1,labyrinth:1,lost:1,maze:1,blind:1}
  ;[['basement','Basement','basement'],['cellar','Cellar','cellar'],['burning-basement','Burning Basement','burning']].forEach(function(x){add(x[0],x[1],1,x[2],x[0],'early',['basement','cellar','burning-basement'].filter(function(v){return v!==x[0]}),'downpour',[6,9],calm,['spikes','fire'],earlyCurse);add(x[0]+'-2',x[1]+' II',2,x[2],x[0],'early',[],x[0]==='basement'?'downpour-2':null,[7,10],calm,['spikes','fire'],earlyCurse)})
  ;[['downpour','Downpour','downpour'],['dross','Dross','dross']].forEach(function(x){add(x[0],x[1],1,x[2],x[0],'rain',[],null,[6,9],wet,['water','pits'],earlyCurse);add(x[0]+'-2',x[1]+' II',2,x[2],x[0],'rain',[],null,[7,10],wet,['water','pits'],earlyCurse)})
  ;[['caves','Caves','caves'],['catacombs','Catacombs','catacombs'],['flooded-caves','Flooded Caves','flooded']].forEach(function(x){add(x[0],x[1],3,x[2],x[0],'cave',['caves','catacombs','flooded-caves'].filter(function(v){return v!==x[0]}),'mines',[8,11],tense,['pits','spikes'],earlyCurse);add(x[0]+'-2',x[1]+' II',4,x[2],x[0],'cave',[],x[0]==='caves'?'mines-2':null,[8,12],tense,['pits','spikes'],earlyCurse)})
  ;[['mines','Mines','mines'],['ashpit','Ashpit','ashpit']].forEach(function(x){add(x[0],x[1],3,x[2],x[0],'mine',[],null,[8,11],tense,['tnt','pits'],earlyCurse);add(x[0]+'-2',x[1]+' II',4,x[2],x[0],'mine',[],null,[9,12],tense,['tnt','pits'],earlyCurse)})
  ;[['depths','Depths','depths'],['necropolis','Necropolis','necropolis'],['dank-depths','Dank Depths','dank']].forEach(function(x){add(x[0],x[1],5,x[2],x[0],'depth',['depths','necropolis','dank-depths'].filter(function(v){return v!==x[0]}),'mausoleum',[9,12],tense,['spikes','fire']);add(x[0]+'-2',x[1]+' II',6,x[2],x[0],'depth',[],x[0]==='depths'?'mausoleum-2':null,[10,13],tense,['spikes','fire'])})
  ;[['mausoleum','Mausoleum','mausoleum'],['gehenna','Gehenna','gehenna']].forEach(function(x){add(x[0],x[1],5,x[2],x[0],'maus',[],null,[9,12],dread,['pillars','spikes']);add(x[0]+'-2',x[1]+' II',6,x[2],x[0],'maus',[],null,[10,13],dread,['pillars','spikes'])})
  ;[['womb','Womb','womb'],['utero','Utero','utero'],['scarred-womb','Scarred Womb','scarred']].forEach(function(x){add(x[0],x[1],7,x[2],x[0],'womb',['womb','utero','scarred-womb'].filter(function(v){return v!==x[0]}),'corpse',[10,14],dread,['spikes','red-poop']);add(x[0]+'-2',x[1]+' II',8,x[2],x[0],'womb',[],x[0]==='womb'?'corpse-2':null,[11,14],dread,['spikes','red-poop'])})
  add('corpse','Corpse',7,'corpse','corpse','corpse',[],null,[10,14],dread,['webs','corn-poop']); add('corpse-2','Corpse II',8,'corpse','corpse','corpse',[],null,[11,14],dread,['webs','corn-poop'])
  add('blue-womb','Blue Womb',9,'blue','blue','end',[],null,[12,15],dread,['pits','spikes'])
  add('sheol','Sheol',10,'sheol','sheol','end',[],null,[10,14],dread,['fire','spikes']); add('cathedral','Cathedral',10,'cathedral','holy','end',[],null,[10,14],sacred,['blue-fire'])
  add('dark-room','Dark Room',11,'dark','dark-room','end',[],null,[11,15],dread,['spikes','fire']); add('the-chest','The Chest',11,'chest','holy','end',[],null,[11,15],sacred,['pits'])
  add('the-void','The Void',12,'void','void','end',[],null,[14,19],dread,['spikes','pits','fire'])
  ;[['ascent-1','Ascent I',8],['ascent-2','Ascent II',7],['ascent-3','Ascent III',6],['ascent-4','Ascent IV',5]].forEach(function(x){add(x[0],x[1],x[2],'home','ascent','end',[],null,[6,9],sacred,['pits'])})
  add('home','Home',13,'home','holy','end',[],null,[4,6],sacred,[]); add('mothers-shadow',"Mother's Shadow",6,'mausoleum','mothers-shadow','maus',[],null,[6,8],dread,['spikes'])
  ;[['greed-basement','Greed Basement',1,'basement'],['greed-caves','Greed Caves',3,'caves'],['greed-depths','Greed Depths',5,'depths'],['greed-womb','Greed Womb',7,'womb'],['greed-sheol','Greed Sheol',10,'sheol'],['greed-shop','Greed Shop',11,'greed'],['greed-ultra','Ultra Greed',12,'greed']].forEach(function(x){add(x[0],x[1],x[2],x[3],'greed','greed',[],null,[1,3],dread,['spikes'])})
  IS.defineFloors(defs)
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
