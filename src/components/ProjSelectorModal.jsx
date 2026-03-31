import React from "react";

export default function ProjSelectorModal({onClose, projListLoading, projectsList, onLoadProject, onRefresh}) {
  return (
    <div
      data-testid="project-selector-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{display:"flex",position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:1000,alignItems:"center",justifyContent:"center",padding:16}}
    >
      <div data-testid="project-selector-modal" style={{background:"var(--sf)",borderRadius:12,maxWidth:600,width:"100%",maxHeight:"80vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderBottom:"1px solid var(--bd)",background:"var(--sf2)"}}>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>📁 Projets ONA</div>
            <div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>Sélectionne un chantier à charger</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button
              data-testid="refresh-projects-button"
              onClick={onRefresh}
              title="Rafraîchir la liste"
              style={{background:"none",border:"1px solid var(--bd2)",borderRadius:8,padding:"4px 10px",fontSize:12,cursor:"pointer",color:"var(--tx3)"}}
            >
              🔄
            </button>
            <button data-testid="close-project-selector-button" onClick={onClose} style={{background:"none",border:"1px solid var(--bd2)",borderRadius:8,padding:"4px 10px",fontSize:13,cursor:"pointer",color:"var(--tx2)"}}>✕</button>
          </div>
        </div>

        <div style={{overflowY:"auto",flex:1,padding:"12px 16px"}}>
          {projListLoading
            ? <div style={{textAlign:"center",padding:"30px 0",color:"var(--tx3)",fontSize:13}}>⏳ Chargement des projets…</div>
            : projectsList.length===0
              ? <div style={{textAlign:"center",padding:"30px 0",color:"var(--tx3)",fontSize:13}}>Aucun projet trouvé dans Supabase.</div>
              : projectsList.map((p) => (
                <div
                  key={p.id}
                  data-testid={`project-item-${p.client_nom}`}
                  onClick={() => onLoadProject(p.id, p.client_nom)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--sf2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--sf)";
                  }}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",border:"1px solid var(--bd)",borderRadius:8,marginBottom:8,cursor:"pointer",background:"var(--sf)"}}
                >
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--tx)"}}>{p.client_nom}</div>
                    <div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>{p.adresse}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 8,
                        background: p.statut === "accepted" ? "var(--gbg)" : p.statut === "sent" ? "var(--bbg)" : "var(--sf2)",
                        color: p.statut === "accepted" ? "var(--gtx)" : p.statut === "sent" ? "var(--btx)" : "var(--tx3)",
                      }}
                    >
                      {p.statut==="draft"?"Brouillon":p.statut==="sent"?"Envoyé":p.statut==="accepted"?"Accepté":"Refusé"}
                    </span>
                    <div style={{fontSize:10,color:"var(--tx4)",marginTop:4}}>TVA {p.tva}% · {p.validite}j</div>
                  </div>
                  <span style={{fontSize:16,color:"var(--tx3)"}}>→</span>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}
