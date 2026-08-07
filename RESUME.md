# Resuming this build

## Latest checkpoint — P3 complete, 2026-08-07

P3 (collectible content) is complete at **14/14**. The registry now contains
the complete offline Repentance reference set:

- 732/732 collectibles, including 654 declarative effects and 545 hook-driven
  behaviours;
- 189/189 trinkets;
- 97/97 cards, all with guarded `use(player, ctx)` implementations;
- 50/50 pills;
- 34/34 playable characters;
- 104 familiar behaviour definitions.

Verification performed at this boundary:

- Every `js/data/*.js` file passes `node --check` and `git diff --check` passes.
- Each item/trinket slice has exact ID, number and non-empty-name coverage
  against its source JSON, with no missing or extra entries.
- `node tools/validate-content.mjs` reports exactly 17 errors, all of them the
  17 not-yet-created P4 world files. There are no P3 schema, vocabulary,
  cross-reference, duplicate-ID, sprite, or deterministic-RNG errors.
- A seeded runtime sweep grants and updates every one of the 732 items, then
  invokes all 97 cards and all 50 pills against a dummy room: zero exceptions
  and no non-finite player stats.
- `node tools/state.mjs` reports P3 **14/14** and selects P4 next.

Important history: the first disk audit counted several old item files as done
because they existed and parsed, but they omitted 134 entries. P3 was therefore
audited against the reference slices rather than trusting file presence; the
final 732/732 registry count is authoritative.

The next action is **P4 — Content: world**, and only P4. Its 17 files are:

```text
js/data/enemies-1.js, js/data/enemies-2.js, js/data/enemies-3.js,
js/data/enemies-4.js, js/data/bosses-1.js, js/data/bosses-2.js,
js/data/bosses-3.js, js/data/bosses-4.js, js/data/floors.js,
js/data/rooms-basement.js, js/data/rooms-caves.js,
js/data/rooms-depths.js, js/data/rooms-womb.js, js/data/rooms-alt.js,
js/data/rooms-special.js, js/data/challenges.js,
js/data/achievements.js
```

The durable original workflow is
`~/.claude/projects/-var-home-andre-Projects-isuck/a3d73950-d367-4d66-9bb4-0cede11c467d/workflows/scripts/isuck-p4-world-wf_6cf597d5-acf.js`.
Recompute the P4 gap list from disk before using it. Do not use Kimi agents;
Andre explicitly requested that after two Kimi runs stopped at reconnaissance.

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
