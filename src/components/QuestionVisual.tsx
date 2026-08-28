import type {Question} from '../types'

function scienceIcon(skill:string){const s=skill.toLowerCase();if(s.includes('earth')||s.includes('space'))return '🌎';if(s.includes('plant')||s.includes('life'))return '🌱';if(s.includes('animal')||s.includes('living'))return '🦋';if(s.includes('ecosystem'))return '🌿';if(s.includes('matter'))return '🧪';if(s.includes('force'))return '🧲';if(s.includes('weather'))return '🌦️';return '🔬'}

export default function QuestionVisual({q}:{q:Question}){
  const v=q.visual
  if(!v||v.kind==='none'){
    if(q.subject.includes('Science'))return <div className="science-visual"><span>{scienceIcon(q.skill)}</span><span className="science-orbit">✦</span></div>
    return null
  }
  if(v.kind==='color')return <div className="color-stage"><div className="shape-swatch" style={{background:v.value}}/><span className="color-sparkle s1">✦</span><span className="color-sparkle s2">✦</span></div>
  if(v.kind==='digitalTime')return <div className="clock-stage"><div className="digital-clock"><span className="clock-dot"/>{v.value}</div></div>
  if(v.kind==='maskedWord')return <div className="masked-word paper-strip">{v.value}</div>
  if(v.kind==='passage')return <div className="reading-passage">{v.value}</div>
  if(v.kind==='fraction'){
    const parts=Array.from({length:v.denominator},(_,i)=>i)
    return <div className="fraction-visual"><div className="fraction-parts">{parts.map(i=><span key={i} className={i<v.numerator?'filled':''}/>)}</div><small>Look at the shaded equal parts.</small></div>
  }
  if(v.kind==='geometry')return <div className="geometry-visual"><div className={`geo-shape ${v.shape}`}/>{v.values&&<div className="geometry-values">{v.values.join(' × ')} units</div>}</div>
  if(v.kind==='map')return <div className="map-visual">{v.value}</div>
  if(v.kind==='numberLine'){const range=Math.max(1,v.max-v.min),pct=(v.marker-v.min)/range*100;return <div className="number-line"><div className="number-line-track"><span className="number-marker" style={{left:`${Math.max(0,Math.min(100,pct))}%`}}>▼</span></div><div><span>{v.min}</span><span>{v.max}</span></div></div>}
  if(v.kind==='thermometer'){const pct=Math.max(0,Math.min(100,(v.value+20)/140*100));return <div className="thermometer-wrap"><div className="thermometer"><i style={{height:`${pct}%`}}/></div><strong>{v.value}°{v.unit}</strong></div>}
  if(v.kind==='dataTable')return <div className="data-table-wrap"><table><thead><tr>{v.headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{v.rows.map((r,i)=><tr key={i}>{r.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>
  if(v.kind==='barChart'){const max=Math.max(...v.values,1);return <div className="bar-chart">{v.values.map((value,i)=><div key={i}><i style={{height:`${value/max*100}%`}}/><span>{v.labels[i]}</span><b>{value}</b></div>)}</div>}
  if(v.kind==='science')return <div className="science-visual-card"><span>{v.icon}</span>{v.caption&&<p>{v.caption}</p>}</div>
  return <div className="equation math-board">{v.value}</div>
}
