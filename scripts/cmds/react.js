module.exports = {
    config: {
        name: "react",
        aliases: ["emoji-react"],
        version: "1.0",
        author: "Célestin",
        countDown: 0,
        role: 0,
        shortDescription: {
            fr: "✨ Réagit aux émojis avec des conseils et des messages spéciaux !"
        },
        longDescription: {
            fr: "Analyse les messages contenant certains émojis précis pour envoyer un conseil adapté ou un message dédié au créateur."
        },
        category: "fun",
        guide: {
            fr: "Envoyez simplement l'un de ces émojis : 😆, 🥹, 😭, ✅, 🌞, ⭐, 👅, 🤳, 😿, 🙀, 😾, 😹 ou ❣️"
        }
    },

    onChat: async function({ api, event, message }) {
        if (!event.body) return;
        const msg = event.body.trim();

        // Base de données des émojis et des conseils associés
        const emojiResponses = {
            "😆": "☀️ Rire est le meilleur remède ! Continue de propager cette belle énergie autour de toi.",
            "🥹": "✨ Ne retiens pas tes larmes d'émotion, elles montrent simplement la beauté de ton cœur.",
            "😭": "🧸 Les moments difficiles ne durent pas. Prends une grande inspiration, tout ira bien.",
            "✅": "🎯 Un objectif atteint ! Continue sur cette lancée, la régularité est la clé du succès.",
            "🌞": "🌱 Profite de la lumière du jour pour faire le plein de positivité et de motivation.",
            "⭐": "💫 Tu es une étoile ! Ne laisse jamais personne éteindre ta propre lumière.",
            "👅": "🤪 Un peu d'humour et de légèreté font toujours du bien, reste authentique !",
            "🤳": "📸 Capture les bons moments, mais n'oublie pas de vivre pleinement l'instant présent.",
            "😿": "🐾 Un petit coup de mou ? Accorde-toi une pause bien méritée pour recharger tes batteries.",
            "🙀": "shock Relaxe, prends une grande inspiration. Rien n'est aussi grave qu'il n'y paraît !",
            "😾": "🔥 La colère est une énergie. Respire un grand coup et transforme-la en force positive.",
            "😹": "🎉 Le rire partagé est un trésor. Merci d'apporter cette joie dans le groupe !",
            "❣️": "👑 Mon créateur aime ceux qui l'aiment ! Un grand respect et beaucoup d'amour pour lui."
        };

        // Vérification si le message est exactement l'un des émojis ciblés
        if (emojiResponses[msg]) {
            return message.reply(emojiResponses[msg]);
        }
    },

    onStart: async function({ message }) {
        return message.reply("🔮 La commande d'écoute des émojis est active ! Envoyez l'un de ces émojis pour recevoir un conseil ou un message spécial : 😆, 🥹, 😭, ✅, 🌞, ⭐, 👅, 🤳, 😿, 🙀, 😾, 😹, ❣️");
    }
};
