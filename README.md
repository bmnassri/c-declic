# C'Déclic

**De l'erreur à la compréhension.**

Assistant pédagogique pour apprendre le C à l’ECE, par questionnement socratique.

**L'IA te guide, la solution vient de toi.**

## Itération 1
Prototype de formulaire, sans IA, sans stockage et sans exécution de code. Tests fictifs uniquement. Ne pas ouvrir aux étudiants avant contrôle d’accès et audit.

## Railway (sans terminal)
Dans GitHub, déposer les fichiers en conservant le dossier public/. Dans Railway, créer un service depuis le dépôt GitHub. Le script start lance le serveur ; PORT est fourni par Railway. Générer un domaine dans les paramètres réseau si autorisé. DATABASE_URL, ANTHROPIC_API_KEY et APP_PASSWORD sont réservées aux prochaines itérations ; ne pas les renseigner dans GitHub. Le prototype n’exige aucune clé. Aucun contrôle d’accès n’est encore implémenté.

## Tests manuels
1. Ouvrir la page et cliquer sur Commencer.
2. Soumettre un formulaire vide : refus attendu.
3. Choisir Tableaux, saisir un énoncé fictif, un programme C et une question ; laisser le compilateur vide. Soumettre : confirmation du serveur sans analyse.
4. Réinitialiser : tous les champs et le message disparaissent.
5. Recharger : aucune saisie n’est stockée par le serveur.

Les limites serveur sont 5 000 caractères pour l’énoncé et l’erreur, 20 000 pour le code et 3 000 pour la question. Les polices Funnel sont prévues avec repli Arial ; aucun fichier de police n’est livré.
