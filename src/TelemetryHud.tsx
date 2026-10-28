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
      background: 'linear-gradient(150deg, rgba(16,22,36,.96), rgba(8,11,19,.92))',
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

// Six distinct right-stage 14-node constellations — one per isolated <Sequence>.
const SCENE_CONSTELLATIONS: Record<
  SceneKey,
  {nodes: ReadonlyArray<readonly [number, number]>; edges: ReadonlyArray<readonly [number, number]>}
> = {
  hook: {
    nodes: [
      [520, 170], [740, 125], [980, 195], [1240, 135], [1510, 185], [1780, 150], [1820, 450],
      [1610, 560], [1340, 480], [1080, 620], [820, 760], [560, 720], [1480, 840], [1790, 860],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
      [8, 9], [9, 10], [10, 11], [7, 12], [12, 13], [3, 8], [2, 9],
    ],
  },
  twist: {
    nodes: [
      [510, 130], [720, 220], [950, 135], [1180, 215], [1420, 135], [1650, 220], [1830, 145],
      [1790, 450], [1560, 570], [1310, 470], [1060, 580], [800, 470], [560, 575], [520, 390],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
      [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 0], [3, 10], [4, 9],
    ],
  },
  shift: {
    nodes: [
      [510, 330], [670, 290], [850, 360], [1040, 310], [580, 640], [790, 750], [1030, 680],
      [1270, 310], [1480, 280], [1700, 340], [1820, 540], [1640, 760], [1430, 710], [1260, 640],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [3, 6],
      [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 7], [8, 12],
    ],
  },
  mechanism: {
    nodes: [
      [520, 310], [750, 310], [980, 310], [1210, 310], [1440, 310], [1670, 310], [1830, 560],
      [1670, 820], [1440, 820], [1210, 820], [980, 820], [750, 820], [520, 820], [620, 560],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
      [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 0], [2, 10], [4, 8],
    ],
  },
  payoff: {
    nodes: [
      [510, 340], [700, 410], [900, 345], [1100, 415], [1300, 350], [1500, 420], [1700, 355],
      [1830, 440], [1810, 740], [1580, 870], [1330, 795], [1070, 875], [800, 790], [550, 865],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
      [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [2, 12], [5, 10],
    ],
  },
  outro: {
    nodes: [
      [1168, 170], [1410, 225], [1600, 375], [1660, 540], [1600, 705], [1410, 855], [1168, 910],
      [926, 855], [736, 705], [676, 540], [736, 375], [926, 225], [1168, 320], [1168, 760],
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
      viewBox="0 0 1920 1080"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 3,
        pointerEvents: 'none',
        opacity: scene.id === 'outro' ? 0.36 : 0.48,
      }}
    >
      <line x1="440" y1="40" x2="440" y2="1040" stroke={WHITE} strokeOpacity=".12" strokeDasharray="3 9" />
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
              r={active ? 8.5 + energy * 3 + hit * 4 : 3.4 + energy * 1.2}
              fill={active ? ORANGE : WHITE}
              fillOpacity={active ? 0.88 : 0.2}
            />
            <circle
              r={active ? 18 + hit * 10 : 9}
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

const MODE_LABELS: Record<SceneKey, string> = {
  hook: 'COLD OPEN',
  twist: 'TEMPLATE AUDIT',
  shift: 'SPLIT WIREFRAME',
  mechanism: 'MATH ISOLATION',
  payoff: 'FRAME COMPILER',
  outro: 'MONOLITH LOCK',
};

/**
 * Reusable left-zone telemetry HUD mounted inside each individual <Sequence>.
 * Resets cleanly at localFrame=0 on every scene transition so zero state bleeds across cuts.
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

  // Scene-bounded audio envelope slice so prior scenes never carry over into the waveform.
  const waveStart = Math.max(scene.from, globalFrame - 32);
  const samples = envelope.slice(waveStart, globalFrame + 1);
  const wavePoints = samples.map((val, idx) => `${idx * 10},${52 - val * 38}`).join(' ');

  return (
    <aside
      data-scene-telemetry={scene.id}
      data-active-cue={activeCue?.globalIndex ?? -1}
      style={{
        position: 'absolute',
        zIndex: 13,
        left: 40,
        top: 40,
        bottom: 40,
        width: 384,
        pointerEvents: 'none',
      }}
    >
      <Panel
        style={{
          height: '100%',
          borderRadius: 14,
          padding: 20,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 15,
          borderTop: `3px solid ${ORANGE}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 12,
            borderBottom: '1px solid rgba(244,247,255,.12)',
          }}
        >
          <Micro accent>{scene.code}</Micro>
          <span style={{fontFamily: 'monospace', fontSize: 11, color: activeCue ? ORANGE : MUTED}}>
            ● {activeCue ? 'LOCKED' : 'HOLD'}
          </span>
        </div>

        <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between'}}>
          <div>
            <Micro>SEQUENCE FRAME</Micro>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 40,
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: -2,
                color: WHITE,
                marginTop: 4,
              }}
            >
              {String(localFrame).padStart(3, '0')}
              <span style={{fontSize: 15, letterSpacing: 0, color: MUTED}}>
                {' '}
                / F{String(globalFrame).padStart(4, '0')}
              </span>
            </div>
          </div>
          <div style={{textAlign: 'right'}}>
            <Micro>MODE</Micro>
            <div style={{fontSize: 12, fontWeight: 900, letterSpacing: 1.8, color: ORANGE, marginTop: 6}}>
              {MODE_LABELS[scene.id]}
            </div>
          </div>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>
          {[
            ['SCENE CUES', `${String(sceneWordDone).padStart(2, '0')} / ${String(sceneWordTotal).padStart(2, '0')}`],
            ['GLOBAL CUE', `${globalCueNumber} / ${String(SCRIPT_CUES.length).padStart(2, '0')}`],
            ['AUDIO RMS', `${Math.round(energy * 100)}%`],
            ['TIMEBASE', `${(globalFrame / FPS).toFixed(2)}s`],
          ].map(([label, value], idx) => (
            <div
              key={label}
              style={{
                padding: '9px 11px',
                border: '1px solid rgba(244,247,255,.12)',
                background: idx === 0 ? 'rgba(255,69,0,.08)' : 'rgba(244,247,255,.025)',
              }}
            >
              <Micro accent={idx === 0}>{label}</Micro>
              <div style={{marginTop: 5, fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: WHITE}}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div style={{border: '1px solid rgba(244,247,255,.12)', background: 'rgba(244,247,255,.02)', padding: '10px 12px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 6}}>
            <Micro>SCENE ENVELOPE</Micro>
            <Micro accent>30 FPS</Micro>
          </div>
          <svg viewBox="0 0 330 60" preserveAspectRatio="none" style={{display: 'block', width: '100%', height: 56}}>
            <path d={`M0 53 L${wavePoints || '0,52'}`} fill="none" stroke={ORANGE} strokeWidth="2.1" />
            <path d="M0 54H330" stroke={WHITE} strokeOpacity=".16" strokeDasharray="3 7" />
          </svg>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            flex: 1,
            border: '1px solid rgba(244,247,255,.12)',
            background: 'rgba(0,0,0,.24)',
            padding: 12,
            fontFamily: 'monospace',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingBottom: 8,
              borderBottom: '1px solid rgba(244,247,255,.1)',
            }}
          >
            <Micro accent>ACTIVE TOKEN</Micro>
            <Micro>ISOLATED</Micro>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              minHeight: 34,
              paddingTop: 10,
              color: activeCue ? WHITE : MUTED,
              fontSize: 20,
              fontWeight: 900,
            }}
          >
            <span style={{color: ORANGE}}>&gt;</span>
            <span data-current-token="true">{activeCue?.text ?? '—'}</span>
            <span style={{marginLeft: 'auto', fontSize: 10, color: MUTED}}>
              {activeCue ? `F${String(activeCue.startFrame).padStart(4, '0')}` : 'BREATH'}
            </span>
          </div>

          <div style={{paddingTop: 12, color: 'rgba(244,247,255,.42)', fontSize: 10, letterSpacing: 1.4}}>
            SEQUENCE LOG // NO BLEED
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 7, overflow: 'hidden', paddingTop: 9}}>
            {spokenInScene.slice(-6).map((cue) => (
              <div
                key={cue.globalIndex}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  color: cue.globalIndex === activeCue?.globalIndex ? WHITE : 'rgba(244,247,255,.42)',
                  fontSize: 11,
                }}
              >
                <span style={{color: cue.globalIndex === activeCue?.globalIndex ? ORANGE : MUTED}}>
                  {String(cue.globalIndex + 1).padStart(2, '0')}
                </span>
                <span>
                  F{String(cue.startFrame).padStart(4, '0')}–F{String(cue.endFrame).padStart(4, '0')}
                </span>
                <i
                  style={{
                    height: 3,
                    marginLeft: 'auto',
                    width: `${18 + ((cue.globalIndex * 19) % 44)}%`,
                    background: cue.globalIndex === activeCue?.globalIndex ? ORANGE : 'rgba(244,247,255,.15)',
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{marginTop: 'auto', paddingTop: 10}}>
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
        </div>
      </Panel>
    </aside>
  );
};

export const TelemetryRail = TelemetryHud;
