# Connectable Tile Rules

## Purpose
Connectable tiles form continuous features (rivers, paths, walls) that span multiple tiles. Each tile has 4 edges that either connect to the feature or don't.

## Edge Convention
Edges are named by compass direction in isometric space:
- **N** — top-right edge of the diamond
- **E** — bottom-right edge of the diamond
- **S** — bottom-left edge of the diamond
- **W** — top-left edge of the diamond

## Connection Protocol
- The feature crosses an edge at the **center 40%** of that edge
- Connection width and position are identical on all edges, ensuring any two tiles with matching connections align seamlessly
- The feature flows smoothly between its entry/exit points through the tile interior

## Variant Masks
Each variant has a programmatically generated mask with three colors:
- **Magenta (#FF00FF)** — background (chroma key)
- **Green (#00C800)** — base ground surface (fill with the underlying terrain)
- **Blue (#0000FF)** — feature region (fill with the connectable feature: water, path, etc.)

The mask defines exactly where the feature goes. The model must:
- Fill blue regions with the feature texture/appearance
- Fill green regions with the surrounding terrain
- Keep magenta regions as magenta

## Variant Naming
Variants are named by their connections: `{type}_{edges}`
- `straight_ew` — feature flows from east to west
- `corner_ne` — feature turns from north to east
- `tjunction_nes` — feature branches north, east, and south
- `crossroads` — feature connects all four edges
- `end_n` — feature terminates, connecting only to the north

## Reference Chaining
Generate one hero tile first (typically `straight_ew`). Feed it as a reference image when generating all subsequent variants to maintain visual consistency across the set.
