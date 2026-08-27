import type { Question } from '../types'

function scienceIcon(skill:string){const s=skill.toLowerCase();if(s.includes('earth')||s.includes('space'))return '🌎';if(s.includes('plant'))return '🌱';if(s.includes('animal')||s.includes('living'))return '🦋';if(s.includes('ecosystem'))return '🌿';if(s.includes('matter'))return '🧪';if(s.includes('force'))return '🧲';if(s.includes('sense'))return '👂';return '🔬'}

export default function QuestionVisual({q}:{q:Question}){
  if(!q.visual||q.visual.kind==='none'){
    if(q.subject==='Science')return <div className="science-visual" aria-hidden="true"><span>{scienceIcon(q.skill)}</span><span className="science-orbit">✦</span></div>
    return null
  }
  if(q.visual.kind==='color')return <div className="color-stage"><div className="shape-swatch" style={{background:q.visual.value}}/><span className="color-sparkle s1">✦</span><span className="color-sparkle s2">✦</span></div>
  if(q.visual.kind==='digitalTime')return <div className="clock-stage"><div className="digital-clock"><span className="clock-dot"/>{q.visual.value}</div></div>
  if(q.visual.kind==='maskedWord')return <div className="masked-word paper-strip">{q.visual.value}</div>
  return <div className="equation math-board">{q.visual.value}</div>
}
