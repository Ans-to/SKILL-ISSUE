import React from 'react';
import {useCurrentFrame} from 'remotion';
import {
  BW_SCENES,
  computeSpatialSceneEnvelope,
  getContinuousCameraRig,
} from '../brettonWoodsModel';
import {BrettonWoodsHeroKineticLayer} from '../BrettonWoodsKineticEngine';
import {BrettonWoodsUiSimulation} from '../BrettonWoodsUiSimulation';

const SCENE = BW_SCENES[3];

const SceneBody: React.FC<{
  localFrame: number;
  widthOverride?: number;
  heightOverride?: number;
}> = ({localFrame, widthOverride, heightOverride}) => {
  const globalFrame = SCENE.sequenceFrom + localFrame;
  const spatialEnvelope = computeSpatialSceneEnvelope(SCENE, localFrame);
  const rig = getContinuousCameraRig(globalFrame);

  return (
    <>
      <BrettonWoodsUiSimulation
        sceneId={SCENE.id}
        globalFrame={globalFrame}
        spatialEnvelope={spatialEnvelope}
        cameraPanX={rig.camX}
        widthOverride={widthOverride}
        heightOverride={heightOverride}
      />
      <BrettonWoodsHeroKineticLayer
        sceneId={SCENE.id}
        globalFrame={globalFrame}
        spatialEnvelope={spatialEnvelope}
        cameraPanX={rig.camX}
        widthOverride={widthOverride}
        heightOverride={heightOverride}
      />
    </>
  );
};

const ConnectedScene: React.FC = () => {
  const localFrame = useCurrentFrame();
  return <SceneBody localFrame={localFrame} />;
};

export const HeavyCrownConclusionScene: React.FC<{
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
