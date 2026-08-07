// Front matter: a leading block of "key: value" lines between --- fences.
// Shared by the node-side content loader and the browser-side library shelf.
export function parseFrontMatter(raw) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw)
  if (!m) return { attrs: {}, body: raw.trim() }
  const attrs = {}
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) attrs[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return { attrs, body: m[2].trim() }
}
