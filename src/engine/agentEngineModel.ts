import wordCueData from './agent-engine-word-cues.json';
import frameCueData from './agent-engine-frame-cues.json';
import audioEnvelope from './agent-engine-audio-envelope.json';

export const OBSIDIAN = '#0b0f19';
export const ORANGE = '#ff4500';
export const WHITE = '#f4f7ff';
export const MUTED = 'rgba(244,247,255,.42)';
export const FPS = 30;
export const COMP_WIDTH = 1080;
export const COMP_HEIGHT = 1920;
export const DURATION_FRAMES = (audioEnvelope.trackFrames as number[])[0] ?? FPS * 45;
export const envelope = audioEnvelope.energy as number[];

type RawWord = {text: string; start: number; end: number};
type RawTrack = {audio: string; words: RawWord[]; text: string};
export type ScriptCue = RawWord & {globalIndex: number; startFrame: number; endFrame: number};

export type SceneKey = 'hook' | 'twist' | 'shift' | 'mechanism' | 'payoff' | 'outro';

export type SceneSpec = {
  index: number;
  id: SceneKey;
  code: string;
  name: string;
  subtitle: string;
  from: number;
  durationInFrames: number;
  endFrame: number;
  clearFrames: number;
  firstWordIndex: number;
  lastWordIndex: number;
};

export const track = (wordCueData.tracks as RawTrack[])[0];

// Absolute frame arrays are generated directly from the aligned WAV and checked
// against its SHA-256 before each render. No running timer or CSS delay is used.
export const WORD_START_FRAMES: readonly number[] = frameCueData.startFrames;
export const WORD_END_FRAMES: readonly number[] = frameCueData.endFrames;
if (
  frameCueData.fps !== FPS ||
  frameCueData.audioSha256 !== wordCueData.audioSha256 ||
  WORD_START_FRAMES.length !== track.words.length ||
  WORD_END_FRAMES.length !== track.words.length
) {
  throw new Error('Word-frame map does not match the composition, transcript, or audio.');
}

export const SCRIPT_CUES: ScriptCue[] = track.words.map((word, globalIndex) => ({
  ...word,
  globalIndex,
  startFrame: WORD_START_FRAMES[globalIndex],
  endFrame: WORD_END_FRAMES[globalIndex],
}));

// One index per absolute composition frame; -1 denotes a real narration gap.
export const FRAME_WORD_INDICES: readonly number[] = (() => {
  const indices = Array<number>(DURATION_FRAMES).fill(-1);
  for (const cue of SCRIPT_CUES) {
    if (cue.startFrame < 0 || cue.endFrame > DURATION_FRAMES || cue.startFrame >= cue.endFrame) {
      throw new Error(`Invalid frame interval for word ${cue.globalIndex}.`);
    }
    for (let frame = cue.startFrame; frame < cue.endFrame; frame += 1) {
      if (indices[frame] !== -1) throw new Error(`Overlapping word cues at frame ${frame}.`);
      indices[frame] = cue.globalIndex;
    }
  }
  return indices;
})();

export const clamp = (value: number, low: number, high: number): number =>
  Math.max(low, Math.min(high, value));
export const normalize = (word: string): string =>
  word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
export const hashText = (text: string): number => {
  let hash = 2166136261;
  for (const character of text) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
};

export const findPhraseIndex = (phrase: string): number => {
  const query = phrase.split(/\s+/).map(normalize);
  for (let start = 0; start <= SCRIPT_CUES.length - query.length; start += 1) {
    if (query.every((word, offset) => normalize(SCRIPT_CUES[start + offset].text) === word)) {
      return start;
    }
  }
  throw new Error(`Narration phrase not found: ${phrase}`);
};

export const phraseIndexFrom = (phrase: string, fromIndex: number): number => {
  const query = phrase.split(/\s+/).map(normalize);
  for (let start = fromIndex; start <= SCRIPT_CUES.length - query.length; start += 1) {
    if (query.every((word, offset) => normalize(SCRIPT_CUES[start + offset].text) === word)) {
      return start;
    }
  }
  throw new Error(`Narration phrase not found after word ${fromIndex}: ${phrase}`);
};

export const cueAfter = (phrase: string, fromIndex = 0): ScriptCue =>
  SCRIPT_CUES[phraseIndexFrom(phrase, fromIndex)];
export const cueIndexFor = (phrase: string, fromIndex = 0): number =>
  phraseIndexFrom(phrase, fromIndex);

export const sectionIndices = [
  findPhraseIndex('Your AI agent didn’t build anything'),
  findPhraseIndex('It looks finished'),
  findPhraseIndex('Prompt harder? No.'),
  findPhraseIndex('Engine- first means'),
  findPhraseIndex('Feed intent into the engine'),
  findPhraseIndex('Stop playing with templates'),
];

const SCENE_META: ReadonlyArray<{id: SceneKey; code: string; name: string; subtitle: string}> = [
  {id: 'hook', code: '01 / HOOK', name: 'HOOK', subtitle: 'COLD OPEN // TEMPLATE MYTH'},
  {id: 'twist', code: '02 / TWIST', name: 'TWIST', subtitle: 'TEMPLATE AUDIT // FRACTURE'},
  {id: 'shift', code: '03 / SHIFT', name: 'SHIFT', subtitle: 'SPLIT WIREFRAME // CONSTRAINT GAP'},
  {id: 'mechanism', code: '04 / MECHANISM', name: 'MECHANISM', subtitle: 'DETERMINISTIC MATH // ISOLATION'},
  {id: 'payoff', code: '05 / PAYOFF', name: 'PAYOFF', subtitle: 'FRAME COMPILER // PIPELINE'},
  {id: 'outro', code: '06 / OUTRO', name: 'OUTRO', subtitle: 'ENGINE MONOLITH // HARD CUT'},
];

// Compute non-overlapping <Sequence> cut points strictly inside inter-beat silence gaps,
// giving each scene a clean pre-speech entry and a clean post-speech clear before unmount.
export const SCENE_SEQUENCES: readonly SceneSpec[] = (() => {
  const cutFrames = sectionIndices.map((firstWordIdx, index) => {
    if (index === 0) return 0;
    const prevWordEnd = SCRIPT_CUES[firstWordIdx - 1].endFrame;
    const nextWordStart = SCRIPT_CUES[firstWordIdx].startFrame;
    const gap = nextWordStart - prevWordEnd;
    if (gap < 4) {
      throw new Error(`Insufficient silence gap before scene ${index}: ${gap} frames.`);
    }
    const leadIn = Math.min(8, Math.floor(gap / 2));
    return nextWordStart - leadIn;
  });

  const specs: SceneSpec[] = SCENE_META.map((meta, index) => {
    const from = cutFrames[index];
    const endFrame = index + 1 < cutFrames.length ? cutFrames[index + 1] : DURATION_FRAMES;
    const durationInFrames = endFrame - from;
    const firstWordIndex = sectionIndices[index];
    const lastWordIndex =
      index + 1 < sectionIndices.length ? sectionIndices[index + 1] - 1 : SCRIPT_CUES.length - 1;
    const clearFrames = index < SCENE_META.length - 1 ? 2 : 0;
    return {
      index,
      ...meta,
      from,
      durationInFrames,
      endFrame,
      clearFrames,
      firstWordIndex,
      lastWordIndex,
    };
  });

  // Enforce strict <Sequence> decoupling invariants at load time.
  if (specs[0].from !== 0 || specs[specs.length - 1].endFrame !== DURATION_FRAMES) {
    throw new Error('Scene sequences do not span the exact composition duration.');
  }
  specs.forEach((scene, idx) => {
    if (scene.durationInFrames <= scene.clearFrames) {
      throw new Error(`Scene ${scene.id} has non-positive active duration.`);
    }
    if (idx > 0 && specs[idx - 1].endFrame !== scene.from) {
      throw new Error(`Scene boundary mismatch between ${specs[idx - 1].id} and ${scene.id}.`);
    }
    for (let w = scene.firstWordIndex; w <= scene.lastWordIndex; w += 1) {
      const cue = SCRIPT_CUES[w];
      if (cue.startFrame < scene.from || cue.endFrame > scene.endFrame - scene.clearFrames) {
        throw new Error(`Word ${w} (${cue.text}) bleeds across scene ${scene.id} boundary.`);
      }
    }
  });
  return specs;
})();

export const SCENE_MAP: Record<SceneKey, SceneSpec> = {
  hook: SCENE_SEQUENCES[0],
  twist: SCENE_SEQUENCES[1],
  shift: SCENE_SEQUENCES[2],
  mechanism: SCENE_SEQUENCES[3],
  payoff: SCENE_SEQUENCES[4],
  outro: SCENE_SEQUENCES[5],
};

export const SECTION_STARTS = SCENE_SEQUENCES.map((scene) => scene.from);
export const OUTRO_BUILD_INDEX = cueIndexFor('Build', sectionIndices[5]);
export const OUTRO_CUT_FRAME = cueAfter('toys.').endFrame + 3;

/** A cue is active only inside its precomputed absolute-frame interval. */
export const findCue = (globalFrame: number): ScriptCue | null => {
  const index = Number.isInteger(globalFrame) ? FRAME_WORD_INDICES[globalFrame] : undefined;
  return index !== undefined && index >= 0 ? SCRIPT_CUES[index] : null;
};

/** Resolve which isolated scene Sequence owns an absolute composition frame. */
export const sceneForFrame = (globalFrame: number): SceneSpec => {
  const clamped = clamp(Math.floor(globalFrame), 0, DURATION_FRAMES - 1);
  return (
    SCENE_SEQUENCES.find((scene) => clamped >= scene.from && clamped < scene.endFrame) ??
    SCENE_SEQUENCES[SCENE_SEQUENCES.length - 1]
  );
};

export const currentSection = (globalFrame: number): number => sceneForFrame(globalFrame).index;

/** Whether a scene is in its pre-unmount hard-cut black clear window. */
export const isSceneCleared = (scene: SceneSpec, localFrame: number): boolean => {
  const globalFrame = scene.from + localFrame;
  if (scene.id === 'outro' && globalFrame >= OUTRO_CUT_FRAME) return true;
  return localFrame >= scene.durationInFrames - scene.clearFrames;
};

/** Strictly scene-isolated active word lookup: never returns a word from another scene. */
export const findSceneCue = (scene: SceneSpec, localFrame: number): ScriptCue | null => {
  if (localFrame < 0 || localFrame >= scene.durationInFrames || isSceneCleared(scene, localFrame)) {
    return null;
  }
  const cue = findCue(scene.from + localFrame);
  if (!cue || cue.globalIndex < scene.firstWordIndex || cue.globalIndex > scene.lastWordIndex) {
    return null;
  }
  return cue;
};

/** Strictly scene-isolated spoken cues: resets cleanly to [] at the start of every Sequence. */
export const sceneSpokenCues = (scene: SceneSpec, localFrame: number): ScriptCue[] => {
  if (localFrame < 0 || isSceneCleared(scene, localFrame)) return [];
  const globalFrame = scene.from + localFrame;
  const result: ScriptCue[] = [];
  for (let i = scene.firstWordIndex; i <= scene.lastWordIndex; i += 1) {
    const cue = SCRIPT_CUES[i];
    if (cue.startFrame > globalFrame) break;
    result.push(cue);
  }
  return result;
};

export const sceneLatestCue = (scene: SceneSpec, localFrame: number): ScriptCue | null => {
  const spoken = sceneSpokenCues(scene, localFrame);
  return spoken.length > 0 ? spoken[spoken.length - 1] : null;
};

export const energyAt = (globalFrame: number): number =>
  envelope[Math.max(0, Math.min(envelope.length - 1, Math.round(globalFrame)))] ?? 0;
