export const REFERENTIEL_TABS = [
  {key: "mo", label: "👷 MO"},
  {key: "mat", label: "🧱 Matériaux"},
  {key: "postes", label: "✅ Postes"},
  {key: "four", label: "🏪 Fournisseurs"},
];

export const REFERENTIEL_MO_HEADERS = [
  "Corps de métier",
  "Lo €/j",
  "Sug €/j",
  "Hi €/j",
  "€/h BE",
  "Notes",
];

export const REFERENTIEL_MAT_HEADERS = [
  "Matériau",
  "Unité",
  "Lo",
  "Sug",
  "Hi",
  "Notes",
];

export const REFERENTIEL_POSTE_LEVELS = [
  {
    key: "obligatoire",
    label: "Obligatoire",
    icon: "✅",
    color: "var(--rtx)",
    background: "var(--rbg)",
  },
  {
    key: "frequent",
    label: "Fréquent",
    icon: "⚠️",
    color: "var(--amb)",
    background: "#fffbeb",
  },
  {
    key: "verifier",
    label: "À vérifier",
    icon: "🔍",
    color: "var(--btx)",
    background: "var(--bbg)",
  },
];

export const REFERENTIEL_POSTES_NOTICE =
  "Vérifier cette liste avant de valider tout devis. Les postes Obligatoires doivent toujours être inclus.";

export const REFERENTIEL_FOURNISSEURS_NOTICE =
  "Fournisseurs de référence ONA · Magasins physiques en Belgique · Compte pro disponible chez tous";

export const REFERENTIEL_FOOTER =
  "Tarifs HTVA · Belgique · 2026 · Référentiel chargé live depuis Supabase · Cache 24h";
