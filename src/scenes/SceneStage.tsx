import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {
  ConnectedContextualUiSimulation,
  ContextualThreeBroll,
  getActiveUiSimulations,
} from '../ContextualBroll';
import {
  CrimsonConflictFlashOverlay,
  getCinematographyState,
} from '../EmotionalPacing';
import {CANVAS_Z_LAYERS} from '../SceneContainer';
import {
  OBSIDIAN,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  isSceneCleared,
  type SceneSpec,
  type ScriptCue,
} from '../engine/agentEngineModel';
export {CANVAS_Z_LAYERS, SceneContainer} from '../SceneContainer';

export const CleanCoordinateGrid: React.FC<{
  gridOpacity?: number;
  glowOpacity?: number;
  zIndex?: number;
  dataAttrs?: Record<string, string | number | boolean>;
  style?: React.CSSProperties;
}> = ({gridOpacity = 0.08, glowOpacity = 0.04, zIndex = CANVAS_Z_LAYERS.coordinateGrid, dataAttrs, style}) => (
  <div
    data-canvas-layer="coordinate-grid"
    data-layer-z={zIndex}
    data-clean-coordinate-grid="true"
    {...dataAttrs}
    style={{
      position: 'absolute',
      inset: 0,
      zIndex,
      background: OBSIDIAN,
      overflow: 'hidden',
      pointerEvents: 'none',
      ...style,
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: gridOpacity * 0.58,
        backgroundImage:
          'linear-gradient(rgba(244,247,255,.32) 1px, transparent 1px), linear-gradient(90deg, rgba(244,247,255,.32) 1px, transparent 1px)',
        backgroundSize: '90px 90px',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: gridOpacity * 0.96,
        backgroundImage:
          'linear-gradient(rgba(244,247,255,.38) 1px, transparent 1px), linear-gradient(90deg, rgba(244,247,255,.38) 1px, transparent 1px)',
        backgroundSize: '360px 360px',
      }}
    />
    {glowOpacity > 0 && (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: glowOpacity,
          background:
            'radial-gradient(ellipse at 50% 45%, rgba(255,69,0,0.42) 0%, transparent 68%)',
        }}
      />
    )}
  </div>
);

/**
 * Decoupled multi-plane stage: mounts every visual layer directly onto the 1080x1920
 * root `<AbsoluteFill>` as independent `position: 'absolute'` siblings stratified by z-index
 * (z=1 grid, z=10 WebGL, z=20 UI widget, z=30 terminal box, z=36 calibration,
 * z=42 clause ribbon, z=55 hero kinetic text, z=65 conflict flash).
 * Zero parent flex, grid, or unified board container groups widgets with central text.
 */
export const SceneStage: React.FC<{
  scene: SceneSpec;
  localFrame: number;
  activeCue: ScriptCue | null;
  background?: React.ReactNode;
  threeD?: React.ReactNode;
  overlays?: React.ReactNode;
  typography: React.ReactNode;
}> = ({scene, localFrame, activeCue, background, threeD, overlays, typography}) => {
  const cleared = isSceneCleared(scene, localFrame);
  const cinema = getCinematographyState(scene, localFrame);

  if (cleared) {
    return (
      <CleanCoordinateGrid
        gridOpacity={0}
        glowOpacity={0}
        zIndex={CANVAS_Z_LAYERS.coordinateGrid}
        dataAttrs={{
          'data-scene-id': scene.id,
          'data-scene-local-frame': localFrame,
          'data-scene-cleared': 'true',
          'data-pacing-mode': cinema.mode,
          'data-active-word': -1,
        }}
      />
    );
  }

  return (
    <>
      {/* Layer z=1: Independent Background Coordinate Grid Plane */}
      {background ?? (
        <CleanCoordinateGrid
          gridOpacity={cinema.ambientGridOpacity}
          zIndex={CANVAS_Z_LAYERS.coordinateGrid}
          dataAttrs={{
            'data-scene-id': scene.id,
            'data-scene-local-frame': localFrame,
            'data-scene-cleared': 'false',
            'data-pacing-mode': cinema.mode,
            'data-active-word': activeCue ? activeCue.globalIndex : -1,
          }}
          style={{
            filter: `brightness(${cinema.brightness.toFixed(3)}) contrast(${cinema.contrast.toFixed(3)})`,
          }}
        />
      )}

      {/* Layer z=10: Independent Three.js WebGL Depth Plane */}
      {threeD}

      {/* Layers z=20 (UI Background Widget), z=30 (Terminal Box), z=42 (Clause Ribbon) */}
      <ConnectedContextualUiSimulation scene={scene} parallaxShakeX={cinema.shakeX} />

      {/* Layer z=36: Independent Atmospheric Calibration SVG Plane */}
      {overlays}

      {/* Layer z=55: Independent Foreground Hero Kinetic Typography Plane */}
      {typography}

      {/* Layer z=65: Independent Conflict Impact Flash Plane */}
      <CrimsonConflictFlashOverlay
        flash={cinema.crimsonFlash}
        conflictWord={cinema.conflictWord}
        zIndex={CANVAS_Z_LAYERS.conflictFlash}
      />
    </>
  );
};

export const SceneThreeCanvas: React.FC<{
  scene: SceneSpec;
  localFrame: number;
  energy: number;
  baseZ?: number;
  fov?: number;
  opacity?: number;
  children?: React.ReactNode;
}> = ({scene, localFrame, energy, baseZ = 13.4, fov = 42, opacity = 0.5, children}) => {
  const activeSims = getActiveUiSimulations(scene, localFrame);
  if (activeSims.length === 0 && !children) {
    return null;
  }

  return (
    <ThreeCanvas
      width={STAGE_WIDTH}
      height={STAGE_HEIGHT}
      dpr={1}
      camera={{
        position: [0, 0, baseZ - energy * 0.15],
        fov,
        near: 0.1,
        far: 70,
      }}
      gl={{antialias: true, alpha: true, powerPreference: 'high-performance'}}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: CANVAS_Z_LAYERS.webglDepth,
        width: '100%',
        height: '100%',
        opacity,
        pointerEvents: 'none',
      }}
    >
      <ambientLight intensity={0.9} />
      <ContextualThreeBroll scene={scene} localFrame={localFrame} />
      {children}
    </ThreeCanvas>
  );
};
