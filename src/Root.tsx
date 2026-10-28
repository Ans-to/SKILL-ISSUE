import React from 'react';
import {Composition} from 'remotion';
import {MotionEngine as AfterEffectsMotion, MOTION_ENGINE_DURATION_FRAMES} from './engine/MotionEngine';
import {MotionEngine as AgentEngineMotion, MOTION_ENGINE_DURATION_FRAMES as AGENT_ENGINE_DURATION_FRAMES} from './engine/AgentEngineMotion';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="TheCodeThatReplacedAfterEffects"
      component={AfterEffectsMotion}
      durationInFrames={MOTION_ENGINE_DURATION_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="EngineFirstExplainer"
      component={AgentEngineMotion}
      durationInFrames={AGENT_ENGINE_DURATION_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
