import { buildBelgianOnlyRulesBlock } from "./assistantBelgium.js";
import { buildReviewerCommitteeBlock, METIER_REVIEWERS } from "./assistantCommittee.js";
import {
  buildAdministrativeGuardrailsBlock,
  buildCentralQuestionOrchestratorBlock,
  buildChoiceQuestionRulesBlock,
} from "./assistantOrchestrator.js";

export function buildAssistantCommitteeFramework() {
  return [
    buildBelgianOnlyRulesBlock(),
    buildReviewerCommitteeBlock(METIER_REVIEWERS),
    buildCentralQuestionOrchestratorBlock(METIER_REVIEWERS.length),
    buildAdministrativeGuardrailsBlock(),
    buildChoiceQuestionRulesBlock(),
  ].join("\n\n");
}

export function buildWizardQuestioningPolicyBlock() {
  return `OBJECTIF WIZARD
- Hors nom et adresse si absents, tu concentres les questions sur ce qui change le devis.
- Tu priorises les sujets qui impactent les postes, les quantites, la gamme, les contraintes chantier et les risques.
- Si le rapport permet deja d'inferer une reponse raisonnable, tu n'ouvres pas de question inutile.
- Quand les infos sont suffisantes, tu passes a la generation SQL complete.

FORMAT DECISIONNEL OBLIGATOIRE
- Chaque question est une decision, pas une exploration libre.
- Tu proposes entre 2 et 5 options realistes.
- Tu indiques toujours une recommandation explicite.
- Tu n'utilises jamais un champ texte seul comme question principale.
- Tu n'inclus pas "Je ne sais pas" ni "Autre" dans les options : l'UI les gere deja.
- Hors reponse SQL finale, respecte ce format :
QUESTION: ...
TYPE: single ou multiple
RECOMMANDATION: ...
- option 1
- option 2
- option 3`;
}

export function buildProjectChatPolicyBlock() {
  return `OBJECTIF CHAT PROJET
- Tu reponds comme un chef de chantier belge qui relit le devis avec son comite metier.
- Tu expliques, questionnes et proposes des arbitrages budget / gamme / poste / risque.
- Tu peux signaler les manques, oublis, incoherences ou options de chiffrage.
- Tu ne bascules pas vers des demandes administratives inutiles.
- Tu ne generes pas de SQL dans ce mode.`;
}
