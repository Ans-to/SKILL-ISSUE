import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type TextMotionProfile = 'hook-pop' | 'terminal-slide' | 'telemetry-flicker';

export const STAGGERED_SPRING_CONFIG = {
  damping: 8,
  stiffness: 340,
} as const;

export const HOOK_POP_SPRINGS = [
  {damping: 8.0, stiffness: 320, mass: 0.86},
  {damping: 9.2, stiffness: 365, mass: 0.78},
  {damping: 7.6, stiffness: 395, mass: 0.94},
  {damping: 8.6, stiffness: 340, mass: 1.04},
] as const;

export const TERMINAL_SLIDE_CONFIGS = [
  {frames: 9, distancePx: -72, damping: 18, stiffness: 210},
  {frames: 11, distancePx: -92, damping: 21, stiffness: 185},
  {frames: 8, distancePx: -60, damping: 16, stiffness: 240},
  {frames: 12, distancePx: -84, damping: 23, stiffness: 195},
] as const;

export const TELEMETRY_FLICKER_TABLES: ReadonlyArray<readonly number[]> = [
  [0, 0.86, 0.14, 0.96, 0.38, 1.0, 0.88, 1.0],
  [0, 0.68, 0.94, 0.20, 0.84, 0.46, 1.0],
  [0, 0.92, 0.24, 0.78, 0.30, 0.98, 1.0],
  [0, 0.76, 0.12, 0.90, 0.52, 0.96, 1.0],
];

export type StaggeredTextMotion = {
  profile: TextMotionProfile;
  signature: string;
  entrance: number;
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
};

export const computeStaggeredTextMotion = (
  frame: number,
  delay: number,
  fps: number,
  profile: TextMotionProfile = 'hook-pop',
  variantSeed = 0,
): StaggeredTextMotion => {
  const local = frame - delay;
  const seed = Math.abs(Math.trunc(variantSeed));
  const variantCount =
    profile === 'hook-pop'
      ? HOOK_POP_SPRINGS.length
      : profile === 'terminal-slide'
        ? TERMINAL_SLIDE_CONFIGS.length
        : TELEMETRY_FLICKER_TABLES.length;
  const signature = `${profile}:v${seed % variantCount}`;

  if (local < 0) {
    if (profile === 'terminal-slide') {
      const cfg = TERMINAL_SLIDE_CONFIGS[seed % TERMINAL_SLIDE_CONFIGS.length];
      return {
        profile,
        signature,
        entrance: 0,
        opacity: 0,
        translateX: cfg.distancePx,
        translateY: 0,
        scale: 1,
      };
    }
    if (profile === 'telemetry-flicker') {
      return {
        profile,
        signature,
        entrance: 0,
        opacity: 0,
        translateX: 0,
        translateY: 0,
        scale: 0.98,
      };
    }
    return {
      profile,
      signature,
      entrance: 0,
      opacity: 0,
      translateX: 0,
      translateY: 20,
      scale: 0.76,
    };
  }

  // 1. HOOKS / ERRORS: Heavy, high-velocity spring pop
  if (profile === 'hook-pop') {
    const springCfg = HOOK_POP_SPRINGS[seed % HOOK_POP_SPRINGS.length];
    const entrance = spring({
      frame: local,
      fps,
      config: springCfg,
    });
    const opacity = interpolate(entrance, [0, 0.65], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const translateY = interpolate(entrance, [0, 1], [20, 0]);
    const scale = interpolate(entrance, [0, 1], [0.76, 1]);

    return {
      profile,
      signature,
      entrance: Number(entrance.toFixed(4)),
      opacity: Number(opacity.toFixed(4)),
      translateX: 0,
      translateY: Number(translateY.toFixed(2)),
      scale: Number(scale.toFixed(4)),
    };
  }

  // 2. CODE / PROMPTS: Smooth horizontal terminal slide
  if (profile === 'terminal-slide') {
    const cfg = TERMINAL_SLIDE_CONFIGS[seed % TERMINAL_SLIDE_CONFIGS.length];
    const bezierGlide = interpolate(local, [0, cfg.frames], [0, 1], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const springGlide = spring({
      frame: local,
      fps,
      config: {damping: cfg.damping, stiffness: cfg.stiffness, overshootClamping: true},
    });
    const entrance = bezierGlide * 0.6 + springGlide * 0.4;
    const opacity = interpolate(local, [0, Math.max(4, Math.floor(cfg.frames * 0.7))], [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const translateX = (1 - entrance) * cfg.distancePx;

    return {
      profile,
      signature,
      entrance: Number(entrance.toFixed(4)),
      opacity: Number(opacity.toFixed(4)),
      translateX: Number(translateX.toFixed(2)),
      translateY: 0,
      scale: 1,
    };
  }

  // 3. TELEMETRY / DATA: Sharp digital flicker-fade
  const table = TELEMETRY_FLICKER_TABLES[seed % TELEMETRY_FLICKER_TABLES.length];
  const stepIdx = Math.min(table.length - 1, Math.floor(local));
  const opacity = local >= table.length ? 1 : table[stepIdx];
  const entrance = local >= table.length ? 1 : stepIdx / (table.length - 1);
  const scale = local >= 4 ? 1 : 0.98 + 0.02 * (local / 4);

  return {
    profile,
    signature,
    entrance: Number(entrance.toFixed(4)),
    opacity: Number(opacity.toFixed(4)),
    translateX: 0,
    translateY: 0,
    scale: Number(scale.toFixed(4)),
  };
};

export type StaggeredTextItemProps = {
  text: string;
  delay: number;
  profile?: TextMotionProfile;
  variantSeed?: number;
  style?: React.CSSProperties;
  dataAttrs?: Record<string, string | number | boolean>;
  frameOverride?: number;
  fpsOverride?: number;
};

const formatStaggerTransform = (m: StaggeredTextMotion): string => {
  if (m.profile === 'terminal-slide') {
    return `translateX(${m.translateX}px)`;
  }
  if (m.profile === 'telemetry-flicker') {
    return `scale(${m.scale})`;
  }
  return `translateY(${m.translateY}px) scale(${m.scale})`;
};

const StaggeredTextItemView: React.FC<{
  text: string;
  delay: number;
  frame: number;
  fps: number;
  profile: TextMotionProfile;
  variantSeed: number;
  style?: React.CSSProperties;
  dataAttrs?: Record<string, string | number | boolean>;
}> = ({text, delay, frame, fps, profile, variantSeed, style, dataAttrs}) => {
  const m = computeStaggeredTextMotion(frame, delay, fps, profile, variantSeed);

  return (
    <div
      data-staggered-item="true"
      data-staggered-profile={profile}
      data-staggered-sig={m.signature}
      data-motion-profile={profile}
      data-stagger-delay={delay}
      {...dataAttrs}
      style={{
        opacity: m.opacity,
        transform: formatStaggerTransform(m),
        display: 'inline-block',
        ...style,
      }}
    >
      {text}
    </div>
  );
};

const ConnectedStaggeredTextItem: React.FC<{
  text: string;
  delay: number;
  profile: TextMotionProfile;
  variantSeed: number;
  style?: React.CSSProperties;
  dataAttrs?: Record<string, string | number | boolean>;
}> = ({text, delay, profile, variantSeed, style, dataAttrs}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <StaggeredTextItemView
      text={text}
      delay={delay}
      frame={frame}
      fps={fps}
      profile={profile}
      variantSeed={variantSeed}
      style={style}
      dataAttrs={dataAttrs}
    />
  );
};

export const StaggeredTextItem: React.FC<StaggeredTextItemProps> = ({
  text,
  delay,
  profile = 'hook-pop',
  variantSeed = 0,
  style,
  dataAttrs,
  frameOverride,
  fpsOverride,
}) => {
  if (frameOverride !== undefined) {
    return (
      <StaggeredTextItemView
        text={text}
        delay={delay}
        frame={frameOverride}
        fps={fpsOverride ?? 30}
        profile={profile}
        variantSeed={variantSeed}
        style={style}
        dataAttrs={dataAttrs}
      />
    );
  }
  return (
    <ConnectedStaggeredTextItem
      text={text}
      delay={delay}
      profile={profile}
      variantSeed={variantSeed}
      style={style}
      dataAttrs={dataAttrs}
    />
  );
};
