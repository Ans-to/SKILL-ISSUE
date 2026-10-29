import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const STAGGERED_SPRING_CONFIG = {
  damping: 12,
  stiffness: 200,
} as const;

export type StaggeredTextMotion = {
  entrance: number;
  opacity: number;
  translateY: number;
};

export const computeStaggeredTextMotion = (
  frame: number,
  delay: number,
  fps: number,
): StaggeredTextMotion => {
  const entrance = spring({
    frame: frame - delay,
    fps,
    config: STAGGERED_SPRING_CONFIG,
  });

  const opacity = interpolate(entrance, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(entrance, [0, 1], [20, 0]);

  return {
    entrance: Number(entrance.toFixed(4)),
    opacity: Number(opacity.toFixed(4)),
    translateY: Number(translateY.toFixed(2)),
  };
};

export type StaggeredTextItemProps = {
  text: string;
  delay: number;
  style?: React.CSSProperties;
  dataAttrs?: Record<string, string | number | boolean>;
  frameOverride?: number;
  fpsOverride?: number;
};

const StaggeredTextItemView: React.FC<{
  text: string;
  delay: number;
  frame: number;
  fps: number;
  style?: React.CSSProperties;
  dataAttrs?: Record<string, string | number | boolean>;
}> = ({text, delay, frame, fps, style, dataAttrs}) => {
  const {opacity, translateY} = computeStaggeredTextMotion(frame, delay, fps);

  return (
    <div
      data-staggered-item="true"
      data-stagger-delay={delay}
      {...dataAttrs}
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
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
  style?: React.CSSProperties;
  dataAttrs?: Record<string, string | number | boolean>;
}> = ({text, delay, style, dataAttrs}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Smooth spring entrance tied to individual delay offset
  const entrance = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 12,
      stiffness: 200,
    },
  });

  const opacity = interpolate(entrance, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(entrance, [0, 1], [20, 0]);

  return (
    <div
      data-staggered-item="true"
      data-stagger-delay={delay}
      {...dataAttrs}
      style={{
        opacity,
        transform: `translateY(${Number(translateY.toFixed(2))}px)`,
        display: 'inline-block',
        ...style,
      }}
    >
      {text}
    </div>
  );
};

export const StaggeredTextItem: React.FC<StaggeredTextItemProps> = ({
  text,
  delay,
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
        style={style}
        dataAttrs={dataAttrs}
      />
    );
  }
  return (
    <ConnectedStaggeredTextItem
      text={text}
      delay={delay}
      style={style}
      dataAttrs={dataAttrs}
    />
  );
};
