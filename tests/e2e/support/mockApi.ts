import type { Page, Route } from "@playwright/test";

type ProjectRow = {
  id: string;
  client_nom: string;
  adresse: string;
  tva: number;
  date_visite: string;
  validite: number;
  store_key: string;
  statut: string;
  projet_json: any;
  st_json: Record<string, any>;
};

const CANONICAL_TABLES = [
  "bl_projects",
  "bl_suspens",
  "bl_lots",
  "bl_metiers",
  "bl_mo_lines",
  "bl_mat_lines",
];

function buildProjectRow(overrides: Partial<ProjectRow> = {}): ProjectRow {
  const projectJson = overrides.projet_json || {
    client: overrides.client_nom || "Emeline",
    adresse: overrides.adresse || "Rue des Tests 12, 1000 Bruxelles",
    tva: overrides.tva || 6,
    validite: overrides.validite || 30,
    storeKey: overrides.store_key || "ona_bl_emeline2026",
    lots: [
      {
        id: "lot-sdb",
        title: "Salle de bain",
        meta: "Renovation complete",
        imprevuPct: 10,
        defaultOpen: true,
        sequence: ["Plombier", "Carreleur"],
        metiers: [
          {
            id: "metier-plombier",
            name: "Plombier",
            icon: "🔧",
            mo: [
              {
                id: "mo-depose",
                label: "Depose sanitaire",
                jRef: {lo: 1, sug: 2, hi: 3},
                txRef: {lo: 400, sug: 480, hi: 640},
                metierName: "Plombier",
              },
            ],
            mat: [
              {
                id: "mat-carrelage",
                label: "Carrelage mural",
                u: true,
                qBase: 10,
                dBase: "2x3",
                props: [
                  {
                    name: "Gres 60x60",
                    std: {lo: 12, sug: 18, hi: 30},
                    mid: {lo: 18, sug: 28, hi: 45},
                    sup: {lo: 28, sug: 42, hi: 65},
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    suspens: [],
  };

  return {
    id: overrides.id || "proj-emeline",
    client_nom: overrides.client_nom || "Emeline",
    adresse: overrides.adresse || "Rue des Tests 12, 1000 Bruxelles",
    tva: overrides.tva || 6,
    date_visite: overrides.date_visite || "2026-03-01",
    validite: overrides.validite || 30,
    store_key: overrides.store_key || "ona_bl_emeline2026",
    statut: overrides.statut || "draft",
    projet_json: projectJson,
    st_json: overrides.st_json || {},
  };
}

export function createMockProjects() {
  return [
    buildProjectRow(),
    buildProjectRow({
      id: "proj-autre",
      client_nom: "Projet Test",
      adresse: "Avenue Mock 8, 1050 Bruxelles",
      store_key: "ona_bl_projettest2026",
      projet_json: {
        client: "Projet Test",
        adresse: "Avenue Mock 8, 1050 Bruxelles",
        tva: 6,
        validite: 30,
        storeKey: "ona_bl_projettest2026",
        lots: [],
        suspens: [],
      },
    }),
  ];
}

async function fulfillJson(route: Route, payload: any, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
      "access-control-allow-headers": "*",
    },
    body: JSON.stringify(payload),
  });
}

export async function mockProjectsApi(page: Page, initialProjects = createMockProjects()) {
  const projects = initialProjects;

  await page.route("**/rest/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const table = url.pathname.split("/").pop() || "";

    if (method === "OPTIONS") {
      return fulfillJson(route, {}, 200);
    }

    if (!CANONICAL_TABLES.includes(table)) {
      return route.fallback();
    }

    if (method === "GET") {
      if (table !== "bl_projects") {
        return fulfillJson(route, []);
      }

      const idEq = url.searchParams.get("id");
      if (idEq?.startsWith("eq.")) {
        const project = projects.find((item) => item.id === idEq.slice(3));
        return fulfillJson(route, project || null);
      }

      return fulfillJson(route, projects);
    }

    if (method === "POST") {
      if (table !== "bl_projects") {
        return fulfillJson(route, [], 201);
      }

      const body = request.postDataJSON() as Record<string, any> | Record<string, any>[];
      const row = Array.isArray(body) ? body[0] : body;
      const nextProject = buildProjectRow({
        id: row.id,
        client_nom: row.client_nom,
        adresse: row.adresse,
        tva: row.tva,
        date_visite: row.date_visite,
        validite: row.validite,
        store_key: row.store_key,
        statut: row.statut,
        projet_json: {
          client: row.client_nom,
          adresse: row.adresse,
          tva: row.tva,
          validite: row.validite,
          storeKey: row.store_key,
          lots: [],
          suspens: [],
        },
      });
      projects.unshift(nextProject);
      return fulfillJson(route, [nextProject], 201);
    }

    if (method === "PATCH") {
      const body = request.postDataJSON() as Record<string, any>;
      const storeKeyEq = url.searchParams.get("store_key");
      if (storeKeyEq?.startsWith("eq.")) {
        const target = projects.find((item) => item.store_key === storeKeyEq.slice(3));
        if (target && body.st_json) {
          target.st_json = body.st_json;
        }
      }
      return fulfillJson(route, []);
    }

    return route.fallback();
  });

  return {projects};
}

export async function mockTarifsApi(page: Page) {
  await page.route("**/rest/v1/mo_tarifs**", async (route) => {
    if (route.request().method() === "OPTIONS") {
      return fulfillJson(route, {}, 200);
    }
    await fulfillJson(route, [
      {
        metier: "Plombier",
        icon: "🔧",
        prix_lo: 400,
        prix_sug: 480,
        prix_hi: 640,
        coeff_collectif: 0.75,
        tx_h_lo: 50,
        tx_h_hi: 80,
        note: "Sanitaires, évacuations, alimentation",
      },
      {
        metier: "Carreleur",
        icon: "⬛",
        prix_lo: 250,
        prix_sug: 320,
        prix_hi: 400,
        coeff_collectif: 0.9,
        tx_h_lo: 30,
        tx_h_hi: 50,
        note: "Sol et mur, faience, grand format",
      },
    ]);
  });

  await page.route("**/rest/v1/mo_rendements**", async (route) => {
    if (route.request().method() === "OPTIONS") {
      return fulfillJson(route, {}, 200);
    }
    await fulfillJson(route, [
      {
        metier: "Plombier",
        prestation: "WC suspendu Geberit+bâti",
        unite: "j",
        r_min: 0.5,
        r_sug: 1,
        r_max: 1.5,
        coeff_complexite_reno: 1.35,
        temps_fixe_j: 0,
        ordre: 1,
      },
      {
        metier: "Plombier",
        prestation: "Création alimentation eau",
        unite: "ml/j",
        r_min: 10,
        r_sug: 15,
        r_max: 20,
        coeff_complexite_reno: 1.35,
        temps_fixe_j: 0,
        ordre: 2,
      },
      {
        metier: "Carreleur",
        prestation: "Pose carrelage sol 60×60",
        unite: "m²/j",
        r_min: 6,
        r_sug: 8,
        r_max: 10,
        coeff_complexite_reno: 1.3,
        temps_fixe_j: 0,
        ordre: 1,
      },
      {
        metier: "Carreleur",
        prestation: "Étanchéité liquide zones humides (SPEC)",
        unite: "m²/j",
        r_min: 15,
        r_sug: 20,
        r_max: 30,
        coeff_complexite_reno: 1.3,
        temps_fixe_j: 0,
        ordre: 2,
      },
    ]);
  });

  await page.route("**/rest/v1/materiaux**", async (route) => {
    if (route.request().method() === "OPTIONS") {
      return fulfillJson(route, {}, 200);
    }
    await fulfillJson(route, [
      {
        categorie: "Plomberie",
        label: "WC suspendu + bâti",
        unite: "u",
        prix_lo: 230,
        prix_sug: 420,
        prix_hi: 900,
        note: "Pack bati-support + cuvette",
      },
      {
        categorie: "Plomberie",
        label: "Receveur de douche",
        unite: "u",
        prix_lo: 100,
        prix_sug: 190,
        prix_hi: 480,
        note: "Receveur standard a extra-plat",
      },
      {
        categorie: "Sol",
        label: "Grès cérame 60×60",
        unite: "m²",
        prix_lo: 12,
        prix_sug: 18,
        prix_hi: 30,
        note: "Format courant salle de bain",
      },
      {
        categorie: "Finitions",
        label: "Colle à carrelage flex",
        unite: "m²",
        prix_lo: 3,
        prix_sug: 5,
        prix_hi: 8,
        note: "Pose murs et sols",
      },
    ]);
  });

  await page.route("**/rest/v1/postes_systematiques**", async (route) => {
    if (route.request().method() === "OPTIONS") {
      return fulfillJson(route, {}, 200);
    }
    await fulfillJson(route, [
      {
        label: "Membrane étanchéité zones humides",
        niveau: "obligatoire",
        note: "Douche, WC, cuisine — toujours",
      },
      {
        label: "Protection chantier (sol/murs)",
        niveau: "obligatoire",
        note: "Carton, film, protection escalier",
      },
    ]);
  });
}

export async function mockAssistantFlow(
  page: Page,
  options: {
    finalReplyMode?: "payload" | "sql" | "question";
    edgeMode?: "success" | "error";
  } = {}
) {
  const {
    finalReplyMode = "payload",
    edgeMode = "success",
  } = options;
  let llmCall = 0;
  const systemPrompts: string[] = [];

  await page.route("https://api.mistral.ai/v1/chat/completions", async (route) => {
    if (route.request().method() === "OPTIONS") {
      return fulfillJson(route, {}, 200);
    }
    const body = route.request().postDataJSON() as {
      messages?: Array<{ role: string; content: string }>;
      system?: string;
    };
    const systemPrompt =
      typeof body?.system === "string"
        ? body.system
        : body?.messages?.find((message) => message.role === "system")?.content;
    if (typeof systemPrompt === "string") {
      systemPrompts.push(systemPrompt);
    }
    llmCall += 1;
    let content = "Question ?";

    if (llmCall === 1) {
      content = "QUESTION: Quel type de renovation faut-il chiffrer ?\nTYPE: single\nRECOMMANDATION: Salle de bain\n- [recommande] Salle de bain\n- Cuisine";
    } else if (llmCall === 2) {
      content = "QUESTION: Quel niveau de finition faut-il retenir ?\nTYPE: single\nRECOMMANDATION: Standard\n- [recommande] Standard\n- Superieur";
    } else if (finalReplyMode === "question") {
      content = "QUESTION: Faut-il prevoir une ventilation mecanique ?\nTYPE: single\nRECOMMANDATION: Oui, extracteur standard\n- [recommande] Oui, extracteur standard\n- Non, existant conserve";
    } else if (finalReplyMode === "payload") {
      content = `\`\`\`json
{
  "version": "v1",
  "project": {
    "client_nom": "Projet Mock",
    "adresse": "Bruxelles",
    "tva": 6,
    "date_visite": "2026-03-30",
    "validite": 30,
    "store_key": "",
    "statut": "draft",
    "rapport_visite": "Rapport test pour une renovation de salle de bain.",
    "notes_internes": "Mock payload"
  },
  "suspens": [
    {
      "texte": "Ventilation a confirmer sur place",
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
      "sequence": ["plomberie"],
      "default_open": true,
      "ordre": 1,
      "metiers": [
        {
          "metier_key": "plomberie",
          "name": "Plombier",
          "icon": "🔧",
          "ordre": 1,
          "mo_lines": [
            {
              "line_key": "depose_sanitaire",
              "label": "Depose sanitaire",
              "j_lo": 1,
              "j_sug": 2,
              "j_hi": 3,
              "tx_lo": 400,
              "tx_sug": 480,
              "tx_hi": 640,
              "ordre": 1,
              "nb_travailleurs": 1
            }
          ],
          "mat_lines": [
            {
              "line_key": "wc_suspendu",
              "label": "WC suspendu",
              "avec_unite": false,
              "q_base": 1,
              "d_base": "1 pc",
              "ordre": 1,
              "props": [
                {
                  "name": "Pack WC suspendu",
                  "std": {"lo": 180, "sug": 240, "hi": 320},
                  "mid": {"lo": 240, "sug": 340, "hi": 460},
                  "sup": {"lo": 420, "sug": 580, "hi": 760}
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
\`\`\``;
    } else {
      content = "```sql\nINSERT INTO bl_projects (client_nom, adresse, tva, date_visite, validite, store_key, statut) VALUES ('Projet Mock', 'Bruxelles', 6, '2026-03-30', 30, 'ona_bl_mock2026', 'draft') RETURNING id;\n```";
    }

    await fulfillJson(route, {
      choices: [{message: {content}}],
    });
  });

  await page.route("**/functions/v1/exec-project-sql", async (route) => {
    if (route.request().method() === "OPTIONS") {
      return fulfillJson(route, {}, 200);
    }
    if (edgeMode === "error") {
      return fulfillJson(route, {
        success: false,
        error: "mock edge failure",
      }, 500);
    }
    await fulfillJson(route, {
      success: true,
      projet: {
        id: "proj-mock-assistant",
        client_nom: "Projet Mock",
        adresse: "Bruxelles",
        store_key: "ona_bl_mock2026",
        projet_json: {
          client: "Projet Mock",
          adresse: "Bruxelles",
          tva: 6,
          validite: 30,
          storeKey: "ona_bl_mock2026",
          lots: [],
          suspens: [],
        },
      },
    });
  });

  return { systemPrompts };
}
