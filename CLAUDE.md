# CLAUDE.md — BuildLogic ONA

Contexte de reprise pour toute session Claude/Codex sur ce repo.
Objectif: repartir vite, sans réintroduire l'ancien flow SQL comme chemin principal.

## Identité du projet

- Produit: BuildLogic, outil de chiffrage chantier pour ONA Group SRL
- Zone métier: rénovation Bruxelles / Brabant, prix HTVA
- Stack: React 18 + Vite + Supabase JS
- Repo: `https://github.com/Kinsuka/buildlogic`
- App: `https://kinsuka.github.io/buildlogic/`
- Supabase project ref: `abbaqmjidclmmwqcutlj`

## Règles absolues

- Modifications chirurgicales uniquement.
- Ne pas reconstruire l'app from scratch.
- Le flow cible du wizard est: `assistant -> payload canonique v1 -> validation/normalisation -> mapper applicatif -> Supabase`.
- Le SQL généré par LLM est un fallback legacy temporaire, pas la cible.
- Le LLM ne doit pas générer d'UUID ni de SQL quand il peut produire le payload canonique.

## Architecture actuelle

```text
UI React
  -> NewProjectModal.jsx
  -> buildONASystemPrompt()
  -> appel LLM
  -> payload canonique JSON
  -> validateCanonicalProjectPayload()
  -> createProjectFromCanonicalPayload()
  -> inserts Supabase bl_*
  -> snapshot projet reconstruit côté app

Fallback legacy temporaire:
  -> bloc SQL
  -> Edge Function exec-project-sql
```

## Fichiers clés

```text
src/
  App.jsx
  supabase.js
  components/
    NewProjectModal.jsx          <- wizard IA principal + fallback SQL legacy
    ProjectChatPanel.jsx         <- chat projet
  lib/
    llm.js                       <- prompt wizard/projet + extraction json/sql
    assistantReferenceContext.js <- référentiel métier compact orienté génération
    assistantFramework.js        <- règles de questionnement / comité assistant
    assistantReviewSynthesis.js  <- contexte de review wizard/projet
    assistantState.js            <- état structuré assistant
    assistantFinalization.js     <- phases + logs finalisation wizard
    canonicalProjectContract.js  <- validation/normalisation payload canonique v1
    createProjectFromCanonicalPayload.js
    projects.js
    referentielSnapshot.js       <- snapshot embarqué, pas référentiel live du wizard
docs/
  data/contrat-payload-canonique-v1.md
tests/
  e2e/regressions.spec.ts
  e2e/support/mockApi.ts
```

## Contrat canonique v1

Référence: `docs/data/contrat-payload-canonique-v1.md`

Principes:

- `version` vaut `v1`
- `project.statut` vaut `draft`
- `project.tva` vaut `6` ou `21`
- `suspens.niveau` vaut `rouge`, `orange` ou `vert`
- `lot.sequence` contient des `metier_key`, jamais des labels affichés
- `mat_lines[].avec_unite` est le booléen canonique à conserver

Conventions recommandées:

- `lot_key`: `lot_<slug>`
- `metier_key`: `plomberie`, `carrelage`, `electricite`, etc.
- `line_key`: slug court métier/prestation/fourniture

Important:

- Le mapper convertit encore `lot.sequence` en labels métier au moment de l'insert DB pour compatibilité avec l'app actuelle.
- Ne pas rebasculer la logique amont vers des labels dans le payload canonique.

## Wizard IA

Fichier principal: `src/components/NewProjectModal.jsx`

Le wizard gère maintenant explicitement:

- `last_question`
- `last_user_answer`
- `final_output`
- `payloadPreview`
- `sqlPreview`

Phases / statuts à respecter:

- `clarification`
- `ready_to_create`
- `creating`
- `created`
- `creation_error`

Détection sortie finale:

- priorité 1: bloc JSON canonique
- priorité 2: bloc SQL legacy
- sinon: poursuite des questions

Chemin de création:

- si `payloadPreview`: `createProjectFromCanonicalPayload(payloadPreview, sb)`
- sinon fallback SQL via `exec-project-sql`

## Contexte métier assistant

Le wizard ne doit pas recevoir la base brute entière.
Il consomme un référentiel compact de génération via `buildAssistantReferenceContext(...)`.

Sources live chargées dans `buildONASystemPrompt()`:

- `mo_tarifs`
- `mo_rendements`
- `materiaux`
- `postes_systematiques`

Le référentiel compact injecté dans le prompt contient:

- métiers disponibles
- `metier_key` suggérés
- titres de lots typiques
- prestations typiques
- templates de lignes MO
- templates de lignes matériaux
- conventions de structure
- postes systématiques à vérifier

À ne pas faire:

- injecter tout `referentielSnapshot.js` tel quel dans le prompt
- injecter la base brute complète au LLM

## Assistant state

Fichier: `src/lib/assistantState.js`

Champs structurants:

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

Persistences actuelles:

- wizard nouveau projet: `localStorage`
- chat projet: `st_json.assistant.project_chat` dans Supabase

## Schéma Supabase utile

Tables de création projet:

- `bl_projects`
- `bl_suspens`
- `bl_lots`
- `bl_metiers`
- `bl_mo_lines`
- `bl_mat_lines`

Tables référentiel utiles au wizard:

- `mo_tarifs`
- `mo_rendements`
- `materiaux`
- `postes_systematiques`

Point d'attention DB:

- `bl_lots.sequence` reste aujourd'hui orienté affichage en base
- plusieurs tables référentiel n'ont pas encore RLS activé
- l'Edge Function `exec-project-sql` existe encore pour le fallback

## Mapper canonique

Fichier: `src/lib/createProjectFromCanonicalPayload.js`

Responsabilités:

- valider le payload via `validateCanonicalProjectPayload`
- générer les ids techniques
- générer `store_key` si absent
- construire un plan d'insert testable
- insérer dans l'ordre:
  - `bl_projects`
  - `bl_suspens`
  - `bl_lots`
  - `bl_metiers`
  - `bl_mo_lines`
  - `bl_mat_lines`
- reconstruire un snapshot projet "app-ready"

Ne pas réintroduire:

- génération SQL par le LLM comme voie principale
- logique d'UUID dans le prompt

## Pièges à éviter

| Mauvais réflexe | Attendu |
|---|---|
| Rebrancher le wizard sur SQL preview en premier | Utiliser d'abord le payload canonique |
| Mettre des labels métier dans `sequence` canonique | Mettre des `metier_key` |
| Utiliser `is_surface` | Utiliser `avec_unite` |
| Utiliser `txt` dans les suspens | Utiliser `texte` |
| Oublier `final_output` dans l'état assistant | Le tenir à jour explicitement |
| Injecter tout le référentiel brut au prompt | Injecter le contexte compact |
| Modifier `App.jsx` pour du contenu statique | Modifier `src/lib/` concerné |

## Références métier rapides

Ordres de grandeur actuellement disponibles en base:

- `mo_tarifs`: 14 métiers
- `mo_rendements`: ~190 prestations
- `materiaux`: ~111 lignes
- `postes_systematiques`: ~12 lignes

Exemples utiles déjà observés:

- Plombier: `WC suspendu Geberit+bâti`, `Création alimentation eau`
- Carreleur: `Pose carrelage sol 60×60`, `Étanchéité liquide zones humides (SPEC)`
- Matériaux: `WC suspendu + bâti`, `Receveur de douche`, `Grès cérame 60×60`, `Prise / interrupteur`

## Tests utiles

Unitaires ciblés:

```bash
npm test -- --run src/lib/assistantReferenceContext.test.js src/lib/createProjectFromCanonicalPayload.test.js src/lib/assistantFramework.test.js
```

Régressions wizard:

```bash
npm run test:e2e -- tests/e2e/regressions.spec.ts
```

Build:

```bash
npm run build
```

Couverture importante déjà en place:

- détection sortie finale canonique
- fallback SQL legacy
- absence de sortie finale
- erreurs edge fallback
- cohérence du mapper canonique
- référentiel compact injecté dans le prompt au niveau unitaire

## Backlog réaliste

- migrer `supabase.js` vers `import.meta.env`
- décider quand supprimer définitivement `exec-project-sql`
- faire évoluer `bl_lots.sequence` pour stocker des `metier_key` en base
- compléter les scénarios add/remove structurés dans les tables relationnelles
- renforcer l'audit RLS / policies

## État de vérité

En cas de doute, la vérité du flow actuel est dans:

- `src/components/NewProjectModal.jsx`
- `src/lib/llm.js`
- `src/lib/assistantReferenceContext.js`
- `src/lib/createProjectFromCanonicalPayload.js`
- `docs/data/contrat-payload-canonique-v1.md`

Dernière mise à jour: 31 mars 2026
