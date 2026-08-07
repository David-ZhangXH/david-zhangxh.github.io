import { describe, it, expect } from 'vitest'
import { createLock } from '../src/village/lock.js'

describe('createLock', () => {
  it('opens on the right code and reports unlock once', () => {
    let unlocked = 0
    const l = createLock({ code: '0716', onUnlock: () => unlocked++ })
    expect(l.try('1234')).toBe('wrong')
    expect(l.isOpen()).toBe(false)
    expect(l.try('0716')).toBe('open')
    expect(l.isOpen()).toBe(true)
    expect(unlocked).toBe(1)
  })
  it('nudges from the third miss onward', () => {
    const l = createLock({ code: '0716' })
    expect(l.try('0000')).toBe('wrong')
    expect(l.try('1111')).toBe('wrong')
    expect(l.try('2222')).toBe('nudge')
    expect(l.try('3333')).toBe('nudge')
    expect(l.try('0716')).toBe('open')
  })
})
