import React from 'react';
import {useCurrentFrame} from 'remotion';
import {
  BW_SCENES,
  computeSpatialSceneEnvelope,
  getContinuousCameraRig,
} from '../brettonWoodsModel';
import {BrettonWoodsHeroKineticLayer} from '../BrettonWoodsKineticEngine';
import {BrettonWoodsUiSimulation} from '../BrettonWoodsUiSimulation';

const SCENE = BW_SCENES[1];

export const BrettonWoodsOriginScene: React.FC<{localFrameOverride?: number}> = ({
  localFrameOverride,
}) => {
  const seqFrame = useCurrentFrame();
  const localFrame = localFrameOverride ?? seqFrame;
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
      />
      <BrettonWoodsHeroKineticLayer
        sceneId={SCENE.id}
        globalFrame={globalFrame}
        spatialEnvelope={spatialEnvelope}
        cameraPanX={rig.camX}
      />
    </>
  );
};
