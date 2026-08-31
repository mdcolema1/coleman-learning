const DB='coleman-learning-audio',STORE='clips',VERSION=1
function db():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,VERSION);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function saveClip(id:string,blob:Blob){const d=await db();await new Promise<void>((resolve,reject)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put(blob,id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
export async function getClip(id:string):Promise<Blob|null>{const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction(STORE,'readonly').objectStore(STORE).get(id);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})}
export async function deleteClip(id:string){const d=await db();await new Promise<void>((resolve,reject)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
export async function hasClip(id:string){return !!(await getClip(id))}
export async function playClip(id:string,volume=1){const b=await getClip(id);if(!b)return false;const url=URL.createObjectURL(b),a=new Audio(url);a.volume=volume;a.onended=()=>URL.revokeObjectURL(url);await a.play();return true}
