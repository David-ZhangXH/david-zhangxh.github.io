// Desk world state machine. Pure logic — no DOM, no three.js.
export const HOTSPOTS = new Set(['monitor', 'handheld', 'tray', 'frame', 'mug', 'notes', 'musicbox', 'plant', 'keyboard'])

export function createDeskState() {
  let mode = 'intro'
  let hotspot = null
  const subs = new Set()
  const emit = () => { const st = get(); for (const fn of subs) fn(st) }
  const get = () => ({ mode, hotspot })

  return {
    get,
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn) },
    finishIntro() { if (mode === 'intro') { mode = 'idle'; emit() } },
    skipIntro() { this.finishIntro() },
    focus(id) {
      if (mode === 'intro' || !HOTSPOTS.has(id)) return
      mode = 'focus'; hotspot = id; emit()
    },
    close() {
      if (mode !== 'focus') return
      mode = 'idle'; hotspot = null; emit()
    }
  }
}
