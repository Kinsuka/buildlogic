import { describe, expect, it } from "vitest";
import {
  ASSISTANT_STATE_VERSION,
  createEmptyAssistantState,
  mergeAssistantState,
  normalizeAssistantState,
} from "./assistantState.js";

describe("assistantState", () => {
  it("createEmptyAssistantState(flow) creates the expected empty shape", () => {
    const state = createEmptyAssistantState("new_project_wizard");

    expect(state.version).toBe(ASSISTANT_STATE_VERSION);
    expect(state.flow).toBe("new_project_wizard");
    expect(state.phase).toBe("idle");
    expect(state.turn).toBe(0);
    expect(state.project_type).toBeNull();
    expect(state.summary).toBe("");
    expect(state.known_facts).toEqual({});
    expect(state.missing_fields).toEqual([]);
    expect(state.assumptions).toEqual([]);
    expect(state.suspens).toEqual([]);
    expect(state.lots_draft).toEqual([]);
    expect(state.metiers_draft).toEqual([]);
    expect(state.last_question).toBeNull();
    expect(state.last_user_answer).toBeNull();
    expect(state.final_output).toBeNull();
    expect(state.final_sql).toBe("");
    expect(state.creation_status).toBe("clarification");
    expect(state.confidence).toBe("low");
    expect(state.ready_to_generate).toBe(false);
    expect(typeof state.updated_at).toBe("string");
  });

  it("normalizeAssistantState(input) fills missing fields on a partial state", () => {
    const state = normalizeAssistantState({
      flow: "project_chat",
      turn: 2,
      last_user_answer: "Ajoute un WC suspendu",
    });

    expect(state.flow).toBe("project_chat");
    expect(state.turn).toBe(2);
    expect(state.last_user_answer).toBe("Ajoute un WC suspendu");
    expect(state.phase).toBe("idle");
    expect(state.known_facts).toEqual({});
    expect(state.missing_fields).toEqual([]);
    expect(state.final_output).toBeNull();
    expect(state.final_sql).toBe("");
    expect(state.creation_status).toBe("clarification");
    expect(state.ready_to_generate).toBe(false);
  });

  it("normalizeAssistantState(input) sanitizes invalid and null fields", () => {
    const state = normalizeAssistantState({
      version: "abc",
      flow: null,
      phase: 42,
      turn: "2",
      summary: 99,
      known_facts: [],
      missing_fields: "oops",
      assumptions: null,
      suspens: {},
      lots_draft: "bad",
      metiers_draft: false,
      confidence: null,
      ready_to_generate: "yes",
      updated_at: 10,
    }, "new_project_wizard");

    expect(state.version).toBe(ASSISTANT_STATE_VERSION);
    expect(state.flow).toBe("new_project_wizard");
    expect(state.phase).toBe("idle");
    expect(state.turn).toBe(0);
    expect(state.summary).toBe("");
    expect(state.known_facts).toEqual({});
    expect(state.missing_fields).toEqual([]);
    expect(state.assumptions).toEqual([]);
    expect(state.suspens).toEqual([]);
    expect(state.lots_draft).toEqual([]);
    expect(state.metiers_draft).toEqual([]);
    expect(state.final_output).toBeNull();
    expect(state.final_sql).toBe("");
    expect(state.creation_status).toBe("clarification");
    expect(state.confidence).toBe("low");
    expect(state.ready_to_generate).toBe(false);
    expect(typeof state.updated_at).toBe("string");
  });

  it("mergeAssistantState(prev, patch) applies a simple merge", () => {
    const prev = createEmptyAssistantState("new_project_wizard");
    const next = mergeAssistantState(prev, {
      phase: "chat",
      turn: 1,
      last_user_answer: "Maison 3 facades",
      last_question: "Quel niveau de finition ?",
      creation_status: "clarification",
    });

    expect(next.flow).toBe("new_project_wizard");
    expect(next.phase).toBe("chat");
    expect(next.turn).toBe(1);
    expect(next.last_user_answer).toBe("Maison 3 facades");
    expect(next.last_question).toBe("Quel niveau de finition ?");
    expect(next.creation_status).toBe("clarification");
    expect(next.ready_to_generate).toBe(false);
  });

  it("keeps final output separate from last_question and last_user_answer", () => {
    const next = mergeAssistantState(createEmptyAssistantState("new_project_wizard"), {
      last_user_answer: "Choix retenu: Standard",
      last_question: "Quel niveau de finition faut-il retenir ?",
      final_output: {
        kind: "canonical_payload",
        content: {
          version: "v1",
          project: { client_nom: "Projet Test" },
        },
      },
      final_sql: "INSERT INTO bl_projects ...",
      creation_status: "ready_to_create",
      ready_to_generate: true,
    });

    expect(next.last_user_answer).toBe("Choix retenu: Standard");
    expect(next.last_question).toBe("Quel niveau de finition faut-il retenir ?");
    expect(next.final_output).toEqual({
      kind: "canonical_payload",
      content: {
        version: "v1",
        project: { client_nom: "Projet Test" },
      },
    });
    expect(next.final_sql).toContain("INSERT INTO bl_projects");
    expect(next.creation_status).toBe("ready_to_create");
    expect(next.ready_to_generate).toBe(true);
  });

  it("mergeAssistantState(prev, patch) merges nested known_facts without dropping previous keys", () => {
    const prev = normalizeAssistantState({
      flow: "new_project_wizard",
      known_facts: {
        city: "Bruxelles",
        type_bien: "maison",
      },
    });

    const next = mergeAssistantState(prev, {
      known_facts: {
        surface: "120",
      },
    });

    expect(next.known_facts).toEqual({
      city: "Bruxelles",
      type_bien: "maison",
      surface: "120",
    });
  });

  it("mergeAssistantState(prev, patch) preserves arrays unless explicitly replaced", () => {
    const prev = normalizeAssistantState({
      flow: "project_chat",
      missing_fields: ["surface", "finition"],
      assumptions: ["TVA 6%"],
    });

    const next = mergeAssistantState(prev, {
      phase: "advice",
    });

    expect(next.missing_fields).toEqual(["surface", "finition"]);
    expect(next.assumptions).toEqual(["TVA 6%"]);
  });

  it("supports a stable stringify/parse round-trip followed by normalize", () => {
    const initial = mergeAssistantState(createEmptyAssistantState("project_chat"), {
      phase: "advice",
      turn: 2,
      known_facts: {lot: "sdb"},
      missing_fields: ["ventilation"],
      last_user_answer: "Ajoute une douche italienne",
      last_question: "Veux-tu aussi revoir le receveur ?",
      updated_at: "2026-03-30T10:00:00.000Z",
    });

    const roundTrip = normalizeAssistantState(JSON.parse(JSON.stringify(initial)));

    expect(roundTrip).toEqual(initial);
  });
});
