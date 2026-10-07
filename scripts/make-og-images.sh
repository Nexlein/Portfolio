#!/usr/bin/env bash
# Social preview image per project: public/projects/<id>/og.jpg (1200x630 JPEG, what LinkedIn/X expect).
# Built from the video poster, or the first image: fitted whole over a blurred, darkened copy of itself.
# Usage: npm run media:og [-- --force]   (requires ffmpeg)
set -euo pipefail

force=false
[[ "${1:-}" == "--force" ]] && force=true

for dir in public/projects/*/; do
    out="${dir}og.jpg"
    if [[ -f "$out" && "$force" == false ]]; then
        continue
    fi
    src=$(ls "$dir"*.poster.webp 2>/dev/null | head -1 || true)
    [[ -z "$src" ]] && src=$(ls "$dir"*.webp 2>/dev/null | sort | head -1 || true)
    if [[ -z "$src" ]]; then
        echo "skip: no image in $dir" >&2
        continue
    fi
    ffmpeg -v error -y -i "$src" -filter_complex \
        "[0]scale=1200:630:force_original_aspect_ratio=increase,crop=1200:630,boxblur=24,eq=brightness=-0.25[bg];[0]scale=1200:630:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2" \
        -frames:v 1 -q:v 4 "$out"
    echo "og: $out ($(du -h "$out" | cut -f1)) from $(basename "$src")"
done
