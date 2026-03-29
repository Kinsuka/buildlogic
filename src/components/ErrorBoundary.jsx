import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(e) {
    // Vider le cache localStorage du projet pour forcer un rechargement propre
    try {
      const sk = this.props.storeKey;
      if (sk) localStorage.removeItem(sk);
    } catch(_) {}
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding:"2rem",maxWidth:480,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:12}}>⚠️</div>
          <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>Erreur de rendu du projet</div>
          <div style={{fontSize:12,color:"var(--tx3)",marginBottom:20,fontFamily:"monospace",background:"var(--sf2)",padding:"8px 12px",borderRadius:8}}>
            {this.state.error.message}
          </div>
          <button onClick={()=>{ this.setState({error:null}); this.props.onReset(); }}
            style={{padding:"8px 20px",fontSize:13,border:"none",borderRadius:8,background:"var(--btx)",color:"#fff",cursor:"pointer"}}>
            🔄 Recharger le projet
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
