#!/usr/bin/env python3
"""Post-process generated images to enforce magenta (#FF00FF) backgrounds.

Tiles:  mask-based — the mask defines which pixels are background.
Props:  rembg-based — AI background removal, composited onto magenta.

Usage:
    python postprocess.py                          # process all in generated_images/
    python postprocess.py path/to/image.png        # process a single file
    python postprocess.py --dry-run                # show what would be processed
"""

import os
import sys
import glob
import numpy as np
from PIL import Image

ASSETS_DIR = "assets"
GENERATED_DIR = "generated_images"
MAGENTA = (255, 0, 255)

TILE_MASK_PATH = os.path.join(ASSETS_DIR, "tiles", "tile_mask.png")
CONNECTABLE_MASKS_DIR = os.path.join(ASSETS_DIR, "tiles", "connectable", "masks")

# Connectable variant names — used to match tile filenames to their masks
CONNECTABLE_VARIANTS = [
    "straight_ew", "straight_ns",
    "corner_ne", "corner_nw", "corner_se", "corner_sw",
    "tjunction_new", "tjunction_nes", "tjunction_esw", "tjunction_nsw",
    "crossroads",
    "end_n", "end_e", "end_s", "end_w",
]


def is_tile(filename):
    return os.path.basename(filename).startswith("tile_")


def is_prop(filename):
    return os.path.basename(filename).startswith("item_")


def is_sheet(filename):
    return os.path.basename(filename).startswith("sheet_")


def get_mask_path(filename):
    """Determine the correct mask for a tile image.

    Returns the connectable variant mask if the filename matches,
    otherwise the standard tile_mask.png.
    """
    basename = os.path.basename(filename)
    # Strip prefix: tile_corner_ne_nb1_2026-...png -> corner_ne_nb1_2026-...png
    name_part = basename[len("tile_"):]

    for variant in CONNECTABLE_VARIANTS:
        if name_part.startswith(variant + "_") or name_part.startswith(variant + "."):
            mask = os.path.join(CONNECTABLE_MASKS_DIR, f"{variant}.png")
            if os.path.exists(mask):
                return mask

    return TILE_MASK_PATH


def cleanup_near_magenta(img_array):
    """Force near-magenta pixels to exact magenta.

    Models often produce pixels that are close to but not exactly #FF00FF.
    This cleans them up so chroma keying works cleanly.
    """
    r, g, b = img_array[:, :, 0], img_array[:, :, 1], img_array[:, :, 2]
    near_magenta = (r > 180) & (g < 80) & (b > 180)
    img_array[near_magenta] = MAGENTA
    return img_array


def process_tile(image_path):
    """Replace background pixels using the mask.

    Any pixel that is magenta in the mask becomes magenta in the output.
    Non-magenta mask pixels keep the generated image content.
    """
    mask_path = get_mask_path(image_path)
    if not os.path.exists(mask_path):
        print(f"  SKIP (no mask): {mask_path}")
        return False

    img = np.array(Image.open(image_path).convert("RGB"))
    mask = np.array(Image.open(mask_path).convert("RGB"))

    # Resize mask to match image if needed
    if mask.shape[:2] != img.shape[:2]:
        mask_img = Image.fromarray(mask).resize(
            (img.shape[1], img.shape[0]), Image.NEAREST
        )
        mask = np.array(mask_img)

    # Magenta in mask: R > 200, G < 50, B > 200
    is_bg = (mask[:, :, 0] > 200) & (mask[:, :, 1] < 50) & (mask[:, :, 2] > 200)

    img[is_bg] = MAGENTA

    # Also clean up near-magenta bleed in non-masked areas
    cleanup_near_magenta(img)

    Image.fromarray(img).save(image_path)
    return True


def process_sheet(image_path):
    """Clean up near-magenta pixels in spritesheet images.

    Spritesheets don't have a single mask, but the model should produce
    magenta backgrounds between tiles. Force near-magenta to exact magenta.
    """
    img = np.array(Image.open(image_path).convert("RGB"))
    cleanup_near_magenta(img)
    Image.fromarray(img).save(image_path)
    return True


def process_prop(image_path):
    """Remove background with rembg, composite onto magenta."""
    from rembg import remove

    img = Image.open(image_path).convert("RGB")
    # rembg returns RGBA with transparent background
    result = remove(img)

    # Composite onto solid magenta
    bg = Image.new("RGBA", result.size, (*MAGENTA, 255))
    bg.paste(result, (0, 0), result)

    bg.convert("RGB").save(image_path)
    return True


def process_file(path, dry_run=False):
    """Process a single image file."""
    basename = os.path.basename(path)

    if is_tile(basename):
        kind = "tile"
        mask_path = get_mask_path(path)
        detail = f"mask={os.path.basename(mask_path)}"
    elif is_prop(basename):
        kind = "prop"
        detail = "rembg"
    elif is_sheet(basename):
        kind = "sheet"
        detail = "near-magenta cleanup"
    else:
        print(f"  SKIP (unknown type): {basename}")
        return False

    if dry_run:
        print(f"  {basename} [{kind}, {detail}]")
        return True

    print(f"  {basename} [{kind}, {detail}] ... ", end="", flush=True)

    if kind == "tile":
        ok = process_tile(path)
    elif kind == "sheet":
        ok = process_sheet(path)
    else:
        ok = process_prop(path)

    print("OK" if ok else "FAILED")
    return ok


def discover_images(directory):
    """Find all generated images to process."""
    images = []
    for ext in ("*.png", "*.jpg", "*.jpeg"):
        images.extend(glob.glob(os.path.join(directory, ext)))
    return sorted(images)


def main():
    dry_run = "--dry-run" in sys.argv
    args = [a for a in sys.argv[1:] if a != "--dry-run"]

    if args:
        # Process specific file(s)
        files = args
    else:
        # Process all generated images
        files = discover_images(GENERATED_DIR)

    if not files:
        print("No images found.")
        return

    action = "Would process" if dry_run else "Processing"
    print(f"{action} {len(files)} image(s):\n")

    ok_count = 0
    for path in files:
        if process_file(path, dry_run=dry_run):
            ok_count += 1

    print(f"\nDone: {ok_count}/{len(files)} processed.")


if __name__ == "__main__":
    main()
