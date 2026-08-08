// Card HTML for galaxy bodies. Pure functions.
import { esc } from '../core/html.js'

const STATUS_LINE = {
  review: (w) => `${esc(w.venue || 'under review')}${w.year ? ' · ' + esc(w.year) : ''}`,
  published: (w) => esc(w.venue || w.year || 'published'),
  ongoing: () => 'in progress',
  paused: () => 'on hold'
}

export function workCard(w) {
  const status = (STATUS_LINE[w.status] || STATUS_LINE.ongoing)(w)
  const buttons = []
  if (w.link) buttons.push(`<a class="btn" href="${esc(w.link)}" target="_blank" rel="noopener">read it</a>`)
  if (w.pdf) buttons.push(`<a class="btn ghost" href="${esc(w.pdf)}" target="_blank" rel="noopener">PDF</a>`)
  return `
<div class="card body-card status-${esc(w.status)}">
  <p class="status">${status}</p>
  <h3>${esc(w.title)}</h3>
  ${w.description ? `<p>${esc(w.description)}</p>` : ''}
  ${buttons.length ? `<p class="actions">${buttons.join(' ')}</p>` : ''}
</div>`
}

export function ideasCard(topics, email) {
  const blocks = topics.map(t => `
  <details>
    <summary>${esc(t.topic)}</summary>
    <ul>${t.ideas.map(d => `<li><b>${esc(d.title)}</b>${d.note ? ` — ${esc(d.note)}` : ''}</li>`).join('')}</ul>
  </details>`).join('\n')
  return `
<div class="card ideas-card">
  <p class="status">you found the idea nebula ✦</p>
  <h3>Where the unformed things drift</h3>
  <p>Ideas that aren't papers yet — some academic, some just sparks. Most visitors never see this place.</p>
  ${blocks}
  <p class="idea-invite">Carrying an interesting academic idea of your own? Leave it here — it drifts straight to me.</p>
  <textarea class="idea-input" rows="3" maxlength="600" placeholder="your idea, rough is fine" aria-label="Your idea"></textarea>
  <p class="actions"><button class="btn" data-send-idea data-email="${esc(email || '')}">send it into the nebula</button></p>
</div>`
}
