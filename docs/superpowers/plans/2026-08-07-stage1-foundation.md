# Stage 1 — Foundation & Classic Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A deployable Vite site whose `index.html` is the fully-baked Classic Mode page (SEO/no-JS complete), driven entirely by validated content files — the skeleton every later world mounts onto.

**Architecture:** Content lives in `content/*.json` + `content/writings/*.md`, validated by hand-rolled validators (no schema deps). A Vite `transformIndexHtml` plugin bakes the classic page (HTML + inlined CSS) into `index.html` at dev/build time via a pure `renderClassic()` string function — so the page works with JS disabled and is fully crawlable. `src/main.js` only adds progressive enhancements. GitHub Actions workflow deploys `dist/` to GitHub Pages when David later pushes to GitHub.

**Tech Stack:** Node 22, Vite ^7, Vitest ^3 (unit tests), Playwright library (screenshot verification, pre-installed Chromium at `/opt/pw-browsers/chromium` in this environment).

**Plan 1 of 5.** Later plans: Stage 2 Desk, Stage 3 Galaxy, Stage 4 Village, Stage 5 Polish.

**Spec:** `docs/superpowers/specs/2026-08-07-david-world-design.md` (§5 Classic Mode, §6 content model, §7 tech, §9 verification).

---

## File structure (locked in by this plan)

```
davidworld/
├── package.json              # scripts: dev/build/preview/test/snap
├── vite.config.js            # base path + classic-bake plugin
├── index.html                # meta/OG + <!--CLASSIC--> slot + module script
├── .gitignore
├── README.md                 # run/deploy instructions for David
├── .github/workflows/deploy.yml
├── content/
│   ├── profile.json          # identity, links, birthday MM-DD only
│   ├── works.json            # 5 real entries (placeholder text, real shape)
│   └── writings/welcome.md   # first writing, front-matter format
├── public/cv.pdf             # placeholder PDF (1 page, "CV coming soon")
├── src/
│   ├── core/validate.js      # validateProfile, validateWorks
│   ├── core/loadContent.js   # node-side: read+parse content dir (front matter)
│   ├── classic/renderClassic.js  # pure (content) -> HTML string
│   ├── classic/classic.css   # classic page styles (inlined at bake)
│   └── main.js               # progressive enhancement only
├── scripts/snap.mjs          # screenshot built site (desktop+phone)
└── tests/
    ├── validate.test.js
    ├── content.test.js       # real content files pass validators
    └── renderClassic.test.js
```

Boundaries: `renderClassic` never touches the filesystem (testable, reusable by later stages); `loadContent` is the only fs reader; `validate` is the only shape authority. Worlds added in later stages mount on top of `index.html` without changing this contract.

---

### Task 1: Scaffold the project

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `.gitignore`, `src/main.js`, `src/classic/classic.css` (empty for now)

- [x] **Step 1: Write `package.json`**

```json
{
  "name": "davidworld",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 4173 --strictPort",
    "test": "vitest run",
    "snap": "node scripts/snap.mjs"
  },
  "devDependencies": {
    "playwright": "^1.55.0",
    "vite": "^7.1.0",
    "vitest": "^3.2.0"
  }
}
```

- [x] **Step 2: Write `.gitignore`**

```
node_modules/
dist/
shots/
*.log
```

- [x] **Step 3: Write minimal `vite.config.js`** (bake plugin arrives in Task 4)

```js
import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.BASE_PATH || '/',
})
```

- [x] **Step 4: Write `index.html`** (the `<!--CLASSIC-->` slot is filled by the Task 4 plugin)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>David Z. — a website you can walk into</title>
  <meta name="description" content="Biostatistician. Papers as stars, projects as nebulae, a desk at midnight — or the quiet classic version, your choice.">
  <meta property="og:title" content="David Z. — a website you can walk into">
  <meta property="og:description" content="A personal site built as an explorable world. A classic mode for the busy.">
  <meta property="og:type" content="website">
  <!--CLASSIC-->
  <script type="module" src="/src/main.js"></script>
</head>
<body>
</body>
</html>
```

Note: the plugin replaces `<!--CLASSIC-->` with `<style>…</style>` and replaces the empty `<body>` content with the baked page. Until Task 4 runs, the page is blank — that's expected.

- [x] **Step 5: Write placeholder `src/main.js`**

```js
// Progressive enhancement only — the page must be complete without JS.
console.info('[david.world] classic skeleton loaded')
```

- [x] **Step 6: Create empty `src/classic/classic.css`** (content in Task 4)

- [x] **Step 7: Install and verify build runs**

Run: `npm install && npm run build`
Expected: vite build completes, `dist/index.html` exists (blank body is fine at this point).

- [x] **Step 8: Commit**

```bash
git add package.json package-lock.json vite.config.js index.html .gitignore src/
git commit -m "chore: scaffold vite project for david.world" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Content validators (TDD)

**Files:**
- Create: `tests/validate.test.js`, then `src/core/validate.js`

Validation contract: each validator returns an **array of error strings** (empty = valid). No throwing, no deps.

- [x] **Step 1: Write the failing tests — `tests/validate.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { validateProfile, validateWorks } from '../src/core/validate.js'

const goodProfile = {
  displayName: 'David Z.',
  tagline: 'Biostatistician.',
  email: 'davidzzz@bu.edu',
  birthday: '07-16',
  bio: 'Hello.',
  links: { github: 'https://github.com/x', scholar: '' }
}

const goodWork = {
  id: 'paper-1', type: 'paper', status: 'published',
  title: 'A paper', year: 2026, venue: 'Journal', link: 'https://doi.org/x',
  description: 'What it is.'
}

describe('validateProfile', () => {
  it('accepts a good profile', () => {
    expect(validateProfile(goodProfile)).toEqual([])
  })
  it('requires displayName and email', () => {
    const errs = validateProfile({ ...goodProfile, displayName: '', email: 'nope' })
    expect(errs.join(' ')).toMatch(/displayName/)
    expect(errs.join(' ')).toMatch(/email/)
  })
  it('accepts birthday only as MM-DD (privacy: no year, ever)', () => {
    expect(validateProfile({ ...goodProfile, birthday: '1999-07-16' })).not.toEqual([])
    expect(validateProfile({ ...goodProfile, birthday: '13-01' })).not.toEqual([])
    expect(validateProfile({ ...goodProfile, birthday: '07-32' })).not.toEqual([])
    expect(validateProfile({ ...goodProfile, birthday: '12-31' })).toEqual([])
  })
})

describe('validateWorks', () => {
  it('accepts a good works array', () => {
    expect(validateWorks([goodWork])).toEqual([])
  })
  it('rejects non-arrays and bad types/statuses', () => {
    expect(validateWorks({})).not.toEqual([])
    expect(validateWorks([{ ...goodWork, type: 'song' }])).not.toEqual([])
    expect(validateWorks([{ ...goodWork, status: 'someday' }])).not.toEqual([])
  })
  it('rejects duplicate ids and missing titles', () => {
    expect(validateWorks([goodWork, { ...goodWork }])).not.toEqual([])
    expect(validateWorks([{ ...goodWork, title: '' }])).not.toEqual([])
  })
})
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/validate.test.js`
Expected: FAIL — cannot resolve `../src/core/validate.js`.

- [x] **Step 3: Implement `src/core/validate.js`**

```js
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

const WORK_TYPES = ['paper', 'poster', 'project']
const WORK_STATUSES = ['published', 'ongoing']

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
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/validate.test.js`
Expected: PASS (all 6).

- [x] **Step 5: Commit**

```bash
git add tests/validate.test.js src/core/validate.js
git commit -m "feat: content validators with MM-DD birthday privacy rule" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Real content files + loader (TDD)

**Files:**
- Create: `tests/content.test.js`, `content/profile.json`, `content/works.json`, `content/writings/welcome.md`, `src/core/loadContent.js`, `public/cv.pdf`

- [x] **Step 1: Write the failing tests — `tests/content.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { loadContent } from '../src/core/loadContent.js'
import { validateProfile, validateWorks } from '../src/core/validate.js'

describe('real content files', () => {
  const content = loadContent(new URL('../content', import.meta.url).pathname)

  it('profile.json is valid', () => {
    expect(validateProfile(content.profile)).toEqual([])
  })
  it('works.json is valid and matches the spec inventory (1+1+1+2)', () => {
    expect(validateWorks(content.works)).toEqual([])
    const by = (t, s) => content.works.filter(w => w.type === t && w.status === s).length
    expect(by('paper', 'published')).toBe(1)
    expect(by('poster', 'published')).toBe(1)
    expect(by('paper', 'ongoing')).toBe(1)
    expect(by('project', 'ongoing')).toBe(2)
  })
  it('writings parse with title/date front matter', () => {
    expect(content.writings.length).toBeGreaterThan(0)
    for (const w of content.writings) {
      expect(w.title).toBeTruthy()
      expect(w.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(w.body).toBeTruthy()
    }
  })
})
```

- [x] **Step 2: Run to verify failure**

Run: `npx vitest run tests/content.test.js`
Expected: FAIL — cannot resolve `loadContent.js`.

- [x] **Step 3: Implement `src/core/loadContent.js`** (node-only; used by tests + vite plugin)

```js
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// Front matter: a leading block of "key: value" lines between --- fences.
function parseFrontMatter(raw) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw)
  if (!m) return { attrs: {}, body: raw.trim() }
  const attrs = {}
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) attrs[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return { attrs, body: m[2].trim() }
}

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
```

- [x] **Step 4: Write `content/profile.json`** (placeholder text, real shape — David swaps values later)

```json
{
  "displayName": "David Z.",
  "tagline": "Biostatistician — building evidence, one model at a time.",
  "email": "davidzzz@bu.edu",
  "birthday": "07-16",
  "bio": "I'm David, a biostatistician. I care about honest models, careful inference, and making health data tell the truth. This placeholder bio will be replaced with David's own words before launch.",
  "links": {
    "github": "",
    "scholar": "",
    "linkedin": ""
  }
}
```

- [x] **Step 5: Write `content/works.json`** (the real 1+1+1+2 inventory; titles are labeled placeholders)

```json
[
  {
    "id": "paper-2026",
    "type": "paper",
    "status": "published",
    "title": "Published paper title goes here (replace me)",
    "year": 2026,
    "venue": "Journal name (replace me)",
    "link": "",
    "description": "One-paragraph plain-language summary of the paper, written for a visitor who is smart but not in the field."
  },
  {
    "id": "poster-2026",
    "type": "poster",
    "status": "published",
    "title": "Poster title goes here (replace me)",
    "year": 2026,
    "venue": "Conference name (replace me)",
    "pdf": "",
    "description": "Where it was presented and what it showed."
  },
  {
    "id": "paper-ongoing",
    "type": "paper",
    "status": "ongoing",
    "title": "Ongoing paper (working title — replace me)",
    "description": "What question it asks and roughly where it stands."
  },
  {
    "id": "project-a",
    "type": "project",
    "status": "ongoing",
    "title": "Working project A (replace me)",
    "description": "What it is, who it's with, current stage."
  },
  {
    "id": "project-b",
    "type": "project",
    "status": "ongoing",
    "title": "Working project B (replace me)",
    "description": "What it is, who it's with, current stage."
  }
]
```

- [x] **Step 6: Write `content/writings/welcome.md`**

```markdown
---
title: Why this site is a world
date: 2026-08-07
kind: note
---
Most personal websites are documents. I wanted mine to be a place.

There is a desk here that stays lit at midnight, a small universe behind the
monitor where my work lives as stars, and — for the people who read carefully —
a village with my whole story in it.

This note is the first book in the library. More writing will land on these
shelves over time.
```

- [x] **Step 7: Create `public/cv.pdf` placeholder**

Run:
```bash
mkdir -p public && node -e "
const c='%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 88>>stream\nBT /F1 24 Tf 72 700 Td (David Z. - CV placeholder) Tj 0 -36 Td (Real CV coming soon.) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>';
require('fs').writeFileSync('public/cv.pdf', c)"
```
Expected: `public/cv.pdf` exists (a minimal one-page PDF; replaced by David's real CV later).

- [x] **Step 8: Run tests to verify they pass**

Run: `npx vitest run tests/content.test.js`
Expected: PASS (3 tests).

- [x] **Step 9: Commit**

```bash
git add tests/content.test.js src/core/loadContent.js content/ public/cv.pdf
git commit -m "feat: real content files (1+1+1+2 works) with loader and validation" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Classic page renderer (TDD)

**Files:**
- Create: `tests/renderClassic.test.js`, then `src/classic/renderClassic.js`

Contract: `renderClassic({ profile, works, writings }) -> string` of body-inner HTML. Pure function, no fs, escapes ALL content values.

- [x] **Step 1: Write the failing tests — `tests/renderClassic.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { renderClassic } from '../src/classic/renderClassic.js'

const content = {
  profile: {
    displayName: 'David Z.',
    tagline: 'Biostatistician.',
    email: 'davidzzz@bu.edu',
    birthday: '07-16',
    bio: 'Hello & welcome.',
    links: { github: 'https://github.com/dz', scholar: '', linkedin: '' }
  },
  works: [
    { id: 'p1', type: 'paper', status: 'published', title: 'Star Paper', year: 2026, venue: 'J. Stats', link: 'https://doi.org/xyz', description: 'About stars.' },
    { id: 'po1', type: 'poster', status: 'published', title: 'Comet Poster', year: 2026, venue: 'Conf', description: 'Poster.' },
    { id: 'p2', type: 'paper', status: 'ongoing', title: 'Protostar Paper', description: 'Igniting.' },
    { id: 'pr1', type: 'project', status: 'ongoing', title: 'Nebula A', description: 'Forming.' }
  ],
  writings: [{ slug: 'welcome', title: 'Why this site is a world', date: '2026-08-07', kind: 'note', body: 'x' }]
}

describe('renderClassic', () => {
  const html = renderClassic(content)

  it('shows identity, bio, tagline', () => {
    expect(html).toContain('David Z.')
    expect(html).toContain('Biostatistician.')
    expect(html).toContain('Hello &amp; welcome.')
  })
  it('groups works: published, in progress; posters labelled', () => {
    expect(html).toContain('Star Paper')
    expect(html).toContain('Comet Poster')
    expect(html).toContain('Protostar Paper')
    expect(html).toContain('Nebula A')
    expect(html).toMatch(/in progress/i)
  })
  it('links what has links, never renders empty links', () => {
    expect(html).toContain('https://doi.org/xyz')
    expect(html).toContain('https://github.com/dz')
    expect(html).not.toContain('scholar')
  })
  it('has CV download and mailto contact', () => {
    expect(html).toContain('cv.pdf')
    expect(html).toContain('mailto:davidzzz@bu.edu')
  })
  it('lists writings', () => {
    expect(html).toContain('Why this site is a world')
  })
  it('escapes hostile content (XSS guard)', () => {
    const evil = renderClassic({ ...content, profile: { ...content.profile, bio: '<script>alert(1)</script>' } })
    expect(evil).not.toContain('<script>alert(1)')
    expect(evil).toContain('&lt;script&gt;')
  })
  it('never leaks the birthday into the public page', () => {
    expect(html).not.toContain('07-16')
    expect(html).not.toMatch(/july\s*16/i)
  })
})
```

- [x] **Step 2: Run to verify failure**

Run: `npx vitest run tests/renderClassic.test.js`
Expected: FAIL — cannot resolve `renderClassic.js`.

- [x] **Step 3: Implement `src/classic/renderClassic.js`**

Note: the birthday test above encodes a real rule — Classic Mode is the *public* page; the birthday appears ONLY in the desk's photo-frame card (Stage 2), never here.

```js
const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const LINK_LABELS = { github: 'GitHub', scholar: 'Google Scholar', linkedin: 'LinkedIn' }

function workItem(w) {
  const meta = [w.venue, w.year].filter(Boolean).map(esc).join(' · ')
  const title = w.link
    ? `<a href="${esc(w.link)}" rel="noopener">${esc(w.title)}</a>`
    : w.pdf
      ? `<a href="${esc(w.pdf)}" rel="noopener">${esc(w.title)}</a>`
      : esc(w.title)
  const kind = w.type === 'poster' ? ' <span class="kind">poster</span>' : ''
  return `<li>${title}${kind}${meta ? ` <span class="meta">${meta}</span>` : ''}
    ${w.description ? `<p>${esc(w.description)}</p>` : ''}</li>`
}

export function renderClassic({ profile, works, writings }) {
  const published = works.filter(w => w.status === 'published')
  const ongoing = works.filter(w => w.status === 'ongoing')
  const links = Object.entries(profile.links || {})
    .filter(([, url]) => url && url.trim())
    .map(([k, url]) => `<a href="${esc(url)}" rel="noopener">${esc(LINK_LABELS[k] || k)}</a>`)

  return `
<main class="classic">
  <header>
    <p class="hello">the quiet version</p>
    <h1>${esc(profile.displayName)}</h1>
    <p class="tagline">${esc(profile.tagline || '')}</p>
    <nav class="links">
      ${links.join('\n      ')}
      <a href="mailto:${esc(profile.email)}">Email</a>
      <a href="cv.pdf" class="cv" rel="noopener">CV (PDF)</a>
    </nav>
  </header>

  <section id="about">
    <h2>About</h2>
    <p>${esc(profile.bio)}</p>
  </section>

  <section id="works">
    <h2>Works</h2>
    <ul class="works">${published.map(workItem).join('\n')}</ul>
    <h3>In progress</h3>
    <ul class="works ongoing">${ongoing.map(workItem).join('\n')}</ul>
  </section>

  <section id="writing">
    <h2>Writing</h2>
    <ul class="writings">
      ${writings.map(w => `<li><span class="date">${esc(w.date)}</span> ${esc(w.title)}</li>`).join('\n      ')}
    </ul>
  </section>

  <footer>
    <p>This is the quiet version of this site. The loud version is a world — it opens with Stage 2.</p>
  </footer>
</main>`
}
```

- [x] **Step 4: Run to verify pass**

Run: `npx vitest run tests/renderClassic.test.js`
Expected: PASS (7 tests).

- [x] **Step 5: Run the whole suite**

Run: `npm test`
Expected: PASS — validate (6) + content (3) + renderClassic (7).

- [x] **Step 6: Commit**

```bash
git add tests/renderClassic.test.js src/classic/renderClassic.js
git commit -m "feat: classic page renderer with XSS + birthday-privacy guards" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Bake plugin + classic styles

**Files:**
- Modify: `vite.config.js`
- Create: `src/classic/classic.css` (replace empty file)

- [x] **Step 1: Write `src/classic/classic.css`**

```css
/* Classic Mode — quiet, fast, print-friendly. Dark by preference, light by default. */
:root {
  --ink: #1b1e27; --dim: #5a6172; --bg: #fbfaf7; --line: #e5e2da; --acc: #2757d6;
}
@media (prefers-color-scheme: dark) {
  :root { --ink: #e8ecf4; --dim: #98a0b4; --bg: #0e1118; --line: #262b38; --acc: #7ea2ff; }
}
* { margin: 0; box-sizing: border-box; }
body { background: var(--bg); color: var(--ink);
  font: 17px/1.65 Georgia, 'Times New Roman', serif; }
.classic { max-width: 660px; margin: 0 auto; padding: 56px 22px 80px; }
header .hello { font: 600 12px/1 ui-monospace, Menlo, monospace; letter-spacing: .18em;
  text-transform: uppercase; color: var(--dim); }
h1 { font-size: 40px; line-height: 1.15; margin: 10px 0 6px; letter-spacing: -.01em; }
.tagline { color: var(--dim); font-style: italic; }
.links { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 18px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; }
.links a { color: var(--acc); text-decoration: none; border-bottom: 1px solid transparent; }
.links a:hover { border-bottom-color: var(--acc); }
.links .cv { font-weight: 650; }
section { margin-top: 44px; padding-top: 28px; border-top: 1px solid var(--line); }
h2 { font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  letter-spacing: .14em; text-transform: uppercase; color: var(--dim); margin-bottom: 16px; }
h3 { font-size: 13px; font-family: -apple-system, sans-serif; letter-spacing: .12em;
  text-transform: uppercase; color: var(--dim); margin: 26px 0 10px; }
ul.works, ul.writings { list-style: none; padding: 0; }
ul.works li { margin-bottom: 18px; }
ul.works a { color: var(--ink); text-decoration: underline;
  text-decoration-color: var(--acc); text-underline-offset: 3px; }
.kind { font: 600 11px/1 ui-monospace, monospace; color: var(--bg);
  background: var(--dim); border-radius: 4px; padding: 2px 6px; vertical-align: 2px; }
.meta { color: var(--dim); font-size: 14px; }
ul.works p { color: var(--dim); font-size: 15px; margin-top: 4px; }
ul.writings li { margin-bottom: 8px; }
.writings .date { font: 500 12px/1 ui-monospace, monospace; color: var(--dim); margin-right: 8px; }
footer { margin-top: 60px; padding-top: 24px; border-top: 1px solid var(--line);
  color: var(--dim); font-size: 14px; font-style: italic; }
@media print { .links .cv { display: none; } body { background: #fff; } }
```

- [x] **Step 2: Replace `vite.config.js` with the bake plugin**

```js
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadContent } from './src/core/loadContent.js'
import { validateProfile, validateWorks } from './src/core/validate.js'
import { renderClassic } from './src/classic/renderClassic.js'

const root = dirname(fileURLToPath(import.meta.url))

function classicBake() {
  return {
    name: 'classic-bake',
    transformIndexHtml(html) {
      const content = loadContent(join(root, 'content'))
      const errs = [...validateProfile(content.profile), ...validateWorks(content.works)]
      if (errs.length) throw new Error('Content invalid:\n' + errs.join('\n'))
      const css = readFileSync(join(root, 'src/classic/classic.css'), 'utf8')
      return html
        .replace('<!--CLASSIC-->', `<style>\n${css}\n</style>`)
        .replace('<body>\n</body>', `<body>${renderClassic(content)}</body>`)
    }
  }
}

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [classicBake()],
})
```

- [x] **Step 3: Build and verify the bake**

Run: `npm run build && grep -c "David Z." dist/index.html && grep -c "<style>" dist/index.html`
Expected: build succeeds; both grep counts ≥ 1 (name and inlined CSS present in `dist/index.html`).

- [x] **Step 4: Verify content-guard fails loudly**

Run: `node -e "
const fs=require('fs');const p=JSON.parse(fs.readFileSync('content/profile.json','utf8'));
p.birthday='1999-07-16';fs.writeFileSync('content/profile.json',JSON.stringify(p,null,2))" && npm run build; git checkout -- content/profile.json`
Expected: build FAILS with `profile.birthday: must be "MM-DD"`, then the file is restored. (This proves invalid content can never ship.)

- [x] **Step 5: Commit**

```bash
git add vite.config.js src/classic/classic.css
git commit -m "feat: bake validated classic page + inlined styles into index.html" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Progressive enhancement in `main.js`

**Files:**
- Modify: `src/main.js`

- [x] **Step 1: Replace `src/main.js`**

```js
// Progressive enhancement only — Classic Mode is complete without JS.
// Stage 2 will feature-detect WebGL here and offer "enter the world".

function enhance() {
  // Copy-email affordance: turn the mailto link into copy-on-click with feedback.
  const mail = document.querySelector('a[href^="mailto:"]')
  if (mail && navigator.clipboard) {
    mail.addEventListener('click', (e) => {
      e.preventDefault()
      const addr = mail.getAttribute('href').replace('mailto:', '')
      navigator.clipboard.writeText(addr).then(() => {
        const prev = mail.textContent
        mail.textContent = 'copied!'
        setTimeout(() => { mail.textContent = prev }, 1200)
      }).catch(() => { location.href = mail.getAttribute('href') })
    })
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance)
else enhance()
```

- [x] **Step 2: Build, sanity-run the suite**

Run: `npm test && npm run build`
Expected: all tests PASS; build succeeds.

- [x] **Step 3: Commit**

```bash
git add src/main.js
git commit -m "feat: copy-email enhancement on classic page" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Deploy workflow + README

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`

- [x] **Step 1: Write `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm test
      - run: npm run build
        env:
          BASE_PATH: ${{ vars.BASE_PATH || '/' }}
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [x] **Step 2: Write `README.md`**

```markdown
# david.world

A personal website built as an explorable world. Stage 1 = Classic Mode
(this quiet page); later stages add the desk, the galaxy, and the village.
Design spec: `docs/superpowers/specs/2026-08-07-david-world-design.md`.

## Edit your content (no code needed)

- `content/profile.json` — name, tagline, bio, email, links.
  `birthday` is month-day only (`"07-16"`); the build refuses a year.
- `content/works.json` — every paper/poster/project. When the ongoing paper
  publishes, change its `status` to `"published"` and add `year`/`venue`/`link`.
- `content/writings/*.md` — one file per piece, front-matter `title/date/kind`.
- `public/cv.pdf` — replace with the real CV.

## Run locally

    npm install
    npm run dev        # dev server
    npm test           # test suite
    npm run build      # production build to dist/

## Deploy (one-time setup)

1. Create a GitHub repository (e.g. `<username>.github.io`, or any name).
2. Push this folder to its `main` branch.
3. Repo Settings → Pages → Source: **GitHub Actions**.
4. Done — every push to `main` tests, builds, and deploys.
   (Project repo instead of `<username>.github.io`? Set a repo variable
   `BASE_PATH=/<repo-name>/` in Settings → Actions → Variables.)
```

- [x] **Step 3: Commit**

```bash
git add .github/ README.md
git commit -m "chore: GitHub Pages deploy workflow and README" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Visual verification

**Files:**
- Create: `scripts/snap.mjs`

- [x] **Step 1: Write `scripts/snap.mjs`**

```js
// Screenshots the BUILT site (vite preview) at desktop + phone sizes.
// In the cloud workspace, set PW_EXE=/opt/pw-browsers/chromium (no download needed).
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const exe = process.env.PW_EXE
const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore' })
await new Promise(r => setTimeout(r, 1800))

try {
  mkdirSync('shots', { recursive: true })
  const browser = await chromium.launch(exe ? { executablePath: exe, args: ['--no-sandbox'] } : {})
  for (const [name, viewport] of [['desktop', { width: 1280, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport })
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
    await page.screenshot({ path: `shots/classic-${name}.png`, fullPage: true })
    console.log(`shots/classic-${name}.png`)
  }
  await browser.close()
} finally {
  preview.kill()
}
```

- [x] **Step 2: Build and snap**

Run: `npm run build && PW_EXE=/opt/pw-browsers/chromium npm run snap`
Expected: prints `shots/classic-desktop.png` and `shots/classic-phone.png`.

- [x] **Step 3: Review both screenshots** (executor: open the PNGs and check — name, works grouped, writings listed, dark scheme respected, no overflow on phone). Fix anything broken before proceeding.

- [x] **Step 4: Commit**

```bash
git add scripts/snap.mjs
git commit -m "chore: screenshot verification script" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Self-review (done at plan time)

- **Spec coverage (Stage-1 slice):** §5 Classic Mode → Tasks 4–6 (baked HTML, mailto, CV, quiet button arrives with worlds in Stage 2 — nothing to toggle to yet); §6 content model → Tasks 2–3 (profile/works/writings; ideas/playlist/school/home deferred to their stages, per YAGNI); §7 hosting/stack → Tasks 1, 7; §9 verification → Tasks 2–4 tests + Task 8 screenshots; §10 birthday privacy → validator MM-DD rule + renderClassic leak test.
- **Placeholder scan:** all steps carry full code/commands; content files contain labeled placeholder *values* by design (spec §12).
- **Type consistency:** `loadContent → {profile, works, writings}` consumed identically by tests, plugin, `renderClassic`; validator names match across Tasks 2/5.
```
