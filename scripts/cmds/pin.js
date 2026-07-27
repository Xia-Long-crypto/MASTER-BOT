/**
 * @author Zetsu & Shade
 * @title Pinterest Smartphone Catalogue HD
 * @name pin
 * @class pinterest
 * @version 5.0.0 PREMIUM
 */

const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");

// 📱 Fonction pour dessiner un rectangle aux coins arrondis
function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// 🎨 Générateur de catalogue style Smartphone
async function createPhoneCatalogueCanvas(imagesUrls, query, page) {
    const width = 1000;
    const height = 1800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 1. Fond général avec dégradé stylé
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, "#0f172a");
    bgGradient.addColorStop(0.5, "#1e1b4b");
    bgGradient.addColorStop(1, "#311042");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Effet de halo de lumière en arrière-plan
    ctx.fillStyle = "rgba(230, 0, 35, 0.15)";
    ctx.beginPath();
    ctx.arc(width / 2, 300, 400, 0, Math.PI * 2);
    ctx.fill();

    // 2. Coque du smartphone
    const phoneX = 80;
    const phoneY = 60;
    const phoneW = 840;
    const phoneH = 1680;
    const phoneRadius = 50;

    // Ombre du téléphone
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 20;

    // Bordure extérieure du téléphone (châssis)
    ctx.fillStyle = "#1e293b";
    drawRoundedRect(ctx, phoneX, phoneY, phoneW, phoneH, phoneRadius);
    ctx.fill();

    // Réinitialisation de l'ombre
    ctx.shadowBlur = 0;

    // Contour d'écran / Cadre
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 4;
    drawRoundedRect(ctx, phoneX, phoneY, phoneW, phoneH, phoneRadius);
    ctx.stroke();

    // Ecran intérieur
    const screenMargin = 16;
    const screenX = phoneX + screenMargin;
    const screenY = phoneY + screenMargin;
    const screenW = phoneW - (screenMargin * 2);
    const screenH = phoneH - (screenMargin * 2);

    ctx.save();
    drawRoundedRect(ctx, screenX, screenY, screenW, screenH, phoneRadius - 10);
    ctx.clip();

    // Fond de l'écran
    ctx.fillStyle = "#090d16";
    ctx.fillRect(screenX, screenY, screenW, screenH);

    // 3. Dynamic Island / Encoche haut
    ctx.fillStyle = "#000000";
    drawRoundedRect(ctx, width / 2 - 90, screenY + 12, 180, 32, 16);
    ctx.fill();

    // Header de l'application
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(`📌 ${query.toUpperCase()}`, screenX + 30, screenY + 90);

    ctx.fillStyle = "#e60023";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(`PAGE ${page}`, screenX + screenW - 120, screenY + 90);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "18px sans-serif";
    ctx.fillText("Réponds avec un numéro (1-10) ou 'page [N]'", screenX + 30, screenY + 120);

    // 4. Grille des 10 images
    const startX = screenX + 25;
    const startY = screenY + 145;
    const itemW = 360;
    const itemH = 260;
    const gapX = 38;
    const gapY = 28;

    const loadedImages = await Promise.all(
        imagesUrls.map(url => loadImage(url).catch(() => null))
    );

    for (let i = 0; i < 10; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = startX + col * (itemW + gapX);
        const y = startY + row * (itemH + gapY);

        // Carte / Card container
        ctx.save();
        drawRoundedRect(ctx, x, y, itemW, itemH, 18);
        ctx.clip();

        if (loadedImages[i]) {
            const img = loadedImages[i];
            const scale = Math.max(itemW / img.width, itemH / img.height);
            const sw = itemW / scale;
            const sh = itemH / scale;
            const sx = (img.width - sw) / 2;
            const sy = (img.height - sh) / 2;

            ctx.drawImage(img, sx, sy, sw, sh, x, y, itemW, itemH);
        } else {
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(x, y, itemW, itemH);
            ctx.fillStyle = "#64748b";
            ctx.font = "18px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Indisponible", x + itemW / 2, y + itemH / 2);
            ctx.textAlign = "left";
        }
        ctx.restore();

        // Badge du Numéro
        const badgeX = x + 15;
        const badgeY = y + 15;
        ctx.fillStyle = "#e60023";
        ctx.beginPath();
        ctx.arc(badgeX + 18, badgeY + 18, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), badgeX + 18, badgeY + 18);

        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
    }

    // Barre du bas (Home Indicator)
    ctx.fillStyle = "#ffffff";
    drawRoundedRect(ctx, width / 2 - 70, screenY + screenH - 18, 140, 6, 3);
    ctx.fill();

    ctx.restore();

    const cachePath = path.join(os.tmpdir(), `pin_phone_${Date.now()}.png`);
    await fs.writeFile(cachePath, canvas.toBuffer("image/png"));
    return cachePath;
}

module.exports = {
    config: {
        name: "pin",
        aliases: ["pinterest"],
        version: "5.0.0",
        author: "Zetsu & Shade + FIX",
        role: 0,
        category: "image",
        guide: {
            fr: "{p}{n} <mot-clé>\nEx: {p}{n} naruto"
        }
    },

    // 🚀 START
    onStart: async function ({ api, event, message, args }) {
        const query = args.join(" ");
        if (!query) return message.reply({ body: "❌ Donne un mot-clé à rechercher.", mentions: [{ tag: event.senderID, id: event.senderID }] });

        const apiUrl = `https://zetbot-page.onrender.com/api/pinterest?query=${encodeURIComponent(query)}`;

        try {
            const wait = await message.reply("📱 Préparation de ton catalogue Pinterest...");

            const res = await axios.get(apiUrl, { timeout: 25000 });
            const pins = res.data?.data || res.data?.pins || res.data?.results || res.data || [];

            if (!Array.isArray(pins) || !pins.length) {
                api.unsendMessage(wait.messageID);
                return message.reply("❌ Aucun résultat trouvé.");
            }

            const pageUrls = pins.slice(0, 10).map(p => typeof p === 'string' ? p : (p.image || p.url || p));

            const imgPath = await createPhoneCatalogueCanvas(pageUrls, query, 1);

            api.unsendMessage(wait.messageID);

            // Envoi de la réponse directement au message de l'utilisateur
            api.sendMessage({
                body: `📲 **Catalogue Pinterest**\n🔎 Recherche: *${query}*\n\n👉 Réponds avec le numéro **1-10** pour recevoir l'image en HD, ou écrit **page 2** !`,
                attachment: fs.createReadStream(imgPath)
            }, event.threadID, (err, info) => {
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                if (err) return console.error(err);

                global.GoatBot.onReply.set(info.messageID, {
                    commandName: this.config.name,
                    author: event.senderID,
                    query,
                    allPins: pins,
                    currentPage: 1,
                    messageID: info.messageID
                });
            }, event.messageID); // 👈 Réponse directe au message activé

        } catch (e) {
            console.error(e);
            return message.reply("❌ L'API ne répond pas ou est en veille. Réessaie dans un instant.");
        }
    },

    // 💬 REPLY
    onReply: async function ({ api, event, message, Reply }) {

        const data = Reply 
            || message?.Reply 
            || (global.GoatBot?.onReply?.get 
                ? global.GoatBot.onReply.get(event.messageReply?.messageID) 
                : null);

        if (!data) return;

        const { author, query, allPins, currentPage } = data;

        // Restriction : Seul l'utilisateur ayant activé la commande peut répondre
        if (event.senderID != author) {
            return message.reply("⚠️ Seule la personne qui a lancé la recherche peut sélectionner une option.");
        }

        const input = (event.body || "").toLowerCase().trim();
        if (!input) return;

        // 📄 CHANGEMENT DE PAGE
        if (input.startsWith("page")) {
            const pageNum = parseInt(input.split(" ")[1]);
            const totalPages = Math.ceil(allPins.length / 10);

            if (!pageNum || pageNum < 1 || pageNum > totalPages) {
                return message.reply(`❌ Page invalide. Choisis entre 1 et ${totalPages}`);
            }

            const start = (pageNum - 1) * 10;
            const urls = allPins.slice(start, start + 10).map(p => typeof p === 'string' ? p : (p.image || p.url || p));

            const imgPath = await createPhoneCatalogueCanvas(urls, query, pageNum);

            api.sendMessage({
                body: `📲 **Page ${pageNum}/${totalPages}**\n🔎 Recherche: *${query}*`,
                attachment: fs.createReadStream(imgPath)
            }, event.threadID, (err, info) => {
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);

                global.GoatBot.onReply.set(info.messageID, {
                    ...data,
                    commandName: this.config.name,
                    currentPage: pageNum,
                    messageID: info.messageID
                });
            }, event.messageID); // 👈 Réponse directe sur le reply

            return;
        }

        // 🖼️ SELECTION D'IMAGE (1-10)
        const choice = parseInt(input);
        const start = (currentPage - 1) * 10;
        const pagePins = allPins.slice(start, start + 10);

        if (!choice || choice < 1 || choice > pagePins.length) {
            return message.reply(`❌ Merci d'entrer un chiffre entre 1 et ${pagePins.length}`);
        }

        const selected = pagePins[choice - 1];
        const url = typeof selected === 'string' ? selected : (selected.image || selected.url || selected);

        try {
            const imgPath = path.join(os.tmpdir(), `pin_hd_${Date.now()}.jpg`);

            const img = await axios.get(url, {
                responseType: "arraybuffer",
                headers: { "User-Agent": "Mozilla/5.0" },
                timeout: 20000
            });

            await fs.writeFile(imgPath, img.data);

            // Envoi de l'image sélectionnée en reply direct
            api.sendMessage({
                body: `✨ Voici ton image n°${choice} en HD !`,
                attachment: fs.createReadStream(imgPath)
            }, event.threadID, () => {
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            }, event.messageID); // 👈 Réponse directe sur la sélection

        } catch (e) {
            console.error(e);
            return message.reply("❌ Impossible de télécharger cette image HD.");
        }
    }
};
