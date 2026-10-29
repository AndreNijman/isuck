# Parity gap list (2026-10-29)

Found by playing through real key presses (not the playtest bot), with a
screenshot of every interaction. Each item has a check. A worker is done when
its checks pass in a **real-input playthrough script** (key presses through
`tools/cdp.mjs`), not only in the bot or the unit-style checks.

Ground rules for all of this:

- **Match the conventions, not the assets.** Layout, flow, timing, controls,
  proportions, readability and the general grimy hand-drawn tone are fair to
  match. Every character, enemy, boss, item icon, logo, title illustration and
  menu illustration is our own original design, drawn procedurally. Nothing is
  traced or copied from the commercial game's sprites or screens, and no
  footage or sprite sheets are downloaded.
- The protagonist and the 34-character roster get **new, original designs**
  with their own silhouettes, faces, palettes and costume details. The
  current player sprite reads as a copy of the commercial game's lead
  character and must be replaced, not polished.

## Controls (done in 3938ac0 / 396ff7c)

Move with WASD, shoot with the arrows, E bomb, Space active, Q pocket.
Shift: tap cycles pocket items, hold drops the trinket. Tab map, hold R
(1 s) restarts, Esc toggles pause. Ctrl is not used, because Ctrl+W closes
the tab.

## Engine / game feel — owner: engine worker

Files: `js/engine/*`, `js/core/*`, `js/data/tuning-*.js`.

1. **Room transition slide.** Walking through a door cuts instantly today.
   The camera should slide about 0.25 s in the door's direction, with the
   simulation frozen during the slide. Check: a screenshot 100 ms after
   crossing shows both rooms partly on screen.
2. **Tear physics.**
   - Tears inherit part of the player's velocity: moving perpendicular while
     firing bends the line.
   - Tears fly at a height. At the end of range they drop in an arc to the
     floor with a shadow and splash, instead of vanishing.
   - Shots alternate between the left and right eye.

   Check: the `z` of a tear goes to 0 at range end, and a perpendicular-move
   shot has a sideways velocity component.
3. **Item pickup pose.** Touching a pedestal holds the item over the head for
   about 1 s and shows a streak at the top with the item name and its one-line
   description. The simulation does not freeze. Check: `p.holdItem` is set and
   `run.streak` holds the name.
4. **Floor name streak** on entering a new floor, using the same streak.
5. **Boss intro card.** Entering an uncleared boss room shows a short versus
   card (about 1.6 s) with the room frozen. Then the fight starts with
   spawn grace. Check: `run.bossIntro` is set on entry and cleared after.
6. **Hit i-frames.** In the walkthrough, a single gaper took 3 half hearts in
   about 0.45 s. Verify that contact damage respects `INVULN_TIME`, that the
   player blinks while invulnerable, and that knockback separates the player
   from the enemy. Fix whichever part is wrong.
7. **Boss-room entry death.** Walking into Little Horn's room with 1.5 hearts
   left killed the player within about 1 s, before they could act. The intro
   card plus spawn grace should prevent instant damage on entry. Check: no
   damage in the first 1.5 s after the card ends, when the player stands
   still at the door.
8. **Boss death** drops the reward pedestal and opens a trapdoor to the next
   floor. Walking onto the trapdoor descends to the next floor. Verify this
   with real input.

## Art + UI — owner: art/UI worker

Files: `js/render/*` (including `render.js`), `js/ui/*`, `index.html` and
`docs/FILE-PLAN.json` for new files.

1. **Floor.** Today it is a hard 13×7 checkerboard with dark seams between
   tiles, which is the biggest tell. Draw one continuous grimy surface per
   floor family, with soft stains, cracks, gentle light falloff toward the
   walls and only faint tile hints.
2. **Rocks and grid objects.** Rocks are grey parallelograms. Draw chunky
   lumpy boulders with highlight, outline and shadow, plus variants. Do the
   same pass on pots, poop, TNT, spikes and pits.
3. **Sprite style pass.**
   - Thick dark outlines, chunky two-tone shading and a soft drop shadow on
     every sprite.
   - The player should be about 0.9 tile tall, with head and body drawn
     separately.
   - The head turns to the shooting direction and the body to the walking
     direction, with a walk cycle.
4. **New original protagonist and roster.** See the ground rules above. All
   34 characters, including select-screen portraits.
5. **Enemies and bosses.** Same outline and shading pass. They keep their
   names and mechanics, but every design must be original.
6. **HUD layout.**
   - Top left: the active item in a slot with a vertical charge bar, then
     the hearts.
   - Down the left side: the coin, bomb and key counters.
   - Bottom left: the trinket. Bottom right: the pocket item (card/pill)
     with its name.
   - Top right: the minimap.
   - Today the active item sits top-right in a gold ring, which is wrong.
7. **Streak banner.** Render `run.streak` across the top as a paper strip with
   a big title and a small subtitle that slides in and out.
8. **Boss intro card.** Render `run.bossIntro` as a full-width versus card:
   the player portrait on the left, the boss on the right and the boss name.
   Original art.
9. **Map.** Tab currently shows a huge, mostly empty dark rectangle. Show the
   enlarged minimap centred on the explored rooms instead, with room-type
   icons and the current room highlighted.
10. **Menus and flow.** Today the flow is title → plain parchment list →
    character select. Build this flow instead, all with original
    illustration:
    1. Title: an illustrated scene, "press start".
    2. Save-slot select with 3 slots.
    3. Main menu as a drawn paper page.
    4. Character select as a rotating carousel with portrait, name, hearts
       and stat icons; Tab switches to the tainted roster.

    Also restyle the pause, death and victory screens to match.
11. **Bombs.** These are now drawn at body size; give them a proper fuse
    flicker and an explosion sprite.

## Shared state contract

The engine sets these fields and the renderer draws them. Both workers
build against this contract.

| Field | Shape | Meaning |
|---|---|---|
| `IS.state.transition` | `{ dir: 'up'\|'down'\|'left'\|'right', t: 0..1, from: roomIndex, to: roomIndex }` or `null` | room slide in progress |
| `tear.z` | number, px above floor | height; 0 = landed |
| `p.holdItem` | `{ id, t }` or `null` | item-over-head pose, `t` counts up from 0 |
| `run.streak` | `{ title, sub, t, dur }` or `null` | top banner (item, floor, pill, card) |
| `run.bossIntro` | `{ bossId, name, t, dur }` or `null` | versus card; room frozen while set |
| `p.headDir` / `p.walkDir` | `{x,y}` | facing for head (shooting) and body (moving) |
| `p.walkT` | number | walk-cycle clock (already exists) |
