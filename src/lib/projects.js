import { sb } from "../supabase.js";

// ─── Cache localStorage (remplace window.storage) ─────────
export const cache = {
  async get(key) {
    try {
      const v = localStorage.getItem(key);
      return v ? { value: v } : null;
    } catch(e) { return null; }
  },
  async set(key, value) {
    try { localStorage.setItem(key, value); } catch(e) {}
  },
  async delete(key) {
    try { localStorage.removeItem(key); } catch(e) {}
  }
};

// ─── Chargement liste projets — Supabase direct ───────────
export async function loadProjectsList() {
  const { data, error } = await sb
    .from('bl_projects')
    .select('id, client_nom, adresse, tva, date_visite, validite, store_key, statut, projet_json, st_json')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ─── Chargement d'un projet — Supabase direct ────────────
export async function loadProject(projectId) {
  const { data, error } = await sb
    .from('bl_projects')
    .select('projet_json')
    .eq('id', projectId)
    .single();
  if (error) throw error;
  return data?.projet_json;
}

// ─── Création d'un nouveau projet — Supabase direct ──────
export async function createProject({ clientNom, adresse, tva, dateVisite, validite }) {
  const id       = crypto.randomUUID();
  const storeKey = `ona_bl_${Date.now().toString(36)}`;
  const dv       = dateVisite || new Date().toISOString().slice(0, 10);
  const tvaNum   = Number(tva) || 6;
  const valNum   = Number(validite) || 30;
  const { error } = await sb.from('bl_projects').insert({
    id, client_nom: clientNom.trim(), adresse: (adresse||'').trim(),
    tva: tvaNum, date_visite: dv, validite: valNum, store_key: storeKey, statut: 'draft',
  });
  if (error) throw error;
  return {
    id, client: clientNom.trim(), adresse: (adresse||'').trim(),
    tva: tvaNum, dateVisite: dv, validite: valNum,
    storeKey, statut: 'draft', suspens: [], lots: [],
  };
}
