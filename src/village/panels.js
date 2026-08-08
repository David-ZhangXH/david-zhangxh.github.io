// DOM builders for village UI: interiors, dialogue, letter, quiz, arcade, ticket.
// Pixel-styled, accessible, pure string builders.
import { esc } from '../core/html.js'

export function objectPanel(title, text) {
  return `
<div class="v-panel">
  <h3>${esc(title)}</h3>
  <p>${esc(text)}</p>
</div>`
}

export function worldmapPanel(obj) {
  const stops = (obj.stops || []).map(s => `<li><b>${esc(s.place)}</b> <span class="v-dim">${esc(s.when || '')}</span></li>`).join('')
  return `
<div class="v-panel">
  <h3>${esc(obj.title)}</h3>
  <p>${esc(obj.text)}</p>
  ${stops ? `<ul>${stops}</ul>` : ''}
  <p class="v-dim">(pictures pinned to places — coming as David adds them)</p>
</div>`
}

export function musicboxPanel(obj) {
  const chips = (list, cls = '') => list.map(x => `<span class="v-chip ${cls}">${esc(x)}</span>`).join('')
  const albums = (obj.albums || []).map(a => `
    <figure class="v-album"><img src="${esc(a.img)}" alt="${esc(a.title || 'album cover')}" loading="lazy">${a.title ? `<figcaption>${esc(a.title)}</figcaption>` : ''}</figure>`).join('')
  return `
<div class="v-panel v-musicbox">
  <h3>${esc(obj.title)}</h3>
  <p>${esc(obj.text)}</p>
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
  <p>${esc(obj.text)}</p>
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

export function docsPanel(documents) {
  const rows = documents.map(d => `
  <details><summary>${esc(d.title)}</summary><p>${esc(d.note || '')}</p></details>`).join('')
  return `
<div class="v-panel">
  <h3>THE DOCUMENT SHELVES</h3>
  <p class="v-flavor">Important documents from David's life — pull out whichever interests you.</p>
  ${rows}
</div>`
}

export function prizePanel() {
  return `
<div class="v-panel">
  <h3>★ 3 / 3 — YOU REALLY KNOW HIM ★</h3>
  <p>The librarian slides something across the desk: your prize picture.</p>
  <p class="v-dim">(David is still choosing the picture — it will appear here. Consider this your claim ticket.)</p>
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

export function arcadeWin({ timeMs, moves, code, beat, email }) {
  const t = (timeMs / 1000).toFixed(2)
  if (!beat) {
    return `
<div class="v-panel arcade">
  <h3>SOLVED — ${t}s</h3>
  <p>${esc(moves)} moves. The machine hums approvingly. 26.00 still stands.</p>
  <p class="v-actions"><button class="v-btn" data-again>again</button><button class="v-btn ghost" data-close-arcade>step away</button></p>
</div>`
  }
  return `
<div class="v-panel arcade win">
  <h3>★ NEW RECORD — ${t}s ★</h3>
  <p>You beat 26.00. The machine prints a small ticket:</p>
  <p class="v-ticket">TIME ${t}s · MOVES ${esc(moves)} · CODE ${esc(code)}</p>
  <p>Email it to David — he owes you a hand-written letter. He's good for it.</p>
  <p class="v-actions">
    <a class="v-btn" data-claim href="mailto:${esc(email)}?subject=${encodeURIComponent('I beat 26.00s')}&body=${encodeURIComponent(`My ticket: TIME ${t}s · MOVES ${moves} · CODE ${code}`)}">claim the letter</a>
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
