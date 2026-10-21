import {newGame,key} from './engine.js';
import {validateSubmission,resolutionPatch,completedResult,guardedTransaction} from './protocol.js';
export const firebaseConfig={apiKey:'AIzaSyBOdWtkh5akzvlPABTxDwpZXR9usS-UOBg',authDomain:'footballstratagy.firebaseapp.com',projectId:'footballstratagy',storageBucket:'footballstratagy.firebasestorage.app',messagingSenderId:'762483899216',appId:'1:762483899216:web:00c1c89a5cfa77f98b0a55'};
let api;
export async function connect(){
 if(api)return api;
 const base='https://www.gstatic.com/firebasejs/12.4.0/';
 const [A,F,U]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-firestore.js'),import(base+'firebase-auth.js')]);
 const app=A.initializeApp(firebaseConfig),db=F.getFirestore(app),auth=U.getAuth(app);
 const ref=id=>F.doc(db,'games',id),rr=(id,round)=>F.doc(db,'games',id,'rounds',round),pr=(id,round,uid)=>F.doc(db,'games',id,'rounds',round,'plans',uid);
 const transact=(id,work)=>guardedTransaction(cb=>F.runTransaction(db,async tx=>{let snap=await tx.get(ref(id));return cb(tx,snap.exists()?snap.data():null);}),async()=>{let snap=await F.getDoc(ref(id));return snap.exists()?snap.data():null;},work);
 const profile=(user,p)=>({uid:user.uid,name:String(p.name||'Coach').trim().slice(0,24)||'Coach',color:/^#[0-9a-f]{6}$/i.test(p.color)?p.color:'#54ddad'});
 async function publish(tx,g){tx.set(F.doc(db,'results',g.id),completedResult(g));}
 api={auth,
 onAuth:cb=>U.onAuthStateChanged(auth,cb),
 async account(email,password,signup){return signup?U.createUserWithEmailAndPassword(auth,email,password):U.signInWithEmailAndPassword(auth,email,password);},
 signOut:()=>U.signOut(auth),reset:email=>U.sendPasswordResetEmail(auth,email),
 async saveProfile(p){let v=profile(auth.currentUser,p);await F.setDoc(F.doc(db,'profiles',v.uid),v);return v;},
 async getProfile(){let d=await F.getDoc(F.doc(db,'profiles',auth.currentUser.uid));return d.exists()?d.data():null;},
 async create(p){let uid=auth.currentUser.uid;
 for(let attempt=0;attempt<6;attempt++){let bytes=crypto.getRandomValues(new Uint8Array(7));let code=Array.from(bytes,n=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n%32]).join('');let g={id:code,members:[uid],coaches:[profile(auth.currentUser,p)],creator:uid,status:'waiting',round:key(newGame()),state:newGame(),submitted:[],result:null,createdAt:Date.now(),finishedAt:0};
 try{await F.runTransaction(db,async tx=>{let snap=await tx.get(ref(code));if(snap.exists())throw Error('Code collision');tx.set(ref(code),g);});return code;}catch(e){if(e.message==='Code collision')continue;throw e;}}
 throw Error('Could not allocate a room. Try again.');},
 async join(code,p){code=code.toUpperCase().replace(/[^A-Z2-9]/g,'');if(code.length!==7)throw Error('Enter the seven-character room code.');
 await F.runTransaction(db,async tx=>{let snap=await tx.get(ref(code));if(!snap.exists())throw Error('Room not found');let g=snap.data(),uid=auth.currentUser.uid;if(g.members.includes(uid))return;if(g.status!=='waiting'||g.members.length!==1)throw Error('That room is no longer open.');tx.update(ref(code),{members:[...g.members,uid],coaches:[...g.coaches,profile(auth.currentUser,p)],status:'active'});});return code;},
 watchGame:(id,cb,error)=>F.onSnapshot(ref(id),{includeMetadataChanges:true},s=>cb(s.exists()?{...s.data(),cached:s.metadata.fromCache}:null),error),
 watchGames:(uid,cb,error)=>F.onSnapshot(F.query(F.collection(db,'games'),F.where('members','array-contains',uid)),s=>cb(s.docs.map(d=>d.data()).sort((a,b)=>b.createdAt-a.createdAt)),error),
 watchResults:(cb,error)=>F.onSnapshot(F.collection(db,'results'),s=>cb(s.docs.map(d=>d.data())),error),
 async submit(id,round,plan){let uid=auth.currentUser.uid;
 await transact(id,async(tx,g)=>{if(!g)throw Error('Room not found');let p=validateSubmission(g,uid,round,plan),old=await tx.get(pr(id,round,uid));if(old.exists())return;tx.set(pr(id,round,uid),{uid,round,plan:p});tx.update(ref(id),{submitted:[...g.submitted,uid]});});
 await api.resolve(id);},
 async resolve(id){return transact(id,async(tx,g)=>{if(!g)return;if(g.status!=='active'||g.submitted.length!==2)return;
 let a=await tx.get(pr(id,g.round,g.members[0])),b=await tx.get(pr(id,g.round,g.members[1]));if(!a.exists()||!b.exists())return;
 let patch=resolutionPatch(g,g.round,[a.data().plan,b.data().plan]);if(!patch)return;const replay=patch.replay;delete patch.replay;
 tx.set(rr(id,g.round),{...replay,revision:g.state.revision});let next={...g,...patch,finishedAt:patch.status==='completed'?Date.now():0};tx.update(ref(id),patch.status==='completed'?{...patch,finishedAt:next.finishedAt}:patch);if(next.status==='completed')await publish(tx,next);});},
 async ownPlan(id,round){let s=await F.getDoc(pr(id,round,auth.currentUser.uid));return s.exists()?s.data().plan:null;},
 async replays(id){let s=await F.getDocs(F.collection(db,'games',id,'rounds'));return s.docs.map(d=>d.data()).sort((a,b)=>a.revision-b.revision);},
 async cancel(id){await F.runTransaction(db,async tx=>{let s=await tx.get(ref(id)),g=s.data();if(g.creator!==auth.currentUser.uid||g.status!=='waiting')throw Error('Only an unjoined room can be cancelled.');tx.update(ref(id),{status:'cancelled'});});},
 async resign(id){await transact(id,async(tx,g)=>{if(!g)return;let team=g.members.indexOf(auth.currentUser.uid);if(g.status!=='active'||team<0)return;let next={...g,status:'completed',finishedAt:Date.now(),result:{score:g.state.score,stats:g.state.stats,winner:1-team,forfeit:true}};tx.update(ref(id),{status:next.status,finishedAt:next.finishedAt,result:next.result});await publish(tx,next);});}
 };
 return api;
}
