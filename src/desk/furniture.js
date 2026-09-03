// High-fidelity 2.5D studio scene.
// The approved concept art supplies the exact materials and room design;
// live WebGL layers add depth, animation, camera movement, and interactions.
import * as THREE from 'three'
import { glowSprite } from '../core/glow.js'
// imported as a module asset so its filename carries a content hash —
// browsers can never show a stale artwork after an update
import studioDeskUrl from '../assets/studio-desk.webp'

const ART_W = 4
const ART_H = 2.25
const ART_Z = -1

function hitPlane(w, h, x, y, z = ART_Z + 0.055) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  )
  mesh.position.set(x, y, z)
  return mesh
}

function addGlow(group, color, size, opacity, x, y) {
  const glow = glowSprite(color, size, opacity)
  glow.position.set(x, y, ART_Z + 0.035)
  group.add(glow)
  return glow
}

function quadGeometry(points, uvs = [
  0, 0,
  1, 0,
  1, 1,
  0, 1
]) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flatMap(([x, y]) => [x, y, 0]), 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex([0, 1, 2, 0, 2, 3])
  geometry.computeVertexNormals()
  return geometry
}

const SCREEN_APERTURE = [
  [-0.751, -0.063], // bottom-left
  [0.397, 0.023],   // bottom-right
  [0.397, 0.704],   // top-right
  [-0.768, 0.699]   // top-left
]

const SCREEN_UNDER_GLASS = [
  [-0.770, -0.082],
  [0.416, 0.004],
  [0.416, 0.723],
  [-0.787, 0.718]
]

function ringGeometry(outer, inner) {
  const positions = []
  const indices = []
  for (let edge = 0; edge < 4; edge++) {
    const next = (edge + 1) % 4
    const quad = [outer[edge], outer[next], inner[next], inner[edge]]
    const base = positions.length / 3
    positions.push(...quad.flatMap(([x, y]) => [x, y, 0]))
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export function buildFurniture(scene) {
  const group = new THREE.Group()
  const hotspots = {}

  // Exact approved artwork, presented as a color-managed, unlit scene surface.
  const loader = new THREE.TextureLoader()
  const artTexture = loader.load(studioDeskUrl)
  artTexture.colorSpace = THREE.SRGBColorSpace
  artTexture.minFilter = THREE.LinearMipmapLinearFilter
  artTexture.magFilter = THREE.LinearFilter
  artTexture.anisotropy = 8

  const artMaterial = new THREE.MeshBasicMaterial({ map: artTexture, toneMapped: false })
  const art = new THREE.Mesh(new THREE.PlaneGeometry(ART_W, ART_H), artMaterial)
  art.position.z = ART_Z
  group.add(art)

  // The monitor remains alive over the painted bezel. Its proportions and
  // placement match the exact screen rectangle in the approved artwork.
  const screen = new THREE.Mesh(
    quadGeometry(SCREEN_UNDER_GLASS),
    new THREE.MeshBasicMaterial({ color: 0x080d1a, toneMapped: false })
  )
  screen.position.z = ART_Z + 0.025
  group.add(screen)

  // A real foreground bezel hides every edge of the animated surface. The
  // screen extends underneath this ring, so resizing and texture filtering can
  // never reveal the painted monitor image below it.
  const screenBezel = new THREE.Mesh(
    ringGeometry(SCREEN_UNDER_GLASS, SCREEN_APERTURE),
    new THREE.MeshBasicMaterial({ color: 0x07070d, toneMapped: false, side: THREE.DoubleSide })
  )
  screenBezel.position.z = ART_Z + 0.038
  group.add(screenBezel)

  // David's childhood photo is baked directly into the artwork itself
  // (portrait-cropped, night-graded, perspective-warped into the painted
  // frame's aperture with its inner shadow) — no separate layer means no
  // parallax, no texture shear, no seams. The frame hotspot below still
  // opens the About card with the bright original.

  // Restrained light layers preserve the illustration while allowing the room
  // to breathe: monitor bloom, magenta tube, cyan wall cells, and candle glow.
  addGlow(group, 0x756fff, 1.25, 0.10, -0.18, 0.33)
  addGlow(group, 0xdd4fff, 0.42, 0.24, -1.04, 0.52)
  addGlow(group, 0xb64cff, 0.58, 0.18, 1.34, 0.78)
  addGlow(group, 0x67cfff, 0.36, 0.16, 1.40, 0.64)
  addGlow(group, 0xffa657, 0.20, 0.28, 1.64, -0.40)

  // Hotspots are mapped directly to their painted objects. They stay invisible
  // but participate in raycasting and keyboard navigation.
  const definitions = {
    monitor: {
      rect: [1.20, 0.79, -0.18, 0.33],
      visual: screen,
      label: 'The monitor'
    },
    handheld: {
      rect: [0.52, 0.34, 1.26, -0.21],
      visual: art,
      label: 'The docked handheld'
    },
    tray: {
      rect: [1.03, 0.43, -1.39, -0.63],
      visual: art,
      label: 'The CV tray'
    },
    frame: {
      rect: [0.47, 0.35, -1.45, -0.20],
      visual: art,
      label: 'The childhood photo'
    },
    mug: {
      rect: [0.31, 0.34, -0.75, -0.49],
      visual: art,
      label: 'The red coffee mug'
    },
    notes: {
      rect: [0.22, 0.73, -1.20, 0.57],
      visual: art,
      label: 'The three notes'
    },
    musicbox: {
      rect: [0.37, 0.64, -0.99, -0.03],
      visual: art,
      label: 'The studio speaker'
    },
    plant: {
      rect: [0.43, 0.81, -1.82, -0.22],
      visual: art,
      label: 'The houseplant'
    },
    keyboard: {
      rect: [0.96, 0.28, -0.03, -0.46],
      visual: art,
      label: 'The keyboard'
    },
    mouse: {
      rect: [0.30, 0.20, 0.62, -0.40],
      visual: art,
      label: 'The mouse'
    },
    candle: {
      rect: [0.28, 0.44, 1.73, -0.26],
      visual: art,
      label: 'The candle'
    },
    shelf: {
      rect: [0.54, 0.50, 1.02, 0.39],
      visual: art,
      label: 'The bookshelves'
    },
    headphones: {
      rect: [0.32, 0.42, 0.76, -0.07],
      visual: art,
      label: 'The headphones'
    }
  }

  for (const [id, definition] of Object.entries(definitions)) {
    const [w, h, x, y] = definition.rect
    const hit = hitPlane(w, h, x, y)
    group.add(hit)
    hotspots[id] = { hit, visual: definition.visual, label: definition.label }
  }

  // The audio loop expects a transform. It stays aligned with the single
  // speaker that now represents the music interaction.
  const crank = new THREE.Group()
  crank.position.set(-0.99, -0.03, ART_Z + 0.04)
  group.add(crank)

  scene.add(group)
  return {
    group,
    hotspots,
    screen,
    crank,
    mugTip: new THREE.Vector3(-0.75, -0.34, ART_Z + 0.075),
    windowRegion: { x: -1.72, y: 0.48, z: ART_Z + 0.06, w: 0.56, h: 1.43 }
  }
}
