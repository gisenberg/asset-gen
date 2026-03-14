#!/usr/bin/env python3
"""Slice a spritesheet into individual tile images.

Usage: python3 slice_spritesheet.py <spritesheet.png> <cols> <rows> <output_dir> [prefix]

Outputs: {output_dir}/{prefix}_{row}_{col}.png for each cell.
"""

from PIL import Image
import sys
import os


def slice_spritesheet(input_path, cols, rows, output_dir, prefix='tile'):
    img = Image.open(input_path)
    width, height = img.size
    cell_w = width // cols
    cell_h = height // rows

    os.makedirs(output_dir, exist_ok=True)

    for row in range(rows):
        for col in range(cols):
            left = col * cell_w
            top = row * cell_h
            cell = img.crop((left, top, left + cell_w, top + cell_h))
            out_path = os.path.join(output_dir, f'{prefix}_{row}_{col}.png')
            cell.save(out_path)
            print(f'  {out_path} ({cell_w}x{cell_h})')

    print(f'Sliced {cols}x{rows} = {cols * rows} tiles from {input_path}')


if __name__ == '__main__':
    if len(sys.argv) < 5:
        print(f'Usage: {sys.argv[0]} <spritesheet.png> <cols> <rows> <output_dir> [prefix]')
        sys.exit(1)

    input_path = sys.argv[1]
    cols = int(sys.argv[2])
    rows = int(sys.argv[3])
    output_dir = sys.argv[4]
    prefix = sys.argv[5] if len(sys.argv) > 5 else 'tile'

    slice_spritesheet(input_path, cols, rows, output_dir, prefix)
