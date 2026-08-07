export const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export const LINK_LABELS = { github: 'GitHub', scholar: 'Google Scholar', linkedin: 'LinkedIn' }
