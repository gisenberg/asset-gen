# Spritesheet Rules

## Format
Single 1024x1024 image containing a grid of isometric tiles. Grid dimensions are specified per spritesheet.

## Isometric Projection
Each tile is a FLAT isometric diamond viewed from above. The diamond has a 2:1 width-to-height ratio — WIDE and FLAT, NOT a rotated square.
- Diamond width = cell width (minus small margin)
- Diamond height = HALF the diamond width
- Horizontally centered in the cell
- NO depth, NO extruded sides, NO 3D block faces — ground surfaces only

WRONG: a square rotated 45° (height = width)
CORRECT: a wide flat diamond (height = width / 2)

## Mask Image
You will receive a mask image showing the grid layout. Each cell contains:
- **Green (#00C800)** = ground/terrain — paint tile art here
- **Blue (#0000FF)** = feature (river, path) — paint the feature here
- **Magenta (#FF00FF)** = background — keep as magenta, do NOT paint over

Your output MUST match the mask boundaries. Paint only within green and blue regions.

## Grid Rules
- Uniform grid — all cells are the same size
- Tiles must NOT bleed across cell boundaries
- All tiles share a CONSISTENT palette — this is one tileset
- Tile edges should use matching colors for seamless tiling in-game
