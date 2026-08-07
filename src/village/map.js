// The town grid: 40×24 tiles. Built in code (not ASCII art) so it can't drift.
// Zones are solid objects you interact with by facing them.

export const WIDTH = 40
export const HEIGHT = 24
export const TILE = 16
export const SPAWN = { x: 19, y: 13 }

export const BUILDINGS = [
  { id: 'school', x: 3, y: 3, w: 10, h: 6 },
  { id: 'home', x: 3, y: 14, w: 10, h: 5 },
  { id: 'lab', x: 24, y: 3, w: 11, h: 6 },
  { id: 'library', x: 24, y: 14, w: 11, h: 5 }
]

// interactables: door zones sit on the building's south wall; objects stand free
export const ZONES = [
  { id: 'school', x: 7, y: 8 },    // school door
  { id: 'home', x: 7, y: 18 },     // home door
  { id: 'lab', x: 28, y: 8 },      // lab door
  { id: 'library', x: 28, y: 18 }, // library door
  { id: 'arcade', x: 32, y: 9 },   // unmarked cabinet beside the lab
  { id: 'coffee', x: 37, y: 6 },   // hidden behind the lab
  { id: 'mailbox', x: 21, y: 12 },
  { id: 'npc1', x: 16, y: 14 },    // villager
  { id: 'npc2', x: 26, y: 19 }     // librarian
]

export const TREES = [
  [1, 1], [14, 2], [22, 2], [37, 2], [1, 9], [15, 8], [1, 21], [9, 21],
  [17, 21], [30, 21], [38, 20], [38, 12], [2, 12], [14, 17], [22, 17], [36, 15]
]

const solid = new Set()
const zoneMap = new Map()

// building footprints block
for (const b of BUILDINGS)
  for (let y = b.y; y < b.y + b.h; y++)
    for (let x = b.x; x < b.x + b.w; x++) solid.add(`${x},${y}`)
// trees block
for (const [x, y] of TREES) solid.add(`${x},${y}`)
// zones block (they're objects) and register
for (const z of ZONES) { solid.add(`${z.x},${z.y}`); zoneMap.set(`${z.x},${z.y}`, z.id) }
// border fence
for (let x = 0; x < WIDTH; x++) { solid.add(`${x},0`); solid.add(`${x},${HEIGHT - 1}`) }
for (let y = 0; y < HEIGHT; y++) { solid.add(`0,${y}`); solid.add(`${WIDTH - 1},${y}`) }

export function isWalkable(x, y) {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return false
  return !solid.has(`${x},${y}`)
}

export function zoneAt(x, y) {
  return zoneMap.get(`${x},${y}`) || null
}

export function allZones() {
  return ZONES.slice()
}

// path tiles are cosmetic (walkable either way) — the renderer uses this
export function isPath(x, y) {
  const horiz = (y === 11 || y === 12) && x >= 1 && x <= 38
  const vert = (x === 19 || x === 20) && y >= 1 && y <= 22
  const doorSpurs = (x === 7 && (y === 9 || y === 10)) || (x === 28 && (y === 9 || y === 10)) ||
    (x === 7 && y >= 13 && y <= 17) || (x === 28 && y >= 13 && y <= 17)
  return horiz || vert || doorSpurs
}
