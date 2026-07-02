# CLAUDE.md

Guidance for Claude/AI assistants working in this repository.

## Repo overview

`monjyukaizou.github.io` is a GitHub Pages **user site** repo — the special
`<username>.github.io` naming means GitHub Pages will auto-publish whatever
static files sit at the root of the `main` branch at
`https://monjyukaizou.github.io`, with no Pages configuration or build step
required.

Right now the repo is essentially an empty scaffold: it has never had a
working site. There are two branches, `main` and (as of this writing)
`claude/claude-md-docs-k56ybi`, and they contain the same single file.

## Current file inventory

The **only tracked file is `README.md`**, and its content is not prose
documentation — it's a complete, self-contained HTML document (`file
README.md` reports it as HTML, not Markdown). It contains a small Japanese
game, "宝石はどこだ？" (Where's the jewel?):

- Three cups rendered as hotlinked `<img>` tags from `i.imgur.com`, with a
  jewel image hidden under one of them.
- Inline `<style>` for layout/animation and inline `<script>` for game logic
  — everything in one file, no separate CSS/JS assets.
- Clicking any of the three buttons runs the same `startGame()`: it picks a
  random cup index, waits, reveals the jewel, "lifts" all three cups via a
  CSS `.lifted` class, then resets. All three buttons behave identically —
  there's no actual guess/win/lose logic tied to which button was clicked.

There is no `index.html`, no CSS/JS/image assets, no `.gitignore`, and no
other files or directories anywhere in the repo.

## Known issue / likely first task

**GitHub Pages does not serve `README.md` as the site.** For this game (or
any content) to actually appear at `https://monjyukaizou.github.io/`, its
HTML needs to live in `index.html` at the repo root. Currently `README.md`
holding the game means the site has nothing to serve, and GitHub just
displays the raw HTML as repo README content instead of rendering it as a
page.

If asked to "deploy," "publish," "fix," or "make the game live," the fix is:
move the HTML/CSS/JS out of `README.md` into a new `index.html`, and replace
`README.md` with a normal short Markdown description of the project (e.g.
title + one-line description of the game). Don't do this unprompted — flag
it and confirm before restructuring, since it changes the repo's only file.

## Tooling & workflow reality check

There is no build step, no package manager, no CI/CD, no test suite, and no
lint/format config in this repo (no `package.json`, `Gemfile`, `Makefile`,
`_config.yml`, `.github/workflows/`, `.eslintrc*`, `.prettierrc*`, etc.).
Development is just editing static files directly; deployment is GitHub
Pages' zero-config publish from `main`. Don't introduce a framework, build
step, or package manager unless explicitly asked — this repo is intentionally
plain static HTML/CSS/JS.

To verify changes, open the relevant HTML file directly in a browser (or
serve the repo root with a simple static server, e.g. `python3 -m http.server`)
and exercise the page/game manually. There's no automated test suite to run.

## Conventions

- **Commits**: history is short (2 commits) with plain, unprefixed, short
  titles ("Initial commit", "Update README.md") — no Conventional Commits
  style. Follow that plain style for new commits.
- **Code style**: the existing game keeps markup, styles, and script together
  in a single file rather than splitting into separate `.css`/`.js` assets.
  It's fine to preserve that for small additions.
- **Future growth**: if the site grows beyond a single page/game, the natural
  next structure is a standard static layout — `index.html` at root, plus
  `/css`, `/js`, and `/img` (or `/assets`) folders for shared resources. This
  is a suggestion for when the site actually grows, not an existing
  structure to assume.

## Working guidance for AI assistants

- Keep changes minimal and appropriate for a plain static site — no
  frameworks, bundlers, or dependency manifests unless explicitly requested.
- Since there's no build/test tooling, "verification" means actually opening
  the page in a browser and exercising it, not running a test command.
- Be aware `README.md` currently doubles as game source; don't assume it's
  ordinary project documentation when reading or editing it.
