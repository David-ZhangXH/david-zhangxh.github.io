// Card HTML for galaxy bodies. Pure functions.
import { esc } from '../core/html.js'

const STATUS_LINE = {
  review: (w) => `igniting star — ${esc(w.venue || 'under review')} · ${esc(w.year || '')}`,
  published: (w) => `${esc(w.venue || 'published')}${w.year ? ' · ' + esc(w.year) : ''}`,
  ongoing: () => 'in progress — still condensing',
  paused: () => 'dormant nebula — paused for time, not interest'
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

export function ideasCard(topics) {
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
</div>`
}
