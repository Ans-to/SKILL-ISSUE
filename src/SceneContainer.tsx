import React from 'react';
import {AbsoluteFill} from 'remotion';
import {TelemetryHud} from './TelemetryHud';

/**
 * Explicit Z-index elevation stack across the 1080x1920 canvas.
 * Every visual plane is mounted as an independent `position: 'absolute'` layer
 * with zero single-board flex/grid wrapper grouping background widgets and central text.
 */
export const CANVAS_Z_LAYERS = {
  coordinateGrid: 1,
  webglDepth: 10,
  uiBackgroundWidget: 20,
  terminalBox: 30,
  atmosphericCalibration: 36,
  clauseRibbon: 42,
  heroKineticText: 55,
  conflictFlash: 65,
  hudHeader: 75,
  hudFooter: 76,
} as const;

/**
 * Full-bleed 1080x1920 root canvas container.
 * Mounts independent z-indexed absolute layers directly without grouping wrappers.
 */
export const SceneContainer: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill
    data-canvas-root="1080x1920"
    data-layer-architecture="decoupled-absolute-z"
    style={{
      position: 'relative',
      backgroundColor: '#0b0f19',
      width: 1080,
      height: 1920,
      overflow: 'hidden',
    }}
  >
    {children}
    <TelemetryHud />
  </AbsoluteFill>
);
