import React from "react";
import { joursChantier, moLV, fmt } from "../lib/calculs.js";

export default function LineCardMO({lk,mid,l,st,setST,allMO,allMAT,clientMode}) {
  const nk=`${lk}${mid}${l.id}`, lkey=`mo_${nk}`;
  const open=st.LINE_OPEN[lkey]??true, mode=st.MO_MODE[nk]??"jours";
  const j=Number(st.MO_J[nk]??l.jRef.sug), tx=Number(st.MO_TX[nk]??l.txRef.sug);
  const nb=Number(st.MO_NB[nk]??1);
  const jChantier = mode==="jours" ? joursChantier(j, nb, l.metierName||"") : null;
  const forf=st.MO_FORF[nk]||"", note=st.NOTES[nk]||"", no=st.NOTES_OPEN[nk];
  const val=moLV(st,lk,mid,l);
  const upd=fn=>setST(prev=>{const n={...prev};fn(n);return n;});
  const toggle=()=>{
    if (clientMode) return;
    if (window.__ONA_FOCUS__) {
      upd(n=>{const nl={...n.LINE_OPEN};allMO.forEach(o=>{nl[`mo_${lk}${mid}${o.id}`]=o.id===l.id?!open:false;});allMAT.forEach(x=>{nl[`mat_${lk}${mid}${x.id}`]=false;});n.LINE_OPEN=nl;});
    } else { upd(n=>{n.LINE_OPEN={...n.LINE_OPEN,[lkey]:!open};}); }
  };
  return (
    <div style={{border:"1px solid var(--bd)",borderRadius:8,marginTop:8,overflow:"hidden"}}>
      <div onClick={toggle} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:"var(--sf)",cursor:clientMode?"default":"pointer",userSelect:"none"}}
        onMouseEnter={e=>{if(!clientMode)e.currentTarget.style.filter="brightness(.97)";}}
        onMouseLeave={e=>e.currentTarget.style.filter=""}>
        <div style={{display:"flex",alignItems:"center",flex:1,minWidth:0}}>
          {!clientMode&&<span style={{fontSize:9,color:"var(--tx3)",marginRight:6,display:"inline-block",transform:open?"rotate(90deg)":"none",transition:"transform .15s"}}>▶</span>}
          <span style={{fontSize:13,fontWeight:600,color:"var(--tx)"}}>{l.label}</span>
          <span style={{fontSize:10,fontWeight:500,padding:"2px 7px",borderRadius:8,marginLeft:7,background:"var(--bbg)",color:"var(--btx)"}}>MO</span>
          {!clientMode&&<span onClick={e=>{e.stopPropagation();upd(n=>{n.NOTES_OPEN={...n.NOTES_OPEN,[nk]:!no};});}} style={{fontSize:11,color:note.trim()?"var(--amb)":"var(--tx4)",cursor:"pointer",padding:"0 6px",borderLeft:"1px solid var(--bd)",marginLeft:6}}>✎</span>}
        </div>
        <div style={{fontSize:13,fontWeight:600,color:"var(--tx)",whiteSpace:"nowrap",marginLeft:8}}>{fmt(val)}</div>
      </div>
      {!clientMode&&no&&<div style={{padding:"6px 12px 8px",borderTop:"1px solid var(--bd)",background:"var(--sf3)"}}><textarea rows={2} value={note} placeholder="Note interne…" onChange={e=>upd(n=>{n.NOTES={...n.NOTES,[nk]:e.target.value};})} style={{width:"100%",padding:"5px 8px",fontSize:12,border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)",resize:"none",fontFamily:"inherit"}}/></div>}
      {!clientMode&&open&&(
        <div style={{display:"flex",alignItems:"flex-end",gap:8,padding:"7px 12px 9px",background:"var(--sf3)",borderTop:"1px solid var(--bd)",flexWrap:"wrap"}}>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            <label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Mode</label>
            <select value={mode} onChange={e=>upd(n=>{n.MO_MODE={...n.MO_MODE,[nk]:e.target.value};})} style={{width:110,fontSize:12,height:26,padding:"0 6px",border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)"}}>
              <option value="jours">Jours × tarif</option><option value="forfait">Forfait global</option>
            </select>
          </div>
          <div style={{width:1,height:22,background:"var(--bd)",alignSelf:"flex-end",flexShrink:0}}/>
          {mode==="jours"?<>
            <div style={{display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Jours</label><input type="number" step={0.25} value={j} onChange={e=>upd(n=>{n.MO_J={...n.MO_J,[nk]:parseFloat(e.target.value)||0};})} style={{width:48,fontSize:12,height:26,textAlign:"right",border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)",padding:"0 6px"}}/></div>
            <span style={{fontSize:11,color:"var(--tx3)",alignSelf:"flex-end",paddingBottom:3}}>×</span>
            <div style={{display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Tarif/j</label><input type="number" step={10} value={tx} onChange={e=>upd(n=>{n.MO_TX={...n.MO_TX,[nk]:parseFloat(e.target.value)||0};})} style={{width:62,fontSize:12,height:26,textAlign:"right",border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)",padding:"0 6px"}}/></div>
            <span style={{fontSize:11,color:"var(--tx3)",alignSelf:"flex-end",paddingBottom:3}}>€/j</span>
            <div style={{width:1,height:22,background:"var(--bd)",alignSelf:"flex-end",flexShrink:0}}/>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              <label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Travailleurs</label>
              <select value={nb} onChange={e=>upd(n=>{n.MO_NB={...n.MO_NB,[nk]:parseInt(e.target.value)||1};})}
                style={{width:52,fontSize:12,height:26,padding:"0 4px",border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)"}}>
                {[1,2,3,4].map(v=><option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            {nb > 1 && <>
              <div style={{width:1,height:22,background:"var(--bd)",alignSelf:"flex-end",flexShrink:0}}/>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                <label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Dép./trav./j</label>
                <input type="number" step={5} value={st.MO_DEP[nk]??0}
                  placeholder="0"
                  onChange={e=>upd(n=>{n.MO_DEP={...n.MO_DEP,[nk]:parseFloat(e.target.value)||0};})}
                  style={{width:52,fontSize:12,height:26,textAlign:"right",border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)",padding:"0 6px"}}/>
              </div>
              <span style={{fontSize:11,color:"var(--tx3)",alignSelf:"flex-end",paddingBottom:3}}>€</span>
              <div style={{display:"flex",flexDirection:"column",gap:3,alignSelf:"flex-end"}}>
                <div style={{fontSize:11,padding:"4px 8px",background:"var(--gbg)",color:"var(--gtx)",borderRadius:6,whiteSpace:"nowrap",fontWeight:500}}>
                  ⏱ {jChantier}j · +{fmt((nb-1)*(st.MO_DEP[nk]??0)*jChantier)} dép.
                </div>
              </div>
            </>}
          </>:<>
            <div style={{display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Forfait HT</label><input type="number" step={50} value={forf} placeholder="0" onChange={e=>upd(n=>{n.MO_FORF={...n.MO_FORF,[nk]:parseFloat(e.target.value)||0};})} style={{width:80,fontSize:12,height:26,textAlign:"right",border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)",padding:"0 6px"}}/></div>
            <span style={{fontSize:11,color:"var(--tx3)",alignSelf:"flex-end",paddingBottom:3}}>€</span>
          </>}
          <span style={{fontSize:10,color:"var(--tx3)",background:"var(--sf)",border:"1px solid var(--bd)",borderRadius:8,padding:"3px 8px",whiteSpace:"nowrap",alignSelf:"flex-end",marginLeft:"auto"}}>Réf. {l.txRef.lo}–{l.txRef.hi} €/j</span>
        </div>
      )}
    </div>
  );
}
