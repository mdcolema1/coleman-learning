import {useMemo,useState} from 'react'
import type {CSSProperties} from 'react'
import {avatarOptions,children} from '../data/children'
import type {AppState,KidName} from '../types'
import {shuffled} from '../engine/random'
import {zoneById} from '../data/adventure'
import NetworkStatus from './NetworkStatus'
interface Props{state:AppState;onSelect:(kid:KidName)=>void;onAvatar:(kid:KidName,avatar:string)=>void;onParent:()=>void;onToggleContrast:()=>void;onStore:(kid:KidName)=>void;onAdventure:(kid:KidName)=>void}
export default function HomeScreen({state,onSelect,onAvatar,onParent,onToggleContrast}:Props){
 const [editing,setEditing]=useState<KidName|null>(null)
 const avatars=useMemo(()=>shuffled(avatarOptions,Math.random).slice(0,30),[])
 return <main className="explorer-select-v11">
  <div className="select-ocean-light"/><div className="select-bubbles"/><div className="select-reef reef-left"/><div className="select-reef reef-right"/>
  <header className="select-topbar"><div className="brand-lockup"><span>🌊</span><div><small>COLEMAN FAMILY</small><strong>OCEAN EXPEDITION</strong></div></div><div className="select-utility"><NetworkStatus/><button onClick={onToggleContrast} aria-label="Toggle display">◐</button><button onClick={onParent} aria-label="Parent controls">🔐</button></div></header>
  <section className="select-hero"><span className="select-kicker">WORLD 1 · ADVENTURE AWAITS</span><h1>Choose Your Explorer</h1><p>Learn. Earn energy. Dive into the expedition.</p></section>
  <section className="explorer-select-grid">{(Object.keys(children) as KidName[]).map((kid,index)=>{const cfg=children[kid],p=state.kids[kid],zone=zoneById(p.adventure.zoneId);return <article className="explorer-select-card" key={kid} style={{'--kid-color':cfg.color,'--delay':`${index*80}ms`} as CSSProperties}>
    <button className="explorer-portrait" onClick={()=>setEditing(kid)}><span>{p.avatar}</span>{p.equippedAccessory&&<b>{p.equippedAccessory}</b>}</button>
    <h2>{kid}</h2><small>{cfg.grade}</small>
    <div className="select-level"><span>LEVEL {p.adventure.level}</span><i><b style={{width:`${Math.min(100,(p.adventure.xp%180)/1.8)}%`}}/></i></div>
    <div className="select-current"><span>{zone.icon}</span><div><small>CURRENT EXPEDITION</small><strong>{zone.name}</strong></div></div>
    <div className="select-resources"><span>⚡ {p.adventure.energy}/12</span><span>🦪 {p.adventure.pearls}</span><span>⭐ {p.adventure.xp}</span></div>
    <button className="enter-expedition" onClick={()=>onSelect(kid)}>ENTER EXPEDITION <span>▶</span></button>
   </article>})}</section>
  <footer className="select-footer">World 1 · Ocean Expedition <span>•</span> Learning powers every adventure</footer>
  {editing&&<div className="modal-backdrop" onClick={()=>setEditing(null)}><section className="modal animated-pop" onClick={e=>e.stopPropagation()}><h2>Choose {editing}'s Explorer Avatar</h2><div className="avatar-grid">{avatars.map((a,i)=><button className="avatar-option" key={`${a}-${i}`} onClick={()=>{onAvatar(editing,a);setEditing(null)}}>{a}</button>)}</div><button className="secondary" onClick={()=>setEditing(null)}>Close</button></section></div>}
 </main>
}
