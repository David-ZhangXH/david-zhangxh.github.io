// The handheld's passcode lock. The answer hides in the photo frame.
export const DEFAULT_CODE = '0716'
export function createLock({ code = DEFAULT_CODE, onUnlock } = {}) {
  let open = false
  let misses = 0
  return {
    isOpen: () => open,
    misses: () => misses,
    try(input) {
      if (open) return 'open'
      if (String(input) === code) {
        open = true
        onUnlock?.()
        return 'open'
      }
      misses++
      return misses >= 3 ? 'nudge' : 'wrong'
    }
  }
}
