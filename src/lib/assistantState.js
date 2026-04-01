export const ASSISTANT_STATE_VERSION = 2;

export const ASSISTANT_STATE_KEYS = {
  newProjectWizard: "assistant.new_project_wizard",
  projectChat: "assistant.project_chat",
};

function nowIso() {
  return new Date().toISOString();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function normalizeFinalOutput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const kind = asString(value.kind);
  if (!kind) return null;
  return {
    kind,
    content: value.content ?? null,
  };
}

export function createEmptyAssistantState(flow) {
  return {
    version: ASSISTANT_STATE_VERSION,
    flow: flow || "unknown",
    phase: "idle",
    turn: 0,
    project_type: null,
    summary: "",
    known_facts: {},
    missing_fields: [],
    assumptions: [],
    suspens: [],
    lots_draft: [],
    metiers_draft: [],
    last_question: null,
    last_user_answer: null,
    final_output: null,
    final_sql: "",
    creation_status: "clarification",
    confidence: "low",
    ready_to_generate: false,
    updated_at: nowIso(),
  };
}

export function normalizeAssistantState(input, flow) {
  const base = createEmptyAssistantState(flow || input?.flow);
  const state = asObject(input);

  return {
    version: asNumber(state.version, ASSISTANT_STATE_VERSION),
    flow: asString(state.flow, base.flow),
    phase: asString(state.phase, base.phase),
    turn: asNumber(state.turn, base.turn),
    project_type: state.project_type ?? base.project_type,
    summary: asString(state.summary, base.summary),
    known_facts: asObject(state.known_facts),
    missing_fields: asArray(state.missing_fields),
    assumptions: asArray(state.assumptions),
    suspens: asArray(state.suspens),
    lots_draft: asArray(state.lots_draft),
    metiers_draft: asArray(state.metiers_draft),
    last_question: state.last_question ?? base.last_question,
    last_user_answer: state.last_user_answer ?? base.last_user_answer,
    final_output: normalizeFinalOutput(state.final_output),
    final_sql: asString(state.final_sql, base.final_sql),
    creation_status: asString(state.creation_status, base.creation_status),
    confidence: asString(state.confidence, base.confidence),
    ready_to_generate: asBoolean(state.ready_to_generate, false),
    updated_at: asString(state.updated_at, base.updated_at),
  };
}

export function mergeAssistantState(prev, patch) {
  const base = normalizeAssistantState(prev);
  const nextPatch = asObject(patch);

  return normalizeAssistantState({
    ...base,
    ...nextPatch,
    known_facts: {...base.known_facts, ...asObject(nextPatch.known_facts)},
    missing_fields: nextPatch.missing_fields ?? base.missing_fields,
    assumptions: nextPatch.assumptions ?? base.assumptions,
    suspens: nextPatch.suspens ?? base.suspens,
    lots_draft: nextPatch.lots_draft ?? base.lots_draft,
    metiers_draft: nextPatch.metiers_draft ?? base.metiers_draft,
    updated_at: nextPatch.updated_at || nowIso(),
  }, base.flow);
}
