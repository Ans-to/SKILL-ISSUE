# Nokia: From Material to Network

A short Remotion documentary built around a concept-first reading of Nokia's story: **origin → material → reinvention → network → personal device**. It uses semantic anchors extracted from the narration rather than a phrase-by-phrase caption grid. Motion energy comes from a deterministic RMS envelope derived from all three supplied narration tracks.

## Preview and validation

```sh
npm ci
npm run typecheck
npm run start
```

The Remotion composition is `NokiaDocumentary` (1920×1080, 30 fps, 932 frames, approximately 31.1 seconds). Narration uses the complete source tracks at their original playback speed. `src/cinema/World.tsx` contains the Three.js/R3F spatial world; `src/cinema/EditorialLayer.tsx` is a separate, front-facing 2D typography/HUD layer. The camera keeps a fixed perspective lens and uses a clamped semantic dolly.

## Audio analysis and local render

Regenerate the frame-level audio-energy map after changing the narration:

```sh
python3 scripts/derive-audio-envelope.py
```

Render the final H.264 MP4 locally at maximum Remotion concurrency:

```sh
npm run render
```

A local Chromium/Chrome installation is required. If Remotion cannot find the browser automatically, pass its executable path:

```sh
npm run render -- --browser-executable=/path/to/chromium
```

The MP4 is written to `out/Nokia-Documentary.mp4`; generated media stays out of Git and is published separately as a GitHub Release asset.
