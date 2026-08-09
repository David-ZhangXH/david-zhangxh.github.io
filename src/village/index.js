// Village 2.0: lock → a one-screen town → walkable interiors.
// Move with WASD/arrows, or click anywhere (doors auto-enter, objects auto-open).
import { TILE, SCENES, RETURN_SPOTS } from './map.js'
import { makeSprites } from './sprites.js'
import { createRenderer } from './render.js'
import { createPuzzle, claimCode } from './puzzle.js'
import { createLock } from './lock.js'
import { createQuests, QUEST_IDS, QUEST_LABELS } from './quests.js'
import * as ui from './panels.js'
import { drawShareCard } from './share.js'
import * as audio from '../core/audio.js'
import '../core/overlay.css'
import './village.css'
import village from '../../content/village.json'
import profile from '../../content/profile.json'

const UNLOCK_KEY = 'davidworld:unlocked'
const BEST_KEY = 'davidworld:puzzle-best'
const RECORD_MS = 26000

// names that float above whatever the player faces or hovers
const LABELS = {
  school: 'SCHOOL', lab: 'LAB', home: 'HOME', library: 'LIBRARY',
  arcade: 'ARCADE', mailbox: 'MAILBOX', npc1: 'VILLAGER', npc2: 'LIBRARIAN',
  musicbox: 'MUSIC BOX', tv: 'TELEVISION', laptop: 'GAMING LAPTOP',
  music_corner: 'MUSIC CORNER', shelves: 'BOOK-SHELVES', board: 'PICTURE BOARD',
  memory: 'SECRET MEMORY', toy: 'THE TOY', bigbook: 'THE BIG BOOK',
  worldmap: 'WORLD MAP', tape: 'VIDEO-TAPE', jerseys: 'JERSEY WALL',
  go: '围棋 · GO', games: 'TABLE GAMES',
  yuying: 'YUYING', s101: '101 MIDDLE SCHOOL', bu: 'BOSTON UNIVERSITY',
  bio: 'BIOLOGY', chem: 'CHEMISTRY', env: 'ENVIRONMENTAL SCIENCE',
  docs: 'LIFE DOCUMENTS', quiz: "THE LIBRARIAN'S QUIZ"
}

export function mountVillage({ onExit, onClassic } = {}) {
  const cleanup = []
  const on = (el, ev, fn, opts) => { el.addEventListener(ev, fn, opts); cleanup.push(() => el.removeEventListener(ev, fn, opts)) }
  const quests = createQuests(localStorage)

  const root = document.createElement('div')
  root.id = 'village-root'
  document.body.appendChild(root)

  const toastNow = (text) => {
    const t = document.createElement('div')
    t.innerHTML = ui.toast(text)
    document.body.appendChild(t.firstElementChild)
    setTimeout(() => document.querySelectorAll('.v-toast').forEach(x => x.remove()), 2700)
  }
  let showShare = null
  const questToast = (id) => {
    if (!quests.complete(id)) return
    toastNow(`QUEST COMPLETE — ${QUEST_LABELS[id]}`)
    if (quests.allDone()) setTimeout(() => showShare?.(), 1500)
  }

  // ---------- THE LOCK (unchanged ritual) ----------
  let world = null
  if (localStorage.getItem(UNLOCK_KEY) === 'yes') {
    world = startWorld()
  } else {
    const lock = createLock({
      code: '0716',
      onUnlock() {
        localStorage.setItem(UNLOCK_KEY, 'yes')
        lockEl.remove()
        world = startWorld()
        questToast('passcode')
      }
    })
    const lockEl = document.createElement('div')
    lockEl.className = 'v-lock'
    lockEl.innerHTML = `
      <div class="v-shell">
        <div class="v-screen">
          <h3>LOCKED</h3>
          <div class="v-code">
            ${[0, 1, 2, 3].map(i => `<input inputmode="numeric" maxlength="1" data-d="${i}" aria-label="digit ${i + 1}">`).join('')}
          </div>
          <p class="v-hint">hint: the day it all began</p>
          <p class="v-nudge" hidden>maybe the photo frame remembers…</p>
        </div>
        <button class="v-btn" data-try>unlock</button>
      </div>
      <button class="corner-btn" data-giveup>⌫ back to desk</button>`
    document.body.appendChild(lockEl)
    const inputs = [...lockEl.querySelectorAll('input')]
    inputs[0].focus()
    inputs.forEach((inp, i) => {
      on(inp, 'input', () => { if (inp.value && i < 3) inputs[i + 1].focus() })
      on(inp, 'keydown', (e) => {
        if (e.key === 'Backspace' && !inp.value && i > 0) inputs[i - 1].focus()
        if (e.key === 'Enter') attempt()
      })
    })
    const attempt = () => {
      const res = lock.try(inputs.map(x => x.value).join(''))
      if (res === 'open') return
      lockEl.querySelector('.v-shell').classList.remove('shake')
      void lockEl.querySelector('.v-shell').offsetWidth
      lockEl.querySelector('.v-shell').classList.add('shake')
      inputs.forEach(x => { x.value = '' })
      inputs[0].focus()
      if (res === 'nudge') lockEl.querySelector('.v-nudge').hidden = false
    }
    on(lockEl.querySelector('[data-try]'), 'click', attempt)
    on(lockEl.querySelector('[data-giveup]'), 'click', () => { unmount(); onExit?.() })
    cleanup.push(() => lockEl.remove())
  }

  // ---------- THE WORLD (town + interiors) ----------
  function startWorld() {
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'width:100%;height:100%'
    root.appendChild(canvas)
    const sprites = makeSprites()
    const renderer = createRenderer(canvas, sprites)
    on(window, 'resize', renderer.resize)

    let sceneName = 'town'
    let scene = SCENES.town
    const player = {
      tx: scene.spawn.x, ty: scene.spawn.y,
      px: scene.spawn.x * TILE, py: scene.spawn.y * TILE,
      dir: [0, -1], moving: false
    }
    let path = []            // click-to-move steps
    let pendingZone = null   // interact when we arrive next to it

    function goScene(name, at) {
      sceneName = name
      scene = SCENES[name]
      const spot = at || scene.spawn
      player.tx = spot.x; player.ty = spot.y
      player.px = spot.x * TILE; player.py = spot.y * TILE
      path = []; pendingZone = null; hoverZone = null
      root.classList.remove('flash'); void root.offsetWidth; root.classList.add('flash')
    }

    const held = new Set()
    const KEYMAP = {
      ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
      w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0]
    }
    let overlayOpen = false
    on(window, 'keydown', (e) => {
      if (overlayOpen) return
      if (KEYMAP[e.key]) { held.add(e.key); path = []; pendingZone = null; e.preventDefault() }
      if (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === ' ') interactFacing()
      if (e.key === 'q' || e.key === 'Q') openQuestLog()
      if (e.key === 'Escape') openPause()
    })
    on(window, 'keyup', (e) => held.delete(e.key))

    // ---- click / tap to move ----
    function bfsPath(from, to) {
      const key = (x, y) => `${x},${y}`
      const prev = new Map([[key(from.x, from.y), null]])
      const q = [[from.x, from.y]]
      while (q.length) {
        const [x, y] = q.shift()
        if (x === to.x && y === to.y) break
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy
          if (!scene.isWalkable(nx, ny) || prev.has(key(nx, ny))) continue
          // never route THROUGH the door mat by accident — only onto it,
          // and only when the mat itself is where you clicked
          if (scene.exitAt(nx, ny) && !(nx === to.x && ny === to.y)) continue
          prev.set(key(nx, ny), [x, y])
          q.push([nx, ny])
        }
      }
      if (!prev.has(key(to.x, to.y))) return null
      const steps = []
      let cur = [to.x, to.y]
      while (cur && !(cur[0] === from.x && cur[1] === from.y)) {
        steps.unshift({ x: cur[0], y: cur[1] })
        cur = prev.get(key(cur[0], cur[1]))
      }
      return steps
    }
    on(canvas, 'pointerdown', (e) => {
      if (overlayOpen) return
      const t = renderer.screenToTile(e.clientX, e.clientY)
      const cat = catAt(t.x, t.y)
      if (cat) { openOverlay(ui.objectPanel(cat.name, cat.line)); return }
      const zone = scene.zoneAt(t.x, t.y)
      let goal = null
      if (zone) {
        // walk to the nearest open side of the object, then use it
        const options = [[0, 1], [0, -1], [1, 0], [-1, 0]]
          .map(([dx, dy]) => ({ x: t.x + dx, y: t.y + dy }))
          .filter(p => scene.isWalkable(p.x, p.y))
          .map(p => ({ p, path: bfsPath({ x: player.tx, y: player.ty }, p) }))
          .filter(o => o.path)
          .sort((a, b) => a.path.length - b.path.length)
        if (options[0]) { goal = options[0]; pendingZone = { id: zone, x: t.x, y: t.y } }
      } else if (scene.isWalkable(t.x, t.y)) {
        const p = bfsPath({ x: player.tx, y: player.ty }, t)
        if (p) { goal = { path: p }; pendingZone = null }
      }
      if (goal) { held.clear(); path = goal.path }
    })

    // ---- the three house cats: they live in HOME and wander ----
    const catSpots = [[3, 4], [10, 6], [6, 6]]
    const cats = (village.home.cats || []).map((c, i) => ({
      ...c,
      tx: catSpots[i % 3][0], ty: catSpots[i % 3][1],
      px: catSpots[i % 3][0] * TILE, py: catSpots[i % 3][1] * TILE,
      path: [], waitUntil: 1 + i * 2, moving: false
    }))
    const CAT_SPEED = 42
    const catRand = (() => { let s = 12345; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff } })()
    function catStep(dt, t) {
      if (sceneName !== 'home') return
      const home = SCENES.home
      for (const c of cats) {
        const targetX = c.tx * TILE, targetY = c.ty * TILE
        const dx = targetX - c.px, dy = targetY - c.py
        if (dx || dy) {
          c.moving = true
          const dist = CAT_SPEED * dt
          c.px += Math.abs(dx) <= dist ? dx : Math.sign(dx) * dist
          c.py += Math.abs(dy) <= dist ? dy : Math.sign(dy) * dist
          continue
        }
        c.moving = false
        if (c.path.length) {
          const next = c.path.shift()
          c.tx = next.x; c.ty = next.y
          continue
        }
        if (t > c.waitUntil) {
          // pick a nearby spot to saunter to (never the door mat)
          for (let tries = 0; tries < 8; tries++) {
            const nx = c.tx + Math.floor(catRand() * 7) - 3
            const ny = c.ty + Math.floor(catRand() * 5) - 2
            if (!home.isWalkable(nx, ny) || home.exitAt(nx, ny)) continue
            if (nx === player.tx && ny === player.ty) continue
            const p = bfsPath({ x: c.tx, y: c.ty }, { x: nx, y: ny })
            if (p && p.length) { c.path = p; break }
          }
          c.waitUntil = t + 2.5 + catRand() * 5
        }
      }
    }
    const catAt = (tx, ty) => sceneName === 'home'
      ? cats.find(c => Math.round(c.px / TILE) === tx && Math.round(c.py / TILE) === ty) || null
      : null

    // hover: pointer cursor + name label (cats first — they're alive)
    let hoverZone = null
    let hoverCat = null
    on(canvas, 'pointermove', (e) => {
      const t = renderer.screenToTile(e.clientX, e.clientY)
      hoverCat = catAt(t.x, t.y)
      hoverZone = hoverCat ? null : scene.zoneAt(t.x, t.y)
      canvas.style.cursor = (hoverCat || hoverZone) ? 'pointer' : 'default'
    })
    on(canvas, 'pointerleave', () => { hoverZone = null; hoverCat = null; canvas.style.cursor = 'default' })

    // ---- movement ----
    const SPEED = 110
    function step(dt) {
      const targetX = player.tx * TILE, targetY = player.ty * TILE
      const dx = targetX - player.px, dy = targetY - player.py
      if (dx || dy) {
        player.moving = true
        const dist = SPEED * dt
        player.px += Math.abs(dx) <= dist ? dx : Math.sign(dx) * dist
        player.py += Math.abs(dy) <= dist ? dy : Math.sign(dy) * dist
        return
      }
      player.moving = false
      // arrived on an exit? leave the room
      const exit = scene.exitAt(player.tx, player.ty)
      if (exit) { goScene('town', RETURN_SPOTS[sceneName]); return }
      // keyboard first
      for (const k of held) {
        const d = KEYMAP[k]
        if (!d) continue
        player.dir = d
        const nx = player.tx + d[0], ny = player.ty + d[1]
        if (scene.isWalkable(nx, ny)) { player.tx = nx; player.ty = ny }
        return
      }
      // then any click-path
      if (path.length) {
        const next = path.shift()
        player.dir = [Math.sign(next.x - player.tx), Math.sign(next.y - player.ty)]
        player.tx = next.x; player.ty = next.y
        return
      }
      // path finished — use the thing we walked to
      if (pendingZone) {
        player.dir = [Math.sign(pendingZone.x - player.tx), Math.sign(pendingZone.y - player.ty)]
        const z = pendingZone; pendingZone = null
        useZone(z.id)
      }
    }

    function interactFacing() {
      if (overlayOpen) return
      const z = scene.zoneAt(player.tx + player.dir[0], player.ty + player.dir[1])
      if (z) useZone(z)
    }

    // ---------- overlays ----------
    const overlayHost = document.createElement('div')
    document.body.appendChild(overlayHost)
    cleanup.push(() => overlayHost.remove())
    function openOverlay(html, wire) {
      overlayOpen = true
      overlayHost.innerHTML = `<div class="v-overlay">${html}</div>`
      const panel = overlayHost.querySelector('.v-panel')
      const close = document.createElement('button')
      close.className = 'v-close'
      close.textContent = '✕'
      close.setAttribute('aria-label', 'Close')
      panel.prepend(close)
      close.addEventListener('click', closeOverlay)
      overlayHost.firstElementChild.addEventListener('click', (e) => {
        if (e.target === overlayHost.firstElementChild) closeOverlay()
      })
      const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeOverlay() } }
      if (overlayHost._esc) window.removeEventListener('keydown', overlayHost._esc, true)
      window.addEventListener('keydown', esc, true)
      overlayHost._esc = esc
      wire?.(panel)
      close.focus()
    }
    function closeOverlay() {
      if (overlayHost._esc) window.removeEventListener('keydown', overlayHost._esc, true)
      overlayHost._esc = null
      overlayHost._arcadeStop?.()
      overlayHost._arcadeStop = null
      overlayHost.innerHTML = ''
      overlayOpen = false
    }

    const dialogues = {}
    function talk(npcId, speaker) {
      const lines = village.npcs[npcId] || ['…']
      const i = dialogues[npcId] = ((dialogues[npcId] ?? -1) + 1) % lines.length
      document.querySelectorAll('.v-dialogue').forEach(d => d.remove())
      const holder = document.createElement('div')
      holder.innerHTML = ui.dialogueBox(speaker, lines[i], i < lines.length - 1)
      const box = holder.firstElementChild
      document.body.appendChild(box)
      box.addEventListener('click', () => box.remove())
      setTimeout(() => box.isConnected && box.remove(), 6000)
    }

    // ---------- what each thing does ----------
    function useZone(id) {
      // town
      if (['home', 'school', 'lab', 'library'].includes(id) && sceneName === 'town') return goScene(id)
      if (id === 'mailbox') return openLetter()
      if (id === 'arcade') return openArcade()
      if (id === 'npc1') return talk('villager', 'VILLAGER')
      if (id === 'npc2') return talk('librarian', 'LIBRARIAN')
      // home
      if (id === 'worldmap') return openOverlay(ui.worldmapPanel(village.home.worldmap))
      if (id === 'memory') return openMemory()
      if (id === 'jerseys') return openOverlay(ui.jerseysPanel(village.home.jerseys))
      if (id === 'musicbox') return openOverlay(ui.musicboxPanel(village.home.musicbox))
      if (id === 'tv') return openOverlay(ui.tvPanel(village.home.tv))
      if (id === 'laptop') return openOverlay(ui.laptopPanel(village.home.laptop))
      if (id === 'music_corner') return openOverlay(ui.itemsPanel(village.home.music_corner))
      if (id === 'shelves') return openOverlay(ui.shelvesPanel(village.home.shelves))
      if (id === 'games') return openOverlay(ui.gamesPanel(village.home.games))
      if (village.home[id]) return openOverlay(ui.objectPanel(village.home[id].title, village.home[id].text))
      // school + lab
      const school = village.schools.find(s => s.id === id)
      if (school) return openOverlay(ui.objectPanel(school.name, school.text))
      const table = village.lab.find(l => l.id === id)
      if (table) return openOverlay(ui.objectPanel(table.name, table.text))
      // library
      if (id === 'docs') return openOverlay(ui.docsPanel(village.library.documents))
      if (id === 'quiz') return startQuiz(0, 0)
    }

    function openMemory() {
      if (quests.isDone('memory')) {
        return openOverlay(ui.objectPanel(village.home.memory.title, village.home.memory.text))
      }
      openOverlay(ui.memoryGate(village.home.memory.question), (panel) => {
        const input = panel.querySelector('.v-answer')
        const tryIt = () => {
          const guess = input.value.trim().toLowerCase()
          const ok = village.home.memory.answers.some(a => a.toLowerCase() === guess)
          if (ok) {
            closeOverlay()
            questToast('memory')
            openOverlay(ui.objectPanel(village.home.memory.title, village.home.memory.text))
          } else {
            panel.querySelector('.v-nudge2').hidden = false
            input.value = ''
            input.focus()
          }
        }
        panel.querySelector('[data-try-memory]').addEventListener('click', tryIt)
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryIt() })
        input.focus()
      })
    }

    function startQuiz(index, correct) {
      const qz = village.library.quiz
      if (index >= qz.length) {
        closeOverlay()
        if (correct === qz.length) { questToast('quiz'); openOverlay(ui.prizePanel()) }
        else toastNow(`the librarian smiles — ${correct}/${qz.length}. try again sometime`)
        return
      }
      openOverlay(ui.quizQuestion(qz, index), (panel) => {
        panel.querySelectorAll('[data-answer]').forEach(btn => {
          btn.addEventListener('click', () => {
            const right = Number(btn.dataset.answer) === qz[index].answer
            startQuiz(index + 1, correct + (right ? 1 : 0))
          })
        })
      })
    }

    function openLetter() {
      openOverlay(ui.letterPanel(profile.email), (panel) => {
        panel.querySelector('[data-send]').addEventListener('click', () => {
          const text = panel.querySelector('.v-letter').value.trim()
          window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent('A letter from the village')}&body=${encodeURIComponent(text || '(an empty but heartfelt letter)')}`
          questToast('letter')
          closeOverlay()
          toastNow('✉ the letter is on its way')
        })
      })
    }

    // ---------- arcade ----------
    function openArcade() {
      const best = Number(localStorage.getItem(BEST_KEY)) || 0
      openOverlay(ui.arcadeStart(best), (panel) => {
        panel.querySelector('[data-start]').addEventListener('click', () => runPuzzle())
      })
    }
    function runPuzzle() {
      const seed = (Math.floor(Math.random() * 90000) + 10000)
      const puzzle = createPuzzle(seed)
      let startedAt = 0
      let timerId = 0
      closeOverlay()
      openOverlay(ui.arcadeBoard(), (panel) => {
        const grid = panel.querySelector('.v-grid')
        const timerEl = panel.querySelector('[data-timer]')
        const movesEl = panel.querySelector('[data-moves]')
        const paint = () => {
          grid.innerHTML = puzzle.tiles().map(t =>
            `<button ${t === 0 ? 'class="hole" tabindex="-1"' : `data-tile="${t}"`}>${t || ''}</button>`).join('')
          grid.querySelectorAll('[data-tile]').forEach(b => {
            b.addEventListener('click', () => tryMove(Number(b.dataset.tile)))
          })
          movesEl.textContent = `${puzzle.moves()} moves`
        }
        timerId = setInterval(() => { if (startedAt) timerEl.textContent = ((performance.now() - startedAt) / 1000).toFixed(2) }, 50)
        const tryMove = (tile) => {
          if (!startedAt) startedAt = performance.now()
          if (!puzzle.move(tile)) return
          paint()
          if (puzzle.isSolved()) finish()
        }
        const keys = (e) => {
          const tiles = puzzle.tiles()
          const hole = tiles.indexOf(0)
          let idx = -1
          if (e.key === 'ArrowUp') idx = hole + 4
          if (e.key === 'ArrowDown') idx = hole - 4
          if (e.key === 'ArrowLeft') idx = hole + 1
          if (e.key === 'ArrowRight') idx = hole - 1
          if (idx >= 0 && idx < 16) { e.preventDefault(); tryMove(tiles[idx]) }
        }
        window.addEventListener('keydown', keys, true)
        overlayHost._arcadeStop = () => { clearInterval(timerId); window.removeEventListener('keydown', keys, true) }
        const finish = () => {
          overlayHost._arcadeStop?.(); overlayHost._arcadeStop = null
          const timeMs = Math.round(performance.now() - startedAt)
          const beat = timeMs < RECORD_MS
          const best = Number(localStorage.getItem(BEST_KEY)) || Infinity
          if (timeMs < best) localStorage.setItem(BEST_KEY, String(timeMs))
          const code = claimCode(timeMs, puzzle.moves(), seed, new Date().toISOString().slice(0, 10))
          if (beat) questToast('record')
          closeOverlay()
          openOverlay(ui.arcadeWin({ timeMs, moves: puzzle.moves(), code, beat, email: profile.email }), (p2) => {
            p2.querySelector('[data-again]')?.addEventListener('click', () => runPuzzle())
            p2.querySelector('[data-close-arcade]')?.addEventListener('click', closeOverlay)
          })
        }
        paint()
      })
    }

    // ---------- share card, quest log, pause ----------
    showShare = () => {
      const png = drawShareCard(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
      openOverlay(ui.shareCard(png), (panel) => {
        panel.querySelector('[data-close-share]').addEventListener('click', closeOverlay)
      })
    }
    function openQuestLog() {
      openOverlay(ui.questLog(QUEST_IDS, QUEST_LABELS, (id) => quests.isDone(id)))
    }
    const questChip = document.createElement('button')
    questChip.id = 'quest-chip'
    questChip.className = 'corner-btn'
    questChip.textContent = '□ quests'
    on(questChip, 'click', openQuestLog)
    document.body.appendChild(questChip)
    cleanup.push(() => questChip.remove())

    function openPause() {
      const crtOn = localStorage.getItem('davidworld:crt') === 'on'
      openOverlay(`
        <div class="v-panel"><h3>PAUSED</h3>
        <p class="v-actions">
          <button class="v-btn" data-resume>keep exploring</button>
          <button class="v-btn ghost" data-crt>${crtOn ? 'CRT scanlines: ON' : 'CRT scanlines: off'}</button>
          <button class="v-btn ghost" data-leave>put the handheld down</button>
        </p></div>`, (panel) => {
        panel.querySelector('[data-resume]').addEventListener('click', closeOverlay)
        panel.querySelector('[data-crt]').addEventListener('click', (e) => {
          const on2 = root.classList.toggle('crt')
          localStorage.setItem('davidworld:crt', on2 ? 'on' : 'off')
          e.target.textContent = on2 ? 'CRT scanlines: ON' : 'CRT scanlines: off'
        })
        panel.querySelector('[data-leave]').addEventListener('click', () => { unmount(); onExit?.() })
      })
    }

    // touch d-pad
    const dpad = document.createElement('div')
    dpad.className = 'v-dpad'
    dpad.innerHTML = `<span></span><button data-k="ArrowUp">▲</button><span></span>
      <button data-k="ArrowLeft">◀</button><span></span><button data-k="ArrowRight">▶</button>
      <span></span><button data-k="ArrowDown">▼</button><span></span>`
    document.body.appendChild(dpad)
    dpad.querySelectorAll('button').forEach(b => {
      on(b, 'pointerdown', () => held.add(b.dataset.k))
      on(b, 'pointerup', () => held.delete(b.dataset.k))
      on(b, 'pointerleave', () => held.delete(b.dataset.k))
    })
    const interactBtn = document.createElement('button')
    interactBtn.className = 'v-interact'
    interactBtn.textContent = 'E'
    document.body.appendChild(interactBtn)
    on(interactBtn, 'click', () => interactFacing())
    cleanup.push(() => { dpad.remove(); interactBtn.remove() })

    // ---------- loop ----------
    let raf = 0
    let last = performance.now()
    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      step(dt)
      catStep(dt, now / 1000)
      let label = null
      if (!overlayOpen) {
        if (hoverCat) label = { text: hoverCat.name.toUpperCase(), tx: Math.round(hoverCat.px / TILE), ty: Math.round(hoverCat.py / TILE) }
        else {
          const id = scene.zoneAt(player.tx + player.dir[0], player.ty + player.dir[1]) || hoverZone
          if (id) label = { id, text: LABELS[id] || id.toUpperCase() }
        }
      }
      const actors = sceneName === 'home'
        ? cats.map(c => ({ img: sprites.cats[c.kind][c.moving ? (Math.floor(now / 220) % 2) : 0], px: c.px, py: c.py }))
        : []
      renderer.draw(scene, player, Math.floor(now / 400) % 2 === 0, now / 1000, label, actors)
    }
    const onVis = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop) }
    }
    on(document, 'visibilitychange', onVis)
    raf = requestAnimationFrame(loop)
    cleanup.push(() => cancelAnimationFrame(raf))

    if (localStorage.getItem('davidworld:crt') === 'on') root.classList.add('crt')
    if (audio.soundOn()) audio.startProfile('village')

    // always-visible way home (the lock screen has its own)
    const exitBtn = document.createElement('button')
    exitBtn.id = 'village-exit'
    exitBtn.className = 'corner-btn'
    exitBtn.textContent = '⌫ back to the desk'
    on(exitBtn, 'click', () => { unmount(); onExit?.() })
    document.body.appendChild(exitBtn)
    cleanup.push(() => exitBtn.remove())

    return {
      player,
      scene: () => sceneName,
      go: (name, at) => goScene(name, at),
      cats
    }
  }

  const classicBtn = document.createElement('button')
  classicBtn.id = 'village-classic'
  classicBtn.className = 'corner-btn'
  classicBtn.textContent = '☰ classic site'
  on(classicBtn, 'click', () => { unmount(); onClassic?.() })
  document.body.appendChild(classicBtn)
  cleanup.push(() => classicBtn.remove())

  function unmount() {
    audio.stopAll()
    for (const fn of cleanup.splice(0)) fn()
    document.querySelectorAll('.v-toast, .v-dialogue, .v-lock').forEach(x => x.remove())
    root.remove()
  }

  return {
    unmount,
    get player() { return world?.player || null },
    get scene() { return world?.scene?.() || 'lock' },
    get cats() { return world?.cats || [] },
    go: (name, at) => world?.go(name, at)
  }
}
