import { validateCanonicalProjectPayload } from "./canonicalProjectContract.js";

function defaultIdFactory() {
  return crypto.randomUUID();
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 18);
}

function defaultStoreKeyFactory(project) {
  const client = slugify(project.client_nom) || "projet";
  const city = slugify((project.adresse || "").split(",").pop() || "") || "bruxelles";
  return `ona_bl_${client}${city}2026`;
}

function asArrayInsert(value) {
  return Array.isArray(value) ? value : [];
}

function buildLotSequenceLabels(lot) {
  const metierByKey = new Map(lot.metiers.map((metier) => [metier.metier_key, metier.name]));
  return lot.sequence.map((entry) => metierByKey.get(entry) || entry);
}

export function buildCanonicalInsertPlan(rawPayload, options = {}) {
  const payload = validateCanonicalProjectPayload(rawPayload);
  const idFactory = options.idFactory || defaultIdFactory;
  const storeKeyFactory = options.storeKeyFactory || defaultStoreKeyFactory;

  const projectId = idFactory("project");
  const projectStoreKey = payload.project.store_key || storeKeyFactory(payload.project);

  const projectRow = {
    id: projectId,
    client_nom: payload.project.client_nom,
    adresse: payload.project.adresse || null,
    tva: payload.project.tva,
    date_visite: payload.project.date_visite || null,
    validite: payload.project.validite,
    store_key: projectStoreKey,
    statut: payload.project.statut,
    rapport_visite: payload.project.rapport_visite || null,
    notes_internes: payload.project.notes_internes || null,
  };

  const suspensRows = payload.suspens.map((suspens) => ({
    id: idFactory("suspens"),
    project_id: projectId,
    texte: suspens.texte,
    niveau: suspens.niveau,
    ordre: suspens.ordre,
  }));

  const lotRows = [];
  const metierRows = [];
  const moLineRows = [];
  const matLineRows = [];

  payload.lots.forEach((lot) => {
    const lotId = idFactory("lot");
    lotRows.push({
      id: lotId,
      project_id: projectId,
      lot_key: lot.lot_key,
      title: lot.title,
      meta: lot.meta || "",
      imprevu_pct: lot.imprevu_pct,
      sequence: asArrayInsert(buildLotSequenceLabels(lot)),
      default_open: lot.default_open,
      ordre: lot.ordre,
    });

    lot.metiers.forEach((metier) => {
      const metierId = idFactory("metier");
      metierRows.push({
        id: metierId,
        lot_id: lotId,
        metier_key: metier.metier_key,
        name: metier.name,
        icon: metier.icon,
        ordre: metier.ordre,
      });

      metier.mo_lines.forEach((line) => {
        moLineRows.push({
          id: idFactory("mo_line"),
          metier_id: metierId,
          line_key: line.line_key,
          label: line.label,
          j_lo: line.j_lo,
          j_sug: line.j_sug,
          j_hi: line.j_hi,
          tx_lo: line.tx_lo,
          tx_sug: line.tx_sug,
          tx_hi: line.tx_hi,
          ordre: line.ordre,
          nb_travailleurs: line.nb_travailleurs,
        });
      });

      metier.mat_lines.forEach((line) => {
        matLineRows.push({
          id: idFactory("mat_line"),
          metier_id: metierId,
          line_key: line.line_key,
          label: line.label,
          avec_unite: line.avec_unite,
          q_base: line.q_base,
          d_base: line.d_base,
          props: line.props,
          ordre: line.ordre,
          mat_source: line.mat_source || "catalog",
        });
      });
    });
  });

  return {
    payload,
    projectId,
    storeKey: projectStoreKey,
    inserts: {
      bl_projects: [projectRow],
      bl_suspens: suspensRows,
      bl_lots: lotRows,
      bl_metiers: metierRows,
      bl_mo_lines: moLineRows,
      bl_mat_lines: matLineRows,
    },
  };
}

export function buildProjectSnapshotFromInsertPlan(plan) {
  const projectRow = plan?.inserts?.bl_projects?.[0];
  if (!projectRow) return null;

  const lotRows = [...(plan.inserts.bl_lots || [])].sort((a, b) => a.ordre - b.ordre);
  const metierRows = [...(plan.inserts.bl_metiers || [])].sort((a, b) => a.ordre - b.ordre);
  const moLineRows = [...(plan.inserts.bl_mo_lines || [])].sort((a, b) => a.ordre - b.ordre);
  const matLineRows = [...(plan.inserts.bl_mat_lines || [])].sort((a, b) => a.ordre - b.ordre);
  const suspensRows = [...(plan.inserts.bl_suspens || [])].sort((a, b) => a.ordre - b.ordre);

  return {
    id: projectRow.id,
    client: projectRow.client_nom,
    adresse: projectRow.adresse || "",
    tva: projectRow.tva,
    dateVisite: projectRow.date_visite || "",
    validite: projectRow.validite,
    storeKey: projectRow.store_key,
    statut: projectRow.statut,
    rapportVisite: projectRow.rapport_visite || "",
    notesInternes: projectRow.notes_internes || "",
    lots: lotRows.map((lotRow) => {
      const metiers = metierRows
        .filter((metierRow) => metierRow.lot_id === lotRow.id)
        .map((metierRow) => ({
          id: metierRow.id,
          metierKey: metierRow.metier_key,
          name: metierRow.name,
          icon: metierRow.icon,
          mo: moLineRows
            .filter((line) => line.metier_id === metierRow.id)
            .map((line) => ({
              id: line.id,
              lineKey: line.line_key,
              label: line.label,
              jRef: { lo: line.j_lo, sug: line.j_sug, hi: line.j_hi },
              txRef: { lo: line.tx_lo, sug: line.tx_sug, hi: line.tx_hi },
              nbTravailleurs: line.nb_travailleurs,
              metierName: metierRow.name,
            })),
          mat: matLineRows
            .filter((line) => line.metier_id === metierRow.id)
            .map((line) => ({
              id: line.id,
              lineKey: line.line_key,
              label: line.label,
              u: line.avec_unite,
              qBase: line.q_base,
              dBase: line.d_base,
              matSource: line.mat_source || "catalog",
              props: Array.isArray(line.props) ? line.props : [],
            })),
        }));

      return {
        id: lotRow.id,
        lotKey: lotRow.lot_key,
        title: lotRow.title,
        meta: lotRow.meta || "",
        imprevuPct: lotRow.imprevu_pct,
        sequence: Array.isArray(lotRow.sequence) ? lotRow.sequence : [],
        defaultOpen: Boolean(lotRow.default_open),
        metiers,
      };
    }),
    suspens: suspensRows.map((row) => ({
      id: row.id,
      texte: row.texte,
      niveau: row.niveau,
      ordre: row.ordre,
    })),
  };
}

async function insertRowsOrThrow(supabase, table, rows) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).insert(rows);
  if (error) {
    throw new Error(`${table}: ${error.message || "insert failed"}`);
  }
}

export async function createProjectFromCanonicalPayload(rawPayload, supabase, options = {}) {
  const plan = buildCanonicalInsertPlan(rawPayload, options);

  await insertRowsOrThrow(supabase, "bl_projects", plan.inserts.bl_projects);
  await insertRowsOrThrow(supabase, "bl_suspens", plan.inserts.bl_suspens);
  await insertRowsOrThrow(supabase, "bl_lots", plan.inserts.bl_lots);
  await insertRowsOrThrow(supabase, "bl_metiers", plan.inserts.bl_metiers);
  await insertRowsOrThrow(supabase, "bl_mo_lines", plan.inserts.bl_mo_lines);
  await insertRowsOrThrow(supabase, "bl_mat_lines", plan.inserts.bl_mat_lines);

  return {
    projectId: plan.projectId,
    storeKey: plan.storeKey,
    project: buildProjectSnapshotFromInsertPlan(plan),
    insertCounts: Object.fromEntries(
      Object.entries(plan.inserts).map(([table, rows]) => [table, rows.length])
    ),
    plan,
  };
}
