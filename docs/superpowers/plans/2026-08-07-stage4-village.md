# Stage 4 — The Village Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The earned inner world (spec §4): the handheld's passcode lock, a walkable pixel town (School · Home · Lab · Library · mailbox · hidden coffee machine), the 15-puzzle arcade with the claim-ticket ritual, NPCs, and a quest log — in the concept-board-03 pixel style.

**Architecture:** Third lazy chunk (`src/village/`), canvas-2D (no three.js). All game logic is pure and unit-tested: puzzle model (seeded solvable scrambles, deterministic claim codes), lock machine, quest registry, map collision/zones. Rendering draws programmatic pixel sprites to an integer-scaled canvas; buildings open DOM panels (accessible, testable); the puzzle is a DOM modal (keyboard-playable). One content file `content/village.json` (school/home/NPC lines/quiz) so David edits a single place — supersedes the spec's school.json+home.json split (recorded in decisions).

**Plan 4 of 5.** Spec §4 (+§2.2 handheld portal).

---

## File structure

```
src/village/puzzle.js     # 15-puzzle model: seeded scramble (always solvable), move, isSolved, claimCode
src/village/lock.js       # passcode machine: attempts, hint→nudge at 3, unlock persistence hook
src/village/quests.js     # quest registry + persistence (localStorage injected)
src/village/map.js        # tile grid, collision, interact zones (data + pure queries)
src/village/sprites.js    # programmatic pixel-art sprite sheet (offscreen canvases)
src/village/render.js     # camera-follow canvas renderer, integer scaling, crisp pixels
src/village/panels.js     # DOM builders: interiors, dialogue, letter, quiz, puzzle shell, ticket
src/village/index.js      # mountVillage({onExit}): lock → town; input incl. touch d-pad
src/village/village.css   # pixel UI: dialogue borders, d-pad, panels, scanline toggle
content/village.json      # school[], home[], npcs{}, quiz[] — placeholders until David's stories
tests/{puzzle,lock,quests,villageMap,villageContent}.test.js
scripts/e2e-village.mjs
```

## Tasks

### Task 1: village content + validator (TDD)
- [x] `validateVillage`: `{school:[{title,text}], home:[{title,text}], npcs:{id:[lines]}, quiz:[{q,options[4],answer}] }`; real placeholder `content/village.json` passes (≥2 school, ≥2 home, ≥2 npcs, exactly 3 quiz). Commit.

### Task 2: 15-puzzle model (TDD)
- [x] `createPuzzle(seed)`: 4×4 board; scramble = 160 seeded random valid moves from solved (guarantees solvability); `tiles()` flat array with 0-hole; `move(tile)` legal-only, counts moves; `isSolved()`; same seed → same board.
- [x] `claimCode(timeMs, moves, seed, dateISO)`: deterministic base36 hash; different inputs → different codes. Commit.

### Task 3: lock machine (TDD)
- [x] `createLock({code:'0716', onUnlock})`: `try(str)` → 'open' | 'wrong' | 'nudge' (3rd+ miss); `isOpen()`; wrong resets input not attempts. Commit.

### Task 4: quests (TDD)
- [x] `createQuests(storage)`: ids `passcode, record, library, letter, coffee`; `complete(id)` idempotent; `progress()` → {done, total}; `allDone()`; persists via injected storage (fake in tests). Commit.

### Task 5: map model (TDD)
- [x] 40×24 grid; `isWalkable(x,y)` (buildings/trees/water block); `zoneAt(x,y)` → door/object ids (`school, home, lab, library, mailbox, arcade, coffee, npc1, npc2`); spawn point walkable; every zone reachable (BFS test from spawn). Commit.

### Task 6: sprites + renderer (visual loop)
- [x] Programmatic sprite sheet in board-03 palette: grass/path/tree tiles, 4 building facades (School bell-tower red, Home warm cottage, Lab pale with sign, Library brown), mailbox, arcade cabinet (unmarked), coffee machine, player 2-frame walk × 4 dirs, 2 NPCs. Camera-follow renderer, ×3 integer scale, `image-rendering: pixelated`. Screenshot loop vs concept board 03. Commit.

### Task 7: town glue + panels
- [x] `mountVillage`: lock screen first (retro handheld frame; remembered unlock skips; quest 'passcode' on success). Player movement (arrows/WASD, hold-to-walk, collision), E/Enter/tap interact on zones. DOM panels: School/Home (stories from village.json), Lab (ongoing+paused projects as machines + arcade button + "the coffee machine gurgles" flavor), Library (works shelves + writings + librarian quiz → quest 'library'), mailbox letter (textarea → `mailto:` with body → quest 'letter'), coffee machine → quest 'coffee' + toast. NPC dialogue boxes (lines from content). Quest log toggle (Q / button). Pause (Esc) → "put the handheld down" → onExit. Touch d-pad on coarse pointers. Commit.

### Task 8: the arcade (DOM modal)
- [x] Start screen reveals the record — *"record to beat — 26.00 s, set in middle school"* — nothing on the cabinet exterior. Play: click/tap tile or arrow keys slide into hole; timer starts on first move; move counter. Win < 26.00 s → claim ticket (time, moves, date, `claimCode`) + mailto button; win ≥ 26 s → warm "the machine hums approvingly"; quest 'record' only under 26. Replayable with new seed. Commit.

### Task 9: portal + router
- [x] Desk handheld activation → zoom tween to handheld + veil → `onPortal('village')`; main routes village like galaxy (`skipIntro` desk return). Handheld teaser card retired. Commit.

### Task 10: e2e (`scripts/e2e-village.mjs`)
- [x] Portal → lock visible; 3 wrong tries → nudge mentions the photo frame; `0716` → town canvas + quest toast; arrows move player (`window.__village` position hook); each zone opens its panel (School/Home/Lab/Library text from content); arcade start screen shows "26.00" only after start pressed (assert cabinet sprite has no text pre-open — DOM assert: no "26" in body before opening arcade); letter modal builds mailto href; coffee machine completes quest; reload → lock skipped (localStorage); exit → desk; no console errors; screenshots. Budget: village chunk < 120KB gzip. Commit + tick boxes.

### Task 11: finish
- [x] finishing-a-development-branch → merge `stage-4-village`.

## Self-review
Spec §4 coverage: lock (hint, 3-miss nudge, session+localStorage persistence) ✓; four buildings + mailbox + coffee machine ✓; puzzle rules (strictly <26.00s, seeded, ticket+code, record only on start screen — David's correction honored) ✓; quests incl. shareable finish card — deferred detail: the "I made it into David's world" share card ships in Stage 5 polish with the other share assets (recorded). Controls: keyboard + touch d-pad ✓. CRT toggle: Stage 5 polish. Consistency: quest ids fixed across Tasks 4/7/8/10; passcode string only in lock.js + village.json never rendered.
