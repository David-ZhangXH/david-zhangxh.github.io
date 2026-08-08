// Builds every object on and around the desk from primitives — no external assets.
// Returns { group, hotspots } where hotspots[id] = { hit, visual, label }.
import * as THREE from 'three'
import { glowSprite } from '../core/glow.js'

const DESK_TOP = 0.785

const std = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...opts })

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z)
  m.castShadow = m.receiveShadow = true
  return m
}

function textTexture(text, { w = 128, h = 64, bg = '#ffe58a', fg = '#3a2a10', font = 'bold 28px monospace' } = {}) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const g = c.getContext('2d')
  g.fillStyle = bg; g.fillRect(0, 0, w, h)
  g.fillStyle = fg; g.font = font
  g.textAlign = 'center'; g.textBaseline = 'middle'
  g.fillText(text, w / 2, h / 2)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function hitBox(w, h, d, x, y, z) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  )
  m.position.set(x, y, z)
  return m
}

export function buildFurniture(scene) {
  const group = new THREE.Group()
  const hotspots = {}

  // ---- room (illustration palette: navy walls that stay readable) ----
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), std(0x121a2e, { roughness: 1 }))
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  group.add(floor)
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), std(0x18223d, { roughness: 1 }))
  backWall.position.set(0, 2.5, -1.6)
  backWall.receiveShadow = true
  group.add(backWall)
  const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), std(0x151e36, { roughness: 1 }))
  sideWall.rotation.y = -Math.PI / 2
  sideWall.position.set(2.6, 2.5, 0)
  group.add(sideWall)

  // ---- window (back-left) with moon ----
  const winW = 0.9, winH = 0.85, winX = -0.95, winY = 1.55, winZ = -1.58
  // dusk-gradient night sky, like the concept board
  const skyC = document.createElement('canvas')
  skyC.width = 64; skyC.height = 128
  const skyG = skyC.getContext('2d')
  const grad2 = skyG.createLinearGradient(0, 0, 0, 128)
  grad2.addColorStop(0, '#0a1130')
  grad2.addColorStop(0.6, '#141c4a')
  grad2.addColorStop(1, '#2a2a5e')
  skyG.fillStyle = grad2
  skyG.fillRect(0, 0, 64, 128)
  const skyTex = new THREE.CanvasTexture(skyC)
  skyTex.colorSpace = THREE.SRGBColorSpace
  const night = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH),
    new THREE.MeshBasicMaterial({ map: skyTex }))
  night.position.set(winX, winY, winZ)
  group.add(night)
  const moon = new THREE.Mesh(new THREE.CircleGeometry(0.09, 24),
    new THREE.MeshBasicMaterial({ color: 0xeef3ff }))
  moon.position.set(winX - 0.18, winY + 0.2, winZ + 0.005)
  group.add(moon)
  const moonGlow = glowSprite(0xbfd4ff, 0.6, 0.5)
  moonGlow.position.set(winX - 0.18, winY + 0.2, winZ + 0.01)
  group.add(moonGlow)
  const frameMat = std(0x2a3654)
  group.add(box(winW + 0.1, 0.05, 0.06, frameMat, winX, winY + winH / 2, winZ + 0.02))
  group.add(box(winW + 0.1, 0.05, 0.06, frameMat, winX, winY - winH / 2, winZ + 0.02))
  group.add(box(0.05, winH + 0.1, 0.06, frameMat, winX - winW / 2, winY, winZ + 0.02))
  group.add(box(0.05, winH + 0.1, 0.06, frameMat, winX + winW / 2, winY, winZ + 0.02))
  group.add(box(0.04, winH, 0.05, frameMat, winX, winY, winZ + 0.02))
  group.add(box(winW, 0.04, 0.05, frameMat, winX, winY, winZ + 0.02))

  // ---- desk (warmer, brighter wood — board palette) ----
  const wood = std(0x7d5838, { roughness: 0.85 })
  const top = box(1.8, 0.05, 0.9, wood, 0, 0.76, 0)
  group.add(top)
  for (const [lx, lz] of [[-0.85, -0.4], [0.85, -0.4], [-0.85, 0.4], [0.85, 0.4]])
    group.add(box(0.06, 0.735, 0.06, std(0x5a3d24, { roughness: 0.9 }), lx, 0.3675, lz))

  // ---- monitor ----
  const monitor = new THREE.Group()
  monitor.add(box(0.24, 0.02, 0.16, std(0x1a2233), 0, DESK_TOP + 0.01, 0))
  monitor.add(box(0.045, 0.18, 0.045, std(0x1a2233), 0, DESK_TOP + 0.1, 0))
  const bezel = box(0.72, 0.46, 0.035, std(0x0a121f, { roughness: 0.4 }), 0, DESK_TOP + 0.42, 0)
  monitor.add(bezel)
  // screen plane gets its live texture from effects.js
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.40),
    new THREE.MeshBasicMaterial({ color: 0x0d1626 }))
  screen.position.set(0, DESK_TOP + 0.42, 0.019)
  monitor.add(screen)
  const screenHalo = glowSprite(0x6be5ff, 1.5, 0.22)
  screenHalo.position.set(0, DESK_TOP + 0.42, 0.05)
  monitor.add(screenHalo)
  monitor.position.set(0, 0, -0.16)
  monitor.rotation.x = -0.04
  group.add(monitor)
  const monitorHit = hitBox(0.78, 0.52, 0.12, 0, DESK_TOP + 0.42, -0.15)
  group.add(monitorHit)
  hotspots.monitor = { hit: monitorHit, visual: bezel, label: 'The monitor — enter the galaxy' }

  // ---- sticky notes on right bezel ----
  const noteColors = [0xffe58a, 0xffb3c8, 0xa8e6b0]
  const noteMarks = [
    textTexture('♪', { bg: '#ffe58a', fg: '#6b5510', font: 'bold 26px monospace' }),
    null,
    textTexture('zzz', { bg: '#a8e6b0', fg: '#1c5a2a', font: 'bold 18px monospace' })
  ]
  const notesGroup = new THREE.Group()
  noteColors.forEach((c, i) => {
    const mat = noteMarks[i]
      ? new THREE.MeshBasicMaterial({ map: noteMarks[i] })
      : new THREE.MeshBasicMaterial({ color: c })
    const n = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05), mat)
    n.position.set(0.315, DESK_TOP + 0.55 - i * 0.062, -0.135)
    n.rotation.z = (i % 2 ? -1 : 1) * 0.08
    n.rotation.x = -0.04
    notesGroup.add(n)
  })
  group.add(notesGroup)
  const notesHit = hitBox(0.09, 0.2, 0.08, 0.315, DESK_TOP + 0.49, -0.13)
  group.add(notesHit)
  hotspots.notes = { hit: notesHit, visual: notesGroup, label: 'Sticky notes — quick links' }

  // ---- keyboard (a hotspot: the message wall) ----
  const kb = box(0.5, 0.016, 0.16, std(0x1c2436, { roughness: 0.5 }), 0, DESK_TOP + 0.008, 0.16)
  group.add(kb)
  const keyboardHit = hitBox(0.54, 0.08, 0.2, 0, DESK_TOP + 0.03, 0.16)
  group.add(keyboardHit)
  hotspots.keyboard = { hit: keyboardHit, visual: kb, label: 'The keyboard — leave your words' }

  // ---- nameplate ----
  const plateTex = textTexture('XIAOHANG — DAVID', { w: 256, h: 52, bg: '#2b2216', fg: '#e8d9b0', font: '600 24px Georgia, serif' })
  const plateMats = [
    std(0x2b2216), std(0x2b2216), std(0x3a2f1c), std(0x1c1710),
    new THREE.MeshBasicMaterial({ map: plateTex }), std(0x2b2216)
  ]
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.016), plateMats)
  plate.position.set(0.22, DESK_TOP + 0.028, 0.36)
  plate.rotation.x = -0.3
  plate.castShadow = true
  group.add(plate)

  // ---- handheld console ----
  const handheld = new THREE.Group()
  const body = box(0.16, 0.026, 0.105, std(0x2c3452, { roughness: 0.45 }), 0, 0.013, 0)
  handheld.add(body)
  const hScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.05),
    new THREE.MeshBasicMaterial({ map: textTexture('▶ START', { w: 128, h: 96, bg: '#0e2a16', fg: '#7dde6a', font: 'bold 22px monospace' }) }))
  hScreen.rotation.x = -Math.PI / 2
  hScreen.position.set(-0.028, 0.027, 0)
  handheld.add(hScreen)
  const dpad = box(0.012, 0.006, 0.036, std(0x171d30), 0.045, 0.016, 0)
  handheld.add(dpad, box(0.036, 0.006, 0.012, std(0x171d30), 0.045, 0.016, 0))
  const btnA = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 12), std(0xc0506a))
  btnA.position.set(0.065, 0.016, 0.03)
  const btnB = btnA.clone(); btnB.material = std(0x4f7fbf); btnB.position.set(0.072, 0.016, 0.008)
  handheld.add(btnA, btnB)
  handheld.position.set(0.55, DESK_TOP, 0.22)
  handheld.rotation.y = -0.35
  group.add(handheld)
  const handheldHit = hitBox(0.22, 0.1, 0.16, 0.55, DESK_TOP + 0.03, 0.22)
  group.add(handheldHit)
  hotspots.handheld = { hit: handheldHit, visual: body, label: 'The handheld — a sleeping village' }

  // ---- paper tray + CV tab ----
  const tray = new THREE.Group()
  ;[0xe8e4d8, 0xf2eee2, 0xffffff].forEach((c, i) => {
    tray.add(box(0.24, 0.006, 0.17, std(c, { roughness: 0.9 }), (i % 2 ? 0.006 : -0.004), 0.006 + i * 0.008, (i % 2 ? -0.004 : 0.005)))
  })
  const tab = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.035),
    new THREE.MeshBasicMaterial({ map: textTexture('CV', { w: 96, h: 48 }) }))
  tab.rotation.x = -Math.PI / 2 + 0.15
  tab.position.set(0.07, 0.032, 0.06)
  tray.add(tab)
  tray.position.set(-0.6, DESK_TOP, 0.18)
  tray.rotation.y = 0.12
  group.add(tray)
  const trayHit = hitBox(0.3, 0.1, 0.24, -0.6, DESK_TOP + 0.03, 0.18)
  group.add(trayHit)
  hotspots.tray = { hit: trayHit, visual: tray, label: 'The paper tray — CV & contact' }

  // ---- photo frame ----
  const frame = new THREE.Group()
  frame.add(box(0.115, 0.095, 0.012, std(0x3a2c1c, { roughness: 0.5 }), 0, 0.0475, 0))
  const photoCanvas = document.createElement('canvas')
  photoCanvas.width = 128; photoCanvas.height = 96
  const pg = photoCanvas.getContext('2d')
  const grad = pg.createLinearGradient(0, 0, 0, 96)
  grad.addColorStop(0, '#16233c'); grad.addColorStop(1, '#2a3a5c')
  pg.fillStyle = grad; pg.fillRect(0, 0, 128, 96)
  const photoTex = new THREE.CanvasTexture(photoCanvas)
  photoTex.colorSpace = THREE.SRGBColorSpace
  // the real photos: then + now, side by side, cover-cropped when they load
  const cover = (g, img, x, y, w, h) => {
    const s = Math.max(w / img.width, h / img.height)
    const sw = w / s, sh = h / s
    g.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h)
  }
  // the frame on the desk holds only the childhood photo;
  // clicking it reveals both then and now in the card
  const p1 = new Image()
  p1.onload = () => { cover(pg, p1, 1, 1, 126, 94); photoTex.needsUpdate = true }
  p1.src = 'photos/then.jpg'
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.07),
    new THREE.MeshBasicMaterial({ map: photoTex }))
  photo.position.set(0, 0.0475, 0.007)
  frame.add(photo)
  frame.position.set(-0.52, DESK_TOP, -0.28)
  frame.rotation.y = 0.32
  frame.rotation.x = -0.06
  group.add(frame)
  const frameHit = hitBox(0.16, 0.14, 0.08, -0.52, DESK_TOP + 0.05, -0.28)
  group.add(frameHit)
  hotspots.frame = { hit: frameHit, visual: frame, label: 'The photo frame — about me' }

  // ---- mug ----
  const mug = new THREE.Group()
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.032, 0.09, 20), std(0xb8543f, { roughness: 0.4 }))
  cup.position.y = 0.045
  cup.castShadow = true
  mug.add(cup)
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.03, 20),
    new THREE.MeshBasicMaterial({ color: 0x2c150c }))
  coffee.rotation.x = -Math.PI / 2
  coffee.position.y = 0.091
  mug.add(coffee)
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.006, 8, 16), std(0xb8543f, { roughness: 0.4 }))
  handle.position.set(0.038, 0.05, 0)
  mug.add(handle)
  mug.position.set(0.33, DESK_TOP, 0.12)
  group.add(mug)
  const mugHit = hitBox(0.12, 0.14, 0.12, 0.33, DESK_TOP + 0.06, 0.12)
  group.add(mugHit)
  hotspots.mug = { hit: mugHit, visual: cup, label: 'The coffee mug — click it' }

  // ---- music box ----
  const musicbox = new THREE.Group()
  musicbox.add(box(0.12, 0.05, 0.08, std(0x7a5a3a, { roughness: 0.5 }), 0, 0.025, 0))
  musicbox.add(box(0.124, 0.008, 0.084, std(0x5d4128), 0, 0.054, 0))
  const crank = new THREE.Group()
  const crankArm = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.03, 8), std(0xc9a86a, { metalness: 0.5, roughness: 0.3 }))
  crankArm.rotation.z = Math.PI / 2
  crankArm.position.set(0.075, 0.03, 0)
  crank.add(crankArm)
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.007, 10, 10), std(0xc9a86a, { metalness: 0.5, roughness: 0.3 }))
  knob.position.set(0.09, 0.03, 0)
  crank.add(knob)
  musicbox.add(crank)
  musicbox.position.set(-0.3, DESK_TOP, -0.02)
  musicbox.rotation.y = -0.15
  group.add(musicbox)
  const musicboxHit = hitBox(0.18, 0.12, 0.14, -0.3, DESK_TOP + 0.04, -0.02)
  group.add(musicboxHit)
  hotspots.musicbox = { hit: musicboxHit, visual: musicbox, label: 'The music box — work playlist' }

  // ---- lamp ----
  const lamp = new THREE.Group()
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.02, 20), std(0x1c1710, { roughness: 0.4 }))
  lampBase.position.y = 0.01
  lamp.add(lampBase)
  const arm1 = box(0.02, 0.3, 0.02, std(0x8a6a3a, { metalness: 0.4, roughness: 0.4 }), 0, 0.16, 0)
  arm1.rotation.z = -0.25
  lamp.add(arm1)
  const arm2 = box(0.02, 0.24, 0.02, std(0x8a6a3a, { metalness: 0.4, roughness: 0.4 }), -0.09, 0.38, 0)
  arm2.rotation.z = 0.9
  lamp.add(arm2)
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.1, 20, 1, true),
    std(0x8a5230, { side: THREE.DoubleSide, roughness: 0.7, emissive: 0x502a12, emissiveIntensity: 0.6 }))
  shade.position.set(-0.2, 0.47, 0)
  shade.rotation.z = 0.5
  lamp.add(shade)
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffe9c4 }))
  bulb.position.set(-0.21, 0.45, 0)
  lamp.add(bulb)
  const bulbGlow = glowSprite(0xffd9a0, 0.85, 0.5)
  bulbGlow.position.set(-0.21, 0.44, 0)
  lamp.add(bulbGlow)
  lamp.position.set(0.72, DESK_TOP, -0.28)
  group.add(lamp)

  // ---- plant ----
  const plant = new THREE.Group()
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.032, 0.06, 14), std(0x5b3a26, { roughness: 0.8 }))
  pot.position.y = 0.03
  plant.add(pot)
  const leafMat = std(0x4f9d5d, { side: THREE.DoubleSide, roughness: 0.8 })
  for (let i = 0; i < 4; i++) {
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.14), leafMat)
    leaf.position.y = 0.12
    leaf.rotation.y = (i * Math.PI) / 2 + 0.4
    leaf.rotation.z = 0.25 * (i % 2 ? 1 : -1)
    plant.add(leaf)
  }
  plant.position.set(-0.78, DESK_TOP, -0.15)
  group.add(plant)
  const plantHit = hitBox(0.16, 0.24, 0.16, -0.78, DESK_TOP + 0.1, -0.15)
  group.add(plantHit)
  hotspots.plant = { hit: plantHit, visual: plant, label: 'The mint — an old friend' }

  scene.add(group)
  return { group, hotspots, screen, crank, mugTip: new THREE.Vector3(0.33, DESK_TOP + 0.1, 0.12), windowRegion: { x: winX, y: winY, z: winZ - 0.15, w: winW, h: winH } }
}
