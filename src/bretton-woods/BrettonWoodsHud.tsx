import React from 'react';
import {
  BRETTON_Z_LAYERS,
  BW_CRIMSON,
  BW_DURATION_FRAMES,
  BW_FPS,
  BW_MUTED,
  BW_SCENES,
  BW_WHITE,
  bwEnergyAt,
  bwFindCue,
  bwSceneForFrame,
  getContinuousCameraRig,
} from './brettonWoodsModel';

const formatTimecode = (frame: number): string => {
  const totalSec = Math.floor(frame / BW_FPS);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Decoupled Floating HUD & Sovereign Shock Overlay:
 * - zIndex 65: Regime-Shift Vignette Pulse
 * - zIndex 75: Independent Top Geodetic & Monetary Telemetry Header
 * - zIndex 76: Independent Bottom 4-Chapter Progress Footer
 */
export const BrettonWoodsFloatingHud: React.FC<{globalFrame: number}> = ({
  globalFrame,
}) => {
  const scene = bwSceneForFrame(globalFrame);
  const rig = getContinuousCameraRig(globalFrame);
  const activeCue = bwFindCue(globalFrame);
  const energy = bwEnergyAt(globalFrame);

  const latStr = `${Math.abs(rig.lat).toFixed(2)}°${rig.lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(rig.lon).toFixed(2)}°${rig.lon >= 0 ? 'E' : 'W'}`;
  const progressPct = ((globalFrame + 1) / BW_DURATION_FRAMES) * 100;

  return (
    <>
      {/* Layer z=65: Independent Sovereign Regime-Shift Vignette Pulse */}
      {rig.regimeShockPulse > 0.005 && (
        <div
          data-canvas-layer="sovereign-flash"
          data-layer-z={BRETTON_Z_LAYERS.sovereignFlash}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: BRETTON_Z_LAYERS.sovereignFlash,
            background: `radial-gradient(ellipse at 50% 50%, transparent 44%, ${BW_CRIMSON}55 100%)`,
            opacity: rig.regimeShockPulse,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Layer z=75: Independent Floating Top HUD Bar */}
      <div
        data-canvas-layer="hud-header"
        data-layer-z={BRETTON_Z_LAYERS.hudHeader}
        data-bw-scene-code={scene.code}
        style={{
          position: 'absolute',
          left: 52,
          right: 52,
          top: 22,
          height: 44,
          zIndex: BRETTON_Z_LAYERS.hudHeader,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px',
          borderRadius: 10,
          background: 'rgba(11, 18, 34, 0.78)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(148, 163, 184, 0.22)',
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: 12,
          letterSpacing: '0.1em',
          pointerEvents: 'none',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
          <span
            style={{
              padding: '3px 9px',
              borderRadius: 5,
              background: `${scene.accentColor}26`,
              border: `1px solid ${scene.accentColor}88`,
              color: scene.accentColor,
              fontWeight: 800,
            }}
          >
            {scene.code}
          </span>
          <span style={{color: BW_WHITE, fontWeight: 600}}>{scene.label}</span>
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: 18, color: BW_MUTED}}>
          <span>
            TARGET: <strong style={{color: BW_WHITE}}>{rig.hubCode}</strong>
          </span>
          <span>
            GEO: <strong style={{color: scene.secondaryColor}}>{latStr} {lonStr}</strong>
          </span>
          <span>
            TOKEN:{' '}
            <strong data-bw-current-token="true" style={{color: scene.accentColor}}>
              {activeCue ? activeCue.text : '—'}
            </strong>
          </span>
        </div>
      </div>

      {/* Layer z=76: Independent Floating Bottom 4-Chapter Timeline HUD Bar */}
      <div
        data-canvas-layer="hud-footer"
        data-layer-z={BRETTON_Z_LAYERS.hudFooter}
        style={{
          position: 'absolute',
          left: 52,
          right: 52,
          bottom: 18,
          height: 46,
          zIndex: BRETTON_Z_LAYERS.hudFooter,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          padding: '0 18px',
          borderRadius: 10,
          background: 'rgba(11, 18, 34, 0.78)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(148, 163, 184, 0.22)',
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: 11.5,
          letterSpacing: '0.09em',
          pointerEvents: 'none',
        }}
      >
        <span style={{color: BW_WHITE, fontWeight: 700, minWidth: 106}}>
          {formatTimecode(globalFrame)} / 01:00
        </span>

        {/* 4-Scene Segmented Progress Bar */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {BW_SCENES.map((s) => {
            const widthWeight = s.nominalEnd - s.nominalFrom;
            const segProgress =
              globalFrame <= s.nominalFrom
                ? 0
                : globalFrame >= s.nominalEnd
                  ? 100
                  : ((globalFrame - s.nominalFrom) / widthWeight) * 100;
            const isCurrent = s.id === scene.id;
            return (
              <div key={s.id} style={{flex: widthWeight, display: 'flex', flexDirection: 'column', gap: 4}}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 9.5,
                    color: isCurrent ? s.accentColor : BW_MUTED,
                    fontWeight: isCurrent ? 800 : 600,
                  }}
                >
                  <span>0{s.index + 1}</span>
                  <span>{s.chapterWindow}</span>
                </div>
                <div
                  style={{
                    height: 5,
                    borderRadius: 999,
                    background: 'rgba(30, 41, 59, 0.9)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${segProgress.toFixed(1)}%`,
                      height: '100%',
                      background: s.accentColor,
                      boxShadow: isCurrent ? `0 0 10px ${s.accentColor}` : 'none',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Voiceover Envelope Level + Frame Index */}
        <div style={{display: 'flex', alignItems: 'center', gap: 12, color: BW_MUTED}}>
          <span>VO_LVL {(energy * 100).toFixed(0).padStart(2, '0')}%</span>
          <span style={{color: scene.accentColor, fontWeight: 700}}>
            {progressPct.toFixed(0)}% // F{String(globalFrame).padStart(4, '0')}
          </span>
        </div>
      </div>
    </>
  );
};
