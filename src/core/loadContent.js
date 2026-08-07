import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { parseFrontMatter } from './frontmatter.js'

export function loadContent(dir) {
  const profile = JSON.parse(readFileSync(join(dir, 'profile.json'), 'utf8'))
  const works = JSON.parse(readFileSync(join(dir, 'works.json'), 'utf8'))
  const wdir = join(dir, 'writings')
  const writings = existsSync(wdir)
    ? readdirSync(wdir).filter(f => f.endsWith('.md')).sort().map(f => {
        const { attrs, body } = parseFrontMatter(readFileSync(join(wdir, f), 'utf8'))
        return { slug: f.replace(/\.md$/, ''), title: attrs.title || f, date: attrs.date || '', kind: attrs.kind || 'note', body }
      })
    : []
  return { profile, works, writings }
}
