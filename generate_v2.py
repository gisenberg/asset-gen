#!/usr/bin/env python3
"""Generate assets by combining the descriptor hierarchy into prompts.

Pipeline: game.md + _tiles.md/_props.md + asset.md -> prompt
Tiles also receive tile_mask.png as image input.
"""

import json
import base64
import urllib.request
import os
import re
import glob
import sys
from postprocess import process_file

# Load API key from .mcp.json
with open(os.path.expanduser("~/.claude/.mcp.json")) as f:
    config = json.load(f)
API_KEY = config["mcpServers"]["openrouter-image-gen"]["env"]["OPENROUTER_API_KEY"]

DEFAULT_MODEL = "google/gemini-2.5-flash-image"
API_URL = "https://openrouter.ai/api/v1/chat/completions"
ASSETS_DIR = "assets"
OUT_DIR = "generated_images"


def load_md(path):
    """Load a markdown file and return its text content, stripping the # title line."""
    with open(path) as f:
        lines = f.readlines()
    # Strip leading title line (# Foo)
    content_lines = [l for l in lines if not l.startswith("# ")]
    return "".join(content_lines).strip()


def build_prompt(asset_path):
    """Walk the hierarchy to build a combined prompt for an asset.

    Hierarchy:
      assets/game.md
      assets/{category}/_tiles.md or _props.md
      assets/{category}/{asset}.md
    """
    parts = []

    # Level 1: game-wide
    game_md = os.path.join(ASSETS_DIR, "game.md")
    if os.path.exists(game_md):
        parts.append(load_md(game_md))

    # Level 2: category rules (_tiles.md or _props.md)
    category_dir = os.path.dirname(asset_path)
    for candidate in ["_tiles.md", "_props.md"]:
        cat_md = os.path.join(category_dir, candidate)
        if os.path.exists(cat_md):
            parts.append(load_md(cat_md))

    # Level 3: asset-specific
    parts.append(load_md(asset_path))

    return " ".join(parts)


def is_tile(asset_path):
    """Check if an asset is a tile (needs mask input)."""
    return "/tiles/" in asset_path


def load_mask():
    """Load tile_mask.png as a base64 data URL."""
    with open(os.path.join(ASSETS_DIR, "tiles", "tile_mask.png"), "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    return f"data:image/png;base64,{b64}"


def extract_and_save_image(data, filepath):
    """Extract image from OpenRouter response and save to filepath."""
    message = data["choices"][0]["message"]
    tokens = data.get("usage", {}).get("total_tokens", 0)

    # Format 1: message.images array
    images = message.get("images", [])
    if images:
        img = images[0]
        url = img.get("image_url", {}).get("url", "")
        if url.startswith("data:"):
            header, b64 = url.split(",", 1)
            ext = "png" if "png" in header else "jpg"
            img_bytes = base64.b64decode(b64)
            out = f"{filepath}.{ext}"
            with open(out, "wb") as f:
                f.write(img_bytes)
            return out, tokens

    # Format 2: content is a list with image parts
    content = message.get("content")
    if isinstance(content, list):
        for part in content:
            if isinstance(part, dict):
                if "inline_data" in part:
                    mime = part["inline_data"].get("mime_type", "image/png")
                    b64 = part["inline_data"]["data"]
                    ext = "png" if "png" in mime else "jpg"
                    out = f"{filepath}.{ext}"
                    with open(out, "wb") as f:
                        f.write(base64.b64decode(b64))
                    return out, tokens
                if part.get("type") == "image_url":
                    url = part["image_url"]["url"]
                    if url.startswith("data:"):
                        header, b64 = url.split(",", 1)
                        ext = "png" if "png" in header else "jpg"
                        out = f"{filepath}.{ext}"
                        with open(out, "wb") as f:
                            f.write(base64.b64decode(b64))
                        return out, tokens

    # Format 3: content string with embedded base64
    if isinstance(content, str) and "data:image" in content:
        match = re.search(r'data:image/(\w+);base64,([A-Za-z0-9+/=]+)', content)
        if match:
            ext = "jpg" if match.group(1) == "jpeg" else match.group(1)
            out = f"{filepath}.{ext}"
            with open(out, "wb") as f:
                f.write(base64.b64decode(match.group(2)))
            return out, tokens

    return None, tokens


def generate(name, prompt, include_mask=False, model=DEFAULT_MODEL):
    """Call OpenRouter API and save the resulting image."""
    mask_url = load_mask() if include_mask else None

    if include_mask:
        content = [
            {"type": "image_url", "image_url": {"url": mask_url}},
            {"type": "text", "text": prompt},
        ]
    else:
        content = prompt

    body = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": content}],
    }).encode()

    req = urllib.request.Request(
        API_URL,
        data=body,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/gemini-image-gen-mcp",
            "X-Title": "Asset Generation Pipeline",
        },
    )

    filepath_base = os.path.join(OUT_DIR, name)

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read())
    except Exception as e:
        print(f"  FAILED: {e}", flush=True)
        return None

    result, tokens = extract_and_save_image(data, filepath_base)
    if result:
        size_kb = os.path.getsize(result) // 1024
        print(f"  OK: {result} ({size_kb}KB, {tokens} tokens)", flush=True)
    else:
        print(f"  WARN: No image extracted ({tokens} tokens)", flush=True)
    return result


def discover_assets():
    """Find all asset markdown files (excluding _ prefixed category files)."""
    assets = []
    for category in ["tiles", "props"]:
        cat_dir = os.path.join(ASSETS_DIR, category)
        if not os.path.isdir(cat_dir):
            continue
        for md in sorted(glob.glob(os.path.join(cat_dir, "*.md"))):
            basename = os.path.basename(md)
            if basename.startswith("_"):
                continue
            assets.append(md)
    return assets


def main():
    model = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_MODEL
    suffix = sys.argv[2] if len(sys.argv) > 2 else "v3"

    os.makedirs(OUT_DIR, exist_ok=True)

    assets = discover_assets()
    print(f"Found {len(assets)} assets, model={model}, suffix={suffix}\n", flush=True)

    for asset_path in assets:
        category = os.path.basename(os.path.dirname(asset_path))
        name = os.path.splitext(os.path.basename(asset_path))[0]
        prefix = "tile" if category == "tiles" else "item"
        output_name = f"{prefix}_{name}_{suffix}"

        prompt = build_prompt(asset_path)
        use_mask = is_tile(asset_path)

        print(f"{output_name} ({'+ mask' if use_mask else 'text only'})", flush=True)
        result = generate(output_name, prompt, include_mask=use_mask, model=model)
        if result:
            print(f"  postprocess: ", end="", flush=True)
            process_file(result)

    print("\nDone!", flush=True)


if __name__ == "__main__":
    main()
