import { describe, it, expect } from 'vitest'
import { workCard, ideasCard } from '../src/galaxy/cards.js'

const base = { id: 'x', type: 'paper', title: 'A Title', description: 'What it is.' }

describe('workCard', () => {
  it('review papers show venue + year, nothing more', () => {
    const html = workCard({ ...base, status: 'review', year: 2025, venue: 'Revised & resubmitted' })
    expect(html).toContain('A Title')
    expect(html).toContain('Revised &amp; resubmitted · 2025')
    expect(html).not.toMatch(/igniting/i)
  })
  it('published posters show their venue only — no accepted tag, no doubled year', () => {
    const html = workCard({ ...base, type: 'poster', status: 'published', venue: 'STAI-X 2026' })
    expect(html).toContain('STAI-X 2026')
    expect(html).not.toMatch(/accepted/i)
    expect(html).not.toContain('STAI-X 2026 · 2026')
  })
  it('ongoing works say in progress, without condensing talk', () => {
    const html = workCard({ ...base, status: 'ongoing' })
    expect(html).toMatch(/in progress/i)
    expect(html).not.toMatch(/condensing/i)
  })
  it('paused works say only on hold', () => {
    const html = workCard({ ...base, status: 'paused' })
    expect(html).toMatch(/on hold/i)
    expect(html).not.toMatch(/dormant/i)
    expect(html).not.toMatch(/time, not interest/i)
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
    const html = ideasCard(topics, 'davidzzz@bu.edu')
    expect(html).toMatch(/idea nebula/i)
    expect(html).toContain('Aging clocks')
    expect(html).toContain('Idea 1')
    expect(html).toContain('<details')
  })
  it('invites visitors to leave their own academic ideas', () => {
    const html = ideasCard(topics, 'davidzzz@bu.edu')
    expect(html).toContain('<textarea')
    expect(html).toContain('data-send-idea')
    expect(html).toContain('davidzzz@bu.edu')
  })
  it('escapes hostile content', () => {
    expect(ideasCard([{ topic: '<b onmouseover=x>t</b>', ideas: [{ title: 'i' }] }], 'x@y.z')).not.toContain('<b onmouseover')
  })
})
