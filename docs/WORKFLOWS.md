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

| Phase | Script | Run ID | Agents |
|---|---|---|---|
| P1 core + engine | `workflows/scripts/isuck-p1-engine-wf_f8c7aca3-81f.js` | `wf_f8c7aca3-81f` | 13 |
| P3 collectibles | `workflows/scripts/isuck-p3-collectibles-wf_846d5f1f-9a8.js` | `wf_846d5f1f-9a8` | 14 |

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
