export const SIMPLE_CANONICAL_PROJECT = {
  version: "v1",
  project: {
    client_nom: "Projet Simple",
    adresse: "Rue des Tests 12, 1000 Bruxelles",
    tva: 6,
    date_visite: "2026-03-31",
    validite: 30,
    statut: "draft",
    rapport_visite: "Renovation simple de salle de bain.",
    notes_internes: "Fixture simple",
  },
  suspens: [
    { texte: "Choix definitif de la robinetterie a confirmer", niveau: "orange", ordre: 1 },
  ],
  lots: [
    {
      lot_key: "lot_sdb",
      title: "Salle de bain",
      meta: "Renovation simple",
      imprevu_pct: 10,
      sequence: ["plomberie", "carrelage"],
      default_open: true,
      ordre: 1,
      metiers: [
        {
          metier_key: "plomberie",
          name: "Plombier",
          icon: "🔧",
          ordre: 1,
          mo_lines: [
            {
              line_key: "depose_sanitaire",
              label: "Depose sanitaire",
              j_lo: 1,
              j_sug: 2,
              j_hi: 3,
              tx_lo: 400,
              tx_sug: 480,
              tx_hi: 640,
              ordre: 1,
              nb_travailleurs: 1,
            },
          ],
          mat_lines: [
            {
              line_key: "wc_suspendu",
              label: "WC suspendu",
              avec_unite: false,
              q_base: 1,
              d_base: "1 pc",
              ordre: 1,
              props: [
                {
                  name: "Pack WC suspendu",
                  std: { lo: 180, sug: 240, hi: 320 },
                  mid: { lo: 240, sug: 340, hi: 460 },
                  sup: { lo: 420, sug: 580, hi: 760 },
                },
              ],
            },
          ],
        },
        {
          metier_key: "carrelage",
          name: "Carreleur",
          icon: "🧱",
          ordre: 2,
          mo_lines: [],
          mat_lines: [
            {
              line_key: "faience_murale",
              label: "Faience murale",
              avec_unite: true,
              q_base: 12,
              d_base: "12 m2",
              ordre: 1,
              props: [
                {
                  name: "Faience 60x60",
                  std: { lo: 18, sug: 26, hi: 34 },
                  mid: { lo: 28, sug: 38, hi: 52 },
                  sup: { lo: 42, sug: 58, hi: 76 },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const MEDIUM_CANONICAL_PROJECT = {
  ...SIMPLE_CANONICAL_PROJECT,
  project: {
    ...SIMPLE_CANONICAL_PROJECT.project,
    client_nom: "Projet Moyen",
    notes_internes: "Fixture moyenne",
  },
  lots: [
    SIMPLE_CANONICAL_PROJECT.lots[0],
    {
      lot_key: "lot_cuisine",
      title: "Cuisine",
      meta: "Rafraichissement et adaptation reseaux",
      imprevu_pct: 8,
      sequence: ["electricite", "plomberie", "menuiserie"],
      default_open: false,
      ordre: 2,
      metiers: [
        {
          metier_key: "electricite",
          name: "Electricien",
          icon: "💡",
          ordre: 1,
          mo_lines: [
            {
              line_key: "ajout_prises",
              label: "Ajout prises plan de travail",
              j_lo: 0.5,
              j_sug: 1,
              j_hi: 1.5,
              tx_lo: 380,
              tx_sug: 460,
              tx_hi: 620,
              ordre: 1,
              nb_travailleurs: 1,
            },
          ],
          mat_lines: [],
        },
        {
          metier_key: "menuiserie",
          name: "Menuisier",
          icon: "🪚",
          ordre: 2,
          mo_lines: [],
          mat_lines: [],
        },
      ],
    },
  ],
};

export const HEAVY_CANONICAL_PROJECT = {
  ...MEDIUM_CANONICAL_PROJECT,
  project: {
    ...MEDIUM_CANONICAL_PROJECT.project,
    client_nom: "Projet Charge",
    notes_internes: "Fixture plus chargee",
  },
  suspens: [
    ...SIMPLE_CANONICAL_PROJECT.suspens,
    { texte: "Ventilation definitive de la cuisine a confirmer", niveau: "rouge", ordre: 2 },
    { texte: "Choix final du parquet a confirmer", niveau: "orange", ordre: 3 },
  ],
  lots: [
    ...MEDIUM_CANONICAL_PROJECT.lots,
    {
      lot_key: "lot_peinture",
      title: "Finitions et peinture",
      meta: "Reprises supports et peinture complete",
      imprevu_pct: 12,
      sequence: ["gyproc", "peinture"],
      default_open: false,
      ordre: 3,
      metiers: [
        {
          metier_key: "gyproc",
          name: "Plafonneur",
          icon: "🧰",
          ordre: 1,
          mo_lines: [
            {
              line_key: "faux_plafond",
              label: "Faux plafond Gyproc",
              j_lo: 1,
              j_sug: 1.5,
              j_hi: 2,
              tx_lo: 300,
              tx_sug: 380,
              tx_hi: 520,
              ordre: 1,
              nb_travailleurs: 2,
            },
          ],
          mat_lines: [],
        },
        {
          metier_key: "peinture",
          name: "Peintre",
          icon: "🎨",
          ordre: 2,
          mo_lines: [
            {
              line_key: "mise_en_peinture",
              label: "Mise en peinture complete",
              j_lo: 1,
              j_sug: 2,
              j_hi: 3,
              tx_lo: 260,
              tx_sug: 320,
              tx_hi: 420,
              ordre: 1,
              nb_travailleurs: 1,
            },
          ],
          mat_lines: [],
        },
      ],
    },
  ],
};
