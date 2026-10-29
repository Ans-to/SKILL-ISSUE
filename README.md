# SKILL-ISSUE — Deterministic Motion Documentaries

## Primary Build: 16:9 YouTube Long-Form Documentary (`Root` / `BrettonWoodsDocumentary`)

- **Format & Geometry:** `1920×1080` (`16:9` YouTube landscape), `30 fps`, `1,800` frames (`60.00s` full runtime).
- **Continuous Moving Background & 3D Camera:** Unbroken 60-second Three.js geodetic world stage (`zIndex: 10`) + continuously drifting dual-scale coordinate grid (`zIndex: 1`) with smooth cubic 3D camera panning & zooming across Riyadh, Tokyo, Milan, Bretton Woods NH, Fort Knox KY, Wall Street NY, and Washington D.C. Zero `#000000` static black backgrounds and zero hard cuts between scenes (16-frame fluid spatial handoffs).
- **Decoupled Full-Canvas Z-Index Layers (`BRETTON_Z_LAYERS`):**
  - `z = 1` (`coordinate-grid`): `ContinuousAtmosphericGridPlane`
  - `z = 10` (`webgl-depth`): `ContinuousWorldThreeStage`
  - `z = 20` (`ui-background-widget`): Upper asymmetric interactive financial/geopolitical UI widget
  - `z = 30` (`terminal-box`): Opposing lower live clearing/ledger terminal box
  - `z = 36` (`atmospheric-calibration`): `GeodeticCalibrationOverlay` SVG reticle
  - `z = 42` (`clause-ribbon`): Spoken-so-far caption ribbon (zero future-word previews)
  - `z = 55` (`hero-kinetic-text`): Polymorphic hero kinetic typography (`hook-pop`, `terminal-slide`, `telemetry-flicker` strictly alternating across all 15 callouts)
  - `z = 65` (`sovereign-flash`): Regime-shift pulse vignette
  - `z = 75 / 76` (`hud-header` / `hud-footer`): Floating top geodetic telemetry bar & bottom 4-chapter progress bar
- **4-Part Bretton Woods Script:**
  1. `[0:00 – 0:10]` **THE HOOK — THE GLOBAL STANDARD** (`"88%"`, `"GLOBAL TRADE"`)
  2. `[0:10 – 0:25]` **THE ORIGIN — BRETTON WOODS & GOLD** (`"1944"`, `"THE PIVOT"`, `"BACKED BY GOLD"`)
  3. `[0:25 – 0:45]` **THE POWER ENGINE — LIQUIDITY & TRUST** (`"TRUST"`, `"LIQUIDITY"`, `"UNRIVALED STABILITY"`)
  4. `[0:45 – 1:00]` **THE CONCLUSION — THE HEAVY CROWN** (`"THE KING OF CURRENCIES"`, `"FOR NOW..."`)

### Verification & Render Commands

```bash
npm run typecheck && npm run verify:sync
npx remotion render Root out/video.mp4 --props=./props.json --overwrite
```

Preserved compositions:
- `EngineFirstExplainer` (`1080×1920`, `30 fps`, `1,547` frames)
- `TheCodeThatReplacedAfterEffects` (`1920×1080`, `30 fps`)
