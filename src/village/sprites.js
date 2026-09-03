// Village 2.0 sprite sheet — hand-drawn at pixel scale, Stardew-leaning:
// dark outlines, two-tone shading, warm palette. All programmatic, no assets.

const P = {
  outline: '#2a2019', grass: '#5aab52', grassHi: '#69bb5e', grassDk: '#4c9a46',
  flowerA: '#ffd93b', flowerB: '#ff8fa3', flowerC: '#e8ecf4',
  path: '#d9b36c', pathHi: '#e6c684', pathDk: '#c29a54',
  wood: '#8a5a38', woodDk: '#6e4530', plaster: '#f2e4c8', plasterDk: '#dcccae',
  roofA: '#b95d4d', roofAd: '#8f4437', roofB: '#7c8aa5', roofBd: '#5d6a85',
  roofC: '#8a6a4a', roofCd: '#6a4f36', roofD: '#6e8a5a', roofDd: '#527043',
  window: '#ffe58a', windowDk: '#d9b855', frame: '#4a3826',
  door: '#5b3220', doorHi: '#7a4a30',
  skin: '#f2c69a', hairD: '#2b2b2b', shirt: '#3a6ea8', shirtHi: '#4d84c2', pants: '#2b3550',
  floor: '#c99a62', floorDk: '#b8874f', wallHome: '#e8c8a0', wallSchool: '#c8d4e8',
  wallLab: '#d4e8dc', wallLib: '#e0d0b8', wallShadow: 'rgba(42,32,25,.25)',
  rug: '#b95d6d', rugHi: '#cd7484'
}

function cv(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const g = c.getContext('2d')
  g.imageSmoothingEnabled = false
  draw(g)
  return c
}
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h) }
// outlined box
const O = (g, x, y, w, h, c) => { R(g, x - 1, y - 1, w + 2, h + 2, P.outline); R(g, x, y, w, h, c) }

const prand = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

// ---------- town tiles ----------
function grassTile(seed) {
  return cv(16, 16, (g) => {
    R(g, 0, 0, 16, 16, P.grass)
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(prand(seed * 9 + i) * 14), y = Math.floor(prand(seed * 7 + i + 9) * 14)
      R(g, x, y, 2, 1, prand(seed + i) > 0.5 ? P.grassHi : P.grassDk)
    }
    if (prand(seed * 3) > 0.82) { // a flower
      const fx = 4 + Math.floor(prand(seed) * 8), fy = 4 + Math.floor(prand(seed + 5) * 8)
      const col = [P.flowerA, P.flowerB, P.flowerC][Math.floor(prand(seed + 2) * 3)]
      R(g, fx, fy, 2, 2, col); R(g, fx, fy + 2, 1, 2, P.grassDk)
    }
  })
}

function pathTile(seed) {
  return cv(16, 16, (g) => {
    R(g, 0, 0, 16, 16, P.path)
    R(g, 0, 0, 16, 1, P.pathHi)
    for (let i = 0; i < 3; i++) {
      R(g, Math.floor(prand(seed + i) * 13), Math.floor(prand(seed + i + 4) * 13), 2, 1, P.pathDk)
    }
  })
}

function tree() {
  return cv(32, 40, (g) => {
    O(g, 13, 28, 6, 10, P.woodDk)
    R(g, 14, 29, 2, 8, P.wood)
    O(g, 4, 8, 24, 20, '#2f7a3a')
    O(g, 8, 2, 16, 12, '#2f7a3a')
    R(g, 8, 10, 10, 6, '#3f9a4a')
    R(g, 10, 4, 8, 4, '#4fae59')
    R(g, 20, 16, 5, 4, '#256630')
  })
}

// ---------- building facades (footprint 8×5 tiles = 128×80, sprite 128×118) ----------
function facade({ wall, wallDk, roof, roofDk, sign, kind }) {
  return cv(128, 118, (g) => {
    const wallTop = 48
    // walls
    O(g, 2, wallTop, 124, 68, wall)
    R(g, 2, wallTop, 124, 4, wallDk)
    R(g, 2, 110, 124, 4, wallDk)
    // roof: shingle rows with overhang
    R(g, 0, 10, 128, 42, P.outline)
    for (let row = 0; row < 5; row++) {
      R(g, 2 + row, 12 + row * 8, 124 - row * 2, 7, row % 2 ? roofDk : roof)
    }
    R(g, 2, 46, 124, 4, roofDk)
    // door (tile 3 → px 48..64), arched, framed
    O(g, 46, 82, 22, 32, P.frame)
    R(g, 48, 84, 18, 30, P.door)
    R(g, 49, 85, 7, 28, P.doorHi)
    R(g, 62, 98, 2, 3, P.window) // knob
    // windows with frames + boxes
    for (const wx of [14, 92]) {
      O(g, wx, 62, 20, 18, P.frame)
      R(g, wx + 2, 64, 16, 14, P.window)
      R(g, wx + 2, 64, 16, 4, '#fff2c8')
      R(g, wx + 9, 64, 2, 14, P.frame)
      if (kind === 'home') { R(g, wx, 81, 20, 4, P.woodDk); R(g, wx + 3, 79, 3, 3, P.flowerB); R(g, wx + 12, 79, 3, 3, P.flowerA) }
    }
    // sign
    if (sign) {
      const sw = sign.length * 7 + 14
      O(g, 64 - sw / 2, 50, sw, 13, '#ffd27a')
      g.fillStyle = '#22304a'
      g.font = 'bold 9px monospace'
      g.textAlign = 'center'
      g.fillText(sign, 64, 60)
      g.textAlign = 'left'
    }
    // per-building charm
    if (kind === 'school') { // bell tower
      O(g, 52, 0, 24, 14, roof)
      R(g, 60, 4, 8, 8, P.window)
      R(g, 63, 6, 2, 4, P.outline)
    }
    if (kind === 'home') { O(g, 96, 0, 12, 14, wallDk); R(g, 98, 2, 8, 4, '#8a8f9c') } // chimney
    if (kind === 'lab') { O(g, 20, 0, 10, 12, '#8a8f9c'); R(g, 22, 2, 6, 3, '#b8c4d4') } // vent
    if (kind === 'library') { O(g, 14, 62, 20, 18, P.frame); R(g, 16, 64, 4, 14, '#c05d5d'); R(g, 21, 64, 4, 14, '#4f7fbf'); R(g, 26, 64, 4, 14, '#d9a441') }
  })
}

// ---------- characters (14×22, outlined, 2-frame) ----------
function person({ shirt, shirtHi, hair, skirt = false }) {
  const frame = (step) => cv(14, 22, (g) => {
    // legs
    if (step === 0) { O(g, 3, 17, 3, 4, P.pants); O(g, 8, 17, 3, 4, P.pants) }
    else { O(g, 2, 17, 3, 4, P.pants); O(g, 9, 17, 3, 4, P.pants) }
    // body
    O(g, 2, 10, 10, 8, shirt)
    R(g, 3, 11, 4, 6, shirtHi)
    if (skirt) R(g, 2, 16, 10, 2, P.outline)
    // head
    O(g, 2, 1, 10, 9, P.skin)
    // hair
    R(g, 2, 1, 10, 3, hair)
    R(g, 2, 3, 2, 3, hair)
    R(g, 10, 3, 2, 2, hair)
    R(g, 4, 1, 3, 1, '#5a5a5a' === hair ? '#7a7a7a' : '#00000022')
    // eyes
    R(g, 4, 5, 1, 2, P.outline); R(g, 9, 5, 1, 2, P.outline)
    // blush
    R(g, 3, 7, 1, 1, '#e8a088'); R(g, 10, 7, 1, 1, '#e8a088')
  })
  return [frame(0), frame(1)]
}

// ---------- town objects ----------
const mailbox = () => cv(18, 26, (g) => {
  O(g, 8, 12, 3, 13, P.woodDk)
  O(g, 2, 3, 14, 11, '#d95d5d')
  R(g, 3, 4, 12, 3, '#e87878')
  R(g, 4, 7, 8, 3, P.flowerC)
  R(g, 14, 1, 2, 5, '#ffd93b')
})

const arcade = () => cv(20, 32, (g) => {
  O(g, 1, 2, 18, 29, '#2b3550')
  R(g, 2, 3, 16, 3, '#3d4a6b')
  R(g, 3, 7, 14, 11, '#0e2a16')
  R(g, 5, 9, 4, 4, '#7dde6a'); R(g, 11, 9, 4, 4, '#7dde6a')
  R(g, 5, 14, 4, 3, '#5da05d'); R(g, 11, 14, 4, 3, '#7dde6a')
  R(g, 4, 21, 4, 4, '#d95d5d')
  R(g, 11, 22, 5, 2, '#ffd93b')
  R(g, 2, 28, 16, 2, '#1c2438')
})

// ---------- tiny pixel digit font (3×5) for jersey numbers ----------
const DIGITS = {
  0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'],
  2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '111', '001', '111'],
  4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'],
  6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'],
  8: ['111', '101', '111', '101', '111'], 9: ['111', '101', '111', '001', '111']
}
function digitAt(g, color, x, y, d) {
  const rows = DIGITS[d] || DIGITS[0]
  g.fillStyle = color
  rows.forEach((row, ry) => { for (let rx = 0; rx < 3; rx++) if (row[rx] === '1') g.fillRect(x + rx, y + ry, 1, 1) })
}
function numberAt(g, color, cx, y, n) { // centered on cx
  const ds = String(n).split('').map(Number)
  const w = ds.length * 3 + (ds.length - 1)
  let x = Math.round(cx - w / 2)
  for (const d of ds) { digitAt(g, color, x, y, d); x += 4 }
}

// ---------- furniture (interiors) — each object wears its signature ----------
const F = {}
// music box: open lid, brass crank, floating notes
F.musicbox = () => cv(20, 24, (g) => {
  O(g, 3, 14, 14, 8, P.wood); R(g, 4, 15, 12, 2, '#a06a42')
  O(g, 3, 10, 14, 3, P.woodDk)                       // open lid
  R(g, 5, 13, 10, 2, '#ffb3c8')                      // pink cylinder inside
  R(g, 7, 13, 1, 2, P.outline); R(g, 11, 13, 1, 2, P.outline)
  O(g, 16, 16, 3, 2, '#e8c060'); R(g, 18, 15, 1, 4, '#c9a86a') // crank
  // notes ♪ ♪
  R(g, 5, 4, 2, 2, '#2b3550'); R(g, 7, 0, 1, 5, '#2b3550'); R(g, 8, 0, 2, 1, '#2b3550')
  R(g, 12, 6, 2, 2, '#2b3550'); R(g, 14, 3, 1, 4, '#2b3550')
})
// TV: rabbit-ear antenna, glowing landscape, wooden legs
F.tv = () => cv(30, 30, (g) => {
  R(g, 14, 3, 1, 5, P.outline); R(g, 10, 0, 2, 1, P.outline); R(g, 11, 1, 2, 1, P.outline); R(g, 12, 2, 2, 1, P.outline)
  R(g, 18, 0, 2, 1, P.outline); R(g, 17, 1, 2, 1, P.outline); R(g, 16, 2, 2, 1, P.outline) // antenna V
  O(g, 3, 8, 24, 16, '#4a3826')                      // wooden shell
  R(g, 4, 9, 22, 2, '#5d4730')
  O(g, 6, 11, 15, 11, '#0f1626')                     // tube
  R(g, 7, 12, 13, 3, '#7adcf0')                      // sky
  R(g, 7, 15, 13, 4, '#3ec5e0')
  R(g, 7, 17, 13, 4, '#5da05d')                      // green hill
  R(g, 16, 13, 2, 2, '#ffe58a')                      // sun
  R(g, 23, 12, 2, 2, '#d95d5d'); R(g, 23, 16, 2, 2, '#c9a86a') // knobs
  R(g, 5, 24, 3, 4, P.outline); R(g, 22, 24, 3, 4, P.outline)  // legs
})
// gaming laptop: RGB keyboard rows, game on screen
F.laptop = () => cv(24, 22, (g) => {
  O(g, 2, 16, 20, 4, P.wood)                         // desk
  O(g, 5, 2, 14, 10, '#1c2438')                      // lid+screen
  R(g, 6, 3, 12, 8, '#101826')
  R(g, 7, 9, 3, 2, '#7dde6a'); R(g, 14, 5, 3, 2, '#d95d5d') // player vs enemy
  R(g, 7, 4, 5, 1, '#7dde6a'); R(g, 13, 4, 4, 1, '#d95d5d') // health bars
  O(g, 3, 12, 18, 4, '#2b3550')                      // base
  const rgb = ['#ff5d5d', '#ffb35d', '#ffe85d', '#7dde6a', '#5db8ff', '#b58aff']
  for (let i = 0; i < 6; i++) R(g, 5 + i * 2.4, 13, 2, 1, rgb[i]) // RGB keys
  for (let i = 0; i < 6; i++) R(g, 5 + i * 2.4, 14.5, 2, 1, rgb[(i + 3) % 6])
})
// music corner: guitar + upright piano + mic on stand
F.music_corner = () => cv(50, 30, (g) => {
  // guitar leaning: round body, sound hole, neck with head
  O(g, 2, 14, 12, 13, '#b9803d'); R(g, 4, 16, 8, 9, '#d09a55')
  R(g, 6, 19, 4, 4, P.outline)                       // sound hole
  R(g, 11, 3, 2, 14, '#6e4530'); O(g, 10, 0, 4, 4, '#4a3826') // neck + head
  R(g, 8, 18, 6, 1, '#e8d9b8')                       // strings hint
  // upright piano
  O(g, 18, 6, 18, 21, '#2b2118')
  R(g, 19, 7, 16, 3, '#3d2e20')
  R(g, 19, 16, 16, 4, '#f4efdf')                     // white keys
  for (const kx of [21, 24, 29, 32]) R(g, kx, 16, 2, 2, P.outline) // black keys
  R(g, 19, 21, 16, 1, '#3d2e20')
  R(g, 25, 11, 4, 3, '#e8d9b8')                      // sheet music
  // microphone on stand
  O(g, 43, 2, 4, 5, '#8a8f9c'); R(g, 44, 3, 2, 1, '#c4cede') // head
  R(g, 44, 7, 2, 15, P.outline)                      // pole
  R(g, 41, 22, 8, 2, P.outline); R(g, 40, 24, 3, 2, P.outline); R(g, 47, 24, 3, 2, P.outline) // tripod
})
// tall bookcase (right wall, 2 tiles high)
F.shelves = () => cv(22, 40, (g) => {
  O(g, 1, 1, 20, 37, P.wood); R(g, 2, 2, 18, 2, '#a06a42')
  const spineCols = ['#c05d5d', '#4f7fbf', '#d9a441', '#5da05d', '#8a5db0', '#c07d4d']
  for (const [row, y] of [[0, 5], [1, 14], [2, 23]]) {
    R(g, 2, y + 7, 18, 2, P.woodDk)                  // shelf plank
    let x = 3
    for (let i = 0; i < 5; i++) {
      const h = 6 + (i % 2)                          // uneven spines
      R(g, x, y + 7 - h, 3, h, spineCols[(row * 2 + i) % 6])
      x += 3.4
    }
  }
  R(g, 4, 33, 14, 3, '#e8d9b8'); R(g, 5, 34, 5, 1, '#8a8272') // bottom: papers
})
// picture board: white-framed polaroids + pins
F.board = () => cv(22, 24, (g) => {
  O(g, 1, 2, 20, 19, '#8a5a38'); R(g, 3, 4, 16, 15, '#d9b988') // cork
  // three polaroids (white frame, colored photo, red pin)
  O(g, 4, 5, 6, 7, '#ffffff'); R(g, 5, 6, 4, 4, '#7adcf0'); R(g, 5, 9, 4, 1, '#5da05d')
  O(g, 12, 6, 6, 7, '#ffffff'); R(g, 13, 7, 4, 4, '#f2c69a'); R(g, 14, 8, 1, 1, P.outline); R(g, 16, 8, 1, 1, P.outline)
  O(g, 8, 13, 6, 7, '#ffffff'); R(g, 9, 14, 4, 4, '#ffe58a'); R(g, 10, 15, 2, 2, '#ff8fa3')
  R(g, 6, 4, 1, 1, '#d95d5d'); R(g, 14, 5, 1, 1, '#d95d5d'); R(g, 10, 12, 1, 1, '#d95d5d') // pins
})
// memory placard: golden plaque with a keyhole
F.memory = () => cv(18, 24, (g) => {
  R(g, 8, 0, 2, 3, '#8a7a5a')                        // hanging nail
  O(g, 2, 3, 14, 18, '#e8c060'); R(g, 3, 4, 12, 16, '#c9a040')
  R(g, 4, 5, 10, 1, '#ffe9a8'); R(g, 4, 19, 10, 1, '#a07d2c') // bevel
  // keyhole: round head + flared stem
  R(g, 7, 8, 4, 4, P.outline); R(g, 8, 7, 2, 1, P.outline)
  R(g, 8, 12, 2, 3, P.outline); R(g, 7, 15, 4, 1, P.outline)
  R(g, 5, 18, 8, 1, '#a07d2c')                       // engraved line
})
// teddy bear
F.toy = () => cv(18, 20, (g) => {
  O(g, 3, 2, 4, 4, '#b98a5a'); O(g, 11, 2, 4, 4, '#b98a5a') // ears
  R(g, 4, 3, 2, 2, '#e8d0a8'); R(g, 12, 3, 2, 2, '#e8d0a8')
  O(g, 4, 4, 10, 8, '#b98a5a')                       // head
  R(g, 7, 8, 4, 3, '#e8d0a8')                        // muzzle
  R(g, 6, 6, 1, 1, P.outline); R(g, 11, 6, 1, 1, P.outline) // eyes
  R(g, 8, 9, 2, 1, P.outline)                        // nose
  O(g, 5, 12, 8, 6, '#b98a5a'); R(g, 7, 13, 4, 4, '#e8d0a8') // body + belly
  O(g, 2, 13, 3, 3, '#b98a5a'); O(g, 13, 13, 3, 3, '#b98a5a') // arms
})
// big life book: OPEN on a lectern, ribbon bookmark
F.bigbook = () => cv(26, 26, (g) => {
  O(g, 10, 16, 6, 8, P.woodDk); O(g, 7, 22, 12, 3, P.woodDk) // lectern
  O(g, 2, 4, 22, 12, '#7a3d3d')                      // cover under pages
  R(g, 3, 5, 9, 10, '#f4efdf'); R(g, 14, 5, 9, 10, '#f4efdf') // open pages
  R(g, 12, 5, 2, 10, '#d9c8a0')                      // spine gutter
  for (const y of [7, 9, 11]) { R(g, 4, y, 6, 1, '#8a8272'); R(g, 15, y, 6, 1, '#8a8272') } // text lines
  R(g, 13, 13, 1, 3, P.outline)                      // pen in the gutter
  R(g, 20, 15, 2, 6, '#d95d5d')                      // ribbon
})
// world map (left wall, 2 tiles high): continents, pins, dashed route
F.worldmap = () => cv(22, 38, (g) => {
  O(g, 1, 1, 20, 34, '#8a5a38'); R(g, 3, 3, 16, 30, '#9fd0e8')
  R(g, 4, 6, 5, 7, '#8ab06a'); R(g, 5, 13, 3, 5, '#8ab06a')   // americas
  R(g, 11, 5, 7, 5, '#8ab06a'); R(g, 13, 10, 4, 6, '#8ab06a') // eurasia + africa
  R(g, 12, 24, 5, 3, '#8ab06a'); R(g, 5, 26, 3, 2, '#e8ecf4') // oceania + ice
  // pins: Boston + Beijing, dashed route
  R(g, 6, 8, 2, 2, '#d95d5d'); R(g, 6, 6, 1, 2, '#8a2c2c')
  R(g, 15, 7, 2, 2, '#d95d5d'); R(g, 16, 5, 1, 2, '#8a2c2c')
  for (const [dx, dy] of [[9, 8], [11, 7], [13, 7]]) R(g, dx, dy, 1, 1, '#f4efdf')
})
// VHS: two reels + red label stripe
F.tape = () => cv(20, 16, (g) => {
  O(g, 2, 4, 16, 10, '#1c1c1c')
  R(g, 3, 5, 14, 2, '#d95d5d'); R(g, 4, 5, 8, 1, '#ff8f8f') // label
  O(g, 5, 8, 4, 4, '#e8e8e8'); R(g, 6, 9, 2, 2, P.outline)  // reel L
  O(g, 12, 8, 4, 4, '#e8e8e8'); R(g, 13, 9, 2, 2, P.outline) // reel R
  R(g, 9, 10, 2, 1, '#4a4a4a')                       // window
})
// go board on a low table, black + white stones mid-game
F.go = () => cv(18, 16, (g) => {
  O(g, 2, 4, 14, 9, '#d9b36c')
  R(g, 3, 5, 12, 7, '#e6c684')
  g.fillStyle = '#8a5a38'
  for (let i = 0; i < 4; i++) { g.fillRect(4, 6 + i * 2, 10, 1) }
  for (let i = 0; i < 5; i++) { g.fillRect(4 + i * 2.4, 6, 1, 7) }
  R(g, 5, 7, 2, 2, '#1c1c1c'); R(g, 9, 9, 2, 2, '#1c1c1c'); R(g, 12, 6, 2, 2, '#1c1c1c')
  R(g, 7, 6, 2, 2, '#f4f4f0'); R(g, 11, 10, 2, 2, '#f4f4f0'); R(g, 4, 10, 2, 2, '#f4f4f0')
  R(g, 3, 13, 2, 3, P.woodDk); R(g, 13, 13, 2, 3, P.woodDk)
})
// a stack of board-game boxes
F.games = () => cv(20, 18, (g) => {
  O(g, 3, 12, 15, 5, '#b9484d'); R(g, 4, 13, 13, 1, '#d46a6e'); R(g, 6, 14, 8, 2, '#f2e4c8')
  O(g, 2, 7, 15, 5, '#3f6fae'); R(g, 3, 8, 13, 1, '#5d8ac4'); R(g, 5, 9, 8, 2, '#ffd93b')
  O(g, 4, 2, 12, 5, '#d9a441'); R(g, 5, 3, 10, 1, '#e8bc6a'); R(g, 6, 4, 6, 2, '#2b3550')
})

// Iron Man poster on the wall
F.poster = () => cv(18, 26, (g) => {
  O(g, 1, 1, 16, 23, '#7a1f24')                      // poster sheet
  R(g, 2, 2, 14, 21, '#8f262c')
  R(g, 2, 2, 14, 3, '#5d181d')
  // the helmet
  R(g, 5, 7, 8, 10, '#c0392b')                       // red shell
  R(g, 6, 9, 6, 7, '#e8b23a')                        // gold faceplate
  R(g, 6, 11, 2, 1, '#bfe9ff'); R(g, 10, 11, 2, 1, '#bfe9ff') // glowing eyes
  R(g, 8, 13, 2, 2, '#c0392b')
  R(g, 6, 19, 6, 1, '#e8b23a')                       // title bar
  R(g, 5, 21, 8, 1, '#5d181d')
})

// jersey wall: wooden rail, four hanging numbered shirts
function miniJersey(g, x, y, { body, body2, trim, numColor, number }) {
  // sleeve nubs
  R(g, x - 1, y, 2, 5, P.outline); R(g, x + 8, y, 2, 5, P.outline)
  R(g, x - 1, y + 1, 1, 3, trim); R(g, x + 9, y + 1, 1, 3, trim)
  // body
  R(g, x, y - 1, 9, 15, P.outline)
  if (body2) {
    R(g, x + 1, y, 7, 13, body2); R(g, x + 1, y, 2, 13, body); R(g, x + 6, y, 2, 13, body)
    R(g, x + 1, y + 3, 7, 7, body2)                  // clear patch so the number reads
  } else R(g, x + 1, y, 7, 13, body)
  R(g, x + 3, y, 3, 1, P.outline)                    // collar
  numberAt(g, numColor, x + 4.5, y + 4, number)
}
F.jerseys = () => cv(50, 28, (g) => {
  O(g, 1, 2, 48, 3, P.wood)                          // rail
  for (let i = 0; i < 4; i++) R(g, 7 + i * 12, 5, 1, 3, '#8a8f9c') // hooks
  const shirts = [
    { body: '#c8332a', trim: '#f4f6f8', numColor: '#f4f6f8', number: 8 },                    // ManU
    { body: '#75aadb', body2: '#f4f6f8', trim: '#1b2a4a', numColor: '#1b2a4a', number: 10 }, // Argentina
    { body: '#0f7ac1', trim: '#ef7b24', numColor: '#f4f6f8', number: 13 },                   // OKC blue
    { body: '#eef0f2', trim: '#0f7ac1', numColor: '#0f7ac1', number: 0 }                     // OKC white
  ]
  shirts.forEach((s, i) => miniJersey(g, 3 + i * 12, 9, s))
})
F.gate = (name) => cv(34, 34, (g) => {
  O(g, 2, 8, 5, 24, '#8a8f9c'); O(g, 27, 8, 5, 24, '#8a8f9c')
  O(g, 0, 2, 34, 9, '#6d7383')
  g.fillStyle = '#f7ecd7'; g.font = 'bold 8px monospace'; g.textAlign = 'center'
  g.fillText(name, 17, 9); g.textAlign = 'left'
  R(g, 7, 26, 20, 6, P.pathDk)
})
F.table = (kind) => cv(30, 26, (g) => {
  O(g, 2, 12, 26, 8, P.wood); R(g, 3, 13, 24, 2, '#a06a42')
  R(g, 4, 20, 3, 5, P.woodDk); R(g, 23, 20, 3, 5, P.woodDk)
  if (kind === 'bio') { O(g, 6, 4, 6, 8, '#8a8f9c'); R(g, 7, 2, 2, 4, '#b8c4d4'); O(g, 18, 6, 6, 6, '#7a5a3a'); R(g, 19, 2, 2, 5, '#4f9d5d'); R(g, 22, 3, 2, 4, '#4f9d5d') }
  if (kind === 'chem') { O(g, 6, 5, 5, 7, '#bfe9ff'); R(g, 7, 8, 3, 3, '#4fd1a1'); O(g, 14, 3, 4, 9, '#bfe9ff'); R(g, 15, 7, 2, 4, '#ff8fa3'); O(g, 21, 6, 5, 6, '#bfe9ff'); R(g, 22, 9, 3, 2, '#ffd93b') }
  if (kind === 'stats') {
    O(g, 5, 4, 12, 9, '#2b3550'); R(g, 6, 5, 10, 7, '#bfe9ff')                       // laptop screen
    R(g, 7, 10, 1, 1, '#2b3550'); R(g, 8, 8, 1, 3, '#2b3550'); R(g, 9, 6, 1, 5, '#2b3550')
    R(g, 10, 5, 2, 6, '#2b3550'); R(g, 12, 6, 1, 5, '#2b3550'); R(g, 13, 8, 1, 3, '#2b3550'); R(g, 14, 10, 1, 1, '#2b3550') // bell curve
    R(g, 4, 13, 14, 1, '#1e2438')                                                       // keyboard edge
    R(g, 20, 6, 7, 7, '#f1e8d2'); R(g, 21, 8, 5, 1, '#8a8f9c'); R(g, 21, 10, 5, 1, '#8a8f9c') // papers
  }
  if (kind === 'env') { O(g, 7, 3, 8, 8, '#4f7fbf'); R(g, 9, 5, 3, 3, '#8ab06a'); R(g, 12, 7, 2, 2, '#8ab06a'); O(g, 19, 6, 6, 6, '#7a5a3a'); R(g, 21, 2, 2, 5, '#4f9d5d') }
})
F.docs = () => cv(40, 28, (g) => {
  O(g, 1, 2, 38, 24, P.wood)
  for (const y of [5, 13]) { R(g, 2, y + 6, 36, 2, P.woodDk); for (let i = 0; i < 8; i++) R(g, 3 + i * 4.4, y, 4, 6, i % 2 ? '#e8d9b8' : '#d9c8a0') }
  R(g, 4, 21, 10, 4, '#c05d5d'); R(g, 18, 21, 10, 4, '#4f7fbf')
})
F.quiz = () => cv(26, 24, (g) => {
  O(g, 2, 10, 22, 10, P.wood); R(g, 3, 11, 20, 2, '#a06a42')
  O(g, 6, 2, 8, 7, '#f7ecd7'); g.fillStyle = '#22304a'; g.font = 'bold 7px monospace'; g.fillText('Q?', 7, 8)
  R(g, 17, 4, 5, 5, '#ffd93b')
})

// ---------- the three house cats (side view, 2-frame walk) ----------
// Readable pixel cats: pointed ears, round head, upright curved tail, four legs.
function catFrames(draw, w, h) {
  return [cv(w, h, (g) => draw(g, 0)), cv(w, h, (g) => draw(g, 1))]
}

// 伯爵 — the white toy poodle. Dog, not cat: forward snout with a black
// nose, one big FLOPPY ear drooping past the jaw, thick red collar,
// pom tail, taller legs with white paws.
function dogPoodle() {
  const W2 = '#f4f2ec', SH = '#dcd8cf', COL = '#d9383e'
  return catFrames((g, step) => {
    // pom tail (back, up)
    O(g, 1, 5, 4, 4, W2); R(g, 2, 6, 2, 2, SH)
    // fluffy body
    O(g, 4, 8, 10, 5, W2)
    R(g, 5, 7, 2, 1, W2); R(g, 8, 7, 2, 1, W2); R(g, 11, 7, 2, 1, W2)   // fluff bumps
    R(g, 5, 11, 8, 1, SH)
    // head
    O(g, 13, 2, 6, 5, W2)
    R(g, 14, 2, 4, 1, SH)                                    // top-knot shading
    // snout forward + black nose + mouth
    O(g, 18, 4, 3, 2, W2)
    R(g, 20, 4, 1, 1, '#1c1408')
    R(g, 19, 6, 1, 1, '#e8a0a8')
    // one big floppy ear, drooping past the jaw (the dog giveaway)
    O(g, 11, 3, 3, 5, W2); R(g, 12, 5, 1, 2, SH)
    // eye
    R(g, 15, 3, 1, 1, P.outline)
    // thick red collar between head and body
    R(g, 13, 7, 5, 2, COL); R(g, 15, 8, 1, 1, '#ffd93b')     // tag
    // taller legs + white paws
    if (step === 0) { R(g, 5, 13, 2, 3, P.outline); R(g, 11, 13, 2, 3, P.outline) }
    else { R(g, 6, 13, 2, 3, P.outline); R(g, 10, 13, 2, 3, P.outline) }
    R(g, 8, 13, 2, 2, P.outline)
    if (step === 0) { R(g, 5, 15, 2, 1, W2); R(g, 11, 15, 2, 1, W2) } else { R(g, 6, 15, 2, 1, W2); R(g, 10, 15, 2, 1, W2) }
  }, 22, 17)
}

// Twizzler — middle, black tortoiseshell (orange mottling)
function catTortoiseshell() {
  const B = '#2b2118', HI = '#3d2e20', OR = '#c97a3d'
  return catFrames((g, step) => {
    // upright curved tail (rear-left)
    R(g, 2, 2, 2, 2, P.outline); R(g, 1, 3, 2, 3, P.outline); R(g, 2, 6, 2, 3, P.outline)
    R(g, 2, 3, 1, 1, B); R(g, 2, 4, 1, 2, B); R(g, 3, 6, 1, 2, B)
    // body
    O(g, 4, 8, 9, 5, B); R(g, 5, 9, 3, 2, HI)
    // orange tortoiseshell patches
    R(g, 6, 8, 2, 1, OR); R(g, 10, 11, 2, 1, OR); R(g, 4, 10, 1, 2, OR)
    // head
    O(g, 11, 3, 6, 5, B)
    // ears
    R(g, 11, 1, 1, 2, P.outline); R(g, 12, 2, 1, 1, B)
    R(g, 15, 1, 1, 2, P.outline); R(g, 14, 2, 1, 1, B)
    R(g, 12, 3, 1, 1, OR) // orange over one brow
    // face
    R(g, 13, 5, 1, 1, '#ffd93b')      // eye
    R(g, 16, 6, 1, 1, '#e8a0a8')      // nose
    // legs (trot)
    if (step === 0) { R(g, 5, 13, 2, 2, P.outline); R(g, 10, 13, 2, 2, P.outline) }
    else { R(g, 6, 13, 2, 2, P.outline); R(g, 9, 13, 2, 2, P.outline) }
  }, 18, 15)
}

// Huahua — small grey with WHITE spots
function catGrey() {
  const B = '#8a8f9c', W2 = '#f2f2ee'
  return catFrames((g, step) => {
    R(g, 1, 2, 2, 2, P.outline); R(g, 1, 4, 2, 3, P.outline)  // tail up
    R(g, 2, 3, 1, 3, B)
    O(g, 3, 6, 7, 4, B)
    R(g, 4, 8, 2, 2, W2); R(g, 8, 6, 2, 1, W2)                 // white spots
    O(g, 9, 2, 5, 4, B)
    R(g, 9, 0, 1, 2, P.outline); R(g, 10, 1, 1, 1, B)          // ears
    R(g, 12, 0, 1, 2, P.outline); R(g, 12, 1, 1, 1, W2)        // one white ear
    R(g, 11, 3, 1, 1, '#2b3550')                               // eye
    R(g, 13, 4, 1, 1, '#e8a0a8')                               // nose
    R(g, 9, 5, 2, 1, W2)                                       // white chin
    if (step === 0) { R(g, 4, 10, 2, 2, P.outline); R(g, 8, 10, 2, 2, P.outline) }
    else { R(g, 5, 10, 2, 2, P.outline); R(g, 7, 10, 2, 2, P.outline) }
  }, 15, 12)
}

// Little guy — big fluffy white Maine Coon with BLACK spots
function catWhite() {
  const B = '#f2f0e8', SH = '#dcd9cf', BK = '#2b2b2b'
  return catFrames((g, step) => {
    // big bushy tail
    R(g, 2, 1, 3, 2, P.outline); R(g, 1, 3, 3, 4, P.outline); R(g, 2, 7, 3, 3, P.outline)
    R(g, 3, 2, 1, 1, BK)                                       // black tail tip
    R(g, 2, 3, 2, 3, B); R(g, 3, 6, 2, 3, B)
    // body, chest ruff
    O(g, 5, 9, 12, 6, B)
    R(g, 6, 13, 10, 1, SH)
    R(g, 14, 9, 2, 2, SH)                                      // ruff shading
    // black spots
    R(g, 8, 9, 3, 2, BK); R(g, 6, 11, 2, 1, BK)
    // head
    O(g, 14, 3, 7, 6, B)
    // tufted ears
    R(g, 14, 0, 1, 3, P.outline); R(g, 15, 2, 1, 1, B)
    R(g, 19, 0, 1, 3, P.outline); R(g, 18, 2, 1, 1, BK)        // black ear patch
    R(g, 18, 3, 2, 2, BK)                                      // black over one eye
    // face
    R(g, 16, 5, 1, 1, '#4f7fbf')                               // blue eye
    R(g, 20, 6, 1, 1, '#e8a0a8')                               // nose
    R(g, 13, 6, 1, 2, B)                                       // cheek fluff
    if (step === 0) { R(g, 6, 15, 2, 2, P.outline); R(g, 13, 15, 2, 2, P.outline) }
    else { R(g, 7, 15, 2, 2, P.outline); R(g, 12, 15, 2, 2, P.outline) }
  }, 22, 17)
}

export function makeSprites() {
  const S = {}
  S.grass = Array.from({ length: 6 }, (_, i) => grassTile(i + 1))
  S.path = Array.from({ length: 3 }, (_, i) => pathTile(i + 1))
  S.tree = tree()
  S.buildings = {
    school: facade({ wall: P.plaster, wallDk: P.plasterDk, roof: P.roofA, roofDk: P.roofAd, sign: 'SCHOOL', kind: 'school' }),
    lab: facade({ wall: '#dfe6f0', wallDk: '#c4cede', roof: P.roofB, roofDk: P.roofBd, sign: 'LAB', kind: 'lab' }),
    home: facade({ wall: '#e8cfa8', wallDk: '#d4b98a', roof: P.roofD, roofDk: P.roofDd, sign: 'HOME', kind: 'home' }),
    library: facade({ wall: '#e0cdb0', wallDk: '#ccb896', roof: P.roofC, roofDk: P.roofCd, sign: 'LIBRARY', kind: 'library' })
  }
  S.mailbox = mailbox()
  S.arcade = arcade()
  S.player = person({ shirt: P.shirt, shirtHi: P.shirtHi, hair: P.hairD })
  S.npc1 = person({ shirt: '#7a4f7f', shirtHi: '#96659b', hair: '#8a4a3b' })
  S.npc2 = person({ shirt: '#c05d5d', shirtHi: '#d47777', hair: '#5a5a5a', skirt: true })
  S.furniture = F
  S.cats = {
    tortoiseshell: catTortoiseshell(),
    grey: catGrey(),
    white: catWhite(),
    poodle: dogPoodle()
  }
  S.wallColors = { home: P.wallHome, school: P.wallSchool, lab: P.wallLab, library: P.wallLib }
  S.floor = cv(16, 16, (g) => { R(g, 0, 0, 16, 16, P.floor); R(g, 0, 7, 16, 1, P.floorDk); R(g, 0, 15, 16, 1, P.floorDk); R(g, 8, 0, 1, 8, P.floorDk); R(g, 3, 8, 1, 8, P.floorDk) })
  S.rug = cv(48, 32, (g) => { O(g, 1, 1, 46, 30, P.rug); R(g, 4, 4, 40, 24, P.rugHi); R(g, 8, 8, 32, 16, P.rug) })
  S.exitMat = cv(16, 10, (g) => { O(g, 1, 1, 14, 8, '#a06a42'); R(g, 3, 3, 10, 4, '#c9945e') })
  return S
}
