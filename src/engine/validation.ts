import type {Question,Visual} from '../types'

function norm(value:string){return value.toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9%:/.-]+/g,' ').replace(/\s+/g,' ').trim()}
function containsAnswer(text:string|undefined,answer:string){if(!text)return false;const a=norm(answer),t=norm(text);if(!a||a.length<2)return false;if(/^\d+(?:[.:/]\d+)?$/.test(a))return new RegExp(`(^|[^0-9])${a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}([^0-9]|$)`).test(t);return (` ${t} `).includes(` ${a} `)}
function visualText(v:Visual|undefined){if(!v)return'';switch(v.kind){case'digitalTime':case'maskedWord':case'equation':case'map':case'passage':return v.value;case'geometry':return v.values?.join(' ')||'';case'thermometer':return `${v.value} ${v.unit}`;case'dataTable':return [...v.headers,...v.rows.flat()].join(' ');case'barChart':return [...v.labels,...v.values.map(String)].join(' ');case'science':return v.caption||'';default:return''}}
export function answerLeakIssues(q:Question){
  const issues:string[]=[],allow=new Set(q.answerExposureAllowed||[]),visible:[string,string][]=[['prompt',q.prompt],['skill',q.skill],['hint',q.hint],['visual',visualText(q.visual)]]
  // Audio-target questions are intentionally strict: the target may be spoken and may appear among choices,
  // but it must never be printed elsewhere before the learner chooses.
  if(q.contextTag==='audio-target')for(const [field,text] of visible)if(!allow.has(field as any)&&containsAnswer(text,q.answer))issues.push(`${q.id}: audio-target answer "${q.answer}" visible in ${field}`)
  // First-miss hints should guide thinking, not directly state a non-numeric answer.
  const a=norm(q.answer);if(!allow.has('hint')&&a.length>=4&&!/^[$]?\d/.test(a)&&containsAnswer(q.hint,q.answer))issues.push(`${q.id}: answer "${q.answer}" exposed in first-miss hint`)
  // Known high-risk presentation patterns that caused regressions previously.
  if(q.subject==='SightWords'&&containsAnswer(q.skill,q.answer))issues.push(`${q.id}: sight-word answer exposed in skill label`)
  if(q.subject==='DigitalTime'&&q.visual?.kind==='digitalTime'&&norm(q.visual.value)===a)issues.push(`${q.id}: digital-time illustration exposes the answer`)
  return [...new Set(issues)]
}
export function sanitizeQuestions(items:Question[]){const seen=new Set<string>();return items.filter(q=>{if(seen.has(q.id))return false;seen.add(q.id);q.choices=[...new Set(q.choices)];if(!q.choices.includes(q.answer))q.choices=[q.answer,...q.choices].slice(0,4);if(q.choices.length>4)q.choices=q.choices.slice(0,4);return q.choices.filter(c=>c===q.answer).length===1})}
export function questionIssues(items:Question[]){const issues:string[]=[];for(const q of items){if(!q.prompt.trim())issues.push(`${q.id}: blank prompt`);if(!q.answer.trim())issues.push(`${q.id}: blank answer`);if(q.choices.filter(c=>c===q.answer).length!==1)issues.push(`${q.id}: answer must appear exactly once`);if(new Set(q.choices).size!==q.choices.length)issues.push(`${q.id}: duplicate choices`);const minChoices=q.subject==='ReadingFluency'?1:2;if(q.choices.length<minChoices||q.choices.length>4)issues.push(`${q.id}: expected ${minChoices}-4 choices, found ${q.choices.length}`);if(q.difficulty<1||q.difficulty>8)issues.push(`${q.id}: difficulty ${q.difficulty} out of range`);issues.push(...answerLeakIssues(q))}return issues}
