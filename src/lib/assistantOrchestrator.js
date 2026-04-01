export const ALLOWED_ADMIN_TOPICS = ["nom", "adresse"];

export const FORBIDDEN_ADMIN_TOPICS = [
  { label: "email", pattern: /\bemail\b|\bmail\b/i },
  { label: "telephone", pattern: /\btelephone\b|\bportable\b|\bGSM\b/i },
  { label: "numero de TVA", pattern: /\bnumero de TVA\b|\bTVA client\b/i },
  { label: "numero d'entreprise", pattern: /\bnumero d['’]entreprise\b|\bSIRET\b|\bRCS\b/i },
  { label: "IBAN", pattern: /\bIBAN\b|\bRIB\b/i },
  { label: "date de naissance", pattern: /\bdate de naissance\b/i },
  { label: "etat civil", pattern: /\betat civil\b|\bsituation familiale\b/i },
  { label: "profession", pattern: /\bprofession\b|\bmetier du client\b/i },
];

function countChoiceLines(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^([-*]|\d+[.)]|[A-Z][.)])\s+/.test(line)).length;
}

export function detectAdministrativeQuestionIssues(text) {
  return FORBIDDEN_ADMIN_TOPICS
    .filter((rule) => rule.pattern.test(String(text || "")))
    .map((rule) => rule.label);
}

export function questionHasConcreteOptions(text) {
  return countChoiceLines(text) >= 2;
}

export function isChoiceOrientedQuestion(text) {
  const value = String(text || "");
  return (
    questionHasConcreteOptions(value) &&
    (/\?/.test(value) || /\bchoisis\b|\bselectionne\b|\bindique\b/i.test(value))
  );
}

export function buildAdministrativeGuardrailsBlock() {
  const banned = FORBIDDEN_ADMIN_TOPICS.map((rule) => `- ${rule.label}`).join("\n");

  return `QUESTIONS ADMINISTRATIVES
- Tu ne demandes des infos administratives que si elles changent vraiment la creation du projet.
- Par defaut, seules deux infos administratives sont autorisees : nom et adresse.
- Tu n'ouvres pas de boucle sur email, telephone, numero de TVA, numero d'entreprise, IBAN, profession ou etat civil.

QUESTIONS ADMINISTRATIVES A EVITER
${banned}`;
}

export function buildChoiceQuestionRulesBlock() {
  return `FORME DES QUESTIONS
- Tu poses une seule question a la fois.
- Cette question doit debloquer le devis, le budget, la gamme, les quantites ou un poste critique.
- Chaque question propose entre 2 et 5 options concretes, directement exploitables.
- Tu evites les formulations floues du type "Precisez", "Expliquez", "Pouvez-vous detailler ?".
- Tu reserves le texte libre a un simple complement apres les choix.`;
}

export function buildCentralQuestionOrchestratorBlock(reviewersCount) {
  return `CHEF DE CHANTIER CENTRAL
Tu n'es pas un assistant generaliste. Tu es le chef de chantier central ONA.
Tu consolides l'analyse de ${reviewersCount} responsables metier.
Tu ne renvoies pas le flou au client : tu choisis la question la plus rentable pour chiffrer juste.
Tu reduis le nombre de questions au strict minimum utile au devis.`;
}
