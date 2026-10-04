# Tasks

## 1. Mod scaffold

- [x] 1.1 Create `C:\Users\Liam\.claude\dev-mods\0fd11e8a-20a6-495e-aa47-15c6c6d75ebb\task-progress-hud\` with `.claude-plugin/plugin.json` (name, version `0.1.0`, one-line description) and `hooks/hooks.json` listing `./register.tsx`; verify `claude plugin validate` passes on the folder with an empty `register` function
- [x] 1.2 Add `types/index.d.ts` declaring `interface PluginState` with `taskProgress.selectedChange: string | null`, reference it from `plugin.json`, and verify `tsc -p` type-checks the folder against the engine's `claude-code.d.ts`

## 2. Progress parsing

- [x] 2.1 Implement the checkbox parser per design.md (line match, done = content trimmed is `x` or `X`) and verify a unit test covers the spec scenarios for mixed boxes, spacing variants, other markers, and nested boxes
- [x] 2.2 Implement the percent calculation (rounded `done / total`) and the zero-task state, and verify unit tests cover rounding (1 of 3 gives 33%) and zero tasks gives "no tasks" with no percentage
- [x] 2.3 Implement change discovery under `openspec/changes/`: one directory tracks automatically, several track nothing until a selection is made, and verify unit tests cover zero, one, and several directories

## 3. Live UI

- [x] 3.1 Store computed counts in an atom and draw the status line entry `openspec <done>/<total> - <percent>%` through `$.ui.status`, clearing it when no change is tracked, and verify the status text for 4 of 11 reads `openspec 4/11 - 36%`
- [x] 3.2 Add the band above the prompt (`ui.render` on `AbovePrompt`) with a bar, percent, "N done", and "M left", and verify the band renders the 4 of 11 example with a bar at 36%
- [x] 3.3 Add the pane (`$.ui.open`, drawn by `ui.render` on `Pane`) listing each task with its state, and verify the pane shows the task list for the tracked change

## 4. Commands and refresh

- [ ] 4.1 Register the `task-progress` command in `session.start` and answer `command.run` by opening the pane, taking an optional change name that sets `taskProgress.selectedChange` in `$.state`, and verify the no-name case with several changes asks for a name
- [ ] 4.2 Recompute progress on `session.start`, on `tool.call` for Edit or Write whose target is the tracked change's `tasks.md` (full resolved path match), after any Bash call, and at `turn.complete`, and verify an edit to `tasks.md` updates the status line without a session restart
- [x] 4.3 Handle a missing or unreadable `tasks.md` by clearing the status line, showing only the band label, saying "tasks.md not written yet" in the pane, and verify the session keeps running with that state

## 5. Integration checks

- [ ] 5.1 Run `claude plugin test` on the mod folder with the tests from groups 2 to 4 and verify all pass
- [ ] 5.2 Enable hot reloading for this session, check off one task in `openspec/changes/task-progress-hud/tasks.md` in a scratch copy, and verify the status line, band, and pane agree with the file
- [ ] 5.3 Confirm no file under `I:\openspec\openspec\` is modified by the mod (compare file hashes before and after a session with the mod loaded) and verify the spec's read-only requirement holds
