import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { avatarOptions, children } from '../data/children'
import type { AppState, KidName } from '../types'
import { shuffled } from '../engine/random'

interface Props { state:AppState; onSelect:(kid:KidName)=>void; onAvatar:(kid:KidName,avatar:string)=>void; onParent:()=>void; onToggleContrast:()=>void }
export default function HomeScreen({state,onSelect,onAvatar,onParent,onToggleContrast}:Props){
  const [editing,setEditing]=useState<KidName|null>(null)
  const avatars=useMemo(()=>shuffled(avatarOptions,Math.random).slice(0,18),[])
  return <main className="home ocean-scene">
    <div className="sun-rays" aria-hidden="true"/>
    <div className="bubble b1"/><div className="bubble b2"/><div className="bubble b3"/><div className="bubble b4"/><div className="bubble b5"/>
    <div className="fish fish-one" aria-hidden="true">🐠</div><div className="fish fish-two" aria-hidden="true">🐟</div><div className="fish fish-three" aria-hidden="true">🐬</div><div className="jelly jelly-one" aria-hidden="true">🪼</div><div className="jelly jelly-two" aria-hidden="true">🪼</div><div className="turtle" aria-hidden="true">🐢</div>
    <div className="seaweed seaweed-left" aria-hidden="true">〰️🌿〰️🌿</div><div className="seaweed seaweed-right" aria-hidden="true">🌿〰️🌿〰️</div>
    <header className="hero animated-rise"><div><div className="hero-kicker">🌊 UNDERWATER LEARNING ADVENTURE</div><h1>Coleman Family Learning Program</h1><p>Choose your learner and start today’s adventure.</p></div><div className="top-actions"><button className="secondary" onClick={onToggleContrast}>{state.contrast==='dark'?'☀️ Bright Theme':'🌙 Dark Theme'}</button><button className="secondary" onClick={onParent}>🔐 Parent Admin</button></div></header>
    <section className="kid-grid">{(Object.keys(children) as KidName[]).map((kid,index)=>{const cfg=children[kid];return <article className="kid-card animated-rise" key={kid} style={{'--kid-color':cfg.color,animationDelay:`${index*100}ms`} as CSSProperties}><div className="avatar-ring"><button className="avatar-main" onClick={()=>setEditing(kid)} aria-label={`Change ${kid}'s avatar`}>{state.kids[kid].avatar}</button></div><h2>{kid}</h2><p>{cfg.grade}</p><button className="primary start-button" onClick={()=>onSelect(kid)}>Start Learning <span>→</span></button><button className="linkish" onClick={()=>setEditing(kid)}>Change Avatar</button></article>})}</section>
    {editing&&<div className="modal-backdrop" onClick={()=>setEditing(null)}><section className="modal animated-pop" onClick={e=>e.stopPropagation()}><h2>Choose {editing}'s Avatar</h2><div className="avatar-grid">{avatars.map((a,i)=><button className="avatar-option" key={`${a}-${i}`} onClick={()=>{onAvatar(editing,a);setEditing(null)}}>{a}</button>)}</div><button className="secondary" onClick={()=>setEditing(null)}>Close</button></section></div>}
  </main>
}
