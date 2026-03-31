import React from "react";
import { lotTotals, fmt } from "../lib/calculs.js";
import MetierRow from "./MetierRow.jsx";

export default function LotCard({lot,st,setST,clientMode}) {
  let base=0,marge=0,imprevu=0,total=0;
  try { ({base,marge,imprevu,total}=lotTotals(st,lot)); } catch(e) {}
  const isOpen=st.lotOpen[lot.id]??lot.defaultOpen;
  const impMode=st.IMPREVU_MODE[lot.id]??"pct", impVal=st.IMPREVU_VAL[lot.id]??lot.imprevuPct??10;
  const upd=fn=>setST(prev=>{const n={...prev};fn(n);return n;});
  return (
    <div data-testid={`lot-card-${lot.id}`} style={{marginBottom:"1rem",border:"1px solid var(--bd)",borderRadius:10,overflow:"hidden",background:"var(--sf)"}}>
      <div data-testid={`lot-toggle-${lot.id}`} onClick={()=>upd(n=>{n.lotOpen={...n.lotOpen,[lot.id]:!isOpen};})} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 16px",cursor:"pointer",userSelect:"none",background:"var(--sf2)"}} onMouseEnter={e=>e.currentTarget.style.filter="brightness(.97)"} onMouseLeave={e=>e.currentTarget.style.filter=""}>
        <div>
          <div style={{fontSize:14,fontWeight:600,color:"var(--tx)"}}>{lot.title}</div>
          <div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>{lot.meta}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          {clientMode
            ?<div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:600,color:"var(--gtx)"}}>{fmt(total)}</div><div style={{fontSize:10,color:"var(--tx3)"}}>Total HT</div></div>
            :[{v:base,l:"Coût base",c:"var(--tx)"},{v:marge,l:"Marge",c:"var(--amb)"},{v:imprevu,l:"Imprévus",c:"var(--rtx)"},{v:total,l:"Total HT",c:"var(--gtx)"}].map(({v,l,c})=>(
              <div key={l} style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:600,color:c}}>{fmt(v)}</div><div style={{fontSize:10,color:"var(--tx3)"}}>{l}</div></div>
            ))
          }
          <span style={{fontSize:10,color:"var(--tx3)",display:"inline-block",transform:isOpen?"rotate(90deg)":"none",transition:"transform .18s",marginLeft:8}}>▶</span>
        </div>
      </div>
      {isOpen&&<>
        {lot.metiers.map(m=><MetierRow key={m.id} lk={lot.id} m={m} st={st} setST={setST} clientMode={clientMode}/>)}
        {!clientMode&&(
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",background:"var(--rbg)",borderTop:"1px solid var(--bd)",flexWrap:"wrap"}}>
            <span style={{fontSize:11,fontWeight:600,color:"var(--rtx)",flexShrink:0}}>⚠️ Provision imprévus</span>
            <select value={impMode} onChange={e=>upd(n=>{n.IMPREVU_MODE={...n.IMPREVU_MODE,[lot.id]:e.target.value};})} style={{fontSize:11,height:24,padding:"0 4px",border:"1px solid var(--bd3)",borderRadius:4,background:"var(--sf)",color:"var(--tx)",width:80}}>
              <option value="pct">% du lot</option><option value="fixe">Montant €</option>
            </select>
            <input type="number" step={impMode==="pct"?1:100} value={impVal} onChange={e=>upd(n=>{n.IMPREVU_VAL={...n.IMPREVU_VAL,[lot.id]:parseFloat(e.target.value)||0};})} style={{width:60,fontSize:11,height:24,textAlign:"right",border:"1px solid var(--bd3)",borderRadius:4,background:"var(--sf)",color:"var(--tx)",padding:"0 4px"}}/>
            {impMode==="pct"&&<span style={{fontSize:11,color:"var(--rtx)"}}>{impVal}%</span>}
            <span style={{fontSize:12,fontWeight:700,color:"var(--rtx)",marginLeft:"auto"}}>{fmt(imprevu)}</span>
            <span style={{fontSize:10,color:"var(--tx3)"}}>inclus dans le total</span>
          </div>
        )}
        <div style={{padding:"10px 16px",background:"var(--sf2)",borderTop:"1px solid var(--bd)"}}>
          <div style={{fontSize:10,fontWeight:600,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:7}}>Ordre d'intervention</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {(lot.sequence||[]).map((s,i)=><span key={i} style={{fontSize:10,background:"var(--sf)",border:"1px solid var(--bd)",borderRadius:12,padding:"3px 9px",color:"var(--tx2)",whiteSpace:"nowrap"}}><span style={{color:"var(--tx3)",marginRight:4}}>{i+1}.</span>{s}</span>)}
          </div>
        </div>
        {clientMode?(
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",borderTop:"2px solid var(--bd)"}}>
            <div style={{padding:"9px 14px",fontSize:11,color:"var(--tx3)"}}>Prestations<span style={{display:"block",fontSize:13,fontWeight:600,color:"var(--tx)",marginTop:2}}>{fmt(total-imprevu)}</span></div>
            <div style={{padding:"9px 14px",fontSize:11,color:"var(--tx3)",background:"var(--sf2)"}}>Prix vente HT<span style={{display:"block",fontSize:13,fontWeight:600,color:"var(--gtx)",marginTop:2}}>{fmt(total)}</span></div>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderTop:"2px solid var(--bd)"}}>
            {[{l:"Coût base HT",v:fmt(base)},{l:"Marge",v:`${fmt(marge)}${total>0?` · ${Math.round(marge/total*100)}%`:""}`,c:"var(--amb)"},{l:"Imprévus",v:fmt(imprevu),c:"var(--rtx)",bg:"var(--rbg)"},{l:"Prix vente HT",v:fmt(total),hi:true}].map(({l,v,hi,c,bg})=>(
              <div key={l} style={{padding:"9px 14px",fontSize:11,color:"var(--tx3)",background:bg||(hi?"var(--sf2)":"transparent")}}>{l}<span style={{display:"block",fontSize:13,fontWeight:600,color:c||(hi?"var(--gtx)":"var(--tx)"),marginTop:2}}>{v}</span></div>
            ))}
          </div>
        )}
      </>}
    </div>
  );
}
