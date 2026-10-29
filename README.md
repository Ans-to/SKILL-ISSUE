# SKILL-ISSUE — Clean Cinematic Tech-Doc (Dual Format 16:9 & 9:16)

## Bretton Woods & The Global Dollar Standard

- **Dual Format Support (`30 fps`, `1,800` frames / `60.00s`):**
  - **16:9 Landscape (`1920×1080`):** `Root`, `BrettonWoodsLandscape`, `BrettonWoodsDocumentary` → `deliverables/Bretton-Woods-Global-Dollar.mp4`
  - **9:16 Vertical Shorts (`1080×1920`):** `BrettonWoodsVertical`, `BrettonWoodsShorts` → `deliverables/Bretton-Woods-Shorts-9x16.mp4`
- **Clean Editorial Hierarchy (Zero Debug Clutter):**
  - `z = 1` (`coordinate-grid`): Deep obsidian (`#0b0f19`) canvas with subtle drifting gold (`#d4af37`) and emerald (`#10b981`) architectural grid lines (zero `#000000` static black, zero coordinate readouts or CLI logs).
  - `z = 10` (`webgl-depth`): Continuous smooth 3D isometric camera pan/drift (`getContinuousCameraRig`) over gold vault bullion, trade convergence plinths, global liquidity network nodes, and sovereign crown pedestal.
  - `z = 20` (`purposeful-visual`): Clean audio-synced thematic vector illustrations (commodity-to-dollar convergence, gold vault reserve ring & 1971 float, global UST liquidity network & safety net, power/responsibility balance & dollar crown).
  - `z = 42` (`clause-ribbon`): Natural spoken-so-far subtitle capsule (zero future-word leaks).
  - `z = 55` (`hero-kinetic-text`): Centered, high-contrast, non-colliding polymorphic kinetic titles (`"88%"`, `"GLOBAL TRADE"`, `"1944"`, `"THE PIVOT"`, `"BACKED BY GOLD"`, `"TRUST"`, `"LIQUIDITY"`, `"UNRIVALED STABILITY"`, `"THE KING OF CURRENCIES"`, `"FOR NOW..."`) with generous breathing room above stage graphics.
  - `z = 75 / 76` (`chapter-header` / `progress-rule`): Whisper-minimal chapter numeral header and 2px gold/emerald progress rule.

### Verification & Render Commands

```bash
npm run typecheck && npm run verify:sync
npx remotion render Root out/video.mp4 --props=./props.json --overwrite
npx remotion render BrettonWoodsVertical out/Bretton-Woods-Shorts-9x16.mp4 --props=./props.json --overwrite
```

Preserved compositions:
- `EngineFirstExplainer` (`1080×1920`, `30 fps`, `1,547` frames)
- `TheCodeThatReplacedAfterEffects` (`1920×1080`, `30 fps`)
