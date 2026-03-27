// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ONA Group — BuildLogic v8 NETLIFY
// Supabase JS direct — zéro proxy LLM — < 300ms partout
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { sb } from "./supabase.js";

const REFERENTIEL_SNAPSHOT = {"mo":[{"metier":"Carreleur","icon":"⬛","lo":250,"sug":320,"hi":400,"coeff":0.90,"note":"Sol et mur, grande dalle, mosaïque"},{"metier":"Chauffagiste","icon":"🔥","lo":320,"sug":420,"hi":560,"coeff":0.75,"note":"Chaudière, radiateurs, plancher chauffant, PAC"},{"metier":"Couvreur","icon":"🏠","lo":280,"sug":360,"hi":480,"coeff":0.85,"note":"Toiture, charpente, tuiles, étanchéité"},{"metier":"Cuisiniste","icon":"🍳","lo":260,"sug":340,"hi":440,"coeff":0.82,"note":"Pose mobilier cuisine, plan de travail"},{"metier":"Démolisseur","icon":"⛏","lo":250,"sug":320,"hi":400,"coeff":0.92,"note":"Curage, démolition lourde, évacuation gravats"},{"metier":"Électricien","icon":"⚡","lo":280,"sug":360,"hi":440,"coeff":0.85,"note":"Tableau, circuits, prises, éclairage"},{"metier":"Façadier","icon":"🧱","lo":260,"sug":340,"hi":440,"coeff":0.88,"note":"ITE, enduit façade, ravalement"},{"metier":"Maçon","icon":"🏗","lo":280,"sug":340,"hi":400,"coeff":0.85,"note":"Démolition, cloisons, béton"},{"metier":"Menuisier","icon":"🚪","lo":280,"sug":350,"hi":420,"coeff":0.80,"note":"Portes, fenêtres, placards, escalier"},{"metier":"Parqueteur","icon":"🪵","lo":220,"sug":300,"hi":380,"coeff":0.90,"note":"Parquet, LVT, vinyle, stratifié"},{"metier":"Peintre","icon":"🖌","lo":200,"sug":280,"hi":360,"coeff":0.95,"note":"Murs, plafonds, boiseries"},{"metier":"Plafonneur","icon":"🪣","lo":250,"sug":315,"hi":380,"coeff":0.85,"note":"Enduit, staff, placo"},{"metier":"Plombier","icon":"🔧","lo":320,"sug":420,"hi":560,"coeff":0.75,"note":"Sanitaires, évacuations, alimentation"},{"metier":"Technicien VMC","icon":"💨","lo":280,"sug":380,"hi":500,"coeff":0.75,"note":"VMC simple/double flux, climatisation"}],"mat":[{"cat":"Chauffage","label":"Chaudière gaz condensation","unite":"u","lo":800,"sug":1400,"hi":2600,"note":"FACQ/spécialiste ✅"},{"cat":"Chauffage","label":"Radiateur acier panneau","unite":"u","lo":55,"sug":110,"hi":260,"note":"FACQ/Zelfbouwmarkt ✅"},{"cat":"Chauffage","label":"Tuyauterie chauffage (ml)","unite":"ml","lo":3,"sug":5,"hi":10,"note":"FACQ ✅"},{"cat":"Chauffage","label":"Vanne thermostatique","unite":"u","lo":7,"sug":16,"hi":38,"note":"FACQ ✅"},{"cat":"Cloisons/Plafonds","label":"Bande à joints + enduit","unite":"m²","lo":1.5,"sug":2.5,"hi":5,"note":"Brico.be ✅"},{"cat":"Cloisons/Plafonds","label":"Fourrure 60/27","unite":"ml","lo":1.5,"sug":2.5,"hi":4,"note":"Brico Plan-it ✅"},{"cat":"Cloisons/Plafonds","label":"Montant métallique C48/C70","unite":"ml","lo":1.5,"sug":2.5,"hi":4,"note":"Brico Plan-it ✅"},{"cat":"Cloisons/Plafonds","label":"Plaque Gyproc BA13","unite":"m²","lo":3.5,"sug":5,"hi":8,"note":"Multisources BE ✅"},{"cat":"Cloisons/Plafonds","label":"Plaque Gyproc Hydro","unite":"m²","lo":5,"sug":7,"hi":11,"note":"Multisources BE ✅"},{"cat":"Cloisons/Plafonds","label":"Rail métallique U48/U70","unite":"ml","lo":1.2,"sug":2,"hi":3.5,"note":"Brico Plan-it ✅"},{"cat":"Cloisons/Plafonds","label":"Suspente F530","unite":"u","lo":0.8,"sug":1.5,"hi":3,"note":"Brico Plan-it ✅"},{"cat":"Cloisons/Plafonds","label":"Vis à plâtre (boîte 1000)","unite":"u","lo":8,"sug":12,"hi":18,"note":"Toolstation ✅"},{"cat":"Consommables","label":"Chevilles + visserie","unite":"u","lo":6,"sug":14,"hi":28,"note":"Toolstation ✅"},{"cat":"Consommables","label":"Colle PVC + primaire","unite":"u","lo":6,"sug":10,"hi":18,"note":"Brico ✅"},{"cat":"Consommables","label":"Mousse PU 750ml","unite":"u","lo":6,"sug":9,"hi":15,"note":"Toolstation ✅"},{"cat":"Consommables","label":"Protection chantier","unite":"u","lo":12,"sug":25,"hi":55,"note":"Brico ✅"},{"cat":"Consommables","label":"Ruban adhésif pare-vapeur","unite":"u","lo":5,"sug":9,"hi":16,"note":"Hubo ✅"},{"cat":"Consommables","label":"Silicone bâtiment 310ml","unite":"u","lo":4,"sug":6,"hi":12,"note":"Toolstation ✅"},{"cat":"Consommables","label":"Sous-couche parquet (m²)","unite":"m²","lo":1.5,"sug":3.5,"hi":6,"note":"Brico ✅"},{"cat":"Consommables","label":"WAGO connecteurs (boîte 100)","unite":"u","lo":15,"sug":25,"hi":40,"note":"Toolstation ✅"},{"cat":"Électricité","label":"Boîte d'encastrement Ø60","unite":"u","lo":0.5,"sug":1,"hi":2.5,"note":"Toolstation ✅"},{"cat":"Électricité","label":"Boîte de dérivation","unite":"u","lo":1.5,"sug":3.5,"hi":8,"note":"Toolstation ✅"},{"cat":"Électricité","label":"Câble XVB 3G1.5 (100m)","unite":"u","lo":105,"sug":105,"hi":115,"note":"Toolstation ✅"},{"cat":"Électricité","label":"Câble XVB 3G2.5 (100m)","unite":"u","lo":150,"sug":150,"hi":160,"note":"Toolstation ✅"},{"cat":"Électricité","label":"Câble XVB 5G2.5 (100m)","unite":"u","lo":195,"sug":210,"hi":230,"note":"Toolstation ✅"},{"cat":"Électricité","label":"Coffret électrique 24M","unite":"u","lo":25,"sug":38,"hi":65,"note":"Toolstation ✅"},{"cat":"Électricité","label":"Différentiel 300mA 4P","unite":"u","lo":55,"sug":85,"hi":120,"note":"Toolstation ✅"},{"cat":"Électricité","label":"Différentiel 30mA 2P","unite":"u","lo":35,"sug":50,"hi":65,"note":"Toolstation ✅"},{"cat":"Électricité","label":"Disjoncteur divisionnaire","unite":"u","lo":6,"sug":8,"hi":18,"note":"Toolstation ✅"},{"cat":"Électricité","label":"Gaine ICTA Ø20 (100m)","unite":"u","lo":18,"sug":25,"hi":38,"note":"Toolstation ✅"},{"cat":"Électricité","label":"Luminaire / spot LED","unite":"u","lo":6,"sug":18,"hi":55,"note":"Toolstation ✅"},{"cat":"Électricité","label":"Piquet de terre + câble","unite":"u","lo":18,"sug":30,"hi":55,"note":"Toolstation ✅"},{"cat":"Électricité","label":"Preflex VOB 3G2.5 (100m)","unite":"u","lo":150,"sug":169,"hi":178,"note":"Toolstation ✅"},{"cat":"Électricité","label":"Prise / interrupteur","unite":"u","lo":4,"sug":10,"hi":32,"note":"Toolstation ✅"},{"cat":"Électricité","label":"Tableau électrique 24M","unite":"u","lo":25,"sug":38,"hi":65,"note":"Toolstation ✅"},{"cat":"Finitions","label":"Benne à gravats 7m³","unite":"u","lo":200,"sug":280,"hi":420,"note":"Belgique ✅"},{"cat":"Finitions","label":"Colle à carrelage flex","unite":"m²","lo":3,"sug":5,"hi":8,"note":"Brico Plan-it ✅"},{"cat":"Finitions","label":"Cornière/baguette d'angle","unite":"ml","lo":2,"sug":4,"hi":9,"note":"Brico Plan-it ✅"},{"cat":"Finitions","label":"Joint carrelage époxy","unite":"m²","lo":4,"sug":6,"hi":12,"note":"Brico Plan-it ✅"},{"cat":"Finitions","label":"Plinthe carrelage","unite":"ml","lo":3,"sug":6,"hi":14,"note":"Brico Plan-it ✅"},{"cat":"Finitions","label":"Seuil/transition de sol","unite":"u","lo":10,"sug":20,"hi":50,"note":"Brico Plan-it ✅"},{"cat":"Finitions","label":"Silicone sanitaire","unite":"u","lo":5,"sug":9,"hi":18,"note":"Toolstation ✅"},{"cat":"Gros œuvre","label":"Béton / mortier (25kg)","unite":"u","lo":5,"sug":7,"hi":12,"note":"Hubo/Brico ✅"},{"cat":"Gros œuvre","label":"Bloc béton 19x19x39","unite":"u","lo":1.2,"sug":1.8,"hi":3,"note":"Brico Plan-it ✅"},{"cat":"Gros œuvre","label":"Ciment en sac 25kg","unite":"u","lo":5,"sug":8,"hi":13,"note":"Hubo/Brico ✅"},{"cat":"Gros œuvre","label":"Linteau béton 15cm","unite":"ml","lo":8,"sug":14,"hi":25,"note":"BigMat ✅"},{"cat":"Gros œuvre","label":"Mortier de pose (25kg)","unite":"u","lo":5,"sug":8,"hi":13,"note":"Hubo/Brico ✅"},{"cat":"Isolation","label":"Laine de roche panneau (m²)","unite":"m²","lo":5,"sug":8,"hi":14,"note":"Hubo ✅"},{"cat":"Isolation","label":"Laine de verre rouleau (m²)","unite":"m²","lo":3,"sug":5,"hi":8,"note":"Hubo/Brico ✅"},{"cat":"Isolation","label":"Panneau PIR/PUR rigide (m²)","unite":"m²","lo":10,"sug":18,"hi":35,"note":"Brico/Hubo ✅"},{"cat":"Isolation","label":"Pare-vapeur (m²)","unite":"m²","lo":1.5,"sug":3,"hi":6,"note":"Hubo/Brico ✅"},{"cat":"Menuiserie","label":"Escalier bois (volée)","unite":"u","lo":800,"sug":1400,"hi":3500,"note":"Hubo ✅"},{"cat":"Menuiserie","label":"OSB 18mm (plaque 250×125)","unite":"u","lo":20,"sug":28,"hi":42,"note":"Hubo/Brico ✅"},{"cat":"Menuiserie","label":"Placard/dressing sur mesure","unite":"ml","lo":180,"sug":350,"hi":850,"note":"Hubo ✅"},{"cat":"Menuiserie","label":"Porte intérieure + bloc","unite":"u","lo":160,"sug":290,"hi":650,"note":"Hubo/Brico ✅"},{"cat":"Menuiserie","label":"Tasseaux bois 38×38 (ml)","unite":"ml","lo":1.2,"sug":2,"hi":4,"note":"Hubo/Brico ✅"},{"cat":"Menuiserie ext.","label":"Châssis PVC DV standard","unite":"u","lo":280,"sug":450,"hi":700,"note":"Zelfbouwmarkt ✅"},{"cat":"Menuiserie ext.","label":"Châssis aluminium DV","unite":"u","lo":450,"sug":700,"hi":1100,"note":"Zelfbouwmarkt ✅"},{"cat":"Menuiserie ext.","label":"Mousse PU + mastic","unite":"u","lo":8,"sug":14,"hi":24,"note":"Toolstation ✅"},{"cat":"Menuiserie ext.","label":"Seuil de fenêtre","unite":"u","lo":20,"sug":40,"hi":75,"note":"Brico Plan-it ✅"},{"cat":"Menuiserie ext.","label":"Volet PVC/alu","unite":"u","lo":130,"sug":250,"hi":480,"note":"Zelfbouwmarkt ✅"},{"cat":"Mur","label":"Enduit de finition (sac 25kg)","unite":"u","lo":10,"sug":16,"hi":28,"note":"Brico Plan-it ✅"},{"cat":"Mur","label":"Faïence murale premium","unite":"m²","lo":28,"sug":50,"hi":100,"note":"Brico Plan-it ✅"},{"cat":"Mur","label":"Faïence murale standard","unite":"m²","lo":8,"sug":16,"hi":32,"note":"Brico Plan-it ✅"},{"cat":"Mur","label":"Peinture intérieure (pot 10L)","unite":"u","lo":22,"sug":40,"hi":75,"note":"Brico/Gamma ✅"},{"cat":"Peinture","label":"Apprêt / sous-couche (pot 5L)","unite":"u","lo":9,"sug":16,"hi":30,"note":"Brico/Gamma ✅"},{"cat":"Peinture","label":"Bâche de protection chantier","unite":"u","lo":4,"sug":8,"hi":18,"note":"Brico ✅"},{"cat":"Peinture","label":"Peinture extérieure façade (pot 10L)","unite":"u","lo":30,"sug":55,"hi":95,"note":"Brico/Gamma ✅"},{"cat":"Peinture","label":"Peinture intérieure mate (pot 10L)","unite":"u","lo":22,"sug":40,"hi":72,"note":"Brico/Gamma ✅"},{"cat":"Peinture","label":"Rouleau + bac (kit)","unite":"u","lo":4,"sug":7,"hi":16,"note":"Brico ✅"},{"cat":"Plomberie","label":"Baignoire","unite":"u","lo":190,"sug":360,"hi":1100,"note":"Sawiday ✅"},{"cat":"Plomberie","label":"Bâti-support WC suspendu","unite":"u","lo":80,"sug":130,"hi":210,"note":"Zelfbouwmarkt ✅"},{"cat":"Plomberie","label":"Collecteur/nourrice 3 départs","unite":"u","lo":20,"sug":40,"hi":75,"note":"FACQ ✅"},{"cat":"Plomberie","label":"Colonne de douche","unite":"u","lo":100,"sug":240,"hi":750,"note":"Sawiday ✅"},{"cat":"Plomberie","label":"Lavabo + vasque","unite":"u","lo":70,"sug":160,"hi":550,"note":"Sawiday ✅"},{"cat":"Plomberie","label":"Paroi de douche","unite":"u","lo":150,"sug":290,"hi":850,"note":"Sawiday ✅"},{"cat":"Plomberie","label":"Plaque commande WC","unite":"u","lo":20,"sug":50,"hi":140,"note":"FACQ ✅"},{"cat":"Plomberie","label":"Raccord à sertir multicouche","unite":"u","lo":2.5,"sug":5,"hi":10,"note":"FACQ ✅"},{"cat":"Plomberie","label":"Radiateur sèche-serviettes","unite":"u","lo":100,"sug":195,"hi":480,"note":"Zelfbouwmarkt ✅"},{"cat":"Plomberie","label":"Receveur de douche","unite":"u","lo":100,"sug":190,"hi":480,"note":"Sawiday ✅"},{"cat":"Plomberie","label":"Robinetterie SdB mitigeur","unite":"u","lo":55,"sug":140,"hi":480,"note":"Sawiday ✅"},{"cat":"Plomberie","label":"Siphon de sol","unite":"u","lo":12,"sug":25,"hi":55,"note":"FACQ ✅"},{"cat":"Plomberie","label":"Tube multicouche 16mm (50m)","unite":"u","lo":50,"sug":70,"hi":95,"note":"FACQ ✅"},{"cat":"Plomberie","label":"Tube multicouche 20mm (50m)","unite":"u","lo":70,"sug":90,"hi":120,"note":"FACQ ✅"},{"cat":"Plomberie","label":"Tube PVC évac. Ø100 (barre 2m)","unite":"u","lo":10,"sug":16,"hi":26,"note":"FACQ ✅"},{"cat":"Plomberie","label":"Tube PVC évac. Ø40 (barre 2m)","unite":"u","lo":4,"sug":7,"hi":11,"note":"FACQ ✅"},{"cat":"Plomberie","label":"Tube PVC évac. Ø50 (barre 2m)","unite":"u","lo":5,"sug":9,"hi":14,"note":"FACQ ✅"},{"cat":"Plomberie","label":"Vanne d'arrêt 1/2 tour","unite":"u","lo":7,"sug":13,"hi":24,"note":"FACQ ✅"},{"cat":"Plomberie","label":"WC suspendu + bâti","unite":"u","lo":230,"sug":420,"hi":900,"note":"Sawiday ✅"},{"cat":"Prépa sol","label":"Dépose revêtement (m²)","unite":"m²","lo":0,"sug":0,"hi":0,"note":"MO seule ✅"},{"cat":"Prépa sol","label":"Membrane étanchéité zones humides","unite":"m²","lo":12,"sug":22,"hi":45,"note":"Brico Plan-it ✅"},{"cat":"Prépa sol","label":"Ragréage autonivelant (m²)","unite":"m²","lo":4,"sug":8,"hi":15,"note":"Brico.be ✅"},{"cat":"Sol","label":"Grès cérame 120×120","unite":"m²","lo":28,"sug":42,"hi":75,"note":"Brico.be ✅"},{"cat":"Sol","label":"Grès cérame 120×60","unite":"m²","lo":20,"sug":28,"hi":50,"note":"Brico.be ✅"},{"cat":"Sol","label":"Grès cérame 60×60","unite":"m²","lo":12,"sug":18,"hi":30,"note":"Brico.be ✅"},{"cat":"Sol","label":"Grès cérame 90×60","unite":"m²","lo":18,"sug":25,"hi":42,"note":"Brico.be ✅"},{"cat":"Sol","label":"Parquet contrecollé","unite":"m²","lo":32,"sug":55,"hi":100,"note":"Brico.be ✅"},{"cat":"Sol","label":"Parquet stratifié AC4","unite":"m²","lo":10,"sug":16,"hi":28,"note":"Brico.be ✅"},{"cat":"Sol","label":"Vinyle LVT clipsable","unite":"m²","lo":8,"sug":15,"hi":28,"note":"Brico.be ✅"},{"cat":"Toiture","label":"EPDM membrane toiture plate (m²)","unite":"m²","lo":12,"sug":22,"hi":38,"note":"BigMat ✅"},{"cat":"Toiture","label":"Écran sous-toiture (m²)","unite":"m²","lo":2.5,"sug":4.5,"hi":8,"note":"BigMat ✅"},{"cat":"Toiture","label":"Pare-vapeur toiture (m²)","unite":"m²","lo":1.5,"sug":3,"hi":6,"note":"BigMat ✅"},{"cat":"Toiture","label":"Raccord étanchéité Velux","unite":"u","lo":80,"sug":120,"hi":200,"note":"Gamma.be ✅"},{"cat":"Toiture","label":"Roofing bitumineux (m²)","unite":"m²","lo":9,"sug":16,"hi":28,"note":"BigMat ✅"},{"cat":"Toiture","label":"Velux MK04 78×98 cm","unite":"u","lo":480,"sug":543,"hi":650,"note":"Gamma.be ✅"},{"cat":"Toiture","label":"Velux SK06 114×118 cm","unite":"u","lo":650,"sug":726,"hi":850,"note":"Gamma.be ✅"},{"cat":"VMC/Ventilation","label":"Bouche d'extraction/insufflation","unite":"u","lo":6,"sug":12,"hi":30,"note":"Toolstation ✅"},{"cat":"VMC/Ventilation","label":"Gaine ventilation Ø125 (ml)","unite":"ml","lo":2.5,"sug":4.5,"hi":8,"note":"Toolstation ✅"},{"cat":"VMC/Ventilation","label":"Grille de ventilation","unite":"u","lo":4,"sug":8,"hi":18,"note":"Toolstation ✅"},{"cat":"VMC/Ventilation","label":"Groupe VMC double flux","unite":"u","lo":550,"sug":1100,"hi":2400,"note":"Toolstation ✅"},{"cat":"VMC/Ventilation","label":"Groupe VMC simple flux","unite":"u","lo":70,"sug":130,"hi":260,"note":"Toolstation ✅"}],"postesSystematiques":[{"label":"Membrane étanchéité zones humides","niveau":"obligatoire","note":"Douche, WC, cuisine — toujours"},{"label":"Plinthes et finitions de sol","niveau":"obligatoire","note":"Carrelage ou peintes selon finition"},{"label":"Seuils et transitions entre pièces","niveau":"obligatoire","note":"Un seuil par passage"},{"label":"Protection chantier (sol/murs)","niveau":"obligatoire","note":"Carton, film, protection escalier"},{"label":"Nettoyage fin de chantier","niveau":"obligatoire","note":"Inclure systématiquement"},{"label":"Consommables électricien","niveau":"obligatoire","note":"Câbles, gaines, dominos, boîtes"},{"label":"Frais déplacement sous-traitants","niveau":"frequent","note":"Variable selon zone géo"},{"label":"Évacuation gravats","niveau":"frequent","note":"Benne ou sacs — selon volume"},{"label":"Joints et silicone sanitaires","niveau":"frequent","note":"Tour baignoire, receveur, vasque"},{"label":"Robinetterie et accessoires SdB","niveau":"a_verifier","note":"Souvent fourni client — à confirmer"},{"label":"Cuisiniste","niveau":"a_verifier","note":"Devis séparé en général"},{"label":"Étude stabilité / IPN","niveau":"a_verifier","note":"Obligatoire si mur porteur touché"}],"fournisseurs":[{"nom":"Brico","url":"brico.be","i":"🛠","cats":["Carrelage","Sols","Peinture","Isolation","Consommables"],"quand":"Carrelage (15-25€/m²), parquet, peinture, isolants, backup général","n":"Prix publics en ligne ✅. Large réseau Belgique"},{"nom":"Brico Plan-it","url":"brico-planit.be","i":"🧱","cats":["Cloisons/Plafonds","Carrelage"],"quand":"Gyproc, rails, montants, carrelage","n":"Magasins en Belgique, catalogue large"},{"nom":"FACQ","url":"facq.be","i":"🔧","cats":["Plomberie","Sanitaire","Chauffage"],"quand":"Plomberie principale, sanitaires, chauffage","n":"Compte pro. Showrooms partout en Belgique"},{"nom":"Gamma","url":"gamma.be","i":"🎨","cats":["Peinture"],"quand":"Peinture backup Brico","n":"Prix publics en ligne"},{"nom":"Hubo","url":"hubo.be","i":"🪵","cats":["Isolation","Menuiserie bois","Cloisons/Plafonds"],"quand":"Isolation, menuiserie bois, OSB","n":"Prix publics en ligne ✅"},{"nom":"Sawiday","url":"sawiday.be","i":"🚿","cats":["Sanitaire"],"quand":"Sanitaires haut de gamme en backup FACQ","n":"Spécialiste sanitaire en ligne, livraison Belgique"},{"nom":"Toolstation","url":"toolstation.be","i":"⚡","cats":["Électricité","VMC/Ventilation","Consommables"],"quand":"Électricité, VMC, consommables chantier","n":"Prix publics en ligne ✅. Magasins Bruxelles + Wallonie"},{"nom":"Zelfbouwmarkt","url":"zelfbouwmarkt.be","i":"🏠","cats":["Sanitaire","Carrelage","Châssis"],"quand":"Sanitaires backup FACQ, carrelage, châssis PVC","n":"Spécialiste rénovation, prix publics en ligne"}]};

// ─── Cache localStorage (remplace window.storage) ─────────
const cache = {
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
async function loadProjectsList() {
  const { data, error } = await sb
    .from('bl_projects')
    .select('id, client_nom, adresse, tva, date_visite, validite, store_key, statut, projet_json')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ─── Chargement d'un projet — Supabase direct ────────────
async function loadProject(projectId) {
  const { data, error } = await sb
    .from('bl_projects')
    .select('projet_json')
    .eq('id', projectId)
    .single();
  if (error) throw error;
  return data?.projet_json;
}

// ─── Création d'un nouveau projet — Supabase direct ──────
async function createProject({ clientNom, adresse, tva, dateVisite, validite }) {
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

// ─── 2. LOGIQUE CALCUL ────────────────────────────────────
const GL  = { std:"Standard", mid:"Mid", sup:"Supérieur" };
const fmt = n => (isNaN(n)||n==="") ? "—" : Math.round(n).toLocaleString("fr-BE")+" €";

// Calcul jours chantier réels avec coefficient collectif par métier
const COEFF_COLLECTIF = {
  "Carreleur":0.90,"Plombier":0.75,"Électricien":0.85,"Peintre":0.95,
  "Plafonneur":0.85,"Maçon":0.85,"Menuisier":0.80,"Couvreur":0.85,
  "Chauffagiste":0.75,"Parqueteur":0.90,"Façadier":0.88,"Démolisseur":0.92,
  "Technicien VMC":0.75,"Cuisiniste":0.82,
};
const joursChantier = (jours, nb, metierName) => {
  if (nb <= 1) return jours;
  const coeff = COEFF_COLLECTIF[metierName] ?? 0.85;
  return Math.round((jours / (nb * coeff)) * 100) / 100;
};

const moLV = (st,lk,mid,l) => {
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

const matLV = (st,lk,mid,x) => {
  if (!x || !x.props || !x.props.length) return 0;
  const nk=`${lk}${mid}${x.id}`, pi=st.MAT_PROP[nk]??0, g=st.MAT_GAMME[nk]??"std";
  if (!x.props[pi] || !x.props[pi][g]) return 0;
  const k=`${nk}${pi}${g}`, td=x.props[pi][g], price=Number(st.MAT_PRIX[k]??td.sug);
  if (!x.u) return price;
  const qty=st.MAT_QTY[nk]??(st.MAT_DIM_M2[nk]!=null?Math.ceil(st.MAT_DIM_M2[nk]*1.1):x.qBase??1);
  return price*qty;
};
const metierBase = (st,lk,m) => {
  const mo=m.mo.reduce((s,l)=>s+moLV(st,lk,m.id,l),0);
  const mat=m.mat.reduce((s,x)=>s+matLV(st,lk,m.id,x),0);
  return {mo,mat,base:mo+mat};
};
const metierTotal = (st,lk,m) => {
  const {base}=metierBase(st,lk,m);
  const mv=Number(st.MARGE_VAL[`${lk}${m.id}`]??0), mm=st.MARGE_MODE[`${lk}${m.id}`]??"coeff";
  if (!mv) return base;
  return mm==="coeff" ? base*mv : base+mv;
};
const lotTotals = (st,lot) => {
  const base=lot.metiers.reduce((s,m)=>s+metierBase(st,lot.id,m).base,0);
  const av=lot.metiers.reduce((s,m)=>s+metierTotal(st,lot.id,m),0);
  const marge=av-base, im=st.IMPREVU_MODE[lot.id]??"pct", iv=Number(st.IMPREVU_VAL[lot.id]??lot.imprevuPct??10);
  const imprevu=iv===0?0:im==="pct"?Math.round(av*iv/100):iv;
  return {base,marge,imprevu,total:av+imprevu};
};
const grandTotalGamme = (st,gamme,proj) =>
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

// ─── 3. STATE INITIAL ─────────────────────────────────────
const makeInitialST = (proj) => {
  const im={}, iv={}, lo={};
  proj.lots.forEach(l=>{ im[l.id]="pct"; iv[l.id]=l.imprevuPct??10; lo[l.id]=l.defaultOpen??false; });
  return {
    MO_MODE:{},MO_J:{},MO_TX:{},MO_FORF:{},MO_NB:{},MO_DEP:{},
    MAT_PROP:{},MAT_GAMME:{},MAT_PRIX:{},MAT_QTY:{},MAT_DIM:{},MAT_DIM_M2:{},
    NOTES:{},NOTES_OPEN:{},MARGE_MODE:{},MARGE_VAL:{},
    IMPREVU_MODE:im,IMPREVU_VAL:iv,LINE_OPEN:{},lotOpen:lo,metierOpen:{},
  };
};

// ─── 4. CSS ───────────────────────────────────────────────
const CSS = `
:root{--bg:#f5f5f3;--sf:#fff;--sf2:#f9f9f8;--sf3:#fafaf8;--bd:#e5e5e5;--bd2:#ddd;--bd3:#ccc;--tx:#1a1a1a;--tx2:#555;--tx3:#888;--tx4:#aaa;--bbg:#dbeafe;--btx:#1d4ed8;--bbd:#3b82f6;--gbg:#dcfce7;--gtx:#16a34a;--gbd:#16a34a;--rbg:#fee2e2;--rtx:#dc2626;--amb:#d97706;}
[data-dark]{--bg:#111;--sf:#1c1c1c;--sf2:#222;--sf3:#1a1a1a;--bd:#2a2a2a;--bd2:#333;--bd3:#3d3d3d;--tx:#efefef;--tx2:#aaa;--tx3:#666;--tx4:#444;--bbg:#1e3354;--btx:#60a5fa;--bbd:#3b82f6;--gbg:#14301f;--gtx:#4ade80;--gbd:#22c55e;--rbg:#3b1111;--rtx:#f87171;--amb:#f59e0b;}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:var(--tx);background:var(--bg);padding:1.5rem;transition:background .2s,color .2s;}
select{appearance:none;-webkit-appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='7' height='4'%3E%3Cpath d='M0 0l3.5 4L7 0z' fill='%23888'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 5px center;}
ul{list-style:disc;padding-left:20px;} li{margin-bottom:5px;}
`;

// ─── 5. COMPOSANTS ────────────────────────────────────────

function Toast({msg}) {
  if (!msg) return null;
  return <div style={{position:"fixed",bottom:16,right:16,background:"var(--tx)",color:"var(--bg)",borderRadius:8,padding:"9px 14px",fontSize:12,fontWeight:500,zIndex:999,pointerEvents:"none"}}>{msg}</div>;
}

// ─── ErrorBoundary — attrape les crashes de rendu ─────────
class ErrorBoundary extends React.Component {
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

function BtnMenu({onClick,active,color,bg,children,last}) {
  return (
    <button onClick={e=>{e.stopPropagation();onClick();}}
      style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 14px",fontSize:12,
        background:active?bg:"none",border:"none",borderBottom:last?"none":"1px solid var(--bd)",
        color:active?color:"var(--tx)",cursor:"pointer",textAlign:"left"}}>
      {children}
    </button>
  );
}

function LineCardMO({lk,mid,l,st,setST,allMO,allMAT,clientMode}) {
  const nk=`${lk}${mid}${l.id}`, lkey=`mo_${nk}`;
  const open=st.LINE_OPEN[lkey]??true, mode=st.MO_MODE[nk]??"jours";
  const j=Number(st.MO_J[nk]??l.jRef.sug), tx=Number(st.MO_TX[nk]??l.txRef.sug);
  const nb=Number(st.MO_NB[nk]??1);
  const jChantier = mode==="jours" ? joursChantier(j, nb, l.metierName||"") : null;
  const forf=st.MO_FORF[nk]||"", note=st.NOTES[nk]||"", no=st.NOTES_OPEN[nk];
  const val=moLV(st,lk,mid,l);
  const upd=fn=>setST(prev=>{const n={...prev};fn(n);return n;});
  const toggle=()=>{
    if (clientMode) return;
    if (window.__ONA_FOCUS__) {
      upd(n=>{const nl={...n.LINE_OPEN};allMO.forEach(o=>{nl[`mo_${lk}${mid}${o.id}`]=o.id===l.id?!open:false;});allMAT.forEach(x=>{nl[`mat_${lk}${mid}${x.id}`]=false;});n.LINE_OPEN=nl;});
    } else { upd(n=>{n.LINE_OPEN={...n.LINE_OPEN,[lkey]:!open};}); }
  };
  return (
    <div style={{border:"1px solid var(--bd)",borderRadius:8,marginTop:8,overflow:"hidden"}}>
      <div onClick={toggle} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:"var(--sf)",cursor:clientMode?"default":"pointer",userSelect:"none"}}
        onMouseEnter={e=>{if(!clientMode)e.currentTarget.style.filter="brightness(.97)";}}
        onMouseLeave={e=>e.currentTarget.style.filter=""}>
        <div style={{display:"flex",alignItems:"center",flex:1,minWidth:0}}>
          {!clientMode&&<span style={{fontSize:9,color:"var(--tx3)",marginRight:6,display:"inline-block",transform:open?"rotate(90deg)":"none",transition:"transform .15s"}}>▶</span>}
          <span style={{fontSize:13,fontWeight:600,color:"var(--tx)"}}>{l.label}</span>
          <span style={{fontSize:10,fontWeight:500,padding:"2px 7px",borderRadius:8,marginLeft:7,background:"var(--bbg)",color:"var(--btx)"}}>MO</span>
          {!clientMode&&<span onClick={e=>{e.stopPropagation();upd(n=>{n.NOTES_OPEN={...n.NOTES_OPEN,[nk]:!no};});}} style={{fontSize:11,color:note.trim()?"var(--amb)":"var(--tx4)",cursor:"pointer",padding:"0 6px",borderLeft:"1px solid var(--bd)",marginLeft:6}}>✎</span>}
        </div>
        <div style={{fontSize:13,fontWeight:600,color:"var(--tx)",whiteSpace:"nowrap",marginLeft:8}}>{fmt(val)}</div>
      </div>
      {!clientMode&&no&&<div style={{padding:"6px 12px 8px",borderTop:"1px solid var(--bd)",background:"var(--sf3)"}}><textarea rows={2} value={note} placeholder="Note interne…" onChange={e=>upd(n=>{n.NOTES={...n.NOTES,[nk]:e.target.value};})} style={{width:"100%",padding:"5px 8px",fontSize:12,border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)",resize:"none",fontFamily:"inherit"}}/></div>}
      {!clientMode&&open&&(
        <div style={{display:"flex",alignItems:"flex-end",gap:8,padding:"7px 12px 9px",background:"var(--sf3)",borderTop:"1px solid var(--bd)",flexWrap:"wrap"}}>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            <label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Mode</label>
            <select value={mode} onChange={e=>upd(n=>{n.MO_MODE={...n.MO_MODE,[nk]:e.target.value};})} style={{width:110,fontSize:12,height:26,padding:"0 6px",border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)"}}>
              <option value="jours">Jours × tarif</option><option value="forfait">Forfait global</option>
            </select>
          </div>
          <div style={{width:1,height:22,background:"var(--bd)",alignSelf:"flex-end",flexShrink:0}}/>
          {mode==="jours"?<>
            <div style={{display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Jours</label><input type="number" step={0.25} value={j} onChange={e=>upd(n=>{n.MO_J={...n.MO_J,[nk]:parseFloat(e.target.value)||0};})} style={{width:48,fontSize:12,height:26,textAlign:"right",border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)",padding:"0 6px"}}/></div>
            <span style={{fontSize:11,color:"var(--tx3)",alignSelf:"flex-end",paddingBottom:3}}>×</span>
            <div style={{display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Tarif/j</label><input type="number" step={10} value={tx} onChange={e=>upd(n=>{n.MO_TX={...n.MO_TX,[nk]:parseFloat(e.target.value)||0};})} style={{width:62,fontSize:12,height:26,textAlign:"right",border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)",padding:"0 6px"}}/></div>
            <span style={{fontSize:11,color:"var(--tx3)",alignSelf:"flex-end",paddingBottom:3}}>€/j</span>
            <div style={{width:1,height:22,background:"var(--bd)",alignSelf:"flex-end",flexShrink:0}}/>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              <label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Travailleurs</label>
              <select value={nb} onChange={e=>upd(n=>{n.MO_NB={...n.MO_NB,[nk]:parseInt(e.target.value)||1};})}
                style={{width:52,fontSize:12,height:26,padding:"0 4px",border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)"}}>
                {[1,2,3,4].map(v=><option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            {nb > 1 && <>
              <div style={{width:1,height:22,background:"var(--bd)",alignSelf:"flex-end",flexShrink:0}}/>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                <label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Dép./trav./j</label>
                <input type="number" step={5} value={st.MO_DEP[nk]??0}
                  placeholder="0"
                  onChange={e=>upd(n=>{n.MO_DEP={...n.MO_DEP,[nk]:parseFloat(e.target.value)||0};})}
                  style={{width:52,fontSize:12,height:26,textAlign:"right",border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)",padding:"0 6px"}}/>
              </div>
              <span style={{fontSize:11,color:"var(--tx3)",alignSelf:"flex-end",paddingBottom:3}}>€</span>
              <div style={{display:"flex",flexDirection:"column",gap:3,alignSelf:"flex-end"}}>
                <div style={{fontSize:11,padding:"4px 8px",background:"var(--gbg)",color:"var(--gtx)",borderRadius:6,whiteSpace:"nowrap",fontWeight:500}}>
                  ⏱ {jChantier}j · +{fmt((nb-1)*(st.MO_DEP[nk]??0)*jChantier)} dép.
                </div>
              </div>
            </>}
          </>:<>
            <div style={{display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Forfait HT</label><input type="number" step={50} value={forf} placeholder="0" onChange={e=>upd(n=>{n.MO_FORF={...n.MO_FORF,[nk]:parseFloat(e.target.value)||0};})} style={{width:80,fontSize:12,height:26,textAlign:"right",border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)",padding:"0 6px"}}/></div>
            <span style={{fontSize:11,color:"var(--tx3)",alignSelf:"flex-end",paddingBottom:3}}>€</span>
          </>}
          <span style={{fontSize:10,color:"var(--tx3)",background:"var(--sf)",border:"1px solid var(--bd)",borderRadius:8,padding:"3px 8px",whiteSpace:"nowrap",alignSelf:"flex-end",marginLeft:"auto"}}>Réf. {l.txRef.lo}–{l.txRef.hi} €/j</span>
        </div>
      )}
    </div>
  );
}

function LineCardMat({lk,mid,x,st,setST,allMO,allMAT,clientMode}) {
  const nk=`${lk}${mid}${x.id}`, lkey=`mat_${nk}`;
  const open=st.LINE_OPEN[lkey]??true;
  const pi=Math.min(st.MAT_PROP[nk]??0, (x.props?.length||1)-1);
  const g=st.MAT_GAMME[nk]??"std";
  const safeProps = x.props?.[pi]?.[g] ? x.props[pi] : null;
  const td = safeProps?.[g] ?? {lo:0,sug:0,hi:0,name:"—"};
  const k=`${nk}${pi}${g}`, val=matLV(st,lk,mid,x);
  const note=st.NOTES[nk]||"", no=st.NOTES_OPEN[nk];
  const upd=fn=>setST(prev=>{const n={...prev};fn(n);return n;});
  const gC={std:"var(--btx)",mid:"var(--amb)",sup:"var(--gtx)"};
  const gB={std:"var(--bbd)",mid:"var(--amb)",sup:"var(--gbd)"};
  const qty=x.u?(st.MAT_QTY[nk]??(st.MAT_DIM_M2[nk]!=null?Math.ceil(st.MAT_DIM_M2[nk]*1.1):x.qBase)):null;
  const dim=st.MAT_DIM[nk]??x.dBase;
  const toggle=()=>{
    if (clientMode) return;
    if (window.__ONA_FOCUS__) {
      setST(prev=>{const n={...prev,LINE_OPEN:{...prev.LINE_OPEN}};(allMO||[]).forEach(l=>{n.LINE_OPEN[`mo_${lk}${mid}${l.id}`]=false;});(allMAT||[]).forEach(ox=>{n.LINE_OPEN[`mat_${lk}${mid}${ox.id}`]=ox.id===x.id?!open:false;});return n;});
    } else { setST(prev=>({...prev,LINE_OPEN:{...prev.LINE_OPEN,[lkey]:!open}})); }
  };
  return (
    <div style={{border:"1px solid var(--bd)",borderRadius:8,marginTop:8,overflow:"hidden"}}>
      <div onClick={toggle} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:"var(--sf)",cursor:clientMode?"default":"pointer",userSelect:"none"}}
        onMouseEnter={e=>{if(!clientMode)e.currentTarget.style.filter="brightness(.97)";}}
        onMouseLeave={e=>e.currentTarget.style.filter=""}>
        <div style={{display:"flex",alignItems:"center",flex:1,minWidth:0}}>
          {!clientMode&&<span style={{fontSize:9,color:"var(--tx3)",marginRight:6,display:"inline-block",transform:open?"rotate(90deg)":"none",transition:"transform .15s"}}>▶</span>}
          <span style={{fontSize:13,fontWeight:600,color:"var(--tx)"}}>{x.label}</span>
          {clientMode?<span style={{fontSize:10,color:"var(--tx3)",marginLeft:8}}>{x.props?.[pi]?.name??""}</span>:<span style={{fontSize:10,fontWeight:500,padding:"2px 7px",borderRadius:8,marginLeft:7,background:"var(--gbg)",color:"var(--gtx)"}}>Mat.</span>}
          {!clientMode&&<span onClick={e=>{e.stopPropagation();upd(n=>{n.NOTES_OPEN={...n.NOTES_OPEN,[nk]:!no};});}} style={{fontSize:11,color:note.trim()?"var(--amb)":"var(--tx4)",cursor:"pointer",padding:"0 6px",borderLeft:"1px solid var(--bd)",marginLeft:6}}>✎</span>}
        </div>
        <div style={{fontSize:13,fontWeight:600,color:"var(--tx)",whiteSpace:"nowrap",marginLeft:8}}>{fmt(val)}</div>
      </div>
      {!clientMode&&no&&<div style={{padding:"6px 12px 8px",borderTop:"1px solid var(--bd)",background:"var(--sf3)"}}><textarea rows={2} value={note} placeholder="Note interne…" onChange={e=>upd(n=>{n.NOTES={...n.NOTES,[nk]:e.target.value};})} style={{width:"100%",padding:"5px 8px",fontSize:12,border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)",resize:"none",fontFamily:"inherit"}}/></div>}
      {!clientMode&&open&&(
        <div style={{display:"flex",alignItems:"flex-end",gap:8,padding:"7px 12px 9px",background:"var(--sf3)",borderTop:"1px solid var(--bd)",flexWrap:"wrap"}}>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            <label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Type</label>
            <select value={pi} onChange={e=>upd(n=>{n.MAT_PROP={...n.MAT_PROP,[nk]:parseInt(e.target.value)};})} style={{width:172,fontSize:12,height:26,padding:"0 6px",border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)"}}>
              {x.props.map((p,i)=><option key={i} value={i}>{p.name}</option>)}
            </select>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            <label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Gamme</label>
            <select value={g} onChange={e=>upd(n=>{n.MAT_GAMME={...n.MAT_GAMME,[nk]:e.target.value};})} style={{width:104,fontSize:12,height:26,padding:"0 6px",border:`1px solid ${gB[g]}`,borderRadius:5,background:"var(--sf)",color:gC[g]}}>
              <option value="std">Standard</option><option value="mid">Mid</option><option value="sup">Supérieur</option>
            </select>
          </div>
          {x.u?<>
            <div style={{width:1,height:22,background:"var(--bd)",alignSelf:"flex-end",flexShrink:0}}/>
            <div style={{display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Prix/m²</label><input type="number" step={1} value={Number(st.MAT_PRIX[k]??td.sug)} onChange={e=>upd(n=>{n.MAT_PRIX={...n.MAT_PRIX,[k]:parseFloat(e.target.value)||0};})} style={{width:62,fontSize:12,height:26,textAlign:"right",border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)",padding:"0 6px"}}/></div>
            <span style={{fontSize:11,color:"var(--tx3)",alignSelf:"flex-end",paddingBottom:3}}>€/m²</span>
            <div style={{width:1,height:22,background:"var(--bd)",alignSelf:"flex-end",flexShrink:0}}/>
            <div style={{display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Dim.</label><input type="text" value={dim} onChange={e=>{const v=e.target.value;upd(n=>{n.MAT_DIM={...n.MAT_DIM,[nk]:v};const m=v.replace(",",".").match(/([\d.]+)\s*[x×X]\s*([\d.]+)/);if(m){n.MAT_DIM_M2={...n.MAT_DIM_M2,[nk]:parseFloat(m[1])*parseFloat(m[2])};const q={...n.MAT_QTY};delete q[nk];n.MAT_QTY=q;}});}} style={{width:68,fontSize:12,height:26,border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)",padding:"0 6px",textAlign:"right"}}/></div>
            <div style={{display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Qté m²</label><input type="number" step={1} value={qty} onChange={e=>upd(n=>{n.MAT_QTY={...n.MAT_QTY,[nk]:parseInt(e.target.value)||0};})} style={{width:50,fontSize:12,height:26,textAlign:"right",border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)",padding:"0 6px"}}/></div>
          </>:<>
            <div style={{width:1,height:22,background:"var(--bd)",alignSelf:"flex-end",flexShrink:0}}/>
            <div style={{display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,fontWeight:500,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".03em"}}>Montant</label><input type="number" step={10} value={Number(st.MAT_PRIX[k]??td.sug)} onChange={e=>upd(n=>{n.MAT_PRIX={...n.MAT_PRIX,[k]:parseFloat(e.target.value)||0};})} style={{width:80,fontSize:12,height:26,textAlign:"right",border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx)",padding:"0 6px"}}/></div>
            <span style={{fontSize:11,color:"var(--tx3)",alignSelf:"flex-end",paddingBottom:3}}>€</span>
          </>}
          <span style={{fontSize:10,color:"var(--tx3)",background:"var(--sf)",border:"1px solid var(--bd)",borderRadius:8,padding:"3px 8px",whiteSpace:"nowrap",alignSelf:"flex-end",marginLeft:"auto"}}>Réf. {td.lo}–{td.hi} {x.u?"€/m²":"€"}</span>
        </div>
      )}
    </div>
  );
}

function MetierRow({lk,m,st,setST,clientMode}) {
  const mb=metierBase(st,lk,m).base, mt=metierTotal(st,lk,m);
  const mv=Number(st.MARGE_VAL[`${lk}${m.id}`]??0), mm=st.MARGE_MODE[`${lk}${m.id}`]??"coeff";
  const days=m.mo.reduce((s,l)=>(st.MO_MODE[`${lk}${m.id}${l.id}`]??"jours")==="jours"?s+Number(st.MO_J[`${lk}${m.id}${l.id}`]??l.jRef.sug):s,0);
  const open=st.metierOpen[`${lk}${m.id}`]??true;
  const upd=fn=>setST(prev=>{const n={...prev};fn(n);return n;});
  return (
    <div style={{borderTop:"1px solid var(--bd)"}}>
      <div onClick={()=>upd(n=>{n.metierOpen={...n.metierOpen,[`${lk}${m.id}`]:!open};})} style={{display:"flex",alignItems:"center",padding:"8px 16px",cursor:"pointer",gap:8,userSelect:"none"}} onMouseEnter={e=>e.currentTarget.style.background="var(--sf2)"} onMouseLeave={e=>e.currentTarget.style.background=""}>
        <span style={{fontSize:9,color:"var(--tx3)",display:"inline-block",transform:open?"rotate(90deg)":"none",transition:"transform .18s"}}>▶</span>
        <span style={{fontSize:14}}>{m.icon}</span>
        <span style={{fontSize:13,fontWeight:600,color:"var(--tx)",flexShrink:0}}>{m.name}</span>
        {!clientMode&&<span style={{fontSize:11,color:"var(--tx3)",flexShrink:0}}>{days>0?`${days.toFixed(1)} j · `:""}base {fmt(mb)}</span>}
        <span style={{flex:1}}/>
        {!clientMode&&(
          <div onClick={e=>e.stopPropagation()} style={{display:"flex",alignItems:"center",gap:5,padding:"0 8px",borderLeft:"1px solid var(--bd)",borderRight:"1px solid var(--bd)"}}>
            <span style={{fontSize:10,color:"var(--tx3)",whiteSpace:"nowrap"}}>Marge</span>
            <select value={mm} onChange={e=>upd(n=>{n.MARGE_MODE={...n.MARGE_MODE,[`${lk}${m.id}`]:e.target.value};n.MARGE_VAL={...n.MARGE_VAL,[`${lk}${m.id}`]:0};})} style={{width:90,fontSize:11,height:24,padding:"0 4px",border:"1px solid var(--bd3)",borderRadius:4,background:"var(--sf)",color:"var(--tx)"}}>
              <option value="coeff">Coeff. ×</option><option value="fixe">Montant €</option>
            </select>
            <input type="number" step={mm==="coeff"?0.05:50} value={mv||""} placeholder={mm==="coeff"?"1.25":"500"} onChange={e=>upd(n=>{n.MARGE_VAL={...n.MARGE_VAL,[`${lk}${m.id}`]:parseFloat(e.target.value)||0};})} style={{width:54,fontSize:11,height:24,textAlign:"right",border:"1px solid var(--bd3)",borderRadius:4,background:"var(--sf)",color:"var(--tx)",padding:"0 4px"}}/>
            {(mt-mb)>0&&<span style={{fontSize:11,fontWeight:500,color:"var(--amb)",whiteSpace:"nowrap"}}>+{fmt(mt-mb)}</span>}
          </div>
        )}
        <span style={{fontSize:13,fontWeight:600,color:"var(--tx)",minWidth:64,textAlign:"right"}}>{fmt(mt)}</span>
      </div>
      {open&&<div style={{padding:"0 14px 12px"}}>
        {m.mo.map((l,i)=><LineCardMO key={l.id} lk={lk} mid={m.id} l={l} st={st} setST={setST} allMO={m.mo} allMAT={m.mat} idx={i} clientMode={clientMode}/>)}
        {m.mat.map((x,i)=><LineCardMat key={x.id} lk={lk} mid={m.id} x={x} st={st} setST={setST} allMO={m.mo} allMAT={m.mat} idx={i} clientMode={clientMode}/>)}
      </div>}
    </div>
  );
}

function LotCard({lot,st,setST,clientMode}) {
  let base=0,marge=0,imprevu=0,total=0;
  try { ({base,marge,imprevu,total}=lotTotals(st,lot)); } catch(e) {}
  const isOpen=st.lotOpen[lot.id]??lot.defaultOpen;
  const impMode=st.IMPREVU_MODE[lot.id]??"pct", impVal=st.IMPREVU_VAL[lot.id]??lot.imprevuPct??10;
  const upd=fn=>setST(prev=>{const n={...prev};fn(n);return n;});
  return (
    <div style={{marginBottom:"1rem",border:"1px solid var(--bd)",borderRadius:10,overflow:"hidden",background:"var(--sf)"}}>
      <div onClick={()=>upd(n=>{n.lotOpen={...n.lotOpen,[lot.id]:!isOpen};})} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 16px",cursor:"pointer",userSelect:"none",background:"var(--sf2)"}} onMouseEnter={e=>e.currentTarget.style.filter="brightness(.97)"} onMouseLeave={e=>e.currentTarget.style.filter=""}>
        <div>
          <div style={{fontSize:14,fontWeight:600,color:"var(--tx)"}}>{lot.title}</div>
          <div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>{lot.meta}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          {clientMode
            ?<div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:600,color:"var(--gtx)"}}>{fmt(total)}</div><div style={{fontSize:10,color:"var(--tx3)"}}>Total HT</div></div>
            :[{v:base,l:"Coût base",c:"var(--tx)"},{v:marge,l:"Marge",c:"var(--amb)"},{v:imprevu,l:"Imprévus",c:"var(--rtx)"},{v:total,l:"Total HT",c:"var(--gtx)"}].map(({v,l,c})=>(
              <div key={l} style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:600,color:c}}>{fmt(v)}</div><div style={{fontSize:10,color:"var(--tx3)"}}>{l}</div></div>
            ))
          }
          <span style={{fontSize:10,color:"var(--tx3)",display:"inline-block",transform:isOpen?"rotate(90deg)":"none",transition:"transform .18s",marginLeft:8}}>▶</span>
        </div>
      </div>
      {isOpen&&<>
        {lot.metiers.map(m=><MetierRow key={m.id} lk={lot.id} m={m} st={st} setST={setST} clientMode={clientMode}/>)}
        {!clientMode&&(
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",background:"var(--rbg)",borderTop:"1px solid var(--bd)",flexWrap:"wrap"}}>
            <span style={{fontSize:11,fontWeight:600,color:"var(--rtx)",flexShrink:0}}>⚠️ Provision imprévus</span>
            <select value={impMode} onChange={e=>upd(n=>{n.IMPREVU_MODE={...n.IMPREVU_MODE,[lot.id]:e.target.value};})} style={{fontSize:11,height:24,padding:"0 4px",border:"1px solid var(--bd3)",borderRadius:4,background:"var(--sf)",color:"var(--tx)",width:80}}>
              <option value="pct">% du lot</option><option value="fixe">Montant €</option>
            </select>
            <input type="number" step={impMode==="pct"?1:100} value={impVal} onChange={e=>upd(n=>{n.IMPREVU_VAL={...n.IMPREVU_VAL,[lot.id]:parseFloat(e.target.value)||0};})} style={{width:60,fontSize:11,height:24,textAlign:"right",border:"1px solid var(--bd3)",borderRadius:4,background:"var(--sf)",color:"var(--tx)",padding:"0 4px"}}/>
            {impMode==="pct"&&<span style={{fontSize:11,color:"var(--rtx)"}}>{impVal}%</span>}
            <span style={{fontSize:12,fontWeight:700,color:"var(--rtx)",marginLeft:"auto"}}>{fmt(imprevu)}</span>
            <span style={{fontSize:10,color:"var(--tx3)"}}>inclus dans le total</span>
          </div>
        )}
        <div style={{padding:"10px 16px",background:"var(--sf2)",borderTop:"1px solid var(--bd)"}}>
          <div style={{fontSize:10,fontWeight:600,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:7}}>Ordre d'intervention</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {lot.sequence.map((s,i)=><span key={i} style={{fontSize:10,background:"var(--sf)",border:"1px solid var(--bd)",borderRadius:12,padding:"3px 9px",color:"var(--tx2)",whiteSpace:"nowrap"}}><span style={{color:"var(--tx3)",marginRight:4}}>{i+1}.</span>{s}</span>)}
          </div>
        </div>
        {clientMode?(
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",borderTop:"2px solid var(--bd)"}}>
            <div style={{padding:"9px 14px",fontSize:11,color:"var(--tx3)"}}>Prestations<span style={{display:"block",fontSize:13,fontWeight:600,color:"var(--tx)",marginTop:2}}>{fmt(total-imprevu)}</span></div>
            <div style={{padding:"9px 14px",fontSize:11,color:"var(--tx3)",background:"var(--sf2)"}}>Prix vente HT<span style={{display:"block",fontSize:13,fontWeight:600,color:"var(--gtx)",marginTop:2}}>{fmt(total)}</span></div>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderTop:"2px solid var(--bd)"}}>
            {[{l:"Coût base HT",v:fmt(base)},{l:"Marge",v:`${fmt(marge)}${total>0?` · ${Math.round(marge/total*100)}%`:""}`,c:"var(--amb)"},{l:"Imprévus",v:fmt(imprevu),c:"var(--rtx)",bg:"var(--rbg)"},{l:"Prix vente HT",v:fmt(total),hi:true}].map(({l,v,hi,c,bg})=>(
              <div key={l} style={{padding:"9px 14px",fontSize:11,color:"var(--tx3)",background:bg||(hi?"var(--sf2)":"transparent")}}>{l}<span style={{display:"block",fontSize:13,fontWeight:600,color:c||(hi?"var(--gtx)":"var(--tx)"),marginTop:2}}>{v}</span></div>
            ))}
          </div>
        )}
      </>}
    </div>
  );
}

function HistoryPanel({versions,activeVer,onRestore,onDelete,onClose}) {
  return (
    <div style={{background:"var(--sf)",border:"1px solid var(--bd)",borderRadius:10,marginBottom:"1rem",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"var(--sf2)",borderBottom:"1px solid var(--bd)"}}>
        <span style={{fontSize:13,fontWeight:600,color:"var(--tx)"}}>Historique des versions</span>
        <button onClick={onClose} style={{background:"none",border:"1px solid var(--bd2)",borderRadius:8,padding:"4px 10px",fontSize:12,cursor:"pointer",color:"var(--tx2)"}}>✕ Fermer</button>
      </div>
      {versions.length===0
        ?<div style={{padding:"20px 14px",fontSize:12,color:"var(--tx3)",textAlign:"center"}}>Aucune version. Clique sur 💾 pour créer un point de restauration.</div>
        :[...versions].reverse().map(v=>(
          <div key={v.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:"1px solid var(--bd)",background:activeVer===v.id?"var(--bbg)":"transparent"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:"var(--tx)"}}>{v.label}{activeVer===v.id&&<span style={{fontSize:10,color:"var(--btx)",fontWeight:400,marginLeft:6}}>(active)</span>}</div>
              <div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>{v.date} à {v.time}</div>
            </div>
            <div style={{fontSize:12,fontWeight:500,color:"var(--tx)",whiteSpace:"nowrap",marginRight:8}}>{Math.round(v.grandTotal).toLocaleString("fr-BE")} €</div>
            <div style={{display:"flex",gap:6}}>
              {activeVer!==v.id?<button onClick={()=>onRestore(v.id)} style={{padding:"4px 10px",fontSize:11,fontWeight:500,border:"none",borderRadius:5,background:"var(--bbg)",color:"var(--btx)",cursor:"pointer"}}>↩ Restaurer</button>:<span style={{fontSize:11,color:"var(--btx)",padding:"0 6px"}}>Active</span>}
              <button onClick={()=>onDelete(v.id)} style={{padding:"4px 10px",fontSize:11,fontWeight:500,border:"1px solid var(--bd3)",borderRadius:5,background:"var(--sf)",color:"var(--tx2)",cursor:"pointer"}}>🗑</button>
            </div>
          </div>
        ))
      }
    </div>
  );
}

// ─── MODALS ───────────────────────────────────────────────
function Modal({title,sub,onClose,children,maxWidth}) {
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{display:"flex",position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:1000,alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"var(--sf)",borderRadius:12,maxWidth:maxWidth||720,width:"100%",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderBottom:"1px solid var(--bd)",background:"var(--sf2)",flexShrink:0}}>
          <div><div style={{fontSize:14,fontWeight:700,color:"var(--tx)"}}>{title}</div>{sub&&<div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>{sub}</div>}</div>
          <button onClick={onClose} style={{background:"none",border:"1px solid var(--bd2)",borderRadius:8,padding:"4px 10px",fontSize:13,cursor:"pointer",color:"var(--tx2)"}}>✕</button>
        </div>
        <div style={{overflowY:"auto",flex:1}}>{children}</div>
      </div>
    </div>
  );
}

function CopyBox({text}) {
  return (
    <div style={{padding:"16px 18px",borderTop:"2px solid var(--bd)"}}>
      <div style={{fontSize:11,fontWeight:600,color:"var(--tx3)",marginBottom:8,textTransform:"uppercase",letterSpacing:".05em"}}>📋 Version texte — cliquer pour tout sélectionner</div>
      <textarea readOnly value={text} onFocus={e=>e.target.select()} style={{width:"100%",minHeight:180,padding:"10px 12px",fontSize:11,fontFamily:"monospace",lineHeight:1.8,border:"1px solid var(--bd2)",borderRadius:6,background:"var(--sf2)",color:"var(--tx)",resize:"vertical"}}/>
    </div>
  );
}

function RapportModal({onClose,PROJECT}) {
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
              <li>Séquence : {l.sequence.join(" → ")}</li>
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

function FicheMetiersModal({st,onClose,PROJECT}) {
  const fE=n=>Math.round(n).toLocaleString("fr-BE")+" €";
  const byM={};
  PROJECT.lots.forEach(lot=>{
    lot.metiers.forEach(m=>{
      if (!byM[m.name]) byM[m.name]={icon:m.icon,name:m.name,missions:[]};
      const mo=m.mo.map(l=>{
        const j=Number(st.MO_J[`${lot.id}${m.id}${l.id}`]??l.jRef.sug), mode=st.MO_MODE[`${lot.id}${m.id}${l.id}`]??"jours", note=st.NOTES[`${lot.id}${m.id}${l.id}`]||"";
        return {label:l.label, detail:mode==="jours"?`${j} jour${j>1?"s":""}` :"Forfait", note, val:moLV(st,lot.id,m.id,l)};
      });
      const mat=m.mat.map(x=>{
        const pi=st.MAT_PROP[`${lot.id}${m.id}${x.id}`]??0, qty=x.u?(st.MAT_QTY[`${lot.id}${m.id}${x.id}`]??(st.MAT_DIM_M2[`${lot.id}${m.id}${x.id}`]!=null?Math.ceil(st.MAT_DIM_M2[`${lot.id}${m.id}${x.id}`]*1.1):x.qBase)):null, note=st.NOTES[`${lot.id}${m.id}${x.id}`]||"";
        return {label:x.label, detail:`${x.props?.[pi]?.name??""}${qty?` · ${qty} m²`:""}`, note, val:matLV(st,lot.id,m.id,x)};
      });
      byM[m.name].missions.push({lot:lot.title,lotMeta:lot.meta,mo,mat,total:[...mo,...mat].reduce((a,p)=>a+p.val,0)});
    });
  });
  const metiers=Object.values(byM);
  const txt=metiers.map(m=>{
    const tot=m.missions.reduce((a,ms)=>a+ms.total,0);
    let s=`${"═".repeat(52)}\n${m.icon}  ${m.name.toUpperCase()} — Total : ${fE(tot)}\n${"═".repeat(52)}\n`;
    m.missions.forEach((ms,i)=>{
      s+=`\n— Mission ${i+1} : ${ms.lot.replace(/^Lot \d+ — /,"")} —\n${ms.lotMeta}\n\n`;
      if (ms.mo.length){s+="Travaux à réaliser :\n";ms.mo.forEach(p=>{s+=`  • ${p.label} (${p.detail})\n`;if(p.note)s+=`    → ${p.note}\n`;});}
      if (ms.mat.length){s+="\nFournitures incluses :\n";ms.mat.forEach(p=>{s+=`  • ${p.label} — ${p.detail}\n`;if(p.note)s+=`    → ${p.note}\n`;});}
      s+=`\nMontant mission : ${fE(ms.total)}\n`;
    });
    return s;
  }).join("\n\n");
  return (
    <Modal title={`👷 Fiche missions — ${PROJECT.client}`} sub="Une mission par lot · à transmettre au prestataire" onClose={onClose} maxWidth={800}>
      {metiers.map(m=>{
        const tot=m.missions.reduce((a,ms)=>a+ms.total,0);
        return (
          <div key={m.name} style={{borderBottom:"2px solid var(--bd)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 18px",background:"var(--sf2)"}}>
              <span style={{fontSize:18}}>{m.icon}</span>
              <div><div style={{fontSize:14,fontWeight:700,color:"var(--tx)"}}>{m.name}</div><div style={{fontSize:11,color:"var(--tx3)"}}>{m.missions.length} mission{m.missions.length>1?"s":""} sur ce chantier</div></div>
              <div style={{marginLeft:"auto",textAlign:"right"}}><div style={{fontSize:14,fontWeight:700,color:"var(--amb)"}}>{fE(tot)}</div><div style={{fontSize:10,color:"var(--tx3)"}}>total métier</div></div>
            </div>
            {m.missions.map((ms,i)=>(
              <div key={i} style={{margin:"12px 18px 16px",border:"1px solid var(--bd)",borderRadius:8,overflow:"hidden"}}>
                <div style={{padding:"10px 14px",background:"var(--bbg)",borderBottom:"1px solid var(--bbd)"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"var(--btx)"}}>Mission {i+1} — {ms.lot.replace(/^Lot \d+ — /,"")}</div>
                  <div style={{fontSize:11,color:"var(--tx2)",marginTop:2}}>{ms.lotMeta}</div>
                </div>
                <div style={{padding:"14px 16px",fontSize:13,lineHeight:1.9,color:"var(--tx)"}}>
                  {ms.mo.length>0&&<div style={{marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:8}}>Travaux à réaliser</div><ul>{ms.mo.map((p,pi)=><li key={pi} style={{marginBottom:6}}><span style={{fontWeight:600}}>{p.label}</span><span style={{color:"var(--tx3)",marginLeft:6}}>({p.detail})</span>{p.note&&<div style={{fontSize:12,color:"var(--amb)",marginTop:2,fontStyle:"italic"}}>→ {p.note}</div>}</li>)}</ul></div>}
                  {ms.mat.length>0&&<div><div style={{fontSize:11,fontWeight:700,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:8}}>Fournitures incluses</div><ul>{ms.mat.map((p,pi)=><li key={pi} style={{marginBottom:6}}><span style={{fontWeight:600}}>{p.label}</span><span style={{color:"var(--tx3)",marginLeft:6}}>— {p.detail}</span>{p.note&&<div style={{fontSize:12,color:"var(--amb)",marginTop:2,fontStyle:"italic"}}>→ {p.note}</div>}</li>)}</ul></div>}
                </div>
                <div style={{display:"flex",justifyContent:"flex-end",padding:"8px 14px",background:"var(--sf2)",borderTop:"1px solid var(--bd)"}}><span style={{fontSize:13,fontWeight:700,color:"var(--tx)"}}>{fE(ms.total)}</span></div>
              </div>
            ))}
          </div>
        );
      })}
      <CopyBox text={txt}/>
    </Modal>
  );
}

function FicheClientModal({st,onClose,PROJECT}) {
  const fE=n=>Math.round(n).toLocaleString("fr-BE")+" €";
  const gTotal=PROJECT.lots.reduce((s,lot)=>s+lotTotals(st,lot).total,0);
  const txt=[
    ...PROJECT.lots.map((lot,li)=>{
      const {total}=lotTotals(st,lot);
      const lines=[`${li+1}. ${lot.title.replace(/^Lot \d+ — /,"")}`,`${lot.meta}`,``];
      lot.metiers.forEach(m=>{m.mo.forEach(l=>lines.push(`   • ${l.label}`));m.mat.forEach(x=>{const pi=Math.min(st.MAT_PROP[`${lot.id}${m.id}${x.id}`]??0,(x.props?.length||1)-1);lines.push(`   • ${x.label}${x.props?.[pi]?.name?` — ${x.props[pi].name}`:""}`);}); });
      lines.push(``,`   Montant HT : ${fE(total)}`);
      return lines.join("\n");
    }),
    ``,`─────────────────────────────────`,
    `Total HT  : ${fE(gTotal)}`,`TVA ${PROJECT.tva}%   : ${fE(gTotal*PROJECT.tva/100)}`,`Total TTC : ${fE(gTotal*(1+PROJECT.tva/100))}`,
  ].join("\n");
  return (
    <Modal title={`📄 Fiche client — ${PROJECT.client}`} sub="Lots et prestations · prêt à coller dans le logiciel de facturation" onClose={onClose} maxWidth={740}>
      <div style={{padding:"20px 24px"}}>
        {PROJECT.lots.map((lot,li)=>{
          const {total}=lotTotals(st,lot);
          return (
            <div key={lot.id} style={{marginBottom:16,border:"1px solid var(--bd)",borderRadius:8,overflow:"hidden"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",background:"var(--sf2)",borderBottom:"1px solid var(--bd)"}}>
                <div><div style={{fontSize:13,fontWeight:700,color:"var(--tx)"}}>{li+1}. {lot.title.replace(/^Lot \d+ — /,"")}</div><div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>{lot.meta}</div></div>
                <div style={{fontSize:14,fontWeight:700,color:"var(--gtx)",whiteSpace:"nowrap",marginLeft:16}}>{fE(total)}</div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <ul style={{fontSize:13,lineHeight:2,color:"var(--tx2)"}}>
                  {lot.metiers.flatMap(m=>[
                    ...m.mo.map(l=><li key={`mo${l.id}`}>{l.label}</li>),
                    ...m.mat.map(x=>{const pi=Math.min(st.MAT_PROP[`${lot.id}${m.id}${x.id}`]??0,(x.props?.length||1)-1);return <li key={`mat${x.id}`} style={{color:"var(--tx3)"}}>{x.label}{x.props?.[pi]?.name?` — ${x.props[pi].name}`:""}</li>;}),
                  ])}
                </ul>
              </div>
            </div>
          );
        })}
        <div style={{background:"var(--sf2)",borderRadius:8,padding:"12px 16px"}}>
          {[{l:"Total HT",v:fE(gTotal)},{l:`TVA ${PROJECT.tva}%`,v:fE(gTotal*PROJECT.tva/100)}].map(({l,v})=>(<div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--tx2)",marginBottom:4}}><span>{l}</span><span>{v}</span></div>))}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700,color:"var(--tx)",borderTop:"1px solid var(--bd)",paddingTop:8,marginTop:4}}><span>Total TTC</span><span style={{color:"var(--gtx)"}}>{fE(gTotal*(1+PROJECT.tva/100))}</span></div>
        </div>
      </div>
      <CopyBox text={txt}/>
    </Modal>
  );
}

function ReferentielModal({onClose, REF}) {
  const [tab,setTab]=useState("mo");
  if (!REF) return (
    <Modal title="📊 Référentiel tarifs ONA" sub="Chargement depuis Supabase…" onClose={onClose} maxWidth={780}>
      <div style={{padding:"40px 20px",textAlign:"center",color:"var(--tx3)",fontSize:13}}>
        <div style={{fontSize:24,marginBottom:12}}>⏳</div>
        Chargement du référentiel live depuis Supabase…
      </div>
    </Modal>
  );
  const cats=[...new Set(REF.mat.map(m=>m.cat))];
  const nC={obligatoire:"var(--rtx)",frequent:"var(--amb)",verifier:"var(--btx)"};
  const nB={obligatoire:"var(--rbg)",frequent:"#fffbeb",verifier:"var(--bbg)"};
  const nL={obligatoire:"Obligatoire",frequent:"Fréquent",verifier:"À vérifier"};
  return (
    <Modal title="📊 Référentiel tarifs ONA" sub={`Live Supabase · ${REF.mat.length} matériaux · ${REF.mo.length} corps de métier`} onClose={onClose} maxWidth={780}>
      <div style={{display:"flex",borderBottom:"1px solid var(--bd)",background:"var(--sf2)"}}>
        {[{k:"mo",l:"👷 MO"},{k:"mat",l:"🧱 Matériaux"},{k:"postes",l:"✅ Postes"},{k:"four",l:"🏪 Fournisseurs"}].map(({k,l})=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"10px 14px",fontSize:12,fontWeight:tab===k?600:400,border:"none",borderBottom:tab===k?"2px solid var(--bbd)":"2px solid transparent",background:"none",color:tab===k?"var(--btx)":"var(--tx2)",cursor:"pointer"}}>{l}</button>
        ))}
      </div>
      <div style={{padding:"16px 20px"}}>
        {tab==="mo"&&(
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{background:"var(--sf2)"}}>{["Corps de métier","Lo €/j","Sug €/j","Hi €/j","Notes"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:h==="Corps de métier"||h==="Notes"?"left":"center",fontSize:10,fontWeight:600,color:"var(--tx3)",textTransform:"uppercase",borderBottom:"1px solid var(--bd)"}}>{h}</th>)}</tr></thead>
            <tbody>{REF.mo.map((r,i)=><tr key={i} style={{borderBottom:"1px solid var(--bd)",background:i%2===0?"transparent":"var(--sf2)"}}><td style={{padding:"9px 10px",fontWeight:600}}><span style={{marginRight:6}}>{r.icon}</span>{r.metier}</td><td style={{padding:"9px 10px",textAlign:"center",color:"var(--tx2)"}}>{r.lo} €</td><td style={{padding:"9px 10px",textAlign:"center",fontWeight:700,color:"var(--btx)",background:"var(--bbg)"}}>{r.sug} €</td><td style={{padding:"9px 10px",textAlign:"center",color:"var(--tx2)"}}>{r.hi} €</td><td style={{padding:"9px 10px",color:"var(--tx3)",fontSize:11}}>{r.note}</td></tr>)}</tbody>
          </table>
        )}
        {tab==="mat"&&cats.map(cat=>(
          <div key={cat} style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8,paddingBottom:4,borderBottom:"1px solid var(--bd)"}}>{cat}</div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr>{["Matériau","Unité","Lo","Sug","Hi","Notes"].map(h=><th key={h} style={{padding:"6px 8px",textAlign:h==="Matériau"||h==="Notes"?"left":"center",fontSize:10,fontWeight:600,color:"var(--tx3)",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
              <tbody>{REF.mat.filter(m=>m.cat===cat).map((r,i)=><tr key={i} style={{borderBottom:"1px solid var(--bd)",background:i%2===0?"transparent":"var(--sf2)"}}><td style={{padding:"8px 8px",fontWeight:500}}>{r.label}</td><td style={{padding:"8px 8px",textAlign:"center",color:"var(--tx3)",fontSize:11}}>{r.unite}</td><td style={{padding:"8px 8px",textAlign:"center",color:"var(--tx2)"}}>{r.lo} €</td><td style={{padding:"8px 8px",textAlign:"center",fontWeight:700,color:"var(--btx)",background:"var(--bbg)"}}>{r.sug} €</td><td style={{padding:"8px 8px",textAlign:"center",color:"var(--tx2)"}}>{r.hi} €</td><td style={{padding:"8px 8px",color:"var(--tx3)",fontSize:11}}>{r.note}</td></tr>)}</tbody>
            </table>
          </div>
        ))}
        {tab==="postes"&&(
          <div>
            <div style={{background:"var(--bbg)",borderLeft:"3px solid var(--bbd)",borderRadius:"0 6px 6px 0",padding:"10px 14px",marginBottom:16,fontSize:12,color:"var(--tx2)"}}>Vérifier cette liste avant de valider tout devis. Les postes <strong style={{color:"var(--rtx)"}}>Obligatoires</strong> doivent toujours être inclus.</div>
            {["obligatoire","frequent","verifier"].map(niv=>(
              <div key={niv} style={{marginBottom:20}}>
                <div style={{fontSize:11,fontWeight:700,color:nC[niv],textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>{nL[niv]}</div>
                {REF.postesSystematiques.filter(p=>p.niveau===niv).map((p,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 12px",borderRadius:6,marginBottom:4,background:nB[niv],border:`1px solid ${nC[niv]}22`}}>
                    <span style={{fontSize:14,flexShrink:0,marginTop:1}}>{niv==="obligatoire"?"✅":niv==="frequent"?"⚠️":"🔍"}</span>
                    <div><div style={{fontSize:12,fontWeight:600,color:"var(--tx)"}}>{p.label}</div><div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>{p.note}</div></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        {tab==="four"&&(
          <div>
            <div style={{background:"var(--bbg)",borderLeft:"3px solid var(--bbd)",borderRadius:"0 6px 6px 0",padding:"10px 14px",marginBottom:16,fontSize:12,color:"var(--tx2)"}}>
              Fournisseurs de référence ONA · Magasins physiques en Belgique · Compte pro disponible chez tous
            </div>
            {REF.fournisseurs.map((f,i)=>(
              <div key={i} style={{marginBottom:10,border:"1px solid var(--bd)",borderRadius:8,overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",background:"var(--sf2)",borderBottom:"1px solid var(--bd)"}}>
                  <span style={{fontSize:20}}>{f.i}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--tx)"}}>{f.nom}</div>
                    <div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap"}}>
                      {f.cats.map((c,ci)=><span key={ci} style={{fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:10,background:"var(--bbg)",color:"var(--btx)"}}>{c}</span>)}
                    </div>
                  </div>
                  <a href={`https://${f.url}`} target="_blank" rel="noreferrer" style={{fontSize:11,color:"var(--btx)",textDecoration:"none",padding:"4px 10px",border:"1px solid var(--bbd)",borderRadius:6,whiteSpace:"nowrap"}}>🌐 {f.url}</a>
                </div>
                <div style={{padding:"10px 14px",fontSize:12}}>
                  <div style={{marginBottom:4}}><span style={{fontWeight:600,color:"var(--tx3)"}}>Quand : </span><span style={{color:"var(--tx)"}}>{f.quand}</span></div>
                  <div><span style={{fontWeight:600,color:"var(--tx3)"}}>Note : </span><span style={{color:"var(--tx2)"}}>{f.n}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{padding:"10px 18px",borderTop:"1px solid var(--bd)",background:"var(--sf2)",fontSize:11,color:"var(--tx3)"}}>Tarifs HTVA · Belgique · 2026 · Référentiel chargé live depuis Supabase · Cache 24h</div>
    </Modal>
  );
}

// ─── NewProjectModal — formulaire création projet ─────────
function NewProjectModal({onClose, onCreated}) {
  const [clientNom, setClientNom] = useState('');
  const [adresse, setAdresse]     = useState('');
  const [tva, setTva]             = useState(6);
  const [dateVisite, setDateVisite] = useState(new Date().toISOString().slice(0,10));
  const [validite, setValidite]   = useState(30);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async () => {
    if (!clientNom.trim()) { setError('Le nom du client est requis.'); return; }
    setLoading(true); setError('');
    try {
      const proj = await createProject({ clientNom, adresse, tva, dateVisite, validite });
      onCreated(proj);
    } catch(e) {
      setError(`Erreur : ${e.message}`);
      setLoading(false);
    }
  };

  const inp = {fontSize:13,height:34,padding:"0 10px",border:"1px solid var(--bd3)",borderRadius:6,background:"var(--sf)",color:"var(--tx)",width:"100%"};
  const lbl = {fontSize:11,fontWeight:600,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".04em",marginBottom:5,display:"block"};

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{display:"flex",position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:1000,alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"var(--sf)",borderRadius:12,maxWidth:480,width:"100%",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderBottom:"1px solid var(--bd)",background:"var(--sf2)"}}>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>✚ Nouveau projet</div>
            <div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>Les lots et métiers se créent dans le builder</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"1px solid var(--bd2)",borderRadius:8,padding:"4px 10px",fontSize:13,cursor:"pointer",color:"var(--tx2)"}}>✕</button>
        </div>

        <div style={{padding:"20px 20px 8px",display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={lbl}>Nom du client *</label>
            <input autoFocus value={clientNom} onChange={e=>setClientNom(e.target.value)}
              placeholder="ex : Emeline Dupont" style={inp}
              onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
          </div>
          <div>
            <label style={lbl}>Adresse du bien</label>
            <input value={adresse} onChange={e=>setAdresse(e.target.value)}
              placeholder="ex : Rue de la Paix 12, 1000 Bruxelles" style={inp}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div>
              <label style={lbl}>TVA %</label>
              <select value={tva} onChange={e=>setTva(Number(e.target.value))}
                style={{...inp,paddingRight:24}}>
                <option value={6}>6%</option>
                <option value={21}>21%</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Date visite</label>
              <input type="date" value={dateVisite} onChange={e=>setDateVisite(e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={lbl}>Validité (j)</label>
              <input type="number" value={validite} min={1} max={365} onChange={e=>setValidite(Number(e.target.value))} style={{...inp,textAlign:"right"}}/>
            </div>
          </div>

          {error && <div style={{fontSize:12,color:"var(--rtx)",padding:"8px 12px",background:"var(--rbg)",borderRadius:6}}>{error}</div>}
        </div>

        <div style={{display:"flex",gap:8,padding:"12px 20px 18px",justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"8px 16px",fontSize:13,border:"1px solid var(--bd3)",borderRadius:7,background:"var(--sf)",color:"var(--tx2)",cursor:"pointer"}}>Annuler</button>
          <button onClick={handleSubmit} disabled={loading}
            style={{padding:"8px 20px",fontSize:13,fontWeight:600,border:"none",borderRadius:7,
              background:loading?"var(--bd)":"var(--btx)",color:loading?"var(--tx3)":"#fff",cursor:loading?"default":"pointer"}}>
            {loading ? "⏳ Création…" : "✚ Créer le projet"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── HowToStartModal ──────────────────────────────────────
function HowToStartModal({onClose}) {
  const [copied, setCopied] = useState(false);

  const PROMPT = `Tu es l'assistant de chiffrage d'ONA Group SRL, une entreprise de rénovation belge.
Tu as accès à la base Supabase ONA (abbaqmjidclmmwqcutlj) via MCP.

TON RÔLE : Chef de chantier expert en rénovation belge.
Quand on te soumet un rapport de visite, tu dois :

1. ANALYSER le rapport et identifier :
   - Les pièces / zones concernées et leurs dimensions
   - Les prestations demandées (par pièce ou par type)
   - Les points techniques importants
   - Ce qui est FLOU ou MANQUANT

2. ALERTER sur les oublis classiques ONA :
   Vérifie systématiquement ces postes obligatoires :
   • Membrane étanchéité zones humides (douche, WC, cuisine)
   • Protection chantier sol + murs
   • Évacuation gravats
   • Plinthes et seuils de transition
   • Nettoyage fin de chantier
   • Consommables électricien si électricité touchée
   • Étude stabilité / IPN si mur porteur mentionné

3. COMPLÉTER par des questions ciblées :
   Pose max 3-4 questions par tour, avec choix multiples quand possible.
   Exemples : dimensions manquantes, gamme souhaitée (std/mid/sup),
   fournitures client ou ONA, accès chantier, TVA 6% ou 21%.

4. STRUCTURER les lots :
   Propose une organisation (par pièce OU par prestation selon le cas).
   Demande validation avant de continuer.

5. INSÉRER dans Supabase via MCP quand tout est validé :
   Tables à remplir dans l'ordre :
   - bl_projects : client_nom, adresse, tva, date_visite, rapport_visite, store_key (format: ona_bl_[timestamp_base36]), statut='draft'
   - bl_suspens : texte, niveau (rouge/orange/vert), ordre
   - bl_lots : lot_key (l1, l2...), title, meta, imprevu_pct, sequence (array), default_open, ordre
   - bl_metiers : metier_key (m1/e1/c1/p1...), icon, name, ordre
   - bl_mo_lines : line_key (a, b, c...), label, j_lo/j_sug/j_hi, tx_lo/tx_sug/tx_hi, ordre
   - bl_mat_lines : line_key (m1, m2...), label, avec_unite, q_base, d_base, props (JSONB), ordre

   Tarifs MO référence (€/j HTVA) :
   Maçon 280/340/400 · Plombier 320/420/560 · Électricien 280/360/440
   Carreleur 250/320/400 · Plafonneur 250/315/380 · Menuisier 280/350/420 · Peintre 200/280/360

   Format props JSONB pour bl_mat_lines :
   [{"name":"Option","std":{"lo":X,"sug":Y,"hi":Z},"mid":{"lo":X,"sug":Y,"hi":Z},"sup":{"lo":X,"sug":Y,"hi":Z}}]

6. CONFIRMER après insertion :
   ✅ Projet [NOM CLIENT] créé dans BuildLogic.
   → Ouvre BuildLogic et clique "Charger un projet".`;

  const copy = () => {
    navigator.clipboard.writeText(PROMPT).then(()=>{
      setCopied(true);
      setTimeout(()=>setCopied(false), 2500);
    });
  };

  const S = { // styles réutilisables
    step: { display:"flex", gap:14, marginBottom:20 },
    num:  { width:28, height:28, borderRadius:"50%", background:"var(--btx)", color:"#fff", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 },
    h:    { fontSize:13, fontWeight:700, color:"var(--tx)", marginBottom:4 },
    p:    { fontSize:12, color:"var(--tx2)", lineHeight:1.7 },
    tag:  { display:"inline-block", fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:8, marginRight:4, marginBottom:3 },
  };

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{display:"flex",position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:1000,alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"var(--sf)",borderRadius:12,maxWidth:680,width:"100%",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid var(--bd)",background:"var(--sf2)",flexShrink:0}}>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:"var(--tx)"}}>🚀 Comment démarrer un nouveau devis</div>
            <div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>Flow ONA — du rapport de visite au budget BuildLogic</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"1px solid var(--bd2)",borderRadius:8,padding:"4px 10px",fontSize:13,cursor:"pointer",color:"var(--tx2)"}}>✕</button>
        </div>

        {/* Body */}
        <div style={{overflowY:"auto",flex:1,padding:"24px 24px 8px"}}>

          {/* Flow visuel */}
          <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:28,overflowX:"auto",paddingBottom:4}}>
            {[
              {icon:"📞", label:"Appel client"},
              {icon:"🏗", label:"Visite collègue"},
              {icon:"📋", label:"Rapport reçu"},
              {icon:"🤖", label:"Claude analyse"},
              {icon:"💬", label:"Questions / complète"},
              {icon:"✅", label:"Validation"},
              {icon:"📊", label:"Budget BuildLogic"},
            ].map((s,i,arr)=>(
              <div key={i} style={{display:"flex",alignItems:"center",flexShrink:0}}>
                <div style={{textAlign:"center",minWidth:72}}>
                  <div style={{fontSize:20,marginBottom:3}}>{s.icon}</div>
                  <div style={{fontSize:10,color:"var(--tx3)",lineHeight:1.3}}>{s.label}</div>
                </div>
                {i < arr.length-1 && <div style={{color:"var(--tx4)",fontSize:14,margin:"0 2px",paddingBottom:14}}>→</div>}
              </div>
            ))}
          </div>

          {/* Étapes détaillées */}
          <div style={S.step}>
            <div style={S.num}>1</div>
            <div>
              <div style={S.h}>Ton collègue envoie le rapport de visite</div>
              <div style={S.p}>Il peut être orienté <strong>pièce par pièce</strong> (SdB, cuisine, chambre) ou <strong>par prestation</strong> (électricité, plomberie, peinture) — les deux formats sont acceptés. WhatsApp, mail, notes — peu importe le format.</div>
            </div>
          </div>

          <div style={S.step}>
            <div style={S.num}>2</div>
            <div>
              <div style={S.h}>Ouvre une nouvelle conversation Claude</div>
              <div style={S.p}>Copie le prompt "Chef de chantier ONA" ci-dessous, colle-le comme premier message, puis ajoute le rapport de visite.</div>
              <div style={{marginTop:8,padding:"10px 14px",background:"var(--bbg)",borderRadius:8,border:"1px solid var(--bbd)",fontSize:12,color:"var(--btx)"}}>
                <strong>💡 Astuce :</strong> Commence ton message par :<br/>
                <code style={{background:"rgba(0,0,0,.06)",borderRadius:4,padding:"1px 6px",fontFamily:"monospace"}}>"Voici le rapport de visite de [NOM CLIENT], [ADRESSE] :"</code>
              </div>
            </div>
          </div>

          <div style={S.step}>
            <div style={S.num}>3</div>
            <div>
              <div style={S.h}>Claude joue le rôle de chef de chantier</div>
              <div style={S.p}>Il analyse le rapport, <strong>détecte les oublis</strong> (membrane étanchéité, protection chantier, évacuation gravats…) et te pose des questions ciblées avec choix multiples pour compléter ce qui manque.</div>
              <div style={{display:"flex",flexWrap:"wrap",marginTop:8,gap:4}}>
                {["✅ Postes obligatoires","⚠️ Points en suspens","📐 Dimensions manquantes","🏷 Gamme std/mid/sup","📋 Lots proposés"].map(t=>(
                  <span key={t} style={{...S.tag,background:"var(--gbg)",color:"var(--gtx)"}}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          <div style={S.step}>
            <div style={S.num}>4</div>
            <div>
              <div style={S.h}>Tu valides la structure des lots</div>
              <div style={S.p}>Claude propose une organisation et attend ta confirmation. Tu peux demander des modifications — regrouper des lots, changer l'ordre, renommer.</div>
            </div>
          </div>

          <div style={S.step}>
            <div style={S.num}>5</div>
            <div>
              <div style={S.h}>Claude insère tout dans Supabase</div>
              <div style={S.p}>Une fois validé, Claude crée le projet complet dans la base — lots, métiers, lignes MO et matériaux avec les fourchettes de prix ONA. Il te donne le nom du projet créé.</div>
            </div>
          </div>

          <div style={{...S.step,marginBottom:8}}>
            <div style={S.num}>6</div>
            <div>
              <div style={S.h}>Reviens dans BuildLogic → Charger un projet</div>
              <div style={S.p}>Le projet est là, budget déjà calculé. Tu peux ajuster les quantités, les gammes, les marges — et exporter le devis client.</div>
            </div>
          </div>

          {/* Séparateur */}
          <div style={{borderTop:"2px solid var(--bd)",margin:"20px 0"}}/>

          {/* Prompt à copier */}
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontSize:13,fontWeight:700,color:"var(--tx)"}}>📋 Prompt "Chef de chantier ONA"</div>
              <button onClick={copy}
                style={{padding:"5px 14px",fontSize:12,fontWeight:500,border:"none",borderRadius:6,
                  background:copied?"var(--gbg)":"var(--btx)",color:copied?"var(--gtx)":"#fff",cursor:"pointer",transition:"all .2s"}}>
                {copied ? "✅ Copié !" : "📋 Copier le prompt"}
              </button>
            </div>
            <div style={{background:"var(--sf2)",border:"1px solid var(--bd2)",borderRadius:8,padding:"14px 16px",fontSize:11,fontFamily:"monospace",lineHeight:1.8,color:"var(--tx2)",maxHeight:200,overflowY:"auto",whiteSpace:"pre-wrap"}}>
              {PROMPT}
            </div>
            <div style={{fontSize:11,color:"var(--tx3)",marginTop:8}}>
              Copie ce prompt et colle-le dans une nouvelle conversation Claude (claude.ai) avant de soumettre le rapport de visite.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}


// ─── DocumentationModal ────────────────────────────────────
function DocumentationModal({onClose}) {
  const [section, setSection] = useState('patchnotes');

  const S = {
    overlay: {display:"flex",position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:1000,alignItems:"center",justifyContent:"center",padding:16},
    modal:   {background:"var(--sf)",borderRadius:12,maxWidth:860,width:"100%",maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,.3)"},
    header:  {display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:"1px solid var(--bd)",background:"var(--sf2)",flexShrink:0},
    tabs:    {display:"flex",gap:4,padding:"10px 16px",borderBottom:"1px solid var(--bd)",background:"var(--sf2)",flexShrink:0,flexWrap:"wrap"},
    tab:     (active) => ({padding:"5px 12px",fontSize:12,fontWeight:active?600:400,border:"1px solid",borderColor:active?"var(--btx)":"var(--bd2)",borderRadius:6,background:active?"var(--bbg)":"none",color:active?"var(--btx)":"var(--tx2)",cursor:"pointer"}),
    body:    {overflowY:"auto",flex:1,padding:"20px 24px"},
    h2:      {fontSize:15,fontWeight:700,color:"var(--tx)",marginBottom:12,marginTop:20,paddingTop:16,borderTop:"1px solid var(--bd)"},
    h3:      {fontSize:13,fontWeight:600,color:"var(--tx)",marginBottom:8,marginTop:14},
    p:       {fontSize:13,color:"var(--tx2)",lineHeight:1.7,marginBottom:10},
    code:    {fontFamily:"monospace",fontSize:12,background:"var(--sf2)",border:"1px solid var(--bd)",borderRadius:6,padding:"10px 14px",display:"block",marginBottom:12,whiteSpace:"pre",overflowX:"auto"},
    tag:     (c) => ({display:"inline-block",fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:8,marginRight:6,marginBottom:4,background:c==="rouge"?"var(--rbg)":c==="orange"?"#fff3e0":"var(--gbg)",color:c==="rouge"?"var(--rtx)":c==="orange"?"#e65100":"var(--gtx)"}),
    table:   {width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:16},
    th:      {padding:"5px 10px",borderBottom:"1px solid var(--bd)",textAlign:"left",fontSize:11,fontWeight:600,color:"var(--tx3)"},
    thr:     {padding:"5px 10px",borderBottom:"1px solid var(--bd)",textAlign:"right",fontSize:11,fontWeight:600,color:"var(--tx3)"},
    td:      {padding:"6px 10px",borderBottom:"1px solid var(--bd2)",color:"var(--tx)"},
    tdr:     {padding:"6px 10px",borderBottom:"1px solid var(--bd2)",color:"var(--tx)",textAlign:"right"},
    tdn:     {padding:"6px 10px",borderBottom:"1px solid var(--bd2)",color:"var(--tx2)",fontSize:11},
  };

  const sections = [
    {id:'patchnotes',   label:'📋 Patch notes'},
    {id:'architecture', label:'🏗 Architecture'},
    {id:'flow',         label:'🚀 Flow chantier'},
    {id:'rendements',   label:'📐 Rendements MO'},
    {id:'audit',        label:'🔍 Audit & prompt'},
    {id:'supabase',     label:'🗄 Base de données'},
  ];

  const RENDEMENTS = [
    {metier:"Carreleur", rows:[
      ["Dépose carrelage sol","m²/j",12,18,25],["Ragréage préparatoire","m²/j",20,30,40],
      ["Étanchéité liquide (SPEC)","m²/j",15,20,30],["Pose 60×60","m²/j",6,8,10],
      ["Pose grand format 120×60","m²/j",4,6,7],["Pose grand format 120×120","m²/j",3,4,5],
      ["Faïence murale","m²/j",5,7,9],["Plinthes carrelées","ml/j",15,20,25],
    ]},
    {metier:"Plombier", rows:[
      ["SdB complète (douche+WC+vasque)","j",3,4,5],["Douche italienne seule","j",1,1.5,2],
      ["WC suspendu Geberit+bâti","j",0.5,1,1.5],["Vasque + robinetterie","j",0.5,0.5,1],
      ["Création alimentation eau","ml/j",10,15,20],["Création évacuation EU","ml/j",8,12,18],
      ["Test pression / mise en eau","j",0.5,1,1.5],
    ]},
    {metier:"Électricien", rows:[
      ["Mise en conformité tableau+circuits","j",2,3,5],["Circuit prise/éclairage","j",0.5,0.75,1],
      ["Création saignée + encastrement","ml/j",6,12,18],["Adaptation cuisine standard","j",1,1.5,2],
      ["Raccordement SdB","j",0.5,1,1.5],["Contrôle + tests finaux","j",0.5,1,1.5],
    ]},
    {metier:"Plafonneur", rows:[
      ["Faux plafond simple","m²/j",8,12,15],["Faux plafond avec spots","m²/j",5,8,10],
      ["Cloison simple BA13","m²/j",10,14,18],["Enduit de finition","m²/j",12,18,25],
    ]},
    {metier:"Maçon", rows:[
      ["Démolition mur non porteur","ml/j",3,4,6],["Démolition mur porteur","ml/j",1,2,3],
      ["Ouverture mur porteur+étançonnement","u/j",0.5,1,1.5],["Pose IPN / linteau","j",1,1.5,2],
      ["Évacuation gravats","m³/j",3,5,8],
    ]},
    {metier:"Peintre", rows:[
      ["Préparation support légère","m²/j",25,35,45],["Préparation support lourde","m²/j",12,18,25],
      ["Peinture murs apprêt+2 couches","m²/j",25,35,45],["Peinture plafond","m²/j",20,28,35],
    ]},
    {metier:"Menuisier", rows:[
      ["Pose porte intérieure + bloc","j/u",0.5,0.75,1],["Pose châssis PVC/alu petit format","j/u",1,1.5,2],
      ["Pose châssis grand format >150cm","j/u",1.5,2,3],["Installation cuisine (fournie)","j",2,3,4],
    ]},
  ];

  const PROMPT_AUDIT = `Tu es l'auditeur de chiffrage d'ONA Group SRL.
Tu as accès à la table mo_rendements dans Supabase (abbaqmjidclmmwqcutlj) via MCP.

Voici le projet à auditer (projet_json) :
[COLLER LE PROJET_JSON ICI]

MISSION :
1. Pour chaque ligne MO du projet, comparer les jours budgétés aux rendements de référence dans mo_rendements
2. Détecter les postes sous-estimés (jours réels probables > jours budgétés)
3. Détecter les postes manquants (présents dans mo_rendements mais absents du budget)
4. Générer un rapport par lot avec : budget actuel / budget recommandé / écart de risque

FORMAT DE SORTIE par lot :
## Lot X — [Titre]
| Poste | Budgété | Référence | Verdict | Risque € |
|---|---|---|---|---|
...
**Budget actuel : X€ — Budget recommandé : Y€ — Écart risque : +Z€**

RÈGLES :
- Utiliser la valeur sug des rendements comme référence principale
- Signaler 🔴 si jours budgétés < r_min de la référence
- Signaler 🟠 si jours budgétés entre r_min et r_sug
- Signaler 🟢 si jours budgétés >= r_sug
- Signaler ⚫ si poste absent mais obligatoire selon le contexte
- Calculer le risque en € = (jours_recommandés - jours_budgétés) × taux_sug du métier`;

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={S.overlay}>
      <div style={S.modal}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={{fontSize:15,fontWeight:700}}>📚 Documentation BuildLogic — ONA Group</div>
            <div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>Manuel opérationnel · v8 Netlify · Mars 2026</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"1px solid var(--bd2)",borderRadius:8,padding:"4px 10px",fontSize:13,cursor:"pointer",color:"var(--tx2)"}}>✕</button>
        </div>

        {/* Tabs */}
        <div style={S.tabs}>
          {sections.map(s => (
            <button key={s.id} onClick={()=>setSection(s.id)} style={S.tab(section===s.id)}>{s.label}</button>
          ))}
        </div>

        {/* Body */}
        <div style={S.body}>

          {/* ── PATCH NOTES ── */}
          {section==='patchnotes' && <>
            <div style={{...S.h2,borderTop:"none",marginTop:0,paddingTop:0}}>Historique des versions</div>

            {[
              {
                version: "v8 — Netlify",
                date: "27 mars 2026",
                color: "var(--btx)",
                bg: "var(--bbg)",
                items: [
                  ["Migration Netlify","Passage de l'artifact claude.ai vers une app React/Vite hébergée sur Netlify. Supabase JS direct — zéro proxy LLM — chargements < 300ms."],
                  ["LLM-agnostic","BuildLogic ne dépend plus d'aucun LLM. Claude, ChatGPT ou tout modèle avec connecteur MCP Supabase peut créer et modifier des projets."],
                  ["Page Documentation","Ce manuel opérationnel intégré — architecture, flow chantier, rendements, audit, schéma Supabase."],
                  ["Patch notes","Cet historique des versions."],
                  ["Référentiel rendements","119 prestations encodées dans mo_rendements — 10 corps de métier, sources CSTC + marché belge + validation GPT-4."],
                  ["Prompt auditeur ONA","Prompt pour auditer un projet BuildLogic — croise les lignes MO avec mo_rendements pour détecter sous-estimations et oublis."],
                  ["Sécurité chargement","handleLoadProject sécurisé contre les projet_json null — fallback client_nom depuis la liste."],
                ]
              },
              {
                version: "v7 — Proxy Anthropic (artifact claude.ai)",
                date: "26 mars 2026",
                color: "var(--tx)",
                bg: "var(--sf2)",
                items: [
                  ["Architecture proxy","Artifact claude.ai → api.anthropic.com (seul domaine whitelisté) → MCP Supabase. Contournement de la CSP sandbox."],
                  ["projet_json pré-calculé","Colonne JSONB dans bl_projects — 5 triggers Postgres qui recalculent automatiquement après toute modification des tables bl_*."],
                  ["Référentiel embarqué","REFERENTIEL_SNAPSHOT encodé directement dans le JSX — 111 matériaux, 7 métiers — chargement instantané sans appel proxy."],
                  ["Page How to Start","Modal avec le flow complet et le prompt chef de chantier à copier."],
                  ["Flow chef de chantier","Conversation Claude normale → analyse rapport de visite → questions ciblées → INSERT Supabase → BuildLogic charge le projet."],
                  ["Retry 429","Gestion automatique des rate limits Anthropic — 3 tentatives avec délai 3s/6s/9s."],
                ]
              },
              {
                version: "v6 — Migration Supabase",
                date: "Mars 2026",
                color: "var(--tx)",
                bg: "var(--sf2)",
                items: [
                  ["Tables bl_*","Création du schéma BuildLogic — bl_projects, bl_lots, bl_metiers, bl_mo_lines, bl_mat_lines, bl_suspens avec RLS + policies anon."],
                  ["Architecture data-agnostic","Suppression de toutes les données hardcodées. PROJECT et REFERENTIEL chargés dynamiquement depuis Supabase."],
                  ["Edge Function bl-data","Déployée pour centraliser l'accès données côté serveur (v1 et v2)."],
                  ["Projets de test","Insertion Demo Client (Ninove) et Emeline (Halle — 6 lots, 16 métiers, 25 MO, 26 mat, 5 suspens)."],
                ]
              },
              {
                version: "v1 à v5 — Artifact statique",
                date: "Janvier–Mars 2026",
                color: "var(--tx3)",
                bg: "var(--sf2)",
                items: [
                  ["v1-v3","Prototype artifact claude.ai avec données hardcodées. Moteur de calcul MO + matériaux avec fourchettes std/mid/sup."],
                  ["v4","Ajout historique de versions, modes d'affichage (client/interne), export Markdown."],
                  ["v5","Introduction Supabase — premier essai de migration avec snapshot JSON statique embarqué."],
                ]
              },
            ].map(({version, date, color, bg, items}) => (
              <div key={version} style={{marginBottom:24}}>
                <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:10}}>
                  <div style={{fontSize:14,fontWeight:700,color}}>{version}</div>
                  <div style={{fontSize:11,color:"var(--tx3)"}}>{date}</div>
                </div>
                <div style={{borderLeft:"2px solid var(--bd)",paddingLeft:14}}>
                  {items.map(([titre, desc]) => (
                    <div key={titre} style={{marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
                        <span style={{fontSize:11,fontWeight:600,background:bg,color,padding:"1px 7px",borderRadius:6,flexShrink:0,marginTop:1}}>{titre}</span>
                        <span style={{fontSize:12,color:"var(--tx2)",lineHeight:1.6}}>{desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>}

          {/* ── ARCHITECTURE ── */}
          {section==='architecture' && <>
            <div style={{...S.h2,borderTop:"none",marginTop:0,paddingTop:0}}>Architecture BuildLogic v8</div>
            <div style={S.p}>BuildLogic est l'outil de budgétisation interne d'ONA Group SRL. Il tourne sur Netlify et se connecte directement à Supabase — sans intermédiaire LLM pour le chargement des données.</div>
            <div style={S.code}>{`Netlify (buildlogic-ona.netlify.app)
  └─ React + Vite → Supabase JS direct → < 300ms

Claude (claude.ai) — rôle : chef de chantier / auditeur
  └─ Conversation → MCP Supabase → INSERT/UPDATE tables bl_*
  └─ Supabase triggers → projet_json auto-recalculé
  └─ BuildLogic recharge → budget instantané`}</div>

            <div style={S.h3}>Tables Supabase</div>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Table</th><th style={S.th}>Rôle</th><th style={S.th}>Modifié par</th></tr></thead>
              <tbody>
                {[
                  ["bl_projects","Projet + projet_json pré-calculé","Claude (chef de chantier) + BuildLogic"],
                  ["bl_lots","Lots du projet (structure)","Claude uniquement"],
                  ["bl_metiers","Métiers par lot","Claude uniquement"],
                  ["bl_mo_lines","Lignes main d'œuvre","Claude uniquement"],
                  ["bl_mat_lines","Lignes matériaux + gammes","Claude uniquement"],
                  ["bl_suspens","Points en suspens rouge/orange/vert","Claude + BuildLogic"],
                  ["mo_tarifs","Tarifs MO de référence ONA (€/j)","Manuel via cette conversation"],
                  ["materiaux","Prix matériaux de référence ONA","Manuel via cette conversation"],
                  ["mo_rendements","Rendements par prestation (m²/j, j...)","Manuel — validé ONA + GPT + CSTC"],
                ].map(([t,r,m])=>(
                  <tr key={t}><td style={{...S.td,fontFamily:"monospace",fontSize:11}}>{t}</td><td style={S.td}>{r}</td><td style={S.tdn}>{m}</td></tr>
                ))}
              </tbody>
            </table>

            <div style={S.h3}>Triggers Postgres automatiques</div>
            <div style={S.p}>Dès qu'une ligne est insérée ou modifiée dans <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>bl_lots</code>, <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>bl_metiers</code>, <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>bl_mo_lines</code> ou <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>bl_mat_lines</code>, le champ <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>projet_json</code> est recalculé automatiquement dans <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>bl_projects</code>. BuildLogic charge ce champ pré-calculé → chargement instantané.</div>
          </>}

          {/* ── FLOW CHANTIER ── */}
          {section==='flow' && <>
            <div style={{...S.h2,borderTop:"none",marginTop:0,paddingTop:0}}>Flow complet — du rapport au budget</div>

            {[
              {n:1, icon:"📞", t:"Appel client → RDV → Visite", p:"Le collègue réalise la visite et produit un rapport de visite (texte libre, orienté pièce ou prestation). Il peut être reçu par WhatsApp, mail ou note."},
              {n:2, icon:"🤖", t:"Ouvrir une nouvelle conversation Claude", p:"Copier le prompt 'Chef de chantier ONA' ci-dessous. Coller le rapport de visite. Claude joue le rôle d'un chef de chantier expert en rénovation belge."},
              {n:3, icon:"💬", t:"Claude analyse et complète", p:"Claude identifie les pièces, surfaces, prestations. Il alerte sur les oublis classiques ONA (membrane étanchéité, protection chantier, évacuation gravats, seuils, nettoyage). Il pose max 3-4 questions par tour avec choix multiples."},
              {n:4, icon:"✅", t:"Validation de la structure des lots", p:"Claude propose une organisation par pièce ou par prestation selon le chantier. On valide ensemble avant l'insertion."},
              {n:5, icon:"🗄", t:"Insertion dans Supabase", p:"Claude insère le projet complet dans les tables bl_* via MCP. Les triggers recalculent projet_json automatiquement."},
              {n:6, icon:"📊", t:"Charger dans BuildLogic", p:"Ouvrir BuildLogic → Charger un projet → sélectionner le projet. Le budget est déjà calculé avec toutes les fourchettes std/mid/sup."},
            ].map(({n,icon,t,p})=>(
              <div key={n} style={{display:"flex",gap:14,marginBottom:16}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:"var(--btx)",color:"#fff",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{n}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{icon} {t}</div>
                  <div style={S.p}>{p}</div>
                </div>
              </div>
            ))}

            <div style={S.h3}>Postes obligatoires ONA — toujours vérifier</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
              {["Membrane étanchéité zones humides","Protection chantier sol+murs","Évacuation gravats","Plinthes et seuils de transition","Nettoyage fin de chantier","Consommables électricien","Frais déplacement sous-traitants"].map(p=>(
                <span key={p} style={S.tag("vert")}>{p}</span>
              ))}
            </div>

            <div style={S.h3}>Points en suspens</div>
            <div style={S.p}>Les points en suspens sont encodés dans <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>bl_suspens</code> avec 3 niveaux :</div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16}}>
              <span style={S.tag("rouge")}>🔴 Rouge — bloquant</span>
              <span style={S.tag("orange")}>🟠 Orange — à confirmer</span>
              <span style={S.tag("vert")}>🟢 Vert — informatif</span>
            </div>
          </>}

          {/* ── RENDEMENTS ── */}
          {section==='rendements' && <>
            <div style={{...S.h2,borderTop:"none",marginTop:0,paddingTop:0}}>Grille de rendements de référence</div>
            <div style={S.p}>119 prestations encodées dans <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>mo_rendements</code>. Sources : CSTC, Confédération Construction Belge, marché belge validé GPT-4 (8/10 cohérence). Les coefficients de complexité rénovation sont à valider par ONA — chaque chantier terminé affine ces données.</div>

            <div style={{padding:"8px 12px",background:"var(--bbg)",border:"1px solid var(--bbd)",borderRadius:8,fontSize:12,color:"var(--btx)",marginBottom:16}}>
              <strong>Note :</strong> Ces rendements sont des cadences de production brute. En rénovation, ajouter les temps incompressibles : protection, percements, évacuation, reprises, tests. Le coefficient de complexité rénovation (à valider) sera typiquement ×1.2 à ×1.4 selon le corps de métier.
            </div>

            {RENDEMENTS.map(({metier, rows}) => (
              <div key={metier} style={{marginBottom:20}}>
                <div style={{fontSize:13,fontWeight:600,color:"var(--tx)",marginBottom:6,padding:"5px 10px",background:"var(--sf2)",borderRadius:6}}>{metier}</div>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Prestation</th><th style={S.thr}>Min</th><th style={S.thr}>Sug</th><th style={S.thr}>Max</th><th style={S.th}>Unité</th></tr></thead>
                  <tbody>
                    {rows.map(([label, unite, min, sug, max])=>(
                      <tr key={label}>
                        <td style={S.td}>{label}</td>
                        <td style={S.tdr}>{min}</td>
                        <td style={{...S.tdr,fontWeight:600}}>{sug}</td>
                        <td style={S.tdr}>{max}</td>
                        <td style={S.tdn}>{unite}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </>}

          {/* ── AUDIT ── */}
          {section==='audit' && <>
            <div style={{...S.h2,borderTop:"none",marginTop:0,paddingTop:0}}>Fonction d'audit — principe</div>
            <div style={S.p}>L'audit croise les lignes MO d'un projet BuildLogic avec la table <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>mo_rendements</code> pour détecter les sous-estimations, oublis et risques de dépassement de forfait.</div>

            <div style={S.h3}>Ce que l'audit vérifie</div>
            {[
              ["MO jours sous-estimés","Jours budgétés < r_min de référence → 🔴 risque de dépassement forfait"],
              ["MO à surveiller","Jours budgétés entre r_min et r_sug → 🟠 vérifier contexte"],
              ["Postes manquants","Prestation obligatoire absente du budget → ⚫ oubli probable"],
              ["Marge finale","Budget recommandé vs budget actuel → écart de risque en €"],
            ].map(([t,d])=>(
              <div key={t} style={{marginBottom:10}}>
                <div style={{fontSize:12,fontWeight:600,color:"var(--tx)",marginBottom:2}}>{t}</div>
                <div style={{fontSize:12,color:"var(--tx2)"}}>{d}</div>
              </div>
            ))}

            <div style={S.h3}>Prompt auditeur ONA</div>
            <div style={{...S.code,fontSize:11,lineHeight:1.6}}>{PROMPT_AUDIT}</div>
            <div style={S.p}>Pour utiliser : ouvrir une nouvelle conversation Claude, coller ce prompt, puis coller le <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>projet_json</code> du projet à auditer (disponible dans Supabase, colonne <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>projet_json</code> de <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>bl_projects</code>).</div>

            <div style={S.h3}>Prochaine étape — coefficients de complexité</div>
            <div style={S.p}>Les colonnes <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>coeff_complexite_reno</code> et <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>temps_fixe_j</code> sont créées dans <code style={{fontFamily:"monospace",background:"var(--sf2)",padding:"1px 5px",borderRadius:4}}>mo_rendements</code> et en attente de validation. Sources prévues : CSTC, Confédération Construction Belge, retours chantiers ONA.</div>
          </>}

          {/* ── SUPABASE ── */}
          {section==='supabase' && <>
            <div style={{...S.h2,borderTop:"none",marginTop:0,paddingTop:0}}>Base de données — référence technique</div>

            <div style={S.h3}>Connexion</div>
            <div style={S.code}>{`URL     : https://abbaqmjidclmmwqcutlj.supabase.co
Projet  : abbaqmjidclmmwqcutlj
Clé     : anon (publique — intégrée dans BuildLogic)
MCP URL : https://mcp.supabase.com/mcp`}</div>

            <div style={S.h3}>Format projet_json</div>
            <div style={S.code}>{`{
  "client": "Emeline",
  "adresse": "Halle",
  "tva": 6,
  "dateVisite": "2026-03-26",
  "validite": 30,
  "storeKey": "ona_bl_emeline2026",
  "statut": "draft",
  "suspens": [{"txt":"...","niveau":"rouge"}],
  "lots": [{
    "id": "l1",
    "title": "Lot 1 — Cuisine",
    "imprevuPct": 10,
    "sequence": ["Maçon","Électricien","Plombier","Carreleur"],
    "metiers": [{
      "id": "m1", "icon": "🏗", "name": "Maçon",
      "mo": [{"id":"a","label":"Démolition...","jRef":{"lo":1,"sug":1.5,"hi":2},"txRef":{"lo":280,"sug":340,"hi":400}}],
      "mat": [{"id":"m1","label":"Protection chantier","u":false,"props":[{"name":"...","std":{...},"mid":{...},"sup":{...}}]}]
    }]
  }]
}`}</div>

            <div style={S.h3}>Conventions de nommage</div>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Champ</th><th style={S.th}>Format</th><th style={S.th}>Exemple</th></tr></thead>
              <tbody>
                {[
                  ["store_key","ona_bl_[timestamp_base36]","ona_bl_emeline2026"],
                  ["lot_key","l1, l2, l3...","l1"],
                  ["metier_key","[initiale][numéro_lot]","m1, e1, c1, p1"],
                  ["line_key MO","a, b, c...","a"],
                  ["line_key mat","m1, m2...","m1"],
                ].map(([f,fmt,ex])=>(
                  <tr key={f}>
                    <td style={{...S.td,fontFamily:"monospace",fontSize:11}}>{f}</td>
                    <td style={S.td}>{fmt}</td>
                    <td style={{...S.tdn,fontFamily:"monospace"}}>{ex}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={S.h3}>Tarifs MO de référence ONA (€/j HTVA)</div>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Métier</th><th style={S.thr}>Lo</th><th style={S.thr}>Sug</th><th style={S.thr}>Hi</th></tr></thead>
              <tbody>
                {[["Maçon",280,340,400],["Plombier",320,420,560],["Électricien",280,360,440],["Carreleur",250,320,400],["Plafonneur",250,315,380],["Menuisier",280,350,420],["Peintre",200,280,360]].map(([m,lo,sug,hi])=>(
                  <tr key={m}><td style={S.td}>{m}</td><td style={S.tdr}>{lo}€</td><td style={{...S.tdr,fontWeight:600}}>{sug}€</td><td style={S.tdr}>{hi}€</td></tr>
                ))}
              </tbody>
            </table>
          </>}

        </div>
      </div>
    </div>
  );
}

function ProjSelectorModal({onClose, projListLoading, projectsList, onLoadProject, onRefresh}) {
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{display:"flex",position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:1000,alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"var(--sf)",borderRadius:12,maxWidth:600,width:"100%",maxHeight:"80vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderBottom:"1px solid var(--bd)",background:"var(--sf2)"}}>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>📁 Projets ONA</div>
            <div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>Sélectionne un chantier à charger</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={onRefresh} title="Rafraîchir la liste"
              style={{background:"none",border:"1px solid var(--bd2)",borderRadius:8,padding:"4px 10px",fontSize:12,cursor:"pointer",color:"var(--tx3)"}}>
              🔄
            </button>
            <button onClick={onClose} style={{background:"none",border:"1px solid var(--bd2)",borderRadius:8,padding:"4px 10px",fontSize:13,cursor:"pointer",color:"var(--tx2)"}}>✕</button>
          </div>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"12px 16px"}}>
          {projListLoading
            ? <div style={{textAlign:"center",padding:"30px 0",color:"var(--tx3)",fontSize:13}}>⏳ Chargement des projets…</div>
            : projectsList.length===0
              ? <div style={{textAlign:"center",padding:"30px 0",color:"var(--tx3)",fontSize:13}}>Aucun projet trouvé dans Supabase.</div>
              : projectsList.map(p=>(
                <div key={p.id} onClick={()=>onLoadProject(p.id, p.client_nom)}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",border:"1px solid var(--bd)",borderRadius:8,marginBottom:8,cursor:"pointer",background:"var(--sf)"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--sf2)"}
                  onMouseLeave={e=>e.currentTarget.style.background="var(--sf)"}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--tx)"}}>{p.client_nom}</div>
                    <div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>{p.adresse}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:8,
                      background:p.statut==="accepted"?"var(--gbg)":p.statut==="sent"?"var(--bbg)":"var(--sf2)",
                      color:p.statut==="accepted"?"var(--gtx)":p.statut==="sent"?"var(--btx)":"var(--tx3)"}}>
                      {p.statut==="draft"?"Brouillon":p.statut==="sent"?"Envoyé":p.statut==="accepted"?"Accepté":"Refusé"}
                    </span>
                    <div style={{fontSize:10,color:"var(--tx4)",marginTop:4}}>TVA {p.tva}% · {p.validite}j</div>
                  </div>
                  <span style={{fontSize:16,color:"var(--tx3)"}}>→</span>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── 6. APP PRINCIPALE ────────────────────────────────────
export default function App() {
  // ── Projet dynamique (null = empty state)
  const [PROJECT, setPROJECT] = useState(null);
  const [projLoading, setProjLoading] = useState(false);
  const [projError, setProjError] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [projListLoading, setProjListLoading] = useState(false);
  const [showProjSelector, setShowProjSelector] = useState(false);
  const [showNewProj, setShowNewProj] = useState(false);
  const [showHowTo, setShowHowTo]   = useState(false);
  const [showDoc, setShowDoc]       = useState(false);

  // ── Builder state (réinitialisé quand PROJECT change)
  const [st,setST]       = useState({MO_MODE:{},MO_J:{},MO_TX:{},MO_FORF:{},MO_NB:{},MO_DEP:{},MAT_PROP:{},MAT_GAMME:{},MAT_PRIX:{},MAT_QTY:{},MAT_DIM:{},MAT_DIM_M2:{},NOTES:{},NOTES_OPEN:{},MARGE_MODE:{},MARGE_VAL:{},IMPREVU_MODE:{},IMPREVU_VAL:{},LINE_OPEN:{},lotOpen:{},metierOpen:{}});
  const [stProjectId, setStProjectId] = useState(null); // track quel projet est dans st
  const [versions,setVersions] = useState([]);
  const [activeVer,setActiveVer] = useState(null);
  const [dark,setDark]   = useState(false);
  const [focus,setFocus] = useState(false);
  const [cMode,setCMode] = useState(false);
  const [gammes,setGammes] = useState(false);
  const [showH,setShowH] = useState(false);
  const [showR,setShowR] = useState(false);
  const [showRef,setShowRef] = useState(false);
  const [showM,setShowM] = useState(false);
  const [showC,setShowC] = useState(false);
  const [toast,setToast] = useState("");
  const [REF,setREF]     = useState(null);
  const [refLoading,setRefLoading] = useState(true);
  const [refError,setRefError] = useState(null);
  const [menu,setMenu]   = useState(false);
  const tRef = useRef(null);

  const showToast = useCallback(msg=>{setToast(msg);clearTimeout(tRef.current);tRef.current=setTimeout(()=>setToast(""),3000);},[]);

  window.__ONA_FOCUS__ = focus;

  useEffect(()=>{
    if (dark) document.documentElement.setAttribute("data-dark","");
    else document.documentElement.removeAttribute("data-dark");
  },[dark]);

  // ── Warm-up au démarrage : référentiel instantané + liste projets
  useEffect(()=>{
    setREF(REFERENTIEL_SNAPSHOT);
    setRefLoading(false);
    // Charger uniquement la liste — pas de préchargement des projets (évite le 429)
    (async()=>{
      try {
        const list = await loadProjectsList();
        setProjectsList(list);
      } catch(e) {}
    })();
  },[]);

  // ── Chargement state sauvegardé quand PROJECT change
  useEffect(()=>{
    if (!PROJECT) { setStProjectId(null); return; }
    // Initialiser st IMMÉDIATEMENT et de façon synchrone avant tout rendu
    const initST = makeInitialST(PROJECT);
    setST(initST);
    setStProjectId(PROJECT.storeKey);
    setVersions([]); setActiveVer(null);
    (async()=>{
      let data=null;
      try{const r=await cache.get(PROJECT.storeKey);if(r?.value)data=JSON.parse(r.value);}catch(e){}
      if (!data){try{const r=localStorage.getItem(PROJECT.storeKey);if(r)data=JSON.parse(r);}catch(e){}}
      if (data){
        try {
          if(data.versions)setVersions(data.versions);
          if(data.activeVer)setActiveVer(data.activeVer);
          if(data.ST){
            setST(prev=>{
              // Merge sécurisé — on part du state initial complet et on merge par dessus
              const base = makeInitialST(PROJECT);
              const merged = {...base};
              const validKeys = ['MO_MODE','MO_J','MO_TX','MO_FORF','MO_NB','MO_DEP',
                'MAT_PROP','MAT_GAMME','MAT_PRIX','MAT_QTY','MAT_DIM','MAT_DIM_M2',
                'NOTES','NOTES_OPEN','MARGE_MODE','MARGE_VAL','IMPREVU_MODE','IMPREVU_VAL',
                'LINE_OPEN','lotOpen','metierOpen'];
              validKeys.forEach(k => {
                if(data.ST[k] && typeof data.ST[k]==='object') {
                  merged[k] = {...(base[k]||{}), ...data.ST[k]};
                }
              });
              return merged;
            });
          }
        } catch(e) {
          try { localStorage.removeItem(PROJECT.storeKey); } catch(_) {}
        }
      }
    })();
  },[PROJECT]);

  // ── Projet créé depuis le formulaire → ouvrir directement
  const handleProjectCreated = useCallback((proj)=>{
    setShowNewProj(false);
    setPROJECT(proj);
    // Invalider le cache liste
    setProjectsList([]);
    showToast(`✅ Projet ${proj.client} créé`);
  },[showToast]);

  // ── Rafraîchir la liste manuellement (ex: après création via conversation Claude)
  const handleRefreshList = useCallback(async()=>{
    setProjListLoading(true);
    try {
      try { await cache.delete("ona_proj_list"); } catch(e) {}
      const list = await loadProjectsList();
      setProjectsList(Array.isArray(list) ? list : []);
    } catch(e) {}
    setProjListLoading(false);
  },[]);

  // ── Ouvrir le sélecteur — liste déjà chargée au démarrage
  const handleOpenSelector = useCallback(async()=>{
    setShowProjSelector(true);
    // Si on a déjà la liste en mémoire, on l'affiche immédiatement
    if (projectsList.length > 0) return;
    // Sinon on charge (premier démarrage ou liste vide)
    setProjListLoading(true);
    try {
      try { await cache.delete("ona_proj_list"); } catch(e) {}
      const list = await loadProjectsList();
      setProjectsList(Array.isArray(list) ? list : []);
    } catch(e) {}
    setProjListLoading(false);
  },[projectsList]);

  // ── Charger un projet — utilise projet_json déjà dans la liste
  const handleLoadProject = useCallback(async(projectId, clientNom)=>{
    setShowProjSelector(false);
    setProjLoading(true); setProjError(null);
    try {
      // Chercher dans la liste déjà en mémoire
      const fromList = projectsList.find(p => p.id === projectId);
      if (fromList?.projet_json) {
        const proj = fromList.projet_json;
        // Garantir les champs minimaux
        if (!proj.lots) proj.lots = [];
        if (!proj.suspens) proj.suspens = [];
        if (!proj.client) proj.client = fromList.client_nom || clientNom;
        setPROJECT(proj);
        showToast(`✅ ${proj.client} chargé`);
        setProjLoading(false);
        return;
      }
      // Fallback : Supabase direct si pas de projet_json dans la liste
      const proj = await loadProject(projectId);
      if (!proj) throw new Error("Projet introuvable ou projet_json manquant");
      if (!proj.lots) proj.lots = [];
      if (!proj.suspens) proj.suspens = [];
      if (!proj.client) proj.client = clientNom;
      setPROJECT(proj);
      showToast(`✅ ${proj.client} chargé`);
    } catch(e) {
      setProjError(e.message);
      showToast(`⚠️ Erreur : ${e.message}`);
    }
    setProjLoading(false);
  },[projectsList, showToast]);

  const saveData = useCallback(async(nv,na,ns)=>{
    if (!PROJECT) return null;
    const p=JSON.stringify({versions:nv,activeVer:na,ST:ns});
    try{await cache.set(PROJECT.storeKey,p);return"storage";}catch(e){}
    try{localStorage.setItem(PROJECT.storeKey,p);return"local";}catch(e){}
    return null;
  },[PROJECT]);

  const handleSave = useCallback(async()=>{
    if (!PROJECT) return;
    const n=versions.length+1, d=new Date();
    const ds=`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
    const ts=`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
    const gt=PROJECT.lots.reduce((s,lot)=>s+lotTotals(st,lot).total,0);
    const ver={id:Date.now(),label:`v${n}`,date:ds,time:ts,grandTotal:gt,snap:JSON.parse(JSON.stringify(st))};
    const nv=[...versions,ver]; setVersions(nv); setActiveVer(ver.id);
    const mode=await saveData(nv,ver.id,st);
    showToast(mode==="storage"?`✅ v${n} sauvegardée`:mode==="local"?`✅ v${n} (localStorage)`:"⚠️ Sauvegarde indisponible");
  },[st,versions,saveData,showToast,PROJECT]);

  const handleRestore = useCallback(id=>{
    const ver=versions.find(v=>v.id===id);
    if (!ver||!confirm(`Restaurer "${ver.label}" ?\nModifications perdues.`)) return;
    setST(JSON.parse(JSON.stringify(ver.snap))); setActiveVer(id);
    showToast(`↩ ${ver.label} restaurée`);
  },[versions,showToast]);

  const handleDelete = useCallback(id=>{
    const ver=versions.find(v=>v.id===id);
    if (!ver||!confirm(`Supprimer "${ver.label}" ?`)) return;
    const nv=versions.filter(v=>v.id!==id);
    setVersions(nv); setActiveVer(activeVer===id?(nv.length?nv[nv.length-1].id:null):activeVer);
    showToast("🗑 Version supprimée");
  },[versions,activeVer,showToast]);

  const exportMD = useCallback(forClient=>{
    if (!PROJECT) return;
    const date=new Date().toLocaleDateString("fr-BE",{year:"numeric",month:"long",day:"numeric"});
    const fE=n=>Math.round(n).toLocaleString("fr-BE")+" €";
    let md=`# Proposition budgétaire — ONA Group\n\n**Client :** ${PROJECT.client}  \n**Bien :** ${PROJECT.adresse}  \n**Date :** ${date}  \n**Contact :** +32 469/43.56.38 · invoices@onagroup.be\n\n---\n\n`;
    PROJECT.lots.forEach(lot=>{
      const {total,imprevu}=lotTotals(st,lot);
      md+=`## ${lot.title}\n> ${lot.meta}\n\n`;
      lot.metiers.forEach(m=>{
        const mt=metierTotal(st,lot.id,m);
        md+=`### ${m.name}\n\n| Désignation | Type | Montant HTVA |\n|---|:---:|---:|\n`;
        m.mo.forEach(l=>{const note=st.NOTES[`${lot.id}${m.id}${l.id}`];md+=`| ${l.label} | MO | ${fE(moLV(st,lot.id,m.id,l))} |\n`;if(!forClient&&note?.trim())md+=`| ↳ *${note}* | | |\n`;});
        m.mat.forEach(x=>{const pi=Math.min(st.MAT_PROP[`${lot.id}${m.id}${x.id}`]??0,(x.props?.length||1)-1),g=st.MAT_GAMME[`${lot.id}${m.id}${x.id}`]??"std",note=st.NOTES[`${lot.id}${m.id}${x.id}`];const pname=x.props?.[pi]?.name??"";md+=`| ${x.label}${pname?` — ${pname}`:""}${forClient?"":` (${GL[g]})`} | Mat. | ${fE(matLV(st,lot.id,m.id,x))} |\n`;if(!forClient&&note?.trim())md+=`| ↳ *${note}* | | |\n`;});
        md+=`| **Total ${m.name}** | | **${fE(mt)}** |\n\n`;
      });
      if (!forClient&&imprevu>0) md+=`> ⚠️ **Provision imprévus : ${fE(imprevu)}**\n\n`;
      md+=`**Ordre d'intervention :** ${lot.sequence.map((s,i)=>`${i+1}. ${s}`).join(" · ")}\n\n> **Total ${lot.title} : ${fE(total)}** *(imprévus inclus)*\n\n---\n\n`;
    });
    const gt=PROJECT.lots.reduce((s,lot)=>s+lotTotals(st,lot).total,0);
    md+=`## Récapitulatif\n\n| | Montant |\n|---|---:|\n`;
    PROJECT.lots.forEach(lot=>{md+=`| ${lot.title} | ${fE(lotTotals(st,lot).total)} |\n`;});
    md+=`| | |\n| **Total HT** | **${fE(gt)}** |\n| TVA ${PROJECT.tva}% | **${fE(gt*(1+PROJECT.tva/100))}** |\n\n---\n\n*ONA Group SRL · Proposition non contractuelle · Prix HTVA · Valable ${PROJECT.validite} jours*\n`;
    const blob=new Blob([md],{type:"text/markdown;charset=utf-8"}), url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download=`ONA_${PROJECT.client}${forClient?"_CLIENT":"_INTERNE"}_${date.replace(/\s/g,"_")}.md`; a.style.display="none";
    document.body.appendChild(a); a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},100);
    showToast(forClient?"📤 Markdown client téléchargé":"📋 Markdown interne téléchargé");
  },[st,showToast,PROJECT]);

  const tots  = useMemo(()=>{
    if (!PROJECT) return [];
    try { return PROJECT.lots.map(lot=>lotTotals(st,lot)); } catch(e) { return []; }
  },[st,PROJECT]);
  const gBase = tots.reduce((s,t)=>s+t.base,0), gMarge=tots.reduce((s,t)=>s+t.marge,0);
  const gImp  = tots.reduce((s,t)=>s+t.imprevu,0), gTotal=tots.reduce((s,t)=>s+t.total,0);
  const tStd  = useMemo(()=>{ if(!PROJECT) return 0; try { return grandTotalGamme(st,"std",PROJECT); } catch(e) { return 0; } },[st,PROJECT]);
  const tMid  = useMemo(()=>{ if(!PROJECT) return 0; try { return grandTotalGamme(st,"mid",PROJECT); } catch(e) { return 0; } },[st,PROJECT]);
  const tSup  = useMemo(()=>{ if(!PROJECT) return 0; try { return grandTotalGamme(st,"sup",PROJECT); } catch(e) { return 0; } },[st,PROJECT]);

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",color:"var(--tx)"}}>
      <style>{CSS}</style>

      {/* ── EMPTY STATE ─────────────────────────────────── */}
      {!PROJECT && (
        <div style={{maxWidth:520,margin:"0 auto",padding:"4rem 1.5rem",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:16}}>🏗</div>
          <div style={{fontSize:22,fontWeight:700,color:"var(--tx)",marginBottom:8}}>BuildLogic</div>
          <div style={{fontSize:13,color:"var(--tx3)",marginBottom:32,lineHeight:1.7}}>
            Outil de budgétisation chantier ONA Group SRL.<br/>
            Charge un projet existant ou démarre une nouvelle conversation.
          </div>
          {projLoading
            ? <div style={{fontSize:13,color:"var(--tx3)",padding:"16px 0"}}>⏳ Chargement du projet…</div>
            : <div style={{display:"flex",flexDirection:"column",gap:8,width:"100%",maxWidth:280}}>
                <button onClick={handleOpenSelector}
                  style={{padding:"12px 28px",fontSize:14,fontWeight:600,border:"none",borderRadius:8,background:"var(--btx)",color:"#fff",cursor:"pointer"}}>
                  📁 Charger un projet
                </button>
                <button onClick={()=>setShowNewProj(true)}
                  style={{padding:"10px 28px",fontSize:13,fontWeight:500,border:"1px solid var(--bd3)",borderRadius:8,background:"var(--sf)",color:"var(--tx)",cursor:"pointer"}}>
                  ✚ Nouveau projet
                </button>
                <button onClick={()=>setShowHowTo(true)}
                  style={{padding:"8px 28px",fontSize:12,fontWeight:400,border:"none",borderRadius:8,background:"none",color:"var(--btx)",cursor:"pointer",textDecoration:"underline"}}>
                  🚀 Comment démarrer ?
                </button>
              </div>
          }
          {projError && <div style={{fontSize:12,color:"var(--rtx)",marginTop:12,padding:"8px 14px",background:"var(--rbg)",borderRadius:8}}>⚠️ {projError}</div>}
          <div style={{marginTop:32,padding:"14px 18px",background:"var(--sf)",border:"1px solid var(--bd)",borderRadius:10,width:"100%",maxWidth:360,textAlign:"left"}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Initialisation</div>
            <div style={{fontSize:12,display:"flex",flexDirection:"column",gap:6}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span>{refLoading ? "⏳" : refError ? "⚠️" : "✅"}</span>
                <span style={{color:refError?"var(--rtx)":"var(--tx2)"}}>
                  Référentiel {refLoading ? "en cours…" : refError ? "indisponible" : `${REF?.mat?.length||0} mat · ${REF?.mo?.length||0} MO`}
                </span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span>{refLoading ? "⏳" : projectsList.length === 0 ? "⏳" : "✅"}</span>
                <span style={{color:"var(--tx2)"}}>
                  Projets {refLoading ? "en attente…" : projectsList.length === 0 ? "chargement…" : `${projectsList.length} projet${projectsList.length>1?"s":""} · prêt`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BUILDER ─────────────────────────────────────── */}
      {PROJECT && stProjectId === PROJECT.storeKey && (
      <ErrorBoundary storeKey={PROJECT.storeKey} onReset={()=>setPROJECT(null)}>
      <div style={{maxWidth:960,margin:"0 auto"}}>

        {/* Toolbar */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:"1rem",flexWrap:"wrap"}}>
          <span style={{fontSize:15,fontWeight:600,flex:1,color:"var(--tx)"}}>
            Budget {PROJECT.client}
            {cMode&&<span style={{fontSize:11,fontWeight:500,marginLeft:8,color:"var(--gtx)",background:"var(--gbg)",padding:"2px 8px",borderRadius:8}}>Vue client</span>}
          </span>
          <button onClick={handleOpenSelector} style={{padding:"5px 12px",fontSize:11,fontWeight:500,border:"1px solid var(--bd3)",borderRadius:6,background:"var(--sf)",color:"var(--tx2)",cursor:"pointer",height:30}}>📁 Changer</button>
          <span style={{fontSize:11,color:"var(--tx3)",background:"#eee",borderRadius:8,padding:"2px 8px",border:"1px solid var(--bd2)"}}>{PROJECT.adresse}</span>
          <button onClick={handleSave} style={{padding:"5px 12px",fontSize:12,fontWeight:500,border:"none",borderRadius:6,background:"var(--bbg)",color:"var(--btx)",cursor:"pointer",height:30}}>💾 Sauvegarder</button>
          <button onClick={()=>setFocus(f=>!f)} style={{padding:"5px 12px",fontSize:12,fontWeight:500,border:`1px solid ${focus?"#8b5cf6":"var(--bd3)"}`,borderRadius:6,background:focus?"#ede9fe":"var(--sf)",color:focus?"#7c3aed":"var(--tx)",cursor:"pointer",height:30,transition:"all .15s"}}>{focus?"🎯 Focus":"⊙ Focus"}</button>
          <button onClick={()=>setShowR(true)} style={{padding:"5px 12px",fontSize:12,fontWeight:500,border:"1px solid var(--amb)",borderRadius:6,background:"var(--sf)",color:"var(--amb)",cursor:"pointer",height:30}}>📋 Rapport</button>

          <div style={{position:"relative"}}>
            <button onClick={()=>setMenu(m=>!m)} style={{padding:"5px 10px",fontSize:14,fontWeight:700,border:"1px solid var(--bd3)",borderRadius:6,background:"var(--sf)",color:"var(--tx)",cursor:"pointer",height:30,letterSpacing:1}}>⋮</button>
            {menu&&(
              <div style={{position:"absolute",right:0,top:36,background:"var(--sf)",border:"1px solid var(--bd2)",borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,.15)",zIndex:200,minWidth:220,overflow:"hidden"}}>
                <BtnMenu onClick={()=>{setShowHowTo(true);setMenu(false);}}>🚀 Comment démarrer</BtnMenu>
                <BtnMenu onClick={()=>{setShowDoc(true);setMenu(false);}}>📚 Documentation</BtnMenu>
                <BtnMenu onClick={()=>{setShowH(h=>!h);setMenu(false);}}>🕓 Historique <span style={{marginLeft:"auto",fontSize:10,background:"var(--bbg)",color:"var(--btx)",borderRadius:8,padding:"1px 6px"}}>{versions.length}</span></BtnMenu>
                <BtnMenu onClick={()=>{setShowRef(true);setMenu(false);}}>📊 Référentiel tarifs</BtnMenu>
                <BtnMenu onClick={()=>{setShowM(true);setMenu(false);}}>👷 Fiche par métier</BtnMenu>
                <BtnMenu onClick={()=>{setShowC(true);setMenu(false);}}>📄 Fiche client</BtnMenu>
                <BtnMenu onClick={()=>{exportMD(false);setMenu(false);}}>⬇ Export Markdown interne</BtnMenu>
                <BtnMenu onClick={()=>{exportMD(true);setMenu(false);}}>📤 Export Markdown client</BtnMenu>
                <BtnMenu onClick={()=>{setGammes(g=>!g);setMenu(false);}} active={gammes} color="var(--btx)" bg="var(--bbg)">{gammes?"🎨 Masquer fourchettes":"🎨 Afficher fourchettes"}</BtnMenu>
                <BtnMenu onClick={()=>{setCMode(c=>!c);setMenu(false);}} active={cMode} color="var(--gtx)" bg="var(--gbg)">{cMode?"🔒 Mode interne":"👁 Vue client"}</BtnMenu>
                <BtnMenu onClick={()=>{setDark(d=>!d);setMenu(false);}} last>{dark?"☀️ Mode clair":"🌙 Mode sombre"}</BtnMenu>
              </div>
            )}
          </div>
        </div>

        {showH&&<HistoryPanel versions={versions} activeVer={activeVer} onRestore={handleRestore} onDelete={handleDelete} onClose={()=>setShowH(false)}/>}

        {/* Résumé global */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,minmax(0,1fr))",gap:8,marginBottom:"1rem"}}>
          {cMode?<>
            <div style={{background:"var(--sf)",borderRadius:8,padding:"11px 13px",border:"1px solid var(--gbd)",gridColumn:"span 3"}}>
              <div style={{fontSize:11,color:"var(--tx3)",marginBottom:3}}>Prix vente HT</div>
              <div style={{fontSize:18,fontWeight:600}}>{fmt(gTotal)}</div>
              <div style={{fontSize:10,color:"var(--tx3)",marginTop:2}}>toutes prestations incluses</div>
            </div>
            <div style={{background:"var(--sf)",borderRadius:8,padding:"11px 13px",border:"1px solid var(--bd)",gridColumn:"span 2"}}>
              <div style={{fontSize:11,color:"var(--tx3)",marginBottom:3}}>TVA {PROJECT.tva}%</div>
              <div style={{fontSize:18,fontWeight:600}}>{fmt(gTotal*(1+PROJECT.tva/100))}</div>
              <div style={{fontSize:10,color:"var(--tx3)",marginTop:2}}>bât. +10 ans</div>
            </div>
          </>:[
            {l:"Coût total HT",v:fmt(gBase),s:"MO + matériaux"},
            {l:"Marge totale",v:fmt(gMarge),s:`${gTotal>0?Math.round(gMarge/gTotal*100):0}% prix vente`},
            {l:"Provision imprévus",v:fmt(gImp),s:`${gTotal>0?Math.round(gImp/gTotal*100):0}% du total`,accent:"var(--rtx)"},
            {l:"Prix vente HT",v:fmt(gTotal),s:"imprévus inclus",border:"var(--gbd)"},
            {l:`TVA ${PROJECT.tva}%`,v:fmt(gTotal*(1+PROJECT.tva/100)),s:"bât. +10 ans"},
          ].map(({l,v,s,accent,border})=>(
            <div key={l} style={{background:"var(--sf)",borderRadius:8,padding:"11px 13px",border:`1px solid ${border||"var(--bd)"}`}}>
              <div style={{fontSize:11,color:"var(--tx3)",marginBottom:3}}>{l}</div>
              <div style={{fontSize:18,fontWeight:600,color:accent||"var(--tx)"}}>{v}</div>
              <div style={{fontSize:10,color:"var(--tx3)",marginTop:2}}>{s}</div>
            </div>
          ))}
        </div>

        {/* Fourchettes gammes */}
        {!cMode&&gammes&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:"1.5rem"}}>
            {[{l:"Si tout Standard",v:fmt(tStd),c:"var(--btx)",bg:"var(--bbg)",bd:"var(--bbd)"},{l:"Si tout Mid",v:fmt(tMid),c:"var(--amb)",bg:"#fffbeb",bd:"var(--amb)"},{l:"Si tout Supérieur",v:fmt(tSup),c:"var(--gtx)",bg:"var(--gbg)",bd:"var(--gbd)"}].map(({l,v,c,bg,bd})=>(
              <div key={l} style={{background:bg,borderRadius:8,padding:"9px 13px",border:`1px solid ${bd}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:11,color:c,fontWeight:500}}>{l}</span>
                <span style={{fontSize:14,fontWeight:700,color:c}}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {PROJECT.lots.map(lot=><LotCard key={lot.id} lot={lot} st={st} setST={setST} clientMode={cMode}/>)}

        {cMode?(
          <div style={{fontSize:11,color:"var(--tx3)",borderLeft:"3px solid var(--gbd)",borderRadius:"0 5px 5px 0",background:"var(--gbg)",padding:"8px 14px",marginTop:"1rem",lineHeight:1.7}}>
            Document établi par <strong>ONA Group SRL</strong> · Proposition non contractuelle · Prix HTVA · Valable {PROJECT.validite} jours · +32 469/43.56.38 · invoices@onagroup.be
          </div>
        ):(
          <div style={{fontSize:11,color:"var(--tx3)",borderLeft:"3px solid var(--bbd)",borderRadius:"0 5px 5px 0",background:"var(--bbg)",padding:"8px 14px",marginTop:"1rem",lineHeight:1.7}}>
            {refLoading ? "⏳ Chargement référentiel Supabase…" : refError ? `⚠️ Référentiel indisponible (${refError})` : `✅ Référentiel live · ${REF?.mat?.length||0} matériaux · ${REF?.mo?.length||0} corps de métier`}
            {" — "}<span style={{cursor:"pointer",textDecoration:"underline",color:"var(--btx)"}} onClick={()=>setShowRef(true)}>📊 Voir référentiel</span>
          </div>
        )}
      </div>
      </ErrorBoundary>
      )} {/* fin {PROJECT && ...} */}

      {/* Modals — toujours montés, indépendants du PROJECT state */}
      {showR    && PROJECT && <RapportModal onClose={()=>setShowR(false)} PROJECT={PROJECT}/>}
      {showRef  && <ReferentielModal onClose={()=>setShowRef(false)} REF={REF}/>}
      {showM    && PROJECT && <FicheMetiersModal st={st} onClose={()=>setShowM(false)} PROJECT={PROJECT}/>}
      {showC    && PROJECT && <FicheClientModal st={st} onClose={()=>setShowC(false)} PROJECT={PROJECT}/>}
      {showProjSelector && <ProjSelectorModal onClose={()=>setShowProjSelector(false)} projListLoading={projListLoading} projectsList={projectsList} onLoadProject={handleLoadProject} onRefresh={handleRefreshList}/>}
      {showNewProj && <NewProjectModal onClose={()=>setShowNewProj(false)} onCreated={handleProjectCreated}/>}
      {showHowTo  && <HowToStartModal onClose={()=>setShowHowTo(false)}/>}
      {showDoc    && <DocumentationModal onClose={()=>setShowDoc(false)}/>}
      <Toast msg={toast}/>
    </div>
  );
}
