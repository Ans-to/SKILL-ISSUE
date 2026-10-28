import React from 'react';
import {AbsoluteFill} from 'remotion';
import {TelemetryHud} from './TelemetryHud';

/**
 * Full-bleed 1080x1920 cinematic scene container (zero fixed sidebar).
 * Gives 100% of the 1080x1920 canvas to kinetic typography, 3D depth, and
 * scene-animated floating HUD / tactical lower-third overlays.
 */
export const SceneContainer: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill
    style={{
      position: 'relative',
      backgroundColor: '#0b0f19',
      width: 1080,
      height: 1920,
      overflow: 'hidden',
    }}
  >
    {/* Full 1080x1920 Stage: Background, 3D WebGL, Wireframes & Kinetic Typography */}
    <div style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      {children}
    </div>

    {/* Dynamic Floating HUD & Tactical Lower-Third Overlays (animates in/out per scene) */}
    <TelemetryHud />
  </AbsoluteFill>
);
