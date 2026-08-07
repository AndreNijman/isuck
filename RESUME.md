# Resuming this build

## Latest checkpoint — P4 complete, 2026-08-07

P4 (world content) is complete at **17/17**. The canonical world registry now
contains 208 enemies, 80 bosses, 500 rooms, 57 floors, 45 challenges and 637
achievements. `docs/reference/roster.json` is the exact enemy/boss source used by
the runtime definitions.

Verification performed at this boundary:

- Every `js/data/*.js` file passes `node --check`; `git diff --check` passes.
- `node tools/validate-content.mjs` passes with all 63 scripts loaded and no
  schema, vocabulary, cross-reference, sprite, or deterministic-RNG errors.
- `node tools/smoke.mjs` passes 27/27: a run starts, descends three floors, all
  732 items grant safely, and all 80 bosses complete their attack simulation.
- `node tools/balance.mjs --runs 20` passes: 20/20 deterministic runs complete
  without exceptions and reach a mean depth of 6.8/8.
- `node tools/state.mjs` reports P4 **17/17**, P5 **6/6**, and selects P6 next.

The next action is **P6 — Ship**. Its remaining files are `README.md`,
`og-image.png`, and `shots/card.png`. Shipping can change public/external state,
so inspect P6 and obtain the appropriate authorization before enabling Pages or
publishing. Do not use Kimi agents; Andre explicitly requested this.

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
