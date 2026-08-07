;(function (IS) {
  'use strict'
  var types = ['start','treasure','shop','boss','secret','super-secret','ultra-secret','curse','sacrifice','arcade','library','devil','angel','challenge','boss-rush','dice','planetarium','vault','bedroom','dirty-bedroom','black-market','miniboss','error','crawlspace','boss-double','mineshaft','chest-room','ascent-mirror']
  var shapeMap={boss:'2x2','boss-rush':'2x2',challenge:'2x1','boss-double':'2x1',shop:'2x1','black-market':'2x1',mineshaft:'1x2'}
  var dims={'1x1':[13,7],'2x1':[26,7],'1x2':[13,14],'2x2':[26,14]}
  function put(g,x,y,ch){if(y>=0&&y<g.length&&x>=0&&x<g[0].length)g[y][x]=ch}
  function layout(type,shape,v){
    var d=dims[shape],w=d[0],h=d[1],g=[],x,y
    for(y=0;y<h;y++){g[y]=[];for(x=0;x<w;x++)g[y][x]='.'}
    var cx=w>>1,cy=h>>1
    if(type==='start'){put(g,cx,cy,'@')}
    else if(type==='treasure'){put(g,cx,cy,'!');if(v===2){put(g,cx-2,cy,'!');put(g,cx+2,cy,'S')}}
    else if(type==='shop'||type==='arcade'||type==='black-market'){for(x=3;x<w-2;x+=4)put(g,x,2+(v%2),'$')}
    else if(type==='secret'||type==='super-secret'||type==='ultra-secret'){put(g,cx,cy,'!');put(g,cx-2,cy,'x');if(v===2)put(g,cx+2,cy,'X')}
    else if(type==='curse'){put(g,cx,cy,'!');for(x=cx-2;x<=cx+2;x+=2)put(g,x,cy+1,'S')}
    else if(type==='sacrifice'){put(g,cx,cy,'S');put(g,cx-1,cy,'S');put(g,cx+1,cy,'S')}
    else if(type==='library'||type==='planetarium'){put(g,cx-2,cy,'!');put(g,cx+2,cy,'!');put(g,cx,cy-2,'B')}
    else if(type==='devil'){for(x=2;x<w-2;x++)if(x%2===0){put(g,x,1,'S');put(g,x,h-2,'S')}put(g,cx,cy,'!')}
    else if(type==='angel'){for(x=2;x<w-2;x++){put(g,x,cy,'#')}for(y=1;y<h-1;y++)put(g,cx,y,'.');put(g,cx,cy,'!')}
    else if(type==='challenge'||type==='boss-rush'||type==='boss'||type==='boss-double'||type==='miniboss'){put(g,3,2,'#');put(g,w-4,2,'#');put(g,3,h-3,'#');put(g,w-4,h-3,'#')}
    else if(type==='dice'){for(x=cx-2;x<=cx+2;x+=2)for(y=cy-1;y<=cy+1;y+=2)put(g,x,y,'B')}
    else if(type==='vault'||type==='chest-room'){put(g,cx-2,cy,'L');put(g,cx+2,cy,'L');if(v===2)put(g,cx,cy,'G')}
    else if(type==='bedroom'){put(g,cx,cy,'@');put(g,cx-2,cy,'V')}
    else if(type==='dirty-bedroom'){put(g,cx,cy,'@');put(g,cx-2,cy,'P');put(g,cx+2,cy,'W')}
    else if(type==='crawlspace'){put(g,cx,cy,'%');put(g,cx-2,cy,'!')}
    else if(type==='mineshaft'){for(y=2;y<h-2;y+=3){put(g,cx-2,y,'M');put(g,cx+2,y,'M')}put(g,cx,h-3,'%')}
    else if(type==='ascent-mirror'){for(y=1;y<h-1;y++)put(g,cx,y,'~');put(g,cx,cy,'@')}
    else if(type==='error'){put(g,cx,cy,'!');put(g,cx-2,cy,'G');put(g,cx+2,cy,'X')}
    return g.map(function(r){return r.join('')})
  }
  var defs=[]
  types.forEach(function(type,ti){
    for(var v=0;v<3;v++){
      var shape=shapeMap[type]||'1x1'
      if((type==='boss'||type==='challenge')&&v===0)shape='1x1'
      defs.push({id:'special-'+type+'-'+String(v+1).padStart(3,'0'),type:type,shape:shape,
        floors:type==='ascent-mirror'?['ascent-1','ascent-2','ascent-3','ascent-4']:['*'],weight:v?0.75:1,
        difficulty:type==='challenge'||type==='boss-rush'||type==='miniboss'?3:1,subtype:v,
        layout:layout(type,shape,v),legend:{}})
    }
  })
  IS.defineRooms(defs)
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
