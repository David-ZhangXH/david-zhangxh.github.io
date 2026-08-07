import { describe, it, expect } from 'vitest'
import { validateVillage } from '../src/core/validate.js'
import { readFileSync } from 'node:fs'

const good = {
  school: [{ title: 'T', text: 'x' }],
  home: [{ title: 'T', text: 'x' }],
  npcs: { villager: ['Hello!'] },
  quiz: [
    { q: 'Q1', options: ['a', 'b', 'c', 'd'], answer: 0 },
    { q: 'Q2', options: ['a', 'b', 'c', 'd'], answer: 1 },
    { q: 'Q3', options: ['a', 'b', 'c', 'd'], answer: 2 }
  ]
}

describe('validateVillage', () => {
  it('accepts a good shape', () => {
    expect(validateVillage(good)).toEqual([])
  })
  it('rejects missing sections, bad quiz shape, out-of-range answers', () => {
    expect(validateVillage({})).not.toEqual([])
    expect(validateVillage({ ...good, quiz: [{ q: 'x', options: ['a'], answer: 0 }] })).not.toEqual([])
    expect(validateVillage({ ...good, quiz: [{ ...good.quiz[0], answer: 9 }, good.quiz[1], good.quiz[2]] })).not.toEqual([])
  })
})

describe('real village.json', () => {
  const v = JSON.parse(readFileSync(new URL('../content/village.json', import.meta.url), 'utf8'))
  it('is valid with enough content to open', () => {
    expect(validateVillage(v)).toEqual([])
    expect(v.school.length).toBeGreaterThanOrEqual(2)
    expect(v.home.length).toBeGreaterThanOrEqual(2)
    expect(Object.keys(v.npcs).length).toBeGreaterThanOrEqual(2)
    expect(v.quiz.length).toBe(3)
  })
})
