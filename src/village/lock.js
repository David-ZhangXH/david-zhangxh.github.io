// The handheld's passcode lock. The answer hides in the photo frame.
export function createLock({ code = '0716', onUnlock } = {}) {
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
