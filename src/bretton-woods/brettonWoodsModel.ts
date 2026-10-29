import {Easing, interpolate} from 'remotion';
import audioEnvelopeJson from './bretton-woods-audio-envelope.json';
import frameCuesJson from './bretton-woods-frame-cues.json';
import wordCuesJson from './bretton-woods-word-cues.json';

export const BW_WIDTH = 1920;
export const BW_HEIGHT = 1080;
export const BW_VERTICAL_WIDTH = 1080;
export const BW_VERTICAL_HEIGHT = 1920;
export const BW_FPS = 30;
export const BW_DURATION_FRAMES = 1800; // Full 60.00-second runtime
export const BW_TRANSITION_OVERLAP_FRAMES = 24; // Gentle 0.8s smooth easing between scenes

// Clean Cinematic Tech-Doc Palette — Deep Obsidian (#0b0f19) + Sovereign Gold + Dollar Emerald
// Strictly zero #000000 static black backgrounds and zero hacker-terminal clutter.
export const BW_OBSIDIAN = '#0b0f19';
export const BW_OBSIDIAN_ELEVATED = '#101726';
export const BW_GOLD = '#d4af37';
export const BW_GOLD_BRIGHT = '#f5c451';
export const BW_EMERALD = '#10b981';
export const BW_EMERALD_SOFT = '#34d399';
export const BW_WHITE = '#f8fafc';
export const BW_SILVER = '#cbd5e1';
export const BW_MUTED = '#64748b';

// Backward-compatible export alias
export const BW_NAVY_DEEP = BW_OBSIDIAN;
export const BW_ORANGE = BW_GOLD_BRIGHT;
export const BW_CYAN = BW_EMERALD_SOFT;

/**
 * Clean decoupled Z-index elevation stack across both 16:9 and 9:16 canvases.
 */
export const BRETTON_Z_LAYERS = {
  coordinateGrid: 1,
  webglDepth: 10,
  purposefulVisual: 20,
  spokenSubtitle: 42,
  heroKineticText: 55,
  chapterHeader: 75,
  progressRule: 76,
} as const;

export type BrettonLayoutMetrics = {
  width: number;
  height: number;
  isVertical: boolean;
  scale: number;
  chapterTop: number;
  heroTop: number;
  heroLeft: number;
  heroWidth: number;
  statFontSize: number;
  titleFontSize: number;
  longTitleFontSize: number;
  kickerFontSize: number;
  sublineFontSize: number;
  visualTop: number;
  visualLeft: number;
  visualWidth: number;
  visualHeight: number;
  captionBottom: number;
  captionHorizontalPad: number;
  captionFontSize: number;
  progressBottom: number;
  progressHorizontalPad: number;
  cameraLookYOffset: number;
  cameraFovOffset: number;
  cameraDistanceScale: number;
};

export const getBrettonLayout = (
  width: number,
  height: number,
): BrettonLayoutMetrics => {
  const isVertical = height > width;

  if (isVertical) {
    const s = width / 1080;
    return {
      width,
      height,
      isVertical: true,
      scale: s,
      chapterTop: Math.round(78 * s),
      heroTop: Math.round(238 * s),
      heroLeft: Math.round(64 * s),
      heroWidth: Math.round(width - 128 * s),
      statFontSize: Math.round(134 * s),
      titleFontSize: Math.round(78 * s),
      longTitleFontSize: Math.round(60 * s),
      kickerFontSize: Math.round(13 * s),
      sublineFontSize: Math.round(18 * s),
      visualTop: Math.round(740 * s),
      visualLeft: Math.round(80 * s),
      visualWidth: Math.round(width - 160 * s),
      visualHeight: Math.round(680 * s),
      captionBottom: Math.round(136 * s),
      captionHorizontalPad: Math.round(76 * s),
      captionFontSize: Math.round(22 * s),
      progressBottom: Math.round(68 * s),
      progressHorizontalPad: Math.round(76 * s),
      cameraLookYOffset: 1.18,
      cameraFovOffset: 7,
      cameraDistanceScale: 1.18,
    };
  }

  const s = width / 1920;
  const visualWidth = Math.round(1040 * s);
  return {
    width,
    height,
    isVertical: false,
    scale: s,
    chapterTop: Math.round(38 * s),
    heroTop: Math.round(126 * s),
    heroLeft: Math.round(160 * s),
    heroWidth: Math.round(width - 320 * s),
    statFontSize: Math.round(138 * s),
    titleFontSize: Math.round(92 * s),
    longTitleFontSize: Math.round(72 * s),
    kickerFontSize: Math.round(13 * s),
    sublineFontSize: Math.round(18 * s),
    visualTop: Math.round(456 * s),
    visualLeft: Math.round((width - visualWidth) / 2),
    visualWidth,
    visualHeight: Math.round(430 * s),
    captionBottom: Math.round(58 * s),
    captionHorizontalPad: Math.round(240 * s),
    captionFontSize: Math.round(21 * s),
    progressBottom: Math.round(26 * s),
    progressHorizontalPad: Math.round(120 * s),
    cameraLookYOffset: 0.68,
    cameraFovOffset: 0,
    cameraDistanceScale: 1.1,
  };
};

export type BrettonSceneId =
  | 'global-standard'
  | 'bretton-woods-origin'
  | 'liquidity-power-engine'
  | 'heavy-crown-conclusion';

export type BrettonSceneSpec = {
  index: number;
  id: BrettonSceneId;
  roman: string;
  label: string;
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
    roman: 'I',
    label: 'THE GLOBAL STANDARD',
    nominalFrom: 0,
    nominalEnd: 300,
    sequenceFrom: 0,
    sequenceDuration: 312,
    accentColor: BW_EMERALD_SOFT,
    secondaryColor: BW_GOLD,
    firstWordIndex: 0,
    lastWordIndex: 21,
  },
  {
    index: 1,
    id: 'bretton-woods-origin',
    roman: 'II',
    label: 'BRETTON WOODS · 1944',
    nominalFrom: 300,
    nominalEnd: 750,
    sequenceFrom: 288,
    sequenceDuration: 474,
    accentColor: BW_GOLD_BRIGHT,
    secondaryColor: BW_GOLD,
    firstWordIndex: 22,
    lastWordIndex: 54,
  },
  {
    index: 2,
    id: 'liquidity-power-engine',
    roman: 'III',
    label: 'LIQUIDITY & TRUST',
    nominalFrom: 750,
    nominalEnd: 1350,
    sequenceFrom: 738,
    sequenceDuration: 624,
    accentColor: BW_EMERALD_SOFT,
    secondaryColor: BW_GOLD_BRIGHT,
    firstWordIndex: 55,
    lastWordIndex: 86,
  },
  {
    index: 3,
    id: 'heavy-crown-conclusion',
    roman: 'IV',
    label: 'THE HEAVY CROWN',
    nominalFrom: 1350,
    nominalEnd: 1800,
    sequenceFrom: 1338,
    sequenceDuration: 462,
    accentColor: BW_GOLD_BRIGHT,
    secondaryColor: BW_EMERALD,
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

export type SpatialSceneEnvelope = {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
};

/**
 * Gentle, unhurried cubic easing between scenes (zero hard cuts).
 */
export const computeSpatialSceneEnvelope = (
  scene: BrettonSceneSpec,
  localFrame: number,
): SpatialSceneEnvelope => {
  const enterFrames = BW_TRANSITION_OVERLAP_FRAMES;
  const exitFrames = BW_TRANSITION_OVERLAP_FRAMES;

  const enterP = interpolate(localFrame, [0, enterFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.sin),
  });

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
            easing: Easing.inOut(Easing.sin),
          },
        );

  const opacity = Number((enterP * exitP).toFixed(4));
  const translateX = (1 - enterP) * -36 + (1 - exitP) * 36;
  const translateY = (1 - enterP) * 14 - (1 - exitP) * 14;
  const scale = 0.98 + 0.02 * enterP - 0.015 * (1 - exitP);

  return {opacity, translateX, translateY, scale};
};

type IsometricKeyframe = {
  frame: number;
  camX: number;
  camY: number;
  camZ: number;
  lookX: number;
  lookY: number;
  lookZ: number;
  fov: number;
};

/**
 * Smooth, continuous 3D isometric camera pan/drift across the 60-second film.
 * Elevated telephoto isometric perspective keeps all 3D geometry cleanly in the
 * lower architectural plane so hero typography above never collides with graphics.
 */
const ISOMETRIC_CAMERA_KEYFRAMES: readonly IsometricKeyframe[] = [
  {frame: 0, camX: -2.4, camY: 4.35, camZ: 8.6, lookX: -0.6, lookY: 0.0, lookZ: 0.0, fov: 28},
  {frame: 150, camX: 0.4, camY: 4.15, camZ: 8.1, lookX: 0.15, lookY: 0.0, lookZ: 0.0, fov: 27},
  {frame: 300, camX: 2.1, camY: 4.45, camZ: 8.8, lookX: 0.35, lookY: 0.0, lookZ: -0.1, fov: 28},
  {frame: 540, camX: -1.6, camY: 4.05, camZ: 7.8, lookX: -0.25, lookY: 0.0, lookZ: 0.0, fov: 27},
  {frame: 750, camX: -2.5, camY: 4.5, camZ: 8.9, lookX: -0.3, lookY: 0.0, lookZ: -0.1, fov: 28.5},
  {frame: 1050, camX: 1.5, camY: 4.1, camZ: 8.0, lookX: 0.2, lookY: 0.0, lookZ: 0.0, fov: 27},
  {frame: 1350, camX: 2.4, camY: 4.55, camZ: 9.0, lookX: 0.3, lookY: 0.0, lookZ: -0.1, fov: 28.5},
  {frame: 1620, camX: -0.8, camY: 4.35, camZ: 8.5, lookX: -0.1, lookY: 0.0, lookZ: 0.0, fov: 28},
  {frame: 1800, camX: 0.9, camY: 4.65, camZ: 9.2, lookX: 0.1, lookY: 0.0, lookZ: -0.1, fov: 29},
];

export type ContinuousCameraState = {
  camX: number;
  camY: number;
  camZ: number;
  lookX: number;
  lookY: number;
  lookZ: number;
  fov: number;
  gridDriftX: number;
  gridDriftY: number;
  gridScale: number;
  tradeWeight: number;
  goldVaultWeight: number;
  liquidityNodesWeight: number;
  crownWeight: number;
};

export const getContinuousCameraRig = (globalFrame: number): ContinuousCameraState => {
  const f = Math.max(0, Math.min(BW_DURATION_FRAMES, globalFrame));

  let segIdx = 0;
  for (let i = 0; i < ISOMETRIC_CAMERA_KEYFRAMES.length - 1; i += 1) {
    if (
      f >= ISOMETRIC_CAMERA_KEYFRAMES[i].frame &&
      f <= ISOMETRIC_CAMERA_KEYFRAMES[i + 1].frame
    ) {
      segIdx = i;
      break;
    }
  }
  const a = ISOMETRIC_CAMERA_KEYFRAMES[segIdx];
  const b = ISOMETRIC_CAMERA_KEYFRAMES[segIdx + 1];
  const rawT = b.frame === a.frame ? 1 : (f - a.frame) / (b.frame - a.frame);
  const easedT = Easing.inOut(Easing.cubic)(Math.max(0, Math.min(1, rawT)));

  // Gentle continuous isometric drift ensures zero frozen camera frames
  const driftX = Math.sin(f * 0.014) * 0.12;
  const driftY = Math.cos(f * 0.011) * 0.05;
  const driftZ = Math.sin(f * 0.012) * 0.14;

  const camX = a.camX + (b.camX - a.camX) * easedT + driftX;
  const camY = a.camY + (b.camY - a.camY) * easedT + driftY;
  const camZ = a.camZ + (b.camZ - a.camZ) * easedT + driftZ;
  const lookX = a.lookX + (b.lookX - a.lookX) * easedT + driftX * 0.25;
  const lookY = a.lookY + (b.lookY - a.lookY) * easedT;
  const lookZ = a.lookZ + (b.lookZ - a.lookZ) * easedT;
  const fov = a.fov + (b.fov - a.fov) * easedT;

  const gridDriftX = -camX * 52 - f * 0.45;
  const gridDriftY = camY * 36 - f * 0.22;
  const gridScale = interpolate(camZ, [7.6, 9.4], [1.06, 0.96], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Smooth cross-fading 3D thematic stage weights (zero abrupt pop-in/out)
  const tradeWeight = interpolate(f, [276, 318], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const goldVaultWeight =
    interpolate(f, [282, 326], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    }) *
    interpolate(f, [728, 772], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    });

  const liquidityNodesWeight =
    interpolate(f, [732, 776], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    }) *
    interpolate(f, [1328, 1372], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    });

  const crownWeight = interpolate(f, [1332, 1378], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  return {
    camX,
    camY,
    camZ,
    lookX,
    lookY,
    lookZ,
    fov,
    gridDriftX,
    gridDriftY,
    gridScale,
    tradeWeight,
    goldVaultWeight,
    liquidityNodesWeight,
    crownWeight,
  };
};
