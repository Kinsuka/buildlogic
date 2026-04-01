const METIER_KEY_SUGGESTIONS = {
  carreleur: "carrelage",
  chauffagiste: "chauffage",
  couvreur: "toiture",
  cuisiniste: "cuisine",
  demolisseur: "demolition",
  demolition: "demolition",
  electricien: "electricite",
  facadier: "facade",
  macon: "maconnerie",
  menuisier: "menuiserie",
  parqueteur: "parquet",
  peintre: "peinture",
  plafonneur: "plafonnage",
  plombier: "plomberie",
  technicienvmc: "ventilation",
};

const METIER_REFERENCE_HINTS = {
  carrelage: {
    categories: ["Sol", "Mur", "Finitions", "Prépa sol"],
    material_keywords: [
      "Grès cérame 60×60",
      "Faïence murale standard",
      "Colle à carrelage flex",
      "Joint carrelage époxy",
      "Membrane étanchéité",
    ],
    lot_titles: ["Salle de bain", "WC", "Cuisine", "Sols et faïences"],
  },
  chauffage: {
    categories: ["Chauffage", "Consommables"],
    material_keywords: [
      "Chaudière gaz condensation",
      "Radiateur acier panneau",
      "Tuyauterie chauffage (ml)",
      "Vanne thermostatique",
    ],
    lot_titles: ["Chauffage", "Chaufferie", "Réseaux chauffage"],
  },
  toiture: {
    categories: ["Toiture", "Isolation", "Consommables"],
    material_keywords: [
      "EPDM membrane toiture plate (m²)",
      "Roofing bitumineux (m²)",
      "Velux",
      "Écran sous-toiture (m²)",
    ],
    lot_titles: ["Toiture", "Toiture plate", "Combles"],
  },
  cuisine: {
    categories: ["Menuiserie", "Consommables"],
    material_keywords: [
      "Placard/dressing sur mesure",
      "OSB 18mm (plaque 250×125)",
      "Chevilles + visserie (assortiment)",
    ],
    lot_titles: ["Cuisine", "Cuisine équipée"],
  },
  demolition: {
    categories: ["Finitions", "Consommables"],
    material_keywords: [
      "Benne à gravats 7m³",
      "Protection chantier sol+murs",
    ],
    lot_titles: ["Dépose", "Curage", "Préparation chantier"],
  },
  electricite: {
    categories: ["Électricité", "Consommables"],
    material_keywords: [
      "Prise / interrupteur",
      "Preflex VOB 3G2.5 (100m)",
      "Tableau électrique 24M",
      "Luminaire / spot LED",
    ],
    lot_titles: ["Électricité", "Mise en conformité", "Cuisine", "Salle de bain"],
  },
  facade: {
    categories: ["Isolation", "Mur", "Peinture"],
    material_keywords: [
      "Panneau PIR/PUR rigide (m²)",
      "Enduit de finition (sac 25kg)",
      "Peinture extérieure façade (pot 10L)",
    ],
    lot_titles: ["Façade", "Isolation extérieure"],
  },
  maconnerie: {
    categories: ["Gros œuvre", "Finitions", "Consommables"],
    material_keywords: [
      "Bloc béton 19x19x39",
      "Ciment en sac 25kg",
      "Linteau béton 15cm",
      "Mortier de pose (25kg)",
    ],
    lot_titles: ["Gros œuvre", "Ouvertures", "Structure"],
  },
  menuiserie: {
    categories: ["Menuiserie", "Menuiserie ext.", "Consommables"],
    material_keywords: [
      "Porte intérieure + bloc",
      "Tasseaux bois 38×38 (ml)",
      "OSB 18mm (plaque 250×125)",
      "Châssis PVC DV standard",
    ],
    lot_titles: ["Menuiseries intérieures", "Châssis", "Placards"],
  },
  parquet: {
    categories: ["Sol", "Consommables", "Finitions"],
    material_keywords: [
      "Parquet contrecollé",
      "Parquet stratifié AC4",
      "Vinyle LVT clipsable",
      "Sous-couche parquet (m²)",
    ],
    lot_titles: ["Sols", "Parquet", "Revêtements de sol"],
  },
  peinture: {
    categories: ["Peinture", "Consommables"],
    material_keywords: [
      "Peinture intérieure mate (pot 10L)",
      "Apprêt / sous-couche (pot 5L)",
      "Bâche de protection chantier",
      "Rouleau + bac (kit)",
    ],
    lot_titles: ["Peinture", "Finitions", "Murs et plafonds"],
  },
  plafonnage: {
    categories: ["Cloisons/Plafonds", "Isolation", "Consommables"],
    material_keywords: [
      "Plaque Gyproc BA13",
      "Plaque Gyproc Hydro",
      "Montant métallique C48/C70",
      "Bande à joints + enduit",
    ],
    lot_titles: ["Cloisons et plafonds", "Gyproc", "Faux plafonds"],
  },
  plomberie: {
    categories: ["Plomberie", "Consommables", "Finitions"],
    material_keywords: [
      "WC suspendu + bâti",
      "Receveur de douche",
      "Robinetterie SdB mitigeur",
      "Lavabo + vasque",
      "Tube PVC évac. Ø50 (barre 2m)",
    ],
    lot_titles: ["Salle de bain", "Cuisine", "Buanderie", "Sanitaires"],
  },
  ventilation: {
    categories: ["VMC/Ventilation", "Consommables"],
    material_keywords: [
      "Groupe VMC simple flux",
      "Groupe VMC double flux",
      "Gaine ventilation Ø125 (ml)",
      "Grille de ventilation",
    ],
    lot_titles: ["Ventilation", "Salle de bain", "Cuisine"],
  },
};

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function asNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function deriveMetierKey(name) {
  const slug = slugify(name).replace(/_/g, "");
  return METIER_KEY_SUGGESTIONS[slug] || slugify(name);
}

function dedupeByLabel(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.label}::${item.unite || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toBaseUnit(unite) {
  const source = String(unite || "").trim();
  if (!source) return "";
  if (source === "j") return "forfait";
  if (source.endsWith("/j")) return source.replace(/\/j$/i, "");
  return source;
}

function buildMoQuantificationRule(unite) {
  const source = String(unite || "").trim();
  if (source === "j") return "poste forfaitaire en jours, ajuster selon le contexte chantier";
  if (source.endsWith("/j")) {
    const baseUnit = toBaseUnit(source);
    return `si la quantite est connue en ${baseUnit}, calculer j = quantite / rendement puis ajuster avec coeff_complexite_reno et temps_fixe_j`;
  }
  return "convertir la quantite chantier en jours plausibles";
}

function buildMaterialScore(material, hint) {
  const label = String(material.label || "");
  const category = String(material.categorie || "");
  let score = 0;

  if ((hint?.categories || []).includes(category)) score += 5;
  (hint?.material_keywords || []).forEach((keyword) => {
    if (label.includes(keyword)) score += 10;
  });

  return score;
}

function pickTopMaterials(materiaux, hint, limit) {
  const ranked = dedupeByLabel(materiaux)
    .map((material) => ({ material, score: buildMaterialScore(material, hint) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return String(left.material.label).localeCompare(String(right.material.label), "fr");
    })
    .slice(0, limit)
    .map((entry) => entry.material);

  return ranked;
}

function buildMaterialTemplate(material) {
  const unite = String(material.unite || "").trim();
  const numericSug = asNumber(material.prix_sug, 0);
  return {
    line_key: slugify(material.label).slice(0, 40),
    label: material.label,
    avec_unite: unite !== "u",
    q_base: 1,
    d_base: unite ? `base initiale: 1 ${unite}` : "base a preciser",
    props_seed: {
      name: material.label,
      price_ref: {
        lo: asNumber(material.prix_lo, numericSug),
        sug: numericSug,
        hi: asNumber(material.prix_hi, numericSug),
      },
      rule: "creer au moins une option props; si une seule option est connue, reutiliser la meme fourchette comme base std/mid/sup ou l'ajuster legerement selon la gamme",
    },
  };
}

function buildMoTemplate(rendement) {
  return {
    line_key: slugify(rendement.prestation).slice(0, 40),
    label: rendement.prestation,
    unite_chantier: toBaseUnit(rendement.unite),
    rendement_ref: {
      lo: asNumber(rendement.r_min, 0),
      sug: asNumber(rendement.r_sug, 0),
      hi: asNumber(rendement.r_max, 0),
    },
    coeff_complexite_reno: asNumber(rendement.coeff_complexite_reno, 1),
    temps_fixe_j: asNumber(rendement.temps_fixe_j, 0),
    quantification_rule: buildMoQuantificationRule(rendement.unite),
  };
}

export function buildAssistantReferenceContext(
  {
    tarifs = [],
    rendements = [],
    materiaux = [],
    postesSystematiques = [],
  },
  options = {}
) {
  const maxPrestationsPerMetier = options.maxPrestationsPerMetier ?? 5;
  const maxMateriauxPerMetier = options.maxMateriauxPerMetier ?? 4;

  const allMetiers = Array.from(
    new Set(
      [...tarifs.map((item) => item.metier), ...rendements.map((item) => item.metier)]
        .filter(Boolean)
    )
  ).sort((left, right) => String(left).localeCompare(String(right), "fr"));

  const metiers = allMetiers.map((metierName) => {
    const metierKey = deriveMetierKey(metierName);
    const hint = METIER_REFERENCE_HINTS[metierKey] || { categories: [], material_keywords: [], lot_titles: [] };
    const tarif = tarifs.find((item) => deriveMetierKey(item.metier) === metierKey) || null;
    const prestations = rendements
      .filter((item) => deriveMetierKey(item.metier) === metierKey)
      .slice(0, maxPrestationsPerMetier);
    const topMaterials = pickTopMaterials(materiaux, hint, maxMateriauxPerMetier);

    return {
      metier_key: metierKey,
      name: metierName,
      icon: tarif?.icon || null,
      note: tarif?.note || "",
      suggested_lot_titles: hint.lot_titles || [],
      material_categories: hint.categories || [],
      tarif_jour_ref: tarif
        ? {
            lo: asNumber(tarif.prix_lo, 0),
            sug: asNumber(tarif.prix_sug, 0),
            hi: asNumber(tarif.prix_hi, 0),
          }
        : null,
      tarif_horaire_ref: tarif
        ? {
            lo: asNumber(tarif.tx_h_lo, 0),
            hi: asNumber(tarif.tx_h_hi, 0),
          }
        : null,
      coeff_collectif_ref: tarif ? asNumber(tarif.coeff_collectif, 0.85) : null,
      prestations_typiques: prestations.map((rendement) => ({
        label: rendement.prestation,
        unite: rendement.unite,
        rendement_ref: {
          lo: asNumber(rendement.r_min, 0),
          sug: asNumber(rendement.r_sug, 0),
          hi: asNumber(rendement.r_max, 0),
        },
      })),
      mo_line_templates: prestations.map(buildMoTemplate),
      mat_line_templates: topMaterials.map(buildMaterialTemplate),
    };
  });

  return {
    summary: {
      metiers_count: metiers.length,
      prestations_count: rendements.length,
      materiaux_count: materiaux.length,
      postes_systematiques_count: postesSystematiques.length,
    },
    conventions: {
      lot_key: "lot_<piece_ou_zone>",
      metier_key: "slug technique du metier, par ex plomberie, carrelage, electricite",
      line_key: "slug court de la prestation ou fourniture, par ex pose_carrelage_sol_60x60",
      sequence: "liste ordonnee de metier_key, jamais de labels affiches",
      mo_lines: "une ligne par prestation concrete retenue; convertir la quantite chantier en jours a partir des rendements de reference",
      mat_lines: "une ligne par fourniture significative; avec_unite=true si quantite variable, q_base numerique, d_base explicite",
      props: "chaque mat_line doit contenir au moins une option props avec std/mid/sup; si une seule option est connue, reutiliser la meme base de prix comme point de depart",
    },
    postes_systematiques: postesSystematiques.map((item) => ({
      label: item.label,
      niveau: item.niveau,
      note: item.note,
    })),
    metiers,
  };
}

export function formatAssistantReferenceContext(context) {
  const lines = [
    "REFERENTIEL METIER COMPACT POUR GENERER LE PAYLOAD CANONIQUE",
    `Couverture: ${context.summary.metiers_count} metiers, ${context.summary.prestations_count} prestations de rendement, ${context.summary.materiaux_count} materiaux, ${context.summary.postes_systematiques_count} postes systematiques.`,
    "",
    "CONVENTIONS DE STRUCTURE",
    `- lot_key: ${context.conventions.lot_key}`,
    `- metier_key: ${context.conventions.metier_key}`,
    `- line_key: ${context.conventions.line_key}`,
    `- sequence: ${context.conventions.sequence}`,
    `- mo_lines: ${context.conventions.mo_lines}`,
    `- mat_lines: ${context.conventions.mat_lines}`,
    `- props: ${context.conventions.props}`,
    "",
    "POSTES SYSTEMATIQUES A VERIFIER",
  ];

  context.postes_systematiques.forEach((item) => {
    lines.push(`- [${item.niveau}] ${item.label} — ${item.note}`);
  });

  lines.push("");
  lines.push("METIERS ET TEMPLATES DE GENERATION");

  context.metiers.forEach((metier) => {
    const jourRef = metier.tarif_jour_ref
      ? `${metier.tarif_jour_ref.lo}/${metier.tarif_jour_ref.sug}/${metier.tarif_jour_ref.hi} €/j`
      : "tarif jour a confirmer";
    const heureRef = metier.tarif_horaire_ref
      ? `${metier.tarif_horaire_ref.lo}-${metier.tarif_horaire_ref.hi} €/h`
      : "tarif horaire a confirmer";

    lines.push(
      `- ${metier.metier_key} | ${metier.name}${metier.icon ? ` ${metier.icon}` : ""} | ${jourRef} | ${heureRef}${metier.note ? ` | ${metier.note}` : ""}`
    );
    if (metier.suggested_lot_titles.length) {
      lines.push(`  lots typiques: ${metier.suggested_lot_titles.join(", ")}`);
    }
    if (metier.material_categories.length) {
      lines.push(`  categories materiaux: ${metier.material_categories.join(", ")}`);
    }
    if (metier.mo_line_templates.length) {
      lines.push("  mo_line_templates:");
      metier.mo_line_templates.forEach((template) => {
        lines.push(
          `  - ${template.line_key} :: ${template.label} :: unite ${template.unite_chantier} :: rendement ${template.rendement_ref.lo}/${template.rendement_ref.sug}/${template.rendement_ref.hi} :: regle ${template.quantification_rule}`
        );
      });
    }
    if (metier.mat_line_templates.length) {
      lines.push("  mat_line_templates:");
      metier.mat_line_templates.forEach((template) => {
        lines.push(
          `  - ${template.line_key} :: ${template.label} :: avec_unite=${template.avec_unite} :: q_base ${template.q_base} :: d_base ${template.d_base} :: prix ${template.props_seed.price_ref.lo}/${template.props_seed.price_ref.sug}/${template.props_seed.price_ref.hi}`
        );
      });
    }
  });

  return lines.join("\n");
}
