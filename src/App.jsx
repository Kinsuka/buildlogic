// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ONA Group — BuildLogic v8 NETLIFY
// Supabase JS direct — zéro proxy LLM — < 300ms partout
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { GL, fmt, moLV, matLV, metierTotal, lotTotals, grandTotalGamme, makeInitialST } from "./lib/calculs.js";
import { cache, loadProjectsList, loadProject } from "./lib/projects.js";
import { APP_CSS } from "./lib/appCss.js";
import { REFERENTIEL_SNAPSHOT } from "./lib/referentielSnapshot.js";
import Toast from "./components/Toast.jsx";
import BtnMenu from "./components/BtnMenu.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import LotCard from "./components/LotCard.jsx";
import HistoryPanel from "./components/HistoryPanel.jsx";
import RapportModal from "./components/RapportModal.jsx";
import FicheMetiersModal from "./components/FicheMetiersModal.jsx";
import FicheClientModal from "./components/FicheClientModal.jsx";
import NewProjectModal from "./components/NewProjectModal.jsx";
import HowToStartModal from "./components/HowToStartModal.jsx";
import DocumentationModal from "./components/DocumentationModal.jsx";
import ProjSelectorModal from "./components/ProjSelectorModal.jsx";
import ReferentielModal from "./components/ReferentielModal.jsx";

const EMPTY_ST = {
  MO_MODE: {},
  MO_J: {},
  MO_TX: {},
  MO_FORF: {},
  MO_NB: {},
  MO_DEP: {},
  MAT_PROP: {},
  MAT_GAMME: {},
  MAT_PRIX: {},
  MAT_QTY: {},
  MAT_DIM: {},
  MAT_DIM_M2: {},
  NOTES: {},
  NOTES_OPEN: {},
  MARGE_MODE: {},
  MARGE_VAL: {},
  IMPREVU_MODE: {},
  IMPREVU_VAL: {},
  LINE_OPEN: {},
  lotOpen: {},
  metierOpen: {},
};

function normalizeProject(proj, fallbackClient) {
  if (!proj) return null;

  return {
    ...proj,
    client: proj.client || fallbackClient,
    lots: Array.isArray(proj.lots)
      ? proj.lots.map((lot) => ({
          ...lot,
          sequence: Array.isArray(lot.sequence) ? lot.sequence : [],
        }))
      : [],
    suspens: Array.isArray(proj.suspens) ? proj.suspens : [],
  };
}

export default function App() {
  const [PROJECT, setPROJECT] = useState(null);
  const [projLoading, setProjLoading] = useState(false);
  const [projError, setProjError] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [projListLoading, setProjListLoading] = useState(false);
  const [showProjSelector, setShowProjSelector] = useState(false);
  const [showNewProj, setShowNewProj] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showDoc, setShowDoc] = useState(false);

  const [st, setST] = useState(EMPTY_ST);
  const [stProjectId, setStProjectId] = useState(null);
  const [versions, setVersions] = useState([]);
  const [activeVer, setActiveVer] = useState(null);
  const [dark, setDark] = useState(() => localStorage.getItem("ona_dark") === "1");
  const [focus, setFocus] = useState(false);
  const [cMode, setCMode] = useState(false);
  const [gammes, setGammes] = useState(false);
  const [showH, setShowH] = useState(false);
  const [showR, setShowR] = useState(false);
  const [showRef, setShowRef] = useState(false);
  const [showM, setShowM] = useState(false);
  const [showC, setShowC] = useState(false);
  const [toast, setToast] = useState("");
  const [REF, setREF] = useState(null);
  const [refLoading, setRefLoading] = useState(true);
  const [refError, setRefError] = useState(null);
  const [menu, setMenu] = useState(false);
  const tRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setToast(""), 3000);
  }, []);

  window.__ONA_FOCUS__ = focus;

  useEffect(() => {
    if (dark) {
      document.documentElement.setAttribute("data-dark", "");
      localStorage.setItem("ona_dark", "1");
    } else {
      document.documentElement.removeAttribute("data-dark");
      localStorage.setItem("ona_dark", "0");
    }
  }, [dark]);

  useEffect(() => {
    setREF(REFERENTIEL_SNAPSHOT);
    setRefLoading(false);

    (async () => {
      try {
        const list = await loadProjectsList();
        setProjectsList(list);
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    if (!PROJECT) {
      setStProjectId(null);
      return;
    }

    const initST = makeInitialST(PROJECT);
    setST(initST);
    setStProjectId(PROJECT.storeKey);
    setVersions([]);
    setActiveVer(null);

    (async () => {
      let data = null;
      try {
        const r = await cache.get(PROJECT.storeKey);
        if (r?.value) data = JSON.parse(r.value);
      } catch (e) {}

      if (!data) {
        try {
          const r = localStorage.getItem(PROJECT.storeKey);
          if (r) data = JSON.parse(r);
        } catch (e) {}
      }

      if (data) {
        try {
          if (data.versions) setVersions(data.versions);
          if (data.activeVer) setActiveVer(data.activeVer);
          if (data.ST) {
            setST(() => {
              const base = makeInitialST(PROJECT);
              const merged = {...base};
              const validKeys = [
                "MO_MODE",
                "MO_J",
                "MO_TX",
                "MO_FORF",
                "MO_NB",
                "MO_DEP",
                "MAT_PROP",
                "MAT_GAMME",
                "MAT_PRIX",
                "MAT_QTY",
                "MAT_DIM",
                "MAT_DIM_M2",
                "NOTES",
                "NOTES_OPEN",
                "MARGE_MODE",
                "MARGE_VAL",
                "IMPREVU_MODE",
                "IMPREVU_VAL",
                "LINE_OPEN",
                "lotOpen",
                "metierOpen",
              ];

              validKeys.forEach((k) => {
                if (data.ST[k] && typeof data.ST[k] === "object") {
                  merged[k] = {...(base[k] || {}), ...data.ST[k]};
                }
              });

              return merged;
            });
          }
        } catch (e) {
          try {
            localStorage.removeItem(PROJECT.storeKey);
          } catch (_) {}
        }
      }
    })();
  }, [PROJECT]);

  const handleProjectCreated = useCallback((proj) => {
    setShowNewProj(false);
    setPROJECT(proj);
    setProjectsList([]);
    showToast(`✅ Projet ${proj.client} créé`);
  }, [showToast]);

  const handleRefreshList = useCallback(async () => {
    setProjListLoading(true);
    try {
      try {
        await cache.delete("ona_proj_list");
      } catch (e) {}
      const list = await loadProjectsList();
      setProjectsList(Array.isArray(list) ? list : []);
    } catch (e) {}
    setProjListLoading(false);
  }, []);

  const handleOpenSelector = useCallback(async () => {
    setShowProjSelector(true);
    if (projectsList.length > 0) return;

    setProjListLoading(true);
    try {
      try {
        await cache.delete("ona_proj_list");
      } catch (e) {}
      const list = await loadProjectsList();
      setProjectsList(Array.isArray(list) ? list : []);
    } catch (e) {}
    setProjListLoading(false);
  }, [projectsList]);

  const handleLoadProject = useCallback(async (projectId, clientNom) => {
    setShowProjSelector(false);
    setProjLoading(true);
    setProjError(null);

    try {
      const fromList = projectsList.find((p) => p.id === projectId);
      if (fromList?.projet_json) {
        const proj = normalizeProject(fromList.projet_json, fromList.client_nom || clientNom);
        setPROJECT(proj);
        showToast(`✅ ${proj.client} chargé`);
        setProjLoading(false);
        return;
      }

      const proj = await loadProject(projectId);
      if (!proj) throw new Error("Projet introuvable ou projet_json manquant");

      const normalized = normalizeProject(proj, clientNom);
      setPROJECT(normalized);
      showToast(`✅ ${normalized.client} chargé`);
    } catch (e) {
      setProjError(e.message);
      showToast(`⚠️ Erreur : ${e.message}`);
    }

    setProjLoading(false);
  }, [projectsList, showToast]);

  const saveData = useCallback(async (nv, na, ns) => {
    if (!PROJECT) return null;
    const p = JSON.stringify({versions: nv, activeVer: na, ST: ns});
    try {
      await cache.set(PROJECT.storeKey, p);
      return "storage";
    } catch (e) {}
    try {
      localStorage.setItem(PROJECT.storeKey, p);
      return "local";
    } catch (e) {}
    return null;
  }, [PROJECT]);

  const handleSave = useCallback(async () => {
    if (!PROJECT) return;
    const n = versions.length + 1;
    const d = new Date();
    const ds = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    const ts = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const gt = PROJECT.lots.reduce((s, lot) => s + lotTotals(st, lot).total, 0);
    const ver = {id: Date.now(), label: `v${n}`, date: ds, time: ts, grandTotal: gt, snap: JSON.parse(JSON.stringify(st))};
    const nv = [...versions, ver];
    setVersions(nv);
    setActiveVer(ver.id);
    const mode = await saveData(nv, ver.id, st);
    showToast(mode === "storage" ? `✅ v${n} sauvegardée` : mode === "local" ? `✅ v${n} (localStorage)` : "⚠️ Sauvegarde indisponible");
  }, [st, versions, saveData, showToast, PROJECT]);

  const handleRestore = useCallback((id) => {
    const ver = versions.find((v) => v.id === id);
    if (!ver || !confirm(`Restaurer "${ver.label}" ?\nModifications perdues.`)) return;
    setST(JSON.parse(JSON.stringify(ver.snap)));
    setActiveVer(id);
    showToast(`↩ ${ver.label} restaurée`);
  }, [versions, showToast]);

  const handleDelete = useCallback((id) => {
    const ver = versions.find((v) => v.id === id);
    if (!ver || !confirm(`Supprimer "${ver.label}" ?`)) return;
    const nv = versions.filter((v) => v.id !== id);
    setVersions(nv);
    setActiveVer(activeVer === id ? (nv.length ? nv[nv.length - 1].id : null) : activeVer);
    showToast("🗑 Version supprimée");
  }, [versions, activeVer, showToast]);

  const exportMD = useCallback((forClient) => {
    if (!PROJECT) return;

    const date = new Date().toLocaleDateString("fr-BE", {year:"numeric",month:"long",day:"numeric"});
    const fE = (n) => Math.round(n).toLocaleString("fr-BE") + " €";
    let md = `# Proposition budgétaire — ONA Group\n\n**Client :** ${PROJECT.client}  \n**Bien :** ${PROJECT.adresse}  \n**Date :** ${date}  \n**Contact :** +32 469/43.56.38 · invoices@onagroup.be\n\n---\n\n`;

    PROJECT.lots.forEach((lot) => {
      const {total, imprevu} = lotTotals(st, lot);
      md += `## ${lot.title}\n> ${lot.meta}\n\n`;
      lot.metiers.forEach((m) => {
        const mt = metierTotal(st, lot.id, m);
        md += `### ${m.name}\n\n| Désignation | Type | Montant HTVA |\n|---|:---:|---:|\n`;
        m.mo.forEach((l) => {
          const note = st.NOTES[`${lot.id}${m.id}${l.id}`];
          md += `| ${l.label} | MO | ${fE(moLV(st, lot.id, m.id, l))} |\n`;
          if (!forClient && note?.trim()) md += `| ↳ *${note}* | | |\n`;
        });
        m.mat.forEach((x) => {
          const pi = Math.min(st.MAT_PROP[`${lot.id}${m.id}${x.id}`] ?? 0, (x.props?.length || 1) - 1);
          const g = st.MAT_GAMME[`${lot.id}${m.id}${x.id}`] ?? "std";
          const note = st.NOTES[`${lot.id}${m.id}${x.id}`];
          const pname = x.props?.[pi]?.name ?? "";
          md += `| ${x.label}${pname ? ` — ${pname}` : ""}${forClient ? "" : ` (${GL[g]})`} | Mat. | ${fE(matLV(st, lot.id, m.id, x))} |\n`;
          if (!forClient && note?.trim()) md += `| ↳ *${note}* | | |\n`;
        });
        md += `| **Total ${m.name}** | | **${fE(mt)}** |\n\n`;
      });
      if (!forClient && imprevu > 0) md += `> ⚠️ **Provision imprévus : ${fE(imprevu)}**\n\n`;
      md += `**Ordre d'intervention :** ${(lot.sequence || []).map((s, i) => `${i + 1}. ${s}`).join(" · ")}\n\n> **Total ${lot.title} : ${fE(total)}** *(imprévus inclus)*\n\n---\n\n`;
    });

    const gt = PROJECT.lots.reduce((s, lot) => s + lotTotals(st, lot).total, 0);
    md += `## Récapitulatif\n\n| | Montant |\n|---|---:|\n`;
    PROJECT.lots.forEach((lot) => {
      md += `| ${lot.title} | ${fE(lotTotals(st, lot).total)} |\n`;
    });
    md += `| | |\n| **Total HT** | **${fE(gt)}** |\n| TVA ${PROJECT.tva}% | **${fE(gt * (1 + PROJECT.tva / 100))}** |\n\n---\n\n*ONA Group SRL · Proposition non contractuelle · Prix HTVA · Valable ${PROJECT.validite} jours*\n`;

    const blob = new Blob([md], {type:"text/markdown;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ONA_${PROJECT.client}${forClient ? "_CLIENT" : "_INTERNE"}_${date.replace(/\s/g, "_")}.md`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    showToast(forClient ? "📤 Markdown client téléchargé" : "📋 Markdown interne téléchargé");
  }, [st, showToast, PROJECT]);

  const tots = useMemo(() => {
    if (!PROJECT) return [];
    try {
      return PROJECT.lots.map((lot) => lotTotals(st, lot));
    } catch (e) {
      return [];
    }
  }, [st, PROJECT]);

  const gBase = tots.reduce((s, t) => s + t.base, 0);
  const gMarge = tots.reduce((s, t) => s + t.marge, 0);
  const gImp = tots.reduce((s, t) => s + t.imprevu, 0);
  const gTotal = tots.reduce((s, t) => s + t.total, 0);
  const tStd = useMemo(() => {
    if (!PROJECT) return 0;
    try {
      return grandTotalGamme(st, "std", PROJECT);
    } catch (e) {
      return 0;
    }
  }, [st, PROJECT]);
  const tMid = useMemo(() => {
    if (!PROJECT) return 0;
    try {
      return grandTotalGamme(st, "mid", PROJECT);
    } catch (e) {
      return 0;
    }
  }, [st, PROJECT]);
  const tSup = useMemo(() => {
    if (!PROJECT) return 0;
    try {
      return grandTotalGamme(st, "sup", PROJECT);
    } catch (e) {
      return 0;
    }
  }, [st, PROJECT]);

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",color:"var(--tx)"}}>
      <style>{APP_CSS}</style>

      {!PROJECT && (
        <div style={{maxWidth:520,margin:"0 auto",padding:"4rem 1.5rem",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:16}}>🏗</div>
          <div style={{fontSize:22,fontWeight:700,color:"var(--tx)",marginBottom:8}}>BuildLogic</div>
          <div style={{fontSize:13,color:"var(--tx3)",marginBottom:32,lineHeight:1.7}}>
            Outil de budgétisation chantier ONA Group SRL.
            <br />
            Charge un projet existant ou démarre une nouvelle conversation.
          </div>
          {projLoading ? (
            <div style={{fontSize:13,color:"var(--tx3)",padding:"16px 0"}}>⏳ Chargement du projet…</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8,width:"100%",maxWidth:280}}>
              <button onClick={handleOpenSelector} style={{padding:"12px 28px",fontSize:14,fontWeight:600,border:"none",borderRadius:8,background:"var(--btx)",color:"#fff",cursor:"pointer"}}>
                📁 Charger un projet
              </button>
              <button onClick={() => setShowNewProj(true)} style={{padding:"10px 28px",fontSize:13,fontWeight:500,border:"1px solid var(--bd3)",borderRadius:8,background:"var(--sf)",color:"var(--tx)",cursor:"pointer"}}>
                ✚ Nouveau projet
              </button>
              <button onClick={() => setShowHowTo(true)} style={{padding:"8px 28px",fontSize:12,fontWeight:400,border:"none",borderRadius:8,background:"none",color:"var(--btx)",cursor:"pointer",textDecoration:"underline"}}>
                🚀 Comment démarrer ?
              </button>
            </div>
          )}
          {projError && <div style={{fontSize:12,color:"var(--rtx)",marginTop:12,padding:"8px 14px",background:"var(--rbg)",borderRadius:8}}>⚠️ {projError}</div>}
          <div style={{marginTop:32,padding:"14px 18px",background:"var(--sf)",border:"1px solid var(--bd)",borderRadius:10,width:"100%",maxWidth:360,textAlign:"left"}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Initialisation</div>
            <div style={{fontSize:12,display:"flex",flexDirection:"column",gap:6}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span>{refLoading ? "⏳" : refError ? "⚠️" : "✅"}</span>
                <span style={{color:refError ? "var(--rtx)" : "var(--tx2)"}}>
                  Référentiel {refLoading ? "en cours…" : refError ? "indisponible" : `${REF?.mat?.length || 0} mat · ${REF?.mo?.length || 0} MO`}
                </span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span>{refLoading ? "⏳" : projectsList.length === 0 ? "⏳" : "✅"}</span>
                <span style={{color:"var(--tx2)"}}>
                  Projets {refLoading ? "en attente…" : projectsList.length === 0 ? "chargement…" : `${projectsList.length} projet${projectsList.length > 1 ? "s" : ""} · prêt`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {PROJECT && stProjectId === PROJECT.storeKey && (
        <ErrorBoundary storeKey={PROJECT.storeKey} onReset={() => setPROJECT(null)}>
          <div style={{maxWidth:960,margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:"1rem",flexWrap:"wrap"}}>
              <span style={{fontSize:15,fontWeight:600,flex:1,color:"var(--tx)"}}>
                Budget {PROJECT.client}
                {cMode && <span style={{fontSize:11,fontWeight:500,marginLeft:8,color:"var(--gtx)",background:"var(--gbg)",padding:"2px 8px",borderRadius:8}}>Vue client</span>}
              </span>
              <button onClick={handleOpenSelector} style={{padding:"5px 12px",fontSize:11,fontWeight:500,border:"1px solid var(--bd3)",borderRadius:6,background:"var(--sf)",color:"var(--tx2)",cursor:"pointer",height:30}}>📁 Changer</button>
              <span style={{fontSize:11,color:"var(--tx3)",background:"#eee",borderRadius:8,padding:"2px 8px",border:"1px solid var(--bd2)"}}>{PROJECT.adresse}</span>
              <button onClick={handleSave} style={{padding:"5px 12px",fontSize:12,fontWeight:500,border:"none",borderRadius:6,background:"var(--bbg)",color:"var(--btx)",cursor:"pointer",height:30}}>💾 Sauvegarder</button>
              <button onClick={() => setFocus((f) => !f)} style={{padding:"5px 12px",fontSize:12,fontWeight:500,border:`1px solid ${focus ? "#8b5cf6" : "var(--bd3)"}`,borderRadius:6,background:focus ? "#ede9fe" : "var(--sf)",color:focus ? "#7c3aed" : "var(--tx)",cursor:"pointer",height:30,transition:"all .15s"}}>{focus ? "🎯 Focus" : "⊙ Focus"}</button>
              <button onClick={() => setShowR(true)} style={{padding:"5px 12px",fontSize:12,fontWeight:500,border:"1px solid var(--amb)",borderRadius:6,background:"var(--sf)",color:"var(--amb)",cursor:"pointer",height:30}}>📋 Rapport</button>

              <div style={{position:"relative"}}>
                <button onClick={() => setMenu((m) => !m)} style={{padding:"5px 10px",fontSize:14,fontWeight:700,border:"1px solid var(--bd3)",borderRadius:6,background:"var(--sf)",color:"var(--tx)",cursor:"pointer",height:30,letterSpacing:1}}>⋮</button>
                {menu && (
                  <div style={{position:"absolute",right:0,top:36,background:"var(--sf)",border:"1px solid var(--bd2)",borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,.15)",zIndex:200,minWidth:220,overflow:"hidden"}}>
                    <BtnMenu onClick={() => { setShowHowTo(true); setMenu(false); }}>🚀 Comment démarrer</BtnMenu>
                    <BtnMenu onClick={() => { setShowDoc(true); setMenu(false); }}>📚 Documentation</BtnMenu>
                    <BtnMenu onClick={() => { setShowH((h) => !h); setMenu(false); }}>🕓 Historique <span style={{marginLeft:"auto",fontSize:10,background:"var(--bbg)",color:"var(--btx)",borderRadius:8,padding:"1px 6px"}}>{versions.length}</span></BtnMenu>
                    <BtnMenu onClick={() => { setShowRef(true); setMenu(false); }}>📊 Référentiel tarifs</BtnMenu>
                    <BtnMenu onClick={() => { setShowM(true); setMenu(false); }}>👷 Fiche par métier</BtnMenu>
                    <BtnMenu onClick={() => { setShowC(true); setMenu(false); }}>📄 Fiche client</BtnMenu>
                    <BtnMenu onClick={() => { exportMD(false); setMenu(false); }}>⬇ Export Markdown interne</BtnMenu>
                    <BtnMenu onClick={() => { exportMD(true); setMenu(false); }}>📤 Export Markdown client</BtnMenu>
                    <BtnMenu onClick={() => { setGammes((g) => !g); setMenu(false); }} active={gammes} color="var(--btx)" bg="var(--bbg)">{gammes ? "🎨 Masquer fourchettes" : "🎨 Afficher fourchettes"}</BtnMenu>
                    <BtnMenu onClick={() => { setCMode((c) => !c); setMenu(false); }} active={cMode} color="var(--gtx)" bg="var(--gbg)">{cMode ? "🔒 Mode interne" : "👁 Vue client"}</BtnMenu>
                    <BtnMenu onClick={() => { setDark((d) => !d); setMenu(false); }} last>{dark ? "☀️ Mode clair" : "🌙 Mode sombre"}</BtnMenu>
                  </div>
                )}
              </div>
            </div>

            {showH && <HistoryPanel versions={versions} activeVer={activeVer} onRestore={handleRestore} onDelete={handleDelete} onClose={() => setShowH(false)} />}

            <div style={{display:"grid",gridTemplateColumns:"repeat(5,minmax(0,1fr))",gap:8,marginBottom:"1rem"}}>
              {cMode ? (
                <>
                  <div style={{background:"var(--sf)",borderRadius:8,padding:"11px 13px",border:"1px solid var(--gbd)",gridColumn:"span 3"}}>
                    <div style={{fontSize:11,color:"var(--tx3)",marginBottom:3}}>Prix vente HT</div>
                    <div style={{fontSize:18,fontWeight:600}}>{fmt(gTotal)}</div>
                    <div style={{fontSize:10,color:"var(--tx3)",marginTop:2}}>toutes prestations incluses</div>
                  </div>
                  <div style={{background:"var(--sf)",borderRadius:8,padding:"11px 13px",border:"1px solid var(--bd)",gridColumn:"span 2"}}>
                    <div style={{fontSize:11,color:"var(--tx3)",marginBottom:3}}>TVA {PROJECT.tva}%</div>
                    <div style={{fontSize:18,fontWeight:600}}>{fmt(gTotal * (1 + PROJECT.tva / 100))}</div>
                    <div style={{fontSize:10,color:"var(--tx3)",marginTop:2}}>bât. +10 ans</div>
                  </div>
                </>
              ) : (
                [
                  {l:"Coût total HT",v:fmt(gBase),s:"MO + matériaux"},
                  {l:"Marge totale",v:fmt(gMarge),s:`${gTotal > 0 ? Math.round(gMarge / gTotal * 100) : 0}% prix vente`},
                  {l:"Provision imprévus",v:fmt(gImp),s:`${gTotal > 0 ? Math.round(gImp / gTotal * 100) : 0}% du total`,accent:"var(--rtx)"},
                  {l:"Prix vente HT",v:fmt(gTotal),s:"imprévus inclus",border:"var(--gbd)"},
                  {l:`TVA ${PROJECT.tva}%`,v:fmt(gTotal * (1 + PROJECT.tva / 100)),s:"bât. +10 ans"},
                ].map(({l, v, s, accent, border}) => (
                  <div key={l} style={{background:"var(--sf)",borderRadius:8,padding:"11px 13px",border:`1px solid ${border || "var(--bd)"}`}}>
                    <div style={{fontSize:11,color:"var(--tx3)",marginBottom:3}}>{l}</div>
                    <div style={{fontSize:18,fontWeight:600,color:accent || "var(--tx)"}}>{v}</div>
                    <div style={{fontSize:10,color:"var(--tx3)",marginTop:2}}>{s}</div>
                  </div>
                ))
              )}
            </div>

            {!cMode && gammes && (
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:"1.5rem"}}>
                {[{l:"Si tout Standard",v:fmt(tStd),c:"var(--btx)",bg:"var(--bbg)",bd:"var(--bbd)"},{l:"Si tout Mid",v:fmt(tMid),c:"var(--amb)",bg:"#fffbeb",bd:"var(--amb)"},{l:"Si tout Supérieur",v:fmt(tSup),c:"var(--gtx)",bg:"var(--gbg)",bd:"var(--gbd)"}].map(({l, v, c, bg, bd}) => (
                  <div key={l} style={{background:bg,borderRadius:8,padding:"9px 13px",border:`1px solid ${bd}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:11,color:c,fontWeight:500}}>{l}</span>
                    <span style={{fontSize:14,fontWeight:700,color:c}}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            {PROJECT.lots.map((lot) => <LotCard key={lot.id} lot={lot} st={st} setST={setST} clientMode={cMode} />)}

            {cMode ? (
              <div style={{fontSize:11,color:"var(--tx3)",borderLeft:"3px solid var(--gbd)",borderRadius:"0 5px 5px 0",background:"var(--gbg)",padding:"8px 14px",marginTop:"1rem",lineHeight:1.7}}>
                Document établi par <strong>ONA Group SRL</strong> · Proposition non contractuelle · Prix HTVA · Valable {PROJECT.validite} jours · +32 469/43.56.38 · invoices@onagroup.be
              </div>
            ) : (
              <div style={{fontSize:11,color:"var(--tx3)",borderLeft:"3px solid var(--bbd)",borderRadius:"0 5px 5px 0",background:"var(--bbg)",padding:"8px 14px",marginTop:"1rem",lineHeight:1.7}}>
                {refLoading ? "⏳ Chargement référentiel Supabase…" : refError ? `⚠️ Référentiel indisponible (${refError})` : `✅ Référentiel live · ${REF?.mat?.length || 0} matériaux · ${REF?.mo?.length || 0} corps de métier`}
                {" — "}
                <span style={{cursor:"pointer",textDecoration:"underline",color:"var(--btx)"}} onClick={() => setShowRef(true)}>📊 Voir référentiel</span>
              </div>
            )}
          </div>
        </ErrorBoundary>
      )}

      {showR && PROJECT && <RapportModal onClose={() => setShowR(false)} PROJECT={PROJECT} />}
      {showRef && <ReferentielModal onClose={() => setShowRef(false)} REF={REF} />}
      {showM && PROJECT && <FicheMetiersModal st={st} onClose={() => setShowM(false)} PROJECT={PROJECT} />}
      {showC && PROJECT && <FicheClientModal st={st} onClose={() => setShowC(false)} PROJECT={PROJECT} />}
      {showProjSelector && <ProjSelectorModal onClose={() => setShowProjSelector(false)} projListLoading={projListLoading} projectsList={projectsList} onLoadProject={handleLoadProject} onRefresh={handleRefreshList} />}
      {showNewProj && <NewProjectModal onClose={() => setShowNewProj(false)} onCreated={handleProjectCreated} />}
      {showHowTo && <HowToStartModal onClose={() => setShowHowTo(false)} />}
      {showDoc && <DocumentationModal onClose={() => setShowDoc(false)} />}
      <Toast msg={toast} />
    </div>
  );
}
