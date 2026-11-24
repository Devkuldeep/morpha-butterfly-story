# Morpha — The Art of Becoming

A scroll-driven landing page for a butterfly garden. One continuous AI-generated video runs behind the whole page — chrysalis → emergence → flight → orchid — and scrolling scrubs it frame by frame, forwards and backwards. GSAP ScrollTrigger pins each section while its scene plays.

**Live:** https://devkuldeep.github.io/morpha-butterfly-story/

## Stack
- Plain HTML / CSS / JS, no build step
- [GSAP](https://gsap.com/) + ScrollTrigger for pinning and text reveals
- [Lenis](https://github.com/darkroomengineering/lenis) for smooth scrolling

## How the video scrubbing works
- `assets/video/morpha-story.mp4` is encoded with every frame as a keyframe (`-g 1`), so seeking to any point is instant.
- The page loads the clip into a blob URL first, so it can seek on any static host.
- `js/main.js` maps each section's scroll range to a time window in the video (`STORY`); the scroll between sections plays the transitions baked into the clip.

## Run locally
```bash
python3 -m http.server 5173
# open http://127.0.0.1:5173
```

## Rebuild the video
`tools/build-story-video.sh` re-encodes the 1080p source clip (not included in the repo) into `assets/video/morpha-story.mp4`.
