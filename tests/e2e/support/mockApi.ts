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

  await page.route("**/rest/v1/bl_projects**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (method === "OPTIONS") {
      return fulfillJson(route, {}, 200);
    }

    if (method === "GET") {
      const idEq = url.searchParams.get("id");
      if (idEq?.startsWith("eq.")) {
        const project = projects.find((item) => item.id === idEq.slice(3));
        return fulfillJson(route, project ? {projet_json: project.projet_json} : null);
      }

      return fulfillJson(route, projects);
    }

    if (method === "POST") {
      const body = request.postDataJSON() as Record<string, any>;
      const nextProject = buildProjectRow({
        id: body.id,
        client_nom: body.client_nom,
        adresse: body.adresse,
        tva: body.tva,
        date_visite: body.date_visite,
        validite: body.validite,
        store_key: body.store_key,
        statut: body.statut,
        projet_json: {
          client: body.client_nom,
          adresse: body.adresse,
          tva: body.tva,
          validite: body.validite,
          storeKey: body.store_key,
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
      {metier: "Plombier", prix_lo: 400, prix_sug: 480, prix_hi: 640, tx_h_lo: 50, tx_h_hi: 80},
      {metier: "Carreleur", prix_lo: 250, prix_sug: 320, prix_hi: 400, tx_h_lo: 30, tx_h_hi: 50},
    ]);
  });
}

export async function mockAssistantFlow(page: Page) {
  let llmCall = 0;

  await page.route("https://api.mistral.ai/v1/chat/completions", async (route) => {
    if (route.request().method() === "OPTIONS") {
      return fulfillJson(route, {}, 200);
    }
    llmCall += 1;
    let content = "Question ?";

    if (llmCall === 1) {
      content = "Quel type de renovation ?\n- Salle de bain\n- Cuisine";
    } else if (llmCall === 2) {
      content = "Quel niveau de finition ?\n- Standard\n- Superieur";
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
}
