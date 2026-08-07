# david.world

A personal website built as an explorable world. Stage 1 = Classic Mode
(this quiet page); later stages add the desk, the galaxy, and the village.
Design spec: `docs/superpowers/specs/2026-08-07-david-world-design.md`.

## Edit your content (no code needed)

- `content/profile.json` — name, tagline, bio, email, links.
  `birthday` is month-day only (`"07-16"`); the build refuses a year.
- `content/works.json` — every paper/poster/project. When the ongoing paper
  publishes, change its `status` to `"published"` and add `year`/`venue`/`link`.
- `content/writings/*.md` — one file per piece, front-matter `title/date/kind`.
- `public/cv.pdf` — replace with the real CV.

## Run locally

    npm install
    npm run dev        # dev server
    npm test           # test suite
    npm run build      # production build to dist/

## Sound, secrets, souvenirs

- **Sound** is off by default. Visitors wind the **music box** on the desk to
  start the rain + melody (each world plays its own quiet layer). All audio is
  generated in the browser — there are no audio files.
- The village **pause menu** (Esc) has a CRT-scanline toggle.
- Finishing **all five quests** in the village awards a downloadable pixel
  postcard ("I made it into David's world").
- After your first deploy, change the two `og.png` metas in `index.html` to the
  full URL (e.g. `https://<username>.github.io/og.png`) so link previews work
  everywhere.

## Deploy (one-time setup)

1. Create a GitHub repository (e.g. `<username>.github.io`, or any name).
2. Push this folder to its `main` branch.
3. Repo Settings → Pages → Source: **GitHub Actions**.
4. Done — every push to `main` tests, builds, and deploys.
   (Project repo instead of `<username>.github.io`? Set a repo variable
   `BASE_PATH=/<repo-name>/` in Settings → Actions → Variables.)
