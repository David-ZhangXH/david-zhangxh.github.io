import { describe, it, expect } from 'vitest'
import { WIDTH, HEIGHT, SPAWN, isWalkable, zoneAt, allZones } from '../src/village/map.js'

describe('village map', () => {
  it('has sane dimensions and a walkable spawn', () => {
    expect(WIDTH).toBe(40)
    expect(HEIGHT).toBe(24)
    expect(isWalkable(SPAWN.x, SPAWN.y)).toBe(true)
  })
  it('defines all nine interact zones exactly once', () => {
    const found = {}
    for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
      const z = zoneAt(x, y)
      if (z) found[z] = (found[z] || 0) + 1
    }
    expect(Object.keys(found).sort()).toEqual(
      ['arcade', 'coffee', 'home', 'lab', 'library', 'mailbox', 'npc1', 'npc2', 'school'])
    expect(Object.values(found).every(n => n === 1)).toBe(true)
    expect(allZones().length).toBe(9)
  })
  it('zones are solid but each is adjacent to a tile reachable from spawn (BFS)', () => {
    const seen = new Set([`${SPAWN.x},${SPAWN.y}`])
    const queue = [[SPAWN.x, SPAWN.y]]
    while (queue.length) {
      const [x, y] = queue.shift()
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy
        const k = `${nx},${ny}`
        if (nx < 0 || ny < 0 || nx >= WIDTH || ny >= HEIGHT || seen.has(k)) continue
        if (isWalkable(nx, ny)) { seen.add(k); queue.push([nx, ny]) }
      }
    }
    for (const { id, x, y } of allZones()) {
      expect(isWalkable(x, y)).toBe(false)
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(`${x + dx},${y + dy}`))
      expect(near, `${id} must be reachable`).toBe(true)
    }
  })
  it('building interiors block movement', () => {
    expect(isWalkable(7, 5)).toBe(false)   // school
    expect(isWalkable(7, 16)).toBe(false)  // home
    expect(isWalkable(28, 5)).toBe(false)  // lab
    expect(isWalkable(28, 16)).toBe(false) // library
  })
})
