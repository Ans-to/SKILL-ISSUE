import envelope from './audio-envelope.json';

export const FPS = 30;
export const PLAYBACK_RATE = 1;
export const TOTAL_FRAMES = 932;

export type ConceptId = 'origin' | 'material' | 'industry' | 'network' | 'device';

export type NarrativeTrack = {
  id: string;
  src: string;
  durationSeconds: number;
  text: string;
};

export const NARRATIVE_TRACKS: NarrativeTrack[] = [
  {
    id: 'northern-origin',
    src: 'audio/scene-1.mp3',
    durationSeconds: 10.87,
    text: 'In 1865, deep in the frozen forests of Finland, a quiet timber mill was born. No one knew it yet, but this small paper company would change history.',
  },
  {
    id: 'industrial-reinvention',
    src: 'audio/scene-2.mp3',
    durationSeconds: 11.08,
    text: 'Decades before cell phones, Nokia evolved into an industrial powerhouse, manufacturing rubber boots, cables, and electricity for a rapidly modernizing nation.',
  },
  {
    id: 'connected-world',
    src: 'audio/scene-3.mp3',
    durationSeconds: 9.04,
    text: 'When the digital age arrived, Nokia pivoted once more, connecting billions of people and redefining what a mobile phone could be.',
  },
];

const CONCEPT_RULES: Array<{id: ConceptId; terms: string[]}> = [
  {id: 'origin', terms: ['1865', 'finland', 'finnish', 'northern', 'river', 'born', 'beginning', 'origin']},
  {id: 'material', terms: ['forest', 'forests', 'timber', 'mill', 'paper', 'wood', 'material']},
  {id: 'industry', terms: ['industrial', 'industry', 'powerhouse', 'rubber', 'boots', 'cable', 'cables', 'electricity', 'modernizing', 'manufacturing']},
  {id: 'network', terms: ['digital', 'pivoted', 'connecting', 'connected', 'billions', 'people', 'world', 'signal', 'network']},
  {id: 'device', terms: ['phone', 'phones', 'mobile', 'pocket', 'handset']},
];

export const CONCEPT_COPY: Record<ConceptId, {word: string; phrase: string; index: string; tint: string}> = {
  origin: {word: 'ORIGIN', phrase: 'A northern river. A beginning.', index: '01 / FINLAND', tint: '#f2b66d'},
  material: {word: 'MATTER', phrase: 'Timber becomes a new medium.', index: '02 / MATERIAL', tint: '#83dbe0'},
  industry: {word: 'REINVENTION', phrase: 'Rubber. Cable. Electric current.', index: '03 / INDUSTRY', tint: '#f2b66d'},
  network: {word: 'NETWORK', phrase: 'Distance begins to collapse.', index: '04 / CONNECTION', tint: '#83dbe0'},
  device: {word: 'PERSONAL', phrase: 'The signal, carried in a hand.', index: '05 / MOBILE', tint: '#f2b66d'},
};

export type TimedTrack = NarrativeTrack & {from: number; durationInFrames: number; to: number};

export const TIMED_TRACKS: TimedTrack[] = (() => {
  let cursor = 0;
  return NARRATIVE_TRACKS.map((track) => {
    const durationInFrames = Math.ceil((track.durationSeconds / PLAYBACK_RATE) * FPS);
    const timed = {...track, from: cursor, durationInFrames, to: cursor + durationInFrames};
    cursor += durationInFrames;
    return timed;
  });
})();

type Beat = {concept: ConceptId; centerFrame: number; spreadFrames: number; phrase: string};
const splitSentences = (text: string): string[] => text.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);

/** Term positions are semantic anchors; comparative references like “before cell phones” are intentionally suppressed. */
const findConceptAnchors = (sentence: string): Array<{concept: ConceptId; wordIndex: number}> => {
  const words = sentence.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const anchors: Array<{concept: ConceptId; wordIndex: number}> = [];
  for (const rule of CONCEPT_RULES) {
    const matches = words.flatMap((word, index) => {
      const negated = words.slice(Math.max(0, index - 3), index).some((previous) => ['before', 'without', 'never', 'not', 'no'].includes(previous));
      return rule.terms.includes(word) && !negated ? [index] : [];
    });
    if (matches.length) anchors.push({concept: rule.id, wordIndex: matches.reduce((sum, index) => sum + index, 0) / matches.length});
  }
  return anchors;
};

/** Extract concept anchors from transcript meaning and sentence density, rather than a literal caption grid. */
export const parseNarrative = (): Beat[] => {
  const beats: Beat[] = [];
  for (const track of TIMED_TRACKS) {
    const sentences = splitSentences(track.text);
    const totalWords = Math.max(1, (track.text.match(/[a-z0-9]+/gi) ?? []).length);
    let wordCursor = 0;
    for (const sentence of sentences) {
      const sentenceWords = Math.max(1, (sentence.match(/[a-z0-9]+/gi) ?? []).length);
      for (const anchor of findConceptAnchors(sentence)) {
        const relativeWord = (wordCursor + anchor.wordIndex + 0.5) / totalWords;
        const centerFrame = track.from + relativeWord * track.durationInFrames;
        const spreadFrames = Math.max(13, (track.durationInFrames / totalWords) * 2.3);
        beats.push({concept: anchor.concept, centerFrame, spreadFrames, phrase: sentence});
      }
      wordCursor += sentenceWords;
    }
  }
  return beats;
};

const BEATS = parseNarrative();
const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const audio = envelope.energy as number[];
const localEnergy = (frame: number): number => audio[Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frame)))] ?? 0;

export type NarrativeState = {
  progress: number;
  energy: number;
  momentum: number;
  motion: number;
  concepts: Record<ConceptId, number>;
  dominant: ConceptId;
};

/** Smooth semantic activations overlap adjacent ideas; narration energy adds motion without deciding the story. */
export const getNarrativeState = (frame: number): NarrativeState => {
  const safeFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, frame));
  const progress = safeFrame / (TOTAL_FRAMES - 1);
  const energy = localEnergy(safeFrame);
  const momentum = (localEnergy(safeFrame - 3) + localEnergy(safeFrame - 2) + localEnergy(safeFrame - 1) + energy) / 4;
  const concepts: Record<ConceptId, number> = {origin: 0, material: 0, industry: 0, network: 0, device: 0};

  for (const beat of BEATS) {
    const distance = (safeFrame - beat.centerFrame) / beat.spreadFrames;
    const activation = Math.exp(-0.5 * distance * distance);
    concepts[beat.concept] = Math.max(concepts[beat.concept], activation);
  }

  const dominant = (Object.keys(concepts) as ConceptId[]).reduce((best, concept) =>
    concepts[concept] > concepts[best] ? concept : best, 'origin');
  return {progress, energy, momentum, motion: clamp01(0.3 + energy * 0.72 + momentum * 0.3), concepts, dominant};
};

export const getAudioEnergy = (frame: number): number => localEnergy(frame);
