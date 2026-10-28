# The Empire of Timber & Tech

A 30-second Remotion documentary about Nokia, rebuilt around a new asymmetrical editorial system. `src/NokiaEditorialFilm.tsx` composes a smoothly-dollied Three.js world from `src/film/World.tsx` and a fully separate DOM/CSS layout from `src/film/Editorial.tsx`. The 3D world moves from Finland's globe to the timber mill, industrial shift, network routes and phone; the 2D overlay carries stark chapter typography, spring-timed narration, floating glass data callouts and technical SVG diagrams. Text never enters or rotates with the 3D scene.

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
