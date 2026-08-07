// The all-quests reward: a pixel postcard rendered to a real PNG.
export function drawShareCard(dateStr) {
  const c = document.createElement('canvas')
  c.width = 600; c.height = 400
  const g = c.getContext('2d')
  g.imageSmoothingEnabled = false

  // sky + ground
  const sky = g.createLinearGradient(0, 0, 0, 200)
  sky.addColorStop(0, '#8fd3ff'); sky.addColorStop(1, '#bfe6ff')
  g.fillStyle = sky; g.fillRect(0, 0, 600, 220)
  g.fillStyle = '#57a94f'; g.fillRect(0, 220, 600, 180)
  g.fillStyle = '#d9b36c'; g.fillRect(260, 220, 80, 180)

  const px = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y, w, h) }
  // tiny town silhouette
  px(60, 150, 120, 70, '#b95d4d'); px(50, 130, 140, 24, '#7a3d33'); px(105, 100, 30, 34, '#b95d4d')
  px(420, 150, 130, 70, '#cdd6e4'); px(410, 138, 150, 16, '#7c8aa5')
  px(110, 180, 20, 40, '#5b3220'); px(470, 180, 20, 40, '#3a4560')
  // sun
  g.fillStyle = '#ffe58a'; g.beginPath(); g.arc(520, 60, 26, 0, 7); g.fill()
  // the player
  px(292, 250, 16, 8, '#2b2b2b'); px(292, 258, 16, 12, '#f2c69a'); px(290, 270, 20, 16, '#3a6ea8')
  px(292, 286, 8, 12, '#2b3550'); px(300, 286, 8, 12, '#2b3550')
  // banner
  px(70, 310, 460, 60, '#f7ecd7')
  g.strokeStyle = '#2b3550'; g.lineWidth = 6; g.strokeRect(70, 310, 460, 60)
  g.fillStyle = '#2b3550'
  g.font = 'bold 24px monospace'
  g.textAlign = 'center'
  g.fillText('I MADE IT INTO DAVID’S WORLD', 300, 336)
  g.font = '14px monospace'
  g.fillText(`all five quests — ${dateStr}`, 300, 358)
  g.textAlign = 'left'
  g.font = 'bold 16px monospace'
  g.fillStyle = '#2b3550'
  g.fillText('★★★★★', 262, 244)

  return c.toDataURL('image/png')
}
