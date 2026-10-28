import React from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {spring} from 'remotion';
import {
  FPS,
  OBSIDIAN,
  ORANGE,
  WHITE,
  clamp,
  isSceneCleared,
  type SceneSpec,
  type ScriptCue,
} from './agentEngineModel';

const BoundedCameraRig: React.FC<{
  localFrame: number;
  energy: number;
  baseZ?: number;
  dollyRange?: number;
  offsetX?: number;
}> = ({localFrame, energy, baseZ = 12.8, dollyRange = 1.4, offsetX = 0}) => {
  const camera = useThree((state) => state.camera);
  const dollyZ = clamp(baseZ - localFrame * 0.004 - energy * dollyRange, 9.8, 14.5);
  camera.position.set(offsetX, 0, dollyZ);
  camera.lookAt(offsetX * 0.35, 0, 0);
  return null;
};

export const SceneThreeCanvas: React.FC<{
  localFrame: number;
  energy: number;
  opacity?: number;
  baseZ?: number;
  dollyRange?: number;
  offsetX?: number;
  children: React.ReactNode;
}> = ({localFrame, energy, opacity = 0.46, baseZ = 12.8, dollyRange = 1.4, offsetX = 0, children}) => (
  <ThreeCanvas
    width={1920}
    height={1080}
    dpr={1}
    camera={{position: [offsetX, 0, baseZ], fov: 38, near: 0.1, far: 60}}
    gl={{antialias: true, alpha: true, powerPreference: 'high-performance'}}
    style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity}}
  >
    <BoundedCameraRig
      localFrame={localFrame}
      energy={energy}
      baseZ={baseZ}
      dollyRange={dollyRange}
      offsetX={offsetX}
    />
    <ambientLight intensity={0.72} />
    <pointLight position={[0, 2.4, 5.5]} color={ORANGE} intensity={0.85 + energy * 1.1} />
    <pointLight position={[-3, -2, 4]} color={WHITE} intensity={0.35} />
    {children}
  </ThreeCanvas>
);

/**
 * Isolated per-Sequence 3-layer stage:
 * 1) Background grid state (zIndex 0)
 * 2) Procedural Three.js depth layer (zIndex 2, never carries text)
 * 3) Front-facing 2D kinetic typography, wireframes, and live telemetry (zIndex 10)
 * Clears completely to pure obsidian before the Sequence unmounts.
 */
export const SceneStage: React.FC<{
  scene: SceneSpec;
  localFrame: number;
  activeCue: ScriptCue | null;
  background: React.ReactNode;
  threeD: React.ReactNode;
  typography: React.ReactNode;
}> = ({scene, localFrame, activeCue, background, threeD, typography}) => {
  if (isSceneCleared(scene, localFrame)) {
    return (
      <div
        data-scene-id={scene.id}
        data-scene-cleared="true"
        style={{position: 'absolute', inset: 0, backgroundColor: OBSIDIAN}}
      />
    );
  }

  const entry = spring({
    frame: localFrame,
    fps: FPS,
    config: {damping: 14, stiffness: 220},
  });

  return (
    <div
      data-scene-id={scene.id}
      data-active-cue={activeCue?.globalIndex ?? -1}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        isolation: 'isolate',
        backgroundColor: OBSIDIAN,
        opacity: clamp(entry * 1.15, 0.25, 1),
      }}
    >
      <div data-layer="1-background" style={{position: 'absolute', inset: 0, zIndex: 0}}>
        {background}
      </div>
      <div data-layer="2-three-dimensional" style={{position: 'absolute', inset: 0, zIndex: 2}}>
        {threeD}
      </div>
      <div
        data-layer="10-two-dimensional-type"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          pointerEvents: 'none',
          color: WHITE,
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        {typography}
      </div>
    </div>
  );
};
