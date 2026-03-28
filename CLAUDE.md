# CLAUDE.md — BuildLogic ONA

Contexte de référence pour Claude Code et toute nouvelle session Claude.
Ce fichier contient tout ce qu'il faut pour reprendre le développement sans friction.

---

## Identité du projet

- **Produit** : BuildLogic — outil de budgétisation chantier pour ONA Group SRL (Bruxelles/Brabant)
- **Stack** : React 18 + Vite · Supabase JS direct · Netlify CI/CD
- **Repo** : https://github.com/Kinsuka/buildlogic
- **App** : https://buildlogic-ona.netlify.app
- **Supabase project ID** : `abbaqmjidclmmwqcutlj`

---

## Architecture

```
GitHub (src/) → Netlify (npm run build → dist/) → React + Supabase JS < 300ms
Claude (conversation) → MCP Supabase → INSERT bl_* → triggers → projet_json → BuildLogic charge
```

Tout le code est dans un seul fichier : `src/App.jsx` (~1850 lignes).
Ne jamais reconstruire from scratch — toujours faire des modifications chirurgicales.

---

## Schéma Supabase — tables bl_* (BuildLogic)

### `bl_projects`
```sql
id          UUID PK
client_nom  TEXT NOT NULL
adresse     TEXT
tva         NUMERIC DEFAULT 6
date_visite DATE
validite    INTEGER DEFAULT 30
store_key   TEXT UNIQUE          -- ex: 'ona_bl_barbosa2026'
statut      TEXT DEFAULT 'draft' -- draft | sent | accepted | rejected
rapport_visite   TEXT
notes_internes   TEXT
projet_json JSONB                -- calculé automatiquement par trigger
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

### `bl_lots`
```sql
id          UUID PK
project_id  UUID FK → bl_projects.id (CASCADE DELETE)
lot_key     TEXT    -- ex: 'l1', 'l2'
title       TEXT    -- ex: 'Lot 1 — Salle de bain'
meta        TEXT    -- ex: '3,94×1,68m · dépose complète'
imprevu_pct NUMERIC DEFAULT 10
sequence    TEXT[]  -- ⚠️ OBLIGATOIRE — ex: ARRAY['🔧 Plombier','⬛ Carreleur']
default_open BOOLEAN DEFAULT false
ordre       INTEGER DEFAULT 0    -- ordre d'affichage
```
> ⚠️ **`sequence` est obligatoire** — si null, BuildLogic crashait (corrigé avec guard `||[]` mais toujours le remplir)

### `bl_metiers`
```sql
id          UUID PK
lot_id      UUID FK → bl_lots.id (CASCADE DELETE)
metier_key  TEXT    -- ex: 'p1', 'c1', 'e1', 'me1'
name        TEXT    -- ex: 'Plombier', 'Carreleur'
icon        TEXT    -- ex: '🔧', '⬛', '⚡'
ordre       INTEGER DEFAULT 0
```

### `bl_mo_lines` (lignes main d'œuvre)
```sql
id              UUID PK
metier_id       UUID FK → bl_metiers.id (CASCADE DELETE)
line_key        TEXT    -- ex: 'a', 'b', 'c'
label           TEXT    -- description de la prestation
j_lo            NUMERIC DEFAULT 0.5  -- jours minimum
j_sug           NUMERIC DEFAULT 1    -- jours suggérés
j_hi            NUMERIC DEFAULT 2    -- jours maximum
tx_lo           NUMERIC DEFAULT 280  -- tarif/j minimum €
tx_sug          NUMERIC DEFAULT 340  -- tarif/j suggéré €
tx_hi           NUMERIC DEFAULT 400  -- tarif/j maximum €
ordre           INTEGER DEFAULT 0
nb_travailleurs INTEGER DEFAULT 1 CHECK (1..10)
```

### `bl_mat_lines` (lignes matériaux)
```sql
id          UUID PK
metier_id   UUID FK → bl_metiers.id (CASCADE DELETE)
line_key    TEXT    -- ex: 'm1', 'm2'
label       TEXT
avec_unite  BOOLEAN DEFAULT false  -- ⚠️ PAS is_surface — true = surface calculée (m²)
q_base      NUMERIC                -- quantité de base si avec_unite = true
d_base      TEXT                   -- dimensions texte ex: '4.5×3.8'
props       JSONB DEFAULT '[]'     -- voir format ci-dessous
ordre       INTEGER DEFAULT 0
```

**Format `props` (JSONB array) :**
```json
[{
  "name": "Grès cérame 60×60",
  "std": {"lo": 12, "sug": 18, "hi": 30},
  "mid": {"lo": 18, "sug": 28, "hi": 45},
  "sup": {"lo": 28, "sug": 42, "hi": 65}
}]
```

### `bl_suspens`
```sql
id          UUID PK
project_id  UUID FK → bl_projects.id (CASCADE DELETE)
texte       TEXT    -- ⚠️ PAS 'txt' — c'est 'texte'
niveau      TEXT DEFAULT 'orange' -- rouge | orange | vert
ordre       INTEGER DEFAULT 0
```

---

## Triggers Postgres

5 triggers sur `bl_lots`, `bl_metiers`, `bl_mo_lines`, `bl_mat_lines`, `bl_suspens` :
→ Appellent automatiquement `refresh_projet_json(project_id)` après tout INSERT/UPDATE/DELETE.

**Forcer un recalcul manuel :**
```sql
SELECT refresh_projet_json('UUID_DU_PROJET');
```

---

## Référentiel (tables non-bl_*)

### `mo_tarifs` — 14 métiers avec tarifs et coefficients
```sql
metier          TEXT UNIQUE  -- 'Carreleur', 'Plombier', etc.
icon            TEXT
prix_lo/sug/hi  NUMERIC      -- €/jour
note            TEXT
coeff_collectif NUMERIC      -- efficacité collective (0.75 à 0.95)
```

**Coefficients collectif par métier :**
Peintre 0.95 · Démolisseur 0.92 · Carreleur/Parqueteur 0.90 · Façadier 0.88
Maçon/Plafonneur/Élec/Couvreur 0.85 · Menuisier 0.80 · Cuisiniste 0.82
Plombier/VMC/Chauffagiste 0.75

### `mo_rendements` — 190 prestations de référence
```sql
metier              TEXT
prestation          TEXT
unite               TEXT    -- m²/j, ml/j, u/j, j
r_min/sug/max       NUMERIC
note                TEXT
coeff_complexite_reno NUMERIC DEFAULT 1.0  -- multiplicateur rénovation
source_coeff        TEXT
ordre               INTEGER
```

**Coefficients complexité rénovation validés :**
Maçon ×1.50 · Plafonneur/Élec/Façadier ×1.40 · Couvreur/Plombier/VMC ×1.35
Carreleur/Menuisier/Chauffagiste ×1.30 · Parqueteur/Peintre ×1.25
Démolisseur/Cuisiniste/Divers ×1.20

### `materiaux` — 111 matériaux avec prix belges
### `fournisseurs` — 8 fournisseurs BE (FACQ, Toolstation, Brico, etc.)
### `postes_systematiques` — 12 postes à ne jamais oublier

---

## Template INSERT nouveau projet (à copier)

```sql
-- 1. Créer le projet
INSERT INTO bl_projects (client_nom, adresse, store_key, statut, tva, validite, date_visite, notes_internes)
VALUES ('NOM_CLIENT', 'VILLE', 'ona_bl_NOMCLIENT2026', 'draft', 6, 30, 'YYYY-MM-DD', 'Notes internes')
RETURNING id;

-- 2. Insérer lots + métiers + lignes dans un bloc DO $$
DO $$
DECLARE
  proj_id UUID := 'UUID_RETOURNÉ_CI-DESSUS';
  l1 UUID; l2 UUID;  -- une variable par lot
  m1 UUID; m2 UUID;  -- réutilisées par métier
BEGIN

INSERT INTO bl_lots (project_id, lot_key, title, meta, imprevu_pct, ordre, default_open, sequence)
VALUES (proj_id, 'l1', 'Lot 1 — Titre', 'dimensions · description', 10, 1, true,
        ARRAY['🔧 Plombier', '⬛ Carreleur'])  -- ⚠️ sequence OBLIGATOIRE
RETURNING id INTO l1;

INSERT INTO bl_metiers (lot_id, metier_key, name, icon, ordre)
VALUES (l1, 'p1', 'Plombier', '🔧', 1) RETURNING id INTO m1;

INSERT INTO bl_mo_lines (metier_id, line_key, label, j_lo, j_sug, j_hi, tx_lo, tx_sug, tx_hi, ordre)
VALUES (m1, 'a', 'Description prestation', 1, 2, 3, 320, 420, 560, 1);

INSERT INTO bl_mat_lines (metier_id, line_key, label, avec_unite, q_base, ordre, props)
VALUES (m1, 'm1', 'Label matériau', true, 10, 1,
        '[{"name":"Option standard","std":{"lo":10,"sug":15,"hi":25},"mid":{"lo":15,"sug":22,"hi":35},"sup":{"lo":22,"sug":32,"hi":50}}]');

END $$;

-- 3. Insérer les suspens SÉPARÉMENT (hors bloc DO pour éviter rollback)
INSERT INTO bl_suspens (project_id, texte, niveau, ordre) VALUES
  ('UUID_PROJET', 'Description du point en suspens', 'rouge', 1),
  ('UUID_PROJET', 'Autre point à vérifier', 'orange', 2);

-- 4. Forcer recalcul (normalement automatique, mais par sécurité)
SELECT refresh_projet_json('UUID_PROJET');
```

---

## Pièges à éviter (leçons apprises)

| Erreur courante | Correct |
|---|---|
| `display_order` | `ordre` |
| `is_surface` | `avec_unite` |
| `txt` dans bl_suspens | `texte` |
| `sequence` null | Toujours `ARRAY['...']` |
| Suspens dans bloc DO $$ | Les insérer SÉPARÉMENT après le bloc |
| `refresh_projet_json` oublié | Toujours appeler à la fin |

---

## Convention nommage

- `store_key` : `ona_bl_NOMCLIENT YYYY` ex: `ona_bl_barbosa2026`
- `lot_key` : `l1`, `l2`, ... (pas d'espace, minuscule)
- `metier_key` : `p1` (plombier 1), `c1` (carreleur 1), `e1` (élec 1), `me1` (menuisier 1), `pe1` (peintre 1), `pl1` (plafonneur 1), `pa1` (parqueteur 1), `cu1` (cuisiniste 1), `m1` (maçon 1)
- `line_key` MO : `a`, `b`, `c`, ...
- `line_key` Mat : `m1`, `m2`, `m3`, ...

---

## Workflow développement

```bash
# Modifier App.jsx sur Mac
git add src/App.jsx
git commit -m "description courte"
git push
# → Netlify déploie automatiquement en ~2 min
```

**Règle absolue** : modifications chirurgicales uniquement. Ne jamais reconstruire le fichier entier.

---

## Projets existants

| Client | store_key | Statut |
|---|---|---|
| Emeline (Halle) | `ona_bl_emeline2026` | 6 lots, projet de référence |
| Barbosa (Ninove) | `ona_bl_barbosa2026` | 8 lots, 2 maisons |
| Demo Client | `ona_bgt_v6_demo` | Projet démo |
| Kevin | `ona_bl_mn7997wm` | Projet vide test |

---

## Fonctionnalités BuildLogic v8

- Chargement dynamique projet depuis Supabase (< 300ms)
- 3 gammes : std / mid / sup avec fourchettes lo/sug/hi
- Nb travailleurs (1-4) + frais déplacement optionnel par ligne MO
- Coefficient collectif par métier (rendement équipe)
- Mode client / interne
- Export Markdown + Rapport PDF
- Audit MO (croiser lignes vs mo_rendements)
- Documentation intégrée (6 onglets)
- Patch notes intégrées
- ErrorBoundary + guards null sur sequence, props, st

*Dernière mise à jour : 28 mars 2026*
