import { describe, it, expect } from 'vitest'
import { validateProfile, validateWorks } from '../src/core/validate.js'

const goodProfile = {
  displayName: 'David Z.',
  tagline: 'Biostatistician.',
  email: 'davidzzz@bu.edu',
  birthday: '07-16',
  bio: 'Hello.',
  links: { github: 'https://github.com/x', scholar: '' }
}

const goodWork = {
  id: 'paper-1', type: 'paper', status: 'published',
  title: 'A paper', year: 2026, venue: 'Journal', link: 'https://doi.org/x',
  description: 'What it is.'
}

describe('validateProfile', () => {
  it('accepts a good profile', () => {
    expect(validateProfile(goodProfile)).toEqual([])
  })
  it('requires displayName and email', () => {
    const errs = validateProfile({ ...goodProfile, displayName: '', email: 'nope' })
    expect(errs.join(' ')).toMatch(/displayName/)
    expect(errs.join(' ')).toMatch(/email/)
  })
  it('accepts birthday only as MM-DD (privacy: no year, ever)', () => {
    expect(validateProfile({ ...goodProfile, birthday: '1999-07-16' })).not.toEqual([])
    expect(validateProfile({ ...goodProfile, birthday: '13-01' })).not.toEqual([])
    expect(validateProfile({ ...goodProfile, birthday: '07-32' })).not.toEqual([])
    expect(validateProfile({ ...goodProfile, birthday: '12-31' })).toEqual([])
  })
})

describe('validateWorks', () => {
  it('accepts a good works array', () => {
    expect(validateWorks([goodWork])).toEqual([])
  })
  it('rejects non-arrays and bad types/statuses', () => {
    expect(validateWorks({})).not.toEqual([])
    expect(validateWorks([{ ...goodWork, type: 'song' }])).not.toEqual([])
    expect(validateWorks([{ ...goodWork, status: 'someday' }])).not.toEqual([])
  })
  it('accepts review and paused statuses (real career shapes)', () => {
    expect(validateWorks([{ ...goodWork, status: 'review' }])).toEqual([])
    expect(validateWorks([{ ...goodWork, status: 'paused' }])).toEqual([])
  })
  it('rejects duplicate ids and missing titles', () => {
    expect(validateWorks([goodWork, { ...goodWork }])).not.toEqual([])
    expect(validateWorks([{ ...goodWork, title: '' }])).not.toEqual([])
  })
})
