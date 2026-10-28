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
  type SceneKey,
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

type Constellation = {
  nodes: ReadonlyArray<readonly [number, number]>;
  edges: ReadonlyArray<readonly [number, number]>;
};

// Six full-canvas 1080x1920 constellations — animating in and out per isolated <Sequence>.
const SCENE_CONSTELLATIONS: Record<SceneKey, Constellation> = {
  hook: {
    nodes: [
      [110, 210], [340, 175], [690, 205], [960, 250], [890, 610], [560, 680], [180, 640],
      [130, 1080], [430, 1180], [830, 1120], [950, 1440], [660, 1560], [320, 1520], [140, 1690],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0],
      [6, 7], [7, 8], [8, 9], [9, 4], [9, 10], [10, 11], [11, 12], [12, 13], [12, 7],
    ],
  },
  twist: {
    nodes: [
      [105, 220], [520, 185], [965, 235], [220, 560], [830, 540], [540, 880], [135, 1020],
      [945, 1020], [295, 1310], [775, 1330], [540, 1540], [150, 1690], [540, 1710], [935, 1680],
    ],
    edges: [
      [0, 1], [1, 2], [0, 3], [2, 4], [3, 5], [4, 5], [5, 6], [5, 7],
      [6, 8], [7, 9], [8, 10], [9, 10], [10, 11], [10, 12], [10, 13],
    ],
  },
  shift: {
    nodes: [
      [120, 210], [380, 210], [700, 210], [960, 210], [185, 580], [490, 580], [875, 580],
      [185, 960], [540, 960], [895, 960], [200, 1380], [540, 1380], [880, 1380], [540, 1690],
    ],
    edges: [
      [0, 4], [1, 5], [2, 6], [3, 6], [4, 7], [5, 8], [6, 9],
      [7, 10], [8, 11], [9, 12], [10, 13], [11, 13], [12, 13], [4, 5], [10, 11], [11, 12],
    ],
  },
  mechanism: {
    nodes: [
      [155, 220], [540, 195], [925, 220], [155, 640], [540, 640], [925, 640], [155, 1060],
      [540, 1060], [925, 1060], [155, 1460], [540, 1460], [925, 1460], [330, 1690], [750, 1690],
    ],
    edges: [
      [0, 1], [1, 2], [3, 4], [4, 5], [6, 7], [7, 8], [9, 10], [10, 11],
      [0, 3], [1, 4], [2, 5], [3, 6], [4, 7], [5, 8], [6, 9], [7, 10], [8, 11], [9, 12], [11, 13], [12, 13],
    ],
  },
  payoff: {
    nodes: [
      [105, 230], [330, 310], [610, 245], [945, 320], [175, 690], [490, 650], [840, 710],
      [140, 1100], [540, 1060], [925, 1120], [200, 1460], [610, 1420], [935, 1490], [540, 1690],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [0, 4], [2, 5], [3, 6], [4, 5], [5, 6],
      [4, 7], [5, 8], [6, 9], [7, 8], [8, 9], [7, 10], [8, 11], [9, 12], [10, 13], [11, 13], [12, 13],
    ],
  },
  outro: {
    nodes: [
      [540, 290], [810, 440], [945, 700], [965, 960], [930, 1240], [780, 1490], [540, 1630],
      [300, 1490], [150, 1240], [115, 960], [135, 700], [270, 440], [540, 660], [540, 1260],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 0],
      [0, 12], [3, 12], [9, 12], [6, 13], [3, 13], [9, 13], [12, 13],
    ],
  },
};

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

export const AtmosphericOverlays: React.FC<TelemetryHudProps> = ({
  scene,
  localFrame,
  energy,
  activeCue,
}) => {
  const graph = SCENE_CONSTELLATIONS[scene.id];
  const activeCueId = activeCue?.globalIndex ?? -1;
  const hotNode = activeCueId >= 0 ? activeCueId % graph.nodes.length : -1;
  const secondaryNode = activeCueId >= 0 ? (activeCueId * 5 + 3) % graph.nodes.length : -1;
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
        opacity: reveal * (0.28 + energy * 0.42),
        transform: `scale(${0.965 + reveal * 0.035})`,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      {graph.edges.map(([a, b], index) => {
        const [x1, y1] = graph.nodes[a];
        const [x2, y2] = graph.nodes[b];
        const hot = a === hotNode || b === hotNode;
        const warm = a === secondaryNode || b === secondaryNode;
        const shift = Math.sin(localFrame * 0.04 + index) * 4.5;
        return (
          <line
            key={index}
            x1={x1 + shift}
            y1={y1 - shift * 0.5}
            x2={x2 - shift}
            y2={y2 + shift * 0.5}
            stroke={hot || warm ? ORANGE : WHITE}
            strokeOpacity={hot ? 0.58 : warm ? 0.28 : 0.09}
            strokeWidth={hot ? 1.9 : 1}
          />
        );
      })}
      {graph.nodes.map(([x, y], index) => {
        const hot = index === hotNode;
        const warm = index === secondaryNode;
        const dx = Math.sin(localFrame * 0.04 + index) * 4.5;
        const dy = -Math.cos(localFrame * 0.035 + index) * 3.5;
        return (
          <g key={index} transform={`translate(${x + dx} ${y + dy})`}>
            {hot && (
              <circle
                r={18 + energy * 11}
                fill="none"
                stroke={ORANGE}
                strokeOpacity={0.52}
                strokeWidth={1.4}
              />
            )}
            <circle
              r={hot ? 6.5 + energy * 3.5 : warm ? 4.2 : 2.8}
              fill={hot || warm ? ORANGE : WHITE}
              fillOpacity={hot ? 0.95 : warm ? 0.65 : 0.26}
            />
          </g>
        );
      })}
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
