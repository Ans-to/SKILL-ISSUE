import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {isEmphasis} from './KineticEngine';
import {
  OUTRO_CUT_FRAME,
  SCRIPT_CUES,
  WORD_START_FRAMES,
  type SceneSpec,
} from './engine/agentEngineModel';

export const SFX_PATHS = {
  click: 'sfx/click.mp3',
  clickAccent: 'sfx/click-accent.mp3',
  whoosh: 'sfx/whoosh.mp3',
  slashImpact: 'sfx/slash-impact.mp3',
  telemetryHum: 'sfx/telemetry-hum.mp3',
} as const;

export type WordAudioCue = {
  globalIndex: number;
  startFrame: number;
  localFrame: number;
  emphasis: boolean;
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
 * Scene-isolated embedded audio bed:
 * 1. Continuous subtle telemetry data stream hum (volume={0.15}, looped)
 * 2. Scene entry sub-bass whoosh + pre-unmount cut riser (sfx/whoosh.mp3)
 * 3. Exact frame-locked word-transition clicks (sfx/click.mp3 + sfx/click-accent.mp3)
 */
export const SceneAudioBed: React.FC<{scene: SceneSpec}> = ({scene}) => {
  const activeFrames = getSceneActiveAudioFrames(scene);
  const wordCues = getSceneWordAudioCues(scene);
  const entryWhooshFrames = Math.min(15, activeFrames);
  const riserFrames = 12;
  const riserStart = Math.max(0, activeFrames - riserFrames);

  return (
    <div data-scene-audio={scene.id} data-word-sfx-count={wordCues.length} style={{display: 'none'}}>
      {/* 1. Telemetry data stream hum looping in background at low volume */}
      <Sequence from={0} durationInFrames={activeFrames} layout="none" name={`${scene.id}-telemetry-hum`}>
        <Audio src={staticFile(SFX_PATHS.telemetryHum)} loop volume={0.15} />
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

      {/* 3. Exact frame-locked word-snap transients mapped from WORD_START_FRAMES */}
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
                volume={word.emphasis ? 0.34 : 0.23}
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

/**
 * Helper for scene-specific visual event impacts (e.g. fracture slash, clone stamp,
 * compiler stage lock, monolith lock) tied to WORD_START_FRAMES[wordIndex].
 */
export const SceneEventSfx: React.FC<{
  scene: SceneSpec;
  wordIndex: number;
  src?: string;
  volume?: number;
  playbackRate?: number;
  durationInFrames?: number;
  label?: string;
}> = ({
  scene,
  wordIndex,
  src = SFX_PATHS.slashImpact,
  volume = 0.34,
  playbackRate = 1,
  durationInFrames = 14,
  label = 'event-sfx',
}) => {
  const activeFrames = getSceneActiveAudioFrames(scene);
  const localFrame = WORD_START_FRAMES[wordIndex] - scene.from;
  if (localFrame < 0 || localFrame >= activeFrames) return null;
  const dur = Math.max(1, Math.min(durationInFrames, activeFrames - localFrame));

  return (
    <Sequence from={localFrame} durationInFrames={dur} layout="none" name={`${scene.id}-${label}`}>
      <Audio src={staticFile(src)} volume={volume} playbackRate={playbackRate} />
    </Sequence>
  );
};
