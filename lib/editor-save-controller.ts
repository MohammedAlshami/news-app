/**
 * Autosave state machine for the article form (framework-free so it can be unit tested).
 *
 * - `markDirty()` is O(1) (called per keystroke); the value is only read/serialised when a save
 *   actually starts (`getValue`/`serialize`).
 * - Edits that arrive while a save is in flight are never marked as saved: after success the
 *   controller compares the version captured at send time with the current one and re-saves.
 * - Transport failures (thrown) and `retryable` results are retried with backoff; validation-style
 *   failures (`retryable: false`) stop and wait for the next edit. A `conflict` stops everything.
 */
import type { TimerApi } from "@/lib/editor-debounce"

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error" | "conflict"

export type SaveResult =
  | { ok: true }
  | { ok: false; error: string; retryable?: boolean; conflict?: boolean }

export type SaveControllerOptions<T> = {
  getValue: () => T
  serialize: (value: T) => string
  save: (value: T) => Promise<SaveResult>
  /** Snapshot of what the server currently holds. */
  initialSnapshot: string
  debounceMs?: number
  retryDelaysMs?: number[]
  timers?: TimerApi
  onStatus?: (status: SaveStatus, error: string | null) => void
  /** Called right before each network attempt with the value being sent (e.g. write local draft). */
  onBeforeSave?: (value: T) => void
  /** Called after a successful save with whether newer edits are still unsaved. */
  onSaved?: (info: { stillDirty: boolean }) => void
}

const DEFAULT_RETRY_DELAYS = [2000, 5000, 15000, 30000]

export function createSaveController<T>(opts: SaveControllerOptions<T>) {
  const debounceMs = opts.debounceMs ?? 1500
  const retryDelays = opts.retryDelaysMs ?? DEFAULT_RETRY_DELAYS
  const timers: TimerApi = opts.timers ?? {
    setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
    clearTimeout: (id) => globalThis.clearTimeout(id as ReturnType<typeof setTimeout>),
  }

  let savedSnapshot = opts.initialSnapshot
  let version = 0
  let inFlight: Promise<void> | null = null
  let timer: unknown = null
  let attempt = 0
  let status: SaveStatus = "idle"
  let error: string | null = null
  let disposed = false

  const setStatus = (next: SaveStatus, err: string | null = null) => {
    status = next
    error = err
    opts.onStatus?.(next, err)
  }

  const clearTimer = () => {
    if (timer !== null) timers.clearTimeout(timer)
    timer = null
  }

  const schedule = (ms: number) => {
    clearTimer()
    timer = timers.setTimeout(() => {
      timer = null
      void run()
    }, ms)
  }

  async function run(): Promise<void> {
    if (disposed || status === "conflict") return
    if (inFlight) return inFlight
    const p = doSave().finally(() => {
      inFlight = null
    })
    inFlight = p
    return p
  }

  async function doSave(): Promise<void> {
    const sentVersion = version
    const value = opts.getValue()
    const snapshot = opts.serialize(value)
    if (snapshot === savedSnapshot) {
      attempt = 0
      if (status !== "idle") setStatus(sentVersion === version ? "saved" : "pending")
      return
    }

    setStatus("saving")
    try {
      opts.onBeforeSave?.(value)
    } catch {
      // draft backup is best effort
    }

    let result: SaveResult
    try {
      result = await opts.save(value)
    } catch (e) {
      result = {
        ok: false,
        error: e instanceof Error && e.message ? e.message : "تعذر حفظ المقال.",
        retryable: true,
      }
    }

    if (disposed) return

    if (result.ok) {
      savedSnapshot = snapshot
      attempt = 0
      const stillDirty = version !== sentVersion
      opts.onSaved?.({ stillDirty })
      if (stillDirty) {
        // Edits arrived mid-flight: they are NOT saved. Go again promptly.
        setStatus("pending")
        schedule(0)
      } else {
        setStatus("saved")
      }
      return
    }

    if (result.conflict) {
      clearTimer()
      setStatus("conflict", result.error)
      return
    }

    setStatus("error", result.error)
    if (result.retryable !== false) {
      const delay = retryDelays[Math.min(attempt, retryDelays.length - 1)]
      attempt += 1
      schedule(delay)
    }
  }

  return {
    /** O(1); call on every document/field change. */
    markDirty() {
      if (disposed || status === "conflict") return
      version += 1
      attempt = 0
      if (status !== "saving") setStatus("pending")
      schedule(debounceMs)
    },
    /** Save now (used on blur/hidden/unmount/link click). Resolves when the attempt settles. */
    async flush(): Promise<boolean> {
      if (disposed) return true
      clearTimer()
      if (inFlight) await inFlight
      if (status === "conflict") return false
      // A mid-flight edit schedules a follow-up save; chase it (bounded) so callers get a true answer.
      const current = (): SaveStatus => status
      for (let i = 0; i < 3 && this.hasUnsaved() && current() !== "conflict"; i++) {
        clearTimer()
        await run()
        if (current() === "error") break
      }
      return !this.hasUnsaved()
    },
    /** True while there is anything the server does not have (dirty, saving, or failed). */
    hasUnsaved(): boolean {
      if (status === "saving" || status === "error" || status === "conflict") return true
      if (status === "pending") return true
      return false
    },
    getStatus: () => ({ status, error }),
    /** Mark the current server state (e.g. after restoring a draft decision). */
    resetSaved(snapshot: string) {
      savedSnapshot = snapshot
    },
    dispose() {
      disposed = true
      clearTimer()
    },
  }
}
