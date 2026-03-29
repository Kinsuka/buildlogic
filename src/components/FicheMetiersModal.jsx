import React from "react";
import { moLV, matLV } from "../lib/calculs.js";
import { Modal, CopyBox } from "./Modal.jsx";

export default function FicheMetiersModal({st,onClose,PROJECT}) {
  const fE=n=>Math.round(n).toLocaleString("fr-BE")+" €";
  const byM={};
  PROJECT.lots.forEach(lot=>{
    lot.metiers.forEach(m=>{
      if (!byM[m.name]) byM[m.name]={icon:m.icon,name:m.name,missions:[]};
      const mo=m.mo.map(l=>{
        const j=Number(st.MO_J[`${lot.id}${m.id}${l.id}`]??l.jRef.sug), mode=st.MO_MODE[`${lot.id}${m.id}${l.id}`]??"jours", note=st.NOTES[`${lot.id}${m.id}${l.id}`]||"";
        return {label:l.label, detail:mode==="jours"?`${j} jour${j>1?"s":""}` :"Forfait", note, val:moLV(st,lot.id,m.id,l)};
      });
      const mat=m.mat.map(x=>{
        const pi=st.MAT_PROP[`${lot.id}${m.id}${x.id}`]??0, qty=x.u?(st.MAT_QTY[`${lot.id}${m.id}${x.id}`]??(st.MAT_DIM_M2[`${lot.id}${m.id}${x.id}`]!=null?Math.ceil(st.MAT_DIM_M2[`${lot.id}${m.id}${x.id}`]*1.1):x.qBase)):null, note=st.NOTES[`${lot.id}${m.id}${x.id}`]||"";
        return {label:x.label, detail:`${x.props?.[pi]?.name??""}${qty?` · ${qty} m²`:""}`, note, val:matLV(st,lot.id,m.id,x)};
      });
      byM[m.name].missions.push({lot:lot.title,lotMeta:lot.meta,mo,mat,total:[...mo,...mat].reduce((a,p)=>a+p.val,0)});
    });
  });
  const metiers=Object.values(byM);
  const txt=metiers.map(m=>{
    const tot=m.missions.reduce((a,ms)=>a+ms.total,0);
    let s=`${"═".repeat(52)}\n${m.icon}  ${m.name.toUpperCase()} — Total : ${fE(tot)}\n${"═".repeat(52)}\n`;
    m.missions.forEach((ms,i)=>{
      s+=`\n— Mission ${i+1} : ${ms.lot.replace(/^Lot \d+ — /,"")} —\n${ms.lotMeta}\n\n`;
      if (ms.mo.length){s+="Travaux à réaliser :\n";ms.mo.forEach(p=>{s+=`  • ${p.label} (${p.detail})\n`;if(p.note)s+=`    → ${p.note}\n`;});}
      if (ms.mat.length){s+="\nFournitures incluses :\n";ms.mat.forEach(p=>{s+=`  • ${p.label} — ${p.detail}\n`;if(p.note)s+=`    → ${p.note}\n`;});}
      s+=`\nMontant mission : ${fE(ms.total)}\n`;
    });
    return s;
  }).join("\n\n");
  return (
    <Modal title={`👷 Fiche missions — ${PROJECT.client}`} sub="Une mission par lot · à transmettre au prestataire" onClose={onClose} maxWidth={800}>
      {metiers.map(m=>{
        const tot=m.missions.reduce((a,ms)=>a+ms.total,0);
        return (
          <div key={m.name} style={{borderBottom:"2px solid var(--bd)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 18px",background:"var(--sf2)"}}>
              <span style={{fontSize:18}}>{m.icon}</span>
              <div><div style={{fontSize:14,fontWeight:700,color:"var(--tx)"}}>{m.name}</div><div style={{fontSize:11,color:"var(--tx3)"}}>{m.missions.length} mission{m.missions.length>1?"s":""} sur ce chantier</div></div>
              <div style={{marginLeft:"auto",textAlign:"right"}}><div style={{fontSize:14,fontWeight:700,color:"var(--amb)"}}>{fE(tot)}</div><div style={{fontSize:10,color:"var(--tx3)"}}>total métier</div></div>
            </div>
            {m.missions.map((ms,i)=>(
              <div key={i} style={{margin:"12px 18px 16px",border:"1px solid var(--bd)",borderRadius:8,overflow:"hidden"}}>
                <div style={{padding:"10px 14px",background:"var(--bbg)",borderBottom:"1px solid var(--bbd)"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"var(--btx)"}}>Mission {i+1} — {ms.lot.replace(/^Lot \d+ — /,"")}</div>
                  <div style={{fontSize:11,color:"var(--tx2)",marginTop:2}}>{ms.lotMeta}</div>
                </div>
                <div style={{padding:"14px 16px",fontSize:13,lineHeight:1.9,color:"var(--tx)"}}>
                  {ms.mo.length>0&&<div style={{marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:8}}>Travaux à réaliser</div><ul>{ms.mo.map((p,pi)=><li key={pi} style={{marginBottom:6}}><span style={{fontWeight:600}}>{p.label}</span><span style={{color:"var(--tx3)",marginLeft:6}}>({p.detail})</span>{p.note&&<div style={{fontSize:12,color:"var(--amb)",marginTop:2,fontStyle:"italic"}}>→ {p.note}</div>}</li>)}</ul></div>}
                  {ms.mat.length>0&&<div><div style={{fontSize:11,fontWeight:700,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:8}}>Fournitures incluses</div><ul>{ms.mat.map((p,pi)=><li key={pi} style={{marginBottom:6}}><span style={{fontWeight:600}}>{p.label}</span><span style={{color:"var(--tx3)",marginLeft:6}}>— {p.detail}</span>{p.note&&<div style={{fontSize:12,color:"var(--amb)",marginTop:2,fontStyle:"italic"}}>→ {p.note}</div>}</li>)}</ul></div>}
                </div>
                <div style={{display:"flex",justifyContent:"flex-end",padding:"8px 14px",background:"var(--sf2)",borderTop:"1px solid var(--bd)"}}><span style={{fontSize:13,fontWeight:700,color:"var(--tx)"}}>{fE(ms.total)}</span></div>
              </div>
            ))}
          </div>
        );
      })}
      <CopyBox text={txt}/>
    </Modal>
  );
}
