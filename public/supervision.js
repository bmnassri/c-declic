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
async function run(fn){if(busy)return;busy=true;const buttons=[...document.querySelectorAll('#supervision button,#submission-actions button')].filter(b=>!b.disabled);buttons.forEach(b=>{b.disabled=true;b.setAttribute('aria-busy','true');});try{await fn();}catch(e){status.textContent=e.message;}finally{busy=false;buttons.forEach(b=>{b.disabled=false;b.removeAttribute('aria-busy');});}}
function button(parent,label,fn){const b=node('button',label);b.type='button';if(['Répondre','Valider et transmettre','Analyser avec Claude','Commencer un nouvel exercice','Terminer mon accompagnement'].includes(label))b.classList.add('primary');if(label==='Commencer un nouvel exercice')b.classList.add('new-exercise');if(label==='Signaler une erreur')b.classList.add('report-action');if(label==='Indice suivant')b.classList.add('hint-action');b.addEventListener('click',()=>run(fn));parent.append(b);}
const labels={pending:'En attente',analyzing:'Analyse en cours',draft:'En attente de validation',approved:'Validée',rejected:'Refusée',completed:'Terminée'};
const stateInfo={pending:['◷','La demande attend une intervention de l’enseignant.'],analyzing:['…','L’IA prépare un accompagnement.'],draft:['▤','L’enseignant vérifie la proposition.'],approved:['✓','La réponse est validée : place au raisonnement.'],completed:['✓','Compréhension déclarée par l’étudiant.'],rejected:['×','Contacte ton enseignant.']};
async function load(){
 const d=await api(teacher?'enseignant':'mes-demandes');list.replaceChildren();
 if(teacher){for(const [id,count] of [['metric-pending',d.requests.filter(r=>['pending','analyzing','draft'].includes(r.state)).length],['metric-approved',d.requests.filter(r=>r.state==='approved').length],['metric-completed',d.requests.filter(r=>r.state==='completed').length],['metric-reported',d.requests.filter(r=>r.reported).length]]){const el=document.getElementById(id);if(el)el.textContent=String(count);}} if(!d.requests.length)list.append(node('p','Aucune demande pour le moment.','empty-state'));
 for(const r of d.requests){
  const card=node('article','','supervision-card');card.dataset.state=r.state;list.append(card);
  const banner=node('div','','request-banner');
  const mark=node('span',stateInfo[r.state]?.[0]||'','request-mark');mark.setAttribute('aria-hidden','true');
  const heading=node('div','','request-heading');
  const celebration=r.state==='completed'&&!teacher;
  if(celebration)banner.classList.add('celebration');
  heading.append(node('h3',celebration?'Bravo, tu as eu le déclic !':r.state==='completed'?'Accompagnement terminé':labels[r.state]||r.state),node('p',celebration?'Accompagnement terminé':stateInfo[r.state]?.[1]||''));
  if(celebration)heading.append(node('p','L’IA te guide, la solution vient de toi.','celebration-motto'));
  banner.append(mark,heading);card.append(banner,node('small',(r.notion?r.notion+' · ':'')+'Expiration : '+new Date(r.expires).toLocaleTimeString('fr-FR')));
  if(r.state!=='rejected'){
   const progress=node('ol','','request-progress');progress.setAttribute('aria-label','Progression pédagogique');
   const step=r.state==='completed'?3:r.state==='approved'||r.level>1?2:r.state==='pending'?0:1;
   ['Soumission','Analyse','Réflexion','Clôture'].forEach((label,i)=>{const li=node('li','');const done=r.state==='completed'||i<step;const dot=node('span',done?'✓':String(i+1),'progress-dot');dot.setAttribute('aria-hidden','true');li.append(dot,node('span',label));if(done)li.className='reached';if(i===step&&r.state!=='completed')li.setAttribute('aria-current','step');progress.append(li);});card.append(progress);
  }
  if(r.state==='completed'){
   const finish=node('div','','closure-summary');
   const stats=node('div','','closure-stats');for(const [value,label,symbol] of [[r.history.length+'/3','Niveaux utilisés','▤'],[String(r.history.length),'Réponses validées','✓'],[r.reported?'1':'0','Signalement','⚑']]){const tile=node('div','','closure-stat');const icon=node('span',symbol,'closure-stat-icon');icon.setAttribute('aria-hidden','true');tile.append(icon,node('strong',value),node('small',label));stats.append(tile);}finish.append(stats);
   if(r.closure){const assessment=node('div','','closure-assessment');const icon=node('span','◇','assessment-icon');icon.setAttribute('aria-hidden','true');const copy=node('div','');copy.append(node('small',teacher?'Autoévaluation de l’étudiant':'Mon autoévaluation'),node('strong',r.closure.confidence==='autonomous'?'Je peux expliquer et corriger mon erreur seul.':'J’ai compris l’essentiel.'));assessment.append(icon,copy);finish.append(assessment,node('h4',teacher?'Synthèse de l’apprentissage':'Ma synthèse personnelle'),node('p',r.closure.reflection,'closure-reflection'));}
   if(teacher)finish.append(node('small','Compréhension déclarée — aucune note attribuée.'));
   card.append(finish);
  }
  if(r.reported)card.append(node('p','Erreur signalée à l’enseignant.','supervision-diagnostic'));
  if(r.history?.length){
   const historyContainer=r.state==='completed'?document.createElement('details'):node('div','');if(r.state==='completed')historyContainer.append(node('summary','Consulter le parcours pédagogique'));card.append(historyContainer);
   for(const turn of r.history){
    historyContainer.append(node('h4','Question socratique — niveau '+turn.level),node('p',turn.question,'dialogue-question'));
    const details=document.createElement('details');details.append(node('summary','Afficher l’indice — niveau '+turn.level),node('p',turn.indice));historyContainer.append(details);
    if(turn.student)historyContainer.append(node('p',turn.student.action==='reply'?'Étudiant : '+turn.student.text:'Étudiant : demande d’un indice suivant','dialogue-reply'));
   }
  }
  if(!teacher){
   const act=async(action,extra={})=>{const d=await api(r.id+'/dialogue',{action,...extra});status.textContent=d.message;await load();};
   if(r.state==='approved'){
    if(!r.history?.length){card.append(node('h4','Question socratique'),node('p',r.question,'dialogue-question'));const details=document.createElement('details');details.append(node('summary','Je suis bloqué : afficher l’indice'),node('p',r.indice));card.append(details);}
    if((r.history?.length||0)<3){
     const label=node('label','Ton raisonnement (sans données personnelles)');const t=document.createElement('textarea');t.maxLength=1000;t.rows=3;label.append(t);card.append(label);
     const l=node('label','');const check=document.createElement('input');check.type='checkbox';l.append(check,document.createTextNode(' Je confirme que ma réponse ne contient pas de données personnelles.'));card.append(l);
     button(card,'Répondre',()=>act('reply',{text:t.value,fictif:check.checked}));
     button(card,'Indice suivant',()=>act('hint'));
    }else card.append(node('p','Trois niveaux atteints. Demande une aide directe à ton enseignant si nécessaire.'));
    const closure=node('div','','closure-form');closure.hidden=true;closure.append(node('h3','Tu as eu le déclic ?'),node('p','Explique avec tes propres mots l’origine de ton erreur et comment tu comptes la corriger.'));const label=node('label','Ce que je retiens');const reflection=document.createElement('textarea');reflection.maxLength=1000;reflection.rows=4;label.append(reflection);closure.append(label);const count=node('small','0/1000 caractères');reflection.addEventListener('input',()=>{count.textContent=reflection.value.length+'/1000 caractères';});closure.append(count);const field=document.createElement('fieldset');field.append(node('legend','Mon niveau de compréhension'));let confidence='';for(const [value,text] of [['help','J’ai encore besoin d’aide'],['essential','J’ai compris l’essentiel'],['autonomous','Je peux expliquer et corriger mon erreur seul']]){const l=node('label','');const radio=document.createElement('input');radio.type='radio';radio.name='confidence-'+r.id;radio.value=value;radio.addEventListener('change',()=>{confidence=value;help.hidden=value!=='help';});l.append(radio,document.createTextNode(' '+text));field.append(l);}closure.append(field);const help=node('p','Poursuis le dialogue ou demande directement de l’aide à ton enseignant.');help.hidden=true;closure.append(help);const consent=node('label','');const check=document.createElement('input');check.type='checkbox';consent.append(check,document.createTextNode(' Je confirme que ma synthèse ne contient pas de données personnelles.'));closure.append(consent);button(closure,'Terminer mon accompagnement',()=>{if(!reflection.value.trim()||!check.checked||!['essential','autonomous'].includes(confidence))throw Error('Complète la synthèse, choisis ton niveau et confirme l’absence de données personnelles.');return act('understood',{reflection:reflection.value,confidence,fictif:true});});button(closure,'Revenir au dialogue',()=>{closure.hidden=true;});button(card,'J’ai compris',()=>{closure.hidden=false;reflection.focus();});card.append(closure);
   }
   if(r.history?.length&&!r.reported)button(card,'Signaler une erreur',()=>act('report'));
   if(r.state!=='analyzing')button(card,r.state==='completed'?'Commencer un nouvel exercice':'Nouvelle analyse',async()=>{if(!window.confirm('Effacer ce dialogue et recommencer ?'))return;await act('new');document.querySelector('#analyse').reset();document.querySelector('#etudiant').scrollIntoView();});
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
refresh.addEventListener('click',()=>run(async()=>{status.textContent='';await load();}));
if(!teacher){
 const form=document.querySelector('#analyse');
 const l=node('label','');const check=document.createElement('input');check.type='checkbox';l.append(check,document.createTextNode(' Je confirme : données fictives, sans données personnelles. Le code pourra être envoyé à Claude par l’enseignant.'));const target=document.querySelector('#submission-actions')||root;target.prepend(l);
 const send=node('button','Envoyer à l’enseignant','primary');send.type='button';(target.querySelector('.actions')||target).append(send);
 send.addEventListener('click',()=>run(async()=>{if(!form.reportValidity()||!check.checked)throw Error('Complète le formulaire et confirme les données fictives.');const b=Object.fromEntries(new FormData(form));b.fictif=true;const d=await api('demandes',b);status.textContent=d.message;await load();}));
}
run(load);

})();
