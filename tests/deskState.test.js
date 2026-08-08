import { describe, it, expect } from 'vitest'
import { createDeskState, HOTSPOTS } from '../src/desk/state.js'

describe('createDeskState', () => {
  it('starts in intro and reaches idle via finishIntro or skipIntro', () => {
    const s = createDeskState()
    expect(s.get()).toEqual({ mode: 'intro', hotspot: null })
    s.finishIntro()
    expect(s.get().mode).toBe('idle')
    const s2 = createDeskState()
    s2.skipIntro()
    expect(s2.get().mode).toBe('idle')
  })
  it('ignores focus during intro', () => {
    const s = createDeskState()
    s.focus('mug')
    expect(s.get()).toEqual({ mode: 'intro', hotspot: null })
  })
  it('focuses known hotspots from idle, switches between them, closes back to idle', () => {
    const s = createDeskState()
    s.skipIntro()
    s.focus('mug')
    expect(s.get()).toEqual({ mode: 'focus', hotspot: 'mug' })
    s.focus('monitor')
    expect(s.get()).toEqual({ mode: 'focus', hotspot: 'monitor' })
    s.close()
    expect(s.get()).toEqual({ mode: 'idle', hotspot: null })
  })
  it('ignores unknown hotspot ids', () => {
    const s = createDeskState()
    s.skipIntro()
    s.focus('fridge')
    expect(s.get().mode).toBe('idle')
  })
  it('exposes the canonical 9 hotspot ids', () => {
    expect([...HOTSPOTS].sort()).toEqual(
      ['frame', 'handheld', 'keyboard', 'monitor', 'mug', 'musicbox', 'notes', 'plant', 'tray'])
  })
  it('notifies subscribers on change', () => {
    const s = createDeskState()
    const seen = []
    s.subscribe(st => seen.push(st.mode))
    s.skipIntro()
    s.focus('tray')
    expect(seen).toEqual(['idle', 'focus'])
  })
})
