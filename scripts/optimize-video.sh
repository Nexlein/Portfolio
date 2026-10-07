#!/usr/bin/env bash
# Re-encode a project video for the web, in place: H.264 (plays everywhere), no audio,
# at most 960px wide and 30fps, moov atom first so playback starts before the download ends.
# Usage: npm run media:video -- public/projects/<id>/<name>.mp4   (requires ffmpeg)
set -euo pipefail

input="$1"
tmp="$(mktemp --suffix=.mp4)"
ffmpeg -v error -y -i "$input" -an -vf "scale='min(960,iw)':-2,fps=30" \
    -c:v libx264 -preset veryslow -crf 26 -profile:v high -pix_fmt yuv420p -movflags +faststart "$tmp"
echo "$input: $(du -h "$input" | cut -f1) -> $(du -h "$tmp" | cut -f1)"
mv "$tmp" "$input"
