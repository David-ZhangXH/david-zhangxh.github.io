import { describe, it, expect, beforeEach } from 'vitest'
import { createBoard, formatWhen, cleanText } from '../src/core/board.js'

const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
}
const cfg = { provider: 'supabase', url: 'https://zoyngrpyvatyfvrtvwzf.supabase.co', anonKey: 'sb_publishable_test', table: 'messages' }

describe('the message board store', () => {
  beforeEach(() => store.clear())
  it('formats times as YYYY-MM-DD HH:mm and trims text to 280 chars', () => {
    expect(formatWhen('2026-09-03T21:47:00')).toMatch(/^2026-09-03 \d{2}:47$/)
    expect(cleanText('  a \n b  ')).toBe('a b')
    expect(cleanText('x'.repeat(400))).toHaveLength(280)
  })
  it('local provider keeps messages in this browser, newest first', async () => {
    const b = createBoard({ provider: 'local' }, null)
    await b.add('first'); await b.add('second')
    const { messages, shared } = await b.list()
    expect(shared).toBe(false)
    expect(messages.map(m => m.text)).toEqual(['second', 'first'])
  })
  it('supabase provider reads with the anon key and posts new rows', async () => {
    const calls = []
    const fetchImpl = async (url, opts = {}) => {
      calls.push({ url, opts })
      if (!opts.method) return { ok: true, json: async () => [{ text: 'hello world', at: '2026-09-03T01:00:00Z' }] }
      return { ok: true }
    }
    const b = createBoard(cfg, fetchImpl)
    const { messages, shared } = await b.list()
    expect(shared).toBe(true)
    expect(messages[0].text).toBe('hello world')
    expect(calls[0].url).toBe('https://zoyngrpyvatyfvrtvwzf.supabase.co/rest/v1/messages?select=text,at&order=at.desc&limit=200')
    expect(calls[0].opts.headers.apikey).toBe('sb_publishable_test')
    const added = await b.add('  new words ')
    expect(added.shared).toBe(true)
    expect(calls[1].opts.method).toBe('POST')
    expect(JSON.parse(calls[1].opts.body).text).toBe('new words')
  })
  it('falls back to the local cache and reports why when the table is missing', async () => {
    const b = createBoard(cfg, async () => ({ ok: false, status: 404 }))
    await b.add('kept locally')
    const r = await b.list()
    expect(r.shared).toBe(false)
    expect(r.offline).toBe(true)
    expect(r.reason).toBe('HTTP 404')
    expect(r.messages[0].text).toBe('kept locally')
  })
})
