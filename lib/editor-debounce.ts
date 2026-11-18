/**
 * Trailing debounce with a cheap dirty flag. `markDirty()` is O(1) and is called on every
 * document-changing transaction; the expensive work (`run`, e.g. editor.getJSON()) only runs once
 * the user pauses for `waitMs`, or when `flush()` is called (blur, save, unload).
 */
export type TimerApi = {
  setTimeout: (fn: () => void, ms: number) => unknown
  clearTimeout: (id: unknown) => void
}

const realTimers: TimerApi = {
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (id) => globalThis.clearTimeout(id as ReturnType<typeof setTimeout>),
}

export function createDirtyDebouncer(
  run: () => void,
  waitMs: number,
  timers: TimerApi = realTimers,
) {
  let dirty = false
  let timer: unknown = null

  const execute = () => {
    timer = null
    if (!dirty) return
    dirty = false
    run()
  }

  return {
    markDirty() {
      dirty = true
      if (timer !== null) timers.clearTimeout(timer)
      timer = timers.setTimeout(execute, waitMs)
    },
    /** Runs immediately if dirty. */
    flush() {
      if (timer !== null) {
        timers.clearTimeout(timer)
        timer = null
      }
      execute()
    },
    cancel() {
      if (timer !== null) timers.clearTimeout(timer)
      timer = null
      dirty = false
    },
    isDirty: () => dirty,
  }
}
