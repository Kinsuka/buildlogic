import React from "react";

export default function Toast({msg}) {
  if (!msg) return null;
  return <div style={{position:"fixed",bottom:16,right:16,background:"var(--tx)",color:"var(--bg)",borderRadius:8,padding:"9px 14px",fontSize:12,fontWeight:500,zIndex:999,pointerEvents:"none"}}>{msg}</div>;
}
