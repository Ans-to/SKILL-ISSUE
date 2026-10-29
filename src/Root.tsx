import React from 'react';
import {AbsoluteFill, Audio, Composition, Sequence, staticFile} from 'remotion';
import {
  BrettonWoodsDocumentary,
  DEFAULT_BRETTON_WOODS_PROPS,
  type BrettonWoodsProps,
} from './bretton-woods/BrettonWoodsDocumentary';
import {
  CinematicSceneMaster,
  type CinematicSceneMasterProps,
} from './bretton-woods/CinematicSceneMaster';
import {
  BW_DURATION_FRAMES,
  BW_FPS,
  BW_HEIGHT,
  BW_VERTICAL_HEIGHT,
  BW_VERTICAL_WIDTH,
  BW_WIDTH,
} from './bretton-woods/brettonWoodsModel';
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
export {
  BrettonWoodsDocumentary,
  CinematicSceneMaster,
  DEFAULT_BRETTON_WOODS_PROPS,
};
export type {CinematicSceneMasterProps};

export type RootProps = BrettonWoodsProps;

export const DEFAULT_ROOT_PROPS = DEFAULT_BRETTON_WOODS_PROPS;

export const DEFAULT_ENGINE_FIRST_PROPS: Required<BrettonWoodsProps> = {
  title: 'Engine-First AI Agent Documentary',
  compositionId: 'EngineFirstExplainer',
  backgroundColor: OBSIDIAN,
  accentColor: '#ff4500',
  voiceoverFile: 'agent-engine/voiceover.wav',
  muted: false,
};

export const EngineFirstExplainer: React.FC<BrettonWoodsProps> = ({
  title = DEFAULT_ENGINE_FIRST_PROPS.title,
  backgroundColor = DEFAULT_ENGINE_FIRST_PROPS.backgroundColor,
  voiceoverFile = DEFAULT_ENGINE_FIRST_PROPS.voiceoverFile,
  muted = DEFAULT_ENGINE_FIRST_PROPS.muted,
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

export const Root = BrettonWoodsDocumentary;

export const RemotionRoot: React.FC = () => (
  <>
    {/* Primary 16:9 Landscape YouTube Composition (1920x1080) */}
    <Composition
      id="Root"
      component={BrettonWoodsDocumentary}
      durationInFrames={BW_DURATION_FRAMES}
      fps={BW_FPS}
      width={BW_WIDTH}
      height={BW_HEIGHT}
      defaultProps={DEFAULT_BRETTON_WOODS_PROPS}
    />
    <Composition
      id="BrettonWoodsLandscape"
      component={BrettonWoodsDocumentary}
      durationInFrames={BW_DURATION_FRAMES}
      fps={BW_FPS}
      width={BW_WIDTH}
      height={BW_HEIGHT}
      defaultProps={DEFAULT_BRETTON_WOODS_PROPS}
    />
    <Composition
      id="BrettonWoodsDocumentary"
      component={BrettonWoodsDocumentary}
      durationInFrames={BW_DURATION_FRAMES}
      fps={BW_FPS}
      width={BW_WIDTH}
      height={BW_HEIGHT}
      defaultProps={DEFAULT_BRETTON_WOODS_PROPS}
    />

    {/* Proportional 9:16 Vertical Shorts Composition (1080x1920) */}
    <Composition
      id="BrettonWoodsVertical"
      component={BrettonWoodsDocumentary}
      durationInFrames={BW_DURATION_FRAMES}
      fps={BW_FPS}
      width={BW_VERTICAL_WIDTH}
      height={BW_VERTICAL_HEIGHT}
      defaultProps={DEFAULT_BRETTON_WOODS_PROPS}
    />
    <Composition
      id="BrettonWoodsShorts"
      component={BrettonWoodsDocumentary}
      durationInFrames={BW_DURATION_FRAMES}
      fps={BW_FPS}
      width={BW_VERTICAL_WIDTH}
      height={BW_VERTICAL_HEIGHT}
      defaultProps={DEFAULT_BRETTON_WOODS_PROPS}
    />

    {/* Direct Standalone Master Template Composition */}
    <Composition
      id="CinematicSceneMaster"
      component={CinematicSceneMaster}
      durationInFrames={BW_DURATION_FRAMES}
      fps={BW_FPS}
      width={BW_WIDTH}
      height={BW_HEIGHT}
      defaultProps={{
        title: 'THE KING OF CURRENCIES',
        subtitle: 'BRETTON WOODS · GLOBAL DOLLAR STANDARD',
        metric: '88% FX SHARE',
        metricLabel: 'GLOBAL TRADE & TREASURY RESERVE ANCHOR',
      }}
    />

    {/* Preserved Legacy Compositions */}
    <Composition
      id="EngineFirstExplainer"
      component={EngineFirstExplainer}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={DEFAULT_ENGINE_FIRST_PROPS}
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
