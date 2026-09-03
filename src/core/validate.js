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

export function validateBoardConfig(cfg) {
  const errs = []
  if (!cfg || typeof cfg !== 'object') return ['board: must be an object']
  if (!['local', 'supabase'].includes(cfg.provider)) errs.push('board.provider: "local" or "supabase"')
  if (cfg.provider === 'supabase') {
    if (!filled(cfg.url) || !/^https:\/\//.test(cfg.url)) errs.push('board.url: https URL of the Supabase project')
    if (!filled(cfg.anonKey)) errs.push('board.anonKey: the project anon key')
  }
  if (cfg.table !== undefined && !filled(cfg.table)) errs.push('board.table: non-empty string')
  return errs
}

// Village 2.0 content shape
export function validateVillage2(v) {
  if (!v || typeof v !== 'object') return ['village: not an object']
  const errs = []
  const HOME_KEYS = ['musicbox', 'tv', 'laptop', 'music_corner', 'shelves', 'board', 'toy', 'bigbook', 'worldmap', 'tape', 'memory', 'jerseys', 'go', 'games', 'poster']
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
    const okPlace = (s2) => s2 && filled(s2.place) && (s2.photos === undefined || (Array.isArray(s2.photos) && s2.photos.every(filled)))
    if (wm && (!Array.isArray(wm.stops) || wm.stops.length === 0 ||
      !wm.stops.every(s2 => okPlace(s2) && (s2.places === undefined || (Array.isArray(s2.places) && s2.places.length > 0 && s2.places.every(okPlace))))))
      errs.push('village.home.worldmap.stops: each stop needs a place (groups: places[] of places; photos: paths)')
    const pb = v.home.board
    if (pb && pb.photos !== undefined && !(Array.isArray(pb.photos) && pb.photos.every(filled))) errs.push('village.home.board.photos: array of paths')
    const gl = v.home.games
    if (gl && (!Array.isArray(gl.games) || gl.games.length === 0 || !gl.games.every(g2 => g2 && filled(g2.name))))
      errs.push('village.home.games.games: each game needs a name')
    const mc = v.home.music_corner
    if (mc && mc.items && !(Array.isArray(mc.items) && mc.items.every(i2 => i2 && filled(i2.name) && filled(i2.note))))
      errs.push('village.home.music_corner.items: name + note required')
    const bb2 = v.home.bigbook
    if (bb2 && bb2.lines && !(Array.isArray(bb2.lines) && bb2.lines.length > 0 && bb2.lines.every(filled)))
      errs.push('village.home.bigbook.lines: non-empty strings')
    const dog = v.home.dog
    if (dog && !(filled(dog.id) && filled(dog.name) && filled(dog.kind) && isStr(dog.line)))
      errs.push('village.home.dog: needs id + name + kind (line may be empty)')
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
  for (const [sec, n] of [['schools', 3], ['lab', 4]]) {
    if (!Array.isArray(v[sec]) || v[sec].length !== n) errs.push(`village.${sec}: exactly ${n} entries`)
    else v[sec].forEach((s, i) => {
      if (!filled(s?.id) || !filled(s?.name) || !isStr(s?.text)) errs.push(`village.${sec}[${i}]: needs id/name/text`)
      if (s?.courses !== undefined && !(Array.isArray(s.courses) && s.courses.length > 0 && s.courses.every(filled))) errs.push(`village.${sec}[${i}].courses: non-empty strings`)
      if (s?.groups !== undefined && !(Array.isArray(s.groups) && s.groups.length > 0 && s.groups.every(g => g && filled(g.title) && Array.isArray(g.courses) && g.courses.length > 0 && g.courses.every(filled))))
        errs.push(`village.${sec}[${i}].groups: each needs title + courses`)
      if (s?.photos !== undefined && !(Array.isArray(s.photos) && s.photos.every(filled))) errs.push(`village.${sec}[${i}].photos: array of paths`)
      if (s?.footer !== undefined && !isStr(s.footer)) errs.push(`village.${sec}[${i}].footer: string`)
      if (s?.lines !== undefined && !(Array.isArray(s.lines) && s.lines.every(filled))) errs.push(`village.${sec}[${i}].lines: non-empty strings`)
    })
  }
  if (!v.library || !Array.isArray(v.library.documents) || v.library.documents.length === 0)
    errs.push('village.library.documents: non-empty array required')
  else v.library.documents.forEach((d, i) => {
    if (!filled(d?.title)) errs.push(`village.library.documents[${i}].title: required`)
    if (d?.paragraphs !== undefined && !(Array.isArray(d.paragraphs) && d.paragraphs.every(filled))) errs.push(`village.library.documents[${i}].paragraphs: non-empty strings`)
  })
  if (v.library?.toBeContinued !== undefined && !isStr(v.library.toBeContinued)) errs.push('village.library.toBeContinued: string')
  if (v.arcade !== undefined) {
    const L = v.arcade?.letter
    if (!L || !filled(L.greeting) || !Array.isArray(L.paragraphs) || L.paragraphs.length === 0 || !L.paragraphs.every(filled) || !filled(L.signoff) || !filled(L.signature))
      errs.push('village.arcade.letter: greeting, paragraphs[], signoff, signature')
  }
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
