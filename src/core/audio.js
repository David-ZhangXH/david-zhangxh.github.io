// Ambience, generated entirely in WebAudio — no audio files, nothing to load.
// The music box on the desk is the master switch; every world plays its own
// quiet profile when sound is on. Everything is off by default.

const KEY = 'davidworld:sound'
let ctx = null
let master = null
let stops = []

export const soundOn = () => localStorage.getItem(KEY) === 'on'

function ensureCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    master = ctx.createGain()
    master.gain.value = 0.9
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
}

function noiseBuffer() {
  const len = ctx.sampleRate * 2
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  return buf
}

// ---- desk: rain + a slow original music-box loop ----
function startDesk() {
  // rain: band-passed noise
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer()
  src.loop = true
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 250
  const g = ctx.createGain(); g.gain.value = 0.045
  src.connect(hp).connect(lp).connect(g).connect(master)
  src.start()
  stops.push(() => { try { src.stop() } catch {} })

  // music box: original 16-step pentatonic lullaby (A minor penta, gentle)
  const NOTES = [440, 523.25, 587.33, 659.25, 783.99] // A4 C5 D5 E5 G5
  const SEQ = [0, 2, 4, 3, 2, 0, 1, 2, 3, 4, 3, 1, 2, 1, 0, -1] // -1 = rest
  let step = 0
  const pluck = (freq) => {
    const o = ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = freq * 2 // music boxes sing an octave up
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.09, ctx.currentTime)
    env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4)
    o.connect(env).connect(master)
    o.start()
    o.stop(ctx.currentTime + 1.5)
  }
  const timer = setInterval(() => {
    const n = SEQ[step % SEQ.length]
    if (n >= 0) pluck(NOTES[n])
    step++
  }, 857) // ~70bpm
  stops.push(() => clearInterval(timer))
}

// ---- galaxy: two detuned drones breathing slowly ----
function startGalaxy() {
  for (const [f, det] of [[110, 0], [165, 3]]) {
    const o = ctx.createOscillator()
    o.type = 'sine'; o.frequency.value = f; o.detune.value = det
    const g = ctx.createGain(); g.gain.value = 0.02
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07 + det * 0.01
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.012
    lfo.connect(lfoG).connect(g.gain)
    o.connect(g).connect(master)
    o.start(); lfo.start()
    stops.push(() => { try { o.stop(); lfo.stop() } catch {} })
  }
}

// ---- village: a tiny square-wave arpeggio, far away ----
function startVillage() {
  const NOTES = [523.25, 659.25, 783.99, 659.25] // C E G E
  let step = 0
  const timer = setInterval(() => {
    const o = ctx.createOscillator()
    o.type = 'square'
    o.frequency.value = NOTES[step % NOTES.length]
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.016, ctx.currentTime)
    env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22)
    o.connect(env).connect(master)
    o.start(); o.stop(ctx.currentTime + 0.25)
    step++
  }, 428) // ~140bpm
  stops.push(() => clearInterval(timer))
}

const PROFILES = { desk: startDesk, galaxy: startGalaxy, village: startVillage }

export function startProfile(name) {
  if (!soundOn()) return
  ensureCtx()
  stopAll()
  PROFILES[name]?.()
}

// a distant roll of thunder, for the lightning outside the window
export function thunder() {
  if (!soundOn()) return
  ensureCtx()
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer()
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160
  const g = ctx.createGain()
  const now = ctx.currentTime
  g.gain.setValueAtTime(0.0001, now)
  g.gain.exponentialRampToValueAtTime(0.28, now + 0.25)
  g.gain.exponentialRampToValueAtTime(0.12, now + 1.2)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 3.4)
  src.connect(lp).connect(g).connect(master)
  src.start(now)
  src.stop(now + 3.6)
}

export function stopAll() {
  for (const fn of stops.splice(0)) fn()
}

export function toggle(profile) {
  const next = soundOn() ? 'off' : 'on'
  localStorage.setItem(KEY, next)
  if (next === 'on') startProfile(profile)
  else stopAll()
  return next === 'on'
}
