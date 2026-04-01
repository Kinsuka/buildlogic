import { sb } from "../supabase.js";
import { normalizeBelgianTerminology } from "./assistantBelgium.js";
import {
  buildAssistantReferenceContext,
  formatAssistantReferenceContext,
} from "./assistantReferenceContext.js";
import {
  buildAssistantCommitteeFramework,
  buildProjectChatPolicyBlock,
  buildWizardQuestioningPolicyBlock,
} from "./assistantFramework.js";
import {
  buildProjectReviewContext,
  buildWizardReviewContext,
} from "./assistantReviewSynthesis.js";

function estimateChars(value) {
  if (!value) return 0;
  if (typeof value === "string") return value.length;
  try {
    return JSON.stringify(value).length;
  } catch (_) {
    return 0;
  }
}

function countTurns(messages) {
  return (messages || []).filter((message) => message?.role === "user").length;
}

function extractFencedBlock(text, language) {
  const match = text?.match(new RegExp(`\`\`\`${language}\\s*([\\s\\S]+?)\`\`\``, "i"));
  return match ? match[1].trim() : null;
}

function logLLMDebug(stage, payload) {
  if (!import.meta.env.DEV) return;

  const stamp = new Date().toISOString();
  const entry = {stamp, stage, ...payload};

  window.__ONA_AI_DEBUG__ = window.__ONA_AI_DEBUG__ || [];
  window.__ONA_AI_DEBUG__.push(entry);

  const label = `[ONA_AI] ${payload.phase || "unknown"} · ${stage}`;
  console.groupCollapsed(label);
  Object.entries(entry).forEach(([key, value]) => {
    console.log(`${key}:`, value);
  });
  console.groupEnd();
}

export const LLM_CONFIG = {
  claude: {
    url: "https://api.anthropic.com/v1/messages",
    headers: (apiKey) => ({
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    }),
    buildBody: (messages, system) => ({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system,
      messages,
    }),
    parse: (data) => data?.content?.[0]?.text || "",
  },
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    headers: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    buildBody: (messages, system) => ({
      model: "gpt-4o",
      max_tokens: 4096,
      messages: [{role: "system", content: system}, ...messages],
    }),
    parse: (data) => data?.choices?.[0]?.message?.content || "",
  },
  mistral: {
    url: "https://api.mistral.ai/v1/chat/completions",
    headers: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    buildBody: (messages, system) => ({
      model: "mistral-small-latest",
      max_tokens: 4096,
      messages: [{role: "system", content: system}, ...messages],
    }),
    parse: (data) => data?.choices?.[0]?.message?.content || "",
  },
};

export async function callLLM(messages, system, provider, apiKey, meta = {}) {
  const config = LLM_CONFIG[provider];
  if (!config) throw new Error(`Provider inconnu: ${provider}`);
  if (!apiKey?.trim()) throw new Error("Clé API manquante.");

  const requestPayload = config.buildBody(messages, system);
  const promptChars = estimateChars(system) + estimateChars(messages);
  const payloadChars = estimateChars(requestPayload);
  const turns = countTurns(messages);

  logLLMDebug("request", {
    provider,
    phase: meta.phase || "unknown",
    feature: meta.feature || "unknown",
    turn: meta.turn || turns,
    messageCount: messages.length,
    systemChars: estimateChars(system),
    promptChars,
    payloadChars,
  });

  const res = await fetch(config.url, {
    method: "POST",
    headers: config.headers(apiKey),
    body: JSON.stringify(requestPayload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    logLLMDebug("error", {
      provider,
      phase: meta.phase || "unknown",
      feature: meta.feature || "unknown",
      turn: meta.turn || turns,
      messageCount: messages.length,
      promptChars,
      status: res.status,
      error: err.error?.message || err.message || `HTTP ${res.status}`,
    });
    throw new Error(err.error?.message || err.message || `HTTP ${res.status}`);
  }

  const parsed = config.parse(await res.json());
  const hasSqlOutput = Boolean(extractSQL(parsed));
  const hasCanonicalPayload = Boolean(extractCanonicalPayload(parsed));
  const response =
    (meta.feature === "project_wizard" || meta.feature === "project_chat") && !hasSqlOutput && !hasCanonicalPayload
      ? normalizeBelgianTerminology(parsed)
      : parsed;

  logLLMDebug("response", {
    provider,
    phase: meta.phase || "unknown",
    feature: meta.feature || "unknown",
    turn: meta.turn || turns,
    messageCount: messages.length,
    promptChars,
    responseChars: estimateChars(response),
  });

  return response;
}

export function buildONASystemPromptFromData(options = {}) {
  const {
    rapport = "",
    tarifs = [],
    rendements = [],
    materiaux = [],
    postesSystematiques = [],
  } = options;
  const reviewContext = rapport ? `\n\n${buildWizardReviewContext(rapport)}` : "";
  const referenceContext = buildAssistantReferenceContext({
    tarifs,
    rendements,
    materiaux,
    postesSystematiques,
  });
  const referenceBlock = formatAssistantReferenceContext(referenceContext);

  return `Tu es le chef de chantier central chez ONA Group SRL, entreprise de renovation a Bruxelles/Brabant, Belgique. Tous les prix sont HTVA.

${buildAssistantCommitteeFramework()}

${buildWizardQuestioningPolicyBlock()}
${reviewContext}

${referenceBlock}

Tu poses UNE question a la fois. Chaque question propose des choix courts cliquables + une option "Autre / precision". Tu ne passes a la suite que quand l'utilisateur a repondu.
Tu privilegies les questions chantier et budget. Hors nom et adresse si absents, tu ne perds pas de tours sur des details administratifs non utiles.
Quand l'utilisateur repond "Je ne sais pas", tu ne bloques pas : tu proposes l'hypothese recommandee la plus credible ou tu bascules le point en suspens si ce n'est pas bloquant.

CONTRAT DE SORTIE CANONIQUE A RESPECTER STRICTEMENT
Tu ne generes ni SQL ni UUID si tu peux produire le payload canonique.

Structure finale attendue :
{
  "version": "v1",
  "project": {
    "client_nom": "...",
    "adresse": "...",
    "tva": 6,
    "date_visite": "YYYY-MM-DD",
    "validite": 30,
    "store_key": "",
    "statut": "draft",
    "rapport_visite": "...",
    "notes_internes": "..."
  },
  "suspens": [
    {"texte": "...", "niveau": "orange", "ordre": 1}
  ],
  "lots": [
    {
      "lot_key": "lot_<slug>",
      "title": "...",
      "meta": "...",
      "imprevu_pct": 10,
      "sequence": ["plomberie", "carrelage"],
      "default_open": true,
      "ordre": 1,
      "metiers": [
        {
          "metier_key": "plomberie",
          "name": "Plombier",
          "icon": "🔧",
          "ordre": 1,
          "mo_lines": [],
          "mat_lines": []
        }
      ]
    }
  ]
}

INTERDICTIONS CRITIQUES
- N'utilise JAMAIS les colonnes nom, client, ville, code_postal, pays, date_debut_prev, date_fin_prev, budget_htva
- project.statut vaut toujours "draft"
- project.tva vaut uniquement 6 ou 21
- suspens.niveau vaut uniquement rouge, orange ou vert
- lot.sequence contient toujours des metier_key, jamais des labels metier
- bl_mat_lines.avec_unite correspond au champ canonique mat_lines[].avec_unite

Quand tu as toutes les infos, renvoie uniquement un bloc \`\`\`json ... \`\`\` contenant le payload canonique complet et rien d'autre.
Si vraiment tu n'y arrives pas, un bloc \`\`\`sql ... \`\`\` legacy reste tolere temporairement, mais le JSON canonique est la sortie attendue par priorite.`;
}

export async function buildONASystemPrompt(options = {}) {
  const { rapport = "" } = options;

  const [
    tarifsResult,
    rendementsResult,
    materiauxResult,
    postesSystematiquesResult,
  ] = await Promise.all([
    sb
      .from("mo_tarifs")
      .select("metier,icon,prix_lo,prix_sug,prix_hi,coeff_collectif,tx_h_lo,tx_h_hi,note")
      .order("metier"),
    sb
      .from("mo_rendements")
      .select("metier,prestation,unite,r_min,r_sug,r_max,coeff_complexite_reno,temps_fixe_j,ordre")
      .order("metier")
      .order("ordre"),
    sb
      .from("materiaux")
      .select("categorie,label,unite,prix_lo,prix_sug,prix_hi,note")
      .order("categorie")
      .order("label"),
    sb
      .from("postes_systematiques")
      .select("label,niveau,note")
      .order("niveau")
      .order("label"),
  ]);

  if (tarifsResult.error) throw tarifsResult.error;
  if (rendementsResult.error) throw rendementsResult.error;
  if (materiauxResult.error) throw materiauxResult.error;
  if (postesSystematiquesResult.error) throw postesSystematiquesResult.error;

  return buildONASystemPromptFromData({
    rapport,
    tarifs: tarifsResult.data || [],
    rendements: rendementsResult.data || [],
    materiaux: materiauxResult.data || [],
    postesSystematiques: postesSystematiquesResult.data || [],
  });
}

export function buildProjectAssistantSystem(project) {
  const slimProject = {
    client: project?.client,
    adresse: project?.adresse,
    lots: (project?.lots || []).map((lot) => ({
      title: lot.title,
      sequence: Array.isArray(lot.sequence) ? lot.sequence : [],
      metiers: (lot.metiers || []).map((metier) => ({
        name: metier.name,
        mo: metier.mo,
        mat: metier.mat,
      })),
    })),
    suspens: project?.suspens || [],
  };

  return `Tu es le chef de chantier central ONA pour le projet ${project?.client || "sans nom"} a ${project?.adresse || "adresse inconnue"}. Tous les prix sont HTVA.

${buildAssistantCommitteeFramework()}

${buildProjectChatPolicyBlock()}

${buildProjectReviewContext(project)}

Tu reponds en francais de chantier belge, de facon concise, utile et concrete.
Tu peux expliquer le chiffrage, relever des oublis, suggerer des ajustements et proposer des pistes d'optimisation.

DEVIS ACTUEL (JSON) :
${JSON.stringify(slimProject, null, 2)}`;
}

export function extractSQL(text) {
  return extractFencedBlock(text, "sql");
}

export function extractCanonicalPayload(text) {
  const jsonBlock = extractFencedBlock(text, "json");
  const candidate = jsonBlock || (String(text || "").trim().startsWith("{") ? String(text || "").trim() : null);
  if (!candidate) return null;

  try {
    return JSON.parse(candidate);
  } catch (_) {
    return null;
  }
}
