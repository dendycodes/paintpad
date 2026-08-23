# 🎨 Paint Pad

Paint Pad is an infinite drawing canvas that runs entirely in the browser. Sketch
freehand, drop in shapes, text and images, then export a crisp PNG — no account,
no upload, nothing leaves your machine.

![tools](https://img.shields.io/badge/tools-12-6366f1) ![stack](https://img.shields.io/badge/Next.js%2013-Konva-black)

## Features

**Drawing tools**

| Tool | Key | What it does |
| --- | --- | --- |
| Select | `V` | Click or rubber-band a group of shapes: move, scale, rotate, nudge with the arrow keys, duplicate (`⌘/Ctrl+D`) or delete (`Del`) |
| Pan | `H` | Drag the canvas around — or just hold `Space` with any other tool |
| Pencil | `P` | Thin freehand strokes |
| Marker | `M` | Bold freehand strokes |
| Highlighter | `G` | Translucent strokes that stack like a real highlighter |
| Eraser | `E` | Rubs out anything on the canvas |
| Line / Arrow | `L` / `A` | Straight lines, `Shift` snaps to 15° |
| Rectangle / Ellipse | `R` / `O` | `Shift` constrains to a square/circle, `Alt` draws from the centre |
| Text | `T` | Click anywhere and type, with live font sizing |
| Eyedropper | `I` | Samples any colour already on the canvas |

**Everything around them**

- **Infinite canvas** — scroll to move, `⌘/Ctrl + wheel` or a two-finger pinch to zoom, `1` to fit the drawing, `0` to reset.
- **Undo / redo** — 200 steps deep, covering strokes, shapes, transforms, nudges and deletions.
- **Autosave** — the drawing (and your paper choice) is restored when you come back, and is flushed the moment you leave the tab.
- **Paper styles** — blank, grid, dots, ruled and slate; the paper pans and zooms with your work.
- **Colour picker** — curated palette, native picker, hex entry and recently used colours.
- **Per-tool settings** — stroke size, opacity and shape fill are remembered for each tool.
- **Images** — drag and drop, paste (`⌘/Ctrl+V`) or pick a file, then move it with the Select tool.
- **Export** — PNG or JPG at 1×/2×/3×, optional transparent background, cropped to your artwork. `⌘/Ctrl+C` copies it to the clipboard instead.
- **Touch and pen ready** — pointer events throughout, with a live brush-size cursor on desktop.
- Press `?` at any time for the full shortcut sheet.

## Getting started

```bash
git clone https://github.com/denizmemduev/PaintPad.git
cd PaintPad
npm install
npm run dev
```

Then open <http://localhost:3000>.

```bash
npm run build   # production build
npm run lint    # eslint
```

## How it works

```
src/app
├── core/blackboard-core.tsx   # stage lifecycle, viewport, shortcuts, actions
├── tools/                     # tool registry + one service per tool
│   ├── tools.ts               # id, icon, cursor, shortcut, capabilities
│   ├── attach-tool.ts         # binds the active tool to the stage
│   └── tools-services/        # free-drawing, shape, text, select, pan, eyedropper
├── services/                  # history, autosave, export, backgrounds, stage helpers
├── stores/                    # recoil atoms (active tool, options, viewport, history)
└── components/                # toolbar, options panel, top bar, zoom bar, overlays
```

Each tool is a function that receives a context (stage, layers, option getters, a
history API) and returns its own teardown, so adding a new tool means writing one
service plus one entry in the registry. Options are read through getters rather
than passed in, which is why changing a slider never re-binds the active tool or
drops your selection.

Three things keep it fast as a drawing fills up:

- **A scratch layer.** The stroke under the cursor lives on its own layer, so a
  pointer move repaints one line instead of the whole canvas — drawing costs the
  same on an empty page and on a busy one. (The eraser is the exception: it has
  to composite against the artwork to show what it removes.)
- **Delta history.** Every entry records only what changed — nodes added,
  removed, or their before/after transform — so a commit is a small
  serialisation and an undo is a direct edit rather than a canvas rebuild.
- **An imperative camera.** Panning writes `background-position` straight to the
  DOM and the brush cursor updates inside a rAF, so moving around the canvas
  triggers no React renders at all; the zoom level reaches React only when its
  rounded percentage changes.

Freehand input is also thinned with Ramer–Douglas–Peucker on commit, which keeps
redraws, history and autosave small without a visible change to the stroke.

## Technologies

- [Next.js 13](https://nextjs.org/) (app directory)
- [Konva.js](https://konvajs.org/) for the canvas
- [Recoil](https://recoiljs.org/) for UI state
- [Tailwind CSS](https://tailwindcss.com/) + Sass modules

## Contributing

Pull requests are welcome — bug fixes, new tools, and documentation improvements
alike.
