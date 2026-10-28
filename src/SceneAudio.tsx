import React from 'react';
import {Audio, Easing, Sequence, interpolate, staticFile} from 'remotion';
import {getEmotionalPacingMode} from './EmotionalPacing';
import {isEmphasis} from './KineticEngine';
import {
  OUTRO_CUT_FRAME,
  SCRIPT_CUES,
  WORD_START_FRAMES,
  clamp,
  cueIndexFor,
  energyAt,
  type SceneKey,
  type SceneSpec,
} from './engine/agentEngineModel';

export const SFX_PATHS = {
  click: 'sfx/click.mp3',
  clickAccent: 'sfx/click-accent.mp3',
  whoosh: 'sfx/whoosh.mp3',
  slashImpact: 'sfx/slash-impact.mp3',
  telemetryHum: 'sfx/telemetry-hum.mp3',
  tensionRiser: 'sfx/tension-riser.mp3',
  subDrop: 'sfx/sub-drop.mp3',
} as const;

export type WordAudioCue = {
  globalIndex: number;
  startFrame: number;
  localFrame: number;
  emphasis: boolean;
};

export type ClimaxAudioEvent = {
  id: string;
  wordIndex: number;
  wordText: string;
  climaxGlobalFrame: number;
  climaxLocalFrame: number;
  riserLocalStart: number | null;
  riserDurationFrames: number;
  riserVolume: number;
  dropDurationFrames: number;
  dropVolume: number;
};

/**
 * Maps word-snap SFX triggers directly from WORD_START_FRAMES (the exact absolute
 * frame array driving KineticEngine) into scene-local <Sequence> frames so every
 * click lands on the exact same millisecond as the visual word snap.
 */
export const getSceneWordAudioCues = (scene: SceneSpec): WordAudioCue[] => {
  const cues: WordAudioCue[] = [];
  for (let idx = scene.firstWordIndex; idx <= scene.lastWordIndex; idx += 1) {
    const startFrame = WORD_START_FRAMES[idx];
    const cue = SCRIPT_CUES[idx];
    cues.push({
      globalIndex: idx,
      startFrame,
      localFrame: startFrame - scene.from,
      emphasis: isEmphasis(cue.text),
    });
  }
  return cues;
};

export const getSceneActiveAudioFrames = (scene: SceneSpec): number => {
  if (scene.id === 'outro') {
    return Math.max(1, OUTRO_CUT_FRAME - scene.from);
  }
  return Math.max(1, scene.durationInFrames - scene.clearFrames);
};

/**
 * Per-scene ambient telemetry hum pitch ratio (`toneFrequency`):
 * High-tension conflict scenes pitch the ambient reactor hum upward, while
 * technical breakdown scenes hold a grounded, calm reference pitch.
 */
export const getSceneHumToneFrequency = (sceneId: SceneKey): number => {
  if (sceneId === 'twist') return 1.2;
  if (sceneId === 'hook' || sceneId === 'outro') return 1.16;
  if (sceneId === 'shift') return 1.08;
  return 1.0;
};

const CLIMAX_SPECS: Readonly<
  Record<SceneKey, ReadonlyArray<{word: string; riserLeadFrames: number; riserVol: number; dropVol: number}>>
> = {
  hook: [
    {word: 'anything.', riserLeadFrames: 30, riserVol: 0.2, dropVol: 0.34},
    {word: 'pasted', riserLeadFrames: 28, riserVol: 0.24, dropVol: 0.4},
  ],
  twist: [
    {word: 'break.', riserLeadFrames: 36, riserVol: 0.3, dropVol: 0.46},
  ],
  shift: [
    {word: 'No.', riserLeadFrames: 34, riserVol: 0.25, dropVol: 0.38},
    {word: 'constraints', riserLeadFrames: 34, riserVol: 0.2, dropVol: 0.34},
  ],
  mechanism: [
    {word: 'math.', riserLeadFrames: 32, riserVol: 0.16, dropVol: 0.34},
    {word: 'roulette.', riserLeadFrames: 34, riserVol: 0.2, dropVol: 0.38},
  ],
  payoff: [
    {word: 'MP4.', riserLeadFrames: 36, riserVol: 0.26, dropVol: 0.44},
  ],
  outro: [
    {word: 'Stop', riserLeadFrames: 0, riserVol: 0, dropVol: 0.34},
    {word: 'toys.', riserLeadFrames: 36, riserVol: 0.3, dropVol: 0.46},
  ],
};

/**
 * Resolves exact frame-locked tension risers and sentence-climax heavy sub-bass drops
 * directly from WORD_START_FRAMES for a given scene.
 */
export const getSceneClimaxAudioEvents = (scene: SceneSpec): ClimaxAudioEvent[] => {
  const activeFrames = getSceneActiveAudioFrames(scene);
  const specs = CLIMAX_SPECS[scene.id];
  const events: ClimaxAudioEvent[] = [];
  let searchFrom = scene.firstWordIndex;

  for (const spec of specs) {
    const wordIdx = cueIndexFor(spec.word, searchFrom);
    searchFrom = wordIdx + 1;
    const climaxGlobalFrame = WORD_START_FRAMES[wordIdx];
    const climaxLocalFrame = climaxGlobalFrame - scene.from;
    if (climaxLocalFrame < 0 || climaxLocalFrame >= activeFrames) continue;

    let riserLocalStart: number | null = null;
    let riserDurationFrames = 0;
    if (spec.riserLeadFrames > 0 && climaxLocalFrame >= 10) {
      riserLocalStart = Math.max(0, climaxLocalFrame - spec.riserLeadFrames);
      riserDurationFrames = climaxLocalFrame - riserLocalStart;
    }

    const dropDurationFrames = Math.max(1, Math.min(20, activeFrames - climaxLocalFrame));

    events.push({
      id: `${scene.id}-climax-${wordIdx}`,
      wordIndex: wordIdx,
      wordText: SCRIPT_CUES[wordIdx].text,
      climaxGlobalFrame,
      climaxLocalFrame,
      riserLocalStart,
      riserDurationFrames,
      riserVolume: spec.riserVol,
      dropDurationFrames,
      dropVolume: spec.dropVol,
    });
  }

  return events;
};

/**
 * Dynamic frame-by-frame volume curve for the background telemetry hum:
 * - Ducks cleanly under high-energy spoken syllables to preserve vocal clarity
 * - Increases in volume during high-tension narrative shifts & pre-climax build-ups
 * - Ducks tightly right on sentence climax sub-bass drops for clean low-end impact
 */
export const computeDynamicHumVolume = (scene: SceneSpec, localFrame: number): number => {
  const activeFrames = getSceneActiveAudioFrames(scene);
  if (localFrame < 0 || localFrame >= activeFrames) return 0;

  const globalFrame = scene.from + localFrame;
  const mode = getEmotionalPacingMode(scene.id, globalFrame);
  const speechEnergy = energyAt(globalFrame);
  const climaxes = getSceneClimaxAudioEvents(scene);

  // Base level: elevated in tension scenes, composed in calm precision scenes
  let vol = mode === 'tension' ? 0.165 : 0.125;

  // Dynamic vocal ducking when speech envelope is strong
  vol -= speechEnergy * 0.045;

  // Swell up during pre-climax tension build-ups, then sidechain-duck on sub-bass drop
  for (const ev of climaxes) {
    if (
      ev.riserLocalStart !== null &&
      localFrame >= ev.riserLocalStart &&
      localFrame < ev.climaxLocalFrame
    ) {
      const u =
        (localFrame - ev.riserLocalStart) / Math.max(1, ev.riserDurationFrames);
      vol += interpolate(u, [0, 1], [0.01, mode === 'tension' ? 0.095 : 0.06], {
        easing: Easing.in(Easing.quad),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }
    const afterDrop = localFrame - ev.climaxLocalFrame;
    if (afterDrop >= 0 && afterDrop <= 11) {
      const duckFactor = interpolate(afterDrop, [0, 2, 11], [0.42, 0.38, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      vol *= duckFactor;
    }
  }

  // Smooth 3-frame micro fade before scene unmount / OUTRO_CUT_FRAME
  const remaining = activeFrames - 1 - localFrame;
  if (remaining < 3) {
    vol *= clamp(remaining / 3, 0, 1);
  }

  return Number(clamp(vol, 0.04, 0.26).toFixed(4));
};

/**
 * Scene-isolated embedded audio bed:
 * 1. Dynamic pitched & sidechain-ducked telemetry hum (swells in tension, ducks under voice/drops)
 * 2. Scene entry sub-bass whoosh + pre-unmount cut riser
 * 3. Ascending-pitch tension risers (`sfx/tension-riser.mp3`) + heavy climax sub-bass drops (`sfx/sub-drop.mp3`)
 * 4. Exact frame-locked word-transition clicks (`sfx/click.mp3` + `sfx/click-accent.mp3`)
 */
export const SceneAudioBed: React.FC<{scene: SceneSpec}> = ({scene}) => {
  const activeFrames = getSceneActiveAudioFrames(scene);
  const wordCues = getSceneWordAudioCues(scene);
  const climaxEvents = getSceneClimaxAudioEvents(scene);
  const humTone = getSceneHumToneFrequency(scene.id);
  const entryWhooshFrames = Math.min(15, activeFrames);
  const riserFrames = 12;
  const riserStart = Math.max(0, activeFrames - riserFrames);

  return (
    <div
      data-scene-audio={scene.id}
      data-word-sfx-count={wordCues.length}
      data-climax-sfx-count={climaxEvents.length}
      style={{display: 'none'}}
    >
      {/* 1. Dynamic telemetry hum: pitches up in tension scenes, swells into climaxes, ducks under voice/sub-drops */}
      <Sequence from={0} durationInFrames={activeFrames} layout="none" name={`${scene.id}-telemetry-hum`}>
        <Audio
          src={staticFile(SFX_PATHS.telemetryHum)}
          loop
          loopVolumeCurveBehavior="extend"
          toneFrequency={humTone}
          volume={(f) => computeDynamicHumVolume(scene, Math.round(f))}
        />
      </Sequence>

      {/* 2. Scene cut / entry sub-bass whoosh */}
      <Sequence from={0} durationInFrames={entryWhooshFrames} layout="none" name={`${scene.id}-entry-whoosh`}>
        <Audio src={staticFile(SFX_PATHS.whoosh)} volume={0.34} />
      </Sequence>

      {/* Pre-cut riser before hard-cut unmount on scenes 1-5 */}
      {scene.clearFrames > 0 && riserStart > entryWhooshFrames && (
        <Sequence
          from={riserStart}
          durationInFrames={activeFrames - riserStart}
          layout="none"
          name={`${scene.id}-exit-riser`}
        >
          <Audio src={staticFile(SFX_PATHS.whoosh)} volume={0.22} playbackRate={1.18} />
        </Sequence>
      )}

      {/* 3. Ascending-pitch tension risers + heavy sentence-climax sub-bass drops */}
      {climaxEvents.map((ev) => (
        <React.Fragment key={ev.id}>
          {ev.riserLocalStart !== null && ev.riserDurationFrames >= 8 && (
            <Sequence
              from={ev.riserLocalStart}
              durationInFrames={ev.riserDurationFrames}
              layout="none"
              name={`${ev.id}-riser`}
            >
              <Audio
                src={staticFile(SFX_PATHS.tensionRiser)}
                volume={(f) => {
                  const u = clamp(f / Math.max(1, ev.riserDurationFrames), 0, 1);
                  return ev.riserVolume * (0.35 + 0.65 * u);
                }}
              />
            </Sequence>
          )}
          <Sequence
            from={ev.climaxLocalFrame}
            durationInFrames={ev.dropDurationFrames}
            layout="none"
            name={`${ev.id}-sub-drop`}
          >
            <Audio
              src={staticFile(SFX_PATHS.subDrop)}
              volume={(f) => {
                const rem = ev.dropDurationFrames - 1 - f;
                const fadeOut = rem < 2 ? clamp(rem / 2, 0, 1) : 1;
                return ev.dropVolume * fadeOut;
              }}
            />
          </Sequence>
        </React.Fragment>
      ))}

      {/* 4. Exact frame-locked word-snap transients mapped from WORD_START_FRAMES */}
      {wordCues.map((word) => {
        const clickLen = Math.max(1, Math.min(5, activeFrames - word.localFrame));
        const accentLen = Math.max(1, Math.min(6, activeFrames - word.localFrame));
        if (word.localFrame < 0 || word.localFrame >= activeFrames) return null;
        return (
          <React.Fragment key={word.globalIndex}>
            <Sequence
              from={word.localFrame}
              durationInFrames={clickLen}
              layout="none"
              name={`sfx-word-${word.globalIndex}`}
            >
              <Audio
                src={staticFile(SFX_PATHS.click)}
                volume={word.emphasis ? 0.34 : 0.22}
                playbackRate={word.emphasis ? 0.95 : 1.04}
              />
            </Sequence>
            {word.emphasis && (
              <Sequence
                from={word.localFrame}
                durationInFrames={accentLen}
                layout="none"
                name={`sfx-accent-${word.globalIndex}`}
              >
                <Audio src={staticFile(SFX_PATHS.clickAccent)} volume={0.22} />
              </Sequence>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
