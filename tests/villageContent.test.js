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
    for (const key of ['musicbox', 'tv', 'laptop', 'music_corner', 'shelves', 'board', 'toy', 'bigbook', 'worldmap', 'tape', 'memory', 'jerseys', 'go', 'games'])
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
  it("the home speaks in David's words only — no added flavor", () => {
    for (const k of ['jerseys', 'board', 'toy', 'bigbook', 'worldmap', 'musicbox', 'tv', 'laptop', 'music_corner'])
      expect(real.home[k].text, k).not.toMatch(/David/)
  })
  it('world map: China and US open into his cities; the rest are single stops, ending with Next stop...', () => {
    const stops = real.home.worldmap.stops
    expect(stops.map(s => s.place)).toEqual(['China', 'US', 'Singapore', 'Bali Island', 'New Zealand', 'Iceland', 'Paris', 'Japan', 'Next stop...'])
    expect(stops.find(s => s.place === 'Japan').places.map(p => p.place)).toEqual(['Tokyo', 'Kyoto', 'Nara'])
    expect(stops.find(s => s.place === 'Iceland').photos).toHaveLength(41)
    expect(stops.find(s => s.place === 'Paris').photos).toHaveLength(26)
    expect(stops[1].places.find(p => p.place === 'Boston').photos).toHaveLength(15)
    expect(real.home.pets.photos).toHaveLength(46)
    const cn = stops[0].places.map(p => p.place)
    expect(cn).toEqual(['北京', '合肥', '上海', '重庆', '成都', '厦门', '济南', '三亚', '广州', '武夷山', '新疆', '内蒙', '武汉', '西安', '苏州', '杭州', '长沙', '延边', '香港'])
    expect(stops[0].places[0].when).toBe('growing up')
    const us = stops[1].places.map(p => p.place)
    expect(us.slice(0, 20)).toEqual(['Seattle', 'San Francisco', 'LA', 'San Diego', 'Las Vegas', 'Zion', 'Grand Canyon', 'Antelope Canyon', 'Yellowstone', 'Chicago', 'Boston', 'Minneapolis', 'Pittsburgh', 'Rochester', 'Maine', 'New York', 'Philadelphia', 'Baltimore', 'Washington', 'Orlando'])
    expect(stops[1].places.find(p => p.place === 'Boston').when).toBe('School life')
    expect(stops.at(-1).later).toBe(true)
  })
  it('the picture board is locked behind the birthday hint, photos to come', () => {
    expect(real.home.board.hint).toBe('birthday-month-day')
    expect(real.home.board.sections.map(s => s.title)).toEqual(['Middle School', 'High School', 'University', 'Life', 'Future....'])
    expect(real.home.board.sections[0].photos).toHaveLength(12)
    expect(real.home.board.sections[1].photos).toHaveLength(24)
    expect(real.home.board.sections[2].photos).toHaveLength(21)
    expect(real.home.board.sections.at(-1).later).toBe(true)
    const bad = { ...real, home: { ...real.home, worldmap: { ...real.home.worldmap, stops: [{ place: 'X', places: [] }] } } }
    expect(validateVillage(bad)).not.toEqual([])
  })
  it('laptop, tv, go, games carry his content', () => {
    expect(real.home.laptop.award).toBe('Hearthstone rank 50')
    expect(real.home.laptop.favorites).toContain('It Takes Two')
    expect(real.home.tv.shows).toContain('唐朝诡事录')
    expect(real.home.tv.footer).toBe('Follow my Douban: 207128578')
    expect(real.home.go.text).toBe('围棋三段。')
    expect(real.home.games.games.map(g => g.name)).toEqual(['马尼拉', '波多黎各', '纽约之王', '骆驼大赛', '山中小屋'])
  })
  it('three cats live at home, with David\'s exact lines', () => {
    const cats = real.home.cats
    expect(cats.map(c => c.name)).toEqual(['Twizzler', '小花', '小不点'])
    expect(cats.map(c => c.line)).toEqual([
      'Twizzler 2023.9, Tortoiseshell',
      '小花 2017.9.21, American shorthair',
      '小不点, 2021.8.31, Maine'
    ])
    expect(cats.map(c => c.kind)).toEqual(['tortoiseshell', 'grey', 'white'])
  })
  it('伯爵 the poodle lives here, quietly (no introduction)', () => {
    expect(real.home.dog).toEqual({ id: 'bojue', name: '伯爵', line: '', kind: 'poodle' })
  })
  it('the big book holds exactly his six lines; the poster speaks the line', () => {
    expect(real.home.bigbook.lines).toHaveLength(6)
    expect(real.home.bigbook.lines[0]).toBe('Born in 2002 Beijing')
    expect(real.home.bigbook.lines[4]).toBe('2022.02.21 姥姥去世了')
    expect(real.home.bigbook.lines[5]).toBe('2025.12 伯爵去世了')
    expect(real.home.poster.text).toBe('With great power comes great responsibility.')
  })
  it('rejects a malformed cat', () => {
    const bad = { ...real, home: { ...real.home, cats: [{ id: 'x', name: 'X' }] } }
    expect(validateVillage(bad)).not.toEqual([])
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
  it('three schools and four lab tables', () => {
    expect(real.schools.map(s => s.name)).toEqual(['Yuying', '101', 'BU'])
    expect(real.lab.map(l => l.name)).toEqual(['Biology', 'Chemistry', 'Environmental Science', 'Statistics & Biostatistics'])
  })
  it('lab tables carry his courses; stats splits B.A. / M.S.', () => {
    expect(real.lab[1].courses).toHaveLength(5)
    expect(real.lab[1].courses[0]).toBe('AP Chemistry')
    expect(real.lab[0].courses).toContain('Methods in Epidemiology')
    expect(real.lab[2].courses).toContain('Climate & Earth Science')
    const st = real.lab[3]
    expect(st.groups.map(g => g.title)).toEqual(['B.A. level', 'M.S. level'])
    expect(st.groups[0].courses).toHaveLength(8)
    expect(st.groups[1].courses).toHaveLength(18)
    expect(st.groups[1].courses).toContain('Causal Inference')
  })
  it('rejects a lab table with an empty course list', () => {
    const bad = { ...real, lab: real.lab.map((l, i) => i === 0 ? { ...l, courses: [] } : l) }
    expect(validateVillage(bad)).not.toEqual([])
  })
  it('the library shelves Hello-world, Life Experience, the anxiety letter — then To be continued', () => {
    const docs = real.library.documents
    expect(docs.map(d => d.title)).toEqual(['Hello-world', 'Life Experience', 'If you are feeling anxious & depression, read this'])
    expect(docs[0].paragraphs[0]).toMatch(/I am David, 张晓航/)
    expect(docs[0].paragraphs.at(-1)).toBe('Enjoy.')
    expect(real.library.toBeContinued).toBe('....To be continued.')
  })
  it("the record-breaker's letter is David's, signed D", () => {
    const L = real.arcade.letter
    expect(L.greeting).toBe('Dear person reading this,')
    expect(L.paragraphs).toHaveLength(4)
    expect(L.paragraphs[1]).toMatch(/middle school/)
    expect(L.paragraphs[2]).toMatch(/screenshot/)
    expect(L.signature).toBe('D')
    const bad = { ...real, arcade: { letter: { ...L, paragraphs: [] } } }
    expect(validateVillage(bad)).not.toEqual([])
  })
  it('quiz answers are Linkin Park, Insomania Radio, huahua', () => {
    const [q1, q2, q3] = real.library.quiz
    expect(q1.options[q1.answer]).toBe('Linkin Park')
    expect(q2.options[q2.answer]).toBe('Insomania Radio')
    expect(q3.options[q3.answer]).toBe('huahua')
    expect(q3.options).toContain('feifei')
  })
})
