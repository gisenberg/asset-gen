# River Tiles

4 columns x 8 rows, 32 tile slots. Each cell is 256x128 containing a 2:1 isometric diamond.

The mask image shows BLUE regions for water and GREEN regions for grass banks. Paint water in blue areas, grass in green areas.

## Row 0 — River straights and corners:
- (0,0) **River straight EW** — water flows east-west through center, grass banks on both sides
- (0,1) **River straight NS** — water flows north-south
- (0,2) **River corner NE** — water turns from north edge to east edge, grass outside
- (0,3) **River corner NW** — water turns N to W

## Row 1 — More corners and T-junctions:
- (1,0) **River corner SE** — water turns S to E
- (1,1) **River corner SW** — water turns S to W
- (1,2) **River T-junction NES** — water branches to N, E, and S
- (1,3) **River T-junction NEW** — water branches N, E, W

## Row 2 — T-junctions, crossroads, ends:
- (2,0) **River T-junction NSW** — water branches N, S, W
- (2,1) **River T-junction ESW** — water branches E, S, W
- (2,2) **River crossroads** — water connects all 4 edges
- (2,3) **River end N** — dead end, water opening to north only, tapering to a point

## Row 3 — More ends:
- (3,0) **River end E** — dead end opening east
- (3,1) **River end S** — dead end opening south
- (3,2) **River end W** — dead end opening west
- (3,3) **Grass base** — plain grass tile (no river) for reference, same grass as the banks

## Row 4-7 — Grass base tiles (fill green diamonds with grass):
- (4,0)-(4,3) **Grass variants** — 4 grass pattern variants matching the river bank grass
- (5,0)-(5,3) **Grass-to-dirt transitions** — N, E, S, W edge transitions
- (6,0)-(6,3) **Grass-to-stone transitions** — N, E, S, W edge transitions
- (7,0)-(7,3) **Grass-to-water transitions** — N, E, S, W edge transitions with shoreline

## River Description
- Shallow forest stream with flowing water
- Gentle current suggested by lighter highlight lines along flow direction
- Earthy banks where water meets grass, natural transition

style: pixel_16bit
grid_mask: grid_mask_4x8_connectable.png
