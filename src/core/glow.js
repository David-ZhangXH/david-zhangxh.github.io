// Soft additive glow sprites — the cheap bloom that gives scenes their warmth.
import * as THREE from 'three'

let _tex = null
export function glowTexture() {
  if (_tex) return _tex
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  rg.addColorStop(0, 'rgba(255,255,255,1)')
  rg.addColorStop(0.35, 'rgba(255,255,255,.45)')
  rg.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = rg
  g.fillRect(0, 0, 64, 64)
  _tex = new THREE.CanvasTexture(c)
  return _tex
}

export function glowSprite(color, size, opacity = 0.5) {
  const mat = new THREE.SpriteMaterial({
    map: glowTexture(), color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false
  })
  const s = new THREE.Sprite(mat)
  s.scale.setScalar(size)
  return s
}
