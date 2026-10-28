# Nokia: Word-Synced Kinetic Film

A 31-second Remotion documentary whose typography and procedural graphics are synchronized to word-level timestamps aligned from the supplied narration. The active spoken word drives oversized kinetic type, a live-updating node graph, motif transitions, and a measured audio-energy response. Every word cue is frame-seekable and deterministic.

## Engine layout

- `src/kinetic/word-cues.json` — verified per-word timestamps and spoken transcript for all three audio tracks.
- `src/kinetic/timing.ts` — maps word times to composition frames and tracks active/paused narration.
- `src/kinetic/KineticLayer.tsx` — giant exact-word typography and 2D node graph, independent of the 3D camera.
- `src/kinetic/ProceduralWorld.tsx` — procedural Three.js graph/motifs and fixed-lens, clamped Z dolly.
- `src/kinetic/audio-envelope.json` — deterministic RMS energy samples used to modulate motion intensity.

The composition is `NokiaDocumentary`, 1920×1080, 30 fps, 932 frames. The original narration speed is preserved. Only the currently spoken word and already-spoken transcript context are shown; future words are never revealed early. All editorial text remains in the independent 2D layer.

## Preview, align, and render

```sh
npm ci
npm run typecheck
npm run verify:sync
npm run start
```

To regenerate word-level cues after replacing narration, install `faster-whisper` and supply a local CTranslate2 Whisper model:

```sh
python3 scripts/align-narration.py --model-dir /path/to/whisper-model
```

Rebuild the frame-level RMS envelope after replacing audio:

```sh
python3 scripts/derive-audio-envelope.py
```

Render locally with maximum Remotion concurrency:

```sh
npm run render
```

If needed, pass a local Chromium executable with `npm run render -- --browser-executable=/path/to/chromium`. The encoded MP4 is written to `out/Nokia-Documentary.mp4`; the requested GitHub deliverable is `deliverables/Nokia-Documentary.mp4`.
