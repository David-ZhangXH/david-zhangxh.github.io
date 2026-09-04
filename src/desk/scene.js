// Desk-specific scene: midnight palette, lamp + screen glow, home camera.
import * as THREE from 'three'
import { createEngine } from '../core/engine.js'

export function createScene(container) {
  const engine = createEngine(container, {
    background: 0x05050a,
    // At 16:9 the artwork fills the viewport. Narrower windows widen the
    // vertical field of view enough to keep desktop compositions contained;
    // phones use a legible close-up and pan across the wider studio.
    // COVER fit: the artwork always fills the whole window (the shorter
    // axis crops slightly instead of showing black bars at the sides).
    // cover-fit: the painting always fills the screen. On a phone that means a
    // tall slice of the desk — the visitor drags sideways to look around.
    fovFor: (aspect) => {
      const t = Math.min(1.125 / 3, 2 / (3 * aspect))
      return THREE.MathUtils.radToDeg(2 * Math.atan(t))
    },
    shadows: true
  })
  const { scene, camera, renderer } = engine
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  camera.position.set(0, 0, 2)
  camera.lookAt(0, 0, -1)

  // Illustration-style lighting: generous soft fill so nothing falls to black,
  // then warm/cool accents for mood — the concept-board color script.
  // The concept image already contains its photographic lighting. A tiny
  // practical light remains for the existing candle-flicker timing hook.
  const lampLight = new THREE.PointLight(0xffb06d, 0.45, 1.2, 2)
  lampLight.position.set(1.63, -0.4, -0.65)
  scene.add(lampLight)

  const screenGlow = new THREE.PointLight(0x756fff, 0.25, 1.5, 2)
  screenGlow.position.set(-0.25, 0.34, -0.7)
  scene.add(screenGlow)

  return { ...engine, lampLight, screenGlow }
}
