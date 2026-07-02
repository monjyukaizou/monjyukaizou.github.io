# CLAUDE.md

Guidance for Claude/AI assistants working in this repository.

## Repo overview

`monjyukaizou.github.io` is a GitHub Pages **user site** repo — the special
`<username>.github.io` naming means GitHub Pages auto-publishes whatever
static files sit at the root of the `main` branch at
`https://monjyukaizou.github.io`, with no Pages configuration or build step
required.

The live site is now a real, working page: **オトツクリ** ("Oto Tsukuri"),
a touch-friendly music composition toy aimed at elementary-school kids. It's
served from `index.html` at the repo root, per standard GitHub Pages
behavior.

## Current file inventory

```
index.html       live site markup (オトツクリ app)
css/style.css    all styles for the app
js/data.js       static data only — phrases, moods, styles, chord tones
js/audio.js      Web Audio playback engine — no DOM access
js/app.js        DOM wiring + state management, ties data + audio together
README.md        NOT project documentation — see below
CLAUDE.md        this file
```

There is no `.gitignore`, no image assets, and no other files or directories.

### `README.md` is orphaned game HTML, not documentation

`README.md`'s content is not prose — it's a leftover complete, self-contained
HTML document (`file README.md` reports it as HTML, not Markdown) for an
earlier, unrelated project: a small Japanese cup-and-jewel game,
"宝石はどこだ？" (Where's the jewel?), with three clickable cups (hotlinked
`<img>`s from `i.imgur.com`) hiding a jewel, inline `<style>`/`<script>`, and
no real win/lose logic (all three buttons behave identically).

This file predates `index.html` and is now **dead weight**: GitHub Pages
always prefers `index.html` when present, so `README.md`'s HTML is never
served as the site — it just renders (badly, as raw HTML/CSS/JS) as the repo's
README on GitHub's repo page. It has not been cleaned up yet.

If asked to "clean up," "fix the README," or "deploy"/"publish" (the site is
already live, so this would mean tidying up), the fix is: replace
`README.md`'s content with a normal short Markdown description of the actual
project (title + one-line description of the オトツクリ app). Don't do this
unprompted — flag it and confirm before touching the repo's only non-app file,
since the jewel game inside it might still be wanted for something.

## App architecture (`オトツクリ`)

The app lets a kid either (a) pick a preset phrase + mood + style and play
the resulting melody-with-chords, or (b) tap pentatonic pads to compose their
own short melody, then play it back. Piano keys light up in sync with
playback (melody notes vs. chord notes get different highlight colors).

The three JS files have a deliberate one-way separation of concerns — preserve
it when extending the app:

- **`js/data.js`** — pure data tables (`PHRASES`, `MOODS`, `STYLES`,
  `CHORD_TONES`, `PENTATONIC_PADS`). No functions, no DOM, no audio calls.
  Add new songs/moods/styles here.
- **`js/audio.js`** — an IIFE exposing `OtoAudio` (Web Audio oscillator
  scheduling: `initAudio`, `playMelody`, `playChordLoop`, `stopAll`, etc.).
  Never touches `document` or the DOM; only knows about pitches/timing/
  waveforms.
- **`js/app.js`** — an IIFE that owns UI state (`state.mode`, selected
  phrase/mood/style, composed notes, play/pause), wires up all click
  handlers, and calls into `OtoAudio` + reads from the `data.js` tables. This
  is the only file that touches the DOM.

Load order in `index.html` matters: `data.js` → `audio.js` → `app.js`
(later files depend on globals — `PHRASES`/`MOODS`/etc. and `OtoAudio` —
defined by earlier ones).

## Tooling & workflow reality check

There is no build step, no package manager, no CI/CD, no test suite, and no
lint/format config in this repo (no `package.json`, `Gemfile`, `Makefile`,
`_config.yml`, `.github/workflows/`, `.eslintrc*`, `.prettierrc*`, etc.).
Development is just editing static files directly; deployment is GitHub
Pages' zero-config publish from `main`. Don't introduce a framework, build
step, or package manager unless explicitly asked — this repo is intentionally
plain static HTML/CSS/JS.

To verify changes, open `index.html` directly in a browser (or serve the
repo root with a simple static server, e.g. `python3 -m http.server`) and
exercise the app manually — pick a phrase/mood/style and press play, or try
the "ジブンデツクル" (make your own) pads, and confirm the piano keys light up
and sound plays. There's no automated test suite to run. Web Audio requires a
user gesture to start, so playback won't work by simulating clicks without a
real (or trusted) browser interaction.

## Conventions

- **Commits**: history is short with plain, unprefixed, short titles
  ("Initial commit", "Update README.md", "Add elementary-school music
  composition app") — no Conventional Commits style. Follow that plain style
  for new commits.
- **Code style**: the app splits markup/styles/script into separate
  `index.html` / `css/style.css` / `js/*.js` files, each `js` file an IIFE
  where appropriate. Match the existing data/audio/app separation described
  above rather than reverting to single-file inline style.
- Japanese UI strings and comments are used throughout (`data.js`, `app.js`
  comments are in Japanese) — match this when adding to the existing app.
- **Future growth**: if the site grows beyond this one app, an `/img` or
  `/assets` folder is the natural next addition for shared media. This is a
  suggestion for when the site actually grows, not an existing structure.

## Working guidance for AI assistants

- Keep changes minimal and appropriate for a plain static site — no
  frameworks, bundlers, or dependency manifests unless explicitly requested.
- Since there's no build/test tooling, "verification" means actually opening
  `index.html` in a browser and exercising the app, not running a test
  command.
- Don't confuse `README.md` with project documentation — it currently holds
  unrelated, unused game HTML. Don't edit it as if it were prose docs, and
  don't assume replacing it is in scope unless asked (see above).
- When adding songs/moods/styles, prefer extending the tables in
  `js/data.js` over hardcoding values in `js/app.js`.
