import React from 'react';
import {Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SceneKineticStage} from '../KineticEngine';
import {SceneAudioBed, SFX_PATHS} from '../SceneAudio';
import {SceneContainer} from '../SceneContainer';
import {ConnectedAtmosphericOverlays} from '../TelemetryHud';
import {
  SCENE_MAP,
  WORD_START_FRAMES,
  cueIndexFor,
  energyAt,
  findSceneCue,
  type SceneSpec,
} from '../engine/agentEngineModel';
import {CleanCoordinateGrid, SceneStage, SceneThreeCanvas} from './SceneStage';

export const MechanismScene: React.FC<{scene?: SceneSpec}> = ({scene = SCENE_MAP.mechanism}) => {
  const localFrame = useCurrentFrame();
  const globalFrame = scene.from + localFrame;
  const activeCue = findSceneCue(scene, localFrame);
  const energy = energyAt(globalFrame);

  const definedIdx = cueIndexFor('defined', scene.firstWordIndex);
  const mathIdx = cueIndexFor('math.', definedIdx);
  const sameInputsIdx = cueIndexFor('Same inputs.', mathIdx);
  const sameFramesIdx = cueIndexFor('Same frames.', sameInputsIdx + 1);
  const noTemplateIdx = cueIndexFor('No template roulette.', sameFramesIdx + 1);

  const subtleGridBreath = 0.07 + 0.025 * (0.5 + 0.5 * Math.sin(localFrame * 0.08));

  return (
    <SceneContainer>
      <SceneAudioBed scene={scene} />
      <Sequence
        from={WORD_START_FRAMES[definedIdx] - scene.from}
        durationInFrames={14}
        layout="none"
        name="mechanism-math-lock-sfx"
      >
        <Audio src={staticFile(SFX_PATHS.slashImpact)} volume={0.32} />
      </Sequence>
      <Sequence
        from={WORD_START_FRAMES[noTemplateIdx] - scene.from}
        durationInFrames={14}
        layout="none"
        name="mechanism-zero-roulette-sfx"
      >
        <Audio src={staticFile(SFX_PATHS.slashImpact)} volume={0.34} />
      </Sequence>
      <SceneStage
        scene={scene}
        localFrame={localFrame}
        activeCue={activeCue}
        background={<CleanCoordinateGrid gridOpacity={subtleGridBreath} glowOpacity={0.038} />}
        threeD={<SceneThreeCanvas scene={scene} localFrame={localFrame} energy={energy} baseZ={13.5} opacity={0.44} />}
        typography={
          <>
            <ConnectedAtmosphericOverlays scene={scene} energy={energy} activeCue={activeCue} />
            <SceneKineticStage scene={scene} activeCue={activeCue} />
          </>
        }
      />
    </SceneContainer>
  );
};
