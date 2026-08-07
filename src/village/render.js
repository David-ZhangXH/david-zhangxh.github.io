// Camera-follow pixel renderer. Integer scale, crisp edges, board-03 daylight.
import { WIDTH, HEIGHT, TILE, BUILDINGS, ZONES, TREES, isPath } from './map.js'

export function createRenderer(canvas, sprites) {
  const ctx = canvas.getContext('2d')
  let scale = 3

  function resize() {
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    scale = Math.max(2, Math.min(4, Math.round(canvas.width / (30 * TILE))))
    ctx.imageSmoothingEnabled = false
  }
  resize()

  function draw(player, npcsBob, t) {
    const vw = canvas.width / scale, vh = canvas.height / scale
    let camX = player.px + TILE / 2 - vw / 2
    let camY = player.py + TILE / 2 - vh / 2
    camX = Math.max(0, Math.min(WIDTH * TILE - vw, camX))
    camY = Math.max(0, Math.min(HEIGHT * TILE - vh, camY))
    ctx.setTransform(scale, 0, 0, scale, -Math.round(camX * scale) / 1, -Math.round(camY * scale) / 1)
    ctx.imageSmoothingEnabled = false

    // ground
    const x0 = Math.floor(camX / TILE), x1 = Math.ceil((camX + vw) / TILE)
    const y0 = Math.floor(camY / TILE), y1 = Math.ceil((camY + vh) / TILE)
    for (let y = y0; y <= y1 && y < HEIGHT; y++) {
      for (let x = x0; x <= x1 && x < WIDTH; x++) {
        ctx.drawImage(isPath(x, y) ? sprites.path : sprites.grass, x * TILE, y * TILE)
      }
    }

    // buildings (anchored so the sprite's bottom sits on the footprint's bottom row)
    for (const b of BUILDINGS) {
      const img = sprites[b.id]
      ctx.drawImage(img, b.x * TILE, (b.y + b.h) * TILE - img.height)
    }

    // objects
    for (const z of ZONES) {
      if (z.id === 'mailbox') ctx.drawImage(sprites.mailbox, z.x * TILE, z.y * TILE - 8)
      if (z.id === 'arcade') ctx.drawImage(sprites.arcade, z.x * TILE, z.y * TILE - 12)
      if (z.id === 'coffee') ctx.drawImage(sprites.coffee, z.x * TILE, z.y * TILE - 8)
      if (z.id === 'npc1') ctx.drawImage(sprites.npc1[npcsBob ? 1 : 0], z.x * TILE, z.y * TILE - 8)
      if (z.id === 'npc2') ctx.drawImage(sprites.npc2[npcsBob ? 1 : 0], z.x * TILE, z.y * TILE - 8)
    }

    // trees above objects for depth
    for (const [x, y] of TREES) ctx.drawImage(sprites.tree, x * TILE, y * TILE - 8)

    // player (bottom-anchored, 2-frame walk)
    const frame = player.moving ? (Math.floor(t * 8) % 2) : 0
    ctx.drawImage(sprites.player[frame], Math.round(player.px), Math.round(player.py) - 8)

    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }

  return { draw, resize }
}
