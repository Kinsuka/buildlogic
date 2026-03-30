# TASK — Module IA BuildLogic : Wizard création + Chat assistant

## Contexte
Lire CLAUDE.md avant de commencer.

Deux features à ajouter dans src/App.jsx :
1. **Wizard IA** — remplace NewProjectModal par un wizard guidé (rapport de visite → questions LLM → SQL → projet créé)
2. **Chat assistant** — petit chat flottant sur un projet ouvert pour modifier/questionner le devis

## Infrastructure déjà en place (NE PAS RECRÉER)
- ✅ Fonction SQL `exec_sql_block(sql_block text)` créée dans Supabase
- ✅ Edge Function `exec-project-sql` déployée sur Supabase
  - URL : https://abbaqmjidclmmwqcutlj.supabase.co/functions/v1/exec-project-sql
  - Méthode POST, body : { sql: string }
  - Retourne : { success: true, projet: { id, client_nom, adresse, store_key, projet_json } }

## Règles absolues
- Modifications chirurgicales dans src/App.jsx uniquement
- npm run build doit passer après chaque étape
- Garder le formulaire manuel comme fallback dans le wizard
- Ne pas modifier src/supabase.js

---

## ÉTAPE 1 — Ajouter LLM_CONFIG, callLLM, buildSystemPrompt

Ajouter ce bloc dans App.jsx juste après les imports (avant la ligne `const REFERENTIEL_SNAPSHOT`).

```js
// ─── LLM Config ───────────────────────────────────────────
const LLM_CONFIG = {
  claude: {
    url: 'https://api.anthropic.com/v1/messages',
    headers: k => ({'Content-Type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01'}),
    buildBody: (msgs, sys) => ({model:'claude-sonnet-4-20250514',max_tokens:4096,system:sys,messages:msgs}),
    parse: d => d.content[0].text
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    headers: k => ({'Content-Type':'application/json','Authorization':`Bearer ${k}`}),
    buildBody: (msgs, sys) => ({model:'gpt-4o',max_tokens:4096,messages:[{role:'system',content:sys},...msgs]}),
    parse: d => d.choices[0].message.content
  },
  mistral: {
    url: 'https://api.mistral.ai/v1/chat/completions',
    headers: k => ({'Content-Type':'application/json','Authorization':`Bearer ${k}`}),
    buildBody: (msgs, sys) => ({model:'mistral-small-latest',max_tokens:4096,messages:[{role:'system',content:sys},...msgs]}),
    parse: d => d.choices[0].message.content
  }
};

async function callLLM(messages, system, provider, apiKey) {
  const c = LLM_CONFIG[provider];
  const res = await fetch(c.url, {
    method: 'POST',
    headers: c.headers(apiKey),
    body: JSON.stringify(c.buildBody(messages, system))
  });
  if (!res.ok) {
    const err = await res.json().catch(()=>({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  return c.parse(await res.json());
}

async function buildONASystemPrompt() {
  const { data: tarifs } = await sb.from('mo_tarifs')
    .select('metier,prix_lo,prix_sug,prix_hi,tx_h_lo,tx_h_hi').order('metier');
  const tarifStr = (tarifs||[]).map(t=>
    `${t.metier}: ${t.prix_lo}/${t.prix_sug}/${t.prix_hi} €/j (${t.tx_h_lo}-${t.tx_h_hi} €/h)`
  ).join('\n');
  return `Tu es chef de chantier chez ONA Group SRL, entreprise de rénovation à Bruxelles/Brabant, Belgique. Tous les prix sont HTVA.

TARIFS DE RÉFÉRENCE ONA 2026 (lo/sug/hi €/jour):
${tarifStr}

Tu poses UNE question à la fois. Chaque question propose des choix courts cliquables + une option "Autre / précision". Tu ne passes à la suite que quand l'utilisateur a répondu.

Quand tu as toutes les infos, génère le SQL complet dans un bloc \`\`\`sql...\`\`\` en respectant cet ordre :
1. INSERT INTO bl_projects (...) VALUES (...) RETURNING id — store_key format: 'ona_bl_NOMVILLE2026'
2. Bloc DO $$ avec bl_lots (sequence ARRAY[...] OBLIGATOIRE), bl_metiers, bl_mo_lines, bl_mat_lines
3. INSERT INTO bl_suspens ... SÉPARÉMENT du bloc DO
4. SELECT refresh_projet_json('UUID')

Colonnes critiques : bl_suspens.texte (pas txt) · bl_mat_lines.avec_unite (pas is_surface) · bl_lots.ordre (pas display_order) · sequence toujours rempli`;
}
```

---

## ÉTAPE 2 — Remplacer NewProjectModal

Localisation exacte : ligne 721, fonction `NewProjectModal` jusqu'à la ligne 803 incluse.

Remplacer TOUT ce bloc par :

```jsx
// ─── NewProjectModal — Wizard IA + Mode Manuel ────────────
function NewProjectModal({onClose, onCreated}) {
  const [mode, setMode]         = useState('ai');
  const [step, setStep]         = useState('config');
  const [provider, setProvider] = useState(localStorage.getItem('ona_api_provider')||'mistral');
  const [apiKey, setApiKey]     = useState(localStorage.getItem(`ona_api_key_${localStorage.getItem('ona_api_provider')||'mistral'}`)||'');
  const [remember, setRemember] = useState(true);
  const [rapport, setRapport]   = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [sqlPreview, setSqlPreview] = useState('');
  const [creating, setCreating] = useState(false);

  // Mode manuel (formulaire existant)
  const [clientNom, setClientNom] = useState('');
  const [adresse, setAdresse]     = useState('');
  const [dateVisite, setDateVisite] = useState(new Date().toISOString().slice(0,10));
  const [validite, setValidite]   = useState(30);

  const inp = {fontSize:13,height:34,padding:"0 10px",border:"1px solid var(--bd3)",borderRadius:6,background:"var(--sf)",color:"var(--tx)",width:"100%"};
  const lbl = {fontSize:11,fontWeight:600,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".04em",marginBottom:5,display:"block"};

  const providerLabels = {claude:'Claude (Anthropic)', openai:'GPT-4o (OpenAI)', mistral:'Mistral (EU · Gratuit)'};
  const providerLinks  = {claude:'https://console.anthropic.com/keys', openai:'https://platform.openai.com/api-keys', mistral:'https://console.mistral.ai/api-keys'};

  // Extraire SQL d'un message
  const extractSQL = (text) => {
    const m = text.match(/```sql\n?([\s\S]+?)```/);
    return m ? m[1].trim() : null;
  };

  // Analyser le rapport — premier appel LLM
  const analyzeRapport = async () => {
    if (!rapport.trim()) return;
    setLoading(true); setError('');
    try {
      if (remember) { localStorage.setItem('ona_api_provider', provider); localStorage.setItem(`ona_api_key_${provider}`, apiKey); }
      const system = await buildONASystemPrompt();
      const firstMsg = {role:'user', content:`Voici le rapport de visite :\n\n${rapport}\n\nAnalyse-le et pose ta première question.`};
      const reply = await callLLM([firstMsg], system, provider, apiKey);
      setMessages([firstMsg, {role:'assistant', content:reply}]);
      setStep('chat');
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  // Envoyer message dans le chat wizard
  const sendMessage = async (text) => {
    const userMsg = {role:'user', content: text||input};
    if (!userMsg.content.trim()) return;
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs); setInput(''); setLoading(true); setError('');
    try {
      const system = await buildONASystemPrompt();
      const reply = await callLLM(newMsgs, system, provider, apiKey);
      const withReply = [...newMsgs, {role:'assistant', content:reply}];
      setMessages(withReply);
      const sql = extractSQL(reply);
      if (sql) { setSqlPreview(sql); }
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  // Créer le projet via Edge Function
  const createProject_AI = async () => {
    if (!sqlPreview) return;
    setCreating(true); setError('');
    try {
      const res = await fetch('https://abbaqmjidclmmwqcutlj.supabase.co/functions/v1/exec-project-sql', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({sql: sqlPreview})
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error||'Erreur création');
      if (data.projet) onCreated(data.projet);
      else onClose();
    } catch(e) { setError(e.message); setCreating(false); }
  };

  // Création manuelle
  const handleManualSubmit = async () => {
    if (!clientNom.trim()) { setError('Le nom du client est requis.'); return; }
    setLoading(true); setError('');
    try {
      const proj = await createProject({ clientNom, adresse, tva:6, dateVisite, validite });
      onCreated(proj);
    } catch(e) { setError(`Erreur : ${e.message}`); setLoading(false); }
  };

  const headerTitle = mode==='manual' ? '✚ Nouveau projet — Manuel' :
    step==='config' ? '✚ Nouveau projet — Configuration IA' :
    step==='rapport' ? '✚ Nouveau projet — Rapport de visite' :
    step==='chat' ? '✚ Nouveau projet — Questions' : '✚ Nouveau projet — Validation SQL';

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{display:"flex",position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:1000,alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"var(--sf)",borderRadius:12,maxWidth:580,width:"100%",maxHeight:"90vh",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,.3)",display:"flex",flexDirection:"column"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderBottom:"1px solid var(--bd)",background:"var(--sf2)",flexShrink:0}}>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>{headerTitle}</div>
            <div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>
              {mode==='ai' && step==='chat' && sqlPreview ? '✅ SQL prêt — vérifie et crée le projet' :
               mode==='ai' && step==='chat' ? 'Réponds aux questions pour générer le devis' :
               mode==='ai' && step==='rapport' ? 'Colle ton rapport de visite' :
               mode==='ai' ? 'Choisis ton assistant IA' : 'Saisie manuelle — les lots se créent dans le builder'}
            </div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"1px solid var(--bd2)",borderRadius:8,padding:"4px 10px",fontSize:13,cursor:"pointer",color:"var(--tx2)"}}>✕</button>
        </div>

        {/* Body scrollable */}
        <div style={{overflowY:"auto",flex:1,padding:"18px 20px"}}>

          {/* MODE MANUEL */}
          {mode==='manual' && (
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div><label style={lbl}>Nom du client *</label>
                <input autoFocus value={clientNom} onChange={e=>setClientNom(e.target.value)}
                  placeholder="ex : Emeline Dupont" style={inp} onKeyDown={e=>e.key==='Enter'&&handleManualSubmit()}/>
              </div>
              <div><label style={lbl}>Adresse du bien</label>
                <input value={adresse} onChange={e=>setAdresse(e.target.value)}
                  placeholder="ex : Rue de la Paix 12, Bruxelles" style={inp}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={lbl}>Date visite</label>
                  <input type="date" value={dateVisite} onChange={e=>setDateVisite(e.target.value)} style={inp}/>
                </div>
                <div><label style={lbl}>Validité (j)</label>
                  <input type="number" value={validite} min={1} max={365} onChange={e=>setValidite(Number(e.target.value))} style={{...inp,textAlign:"right"}}/>
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE CONFIG */}
          {mode==='ai' && step==='config' && (
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div>
                <label style={lbl}>Assistant IA</label>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {Object.entries(providerLabels).map(([k,v])=>(
                    <label key={k} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",border:`1px solid ${provider===k?"var(--btx)":"var(--bd3)"}`,borderRadius:8,cursor:"pointer",background:provider===k?"var(--bbg)":"var(--sf)"}}>
                      <input type="radio" name="provider" value={k} checked={provider===k}
                        onChange={()=>{setProvider(k); setApiKey(localStorage.getItem(`ona_api_key_${k}`)||'');}}
                        style={{accentColor:"var(--btx)"}}/>
                      <span style={{fontSize:13,fontWeight:provider===k?600:400,color:provider===k?"var(--btx)":"var(--tx)"}}>{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Clé API <a href={providerLinks[provider]} target="_blank" rel="noreferrer" style={{color:"var(--btx)",textDecoration:"none",fontWeight:400,marginLeft:6}}>→ Obtenir une clé</a></label>
                <input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)}
                  placeholder="sk-..." style={inp}/>
              </div>
              <label style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"var(--tx2)",cursor:"pointer"}}>
                <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} style={{accentColor:"var(--btx)"}}/>
                Mémoriser la clé dans ce navigateur
              </label>
            </div>
          )}

          {/* ÉTAPE RAPPORT */}
          {mode==='ai' && step==='rapport' && (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <textarea value={rapport} onChange={e=>setRapport(e.target.value)}
                placeholder="Colle ici le rapport de visite complet..."
                style={{width:"100%",minHeight:220,padding:"12px",fontSize:13,fontFamily:"var(--font-sans)",color:"var(--tx)",background:"var(--sf2)",border:"1px solid var(--bd3)",borderRadius:8,resize:"vertical",lineHeight:1.6}}/>
            </div>
          )}

          {/* ÉTAPE CHAT */}
          {mode==='ai' && step==='chat' && (
            <div style={{display:"flex",flexDirection:"column",gap:0}}>
              {/* Messages */}
              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:12,maxHeight:320,overflowY:"auto"}}>
                {messages.filter(m=>m.role!=='user'||messages.indexOf(m)>0).map((m,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:m.role==='user'?"flex-end":"flex-start"}}>
                    <div style={{maxWidth:"85%",padding:"10px 14px",borderRadius:10,fontSize:13,lineHeight:1.6,
                      background:m.role==='user'?"var(--bbg)":"var(--sf2)",
                      color:m.role==='user'?"var(--btx)":"var(--tx)",
                      border:`1px solid ${m.role==='user'?"var(--bbd)":"var(--bd3)"}`}}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && <div style={{display:"flex",justifyContent:"flex-start"}}>
                  <div style={{padding:"10px 14px",borderRadius:10,fontSize:13,background:"var(--sf2)",border:"1px solid var(--bd3)",color:"var(--tx3)"}}>⏳ Réflexion…</div>
                </div>}
              </div>
              {/* Input */}
              <div style={{display:"flex",gap:8}}>
                <input value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMessage()}
                  placeholder="Réponds ou précise..." disabled={loading}
                  style={{...inp,flex:1}}/>
                <button onClick={()=>sendMessage()} disabled={loading||!input.trim()}
                  style={{padding:"0 16px",height:34,fontSize:13,fontWeight:600,border:"none",borderRadius:6,
                    background:"var(--btx)",color:"#fff",cursor:loading?"default":"pointer",opacity:loading?0.5:1}}>
                  →
                </button>
              </div>
              {/* Bouton créer si SQL disponible */}
              {sqlPreview && !loading && (
                <button onClick={()=>setStep('preview')}
                  style={{marginTop:12,padding:"10px",fontSize:13,fontWeight:700,border:"none",borderRadius:8,
                    background:"var(--gbg)",color:"var(--gtx)",cursor:"pointer",width:"100%",
                    border:"1px solid var(--gbd)"}}>
                  ✅ SQL généré — Vérifier et créer le projet →
                </button>
              )}
            </div>
          )}

          {/* ÉTAPE PREVIEW SQL */}
          {mode==='ai' && step==='preview' && (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{fontSize:12,color:"var(--tx3)",marginBottom:4}}>Vérifie le SQL avant création :</div>
              <textarea value={sqlPreview} onChange={e=>setSqlPreview(e.target.value)}
                style={{width:"100%",minHeight:280,padding:"12px",fontSize:11,fontFamily:"monospace",color:"var(--tx)",background:"var(--sf2)",border:"1px solid var(--bd3)",borderRadius:8,resize:"vertical",lineHeight:1.5}}/>
            </div>
          )}

          {error && <div style={{marginTop:12,fontSize:12,color:"var(--rtx)",padding:"8px 12px",background:"var(--rbg)",borderRadius:6}}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{display:"flex",gap:8,padding:"12px 20px 16px",borderTop:"1px solid var(--bd)",justifyContent:"space-between",flexShrink:0,background:"var(--sf)"}}>

          {/* Gauche : switch mode */}
          <button onClick={()=>{setMode(m=>m==='ai'?'manual':'ai');setStep('config');setError('');}}
            style={{padding:"7px 14px",fontSize:12,border:"1px solid var(--bd3)",borderRadius:7,background:"none",color:"var(--tx3)",cursor:"pointer"}}>
            {mode==='ai'?'Mode manuel':'Retour IA'}
          </button>

          {/* Droite : actions contextuelles */}
          <div style={{display:"flex",gap:8}}>
            {mode==='ai' && step==='config' && (
              <>
                <button onClick={onClose} style={{padding:"7px 14px",fontSize:13,border:"1px solid var(--bd3)",borderRadius:7,background:"none",color:"var(--tx2)",cursor:"pointer"}}>Annuler</button>
                <button onClick={()=>setStep('rapport')} disabled={!apiKey.trim()}
                  style={{padding:"7px 18px",fontSize:13,fontWeight:600,border:"none",borderRadius:7,
                    background:apiKey.trim()?"var(--btx)":"var(--bd)",
                    color:apiKey.trim()?"#fff":"var(--tx3)",cursor:apiKey.trim()?"pointer":"default"}}>
                  Suivant →
                </button>
              </>
            )}
            {mode==='ai' && step==='rapport' && (
              <>
                <button onClick={()=>setStep('config')} style={{padding:"7px 14px",fontSize:13,border:"1px solid var(--bd3)",borderRadius:7,background:"none",color:"var(--tx2)",cursor:"pointer"}}>← Retour</button>
                <button onClick={analyzeRapport} disabled={!rapport.trim()||loading}
                  style={{padding:"7px 18px",fontSize:13,fontWeight:600,border:"none",borderRadius:7,
                    background:rapport.trim()&&!loading?"var(--btx)":"var(--bd)",
                    color:rapport.trim()&&!loading?"#fff":"var(--tx3)",cursor:rapport.trim()&&!loading?"pointer":"default"}}>
                  {loading?'⏳ Analyse…':'Analyser →'}
                </button>
              </>
            )}
            {mode==='ai' && step==='chat' && (
              <button onClick={onClose} style={{padding:"7px 14px",fontSize:13,border:"1px solid var(--bd3)",borderRadius:7,background:"none",color:"var(--tx2)",cursor:"pointer"}}>Annuler</button>
            )}
            {mode==='ai' && step==='preview' && (
              <>
                <button onClick={()=>setStep('chat')} style={{padding:"7px 14px",fontSize:13,border:"1px solid var(--bd3)",borderRadius:7,background:"none",color:"var(--tx2)",cursor:"pointer"}}>← Modifier</button>
                <button onClick={createProject_AI} disabled={creating}
                  style={{padding:"7px 18px",fontSize:13,fontWeight:700,border:"none",borderRadius:7,
                    background:creating?"var(--bd)":"var(--gtx)",color:creating?"var(--tx3)":"#fff",cursor:creating?"default":"pointer"}}>
                  {creating?'⏳ Création…':'✚ Créer le projet'}
                </button>
              </>
            )}
            {mode==='manual' && (
              <>
                <button onClick={onClose} style={{padding:"7px 14px",fontSize:13,border:"1px solid var(--bd3)",borderRadius:7,background:"none",color:"var(--tx2)",cursor:"pointer"}}>Annuler</button>
                <button onClick={handleManualSubmit} disabled={loading}
                  style={{padding:"7px 18px",fontSize:13,fontWeight:600,border:"none",borderRadius:7,
                    background:loading?"var(--bd)":"var(--btx)",color:loading?"var(--tx3)":"#fff",cursor:loading?"default":"pointer"}}>
                  {loading?'⏳ Création…':'✚ Créer le projet'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## ÉTAPE 3 — Ajouter le Chat assistant projet

### 3a — Nouveau state dans App (vers ligne 1476)

Ajouter après `const [dark,setDark]` :
```js
const [showProjChat, setShowProjChat] = useState(false);
```

### 3b — Bouton Assistant dans la toolbar

Chercher la ligne exacte :
```jsx
<button onClick={handleSave} style={{padding:"5px 12px",fontSize:12,fontWeight:500,border:"none",borderRadius:6,background:"var(--bbg)",color:"var(--btx)",cursor:"pointer",height:30}}>💾 Sauvegarder</button>
```

Ajouter APRÈS ce bouton :
```jsx
{PROJECT && <button onClick={()=>setShowProjChat(c=>!c)}
  style={{padding:"5px 12px",fontSize:12,fontWeight:500,height:30,cursor:"pointer",borderRadius:6,
    border:`1px solid ${showProjChat?"var(--gtx)":"var(--bd3)"}`,
    background:showProjChat?"var(--gbg)":"var(--sf)",
    color:showProjChat?"var(--gtx)":"var(--tx)"}}>
  💬 Assistant
</button>}
```

### 3c — Composant ProjectChatPanel

Ajouter ce composant dans App.jsx juste avant le composant `App` principal :

```jsx
function ProjectChatPanel({PROJECT, onClose}) {
  const [messages, setMessages]   = useState([
    {role:'assistant', content:`Bonjour ! Je suis ton assistant pour le projet **${PROJECT.client}** à ${PROJECT.adresse}. Pose-moi une question sur le devis ou demande-moi d'ajuster quelque chose.`}
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const provider = localStorage.getItem('ona_api_provider') || 'mistral';
  const apiKey   = localStorage.getItem(`ona_api_key_${provider}`) || '';

  const system = `Tu es l'assistant de chantier ONA pour le projet ${PROJECT.client} à ${PROJECT.adresse}. Tous les prix sont HTVA. Tu réponds en français, de façon concise.
Tu peux répondre à des questions sur le chiffrage, identifier des oublis, suggérer des ajustements. Tu ne génères pas de SQL ici — tu analyses et conseilles.
DEVIS ACTUEL (JSON) :
${JSON.stringify({client:PROJECT.client,adresse:PROJECT.adresse,lots:PROJECT.lots?.map(l=>({title:l.title,metiers:l.metiers?.map(m=>({name:m.name,mo:m.mo,mat:m.mat}))}))}, null, 2)}`;

  const send = async () => {
    if (!input.trim()||loading) return;
    if (!apiKey) { setMessages(m=>[...m,{role:'assistant',content:'⚠️ Configure une clé API dans "Nouveau projet" d\'abord.'}]); return; }
    const userMsg = {role:'user', content:input};
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs); setInput(''); setLoading(true);
    try {
      const reply = await callLLM(newMsgs.filter(m=>m.role!=='assistant'||newMsgs.indexOf(m)>0), system, provider, apiKey);
      setMessages([...newMsgs, {role:'assistant', content:reply}]);
    } catch(e) {
      setMessages([...newMsgs, {role:'assistant', content:`⚠️ Erreur : ${e.message}`}]);
    }
    setLoading(false);
  };

  return (
    <div style={{position:"fixed",top:0,right:0,bottom:0,width:360,background:"var(--sf)",
      borderLeft:"1px solid var(--bd)",zIndex:500,display:"flex",flexDirection:"column",
      boxShadow:"-8px 0 30px rgba(0,0,0,.15)"}}>
      {/* Header */}
      <div style={{padding:"14px 16px",borderBottom:"1px solid var(--bd)",background:"var(--sf2)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div>
          <div style={{fontSize:13,fontWeight:700}}>💬 Assistant projet</div>
          <div style={{fontSize:11,color:"var(--tx3)",marginTop:1}}>{PROJECT.client} · {provider}</div>
        </div>
        <button onClick={onClose} style={{background:"none",border:"1px solid var(--bd2)",borderRadius:6,padding:"3px 9px",fontSize:12,cursor:"pointer",color:"var(--tx2)"}}>✕</button>
      </div>
      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"14px 14px",display:"flex",flexDirection:"column",gap:10}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==='user'?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"90%",padding:"9px 13px",borderRadius:10,fontSize:12,lineHeight:1.6,
              background:m.role==='user'?"var(--bbg)":"var(--sf2)",
              color:m.role==='user'?"var(--btx)":"var(--tx)",
              border:`1px solid ${m.role==='user'?"var(--bbd)":"var(--bd3)"}`}}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div style={{display:"flex",justifyContent:"flex-start"}}>
          <div style={{padding:"9px 13px",borderRadius:10,fontSize:12,background:"var(--sf2)",border:"1px solid var(--bd3)",color:"var(--tx3)"}}>⏳</div>
        </div>}
      </div>
      {/* Input */}
      <div style={{padding:"12px 14px",borderTop:"1px solid var(--bd)",display:"flex",gap:8,flexShrink:0,background:"var(--sf)"}}>
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()}
          placeholder="Pose une question…" disabled={loading}
          style={{flex:1,fontSize:12,height:32,padding:"0 10px",border:"1px solid var(--bd3)",borderRadius:6,background:"var(--sf2)",color:"var(--tx)"}}/>
        <button onClick={send} disabled={loading||!input.trim()}
          style={{padding:"0 14px",height:32,fontSize:13,fontWeight:600,border:"none",borderRadius:6,
            background:"var(--btx)",color:"#fff",cursor:loading?"default":"pointer",opacity:loading?0.5:1}}>
          →
        </button>
      </div>
    </div>
  );
}
```

### 3d — Monter ProjectChatPanel dans le JSX

Chercher la ligne contenant :
```jsx
{showNewProj && <NewProjectModal onClose={()=>setShowNewProj(false)} onCreated={handleProjectCreated}/>}
```

Ajouter APRÈS :
```jsx
{showProjChat && PROJECT && <ProjectChatPanel PROJECT={PROJECT} onClose={()=>setShowProjChat(false)}/>}
```

---

## ÉTAPE 4 — Build et push

```bash
npm run build
git add src/App.jsx
git commit -m "feat: wizard création projet IA + chat assistant"
git push
```

---

## Test de validation

**Wizard IA :**
1. Cliquer "✚ Nouveau projet"
2. Choisir Mistral, saisir clé API, cliquer Suivant
3. Coller un rapport de visite, cliquer Analyser
4. Répondre aux questions
5. Quand le SQL apparaît, cliquer "Vérifier et créer"
6. Le projet s'ouvre dans BuildLogic ✅

**Chat assistant :**
1. Ouvrir un projet existant (ex: Emeline)
2. Cliquer "💬 Assistant" dans la toolbar
3. Panel latéral s'ouvre ✅
4. Poser une question sur le devis ✅
