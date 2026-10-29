import React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {StaggeredTextItem, type TextMotionProfile} from '../StaggeredTextItem';
import {
  BRETTON_Z_LAYERS,
  BW_CYAN,
  BW_EMERALD,
  BW_FPS,
  BW_GOLD,
  BW_ORANGE,
  BW_WHITE,
  type BrettonSceneId,
  type SpatialSceneEnvelope,
} from './brettonWoodsModel';

export type BrettonHeroWindow = {
  id: string;
  sceneId: BrettonSceneId;
  startFrame: number;
  endFrame: number;
  headline: string;
  eyebrow: string;
  subtag: string;
  dynamicSubtagAfterFrame?: {frame: number; text: string; color: string};
  profile: TextMotionProfile;
  physicsVariant: number;
  accentColor: string;
  isGiantStat?: boolean;
};

/**
 * 15 sequential polymorphic hero kinetic windows across 0..1800 frames.
 * Strictly alternates motion profiles (zero adjacent repeats across the entire 60s film)
 * and showcases every required Kinetic Text callout from the 4-part Bretton Woods script.
 */
export const BW_HERO_WINDOWS: readonly BrettonHeroWindow[] = [
  // === SCENE 1 [0:00 - 0:10] ===
  {
    id: 's1-saudi-oil',
    sceneId: 'global-standard',
    startFrame: 10,
    endFrame: 87,
    headline: 'SAUDI ARABIA // OIL',
    eyebrow: 'PETRODOLLAR SETTLEMENT // RIYADH 24.7°N',
    subtag: 'BRENT & ARAB LIGHT CRUDE -> INVOICED IN USD',
    profile: 'hook-pop',
    physicsVariant: 0,
    accentColor: BW_ORANGE,
  },
  {
    id: 's1-tokyo-coffee',
    sceneId: 'global-standard',
    startFrame: 88,
    endFrame: 134,
    headline: 'TOKYO // COFFEE',
    eyebrow: 'COMMODITY SUPPLY CHAIN // TOKYO 35.7°N',
    subtag: 'ICE COFFEE FUTURES & WHOLESALE FX -> USD',
    profile: 'terminal-slide',
    physicsVariant: 0,
    accentColor: BW_CYAN,
  },
  {
    id: 's1-italy-shoes',
    sceneId: 'global-standard',
    startFrame: 135,
    endFrame: 189,
    headline: 'ITALY // EXPORT',
    eyebrow: 'CROSS-BORDER LETTER OF CREDIT // MILAN 45.5°N',
    subtag: 'SWIFT MT103 CORRESPONDENT CLEARING -> USD',
    profile: 'telemetry-flicker',
    physicsVariant: 0,
    accentColor: BW_GOLD,
  },
  {
    id: 's1-88-percent',
    sceneId: 'global-standard',
    startFrame: 190,
    endFrame: 245,
    headline: '88%',
    eyebrow: 'BANK FOR INTERNATIONAL SETTLEMENTS // FX TURNOVER',
    subtag: 'ALL INTERNATIONAL FOREIGN EXCHANGE TRADES INVOLVE USD',
    profile: 'hook-pop',
    physicsVariant: 1,
    accentColor: BW_ORANGE,
    isGiantStat: true,
  },
  {
    id: 's1-global-trade',
    sceneId: 'global-standard',
    startFrame: 246,
    endFrame: 306,
    headline: 'GLOBAL TRADE',
    eyebrow: '88% FX DOMINANCE // ONE UNIVERSAL DENOMINATION',
    subtag: 'ONE CURRENCY SETTLING THE MODERN WORLD ECONOMY',
    profile: 'terminal-slide',
    physicsVariant: 1,
    accentColor: BW_ORANGE,
  },

  // === SCENE 2 [0:10 - 0:25] ===
  {
    id: 's2-1944',
    sceneId: 'bretton-woods-origin',
    startFrame: 302,
    endFrame: 410,
    headline: '1944',
    eyebrow: 'BRETTON WOODS, NEW HAMPSHIRE // 44 ALLIED NATIONS',
    subtag: 'MOUNT WASHINGTON MONETARY & FINANCIAL CONFERENCE',
    profile: 'telemetry-flicker',
    physicsVariant: 1,
    accentColor: BW_GOLD,
    isGiantStat: true,
  },
  {
    id: 's2-the-pivot',
    sceneId: 'bretton-woods-origin',
    startFrame: 411,
    endFrame: 520,
    headline: 'THE PIVOT',
    eyebrow: 'FIXED EXCHANGE RATE ARCHITECTURE // FX -> USD',
    subtag: 'SOVEREIGN CURRENCIES PEGGED DIRECTLY TO THE US DOLLAR',
    profile: 'hook-pop',
    physicsVariant: 2,
    accentColor: BW_ORANGE,
  },
  {
    id: 's2-backed-by-gold',
    sceneId: 'bretton-woods-origin',
    startFrame: 521,
    endFrame: 755,
    headline: 'BACKED BY GOLD',
    eyebrow: 'FORT KNOX BULLION DEPOSITORY // $35.00 PER TROY OZ',
    subtag: 'AMERICA HELD ~75% OF OFFICIAL WORLD MONETARY GOLD',
    dynamicSubtagAfterFrame: {
      frame: 650,
      text: '1971 GOLD STANDARD ENDED — YET GLOBAL MARKETS STAYED ON USD',
      color: BW_CYAN,
    },
    profile: 'terminal-slide',
    physicsVariant: 2,
    accentColor: BW_GOLD,
  },

  // === SCENE 3 [0:25 - 0:45] ===
  {
    id: 's3-trust',
    sceneId: 'liquidity-power-engine',
    startFrame: 750,
    endFrame: 850,
    headline: 'TRUST',
    eyebrow: 'PILLAR 01 // RULE OF LAW & FULL FAITH SOVEREIGN CREDIT',
    subtag: 'INSTITUTIONAL TRANSPARENCY & ZERO DEFAULT SOVEREIGN RECORD',
    profile: 'telemetry-flicker',
    physicsVariant: 2,
    accentColor: BW_CYAN,
  },
  {
    id: 's3-liquidity',
    sceneId: 'liquidity-power-engine',
    startFrame: 851,
    endFrame: 978,
    headline: 'LIQUIDITY',
    eyebrow: 'PILLAR 02 // INSTANTANEOUS $7.5T/DAY FX & REPO DEPTH',
    subtag: 'CONVERT TRILLIONS AT SUB-BASIS-POINT SPREADS IN MILLISECONDS',
    profile: 'hook-pop',
    physicsVariant: 3,
    accentColor: BW_EMERALD,
  },
  {
    id: 's3-treasury-depth',
    sceneId: 'liquidity-power-engine',
    startFrame: 979,
    endFrame: 1162,
    headline: '$27T+ TREASURY DEPTH',
    eyebrow: 'US FINANCIAL MARKETS // DEEPEST CAPITAL POOL ON EARTH',
    subtag: 'CENTRAL BANKS & SOVEREIGN FUNDS PARK TRILLIONS IN UST BONDS',
    profile: 'terminal-slide',
    physicsVariant: 3,
    accentColor: BW_CYAN,
  },
  {
    id: 's3-unrivaled-stability',
    sceneId: 'liquidity-power-engine',
    startFrame: 1163,
    endFrame: 1355,
    headline: 'UNRIVALED STABILITY',
    eyebrow: 'TIER-1 SOVEREIGN COLLATERAL // THE ULTIMATE SAFETY NET',
    subtag: 'US TREASURY BONDS BACKSTOP GLOBAL BANKING BALANCE SHEETS',
    profile: 'hook-pop',
    physicsVariant: 0,
    accentColor: BW_EMERALD,
  },

  // === SCENE 4 [0:45 - 1:00] ===
  {
    id: 's4-economic-power',
    sceneId: 'heavy-crown-conclusion',
    startFrame: 1350,
    endFrame: 1528,
    headline: 'ECONOMIC POWER',
    eyebrow: 'EXORBITANT PRIVILEGE <-> GLOBAL LIQUIDITY RESPONSIBILITY',
    subtag: 'WASHINGTON WIELDS UNMATCHED FINANCIAL LEVERAGE & DUTY',
    profile: 'terminal-slide',
    physicsVariant: 0,
    accentColor: BW_ORANGE,
  },
  {
    id: 's4-king-of-currencies',
    sceneId: 'heavy-crown-conclusion',
    startFrame: 1529,
    endFrame: 1662,
    headline: 'THE KING OF CURRENCIES',
    eyebrow: '59% GLOBAL RESERVES // 88% FX SETTLEMENT // #1 SAFE HAVEN',
    subtag: 'LOVE IT OR HATE IT — NO RIVAL MATCHES THE DOLLAR NETWORK',
    profile: 'hook-pop',
    physicsVariant: 1,
    accentColor: BW_GOLD,
  },
  {
    id: 's4-for-now',
    sceneId: 'heavy-crown-conclusion',
    startFrame: 1663,
    endFrame: 1799,
    headline: 'FOR NOW...',
    eyebrow: 'THE GREENBACK HOLDS THE CROWN // MONETARY HORIZON',
    subtag: 'SOVEREIGN RESERVE HEGEMONY REMAINS LOCKED ON THE US DOLLAR',
    profile: 'telemetry-flicker',
    physicsVariant: 3,
    accentColor: BW_ORANGE,
  },
];

const SHUTTER_OPACITY_STEPS = [0.18, 0.44, 0.28, 0.66, 0.52, 0.80, 0.94, 1.0];

export const computeHeroContainerMotion = (
  win: BrettonHeroWindow,
  globalFrame: number,
): {opacity: number; translateX: number; translateY: number; scale: number} => {
  const local = Math.max(0, globalFrame - win.startFrame);
  const remaining = Math.max(0, win.endFrame - globalFrame);
  const exitFrames = win.id === 's4-for-now' ? 0 : 12;

  const exitEnvelope =
    exitFrames === 0
      ? 1
      : interpolate(remaining, [0, exitFrames], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.inOut(Easing.cubic),
        });

  if (win.profile === 'hook-pop') {
    const sp = spring({
      frame: local,
      fps: BW_FPS,
      config: {
        damping: 9 + (win.physicsVariant % 3),
        stiffness: 265 + win.physicsVariant * 15,
        mass: 0.86,
      },
    });
    const enterOpacity = interpolate(local, [0, 8], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return {
      opacity: Number((enterOpacity * exitEnvelope).toFixed(4)),
      translateX: 0,
      translateY: (1 - sp) * 32 - (1 - exitEnvelope) * 18,
      scale: 0.86 + 0.14 * sp - (1 - exitEnvelope) * 0.04,
    };
  }

  if (win.profile === 'terminal-slide') {
    const sp = spring({
      frame: local,
      fps: BW_FPS,
      config: {
        damping: 15 + (win.physicsVariant % 3),
        stiffness: 195 + win.physicsVariant * 12,
        mass: 0.94,
      },
    });
    const dir = win.physicsVariant % 2 === 0 ? -68 : 68;
    const enterOpacity = interpolate(local, [0, 10], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return {
      opacity: Number((enterOpacity * exitEnvelope).toFixed(4)),
      translateX: (1 - sp) * dir - (1 - exitEnvelope) * dir * 0.45,
      translateY: 0,
      scale: 0.98 + 0.02 * sp,
    };
  }

  // telemetry-flicker
  const stepIdx = Math.min(SHUTTER_OPACITY_STEPS.length - 1, local);
  const enterOpacity = SHUTTER_OPACITY_STEPS[stepIdx];
  const snap = interpolate(local, [0, 9], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return {
    opacity: Number((enterOpacity * exitEnvelope).toFixed(4)),
    translateX: snap * (win.physicsVariant % 2 === 0 ? 14 : -14),
    translateY: snap * -10 + (1 - exitEnvelope) * -12,
    scale: 1.03 - snap * 0.03,
  };
};

const WORD_PROFILES: readonly TextMotionProfile[] = [
  'hook-pop',
  'terminal-slide',
  'telemetry-flicker',
];

/**
 * Layer z=55: Independent Foreground Hero Kinetic Typography Plane.
 * Mounted directly onto the 1920x1080 `<AbsoluteFill>` with radial Z-separation halo.
 */
export const BrettonWoodsHeroKineticLayer: React.FC<{
  sceneId: BrettonSceneId;
  globalFrame: number;
  spatialEnvelope: SpatialSceneEnvelope;
  cameraPanX: number;
}> = ({sceneId, globalFrame, spatialEnvelope, cameraPanX}) => {
  const activeWin = BW_HERO_WINDOWS.find(
    (w) =>
      w.sceneId === sceneId &&
      globalFrame >= w.startFrame &&
      globalFrame <= w.endFrame,
  );

  if (!activeWin || spatialEnvelope.opacity <= 0.001) {
    return null;
  }

  const motion = computeHeroContainerMotion(activeWin, globalFrame);
  const words = activeWin.headline.split(/\s+/);
  const localFrame = Math.max(0, globalFrame - activeWin.startFrame);

  const subtagState =
    activeWin.dynamicSubtagAfterFrame &&
    globalFrame >= activeWin.dynamicSubtagAfterFrame.frame
      ? {
          text: activeWin.dynamicSubtagAfterFrame.text,
          color: activeWin.dynamicSubtagAfterFrame.color,
        }
      : {text: activeWin.subtag, color: '#cbd5e1'};

  const fontSize = activeWin.isGiantStat
    ? 138
    : activeWin.headline.length > 18
      ? 68
      : 84;

  const combinedOpacity = Number((motion.opacity * spatialEnvelope.opacity).toFixed(4));
  const parallaxX = -cameraPanX * 6.5;

  return (
    <div
      data-canvas-layer="hero-kinetic-text"
      data-layer-z={BRETTON_Z_LAYERS.heroKineticText}
      data-bw-hero-id={activeWin.id}
      data-bw-hero-profile={activeWin.profile}
      style={{
        position: 'absolute',
        left: 210,
        width: 1500,
        top: activeWin.isGiantStat ? 378 : 402,
        zIndex: BRETTON_Z_LAYERS.heroKineticText,
        opacity: combinedOpacity,
        transform: `translate3d(${(motion.translateX + spatialEnvelope.translateX * 1.15 + parallaxX).toFixed(2)}px, ${(motion.translateY + spatialEnvelope.translateY * 1.1).toFixed(2)}px, 0) scale(${(motion.scale * spatialEnvelope.scale).toFixed(4)})`,
        transformOrigin: '50% 50%',
        textAlign: 'center',
        pointerEvents: 'none',
      }}
    >
      {/* Radial Z-separation halo behind foreground hero text */}
      <div
        style={{
          position: 'absolute',
          left: '14%',
          right: '14%',
          top: -28,
          bottom: -28,
          borderRadius: 32,
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(11, 18, 34, 0.84) 0%, rgba(11, 18, 34, 0.46) 56%, transparent 82%)',
          zIndex: -1,
        }}
      />

      {/* Eyebrow Telemetry Pill */}
      <div
        style={{
          display: 'inline-block',
          padding: '5px 16px',
          borderRadius: 999,
          background: 'rgba(13, 22, 40, 0.86)',
          border: `1px solid ${activeWin.accentColor}66`,
          boxShadow: `0 0 24px ${activeWin.accentColor}28`,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.16em',
          color: activeWin.accentColor,
          marginBottom: 12,
        }}
      >
        {activeWin.eyebrow}
      </div>

      {/* Main Polymorphic Kinetic Headline with Word-Level StaggeredTextItem */}
      <div
        style={{
          fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif',
          fontSize,
          fontWeight: 900,
          lineHeight: 1.04,
          letterSpacing: activeWin.isGiantStat ? '-0.04em' : '-0.025em',
          color: BW_WHITE,
          textShadow: `0 12px 38px rgba(6, 10, 22, 0.92), 0 0 36px ${activeWin.accentColor}40`,
        }}
      >
        {words.map((word, wIdx) => {
          const wordProfile =
            WORD_PROFILES[(WORD_PROFILES.indexOf(activeWin.profile) + wIdx) % WORD_PROFILES.length];
          const isHighlight =
            activeWin.isGiantStat ||
            word === '88%' ||
            word === 'TRADE' ||
            word === '1944' ||
            word === 'PIVOT' ||
            word === 'GOLD' ||
            word === 'TRUST' ||
            word === 'LIQUIDITY' ||
            word === 'STABILITY' ||
            word === 'KING' ||
            word === 'NOW...' ||
            word === '$27T+' ||
            word === 'POWER';

          return (
            <StaggeredTextItem
              key={`${activeWin.id}-w-${wIdx}`}
              text={word}
              delay={wIdx * 3}
              frameOverride={localFrame}
              profile={wordProfile}
              variantSeed={(activeWin.physicsVariant + wIdx) % 4}
              style={{
                marginRight: wIdx < words.length - 1 ? '0.26em' : 0,
                color: isHighlight ? activeWin.accentColor : BW_WHITE,
              }}
            />
          );
        })}
      </div>

      {/* Contextual Subtag Line */}
      <div
        style={{
          marginTop: 12,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '0.11em',
          color: subtagState.color,
          textShadow: '0 4px 18px rgba(6, 10, 22, 0.95)',
        }}
      >
        {subtagState.text}
      </div>
    </div>
  );
};
