// Desk-specific scene: midnight palette, lamp + screen glow, home camera.
import * as THREE from 'three'
import { createEngine } from '../core/engine.js'

export function createScene(container) {
  const engine = createEngine(container, {
    background: 0x0a0f1e,
    fog: [0x0a0f1e, 3.5, 9],
    fovFor: (aspect) => (aspect < 0.8 ? 62 : 42), // portrait phones see more desk
    shadows: true
  })
  const { scene, camera } = engine
  camera.position.set(0, 1.35, 1.9)
  camera.lookAt(0, 0.95, -0.2)

  // Illustration-style lighting: generous soft fill so nothing falls to black,
  // then warm/cool accents for mood — the concept-board color script.
  scene.add(new THREE.HemisphereLight(0x3a5480, 0x4a3520, 1.25))
  scene.add(new THREE.AmbientLight(0x26365c, 0.55))
  const moon = new THREE.DirectionalLight(0xa8c8ff, 0.65)
  moon.position.set(-2.5, 2.6, 1.2)
  scene.add(moon)

  const screenGlow = new THREE.PointLight(0x6be5ff, 2.2, 3.2, 1.6)
  screenGlow.position.set(0, 1.12, 0.05)
  scene.add(screenGlow)

  const lampLight = new THREE.SpotLight(0xffd9a0, 16, 4.5, Math.PI / 4.2, 0.9, 1.5)
  lampLight.position.set(0.7, 1.32, -0.24)
  lampLight.castShadow = true
  lampLight.shadow.mapSize.set(1024, 1024)
  lampLight.shadow.bias = -0.002
  scene.add(lampLight, lampLight.target)
  lampLight.target.position.set(0.15, 0.78, 0.12)

  return { ...engine, lampLight, screenGlow }
}
