import type { ProgressView, TaskItem } from '../types'

// A checkbox line: "- [" then box content of spaces, x, X, ~ or -, then "]"
// followed by a space or the end of the line. Prose such as "- [link](url)"
// does not match.
const BOX = /^\s*- \[([ xX~-]*)\](?=\s|$)/

export function parseTasks(markdown: string): TaskItem[] {
  const items: TaskItem[] = []

  for (const line of markdown.split(/\r?\n/)) {
    const box = BOX.exec(line)
    if (box === null) continue

    const mark = box[1]!.replace(/ /g, '')
    items.push({
      text: line.slice(box[0].length).trim(),
      done: mark === 'x' || mark === 'X',
    })
  }

  return items
}

export function summarize(items: TaskItem[]): {
  done: number
  total: number
  percent: number
} {
  const done = items.filter(item => item.done).length
  const total = items.length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)

  return { done, total, percent }
}

// The change to show: the selected one when it still exists, else the only
// change, else a choice among several, else none.
export function resolveTracked(
  names: string[],
  selected: string | null,
): { change: string } | { names: string[] } | null {
  if (selected !== null && names.includes(selected)) return { change: selected }
  if (names.length === 1) return { change: names[0]! }
  if (names.length > 1) return { names }

  return null
}

// Whether an edited path is the tracked file. Separators and case are
// ignored; a relative tracked path matches an absolute edited path that ends
// in it, on a path boundary.
export function isTrackedFile(edited: string, tracked: string): boolean {
  const want = tracked.replace(/\\/g, '/').toLowerCase()
  const got = edited.replace(/\\/g, '/').toLowerCase()

  return got === want || got.endsWith(`/${want}`)
}

export function statusText(view: ProgressView): string | undefined {
  if (view.kind === 'none' || view.kind === 'choose') return undefined
  // No tasks.md yet (planning is still in progress): nothing to show below the prompt.
  if (view.kind === 'missing') return undefined
  if (view.total === 0) return 'openspec: no tasks'

  return `openspec ${view.done}/${view.total} - ${view.percent}%`
}

// Ten cells: filled for the done share, empty for the rest.
export function barCells(percent: number): { filled: string; empty: string } {
  const filled = Math.round(percent / 10)

  return { filled: '█'.repeat(filled), empty: '░'.repeat(10 - filled) }
}

export function bandText(view: ProgressView): string | undefined {
  if (view.kind === 'none' || view.kind === 'choose') return undefined
  if (view.kind === 'missing') return `${view.change}: tasks.md not written yet`
  if (view.total === 0) return `${view.change}: no tasks`

  const { filled, empty } = barCells(view.percent)
  const left = view.total - view.done

  return `${view.change} ${filled}${empty} ${view.percent}%  ${view.done} done, ${left} left`
}
