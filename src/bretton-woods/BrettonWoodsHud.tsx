import React from 'react';
import {useVideoConfig} from 'remotion';
import {
  BRETTON_Z_LAYERS,
  BW_DURATION_FRAMES,
  BW_MUTED,
  bwSceneForFrame,
  getBrettonLayout,
} from './brettonWoodsModel';

const BrettonWoodsFloatingHudView: React.FC<{
  globalFrame: number;
  width: number;
  height: number;
}> = ({globalFrame, width, height}) => {
  const layout = getBrettonLayout(width, height);
  const scene = bwSceneForFrame(globalFrame);
  const progressPct = ((globalFrame + 1) / BW_DURATION_FRAMES) * 100;

  return (
    <>
      {/* Layer z=75: Clean Editorial Chapter Title Whisper */}
      <div
        data-canvas-layer="chapter-header"
        data-layer-z={BRETTON_Z_LAYERS.chapterHeader}
        data-bw-chapter={scene.roman}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: layout.chapterTop,
          zIndex: BRETTON_Z_LAYERS.chapterHeader,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif',
          fontSize: Math.round(12 * layout.scale),
          fontWeight: 600,
          letterSpacing: '0.28em',
          color: BW_MUTED,
          pointerEvents: 'none',
        }}
      >
        <span style={{color: scene.accentColor, fontWeight: 700}}>{scene.roman}</span>
        <span style={{opacity: 0.45}}>·</span>
        <span style={{color: '#94a3b8'}}>{scene.label}</span>
      </div>

      {/* Layer z=76: Subtle 2px Gold/Emerald Documentary Progress Hairline */}
      <div
        data-canvas-layer="progress-rule"
        data-layer-z={BRETTON_Z_LAYERS.progressRule}
        style={{
          position: 'absolute',
          left: layout.progressHorizontalPad,
          right: layout.progressHorizontalPad,
          bottom: layout.progressBottom,
          height: 2,
          zIndex: BRETTON_Z_LAYERS.progressRule,
          borderRadius: 999,
          background: 'rgba(148, 163, 184, 0.14)',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: `${progressPct.toFixed(2)}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${scene.secondaryColor}, ${scene.accentColor})`,
          }}
        />
      </div>
    </>
  );
};

const ConnectedFloatingHud: React.FC<{globalFrame: number}> = ({globalFrame}) => {
  const {width, height} = useVideoConfig();
  return <BrettonWoodsFloatingHudView globalFrame={globalFrame} width={width} height={height} />;
};

export const BrettonWoodsFloatingHud: React.FC<{
  globalFrame: number;
  widthOverride?: number;
  heightOverride?: number;
}> = ({globalFrame, widthOverride, heightOverride}) => {
  if (widthOverride !== undefined && heightOverride !== undefined) {
    return (
      <BrettonWoodsFloatingHudView
        globalFrame={globalFrame}
        width={widthOverride}
        height={heightOverride}
      />
    );
  }
  return <ConnectedFloatingHud globalFrame={globalFrame} />;
};
