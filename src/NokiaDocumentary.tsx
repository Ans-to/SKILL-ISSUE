import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

const C = {bg: '#0b0f19', cyan: '#69e4f5', gold: '#e7b66e', ivory: '#f2eee7', muted: '#9aa9b7', green: '#7dc8a3'};
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const smooth = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
const springIn = (frame: number, fps: number, delay = 0) => spring({frame: frame - delay, fps, config: {damping: 12, stiffness: 100}});

const Glass: React.FC<React.PropsWithChildren<{style?: React.CSSProperties}>> = ({children, style}) => (
  <div style={{background: 'linear-gradient(130deg, rgba(20,31,46,.84), rgba(8,14,24,.66))', border: '1px solid rgba(139,220,237,.32)', boxShadow: '0 22px 70px rgba(0,0,0,.42), inset 0 1px rgba(255,255,255,.09)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: 18, ...style}}>{children}</div>
);

const Grain: React.FC = () => <AbsoluteFill style={{pointerEvents: 'none', opacity: .13, mixBlendMode: 'screen', backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 180 180\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'.16\'/%3E%3C/svg%3E")'}} />;

const Caption: React.FC<{frame: number; fps: number; start: number; end: number; children: React.ReactNode}> = ({frame, fps, start, end, children}) => {
  const appear = springIn(frame, fps, start);
  const opacity = interpolate(frame, [start, start + 5, end - 3, end], [0, 1, 1, 0], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return <div style={{position: 'absolute', bottom: 88, left: 0, right: 0, textAlign: 'center', opacity, transform: `translateY(${(1 - appear) * 20}px)`, fontFamily: 'Georgia, serif', fontSize: 35, fontWeight: 500, color: C.ivory, textShadow: '0 3px 22px #000', letterSpacing: '.15px'}}>{children}</div>;
};

const Topline: React.FC<{frame: number; fps: number; label: string; index: string}> = ({frame, fps, label, index}) => {
  const s = springIn(frame, fps, 4);
  return <div style={{position: 'absolute', top: 55, left: 76, right: 76, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: Math.min(1, s), fontFamily: 'Arial, sans-serif', color: C.muted, fontSize: 14, letterSpacing: 3, textTransform: 'uppercase'}}><span><b style={{color: C.cyan, fontWeight: 600}}>NOKIA</b><span style={{margin: '0 13px', opacity: .4}}> / </span>{label}</span><span>{index} <span style={{color: '#516170'}}>—</span> 03</span></div>;
};

const WorldGlobe: React.FC<{frame: number}> = ({frame}) => {
  // Start wide, then drive directly along the Finland pin's Z-axis in the first two seconds.
  const zoom = interpolate(frame, [0, 36, 62, 105], [1, 1.04, 2.7, 5.4], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const diveZ = interpolate(frame, [0, 60, 108], [0, 80, 780], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const pinTrack = smooth(frame, 32, 92);
  // Keep the Finland coordinate pinned to screen center as the globe surface rushes past.
  const cameraX = pinTrack * (-40 - 400 * zoom);
  const cameraY = pinTrack * (410 - 196 * zoom);
  const spin = interpolate(frame, [0, 82], [-9, 0], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const glow = interpolate(frame, [0, 52, 90], [.3, .65, .95], clamp);
  const pinPulse = .5 + .5 * Math.sin(frame / 3.8);
  return <div style={{position: 'absolute', width: 660, height: 660, left: 1000, top: 130, borderRadius: '50%', transform: `perspective(1200px) translate3d(${cameraX}px,${cameraY}px,${diveZ}px) scale(${zoom}) rotate(${spin}deg)`, transformOrigin: '0 0', opacity: interpolate(frame, [58, 100, 130], [1, .75, 0], clamp), filter: `drop-shadow(0 0 ${35 * glow}px rgba(67,207,235,.27))`}}>
    <svg viewBox="0 0 600 600" width="100%" height="100%">
      <defs><radialGradient id="earth"><stop stopColor="#1b3946" stopOpacity=".28"/><stop offset=".78" stopColor="#0b1520" stopOpacity=".55"/><stop offset="1" stopColor="#112330" stopOpacity=".92"/></radialGradient><clipPath id="globeClip"><circle cx="300" cy="300" r="274"/></clipPath></defs>
      <circle cx="300" cy="300" r="276" fill="url(#earth)" stroke="#6ddff0" strokeOpacity=".65" strokeWidth="1.6"/>
      <g clipPath="url(#globeClip)" fill="none" stroke="#75d9e7" strokeOpacity=".31" strokeWidth="1">
        {[0,1,2,3,4].map(i=><ellipse key={'lat'+i} cx="300" cy="300" rx="274" ry={50+i*42} />)}
        {[0,1,2,3,4,5].map(i=><ellipse key={'lng'+i} cx="300" cy="300" rx={28+i*43} ry="274" />)}
        <path d="M68 190l46-30 34 8 23-24 36 7 14 29-32 19-8 34-44 8-10 31-34-8-29-47z M260 220l31-25 41 14 23 43-17 36 22 22-11 45-27 24-33-22-8-55-29-38z M391 165l31-23 47 15 42 43-16 33-47-6-18 34-39-23-8-40z" stroke="#8cbdb7" strokeOpacity=".5" strokeWidth="2"/>
      </g>
      <circle cx="364" cy="178" r="7" fill={C.gold}/><circle cx="364" cy="178" r={18 + pinPulse * 15} fill="none" stroke={C.gold} strokeOpacity={.7 - pinPulse * .35}/><circle cx="364" cy="178" r="28" fill="#e7b66e" fillOpacity=".08"/>
      <path d="M364 178 Q330 230 290 302" fill="none" stroke={C.gold} strokeDasharray="4 9" strokeOpacity=".78"/>
    </svg>
  </div>;
};

const ForestMill: React.FC<{frame: number}> = ({frame}) => {
  const reveal = smooth(frame, 44, 105);
  const trees = Array.from({length: 22}, (_, i) => ({x: 185 + (i * 83) % 760, y: 258 + (i * 47) % 402, s: .68 + (i % 5) * .12, d: i * 2.7}));
  const parallax = interpolate(frame, [38, 106], [160, 0], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const pulse = .74 + Math.sin(frame / 7) * .05;
  const paperBuild = springIn(frame,30,130);
  return <div style={{position: 'absolute', inset: 0, opacity: reveal, transform: `translateY(${parallax}px) scale(${interpolate(frame, [38, 106], [.88, 1.18], {...clamp, easing: Easing.inOut(Easing.cubic)})})`, transformOrigin: '52% 53%'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
      <defs><linearGradient id="ground" x2="0" y2="1"><stop stopColor="#233b39"/><stop offset="1" stopColor="#101b22"/></linearGradient><linearGradient id="millwall"><stop stopColor="#b97745"/><stop offset="1" stopColor="#4a3328"/></linearGradient><filter id="millglow"><feGaussianBlur stdDeviation="16"/></filter></defs>
      <path d="M0 590 Q250 500 440 588 T890 566 T1390 590 T1920 520V1080H0Z" fill="url(#ground)"/>
      <path d="M0 746 Q420 615 760 740 T1420 690 T1920 650" fill="none" stroke="#8cae9f" strokeOpacity=".14" strokeWidth="2"/>
      {trees.map((t,i)=><g key={i} transform={`translate(${t.x},${t.y}) scale(${t.s})`} opacity={.5+(i%4)*.1}><path d="M0 75v70" stroke="#403a2b" strokeWidth="11"/><path d="M0 -35l-50 86h30l-40 67h120L20 51h30z" fill={i%3===0?'#294a42':'#1c3734'} stroke="#719786" strokeOpacity=".2"/><path d="M0 -35l-17 30 16-5 16 6z M-22 3l-25 42 25-8 22 9z M23 52l-22-6-21 8" fill="none" stroke="#c7e0dd" strokeOpacity=".7" strokeWidth="5" strokeLinejoin="round"/></g>)}
      {/* Mill yard and sawmill: geometric, built environment rather than an icon */}
      <g transform="translate(824 474)">
        <ellipse cx="165" cy="270" rx="346" ry="72" fill="#6de6ef" opacity=".14" filter="url(#millglow)"/>
        <path d="M-128 188L157 62l303 119-287 140z" fill="#243842" stroke="#6a9c9d" strokeOpacity=".7" strokeWidth="2"/>
        <path d="M-128 188v125l301 130V321z" fill="#392e27" stroke="#bd9260" strokeOpacity=".55" strokeWidth="2"/>
        <path d="M173 321v122l287-140V181z" fill="#1c292d" stroke="#6a9c9d" strokeOpacity=".6" strokeWidth="2"/>
        <path d="M-103 189L157 79l266 105-250 111z" fill="url(#millwall)" stroke="#ddae72" strokeOpacity=".6" strokeWidth="2"/>
        <path d="M-46 162l101-43 103 44v84l-204-86z M213 194l85-37 67 27v81l-152 72z" fill="#17232c" stroke="#e4be83" strokeOpacity=".62" strokeWidth="2"/>
        <path d="M-32 174l80 33v48l-80-34z M232 207l47-20v52l-47 22z" fill="#efbd73" opacity={pulse}/>
        <path d="M-88 319l-23 38m47-28-22 38m263 60 18 20m207-184 38-18" stroke="#e4ba7c" strokeWidth="6" opacity=".75"/>
        <path d="M60 317l-2 111m-13-106v102m-14-108v101" stroke="#a86d42" strokeWidth="9"/>
        {/* water channel / paper pulp vats */}
        <path d="M312 339l93-42v30l-93 47z" fill="#2e6270" stroke="#6ae2ed" strokeOpacity=".7"/>
        <path d="M329 347l59-28" stroke="#9bf4f3" strokeWidth="3" opacity={pulse}/>
        <text x="-63" y="477" fill="#c8d7d0" fontSize="14" letterSpacing="4">NOKIA · 1865</text>
      </g>
      {/* Small stacks of timber make the industry legible */}
      {[0,1,2,3].map(i=><g key={i} transform={`translate(${500+i*85},810)`}><path d={`M0 ${i%2?6:0}l145-58 52 18-145 61z`} fill="#9c714a" stroke="#dec18c" strokeOpacity=".5"/><path d={`M52 24l145-58v14L52 38z`} fill="#593f2b"/></g>)}
      <circle cx="1324" cy="530" r="5" fill="#e8bf7f"/><path d="M1324 530h144v-86" fill="none" stroke="#e8bf7f" strokeOpacity=".55" strokeDasharray="3 7"/>
    </svg>
    <Glass style={{position: 'absolute', top: 315, right: 220, padding: '21px 27px', minWidth: 190, opacity: springIn(frame, 30, 130), transform: `translateY(${(1-springIn(frame,30,130))*26}px)`}}>
      <div style={{font: '11px Arial', letterSpacing: 2.5, color: C.cyan}}>MATERIAL / 01</div><div style={{font: '26px Georgia', color: C.ivory, marginTop: 8}}>Paper</div>
      <svg viewBox="0 0 186 45" width="186" height="45" style={{display:'block',marginTop:8}}><path d="M3 34L20 15l17 18 19-25 21 21 19-17 22 18 18-14 21 13 26-15" fill="none" stroke="#79e7ed" strokeWidth="1.4" strokeDasharray="220" strokeDashoffset={220*(1-Math.min(1,paperBuild))}/><path d="M3 39H182M21 7v34m37-27v27m42-20v20m42-25v25m38-33v33" stroke="#7ab5c0" strokeOpacity=".34" strokeWidth=".8"/><text x="5" y="10" fill="#9bb9c0" fontSize="6" letterSpacing="1.3">FIBRE / PULP SCHEMATIC</text></svg>
      <div style={{font: '12px Arial', color: C.muted, marginTop: 4}}>Pulp · water · timber</div>
    </Glass>
  </div>;
};

const GridScene: React.FC<{frame: number}> = ({frame}) => {
  const f = frame - 180;
  const opacity = interpolate(frame, [160, 190, 430, 470], [0, 1, 1, 0], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const panKick = springIn(f,30,0);
  const pan = interpolate(panKick,[0,1],[120,0],clamp) + interpolate(f, [0, 270], [0, -135], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const scale = interpolate(f, [0, 270], [.92, 1.1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const morphProgress = smooth(frame,450,470); // 00:15 — the industrial grid folds upward into the digital map
  const compressY = interpolate(morphProgress,[0,1],[1,.58]);
  const morphUp = interpolate(morphProgress,[0,1],[0,-150]);
  const boots = springIn(f,30, 60); // 00:08 — the narrated rubber-boots beat
  const cables = springIn(f,30, 120); // 00:10 — copper conductors ignite on “cables”
  const power = springIn(f,30, 165);
  const outputGraph = springIn(f,30,210);
  const glow = .75 + .25*Math.sin(f/5);
  const cablePacket=(t:number)=>{const u=1-t;return {x:u*u*u*890+3*u*u*t*1050+3*u*t*t*1050+t*t*t*1255,y:u*u*u*714+3*u*u*t*760+3*u*t*t*433+t*t*t*495};};
  return <AbsoluteFill style={{opacity, overflow: 'hidden', background: 'radial-gradient(ellipse at 47% 62%, #1b3139 0%, #0b0f19 70%)'}}>
    <div style={{position: 'absolute', inset: -200, transform: `translate(${pan}px, ${50+morphUp}px) scale(${scale},${compressY})`, transformOrigin: '50% 55%'}}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%">
        <defs><linearGradient id="copper" x2="1"><stop stopColor="#af714d"/><stop offset=".48" stopColor="#f2bd73"/><stop offset="1" stopColor="#55d9ee"/></linearGradient><filter id="lineGlow"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><radialGradient id="spot"><stop stopColor="#a1efeb" stopOpacity=".14"/><stop offset="1" stopColor="#a1efeb" stopOpacity="0"/></radialGradient></defs>
        <ellipse cx="970" cy="560" rx="650" ry="420" fill="url(#spot)"/>
        <g stroke="#76cad5" strokeOpacity=".12" strokeWidth="1">{Array.from({length: 19},(_,i)=><path key={'v'+i} d={`M${-200+i*130} 880L${650+i*45} 180`}/>)}{Array.from({length: 12},(_,i)=><path key={'h'+i} d={`M0 ${270+i*64}H1920`}/>)}</g>
        {/* Manufacturing boot, drafted as a shaded editorial product study */}
        <g transform={`translate(${440+(1-boots)*90} ${425+(1-boots)*30}) scale(${.97+boots*.03})`}>
          <ellipse cx="230" cy="286" rx="253" ry="34" fill="#e8ad68" opacity=".17" filter="url(#lineGlow)"/>
          <path d="M91 38h139v107c0 36 23 66 66 88l94 48c19 10 30 26 30 46v20H89c-51 0-85-32-85-76v-27c0-33 19-58 51-72l36-17z" fill="#172632" stroke="#b9dddb" strokeWidth="3"/>
          <path d="M100 55h110v97c0 47 28 82 83 109l84 43H76c-26 0-43-17-43-39v-24c0-18 11-32 32-42l43-20z" fill="#385359" stroke="#e0b579" strokeWidth="2"/>
          <path d="M124 59v75m21-75v71m21-71v69m21-69v66" stroke="#91b8b0" strokeOpacity=".55" strokeWidth="3"/>
          <path d="M55 272q28 15 67 14h266" fill="none" stroke="#f1d3a0" strokeWidth="4"/>
          <path d="M338 303l31 17m-74-17 31 17m-74-17 31 17" stroke="#e7ad70" strokeWidth="2" opacity=".8"/>
          <text x="126" y="186" fontFamily="Arial" fontSize="13" letterSpacing="3" fill="#dce5df" transform="rotate(90 126 186)">NOKIA · RUBBER</text>
        </g>
        {/* Cable paths thread through the frame and pulse along their length */}
        <g fill="none" stroke="url(#copper)" filter="url(#lineGlow)" opacity={cables} strokeWidth="4">
          <path d="M890 714C1050 760 1050 433 1255 495S1470 685 1630 410" strokeDasharray="900" strokeDashoffset={900*(1-Math.min(1,cables))}/>
          <path d="M890 727C1070 775 1085 465 1276 520S1498 710 1650 438" strokeWidth="2" opacity=".72" strokeDasharray="900" strokeDashoffset={900*(1-Math.min(1,cables))}/>
          <path d="M890 740C1100 800 1120 495 1295 545S1515 735 1673 466" strokeWidth="1.5" opacity=".48" strokeDasharray="900" strokeDashoffset={900*(1-Math.min(1,cables))}/>
        </g>
        {[0,1,2,3,4].map(i=>{const t=(Math.max(0,f-120)*.014+i*.2)%1;const pt=cablePacket(t);return <g key={i} opacity={cables}><circle cx={pt.x} cy={pt.y} r={4+(i%2)} fill={i%2?C.cyan:C.gold} filter="url(#lineGlow)"/><circle cx={pt.x} cy={pt.y} r="12" fill="none" stroke={C.cyan} strokeOpacity=".58"/></g>;})}
        {/* Grid transformer and luminous electricity arc */}
        <g transform={`translate(${1260+(1-power)*100} 280)`} opacity={power}>
          <path d="M0 185h250v212H0z" fill="#101b26" stroke="#7cb7b7" strokeOpacity=".65" strokeWidth="2"/><path d="M33 184v-45h44v45m67 0v-67h44v67" fill="none" stroke="#c8a16d" strokeWidth="4"/>
          <path d="M44 239h160m-160 34h160m-160 34h160" stroke="#4c7780" strokeWidth="4"/>
          <path d="M71 132l21-46 17 32 22-69 14 62 23-28" fill="none" stroke="#72e6ef" strokeWidth="5" filter="url(#lineGlow)" opacity={glow}/>
          <text x="20" y="430" fill="#a9c9c5" fontFamily="Arial" fontSize="13" letterSpacing="3">NATIONAL GRID · 1920s</text>
        </g>
      </svg>
    </div>
    <Topline frame={f} fps={30} label="An industrial powerhouse" index="02"/>
    <Glass style={{position: 'absolute', top: 168, left: 112, width: 348, padding: '20px 24px', opacity: springIn(f,30,25), transform: `translateY(${(1-springIn(f,30,25))*20}px)`}}>
      <div style={{font: '11px Arial', color: C.cyan, letterSpacing: 2.4}}>THE PIVOT · FINLAND</div><div style={{font: '25px Georgia', color: C.ivory, marginTop: 8}}>Beyond the forest</div>
      <div style={{height: 1, background: 'rgba(130,210,222,.24)', margin: '15px 0 12px'}}/><div style={{font: '13px Arial', color: C.muted, lineHeight: 1.8}}>Rubber goods <span style={{color: C.gold}}>→</span> cable networks <span style={{color: C.cyan}}>→</span> electrification</div>
    </Glass>
    <Glass style={{position: 'absolute', bottom: 153, right: 110, width: 312, padding: '16px 19px', opacity: springIn(f,30,210), transform: `translateY(${(1-springIn(f,30,210))*22}px)`}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}><span style={{font:'10px Arial',color:C.cyan,letterSpacing:2}}>INDUSTRIAL OUTPUT</span><span style={{font:'10px Arial',color:C.muted}}>FINLAND · 1920s</span></div>
      <div style={{font:'21px Georgia',color:C.ivory,marginTop:6}}>A nation electrified</div>
      <svg viewBox="0 0 280 66" width="100%" height="66" style={{marginTop:9,overflow:'visible'}}><path d="M0 58H280" fill="none" stroke="#63818a" strokeOpacity=".4"/><path d="M4 51 C31 49 36 44 55 46 S81 34 99 39 S129 36 147 26 S177 34 196 21 S230 17 249 9 S270 12 279 3" fill="none" stroke="#69e4f5" strokeWidth="2.5" strokeDasharray="210" strokeDashoffset={210*(1-Math.min(1,outputGraph))} style={{filter:'drop-shadow(0 0 5px #69e4f5)'}}/><path d="M4 51 C31 49 36 44 55 46 S81 34 99 39 S129 36 147 26 S177 34 196 21 S230 17 249 9 S270 12 279 3 L279 62 L4 62Z" fill="#69e4f5" fillOpacity=".08"/></svg>
    </Glass>
    <Caption frame={frame} fps={30} start={180} end={247}>Decades before cell phones, Nokia evolved into an industrial powerhouse—</Caption>
    <Caption frame={frame} fps={30} start={247} end={318}>manufacturing rubber boots, cables,</Caption>
    <Caption frame={frame} fps={30} start={318} end={444}>and electricity for a rapidly modernizing nation.</Caption>
  </AbsoluteFill>;
};

const GlobalNetwork: React.FC<{frame:number}> = ({frame}) => {
  const p = frame - 450;
  const net = smooth(p, 108, 148);
  const phone = springIn(p,30, 230);
  const pullback = interpolate(p, [0, 90, 210, 420], [1.23, 1.23, .87, .91], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const rotate = interpolate(p,[0,205,420],[6,0,-3],{...clamp,easing:Easing.inOut(Easing.cubic)});
  const origin = {x:960, y:350};
  const targets = [
    {x:866,y:390,label:'LONDON'}, {x:666,y:410,label:'NEW YORK'}, {x:1360,y:395,label:'TOKYO'},
    {x:1285,y:580,label:'SINGAPORE'}, {x:780,y:580,label:'SÃO PAULO'}, {x:1090,y:455,label:'DUBAI'}
  ];
  const mapOpacity = interpolate(p,[0,220,275,420],[1,1,.22,.12],{...clamp,easing:Easing.inOut(Easing.cubic)});
  return <AbsoluteFill style={{opacity: interpolate(frame,[430,460],[0,1],{...clamp,easing:Easing.inOut(Easing.cubic)}), overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 44%, #17303d 0%, #0b0f19 68%)'}}>
    <Topline frame={p} fps={30} label="The connected world" index="03"/>
    <div style={{position:'absolute', inset:0, opacity:mapOpacity, transform:`scale(${pullback}) rotate(${rotate}deg)`, transformOrigin:'50% 46%'}}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%">
        <defs><radialGradient id="earth2"><stop stopColor="#1c3946"/><stop offset=".82" stopColor="#10212b"/><stop offset="1" stopColor="#09121b"/></radialGradient><filter id="netGlow"><feGaussianBlur stdDeviation="11" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><clipPath id="earthClip"><ellipse cx="960" cy="486" rx="440" ry="335"/></clipPath></defs>
        <ellipse cx="960" cy="486" rx="440" ry="335" fill="url(#earth2)" stroke="#70dbe8" strokeOpacity=".45" strokeWidth="2"/>
        <g clipPath="url(#earthClip)" fill="none" stroke="#67bbca" strokeOpacity=".25">
          {[0,1,2,3,4].map(i=><ellipse key={'a'+i} cx="960" cy="486" rx="440" ry={70+i*65}/>)}
          {[0,1,2,3].map(i=><ellipse key={'b'+i} cx="960" cy="486" rx={90+i*80} ry="335"/>)}
          <path d="M570 400l70-90 80 26 45-62 90 27 42 82-48 58-72 16-8 74-81 43-60-61-88-21z M920 258l82-48 103 47 18 72-56 52-65-22-27 54-69-28-18-71z M1090 450l116-78 119 54 53 100-87 60-46 107-98-51-26-98z" stroke="#a4c6b2" strokeOpacity=".43" strokeWidth="3"/>
        </g>
        {/* City routes fire outward from Finland in timed waves */}
        {targets.map((t,i)=>{
          const delay=i*8;
          const q=smooth(p,108+delay,148+delay);
          const x=origin.x+(t.x-origin.x)*q;
          const y=origin.y+(t.y-origin.y)*q;
          const cy=t.y-origin.y<0?-75:95;
          const labelOpacity=net*smooth(p,150+delay,165+delay);
          return <g key={t.label}>
            <path d={`M${origin.x} ${origin.y} Q${(origin.x+t.x)/2} ${origin.y+cy} ${x} ${y}`} fill="none" stroke={i%2?C.cyan:C.gold} strokeOpacity={.66*net} strokeWidth="1.6" strokeDasharray="5 8"/>
            <circle cx={x} cy={y} r={3.5+(i%3)} fill={i%2?C.cyan:C.gold} filter="url(#netGlow)" opacity={net}/>
            <circle cx={x} cy={y} r={14+Math.sin(p/5+i)*3} fill="none" stroke={i%2?C.cyan:C.gold} strokeOpacity={.38+Math.sin(p/5+i)*.15} opacity={net}/>
            <text x={t.x+14} y={t.y-12} fill="#d3e4e2" fontSize="11" fontFamily="Arial" letterSpacing="2" opacity={labelOpacity}>{t.label}</text>
          </g>;
        })}
        <circle cx={origin.x} cy={origin.y} r="8" fill="#f4ca84" filter="url(#netGlow)"/><circle cx={origin.x} cy={origin.y} r={24+Math.sin(p/4)*7} fill="none" stroke="#f4ca84" strokeOpacity=".55"/>
        <text x={origin.x+20} y={origin.y-10} fill="#f3d094" fontSize="13" fontFamily="Arial" letterSpacing="3" opacity={net}>FINLAND · SIGNAL ORIGIN</text>
        {/* High-frequency radar rings bridge the global network into the phone schematic */}
        {[1,2,3,4].map((r)=><circle key={r} cx={origin.x} cy={origin.y} r={40+r*29+((p*2)%30)} fill="none" stroke="#6bdde9" strokeOpacity={Math.max(0,.2-(p%30)/180)} strokeWidth="1"/>)}
      </svg>
    </div>
    {/* Device resolves from wireframe into a luminous precision object */}
    <div style={{position:'absolute', left: '50%', top: 330, width: 244, height: 404, marginLeft: -122, opacity: Math.max(0,Math.min(1,phone)), transform:`translateY(${(1-phone)*80}px) scale(${.74+phone*.26}) rotate(${interpolate(p,[220,270],[8,0],clamp)}deg)`, filter:'drop-shadow(0 0 30px rgba(79,222,239,.24))'}}>
      <svg viewBox="0 0 244 404" width="100%" height="100%">
        <defs><linearGradient id="phone" x2="1" y2="1"><stop stopColor="#a8eef0"/><stop offset=".5" stopColor="#1d5260"/><stop offset="1" stopColor="#c3925d"/></linearGradient><linearGradient id="screen" x2="0" y2="1"><stop stopColor="#193540"/><stop offset="1" stopColor="#08121b"/></linearGradient></defs>
        <rect x="14" y="7" width="216" height="390" rx="29" fill="#09141e" stroke="url(#phone)" strokeWidth="3"/>
        <rect x="25" y="25" width="194" height="350" rx="20" fill="url(#screen)" stroke="#8ae2e7" strokeOpacity=".55"/>
        <path d="M87 16h70" stroke="#95aeb0" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="122" cy="199" r="76" fill="none" stroke="#5adbe8" strokeOpacity=".22"/><circle cx="122" cy="199" r="55" fill="none" stroke="#5adbe8" strokeOpacity=".36"/><circle cx="122" cy="199" r="28" fill="none" stroke="#e9bc7d" strokeOpacity=".8"/>
        <path d="M122 199L184 153A77 77 0 0 1 169 244Z" fill="#6de8ed" opacity=".22" transform={`rotate(${(p*7)%360} 122 199)`}/><path d="M122 199L181 157" stroke="#9cf4ec" strokeWidth="2" transform={`rotate(${(p*7)%360} 122 199)`}/>
        <path d="M51 103h40m62 0h40M51 296h40m62 0h40" stroke="#62dbe3" strokeOpacity=".33" strokeDasharray="3 7"/>
        {[0,1,2,3,4,5].map(i=><circle key={i} cx={122+Math.cos(i*Math.PI/3)*56} cy={199+Math.sin(i*Math.PI/3)*56} r="3" fill={i%2?C.cyan:C.gold}/>)}
        <path d="M58 286h128m-105 16h82m-100 16h119" stroke="#5baeb7" strokeOpacity=".48" strokeWidth="2"/>
        <text x="122" y="357" textAnchor="middle" fill="#c8dedb" fontSize="10" fontFamily="Arial" letterSpacing="2">MOBILE · CONNECTED</text>
      </svg>
    </div>
    <Glass style={{position:'absolute', top: 203, right: 145, width: 340, padding: '21px 24px', opacity: springIn(p,30,104), transform:`translateY(${(1-springIn(p,30,104))*22}px)`}}><div style={{font: '11px Arial', color:C.cyan, letterSpacing:2.5}}>A SIGNAL WITHOUT BORDERS</div><div style={{font:'26px Georgia', color:C.ivory, marginTop:9}}>Billions connected</div><div style={{font:'13px Arial', color:C.muted, marginTop:9}}>One pocket-sized gateway. A world transformed.</div></Glass>
    <Glass style={{position:'absolute', top: 681, left: 142, padding:'17px 21px', opacity:springIn(p,30,183), transform:`translateY(${(1-springIn(p,30,183))*18}px)`}}><div style={{font:'11px Arial', color:C.gold, letterSpacing:2}}>FROM FINLAND, OUTWARD</div><div style={{font:'21px Georgia', color:C.ivory, marginTop:7}}>The world, in your hand.</div></Glass>
    <Caption frame={frame} fps={30} start={450} end={558}>When the digital age arrived, Nokia pivoted once more—</Caption>
    <Caption frame={frame} fps={30} start={558} end={684}>connecting billions of people</Caption>
    <Caption frame={frame} fps={30} start={684} end={870}>and redefining what a mobile phone could be.</Caption>
  </AbsoluteFill>;
};

const OpeningTitle: React.FC<{frame:number}> = ({frame}) => {
  const y = springIn(frame,30,12);
  const op = interpolate(frame,[0,18,140,178],[0,1,1,0],clamp);
  return <div style={{position:'absolute',left:92,top:255,width:705,opacity:op,transform:`translateY(${(1-y)*28}px)`}}>
    <div style={{font:'13px Arial',letterSpacing:4,color:C.cyan,marginBottom:22}}>A DOCUMENTARY IN THREE PIVOTS</div>
    <div style={{font:'500 72px/1.02 Georgia, serif',color:C.ivory,letterSpacing:-2,textShadow:'0 8px 38px rgba(0,0,0,.45)'}}>The Empire of<br/><span style={{color:'#e4bd80'}}>Timber &amp; Tech</span></div>
    <div style={{font:'21px Arial',color:'#b5c0c6',marginTop:24}}>How Nokia conquered (and lost) the world</div>
    <div style={{height:2,width:interpolate(frame,[20,75],[0,240],clamp),background:`linear-gradient(90deg,${C.cyan},transparent)`,marginTop:29}}/>
  </div>;
};

export const NokiaDocumentary: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const v1=springIn(frame,fps,8);
  return <AbsoluteFill style={{background:C.bg,color:C.ivory,fontFamily:'Arial, sans-serif',overflow:'hidden'}}>
    <AbsoluteFill style={{background:'radial-gradient(ellipse at 60% 44%, #142631 0%, #0b0f19 68%)'}}/>
    <WorldGlobe frame={frame}/>
    <ForestMill frame={frame}/>
    <GridScene frame={frame}/>
    <GlobalNetwork frame={frame}/>
    <OpeningTitle frame={frame}/>
    <div style={{opacity: interpolate(frame,[0,12,160,185],[0,1,1,0],clamp)}}><Topline frame={frame} fps={fps} label="The beginning · 1865" index="01"/></div>
    <div style={{position:'absolute',left:77,bottom:57,display:'flex',alignItems:'center',gap:12,opacity:Math.min(1,v1) * interpolate(frame,[0,12,162,185],[0,1,1,0],clamp),font:'11px Arial',letterSpacing:2,color:'#8ea2ae'}}><span style={{display:'inline-block',width:7,height:7,borderRadius:'50%',background:C.cyan,boxShadow:`0 0 12px ${C.cyan}`}}/>FINLAND <span style={{color:'#435564'}}>·</span> 1865 <span style={{color:'#435564'}}>·</span> THE NOKIA RIVER</div>
    <Caption frame={frame} fps={fps} start={0} end={57}>In 1865, deep in the frozen forests of Finland,</Caption>
    <Caption frame={frame} fps={fps} start={57} end={105}>a quiet timber mill was born.</Caption>
    <Caption frame={frame} fps={fps} start={105} end={177}>No one knew it yet... but this small paper company would change history.</Caption>
    <div style={{position:'absolute',right:77,bottom:56,width:218,height:2,background:'rgba(132,167,180,.25)'}}><div style={{height:2,width:`${Math.min(100,(frame/899)*100)}%`,background:C.cyan,boxShadow:`0 0 10px ${C.cyan}`}}/></div>
    {/* Three narration recordings placed at the exact scene boundaries in the script. */}
    <Sequence from={0} durationInFrames={900}><Audio src={staticFile('audio/scene-1.mp3')} volume={1} playbackRate={0.92}/></Sequence>
    <Sequence from={180} durationInFrames={720}><Audio src={staticFile('audio/scene-2.mp3')} volume={1} playbackRate={0.68}/></Sequence>
    <Sequence from={450} durationInFrames={450}><Audio src={staticFile('audio/scene-3.mp3')} volume={1} playbackRate={0.56}/></Sequence>
    <Grain/>
  </AbsoluteFill>;
};
