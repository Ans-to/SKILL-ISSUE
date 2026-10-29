import React from 'react';
import {useVideoConfig} from 'remotion';
import {type TextMotionProfile} from '../StaggeredTextItem';
import {
  BW_EMERALD_SOFT,
  BW_GOLD,
  BW_GOLD_BRIGHT,
  type BrettonSceneId,
  type SpatialSceneEnvelope,
} from './brettonWoodsModel';
import {CinematicSceneMasterView} from './CinematicSceneMaster';

export type BrettonHeroWindow = {
  id: string;
  sceneId: BrettonSceneId;
  startFrame: number;
  endFrame: number;
  headline: string;
  kicker: string;
  subline: string;
  metric: string;
  metricLabel: string;
  dynamicAfterFrame?: {
    frame: number;
    kicker: string;
    metric: string;
    metricLabel: string;
    accentColor: string;
  };
  profile: TextMotionProfile;
  physicsVariant: number;
  accentColor: string;
  isGiantStat?: boolean;
};

/**
 * 13 Editorial Beats driving CinematicSceneMaster across 0..1800 frames.
 * Strictly alternates polymorphic motion profiles across every window.
 */
export const BW_HERO_WINDOWS: readonly BrettonHeroWindow[] = [
  // === SCENE 1 [0:00 - 0:10] ===
  {
    id: 's1-world-commerce',
    sceneId: 'global-standard',
    startFrame: 0,
    endFrame: 188,
    headline: 'ONE CURRENCY',
    kicker: 'OIL · COFFEE · TRADE',
    subline: 'From Riyadh to Tokyo to Milan, everyday global commerce clears in dollars.',
    metric: 'RIYADH · TOKYO · MILAN',
    metricLabel: 'COMMODITIES & GOODS SETTLED IN USD',
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
    metric: '$7.5 TRILLION / DAY',
    metricLabel: 'GLOBAL FX VOLUME INVOLVING THE US DOLLAR',
    profile: 'hook-pop',
    physicsVariant: 1,
    accentColor: '#f59e0b',
    isGiantStat: true,
  },
  {
    id: 's1-global-trade',
    sceneId: 'global-standard',
    startFrame: 246,
    endFrame: 312,
    headline: 'GLOBAL TRADE',
    kicker: 'THE UNIVERSAL DENOMINATION',
    subline: 'One standard pricing energy, commodities, and cross-border finance.',
    metric: '88% FX SHARE',
    metricLabel: 'WORLD SETTLEMENT BENCHMARK',
    profile: 'telemetry-flicker',
    physicsVariant: 1,
    accentColor: BW_EMERALD_SOFT,
  },

  // === SCENE 2 [0:10 - 0:25] ===
  {
    id: 's2-1944',
    sceneId: 'bretton-woods-origin',
    startFrame: 288,
    endFrame: 414,
    headline: '1944',
    kicker: 'BRETTON WOODS · NEW HAMPSHIRE',
    subline: 'Forty-four nations gather to rebuild the post-war monetary order.',
    metric: '44 NATIONS',
    metricLabel: 'ALLIED MONETARY ACCORD DELEGATES',
    profile: 'hook-pop',
    physicsVariant: 2,
    accentColor: '#f59e0b',
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
    metric: '$35 / TROY OZ',
    metricLabel: 'WORLD CURRENCIES PEGGED TO USD',
    profile: 'terminal-slide',
    physicsVariant: 2,
    accentColor: BW_GOLD_BRIGHT,
  },
  {
    id: 's2-backed-by-gold',
    sceneId: 'bretton-woods-origin',
    startFrame: 523,
    endFrame: 762,
    headline: 'BACKED BY GOLD',
    kicker: 'SOVEREIGN BULLION RESERVE',
    subline: 'Anchored by the largest national gold reserve in modern history.',
    metric: '20,000+ TONS',
    metricLabel: 'U.S. TREASURY SOVEREIGN GOLD VAULT',
    dynamicAfterFrame: {
      frame: 648,
      kicker: '1971 · POST-GOLD CONTINUITY',
      metric: 'WORLD STAYED',
      metricLabel: 'LEFT THE GOLD STANDARD — GLOBAL PEG ENDURED',
      accentColor: BW_EMERALD_SOFT,
    },
    profile: 'telemetry-flicker',
    physicsVariant: 2,
    accentColor: '#f59e0b',
  },

  // === SCENE 3 [0:25 - 0:45] ===
  {
    id: 's3-trust',
    sceneId: 'liquidity-power-engine',
    startFrame: 738,
    endFrame: 850,
    headline: 'TRUST',
    kicker: 'INSTITUTIONAL FOUNDATION',
    subline: 'Deep institutional credibility backed by open capital markets.',
    metric: 'FULL FAITH & CREDIT',
    metricLabel: 'OPEN CAPITAL MARKETS & RULE OF LAW',
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
    subline: 'Trillions move seamlessly across borders at a moment’s notice.',
    metric: 'INSTANT SCALE',
    metricLabel: 'TRILLIONS MOVED EFFORTLESSLY 24/7',
    profile: 'terminal-slide',
    physicsVariant: 1,
    accentColor: BW_EMERALD_SOFT,
  },
  {
    id: 's3-treasury-depth',
    sceneId: 'liquidity-power-engine',
    startFrame: 983,
    endFrame: 1162,
    headline: 'TREASURY DEPTH',
    kicker: 'SOVEREIGN BOND BENCHMARK',
    subline: 'The deepest, most liquid sovereign asset pool in financial history.',
    metric: '$28+ TRILLION',
    metricLabel: 'U.S. TREASURY MARKET DEPTH',
    profile: 'telemetry-flicker',
    physicsVariant: 2,
    accentColor: '#f59e0b',
  },
  {
    id: 's3-unrivaled-stability',
    sceneId: 'liquidity-power-engine',
    startFrame: 1163,
    endFrame: 1362,
    headline: 'UNRIVALED STABILITY',
    kicker: 'THE ULTIMATE GLOBAL SAFETY NET',
    subline: 'Central banks hold trillions in US Treasury bonds as their reserve anchor.',
    metric: '~58% RESERVES',
    metricLabel: 'CENTRAL BANK U.S. TREASURY SAFETY NET',
    profile: 'hook-pop',
    physicsVariant: 1,
    accentColor: BW_EMERALD_SOFT,
  },

  // === SCENE 4 [0:45 - 1:00] ===
  {
    id: 's4-power-responsibility',
    sceneId: 'heavy-crown-conclusion',
    startFrame: 1338,
    endFrame: 1528,
    headline: 'POWER & DUTY',
    kicker: 'IMMENSE ECONOMIC LEVERAGE',
    subline: 'Sovereign reserve status confers both global power and global responsibility.',
    metric: 'DUAL BALANCE',
    metricLabel: 'ECONOMIC POWER · GLOBAL RESPONSIBILITY',
    profile: 'terminal-slide',
    physicsVariant: 2,
    accentColor: BW_GOLD,
  },
  {
    id: 's4-king-of-currencies',
    sceneId: 'heavy-crown-conclusion',
    startFrame: 1529,
    endFrame: 1662,
    headline: 'THE KING OF CURRENCIES',
    kicker: 'THE GLOBAL MONETARY STANDARD',
    subline: 'No rival matches the network reach and liquidity of the greenback.',
    metric: '#1 WORLDWIDE',
    metricLabel: 'DOMINANT TRADE & RESERVE CURRENCY',
    profile: 'hook-pop',
    physicsVariant: 0,
    accentColor: '#f59e0b',
  },
  {
    id: 's4-for-now',
    sceneId: 'heavy-crown-conclusion',
    startFrame: 1663,
    endFrame: 1800,
    headline: 'FOR NOW...',
    kicker: 'THE GREENBACK HOLDS THE CROWN',
    subline: 'Love it or hate it, the dollar remains the world’s reserve anchor.',
    metric: 'THE CROWN',
    metricLabel: 'SOVEREIGN MONETARY ANCHOR',
    profile: 'telemetry-flicker',
    physicsVariant: 1,
    accentColor: BW_EMERALD_SOFT,
  },
];

export const resolveBrettonBeat = (
  sceneId: BrettonSceneId,
  globalFrame: number,
): {
  window: BrettonHeroWindow;
  title: string;
  subtitle: string;
  metric: string;
  metricLabel: string;
  accentColor: string;
} => {
  const sceneWindows = BW_HERO_WINDOWS.filter((w) => w.sceneId === sceneId);
  const active =
    sceneWindows.find(
      (w) => globalFrame >= w.startFrame && globalFrame <= w.endFrame,
    ) ??
    (globalFrame < sceneWindows[0].startFrame
      ? sceneWindows[0]
      : sceneWindows[sceneWindows.length - 1]);

  if (active.dynamicAfterFrame && globalFrame >= active.dynamicAfterFrame.frame) {
    return {
      window: active,
      title: active.headline,
      subtitle: active.dynamicAfterFrame.kicker,
      metric: active.dynamicAfterFrame.metric,
      metricLabel: active.dynamicAfterFrame.metricLabel,
      accentColor: active.dynamicAfterFrame.accentColor,
    };
  }

  return {
    window: active,
    title: active.headline,
    subtitle: active.kicker,
    metric: active.metric,
    metricLabel: active.metricLabel,
    accentColor: active.accentColor,
  };
};

const ConnectedHeroKineticLayer: React.FC<{
  sceneId: BrettonSceneId;
  globalFrame: number;
  spatialEnvelope: SpatialSceneEnvelope;
}> = ({sceneId, globalFrame, spatialEnvelope}) => {
  const {width, height, fps} = useVideoConfig();
  const resolved = resolveBrettonBeat(sceneId, globalFrame);
  return (
    <CinematicSceneMasterView
      title={resolved.title}
      subtitle={resolved.subtitle}
      accentColor={resolved.accentColor}
      motionProfile={resolved.window.profile}
      variantSeed={resolved.window.physicsVariant}
      beatStartFrame={resolved.window.startFrame}
      globalFrame={globalFrame}
      fps={fps}
      width={width}
      height={height}
      spatialEnvelope={spatialEnvelope}
      renderBackground={false}
    />
  );
};

export const BrettonWoodsHeroKineticLayer: React.FC<{
  sceneId: BrettonSceneId;
  globalFrame: number;
  spatialEnvelope: SpatialSceneEnvelope;
  cameraPanX?: number;
  widthOverride?: number;
  heightOverride?: number;
}> = ({sceneId, globalFrame, spatialEnvelope, widthOverride, heightOverride}) => {
  if (widthOverride !== undefined && heightOverride !== undefined) {
    const resolved = resolveBrettonBeat(sceneId, globalFrame);
    return (
      <CinematicSceneMasterView
        title={resolved.title}
        subtitle={resolved.subtitle}
        accentColor={resolved.accentColor}
        motionProfile={resolved.window.profile}
        variantSeed={resolved.window.physicsVariant}
        beatStartFrame={resolved.window.startFrame}
        globalFrame={globalFrame}
        fps={30}
        width={widthOverride}
        height={heightOverride}
        spatialEnvelope={spatialEnvelope}
        renderBackground={false}
      />
    );
  }
  return (
    <ConnectedHeroKineticLayer
      sceneId={sceneId}
      globalFrame={globalFrame}
      spatialEnvelope={spatialEnvelope}
    />
  );
};
