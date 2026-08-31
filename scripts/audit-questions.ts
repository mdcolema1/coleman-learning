import {children} from '../src/data/children'
import {masterPool} from '../src/data/questionFactory'
import {questionIssues} from '../src/engine/validation'
import type {KidName,Subject} from '../src/types'

const childrenNames=Object.keys(children) as KidName[]
let checked=0
const issues:string[]=[]
for(const child of childrenNames){
  for(const subject of children[child].subjects as Subject[]){
    if(['DailyReview','WeakSkills','WeeklyReview','MonthlyMastery','DailyChallenge','MasterChallenge'].includes(subject))continue
    for(let quiz=1;quiz<=5;quiz++){
      const pool=masterPool(child,subject,quiz,160)
      checked+=pool.length
      issues.push(...questionIssues(pool).map(x=>`${child}/${subject}/Q${quiz}: ${x}`))
    }
  }
}
const unique=[...new Set(issues)]
if(unique.length){
  console.error(`Question audit failed: ${unique.length} issue(s) across ${checked} generated questions.`)
  for(const item of unique.slice(0,120))console.error(` - ${item}`)
  if(unique.length>120)console.error(` - ...and ${unique.length-120} more`)
  process.exit(1)
}
console.log(`Question audit passed: ${checked} generated questions across all learners and subjects.`)
