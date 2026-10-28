import wordCueData from './agent-engine-word-cues.json';
import frameCueData from './agent-engine-frame-cues.json';
import audioEnvelope from './agent-engine-audio-envelope.json';

export const OBSIDIAN = '#0b0f19';
export const ORANGE = '#ff4500';
export const WHITE = '#f4f7ff';
export const MUTED = 'rgba(244,247,255,.42)';
export const FPS = 30;
export const DURATION_FRAMES = (audioEnvelope.trackFrames as number[])[0] ?? FPS * 45;
export const envelope = audioEnvelope.energy as number[];

type RawWord = {text: string; start: number; end: number};
type RawTrack = {audio: string; words: RawWord[]; text: string};
export type ScriptCue = RawWord & {globalIndex: number; startFrame: number; endFrame: number};

export const track = (wordCueData.tracks as RawTrack[])[0];
// Absolute frame arrays are generated directly from the aligned WAV and checked
// against its SHA-256 before each render. No running timer or CSS delay is used.
export const WORD_START_FRAMES: readonly number[] = frameCueData.startFrames;
export const WORD_END_FRAMES: readonly number[] = frameCueData.endFrames;
if (frameCueData.fps !== FPS || frameCueData.audioSha256 !== wordCueData.audioSha256 || WORD_START_FRAMES.length !== track.words.length || WORD_END_FRAMES.length !== track.words.length) {
  throw new Error('Word-frame map does not match the composition, transcript, or audio.');
}
export const SCRIPT_CUES: ScriptCue[] = track.words.map((word, globalIndex) => ({
  ...word,
  globalIndex,
  startFrame: WORD_START_FRAMES[globalIndex],
  endFrame: WORD_END_FRAMES[globalIndex],
}));

// One index per absolute composition frame; -1 denotes a real narration gap.
// Adjacent words replace each other in the very same frame, with no echo/fade.
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

export const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, value));
export const normalize = (word: string): string => word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
export const hashText = (text: string): number => {
  let hash = 2166136261;
  for (const character of text) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
};

export const findPhraseIndex = (phrase: string): number => {
  const query = phrase.split(/\s+/).map(normalize);
  for (let start = 0; start <= SCRIPT_CUES.length - query.length; start += 1) {
    if (query.every((word, offset) => normalize(SCRIPT_CUES[start + offset].text) === word)) return start;
  }
  throw new Error(`Narration phrase not found: ${phrase}`);
};
export const phraseIndexFrom = (phrase: string, fromIndex: number): number => {
  const query = phrase.split(/\s+/).map(normalize);
  for (let start = fromIndex; start <= SCRIPT_CUES.length - query.length; start += 1) {
    if (query.every((word, offset) => normalize(SCRIPT_CUES[start + offset].text) === word)) return start;
  }
  throw new Error(`Narration phrase not found after word ${fromIndex}: ${phrase}`);
};
export const cueAfter = (phrase: string, fromIndex = 0): ScriptCue => SCRIPT_CUES[phraseIndexFrom(phrase, fromIndex)];
export const cueIndexFor = (phrase: string, fromIndex = 0): number => phraseIndexFrom(phrase, fromIndex);
export const sectionIndices = [
  findPhraseIndex('Your AI agent didn’t build anything'),
  findPhraseIndex('It looks finished'),
  findPhraseIndex('Prompt harder? No.'),
  findPhraseIndex('Engine- first means'),
  findPhraseIndex('Feed intent into the engine'),
  findPhraseIndex('Stop playing with templates'),
];
export const SECTION_STARTS = sectionIndices.map((index) => SCRIPT_CUES[index]?.startFrame ?? 0);
export const OUTRO_BUILD_INDEX = cueIndexFor('Build', sectionIndices[5]);
export const OUTRO_CUT_FRAME = cueAfter('toys.').endFrame + 3;

/** A cue is active only inside its precomputed absolute-frame interval. */
export const findCue = (frame: number): ScriptCue | null => {
  const index = Number.isInteger(frame) ? FRAME_WORD_INDICES[frame] : undefined;
  return index !== undefined && index >= 0 ? SCRIPT_CUES[index] : null;
};

/** Most recently started spoken cue, used only for telemetry/history—not visible kinetic text. */
export const lastStartedCue = (frame: number): ScriptCue | null => {
  let result: ScriptCue | null = null;
  for (const cue of SCRIPT_CUES) {
    if (cue.startFrame > frame) break;
    result = cue;
  }
  return result;
};

export const energyAt = (frame: number): number =>
  envelope[Math.max(0, Math.min(envelope.length - 1, Math.round(frame)))] ?? 0;
export const currentSection = (frame: number): number => {
  let section = 0;
  SECTION_STARTS.forEach((start, index) => {if (frame >= start) section = index;});
  return section;
};
