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
 const publicView=r=>({id:r.id,state:r.state,expires:r.expires,level:r.level||1,history:r.history||[],reported:!!r.reported,...(r.state==='approved'?{question:r.approved.question,indice:r.approved.indice}:{})});
 app.get('/api/supervision/mes-demandes',student,guard,(req,res)=>res.json({requests:[...requests.values()].filter(r=>r.owner===session(req)).map(publicView)}));
 app.post('/api/supervision/demandes',sameOrigin,student,guard,(req,res)=>{
  const b=req.body,rules={notion:100,enonce:2000,code:6000,erreur:1000,question:1000};
  if(!b||b.fictif!==true||!Object.entries(rules).every(([k,n])=>typeof b[k]==='string'&&b[k].length<=n&&(k==='erreur'||b[k].trim()))||!notions.includes(b.notion))return res.status(400).json({message:'Saisie invalide : vérifie les champs et la confirmation des données fictives.'});
  const owner=session(req);
  if(requests.size>=100||[...requests.values()].filter(r=>r.owner===owner).length>=3)return res.status(429).json({message:'Limite temporaire atteinte (3 demandes par session).'});
  const id=crypto.randomUUID();
  requests.set(id,{id,owner,expires:Math.min(Date.now()+ttl,owner.expires),state:'pending',level:1,history:[],input:{...Object.fromEntries(Object.keys(rules).map(k=>[k,b[k]])),fictif:true}});
  res.status(201).json({message:'Demande transmise à l’enseignant.',id});
 });
 app.post('/api/supervision/:id/dialogue',sameOrigin,student,guard,(req,res)=>{
  const r=requests.get(req.params.id),b=req.body;
  if(!r||r.owner!==session(req))return res.status(404).json({message:'Demande indisponible.'});
  if(b?.action==='report'&&r.history.length){r.reported=true;return res.json({message:'Signalement transmis à l’enseignant.'});}
  if(b?.action==='new'&&r.state!=='analyzing'){requests.delete(r.id);return res.json({message:'Nouvelle analyse : complète le formulaire.'});}
  if(r.state!=='approved')return res.status(409).json({message:'Attends la validation de l’enseignant.'});
  if(b?.action==='understood'){r.state='completed';delete r.input;delete r.approved;return res.json({message:'Accompagnement terminé.'});}
  if(!['reply','hint'].includes(b?.action)||r.history.length>=3)return res.status(400).json({message:'Maximum de trois réponses validées par demande.'});
  if(b.action==='reply'&&(b.fictif!==true||typeof b.text!=='string'||!b.text.trim()||b.text.length>1000))return res.status(400).json({message:'Réponse de 1 à 1000 caractères, sans données personnelles, requise.'});
  r.level=Math.min(3,r.level+1);
  r.followup={action:b.action,...(b.action==='reply'?{text:b.text.trim()}:{})};
  r.history[r.history.length-1].student=r.followup;
  delete r.approved;r.state='pending';
  res.json({message:'Nouvel échange transmis à l’enseignant.'});
 });
 app.get('/api/supervision/enseignant',teacher,guard,(req,res)=>res.json({requests:[...requests.values()].map(({id,state,input,draft,expires,level,history,reported,followup})=>({id,state,input,draft,expires,level,history,reported,followup}))}));
 app.post('/api/supervision/:id/analyser',sameOrigin,teacher,guard,async(req,res)=>{
  const r=requests.get(req.params.id);
  if(!r||r.state!=='pending')return res.status(409).json({message:'Demande indisponible.'});
  r.state='analyzing';
  let status=200;
  try{
   await ai({body:r.input,dialogueContext:r.followup?{level:r.level,history:r.history,followup:r.followup}:undefined},{status(n){status=n;return this;},json(data){
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
  if(b?.action==='reject'){r.state='rejected';delete r.input;delete r.draft;delete r.followup;delete r.approved;return res.json({message:'Demande refusée.'});}
  if(r.state!=='draft'||b?.action!=='approve'||b.confirm!==true||!['question','indice'].every(k=>typeof b[k]==='string'&&b[k].trim()&&b[k].length<=600))return res.status(400).json({message:'Validation explicite et deux textes requis.'});
  r.approved={question:b.question.trim(),indice:b.indice.trim()};r.history.push({level:r.level, ...r.approved});r.state='approved';delete r.draft;delete r.followup;
  res.json({message:'Réponse validée et disponible pour la session étudiante.'});
 });
};
