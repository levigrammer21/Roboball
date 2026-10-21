// Emulator only: never connects to the user's production Firebase project.
import {initializeTestEnvironment,assertSucceeds as ok,assertFails as no} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,updateDoc,runTransaction,collection,getDocs,query,where} from 'firebase/firestore';
import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';
import {newGame,key,emptyPlan} from './engine.js';import {resolutionPatch,completedResult,validateSubmission,guardedTransaction} from './protocol.js';
const env=await initializeTestEnvironment({projectId:'demo-football-strategy',firestore:{host:'127.0.0.1',port:8080,rules:await readFile(new URL('./firestore.rules',import.meta.url),'utf8')}});
let passed=0;const check=async(name,fn)=>{await fn();passed++;console.log('PASS '+name);};
const a=env.authenticatedContext('alice').firestore(),b=env.authenticatedContext('bob').firestore(),x=env.authenticatedContext('outsider').firestore(),anon=env.unauthenticatedContext().firestore();
const ref=(db,id='ABCDEFG')=>doc(db,'games',id),pr=(db,round,uid)=>doc(db,'games','ABCDEFG','rounds',round,'plans',uid);
const transact=(db,work)=>guardedTransaction(cb=>runTransaction(db,async tx=>cb(tx,(await tx.get(ref(db))).data())),async()=>(await getDoc(ref(db))).data(),work);
const make=id=>({id,creator:'alice',members:['alice'],coaches:[{uid:'alice',name:'Alice',color:'#54ddad'}],status:'waiting',round:key(newGame()),state:newGame(),submitted:[],result:null,createdAt:1,finishedAt:0});
try{
 await env.clearFirestore();
 await check('anonymous access denied',async()=>{await no(setDoc(ref(anon),make('ABCDEFG')));await no(getDoc(ref(anon)));});
 await check('transaction reads nonexistent room then creates',async()=>{await ok(runTransaction(a,async tx=>{let d=await tx.get(ref(a));assert.equal(d.exists(),false);tx.set(ref(a),make('ABCDEFG'));}));});
 await check('open room lookup allowed, public listing denied',async()=>{await ok(getDoc(ref(b)));await no(getDocs(collection(x,'games')));});
 await check('joining appends the joining participant',async()=>{await ok(updateDoc(ref(b),{members:['alice','bob'],coaches:[{uid:'alice',name:'Alice',color:'#54ddad'},{uid:'bob',name:'Bob',color:'#ffb56d'}],status:'active'}));});
 await check('active state and replays private to participants',async()=>{await no(getDoc(ref(x)));await no(getDocs(collection(x,'games','ABCDEFG','rounds')));});
 await check('participant game query works',async()=>{let q=await ok(getDocs(query(collection(a,'games'),where('members','array-contains','alice'))));assert.equal(q.size,1);});
 await check('participants edit their own jersey numbers',async()=>{await ok(updateDoc(ref(a),{uniforms:{alice:[21,7,99]}}));await ok(updateDoc(ref(b),{uniforms:{alice:[21,7,99],bob:[3,8,12]}}));});
 await check('uniform numbers enforce ranges and uniqueness',async()=>{await no(updateDoc(ref(a),{uniforms:{alice:[7,7,12],bob:[3,8,12]}}));await no(updateDoc(ref(a),{uniforms:{alice:[-1,4,100],bob:[3,8,12]}}));});
 await check('opponents and outsiders cannot alter another uniform',async()=>{await no(updateDoc(ref(a),{uniforms:{alice:[21,7,99],bob:[4,8,12]}}));await no(updateDoc(ref(x),{uniforms:{alice:[1,2,3]}}));});
 const round=key(newGame());
 async function submit(db,uid,r=round){return transact(db,async(tx,g)=>{let p=validateSubmission(g,uid,r,emptyPlan()),old=await tx.get(pr(db,r,uid));if(old.exists())return;tx.set(pr(db,r,uid),{uid,round:r,plan:p});tx.update(ref(db),{submitted:[...g.submitted,uid]});});}
 await check('first committed plan stays secret',async()=>{await ok(submit(a,'alice'));await ok(getDoc(pr(a,round,'alice')));await no(getDoc(pr(b,round,'alice')));await no(getDoc(pr(x,round,'alice')));});
 await check('locked plans immutable and coach cannot impersonate opponent',async()=>{await no(setDoc(pr(a,round,'alice'),{uid:'alice',round,plan:emptyPlan()}));await no(setDoc(pr(a,round,'bob'),{uid:'bob',round,plan:emptyPlan()}));});
 await check('both committed plans readable after second submission',async()=>{await ok(submit(b,'bob'));await ok(getDoc(pr(b,round,'alice')));await ok(getDoc(pr(a,round,'bob')));});
 async function resolve(db){return transact(db,async(tx,g)=>{if(g.submitted.length!==2)return;let p0=(await tx.get(pr(db,g.round,'alice'))).data(),p1=(await tx.get(pr(db,g.round,'bob'))).data(),patch=resolutionPatch(g,g.round,[p0.plan,p1.plan]);if(!patch)return;let replay=patch.replay;delete patch.replay;tx.set(doc(db,'games','ABCDEFG','rounds',g.round),{...replay,revision:g.state.revision});tx.update(ref(db),patch);});}
 await check('concurrent resolvers advance exactly once',async()=>{await Promise.all([resolve(a),resolve(b)]);let g=(await getDoc(ref(a))).data();assert.equal(g.state.revision,1);assert.equal((await getDocs(collection(a,'games','ABCDEFG','rounds'))).size,1);await resolve(a);assert.equal((await getDoc(ref(a))).data().state.revision,1);});
 await check('archive and old plans immutable, old committed plans readable',async()=>{await no(setDoc(pr(a,round,'alice'),{uid:'alice',round,plan:emptyPlan()}));await no(updateDoc(doc(a,'games','ABCDEFG','rounds',round),{revision:999}));await ok(getDoc(pr(b,round,'alice')));});
 await check('stale submission rejected',async()=>{await no(setDoc(pr(a,round,'newuid'),{uid:'alice',round,plan:emptyPlan()}));});
 await check('concurrent submissions both persist',async()=>{let next=(await getDoc(ref(a))).data().round;await Promise.all([submit(a,'alice',next),submit(b,'bob',next)]);assert.equal((await getDoc(ref(a))).data().submitted.length,2);});
 await check('forfeit and immutable canonical result published atomically',async()=>{await ok(runTransaction(a,async tx=>{let g=(await tx.get(ref(a))).data(),result={score:g.state.score,stats:g.state.stats,winner:1,forfeit:true},next={...g,status:'completed',result,finishedAt:2};tx.update(ref(a),{status:'completed',result,finishedAt:2});tx.set(doc(a,'results','ABCDEFG'),completedResult(next));}));});
 await check('friend board requires auth, results cannot be changed',async()=>{await ok(getDoc(doc(x,'results','ABCDEFG')));await no(getDoc(doc(anon,'results','ABCDEFG')));await no(updateDoc(doc(a,'results','ABCDEFG'),{finishedAt:3}));await no(updateDoc(ref(a),{status:'active'}));});
 await check('only creator cancels an unjoined room',async()=>{await setDoc(ref(a,'CANCELX'),make('CANCELX'));await no(updateDoc(ref(x,'CANCELX'),{status:'cancelled'}));await ok(updateDoc(ref(a,'CANCELX'),{status:'cancelled'}));});
 await check('normal final down publishes one canonical completed result',async()=>{
  let id='NORMALX',g=make(id);g.members=['alice','bob'];g.coaches=[g.coaches[0],{uid:'bob',name:'Bob',color:'#ffb56d'}];g.status='active';g.state.possession=5;g.state.down=8;g.state.score=[7,0];g.state.stats[0].offensiveTD=1;g.round=key(g.state);g.submitted=['alice','bob'];
  await env.withSecurityRulesDisabled(async c=>{await setDoc(ref(c.firestore(),id),g);});
  await ok(runTransaction(a,async tx=>{let current=(await tx.get(ref(a,id))).data(),patch=resolutionPatch(current,current.round,[emptyPlan(),emptyPlan()]),replay=patch.replay;delete patch.replay;let next={...current,...patch,finishedAt:3};tx.set(doc(a,'games',id,'rounds',current.round),{...replay,revision:current.state.revision});tx.update(ref(a,id),{...patch,finishedAt:3});tx.set(doc(a,'results',id),completedResult(next));}));
  assert.equal((await getDoc(ref(a,id))).data().status,'completed');assert.equal((await getDoc(doc(a,'results',id))).data().result.winner,0);
 });
 console.log(`Security emulator checks: ${passed} passed.`);
}finally{await env.cleanup();}
