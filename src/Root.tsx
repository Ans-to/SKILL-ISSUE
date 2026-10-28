import React from 'react';
import {AbsoluteFill, Audio, Composition, Sequence, staticFile} from 'remotion';
import {
  MotionEngine as AfterEffectsMotion,
  MOTION_ENGINE_DURATION_FRAMES,
} from './engine/MotionEngine';
import {DURATION_FRAMES, FPS, OBSIDIAN, SCENE_MAP} from './engine/agentEngineModel';
import {SceneHook} from './engine/SceneHook';
import {SceneTwist} from './engine/SceneTwist';
import {SceneShift} from './engine/SceneShift';
import {SceneMechanism} from './engine/SceneMechanism';
import {ScenePayoff} from './engine/ScenePayoff';
import {SceneOutro} from './engine/SceneOutro';

/**
 * Decoupled multi-Sequence composition:
 * Each beat mounts only within its exact [from, from + durationInFrames) window,
 * clears cleanly before unmounting, and never leaks DOM, state, or 3D geometry across cuts.
 */
export const EngineFirstExplainer: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: OBSIDIAN, overflow: 'hidden'}}>
    <Sequence
      name="01-Hook"
      from={SCENE_MAP.hook.from}
      durationInFrames={SCENE_MAP.hook.durationInFrames}
    >
      <SceneHook scene={SCENE_MAP.hook} />
    </Sequence>

    <Sequence
      name="02-Twist"
      from={SCENE_MAP.twist.from}
      durationInFrames={SCENE_MAP.twist.durationInFrames}
    >
      <SceneTwist scene={SCENE_MAP.twist} />
    </Sequence>

    <Sequence
      name="03-Shift"
      from={SCENE_MAP.shift.from}
      durationInFrames={SCENE_MAP.shift.durationInFrames}
    >
      <SceneShift scene={SCENE_MAP.shift} />
    </Sequence>

    <Sequence
      name="04-Mechanism"
      from={SCENE_MAP.mechanism.from}
      durationInFrames={SCENE_MAP.mechanism.durationInFrames}
    >
      <SceneMechanism scene={SCENE_MAP.mechanism} />
    </Sequence>

    <Sequence
      name="05-Payoff"
      from={SCENE_MAP.payoff.from}
      durationInFrames={SCENE_MAP.payoff.durationInFrames}
    >
      <ScenePayoff scene={SCENE_MAP.payoff} />
    </Sequence>

    <Sequence
      name="06-Outro"
      from={SCENE_MAP.outro.from}
      durationInFrames={SCENE_MAP.outro.durationInFrames}
    >
      <SceneOutro scene={SCENE_MAP.outro} />
    </Sequence>

    <Audio src={staticFile('agent-engine/voiceover.wav')} />
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="TheCodeThatReplacedAfterEffects"
      component={AfterEffectsMotion}
      durationInFrames={MOTION_ENGINE_DURATION_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="EngineFirstExplainer"
      component={EngineFirstExplainer}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  </>
);
