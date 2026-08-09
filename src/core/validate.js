const isStr = (v) => typeof v === 'string'
const filled = (v) => isStr(v) && v.trim().length > 0

export function validateProfile(p) {
  const errs = []
  if (!p || typeof p !== 'object') return ['profile: not an object']
  if (!filled(p.displayName)) errs.push('profile.displayName: required non-empty string')
  if (!filled(p.email) || !p.email.includes('@')) errs.push('profile.email: must be an email')
  if (!filled(p.bio)) errs.push('profile.bio: required non-empty string')
  if (p.tagline !== undefined && !isStr(p.tagline)) errs.push('profile.tagline: must be a string')
  // Privacy by construction: MM-DD only. A year must never be publishable.
  if (!isStr(p.birthday) || !/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(p.birthday))
    errs.push('profile.birthday: must be "MM-DD" (month-day only, no year)')
  if (p.links !== undefined) {
    if (typeof p.links !== 'object' || Array.isArray(p.links)) errs.push('profile.links: must be an object')
    else for (const [k, v] of Object.entries(p.links))
      if (!isStr(v)) errs.push(`profile.links.${k}: must be a string (empty string to hide)`)
  }
  return errs
}

export function validatePlaylist(list) {
  if (!Array.isArray(list)) return ['playlist: must be an array']
  const errs = []
  list.forEach((t, i) => {
    if (!t || typeof t !== 'object') { errs.push(`playlist[${i}]: not an object`); return }
    if (!filled(t.title)) errs.push(`playlist[${i}].title: required`)
    if (!filled(t.artist)) errs.push(`playlist[${i}].artist: required`)
    if (t.link !== undefined && !isStr(t.link)) errs.push(`playlist[${i}].link: must be a string`)
  })
  return errs
}

export function validateIdeas(list) {
  if (!Array.isArray(list)) return ['ideas: must be an array']
  const errs = []
  list.forEach((t, i) => {
    if (!t || typeof t !== 'object') { errs.push(`ideas[${i}]: not an object`); return }
    if (!filled(t.topic)) errs.push(`ideas[${i}].topic: required`)
    if (!Array.isArray(t.ideas) || t.ideas.length === 0) errs.push(`ideas[${i}].ideas: non-empty array required`)
    else t.ideas.forEach((d, j) => {
      if (!filled(d?.title)) errs.push(`ideas[${i}].ideas[${j}].title: required`)
      if (d?.note !== undefined && !isStr(d.note)) errs.push(`ideas[${i}].ideas[${j}].note: must be a string`)
    })
  })
  return errs
}

const WORK_TYPES = ['paper', 'poster', 'project']
const WORK_STATUSES = ['published', 'review', 'ongoing', 'paused']

export function validateWorks(list) {
  if (!Array.isArray(list)) return ['works: must be an array']
  const errs = []
  const seen = new Set()
  list.forEach((w, i) => {
    const at = `works[${i}]`
    if (!w || typeof w !== 'object') { errs.push(`${at}: not an object`); return }
    if (!filled(w.id)) errs.push(`${at}.id: required`)
    else if (seen.has(w.id)) errs.push(`${at}.id: duplicate "${w.id}"`)
    else seen.add(w.id)
    if (!WORK_TYPES.includes(w.type)) errs.push(`${at}.type: must be one of ${WORK_TYPES.join('|')}`)
    if (!WORK_STATUSES.includes(w.status)) errs.push(`${at}.status: must be one of ${WORK_STATUSES.join('|')}`)
    if (!filled(w.title)) errs.push(`${at}.title: required`)
    if (w.year !== undefined && (typeof w.year !== 'number' || w.year < 1900 || w.year > 2100))
      errs.push(`${at}.year: must be a number 1900–2100`)
    for (const k of ['venue', 'link', 'pdf', 'description'])
      if (w[k] !== undefined && !isStr(w[k])) errs.push(`${at}.${k}: must be a string`)
  })
  return errs
}

// Village content (2.0 shape — see validateVillage2 below)
export function validateVillage(v) {
  return validateVillage2(v)
}

export function validateWall(list) {
  if (!Array.isArray(list)) return ['wall: must be an array']
  const errs = []
  list.forEach((m, i) => {
    if (!filled(m?.text)) errs.push(`wall[${i}].text: required`)
    for (const k of ['from', 'date'])
      if (m?.[k] !== undefined && !isStr(m[k])) errs.push(`wall[${i}].${k}: must be a string`)
  })
  return errs
}

// Village 2.0 content shape
export function validateVillage2(v) {
  if (!v || typeof v !== 'object') return ['village: not an object']
  const errs = []
  const HOME_KEYS = ['musicbox', 'tv', 'laptop', 'music_corner', 'shelves', 'board', 'toy', 'bigbook', 'worldmap', 'tape', 'memory', 'jerseys', 'go', 'games']
  if (!v.home || typeof v.home !== 'object') errs.push('village.home: required object')
  else {
    for (const k of HOME_KEYS) {
      const o = v.home[k]
      if (!o || !filled(o.title) || !isStr(o.text)) errs.push(`village.home.${k}: needs title + text string (text may be empty)`)
    }
    const m = v.home.memory
    if (m && (!filled(m.question) || !Array.isArray(m.answers) || m.answers.length === 0 || !m.answers.every(filled)))
      errs.push('village.home.memory: needs question + non-empty answers')
    const jz = v.home.jerseys
    if (jz && (!Array.isArray(jz.items) || jz.items.length === 0 ||
      !jz.items.every(j => j && filled(j.team) && filled(j.name) && Number.isInteger(j.number) && j.number >= 0)))
      errs.push('village.home.jerseys: items need team + name + non-negative integer number')
    const wm = v.home.worldmap
    if (wm && (!Array.isArray(wm.stops) || wm.stops.length === 0 ||
      !wm.stops.every(s2 => s2 && filled(s2.place))))
      errs.push('village.home.worldmap.stops: each stop needs a place')
    const gl = v.home.games
    if (gl && (!Array.isArray(gl.games) || gl.games.length === 0 || !gl.games.every(g2 => g2 && filled(g2.name))))
      errs.push('village.home.games.games: each game needs a name')
    const mc = v.home.music_corner
    if (mc && mc.items && !(Array.isArray(mc.items) && mc.items.every(i2 => i2 && filled(i2.name) && filled(i2.note))))
      errs.push('village.home.music_corner.items: name + note required')
    const cats = v.home.cats
    if (cats && (!Array.isArray(cats) || cats.length === 0 ||
      !cats.every(c => c && filled(c.id) && filled(c.name) && filled(c.line) && filled(c.kind))))
      errs.push('village.home.cats: each cat needs id + name + line + kind')
    const mb = v.home.musicbox
    if (mb) {
      for (const key of ['genres', 'artists', 'loves'])
        if (key in mb && (!Array.isArray(mb[key]) || mb[key].length === 0 || !mb[key].every(filled)))
          errs.push(`village.home.musicbox.${key}: non-empty array of strings`)
      if ('lyric' in mb && !filled(mb.lyric)) errs.push('village.home.musicbox.lyric: non-empty string')
      if ('albums' in mb && (!Array.isArray(mb.albums) || !mb.albums.every(a => a && filled(a.img))))
        errs.push('village.home.musicbox.albums: each album needs an img path')
    }
  }
  for (const [sec, n] of [['schools', 3], ['lab', 3]]) {
    if (!Array.isArray(v[sec]) || v[sec].length !== n) errs.push(`village.${sec}: exactly ${n} entries`)
    else v[sec].forEach((s, i) => {
      if (!filled(s?.id) || !filled(s?.name) || !filled(s?.text)) errs.push(`village.${sec}[${i}]: needs id/name/text`)
    })
  }
  if (!v.library || !Array.isArray(v.library.documents) || v.library.documents.length === 0)
    errs.push('village.library.documents: non-empty array required')
  else v.library.documents.forEach((d, i) => { if (!filled(d?.title)) errs.push(`village.library.documents[${i}].title: required`) })
  if (!v.library || !Array.isArray(v.library.quiz) || v.library.quiz.length !== 3) errs.push('village.library.quiz: exactly 3 questions')
  else v.library.quiz.forEach((q, i) => {
    if (!filled(q?.q)) errs.push(`village.library.quiz[${i}].q: required`)
    if (!Array.isArray(q?.options) || q.options.length !== 4 || !q.options.every(filled))
      errs.push(`village.library.quiz[${i}].options: exactly 4 non-empty strings`)
    if (!Number.isInteger(q?.answer) || q.answer < 0 || q.answer > 3) errs.push(`village.library.quiz[${i}].answer: integer 0-3`)
  })
  if (!v.npcs || typeof v.npcs !== 'object' || Array.isArray(v.npcs)) errs.push('village.npcs: must be an object')
  else for (const [k, lines] of Object.entries(v.npcs))
    if (!Array.isArray(lines) || !lines.every(filled)) errs.push(`village.npcs.${k}: must be non-empty strings`)
  return errs
}
