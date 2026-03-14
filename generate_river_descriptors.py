#!/usr/bin/env python3
"""Generate markdown descriptor files for all river tile variants."""

import os

VARIANTS = {
    "straight_ew": "River flowing east to west in a straight line across the tile.",
    "straight_ns": "River flowing north to south in a straight line across the tile.",
    "corner_ne": "River curving from the north edge to the east edge.",
    "corner_nw": "River curving from the north edge to the west edge.",
    "corner_se": "River curving from the south edge to the east edge.",
    "corner_sw": "River curving from the south edge to the west edge.",
    "tjunction_new": "River branching three ways: north, east, and west.",
    "tjunction_nes": "River branching three ways: north, east, and south.",
    "tjunction_esw": "River branching three ways: east, south, and west.",
    "tjunction_nsw": "River branching three ways: north, south, and west.",
    "crossroads": "River crossing in all four directions: north, east, south, and west.",
    "end_n": "River ending in a pool, connecting only to the north edge.",
    "end_e": "River ending in a pool, connecting only to the east edge.",
    "end_s": "River ending in a pool, connecting only to the south edge.",
    "end_w": "River ending in a pool, connecting only to the west edge.",
}

OUT_DIR = "assets/tiles/connectable/river"

for name, desc in VARIANTS.items():
    title = name.replace("_", " ").title()
    filepath = os.path.join(OUT_DIR, f"{name}.md")
    with open(filepath, "w") as f:
        f.write(f"# {title}\n\n{desc}\n")
    print(f"  {filepath}")

print(f"\nGenerated {len(VARIANTS)} descriptors in {OUT_DIR}")
