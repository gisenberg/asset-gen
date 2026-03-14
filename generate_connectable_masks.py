#!/usr/bin/env python3
"""Generate per-variant masks for connectable tilesets.

Each mask uses three colors on a 1024x1024 canvas:
  - Magenta (#FF00FF) — background
  - Green (#00C800)   — ground area within the tile diamond
  - Blue (#0000FF)    — feature region (river, path, etc.)

The feature crosses each connected edge at its center 40%.
All drawing is clipped to the diamond boundary.
"""

import os
import math
from PIL import Image, ImageDraw

SIZE = 1024
CX, CY = SIZE // 2, SIZE // 2
DIAMOND_W, DIAMOND_H = 820, 410

MAGENTA = (255, 0, 255)
GREEN = (0, 200, 0)
BLUE = (0, 0, 255)

# Diamond vertices
TOP = (CX, CY - DIAMOND_H // 2)      # (512, 307)
RIGHT = (CX + DIAMOND_W // 2, CY)     # (922, 512)
BOTTOM = (CX, CY + DIAMOND_H // 2)    # (512, 717)
LEFT = (CX - DIAMOND_W // 2, CY)      # (102, 512)

DIAMOND = [TOP, RIGHT, BOTTOM, LEFT]

# Connection width as fraction of edge length
CONN_FRACTION = 0.40

# Feature band width as fraction of edge length
BAND_WIDTH_FRACTION = 0.40


def edge_midpoint(edge):
    """Return the midpoint of an edge."""
    points = {"N": (TOP, RIGHT), "E": (RIGHT, BOTTOM),
              "S": (BOTTOM, LEFT), "W": (LEFT, TOP)}
    p1, p2 = points[edge]
    return ((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2)


def edge_extended_point(edge):
    """Return a point past the edge midpoint, extended outward so the band
    fully reaches the diamond boundary after clipping."""
    mid = edge_midpoint(edge)
    # Extend outward from center through the midpoint by 50% overshoot
    dx = mid[0] - CX
    dy = mid[1] - CY
    return (mid[0] + dx * 0.5, mid[1] + dy * 0.5)


def edge_length():
    return math.dist(TOP, RIGHT)


def create_diamond_mask():
    """Create a 1-bit mask of the diamond for clipping."""
    mask = Image.new("L", (SIZE, SIZE), 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(DIAMOND, fill=255)
    return mask


def draw_river_band(draw, p1, p2, half_width):
    """Draw a band (thick line) between two points as a polygon."""
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    length = math.sqrt(dx * dx + dy * dy)
    if length == 0:
        return

    # Perpendicular
    px, py = -dy / length * half_width, dx / length * half_width

    poly = [
        (p1[0] + px, p1[1] + py),
        (p1[0] - px, p1[1] - py),
        (p2[0] - px, p2[1] - py),
        (p2[0] + px, p2[1] + py),
    ]
    draw.polygon([(int(x), int(y)) for x, y in poly], fill=BLUE)


def shared_vertex(edge_a, edge_b):
    """Return the diamond vertex shared by two adjacent edges."""
    # Each edge connects two vertices; find the common one
    edge_verts = {
        "N": (TOP, RIGHT), "E": (RIGHT, BOTTOM),
        "S": (BOTTOM, LEFT), "W": (LEFT, TOP),
    }
    verts_a = set(edge_verts[edge_a])
    verts_b = set(edge_verts[edge_b])
    common = verts_a & verts_b
    if common:
        return common.pop()
    return (CX, CY)  # fallback for opposite edges


def draw_curved_corner(draw, edge_a, edge_b, half_width):
    """Draw a corner as a constant-width curved path using a quadratic Bezier.

    Uses edge midpoints as start/end and the shared vertex (blended toward
    center) as control point. Then draws straight bands from each edge
    midpoint outward to ensure coverage to the diamond boundary.
    """
    p0 = edge_extended_point(edge_a)
    p2 = edge_extended_point(edge_b)
    # Control point: between shared vertex and center
    vertex = shared_vertex(edge_a, edge_b)
    blend = 0.4  # 0 = vertex (tight corner), 1 = center (wide sweep)
    p1 = (vertex[0] + blend * (CX - vertex[0]),
           vertex[1] + blend * (CY - vertex[1]))

    N_SAMPLES = 40
    outer_pts = []
    inner_pts = []

    for i in range(N_SAMPLES + 1):
        t = i / N_SAMPLES

        # Quadratic Bezier position
        px = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0]
        py = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]

        # Tangent
        tx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])
        ty = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])
        tlen = math.sqrt(tx * tx + ty * ty)
        if tlen == 0:
            continue
        tx, ty = tx / tlen, ty / tlen

        # Perpendicular
        nx, ny = -ty, tx

        outer_pts.append((px + nx * half_width, py + ny * half_width))
        inner_pts.append((px - nx * half_width, py - ny * half_width))

    # Closed polygon: outer edge forward, inner edge reversed
    polygon = outer_pts + inner_pts[::-1]
    draw.polygon([(int(x), int(y)) for x, y in polygon], fill=BLUE)


def is_straight(edges):
    """Check if two edges are opposite (forming a straight)."""
    opposites = {frozenset({"N", "S"}), frozenset({"E", "W"})}
    return frozenset(edges) in opposites


def generate_mask(edges, output_path):
    """Generate a single variant mask with features clipped to diamond."""
    img = Image.new("RGB", (SIZE, SIZE), MAGENTA)
    tile = Image.new("RGB", (SIZE, SIZE), GREEN)
    draw = ImageDraw.Draw(tile)

    center = (CX, CY)
    el = edge_length()
    half_width = (el * BAND_WIDTH_FRACTION) / 2

    if len(edges) == 1:
        # End cap: band from edge to center + isometric pool termination
        ext = edge_extended_point(edges[0])
        draw_river_band(draw, ext, center, half_width)
        end_rx = half_width * 2.0
        end_ry = end_rx / 2
        draw.ellipse(
            [int(center[0] - end_rx), int(center[1] - end_ry),
             int(center[0] + end_rx), int(center[1] + end_ry)],
            fill=BLUE
        )

    elif len(edges) == 2 and is_straight(edges):
        # Straight: just two bands through center, no junction needed
        for edge in edges:
            ext = edge_extended_point(edge)
            draw_river_band(draw, ext, center, half_width)

    elif len(edges) == 2:
        # Corner: proper L-junction — two bands plus a filled corner quad
        # toward the shared vertex so there's no gap
        for edge in edges:
            ext = edge_extended_point(edge)
            draw_river_band(draw, ext, center, half_width)

        # Fill the L corner: a triangle from center to the outer edges of
        # both bands on the vertex side, meeting at their intersection
        vertex = shared_vertex(edges[0], edges[1])
        mid_a = edge_midpoint(edges[0])
        mid_b = edge_midpoint(edges[1])

        def norm(ax, ay):
            l = math.sqrt(ax * ax + ay * ay)
            return (ax / l, ay / l) if l > 0 else (0, 0)

        da = norm(mid_a[0] - CX, mid_a[1] - CY)
        db = norm(mid_b[0] - CX, mid_b[1] - CY)
        pa = (-da[1], da[0])
        pb = (-db[1], db[0])

        def toward_vertex(perp):
            t = (CX + perp[0] * 10, CY + perp[1] * 10)
            return math.dist(t, vertex) < math.dist((CX - perp[0] * 10, CY - perp[1] * 10), vertex)

        sa = 1 if toward_vertex(pa) else -1
        sb = 1 if toward_vertex(pb) else -1

        # Outer edge points at center for each band (vertex side)
        oa = (CX + sa * pa[0] * half_width, CY + sa * pa[1] * half_width)
        ob = (CX + sb * pb[0] * half_width, CY + sb * pb[1] * half_width)

        # Outer edges on the opposite side (away from vertex)
        oa2 = (CX - sa * pa[0] * half_width, CY - sa * pa[1] * half_width)
        ob2 = (CX - sb * pb[0] * half_width, CY - sb * pb[1] * half_width)

        # Fill both gaps: vertex side and opposite side
        draw.polygon([(int(x), int(y)) for x, y in [center, oa, ob]], fill=BLUE)
        draw.polygon([(int(x), int(y)) for x, y in [center, oa2, ob2]], fill=BLUE)

    else:
        # T-junctions and crossroads: bands + isometric junction ellipse
        for edge in edges:
            ext = edge_extended_point(edge)
            draw_river_band(draw, ext, center, half_width)
        iso_rx = half_width * 1.2
        iso_ry = iso_rx / 2
        draw.ellipse(
            [int(center[0] - iso_rx), int(center[1] - iso_ry),
             int(center[0] + iso_rx), int(center[1] + iso_ry)],
            fill=BLUE
        )

    # Composite: paste tile onto magenta background using diamond as mask
    diamond_mask = create_diamond_mask()
    img.paste(tile, (0, 0), diamond_mask)

    img.save(output_path)
    return output_path


# All 15 variants
VARIANTS = {
    # Straights
    "straight_ew": ["E", "W"],
    "straight_ns": ["N", "S"],
    # Corners
    "corner_ne": ["N", "E"],
    "corner_nw": ["N", "W"],
    "corner_se": ["S", "E"],
    "corner_sw": ["S", "W"],
    # T-junctions
    "tjunction_new": ["N", "E", "W"],
    "tjunction_nes": ["N", "E", "S"],
    "tjunction_esw": ["E", "S", "W"],
    "tjunction_nsw": ["N", "S", "W"],
    # Crossroads
    "crossroads": ["N", "E", "S", "W"],
    # End caps
    "end_n": ["N"],
    "end_e": ["E"],
    "end_s": ["S"],
    "end_w": ["W"],
}


def main():
    import sys
    output_dir = sys.argv[1] if len(sys.argv) > 1 else "assets/tiles/connectable/masks"
    os.makedirs(output_dir, exist_ok=True)

    for name, edges in VARIANTS.items():
        path = os.path.join(output_dir, f"{name}.png")
        generate_mask(edges, path)
        print(f"  {name}: edges={','.join(edges)} -> {path}")

    print(f"\nGenerated {len(VARIANTS)} masks in {output_dir}")


if __name__ == "__main__":
    main()
