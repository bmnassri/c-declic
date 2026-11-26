(()=>{
'use strict';
const root=document.querySelector('#budget');
const status=root.querySelector('[role=status]'), values=root.querySelector('.budget-values'), progress=root.querySelector('progress'), refresh=root.querySelector('button');
const euro=n=>n===null?'Non disponible':new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:4}).format(n);
const num=n=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(n);
const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
const scale=el('div','budget-scale');for(const t of ['0 %','50 %','80 %','100 %'])scale.append(el('span','',t));progress.after(scale);
const detail=el('p','budget-progress-detail');progress.before(detail);
const svg=(tag,attrs)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;};
function render(d){
 values.replaceChildren();
 const known=d.configured&&d.remaining!==null, used=d.spent+d.held, pct=Math.max(0,Math.min(100,d.percent));
 const hero=el('section','budget-overview'), ring=el('div','budget-ring'), chart=svg('svg',{viewBox:'0 0 120 120','aria-hidden':'true'});
 chart.append(svg('circle',{cx:60,cy:60,r:48,fill:'none',stroke:'#C1E7E3','stroke-width':12}));
 if(known)chart.append(svg('circle',{cx:60,cy:60,r:48,fill:'none',stroke:d.percent>=100?'#FFA64D':d.percent>=80?'#FFA64D':'#78CCFF','stroke-width':12,pathLength:100,'stroke-dasharray':pct+' 100',transform:'rotate(-90 60 60)'}));
 const center=el('div','budget-ring-center');center.append(el('strong','',known?num(d.percent)+' %':'—'),el('small','','engagé'));ring.append(chart,center);
 const balance=el('div','budget-balance');balance.append(el('span','','Budget disponible'),el('strong','',euro(d.remaining)),el('small','','sur '+euro(d.cap)+' · '+d.month+' UTC'));hero.append(ring,balance);values.append(hero);
 const breakdown=el('section','budget-breakdown');breakdown.append(el('h3','','Répartition du budget'));
 for(const [cls,label,value] of [['measured','Coût estimé mesuré',d.spent],['held','Réservations prudentes',d.held],['available','Budget disponible',d.remaining]]){
 const row=el('div','budget-line');row.append(el('i','budget-dot '+cls),el('span','',label),el('strong','',euro(value)));breakdown.append(row);}
 values.append(breakdown);
 const quota=el('section','budget-quota');quota.append(el('h3','','Quota mensuel'),el('strong','',d.attempts+' / '+d.limit+' tentatives'));
 const q=el('progress');q.max=d.limit;q.value=d.attempts;q.setAttribute('aria-label','Tentatives utilisées');quota.append(q,el('small','',Math.max(0,d.limit-d.attempts)+' restantes · '+num(d.attempts/d.limit*100)+' % utilisé'));values.append(quota);
 const tokens=el('section','budget-tokens');for(const [label,value] of [['Tokens entrants mesurés',d.inputTokens],['Tokens sortants mesurés',d.outputTokens]]){const tile=el('div','budget-token');tile.append(el('span','',label),el('strong','',num(value)));tokens.append(tile);}values.append(tokens);
 progress.value=known?pct:0;progress.hidden=!known;scale.hidden=!known;
 detail.textContent=known?euro(used)+' engagés sur '+euro(d.cap)+' · '+num(d.percent)+' %':'Part engagée non disponible';
 status.textContent=(!d.configured?'Configuration budgétaire requise. Appels bloqués.':d.blocked?'Appels bloqués : quota ou budget insuffisant.':'Appels autorisés sous réserve du contrôle serveur.')+' '+(d.percent>=100?'Seuil 100 % atteint.':d.percent>=80?'Alerte : seuil 80 % atteint.':d.percent>=50?'Attention : seuil 50 % atteint.':'')+(d.legacy?' '+d.legacy+' anciennes tentatives sans mesure exacte.':'');
 if(d.held>0)status.textContent+=' Les réservations ne sont pas des dépenses facturées.';
}
async function load(){refresh.disabled=true;try{const r=await fetch('/api/enseignant/budget');if(!r.ok)throw Error('Budget indisponible.');render(await r.json());}catch(e){status.textContent=e.message;values.replaceChildren();progress.hidden=true;scale.hidden=true;detail.textContent='Données indisponibles.';}finally{refresh.disabled=false;}}
refresh.addEventListener('click',load);load();
})();
