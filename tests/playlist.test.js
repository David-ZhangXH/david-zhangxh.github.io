import { describe, it, expect } from 'vitest'
import { validatePlaylist } from '../src/core/validate.js'
import { loadContent } from '../src/core/loadContent.js'
import { readFileSync } from 'node:fs'

describe('validatePlaylist', () => {
  it('accepts a good playlist', () => {
    expect(validatePlaylist([{ title: 'Song', artist: 'Artist', link: 'https://x' }])).toEqual([])
    expect(validatePlaylist([{ title: 'Song', artist: 'Artist' }])).toEqual([])
  })
  it('rejects non-arrays and missing titles', () => {
    expect(validatePlaylist({})).not.toEqual([])
    expect(validatePlaylist([{ artist: 'A' }])).not.toEqual([])
    expect(validatePlaylist([{ title: '', artist: 'A' }])).not.toEqual([])
  })
})

describe('real playlist.json', () => {
  const list = JSON.parse(readFileSync(new URL('../content/playlist.json', import.meta.url), 'utf8'))
  it('is valid with at least 3 tracks', () => {
    expect(validatePlaylist(list)).toEqual([])
    expect(list.length).toBeGreaterThanOrEqual(3)
  })
})
