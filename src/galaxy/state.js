// Galaxy state: you arrive already drifting. Pure logic.
export function createGalaxyState(ids) {
  const valid = new Set(ids)
  let mode = 'drift'
  let body = null
  const subs = new Set()
  const get = () => ({ mode, body })
  const emit = () => { const st = get(); for (const fn of subs) fn(st) }
  return {
    get,
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn) },
    focus(id) { if (!valid.has(id)) return; mode = 'focus'; body = id; emit() },
    close() { if (mode !== 'focus') return; mode = 'drift'; body = null; emit() }
  }
}
