import assert from 'node:assert/strict';import {newGame,resolveDown,computerPlan} from './engine.js';
let count=0,downs=0,ot=0,max=0,rng=123456789;const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
for(let seed=0;seed<120;seed++){let s=newGame(),rounds=0;
 while(s.status==='active'&&rounds<400){let plans=[computerPlan(s,0,seed%7),computerPlan(s,1,(seed*3+s.revision)%11)];for(let team=0;team<2;team++)for(let turn of plans[team])for(let id in turn)if(random()<.22)turn[id]={type:['U','D','L','R','S'][Math.floor(random()*5)]};let result=resolveDown(s,plans);s=result.state;rounds++;downs++;
 assert.equal(s.revision,rounds);assert.equal(s.players.length,6);assert.equal(new Set(s.players.map(p=>`${p.x},${p.y}`)).size,6,'stacked players');for(let p of s.players){assert.ok(p.x>=0&&p.x<9&&p.y>=0&&p.y<12);}
 assert.ok(s.down>=1&&s.down<=8);assert.ok(s.score.every(v=>v>=0&&v%7===0));assert.ok(s.players.some(p=>p.id===s.carrier));assert.equal(s.stats[0].offensiveTD*7+s.stats[0].defensiveTD*7,s.score[0]);assert.equal(s.stats[1].offensiveTD*7+s.stats[1].defensiveTD*7,s.score[1]);}
 // No arbitrary overtime cap is imposed by the game; a deterministic mirrored AI can tie forever.
 if(s.status==='completed'){count++;assert.ok(s.possession>=6&&s.possession%2===0);assert.notEqual(s.score[0],s.score[1]);}else ot++;
 max=Math.max(max,rounds);
}
console.log(JSON.stringify({simulations:120,completed:count,stillTiedAt400DownSafetyLimit:ot,downsChecked:downs,maxDowns:max}));
