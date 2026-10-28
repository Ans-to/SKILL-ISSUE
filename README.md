# The Empire of Timber & Tech

A 30-second Remotion documentary about Nokia, authored as a separated 3D world and 2D editorial layer. `src/NokiaRebuilt.tsx` owns the scene: a fixed-camera Three.js canvas renders the globe with neon coordinate rings and vector nodes, the Finnish timber mill, industrial artifacts, network routes, and a detailed phone. Soft cast shadows and floating dust add depth; custom SVG schematics, radar sweeps, and frosted-glass HUD panels stay in the DOM/CSS overlay at z-index 10. Editorial text is never placed in 3D or rotated with the camera.

## Preview

```sh
npm ci
npm run start
```

## Cloud render

Final MP4 rendering runs in GitHub Actions only. Pushing a branch starts **Render Nokia documentary**. The workflow caches npm packages and Remotion's browser, clears the output file before rendering, uses all available CPU cores, and uploads the H.264 MP4 as a downloadable 30-day artifact. Open the workflow run's Artifacts section to download it.

## Storyboard synchronization

- **00:00–00:06** — Finland and Nokia's 1865 timber mill, with snowy forest and paper-making details.
- **00:06–00:15** — Industrial evolution: rubber boots, cables, electricity and output growth.
- **00:15–00:30** — Finland's global network reaches London, New York and Tokyo, then resolves into a 3D mobile phone.

The scene captions and supplied voiceover tracks remain synchronized to the 900-frame, 1920×1080, 30 fps composition. The Remotion composition ID is `NokiaDocumentary`.
