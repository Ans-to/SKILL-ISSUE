# SKILL-ISSUE — "THE CINEMATIC ENGINE" (`CinematicSceneMaster`)

## Bretton Woods & The Global Dollar Standard (Dual Format 16:9 & 9:16)

- **Drop-In Master Engine (`src/bretton-woods/CinematicSceneMaster.tsx`):**
  - Locks in decoupled `position: "absolute"` layers, smooth continuous 3D camera zoom (`1 → 1.08`), perspective-foreshortened CSS 3D isometric floor grid (`perspective(1100px) rotateX(60deg) rotateZ(-45deg)`), soft radial ambient lighting glow (`blur(60px)`), spring-driven staggered hero typography, and frosted glassmorphic data/visual cards (`backdropFilter: blur(24px)`).
  - Supports both standalone usage (`<CinematicSceneMaster title="..." subtitle="..." metric="..." metricLabel="..." />`) and full multi-scene documentary assembly (`BrettonWoodsDocumentary`).
- **Dual Format Support (`30 fps`, `1,800` frames / `60.00s`):**
  - **16:9 Landscape (`1920×1080`):** `Root`, `BrettonWoodsLandscape`, `BrettonWoodsDocumentary`, `CinematicSceneMaster` → `deliverables/Bretton-Woods-Global-Dollar.mp4`
  - **9:16 Vertical Shorts (`1080×1920`):** `BrettonWoodsVertical`, `BrettonWoodsShorts` → `deliverables/Bretton-Woods-Shorts-9x16.mp4`

### Verification & Render Commands

```bash
npm run typecheck && npm run verify:sync
npx remotion render Root out/video.mp4 --props=./props.json --overwrite
npx remotion render BrettonWoodsVertical out/Bretton-Woods-Shorts-9x16.mp4 --props=./props.json --overwrite
```

Preserved compositions:
- `EngineFirstExplainer` (`1080×1920`, `30 fps`, `1,547` frames)
- `TheCodeThatReplacedAfterEffects` (`1920×1080`, `30 fps`)
