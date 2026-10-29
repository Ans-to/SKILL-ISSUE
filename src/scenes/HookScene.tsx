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

export const HookScene: React.FC<{scene?: SceneSpec}> = ({scene = SCENE_MAP.hook}) => {
  const localFrame = useCurrentFrame();
  const globalFrame = scene.from + localFrame;
  const activeCue = findSceneCue(scene, localFrame);
  const energy = energyAt(globalFrame);
  const pastedCue = cueAfter('pasted', scene.firstWordIndex);
  const pastedLocalFrame = WORD_START_FRAMES[pastedCue.globalIndex] - scene.from;
  const cinema = getCinematographyState(scene, localFrame);

  return (
    <SceneContainer>
      <SceneAudioBed scene={scene} />
      <Sequence from={pastedLocalFrame} durationInFrames={14} layout="none" name="hook-clone-stamp-sfx">
        <Audio src={staticFile(SFX_PATHS.slashImpact)} volume={0.32} />
      </Sequence>
      <SceneStage
        scene={scene}
        localFrame={localFrame}
        activeCue={activeCue}
        background={<CleanCoordinateGrid gridOpacity={0.075} glowOpacity={0.05 + energy * 0.035} />}
        threeD={<SceneThreeCanvas scene={scene} localFrame={localFrame} energy={energy} baseZ={13.5} />}
        overlays={<ConnectedAtmosphericOverlays scene={scene} energy={energy} activeCue={activeCue} />}
        typography={<SceneKineticStage scene={scene} activeCue={activeCue} foregroundShakeX={cinema.shakeX * 1.15} />}
      />
    </SceneContainer>
  );
};
