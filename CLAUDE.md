# Asset Gen

Electron desktop app for managing and generating isometric game assets using AI image generation via MCP servers.

## Tech Stack

- **Frontend**: React 18, TypeScript, Zustand (state), CodeMirror (editor), Allotment (split panes)
- **Backend**: Electron (main process), electron-vite (build tooling)
- **Image Generation**: MCP (Model Context Protocol) client connecting to image generation servers
- **Postprocessing**: Python scripts (Pillow, NumPy, rembg) for background removal and cleanup
- **Build**: electron-vite, electron-builder

## Commands

- `npm run dev` — start in development mode
- `npm run build` — production build
- `npm run preview` — preview production build

## Architecture

### Electron Main Process (`src/main/`)
- `index.ts` — app entry, window creation, custom `asset://` protocol for serving generated images
- `mcp-client.ts` — MCP server connection, image generation, triggers postprocessing
- `prompt-builder.ts` — builds generation prompts from asset descriptors, resolves masks
- `ipc-handlers.ts` — IPC bridge between main and renderer
- `asset-scanner.ts` — scans `assets/` directory tree for asset descriptor files
- `file-watcher.ts` — watches filesystem for changes via chokidar
- `image-manager.ts` — manages generated image files and metadata

### Renderer (`src/renderer/`)
- `App.tsx` — main layout with three-pane UI (tree, editor, preview)
- `stores/` — Zustand stores for asset and generation state
- `components/tree/` — asset tree navigation
- `components/editor/` — markdown editor for asset descriptors with ancestor context
- `components/preview/` — image preview with magenta stripping, tilemap preview, lightbox

### Asset Descriptors (`assets/`)
Markdown files defining each asset's generation prompt and metadata:
- `assets/tiles/` — base tile descriptors (grass, stone, dirt path, water, flower meadow)
- `assets/tiles/connectable/` — connectable tile sets with variant descriptors (river system)
- `assets/props/` — prop/item descriptors (oak tree, boulder, fern cluster, etc.)

### Python Scripts (project root)
- `postprocess.py` — main postprocessing pipeline (mask-based bg removal for tiles, rembg for props, magenta cleanup)
- `make_mask.py` — generates the base isometric tile mask
- `generate_connectable_masks.py` — generates 15 connectable variant masks
- `generate_grid_mask.py` — generates spritesheet grid masks
- `slice_spritesheet.py` — slices generated spritesheets into individual tiles
- `generate_river_descriptors.py` — generates river variant descriptor files

## Key Concepts

- **Magenta key**: `#FF00FF` is the transparency color. All generated assets use magenta backgrounds which get stripped at display time (R > 150, G < 100, B > 150).
- **Tile mask system**: Masks define geometry constraints — magenta = background, green = content area, blue = feature region (connectable tiles).
- **Art direction**: Landstalker (Sega Genesis) inspired isometric style — painterly, hand-painted, gouache brushstrokes. See `art_direction.md` for full details.
- **Asset types by filename prefix**: `tile_` = base tiles, `item_` = props, `sheet_` = spritesheets — determines postprocessing pipeline.
- **Connectable tiles**: Tiles that connect to neighbors (e.g., rivers) with 15 directional variants and dedicated masks.
