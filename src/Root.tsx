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

export type RootProps = {
  title?: string;
  compositionId?: string;
  backgroundColor?: string;
  accentColor?: string;
  voiceoverFile?: string;
  muted?: boolean;
};

export const DEFAULT_ROOT_PROPS: Required<RootProps> = {
  title: 'Engine-First AI Agent Documentary',
  compositionId: 'Root',
  backgroundColor: OBSIDIAN,
  accentColor: '#ff4500',
  voiceoverFile: 'agent-engine/voiceover.wav',
  muted: false,
};

export const Root: React.FC<RootProps> = ({
  title = DEFAULT_ROOT_PROPS.title,
  backgroundColor = DEFAULT_ROOT_PROPS.backgroundColor,
  voiceoverFile = DEFAULT_ROOT_PROPS.voiceoverFile,
  muted = DEFAULT_ROOT_PROPS.muted,
}) => (
  <AbsoluteFill
    data-root-title={title}
    style={{backgroundColor, overflow: 'hidden'}}
  >
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
    {!muted && <Audio src={staticFile(voiceoverFile)} />}
  </AbsoluteFill>
);

export const EngineFirstExplainer = Root;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Root"
      component={Root}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={DEFAULT_ROOT_PROPS}
    />
    <Composition
      id="EngineFirstExplainer"
      component={Root}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={DEFAULT_ROOT_PROPS}
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
