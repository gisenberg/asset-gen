from PIL import Image, ImageDraw, ImageFont
import glob
import os

IMG_DIR = "generated_images"
OUT_FILE = "comparison_table.png"

# Define the grid: rows are subjects, columns are models
subjects = [
    ("Grass Tile", "tile_grass"),
    ("Dirt Path Tile", "tile_dirt"),
    ("Stone Tile", "tile_stone"),
    ("Water Tile", "tile_water"),
    ("Flower Tile", "tile_flowers"),
    ("Oak Tree", "item_oak"),
    ("Boulder", "item_boulder"),
    ("Tree Stump", "item_stump"),
    ("Fern Cluster", "item_ferns"),
    ("Wooden Sign", "item_sign"),
]

models = [
    ("Nano Banana", "nb1"),
    ("Nano Banana 2", "nb2"),
    ("Nano Banana Pro", "nbpro"),
    ("v2 (NB + mask)", "v2"),
]

THUMB = 256
PAD = 10
HEADER_H = 50
ROW_LABEL_W = 200

def find_image(prefix, suffix):
    # Try timestamped pattern first (v1 images)
    pattern = os.path.join(IMG_DIR, f"{prefix}_{suffix}_*")
    matches = glob.glob(pattern)
    if matches:
        return matches[0]
    # Try direct name (v2 images: tile_grass_v2.png)
    for ext in ["png", "jpg", "jpeg"]:
        direct = os.path.join(IMG_DIR, f"{prefix}_{suffix}.{ext}")
        if os.path.exists(direct):
            return direct
    return None

# Calculate canvas size
cols = len(models)
rows = len(subjects)
canvas_w = ROW_LABEL_W + cols * (THUMB + PAD) + PAD
canvas_h = HEADER_H + rows * (THUMB + PAD) + PAD

canvas = Image.new("RGB", (canvas_w, canvas_h), (30, 30, 30))
draw = ImageDraw.Draw(canvas)

# Try to get a decent font
try:
    font_header = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
    font_label = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
except:
    font_header = ImageFont.load_default()
    font_label = ImageFont.load_default()

# Draw column headers
for ci, (model_name, _) in enumerate(models):
    x = ROW_LABEL_W + PAD + ci * (THUMB + PAD) + THUMB // 2
    draw.text((x, HEADER_H // 2), model_name, fill=(255, 255, 255), font=font_header, anchor="mm")

# Draw separator between tiles and items
separator_y = HEADER_H + 5 * (THUMB + PAD) - PAD // 2

# Draw rows
for ri, (label, prefix) in enumerate(subjects):
    y = HEADER_H + ri * (THUMB + PAD) + PAD

    # Row label
    draw.text((PAD + 10, y + THUMB // 2), label, fill=(200, 200, 200), font=font_label, anchor="lm")

    # Draw separator line between tiles and items sections
    if ri == 5:
        line_y = y - PAD // 2
        draw.line([(0, line_y), (canvas_w, line_y)], fill=(80, 80, 80), width=2)

    for ci, (_, suffix) in enumerate(models):
        x = ROW_LABEL_W + PAD + ci * (THUMB + PAD)
        img_path = find_image(prefix, suffix)
        if img_path:
            try:
                img = Image.open(img_path)
                img.thumbnail((THUMB, THUMB), Image.LANCZOS)
                # Center the thumbnail in its cell
                offset_x = x + (THUMB - img.width) // 2
                offset_y = y + (THUMB - img.height) // 2
                canvas.paste(img, (offset_x, offset_y))
            except Exception as e:
                draw.text((x + 10, y + 10), f"Error:\n{e}", fill=(255, 0, 0), font=font_label)
        else:
            draw.text((x + 10, y + THUMB // 2), "Missing", fill=(255, 100, 100), font=font_label, anchor="lm")

canvas.save(OUT_FILE)
print(f"Saved {OUT_FILE} ({canvas_w}x{canvas_h})")
