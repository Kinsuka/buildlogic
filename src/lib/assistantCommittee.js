export const METIER_REVIEWERS = [
  {
    id: "demolition_preparation",
    label: "Responsable demolition et preparation",
    scope: [
      "deposes",
      "protections",
      "evacuations",
      "etat des supports",
      "acces chantier",
    ],
  },
  {
    id: "plomberie_sanitaire",
    label: "Responsable plomberie et sanitaire",
    scope: [
      "arrivees et evacuations",
      "boiler",
      "WC",
      "douche",
      "baignoire",
      "robinetterie",
    ],
  },
  {
    id: "electricite_ventilation",
    label: "Responsable electricite et ventilation",
    scope: [
      "mise en conformite",
      "prises",
      "eclairage",
      "extracteurs",
      "ventilation",
      "besoins techniques",
    ],
  },
  {
    id: "surfaces_finitions",
    label: "Responsable surfaces et finitions",
    scope: [
      "chapes",
      "carrelages",
      "faiences",
      "Gyproc",
      "enduits",
      "peintures",
    ],
  },
  {
    id: "budget_risques",
    label: "Responsable budget, quantites et risques",
    scope: [
      "gamme",
      "quantites",
      "degres de finition",
      "postes oublies",
      "risques de chantier",
      "imprevus",
    ],
  },
];

export function buildReviewerCommitteeBlock(reviewers = METIER_REVIEWERS) {
  const lines = reviewers
    .map(
      (reviewer) =>
        `- ${reviewer.label} [${reviewer.id}] : relit ${reviewer.scope.join(", ")}`
    )
    .join("\n");

  return `COMITE DE RESPONSABLES METIER
Avant de poser une question, tu analyses le rapport comme si ce comite relisait chacun son perimetre :
${lines}`;
}
