# Design

## Context

The mod runs inside Claude Code as a plugin hooks module, hot-reloaded in the session. It has no DOM and no Node access. File reads go through the engine's file interface. Project layout and behavior are in `proposal.md` (Why, What Changes) and `specs/task-progress-display/spec.md` (requirements).

OpenSpec stores each change at `openspec/changes/<name>/` with `tasks.md` holding the checkbox list. The apply workflow checks boxes off as work finishes, so `tasks.md` is the only live source of progress.

## Goals / Non-Goals

**Goals:**
- Progress is current without restarting the session.
- One small module, no build step beyond the engine's own loading.
- Works with the checkbox format the apply workflow already writes.

**Non-Goals:**
- Parsing task text beyond the checkbox marker (no section grouping, no due dates).
- Tracking progress across several changes at once.
- Any write to OpenSpec files.

## Decisions

**Single source file per change.** Progress is computed only from `openspec/changes/<name>/tasks.md`. Alternative: also read `.openspec.yaml` or spec deltas. Rejected: the spec requires checkbox counts only, and extra files add failure modes.

**Plain-line parser.** A line counts as a task when it starts, after optional indentation, with `- [` and a closing `]` (any content). The box is done when its content, trimmed of spaces, is `x` or `X`, matching the apply workflow's rule. Every other content (`[ ]`, `[~]`, `[-]`, `[]`) is unfinished. Indentation is ignored, so nested boxes count as tasks. Alternative: a markdown AST parser. Rejected: a line match is enough for a checkbox list and avoids shipping a parser into the mod.

**Recompute on events, not on a fast poll.** Triggers are `session.start`, `tool.call` where the tool is Edit or Write and the target is the tracked `tasks.md`, every `tool.call` for Bash, and `turn.complete`. No timer: all writes that matter go through Claude's tools. Alternative: poll every second. Rejected: it reads the file constantly for no gain, since edits come through the tool call path.

**Tracked change chosen by directory count.** One change directory under `openspec/changes/` is tracked automatically. Several require the person to pick one with the pane command, and until then nothing is tracked. Alternative: track the most recently modified change. Rejected: it changes silently when an unrelated file is touched, which is hard to notice. The "no tracked change" state is explicit instead.

**Selected change stored in `$.state`.** The pane command sets the selected change name in `$.state`, so it survives hot reloads within the session. Declared in the types contract as `taskProgress.selectedChange: string | null`. Alternative: `$.store`. Rejected: the selection is per session, and `$.store` persists across sessions.

**Progress held in an atom.** The computed counts live in `atom(ref, initial)`. The status line, band, and pane read them while drawing. Recompute writes the atom and the readers redraw. This follows the pattern in the plugin-authoring examples.

**Pane opened by command.** `$.command.register({ name: 'task-progress', ... })` in `session.start`, answered by a `command.run` hook that opens the pane. A pane opened by the person seats at any width, which avoids the 144-column rule for unasked panes.

## Risks / Trade-offs

- **[Checkbox format drifts]** If the apply workflow writes a different marker, counts go to zero silently. Mitigation: the "no tasks" state appears when zero boxes are found, and the spec requires a visible state rather than a silent 0%. The apply skill must keep the `- [ ]` / `- [x]` format.
- **[Missed edits]** Edits made outside the Edit/Write tools (for example, a shell `sed`) do not fire the trigger. Mitigation: none for edits made outside Claude Code, which are out of scope. Shell edits made through Claude are caught by the Bash trigger.
- **[Hot reload resets module variables]** The module's own variables restart on reload. Mitigation: selection and counts are held in `$.state` and the atom, and the reload triggers a fresh recompute on `session.start`.
- **[Path matching]** Matching the edited file to the tracked change is by path suffix (`<name>/tasks.md`). A different change with the same `tasks.md` path would match. Mitigation: match on the full resolved path under `openspec/changes/<tracked>/`.

## Migration Plan

Not applicable. The mod is new and lives outside the repo at `C:\Users\Liam\.claude\dev-mods\0fd11e8a-20a6-495e-aa47-15c6c6d75ebb\<mod-name>\`. Rollback is removing that folder, which unloads it on the next reload.
