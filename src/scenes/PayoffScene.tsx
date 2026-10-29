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

export const PayoffScene: React.FC<{scene?: SceneSpec}> = ({scene = SCENE_MAP.payoff}) => {
  const localFrame = useCurrentFrame();
  const globalFrame = scene.from + localFrame;
  const activeCue = findSceneCue(scene, localFrame);
  const energy = energyAt(globalFrame);

  const promptCue = cueAfter('prompt', scene.firstWordIndex);
  const codeCue = cueAfter('code,', promptCue.globalIndex);
  const framesCue = cueAfter('frames,', codeCue.globalIndex);
  const mp4Cue = cueAfter('MP4.', framesCue.globalIndex);
  const subtleGridBreath = 0.07 + 0.025 * (0.5 + 0.5 * Math.sin(localFrame * 0.08));
  const cinema = getCinematographyState(scene, localFrame);

  return (
    <SceneContainer>
      <SceneAudioBed scene={scene} />
      {[promptCue, codeCue, framesCue].map((stageCue) => (
        <Sequence
          key={stageCue.globalIndex}
          from={WORD_START_FRAMES[stageCue.globalIndex] - scene.from}
          durationInFrames={8}
          layout="none"
          name={`payoff-stage-${stageCue.globalIndex}`}
        >
          <Audio src={staticFile(SFX_PATHS.clickAccent)} volume={0.28} />
        </Sequence>
      ))}
      <Sequence
        from={WORD_START_FRAMES[mp4Cue.globalIndex] - scene.from}
        durationInFrames={16}
        layout="none"
        name="payoff-mp4-lock-sfx"
      >
        <Audio src={staticFile(SFX_PATHS.slashImpact)} volume={0.38} />
      </Sequence>
      <SceneStage
        scene={scene}
        localFrame={localFrame}
        activeCue={activeCue}
        background={<CleanCoordinateGrid gridOpacity={subtleGridBreath} glowOpacity={0.04} />}
        threeD={<SceneThreeCanvas scene={scene} localFrame={localFrame} energy={energy} baseZ={13.3} opacity={0.42} />}
        overlays={<ConnectedAtmosphericOverlays scene={scene} energy={energy} activeCue={activeCue} />}
        typography={<SceneKineticStage scene={scene} activeCue={activeCue} foregroundShakeX={cinema.shakeX * 1.15} />}
      />
    </SceneContainer>
  );
};
