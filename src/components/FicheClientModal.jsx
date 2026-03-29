import React from "react";
import { lotTotals } from "../lib/calculs.js";
import { Modal, CopyBox } from "./Modal.jsx";

export default function FicheClientModal({st,onClose,PROJECT}) {
  const fE=n=>Math.round(n).toLocaleString("fr-BE")+" €";
  const gTotal=PROJECT.lots.reduce((s,lot)=>s+lotTotals(st,lot).total,0);
  const txt=[
    ...PROJECT.lots.map((lot,li)=>{
      const {total}=lotTotals(st,lot);
      const lines=[`${li+1}. ${lot.title.replace(/^Lot \d+ — /,"")}`,`${lot.meta}`,``];
      lot.metiers.forEach(m=>{m.mo.forEach(l=>lines.push(`   • ${l.label}`));m.mat.forEach(x=>{const pi=Math.min(st.MAT_PROP[`${lot.id}${m.id}${x.id}`]??0,(x.props?.length||1)-1);lines.push(`   • ${x.label}${x.props?.[pi]?.name?` — ${x.props[pi].name}`:""}`);}); });
      lines.push(``,`   Montant HT : ${fE(total)}`);
      return lines.join("\n");
    }),
    ``,`─────────────────────────────────`,
    `Total HT  : ${fE(gTotal)}`,`TVA ${PROJECT.tva}%   : ${fE(gTotal*PROJECT.tva/100)}`,`Total TTC : ${fE(gTotal*(1+PROJECT.tva/100))}`,
  ].join("\n");
  return (
    <Modal title={`📄 Fiche client — ${PROJECT.client}`} sub="Lots et prestations · prêt à coller dans le logiciel de facturation" onClose={onClose} maxWidth={740}>
      <div style={{padding:"20px 24px"}}>
        {PROJECT.lots.map((lot,li)=>{
          const {total}=lotTotals(st,lot);
          return (
            <div key={lot.id} style={{marginBottom:16,border:"1px solid var(--bd)",borderRadius:8,overflow:"hidden"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",background:"var(--sf2)",borderBottom:"1px solid var(--bd)"}}>
                <div><div style={{fontSize:13,fontWeight:700,color:"var(--tx)"}}>{li+1}. {lot.title.replace(/^Lot \d+ — /,"")}</div><div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>{lot.meta}</div></div>
                <div style={{fontSize:14,fontWeight:700,color:"var(--gtx)",whiteSpace:"nowrap",marginLeft:16}}>{fE(total)}</div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <ul style={{fontSize:13,lineHeight:2,color:"var(--tx2)"}}>
                  {lot.metiers.flatMap(m=>[
                    ...m.mo.map(l=><li key={`mo${l.id}`}>{l.label}</li>),
                    ...m.mat.map(x=>{const pi=Math.min(st.MAT_PROP[`${lot.id}${m.id}${x.id}`]??0,(x.props?.length||1)-1);return <li key={`mat${x.id}`} style={{color:"var(--tx3)"}}>{x.label}{x.props?.[pi]?.name?` — ${x.props[pi].name}`:""}</li>;}),
                  ])}
                </ul>
              </div>
            </div>
          );
        })}
        <div style={{background:"var(--sf2)",borderRadius:8,padding:"12px 16px"}}>
          {[{l:"Total HT",v:fE(gTotal)},{l:`TVA ${PROJECT.tva}%`,v:fE(gTotal*PROJECT.tva/100)}].map(({l,v})=>(<div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--tx2)",marginBottom:4}}><span>{l}</span><span>{v}</span></div>))}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700,color:"var(--tx)",borderTop:"1px solid var(--bd)",paddingTop:8,marginTop:4}}><span>Total TTC</span><span style={{color:"var(--gtx)"}}>{fE(gTotal*(1+PROJECT.tva/100))}</span></div>
        </div>
      </div>
      <CopyBox text={txt}/>
    </Modal>
  );
}
