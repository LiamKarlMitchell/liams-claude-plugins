import { test, expect } from 'claude-code/testing'

import {
  bandText,
  isTrackedFile,
  parseTasks,
  resolveTracked,
  statusText,
  summarize,
} from './progress'

const SAMPLE = [
  '# Tasks',
  '',
  '## 1. Setup',
  '',
  '- [x] 1.1 Create folder',
  '- [X] 1.2 Add manifest',
  '- [ x] 1.3 Spacing variant',
  '- [ ] 1.4 Open task',
  '- [~] 1.5 Partial marker',
  '- [-] 1.6 Deferred marker',
  '- [] 1.7 Empty box',
  '  - [x] 1.8 Nested done',
  '  - [ ] 1.9 Nested open',
  '- [link](https://example.com) is prose, not a task',
  'Plain prose line.',
].join('\n')

test('counts every checkbox, nested included, and ignores prose', async () => {
  const items = parseTasks(SAMPLE)

  expect(items.length).toBe(9)
  expect(items.filter(item => item.done).length).toBe(4)
})

test('a box is done only when its content is x or X ignoring spaces', async () => {
  const items = parseTasks(SAMPLE)

  expect(items.map(item => item.done)).toEqual([
    true,
    true,
    true,
    false,
    false,
    false,
    false,
    true,
    false,
  ])
})

test('task text excludes the checkbox', async () => {
  const items = parseTasks('- [ ] 2.1 Implement the parser')

  expect(items[0]!.text).toBe('2.1 Implement the parser')
})

test('percent rounds done over total', async () => {
  const third = summarize(parseTasks('- [x] a\n- [ ] b\n- [ ] c'))
  const band = summarize(parseTasks(Array(11).fill('- [ ] t').join('\n')))

  expect(third.percent).toBe(33)
  expect(band.total).toBe(11)
  expect(summarize(parseTasks('- [x] a\n- [ ] b\n- [ ] c\n- [ ] d')).percent).toBe(25)
})

test('zero tasks report no percentage and a no-tasks status', async () => {
  const none = summarize(parseTasks('# Tasks\n\nNo boxes here.'))

  expect(none.total).toBe(0)
  expect(
    statusText({ kind: 'tracked', change: 'c', items: [], ...none }),
  ).toBe('openspec: no tasks')
})

test('status line reads done, total and percent', async () => {
  const items = parseTasks(
    Array(4).fill('- [x] done').concat(Array(7).fill('- [ ] open')).join('\n'),
  )
  const view = { kind: 'tracked' as const, change: 'c', items, ...summarize(items) }

  expect(statusText(view)).toBe('openspec 4/11 - 36%')
  expect(bandText(view)).toBe('c ████░░░░░░ 36%  4 done, 7 left')
})

test('missing tasks.md clears the status line and says it is not written yet', async () => {
  const view = { kind: 'missing' as const, change: 'c' }

  expect(statusText(view)).toBeUndefined()
  expect(bandText(view)).toBe('c: tasks.md not written yet')
})

test('no tracked change clears the status and band', async () => {
  expect(statusText({ kind: 'none' })).toBeUndefined()
  expect(bandText({ kind: 'none' })).toBeUndefined()
})

test('one change is tracked automatically', async () => {
  expect(resolveTracked(['add-auth'], null)).toEqual({ change: 'add-auth' })
})

test('several changes track nothing until one is selected', async () => {
  expect(resolveTracked(['a', 'b'], null)).toEqual({ names: ['a', 'b'] })
  expect(resolveTracked(['a', 'b'], 'b')).toEqual({ change: 'b' })
})

test('no changes track nothing', async () => {
  expect(resolveTracked([], null)).toBeNull()
})

test('a stale selection falls back to the rule for the current names', async () => {
  expect(resolveTracked(['a'], 'gone')).toEqual({ change: 'a' })
})

const TRACKED = 'openspec/changes/task-progress-hud/tasks.md'

test('an absolute edited path matches the tracked relative path', async () => {
  expect(
    isTrackedFile(
      'I:\\openspec\\openspec\\changes\\task-progress-hud\\tasks.md',
      TRACKED,
    ),
  ).toBe(true)
})

test('separators and case do not decide a match', async () => {
  expect(
    isTrackedFile('i:/OpenSpec/openspec/changes/Task-Progress-HUD/tasks.md', TRACKED),
  ).toBe(true)
})

test('another change with a tasks.md is not the tracked file', async () => {
  expect(
    isTrackedFile('I:/openspec/openspec/changes/other/tasks.md', TRACKED),
  ).toBe(false)
})

test('a name that only ends with the tracked path is not a match', async () => {
  expect(
    isTrackedFile('I:/openspec/xopenspec/changes/task-progress-hud/tasks.md', TRACKED),
  ).toBe(false)
})

test('the design, specs and proposal files are not the tracked file', async () => {
  expect(
    isTrackedFile('I:/openspec/openspec/changes/task-progress-hud/design.md', TRACKED),
  ).toBe(false)
})
