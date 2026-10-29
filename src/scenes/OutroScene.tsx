import React from 'react';
import {Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {getCinematographyState} from '../EmotionalPacing';
import {SceneKineticStage} from '../KineticEngine';
import {SceneAudioBed, SFX_PATHS} from '../SceneAudio';
import {SceneContainer} from '../SceneContainer';
import {ConnectedAtmosphericOverlays} from '../TelemetryHud';
import {
  OUTRO_BUILD_INDEX,
  SCENE_MAP,
  SCRIPT_CUES,
  WORD_START_FRAMES,
  cueAfter,
  energyAt,
  findSceneCue,
  type SceneSpec,
} from '../engine/agentEngineModel';
import {CleanCoordinateGrid, SceneStage, SceneThreeCanvas} from './SceneStage';

export const OutroScene: React.FC<{scene?: SceneSpec}> = ({scene = SCENE_MAP.outro}) => {
  const localFrame = useCurrentFrame();
  const globalFrame = scene.from + localFrame;
  const activeCue = findSceneCue(scene, localFrame);
  const energy = energyAt(globalFrame);
  const buildPhase = globalFrame >= SCRIPT_CUES[OUTRO_BUILD_INDEX].startFrame;
  const toysCue = cueAfter('toys.', scene.firstWordIndex);
  const cinema = getCinematographyState(scene, localFrame);

  return (
    <SceneContainer>
      <SceneAudioBed scene={scene} />
      <Sequence
        from={WORD_START_FRAMES[OUTRO_BUILD_INDEX] - scene.from}
        durationInFrames={14}
        layout="none"
        name="outro-build-lock-sfx"
      >
        <Audio src={staticFile(SFX_PATHS.slashImpact)} volume={0.36} />
      </Sequence>
      <Sequence
        from={WORD_START_FRAMES[toysCue.globalIndex] - scene.from}
        durationInFrames={14}
        layout="none"
        name="outro-toys-final-sfx"
      >
        <Audio src={staticFile(SFX_PATHS.slashImpact)} volume={0.38} />
      </Sequence>
      <SceneStage
        scene={scene}
        localFrame={localFrame}
        activeCue={activeCue}
        background={
          <CleanCoordinateGrid
            gridOpacity={0.075}
            glowOpacity={buildPhase ? 0.085 + energy * 0.045 : 0.042}
          />
        }
        threeD={<SceneThreeCanvas scene={scene} localFrame={localFrame} energy={energy} baseZ={13.2} opacity={0.44} />}
        overlays={<ConnectedAtmosphericOverlays scene={scene} energy={energy} activeCue={activeCue} />}
        typography={<SceneKineticStage scene={scene} activeCue={activeCue} foregroundShakeX={cinema.shakeX * 1.15} />}
      />
    </SceneContainer>
  );
};
