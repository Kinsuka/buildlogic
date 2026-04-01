# Etat des lieux BuildLogic

Version du document : `v2026-04-01`
Date : `2026-04-01`
Auteur : `Codex`
Perimetre : situation actuelle du repo apres migration du wizard principal vers le payload canonique et ajout du referentiel metier compact pour l'assistant.

---

## 1. Resume executif

BuildLogic est aujourd'hui une application React/Vite connectee a Supabase pour :

- lister et ouvrir des projets existants
- creer un projet manuellement
- creer un projet via un wizard IA a partir d'un rapport de visite
- reconstruire un projet a partir d'un payload canonique `v1`
- sauvegarder un etat de travail partiel dans `st_json`
- ouvrir un chat assistant sur un projet charge

Au `2026-04-01`, le point structurant est le suivant :

- le wizard principal ne depend plus du SQL comme chemin principal
- le flow cible actif est maintenant `assistant -> payload canonique -> validation -> mapper -> Supabase`
- le fallback SQL existe encore mais reste un chemin legacy temporaire
- l'assistant wizard dispose maintenant d'un contexte metier compact construit depuis les tables referentiel utiles

La situation est globalement saine :

- les tests unitaires cibles passent
- les regressions E2E wizard passent
- le build passe

---

## 2. Architecture actuelle

### Flux de creation projet IA

```text
NewProjectModal.jsx
  -> buildONASystemPrompt()
  -> lecture Supabase des tables referentiel
  -> buildAssistantReferenceContext(...)
  -> prompt final wizard
  -> appel LLM
  -> extraction JSON canonique ou SQL legacy
  -> validateCanonicalProjectPayload(...)
  -> createProjectFromCanonicalPayload(...)
  -> inserts dans bl_projects / bl_suspens / bl_lots / bl_metiers / bl_mo_lines / bl_mat_lines
  -> snapshot projet reconstruit cote app
```

### Fallback legacy toujours present

Si l'assistant renvoie encore un bloc SQL :

- `sqlPreview` est renseigne
- le wizard garde le chemin historique
- creation via l'Edge Function `exec-project-sql`

Ce fallback est volontairement temporaire.

---

## 3. Ce qui a evolue depuis le 2026-03-31

### Migration du wizard vers le canonique

Le wizard principal dans `src/components/NewProjectModal.jsx` a ete migre de :

- `SQL preview -> exec-project-sql`

vers :

- `payload canonique -> validate/normalize -> createProjectFromCanonicalPayload -> Supabase`

Le wizard gere maintenant explicitement :

- `last_question`
- `last_user_answer`
- `final_output`
- `payloadPreview`
- `sqlPreview`

Phases explicites du cycle wizard :

- `clarification`
- `ready_to_create`
- `creating`
- `created`
- `creation_error`

### Sortie finale assistant

La detection de sortie finale se fait avec priorite :

1. bloc JSON canonique
2. bloc SQL legacy
3. sinon poursuite du questionnement

### Mapper applicatif

Le module `src/lib/createProjectFromCanonicalPayload.js` est en place et responsable de :

- valider le payload canonique
- generer les ids techniques
- construire le plan d'insert
- inserer les donnees dans les tables `bl_*`
- reconstruire un snapshot projet "app-ready"

### Contexte metier assistant

L'assistant wizard ne travaille plus seulement avec les tarifs MO.
Il recoit maintenant un referentiel compact de generation via `src/lib/assistantReferenceContext.js`.

Sources live chargees dans `buildONASystemPrompt()` :

- `mo_tarifs`
- `mo_rendements`
- `materiaux`
- `postes_systematiques`

Le referentiel compact injecte au prompt contient :

- metiers disponibles
- `metier_key` suggeres
- prestations typiques par metier
- templates de lignes MO
- templates de lignes materiaux
- conventions de structure
- postes systematiques a verifier

Important :

- la base brute n'est pas injectee telle quelle au LLM
- le snapshot `referentielSnapshot.js` n'est pas la source du wizard

---

## 4. Etat actuel du module IA

### Wizard creation projet

Fichier principal : `src/components/NewProjectModal.jsx`

Capacites confirmees :

- choix provider (`Claude`, `OpenAI`, `Mistral`)
- memorisation locale optionnelle de la cle API
- analyse d'un rapport de visite
- questionnement progressif avec choix rapides
- detection d'une sortie finale canonique
- creation projet via payload canonique
- fallback SQL legacy si necessaire
- journalisation de finalisation en dev via `window.__ONA_AI_DEBUG__`

### Chat assistant projet

Le chat assistant projet reste en place et permet :

- de questionner un devis charge
- d'obtenir des explications et suggestions
- de persister un `assistant_state` cote projet

Limite actuelle :

- le chat projet n'edite pas encore directement les lots/lignes

### Assistant state

Fichier : `src/lib/assistantState.js`

Le `assistant_state` structure contient notamment :

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
- `final_output`
- `final_sql`
- `creation_status`
- `ready_to_generate`

Persistences :

- wizard nouveau projet : `localStorage`
- chat projet : `st_json.assistant.project_chat`

---

## 5. Contrat de donnees actuel

Reference principale :

- `docs/data/contrat-payload-canonique-v1.md`

Regles structurantes a retenir :

- le LLM ne genere plus ni SQL ni UUID comme cible normale
- la sortie attendue est un payload JSON canonique `v1`
- `lot.sequence` contient des `metier_key` dans le payload
- `bl_lots.sequence` reste encore alimente en labels au moment du mapping pour compatibilite app
- `mat_lines[].avec_unite` est le champ canonique a utiliser

Tables d'insertion cibles :

- `bl_projects`
- `bl_suspens`
- `bl_lots`
- `bl_metiers`
- `bl_mo_lines`
- `bl_mat_lines`

---

## 6. Verifications confirmees au 2026-04-01

Commandes executees localement :

- `npm test -- --run src/lib/assistantReferenceContext.test.js src/lib/createProjectFromCanonicalPayload.test.js src/lib/assistantFramework.test.js`
- `npm run test:e2e -- tests/e2e/regressions.spec.ts`
- `npm run build`

Resultats :

- tests unitaires cibles : OK
- regressions E2E wizard : OK
- build : OK

Couverture importante actuellement en place :

- validation/normalisation du payload canonique
- coherences du mapper et ordre des inserts
- snapshot projet reconstruit depuis le plan d'insert
- detection sortie finale canonique
- fallback SQL legacy
- absence de sortie finale
- gestion erreur edge fallback
- presence du referentiel compact dans la construction du prompt au niveau unitaire

Important :

- les E2E restent bases sur des mocks reseau
- ils valident le comportement applicatif et le wiring, pas une execution LLM reelle ni une vraie persistance Postgres live

---

## 7. Supabase et donnees metier

Le projet Supabase accessible au repo permet aujourd'hui de travailler sur :

- le schema `bl_*` de creation projet
- les tables referentiel utiles au wizard
- les migrations
- les Edge Functions

Points observes utiles au wizard :

- `mo_tarifs` : environ 14 metiers
- `mo_rendements` : environ 190 prestations
- `materiaux` : environ 111 lignes
- `postes_systematiques` : environ 12 lignes

Exemples metier utiles deja confirmes :

- Plombier : `WC suspendu Geberit+bati`, `Creation alimentation eau`
- Carreleur : `Pose carrelage sol 60x60`, `Etancheite liquide zones humides (SPEC)`
- Materiaux : `WC suspendu + bati`, `Receveur de douche`, `Gres cerame 60x60`, `Prise / interrupteur`

Point d'attention :

- plusieurs tables referentiel n'ont pas encore RLS active

---

## 8. Points de vigilance

### 1. Fallback SQL encore present

Le fallback SQL est utile pour la transition mais cree encore une double logique.
Il faudra decider quand le supprimer completement.

### 2. `bl_lots.sequence`

Le payload canonique travaille en `metier_key`, mais la base reste encore alimentee en labels affiches pour compatibilite.
C'est un compromis transitoire a surveiller.

### 3. Persistance wizard

Le wizard persiste encore son `assistant_state` en `localStorage`.
Il n'a pas encore sa persistance de reprise cote Supabase comme le chat projet.

### 4. E2E mockes

Les tests de regression sont utiles et passent, mais ne remplacent pas encore un test d'integration reelle bout en bout avec vraie base et vrai provider LLM.

---

## 9. Backlog prioritaire plausible

- supprimer a terme `exec-project-sql` si le flow canonique est stabilise
- faire evoluer `bl_lots.sequence` pour stocker des `metier_key` en base
- etendre les scenarios d'update structurel add/remove sur les tables relationnelles
- renforcer l'audit RLS / policies Supabase
- migrer `supabase.js` vers `import.meta.env`

---

## 10. Fichiers verite a consulter en premier

- `src/components/NewProjectModal.jsx`
- `src/lib/llm.js`
- `src/lib/assistantReferenceContext.js`
- `src/lib/assistantState.js`
- `src/lib/createProjectFromCanonicalPayload.js`
- `docs/data/contrat-payload-canonique-v1.md`
- `CLAUDE.md`

---

## 11. Conclusion

Au `2026-04-01`, BuildLogic a franchi une etape importante :

- le wizard principal est aligne sur un contrat de donnees intermediaire propre
- le mapper applicatif absorbe la complexite technique
- l'assistant dispose d'un referentiel metier compact plus solide pour construire des payloads finaux coherents

Le socle est donc nettement plus robuste qu'au moment ou le wizard dependait d'un SQL LLM comme voie principale, meme si quelques mecanismes de transition restent encore en place.
