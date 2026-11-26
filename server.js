const express = require('express');
const path = require('node:path');
const app = express();
const crypto = require('node:crypto');
const passwords = {student: process.env.APP_PASSWORD, teacher: process.env.TEACHER_PASSWORD};
const secret = process.env.SESSION_SECRET;
if (!secret || secret.length < 32 || Object.values(passwords).some(p => !p || p.length < 12) || passwords.student === passwords.teacher) {
  console.error('Configuration requise : deux mots de passe distincts (12 caractères minimum) et SESSION_SECRET (32 minimum).');
  process.exit(1);
}
const secure = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const sessions = new Map();
const attempts = new Map();
const ttl = 8 * 60 * 60 * 1000;
const windowMs = 15 * 60 * 1000;
const digest = value => crypto.createHmac('sha256', secret).update(value).digest('hex');
const equal = (a,b) => crypto.timingSafeEqual(Buffer.from(digest(a)), Buffer.from(digest(b)));
function token(req) { return /(?:^|;\s*)cd_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1]; }
function session(req) { const t = token(req); const s = t && sessions.get(digest(t)); return s && s.expires > Date.now() ? s : null; }
function revoke(req) { const t = token(req); if(t) sessions.delete(digest(t)); }
function cookie(res,t,maxAge) { res.cookie('cd_session',t,{httpOnly:true,secure,sameSite:'strict',path:'/',maxAge}); }
setInterval(()=>{const now=Date.now(); for(const [k,v] of sessions) if(v.expires<=now) sessions.delete(k); for(const [k,v] of attempts) if(v.until<=now) attempts.delete(k);},60000).unref();
// Railway termine TLS au proxy. La limitation globale reste active même si une IP est falsifiée.
if (process.env.RAILWAY_ENVIRONMENT) app.set('trust proxy',1);

function sameOrigin(req, res, next) {
  const origin = req.get('origin');
  const expected = process.env.RAILWAY_PUBLIC_DOMAIN
    ? 'https://' + process.env.RAILWAY_PUBLIC_DOMAIN
    : (secure ? 'https' : 'http') + '://' + req.get('host');
  if (
    origin !== expected ||
    req.get('sec-fetch-site') === 'cross-site'
  ) {
    console.warn('[ORIGIN_CHECK]', JSON.stringify({
      originState: !origin ? 'absent' : origin === 'null' ? 'null' : origin === expected ? 'match' : 'mismatch',
      publicDomainConfigured: Boolean(process.env.RAILWAY_PUBLIC_DOMAIN),
      expectedMatchesPublicURL: expected === 'https://c-declic-production.up.railway.app',
      originMatchesPublicURL: origin === 'https://c-declic-production.up.railway.app',
      fetchSite: ['same-origin', 'same-site', 'cross-site', 'none'].includes(req.get('sec-fetch-site')) ? req.get('sec-fetch-site') : 'absent-or-other'
    }));
    return res.status(403).json({
      message: 'Origine refusée.'
    });
  }
  next();
}
function requireRole(role) { return (req,res,next)=>{const s=session(req); if(!s) return req.path.startsWith('/api/')?res.status(401).json({message:'Session expirée. Reconnecte-toi.'}):res.redirect('/connexion'); if(s.role!==role) return res.status(403).send('Accès interdit.'); next();}; }

const notions = ['Variables','Conditions','Boucles','Fonctions','Tableaux','Chaînes de caractères','Pointeurs','Structures','Allocation dynamique','Fichiers'];
app.disable('x-powered-by');
app.use((req,res,next)=>{res.set('X-Content-Type-Options','nosniff');res.set('Referrer-Policy','same-origin');res.set('Content-Security-Policy',"default-src 'self'; style-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");next();});
app.use(express.json({limit:'100kb'}));
app.use((req,res,next)=>{res.set('Cache-Control','no-store');next();});
app.use(express.urlencoded({extended:false,limit:'4kb'}));
const pages=path.join(__dirname,'private');
app.get('/connexion',(req,res)=>res.sendFile(path.join(pages,'login.html')));
app.post('/connexion',sameOrigin,(req,res)=>{
  const now=Date.now(); const keys=['global','ip:'+req.ip];
  for(const key of keys){const a=attempts.get(key); if(a && a.until>now && a.count >= (key==='global'?100:5)) return res.status(429).send('Trop de tentatives. Réessaie dans 15 minutes.');}
  const {role,password}=req.body||{};
  if(!['student','teacher'].includes(role)||typeof password!=='string'||password.length>512||!equal(password,passwords[role])){
    for(const key of keys){const a=attempts.get(key); if(!a||a.until<=now) attempts.set(key,{count:1,until:now+windowMs}); else a.count++;}
    return res.redirect(303,'/connexion?erreur=1');
  }
  if(sessions.size>=5000) return res.status(503).send('Capacité temporairement atteinte.');
  revoke(req); const t=crypto.randomBytes(32).toString('hex'); sessions.set(digest(t),{role,expires:now+ttl}); cookie(res,t,ttl); res.redirect(303,role==='teacher'?'/enseignant':'/');
});
app.post('/deconnexion',sameOrigin,(req,res)=>{revoke(req);cookie(res,'',0);res.redirect(303,'/connexion');});
app.get('/',requireRole('student'),(req,res)=>res.sendFile(path.join(pages,'index.html')));
app.get('/enseignant',requireRole('teacher'),(req,res)=>res.sendFile(path.join(pages,'teacher.html')));
app.get('/index.html',requireRole('student'),(req,res)=>res.redirect('/'));
app.use(express.static(path.join(__dirname,'public'),{index:false,redirect:false}));
app.post('/api/analyser',sameOrigin,requireRole('student'),(req,res)=>{
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
