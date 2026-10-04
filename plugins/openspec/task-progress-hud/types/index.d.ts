export type TaskItem = { text: string; done: boolean }

export type ProgressView =
  | { kind: 'none' }
  | { kind: 'choose'; names: string[] }
  | { kind: 'missing'; change: string }
  | {
      kind: 'tracked'
      change: string
      items: TaskItem[]
      done: number
      total: number
      percent: number
    }

declare module 'claude-code' {
  interface PluginState {
    'task-progress-hud': {
      progress: ProgressView
      selectedChange: string | null
    }
  }
}
