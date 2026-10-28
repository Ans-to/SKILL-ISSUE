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
 * Full-bleed 1080x1920 stage wrapper inside <SceneContainer>.
 * Separates background, Three.js WebGL depth, and 2D vector/kinetic typography
 * while enforcing clean hard-cut clears before each <Sequence> unmounts.
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
 * Full-canvas 1080x1920 scene-isolated Three.js WebGL camera rig.
 */
export const SceneThreeCanvas: React.FC<{
  localFrame: number;
  energy: number;
  baseZ?: number;
  fov?: number;
  opacity?: number;
  children: React.ReactNode;
}> = ({localFrame, energy, baseZ = 13.4, fov = 42, opacity = 0.58, children}) => (
  <ThreeCanvas
    width={STAGE_WIDTH}
    height={STAGE_HEIGHT}
    dpr={1}
    camera={{
      position: [
        Math.sin(localFrame * 0.014) * 0.16,
        Math.cos(localFrame * 0.011) * 0.12,
        baseZ - energy * 0.38,
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
