#!/usr/bin/env python3
"""Generate grid mask images for spritesheet generation.

Creates a 1024x1024 mask with isometric diamonds tiled in a grid.
Optionally composites connectable tile masks into specific grid cells.
"""

from PIL import Image, ImageDraw
import json
import sys
import os

# Connectable mask filenames mapped to grid positions for full_tileset.md
# Row 7: river connectables (first 8)
# Row 8: river connectables continued
RIVER_MASKS = {
    (7, 0): 'straight_ew.png',
    (7, 1): 'straight_ns.png',
    (7, 2): 'corner_ne.png',
    (7, 3): 'corner_nw.png',
    (7, 4): 'corner_se.png',
    (7, 5): 'corner_sw.png',
    (7, 6): 'tjunction_nes.png',
    (7, 7): 'tjunction_new.png',
    (8, 0): 'tjunction_nsw.png',
    (8, 1): 'tjunction_esw.png',
    (8, 2): 'crossroads.png',
    (8, 3): 'end_n.png',
    (8, 4): 'end_e.png',
    (8, 5): 'end_s.png',
    (8, 6): 'end_w.png',
}

# Row 9-10: path connectables use the same mask shapes
# but blue -> brown (we'll keep blue in the mask; the prompt describes it as path)
PATH_MASKS = {
    (9, 0): 'straight_ew.png',
    (9, 1): 'straight_ns.png',
    (9, 2): 'corner_ne.png',
    (9, 3): 'corner_nw.png',
    (9, 4): 'corner_se.png',
    (9, 5): 'corner_sw.png',
    (9, 6): 'tjunction_nes.png',
    (9, 7): 'tjunction_new.png',
    (10, 0): 'tjunction_nsw.png',
    (10, 1): 'tjunction_esw.png',
    (10, 2): 'crossroads.png',
    (10, 3): 'end_n.png',
    (10, 4): 'end_e.png',
    (10, 5): 'end_s.png',
    (10, 6): 'end_w.png',
}


def generate_grid_mask(cols, rows, output_path, masks_dir=None, layout_json=None):
    """Generate a grid mask with proper isometric diamonds."""
    size = 1024
    cell_w = size // cols
    cell_h = size // rows

    # Diamond dimensions: 2:1 isometric ratio, fitting within cell with margin
    margin_x = 2
    diamond_w = cell_w - margin_x * 2
    diamond_h = diamond_w // 2

    margin_y = 2
    if diamond_h > cell_h - margin_y * 2:
        diamond_h = cell_h - margin_y * 2
        diamond_w = diamond_h * 2

    magenta = (255, 0, 255)
    green = (0, 200, 0)

    img = Image.new('RGB', (size, size), magenta)
    draw = ImageDraw.Draw(img)

    # Collect connectable mask positions
    all_masks = {}
    if layout_json and masks_dir:
        # Custom layout: JSON file mapping "row,col" -> mask filename
        with open(layout_json) as f:
            layout = json.load(f)
        for key, fname in layout.items():
            r, c = map(int, key.split(','))
            mask_path = os.path.join(masks_dir, fname)
            if os.path.exists(mask_path):
                all_masks[(r, c)] = mask_path
    elif masks_dir:
        for pos, fname in {**RIVER_MASKS, **PATH_MASKS}.items():
            mask_path = os.path.join(masks_dir, fname)
            if os.path.exists(mask_path):
                all_masks[pos] = mask_path

    for row in range(rows):
        for col in range(cols):
            cx = col * cell_w + cell_w // 2
            cy = row * cell_h + cell_h // 2

            if (row, col) in all_masks:
                # Composite the connectable mask into this cell.
                # Source masks are 1024x1024 with diamond at center (820x410).
                # Crop the diamond region, then resize to fit the cell.
                mask_img = Image.open(all_masks[(row, col)])
                mw, mh = mask_img.size
                # Crop to diamond bounding box (centered, 820x410 in 1024x1024)
                src_dw, src_dh = 820, 410
                crop_left = (mw - src_dw) // 2
                crop_top = (mh - src_dh) // 2
                cropped = mask_img.crop((crop_left, crop_top,
                                         crop_left + src_dw, crop_top + src_dh))
                # Resize to fit cell while preserving 2:1 aspect ratio
                target_w = diamond_w
                target_h = diamond_h
                resized = cropped.resize((target_w, target_h), Image.NEAREST)
                # Paste centered in cell
                paste_x = col * cell_w + (cell_w - target_w) // 2
                paste_y = row * cell_h + (cell_h - target_h) // 2
                img.paste(resized, (paste_x, paste_y))
            else:
                # Draw plain green isometric diamond
                hw = diamond_w // 2
                hh = diamond_h // 2
                diamond = [
                    (cx, cy - hh),
                    (cx + hw, cy),
                    (cx, cy + hh),
                    (cx - hw, cy),
                ]
                draw.polygon(diamond, fill=green)

    img.save(output_path)
    connectable_count = len([p for p in all_masks if p[0] < rows and p[1] < cols])
    print(f"Generated {cols}x{rows} grid mask ({cell_w}x{cell_h} cells, "
          f"{diamond_w}x{diamond_h} diamonds, {connectable_count} connectable masks): {output_path}")


if __name__ == '__main__':
    cols = int(sys.argv[1]) if len(sys.argv) > 1 else 4
    rows = int(sys.argv[2]) if len(sys.argv) > 2 else 8
    output = sys.argv[3] if len(sys.argv) > 3 else f'assets/spritesheets/grid_mask_{cols}x{rows}.png'
    masks_dir = sys.argv[4] if len(sys.argv) > 4 else None
    layout_json = sys.argv[5] if len(sys.argv) > 5 else None

    os.makedirs(os.path.dirname(output), exist_ok=True)
    generate_grid_mask(cols, rows, output, masks_dir, layout_json)
