import React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {StaggeredTextItem, type TextMotionProfile} from '../StaggeredTextItem';
import {
  BRETTON_Z_LAYERS,
  BW_CRIMSON,
  BW_CYAN,
  BW_EMERALD,
  BW_FPS,
  BW_GOLD,
  BW_MUTED,
  BW_ORANGE,
  BW_SLATE_SURFACE,
  BW_WHITE,
  BW_SCRIPT_CUES,
  bwFindCue,
  type BrettonSceneId,
  type SpatialSceneEnvelope,
} from './brettonWoodsModel';

export type UiEntranceKind =
  | 'spring-rise'
  | 'slide-from-left'
  | 'slide-from-right'
  | 'digital-shutter';

export type BrettonUiClauseSpec = {
  id: string;
  clauseIndex: number;
  sceneId: BrettonSceneId;
  startFrame: number;
  endFrame: number;
  firstWordIndex: number;
  lastWordIndex: number;
  upperSide: 'left' | 'right';
  entranceKind: UiEntranceKind;
  accentColor: string;
  upperTitle: string;
  upperCode: string;
  lowerTitle: string;
  lowerCode: string;
};

export const BW_UI_CLAUSES: readonly BrettonUiClauseSpec[] = [
  // Scene 1A: Saudi Arabia Oil, Tokyo Coffee, Italy Shoes
  {
    id: 'bw-ui-1a',
    clauseIndex: 0,
    sceneId: 'global-standard',
    startFrame: 0,
    endFrame: 189,
    firstWordIndex: 0,
    lastWordIndex: 14,
    upperSide: 'left',
    entranceKind: 'spring-rise',
    accentColor: BW_ORANGE,
    upperTitle: 'SWIFT_MT103 // CROSS-BORDER FX ROUTER',
    upperCode: 'NODE_01A',
    lowerTitle: 'CHIPS_FEDWIRE // USD SETTLEMENT ENGINE',
    lowerCode: 'TERM_01A',
  },
  // Scene 1B: 88% Global Trade One Currency
  {
    id: 'bw-ui-1b',
    clauseIndex: 1,
    sceneId: 'global-standard',
    startFrame: 190,
    endFrame: 308,
    firstWordIndex: 15,
    lastWordIndex: 21,
    upperSide: 'right',
    entranceKind: 'slide-from-right',
    accentColor: BW_ORANGE,
    upperTitle: 'BIS_TRIENNIAL // GLOBAL FX SHARE MATRIX',
    upperCode: 'NODE_01B',
    lowerTitle: 'TRADE_INVOICE_STREAM // DENOMINATION_LOG',
    lowerCode: 'TERM_01B',
  },
  // Scene 2A: 1944 Bretton Woods & World's Gold
  {
    id: 'bw-ui-2a',
    clauseIndex: 2,
    sceneId: 'bretton-woods-origin',
    startFrame: 292,
    endFrame: 618,
    firstWordIndex: 22,
    lastWordIndex: 44,
    upperSide: 'left',
    entranceKind: 'digital-shutter',
    accentColor: BW_GOLD,
    upperTitle: 'ACCORD_1944 // 44-NATION CURRENCY PEG MATRIX',
    upperCode: 'NODE_02A',
    lowerTitle: 'FORT_KNOX_VAULT // OFFICIAL GOLD BULLION LEDGER',
    lowerCode: 'TERM_02A',
  },
  // Scene 2B: Left the Gold Standard, the World Stayed
  {
    id: 'bw-ui-2b',
    clauseIndex: 3,
    sceneId: 'bretton-woods-origin',
    startFrame: 619,
    endFrame: 758,
    firstWordIndex: 45,
    lastWordIndex: 54,
    upperSide: 'right',
    entranceKind: 'slide-from-left',
    accentColor: BW_CYAN,
    upperTitle: 'REGIME_SHIFT_1971 // GOLD WINDOW DIAGNOSTIC',
    upperCode: 'NODE_02B',
    lowerTitle: 'NETWORK_LOCK_IN // POST-GOLD USD RETENTION',
    lowerCode: 'TERM_02B',
  },
  // Scene 3A: Why? Trust, Liquidity, and Depth
  {
    id: 'bw-ui-3a',
    clauseIndex: 4,
    sceneId: 'liquidity-power-engine',
    startFrame: 742,
    endFrame: 978,
    firstWordIndex: 55,
    lastWordIndex: 61,
    upperSide: 'left',
    entranceKind: 'spring-rise',
    accentColor: BW_CYAN,
    upperTitle: 'PRIMARY_DEALER // UST ORDER-BOOK LADDER',
    upperCode: 'NODE_03A',
    lowerTitle: 'SOVEREIGN_PILLARS // TRUST_LIQUIDITY_DEPTH',
    lowerCode: 'TERM_03A',
  },
  // Scene 3B: Trillions in US Treasury Bonds Safety Net
  {
    id: 'bw-ui-3b',
    clauseIndex: 5,
    sceneId: 'liquidity-power-engine',
    startFrame: 979,
    endFrame: 1358,
    firstWordIndex: 62,
    lastWordIndex: 86,
    upperSide: 'right',
    entranceKind: 'digital-shutter',
    accentColor: BW_EMERALD,
    upperTitle: 'CENTRAL_BANK_CUSTODY // $27T+ UST MARKET',
    upperCode: 'NODE_03B',
    lowerTitle: 'TIER_1_COLLATERAL // ULTIMATE_SAFETY_NET',
    lowerCode: 'TERM_03B',
  },
  // Scene 4A: Economic Power & Immense Responsibility
  {
    id: 'bw-ui-4a',
    clauseIndex: 6,
    sceneId: 'heavy-crown-conclusion',
    startFrame: 1342,
    endFrame: 1565,
    firstWordIndex: 87,
    lastWordIndex: 95,
    upperSide: 'left',
    entranceKind: 'slide-from-left',
    accentColor: BW_ORANGE,
    upperTitle: 'GEOECONOMIC_CLEARING // SOVEREIGN LEVERAGE',
    upperCode: 'NODE_04A',
    lowerTitle: 'TRIFFIN_EQUILIBRIUM // POWER_VS_RESPONSIBILITY',
    lowerCode: 'TERM_04A',
  },
  // Scene 4B: Love It or Hate It... For Now, Greenback Holds the Crown
  {
    id: 'bw-ui-4b',
    clauseIndex: 7,
    sceneId: 'heavy-crown-conclusion',
    startFrame: 1566,
    endFrame: 1800,
    firstWordIndex: 96,
    lastWordIndex: 107,
    upperSide: 'right',
    entranceKind: 'spring-rise',
    accentColor: BW_GOLD,
    upperTitle: 'IMF_COFER // GLOBAL RESERVE CROWN HIERARCHY',
    upperCode: 'NODE_04B',
    lowerTitle: 'MONETARY_HORIZON // GREENBACK_CROWN_STATUS',
    lowerCode: 'TERM_04B',
  },
];

const DIGITAL_CARD_SHUTTER = [0.22, 0.46, 0.34, 0.62, 0.84, 0.96, 1.0];

export const computeUiCardMotion = (
  clause: BrettonUiClauseSpec,
  globalFrame: number,
  isLowerCard: boolean,
): {opacity: number; translateX: number; translateY: number; scale: number} => {
  const local = Math.max(0, globalFrame - clause.startFrame);
  const remaining = Math.max(0, clause.endFrame - globalFrame);
  const isFinal = clause.id === 'bw-ui-4b';

  const exitP = isFinal
    ? 1
    : interpolate(remaining, [0, 14], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.cubic),
      });

  const delayedLocal = Math.max(0, local - (isLowerCard ? 3 : 0));

  if (clause.entranceKind === 'spring-rise') {
    const sp = spring({
      frame: delayedLocal,
      fps: BW_FPS,
      config: {damping: 14, stiffness: 180, mass: 0.92},
    });
    const inOp = interpolate(delayedLocal, [0, 12], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return {
      opacity: Number((inOp * exitP).toFixed(4)),
      translateX: 0,
      translateY: (1 - sp) * (isLowerCard ? 28 : -24) + (1 - exitP) * 16,
      scale: 0.96 + 0.04 * sp,
    };
  }

  if (clause.entranceKind === 'slide-from-left' || clause.entranceKind === 'slide-from-right') {
    const sp = spring({
      frame: delayedLocal,
      fps: BW_FPS,
      config: {damping: 16, stiffness: 195, mass: 0.9},
    });
    const baseSign = clause.entranceKind === 'slide-from-left' ? -1 : 1;
    const sign = isLowerCard ? -baseSign : baseSign;
    const inOp = interpolate(delayedLocal, [0, 12], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return {
      opacity: Number((inOp * exitP).toFixed(4)),
      translateX: (1 - sp) * sign * 52 + (1 - exitP) * sign * -28,
      translateY: 0,
      scale: 0.98 + 0.02 * sp,
    };
  }

  // digital-shutter
  const stepOp = DIGITAL_CARD_SHUTTER[Math.min(DIGITAL_CARD_SHUTTER.length - 1, delayedLocal)];
  const settle = interpolate(delayedLocal, [0, 10], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return {
    opacity: Number((stepOp * exitP).toFixed(4)),
    translateX: settle * (isLowerCard ? -16 : 16),
    translateY: settle * 8,
    scale: 1.015 - settle * 0.015,
  };
};

const CardHeader: React.FC<{title: string; code: string; accent: string; pulseOn: boolean}> = ({
  title,
  code,
  accent,
  pulseOn,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 10,
      marginBottom: 12,
      borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 11.5,
      letterSpacing: '0.12em',
    }}
  >
    <div style={{display: 'flex', alignItems: 'center', gap: 8, color: BW_WHITE, fontWeight: 700}}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 2,
          background: accent,
          boxShadow: pulseOn ? `0 0 12px ${accent}` : 'none',
        }}
      />
      <span>{title}</span>
    </div>
    <span style={{color: accent, fontWeight: 700}}>{code}</span>
  </div>
);

const UpperWidgetBody: React.FC<{clause: BrettonUiClauseSpec; globalFrame: number}> = ({
  clause,
  globalFrame,
}) => {
  const local = Math.max(0, globalFrame - clause.startFrame);
  const cursorVisible = Math.floor(globalFrame / 8) % 2 === 0;

  if (clause.id === 'bw-ui-1a') {
    const rows = [
      {
        activeAt: 38,
        pair: 'RIYADH [SAR -> USD]',
        item: 'BRENT CRUDE 100K BBL',
        val: '$7,840,000',
        col: BW_ORANGE,
      },
      {
        activeAt: 92,
        pair: 'TOKYO  [JPY -> USD]',
        item: 'ARABICA COFFEE LOT',
        val: '$142,600',
        col: BW_CYAN,
      },
      {
        activeAt: 139,
        pair: 'MILAN  [EUR -> USD]',
        item: 'ITALIAN FOOTWEAR LC',
        val: '$289,400',
        col: BW_GOLD,
      },
    ];
    return (
      <div style={{fontFamily: '"JetBrains Mono", monospace', fontSize: 12.5}}>
        <div style={{color: BW_MUTED, marginBottom: 10, fontSize: 11}}>
          {'> execute_fx_settlement --target=USD_CORRESPONDENT'}
          {cursorVisible ? ' █' : ''}
        </div>
        {rows.map((r, idx) => {
          const unlocked = globalFrame >= r.activeAt;
          const p = interpolate(globalFrame, [r.activeAt, r.activeAt + 16], [0.18, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div
              key={r.pair}
              style={{
                padding: '9px 11px',
                marginBottom: 8,
                borderRadius: 8,
                background: unlocked ? 'rgba(15, 28, 52, 0.92)' : 'rgba(15, 23, 42, 0.45)',
                border: `1px solid ${unlocked ? r.col + '88' : 'rgba(148,163,184,0.16)'}`,
                opacity: p,
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 700}}>
                <StaggeredTextItem
                  text={r.pair}
                  delay={idx * 3}
                  frameOverride={local}
                  profile="terminal-slide"
                  variantSeed={idx}
                  style={{color: unlocked ? r.col : BW_MUTED}}
                />
                <span style={{color: unlocked ? BW_EMERALD : BW_MUTED}}>
                  {unlocked ? `${r.val} [USD]` : 'ROUTING...'}
                </span>
              </div>
              <div style={{fontSize: 11, color: '#cbd5e1', marginTop: 3}}>{r.item}</div>
            </div>
          );
        })}
      </div>
    );
  }

  if (clause.id === 'bw-ui-1b') {
    const bars = [
      {ccy: 'USD // US DOLLAR', pct: 88, col: BW_ORANGE},
      {ccy: 'EUR // EURO', pct: 31, col: BW_CYAN},
      {ccy: 'JPY // JAPANESE YEN', pct: 17, col: '#64748b'},
      {ccy: 'GBP // STERLING', pct: 13, col: '#475569'},
    ];
    const fillProg = interpolate(local, [0, 26], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
    return (
      <div style={{fontFamily: '"JetBrains Mono", monospace', fontSize: 12}}>
        {bars.map((b, i) => (
          <div key={b.ccy} style={{marginBottom: 12}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
              <span style={{color: i === 0 ? BW_WHITE : BW_MUTED, fontWeight: 700}}>{b.ccy}</span>
              <span style={{color: b.col, fontWeight: 800}}>
                {Math.round(b.pct * fillProg)}%
              </span>
            </div>
            <div
              style={{
                height: 10,
                borderRadius: 5,
                background: 'rgba(30, 41, 59, 0.85)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${(b.pct * fillProg).toFixed(1)}%`,
                  height: '100%',
                  background: b.col,
                  boxShadow: i === 0 ? `0 0 14px ${BW_ORANGE}` : 'none',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (clause.id === 'bw-ui-2a') {
    const pegs = [
      ['GBP // UNITED KINGDOM', 'FIXED PEG -> $4.03 USD', 340],
      ['FRF // FRENCH REPUBLIC', 'FIXED PEG -> $0.02 USD', 395],
      ['CAD // CANADA', 'FIXED PEG -> $0.91 USD', 450],
      ['USD // RESERVE ANCHOR', 'CONVERTIBLE @ $35.00 / OZ AU', 515],
    ] as const;
    return (
      <div style={{fontFamily: '"JetBrains Mono", monospace', fontSize: 12}}>
        {pegs.map(([ccy, rate, fOn], idx) => {
          const active = globalFrame >= fOn;
          return (
            <div
              key={ccy}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 10px',
                marginBottom: 8,
                borderRadius: 7,
                background: active ? 'rgba(245, 158, 11, 0.12)' : 'rgba(15, 23, 42, 0.5)',
                border: `1px solid ${active ? BW_GOLD + '80' : 'rgba(148,163,184,0.16)'}`,
              }}
            >
              <StaggeredTextItem
                text={ccy}
                delay={idx * 3}
                frameOverride={local}
                profile="hook-pop"
                variantSeed={idx}
                style={{color: active ? BW_WHITE : BW_MUTED, fontWeight: 700}}
              />
              <span style={{color: active ? BW_GOLD : BW_MUTED, fontWeight: 700}}>{rate}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (clause.id === 'bw-ui-2b') {
    const severed = globalFrame >= 653;
    return (
      <div style={{fontFamily: '"JetBrains Mono", monospace', fontSize: 12.5}}>
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            marginBottom: 10,
            background: severed ? 'rgba(225, 29, 72, 0.16)' : 'rgba(245, 158, 11, 0.14)',
            border: `1px solid ${severed ? BW_CRIMSON : BW_GOLD}`,
          }}
        >
          <div style={{color: severed ? BW_CRIMSON : BW_GOLD, fontWeight: 800}}>
            {severed
              ? 'ALERT // AUG 1971: GOLD WINDOW SUSPENDED'
              : 'GOLD CONVERTIBILITY WINDOW: ACTIVE'}
          </div>
          <div style={{fontSize: 11, color: '#e2e8f0', marginTop: 4}}>
            {severed
              ? 'BULLION CONVERTIBILITY TERMINATED -> FIAT FLOAT'
              : 'TREASURY GOLD WINDOW @ $35/OZ'}
          </div>
        </div>
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            background: 'rgba(16, 185, 129, 0.14)',
            border: `1px solid ${BW_EMERALD}`,
          }}
        >
          <div style={{color: BW_EMERALD, fontWeight: 800}}>
            GLOBAL DOLLAR NETWORK: LOCKED & RETAINED
          </div>
          <div style={{fontSize: 11, color: '#cbd5e1', marginTop: 4}}>
            SOVEREIGN FX RAILS, COMMODITIES & DEBT STAYED IN USD
          </div>
        </div>
      </div>
    );
  }

  if (clause.id === 'bw-ui-3a') {
    const tenors = [
      ['UST 2Y NOTE', '4.18%', '$420M BID', '0.3 BPS'],
      ['UST 5Y NOTE', '4.09%', '$580M BID', '0.4 BPS'],
      ['UST 10Y BENCH', '4.24%', '$950M BID', '0.4 BPS'],
      ['UST 30Y BOND', '4.46%', '$390M BID', '0.6 BPS'],
    ];
    return (
      <div style={{fontFamily: '"JetBrains Mono", monospace', fontSize: 12}}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: BW_MUTED,
            fontSize: 10.5,
            marginBottom: 6,
          }}
        >
          <span>BENCHMARK</span>
          <span>YIELD</span>
          <span>INSTANT DEPTH</span>
          <span>SPREAD</span>
        </div>
        {tenors.map(([name, yld, depth, spr], idx) => (
          <div
            key={name}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 10px',
              marginBottom: 6,
              borderRadius: 6,
              background: 'rgba(15, 28, 52, 0.78)',
              border: '1px solid rgba(56, 189, 248, 0.28)',
            }}
          >
            <StaggeredTextItem
              text={name}
              delay={idx * 3}
              frameOverride={local}
              profile="telemetry-flicker"
              variantSeed={idx}
              style={{color: BW_WHITE, fontWeight: 700}}
            />
            <span style={{color: BW_CYAN}}>{yld}</span>
            <span style={{color: BW_EMERALD, fontWeight: 700}}>{depth}</span>
            <span style={{color: BW_GOLD}}>{spr}</span>
          </div>
        ))}
      </div>
    );
  }

  if (clause.id === 'bw-ui-3b') {
    const holders = [
      ['JAPAN // MOF RESERVES', '$1.10T UST', 88],
      ['EUROSYSTEM & UK // CUSTODY', '$1.54T UST', 94],
      ['GLOBAL CENTRAL BANKS', '$8.10T+ OFFICIAL', 100],
    ] as const;
    const grow = interpolate(local, [0, 40], [0.25, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
    return (
      <div style={{fontFamily: '"JetBrains Mono", monospace', fontSize: 12}}>
        {holders.map(([label, amt, bar]) => (
          <div key={label} style={{marginBottom: 13}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
              <span style={{color: BW_WHITE, fontWeight: 700}}>{label}</span>
              <span style={{color: BW_EMERALD, fontWeight: 800}}>{amt}</span>
            </div>
            <div style={{height: 9, borderRadius: 5, background: 'rgba(30,41,59,0.85)'}}>
              <div
                style={{
                  width: `${(bar * grow).toFixed(1)}%`,
                  height: '100%',
                  borderRadius: 5,
                  background: `linear-gradient(90deg, ${BW_CYAN}, ${BW_EMERALD})`,
                }}
              />
            </div>
          </div>
        ))}
        <div style={{fontSize: 11, color: BW_CYAN, marginTop: 6}}>
          TOTAL MARKETABLE US TREASURY POOL: $27.6 TRILLION
        </div>
      </div>
    );
  }

  if (clause.id === 'bw-ui-4a') {
    const powerActive = globalFrame >= 1404;
    const dutyActive = globalFrame >= 1479;
    return (
      <div style={{fontFamily: '"JetBrains Mono", monospace', fontSize: 12}}>
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            marginBottom: 10,
            background: powerActive ? 'rgba(255, 69, 0, 0.16)' : 'rgba(15, 23, 42, 0.5)',
            border: `1px solid ${BW_ORANGE}`,
          }}
        >
          <div style={{color: BW_ORANGE, fontWeight: 800}}>
            01 // IMMENSE ECONOMIC POWER
          </div>
          <div style={{fontSize: 11, color: '#e2e8f0', marginTop: 4}}>
            GLOBAL CLEARING JURISDICTION & LOWER SOVEREIGN BORROWING COST
          </div>
        </div>
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            background: dutyActive ? 'rgba(56, 189, 248, 0.16)' : 'rgba(15, 23, 42, 0.45)',
            border: `1px solid ${dutyActive ? BW_CYAN : 'rgba(148,163,184,0.25)'}`,
          }}
        >
          <div style={{color: dutyActive ? BW_CYAN : BW_MUTED, fontWeight: 800}}>
            02 // IMMENSE GLOBAL RESPONSIBILITY
          </div>
          <div style={{fontSize: 11, color: '#cbd5e1', marginTop: 4}}>
            FED CENTRAL BANK SWAP LINES & WORLD LIQUIDITY BACKSTOP
          </div>
        </div>
      </div>
    );
  }

  // bw-ui-4b: IMF COFER Reserve Crown Hierarchy
  const shares = [
    ['USD // US GREENBACK [CROWN]', 58.9, BW_GOLD],
    ['EUR // EUROZONE', 19.8, BW_CYAN],
    ['JPY // JAPANESE YEN', 5.5, '#64748b'],
    ['GBP // BRITISH POUND', 4.9, '#475569'],
  ] as const;
  return (
    <div style={{fontFamily: '"JetBrains Mono", monospace', fontSize: 12}}>
      {shares.map(([name, pct, col], idx) => (
        <div key={name} style={{marginBottom: 11}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
            <span style={{color: idx === 0 ? BW_GOLD : BW_MUTED, fontWeight: 700}}>{name}</span>
            <span style={{color: col, fontWeight: 800}}>{pct}%</span>
          </div>
          <div style={{height: 9, borderRadius: 5, background: 'rgba(30,41,59,0.85)'}}>
            <div
              style={{
                width: `${pct * 1.45}%`,
                height: '100%',
                borderRadius: 5,
                background: col,
                boxShadow: idx === 0 ? `0 0 12px ${BW_GOLD}` : 'none',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const LowerTerminalBody: React.FC<{clause: BrettonUiClauseSpec; globalFrame: number}> = ({
  clause,
  globalFrame,
}) => {
  const local = Math.max(0, globalFrame - clause.startFrame);
  const cursor = Math.floor(globalFrame / 7) % 2 === 0 ? '█' : ' ';

  const linesByClause: Record<string, readonly {prefix: string; text: string; color: string}[]> = {
    'bw-ui-1a': [
      {prefix: 'PIPE_01', text: 'SAUDI_CRUDE -> FX_SPOT -> USD_CLEARED', color: BW_ORANGE},
      {prefix: 'PIPE_02', text: 'TOKYO_RETAIL -> WHOLESALE_FX -> USD_CLEARED', color: BW_CYAN},
      {prefix: 'PIPE_03', text: 'MILAN_EXPORT -> SWIFT_MT202 -> USD_CLEARED', color: BW_GOLD},
      {prefix: 'STATUS ', text: `CORRESPONDENT_LEDGER: ACTIVE ${cursor}`, color: BW_EMERALD},
    ],
    'bw-ui-1b': [
      {prefix: 'METRIC ', text: 'FX_SETTLEMENT_SHARE = 88.0% (BIS_SURVEY)', color: BW_ORANGE},
      {prefix: 'INVOICE', text: 'COMMODITIES + SHIPPING + AVIATION -> USD', color: BW_WHITE},
      {prefix: 'NETWORK', text: 'DEEPEST_COUNTERPARTY_POOL = US_DOLLAR', color: BW_CYAN},
      {prefix: 'VERIFY ', text: `SINGLE_CURRENCY_STANDARD: CONFIRMED ${cursor}`, color: BW_EMERALD},
    ],
    'bw-ui-2a': [
      {prefix: 'TREATY ', text: 'BRETTON_WOODS_ACCORD(1944, NATIONS=44)', color: BW_GOLD},
      {prefix: 'ANCHOR ', text: '1_TROY_OZ_GOLD == $35.00_US_DOLLAR', color: BW_ORANGE},
      {prefix: 'RESERVE', text: 'US_BULLION_SHARE = 73.4% GLOBAL_OFFICIAL_AU', color: BW_GOLD},
      {prefix: 'VAULT  ', text: `FORT_KNOX_AUDIT: VERIFIED ${cursor}`, color: BW_EMERALD},
    ],
    'bw-ui-2b': [
      {prefix: 'EVENT  ', text: '1971_NIXON_SHOCK -> GOLD_PEG = FALSE', color: BW_CRIMSON},
      {prefix: 'INERTIA', text: 'GLOBAL_FX_MARKETS.MIGRATE() -> NONE_FOUND', color: BW_CYAN},
      {prefix: 'RESULT ', text: 'WORLD_STAYED_ON_USD = TRUE (NETWORK_LOCK)', color: BW_EMERALD},
      {prefix: 'LEDGER ', text: `FIAT_RESERVE_STANDARD: ACTIVE ${cursor}`, color: BW_GOLD},
    ],
    'bw-ui-3a': [
      {prefix: 'PILLAR1', text: 'TRUST     => INDEPENDENT_INSTITUTIONS [OK]', color: BW_CYAN},
      {prefix: 'PILLAR2', text: 'LIQUIDITY => $7.5T_DAILY_TURNOVER     [OK]', color: BW_EMERALD},
      {prefix: 'PILLAR3', text: 'DEPTH     => ZERO_SLIPPAGE_EXECUTION  [OK]', color: BW_GOLD},
      {prefix: 'ENGINE ', text: `FEDWIRE_SECURITIES_LATENCY: 0.8ms ${cursor}`, color: BW_WHITE},
    ],
    'bw-ui-3b': [
      {prefix: 'ASSET  ', text: 'US_TREASURY_BONDS // RISK_FREE_BENCHMARK', color: BW_CYAN},
      {prefix: 'VOLUME ', text: 'SOVEREIGN_AND_BANK_RESERVES > $8,100,000,000,000', color: BW_EMERALD},
      {prefix: 'BUFFER ', text: 'ULTIMATE_SAFETY_NET = HQLA_TIER_1_ASSET', color: BW_GOLD},
      {prefix: 'STATUS ', text: `GLOBAL_COLLATERAL_CHAIN: STABLE ${cursor}`, color: BW_EMERALD},
    ],
    'bw-ui-4a': [
      {prefix: 'VECTOR1', text: 'ECONOMIC_POWER   => GLOBAL_SANCTIONS_AND_CREDIT', color: BW_ORANGE},
      {prefix: 'VECTOR2', text: 'RESPONSIBILITY   => WORLD_CRISIS_SWAP_LIQUIDITY', color: BW_CYAN},
      {prefix: 'BALANCE', text: 'SOVEREIGN_PRIVILEGE <-> FISCAL_STEWARDSHIP', color: BW_GOLD},
      {prefix: 'MONITOR', text: `WASHINGTON_TREASURY_LINK: LIVE ${cursor}`, color: BW_WHITE},
    ],
    'bw-ui-4b': [
      {prefix: 'CROWN  ', text: 'RESERVE_MONARCH = "USD_GREENBACK"', color: BW_GOLD},
      {prefix: 'RIVALS ', text: 'EUR | JPY | GBP | CNY -> FRAGMENTED_DEPTH', color: BW_CYAN},
      {prefix: 'VERDICT', text: 'FOR_NOW => GREENBACK_HOLDS_THE_CROWN', color: BW_ORANGE},
      {prefix: 'HORIZON', text: `EPOCH_STATUS: UNDISPUTED_#1 ${cursor}`, color: BW_EMERALD},
    ],
  };

  const lines = linesByClause[clause.id] ?? linesByClause['bw-ui-1a'];

  return (
    <div
      style={{
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: 12,
        lineHeight: 1.65,
      }}
    >
      {lines.map((ln, idx) => (
        <div
          key={`${clause.id}-ln-${idx}`}
          style={{
            display: 'flex',
            gap: 10,
            padding: '5px 8px',
            marginBottom: 5,
            borderRadius: 6,
            background: 'rgba(11, 18, 34, 0.72)',
            borderLeft: `2px solid ${ln.color}`,
          }}
        >
          <span style={{color: BW_MUTED, fontWeight: 700, minWidth: 62}}>[{ln.prefix}]</span>
          <StaggeredTextItem
            text={ln.text}
            delay={idx * 3}
            frameOverride={local}
            profile={idx % 2 === 0 ? 'terminal-slide' : 'telemetry-flicker'}
            variantSeed={idx}
            style={{color: ln.color, fontWeight: 600}}
          />
        </div>
      ))}
    </div>
  );
};

const RIBBON_WORD_PROFILES: readonly TextMotionProfile[] = [
  'terminal-slide',
  'hook-pop',
  'telemetry-flicker',
];

/**
 * Decoupled Contextual UI Simulation Layers:
 * - zIndex 20: Upper Asymmetric Background UI Widget
 * - zIndex 30: Opposing Lower Terminal Execution Box
 * - zIndex 42: Spoken-So-Far Clause Caption Ribbon (zero future-word previews!)
 */
export const BrettonWoodsUiSimulation: React.FC<{
  sceneId: BrettonSceneId;
  globalFrame: number;
  spatialEnvelope: SpatialSceneEnvelope;
  cameraPanX: number;
}> = ({sceneId, globalFrame, spatialEnvelope, cameraPanX}) => {
  const clause = BW_UI_CLAUSES.find(
    (c) =>
      c.sceneId === sceneId &&
      globalFrame >= c.startFrame &&
      globalFrame <= c.endFrame,
  );

  if (!clause || spatialEnvelope.opacity <= 0.001) {
    return null;
  }

  const upperMotion = computeUiCardMotion(clause, globalFrame, false);
  const lowerMotion = computeUiCardMotion(clause, globalFrame, true);
  const pulseOn = Math.floor(globalFrame / 10) % 2 === 0;

  const upperLeft = clause.upperSide === 'left' ? 52 : 1296;
  const lowerLeft = clause.upperSide === 'left' ? 1268 : 52;

  // Strictly spoken words in the current clause up to `globalFrame` (NEVER future words!)
  const activeCue = bwFindCue(globalFrame);
  const spokenClauseWords = BW_SCRIPT_CUES.filter(
    (w) =>
      w.globalIndex >= clause.firstWordIndex &&
      w.globalIndex <= clause.lastWordIndex &&
      w.startFrame <= globalFrame,
  );

  return (
    <>
      {/* Layer z=20: Independent Upper Asymmetric Contextual UI Widget */}
      <div
        data-canvas-layer="ui-background-widget"
        data-layer-z={BRETTON_Z_LAYERS.uiBackgroundWidget}
        data-bw-ui-clause={clause.id}
        style={{
          position: 'absolute',
          left: upperLeft,
          top: 86,
          width: 572,
          minHeight: 284,
          zIndex: BRETTON_Z_LAYERS.uiBackgroundWidget,
          padding: '16px 18px',
          borderRadius: 14,
          background: BW_SLATE_SURFACE,
          backdropFilter: 'blur(6px)',
          border: `1px solid ${clause.accentColor}4d`,
          boxShadow: '0 20px 50px rgba(5, 10, 24, 0.62)',
          opacity: Number((upperMotion.opacity * spatialEnvelope.opacity).toFixed(4)),
          transform: `translate3d(${(upperMotion.translateX + spatialEnvelope.translateX * 0.6 - cameraPanX * 3.2).toFixed(2)}px, ${(upperMotion.translateY + spatialEnvelope.translateY * 0.6).toFixed(2)}px, 0) scale(${upperMotion.scale.toFixed(4)})`,
          pointerEvents: 'none',
        }}
      >
        <CardHeader
          title={clause.upperTitle}
          code={clause.upperCode}
          accent={clause.accentColor}
          pulseOn={pulseOn}
        />
        <UpperWidgetBody clause={clause} globalFrame={globalFrame} />
      </div>

      {/* Layer z=30: Independent Opposing Lower Terminal Box */}
      <div
        data-canvas-layer="terminal-box"
        data-layer-z={BRETTON_Z_LAYERS.terminalBox}
        data-bw-terminal-clause={clause.id}
        style={{
          position: 'absolute',
          left: lowerLeft,
          top: 646,
          width: 600,
          minHeight: 268,
          zIndex: BRETTON_Z_LAYERS.terminalBox,
          padding: '16px 18px',
          borderRadius: 14,
          background: 'rgba(10, 18, 34, 0.84)',
          backdropFilter: 'blur(6px)',
          border: `1px solid ${clause.accentColor}55`,
          boxShadow: '0 22px 54px rgba(5, 10, 24, 0.72)',
          opacity: Number((lowerMotion.opacity * spatialEnvelope.opacity).toFixed(4)),
          transform: `translate3d(${(lowerMotion.translateX + spatialEnvelope.translateX * 0.85 - cameraPanX * 4.8).toFixed(2)}px, ${(lowerMotion.translateY + spatialEnvelope.translateY * 0.85).toFixed(2)}px, 0) scale(${lowerMotion.scale.toFixed(4)})`,
          pointerEvents: 'none',
        }}
      >
        <CardHeader
          title={clause.lowerTitle}
          code={clause.lowerCode}
          accent={clause.accentColor}
          pulseOn={!pulseOn}
        />
        <LowerTerminalBody clause={clause} globalFrame={globalFrame} />
      </div>

      {/* Layer z=42: Independent Spoken-So-Far Clause Ribbon (Zero Future-Word Previews) */}
      {spokenClauseWords.length > 0 && (
        <div
          data-canvas-layer="clause-ribbon"
          data-layer-z={BRETTON_Z_LAYERS.clauseRibbon}
          data-bw-spoken-count={spokenClauseWords.length}
          style={{
            position: 'absolute',
            left: 290,
            right: 290,
            top: 950,
            height: 46,
            overflow: 'hidden',
            zIndex: BRETTON_Z_LAYERS.clauseRibbon,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'nowrap',
            gap: 9,
            padding: '0 24px',
            borderRadius: 999,
            background: 'rgba(11, 18, 34, 0.82)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(148, 163, 184, 0.24)',
            opacity: spatialEnvelope.opacity,
            transform: `translate3d(${(spatialEnvelope.translateX * 0.92).toFixed(2)}px, 0, 0)`,
            pointerEvents: 'none',
          }}
        >
          {spokenClauseWords.slice(-11).map((w) => {
            const isCurrent = activeCue?.globalIndex === w.globalIndex;
            const wordElapsed = Math.max(0, globalFrame - w.startFrame);
            return (
              <StaggeredTextItem
                key={`bw-spoken-${w.globalIndex}`}
                text={w.text}
                delay={0}
                frameOverride={wordElapsed}
                profile={RIBBON_WORD_PROFILES[w.globalIndex % RIBBON_WORD_PROFILES.length]}
                variantSeed={w.globalIndex % 4}
                style={{
                  fontFamily: '"Inter", system-ui, sans-serif',
                  fontSize: 17,
                  fontWeight: isCurrent ? 800 : 500,
                  color: isCurrent ? clause.accentColor : '#e2e8f0',
                  textShadow: isCurrent ? `0 0 14px ${clause.accentColor}66` : 'none',
                }}
              />
            );
          })}
        </div>
      )}
    </>
  );
};
