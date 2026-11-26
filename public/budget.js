(()=>{
'use strict';
const root=document.querySelector('#budget');
const status=root.querySelector('[role=status]'), values=root.querySelector('.budget-values'), progress=root.querySelector('progress');
const euro=n=>n===null?'Non disponible':new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:4}).format(n);
async function load(){
 try{
 const r=await fetch('/api/enseignant/budget');if(!r.ok)throw Error('Budget indisponible.');
 const d=await r.json();values.replaceChildren();
 for(const [label,value] of [['Plafond mensuel',euro(d.cap)],['Coût estimé mesuré',euro(d.spent)],['Réservations prudentes',euro(d.held)],['Budget disponible',euro(d.remaining)],['Tentatives',d.attempts+' / '+d.limit],['Tokens entrants mesurés',d.inputTokens],['Tokens sortants mesurés',d.outputTokens],['Mois UTC',d.month]]){
 const div=document.createElement('div'), title=document.createElement('span'), val=document.createElement('strong');title.textContent=label;val.textContent=value;div.append(title,val);values.append(div);
 }
 progress.value=Math.min(100,d.percent);
 status.textContent=(!d.configured?'Configuration budgétaire requise. Appels bloqués.':d.blocked?'Appels bloqués : quota ou budget insuffisant.': 'Appels autorisés sous réserve du contrôle serveur.')+' '+(d.percent>=100?'Seuil 100 % atteint.':d.percent>=80?'Alerte : seuil 80 % atteint.':d.percent>=50?'Attention : seuil 50 % atteint.':'')+(d.legacy?' '+d.legacy+' anciennes tentatives sans mesure exacte.':'');
 }catch(e){status.textContent=e.message;values.replaceChildren();progress.value=0;}
}
root.querySelector('button').addEventListener('click',load);load();
})();
