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

export function validateVillage(v) {
  if (!v || typeof v !== 'object') return ['village: not an object']
  const errs = []
  for (const sec of ['school', 'home']) {
    if (!Array.isArray(v[sec])) { errs.push(`village.${sec}: must be an array`); continue }
    v[sec].forEach((s, i) => {
      if (!filled(s?.title)) errs.push(`village.${sec}[${i}].title: required`)
      if (!filled(s?.text)) errs.push(`village.${sec}[${i}].text: required`)
    })
  }
  if (!v.npcs || typeof v.npcs !== 'object' || Array.isArray(v.npcs)) errs.push('village.npcs: must be an object')
  else for (const [k, lines] of Object.entries(v.npcs))
    if (!Array.isArray(lines) || !lines.every(filled)) errs.push(`village.npcs.${k}: must be non-empty strings`)
  if (!Array.isArray(v.quiz)) errs.push('village.quiz: must be an array')
  else v.quiz.forEach((q, i) => {
    if (!filled(q?.q)) errs.push(`village.quiz[${i}].q: required`)
    if (!Array.isArray(q?.options) || q.options.length !== 4 || !q.options.every(filled))
      errs.push(`village.quiz[${i}].options: exactly 4 non-empty strings`)
    if (!Number.isInteger(q?.answer) || q.answer < 0 || q.answer > 3)
      errs.push(`village.quiz[${i}].answer: integer 0-3`)
  })
  return errs
}
