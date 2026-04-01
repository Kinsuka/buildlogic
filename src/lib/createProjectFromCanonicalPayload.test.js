import { describe, expect, it } from "vitest";
import { validateCanonicalProjectPayload } from "./canonicalProjectContract.js";
import {
  HEAVY_CANONICAL_PROJECT,
  MEDIUM_CANONICAL_PROJECT,
  SIMPLE_CANONICAL_PROJECT,
} from "./canonicalProjectFixtures.js";
import {
  buildCanonicalInsertPlan,
  buildProjectSnapshotFromInsertPlan,
  createProjectFromCanonicalPayload,
} from "./createProjectFromCanonicalPayload.js";

function createIdFactory() {
  let index = 0;
  return () => `id_${++index}`;
}

function createSupabaseRecorder({ failOn } = {}) {
  const calls = [];

  return {
    calls,
    from(table) {
      return {
        async insert(rows) {
          calls.push({ table, rows });
          if (table === failOn) {
            return { error: { message: `${table} failed` } };
          }
          return { error: null };
        },
      };
    },
  };
}

describe("canonical project payload mapper", () => {
  it("validates a canonical payload with defaults", () => {
    const payload = validateCanonicalProjectPayload({
      project: { client_nom: "Client Test" },
      suspens: [{ texte: "A confirmer", niveau: "orange" }],
      lots: [],
    });

    expect(payload.version).toBe("v1");
    expect(payload.project.tva).toBe(6);
    expect(payload.project.validite).toBe(30);
    expect(payload.project.statut).toBe("draft");
  });

  it("rejects invalid payloads", () => {
    expect(() =>
      validateCanonicalProjectPayload({
        project: { client_nom: "" },
        lots: [],
      })
    ).toThrow("project.client_nom is required");
  });

  it("builds a coherent insert plan with stable relations", () => {
    const plan = buildCanonicalInsertPlan(SIMPLE_CANONICAL_PROJECT, {
      idFactory: createIdFactory(),
      storeKeyFactory: () => "ona_bl_fixture2026",
    });

    expect(plan.projectId).toBe("id_1");
    expect(plan.storeKey).toBe("ona_bl_fixture2026");
    expect(plan.inserts.bl_projects).toHaveLength(1);
    expect(plan.inserts.bl_lots[0].project_id).toBe("id_1");
    expect(plan.inserts.bl_metiers[0].lot_id).toBe(plan.inserts.bl_lots[0].id);
    expect(plan.inserts.bl_mo_lines[0].metier_id).toBe(plan.inserts.bl_metiers[0].id);
    expect(plan.inserts.bl_mat_lines[0].metier_id).toBe(plan.inserts.bl_metiers[0].id);
    expect(plan.inserts.bl_lots[0].sequence).toEqual(["Plombier", "Carreleur"]);
  });

  it("creates all inserts through the Supabase client", async () => {
    const supabase = createSupabaseRecorder();

    const result = await createProjectFromCanonicalPayload(MEDIUM_CANONICAL_PROJECT, supabase, {
      idFactory: createIdFactory(),
      storeKeyFactory: () => "ona_bl_medium2026",
    });

    expect(result.storeKey).toBe("ona_bl_medium2026");
    expect(result.project?.client).toBe("Projet Moyen");
    expect(result.project?.lots).toHaveLength(2);
    expect(result.insertCounts.bl_projects).toBe(1);
    expect(result.insertCounts.bl_lots).toBe(2);
    expect(result.insertCounts.bl_metiers).toBeGreaterThanOrEqual(4);
    expect(supabase.calls.map((call) => call.table)).toEqual([
      "bl_projects",
      "bl_suspens",
      "bl_lots",
      "bl_metiers",
      "bl_mo_lines",
      "bl_mat_lines",
    ]);
  });

  it("builds an app-ready project snapshot from the canonical insert plan", () => {
    const plan = buildCanonicalInsertPlan(SIMPLE_CANONICAL_PROJECT, {
      idFactory: createIdFactory(),
      storeKeyFactory: () => "ona_bl_snapshot2026",
    });

    const project = buildProjectSnapshotFromInsertPlan(plan);

    expect(project?.client).toBe("Projet Simple");
    expect(project?.storeKey).toBe("ona_bl_snapshot2026");
    expect(project?.lots[0].title).toBe("Salle de bain");
    expect(project?.lots[0].metiers[0].mo[0].jRef.sug).toBe(2);
    expect(project?.lots[0].metiers[0].mat[0].props[0].name).toBe("Pack WC suspendu");
    expect(project?.lots[0].metiers[0].mat[0].matSource).toBe("catalog");
  });

  it("handles larger fixtures with consistent counts", () => {
    const plan = buildCanonicalInsertPlan(HEAVY_CANONICAL_PROJECT, {
      idFactory: createIdFactory(),
      storeKeyFactory: () => "ona_bl_heavy2026",
    });

    expect(plan.inserts.bl_lots).toHaveLength(3);
    expect(plan.inserts.bl_suspens).toHaveLength(3);
    expect(plan.inserts.bl_metiers.length).toBeGreaterThan(plan.inserts.bl_lots.length);
    expect(plan.inserts.bl_mo_lines.length).toBeGreaterThan(0);
  });

  it("keeps mat_source provisional through normalization and insert planning", () => {
    const payload = structuredClone(SIMPLE_CANONICAL_PROJECT);
    payload.lots[0].metiers[0].mat_lines[0].mat_source = "provisional";

    const plan = buildCanonicalInsertPlan(payload, {
      idFactory: createIdFactory(),
      storeKeyFactory: () => "ona_bl_provisional2026",
    });

    expect(plan.payload.lots[0].metiers[0].mat_lines[0].mat_source).toBe("provisional");
    expect(plan.inserts.bl_mat_lines[0].mat_source).toBe("provisional");
  });

  it("normalizes missing mat_source to catalog in insert planning", () => {
    const payload = structuredClone(SIMPLE_CANONICAL_PROJECT);
    delete payload.lots[0].metiers[0].mat_lines[0].mat_source;

    const plan = buildCanonicalInsertPlan(payload, {
      idFactory: createIdFactory(),
      storeKeyFactory: () => "ona_bl_catalog2026",
    });

    expect(plan.payload.lots[0].metiers[0].mat_lines[0].mat_source).toBe("catalog");
    expect(plan.inserts.bl_mat_lines[0].mat_source).toBe("catalog");
  });

  it("surfaces Supabase insertion errors with table context", async () => {
    const supabase = createSupabaseRecorder({ failOn: "bl_metiers" });

    await expect(
      createProjectFromCanonicalPayload(SIMPLE_CANONICAL_PROJECT, supabase, {
        idFactory: createIdFactory(),
      })
    ).rejects.toThrow("bl_metiers: bl_metiers failed");
  });
});
