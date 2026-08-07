// Programmatic pixel art in the concept-board-03 palette. Every sprite is an
// offscreen canvas drawn once at native pixel size; the renderer scales them.

const P = {
  grass: '#57a94f', grassDark: '#4a9243', path: '#d9b36c', pathEdge: '#c29a54',
  treeTrunk: '#6e4534', treeLeaf: '#2f7a3a', treeLeafHi: '#3f9a4a',
  schoolWall: '#b95d4d', schoolRoof: '#7a3d33', homeWall: '#c98a5b', homeRoof: '#8a4a3b',
  labWall: '#cdd6e4', labRoof: '#7c8aa5', libWall: '#b9805a', libRoof: '#6e4534',
  door: '#5b3220', doorLight: '#f7ecd7', window: '#ffe58a', frame: '#3a2a1a',
  sign: '#ffd27a', signText: '#22304a', paper: '#f7ecd7', ink: '#2b3550'
}

function cv(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const g = c.getContext('2d')
  g.imageSmoothingEnabled = false
  draw(g)
  return c
}
const rect = (g, x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y, w, h) }

function facade(g, w, h, wall, roof, opts = {}) {
  const roofH = Math.floor(h * 0.38)
  rect(g, 0, roofH, w, h - roofH, wall)
  // roof with a one-pixel overhang
  rect(g, -0, 0, w, roofH, roof)
  rect(g, 0, roofH - 2, w, 2, P.frame)
  // door
  const dw = 14, dx = opts.doorX ?? Math.floor(w / 2 - dw / 2)
  rect(g, dx, h - 22, dw, 22, P.door)
  rect(g, dx + 2, h - 20, 10, 12, P.doorLight)
  // windows
  const wy = roofH + 8
  for (const wx of opts.windows || []) {
    rect(g, wx, wy, 12, 12, P.window)
    rect(g, wx - 1, wy - 1, 14, 1, P.frame); rect(g, wx - 1, wy + 12, 14, 1, P.frame)
    rect(g, wx - 1, wy, 1, 12, P.frame); rect(g, wx + 12, wy, 1, 12, P.frame)
  }
  if (opts.sign) {
    const sw = opts.sign.length * 6 + 8
    const sx = Math.floor(w / 2 - sw / 2)
    rect(g, sx, roofH + 2, sw, 11, P.sign)
    g.fillStyle = P.signText
    g.font = 'bold 8px monospace'
    g.fillText(opts.sign, sx + 4, roofH + 11)
  }
}

export function makeSprites() {
  const S = {}

  S.grass = cv(16, 16, (g) => {
    rect(g, 0, 0, 16, 16, P.grass)
    rect(g, 3, 4, 2, 1, P.grassDark); rect(g, 11, 9, 2, 1, P.grassDark); rect(g, 6, 13, 2, 1, P.grassDark)
  })
  S.path = cv(16, 16, (g) => {
    rect(g, 0, 0, 16, 16, P.path)
    rect(g, 2, 3, 1, 1, P.pathEdge); rect(g, 12, 7, 2, 1, P.pathEdge); rect(g, 6, 12, 1, 1, P.pathEdge)
  })
  S.tree = cv(16, 24, (g) => {
    rect(g, 6, 16, 4, 8, P.treeTrunk)
    rect(g, 2, 4, 12, 13, P.treeLeaf)
    rect(g, 4, 2, 8, 4, P.treeLeaf)
    rect(g, 4, 5, 4, 3, P.treeLeafHi)
  })

  // buildings at their footprint sizes (tiles × 16, one extra row tall for depth)
  S.school = cv(160, 112, (g) => {
    facade(g, 160, 112, P.schoolWall, P.schoolRoof, { windows: [22, 122], sign: 'SCHOOL' })
    // bell tower
    rect(g, 68, -0, 24, 22, P.schoolWall)
    rect(g, 64, 0, 32, 6, P.schoolRoof)
    rect(g, 76, 10, 8, 8, P.window)
  })
  S.home = cv(160, 96, (g) => facade(g, 160, 96, P.homeWall, P.homeRoof, { windows: [22, 122], sign: 'HOME' }))
  S.lab = cv(176, 112, (g) => {
    facade(g, 176, 112, P.labWall, P.labRoof, { windows: [22, 138], sign: 'LAB' })
    // a flask in the window
    rect(g, 26, 52, 4, 8, '#4fd1a1'); rect(g, 142, 52, 4, 8, '#ff8fa3')
  })
  S.library = cv(176, 96, (g) => {
    facade(g, 176, 96, P.libWall, P.libRoof, { windows: [22, 138], sign: 'LIBRARY' })
    // books in the windows
    rect(g, 23, 46, 3, 9, '#c05d5d'); rect(g, 27, 46, 3, 9, '#4f7fbf'); rect(g, 31, 46, 3, 9, '#d9a441')
    rect(g, 139, 46, 3, 9, '#5da05d'); rect(g, 143, 46, 3, 9, '#8a5db0')
  })

  S.mailbox = cv(16, 24, (g) => {
    rect(g, 7, 12, 3, 12, P.treeTrunk)
    rect(g, 3, 4, 11, 9, '#d95d5d')
    rect(g, 4, 6, 6, 2, P.paper)
  })
  S.arcade = cv(16, 28, (g) => {
    rect(g, 1, 2, 14, 26, '#2b3550')            // unmarked cabinet — no record on the surface
    rect(g, 3, 5, 10, 9, '#0e2a16')
    rect(g, 4, 6, 3, 3, '#7dde6a'); rect(g, 8, 6, 3, 3, '#7dde6a')
    rect(g, 4, 10, 3, 3, '#7dde6a'); rect(g, 8, 10, 3, 3, '#5da05d')
    rect(g, 4, 17, 3, 3, '#d95d5d'); rect(g, 9, 18, 4, 2, '#ffd93b')
  })
  S.coffee = cv(16, 24, (g) => {
    rect(g, 2, 4, 12, 20, '#8a8f9c')
    rect(g, 4, 7, 8, 5, '#3a2216')
    rect(g, 6, 14, 4, 4, '#d95d5d')
    rect(g, 5, 20, 6, 2, '#3a2216')
  })

  const person = (shirt, hair) => {
    const frame = (step) => cv(16, 24, (g) => {
      rect(g, 4, 0, 8, 4, hair)
      rect(g, 4, 4, 8, 6, '#f2c69a')
      rect(g, 3, 10, 10, 8, shirt)
      if (step === 0) { rect(g, 4, 18, 3, 6, P.ink); rect(g, 9, 18, 3, 6, P.ink) }
      else { rect(g, 3, 18, 3, 6, P.ink); rect(g, 10, 18, 3, 6, P.ink) }
    })
    return [frame(0), frame(1)]
  }
  S.player = person('#3a6ea8', '#2b2b2b')
  S.npc1 = person('#7a4f7f', '#8a4a3b')
  S.npc2 = person('#c05d5d', '#4a4a4a')

  return S
}
