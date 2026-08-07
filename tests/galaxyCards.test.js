import { describe, it, expect } from 'vitest'
import { workCard, ideasCard } from '../src/galaxy/cards.js'

const base = { id: 'x', type: 'paper', title: 'A Title', description: 'What it is.' }

describe('workCard', () => {
  it('review papers ignite', () => {
    const html = workCard({ ...base, status: 'review', year: 2025, venue: 'Revised & resubmitted' })
    expect(html).toContain('A Title')
    expect(html).toMatch(/igniting/i)
    expect(html).toMatch(/revised/i)
  })
  it('published posters show their venue', () => {
    const html = workCard({ ...base, type: 'poster', status: 'published', venue: 'STAI-X 2026' })
    expect(html).toContain('STAI-X 2026')
  })
  it('ongoing works say in progress', () => {
    expect(workCard({ ...base, status: 'ongoing' })).toMatch(/in progress/i)
  })
  it('paused works are dormant, honestly', () => {
    const html = workCard({ ...base, status: 'paused' })
    expect(html).toMatch(/dormant/i)
    expect(html).toMatch(/time, not interest/i)
  })
  it('links and pdfs render only when present', () => {
    expect(workCard({ ...base, status: 'ongoing' })).not.toContain('href')
    expect(workCard({ ...base, status: 'review', link: 'https://doi.org/z' })).toContain('https://doi.org/z')
    expect(workCard({ ...base, type: 'poster', status: 'published', pdf: 'poster.pdf' })).toContain('poster.pdf')
  })
  it('escapes hostile content', () => {
    expect(workCard({ ...base, status: 'ongoing', title: '<script>x</script>' })).not.toContain('<script>x')
  })
})

describe('ideasCard', () => {
  const topics = [{ topic: 'Aging clocks', ideas: [{ title: 'Idea 1', note: 'Note 1' }] }]
  it('reveals the discovery and lists topics', () => {
    const html = ideasCard(topics)
    expect(html).toMatch(/idea nebula/i)
    expect(html).toContain('Aging clocks')
    expect(html).toContain('Idea 1')
    expect(html).toContain('<details')
  })
  it('escapes hostile content', () => {
    expect(ideasCard([{ topic: '<b onmouseover=x>t</b>', ideas: [{ title: 'i' }] }])).not.toContain('<b onmouseover')
  })
})
