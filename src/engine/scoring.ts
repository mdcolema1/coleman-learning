import type {AttemptResult} from '../types'
export const BASE_REWARD=.05,STREAK_BONUS=.05,PASS_THRESHOLD=.80
export function scoreResults(results:AttemptResult[],bonus:number){if(!results.length)return{accuracy:0,incorrect:0,passed:false,earned:0};const firstCorrect=results.filter(r=>r.firstAttemptCorrect).length,accuracy=firstCorrect/results.length,incorrect=results.length-firstCorrect,passed=accuracy>=PASS_THRESHOLD,earned=passed?Number((firstCorrect*BASE_REWARD+bonus).toFixed(2)):0;return{accuracy,incorrect,passed,earned}}
