import { METIER_REVIEWERS } from "./assistantCommittee.js";

const REVIEWER_SIGNAL_RULES = {
  demolition_preparation: [
    { topic: "deposes", patterns: [/\bdepose\b/i, /\bdemolition\b/i, /\bcasse\b/i] },
    { topic: "protections", patterns: [/\bprotection\b/i, /\bbachage\b/i, /\bproteger\b/i] },
    { topic: "evacuations", patterns: [/\bevacu/i, /\bgravats\b/i, /\bdecharge\b/i] },
    { topic: "etat des supports", patterns: [/\bsupport/i, /\bmur/i, /\bsol\b/i, /\bplafond\b/i] },
    { topic: "acces chantier", patterns: [/\bacces\b/i, /\betage\b/i, /\bascenseur\b/i, /\bstationnement\b/i] },
  ],
  plomberie_sanitaire: [
    { topic: "arrivees et evacuations", patterns: [/\barrivee d'?eau\b/i, /\bevacuations?\b/i, /\bcanalis/i] },
    { topic: "boiler", patterns: [/\bboiler\b/i, /\bchauffe-eau\b/i] },
    { topic: "WC", patterns: [/\bWC\b/i, /\btoilettes\b/i, /\bsuspendu\b/i] },
    { topic: "douche", patterns: [/\bdouche\b/i, /\breceveur\b/i, /\bitalienne\b/i] },
    { topic: "baignoire", patterns: [/\bbaignoire\b/i] },
    { topic: "robinetterie", patterns: [/\brobinetterie\b/i, /\bmitigeur\b/i, /\bcolonne\b/i] },
  ],
  electricite_ventilation: [
    { topic: "mise en conformite", patterns: [/\bconform/i, /\btableau electrique\b/i, /\bdifferentiel\b/i] },
    { topic: "prises", patterns: [/\bprises?\b/i, /\binterrupteurs?\b/i] },
    { topic: "eclairage", patterns: [/\beclairage\b/i, /\bspots?\b/i, /\bluminaires?\b/i] },
    { topic: "extracteurs", patterns: [/\bextracteur\b/i, /\bextraction\b/i, /\bventilation\b/i, /\bVMC\b/i] },
    { topic: "besoins techniques", patterns: [/\balimentation\b/i, /\bcircuit\b/i, /\bsaignee\b/i] },
  ],
  surfaces_finitions: [
    { topic: "chapes", patterns: [/\bchape\b/i, /\bragreage\b/i, /\bnivel/i] },
    { topic: "carrelages", patterns: [/\bcarrel/i, /\bgres\b/i] },
    { topic: "faiences", patterns: [/\bfaience\b/i] },
    { topic: "Gyproc", patterns: [/\bGyproc\b/i, /\bplaco\b/i, /\bplaque de platre\b/i] },
    { topic: "enduits", patterns: [/\benduit\b/i, /\brebouch/i, /\blissage\b/i] },
    { topic: "peintures", patterns: [/\bpeinture\b/i, /\bpeindre\b/i] },
  ],
  budget_risques: [
    { topic: "gamme", patterns: [/\bstandard\b/i, /\bmilieu de gamme\b/i, /\bsuperieur\b/i, /\bpremium\b/i] },
    { topic: "quantites", patterns: [/\bm2\b/i, /\bmetres?\b/i, /\bdimensions?\b/i, /\bsurface\b/i] },
    { topic: "degres de finition", patterns: [/\bfinition\b/i, /\bgamme\b/i] },
    { topic: "postes oublies", patterns: [/\ba voir\b/i, /\boption\b/i, /\ben attente\b/i, /\ba confirmer\b/i] },
    { topic: "risques de chantier", patterns: [/\brisque\b/i, /\binfiltration\b/i, /\bhumidite\b/i, /\bimprevu\b/i] },
    { topic: "imprevus", patterns: [/\bimprevu\b/i, /\breserve\b/i, /\bsuspens\b/i] },
  ],
};

function toSearchableText(value) {
  if (!value) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function flattenProjectSignals(project) {
  const lotTexts = (project?.lots || []).flatMap((lot) => [
    lot?.title,
    lot?.meta,
    ...(lot?.sequence || []),
    ...((lot?.metiers || []).flatMap((metier) => [
      metier?.name,
      ...((metier?.mo || []).map((line) => line?.label)),
      ...((metier?.mat || []).map((line) => line?.label)),
    ])),
  ]);

  return toSearchableText([
    project?.client,
    project?.adresse,
    ...lotTexts,
    ...(project?.suspens || []).map((item) => item?.texte || item),
  ].filter(Boolean).join(" \n "));
}

export function analyzeReviewerCoverage(text, reviewer) {
  const source = toSearchableText(text);
  const topicRules = REVIEWER_SIGNAL_RULES[reviewer.id] || [];
  const covered = [];
  const missing = [];

  topicRules.forEach((rule) => {
    const matched = rule.patterns.some((pattern) => pattern.test(source));
    if (matched) covered.push(rule.topic);
    else missing.push(rule.topic);
  });

  const coverageRatio = topicRules.length ? covered.length / topicRules.length : 0;
  const confidence =
    coverageRatio >= 0.6 ? "high" :
    coverageRatio >= 0.3 ? "medium" :
    "low";

  return {
    reviewer_id: reviewer.id,
    reviewer_label: reviewer.label,
    covered_topics: covered,
    missing_topics: missing,
    confidence,
  };
}

export function synthesizeReportReview(report, reviewers = METIER_REVIEWERS) {
  const source = toSearchableText(report);
  const reviews = reviewers.map((reviewer) => analyzeReviewerCoverage(source, reviewer));
  const consolidatedMissing = Array.from(new Set(reviews.flatMap((review) => review.missing_topics)));

  return {
    reviewers: reviews,
    consolidated_missing_topics: consolidatedMissing,
    questioning_priorities: consolidatedMissing.slice(0, 5),
  };
}

export function synthesizeProjectReview(project, reviewers = METIER_REVIEWERS) {
  return synthesizeReportReview(flattenProjectSignals(project), reviewers);
}

function formatReviewLines(review) {
  const covered = review.covered_topics.length ? review.covered_topics.join(", ") : "aucun signal clair";
  const missing = review.missing_topics.length ? review.missing_topics.join(", ") : "rien de critique";

  return [
    `- ${review.reviewer_label} [${review.reviewer_id}]`,
    `  signaux detectes : ${covered}`,
    `  points encore flous pour le devis : ${missing}`,
    `  confiance : ${review.confidence}`,
  ].join("\n");
}

export function buildWizardReviewContext(report) {
  const synthesis = synthesizeReportReview(report);
  const reviews = synthesis.reviewers.map(formatReviewLines).join("\n");
  const priorities = synthesis.questioning_priorities.length
    ? synthesis.questioning_priorities.join(", ")
    : "aucune priorite evidente";

  return `PRE-ANALYSE INTERNE DU RAPPORT
${reviews}

SYNTHESE CHEF DE CHANTIER CENTRAL
- priorites de questionnement : ${priorities}
- tu poses d'abord la question la plus utile parmi ces zones floues
- tu privilegies toujours des options concretes plutot qu'une question libre`;
}

export function buildProjectReviewContext(project) {
  const synthesis = synthesizeProjectReview(project);
  const reviews = synthesis.reviewers.map(formatReviewLines).join("\n");
  const priorities = synthesis.questioning_priorities.length
    ? synthesis.questioning_priorities.join(", ")
    : "aucune priorite evidente";

  return `RELECTURE INTERNE DU DEVIS PAR LE COMITE
${reviews}

SYNTHESE CHEF DE CHANTIER CENTRAL
- axes de vigilance actuels : ${priorities}
- tu reponds en t'appuyant d'abord sur ces angles metier`;
}
