export const DOC_SECTIONS = [
  {id: "patchnotes", label: "📋 Patch notes"},
  {id: "architecture", label: "🏗 Architecture"},
  {id: "flow", label: "🚀 Flow chantier"},
  {id: "rendements", label: "📐 Rendements MO"},
  {id: "audit", label: "🔍 Audit & prompt"},
  {id: "supabase", label: "🗄 Base de données"},
];

export const DOC_RENDEMENTS = [
  {metier:"Carreleur", coeff:1.30, rows:[
    ["Dépose carrelage sol","m²/j",12,18,25],["Ragréage préparatoire","m²/j",20,30,40],
    ["Étanchéité liquide (SPEC)","m²/j",15,20,30],["Pose 60×60","m²/j",6,8,10],
    ["Pose grand format 120×60","m²/j",4,6,7],["Pose grand format 120×120","m²/j",3,4,5],
    ["Faïence murale","m²/j",5,7,9],["Plinthes carrelées","ml/j",15,20,25],
  ]},
  {metier:"Plombier", coeff:1.35, rows:[
    ["SdB complète (douche+WC+vasque)","j",3,4,5],["Douche italienne seule","j",1,1.5,2],
    ["WC suspendu Geberit+bâti","j",0.5,1,1.5],["Vasque + robinetterie","j",0.5,0.5,1],
    ["Création alimentation eau","ml/j",10,15,20],["Création évacuation EU","ml/j",8,12,18],
    ["Test pression / mise en eau","j",0.5,1,1.5],
  ]},
  {metier:"Électricien", coeff:1.40, rows:[
    ["Mise en conformité tableau+circuits","j",2,3,5],["Circuit prise/éclairage","j",0.5,0.75,1],
    ["Création saignée + encastrement","ml/j",6,12,18],["Adaptation cuisine standard","j",1,1.5,2],
    ["Raccordement SdB","j",0.5,1,1.5],["Contrôle + tests finaux","j",0.5,1,1.5],
  ]},
  {metier:"Plafonneur", coeff:1.40, rows:[
    ["Faux plafond simple","m²/j",8,12,15],["Faux plafond avec spots","m²/j",5,8,10],
    ["Cloison simple BA13","m²/j",10,14,18],["Enduit de finition","m²/j",12,18,25],
  ]},
  {metier:"Maçon", coeff:1.50, rows:[
    ["Démolition mur non porteur","ml/j",3,4,6],["Démolition mur porteur","ml/j",1,2,3],
    ["Ouverture mur porteur+étançonnement","u/j",0.5,1,1.5],["Pose IPN / linteau","j",1,1.5,2],
    ["Évacuation gravats","m³/j",3,5,8],
  ]},
  {metier:"Peintre", coeff:1.25, rows:[
    ["Préparation support légère","m²/j",25,35,45],["Préparation support lourde","m²/j",12,18,25],
    ["Peinture murs apprêt+2 couches","m²/j",25,35,45],["Peinture plafond","m²/j",20,28,35],
  ]},
  {metier:"Menuisier", coeff:1.30, rows:[
    ["Pose porte intérieure + bloc","j/u",0.5,0.75,1],["Pose châssis PVC/alu petit format","j/u",1,1.5,2],
    ["Pose châssis grand format >150cm","j/u",1.5,2,3],["Installation cuisine (fournie)","j",2,3,4],
  ]},
  {metier:"Couvreur", coeff:1.35, rows:[
    ["Dépose ancienne couverture tuiles","m²/j",15,20,30],["Pose tuiles + lattis","m²/j",6,10,14],
    ["Étanchéité toiture plate EPDM","m²/j",8,12,18],["Pose Velux (remplacement)","u/j",1,2,3],
  ]},
  {metier:"Chauffagiste", coeff:1.30, rows:[
    ["Installation chaudière gaz condensation","j",1,2,3],["Pose radiateur panneau","u/j",3,4,6],
    ["Tuyauterie chauffage","ml/j",8,12,18],["Équilibrage + mise en service","j",0.5,1,2],
  ]},
  {metier:"Parqueteur", coeff:1.25, rows:[
    ["Dépose revêtement souple","m²/j",20,30,40],["Pose parquet contrecollé","m²/j",10,15,20],
    ["Pose vinyle LVT clipsable","m²/j",18,25,35],["Ponçage + vitrification","m²/j",20,30,40],
  ]},
];

export const DOC_PROMPT_AUDIT = `Tu es l'auditeur de chiffrage d'ONA Group SRL.
Tu as accès à la table mo_rendements dans Supabase (abbaqmjidclmmwqcutlj) via MCP.

Voici le projet à auditer (projet_json) :
[COLLER LE PROJET_JSON ICI]

MISSION :
1. Pour chaque ligne MO du projet, comparer les jours budgétés aux rendements de référence dans mo_rendements
2. Détecter les postes sous-estimés (jours réels probables > jours budgétés)
3. Détecter les postes manquants (présents dans mo_rendements mais absents du budget)
4. Générer un rapport par lot avec : budget actuel / budget recommandé / écart de risque

FORMAT DE SORTIE par lot :
## Lot X — [Titre]
| Poste | Budgété | Référence | Verdict | Risque € |
|---|---|---|---|---|
...
**Budget actuel : X€ — Budget recommandé : Y€ — Écart risque : +Z€**

RÈGLES :
- Utiliser la valeur sug des rendements comme référence principale
- Signaler 🔴 si jours budgétés < r_min de la référence
- Signaler 🟠 si jours budgétés entre r_min et r_sug
- Signaler 🟢 si jours budgétés >= r_sug
- Signaler ⚫ si poste absent mais obligatoire selon le contexte
- Calculer le risque en € = (jours_recommandés - jours_budgétés) × taux_sug du métier`;

export const DOC_PATCH_NOTES = [
  {
    version: "v8 — Netlify",
    date: "27 mars 2026",
    color: "var(--btx)",
    bg: "var(--bbg)",
    items: [
      ["Migration Netlify","Passage de l'artifact claude.ai vers une app React/Vite hébergée sur Netlify. Supabase JS direct — zéro proxy LLM — chargements < 300ms."],
      ["LLM-agnostic","BuildLogic ne dépend plus d'aucun LLM. Claude, ChatGPT ou tout modèle avec connecteur MCP Supabase peut créer et modifier des projets."],
      ["Page Documentation","Ce manuel opérationnel intégré — architecture, flow chantier, rendements, audit, schéma Supabase."],
      ["Patch notes","Cet historique des versions."],
      ["Référentiel rendements","119 prestations encodées dans mo_rendements — 10 corps de métier, sources CSTC + marché belge + validation GPT-4."],
      ["Prompt auditeur ONA","Prompt pour auditer un projet BuildLogic — croise les lignes MO avec mo_rendements pour détecter sous-estimations et oublis."],
      ["Sécurité chargement","handleLoadProject sécurisé contre les projet_json null — fallback client_nom depuis la liste."],
    ],
  },
  {
    version: "v7 — Proxy Anthropic (artifact claude.ai)",
    date: "26 mars 2026",
    color: "var(--tx)",
    bg: "var(--sf2)",
    items: [
      ["Architecture proxy","Artifact claude.ai → api.anthropic.com (seul domaine whitelisté) → MCP Supabase. Contournement de la CSP sandbox."],
      ["projet_json pré-calculé","Colonne JSONB dans bl_projects — 5 triggers Postgres qui recalculent automatiquement après toute modification des tables bl_*."],
      ["Référentiel embarqué","REFERENTIEL_SNAPSHOT encodé directement dans le JSX — 111 matériaux, 7 métiers — chargement instantané sans appel proxy."],
      ["Page How to Start","Modal avec le flow complet et le prompt chef de chantier à copier."],
      ["Flow chef de chantier","Conversation Claude normale → analyse rapport de visite → questions ciblées → INSERT Supabase → BuildLogic charge le projet."],
      ["Retry 429","Gestion automatique des rate limits Anthropic — 3 tentatives avec délai 3s/6s/9s."],
    ],
  },
  {
    version: "v6 — Migration Supabase",
    date: "Mars 2026",
    color: "var(--tx)",
    bg: "var(--sf2)",
    items: [
      ["Tables bl_*","Création du schéma BuildLogic — bl_projects, bl_lots, bl_metiers, bl_mo_lines, bl_mat_lines, bl_suspens avec RLS + policies anon."],
      ["Architecture data-agnostic","Suppression de toutes les données hardcodées. PROJECT et REFERENTIEL chargés dynamiquement depuis Supabase."],
      ["Edge Function bl-data","Déployée pour centraliser l'accès données côté serveur (v1 et v2)."],
      ["Projets de test","Insertion Demo Client (Ninove) et Emeline (Halle — 6 lots, 16 métiers, 25 MO, 26 mat, 5 suspens)."],
    ],
  },
  {
    version: "v1 à v5 — Artifact statique",
    date: "Janvier–Mars 2026",
    color: "var(--tx3)",
    bg: "var(--sf2)",
    items: [
      ["v1-v3","Prototype artifact claude.ai avec données hardcodées. Moteur de calcul MO + matériaux avec fourchettes std/mid/sup."],
      ["v4","Ajout historique de versions, modes d'affichage (client/interne), export Markdown."],
      ["v5","Introduction Supabase — premier essai de migration avec snapshot JSON statique embarqué."],
    ],
  },
];

export const DOC_ARCHITECTURE_TABLES = [
  ["bl_projects","Projet + projet_json pré-calculé","Claude (chef de chantier) + BuildLogic"],
  ["bl_lots","Lots du projet (structure)","Claude uniquement"],
  ["bl_metiers","Métiers par lot","Claude uniquement"],
  ["bl_mo_lines","Lignes main d'œuvre","Claude uniquement"],
  ["bl_mat_lines","Lignes matériaux + gammes","Claude uniquement"],
  ["bl_suspens","Points en suspens rouge/orange/vert","Claude + BuildLogic"],
  ["mo_tarifs","Tarifs MO de référence ONA (€/j)","Manuel via cette conversation"],
  ["materiaux","Prix matériaux de référence ONA","Manuel via cette conversation"],
  ["mo_rendements","Rendements par prestation (m²/j, j...)","Manuel — validé ONA + GPT + CSTC"],
];

export const DOC_FLOW_STEPS = [
  {n:1, icon:"📞", t:"Appel client → RDV → Visite", p:"Le collègue réalise la visite et produit un rapport de visite (texte libre, orienté pièce ou prestation). Il peut être reçu par WhatsApp, mail ou note."},
  {n:2, icon:"🤖", t:"Ouvrir une nouvelle conversation Claude", p:"Copier le prompt 'Chef de chantier ONA' ci-dessous. Coller le rapport de visite. Claude joue le rôle d'un chef de chantier expert en rénovation belge."},
  {n:3, icon:"💬", t:"Claude analyse et complète", p:"Claude identifie les pièces, surfaces, prestations. Il alerte sur les oublis classiques ONA (membrane étanchéité, protection chantier, évacuation gravats, seuils, nettoyage). Il pose max 3-4 questions par tour avec choix multiples."},
  {n:4, icon:"✅", t:"Validation de la structure des lots", p:"Claude propose une organisation par pièce ou par prestation selon le chantier. On valide ensemble avant l'insertion."},
  {n:5, icon:"🗄", t:"Insertion dans Supabase", p:"Claude insère le projet complet dans les tables bl_* via MCP. Les triggers recalculent projet_json automatiquement."},
  {n:6, icon:"📊", t:"Charger dans BuildLogic", p:"Ouvrir BuildLogic → Charger un projet → sélectionner le projet. Le budget est déjà calculé avec toutes les fourchettes std/mid/sup."},
];

export const DOC_REQUIRED_POSTES = [
  "Membrane étanchéité zones humides",
  "Protection chantier sol+murs",
  "Évacuation gravats",
  "Plinthes et seuils de transition",
  "Nettoyage fin de chantier",
  "Consommables électricien",
  "Frais déplacement sous-traitants",
];

export const DOC_AUDIT_CHECKS = [
  ["MO jours sous-estimés","Jours budgétés < r_min de référence → 🔴 risque de dépassement forfait"],
  ["MO à surveiller","Jours budgétés entre r_min et r_sug → 🟠 vérifier contexte"],
  ["Postes manquants","Prestation obligatoire absente du budget → ⚫ oubli probable"],
  ["Marge finale","Budget recommandé vs budget actuel → écart de risque en €"],
];

export const DOC_NAMING_CONVENTIONS = [
  ["store_key","ona_bl_[timestamp_base36]","ona_bl_emeline2026"],
  ["lot_key","l1, l2, l3...","l1"],
  ["metier_key","[initiale][numéro_lot]","m1, e1, c1, p1"],
  ["line_key MO","a, b, c...","a"],
  ["line_key mat","m1, m2...","m1"],
];

export const DOC_TARIFS_REFERENCE = [
  ["Maçon",280,340,400],
  ["Plombier",320,420,560],
  ["Électricien",280,360,440],
  ["Carreleur",250,320,400],
  ["Plafonneur",250,315,380],
  ["Menuisier",280,350,420],
  ["Peintre",200,280,360],
];

export const DOC_ARCHITECTURE_CODE = `Netlify (buildlogic-ona.netlify.app)
  └─ React + Vite → Supabase JS direct → < 300ms

Claude (claude.ai) — rôle : chef de chantier / auditeur
  └─ Conversation → MCP Supabase → INSERT/UPDATE tables bl_*
  └─ Supabase triggers → projet_json auto-recalculé
  └─ BuildLogic recharge → budget instantané`;

export const DOC_CONNECTION_CODE = `URL     : https://abbaqmjidclmmwqcutlj.supabase.co
Projet  : abbaqmjidclmmwqcutlj
Clé     : anon (publique — intégrée dans BuildLogic)
MCP URL : https://mcp.supabase.com/mcp`;

export const DOC_PROJECT_JSON_EXAMPLE = `{
  "client": "Emeline",
  "adresse": "Halle",
  "tva": 6,
  "dateVisite": "2026-03-26",
  "validite": 30,
  "storeKey": "ona_bl_emeline2026",
  "statut": "draft",
  "suspens": [{"txt":"...","niveau":"rouge"}],
  "lots": [{
    "id": "l1",
    "title": "Lot 1 — Cuisine",
    "imprevuPct": 10,
    "sequence": ["Maçon","Électricien","Plombier","Carreleur"],
    "metiers": [{
      "id": "m1", "icon": "🏗", "name": "Maçon",
      "mo": [{"id":"a","label":"Démolition...","jRef":{"lo":1,"sug":1.5,"hi":2},"txRef":{"lo":280,"sug":340,"hi":400}}],
      "mat": [{"id":"m1","label":"Protection chantier","u":false,"props":[{"name":"...","std":{...},"mid":{...},"sup":{...}}]}]
    }]
  }]
}`;
