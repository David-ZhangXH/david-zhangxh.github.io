import { describe, it, expect } from 'vitest'
import { createQuests, QUEST_IDS } from '../src/village/quests.js'

const fakeStorage = (preset) => {
  const m = new Map(preset ? [['davidworld:quests', JSON.stringify(preset)]] : [])
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }
}

describe('createQuests v2', () => {
  it('tracks the five quests (memory replaces coffee), idempotently, with persistence', () => {
    const store = fakeStorage()
    const q = createQuests(store)
    expect(QUEST_IDS).toEqual(['passcode', 'record', 'quiz', 'letter', 'memory'])
    expect(q.progress()).toEqual({ done: 0, total: 5 })
    expect(q.complete('passcode')).toBe(true)
    expect(q.complete('passcode')).toBe(false)
    expect(q.complete('coffee')).toBe(false) // retired id
    const q2 = createQuests(store)
    expect(q2.isDone('passcode')).toBe(true)
    for (const id of QUEST_IDS) q2.complete(id)
    expect(q2.allDone()).toBe(true)
  })
  it('filters stale stored ids from older versions', () => {
    const q = createQuests(fakeStorage(['passcode', 'coffee', 'library']))
    expect(q.progress().done).toBe(1) // only passcode survives
    expect(q.isDone('coffee')).toBe(false)
  })
})
