import React from "react";
import { metierBase, metierTotal, fmt } from "../lib/calculs.js";
import LineCardMO from "./LineCardMO.jsx";
import LineCardMat from "./LineCardMat.jsx";

export default function MetierRow({lk,m,st,setST,clientMode}) {
  const mb=metierBase(st,lk,m).base, mt=metierTotal(st,lk,m);
  const mv=Number(st.MARGE_VAL[`${lk}${m.id}`]??0), mm=st.MARGE_MODE[`${lk}${m.id}`]??"coeff";
  const days=m.mo.reduce((s,l)=>(st.MO_MODE[`${lk}${m.id}${l.id}`]??"jours")==="jours"?s+Number(st.MO_J[`${lk}${m.id}${l.id}`]??l.jRef.sug):s,0);
  const open=st.metierOpen[`${lk}${m.id}`]??true;
  const upd=fn=>setST(prev=>{const n={...prev};fn(n);return n;});
  return (
    <div style={{borderTop:"1px solid var(--bd)"}}>
      <div onClick={()=>upd(n=>{n.metierOpen={...n.metierOpen,[`${lk}${m.id}`]:!open};})} style={{display:"flex",alignItems:"center",padding:"8px 16px",cursor:"pointer",gap:8,userSelect:"none"}} onMouseEnter={e=>e.currentTarget.style.background="var(--sf2)"} onMouseLeave={e=>e.currentTarget.style.background=""}>
        <span style={{fontSize:9,color:"var(--tx3)",display:"inline-block",transform:open?"rotate(90deg)":"none",transition:"transform .18s"}}>▶</span>
        <span style={{fontSize:14}}>{m.icon}</span>
        <span style={{fontSize:13,fontWeight:600,color:"var(--tx)",flexShrink:0}}>{m.name}</span>
        {!clientMode&&<span style={{fontSize:11,color:"var(--tx3)",flexShrink:0}}>{days>0?`${days.toFixed(1)} j · `:""}base {fmt(mb)}</span>}
        <span style={{flex:1}}/>
        {!clientMode&&(
          <div onClick={e=>e.stopPropagation()} style={{display:"flex",alignItems:"center",gap:5,padding:"0 8px",borderLeft:"1px solid var(--bd)",borderRight:"1px solid var(--bd)"}}>
            <span style={{fontSize:10,color:"var(--tx3)",whiteSpace:"nowrap"}}>Marge</span>
            <select value={mm} onChange={e=>upd(n=>{n.MARGE_MODE={...n.MARGE_MODE,[`${lk}${m.id}`]:e.target.value};n.MARGE_VAL={...n.MARGE_VAL,[`${lk}${m.id}`]:0};})} style={{width:90,fontSize:11,height:24,padding:"0 4px",border:"1px solid var(--bd3)",borderRadius:4,background:"var(--sf)",color:"var(--tx)"}}>
              <option value="coeff">Coeff. ×</option><option value="fixe">Montant €</option>
            </select>
            <input type="number" step={mm==="coeff"?0.05:50} value={mv||""} placeholder={mm==="coeff"?"1.25":"500"} onChange={e=>upd(n=>{n.MARGE_VAL={...n.MARGE_VAL,[`${lk}${m.id}`]:parseFloat(e.target.value)||0};})} style={{width:54,fontSize:11,height:24,textAlign:"right",border:"1px solid var(--bd3)",borderRadius:4,background:"var(--sf)",color:"var(--tx)",padding:"0 4px"}}/>
            {(mt-mb)>0&&<span style={{fontSize:11,fontWeight:500,color:"var(--amb)",whiteSpace:"nowrap"}}>+{fmt(mt-mb)}</span>}
          </div>
        )}
        <span style={{fontSize:13,fontWeight:600,color:"var(--tx)",minWidth:64,textAlign:"right"}}>{fmt(mt)}</span>
      </div>
      {open&&<div style={{padding:"0 14px 12px"}}>
        {m.mo.map((l,i)=><LineCardMO key={l.id} lk={lk} mid={m.id} l={l} st={st} setST={setST} allMO={m.mo} allMAT={m.mat} idx={i} clientMode={clientMode}/>)}
        {m.mat.map((x,i)=><LineCardMat key={x.id} lk={lk} mid={m.id} x={x} st={st} setST={setST} allMO={m.mo} allMAT={m.mat} idx={i} clientMode={clientMode}/>)}
      </div>}
    </div>
  );
}
