import { describe, expect, it } from "vitest";
import {
  buildBelgianOnlyRulesBlock,
  FR_BE_TERMINOLOGY,
  normalizeBelgianTerminology,
} from "./assistantBelgium.js";
import { buildReviewerCommitteeBlock, METIER_REVIEWERS } from "./assistantCommittee.js";
import {
  buildAdministrativeGuardrailsBlock,
  buildCentralQuestionOrchestratorBlock,
  detectAdministrativeQuestionIssues,
  isChoiceOrientedQuestion,
  questionHasConcreteOptions,
} from "./assistantOrchestrator.js";
import {
  buildAssistantCommitteeFramework,
  buildProjectChatPolicyBlock,
  buildWizardQuestioningPolicyBlock,
} from "./assistantFramework.js";
import {
  buildProjectReviewContext,
  buildWizardReviewContext,
  synthesizeProjectReview,
  synthesizeReportReview,
} from "./assistantReviewSynthesis.js";
import { buildProjectAssistantSystem } from "./llm.js";

describe("assistant framework", () => {
  it("normalizes French wording to Belgian chantier terminology", () => {
    const input = "Devis TTC pour maison mitoyenne avec placo, chauffe-eau et toilettes.";
    const output = normalizeBelgianTerminology(input);

    expect(output).toContain("TVAC");
    expect(output).toContain("maison 2 facades");
    expect(output).toContain("Gyproc");
    expect(output).toContain("boiler");
    expect(output).toContain("WC");
  });

  it("does not rewrite code fences while normalizing text", () => {
    const input = "Budget TTC confirme.\n```sql\nSELECT 'TTC';\n```";
    const output = normalizeBelgianTerminology(input);

    expect(output).toContain("Budget TVAC confirme.");
    expect(output).toContain("SELECT 'TTC';");
  });

  it("flags useless administrative questions", () => {
    const issues = detectAdministrativeQuestionIssues(
      "Quel est votre numero de TVA, votre email et votre telephone ?"
    );

    expect(issues).toEqual(
      expect.arrayContaining(["numero de TVA", "email", "telephone"])
    );
  });

  it("keeps name and address out of forbidden administrative issues", () => {
    const issues = detectAdministrativeQuestionIssues(
      "Quel est le nom du client et l'adresse du bien ?"
    );

    expect(issues).toEqual([]);
  });

  it("recognizes choice-oriented questions with concrete options", () => {
    const question = `Quel type de douche faut-il chiffrer ?
- Douche a l'italienne
- Receveur extra-plat
- Baignoire avec pare-bain`;

    expect(questionHasConcreteOptions(question)).toBe(true);
    expect(isChoiceOrientedQuestion(question)).toBe(true);
  });

  it("rejects vague questions without concrete options", () => {
    const question = "Pouvez-vous detailler un peu mieux le chantier ?";

    expect(questionHasConcreteOptions(question)).toBe(false);
    expect(isChoiceOrientedQuestion(question)).toBe(false);
  });

  it("exposes a reusable Belgium-only rules block and terminology table", () => {
    const block = buildBelgianOnlyRulesBlock();

    expect(block).toContain("CADRE BELGIQUE UNIQUEMENT");
    expect(block).toContain("HTVA");
    expect(FR_BE_TERMINOLOGY.length).toBeGreaterThanOrEqual(6);
  });

  it("defines specialized metier reviewers", () => {
    const block = buildReviewerCommitteeBlock();

    expect(METIER_REVIEWERS.length).toBeGreaterThanOrEqual(5);
    expect(block).toContain("COMITE DE RESPONSABLES METIER");
    expect(block).toContain("plomberie et sanitaire");
    expect(block).toContain("budget, quantites et risques");
  });

  it("defines a central orchestrator focused on useful chantier questions", () => {
    const block = buildCentralQuestionOrchestratorBlock(METIER_REVIEWERS.length);

    expect(block).toContain("CHEF DE CHANTIER CENTRAL");
    expect(block).toContain("question la plus rentable");
    expect(buildAdministrativeGuardrailsBlock()).toContain("seules deux infos administratives");
  });

  it("builds a reviewer-by-reviewer synthesis from a report", () => {
    const synthesis = synthesizeReportReview(
      "Renovation salle de bain avec douche italienne, WC suspendu, carrelage mural, spots et extraction. Acces au 3e etage sans ascenseur."
    );

    expect(synthesis.reviewers).toHaveLength(METIER_REVIEWERS.length);
    expect(
      synthesis.reviewers.find((item) => item.reviewer_id === "plomberie_sanitaire")?.covered_topics
    ).toEqual(expect.arrayContaining(["WC", "douche"]));
    expect(
      synthesis.reviewers.find((item) => item.reviewer_id === "electricite_ventilation")?.covered_topics
    ).toEqual(expect.arrayContaining(["eclairage", "extracteurs"]));
    expect(synthesis.consolidated_missing_topics.length).toBeGreaterThan(0);
  });

  it("builds prompt-ready wizard and project review contexts", () => {
    const wizardContext = buildWizardReviewContext(
      "Renovation avec boiler a remplacer, faience et Gyproc a refaire."
    );
    const projectContext = buildProjectReviewContext({
      client: "Emeline",
      adresse: "Rue des Tests 12, Bruxelles",
      lots: [
        {
          title: "Salle de bain",
          meta: "Renovation complete",
          sequence: ["Plombier", "Carreleur"],
          metiers: [
            {
              name: "Plombier",
              mo: [{ label: "Depose sanitaire" }],
              mat: [{ label: "WC suspendu" }],
            },
          ],
        },
      ],
      suspens: [{ texte: "Ventilation a confirmer" }],
    });
    const projectSynthesis = synthesizeProjectReview({
      client: "Emeline",
      adresse: "Rue des Tests 12, Bruxelles",
      lots: [],
      suspens: [],
    });

    expect(wizardContext).toContain("PRE-ANALYSE INTERNE DU RAPPORT");
    expect(wizardContext).toContain("SYNTHESE CHEF DE CHANTIER CENTRAL");
    expect(projectContext).toContain("RELECTURE INTERNE DU DEVIS PAR LE COMITE");
    expect(projectSynthesis.reviewers).toHaveLength(METIER_REVIEWERS.length);
  });

  it("assembles the committee framework and chat policy into the project assistant system prompt", () => {
    const system = buildProjectAssistantSystem({
      client: "Emeline",
      adresse: "Rue des Tests 12, Bruxelles",
      lots: [],
      suspens: [],
    });

    expect(buildAssistantCommitteeFramework()).toContain("COMITE DE RESPONSABLES METIER");
    expect(buildWizardQuestioningPolicyBlock()).toContain("OBJECTIF WIZARD");
    expect(buildProjectChatPolicyBlock()).toContain("OBJECTIF CHAT PROJET");
    expect(system).toContain("chef de chantier central");
    expect(system).toContain("francais de chantier belge");
    expect(system).toContain("RELECTURE INTERNE DU DEVIS PAR LE COMITE");
    expect(system).toContain("Emeline");
    expect(system).toContain("Rue des Tests 12, Bruxelles");
  });
});
