'use strict';
const form=document.querySelector('#analyse-ia');
const status=document.querySelector('#status-ia');
const output=document.querySelector('#resultat-ia');
form.addEventListener('submit',async e=>{
 e.preventDefault();
 const button=form.querySelector('button[type=submit]');
 button.disabled=true; output.textContent=''; status.textContent='Analyse en cours…';
 try {
  const b=Object.fromEntries(new FormData(form)); b.fictif=form.elements.fictif.checked;
  const r=await fetch('/api/enseignant/analyser',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
  const d=await r.json();
  if(!r.ok) throw Error(d.message||'Analyse refusée.');
  output.textContent=d.answer; status.textContent='Brouillon IA non validé. Tentatives restantes ce mois : '+d.remaining;
 } catch(e){status.textContent=e.message||'Erreur technique.';}
 finally{button.disabled=false;}
});
form.addEventListener('reset',()=>{output.textContent='';status.textContent='';});
