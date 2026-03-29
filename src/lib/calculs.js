// ─── Logique calcul BuildLogic ────────────────────────────

export const GL  = { std:"Standard", mid:"Mid", sup:"Supérieur" };
export const fmt = n => (isNaN(n)||n==="") ? "—" : Math.round(n).toLocaleString("fr-BE")+" €";

// Calcul jours chantier réels avec coefficient collectif par métier
export const COEFF_COLLECTIF = {
  "Carreleur":0.90,"Plombier":0.75,"Électricien":0.85,"Peintre":0.95,
  "Plafonneur":0.85,"Maçon":0.85,"Menuisier":0.80,"Couvreur":0.85,
  "Chauffagiste":0.75,"Parqueteur":0.90,"Façadier":0.88,"Démolisseur":0.92,
  "Technicien VMC":0.75,"Cuisiniste":0.82,
};

export const joursChantier = (jours, nb, metierName) => {
  if (nb <= 1) return jours;
  const coeff = COEFF_COLLECTIF[metierName] ?? 0.85;
  return Math.round((jours / (nb * coeff)) * 100) / 100;
};

export const moLV = (st,lk,mid,l) => {
  if (!l || !l.jRef) return 0;
  const nk=`${lk}${mid}${l.id}`;
  if ((st.MO_MODE[nk]??"jours")==="forfait") return Number(st.MO_FORF[nk]||0);
  const j = Number(st.MO_J[nk]??l.jRef.sug);
  const tx = Number(st.MO_TX[nk]??l.txRef.sug);
  const nb = Number(st.MO_NB[nk]??1);
  const dep = Number(st.MO_DEP[nk]??0);
  const jC = joursChantier(j, nb, l.metierName||"");
  const surDep = nb > 1 ? (nb - 1) * dep * jC : 0;
  return j * tx + surDep;
};

export const matLV = (st,lk,mid,x) => {
  if (!x || !x.props || !x.props.length) return 0;
  const nk=`${lk}${mid}${x.id}`, pi=st.MAT_PROP[nk]??0, g=st.MAT_GAMME[nk]??"std";
  if (!x.props[pi] || !x.props[pi][g]) return 0;
  const k=`${nk}${pi}${g}`, td=x.props[pi][g], price=Number(st.MAT_PRIX[k]??td.sug);
  if (!x.u) return price;
  const qty=st.MAT_QTY[nk]??(st.MAT_DIM_M2[nk]!=null?Math.ceil(st.MAT_DIM_M2[nk]*1.1):x.qBase??1);
  return price*qty;
};

export const metierBase = (st,lk,m) => {
  const mo=m.mo.reduce((s,l)=>s+moLV(st,lk,m.id,l),0);
  const mat=m.mat.reduce((s,x)=>s+matLV(st,lk,m.id,x),0);
  return {mo,mat,base:mo+mat};
};

export const metierTotal = (st,lk,m) => {
  const {base}=metierBase(st,lk,m);
  const mv=Number(st.MARGE_VAL[`${lk}${m.id}`]??0), mm=st.MARGE_MODE[`${lk}${m.id}`]??"coeff";
  if (!mv) return base;
  return mm==="coeff" ? base*mv : base+mv;
};

export const lotTotals = (st,lot) => {
  const base=lot.metiers.reduce((s,m)=>s+metierBase(st,lot.id,m).base,0);
  const av=lot.metiers.reduce((s,m)=>s+metierTotal(st,lot.id,m),0);
  const marge=av-base, im=st.IMPREVU_MODE[lot.id]??"pct", iv=Number(st.IMPREVU_VAL[lot.id]??lot.imprevuPct??10);
  const imprevu=iv===0?0:im==="pct"?Math.round(av*iv/100):iv;
  return {base,marge,imprevu,total:av+imprevu};
};

export const grandTotalGamme = (st,gamme,proj) =>
  proj.lots.reduce((ls,lot) => {
    const av=lot.metiers.reduce((ms,m) => {
      const mo=m.mo.reduce((s,l)=>s+moLV(st,lot.id,m.id,l),0);
      const mat=m.mat.reduce((s,x)=>{
        if (!x || !x.props || !x.props.length) return s;
        const pi=Math.min(st.MAT_PROP[`${lot.id}${m.id}${x.id}`]??0, x.props.length-1);
        if (!x.props[pi] || !x.props[pi][gamme]) return s;
        const price=x.props[pi][gamme].sug??0;
        const qty=x.u?(st.MAT_QTY[`${lot.id}${m.id}${x.id}`]??(st.MAT_DIM_M2[`${lot.id}${m.id}${x.id}`]!=null?Math.ceil(st.MAT_DIM_M2[`${lot.id}${m.id}${x.id}`]*1.1):x.qBase??1)):1;
        return s+price*(x.u?qty:1);
      },0);
      const base=mo+mat, mv=Number(st.MARGE_VAL[`${lot.id}${m.id}`]??0), mm=st.MARGE_MODE[`${lot.id}${m.id}`]??"coeff";
      return ms+(!mv?base:mm==="coeff"?base*mv:base+mv);
    },0);
    const im=st.IMPREVU_MODE[lot.id]??"pct", iv=Number(st.IMPREVU_VAL[lot.id]??lot.imprevuPct??10);
    return ls+av+(iv===0?0:im==="pct"?Math.round(av*iv/100):iv);
  },0);

export const makeInitialST = (proj) => {
  const im={}, iv={}, lo={};
  proj.lots.forEach(l=>{ im[l.id]="pct"; iv[l.id]=l.imprevuPct??10; lo[l.id]=l.defaultOpen??false; });
  return {
    MO_MODE:{},MO_J:{},MO_TX:{},MO_FORF:{},MO_NB:{},MO_DEP:{},
    MAT_PROP:{},MAT_GAMME:{},MAT_PRIX:{},MAT_QTY:{},MAT_DIM:{},MAT_DIM_M2:{},
    NOTES:{},NOTES_OPEN:{},MARGE_MODE:{},MARGE_VAL:{},
    IMPREVU_MODE:im,IMPREVU_VAL:iv,LINE_OPEN:{},lotOpen:lo,metierOpen:{},
  };
};
