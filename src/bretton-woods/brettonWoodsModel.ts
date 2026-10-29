import {Easing, interpolate} from 'remotion';
import audioEnvelopeJson from './bretton-woods-audio-envelope.json';
import frameCuesJson from './bretton-woods-frame-cues.json';
import wordCuesJson from './bretton-woods-word-cues.json';

export const BW_WIDTH = 1920;
export const BW_HEIGHT = 1080;
export const BW_FPS = 30;
export const BW_DURATION_FRAMES = 1800; // Full 60.00-second YouTube 16:9 runtime
export const BW_TRANSITION_OVERLAP_FRAMES = 16;

// Deep editorial dark palette — strictly zero #000000 static black anywhere.
export const BW_NAVY_DEEP = '#0b1222';
export const BW_NAVY_MID = '#101b33';
export const BW_SLATE_SURFACE = 'rgba(13, 22, 40, 0.80)';
export const BW_ORANGE = '#ff4500';
export const BW_GOLD = '#f59e0b';
export const BW_CYAN = '#38bdf8';
export const BW_EMERALD = '#10b981';
export const BW_CRIMSON = '#e11d48';
export const BW_WHITE = '#f8fafc';
export const BW_MUTED = '#94a3b8';

/**
 * Decoupled 1920x1080 Z-index elevation map.
 * Every visual plane mounts directly onto `<AbsoluteFill>` as an independent
 * `position: 'absolute'` layer with zero single-board grouping wrapper.
 */
export const BRETTON_Z_LAYERS = {
  coordinateGrid: 1,
  webglDepth: 10,
  uiBackgroundWidget: 20,
  terminalBox: 30,
  atmosphericCalibration: 36,
  clauseRibbon: 42,
  heroKineticText: 55,
  sovereignFlash: 65,
  hudHeader: 75,
  hudFooter: 76,
} as const;

export type BrettonSceneId =
  | 'global-standard'
  | 'bretton-woods-origin'
  | 'liquidity-power-engine'
  | 'heavy-crown-conclusion';

export type BrettonSceneSpec = {
  index: number;
  id: BrettonSceneId;
  code: string;
  label: string;
  chapterWindow: string;
  nominalFrom: number;
  nominalEnd: number;
  sequenceFrom: number;
  sequenceDuration: number;
  accentColor: string;
  secondaryColor: string;
  firstWordIndex: number;
  lastWordIndex: number;
};

export const BW_SCENES: readonly BrettonSceneSpec[] = [
  {
    index: 0,
    id: 'global-standard',
    code: '01 // GLOBAL_STANDARD',
    label: 'THE HOOK — THE GLOBAL STANDARD',
    chapterWindow: '00:00 – 00:10',
    nominalFrom: 0,
    nominalEnd: 300,
    sequenceFrom: 0,
    sequenceDuration: 308, // 8-frame fluid spatial handoff overlap across 0:10
    accentColor: BW_ORANGE,
    secondaryColor: BW_CYAN,
    firstWordIndex: 0,
    lastWordIndex: 21,
  },
  {
    index: 1,
    id: 'bretton-woods-origin',
    code: '02 // BRETTON_WOODS_1944',
    label: 'THE ORIGIN — BRETTON WOODS & GOLD',
    chapterWindow: '00:10 – 00:25',
    nominalFrom: 300,
    nominalEnd: 750,
    sequenceFrom: 292,
    sequenceDuration: 466, // 292..758 fluid spatial handoff across 0:10 and 0:25
    accentColor: BW_GOLD,
    secondaryColor: BW_ORANGE,
    firstWordIndex: 22,
    lastWordIndex: 54,
  },
  {
    index: 2,
    id: 'liquidity-power-engine',
    code: '03 // LIQUIDITY_ENGINE',
    label: 'THE POWER ENGINE — LIQUIDITY & TRUST',
    chapterWindow: '00:25 – 00:45',
    nominalFrom: 750,
    nominalEnd: 1350,
    sequenceFrom: 742,
    sequenceDuration: 616, // 742..1358 fluid spatial handoff across 0:25 and 0:45
    accentColor: BW_CYAN,
    secondaryColor: BW_EMERALD,
    firstWordIndex: 55,
    lastWordIndex: 86,
  },
  {
    index: 3,
    id: 'heavy-crown-conclusion',
    code: '04 // THE_HEAVY_CROWN',
    label: 'THE CONCLUSION — THE HEAVY CROWN',
    chapterWindow: '00:45 – 01:00',
    nominalFrom: 1350,
    nominalEnd: 1800,
    sequenceFrom: 1342,
    sequenceDuration: 458, // 1342..1800 fluid spatial arrival & orbital conclusion
    accentColor: BW_ORANGE,
    secondaryColor: BW_GOLD,
    firstWordIndex: 87,
    lastWordIndex: 107,
  },
] as const;

export type BrettonScriptCue = {
  globalIndex: number;
  sceneIndex: number;
  sceneId: BrettonSceneId;
  text: string;
  normalized: string;
  start: number;
  end: number;
  startFrame: number;
  endFrame: number;
};

export const bwNormalize = (raw: string): string =>
  raw
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9'-]+/g, '');

const rawWords = wordCuesJson.tracks[0].words;
const startFrames = frameCuesJson.startFrames;
const endFrames = frameCuesJson.endFrames;

export const BW_SCRIPT_CUES: readonly BrettonScriptCue[] = rawWords.map((w, idx) => ({
  globalIndex: idx,
  sceneIndex: w.sceneIndex,
  sceneId: w.sceneId as BrettonSceneId,
  text: w.text,
  normalized: bwNormalize(w.text),
  start: w.start,
  end: w.end,
  startFrame: startFrames[idx],
  endFrame: endFrames[idx],
}));

export const BW_AUDIO_ENVELOPE: readonly number[] = audioEnvelopeJson.frames;

export const bwEnergyAt = (globalFrame: number): number => {
  const idx = Math.max(0, Math.min(BW_DURATION_FRAMES - 1, Math.floor(globalFrame)));
  return BW_AUDIO_ENVELOPE[idx] ?? 0;
};

export const bwSceneForFrame = (globalFrame: number): BrettonSceneSpec => {
  const clamped = Math.max(0, Math.min(BW_DURATION_FRAMES - 1, globalFrame));
  for (const scene of BW_SCENES) {
    if (clamped >= scene.nominalFrom && clamped < scene.nominalEnd) {
      return scene;
    }
  }
  return BW_SCENES[BW_SCENES.length - 1];
};

export const bwFindCue = (globalFrame: number): BrettonScriptCue | null => {
  if (!Number.isInteger(globalFrame) || globalFrame < 0 || globalFrame >= BW_DURATION_FRAMES) {
    return null;
  }
  for (const cue of BW_SCRIPT_CUES) {
    if (cue.startFrame <= globalFrame && globalFrame < cue.endFrame) {
      return cue;
    }
  }
  return null;
};

export const bwSceneSpokenCues = (
  scene: BrettonSceneSpec,
  globalFrame: number,
): BrettonScriptCue[] => {
  const clamped = Math.floor(globalFrame);
  if (clamped < scene.nominalFrom) return [];
  return BW_SCRIPT_CUES.filter(
    (c) =>
      c.sceneIndex === scene.index &&
      c.startFrame <= clamped,
  );
};

/**
 * Computes fluid spatial scene transition envelope (zero hard cuts).
 * Foreground layers glide along the 3D camera velocity vector during scene handoffs.
 */
export type SpatialSceneEnvelope = {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
};

export const computeSpatialSceneEnvelope = (
  scene: BrettonSceneSpec,
  localFrame: number,
): SpatialSceneEnvelope => {
  const enterFrames = scene.index === 0 ? 14 : BW_TRANSITION_OVERLAP_FRAMES;
  const exitFrames = scene.index === BW_SCENES.length - 1 ? 14 : BW_TRANSITION_OVERLAP_FRAMES;

  // Direction vectors match the 3D geodetic camera glide at 0:10, 0:25, and 0:45
  const enterOffsets: readonly [number, number][] = [
    [0, 18],      // Scene 1: gentle rise into Riyadh corridor
    [-84, -14],   // Scene 2: transatlantic westward glide into Bretton Woods NH
    [68, 26],     // Scene 3: coastal dive southward into Wall Street / NY Fed
    [-56, -24],   // Scene 4: orbital ascent over Washington D.C. & global crown
  ];
  const exitOffsets: readonly [number, number][] = [
    [84, 14],     // Scene 1 drifts east as camera sweeps west to New Hampshire
    [-68, -26],   // Scene 2 drifts north-west as camera dives into Wall Street
    [56, 24],     // Scene 3 recedes below as camera ascends to orbital crown
    [0, -10],     // Scene 4 subtle horizon hold at 1:00
  ];

  const [inX, inY] = enterOffsets[scene.index];
  const [outX, outY] = exitOffsets[scene.index];

  const enterP = interpolate(localFrame, [0, enterFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  // On final scene, keep visible right up to 1:00 with a subtle finish settle rather than fading to black!
  const exitP =
    scene.index === BW_SCENES.length - 1
      ? 1
      : interpolate(
          localFrame,
          [scene.sequenceDuration - exitFrames, scene.sequenceDuration],
          [1, 0],
          {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.inOut(Easing.cubic),
          },
        );

  const opacity = Number((enterP * exitP).toFixed(4));
  const translateX = (1 - enterP) * inX + (1 - exitP) * outX;
  const translateY = (1 - enterP) * inY + (1 - exitP) * outY;
  const scale = 0.965 + 0.035 * enterP - 0.02 * (1 - exitP);

  return {opacity, translateX, translateY, scale};
};

export type GeodeticWaypoint = {
  frame: number;
  camX: number;
  camY: number;
  camZ: number;
  lookX: number;
  lookY: number;
  lookZ: number;
  fov: number;
  lat: number;
  lon: number;
  hubCode: string;
};

/**
 * Continuous 1,800-frame 3D Geodetic Camera Trajectory.
 * Smoothly pans and zooms across real world hubs with zero static holds and zero hard cuts:
 * Saudi Arabia -> Tokyo -> Italy -> Global Trade Macro -> Bretton Woods NH -> Fort Knox KY
 * -> Wall Street NY -> US Treasury Sovereign Lattice -> Washington D.C. Orbital Crown.
 */
export const BW_CAMERA_WAYPOINTS: readonly GeodeticWaypoint[] = [
  {
    frame: 0,
    camX: 0.9,
    camY: 2.35,
    camZ: 8.8,
    lookX: 1.5,
    lookY: -0.35,
    lookZ: -0.4,
    fov: 44,
    lat: 20.0,
    lon: 28.0,
    hubCode: 'GLOBAL_FX_CORRIDOR',
  },
  {
    frame: 68, // "Saudi Arabia" (F0052-F0083)
    camX: 2.35,
    camY: 1.25,
    camZ: 5.55,
    lookX: 2.15,
    lookY: -0.55,
    lookZ: -0.25,
    fov: 40,
    lat: 24.71,
    lon: 46.67,
    hubCode: 'RIYADH // PETRODOLLAR_HUB',
  },
  {
    frame: 120, // "Tokyo" (F0110-F0129)
    camX: 5.15,
    camY: 1.48,
    camZ: 5.35,
    lookX: 4.85,
    lookY: -0.35,
    lookZ: -0.45,
    fov: 39,
    lat: 35.68,
    lon: 139.69,
    hubCode: 'TOKYO // JPY_USD_SPOT',
  },
  {
    frame: 165, // "Italy..." (F0155-F0170)
    camX: 0.72,
    camY: 1.38,
    camZ: 5.45,
    lookX: 0.62,
    lookY: -0.38,
    lookZ: -0.35,
    fov: 40,
    lat: 45.46,
    lon: 9.19,
    hubCode: 'MILAN // EUR_USD_SETTLEMENT',
  },
  {
    frame: 255, // "one currency" / "88% GLOBAL TRADE" (F0191-F0298)
    camX: -0.35,
    camY: 2.65,
    camZ: 9.25,
    lookX: 0.15,
    lookY: -0.30,
    lookZ: -0.55,
    fov: 45,
    lat: 34.05,
    lon: -18.4,
    hubCode: 'BIS_GLOBAL_TRADE // 88%_USD',
  },
  {
    frame: 385, // Fluid 0:10 transatlantic glide -> "1944, at Bretton Woods" (F0331-F0406)
    camX: -2.75,
    camY: 1.42,
    camZ: 5.75,
    lookX: -2.65,
    lookY: -0.36,
    lookZ: -0.42,
    fov: 40,
    lat: 44.25,
    lon: -71.44,
    hubCode: 'BRETTON_WOODS_NH // 1944_ACCORD',
  },
  {
    frame: 565, // "America held most of the world's gold" (F0531-F0602)
    camX: -3.48,
    camY: 1.28,
    camZ: 5.30,
    lookX: -3.28,
    lookY: -0.48,
    lookZ: -0.32,
    fov: 39,
    lat: 37.88,
    lon: -85.96,
    hubCode: 'FORT_KNOX_KY // GOLD_BULLION_VAULT',
  },
  {
    frame: 710, // "Even when we left the gold standard, the world stayed" (F0635-F0731)
    camX: -2.15,
    camY: 2.15,
    camZ: 7.55,
    lookX: -2.35,
    lookY: -0.38,
    lookZ: -0.45,
    fov: 43,
    lat: 40.12,
    lon: -76.50,
    hubCode: 'POST_1971_FIAT_NETWORK // USD_PEG_HELD',
  },
  {
    frame: 890, // Fluid 0:25 glide -> "trust, liquidity, and depth" (F0768-F0901)
    camX: -2.92,
    camY: 1.35,
    camZ: 5.20,
    lookX: -2.78,
    lookY: -0.32,
    lookZ: -0.38,
    fov: 39,
    lat: 40.71,
    lon: -74.01,
    hubCode: 'NEW_YORK_FED // LIQUIDITY_ENGINE',
  },
  {
    frame: 1120, // "US financial markets... massive and stable" (F0981-F1150)
    camX: -1.85,
    camY: 1.92,
    camZ: 6.85,
    lookX: -2.35,
    lookY: -0.25,
    lookZ: -0.45,
    fov: 42,
    lat: 40.75,
    lon: -73.98,
    hubCode: 'US_CAPITAL_MARKETS // $27T_DEPTH',
  },
  {
    frame: 1315, // "trillions in US Treasury bonds as their ultimate safety net" (F1164-F1348)
    camX: -0.95,
    camY: 2.38,
    camZ: 8.10,
    lookX: -1.65,
    lookY: -0.28,
    lookZ: -0.50,
    fov: 44,
    lat: 39.40,
    lon: -75.60,
    hubCode: 'SOVEREIGN_UST_RESERVES // AAA_SAFETY_NET',
  },
  {
    frame: 1515, // Fluid 0:45 ascent -> "America immense economic power & responsibility" (F1371-F1529)
    camX: -1.55,
    camY: 2.05,
    camZ: 7.35,
    lookX: -2.15,
    lookY: -0.34,
    lookZ: -0.40,
    fov: 42,
    lat: 38.89,
    lon: -77.03,
    hubCode: 'WASHINGTON_DC // MONETARY_SOVEREIGNTY',
  },
  {
    frame: 1685, // "THE KING OF CURRENCIES" -> "for now, the greenback holds the crown"
    camX: -0.25,
    camY: 2.95,
    camZ: 9.85,
    lookX: -0.35,
    lookY: -0.25,
    lookZ: -0.55,
    fov: 45,
    lat: 28.50,
    lon: -34.00,
    hubCode: 'GLOBAL_RESERVE_CROWN // USD_DOMINANCE',
  },
  {
    frame: 1800, // Continuous orbital drift right through 1:00 (never stops!)
    camX: 0.65,
    camY: 3.18,
    camZ: 10.45,
    lookX: 0.10,
    lookY: -0.22,
    lookZ: -0.60,
    fov: 46,
    lat: 25.10,
    lon: -12.00,
    hubCode: 'USD_RESERVE_STANDARD // HORIZON_OPEN',
  },
];

export type ContinuousCameraState = {
  camX: number;
  camY: number;
  camZ: number;
  lookX: number;
  lookY: number;
  lookZ: number;
  fov: number;
  lat: number;
  lon: number;
  hubCode: string;
  gridDriftX: number;
  gridDriftY: number;
  gridScale: number;
  goldWeight: number;
  treasuryWeight: number;
  crownWeight: number;
  regimeShockPulse: number;
};

export const getContinuousCameraRig = (globalFrame: number): ContinuousCameraState => {
  const f = Math.max(0, Math.min(BW_DURATION_FRAMES, globalFrame));

  let segIdx = 0;
  for (let i = 0; i < BW_CAMERA_WAYPOINTS.length - 1; i += 1) {
    if (f >= BW_CAMERA_WAYPOINTS[i].frame && f <= BW_CAMERA_WAYPOINTS[i + 1].frame) {
      segIdx = i;
      break;
    }
  }
  const a = BW_CAMERA_WAYPOINTS[segIdx];
  const b = BW_CAMERA_WAYPOINTS[segIdx + 1];
  const rawT = b.frame === a.frame ? 1 : (f - a.frame) / (b.frame - a.frame);
  const easedT = Easing.inOut(Easing.cubic)(Math.max(0, Math.min(1, rawT)));

  // Continuous trigonometric micro-orbit guarantees zero frozen frames even near waypoint inflections
  const orbitX = Math.sin(f * 0.024) * 0.14 + Math.cos(f * 0.011) * 0.06;
  const orbitY = Math.cos(f * 0.019) * 0.08;
  const orbitZ = Math.sin(f * 0.017) * 0.16;

  const camX = a.camX + (b.camX - a.camX) * easedT + orbitX;
  const camY = a.camY + (b.camY - a.camY) * easedT + orbitY;
  const camZ = a.camZ + (b.camZ - a.camZ) * easedT + orbitZ;
  const lookX = a.lookX + (b.lookX - a.lookX) * easedT + orbitX * 0.35;
  const lookY = a.lookY + (b.lookY - a.lookY) * easedT + orbitY * 0.25;
  const lookZ = a.lookZ + (b.lookZ - a.lookZ) * easedT;
  const fov = a.fov + (b.fov - a.fov) * easedT;
  const lat = a.lat + (b.lat - a.lat) * easedT;
  const lon = a.lon + (b.lon - a.lon) * easedT;
  const hubCode = rawT < 0.5 ? a.hubCode : b.hubCode;

  // Continuous 2D geodetic background grid drift & zoom coupled to 3D camera + constant drift
  const gridDriftX = -camX * 68 - f * 0.65;
  const gridDriftY = camY * 46 - f * 0.28;
  const gridScale = interpolate(camZ, [5.0, 10.6], [1.16, 0.94], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Smooth 3D landmark weights across scenes (zero abrupt pop-in/out)
  const goldWeight =
    interpolate(f, [285, 345], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) *
    interpolate(f, [725, 780], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const treasuryWeight =
    interpolate(f, [735, 800], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) *
    interpolate(f, [1330, 1385], [1, 0.22], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const crownWeight = interpolate(f, [1335, 1410], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtle dramatic pulse on "war-torn" (F0412), "left the gold standard" (F0653), "hate" (F1616)
  const shockCenters = [418, 660, 1618];
  let regimeShockPulse = 0;
  for (const center of shockCenters) {
    const dist = Math.abs(f - center);
    if (dist < 18) {
      regimeShockPulse = Math.max(regimeShockPulse, Math.cos((dist / 18) * (Math.PI / 2)) * 0.42);
    }
  }

  return {
    camX,
    camY,
    camZ,
    lookX,
    lookY,
    lookZ,
    fov,
    lat,
    lon,
    hubCode,
    gridDriftX,
    gridDriftY,
    gridScale,
    goldWeight,
    treasuryWeight,
    crownWeight,
    regimeShockPulse,
  };
};
