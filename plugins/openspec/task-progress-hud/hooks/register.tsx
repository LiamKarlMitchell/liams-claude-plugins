import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { ProgressView } from '../types'
import {
  bandText,
  barCells,
  isTrackedFile,
  parseTasks,
  resolveTracked,
  statusText,
  summarize,
} from './progress'

const PANE = 'task-progress'
const CHANGES = 'openspec/changes'
// Temporarily off: the status line below the prompt. Set to true to restore it.
const SHOW_STATUS = false

// Tailwind-style palette: readable on dark and light terminals.
const COLOR = {
  name: '#a78bfa', // change name
  active: '#38bdf8', // bar and percent while in progress
  complete: '#4ade80', // bar, percent and done items at 100%
  done: '#4ade80', // done count and checked boxes
  open: '#fbbf24', // remaining count and open boxes
  track: '#475569', // empty bar cells
  muted: '#94a3b8', // secondary text
  alarm: '#f87171', // missing tasks.md
}

const progress = atom(
  { plugin: 'task-progress-hud', key: 'progress' } as const,
  { kind: 'none' } as ProgressView,
)
const selected = atom(
  { plugin: 'task-progress-hud', key: 'selectedChange' } as const,
  null as string | null,
)

async function listChanges($: EngineInterface): Promise<string[]> {
  try {
    const entries = await $.fs.list(CHANGES)

    return entries
      .filter(entry => entry.kind === 'dir' && entry.name !== 'archive')
      .map(entry => entry.name)
      .sort()
  } catch {
    return []
  }
}

async function refresh($: EngineInterface): Promise<void> {
  const names = await listChanges($)
  const choice = resolveTracked(names, await read($, selected))

  let view: ProgressView = { kind: 'none' }

  if (choice !== null && 'names' in choice) {
    view = { kind: 'choose', names: choice.names }
  } else if (choice !== null) {
    try {
      const items = parseTasks(
        await $.fs.read(`${CHANGES}/${choice.change}/tasks.md`),
      )

      view = { kind: 'tracked', change: choice.change, items, ...summarize(items) }
    } catch {
      view = { kind: 'missing', change: choice.change }
    }
  }

  // Skip the write when nothing changed, so an idle poll does not redraw.
  const previous = await read($, progress)
  if (JSON.stringify(previous) === JSON.stringify(view)) return

  await update($, progress, () => view)
  $.ui.status(SHOW_STATUS ? statusText(view) : undefined)
}

// Whether an edited file is the tracked change's tasks.md. The real paths
// are compared when the tracked file exists; otherwise the normalized path
// must end in the tracked location.
async function isTrackedTasks($: EngineInterface, file: string): Promise<boolean> {
  const view = await read($, progress)
  if (view.kind !== 'tracked' && view.kind !== 'missing') return false

  const tracked = `${CHANGES}/${view.change}/tasks.md`

  try {
    const want = await $.fs.stat(tracked, { resolve: true })
    const got = await $.fs.stat(file, { resolve: true })

    if (want.realPath !== undefined && got.realPath !== undefined) {
      return want.realPath === got.realPath
    }
  } catch {
    // The tracked file is missing or unreadable: fall back to the path text.
  }

  return isTrackedFile(file, tracked)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'task-progress',
      description: 'Show task progress of an OpenSpec change',
      argumentHint: '[change]',
    })
    await refresh($)

    return next(e)
  })

  on('command.run', { command: 'task-progress' }, async ($, e) => {
    const name = e.args.trim()

    if (name !== '') {
      if (!(await listChanges($)).includes(name)) {
        return { text: `No change named ${name}.` }
      }
      await update($, selected, () => name)
    }

    await refresh($)
    await $.ui.open({ id: PANE, title: 'Task progress' })

    const view = await read($, progress)
    const text = bandText(view) ?? 'No change to track.'

    return { text }
  })

  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    const ran = await next(e)

    if (ran.deny === undefined && (await isTrackedTasks($, e.file_path))) {
      await refresh($)
    }

    return ran
  })

  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    const ran = await next(e)

    if (ran.deny === undefined && (await isTrackedTasks($, e.file_path))) {
      await refresh($)
    }

    return ran
  })

  // A shell command may have written tasks.md, and the turn's end catches
  // whatever the model changed. Both refresh; unchanged state is not redrawn.
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)

    if (ran.deny === undefined) await refresh($)

    return ran
  })

  on('turn.complete', async ($, e, next) => {
    await refresh($)

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const view = await read($, progress)

    if (view.kind === 'none' || view.kind === 'choose') return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    // The label opens or closes the pane that /task-progress opens.
    const toggle = (
      <Button
        key="toggle"
        label="Task progress"
        plain
        hover={{ color: COLOR.name, scope: 'task-progress-toggle' }}
        onPress={async () => {
          const isOpen = (await $.ui.panes()).some(pane => pane.id === PANE)

          if (isOpen) await $.ui.close({ id: PANE })
          else await $.ui.open({ id: PANE, title: 'Task progress' })
        }}
      />
    )

    // No tasks.md yet: keep the label so the pane can still be opened.
    if (view.kind === 'missing') {
      return <Box>{toggle}</Box>
    }

    if (view.total === 0) {
      return (
        <Box>
          {toggle}
          <Text color={COLOR.muted}>  {view.change}: no tasks</Text>
        </Box>
      )
    }

    const { filled, empty } = barCells(view.percent)
    const tone = view.percent === 100 ? COLOR.complete : COLOR.active
    const left = view.total - view.done

    return (
      <Box>
        {toggle}
        <Text>{'  '}</Text>
        <Text color={tone}>{filled}</Text>
        <Text color={COLOR.track}>{empty}</Text>
        <Text color={tone} bold>
          {' '}
          {view.percent}%
        </Text>
        <Text color={COLOR.done}>
          {'  '}
          {view.done} done
        </Text>
        <Text color={COLOR.muted}>, </Text>
        <Text color={COLOR.open}>{left} left</Text>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const view = await read($, progress)

    if (view.kind === 'none') {
      return (
        <Box>
          <Text color={COLOR.muted}>No OpenSpec change to track.</Text>
        </Box>
      )
    }

    if (view.kind === 'choose') {
      return (
        <Box flexDirection="column">
          <Text color={COLOR.open}>Several changes. Run /task-progress with one name:</Text>
          {view.names.map(name => (
            <Text color={COLOR.name}>{name}</Text>
          ))}
        </Box>
      )
    }

    if (view.kind === 'missing') {
      return (
        <Box>
          <Text color={COLOR.muted}>{bandText(view)}</Text>
        </Box>
      )
    }

    if (view.total === 0) {
      return (
        <Box>
          <Text color={COLOR.muted}>{view.change}: no tasks</Text>
        </Box>
      )
    }

    const { filled, empty } = barCells(view.percent)
    const tone = view.percent === 100 ? COLOR.complete : COLOR.active
    const left = view.total - view.done

    return (
      <Box flexDirection="column">
        <Box>
          <Text color={COLOR.name} bold>
            {view.change}{' '}
          </Text>
          <Text color={tone}>{filled}</Text>
          <Text color={COLOR.track}>{empty}</Text>
          <Text color={tone} bold>
            {' '}
            {view.percent}%
          </Text>
          <Text color={COLOR.done}>
            {'  '}
            {view.done} done
          </Text>
          <Text color={COLOR.muted}>, </Text>
          <Text color={COLOR.open}>{left} left</Text>
        </Box>
        {view.items.map(item => (
          <Box>
            <Text color={item.done ? COLOR.done : COLOR.open}>
              {item.done ? '[x]' : '[ ]'}{' '}
            </Text>
            <Text color={item.done ? COLOR.muted : undefined}>{item.text}</Text>
          </Box>
        ))}
      </Box>
    )
  })
}
