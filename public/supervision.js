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
async function run(fn){if(busy)return;busy=true;root.querySelectorAll('button').forEach(b=>b.disabled=true);try{await fn();}catch(e){status.textContent=e.message;}finally{busy=false;root.querySelectorAll('button').forEach(b=>b.disabled=false);}}
function button(parent,label,fn){const b=node('button',label);b.type='button';b.addEventListener('click',()=>run(fn));parent.append(b);}
const labels={pending:'En attente',analyzing:'Analyse en cours',draft:'En attente de validation',approved:'Validée',rejected:'Refusée'};
async function load(){
 const d=await api(teacher?'enseignant':'mes-demandes');list.replaceChildren();
 if(!d.requests.length)list.append(node('p','Aucune demande.'));
 for(const r of d.requests){
  const card=node('article','','supervision-card');list.append(card);
  card.append(node('h3',labels[r.state]||r.state),node('small','Expiration : '+new Date(r.expires).toLocaleTimeString('fr-FR')));
  if(!teacher){
   if(r.state==='approved'){card.append(node('h4','Question socratique'),node('p',r.question));const details=document.createElement('details');details.append(node('summary','Je suis bloqué : afficher l’indice'),node('p',r.indice));card.append(details);}
   if(r.state==='rejected')card.append(node('p','Demande refusée. Contacte ton enseignant.'));
   continue;
  }
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
 const l=node('label','');const check=document.createElement('input');check.type='checkbox';l.append(check,document.createTextNode(' Je confirme : données fictives, sans données personnelles. Le code pourra être envoyé à Claude par l’enseignant.'));root.prepend(l);
 const send=node('button','Envoyer à l’enseignant','primary');send.type='button';root.prepend(send);
 send.addEventListener('click',()=>run(async()=>{if(!form.reportValidity()||!check.checked)throw Error('Complète le formulaire et confirme les données fictives.');const b=Object.fromEntries(new FormData(form));b.fictif=true;const d=await api('demandes',b);status.textContent=d.message;await load();}));
}
run(load);

})();
