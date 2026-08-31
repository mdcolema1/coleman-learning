import {useEffect,useMemo,useRef,useState} from 'react'
import Phaser from 'phaser'
import type {AdventureSettings,KidName,KidProgress} from '../types'
import {zoneById} from '../data/adventure'
import {zoneObjectiveCount} from '../engine/adventure'
import {playSfx,startAmbient} from '../engine/audio'

interface Props{
  kid:KidName
  progress:KidProgress
  settings:AdventureSettings
  onObjective:(id:string,title:string)=>void
  onExit:()=>void
  onTreasure:()=>void
  onBoss:()=>void
  onLearn:()=>void
  onStore:()=>void
  onAquarium:()=>void
  onJournal:()=>void
  onCabin:()=>void
  onKnowledge:()=>void
  onSkills:()=>void
  onSettings:()=>void
}

type Landmark={id:string;name:string;kind:'checkpoint'|'npc'|'wreck'|'room';x:number;y:number;icon:string}

function pct(value:number,max:number){return `${Math.max(0,Math.min(100,(value/max)*100))}%`}

export default function AdventureGame({kid,progress,settings,onObjective,onExit,onTreasure,onBoss,onLearn,onStore,onAquarium,onJournal,onCabin,onKnowledge,onSkills,onSettings}:Props){
  const host=useRef<HTMLDivElement|null>(null)
  const game=useRef<Phaser.Game|null>(null)
  const [fallback,setFallback]=useState(false)
  const [selected,setSelected]=useState('Tap a glowing discovery marker to explore.')
  const zone=useMemo(()=>zoneById(progress.adventure.zoneId),[progress.adventure.zoneId])
  const objectiveCount=zoneObjectiveCount(progress,zone.id)
  const bossDefeated=progress.adventure.bossesDefeated.includes(zone.id)
  const bossReady=Boolean(zone.boss&&objectiveCount>=zone.boss.requiredObjectives&&!bossDefeated)
  const totalObjectives=zone.checkpoints.length+zone.npcs.length+zone.shipwrecks.reduce((n,s)=>n+s.rooms.length,0)
  const exploration=Math.min(100,Math.round((objectiveCount/Math.max(1,totalObjectives))*100))
  const activeMission=progress.adventure.missions.find(m=>!m.claimed&&!m.completed) ?? progress.adventure.missions[0]

  useEffect(()=>{if(settings.music<=0)return;return startAmbient(settings.music*.08)},[settings.music])

  useEffect(()=>{
    if(!host.current)return
    let active=true
    const completed=new Set(progress.adventure.completedObjectives)
    const landmarkData:Landmark[]=[]
    const width=Math.max(760,Math.min(1600,window.innerWidth))
    const height=Math.max(560,Math.min(1000,window.innerHeight))

    class OceanExpeditionScene extends Phaser.Scene{
      player!:Phaser.GameObjects.Container
      target={x:160,y:height-130}
      speed=settings.graphics==='low'?2.4:settings.graphics==='enhanced'?4.2:3.3
      pulseTargets:Phaser.GameObjects.Arc[]=[]
      constructor(){super('OceanExpedition')}

      makeGradient(){
        const g=this.add.graphics()
        g.fillGradientStyle(0x1fb9e8,0x13a6d6,0x023c66,0x00152c,1)
        g.fillRect(0,0,width,height)
        const deep=this.add.graphics()
        deep.fillStyle(0x001326,.28);deep.fillRect(0,height*.60,width,height*.40)
        for(let i=0;i<7;i++){
          const beam=this.add.graphics();beam.fillStyle(0xbdf5ff,.035+(i%3)*.012)
          beam.fillTriangle(i*180-80,0,i*180+90,0,i*180+220,height*.82)
          if(!settings.reducedEffects)this.tweens.add({targets:beam,x:{from:-18,to:18},duration:7000+i*400,yoyo:true,repeat:-1,ease:'Sine.easeInOut'})
        }
      }

      makeBubbles(){
        const count=settings.graphics==='enhanced'?54:settings.graphics==='standard'?32:16
        for(let i=0;i<count;i++){
          const r=1.5+(i%6)*.8
          const b=this.add.circle((i*97)%width,height-20-((i*43)%height),r,0xe6fbff,.26)
          b.setStrokeStyle(1,0xffffff,.28)
          if(!settings.reducedEffects)this.tweens.add({targets:b,y:-30,x:`+=${(i%2?1:-1)*(10+i%17)}`,duration:5200+(i%8)*650,repeat:-1,delay:(i%12)*190})
        }
      }

      makeSeafloor(){
        const floor=this.add.graphics()
        floor.fillStyle(0xb78a4e,1);floor.fillEllipse(width*.50,height+55,width*1.25,235)
        floor.fillStyle(0x9a713f,.7);floor.fillEllipse(width*.18,height+24,width*.44,100);floor.fillEllipse(width*.83,height+35,width*.55,128)
        for(let i=0;i<24;i++){
          const x=(i*151)%width,y=height-50-(i%4)*14
          const rock=this.add.ellipse(x,y,22+(i%5)*8,10+(i%3)*5,0x3f6070,.65)
          rock.setRotation((i%7)*.08)
        }
        for(let i=0;i<16;i++){
          const x=30+(i*79)%(width-60),base=height-66
          const coral=this.add.graphics()
          const coralColor=[0xff6b6b,0xff9f43,0xb66cff,0x34c98b,0xf65bb2][i%5]
          coral.lineStyle(7,coralColor,.85)
          coral.beginPath();coral.moveTo(x,base);coral.lineTo(x+(i%2?5:-5),base-24-(i%5)*6);coral.lineTo(x+12,base-39-(i%4)*5);coral.moveTo(x,base-16);coral.lineTo(x-14,base-31);coral.strokePath()
        }
        for(let i=0;i<12;i++){
          const x=50+(i*107)%(width-100),h=35+(i%5)*12
          const kelp=this.add.graphics();kelp.lineStyle(6,0x2fb26c,.72)
          kelp.beginPath();kelp.moveTo(x,height-58);kelp.lineTo(x-7,height-58-h*.45);kelp.lineTo(x+5,height-58-h);kelp.strokePath()
          if(!settings.reducedEffects)this.tweens.add({targets:kelp,angle:{from:-2,to:3},duration:1800+(i%4)*260,yoyo:true,repeat:-1})
        }
      }

      makeWreck(){
        const hasWreck=zone.shipwrecks.length>0
        if(!hasWreck)return
        const x=width*.66,y=height*.61
        const shadow=this.add.ellipse(x+55,y+118,360,55,0x00101c,.35)
        const hull=this.add.graphics()
        hull.fillStyle(0x593721,.95);hull.fillTriangle(x-145,y+45,x+165,y+10,x+100,y+115)
        hull.fillStyle(0x75482a,.92);hull.fillRect(x-112,y-35,228,94)
        hull.lineStyle(8,0x2d2018,.95)
        for(let i=0;i<7;i++)hull.lineBetween(x-104+i*34,y-32,x-80+i*31,y+83)
        hull.lineStyle(12,0x4a2d1b,.95);hull.lineBetween(x+18,y-42,x+18,y-185);hull.lineBetween(x+18,y-170,x+135,y-100)
        hull.fillStyle(0x0a2837,.9);for(let i=0;i<4;i++)hull.fillCircle(x-74+i*55,y+2,12)
        const algae=this.add.graphics();algae.lineStyle(5,0x2c9f69,.75)
        for(let i=0;i<8;i++){const ax=x-120+i*35;algae.beginPath();algae.moveTo(ax,y+76);algae.lineTo(ax-7,y+35-(i%3)*9);algae.strokePath()}
        if(!settings.reducedEffects)this.tweens.add({targets:[shadow,hull,algae],y:'+=2',duration:2600,yoyo:true,repeat:-1,ease:'Sine.easeInOut'})
      }

      makeFish(){
        const count=settings.graphics==='enhanced'?18:10
        for(let i=0;i<count;i++){
          const c=[0xf4d35e,0x4cc9f0,0xff7b7b,0x72dd8a,0x9b7cff][i%5]
          const fish=this.add.container((i*131)%width,110+(i*61)%(height-260))
          const body=this.add.ellipse(0,0,24+(i%4)*4,12+(i%3)*3,c,.85)
          const tail=this.add.triangle(-15,0,-8,0,-20,-8,-20,8,c,.75)
          fish.add([tail,body]);fish.setScale(.75+(i%3)*.12)
          if(!settings.reducedEffects)this.tweens.add({targets:fish,x:width+55,duration:9000+(i%7)*950,repeat:-1,delay:i*390,onRepeat:()=>{fish.x=-45;fish.y=110+Math.random()*(height-260)}})
        }
      }

      makePlayer(){
        const diver=this.add.container(145,height-128)
        const fins=this.add.graphics();fins.fillStyle(0x102d49,1);fins.fillTriangle(-21,26,-46,40,-25,17);fins.fillTriangle(-4,29,-25,48,-9,18)
        const body=this.add.ellipse(0,2,32,55,0x1a6da7,1)
        const tank=this.add.rectangle(-22,0,14,36,0xd7b14b,1)
        const head=this.add.circle(3,-35,17,0x8c552e,1)
        const helmet=this.add.circle(3,-35,22,0xbbeeff,.30).setStrokeStyle(4,0xdaf8ff,.9)
        const visor=this.add.arc(8,-37,11,190,350,false,0x0a4367,.75)
        const arm=this.add.rectangle(20,-2,28,8,0x8c552e,1).setRotation(.28)
        const light=this.add.circle(35,6,6,0xffe16a,.95)
        diver.add([fins,tank,body,head,helmet,visor,arm,light])
        const name=this.add.text(0,46,kid,{fontFamily:'system-ui',fontSize:'13px',fontStyle:'bold',color:'#fff',stroke:'#062c46',strokeThickness:4}).setOrigin(.5)
        diver.add(name);this.player=diver
        if(!settings.reducedEffects)this.tweens.add({targets:diver,scaleY:{from:.98,to:1.02},duration:950,yoyo:true,repeat:-1})
      }

      makeMarker(l:Landmark){
        const done=completed.has(l.id)
        const ring=this.add.circle(l.x,l.y,done?22:27,done?0x51d88a:0x63e7ff,done?.16:.10).setStrokeStyle(done?3:4,done?0x6ff5a6:0xb9f6ff,.95)
        this.pulseTargets.push(ring)
        const marker=this.add.circle(l.x,l.y,18,done?0x1c7d55:0x063e63,.92).setStrokeStyle(2,0xffffff,.78).setInteractive({useHandCursor:true})
        const symbol=this.add.text(l.x,l.y,done?'✓':l.icon,{fontFamily:'system-ui',fontSize:done?'19px':'23px',fontStyle:'bold',color:'#fff'}).setOrigin(.5)
        const label=this.add.text(l.x,l.y+34,l.name,{fontFamily:'system-ui',fontSize:'11px',fontStyle:'bold',color:'#fff',backgroundColor:'#022943cc',padding:{x:6,y:4},align:'center',wordWrap:{width:120}}).setOrigin(.5,0)
        ;[marker,symbol,label].forEach(o=>o.setDepth(7));ring.setDepth(6)
        const select=()=>{
          this.target={x:l.x,y:l.y+8};setSelected(`${done?'Already discovered':'Swimming to'} ${l.name}…`)
          this.time.delayedCall(600,()=>{if(!active)return;onObjective(l.id,`${l.kind==='npc'?'Met':l.kind==='room'?'Searched':l.kind==='wreck'?'Inspected':'Explored'} ${l.name}`);setSelected(done?`${l.name} is already in your Adventure Journal.`:`Discovered ${l.name}!`);playSfx('discover',settings.effects*.3)})
        }
        marker.on('pointerdown',select);symbol.setInteractive({useHandCursor:true}).on('pointerdown',select);label.setInteractive({useHandCursor:true}).on('pointerdown',select)
      }

      makeLandmarks(){
        const positions=[
          [width*.18,height*.64],[width*.31,height*.48],[width*.45,height*.70],[width*.57,height*.44],
          [width*.70,height*.67],[width*.82,height*.48],[width*.89,height*.70],[width*.52,height*.58],
          [width*.38,height*.57],[width*.74,height*.39],[width*.25,height*.74],[width*.61,height*.76]
        ]
        let n=0
        zone.checkpoints.forEach((name,i)=>{const [x,y]=positions[n++%positions.length];landmarkData.push({id:`cp-${zone.id}-${i}`,name,kind:'checkpoint',icon:'✦',x,y})})
        zone.npcs.forEach((npc)=>{const [x,y]=positions[n++%positions.length];landmarkData.push({id:`npc-${zone.id}-${npc.id}`,name:npc.name,kind:'npc',icon:npc.icon,x,y})})
        zone.shipwrecks.forEach(s=>{const [wx,wy]=positions[n++%positions.length];landmarkData.push({id:`wreck-${zone.id}-${s.id}`,name:s.name,kind:'wreck',icon:'⚓',x:wx,y:wy});s.rooms.forEach((room,ri)=>{const [x0,y0]=positions[n++%positions.length];const x=Math.max(width*.48,x0),y=Math.min(height*.72,y0+ri*8);landmarkData.push({id:`room-${zone.id}-${s.id}-${ri}`,name:room,kind:'room',icon:'◇',x,y})})})
        landmarkData.forEach(l=>this.makeMarker(l))
        if(!settings.reducedEffects)this.tweens.add({targets:this.pulseTargets,scale:{from:.88,to:1.18},alpha:{from:.75,to:.16},duration:1200,yoyo:true,repeat:-1,ease:'Sine.easeInOut'})
      }

      makeTreasure(){
        const x=width-92,y=height-104
        const glow=this.add.circle(x,y,42,0xffd35a,.13).setStrokeStyle(3,0xffec98,.75)
        const chest=this.add.text(x,y,'🧰',{fontSize:'48px'}).setOrigin(.5).setInteractive({useHandCursor:true})
        const tag=this.add.text(x,y+38,'TREASURE',{fontSize:'10px',fontStyle:'bold',color:'#fff',backgroundColor:'#6b3d04dd',padding:{x:7,y:4}}).setOrigin(.5)
        if(!settings.reducedEffects)this.tweens.add({targets:[glow,chest],scale:{from:.95,to:1.06},duration:1150,yoyo:true,repeat:-1})
        const find=()=>{this.target={x,y:y+10};setSelected('Searching the glowing treasure cache…');this.time.delayedCall(650,()=>{if(!active)return;onTreasure();setSelected('Treasure search complete!');playSfx('treasure',settings.effects*.35)})}
        chest.on('pointerdown',find);tag.setInteractive({useHandCursor:true}).on('pointerdown',find)
      }

      makeBoss(){
        if(!zone.boss)return
        const x=width-86,y=120
        const defeated=bossDefeated
        const ready=bossReady
        const aura=this.add.circle(x,y,44,ready?0xb263ff:0x325169,ready?.16:.10).setStrokeStyle(3,ready?0xdab3ff:0x7794aa,.75)
        const icon=this.add.text(x,y,defeated?'🏆':zone.boss.icon,{fontSize:'46px'}).setOrigin(.5)
        const label=this.add.text(x,y+49,defeated?'TRIAL COMPLETE':ready?'MASTERY TRIAL':'TRIAL LOCKED',{fontSize:'10px',fontStyle:'bold',color:'#fff',backgroundColor:ready?'#7135aadd':'#22394bdd',padding:{x:7,y:4}}).setOrigin(.5)
        if(ready&&!defeated){icon.setInteractive({useHandCursor:true});label.setInteractive({useHandCursor:true});const go=()=>{setSelected(`${zone.boss!.name}: Master Challenge ready.`);onBoss()};icon.on('pointerdown',go);label.on('pointerdown',go);if(!settings.reducedEffects)this.tweens.add({targets:aura,scale:{from:.9,to:1.16},alpha:{from:.9,to:.3},duration:1000,yoyo:true,repeat:-1})}
      }

      create(){
        this.makeGradient();this.makeBubbles();this.makeSeafloor();this.makeFish();this.makeWreck();this.makeLandmarks();this.makeTreasure();this.makeBoss();this.makePlayer()
        const title=this.add.text(width/2,18,zone.name.toUpperCase(),{fontFamily:'system-ui',fontSize:'26px',fontStyle:'bold',color:'#eefcff',stroke:'#073d61',strokeThickness:6}).setOrigin(.5,0).setDepth(20)
        this.add.text(width/2,52,zone.description,{fontFamily:'system-ui',fontSize:'12px',color:'#d9f7ff',backgroundColor:'#00314f99',padding:{x:8,y:5},wordWrap:{width:Math.min(620,width-260)},align:'center'}).setOrigin(.5,0).setDepth(20)
        this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.y<88||p.y>height-35)return;this.target={x:p.x,y:p.y}})
      }

      update(){
        if(!this.player)return
        const dx=this.target.x-this.player.x,dy=this.target.y-this.player.y,d=Math.hypot(dx,dy)
        if(d>4){this.player.x+=dx/d*this.speed;this.player.y+=dy/d*this.speed;this.player.rotation=Math.max(-.15,Math.min(.15,dy/350));this.player.scaleX=dx<0?-1:1}
      }
    }

    try{
      game.current=new Phaser.Game({type:settings.graphics==='low'?Phaser.CANVAS:Phaser.AUTO,parent:host.current,width,height,backgroundColor:'#05385c',scene:OceanExpeditionScene,render:{antialias:settings.graphics!=='low'},fps:{target:settings.graphics==='enhanced'?60:45}})
    }catch{
      setFallback(true)
    }
    return()=>{active=false;try{game.current?.destroy(true)}catch{}game.current=null}
  },[zone.id,settings.graphics,settings.reducedEffects,objectiveCount,progress.adventure.bossesDefeated.length])

  if(fallback)return <main className="page-shell adventure-fallback"><header className="page-header"><button className="secondary" onClick={onExit}>← Explorers</button><div><h1>{zone.icon} {zone.name}</h1><p>Accessible adventure fallback</p></div></header><section className="fallback-map">{zone.checkpoints.map((c,i)=><button key={c} onClick={()=>onObjective(`cp-${zone.id}-${i}`,`Explored ${c}`)}>✦ {c}</button>)}{zone.npcs.map(n=><button key={n.id} onClick={()=>onObjective(`npc-${zone.id}-${n.id}`,`Met ${n.name}`)}>{n.icon} {n.name}</button>)}{zone.shipwrecks.flatMap(s=>s.rooms.map((r,i)=><button key={`${s.id}-${r}`} onClick={()=>onObjective(`room-${zone.id}-${s.id}-${i}`,`Searched ${r}`)}>◇ {s.name}: {r}</button>))}<button onClick={onTreasure}>🧰 Search for Treasure</button>{bossReady&&<button onClick={onBoss}>🏆 Begin Mastery Trial</button>}</section></main>

  return <main className="expedition-v11">
    <div className="expedition-stage-v11"><div ref={host} className="phaser-host-v11"/></div>

    <header className="hud-top-v11">
      <button className="hud-home-v11" onClick={onExit}>☰</button>
      <div className="hud-profile-v11"><span className="hud-avatar-v11">{progress.avatar||'🧭'}</span><div><strong>{kid}</strong><small>LEVEL {progress.adventure.level} EXPLORER</small><i><b style={{width:pct(progress.adventure.xp%180,180)}}/></i></div></div>
      <div className="hud-pill-v11"><span>⚡</span><div><small>ENERGY</small><strong>{progress.adventure.energy}/12</strong></div></div>
      <div className="hud-pill-v11"><span>🦪</span><div><small>PEARLS</small><strong>{progress.adventure.pearls.toLocaleString()}</strong></div></div>
      <div className="hud-pill-v11"><span>🐚</span><div><small>SHELLS</small><strong>{progress.adventure.shells.toLocaleString()}</strong></div></div>
    </header>

    <aside className="mission-card-v11">
      <div className="mission-title-v11"><span>📜</span><div><small>CURRENT MISSION</small><strong>{activeMission?.title||'Ocean Expedition'}</strong></div></div>
      <p>{activeMission?.description||zone.story}</p>
      {activeMission&&<><div className="mission-progress-v11"><i style={{width:pct(activeMission.progress,activeMission.target)}}/></div><b>{Math.min(activeMission.progress,activeMission.target)} / {activeMission.target}</b></>}
      <div className="region-line-v11"><span>{zone.icon}</span><div><small>{zone.name}</small><strong>{exploration}% EXPLORED</strong></div></div>
    </aside>

    <aside className="discovery-card-v11">
      <span className="discovery-art-v11">⚓</span><small>EXPLORE & DISCOVER</small><strong>{zone.shipwrecks[0]?.name||zone.name}</strong>
      <div className="secret-row-v11"><span>✦ {objectiveCount}/{totalObjectives}</span><span>🧰 {progress.adventure.treasureClaimed.filter(id=>id.includes(zone.id)).length}</span></div>
      <div className="discovery-dots-v11">{Array.from({length:Math.min(6,totalObjectives)},(_,i)=><i key={i} className={i<objectiveCount?'found':''}>{i<objectiveCount?'✓':'?'}</i>)}</div>
      {zone.boss&&<button className={`trial-button-v11 ${bossReady?'ready':''} ${bossDefeated?'complete':''}`} disabled={!bossReady||bossDefeated} onClick={onBoss}>{bossDefeated?'🏆 TRIAL COMPLETE':bossReady?`${zone.boss.icon} START MASTERY TRIAL`:'🔒 MASTERY TRIAL LOCKED'}</button>}
    </aside>

    <div className="game-caption-v11">{selected}</div>

    <nav className="action-dock-v11">
      <button className="learn-action-v11" onClick={onLearn}><span>📘</span><strong>LEARN</strong><small>Power the expedition</small></button>
      <button onClick={onAquarium}><span>🐠</span><strong>AQUARIUM</strong></button>
      <button onClick={onStore}><span>🛍️</span><strong>STORE</strong></button>
      <button onClick={onJournal}><span>📔</span><strong>JOURNAL</strong></button>
      <button onClick={onCabin}><span>🛏️</span><strong>CABIN</strong></button>
      <button onClick={onKnowledge}><span>🧠</span><strong>KNOWLEDGE</strong></button>
      <button onClick={onSkills}><span>🌌</span><strong>SKILLS</strong></button>
      <button onClick={onSettings}><span>⚙️</span><strong>SETTINGS</strong></button>
    </nav>
  </main>
}
