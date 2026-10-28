# KINETIC DOCUMENTARY ENGINE & DELIVERY STANDARD — v8.0

## 1. Exact Narration Lock
- Treat the supplied narration as the source of truth. Every visible word, headline, number, and on-screen label derived from the script must match the spoken words and appear only while that word or phrase is being spoken.
- Use word-level timestamps from forced alignment or equivalent audio analysis. Preserve punctuation and transcript spelling; verify the alignment against the audio before rendering. Never use a conceptual paraphrase, generic chapter title, or future-word preview as a substitute for the active spoken words.
- Kinetic emphasis may anticipate a word only within its own aligned onset (a few frames at most); typography, graph events, and visual motifs must resolve on that word's actual duration. Respect pauses—do not advance text through silence.
- Keep the full narration at natural playback speed unless the user explicitly authorizes a change. Build a deterministic word-cue map so every render is frame-accurate and reproducible.

## 2. Procedural High-Velocity Motion System
- Completely purge prior template/chapter engines, semantic-card layouts, stale captions, and previous scene motifs when a clean rebuild is requested. Do not patch an old template into a new brief.
- Build a procedural kinetic engine: typography must scale dramatically with spring/eased motion, while live node graphs, edges, pulses, and signal paths update from the currently spoken word and the audio envelope.
- Make every motion event accountable to the current word's timestamp and/or its measured audio energy. Avoid idle decoration, unsupported claims, narrative substitutions, and visuals that contradict what is being said.
- Prefer generated geometry, vector linework, instanced nodes, and data-derived patterns over static slides, generic icon packs, and unrelated stock-like props. Keep motion deterministic under Remotion frame seeking.

## 3. Visual Language and Layer Separation
- Use deep obsidian/near-black foundations with crisp electric-lime and white accents. Maintain excellent contrast and a disciplined editorial hierarchy; use glow as a precise signal, not a haze.
- Keep kinetic titles, exact-word captions, labels, and HUD elements in an independent front-facing 2D layer. Keep the procedural 3D graphics in a separate render layer; never attach editorial text to 3D geometry or allow camera rotations to tilt text.
- Maintain a fixed perspective lens and use a bounded, true Z-axis dolly where camera motion is needed. Do not fake camera movement with FOV changes.
- Design the motion and graph grammar as one coherent engine, not a collection of disconnected chapter templates.

## 4. Audio-Driven Motion
- Derive and store a deterministic frame-level audio-energy envelope from the supplied narration/music. Use energy and momentum to modulate scale, pulse amplitude, graph propagation, particle velocity, and camera acceleration.
- Let speech pauses breathe. Preserve precise word boundaries while using high-velocity accents for stressed syllables, transitions, and cadence. Audio energy controls motion intensity; word timestamps control lexical visibility and event identity.

## 5. Local Render, Verification, and GitHub Delivery
- Render the final MP4 locally when requested, using the maximum concurrency supported by the installed Remotion version (`--concurrency=100%` where literal `max` is unsupported).
- Before publishing, typecheck; inspect representative rendered frames; verify MP4 readability, 1920×1080/target format, duration, frame rate, and audio; and confirm the final file size.
- Push source only to the active Arena branch. When the user explicitly requests that the finished MP4 be pushed directly to GitHub, add the final MP4 to the repository's deliverables area and push it to that same active branch; otherwise prefer a Release asset or Actions artifact and keep media out of Git.
- Share a working direct-download link to the published MP4. Keep temporary models, aligner downloads, decoded audio, and render scratch files out of Git.
