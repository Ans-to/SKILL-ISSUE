import React from 'react';
import {
  FPS,
  MUTED,
  ORANGE,
  SCRIPT_CUES,
  WHITE,
  envelope,
  isSceneCleared,
  sceneForFrame,
  sceneLatestCue,
  sceneSpokenCues,
  type SceneKey,
  type SceneSpec,
  type ScriptCue,
} from './engine/agentEngineModel';

export const Panel: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({
  children,
  style,
}) => (
  <div
    style={{
      background: 'linear-gradient(155deg, rgba(16,22,36,.96), rgba(8,11,19,.92))',
      border: '1px solid rgba(244,247,255,.15)',
      boxShadow: '0 24px 80px rgba(0,0,0,.42)',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Micro: React.FC<{children: React.ReactNode; accent?: boolean}> = ({
  children,
  accent = false,
}) => (
  <span
    style={{
      fontSize: 11,
      fontWeight: 900,
      letterSpacing: 2.3,
      color: accent ? ORANGE : 'rgba(244,247,255,.54)',
      textTransform: 'uppercase',
    }}
  >
    {children}
  </span>
);

export type TelemetryHudProps = {
  scene?: SceneSpec;
  localFrame?: number;
  frame?: number;
  energy: number;
  activeCue: ScriptCue | null;
};

const resolveState = (props: TelemetryHudProps) => {
  if (props.scene !== undefined && props.localFrame !== undefined) {
    return {
      scene: props.scene,
      localFrame: props.localFrame,
      globalFrame: props.scene.from + props.localFrame,
    };
  }
  const globalFrame = Math.floor(props.frame ?? 0);
  const scene = sceneForFrame(globalFrame);
  return {scene, localFrame: globalFrame - scene.from, globalFrame};
};

// Six distinct 1080x1920 vertical constellations — one per isolated <Sequence>.
const SCENE_CONSTELLATIONS: Record<
  SceneKey,
  {nodes: ReadonlyArray<readonly [number, number]>; edges: ReadonlyArray<readonly [number, number]>}
> = {
  hook: {
    nodes: [
      [110, 410], [340, 380], [640, 420], [940, 390], [970, 720], [740, 810], [310, 760],
      [120, 1080], [420, 1180], [820, 1120], [950, 1460], [660, 1580], [330, 1540], [130, 1780],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0],
      [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [5, 9],
    ],
  },
  twist: {
    nodes: [
      [90, 390], [380, 460], [690, 395], [980, 465], [940, 790], [660, 890], [360, 810],
      [110, 910], [160, 1260], [480, 1360], [830, 1280], [960, 1580], [580, 1740], [180, 1720],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
      [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [1, 6], [5, 9],
    ],
  },
  shift: {
    nodes: [
      [110, 620], [360, 590], [680, 630], [960, 600], [880, 920], [540, 960], [190, 930],
      [130, 1240], [410, 1210], [720, 1250], [960, 1230], [920, 1680], [540, 1760], [160, 1690],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0],
      [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 7], [8, 12],
    ],
  },
  mechanism: {
    nodes: [
      [140, 630], [540, 630], [940, 630], [940, 1020], [540, 1020], [140, 1020], [140, 1410],
      [540, 1410], [940, 1410], [940, 1760], [540, 1760], [140, 1760], [340, 825], [740, 1215],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
      [8, 9], [9, 10], [10, 11], [1, 4], [4, 7], [12, 13],
    ],
  },
  payoff: {
    nodes: [
      [100, 640], [390, 710], [690, 645], [970, 715], [930, 1060], [640, 1140], [320, 1070],
      [110, 1180], [210, 1490], [540, 1440], [890, 1510], [950, 1790], [540, 1830], [140, 1790],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
      [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [2, 5], [5, 9],
    ],
  },
  outro: {
    nodes: [
      [540, 560], [800, 650], [950, 880], [980, 1120], [910, 1380], [740, 1580], [540, 1650],
      [340, 1580], [170, 1380], [100, 1120], [130, 880], [280, 650], [540, 780], [540, 1420],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
      [8, 9], [9, 10], [10, 11], [11, 0], [0, 12], [6, 13],
    ],
  },
};

export const AtmosphericOverlays: React.FC<TelemetryHudProps> = (props) => {
  const {scene, localFrame, globalFrame} = resolveState(props);
  if (isSceneCleared(scene, localFrame)) return null;

  const {activeCue, energy} = props;
  const {nodes, edges} = SCENE_CONSTELLATIONS[scene.id];
  const hotNode = activeCue ? activeCue.globalIndex % nodes.length : -1;
  const hit = activeCue ? Math.max(0, 1 - (globalFrame - activeCue.startFrame) / 6) : 0;

  return (
    <svg
      data-scene-graph={scene.id}
      data-active-cue={activeCue?.globalIndex ?? -1}
      data-hot-node={hotNode}
      aria-hidden="true"
      viewBox="0 0 1080 1920"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 3,
        pointerEvents: 'none',
        opacity: scene.id === 'outro' ? 0.38 : 0.48,
      }}
    >
      <line x1="44" y1="322" x2="1036" y2="322" stroke={WHITE} strokeOpacity=".13" strokeDasharray="4 10" />
      {edges.map(([a, b], index) => {
        const active = a === hotNode || b === hotNode;
        return (
          <line
            key={`edge-${scene.id}-${index}`}
            x1={nodes[a][0]}
            y1={nodes[a][1]}
            x2={nodes[b][0]}
            y2={nodes[b][1]}
            stroke={active ? ORANGE : WHITE}
            strokeOpacity={active ? 0.36 + energy * 0.22 + hit * 0.2 : 0.08}
            strokeWidth={active ? 2 : 1.1}
          />
        );
      })}
      {nodes.map(([x, y], index) => {
        const active = index === hotNode;
        const driftY = Math.sin(localFrame * 0.04 + index) * 3;
        return (
          <g key={`node-${scene.id}-${index}`} transform={`translate(${x} ${y + driftY})`}>
            <circle
              r={active ? 9.5 + energy * 3.5 + hit * 4 : 3.8 + energy * 1.4}
              fill={active ? ORANGE : WHITE}
              fillOpacity={active ? 0.9 : 0.22}
            />
            <circle
              r={active ? 20 + hit * 11 : 10}
              fill="none"
              stroke={active ? ORANGE : WHITE}
              strokeOpacity={active ? 0.46 : 0.08}
            />
          </g>
        );
      })}
    </svg>
  );
};

const MODE_LABELS: Record<SceneKey, string> = {
  hook: 'COLD OPEN',
  twist: 'TEMPLATE AUDIT',
  shift: 'SPLIT WIREFRAME',
  mechanism: 'MATH ISOLATION',
  payoff: 'FRAME COMPILER',
  outro: 'MONOLITH LOCK',
};

/**
 * Reusable 9:16 vertical telemetry HUD mounted inside each individual <Sequence>.
 * Resets cleanly at localFrame=0 on every scene cut so zero state bleeds across scenes.
 */
export const TelemetryHud: React.FC<TelemetryHudProps> = (props) => {
  const {scene, localFrame, globalFrame} = resolveState(props);
  if (isSceneCleared(scene, localFrame)) return null;

  const {activeCue, energy} = props;
  const spokenInScene = sceneSpokenCues(scene, localFrame);
  const latestInScene = sceneLatestCue(scene, localFrame);
  const sceneWordTotal = scene.lastWordIndex - scene.firstWordIndex + 1;
  const sceneWordDone = spokenInScene.length;
  const globalCueNumber = activeCue
    ? String(activeCue.globalIndex + 1).padStart(2, '0')
    : latestInScene
      ? String(latestInScene.globalIndex + 1).padStart(2, '0')
      : '00';
  const sceneProgress = Math.min(1, localFrame / Math.max(1, scene.durationInFrames - 1));

  const waveStart = Math.max(scene.from, globalFrame - 28);
  const samples = envelope.slice(waveStart, globalFrame + 1);
  const wavePoints = samples.map((val, idx) => `${idx * 9},${48 - val * 36}`).join(' ');

  return (
    <aside
      data-scene-telemetry={scene.id}
      data-active-cue={activeCue?.globalIndex ?? -1}
      style={{
        position: 'absolute',
        zIndex: 13,
        left: 44,
        right: 44,
        top: 40,
        height: 266,
        pointerEvents: 'none',
      }}
    >
      <Panel
        style={{
          height: '100%',
          borderRadius: 16,
          padding: '18px 24px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderTop: `3px solid ${ORANGE}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 10,
            borderBottom: '1px solid rgba(244,247,255,.12)',
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
            <Micro accent>{scene.code}</Micro>
            <span style={{color: 'rgba(244,247,255,.22)'}}>|</span>
            <Micro>{MODE_LABELS[scene.id]}</Micro>
          </div>
          <span style={{fontFamily: 'monospace', fontSize: 12, color: activeCue ? ORANGE : MUTED}}>
            ● {activeCue ? 'WORD-LOCKED' : 'HOLD'} &nbsp;·&nbsp; {(globalFrame / FPS).toFixed(2)}s
          </span>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1.25fr 1fr', gap: 16, alignItems: 'center'}}>
          <div>
            <Micro>SEQ / ABS FRAME</Micro>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 38,
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: -1.5,
                color: WHITE,
                marginTop: 6,
              }}
            >
              {String(localFrame).padStart(3, '0')}
              <span style={{fontSize: 16, letterSpacing: 0, color: MUTED}}>
                {' '}
                / F{String(globalFrame).padStart(4, '0')}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '10px 16px',
              border: '1px solid rgba(244,247,255,.14)',
              background: 'rgba(255,69,0,.075)',
            }}
          >
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <Micro accent>ACTIVE TOKEN</Micro>
              <span style={{fontFamily: 'monospace', fontSize: 11, color: MUTED}}>
                {String(sceneWordDone).padStart(2, '0')}/{String(sceneWordTotal).padStart(2, '0')} (G{globalCueNumber}/{SCRIPT_CUES.length})
              </span>
            </div>
            <div
              style={{
                marginTop: 6,
                fontFamily: 'monospace',
                fontSize: 24,
                fontWeight: 900,
                color: activeCue ? WHITE : MUTED,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              <span style={{color: ORANGE}}>&gt; </span>
              <span data-current-token="true">{activeCue?.text ?? '—'}</span>
            </div>
          </div>

          <div
            style={{
              padding: '8px 14px',
              border: '1px solid rgba(244,247,255,.12)',
              background: 'rgba(244,247,255,.02)',
            }}
          >
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <Micro>RMS {Math.round(energy * 100)}%</Micro>
              <Micro accent>30 FPS</Micro>
            </div>
            <svg viewBox="0 0 260 52" preserveAspectRatio="none" style={{display: 'block', width: '100%', height: 42, marginTop: 4}}>
              <path d={`M0 49 L${wavePoints || '0,48'}`} fill="none" stroke={ORANGE} strokeWidth="2.2" />
            </svg>
          </div>
        </div>

        <div>
          <div style={{display: 'flex', gap: 10, alignItems: 'center', fontFamily: 'monospace', fontSize: 11, marginBottom: 10}}>
            <span style={{color: 'rgba(244,247,255,.45)', letterSpacing: 1.5}}>SEQ LOG:</span>
            {spokenInScene.slice(-5).map((cue) => (
              <span
                key={cue.globalIndex}
                style={{
                  padding: '3px 8px',
                  border: `1px solid ${cue.globalIndex === activeCue?.globalIndex ? ORANGE : 'rgba(244,247,255,.14)'}`,
                  color: cue.globalIndex === activeCue?.globalIndex ? ORANGE : 'rgba(244,247,255,.55)',
                  background: cue.globalIndex === activeCue?.globalIndex ? 'rgba(255,69,0,.1)' : 'transparent',
                }}
              >
                #{String(cue.globalIndex + 1).padStart(2, '0')} F{String(cue.startFrame).padStart(4, '0')}
              </span>
            ))}
          </div>
          <div style={{height: 3, background: 'rgba(244,247,255,.12)', position: 'relative'}}>
            <div
              style={{
                width: `${sceneProgress * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${WHITE}, ${ORANGE})`,
              }}
            />
          </div>
        </div>
      </Panel>
    </aside>
  );
};

export const TelemetryRail = TelemetryHud;
