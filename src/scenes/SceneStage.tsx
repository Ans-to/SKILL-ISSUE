import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {
  ContextualThreeBroll,
  ContextualVectorBroll,
  getActiveBrollBursts,
} from '../ContextualBroll';
import {
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
 * Clean, subtle, non-distracting architectural coordinate grid on deep obsidian (#0b0f19).
 * Zero random grid dots, zero orbital circles, zero unscripted geometric loops.
 */
export const CleanCoordinateGrid: React.FC<{
  gridOpacity?: number;
  glowOpacity?: number;
}> = ({gridOpacity = 0.085, glowOpacity = 0.05}) => (
  <div
    data-clean-coordinate-grid="true"
    style={{position: 'absolute', inset: 0, background: OBSIDIAN, overflow: 'hidden'}}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 50% 48%, rgba(255,69,0,${glowOpacity.toFixed(3)}), transparent 56%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: gridOpacity,
        backgroundImage:
          'linear-gradient(rgba(244,247,255,.32) 1px, transparent 1px), linear-gradient(90deg, rgba(244,247,255,.32) 1px, transparent 1px)',
        backgroundSize: '90px 90px',
      }}
    />
  </div>
);

/**
 * Full-bleed 1080x1920 stage wrapper inside <SceneContainer>.
 * Keeps the background strictly clean with a subtle coordinate grid unless a
 * semantic token ('neural' | 'syntax' | 'math') explicitly invokes a localized B-roll burst.
 */
export const SceneStage: React.FC<{
  scene: SceneSpec;
  localFrame: number;
  activeCue: ScriptCue | null;
  background?: React.ReactNode;
  threeD?: React.ReactNode;
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
              {background ?? (
                <CleanCoordinateGrid
                  gridOpacity={cinema.ambientGridOpacity}
                  glowOpacity={cinema.mode === 'tension' ? 0.065 : 0.038}
                />
              )}
              <ContextualVectorBroll scene={scene} localFrame={localFrame} />
            </div>
            {threeD && (
              <div style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'}}>
                {threeD}
              </div>
            )}
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
 * Semantic-gated 1080x1920 Three.js WebGL stage.
 * Only mounts when a narrative semantic B-roll burst is active (or explicit children exist),
 * eliminating all unscripted continuous 3D background loops and random shapes.
 */
export const SceneThreeCanvas: React.FC<{
  scene: SceneSpec;
  localFrame: number;
  energy: number;
  baseZ?: number;
  fov?: number;
  opacity?: number;
  children?: React.ReactNode;
}> = ({scene, localFrame, energy, baseZ = 13.4, fov = 42, opacity = 0.56, children}) => {
  const activeBursts = getActiveBrollBursts(scene, localFrame);
  if (activeBursts.length === 0 && !children) {
    return null;
  }

  return (
    <ThreeCanvas
      width={STAGE_WIDTH}
      height={STAGE_HEIGHT}
      dpr={1}
      camera={{
        position: [0, 0, baseZ - energy * 0.2],
        fov,
        near: 0.1,
        far: 70,
      }}
      gl={{antialias: true, alpha: true, powerPreference: 'high-performance'}}
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity}}
    >
      <ambientLight intensity={0.9} />
      <ContextualThreeBroll scene={scene} localFrame={localFrame} />
      {children}
    </ThreeCanvas>
  );
};
