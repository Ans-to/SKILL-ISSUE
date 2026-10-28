# The Empire of Timber & Tech

A 30-second, 1920×1080 Remotion documentary short about Nokia's rise from a Finnish timber mill to a global mobile technology company. Its visuals use an animated macro-to-micro Finland dive, isometric mill, industrial product and power-grid studies, and a global signal network resolving into a mobile-device schematic. Narration is included as three generated audio clips, aligned to the script's 00:00, 00:06 and 00:15 scene boundaries.

## Run the preview

```sh
npm ci
npm run start
```

## Cloud render (required)

This repository intentionally does not render the final MP4 locally. Pushing to any branch runs **Render Nokia documentary** in GitHub Actions; `workflow_dispatch` can also start it manually. The job renders an H.264 MP4 and uploads it as the downloadable artifact `nokia-documentary-<commit-sha>` (retained for 30 days). Open the workflow run in the GitHub Actions tab and download its artifact.

## Timeline

- **00:00–00:06** — 1865 Finland: globe dive into the forest mill; paper HUD.
- **00:06–00:15** — Industrial pivot: rubber boot, copper cable paths and Finland's electrification.
- **00:15–00:30** — Global pullback, Finland-originating city connections, radar sweep and phone schematic.

Composition: `NokiaDocumentary`, 30 fps, 900 frames. Main animation: `src/NokiaDocumentary.tsx`.
