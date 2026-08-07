// Builds every celestial body from works.json by status, plus the secret nebula,
// the future constellation, and the epoch marker.
// Returns { registry, group, update } — registry[id] = { hit, obj, label, work }.
import * as THREE from 'three'
import { glowSprite, labelSprite, particleCloud } from './effects.js'

const SLOTS = {
  review: [[-1.8, 0.4, 0], [-2.4, 1.0, 1.6]],
  protostar: [[1.6, 0.7, -0.8], [2.2, 1.2, -2.0]],
  nebula: [[2.4, -0.6, 1.2], [3.2, 0.2, -1.6]],
  dormant: [[-2.6, -0.8, -1.4], [-0.6, -1.2, 2.2], [-3.4, 0.2, 1.8]]
}

const short = (s, n = 26) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

function hitSphere(r, pos) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(r, 10, 10),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  )
  m.position.copy(pos)
  return m
}

export function buildBodies(scene, works) {
  const group = new THREE.Group()
  const registry = {}
  const animators = []
  const taken = { review: 0, protostar: 0, nebula: 0, dormant: 0 }
  const at = (bucket) => new THREE.Vector3(...(SLOTS[bucket][taken[bucket]++] || [0, 2 + taken[bucket], -3]))

  function register(id, obj, hit, labelText, labelColor, work) {
    group.add(obj, hit)
    let label = null
    if (labelText) {
      label = labelSprite(labelText, { color: labelColor })
      label.position.copy(hit.position).add(new THREE.Vector3(0, -0.75, 0))
      group.add(label)
    }
    hit.userData.id = id
    registry[id] = { hit, obj, label, work }
  }

  for (const w of works) {
    if (w.status === 'review') {
      // igniting star: bright core still wrapped in dust
      const pos = at('review')
      const obj = new THREE.Group()
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xeafcff }))
      const glow = glowSprite(0x9feaff, 1.7, 0.6)
      const dust = particleCloud({ count: 90, radius: 0.55, flatten: 0.9, color: 0x8a6a5a, size: 0.05, opacity: 0.5, seed: 11 })
      obj.add(core, glow, dust)
      obj.position.copy(pos)
      animators.push((dt, t) => {
        glow.scale.setScalar(1.7 + Math.sin(t * 1.3) * 0.22)
        dust.rotation.y += dt * 0.10
        dust.rotation.x += dt * 0.02
      })
      register(w.id, obj, hitSphere(0.8, pos), short(w.title), '#aef0ff', w)
    } else if (w.type === 'poster') {
      // comet touring the conferences: orbits the young universe
      const obj = new THREE.Group()
      const head = glowSprite(0xffe7b3, 0.55, 0.95)
      const kernel = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xfff4d9 }))
      obj.add(head, kernel)
      const TRAIL = 26
      const trailPts = Array.from({ length: TRAIL }, () => new THREE.Vector3(3.2, 0, 0))
      const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPts)
      const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({
        color: 0xffd27a, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending
      }))
      group.add(trail)
      const hit = hitSphere(0.7, new THREE.Vector3(3.2, 0, 0))
      const label = labelSprite(short(w.title), { color: '#ffd27a' })
      group.add(label)
      const phase = 0.8
      animators.push((dt, t) => {
        const a = t * 0.055 + phase
        const p = new THREE.Vector3(Math.cos(a) * 3.4, Math.sin(a * 1.7) * 0.55, Math.sin(a) * 3.0)
        obj.position.copy(p)
        hit.position.copy(p)
        label.position.copy(p).add(new THREE.Vector3(0, -0.65, 0))
        trailPts[0].copy(p)
        for (let i = 1; i < TRAIL; i++) trailPts[i].lerp(trailPts[i - 1], Math.min(1, dt * (9 - i * 0.25)))
        trailGeo.setFromPoints(trailPts)
      })
      group.add(obj, hit)
      hit.userData.id = w.id
      registry[w.id] = { hit, obj, label, work: w }
    } else if (w.status === 'ongoing' && w.type === 'paper') {
      // protostar: flickering, igniting soon
      const pos = at('protostar')
      const obj = new THREE.Group()
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 20),
        new THREE.MeshBasicMaterial({ color: 0xffc79a }))
      const glow = glowSprite(0xff9d6b, 1.3, 0.55)
      const halo = glowSprite(0xff9d6b, 2.2, 0.18)
      obj.add(core, glow, halo)
      obj.position.copy(pos)
      let flick = 0
      animators.push((dt, t) => {
        if (t > flick) {
          flick = t + 0.12 + Math.abs(Math.sin(t * 13)) * 0.3
          glow.material.opacity = 0.4 + Math.abs(Math.sin(t * 17)) * 0.35
        }
        obj.position.y = pos.y + Math.sin(t * 0.8) * 0.04
      })
      register(w.id, obj, hitSphere(0.75, pos), short(w.title), '#ff9d6b', w)
    } else if (w.status === 'ongoing') {
      // ongoing project: a nebula, slowly condensing
      const pos = at('nebula')
      const obj = new THREE.Group()
      obj.add(glowSprite(0x7ddeb0, 2.0, 0.14), glowSprite(0x7ddeb0, 1.3, 0.18))
      const cloud = particleCloud({ count: 170, radius: 0.75, color: 0x8fe8c2, seed: 23 })
      obj.add(cloud)
      obj.position.copy(pos)
      animators.push((dt) => { cloud.rotation.y += dt * 0.05 })
      register(w.id, obj, hitSphere(0.95, pos), short(w.title), '#7ddeb0', w)
    } else {
      // paused: dormant nebula — dimmed, drifting slower, not gone
      const pos = at('dormant')
      const obj = new THREE.Group()
      obj.add(glowSprite(0x8a7aa8, 1.7, 0.08), glowSprite(0x8a7aa8, 1.1, 0.10))
      const cloud = particleCloud({ count: 120, radius: 0.65, color: 0x9a8ab8, size: 0.03, opacity: 0.35, seed: 37 + taken.dormant * 7 })
      obj.add(cloud)
      obj.position.copy(pos)
      animators.push((dt) => { cloud.rotation.y += dt * 0.012 })
      register(w.id, obj, hitSphere(0.85, pos), short(w.title), '#8a7aa8', w)
    }
  }

  // ---- the secret nebula: unlabeled, almost invisible, far out ----
  {
    const pos = new THREE.Vector3(6.5, -1.8, -3.5)
    const obj = new THREE.Group()
    obj.add(glowSprite(0x6b4a8a, 2.2, 0.05), glowSprite(0x6b4a8a, 1.3, 0.06))
    const cloud = particleCloud({ count: 90, radius: 0.9, color: 0x8a6ab0, size: 0.028, opacity: 0.16, seed: 77 })
    obj.add(cloud)
    obj.position.copy(pos)
    animators.push((dt) => { cloud.rotation.y += dt * 0.006 })
    const hit = hitSphere(1.25, pos)
    group.add(obj, hit)
    hit.userData.id = 'secret'
    registry.secret = { hit, obj, label: null, work: null } // no label. ever.
  }

  // ---- future constellation ----
  {
    const pts = [[-0.2, 2.1, -2.4], [0.6, 2.5, -2.7], [1.3, 2.1, -2.3], [1.0, 1.6, -2.6]]
      .map(p => new THREE.Vector3(...p))
    const geo = new THREE.BufferGeometry().setFromPoints([...pts, pts[0]])
    const line = new THREE.Line(geo, new THREE.LineDashedMaterial({
      color: 0x5a6682, dashSize: 0.08, gapSize: 0.1, transparent: true, opacity: 0.4
    }))
    line.computeLineDistances()
    group.add(line)
    for (const p of pts) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x5a6682 }))
      dot.position.copy(p)
      group.add(dot)
    }
    const lbl = labelSprite('future work — room to grow', { color: '#5a6682', opacity: 0.5, italic: true })
    lbl.position.set(0.55, 1.25, -2.5)
    group.add(lbl)
  }

  // ---- epoch marker ----
  const epoch = labelSprite('universe est. 2026', { color: '#8b93a7', opacity: 0.45 })
  epoch.position.set(0, -2.4, 0)
  group.add(epoch)

  scene.add(group)
  return { registry, group, update: (dt, t) => { for (const fn of animators) fn(dt, t) } }
}
