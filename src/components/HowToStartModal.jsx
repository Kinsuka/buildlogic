import React, { useState } from "react";
import { HOW_TO_FLOW_STEPS, HOW_TO_HIGHLIGHTS, HOW_TO_PROMPT } from "../lib/howToContent.js";
import { Modal } from "./Modal.jsx";

export default function HowToStartModal({onClose}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(HOW_TO_PROMPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const S = {
    step: { display: "flex", gap: 14, marginBottom: 20 },
    num: { width: 28, height: 28, borderRadius: "50%", background: "var(--btx)", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 },
    h: { fontSize: 13, fontWeight: 700, color: "var(--tx)", marginBottom: 4 },
    p: { fontSize: 12, color: "var(--tx2)", lineHeight: 1.7 },
    tag: { display: "inline-block", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 8, marginRight: 4, marginBottom: 3 },
  };

  return (
    <Modal
      title="🚀 Comment démarrer un nouveau devis"
      sub="Flow ONA — du rapport de visite au budget BuildLogic"
      onClose={onClose}
      maxWidth={680}
    >
      <div style={{padding: "24px 24px 8px"}}>
        <div style={{display: "flex", alignItems: "center", gap: 0, marginBottom: 28, overflowX: "auto", paddingBottom: 4}}>
          {HOW_TO_FLOW_STEPS.map((step, index) => (
            <div key={step.label} style={{display: "flex", alignItems: "center", flexShrink: 0}}>
              <div style={{textAlign: "center", minWidth: 72}}>
                <div style={{fontSize: 20, marginBottom: 3}}>{step.icon}</div>
                <div style={{fontSize: 10, color: "var(--tx3)", lineHeight: 1.3}}>{step.label}</div>
              </div>
              {index < HOW_TO_FLOW_STEPS.length - 1 && <div style={{color: "var(--tx4)", fontSize: 14, margin: "0 2px", paddingBottom: 14}}>→</div>}
            </div>
          ))}
        </div>

        <div style={S.step}>
          <div style={S.num}>1</div>
          <div>
            <div style={S.h}>Ton collègue envoie le rapport de visite</div>
            <div style={S.p}>Il peut être orienté <strong>pièce par pièce</strong> (SdB, cuisine, chambre) ou <strong>par prestation</strong> (électricité, plomberie, peinture) — les deux formats sont acceptés. WhatsApp, mail, notes — peu importe le format.</div>
          </div>
        </div>

        <div style={S.step}>
          <div style={S.num}>2</div>
          <div>
            <div style={S.h}>Ouvre une nouvelle conversation Claude</div>
            <div style={S.p}>Copie le prompt "Chef de chantier ONA" ci-dessous, colle-le comme premier message, puis ajoute le rapport de visite.</div>
            <div style={{marginTop: 8, padding: "10px 14px", background: "var(--bbg)", borderRadius: 8, border: "1px solid var(--bbd)", fontSize: 12, color: "var(--btx)"}}>
              <strong>💡 Astuce :</strong> Commence ton message par :
              <br />
              <code style={{background: "rgba(0,0,0,.06)", borderRadius: 4, padding: "1px 6px", fontFamily: "monospace"}}>
                "Voici le rapport de visite de [NOM CLIENT], [ADRESSE] :"
              </code>
            </div>
          </div>
        </div>

        <div style={S.step}>
          <div style={S.num}>3</div>
          <div>
            <div style={S.h}>Claude joue le rôle de chef de chantier</div>
            <div style={S.p}>Il analyse le rapport, <strong>détecte les oublis</strong> (membrane étanchéité, protection chantier, évacuation gravats…) et te pose des questions ciblées avec choix multiples pour compléter ce qui manque.</div>
            <div style={{display: "flex", flexWrap: "wrap", marginTop: 8, gap: 4}}>
              {HOW_TO_HIGHLIGHTS.map((tag) => (
                <span key={tag} style={{...S.tag, background: "var(--gbg)", color: "var(--gtx)"}}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={S.step}>
          <div style={S.num}>4</div>
          <div>
            <div style={S.h}>Tu valides la structure des lots</div>
            <div style={S.p}>Claude propose une organisation et attend ta confirmation. Tu peux demander des modifications — regrouper des lots, changer l'ordre, renommer.</div>
          </div>
        </div>

        <div style={S.step}>
          <div style={S.num}>5</div>
          <div>
            <div style={S.h}>Claude insère tout dans Supabase</div>
            <div style={S.p}>Une fois validé, Claude crée le projet complet dans la base — lots, métiers, lignes MO et matériaux avec les fourchettes de prix ONA. Il te donne le nom du projet créé.</div>
          </div>
        </div>

        <div style={{...S.step, marginBottom: 8}}>
          <div style={S.num}>6</div>
          <div>
            <div style={S.h}>Reviens dans BuildLogic → Charger un projet</div>
            <div style={S.p}>Le projet est là, budget déjà calculé. Tu peux ajuster les quantités, les gammes, les marges — et exporter le devis client.</div>
          </div>
        </div>

        <div style={{borderTop: "2px solid var(--bd)", margin: "20px 0"}} />

        <div style={{marginBottom: 20}}>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10}}>
            <div style={{fontSize: 13, fontWeight: 700, color: "var(--tx)"}}>📋 Prompt "Chef de chantier ONA"</div>
            <button
              onClick={copy}
              style={{
                padding: "5px 14px",
                fontSize: 12,
                fontWeight: 500,
                border: "none",
                borderRadius: 6,
                background: copied ? "var(--gbg)" : "var(--btx)",
                color: copied ? "var(--gtx)" : "#fff",
                cursor: "pointer",
                transition: "all .2s",
              }}
            >
              {copied ? "✅ Copié !" : "📋 Copier le prompt"}
            </button>
          </div>

          <div style={{background: "var(--sf2)", border: "1px solid var(--bd2)", borderRadius: 8, padding: "14px 16px", fontSize: 11, fontFamily: "monospace", lineHeight: 1.8, color: "var(--tx2)", maxHeight: 200, overflowY: "auto", whiteSpace: "pre-wrap"}}>
            {HOW_TO_PROMPT}
          </div>

          <div style={{fontSize: 11, color: "var(--tx3)", marginTop: 8}}>
            Copie ce prompt et colle-le dans une nouvelle conversation Claude (claude.ai) avant de soumettre le rapport de visite.
          </div>
        </div>
      </div>
    </Modal>
  );
}
