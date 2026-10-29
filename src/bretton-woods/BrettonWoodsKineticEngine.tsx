import React from 'react';
import {Easing, interpolate, spring, useVideoConfig} from 'remotion';
import {StaggeredTextItem, type TextMotionProfile} from '../StaggeredTextItem';
import {
  BRETTON_Z_LAYERS,
  BW_EMERALD_SOFT,
  BW_FPS,
  BW_GOLD,
  BW_GOLD_BRIGHT,
  BW_SILVER,
  BW_WHITE,
  getBrettonLayout,
  type BrettonSceneId,
  type SpatialSceneEnvelope,
} from './brettonWoodsModel';

export type BrettonHeroWindow = {
  id: string;
  sceneId: BrettonSceneId;
  startFrame: number;
  endFrame: number;
  headline: string;
  kicker: string;
  subline: string;
  dynamicSublineAfterFrame?: {frame: number; text: string; color: string};
  profile: TextMotionProfile;
  physicsVariant: number;
  accentColor: string;
  isGiantStat?: boolean;
};

/**
 * Clean Editorial Kinetic Title Windows across 0..1800 frames.
 * Zero debug banners, zero coordinate readouts, zero hacker slashes.
 * Strictly alternates polymorphic motion profiles across every window.
 */
export const BW_HERO_WINDOWS: readonly BrettonHeroWindow[] = [
  // === SCENE 1 [0:00 - 0:10] ===
  {
    id: 's1-world-commerce',
    sceneId: 'global-standard',
    startFrame: 10,
    endFrame: 188,
    headline: 'ONE CURRENCY',
    kicker: 'OIL · COFFEE · TRADE',
    subline: 'From Riyadh to Tokyo to Milan, everyday global commerce clears in dollars.',
    profile: 'terminal-slide',
    physicsVariant: 0,
    accentColor: BW_EMERALD_SOFT,
  },
  {
    id: 's1-88-percent',
    sceneId: 'global-standard',
    startFrame: 189,
    endFrame: 245,
    headline: '88%',
    kicker: 'INTERNATIONAL EXCHANGE SHARE',
    subline: 'Share of all global foreign-exchange transactions involving the US dollar.',
    profile: 'hook-pop',
    physicsVariant: 1,
    accentColor: BW_GOLD_BRIGHT,
    isGiantStat: true,
  },
  {
    id: 's1-global-trade',
    sceneId: 'global-standard',
    startFrame: 246,
    endFrame: 306,
    headline: 'GLOBAL TRADE',
    kicker: 'THE UNIVERSAL DENOMINATION',
    subline: 'One standard pricing energy, commodities, and cross-border finance.',
    profile: 'telemetry-flicker',
    physicsVariant: 1,
    accentColor: BW_EMERALD_SOFT,
  },

  // === SCENE 2 [0:10 - 0:25] ===
  {
    id: 's2-1944',
    sceneId: 'bretton-woods-origin',
    startFrame: 302,
    endFrame: 414,
    headline: '1944',
    kicker: 'BRETTON WOODS, NEW HAMPSHIRE',
    subline: 'Forty-four nations gather to rebuild the post-war monetary order.',
    profile: 'hook-pop',
    physicsVariant: 2,
    accentColor: BW_GOLD_BRIGHT,
    isGiantStat: true,
  },
  {
    id: 's2-the-pivot',
    sceneId: 'bretton-woods-origin',
    startFrame: 415,
    endFrame: 522,
    headline: 'THE PIVOT',
    kicker: 'CURRENCIES TIED TO THE DOLLAR',
    subline: 'Nations peg their exchange rates directly to the American greenback.',
    profile: 'terminal-slide',
    physicsVariant: 2,
    accentColor: BW_GOLD,
  },
  {
    id: 's2-backed-by-gold',
    sceneId: 'bretton-woods-origin',
    startFrame: 523,
    endFrame: 754,
    headline: 'BACKED BY GOLD',
    kicker: 'AMERICA’S SOVEREIGN BULLION VAULT',
    subline: 'Anchored by the largest national gold reserve in modern history.',
    dynamicSublineAfterFrame: {
      frame: 646,
      text: 'Even after leaving the gold standard, the entire world stayed.',
      color: BW_EMERALD_SOFT,
    },
    profile: 'telemetry-flicker',
    physicsVariant: 2,
    accentColor: BW_GOLD_BRIGHT,
  },

  // === SCENE 3 [0:25 - 0:45] ===
  {
    id: 's3-trust',
    sceneId: 'liquidity-power-engine',
    startFrame: 750,
    endFrame: 850,
    headline: 'TRUST',
    kicker: 'THE POWER ENGINE',
    subline: 'Deep institutional credibility backed by open capital markets.',
    profile: 'hook-pop',
    physicsVariant: 0,
    accentColor: BW_EMERALD_SOFT,
  },
  {
    id: 's3-liquidity',
    sceneId: 'liquidity-power-engine',
    startFrame: 851,
    endFrame: 982,
    headline: 'LIQUIDITY',
    kicker: 'MARKET DEPTH AT GLOBAL SCALE',
    subline: 'Trillions move seamlessly across borders at any hour.',
    profile: 'terminal-slide',
    physicsVariant: 1,
    accentColor: BW_EMERALD_SOFT,
  },
  {
    id: 's3-treasury-depth',
    sceneId: 'liquidity-power-engine',
    startFrame: 983,
    endFrame: 1162,
    headline: 'US TREASURY BONDS',
    kicker: 'SOVEREIGN RESERVES IN TRILLIONS',
    subline: 'Central banks and governments hold US debt as foundational reserves.',
    profile: 'telemetry-flicker',
    physicsVariant: 0,
    accentColor: BW_GOLD_BRIGHT,
  },
  {
    id: 's3-unrivaled-stability',
    sceneId: 'liquidity-power-engine',
    startFrame: 1163,
    endFrame: 1354,
    headline: 'UNRIVALED STABILITY',
    kicker: 'THE ULTIMATE GLOBAL SAFETY NET',
    subline: 'Deep, resilient financial markets anchoring world banking.',
    profile: 'hook-pop',
    physicsVariant: 3,
    accentColor: BW_EMERALD_SOFT,
  },

  // === SCENE 4 [0:45 - 1:00] ===
  {
    id: 's4-power-responsibility',
    sceneId: 'heavy-crown-conclusion',
    startFrame: 1350,
    endFrame: 1528,
    headline: 'POWER & DUTY',
    kicker: 'THE WEIGHT OF RESERVE LEADERSHIP',
    subline: 'Immense economic leverage paired with global responsibility.',
    profile: 'terminal-slide',
    physicsVariant: 3,
    accentColor: BW_GOLD_BRIGHT,
  },
  {
    id: 's4-king-of-currencies',
    sceneId: 'heavy-crown-conclusion',
    startFrame: 1529,
    endFrame: 1662,
    headline: 'THE KING OF CURRENCIES',
    kicker: 'THE GLOBAL MONETARY STANDARD',
    subline: 'No rival matches the reach and depth of the dollar network.',
    profile: 'hook-pop',
    physicsVariant: 1,
    accentColor: BW_GOLD_BRIGHT,
  },
  {
    id: 's4-for-now',
    sceneId: 'heavy-crown-conclusion',
    startFrame: 1663,
    endFrame: 1799,
    headline: 'FOR NOW...',
    kicker: 'THE GREENBACK HOLDS THE CROWN',
    subline: 'Love it or hate it, the dollar remains the world’s reserve anchor.',
    profile: 'telemetry-flicker',
    physicsVariant: 3,
    accentColor: BW_EMERALD_SOFT,
  },
];

const GENTLE_FLICKER_CURVE = [0.24, 0.48, 0.68, 0.84, 0.94, 1.0];

export const computeHeroContainerMotion = (
  win: BrettonHeroWindow,
  globalFrame: number,
): {opacity: number; translateX: number; translateY: number; scale: number} => {
  const local = Math.max(0, globalFrame - win.startFrame);
  const remaining = Math.max(0, win.endFrame - globalFrame);
  const exitFrames = win.id === 's4-for-now' ? 0 : 16;

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
        damping: 16 + (win.physicsVariant % 3) * 2,
        stiffness: 175 + win.physicsVariant * 12,
        mass: 0.92,
      },
    });
    const enterOpacity = interpolate(local, [0, 12], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
    return {
      opacity: Number((enterOpacity * exitEnvelope).toFixed(4)),
      translateX: 0,
      translateY: (1 - sp) * 22 - (1 - exitEnvelope) * 12,
      scale: 0.94 + 0.06 * sp - (1 - exitEnvelope) * 0.02,
    };
  }

  if (win.profile === 'terminal-slide') {
    const sp = spring({
      frame: local,
      fps: BW_FPS,
      config: {
        damping: 18 + (win.physicsVariant % 3) * 2,
        stiffness: 150 + win.physicsVariant * 10,
        mass: 0.96,
      },
    });
    const dir = win.physicsVariant % 2 === 0 ? -36 : 36;
    const enterOpacity = interpolate(local, [0, 14], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
    return {
      opacity: Number((enterOpacity * exitEnvelope).toFixed(4)),
      translateX: (1 - sp) * dir - (1 - exitEnvelope) * dir * 0.35,
      translateY: 0,
      scale: 0.985 + 0.015 * sp,
    };
  }

  const stepIdx = Math.min(GENTLE_FLICKER_CURVE.length - 1, Math.floor(local / 2));
  const enterOpacity = GENTLE_FLICKER_CURVE[stepIdx];
  const settle = interpolate(local, [0, 12], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return {
    opacity: Number((enterOpacity * exitEnvelope).toFixed(4)),
    translateX: 0,
    translateY: settle * 10 - (1 - exitEnvelope) * 10,
    scale: 1.015 - settle * 0.015,
  };
};

const WORD_PROFILES: readonly TextMotionProfile[] = [
  'hook-pop',
  'terminal-slide',
  'telemetry-flicker',
];

/**
 * Layer z=55: Centered Editorial Hero Kinetic Typography Layer.
 * Positioned in the dedicated upper-center safe corridor with generous breathing room
 * so text never collides with background or purposeful vector graphics in 16:9 or 9:16.
 */
const BrettonWoodsHeroKineticView: React.FC<{
  sceneId: BrettonSceneId;
  globalFrame: number;
  spatialEnvelope: SpatialSceneEnvelope;
  width: number;
  height: number;
}> = ({sceneId, globalFrame, spatialEnvelope, width, height}) => {
  const layout = getBrettonLayout(width, height);

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

  const sublineState =
    activeWin.dynamicSublineAfterFrame &&
    globalFrame >= activeWin.dynamicSublineAfterFrame.frame
      ? {
          text: activeWin.dynamicSublineAfterFrame.text,
          color: activeWin.dynamicSublineAfterFrame.color,
        }
      : {text: activeWin.subline, color: BW_SILVER};

  const fontSize = activeWin.isGiantStat
    ? layout.statFontSize
    : activeWin.headline.length >= 18
      ? layout.longTitleFontSize
      : layout.titleFontSize;

  const combinedOpacity = Number((motion.opacity * spatialEnvelope.opacity).toFixed(4));

  return (
    <div
      data-canvas-layer="hero-kinetic-text"
      data-layer-z={BRETTON_Z_LAYERS.heroKineticText}
      data-bw-hero-id={activeWin.id}
      data-bw-hero-profile={activeWin.profile}
      style={{
        position: 'absolute',
        left: layout.heroLeft,
        width: layout.heroWidth,
        top: layout.heroTop,
        zIndex: BRETTON_Z_LAYERS.heroKineticText,
        opacity: combinedOpacity,
        transform: `translate3d(${(motion.translateX + spatialEnvelope.translateX * 0.65).toFixed(2)}px, ${(motion.translateY + spatialEnvelope.translateY * 0.65).toFixed(2)}px, 0) scale(${(motion.scale * spatialEnvelope.scale).toFixed(4)})`,
        transformOrigin: '50% 50%',
        textAlign: 'center',
        pointerEvents: 'none',
      }}
    >
      {/* Clean Editorial Kicker */}
      <div
        style={{
          fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif',
          fontSize: layout.kickerFontSize,
          fontWeight: 600,
          letterSpacing: '0.26em',
          textTransform: 'uppercase',
          color: activeWin.accentColor,
          marginBottom: Math.round(14 * layout.scale),
        }}
      >
        {activeWin.kicker}
      </div>

      {/* Perfectly Kerned High-Contrast Hero Title with Clean Staggered Word Entrances */}
      <div
        style={{
          fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif',
          fontSize,
          fontWeight: 800,
          lineHeight: 1.06,
          letterSpacing: activeWin.isGiantStat ? '-0.045em' : '-0.03em',
          color: BW_WHITE,
          textShadow: '0 14px 40px rgba(7, 10, 18, 0.90)',
        }}
      >
        {words.map((word, wIdx) => {
          const wordProfile =
            WORD_PROFILES[(WORD_PROFILES.indexOf(activeWin.profile) + wIdx) % WORD_PROFILES.length];
          const isAccentWord =
            activeWin.isGiantStat ||
            word === 'TRADE' ||
            word === 'PIVOT' ||
            word === 'GOLD' ||
            word === 'TRUST' ||
            word === 'LIQUIDITY' ||
            word === 'TREASURY' ||
            word === 'STABILITY' ||
            word === 'KING' ||
            word === 'NOW...' ||
            word === 'CURRENCY';

          return (
            <StaggeredTextItem
              key={`${activeWin.id}-w-${wIdx}`}
              text={word}
              delay={wIdx * 4}
              frameOverride={localFrame}
              profile={wordProfile}
              variantSeed={(activeWin.physicsVariant + wIdx) % 4}
              style={{
                marginRight: wIdx < words.length - 1 ? '0.26em' : 0,
                color: isAccentWord ? activeWin.accentColor : BW_WHITE,
              }}
            />
          );
        })}
      </div>

      {/* Editorial Subline */}
      <div
        style={{
          marginTop: Math.round(16 * layout.scale),
          maxWidth: layout.isVertical ? '92%' : 760,
          marginLeft: 'auto',
          marginRight: 'auto',
          fontFamily: '"Inter", system-ui, sans-serif',
          fontSize: layout.sublineFontSize,
          fontWeight: 400,
          lineHeight: 1.45,
          letterSpacing: '0.01em',
          color: sublineState.color,
        }}
      >
        {sublineState.text}
      </div>
    </div>
  );
};

const ConnectedHeroKineticLayer: React.FC<{
  sceneId: BrettonSceneId;
  globalFrame: number;
  spatialEnvelope: SpatialSceneEnvelope;
}> = (props) => {
  const {width, height} = useVideoConfig();
  return <BrettonWoodsHeroKineticView {...props} width={width} height={height} />;
};

export const BrettonWoodsHeroKineticLayer: React.FC<{
  sceneId: BrettonSceneId;
  globalFrame: number;
  spatialEnvelope: SpatialSceneEnvelope;
  cameraPanX?: number;
  widthOverride?: number;
  heightOverride?: number;
}> = ({widthOverride, heightOverride, ...rest}) => {
  if (widthOverride !== undefined && heightOverride !== undefined) {
    return (
      <BrettonWoodsHeroKineticView
        {...rest}
        width={widthOverride}
        height={heightOverride}
      />
    );
  }
  return <ConnectedHeroKineticLayer {...rest} />;
};
