import React from 'react';
import {Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {getCinematographyState} from '../EmotionalPacing';
import {SceneKineticStage} from '../KineticEngine';
import {SceneAudioBed, SFX_PATHS} from '../SceneAudio';
import {SceneContainer} from '../SceneContainer';
import {ConnectedAtmosphericOverlays} from '../TelemetryHud';
import {
  SCENE_MAP,
  WORD_START_FRAMES,
  cueAfter,
  energyAt,
  findSceneCue,
  type SceneSpec,
} from '../engine/agentEngineModel';
import {CleanCoordinateGrid, SceneStage, SceneThreeCanvas} from './SceneStage';

export const TwistScene: React.FC<{scene?: SceneSpec}> = ({scene = SCENE_MAP.twist}) => {
  const localFrame = useCurrentFrame();
  const globalFrame = scene.from + localFrame;
  const activeCue = findSceneCue(scene, localFrame);
  const energy = energyAt(globalFrame);
  const realCue = cueAfter('Real', scene.firstWordIndex);
  const breakCue = cueAfter('break.', scene.firstWordIndex);
  const broken = globalFrame >= breakCue.startFrame;
  const realLocalFrame = WORD_START_FRAMES[realCue.globalIndex] - scene.from;
  const breakLocalFrame = WORD_START_FRAMES[breakCue.globalIndex] - scene.from;
  const cinema = getCinematographyState(scene, localFrame);

  return (
    <SceneContainer>
      <SceneAudioBed scene={scene} />
      <Sequence from={realLocalFrame} durationInFrames={8} layout="none" name="twist-stress-sfx">
        <Audio src={staticFile(SFX_PATHS.clickAccent)} volume={0.28} />
      </Sequence>
      <Sequence from={breakLocalFrame} durationInFrames={16} layout="none" name="twist-fracture-slash-sfx">
        <Audio src={staticFile(SFX_PATHS.slashImpact)} volume={0.44} />
      </Sequence>
      <SceneStage
        scene={scene}
        localFrame={localFrame}
        activeCue={activeCue}
        background={
          <CleanCoordinateGrid
            gridOpacity={0.075}
            glowOpacity={broken ? 0.095 + energy * 0.05 : 0.04}
          />
        }
        threeD={<SceneThreeCanvas scene={scene} localFrame={localFrame} energy={energy} baseZ={13.5} opacity={0.44} />}
        overlays={<ConnectedAtmosphericOverlays scene={scene} energy={energy} activeCue={activeCue} />}
        typography={<SceneKineticStage scene={scene} activeCue={activeCue} foregroundShakeX={cinema.shakeX * 1.15} />}
      />
    </SceneContainer>
  );
};
