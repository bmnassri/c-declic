(()=>{'use strict';
const code=document.querySelector('#code');
if(code){
 if(!code.closest('.editor-body')){
  const shell=document.createElement('div');shell.className='editor-shell';
  const title=document.createElement('div');title.className='editor-title';
  for(const t of ['main.c','Langage C']){const span=document.createElement('span');span.textContent=t;title.append(span);}
  const body=document.createElement('div');body.className='editor-body';
  const lines=document.createElement('pre');lines.className='editor-lines';lines.setAttribute('aria-hidden','true');
  code.before(shell);shell.append(title,body);body.append(lines,code);
 }
 const body=code.closest('.editor-body'),lines=body.querySelector('.editor-lines');
 const pre=document.createElement('pre');pre.className='editor-highlight';pre.setAttribute('aria-hidden','true');body.insertBefore(pre,code);
 const footer=document.createElement('div');footer.className='editor-footer';const count=document.createElement('span'),lang=document.createElement('span');lang.textContent='UTF-8 · C';footer.append(count,lang);body.parentElement.append(footer);
 code.wrap='off';
 const pattern=/(\/\*[\s\S]*?(?:\*\/|$)|\/\/[^\n]*|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|^\s*#[^\n]*|\b(?:auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|restrict|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|_Bool|_Atomic|_Static_assert)\b|\b(?:0[xX][0-9a-fA-F]+|\d+(?:\.\d+)?)\b)/gm;
 function scroll(){lines.scrollTop=code.scrollTop;pre.scrollTop=code.scrollTop;pre.scrollLeft=code.scrollLeft;}
 function sync(){const value=code.value;count.textContent=value.split('\n').length+' ligne(s)';lines.textContent=Array.from({length:value.split('\n').length},(_,i)=>i+1).join('\n');const frag=document.createDocumentFragment();let pos=0;for(const m of value.matchAll(pattern)){frag.append(document.createTextNode(value.slice(pos,m.index)));const n=document.createElement('span'),t=m[0];n.className='tok-'+(t.startsWith('//')||t.startsWith('/*')?'comment':t.startsWith('"')||t.startsWith("'")?'string':t.trimStart().startsWith('#')?'directive':/^\d/.test(t)?'number':'key');n.textContent=t;frag.append(n);pos=m.index+t.length;}frag.append(document.createTextNode(value.slice(pos)+'\n'));pre.replaceChildren(frag);scroll();}
 code.addEventListener('input',sync);code.addEventListener('scroll',scroll);code.form.addEventListener('reset',()=>requestAnimationFrame(sync));sync();body.classList.add('highlight-ready');
}
const paths={overview:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',requests:'M4 4h16v16H4z M8 8h8 M8 12h8 M8 16h5',budget:'M12 3v9h9 M21 12a9 9 0 1 1-9-9',lab:'M9 3h6 M10 3v7L4 20h16l-6-10V3 M7 15h10',submit:'M8 6l-6 6 6 6 M16 6l6 6-6 6 M14 4l-4 16',think:'M12 3a7 7 0 0 0-4 13v3h8v-3a7 7 0 0 0-4-13 M9 22h6',understand:'M4 12l5 5L20 6'};
function icon(key){const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),p=document.createElementNS(ns,'path');for(const [k,v] of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.8','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true',class:'ui-icon'}))svg.setAttribute(k,v);p.setAttribute('d',paths[key]);svg.append(p);return svg;}
for(const a of document.querySelectorAll('.workspace-nav [data-view]')){const label=a.textContent.replace(/^\S+\s+/,'');a.replaceChildren(icon(a.dataset.view),document.createTextNode(label));}
document.querySelectorAll('.journey .step').forEach((n,i)=>{n.replaceChildren(icon(['submit','think','understand'][i]));const num=document.createElement('span');num.className='step-number';num.textContent='0'+(i+1);n.parentElement.append(num);});
 document.querySelectorAll('.metric').forEach((n,i)=>{n.prepend(icon(['budget','understand','requests'][i]));const small=document.createElement('small');small.textContent=['À examiner','Réponses transmises','À vérifier'][i];n.append(small);});
if(!document.body.classList.contains('teacher-workspace'))return;
const nav=[...document.querySelectorAll('.workspace-nav [data-view]')], heading=document.querySelector('#workspace-heading');
const views={overview:['Tableau de bord','overview-metrics','supervision','budget'],requests:['Supervision pédagogique','supervision'],budget:['Pilotage financier','budget'],lab:['Laboratoire IA','etudiant']};
function render(){const link=nav.find(a=>a.hash===location.hash), view=link?.dataset.view||'overview', config=views[view];document.body.dataset.view=view;heading.textContent=config[0];for(const id of ['overview-metrics','supervision','budget','etudiant'])document.getElementById(id).hidden=!config.includes(id);for(const a of nav){if(a.dataset.view===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}}
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});render();
})();