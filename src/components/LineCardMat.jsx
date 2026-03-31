import React from "react";
import { matLV, fmt } from "../lib/calculs.js";

export default function LineCardMat({lk,mid,x,st,setST,allMO,allMAT,clientMode}) {
  const nk=`${lk}${mid}${x.id}`, lkey=`mat_${nk}`;
  const open=st.LINE_OPEN[lkey]??true;
  const pi=Math.min(st.MAT_PROP[nk]??0, (x.props?.length||1)-1);
  const g=st.MAT_GAMME[nk]??"std";
  const safeProps = x.props?.[pi]?.[g] ? x.props[pi] : null;
  const td = safeProps?.[g] ?? {lo:0,sug:0,hi:0,name:"—"};
  const k=`${nk}${pi}${g}`, val=matLV(st,lk,mid,x);
  const note=st.NOTES[nk]||"", no=st.NOTES_OPEN[nk];
  const upd=fn=>setST(prev=>{const n={...prev};fn(n);return n;});
  const gC={std:"var(--btx)",mid:"var(--amb)",sup:"var(--gtx)"};
  const gB={std:"var(--bbd)",mid:"var(--amb)",sup:"var(--gbd)"};
  const qty=x.u?(st.MAT_QTY[nk]??(st.MAT_DIM_M2[nk]!=null?Math.ceil(st.MAT_DIM_M2[nk]*1.1):x.qBase)):null;
  const dim=st.MAT_DIM[nk]??x.dBase;
  const toggle=()=>{
    if (clientMode) return;
    if (window.__ONA_FOCUS__) {
      setST(prev=>{const n={...prev,LINE_OPEN:{...prev.LINE_OPEN}};(allMO||[]).forEach(l=>{n.LINE_OPEN[`mo_${lk}${mid}${l.id}`]=false;});(allMAT||[]).forEach(ox=>{n.LINE_OPEN[`mat_${lk}${mid}${ox.id}`]=ox.id===x.id?!open:false;});return n;});
    } else { setST(prev=>({...prev,LINE_OPEN:{...prev.LINE_OPEN,[lkey]:!open}})); }
  };
  return (
    <div data-testid={`mat-line-${nk}`} style={{border:"1px solid var(--bd)",borderRadius:8,marginTop:8,overflow:"hidden"}}>
      <div data-testid={`mat-line-toggle-${nk}`} onClick={toggle} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:"var(--sf)",cursor:clientMode?"default":"pointer",userSelect:"none"}}
        onMouseEnter={e=>{if(!clientMode)e.currentTarget.style.filter="brightness(.97)";}}
        onMouseLeave={e=>e.currentTarget.style.filter=""}>
        <div style={{display:"flex",alignItems:"center",flex:1,minWidth:0}}>
          {!clientMode&&<span style={{fontSize:9,color:"var(--tx3)",marginRight:6,display:"inline-block",transform:open?"rotate(90deg)":"none",transition:"transform .15s"}}>▶</span>}
          <span style={{fontSize:13,fontWeight:600,color:"var(--tx)"}}>{x.label}</span>
          {clientMode?<span style={{fontSize:10,color:"var(--tx3)",marginLeft:8}}>{x.props?.[pi]?.name??""}</span>:<span style={{fontSize:10,fontWeight:500,padding:"2px 7px",borderRadius:8,marginLeft:7,background:"var(--gbg)",color:"var(--gtx)"}}>Mat.</span>}
          {!clientMode&&<span onClick={e=>{e.stopPropagation();upd(n=>{n.NOTES_OPEN={...n.NOTES_OPEN,[nk]:!no};});}} style={{fontSize:11,color:note.trim()?"var(--amb)":"var(--tx4)",cursor:"pointer",padding:"0 6px",borderLeft:"1px solid var(--bd)",marginLeft:6}}>✎</span>}
        </div>
        <div style={{fontSize:13,fontWeight:600,color:"var(--tx)",whiteSpace:"nowrap",marginLeft:8}}>{fmt(val)}</div>
      </div>
      {!clientMode&&no&&<div style={{padding:"6px 12px 8px",borderTop:"1px solid var(--bd)",background:"var(--sf3)"}}><textarea rows={2} value={note} placeholder="Note interne…" onChange={e=>upd(n=>{n.NOTES={...n.NOTES,[nk]:e.target.value};})} style={{width:"100%",padding:"5px 8px",fontSize:12,border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)",resize:"none",fontFamily:"inherit"}}/></div>}
      {!clientMode&&open&&(
        <div style={{display:"flex",alignItems:"flex-end",gap:8,padding:"7px 12px 9px",background:"var(--sf3)",borderTop:"1px solid var(--bd)",flexWrap:"wrap"}}>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            <label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Type</label>
            <select data-testid={`mat-type-${nk}`} value={pi} onChange={e=>upd(n=>{n.MAT_PROP={...n.MAT_PROP,[nk]:parseInt(e.target.value)};})} style={{width:172,fontSize:12,height:26,padding:"0 6px",border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)"}}>
              {x.props.map((p,i)=><option key={i} value={i}>{p.name}</option>)}
            </select>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            <label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Gamme</label>
            <select data-testid={`mat-gamme-${nk}`} value={g} onChange={e=>upd(n=>{n.MAT_GAMME={...n.MAT_GAMME,[nk]:e.target.value};})} style={{width:104,fontSize:12,height:26,padding:"0 6px",border:`1px solid ${gB[g]}`,borderRadius:5,background:"var(--sf)",color:gC[g]}}>
              <option value="std">Standard</option><option value="mid">Mid</option><option value="sup">Supérieur</option>
            </select>
          </div>
          {x.u?<>
            <div style={{width:1,height:22,background:"var(--bd)",alignSelf:"flex-end",flexShrink:0}}/>
            <div style={{display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Prix/m²</label><input data-testid={`mat-prix-${nk}`} type="number" step={1} value={Number(st.MAT_PRIX[k]??td.sug)} onChange={e=>upd(n=>{n.MAT_PRIX={...n.MAT_PRIX,[k]:parseFloat(e.target.value)||0};})} style={{width:62,fontSize:12,height:26,textAlign:"right",border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)",padding:"0 6px"}}/></div>
            <span style={{fontSize:11,color:"var(--tx3)",alignSelf:"flex-end",paddingBottom:3}}>€/m²</span>
            <div style={{width:1,height:22,background:"var(--bd)",alignSelf:"flex-end",flexShrink:0}}/>
            <div style={{display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Dim.</label><input data-testid={`mat-dim-${nk}`} type="text" value={dim} onChange={e=>{const v=e.target.value;upd(n=>{n.MAT_DIM={...n.MAT_DIM,[nk]:v};const m=v.replace(",",".").match(/([\d.]+)\s*[x×X]\s*([\d.]+)/);if(m){n.MAT_DIM_M2={...n.MAT_DIM_M2,[nk]:parseFloat(m[1])*parseFloat(m[2])};const q={...n.MAT_QTY};delete q[nk];n.MAT_QTY=q;}});}} style={{width:68,fontSize:12,height:26,border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)",padding:"0 6px",textAlign:"right"}}/></div>
            <div style={{display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Qté m²</label><input data-testid={`mat-qty-${nk}`} type="number" step={1} value={qty} onChange={e=>upd(n=>{n.MAT_QTY={...n.MAT_QTY,[nk]:parseInt(e.target.value)||0};})} style={{width:50,fontSize:12,height:26,textAlign:"right",border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)",padding:"0 6px"}}/></div>
          </>:<>
            <div style={{width:1,height:22,background:"var(--bd)",alignSelf:"flex-end",flexShrink:0}}/>
            <div style={{display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Montant</label><input data-testid={`mat-montant-${nk}`} type="number" step={10} value={Number(st.MAT_PRIX[k]??td.sug)} onChange={e=>upd(n=>{n.MAT_PRIX={...n.MAT_PRIX,[k]:parseFloat(e.target.value)||0};})} style={{width:80,fontSize:12,height:26,textAlign:"right",border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)",padding:"0 6px"}}/></div>
            <span style={{fontSize:11,color:"var(--tx3)",alignSelf:"flex-end",paddingBottom:3}}>€</span>
          </>}
          <span style={{fontSize:10,color:"var(--tx3)",background:"var(--sf)",border:"1px solid var(--bd)",borderRadius:8,padding:"3px 8px",whiteSpace:"nowrap",alignSelf:"flex-end",marginLeft:"auto"}}>Réf. {td.lo}–{td.hi} {x.u?"€/m²":"€"}</span>
        </div>
      )}
    </div>
  );
}
