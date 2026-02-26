#!/usr/bin/env python3
"""
autocrop_face.py  —  FACE CROP ONLY (grayscale handled by sharp in Node.js)

Detects the largest face, crops to head+neck, resizes to target dimensions,
preserves RGBA transparency. No grayscale conversion here.

Usage:
  echo "<base64>" | python3 autocrop_face.py <width> <height> [facePercent]
"""

import sys, base64, io, cv2, numpy as np
from PIL import Image


def crop_face(rgba, w, h, face_pct):
    img_w, img_h = rgba.size
    rgb_arr = np.array(rgba.convert("RGB"))
    gray_cv = cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2GRAY)

    cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )

    faces = cascade.detectMultiScale(
        gray_cv, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
    )
    if len(faces) == 0:
        faces = cascade.detectMultiScale(
            gray_cv, scaleFactor=1.05, minNeighbors=3, minSize=(20, 20)
        )

    if len(faces) == 0:
        # Fallback: smart top-center crop
        scale = max(w / img_w, h / img_h)
        nw, nh = int(img_w * scale), int(img_h * scale)
        resized = rgba.resize((nw, nh), Image.LANCZOS)
        x0 = (nw - w) // 2
        y0 = max(0, min(int(nh * 0.10), nh - h))
        return resized.crop((x0, y0, x0 + w, y0 + h))

    fx, fy, fw, fh = sorted(faces, key=lambda f: f[2]*f[3], reverse=True)[0]

    crop_h = int(fh * 100 / face_pct)
    crop_w = int(crop_h * w / h)

    cx = fx + fw // 2
    cy = fy + fh // 2 - int(fh * 0.12)  # shift up for hair

    x1 = max(0, cx - crop_w // 2)
    y1 = max(0, cy - crop_h // 2)
    x2 = min(img_w, x1 + crop_w)
    y2 = min(img_h, y1 + crop_h)
    if x2 == img_w: x1 = max(0, x2 - crop_w)
    if y2 == img_h: y1 = max(0, y2 - crop_h)

    return rgba.crop((x1, y1, x2, y2)).resize((w, h), Image.LANCZOS)


def main():
    w        = int(sys.argv[1]) if len(sys.argv) > 1 else 273
    h        = int(sys.argv[2]) if len(sys.argv) > 2 else 405
    face_pct = int(sys.argv[3]) if len(sys.argv) > 3 else 60

    b64       = sys.stdin.read().strip()
    img_bytes = base64.b64decode(b64)
    rgba      = Image.open(io.BytesIO(img_bytes)).convert("RGBA")

    cropped = crop_face(rgba, w, h, face_pct)

    buf = io.BytesIO()
    cropped.save(buf, format="PNG")  # color RGBA — no grayscale here
    sys.stdout.write(base64.b64encode(buf.getvalue()).decode())


if __name__ == "__main__":
    main()
