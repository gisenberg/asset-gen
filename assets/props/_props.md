# Prop Rules

## Compositing
Standalone object sprite for placing on top of base tiles.

## Constraints
- NO ground block, NO base tile, NO platform, NO pedestal, NO soil mound beneath the object
- Object only — the bottom edge should align with where it contacts the tile surface
- Props may extend above the tile vertically but the ground footprint should fit within one tile
- Scale proportional to tiles — objects should look correct when composited onto a single tile

## Background
Solid magenta (#FF00FF) background surrounding the object — used as chroma key. No other background color.

## Perspective
Same isometric projection and light direction as base tiles.
