// Football Strategy 1.0.0 — pure, deterministic shared engine. No clocks or random calls.
export const W=9,H=12;
export const DIR={U:[0,-1],D:[0,1],L:[-1,0],R:[1,0],S:[0,0]};
export const clone=x=>JSON.parse(JSON.stringify(x));
export const same=(a,b)=>a.x===b.x&&a.y===b.y;
export const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export const emptyPlan=()=>Array.from({length:3},()=>({}));
export const key=s=>`${s.possession}:${s.down}:${s.revision}`;
const blankStats=()=>({offensiveTD:0,defensiveTD:0,interceptions:0,strips:0});
export function formation(offense){return [0,1].flatMap(team=>[2,4,6].map((x,i)=>({id:`${team}-${i}`,team,n:i,x,y:team===offense?10:1,blocked:false})));}
export function newGame(){return {version:1,revision:0,possession:0,offense:0,down:1,score:[0,0],stats:[blankStats(),blankStats()],players:formation(0),carrier:'0-1',status:'active',winner:null};}
export function normalizePlan(plan){return Array.from({length:3},(_,t)=>Object.fromEntries(Object.entries(plan?.[t]||{}).filter(([id,a])=>/^[01]-[012]$/.test(id)&&a&&(DIR[a.type]||(a.type==='P'&&typeof a.target==='string'))).map(([id,a])=>[id,a.type==='P'?{type:'P',target:a.target}:{type:a.type}])));}
export function step(p,a){const [dx,dy]=DIR[a?.type]||DIR.S;return {x:Math.min(W-1,Math.max(0,p.x+dx)),y:Math.min(H-1,Math.max(0,p.y+dy))};}
// Supercover line between square centres. Exact corner: both side squares, then diagonal.
// Equal-distance side squares share t. In an interception tie, lowest player n wins.
export function passPath(a,b){
 const dx=b.x-a.x,dy=b.y-a.y,sx=Math.sign(dx),sy=Math.sign(dy),ax=Math.abs(dx),ay=Math.abs(dy);let x=a.x,y=a.y,ix=0,iy=0,out=[];
 const add=(x,y,t)=>{if(x>=0&&x<W&&y>=0&&y<H&&!out.some(c=>c.x===x&&c.y===y))out.push({x,y,t});};
 while(ix<ax||iy<ay){let tx=ax?(ix+.5)/ax:Infinity,ty=ay?(iy+.5)/ay:Infinity;
 if(Math.abs(tx-ty)<1e-9){add(x+sx,y,tx);add(x,y+sy,ty);x+=sx;y+=sy;ix++;iy++;add(x,y,tx);}
 else if(tx<ty){x+=sx;ix++;add(x,y,tx);}else{y+=sy;iy++;add(x,y,ty);}}
 return out;
}
// Conservative time-expanded search. Every opponent can use every turn to pursue;
// we ignore help from blockers, so only provably safe routes are accelerated.
export function safeRoute(runner,opponents,goal,budget=108){
 if(runner.y===goal)return [{x:runner.x,y:runner.y}];
 let queue=[{x:runner.x,y:runner.y,t:0,path:[{x:runner.x,y:runner.y}]}],seen=new Set([`${runner.x},${runner.y},0`]);
 for(let q=0;q<queue.length;q++){let cur=queue[q];if(cur.t>=budget)continue;
 for(const [dx,dy] of Object.values(DIR).slice(0,4)){let p={x:cur.x+dx,y:cur.y+dy},t=cur.t+1;if(p.x<0||p.x>=W||p.y<0||p.y>=H)continue;
 // Edge safety also excludes head-on swaps into the runner's previous square.
 if(opponents.some(d=>distance(d,p)<=t||distance(d,cur)<=t))continue;
 let k=`${p.x},${p.y},${t}`;if(seen.has(k))continue;seen.add(k);let path=[...cur.path,p];if(p.y===goal)return path;queue.push({...p,t,path});}}
 return null;
}
function snapshot(s){return {players:clone(s.players),carrier:s.carrier,score:[...s.score],offense:s.offense,down:s.down,possession:s.possession};}
function finishPossession(s){
 s.possession++;let paired=s.possession>=6&&s.possession%2===0;
 if(paired&&s.score[0]!==s.score[1]){s.status='completed';s.winner=s.score[0]>s.score[1]?0:1;return;}
 s.offense=s.possession%2;s.down=1;s.players=formation(s.offense);s.carrier=`${s.offense}-1`;
}
function td(s,team,defensive){s.score[team]+=7;s.stats[team][defensive?'defensiveTD':'offensiveTD']++;}
// Resolve all contact as sets, iterating cancellations to a fixed point.
// Contacting opponents keep their start squares, so pieces never stack.
export function movePhase(s,actions){
 const start=clone(s.players),dest=start.map(p=>p.blocked?{x:p.x,y:p.y}:step(p,actions[p.id])),contacts=new Set();let stripIds=new Set();
 for(let round=0;round<12;round++){
 let changed=false,cancel=new Set();
 for(let i=0;i<start.length;i++)for(let j=i+1;j<start.length;j++){
 let a=start[i],b=start[j];if(a.team!==b.team)continue;
 if(same(dest[i],dest[j])){cancel.add(i);cancel.add(j);}
 }
 for(let i of cancel){if(!same(dest[i],start[i])){dest[i]={x:start[i].x,y:start[i].y};changed=true;}}
 let hits=[];
 for(let i=0;i<start.length;i++)for(let j=i+1;j<start.length;j++){
 let a=start[i],b=start[j];if(a.team===b.team)continue;
 if(same(dest[i],dest[j])||(same(dest[i],b)&&same(dest[j],a))){hits.push([i,j]);}}
 for(let [i,j] of hits){let a=start[i],b=start[j],ball=a.id===s.carrier?a:b.id===s.carrier?b:null;
 if(ball&&ball.team===s.offense)stripIds.add((a.team===s.offense?b:a).id);
 contacts.add(i);contacts.add(j);
 for(let k of [i,j])if(!same(dest[k],start[k])){dest[k]={x:start[k].x,y:start[k].y};changed=true;}}
 if(!changed)break;
 }
 s.players=start.map((p,i)=>({...p,...dest[i],blocked:p.blocked||contacts.has(i)}));
 const strip=[...stripIds].sort()[0]||null;
 return {strip,blocked:[...contacts].map(i=>start[i].id)};
}
export function resolveDown(input,rawPlans){
 if(input.status!=='active')throw Error('Game is not active');
 const s=clone(input),plans=rawPlans.map(normalizePlan),events=[];s.players.forEach(p=>p.blocked=false);let used=false,ended=false;
 const emit=(type,turn,extra={})=>events.push({type,turn,...extra,state:snapshot(s)});
 const takeaway=(id,type,turn)=>{let d=s.players.find(p=>p.id===id);s.carrier=id;s.stats[d.team][type==='interception'?'interceptions':'strips']++;emit(type,turn,{player:id});let route=safeRoute(d,s.players.filter(p=>p.team!==d.team),11);if(route){d.x=route.at(-1).x;d.y=11;td(s,d.team,true);emit('returnTD',turn,{route,player:id});}ended=true;};
 const checkScore=(turn,remaining)=>{let r=s.players.find(p=>p.id===s.carrier);if(r.y===0){td(s,s.offense,false);emit('touchdown',turn,{player:r.id});ended=true;return;}
 let route=safeRoute(r,s.players.filter(p=>p.team!==r.team),0,remaining);if(route){r.x=route.at(-1).x;r.y=0;td(s,s.offense,false);emit('breakaway',turn,{route,player:r.id});ended=true;}};
 emit('start',0);
 for(let t=0;t<3&&!ended;t++){
 const acts=Object.assign({},plans[0][t],plans[1][t]);
 // Discard instructions for other team's players (also enforced by backend validation).
 for(const p of s.players)acts[p.id]=plans[p.team][t][p.id]||{type:'S'};
 const thrower=s.players.find(p=>p.id===s.carrier),a=acts[thrower.id];
 let receiver=a?.type==='P'&&!used&&!thrower.blocked?s.players.find(p=>p.id===a.target&&p.team===s.offense&&p.id!==thrower.id):null;
 let from=clone(thrower),target=receiver?clone(receiver):null;
 let first=clone(acts);if(receiver){used=true;first[thrower.id]={type:'S'};first[receiver.id]={type:'S'};}
 const contact=movePhase(s,first);emit('move',t+1,{blocked:contact.blocked});
 if(contact.strip){takeaway(contact.strip,'strip',t+1);break;}
 if(receiver){let cells=passPath(from,target),hits=s.players.filter(p=>p.team!==s.offense).map(p=>({p,c:cells.find(c=>same(c,p))})).filter(v=>v.c).sort((a,b)=>a.c.t-b.c.t||a.p.n-b.p.n);
 if(hits.length){emit('pass',t+1,{from:{x:from.x,y:from.y},to:{x:hits[0].p.x,y:hits[0].p.y},path:cells,intercepted:true});takeaway(hits[0].p.id,'interception',t+1);break;}
 s.carrier=receiver.id;emit('pass',t+1,{from:{x:from.x,y:from.y},to:{x:target.x,y:target.y},path:cells});
 let second=Object.fromEntries(s.players.map(p=>[p.id,{type:'S'}]));second[receiver.id]=acts[receiver.id];let c2=movePhase(s,second);emit('receiveMove',t+1,{blocked:c2.blocked});if(c2.strip){takeaway(c2.strip,'strip',t+1);break;}}
 // Contact always precedes scoring; an end-zone collision is a takeaway.
 checkScore(t+1,(8-s.down)*3+2-t);emit('turnEnd',t+1);
 }
 if(!ended&&s.down===8){emit('expired',3);ended=true;}
 if(ended){finishPossession(s);emit(s.status==='completed'?'final':'possession',3);}else{s.down++;s.players.forEach(p=>p.blocked=false);emit('down',3);}
 s.revision++;return {state:s,replay:{id:key(input),before:clone(input),events,after:clone(s)}};
}
export function projectPlan(state,team,raw,through=3){
 const s=clone(state),plan=normalizePlan(raw);let used=false;s.players=s.players.filter(p=>p.team===team).map(p=>({...p,blocked:false}));
 for(let t=0;t<through;t++){
 let carrier=s.players.find(p=>p.id===s.carrier),a=carrier&&plan[t][carrier.id];
 if(a?.type==='P'&&!used){let r=s.players.find(p=>p.id===a.target&&p.id!==carrier.id);if(r){s.carrier=r.id;used=true;}}
 const intents=s.players.map(p=>p.id===carrier?.id&&a?.type==='P'?{x:p.x,y:p.y}:step(p,plan[t][p.id]));
 for(let z=0;z<4;z++)for(let i=0;i<intents.length;i++)for(let j=i+1;j<intents.length;j++)if(same(intents[i],intents[j])){intents[i]={x:s.players[i].x,y:s.players[i].y};intents[j]={x:s.players[j].x,y:s.players[j].y};}
 s.players.forEach((p,i)=>Object.assign(p,intents[i]));
 }return {...s,throwUsed:used};
}
// The coach reads public positions only. Offense uses a weighted route search and
// looks for a forward pass; defense pursues one runner and marks two receivers.
export function computerPlan(state,team,seed=0){
 let s=clone(state),plan=emptyPlan(),used=false;
 const offense=team===s.offense;
 function routeFirst(r,foes,occupied){
  let queue=[{x:r.x,y:r.y,c:0,first:'S'}],best=new Map([[`${r.x},${r.y}`,0]]);
  while(queue.length){queue.sort((a,b)=>a.c-b.c);let cur=queue.shift();if(cur.y===0)return cur.first;
   let dirs=['U',seed%2?'R':'L',seed%2?'L':'R','D'];
   for(let type of dirs){let p=step(cur,{type});if(same(cur,p))continue;
    let danger=foes.reduce((v,d)=>v+(distance(d,p)===0?100:distance(d,p)===1?18:distance(d,p)===2?5:0),0);
    let c=cur.c+1+danger+(occupied.some(v=>same(v,p))?6:0),k=`${p.x},${p.y}`;
    if(c>=(best.get(k)??Infinity))continue;best.set(k,c);queue.push({...p,c,first:cur.first==='S'?type:cur.first});}
  }return 'S';
 }
 for(let t=0;t<3;t++){
  let own=s.players.filter(p=>p.team===team),foes=s.players.filter(p=>p.team!==team),ball=s.players.find(p=>p.id===s.carrier),claimed=[];
  let order=offense?[...own].sort((a,b)=>(a.id===ball.id?-1:b.id===ball.id?1:a.n-b.n)):own;
  for(let p of order){let type;
   if(offense){
    if(p.id===ball.id)type=routeFirst(p,foes,own.filter(v=>v.id!==p.id));
    else {let lane=p.n===0?(seed%3):8-(seed%3),goal={x:lane,y:0};let options=Object.keys(DIR).map(type=>({type,pos:step(p,{type})}));options.sort((a,b)=>distance(a.pos,goal)-distance(b.pos,goal)||Object.keys(DIR).indexOf(a.type)-Object.keys(DIR).indexOf(b.type));type=options.find(o=>!claimed.some(v=>same(v,o.pos)))?.type||'S';}
   }else {let mark=foes.find(v=>v.n===p.n)||ball;if(seed%3===0&&p.n===0)mark=ball;let goal=p.n===1?{x:ball.x,y:Math.max(0,ball.y-1)}:{x:mark.x,y:mark.y};let options=Object.keys(DIR).map(type=>({type,pos:step(p,{type})}));options.sort((a,b)=>distance(a.pos,goal)-distance(b.pos,goal)||((Object.keys(DIR).indexOf(a.type)+seed+t)%5)-((Object.keys(DIR).indexOf(b.type)+seed+t)%5));type=options.find(o=>!claimed.some(v=>same(v,o.pos)))?.type||'S';}
   plan[t][p.id]={type};claimed.push(step(p,{type}));
  }
  if(offense&&!used){let receivers=own.filter(p=>p.id!==ball.id&&p.y<ball.y-1).sort((a,b)=>a.y-b.y||a.n-b.n);let r=receivers.find(r=>!passPath(ball,r).some(c=>foes.some(d=>distance(d,c)<=1)));if(r){plan[t][ball.id]={type:'P',target:r.id};used=true;}}
  const proj=projectPlan(s,team,[plan[t],{},{}],1);for(let p of proj.players)Object.assign(s.players.find(v=>v.id===p.id),p);s.carrier=proj.carrier;
 }return plan;
}
export function recordsFromGames(games){
 const table={};for(const g of games){if(g.status!=='completed'||!g.result)continue;let r=g.result;
 for(let i=0;i<2;i++){let uid=g.members[i],opp=g.members[1-i];if(!uid||!opp)continue;
 let row=table[uid]||=( {uid,name:g.coaches[i].name,color:g.coaches[i].color,games:0,wins:0,losses:0,pointsFor:0,pointsAgainst:0,offensiveTD:0,defensiveTD:0,interceptions:0,strips:0,h2h:{}} );
 row.games++;row[r.winner===i?'wins':'losses']++;row.pointsFor+=r.score[i];row.pointsAgainst+=r.score[1-i];for(let k of ['offensiveTD','defensiveTD','interceptions','strips'])row[k]+=r.stats[i][k];let h=row.h2h[opp]||={name:g.coaches[1-i].name,wins:0,losses:0};h[r.winner===i?'wins':'losses']++;
 }}return Object.values(table).sort((a,b)=>b.wins-a.wins||a.losses-b.losses||(b.pointsFor-b.pointsAgainst)-(a.pointsFor-a.pointsAgainst)||a.uid.localeCompare(b.uid));
}
