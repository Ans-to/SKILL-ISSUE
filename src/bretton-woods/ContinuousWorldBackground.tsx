import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {
  BRETTON_Z_LAYERS,
  BW_CYAN,
  BW_EMERALD,
  BW_GOLD,
  BW_HEIGHT,
  BW_NAVY_DEEP,
  BW_NAVY_MID,
  BW_ORANGE,
  BW_WIDTH,
  bwEnergyAt,
  bwSceneForFrame,
  getContinuousCameraRig,
} from './brettonWoodsModel';

/**
 * Layer z=1: Continuous Drifting Atmospheric & Geodetic Coordinate Grid Plane.
 * Eliminates static #000000 black backgrounds; continuously pans & scales with the 3D camera.
 */
export const ContinuousAtmosphericGridPlane: React.FC<{globalFrame: number}> = ({
  globalFrame,
}) => {
  const rig = getContinuousCameraRig(globalFrame);
  const scene = bwSceneForFrame(globalFrame);
  const energy = bwEnergyAt(globalFrame);

  // Smoothly pan volumetric light pools across the 1920x1080 canvas
  const glowCenterX = 50 + Math.sin(globalFrame * 0.014) * 18 - rig.camX * 4.2;
  const glowCenterY = 48 + Math.cos(globalFrame * 0.011) * 12;

  const secondaryGlowX = 52 - Math.cos(globalFrame * 0.016) * 22;
  const secondaryGlowY = 56 + Math.sin(globalFrame * 0.013) * 14;

  const minorOffsetX = ((rig.gridDriftX % 80) + 80) % 80;
  const minorOffsetY = ((rig.gridDriftY % 80) + 80) % 80;
  const majorOffsetX = ((rig.gridDriftX * 1.35) % 320 + 320) % 320;
  const majorOffsetY = ((rig.gridDriftY * 1.35) % 320 + 320) % 320;

  return (
    <div
      data-canvas-layer="coordinate-grid"
      data-layer-z={BRETTON_Z_LAYERS.coordinateGrid}
      data-bw-background="continuous-moving-world"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: BRETTON_Z_LAYERS.coordinateGrid,
        background: `linear-gradient(135deg, ${BW_NAVY_DEEP} 0%, ${BW_NAVY_MID} 52%, #0d182d 100%)`,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Dynamic primary volumetric atmospheric pool */}
      <div
        style={{
          position: 'absolute',
          inset: '-12%',
          background: `radial-gradient(ellipse 56% 50% at ${glowCenterX.toFixed(2)}% ${glowCenterY.toFixed(2)}%, ${scene.accentColor}2b 0%, transparent 72%)`,
          opacity: 0.85 + energy * 0.15,
        }}
      />

      {/* Dynamic secondary oceanic/bullion light pool */}
      <div
        style={{
          position: 'absolute',
          inset: '-12%',
          background: `radial-gradient(ellipse 48% 44% at ${secondaryGlowX.toFixed(2)}% ${secondaryGlowY.toFixed(2)}%, ${scene.secondaryColor}24 0%, transparent 70%)`,
        }}
      />

      {/* Continuously drifting & zooming minor geodetic grid */}
      <div
        data-drifting-minor-grid="true"
        style={{
          position: 'absolute',
          inset: '-160px',
          opacity: 0.14,
          transform: `scale(${rig.gridScale.toFixed(4)})`,
          transformOrigin: '50% 50%',
          backgroundImage:
            'linear-gradient(rgba(148, 163, 184, 0.34) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.34) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          backgroundPosition: `${minorOffsetX.toFixed(2)}px ${minorOffsetY.toFixed(2)}px`,
        }}
      />

      {/* Continuously drifting & zooming major meridian grid */}
      <div
        data-drifting-major-grid="true"
        style={{
          position: 'absolute',
          inset: '-320px',
          opacity: 0.22,
          transform: `scale(${(rig.gridScale * 1.03).toFixed(4)})`,
          transformOrigin: '50% 50%',
          backgroundImage:
            'linear-gradient(rgba(56, 189, 248, 0.30) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.30) 1px, transparent 1px)',
          backgroundSize: '320px 320px',
          backgroundPosition: `${majorOffsetX.toFixed(2)}px ${majorOffsetY.toFixed(2)}px`,
        }}
      />
    </div>
  );
};

const CameraRigUpdater: React.FC<{globalFrame: number}> = ({globalFrame}) => {
  const camera = useThree((s) => s.camera);
  const rig = getContinuousCameraRig(globalFrame);

  camera.position.set(rig.camX, rig.camY, rig.camZ);
  if ('fov' in camera) {
    const pCam = camera as THREE.PerspectiveCamera;
    if (Math.abs(pCam.fov - rig.fov) > 0.001) {
      pCam.fov = rig.fov;
      pCam.updateProjectionMatrix();
    }
  }
  camera.lookAt(rig.lookX, rig.lookY, rig.lookZ);
  camera.updateMatrixWorld();

  return null;
};

type HubNode = {
  id: string;
  x: number;
  z: number;
  color: string;
  height: number;
};

const WORLD_HUBS: readonly HubNode[] = [
  {id: 'BRETTON_WOODS', x: -2.68, z: -0.58, color: BW_GOLD, height: 0.62},
  {id: 'WALL_STREET', x: -2.82, z: -0.34, color: BW_CYAN, height: 0.88},
  {id: 'WASHINGTON_DC', x: -2.98, z: -0.16, color: BW_ORANGE, height: 0.72},
  {id: 'FORT_KNOX', x: -3.42, z: -0.22, color: BW_GOLD, height: 0.68},
  {id: 'LONDON', x: -0.18, z: -0.68, color: BW_CYAN, height: 0.56},
  {id: 'MILAN', x: 0.62, z: -0.42, color: BW_ORANGE, height: 0.58},
  {id: 'RIYADH', x: 2.18, z: 0.12, color: BW_ORANGE, height: 0.66},
  {id: 'TOKYO', x: 4.86, z: -0.36, color: BW_CYAN, height: 0.74},
];

type CorridorSpec = {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  apex: number;
  color: string;
  speed: number;
  phase: number;
};

const TRADE_CORRIDORS: readonly CorridorSpec[] = [
  {
    id: 'riyadh-ny',
    from: [2.18, -0.78, 0.12],
    to: [-2.82, -0.78, -0.34],
    apex: 1.35,
    color: BW_ORANGE,
    speed: 0.011,
    phase: 0.08,
  },
  {
    id: 'tokyo-ny',
    from: [4.86, -0.78, -0.36],
    to: [-2.82, -0.78, -0.34],
    apex: 1.85,
    color: BW_CYAN,
    speed: 0.009,
    phase: 0.34,
  },
  {
    id: 'milan-ny',
    from: [0.62, -0.78, -0.42],
    to: [-2.82, -0.78, -0.34],
    apex: 1.05,
    color: BW_ORANGE,
    speed: 0.013,
    phase: 0.62,
  },
  {
    id: 'london-bw',
    from: [-0.18, -0.78, -0.68],
    to: [-2.68, -0.78, -0.58],
    apex: 0.92,
    color: BW_GOLD,
    speed: 0.012,
    phase: 0.19,
  },
  {
    id: 'milan-bw',
    from: [0.62, -0.78, -0.42],
    to: [-2.68, -0.78, -0.58],
    apex: 1.12,
    color: BW_GOLD,
    speed: 0.010,
    phase: 0.51,
  },
  {
    id: 'tokyo-ust',
    from: [4.86, -0.78, -0.36],
    to: [-2.98, -0.78, -0.16],
    apex: 1.62,
    color: BW_EMERALD,
    speed: 0.010,
    phase: 0.77,
  },
  {
    id: 'riyadh-ust',
    from: [2.18, -0.78, 0.12],
    to: [-2.98, -0.78, -0.16],
    apex: 1.28,
    color: BW_EMERALD,
    speed: 0.012,
    phase: 0.43,
  },
];

const WorldCartographicMesh: React.FC<{globalFrame: number}> = ({globalFrame}) => {
  const rig = getContinuousCameraRig(globalFrame);
  const energy = bwEnergyAt(globalFrame);

  // Prebuild curved corridor tubes and continental wireframe outlines once
  const corridorData = useMemo(() => {
    return TRADE_CORRIDORS.map((c) => {
      const start = new THREE.Vector3(...c.from);
      const end = new THREE.Vector3(...c.to);
      const mid = start.clone().lerp(end, 0.5);
      mid.y += c.apex;
      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      const geometry = new THREE.TubeGeometry(curve, 28, 0.016, 5, false);
      return {...c, curve, geometry};
    });
  }, []);

  const gridLinesGeometry = useMemo(() => {
    const pts: number[] = [];
    for (let x = -9; x <= 9; x += 0.75) {
      pts.push(x, -0.82, -5.5, x, -0.82, 4.5);
    }
    for (let z = -5.5; z <= 4.5; z += 0.75) {
      pts.push(-9, -0.82, z, 9, -0.82, z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  // Stylized continental elevation plates (North America, Europe, Middle East, East Asia)
  const continents = useMemo(
    () => [
      {id: 'north-america', x: -3.25, z: -0.38, w: 2.35, d: 1.55, color: '#1d3557'},
      {id: 'europe', x: 0.35, z: -0.58, w: 1.65, d: 1.05, color: '#1b3152'},
      {id: 'middle-east', x: 2.15, z: 0.14, w: 1.25, d: 0.92, color: '#1e3250'},
      {id: 'east-asia', x: 4.55, z: -0.34, w: 1.55, d: 1.18, color: '#1a3354'},
    ],
    [],
  );

  // 1971 gold-standard lift offset (after F0653 "left the gold standard")
  const goldDecoupleLift =
    globalFrame < 650 ? 0 : Math.min(1, (globalFrame - 650) / 45) * 0.55;

  return (
    <group>
      {/* 3D Geodetic Ground Grid */}
      <lineSegments geometry={gridLinesGeometry}>
        <lineBasicMaterial color="#38bdf8" transparent opacity={0.18} />
      </lineSegments>

      {/* Continental Tectonic Plates */}
      {continents.map((cont) => (
        <group key={cont.id} position={[cont.x, -0.80, cont.z]}>
          <mesh>
            <boxGeometry args={[cont.w, 0.045, cont.d]} />
            <meshLambertMaterial color={cont.color} emissive="#0f294a" emissiveIntensity={0.55} />
          </mesh>
        </group>
      ))}

      {/* World Monetary & Commodity Hub Pylons (square coordinate pads + beacons — zero torusGeometry) */}
      {WORLD_HUBS.map((hub, idx) => {
        const pulse = 0.82 + 0.18 * Math.sin(globalFrame * 0.09 + idx * 1.1);
        const h = hub.height * (0.9 + energy * 0.22);
        return (
          <group key={hub.id} position={[hub.x, -0.78, hub.z]}>
            {/* Square geodetic anchor pad */}
            <mesh position={[0, 0.01, 0]}>
              <boxGeometry args={[0.26 * pulse, 0.018, 0.26 * pulse]} />
              <meshBasicMaterial color={hub.color} transparent opacity={0.46} />
            </mesh>
            {/* Vertical beacon pylon */}
            <mesh position={[0, h * 0.5, 0]}>
              <boxGeometry args={[0.055, h, 0.055]} />
              <meshLambertMaterial
                color={hub.color}
                emissive={hub.color}
                emissiveIntensity={0.85}
              />
            </mesh>
            {/* Top signal node */}
            <mesh position={[0, h + 0.05, 0]}>
              <octahedronGeometry args={[0.065, 0]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        );
      })}

      {/* Parabolic Global FX / Trade / Treasury Corridors + Moving Settlement Packets */}
      {corridorData.map((c) => {
        const t1 = (globalFrame * c.speed + c.phase) % 1;
        const t2 = (globalFrame * c.speed + c.phase + 0.5) % 1;
        const p1 = c.curve.getPointAt(t1);
        const p2 = c.curve.getPointAt(t2);
        return (
          <group key={c.id}>
            <mesh geometry={c.geometry}>
              <meshBasicMaterial color={c.color} transparent opacity={0.34} />
            </mesh>
            <mesh position={[p1.x, p1.y, p1.z]}>
              <boxGeometry args={[0.075, 0.075, 0.075]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[p2.x, p2.y, p2.z]}>
              <boxGeometry args={[0.06, 0.06, 0.06]} />
              <meshBasicMaterial color={c.color} />
            </mesh>
          </group>
        );
      })}

      {/* Scene 2 Landmark: Fort Knox Bullion Reserve Stack (smoothly scales via rig.goldWeight) */}
      {rig.goldWeight > 0.01 && (
        <group
          position={[-3.38, -0.74 + goldDecoupleLift, -0.22]}
          scale={[rig.goldWeight, rig.goldWeight, rig.goldWeight]}
        >
          {[-0.24, 0, 0.24].map((bx, xi) =>
            [-0.14, 0.14].map((bz, zi) => (
              <mesh key={`gold-${xi}-${zi}`} position={[bx, 0.09 + (xi % 2) * 0.06, bz]}>
                <boxGeometry args={[0.19, 0.11, 0.11]} />
                <meshLambertMaterial
                  color={BW_GOLD}
                  emissive="#b45309"
                  emissiveIntensity={0.65}
                />
              </mesh>
            )),
          )}
        </group>
      )}

      {/* Scene 3 Landmark: US Treasury Market Depth & Liquidity Towers */}
      {rig.treasuryWeight > 0.01 && (
        <group position={[-2.68, -0.76, -0.34]}>
          {[
            [-0.36, -0.18, 0.95, BW_CYAN],
            [-0.12, -0.22, 1.32, BW_EMERALD],
            [0.12, -0.16, 1.58, BW_CYAN],
            [0.36, -0.20, 1.18, BW_EMERALD],
            [-0.24, 0.12, 1.10, BW_CYAN],
            [0.04, 0.14, 1.44, BW_ORANGE],
            [0.28, 0.10, 1.04, BW_EMERALD],
          ].map(([tx, tz, maxH, col], idx) => {
            const wave = 0.88 + 0.12 * Math.sin(globalFrame * 0.07 + idx * 0.9);
            const h = (maxH as number) * rig.treasuryWeight * wave;
            return (
              <mesh key={`ust-${idx}`} position={[tx as number, h * 0.5, tz as number]}>
                <boxGeometry args={[0.13, Math.max(0.02, h), 0.13]} />
                <meshLambertMaterial
                  color={col as string}
                  emissive={col as string}
                  emissiveIntensity={0.55}
                />
              </mesh>
            );
          })}
        </group>
      )}

      {/* Scene 4 Landmark: Sovereign USD Reserve Crown Spires */}
      {rig.crownWeight > 0.01 && (
        <group
          position={[-2.82, -0.68, -0.28]}
          rotation={[0, globalFrame * 0.008, 0]}
          scale={[rig.crownWeight, rig.crownWeight, rig.crownWeight]}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const angle = (i / 6) * Math.PI * 2;
            const rx = Math.cos(angle) * 0.52;
            const rz = Math.sin(angle) * 0.52;
            const spireH = i % 2 === 0 ? 0.92 : 0.64;
            return (
              <mesh key={`crown-spire-${i}`} position={[rx, spireH * 0.5, rz]}>
                <coneGeometry args={[0.075, spireH, 4]} />
                <meshLambertMaterial
                  color={i % 2 === 0 ? BW_GOLD : BW_ORANGE}
                  emissive={i % 2 === 0 ? BW_GOLD : BW_ORANGE}
                  emissiveIntensity={0.72}
                />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
};

/**
 * Layer z=10: Continuous 1920x1080 Three.js 3D World Stage.
 * Stays mounted across the entire 60-second film so camera motion is 100% continuous.
 */
export const ContinuousWorldThreeStage: React.FC<{globalFrame: number}> = ({
  globalFrame,
}) => (
  <ThreeCanvas
    width={BW_WIDTH}
    height={BW_HEIGHT}
    dpr={1}
    camera={{
      position: [0.9, 2.35, 8.8],
      fov: 44,
      near: 0.1,
      far: 80,
    }}
    gl={{antialias: true, alpha: true, powerPreference: 'high-performance'}}
    style={{
      position: 'absolute',
      inset: 0,
      zIndex: BRETTON_Z_LAYERS.webglDepth,
      width: BW_WIDTH,
      height: BW_HEIGHT,
      pointerEvents: 'none',
    }}
  >
    <CameraRigUpdater globalFrame={globalFrame} />
    <ambientLight intensity={1.05} />
    <directionalLight position={[4, 8, 6]} intensity={1.45} color="#f8fafc" />
    <WorldCartographicMesh globalFrame={globalFrame} />
  </ThreeCanvas>
);

/**
 * Layer z=36: Independent Cartographic Calibration Reticle SVG Overlay.
 */
export const GeodeticCalibrationOverlay: React.FC<{globalFrame: number}> = ({
  globalFrame,
}) => {
  const rig = getContinuousCameraRig(globalFrame);
  const scene = bwSceneForFrame(globalFrame);
  const reticleX = 960 + Math.sin(globalFrame * 0.02) * 42 - rig.camX * 14;
  const reticleY = 520 + Math.cos(globalFrame * 0.017) * 24;

  return (
    <svg
      data-canvas-layer="atmospheric-calibration"
      data-layer-z={BRETTON_Z_LAYERS.atmosphericCalibration}
      width={BW_WIDTH}
      height={BW_HEIGHT}
      viewBox={`0 0 ${BW_WIDTH} ${BW_HEIGHT}`}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: BRETTON_Z_LAYERS.atmosphericCalibration,
        pointerEvents: 'none',
      }}
    >
      {/* Subtle framing corner brackets */}
      <g stroke="rgba(148, 163, 184, 0.26)" strokeWidth={1.2} fill="none">
        <path d="M 38 88 L 38 76 L 54 76" />
        <path d="M 1882 88 L 1882 76 L 1866 76" />
        <path d="M 38 996 L 38 1008 L 54 1008" />
        <path d="M 1882 996 L 1882 1008 L 1866 1008" />
      </g>

      {/* Moving geodetic target crosshair */}
      <g
        transform={`translate(${reticleX.toFixed(1)}, ${reticleY.toFixed(1)})`}
        opacity={0.34}
      >
        <line x1={-28} y1={0} x2={-9} y2={0} stroke={scene.accentColor} strokeWidth={1.4} />
        <line x1={9} y1={0} x2={28} y2={0} stroke={scene.accentColor} strokeWidth={1.4} />
        <line x1={0} y1={-28} x2={0} y2={-9} stroke={scene.accentColor} strokeWidth={1.4} />
        <line x1={0} y1={9} x2={0} y2={28} stroke={scene.accentColor} strokeWidth={1.4} />
        <rect
          x={-16}
          y={-16}
          width={32}
          height={32}
          stroke="rgba(248, 250, 252, 0.25)"
          strokeWidth={1}
          fill="none"
        />
      </g>
    </svg>
  );
};
