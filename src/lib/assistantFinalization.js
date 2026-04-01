export const WIZARD_CREATION_STATUS = {
  clarification: "clarification",
  ready_to_create: "ready_to_create",
  creating: "creating",
  created: "created",
  creation_error: "creation_error",
};

function estimatePayloadLength(payload) {
  if (!payload) return 0;
  try {
    return JSON.stringify(payload).length;
  } catch (_) {
    return 0;
  }
}

export function buildAssistantFinalizationMeta({
  feature = "project_wizard",
  phase = WIZARD_CREATION_STATUS.clarification,
  turn = 0,
  provider = "unknown",
  reply = "",
  outputFormat = "none",
  payload = null,
  sql = "",
  edgeStatus = null,
  edgeError = null,
} = {}) {
  return {
    feature,
    phase,
    turn,
    provider,
    outputFormat,
    replyLength: String(reply || "").length,
    payloadLength: estimatePayloadLength(payload),
    sqlLength: String(sql || "").length,
    hasCanonicalPayload: Boolean(payload),
    hasSqlBlock: Boolean(sql),
    edgeStatus,
    edgeError,
  };
}

export function logAssistantFinalizationEvent(event, meta = {}) {
  if (!import.meta.env.DEV) return;

  const entry = {
    stamp: new Date().toISOString(),
    event,
    ...meta,
  };

  if (typeof window !== "undefined") {
    window.__ONA_AI_DEBUG__ = window.__ONA_AI_DEBUG__ || [];
    window.__ONA_AI_DEBUG__.push(entry);
  }

  console.groupCollapsed(`[ONA_AI_FINAL] ${event}`);
  Object.entries(entry).forEach(([key, value]) => {
    console.log(`${key}:`, value);
  });
  console.groupEnd();
}
