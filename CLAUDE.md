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
behavior. The site has grown a second, independent app under `kakitori/`
(see below) — the root `index.html` and `kakitori/index.html` are two
separate single-page apps, cross-linked to each other, not one multi-page
app.

## Current file inventory

```
index.html          root site markup (オトツクリ music app)
css/style.css       styles for the オトツクリ app
js/data.js          static data only — phrases, moods, styles, chord tones
js/audio.js         Web Audio playback engine — no DOM access
js/app.js           DOM wiring + state management, ties data + audio together
kakitori/           second app: かきとりんぐ, a kana/kanji writing-practice
                    game — see its own section below
README.md           NOT project documentation — see below
CLAUDE.md           this file
```

There is no `.gitignore` and no other files or directories beyond the above.

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

## App architecture (`かきとりんぐ`, under `kakitori/`)

A hiragana/katakana/grade-1-kanji writing-practice game for kids, served at
`/kakitori/index.html` (its own self-contained static app: `kakitori/css/`,
`kakitori/js/`). It links back to the root オトツクリ app via a header icon,
and the root `index.html` links to it via a header nav-link — the two apps
don't otherwise share code.

**Content covered**: 71 hiragana (base gojūon + dakuten/handakuten), 71
katakana (same shape), and the 80 grade-1 kyōiku kanji. Contracted sounds
(きゃ etc.) and grades 2–6 kanji are not in yet — see "extending the content"
below.

**Stroke data pipeline (build-time, not part of the shipped app)**: stroke
shapes come from the [KanjiVG](http://kanjivg.tagaini.net) project (CC
BY-SA 3.0 — see `kakitori/CREDITS.md`). SVG stroke paths were fetched, resampled
to fixed-length point arrays, and each stroke's ending was classified as
とめ/はね/はらい (tome/hane/harai) — from KanjiVG's own `kvg:type`
annotations for kanji, or from stroke-endpoint geometry (a sharp direction
reversal = hane) for kana, which aren't annotated in KanjiVG. The result is
committed directly as plain JS data files (`kakitori/js/strokes-*.js`); there
is no build step in the shipped app, and regenerating this data requires
re-running an external fetch+parse script (not part of this repo) against
KanjiVG.

**Runtime files** (load order matters — later files depend on globals from
earlier ones):
```
js/strokes-hiragana.js    js/content-hiragana.js     progress.js
js/strokes-katakana.js  → js/content-katakana.js  →  canvas.js   → game.js
js/strokes-kanji-g1.js    js/content-kanji-g1.js      scoring.js
```
- **`strokes-*.js`** — per character: `{ strokeCount, viewBox: 109, strokes:
  [{ pts: [[x,y]...32], kind: "tome"|"hane"|"harai" }] }`. Pure data.
- **`content-*.js`** — per character: reading(s) + example word(s). Kana
  entries have one neutral `word`/`gloss`/`emoji`. Kanji entries have
  `on`/`kun`/`meaning` plus **two** themed example words, `wordBoy` and
  `wordGirl` (vehicles/sports vs. flowers/sweets/animals, per the boy/girl
  mode split below) — kana content is not theme-split, only kanji is.
- **`canvas.js`** (`KakitoriCanvas`) — canvas rendering (reference-stroke
  ghost/guide, animated demo playback) + pointer-event capture. No scoring
  logic, no game state.
- **`scoring.js`** (`KakitoriScoring`) — resamples a drawn stroke to match
  the reference's point count and scores shape/start/end proximity, with a
  hane-hook geometry check mirroring the build-time classifier. Pure
  functions, no DOM.
- **`progress.js`** (`KakitoriProgress`) — all `localStorage` state: daily
  streak, coins, per-character mastery level (drives weighted-random
  question selection so weak characters resurface more), daily 10-question
  quest, and the boy/girl theme choice.
- **`game.js`** — the only file that touches the DOM; wires up the menu,
  practice mode, test mode, and overlays, and is the sole place that reads
  `currentMode`/`currentChar`/`currentStrokeIdx` session state.

**Two modes, deliberately different prompts**:
- **なぞって れんしゅう (practice/trace)** — shows the full character ghosted
  plus an animated guide for the current stroke; the reading and themed word
  are shown too, since this mode is about learning correct stroke
  order/shape, not recall.
- **テストに ちょうせん (test/recall)** — shows *only* the reading + themed
  word (like a real 書き取りテスト dictation test); the character shape is
  never displayed, so the kid must recall and draw it from memory across
  however many strokes they think it takes. A ヒント (hint) button reveals
  the ghost on demand at a small score penalty.

**Extending the content**: grade 2+ kanji or きゃ/しゅ/ちょ-style contracted
sounds are the natural next additions — they need both a stroke-data entry
(from KanjiVG, same pipeline as above) and a content entry (readings +
boy/girl example words). Keep new sets as sibling `strokes-*.js`/
`content-*.js` files and register them in the `SETS` map in `game.js` rather
than overloading the existing three.

There's a subtle timing detail worth knowing if touching `game.js`: after a
practice character's last stroke, there's a deliberate ~800ms UI pause
(feedback badge, then a settle beat) before the next character loads, but the
canvas keeps accepting pointer input the whole time — `handlePracticeStroke`
guards on `currentStrokeIdx >= currentRef.length` to silently ignore stray
strokes drawn during that window instead of indexing past the end of
`currentRef`.

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

For `kakitori/`, verify the same way (open `kakitori/index.html`, or use the
same local server) and actually draw on the canvas — pick a character set +
mode, trace a few strokes, and confirm feedback/scoring/streak/coins update.
A real browser (Playwright with pointer events works fine) is required since
the drawing surface is a `<canvas>`; there's no way to meaningfully verify
this app by reading the code alone.

## Conventions

- **Commits**: history is short with plain, unprefixed, short titles
  ("Initial commit", "Update README.md", "Add elementary-school music
  composition app") — no Conventional Commits style. Follow that plain style
  for new commits.
- **Code style**: the app splits markup/styles/script into separate
  `index.html` / `css/style.css` / `js/*.js` files, each `js` file an IIFE
  where appropriate. Match the existing data/audio/app separation described
  above rather than reverting to single-file inline style.
- Japanese UI strings and comments are used throughout (`data.js`, `app.js`,
  and everything under `kakitori/` use Japanese comments/strings) — match
  this when adding to either app.
- **Multi-app growth**: the site grew from one app to two via a sibling
  top-level folder (`kakitori/`) with its own `css/`/`js/` and a cross-link
  in each app's header, rather than merging into one page. If a third app
  gets added, follow the same pattern (own folder, own assets, cross-linked
  header nav) instead of entangling it with an existing app's files.

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
- When adding characters/readings/words to `kakitori/`, prefer extending the
  `strokes-*.js`/`content-*.js` data files over hardcoding values in
  `game.js`, mirroring the `data.js` convention in the music app.
- `kakitori/js/strokes-*.js` are generated data (see the KanjiVG pipeline
  note above) — don't hand-edit stroke point arrays; regenerate them instead
  if the underlying source data needs to change.
