import { sb } from "../supabase.js";

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

  logLLMDebug("response", {
    provider,
    phase: meta.phase || "unknown",
    feature: meta.feature || "unknown",
    turn: meta.turn || turns,
    messageCount: messages.length,
    promptChars,
    responseChars: estimateChars(parsed),
  });

  return parsed;
}

export async function buildONASystemPrompt() {
  const { data: tarifs, error } = await sb
    .from("mo_tarifs")
    .select("metier,prix_lo,prix_sug,prix_hi,tx_h_lo,tx_h_hi")
    .order("metier");

  if (error) throw error;

  const tarifStr = (tarifs || [])
    .map((tarif) =>
      `${tarif.metier}: ${tarif.prix_lo}/${tarif.prix_sug}/${tarif.prix_hi} €/j (${tarif.tx_h_lo}-${tarif.tx_h_hi} €/h)`
    )
    .join("\n");

  return `Tu es chef de chantier chez ONA Group SRL, entreprise de renovation a Bruxelles/Brabant, Belgique. Tous les prix sont HTVA.

TARIFS DE REFERENCE ONA 2026 (lo/sug/hi €/jour):
${tarifStr}

Tu poses UNE question a la fois. Chaque question propose des choix courts cliquables + une option "Autre / precision". Tu ne passes a la suite que quand l'utilisateur a repondu.

SCHEMA SQL A RESPECTER STRICTEMENT
Table bl_projects:
- id UUID PK
- client_nom TEXT NOT NULL
- adresse TEXT
- tva NUMERIC DEFAULT 6
- date_visite DATE
- validite INTEGER DEFAULT 30
- store_key TEXT UNIQUE
- statut TEXT DEFAULT 'draft'
- rapport_visite TEXT
- notes_internes TEXT

Table bl_lots:
- project_id, lot_key, title, meta, imprevu_pct, sequence, default_open, ordre

Table bl_metiers:
- lot_id, metier_key, name, icon, ordre

Table bl_mo_lines:
- metier_id, line_key, label, j_lo, j_sug, j_hi, tx_lo, tx_sug, tx_hi, ordre, nb_travailleurs

Table bl_mat_lines:
- metier_id, line_key, label, avec_unite, q_base, d_base, props, ordre

Table bl_suspens:
- project_id, texte, niveau, ordre

INTERDICTIONS CRITIQUES
- N'utilise JAMAIS les colonnes nom, client, ville, code_postal, pays, date_debut_prev, date_fin_prev, budget_htva
- Pour bl_projects utilise uniquement client_nom, adresse, tva, date_visite, validite, store_key, statut, rapport_visite, notes_internes
- bl_suspens.texte existe, pas txt
- bl_mat_lines.avec_unite existe, pas is_surface
- bl_lots.ordre existe, pas display_order
- bl_lots.sequence doit toujours etre rempli avec ARRAY[...]

Quand tu as toutes les infos, genere le SQL complet dans un bloc \`\`\`sql...\`\`\` en respectant cet ordre :
1. INSERT INTO bl_projects (...) VALUES (...) RETURNING id — store_key format: 'ona_bl_NOMVILLE2026'
2. Bloc DO $$ avec bl_lots (sequence ARRAY[...] OBLIGATOIRE), bl_metiers, bl_mo_lines, bl_mat_lines
3. INSERT INTO bl_suspens ... SEPAREMENT du bloc DO
4. SELECT refresh_projet_json('UUID')
5. La reponse finale ne contient QUE le bloc SQL, sans explication autour, si et seulement si toutes les infos sont reunies`;
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

  return `Tu es l'assistant chantier ONA pour le projet ${project?.client || "sans nom"} a ${project?.adresse || "adresse inconnue"}. Tous les prix sont HTVA.
Tu reponds en francais, de facon concise, utile et concrete.
Tu peux expliquer le chiffrage, relever des oublis, suggérer des ajustements et proposer des pistes d'optimisation.
Tu ne generes pas de SQL ici. Tu analyses et conseilles a partir du devis courant.

DEVIS ACTUEL (JSON) :
${JSON.stringify(slimProject, null, 2)}`;
}

export function extractSQL(text) {
  const match = text?.match(/```sql\s*([\s\S]+?)```/i);
  return match ? match[1].trim() : null;
}
