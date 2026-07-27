const axios = require("axios");
const fs = require("fs");
const path = require("path");

// ================= MEMORY =================
const DB_FILE = path.join(__dirname, "yur_memory.json");

function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) return {};
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8") || "{}");
  } catch {
    return {};
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function getUser(id) {
  const db = loadDB();

  if (!db[id]) {
    db[id] = {
      facts: [],
      lastSeen: Date.now()
    };
  }

  return db[id];
}

function setUser(id, data) {
  const db = loadDB();
  db[id] = data;
  saveDB(db);
}

// ================= TIME =================
function getTimeInfo(text) {
  const now = new Date();

  if (text.includes("heure")) {
    return `il est ${now.toLocaleTimeString("fr-FR", { timeZone: "Africa/Kinshasa" })}`;
  }

  if (text.includes("date")) {
    return `on est le ${now.toLocaleDateString("fr-FR", { timeZone: "Africa/Kinshasa" })}`;
  }

  return null;
}

// ================= MODULE =================
module.exports = {
  config: {
    name: "yur",
    version: "2.0",
    author: "Celestin Olua",
    role: 0,
    category: "ai"
  },

  onStart: async function () {
    return;
  },

  onChat: async function ({ api, event, message }) {
    const body = event.body;
    if (!body) return;

    const lower = body.toLowerCase();

    // 🔒 activation uniquement si "yur"
    if (!lower.startsWith("yur")) return;

    const input = body.slice(3).trim();
    const uid = event.senderID;

    let user = getUser(uid);
    user.lastSeen = Date.now();

    user.facts.push(input);
    if (user.facts.length > 40) user.facts.shift();

    setUser(uid, user);

    // ⏰ heure / date direct sans IA
    const timeReply = getTimeInfo(lower);
    if (timeReply) {
      return message.reply(timeReply);
    }

    // 💤 message vide
    if (!input) {
      return message.reply("oui... ?");
    }

    try {
      const prompt = `
Tu es YUR créé par l'unique Célestin olua
Tu réponds naturellement tu dois expliqué t'es détails etc, humain, un peu calme.
Pas trop enthousiaste. T'y dois toujours terminé t'a phrase. 

Message: ${input}
`;

      const res = await axios.get(
        "https://christus-api.vercel.app/ai/MistralAI",
        { params: { prompt } }
      );

      let reply =
        res.data?.response ||
        res.data?.reply ||
        res.data?.message ||
        "..."

      // texte normal, pas de style
      reply = reply.slice(0, 300);

      return message.reply(reply);

    } catch {
      return message.reply("je
sais pas...");
    }
  }
};
