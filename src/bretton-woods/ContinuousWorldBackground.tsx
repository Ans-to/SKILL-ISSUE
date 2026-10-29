import React from 'react';
import {useVideoConfig} from 'remotion';
import {CinematicIsometricBackdropView} from './CinematicSceneMaster';

const ConnectedAtmosphericGridPlane: React.FC<{
  globalFrame: number;
  accentColor?: string;
}> = ({globalFrame, accentColor}) => {
  const {width, height} = useVideoConfig();
  return (
    <CinematicIsometricBackdropView
      globalFrame={globalFrame}
      width={width}
      height={height}
      accentColor={accentColor}
    />
  );
};

/**
 * Layer z=1..3: Continuous 3D Isometric Grid + Ambient Lighting Glow
 * powered directly by CinematicSceneMaster's backdrop engine.
 */
export const ContinuousAtmosphericGridPlane: React.FC<{
  globalFrame: number;
  accentColor?: string;
  widthOverride?: number;
  heightOverride?: number;
}> = ({globalFrame, accentColor, widthOverride, heightOverride}) => {
  if (widthOverride !== undefined && heightOverride !== undefined) {
    return (
      <CinematicIsometricBackdropView
        globalFrame={globalFrame}
        width={widthOverride}
        height={heightOverride}
        accentColor={accentColor}
      />
    );
  }
  return (
    <ConnectedAtmosphericGridPlane
      globalFrame={globalFrame}
      accentColor={accentColor}
    />
  );
};
