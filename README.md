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

## Itération 2 — Accès pilote
Cette section remplace les indications d’accès de l’itération 1. Dans Railway, définir APP_PASSWORD et TEACHER_PASSWORD (distincts, au moins 12 caractères), SESSION_SECRET (aléatoire, au moins 32 caractères), NODE_ENV=production. PORT reste automatique. Sans configuration valide le serveur refuse de démarrer. Ne jamais déposer les valeurs dans GitHub. Les sessions expirent après 8 heures et sont perdues au redémarrage ; utiliser une seule réplique. Limitation des échecs : 5 par IP ou 100 globalement sur 15 minutes ; des utilisateurs partageant une IP peuvent être bloqués ensemble. Pas de comptes individuels. Aucun appel IA ni stockage des saisies.

Déposer les fichiers complets en conservant les dossiers private et public. Supprimer impérativement l'ancien public/index.html du dépôt : il est remplacé par private/index.html. Tester les deux rôles, un mauvais mot de passe, cinq échecs puis refus, accès direct à /enseignant avec session étudiant (403), accès direct à / sans session (redirection), POST /api/analyser sans session (401), déconnexion et retour arrière, puis tous les tests du formulaire V1. Vérifier les logs sans exposer de secrets. Ne pas ouvrir aux étudiants avant audit.
