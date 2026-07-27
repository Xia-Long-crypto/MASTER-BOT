const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;
const doNotDelete = "[ 🧩 | 𝐌𝐀𝐃𝐀𝐑𝐀 | 🧩 ]"; 

module.exports = {
    config: {
        name: "help",
        version: "1.21",
        author: "𝑹𝒊𝒏𝒏𝒈𝒂𝒏 (Corrigé par Gemini)",
        countDown: 5,
        role: 0,
        shortDescription: {
            en: "Affiche l'aide et la liste des commandes du bot.",
        },
        longDescription: {
            en: "Affiche une liste complète des commandes par catégorie et le détail d'utilisation d'une commande spécifique.",
        },
        category: "info",
        guide: {
            en: "{pn} : Liste de toutes les commandes.\n{pn} <nom_commande> : Affiche les détails d'une commande.",
        },
        priority: 1,
    },
    onStart: async function ({ message, args, event, threadsData, role }) {
        const { threadID } = event;
        const threadData = await threadsData.get(threadID);
        const prefix = getPrefix(threadID);
        
        // --- Fonction pour obtenir le texte du rôle ---
        const roleTextToString = (role) => {
            switch (role) {
                case 0: return "0 (Tous les utilisateurs)";
                case 1: return "1 (Administrateurs de groupe)";
                case 2: return "2 (Administrateur du bot)";
                default: return "Rôle inconnu";
            }
        };

        // --- Affichage de la liste des commandes (Aucun argument) ---
        if (args.length === 0) {
            const categories = {};
            let msg = "";
            
            msg += `\n⛩️ ╔═══════ - ════════╗\n⛩️ ⚜ 𝐌𝐀𝐃𝐀𝐑𝐀 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗘 ⚜\n⛩️ ╚═══════ - ════════╝\n`;

            for (const [name, value] of commands) {
                if (value.config.role > role) continue; 
                
                const category = value.config.category || "Uncategorized";
                categories[category] = categories[category] || { commands: [] };
                categories[category].commands.push(name);
            }
            
            Object.keys(categories).sort().forEach((category) => {
                if (categories[category].commands.length === 0) return;
                
                msg += `\n⛩️ ╔═.𖦹.═══ ${category.toUpperCase()} ═══════╗`;
                
                const names = categories[category].commands.sort();
                for (let i = 0; i < names.length; i += 3) {
                    const lineCommands = names.slice(i, i + 3).map((item) => `✰${item}☆`);
                    msg += `\n⛩️ │ ${lineCommands.join(" | ")}`;
                }
                msg += `\n⛩️ ╚═══════ - ═══.✵.═╝`;
            });
            
            const totalCommands = commands.size;
            msg += `\n\n⛩️ 𝒋𝒆 𝒅𝒊𝒔𝒑𝒐𝒔𝒆 𝒅𝒆 ${totalCommands} 𝒆𝒕𝒉𝒏𝒊𝒒𝒖𝒆`;
            msg += `\n\n⛩️ 𝑻𝑨𝑷𝑬 ${prefix} 𝗵𝗲𝗹𝗽4 + 𝒏𝒐𝒎 𝒅𝒆 𝒍𝒂 𝒄𝒐𝒎𝒎𝒂𝒏𝒅𝒆 𝒑𝒐𝒖𝒓 𝒆𝒏 𝒗𝒐𝒊𝒓 𝒍𝒆𝒔 𝒊𝒏𝒇𝒐𝒔`;
            msg += `\n\n⛩️ { %𝑢𝑐ℎ𝑖ℎ𝑎𝑔𝑐} 𝑝𝑜𝑢𝑟 𝑟𝑒𝑗𝑜𝑖𝑛𝑑𝑟𝑒 𝑚𝑜𝑛 𝑐𝑙𝑎𝑛`;
            msg += `\n\n⛩️ 📜| 𝐋𝐞 𝐩𝐥𝐮𝐬 𝐠𝐫𝐚𝐧𝐝 𝐝𝐚𝐧𝐠𝐞𝐫 𝐩𝐨𝐮𝐫 𝐮𝐧 𝐯𝐢𝐥𝐥𝐚𝐠𝐞, 𝐜𝐞 n’𝐞𝐬𝐭 𝐩𝐚𝐬 𝐥𝐚 𝐠𝐮𝐞𝐫𝐫𝐞, 𝐦𝐚𝐢𝐬 𝐩𝐥𝐮𝐭ô𝐭 𝐪𝐮𝐚𝐧𝐝 𝐜𝐞𝐮𝐱 𝐪𝐮𝐢 𝐥𝐞 𝐠𝐨𝐮𝐯𝐞𝐫𝐧𝐞𝐧𝐭 𝐩𝐞𝐫𝐝𝐞𝐧𝐭 𝐥𝐞𝐮𝐫 𝐟𝐨𝐢`;
            
            // --- ENVOI DU MESSAGE SANS IMAGE ---
            await message.reply(msg);

        // --- Affichage du détail d'une commande (Avec argument) ---
        } else {
            const commandName = args[0].toLowerCase();
            const command = commands.get(commandName) || commands.get(aliases.get(commandName));

            if (!command) {
                await message.reply(`⛩️ Commande "${commandName}" introuvable. Veuillez vérifier le nom.`);
            } else {
                const configCommand = command.config;
                const roleText = roleTextToString(configCommand.role);
                const author = configCommand.author || "Inconnu";
                const longDescription = configCommand.longDescription?.en || "Pas de description détaillée.";
                const guideBody = configCommand.guide?.en || "Pas de guide disponible.";
                
                const usage = guideBody.replace(/{p}/g, prefix).replace(/{n}/g, configCommand.name);
                
                const response = `
⛩️ ╭── COMMANDE ───⭓
⛩️ │ NOM : ${configCommand.name} 
⛩️ ├── INFO 
⛩️ │ Description: ${longDescription} 
⛩️ │ Alias : ${configCommand.aliases ? configCommand.aliases.join(", ") : "Aucun"} 
⛩️ │ Alias de groupe: %uchihagc 
⛩️ │ Version: ${configCommand.version || "1.0"} 
⛩️ │ Rôle requis: 
⛩️ │ ${roleText} 
⛩️ │ Temps d'attente: ${configCommand.countDown || 1}s 
⛩️ │ Auteur: 
⛩️ │ ${author} 
⛩️ ├── UTILISATION
⛩️ │ ${usage} 
⛩️ ├── NOTES 
⛩️ │ Le contenu entre [a|b|c] signifie 'a' ou 'b' ou 'c'.
⛩️ ╰━━━━━━━❖`;

                await message.reply(response);
            }
        }
   
    },
};
