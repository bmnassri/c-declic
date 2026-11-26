const express = require('express');
const path = require('node:path');
const app = express();
const notions = ['Variables','Conditions','Boucles','Fonctions','Tableaux','Chaînes de caractères','Pointeurs','Structures','Allocation dynamique','Fichiers'];
app.disable('x-powered-by');
app.use((req,res,next)=>{res.set('X-Content-Type-Options','nosniff');res.set('Referrer-Policy','no-referrer');res.set('Content-Security-Policy',"default-src 'self'; style-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");next();});
app.use(express.json({limit:'100kb'}));
app.use(express.static(path.join(__dirname,'public')));
app.post('/api/analyser',(req,res)=>{
  res.set('Cache-Control','no-store');
  const b=req.body;
  if(!b || typeof b!=='object' || Array.isArray(b)) return res.status(400).json({message:'Saisie invalide.'});
  const rules={notion:100,enonce:5000,code:20000,erreur:5000,question:3000};
  for(const [key,max] of Object.entries(rules)){
    if(typeof b[key]!=='string'||b[key].length>max||(key!=='erreur'&&!b[key].trim())) return res.status(400).json({message:`Champ invalide : ${key}.`});
  }
  if(!notions.includes(b.notion)) return res.status(400).json({message:'Notion inconnue.'});
  res.json({message:'Saisie validée par le serveur. Aucune analyse IA effectuée à cette étape.'});
});
app.use((err,req,res,next)=>res.status(err.status===413?413:400).json({message:'Requête invalide ou trop volumineuse.'}));
app.listen(process.env.PORT||3000,'0.0.0.0');
