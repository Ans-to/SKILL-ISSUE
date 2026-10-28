# The Empire of Timber & Tech

A 30-second Remotion documentary built as a real 3D scene with React Three Fiber and `@remotion/three`. The camera travels through a geolocated Finland marker on the wireframe Earth, into a snowy mill diorama, laterally across a factory-scale grid, then pulls back to a Finnish-origin global signal network before the routes collapse into a 3D mobile device. Scene changes are camera travel and object transformations—not slide swaps or 2D templates. Diegetic glass HUDs are attached to 3D coordinates and animated with Remotion spring physics.

## Preview

```sh
npm ci
npm run start
```

## Cloud render

Final MP4 rendering runs in GitHub Actions only. Pushing a branch starts **Render Nokia documentary**; the workflow uses software WebGL (`--gl=swangle`) for the R3F scene and publishes the H.264 MP4 as a 30-day downloadable artifact. Open the workflow run's Artifacts section to download it.

## Storyboard sync

- **00:00–00:06** — Finland pin and true Z-axis camera dive to the timber mill; paper-fibre HUD.
- **00:06–00:15** — Mill folds into the industrial grid; boot, moving copper energy packets, transformer and spring-driven output chart.
- **00:15–00:30** — Digital globe; the 18-second camera pullback opens routes to London, New York and Tokyo; routes converge into the phone at 00:23.

Composition: `NokiaDocumentary`, 1920×1080 at 30 fps. Main 3D scene: `src/NokiaDocumentary.tsx`.
