# Proposal

## Why

While an OpenSpec change is being applied, the only way to see how much work is left is to open its `tasks.md` and count checkboxes by hand. A live readout inside Claude Code shows completed tasks, percent complete, and tasks remaining without leaving the session.

## What Changes

- Add a Claude Code mod (hooks module) that reads the active change's `tasks.md` and shows progress as:
  - a status line entry: done/total and percent, for example `openspec 4/11 - 36%`
  - a band above the prompt: a bar, percent, and `N done, M left`
  - a pane (opened by a command) listing each task with its checked state
- Progress is computed from every checkbox in `tasks.md` (`- [ ]` remaining, `- [x]` done), including nested ones.
- Percent is `done / total`, rounded to a whole number. When `total` is zero, the UI shows "no tasks" instead of a percentage.
- Progress refreshes on session start, after any Edit or Write that touches the change's `tasks.md`, after any Bash call, and when a turn ends.
- Which change is shown: if exactly one change exists under `openspec/changes/`, it is used. If several exist, the pane command takes a change name. If none exist, the UI shows nothing.
- **Not in scope**: editing `tasks.md`, marking tasks done, changing OpenSpec CLI behavior, or modifying Claude Code itself.

## Capabilities

### New Capabilities
- `task-progress-display`: Shows the completion state of an OpenSpec change's tasks (done count, total, percent, remaining) inside a Claude Code session, derived from the change's `tasks.md`.

### Modified Capabilities
- None. No existing capability in `openspec/specs/` covers this behavior. The project has no specs yet.

## Impact

- New plugin folder at `C:\Users\Liam\.claude\dev-mods\0fd11e8a-20a6-495e-aa47-15c6c6d75ebb\<mod-name>\`, outside this repository. It contains the plugin manifest, the hooks module, and a types contract if state is stored.
- Reads `openspec/changes/<name>/tasks.md` in `I:\openspec`. No writes to OpenSpec files.
- Depends on the Claude Code plugin hooks API (hot reloading in the session). Behavior depends on the checkbox format `- [ ]` / `- [x]` being used in `tasks.md`, which the apply workflow must keep.
