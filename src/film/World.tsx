import React, {useMemo} from 'react';
import {interpolate, useCurrentFrame, useVideoConfig, spring, Easing} from 'remotion';
import {useFrame, useThree} from '@react-three/fiber';
import {RoundedBox} from '@react-three/drei';
import {
  AdditiveBlending,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  ExtrudeGeometry,
  Float32BufferAttribute,
  PerspectiveCamera,
  Quaternion,
  Shape,
  TubeGeometry,
  Vector3,
} from 'three';

const T = {ink: '#0b0f19', ocean: '#102630', cyan: '#70e9f2', amber: '#ffc36f', ice: '#e5f5f2'};
const FPS = 30;
const EASE = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const, easing: Easing.inOut(Easing.cubic)};
const blend = (frame: number, a: number, b: number) => interpolate(frame, [a, b], [0, 1], EASE);
const enter = (frame: number, fps: number, at: number) => Math.max(0, Math.min(1, spring({frame: frame - at, fps, config: {damping: 12, stiffness: 100}})));

const EARTH = 3.8;
const NOKIA = {lat: 61.46, lon: 23.5};
const rawPoint = (lat: number, lon: number, radius = EARTH) => {
  const p = lat * Math.PI / 180;
  const l = lon * Math.PI / 180;
  return new Vector3(radius * Math.cos(p) * Math.sin(l), radius * Math.sin(p), radius * Math.cos(p) * Math.cos(l));
};
const earthRotation = new Quaternion().setFromUnitVectors(rawPoint(NOKIA.lat, NOKIA.lon, 1).normalize(), new Vector3(0, 0, 1));
const geoPoint = (lat: number, lon: number, radius = EARTH) => rawPoint(lat, lon, radius).applyQuaternion(earthRotation);
const finland = geoPoint(NOKIA.lat, NOKIA.lon, EARTH + 0.045);

const tube = (curve: CatmullRomCurve3, radius: number, segments = 64) => new TubeGeometry(curve, segments, radius, 8, false);

const makeGlobeWire = () => {
  const positions: number[] = [];
  const connect = (points: Vector3[]) => {
    for (let index = 0; index < points.length - 1; index++) positions.push(...points[index].toArray(), ...points[index + 1].toArray());
  };
  for (let lat = -75; lat <= 75; lat += 15) connect(Array.from({length: 73}, (_, i) => geoPoint(lat, -180 + i * 5, EARTH + 0.012)));
  for (let lon = -180; lon < 180; lon += 15) connect(Array.from({length: 45}, (_, i) => geoPoint(-88 + i * 4, lon, EARTH + 0.012)));
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return geometry;
};

const makeNodeField = () => {
  const positions: number[] = [];
  const colors: number[] = [];
  let k = 0;
  for (let lat = -68; lat <= 68; lat += 17) {
    for (let lon = -180; lon < 180; lon += 18) {
      if (k % 4 !== 0) {
        const p = geoPoint(lat + ((k * 5) % 7 - 3) * 0.7, lon + ((k * 3) % 9 - 4) * 0.8, EARTH + 0.05);
        positions.push(...p.toArray());
        const c = new Color(k % 11 === 0 ? T.amber : T.cyan);
        colors.push(c.r, c.g, c.b);
      }
      k++;
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return geometry;
};

const CameraChoreography: React.FC = () => {
  const frame = useCurrentFrame();
  const {camera} = useThree();
  const z = interpolate(frame, [0, 54, 90, 180, 450, 525, 690, 750, 900], [18, 10.6, 11.6, 13.2, 15.5, 10.8, 15.2, 9.1, 11.2], EASE);
  useFrame(() => {
    const cam = camera as PerspectiveCamera;
    cam.position.set(0, 0, Math.max(8.8, Math.min(18.2, z)));
    cam.up.set(0, 1, 0);
    cam.lookAt(0, 0, 0);
    // Fixed 42° lens. The only camera motion is a clamped Z-axis dolly.
  });
  return null;
};

const Atlas: React.FC<{frame: number}> = ({frame}) => {
  const wire = useMemo(makeGlobeWire, []);
  const nodes = useMemo(makeNodeField, []);
  const globeScale = frame < 48 ? 1 : frame < 78 ? 1 - blend(frame, 48, 78) : frame < 450 ? 0 : frame < 480 ? enter(frame, FPS, 450) : frame < 690 ? 1 : frame < 720 ? 1 - blend(frame, 690, 720) : 0;
  const destinations = useMemo(() => [
    {lat: 51.507, lon: -0.128, delay: 0},
    {lat: 40.713, lon: -74.006, delay: 12},
    {lat: 35.676, lon: 139.65, delay: 24},
  ].map((city) => {
    const end = geoPoint(city.lat, city.lon, EARTH + 0.11);
    const mid = finland.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(EARTH + 0.9);
    const curve = new CatmullRomCurve3([finland.clone(), mid, end]);
    return {...city, end, curve, geometry: tube(curve, 0.018, 56)};
  }), []);
  return (
    <group position={[0, 0.15, -2.5]} scale={globeScale} rotation={[0, frame * 0.0005, 0]}>
      <mesh>
        <sphereGeometry args={[EARTH, 56, 40]} />
        <meshStandardMaterial color={T.ocean} roughness={0.72} metalness={0.22} />
      </mesh>
      <lineSegments geometry={wire}>
        <lineBasicMaterial color="#419ba9" transparent opacity={0.18} depthWrite={false} />
      </lineSegments>
      <points geometry={nodes}>
        <pointsMaterial size={0.048} sizeAttenuation vertexColors transparent opacity={0.91} depthWrite={false} />
      </points>
      <mesh position={finland.toArray()}>
        <sphereGeometry args={[0.085 + Math.sin(frame / 8) * 0.018, 16, 12]} />
        <meshBasicMaterial color={T.amber} />
      </mesh>
      <mesh position={finland.toArray()} scale={1 + (frame % 36) / 28}>
        <torusGeometry args={[0.2, 0.012, 8, 48]} />
        <meshBasicMaterial color={T.amber} transparent opacity={0.55 - (frame % 36) / 80} />
      </mesh>
      {frame >= 558 && frame < 690 && destinations.map(({end, geometry, curve, delay}, index) => {
        const routeIn = enter(frame, FPS, 558 + delay);
        const packet = curve.getPointAt(Math.min(1, Math.max(0, (frame - 558 - delay) / 48)));
        return (
          <group key={index}>
            <mesh geometry={geometry}>
              <meshBasicMaterial color={index === 0 ? T.amber : T.cyan} transparent opacity={0.72 * routeIn} depthWrite={false} />
            </mesh>
            <mesh position={end.toArray()}>
              <sphereGeometry args={[0.07, 12, 10]} />
              <meshBasicMaterial color={T.ice} transparent opacity={routeIn} />
            </mesh>
            <mesh position={packet.toArray()}>
              <sphereGeometry args={[0.055, 10, 8]} />
              <meshBasicMaterial color={T.amber} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

const Fir: React.FC<{x: number; z: number; scale: number; frame: number}> = ({x, z, scale, frame}) => (
  <group position={[x, -1.4, z]} scale={scale} rotation={[0, 0, Math.sin(frame / 18 + x) * 0.018]}>
    <mesh position={[0, 0.36, 0]} castShadow>
      <cylinderGeometry args={[0.055, 0.09, 0.8, 10]} />
      <meshStandardMaterial color="#473a30" roughness={0.94} />
    </mesh>
    {[0, 1, 2].map((tier) => (
      <group key={tier} position={[0, 0.53 + tier * 0.4, 0]}>
        <mesh castShadow>
          <coneGeometry args={[0.43 - tier * 0.07, 0.92 - tier * 0.12, 10]} />
          <meshStandardMaterial color={tier === 2 ? '#315b51' : '#1d5145'} roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <coneGeometry args={[0.26 - tier * 0.035, 0.43, 10]} />
          <meshStandardMaterial color="#dae8e3" roughness={0.86} />
        </mesh>
      </group>
    ))}
  </group>
);

const Mill: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const reveal = enter(frame, fps, 44) * (1 - blend(frame, 180, 210));
  const millGlow = 0.9 + Math.sin(frame / 8) * 0.18;
  return (
    <group position={[0, -0.1, 0.2]} scale={reveal}>
      <RoundedBox args={[8.8, 0.3, 4.4]} radius={0.11} smoothness={3} position={[0, -1.72, 0]} receiveShadow>
        <meshStandardMaterial color="#cddbd6" roughness={0.93} />
      </RoundedBox>
      {Array.from({length: 15}, (_, i) => <Fir key={i} x={-3.7 + (i % 8) * 1.02} z={-1.15 + Math.floor(i / 8) * 1.05} scale={0.56 + (i % 4) * 0.08} frame={frame} />)}
      <group position={[0, -0.04, 0.68]}>
        <mesh position={[0, -0.38, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.55, 1.72, 1.65]} />
          <meshStandardMaterial color="#51382e" roughness={0.82} />
        </mesh>
        <mesh position={[0, -0.3, 0.84]}>
          <boxGeometry args={[2.3, 1.18, 0.06]} />
          <meshStandardMaterial color="#80543b" roughness={0.76} />
        </mesh>
        {[-0.78, -0.39, 0, 0.39].map((y) => <mesh key={y} position={[0, y - 0.3, 0.89]}>
          <boxGeometry args={[2.46, 0.035, 0.05]} /><meshStandardMaterial color="#a16b49" roughness={0.82} />
        </mesh>)}
        {[-1.15, -0.62, 0.62, 1.15].map((x) => <mesh key={x} position={[x, -0.31, 0.92]} castShadow>
          <boxGeometry args={[0.075, 1.58, 0.065]} /><meshStandardMaterial color="#402f29" roughness={0.84} />
        </mesh>)}
        <mesh position={[-0.42, 0.64, 0]} rotation={[0, 0, 0.48]} castShadow>
          <boxGeometry args={[1.78, 0.15, 2.05]} /><meshStandardMaterial color="#263a40" metalness={0.22} roughness={0.48} />
        </mesh>
        <mesh position={[0.42, 0.64, 0]} rotation={[0, 0, -0.48]} castShadow>
          <boxGeometry args={[1.78, 0.15, 2.05]} /><meshStandardMaterial color="#324b50" metalness={0.2} roughness={0.48} />
        </mesh>
        {[0, 1, 2].map((i) => <RoundedBox key={i} args={[0.35, 0.5, 0.055]} radius={0.06} smoothness={3} position={[-0.65 + i * 0.62, -0.13, 0.96]}>
          <meshStandardMaterial color="#f0bb70" emissive="#a65e24" emissiveIntensity={millGlow} />
        </RoundedBox>)}
        <mesh position={[0, 0.05, 0.14]}>
          <cylinderGeometry args={[0.13, 0.16, 0.65, 12]} /><meshStandardMaterial color="#36484c" metalness={0.28} roughness={0.52} />
        </mesh>
        <pointLight position={[0, 0.35, 2]} color={T.amber} intensity={3} distance={5} />
      </group>
      {[-2.1, -1.75, -1.4].map((x) => <mesh key={x} position={[x, -1.38, 1.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.13, 0.13, 1.25, 16]} /><meshStandardMaterial color="#80573c" roughness={0.92} />
      </mesh>)}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[((i * 13) % 8) - 4, ((i * 19 + frame * 0.6) % 6) - 3, 1.8]}>
          <sphereGeometry args={[0.022 + (i % 2) * 0.01, 6, 6]} /><meshBasicMaterial color="#eaf6f2" transparent opacity={0.58} />
        </mesh>
      ))}
    </group>
  );
};

const makeBoot = () => {
  const shape = new Shape();
  shape.moveTo(-0.58, -0.48); shape.lineTo(0.5, -0.48); shape.quadraticCurveTo(0.8, -0.45, 0.78, -0.18);
  shape.quadraticCurveTo(0.76, -0.05, 0.58, 0.02); shape.lineTo(0.16, 0.13); shape.lineTo(0.02, 0.28);
  shape.lineTo(0.02, 0.88); shape.quadraticCurveTo(0.02, 1, -0.12, 1); shape.lineTo(-0.47, 1);
  shape.quadraticCurveTo(-0.6, 0.98, -0.6, 0.82); shape.lineTo(-0.58, -0.48);
  return new ExtrudeGeometry(shape, {depth: 0.4, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.04, bevelThickness: 0.035});
};

const Industry: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const show = enter(frame, fps, 180) * (1 - blend(frame, 450, 480));
  const boot = enter(frame, fps, 240);
  const cable = enter(frame, fps, 300);
  const graph = enter(frame, fps, 390);
  const bootGeometry = useMemo(makeBoot, []);
  const cableCurve = useMemo(() => new CatmullRomCurve3([
    new Vector3(-4.4, -0.5, 0.2), new Vector3(-2.5, 0.2, 0.6), new Vector3(0, -0.2, 0.45), new Vector3(2.5, 0.6, 0.6), new Vector3(4.35, -0.2, 0.15),
  ]), []);
  const cableTube = useMemo(() => tube(cableCurve, 0.04, 80), [cableCurve]);
  const packet = cableCurve.getPointAt((Math.max(0, frame - 300) * 0.02) % 1);
  return (
    <group scale={show} position={[0, -0.14, 0.25]}>
      <mesh position={[0, -1.68, 0]} receiveShadow>
        <cylinderGeometry args={[4.8, 5.2, 0.28, 64]} /><meshStandardMaterial color="#192a32" metalness={0.48} roughness={0.55} />
      </mesh>
      <group position={[-2.55, -0.35, 0.62]} scale={boot} rotation={[0, -0.12, 0]}>
        <mesh geometry={bootGeometry} castShadow>
          <meshStandardMaterial color="#c98742" roughness={0.4} metalness={0.06} emissive="#4d2b11" emissiveIntensity={0.12} />
        </mesh>
        <mesh position={[-0.28, 0.94, 0.21]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.23, 0.04, 8, 32]} /><meshStandardMaterial color="#e6b56e" metalness={0.18} roughness={0.38} />
        </mesh>
      </group>
      <group scale={cable}>
        <mesh geometry={cableTube}>
          <meshStandardMaterial color="#203944" metalness={0.76} roughness={0.26} emissive="#0d4753" emissiveIntensity={0.34} />
        </mesh>
        {[0, 1].map((i) => <mesh key={i} position={[i ? 4.3 : -4.3, i ? -0.2 : -0.5, 0.2]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.17, 0.035, 8, 28]} /><meshStandardMaterial color="#bb6d44" metalness={0.52} roughness={0.36} />
        </mesh>)}
        <mesh position={packet.toArray()}><sphereGeometry args={[0.075, 12, 10]} /><meshBasicMaterial color={T.amber} /></mesh>
      </group>
      <group position={[2.7, -0.8, 0.85]} scale={graph}>
        {[0.42, 0.67, 0.88, 1.12, 1.45, 1.78].map((height, i) => <RoundedBox key={i} args={[0.21, height, 0.18]} radius={0.035} smoothness={3} position={[-0.88 + i * 0.36, height / 2, 0]} castShadow>
          <meshStandardMaterial color={i < 3 ? '#356f7a' : '#67dce8'} emissive="#33c1d1" emissiveIntensity={0.28} metalness={0.24} roughness={0.43} />
        </RoundedBox>)}
      </group>
    </group>
  );
};

const Device: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const reveal = enter(frame, fps, 678);
  const sweep = (frame * 5) % 360;
  const pulse = 0.3 + 0.14 * Math.sin(frame / 8);
  const radarRay = useMemo(() => tube(new CatmullRomCurve3([
    new Vector3(0, 0, 0), new Vector3(0.2, 0.28, 0.015), new Vector3(0.16, 0.55, 0.02), new Vector3(-0.18, 0.74, 0.025),
  ]), 0.013, 24), []);
  return (
    <group position={[0, -0.05, 0.15]} scale={reveal} rotation={[0.012 * Math.sin(frame / 18), 0.08 * Math.sin(frame / 21), 0]}>
      <mesh position={[0, -2.88, -0.04]} castShadow receiveShadow>
        <cylinderGeometry args={[1.82, 2.08, 0.28, 64]} /><meshStandardMaterial color="#14252d" metalness={0.74} roughness={0.3} />
      </mesh>
      <mesh position={[0, -2.73, -0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.85, 0.023, 8, 64]} /><meshBasicMaterial color={T.cyan} transparent opacity={0.56} />
      </mesh>
      <RoundedBox args={[2.74, 5.28, 0.38]} radius={0.28} smoothness={8} castShadow>
        <meshStandardMaterial color="#111a24" metalness={0.92} roughness={0.18} emissive="#123b47" emissiveIntensity={pulse} />
      </RoundedBox>
      <RoundedBox args={[2.42, 4.96, 0.12]} radius={0.22} smoothness={8} position={[0, 0, 0.22]}>
        <meshStandardMaterial color="#08141d" metalness={0.36} roughness={0.26} />
      </RoundedBox>
      <RoundedBox args={[2.18, 4.68, 0.06]} radius={0.16} smoothness={6} position={[0, 0, 0.31]}>
        <meshPhysicalMaterial color="#0d2631" metalness={0.2} roughness={0.2} clearcoat={0.9} emissive="#0d3d4b" emissiveIntensity={0.36} />
      </RoundedBox>
      {[-1, 1].map((side) => <group key={side}>
        <RoundedBox args={[0.085, 0.56, 0.12]} radius={0.035} smoothness={4} position={[side * 1.38, 0.72, 0]} castShadow>
          <meshStandardMaterial color="#93a5a8" metalness={0.88} roughness={0.22} />
        </RoundedBox>
        <RoundedBox args={[0.085, 0.3, 0.12]} radius={0.035} smoothness={4} position={[side * 1.38, -0.2, 0]}>
          <meshStandardMaterial color="#71868b" metalness={0.8} roughness={0.24} />
        </RoundedBox>
      </group>)}
      {[0.94, 0.7, 0.46, 0.24].map((radius) => <mesh key={radius} position={[0, 0.07, 0.36]}>
        <torusGeometry args={[radius, 0.014, 8, 64]} /><meshBasicMaterial color={radius < 0.3 ? T.amber : T.cyan} transparent opacity={0.54} />
      </mesh>)}
      <group position={[0, 0.07, 0.38]} rotation={[0, 0, -sweep * Math.PI / 180]}>
        <mesh geometry={radarRay}><meshBasicMaterial color={T.cyan} transparent opacity={0.92} /></mesh>
        <mesh position={[-0.18, 0.74, 0.025]}><sphereGeometry args={[0.038, 12, 10]} /><meshBasicMaterial color={T.ice} /></mesh>
        <mesh><torusGeometry args={[0.76, 0.012, 8, 48, Math.PI * 0.5]} /><meshBasicMaterial color={T.cyan} transparent opacity={0.62} /></mesh>
      </group>
      <RoundedBox args={[0.54, 0.05, 0.025]} radius={0.02} smoothness={3} position={[0, 2.28, 0.36]}>
        <meshStandardMaterial color="#061018" metalness={0.6} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0.42, 2.27, 0.38]}><sphereGeometry args={[0.065, 16, 12]} /><meshPhysicalMaterial color="#284857" metalness={0.8} roughness={0.17} clearcoat={1} /></mesh>
      <pointLight position={[0, 0, 1]} color={T.cyan} intensity={4 + pulse * 3} distance={5} />
    </group>
  );
};

const Dust: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = useMemo(() => Array.from({length: 140}, (_, i) => ({
    x: ((i * 73) % 101) / 101 * 20 - 10,
    y: ((i * 37) % 97) / 97 * 11 - 5.5,
    z: -8 + ((i * 19) % 109) / 109 * 14,
    phase: i * 0.83,
    speed: 0.12 + (i % 6) * 0.028,
  })), []);
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(new Float32Array(seed.length * 3), 3));
    const c = new Float32Array(seed.length * 3);
    seed.forEach((_, i) => { const color = new Color(i % 8 === 0 ? T.amber : T.cyan); c.set([color.r, color.g, color.b], i * 3); });
    g.setAttribute('color', new Float32BufferAttribute(c, 3));
    return g;
  }, [seed]);
  useFrame(() => {
    const attr = geometry.getAttribute('position') as Float32BufferAttribute;
    seed.forEach((p, i) => attr.setXYZ(i, p.x + Math.sin(frame / 29 + p.phase) * 0.13, ((p.y + frame * p.speed + 5.5) % 11) - 5.5, p.z));
    attr.needsUpdate = true;
  });
  return <points geometry={geometry} frustumCulled={false}><pointsMaterial size={0.044} sizeAttenuation vertexColors transparent opacity={0.42} depthWrite={false} blending={AdditiveBlending} /></points>;
};

export const NokiaWorld: React.FC = () => {
  const frame = useCurrentFrame();
  return <>
    <color attach="background" args={[T.ink]} />
    <fog attach="fog" args={[T.ink, 20, 44]} />
    <ambientLight intensity={0.42} />
    <directionalLight position={[-5, 8, 10]} intensity={2.2} color="#d4f0ed" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-11} shadow-camera-right={11} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-camera-far={38} shadow-radius={6} shadow-bias={-0.00012} />
    <pointLight position={[0, 0, 8]} intensity={2.2} color="#27899c" distance={24} />
    <pointLight position={[-5, 2, 6]} intensity={1.5} color={T.amber} distance={18} />
    <CameraChoreography />
    <Atlas frame={frame} />
    <Mill frame={frame} />
    <Industry frame={frame} />
    <Device frame={frame} />
    <Dust />
  </>;
};
