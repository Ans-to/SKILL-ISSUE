import React from 'react';
import {AbsoluteFill, Audio, Composition, Sequence, staticFile} from 'remotion';
import {
  MotionEngine as AfterEffectsMotion,
  MOTION_ENGINE_DURATION_FRAMES,
} from './engine/MotionEngine';
import {DURATION_FRAMES, FPS, OBSIDIAN} from './engine/agentEngineModel';
import {HookScene} from './scenes/HookScene';
import {TwistScene} from './scenes/TwistScene';
import {ShiftScene} from './scenes/ShiftScene';
import {MechanismScene} from './scenes/MechanismScene';
import {PayoffScene} from './scenes/PayoffScene';
import {OutroScene} from './scenes/OutroScene';
export {SceneContainer} from './SceneContainer';

export const Root: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: OBSIDIAN, overflow: 'hidden'}}>
    <Sequence from={0} durationInFrames={153} name="01-Hook">
      <HookScene />
    </Sequence>
    <Sequence from={153} durationInFrames={213} name="02-Twist">
      <TwistScene />
    </Sequence>
    <Sequence from={366} durationInFrames={279} name="03-Shift">
      <ShiftScene />
    </Sequence>
    <Sequence from={645} durationInFrames={408} name="04-Mechanism">
      <MechanismScene />
    </Sequence>
    <Sequence from={1053} durationInFrames={347} name="05-Payoff">
      <PayoffScene />
    </Sequence>
    <Sequence from={1400} durationInFrames={147} name="06-Outro">
      <OutroScene />
    </Sequence>
    <Audio src={staticFile('agent-engine/voiceover.wav')} />
  </AbsoluteFill>
);

export const EngineFirstExplainer = Root;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="EngineFirstExplainer"
      component={Root}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="TheCodeThatReplacedAfterEffects"
      component={AfterEffectsMotion}
      durationInFrames={MOTION_ENGINE_DURATION_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  </>
);
