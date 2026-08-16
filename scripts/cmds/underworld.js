"use strict";

const fonts = require('../../func/font.js');

// ══════════════════════════════════════════════════════════════
//  COOLDOWNS
// ══════════════════════════════════════════════════════════════
const CD = {
  QUETE:      2  * 60 * 60 * 1000,
  PILLAGE:    4  * 60 * 60 * 1000,
  DONJON:     6  * 60 * 60 * 1000,
  RAID:       12 * 60 * 60 * 1000,
  DAILY:      24 * 60 * 60 * 1000,
  RECOLTE:    1  * 60 * 60 * 1000,
  MARCHE:     30 * 60 * 1000,
};

// ══════════════════════════════════════════════════════════════
//  TITRES (= rangs / grades)
// ══════════════════════════════════════════════════════════════
const TITRES = [
  { id: "PAYSAN",     nom: "Paysan",           min: 0,            emoji: "🌾", bonus: 0,    desc: "Aucune compétence particulière." },
  { id: "ECUYER",     nom: "Écuyer",            min: 50_000,       emoji: "🛡️", bonus: 0.05, desc: "Apprenti aventurier." },
  { id: "AVENTURIER", nom: "Aventurier",        min: 250_000,      emoji: "⚔️", bonus: 0.10, desc: "Aguerri aux embûches." },
  { id: "CHEVALIER",  nom: "Chevalier",         min: 1_000_000,    emoji: "🏇", bonus: 0.15, desc: "Reconnu par la couronne." },
  { id: "CHAMPION",   nom: "Champion du Peuple",min: 5_000_000,    emoji: "🦁", bonus: 0.20, desc: "Légende vivante." },
  { id: "SEIGNEUR",   nom: "Seigneur de Guerre",min: 20_000_000,   emoji: "👑", bonus: 0.25, desc: "Maître d'un fief entier." },
  { id: "ARCHIMAGE",  nom: "Archimage",         min: 100_000_000,  emoji: "🔮", bonus: 0.35, desc: "Maîtrise des arts occultes." },
  { id: "DIEUDEGUERRE",nom:"Dieu de Guerre",    min: 500_000_000,  emoji: "⚡", bonus: 0.50, desc: "Immortel et invincible." },
];

// ══════════════════════════════════════════════════════════════
//  FIEFS (= territoires / secteurs)
// ══════════════════════════════════════════════════════════════
const FIEFS = {
  HAMEAU:   { id: "HAMEAU",   nom: "Hameau des Brumes",    cout: 0,           revenu: 5_000,     risque: 1, protection: 0, emoji: "🏚️" },
  VILLAGE:  { id: "VILLAGE",  nom: "Village du Carrefour", cout: 80_000,      revenu: 20_000,    risque: 2, protection: 0, emoji: "🏘️" },
  FORTERESSE:{ id:"FORTERESSE",nom:"Forteresse Nordique",  cout: 500_000,     revenu: 70_000,    risque: 3, protection: 1, emoji: "🏰" },
  TEMPLE:   { id: "TEMPLE",   nom: "Temple Maudit",        cout: 2_000_000,   revenu: 220_000,   risque: 4, protection: 2, emoji: "⛪" },
  CAVERNES: { id: "CAVERNES", nom: "Cavernes du Dragon",   cout: 8_000_000,   revenu: 650_000,   risque: 3, protection: 3, emoji: "🐉" },
  CITADELLE:{ id: "CITADELLE",nom: "Citadelle du Néant",   cout: 30_000_000,  revenu: 2_500_000, risque: 5, protection: 5, emoji: "🌑" },
};

// ══════════════════════════════════════════════════════════════
//  MARCHANDISES (= ressources / produits)
// ══════════════════════════════════════════════════════════════
const MARCHANDISES = {
  HERBES:    { id: "HERBES",   nom: "Herbes Médicinales",  prixAchat: 500,    prixVente: 1_400,   risque: 1, emoji: "🌿" },
  MINERAI:   { id: "MINERAI",  nom: "Minerai de Fer",      prixAchat: 3_000,  prixVente: 8_500,   risque: 2, emoji: "⛏️" },
  PARCHEMIN: { id: "PARCHEMIN",nom: "Parchemins Anciens",  prixAchat: 2_000,  prixVente: 6_000,   risque: 2, emoji: "📜" },
  POTION:    { id: "POTION",   nom: "Potions Magiques",    prixAchat: 5_000,  prixVente: 14_000,  risque: 3, emoji: "🧪" },
  RUNE:      { id: "RUNE",     nom: "Runes de Pouvoir",    prixAchat: 12_000, prixVente: 36_000,  risque: 3, emoji: "🔯" },
  DRAGONITE: { id: "DRAGONITE",nom: "Écaille de Dragon",   prixAchat: 40_000, prixVente: 120_000, risque: 5, emoji: "🐉" },
};

// ══════════════════════════════════════════════════════════════
//  BÂTIMENTS (= structures / installations)
// ══════════════════════════════════════════════════════════════
const BATIMENTS = {
  AUBERGE:   { id: "AUBERGE",  nom: "Auberge du Voyageur", cout: 10_000,    capacite: 50,  revenuBonus: 0,    emoji: "🍺" },
  FORGE:     { id: "FORGE",    nom: "Forge Runique",        cout: 75_000,    capacite: 0,   revenuBonus: 0.15, emoji: "🔨" },
  ENTREPOT:  { id: "ENTREPOT", nom: "Entrepôt Secret",      cout: 200_000,   capacite: 500, revenuBonus: 0,    emoji: "📦" },
  TAVERNE:   { id: "TAVERNE",  nom: "Taverne des Ombres",   cout: 500_000,   capacite: 0,   revenuBonus: 0.25, emoji: "🍷" },
  GUILDHALL: { id: "GUILDHALL",nom: "Guildhall Mystique",   cout: 2_000_000, capacite: 0,   revenuBonus: 0.40, emoji: "🏛️" },
  TOUR_MAGE: { id: "TOUR_MAGE",nom: "Tour du Grand Mage",   cout: 15_000_000,capacite: 0,   revenuBonus: 0.60, emoji: "🗼" },
};

// ══════════════════════════════════════════════════════════════
//  COMPAGNONS (= alliés / agents)
// ══════════════════════════════════════════════════════════════
const COMPAGNONS = {
  VOLEUR:    { id: "VOLEUR",   nom: "Lirien la Sournoise",  cout: 50_000,    effet: "Réduit risque arrestation -30%",      emoji: "🗡️" },
  GARDE:     { id: "GARDE",    nom: "Ser Brock",             cout: 150_000,   effet: "Cooldown pillage -1h",                emoji: "🛡️" },
  DIPLOMATE: { id: "DIPLOMATE",nom: "Lord Evander",          cout: 500_000,   effet: "Risque fief -2",                      emoji: "🤝" },
  SORCIER:   { id: "SORCIER",  nom: "Zar le Cryptique",      cout: 250_000,   effet: "+30% revenus marché des ombres",      emoji: "🧙" },
  ASSASSIN:  { id: "ASSASSIN", nom: "Ombre-de-Sang",         cout: 1_000_000, effet: "+50% succès attaque de fief",         emoji: "🩸" },
  ORACLE:    { id: "ORACLE",   nom: "La Voyante Aveugle",    cout: 3_000_000, effet: "Immunité totale aux raids 48h",        emoji: "🔮" },
};

// ══════════════════════════════════════════════════════════════
//  QUÊTES (= missions / expéditions)
// ══════════════════════════════════════════════════════════════
const QUETES = [
  { id: "Q01", nom: "Collecte d'herbes sauvages", difficulte: 1, duree: 30,  gain: [2_000,    8_000],    cout: 0,         risque: 10, xp: 5 },
  { id: "Q02", nom: "Pillage de caravane",        difficulte: 2, duree: 60,  gain: [10_000,   40_000],   cout: 2_000,     risque: 20, xp: 15 },
  { id: "Q03", nom: "Assassinat ciblé",           difficulte: 3, duree: 90,  gain: [50_000,   180_000],  cout: 15_000,    risque: 30, xp: 30 },
  { id: "Q04", nom: "Vol du trésor royal",        difficulte: 4, duree: 120, gain: [200_000,  700_000],  cout: 50_000,    risque: 45, xp: 60 },
  { id: "Q05", nom: "Saccage du palais",          difficulte: 5, duree: 180, gain: [800_000,  3_000_000],cout: 200_000,   risque: 60, xp: 120 },
  { id: "Q06", nom: "Renversement du trône",      difficulte: 6, duree: 240, gain: [3_000_000,12_000_000],cout:1_000_000, risque: 75, xp: 300 },
];

// ══════════════════════════════════════════════════════════════
//  PURIFICATION (= blanchiment / recyclage)
//  Convertit l'or maudit en or légitime
// ══════════════════════════════════════════════════════════════
const PURIFICATION = {
  EGLISE:   { id: "EGLISE",  nom: "Offrande à l'Église",   ratio: 0.70, frais: 0.30, delai: "4h", emoji: "⛪" },
  ALCHIMIE: { id: "ALCHIMIE",nom: "Transmutation Alchimique",ratio:0.85, frais: 0.15, delai: "4h", emoji: "⚗️" },
  MARCHE:   { id: "MARCHE",  nom: "Négoce de Foire",        ratio: 0.80, frais: 0.20, delai: "4h", emoji: "🏪" },
  RUNE_MIX: { id: "RUNE_MIX",nom: "Rituel des Runes",       ratio: 0.90, frais: 0.10, delai: "4h", emoji: "🔯" },
  DON_SERF: { id: "DON_SERF",nom: "Don aux Serfs",           ratio: 0.60, frais: 0.40, delai: "4h", emoji: "🌾" },
};

// ══════════════════════════════════════════════════════════════
//  UTILITAIRES
// ══════════════════════════════════════════════════════════════
function initUnderworld() {
  return {
    orMaudit:      0,
    orLegit:       0,
    totalPille:    0,
    totalPurifie:  0,
    titre:         "PAYSAN",
    xp:            0,
    niveau:        1,
    honneur:       0,
    fiefs:         ["HAMEAU"],
    batiments:     [],
    inventaire:    {},
    capaciteMax:   50,
    compagnons:    [],
    queteEnCours:      null,
    lastQuete:         null,
    quetesCompletes:   0,
    lastRaid:          null,
    raidsGagnes:       0,
    raidsPerdus:       0,
    lastPurification:  null,
    purificationEnCours: null,
    lastRecolte:       null,
    lastPillage:       null,
    lastDaily:         null,
    transactions:      [],
    achievements:      [],
    evenementActif:    null,
    evenementExpire:   null,
    poursuivi:         false,
    nbArretes:         0,
    coffre:            0,
    dette:             0,
    detteDate:         null,
    scoreCredit:       500,
    guileNiveau:       1,
    multiplicateur:    1.0,
    premium:           false,
    serie:             0,
    lastCoffre:        null,
    lastInteret:       Date.now(),
  };
}

function OR(n)  { return `${Math.floor(n).toLocaleString("fr-FR")} 🪙`; }
function tl(ts, cd) {
  const diff = cd - (Date.now() - (ts || 0));
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function getTitre(uw) {
  let t = TITRES[0];
  for (const titre of TITRES) {
    if (uw.totalPille >= titre.min) t = titre;
    else break;
  }
  return t;
}

function getRevenuTotal(uw) {
  let total = 0;
  for (const fId of uw.fiefs) {
    const f = FIEFS[fId];
    if (f) total += f.revenu;
  }
  for (const b of uw.batiments) {
    const bat = BATIMENTS[b.type];
    if (bat && bat.revenuBonus > 0) total += total * bat.revenuBonus;
  }
  const titre = getTitre(uw);
  total += total * titre.bonus;
  if (uw.compagnons.includes("SORCIER")) total += total * 0.30;
  return Math.floor(total);
}

function getCapaciteMax(uw) {
  let cap = 50;
  for (const b of uw.batiments) {
    const bat = BATIMENTS[b.type];
    if (bat && bat.capacite > 0) cap += bat.capacite;
  }
  return cap;
}

function getQteInventaire(uw) {
  return Object.values(uw.inventaire).reduce((a, b) => a + b, 0);
}

function getValeurPortefeuille(uw) {
  let total = 0;
  for (const fId of uw.fiefs) {
    const f = FIEFS[fId]; if (f) total += f.cout;
  }
  for (const b of uw.batiments) {
    const bat = BATIMENTS[b.type]; if (bat) total += bat.cout;
  }
  for (const [mId, qte] of Object.entries(uw.inventaire)) {
    const m = MARCHANDISES[mId]; if (m) total += m.prixAchat * qte;
  }
  return total;
}

function verifierSucces(uw) {
  const liste = [];
  const add = (id, cond) => { if (!uw.achievements.includes(id) && cond) liste.push(id); };
  add("PREMIER_BUTIN",   uw.quetesCompletes >= 1);
  add("TROIS_FIEFS",     uw.fiefs.length >= 3);
  add("MILLIONNAIRE",    uw.totalPille >= 1_000_000);
  add("MILLIARDAIRE",    uw.totalPille >= 1_000_000_000);
  add("SEIGNEUR_TITRE",  uw.titre === "SEIGNEUR");
  add("DIEU_TITRE",      uw.titre === "DIEUDEGUERRE");
  add("GRAND_PURIFIE",   uw.totalPurifie >= 10_000_000);
  add("CONQUERANT",      uw.raidsGagnes >= 5);
  add("ALLIANCE_MAX",    uw.compagnons.length >= 4);
  add("PREMIER_OR",      uw.totalPille >= 10_000);
  add("NOBLE",           uw.orLegit >= 1_000_000);
  add("GUERRIER_SANG",   uw.raidsGagnes >= 10);
  add("INVINCIBLE",      uw.raidsGagnes >= 20);
  add("LEGENDE_VIVANTE", uw.totalPille >= 1_000_000_000);
  for (const a of liste) uw.achievements.push(a);
  return liste;
}

function addTransaction(uw, type, montant, desc) {
  uw.transactions.push({ type, montant, description: desc, date: Date.now() });
  if (uw.transactions.length > 30) uw.transactions = uw.transactions.slice(-30);
}

function emojiTx(type) {
  const m = {
    depot: "💰", retrait: "💸", coffre_depot: "🔐", coffre_retrait: "🔓",
    dette: "🏦", remboursement: "💳", interet_gain: "📈", interet_charge: "📉",
    daily: "🎁", recolte: "⚔️", achat_fief: "🗺️", construction: "🏗️",
    achat_marche: "🛒", vente_marche: "💸", recrutement: "🤝", purification: "✨",
    quete_succes: "✅", quete_echec: "❌", raid_victoire: "⚔️", raid_defaite: "💀",
  };
  return m[type] || "💼";
}

// ══════════════════════════════════════════════════════════════
//  MODULE PRINCIPAL
// ══════════════════════════════════════════════════════════════
module.exports = {
  config: {
    name: "underworld",
    aliases: ["guilde", "medieval", "donjon"],
    version: "1.0",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: {
      fr: "⚔️ Underworld — Construis ton empire médiéval, pille des fiefs, accomplis des quêtes et deviens le Dieu de Guerre!"
    },
    category: "economy",
    guide: {
      fr: "Tapez 'underworld help' pour voir toutes les commandes."
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID } = event;
    const sub = (args[0] || "tableau").toLowerCase();

    let user = await usersData.get(senderID);
    if (!user) user = { money: 0, exp: 0, data: {} };
    if (!user.data) user.data = {};
    if (!user.data.underworld) user.data.underworld = initUnderworld();

    const uw = user.data.underworld;
    const bourse = user.money || 0;

    const titre = getTitre(uw);
    uw.titre = titre.id;

    const save = async () => {
      user.data.underworld = uw;
      await usersData.set(senderID, user);
    };

    switch (sub) {
      case "help":
      case "aide":
        return message.reply(this.afficherAide());

      case "tableau":
      case "stat":
      case "balance":
      case "bal":
        return message.reply(this.afficherTableau(uw, bourse));

      case "depot":
      case "deposit":
      case "dep":
        return this.depot(message, args, uw, user, save, bourse);

      case "retrait":
      case "withdraw":
      case "wd":
        return this.retrait(message, args, uw, user, save);

      case "coffre":
      case "vault":
        return this.coffre(message, args, uw, save);

      case "dette":
      case "loan":
        return this.dette(message, args, uw, save);

      case "rembourser":
      case "repay":
        return this.rembourser(message, args, uw, save);

      case "interet":
      case "interest":
        return this.voirInteret(message, uw);

      case "percevoir":
      case "collect":
        return this.percevoirInteret(message, uw, save);

      case "historique":
      case "history":
        return this.historique(message, uw);

      case "daily":
        return this.daily(message, uw, save);

      case "recolte":
      case "mine":
        return this.recolte(message, uw, save);

      case "fief":
      case "territoire":
        return this.fief(message, args, uw, user, save);

      case "batir":
      case "build":
        return this.batir(message, args, uw, user, save);

      case "marche":
      case "market":
        return this.marche(message);

      case "acheter":
      case "buy":
        return this.acheter(message, args, uw, user, save);

      case "vendre":
      case "sell":
        return this.vendre(message, args, uw, save);

      case "inventaire":
      case "inventory":
      case "inv":
        return this.inventaire(message, uw);

      case "quete":
      case "quest":
        return this.quete(message, args, uw, save);

      case "compagnon":
      case "ally":
        return this.compagnon(message, args, uw, user, save);

      case "purifier":
      case "launder":
        return this.purifier(message, args, uw, save);

      case "raid":
      case "war":
        return this.raid(message, args, uw, user, save);

      case "titre":
      case "rank":
        return this.voirTitre(message, uw);

      case "succes":
      case "achievements":
        return this.succes(message, uw);

      case "classement":
      case "leaderboard":
        return this.classement(message, usersData);

      case "credit":
        return this.creditScore(message, uw);

      case "premium":
        return this.premium(message, args, uw, save);

      default:
        return message.reply(fonts.bold(`❓ Commande inconnue. Tapez 'underworld help' pour la liste complète.`));
    }
  },

  // ══════════════════════════════════════════════════════════════
  //  AIDE
  // ══════════════════════════════════════════════════════════════
  afficherAide: function () {
    return `
${fonts.bold("⚔️ UNDERWORLD — GUILDE DES OMBRES")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fonts.bold("🏆 Le Royaume t'attend, aventurier.")}

${fonts.bold("💰 FINANCES & TRÉSOR")} ${fonts.bold("━━━━━━━━━━━━━")}
⚔️ underworld tableau        — Bilan complet de ton royaume
💰 underworld depot <m>      — Déposer de l'or légitime
💸 underworld retrait <m>    — Retirer de l'or légitime
🔐 underworld coffre [dep/wd] <m> — Coffre-fort sécurisé
🏦 underworld dette <m>      — Emprunter de l'or
💳 underworld rembourser <m> — Rembourser la dette
📈 underworld interet        — Calculer tes intérêts
💵 underworld percevoir      — Récupérer les intérêts
📋 underworld historique     — Registre de transactions
🎁 underworld daily          — Récompense quotidienne

${fonts.bold("🗺️ FIEFS & BÂTIMENTS")} ${fonts.bold("━━━━━━━━━━━━━")}
🏘️ underworld fief list           — Fiefs disponibles
💰 underworld fief buy <ID>       — Conquérir un fief
ℹ️  underworld fief info <ID>      — Détails d'un fief
🏗️ underworld batir list          — Bâtiments disponibles
🔨 underworld batir <TYPE> <FIEF> — Construire

${fonts.bold("🛒 MARCHÉ DES OMBRES")} ${fonts.bold("━━━━━━━━━━━━━")}
📊 underworld marche         — Voir les prix du marché
🛍️ underworld acheter <ID> <q> — Acheter des marchandises
💸 underworld vendre <ID> <q>  — Vendre ton stock
📦 underworld inventaire      — Ton inventaire

${fonts.bold("🎯 QUÊTES")} ${fonts.bold("━━━━━━━━━━━━━")}
📋 underworld quete list        — Quêtes disponibles
🚀 underworld quete start <N°>  — Partir en quête
✅ underworld quete check       — Vérifier avancement
❌ underworld quete cancel      — Abandonner (50% remboursé)

${fonts.bold("⛏️ RÉCOLTE")} ${fonts.bold("━━━━━━━━━━━━━")}
⛏️  underworld recolte          — Percevoir revenus des fiefs (1h)

${fonts.bold("🤝 COMPAGNONS")} ${fonts.bold("━━━━━━━━━━━━━")}
👥 underworld compagnon list    — Compagnons disponibles
🤝 underworld compagnon buy <ID>— Recruter un compagnon

${fonts.bold("⚔️ RAIDS")} ${fonts.bold("━━━━━━━━━━━━━")}
📊 underworld raid stats        — Bilan des raids
⚔️  underworld raid attack <ID>  — Attaquer un fief

${fonts.bold("✨ PURIFICATION")} ${fonts.bold("━━━━━━━━━━━━━")}
📋 underworld purifier list          — Méthodes disponibles
✨  underworld purifier <MET> <mont> — Purifier l'or maudit

${fonts.bold("🏆 PROGRESSION")} ${fonts.bold("━━━━━━━━━━━━━")}
📊 underworld titre          — Ton titre et progression
🏆 underworld succes         — Succès débloqués
👑 underworld classement     — Top joueurs
📊 underworld credit         — Score de crédit
💎 underworld premium        — Avantages premium

${fonts.bold("⚠️ RÈGLES DU ROYAUME")} ${fonts.bold("━━━━━━━━━━━━━")}
• L'or MAUDIT peut être saisi lors des raids royaux
• Sans purification, l'or maudit est inutilisable
• Les compagnons améliorent tes capacités
• L'honneur débloque les quêtes dangereuses
• Le coffre rapporte 2%/mois et protège du vol
`.trim();
  },

  // ══════════════════════════════════════════════════════════════
  //  TABLEAU DE BORD
  // ══════════════════════════════════════════════════════════════
  afficherTableau: function (uw, bourse) {
    const titre = getTitre(uw);
    const revenu = getRevenuTotal(uw);
    const totalLiquid = bourse + uw.orLegit;
    const totalNet = totalLiquid + uw.orMaudit + uw.coffre;
    const portfolio = getValeurPortefeuille(uw);
    const totalFortune = totalNet + portfolio;
    const invQte = getQteInventaire(uw);
    const capMax = getCapaciteMax(uw);

    let rang = "🔰 Inconnu des Royaumes";
    if      (totalFortune >= 1_000_000_000) rang = "⚡ Dieu de Guerre Suprême";
    else if (totalFortune >= 100_000_000)   rang = "🔮 Archimage Redouté";
    else if (totalFortune >= 10_000_000)    rang = "👑 Seigneur de Guerre";
