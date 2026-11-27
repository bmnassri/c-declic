(()=>{
'use strict';
const root=document.querySelector('#supervision');
const teacher=root.dataset.role==='teacher';
const list=document.createElement('div'), status=document.createElement('p');
status.setAttribute('role','status');
const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Actualiser les demandes';
root.append(refresh,status,list);
const node=(tag,text,cls)=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
const glyphs={layers:'M12 2 2 7l10 5 10-5-10-5ZM2 12l10 5 10-5M2 17l10 5 10-5',check:'M20 6 9 17l-5-5',flag:'M5 21V3m0 1h14l-3 5 3 5H5',cap:'M2 9l10-5 10 5-10 5-10-5Zm4 2v6q6 5 12 0v-6m4-2v7'};
function svgIcon(name,cls){const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),p=document.createElementNS(ns,'path');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class',cls);svg.setAttribute('aria-hidden','true');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.8');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');p.setAttribute('d',glyphs[name]);svg.append(p);return svg;}
const verdicts={confirmed:'Compréhension confirmée',clarify:'Compréhension à consolider',help:'Accompagnement complémentaire conseillé'};
async function api(url,body){
 const r=await fetch('/api/supervision/'+url,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(r.status===401){location.assign('/connexion');throw Error('Session expirée.');}
 const d=await r.json();if(!r.ok)throw Error(d.message||'Action refusée.');return d;
}
let busy=false;
const completedPanels=new Map();
function renderStudentFeedback(panel,feedback){panel.dataset.verdict=feedback?.verdict||'waiting';panel.replaceChildren(node('h4','Retour pédagogique de l’enseignant'));if(feedback){panel.append(node('strong',verdicts[feedback.verdict]),node('p',feedback.comment||'L’enseignant a confirmé ta compréhension.','feedback-comment'));if(feedback.verdict!=='confirmed')panel.append(node('p','Tu peux demander une aide directe à ton enseignant ou commencer un nouvel exercice.'));}else panel.append(node('p','Compréhension déclarée — retour enseignant facultatif, non encore transmis.'));panel.append(node('small','Retour temporaire · Aucune note attribuée'));}
async function run(fn){if(busy)return;busy=true;const buttons=[...document.querySelectorAll('#supervision button,#submission-actions button')].filter(b=>!b.disabled);buttons.forEach(b=>{b.disabled=true;b.setAttribute('aria-busy','true');});try{await fn();}catch(e){status.textContent=e.message;}finally{busy=false;buttons.forEach(b=>{b.disabled=false;b.removeAttribute('aria-busy');});}}
function button(parent,label,fn){const b=node('button',label);b.type='button';if(['Répondre','Valider et transmettre','Analyser avec Claude','Commencer un nouvel exercice','Terminer mon accompagnement','Transmettre mon retour pédagogique'].includes(label))b.classList.add('primary');if(label==='Commencer un nouvel exercice')b.classList.add('new-exercise');if(label==='Signaler une erreur')b.classList.add('report-action');if(label==='Indice suivant')b.classList.add('hint-action');b.addEventListener('click',()=>run(fn));parent.append(b);}
const labels={pending:'En attente',analyzing:'Analyse en cours',draft:'En attente de validation',approved:'Validée',rejected:'Refusée',completed:'Terminée'};
const stateInfo={pending:['◷','La demande attend une intervention de l’enseignant.'],analyzing:['…','L’IA prépare un accompagnement.'],draft:['▤','L’enseignant vérifie la proposition.'],approved:['✓','La réponse est validée : place au raisonnement.'],completed:['✓','Compréhension déclarée par l’étudiant.'],rejected:['×','Contacte ton enseignant.']};
async function load(){
 const d=await api(teacher?'enseignant':'mes-demandes');list.replaceChildren();completedPanels.clear();
 if(teacher){for(const [id,count] of [['metric-pending',d.requests.filter(r=>['pending','analyzing','draft'].includes(r.state)).length],['metric-approved',d.requests.filter(r=>r.state==='approved').length],['metric-completed',d.requests.filter(r=>r.state==='completed').length],['metric-reported',d.requests.filter(r=>r.reported).length]]){const el=document.getElementById(id);if(el)el.textContent=String(count);}} if(!d.requests.length)list.append(node('p','Aucune demande pour le moment.','empty-state'));
 for(const r of d.requests){
  const card=node('article','','supervision-card');card.dataset.state=r.state;list.append(card);
  const banner=node('div','','request-banner');
  const mark=node('span',stateInfo[r.state]?.[0]||'','request-mark');mark.setAttribute('aria-hidden','true');
  const heading=node('div','','request-heading');
  const celebration=r.state==='completed'&&!teacher;
  if(celebration)banner.classList.add('celebration');
  heading.append(node('h3',celebration?'Bravo pour ton travail !':r.state==='completed'?'Accompagnement terminé':labels[r.state]||r.state),node('p',celebration?'Accompagnement terminé · Compréhension déclarée':stateInfo[r.state]?.[1]||''));
  if(celebration)heading.append(node('p','L’IA te guide, la solution vient de toi.','celebration-motto'));
  banner.append(mark,heading);card.append(banner,node('small',(r.notion?r.notion+' · ':'')+'Expiration : '+new Date(r.expires).toLocaleTimeString('fr-FR')));
  if(r.state!=='rejected'){
   const progress=node('ol','','request-progress');progress.setAttribute('aria-label','Progression pédagogique');
   const step=r.state==='completed'?3:r.state==='approved'||r.level>1?2:r.state==='pending'?0:1;
   ['Soumission','Analyse','Réflexion','Clôture'].forEach((label,i)=>{const li=node('li','');const done=r.state==='completed'||i<step;const dot=node('span',done?'✓':String(i+1),'progress-dot');dot.setAttribute('aria-hidden','true');li.append(dot,node('span',label));if(done)li.className='reached';if(i===step&&r.state!=='completed')li.setAttribute('aria-current','step');progress.append(li);});card.append(progress);
  }
  if(r.state==='completed'){
   const finish=node('div','','closure-summary');
   const stats=node('div','','closure-stats');for(const [value,label,symbol] of [[r.history.length+'/3','Niveaux utilisés','layers'],[String(r.history.length),'Réponses validées','check'],[r.reported?'1':'0','Signalement','flag']]){const tile=node('div','','closure-stat');const icon=svgIcon(symbol,'closure-stat-icon');tile.append(icon,node('strong',value),node('small',label));stats.append(tile);}finish.append(stats);
   if(r.closure){const assessment=node('div','','closure-assessment');const icon=svgIcon('cap','assessment-icon');const copy=node('div','');copy.append(node('small',teacher?'Autoévaluation de l’étudiant':'Mon autoévaluation'),node('strong',r.closure.confidence==='autonomous'?'Je peux expliquer et corriger mon erreur seul.':'J’ai compris l’essentiel.'));assessment.append(icon,copy);finish.append(assessment,node('h4',teacher?'Synthèse de l’apprentissage':'Ma synthèse personnelle'),node('p',r.closure.reflection,'closure-reflection'));}
   if(teacher)finish.append(node('small','Compréhension déclarée — aucune note attribuée.'));
   if(r.closure){
    const panel=node('section','','feedback-panel');panel.dataset.verdict=r.feedback?.verdict||'waiting';
    panel.append(node('h4','Retour pédagogique de l’enseignant'));
    if(r.feedback){panel.append(node('strong',verdicts[r.feedback.verdict]),node('p',r.feedback.comment||'L’enseignant a confirmé ta compréhension.','feedback-comment'));}
    else panel.append(node('p','Compréhension déclarée — retour enseignant facultatif, non encore transmis.'));
    if(teacher){
     const editor=node('div','','feedback-editor');editor.hidden=!!r.feedback;
     if(r.feedback){const receipt=node('div','','feedback-receipt');receipt.append(svgIcon('check','feedback-receipt-icon'),node('strong','Retour pédagogique transmis'),node('p','Le retour est disponible dans l’espace étudiant.'));panel.prepend(receipt);const toggle=node('button','Modifier mon retour');toggle.type='button';toggle.setAttribute('aria-expanded','false');toggle.addEventListener('click',()=>{editor.hidden=!editor.hidden;toggle.setAttribute('aria-expanded',String(!editor.hidden));toggle.textContent=editor.hidden?'Modifier mon retour':'Annuler la modification';if(!editor.hidden)editor.querySelector('input')?.focus();});panel.append(toggle);}
     panel.append(editor);
     const field=document.createElement('fieldset');field.append(node('legend',r.feedback?'Modifier le retour':'Choisir un retour pédagogique'));let verdict=r.feedback?.verdict||'';
     for(const [value,label] of Object.entries(verdicts)){const l=node('label','');const radio=document.createElement('input');radio.type='radio';radio.name='feedback-'+r.id;radio.value=value;radio.checked=verdict===value;radio.addEventListener('change',()=>{verdict=value;});l.append(radio,document.createTextNode(' '+label));field.append(l);}editor.append(field);
     const label=node('label','Commentaire pédagogique (1000 caractères maximum)');const comment=document.createElement('textarea');comment.rows=3;comment.maxLength=1000;comment.value=r.feedback?.comment||'';label.append(comment);editor.append(label);const count=node('small',comment.value.length+'/1000 caractères');comment.addEventListener('input',()=>{count.textContent=comment.value.length+'/1000 caractères';});editor.append(count);
     const consent=node('label','');const check=document.createElement('input');check.type='checkbox';consent.append(check,document.createTextNode(' Je confirme l’absence de données personnelles.'));editor.append(consent);
     button(editor,'Transmettre mon retour pédagogique',async()=>{if(!verdict||!check.checked||(!comment.value.trim()&&verdict!=='confirmed'))throw Error('Choisis un retour, complète le commentaire si nécessaire et confirme l’absence de données personnelles.');await api(r.id+'/feedback',{verdict,comment:comment.value,confirm:true});status.textContent='Retour pédagogique transmis.';await load();});
    }
    if(teacher)panel.append(node('small','Retour temporaire · Aucune note attribuée'));else{renderStudentFeedback(panel,r.feedback);panel.setAttribute('aria-live','polite');completedPanels.set(r.id,{panel,signature:JSON.stringify(r.feedback??null)});}
    finish.append(panel);
   }
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
   const act=async(action,extra={})=>{const d=await api(r.id+'/dialogue',{action,...extra});status.textContent=action==='understood'?'':d.message;await load();};
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
let polling=false;
if(!teacher)setInterval(async()=>{if(busy||polling||document.hidden||!completedPanels.size)return;const entries=[...completedPanels.entries()];polling=true;try{const d=await api('mes-demandes');if(busy)return;for(const [id,entry] of entries){if(completedPanels.get(id)!==entry||!entry.panel.isConnected)continue;const r=d.requests.find(x=>x.id===id);if(!r){entry.panel.closest('.supervision-card')?.remove();completedPanels.delete(id);status.textContent='Une demande temporaire a expiré.';continue;}const signature=JSON.stringify(r.feedback??null);if(signature!==entry.signature){renderStudentFeedback(entry.panel,r.feedback);entry.signature=signature;}}}catch{/* Actualisation manuelle toujours disponible. */}finally{polling=false;}},10000);

})();
