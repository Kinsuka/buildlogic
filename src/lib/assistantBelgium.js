export const BELGIAN_ONLY_RULES = [
  "Tu parles en francais de chantier belge, pas en francais de France.",
  "Tu privilegies les termes utilises en Belgique sur chantier : HTVA, TVAC, WC, boiler, Gyproc, maison 2/3/4 facades.",
  "Tu evites les formulations administratives ou juridiques non utiles au devis.",
  "Tu gardes un ton concret, chantier, budget, postes, quantites, finitions, contraintes et risques.",
];

export const FR_BE_TERMINOLOGY = [
  {
    id: "ttc",
    fr: ["TTC", "toutes taxes comprises"],
    be: "TVAC",
  },
  {
    id: "ht",
    fr: ["HT", "hors taxe", "hors taxes"],
    be: "HTVA",
  },
  {
    id: "placo",
    fr: ["placo", "placoplatre", "placoplatre", "plaque de platre", "BA13"],
    be: "Gyproc",
  },
  {
    id: "chauffe_eau",
    fr: ["chauffe-eau", "chauffe eau"],
    be: "boiler",
  },
  {
    id: "toilettes",
    fr: ["toilettes"],
    be: "WC",
  },
  {
    id: "maison_mitoyenne",
    fr: ["maison mitoyenne"],
    be: "maison 2 facades",
  },
  {
    id: "maison_semi_mitoyenne",
    fr: ["maison semi-mitoyenne", "maison semi mitoyenne"],
    be: "maison 3 facades",
  },
  {
    id: "maison_individuelle",
    fr: ["maison individuelle"],
    be: "maison 4 facades",
  },
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceOutsideCodeFences(text, replacer) {
  return String(text)
    .split(/(```[\s\S]*?```)/g)
    .map((chunk) => (chunk.startsWith("```") ? chunk : replacer(chunk)))
    .join("");
}

function buildTerminologyPatterns() {
  return FR_BE_TERMINOLOGY.flatMap((entry) =>
    entry.fr.map((term) => {
      const isWordLike = /^[A-Za-z0-9 -]+$/.test(term);
      const source = isWordLike ? `\\b${escapeRegExp(term)}\\b` : escapeRegExp(term);
      return {
        ...entry,
        pattern: new RegExp(source, "gi"),
      };
    })
  );
}

const TERMINOLOGY_PATTERNS = buildTerminologyPatterns();

export function normalizeBelgianTerminology(text) {
  if (!text) return "";

  return replaceOutsideCodeFences(text, (chunk) =>
    TERMINOLOGY_PATTERNS.reduce(
      (current, rule) => current.replace(rule.pattern, rule.be),
      chunk
    )
  );
}

export function buildBelgianOnlyRulesBlock() {
  const rules = BELGIAN_ONLY_RULES.map((rule) => `- ${rule}`).join("\n");
  const terminology = FR_BE_TERMINOLOGY
    .map((entry) => `- ${entry.fr.join(" / ")} -> ${entry.be}`)
    .join("\n");

  return `CADRE BELGIQUE UNIQUEMENT
${rules}

NORMALISATION TERMINOLOGIQUE FR -> BE
${terminology}`;
}
