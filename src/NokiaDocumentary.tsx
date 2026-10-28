import React, {useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Html, RoundedBox} from '@react-three/drei';
import {useFrame, useThree} from '@react-three/fiber';
import {
  BufferGeometry,
  CatmullRomCurve3,
  Float32BufferAttribute,
  Group,
  PerspectiveCamera,
  Quaternion,
  ShapeUtils,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';

const W = 1920;
const H = 1080;
const FPS = 30;
const C = {
  obsidian: '#0b0f19',
  navy: '#101f2b',
  cyan: '#70e9f2',
  cyanDim: '#2c8f9f',
  amber: '#ffc36f',
  ice: '#ddf4f1',
  pine: '#174c42',
  snow: '#d9e9e8',
  copper: '#e59a58',
};
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const eased = {...clamp, easing: Easing.inOut(Easing.cubic)};
const easeBetween = (frame: number, a: number, b: number) => interpolate(frame, [a, b], [0, 1], eased);
const springAt = (frame: number, fps: number, start: number) => Math.max(0, Math.min(1, spring({frame: frame - start, fps, config: {damping: 12, stiffness: 100}})));
const remap = (frame: number, a: number, b: number, from: number, to: number) => interpolate(frame, [a, b], [from, to], eased);

// Longitudes are rotated so Nokia's Finnish origin is the facing point on the 3D globe.
const EARTH_R = 4;
const rawGeo = (lat: number, lon: number, radius = EARTH_R) => {
  const p = (lat * Math.PI) / 180;
  const l = (lon * Math.PI) / 180;
  return new Vector3(radius * Math.cos(p) * Math.sin(l), radius * Math.sin(p), radius * Math.cos(p) * Math.cos(l));
};
const NOKIA_TOWN = {lat: 61.46, lon: 23.5};
const finlandRaw = rawGeo(NOKIA_TOWN.lat, NOKIA_TOWN.lon);
const earthRotation = new Quaternion().setFromUnitVectors(finlandRaw.clone().normalize(), new Vector3(0, 0, 1));
const geoPoint = (lat: number, lon: number, radius = EARTH_R) => rawGeo(lat, lon, radius).applyQuaternion(earthRotation);
const FINLAND = geoPoint(NOKIA_TOWN.lat, NOKIA_TOWN.lon, EARTH_R + 0.04);
const CITY_DATA = [
  {name: 'LONDON', lat: 51.507, lon: -0.128, delay: 0},
  {name: 'NEW YORK', lat: 40.713, lon: -74.006, delay: 12},
  {name: 'TOKYO', lat: 35.676, lon: 139.65, delay: 24},
  {name: 'SINGAPORE', lat: 1.352, lon: 103.82, delay: 36},
  {name: 'SÃO PAULO', lat: -23.55, lon: -46.63, delay: 48},
] as const;

const makeGlobeGrid = () => {
  const positions: number[] = [];
  const appendCurve = (points: Vector3[]) => {
    for (let i = 0; i < points.length - 1; i++) positions.push(...points[i].toArray(), ...points[i + 1].toArray());
  };
  for (let lat = -75; lat <= 75; lat += 15) {
    const ring: Vector3[] = [];
    for (let lon = -180; lon <= 180; lon += 5) ring.push(geoPoint(lat, lon, EARTH_R + 0.012));
    appendCurve(ring);
  }
  for (let lon = -180; lon < 180; lon += 15) {
    const meridian: Vector3[] = [];
    for (let lat = -88; lat <= 88; lat += 4) meridian.push(geoPoint(lat, lon, EARTH_R + 0.012));
    appendCurve(meridian);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return geometry;
};

const makeIndustrialCage = () => {
  const points: number[] = [];
  const edge = (a: Vector3, b: Vector3) => points.push(...a.toArray(), ...b.toArray());
  // Open volumetric lattice: every cue travels through a real 3D wire cage, never a flat grid plane.
  for (let y=-3.2; y<=3.2; y+=0.8) for (let z=-3.2; z<=3.2; z+=1.6) edge(new Vector3(-8,y,z),new Vector3(8,y,z));
  for (let x=-8; x<=8; x+=1.6) for (let z=-3.2; z<=3.2; z+=1.6) edge(new Vector3(x,-3.2,z),new Vector3(x,3.2,z));
  for (let x=-8; x<=8; x+=1.6) for (let y=-3.2; y<=3.2; y+=0.8) edge(new Vector3(x,y,-3.2),new Vector3(x,y,3.2));
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new Float32BufferAttribute(points,3));
  return geometry;
};

const makeLandGeometry = (coordinates: readonly (readonly [number, number])[]) => {
  const contour = coordinates.map(([lat, lon]) => new Vector2(lon, lat));
  const triangles = ShapeUtils.triangulateShape(contour, []);
  const vertices = contour.map((point) => geoPoint(point.y, point.x, EARTH_R + 0.035));
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices.flatMap((v) => v.toArray()), 3));
  geometry.setIndex(triangles.flat());
  geometry.computeVertexNormals();
  return geometry;
};

const LAND: readonly (readonly (readonly [number, number])[])[] = [
  [[72,-155],[68,-137],[59,-130],[54,-125],[49,-124],[44,-124],[39,-119],[33,-116],[28,-109],[23,-104],[18,-96],[19,-88],[24,-83],[28,-81],[31,-78],[36,-75],[42,-69],[48,-60],[54,-58],[59,-67],[63,-78],[68,-91],[72,-112]],
  [[12,-81],[8,-77],[2,-79],[-5,-78],[-12,-76],[-20,-70],[-28,-68],[-38,-72],[-51,-69],[-55,-63],[-48,-53],[-36,-51],[-24,-47],[-10,-50],[0,-55],[7,-65]],
  [[71,-25],[65,-40],[60,-45],[58,-35],[61,-25],[67,-20]],
  [[71,-10],[64,-4],[59,8],[55,17],[51,25],[46,34],[42,29],[36,28],[32,35],[28,34],[22,39],[12,43],[5,48],[-5,42],[-12,40],[-19,35],[-28,33],[-35,27],[-34,18],[-29,16],[-18,12],[-5,10],[5,2],[12,-5],[20,-12],[29,-10],[36,-9],[44,-7],[50,-5],[56,-8],[62,-7],[68,-13]],
  [[72,30],[70,55],[67,80],[70,105],[66,125],[58,145],[52,155],[46,145],[42,134],[36,129],[31,122],[24,119],[18,111],[11,108],[6,102],[10,96],[20,92],[23,83],[28,78],[34,71],[38,60],[45,52],[48,42],[55,35],[62,30]],
  [[-11,113],[-17,120],[-24,114],[-32,116],[-39,132],[-37,148],[-29,153],[-20,150],[-14,142],[-11,128]],
] as const;

const useTrack = (frame: number, keys: {f: number; p: [number,number,number]; t: [number,number,number]}[]) => {
  let i = 0;
  while (i < keys.length - 2 && frame > keys[i + 1].f) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const q = interpolate(frame, [a.f, b.f], [0, 1], eased);
  const position = a.p.map((v, j) => v + (b.p[j] - v) * q) as [number,number,number];
  const target = a.t.map((v, j) => v + (b.t[j] - v) * q) as [number,number,number];
  // Hard limits keep every dolly and aim point inside the calibrated camera envelope.
  return {
    position: [Math.max(-3,Math.min(3,position[0])), Math.max(-1,Math.min(5,position[1])), Math.max(5.3,Math.min(21,position[2]))] as [number,number,number],
    target: [Math.max(-2,Math.min(2,target[0])), Math.max(-2,Math.min(2,target[1])), Math.max(-0.5,Math.min(4.6,target[2]))] as [number,number,number],
  };
};

const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const {camera} = useThree();
  const keys = useMemo(() => [
    {f:0, p:[0,0,18] as [number,number,number], t:[0,0,0] as [number,number,number]},
    {f:60, p:[0,2.15,5.45] as [number,number,number], t:[0,0,4.1] as [number,number,number]},
    {f:120, p:[0,3.4,9] as [number,number,number], t:[0,0,4.1] as [number,number,number]},
    {f:180, p:[0,2.1,9] as [number,number,number], t:[0,0,4.1] as [number,number,number]},
    {f:450, p:[1.8,2.1,9] as [number,number,number], t:[0.6,0,4.1] as [number,number,number]},
    {f:540, p:[1.8,2.1,9] as [number,number,number], t:[0.6,0,4.1] as [number,number,number]},
    {f:690, p:[0,0,18] as [number,number,number], t:[0,0,0] as [number,number,number]},
    {f:900, p:[0,0,18] as [number,number,number], t:[0,0,0] as [number,number,number]},
  ], []);
  const track = useTrack(frame, keys);
  useFrame(() => {
    const cam = camera as PerspectiveCamera;
    cam.position.set(...track.position);
    cam.up.set(0,1,0);
    cam.lookAt(...track.target);
    // Fixed 43° lens: zoom is exclusively a clamped Z-axis dolly, never FOV warping.
  });
  return null;
};

const Globe: React.FC<{frame: number}> = ({frame}) => {
  const geometry = useMemo(makeGlobeGrid, []);
  const landGeometry = useMemo(() => LAND.map((land) => makeLandGeometry(land)), []);
  const industrialFold = easeBetween(frame, 390, 450);
  const digitalGrow = springAt(frame, FPS, 450);
  const phoneFold = easeBetween(frame, 690, 735);
  const scale = frame < 390
    ? 1
    : frame < 450
      ? 1 - industrialFold * 0.95
      : frame < 690
        ? Math.min(1, digitalGrow)
        : Math.max(0.07, 1 - phoneFold * 0.8);
  const rotationY = remap(frame, 450, 690, 0, 0.28);
  const routeStart = 558;
  return <group scale={scale} rotation={[0, rotationY, 0]}>
    <mesh>
      <sphereGeometry args={[EARTH_R, 64, 48]}/>
      <meshStandardMaterial color="#102b36" roughness={0.72} metalness={0.28} transparent opacity={0.42} side={2}/>
    </mesh>
    <mesh scale={1.002}>
      <sphereGeometry args={[EARTH_R, 48, 32]}/>
      <meshBasicMaterial color={C.cyan} wireframe transparent opacity={0.25} depthWrite={false}/>
    </mesh>
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#57cedf" transparent opacity={0.36} depthWrite={false}/>
    </lineSegments>
    {landGeometry.map((geo, i) => <mesh key={i} geometry={geo}>
      <meshStandardMaterial color={i % 2 ? '#547f72' : '#547d79'} roughness={0.86} metalness={0.04} transparent opacity={0.8} side={2}/>
    </mesh>)}
    <mesh position={FINLAND.toArray()}>
      <sphereGeometry args={[0.095 + 0.025 * Math.sin(frame / 4), 16, 16]}/>
      <meshBasicMaterial color={C.amber}/>
    </mesh>
    <mesh position={FINLAND.toArray()} scale={1 + (frame % 24) / 12}>
      <torusGeometry args={[0.2, 0.012, 8, 48]}/>
      <meshBasicMaterial color={C.amber} transparent opacity={0.6 - (frame % 24) / 60}/>
    </mesh>
    <pointLight position={FINLAND.toArray()} color={C.amber} intensity={4.5} distance={3.5}/>
    {frame < 160 && <Html position={FINLAND.clone().add(new Vector3(0.55,0.6,0.22)).toArray()} transform distanceFactor={8} center zIndexRange={[20,0]}>
      <div style={{width:218, padding:'15px 18px', color:C.ice, background:'rgba(9,18,29,.78)', border:'1px solid rgba(255,195,111,.8)', borderRadius:12, backdropFilter:'blur(15px)', boxShadow:'0 0 28px rgba(255,178,83,.28)', filter:'drop-shadow(0 0 16px rgba(255,195,111,.32))', fontFamily:'Arial,sans-serif'}}>
        <div style={{fontSize:10, letterSpacing:2.5, color:C.amber}}>NORTHERN EUROPE · 1865</div><div style={{font:'23px Georgia,serif', marginTop:7}}>Finland</div><div style={{fontSize:11, color:'#a8bdc2', marginTop:5}}>Nokia River basin · 61°N</div>
      </div>
    </Html>}
    {frame >= routeStart && frame < 760 && <GlobalRoutes frame={frame}/> }
  </group>;
};

const GlobalRoutes: React.FC<{frame:number}> = ({frame}) => {
  const points = useMemo(() => CITY_DATA.map((city) => {
    const end = geoPoint(city.lat, city.lon, EARTH_R + 0.11);
    const start = FINLAND.clone();
    const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(EARTH_R + 1.45);
    const curve = new CatmullRomCurve3([start, mid, end]);
    return {city, end, curve, geometry: curveTube(curve, 64, 0.018)};
  }), []);
  return <group>
    {points.map(({city, end, curve, geometry}) => {
      const startFrame = 558 + city.delay;
      const draw = springAt(frame, FPS, startFrame);
      const travel = Math.max(0, Math.min(1, (frame - startFrame) / 42));
      const packet = curve.getPointAt(travel);
      return <group key={city.name}>
        <mesh geometry={geometry}>
          <meshBasicMaterial color={city.name === 'LONDON' ? C.amber : C.cyan} transparent opacity={0.64 * draw} depthWrite={false}/>
        </mesh>
        <mesh position={packet.toArray()}>
          <sphereGeometry args={[0.075, 12, 12]}/><meshBasicMaterial color={C.ice}/>
        </mesh>
        <mesh position={end.toArray()}>
          <sphereGeometry args={[0.08 + 0.025 * Math.sin(frame / 4), 12, 12]}/><meshBasicMaterial color={C.amber}/>
        </mesh>
        <pointLight position={end.toArray()} color={C.cyan} intensity={2 * draw} distance={2}/>
        <Html position={end.clone().add(new Vector3(0,0.22,0)).toArray()} transform distanceFactor={8} center zIndexRange={[30,0]}>
          <div style={{opacity:draw, transform:`scale(${0.82+0.18*draw})`, color:C.ice, font:'600 11px Arial,sans-serif', letterSpacing:2.2, textShadow:'0 0 10px #70e9f2', whiteSpace:'nowrap', filter:'drop-shadow(0 0 8px rgba(89,221,236,.45))'}}>{city.name}</div>
        </Html>
      </group>;
    })}
    <Html position={FINLAND.clone().add(new Vector3(0,0.48,0)).toArray()} transform distanceFactor={8} center zIndexRange={[30,0]}>
      <div style={{color:C.amber,font:'600 11px Arial,sans-serif',letterSpacing:2.2,textShadow:'0 0 12px #ffc36f',whiteSpace:'nowrap'}}>FINLAND · SIGNAL ORIGIN</div>
    </Html>
  </group>;
};

function curveTube(curve: CatmullRomCurve3, segments: number, radius: number) {
  // Build a thin, volumetric signal path (not a flat SVG route).
  return new TubeGeometry(curve, segments, radius, 8, false);
}

const Fir: React.FC<{x:number;y:number;z:number;s:number;frame:number}> = ({x,y,z,s,frame}) => {
  const sway = Math.sin(frame / 16 + x * 2 + z) * 0.028;
  return <group position={[x,y,z]} scale={s} rotation={[0,0,sway]}>
    <mesh position={[0,0.42,0]} castShadow><cylinderGeometry args={[0.055,0.085,0.9,7]}/><meshStandardMaterial color="#493a2c" roughness={0.95}/></mesh>
    {[0,1,2].map((tier) => <group key={tier} position={[0,0.56+tier*0.37,0]}>
      <mesh castShadow><coneGeometry args={[0.42-tier*0.075,0.9-tier*0.12,8]}/><meshStandardMaterial color={tier===2?'#28584b':'#17483d'} roughness={0.85}/></mesh>
      <mesh position={[0,0.08,0]}><coneGeometry args={[0.26-tier*0.035,0.48,8]}/><meshStandardMaterial color={C.snow} roughness={0.8}/></mesh>
    </group>)}
  </group>;
};

const Snowfall: React.FC<{frame:number}> = ({frame}) => <group>
  {Array.from({length:34},(_,i)=>{
    const x=((i*1.73)%8)-4;
    const y=((i*2.39+frame*0.025)%5.5)-2.7;
    const z=((i*0.87)%3)-1.5;
    const s=0.018+(i%4)*0.006;
    return <mesh key={i} position={[x+Math.sin(frame/19+i)*0.08,y,z]}>
      <sphereGeometry args={[s,6,6]}/><meshBasicMaterial color="#d9f3f3" transparent opacity={0.34+(i%3)*0.18}/>
    </mesh>;
  })}
</group>;

const MillDiorama: React.FC<{frame:number}> = ({frame}) => {
  const {fps}=useVideoConfig();
  const reveal=springAt(frame,fps,44);
  const dissolve=easeBetween(frame,180,210);
  const size=reveal*(1-dissolve*0.98);
  const paperBuild=springAt(frame,fps,130);
  const fiberCurves=useMemo(()=>[
    curveTube(new CatmullRomCurve3([new Vector3(-0.38,-0.27,0),new Vector3(-0.14,0.16,0.02),new Vector3(0.1,-0.13,0.04),new Vector3(0.38,0.3,0.06)]),24,0.012),
    curveTube(new CatmullRomCurve3([new Vector3(-0.34,0.3,0.01),new Vector3(-0.08,-0.18,0.03),new Vector3(0.23,0.14,0.05)]),20,0.009),
  ],[]);
  return <group position={[0,0,4.08]} scale={size}>
    <mesh position={[0,-1.1,0]} receiveShadow><boxGeometry args={[8.4,0.34,4.6]}/><meshStandardMaterial color="#dce9e6" roughness={0.95}/></mesh>
    <mesh position={[0,-1.28,-0.08]}><boxGeometry args={[8.55,0.26,4.74]}/><meshStandardMaterial color="#263943" metalness={0.32} roughness={0.5}/></mesh>
    <mesh position={[0,-0.91,0.22]}><boxGeometry args={[7.95,0.08,4.18]}/><meshStandardMaterial color="#48665c" roughness={1}/></mesh>
    {Array.from({length:21},(_,i)=><Fir key={i} x={-3.5+(i*1.67)%7.2} y={-0.9+((i*2.31)%3.4)} z={-1.35+((i*1.19)%1.2)} s={0.55+(i%4)*0.12} frame={frame}/>)}
    <Snowfall frame={frame}/>
    <group position={[0.05,-0.04,0.62]}>
      {/* Deep timber frame, dark red-brown cladding, and a gabled roof in layered 3D. */}
      <mesh position={[0,-0.26,0]} castShadow receiveShadow><boxGeometry args={[2.9,1.72,1.7]}/><meshStandardMaterial color="#51372b" roughness={0.8}/></mesh>
      <mesh position={[0,-0.22,0.88]}><boxGeometry args={[2.48,1.24,0.05]}/><meshStandardMaterial color="#8a5638" roughness={0.74}/></mesh>
      <mesh position={[0,0.7,0]} rotation={[0,0,0.48]} castShadow><boxGeometry args={[1.9,0.14,2.15]}/><meshStandardMaterial color="#283b42" metalness={0.25} roughness={0.46}/></mesh>
      <mesh position={[0,0.7,0]} rotation={[0,0,-0.48]} castShadow><boxGeometry args={[1.9,0.14,2.15]}/><meshStandardMaterial color="#314a50" metalness={0.25} roughness={0.46}/></mesh>
      {[0,1,2,3].map((i)=><mesh key={i} position={[-0.85+i*0.56,-0.1,0.92]}><boxGeometry args={[0.19,0.42,0.035]}/><meshStandardMaterial color="#f6c982" emissive="#f6a34d" emissiveIntensity={1.2+0.35*Math.sin(frame/8+i)}/></mesh>)}
      <mesh position={[0,-0.88,0.95]}><boxGeometry args={[3.3,0.13,2.25]}/><meshStandardMaterial color="#222d31" metalness={0.45} roughness={0.42}/></mesh>
      {/* Pulp vats and a water flume make the timber-to-paper process visible. */}
      {[-1.65,1.65].map((x)=><mesh key={x} position={[x,-0.57,1.15]}><cylinderGeometry args={[0.42,0.42,0.55,24]}/><meshStandardMaterial color="#276377" metalness={0.42} roughness={0.34}/></mesh>)}
      <mesh position={[1.2,-0.36,1.4]} rotation={[0.09,0,0]}><boxGeometry args={[0.46,0.05,1.7]}/><meshStandardMaterial color="#67dfec" emissive="#38c9da" emissiveIntensity={1.7}/></mesh>
      {[-2,-1.65,-1.3].map((x)=><mesh key={x} position={[x,-1.02,1.3]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[0.13,0.13,1.25,12]}/><meshStandardMaterial color="#9a6a42" roughness={0.92}/></mesh>)}
      <pointLight position={[0,0,2.4]} color={C.amber} intensity={4} distance={5}/>
    </group>
    <group position={[-2.6,-0.88,1.35]}>
      {[0,1,2,3].map((i)=><mesh key={i} position={[0.22*i,0.09*i,0]} rotation={[0,0,-0.16]}><boxGeometry args={[1.4,0.16,0.2]}/><meshStandardMaterial color={i%2?'#936445':'#b07a4a'} roughness={0.86}/></mesh>)}
    </group>
    <mesh position={[0,-1.06,2.18]}><boxGeometry args={[8.5,0.018,0.018]}/><meshBasicMaterial color={C.cyan}/></mesh>
    {/* Fibre blueprint is a spring-built 3D stack of translucent material sheets and volumetric fibre paths. */}
    <group position={[1.55,0.12,1.45]} scale={paperBuild} rotation={[0.03,-0.12,0.025]}>
      <RoundedBox args={[1.12,1.48,0.14]} radius={0.08} smoothness={4}>
        <meshStandardMaterial color="#102b36" metalness={0.5} roughness={0.28} emissive="#0d5360" emissiveIntensity={0.35}/>
      </RoundedBox>
      {[-0.045,0.015,0.075].map((z,i)=><RoundedBox key={z} args={[0.88,1.2,0.025]} radius={0.035} smoothness={3} position={[0,0,z+0.09]}>
        <meshPhysicalMaterial color={i===1?'#92dce1':'#c4e9e6'} roughness={0.25} metalness={0.12} transparent opacity={0.28}/>
      </RoundedBox>)}
      {fiberCurves.map((geometry,i)=><mesh key={i} geometry={geometry} position={[0,0,0.24]}>
        <meshBasicMaterial color={i?C.amber:C.cyan} transparent opacity={0.92}/>
      </mesh>)}
      {[-0.35,0,0.35].map((x,i)=><mesh key={i} position={[x,-0.48,0.28]}>
        <sphereGeometry args={[0.035,8,8]}/><meshBasicMaterial color={i===1?C.amber:C.ice}/>
      </mesh>)}
    </group>
    <Html position={[2.65,1.15,1.2]} transform distanceFactor={8} center zIndexRange={[40,0]}>
      <div style={{width:245,padding:'17px 19px',color:C.ice,background:'rgba(8,17,27,.78)',border:'1px solid rgba(112,233,242,.68)',borderRadius:13,backdropFilter:'blur(18px)',boxShadow:'0 0 34px rgba(60,211,229,.18)',filter:'drop-shadow(0 0 18px rgba(79,221,238,.35))',fontFamily:'Arial,sans-serif',transform:`scale(${0.78+0.22*paperBuild})`,transformOrigin:'left center'}}>
        <div style={{fontSize:10,letterSpacing:2.6,color:C.cyan}}>MATERIAL / 01 · NOKIA, FINLAND</div><div style={{font:'25px Georgia,serif',marginTop:7}}>Paper</div><div style={{fontSize:11,color:'#a8bdc2',marginTop:7}}>Cellulose · water · wood pulp</div>
      </div>
    </Html>
  </group>;
};

const GridStage: React.FC<{frame:number}> = ({frame}) => {
  const {fps}=useVideoConfig();
  const entry=springAt(frame,fps,180);
  const exit=easeBetween(frame,450,480);
  const scale=entry*(1-exit*0.94);
  const drift=Math.sin(frame/28)*0.08;
  const boot=springAt(frame,fps,240);
  const cable=springAt(frame,fps,300);
  const electricity=springAt(frame,fps,345);
  const cableCurve=useMemo(()=>new CatmullRomCurve3([
    new Vector3(-4.2,-0.95,0.45),new Vector3(-2.2,0.05,0.7),new Vector3(0.1,-0.35,0.55),new Vector3(2.2,0.65,0.6),new Vector3(4.15,-0.15,0.35),
  ]),[]);
  const tube=useMemo(()=>curveTube(cableCurve,96,0.028),[cableCurve]);
  const packetT=((Math.max(0,frame-300)*0.018)%1);
  const packet=cableCurve.getPointAt(packetT);
  const graph=springAt(frame,fps,390);
  const graphLine=useMemo(()=>curveTube(new CatmullRomCurve3([new Vector3(-0.8,-0.72,0),new Vector3(-0.45,-0.52,0.04),new Vector3(-0.12,-0.31,0.08),new Vector3(0.2,-0.12,0.12),new Vector3(0.55,0.22,0.16),new Vector3(0.9,0.62,0.2)]),42,0.024),[]);
  const cage=useMemo(makeIndustrialCage,[]);
  return <group scale={scale} position={[0,0,4.05]}>
    <lineSegments geometry={cage}>
      <lineBasicMaterial color="#287583" transparent opacity={0.34*scale} depthWrite={false}/>
    </lineSegments>
    <group position={[0,0,drift]}>
      <mesh geometry={tube}>
        <meshBasicMaterial color={C.copper} transparent opacity={0.95*cable} depthWrite={false}/>
      </mesh>
      <mesh position={packet.toArray()} scale={cable}>
        <sphereGeometry args={[0.09,16,16]}/><meshBasicMaterial color={C.ice}/>
      </mesh>
      <mesh position={packet.toArray()} scale={cable}>
        <sphereGeometry args={[0.2,12,12]}/><meshBasicMaterial color={C.cyan} transparent opacity={0.2*cable}/>
      </mesh>
      {/* Editorially shaded rubber boot, lifting cleanly off the drafting grid at 00:08. */}
      <group position={[-2.35,-0.27,0.55]} scale={[boot,boot,boot]} rotation={[0.08,-0.08,-0.12]}>
        <RoundedBox args={[1.36,0.42,0.62]} radius={0.12} smoothness={4} position={[0.24,-0.45,0]} castShadow><meshStandardMaterial color="#182b35" roughness={0.32} metalness={0.38} emissive="#1e6773" emissiveIntensity={0.28}/></RoundedBox>
        <RoundedBox args={[0.55,1.37,0.58]} radius={0.13} smoothness={4} position={[-0.23,0.13,0]} castShadow><meshStandardMaterial color="#25464c" roughness={0.28} metalness={0.33} emissive="#1e7581" emissiveIntensity={0.24}/></RoundedBox>
        <mesh position={[0,-1.15,0]}><boxGeometry args={[1.9,0.05,0.86]}/><meshStandardMaterial color="#de9c57" emissive="#dd8b48" emissiveIntensity={0.55}/></mesh>
        <pointLight position={[0.1,0.2,0.72]} color={C.cyan} intensity={2.2*boot} distance={2.8}/>
      </group>
      {/* Three-dimensional, coaxial copper conductors with moving packets. */}
      <pointLight position={[0,0.1,4.1]} color={C.cyan} intensity={2.2*cable} distance={8}/>
      {/* Electricity transformer tower: steel lattice rises on the narrated power beat. */}
      <group position={[2.75,-0.18,0.3]} scale={electricity}>
        <mesh position={[0,0.84,0]}><boxGeometry args={[0.23,1.72,0.23]}/><meshStandardMaterial color="#43545a" metalness={0.72} roughness={0.31}/></mesh>
        {[-0.48,0.48].map((x)=><mesh key={x} position={[x,0.87,0]} rotation={[0,0,x>0?-0.18:0.18]}><boxGeometry args={[0.12,1.9,0.12]}/><meshStandardMaterial color="#62777a" metalness={0.67}/></mesh>)}
        {[0.48,1.02,1.5].map((y)=><mesh key={y} position={[0,y,0]}><boxGeometry args={[1.45,0.1,0.14]}/><meshStandardMaterial color="#93a9a6" metalness={0.72}/></mesh>)}
        {[-0.7,-0.35,0,0.35,0.7].map((x)=><mesh key={x} position={[x,1.6,0]}><sphereGeometry args={[0.075,8,8]}/><meshBasicMaterial color={C.cyan}/></mesh>)}
        <mesh position={[0,1.93,0]}><sphereGeometry args={[0.17+0.045*Math.sin(frame/3),12,12]}/><meshBasicMaterial color={C.amber}/></mesh>
        <pointLight position={[0,1.8,0.3]} color={C.cyan} intensity={3.8*electricity} distance={4}/>
      </group>
    </group>
    {/* Output data is a volumetric curve with rising 3D columns, springing on at 00:13. */}
    <group position={[0.45,-0.06,1.55]}>
      <mesh position={[0,-0.76,0]}><boxGeometry args={[2.05,0.028,0.032]}/><meshBasicMaterial color="#4e7580"/></mesh>
      <mesh geometry={graphLine} scale={[graph,1,1]}><meshBasicMaterial color={C.cyan} transparent opacity={0.94} toneMapped={false}/></mesh>
      {[0,1,2,3,4].map((i)=>{
        const s=springAt(frame,fps,390+i*3);
        const height=(0.18+i*0.13)*s;
        return <mesh key={i} position={[-0.72+i*0.34,-0.72+height/2,0.06]} scale={[1,s,1]}>
          <cylinderGeometry args={[0.045,0.055,0.24,8]}/><meshStandardMaterial color={i<3?'#397681':C.cyan} emissive={i===4?C.cyan:'#1a5260'} emissiveIntensity={0.6}/>
        </mesh>;
      })}
      <pointLight position={[0.65,0.35,0.35]} color={C.cyan} intensity={2.5*graph} distance={3}/>
    </group>
    <Html position={[3.45,1.5,1.6]} transform distanceFactor={8} center zIndexRange={[40,0]}>
      <div style={{width:278,padding:'15px 18px',color:C.ice,background:'rgba(7,16,27,.8)',border:'1px solid rgba(112,233,242,.62)',borderRadius:13,backdropFilter:'blur(17px)',boxShadow:'0 0 28px rgba(72,214,233,.2)',filter:'drop-shadow(0 0 18px rgba(79,221,238,.32))',fontFamily:'Arial,sans-serif',transform:`scale(${0.82+0.18*graph})`,transformOrigin:'left center'}}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:9,letterSpacing:2,color:C.cyan}}><span>FINLAND · INDUSTRIAL OUTPUT</span><span>1920s</span></div>
        <div style={{font:'22px Georgia,serif',marginTop:7}}>Powering a modern nation</div>
        <div style={{fontSize:10,letterSpacing:1.8,color:'#8fb2b9',marginTop:10}}>ELECTRICITY · NETWORK · INDUSTRY</div>
      </div>
    </Html>
  </group>;
};

const Phone: React.FC<{frame:number}> = ({frame}) => {
  const {fps}=useVideoConfig();
  const bloom=springAt(frame,fps,690);
  const breathe=Math.sin(frame/9)*0.035;
  const sweep=(frame*6)%360;
  const radarRay=useMemo(()=>curveTube(new CatmullRomCurve3([new Vector3(0,0,0),new Vector3(0.34,0.32,0),new Vector3(0.5,0.73,0)]),18,0.012),[]);
  const scale=bloom;
  return <group position={[0,-0.05,0.3]} scale={scale} rotation={[0.02*Math.sin(frame/19),0.12*Math.sin(frame/23),0]}>
    <RoundedBox args={[2.62,5.25,0.34]} radius={0.27} smoothness={8} castShadow>
      <meshStandardMaterial color="#101923" metalness={0.92} roughness={0.2} emissive="#163d49" emissiveIntensity={0.22+breathe}/>
    </RoundedBox>
    <RoundedBox args={[2.42,5.02,0.12]} radius={0.23} smoothness={8} position={[0,0,0.2]}>
      <meshStandardMaterial color="#08121c" metalness={0.45} roughness={0.29}/>
    </RoundedBox>
    <RoundedBox args={[2.22,4.76,0.055]} radius={0.16} smoothness={6} position={[0,0,0.29]}>
      <meshStandardMaterial color="#0d202b" metalness={0.25} roughness={0.42} emissive="#082d39" emissiveIntensity={0.56}/>
    </RoundedBox>
    {[0.91,0.68,0.47,0.26].map((r)=><mesh key={r} position={[0,0.07,0.34]}>
      <torusGeometry args={[r,0.013,8,72]}/><meshBasicMaterial color={r<0.3?C.amber:C.cyan} transparent opacity={0.48}/>
    </mesh>)}
    <group position={[0,0.07,0.36]} rotation={[0,0,-sweep*Math.PI/180]}>
      <mesh geometry={radarRay}><meshBasicMaterial color={C.cyan} transparent opacity={0.95}/></mesh>
      <mesh position={[0.5,0.73,0]}><sphereGeometry args={[0.035,10,10]}/><meshBasicMaterial color={C.ice}/></mesh>
    </group>
    {[0,1,2,3,4,5].map((i)=><mesh key={i} position={[-0.74+i*0.29,-1.57,0.32]}>
      <boxGeometry args={[0.16,0.018,0.012]}/><meshBasicMaterial color={i<Math.floor(((frame-690)/12)%6)?C.amber:C.cyan} transparent opacity={0.7}/>
    </mesh>)}
    <mesh position={[0,2.31,0.19]}><boxGeometry args={[0.42,0.025,0.018]}/><meshBasicMaterial color="#91a9ad"/></mesh>
    <pointLight position={[0,0,1.15]} color={C.cyan} intensity={4.5+breathe*14} distance={5}/>
    <Html position={[1.83,1.44,0.28]} transform distanceFactor={8} center zIndexRange={[50,0]}>
      <div style={{width:235,padding:'15px 17px',color:C.ice,background:'rgba(8,17,28,.8)',border:'1px solid rgba(112,233,242,.74)',borderRadius:13,backdropFilter:'blur(18px)',filter:'drop-shadow(0 0 20px rgba(79,221,238,.42))',boxShadow:'0 0 30px rgba(55,204,222,.22)',fontFamily:'Arial,sans-serif',transform:`scale(${0.94+0.06*bloom})`,transformOrigin:'left center'}}>
        <div style={{fontSize:9,letterSpacing:2.5,color:C.cyan}}>A SIGNAL WITHOUT BORDERS</div><div style={{font:'23px Georgia,serif',marginTop:7}}>Billions connected</div><div style={{fontSize:11,color:'#9fb7be',marginTop:7,lineHeight:1.6}}>A pocket-sized gateway. A world redrawn.</div>
      </div>
    </Html>
  </group>;
};

const Billboard: React.FC<{offset:[number,number,number]; children:React.ReactNode; scale?:number}> = ({offset,children,scale=1}) => {
  const ref=useRef<Group>(null);
  useFrame(({camera})=>{
    if(!ref.current) return;
    const local=new Vector3(...offset).applyQuaternion(camera.quaternion);
    ref.current.position.copy(camera.position).add(local);
    ref.current.quaternion.copy(camera.quaternion);
  });
  return <group ref={ref} scale={scale}><Html transform distanceFactor={9} center zIndexRange={[100,0]}>{children}</Html></group>;
};

const captionForFrame=(frame:number) => {
  const cues=[
    [0,51,'In 1865, deep in the frozen forests of Finland,'],
    [51,92,'a quiet timber mill was born.'],
    [92,180,'No one knew it yet... but this small paper company would change history.'],
    [180,240,'Decades before cell phones, Nokia evolved into an industrial powerhouse—'],
    [240,300,'manufacturing rubber boots,'],
    [300,365,'cables, and electricity'],
    [365,450,'for a rapidly modernizing nation.'],
    [450,558,'When the digital age arrived, Nokia pivoted once more—'],
    [558,684,'connecting billions of people'],
    [684,900,'and redefining what a mobile phone could be.'],
  ] as const;
  const cue=cues.find(([from,to])=>frame>=from&&frame<to)??cues[cues.length-1];
  return {text:cue[2], start:cue[0]};
};

const SceneWorld: React.FC<{frame:number}> = ({frame}) => {
  const {fps}=useVideoConfig();
  const cityStart=springAt(frame,fps,450);
  const titleScale=springAt(frame,fps,0)*(1-easeBetween(frame,78,102));
  const cue=captionForFrame(frame);
  const captionScale=springAt(frame,fps,cue.start);
  const globeRotation=remap(frame,450,690,0,0.24);
  return <>
    <fog attach="fog" args={[C.obsidian,18,42]}/>
    <ambientLight intensity={0.38}/>
    <directionalLight position={[-5,8,10]} intensity={2.25} color="#c7f0ee" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
    <pointLight position={[0,0,10]} intensity={2.4} color="#2b9cae" distance={22}/>
    <pointLight position={[-6,1,7]} intensity={1.7} color={C.amber} distance={18}/>
    <CameraRig/>
    <group scale={springAt(frame,fps,0)}>
      <group rotation={[0,globeRotation,0]}><Globe frame={frame}/></group>
    </group>
    <MillDiorama frame={frame}/>
    <GridStage frame={frame}/>
    <Phone frame={frame}/>
    {frame>=450&&frame<690&&<Html position={FINLAND.clone().multiplyScalar(1.35).toArray()} transform distanceFactor={8} center zIndexRange={[40,0]}>
      <div style={{padding:'11px 14px',color:C.ice,background:'rgba(8,17,27,.72)',border:'1px solid rgba(112,233,242,.52)',borderRadius:10,backdropFilter:'blur(15px)',filter:'drop-shadow(0 0 14px rgba(79,221,238,.32))',font:'600 11px Arial,sans-serif',letterSpacing:2.2,whiteSpace:'nowrap',transform:`scale(${0.9+0.1*cityStart})`}}>FINLAND · CONNECTING THE WORLD</div>
    </Html>}
    {frame<103&&<Billboard offset={[-4.8,2.55,-10]} scale={titleScale}>
      <div style={{width:620,color:C.ice,fontFamily:'Arial,sans-serif',filter:'drop-shadow(0 0 18px rgba(59,197,219,.27))'}}>
        <div style={{fontSize:10,letterSpacing:3.5,color:C.cyan}}>A THREE-DIMENSIONAL DOCUMENTARY</div>
        <div style={{font:'500 41px/1.08 Georgia,serif',marginTop:10}}>The Empire of<br/><span style={{color:C.amber}}>Timber &amp; Tech</span></div>
        <div style={{fontSize:13,letterSpacing:1.1,color:'#a9bcc3',marginTop:10}}>HOW NOKIA CONQUERED (AND LOST) THE WORLD</div>
      </div>
    </Billboard>}
    <Billboard offset={[0,-3.65,-8.3]} scale={captionScale}>
      <div style={{width:980,padding:'14px 20px',color:C.ice,textAlign:'center',background:'rgba(7,14,24,.68)',border:'1px solid rgba(112,233,242,.31)',borderRadius:14,backdropFilter:'blur(17px)',boxShadow:'0 12px 42px rgba(0,0,0,.34)',filter:'drop-shadow(0 0 13px rgba(79,221,238,.22))',font:'500 22px Georgia,serif',letterSpacing:.15}}>
        {cue.text}
      </div>
    </Billboard>
    {frame>=558&&frame<690&&<Billboard offset={[3.55,2.45,-9]} scale={springAt(frame,fps,558)}>
      <div style={{width:290,padding:'16px 18px',color:C.ice,background:'rgba(7,15,25,.78)',border:'1px solid rgba(112,233,242,.72)',borderRadius:13,backdropFilter:'blur(18px)',filter:'drop-shadow(0 0 18px rgba(79,221,238,.36))',fontFamily:'Arial,sans-serif'}}>
        <div style={{fontSize:9,letterSpacing:2.8,color:C.cyan}}>GLOBAL REACH · 00:18.6</div><div style={{font:'24px Georgia,serif',marginTop:8}}>Billions connected</div><div style={{fontSize:11,color:'#a3bac1',marginTop:7}}>Nokia, Finland → London · New York · Tokyo</div>
      </div>
    </Billboard>}
  </>;
};

export const NokiaDocumentary: React.FC = () => (
  <AbsoluteFill style={{background:C.obsidian,overflow:'hidden'}}>
    <ThreeCanvas width={W} height={H} dpr={1.2} camera={{position:[0,0,18],fov:43,near:0.05,far:120}} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} shadows style={{filter:'drop-shadow(0 0 14px rgba(65,205,225,.18)) saturate(1.12) contrast(1.04)'}}>
      <SceneWorld frame={useCurrentFrame()}/>
    </ThreeCanvas>
    <AbsoluteFill style={{pointerEvents:'none',backdropFilter:'blur(1.4px)',WebkitBackdropFilter:'blur(1.4px)',maskImage:'radial-gradient(ellipse 67% 68% at 50% 45%, transparent 43%, rgba(0,0,0,.28) 72%, #000 100%)',background:'radial-gradient(ellipse 68% 70% at 50% 45%, transparent 38%, rgba(6,10,17,.2) 72%, rgba(4,7,13,.78) 100%)',boxShadow:'inset 0 0 210px 18px rgba(0,0,0,.82)'}}/>
    <Sequence from={0} durationInFrames={180}><Audio src={staticFile('audio/scene-1.mp3')} volume={1} playbackRate={0.92}/></Sequence>
    <Sequence from={180} durationInFrames={270}><Audio src={staticFile('audio/scene-2.mp3')} volume={1} playbackRate={0.68}/></Sequence>
    <Sequence from={450} durationInFrames={450}><Audio src={staticFile('audio/scene-3.mp3')} volume={1} playbackRate={0.56}/></Sequence>
  </AbsoluteFill>
);
