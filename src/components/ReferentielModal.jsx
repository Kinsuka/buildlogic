import React, { useState } from "react";
import {
  REFERENTIEL_FOOTER,
  REFERENTIEL_FOURNISSEURS_NOTICE,
  REFERENTIEL_MAT_HEADERS,
  REFERENTIEL_MO_HEADERS,
  REFERENTIEL_POSTES_NOTICE,
  REFERENTIEL_POSTE_LEVELS,
  REFERENTIEL_TABS,
} from "../lib/referentielUiContent.js";
import { Modal } from "./Modal.jsx";

export default function ReferentielModal({onClose, REF}) {
  const [tab,setTab]=useState("mo");
  if (!REF) return (
    <Modal title="📊 Référentiel tarifs ONA" sub="Chargement depuis Supabase…" onClose={onClose} maxWidth={780}>
      <div style={{padding:"40px 20px",textAlign:"center",color:"var(--tx3)",fontSize:13}}>
        <div style={{fontSize:24,marginBottom:12}}>⏳</div>
        Chargement du référentiel live depuis Supabase…
      </div>
    </Modal>
  );
  const cats=[...new Set(REF.mat.map(m=>m.cat))];
  return (
    <Modal title="📊 Référentiel tarifs ONA" sub={`Live Supabase · ${REF.mat.length} matériaux · ${REF.mo.length} corps de métier`} onClose={onClose} maxWidth={780}>
      <div style={{display:"flex",borderBottom:"1px solid var(--bd)",background:"var(--sf2)"}}>
        {REFERENTIEL_TABS.map(({key, label})=>(
          <button key={key} onClick={()=>setTab(key)} style={{padding:"10px 14px",fontSize:12,fontWeight:tab===key?600:400,border:"none",borderBottom:tab===key?"2px solid var(--bbd)":"2px solid transparent",background:"none",color:tab===key?"var(--btx)":"var(--tx2)",cursor:"pointer"}}>{label}</button>
        ))}
      </div>
      <div style={{padding:"16px 20px"}}>
        {tab==="mo"&&(
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{background:"var(--sf2)"}}>{REFERENTIEL_MO_HEADERS.map(h=><th key={h} style={{padding:"8px 10px",textAlign:h==="Corps de métier"||h==="Notes"?"left":"center",fontSize:10,fontWeight:600,color:"var(--tx3)",textTransform:"uppercase",borderBottom:"1px solid var(--bd)"}}>{h}</th>)}</tr></thead>
            <tbody>{REF.mo.map((r,i)=><tr key={i} style={{borderBottom:"1px solid var(--bd)",background:i%2===0?"transparent":"var(--sf2)"}}><td style={{padding:"9px 10px",fontWeight:600}}><span style={{marginRight:6}}>{r.icon}</span>{r.metier}</td><td style={{padding:"9px 10px",textAlign:"center",color:"var(--tx2)"}}>{r.lo} €</td><td style={{padding:"9px 10px",textAlign:"center",fontWeight:700,color:"var(--btx)",background:"var(--bbg)"}}>{r.sug} €</td><td style={{padding:"9px 10px",textAlign:"center",color:"var(--tx2)"}}>{r.hi} €</td><td style={{padding:"9px 10px",textAlign:"center",color:"var(--tx3)",fontSize:11}}>{r.h_lo&&r.h_hi?`${r.h_lo}–${r.h_hi} €/h`:"—"}</td><td style={{padding:"9px 10px",color:"var(--tx3)",fontSize:11}}>{r.note}</td></tr>)}</tbody>
          </table>
        )}
        {tab==="mat"&&cats.map(cat=>(
          <div key={cat} style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8,paddingBottom:4,borderBottom:"1px solid var(--bd)"}}>{cat}</div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr>{REFERENTIEL_MAT_HEADERS.map(h=><th key={h} style={{padding:"6px 8px",textAlign:h==="Matériau"||h==="Notes"?"left":"center",fontSize:10,fontWeight:600,color:"var(--tx3)",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
              <tbody>{REF.mat.filter(m=>m.cat===cat).map((r,i)=><tr key={i} style={{borderBottom:"1px solid var(--bd)",background:i%2===0?"transparent":"var(--sf2)"}}><td style={{padding:"8px 8px",fontWeight:500}}>{r.label}</td><td style={{padding:"8px 8px",textAlign:"center",color:"var(--tx3)",fontSize:11}}>{r.unite}</td><td style={{padding:"8px 8px",textAlign:"center",color:"var(--tx2)"}}>{r.lo} €</td><td style={{padding:"8px 8px",textAlign:"center",fontWeight:700,color:"var(--btx)",background:"var(--bbg)"}}>{r.sug} €</td><td style={{padding:"8px 8px",textAlign:"center",color:"var(--tx2)"}}>{r.hi} €</td><td style={{padding:"8px 8px",color:"var(--tx3)",fontSize:11}}>{r.note}</td></tr>)}</tbody>
            </table>
          </div>
        ))}
        {tab==="postes"&&(
          <div>
            <div style={{background:"var(--bbg)",borderLeft:"3px solid var(--bbd)",borderRadius:"0 6px 6px 0",padding:"10px 14px",marginBottom:16,fontSize:12,color:"var(--tx2)"}}>{REFERENTIEL_POSTES_NOTICE}</div>
            {REFERENTIEL_POSTE_LEVELS.map(({key, label, icon, color, background})=>(
              <div key={key} style={{marginBottom:20}}>
                <div style={{fontSize:11,fontWeight:700,color, textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>{label}</div>
                {REF.postesSystematiques.filter(p=>p.niveau===key).map((p,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 12px",borderRadius:6,marginBottom:4,background, border:`1px solid ${color}22`}}>
                    <span style={{fontSize:14,flexShrink:0,marginTop:1}}>{icon}</span>
                    <div><div style={{fontSize:12,fontWeight:600,color:"var(--tx)"}}>{p.label}</div><div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>{p.note}</div></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        {tab==="four"&&(
          <div>
            <div style={{background:"var(--bbg)",borderLeft:"3px solid var(--bbd)",borderRadius:"0 6px 6px 0",padding:"10px 14px",marginBottom:16,fontSize:12,color:"var(--tx2)"}}>{REFERENTIEL_FOURNISSEURS_NOTICE}</div>
            {REF.fournisseurs.map((f,i)=>(
              <div key={i} style={{marginBottom:10,border:"1px solid var(--bd)",borderRadius:8,overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",background:"var(--sf2)",borderBottom:"1px solid var(--bd)"}}>
                  <span style={{fontSize:20}}>{f.i}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--tx)"}}>{f.nom}</div>
                    <div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap"}}>
                      {f.cats.map((c,ci)=><span key={ci} style={{fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:10,background:"var(--bbg)",color:"var(--btx)"}}>{c}</span>)}
                    </div>
                  </div>
                  <a href={`https://${f.url}`} target="_blank" rel="noreferrer" style={{fontSize:11,color:"var(--btx)",textDecoration:"none",padding:"4px 10px",border:"1px solid var(--bbd)",borderRadius:6,whiteSpace:"nowrap"}}>🌐 {f.url}</a>
                </div>
                <div style={{padding:"10px 14px",fontSize:12}}>
                  <div style={{marginBottom:4}}><span style={{fontWeight:600,color:"var(--tx3)"}}>Quand : </span><span style={{color:"var(--tx)"}}>{f.quand}</span></div>
                  <div><span style={{fontWeight:600,color:"var(--tx3)"}}>Note : </span><span style={{color:"var(--tx2)"}}>{f.n}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{padding:"10px 18px",borderTop:"1px solid var(--bd)",background:"var(--sf2)",fontSize:11,color:"var(--tx3)"}}>{REFERENTIEL_FOOTER}</div>
    </Modal>
  );
}
