import { describe, it, expect } from 'vitest'
import { createQuests, QUEST_IDS } from '../src/village/quests.js'

const fakeStorage = () => {
  const m = new Map()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }
}

describe('createQuests', () => {
  it('tracks the five quests, idempotently, with persistence', () => {
    const store = fakeStorage()
    const q = createQuests(store)
    expect(QUEST_IDS).toEqual(['passcode', 'record', 'library', 'letter', 'coffee'])
    expect(q.progress()).toEqual({ done: 0, total: 5 })
    expect(q.complete('passcode')).toBe(true)
    expect(q.complete('passcode')).toBe(false) // already done
    expect(q.complete('nonsense')).toBe(false)
    expect(q.progress().done).toBe(1)
    // a new instance over the same storage remembers
    const q2 = createQuests(store)
    expect(q2.isDone('passcode')).toBe(true)
    for (const id of QUEST_IDS) q2.complete(id)
    expect(q2.allDone()).toBe(true)
  })
})
