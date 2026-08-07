import { describe, it, expect } from 'vitest'
import {
  formatBirthday, aboutCard, cvCard, contactCard, linksCard, playlistCard, teaserCard
} from '../src/desk/cards.js'

const profile = {
  displayName: 'Xiaohang (David) Zhang',
  tagline: 'Biostatistician.',
  email: 'davidzzz@bu.edu',
  birthday: '07-16',
  bio: 'Hello & welcome.',
  links: { github: 'https://github.com/dz', scholar: '', linkedin: '' }
}
const playlist = [{ title: 'Track A', artist: 'Artist A', link: 'https://x' }, { title: 'Track B', artist: 'Artist B' }]

describe('formatBirthday', () => {
  it('renders month name + day without year', () => {
    expect(formatBirthday('07-16')).toBe('July 16')
    expect(formatBirthday('01-02')).toBe('January 2')
  })
})

describe('aboutCard', () => {
  it('contains bio and the July 16 date (the passcode hiding place)', () => {
    const html = aboutCard(profile)
    expect(html).toContain('Hello &amp; welcome.')
    expect(html).toContain('July 16')
  })
})

describe('birthday appears in the photo frame only', () => {
  it('no other card leaks it', () => {
    for (const html of [cvCard(), contactCard(profile), linksCard(profile), playlistCard(playlist), teaserCard('galaxy'), teaserCard('village')]) {
      expect(html).not.toMatch(/july\s*16/i)
      expect(html).not.toContain('07-16')
    }
  })
})

describe('cards content', () => {
  it('cvCard links the pdf', () => {
    expect(cvCard()).toContain('cv.pdf')
  })
  it('contactCard has mailto and a copy button', () => {
    const html = contactCard(profile)
    expect(html).toContain('mailto:davidzzz@bu.edu')
    expect(html).toContain('data-copy="davidzzz@bu.edu"')
  })
  it('linksCard renders only non-empty links and the p=0.049 joke', () => {
    const html = linksCard(profile)
    expect(html).toContain('https://github.com/dz')
    expect(html).not.toContain('Google Scholar')
    expect(html).toContain('p = 0.049')
  })
  it('playlistCard lists tracks, linking when a link exists', () => {
    const html = playlistCard(playlist)
    expect(html).toContain('Track A')
    expect(html).toContain('Artist B')
    expect(html).toContain('https://x')
  })
  it('teaserCards name their worlds', () => {
    expect(teaserCard('galaxy')).toMatch(/galaxy/i)
    expect(teaserCard('village')).toMatch(/asleep|locked|village/i)
  })
  it('escapes hostile content', () => {
    const evil = aboutCard({ ...profile, bio: '<img onerror=x>' })
    expect(evil).not.toContain('<img onerror')
  })
})
