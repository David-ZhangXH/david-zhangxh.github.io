import { describe, it, expect } from 'vitest'
import { createGalaxyState } from '../src/galaxy/state.js'

describe('createGalaxyState', () => {
  it('starts drifting, focuses known bodies, closes back to drift', () => {
    const s = createGalaxyState(['a', 'b', 'secret'])
    expect(s.get()).toEqual({ mode: 'drift', body: null })
    s.focus('a')
    expect(s.get()).toEqual({ mode: 'focus', body: 'a' })
    s.focus('secret')
    expect(s.get().body).toBe('secret')
    s.close()
    expect(s.get()).toEqual({ mode: 'drift', body: null })
  })
  it('ignores unknown bodies', () => {
    const s = createGalaxyState(['a'])
    s.focus('zzz')
    expect(s.get().mode).toBe('drift')
  })
  it('notifies subscribers', () => {
    const s = createGalaxyState(['a'])
    const seen = []
    s.subscribe(st => seen.push(st.mode))
    s.focus('a'); s.close()
    expect(seen).toEqual(['focus', 'drift'])
  })
})
