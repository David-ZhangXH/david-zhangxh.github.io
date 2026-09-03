import { describe, it, expect } from 'vitest'
import { SCENES, TILE } from '../src/village/map.js'

const bfs = (scene, from) => {
  const seen = new Set([`${from.x},${from.y}`])
  const q = [[from.x, from.y]]
  while (q.length) {
    const [x, y] = q.shift()
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = `${x + dx},${y + dy}`
      if (!seen.has(k) && scene.isWalkable(x + dx, y + dy)) { seen.add(k); q.push([x + dx, y + dy]) }
    }
  }
  return seen
}

describe('village scenes', () => {
  it('town is compact enough to see whole on a laptop at scale 3', () => {
    expect(SCENES.town.w * TILE * 3).toBeLessThanOrEqual(1280)
    expect(SCENES.town.h * TILE * 3).toBeLessThanOrEqual(820)
  })
  it('every scene: spawn walkable, all zones adjacent-reachable, exits walkable', () => {
    for (const [name, s] of Object.entries(SCENES)) {
      expect(s.isWalkable(s.spawn.x, s.spawn.y), `${name} spawn`).toBe(true)
      const reach = bfs(s, s.spawn)
      for (const z of s.zones) {
        expect(s.isWalkable(z.x, z.y), `${name}:${z.id} solid`).toBe(false)
        const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reach.has(`${z.x + dx},${z.y + dy}`))
        expect(near, `${name}:${z.id} reachable`).toBe(true)
      }
      for (const e of s.exits || []) expect(s.isWalkable(e.x, e.y), `${name} exit`).toBe(true)
    }
  })
  it('town has the four doors + mailbox + arcade + npcs; no coffee anywhere', () => {
    const ids = SCENES.town.zones.map(z => z.id).sort()
    expect(ids).toEqual(['arcade', 'home', 'lab', 'library', 'mailbox', 'npc1', 'npc2', 'school'])
    for (const s of Object.values(SCENES))
      expect(s.zones.some(z => /coffee/.test(z.id))).toBe(false)
  })
  it('home interior holds all twelve of David\'s objects (multi-tile allowed)', () => {
    const ids = [...new Set(SCENES.home.zones.map(z => z.id))].sort()
    expect(ids).toEqual(['bigbook', 'board', 'games', 'go', 'jerseys', 'laptop', 'memory', 'music_corner', 'musicbox', 'poster', 'shelves', 'tape', 'toy', 'tv', 'worldmap'])
  })
  it('multi-tile objects are contiguous groups', () => {
    for (const s of Object.values(SCENES)) {
      const byId = {}
      for (const z of s.zones) (byId[z.id] ||= []).push(z)
      for (const [id, tiles] of Object.entries(byId)) {
        if (tiles.length === 1) continue
        // every tile touches another tile of the same group
        for (const t of tiles) {
          const touching = tiles.some(o => o !== t && Math.abs(o.x - t.x) + Math.abs(o.y - t.y) === 1)
          expect(touching, `${id} tile ${t.x},${t.y} contiguous`).toBe(true)
        }
      }
    }
  })
  it('school has three stations, lab four tables, library shelves + quiz', () => {
    expect(SCENES.school.zones.map(z => z.id).sort()).toEqual(['bu', 's101', 'yuying'])
    expect(SCENES.lab.zones.map(z => z.id).sort()).toEqual(['bio', 'chem', 'env', 'stats'])
    expect(SCENES.library.zones.map(z => z.id).sort()).toEqual(['docs', 'quiz'])
  })
})
