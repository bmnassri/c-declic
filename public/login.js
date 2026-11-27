if(new URLSearchParams(location.search).has('erreur')) document.querySelector('#login-error').textContent='Identifiants incorrects.';

const password=document.getElementById('password');
const toggle=document.getElementById('password-toggle');
if(password&&toggle){toggle.hidden=false;password.classList.add('custom-reveal');toggle.addEventListener('click',()=>{const show=password.type==='password';password.type=show?'text':'password';toggle.setAttribute('aria-pressed',String(show));toggle.setAttribute('aria-label',show?'Masquer le mot de passe':'Afficher le mot de passe');});password.form.addEventListener('submit',()=>{password.type='password';toggle.setAttribute('aria-pressed','false');toggle.setAttribute('aria-label','Afficher le mot de passe');});}
