export const meta = {
  name: 'isuck-p2-render',
  description: 'Write the ISUCK render layer, HUD, screens and the boot loop',
  phases: [{ title: 'Render' }, { title: 'UI' }]
}

const ROOT = '/var/home/andre/Projects/isuck'
const missing = (args && args.missing) || []

const PREAMBLE = `
You are writing one file of ISUCK, a from-scratch browser roguelike in the shape of The Binding of Isaac: Repentance. Project root: ${ROOT}

FIRST, before writing anything, read these IN FULL:
  ${ROOT}/ARCHITECTURE.md      — the frozen contract. §1 (units/geometry), §12 (sprites), §13 (render/camera/HUD), §16 (screens), §0 (constraints).
  ${ROOT}/docs/ENGINE-API.md   — every IS.* signature and which file owns it.
  ${ROOT}/js/core/const.js     — constants and the frozen vocabularies.
Then read the engine files whose data you are drawing — at minimum js/engine/room.js, js/engine/entity.js and js/engine/player.js — so you draw the fields that actually exist rather than the ones you assume.

HARD CONSTRAINTS (verbatim from the contract — violations are build failures):
- Vanilla JS. No dependencies, no build step, no ES modules. Every file wraps itself in an IIFE attached to the single global IS, with EXACTLY this preamble:
    ;(function (IS) {
      'use strict'
      // ...
    })(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
- All paths relative. NO asset files of any kind: every pixel is drawn with canvas paths, gradients and shapes at runtime. No image loading, no external fonts, no base64 sprites, no emoji as art.
- Math.random() IS allowed in js/render/* and js/ui/* (presentation only). It must never feed back into simulation state.
- Units: IS.TILE = 80; a 1x1 room's walkable interior is x in [0,1040], y in [0,560]; the logical canvas is 1280x720. Larger room shapes exist — read room.pxW/room.pxH, never hardcode.
- Do NOT create, edit or delete any file other than the one(s) assigned to you. NEVER touch index.html — it is already wired for your file.
- MUST WORK HEADLESS: these files are loaded by tools/loader.mjs in Node with a stubbed canvas, so nothing may touch document/window at load time. Do all DOM work inside an init function that main.js calls.

QUALITY BAR: this is the layer the player actually sees, so it carries the whole feel of the game. Draw with intent — silhouette first, then shading, then a detail or two. Dark, grimy, hand-inked basement palette; readable at a glance in a busy room; the player and enemy projectiles must always be the most legible things on screen. No TODO comments, no unfinished shapes.

WHEN DONE: run \`node --check <each file>\` and fix anything it reports. Then reply with ONLY a compact summary: file path(s), what you registered or defined, and any assumption you made.
`

const SPRITE_RULE = `
THE SPRITE CONTRACT (ARCHITECTURE.md §12):
  IS.defineSprite(name, function (g, s, t) { … })
  g = CanvasRenderingContext2D, already translated so (0,0) is the entity's CENTRE, y down
  s = size in units; draw within about [-s*0.6, s*0.6]
  t = { frame, time, dir, hurt, tint, variant, flip, charge, hp01 }
Deterministic for a given t — the renderer caches static sprites offscreen keyed by name|size|tint|variant. Call IS.spriteAnimated(name) for anything that must animate every frame.
Use IS.shade(hex, amount), IS.mix(a, b, t) and IS.alpha(hex, a) from js/core/math.js for all colour work so the palette stays coherent.
Honour \`t.hurt\` with a white flash overlay and \`t.tint\` as the body colour whenever the def supplies one — champion variants and floor palettes both rely on tint actually being used.

COVERAGE IS MECHANICAL, NOT MANUAL. You must guarantee a registered sprite for EVERY id in the registry you cover, and the registries hold hundreds of entries. Do NOT hand-write hundreds of near-identical functions. Instead:
  1. Hand-write a small set of excellent "family" draw functions (a dozen or two), each parameterised — body shape, palette, eyes, limbs, spikes, wings, segments.
  2. Write a classifier that maps an id/name to a family plus params, using keyword matching on the name and the def's own fields (archetype, flying, r, tint).
  3. Loop the registry at load time and IS.defineSprite(id, …) for every entry, so coverage is total by construction and a content file added later still gets art.
This is the intended architecture, not a shortcut: it is what makes 200 enemies look like they belong in the same game.
`

const TASKS = [
  {
    label: 'sprites-core',
    phase: 'Render',
    files: ['js/render/sprites-core.js'],
    spec: `Write js/render/sprites-core.js — the player, the pickups, the grid objects, the doors and the projectiles.
${SPRITE_RULE}
Register:
- One sprite per character id (loop IS.characters). The base body is the same naked-child silhouette — big head, small body, thin limbs, a tear-streaked face — and the classifier differentiates by character: Isaac plain, Magdalene with hair, Cain an eyepatch, Judas a dark hood, ??? a blue-grey corpse tint, Eve black hair and dark palette, Samson a scowl, Azazel dark red with small wings, Lazarus long hair, Eden mismatched everything, The Lost translucent white, Lilith blindfolded, Keeper a coin-headed shopkeeper, Apollyon hooded with a void, The Forgotten a skeleton with a bone club, Bethany with a cross, Jacob & Esau twins. Tainted variants are the same body with a corrupted palette, an inverted highlight and a distinguishing mark. Honour t.dir (four facing directions: the head turns, and the body shifts a little) and t.frame for a two-frame walk bob.
- Pickups: penny/nickel/dime/lucky penny, key, golden key, bomb, golden bomb, red heart (full and half), soul, black, eternal, gold, bone, rotten and blended hearts, battery (normal and mega), card back, pill (two-tone capsule, coloured by t.variant), rune stone, trinket, sack, and each chest kind (normal, golden, spiked, mimic, red, haunted, old, mega, bomb). Also the item pedestal itself (a stone plinth with a glow) — the item icon on top is drawn by sprites-items.js.
- Grid objects, one per value in IS.GRID_CHARS: rock, tinted rock (with a glint), marked skull rock, metal block, pillar, the four poop kinds, spikes and retracting spikes (t.charge = extension), pit (with an inner shadow and a rim), pit bridge, web, fireplace and blue fireplace (animated — call IS.spriteAnimated), TNT, key block, locked chest spawn, mushroom, vase, water tile, crawlspace hatch.
- Doors, one sprite per kind in IS.DOOR_KIND_LIST, drawn closed and open via t.charge: normal stone, treasure gold, shop, boss (a fleshy face), secret, devil (horned and red), angel (white and gold), curse (barbed), arcade, library, challenge, planetarium (starry), locked (with a padlock), mom-locked (with two keyholes).
- Projectiles: player tear (a wobbling droplet whose size scales with t.variant), blood tear, enemy shot, brimstone beam segment, tech laser segment, knife, bomb (with a lit fuse), and the small effect sprites: tear splash, blood splatter, poof, explosion core, spark, holy shield bubble, charge ring.`
  },
  {
    label: 'sprites-enemies',
    phase: 'Render',
    files: ['js/render/sprites-enemies.js'],
    spec: `Write js/render/sprites-enemies.js — art for EVERY enemy in the registry.
${SPRITE_RULE}
Loop IS.enemies (skipping entries where def.boss is true — bosses are another file) and register a sprite for every id. Build families that cover the real bestiary and classify by name keyword plus def fields:
- blob/gaper family: a soft flesh mound with two hollow eyes and a wet mouth (Gaper, Frowning Gaper, Clotty, i.blob, Dip, Squirt, Splasher, Mask).
- fly family: a round body, two twitching wings, one big eye (Fly, Attackfly, Boom Fly, Eternal Fly, Pooter, Blue Fly). Wings animate.
- spider/crawler family: a low body on thin jointed legs (Trite, Rock Spider, Sack of Sacks, Para-Bite).
- worm/segment family: repeated tapering circles along a curve (Round Worm, Night Crawler, Leech, Nerve Ending, Turdlet segments).
- bone family: a skull plus visible ribs, bleached palette (Bony, Black Bony, Revenant, Big Bony, Holy Bony).
- knight/armour family: a helmeted plate mass with a visor slit and a shield face (Knight, Selfless Knight, Loose Knight, Floating Knight).
- ghost family: a translucent hooded wisp with a soft edge (Wizoob, Red Ghost, Lil Haunt, Whipper).
- maw/mouth family: a wall-mounted ring of teeth (Maw, Red Maw, Psychic Maw, Gaping Maw, Grimace, Stone Grimace).
- fatty family: a wide sagging body with rolls and a small head (Fatty, Flaming Fatty, Gutted Fatty, Bloated Fatty, Conjoined Fatty).
- host family: a domed shell over a hidden body, shell closes as armour (Host, Red Host, Mobile Host).
- globin/gel family: a translucent lumpy mass (Globin, Black Globin, Gut, Boil).
- baby family: a small pale humanoid with a big head (Baby, Angelic Baby, Molten Baby, Ragling).
- sin family, for the mini-bosses (def.mini true): a distinctive gluttonous, prideful or wrathful silhouette per sin, larger and more detailed than a normal enemy.
- plus: hopper/leaper legs, charger horns, spitter jaw, hive holes, ash pile, cinder ember glow, mine cart, locust swarm, coal boy, and a generic fallback family so an unclassified id still gets credible art rather than a box.
Use def.tint as the body colour when present, and derive the shading from it so the whole floor reads as one palette. Honour t.hurt, t.dir, t.frame and t.hp01 (a badly hurt enemy can show cracks or leak).`
  },
  {
    label: 'sprites-bosses',
    phase: 'Render',
    files: ['js/render/sprites-bosses.js'],
    spec: `Write js/render/sprites-bosses.js — art for EVERY boss in the registry.
${SPRITE_RULE}
Loop IS.bosses and register a sprite for every id. Bosses are 2–4x the size of an enemy and should read as a set piece: a strong silhouette, one memorable feature, visible damage state via t.hp01.
Families to hand-write and classify into: giant mouth (Monstro, Monstro II, Mega Maw, Gurdy), segmented worm (Larry Jr, The Hollow, Pin, Frail, The Scourge, Wormwood), fly swarm host (Duke of Flies, The Husk, Rag Man), twin/paired bodies (Gemini, Steven, Blighted Ovum, Lokii, Sisters Vis, Tuff Twins, Horny Boys), gut sack (Chub, C.H.A.D., Carrion Queen, The Pile, Turdlet), floating cyst (Fistula, Teratoma, Blastocyst, The Bloat), spider (Widow, Daddy Long Legs, Triachnid), maternal giant (Mom, Mama Gurdy, The Matriarch, Mother — a huge leg, a huge eye, a wall of flesh), heart (Mom's Heart, It Lives), horseman (Famine, Pestilence, War, Death and their Ultra forms — a mounted skeletal rider), devil (Satan, The Fallen, Krampus, Mega Satan — horns, hooves, a goat skull), angel (The Lamb, Uriel/Gabriel-like Seraphim), corrupted child (Isaac, Blue Baby, The Beast's Isaac), abstract endgame (Hush a vast pale mass, Delirium a shifting chimera of other bosses, Dogma a television-headed prophet, The Beast a colossal riding horror), mechanical (Great Gideon a stage curtain, Hornfel, Singe, Min-Min), and rot (Rotgut, Colostomia, The Visage, Clutch, Big Horn, The Forsaken, The Stain, Brownie, The Adversary, Reap Creep, The Shell, Chimera, The Heretic, Bumbino, The Pilgrim).
Every boss must visibly telegraph: read t.charge (the engine sets it during an attack wind-up) and show it — eyes glowing, body swelling, a mouth opening. A boss that does not telegraph is unfair, and the art is half of the telegraph.`
  },
  {
    label: 'sprites-items',
    phase: 'Render',
    files: ['js/render/sprites-items.js'],
    spec: `Write js/render/sprites-items.js — an icon for EVERY collectible, trinket, card and pill.
${SPRITE_RULE}
Register sprites named 'item:<id>' for every entry in IS.items and IS.trinkets, 'card:<id>' for IS.cards and 'pill:<id>' for IS.pills, by looping the registries. That is over a thousand icons, so the classifier is the whole job:
1. Hand-write about 30 icon archetypes, each parameterised by two or three colours: heart, pill, syringe, book, bag/sack, mushroom, fly, spider, eye, tooth, bone, skull, halo, horn, wing, sword/knife, bomb, coin, key, battery, mirror, camera, brimstone, tear, flower, meat, bottle, box, machine, candle, cross, star, egg, worm, gem, rock, cloth, hand.
2. Classify by keyword on the item's NAME (which is the real in-game name, so this works surprisingly well: anything with "Heart" is a heart, "Pill"/"Vitamins" a pill, "Book"/"Bible"/"Necronomicon" a book, "Mom's" often cloth or a body part, "Bum"/"Sack" a bag, "Baby"/"Brother"/"Sister" a small figure, "Fly"/"Spider" the creature icons, "Bomb"/"Boom" a bomb, "Key" a key, "Eye"/"Vision" an eye, "Knife"/"Blade" a blade, and so on).
3. Derive a deterministic palette from IS.hashString(id) so two items sharing an archetype still look different, but tint by the item's own character where the name implies it (holy items pale gold, devil items dark red and black, tech items steel blue, fungal items dull green).
4. Quality should read at a glance: give quality-4 items a subtle glow or gold rim, and quality-0 items a dull, chipped look.
Cards use the tarot silhouette (a bordered rectangle with a central symbol keyed by cardType: tarot gets an arcana glyph, rune a carved angular mark, soul stone a cracked gem, suit a pip). Pills are the two-tone capsule using the run's assigned colour passed via t.variant.
Also register 'item:unknown' as the fallback for a blind-curse pedestal (a question mark on a plain plinth icon).`
  },
  {
    label: 'backdrop',
    phase: 'Render',
    files: ['js/render/backdrop.js'],
    spec: `Write js/render/backdrop.js — the room itself: floor, walls, and the grid objects laid on them. Implement IS.drawBackdrop(g, room, floor), IS.drawGridObjects(g, room, floor) and IS.drawDoors(g, room) exactly as documented.
- Read the floor def's palette (wall, wallDark, floor, floorAlt, accent, creep, backdrop) so one function paints every floor in the game and each tier looks distinct.
- The floor is a tile grid with subtle per-cell variation: alternate floorAlt tiles in a deterministic pattern derived from the room seed (NOT Math.random per frame, or the floor will strobe), plus a few cracks, stains and drain grates. Add a soft vignette so the room edges fall into shadow.
- Walls are drawn as a thick border with an inner lip and an outer dark band, correctly cut for every shape in IS.SHAPES including the four L shapes' missing quadrant. Rooms bigger than 1x1 must tile the wall seamlessly.
- Cache the static parts: build the floor and wall art once per room into an offscreen canvas keyed by room index and palette, then blit it each frame. Redrawing several hundred tiles per frame is the single easiest way to lose 60fps here.
- IS.drawGridObjects draws each object from room.grid via IS.drawSprite, sorted so taller objects overlap correctly, with a contact shadow under each.
- IS.drawDoors draws each door in room.doors at its wall position, rotated to its wall, in its open/closed/locked state, with the frame drawn on top of the wall band.
- Floor-specific extras where the palette implies them: water shimmer on flooded floors, drifting ash on Ashpit, dripping on Downpour, candle glow on Mausoleum. Keep them cheap.`
  },
  {
    label: 'render',
    phase: 'Render',
    files: ['js/render/render.js'],
    spec: `Write js/render/render.js — the scene compositor. Implement IS.camera, IS.updateCamera(room, p, dt), IS.worldToScreen, IS.screenToWorld and IS.render(g, dt) exactly as documented in ARCHITECTURE.md §13 and docs/ENGINE-API.md.
- Handle device pixel ratio and the letterboxed 1280x720 logical space: the canvas element is sized by CSS, and this file maps logical units to device pixels with one transform, so every other file can work in logical units. Expose the scale so input.js's screenToWorld agrees with it.
- Camera: fixed and centred for 1x1 rooms (the whole room fits on screen). For larger shapes, follow the player with a dead zone and smooth damping, clamped so the view never leaves the room. Apply IS.camera.shakeX/shakeY (fx.js writes them).
- Draw order, strictly: backdrop -> under-layer fx (creep, decals, blood) -> pits and floor grid objects -> pickups -> entity shadows -> entities sorted by y (enemies, player, familiars) -> standing grid objects that should overlap entities -> projectiles -> over-layer fx (sparks, gibs, floaters) -> lighting -> doors' overlay -> HUD via IS.hud.draw.
- Lighting: a soft radial light around the player composited multiplicatively, stronger on dark floors. Curse of the Darkness (IS.CURSE.DARKNESS) drops the ambient level hard and tightens the player's light radius. Fires and explosions add local light. Keep it to one or two composite passes.
- Enemy telegraphs must be drawn here as ground markers where the engine sets them (e.charge/e.ai.telegraph, boss attackState): a growing ring, a dashed line along a charge path, shadows where projectiles will land. This is what makes the game fair, so it must be unmissable.
- Also draw: the room-transition wipe, the floor-title card, the boss-intro nameplate, the item-pickup banner hand-off to hud.js, and a pause dim.
- Performance: no allocation in the frame path, one save/restore per layer rather than per entity where possible, and skip anything fully offscreen.`
  },
  {
    label: 'hud',
    phase: 'UI',
    files: ['js/render/hud.js'],
    spec: `Write js/render/hud.js — implement IS.hud.draw(g, run), IS.hud.minimap(g, run) and IS.hud.pickupBanner(text, subtext), plus whatever internal state the banner queue needs.
- Hearts, top left, in half-heart units, in the game's order: bone containers, then red/rotten, then soul, then black, then eternal, then gold, wrapping to a second row past six. Broken hearts show as empty cracked containers. Keeper's coin hearts render as coins. Draw with the pickup sprites so the HUD and the world agree.
- Consumables under the hearts: coins, bombs (golden bomb marked), keys (golden key marked), each with its icon and count.
- Active item, top right: the item icon in a frame with a charge bar around it — segmented for room charges, a smooth fill for timed charges, and a bright pulse plus the charge-ready sfx cue when it fills. Show the second active slot when the player has one, and the battery overcharge as a second layer on the bar.
- Pocket items, bottom right: cards, pills and runes in their slots, with the pill's run-assigned colour and an "identified" label when known. Trinkets bottom left.
- Minimap, top right corner: the floor's room grid, with visited, cleared, current and adjacent-but-unvisited states, special-room icons (treasure, shop, boss, secret once found, devil, angel, planetarium), and the Curse of the Lost case where the map is hidden. Tab expands it to a large centred overlay.
- Floor and time readout, plus the seed when the player asked for it in options.
- The pickup banner: a bottom-centre strip showing an item's name and its one-line info when picked up, queued so several pickups in a row do not overwrite each other, fading after a couple of seconds.
- Everything scales from one \`u\` unit derived from the logical canvas size so the HUD holds together at any window size. No DOM, no HTML overlay — this is all canvas.`
  },
  {
    label: 'ui:widgets+title',
    phase: 'UI',
    files: ['js/ui/widgets.js', 'js/ui/screens-title.js'],
    spec: `Write js/ui/widgets.js and js/ui/screens-title.js.

widgets.js — the shared canvas UI kit every screen uses. Define an IS.ui namespace with: text(g, str, x, y, opts) handling size/weight/align/colour/shadow and a pixel-ish monospace look; panel(g, x, y, w, h, opts) drawing the game's bordered parchment-on-stone panel; button/menuItem drawing with selected, disabled and hover states; a list/menu helper that owns cursor movement given the input state and returns the chosen index; a scroller for long lists (the collection and bestiary need it); a grid helper for icon grids; a slider for the options screen; a tab bar; a modal confirm; and a marquee for long text. Also a small layout helper so screens can lay things out in logical units without hardcoding pixel positions everywhere. Menu navigation must work identically from keyboard, mouse and gamepad — read IS.input, never raw events.

screens-title.js — register the 'title' and 'menu' screens with IS.defineScreen(name, { enter, exit, update, draw, key }).
- The title screen is the game's first impression: the ISUCK wordmark, a slowly animated basement scene behind it (a lone figure, drifting dust, a flickering light), the "press any key" prompt, and the version. Draw it with the same procedural vocabulary as the rest of the game.
- The menu offers: New Run, Continue (only when IS.save.hasRun()), Challenges, Collection, Bestiary, Stats, Secrets, Options, Controls. Selecting New Run goes to 'char-select'. Show the win-streak and the completion count somewhere quiet.
- Both screens must be fully navigable with keyboard, mouse and gamepad, and must call IS.audio.resume() on the first real key press (browsers block audio before a gesture — this is the gesture).`
  },
  {
    label: 'ui:select',
    phase: 'UI',
    files: ['js/ui/screens-select.js'],
    spec: `Write js/ui/screens-select.js — register the 'char-select', 'challenge-select' and 'seed-entry' screens with IS.defineScreen.
- char-select: the roster of every character in IS.characters, as a grid of portraits drawn with each character's own sprite. Show the highlighted character's name, description, starting stats (as small bars for damage/tears/range/speed/luck plus the heart layout) and starting items, using the item icons. Locked characters (IS.save.itemUnlocked / IS.save.unlocked against def.unlock) render as silhouettes with their unlock hint. Tainted characters live on a second row or a toggled tab, unlocked separately. Confirm starts the run via IS.startRun({ charId }); a key toggles seed entry so a run can be seeded; cancel returns to the menu.
- challenge-select: the list of IS.challenges with completion ticks from IS.save.data.challengesDone, the challenge's description, its forced character and items, and its goal. Confirm starts the run with { charId, challengeId }. Locked challenges show their unlock condition.
- seed-entry: an 8-character seed field using the alphabet IS.seedToString produces, editable with the keyboard and with a randomise action, validated through IS.stringToSeed, then handed to IS.startRun. Show clearly that a seeded run still counts for unlocks or does not, matching whatever js/engine/progress.js actually does — read it rather than guessing.`
  },
  {
    label: 'ui:meta',
    phase: 'UI',
    files: ['js/ui/screens-meta.js'],
    spec: `Write js/ui/screens-meta.js — register 'collection', 'bestiary', 'stats', 'secrets', 'options' and 'controls' with IS.defineScreen.
- collection: the item gallery, every entry in IS.items in \`num\` order, as a scrollable icon grid using the 'item:<id>' sprites. Items the player has never seen render as a dark silhouette; seen ones show in colour; the selected one shows name, quality, pools, dlc and its info line in a side panel. Tabs switch between collectibles, trinkets, cards and pills. Show a "seen N of M" counter — this screen is the game's completion metre, so the count must be honest.
- bestiary: every enemy and boss in IS.enemies/IS.bosses from IS.save.data.bestiary, showing the sprite, the name, kills, hp, and the one-line bestiary flavour. Unencountered entries are hidden as "???".
- stats: run and lifetime numbers from IS.save.data.stats — runs started, wins by goal, deaths, best time, best depth, items taken, coins/bombs/keys collected, favourite character, streak, and the per-character completion marks grid (which goals each character has beaten), which is the game's real progression display.
- secrets: the achievement list from IS.achievements, showing name, what it unlocks and the condition, with unlocked ones revealed and locked ones showing only the condition. Include the count.
- options: sliders for master/sfx/music volume, toggles for screenshake, damage numbers, reduced effects, mouse aim, timer display, seed display, and a fullscreen toggle, all persisted through IS.save.option. Include a clearly-guarded "erase all progress" that asks twice.
- controls: the current bindings from IS.input.bindings with a rebinding flow (select an action, press a key, IS.input.rebind), a reset-to-defaults action, and a gamepad section showing the mapping and whether a pad is connected.
All six are long lists, so use the widgets.js scroller and keep them navigable with keyboard, mouse and gamepad.`
  },
  {
    label: 'ui:run',
    phase: 'UI',
    files: ['js/ui/screens-run.js'],
    spec: `Write js/ui/screens-run.js — register 'pause', 'death', 'victory', 'run-summary', 'challenge-list' and 'credits' with IS.defineScreen.
- pause: dim the live game behind the panel (the run keeps its state; do not tear it down), offer Resume, Options, Controls, Restart Run (confirm first), Abandon Run to the menu, and show the current run at a glance: character, floor, time, seed, the items collected as an icon row, and the stat block.
- death: the game's post-mortem. The character's death portrait, what killed them (the engine records the damage source — read it), the floor and time reached, the items collected, and the run's stats. Offer Restart with the same character, New Run and Menu. This screen is where a roguelike either invites another run or does not, so make it quick to leave and easy to restart.
- victory: the ending for whichever goal was met (Mom, Mom's Heart, Isaac, ???, Satan, The Lamb, Mega Satan, Hush, Delirium, Mother, The Beast), with the goal's name, the mark earned for that character, the run's numbers, and any unlock that just happened. It must be visibly different from the death screen.
- run-summary: the shared "what happened in this run" panel both death and victory embed — items with icons, floors visited, bosses killed, damage taken, deals taken, time. Export it so those screens draw the same thing rather than two versions drifting apart.
- challenge-list: the completion board for all 45 challenges.
- credits: an honest credit roll — written from scratch by Andre Nijman, no engine and no asset packs, every sprite drawn in code and every sound synthesised, and a clear line crediting The Binding of Isaac by Edmund McMillen and its Repentance expansion by Nicalis as the original this is an homage to.
All screens must handle keyboard, mouse and gamepad through IS.input and IS.ui.`
  },
  {
    label: 'main',
    phase: 'UI',
    files: ['js/main.js'],
    spec: `Write js/main.js — the boot sequence, the screen state machine, the fixed-timestep loop and the headless simulator. This is the keystone: nothing runs without it. Implement IS.boot, IS.go, IS.startRun, IS.endRun, IS.state, IS.canvas, IS.g and IS.simulate exactly as documented in docs/ENGINE-API.md (read the js/main.js section, including the two harness requirements at the end — the test harness depends on both).

- IS.boot(): find the #game canvas, get the 2d context, size it for the device pixel ratio, init input/audio/save/fx, hide the #boot overlay by adding the 'gone' class, register a resize handler, and start the loop on the 'title' screen. Wire it to DOMContentLoaded at the bottom of the file, guarded so requiring this file in Node does not try to boot.
- The loop: requestAnimationFrame driving a fixed-timestep accumulator at IS.DT with a maximum of about 5 catch-up steps per frame (so a background tab does not simulate ten minutes on return), then one draw. Advance IS.state.time and IS.state.frame. Update IS.state.ctx via IS.refreshCtx every step — tools/smoke.mjs reaches the engine through it.
- Screen machine: IS.go(name, args) calls the old screen's exit, sets IS.state.screen, calls the new screen's enter(args). Unknown screen name warns and falls back to 'title'. The 'game' screen's update runs the run: IS.updatePlayer, IS.updateRoom, IS.updateFamiliars, IS.updateInteractions, then the pause check.
- IS.startRun({ charId, seed, challengeId, greed }): build the run object documented in ENGINE-API.md (seed defaults to IS.randomSeed(), with rng/floorRng/poolRng forked from it), make the player, IS.initPools, IS.assignPillColours, apply the challenge's starting loadout and rules, IS.startFloor on the first floor, IS.go('game'), and store a resumable snapshot through IS.save.storeRun so a closed tab can continue.
- IS.endRun(reason, goal): record it through IS.progress.completeRun, clear the stored run, and go to 'death' or 'victory'.
- Pause on Escape and on window blur. Handle visibilitychange by pausing rather than letting the accumulator pile up.
- IS.simulate(opts): the headless auto-player, and it MUST work with window undefined (tools/balance.mjs loads this file in Node with no canvas and no audio). Build a run exactly as IS.startRun does but with no rendering, no audio and no input, then loop the fixed timestep with a simple built-in policy: move toward the nearest enemy while keeping a little distance, fire at it, use a bomb on a blocking rock, take pickups by walking over them, take the pedestal item in a treasure room, and head for the trapdoor or the next unvisited room once the room is clear. Stop on death, on maxFloors, or on maxSeconds of simulated time, and return { floorsCleared, depth, died, seconds, itemsTaken, error }. Catch and return errors in \`error\` rather than throwing, so one bad seed does not abort a 300-run sweep.
- Also expose a small IS.debug namespace (giveItem by id, clear the room, warp to a floor, toggle god mode, spawn an enemy by id) guarded behind a save option or a URL flag — it makes every later fix loop faster.`
  }
]

const todo = TASKS.filter(t => t.files.some(f => missing.length === 0 || missing.includes(f)))
log(`P2: ${todo.length} tasks, ${todo.reduce((n, t) => n + t.files.length, 0)} files`)

const results = await parallel(todo.map(t => () =>
  agent(`${PREAMBLE}\n\nYOUR ASSIGNMENT — write ${t.files.join(' and ')}:\n\n${t.spec}`,
    { label: t.label, phase: t.phase })
))

log(`P2 done: ${results.filter(Boolean).length}/${todo.length} agents returned`)
return { ran: todo.map(t => t.label), summaries: results }
