import React from 'react';
import {useCurrentFrame} from 'remotion';
import {BW_SCENES, computeSpatialSceneEnvelope} from '../brettonWoodsModel';
import {resolveBrettonBeat} from '../BrettonWoodsKineticEngine';
import {
  BrettonSpokenSubtitleLayer,
  renderBrettonVisualIllustration,
} from '../BrettonWoodsUiSimulation';
import {CinematicSceneMaster} from '../CinematicSceneMaster';

const SCENE = BW_SCENES[0];

const SceneBody: React.FC<{
  localFrame: number;
  widthOverride?: number;
  heightOverride?: number;
}> = ({localFrame, widthOverride, heightOverride}) => {
  const globalFrame = SCENE.sequenceFrom + localFrame;
  const spatialEnvelope = computeSpatialSceneEnvelope(SCENE, localFrame);
  const beat = resolveBrettonBeat(SCENE.id, globalFrame);

  return (
    <CinematicSceneMaster
      title={beat.title}
      subtitle={beat.subtitle}
      metric={beat.metric}
      metricLabel={beat.metricLabel}
      accentColor={beat.accentColor}
      motionProfile={beat.window.profile}
      variantSeed={beat.window.physicsVariant}
      beatStartFrame={beat.window.startFrame}
      globalFrameOverride={globalFrame}
      widthOverride={widthOverride}
      heightOverride={heightOverride}
      spatialEnvelope={spatialEnvelope}
      renderBackground={false}
      visualIllustration={renderBrettonVisualIllustration(SCENE.id, globalFrame)}
      spokenSubtitle={
        <BrettonSpokenSubtitleLayer
          sceneId={SCENE.id}
          globalFrame={globalFrame}
          spatialEnvelope={spatialEnvelope}
          widthOverride={widthOverride}
          heightOverride={heightOverride}
        />
      }
    />
  );
};

const ConnectedScene: React.FC = () => {
  const localFrame = useCurrentFrame();
  return <SceneBody localFrame={localFrame} />;
};

export const GlobalStandardScene: React.FC<{
  localFrameOverride?: number;
  widthOverride?: number;
  heightOverride?: number;
}> = ({localFrameOverride, widthOverride, heightOverride}) => {
  if (localFrameOverride !== undefined) {
    return (
      <SceneBody
        localFrame={localFrameOverride}
        widthOverride={widthOverride}
        heightOverride={heightOverride}
      />
    );
  }
  return <ConnectedScene />;
};
