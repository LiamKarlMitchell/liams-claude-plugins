# task-progress-display Specification

## Purpose

Shows how much of an OpenSpec change's task list is complete while the change is worked on inside a Claude Code session, so the person can see remaining work without opening the file.

## Requirements

### Requirement: Progress is derived from tasks.md checkboxes
The system SHALL compute progress for a change from every checkbox line in that change's `tasks.md`. A box is done when its content, ignoring spaces, is `x` or `X`. Every other box content, including empty, `~`, and `-`, is remaining. Nested checkboxes are counted.

#### Scenario: Mixed checkboxes
- **WHEN** `tasks.md` contains 4 checked and 7 unchecked checkboxes
- **THEN** the system reports 4 done, 11 total, 7 remaining, and 36% complete

#### Scenario: Spacing variants of a checked box
- **WHEN** a box is written as `- [x]`, `- [X]`, or `- [ x]`
- **THEN** it is counted as done

#### Scenario: Other markers are unfinished
- **WHEN** a box is written as `- [~]`, `- [-]`, or `- []`
- **THEN** it is counted as remaining

#### Scenario: Nested checkboxes are counted
- **WHEN** a checkbox is indented under another checkbox
- **THEN** it is counted as its own task

#### Scenario: Non-checkbox lines are ignored
- **WHEN** `tasks.md` contains headings, prose, or bullets without a checkbox
- **THEN** those lines do not affect the counts

### Requirement: Percent complete is rounded to a whole number
The system SHALL report percent complete as `done / total` multiplied by 100 and rounded to the nearest whole number.

#### Scenario: Rounding
- **WHEN** 1 of 3 tasks are done
- **THEN** the system reports 33% complete

#### Scenario: Zero tasks
- **WHEN** `tasks.md` contains no checkboxes
- **THEN** the system reports "no tasks" and does not report a percentage

### Requirement: Status line shows done count, total, and percent
The system SHALL show a status line entry in the form `openspec <done>/<total> - <percent>%` for the change being tracked.

#### Scenario: Status line while a change is tracked
- **WHEN** a change with 4 of 11 tasks done is tracked
- **THEN** the status line shows `openspec 4/11 - 36%`

#### Scenario: No tracked change
- **WHEN** no change exists under `openspec/changes/`
- **THEN** the status line entry is cleared

### Requirement: Band above the prompt shows a progress bar and remaining count
The system SHALL show a band above the prompt with a bar, the percent complete, the done count, and the remaining count.

#### Scenario: Band content
- **WHEN** a change with 4 of 11 tasks done is tracked
- **THEN** the band shows a bar at 36%, "4 done", and "7 left"

### Requirement: Pane lists each task with its state
The system SHALL provide a pane, opened by a slash command, that lists every checkbox in the tracked change's `tasks.md` with its checked or unchecked state.

#### Scenario: Pane opened with a change name
- **WHEN** the person runs the pane command with a change name
- **THEN** the pane shows that change's progress and task list

#### Scenario: Pane opened without a change name and several changes exist
- **WHEN** the person runs the pane command without a name and more than one change exists under `openspec/changes/`
- **THEN** the pane asks which change to show and lists the available names

### Requirement: Tracked change is selected deterministically
The system SHALL track the only change under `openspec/changes/` when exactly one exists, and SHALL track no change when more than one exists until the person selects one with the pane command.

#### Scenario: Single change
- **WHEN** exactly one change directory exists under `openspec/changes/`
- **THEN** that change is tracked automatically

#### Scenario: Several changes
- **WHEN** more than one change directory exists and the person has not selected one
- **THEN** no change is tracked and the status line entry and band are cleared

### Requirement: Progress refreshes on change
The system SHALL recompute progress at session start, after any Edit or Write call that touches the tracked change's `tasks.md`, after any Bash call, and when a turn ends. Edits made outside Claude Code are not tracked.

#### Scenario: Edit to tasks.md
- **WHEN** a task is checked off in the tracked change's `tasks.md` during a session
- **THEN** the status line, band, and pane reflect the new counts without restarting the session

#### Scenario: Unreadable tasks.md
- **WHEN** the tracked change's `tasks.md` is missing or cannot be read
- **THEN** the status line is cleared, the band shows only its label, the pane says "tasks.md not written yet", and the session keeps running

### Requirement: Read-only access to OpenSpec files
The system MUST NOT write to any file under `openspec/`, including `tasks.md`.

#### Scenario: Progress computation
- **WHEN** progress is computed for any change
- **THEN** no file under `openspec/` is modified
