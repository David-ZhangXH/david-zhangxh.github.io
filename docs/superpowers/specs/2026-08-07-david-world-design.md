# David.world — Design Specification

**Date:** 2026-08-07
**Status:** Approved design, pending David's final read
**Owner:** David (davidzzz@bu.edu), biostatistician
**Goal:** A personal website built as an explorable space rather than a page — unique enough that no other site on the internet is structured like it, while remaining fast, accessible, and useful to any visitor.

---

## 1. Concept

The site is **The Desk Portal**: one cinematic 3D hub (David's desk at 23:47) with two worlds behind it, plus a plain-HTML twin for anyone in a hurry.

The architecture deliberately splits into two layers:

- **Public outer world** — the desk, the galaxy of works, CV, contact, quick links. Available to every visitor immediately.
- **Earned inner world** — the pixel village, locked behind a passcode (David's birthday, 07·16) that is discoverable in the public layer. Only visitors who take time to read about David get in. Professional outside, personal inside.

Audience: everyone (personal brand). The link should be shareable and memorable; recruiters and academics get a fast Classic Mode; curious people get a game.

## 2. World 1 — The Desk (hub)

A lamp-lit desk at night. Rain on the window, monitor glowing with stars. A 4-second skippable camera push-in opens the site. Mouse/touch moves the camera a few degrees (parallax); clicking a hotspot glides the camera to it. Subtle idle motion: steam, rain, screen flicker, drifting camera.

Seven hotspots:

1. **Monitor → The Galaxy.** Screen shows a live starfield preview; clicking dives the camera through the glass into World 2.
2. **Handheld console → The Village.** Picking it up shows the passcode lock screen (see §4). On success it boots with an 8-bit jingle into World 3.
3. **Paper tray → CV & contact.** View/download CV (PDF). A letter in the tray opens contact: email copy button + links.
4. **Photo frame → About me.** Warm personal card: who David is, where he's from, what he cares about. Includes personal details with the birthday displayed as **July 16** (month + day only — no year published). This is the passcode's hiding place.
5. **Coffee mug → heart steam.** Clicking the mug makes the steam curl into a heart — "for everyone who came to visit."
6. **Sticky notes → quick links.** GitHub, Google Scholar, LinkedIn, email. One note reads "p = 0.049" (easter egg, no function).
7. **Music box → work playlist + sound toggle.** Winding the crank opens David's favorite work-music list (titles, artists, links) and toggles the site ambience (rain + lo-fi). Ambience is **off by default**.

## 3. World 2 — The Galaxy (through the monitor)

"A young universe, still forming." Contains **works only** — no skill or tool lists.

Bodies, driven by `works.json` (statuses: `published | review | ongoing | paused`):

- **1 igniting star** — the LLM knowledge-graph paper, revised & resubmitted (status `review`): lit, but still glowing through dust. When accepted, the dust clears and it becomes a full star (one-line JSON edit).
- **1 comet** — the STAI-X 2026 poster ("touring the conferences"). Card: title, venue, PDF/image.
- **1 protostar** — the Alcohol–CpG aging-clock paper (status `ongoing`), flickering, "igniting soon."
- **1 nebula** — the Graph-RAG + LLM biomedical Q&A agent (status `ongoing`), slowly swirling gas.
- **2 dormant nebulae** — SVG detection and GNPC hypergraph (status `paused`): dimmed, drifting slower, not gone. Cards say so honestly — paused for time, not for interest.
- **The Secret Nebula** — an unlabeled, barely-visible dark cloud at the edge of the sky. Never announced anywhere. Clicking it opens David's **idea archive** (`ideas.json`): topics — academic or otherwise — each expanding into a short idea card. Discovery is purely by curiosity.
- **Future constellation** — faint dotted outlines hinting at room to grow; an epoch marker reads "universe est. 2026."
- Ambient: a shooting star roughly every 90 seconds.

Navigation: drag to orbit, scroll/pinch to glide, tap a body to approach. The sky is intentionally small — everything reachable within two moves. Exit: pull back → camera returns through the monitor glass to the desk.

## 4. World 3 — The Village (through the handheld)

### 4.1 The lock

The handheld asks for a 4-digit passcode before booting. Rules:

- Passcode: **0716**.
- Lock screen shows the hint: *"the day it all began."*
- After 3 wrong attempts, a gentler nudge appears: *"maybe the photo frame remembers."*
- A correct entry is remembered for the session (and persisted via localStorage) so returning visitors aren't re-locked.

### 4.2 The town

Pixel-art RPG (crisp pixels, optional CRT scanline toggle). The visitor plays tiny pixel-David. WASD/arrow keys; on-screen d-pad on phones; E/tap to interact; dialogue boxes for NPCs. Four buildings + outdoor objects:

- **School** — David's school life: stories, photos, memories told through classroom objects and NPCs rather than lists. Content grows as David supplies material; v1 can open with a handful of stories.
- **Home** — hobbies, photos as wall art, fun facts told by objects. The personal side, discovered not listed.
- **Lab** — **all working projects** (the not-yet-papers), each as a machine mid-experiment with a short card. Plus the arcade corner:
  - A faithful classic **15-Puzzle** (4×4 grid, 15 numbered tiles, slide to order), with timer and move counter.
  - The cabinet exterior is **unmarked** — no record displayed on the surface. The record is revealed only on the game's start screen: *"record to beat — 26.00 s, set in middle school."*
  - Scrambles are seeded (reproducible) and always solvable.
  - **Beating the record** (time strictly under 26.00 s): the machine prints a claim ticket containing the time, move count, date, and a short claim code — a deterministic hash of (time, moves, scramble seed, date), so David can verify any claim with a one-line script. The visitor emails the ticket to David; David replies with a **hand-written letter** as the prize. (Honor-system friendly; the code deters casual cheating.)
  - The hidden **coffee machine** easter egg lives in the Lab.
- **Library** — the paper and poster on shelves, plus a wing for **everything David writes**: essays, posts, notes (`writings/` markdown, auto-shelved). The librarian NPC offers a friendly 3-question quiz about the paper (reward: achievement).
- **Mailbox** (outdoors) — the leave-a-message spot. Visitors write a letter on pixel stationery; sending opens a pre-filled email to David. Private (no public wall, nothing to moderate).

### 4.3 Quests & achievements

Quest log ("Welcome home"): crack the passcode · beat David's record in the Lab (the number itself stays hidden until you press start) · read something in the Library · leave a letter in the mailbox · find the coffee machine. Completing the log unlocks a shareable "I made it into David's world" card. Progress persists via localStorage.

Exit: pause menu → "put the handheld down" → back to the desk.

## 5. Classic Mode (the side door)

- A quiet "☰ classic site" button floats permanently in a corner of every world.
- One plain, elegant page: name, bio, publications, projects, CV download, contact, links. Loads < 1 s.
- **Auto-offered or defaulted** when: WebGL unavailable, `prefers-reduced-motion`, screen-reader navigation, or the desk chunk hasn't finished loading within 5 seconds (slow connection).
- The classic page is real HTML baked into `index.html` — the SEO/noscript skeleton that the 3D mounts on top of. David's name and works stay indexable; canvas-only invisibility is explicitly avoided.
- Classic Mode contains the public layer only (it does not reproduce the village's personal content; the village remains earned).

## 6. Content model

All content is data; updating the site never requires touching world code.

| File | Feeds | Notes |
|---|---|---|
| `content/profile.json` | photo frame, classic mode, lock | bio, links, display name, birthday (07/16) |
| `content/works.json` | galaxy, library shelves, classic mode | items with `type` (paper/poster/project) + `status` (published/review/ongoing/paused) |
| `content/ideas.json` | secret nebula | topics → idea cards |
| `content/playlist.json` | music box | title, artist, link |
| `content/writings/*.md` | library writing wing | front-matter: title, date, kind |
| `content/school.json`, `content/home.json` | village buildings | object-keyed stories/facts |
| `public/cv.pdf`, poster/paper PDFs | tray, galaxy, library | filenames referenced from JSON |

Adding a paper → add one entry to `works.json` → a star ignites.

## 7. Technical design

- **Stack:** vanilla JavaScript + three.js (desk, galaxy); hand-rolled canvas-2D tile engine (village); Vite build; no framework, no backend, no database.
- **Hosting:** GitHub Pages, deployed by GitHub Actions on push. Custom domain attachable later without rework.
- **Code layout:** `src/desk/`, `src/galaxy/`, `src/village/`, `src/classic/`, `src/core/` (loader, input, audio, save, transitions). Worlds are lazy-loaded chunks behind their portals; each world exposes `mount / unmount / pause`.
- **Performance budget:** initial load < 2 MB (desk chunk included); 60 fps desktop / 30 fps phone targets; `devicePixelRatio` capped at 2; rendering pauses when the tab is hidden or a world is unmounted.
- **Audio:** all off by default; music box is the master toggle; village adds its own chiptune layer, also opt-in.
- **Persistence:** localStorage for passcode acceptance, quest/achievement progress, puzzle best time, sound preference.
- **Sharing:** OpenGraph/Twitter card — a render of the desk at night; title "David Z. — a website you can walk into." (Display name pending David's confirmation.)
- **3D art approach:** stylized low-poly built from primitives + baked gradients (no external modeling pipeline); pixel art authored as sprite sheets.

## 8. Build stages (each independently shippable)

1. **Foundation** — repo, Vite, Actions→Pages pipeline, Classic Mode page with David's real content. *The site is already useful.*
2. **The Desk** — 3D hub, 7 hotspots, intro camera, CV/about/contact/playlist cards, heart steam. *The site is already impressive.*
3. **The Galaxy** — monitor dive transition, young universe, works.json-driven bodies, secret nebula.
4. **The Village** — passcode lock, town, 4 buildings, NPCs/dialogue, 15-puzzle + claim ticket, mailbox, quests/achievements.
5. **Polish** — ambience audio, remaining easter eggs, share cards, final accessibility + performance pass.

Content that isn't ready at a stage ships with clearly-marked placeholder copy and is swapped by editing content files only.

## 9. Verification (every stage)

- Playwright screenshot suite: desktop + phone viewports, every world and every card/overlay.
- Lighthouse: accessibility and performance passes on Classic Mode and hub.
- Explicit fallback tests: WebGL disabled, `prefers-reduced-motion`, JS disabled (classic skeleton must render).
- `works.json`/`profile.json` schema validation in CI.
- Link + PDF integrity check.
- Village: puzzle solvability test (seeded scrambles), lock behavior test (3-miss nudge, session persistence).

## 10. Decisions log

| Decision | Choice | Why |
|---|---|---|
| Hub concept | Desk Portal over Galaxy-hub / Village-hub | equal billing for all three picked worlds; strongest narrative ("everything starts here"); best staged-shipping curve |
| Galaxy contents | works only; no tools/methods | David: tool lists felt weird; skills are evident from the site itself |
| Steam easter egg | heart (not bell curve) | David: "I love everyone who came" |
| Village gate | passcode 0716, hinted, findable in photo frame | David: reward people who really want to know him; mercy hint after 3 misses keeps it kind |
| Birthday exposure | 07/16 only, never the year | passcode works without publishing a full DOB |
| Record threshold | strictly < 26.00 s; prize = hand-written letter; claim via emailed ticket | David's middle-school record; no backend needed; claim code deters casual cheating |
| Record display | never on the cabinet surface; revealed only on the game's start screen | David: a number floating on the machine felt weird — the record is a discovery, not a billboard |
| Mailbox placement | in the village (earned layer), quest-linked | leaving a letter is personal; email delivery avoids moderation |
| Music box | playlist + master sound toggle in one object | one charming object, two jobs; keeps sound opt-in |
| Secret nebula | unlabeled, click-to-discover, never announced | David: a hidden idea archive for the truly curious |
| Display name | "Xiaohang (David) Zhang" (from CV) | real name forward, familiar name kept |
| Status vocabulary | published / review / ongoing / paused, mapped to star / igniting star / protostar-nebula / dormant nebula | careers aren't binary; under-review and paused work deserve honest celestial forms (classic page: "under review" tag, "On hold" group) |
| Art direction | the concept boards ARE the target look: their palette, soft illustration lighting, glow halos, monospace labels, cinematic color grade — carried into real-time 3D (hemisphere fill + accent lights, glow sprites, CSS grade overlay) | David: the board style is the site's soul; 3D must feel like the boards in motion, not like a tech demo |
| Audio | generated in WebAudio (rain noise, original music-box loop, drones, chiptune arp) — zero audio files, off by default, music box is the master switch | no assets to license or load; the melody is composed in code so it can't infringe |
| Village content file | single `content/village.json` (school/home/npcs/quiz) instead of separate school.json + home.json | one file for David to edit |
| Home legibility | every object redrawn around one signature detail (notes above the music box, antenna on the TV, RGB keys, keyhole on the plaque, open pages, polaroids, reels on the VHS) + floating name label when faced or hovered + pointer cursor | David: "it is so unclear about which is which" — the sprite carries the identity, the label removes all doubt |
| Jersey wall | 4 shirts as data (`home.jerseys.items`): Man Utd #8 Bruno Fernandes, Argentina #10 Messi, OKC #13 Paul George, OKC #0 Russell Westbrook — numbered mini-jerseys on a rail in-room, tee-shaped cards in the panel | David listed exactly these four; data-driven so he can swap shirts by editing JSON |
| Leaving the village | persistent "⌫ back to the desk" corner button (bottom-right) inside the world; lock screen keeps its own | David: there was no visible way back to the desk — Escape-menu-only was hidden knowledge |

## 11. Non-goals

No backend, accounts, comments, analytics, CMS, or blog engine. No public message wall. No VR/AR. No i18n in v1. The village's personal content is intentionally excluded from Classic Mode and search indexing.

## 12. Materials David will provide (before/during build)

~~CV (PDF)~~ received 2026-08-07 · ~~display name~~ Xiaohang (David) Zhang · ~~project blurbs~~ drafted from CV (David may polish) · bio rewrite in David's own words · paper DOI/preprint link + poster PDF · GitHub/Scholar/LinkedIn links · optional photo · school-life stories & photos · home/hobby facts · work playlist · idea list for the secret nebula · any existing writings.

Until materials arrive, realistic placeholders keep every stage buildable.
