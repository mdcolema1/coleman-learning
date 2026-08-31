import type {KidName,Subject} from '../types'
import {subjectsForKid} from './learningCatalog'
export interface ChildConfig{name:KidName;grade:string;emoji:string;color:string;coreQuestions:number;subjects:Subject[]}
export const children:Record<KidName,ChildConfig>={Humberto:{name:'Humberto',grade:'Kindergarten',emoji:'🦖',color:'#4bb6e8',coreQuestions:20,subjects:subjectsForKid('Humberto')},Harmoni:{name:'Harmoni',grade:'1st Grade',emoji:'🦁',color:'#ef77ab',coreQuestions:20,subjects:subjectsForKid('Harmoni')},Faith:{name:'Faith',grade:'3rd Grade',emoji:'🦄',color:'#eea631',coreQuestions:25,subjects:subjectsForKid('Faith')},Angel:{name:'Angel',grade:'5th Grade',emoji:'🦊',color:'#8f79df',coreQuestions:25,subjects:subjectsForKid('Angel')}}
export const avatarOptions=['🦄','🦖','🦊','🦁','🐼','🐯','🐬','🐙','🦋','🐸','🐨','🐲','🤖','🧜‍♀️','🧙‍♀️','🦸‍♀️','👽','🐧','🦈','🐳','🐢','🦜','🐝','🦩','🦦','🐋','🦭','🐡','🪼','🦀','🦧','🦥','🦚','🦔','🦝','🐺','🦉','🦅','🐉']
