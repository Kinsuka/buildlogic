# Etat des lieux BuildLogic

Version du document : `v2026-03-29`
Date : `2026-03-29`
Auteur : `Codex`
Perimetre : reprise du refactor, etat actuel du repo local et points d'attention pour la suite.

---

## 1. Resume executif

BuildLogic est une application React/Vite de budget chantier pour ONA Group, connectee directement a Supabase pour la liste des projets, le chargement d'un `projet_json` et la creation d'un projet vide.

Au moment de la reprise, le point principal etait un `src/App.jsx` devenu trop gros et charge a la fois en logique, presentation, contenu statique et donnees embarquees. La reprise a consisté a reprendre ce monolithe, continuer l'extraction entamee, puis remettre `App` dans un role d'orchestrateur.

L'application build actuellement correctement en local avec `npm run build`.

---

## 2. Etat actuel reel de l'application

### Stack et execution

- Frontend : React 18 + Vite
- Data : Supabase JS direct depuis le client
- Build : `vite build`
- CI/CD configure dans le repo : GitHub Pages
- Base Vite : `/buildlogic/`

### Capacites fonctionnelles visibles

- Charger la liste des projets depuis `bl_projects`
- Charger un projet via `projet_json`
- Creer un nouveau projet vide
- Editer les lignes MO et materiaux
- Gerer versions/snapshots locaux de l'etat de travail
- Exporter un devis en Markdown
- Afficher une fiche client
- Afficher une fiche par metier
- Afficher un rapport chantier
- Afficher une aide de demarrage
- Afficher une documentation integree
- Afficher un referentiel

### Architecture applicative actuelle

Le code n'est plus concentre uniquement dans `App.jsx`.

- `src/App.jsx` : orchestration globale, chargement projet, etat principal, totaux, affichage des modales
- `src/components/` : composants UI et modales
- `src/lib/calculs.js` : logique de calcul
- `src/lib/projects.js` : acces projets Supabase + cache local
- `src/lib/appCss.js` : CSS global de l'app
- `src/lib/referentielSnapshot.js` : snapshot de referentiel extrait du composant principal
- `src/lib/howToContent.js` : contenu de la modale "Comment demarrer"
- `src/lib/documentationContent.js` : contenu de la documentation embarquee
- `src/lib/referentielUiContent.js` : libelles UI du referentiel

---

## 3. Ce qui a ete fait a la reprise

### Objectif de reprise

Continuer un refactor interrompu en cours de route, avec comme cible principale : sortir de `App.jsx` ce qui n'avait rien a faire dans le composant principal, en particulier les gros blocs de rendu et les donnees/contenus statiques.

### Travaux realises

#### 3.1. `App.jsx` remis dans un role d'orchestrateur

Actions menees :

- extraction du CSS global hors de `App.jsx`
- extraction du `REFERENTIEL_SNAPSHOT` hors de `App.jsx`
- branchement de `App.jsx` vers des composants dedies pour les modales et sous-vues
- suppression des anciennes implementations inline conservees temporairement en legacy
- nettoyage des imports inutiles

Effet :

- `App.jsx` reste gros, mais sa responsabilite est beaucoup plus claire
- la maintenance devient faisable sans devoir toucher un bloc JSX geant a chaque iteration

#### 3.2. Externalisation des composants UI

Des composants dedies existent maintenant dans `src/components/` pour les zones qui etaient auparavant melangees dans le composant principal ou qui faisaient partie du refactor en cours :

- `BtnMenu.jsx`
- `DocumentationModal.jsx`
- `FicheClientModal.jsx`
- `FicheMetiersModal.jsx`
- `HistoryPanel.jsx`
- `HowToStartModal.jsx`
- `LotCard.jsx`
- `NewProjectModal.jsx`
- `ProjSelectorModal.jsx`
- `RapportModal.jsx`
- `ReferentielModal.jsx`
- `Toast.jsx`
- composants de lignes/metiers (`LineCardMO.jsx`, `LineCardMat.jsx`, `MetierRow.jsx`)
- `Modal.jsx` comme base commune

#### 3.3. Externalisation du contenu statique

Le contenu textuel et les donnees statiques les plus lourdes ont ete sorties des composants :

- `src/lib/referentielSnapshot.js`
- `src/lib/howToContent.js`
- `src/lib/documentationContent.js`
- `src/lib/referentielUiContent.js`

Cela a permis de separer :

- le contenu
- la logique
- le rendu

#### 3.4. Stabilisation de la doc embarquee

Lors de la poursuite de l'extraction, une incoherence d'import sur les rendements de doc a ete corrigee :

- consommation de `DOC_RENDEMENTS` cote composant
- verification du build apres correction

#### 3.5. Verification technique

Verification realisee pendant la reprise :

- `npm run build` OK

---

## 4. Constats importants sur l'etat du repo

### 4.1. Incoherence de cible de deploiement

Le repo dit aujourd'hui deux choses differentes selon les fichiers :

- `CLAUDE.md` decrit GitHub Pages
- `.github/workflows/deploy.yml` deploie vers GitHub Pages
- `vite.config.js` est configure avec `base: '/buildlogic/'`, ce qui confirme GitHub Pages
- mais la documentation embarquee et certains commentaires parlent encore de "Netlify"

Conclusion :

Le repo reel est aligne GitHub Pages, mais la documentation in-app n'est pas entierement remise a jour.

### 4.2. Incoherence sur le referentiel

L'UI parle de "referentiel live Supabase", mais dans l'etat actuel de `App.jsx`, le referentiel est charge depuis `REFERENTIEL_SNAPSHOT` local.

Conclusion :

- les projets sont bien charges depuis Supabase
- le referentiel, lui, reste embarque en snapshot local
- le wording "live Supabase" est donc trompeur a ce stade

### 4.3. Working tree non propre

Au moment de ce document, le working tree local n'est pas propre :

- `src/App.jsx` modifie
- `CLAUDE.md` modifie
- `src/components/` et `src/lib/` apparaissent comme nouveaux dans le repo local
- `dist/` et `node_modules/` sont presents localement et ne devraient pas etre versionnes

Conclusion :

Le refactor est present dans le workspace, mais pas encore proprement consolide dans l'historique Git.

### 4.4. Exposition de la config Supabase cote client

Le projet utilise une cle anon Supabase dans `src/supabase.js`, ce qui est normal pour une app frontend publique, mais :

- la cle est codée en dur
- elle n'est pas passee par variables Vite

Conclusion :

Ce n'est pas un bug bloquant, mais ce serait plus propre de passer par `import.meta.env`.

---

## 5. Ce qui est mieux qu'au moment de la reprise

- `App.jsx` n'embarque plus les gros blocs de contenu statique les plus problematiques
- la structure du code est nettement plus modulaire
- la documentation et l'onboarding sont externalises en modules de contenu
- le referentiel snapshot n'est plus noye au milieu de `App`
- la passe de refactor actuellement visible build correctement

---

## 6. Ce qu'il reste a faire de prioritaire

### Priorite 1. Aligner la verite produit et la documentation

Decider et corriger partout :

- GitHub Pages ou Netlify
- referentiel live ou snapshot embarque

### Priorite 2. Consolider Git proprement

- verifier ce qui doit etre committe dans `src/components/` et `src/lib/`
- exclure `dist/` et `node_modules/` si ce n'est pas deja fait via `.gitignore`
- produire un historique de commits coherent du refactor

### Priorite 3. Continuer l'allegement des composants restants

Les prochains composants a alleger si on veut poursuivre le meme mouvement sont plutot :

- `FicheClientModal.jsx`
- `FicheMetiersModal.jsx`
- eventuellement certains helpers visuels dans `ReferentielModal.jsx`

Attention : a ce stade, on est davantage sur de l'allegement de presentation que sur de grosses donnees metier a sortir.

### Priorite 4. Durcir la base technique

Pistes utiles ensuite :

- passer la config Supabase sur variables d'environnement Vite
- ajouter un minimum de tests sur les calculs
- ajouter un check lint/quality dans la CI

---

## 7. Inventaire rapide des fichiers cles apres reprise

### Composant principal

- `src/App.jsx`

### Bibliotheques et contenu

- `src/lib/appCss.js`
- `src/lib/calculs.js`
- `src/lib/projects.js`
- `src/lib/referentielSnapshot.js`
- `src/lib/howToContent.js`
- `src/lib/documentationContent.js`
- `src/lib/referentielUiContent.js`

### Composants / modales

- `src/components/Modal.jsx`
- `src/components/NewProjectModal.jsx`
- `src/components/ProjSelectorModal.jsx`
- `src/components/HowToStartModal.jsx`
- `src/components/DocumentationModal.jsx`
- `src/components/ReferentielModal.jsx`
- `src/components/FicheClientModal.jsx`
- `src/components/FicheMetiersModal.jsx`
- `src/components/RapportModal.jsx`
- `src/components/HistoryPanel.jsx`
- `src/components/LotCard.jsx`
- `src/components/MetierRow.jsx`
- `src/components/LineCardMO.jsx`
- `src/components/LineCardMat.jsx`
- `src/components/Toast.jsx`
- `src/components/ErrorBoundary.jsx`
- `src/components/BtnMenu.jsx`

---

## 8. Conclusion

La reprise a permis de sauver un refactor interrompu en rendant l'application a nouveau lisible et manoeuvrable. Le travail le plus rentable a deja ete fait : sortir les gros blocs de contenu et casser la dependance forte a un `App.jsx` monolithique.

Le prochain enjeu n'est plus tellement de "sortir encore des donnees" de `App`, mais de :

1. remettre la documentation et le wording en phase avec la realite du repo
2. consolider proprement le refactor dans Git
3. decider si le referentiel doit vraiment redevenir live Supabase ou assumer un snapshot embarque
