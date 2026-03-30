import React, { useMemo, useState } from "react";
import { buildProjectAssistantSystem, callLLM } from "../lib/llm.js";

export default function ProjectChatPanel({PROJECT, onClose}) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Bonjour. Je peux t'aider a relire, questionner ou ajuster le devis de ${PROJECT.client}.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const provider = localStorage.getItem("ona_api_provider") || "mistral";
  const apiKey = localStorage.getItem(`ona_api_key_${provider}`) || "";
  const system = useMemo(() => buildProjectAssistantSystem(PROJECT), [PROJECT]);

  const send = async () => {
    if (!input.trim() || loading) return;

    const userMsg = {role: "user", content: input.trim()};
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");

    if (!apiKey) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: "Configure d'abord une cle API dans le wizard Nouveau projet pour utiliser l'assistant.",
        },
      ]);
      return;
    }

    setLoading(true);
    try {
      const reply = await callLLM(nextMessages.slice(1), system, provider, apiKey);
      setMessages([...nextMessages, {role: "assistant", content: reply}]);
    } catch (e) {
      setMessages([...nextMessages, {role: "assistant", content: `Erreur: ${e.message}`}]);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 360,
        maxWidth: "100vw",
        background: "var(--sf)",
        borderLeft: "1px solid var(--bd)",
        zIndex: 500,
        display: "flex",
        flexDirection: "column",
        boxShadow: "-8px 0 30px rgba(0,0,0,.15)",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--bd)",
          background: "var(--sf2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{fontSize: 13, fontWeight: 700}}>Assistant projet</div>
          <div style={{fontSize: 11, color: "var(--tx3)", marginTop: 1}}>
            {PROJECT.client} · {provider}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "1px solid var(--bd2)",
            borderRadius: 6,
            padding: "3px 9px",
            fontSize: 12,
            cursor: "pointer",
            color: "var(--tx2)",
          }}
        >
          ✕
        </button>
      </div>

      <div style={{flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 10}}>
        {messages.map((message, index) => (
          <div key={index} style={{display: "flex", justifyContent: message.role === "user" ? "flex-end" : "flex-start"}}>
            <div
              style={{
                maxWidth: "90%",
                padding: "9px 13px",
                borderRadius: 10,
                fontSize: 12,
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
            <div
              style={{
                padding: "9px 13px",
                borderRadius: 10,
                fontSize: 12,
                background: "var(--sf2)",
                border: "1px solid var(--bd3)",
                color: "var(--tx3)",
              }}
            >
              Analyse...
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          padding: "12px 14px",
          borderTop: "1px solid var(--bd)",
          display: "flex",
          gap: 8,
          flexShrink: 0,
          background: "var(--sf)",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Pose une question..."
          disabled={loading}
          style={{
            flex: 1,
            fontSize: 12,
            height: 32,
            padding: "0 10px",
            border: "1px solid var(--bd3)",
            borderRadius: 6,
            background: "var(--sf2)",
            color: "var(--tx)",
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            padding: "0 14px",
            height: 32,
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            borderRadius: 6,
            background: "var(--btx)",
            color: "#fff",
            cursor: loading ? "default" : "pointer",
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}
