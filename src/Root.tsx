import React from 'react';
import {Composition} from 'remotion';
import {MotionEngine, MOTION_ENGINE_DURATION_FRAMES} from './engine/MotionEngine';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="NokiaDocumentary"
    component={MotionEngine}
    durationInFrames={MOTION_ENGINE_DURATION_FRAMES}
    fps={30}
    width={1920}
    height={1080}
  />
);
