import React, { useState } from "react";
import {
  DOC_ARCHITECTURE_CODE,
  DOC_ARCHITECTURE_TABLES,
  DOC_AUDIT_CHECKS,
  DOC_CONNECTION_CODE,
  DOC_FLOW_STEPS,
  DOC_NAMING_CONVENTIONS,
  DOC_PATCH_NOTES,
  DOC_PROJECT_JSON_EXAMPLE,
  DOC_PROMPT_AUDIT,
  DOC_RENDEMENTS,
  DOC_REQUIRED_POSTES,
  DOC_SECTIONS,
  DOC_TARIFS_REFERENCE,
} from "../lib/documentationContent.js";

export default function DocumentationModal({onClose}) {
  const [section, setSection] = useState("patchnotes");

  const S = {
    overlay: {display:"flex",position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:1000,alignItems:"center",justifyContent:"center",padding:16},
    modal:   {background:"var(--sf)",borderRadius:12,maxWidth:860,width:"100%",maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,.3)"},
    header:  {display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:"1px solid var(--bd)",background:"var(--sf2)",flexShrink:0},
    tabs:    {display:"flex",gap:4,padding:"10px 16px",borderBottom:"1px solid var(--bd)",background:"var(--sf2)",flexShrink:0,flexWrap:"wrap"},
    tab:     (active) => ({padding:"5px 12px",fontSize:12,fontWeight:active?600:400,border:"1px solid",borderColor:active?"var(--btx)":"var(--bd2)",borderRadius:6,background:active?"var(--bbg)":"none",color:active?"var(--btx)":"var(--tx2)",cursor:"pointer"}),
    body:    {overflowY:"auto",flex:1,padding:"20px 24px"},
    h2:      {fontSize:15,fontWeight:700,color:"var(--tx)",marginBottom:12,marginTop:20,paddingTop:16,borderTop:"1px solid var(--bd)"},
    h3:      {fontSize:13,fontWeight:600,color:"var(--tx)",marginBottom:8,marginTop:14},
    p:       {fontSize:13,color:"var(--tx2)",lineHeight:1.7,marginBottom:10},
    code:    {fontFamily:"monospace",fontSize:12,background:"var(--sf2)",border:"1px solid var(--bd)",borderRadius:6,padding:"10px 14px",display:"block",marginBottom:12,whiteSpace:"pre",overflowX:"auto"},
    tag:     (c) => ({display:"inline-block",fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:8,marginRight:6,marginBottom:4,background:c==="rouge"?"var(--rbg)":c==="orange"?"#fff3e0":"var(--gbg)",color:c==="rouge"?"var(--rtx)":c==="orange"?"#e65100":"var(--gtx)"}),
    table:   {width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:16},
    th:      {padding:"5px 10px",borderBottom:"1px solid var(--bd)",textAlign:"left",fontSize:11,fontWeight:600,color:"var(--tx3)"},
    thr:     {padding:"5px 10px",borderBottom:"1px solid var(--bd)",textAlign:"right",fontSize:11,fontWeight:600,color:"var(--tx3)"},
    td:      {padding:"6px 10px",borderBottom:"1px solid var(--bd2)",color:"var(--tx)"},
    tdr:     {padding:"6px 10px",borderBottom:"1px solid var(--bd2)",color:"var(--tx)",textAlign:"right"},
    tdn:     {padding:"6px 10px",borderBottom:"1px solid var(--bd2)",color:"var(--tx2)",fontSize:11},
  };

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={S.overlay}>
      <div style={S.modal}>
        <div style={S.header}>
          <div>
            <div style={{fontSize:15,fontWeight:700}}>📚 Documentation BuildLogic — ONA Group</div>
            <div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>Manuel opérationnel · v8 Netlify · Mars 2026</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"1px solid var(--bd2)",borderRadius:8,padding:"4px 10px",fontSize:13,cursor:"pointer",color:"var(--tx2)"}}>✕</button>
        </div>

        <div style={S.tabs}>
          {DOC_SECTIONS.map((s) => (
            <button key={s.id} onClick={() => setSection(s.id)} style={S.tab(section === s.id)}>{s.label}</button>
          ))}
        </div>

        <div style={S.body}>
          {section==="patchnotes" && <>
            <div style={{...S.h2,borderTop:"none",marginTop:0,paddingTop:0}}>Historique des versions</div>

            {DOC_PATCH_NOTES.map(({version, date, color, bg, items}) => (
              <div key={version} style={{marginBottom:24}}>
                <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:10}}>
                  <div style={{fontSize:14,fontWeight:700,color}}>{version}</div>
                  <div style={{fontSize:11,color:"var(--tx3)"}}>{date}</div>
                </div>
                <div style={{borderLeft:"2px solid var(--bd)",paddingLeft:14}}>
                  {items.map(([titre, desc]) => (
                    <div key={titre} style={{marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
                        <span style={{fontSize:11,fontWeight:600,background:bg,color,padding:"1px 7px",borderRadius:6,flexShrink:0,marginTop:1}}>{titre}</span>
                        <span style={{fontSize:12,color:"var(--tx2)",lineHeight:1.6}}>{desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>}

          {section==="architecture" && <>
            <div style={{...S.h2,borderTop:"none",marginTop:0,paddingTop:0}}>Architecture BuildLogic v8</div>
            <div style={S.p}>BuildLogic est l'outil de budgétisation interne d'ONA Group SRL. Il tourne sur Netlify et se connecte directement à Supabase — sans intermédiaire LLM pour le chargement des données.</div>
            <div style={S.code}>{DOC_ARCHITECTURE_CODE}</div>

            <div style={S.h3}>Tables Supabase</div>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Table</th><th style={S.th}>Rôle</th><th style={S.th}>Modifié par</th></tr></thead>
              <tbody>
                {DOC_ARCHITECTURE_TABLES.map(([t,r,m])=>(
                  <tr key={t}><td style={{...S.td,fontFamily:"monospace",fontSize:11}}>{t}</td><td style={S.td}>{r}</td><td style={S.tdn}>{m}</td></tr>
                ))}
              </tbody>
            </table>

            <div style={S.h3}>Triggers Postgres automatiques</div>
            <div style={S.p}>Dès qu'une ligne est insérée ou modifiée dans <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>bl_lots</code>, <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>bl_metiers</code>, <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>bl_mo_lines</code> ou <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>bl_mat_lines</code>, le champ <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>projet_json</code> est recalculé automatiquement dans <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>bl_projects</code>. BuildLogic charge ce champ pré-calculé → chargement instantané.</div>
          </>}

          {section==="flow" && <>
            <div style={{...S.h2,borderTop:"none",marginTop:0,paddingTop:0}}>Flow complet — du rapport au budget</div>

            {DOC_FLOW_STEPS.map(({n,icon,t,p})=>(
              <div key={n} style={{display:"flex",gap:14,marginBottom:16}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:"var(--btx)",color:"#fff",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{n}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{icon} {t}</div>
                  <div style={S.p}>{p}</div>
                </div>
              </div>
            ))}

            <div style={S.h3}>Postes obligatoires ONA — toujours vérifier</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
              {DOC_REQUIRED_POSTES.map((p)=>(
                <span key={p} style={S.tag("vert")}>{p}</span>
              ))}
            </div>

            <div style={S.h3}>Points en suspens</div>
            <div style={S.p}>Les points en suspens sont encodés dans <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>bl_suspens</code> avec 3 niveaux :</div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16}}>
              <span style={S.tag("rouge")}>🔴 Rouge — bloquant</span>
              <span style={S.tag("orange")}>🟠 Orange — à confirmer</span>
              <span style={S.tag("vert")}>🟢 Vert — informatif</span>
            </div>
          </>}

          {section==="rendements" && <>
            <div style={{...S.h2,borderTop:"none",marginTop:0,paddingTop:0}}>Grille de rendements de référence</div>
            <div style={S.p}>187 prestations encodées dans <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>mo_rendements</code> — 14 métiers. Sources : Praesy.be, Buildwise BE, marché belge 2026. Coefficients de complexité rénovation validés et encodés.</div>

            <div style={{padding:"8px 12px",background:"var(--bbg)",border:"1px solid var(--bbd)",borderRadius:8,fontSize:12,color:"var(--btx)",marginBottom:16}}>
              <strong>Coeff. réno :</strong> multiplicateur appliqué aux rendements de référence en contexte rénovation. Un carreleur qui pose 8m²/j en neuf pose ~6m²/j en rénovation (÷ coeff 1.30). Source : Praesy.be/Buildwise BE (11-13€/m² neuf vs 15-20€/m² réno Wallonie).
            </div>

            {DOC_RENDEMENTS.map(({metier, coeff, rows}) => (
              <div key={metier} style={{marginBottom:20}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--tx)",padding:"5px 10px",background:"var(--sf2)",borderRadius:6,flex:1}}>{metier}</div>
                  <div style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:6,background:"var(--rbg)",color:"var(--rtx)",whiteSpace:"nowrap"}}>
                    Coeff réno ×{coeff}
                  </div>
                </div>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Prestation</th><th style={S.thr}>Min</th><th style={S.thr}>Sug</th><th style={S.thr}>Max</th><th style={S.th}>Unité</th></tr></thead>
                  <tbody>
                    {rows.map(([label, unite, min, sug, max])=>(
                      <tr key={label}>
                        <td style={S.td}>{label}</td>
                        <td style={S.tdr}>{min}</td>
                        <td style={{...S.tdr,fontWeight:600}}>{sug}</td>
                        <td style={S.tdr}>{max}</td>
                        <td style={S.tdn}>{unite}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </>}

          {section==="audit" && <>
            <div style={{...S.h2,borderTop:"none",marginTop:0,paddingTop:0}}>Fonction d'audit — principe</div>
            <div style={S.p}>L'audit croise les lignes MO d'un projet BuildLogic avec la table <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>mo_rendements</code> pour détecter les sous-estimations, oublis et risques de dépassement de forfait.</div>

            <div style={S.h3}>Ce que l'audit vérifie</div>
            {DOC_AUDIT_CHECKS.map(([t,d])=>(
              <div key={t} style={{marginBottom:10}}>
                <div style={{fontSize:12,fontWeight:600,color:"var(--tx)",marginBottom:2}}>{t}</div>
                <div style={{fontSize:12,color:"var(--tx2)"}}>{d}</div>
              </div>
            ))}

            <div style={S.h3}>Prompt auditeur ONA</div>
            <div style={{...S.code,fontSize:11,lineHeight:1.6}}>{DOC_PROMPT_AUDIT}</div>
            <div style={S.p}>Pour utiliser : ouvrir une nouvelle conversation Claude, coller ce prompt, puis coller le <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>projet_json</code> du projet à auditer (disponible dans Supabase, colonne <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>projet_json</code> de <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>bl_projects</code>).</div>
          </>}

          {section==="supabase" && <>
            <div style={{...S.h2,borderTop:"none",marginTop:0,paddingTop:0}}>Base de données — référence technique</div>

            <div style={S.h3}>Connexion</div>
            <div style={S.code}>{DOC_CONNECTION_CODE}</div>

            <div style={S.h3}>Format projet_json</div>
            <div style={S.code}>{DOC_PROJECT_JSON_EXAMPLE}</div>

            <div style={S.h3}>Conventions de nommage</div>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Champ</th><th style={S.th}>Format</th><th style={S.th}>Exemple</th></tr></thead>
              <tbody>
                {DOC_NAMING_CONVENTIONS.map(([f,fmt,ex])=>(
                  <tr key={f}>
                    <td style={{...S.td,fontFamily:"monospace",fontSize:11}}>{f}</td>
                    <td style={S.td}>{fmt}</td>
                    <td style={{...S.tdn,fontFamily:"monospace"}}>{ex}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={S.h3}>Tarifs MO de référence ONA (€/j HTVA)</div>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Métier</th><th style={S.thr}>Lo</th><th style={S.thr}>Sug</th><th style={S.thr}>Hi</th></tr></thead>
              <tbody>
                {DOC_TARIFS_REFERENCE.map(([m,lo,sug,hi])=>(
                  <tr key={m}><td style={S.td}>{m}</td><td style={S.tdr}>{lo}€</td><td style={{...S.tdr,fontWeight:600}}>{sug}€</td><td style={S.tdr}>{hi}€</td></tr>
                ))}
              </tbody>
            </table>
          </>}
        </div>
      </div>
    </div>
  );
}
