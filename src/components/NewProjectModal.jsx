import React, { useState } from "react";
import { createProject } from "../lib/projects.js";
import { Modal } from "./Modal.jsx";

export default function NewProjectModal({onClose, onCreated}) {
  const [clientNom, setClientNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [tva, setTva] = useState(6);
  const [dateVisite, setDateVisite] = useState(new Date().toISOString().slice(0, 10));
  const [validite, setValidite] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!clientNom.trim()) {
      setError("Le nom du client est requis.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const proj = await createProject({ clientNom, adresse, tva, dateVisite, validite });
      onCreated(proj);
    } catch (e) {
      setError(`Erreur : ${e.message}`);
      setLoading(false);
    }
  };

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

  return (
    <Modal
      title="✚ Nouveau projet"
      sub="Les lots et métiers se créent dans le builder"
      onClose={onClose}
      maxWidth={480}
    >
      <div style={{padding: "20px 20px 8px", display: "flex", flexDirection: "column", gap: 14}}>
        <div>
          <label style={lbl}>Nom du client *</label>
          <input
            autoFocus
            value={clientNom}
            onChange={(e) => setClientNom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="ex : Emeline Dupont"
            style={inp}
          />
        </div>

        <div>
          <label style={lbl}>Adresse du bien</label>
          <input
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            placeholder="ex : Rue de la Paix 12, 1000 Bruxelles"
            style={inp}
          />
        </div>

        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10}}>
          <div>
            <label style={lbl}>TVA %</label>
            <select value={tva} onChange={(e) => setTva(Number(e.target.value))} style={{...inp, paddingRight: 24}}>
              <option value={6}>6%</option>
              <option value={21}>21%</option>
            </select>
          </div>

          <div>
            <label style={lbl}>Date visite</label>
            <input type="date" value={dateVisite} onChange={(e) => setDateVisite(e.target.value)} style={inp} />
          </div>

          <div>
            <label style={lbl}>Validité (j)</label>
            <input
              type="number"
              value={validite}
              min={1}
              max={365}
              onChange={(e) => setValidite(Number(e.target.value))}
              style={{...inp, textAlign: "right"}}
            />
          </div>
        </div>

        {error && (
          <div style={{fontSize: 12, color: "var(--rtx)", padding: "8px 12px", background: "var(--rbg)", borderRadius: 6}}>
            {error}
          </div>
        )}
      </div>

      <div style={{display: "flex", gap: 8, padding: "12px 20px 18px", justifyContent: "flex-end"}}>
        <button
          onClick={onClose}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            border: "1px solid var(--bd3)",
            borderRadius: 7,
            background: "var(--sf)",
            color: "var(--tx2)",
            cursor: "pointer",
          }}
        >
          Annuler
        </button>
        <button
          onClick={handleSubmit}
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
          {loading ? "⏳ Création…" : "✚ Créer le projet"}
        </button>
      </div>
    </Modal>
  );
}
