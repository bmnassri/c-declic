# Notice de confidentialité — pilote fictif
Version 1.0.0, 26 novembre 2026. Notice provisoire à faire valider par l'établissement.
## Finalité
Aider à comprendre les erreurs de programmation C, sans notation ni exécution du code. Claude prépare un brouillon ; l'enseignant décide de sa transmission.
## Données et destinataires
Notion, énoncé, code, erreur, question, diagnostic, indices, échanges, état de validation et signalement sont traités temporairement sur Railway. Les contenus nécessaires sont envoyés à Anthropic pour comptage et génération. L'enseignant voit les demandes et brouillons ; la session étudiante voit ses réponses validées. Les compteurs mensuels globaux (tentatives, tokens, coûts estimés et réservations) sont stockés dans PostgreSQL. Des métadonnées techniques, notamment IP pour limitation des accès, peuvent être traitées ; journaux et sauvegardes fournisseurs à vérifier.
## Durées
Demandes : expiration logique au plus tard une heure, purge périodique toutes les 30 secondes, révocation à la déconnexion et perte au redémarrage. Sessions : huit heures maximum. Les agrégats mensuels n'ont pas de purge automatique documentée. Durées fournisseurs et journaux à confirmer.
## Consignes et droits
Ne saisir aucune identité, note, donnée personnelle, secret ou code confidentiel. Nouvelle analyse efface la demande active ; la fin du dialogue retire la saisie initiale mais conserve temporairement l'historique validé. La suppression locale ne garantit pas la suppression chez les fournisseurs.
Avant données réelles : identifier responsable, base légale, DPO/contact, droits et modalités d'exercice, transferts, sous-traitants, durées et éventuelle analyse d'impact. Aucun contact inventé. En cas de saisie accidentelle, prévenir l'enseignant et le référent institutionnel, ne pas relancer l'analyse.
