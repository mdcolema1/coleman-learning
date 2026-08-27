import { useEffect, useMemo, useState } from 'react'
import HomeScreen from './components/HomeScreen'
import SubjectScreen from './components/SubjectScreen'
import QuizSelect from './components/QuizSelect'
import QuizScreen from './components/QuizScreen'
import ParentPortal from './components/ParentPortal'
import type { AppState, AttemptResult, KidName, Subject } from './types'
import { ensureWindowStarted, loadState, resetExpiredWindow, saveState, subjectCompleted } from './engine/storage'
import { generateQuiz } from './engine/quizEngine'
import { scoreResults } from './engine/scoring'

const BUILD='6.1.0'
type Screen='home'|'subjects'|'quizzes'|'quiz'|'parent'|'result'
export default function App(){
  const [state,setState]=useState<AppState>(()=>loadState())
  const [screen,setScreen]=useState<Screen>('home')
  const [kid,setKid]=useState<KidName|null>(null)
  const [subject,setSubject]=useState<Subject|null>(null)
  const [quiz,setQuiz]=useState(1)
  const [result,setResult]=useState<{accuracy:number;earned:number;passed:boolean;incorrect:number}|null>(null)

  useEffect(()=>{saveState(state)},[state])
  const questions=useMemo(()=>kid&&subject&&screen==='quiz'?generateQuiz(kid,subject,quiz):[],[kid,subject,quiz,screen])
  const mutate=(fn:(s:AppState)=>AppState)=>setState(s=>fn(structuredClone(s)))

  const selectKid=(k:KidName)=>{let next=resetExpiredWindow(state,k);next=ensureWindowStarted(next,k);setState(next);setKid(k);setScreen('subjects')}
  const selectSubject=(s:Subject)=>{setSubject(s);setScreen('quizzes')}
  const startQuiz=(q:number)=>{if(!kid||!subject)return;const done=subjectCompleted(state,kid,subject),count=(subject==='Science'||subject==='DigitalTime'||subject==='MasterChallenge')?1:5,cycleDone=done.length>=count;if(done.includes(q)&&!cycleDone)return;setQuiz(q);setResult(null);setScreen('quiz')}
  const finish=(results:AttemptResult[],bonus:number,total:number)=>{if(!kid||!subject)return;const scored=scoreResults(results,bonus),now=Date.now();mutate(s=>{let next=ensureWindowStarted(s,kid),p=next.kids[kid],completed=p.window.subjects[subject]?.completedQuizzes??[],count=(subject==='Science'||subject==='DigitalTime'||subject==='MasterChallenge')?1:5,cycleDone=completed.length>=count,firstCompletion=!completed.includes(quiz)&&!cycleDone;const earned=firstCompletion?scored.earned:0;if(firstCompletion){p.window.subjects[subject]={completedQuizzes:[...completed,quiz].sort((a,b)=>a-b)};if(scored.passed){p.bank=Number((p.bank+earned).toFixed(2));p.window.earnings=Number((p.window.earnings+earned).toFixed(2))}}p.records.push({id:`${kid}-${subject}-${quiz}-${now}`,child:kid,subject,quiz,completedAt:now,firstAttemptAccuracy:scored.accuracy,incorrectFirstAttempts:scored.incorrect,earned,passedAllowanceRule:scored.passed&&firstCompletion,totalQuestions:total});return next});setResult({...scored,earned:(!subjectCompleted(state,kid,subject).includes(quiz)?scored.earned:0)});setScreen('result')}

  return <div className={`app ${state.contrast}`}>
    {screen==='home'&&<HomeScreen state={state} onSelect={selectKid} onAvatar={(k,a)=>mutate(s=>{s.kids[k].avatar=a;return s})} onParent={()=>setScreen('parent')} onToggleContrast={()=>mutate(s=>{s.contrast=s.contrast==='dark'?'bright':'dark';return s})}/>} 
    {screen==='subjects'&&kid&&<SubjectScreen state={state} kid={kid} onSubject={selectSubject} onHome={()=>setScreen('home')}/>} 
    {screen==='quizzes'&&kid&&subject&&<QuizSelect state={state} kid={kid} subject={subject} onStart={startQuiz} onBack={()=>setScreen('subjects')}/>} 
    {screen==='quiz'&&kid&&subject&&<QuizScreen kid={kid} subject={subject} quiz={quiz} questions={questions} voiceName={state.preferredVoice} onExit={()=>setScreen('quizzes')} onFinish={finish}/>} 
    {screen==='parent'&&<ParentPortal state={state} onClose={()=>setScreen('home')} onVoice={v=>mutate(s=>{s.preferredVoice=v;return s})} onDeduct={(k,a)=>mutate(s=>{s.kids[k].bank=Math.max(0,Number((s.kids[k].bank-a).toFixed(2)));return s})}/>} 
    {screen==='result'&&result&&kid&&<main className="result-shell"><section className="result-card"><div className="result-emoji">{result.passed?'🏆':'📘'}</div><h1>{result.passed?'Allowance Earned':'Practice Complete'}</h1><p className="result-score">{Math.round(result.accuracy*100)}% first-attempt accuracy</p><p>{result.passed?`This quiz earned $${result.earned.toFixed(2)}.`:'80% first-attempt accuracy is required for allowance. This quiz earned $0.00.'}</p><p>Incorrect first attempts: {result.incorrect}</p><button className="primary" onClick={()=>setScreen('quizzes')}>Continue</button></section></main>}
    <div className="build-tag">v{BUILD}</div>
  </div>
}
