import type {KidName,Subject} from '../types'
export interface ChildConfig{name:KidName;grade:string;emoji:string;color:string;coreQuestions:number;subjects:Subject[]}
export const children:Record<KidName,ChildConfig>={
Humberto:{name:'Humberto',grade:'Kindergarten',emoji:'🦖',color:'#4bb6e8',coreQuestions:20,subjects:['Math','Reading','ShapesColors','Science','MasterChallenge']},
Harmoni:{name:'Harmoni',grade:'1st Grade',emoji:'🦁',color:'#ef77ab',coreQuestions:20,subjects:['Math','Reading','ShapesColors','SightWords','DigitalTime','Science','MasterChallenge']},
Faith:{name:'Faith',grade:'3rd Grade',emoji:'🦄',color:'#eea631',coreQuestions:25,subjects:['Math','Reading','Science','MasterChallenge']},
Angel:{name:'Angel',grade:'5th Grade',emoji:'🦊',color:'#8f79df',coreQuestions:25,subjects:['Math','Reading','Science','MasterChallenge']}}
export const avatarOptions=['🦄','🦖','🦊','🦁','🐼','🐯','🐬','🐙','🦋','🐸','🐨','🐲','🤖','🧜‍♀️','🧙‍♀️','🦸‍♀️','👽','🐧','🦈','🐳','🐢','🦜','🐝','🦩']
