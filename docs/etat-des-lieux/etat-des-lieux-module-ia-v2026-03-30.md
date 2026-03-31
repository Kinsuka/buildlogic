# Etat des lieux BuildLogic - Module IA

Version du document : `v2026-03-30`
Date : `2026-03-30`
Auteur : `Codex`
Perimetre : wizard IA de creation de projet, assistant projet, architecture actuelle et points ouverts.

---

## 1. Resume executif

Le module IA est maintenant branche dans l'application sans recharger `App.jsx` inutilement.

L'etat actuel permet :

- de lancer un wizard IA depuis "Nouveau projet"
- de coller un rapport de visite
- de laisser le LLM poser des questions progressives
- de repondre via choix rapides + precision libre
- de generer un SQL de creation en arriere-plan
- de creer le projet via l'Edge Function Supabase
- d'ouvrir un chat assistant sur un projet charge

Le build passe actuellement avec `npm run build`.

---

## 2. Architecture actuelle

### Fichiers concernes

- `src/App.jsx`
- `src/components/NewProjectModal.jsx`
- `src/components/ProjectChatPanel.jsx`
- `src/lib/llm.js`

### Repartition des responsabilites

- `src/App.jsx` : orchestration minimale, ouverture du wizard, ouverture du chat assistant projet
- `src/components/NewProjectModal.jsx` : flux wizard IA + fallback manuel
- `src/components/ProjectChatPanel.jsx` : chat flottant sur projet ouvert
- `src/lib/llm.js` : config providers, appel LLM, prompt wizard, prompt assistant projet, extraction SQL

### Choix d'architecture retenu

La demande initiale poussait a remettre beaucoup de logique dans `App.jsx`, mais l'implementation actuelle garde le meme resultat produit tout en restant modulaire.

Cela permet :

- de limiter le couplage
- de garder `App.jsx` lisible
- d'isoler la logique IA dans des composants et helpers dedies
- de faciliter les corrections du wizard sans toucher au coeur de l'app

---

## 3. Etat fonctionnel actuel

### 3.1. Wizard IA de creation

Le wizard IA dans `src/components/NewProjectModal.jsx` propose :

- configuration du provider (`Claude`, `OpenAI`, `Mistral`)
- saisie et memorisation locale de la cle API
- collage d'un rapport de visite
- conversation iterative avec le LLM
- fallback manuel conserve

### 3.2. Reponses utilisateur dans le wizard

Le comportement actuel du chat wizard est le suivant :

- les choix detectes dans la reponse IA sont affiches comme options selectionnables
- plusieurs choix peuvent etre combines
- un champ libre reste disponible pour ajouter une precision
- le bouton `Suivant` envoie la reponse composee

Ce comportement a ete ajuste pour coller au besoin metier :

- ne pas forcer l'utilisateur a tout taper
- permettre quand meme d'ajouter du contexte libre
- eviter un bouton "Autre / precision" separe

### 3.3. Creation projet IA

Le SQL n'est plus affiche a l'utilisateur.

Le flux actuel est :

1. le LLM genere un bloc SQL en arriere-plan
2. le wizard affiche simplement que le projet est pret
3. le clic sur `Creer le projet` appelle l'Edge Function `exec-project-sql`
4. si l'execution SQL echoue, une tentative de correction automatique est faite via le LLM a partir de l'erreur PostgreSQL
5. le SQL corrige est reexecute

### 3.4. Chat assistant projet

Le chat assistant dans `src/components/ProjectChatPanel.jsx` permet :

- d'ouvrir un panneau lateral sur un projet charge
- de poser des questions sur le devis
- d'obtenir des explications, ajustements ou pistes d'optimisation

Le chat assistant ne genere pas de SQL.

---

## 4. Probleme rencontre et corrections deja faites

### Probleme SQL constate

Une erreur reelle a ete observee sur la creation :

- `column "nom" of relation "bl_projects" does not exist`

Cela montrait que le LLM utilisait un mauvais schema SQL, avec des colonnes hors modele BuildLogic.

### Corrections mises en place

Dans `src/lib/llm.js`, le prompt wizard a ete durci avec :

- le schema explicite de `bl_projects`
- les tables metier utiles (`bl_lots`, `bl_metiers`, `bl_mo_lines`, `bl_mat_lines`, `bl_suspens`)
- la liste des colonnes interdites
- les contraintes critiques de nommage

Dans `src/components/NewProjectModal.jsx`, on a ajoute :

- une execution SQL centralisee
- une auto-reparation en cas d'erreur SQL
- une nouvelle tentative d'execution apres correction

---

## 5. Limites actuelles

Le module IA est utilisable, mais il reste des points a surveiller.

### 5.1. Detection des choix LLM

La detection des options cliquables repose sur une extraction de lignes de texte dans la reponse du modele.

Implication :

- si le modele change fortement son format de reponse, les choix peuvent etre moins bien detectes

### 5.2. Reponse composee envoyee au modele

La reponse utilisateur est actuellement envoyee comme combinaison texte du type :

- `choix 1 | choix 2 | precision libre`

C'est simple et robuste, mais pas encore semantiquement structure.

### 5.3. Auto-correction SQL

La correction automatique aide beaucoup, mais ne garantit pas a 100 % la reussite si la sortie LLM derive trop du schema attendu.

### 5.4. Absence de validation applicative forte avant execution

Aujourd'hui, on valide surtout par :

- prompt strict
- execution Edge Function
- retour d'erreur SQL
- tentative de correction

Il n'y a pas encore de couche locale de verification structurelle du SQL avant execution.

---

## 6. Points ouverts recommandés

### Priorite haute

- tester plusieurs cas reels de rapports de visite
- confirmer que les SQL produits couvrent bien les tables `bl_*` attendues
- verifier que les projets crees remontent toujours avec un `projet_json` exploitable

### Priorite moyenne

- rendre les choix multi-selection encore plus explicites visuellement
- enrichir la detection des choix si certains LLM renvoient des formats moins standards
- ajouter une validation locale minimale sur certains marqueurs SQL attendus avant execution

### Priorite produit

- decider si le SQL doit rester totalement masque ou si un mode expert doit exister plus tard
- definir jusqu'ou le chat assistant projet peut aller : conseil seul, ou futures actions sur devis

---

## 7. Etat actuel par objectif

### Objectif : wizard IA

- statut : `partiellement stabilise`
- resultat : fonctionnel, utilisable, build OK
- reserve : robustesse SQL a confirmer sur plusieurs cas reels

### Objectif : assistant projet

- statut : `operationnel`
- resultat : panel lateral branche et exploitable
- reserve : pas encore de mecanisme d'action directe sur le devis

### Objectif : garder une architecture saine

- statut : `atteint`
- resultat : logique sortie de `App.jsx`, modularite preservee

---

## 8. Verification technique

Verification effectuee apres les derniers ajustements :

- `npm run build` OK

---

## 9. Recommandation pour la suite immediate

La prochaine etape la plus utile n'est probablement plus de refactorer, mais de valider le wizard IA sur 3 a 5 rapports de visite reels.

But :

- identifier les cas ou le LLM pose de mauvaises questions
- identifier les cas ou le SQL reste faux malgre le prompt
- ajuster ensuite finement le prompt et les garde-fous
