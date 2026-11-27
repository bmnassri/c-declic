'use strict';
const CAP=10000000; // micro-euros
function attemptLimit(){
 const raw=process.env.AI_MONTHLY_ATTEMPT_LIMIT ?? '40';
 if(!/^[1-9][0-9]{0,3}$/.test(raw)||Number(raw)>1000)throw Error('invalid monthly attempt limit');
 return Number(raw);
}
function config(){
 const model=process.env.ANTHROPIC_MODEL;
 const input=Number(process.env.AI_INPUT_EUR_PER_MTOK),output=Number(process.env.AI_OUTPUT_EUR_PER_MTOK);
 const ceiling=Number(process.env.AI_INPUT_TOKEN_CEILING);
 if(!model||process.env.AI_BUDGET_MODEL!==model||!Number.isFinite(input)||input<=0||!Number.isFinite(output)||output<=0||!Number.isSafeInteger(ceiling)||ceiling<1||ceiling>1000000)throw Error('budget configuration');
 const reserve=Math.ceil(ceiling*input+600*output);
 if(!Number.isSafeInteger(reserve)||reserve>CAP)throw Error('budget reservation');
 return {model,input,output,ceiling,reserve,limit:attemptLimit()};
}
async function init(pool){
 await pool.query('CREATE TABLE IF NOT EXISTS ai_pilot_quota (month TEXT PRIMARY KEY, attempts INTEGER NOT NULL CHECK (attempts >= 0))');
 await pool.query('ALTER TABLE ai_pilot_quota ADD COLUMN IF NOT EXISTS spent_micro BIGINT NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS held_micro BIGINT NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS input_tokens BIGINT NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS output_tokens BIGINT NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS tracked INTEGER NOT NULL DEFAULT 0');
}
async function reserve(pool,month,c){
 await init(pool);
 await pool.query('INSERT INTO ai_pilot_quota(month,attempts) VALUES ($1,0) ON CONFLICT DO NOTHING',[month]);
 // Historical calls without usage are charged the configured conservative reservation.
 return pool.query('UPDATE ai_pilot_quota SET held_micro=held_micro+(attempts-tracked)*$2+$2, tracked=attempts+1, attempts=attempts+1 WHERE month=$1 AND attempts<$3 AND spent_micro+held_micro+(attempts-tracked)*$2+$2<=$4 RETURNING attempts',[month,c.reserve,c.limit,CAP]);
}
async function settle(pool,month,c,usage){
 const i=usage?.input_tokens,o=usage?.output_tokens;
 if(!Number.isSafeInteger(i)||i<0||!Number.isSafeInteger(o)||o<0||usage.cache_creation_input_tokens||usage.cache_read_input_tokens)return;
 const cost=Math.ceil(i*c.input+o*c.output);
 if(!Number.isSafeInteger(cost))return;
 await pool.query('UPDATE ai_pilot_quota SET held_micro=held_micro-$2,spent_micro=spent_micro+$3,input_tokens=input_tokens+$4,output_tokens=output_tokens+$5 WHERE month=$1 AND held_micro >= $2',[month,c.reserve,cost,i,o]);
}
async function snapshot(pool,month){
 await init(pool);
 const r=(await pool.query('SELECT * FROM ai_pilot_quota WHERE month=$1',[month])).rows[0]||{};
 let c;try{c=config()}catch{}
 const attempts=Number(r.attempts||0),legacy=attempts-Number(r.tracked||0),spent=Number(r.spent_micro||0),held=Number(r.held_micro||0)+(c?legacy*c.reserve:0);
 const used=spent+held;
 let limit;try{limit=attemptLimit()}catch{limit=40;}
 return {month,cap:CAP/1e6,spent:spent/1e6,held:held/1e6,remaining:c?Math.max(0,CAP-used)/1e6:null,percent:used/CAP*100,attempts,limit,inputTokens:Number(r.input_tokens||0),outputTokens:Number(r.output_tokens||0),legacy,configured:!!c,blocked:!c||attempts>=limit||used+(c?.reserve||0)>CAP,reservation:c?c.reserve/1e6:null};
}
module.exports={config,reserve,settle,snapshot};
