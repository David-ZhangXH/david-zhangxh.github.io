// DOM builders for village UI: interiors, dialogue, letter, quiz, arcade, ticket.
// Pixel-styled, accessible, pure string builders.
import { esc } from '../core/html.js'

export function storiesPanel(title, entries, flavor = '') {
  return `
<div class="v-panel">
  <h3>${esc(title)}</h3>
  ${flavor ? `<p class="v-flavor">${esc(flavor)}</p>` : ''}
  ${entries.map(e => `<div class="v-story"><h4>${esc(e.title)}</h4><p>${esc(e.text)}</p></div>`).join('')}
</div>`
}

export function labPanel(projects) {
  return `
<div class="v-panel">
  <h3>THE LAB</h3>
  <p class="v-flavor">Machines mid-experiment. Some hum along; some sleep under dust covers.</p>
  ${projects.map(p => `
  <div class="v-story ${p.status === 'paused' ? 'dusty' : ''}">
    <h4>${esc(p.title)} ${p.status === 'paused' ? '<span class="v-tag">asleep</span>' : '<span class="v-tag on">running</span>'}</h4>
    <p>${esc(p.description || '')}</p>
  </div>`).join('')}
  <p class="v-flavor">In the corner, an old arcade cabinet hums. No markings on it at all.</p>
</div>`
}

export function libraryPanel(works, writings) {
  const shelf = works.map(w => `<li>${esc(w.title)} <span class="v-dim">${esc(w.venue || (w.status === 'review' ? 'under review' : ''))}</span></li>`).join('')
  const wing = writings.map(w => `<li>${esc(w.title)} <span class="v-dim">${esc(w.date)}</span></li>`).join('')
  return `
<div class="v-panel">
  <h3>THE LIBRARY</h3>
  <p class="v-flavor">Everything written-by-David, shelved with care.</p>
  <h4>Research shelf</h4><ul>${shelf}</ul>
  <h4>Writing wing</h4><ul>${wing || '<li class="v-dim">more coming soon…</li>'}</ul>
  <p class="v-actions"><button class="v-btn" data-quiz>take the librarian's quiz</button></p>
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
  <p class="v-flavor">The screen flickers to life. Only now does it show:</p>
  <p class="v-record">record to beat — 26.00s<br><span class="v-dim">set in middle school</span></p>
  ${bestMs ? `<p class="v-dim">your best this town: ${(bestMs / 1000).toFixed(2)}s</p>` : ''}
  <p class="v-actions"><button class="v-btn" data-start>press start</button></p>
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
