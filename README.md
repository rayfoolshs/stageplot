# StagePlot

**Build stage plots and technical riders for live music — right in the browser.**

StagePlot lets musicians, sound techs and producers lay out a stage, build a
mixing-desk input list, and (soon) export a clean PDF rider. Built from scratch
with a fast, keyboard-friendly editor.

> **Note:** This is an independent implementation. It is not affiliated with,
> endorsed by, or derived from Ridermaker. All artwork, code and copy here are
> original.

---

## Features

**Stage editor**
- Drag-and-drop canvas with **43 items** across 11 categories (drums, amps, keys,
  guitars, strings, winds, mics, audio, people, stage, lighting)
- Move, resize, rotate, flip and layer items; magnetic grid; zoom and pan
- Optional **captions** under each item (toggle all from the toolbar)
- **Drawing tools** — rectangle, circle/ellipse, and polygon with draggable
  vertex editing; filled or outline
- Multi-select, duplicate, delete, undo/redo, arrow-key nudging

**Mixing-desk input list**
- Editable table pinned below the stage with columns:
  **Channel · Instrument · Person · Input type · Microphone · Monitor FB ·
  DCA/Subgroup · Notes**
- Input type is a dropdown (Mic / DI / Line / Wireless); auto-numbered rows

**Outputs & document**
- Output list for monitors / in-ears
- Document name, orientation (portrait/landscape) and footer notes
- **Light & dark theme** (persisted)
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

npm.cmd run dev:web   # editor  -> http://localhost:5173
npm.cmd run dev:api   # API     -> http://127.0.0.1:3001  (optional for now)
```

Other scripts:

```powershell
npm.cmd run build       # typecheck + production build (all workspaces)
npm.cmd run typecheck   # tsc --noEmit across workspaces
```

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
- [ ] **M2** PDF export — print route + headless-Chromium render endpoint
- [ ] **M3** Accounts — register / login / sessions
- [ ] **M4** Cloud save — rider CRUD, autosave, "My riders", image uploads
- [ ] **M5** Sharing — public read-only links
- [ ] **M6** Polish — marquee select, snapping, e2e tests

See [BUILD_PLAN.md](./BUILD_PLAN.md) for the full plan.

---

## Development caveat

Editing the store module while the Vite dev server is running can leave the
global keyboard listener bound to a stale store instance. Hard-refresh
(`Ctrl+Shift+R`) after pulling changes.

---

## License

Not yet chosen.
