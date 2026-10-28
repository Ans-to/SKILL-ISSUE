import envelope from './audio-envelope.json';
import cueFile from './word-cues.json';

export const FPS = 30;
export const PLAYBACK_RATE = 1;
export const NARRATION = [
  {audio: 'audio/scene-1.mp3', durationSeconds: 10.87},
  {audio: 'audio/scene-2.mp3', durationSeconds: 11.08},
  {audio: 'audio/scene-3.mp3', durationSeconds: 9.04},
] as const;

export type WordCategory = 'geography' | 'material' | 'industry' | 'network' | 'device' | 'signal';
type RawWord = {text: string; start: number; end: number};
type RawTrack = {audio: string; text: string; words: RawWord[]};
export type TimedWord = RawWord & {
  trackIndex: number;
  trackWordIndex: number;
  globalIndex: number;
  trackStartFrame: number;
  globalStart: number;
  globalEnd: number;
  startFrame: number;
  endFrame: number;
};

const cues = cueFile.tracks as RawTrack[];
let trackFrame = 0;
let globalIndex = 0;
export const TRACK_TIMINGS = NARRATION.map((track, trackIndex) => {
  const durationInFrames = Math.ceil(track.durationSeconds * FPS);
  const timing = { ...track, trackIndex, from: trackFrame, durationInFrames, to: trackFrame + durationInFrames, text: cues[trackIndex]?.text ?? '' };
  trackFrame += durationInFrames;
  return timing;
});
export const TOTAL_FRAMES = trackFrame;
export const TOTAL_WORDS = cues.reduce((sum, track) => sum + track.words.length, 0);

export const WORDS: TimedWord[] = cues.flatMap((track, trackIndex) => {
  const startFrame = TRACK_TIMINGS[trackIndex].from;
  return track.words.map((word, trackWordIndex) => {
    const timed: TimedWord = {
      ...word,
      trackIndex,
      trackWordIndex,
      globalIndex: globalIndex++,
      trackStartFrame: startFrame,
      globalStart: startFrame / FPS + word.start,
      globalEnd: startFrame / FPS + word.end,
      startFrame: startFrame + word.start * FPS,
      endFrame: startFrame + word.end * FPS,
    };
    return timed;
  });
});

const energy = envelope.energy as number[];
export const audioEnergyAt = (frame: number): number => energy[Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frame)))] ?? 0;

const clean = (word: string): string => word.toLowerCase().replace(/[^a-z0-9]/g, '');
const CATEGORY_WORDS: Record<Exclude<WordCategory, 'signal'>, string[]> = {
  geography: ['1865', 'finland', 'frozen', 'forests'],
  material: ['timber', 'mill', 'paper'],
  industry: ['industrial', 'powerhouse', 'manufacturing', 'rubber', 'boots', 'cables', 'electricity', 'modernizing'],
  network: ['digital', 'pivoted', 'connecting', 'billions', 'people', 'nation'],
  device: ['mobile', 'phone', 'phones'],
};

export const categoryForWord = (word: TimedWord): WordCategory => {
  const token = clean(word.text);
  // “Cell phones” is explicitly a reference to an earlier era, not an active device reveal.
  if (['cell', 'phone', 'phones'].includes(token)) {
    const previous = WORDS.slice(Math.max(0, word.globalIndex - 3), word.globalIndex).filter((cue) => cue.trackIndex === word.trackIndex).map((cue) => clean(cue.text));
    if (previous.includes('before')) return 'signal';
  }
  for (const [category, terms] of Object.entries(CATEGORY_WORDS) as Array<[Exclude<WordCategory, 'signal'>, string[]]>) {
    if (terms.includes(token)) return category;
  }
  return 'signal';
};

export type PlaybackState = {
  frame: number;
  seconds: number;
  energy: number;
  momentum: number;
  active: TimedWord | null;
  held: TimedWord | null;
  wordOpacity: number;
  category: WordCategory;
  recentWords: TimedWord[];
  wordProgress: number;
};

export const playbackAt = (frame: number): PlaybackState => {
  const safeFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, frame));
  const seconds = safeFrame / FPS;
  const active = WORDS.find((word) => seconds >= word.globalStart && seconds < word.globalEnd) ?? null;
  const lastSpoken = active ?? [...WORDS].reverse().find((word) => word.globalEnd <= seconds) ?? null;
  const tailFrames = lastSpoken ? safeFrame - lastSpoken.endFrame : Infinity;
  const held = !active && lastSpoken && tailFrames >= 0 && tailFrames <= 5 ? lastSpoken : null;
  const wordOpacity = active ? 1 : held ? Math.max(0, 1 - tailFrames / 6) : 0;
  const displayCue = active ?? held;
  const recentWords = displayCue
    ? WORDS.filter((word) => word.trackIndex === displayCue.trackIndex && word.globalIndex <= displayCue.globalIndex).slice(-4)
    : [];
  const currentFrame = Math.round(safeFrame);
  const localEnergy = audioEnergyAt(currentFrame);
  const momentum = (audioEnergyAt(currentFrame - 2) + audioEnergyAt(currentFrame - 1) + localEnergy) / 3;
  const wordProgress = active ? Math.max(0, Math.min(1, (seconds - active.globalStart) / Math.max(0.001, active.globalEnd - active.globalStart))) : 0;
  return {
    frame: safeFrame,
    seconds,
    energy: localEnergy,
    momentum,
    active,
    held,
    wordOpacity,
    category: active ? categoryForWord(active) : lastSpoken ? categoryForWord(lastSpoken) : 'signal',
    recentWords,
    wordProgress,
  };
};
