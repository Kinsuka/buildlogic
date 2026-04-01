import React, { useEffect, useMemo, useState } from "react";
import {
  ASSISTANT_STATE_KEYS,
  createEmptyAssistantState,
  mergeAssistantState,
  normalizeAssistantState,
} from "../lib/assistantState.js";
import {
  buildWizardAnswerPayload,
  buildWizardConversation,
  createDecisionStep,
} from "../lib/assistantDecisionWizard.js";
import {
  buildAssistantFinalizationMeta,
  logAssistantFinalizationEvent,
  WIZARD_CREATION_STATUS,
} from "../lib/assistantFinalization.js";
import { validateCanonicalProjectPayload } from "../lib/canonicalProjectContract.js";
import { createProjectFromCanonicalPayload } from "../lib/createProjectFromCanonicalPayload.js";
import { createProject } from "../lib/projects.js";
import { buildONASystemPrompt, callLLM, extractCanonicalPayload, extractSQL } from "../lib/llm.js";
import { sb } from "../supabase.js";
import { Modal } from "./Modal.jsx";

const PROVIDER_LABELS = {
  claude: "Claude (Anthropic)",
  openai: "GPT-4o (OpenAI)",
  mistral: "Mistral (EU)",
};

const PROVIDER_LINKS = {
  claude: "https://console.anthropic.com/keys",
  openai: "https://platform.openai.com/api-keys",
  mistral: "https://console.mistral.ai/api-keys",
};

const WIZARD_ASSISTANT_STORAGE_KEY = `ona_${ASSISTANT_STATE_KEYS.newProjectWizard}`;

const FINAL_OUTPUT_KIND = {
  canonicalPayload: "canonical_payload",
  sql: "sql",
};

function shapeCreatedProject(raw) {
  if (!raw) return null;

  if (raw.projet_json) {
    return {
      ...raw.projet_json,
      id: raw.id || raw.projet_json.id,
      client: raw.projet_json.client || raw.client_nom || "",
      adresse: raw.projet_json.adresse || raw.adresse || "",
      storeKey: raw.projet_json.storeKey || raw.store_key || "",
      lots: Array.isArray(raw.projet_json.lots) ? raw.projet_json.lots : [],
      suspens: Array.isArray(raw.projet_json.suspens) ? raw.projet_json.suspens : [],
    };
  }

  return {
    id: raw.id,
    client: raw.client_nom || "",
    adresse: raw.adresse || "",
    tva: Number(raw.tva) || 6,
    dateVisite: raw.date_visite || new Date().toISOString().slice(0, 10),
    validite: Number(raw.validite) || 30,
    storeKey: raw.store_key || "",
    statut: raw.statut || "draft",
    lots: [],
    suspens: [],
  };
}

async function executeProjectSQL(sql) {
  const res = await fetch("https://abbaqmjidclmmwqcutlj.supabase.co/functions/v1/exec-project-sql", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({sql}),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    const error = new Error(data.error || `Erreur creation (${res.status})`);
    error.edgeStatus = res.status;
    error.edgeError = data.error || `Erreur creation (${res.status})`;
    throw error;
  }

  return { data, status: res.status };
}

export default function NewProjectModal({onClose, onCreated}) {
  const [mode, setMode] = useState("ai");
  const [step, setStep] = useState("config");
  const [provider, setProvider] = useState(localStorage.getItem("ona_api_provider") || "mistral");
  const [apiKey, setApiKey] = useState(() => {
    const initialProvider = localStorage.getItem("ona_api_provider") || "mistral";
    return localStorage.getItem(`ona_api_key_${initialProvider}`) || "";
  });
  const [remember, setRemember] = useState(true);
  const [rapport, setRapport] = useState("");
  const [reportMessage, setReportMessage] = useState(null);
  const [decisionSteps, setDecisionSteps] = useState([]);
  const [currentDecisionIndex, setCurrentDecisionIndex] = useState(0);
  const [input, setInput] = useState("");
  const [selectedChoices, setSelectedChoices] = useState([]);
  const [dontKnow, setDontKnow] = useState(false);
  const [assistantState, setAssistantState] = useState(() => {
    try {
      const raw = localStorage.getItem(WIZARD_ASSISTANT_STORAGE_KEY);
      return normalizeAssistantState(raw ? JSON.parse(raw) : null, "new_project_wizard");
    } catch (_) {
      return createEmptyAssistantState("new_project_wizard");
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payloadPreview, setPayloadPreview] = useState(null);
  const [sqlPreview, setSqlPreview] = useState("");
  const [creating, setCreating] = useState(false);

  const [clientNom, setClientNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [tva, setTva] = useState(6);
  const [dateVisite, setDateVisite] = useState(new Date().toISOString().slice(0, 10));
  const [validite, setValidite] = useState(30);

  const inp = {
    fontSize: 13,
    height: 34,
    padding: "0 10px",
    border: "1px solid var(--bd3)",
    borderRadius: 6,
    background: "var(--sf)",
    color: "var(--tx)",
    width: "100%",
  };

  const lbl = {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--tx3)",
    textTransform: "uppercase",
    letterSpacing: ".04em",
    marginBottom: 5,
    display: "block",
  };

  const hasFinalPreview = Boolean(payloadPreview || sqlPreview.trim());

  const header = useMemo(() => {
    if (mode === "manual") {
      return {
        title: "✚ Nouveau projet - Manuel",
        sub: "Saisie manuelle, les lots se construisent ensuite dans le builder",
      };
    }

    if (step === "config") {
      return {title: "✚ Nouveau projet - Configuration IA", sub: "Choisis l'assistant et configure la cle API"};
    }
    if (step === "rapport") {
      return {title: "✚ Nouveau projet - Rapport de visite", sub: "Colle le rapport pour lancer l'analyse"};
    }
    return {
      title: "✚ Nouveau projet - Questions",
      sub: creating
        ? "Creation du projet en cours..."
        : hasFinalPreview
          ? "Le projet est pret a etre cree"
          : "L'assistant collecte les infos manquantes",
    };
  }, [mode, step, hasFinalPreview, creating]);

  const currentDecision = decisionSteps[currentDecisionIndex] || null;
  const currentAssistantMessage = currentDecision?.assistantMessage || null;
  const currentQuestion = currentDecision?.question || null;
  const quickChoices = currentQuestion?.options || [];
  const visibleMessages = useMemo(
    () => buildWizardConversation(reportMessage, decisionSteps, currentDecisionIndex),
    [reportMessage, decisionSteps, currentDecisionIndex]
  );

  useEffect(() => {
    try {
      localStorage.setItem(WIZARD_ASSISTANT_STORAGE_KEY, JSON.stringify(assistantState));
    } catch (_) {}
  }, [assistantState]);

  useEffect(() => {
    if (mode !== "ai") return;
    setAssistantState((current) => mergeAssistantState(current, {phase: step}));
  }, [mode, step]);

  useEffect(() => {
    const answer = currentDecision?.answer;
    setSelectedChoices(answer?.selectedChoices || []);
    setInput(answer?.otherText || "");
    setDontKnow(Boolean(answer?.dontKnow));
  }, [currentDecisionIndex, currentDecision]);

  const toggleChoice = (choice) => {
    setDontKnow(false);
    setSelectedChoices((current) => {
      if (currentQuestion?.type === "multiple") {
        return current.includes(choice)
          ? current.filter((item) => item !== choice)
          : [...current, choice];
      }
      return current.includes(choice) ? [] : [choice];
    });
  };

  const persistApiConfig = () => {
    if (!remember) return;
    localStorage.setItem("ona_api_provider", provider);
    localStorage.setItem(`ona_api_key_${provider}`, apiKey);
  };

  const updateAssistantState = (patch) => {
    setAssistantState((current) => mergeAssistantState(current, patch));
  };

  const logFinalizationEvent = (event, meta = {}) => {
    logAssistantFinalizationEvent(event, {
      ...buildAssistantFinalizationMeta({
        provider,
        turn: assistantState.turn || 0,
        ...meta,
      }),
    });
  };

  const applyAssistantReply = ({ reply, phase, turn, nextSteps }) => {
    const rawPayload = extractCanonicalPayload(reply);
    const sql = extractSQL(reply);
    const meta = {
      feature: "project_wizard",
      phase,
      turn,
      provider,
      reply,
      outputFormat: rawPayload ? FINAL_OUTPUT_KIND.canonicalPayload : sql ? FINAL_OUTPUT_KIND.sql : "none",
    };

    if (rawPayload) {
      let normalizedPayload;
      try {
        normalizedPayload = validateCanonicalProjectPayload(rawPayload);
      } catch (e) {
        setError(`Payload final invalide : ${e.message}`);
        logAssistantFinalizationEvent("assistant_final_output_invalid", buildAssistantFinalizationMeta({
          ...meta,
          payload: rawPayload,
          edgeError: e.message,
        }));
        return false;
      }

      logAssistantFinalizationEvent("assistant_final_output_detected", buildAssistantFinalizationMeta({
        ...meta,
        payload: normalizedPayload,
      }));
      setPayloadPreview(normalizedPayload);
      setSqlPreview("");
      setDecisionSteps([
        ...nextSteps,
        {
          assistantMessage: { role: "assistant", content: reply },
          question: null,
          answer: null,
        },
      ]);
      setCurrentDecisionIndex(nextSteps.length);
      updateAssistantState({
        phase: "review",
        turn,
        last_question: null,
        final_output: {
          kind: FINAL_OUTPUT_KIND.canonicalPayload,
          content: normalizedPayload,
        },
        final_sql: "",
        creation_status: WIZARD_CREATION_STATUS.ready_to_create,
        ready_to_generate: true,
      });
      logAssistantFinalizationEvent("assistant_preview_ready", buildAssistantFinalizationMeta({
        ...meta,
        phase: "review",
        payload: normalizedPayload,
      }));
      return true;
    }

    if (sql) {
      logAssistantFinalizationEvent("assistant_final_output_detected", buildAssistantFinalizationMeta({
        ...meta,
        payload: null,
        sql,
      }));
      logAssistantFinalizationEvent("assistant_final_sql_detected", buildAssistantFinalizationMeta({
        ...meta,
        sql,
      }));
      setPayloadPreview(null);
      setSqlPreview(sql);
      setDecisionSteps([
        ...nextSteps,
        {
          assistantMessage: { role: "assistant", content: reply },
          question: null,
          answer: null,
        },
      ]);
      setCurrentDecisionIndex(nextSteps.length);
      updateAssistantState({
        phase: "review",
        turn,
        last_question: null,
        final_output: {
          kind: FINAL_OUTPUT_KIND.sql,
          content: sql,
        },
        final_sql: sql,
        creation_status: WIZARD_CREATION_STATUS.ready_to_create,
        ready_to_generate: true,
      });
      logAssistantFinalizationEvent("assistant_preview_ready", buildAssistantFinalizationMeta({
        ...meta,
        phase: "review",
        sql,
      }));
      logAssistantFinalizationEvent("assistant_sql_preview_ready", buildAssistantFinalizationMeta({
        ...meta,
        phase: "review",
        sql,
      }));
      return true;
    }

    logAssistantFinalizationEvent("assistant_final_output_missing", buildAssistantFinalizationMeta(meta));
    setSqlPreview("");
    setPayloadPreview(null);
    setDecisionSteps([...nextSteps, createDecisionStep(reply)]);
    setCurrentDecisionIndex(nextSteps.length);
    updateAssistantState({
      phase: "chat",
      turn,
      last_question: reply,
      final_output: null,
      final_sql: "",
      creation_status: WIZARD_CREATION_STATUS.clarification,
      ready_to_generate: false,
    });
    return false;
  };

  const analyzeRapport = async () => {
    if (!rapport.trim()) return;

    setLoading(true);
    setError("");
    setPayloadPreview(null);
    setSqlPreview("");

    try {
      persistApiConfig();
      const system = await buildONASystemPrompt({rapport});
      const firstMsg = {
        role: "user",
        content: `Voici le rapport de visite :\n\n${rapport}\n\nAnalyse-le et pose ta premiere question.`,
      };
      const reply = await callLLM([firstMsg], system, provider, apiKey, {
        feature: "project_wizard",
        phase: "initial_analysis",
        turn: 1,
      });
      setReportMessage(firstMsg);
      setSelectedChoices([]);
      setInput("");
      setDontKnow(false);
      updateAssistantState({
        phase: "chat",
        turn: 1,
        last_user_answer: rapport,
        last_question: reply,
        final_output: null,
        final_sql: "",
        creation_status: WIZARD_CREATION_STATUS.clarification,
        ready_to_generate: false,
      });
      applyAssistantReply({
        reply,
        phase: "initial_analysis",
        turn: 1,
        nextSteps: [],
      });
      setStep("chat");
    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  };

  const sendMessage = async (text) => {
    const content = typeof text === "string"
      ? text.trim()
      : buildWizardAnswerPayload({
          question: currentQuestion,
          selectedChoices: dontKnow ? [] : selectedChoices.map((item) => item.label || item),
          otherText: input,
          dontKnow,
        });
    if (!content) return;

    const nextSteps = decisionSteps.slice(0, currentDecisionIndex + 1).map((step, index) =>
      index === currentDecisionIndex
        ? {
            ...step,
            answer: {
              selectedChoices: dontKnow ? [] : selectedChoices.map((item) => item.label || item),
              otherText: input.trim(),
              dontKnow,
              submittedContent: content,
            },
          }
        : step
    );

    const nextMessages = buildWizardConversation(reportMessage, nextSteps, currentDecisionIndex).concat({
      role: "user",
      content,
    });
    setInput("");
    setSelectedChoices([]);
    setDontKnow(false);
    setLoading(true);
    setError("");

    try {
      const system = await buildONASystemPrompt({rapport});
      const reply = await callLLM(nextMessages, system, provider, apiKey, {
        feature: "project_wizard",
        phase: "clarification",
        turn: nextMessages.filter((message) => message.role === "user").length,
      });
      const updatedSteps = nextSteps;
      updateAssistantState({
        phase: "chat",
        turn: nextMessages.filter((message) => message.role === "user").length,
        last_user_answer: content,
        creation_status: WIZARD_CREATION_STATUS.clarification,
      });
      applyAssistantReply({
        reply,
        phase: "clarification",
        turn: nextMessages.filter((message) => message.role === "user").length,
        nextSteps: updatedSteps,
      });
    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  };

  const createProjectAI = async () => {
    if (!hasFinalPreview) return;

    setCreating(true);
    setError("");
    logAssistantFinalizationEvent("assistant_create_button_clicked", buildAssistantFinalizationMeta({
      feature: "project_wizard",
      phase: "ready_to_create",
      turn: assistantState.turn || 0,
      provider,
      outputFormat: payloadPreview ? FINAL_OUTPUT_KIND.canonicalPayload : FINAL_OUTPUT_KIND.sql,
      payload: payloadPreview,
      sql: sqlPreview,
    }));
    updateAssistantState({
      phase: "creating",
      creation_status: WIZARD_CREATION_STATUS.creating,
      final_output: payloadPreview
        ? { kind: FINAL_OUTPUT_KIND.canonicalPayload, content: payloadPreview }
        : sqlPreview
          ? { kind: FINAL_OUTPUT_KIND.sql, content: sqlPreview }
          : null,
      final_sql: sqlPreview,
      ready_to_generate: true,
    });

    try {
      let project = null;

      if (payloadPreview) {
        logAssistantFinalizationEvent("assistant_canonical_create_started", buildAssistantFinalizationMeta({
          feature: "project_wizard",
          phase: "creating",
          turn: assistantState.turn || 0,
          provider,
          outputFormat: FINAL_OUTPUT_KIND.canonicalPayload,
          payload: payloadPreview,
        }));
        const result = await createProjectFromCanonicalPayload(payloadPreview, sb);
        project = result.project;
        logAssistantFinalizationEvent("assistant_canonical_create_succeeded", buildAssistantFinalizationMeta({
          feature: "project_wizard",
          phase: "created",
          turn: assistantState.turn || 0,
          provider,
          outputFormat: FINAL_OUTPUT_KIND.canonicalPayload,
          payload: payloadPreview,
        }));
      } else {
        let data;
        try {
          logAssistantFinalizationEvent("assistant_edge_call_started", buildAssistantFinalizationMeta({
            feature: "project_wizard",
            phase: WIZARD_CREATION_STATUS.creating,
            turn: assistantState.turn || 0,
            provider,
            outputFormat: FINAL_OUTPUT_KIND.sql,
            sql: sqlPreview,
          }));
          data = await executeProjectSQL(sqlPreview);
          logAssistantFinalizationEvent("assistant_edge_response_received", buildAssistantFinalizationMeta({
            feature: "project_wizard",
            phase: WIZARD_CREATION_STATUS.creating,
            turn: assistantState.turn || 0,
            provider,
            outputFormat: FINAL_OUTPUT_KIND.sql,
            sql: sqlPreview,
            edgeStatus: data.status,
          }));
        } catch (firstError) {
          logAssistantFinalizationEvent("assistant_edge_response_error", buildAssistantFinalizationMeta({
            feature: "project_wizard",
            phase: WIZARD_CREATION_STATUS.creating,
            turn: assistantState.turn || 0,
            provider,
            outputFormat: FINAL_OUTPUT_KIND.sql,
            sql: sqlPreview,
            edgeStatus: firstError.edgeStatus || null,
            edgeError: firstError.edgeError || firstError.message,
          }));
          const system = await buildONASystemPrompt({rapport});
          const repairPrompt = {
            role: "user",
            content: `Le SQL precedent a echoue a l'execution avec cette erreur PostgreSQL :
${firstError.message}

Corrige le SQL pour respecter STRICTEMENT le schema ONA.
Renvoie uniquement un bloc \`\`\`sql ... \`\`\` complet et corrige.`,
          };
          const repairReply = await callLLM([...buildWizardConversation(reportMessage, decisionSteps), repairPrompt], system, provider, apiKey, {
            feature: "project_wizard",
            phase: "sql_repair",
            turn: buildWizardConversation(reportMessage, decisionSteps).filter((message) => message.role === "user").length + 1,
          });
          const repairedSQL = extractSQL(repairReply);
          if (!repairedSQL) throw firstError;
          setSqlPreview(repairedSQL);
          updateAssistantState({
            phase: "review",
            final_output: {
              kind: FINAL_OUTPUT_KIND.sql,
              content: repairedSQL,
            },
            final_sql: repairedSQL,
            creation_status: WIZARD_CREATION_STATUS.ready_to_create,
            ready_to_generate: true,
          });
          logAssistantFinalizationEvent("assistant_final_output_detected", buildAssistantFinalizationMeta({
            feature: "project_wizard",
            phase: "sql_repair",
            turn: assistantState.turn || 0,
            provider,
            outputFormat: FINAL_OUTPUT_KIND.sql,
            reply: repairReply,
            sql: repairedSQL,
          }));
          logAssistantFinalizationEvent("assistant_final_sql_detected", buildAssistantFinalizationMeta({
            feature: "project_wizard",
            phase: "sql_repair",
            turn: assistantState.turn || 0,
            provider,
            outputFormat: FINAL_OUTPUT_KIND.sql,
            reply: repairReply,
            sql: repairedSQL,
          }));
          logAssistantFinalizationEvent("assistant_preview_ready", buildAssistantFinalizationMeta({
            feature: "project_wizard",
            phase: "review",
            turn: assistantState.turn || 0,
            provider,
            outputFormat: FINAL_OUTPUT_KIND.sql,
            reply: repairReply,
            sql: repairedSQL,
          }));
          logAssistantFinalizationEvent("assistant_sql_preview_ready", buildAssistantFinalizationMeta({
            feature: "project_wizard",
            phase: "review",
            turn: assistantState.turn || 0,
            provider,
            outputFormat: FINAL_OUTPUT_KIND.sql,
            reply: repairReply,
            sql: repairedSQL,
          }));
          logAssistantFinalizationEvent("assistant_edge_call_started", buildAssistantFinalizationMeta({
            feature: "project_wizard",
            phase: WIZARD_CREATION_STATUS.creating,
            turn: assistantState.turn || 0,
            provider,
            outputFormat: FINAL_OUTPUT_KIND.sql,
            sql: repairedSQL,
          }));
          data = await executeProjectSQL(repairedSQL);
          logAssistantFinalizationEvent("assistant_edge_response_received", buildAssistantFinalizationMeta({
            feature: "project_wizard",
            phase: WIZARD_CREATION_STATUS.creating,
            turn: assistantState.turn || 0,
            provider,
            outputFormat: FINAL_OUTPUT_KIND.sql,
            sql: repairedSQL,
            edgeStatus: data.status,
          }));
        }

        project = shapeCreatedProject(data.data.projet);
      }

      if (!project) throw new Error("Projet cree mais payload incomplet.");
      updateAssistantState({
        phase: "created",
        creation_status: WIZARD_CREATION_STATUS.created,
        ready_to_generate: false,
      });
      try {
        localStorage.removeItem(WIZARD_ASSISTANT_STORAGE_KEY);
      } catch (_) {}
      onCreated(project);
    } catch (e) {
      setError(e.message);
      logAssistantFinalizationEvent("assistant_canonical_create_error", buildAssistantFinalizationMeta({
        feature: "project_wizard",
        phase: "creation_error",
        turn: assistantState.turn || 0,
        provider,
        outputFormat: payloadPreview ? FINAL_OUTPUT_KIND.canonicalPayload : FINAL_OUTPUT_KIND.sql,
        payload: payloadPreview,
        sql: sqlPreview,
        edgeError: e.message,
      }));
      if (!payloadPreview) {
        logAssistantFinalizationEvent("assistant_edge_response_error", buildAssistantFinalizationMeta({
          feature: "project_wizard",
          phase: WIZARD_CREATION_STATUS.creation_error,
          turn: assistantState.turn || 0,
          provider,
          outputFormat: FINAL_OUTPUT_KIND.sql,
          sql: sqlPreview,
          edgeStatus: e.edgeStatus || null,
          edgeError: e.edgeError || e.message,
        }));
      }
      updateAssistantState({
        phase: "creation_error",
        creation_status: WIZARD_CREATION_STATUS.creation_error,
        ready_to_generate: true,
      });
      setCreating(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!clientNom.trim()) {
      setError("Le nom du client est requis.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const proj = await createProject({clientNom, adresse, tva, dateVisite, validite});
      onCreated(proj);
    } catch (e) {
      setError(`Erreur : ${e.message}`);
      setLoading(false);
    }
  };

  return (
    <Modal title={header.title} sub={header.sub} onClose={onClose} maxWidth={580}>
      <div data-testid="new-project-modal" style={{padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14}}>
        {mode === "manual" && (
          <div style={{display: "flex", flexDirection: "column", gap: 14}}>
            <div>
              <label style={lbl}>Nom du client *</label>
              <input
                data-testid="manual-client-name-input"
                autoFocus
                value={clientNom}
                onChange={(e) => setClientNom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                placeholder="ex : Emeline Dupont"
                style={inp}
              />
            </div>

            <div>
              <label style={lbl}>Adresse du bien</label>
              <input
                data-testid="manual-address-input"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="ex : Rue de la Paix 12, 1000 Bruxelles"
                style={inp}
              />
            </div>

            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10}}>
              <div>
                <label style={lbl}>TVA %</label>
                <select data-testid="manual-tva-select" value={tva} onChange={(e) => setTva(Number(e.target.value))} style={{...inp, paddingRight: 24}}>
                  <option value={6}>6%</option>
                  <option value={21}>21%</option>
                </select>
              </div>

              <div>
                <label style={lbl}>Date visite</label>
                <input data-testid="manual-date-input" type="date" value={dateVisite} onChange={(e) => setDateVisite(e.target.value)} style={inp} />
              </div>

              <div>
                <label style={lbl}>Validite (j)</label>
                <input
                  data-testid="manual-validite-input"
                  type="number"
                  value={validite}
                  min={1}
                  max={365}
                  onChange={(e) => setValidite(Number(e.target.value))}
                  style={{...inp, textAlign: "right"}}
                />
              </div>
            </div>
          </div>
        )}

        {mode === "ai" && step === "config" && (
          <div style={{display: "flex", flexDirection: "column", gap: 16}}>
            <div>
              <label style={lbl}>Assistant IA</label>
              <div style={{display: "flex", flexDirection: "column", gap: 6}}>
                {Object.entries(PROVIDER_LABELS).map(([key, label]) => (
                  <label
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      border: `1px solid ${provider === key ? "var(--btx)" : "var(--bd3)"}`,
                      borderRadius: 8,
                      cursor: "pointer",
                      background: provider === key ? "var(--bbg)" : "var(--sf)",
                    }}
                  >
                    <input
                      data-testid={`provider-${key}`}
                      type="radio"
                      name="provider"
                      value={key}
                      checked={provider === key}
                      onChange={() => {
                        setProvider(key);
                        setApiKey(localStorage.getItem(`ona_api_key_${key}`) || "");
                      }}
                      style={{accentColor: "var(--btx)"}}
                    />
                    <span style={{fontSize: 13, fontWeight: provider === key ? 600 : 400, color: provider === key ? "var(--btx)" : "var(--tx)"}}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={lbl}>
                Cle API
                <a href={PROVIDER_LINKS[provider]} target="_blank" rel="noreferrer" style={{color: "var(--btx)", textDecoration: "none", fontWeight: 400, marginLeft: 6}}>
                  → Obtenir une cle
                </a>
              </label>
              <input data-testid="assistant-api-key-input" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." style={inp} />
            </div>

            <label style={{display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--tx2)", cursor: "pointer"}}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{accentColor: "var(--btx)"}} />
              Memoriser la cle dans ce navigateur
            </label>
          </div>
        )}

        {mode === "ai" && step === "rapport" && (
          <textarea
            data-testid="wizard-rapport-input"
            value={rapport}
            onChange={(e) => setRapport(e.target.value)}
            placeholder="Colle ici le rapport de visite complet..."
            style={{
              width: "100%",
              minHeight: 220,
              padding: "12px",
              fontSize: 13,
              fontFamily: "var(--font-sans)",
              color: "var(--tx)",
              background: "var(--sf2)",
              border: "1px solid var(--bd3)",
              borderRadius: 8,
              resize: "vertical",
              lineHeight: 1.6,
            }}
          />
        )}

        {mode === "ai" && step === "chat" && (
          <div style={{display: "flex", flexDirection: "column", gap: 12}}>
            {currentQuestion && (
              <div style={{padding: "12px 14px", borderRadius: 10, background: "var(--sf2)", border: "1px solid var(--bd3)"}}>
                <div style={{fontSize: 11, color: "var(--tx3)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6}}>
                  Decision chantier {currentDecisionIndex + 1}
                </div>
                <div style={{fontSize: 14, fontWeight: 700, color: "var(--tx)"}}>{currentQuestion.prompt}</div>
                {currentQuestion.recommended && (
                  <div style={{marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, background: "var(--gbg)", border: "1px solid var(--gbd)", color: "var(--gtx)", fontSize: 12, fontWeight: 600}}>
                    Recommande : {currentQuestion.recommended}
                  </div>
                )}
              </div>
            )}

            <div style={{display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto"}}>
              {visibleMessages.slice(1).map((message, index) => (
                <div key={index} style={{display: "flex", justifyContent: message.role === "user" ? "flex-end" : "flex-start"}}>
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      fontSize: 13,
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      background: message.role === "user" ? "var(--bbg)" : "var(--sf2)",
                      color: message.role === "user" ? "var(--btx)" : "var(--tx)",
                      border: `1px solid ${message.role === "user" ? "var(--bbd)" : "var(--bd3)"}`,
                    }}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{display: "flex", justifyContent: "flex-start"}}>
                  <div style={{padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "var(--sf2)", border: "1px solid var(--bd3)", color: "var(--tx3)"}}>
                    Analyse...
                  </div>
                </div>
              )}
            </div>

            {quickChoices.length > 0 && !hasFinalPreview && (
              <div style={{display: "flex", flexDirection: "column", gap: 8}}>
                {quickChoices.map((choice, index) => {
                  const label = choice.label || choice;
                  const checked = selectedChoices.includes(label);
                  return (
                    <label
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: `1px solid ${checked ? "var(--btx)" : "var(--bd3)"}`,
                        background: checked ? "var(--bbg)" : "var(--sf)",
                        cursor: loading ? "default" : "pointer",
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      <input
                        data-testid={`assistant-choice-${index}`}
                        type={currentQuestion?.type === "multiple" ? "checkbox" : "radio"}
                        name={`wizard-question-${currentDecisionIndex}`}
                        checked={checked}
                        onChange={() => toggleChoice(label)}
                        disabled={loading || dontKnow}
                        style={{marginTop: 2, accentColor: "var(--btx)"}}
                      />
                      <div style={{display: "flex", flexDirection: "column", gap: 4}}>
                        <span style={{fontSize: 13, color: "var(--tx)", fontWeight: checked ? 600 : 500}}>{label}</span>
                        {currentQuestion?.recommended === label && (
                          <span style={{fontSize: 11, color: "var(--gtx)", fontWeight: 600}}>Option recommandee</span>
                        )}
                      </div>
                    </label>
                  );
                })}

                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid ${dontKnow ? "var(--otx)" : "var(--bd3)"}`,
                    background: dontKnow ? "var(--obg)" : "var(--sf)",
                    cursor: loading ? "default" : "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  <input
                    data-testid="assistant-unknown-option"
                    type="checkbox"
                    checked={dontKnow}
                    onChange={() => {
                      const next = !dontKnow;
                      setDontKnow(next);
                      if (next) setSelectedChoices([]);
                    }}
                    disabled={loading}
                    style={{marginTop: 2, accentColor: "var(--otx)"}}
                  />
                  <div style={{display: "flex", flexDirection: "column", gap: 4}}>
                    <span style={{fontSize: 13, color: "var(--tx)", fontWeight: dontKnow ? 600 : 500}}>Je ne sais pas</span>
                    <span style={{fontSize: 11, color: "var(--tx3)"}}>
                      Le wizard continue avec l'hypothese recommandee ou en suspens si ce point n'est pas bloquant.
                    </span>
                  </div>
                </label>
              </div>
            )}

            {!hasFinalPreview && (
              <>
                <input
                  data-testid="assistant-free-text-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Autre / precision (facultatif)"
                  disabled={loading}
                  style={{...inp}}
                />
                <div style={{display: "flex", justifyContent: "space-between", gap: 8}}>
                  <button
                    data-testid="assistant-back-button"
                    onClick={() => setCurrentDecisionIndex((current) => Math.max(0, current - 1))}
                    disabled={loading || currentDecisionIndex === 0}
                    style={{
                      padding: "0 16px",
                      height: 34,
                      fontSize: 13,
                      fontWeight: 600,
                      border: "1px solid var(--bd3)",
                      borderRadius: 6,
                      background: "var(--sf)",
                      color: "var(--tx2)",
                      cursor: loading || currentDecisionIndex === 0 ? "default" : "pointer",
                      opacity: loading || currentDecisionIndex === 0 ? 0.5 : 1,
                    }}
                  >
                    ← Retour
                  </button>
                  <button
                    data-testid="assistant-next-button"
                    onClick={() => sendMessage()}
                    disabled={loading || (!input.trim() && selectedChoices.length === 0 && !dontKnow)}
                    style={{
                      padding: "0 16px",
                      height: 34,
                      fontSize: 13,
                      fontWeight: 600,
                      border: "none",
                      borderRadius: 6,
                      background: "var(--btx)",
                      color: "#fff",
                      cursor: loading ? "default" : "pointer",
                      opacity: loading || (!input.trim() && selectedChoices.length === 0 && !dontKnow) ? 0.5 : 1,
                    }}
                  >
                    {currentDecisionIndex < decisionSteps.length - 1 ? "Recalculer la suite" : "Suivant"}
                  </button>
                </div>
              </>
            )}

            {hasFinalPreview && !loading && (
              <div style={{padding: "12px 14px", borderRadius: 10, background: "var(--gbg)", border: "1px solid var(--gbd)", color: "var(--gtx)", fontSize: 13}}>
                {payloadPreview
                  ? "Le payload canonique est pret. Tu peux lancer la creation du projet."
                  : "Le dossier est pret. Tu peux lancer la creation du projet."}
              </div>
            )}
          </div>
        )}

        {error && <div style={{fontSize: 12, color: "var(--rtx)", padding: "8px 12px", background: "var(--rbg)", borderRadius: 6}}>{error}</div>}

        {import.meta.env.DEV && (
          <details style={{fontSize: 11, color: "var(--tx2)", background: "var(--sf2)", border: "1px solid var(--bd3)", borderRadius: 8, padding: "10px 12px"}}>
            <summary style={{cursor: "pointer", fontWeight: 600}}>assistant_state debug</summary>
            <pre style={{margin: "10px 0 0", whiteSpace: "pre-wrap"}}>{JSON.stringify(assistantState, null, 2)}</pre>
          </details>
        )}
      </div>

      <div style={{display: "flex", gap: 8, padding: "12px 20px 18px", justifyContent: "space-between", borderTop: "1px solid var(--bd)"}}>
        <button
          onClick={() => {
            setMode((current) => (current === "ai" ? "manual" : "ai"));
            setStep("config");
            setError("");
            setPayloadPreview(null);
            setSqlPreview("");
          }}
          style={{
            padding: "8px 16px",
            fontSize: 12,
            border: "1px solid var(--bd3)",
            borderRadius: 7,
            background: "var(--sf)",
            color: "var(--tx2)",
            cursor: "pointer",
          }}
        >
          {mode === "ai" ? "Mode manuel" : "Retour IA"}
        </button>

        <div style={{display: "flex", gap: 8}}>
          {mode === "ai" && step === "config" && (
            <>
              <button
                onClick={onClose}
                style={{padding: "8px 16px", fontSize: 13, border: "1px solid var(--bd3)", borderRadius: 7, background: "var(--sf)", color: "var(--tx2)", cursor: "pointer"}}
              >
                Annuler
              </button>
              <button
                onClick={() => setStep("rapport")}
                disabled={!apiKey.trim()}
                style={{
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 7,
                  background: apiKey.trim() ? "var(--btx)" : "var(--bd)",
                  color: apiKey.trim() ? "#fff" : "var(--tx3)",
                  cursor: apiKey.trim() ? "pointer" : "default",
                }}
              >
                Suivant →
              </button>
            </>
          )}

          {mode === "ai" && step === "rapport" && (
            <>
              <button
                onClick={() => setStep("config")}
                style={{padding: "8px 16px", fontSize: 13, border: "1px solid var(--bd3)", borderRadius: 7, background: "var(--sf)", color: "var(--tx2)", cursor: "pointer"}}
              >
                ← Retour
              </button>
              <button
                onClick={analyzeRapport}
                disabled={!rapport.trim() || loading}
                style={{
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 7,
                  background: rapport.trim() && !loading ? "var(--btx)" : "var(--bd)",
                  color: rapport.trim() && !loading ? "#fff" : "var(--tx3)",
                  cursor: rapport.trim() && !loading ? "pointer" : "default",
                }}
              >
                {loading ? "Analyse..." : "Analyser →"}
              </button>
            </>
          )}

          {mode === "ai" && step === "chat" && (
            <>
              <button
                onClick={onClose}
                style={{padding: "8px 16px", fontSize: 13, border: "1px solid var(--bd3)", borderRadius: 7, background: "var(--sf)", color: "var(--tx2)", cursor: "pointer"}}
              >
                Annuler
              </button>
              {hasFinalPreview && (
                <button
                  data-testid="assistant-create-project-button"
                  onClick={createProjectAI}
                  disabled={creating}
                  style={{
                    padding: "8px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    border: "none",
                    borderRadius: 7,
                    background: creating ? "var(--bd)" : "var(--gtx)",
                    color: creating ? "var(--tx3)" : "#fff",
                    cursor: creating ? "default" : "pointer",
                  }}
                >
                  {creating ? "Creation..." : "Creer le projet"}
                </button>
              )}
            </>
          )}

          {mode === "manual" && (
            <>
              <button
                onClick={onClose}
                style={{padding: "8px 16px", fontSize: 13, border: "1px solid var(--bd3)", borderRadius: 7, background: "var(--sf)", color: "var(--tx2)", cursor: "pointer"}}
              >
                Annuler
              </button>
              <button
                data-testid="manual-create-project-button"
                onClick={handleManualSubmit}
                disabled={loading}
                style={{
                  padding: "8px 20px",
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 7,
                  background: loading ? "var(--bd)" : "var(--btx)",
                  color: loading ? "var(--tx3)" : "#fff",
                  cursor: loading ? "default" : "pointer",
                }}
              >
                {loading ? "Creation..." : "Creer le projet"}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
