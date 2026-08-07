import { describe, it, expect } from 'vitest'
import { validateIdeas } from '../src/core/validate.js'
import { readFileSync } from 'node:fs'

describe('validateIdeas', () => {
  it('accepts topics with idea lists', () => {
    expect(validateIdeas([{ topic: 'T', ideas: [{ title: 'a', note: 'n' }, { title: 'b' }] }])).toEqual([])
  })
  it('rejects non-arrays, missing topics, empty idea titles', () => {
    expect(validateIdeas({})).not.toEqual([])
    expect(validateIdeas([{ ideas: [] }])).not.toEqual([])
    expect(validateIdeas([{ topic: 'T', ideas: [{ title: '' }] }])).not.toEqual([])
  })
})

describe('real ideas.json', () => {
  const ideas = JSON.parse(readFileSync(new URL('../content/ideas.json', import.meta.url), 'utf8'))
  it('is valid with at least one topic', () => {
    expect(validateIdeas(ideas)).toEqual([])
    expect(ideas.length).toBeGreaterThanOrEqual(1)
  })
})
