import React from "react";

export function Modal({title,sub,onClose,children,maxWidth}) {
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{display:"flex",position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:1000,alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"var(--sf)",borderRadius:12,maxWidth:maxWidth||720,width:"100%",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderBottom:"1px solid var(--bd)",background:"var(--sf2)",flexShrink:0}}>
          <div><div style={{fontSize:14,fontWeight:700,color:"var(--tx)"}}>{title}</div>{sub&&<div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>{sub}</div>}</div>
          <button onClick={onClose} style={{background:"none",border:"1px solid var(--bd2)",borderRadius:8,padding:"4px 10px",fontSize:13,cursor:"pointer",color:"var(--tx2)"}}>✕</button>
        </div>
        <div style={{overflowY:"auto",flex:1}}>{children}</div>
      </div>
    </div>
  );
}

export function CopyBox({text}) {
  return (
    <div style={{padding:"16px 18px",borderTop:"2px solid var(--bd)"}}>
      <div style={{fontSize:11,fontWeight:600,color:"var(--tx3)",marginBottom:8,textTransform:"uppercase",letterSpacing:".05em"}}>📋 Version texte — cliquer pour tout sélectionner</div>
      <textarea readOnly value={text} onFocus={e=>e.target.select()} style={{width:"100%",minHeight:180,padding:"10px 12px",fontSize:11,fontFamily:"monospace",lineHeight:1.8,border:"1px solid var(--bd2)",borderRadius:6,background:"var(--sf2)",color:"var(--tx)",resize:"vertical"}}/>
    </div>
  );
}
