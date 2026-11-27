(()=>{
'use strict';
const root=document.querySelector('#supervision');
const teacher=root.dataset.role==='teacher';
const list=document.createElement('div'), status=document.createElement('p');
status.setAttribute('role','status');
const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Actualiser les demandes';
root.append(refresh,status,list);
const node=(tag,text,cls)=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
async function api(url,body){
 const r=await fetch('/api/supervision/'+url,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(r.status===401){location.assign('/connexion');throw Error('Session expirée.');}
 const d=await r.json();if(!r.ok)throw Error(d.message||'Action refusée.');return d;
}
let busy=false;
async function run(fn){if(busy)return;busy=true;document.querySelectorAll('#supervision button,#submission-actions button').forEach(b=>b.disabled=true);try{await fn();}catch(e){status.textContent=e.message;}finally{busy=false;root.querySelectorAll('button').forEach(b=>b.disabled=false);}}
function button(parent,label,fn){const b=node('button',label);b.type='button';b.addEventListener('click',()=>run(fn));parent.append(b);}
const labels={pending:'En attente',analyzing:'Analyse en cours',draft:'En attente de validation',approved:'Validée',rejected:'Refusée',completed:'Terminée'};
async function load(){
 const d=await api(teacher?'enseignant':'mes-demandes');list.replaceChildren();
 if(teacher){for(const [id,count] of [['metric-pending',d.requests.filter(r=>['pending','analyzing','draft'].includes(r.state)).length],['metric-approved',d.requests.filter(r=>['approved','completed'].includes(r.state)).length],['metric-reported',d.requests.filter(r=>r.reported).length]]){const el=document.getElementById(id);if(el)el.textContent=String(count);}} if(!d.requests.length)list.append(node('p','Aucune demande pour le moment.','empty-state'));
 for(const r of d.requests){
  const card=node('article','','supervision-card');list.append(card);
  card.append(node('h3',labels[r.state]||r.state),node('small','Expiration : '+new Date(r.expires).toLocaleTimeString('fr-FR')));
  if(r.reported)card.append(node('p','Erreur signalée à l’enseignant.','supervision-diagnostic'));
  if(r.history?.length){
   for(const turn of r.history){
    card.append(node('h4','Question socratique — niveau '+turn.level),node('p',turn.question,'dialogue-question'));
    const details=document.createElement('details');details.append(node('summary','Afficher l’indice — niveau '+turn.level),node('p',turn.indice));card.append(details);
    if(turn.student)card.append(node('p',turn.student.action==='reply'?'Étudiant : '+turn.student.text:'Étudiant : demande d’un indice suivant','dialogue-reply'));
   }
  }
  if(!teacher){
   const act=async(action,extra={})=>{const d=await api(r.id+'/dialogue',{action,...extra});status.textContent=d.message;await load();};
   if(r.state==='approved'){
    if(!r.history?.length){card.append(node('h4','Question socratique'),node('p',r.question));const details=document.createElement('details');details.append(node('summary','Je suis bloqué : afficher l’indice'),node('p',r.indice));card.append(details);}
    if((r.history?.length||0)<3){
     const label=node('label','Ton raisonnement (sans données personnelles)');const t=document.createElement('textarea');t.maxLength=1000;t.rows=3;label.append(t);card.append(label);
     const l=node('label','');const check=document.createElement('input');check.type='checkbox';l.append(check,document.createTextNode(' Je confirme que ma réponse ne contient pas de données personnelles.'));card.append(l);
     button(card,'Répondre',()=>act('reply',{text:t.value,fictif:check.checked}));
     button(card,'Indice suivant',()=>act('hint'));
    }else card.append(node('p','Trois niveaux atteints. Demande une aide directe à ton enseignant si nécessaire.'));
    button(card,'J’ai compris',()=>act('understood'));
   }
   if(r.history?.length&&!r.reported)button(card,'Signaler une erreur',()=>act('report'));
   if(r.state!=='analyzing')button(card,'Nouvelle analyse',async()=>{if(!window.confirm('Effacer ce dialogue et recommencer ?'))return;await act('new');document.querySelector('#analyse').reset();document.querySelector('#etudiant').scrollIntoView();});
   if(r.state==='rejected')card.append(node('p','Demande refusée. Contacte ton enseignant.'));
   continue;
  }
  if(r.followup)card.append(node('p','Nouvel échange — niveau '+r.level));
  if(r.input)for(const [k,label] of Object.entries({notion:'Notion',enonce:'Énoncé',code:'Code C',erreur:'Erreur',question:'Question étudiante'})){card.append(node('h4',label),node('pre',r.input[k]));}
  if(r.state==='pending')button(card,'Analyser avec Claude',async()=>{const d=await api(r.id+'/analyser',{});status.textContent='Brouillon généré. Tentatives restantes : '+d.remaining;await load();});
  if(r.state==='draft'){
   card.append(node('h4','Diagnostic réservé à l’enseignant'),node('p',r.draft.diagnostic,'supervision-diagnostic'));
   const fields={};for(const [k,label] of Object.entries({question:'Question socratique',indice:'Indice progressif'})){const l=node('label',label);const t=document.createElement('textarea');t.value=r.draft[k];t.maxLength=600;t.rows=3;l.append(t);card.append(l);fields[k]=t;}
   const l=node('label','');const confirm=document.createElement('input');confirm.type='checkbox';l.append(confirm,document.createTextNode(' Je confirme avoir vérifié les deux textes, sans corrigé complet.'));card.append(l);
   button(card,'Valider et transmettre',async()=>{if(!confirm.checked)throw Error('Confirme la vérification pédagogique.');await api(r.id+'/decision',{action:'approve',confirm:true,question:fields.question.value,indice:fields.indice.value});status.textContent='Réponse validée.';await load();});
  }
  if(['pending','draft'].includes(r.state))button(card,'Refuser',async()=>{await api(r.id+'/decision',{action:'reject'});status.textContent='Demande refusée.';await load();});
 }
}
refresh.addEventListener('click',()=>run(load));
if(!teacher){
 const form=document.querySelector('#analyse');
 const l=node('label','');const check=document.createElement('input');check.type='checkbox';l.append(check,document.createTextNode(' Je confirme : données fictives, sans données personnelles. Le code pourra être envoyé à Claude par l’enseignant.'));const target=document.querySelector('#submission-actions')||root;target.prepend(l);
 const send=node('button','Envoyer à l’enseignant','primary');send.type='button';(target.querySelector('.actions')||target).append(send);
 send.addEventListener('click',()=>run(async()=>{if(!form.reportValidity()||!check.checked)throw Error('Complète le formulaire et confirme les données fictives.');const b=Object.fromEntries(new FormData(form));b.fictif=true;const d=await api('demandes',b);status.textContent=d.message;await load();}));
}
run(load);

})();
