// The 15-puzzle, exactly as the middle-school original: 4×4, slide into the hole.
// Scrambles are seeded random walks from the solved state — always solvable,
// reproducible, and honest.

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SOLVED = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0]

export function createPuzzle(seed = 1) {
  const rand = mulberry32(seed)
  const board = SOLVED.slice()
  const scramble = []
  let moves = 0

  const holeIdx = () => board.indexOf(0)
  const neighborsOfHole = () => {
    const h = holeIdx()
    const out = []
    if (h >= 4) out.push(h - 4)
    if (h < 12) out.push(h + 4)
    if (h % 4 > 0) out.push(h - 1)
    if (h % 4 < 3) out.push(h + 1)
    return out
  }
  const slide = (tileIdx) => {
    const h = holeIdx()
    board[h] = board[tileIdx]
    board[tileIdx] = 0
  }

  // scramble: 160 random legal moves (never undoing the previous move)
  let lastHole = -1
  for (let i = 0; i < 160; i++) {
    const options = neighborsOfHole().filter(n => n !== lastHole)
    const pick = options[Math.floor(rand() * options.length)]
    lastHole = holeIdx()
    scramble.push(board[pick])
    slide(pick)
  }

  return {
    tiles: () => board.slice(),
    moves: () => moves,
    scrambleMoves: () => scramble.slice(),
    isSolved: () => board.every((v, i) => v === SOLVED[i]),
    move(tile) {
      const idx = board.indexOf(tile)
      if (idx < 0 || tile === 0) return false
      if (!neighborsOfHole().includes(idx)) return false
      slide(idx)
      moves++
      return true
    }
  }
}

// Deterministic claim code so David can verify record claims with one line.
export function claimCode(timeMs, moveCount, seed, dateISO) {
  const s = `dz|${timeMs}|${moveCount}|${seed}|${dateISO}`
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  let h2 = 0x1505
  for (let i = s.length - 1; i >= 0; i--) h2 = (Math.imul(h2, 33) ^ s.charCodeAt(i)) >>> 0
  return (h.toString(36) + h2.toString(36)).slice(0, 10)
}
