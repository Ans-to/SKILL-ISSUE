import React from 'react';
import {AbsoluteFill, Audio, Composition, Sequence, staticFile} from 'remotion';
import {
  MotionEngine as AfterEffectsMotion,
  MOTION_ENGINE_DURATION_FRAMES,
} from './engine/MotionEngine';
import {DURATION_FRAMES, FPS, OBSIDIAN, SCENE_MAP} from './engine/agentEngineModel';
import {HookScene} from './scenes/HookScene';
import {TwistScene} from './scenes/TwistScene';
import {ShiftScene} from './scenes/ShiftScene';
import {MechanismScene} from './scenes/MechanismScene';
import {PayoffScene} from './scenes/PayoffScene';
import {OutroScene} from './scenes/OutroScene';

const EXPECTED_BEATS = [
  [0, 153],
  [153, 213],
  [366, 279],
  [645, 408],
  [1053, 347],
  [1400, 147],
] as const;

[
  SCENE_MAP.hook,
  SCENE_MAP.twist,
  SCENE_MAP.shift,
  SCENE_MAP.mechanism,
  SCENE_MAP.payoff,
  SCENE_MAP.outro,
].forEach((scene, idx) => {
  const [from, durationInFrames] = EXPECTED_BEATS[idx];
  if (scene.from !== from || scene.durationInFrames !== durationInFrames) {
    throw new Error(`Root Sequence bounds out of sync for ${scene.id}`);
  }
});

export const Root: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: OBSIDIAN, overflow: 'hidden'}}>
    <Sequence durationInFrames={153} from={0} name="01-Hook">
      <HookScene />
    </Sequence>
    <Sequence durationInFrames={213} from={153} name="02-Twist">
      <TwistScene />
    </Sequence>
    <Sequence durationInFrames={279} from={366} name="03-Shift">
      <ShiftScene />
    </Sequence>
    <Sequence durationInFrames={408} from={645} name="04-Mechanism">
      <MechanismScene />
    </Sequence>
    <Sequence durationInFrames={347} from={1053} name="05-Payoff">
      <PayoffScene />
    </Sequence>
    <Sequence durationInFrames={147} from={1400} name="06-Outro">
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
      width={1920}
      height={1080}
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
