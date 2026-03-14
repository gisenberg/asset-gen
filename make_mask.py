from PIL import Image, ImageDraw
import numpy as np

# Load the stone tile and analyze its non-black region to find the diamond bounds
img = Image.open("generated_images/tile_stone_nbpro_2026-03-14T01-08-16-435Z_1.png").convert("RGB")
pixels = np.array(img)

# Find non-black pixels (threshold to handle compression artifacts)
non_black = np.any(pixels > 30, axis=2)

# Get bounding rows/cols of the content
rows = np.any(non_black, axis=1)
cols = np.any(non_black, axis=0)
row_min, row_max = np.where(rows)[0][[0, -1]]
col_min, col_max = np.where(cols)[0][[0, -1]]

print(f"Content bounding box: x=[{col_min}, {col_max}], y=[{row_min}, {row_max}]")
print(f"Content size: {col_max - col_min + 1} x {row_max - row_min + 1}")

# Scan the top edge to find the diamond apex
# The topmost non-black row should have the narrowest horizontal span (the top point)
top_row = non_black[row_min]
top_cols = np.where(top_row)[0]
top_center = (top_cols[0] + top_cols[-1]) // 2
print(f"Top apex center: x={top_center}, y={row_min}")

# Find the widest row (the middle of the diamond)
widths = []
for r in range(row_min, row_max + 1):
    row_pixels = np.where(non_black[r])[0]
    if len(row_pixels) > 0:
        widths.append((r, row_pixels[-1] - row_pixels[0]))
    else:
        widths.append((r, 0))

widest_row, widest_w = max(widths, key=lambda x: x[1])
widest_cols = np.where(non_black[widest_row])[0]
print(f"Widest row: y={widest_row}, width={widest_w}, x=[{widest_cols[0]}, {widest_cols[-1]}]")

# The tile has depth (it's a 3D block, not flat). Let's find just the TOP FACE.
# The top face diamond: apex at top, widest at some middle row, then narrows going down
# For an isometric tile, the top face is a rhombus.

# Strategy: Create a clean idealized isometric diamond based on the measured geometry.
# Standard isometric: 2:1 width-to-height ratio for the top face diamond.

# Let's define a clean 1024x1024 mask with an idealized flat isometric diamond (no depth).
# Using the measured content as reference for positioning.

SIZE = 1024
MAGENTA = (255, 0, 255)
mask = Image.new("RGB", (SIZE, SIZE), MAGENTA)
draw = ImageDraw.Draw(mask)

# Idealized isometric diamond - flat tile, no block depth
# 2:1 ratio is standard isometric. Center it in the canvas.
# Using measured bounds as guide but cleaning up to exact geometry.
diamond_w = 820  # slightly smaller than canvas for padding
diamond_h = diamond_w // 2  # 2:1 isometric ratio

cx, cy = SIZE // 2, SIZE // 2

# Diamond points: top, right, bottom, left
diamond = [
    (cx, cy - diamond_h // 2),          # top
    (cx + diamond_w // 2, cy),           # right
    (cx, cy + diamond_h // 2),           # bottom
    (cx - diamond_w // 2, cy),           # left
]

draw.polygon(diamond, fill=(0, 200, 0))

mask.save("assets/tiles/tile_mask.png")
print(f"\nMask saved: tile_mask.png")
print(f"Diamond: {diamond_w}x{diamond_h} centered at ({cx},{cy})")
print(f"Diamond points (top, right, bottom, left):")
for label, pt in zip(["top", "right", "bottom", "left"], diamond):
    print(f"  {label}: {pt}")
print(f"\nIsometric ratio: {diamond_w}:{diamond_h} = 2:1")
