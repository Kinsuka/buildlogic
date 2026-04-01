# Contrat de donnees BuildLogic - Payload canonique v1

Version du document : `v1`
Date : `2026-03-31`
Auteur : `Codex`
Perimetre : contrat intermediaire assistant -> payload canonique -> mapper applicatif -> Supabase.

---

## 1. Objectif

Le LLM ne genere plus :

- ni SQL
- ni UUID

Le LLM produit uniquement un payload JSON canonique.

Le code applicatif prend ensuite le relais pour :

- valider le payload
- generer les ids techniques
- mapper les relations
- inserer dans `bl_projects`, `bl_suspens`, `bl_lots`, `bl_metiers`, `bl_mo_lines`, `bl_mat_lines`

---

## 2. Structure canonique v1

```json
{
  "version": "v1",
  "project": {
    "client_nom": "Projet Test",
    "adresse": "Rue Exemple 1, 1000 Bruxelles",
    "tva": 6,
    "date_visite": "2026-03-31",
    "validite": 30,
    "store_key": "",
    "statut": "draft",
    "rapport_visite": "Texte libre",
    "notes_internes": "Texte libre"
  },
  "suspens": [
    {
      "texte": "Point a confirmer",
      "niveau": "orange",
      "ordre": 1
    }
  ],
  "lots": [
    {
      "lot_key": "lot_sdb",
      "title": "Salle de bain",
      "meta": "Renovation complete",
      "imprevu_pct": 10,
      "sequence": ["plomberie", "carrelage"],
      "default_open": true,
      "ordre": 1,
      "metiers": [
        {
          "metier_key": "plomberie",
          "name": "Plombier",
          "icon": "🔧",
          "ordre": 1,
          "mo_lines": [],
          "mat_lines": []
        }
      ]
    }
  ]
}
```

---

## 3. Champs obligatoires

### project

- `client_nom`

### suspens

- `texte`
- `niveau`

### lots

- `lot_key`
- `title`

### metiers

- `metier_key`
- `name`

### mo_lines

- `line_key`
- `label`
- `j_lo`
- `j_sug`
- `j_hi`
- `tx_lo`
- `tx_sug`
- `tx_hi`

### mat_lines

- `line_key`
- `label`
- `avec_unite`

---

## 4. Champs optionnels

- `project.adresse`
- `project.date_visite`
- `project.validite`
- `project.store_key`
- `project.rapport_visite`
- `project.notes_internes`
- `lot.meta`
- `lot.imprevu_pct`
- `lot.sequence`
- `lot.default_open`
- `metier.icon`
- `mo_line.nb_travailleurs`
- `mat_line.q_base`
- `mat_line.d_base`
- `mat_line.props`

---

## 5. Enums

- `version` : `v1`
- `project.statut` : `draft`
- `project.tva` : `6 | 21`
- `suspens.niveau` : `rouge | orange | vert`

---

## 6. Conventions de cles

- `lot_key` : unique dans le projet, format recommande `lot_<slug>`
- `metier_key` : unique dans le lot, format recommande `plomberie`, `carrelage`, `electricite`
- `line_key` : unique dans le metier, format recommande `depose_sanitaire`, `wc_suspendu`, `faience_murale`

### Convention `sequence`

En canonique v1 :

- `sequence` est une liste ordonnee de `metier_key`

Dans la base actuelle :

- le mapper convertit cette sequence en libelles metier pour rester compatible avec le comportement actuel de l'app

Conclusion :

- `bl_lots.sequence` merite probablement une evolution future pour stocker des `metier_key` plutot que des labels d'affichage

---

## 7. Observations schema DB a revoir

### `bl_lots.meta`

Etat actuel :

- champ texte libre

Observation :

- utile pour afficher un resume lot
- trop flou si on veut distinguer description, zone, hypothese ou remarque

Piste :

- garder le texte en v1
- envisager plus tard une structure plus explicite ou plusieurs colonnes

### `bl_mat_lines.d_base`

Etat actuel :

- champ string libre

Observation :

- pratique pour afficher une base de calcul
- peu robuste pour reutilisation algorithmique

Piste :

- garder string en v1
- envisager plus tard un objet structure ou des colonnes dediees

### `bl_lots.sequence`

Etat actuel :

- valeur array orientee affichage

Observation :

- ambiguite entre labels et cles techniques

Piste :

- viser a terme une sequence de `metier_key`

---

## 8. Mapping applicatif v1

Module cible :

- `createProjectFromCanonicalPayload(payload, supabase)`

Responsabilites :

- validation du payload
- generation de tous les ids techniques
- affectation des foreign keys
- insertion ordonnee par table
- remontage d'un plan d'inserts testable

Le mapper ne depend pas du SQL genere par le LLM.
