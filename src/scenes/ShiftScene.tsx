import React from 'react';
import {Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {getCinematographyState} from '../EmotionalPacing';
import {SceneKineticStage} from '../KineticEngine';
import {SceneAudioBed, SFX_PATHS} from '../SceneAudio';
import {SceneContainer} from '../SceneContainer';
import {ConnectedAtmosphericOverlays} from '../TelemetryHud';
import {
  SCENE_MAP,
  SCRIPT_CUES,
  WORD_START_FRAMES,
  cueIndexFor,
  energyAt,
  findSceneCue,
  type SceneSpec,
} from '../engine/agentEngineModel';
import {CleanCoordinateGrid, SceneStage, SceneThreeCanvas} from './SceneStage';

export const ShiftScene: React.FC<{scene?: SceneSpec}> = ({scene = SCENE_MAP.shift}) => {
  const localFrame = useCurrentFrame();
  const globalFrame = scene.from + localFrame;
  const activeCue = findSceneCue(scene, localFrame);
  const energy = energyAt(globalFrame);

  const timingIdx = cueIndexFor('timing', scene.firstWordIndex);
  const modelIdx = cueIndexFor('model,', timingIdx);
  const renderIdx = cueIndexFor('render', modelIdx);
  const graphIdx = cueIndexFor('graph,', renderIdx);
  const hardIdx = cueIndexFor('hard', graphIdx);
  const isPrecisionSpan = globalFrame >= SCRIPT_CUES[timingIdx].startFrame;
  const subtleGridBreath = isPrecisionSpan
    ? 0.072 + 0.024 * (0.5 + 0.5 * Math.sin(localFrame * 0.08))
    : 0.075;
  const cinema = getCinematographyState(scene, localFrame);

  return (
    <SceneContainer>
      <SceneAudioBed scene={scene} />
      {[timingIdx, renderIdx, hardIdx].map((idx) => (
        <Sequence
          key={idx}
          from={WORD_START_FRAMES[idx] - scene.from}
          durationInFrames={8}
          layout="none"
          name={`shift-sys-lock-${idx}`}
        >
          <Audio src={staticFile(SFX_PATHS.clickAccent)} volume={0.28} />
        </Sequence>
      ))}
      <SceneStage
        scene={scene}
        localFrame={localFrame}
        activeCue={activeCue}
        background={<CleanCoordinateGrid gridOpacity={subtleGridBreath} glowOpacity={0.04} />}
        threeD={<SceneThreeCanvas scene={scene} localFrame={localFrame} energy={energy} baseZ={13.6} opacity={0.44} />}
        overlays={<ConnectedAtmosphericOverlays scene={scene} energy={energy} activeCue={activeCue} />}
        typography={<SceneKineticStage scene={scene} activeCue={activeCue} foregroundShakeX={cinema.shakeX * 1.15} />}
      />
    </SceneContainer>
  );
};
