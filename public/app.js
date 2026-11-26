const form=document.querySelector('#analyse');
const statusBox=document.querySelector('#status');
const submit=form.querySelector('[type=submit]');
let controller;
form.addEventListener('submit',async e=>{
  e.preventDefault();controller?.abort();const current=new AbortController();controller=current;submit.disabled=true;statusBox.textContent='Vérification…';
  try{const response=await fetch('/api/analyser',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form))),signal:current.signal});const data=await response.json();if(controller===current)statusBox.textContent=data.message||'Réponse inattendue.';}catch(err){if(controller===current)statusBox.textContent='Impossible de joindre le serveur. Réessaie.';}finally{if(controller===current)submit.disabled=false;}
});
form.addEventListener('reset',()=>{controller?.abort();controller=null;submit.disabled=false;statusBox.textContent='';});
