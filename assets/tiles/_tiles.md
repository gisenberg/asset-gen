# Tile Rules

## Shape
Flat isometric diamond tile. Fill ONLY the green diamond region of the provided mask image. Magenta areas must remain magenta (#FF00FF).

## Constraints
- NO 3D block depth, NO extruded sides — top-down ground surface only
- Clean crisp edges aligned to isometric diamond boundary
- 2:1 width-to-height isometric diamond ratio
- Tiles must suggest seamless adjacency — edges should connect to neighboring tiles

## Mask
`tile_mask.png` — 1024x1024, green (#00C800) diamond on magenta (#FF00FF), centered at (512, 512), 820x410px
