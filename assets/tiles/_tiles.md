# Tile Rules

## MASK COMPLIANCE (HIGHEST PRIORITY)
You will receive a mask image. This mask is a STRICT TEMPLATE — your output must match its regions EXACTLY.
- **Magenta (#FF00FF) pixels → output magenta (#FF00FF).** Do NOT paint over magenta. Do NOT expand into magenta.
- **Green (#00C800) pixels → paint your tile art HERE ONLY.** The green region is a diamond shape — your art must fill this diamond and NOTHING else.
- The output image must be 1024x1024. The diamond is centered at (512, 512), 820px wide × 410px tall.
- The boundary between painted area and magenta must be crisp and pixel-accurate — follow the mask edge exactly.

## Shape
Flat isometric diamond tile — top-down ground surface ONLY.

## Constraints
- NO 3D block depth, NO extruded sides, NO perspective distortion
- The painted region must be a flat ground surface viewed from isometric camera angle
- Clean crisp edges aligned to the isometric diamond boundary defined by the mask
- 2:1 width-to-height isometric diamond ratio (this is enforced by the mask)
- Tiles must suggest seamless adjacency — edges should connect to neighboring tiles
