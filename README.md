# StagePlot

**Build stage plots and technical riders for live music — right in the browser.**

StagePlot lets musicians, sound techs and producers lay out a stage, build a
mixing-desk input list, and export a clean PDF rider. Built from scratch with a
fast, keyboard-friendly editor.

> **Live demo:** [rayfoolshs.github.io/stageplot](https://rayfoolshs.github.io/stageplot/)
> — static build: editor, local drafts and browser-print PDF. Accounts, cloud
> save and sharing need the API (see [Deploying](#deploying-the-static-demo-github-pages)).

> **Note:** This is an independent implementation. It is not affiliated with,
> endorsed by, or derived from Ridermaker. All artwork, code and copy here are
> original.

---

## Features

**Stage editor**
- Drag-and-drop canvas with **46 items** across 12 categories (drums, amps, keys,
  guitars, strings, winds, mics, audio, people, stage, lighting, video)
- Move, resize, rotate, flip and layer items; magnetic grid; zoom and pan
- Optional **captions** under each item (toggle all from the toolbar)
- **Drawing tools** — rectangle, circle/ellipse, and polygon with draggable
  vertex editing; filled or outline
- Multi-select (Shift-click and **marquee drag**), duplicate, delete, undo/redo,
  arrow-key nudging
- **Magnetic grid** — items snap to 25-unit cells while the grid is on (Alt = free)
- **Resizable panels** — drag the dividers (double-click resets) to give the
  stage more room; sizes are remembered

**Mixing-desk input list**
- Editable table pinned below the stage with columns:
  **Channel · Instrument · Person · Input type · Microphone · Monitor FB ·
  DCA/Subgroup · Notes**
- Input type is a dropdown (Mic / DI / Line / Wireless); auto-numbered rows
- **Monitor FB** is a dropdown fed by the monitors on the plot
- Dropping a stage monitor auto-names it **Monitor 1, 2, …**, adds its row to
  **Monitors / outputs**, and keeps the two in sync (renames follow everywhere)

**Outputs & document**
- Output list for monitors / in-ears
- **PDF export** — one-click download via a headless-Chrome render of the same
  `/print` layout (portrait or landscape); falls back to the browser's print
  dialog if the API isn't running

**Accounts**
- Register / sign in / sign out with an httpOnly session cookie
- Argon2id password hashing, per-IP rate limits, CSRF origin checks
- Dev sessions live in memory, so restarting the API signs you out

**Cloud save**
- **My riders** (`/riders`): open, rename, duplicate, delete, with live thumbnails
- Autosave to your account with a `Saving… / Saved / Save failed` indicator
- Start locally, then **Save to cloud** to bind the draft to a new rider (`/r/:id`)

**Sharing & favorites**
- **Share** a rider as a public read-only link (`/s/:token`) with revoke; the
  link can print or download the PDF without an account
- Star library items and filter with **★ Favorites** (per account)
- Document name, orientation (portrait/landscape) and footer notes
- **Light & dark theme** — light by default, then remembers your choice
- Autosave to `localStorage`

---

## Tech stack

| Layer | Choice |
|---|---|
| Front end | React 19 + TypeScript + Vite |
| State | Zustand (+ immer) |
| Styling | Tailwind CSS v4 |
| Backend (scaffold) | Fastify + Prisma |
| Database | SQLite (dev) → PostgreSQL later |
| Monorepo | npm workspaces |

---

## Repository layout

```
apps/web/           React editor (Vite)
  src/editor/       store, item library, canvas + panels
apps/api/           Fastify API + Prisma schema (accounts/cloud save, upcoming)
packages/shared/    StageDoc types + zod schemas (the shared contract)
BUILD_PLAN.md       Plan of record and roadmap
```

---

## Getting started

Requires **Node 20+**.

```powershell
npm install

# API: create the local SQLite database (once)
copy apps\api\.env.example apps\api\.env
npm.cmd run db:push

npm.cmd run dev:web   # editor  -> http://localhost:5173
npm.cmd run dev:api   # API     -> http://127.0.0.1:3001  (accounts, PDF export)
```

Other scripts:

```powershell
npm.cmd run build       # typecheck + production build (all workspaces)
npm.cmd run typecheck   # tsc --noEmit across workspaces
npm.cmd run test:e2e    # Playwright happy path (starts dev servers as needed)
```

The e2e suite uses the locally installed Google Chrome (`channel: "chrome"`).
In CI, run `npx playwright install chromium` and remove the channel.

### PDF export
`Export PDF` posts the document to the API, which prints the web app's `/print`
route in headless Chrome and returns a PDF. It needs:

- the API running (`npm run dev:api`), and
- a local Chrome/Chromium. Set `CHROME_PATH` if it isn't in a standard location,
  and `PRINT_URL` if the web app isn't on `http://localhost:5173`.

Without the API, the button opens `/print` instead, where the browser's own
print dialog can save the same layout as a PDF.

### Deploying the static demo (GitHub Pages)
`npm run build:pages` builds `apps/web` for `https://<user>.github.io/stageplot/`
(base `/stageplot/`, with a `404.html` fallback for deep links). The Pages app is
**client-only**: the editor, local drafts and browser-print PDF work; accounts,
cloud save, sharing and the server-side PDF renderer need the API, so the
account UI is hidden in that build.

`.github/workflows/deploy-pages.yml` publishes on every push to `main`. In the
repository, set **Settings → Pages → Source: GitHub Actions** once.

### Windows notes
- If PowerShell blocks npm scripts (`npm.ps1` disabled), use `npm.cmd`.
- If npm's **allow-scripts** policy blocks install scripts, approve and rebuild:
  ```powershell
  npm.cmd approve-scripts esbuild @prisma/client prisma @prisma/engines
  npm.cmd rebuild
  ```

---

## Data model

A rider is a single, versioned JSON document — `StageDoc` — holding `stage`,
`items`, `texts`, `shapes`, `channels` (inputs), `outputs`, `footer` and `meta`.
The editor, the (planned) print view, and the PDF exporter all render from this
one source of truth, so what you see is what prints.

---

## Roadmap

- [x] **M0** Foundations — monorepo, shared contract, SQLite/Prisma
- [x] **M1** Editor core — library, canvas, undo/redo, channel lists, labels,
  shapes, theming
- [x] **M2** PDF export — print route + headless-Chromium render endpoint
- [x] **M3** Accounts — register / login / sessions
- [x] **M4** Cloud save — rider CRUD, autosave, thumbnails, "My riders" (image uploads deferred)
- [x] **M5** Sharing — public read-only links + favorites
- [x] **M6** Polish — marquee select, snapping, toasts, e2e tests

See [BUILD_PLAN.md](./BUILD_PLAN.md) for the full plan.

---

## Development caveat

Editing the store module while the Vite dev server is running can leave the
global keyboard listener bound to a stale store instance. Hard-refresh
(`Ctrl+Shift+R`) after pulling changes.

---

## License

Not yet chosen.
