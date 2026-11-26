'use strict';
const crypto=require('node:crypto');
const requests=new Map();
const ttl=60*60*1000;
const enabled=()=>process.env.SUPERVISION_PILOT_ENABLED==='true';
module.exports=function(app,sameOrigin,requireRole,notions,session){
 const ai=require('./ai-pilot').handler(notions);
 function sweep(){for(const [id,r] of requests)if(r.expires<=Date.now()||r.owner.expires<=Date.now()||r.owner.revoked)requests.delete(id);}
 setInterval(sweep,30000).unref();
 const guard=(req,res,next)=>{sweep();if(!enabled())return res.status(503).json({message:'Pilote de supervision désactivé.'});next();};
 const student=requireRole('student'),teacher=requireRole('teacher');
 const publicView=r=>({id:r.id,state:r.state,expires:r.expires,...(r.state==='approved'?{question:r.approved.question,indice:r.approved.indice}:{})});
 app.get('/api/supervision/mes-demandes',student,guard,(req,res)=>res.json({requests:[...requests.values()].filter(r=>r.owner===session(req)).map(publicView)}));
 app.post('/api/supervision/demandes',sameOrigin,student,guard,(req,res)=>{
  const b=req.body,rules={notion:100,enonce:2000,code:6000,erreur:1000,question:1000};
  if(!b||b.fictif!==true||!Object.entries(rules).every(([k,n])=>typeof b[k]==='string'&&b[k].length<=n&&(k==='erreur'||b[k].trim()))||!notions.includes(b.notion))return res.status(400).json({message:'Saisie invalide : vérifie les champs et la confirmation des données fictives.'});
  const owner=session(req);
  if(requests.size>=100||[...requests.values()].filter(r=>r.owner===owner).length>=3)return res.status(429).json({message:'Limite temporaire atteinte (3 demandes par session).'});
  const id=crypto.randomUUID();
  requests.set(id,{id,owner,expires:Math.min(Date.now()+ttl,owner.expires),state:'pending',input:{...Object.fromEntries(Object.keys(rules).map(k=>[k,b[k]])),fictif:true}});
  res.status(201).json({message:'Demande transmise à l’enseignant.',id});
 });
 app.get('/api/supervision/enseignant',teacher,guard,(req,res)=>res.json({requests:[...requests.values()].map(({id,state,input,draft,expires})=>({id,state,input,draft,expires}))}));
 app.post('/api/supervision/:id/analyser',sameOrigin,teacher,guard,async(req,res)=>{
  const r=requests.get(req.params.id);
  if(!r||r.state!=='pending')return res.status(409).json({message:'Demande indisponible.'});
  r.state='analyzing';
  let status=200;
  try{
   await ai({body:r.input},{status(n){status=n;return this;},json(data){
    sweep();
    if(!requests.has(r.id))return res.status(410).json({message:'Demande expirée.'});
    if(status===200&&data.answer){r.draft=data.answer;r.state='draft';}else r.state='pending';
    return res.status(status).json(data);
   }});
  }finally{if(r.state==='analyzing')r.state='pending';}
 });
 app.post('/api/supervision/:id/decision',sameOrigin,teacher,guard,(req,res)=>{
  const r=requests.get(req.params.id),b=req.body;
  if(!r||!['pending','draft'].includes(r.state))return res.status(409).json({message:'Demande indisponible.'});
  if(b?.action==='reject'){r.state='rejected';delete r.input;delete r.draft;return res.json({message:'Demande refusée.'});}
  if(r.state!=='draft'||b?.action!=='approve'||b.confirm!==true||!['question','indice'].every(k=>typeof b[k]==='string'&&b[k].trim()&&b[k].length<=600))return res.status(400).json({message:'Validation explicite et deux textes requis.'});
  r.approved={question:b.question.trim(),indice:b.indice.trim()};r.state='approved';delete r.input;delete r.draft;
  res.json({message:'Réponse validée et disponible pour la session étudiante.'});
 });
};
