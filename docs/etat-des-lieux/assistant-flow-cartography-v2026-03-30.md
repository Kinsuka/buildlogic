# Cartographie du flow assistant IA actuel

Version du document : `v2026-03-30`
Date : `2026-03-30`
Auteur : `Codex`
Perimetre : PHASE 1 d'instrumentation et cartographie du flow assistant actuel.

---

## 1. Points d'entree LLM identifies

### Wizard creation projet

Fichier : [`NewProjectModal.jsx`](/Users/ksomao/Documents/code/buildlogicapp/src/components/NewProjectModal.jsx)

- analyse initiale du rapport de visite
- tours de clarifications successifs
- tentative de reparation du SQL en cas d'echec d'execution

### Chat assistant projet

Fichier : [`ProjectChatPanel.jsx`](/Users/ksomao/Documents/code/buildlogicapp/src/components/ProjectChatPanel.jsx)

- questions/reponses sur un projet deja ouvert

### Point central d'appel

Fichier : [`llm.js`](/Users/ksomao/Documents/code/buildlogicapp/src/lib/llm.js)

- `callLLM(...)` est le point de passage unique actuel pour tous les appels LLM

---

## 2. Prompts actuels

### Prompt wizard

Fichier : [`llm.js`](/Users/ksomao/Documents/code/buildlogicapp/src/lib/llm.js)

Fonction :

- `buildONASystemPrompt()`

Role actuel :

- contexte entreprise ONA
- tarifs `mo_tarifs`
- consigne de questionnement iteratif
- schema SQL cible
- contraintes de colonnes et ordre attendu

Observation :

- prompt large
- reutilise a chaque tour
- inclut encore toute la logique de generation finale SQL

### Prompt assistant projet

Fichier : [`llm.js`](/Users/ksomao/Documents/code/buildlogicapp/src/lib/llm.js)

Fonction :

- `buildProjectAssistantSystem(project)`

Role actuel :

- contexte projet
- JSON simplifie du devis courant
- consigne de conseil sans generation SQL

Observation :

- plus cible que le wizard
- mais tout le JSON projet est reserialise a chaque appel

---

## 3. Ou l'historique complet est reconstruit

### Wizard

Fichier : [`NewProjectModal.jsx`](/Users/ksomao/Documents/code/buildlogicapp/src/components/NewProjectModal.jsx)

Constat :

- `messages` est stocke dans le state du composant
- a chaque clarification, le tableau complet `nextMessages` repart dans `callLLM`
- lors de la reparation SQL, on repasse encore l'historique de conversation avec un prompt de correction

Impact tokens :

- croissance lineaire avec le nombre de tours
- repetition du rapport initial indirectement via l'historique
- repetition du system prompt complet a chaque appel

### Chat assistant projet

Fichier : [`ProjectChatPanel.jsx`](/Users/ksomao/Documents/code/buildlogicapp/src/components/ProjectChatPanel.jsx)

Constat :

- les messages utilisateur/assistant sont cumules localement
- l'appel repart avec `nextMessages.slice(1)`
- le message d'accueil assistant est exclu, mais le reste de la conversation repart a chaque tour

Impact tokens :

- accumulation progressive de l'historique libre

---

## 4. Ou le rapport brut est injecte

Fichier : [`NewProjectModal.jsx`](/Users/ksomao/Documents/code/buildlogicapp/src/components/NewProjectModal.jsx)

Constat :

- le rapport brut est injecte dans le premier message utilisateur via `analyzeRapport()`

Impact :

- le premier appel wizard est potentiellement le plus lourd
- il sert de base a toute la suite

---

## 5. Ou le SQL final est produit

Fichier : [`NewProjectModal.jsx`](/Users/ksomao/Documents/code/buildlogicapp/src/components/NewProjectModal.jsx)

Constat :

- le SQL final est toujours genere par le LLM
- il est detecte via `extractSQL(reply)`
- il est stocke dans `sqlPreview`
- il est execute ensuite via l'Edge Function Supabase

Observation :

- le SQL n'est plus affiche a l'utilisateur
- mais il reste la sortie canonique du flux wizard
- c'est aujourd'hui la zone la plus fragile du flow

---

## 6. Ou l'etat courant est stocke

### Wizard

Fichier : [`NewProjectModal.jsx`](/Users/ksomao/Documents/code/buildlogicapp/src/components/NewProjectModal.jsx)

Etat courant actuel :

- `step`
- `rapport`
- `messages`
- `input`
- `selectedChoices`
- `sqlPreview`
- `creating`
- erreurs et config provider

Observation :

- il n'existe pas encore de `assistant_state` metier structure
- la source de verite reste principalement le chat + quelques flags UI

### Chat projet

Fichier : [`ProjectChatPanel.jsx`](/Users/ksomao/Documents/code/buildlogicapp/src/components/ProjectChatPanel.jsx)

Etat courant actuel :

- `messages`
- `input`
- `loading`

Observation :

- pur etat conversationnel
- pas d'etat metier assistant distinct

---

## 7. Instrumentation ajoutee en dev

Fichier : [`llm.js`](/Users/ksomao/Documents/code/buildlogicapp/src/lib/llm.js)

Le logging dev est maintenant centralise dans `callLLM(...)`.

En mode dev, chaque appel loggue :

- `provider`
- `phase`
- `feature`
- `turn`
- `messageCount`
- `systemChars`
- `promptChars`
- `payloadChars`
- `responseChars`
- `status` et `error` en cas d'echec

Support de debug :

- logs console via `console.groupCollapsed`
- historique memoire dans `window.__ONA_AI_DEBUG__`

---

## 8. Lecture actuelle des hotspots tokens

Avant meme le refactor de fond, la cartographie montre deja trois hotspots probables.

### Hotspot 1

- analyse initiale wizard
- cause : rapport brut + system prompt large

### Hotspot 2

- clarifications wizard
- cause : historique cumulatif + system prompt complet repete

### Hotspot 3

- generation/reparation SQL
- cause : sortie longue + schema detaille + nouvel aller-retour LLM en cas d'erreur

---

## 9. Conclusion PHASE 1

Le flow actuel est maintenant cartographie et instrumente sans changer le comportement produit.

On sait deja que :

- la source principale de verite reste le chat
- le rapport brut alourdit fortement le premier tour
- l'historique libre explose progressivement le contexte
- la generation SQL reste la sortie la plus couteuse et la plus fragile

Cela confirme la direction proposee dans `tasks/phase1` :

- introduire un `assistant_state` structure
- separer les prompts par phase
- sortir la responsabilite SQL du LLM a terme
