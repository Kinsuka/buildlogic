import React from "react";
import { Modal } from "./Modal.jsx";

export default function RapportModal({onClose,PROJECT}) {
  return (
    <Modal title={`📋 Rapport de visite — ${PROJECT.client}, ${PROJECT.adresse}`} sub={`Visite du ${PROJECT.dateVisite}`} onClose={onClose}>
      <div style={{padding:"20px 24px",fontSize:13,lineHeight:1.8,color:"var(--tx)"}}>
        <div style={{background:"var(--bbg)",borderLeft:"3px solid var(--bbd)",borderRadius:"0 6px 6px 0",padding:"10px 14px",marginBottom:20,fontSize:12,color:"var(--tx2)"}}>Vérifie que le budget couvre bien toutes les demandes initiales du client.</div>
        <h3 style={{fontSize:13,fontWeight:700,marginBottom:8,paddingBottom:6,borderBottom:"1px solid var(--bd)"}}>🏠 Informations générales</h3>
        <p style={{marginBottom:16}}><strong>Client :</strong> {PROJECT.client}<br/><strong>Bien :</strong> {PROJECT.adresse}<br/><strong>Statut :</strong> Rénovation (+10 ans) → TVA {PROJECT.tva}% applicable<br/><strong>Validité :</strong> {PROJECT.validite} jours</p>
        <h3 style={{fontSize:13,fontWeight:700,marginBottom:8,paddingBottom:6,borderBottom:"1px solid var(--bd)"}}>📐 Lots prévus</h3>
        {PROJECT.lots.map(l=>(
          <div key={l.id} style={{marginBottom:12}}>
            <strong>{l.title}</strong> — {l.meta}
            <ul style={{fontSize:12,marginTop:4}}>
              <li>Métiers : {l.metiers.map(m=>m.name).join(", ")}</li>
              <li>Séquence : {(l.sequence||[]).join(" → ")}</li>
            </ul>
          </div>
        ))}
        {PROJECT.suspens&&PROJECT.suspens.length>0&&<>
          <h3 style={{fontSize:13,fontWeight:700,marginBottom:8,paddingBottom:6,borderBottom:"1px solid var(--bd)"}}>⚠️ Points en suspens</h3>
          <ul style={{fontSize:12}}>{PROJECT.suspens.map((s,i)=><li key={i} style={{color:s.niveau==="rouge"?"var(--rtx)":"var(--amb)",marginBottom:4}}>{s.txt}</li>)}</ul>
        </>}
      </div>
    </Modal>
  );
}
