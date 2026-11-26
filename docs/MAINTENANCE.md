# Guide de maintenance
## Déploiement
Dépôt privé bmnassri/c-declic, branche main, Railway production, une réplique, Node 22+, PostgreSQL avec volume. PORT automatique. Configurer les 13 variables de .env.example dans Railway, DATABASE_URL référencée depuis PostgreSQL. Secrets distincts et aléatoires, jamais dans Git. Les tables budgétaires sont initialisées à la première utilisation du budget, pas au démarrage.
## Avant chaque changement
Revue du diff, CI Tests C-Declic et Audit des secrets verts, sauvegarde selon politique institutionnelle, planifier la perte des sessions et dialogues au redéploiement. Configurer protection main et contrôles obligatoires si disponibles ; vérifier leur articulation avec le déploiement automatique Railway.
## Contrôles
Vérifier services Online, logs sans secrets, accès par rôle, formulaire, refus sans IA, budget avant/après, responsive. Les tests d'intégration utilisent PostgreSQL 16 éphémère et Claude simulé. npm test lance les tests locaux ; le job integration active les tests DB. Ne jamais pointer les tests vers la production.
## Budget
10 EUR estimés/mois UTC, 20 tentatives, tarifs configurés 4/20 EUR par million de tokens, plafond entrée 16000, réserve 0,076 EUR. Vérifier prix, factures et plafond fournisseur ; les coûts Railway sont distincts. Ne pas modifier les compteurs pour tester.
## Incident et retour arrière
Désactiver AI_PILOT_ENABLED et SUPERVISION_PILOT_ENABLED ; révoquer une clé compromise, remplacer les secrets dans Railway, redéployer. Prévenir DSI/DPO selon incident. Ne pas copier les données sensibles dans les tickets. Revenir au dernier commit validé via Railway/GitHub après revue ; ne pas effacer le volume PostgreSQL. Vérifier compatibilité des migrations et compteurs.
