export const CANONICAL_PAYLOAD_VERSION = "v1";

export const PROJECT_STATUS_VALUES = ["draft"];
export const TVA_VALUES = [6, 21];
export const SUSPENS_LEVEL_VALUES = ["rouge", "orange", "vert"];
export const MAT_SOURCE_VALUES = ["catalog", "provisional", "override"];

function asObject(value, fallback = {}) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function asNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function validateRangeOrder(values, label) {
  ensure(values.lo <= values.sug && values.sug <= values.hi, `${label} must satisfy lo <= sug <= hi`);
}

function normalizePriceRange(input, label) {
  const value = asObject(input);
  const range = {
    lo: asNumber(value.lo, 0),
    sug: asNumber(value.sug, 0),
    hi: asNumber(value.hi, 0),
  };
  validateRangeOrder(range, label);
  return range;
}

function normalizeMatProps(props, path) {
  return asArray(props).map((prop, index) => {
    const item = asObject(prop);
    ensure(asString(item.name), `${path}[${index}].name is required`);
    return {
      name: asString(item.name),
      std: normalizePriceRange(item.std, `${path}[${index}].std`),
      mid: normalizePriceRange(item.mid, `${path}[${index}].mid`),
      sup: normalizePriceRange(item.sup, `${path}[${index}].sup`),
    };
  });
}

function normalizeMoLines(lines, path) {
  return asArray(lines).map((line, index) => {
    const item = asObject(line);
    ensure(asString(item.line_key), `${path}[${index}].line_key is required`);
    ensure(asString(item.label), `${path}[${index}].label is required`);

    const next = {
      line_key: asString(item.line_key),
      label: asString(item.label),
      j_lo: asNumber(item.j_lo, 0),
      j_sug: asNumber(item.j_sug, 0),
      j_hi: asNumber(item.j_hi, 0),
      tx_lo: asNumber(item.tx_lo, 0),
      tx_sug: asNumber(item.tx_sug, 0),
      tx_hi: asNumber(item.tx_hi, 0),
      ordre: asNumber(item.ordre, index + 1),
      nb_travailleurs: asNumber(item.nb_travailleurs, 1),
    };

    validateRangeOrder({ lo: next.j_lo, sug: next.j_sug, hi: next.j_hi }, `${path}[${index}].j_*`);
    validateRangeOrder({ lo: next.tx_lo, sug: next.tx_sug, hi: next.tx_hi }, `${path}[${index}].tx_*`);
    ensure(next.nb_travailleurs >= 1, `${path}[${index}].nb_travailleurs must be >= 1`);

    return next;
  });
}

function normalizeMatLines(lines, path) {
  return asArray(lines).map((line, index) => {
    const item = asObject(line);
    ensure(asString(item.line_key), `${path}[${index}].line_key is required`);
    ensure(asString(item.label), `${path}[${index}].label is required`);
    const matSource = asString(item.mat_source, "catalog");
    ensure(MAT_SOURCE_VALUES.includes(matSource), `${path}[${index}].mat_source is invalid`);

    return {
      line_key: asString(item.line_key),
      label: asString(item.label),
      avec_unite: Boolean(item.avec_unite),
      q_base: item.q_base == null ? null : asNumber(item.q_base, 0),
      d_base: item.d_base == null ? null : asString(item.d_base),
      props: normalizeMatProps(item.props, `${path}[${index}].props`),
      ordre: asNumber(item.ordre, index + 1),
      mat_source: matSource,
    };
  });
}

function normalizeMetiers(metiers, path) {
  return asArray(metiers).map((metier, index) => {
    const item = asObject(metier);
    ensure(asString(item.metier_key), `${path}[${index}].metier_key is required`);
    ensure(asString(item.name), `${path}[${index}].name is required`);

    return {
      metier_key: asString(item.metier_key),
      name: asString(item.name),
      icon: asString(item.icon, "🔧"),
      ordre: asNumber(item.ordre, index + 1),
      mo_lines: normalizeMoLines(item.mo_lines, `${path}[${index}].mo_lines`),
      mat_lines: normalizeMatLines(item.mat_lines, `${path}[${index}].mat_lines`),
    };
  });
}

function normalizeLots(lots) {
  return asArray(lots).map((lot, index) => {
    const item = asObject(lot);
    ensure(asString(item.lot_key), `lots[${index}].lot_key is required`);
    ensure(asString(item.title), `lots[${index}].title is required`);

    const metiers = normalizeMetiers(item.metiers, `lots[${index}].metiers`);
    const sequence = asArray(item.sequence).map((value) => asString(value)).filter(Boolean);

    return {
      lot_key: asString(item.lot_key),
      title: asString(item.title),
      meta: asString(item.meta),
      imprevu_pct: asNumber(item.imprevu_pct, 10),
      sequence: sequence.length ? sequence : metiers.map((metier) => metier.metier_key),
      default_open: Boolean(item.default_open),
      ordre: asNumber(item.ordre, index + 1),
      metiers,
    };
  });
}

function normalizeSuspens(suspens) {
  return asArray(suspens).map((suspensItem, index) => {
    const item = asObject(suspensItem);
    ensure(asString(item.texte), `suspens[${index}].texte is required`);
    const niveau = asString(item.niveau, "orange");
    ensure(SUSPENS_LEVEL_VALUES.includes(niveau), `suspens[${index}].niveau is invalid`);
    return {
      texte: asString(item.texte),
      niveau,
      ordre: asNumber(item.ordre, index + 1),
    };
  });
}

export function validateCanonicalProjectPayload(input) {
  const payload = asObject(input);
  ensure(
    payload.version == null || payload.version === CANONICAL_PAYLOAD_VERSION,
    `payload.version must be ${CANONICAL_PAYLOAD_VERSION}`
  );

  const project = asObject(payload.project);
  ensure(asString(project.client_nom), "project.client_nom is required");

  const statut = asString(project.statut, "draft");
  ensure(PROJECT_STATUS_VALUES.includes(statut), "project.statut is invalid");

  const tva = asNumber(project.tva, 6);
  ensure(TVA_VALUES.includes(tva), "project.tva is invalid");

  const normalized = {
    version: CANONICAL_PAYLOAD_VERSION,
    project: {
      client_nom: asString(project.client_nom),
      adresse: asString(project.adresse),
      tva,
      date_visite: asString(project.date_visite),
      validite: asNumber(project.validite, 30),
      store_key: asString(project.store_key),
      statut,
      rapport_visite: asString(project.rapport_visite),
      notes_internes: asString(project.notes_internes),
    },
    suspens: normalizeSuspens(payload.suspens),
    lots: normalizeLots(payload.lots),
  };

  return normalized;
}
