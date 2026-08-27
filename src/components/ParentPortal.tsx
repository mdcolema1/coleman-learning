import { useEffect, useMemo, useState } from 'react'
import type { AppState, KidName } from '../types'
import { children } from '../data/children'
import { englishVoices, primeVoices, speakText } from '../engine/voices'

const HASH='8fe3b7ecf863b75cd14ccf03a0ab0190eabd7d7c7148b8086e9387510c95b389'
async function sha256(v:string){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')}
interface Props{state:AppState;onClose:()=>void;onDeduct:(kid:KidName,amount:number)=>void;onVoice:(name:string)=>void}

export default function ParentPortal({state,onClose,onDeduct,onVoice}:Props){
  const [ok,setOk]=useState(false)
  const [password,setPassword]=useState('')
  const [error,setError]=useState('')
  const [voiceTick,setVoiceTick]=useState(0)
  useEffect(()=>primeVoices(()=>setVoiceTick(v=>v+1)),[])
  const voices=useMemo(()=>englishVoices(),[voiceTick])

  if(!ok)return <main className="parent-shell"><section className="admin-login animated-rise"><div className="admin-lock">🔐</div><h1>Dad & Maggie Parent Admin</h1><p>Enter the family admin password.</p><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void sha256(password).then(h=>h===HASH?setOk(true):setError('Incorrect password'))}} placeholder="Password"/><button className="primary" onClick={async()=>{if(await sha256(password)===HASH){setOk(true);setError('')}else setError('Incorrect password')}}>Open Portal</button>{error&&<p className="error">{error}</p>}<button className="secondary" onClick={onClose}>Back</button></section></main>

  return <main className="parent-shell"><header className="page-header"><button className="secondary" onClick={onClose}>Close</button><div><h1>Parent Admin</h1><p>GitHub-only mode. Progress shown here is stored on this device.</p></div></header>
    <section className="admin-controls animated-rise"><div className="voice-control"><label>Voice on this device<select value={state.preferredVoice||''} onChange={(e)=>onVoice(e.target.value)}><option value="">Automatic best available voice</option>{voices.map(v=><option key={`${v.name}-${v.lang}`} value={v.name}>{v.name} · {v.lang}</option>)}</select></label><button className="secondary" onClick={()=>speakText('Hi! This is the voice I will use during the Coleman Family Learning Program.',state.preferredVoice)}>🔊 Test Voice</button></div><p className="voice-note">The list is ranked to favor natural, enhanced, neural, and higher-quality English voices exposed by this device.</p></section>
    <section className="admin-kids">{(Object.keys(children) as KidName[]).map((kid,idx)=>{const p=state.kids[kid],wr=p.records.filter(r=>!p.window.startedAt||r.completedAt>=p.window.startedAt),incorrect=wr.reduce((a,r)=>a+r.incorrectFirstAttempts,0),suggested=Number((incorrect*.05).toFixed(2));return <article className="admin-card animated-rise" style={{animationDelay:`${idx*80}ms`}} key={kid}><h2>{p.avatar} {kid}</h2><div className="admin-stats"><span>Window earnings<strong>${p.window.earnings.toFixed(2)}</strong></span><span>Total bank<strong>${p.bank.toFixed(2)}</strong></span><span>Incorrect first attempts<strong>{incorrect}</strong></span></div><button className="danger" disabled={suggested<=0} onClick={()=>onDeduct(kid,suggested)}>Apply suggested deduction (${suggested.toFixed(2)})</button><div className="records">{wr.length===0?<p>No completed learning in this window.</p>:wr.slice(-10).reverse().map(r=><div key={r.id}><span>{r.subject} Quiz {r.quiz}</span><span>{Math.round(r.firstAttemptAccuracy*100)}%</span><span>{r.passedAllowanceRule?`+$${r.earned.toFixed(2)}`:'No allowance'}</span></div>)}</div></article>})}</section>
  </main>
}
