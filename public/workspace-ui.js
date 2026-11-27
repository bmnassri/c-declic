(()=>{'use strict';
const code=document.querySelector('.editor-body #code'), lines=document.querySelector('.editor-lines');
if(code&&lines){const sync=()=>{lines.textContent=Array.from({length:Math.max(1,code.value.split('\n').length)},(_,i)=>i+1).join('\n');lines.scrollTop=code.scrollTop;};code.addEventListener('input',sync);code.addEventListener('scroll',sync);code.form.addEventListener('reset',()=>requestAnimationFrame(sync));sync();}
if(!document.body.classList.contains('teacher-workspace'))return;
const nav=[...document.querySelectorAll('.workspace-nav [data-view]')], heading=document.querySelector('#workspace-heading');
const views={overview:['Tableau de bord','overview-metrics','supervision','budget'],requests:['Supervision pédagogique','supervision'],budget:['Pilotage financier','budget'],lab:['Laboratoire IA','etudiant']};
function render(){const link=nav.find(a=>a.hash===location.hash), view=link?.dataset.view||'overview', config=views[view];document.body.dataset.view=view;heading.textContent=config[0];for(const id of ['overview-metrics','supervision','budget','etudiant'])document.getElementById(id).hidden=!config.includes(id);for(const a of nav){if(a.dataset.view===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}}
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});render();
})();