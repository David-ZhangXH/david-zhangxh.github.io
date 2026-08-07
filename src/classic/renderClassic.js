import { esc, LINK_LABELS } from '../core/html.js'

function workItem(w) {
  const bits = [w.venue, w.year].filter(Boolean).map(esc)
  if (w.status === 'review') bits.push('under review')
  const meta = bits.join(' · ')
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
  const published = works.filter(w => w.status === 'published' || w.status === 'review')
  const ongoing = works.filter(w => w.status === 'ongoing')
  const paused = works.filter(w => w.status === 'paused')
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
    ${paused.length ? `<h3>On hold</h3>
    <ul class="works paused">${paused.map(workItem).join('\n')}</ul>` : ''}
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
