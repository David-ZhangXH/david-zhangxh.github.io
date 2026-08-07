# Stage 5 — Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Launch-ready: ambience audio wound up by the music box (WebAudio-generated, zero assets, off by default), the CRT toggle, the all-quests share card, social preview image + meta, reduced-motion and background-tab sweeps, final e2e matrix, and the handoff bundle David pushes to GitHub.

**Plan 5 of 5.** Spec §2.7 (music box master toggle), §4.2 (CRT), §4.3 (share card), §7 (sharing/perf).

## Tasks

- [x] **1 · Audio core** — `src/core/audio.js`: WebAudio graphs generated in code (no files). Desk profile: filtered-noise rain + an original slow music-box pluck loop (triangle osc, decay envelopes, pentatonic — composed here, no copyrighted melody). Galaxy: two detuned low sine drones with slow LFO. Village: quiet square-wave arpeggio. Master state in `localStorage('davidworld:sound')`, default off; `toggle()/startProfile(name)/stop()`. Every world starts its profile on mount iff sound is on, stops on unmount.
- [x] **2 · Music box wiring** — `playlistCard(list, soundOn)` gains a "wind the box" button (`data-sound`); desk wires it to `audio.toggle` + spins the crank while playing. Cards tests stay green (param optional).
- [x] **3 · CRT toggle** — `.crt` scanline overlay on `#village-root`; button in the pause menu; persisted `davidworld:crt`.
- [x] **4 · Share card** — when the 5th quest completes: pixel overlay "YOU FOUND ALL OF IT" + canvas-rendered 600×400 PNG ("I made it into David's world" + date) with a real `download` link; builder in `panels.js`, drawing in `share.js`.
- [x] **5 · Motion + perf sweep** — galaxy honors `reducedMotion` (instant tweens, no autorotate); village rAF pauses when the tab hides; desk crank spin only while sound plays.
- [x] **6 · Social preview** — `public/og.png` (1200×630 from the desk render), `og:image`/`twitter:card` meta, README note to absolutize the URL after first deploy.
- [x] **7 · e2e-polish** — sound toggle sets state without errors; reduced-motion visitors stay classic and enter-world skips the intro; preset 4 quests → coffee completes → share card with `data:image/png` download; CRT class toggles; then the FULL matrix: unit + desk + galaxy + village + classic snap.
- [x] **8 · Handoff** — README final (sound/share/OG sections), spec decisions row (generated audio), merge `stage-5-polish`, `git archive` → `davidworld-site.zip` for David.

## Self-review
Spec sweep: every §2 hotspot live (music box now audible) ✓; §3 bodies + secret ✓; §4 lock/town/arcade/quests/share-card/CRT ✓; §5 classic paths ✓; §7 budgets hold (audio adds ~2KB, no assets) ✓; §9 verification stays green ✓. Open content placeholders (bio, playlist, ideas, school/home, quiz, links, poster PDF) remain David's one-file edits — listed in README.
