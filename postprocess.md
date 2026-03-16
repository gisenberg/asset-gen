# Postprocessing & Background Removal Pipeline

## Overview

After an image is generated via an MCP server, the Electron main process calls `postprocess.py` with the image path. The script detects the asset type from the filename prefix and applies type-specific processing. All asset types use **magenta (#FF00FF)** as the transparency key color.

## Trigger Flow

```
UI → Generate Button → IPC → mcp-client.ts:generateWithMcp()
  → MCP server generates image → saves to generated_images/
  → mcp-client.ts:postprocessImage(imagePath)
  → execFile('python3', ['postprocess.py', imagePath])
```

The call lives in `src/main/mcp-client.ts` (lines ~177-189). It's a simple `execFile` of `postprocess.py` with the image path as the sole argument.

## Asset Type Detection

The script reads the filename prefix to determine the pipeline:

| Prefix    | Asset Type   | Pipeline                          |
|-----------|-------------|-----------------------------------|
| `tile_`   | Tile         | Mask-based background replacement |
| `item_`   | Prop/Item    | AI background removal (rembg)     |
| `sheet_`  | Spritesheet  | Near-magenta cleanup only         |

## Pipeline by Asset Type

### Tiles (`tile_*`)

1. Load generated image as RGB
2. Resolve the correct mask:
   - Connectable variants → `assets/tiles/connectable/masks/{variant}.png` (e.g., `straight_ew.png`, `corner_ne.png`)
   - Regular tiles → `assets/tiles/tile_mask.png`
3. Identify magenta pixels in the mask using strict thresholds: **R > 200, G < 50, B > 200**
4. Replace those same pixel positions in the generated image with exact magenta `(255, 0, 255)`
5. Run `cleanup_near_magenta()` on the result
6. Save back to original path

### Props (`item_*`)

1. Load image, convert to RGB
2. Call `rembg.remove()` → returns RGBA with transparent background
3. **Alpha erosion**: apply `ImageFilter.MinFilter(size=3)` to the alpha channel — this shrinks the alpha mask by ~3px, removing semi-transparent fringe pixels where the background bleeds into object edges
4. Composite onto a solid magenta `(255, 0, 255)` background using the eroded alpha as the mask
5. Convert to RGB
6. Run `cleanup_near_magenta()` on the result
7. Save

### Spritesheets (`sheet_*`)

1. Load image as RGB
2. Run `cleanup_near_magenta()` — no background removal, just fringe cleanup
3. Save

## Core Algorithm: `cleanup_near_magenta()`

Forces near-magenta pixels to exact magenta. This catches color contamination from AI model generation where background pixels aren't perfectly magenta.

```python
def cleanup_near_magenta(img_array):
    r, g, b = img_array[:, :, 0], img_array[:, :, 1], img_array[:, :, 2]
    near_magenta = (r > 150) & (g < 100) & (b > 150)
    img_array[near_magenta] = [255, 0, 255]  # MAGENTA
    return img_array
```

**Thresholds**: R > 150, G < 100, B > 150 (widened from R > 180, G < 80, B > 180 in commit `95d5978` to catch more subtle fringe).

## UI-Side Magenta Stripping

The renderer also strips magenta at display time for transparent previews. Two implementations exist with identical logic:

- **ImageCard.tsx** (`MagentaStrippedImage` component, lines ~23-49) — for image card previews
- **TilemapPreview.tsx** (`stripMagenta()` function, lines ~130-147) — for tilemap canvas rendering

Both iterate over pixel data and set `alpha = 0` where R > 150, G < 100, B > 150 — matching the Python thresholds.

## Mask System

Masks define the geometry constraints for tiles. They use a color scheme:
- **Magenta** = background (will be replaced)
- **Green** = ground/content area
- **Blue** = feature region (rivers, paths — connectable tiles only)

| Mask | Location |
|------|----------|
| Base tile mask | `assets/tiles/tile_mask.png` (1024x1024, isometric diamond 820x410) |
| Connectable masks | `assets/tiles/connectable/masks/*.png` (15 variants) |
| Grid masks (spritesheets) | `assets/spritesheets/grid_mask_*.png` |

Mask resolution happens in `src/main/prompt-builder.ts:resolveMask()` and is sent to the MCP server as a base64 data URL alongside the generation prompt.

## Key Files

| File | Role |
|------|------|
| `postprocess.py` | Core postprocessing script |
| `src/main/mcp-client.ts` | Triggers postprocessing after generation |
| `src/main/prompt-builder.ts` | Resolves which mask to use |
| `make_mask.py` | Generates the base tile mask |
| `generate_connectable_masks.py` | Generates connectable variant masks |
| `slice_spritesheet.py` | Slices spritesheets into individual tiles |
| `src/renderer/components/preview/ImageCard.tsx` | UI-side magenta stripping for previews |
| `src/renderer/components/preview/TilemapPreview.tsx` | UI-side magenta stripping for tilemap |

## Dependencies

- **rembg** — AI background removal library (used for props only)
- **Pillow (PIL)** — image manipulation (all asset types)
- **NumPy** — pixel-level array operations for fringe cleanup
