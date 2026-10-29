import React from 'react';
import {Audio, Sequence, spring, staticFile, useCurrentFrame} from 'remotion';
import {TENSION_SPRING_CONFIG} from '../EmotionalPacing';
import {KineticEngine} from '../KineticEngine';
import {SceneAudioBed, SFX_PATHS} from '../SceneAudio';
import {SceneContainer} from '../SceneContainer';
import {AtmosphericOverlays, Micro} from '../TelemetryHud';
import {
  FPS,
  ORANGE,
  SCENE_MAP,
  WORD_START_FRAMES,
  cueAfter,
  energyAt,
  findSceneCue,
  type SceneSpec,
} from '../engine/agentEngineModel';
import {CleanCoordinateGrid, SceneStage, SceneThreeCanvas} from './SceneStage';

export const HookScene: React.FC<{scene?: SceneSpec}> = ({scene = SCENE_MAP.hook}) => {
  const localFrame = useCurrentFrame();
  const globalFrame = scene.from + localFrame;
  const activeCue = findSceneCue(scene, localFrame);
  const energy = energyAt(globalFrame);
  const pastedCue = cueAfter('pasted', scene.firstWordIndex);
  const templateStamp = globalFrame >= pastedCue.startFrame;
  const stampPop = spring({
    frame: Math.max(0, globalFrame - pastedCue.startFrame),
    fps: FPS,
    config: TENSION_SPRING_CONFIG,
  });
  const pastedLocalFrame = WORD_START_FRAMES[pastedCue.globalIndex] - scene.from;

  return (
    <SceneContainer>
      <SceneAudioBed scene={scene} />
      <Sequence from={pastedLocalFrame} durationInFrames={14} layout="none" name="hook-clone-stamp-sfx">
        <Audio src={staticFile(SFX_PATHS.slashImpact)} volume={0.32} />
      </Sequence>
      <SceneStage
        scene={scene}
        localFrame={localFrame}
        activeCue={activeCue}
        background={<CleanCoordinateGrid gridOpacity={0.08} glowOpacity={0.055 + energy * 0.04} />}
        threeD={<SceneThreeCanvas scene={scene} localFrame={localFrame} energy={energy} baseZ={13.5} />}
        typography={
          <>
            <AtmosphericOverlays scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />
            {templateStamp && (
              <div
                style={{
                  position: 'absolute',
                  left: 72,
                  right: 72,
                  top: 1320,
                  height: 232,
                  border: `1.5px dashed ${ORANGE}`,
                  background: 'rgba(255,69,0,.055)',
                  backdropFilter: 'blur(8px)',
                  padding: '24px 32px',
                  boxSizing: 'border-box',
                  transform: `scale(${0.88 + stampPop * 0.12})`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Micro accent>CLONE DETECTED // ZERO ENGINE</Micro>
                  <Micro>BOILERPLATE SHELL</Micro>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18}}>
                  {[0, 1, 2].map((slot) => (
                    <div
                      key={slot}
                      style={{
                        height: 118,
                        border: '1px solid rgba(244,247,255,.2)',
                        background: 'rgba(244,247,255,.03)',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            {activeCue && (
              <KineticEngine key={activeCue.globalIndex} cue={activeCue} variant="hook" globalFrame={globalFrame} />
            )}
          </>
        }
      />
    </SceneContainer>
  );
};
