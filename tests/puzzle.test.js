import { describe, it, expect } from 'vitest'
import { createPuzzle, claimCode } from '../src/village/puzzle.js'

describe('createPuzzle', () => {
  it('same seed gives same scramble; different seeds differ', () => {
    expect(createPuzzle(42).tiles()).toEqual(createPuzzle(42).tiles())
    expect(createPuzzle(42).tiles()).not.toEqual(createPuzzle(43).tiles())
  })
  it('scrambles are never already solved and always have 16 tiles 0-15', () => {
    for (const seed of [1, 2, 3, 99]) {
      const p = createPuzzle(seed)
      expect(p.isSolved()).toBe(false)
      expect([...p.tiles()].sort((a, b) => a - b)).toEqual(Array.from({ length: 16 }, (_, i) => i))
    }
  })
  it('only tiles adjacent to the hole can move; moves are counted', () => {
    const p = createPuzzle(7)
    const before = p.tiles()
    const hole = before.indexOf(0)
    const legalIdx = [hole - 4, hole + 4, hole % 4 ? hole - 1 : -1, (hole % 4) < 3 ? hole + 1 : -1]
      .filter(i => i >= 0 && i < 16)
    const illegal = before.findIndex((t, i) => t !== 0 && !legalIdx.includes(i))
    expect(p.move(before[illegal])).toBe(false)
    expect(p.moves()).toBe(0)
    expect(p.move(before[legalIdx[0]])).toBe(true)
    expect(p.moves()).toBe(1)
  })
  it('is solvable: replaying the scramble in reverse solves it', () => {
    const p = createPuzzle(5)
    const undo = p.scrambleMoves().slice().reverse()
    for (const t of undo) p.move(t)
    expect(p.isSolved()).toBe(true)
  })
})

describe('claimCode', () => {
  it('is deterministic and input-sensitive', () => {
    const a = claimCode(25990, 142, 7, '2026-08-07')
    expect(a).toBe(claimCode(25990, 142, 7, '2026-08-07'))
    expect(a).not.toBe(claimCode(25991, 142, 7, '2026-08-07'))
    expect(a).not.toBe(claimCode(25990, 143, 7, '2026-08-07'))
    expect(a).toMatch(/^[a-z0-9]{6,10}$/)
  })
})
