import React from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {spring} from 'remotion';
import {
  COMP_HEIGHT,
  COMP_WIDTH,
  FPS,
  OBSIDIAN,
  ORANGE,
  WHITE,
  clamp,
  isSceneCleared,
  type SceneSpec,
  type ScriptCue,
} from '../engine/agentEngineModel';

const BoundedCameraRig: React.FC<{
  localFrame: number;
  energy: number;
  baseZ?: number;
  dollyRange?: number;
  offsetY?: number;
}> = ({localFrame, energy, baseZ = 13.6, dollyRange = 1.4, offsetY = 0}) => {
  const camera = useThree((state) => state.camera);
  const dollyZ = clamp(baseZ - localFrame * 0.004 - energy * dollyRange, 10.2, 15.2);
  camera.position.set(0, offsetY, dollyZ);
  camera.lookAt(0, offsetY * 0.35, 0);
  return null;
};

export const SceneThreeCanvas: React.FC<{
  localFrame: number;
  energy: number;
  opacity?: number;
  baseZ?: number;
  dollyRange?: number;
  offsetY?: number;
  children: React.ReactNode;
}> = ({localFrame, energy, opacity = 0.44, baseZ = 13.6, dollyRange = 1.4, offsetY = 0, children}) => (
  <ThreeCanvas
    width={COMP_WIDTH}
    height={COMP_HEIGHT}
    dpr={1}
    camera={{position: [0, offsetY, baseZ], fov: 42, near: 0.1, far: 60}}
    gl={{antialias: true, alpha: true, powerPreference: 'high-performance'}}
    style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity}}
  >
    <BoundedCameraRig
      localFrame={localFrame}
      energy={energy}
      baseZ={baseZ}
      dollyRange={dollyRange}
      offsetY={offsetY}
    />
    <ambientLight intensity={0.72} />
    <pointLight position={[0, 2.4, 5.8]} color={ORANGE} intensity={0.85 + energy * 1.1} />
    <pointLight position={[-2.2, -2.5, 4.2]} color={WHITE} intensity={0.35} />
    {children}
  </ThreeCanvas>
);

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
