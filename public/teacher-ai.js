'use strict';
const form=document.querySelector('#analyse-ia');
const status=document.querySelector('#status-ia');
const output=document.querySelector('#resultat-ia');
form.addEventListener('submit',async e=>{
 e.preventDefault();
 const button=form.querySelector('button[type=submit]');
 button.disabled=true;button.setAttribute('aria-busy','true'); output.textContent=''; status.textContent='Analyse en cours…';
 try {
  const b=Object.fromEntries(new FormData(form)); b.fictif=form.elements.fictif.checked;
  const r=await fetch('/api/enseignant/analyser',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
  const d=await r.json();
  if(!r.ok) throw Error(d.message||'Analyse refusée.');
  if (typeof d.answer === 'string') {
   output.textContent=d.answer;
  } else {
   const fields=[['diagnostic','Diagnostic technique','Réservé à l’enseignant'],['question','Question socratique','À soumettre après validation'],['indice','Indice progressif','À proposer seulement si nécessaire']];
   if (!d.answer || !fields.every(([k])=>typeof d.answer[k]==='string' && d.answer[k].trim())) throw Error('Brouillon incomplet.');
   for(const [key,title,note] of fields){
    const section=document.createElement('section'); section.className='ai-block ai-'+key;
    const h=document.createElement('h3'); h.textContent=title;
    const p=document.createElement('p'); p.textContent=d.answer[key];
    const small=document.createElement('small'); small.textContent=note;
    section.append(h,p,small); output.append(section);
   }
  } status.textContent='Brouillon IA non validé. Tentatives restantes ce mois : '+d.remaining;
 } catch(e){status.textContent=e.message||'Erreur technique.';}
 finally{button.disabled=false;button.removeAttribute('aria-busy');}
});
form.addEventListener('reset',()=>{output.textContent='';status.textContent='';});
