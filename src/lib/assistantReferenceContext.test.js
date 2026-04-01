import { describe, expect, it } from "vitest";
import {
  buildAssistantReferenceContext,
  formatAssistantReferenceContext,
} from "./assistantReferenceContext.js";
import { buildONASystemPromptFromData } from "./llm.js";

const SAMPLE_REFERENCE_DATA = {
  tarifs: [
    {
      metier: "Plombier",
      icon: "🔧",
      prix_lo: 400,
      prix_sug: 480,
      prix_hi: 640,
      coeff_collectif: 0.75,
      tx_h_lo: 50,
      tx_h_hi: 80,
      note: "Sanitaires, évacuations, alimentation",
    },
    {
      metier: "Carreleur",
      icon: "⬛",
      prix_lo: 250,
      prix_sug: 320,
      prix_hi: 400,
      coeff_collectif: 0.9,
      tx_h_lo: 30,
      tx_h_hi: 50,
      note: "Sol et mur, faience, grand format",
    },
    {
      metier: "Électricien",
      icon: "⚡",
      prix_lo: 280,
      prix_sug: 360,
      prix_hi: 440,
      coeff_collectif: 0.85,
      tx_h_lo: 35,
      tx_h_hi: 55,
      note: "Tableau, circuits, prises, éclairage",
    },
  ],
  rendements: [
    {
      metier: "Plombier",
      prestation: "WC suspendu Geberit+bâti",
      unite: "j",
      r_min: 0.5,
      r_sug: 1,
      r_max: 1.5,
      coeff_complexite_reno: 1.35,
      temps_fixe_j: 0,
    },
    {
      metier: "Plombier",
      prestation: "Création alimentation eau",
      unite: "ml/j",
      r_min: 10,
      r_sug: 15,
      r_max: 20,
      coeff_complexite_reno: 1.35,
      temps_fixe_j: 0,
    },
    {
      metier: "Carreleur",
      prestation: "Pose carrelage sol 60×60",
      unite: "m²/j",
      r_min: 6,
      r_sug: 8,
      r_max: 10,
      coeff_complexite_reno: 1.3,
      temps_fixe_j: 0,
    },
    {
      metier: "Carreleur",
      prestation: "Étanchéité liquide zones humides (SPEC)",
      unite: "m²/j",
      r_min: 15,
      r_sug: 20,
      r_max: 30,
      coeff_complexite_reno: 1.3,
      temps_fixe_j: 0,
    },
    {
      metier: "Électricien",
      prestation: "Circuit prise/éclairage",
      unite: "j",
      r_min: 0.5,
      r_sug: 0.75,
      r_max: 1,
      coeff_complexite_reno: 1.4,
      temps_fixe_j: 0,
    },
  ],
  materiaux: [
    {
      categorie: "Plomberie",
      label: "WC suspendu + bâti",
      unite: "u",
      prix_lo: 230,
      prix_sug: 420,
      prix_hi: 900,
    },
    {
      categorie: "Plomberie",
      label: "Receveur de douche",
      unite: "u",
      prix_lo: 100,
      prix_sug: 190,
      prix_hi: 480,
    },
    {
      categorie: "Sol",
      label: "Grès cérame 60×60",
      unite: "m²",
      prix_lo: 12,
      prix_sug: 18,
      prix_hi: 30,
    },
    {
      categorie: "Finitions",
      label: "Colle à carrelage flex",
      unite: "m²",
      prix_lo: 3,
      prix_sug: 5,
      prix_hi: 8,
    },
    {
      categorie: "Électricité",
      label: "Prise / interrupteur",
      unite: "u",
      prix_lo: 4,
      prix_sug: 10,
      prix_hi: 32,
    },
    {
      categorie: "Électricité",
      label: "Tableau électrique 24M",
      unite: "u",
      prix_lo: 25,
      prix_sug: 38,
      prix_hi: 65,
    },
  ],
  postesSystematiques: [
    {
      label: "Membrane étanchéité zones humides",
      niveau: "obligatoire",
      note: "Douche, WC, cuisine — toujours",
    },
    {
      label: "Protection chantier (sol/murs)",
      niveau: "obligatoire",
      note: "Carton, film, protection escalier",
    },
  ],
};

describe("assistantReferenceContext", () => {
  it("builds a compact metier reference with suggested keys, prestations, and materials", () => {
    const context = buildAssistantReferenceContext(SAMPLE_REFERENCE_DATA, {
      maxPrestationsPerMetier: 3,
      maxMateriauxPerMetier: 3,
    });

    const plomberie = context.metiers.find((metier) => metier.metier_key === "plomberie");
    const carrelage = context.metiers.find((metier) => metier.metier_key === "carrelage");
    const electricite = context.metiers.find((metier) => metier.metier_key === "electricite");

    expect(context.summary.metiers_count).toBe(3);
    expect(plomberie?.name).toBe("Plombier");
    expect(plomberie?.prestations_typiques.some((item) => item.label.includes("WC suspendu"))).toBe(true);
    expect(plomberie?.mat_line_templates.some((item) => item.label === "WC suspendu + bâti")).toBe(true);
    expect(carrelage?.mo_line_templates.some((item) => item.label.includes("Pose carrelage sol 60×60"))).toBe(true);
    expect(electricite?.mat_line_templates.some((item) => item.label === "Prise / interrupteur")).toBe(true);
  });

  it("formats the compact context into a prompt-ready block with conventions and templates", () => {
    const context = buildAssistantReferenceContext(SAMPLE_REFERENCE_DATA);
    const block = formatAssistantReferenceContext(context);

    expect(block).toContain("REFERENTIEL METIER COMPACT");
    expect(block).toContain("metier_key: slug technique du metier");
    expect(block).toContain("plomberie | Plombier");
    expect(block).toContain("Pose carrelage sol 60×60");
    expect(block).toContain("Prise / interrupteur");
    expect(block).toContain("Membrane étanchéité zones humides");
  });

  it("injects the compact metier reference into the wizard system prompt", () => {
    const prompt = buildONASystemPromptFromData({
      rapport: "Renovation d'une salle de bain avec receveur, WC suspendu et reprise carrelage mural.",
      ...SAMPLE_REFERENCE_DATA,
    });

    expect(prompt).toContain("REFERENTIEL METIER COMPACT POUR GENERER LE PAYLOAD CANONIQUE");
    expect(prompt).toContain("mo_line_templates:");
    expect(prompt).toContain("mat_line_templates:");
    expect(prompt).toContain("WC suspendu + bâti");
    expect(prompt).toContain("Pose carrelage sol 60×60");
    expect(prompt).toContain("sequence: liste ordonnee de metier_key");
    expect(prompt).toContain("lots typiques: Salle de bain, Cuisine, Buanderie, Sanitaires");
    expect(prompt).toContain("categories materiaux: Plomberie, Consommables, Finitions");
    expect(prompt).toContain("POSTES SYSTEMATIQUES A VERIFIER");
    expect(prompt).toContain("Membrane étanchéité zones humides");
  });
});
