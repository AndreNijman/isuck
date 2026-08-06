#!/usr/bin/env node
//
// Grabs the 1000x525 card image used by games.andrenijman.com, plus the
// 1200x630 og-image. Poses a real run rather than a title screen, because a
// screenshot of a menu says nothing about what the game is: a lit room, a couple
// of items collected, enemies mid-fight, the HUD showing hearts and pickups.
//
//   node tools/card-shot.js                 # writes shots/card.png + og-image.png
//   node tools/card-shot.js shots/x.png     # custom card path

import path from 'node:path'
import { launch, ROOT } from './cdp.mjs'

const OUT = process.argv[2] || path.join(ROOT, 'shots/card.png')

const page = await launch({ width: 1000, height: 525 })

try {
  await page.goto('file://' + path.join(ROOT, 'index.html'))
  await page.wait(900)

  // A fixed seed so the card is reproducible, and a pose that shows the game
  // doing its job. Everything here is engine API, so if it drifts the shot fails
  // loudly rather than silently producing a title screen.
  const posed = await page.evaluate(`
    try {
      IS.startRun({ charId: 'isaac', seed: 20260806 })
      const run = IS.state.run, ctx = IS.state.ctx

      // a handful of recognisable items so the HUD and the player read as mid-run
      for (const id of ['the-sad-onion', 'brimstone', 'the-inner-eye', 'magic-mushroom']) {
        if (IS.itemsById[id]) IS.giveItem(run.player, id, { noAnim: true })
      }
      IS.recalcStats(run.player)
      IS.addCoins(run.player, 14)
      IS.addBombs(run.player, 3)
      IS.addKeys(run.player, 2)

      // find a combat room on the floor and drop into it
      let target = run.floor.rooms.findIndex(r => r && r.type === 'default')
      if (target < 0) target = run.floor.startIndex || 0
      IS.enterRoom(run, target, 'left', ctx)

      const room = run.room
      // make sure something is actually happening on screen
      if (!IS.roomEnemies(room).length) {
        const pool = (run.floor.def.enemyPool || []).filter(id => IS.enemiesById[id])
        for (let i = 0; i < 5 && pool.length; i++) {
          IS.spawnEnemy(room, pool[i % pool.length], 260 + i * 150, 160 + (i % 3) * 130, {})
        }
      }
      run.player.x = room.pxW * 0.32
      run.player.y = room.pxH * 0.62

      // a few ticks of real simulation so tears and effects are in flight
      for (let i = 0; i < 26; i++) {
        IS.firePlayerTears(run.player, { x: 1, y: 0 }, ctx)
        IS.updateRoom(room, 1/60, ctx)
        IS.updatePlayer(run.player, 1/60, ctx)
      }
      return 'posed:' + IS.roomEnemies(room).length + ' enemies'
    } catch (e) { return 'threw: ' + (e && e.message) }
  `)

  if (String(posed).startsWith('threw')) {
    console.error('could not pose the game:', posed)
    process.exit(1)
  }
  console.log(posed)

  await page.wait(250)
  await page.screenshot(OUT)
  console.log('wrote', OUT)

  // og-image at the social aspect ratio
  await page.call('Emulation.setDeviceMetricsOverride', {
    width: 1200, height: 630, deviceScaleFactor: 1, mobile: false
  })
  await page.wait(400)
  const og = path.join(ROOT, 'og-image.png')
  await page.screenshot(og)
  console.log('wrote', og)
} catch (e) {
  console.error(e)
  process.exit(1)
} finally {
  await page.close()
}
