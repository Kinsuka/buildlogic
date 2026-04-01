function stripFenceMarkers(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("```"));
}

function cleanOptionLabel(label) {
  return String(label || "")
    .replace(/\[recommande\]|\(recommande\)|⭐/gi, "")
    .trim();
}

function inferQuestionType(text) {
  const source = String(text || "");
  if (/^TYPE\s*:\s*multiple\b/im.test(source)) return "multiple";
  if (/^TYPE\s*:\s*single\b/im.test(source)) return "single";
  if (/\bplusieurs choix\b|\bcoche\b|\bselection multiple\b/i.test(source)) return "multiple";
  return "single";
}

function extractQuestionTitle(lines) {
  const explicit = lines.find((line) => /^QUESTION\s*:/i.test(line));
  if (explicit) return explicit.replace(/^QUESTION\s*:/i, "").trim();

  const firstQuestion = lines.find((line) => /[?]$/.test(line) && !/^[-*]/.test(line));
  if (firstQuestion) return firstQuestion;

  return lines.find((line) => !/^[-*]/.test(line)) || "Choisis l'option la plus proche du chantier.";
}

function extractRecommendedLabel(lines, options) {
  const explicit = lines.find((line) => /^RECOMMANDATION\s*:/i.test(line));
  if (explicit) return cleanOptionLabel(explicit.replace(/^RECOMMANDATION\s*:/i, ""));

  const inline = options.find((option) => option.recommended);
  return inline?.label || options[0]?.label || "";
}

export function parseDecisionQuestion(text) {
  const lines = stripFenceMarkers(text);
  const type = inferQuestionType(text);

  const options = lines
    .filter((line) => /^([-*•]|\d+[.)]|[A-Z][.)])\s+/.test(line))
    .map((line) => line.replace(/^([-*•]|\d+[.)]|[A-Z][.)])\s+/, "").trim())
    .filter((line) => line && line.length <= 140)
    .filter((line) => !/^je ne sais pas$/i.test(line))
    .filter((line) => !/^autre$/i.test(line))
    .map((line) => ({
      label: cleanOptionLabel(line),
      recommended: /\[recommande\]|\(recommande\)|⭐/i.test(line),
    }))
    .filter((option, index, array) => option.label && array.findIndex((item) => item.label === option.label) === index)
    .slice(0, 6);

  const prompt = extractQuestionTitle(lines);
  const recommended = extractRecommendedLabel(lines, options);

  return {
    prompt,
    type,
    recommended,
    options,
    allowUnknown: true,
    allowOther: true,
  };
}

export function buildWizardAnswerPayload({ question, selectedChoices, otherText, dontKnow }) {
  const selected = (selectedChoices || []).filter(Boolean);
  const complement = String(otherText || "").trim();
  const recommended = question?.recommended || question?.options?.[0]?.label || "";

  if (dontKnow) {
    return [
      `DECISION WIZARD`,
      `Question: ${question?.prompt || "question non precisee"}`,
      `Statut: Je ne sais pas`,
      recommended ? `Option recommandee: ${recommended}` : null,
      `Consigne: si ce point n'est pas bloquant, pars sur l'option recommandee ; sinon transforme-le en suspens`,
      complement ? `Complement libre: ${complement}` : null,
    ].filter(Boolean).join("\n");
  }

  return [
    `DECISION WIZARD`,
    `Question: ${question?.prompt || "question non precisee"}`,
    selected.length ? `Choix retenu: ${selected.join(" | ")}` : null,
    recommended && selected.includes(recommended) ? `Option recommandee retenue: ${recommended}` : null,
    complement ? `Autre / precision: ${complement}` : null,
  ].filter(Boolean).join("\n");
}

export function buildWizardConversation(reportMessage, steps, visibleStepIndex = steps.length - 1) {
  const messages = [];
  if (reportMessage) messages.push(reportMessage);

  steps.slice(0, Math.max(0, visibleStepIndex + 1)).forEach((step, index) => {
    if (step?.assistantMessage) messages.push(step.assistantMessage);
    if (index < visibleStepIndex && step?.answer?.submittedContent) {
      messages.push({ role: "user", content: step.answer.submittedContent });
    }
  });

  return messages;
}

export function createDecisionStep(assistantContent) {
  return {
    assistantMessage: { role: "assistant", content: assistantContent },
    question: parseDecisionQuestion(assistantContent),
    answer: null,
  };
}
