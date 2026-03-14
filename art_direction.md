# Art Direction: Forest Biome Isometric Tileset

## Reference
Inspired by **Landstalker: The Treasures of King Nole** (Sega Genesis, 1992) — a classic isometric action-RPG with bold, colorful tile-based environments.

## Visual Style
- **Painterly**: Visible brush strokes, soft blending, rich color variation within surfaces
- **Isometric perspective**: True isometric (30-degree projection), diamond-shaped tiles viewed from above-right
- **Palette**: Warm greens, mossy earth tones, dappled golden light filtering through canopy. Muted but saturated — not cartoonishly bright, not desaturated.
- **Rendering**: Hand-painted feel, NO photorealism. Think watercolor meets gouache. Subtle texture variation across surfaces.

---

## Isometric Geometry (Codified)

All assets share a single canonical isometric projection. This must be consistent across every tile and prop.

### Projection
- **Type**: True isometric — 2:1 width-to-height ratio on the ground plane
- **Camera angle**: ~35.26 degrees from horizontal (arctan(1/sqrt(2))), looking down at the ground plane from the upper-right
- **Light source**: Upper-left, casting shadows toward lower-right

### Tile Mask (tile_mask.png)
A reference mask defines the exact shape and placement of all base tiles:
- **Canvas**: 1024x1024 pixels, solid black (#000000) background
- **Diamond**: Green (#00C800) filled rhombus, centered at (512, 512)
- **Diamond dimensions**: 820px wide x 410px tall (2:1 ratio)
- **Diamond vertices**:
  - Top: (512, 307)
  - Right: (922, 512)
  - Bottom: (512, 717)
  - Left: (102, 512)

### Rules
- **Every base tile** must fill exactly the green region of `tile_mask.png` — no larger, no smaller
- Tiles are **flat surfaces only** — no 3D block depth, no extruded sides. The tile represents the top face of the ground plane only.
- Tile edges must be **crisp and aligned** to the diamond boundary so adjacent tiles can seamlessly connect
- All tiles share the same vanishing point and projection — if two tiles were placed side by side they must look like they belong on the same ground plane

---

## Base Tiles (Forest Biome)

Base tiles fill the tile mask diamond exactly. They are flat ground surfaces with no vertical extrusion.

1. **Grass** — lush green forest floor, short grass with subtle color variation
2. **Dirt Path** — packed earth trail, worn and slightly muddy, leaf litter at edges
3. **Stone** — flat grey cobblestone or natural rock surface, mossy cracks
4. **Water/Pond** — shallow forest pool, reflective surface, slight blue-green tint
5. **Flower Meadow** — grass base with scattered wildflowers (purple, yellow, white)

---

## Placeable Props (Forest Biome)

Placeables are objects that sit ON TOP of base tiles. They are rendered as standalone sprites.

### Placeable Rules
- **NO base block or ground surface** — placeables must NOT include a tile, platform, pedestal, or ground beneath them. They are sprites only, showing the object itself.
- The bottom of the prop should align with where it would contact the tile surface, so it can be composited onto any base tile
- Props sit on a **solid black or transparent background** — the background is NOT part of the asset
- Props must share the **same isometric perspective and light direction** as the base tiles
- Scale should be proportional — a tree should look correct when placed on a single tile, a fern cluster should be smaller than a boulder, etc.
- Props may extend above the tile mask boundary vertically (e.g., a tall tree), but their footprint (ground contact area) should fit within a single tile

### Prop List
1. **Oak Tree** — broad leafy canopy, thick trunk, casting shadow toward lower-right. No ground/dirt at base.
2. **Boulder** — large mossy rock, natural and weathered. No ground beneath it.
3. **Tree Stump** — cut stump with visible rings, small mushrooms growing on it. No ground block.
4. **Fern Cluster** — lush green ferns, low ground cover. Just the plants, no soil mound or tile beneath.
5. **Wooden Sign** — rustic wooden post with a blank hanging sign. Just the post and sign, no ground.

---

## Prompt Templates

### Base Tile Prompt
All base tile prompts must include:
- "isometric game tile, Landstalker Sega Genesis style"
- "painterly hand-painted art style, gouache brushstrokes"
- "flat isometric diamond tile, NO 3D block depth, NO extruded sides, top-down ground surface only"
- "fill exactly the diamond shape on solid black background"
- "game asset, clean crisp edges aligned to isometric diamond boundary"
- "2:1 width-to-height isometric diamond ratio"
- "square image, 1024x1024"

When image input is available, include `tile_mask.png` as a reference with:
- "Fill ONLY the green diamond region of the provided mask. Black areas must remain black."

### Placeable Prop Prompt
All prop prompts must include:
- "isometric game prop sprite, Landstalker Sega Genesis style"
- "painterly hand-painted art style, gouache brushstrokes"
- "standalone object, NO ground block, NO base tile, NO platform beneath the object"
- "object only, on solid black background"
- "same isometric perspective as game tiles, light from upper-left"
- "game asset with clean edges, suitable for compositing onto isometric tiles"
- "square image, 1024x1024"
