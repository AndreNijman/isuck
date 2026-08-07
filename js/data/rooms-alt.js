;(function (IS) {
  'use strict'
  var sets = [
    {p:'downpour', floors:['downpour','downpour-2','dross','dross-2'], obs:['~','O','o','#'], enemies:['blurb','drowned-charger','drowned-boom-fly','grackle','mole','dinga','drowned-hive']},
    {p:'mines', floors:['mines','mines-2','ashpit','ashpit-2'], obs:['#','M','T','H'], enemies:['fissure','poly','ash-pile','cinder','molten-baby','coal-boy','stonehead','dust']},
    {p:'mausoleum', floors:['mausoleum','mausoleum-2','gehenna','gehenna-2'], obs:['B','S','s','F'], enemies:['poof','hell-bird','grudge-bat','blood-puppy','lil-blub','floating-knight','red-ghost']},
    {p:'corpse', floors:['corpse','corpse-2'], obs:['W','P','C','R'], enemies:['locust-of-pestilence','locust-of-war','fly-bomb','big-bony','kamikaze-leech','null']}
  ]
  var shapes=[{id:'1x1',w:13,h:7},{id:'1x1',w:13,h:7},{id:'2x1',w:26,h:7},{id:'1x2',w:13,h:14},{id:'2x2',w:26,h:14}]
  function makeLayout(s,n,obs){
    var g=[],x,y,k;for(y=0;y<s.h;y++){g[y]=[];for(x=0;x<s.w;x++)g[y][x]='.'}
    for(k=0;k<4+(n%5);k++){
      x=2+((n+k*4)%(s.w-4));y=2+((n*2+k)%(s.h-4))
      if(Math.abs(x-(s.w>>1))>1){g[y][x]=obs[k%obs.length];g[s.h-1-y][s.w-1-x]=obs[k%obs.length]}
    }
    var sp=[[3,2],[s.w-4,2],[3,s.h-3],[s.w-4,s.h-3],[s.w>>1,2],[s.w>>1,s.h-3]]
    for(k=0;k<2+(n%5);k++)g[sp[k][1]][sp[k][0]]=k%2?'b':'a'
    return g.map(function(r){return r.join('')})
  }
  var defs=[]
  sets.forEach(function(set,si){
    for(var i=0;i<20;i++){
      var s=shapes[(i+si)%shapes.length]
      defs.push({id:set.p+'-alt-'+String(i+1).padStart(3,'0'),type:'default',shape:s.id,
        floors:[set.floors[i%set.floors.length]],weight:i%6?1:0.6,difficulty:2+((i+si)%4),subtype:si,
        layout:makeLayout(s,i+si*20,set.obs),legend:{a:set.enemies[i%set.enemies.length],b:set.enemies[(i*3+2)%set.enemies.length]}})
    }
  })
  IS.defineRooms(defs)
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
