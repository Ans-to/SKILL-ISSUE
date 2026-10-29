import React, {useContext} from 'react';
import {Internals, spring, useCurrentFrame} from 'remotion';
import {
  DURATION_FRAMES,
  FPS,
  MUTED,
  ORANGE,
  OUTRO_CUT_FRAME,
  WHITE,
  clamp,
  energyAt,
  envelope,
  findSceneCue,
  isSceneCleared,
  sceneForFrame,
  sceneSpokenCues,
  type SceneSpec,
  type ScriptCue,
} from './engine/agentEngineModel';

export const Micro: React.FC<{
  children: React.ReactNode;
  accent?: boolean;
  style?: React.CSSProperties;
}> = ({children, accent, style}) => (
  <span
    style={{
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: 12,
      letterSpacing: 2.5,
      textTransform: 'uppercase',
      color: accent ? ORANGE : MUTED,
      fontWeight: 700,
      ...style,
    }}
  >
    {children}
  </span>
);

export const Panel: React.FC<{
  children: React.ReactNode;
  accent?: boolean;
  style?: React.CSSProperties;
}> = ({children, accent, style}) => (
  <div
    style={{
      border: `1px solid ${accent ? ORANGE : 'rgba(244,247,255,.16)'}`,
      background: 'rgba(11,15,25,.58)',
      backdropFilter: 'blur(10px)',
      boxShadow: accent ? '0 0 40px rgba(255,69,0,.18)' : '0 24px 68px rgba(0,0,0,.46)',
      ...style,
    }}
  >
    {children}
  </div>
);

export type TelemetryHudProps = {
  scene: SceneSpec;
  localFrame: number;
  energy: number;
  activeCue: ScriptCue | null;
};

export const getHudLifecycle = (scene: SceneSpec, localFrame: number): number => {
  if (isSceneCleared(scene, localFrame)) return 0;
  const activeFrames =
    scene.id === 'outro'
      ? Math.max(1, OUTRO_CUT_FRAME - scene.from)
      : Math.max(1, scene.durationInFrames - scene.clearFrames);
  const enter = spring({
    frame: Math.max(0, localFrame),
    fps: FPS,
    config: {damping: 14, stiffness: 190},
  });
  const exit = clamp((activeFrames - 1 - localFrame) / 9, 0, 1);
  return clamp(enter * exit, 0, 1);
};

/**
 * Minimal, clutter-free frame calibration hairlines (zero random floating nodes,
 * zero spiderweb constellations, zero unscripted geometric loops).
 */
export const AtmosphericOverlays: React.FC<TelemetryHudProps> = ({
  scene,
  localFrame,
  activeCue,
}) => {
  const activeCueId = activeCue?.globalIndex ?? -1;
  const hotNode = activeCueId >= 0 ? activeCueId % 14 : -1;
  const reveal = getHudLifecycle(scene, localFrame);

  return (
    <svg
      data-scene-graph={scene.id}
      data-active-cue={activeCueId}
      data-hot-node={hotNode}
      viewBox="0 0 1080 1920"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: reveal * 0.36,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <path d="M56 138 V122 H72" fill="none" stroke={WHITE} strokeOpacity="0.22" strokeWidth="1.2" />
      <path d="M1024 138 V122 H1008" fill="none" stroke={WHITE} strokeOpacity="0.22" strokeWidth="1.2" />
      <path d="M56 1720 V1736 H72" fill="none" stroke={WHITE} strokeOpacity="0.22" strokeWidth="1.2" />
      <path d="M1024 1720 V1736 H1008" fill="none" stroke={WHITE} strokeOpacity="0.22" strokeWidth="1.2" />
    </svg>
  );
};

/**
 * Dynamic, semi-transparent floating HUD chips & tactical lower-third overlays.
 * Zero fixed sidebar — uses 100% of the 1080x1920 canvas and animates in/out
 * smoothly on every scene transition.
 */
const TelemetryHudView: React.FC<TelemetryHudProps> = ({
  scene,
  localFrame,
  energy,
  activeCue,
}) => {
  const globalFrame = scene.from + localFrame;
  const activeCueId = activeCue?.globalIndex ?? -1;
  const reveal = getHudLifecycle(scene, localFrame);
  const spokenInScene = sceneSpokenCues(scene, localFrame);
  const recentTokens = spokenInScene.slice(-3);
  const progress = clamp((localFrame + 1) / Math.max(1, scene.durationInFrames), 0, 1);

  const waveBars = Array.from({length: 16}, (_, idx) => {
    const sampleFrame = clamp(globalFrame - 15 + idx, 0, DURATION_FRAMES - 1);
    return envelope[sampleFrame] ?? 0;
  });

  const sfxTag =
    activeCue && globalFrame - activeCue.startFrame < 3
      ? 'SFX:CLICK+HUM'
      : localFrame < 14
        ? 'SFX:WHOOSH'
        : 'SFX:HUM 0.15';

  return (
    <div
      data-scene-telemetry={scene.id}
      data-active-cue={activeCueId}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
        color: WHITE,
        opacity: reveal,
      }}
    >
      {/* Floating Top-Left Tactical Scene Reticle Chip */}
      <div
        style={{
          position: 'absolute',
          left: 56,
          top: 52,
          padding: '12px 18px',
          background: 'rgba(11,15,25,.48)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(244,247,255,.14)',
          borderLeft: `3px solid ${ORANGE}`,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          transform: `translate3d(${(1 - reveal) * -28}px, ${(1 - reveal) * -22}px, 0)`,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 99,
            background: ORANGE,
            boxShadow: `0 0 12px ${ORANGE}`,
          }}
        />
        <span style={{fontFamily: 'monospace', fontSize: 13, fontWeight: 800, letterSpacing: 2, color: ORANGE}}>
          {scene.code}
        </span>
        <span style={{color: 'rgba(244,247,255,.22)'}}>|</span>
        <Micro style={{fontSize: 11, letterSpacing: 2}}>
          {scene.subtitle.split('//')[0].trim()}
        </Micro>
      </div>

      {/* Floating Top-Right Frame & Timecode Chip */}
      <div
        style={{
          position: 'absolute',
          right: 56,
          top: 52,
          padding: '12px 18px',
          background: 'rgba(11,15,25,.48)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(244,247,255,.14)',
          borderRight: `3px solid ${WHITE}`,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          fontVariantNumeric: 'tabular-nums',
          transform: `translate3d(${(1 - reveal) * 28}px, ${(1 - reveal) * -22}px, 0)`,
        }}
      >
        <span style={{fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: WHITE, letterSpacing: 1.2}}>
          L{String(localFrame).padStart(3, '0')} · F{String(globalFrame).padStart(4, '0')}
        </span>
        <span style={{color: 'rgba(244,247,255,.22)'}}>·</span>
        <span style={{fontFamily: 'monospace', fontSize: 12, color: ORANGE, fontWeight: 700}}>
          {(globalFrame / FPS).toFixed(2)}S
        </span>
      </div>

      {/* Dynamic Tactical Lower-Third Overlay (animates up on entry, retracts down before cut) */}
      <div
        style={{
          position: 'absolute',
          left: 56,
          right: 56,
          bottom: 54,
          height: 118,
          boxSizing: 'border-box',
          padding: '16px 26px',
          background: 'rgba(11,15,25,.52)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${activeCue ? 'rgba(255,69,0,.38)' : 'rgba(244,247,255,.13)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          overflow: 'hidden',
          transform: `translate3d(0, ${(1 - reveal) * 42}px, 0) scale(${0.97 + reveal * 0.03})`,
        }}
      >
        {/* Corner Reticle Ticks */}
        <span style={{position: 'absolute', left: 0, top: 0, width: 14, height: 2, background: ORANGE}} />
        <span style={{position: 'absolute', left: 0, top: 0, width: 2, height: 14, background: ORANGE}} />
        <span style={{position: 'absolute', right: 0, top: 0, width: 14, height: 2, background: ORANGE}} />
        <span style={{position: 'absolute', right: 0, top: 0, width: 2, height: 14, background: ORANGE}} />

        {/* Left: Live Token Readout + Recent Scene Breadcrumbs */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, flex: 1}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <Micro accent style={{fontSize: 10, letterSpacing: 2}}>TELEMETRY // TOKEN</Micro>
            <div style={{display: 'flex', gap: 6, overflow: 'hidden'}}>
              {recentTokens.map((cue) => {
                const current = cue.globalIndex === activeCueId;
                return (
                  <span
                    key={cue.globalIndex}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 10,
                      padding: '2px 7px',
                      border: `1px solid ${current ? ORANGE : 'rgba(244,247,255,.14)'}`,
                      background: current ? 'rgba(255,69,0,.16)' : 'rgba(244,247,255,.04)',
                      color: current ? WHITE : MUTED,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    #{String(cue.globalIndex + 1).padStart(2, '0')}
                  </span>
                );
              })}
            </div>
          </div>

          <div style={{display: 'flex', alignItems: 'baseline', gap: 10, whiteSpace: 'nowrap', overflow: 'hidden'}}>
            <span style={{color: ORANGE, fontFamily: 'monospace', fontSize: 22, fontWeight: 900}}>&gt;</span>
            <span
              data-current-token="true"
              style={{
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: -0.6,
                color: activeCue ? WHITE : MUTED,
              }}
            >
              {activeCue ? activeCue.text : '—'}
            </span>
            <span style={{fontFamily: 'monospace', fontSize: 12, color: MUTED, marginLeft: 6}}>
              {activeCue
                ? `F${String(activeCue.startFrame).padStart(4, '0')}→F${String(activeCue.endFrame).padStart(4, '0')}`
                : 'SYNC HOLD'}
            </span>
          </div>
        </div>

        {/* Right: Floating Micro-Spectrum + Spatial SFX Status */}
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <span style={{fontFamily: 'monospace', fontSize: 10, color: ORANGE, letterSpacing: 1.5}}>
              {sfxTag}
            </span>
            <Micro style={{fontSize: 10, letterSpacing: 1.6}}>RMS {Math.round(energy * 100)}%</Micro>
          </div>
          <div style={{width: 176, height: 38, display: 'flex', alignItems: 'flex-end', gap: 4}}>
            {waveBars.map((val, idx) => {
              const isNow = idx === waveBars.length - 1;
              return (
                <i
                  key={idx}
                  style={{
                    flex: 1,
                    height: `${Math.max(14, Math.round(val * 100))}%`,
                    background: isNow ? ORANGE : val > 0.55 ? 'rgba(255,69,0,.66)' : 'rgba(244,247,255,.26)',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Bottom Scene Progress Hairline */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 2,
            background: 'rgba(244,247,255,.08)',
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              background: ORANGE,
              boxShadow: `0 0 10px ${ORANGE}`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

const ConnectedTelemetryHud: React.FC = () => {
  const localFrame = useCurrentFrame();
  const sequenceContext = useContext(Internals.SequenceContext);
  const seqOffset = sequenceContext
    ? sequenceContext.cumulatedFrom + sequenceContext.relativeFrom
    : 0;
  const playbackRate = sequenceContext?.playbackRate ?? 1;
  const globalFrame = clamp(
    Math.round(localFrame / playbackRate + seqOffset),
    0,
    DURATION_FRAMES - 1,
  );
  const scene = sceneForFrame(globalFrame);
  const sceneLocalFrame = clamp(globalFrame - scene.from, 0, scene.durationInFrames - 1);
  const activeCue = findSceneCue(scene, sceneLocalFrame);
  const energy = energyAt(globalFrame);

  return (
    <TelemetryHudView
      scene={scene}
      localFrame={sceneLocalFrame}
      energy={energy}
      activeCue={activeCue}
    />
  );
};

export const TelemetryHud: React.FC<Partial<TelemetryHudProps>> = (props) => {
  if (props.scene !== undefined && props.localFrame !== undefined) {
    const globalFrame = props.scene.from + props.localFrame;
    return (
      <TelemetryHudView
        scene={props.scene}
        localFrame={props.localFrame}
        energy={props.energy ?? energyAt(globalFrame)}
        activeCue={
          props.activeCue !== undefined
            ? props.activeCue
            : findSceneCue(props.scene, props.localFrame)
        }
      />
    );
  }
  return <ConnectedTelemetryHud />;
};
