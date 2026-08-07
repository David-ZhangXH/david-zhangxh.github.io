// The village: lock → town. Canvas world + DOM interactions.
import { TILE, SPAWN, isWalkable, zoneAt } from './map.js'
import { makeSprites } from './sprites.js'
import { createRenderer } from './render.js'
import { createPuzzle, claimCode } from './puzzle.js'
import { createLock } from './lock.js'
import { createQuests, QUEST_IDS, QUEST_LABELS } from './quests.js'
import * as ui from './panels.js'
import { drawShareCard } from './share.js'
import { parseFrontMatter } from '../core/frontmatter.js'
import * as audio from '../core/audio.js'
import '../core/overlay.css'
import './village.css'
import village from '../../content/village.json'
import works from '../../content/works.json'
import profile from '../../content/profile.json'

const UNLOCK_KEY = 'davidworld:unlocked'
const BEST_KEY = 'davidworld:puzzle-best'
const RECORD_MS = 26000

const writingFiles = import.meta.glob('../../content/writings/*.md', { eager: true, query: '?raw', import: 'default' })
const writings = Object.entries(writingFiles).map(([path, raw]) => {
  const { attrs } = parseFrontMatter(raw)
  return { title: attrs.title || path.split('/').pop(), date: attrs.date || '' }
})

export function mountVillage({ onExit, onClassic } = {}) {
  const cleanup = []
  const on = (el, ev, fn) => { el.addEventListener(ev, fn); cleanup.push(() => el.removeEventListener(ev, fn)) }
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
  let showShare = null // assigned once the town (and its overlay system) exists
  const questToast = (id) => {
    if (!quests.complete(id)) return
    toastNow(`QUEST COMPLETE — ${QUEST_LABELS[id]}`)
    if (quests.allDone()) setTimeout(() => showShare?.(), 1500)
  }

  // ---------- THE LOCK ----------
  let town = null
  if (localStorage.getItem(UNLOCK_KEY) === 'yes') {
    town = startTown()
  } else {
    const lock = createLock({
      code: '0716',
      onUnlock() {
        localStorage.setItem(UNLOCK_KEY, 'yes')
        lockEl.remove()
        town = startTown()
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

  // ---------- THE TOWN ----------
  function startTown() {
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'width:100%;height:100%'
    root.appendChild(canvas)
    const sprites = makeSprites()
    const renderer = createRenderer(canvas, sprites)
    on(window, 'resize', renderer.resize)

    const player = {
      tx: SPAWN.x, ty: SPAWN.y,
      px: SPAWN.x * TILE, py: SPAWN.y * TILE,
      dir: [0, 1], moving: false
    }
    const held = new Set()
    const KEYMAP = {
      ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
      w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0]
    }

    let overlayOpen = false
    on(window, 'keydown', (e) => {
      if (overlayOpen) return
      if (KEYMAP[e.key]) { held.add(e.key); e.preventDefault() }
      if (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === ' ') interact()
      if (e.key === 'q' || e.key === 'Q') openQuestLog()
      if (e.key === 'Escape') openPause()
    })
    on(window, 'keyup', (e) => held.delete(e.key))

    // touch controls
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
    on(interactBtn, 'click', () => interact())
    cleanup.push(() => { dpad.remove(); interactBtn.remove() })

    // movement: tile-to-tile with smooth pixels
    const SPEED = 90 // px/s
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
      for (const k of held) {
        const d = KEYMAP[k]
        if (!d) continue
        player.dir = d
        const nx = player.tx + d[0], ny = player.ty + d[1]
        if (isWalkable(nx, ny)) { player.tx = nx; player.ty = ny }
        break
      }
    }

    // ---------- interactions ----------
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
      window.addEventListener('keydown', esc, true)
      overlayHost._esc = esc
      wire?.(panel)
      close.focus()
    }
    function closeOverlay() {
      window.removeEventListener('keydown', overlayHost._esc, true)
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
      const dismiss = () => box.remove()
      box.addEventListener('click', dismiss)
      setTimeout(() => box.isConnected && dismiss(), 6000)
    }

    function interact() {
      if (overlayOpen) return
      const fx = player.tx + player.dir[0], fy = player.ty + player.dir[1]
      const zone = zoneAt(fx, fy)
      if (!zone) return
      if (zone === 'school') openOverlay(ui.storiesPanel('SCHOOL DAYS', village.school, 'Chalk dust and beginnings.'))
      if (zone === 'home') openOverlay(ui.storiesPanel('HOME', village.home, 'The personal shelf.'))
      if (zone === 'lab') openOverlay(ui.labPanel(works.filter(w => w.status === 'ongoing' || w.status === 'paused')))
      if (zone === 'library') openLibrary()
      if (zone === 'mailbox') openLetter()
      if (zone === 'arcade') openArcade()
      if (zone === 'coffee') { questToast('coffee'); toastNow('☕ the hidden coffee machine gurgles approvingly') }
      if (zone === 'npc1') talk('villager', 'VILLAGER')
      if (zone === 'npc2') talk('librarian', 'LIBRARIAN')
    }

    function openLibrary() {
      const shelf = works.filter(w => w.status === 'published' || w.status === 'review')
      openOverlay(ui.libraryPanel(shelf, writings), (panel) => {
        panel.querySelector('[data-quiz]')?.addEventListener('click', () => startQuiz(0, 0))
      })
    }
    function startQuiz(index, correct) {
      if (index >= village.quiz.length) {
        closeOverlay()
        if (correct === village.quiz.length) { questToast('library'); toastNow('the librarian beams — perfect score') }
        else toastNow(`the librarian smiles — ${correct}/${village.quiz.length}. try again sometime`)
        return
      }
      openOverlay(ui.quizQuestion(village.quiz, index), (panel) => {
        panel.querySelectorAll('[data-answer]').forEach(btn => {
          btn.addEventListener('click', () => {
            const right = Number(btn.dataset.answer) === village.quiz[index].answer
            startQuiz(index + 1, correct + (right ? 1 : 0))
          })
        })
      })
    }

    function openLetter() {
      openOverlay(ui.letterPanel(profile.email), (panel) => {
        panel.querySelector('[data-send]').addEventListener('click', () => {
          const text = panel.querySelector('.v-letter').value.trim()
          const mail = `mailto:${profile.email}?subject=${encodeURIComponent('A letter from the village')}&body=${encodeURIComponent(text || '(an empty but heartfelt letter)')}`
          window.location.href = mail
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
        const tick = () => { if (startedAt) timerEl.textContent = ((performance.now() - startedAt) / 1000).toFixed(2) }
        timerId = setInterval(tick, 50)
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
          if (e.key === 'ArrowUp') idx = hole + 4      // tile below slides up
          if (e.key === 'ArrowDown') idx = hole - 4    // tile above slides down
          if (e.key === 'ArrowLeft') idx = hole + 1    // tile right slides left
          if (e.key === 'ArrowRight') idx = hole - 1   // tile left slides right
          if (idx >= 0 && idx < 16) { e.preventDefault(); tryMove(tiles[idx]) }
        }
        window.addEventListener('keydown', keys, true)
        const stop = () => { clearInterval(timerId); window.removeEventListener('keydown', keys, true) }
        overlayHost._arcadeStop = stop
        const finish = () => {
          stop()
          const timeMs = Math.round(performance.now() - startedAt)
          const beat = timeMs < RECORD_MS
          const best = Number(localStorage.getItem(BEST_KEY)) || Infinity
          if (timeMs < best) localStorage.setItem(BEST_KEY, String(timeMs))
          const code = claimCode(timeMs, puzzle.moves(), seed, new Date().toISOString().slice(0, 10))
          if (beat) questToast('record')
          closeOverlay()
          openOverlay(ui.arcadeWin({ timeMs, moves: puzzle.moves(), code, beat, email: profile.email }), (p2) => {
            p2.querySelector('[data-again]')?.addEventListener('click', () => { runPuzzle() })
            p2.querySelector('[data-close-arcade]')?.addEventListener('click', closeOverlay)
          })
        }
        paint()
      })
    }

    // ---------- share card ----------
    showShare = () => {
      const png = drawShareCard(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
      openOverlay(ui.shareCard(png), (panel) => {
        panel.querySelector('[data-close-share]').addEventListener('click', closeOverlay)
      })
    }

    // ---------- quest log + pause ----------
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
          const on = root.classList.toggle('crt')
          localStorage.setItem('davidworld:crt', on ? 'on' : 'off')
          e.target.textContent = on ? 'CRT scanlines: ON' : 'CRT scanlines: off'
        })
        panel.querySelector('[data-leave]').addEventListener('click', () => { unmount(); onExit?.() })
      })
    }

    // ---------- loop (pauses when the tab hides) ----------
    let raf = 0
    let last = performance.now()
    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      step(dt)
      renderer.draw(player, Math.floor(now / 400) % 2 === 0, now / 1000)
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

    return { player }
  }

  // classic escape hatch (spec: every world has one)
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
    get player() { return town?.player || null }
  }
}
