# CLAUDE.md — BuildLogic ONA

Contexte de référence pour Claude Code et toute nouvelle session Claude.
Ce fichier contient tout ce qu'il faut pour reprendre le développement sans friction.

---

## Identité du projet

- **Produit** : BuildLogic — outil de budgétisation chantier pour ONA Group SRL (Bruxelles/Brabant)
- **Stack** : React 18 + Vite · Supabase JS direct · GitHub Pages CI/CD
- **Repo** : https://github.com/Kinsuka/buildlogic
- **App** : https://kinsuka.github.io/buildlogic/
- **Supabase project ID** : `abbaqmjidclmmwqcutlj`

---

## Architecture

```
GitHub (src/) → GitHub Actions (npm run build → dist/) → GitHub Pages
Claude (conversation) → MCP Supabase → INSERT bl_* → triggers → projet_json → BuildLogic charge
```

**Règle absolue** : modifications chirurgicales uniquement. Ne jamais reconstruire from scratch.

---

## Structure des fichiers (post-refactor Codex mars 2026)

```
src/
  App.jsx                        ← orchestration globale, state principal, totaux
  supabase.js                    ← client Supabase (clé anon — à migrer vers import.meta.env)
  components/
    Modal.jsx                    ← composant modal de base
    Toast.jsx
    BtnMenu.jsx
    ErrorBoundary.jsx
    LotCard.jsx
    MetierRow.jsx
    LineCardMO.jsx
    LineCardMat.jsx
    ProjSelectorModal.jsx
    NewProjectModal.jsx
    HowToStartModal.jsx
    DocumentationModal.jsx
    ReferentielModal.jsx
    FicheClientModal.jsx
    FicheMetiersModal.jsx
    RapportModal.jsx
    HistoryPanel.jsx
  lib/
    calculs.js                   ← moLV, matLV, lotTotals, grandTotalGamme, joursChantier...
    projects.js                  ← accès projets Supabase + cache local
    appCss.js                    ← CSS global
    referentielSnapshot.js       ← snapshot embarqué (PAS live Supabase)
    howToContent.js              ← contenu modale "Comment démarrer"
    documentationContent.js      ← contenu documentation intégrée
    referentielUiContent.js      ← libellés UI du référentiel
```

> ⚠️ **Le référentiel est un snapshot embarqué**, pas live Supabase.
> Les projets (`bl_projects`) sont eux chargés depuis Supabase en live.

**Pour modifier du contenu statique** (doc, rendements, référentiel) :
→ Modifier le fichier `src/lib/` concerné, pas `App.jsx`

---

## Schéma Supabase — tables bl_*

### `bl_projects`
```sql
id             UUID PK
client_nom     TEXT NOT NULL
adresse        TEXT
tva            NUMERIC DEFAULT 6
date_visite    DATE
validite       INTEGER DEFAULT 30
store_key      TEXT UNIQUE       -- ex: 'ona_bl_barbosa2026'
statut         TEXT DEFAULT 'draft' -- draft | sent | accepted | rejected
rapport_visite TEXT
notes_internes TEXT
projet_json    JSONB             -- calculé automatiquement par trigger
created_at     TIMESTAMPTZ
updated_at     TIMESTAMPTZ
```

### `bl_lots`
```sql
id           UUID PK
project_id   UUID FK → bl_projects.id (CASCADE DELETE)
lot_key      TEXT    -- 'l1', 'l2'...
title        TEXT
meta         TEXT
imprevu_pct  NUMERIC DEFAULT 10
sequence     TEXT[]  -- ⚠️ OBLIGATOIRE — ex: ARRAY['🔧 Plombier','⬛ Carreleur']
default_open BOOLEAN DEFAULT false
ordre        INTEGER DEFAULT 0
```

### `bl_metiers`
```sql
id          UUID PK
lot_id      UUID FK → bl_lots.id (CASCADE DELETE)
metier_key  TEXT    -- 'p1', 'c1', 'e1'...
name        TEXT
icon        TEXT
ordre       INTEGER DEFAULT 0
```

### `bl_mo_lines`
```sql
id              UUID PK
metier_id       UUID FK → bl_metiers.id (CASCADE DELETE)
line_key        TEXT    -- 'a', 'b', 'c'...
label           TEXT
j_lo            NUMERIC DEFAULT 0.5
j_sug           NUMERIC DEFAULT 1
j_hi            NUMERIC DEFAULT 2
tx_lo           NUMERIC DEFAULT 280
tx_sug          NUMERIC DEFAULT 340
tx_hi           NUMERIC DEFAULT 400
ordre           INTEGER DEFAULT 0
nb_travailleurs INTEGER DEFAULT 1 CHECK (1..10)
```

### `bl_mat_lines`
```sql
id         UUID PK
metier_id  UUID FK → bl_metiers.id (CASCADE DELETE)
line_key   TEXT    -- 'm1', 'm2'...
label      TEXT
avec_unite BOOLEAN DEFAULT false  -- ⚠️ PAS is_surface
q_base     NUMERIC
d_base     TEXT
props      JSONB DEFAULT '[]'
ordre      INTEGER DEFAULT 0
```

**Format props :**
```json
[{"name":"Grès 60×60","std":{"lo":12,"sug":18,"hi":30},"mid":{"lo":18,"sug":28,"hi":45},"sup":{"lo":28,"sug":42,"hi":65}}]
```

### `bl_suspens`
```sql
id         UUID PK
project_id UUID FK → bl_projects.id (CASCADE DELETE)
texte      TEXT    -- ⚠️ PAS 'txt'
niveau     TEXT DEFAULT 'orange' -- rouge | orange | vert
ordre      INTEGER DEFAULT 0
```

---

## Triggers Postgres

5 triggers sur `bl_lots`, `bl_metiers`, `bl_mo_lines`, `bl_mat_lines`, `bl_suspens`
→ Appellent `refresh_projet_json(project_id)` automatiquement.

```sql
-- Forcer recalcul manuel
SELECT refresh_projet_json('UUID_DU_PROJET');
```

---

## Référentiel (tables non-bl_*)

### `mo_tarifs` — 14 métiers
```sql
metier          TEXT UNIQUE
icon            TEXT
prix_lo         NUMERIC   -- €/jour minimum
prix_sug        NUMERIC   -- €/jour suggéré
prix_hi         NUMERIC   -- €/jour maximum
note            TEXT
coeff_collectif NUMERIC   -- 0.75 à 0.95
tx_h_lo         NUMERIC   -- tarif horaire min BE 2026 HTVA
tx_h_hi         NUMERIC   -- tarif horaire max BE 2026 HTVA
source_tarif    TEXT      -- trustup.be, tafsquare.com...
```

| Métier | lo €/j | sug €/j | hi €/j | €/h BE |
|---|---|---|---|---|
| Maçon | 320 | 400 | 560 | 40–70 |
| Plombier | 400 | 480 | 640 | 50–80 |
| Électricien | 280 | 360 | 440 | 35–55 |
| Carreleur | 250 | 320 | 400 | 30–50 |
| Plafonneur | 280 | 360 | 440 | 35–55 |
| Menuisier | 280 | 380 | 480 | 35–60 |
| Peintre | 240 | 300 | 380 | 30–48 |
| Couvreur | 320 | 420 | 560 | 40–70 |
| Chauffagiste | 400 | 500 | 640 | 50–80 |
| Parqueteur | 240 | 320 | 420 | 30–53 |
| Façadier | 260 | 340 | 440 | 33–55 |
| Démolisseur | 250 | 320 | 400 | 31–50 |
| Technicien VMC | 360 | 460 | 580 | 45–73 |
| Cuisiniste | 260 | 340 | 440 | 33–55 |

Coefficients collectif : Peintre 0.95 · Démolisseur 0.92 · Carreleur/Parqueteur 0.90
Façadier 0.88 · Maçon/Plafonneur/Élec/Couvreur 0.85 · Cuisiniste 0.82 · Menuisier 0.80
Plombier/VMC/Chauffagiste 0.75

### `mo_rendements` — 190 prestations
```sql
metier prestation unite r_min r_sug r_max note
coeff_complexite_reno NUMERIC DEFAULT 1.0
source_coeff TEXT
ordre INTEGER
```
Coefficients réno : Maçon ×1.50 · Plafonneur/Élec/Façadier ×1.40 · Couvreur/Plombier/VMC ×1.35
Carreleur/Menuisier/Chauffagiste ×1.30 · Parqueteur/Peintre ×1.25 · Démolisseur/Cuisiniste ×1.20

---

## Template INSERT nouveau projet

```sql
-- 1. Projet
INSERT INTO bl_projects (client_nom, adresse, store_key, statut, tva, validite, date_visite, notes_internes)
VALUES ('NOM', 'VILLE', 'ona_bl_NOMCLIENT2026', 'draft', 6, 30, 'YYYY-MM-DD', 'Notes')
RETURNING id;

-- 2. Lots + métiers + lignes dans DO $$
DO $$
DECLARE
  proj_id UUID := 'UUID_CI-DESSUS';
  l1 UUID; m1 UUID;
BEGIN

INSERT INTO bl_lots (project_id, lot_key, title, meta, imprevu_pct, ordre, default_open, sequence)
VALUES (proj_id, 'l1', 'Lot 1 — Titre', 'description', 10, 1, true,
        ARRAY['🔧 Plombier', '⬛ Carreleur'])   -- ⚠️ sequence OBLIGATOIRE
RETURNING id INTO l1;

INSERT INTO bl_metiers (lot_id, metier_key, name, icon, ordre)
VALUES (l1, 'p1', 'Plombier', '🔧', 1) RETURNING id INTO m1;

INSERT INTO bl_mo_lines (metier_id, line_key, label, j_lo, j_sug, j_hi, tx_lo, tx_sug, tx_hi, ordre)
VALUES (m1, 'a', 'Prestation', 1, 2, 3, 400, 480, 640, 1);

INSERT INTO bl_mat_lines (metier_id, line_key, label, avec_unite, q_base, ordre, props)
VALUES (m1, 'm1', 'Matériau', true, 10, 1,
        '[{"name":"Std","std":{"lo":10,"sug":15,"hi":25},"mid":{"lo":15,"sug":22,"hi":35},"sup":{"lo":22,"sug":32,"hi":50}}]');

END $$;

-- 3. Suspens SÉPARÉMENT (hors DO pour éviter rollback)
INSERT INTO bl_suspens (project_id, texte, niveau, ordre) VALUES
  ('UUID_PROJET', 'Point à vérifier', 'rouge', 1);

-- 4. Recalcul
SELECT refresh_projet_json('UUID_PROJET');
```

---

## Pièges à éviter

| Erreur | Correct |
|---|---|
| `display_order` | `ordre` |
| `is_surface` | `avec_unite` |
| `txt` dans bl_suspens | `texte` |
| `sequence` null | Toujours `ARRAY['...']` |
| Suspens dans DO $$ | Insérer SÉPARÉMENT |
| `refresh_projet_json` oublié | Toujours appeler |
| Modifier App.jsx pour du contenu | Modifier `src/lib/` concerné |

---

## Convention nommage

- `store_key` : `ona_bl_NOMCLIENT2026`
- `lot_key` : `l1`, `l2`...
- `metier_key` : `p1` plombier · `c1` carreleur · `e1` élec · `me1` menuisier · `pe1` peintre · `pl1` plafonneur · `pa1` parqueteur · `cu1` cuisiniste · `m1` maçon
- `line_key` MO : `a`, `b`, `c`...
- `line_key` Mat : `m1`, `m2`...

---

## Workflow développement

```bash
git add src/
git commit -m "description"
git push
# → GitHub Actions → GitHub Pages (~2 min)
# → https://kinsuka.github.io/buildlogic/
```

---

## Backlog technique

- [ ] Config Supabase via `import.meta.env` (actuellement codée en dur)
- [ ] Corriger wording "référentiel live Supabase" dans l'app (c'est un snapshot)
- [ ] Corriger mentions "Netlify" encore dans l'app
- [ ] Tests sur `src/lib/calculs.js`
- [ ] Lint/quality check dans la CI

---

## Projets existants

| Client | store_key | Statut |
|---|---|---|
| Emeline (Halle) | `ona_bl_emeline2026` | 6 lots — référence |
| Barbosa (Ninove) | `ona_bl_barbosa2026` | 8 lots, 2 maisons |
| Demo Client | `ona_bgt_v6_demo` | Démo |
| Kevin | `ona_bl_mn7997wm` | Vide test |

---

## Fonctionnalités BuildLogic v8

- Chargement dynamique projets Supabase (< 300ms)
- 3 gammes std/mid/sup · fourchettes lo/sug/hi
- Nb travailleurs (1-4) + frais déplacement par ligne MO
- Coefficient collectif par métier
- Mode client / interne
- Export Markdown + Rapport
- Audit MO vs mo_rendements
- Documentation intégrée (6 onglets) + Patch notes
- ErrorBoundary + guards null complets
- Tarifs horaires BE 2026 dans référentiel
- Dark mode persisté localStorage

*Dernière mise à jour : 29 mars 2026 — post-refactor Codex, architecture modulaire*
