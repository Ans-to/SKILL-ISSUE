import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {AtmosphericOverlays, HUD, TelemetryRail} from './TelemetryHud';
import {BackgroundLayer, ShockVector, StoryVisuals, ThreeLayer} from './StoryScenes';
import {DURATION_FRAMES, OBSIDIAN, currentSection, energyAt, findCue, OUTRO_CUT_FRAME} from './agentEngineModel';

export const MOTION_ENGINE_DURATION_FRAMES = DURATION_FRAMES;

/** Independent background, isolated Three.js depth, and front-facing 2D layers. */
const CinematicStack: React.FC<{background: React.ReactNode; threeD: React.ReactNode; typography: React.ReactNode}> = ({background, threeD, typography}) => (
  <div style={{position: 'absolute', inset: 0, overflow: 'hidden', isolation: 'isolate'}}>
    <div data-layer="1-background" style={{position: 'absolute', inset: 0, zIndex: 0}}>{background}</div>
    <div data-layer="2-three-dimensional" style={{position: 'absolute', inset: 0, zIndex: 2}}>{threeD}</div>
    <div data-layer="10-two-dimensional-type" style={{position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none'}}>{typography}</div>
  </div>
);

const TypographyLayer: React.FC<{frame: number; section: number; activeCue: ReturnType<typeof findCue>; energy: number}> = ({frame, section, activeCue, energy}) => {
  const cutToBlack = section === 5 && frame >= OUTRO_CUT_FRAME;
  return <div style={{position: 'absolute', inset: 0, zIndex: 10, color: '#f4f7ff', fontFamily: 'Arial, Helvetica, sans-serif'}}>
    <StoryVisuals frame={frame} section={section} energy={energy}/>
    {!cutToBlack && <>
      <AtmosphericOverlays frame={frame} section={section} energy={energy} activeCue={activeCue}/>
      <TelemetryRail frame={frame} section={section} energy={energy} activeCue={activeCue}/>
      <HUD frame={frame} section={section} activeCue={activeCue} energy={energy}/>
      {section === 0 && <ShockVector frame={frame} energy={energy}/>}
    </>}
  </div>;
};

export const MotionEngine: React.FC = () => {
  const frame = useCurrentFrame();
  const activeCue = findCue(frame);
  const section = currentSection(frame);
  const energy = energyAt(frame);
  return <AbsoluteFill style={{backgroundColor: OBSIDIAN, overflow: 'hidden'}}>
    <CinematicStack
      background={<BackgroundLayer frame={frame} section={section} energy={energy}/>}
      threeD={<ThreeLayer frame={frame} section={section} activeCue={activeCue} energy={energy}/>}
      typography={<TypographyLayer frame={frame} section={section} activeCue={activeCue} energy={energy}/>}
    />
    <Audio src={staticFile('agent-engine/voiceover.wav')}/>
  </AbsoluteFill>;
};
