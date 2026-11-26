# C'Déclic | ECE — 1.0.0

**De l'erreur à la compréhension.** Assistant pédagogique de programmation C, en français. L'IA te guide, la solution vient de toi.

## Statut
Pilote sur données fictives uniquement. Pas de certification RGPD ni d'autorisation institutionnelle présumée. Aucun code C exécuté, aucune notation. Une seule réplique Railway.

## Déploiement
Node.js 22+, Express, PostgreSQL, Claude côté serveur. Relier le dépôt privé à Railway, ajouter PostgreSQL et référencer DATABASE_URL. PORT automatique. Configurer les variables de .env.example dans Railway, jamais leurs valeurs secrètes dans GitHub. Générer deux mots de passe distincts et un secret aléatoire privé. Activer les pilotes seulement après contrôle des accès et du budget fournisseur. Domaine HTTPS Railway.

## Utilisation
Étudiant : choisir une notion, saisir énoncé, code fictif, erreur facultative et question, confirmer l'absence de données personnelles, envoyer à l'enseignant. Actualiser pour recevoir la réponse validée. Répondre ou demander l'indice suivant (trois niveaux maximum), signaler, terminer ou recommencer.
Enseignant : actualiser les demandes, analyser avec Claude, vérifier diagnostic et pertinence, modifier question et indice, valider explicitement ou refuser. Ne jamais transmettre un corrigé complet. Le laboratoire est réservé aux essais fictifs. Actualiser le budget après analyse.

## Confidentialité — notice provisoire
Finalité : accompagnement pédagogique. Les saisies et échanges sont conservés en mémoire serveur au maximum une heure, avec purge périodique (30 secondes), ou supprimés au redémarrage. La déconnexion révoque la session et déclenche la purge des demandes associées. Les sessions expirent après huit heures. Les demandes sont accessibles à l'enseignant et à la session étudiante propriétaire (réponses validées uniquement). Les contenus nécessaires sont transmis à Anthropic pour comptage et génération. Ne saisir ni identité, ni notes, ni secrets, ni données personnelles. Les compteurs mensuels globaux PostgreSQL ne contiennent pas de dialogue. Leur durée de conservation et celle des journaux, sauvegardes et données fournisseur doivent être fixées par l'établissement. Responsable du traitement, base légale, contacts DPO, droits, contrats de sous-traitance, transferts et rétention fournisseur à confirmer avant ouverture réelle.

## Budget
10 EUR mensuels estimés pour l'API, hors Railway, quota 20 tentatives, mois UTC. Tarifs prudents configurés, réservation atomique avant génération, réservation conservée en cas d'incertitude. Les anciennes tentatives sans mesure sont estimées par réservation. Ce dispositif ne garantit pas la facture fournisseur : vérifier tarifs, change, taxes et plafond Anthropic. Ne pas modifier les tarifs en cours de mois sans rapprochement comptable.

## Tests et maintenance
GitHub Actions : npm test et npm audit. Tests HTTP locaux sans clé ni base de production. Vérifier les résultats avant validation. Les tests PostgreSQL isolés et Claude simulé de bout en bout sont intégrés ; leurs résultats verts ont été confirmés par le porteur du projet. Vérifier manuellement les deux rôles, la validation humaine, les trois niveaux, le signalement, la persistance et le budget. Ne jamais copier de secrets ou de saisies dans les tickets. En cas d'incident désactiver AI_PILOT_ENABLED et SUPERVISION_PILOT_ENABLED, révoquer les clés compromises, prévenir le référent institutionnel et examiner les journaux sans données sensibles.

## Conditions avant ouverture sur données réelles
Audit des dépendances et de l'historique Git, tests isolés, vérification Railway/Anthropic, validation DPO et autorisation ECE, contrôle de la charte et des droits d'utilisation. La version stable du pilote fictif ne constitue pas une homologation. Vérifier les workflows sur le commit final avant publication.

## Documentation finale
- [Rapport d’audit](docs/AUDIT.md)
- [Registre des risques](docs/RISQUES.md)
- [Notice de confidentialité](docs/CONFIDENTIALITE.md)
- [Guide étudiant](docs/GUIDE-ETUDIANT.md)
- [Guide enseignant](docs/GUIDE-ENSEIGNANT.md)
- [Maintenance](docs/MAINTENANCE.md)
- [Historique des versions](CHANGELOG.md)
- [Notes de publication](docs/RELEASE.md)
