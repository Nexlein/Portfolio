#!/usr/bin/env bash
# Generate a poster image for every project video: public/projects/<id>/<name>.mp4 -> <name>.poster.webp
# The poster shows instantly while the video loads (or instead of it with reduced motion).
# Usage: npm run media:posters [-- --force]   (requires ffmpeg)
set -euo pipefail

force=false
[[ "${1:-}" == "--force" ]] && force=true

for video in public/projects/*/*.mp4; do
    poster="${video%.mp4}.poster.webp"
    if [[ -f "$poster" && "$force" == false ]]; then
        continue
    fi
    # Frame at 1s (first frames are often blank), at most 800px wide (cards are ~400px at 2x DPR).
    ffmpeg -v error -y -ss 1 -i "$video" -frames:v 1 -vf "scale='min(800,iw)':-2" -c:v libwebp -quality 75 "$poster"
    echo "poster: $poster ($(du -h "$poster" | cut -f1))"
done
