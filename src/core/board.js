// The message board's store. Visitors type on the keyboard; their words are
// pinned here and only shown when someone opens the board on the wall.
//
// Two providers, chosen by content/board.json:
//   { "provider": "local" }                      — this browser only (default)
//   { "provider": "supabase", "url": "https://xxxx.supabase.co",
//     "anonKey": "…", "table": "messages" }      — shared by every visitor
// The local list is always kept as a cache so the board opens instantly and
// still works when the network does not.

const LS_KEY = 'davidworld:board'
const MAX_TEXT = 280
const MAX_LOCAL = 200

export function formatWhen(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function cleanText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT)
}

function readLocal() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
    return Array.isArray(raw) ? raw.filter(m => m && typeof m.text === 'string' && typeof m.at === 'string') : []
  } catch { return [] }
}
function writeLocal(list) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, MAX_LOCAL))) } catch {}
}
const newestFirst = (a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)

function supabaseHeaders(cfg, extra = {}) {
  return { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}`, 'Content-Type': 'application/json', ...extra }
}

export function createBoard(cfg = { provider: 'local' }, fetchImpl = globalThis.fetch) {
  const remote = cfg && cfg.provider === 'supabase' && cfg.url && cfg.anonKey
  const table = (cfg && cfg.table) || 'messages'
  const endpoint = remote ? `${cfg.url.replace(/\/$/, '')}/rest/v1/${table}` : null

  async function list() {
    const local = readLocal().sort(newestFirst)
    if (!remote || !fetchImpl) return { messages: local, shared: false }
    try {
      const r = await fetchImpl(`${endpoint}?select=text,at&order=at.desc&limit=${MAX_LOCAL}`, { headers: supabaseHeaders(cfg) })
      if (!r.ok) throw new Error(`board: ${r.status}`)
      const rows = (await r.json()).filter(m => m && typeof m.text === 'string' && typeof m.at === 'string')
      writeLocal(rows)
      return { messages: rows.sort(newestFirst), shared: true }
    } catch {
      return { messages: local, shared: false, offline: true }
    }
  }

  async function add(text) {
    const clean = cleanText(text)
    if (!clean) return null
    const msg = { text: clean, at: new Date().toISOString() }
    writeLocal([msg, ...readLocal()])
    if (remote && fetchImpl) {
      try {
        const r = await fetchImpl(endpoint, {
          method: 'POST',
          headers: supabaseHeaders(cfg, { Prefer: 'return=minimal' }),
          body: JSON.stringify({ text: msg.text, at: msg.at })
        })
        return { ...msg, shared: r.ok }
      } catch { return { ...msg, shared: false } }
    }
    return { ...msg, shared: false }
  }

  return { list, add, shared: !!remote }
}
