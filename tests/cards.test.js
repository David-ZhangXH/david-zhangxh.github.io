import { describe, it, expect } from 'vitest'
import {
  formatBirthday, aboutCard, cvCard, contactCard, linksCard, playlistCard, teaserCard,
  plantCard, wallCard
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
  it('contains bio, the July 16 date, and both photos — no weird hint', () => {
    const html = aboutCard(profile)
    expect(html).toContain('Hello &amp; welcome.')
    expect(html).toContain('July 16')
    expect(html).toContain('photos/then.jpg')
    expect(html).toContain('photos/now.jpg')
    expect(html).not.toMatch(/dates matter/i)
  })
})

describe('birthday appears in the photo frame only', () => {
  it('no other card leaks it', () => {
    for (const html of [cvCard(), contactCard(profile), linksCard(profile), playlistCard(playlist), teaserCard('galaxy'), teaserCard('village'), plantCard(), wallCard([], profile)]) {
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
  it('linksCard renders David\'s three sticky notes', () => {
    const html = linksCard(profile)
    expect(html).toContain('Insomania Radio')                 // bilibili music account, note 1
    expect(html).toContain(profile.links.linkedin)            // real LinkedIn link
    expect(html).toMatch(/unlock the phone/i)                 // note 2 — the village hint
    expect(html).toContain('能力越大，睡的越香')                 // note 3
    expect(html).toContain('INSLEEP')
    expect(html).not.toContain('p = 0.049')
  })
  it('playlistCard lists tracks without the old intro line', () => {
    const html = playlistCard(playlist)
    expect(html).toContain('Track A')
    expect(html).toContain('Artist B')
    expect(html).toContain('https://x')
    expect(html).not.toMatch(/models fit/i)
  })
  it('plantCard tells the mint story', () => {
    const html = plantCard()
    expect(html).toMatch(/mint/i)
    expect(html).toMatch(/childhood/i)
  })
  it('wallCard shows pinned messages, a place to type, and honest sending', () => {
    const html = wallCard([{ text: 'hello desk', from: 'a ghost' }], profile)
    expect(html).toContain('hello desk')
    expect(html).toContain('a ghost')
    expect(html).toContain('<textarea')
    expect(html).toContain('data-type-it')
    expect(html).toContain('data-send-wall')
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
