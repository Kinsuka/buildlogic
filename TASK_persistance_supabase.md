# TASK — Persistance state BuildLogic dans Supabase (st_json)

## Objectif
Persister les ajustements de chiffrage (jours, tarifs, gammes, notes, marges...)
dans la colonne `st_json JSONB` de `bl_projects` au clic 💾 Sauvegarder.
Au chargement, `st_json` Supabase prime sur localStorage.

## Règles
- Modifications chirurgicales dans `src/App.jsx` uniquement
- `npm run build` doit passer après chaque étape
- Ne pas modifier `src/supabase.js`
- Ne pas reconstruire le fichier entier

---

## ÉTAPE 1 — Ajouter ST_PERSIST_KEYS et extractPersistST

Localisation : après la ligne contenant `export const sb = createClient(` vers le début du fichier, avant `loadProjectsList`.

Ajouter ce bloc exactement :

const ST_PERSIST_KEYS = [
  'MO_J','MO_TX','MO_MODE','MO_FORF','MO_NB','MO_DEP',
  'MAT_GAMME','MAT_PRIX','MAT_QTY','MAT_DIM','MAT_DIM_M2',
  'NOTES','MARGE_MODE','MARGE_VAL','IMPREVU_MODE','IMPREVU_VAL'
];
const extractPersistST = (st) => {
  const out = {};
  ST_PERSIST_KEYS.forEach(k => { if (st[k] && Object.keys(st[k]).length) out[k] = st[k]; });
  return out;
};

---

## ÉTAPE 2 — Modifier loadProjectsList pour inclure st_json

Chercher la ligne exacte :
.select('id, client_nom, adresse, tva, date_visite, validite, store_key, statut, projet_json')

Remplacer par :
.select('id, client_nom, adresse, tva, date_visite, validite, store_key, statut, projet_json, st_json')

---

## ÉTAPE 3 — Modifier handleSave pour écrire dans Supabase

Chercher dans handleSave la ligne :
    showToast(mode==="storage"?`✅ v${n} sauvegardée`:mode==="local"?`✅ v${n} (localStorage)`:"⚠️ Sauvegarde indisponible");

Insérer AVANT cette ligne :
    try {
      await sb.from('bl_projects')
        .update({ st_json: extractPersistST(st) })
        .eq('store_key', PROJECT.storeKey);
    } catch(e) { console.warn('st_json save failed:', e); }

---

## ÉTAPE 4 — Modifier le useEffect de chargement

Chercher dans le useEffect "Chargement state sauvegardé quand PROJECT change" les lignes exactes :
    let data=null;
    try{const r=await cache.get(PROJECT.storeKey);if(r?.value)data=JSON.parse(r.value);}catch(e){}
    if (!data){try{const r=localStorage.getItem(PROJECT.storeKey);if(r)data=JSON.parse(r);}catch(e){}}

Remplacer par :
    let data=null;
    const fromList = projectsList.find(p => p.store_key === PROJECT.storeKey);
    if (fromList?.st_json && Object.keys(fromList.st_json).length) {
      data = { ST: fromList.st_json };
    }
    if (!data) { try{const r=await cache.get(PROJECT.storeKey);if(r?.value)data=JSON.parse(r.value);}catch(e){} }
    if (!data) { try{const r=localStorage.getItem(PROJECT.storeKey);if(r)data=JSON.parse(r);}catch(e){} }

---

## ÉTAPE 5 — Build et push

npm run build
git add src/App.jsx
git commit -m "feat: persistance state st_json dans Supabase"
git push

## Test de validation
1. Ouvrir BuildLogic - charger Emeline
2. Modifier un nombre de jours sur une ligne MO
3. Cliquer 💾 Sauvegarder
4. Ouvrir navigation privée - recharger l'app
5. Charger Emeline - la modification doit être présente

## Contexte technique
- Supabase project : abbaqmjidclmmwqcutlj
- Colonne st_json JSONB déjà créée dans bl_projects
- sb est déjà importé dans App.jsx depuis ./supabase.js
- projectsList est déjà dans le state React du composant App
