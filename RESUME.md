# Resuming this build

## Latest checkpoint — P2 complete, 2026-08-07

P2 (render + UI + boot) is complete at **15/15**. The browser now has a
procedural sprite system, room compositor, camera and lighting, HUD/minimap,
shared canvas UI, all 18 contracted screens, a fixed-step game loop, a
headless simulator, and accessible page-level canvas controls.

Verification performed at this boundary:

- Every file in `js/render/`, `js/ui/`, and `js/main.js` passes `node --check`.
- Headless loading registers 18 screens and 579 sprites with current partial
  content; all documented P2 API symbols are present.
- Mechanical sprite coverage includes current items, pills and familiars and
  automatically covers later character/enemy/boss/card/trinket registries.
- A hook probe proves content hooks receive `(player, ...args, ctx)` exactly;
  P2 integration exposed and fixed the older inconsistent P1 dispatch.
- `node tools/validate-content.mjs` is down to 34 expected errors: 24 missing
  P3/P4 files, seven familiar references whose definitions are in missing
  collectible batches, and three pre-existing `Math.random()` violations in
  partial P3 data. There are no P2 API or sprite errors.
- A real Chromium/file-URL pass reaches the title screen, advances frames, and
  records no exception or warning. Network errors are only the 24 future
  P3/P4 scripts already listed above.
- `node tools/state.mjs` reports P2 **15/15** and selects P3 next.

Accessibility/design decisions:

- The direction is a grimy, hand-inked basement with bone text and one blood
  accent—not generic glass UI. The title's memorable device is a stark keyhole
  under a narrow cellar light.
- The canvas is keyboard-focusable with a visible high-contrast focus border,
  control instructions, skip link, and polite screen-state announcements.
- Canvas menus use 44-unit targets and obvious selected states. Raw key events
  are forwarded to seed entry/rebinding screens. Reduced-motion preference
  disables the title flicker/blink and CSS transitions collapse under the
  existing media query.

The next action is **P3 — Content: collectibles**, and only P3. Recompute state
before work. The expected missing files are:

```text
js/data/items-2.js, js/data/items-4.js, js/data/items-8.js,
js/data/trinkets-1.js, js/data/trinkets-2.js,
js/data/cards.js, js/data/characters.js
```

P3 must also remove the three validator-reported `Math.random()` calls from
`items-5.js`, `items-7.js`, and `pills.js` by using the owning `ctx.rng` stream.
Do not begin P4 until the collectible validator is clean.

This build is designed to survive the laptop being shut down mid-phase. Nothing
important lives in a session's head: it lives in files, and `tools/state.mjs`
recomputes progress by looking at what is actually on disk.

## To resume, in order

```bash
cd /var/home/andre/Projects/isuck
node tools/state.mjs            # what is done, what is missing, what is next
node tools/state.mjs --next     # just the next actionable step
node tools/state.mjs --gates    # also runs validate-content + smoke (slow)
```

`node tools/state.mjs` rewrites `BUILD_STATE.json`. A file counts as done only if
it exists, is non-trivial, passes `node --check`, **and** is referenced from
`index.html` — an unwired script is treated as missing, because that is the
failure mode that silently produces a game with no content in it.

Then continue with the phase named in `next:`. Read `ARCHITECTURE.md` (the frozen
contract) and `docs/ENGINE-API.md` (every `IS.*` signature and its owning file)
before writing anything. `docs/FILE-PLAN.json` is the master file list.

## Rules that make it resumable

1. **Every phase is idempotent.** Work is dispatched only for files that
   `tools/state.mjs` reports as missing / stub / syntax-error / unwired. Rerunning
   a phase after an interruption re-does exactly the unfinished part.
2. **Commit at every phase boundary** (`git -C . add -A && git commit`). The git
   log is the coarse-grained checkpoint; the file states are the fine-grained one.
3. **Never edit `index.html` from a parallel agent.** The script list is
   maintained by the orchestrating session only, so two agents can never fight
   over it. Add newly written files to it right after a phase completes.
4. **Never widen a vocabulary in a data file.** Hook names, tear flags, pools,
   archetypes, attack names and grid characters are frozen in `js/core/const.js`
   and checked by `tools/validate-content.mjs`. A data file that invents a hook
   name loads fine and silently does nothing — the validator exists to catch
   exactly that.

## Gates before shipping

```bash
node tools/validate-content.mjs   # schema, cross-references, script wiring
node tools/smoke.mjs              # headless boot, no console errors, plays floors
node tools/balance.mjs            # seeded auto-runs, reports depth reached
```

## Deploy state

Tracked under `phases[].deploy` in `BUILD_STATE.json`:
`repo-created → pages-enabled → game-pushed → card-added-to-games-site →
games-site-pushed → live-verified`.

The game ships to **GitHub Project Pages** at `https://andrenijman.github.io/isuck/`,
so **every path in the project must be relative** (`js/main.js`, never
`/js/main.js`) or it will 404 under the `/isuck/` prefix.

Moving to a subdomain (`isaac.andrenijman.com`) needs one DNS record that cannot
be created from this machine — there is no Cloudflare token here. To do it:
add a CNAME `isaac` → `andrenijman.github.io` in Cloudflare (DNS only, grey
cloud), then commit a `CNAME` file containing `isaac.andrenijman.com`, set the
custom domain on the repo's Pages settings, and update the card `href` plus the
canonical/OG URLs.
