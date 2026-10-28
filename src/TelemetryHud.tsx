import React, {useContext} from 'react';
import {Internals, useCurrentFrame} from 'remotion';
import {
  DURATION_FRAMES,
  FPS,
  HUD_WIDTH,
  MUTED,
  ORANGE,
  OUTRO_CUT_FRAME,
  SCENE_SEQUENCES,
  WHITE,
  clamp,
  energyAt,
  envelope,
  findSceneCue,
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
      fontSize: 11,
      letterSpacing: 2.2,
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
      background: 'rgba(9,13,23,.84)',
      boxShadow: accent ? '0 0 36px rgba(255,69,0,.18)' : '0 24px 64px rgba(0,0,0,.5)',
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

// Six distinct 760x1920 right-column constellations — one per isolated <Sequence>.
const SCENE_CONSTELLATIONS: Record<SceneKey, Constellation> = {
  hook: {
    nodes: [
      [78, 120], [260, 96], [510, 132], [684, 180], [620, 480], [390, 560], [124, 520],
      [96, 980], [310, 1080], [590, 1020], [676, 1380], [470, 1520], [230, 1490], [98, 1780],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0],
      [6, 7], [7, 8], [8, 9], [9, 4], [9, 10], [10, 11], [11, 12], [12, 13], [12, 7],
    ],
  },
  twist: {
    nodes: [
      [72, 130], [370, 108], [678, 142], [150, 480], [580, 460], [380, 820], [92, 960],
      [668, 960], [210, 1290], [540, 1310], [380, 1560], [104, 1790], [380, 1810], [662, 1780],
    ],
    edges: [
      [0, 1], [1, 2], [0, 3], [2, 4], [3, 5], [4, 5], [5, 6], [5, 7],
      [6, 8], [7, 9], [8, 10], [9, 10], [10, 11], [10, 12], [10, 13],
    ],
  },
  shift: {
    nodes: [
      [82, 118], [260, 118], [500, 118], [678, 118], [130, 470], [340, 470], [610, 470],
      [130, 1044], [380, 1044], [630, 1044], [140, 1460], [380, 1460], [620, 1460], [380, 1810],
    ],
    edges: [
      [0, 4], [1, 5], [2, 6], [3, 6], [4, 7], [5, 8], [6, 9],
      [7, 10], [8, 11], [9, 12], [10, 13], [11, 13], [12, 13], [4, 5], [10, 11], [11, 12],
    ],
  },
  mechanism: {
    nodes: [
      [110, 130], [380, 110], [650, 130], [110, 560], [380, 560], [650, 560], [110, 1020],
      [380, 1020], [650, 1020], [110, 1480], [380, 1480], [650, 1480], [230, 1810], [530, 1810],
    ],
    edges: [
      [0, 1], [1, 2], [3, 4], [4, 5], [6, 7], [7, 8], [9, 10], [10, 11],
      [0, 3], [1, 4], [2, 5], [3, 6], [4, 7], [5, 8], [6, 9], [7, 10], [8, 11], [9, 12], [11, 13], [12, 13],
    ],
  },
  payoff: {
    nodes: [
      [74, 140], [230, 220], [430, 160], [666, 240], [120, 620], [340, 580], [590, 640],
      [96, 1060], [380, 1020], [650, 1080], [140, 1480], [430, 1440], [660, 1520], [380, 1810],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [0, 4], [2, 5], [3, 6], [4, 5], [5, 6],
      [4, 7], [5, 8], [6, 9], [7, 8], [8, 9], [7, 10], [8, 11], [9, 12], [10, 13], [11, 13], [12, 13],
    ],
  },
  outro: {
    nodes: [
      [380, 220], [570, 360], [676, 650], [688, 960], [660, 1290], [548, 1560], [380, 1700],
      [212, 1560], [100, 1290], [72, 960], [84, 650], [190, 360], [380, 640], [380, 1280],
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

  return (
    <svg
      data-scene-graph={scene.id}
      data-active-cue={activeCueId}
      data-hot-node={hotNode}
      viewBox="0 0 760 1920"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0.3 + energy * 0.42,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      {graph.edges.map(([a, b], index) => {
        const [x1, y1] = graph.nodes[a];
        const [x2, y2] = graph.nodes[b];
        const hot = a === hotNode || b === hotNode;
        const warm = a === secondaryNode || b === secondaryNode;
        const shift = Math.sin(localFrame * 0.04 + index) * 4;
        return (
          <line
            key={index}
            x1={x1 + shift}
            y1={y1 - shift * 0.5}
            x2={x2 - shift}
            y2={y2 + shift * 0.5}
            stroke={hot || warm ? ORANGE : WHITE}
            strokeOpacity={hot ? 0.58 : warm ? 0.28 : 0.09}
            strokeWidth={hot ? 1.8 : 1}
          />
        );
      })}
      {graph.nodes.map(([x, y], index) => {
        const hot = index === hotNode;
        const warm = index === secondaryNode;
        const dx = Math.sin(localFrame * 0.04 + index) * 4;
        const dy = -Math.cos(localFrame * 0.035 + index) * 3;
        return (
          <g key={index} transform={`translate(${x + dx} ${y + dy})`}>
            {hot && (
              <circle
                r={16 + energy * 10}
                fill="none"
                stroke={ORANGE}
                strokeOpacity={0.5}
                strokeWidth={1.3}
              />
            )}
            <circle
              r={hot ? 6 + energy * 3.5 : warm ? 4 : 2.6}
              fill={hot || warm ? ORANGE : WHITE}
              fillOpacity={hot ? 0.95 : warm ? 0.65 : 0.26}
            />
          </g>
        );
      })}
    </svg>
  );
};

const tokenFontSize = (text: string): number => {
  if (text.length <= 8) return 26;
  if (text.length <= 11) return 22;
  return 18;
};

const TelemetryHudView: React.FC<TelemetryHudProps> = ({
  scene,
  localFrame,
  energy,
  activeCue,
}) => {
  const globalFrame = scene.from + localFrame;
  const cutToBlack = scene.id === 'outro' && globalFrame >= OUTRO_CUT_FRAME;
  const activeCueId = activeCue?.globalIndex ?? -1;
  const spokenInScene = sceneSpokenCues(scene, localFrame);
  const recentTokens = spokenInScene.slice(-7);
  const sceneWordTotal = scene.lastWordIndex - scene.firstWordIndex + 1;
  const sceneWordDone = spokenInScene.length;
  const progress = clamp((localFrame + 1) / Math.max(1, scene.durationInFrames), 0, 1);

  const waveBars = Array.from({length: 22}, (_, idx) => {
    const sampleFrame = clamp(globalFrame - 21 + idx, 0, DURATION_FRAMES - 1);
    return envelope[sampleFrame] ?? 0;
  });

  return (
    <aside
      data-scene-telemetry={scene.id}
      data-active-cue={activeCueId}
      style={{
        width: HUD_WIDTH,
        height: 1920,
        boxSizing: 'border-box',
        padding: '42px 22px 44px',
        background: 'linear-gradient(180deg, rgba(13,19,33,.96), rgba(8,12,21,.98))',
        borderRight: '1px solid rgba(244,247,255,.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
        color: WHITE,
        overflow: 'hidden',
        opacity: cutToBlack ? 0 : 1,
        position: 'relative',
      }}
    >
      {/* Top Safety-Orange Lock Rail */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 4,
          background: ORANGE,
          boxShadow: `0 0 18px ${ORANGE}`,
        }}
      />

      {/* Block 1: Persistent Engine Identity */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          paddingBottom: 16,
          borderBottom: '1px solid rgba(244,247,255,.12)',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                background: ORANGE,
                boxShadow: `0 0 12px ${ORANGE}`,
              }}
            />
            <Micro accent style={{letterSpacing: 1.8}}>HUD // ENGINE</Micro>
          </div>
          <Micro style={{fontSize: 10, letterSpacing: 1.5}}>30 FPS</Micro>
        </div>
        <div style={{fontSize: 20, fontWeight: 900, letterSpacing: -0.4, color: WHITE}}>
          {scene.code}
        </div>
        <Micro style={{fontSize: 10, letterSpacing: 1.5}}>
          {scene.subtitle.split('//')[0].trim()}
        </Micro>
      </div>

      {/* Block 2: Quantized Frame Counter */}
      <div
        style={{
          border: '1px solid rgba(244,247,255,.13)',
          background: 'rgba(244,247,255,.02)',
          padding: '14px 14px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Micro style={{fontSize: 10, letterSpacing: 1.6}}>SEQ / ABS</Micro>
          <Micro accent style={{fontSize: 10, letterSpacing: 1.4}}>
            {(globalFrame / FPS).toFixed(2)}S
          </Micro>
        </div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 8}}>
          <span
            style={{
              fontSize: 42,
              fontWeight: 900,
              letterSpacing: -1.6,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {String(localFrame).padStart(3, '0')}
          </span>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 14,
              color: MUTED,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            / F{String(globalFrame).padStart(4, '0')}
          </span>
        </div>
        <div style={{height: 4, background: 'rgba(244,247,255,.1)', position: 'relative'}}>
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

      {/* Block 3: Persistent 6-Sequence Partition Map */}
      <div
        style={{
          border: '1px solid rgba(244,247,255,.13)',
          background: 'rgba(244,247,255,.018)',
          padding: '12px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2}}>
          <Micro style={{fontSize: 10, letterSpacing: 1.6}}>SEQUENCE MAP</Micro>
          <Micro style={{fontSize: 10, letterSpacing: 1.2}}>6 BEATS</Micro>
        </div>
        {SCENE_SEQUENCES.map((item) => {
          const current = item.id === scene.id;
          const past = item.index < scene.index;
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                border: `1px solid ${current ? ORANGE : 'rgba(244,247,255,.08)'}`,
                background: current ? 'rgba(255,69,0,.13)' : 'transparent',
                fontFamily: 'monospace',
                fontSize: 11,
              }}
            >
              <span style={{color: current ? ORANGE : past ? WHITE : MUTED, fontWeight: 800}}>
                0{item.index + 1} {item.name}
              </span>
              <span style={{color: current ? WHITE : MUTED, fontSize: 10, fontVariantNumeric: 'tabular-nums'}}>
                {String(item.from).padStart(4, '0')}–{String(item.endFrame).padStart(4, '0')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Block 4: Live Active Word Lock */}
      <div
        style={{
          height: 128,
          boxSizing: 'border-box',
          border: `1px solid ${activeCue ? 'rgba(255,69,0,.62)' : 'rgba(244,247,255,.14)'}`,
          background: activeCue ? 'rgba(255,69,0,.09)' : 'rgba(244,247,255,.02)',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Micro accent style={{fontSize: 10, letterSpacing: 1.5}}>ACTIVE TOKEN</Micro>
          <span style={{fontFamily: 'monospace', fontSize: 10, color: MUTED}}>
            {String(sceneWordDone).padStart(2, '0')}/{String(sceneWordTotal).padStart(2, '0')}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          <span style={{color: ORANGE, fontFamily: 'monospace', fontSize: 18, fontWeight: 900}}>&gt;</span>
          <span
            data-current-token="true"
            style={{
              fontSize: activeCue ? tokenFontSize(activeCue.text) : 22,
              fontWeight: 900,
              letterSpacing: -0.6,
              color: activeCue ? WHITE : MUTED,
            }}
          >
            {activeCue ? activeCue.text : '—'}
          </span>
        </div>
        <div style={{fontFamily: 'monospace', fontSize: 10, color: MUTED}}>
          {activeCue
            ? `G${String(activeCue.globalIndex + 1).padStart(2, '0')}/91 · F${String(activeCue.startFrame).padStart(4, '0')}→F${String(activeCue.endFrame).padStart(4, '0')}`
            : 'PAUSE // SILENCE HOLD'}
        </div>
      </div>

      {/* Block 5: Audio RMS Waveform */}
      <div
        style={{
          height: 158,
          boxSizing: 'border-box',
          border: '1px solid rgba(244,247,255,.13)',
          background: 'rgba(244,247,255,.02)',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Micro style={{fontSize: 10, letterSpacing: 1.5}}>RMS {Math.round(energy * 100)}%</Micro>
          <Micro accent style={{fontSize: 10, letterSpacing: 1.4}}>WAV LOCK</Micro>
        </div>
        <div style={{height: 92, display: 'flex', alignItems: 'flex-end', gap: 4}}>
          {waveBars.map((val, idx) => {
            const isNow = idx === waveBars.length - 1;
            return (
              <i
                key={idx}
                style={{
                  flex: 1,
                  height: `${Math.max(10, Math.round(val * 100))}%`,
                  background: isNow ? ORANGE : val > 0.55 ? 'rgba(255,69,0,.62)' : 'rgba(244,247,255,.24)',
                }}
              />
            );
          })}
        </div>
        <div style={{fontFamily: 'monospace', fontSize: 10, color: MUTED}}>
          SHA256 // fdd626ed8a3b
        </div>
      </div>

      {/* Block 6: Scene-Isolated Token Log */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          border: '1px solid rgba(244,247,255,.13)',
          background: 'rgba(244,247,255,.016)',
          padding: '14px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          overflow: 'hidden',
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Micro style={{fontSize: 10, letterSpacing: 1.5}}>SEQ TOKEN LOG</Micro>
          <Micro accent style={{fontSize: 10, letterSpacing: 1.3}}>ISOLATED</Micro>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4, overflow: 'hidden'}}>
          {recentTokens.length === 0 ? (
            <div style={{fontFamily: 'monospace', fontSize: 11, color: MUTED, paddingTop: 6}}>
              SEQ_INIT // ZERO CARRYOVER
            </div>
          ) : (
            recentTokens.map((cue) => {
              const isCurrent = cue.globalIndex === activeCueId;
              return (
                <div
                  key={cue.globalIndex}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '7px 9px',
                    border: `1px solid ${isCurrent ? ORANGE : 'rgba(244,247,255,.1)'}`,
                    background: isCurrent ? 'rgba(255,69,0,.14)' : 'rgba(244,247,255,.02)',
                    fontFamily: 'monospace',
                    fontSize: 11,
                    overflow: 'hidden',
                  }}
                >
                  <span style={{color: isCurrent ? ORANGE : MUTED, flexShrink: 0}}>
                    #{String(cue.globalIndex + 1).padStart(2, '0')}
                  </span>
                  <span
                    style={{
                      color: WHITE,
                      fontWeight: isCurrent ? 800 : 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cue.text}
                  </span>
                  <span style={{color: MUTED, fontSize: 10, flexShrink: 0}}>
                    F{String(cue.startFrame).padStart(4, '0')}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Architecture Stamp */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 10,
          borderTop: '1px solid rgba(244,247,255,.12)',
        }}
      >
        <Micro style={{fontSize: 10, letterSpacing: 1.4}}>1080×1920</Micro>
        <Micro accent style={{fontSize: 10, letterSpacing: 1.4}}>320PX | 1FR</Micro>
      </div>
    </aside>
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
