import React from 'react';
import {AbsoluteFill} from 'remotion';
import {TelemetryHud} from './TelemetryHud';

// INTERIOR COMPONENT LAYOUT OVERRIDE:
// Every scene component (HookScene, TwistScene, ShiftScene, etc.) explicitly inherits
// this root layout container to prevent visual jumping across Sequence cuts.
export const SceneContainer: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill
    style={{
      display: 'grid',
      gridTemplateColumns: '320px 1fr',
      backgroundColor: '#0b0f19',
      width: 1080,
      height: 1920,
      overflow: 'hidden',
    }}
  >
    {/* Left Column: Persistent Telemetry HUD */}
    <TelemetryHud />

    {/* Right Column: Fluid Kinetic Typography & Engine Canvas */}
    <div style={{position: 'relative', width: '100%', height: '100%'}}>
      {children}
    </div>
  </AbsoluteFill>
);
