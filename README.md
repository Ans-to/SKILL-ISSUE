# The Empire of Timber & Tech

A 30-second Remotion documentary authored as a React Three Fiber scene with `@remotion/three`. The camera performs a clamped, fixed-lens Z-axis dolly toward Nokia's 1865 mill site; mill, industrial and global-network stages morph as 3D geometry, then converge on a 3D phone. The scene uses volumetric grid cages and curves rather than flat scene planes, 3D-attached glass HUDs, spring-timed actions, CSS neon drop-shadow bloom, a depth-of-field/vignette pass and 1.35× render density for sub-pixel edge smoothing.

## Preview

```sh
npm ci
npm run start
```

## Cloud render

Final MP4 rendering runs in GitHub Actions only. Pushing a branch starts **Render Nokia documentary**; the workflow uses software WebGL (`--gl=swangle`) and uploads the H.264 MP4 as a 30-day downloadable artifact. Open the workflow run's Artifacts section to download it.

## Storyboard synchronization

- **00:00–00:06** — Amber Nokia-town coordinate, Z-axis dive to the snowy mill, then paper-fibre schematic.
- **00:06–00:15** — The mill folds into a 3D industrial cage; boot enters at 00:08, copper packets at 00:10, transformer and 3D output graph at 00:13.
- **00:15–00:30** — Digital globe forms; the clamped camera pulls back at 00:18 as routes reach London, New York and Tokyo; network contracts into the phone at 00:23.

Composition: `NokiaDocumentary`, 1920×1080 at 30 fps. Main scene hierarchy: `src/NokiaDocumentary.tsx`.
