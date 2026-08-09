// Village 2.0 renderer: shows the WHOLE scene when it fits (letterboxed),
// falls back to camera-follow on small screens. Crisp integer scaling.
import { TILE } from './map.js'

const hash = (x, y) => Math.abs((x * 73856093) ^ (y * 19349663)) % 997

export function createRenderer(canvas, sprites) {
  const ctx = canvas.getContext('2d')
  let view = { scale: 3, ox: 0, oy: 0 }

  const fcache = {}
  const furnitureFor = (id) => {
    if (fcache[id]) return fcache[id]
    let img = sprites.furniture[id]?.()
    if (!img) {
      if (['yuying', 's101', 'bu'].includes(id))
        img = sprites.furniture.gate({ yuying: 'YUYING', s101: '101', bu: 'BU' }[id])
      else if (['bio', 'chem', 'env'].includes(id)) img = sprites.furniture.table(id)
    }
    fcache[id] = img
    return img
  }

  // multi-tile zones share an id — draw each group once, centered on its box
  const gcache = new Map()
  const groupsFor = (scene) => {
    if (gcache.has(scene)) return gcache.get(scene)
    const byId = new Map()
    for (const z of scene.zones) {
      const g = byId.get(z.id) || { id: z.id, x0: z.x, x1: z.x, y0: z.y, y1: z.y }
      g.x0 = Math.min(g.x0, z.x); g.x1 = Math.max(g.x1, z.x)
      g.y0 = Math.min(g.y0, z.y); g.y1 = Math.max(g.y1, z.y)
      byId.set(z.id, g)
    }
    const groups = [...byId.values()]
    gcache.set(scene, groups)
    return groups
  }

  function resize() {
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    ctx.imageSmoothingEnabled = false
  }
  resize()

  function computeView(scene, player) {
    const fit = Math.floor(Math.min(canvas.width / (scene.w * TILE), canvas.height / (scene.h * TILE)))
    if (fit >= 2) { // whole scene visible, centered
      const scale = Math.min(4, fit)
      view = {
        scale,
        ox: Math.floor((canvas.width - scene.w * TILE * scale) / 2),
        oy: Math.floor((canvas.height - scene.h * TILE * scale) / 2)
      }
    } else { // phone: follow the player
      const scale = 2
      let camX = player.px + TILE / 2 - canvas.width / scale / 2
      let camY = player.py + TILE / 2 - canvas.height / scale / 2
      camX = Math.max(0, Math.min(scene.w * TILE - canvas.width / scale, camX))
      camY = Math.max(0, Math.min(scene.h * TILE - canvas.height / scale, camY))
      view = { scale, ox: -Math.floor(camX * scale), oy: -Math.floor(camY * scale) }
    }
  }

  const townPath = (s, x, y) =>
    (y === 6 || y === 7 || y === 13 || y === 14) ||
    (x >= 10 && x <= 15 && y >= 6 && y <= 14) ||
    ((x === 5 || x === 19) && (y === 6 || y === 7))

  function draw(scene, player, npcBob, t, label, actors = []) {
    computeView(scene, player)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = '#1c2a1c'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.setTransform(view.scale, 0, 0, view.scale, view.ox, view.oy)
    ctx.imageSmoothingEnabled = false

    if (scene.kind === 'town') {
      for (let y = 0; y < scene.h; y++) for (let x = 0; x < scene.w; x++) {
        const h = hash(x, y)
        if (townPath(scene, x, y)) ctx.drawImage(sprites.path[h % 3], x * TILE, y * TILE)
        else ctx.drawImage(sprites.grass[h % 6], x * TILE, y * TILE)
      }
      for (const b of scene.buildings) {
        const img = sprites.buildings[b.id]
        ctx.drawImage(img, b.x * TILE, (b.y + b.h) * TILE - img.height)
      }
      for (const z of scene.zones) {
        if (z.id === 'mailbox') ctx.drawImage(sprites.mailbox, z.x * TILE - 1, z.y * TILE - 10)
        if (z.id === 'arcade') ctx.drawImage(sprites.arcade, z.x * TILE - 2, z.y * TILE - 16)
        if (z.id === 'npc1') ctx.drawImage(sprites.npc1[npcBob ? 1 : 0], z.x * TILE + 1, z.y * TILE - 6)
        if (z.id === 'npc2') ctx.drawImage(sprites.npc2[npcBob ? 1 : 0], z.x * TILE + 1, z.y * TILE - 6)
      }
      for (const [x, y] of scene.trees) ctx.drawImage(sprites.tree, x * TILE - 8, y * TILE - 24)
    } else {
      // interiors: plank floor, colored wall band, rug, furniture
      for (let y = 0; y < scene.h; y++) for (let x = 0; x < scene.w; x++)
        ctx.drawImage(sprites.floor, x * TILE, y * TILE)
      ctx.fillStyle = sprites.wallColors[scene.kind] || '#e0d0b8'
      ctx.fillRect(TILE, 0, (scene.w - 2) * TILE, 2 * TILE)
      ctx.fillStyle = 'rgba(42,32,25,.3)'
      ctx.fillRect(TILE, 2 * TILE - 3, (scene.w - 2) * TILE, 3)
      ctx.fillStyle = '#3a2c1c'
      ctx.fillRect(0, 0, TILE, scene.h * TILE)
      ctx.fillRect((scene.w - 1) * TILE, 0, TILE, scene.h * TILE)
      ctx.fillRect(0, (scene.h - 1) * TILE, scene.w * TILE, TILE)
      ctx.drawImage(sprites.rug, Math.floor(scene.w / 2) * TILE - 24, 4 * TILE)
      for (const e of scene.exits) ctx.drawImage(sprites.exitMat, e.x * TILE, e.y * TILE + 8)
      for (const grp of groupsFor(scene)) {
        const img = furnitureFor(grp.id)
        if (!img) continue
        const cx = ((grp.x0 + grp.x1 + 1) * TILE) / 2
        ctx.drawImage(img, Math.round(cx - img.width / 2), (grp.y1 + 1) * TILE - img.height)
      }
    }

    // wandering actors (the cats), bottom-anchored, before the player
    for (const a of [...actors].sort((x, y) => x.py - y.py)) {
      ctx.drawImage(a.img, Math.round(a.px) + (TILE - a.img.width) / 2, Math.round(a.py) + TILE - a.img.height)
    }

    // player
    const frame = player.moving ? (Math.floor(t * 8) % 2) : 0
    ctx.drawImage(sprites.player[frame], Math.round(player.px) + 1, Math.round(player.py) - 6)
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // floating name label over the faced / hovered thing
    if (label) {
      const grp = label.tx != null
        ? { x0: label.tx, x1: label.tx, y0: label.ty, y1: label.ty }
        : groupsFor(scene).find(g => g.id === label.id)
      if (grp) {
        const img = label.tx != null ? null : furnitureFor(grp.id)
        const topWorld = label.tx != null
          ? grp.y0 * TILE - 20
          : scene.kind === 'town'
            ? grp.y0 * TILE - 26
            : (grp.y1 + 1) * TILE - (img ? img.height : TILE) - 8
        const sx = view.ox + (((grp.x0 + grp.x1 + 1) * TILE) / 2) * view.scale
        let sy = view.oy + topWorld * view.scale
        ctx.font = '700 11px ui-monospace, Menlo, monospace'
        const w = Math.ceil(ctx.measureText(label.text).width) + 12
        const x = Math.round(Math.max(4, Math.min(canvas.width - w - 4, sx - w / 2)))
        sy = Math.round(Math.max(4, sy))
        ctx.fillStyle = 'rgba(43,53,80,.95)'
        ctx.fillRect(x, sy, w, 17)
        ctx.fillStyle = '#ffd93b'
        ctx.fillRect(x, sy + 16, w, 1)
        ctx.fillStyle = '#f7ecd7'
        ctx.fillText(label.text, x + 6, sy + 12)
      }
    }
  }

  const screenToTile = (px, py) => ({
    x: Math.floor((px - view.ox) / view.scale / TILE),
    y: Math.floor((py - view.oy) / view.scale / TILE)
  })

  return { draw, resize, screenToTile }
}
