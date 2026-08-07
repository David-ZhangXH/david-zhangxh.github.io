import { describe, it, expect } from 'vitest'
import { renderClassic } from '../src/classic/renderClassic.js'

const content = {
  profile: {
    displayName: 'David Z.',
    tagline: 'Biostatistician.',
    email: 'davidzzz@bu.edu',
    birthday: '07-16',
    bio: 'Hello & welcome.',
    links: { github: 'https://github.com/dz', scholar: '', linkedin: '' }
  },
  works: [
    { id: 'p1', type: 'paper', status: 'published', title: 'Star Paper', year: 2026, venue: 'J. Stats', link: 'https://doi.org/xyz', description: 'About stars.' },
    { id: 'rv1', type: 'paper', status: 'review', title: 'Igniting Paper', year: 2025, description: 'Almost there.' },
    { id: 'po1', type: 'poster', status: 'published', title: 'Comet Poster', year: 2026, venue: 'Conf', description: 'Poster.' },
    { id: 'p2', type: 'paper', status: 'ongoing', title: 'Protostar Paper', description: 'Igniting.' },
    { id: 'pr1', type: 'project', status: 'ongoing', title: 'Nebula A', description: 'Forming.' },
    { id: 'ps1', type: 'paper', status: 'paused', title: 'Dormant Nebula', description: 'Waiting for time.' }
  ],
  writings: [{ slug: 'welcome', title: 'Why this site is a world', date: '2026-08-07', kind: 'note', body: 'x' }]
}

describe('renderClassic', () => {
  const html = renderClassic(content)

  it('shows identity, bio, tagline', () => {
    expect(html).toContain('David Z.')
    expect(html).toContain('Biostatistician.')
    expect(html).toContain('Hello &amp; welcome.')
  })
  it('groups works: published+review, in progress, on hold; posters labelled', () => {
    expect(html).toContain('Star Paper')
    expect(html).toContain('Comet Poster')
    expect(html).toContain('Protostar Paper')
    expect(html).toContain('Nebula A')
    expect(html).toMatch(/in progress/i)
    expect(html).toContain('Igniting Paper')
    expect(html).toMatch(/under review/i)
    expect(html).toContain('Dormant Nebula')
    expect(html).toMatch(/on hold/i)
  })
  it('links what has links, never renders empty links', () => {
    expect(html).toContain('https://doi.org/xyz')
    expect(html).toContain('https://github.com/dz')
    expect(html).not.toContain('scholar')
  })
  it('has CV download and mailto contact', () => {
    expect(html).toContain('cv.pdf')
    expect(html).toContain('mailto:davidzzz@bu.edu')
  })
  it('lists writings', () => {
    expect(html).toContain('Why this site is a world')
  })
  it('escapes hostile content (XSS guard)', () => {
    const evil = renderClassic({ ...content, profile: { ...content.profile, bio: '<script>alert(1)</script>' } })
    expect(evil).not.toContain('<script>alert(1)')
    expect(evil).toContain('&lt;script&gt;')
  })
  it('never leaks the birthday into the public page', () => {
    expect(html).not.toContain('07-16')
    expect(html).not.toMatch(/july\s*16/i)
  })
})
