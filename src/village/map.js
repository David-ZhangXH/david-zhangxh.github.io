// Village 2.0 scenes: a one-screen town + four walkable interiors.
// Each scene: {w, h, spawn, zones, exits, isWalkable, zoneAt, exitAt} plus
// render hints (buildings, trees, kind).

export const TILE = 16

function makeScene({ w, h, spawn, zones = [], exits = [], solidExtra = [], openBorder = [] }) {
  const solid = new Set()
  for (let x = 0; x < w; x++) { solid.add(`${x},0`); solid.add(`${x},${h - 1}`) }
  for (let y = 0; y < h; y++) { solid.add(`0,${y}`); solid.add(`${w - 1},${y}`) }
  for (const [x, y] of openBorder) solid.delete(`${x},${y}`)
  for (const [x, y] of solidExtra) solid.add(`${x},${y}`)
  const zoneMap = new Map()
  for (const z of zones) { solid.add(`${z.x},${z.y}`); zoneMap.set(`${z.x},${z.y}`, z.id) }
  const exitMap = new Map()
  for (const e of exits) exitMap.set(`${e.x},${e.y}`, e.to)
  return {
    w, h, spawn, zones, exits,
    isWalkable: (x, y) => x >= 0 && y >= 0 && x < w && y < h && !solid.has(`${x},${y}`),
    zoneAt: (x, y) => zoneMap.get(`${x},${y}`) || null,
    exitAt: (x, y) => exitMap.get(`${x},${y}`) || null
  }
}

// ---------- TOWN (26×16 — fully visible at scale 3 on a laptop) ----------
const TOWN_BUILDINGS = [
  { id: 'school', x: 2, y: 1, w: 8, h: 5 },
  { id: 'lab', x: 16, y: 1, w: 8, h: 5 },
  { id: 'home', x: 2, y: 8, w: 8, h: 5 },
  { id: 'library', x: 16, y: 8, w: 8, h: 5 }
]
const TOWN_TREES = [[11, 2], [14, 2], [1, 6], [24, 6], [11, 11], [14, 11], [1, 14], [24, 14]]
const townSolid = []
for (const b of TOWN_BUILDINGS)
  for (let y = b.y; y < b.y + b.h; y++)
    for (let x = b.x; x < b.x + b.w; x++) townSolid.push([x, y])
for (const t of TOWN_TREES) townSolid.push(t)

const town = makeScene({
  w: 26, h: 16,
  spawn: { x: 12, y: 13 },
  zones: [
    { id: 'school', x: 5, y: 5 },    // doors sit on the south wall
    { id: 'lab', x: 19, y: 5 },
    { id: 'home', x: 5, y: 12 },
    { id: 'library', x: 19, y: 12 },
    { id: 'arcade', x: 14, y: 4 },   // the unmarked cabinet, beside the lab
    { id: 'mailbox', x: 12, y: 8 },
    { id: 'npc1', x: 10, y: 10 },
    { id: 'npc2', x: 15, y: 10 }
  ],
  solidExtra: townSolid
})
town.kind = 'town'
town.buildings = TOWN_BUILDINGS
town.trees = TOWN_TREES

// ---------- interiors (14×10; wall band across y=0..1; exit door at bottom) ----------
function interior({ zones, spawn = { x: 7, y: 7 }, wallRow = [] }) {
  const solidExtra = []
  for (let x = 1; x < 13; x++) solidExtra.push([x, 1]) // wall depth
  for (const s of wallRow) solidExtra.push(s)
  const sc = makeScene({
    w: 14, h: 10, spawn, zones,
    exits: [{ x: 7, y: 8, to: 'town' }],
    solidExtra,
    openBorder: []
  })
  return sc
}

// Home layout, spread for legibility (multi-tile zones share an id):
//   top wall:   musicbox · TV (2w) · laptop · jersey wall (3w) · tape
//   left wall:  world map (2h) · picture board
//   right wall: book-shelves (2h) · memory placard
//   floor:      toy · big book · music corner (3w, bottom)
const home = interior({
  zones: [
    { id: 'musicbox', x: 2, y: 2 },
    { id: 'poster', x: 1, y: 2 },
    { id: 'tv', x: 4, y: 2 }, { id: 'tv', x: 5, y: 2 },
    { id: 'laptop', x: 7, y: 2 },
    { id: 'jerseys', x: 9, y: 2 }, { id: 'jerseys', x: 10, y: 2 }, { id: 'jerseys', x: 11, y: 2 },
    { id: 'tape', x: 12, y: 2 },
    { id: 'worldmap', x: 1, y: 4 }, { id: 'worldmap', x: 1, y: 5 },
    { id: 'board', x: 1, y: 7 },
    { id: 'shelves', x: 12, y: 4 }, { id: 'shelves', x: 12, y: 5 },
    { id: 'memory', x: 12, y: 7 },
    { id: 'toy', x: 4, y: 5 }, { id: 'bigbook', x: 9, y: 5 },
    { id: 'music_corner', x: 3, y: 7 }, { id: 'music_corner', x: 4, y: 7 }, { id: 'music_corner', x: 5, y: 7 },
    { id: 'games', x: 9, y: 7 }, { id: 'go', x: 10, y: 7 }
  ],
  spawn: { x: 7, y: 7 }
})
home.kind = 'home'

const school = interior({
  zones: [{ id: 'yuying', x: 3, y: 2 }, { id: 's101', x: 7, y: 2 }, { id: 'bu', x: 11, y: 2 }]
})
school.kind = 'school'

const lab = interior({
  zones: [{ id: 'bio', x: 2, y: 3 }, { id: 'chem', x: 5, y: 3 }, { id: 'env', x: 8, y: 3 }, { id: 'stats', x: 11, y: 3 }]
})
lab.kind = 'lab'

const library = interior({
  zones: [{ id: 'docs', x: 4, y: 2 }, { id: 'quiz', x: 11, y: 4 }]
})
library.kind = 'library'

export const SCENES = { town, home, school, lab, library }

// where you reappear in town after leaving each building
export const RETURN_SPOTS = {
  home: { x: 5, y: 13 }, school: { x: 5, y: 6 },
  lab: { x: 19, y: 6 }, library: { x: 19, y: 13 }
}
