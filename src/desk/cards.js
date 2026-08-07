// Pure HTML builders for the desk's card overlays. No DOM, no three.js.
import { esc, LINK_LABELS } from '../core/html.js'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export function formatBirthday(mmdd) {
  const [mm, dd] = mmdd.split('-').map(Number)
  return `${MONTHS[mm - 1]} ${dd}`
}

const card = (title, body, cls = '') => `
<div class="card ${cls}">
  <h3>${esc(title)}</h3>
  ${body}
</div>`

export function aboutCard(profile) {
  return card('About me', `
  <p class="bio">${esc(profile.bio)}</p>
  <dl class="facts">
    <dt>Goes by</dt><dd>David</dd>
    <dt>Birthday</dt><dd>${esc(formatBirthday(profile.birthday))}</dd>
    <dt>Field</dt><dd>${esc(profile.tagline || '')}</dd>
  </dl>
  <p class="hint">Some dates matter more than they look. ✦</p>`, 'about')
}

export function cvCard() {
  return card('Curriculum Vitae', `
  <p>The full, formal version of me.</p>
  <p class="actions">
    <a class="btn" href="cv.pdf" target="_blank" rel="noopener">Open CV (PDF)</a>
    <a class="btn ghost" href="cv.pdf" download>Download</a>
  </p>`, 'cv')
}

export function contactCard(profile) {
  return card('Write to me', `
  <p>For collaborations, questions, or a kind hello.</p>
  <p class="actions">
    <a class="btn" href="mailto:${esc(profile.email)}">${esc(profile.email)}</a>
    <button class="btn ghost" data-copy="${esc(profile.email)}">copy address</button>
  </p>`, 'contact')
}

export function linksCard(profile) {
  const links = Object.entries(profile.links || {})
    .filter(([, url]) => url && url.trim())
    .map(([k, url]) => `<a class="btn ghost" href="${esc(url)}" target="_blank" rel="noopener">${esc(LINK_LABELS[k] || k)}</a>`)
  return card('Sticky notes', `
  ${links.length ? `<p class="actions">${links.join(' ')}</p>` : '<p>Links coming soon — the notes are still being written.</p>'}
  <p class="joke">One note just says <em>p = 0.049</em>. It seems important to him.</p>`, 'links')
}

export function playlistCard(list, soundOn = false) {
  const rows = list.map(t => `<li>${t.link ? `<a href="${esc(t.link)}" target="_blank" rel="noopener">${esc(t.title)}</a>` : esc(t.title)}
    <span class="artist">${esc(t.artist)}</span></li>`).join('\n')
  return card('The music box', `
  <p>What plays while the models fit:</p>
  <ol class="playlist">${rows}</ol>
  <p class="actions"><button class="btn ghost" data-sound>${soundOn ? '🔇 let the box rest' : '🎶 wind the box'}</button></p>
  <p class="hint">winding it starts the rain and a little melody — everywhere in the world.</p>`, 'playlist')
}

export function teaserCard(kind) {
  if (kind === 'galaxy') {
    return card('The monitor', `
    <p>Behind this glass, a young universe is forming — papers as stars, projects as
    nebulae. The camera will dive straight through the screen.</p>
    <p class="hint">The galaxy opens in the next stage of construction. ✦</p>`, 'teaser')
  }
  return card('The handheld', `
  <p>A small console, still asleep. When it wakes it will ask you for a passcode —
  and if you've read carefully around this desk, you'll already know it.</p>
  <p class="hint">The village opens in a later stage of construction. ✦</p>`, 'teaser')
}
