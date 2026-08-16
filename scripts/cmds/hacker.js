// hacker.js
"use strict";

const fonts = require('../../func/font.js');

const COOLDOWNS = {
    SCAN: 2 * 60 * 1000,
    ATTACK: 30 * 60 * 1000,
    DOWNLOAD: 10 * 60 * 1000,
    DAILY: 24 * 60 * 60 * 1000,
    UPGRADE: 6 * 60 * 60 * 1000,
    TRAIN: 4 * 60 * 60 * 1000,
};

const SERVERS = [
    { id: "PUBLIC", nom: "Serveur Public", emoji: "🌐", niveau: 1, defense: 10, dataWorth: 100, reward: 500, xp: 10 },
    { id: "CORPORATE", nom: "Serveur Corporate", emoji: "🏢", niveau: 2, defense: 25, dataWorth: 500, reward: 2000, xp: 30 },
    { id: "BANK", nom: "Serveur Bancaire", emoji: "🏦", niveau: 3, defense: 40, dataWorth: 2000, reward: 8000, xp: 60 },
    { id: "GOVERNMENT", nom: "Serveur Gouvernemental", emoji: "🏛️", niveau: 4, defense: 60, dataWorth: 5000, reward: 20000, xp: 120 },
    { id: "MILITARY", nom: "Serveur Militaire", emoji: "⚔️", niveau: 5, defense: 85, dataWorth: 10000, reward: 50000, xp: 250 },
    { id: "BLACK_MARKET", nom: "Marché Noir", emoji: "💀", niveau: 6, defense: 100, dataWorth: 25000, reward: 100000, xp: 500 },
    { id: "DARK_WEB", nom: "Dark Web Hub", emoji: "👾", niveau: 7, defense: 150, dataWorth: 50000, reward: 250000, xp: 1000 },
];

const SOFTWARE = {
    EXPLOIT: { id: "EXPLOIT", nom: "Exploit Kit", emoji: "🔧", prix: 5000, bonus: 10, desc: "+10% chance de succès" },
    FIREWALL: { id: "FIREWALL", nom: "Firewall Bypass", emoji: "🛡️", prix: 10000, bonus: 15, desc: "-15% défense ennemie" },
    CRYPTER: { id: "CRYPTER", nom: "Crypteur", emoji: "🔐", prix: 15000, bonus: 20, desc: "+20% de discrétion" },
    ROOTKIT: { id: "ROOTKIT", nom: "Rootkit", emoji: "🗝️", prix: 25000, bonus: 25, desc: "Accès root permanent" },
    AI_HACK: { id: "AI_HACK", nom: "IA de Hacking", emoji: "🤖", prix: 50000, bonus: 35, desc: "+35% efficacité" },
    ZERO_DAY: { id: "ZERO_DAY", nom: "Zero-Day Exploit", emoji: "💥", prix: 100000, bonus: 50, desc: "Contourne toutes les défenses" },
};

const SKILLS = {
    CODING: { id: "CODING", nom: "Programmation", emoji: "💻", max: 50 },
    NETWORK: { id: "NETWORK", nom: "Réseaux", emoji: "🌐", max: 50 },
    CRYPTOGRAPHY: { id: "CRYPTOGRAPHY", nom: "Cryptographie", emoji: "🔑", max: 50 },
    SOCIAL: { id: "SOCIAL", nom: "Ingénierie Sociale", emoji: "🎭", max: 50 },
    FORENSICS: { id: "FORENSICS", nom: "Anti-Forensique", emoji: "🧹", max: 50 },
};

const RANKS = [
    { id: "SCRIPT_KIDDIE", nom: "Script Kiddie", emoji: "👶", minData: 0, bonus: 0 },
    { id: "HACKER", nom: "Hacker", emoji: "💻", minData: 10000, bonus: 0.1 },
    { id: "CRACKER", nom: "Cracker", emoji: "🔓", minData: 50000, bonus: 0.2 },
    { id: "PHREAKER", nom: "Phreaker", emoji: "📡", minData: 200000, bonus: 0.35 },
    { id: "CYBER_GOD", nom: "Cyber God", emoji: "👾", minData: 1000000, bonus: 0.5 },
];

function initHacker() {
    return {
        bitcoin: 0,
        totalEarned: 0,
        dataStolen: 0,
        rank: "SCRIPT_KIDDIE",
        level: 1,
        xp: 0,
        reputation: 0,
        serversHacked: [],
        software: [],
        skills: {
            CODING: 0,
            NETWORK: 0,
            CRYPTOGRAPHY: 0,
            SOCIAL: 0,
            FORENSICS: 0,
        },
        activeHack: null,
        lastScan: null,
        lastAttack: null,
        lastDownload: null,
        lastDaily: null,
        lastUpgrade: null,
        lastTrain: null,
        streak: 0,
        achievements: [],
        transactions: [],
        traceLevel: 0,
        encryptedBackup: 0,
        proxyLevel: 1,
        darkNetContacts: 0,
        premium: false,
        multiplier: 1.0,
    };
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function FM(n) { return `$${Math.floor(n).toLocaleString("fr-FR")}`; }
function BTC(n) { return `₿${(n).toFixed(4)}`; }
function pct(n) { return `${Math.round(n * 100)}%`; }
function L(char = "─", n = 44) { return char.repeat(n); }

function timeLeft(ts, cd) {
    const diff = cd - (Date.now() - (ts || 0));
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getRank(hacker) {
    let rank = RANKS[0];
    for (const r of RANKS) {
        if (hacker.dataStolen >= r.minData) rank = r;
        else break;
    }
    return rank;
}

function getHackChance(hacker, server) {
    const baseChance = 0.3;
    const skillBonus = (hacker.skills.CODING + hacker.skills.NETWORK + hacker.skills.CRYPTOGRAPHY) / 300;
    const softwareBonus = hacker.software.reduce((sum, s) => sum + (SOFTWARE[s]?.bonus || 0) / 100, 0);
    const levelBonus = hacker.level * 0.005;
    const proxyBonus = hacker.proxyLevel * 0.02;
    const traceMalus = Math.max(0, hacker.traceLevel * 0.01);
    const chance = Math.min(0.95, baseChance + skillBonus + softwareBonus + levelBonus + proxyBonus - traceMalus);
    return Math.max(0.05, chance);
}

function getHackReward(hacker, server) {
    const baseReward = server.reward;
    const rankBonus = getRank(hacker).bonus;
    const skillBonus = (hacker.skills.CODING + hacker.skills.NETWORK) / 50;
    const multiplier = hacker.multiplier || 1;
    return Math.floor(baseReward * (1 + rankBonus + skillBonus) * multiplier);
}

function getXPForHack(server) {
    return server.xp * (1 + Math.random() * 0.5);
}

function checkAchievements(hacker) {
    const list = [];
    if (!hacker.achievements.includes("FIRST_HACK") && hacker.serversHacked.length >= 1)
        list.push("FIRST_HACK");
    if (!hacker.achievements.includes("DATA_10K") && hacker.dataStolen >= 10000)
        list.push("DATA_10K");
    if (!hacker.achievements.includes("DATA_100K") && hacker.dataStolen >= 100000)
        list.push("DATA_100K");
    if (!hacker.achievements.includes("DATA_1M") && hacker.dataStolen >= 1000000)
        list.push("DATA_1M");
    if (!hacker.achievements.includes("HACKER_RANK") && hacker.rank === "HACKER")
        list.push("HACKER_RANK");
    if (!hacker.achievements.includes("CYBER_GOD_RANK") && hacker.rank === "CYBER_GOD")
        list.push("CYBER_GOD_RANK");
    if (!hacker.achievements.includes("SOFTWARE_5") && hacker.software.length >= 5)
        list.push("SOFTWARE_5");
    if (!hacker.achievements.includes("SKILL_25") && Object.values(hacker.skills).some(s => s >= 25))
        list.push("SKILL_25");
    if (!hacker.achievements.includes("SKILL_50") && Object.values(hacker.skills).some(s => s >= 50))
        list.push("SKILL_50");
    if (!hacker.achievements.includes("STREAK_7") && hacker.streak >= 7)
        list.push("STREAK_7");
    if (!hacker.achievements.includes("STREAK_30") && hacker.streak >= 30)
        list.push("STREAK_30");
    if (!hacker.achievements.includes("PREMIUM") && hacker.premium)
        list.push("PREMIUM");
    if (!hacker.achievements.includes("PROXY_10") && hacker.proxyLevel >= 10)
        list.push("PROXY_10");
    if (!hacker.achievements.includes("TRACE_ZERO") && hacker.traceLevel === 0 && hacker.dataStolen > 0)
        list.push("TRACE_ZERO");
    for (const a of list) hacker.achievements.push(a);
    return list;
}

function addTransaction(hacker, type, montant, description) {
    hacker.transactions.push({ type, montant, description, date: Date.now() });
    if (hacker.transactions.length > 30) hacker.transactions = hacker.transactions.slice(-30);
}

function getTransactionEmoji(type) {
    const emojis = {
        hack: "💻", sell_data: "💰", buy_software: "🛒", upgrade_proxy: "🔄",
        train: "📚", daily: "🎁", backup: "💾", trace_clean: "🧹",
        premium: "💎", achievement: "🏆",
    };
    return emojis[type] || "💼";
}

function renderDashboard(hacker, walletBalance) {
    const rank = getRank(hacker);
    const totalWealth = walletBalance + hacker.bitcoin * 50000 + hacker.encryptedBackup * 1000;

    let threatLevel = "🟢 Faible";
    let threatEmoji = "🟢";
    if (hacker.traceLevel >= 80) { threatLevel = "🔴 Critique"; threatEmoji = "🔴"; }
    else if (hacker.traceLevel >= 50) { threatLevel = "🟠 Élevé"; threatEmoji = "🟠"; }
    else if (hacker.traceLevel >= 20) { threatLevel = "🟡 Moyen"; threatEmoji = "🟡"; }

    return `
${fonts.bold("👾 HACKER SYSTEM")} ${rank.emoji}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fonts.bold("🧑‍💻 Niveau " + hacker.level)}${hacker.premium ? " • 💎 Premium" : ""}

${fonts.bold("💰 FINANCES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
💳 Portefeuille : ${fonts.bold(FM(walletBalance))}
₿ Bitcoin : ${fonts.bold(BTC(hacker.bitcoin))} (${FM(hacker.bitcoin * 50000)})
💾 Données volées : ${fonts.bold(FM(hacker.dataStolen))}
📊 Revenus totaux : ${fonts.bold(FM(hacker.totalEarned))}
💎 Patrimoine : ${fonts.bold(FM(totalWealth))}

${fonts.bold("🖥️ SYSTÈME")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🔐 Proxy : ${fonts.bold("Niveau " + hacker.proxyLevel)}
👾 Logiciels : ${fonts.bold(hacker.software.length + "/6")}
💾 Backup chiffré : ${fonts.bold(FM(hacker.encryptedBackup))}
📡 Contacts DarkNet : ${fonts.bold(hacker.darkNetContacts)}

${fonts.bold("⚠️ SÉCURITÉ")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
${threatEmoji} Traçage : ${fonts.bold(hacker.traceLevel + "/100")} (${threatLevel})
${rank.emoji} Rang : ${fonts.bold(rank.nom)}
⭐ XP : ${fonts.bold(hacker.xp.toLocaleString("fr-FR"))}
🏆 Succès : ${fonts.bold(hacker.achievements.length + "/50")}
🔥 Série : ${fonts.bold(hacker.streak + " jours")}

${fonts.bold("⏳ COOLDOWNS")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📡 Scan : ${timeLeft(hacker.lastScan, COOLDOWNS.SCAN) || "✅ Prêt"}
💥 Attack : ${hacker.activeHack ? "⏳ En cours" : timeLeft(hacker.lastAttack, COOLDOWNS.ATTACK) || "✅ Prêt"}
⬇️ Download : ${timeLeft(hacker.lastDownload, COOLDOWNS.DOWNLOAD) || "✅ Prêt"}
🎁 Daily : ${timeLeft(hacker.lastDaily, COOLDOWNS.DAILY) || "✅ Prêt"}
⬆️ Upgrade : ${timeLeft(hacker.lastUpgrade, COOLDOWNS.UPGRADE) || "✅ Prêt"}
📚 Train : ${timeLeft(hacker.lastTrain, COOLDOWNS.TRAIN) || "✅ Prêt"}
`.trim();
}

function renderHelp() {
    return `
${fonts.bold("👾 HACKER SYSTEM - GUIDE")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${fonts.bold("📊 TABLEAU DE BORD")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📊 hacker stat - Tableau de bord

${fonts.bold("💻 HACKING")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📡 hacker scan - Scanner les serveurs
💥 hacker hack <ID> - Attaquer un serveur
⬇️ hacker download - Récupérer les données
🔄 hacker cancel - Annuler la mission
📋 hacker servers - Voir les serveurs hackés

${fonts.bold("🛒 MARCHÉ NOIR")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📦 hacker market - Voir les logiciels disponibles
🛒 hacker buy <ID> - Acheter un logiciel
💰 hacker sell_data - Vendre des données volées

${fonts.bold("🛡️ SÉCURITÉ")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🔐 hacker proxy <niveau> - Améliorer le proxy
🧹 hacker trace - Nettoyer les traces
💾 hacker backup - Sauvegarder les données

${fonts.bold("📚 COMPÉTENCES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📊 hacker skill list - Voir les compétences
📚 hacker train <SKILL> - S'entraîner

${fonts.bold("🎯 PROGRESSION")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🏆 hacker rank - Votre rang
🏆 hacker achievements - Succès débloqués
👑 hacker leaderboard - Classement des hackers

${fonts.bold("🎁 RÉCOMPENSES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🎁 hacker daily - Récompense quotidienne
💎 hacker premium buy - Devenir premium (2x gains)
`.trim();
}

async function cmdDeposit(message, args, hacker, user, save, walletBalance) {
    const amount = parseInt(args[1]);
    if (!amount || amount <= 0) {
        return message.reply(fonts.bold(`
💰 DÉPÔT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage: hacker deposit <montant>
Portefeuille: ${FM(walletBalance)}
Bitcoin: ${BTC(hacker.bitcoin)}
		`));
    }
    if (walletBalance < amount) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Portefeuille: ${FM(walletBalance)}`));
    }
    user.money = walletBalance - amount;
    hacker.bitcoin += amount / 50000;
    addTransaction(hacker, "deposit", amount, "Achat de Bitcoin");
    await save();
    return message.reply(fonts.bold(`
💰 DÉPÔT RÉUSSI!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Montant: ${FM(amount)}
Bitcoin: ${BTC(hacker.bitcoin)}
Portefeuille restant: ${FM(user.money)}
		`));
}

async function cmdWithdraw(message, args, hacker, user, save) {
    const amount = parseInt(args[1]);
    if (!amount || amount <= 0) {
        return message.reply(fonts.bold(`
💸 RETRAIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage: hacker withdraw <montant>
Bitcoin: ${BTC(hacker.bitcoin)} (${FM(hacker.bitcoin * 50000)})
		`));
    }
    const btcNeeded = amount / 50000;
    if (hacker.bitcoin < btcNeeded) {
        return message.reply(fonts.bold(`❌ Bitcoin insuffisant. Vous avez ${BTC(hacker.bitcoin)} (${FM(hacker.bitcoin * 50000)})`));
    }
    hacker.bitcoin -= btcNeeded;
    user.money = (user.money || 0) + amount;
    addTransaction(hacker, "withdrawal", -amount, "Vente de Bitcoin");
    await save();
    return message.reply(fonts.bold(`
💸 RETRAIT RÉUSSI!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Montant: ${FM(amount)}
Bitcoin restant: ${BTC(hacker.bitcoin)}
Nouveau portefeuille: ${FM(user.money)}
		`));
}

async function cmdDaily(message, hacker, save) {
    const cd = timeLeft(hacker.lastDaily, COOLDOWNS.DAILY);
    if (cd) return message.reply(fonts.bold(`⏰ Daily déjà réclamé! Prochain dans ${cd}.`));

    if (Date.now() - (hacker.lastDaily || 0) < COOLDOWNS.DAILY * 2) {
        hacker.streak++;
    } else {
        hacker.streak = 1;
    }

    const baseReward = 2000;
    const streakBonus = Math.min(hacker.streak * 300, 3000);
    const levelBonus = hacker.level * 500;
    const premiumMultiplier = hacker.premium ? 2 : 1;
    const totalReward = Math.floor((baseReward + streakBonus + levelBonus) * premiumMultiplier);

    hacker.bitcoin += totalReward / 50000;
    hacker.totalEarned += totalReward;
    hacker.lastDaily = Date.now();
    addTransaction(hacker, "daily", totalReward, `Récompense quotidienne (série ${hacker.streak} jours)`);
    const newAchievements = checkAchievements(hacker);
    await save();

    return message.reply(fonts.bold(`
🎁 RÉCOMPENSE QUOTIDIENNE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Récompense: ${FM(totalReward)}
₿ Bitcoin: ${BTC(totalReward / 50000)}
🔥 Série: ${hacker.streak} jours
📈 Niveau: ${hacker.level}
⭐ Premium: ${hacker.premium ? "2x Bonus!" : "Non"}
${newAchievements.length > 0 ? `🏆 Succès: ${newAchievements.join(", ")}` : ""}
		`));
}

async function cmdScan(message, hacker, save) {
    const cd = timeLeft(hacker.lastScan, COOLDOWNS.SCAN);
    if (cd) return message.reply(fonts.bold(`⏰ Scan disponible dans ${cd}.`));

    hacker.lastScan = Date.now();
    await save();

    const availableServers = SERVERS.filter(s => !hacker.serversHacked.includes(s.id));
    if (availableServers.length === 0) {
        return message.reply(fonts.bold("🌐 Tous les serveurs ont été hackés! De nouveaux serveurs apparaîtront bientôt."));
    }

    let txt = `${fonts.bold("📡 SCAN TERMINÉ")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    txt += `${fonts.bold("🔍 SERVEURS DÉTECTÉS:")}\n\n`;

    for (const server of availableServers) {
        const chance = Math.min(0.95, 0.3 + hacker.level * 0.02 + hacker.skills.NETWORK / 100);
        const detected = Math.random() < chance;
        if (detected) {
            txt += `${server.emoji} ${server.nom} [${server.id}]\n`;
            txt += `   🛡️ Défense: ${server.defense}\n`;
            txt += `   💾 Données: ${FM(server.dataWorth)}\n`;
            txt += `   💰 Récompense: ${FM(server.reward)}\n`;
            txt += `   ⭐ XP: ${server.xp}\n\n`;
        } else {
            txt += `❓ Serveur inconnu (niveau ${server.niveau})\n\n`;
        }
    }

    txt += `Attaquer: hacker hack <ID>`;
    return message.reply(txt);
}

async function cmdHack(message, args, hacker, save) {
    const cd = timeLeft(hacker.lastAttack, COOLDOWNS.ATTACK);
    if (cd) return message.reply(fonts.bold(`⏰ Attaque disponible dans ${cd}.`));

    if (hacker.activeHack) {
        return message.reply(fonts.bold("⚠️ Une attaque est déjà en cours. Tapez 'hacker download' pour récupérer les données."));
    }

    const serverId = args[1]?.toUpperCase();
    const server = SERVERS.find(s => s.id === serverId);
    if (!server) {
        return message.reply(fonts.bold(`❌ Serveur inconnu. Utilisez 'hacker scan' pour voir les serveurs disponibles.`));
    }
    if (hacker.serversHacked.includes(server.id)) {
        return message.reply(fonts.bold(`❌ Vous avez déjà hacké ce serveur.`));
    }

    const chance = getHackChance(hacker, server);
    const success = Math.random() < chance;

    if (success) {
        hacker.activeHack = {
            serverId: server.id,
            startTime: Date.now(),
            endTime: Date.now() + COOLDOWNS.DOWNLOAD,
            reward: getHackReward(hacker, server),
            xp: getXPForHack(server),
        };
        hacker.lastAttack = Date.now();
        addTransaction(hacker, "hack", 0, `Hacking ${server.nom}...`);
        await save();

        return message.reply(fonts.bold(`
💥 ATTAQUE RÉUSSIE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${server.emoji} ${server.nom}
🛡️ Défense contournée: ${server.defense}
📊 Taux de succès: ${pct(chance)}
⏳ Téléchargement des données: ${COOLDOWNS.DOWNLOAD / 60000} min
💰 Récompense estimée: ${FM(hacker.activeHack.reward)}
⭐ XP estimé: ${Math.floor(hacker.activeHack.xp)}

Tapez 'hacker download' pour récupérer les données.
		`));
    } else {
        const traceIncrease = Math.floor(server.defense * 0.1);
        hacker.traceLevel = Math.min(100, hacker.traceLevel + traceIncrease);
        hacker.lastAttack = Date.now();
        await save();

        return message.reply(fonts.bold(`
❌ ÉCHEC!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${server.emoji} ${server.nom}
🛡️ Défense trop élevée: ${server.defense}
📊 Taux de succès: ${pct(chance)}
⚠️ Traçage augmenté de ${traceIncrease}% (total: ${hacker.traceLevel}%)

💡 Améliorez vos compétences ou achetez des logiciels!
		`));
    }
}

async function cmdDownload(message, hacker, user, save) {
    if (!hacker.activeHack) {
        return message.reply(fonts.bold("❌ Aucune attaque en cours. Lancez 'hacker hack <ID>' d'abord."));
    }

    const now = Date.now();
    if (now < hacker.activeHack.endTime) {
        const remaining = Math.ceil((hacker.activeHack.endTime - now) / 60000);
        return message.reply(fonts.bold(`⏳ Téléchargement en cours... ${remaining} min restants.`));
    }

    const server = SERVERS.find(s => s.id === hacker.activeHack.serverId);
    if (!server) return message.reply(fonts.bold("❌ Erreur: serveur introuvable."));

    const reward = hacker.activeHack.reward;
    const xp = hacker.activeHack.xp;

    hacker.bitcoin += reward / 50000;
    hacker.totalEarned += reward;
    hacker.dataStolen += server.dataWorth;
    hacker.xp += Math.floor(xp);
    hacker.serversHacked.push(server.id);
    hacker.reputation = Math.min(1000, hacker.reputation + server.niveau * 5);
    hacker.traceLevel = Math.max(0, hacker.traceLevel - Math.floor(server.niveau * 2));

    addTransaction(hacker, "sell_data", reward, `Données vendues: ${server.nom}`);

    // Level up check
    const xpNeeded = hacker.level * 100;
    while (hacker.xp >= xpNeeded) {
        hacker.xp -= xpNeeded;
        hacker.level++;
        hacker.reputation = Math.min(1000, hacker.reputation + 10);
    }

    const newAchievements = checkAchievements(hacker);
    const oldRank = getRank(hacker);
    const newRank = getRank(hacker);

    hacker.activeHack = null;
    hacker.lastDownload = Date.now();

    await save();

    let msg = `⬇️ DONNÉES RÉCUPÉRÉES!\n
