# Spritesheet Rules

## Format
Single 1024x1024 pixel art image containing a grid of isometric tiles. Grid dimensions are specified per spritesheet.

## Style
16-bit pixel art. SNES/Sega Genesis era aesthetic. Clean pixel edges, limited palette, NO anti-aliasing, NO sub-pixel blending, NO gradients. Every pixel is deliberate.

## Isometric Projection — CRITICAL
Each tile is a FLAT isometric diamond viewed from above at ~30 degrees. The diamond shape has a 2:1 width-to-height ratio — it is WIDE and FLAT, NOT a rotated square.
- Diamond width = cell width (minus small margin)
- Diamond height = HALF the diamond width
- The diamond is horizontally centered in the cell
- Top vertex and bottom vertex are on the vertical centerline
- Left vertex and right vertex are on the horizontal centerline
- Light source: upper-left. Highlights on the top-left edges, shadows on bottom-right edges.
- Tiles are ground surfaces viewed from above — NO depth, NO extruded sides, NO 3D block faces.

WRONG: a square rotated 45° (diamond height = diamond width)
CORRECT: a wide flat diamond (diamond height = diamond width / 2)

## Mask Image
You will receive a mask image showing the grid layout. Each cell contains:
- **Green (#00C800)** = ground/terrain area — paint your tile art here
- **Blue (#0000FF)** = feature area (river, path) — paint the feature here
- **Magenta (#FF00FF)** = background — keep as magenta, do NOT paint over it

Your output MUST match the mask boundaries. Paint only within the green and blue regions. The shape and position of every diamond must match the mask exactly.

## CRITICAL RULES
- Uniform grid — all cells are the same size
- Tiles must NOT bleed across cell boundaries
- All tiles share a CONSISTENT palette — this is one tileset
- Pixel art: crisp integer pixels, no blurring, no anti-aliasing
- Keep each tile to 8-16 colors for authentic 16-bit feel
- Tile edges should use matching colors for seamless tiling in-game
- FLAT isometric diamonds only — 2:1 ratio — NOT rotated squares
