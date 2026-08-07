# Stage 3 — The Galaxy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The young universe behind the monitor (spec §3): every entry in `works.json` becomes a celestial body by status, the secret idea nebula drifts unlabeled at the edge, and the desk's monitor becomes a real portal — dive in, drift, read, pull back out.

**Architecture:** A second lazy world chunk (`src/galaxy/`). Shared plumbing gets extracted first: `core/engine.js` (renderer/loop/resize/pause — desk refactored onto it, e2e re-proves) and `core/overlay.css` (card styles both worlds import). Bodies are emissive sprites/particles (no lighting model needed); labels are canvas-texture sprites; interaction = OrbitControls (drag/zoom) + raycast + keyboard proxies, mirroring the desk's a11y pattern. `main.js` becomes a tiny world router: desk ⇄ galaxy via `onPortal`/`onExit` callbacks; returning to the desk never replays the intro (`skipIntro` option).

**Plan 3 of 5.** Spec §3; statuses `published|review|ongoing|paused` map to comet/igniting-star/protostar-or-nebula/dormant-nebula.

---

## File structure

```
src/core/engine.js          # createEngine(container,{bg,fog}) — loop/resize/pause/dispose (extracted from desk/scene)
src/core/overlay.css        # .card-backdrop/.card/.btn/corner-btn/tooltip (extracted from desk.css)
src/galaxy/state.js         # drift/focus machine over dynamic body ids (tested)
src/galaxy/cards.js         # workCard(work) by status + ideasCard(topics) (tested)
src/galaxy/bodies.js        # buildBodies(scene, works): registry {id:{hit,obj,label}} + secret + future + epoch
src/galaxy/effects.js       # starfield bg, glow sprite factory, comet trail, shooting star (~90s)
src/galaxy/index.js         # mountGalaxy({onExit}): controls, raycast, proxies, cards, back button
src/galaxy/galaxy.css       # world-specific bits only
content/ideas.json          # secret-nebula topics (placeholders until David's list)
tests/galaxyState.test.js, tests/galaxyCards.test.js, tests/ideas.test.js
scripts/e2e-galaxy.mjs      # portal round-trip + per-body cards + secrecy + screenshots
```

## Tasks

### Task 1: ideas content + validator (TDD)
- [x] `validateIdeas`: array of `{topic, ideas:[{title, note?}]}`; real `content/ideas.json` (2 placeholder topics) passes. Commit.

### Task 2: galaxy cards (TDD)
- [x] `workCard(w)`: title always; status lines — review → "revised & resubmitted · igniting", published poster → venue shown, ongoing → "in progress", paused → "dormant · paused for time, not interest"; link/pdf buttons only when present; hostile input escaped.
- [x] `ideasCard(topics)`: "you found the idea nebula" reveal line + `<details>` per topic listing ideas. No birthday anywhere. Commit.

### Task 3: galaxy state (TDD)
- [x] `createGalaxyState(ids)`: starts `drift`; `focus(id)` only for known ids; `close()` → drift; subscribe. (No intro mode — you arrive already inside.) Commit.

### Task 4: shared engine + overlay extraction (refactor, proven by re-run)
- [x] `core/engine.js` extracted from `desk/scene.js`; desk scene keeps its lights/camera only. Unit suite + desk e2e all green. Commit.
- [x] `core/overlay.css` extracted from `desk.css`; both worlds import it. Desk e2e still green. Commit.

### Task 5: bodies + effects (visual loop)
Layout (origin-centered disc, camera starts ~(0,1.2,6.5)): igniting star (-1.8,0.4,0) core+glow+dust shell, slow pulse; comet on r≈3.2 orbit, particle tail away from center; protostar (1.6,0.7,-0.8) orange flicker; ongoing nebula (2.4,-0.6,1.2) teal particle cloud + soft blobs, slow spin; dormant nebulae (-2.6,-0.8,-1.4) and (-0.6,-1.2,2.2), desaturated + dimmer + slower; secret nebula (6.5,-1.8,-3.5) near-invisible dark violet, oversized hit sphere, NO label; future constellation (0.5,2.2,-2.5) dashed lines + dim points + faint "future work" sprite; epoch sprite "universe est. 2026"; 1500-star background sphere; shooting star ~8s after mount then every 90±30s.
- [x] Labels: canvas-sprite per body (short title), 55% opacity, 100% on hover. Screenshot loop until it reads like concept board 02. Commit.

### Task 6: interactions
- [x] OrbitControls (no pan, distance 2.5–9, gentle autorotate that pauses on interaction); tap/click body → tween camera to body offset → card; Esc/×/backdrop → release to drift. Keyboard proxies for every body; the secret's proxy is labeled "…something drifts at the edge of the sky" (a11y without spoiling). "⌫ back to desk" corner button. Commit.

### Task 7: the portal (desk ⇄ galaxy)
- [x] `mountDesk` gains `{skipIntro, onPortal}`: monitor activation now runs a 1.1s dive tween into the screen + veil fade, then `onPortal('galaxy')` (teaser card retired). `main.js` routes: unmount desk → mount galaxy; galaxy `onExit` → mount desk with `skipIntro:true`. Handheld keeps its teaser. Commit.

### Task 8: e2e + budget (`scripts/e2e-galaxy.mjs`)
- [x] Checks: desk monitor press → galaxy canvas ≤6s; `window.__galaxy` registry = 6 works + secret; each work card mentions its title + correct status phrase; secret card says "idea nebula" and lists a topic; labels never contain "secret"; back to desk with no intro veil; no console errors; screenshots `galaxy-*.png` desktop+phone. Gzip budget: galaxy chunk < 200KB (three already loaded shared). All green → tick boxes, commit.

### Task 9: finish
- [x] finishing-a-development-branch → merge `stage-3-galaxy`, delete branch.

## Self-review
Spec §3 coverage: all four statuses mapped; small-sky two-move reach (autorotate + bounded zoom); reproject deferred — spec's "growth ritual" is data-driven bodies, which Task 5 implements from works.json; secret nebula unlabeled + discoverable + a11y-safe; shooting star cadence; epoch marker; exit = pull back through glass (veil + reverse). Consistency: body ids = works.json ids + 'secret' everywhere; statuses reuse validate.js vocabulary.
