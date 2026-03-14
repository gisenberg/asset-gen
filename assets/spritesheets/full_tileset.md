# Full Tileset

8 columns x 16 rows, 128 tile slots. Each cell is 128x64 pixels containing a 2:1 isometric diamond.

## Row 0 — Base ground tiles:
- (0,0) **Grass 1** — lush green, short pixel grass
- (0,1) **Grass 2** — variant pattern
- (0,2) **Grass 3** — variant with tiny yellow flower pixels
- (0,3) **Dark grass** — deep forest floor, darker greens
- (0,4) **Dirt 1** — packed earth, warm brown, pebbles
- (0,5) **Dirt 2** — variant pattern
- (0,6) **Stone 1** — cobblestone, grey-brown, mossy gaps
- (0,7) **Stone 2** — variant pattern

## Row 1 — More ground:
- (1,0) **Water 1** — calm blue, pixel ripple highlights
- (1,1) **Water 2** — deeper blue variant
- (1,2) **Sand 1** — warm tan beach sand
- (1,3) **Sand 2** — variant grain
- (1,4) **Snow 1** — white with blue-grey pixel shadows
- (1,5) **Snow 2** — variant
- (1,6) **Flower meadow** — grass base, scattered red/yellow/purple flower pixels
- (1,7) **Mud** — dark wet brown, puddle highlight pixels

## Row 2 — Grass-to-dirt transitions (edges):
- (2,0) **Grass-dirt edge N** — grass north, dirt south
- (2,1) **Grass-dirt edge E** — grass west, dirt east
- (2,2) **Grass-dirt edge S** — dirt north, grass south
- (2,3) **Grass-dirt edge W** — dirt west, grass east
- (2,4) **Grass-dirt corner NE** — grass fills NE, dirt rest
- (2,5) **Grass-dirt corner NW** — grass fills NW
- (2,6) **Grass-dirt corner SE** — grass fills SE
- (2,7) **Grass-dirt corner SW** — grass fills SW

## Row 3 — Grass-to-water transitions:
- (3,0) **Grass-water edge N** — grass north, water south, shore pixels
- (3,1) **Grass-water edge E** — grass west, water east
- (3,2) **Grass-water edge S** — water north, grass south
- (3,3) **Grass-water edge W** — water west, grass east
- (3,4) **Grass-water corner NE** — grass NE, water rest
- (3,5) **Grass-water corner NW**
- (3,6) **Grass-water corner SE**
- (3,7) **Grass-water corner SW**

## Row 4 — Grass-to-stone transitions:
- (4,0) **Grass-stone edge N**
- (4,1) **Grass-stone edge E**
- (4,2) **Grass-stone edge S**
- (4,3) **Grass-stone edge W**
- (4,4) **Grass-stone corner NE**
- (4,5) **Grass-stone corner NW**
- (4,6) **Grass-stone corner SE**
- (4,7) **Grass-stone corner SW**

## Row 5 — Grass-to-sand transitions:
- (5,0) **Grass-sand edge N**
- (5,1) **Grass-sand edge E**
- (5,2) **Grass-sand edge S**
- (5,3) **Grass-sand edge W**
- (5,4) **Grass-sand corner NE**
- (5,5) **Grass-sand corner NW**
- (5,6) **Grass-sand corner SE**
- (5,7) **Grass-sand corner SW**

## Row 6 — Dirt-to-stone transitions:
- (6,0) **Dirt-stone edge N**
- (6,1) **Dirt-stone edge E**
- (6,2) **Dirt-stone edge S**
- (6,3) **Dirt-stone edge W**
- (6,4) **Dirt-stone corner NE**
- (6,5) **Dirt-stone corner NW**
- (6,6) **Dirt-stone corner SE**
- (6,7) **Dirt-stone corner SW**

## Row 7 — River connectables (BLUE mask = water, GREEN mask = grass banks):
- (7,0) **River straight EW** — water flows east-west through the blue region, grass fills green
- (7,1) **River straight NS** — water flows north-south
- (7,2) **River corner NE** — water turns from N to E
- (7,3) **River corner NW**
- (7,4) **River corner SE**
- (7,5) **River corner SW**
- (7,6) **River T-junction NES** — water branches N, E, S
- (7,7) **River T-junction NEW**

## Row 8 — More river connectables (BLUE mask = water, GREEN = grass):
- (8,0) **River T-junction NSW**
- (8,1) **River T-junction ESW**
- (8,2) **River crossroads** — all 4 edges connected with water
- (8,3) **River end N** — dead end, water opening to north
- (8,4) **River end E**
- (8,5) **River end S**
- (8,6) **River end W**
- (8,7) **River pond** — small circular water pool on grass (green diamond, no blue mask)

## Row 9 — Path connectables (BLUE mask = dirt path, GREEN = grass):
Fill the blue regions with dirt/path texture, green with grass.
- (9,0) **Path straight EW**
- (9,1) **Path straight NS**
- (9,2) **Path corner NE**
- (9,3) **Path corner NW**
- (9,4) **Path corner SE**
- (9,5) **Path corner SW**
- (9,6) **Path T-junction NES**
- (9,7) **Path T-junction NEW**

## Row 10 — More path connectables (BLUE mask = dirt path, GREEN = grass):
- (10,0) **Path T-junction NSW**
- (10,1) **Path T-junction ESW**
- (10,2) **Path crossroads**
- (10,3) **Path end N**
- (10,4) **Path end E**
- (10,5) **Path end S**
- (10,6) **Path end W**
- (10,7) **Bridge EW** — path crossing over river east-west (green diamond, no blue mask)

## Row 11 — Props on grass (items centered on grass diamond):
- (11,0) **Small rock** — single boulder
- (11,1) **Rock cluster** — 2-3 small rocks
- (11,2) **Bush** — green leafy bush
- (11,3) **Small tree** — short deciduous tree
- (11,4) **Pine tree** — conifer
- (11,5) **Stump** — cut tree stump
- (11,6) **Mushroom** — red cap mushroom pixel cluster
- (11,7) **Tall grass** — grass with tall swaying blades

## Row 12 — Props on grass (structures):
- (12,0) **Wooden sign** — signpost
- (12,1) **Fence post** — single fence segment
- (12,2) **Campfire** — small fire with orange/yellow pixels
- (12,3) **Chest** — wooden treasure chest
- (12,4) **Barrel** — wooden barrel
- (12,5) **Crate** — wooden crate
- (12,6) **Well** — stone well
- (12,7) **Lantern post** — standing lantern

## Row 13 — Special ground tiles:
- (13,0) **Lava** — orange-red with bright yellow pixel hotspots
- (13,1) **Lava 2** — variant
- (13,2) **Ice** — light cyan-white, reflective pixel highlights
- (13,3) **Ice 2** — variant with crack pixels
- (13,4) **Swamp** — murky green-brown water, lily pad pixels
- (13,5) **Swamp 2** — variant
- (13,6) **Cracked earth** — tan with dark crack lines
- (13,7) **Mossy stone** — stone base with heavy green moss

## Row 14 — Elevation tiles:
- (14,0) **Cliff edge N** — grass top with cliff face dropping south
- (14,1) **Cliff edge E** — cliff drops east
- (14,2) **Cliff edge S** — cliff drops south (seen from above)
- (14,3) **Cliff edge W** — cliff drops west
- (14,4) **Cliff corner NE** — cliff corner
- (14,5) **Cliff corner NW**
- (14,6) **Cliff corner SE**
- (14,7) **Cliff corner SW**

## Row 15 — UI / decoration:
- (15,0) **Shadow circle** — subtle dark circle for under-sprite shadows
- (15,1) **Highlight tile** — white semi-transparent selection indicator
- (15,2) **Red X tile** — forbidden/blocked indicator
- (15,3) **Grid tile** — faint grid lines on transparent, for editor overlay
- (15,4)-(15,7) **Empty** — solid magenta, reserved for future use

## Palette
- Grass: #2d5a1e, #3d7a2e, #5a9a3e, #7aba5e
- Dirt: #5a3a1e, #7a5a2e, #9a7a4e
- Stone: #4a4a4a, #6a6a6a, #8a8a8a, moss #3d5a2e
- Water: #1e3a6a, #2e5a8a, #4e7aaa, #8ebadd
- Sand: #c8a870, #b09060, #e0c890
- Snow: #d8e8f0, #b0c8d8, #ffffff
- Lava: #8a1a0a, #cc4400, #ff8800, #ffcc00
- Wood: #5a3a1e, #7a5a2e, #9a7a4e
- Shared highlight: #e8d8a8
- Shared shadow: #1a1a2e
