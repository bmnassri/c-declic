# Rapport final d'audit — C'Déclic 1.0.0
Date : 26 novembre 2026. Périmètre : pilote fictif, dépôt privé, Node/Express, PostgreSQL, Railway et Anthropic.
## Méthode et preuves
Relecture ciblée du code et des configurations, tests automatisés, contrôles manuels déclarés par le porteur du projet. Les statuts CI verts, 32/32 contrôles Railway et 16/16 contrôles Anthropic sont confirmés par le porteur, non vérifiés indépendamment dans les consoles. Aucun test d'intrusion exhaustif ni certification.
| Domaine | Résultat et preuve |
|---|---|
| Accès et HTTP | Sessions signées par HMAC côté serveur, cookies HttpOnly/SameSite Strict/Secure en production, contrôle de rôle, origine POST, CSP, HSTS, no-store ; tests HTTP locaux |
| Supervision | Brouillons réservés à l'enseignant, validation explicite, trois niveaux ; tests d'intégration |
| Budget | Réservation SQL atomique, quota 20, estimation 10 EUR/mois, blocage avant comptage ; tests PostgreSQL isolés et Claude simulé |
| Dépendances | npm audit au seuil high ; résultat vert déclaré, pas garantie d'absence de vulnérabilité |
| Secrets | Inspection ciblée et Gitleaks historique accessible ; résultat vert déclaré |
| Railway | 32 contrôles déclarés réussis, dont non-régression sans génération |
| Anthropic | 16 contrôles déclarés réussis ; montant exact du plafond non communiqué |
## Traçabilité
Correctifs HTTP 7731620, budget 202fc61 ; tests sécurité c438d25 ; CI 5a61d8f ; intégration 1de3f8b et 2d82812 ; secrets 68f851f.
## Conclusion
Version stable pour essais fictifs encadrés, sous réserve de CI verte sur le commit final. Pas d'ouverture sur données réelles avant autorisation ECE, validation DPO, contrats et rétention fournisseurs, contrôle des droits graphiques et protection de branche. Voir RISQUES.md. Les tests ne prouvent ni l'absence de toute vulnérabilité ni la qualité de toutes les réponses IA.
