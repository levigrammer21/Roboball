import {key,normalizePlan,resolveDown,clone} from './engine.js';
export function validateSubmission(game,uid,round,plan){
 if(game.status!=='active'||!game.members.includes(uid))throw Error('Not an active participant');
 if(game.round!==round||key(game.state)!==round)throw Error('This down has already advanced. Your draft was not submitted.');
 let team=game.members.indexOf(uid),p=normalizePlan(plan);
 for(const turn of p)for(const id of Object.keys(turn))if(!id.startsWith(`${team}-`))throw Error('You can only program your team.');
 return p;
}
export function resolutionPatch(game,round,plans){
 if(game.status!=='active'||game.round!==round||game.submitted.length!==2)return null;
 const {state,replay}=resolveDown(game.state,plans);
 return {state,replay,round:key(state),status:state.status,submitted:[],result:state.status==='completed'?{score:state.score,stats:state.stats,winner:state.winner,forfeit:false}:null};
}
export function completedResult(g){return {gameId:g.id,members:g.members,coaches:g.coaches,status:'completed',result:clone(g.result),createdAt:g.createdAt||0,finishedAt:g.finishedAt||0};}
// Some SDK/emulator rule checks report a stale concurrent write as permission-denied
// before the SDK's usual ABORTED retry. Retry only when the canonical game changed;
// a genuine rules denial against the same game is surfaced immediately.
export const transactionFingerprint=g=>g?`${g.round}|${g.status}|${g.submitted.join(',')}`:'missing';
export async function guardedTransaction(run,readLatest,work){
 for(let attempt=0;attempt<5;attempt++){let observed;
  try{return await run(async(tx,g)=>{observed=transactionFingerprint(g);return work(tx,g);});}
  catch(e){if(!['permission-denied','aborted'].includes(e.code)||attempt===4)throw e;
   if(transactionFingerprint(await readLatest())===observed)throw e;}
 }
}
