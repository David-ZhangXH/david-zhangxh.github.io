import { describe, it, expect } from 'vitest'
import { loadContent } from '../src/core/loadContent.js'
import { validateProfile, validateWorks } from '../src/core/validate.js'

describe('real content files', () => {
  const content = loadContent(new URL('../content', import.meta.url).pathname)

  it('profile.json is valid', () => {
    expect(validateProfile(content.profile)).toEqual([])
  })
  it('works.json is valid and matches the real inventory from the CV', () => {
    expect(validateWorks(content.works)).toEqual([])
    const by = (t, s) => content.works.filter(w => w.type === t && w.status === s).length
    expect(by('paper', 'review')).toBe(1)     // LLM knowledge-graph paper, under review
    expect(by('poster', 'published')).toBe(1) // STAI-X 2026 accepted poster
    expect(by('paper', 'ongoing')).toBe(1)    // Alcohol-CpG aging clock
    expect(by('project', 'ongoing')).toBe(1)  // Graph-RAG + LLM biomedical agent
    expect(by('paper', 'paused')).toBe(2)     // SVG detection + GNPC hypergraph
  })
  it('profile carries the real name', () => {
    expect(content.profile.displayName).toContain('Zhang')
  })
  it('writings parse with title/date front matter', () => {
    expect(content.writings.length).toBeGreaterThan(0)
    for (const w of content.writings) {
      expect(w.title).toBeTruthy()
      expect(w.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(w.body).toBeTruthy()
    }
  })
})

describe('wall.json', () => {
  it('is valid', async () => {
    const { validateWall } = await import('../src/core/validate.js')
    const { readFileSync } = await import('node:fs')
    const wall = JSON.parse(readFileSync(new URL('../content/wall.json', import.meta.url), 'utf8'))
    expect(validateWall(wall)).toEqual([])
  })
})
