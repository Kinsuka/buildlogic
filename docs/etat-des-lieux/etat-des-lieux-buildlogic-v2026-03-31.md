# Etat des lieux BuildLogic

Version du document : `v2026-03-31`
Date : `2026-03-31`
Auteur : `Codex`
Perimetre : situation globale du repo, capacites actuellement en place, dernieres mises a jour et points de vigilance.

---

## 1. Resume executif

BuildLogic est aujourd'hui une application React/Vite branchee a Supabase pour :

- lister les projets
- charger un `projet_json`
- creer un projet manuel
- editer le chiffrage MO et materiaux
- sauvegarder un etat de travail
- lancer un wizard IA de creation de projet
- ouvrir un chat assistant sur un projet charge

Au `2026-03-31`, le repo est propre cote working tree, le build passe, les tests unitaires passent, et les tests E2E mockes passent egalement.

Les avancees les plus notables depuis les precedents etats des lieux sont :

- la persistance de `st_json` dans `bl_projects`
- l'ajout du wizard IA et du chat assistant projet
- l'introduction d'un `assistant_state` structure
- la mise en place du cadre assistant "comite metier + chef de chantier central"
- l'ajout d'une base de tests `Vitest` + `Playwright`
- l'ajout d'un workflow GitHub Actions E2E

---

## 2. Ce qu'on a aujourd'hui

### Stack et structure

- Frontend : React 18 + Vite
- Data : Supabase JS cote client
- Build : `vite build`
- Tests unitaires : `vitest`
- Tests E2E : `playwright`
- CI presente : `.github/workflows/e2e.yml`

### Capacites fonctionnelles confirmees

- ouverture de l'app et affichage de l'ecran d'accueil
- ouverture du selecteur de projets
- chargement d'un projet existant
- creation manuelle d'un projet
- edition des lignes MO et materiaux
- sauvegarde locale + persistance partielle en base via `st_json`
- rechargement des donnees sauvegardees
- wizard IA pour creer un projet a partir d'un rapport de visite
- chat assistant flottant sur projet ouvert

### Fichiers clefs dans l'etat actuel

- `src/App.jsx` : orchestration globale, chargement projet, sauvegarde, ouverture du chat assistant
- `src/components/NewProjectModal.jsx` : wizard IA + mode manuel
- `src/components/ProjectChatPanel.jsx` : chat assistant projet
- `src/lib/llm.js` : providers, prompts, extraction SQL, logs dev
- `src/lib/assistantState.js` : shape et merge du state assistant
- `src/lib/projects.js` : acces Supabase pour la liste, le chargement et la creation projet

---

## 3. Dernieres updates

### 2026-03-29

Commit notable : `a9c4bd4 feat: persistance state st_json dans Supabase`

Effet concret :

- `loadProjectsList()` charge maintenant `st_json`
- au chargement d'un projet, `st_json` Supabase prime sur le cache local
- le bouton de sauvegarde pousse une partie du `ST` dans `bl_projects.st_json`

### 2026-03-30

Commit notable : `8ff78f8 interactive chat component added`

Effet concret :

- ajout du wizard IA dans `NewProjectModal.jsx`
- ajout du composant `ProjectChatPanel.jsx`
- centralisation des appels LLM dans `src/lib/llm.js`
- ajout de la task de cadrage `tasks/TASK_wizard_chat_IA.md`
- ajout de la doc de cartographie assistant et du point de situation module IA

### 2026-03-31

Commit notable : `e20a94d intermediat save`

Effet concret :

- ajout de `src/lib/assistantState.js`
- ajout de tests unitaires sur `assistantState`
- ajout des tests E2E sur chargement, lecture, creation, edition et flow assistant
- ajout du workflow CI `.github/workflows/e2e.yml`
- ajout d'un cadrage assistant modulaire dans `docs/assistant/`
- ajout de helpers pour le wording belge, la terminologie FR -> BE, les reviewers metier et l'orchestrateur central
- ajout d'une synthese reviewer-par-reviewer reutilisable dans les prompts wizard et chat projet

---

## 4. Etat actuel du module IA

### Wizard creation projet

Le wizard IA est bien branche dans `NewProjectModal.jsx` :

- choix du provider (`Claude`, `OpenAI`, `Mistral`)
- memorisation optionnelle de la cle API en local
- collage d'un rapport de visite
- pre-analyse interne reviewer-par-reviewer du rapport avant questionnement
- tours de questions/reponses avec choix rapides detectes dans la reponse LLM
- generation d'un SQL final si les infos sont jugees suffisantes
- execution du SQL via l'Edge Function Supabase
- tentative de reparation du SQL en cas d'echec d'execution

Le cadre prompt du wizard n'est plus pense comme un assistant generaliste.
Il est maintenant aligne sur :

- un comite de responsables metier
- un chef de chantier central
- un wording chantier belge
- une reduction des questions administratives non utiles

### Chat assistant projet

Le chat projet est branche depuis `App.jsx` vers `ProjectChatPanel.jsx`.

Il permet aujourd'hui :

- de poser des questions sur le devis charge
- d'obtenir des explications et suggestions
- de memoriser un `assistant_state` cote projet
- de beneficier d'une relecture metier structuree du devis dans le prompt

Limite importante :

- le chat projet reste un assistant de conseil
- il ne modifie pas encore directement le devis

### Assistant state

Un state assistant structure existe maintenant avec :

- `phase`
- `turn`
- `known_facts`
- `missing_fields`
- `assumptions`
- `suspens`
- `lots_draft`
- `metiers_draft`
- `last_question`
- `last_user_answer`
- `confidence`
- `ready_to_generate`

Constat actuel :

- le wizard IA persiste son `assistant_state` en `localStorage`
- le chat projet persiste son `assistant_state` dans `st_json.assistant.project_chat`
- on a donc une premiere base de reprise d'etat, mais pas encore un schema assistant unifie de bout en bout cote Supabase

---

## 5. Ce qui est verifie au 2026-03-31

Verifications lancees localement aujourd'hui :

- `npm run build` : OK
- `npm test` : OK
- `npm run test:e2e` : OK, `6 passed`

Couverture actuellement en place :

- `src/lib/assistantState.test.js` couvre la creation, normalisation, fusion et serialisation du state assistant
- `src/lib/assistantFramework.test.js` couvre le wording belge, l'absence de questions administratives inutiles, la forme orientee choix et la synthese reviewers + orchestrateur
- `tests/e2e/app-load.spec.ts` couvre le chargement initial
- `tests/e2e/projects-read.spec.ts` couvre l'ouverture d'un projet
- `tests/e2e/projects-create.spec.ts` couvre la creation manuelle
- `tests/e2e/projects-update.spec.ts` couvre l'edition + sauvegarde + reprise
- `tests/e2e/regressions.spec.ts` couvre une regression d'ecran vide et le flow assistant mocke

Important :

- les E2E sont bases sur des mocks reseau, pas sur un vrai environnement Supabase/LLM
- ils valident donc bien le comportement applicatif, mais pas encore toute l'integration reelle bout en bout

---

## 6. Points de vigilance actuels

### 1. Hygiene du repo

Le repo versionne actuellement :

- `dist/`
- `node_modules/`

Un `.gitignore` racine a maintenant ete ajoute pour preparer le nettoyage, mais les fichiers deja suivis restent encore presents dans l'historique et dans l'index Git.

Impact :

- historique Git lourd
- bruit important dans les commits
- risque de confusion entre sources, build output et dependances

### 2. Incoherence de wording de deploiement

Le haut de `src/App.jsx` mentionne encore `BuildLogic v8 NETLIFY`, alors que :

- `vite.config.js` est configure pour GitHub Pages
- un workflow GitHub Actions est en place

Impact :

- la verite technique et le wording produit ne sont pas encore entierement alignes

### 3. Persistance assistant inegale

L'etat assistant n'est pas encore gere de facon completement uniforme :

- wizard : persistance locale navigateur
- chat projet : persistance dans `st_json`

Impact :

- la reprise multi-navigateur est meilleure pour le builder et le chat projet que pour le wizard IA

### 4. Cout et volume de contexte LLM

Le flow actuel reserialise encore beaucoup de contexte a chaque tour :

- historique cumulatif du wizard
- historique cumulatif du chat projet
- JSON projet reinjecte dans le prompt assistant

Impact :

- risque de surcout tokens
- risque de derive si les conversations deviennent longues

### 5. Documentation encore tres legere

Le `README.md` reste quasi vide.

Impact :

- reprise plus difficile sans lire le code ou les docs ponctuelles du dossier `docs/etat-des-lieux/`

---

## 7. Recommandations de suite immediate

### Priorite haute

- ajouter un vrai `.gitignore` et sortir `node_modules/` du versioning
- decider si `dist/` doit vraiment rester versionne
- aligner le wording `Netlify` / `GitHub Pages`

### Priorite produit / IA

- decider si le wizard IA doit aussi persister son `assistant_state` dans Supabase
- clarifier si le chat projet doit rester en mode conseil ou evoluer vers des actions sur devis
- tester le wizard sur plusieurs rapports reels pour mesurer la robustesse SQL hors mocks

### Priorite technique

- reduire la taille de contexte envoyee au LLM
- enrichir le `README.md` avec setup, scripts et architecture
- completer la couverture de tests sur des cas de persistance assistant et de reparation SQL

---

## 8. Conclusion

Le projet a clairement franchi un cap entre le `2026-03-29` et le `2026-03-31`.

On n'est plus seulement sur une app de chiffrage refactoree : on a maintenant un socle applicatif plus structure, une persistance Supabase plus serieuse, un premier vrai module IA utilisable, et une base de tests automatises qui securise les flux principaux.

Le principal enjeu a court terme n'est plus d'ajouter vite de nouvelles briques, mais de consolider :

- l'hygiene du repo
- la coherences docs/deploiement
- la persistance assistant
- la validation du wizard IA sur cas reels
