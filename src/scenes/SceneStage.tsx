import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {ContextualThreeBroll, ContextualVectorBroll} from '../ContextualBroll';
import {
  AmbientPrecisionGrid,
  CrimsonConflictFlashOverlay,
  getCinematographyState,
} from '../EmotionalPacing';
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
 * Separates background (+ contextual holographic vector B-roll + ambient precision grids),
 * Three.js WebGL depth, and 2D vector/kinetic typography, while applying emotional-pacing
 * brightness/contrast curves, `translateX` conflict screen-shake jitter, and crimson flashes.
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
  const cinema = getCinematographyState(scene, localFrame);

  return (
    <div
      data-scene-id={scene.id}
      data-scene-local-frame={localFrame}
      data-scene-cleared={cleared ? 'true' : 'false'}
      data-pacing-mode={cinema.mode}
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
          <div
            data-stage-shake={cinema.shakeX}
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              transform:
                cinema.shakeX !== 0
                  ? `translateX(${cinema.shakeX}px) scale(1.012)`
                  : undefined,
              filter: `brightness(${cinema.brightness.toFixed(3)}) contrast(${cinema.contrast.toFixed(3)})`,
            }}
          >
            <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
              {background}
              <AmbientPrecisionGrid opacity={cinema.ambientGridOpacity} mode={cinema.mode} />
              <ContextualVectorBroll scene={scene} localFrame={localFrame} />
            </div>
            <div style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'}}>
              {threeD}
            </div>
            <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>{typography}</div>
          </div>

          <CrimsonConflictFlashOverlay
            flash={cinema.crimsonFlash}
            conflictWord={cinema.conflictWord}
          />
        </>
      )}
    </div>
  );
};

/**
 * Full-canvas 1080x1920 scene-isolated Three.js WebGL camera rig.
 * Automatically mounts contextual 3D wireframe B-roll bursts when `scene` is provided.
 */
export const SceneThreeCanvas: React.FC<{
  scene?: SceneSpec;
  localFrame: number;
  energy: number;
  baseZ?: number;
  fov?: number;
  opacity?: number;
  children: React.ReactNode;
}> = ({scene, localFrame, energy, baseZ = 13.4, fov = 42, opacity = 0.58, children}) => (
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
    {scene && <ContextualThreeBroll scene={scene} localFrame={localFrame} />}
    {children}
  </ThreeCanvas>
);
