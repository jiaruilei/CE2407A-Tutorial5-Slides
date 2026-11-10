"""Rebuild the question crops from the original CE2407A Set 3 PDF.

Usage: python scripts/extract-questions.py --source-dir <course-materials>
Requires Poppler's pdftoppm on PATH and Python with Pillow.
"""

import argparse
import hashlib
from io import BytesIO
import json
from pathlib import Path
import subprocess

from PIL import Image


ASSETS = Path(__file__).resolve().parents[1] / "assets" / "questions"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, required=True)
    args = parser.parse_args()
    manifest = json.loads((ASSETS / "manifest.json").read_text(encoding="utf-8"))
    source = manifest["sources"][0]
    pdf = args.source_dir / source["filename"]
    if hashlib.sha256(pdf.read_bytes()).hexdigest() != source["sha256"]:
        parser.error("Source PDF differs from the edition used to select the crop coordinates.")
    for page in sorted({crop["page"] for crop in manifest["snapshots"]}):
        rendered = subprocess.run(["pdftoppm", "-f", str(page), "-l", str(page), "-singlefile",
                                   "-r", str(manifest["render_dpi"]), "-png", str(pdf)],
                                  stdout=subprocess.PIPE, check=True)
        with Image.open(BytesIO(rendered.stdout)) as image:
            for crop in manifest["snapshots"]:
                if crop["page"] != page:
                    continue
                box = tuple(round(v * manifest["raster_pixels_per_pdf_point"])
                            for v in crop["bbox_pt"])
                snapshot = image.crop(box)
                if list(snapshot.size) != crop["dimensions_px"]:
                    raise ValueError(f"Crop dimensions do not match for {crop['file']}")
                snapshot.save(ASSETS / crop["file"], optimize=True,
                              dpi=(manifest["render_dpi"], manifest["render_dpi"]))


if __name__ == "__main__":
    main()
