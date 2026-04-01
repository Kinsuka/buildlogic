import { describe, expect, it } from "vitest";
import {
  buildWizardAnswerPayload,
  buildWizardConversation,
  createDecisionStep,
  parseDecisionQuestion,
} from "./assistantDecisionWizard.js";

describe("assistant decision wizard", () => {
  it("parses a structured decision question with recommendation", () => {
    const parsed = parseDecisionQuestion(`QUESTION: Quel type de douche faut-il chiffrer ?
TYPE: single
RECOMMANDATION: Receveur extra-plat
- Douche a l'italienne
- [recommande] Receveur extra-plat
- Baignoire avec pare-bain`);

    expect(parsed.prompt).toBe("Quel type de douche faut-il chiffrer ?");
    expect(parsed.type).toBe("single");
    expect(parsed.recommended).toBe("Receveur extra-plat");
    expect(parsed.options.map((option) => option.label)).toEqual([
      "Douche a l'italienne",
      "Receveur extra-plat",
      "Baignoire avec pare-bain",
    ]);
  });

  it("keeps compatibility with simple bullet questions", () => {
    const parsed = parseDecisionQuestion(`Quel niveau de finition ?
- Standard
- Superieur`);

    expect(parsed.prompt).toBe("Quel niveau de finition ?");
    expect(parsed.type).toBe("single");
    expect(parsed.options).toHaveLength(2);
    expect(parsed.recommended).toBe("Standard");
  });

  it("builds a non-blocking payload for 'Je ne sais pas'", () => {
    const question = parseDecisionQuestion(`QUESTION: Quel niveau de finition ?
TYPE: single
RECOMMANDATION: Standard
- [recommande] Standard
- Superieur`);

    const payload = buildWizardAnswerPayload({
      question,
      selectedChoices: [],
      otherText: "Client pas encore decide",
      dontKnow: true,
    });

    expect(payload).toContain("Statut: Je ne sais pas");
    expect(payload).toContain("Option recommandee: Standard");
    expect(payload).toContain("transforme-le en suspens");
  });

  it("rebuilds the visible conversation from report + answered steps", () => {
    const reportMessage = { role: "user", content: "Rapport initial" };
    const step1 = createDecisionStep("Quel type de renovation ?\n- Salle de bain\n- Cuisine");
    step1.answer = { submittedContent: "DECISION WIZARD\nChoix retenu: Salle de bain" };
    const step2 = createDecisionStep("Quel niveau de finition ?\n- Standard\n- Superieur");

    const messages = buildWizardConversation(reportMessage, [step1, step2], 1);

    expect(messages).toEqual([
      reportMessage,
      step1.assistantMessage,
      { role: "user", content: "DECISION WIZARD\nChoix retenu: Salle de bain" },
      step2.assistantMessage,
    ]);
  });
});
