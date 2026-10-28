import React from 'react';
import {spring, useCurrentFrame, useVideoConfig, interpolate, Easing} from 'remotion';

const P = {ice: '#eaf5f2', cyan: '#70e9f2', amber: '#ffc36f', muted: '#9ab1b8'};
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const inOut = {...clamp, easing: Easing.inOut(Easing.cubic)};
const reveal = (frame: number, fps: number, start: number) => Math.max(0, Math.min(1, spring({frame: frame - start, fps, config: {damping: 12, stiffness: 100}})));
const fade = (frame: number, from: number, to: number) => interpolate(frame, [from, to], [1, 0], inOut);

const narration = [
  {from: 0, to: 51, line: 'In 1865, deep in the frozen forests of Finland,'},
  {from: 51, to: 92, line: 'a quiet timber mill was born.'},
  {from: 92, to: 180, line: 'No one knew it yet... but this small paper company would change history.'},
  {from: 180, to: 240, line: 'Decades before cell phones, Nokia evolved into an industrial powerhouse—'},
  {from: 240, to: 300, line: 'manufacturing rubber boots,'},
  {from: 300, to: 365, line: 'cables, and electricity'},
  {from: 365, to: 450, line: 'for a rapidly modernizing nation.'},
  {from: 450, to: 558, line: 'When the digital age arrived, Nokia pivoted once more—'},
  {from: 558, to: 684, line: 'connecting billions of people'},
  {from: 684, to: 900, line: 'and redefining what a mobile phone could be.'},
] as const;

const chapters = [
  {from: 0, to: 180, tag: 'FINLAND / 1865', lines: ['A RIVER.', 'A MILL.', 'A BEGINNING.'], sub: 'The story starts at the waterline.'},
  {from: 180, to: 450, tag: 'THE INDUSTRIAL YEARS', lines: ['BUILT TO', 'REINVENT.'], sub: 'Rubber. Copper. Electric current.'},
  {from: 450, to: 690, tag: 'A NEW KIND OF REACH', lines: ['THE WORLD', 'IN SIGNAL.'], sub: 'One northern origin. A global network.'},
  {from: 690, to: 900, tag: 'THE MOBILE ERA', lines: ['THE SIGNAL', 'GOES PERSONAL.'], sub: 'A world, carried in your hand.'},
] as const;

const Schematic: React.FC<{frame: number; mode: number}> = ({frame, mode}) => {
  const spin = (frame * 2.7) % 360;
  const pulse = 0.55 + 0.35 * Math.sin(frame / 9);
  return (
    <svg aria-hidden="true" viewBox="0 0 720 720" preserveAspectRatio="xMidYMid meet" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible'}}>
      <defs>
        <linearGradient id="scanBeam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#70e9f2" stopOpacity=".35"/><stop offset="1" stopColor="#70e9f2" stopOpacity="0"/></linearGradient>
        <filter id="vectorGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {mode === 0 && <g fill="none" stroke="#70e9f2" strokeWidth="1.3">
        <circle cx="360" cy="360" r="245" strokeOpacity=".36"/><circle cx="360" cy="360" r="191" strokeOpacity=".22" strokeDasharray="3 9"/>
        <ellipse cx="360" cy="360" rx="245" ry="92" strokeOpacity=".45"/><ellipse cx="360" cy="360" rx="92" ry="245" strokeOpacity=".34"/>
        <path d="M102 360h516M360 102v516" strokeOpacity=".22" strokeDasharray="4 8"/>
        <g transform={`rotate(${spin} 360 360)`} filter="url(#vectorGlow)"><path d="M360 360L605 360A245 245 0 0 0 523 188Z" fill="url(#scanBeam)" stroke="none"/><path d="M360 360L605 360" strokeWidth="2"/></g>
        {[[208,218],[290,153],[473,194],[555,292],[518,466],[404,545],[230,448],[154,344],[348,270],[441,405]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r={i%3===0?5:3} fill={i%3===0?P.amber:P.cyan} stroke="none" opacity={pulse}/><circle cx={x} cy={y} r={i%3===0?14:9} strokeOpacity=".32"/></g>)}
        <circle cx="360" cy="360" r="11" fill={P.amber} stroke="none" filter="url(#vectorGlow)"/>
      </g>}
      {mode === 1 && <g fill="none" stroke="#70e9f2" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M144 167h108l24 30v238l-32 42h-90l-25-31V205z" strokeOpacity=".75"/>
        <path d="M177 202v204m32-204v177m-73-1h136m-136 19h124" strokeOpacity=".4"/>
        <path d="M325 398c49 0 49-108 98-108s49 108 98 108 49-108 98-108" stroke={P.amber} strokeOpacity=".8"/>
        <circle cx="423" cy="290" r="6" fill={P.amber}/><circle cx="521" cy="398" r="6" fill={P.cyan}/><circle cx="619" cy="290" r="6" fill={P.amber}/>
        <path d="M321 507h300m-300 0V438m43 69v-22m44 22v-36m44 36v-49m44 49v-61m44 61v-76m44 76v-95" strokeOpacity=".52"/>
        <path d="M321 486l43-8 44-8 44-11 44-15 44-15 44-22 37-18" stroke={P.amber} strokeWidth="2.4"/>
      </g>}
      {mode === 2 && <g fill="none" stroke="#70e9f2" strokeWidth="1.4">
        <path d="M110 355C216 240 278 245 359 357S517 478 615 292" strokeOpacity=".45"/>
        <path d="M110 355C208 473 276 487 359 357S520 255 615 292" stroke={P.amber} strokeOpacity=".7"/>
        <path d="M110 355C235 355 296 298 359 357S507 420 615 292" strokeOpacity=".3" strokeDasharray="5 9"/>
        {[[110,355],[225,276],[359,357],[495,412],[615,292],[514,272]].map(([x,y],i)=><g key={i} filter={i===2?'url(#vectorGlow)':undefined}><circle cx={x} cy={y} r={i===2?9:5} fill={i===2?P.amber:P.cyan}/><circle cx={x} cy={y} r={i===2?22:13} strokeOpacity=".4"/></g>)}
      </g>}
      {mode === 3 && <g fill="none" stroke="#70e9f2" strokeWidth="1.5">
        <circle cx="360" cy="360" r="248" strokeOpacity=".24"/><circle cx="360" cy="360" r="180" strokeOpacity=".42"/><circle cx="360" cy="360" r="114" strokeOpacity=".56"/><circle cx="360" cy="360" r="42" stroke={P.amber} strokeOpacity=".84"/>
        <g transform={`rotate(${spin * 1.4} 360 360)`} filter="url(#vectorGlow)"><path d="M360 360L608 360A248 248 0 0 0 530 190Z" fill="url(#scanBeam)" stroke="none"/><path d="M360 360L608 360" strokeWidth="2.4"/></g>
        <path d="M104 360h512M360 104v512" strokeOpacity=".2" strokeDasharray="4 8"/>
        <circle cx="278" cy="300" r="5" fill={P.amber}/><circle cx="467" cy="422" r="5" fill={P.cyan}/><circle cx="422" cy="244" r="4" fill={P.cyan}/>
      </g>}
    </svg>
  );
};

const DataPanel: React.FC<{frame: number; mode: number}> = ({frame, mode}) => {
  const {fps} = useVideoConfig();
  const opacity = reveal(frame, fps, mode === 0 ? 8 : mode === 1 ? 185 : mode === 2 ? 452 : 692);
  const contents = [
    {kicker: 'ORIGIN / 01', title: 'Nokia, Finland', lines: ['61° 28′ N', '23° 30′ E', 'A river-powered mill']},
    {kicker: 'MATERIAL / 02', title: 'Industry, remade', lines: ['Rubber → cable', 'Copper → current', 'Output rises']},
    {kicker: 'NETWORK / 03', title: 'A signal without borders', lines: ['FIN → LON', 'FIN → NYC', 'FIN → TYO']},
    {kicker: 'MOBILE / 04', title: 'Billions connected', lines: ['The pocket gateway', 'A world redrawn', 'Signal: strong']},
  ][mode];
  return (
    <aside style={{position: 'absolute', right: 76, top: mode === 1 ? 390 : 286, width: 340, zIndex: 6, padding: '23px 24px 25px', color: P.ice, border: '1px solid rgba(112,233,242,.45)', borderRadius: '18px 18px 18px 5px', background: 'linear-gradient(132deg, rgba(16,35,48,.82), rgba(7,15,25,.7) 62%, rgba(13,30,39,.82))', boxShadow: 'inset 0 1px 0 rgba(235,250,247,.14), 0 22px 60px rgba(0,0,0,.42), 0 0 26px rgba(62,193,208,.12)', backdropFilter: 'blur(12px) saturate(145%)', WebkitBackdropFilter: 'blur(12px) saturate(145%)', opacity, transform: `translateY(${(1 - opacity) * 12}px)`}}>
      <div style={{position: 'absolute', left: 24, top: 0, height: 1, width: 110, background: 'linear-gradient(90deg, #ffc36f, transparent)'}} />
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: P.cyan, fontSize: 10, fontWeight: 800, letterSpacing: 3.2}}>
        <span>{contents.kicker}</span><span style={{width: 6, height: 6, borderRadius: '50%', background: P.amber, boxShadow: '0 0 14px #ffc36f'}} />
      </div>
      <div style={{marginTop: 13, font: '400 27px/1.08 Georgia, serif', letterSpacing: -0.4}}>{contents.title}</div>
      <svg aria-hidden="true" viewBox="0 0 280 34" style={{display: 'block', width: '100%', height: 34, marginTop: 13}}>
        <path d="M4 25C39 25 39 9 74 9s35 21 70 21 35-15 70-15 35 10 62 10" fill="none" stroke="#70e9f2" strokeOpacity=".52" strokeWidth="1.2" />
        <path d="M4 25H276" fill="none" stroke="#70e9f2" strokeOpacity=".18" strokeDasharray="2 7" />
        {[4, 74, 144, 214, 276].map((x, index) => <circle key={x} cx={x} cy={index === 1 ? 9 : index === 2 ? 30 : index === 3 ? 15 : 25} r={index === 0 ? 3.5 : 2.6} fill={index === 0 ? P.amber : P.cyan} />)}
      </svg>
      <div style={{position: 'relative', display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 7, marginTop: 13, color: '#b4c6c8', fontSize: 11, fontWeight: 700, letterSpacing: 1.5}}>
        {contents.lines.map((line, index) => <React.Fragment key={line}><span>{line}</span><span style={{color: index === 0 ? P.amber : '#789da6'}}>0{index + 1}</span></React.Fragment>)}
      </div>
    </aside>
  );
};

export const EditorialOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const chapter = chapters.find((part) => frame >= part.from && frame < part.to) ?? chapters[chapters.length - 1];
  const mode = chapters.indexOf(chapter);
  const caption = narration.find((line) => frame >= line.from && frame < line.to) ?? narration[narration.length - 1];
  const heroIn = reveal(frame, fps, chapter.from);
  const captionIn = reveal(frame, fps, caption.from);
  const heroOut = chapter.to < 900 ? fade(frame, chapter.to - 10, chapter.to + 10) : 1;
  const heroOpacity = heroIn * heroOut;
  const seconds = Math.floor(frame / 30);

  return (
    <div aria-hidden="true" style={{position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', overflow: 'hidden', isolation: 'isolate', color: P.ice, fontFamily: 'Arial, Helvetica, sans-serif'}}>
      <div style={{position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(90deg, rgba(5,9,16,.76) 0%, rgba(5,9,16,.24) 46%, transparent 75%), linear-gradient(0deg, rgba(5,9,16,.86), transparent 46%)'}} />
      <div style={{position: 'absolute', inset: 0, zIndex: 1, opacity: 0.75, mixBlendMode: 'screen', background: 'radial-gradient(ellipse at 77% 37%, rgba(44,160,177,.19), transparent 39%), radial-gradient(ellipse at 19% 72%, rgba(210,144,84,.11), transparent 34%), radial-gradient(ellipse at 50% 50%, transparent 36%, rgba(0,0,0,.34) 100%)'}} />
      <header style={{position: 'absolute', zIndex: 7, left: 76, right: 76, top: 34, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, fontWeight: 800, letterSpacing: 3.8, color: 'rgba(224,241,238,.72)'}}>
        <span>FIELD NOTES&nbsp;&nbsp; / &nbsp;&nbsp;NOKIA</span><span>DOCUMENTARY&nbsp;&nbsp; · &nbsp;&nbsp;{String(seconds).padStart(2, '0')} SEC</span>
      </header>
      <section style={{position: 'absolute', zIndex: 5, left: 76, top: 180, width: 790, opacity: heroOpacity, transform: `translateY(${(1 - heroIn) * 20}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, color: P.amber, fontSize: 12, fontWeight: 900, letterSpacing: 4.5}}>
          <span style={{width: 34, height: 1, background: P.amber}} />{chapter.tag}
        </div>
        <h1 style={{margin: '24px 0 0', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: mode === 0 ? 104 : 96, lineHeight: 0.86, fontWeight: 900, letterSpacing: -7, textShadow: '0 8px 46px rgba(0,0,0,.72)'}}>
          {chapter.lines.map((line, i) => <React.Fragment key={line}><span style={{display: 'block', color: i === chapter.lines.length - 1 ? P.amber : P.ice, fontWeight: i === 0 ? 900 : 700}}>{line}</span></React.Fragment>)}
        </h1>
        <div style={{marginTop: 25, maxWidth: 510, color: '#bdcdcd', font: '400 18px/1.5 Georgia, serif', letterSpacing: 0.25}}>{chapter.sub}</div>
      </section>
      <div style={{position: 'absolute', right: 76, top: 0, bottom: 0, width: 720, zIndex: 2, opacity: 0.76, filter: 'drop-shadow(0 0 22px rgba(71,207,224,.12))'}}>
        <Schematic frame={frame} mode={mode} />
      </div>
      <DataPanel frame={frame} mode={mode} />
      <div style={{position: 'absolute', zIndex: 8, left: 76, bottom: 64, width: 850, opacity: captionIn, transform: `translateY(${(1 - captionIn) * 8}px) scale(${0.985 + 0.015 * captionIn})`, padding: '21px 26px 22px 31px', border: '1px solid rgba(112,233,242,.38)', borderRadius: '4px 18px 18px 4px', background: 'linear-gradient(110deg, rgba(12,25,37,.88), rgba(7,15,25,.74) 72%, rgba(16,35,43,.8))', boxShadow: 'inset 0 1px 0 rgba(235,250,247,.12), 0 22px 58px rgba(0,0,0,.45), 0 0 24px rgba(67,192,207,.12)', backdropFilter: 'blur(12px) saturate(145%)', WebkitBackdropFilter: 'blur(12px) saturate(145%)'}}>
        <div style={{position: 'absolute', left: 0, top: 18, bottom: 18, width: 2, background: `linear-gradient(180deg, transparent, ${P.amber}, transparent)`}} />
        <div style={{marginBottom: 8, color: P.cyan, fontSize: 9, fontWeight: 900, letterSpacing: 3.7}}>NARRATION / {String(caption.from / 30).padStart(2, '0')} SEC</div>
        <div style={{font: '400 23px/1.38 Georgia, serif', color: P.ice, textShadow: '0 2px 15px rgba(0,0,0,.55)'}}>{caption.line}</div>
      </div>
      <div style={{position: 'absolute', zIndex: 7, right: 76, bottom: 66, color: 'rgba(205,225,222,.62)', fontSize: 9, fontWeight: 800, letterSpacing: 3, writingMode: 'vertical-rl'}}>NOKIA / FINLAND / 1865—TODAY</div>
    </div>
  );
};
