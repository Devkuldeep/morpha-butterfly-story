#!/usr/bin/env bash
# Encodes the single AI story video that runs behind the whole page (hero → footer).
#   source : Butterfly_emerges_on_orchid_2174c6f9_1080p.mp4 (one continuous 14.9 s shot)
#   output : assets/video/morpha-story.mp4 (+ .jpg poster)
# - delogo removes the generator's ✦ mark (bottom-right)
# - every frame is a keyframe (-g 1) so scroll-scrubbing can seek anywhere instantly, both directions
# - audio dropped
# Scene windows used by js/main.js (STORY) were read off this source:
#   hero 0–2.8 · wing 4.8–9.6 · wonder 11.4–13.6 · garden 14.4–14.9 (the gaps are the in-video transitions)
# Usage (from the project root): tools/build-story-video.sh [width]
set -euo pipefail
SRC="Butterfly_emerges_on_orchid_2174c6f9_1080p.mp4"
OUT="assets/video/morpha-story.mp4"
W="${1:-1600}"

ffmpeg -v error -y -i "$SRC" \
  -vf "delogo=x=1695:y=855:w=92:h=92,scale=${W}:-2:flags=lanczos,format=yuv420p" \
  -an -c:v libx264 -preset slow -crf 26 -g 1 -movflags +faststart "$OUT"
ffmpeg -v error -y -i "$OUT" -frames:v 1 -q:v 3 "${OUT%.mp4}.jpg"
ls -la "$OUT" "${OUT%.mp4}.jpg"
