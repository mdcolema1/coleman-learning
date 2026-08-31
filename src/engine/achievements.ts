import type {KidProgress} from '../types'
function add(p:KidProgress,id:string,title:string,icon:string,hidden=false){if(!p.achievements.some(a=>a.id===id))p.achievements.push({id,title,icon,earnedAt:Date.now(),hidden})}
export function evaluateAchievements(p:KidProgress){
 const total=p.records.reduce((a,r)=>a+r.totalQuestions,0),passed=p.records.filter(r=>r.passedAllowanceRule).length,perfect=p.records.some(r=>r.firstAttemptAccuracy===1),mastered=Object.values(p.mastery).filter(m=>m.status==='Mastered').length,treasures=p.adventure.treasureClaimed.length
 if(total>=100)add(p,'q100','100 Questions Answered','💯')
 if(total>=500)add(p,'q500','500 Questions Answered','🌟')
 if(total>=1000)add(p,'q1000','1,000 Questions Answered','🏆')
 if(passed>=5)add(p,'five-passed','Five Strong Quizzes','🏅')
 if(perfect)add(p,'perfect','Perfect First-Try Quiz','👑')
 if(mastered>=5)add(p,'five-mastered','Five Skills Mastered','🧠')
 if(mastered>=20)add(p,'twenty-mastered','Knowledge Collector','📚')
 if(p.adventure.level>=5)add(p,'reef-explorer','Coral Kingdom Explorer','🪸')
 if(p.adventure.level>=10)add(p,'trench-diver','Blue Trench Diver','🌌')
 if(treasures>=3)add(p,'treasure3','Treasure Hunter','🧰')
 if(p.dailyLearningStreak>=5)add(p,'streak5','Five-Day Learning Streak','🔥')
 if(p.dailyLearningStreak>=14)add(p,'streak14','Two-Week Learning Streak','🌠')
 if(p.adventure.world1Complete)add(p,'world1','Ocean Expedition Champion','🔱')
 for(const m of Object.values(p.mastery))if(m.status==='Mastered')add(p,`skill-${m.skill}`,`${m.skill} Mastery`,'🎓')
}
