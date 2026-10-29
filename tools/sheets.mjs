// Contact sheets drawn by the real renderer: node tools/sheets.mjs <outDir> [roster|portraits|enemies|bosses|grid|all]
// Writes PNG pages (1280x720), each a labelled grid of sprites, so art can be reviewed by eye.
import path from 'node:path'
import fs from 'node:fs'
import { launch, ROOT } from './cdp.mjs'
const OUT = process.argv[2] || path.join(ROOT, 'shots/sheets'); fs.mkdirSync(OUT, { recursive: true })
const which = process.argv[3] || 'all'
const page = await launch({ width: 1280, height: 720 })
const ev = s => page.evaluate(s)
async function sheet (tag, list, cols, rows, cell, bg) {
  const per = cols * rows
  for (let pg = 0; pg * per < list.length; pg++) {
    const part = JSON.stringify(list.slice(pg * per, pg * per + per))
    await ev(`var L=${part},cols=${cols},cell=${cell};var c=document.getElementById('__sheet');if(c)c.remove();c=document.createElement('canvas');c.id='__sheet';c.width=1280;c.height=720;c.style.cssText='position:fixed;left:0;top:0;width:1280px;height:720px;z-index:99999';document.body.appendChild(c);var g=c.getContext('2d');g.fillStyle='${bg || '#3a322c'}';g.fillRect(0,0,1280,720);var x0=(1280-cols*cell)/2,rh=720/${rows};
      for(var i=0;i<L.length;i++){var q=L[i],cx=x0+(i%cols)*cell+cell/2,cy=Math.floor(i/cols)*rh+rh*0.46;
        try{ if(q.portrait&&IS.drawPortrait) IS.drawPortrait(g,q.name,cx,cy,q.size,Object.assign({time:1.2},q.opts||{})); else { g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(cx,cy+q.size*.38,q.size*.3,q.size*.1,0,0,7);g.fill();IS.drawSprite(g,q.name,cx,cy,q.size,Object.assign({time:1.2,frame:0,dir:1,hp01:1},q.opts||{})) }}catch(e){g.fillStyle='#f0f';g.fillRect(cx-8,cy-8,16,16)}
        g.fillStyle='#eadcc7';g.font='11px monospace';g.textAlign='center';g.fillText(q.label,cx,cy+q.size*.55+4,cell-4)}
      return 1`)
    await page.wait(120)
    await page.screenshot(path.join(OUT, `${tag}-${String(pg + 1).padStart(2, '0')}.png`))
  }
}
try {
  await page.goto('file://' + path.join(ROOT, 'index.html')); await page.wait(800)
  const chars = await ev(`return IS.characters.map(function(c){return {label:c.name+(c.tainted?' (T)':''),name:c.id,size:100}})`)
  const enemies = await ev(`return IS.enemies.map(function(e){return {label:e.id,name:e.sprite||e.id,size:Math.max(56,Math.min(96,e.r*2.6)),opts:{tint:e.tint}}})`)
  const bosses = await ev(`return IS.bosses.map(function(e){return {label:e.id,name:e.sprite||e.id,size:120,opts:{tint:e.tint}}})`)
  const grid = await ev(`return ['rock','tinted-rock','skull-rock','metal-block','pillar','poop','red-poop','gold-poop','rainbow-poop','spikes','retracting-spikes','pit','web','fireplace','blue-fireplace','tnt','key-block','mushroom','vase','bomb','explosion-core','tear','enemy-shot','item-pedestal','penny','key','red-heart','soul-heart'].map(function(n){return {label:n,name:n,size:80}})`)
  if (which === 'all' || which === 'roster') await sheet('roster', chars, 6, 3, 200, '#3a322c')
  if (which === 'all' || which === 'portraits') await sheet('portraits', chars.map(c => ({ ...c, portrait: true, size: 150 })), 6, 3, 200, '#2a2220')
  if (which === 'all' || which === 'enemies') await sheet('enemies', enemies, 12, 6, 106, '#3a322c')
  if (which === 'all' || which === 'bosses') await sheet('bosses', bosses, 6, 3, 200, '#3a322c')
  if (which === 'all' || which === 'grid') await sheet('grid', grid, 7, 4, 180, '#6e5a48')
  console.log('errors', page.console.errors.slice(0, 3), page.console.exceptions.slice(0, 3))
} finally { await page.close() }
