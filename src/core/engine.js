// Shared three.js runtime: renderer, scene, camera, loop, resize, pause, dispose.
// Worlds add their own lights, objects, and camera choreography.
import * as THREE from 'three'

export function createEngine(container, {
  background = 0x000000,
  fog = null,               // [color, near, far]
  fovFor = () => 50,        // (aspect) => fov
  shadows = false
} = {}) {
  // Never trust a 0-sized container (styles may land a frame late) — fall back
  // to the viewport and self-heal on the next frame.
  const measure = () => [container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight]
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  const [w0, h0] = measure()
  renderer.setSize(w0, h0)
  if (shadows) {
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
  }
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(background)
  if (fog) scene.fog = new THREE.Fog(...fog)

  const aspect = w0 / h0
  const camera = new THREE.PerspectiveCamera(fovFor(aspect), aspect, 0.1, 60)

  const clock = new THREE.Clock()
  const ticks = new Set()
  let raf = 0
  let running = false

  function frame() {
    raf = requestAnimationFrame(frame)
    const dt = Math.min(clock.getDelta(), 0.05)
    const t = clock.elapsedTime
    for (const fn of ticks) fn(dt, t)
    renderer.render(scene, camera)
  }
  const start = () => { if (!running) { running = true; clock.getDelta(); frame() } }
  const stop = () => { running = false; cancelAnimationFrame(raf) }
  const onVis = () => { document.hidden ? stop() : start() }
  const onResize = () => {
    const [w, h] = measure()
    camera.aspect = w / h
    camera.fov = fovFor(camera.aspect)
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  document.addEventListener('visibilitychange', onVis)
  window.addEventListener('resize', onResize)
  requestAnimationFrame(onResize) // self-heal once styles have settled

  return {
    renderer, scene, camera,
    onTick: (fn) => { ticks.add(fn); return () => ticks.delete(fn) },
    start, stop,
    dispose() {
      stop()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('resize', onResize)
      scene.traverse((o) => {
        o.geometry?.dispose?.()
        const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : [])
        for (const m of mats) { m.map?.dispose?.(); m.dispose?.() }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }
}
