import { describe, it, expect } from 'vitest'
import { validateVillage } from '../src/core/validate.js'
import { readFileSync } from 'node:fs'

const real = JSON.parse(readFileSync(new URL('../content/village.json', import.meta.url), 'utf8'))

describe('validateVillage v2', () => {
  it('accepts the real content', () => {
    expect(validateVillage(real)).toEqual([])
  })
  it('rejects missing sections and malformed pieces', () => {
    expect(validateVillage({})).not.toEqual([])
    expect(validateVillage({ ...real, home: { ...real.home, memory: { question: 'q', answers: [], title: 't', text: 'x' } } })).not.toEqual([])
    expect(validateVillage({ ...real, schools: [{ id: 'x' }] })).not.toEqual([])
    expect(validateVillage({ ...real, library: { ...real.library, quiz: [real.library.quiz[0]] } })).not.toEqual([])
  })
})

describe('David\'s specifics are honored', () => {
  it('home holds every object he listed', () => {
    for (const key of ['musicbox', 'tv', 'laptop', 'music_corner', 'shelves', 'board', 'toy', 'bigbook', 'worldmap', 'tape', 'memory', 'jerseys'])
      expect(real.home[key], key).toBeTruthy()
  })
  it('jersey wall carries exactly his four shirts', () => {
    const items = real.home.jerseys.items
    expect(items.map(j => [j.team, j.number])).toEqual([
      ['Manchester United', 8], ['Argentina', 10], ['OKC Thunder', 13], ['OKC Thunder', 0]
    ])
    expect(items.map(j => j.name)).toEqual(['Bruno Fernandes', 'Lionel Messi', 'Paul George', 'Russell Westbrook'])
  })
  it('rejects a jersey wall with malformed items', () => {
    const bad = { ...real, home: { ...real.home, jerseys: { title: 't', text: 'x', items: [{ team: 'A' }] } } }
    expect(validateVillage(bad)).not.toEqual([])
  })
  it('music box carries his taste: genres, artists, loves, the lyric', () => {
    const mb = real.home.musicbox
    expect(mb.genres).toEqual(['R&B', 'Neo-Soul', 'Jazz-pop', 'Rock & Roll', 'Garage', 'Afro', 'EDM', 'Future Bass', 'Flamenco'])
    expect(mb.artists).toEqual(['王以太', '艾热', 'Gali', 'Linkin Park', '大张伟', '邓紫棋'])
    expect(mb.loves).toHaveLength(22)
    for (const a of ['Kendrick Lamar', 'Molchat Doma', '黑豹乐队', '方大同', 'Billie Eilish'])
      expect(mb.loves).toContain(a)
    expect(mb.lyric).toBe('Love can fight everything.')
    expect(Array.isArray(mb.albums)).toBe(true)
  })
  it('rejects a malformed music box', () => {
    const bad = { ...real, home: { ...real.home, musicbox: { ...real.home.musicbox, genres: [''] } } }
    expect(validateVillage(bad)).not.toEqual([])
    const bad2 = { ...real, home: { ...real.home, musicbox: { ...real.home.musicbox, albums: [{}] } } }
    expect(validateVillage(bad2)).not.toEqual([])
  })
  it('nickname gate accepts flower / huahua / 花花', () => {
    expect(real.home.memory.answers.map(a => a.toLowerCase())).toEqual(['flower', 'huahua', '花花'])
  })
  it('three schools and three lab tables', () => {
    expect(real.schools.map(s => s.name)).toEqual(['Yuying', '101', 'BU'])
    expect(real.lab.map(l => l.name)).toEqual(['Biology', 'Chemistry', 'Environmental Science'])
  })
  it('quiz answers are Linkin Park, Insomania Radio, huahua', () => {
    const [q1, q2, q3] = real.library.quiz
    expect(q1.options[q1.answer]).toBe('Linkin Park')
    expect(q2.options[q2.answer]).toBe('Insomania Radio')
    expect(q3.options[q3.answer]).toBe('huahua')
    expect(q3.options).toContain('feifei')
  })
})
