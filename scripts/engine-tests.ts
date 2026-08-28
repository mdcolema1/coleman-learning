import assert from 'node:assert/strict'
import {scoreResults} from '../src/engine/scoring'
import {updateSkill,statusFor} from '../src/engine/mastery'
import {initialState} from '../src/engine/storage'
import {applyLearningAdventure,advanceZoneIfReady,canAttemptBoss,completeObjective,defeatBoss,spendEnergy,zoneExplorationComplete,zoneRequiredObjectiveIds} from '../src/engine/adventure'
import {evaluateFamilyAchievements} from '../src/engine/familyAchievements'
import {generateQuiz} from '../src/engine/quizEngine'
import {questionIssues} from '../src/engine/validation'
import type {AttemptResult} from '../src/types'
const rules={basePerFirstCorrect:.05,streakBonus:.05,streakEvery:3,passThreshold:.8,incorrectDeduction:.05,challengeBonus:.10,progressiveStreak:true,maxStreakTier:4}
const attempts:AttemptResult[]=Array.from({length:10},(_,i)=>({questionId:`q${i}`,skill:'Test Skill',firstAttemptCorrect:i<8,eventuallyCorrect:true,attempts:i<8?1:2}))
const scored=scoreResults(attempts,0,rules);assert.equal(scored.passed,true);assert.equal(scored.accuracy,.8);assert.equal(scored.earned,.4);assert.equal(scoreResults(attempts.map((r,i)=>({...r,firstAttemptCorrect:i<7})),0,rules).passed,false)
let mastery=undefined as any;for(let i=0;i<7;i++)mastery=updateSkill(mastery,{questionId:`m${i}`,skill:'Repeated Retrieval',firstAttemptCorrect:true,eventuallyCorrect:true,attempts:1,responseMs:1800});assert.ok(mastery.score>=90);assert.ok(['Mastered','Review Due'].includes(statusFor(mastery.score,mastery.nextReviewAt)));assert.ok(mastery.successfulSessions>=3)
const state=initialState(),p=state.kids.Harmoni;assert.equal(p.adventure.energy,0);applyLearningAdventure(p,'Reading',12,true);assert.equal(p.adventure.energy,3);assert.ok(p.adventure.pearls>=2);assert.equal(spendEnergy(p,2),true);assert.equal(p.adventure.energy,1)
// XP alone may not skip Sunlit Shores.
p.adventure.xp=2000;p.adventure.level=20;advanceZoneIfReady(p);assert.equal(p.adventure.zoneId,'sunlit-shores')
for(const id of zoneRequiredObjectiveIds('sunlit-shores'))p.adventure.completedObjectives.push(id);assert.equal(zoneExplorationComplete(p,'sunlit-shores'),true);advanceZoneIfReady(p);assert.equal(p.adventure.zoneId,'coral-kingdom')
p.adventure.zoneId='wreckers-cove';for(const id of zoneRequiredObjectiveIds('wreckers-cove').slice(0,4))if(!p.adventure.completedObjectives.includes(id))p.adventure.completedObjectives.push(id);assert.equal(canAttemptBoss(p,'wreckers-cove'),true);assert.equal(defeatBoss(p,'wreckers-cove','Harmoni'),true);assert.ok(p.adventure.bossesDefeated.includes('wreckers-cove'))
for(const kid of Object.values(state.kids))kid.records.push({id:`r-${Math.random()}`,child:'Harmoni',subject:'Math',quiz:1,completedAt:Date.now(),firstAttemptAccuracy:1,incorrectFirstAttempts:0,earned:0,passedAllowanceRule:true,totalQuestions:20,xp:20,masteryDelta:1});evaluateFamilyAchievements(state);assert.ok(state.familyAchievements.some(a=>a.id==='family-first-expedition'))
for(const child of ['Humberto','Harmoni','Faith','Angel'] as const){for(const subject of ['Math','Reading','Science','DailyReview','WeeklyReview','MasterChallenge'] as const){const qs=generateQuiz(child,subject,1,{});assert.ok(qs.length>0,`${child}/${subject} generated no questions`);assert.deepEqual(questionIssues(qs),[],`${child}/${subject} produced invalid questions`)}}
console.log('Engine tests passed: scoring, mastery, adventure energy, gated region progression, boss trials, family achievements, and representative quiz generation.')
