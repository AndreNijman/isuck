# Resuming this build

## Latest checkpoint — responsive viewport hotfix live, 2026-08-07

All phases remain complete, and the broken first release has been repaired in
commits `5b0f5df` and `b653444`. Floor generation now creates reciprocal doors,
door interaction is reachable from the collision boundary, large rooms fit in
the viewport, and room transitions update persisted run state.

Verification performed at this boundary:

- Every `js/data/*.js` file passes `node --check`; `git diff --check` passes.
- `node tools/validate-content.mjs` passes with all 63 scripts loaded and no
  schema, vocabulary, cross-reference, sprite, or deterministic-RNG errors.
- `node tools/smoke.mjs` passes 31/31: a run starts, crosses a real door by
  movement input, verifies the whole floor graph and room fitting, descends three floors, all
  732 items grant safely, and all 80 bosses complete their attack simulation.
- `node tools/balance.mjs --runs 200` passes: 200/200 deterministic runs complete
  without exceptions and reach a mean depth of 6.67/8.
- `node tools/state.mjs` reports every phase complete with no missing files.
- GitHub Pages returns HTTP 200 for the game and 1200×630 social image.
- The games catalog deployment succeeded and its live ISUCK card and 1000×525
  image both return HTTP 200.

The code, GitHub Pages setting, metadata, sitemap, README and games catalog use
`https://isaac.andrenijman.com/`. Cloudflare serves a proxied CNAME from `isaac`
to `andrenijman.github.io`; Full SSL is active. A live Chromium session loaded
the custom HTTPS URL, started a run and crossed a generated door with keyboard
movement with zero console errors or exceptions.

Commit `3d82bd3` fixes a Firefox/large-window regression where CSS enlarged the
canvas without enlarging its backing buffer, cropping the HUD and every door.
The canvas now synchronises its backing size to CSS size and device pixel ratio;
the release suite checks a 1900×1060 viewport. HUD icon and door sprite IDs were
also corrected so placeholders no longer ship. The custom-domain deployment was
visually verified at 1884×1060 and at 2× device pixel ratio.

For future changes, run the three release
gates, regenerate screenshots with `node tools/card-shot.js`, commit, and push
`master`; GitHub Pages deploys from the repository root. Do not use Kimi agents
unless Andre explicitly reverses that instruction. GitHub's origin certificate
may finish provisioning later; the public HTTPS route already works through
Cloudflare.

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
