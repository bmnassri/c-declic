'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {Pool}=require('pg');
const budget=require('../budget');
const enabled=process.env.CDECLIC_INTEGRATION==='1';
const url='postgresql://cd_test:cd_test_only@127.0.0.1:5432/cd_test';
let pool,server,base,student,teacher,other;
const month=new Date().toISOString().slice(0,7);
const nativeFetch=global.fetch;
let mode='ok',calls=[];
const fixture={notion:'Boucles',enonce:'Exercice fictif',code:'int main(void){return 0;}',erreur:'',question:'Pourquoi ?',fictif:true};
const answer={diagnostic:'Diagnostic réservé',question:'Que remarques-tu ?',indice:'Observe la condition.'};
before(async()=>{
 if(!enabled)return;
 assert.equal(process.env.CDECLIC_TEST_DATABASE_URL,url,'Base locale de test obligatoire');
 Object.assign(process.env,{DATABASE_URL:url,ANTHROPIC_API_KEY:'fake-test-key',ANTHROPIC_MODEL:'test-model',AI_BUDGET_MODEL:'test-model',AI_INPUT_EUR_PER_MTOK:'4',AI_OUTPUT_EUR_PER_MTOK:'20',AI_INPUT_TOKEN_CEILING:'16000',AI_MONTHLY_ATTEMPT_LIMIT:'40',AI_PILOT_ENABLED:'true',SUPERVISION_PILOT_ENABLED:'true',APP_PASSWORD:'test-student-only',TEACHER_PASSWORD:'test-teacher-only',SESSION_SECRET:'test-only-not-production-1234567890',NODE_ENV:'test'});
 delete process.env.RAILWAY_ENVIRONMENT;delete process.env.RAILWAY_PUBLIC_DOMAIN;
 pool=new Pool({connectionString:url,max:8});
 await budget.snapshot(pool,month);
 await pool.query('TRUNCATE ai_pilot_quota');
 global.fetch=async(u,o)=>{
  const s=String(u);
  assert.ok(s==='https://api.anthropic.com/v1/messages/count_tokens'||s==='https://api.anthropic.com/v1/messages','Unexpected outbound fetch');
  const body=JSON.parse(o.body);calls.push({url:s,body});
  if(s.endsWith('count_tokens'))return Response.json({input_tokens:mode==='oversize'?20000:499},{status:mode==='count-error'?503:200});
  if(mode==='http-error')return Response.json({}, {status:503});
  return Response.json({usage:{input_tokens:499,output_tokens:232},stop_reason:mode==='truncated'?'max_tokens':'end_turn',content:[{type:'text',text:mode==='invalid'?'invalid JSON':JSON.stringify(answer)}]});
 };
 server=require('../server').listen(0,'127.0.0.1');
 await new Promise(r=>server.once('listening',r));base='http://127.0.0.1:'+server.address().port;
 student=await login('student');other=await login('student');teacher=await login('teacher');
});
after(async()=>{global.fetch=nativeFetch;if(server)await new Promise(r=>server.close(r));if(pool)await pool.end();});
const req=(path,cookie,body)=>nativeFetch(base+path,{redirect:'manual',headers:{cookie:cookie||'',origin:base,'content-type':'application/json'},...(body===undefined?{}:{method:'POST',body:JSON.stringify(body)})});
async function login(role){const r=await req('/connexion','',{role,password:'test-'+role+'-only'});assert.equal(r.status,303);return r.headers.get('set-cookie').split(';')[0];}
async function status(path,cookie,body,expected){const r=await req(path,cookie,body);assert.equal(r.status,expected, path);return r.json();}
const run=(name,fn)=>test(name,{skip:!enabled},fn);
run('PostgreSQL: réservation, règlement, incertitude et persistance',async()=>{
 const m='2090-01',c=budget.config();assert.equal((await budget.reserve(pool,m,c)).rowCount,1);
 await budget.settle(pool,m,c,{input_tokens:499,output_tokens:232});
 assert.equal((await budget.reserve(pool,m,c)).rowCount,1);
 await budget.settle(pool,m,c,{});
 assert.equal((await budget.snapshot(pool,m)).limit,40);
 const fresh=new Pool({connectionString:url});try{const d=await budget.snapshot(fresh,m);assert.equal(d.spent,0.006636);assert.equal(d.held,0.076);assert.equal(d.attempts,2);assert.equal(d.inputTokens,499);assert.equal(d.outputTokens,232);assert.equal((await budget.snapshot(fresh,'2090-02')).remaining,10);}finally{await fresh.end();}
});
run('PostgreSQL: concurrence et plafond',async()=>{
 const m='2090-03',c=budget.config();await budget.reserve(pool,m,c);
 await pool.query('UPDATE ai_pilot_quota SET attempts=39,tracked=39,held_micro=0 WHERE month=$1',[m]);
 const results=await Promise.all(Array.from({length:6},()=>budget.reserve(pool,m,c)));
 assert.equal(results.reduce((n,r)=>n+r.rowCount,0),1);assert.equal((await budget.snapshot(pool,m)).attempts,40);
 const n='2090-04';await budget.reserve(pool,n,c);await pool.query('UPDATE ai_pilot_quota SET spent_micro=9950000,held_micro=0 WHERE month=$1',[n]);
 assert.equal((await budget.reserve(pool,n,c)).rowCount,0);assert.equal((await budget.snapshot(pool,n)).blocked,true);
});
run('Dialogue complet: trois validations, confidentialité et signalement',async()=>{
 const {id}=await status('/api/supervision/demandes',student,fixture,201);
 const prefix='/api/supervision/'+id;
 const view=async()=> (await status('/api/supervision/mes-demandes',student,undefined,200)).requests.find(r=>r.id===id);
 assert.equal((await status('/api/supervision/mes-demandes',other,undefined,200)).requests.length,0);
 for(let level=1;level<=3;level++){
  await status(prefix+'/analyser',teacher,{},200);
  const draft=await view();assert.equal(draft.state,'draft');assert.equal(draft.question,undefined);assert.equal(draft.draft,undefined);assert.equal(draft.history.length,level-1);
  await status(prefix+'/decision',teacher,{action:'approve',confirm:false,question:'Q',indice:'I'},400);
  await status(prefix+'/decision',teacher,{action:'approve',confirm:true,question:'Question validée '+level,indice:'Indice validé '+level},200);
  const approved=await view();assert.equal(approved.level,level);assert.equal(approved.question,'Question validée '+level);assert.equal(approved.history.length,level);assert.equal(JSON.stringify(approved).includes(answer.diagnostic),false);
  if(level<3)await status(prefix+'/dialogue',student,level===1?{action:'reply',text:'Je réfléchis.',fictif:true}:{action:'hint'},200);
 }
 assert.equal(calls.filter(c=>c.url.endsWith('/messages')).length,3);
 assert.equal(JSON.parse(calls.filter(c=>c.url.endsWith('/messages'))[2].body.messages[0].content).dialogue.level,3);
 await status(prefix+'/dialogue',student,{action:'hint'},400);
 await status(prefix+'/dialogue',student,{action:'report'},200);
 assert.equal((await status('/api/supervision/enseignant',teacher,undefined,200)).requests.find(r=>r.id===id).reported,true);
 await status(prefix+'/dialogue',student,{action:'understood'},400);await status(prefix+'/dialogue',student,{action:'understood',reflection:'Test fictif',confidence:'help',fictif:true},400);await status(prefix+'/dialogue',student,{action:'understood',reflection:'Les indices commencent à zéro.',confidence:'autonomous',fictif:true},200);assert.equal((await view()).state,'completed');assert.equal((await view()).closure.confidence,'autonomous');
 const feedbackCalls=calls.length;
 await status(prefix+'/feedback',teacher,{verdict:'clarify',comment:'',confirm:true},400);
 await status(prefix+'/feedback',teacher,{verdict:'confirmed',comment:'',confirm:false},400);
 await status(prefix+'/feedback',teacher,{verdict:'invalid',comment:'Test',confirm:true},400);
 await status(prefix+'/feedback',teacher,{verdict:'confirmed',comment:'x'.repeat(1001),confirm:true},400);
 const forbidden=await req(prefix+'/feedback',student,{verdict:'confirmed',comment:'',confirm:true});assert.equal(forbidden.status,403);
 await status(prefix+'/feedback',teacher,{verdict:'clarify',comment:'Précise le caractère final.',confirm:true},200);
 assert.equal((await view()).feedback.verdict,'clarify');
 assert.equal((await view()).feedback.comment,'Précise le caractère final.');
 assert.equal((await status('/api/supervision/mes-demandes',other,undefined,200)).requests.length,0);
 await status(prefix+'/feedback',teacher,{verdict:'confirmed',comment:'',confirm:true},200);
 assert.equal((await view()).feedback.verdict,'confirmed');assert.equal(calls.length,feedbackCalls);

 await status(prefix+'/dialogue',student,{action:'new'},200);assert.equal(await view(),undefined);
});
run('Claude simulé: erreurs, format et taille',async()=>{
 const path='/api/enseignant/analyser';
 for(const [m,expected,delta] of [['count-error',503,0],['oversize',429,0],['http-error',502,1],['invalid',502,1],['truncated',502,1]]){
  mode=m;const before=await budget.snapshot(pool,month);await status(path,teacher,fixture,expected);const after=await budget.snapshot(pool,month);assert.equal(after.attempts-before.attempts,delta,m);
  if(m==='http-error')assert.equal(Math.round((after.held-before.held)*1e6),76000);
 }
 mode='ok';
});
run('Blocage avant tout appel fournisseur et accès budget',async()=>{
 const path='/api/enseignant/analyser';await pool.query('UPDATE ai_pilot_quota SET attempts=40,tracked=40 WHERE month=$1',[month]);const n=calls.length;
 await status(path,teacher,fixture,429);assert.equal(calls.length,n);
 assert.equal((await req('/api/enseignant/budget',student)).status,403);
 assert.equal((await status('/api/enseignant/budget',teacher,undefined,200)).blocked,true);
 await pool.query('UPDATE ai_pilot_quota SET attempts=1,tracked=1,spent_micro=9990000,held_micro=0 WHERE month=$1',[month]);
 await status(path,teacher,fixture,429);assert.equal(calls.length,n);
});
