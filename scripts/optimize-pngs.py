#!/usr/bin/env python3
"""
Perceptually optimizes all PNG assets in assets/images/ and public/icons/
using pngquant (libimagequant RGBA/RGB perceptual palette + dithering) and
optipng lossless deflate recompression.

Idempotent: skips files that would not shrink by at least 2%.
"""
import glob
import os
import shutil
import subprocess
import sys


def optimize_png(path: str) -> tuple[int, int]:
    orig = os.path.getsize(path)
    is_backdrop = os.path.basename(path).startswith("bg-")
    quality = "65-88" if is_backdrop else "72-94"
    tmp = path + ".opt_tmp.png"

    try:
        res = subprocess.run(
            [
                "pngquant",
                f"--quality={quality}",
                "--speed",
                "1",
                "--strip",
                "--force",
                "--output",
                tmp,
                path,
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if res.returncode != 0 or not os.path.exists(tmp):
            shutil.copy2(path, tmp)

        subprocess.run(
            ["optipng", "-fix", "-quiet", "-o2", tmp],
            check=True,
        )
        comp = os.path.getsize(tmp)
        if comp < orig * 0.98:
            shutil.move(tmp, path)
            return orig, comp
        else:
            os.remove(tmp)
            return orig, orig
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)


def main() -> int:
    files = sorted(glob.glob("assets/images/*.png") + glob.glob("public/icons/*.png"))
    if not files:
        print("No PNG files found.", file=sys.stderr)
        return 1

    total_before = 0
    total_after = 0
    for f in files:
        before, after = optimize_png(f)
        total_before += before
        total_after += after
        saved_pct = 100.0 * (1.0 - after / before) if before else 0.0
        print(
            f"{f:36s} {before/1024:7.1f} KB -> {after/1024:7.1f} KB  (-{saved_pct:4.1f}%)"
        )

    saved_mb = (total_before - total_after) / (1024 * 1024)
    pct = 100.0 * (1.0 - total_after / total_before)
    print(
        f"\nTOTAL ({len(files)} PNGs): {total_before/1024/1024:.2f} MB -> "
        f"{total_after/1024/1024:.2f} MB (saved {saved_mb:.2f} MB / -{pct:.1f}%)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
