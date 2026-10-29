import React, {useMemo} from 'react';
import {useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {
  BRETTON_Z_LAYERS,
  BW_EMERALD,
  BW_EMERALD_SOFT,
  BW_GOLD,
  BW_GOLD_BRIGHT,
  BW_OBSIDIAN,
  bwEnergyAt,
  bwSceneForFrame,
  getBrettonLayout,
  getContinuousCameraRig,
} from './brettonWoodsModel';

/**
 * Layer z=1: Deep Obsidian (#0b0f19) Canvas with Subtle Drifting Gold & Emerald Grid Lines.
 * Zero static #000000 black, zero debug coordinates, generous breathing room for hero text.
 */
const ContinuousAtmosphericGridPlaneView: React.FC<{
  globalFrame: number;
  width: number;
  height: number;
}> = ({globalFrame, width, height}) => {
  const layout = getBrettonLayout(width, height);
  const rig = getContinuousCameraRig(globalFrame);
  const scene = bwSceneForFrame(globalFrame);
  const energy = bwEnergyAt(globalFrame);

  const glowX = 50 + Math.sin(globalFrame * 0.011) * 14;
  const glowY = layout.isVertical ? 62 : 66;

  const minorSize = Math.round(72 * layout.scale);
  const majorSize = minorSize * 4;
  const minorX = ((rig.gridDriftX % minorSize) + minorSize) % minorSize;
  const minorY = ((rig.gridDriftY % minorSize) + minorSize) % minorSize;
  const majorX = ((rig.gridDriftX * 1.25) % majorSize + majorSize) % majorSize;
  const majorY = ((rig.gridDriftY * 1.25) % majorSize + majorSize) % majorSize;

  return (
    <div
      data-canvas-layer="coordinate-grid"
      data-layer-z={BRETTON_Z_LAYERS.coordinateGrid}
      data-bw-background="obsidian-gold-emerald-grid"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: BRETTON_Z_LAYERS.coordinateGrid,
        backgroundColor: BW_OBSIDIAN,
        backgroundImage: `radial-gradient(ellipse 78% 60% at 50% ${glowY}%, #111a2e 0%, ${BW_OBSIDIAN} 76%)`,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Subtle emerald & gold ambient horizon glow */}
      <div
        style={{
          position: 'absolute',
          inset: '-10%',
          background: `radial-gradient(ellipse 52% 38% at ${glowX.toFixed(2)}% ${glowY}%, ${scene.accentColor}1f 0%, ${BW_GOLD}12 42%, transparent 74%)`,
          opacity: 0.85 + energy * 0.15,
        }}
      />

      {/* Subtle emerald minor isometric-drifting grid */}
      <div
        data-drifting-minor-grid="true"
        style={{
          position: 'absolute',
          inset: '-160px',
          opacity: 0.22,
          transform: `scale(${rig.gridScale.toFixed(4)})`,
          transformOrigin: '50% 50%',
          backgroundImage:
            'linear-gradient(rgba(16, 185, 129, 0.20) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.20) 1px, transparent 1px)',
          backgroundSize: `${minorSize}px ${minorSize}px`,
          backgroundPosition: `${minorX.toFixed(2)}px ${minorY.toFixed(2)}px`,
        }}
      />

      {/* Subtle gold architectural major grid */}
      <div
        data-drifting-major-grid="true"
        style={{
          position: 'absolute',
          inset: '-320px',
          opacity: 0.26,
          transform: `scale(${(rig.gridScale * 1.02).toFixed(4)})`,
          transformOrigin: '50% 50%',
          backgroundImage:
            'linear-gradient(rgba(212, 175, 55, 0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(212, 175, 55, 0.24) 1px, transparent 1px)',
          backgroundSize: `${majorSize}px ${majorSize}px`,
          backgroundPosition: `${majorX.toFixed(2)}px ${majorY.toFixed(2)}px`,
        }}
      />

      {/* Clean upper-stage obsidian veil guaranteeing crisp hero title contrast */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: layout.isVertical
            ? 'linear-gradient(180deg, rgba(11, 15, 25, 0.86) 0%, rgba(11, 15, 25, 0.72) 34%, rgba(11, 15, 25, 0.08) 52%, rgba(11, 15, 25, 0.80) 100%)'
            : 'linear-gradient(180deg, rgba(11, 15, 25, 0.86) 0%, rgba(11, 15, 25, 0.70) 38%, rgba(11, 15, 25, 0.08) 56%, rgba(11, 15, 25, 0.78) 100%)',
        }}
      />
    </div>
  );
};

const ConnectedAtmosphericGridPlane: React.FC<{globalFrame: number}> = ({globalFrame}) => {
  const {width, height} = useVideoConfig();
  return (
    <ContinuousAtmosphericGridPlaneView
      globalFrame={globalFrame}
      width={width}
      height={height}
    />
  );
};

export const ContinuousAtmosphericGridPlane: React.FC<{
  globalFrame: number;
  widthOverride?: number;
  heightOverride?: number;
}> = ({globalFrame, widthOverride, heightOverride}) => {
  if (widthOverride !== undefined && heightOverride !== undefined) {
    return (
      <ContinuousAtmosphericGridPlaneView
        globalFrame={globalFrame}
        width={widthOverride}
        height={heightOverride}
      />
    );
  }
  return <ConnectedAtmosphericGridPlane globalFrame={globalFrame} />;
};

const IsometricCameraController: React.FC<{
  globalFrame: number;
  lookYOffset: number;
  fovOffset: number;
  distanceScale: number;
}> = ({globalFrame, lookYOffset, fovOffset, distanceScale}) => {
  const camera = useThree((s) => s.camera);
  const rig = getContinuousCameraRig(globalFrame);

  camera.position.set(
    rig.camX * distanceScale,
    rig.camY * distanceScale,
    rig.camZ * distanceScale,
  );
  if ('fov' in camera) {
    const pCam = camera as THREE.PerspectiveCamera;
    const targetFov = rig.fov + fovOffset;
    if (Math.abs(pCam.fov - targetFov) > 0.001) {
      pCam.fov = targetFov;
      pCam.updateProjectionMatrix();
    }
  }
  camera.lookAt(rig.lookX, rig.lookY + lookYOffset, rig.lookZ);
  camera.updateMatrixWorld();

  return null;
};

const IsometricThematicWorld: React.FC<{globalFrame: number}> = ({globalFrame}) => {
  const rig = getContinuousCameraRig(globalFrame);
  const floorY = -0.95;

  // Subtle 3D isometric floor grid in gold & emerald
  const {goldGridGeo, emeraldGridGeo} = useMemo(() => {
    const goldPts: number[] = [];
    const emeraldPts: number[] = [];
    for (let i = -8; i <= 8; i += 1) {
      const target = i % 2 === 0 ? goldPts : emeraldPts;
      target.push(i * 0.85, floorY, -5.5, i * 0.85, floorY, 4.5);
      target.push(-7.0, floorY, i * 0.65, 7.0, floorY, i * 0.65);
    }
    const gGold = new THREE.BufferGeometry();
    gGold.setAttribute('position', new THREE.Float32BufferAttribute(goldPts, 3));
    const gEm = new THREE.BufferGeometry();
    gEm.setAttribute('position', new THREE.Float32BufferAttribute(emeraldPts, 3));
    return {goldGridGeo: gGold, emeraldGridGeo: gEm};
  }, []);

  // Scene 1: 3 clean trade convergence arcs into central USD plinth
  const scene1Arcs = useMemo(() => {
    const sources: [number, number, number][] = [
      [-2.4, floorY + 0.08, 0.55],
      [0.0, floorY + 0.08, 1.35],
      [2.4, floorY + 0.08, 0.55],
    ];
    const center = new THREE.Vector3(0, floorY + 0.12, -0.35);
    return sources.map((src, idx) => {
      const s = new THREE.Vector3(...src);
      const mid = s.clone().lerp(center, 0.5);
      mid.y += 0.42;
      const curve = new THREE.CatmullRomCurve3([s, mid, center]);
      const geo = new THREE.TubeGeometry(curve, 24, 0.014, 5, false);
      return {id: `s1-arc-${idx}`, src, curve, geo};
    });
  }, []);

  // Scene 3: Clean global liquidity network filaments
  const liquidityLinks = useMemo(() => {
    const outerNodes: [number, number][] = [
      [-2.5, -0.8],
      [-1.7, 0.95],
      [0.0, 1.35],
      [1.7, 0.95],
      [2.5, -0.8],
      [0.0, -1.45],
    ];
    const hub = new THREE.Vector3(0, floorY + 0.14, -0.05);
    const items = outerNodes.map(([nx, nz], idx) => {
      const nVec = new THREE.Vector3(nx, floorY + 0.1, nz);
      const mid = nVec.clone().lerp(hub, 0.5);
      mid.y += 0.26;
      const curve = new THREE.CatmullRomCurve3([nVec, mid, hub]);
      const geo = new THREE.TubeGeometry(curve, 20, 0.012, 5, false);
      return {id: `liq-${idx}`, nx, nz, curve, geo};
    });
    return items;
  }, []);

  // 1971 gold-standard lift (smoothly floats gold core upward after F0650 while dollar network stays)
  const goldLift =
    globalFrame < 648
      ? 0
      : Math.min(1, (globalFrame - 648) / 48) * 0.48;
  const goldCoreOpacity =
    globalFrame < 648
      ? 1
      : Math.max(0.28, 1 - (globalFrame - 648) / 60);

  return (
    <group>
      {/* Subtle Isometric 3D Gold & Emerald Horizon Grid */}
      <lineSegments geometry={goldGridGeo}>
        <lineBasicMaterial color={BW_GOLD} transparent opacity={0.22} />
      </lineSegments>
      <lineSegments geometry={emeraldGridGeo}>
        <lineBasicMaterial color={BW_EMERALD} transparent opacity={0.16} />
      </lineSegments>

      {/* SCENE 1 3D: Clean 3-Hub Commodity Convergence into Central Dollar Dais */}
      {rig.tradeWeight > 0.01 && (
        <group scale={[1, rig.tradeWeight, 1]}>
          {/* Central Dollar Settlement Plinth */}
          <mesh position={[0, floorY + 0.06, -0.35]}>
            <cylinderGeometry args={[0.58, 0.66, 0.12, 6]} />
            <meshLambertMaterial
              color={BW_EMERALD}
              emissive="#065f46"
              emissiveIntensity={0.65}
            />
          </mesh>
          {scene1Arcs.map((arc, idx) => {
            const prog = ((globalFrame * 0.016 + idx * 0.33) % 1 + 1) % 1;
            const packet = arc.curve.getPointAt(prog);
            return (
              <group key={arc.id}>
                <mesh position={arc.src}>
                  <boxGeometry args={[0.32, 0.12, 0.32]} />
                  <meshLambertMaterial
                    color={BW_GOLD}
                    emissive="#78350f"
                    emissiveIntensity={0.55}
                  />
                </mesh>
                <mesh geometry={arc.geo}>
                  <meshBasicMaterial
                    color={idx % 2 === 0 ? BW_GOLD_BRIGHT : BW_EMERALD_SOFT}
                    transparent
                    opacity={0.42 * rig.tradeWeight}
                  />
                </mesh>
                <mesh position={[packet.x, packet.y, packet.z]}>
                  <octahedronGeometry args={[0.055, 0]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </group>
            );
          })}
        </group>
      )}

      {/* SCENE 2 3D: Sleek Architectural Gold Vault & Sovereign Tether Matrix */}
      {rig.goldVaultWeight > 0.01 && (
        <group position={[0, floorY, -0.05]} scale={[rig.goldVaultWeight, rig.goldVaultWeight, rig.goldVaultWeight]}>
          {/* Recessed Obsidian-Gold Vault Base */}
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[2.1, 0.08, 1.5]} />
            <meshLambertMaterial color="#162033" emissive="#0f172a" emissiveIntensity={0.6} />
          </mesh>
          {/* Precision 3x2 Gold Bullion Ingots */}
          {[-0.52, 0, 0.52].map((gx, xi) =>
            [-0.26, 0.26].map((gz, zi) => (
              <mesh
                key={`bullion-${xi}-${zi}`}
                position={[gx, 0.14 + goldLift, gz]}
              >
                <boxGeometry args={[0.36, 0.12, 0.22]} />
                <meshLambertMaterial
                  color={BW_GOLD_BRIGHT}
                  emissive="#92400e"
                  emissiveIntensity={0.62 * goldCoreOpacity}
                  transparent
                  opacity={goldCoreOpacity}
                />
              </mesh>
            )),
          )}
          {/* Sovereign Currency Peg Perimeter Nodes (remain locked even after 1971 gold lift!) */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const ang = (i / 6) * Math.PI * 2 + globalFrame * 0.004;
            const px = Math.cos(ang) * 1.85;
            const pz = Math.sin(ang) * 1.15;
            return (
              <mesh key={`peg-node-${i}`} position={[px, 0.09, pz]}>
                <boxGeometry args={[0.2, 0.14, 0.2]} />
                <meshLambertMaterial
                  color={BW_EMERALD_SOFT}
                  emissive="#065f46"
                  emissiveIntensity={0.65}
                />
              </mesh>
            );
          })}
        </group>
      )}

      {/* SCENE 3 3D: Clean Global Liquidity Network Nodes & Treasury Foundation */}
      {rig.liquidityNodesWeight > 0.01 && (
        <group scale={[1, rig.liquidityNodesWeight, 1]}>
          {/* Central US Treasury Liquidity Foundation */}
          <mesh position={[0, floorY + 0.09, -0.05]}>
            <cylinderGeometry args={[0.72, 0.82, 0.16, 8]} />
            <meshLambertMaterial
              color={BW_EMERALD}
              emissive="#065f46"
              emissiveIntensity={0.7}
            />
          </mesh>
          {liquidityLinks.map((lnk, idx) => {
            const t = ((globalFrame * 0.015 + idx * 0.17) % 1 + 1) % 1;
            const pt = lnk.curve.getPointAt(t);
            return (
              <group key={lnk.id}>
                <mesh position={[lnk.nx, floorY + 0.11, lnk.nz]}>
                  <octahedronGeometry args={[0.14, 0]} />
                  <meshLambertMaterial
                    color={idx % 2 === 0 ? BW_EMERALD_SOFT : BW_GOLD_BRIGHT}
                    emissive={idx % 2 === 0 ? '#065f46' : '#78350f'}
                    emissiveIntensity={0.65}
                  />
                </mesh>
                <mesh geometry={lnk.geo}>
                  <meshBasicMaterial
                    color={BW_EMERALD_SOFT}
                    transparent
                    opacity={0.38 * rig.liquidityNodesWeight}
                  />
                </mesh>
                <mesh position={[pt.x, pt.y, pt.z]}>
                  <boxGeometry args={[0.065, 0.065, 0.065]} />
                  <meshBasicMaterial color={BW_GOLD_BRIGHT} />
                </mesh>
              </group>
            );
          })}
        </group>
      )}

      {/* SCENE 4 3D: Clean Isometric Sovereign Crown Pedestal */}
      {rig.crownWeight > 0.01 && (
        <group
          position={[0, floorY + 0.06, -0.05]}
          rotation={[0, globalFrame * 0.006, 0]}
          scale={[rig.crownWeight, rig.crownWeight, rig.crownWeight]}
        >
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.95, 1.08, 0.1, 8]} />
            <meshLambertMaterial color="#162033" emissive="#0f172a" emissiveIntensity={0.65} />
          </mesh>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const ang = (i / 6) * Math.PI * 2;
            const cx = Math.cos(ang) * 0.68;
            const cz = Math.sin(ang) * 0.68;
            const h = i % 2 === 0 ? 0.38 : 0.26;
            return (
              <mesh key={`crown-facet-${i}`} position={[cx, 0.1 + h * 0.5, cz]}>
                <coneGeometry args={[0.09, h, 4]} />
                <meshLambertMaterial
                  color={i % 2 === 0 ? BW_GOLD_BRIGHT : BW_EMERALD_SOFT}
                  emissive={i % 2 === 0 ? '#92400e' : '#065f46'}
                  emissiveIntensity={0.7}
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
 * Layer z=10: Continuous Isometric 3D World Stage supporting both 16:9 and 9:16.
 */
export const ContinuousWorldThreeStage: React.FC<{globalFrame: number}> = ({
  globalFrame,
}) => {
  const {width, height} = useVideoConfig();
  const layout = getBrettonLayout(width, height);

  return (
    <ThreeCanvas
      width={width}
      height={height}
      dpr={1}
      camera={{
        position: [-2.4, 4.35, 8.6],
        fov: 28,
        near: 0.1,
        far: 80,
      }}
      gl={{antialias: true, alpha: true, powerPreference: 'high-performance'}}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: BRETTON_Z_LAYERS.webglDepth,
        width,
        height,
        pointerEvents: 'none',
      }}
    >
      <IsometricCameraController
        globalFrame={globalFrame}
        lookYOffset={layout.cameraLookYOffset}
        fovOffset={layout.cameraFovOffset}
        distanceScale={layout.cameraDistanceScale}
      />
      <ambientLight intensity={1.0} />
      <directionalLight position={[4, 9, 6]} intensity={1.35} color="#f8fafc" />
      <IsometricThematicWorld globalFrame={globalFrame} />
    </ThreeCanvas>
  );
};
