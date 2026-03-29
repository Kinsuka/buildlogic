import React from "react";

export default function HistoryPanel({versions,activeVer,onRestore,onDelete,onClose}) {
  return (
    <div style={{background:"var(--sf)",border:"1px solid var(--bd)",borderRadius:10,marginBottom:"1rem",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"var(--sf2)",borderBottom:"1px solid var(--bd)"}}>
        <span style={{fontSize:13,fontWeight:600,color:"var(--tx)"}}>Historique des versions</span>
        <button onClick={onClose} style={{background:"none",border:"1px solid var(--bd2)",borderRadius:8,padding:"4px 10px",fontSize:12,cursor:"pointer",color:"var(--tx2)"}}>✕ Fermer</button>
      </div>
      {versions.length===0
        ?<div style={{padding:"20px 14px",fontSize:12,color:"var(--tx3)",textAlign:"center"}}>Aucune version. Clique sur 💾 pour créer un point de restauration.</div>
        :[...versions].reverse().map(v=>(
          <div key={v.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:"1px solid var(--bd)",background:activeVer===v.id?"var(--bbg)":"transparent"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:"var(--tx)"}}>{v.label}{activeVer===v.id&&<span style={{fontSize:10,color:"var(--btx)",fontWeight:400,marginLeft:6}}>(active)</span>}</div>
              <div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>{v.date} à {v.time}</div>
            </div>
            <div style={{fontSize:12,fontWeight:500,color:"var(--tx)",whiteSpace:"nowrap",marginRight:8}}>{Math.round(v.grandTotal).toLocaleString("fr-BE")} €</div>
            <div style={{display:"flex",gap:6}}>
              {activeVer!==v.id?<button onClick={()=>onRestore(v.id)} style={{padding:"4px 10px",fontSize:11,fontWeight:500,border:"none",borderRadius:5,background:"var(--bbg)",color:"var(--btx)",cursor:"pointer"}}>↩ Restaurer</button>:<span style={{fontSize:11,color:"var(--btx)",padding:"0 6px"}}>Active</span>}
              <button onClick={()=>onDelete(v.id)} style={{padding:"4px 10px",fontSize:11,fontWeight:500,border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx2)",cursor:"pointer"}}>🗑</button>
            </div>
          </div>
        ))
      }
    </div>
  );
}
