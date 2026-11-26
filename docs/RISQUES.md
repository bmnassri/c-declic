# Registre des risques résiduels
Évaluation qualitative proposée (élevé, moyen, faible), non homologuée. Responsable proposé : porteur du projet, avec DPO/DSI pour les décisions institutionnelles.
| Risque | Niveau | Mesure existante | Action restante |
|---|---|---|---|
| Données personnelles saisies malgré consigne | Élevé | Confirmation fictive, mémoire temporaire | Autorisation DPO, procédure de retrait, sensibilisation |
| Rétention/transferts fournisseurs | Élevé | Minimisation | Vérifier contrats, régions, rétention, sauvegardes et droits |
| Mot de passe partagé ou clé compromise | Élevé | Rôles, limitation, secrets Railway | Rotation privée, comptes individuels avant extension, MFA administrateurs |
| Corrigé ou diagnostic erroné | Moyen | Validation humaine obligatoire | Contrôle de chaque réponse, signalement et refus |
| Dépassement facture | Moyen | Quota, réserve, plafond fournisseur déclaré | Rapprocher factures, change et taxes ; réserve estimée non garantie |
| Perte de dialogue au redémarrage | Moyen | Stockage RAM volontaire | Informer, planifier déploiements, une réplique |
| Déni de service | Moyen | Limites de taille et de requêtes | Surveiller saturation et blocage partagé par IP |
| Dépendance ou secret non détecté | Moyen | CI, Gitleaks | Protection main, revue des mises à jour, scans réguliers |
| Conservation des agrégats et logs | Moyen | Pas de dialogue en PostgreSQL | Fixer durée et purge, vérifier logs proxy |
| Charte et marque ECE | Moyen | Palette intégrée | Autorisation institutionnelle et droits des polices/logo |
## Décision
Aucun risque n'est déclaré accepté au nom de l'ECE. Les risques élevés liés aux données réelles bloquent l'ouverture correspondante. Réexaminer après incident, changement fournisseur ou version.
