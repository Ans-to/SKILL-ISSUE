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
} from './agentEngineModel';

export const Panel: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({
  children,
  style,
}) => (
  <div
    style={{
      background: 'linear-gradient(145deg, rgba(16,22,36,.95), rgba(8,11,19,.91))',
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
      fontSize: 10,
      fontWeight: 900,
      letterSpacing: 2.4,
      color: accent ? ORANGE : 'rgba(244,247,255,.54)',
      textTransform: 'uppercase',
    }}
  >
    {children}
  </span>
);

type TelemetryProps = {
  scene?: SceneSpec;
  localFrame?: number;
  frame?: number;
  section?: number;
  energy: number;
  activeCue: ScriptCue | null;
};

const resolveSceneState = (props: TelemetryProps) => {
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

// Six distinct 14-node constellations — one per isolated <Sequence> beat.
const SCENE_CONSTELLATIONS: Record<
  SceneKey,
  {nodes: ReadonlyArray<readonly [number, number]>; edges: ReadonlyArray<readonly [number, number]>}
> = {
  hook: {
    nodes: [
      [220, 190], [490, 145], [780, 210], [1090, 150], [1410, 200], [1710, 165], [1760, 460],
      [1520, 560], [1220, 480], [940, 620], [640, 740], [340, 700], [1360, 820], [1710, 840],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
      [8, 9], [9, 10], [10, 11], [7, 12], [12, 13], [3, 8], [2, 9],
    ],
  },
  twist: {
    nodes: [
      [130, 170], [360, 260], [620, 175], [890, 250], [1160, 175], [1430, 260], [1740, 180],
      [1690, 470], [1430, 580], [1150, 490], [880, 590], [600, 485], [330, 585], [150, 470],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
      [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 0], [3, 10], [4, 9],
    ],
  },
  shift: {
    nodes: [
      [140, 310], [340, 270], [560, 340], [780, 290], [260, 610], [520, 720], [790, 660],
      [1130, 290], [1380, 260], [1640, 320], [1780, 520], [1560, 730], [1310, 690], [1120, 620],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [3, 6],
      [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 7], [8, 12],
    ],
  },
  mechanism: {
    nodes: [
      [520, 310], [760, 310], [1000, 310], [1240, 310], [1480, 310], [1720, 310], [1820, 560],
      [1720, 820], [1480, 820], [1240, 820], [1000, 820], [760, 820], [520, 820], [620, 560],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
      [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 0], [2, 10], [4, 8],
    ],
  },
  payoff: {
    nodes: [
      [110, 360], [330, 420], [560, 365], [790, 430], [1020, 370], [1250, 435], [1480, 375],
      [1740, 430], [1810, 740], [1540, 860], [1260, 790], [960, 865], [640, 785], [290, 855],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
      [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [2, 12], [5, 10],
    ],
  },
  outro: {
    nodes: [
      [960, 170], [1220, 225], [1430, 375], [1490, 540], [1430, 705], [1220, 855], [960, 910],
      [700, 855], [490, 705], [430, 540], [490, 375], [700, 225], [960, 320], [960, 760],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
      [8, 9], [9, 10], [10, 11], [11, 0], [0, 12], [6, 13],
    ],
  },
};

export const AtmosphericOverlays: React.FC<TelemetryProps> = (props) => {
  const {scene, localFrame, globalFrame} = resolveSceneState(props);
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
      viewBox="0 0 1920 1080"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 3,
        pointerEvents: 'none',
        opacity: scene.id === 'outro' ? 0.36 : 0.5,
      }}
    >
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
            strokeOpacity={active ? 0.34 + energy * 0.22 + hit * 0.2 : 0.08}
            strokeWidth={active ? 1.8 : 1}
          />
        );
      })}
      {nodes.map(([x, y], index) => {
        const active = index === hotNode;
        const driftY = Math.sin(localFrame * 0.04 + index) * 2.5;
        return (
          <g key={`node-${scene.id}-${index}`} transform={`translate(${x} ${y + driftY})`}>
            <circle
              r={active ? 8.5 + energy * 3 + hit * 4 : 3.5 + energy * 1.2}
              fill={active ? ORANGE : WHITE}
              fillOpacity={active ? 0.88 : 0.2}
            />
            <circle
              r={active ? 18 + hit * 11 : 9}
              fill="none"
              stroke={active ? ORANGE : WHITE}
              strokeOpacity={active ? 0.44 : 0.07}
            />
          </g>
        );
      })}
    </svg>
  );
};

export const TelemetryRail: React.FC<TelemetryProps> = (props) => {
  const {scene, localFrame, globalFrame} = resolveSceneState(props);
  if (isSceneCleared(scene, localFrame)) return null;

  const {activeCue, energy} = props;
  const spokenInScene = sceneSpokenCues(scene, localFrame);
  const latestInScene = sceneLatestCue(scene, localFrame);
  const sceneWordTotal = scene.lastWordIndex - scene.firstWordIndex + 1;
  const sceneWordDone = spokenInScene.length;
  const cueNumber = activeCue
    ? String(activeCue.globalIndex + 1).padStart(2, '0')
    : latestInScene
      ? String(latestInScene.globalIndex + 1).padStart(2, '0')
      : '00';
  const sceneProgress = Math.min(1, localFrame / Math.max(1, scene.durationInFrames - 1));

  // Strictly scene-bounded audio envelope slice so earlier scenes never bleed into this waveform.
  const waveStart = Math.max(scene.from, globalFrame - 28);
  const samples = envelope.slice(waveStart, globalFrame + 1);
  const wavePoints = samples
    .map((val, idx) => `${idx * 10},${42 - val * 32}`)
    .join(' ');

  if (scene.id === 'hook') {
    return (
      <div
        data-scene-telemetry="hook"
        data-active-cue={activeCue?.globalIndex ?? -1}
        style={{position: 'absolute', inset: 0, zIndex: 13, pointerEvents: 'none'}}
      >
        <header
          style={{
            position: 'absolute',
            left: 104,
            right: 104,
            top: 38,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 14,
            borderBottom: '1px solid rgba(244,247,255,.14)',
          }}
        >
          <Micro accent>{scene.code} // {scene.subtitle}</Micro>
          <span style={{fontFamily: 'monospace', fontSize: 12, color: WHITE, letterSpacing: 2}}>
            SEQ F{String(localFrame).padStart(3, '0')} &nbsp;·&nbsp; ABS F{String(globalFrame).padStart(4, '0')}
          </span>
        </header>
        <Panel
          style={{
            position: 'absolute',
            left: 104,
            bottom: 52,
            width: 680,
            borderRadius: 10,
            padding: '14px 20px',
            display: 'grid',
            gridTemplateColumns: '1.3fr 1fr 1fr',
            gap: 18,
            alignItems: 'center',
          }}
        >
          <div>
            <Micro accent>ACTIVE TOKEN</Micro>
            <div style={{marginTop: 5, fontFamily: 'monospace', fontSize: 20, fontWeight: 900, color: activeCue ? WHITE : MUTED}}>
              <span style={{color: ORANGE}}>&gt; </span>
              <span data-current-token="true">{activeCue?.text ?? '—'}</span>
            </div>
          </div>
          <div>
            <Micro>SCENE CUES</Micro>
            <div style={{marginTop: 5, fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: WHITE}}>
              {String(sceneWordDone).padStart(2, '0')} / {String(sceneWordTotal).padStart(2, '0')} (GLOBAL {cueNumber})
            </div>
          </div>
          <div>
            <Micro>RMS / LOCK</Micro>
            <div style={{marginTop: 5, fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: activeCue ? ORANGE : MUTED}}>
              {Math.round(energy * 100)}% · {activeCue ? 'LOCKED' : 'HOLD'}
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  if (scene.id === 'twist') {
    return (
      <Panel
        style={{
          position: 'absolute',
          zIndex: 13,
          left: 88,
          right: 88,
          top: 26,
          height: 68,
          borderRadius: 10,
          padding: '0 26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'none',
        }}
      >
        <div
          data-scene-telemetry="twist"
          data-active-cue={activeCue?.globalIndex ?? -1}
          style={{display: 'flex', alignItems: 'center', gap: 18}}
        >
          <Micro accent>{scene.code}</Micro>
          <span style={{color: 'rgba(244,247,255,.22)'}}>|</span>
          <span style={{fontFamily: 'monospace', fontSize: 14, color: WHITE, fontWeight: 800}}>
            TOKEN: <span data-current-token="true" style={{color: activeCue ? ORANGE : MUTED}}>{activeCue?.text ?? '—'}</span>
          </span>
        </div>
        <svg viewBox="0 0 290 48" style={{width: 240, height: 36}}>
          <path d={`M0 42 L${wavePoints || '0,42'}`} fill="none" stroke={ORANGE} strokeWidth="2" />
        </svg>
        <div style={{display: 'flex', alignItems: 'center', gap: 22, fontFamily: 'monospace', fontSize: 12, color: WHITE}}>
          <span>BEAT {String(sceneWordDone).padStart(2, '0')}/{String(sceneWordTotal).padStart(2, '0')}</span>
          <span style={{color: ORANGE}}>F{String(globalFrame).padStart(4, '0')}</span>
        </div>
      </Panel>
    );
  }

  if (scene.id === 'shift') {
    return (
      <div
        data-scene-telemetry="shift"
        data-active-cue={activeCue?.globalIndex ?? -1}
        style={{position: 'absolute', inset: 0, zIndex: 13, pointerEvents: 'none'}}
      >
        <Panel
          style={{
            position: 'absolute',
            right: 64,
            top: 34,
            width: 560,
            height: 178,
            borderRadius: 12,
            padding: '16px 22px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <Micro accent>{scene.code} // WIREFRAME INSPECTOR</Micro>
            <span style={{fontFamily: 'monospace', fontSize: 12, color: ORANGE}}>
              F{String(globalFrame).padStart(4, '0')}
            </span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
            <div style={{fontFamily: 'monospace', fontSize: 22, fontWeight: 900, color: activeCue ? WHITE : MUTED}}>
              <span style={{color: ORANGE}}>&gt; </span>
              <span data-current-token="true">{activeCue?.text ?? '—'}</span>
            </div>
            <div style={{fontFamily: 'monospace', fontSize: 12, color: MUTED}}>
              CUE {cueNumber}/{SCRIPT_CUES.length} · {Math.round(energy * 100)}% RMS
            </div>
          </div>
          <div style={{height: 3, background: 'rgba(244,247,255,.12)', position: 'relative'}}>
            <div style={{width: `${sceneProgress * 100}%`, height: '100%', background: ORANGE}} />
          </div>
        </Panel>
      </div>
    );
  }

  if (scene.id === 'mechanism') {
    return (
      <div
        data-scene-telemetry="mechanism"
        data-active-cue={activeCue?.globalIndex ?? -1}
        style={{
          position: 'absolute',
          zIndex: 13,
          left: 48,
          top: 44,
          bottom: 44,
          width: 396,
          pointerEvents: 'none',
        }}
      >
        <Panel
          style={{
            height: '100%',
            borderRadius: 14,
            padding: 22,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(244,247,255,.12)', paddingBottom: 12}}>
            <Micro accent>{scene.code}</Micro>
            <span style={{fontFamily: 'monospace', fontSize: 11, color: activeCue ? ORANGE : MUTED}}>
              ● {activeCue ? 'DETERMINISTIC' : 'BREATH'}
            </span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
            <div>
              <Micro>LOCAL / ABS FRAME</Micro>
              <div style={{fontFamily: 'monospace', fontSize: 36, fontWeight: 900, color: WHITE, marginTop: 4}}>
                {String(localFrame).padStart(3, '0')}{' '}
                <span style={{fontSize: 16, color: MUTED}}>/ {String(globalFrame).padStart(4, '0')}</span>
              </div>
            </div>
            <div style={{textAlign: 'right', fontFamily: 'monospace', fontSize: 13, color: ORANGE}}>
              {(globalFrame / FPS).toFixed(2)}s
            </div>
          </div>
          <div style={{padding: 12, border: '1px solid rgba(244,247,255,.12)', background: 'rgba(255,69,0,.06)'}}>
            <Micro accent>ACTIVE LEXICAL STATE</Micro>
            <div style={{marginTop: 8, fontFamily: 'monospace', fontSize: 22, fontWeight: 900, color: activeCue ? WHITE : MUTED}}>
              <span style={{color: ORANGE}}>&gt; </span>
              <span data-current-token="true">{activeCue?.text ?? '—'}</span>
            </div>
          </div>
          <div style={{padding: 12, border: '1px solid rgba(244,247,255,.12)'}}>
            <Micro>SCENE ENVELOPE</Micro>
            <svg viewBox="0 0 290 48" style={{width: '100%', height: 46, marginTop: 8}}>
              <path d={`M0 42 L${wavePoints || '0,42'}`} fill="none" stroke={ORANGE} strokeWidth="2" />
            </svg>
          </div>
          <div style={{flex: 1, border: '1px solid rgba(244,247,255,.12)', padding: 12, fontFamily: 'monospace', overflow: 'hidden'}}>
            <Micro accent>SCENE 04 LOG (ISOLATED)</Micro>
            <div style={{display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10}}>
              {spokenInScene.slice(-7).map((cue) => (
                <div
                  key={cue.globalIndex}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: cue.globalIndex === activeCue?.globalIndex ? ORANGE : 'rgba(244,247,255,.5)',
                  }}
                >
                  <span>#{String(cue.globalIndex + 1).padStart(2, '0')}</span>
                  <span>F{String(cue.startFrame).padStart(4, '0')}–F{String(cue.endFrame).padStart(4, '0')}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  if (scene.id === 'payoff') {
    return (
      <Panel
        style={{
          position: 'absolute',
          zIndex: 13,
          right: 56,
          top: 38,
          width: 668,
          height: 256,
          borderRadius: 12,
          padding: '20px 26px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          pointerEvents: 'none',
        }}
      >
        <div
          data-scene-telemetry="payoff"
          data-active-cue={activeCue?.globalIndex ?? -1}
          style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
        >
          <Micro accent>{scene.code} // COMPILER TELEMETRY</Micro>
          <span style={{fontFamily: 'monospace', fontSize: 12, color: ORANGE}}>
            ABS F{String(globalFrame).padStart(4, '0')} · {Math.round(energy * 100)}% RMS
          </span>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 18, alignItems: 'center'}}>
          <div style={{padding: '12px 14px', border: '1px solid rgba(244,247,255,.14)', background: 'rgba(0,0,0,.28)'}}>
            <Micro>STREAMING TOKEN</Micro>
            <div style={{marginTop: 6, fontFamily: 'monospace', fontSize: 22, fontWeight: 900, color: activeCue ? WHITE : MUTED}}>
              <span style={{color: ORANGE}}>$ </span>
              <span data-current-token="true">{activeCue?.text ?? '—'}</span>
            </div>
          </div>
          <svg viewBox="0 0 290 48" style={{width: '100%', height: 54}}>
            <path d={`M0 42 L${wavePoints || '0,42'}`} fill="none" stroke={ORANGE} strokeWidth="2.2" />
          </svg>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 11, color: MUTED}}>
          <span>SCENE TOKENS: {sceneWordDone}/{sceneWordTotal}</span>
          <span>QUEUE LOCK: {activeCue ? 'ACTIVE' : 'PAUSE'}</span>
        </div>
      </Panel>
    );
  }

  // Outro minimalist framing telemetry
  return (
    <div
      data-scene-telemetry="outro"
      data-active-cue={activeCue?.globalIndex ?? -1}
      style={{position: 'absolute', inset: 0, zIndex: 13, pointerEvents: 'none'}}
    >
      <div
        style={{
          position: 'absolute',
          left: 84,
          right: 84,
          top: 42,
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'monospace',
          fontSize: 11,
          letterSpacing: 2.6,
          color: MUTED,
        }}
      >
        <span style={{color: ORANGE}}>{scene.code}</span>
        <span>FINAL SEQUENCE · F{String(globalFrame).padStart(4, '0')}</span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 84,
          right: 84,
          bottom: 44,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 14,
          borderTop: '1px solid rgba(244,247,255,.14)',
          fontFamily: 'monospace',
          fontSize: 13,
          color: WHITE,
        }}
      >
        <span>
          ACTIVE: <span data-current-token="true" style={{color: activeCue ? ORANGE : MUTED}}>{activeCue?.text ?? '—'}</span>
        </span>
        <span style={{color: MUTED}}>RMS {Math.round(energy * 100)}%</span>
      </div>
    </div>
  );
};
