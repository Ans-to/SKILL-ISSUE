import React from 'react';
import {Easing, interpolate, spring, useVideoConfig} from 'remotion';
import {StaggeredTextItem, type TextMotionProfile} from '../StaggeredTextItem';
import {
  BRETTON_Z_LAYERS,
  BW_EMERALD,
  BW_EMERALD_SOFT,
  BW_FPS,
  BW_GOLD,
  BW_GOLD_BRIGHT,
  BW_MUTED,
  BW_SCRIPT_CUES,
  BW_SILVER,
  BW_WHITE,
  bwFindCue,
  getBrettonLayout,
  type BrettonSceneId,
  type SpatialSceneEnvelope,
} from './brettonWoodsModel';

/**
 * Clean spoken-sentence segmentation so subtitles breathe naturally without crowding.
 */
const SENTENCE_RANGES: readonly [number, number][] = [
  [0, 14],    // "If you buy oil in Saudi Arabia, a coffee in Tokyo, or shoes in Italy..."
  [15, 21],   // "chances are, you're paying in one currency."
  [22, 36],   // "Back in 1944, at Bretton Woods, war-torn nations tied their currencies to the US dollar—"
  [37, 44],   // "because America held most of the world's gold."
  [45, 54],   // "Even when we left the gold standard, the world stayed."
  [55, 61],   // "Why? Because of trust, liquidity, and depth."
  [62, 75],   // "The US financial markets are so massive and stable that global banks and governments"
  [76, 86],   // "keep trillions in US Treasury bonds as their ultimate safety net."
  [87, 95],   // "It gives America immense economic power— and immense responsibility."
  [96, 100],  // "Love it or hate it..."
  [101, 107], // "for now, the greenback holds the crown."
];

const Scene1TradeConvergenceSvg: React.FC<{globalFrame: number}> = ({globalFrame}) => {
  const oilOn = interpolate(globalFrame, [36, 56], [0.22, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const coffeeOn = interpolate(globalFrame, [90, 110], [0.22, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const shoesOn = interpolate(globalFrame, [138, 158], [0.22, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const dollarRingProg = interpolate(globalFrame, [188, 252], [0.15, 0.88], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const circumference = 2 * Math.PI * 66;
  const dashOffset = circumference * (1 - dollarRingProg);

  const hubs = [
    {label: 'SAUDI OIL', cx: 190, cy: 86, active: oilOn, path: 'M 190 124 C 190 205, 340 210, 400 242'},
    {label: 'TOKYO COFFEE', cx: 400, cy: 58, active: coffeeOn, path: 'M 400 96 L 400 218'},
    {label: 'ITALIAN TRADE', cx: 610, cy: 86, active: shoesOn, path: 'M 610 124 C 610 205, 460 210, 400 242'},
  ];

  return (
    <svg viewBox="0 0 800 370" width="100%" height="100%" style={{overflow: 'visible'}}>
      {/* Converging Bezier Trade Filaments */}
      {hubs.map((h, idx) => (
        <g key={h.label} opacity={h.active}>
          <path
            d={h.path}
            fill="none"
            stroke={idx === 1 ? BW_EMERALD_SOFT : BW_GOLD_BRIGHT}
            strokeWidth={2.2}
            strokeDasharray="6 6"
          />
          <circle
            cx={h.cx}
            cy={h.cy}
            r={34}
            fill="rgba(16, 23, 38, 0.90)"
            stroke={h.active > 0.6 ? BW_GOLD_BRIGHT : 'rgba(148,163,184,0.3)'}
            strokeWidth={1.8}
          />
          {/* Minimalist Geometric Commodity Glyph */}
          {idx === 0 && (
            <path
              d={`M ${h.cx} ${h.cy - 13} C ${h.cx + 9} ${h.cy - 1}, ${h.cx + 10} ${h.cy + 11}, ${h.cx} ${h.cy + 13} C ${h.cx - 10} ${h.cy + 11}, ${h.cx - 9} ${h.cy - 1}, ${h.cx} ${h.cy - 13} Z`}
              fill="none"
              stroke={BW_GOLD_BRIGHT}
              strokeWidth={2}
            />
          )}
          {idx === 1 && (
            <g stroke={BW_EMERALD_SOFT} strokeWidth={2} fill="none">
              <rect x={h.cx - 10} y={h.cy - 7} width={18} height={15} rx={4} />
              <path d={`M ${h.cx + 8} ${h.cy - 4} C ${h.cx + 14} ${h.cy - 4}, ${h.cx + 14} ${h.cy + 4}, ${h.cx + 8} ${h.cy + 4}`} />
            </g>
          )}
          {idx === 2 && (
            <polygon
              points={`${h.cx},${h.cy - 12} ${h.cx + 12},${h.cy} ${h.cx},${h.cy + 12} ${h.cx - 12},${h.cy}`}
              fill="none"
              stroke={BW_GOLD_BRIGHT}
              strokeWidth={2}
            />
          )}
          <text
            x={h.cx}
            y={h.cy + 54}
            textAnchor="middle"
            fill={BW_SILVER}
            fontSize={11.5}
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight={600}
            letterSpacing="0.18em"
          >
            {h.label}
          </text>
        </g>
      ))}

      {/* Central Sovereign Dollar Convergence Medallion */}
      <g transform="translate(400, 276)">
        <circle r={76} fill="rgba(11, 15, 25, 0.92)" stroke="rgba(212, 175, 55, 0.22)" strokeWidth={1.2} />
        <circle r={66} fill="none" stroke="rgba(16, 185, 129, 0.16)" strokeWidth={5} />
        <circle
          r={66}
          fill="none"
          stroke={BW_EMERALD_SOFT}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90)"
        />
        <text
          x={0}
          y={13}
          textAnchor="middle"
          fill={BW_WHITE}
          fontSize={40}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={800}
        >
          $
        </text>
        <text
          x={0}
          y={40}
          textAnchor="middle"
          fill={BW_GOLD_BRIGHT}
          fontSize={11}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={700}
          letterSpacing="0.2em"
        >
          USD
        </text>
      </g>
    </svg>
  );
};

const Scene2GoldVaultSvg: React.FC<{globalFrame: number}> = ({globalFrame}) => {
  const pegsLocked = interpolate(globalFrame, [430, 500], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const leftGold = interpolate(globalFrame, [646, 696], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const currencies = [
    {sym: '£', angle: -150},
    {sym: '₣', angle: -90},
    {sym: '¥', angle: -30},
    {sym: 'C$', angle: 30},
    {sym: 'DM', angle: 90},
    {sym: 'SFr', angle: 150},
  ];

  return (
    <svg viewBox="0 0 800 370" width="100%" height="100%" style={{overflow: 'visible'}}>
      <g transform="translate(400, 188)">
        {/* Outer Architectural Vault Ring */}
        <circle
          r={138}
          fill="none"
          stroke="rgba(212, 175, 55, 0.24)"
          strokeWidth={1.4}
          strokeDasharray="4 8"
        />
        <circle
          r={104}
          fill="rgba(13, 20, 35, 0.88)"
          stroke={leftGold > 0.5 ? BW_EMERALD_SOFT : BW_GOLD}
          strokeWidth={2.2}
        />

        {/* Radial Sovereign Currency Tethers (stay locked even after leaving gold!) */}
        {currencies.map((c) => {
          const rad = (c.angle * Math.PI) / 180;
          const xOuter = Math.cos(rad) * 154;
          const yOuter = Math.sin(rad) * 142;
          const xInner = Math.cos(rad) * 104;
          const yInner = Math.sin(rad) * 104;
          return (
            <g key={c.sym} opacity={0.35 + 0.65 * pegsLocked}>
              <line
                x1={xOuter}
                y1={yOuter}
                x2={xOuter + (xInner - xOuter) * pegsLocked}
                y2={yOuter + (yInner - yOuter) * pegsLocked}
                stroke={leftGold > 0.4 ? BW_EMERALD_SOFT : BW_GOLD_BRIGHT}
                strokeWidth={2}
              />
              <circle
                cx={xOuter}
                cy={yOuter}
                r={22}
                fill="rgba(16, 23, 38, 0.95)"
                stroke={leftGold > 0.4 ? BW_EMERALD_SOFT : BW_GOLD}
                strokeWidth={1.6}
              />
              <text
                x={xOuter}
                y={yOuter + 5}
                textAnchor="middle"
                fill={BW_WHITE}
                fontSize={14}
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight={700}
              >
                {c.sym}
              </text>
            </g>
          );
        })}

        {/* Sleek Gold Bullion Vault Core (fades/lifts gracefully at 1971 while USD ring persists) */}
        <g
          opacity={1 - leftGold * 0.78}
          transform={`translate(0, ${(-leftGold * 26).toFixed(1)}) scale(${(1 - leftGold * 0.12).toFixed(3)})`}
        >
          {[-34, 4].map((bx) =>
            [-26, 4].map((by) => (
              <rect
                key={`ingot-${bx}-${by}`}
                x={bx}
                y={by}
                width={30}
                height={18}
                rx={3}
                fill={BW_GOLD_BRIGHT}
                fillOpacity={0.88}
                stroke={BW_WHITE}
                strokeOpacity={0.35}
                strokeWidth={1}
              />
            )),
          )}
          <text
            x={0}
            y={46}
            textAnchor="middle"
            fill={BW_GOLD_BRIGHT}
            fontSize={11}
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight={700}
            letterSpacing="0.2em"
          >
            GOLD VAULT
          </text>
        </g>

        {/* Persistent Dollar Standard Core emerging cleanly as Gold Standard ends */}
        {leftGold > 0.05 && (
          <g opacity={leftGold}>
            <circle r={42} fill="rgba(16, 185, 129, 0.16)" stroke={BW_EMERALD_SOFT} strokeWidth={2} />
            <text
              x={0}
              y={12}
              textAnchor="middle"
              fill={BW_WHITE}
              fontSize={34}
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight={800}
            >
              $
            </text>
          </g>
        )}
      </g>
    </svg>
  );
};

const Scene3LiquidityNetworkSvg: React.FC<{globalFrame: number}> = ({globalFrame}) => {
  const liquidityWave = interpolate(globalFrame, [845, 930], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const safetyNetOn = interpolate(globalFrame, [1155, 1245], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const nodes: readonly [number, number][] = [
    [165, 105],
    [265, 62],
    [535, 62],
    [635, 105],
    [655, 225],
    [525, 278],
    [275, 278],
    [145, 225],
  ];

  const pulseR = 64 + ((globalFrame * 0.9) % 72);
  const pulseOp = Math.max(0, 1 - ((globalFrame * 0.9) % 72) / 72) * 0.45 * liquidityWave;

  return (
    <svg viewBox="0 0 800 370" width="100%" height="100%" style={{overflow: 'visible'}}>
      {/* Sovereign Safety-Net Cradle Curve beneath Global Nodes */}
      {safetyNetOn > 0.01 && (
        <g opacity={safetyNetOn}>
          <path
            d="M 120 250 Q 400 365 680 250"
            fill="none"
            stroke={BW_GOLD_BRIGHT}
            strokeWidth={2.4}
          />
          <path
            d="M 155 272 Q 400 376 645 272"
            fill="none"
            stroke={BW_EMERALD_SOFT}
            strokeWidth={1.5}
            strokeDasharray="5 7"
          />
        </g>
      )}

      {/* Clean Geodesic Liquidity Links */}
      {nodes.map(([nx, ny], idx) => {
        const next = nodes[(idx + 1) % nodes.length];
        const t = ((globalFrame * 0.018 + idx * 0.125) % 1 + 1) % 1;
        const px = nx + (400 - nx) * t;
        const py = ny + (176 - ny) * t;
        return (
          <g key={`ln-${idx}`}>
            <line
              x1={nx}
              y1={ny}
              x2={400}
              y2={176}
              stroke="rgba(52, 211, 153, 0.34)"
              strokeWidth={1.6}
            />
            <line
              x1={nx}
              y1={ny}
              x2={next[0]}
              y2={next[1]}
              stroke="rgba(212, 175, 55, 0.22)"
              strokeWidth={1.1}
            />
            {liquidityWave > 0.1 && (
              <circle cx={px} cy={py} r={3.5} fill={BW_GOLD_BRIGHT} opacity={liquidityWave} />
            )}
          </g>
        );
      })}

      {/* Expanding Liquidity Ripple */}
      <circle
        cx={400}
        cy={176}
        r={pulseR}
        fill="none"
        stroke={BW_EMERALD_SOFT}
        strokeWidth={1.8}
        opacity={pulseOp}
      />

      {/* Outer Global Bank / Government Nodes */}
      {nodes.map(([nx, ny], idx) => (
        <g key={`nd-${idx}`}>
          <circle
            cx={nx}
            cy={ny}
            r={14}
            fill="rgba(16, 23, 38, 0.95)"
            stroke={idx % 2 === 0 ? BW_EMERALD_SOFT : BW_GOLD}
            strokeWidth={1.8}
          />
          <circle cx={nx} cy={ny} r={4} fill={idx % 2 === 0 ? BW_EMERALD_SOFT : BW_GOLD_BRIGHT} />
        </g>
      ))}

      {/* Central US Treasury Core */}
      <g transform="translate(400, 176)">
        <circle r={54} fill="rgba(11, 15, 25, 0.95)" stroke={BW_GOLD_BRIGHT} strokeWidth={2.2} />
        <circle r={44} fill="none" stroke={BW_EMERALD_SOFT} strokeWidth={1.4} />
        <text
          x={0}
          y={4}
          textAnchor="middle"
          fill={BW_WHITE}
          fontSize={16}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={800}
          letterSpacing="0.14em"
        >
          UST
        </text>
        <text
          x={0}
          y={22}
          textAnchor="middle"
          fill={BW_EMERALD_SOFT}
          fontSize={9.5}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={600}
          letterSpacing="0.18em"
        >
          RESERVE
        </text>
      </g>
    </svg>
  );
};

const Scene4CrownEquilibriumSvg: React.FC<{globalFrame: number}> = ({globalFrame}) => {
  const crownMorph = interpolate(globalFrame, [1518, 1546], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const tiltDeg = Math.sin(globalFrame * 0.03) * 3.2;

  return (
    <svg viewBox="0 0 800 370" width="100%" height="100%" style={{overflow: 'visible'}}>
      {/* Part A: Clean Architectural Power & Responsibility Equilibrium */}
      {crownMorph < 0.99 && (
        <g opacity={1 - crownMorph} transform="translate(400, 195)">
          <line x1={0} y1={-56} x2={0} y2={64} stroke={BW_GOLD} strokeWidth={2.2} />
          <polygon points="-14,64 14,64 0,44" fill="none" stroke={BW_GOLD} strokeWidth={2} />
          <g transform={`rotate(${tiltDeg.toFixed(2)})`}>
            <line x1={-190} y1={-28} x2={190} y2={-28} stroke={BW_WHITE} strokeWidth={2.2} />
            <circle cx={-190} cy={12} r={34} fill="rgba(16,23,38,0.92)" stroke={BW_GOLD_BRIGHT} strokeWidth={2} />
            <line x1={-190} y1={-28} x2={-190} y2={-22} stroke={BW_GOLD_BRIGHT} strokeWidth={1.8} />
            <text
              x={-190}
              y={16}
              textAnchor="middle"
              fill={BW_GOLD_BRIGHT}
              fontSize={10.5}
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight={700}
              letterSpacing="0.16em"
            >
              POWER
            </text>

            <circle cx={190} cy={12} r={34} fill="rgba(16,23,38,0.92)" stroke={BW_EMERALD_SOFT} strokeWidth={2} />
            <line x1={190} y1={-28} x2={190} y2={-22} stroke={BW_EMERALD_SOFT} strokeWidth={1.8} />
            <text
              x={190}
              y={16}
              textAnchor="middle"
              fill={BW_EMERALD_SOFT}
              fontSize={10.5}
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight={700}
              letterSpacing="0.16em"
            >
              DUTY
            </text>
          </g>
        </g>
      )}

      {/* Part B: Minimalist Geometric Sovereign Dollar Crown */}
      {crownMorph > 0.01 && (
        <g
          opacity={crownMorph}
          transform={`translate(400, 186) scale(${(0.92 + 0.08 * crownMorph).toFixed(3)})`}
        >
          <circle
            r={112}
            fill="rgba(11, 15, 25, 0.85)"
            stroke="rgba(212, 175, 55, 0.30)"
            strokeWidth={1.5}
          />
          <circle
            r={94}
            fill="none"
            stroke="rgba(52, 211, 153, 0.24)"
            strokeWidth={1.2}
            strokeDasharray="5 7"
          />
          {/* Crisp Architectural Crown Silhouette */}
          <path
            d="M -68 34 L -56 -28 L -22 6 L 0 -44 L 22 6 L 56 -28 L 68 34 Z"
            fill="rgba(212, 175, 55, 0.16)"
            stroke={BW_GOLD_BRIGHT}
            strokeWidth={2.8}
            strokeLinejoin="round"
          />
          <line x1={-64} y1={46} x2={64} y2={46} stroke={BW_EMERALD_SOFT} strokeWidth={2.8} strokeLinecap="round" />
          <circle cx={-56} cy={-32} r={4.5} fill={BW_GOLD_BRIGHT} />
          <circle cx={0} cy={-49} r={5.5} fill={BW_WHITE} />
          <circle cx={56} cy={-32} r={4.5} fill={BW_GOLD_BRIGHT} />
        </g>
      )}
    </svg>
  );
};

const SUBTITLE_PROFILES: readonly TextMotionProfile[] = [
  'terminal-slide',
  'hook-pop',
  'telemetry-flicker',
];

/**
 * Clean Editorial Thematic Visuals (z=20) & Natural Spoken Subtitle Line (z=42).
 * Zero CLI boxes, zero random bar charts, zero debug logs, zero future-word leaks.
 */
const BrettonWoodsUiSimulationView: React.FC<{
  sceneId: BrettonSceneId;
  globalFrame: number;
  spatialEnvelope: SpatialSceneEnvelope;
  width: number;
  height: number;
}> = ({sceneId, globalFrame, spatialEnvelope, width, height}) => {
  const layout = getBrettonLayout(width, height);

  if (spatialEnvelope.opacity <= 0.001) {
    return null;
  }

  const enterSp = spring({
    frame: Math.max(0, globalFrame),
    fps: BW_FPS,
    config: {damping: 20, stiffness: 120},
  });

  // Identify current spoken sentence so words accumulate cleanly without crowding
  const activeCue = bwFindCue(globalFrame);
  const currentSentence = SENTENCE_RANGES.find(([lo, hi]) => {
    const firstFrame = BW_SCRIPT_CUES[lo].startFrame;
    const nextStart =
      hi + 1 < BW_SCRIPT_CUES.length ? BW_SCRIPT_CUES[hi + 1].startFrame : 1800;
    return globalFrame >= firstFrame && globalFrame < nextStart;
  });

  const spokenSentenceWords = currentSentence
    ? BW_SCRIPT_CUES.filter(
        (w) =>
          w.globalIndex >= currentSentence[0] &&
          w.globalIndex <= currentSentence[1] &&
          w.startFrame <= globalFrame &&
          w.sceneId === sceneId,
      ).slice(-10)
    : [];

  return (
    <>
      {/* Layer z=20: Purposeful Thematic Vector Visual (strictly below hero text safe zone) */}
      <div
        data-canvas-layer="purposeful-visual"
        data-layer-z={BRETTON_Z_LAYERS.purposefulVisual}
        data-bw-visual-scene={sceneId}
        style={{
          position: 'absolute',
          left: layout.visualLeft,
          top: layout.visualTop,
          width: layout.visualWidth,
          height: layout.visualHeight,
          zIndex: BRETTON_Z_LAYERS.purposefulVisual,
          opacity: Number((spatialEnvelope.opacity * enterSp).toFixed(4)),
          transform: `translate3d(${(spatialEnvelope.translateX * 0.5).toFixed(2)}px, ${(spatialEnvelope.translateY * 0.5).toFixed(2)}px, 0) scale(${spatialEnvelope.scale.toFixed(4)})`,
          pointerEvents: 'none',
        }}
      >
        {sceneId === 'global-standard' && <Scene1TradeConvergenceSvg globalFrame={globalFrame} />}
        {sceneId === 'bretton-woods-origin' && <Scene2GoldVaultSvg globalFrame={globalFrame} />}
        {sceneId === 'liquidity-power-engine' && (
          <Scene3LiquidityNetworkSvg globalFrame={globalFrame} />
        )}
        {sceneId === 'heavy-crown-conclusion' && (
          <Scene4CrownEquilibriumSvg globalFrame={globalFrame} />
        )}
      </div>

      {/* Layer z=42: Clean Spoken-So-Far Editorial Subtitle (Zero Future-Word Leaks) */}
      {spokenSentenceWords.length > 0 && (
        <div
          data-canvas-layer="clause-ribbon"
          data-layer-z={BRETTON_Z_LAYERS.spokenSubtitle}
          style={{
            position: 'absolute',
            left: layout.captionHorizontalPad,
            right: layout.captionHorizontalPad,
            bottom: layout.captionBottom,
            zIndex: BRETTON_Z_LAYERS.spokenSubtitle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: spatialEnvelope.opacity,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '4px 8px',
              padding: '6px 20px',
              borderRadius: 999,
              backgroundColor: 'rgba(11, 15, 25, 0.84)',
              border: '1px solid rgba(148, 163, 184, 0.14)',
              textAlign: 'center',
            }}
          >
            {spokenSentenceWords.map((w) => {
              const isCurrent = activeCue?.globalIndex === w.globalIndex;
              const elapsed = Math.max(0, globalFrame - w.startFrame);
              return (
                <StaggeredTextItem
                  key={`bw-sub-${w.globalIndex}`}
                  text={w.text}
                  delay={0}
                  frameOverride={elapsed}
                  profile={SUBTITLE_PROFILES[w.globalIndex % SUBTITLE_PROFILES.length]}
                  variantSeed={w.globalIndex % 4}
                  style={{
                    fontFamily: '"Inter", system-ui, sans-serif',
                    fontSize: layout.captionFontSize,
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? BW_GOLD_BRIGHT : '#e2e8f0',
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

const ConnectedBrettonWoodsUiSimulation: React.FC<{
  sceneId: BrettonSceneId;
  globalFrame: number;
  spatialEnvelope: SpatialSceneEnvelope;
}> = (props) => {
  const {width, height} = useVideoConfig();
  return <BrettonWoodsUiSimulationView {...props} width={width} height={height} />;
};

export const renderBrettonVisualIllustration = (
  sceneId: BrettonSceneId,
  globalFrame: number,
): React.ReactNode => {
  switch (sceneId) {
    case 'global-standard':
      return <Scene1TradeConvergenceSvg globalFrame={globalFrame} />;
    case 'bretton-woods-origin':
      return <Scene2GoldVaultSvg globalFrame={globalFrame} />;
    case 'liquidity-power-engine':
      return <Scene3LiquidityNetworkSvg globalFrame={globalFrame} />;
    case 'heavy-crown-conclusion':
      return <Scene4CrownEquilibriumSvg globalFrame={globalFrame} />;
  }
};

export const BrettonSpokenSubtitleView: React.FC<{
  sceneId: BrettonSceneId;
  globalFrame: number;
  spatialEnvelope: SpatialSceneEnvelope;
  width: number;
  height: number;
}> = ({sceneId, globalFrame, spatialEnvelope, width, height}) => {
  const layout = getBrettonLayout(width, height);
  const activeCue = bwFindCue(globalFrame);
  const currentSentence = SENTENCE_RANGES.find(([lo, hi]) => {
    const firstFrame = BW_SCRIPT_CUES[lo].startFrame;
    const nextStart =
      hi + 1 < BW_SCRIPT_CUES.length ? BW_SCRIPT_CUES[hi + 1].startFrame : 1800;
    return globalFrame >= firstFrame && globalFrame < nextStart;
  });

  const spokenSentenceWords = currentSentence
    ? BW_SCRIPT_CUES.filter(
        (w) =>
          w.globalIndex >= currentSentence[0] &&
          w.globalIndex <= currentSentence[1] &&
          w.startFrame <= globalFrame &&
          w.sceneId === sceneId,
      ).slice(-10)
    : [];

  if (spokenSentenceWords.length === 0) {
    return null;
  }

  return (
    <div
      data-canvas-layer="clause-ribbon"
      data-layer-z={BRETTON_Z_LAYERS.spokenSubtitle}
      style={{
        position: 'absolute',
        left: layout.captionHorizontalPad,
        right: layout.captionHorizontalPad,
        bottom: layout.captionBottom,
        zIndex: BRETTON_Z_LAYERS.spokenSubtitle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: spatialEnvelope.opacity,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '4px 8px',
          padding: '7px 22px',
          borderRadius: 999,
          backgroundColor: 'rgba(15, 23, 42, 0.78)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.45)',
          textAlign: 'center',
        }}
      >
        {spokenSentenceWords.map((w) => {
          const isCurrent = activeCue?.globalIndex === w.globalIndex;
          const elapsed = Math.max(0, globalFrame - w.startFrame);
          return (
            <StaggeredTextItem
              key={`bw-sub-${w.globalIndex}`}
              text={w.text}
              delay={0}
              frameOverride={elapsed}
              profile={SUBTITLE_PROFILES[w.globalIndex % SUBTITLE_PROFILES.length]}
              variantSeed={w.globalIndex % 4}
              style={{
                fontFamily: '"Inter", system-ui, sans-serif',
                fontSize: layout.captionFontSize,
                fontWeight: isCurrent ? 700 : 500,
                color: isCurrent ? '#f59e0b' : '#e2e8f0',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

const ConnectedBrettonSpokenSubtitle: React.FC<{
  sceneId: BrettonSceneId;
  globalFrame: number;
  spatialEnvelope: SpatialSceneEnvelope;
}> = (props) => {
  const {width, height} = useVideoConfig();
  return <BrettonSpokenSubtitleView {...props} width={width} height={height} />;
};

export const BrettonSpokenSubtitleLayer: React.FC<{
  sceneId: BrettonSceneId;
  globalFrame: number;
  spatialEnvelope: SpatialSceneEnvelope;
  widthOverride?: number;
  heightOverride?: number;
}> = ({widthOverride, heightOverride, ...rest}) => {
  if (widthOverride !== undefined && heightOverride !== undefined) {
    return (
      <BrettonSpokenSubtitleView
        {...rest}
        width={widthOverride}
        height={heightOverride}
      />
    );
  }
  return <ConnectedBrettonSpokenSubtitle {...rest} />;
};

export const BrettonWoodsUiSimulation: React.FC<{
  sceneId: BrettonSceneId;
  globalFrame: number;
  spatialEnvelope: SpatialSceneEnvelope;
  cameraPanX?: number;
  widthOverride?: number;
  heightOverride?: number;
}> = ({widthOverride, heightOverride, ...rest}) => {
  if (widthOverride !== undefined && heightOverride !== undefined) {
    return (
      <BrettonWoodsUiSimulationView
        {...rest}
        width={widthOverride}
        height={heightOverride}
      />
    );
  }
  return <ConnectedBrettonWoodsUiSimulation {...rest} />;
};
