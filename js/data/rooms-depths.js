;(function (IS) {
  'use strict'
  var floorIds = ['depths','necropolis','dank-depths','depths-2','necropolis-2','dank-depths-2','mausoleum','gehenna','mausoleum-2','gehenna-2']
  var enemies = ['knight','selfless-knight','guts','imp','wall-hugger','wizoob','snapper','deaths-head','poof','hell-bird','grudge-bat','blood-puppy']
  var obstacles = ['M','B','S','s','F','O','#']
  var shapes = [{id:'1x1',w:13,h:7},{id:'1x1',w:13,h:7},{id:'1x1',w:13,h:7},{id:'2x1',w:26,h:7},{id:'1x2',w:13,h:14},{id:'2x2',w:26,h:14}]
  function layout (shape, n) {
    var rows=[], x, y
    for(y=0;y<shape.h;y++){rows[y]=[];for(x=0;x<shape.w;x++)rows[y][x]='.'}
    var safe=function(x,y){return x>1&&y>1&&x<shape.w-2&&y<shape.h-2&&!(Math.abs(x-(shape.w>>1))<2)||false}
    var o=obstacles[n%obstacles.length], pairs=2+(n%4)
    for(var k=0;k<pairs;k++){
      x=2+((n*3+k*5)%(shape.w-4));y=2+((n+k*2)%(shape.h-4))
      if(safe(x,y)){rows[y][x]=o;rows[shape.h-1-y][shape.w-1-x]=o}
    }
    var spots=[[3,2],[shape.w-4,shape.h-3],[3,shape.h-3],[shape.w-4,2],[shape.w>>1,2],[shape.w>>1,shape.h-3]]
    var count=2+(n%5)
    for(k=0;k<count;k++){x=spots[k][0];y=spots[k][1];if(rows[y][x]==='.')rows[y][x]=k%2?'b':'a'}
    return rows.map(function(r){return r.join('')})
  }
  var defs=[]
  for(var i=0;i<84;i++){
    var shape=shapes[i%shapes.length], a=enemies[i%enemies.length], b=enemies[(i*5+3)%enemies.length]
    defs.push({id:'depths-d-'+String(i+1).padStart(3,'0'),type:'default',shape:shape.id,
      floors:[floorIds[i%floorIds.length]],weight:i%7===0?0.55:1,difficulty:Math.min(5,2+(i%5)),subtype:i%4,
      layout:layout(shape,i),legend:{a:a,b:b}})
  }
  IS.defineRooms(defs)
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
