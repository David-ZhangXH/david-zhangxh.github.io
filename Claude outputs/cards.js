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
  <div class="photos">
    <figure><img src="photos/then.jpg" alt="Xiaohang as a child, beside a snow rabbit"><figcaption>then</figcaption></figure>
    <figure><img src="photos/now.jpg" alt="Xiaohang now, blue hair, autumn hills behind"><figcaption>now</figcaption></figure>
  </div>
  <p class="bio">${esc(profile.bio)}</p>
  <dl class="facts">
    <dt>Goes by</dt><dd>David</dd>
    <dt>Birthday</dt><dd>${esc(formatBirthday(profile.birthday))}</dd>
    <dt>Into</dt><dd>${esc(profile.tagline || '')}</dd>
  </dl>`, 'about')
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
  const li = profile.links?.linkedin
  return card('Sticky notes', `
  <div class="notes">
    <div class="note yellow">Follow my music account on bilibili — <b>“Insomania Radio”</b> 😊<br>
      ${li ? `LinkedIn: <a href="${esc(li)}" target="_blank" rel="noopener">${esc(li.replace('https://www.', ''))}</a>` : ''}</div>
    <div class="note pink">Unlock the phone to explore more contents.</div>
    <div class="note green">能力越大，睡的越香 😴<br><b>MBTI: INSLEEP</b></div>
  </div>`, 'links')
}

export function playlistCard(list, soundOn = false) {
  const rows = list.map(t => `<li>${t.link ? `<a href="${esc(t.link)}" target="_blank" rel="noopener">${esc(t.title)}</a>` : esc(t.title)}
    <span class="artist">${esc(t.artist)}</span></li>`).join('\n')
  return card('The music box', `
  <ol class="playlist">${rows}</ol>
  <p class="actions"><button class="btn ghost" data-sound>${soundOn ? '🔇 let the box rest' : '🎶 wind the box'}</button></p>
  <p class="hint">winding it starts the rain and a little melody — everywhere in the world.</p>`, 'playlist')
}

export function plantCard() {
  return card('The mint', `
  <p>Mint — a stubborn little herb that grows back no matter how often it's cut,
  and quietly makes everything around it smell like morning.</p>
  <p class="hint">— to my childhood, and the pots of mint I raised at home. ✦</p>`, 'plant')
}

export function keyboardCard() {
  return card('The keyboard', `
  <textarea class="wall-input" rows="3" maxlength="280" placeholder="say anything — it goes on the board" aria-label="Your message"></textarea>
  <p class="actions">
    <button class="btn" data-pin-board>pin it to the board</button>
  </p>
  <p class="hint">Anonymous. Read it on the board beside the monitor.</p>`, 'wall')
}

// the message board: every pinned word, newest first
export function boardCard(messages, meta = {}) {
  const rows = (messages || []).map(m => `
    <li class="board-msg"><span class="board-who">匿名：</span><span class="board-text">${esc(m.text)}</span><span class="board-when">—— ${esc(m.when || '')}</span></li>`).join('')
  const scope = meta.shared ? ''
    : meta.offline ? `<p class="hint board-scope">The shared board could not be reached${meta.reason ? ` (${esc(meta.reason)})` : ''} — showing what this browser remembers.</p>`
    : '<p class="hint board-scope">This board is kept in your browser only.</p>'
  const note = meta.loading ? '<p class="hint">opening the board…</p>'
    : !rows ? `<p class="hint">Nothing pinned yet — the keyboard is right there.</p>${scope}`
    : scope
  return card('The message board', `
  ${rows ? `<ol class="board">${rows}</ol>` : ''}
  ${note}`, 'boardcard')
}

// tiny one-line cards for the desk's small props
export function microCard(title, line) {
  return card(title, `<p class="micro">${esc(line)}</p>`, 'micro')
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
