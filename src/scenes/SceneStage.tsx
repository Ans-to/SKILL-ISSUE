import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {
  OBSIDIAN,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  WHITE,
  isSceneCleared,
  type SceneSpec,
  type ScriptCue,
} from '../engine/agentEngineModel';
export {SceneContainer} from '../SceneContainer';

/**
 * Right-column interior stage wrapper inside <SceneContainer> (760x1920).
 * Keeps background, Three.js WebGL depth, and 2D vector/kinetic typography isolated
 * and enforces hard-cut clearing before each <Sequence> unmounts.
 */
export const SceneStage: React.FC<{
  scene: SceneSpec;
  localFrame: number;
  activeCue: ScriptCue | null;
  background: React.ReactNode;
  threeD: React.ReactNode;
  typography: React.ReactNode;
}> = ({scene, localFrame, activeCue, background, threeD, typography}) => {
  const cleared = isSceneCleared(scene, localFrame);

  return (
    <div
      data-scene-id={scene.id}
      data-scene-local-frame={localFrame}
      data-scene-cleared={cleared ? 'true' : 'false'}
      data-active-word={activeCue ? activeCue.globalIndex : -1}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: OBSIDIAN,
        color: WHITE,
        fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
        overflow: 'hidden',
      }}
    >
      {!cleared && (
        <>
          <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>{background}</div>
          <div style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'}}>
            {threeD}
          </div>
          <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>{typography}</div>
        </>
      )}
    </div>
  );
};

/**
 * Scene-isolated Three.js WebGL canvas sized strictly to the 760x1920 right column.
 */
export const SceneThreeCanvas: React.FC<{
  localFrame: number;
  energy: number;
  baseZ?: number;
  fov?: number;
  opacity?: number;
  children: React.ReactNode;
}> = ({localFrame, energy, baseZ = 14.4, fov = 44, opacity = 0.56, children}) => (
  <ThreeCanvas
    width={STAGE_WIDTH}
    height={STAGE_HEIGHT}
    dpr={1}
    camera={{
      position: [
        Math.sin(localFrame * 0.014) * 0.14,
        Math.cos(localFrame * 0.011) * 0.1,
        baseZ - energy * 0.36,
      ],
      fov,
      near: 0.1,
      far: 70,
    }}
    gl={{antialias: true, alpha: true, powerPreference: 'high-performance'}}
    style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity}}
  >
    <ambientLight intensity={0.9} />
    {children}
  </ThreeCanvas>
);
