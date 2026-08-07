# Build phases and their workflow runs

Durable record of how each phase was dispatched, so an interrupted build can be
re-dispatched identically. Workflow run IDs are session-scoped (resuming by
`resumeFromRunId` only works inside the session that launched them) — the
**script paths are the durable part**, and they can be re-invoked from any
session with `Workflow({scriptPath})`.

Every phase script takes `args.missing` — the list of repo-relative files still
to write, straight out of `node tools/state.mjs --json`. Re-running a phase with
a fresh `missing` list is safe and re-does only the unfinished part. That is the
whole resume story: **recompute state from disk, pass the gaps back in.**

| Phase | Script | Run IDs | Agents |
|---|---|---|---|
| P1 core + engine | `workflows/scripts/isuck-p1-engine-wf_f8c7aca3-81f.js` | `wf_f8c7aca3-81f`, re-dispatched `wf_53e264ec-d1b` | 13 |
| P3 collectibles | `workflows/scripts/isuck-p3-collectibles-wf_846d5f1f-9a8.js` | `wf_846d5f1f-9a8`, re-dispatched `wf_cdcdf80f-43e` | 14 |
| P4 world | `workflows/scripts/isuck-p4-world-wf_6cf597d5-acf.js` | `wf_6cf597d5-acf` | 1 + 13 |

### Audit after the second interruption (2026-08-07)

No workflow was launched during this audit. All surviving JavaScript files pass
syntax checking, and `BUILD_STATE.json` was recomputed from disk. P1 has 15
files left, P3 has 7 files left, and P4 has all 17 files left. The authoritative
P1 argument and continuation procedure are recorded at the top of `RESUME.md`.

The second P1 run (`wf_53e264ec-d1b`) and second P3 run
(`wf_cdcdf80f-43e`) both terminated due Claude session/weekly limits. Their
workflow completion envelopes say `completed`, but every child agent is listed
under `failures`; do not interpret the envelope status as phase completion.
Partial files that reached disk are valid checkpoints and are excluded by the
fresh missing lists.

### P1 completion checkpoint (2026-08-07)

P1 was completed directly after the failed workflow runs; the obsolete P1
workflow must not be relaunched. All 18 planned files now exist, pass syntax
checking, and are wired in `index.html`. A seeded headless entity/projectile
probe passes, and the validator finds all P1-owned API symbols plus 36/36 enemy
archetypes and 45/45 boss attacks. `tools/state.mjs` selects P2 as the next
phase. See the latest checkpoint at the top of `RESUME.md` for the exact P2 gap
list and integration caveats.

### P2 completion checkpoint (2026-08-07)

P2 was implemented from the durable repository workflow and completed at
15/15. The phase registers 579 sprites against currently available data, all 18
screen names, every documented render/HUD/camera symbol, and the main loop plus
headless simulator. Syntax, headless registration, hook-signature, state, and
real-browser title checks pass. The remaining 34 validator errors are entirely
P3/P4-owned. The exact P3 missing list and three deterministic-RNG repairs are
recorded at the top of `RESUME.md`.

### P3 completion checkpoint (2026-08-07)

P3 completed at 14/14 with 732 items, 189 trinkets, 97 cards, 50 pills,
34 characters and 104 familiar definitions. Exact reference-slice coverage and
a seeded grant/use runtime sweep pass. The validator's only 17 errors are the
17 missing P4 files. The audit found that older item files had been counted as
done despite omitting 134 entries, so future content phases must validate
registry counts and reference coverage rather than file presence alone.

Andre requested that Kimi agents not be used after two Kimi attempts returned
only reconnaissance. Continue P4 in the main thread or with explicitly bounded
standard workers.

### P4 completion checkpoint (2026-08-07)

P4 completed at 17/17 using the frozen `docs/reference/roster.json`: 208 enemies,
80 bosses, 500 rooms, 57 floors, 45 challenges and 637 achievements. Content
validation passes with all 63 scripts loaded, smoke passes 27/27, and a 20-run
balance sample passes without exceptions. `tools/state.mjs` now selects P6;
P5 was already complete. The remaining local ship assets are `README.md`,
`og-image.png`, and `shots/card.png`.

### P6 completion checkpoint (2026-08-07)

P6 completed at 6/6. `README.md` documents play, controls, local serving, gates,
structure and credits. `tools/card-shot.js` generated the real-game 1000×525
catalog image and 1200×630 social image. The full validator and 27/27 smoke suite
pass; the release balance gate passes 200/200 runs with no exceptions. The public
repository and Pages deployment are live at `AndreNijman/isuck`, and games-site
commit `b5b983b` adds the verified live catalog card. All phases are complete.

### Post-release gameplay repair (2026-08-07)

The original smoke test skipped navigation by calling `enterRoom()` directly,
so it failed to detect that generated floors had no doors and the door trigger
was unreachable from the player's collision boundary. Commits `5b0f5df` and
`b653444` add reciprocal floor graph doors, reachable transitions, full-room
camera fitting and accurate `run.roomIndex`. Smoke now passes 31/31 with a real
keyboard-driven door crossing; a separate sweep generated 1,140 floors and
verified 10,446 rooms. The `isaac.andrenijman.com` code-side setup is complete;
Cloudflare still needs a DNS-only `isaac` CNAME to `andrenijman.github.io`.

## What the first interruption taught us

The session hosting the first P1/P3/P4 dispatch exited while all three were in
flight. Two observations worth keeping:

1. **`resumeFromRunId` is session-scoped.** Once the session is gone, the agent
   result cache is gone with it, and the run IDs above are only useful as a
   paper trail. The durable resume path is the one this project was built around:
   `node tools/state.mjs` → recompute the gap list from disk → re-invoke the
   **script path** (which does persist) with a fresh `args.missing`.
2. **Files on disk are the real checkpoint, not commits.** `js/engine/ctx.js` and
   `js/data/familiars.js` were still uncommitted when the session died and
   survived anyway, and the next session picked them up automatically because
   `state.mjs` derives status from the filesystem. Commits are for history; disk
   is for durability. This is why no phase is allowed to hold results in memory
   and write them "at the end" — every agent writes its own file as it finishes,
   so an interruption costs only the agents that were still mid-write.

Script paths are relative to:
`/var/home/andre/.claude/projects/-var-home-andre-Projects-isuck/a3d73950-d367-4d66-9bb4-0cede11c467d/`

## Re-dispatching a phase from scratch

```bash
node tools/state.mjs --json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  const st=JSON.parse(s); console.log(JSON.stringify({missing: st.missingByPhase.P1}))})'
```

Then invoke the phase script with that `args`. If the script file is gone (a new
machine, a cleared session dir), the phase prompts are reproducible from
`ARCHITECTURE.md` + `docs/ENGINE-API.md` + `docs/FILE-PLAN.json`, which is why
those three are committed and frozen.

## Phase order and why

- **P1 (engine) and P3 (collectible content) ran concurrently.** Content data
  references the engine only by the frozen hook/flag/pool vocabulary, never by
  reaching into engine internals, so neither phase blocks the other.
- **P4 (world content) needs a canonical enemy/boss roster first**, because room
  templates reference enemies by id. That roster is generated as a barrier stage
  inside the P4 script, then the enemy/boss/room agents fan out against it —
  the same trick as the pre-generated collectible id slices in
  `docs/reference/slices/`.
- **P2 (render + UI) runs after P1**, because sprite and HUD code reads the
  entity and run shapes the engine actually produced.
- **P5 (gates) and P6 (ship) are last**, and the gates must pass before the deploy
  steps are marked done in `BUILD_STATE.json`.
