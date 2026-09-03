// DOM builders for village UI: interiors, dialogue, letter, quiz, arcade, ticket.
// Pixel-styled, accessible, pure string builders.
import { esc } from '../core/html.js'

export function objectPanel(title, text) {
  return `
<div class="v-panel">
  <h3>${esc(title)}</h3>
  ${text ? `<p>${esc(text)}</p>` : ''}
</div>`
}

// a school station: story line, photo wall (tap a photo to enlarge), footer
export function stationPanel(st) {
  const photos = (st.photos || []).map((src, i) => `
  <figure class="v-photo"><img src="${esc(src)}" alt="${esc(st.name)} ${i + 1}" loading="lazy" data-zoom></figure>`).join('')
  return `
<div class="v-panel v-station">
  <h3>${esc(st.name)}</h3>
  ${st.text ? `<p>${esc(st.text)}</p>` : ''}
  ${(st.lines || []).map(l => `<p class="v-line">${esc(l)}</p>`).join('')}
  ${photos ? `<div class="v-photos">${photos}</div>` : ''}
  ${st.footer ? `<p class="v-footer">${esc(st.footer)}</p>` : ''}
</div>`
}

// a lab table: the courses taken in that field, as chips (optionally grouped)
export function labPanel(t) {
  const chips = (list) => `<div class="v-chips">${(list || []).map(c => `<span class="v-chip">${esc(c)}</span>`).join('')}</div>`
  const body = t.groups
    ? t.groups.map(g => `<h4>${esc(g.title)}</h4>${chips(g.courses)}`).join('')
    : chips(t.courses)
  return `
<div class="v-panel v-lab">
  <h3>${esc(t.name)}</h3>
  ${t.text ? `<p>${esc(t.text)}</p>` : ''}
  ${body}
</div>`
}

// one line per row (the big book's pages)
export function linesPanel(obj) {
  return `
<div class="v-panel">
  <h3>${esc(obj.title)}</h3>
  ${(obj.lines || []).map(l => `<p class="v-line">${esc(l)}</p>`).join('')}
</div>`
}

// the secret memory, revealed — a red heart for those who truly know him
export function memoryReveal(obj) {
  return `
<div class="v-panel v-memory-open">
  <h3>${esc(obj.title)}</h3>
  <div class="v-heart" aria-label="a red heart">❤</div>
  ${obj.text ? `<p>${esc(obj.text)}</p>` : ''}
</div>`
}

// name + note rows (the music corner's instruments)
export function itemsPanel(obj) {
  const rows = (obj.items || []).map(i => `
  <h4>${esc(i.name)}</h4><p>${esc(i.note)}</p>`).join('')
  return `
<div class="v-panel">
  <h3>${esc(obj.title)}</h3>
  ${obj.text ? `<p>${esc(obj.text)}</p>` : ''}${rows}
</div>`
}

export function laptopPanel(obj) {
  return `
<div class="v-panel">
  <h3>${esc(obj.title)}</h3>
  <h4>FAVOURITE GAMES</h4><p>${obj.favorites.map(esc).join(' · ')}</p>
  <h4>OFTEN PLAYED</h4><p>${obj.often.map(esc).join(' · ')}</p>
  <h4>AWARD</h4><p>★ ${esc(obj.award)}</p>
</div>`
}

export function tvPanel(obj) {
  return `
<div class="v-panel">
  <h3>${esc(obj.title)}</h3>
  <ul>${obj.shows.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
  ${obj.footer ? `<p class="v-dim">${esc(obj.footer)}</p>` : ''}
</div>`
}

export function shelvesPanel(obj) {
  return `
<div class="v-panel">
  <h3>${esc(obj.title)}</h3>
  ${(obj.books || []).map(b => `<h4>${esc(b)}</h4>`).join('')}
  ${obj.text ? `<p>${esc(obj.text)}</p>` : ''}
</div>`
}

// tiny pixel-style SVG covers until David hands over real box photos
const GAME_COVERS = {
  '马尼拉': `<svg viewBox="0 0 24 24"><rect width="24" height="24" fill="#3f6fae"/><rect y="16" width="24" height="8" fill="#2b4d80"/><path d="M4 16 L12 16 L10 20 L6 20 Z" fill="#8a5a38"/><rect x="7" y="8" width="1" height="8" fill="#4a3826"/><path d="M8 8 L14 12 L8 14 Z" fill="#f2e4c8"/><circle cx="19" cy="5" r="2" fill="#ffd93b"/></svg>`,
  '波多黎各': `<svg viewBox="0 0 24 24"><rect width="24" height="24" fill="#5da05d"/><rect y="14" width="24" height="4" fill="#4c8a46"/><rect y="20" width="24" height="4" fill="#4c8a46"/><rect x="14" y="6" width="7" height="6" fill="#e8cfa8"/><path d="M13 6 L17.5 2 L22 6 Z" fill="#b95d4d"/><circle cx="5" cy="5" r="2.4" fill="#ffd93b"/></svg>`,
  '纽约之王': `<svg viewBox="0 0 24 24"><rect width="24" height="24" fill="#1c2438"/><rect x="2" y="10" width="4" height="14" fill="#3d4a6b"/><rect x="8" y="6" width="4" height="18" fill="#2b3550"/><rect x="18" y="9" width="4" height="15" fill="#3d4a6b"/><rect x="12" y="10" width="6" height="14" rx="2" fill="#4f9d5d"/><circle cx="14" cy="13" r="1" fill="#ffd93b"/><circle cx="17" cy="13" r="1" fill="#ffd93b"/><path d="M12 10 L13 7 L14.5 9.5 L16 7 L17 10 Z" fill="#4f9d5d"/></svg>`,
  '骆驼大赛': `<svg viewBox="0 0 24 24"><rect width="24" height="24" fill="#e8c88a"/><path d="M2 24 L10 10 L18 24 Z" fill="#d9a441"/><rect x="12" y="14" width="8" height="4" rx="1.6" fill="#c97a3d"/><rect x="13" y="10" width="8" height="4" rx="1.6" fill="#ffd93b"/><rect x="18" y="16" width="1.6" height="6" fill="#c97a3d"/><rect x="13.4" y="16" width="1.6" height="6" fill="#c97a3d"/><rect x="20" y="11" width="2.4" height="3" fill="#ffd93b"/></svg>`,
  '山中小屋': `<svg viewBox="0 0 24 24"><rect width="24" height="24" fill="#141a2a"/><circle cx="19" cy="5" r="2.6" fill="#e8ecf4"/><path d="M0 24 L8 12 L16 24 Z" fill="#232c42"/><rect x="9" y="9" width="8" height="8" fill="#3a2c1c"/><path d="M8 9 L13 4 L18 9 Z" fill="#2b2118"/><rect x="12" y="12" width="2" height="2" fill="#ffd93b"/><rect x="12" y="14" width="2" height="3" fill="#1c1408"/></svg>`
}
export function gamesPanel(obj) {
  const cards = (obj.games || []).map(g => `
  <figure class="v-game">${g.img ? `<img src="${esc(g.img)}" alt="${esc(g.name)}" loading="lazy">` : (GAME_COVERS[g.name] || '')}<figcaption>${esc(g.name)}</figcaption></figure>`).join('')
  return `
<div class="v-panel">
  <h3>${esc(obj.title)}</h3>
  ${obj.text ? `<p>${esc(obj.text)}</p>` : ''}
  <div class="v-games">${cards}</div>
</div>`
}

// the travelling world map: stops → (countries open into cities) → photos
const photoGrid = (photos, alt) => (photos || []).length
  ? `<div class="v-photos">${photos.map((src, i) => `<figure class="v-photo"><img src="${esc(src)}" alt="${esc(alt)} ${i + 1}" loading="lazy" data-zoom></figure>`).join('')}</div>`
  : '<p class="v-dim">Photos coming.</p>'
export function worldmapView(obj, view = {}) {
  const stops = obj.stops || []
  const chip = (s, attrs) => `<button class="v-chip v-place${s.later ? ' later' : ''}${s.places ? ' group' : ''}" ${attrs}${s.later ? ' disabled' : ''}>${esc(s.place)}${s.when ? ` <span class="v-dim">${esc(s.when)}</span>` : ''}${s.places ? ' ›' : ''}</button>`
  if (view.group != null) {
    const g = stops[view.group]
    if (view.place != null) {
      const pl = g.places[view.place]
      return `<p class="v-crumbs"><button class="v-link" data-wm-back="root">World</button> › <button class="v-link" data-wm-group="${view.group}">${esc(g.place)}</button> › <b>${esc(pl.place)}</b>${pl.when ? ` <span class="v-dim">${esc(pl.when)}</span>` : ''}</p>${photoGrid(pl.photos, pl.place)}`
    }
    return `<p class="v-crumbs"><button class="v-link" data-wm-back="root">World</button> › <b>${esc(g.place)}</b></p>
  <div class="v-chips">${g.places.map((pl, j) => chip(pl, `data-wm-group="${view.group}" data-wm-place="${j}"`)).join('')}</div>`
  }
  if (view.stop != null) {
    const st = stops[view.stop]
    return `<p class="v-crumbs"><button class="v-link" data-wm-back="root">World</button> › <b>${esc(st.place)}</b>${st.when ? ` <span class="v-dim">${esc(st.when)}</span>` : ''}</p>${photoGrid(st.photos, st.place)}`
  }
  return `<div class="v-chips">${stops.map((st, i) => chip(st, st.places ? `data-wm-group="${i}"` : `data-wm-stop="${i}"`)).join('')}</div>`
}
export function worldmapPanel(obj, view = {}) {
  return `
<div class="v-panel v-worldmap">
  <h3>${esc(obj.title)}</h3>
  ${obj.text ? `<p>${esc(obj.text)}</p>` : ''}
  <div class="v-wm">${worldmapView(obj, view)}</div>
</div>`
}

// a pet, clicked: its name, its line, and the family's shared album
export function petPanel(pet, album) {
  return `
<div class="v-panel v-station v-pet">
  <h3>${esc(pet.name)}</h3>
  ${pet.line ? `<p>${esc(pet.line)}</p>` : ''}
  ${album && album.photos && album.photos.length ? `<h4>${esc(album.title || 'The pets')}</h4>${photoGrid(album.photos, album.title || 'pets')}` : ''}
</div>`
}

// the picture board's lock: four digits, the hint is David's
export function boardGate(hint) {
  return `
<div class="v-panel v-gate">
  <h3>PICTURE BOARD</h3>
  <p>Locked.</p>
  <div class="v-code">
    ${[0, 1, 2, 3].map(i => `<input inputmode="numeric" maxlength="1" data-d="${i}" aria-label="digit ${i + 1}">`).join('')}
  </div>
  <p class="v-dim">hint: ${esc(hint || '')}</p>
  <p class="v-actions"><button class="v-btn" data-try-board>open</button></p>
  <p class="v-nudge2" hidden>not that — month, then day.</p>
</div>`
}
// the picture board, unlocked: sections → photos (Future.... stays shut)
export function boardView(obj, view = {}) {
  const secs = obj.sections || []
  if (view.section != null) {
    const sec = secs[view.section]
    return `<p class="v-crumbs"><button class="v-link" data-pb-back>Board</button> › <b>${esc(sec.title)}</b></p>${photoGrid(sec.photos, sec.title)}`
  }
  return `<div class="v-chips">${secs.map((sec, i) => `<button class="v-chip v-place${sec.later ? ' later' : ' group'}" data-pb-section="${i}"${sec.later ? ' disabled' : ''}>${esc(sec.title)}</button>`).join('')}</div>`
}
export function boardPanel(obj, view = {}) {
  return `
<div class="v-panel v-station v-pboard">
  <h3>${esc(obj.title)}</h3>
  ${obj.text ? `<p>${esc(obj.text)}</p>` : ''}
  <div class="v-pb">${boardView(obj, view)}</div>
</div>`
}

export function musicboxPanel(obj) {
  const chips = (list, cls = '') => list.map(x => `<span class="v-chip ${cls}">${esc(x)}</span>`).join('')
  const albums = (obj.albums || []).map(a => `
    <figure class="v-album"><img src="${esc(a.img)}" alt="${esc(a.title || 'album cover')}" loading="lazy">${a.title ? `<figcaption>${esc(a.title)}</figcaption>` : ''}</figure>`).join('')
  return `
<div class="v-panel v-musicbox">
  <h3>${esc(obj.title)}</h3>
  ${obj.text ? `<p>${esc(obj.text)}</p>` : ''}
  ${obj.lyric ? `<p class="v-lyric">♪ “${esc(obj.lyric)}”</p>` : ''}
  ${obj.genres?.length ? `<h4>THE SOUNDS</h4><div class="v-chips">${chips(obj.genres)}</div>` : ''}
  ${obj.artists?.length ? `<h4>FAVOURITE ARTISTS</h4><div class="v-chips">${chips(obj.artists, 'star')}</div>` : ''}
  ${obj.loves?.length ? `<h4>I LOVE THEIR MUSIC</h4><p class="v-loves">${obj.loves.map(esc).join(' · ')}</p>` : ''}
  <h4>FAVOURITE ALBUMS</h4>
  ${albums ? `<div class="v-albums">${albums}</div>` : '<p class="v-dim">(the covers are on their way — David is handing over the pictures)</p>'}
</div>`
}

export function jerseysPanel(obj) {
  const cards = (obj.items || []).map(j => {
    const bg = j.body2
      ? `repeating-linear-gradient(90deg, ${esc(j.body)} 0 10px, ${esc(j.body2)} 10px 20px)`
      : esc(j.body || '#c8332a')
    return `
  <div class="v-jersey">
    <span class="v-jshirt-wrap"><i class="v-jshirt" style="background:${bg};color:${esc(j.numColor || '#fff')};border-color:${esc(j.trim || '#fff')}">${esc(String(j.number))}</i></span>
    <b>${esc(j.name)}</b>
    <small>${esc(j.team)} · #${esc(String(j.number))}</small>
  </div>`
  }).join('')
  return `
<div class="v-panel">
  <h3>${esc(obj.title)}</h3>
  ${obj.text ? `<p>${esc(obj.text)}</p>` : ''}
  <div class="v-jerseys">${cards}</div>
</div>`
}

export function memoryGate(question) {
  return `
<div class="v-panel">
  <h3>SECRET MEMORY</h3>
  <p>The placard is locked. It asks only one thing:</p>
  <p><b>${esc(question)}</b></p>
  <input class="v-answer" aria-label="Your answer" placeholder="your answer…">
  <p class="v-actions"><button class="v-btn" data-try-memory>answer</button></p>
  <p class="v-nudge2" hidden>not quite — think of what people call him…</p>
</div>`
}

export function docsPanel(documents, toBeContinued = '') {
  const rows = documents.map(d => {
    const paras = (d.paragraphs || []).filter(Boolean)
    const body = paras.length
      ? paras.map(t => `<p>${esc(t)}</p>`).join('')
      : `<p class="v-dim">${esc(d.note || 'Still being written.')}</p>`
    return `
  <details class="v-doc"><summary>${esc(d.title)}</summary><div class="v-doc-body">${body}</div></details>`
  }).join('')
  return `
<div class="v-panel v-docs">
  <h3>THE DOCUMENT SHELVES</h3>
  ${rows}
  ${toBeContinued ? `<p class="v-dim v-tbc">${esc(toBeContinued)}</p>` : ''}
</div>`
}

// the quiz prize: a little flip-book, one picture per page
export function prizePanel(prize = {}) {
  const photos = prize.photos || []
  if (!photos.length) {
    return `
<div class="v-panel">
  <h3>★ 3 / 3 — YOU REALLY KNOW HIM ★</h3>
  <p>The librarian slides something across the desk: your prize picture.</p>
  <p class="v-dim">(Consider this your claim ticket.)</p>
</div>`
  }
  return `
<div class="v-panel v-prize">
  <h3>★ 3 / 3 — YOU REALLY KNOW HIM ★</h3>
  <p>The librarian slides a little album across the desk.</p>
  <div class="v-book" data-page="0" data-pages="${photos.length}">
    ${photos.map((src, i) => `<figure class="v-page${i === 0 ? ' on' : ''}" data-i="${i}"><img src="${esc(src)}" alt="prize picture ${i + 1}" loading="eager"></figure>`).join('')}
  </div>
  <p class="v-actions v-book-nav">
    <button class="v-btn ghost" data-page-prev disabled>‹ prev</button>
    <span class="v-dim" data-page-label>1 / ${photos.length}</span>
    <button class="v-btn" data-page-next${photos.length < 2 ? ' disabled' : ''}>next ›</button>
  </p>
</div>`
}

export function dialogueBox(speaker, line, more) {
  return `
<div class="v-dialogue" role="dialog" aria-label="${esc(speaker)}">
  <b>${esc(speaker)}</b>
  <p>${esc(line)}</p>
  <span class="v-next">${more ? '▼' : '■'}</span>
</div>`
}

export function letterPanel(email) {
  return `
<div class="v-panel">
  <h3>WRITE DAVID A LETTER</h3>
  <p class="v-flavor">Pixel stationery, real delivery — it lands in his inbox.</p>
  <textarea class="v-letter" rows="6" placeholder="Dear David, …" aria-label="Your letter"></textarea>
  <p class="v-actions"><button class="v-btn" data-send data-email="${esc(email)}">send the letter ✉</button></p>
</div>`
}

export function quizQuestion(qz, index) {
  const q = qz[index]
  return `
<div class="v-panel">
  <h3>THE LIBRARIAN'S QUIZ — ${index + 1}/${qz.length}</h3>
  <p>${esc(q.q)}</p>
  <div class="v-options">
    ${q.options.map((o, i) => `<button class="v-btn ghost" data-answer="${i}">${esc(o)}</button>`).join('')}
  </div>
</div>`
}

export function arcadeStart(bestMs) {
  return `
<div class="v-panel arcade">
  <h3>— 15 —</h3>
  <p>Slide the numbered tiles into the empty space until they read 1 to 15 in
  order. Click a tile next to the gap — or use your arrow keys. The timer
  starts on your first move.</p>
  <p class="v-record">Middle School record — 26.00s</p>
  ${bestMs ? `<p class="v-dim">your best so far: ${(bestMs / 1000).toFixed(2)}s</p>` : ''}
  <p class="v-actions"><button class="v-btn" data-start>press start</button></p>
  <p class="v-dim">beat my record and win a secret prize.</p>
</div>`
}

export function arcadeBoard() {
  return `
<div class="v-panel arcade">
  <div class="v-hud"><span data-timer>0.00</span><span data-moves>0 moves</span></div>
  <div class="v-grid" role="grid" aria-label="15 puzzle"></div>
  <p class="v-dim v-help">arrows slide tiles · click works too</p>
</div>`
}

export function arcadeWin({ timeMs, moves, code, beat, email, letter }) {
  const t = (timeMs / 1000).toFixed(2)
  if (!beat) {
    return `
<div class="v-panel arcade">
  <h3>SOLVED — ${t}s</h3>
  <p>${esc(moves)} moves. The machine hums approvingly. 26.00 still stands.</p>
  <p class="v-actions"><button class="v-btn" data-again>again</button><button class="v-btn ghost" data-close-arcade>step away</button></p>
</div>`
  }
  const L = letter || {}
  const letterHtml = L.paragraphs ? `
  <div class="v-letter">
    <p class="v-letter-greet">${esc(L.greeting || '')}</p>
    ${L.paragraphs.map(t => `<p>${esc(t)}</p>`).join('')}
    <p class="v-letter-sign">${esc(L.signoff || '')}<br>${esc(L.signature || '')}</p>
  </div>` : ''
  return `
<div class="v-panel arcade win">
  <h3>★ NEW RECORD — ${t}s ★</h3>
  <p class="v-ticket">TIME ${t}s · MOVES ${esc(moves)} · CODE ${esc(code)}</p>
  ${letterHtml}
  <p class="v-actions">
    <a class="v-btn" data-claim href="mailto:${esc(email)}?subject=${encodeURIComponent('I beat your record')}&body=${encodeURIComponent(`My ticket: TIME ${t}s · MOVES ${moves} · CODE ${code}\n\n(screenshot attached)\n\nMy address:\n`)}">send David the screenshot</a>
    <button class="v-btn ghost" data-close-arcade>walk away a legend</button>
  </p>
</div>`
}

export function toast(text) {
  return `<div class="v-toast">${esc(text)}</div>`
}

export function shareCard(pngDataUrl) {
  return `
<div class="v-panel win-all">
  <h3>★ YOU FOUND ALL OF IT ★</h3>
  <p>Every quest, every corner. David officially likes you.</p>
  <img class="v-share-img" src="${pngDataUrl}" alt="I made it into David's world — pixel postcard">
  <p class="v-actions">
    <a class="v-btn" href="${pngDataUrl}" download="davids-world-postcard.png">keep the postcard</a>
    <button class="v-btn ghost" data-close-share>back to town</button>
  </p>
</div>`
}

export function questLog(ids, labels, isDone) {
  return `
<div class="v-panel">
  <h3>QUESTS — WELCOME HOME</h3>
  <ul class="v-quests">
    ${ids.map(id => `<li class="${isDone(id) ? 'done' : ''}">${isDone(id) ? '■' : '□'} ${esc(labels[id])}</li>`).join('')}
  </ul>
</div>`
}
