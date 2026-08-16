const axios = require('axios');

const BASE_URL = 'https://quiz-api-eosin-xi.vercel.app/api';

module.exports = {
  config: {
    name: "quiz",
    aliases: ["q"],
    version: "4.0",
    author: "Christus",
    countDown: 0,
    role: 0,
    longDescription: {
      en: "Jeu de quiz avancé avec 6000+ questions, images, succès et classements"
    },
    category: "game",
    guide: {
      en: `{pn} <catégorie>\n\n📚 Catégories disponibles :\n🎌 anime, 🏁 flag, 📺 cartoon, 🐾 animaux, 🏛️ monument, ⚽ sport, 🔬 science, 📖 histoire, 🎬 cinema, 🌍 geographie, ➗ maths, 🎭 culture, ⚖️ torf`
    }
  },

  langs: {
    en: {
      reply: "🎯 𝗤𝘂𝗶𝘇 𝗖𝗵𝗮𝗹𝗹𝗲𝗻𝗴𝗲\n━━━━━━━━━━\n\n📚 𝖢𝖺𝗍é𝗀𝗈𝗋𝗂𝖾: {category}\n🎚️ 𝖣𝗂𝖿𝖿𝗂𝖼𝗎𝗅𝗍é: {difficulty}\n❓ 𝗤𝘂𝗲𝘀𝘁𝗶𝗼𝗻: {question}\n\n{options}\n\n⏰ 𝖵𝗈𝗎𝗌 𝖺𝗏𝖾𝗓 30 𝗌𝖾𝖼𝗈𝗇𝖽𝖾𝗌 𝗉𝗈𝗎𝗋 𝖺𝗇𝗌𝗐𝖾𝗋𝗌 (A/B/C/D):",
      torfReply: "⚙ 𝗤𝘂𝗶𝘇 ( Vrai/Faux )\n━━━━━━━━━━\n\n💭 𝗤𝘂𝗲𝘀𝘁𝗶𝗼𝗻: {question}\n\n😆: Vrai\n😮: Faux\n\nRéagissez avec les émojis\n⏰ 30 secondes pour répondre",
      correctMessage: "🎉 𝗕𝗼𝗻𝗻𝗲 𝗿é𝗽𝗼𝗻𝘀𝗲 !\n━━━━━━━━━━\n\n✅ 𝖲𝖼𝗈𝗋𝖾: {correct}/{total}\n🏆 𝖯𝗋é𝖼𝗂𝗌𝗂𝗈𝗇: {accuracy}%\n🔥 𝖲é𝗋𝗂𝖾 𝖾𝗇 𝖼𝗈𝗎𝗋𝗌: {streak}\n⚡ 𝖳𝖾𝗆𝗉𝗌 𝖽𝖾 𝖿é𝗉𝗈𝗇𝗌𝖾: {time}s\n🎯 𝖷𝖯 𝖦𝖺𝗂𝗇é: +{xp}\n💰 𝖠𝗋𝗀𝖾𝗇𝗍 𝗀𝖺𝗀𝗇é: +{money}",
      wrongMessage: "❌ 𝗠𝗮𝘂𝘃𝗮𝗶𝘀𝗲 𝗿é𝗽𝗼𝗻𝘀𝗲\n━━━━━━━━━━\n\n🎯 𝖡𝗈𝗇𝗇𝖾 𝗋é𝗉𝗈𝗇𝗌𝖾: {correctAnswer}\n📊 𝖲𝖼𝗈𝗋𝖾: {correct}/{total}\n📈 𝖯𝗋é𝖼𝗂𝗌𝗂𝗈𝗇: {accuracy}%\n💔 𝖲é𝗋𝗂𝖾 𝗋é𝗂𝗇𝗂𝗍𝗂𝖺𝗅𝗂𝗌é𝖾",
      timeoutMessage: "⏰ 𝖳𝖾𝗆𝗉𝗌 é𝖼𝗈𝗎𝗅é ! 𝖡𝗈𝗇𝗇𝖾 𝗋é𝗉𝗈𝗇𝗌𝖾: {correctAnswer}",
      achievementUnlocked: "🏆 𝗦𝘂𝗰𝗰è𝘀 𝗱é𝗯𝗹𝗼𝗾𝘂é !\n{achievement}\n💰 +{bonus} pièces bonus !"
    }
  },

  async safeStream(url) {
    if (!url || !/^https?:\/\//i.test(url)) return null;
    try {
      const res = await axios.get(url, {
        responseType: "stream",
        timeout: 20000,
        maxRedirects: 5,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
          Referer: "https://www.google.com/"
        }
      });
      const ext = (url.split("?")[0].split(".").pop() || "jpg").slice(0, 4);
      res.data.path = `quiz_${Date.now()}.${ext}`;
      return res.data;
    } catch (e) {
      console.error("Échec du téléchargement de l'image:", url, e.message);
      try { return await global.utils.getStreamFromURL(url); } catch (e2) { return null; }
    }
  },

  generateProgressBar(percentile) {
    const filled = Math.round(percentile / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  },

  getUserTitle(correct) {
    if (correct >= 50000) return '🌟 Quiz Omniscient';
    if (correct >= 25000) return '👑 Quiz Divinité';
    if (correct >= 15000) return '⚡ Quiz Titan';
    if (correct >= 10000) return '🏆 Quiz Légende';
    if (correct >= 7500) return '🎓 Grand Maître';
    if (correct >= 5000) return '👨‍🎓 Maître du Quiz';
    if (correct >= 2500) return '🔥 Expert Quiz';
    if (correct >= 1500) return '📚 Savant Quiz';
    if (correct >= 1000) return '🎯 Apprenti Quiz';
    if (correct >= 750) return '🌟 Chercheur de Connaissances';
    if (correct >= 500) return '📖 Apprenant Rapide';
    if (correct >= 250) return '🚀 Étoile Montante';
    if (correct >= 100) return '💡 Débutant';
    if (correct >= 50) return '🎪 Premiers Pas';
    if (correct >= 25) return '🌱 Nouveau Venu';
    if (correct >= 10) return '🔰 Débutant';
    if (correct >= 1) return '👶 Recrue';
    return '🆕 Nouveau Joueur';
  },

  async getUserName(api, userId) {
    try {
      const userInfo = await api.getUserInfo(userId);
      return userInfo[userId]?.name || 'Joueur Anonyme';
    } catch (error) {
      console.warn("Échec de récupération des infos utilisateur pour", userId, error);
      return 'Joueur Anonyme';
    }
  },

  async getAvailableCategories() {
    try {
      const res = await axios.get(`${BASE_URL}/categories`);
      return res.data.map(cat => cat.toLowerCase());
    } catch (error) {
      console.error("Erreur lors de la récupération des catégories:", error);
      return [];
    }
  },

  onStart: async function ({ message, event, args, commandName, getLang, api, usersData }) {
    try {
      const command = args[0]?.toLowerCase();

      if (!args[0] || command === "help") {
        return await this.handleDefaultView(message, getLang);
      }

      switch (command) {
        case "rank":
        case "profile":
          return await this.handleRank(message, event, getLang, api, usersData);
        case "leaderboard":
        case "lb":
          return await this.handleLeaderboard(message, getLang, args.slice(1), api);
        case "category":
          if (args.length > 1) {
            return await this.handleCategoryLeaderboard(message, getLang, args.slice(1), api);
          }
          return await this.handleCategories(message, getLang);
        case "daily":
          return await this.handleDailyChallenge(message, event, commandName, api);
        case "torf":
          return await this.handleTrueOrFalse(message, event, commandName, api);
        case "flag":
          return await this.handleFlagQuiz(message, event, commandName, api);
        case "anime":
          return await this.handleAnimeQuiz(message, event, commandName, api);
        case "cartoon":
        case "dessin":
        case "dessins":
        case "kids":
          return await this.handleImageQuiz(message, event, commandName, "cartoon", "📺 𝗤𝘂𝗶𝘇 𝗗𝗲𝘀𝘀𝗶𝗻𝘀 𝗔𝗻𝗶𝗺é𝘀");
        case "animaux":
        case "animal":
          return await this.handleImageQuiz(message, event, commandName, "animaux", "🐾 𝗤𝘂𝗶𝘇 𝗔𝗻𝗶𝗺𝗮𝘂𝘅");
        case "monument":
        case "monuments":
          return await this.handleImageQuiz(message, event, commandName, "monument", "🏛️ 𝗤𝘂𝗶𝘇 𝗠𝗼𝗻𝘂𝗺𝗲𝗻𝘁𝘀");
        case "sport":
        case "sports":
          return await this.handleImageQuiz(message, event, commandName, "sport", "⚽ 𝗤𝘂𝗶𝘇 𝗦𝗽𝗼𝗿𝘁");
        case "cinema":
        case "film":
        case "films":
          return await this.handleImageQuiz(message, event, commandName, "cinema", "🎬 𝗤𝘂𝗶𝘇 𝗖𝗶𝗻é𝗺𝗮");
        case "hard":
          return await this.handleQuiz(message, event, ["general"], commandName, getLang, api, usersData, "hard");
        case "medium":
          return await this.handleQuiz(message, event, ["general"], commandName, getLang, api, usersData, "medium");
        case "easy":
          return await this.handleQuiz(message, event, ["general"], commandName, getLang, api, usersData, "easy");
        case "random":
          return await this.handleQuiz(message, event, [], commandName, getLang, api, usersData);
        default:
          const categories = await this.getAvailableCategories();
          if (categories.includes(command)) {
            return await this.handleQuiz(message, event, [command], commandName, getLang, api, usersData);
          } else {
            return await this.handleDefaultView(message, getLang);
          }
      }
    } catch (err) {
      console.error("Erreur de démarrage du quiz:", err);
      return message.reply("⚠️ Une erreur est survenue, réessayez.");
    }
  },

  async handleDefaultView(message, getLang) {
    try {
      const res = await axios.get(`${BASE_URL}/categories`);
      const categories = res.data;

      const catText = categories.map(c => {
        const icons = {
          anime: '🎌', flag: '🏁', cartoon: '📺', animaux: '🐾',
          monument: '🏛️', sport: '⚽', science: '🔬', histoire: '📖',
          cinema: '🎬', geographie: '🌍', maths: '➗', culture: '🎭',
          torf: '⚖️', general: '🎯'
        };
        return `${icons[c] || '📍'} ${c.charAt(0).toUpperCase() + c.slice(1)}`;
      }).join("\n");

      return message.reply(
        `🎯 𝗤𝘂𝗶𝘇\n━━━━━━━━\n\n` +
        `📚 𝗖𝗮𝘁é𝗴𝗼𝗿𝗶𝗲𝘀 (${categories.length})\n\n${catText}\n\n` +
        `━━━━━━━━━\n\n` +
        `🏆 𝗨𝘁𝗶𝗹𝗶𝘀𝗮𝘁𝗶𝗼𝗻\n` +
        `• quiz rank - Voir votre classement\n` +
        `• quiz leaderboard - Voir le classement global\n` +
        `• quiz torf - Jouer au quiz Vrai/Faux\n` +
        `• quiz flag - Jouer au quiz des drapeaux\n` +
        `• quiz anime - Jouer au quiz anime\n` +
        `• quiz cartoon - Jouer au quiz dessins animés\n` +
        `• quiz animaux - Jouer au quiz animaux\n` +
        `• quiz monument - Jouer au quiz monuments\n` +
        `• quiz sport - Jouer au quiz sport\n\n` +
        `🎮 Utilisez: quiz <catégorie> pour commencer le quiz`
      );
    } catch (err) {
      console.error("Erreur de la vue par défaut:", err);
      return message.reply("⚠️ Impossible de récupérer les catégories. Essayez 'quiz help' pour les commandes.");
    }
  },

  async handleRank(message, event, getLang, api, usersData) {
    try {
      const userName = await this.getUserName(api, event.senderID);

      await axios.post(`${BASE_URL}/user/update`, {
        userId: event.senderID,
        name: userName
      });

      const res = await axios.get(`${BASE_URL}/user/${event.senderID}`);
      const user = res.data;

      if (!user || user.total === 0) {
        return message.reply(`❌ Vous n'avez pas encore joué de quiz ! Utilisez 'quiz random' pour commencer.\n👤 Bienvenue, ${userName} !`);
      }

      const position = user.position ?? "N/A";
      const totalUser = user.totalUsers ?? "N/A";
      const progressBar = this.generateProgressBar(user.percentile ?? 0);
      const title = this.getUserTitle(user.correct || 0);

      const streakInfo = user.currentStreak > 0 ? 
        `🔥 𝖲é𝗋𝗂𝖾 𝖾𝗇 𝖼𝗈𝗎𝗋𝗌: ${user.currentStreak}${user.currentStreak >= 5 ? ' 🚀' : ''}` :
        `🔥 𝖲é𝗋𝗂𝖾 𝖾𝗇 𝖼𝗈𝗎𝗋𝗌: 0`;

      const bestStreakInfo = user.bestStreak > 0 ?
        `🏅 𝖬𝖾𝗂𝗅𝗅𝖾𝗎𝗋𝖾 𝗌é𝗋𝗂𝖾: ${user.bestStreak}${user.bestStreak >= 10 ? ' 👑' : user.bestStreak >= 5 ? ' ⭐' : ''}` :
        `🏅 𝖬𝖾𝗂𝗅𝗅𝖾𝗎𝗋𝖾 𝗌é𝗋𝗂𝖾: 0`;

      const userData = await usersData.get(event.senderID) || {};
      const userMoney = userData.money || 0;

      const currentXP = user.xp ?? 0;
      const xpTo1000 = Math.max(0, 1000 - currentXP);
      const xpProgress = Math.min(100, (currentXP / 1000) * 100);
      const xpProgressBar = this.generateProgressBar(xpProgress);

      return message.reply(
        `🎮 𝗣𝗿𝗼𝗳𝗶𝗹 𝗤𝘂𝗶𝘇\n━━━━━━━━━\n\n` +
        `👤 ${userName}\n` +
        `🎖️ ${title}\n` +
        `🏆 𝖢𝗅𝖺𝗌𝗌𝖾𝗆𝖾𝗇𝗍 𝗀𝗅𝗈𝖻𝖺𝗅: #${position}/${totalUser}\n` +
        `📈 𝖯𝖾𝗋𝖼𝖾𝗇𝗍𝗂𝗅𝖾: ${progressBar} ${user.percentile ?? 0}%\n\n` +
        `📊 𝗦𝘁𝗮𝘁𝗶𝘀𝘁𝗶𝗾𝘂𝗲𝘀\n` +
        `✅ 𝖡𝗈𝗇𝗇𝖾𝗌 𝗋é𝗉𝗈𝗇𝗌𝖾𝗌: ${user.correct ?? 0}\n` +
        `❌ 𝖬𝖺𝗎𝗏𝖺𝗂𝗌𝖾𝗌 𝗋é𝗉𝗈𝗇𝗌𝖾𝗌: ${user.wrong ?? 0}\n` +
        `📝 𝖳𝗈𝗍𝖺𝗅: ${user.total ?? 0}\n` +
        `🎯 𝖯𝗋é𝖼𝗂𝗌𝗂𝗈𝗇: ${user.accuracy ?? 0}%\n` +
        `⚡ 𝖳𝖾𝗆𝗉𝗌 𝗆𝗈𝗒𝖾𝗇 𝗇𝖾 𝗋é𝗉𝗈𝗇𝗌𝖾: ${(user.avgResponseTime ?? 0).toFixed(1)}s\n\n` +
        `💰 𝗥𝗶𝗰𝗵𝗲𝘀𝘀𝗲 & 𝗫𝗣\n` +
        `💵 𝖠𝗋𝗀𝖾𝗇𝗍: ${userMoney.toLocaleString()}\n` +
        `✨ 𝖷𝖯: ${currentXP}/1000\n` +
        `🎯 𝖷𝖯 𝗋𝖾𝗌𝗍𝖺𝗇𝗍 𝗉𝗈𝗎𝗋 1000: ${xpTo1000}\n` +
        `${xpProgressBar} ${xpProgress.toFixed(1)}%\n\n` +
        `🔥 𝗜𝗻𝗳𝗼 𝘀é𝗿𝗶𝗲\n` +
        `${streakInfo}\n` +
        `${bestStreakInfo}\n\n` +
        `🎯 𝖯𝗋𝗈𝖼𝗁𝖺𝗂𝗇 𝗈𝖻𝗃𝖾𝖼𝗍𝗂𝖿: ${user.nextMilestone || "Continuez à jouer !"}`
      );
    } catch (err) {
      console.error("Erreur de classement:", err);
      return message.reply("⚠️ Impossible de récupérer le classement. Réessayez plus tard.");
    }
  },

  async handleLeaderboard(message, getLang, args, api) {
    try {
      const page = parseInt(args?.[0]) || 1;
      const sortBy = args?.[1] || 'correct';

      const res = await axios.get(`${BASE_URL}/leaderboards?page=${page}&limit=8`);
      const { rankings, stats, pagination } = res.data;

      if (!rankings || rankings.length === 0) {
        return message.reply("🏆 Aucun joueur dans le classement. Commencez à jouer pour être le premier !");
      }

      const now = new Date();
      const currentDate = now.toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
      });
      const currentTime = now.toLocaleTimeString('fr-FR', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC'
      });

      const players = await Promise.all(rankings.map(async (u, i) => {
        let userName = u.name || 'Joueur Anonyme';

        if (u.userId && userName === 'Joueur Anonyme') {
          try {
            userName = await this.getUserName(api, u.userId);
          } catch {
            userName = u.name || 'Joueur Anonyme';
          }
        }

        const position = (pagination.currentPage - 1) * 8 + i + 1;
        const crown = position === 1 ? "👑" : position === 2 ? "🥈" : position === 3 ? "🥉" : position <= 10 ? "🏅" : "🎯";
        const title = this.getUserTitle(u.correct || 0);

        const level = u.level ?? Math.floor((u.correct || 0) / 50) + 1;
        const xp = u.xp ?? (u.correct || 0) * 10;
        const accuracy = u.accuracy ?? (u.total > 0 ? Math.round((u.correct / u.total) * 100) : 0);
        const avgResponseTime = typeof u.avgResponseTime === 'number' ? `${u.avgResponseTime.toFixed(2)}s` : 'N/A';
        const totalResponseTime = u.totalResponseTime?.toFixed(2) || '0';
        const fastest = u.fastestResponse?.toFixed(2) || 'N/A';
        const slowest = u.slowestResponse?.toFixed(2) || 'N/A';
        const playTime = u.totalPlayTime ? `${(u.totalPlayTime / 60).toFixed(1)} min` : '0 min';
        const games = u.gamesPlayed || u.total || 0;
        const perfectGames = u.perfectGames || 0;
        const longestSession = u.longestSession?.toFixed(2) || '0';
        const joinDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : 'Inconnu';

        return `${crown} #${position} ${userName}\n` +
               `🎖️ ${title} | 🌟 Nv.${level} | ✨ XP: ${xp.toLocaleString()}\n` +
               `📊 ${u.correct} ✅ / ${u.wrong} ❌ (Précision: ${accuracy}%)\n` +
               `🔥 Série actuelle: ${u.currentStreak || 0} | 🏅 Meilleure série: ${u.bestStreak || 0}\n` +
               `⚡ Temps moyen: ${avgResponseTime} | ⏱️ Temps total: ${totalResponseTime}s\n` +
               `🚀 Plus rapide: ${fastest}s | 🐌 Plus lent: ${slowest}s\n` +
               `🎯 Questions répondues: ${u.questionsAnswered} | Parties: ${games}\n` +
               `🎮 Temps de jeu: ${playTime} | 📈 Parties parfaites: ${perfectGames}\n` +
               `📅 Inscrit le: ${joinDate}`;
      }));

      return message.reply(
        `🏆 𝗖𝗹𝗮𝘀𝘀𝗲𝗺𝗲𝗻𝘁 𝗴𝗹𝗼𝗯𝗮𝗹\n━━━━━━━━━\n\n` +
        `📅 ${currentDate}\n⏰ ${currentTime} UTC\n\n` +
        `━━━━━━━━━\n\n${players.join('\n\n')}\n\n` +
        `📖 Page ${pagination?.currentPage || 1}/${pagination?.totalPages || 1} | 👥 Total utilisateurs: ${stats?.totalUsers || 0}\n` +
        `🔄 Utilisez: quiz leaderboard <page> <tri>\n` +
        `📊 Options de tri: correct, accuracy, streak, level`
      );

    } catch (err) {
      console.error("Erreur du classement:", err);
      return message.reply("⚠️ Impossible de récupérer le classement. Le serveur est peut-être occupé, réessayez plus tard.");
    }
  },

  async handleCategories(message, getLang) {
    try {
      const res = await axios.get(`${BASE_URL}/categories`);
      const categories = res.data;

      const icons = {
        anime: '🎌', flag: '🏁', cartoon: '📺', animaux: '🐾',
        monument: '🏛️', sport: '⚽', science: '🔬', histoire: '📖',
        cinema: '🎬', geographie: '🌍', maths: '➗', culture: '🎭',
        torf: '⚖️', general: '🎯'
      };

      const catText = categories.map(c => 
        `${icons[c] || '📍'} ${c.charAt(0).toUpperCase() + c.slice(1)}`
      ).join("\n");

      return message.reply(
        `📚 𝗖𝗮𝘁é𝗴𝗼𝗿𝗶𝗲𝘀 𝗱𝘂 𝗤𝘂𝗶𝘇 (${categories.length})\n━━━━━━━━\n\n${catText}\n\n` +
        `🎯 Utilisez: quiz <catégorie>\n` +
        `🎲 Aléatoire: quiz random\n` +
        `🏆 Quotidien: quiz daily\n` +
        `🌟 Spéciaux: quiz torf, quiz flag, quiz anime, quiz cartoon\n` +
        `🐾 Quiz animaux: quiz animaux\n` +
        `🏛️ Quiz monuments: quiz monument\n` +
        `⚽ Quiz sport: quiz sport`
      );
    } catch (err) {
      console.error("Erreur des catégories:", err);
      return message.reply("⚠️ Impossible de récupérer les catégories.");
    }
  },

  async handleDailyChallenge(message, event, commandName, api) {
    try {
      const res = await axios.get(`${BASE_URL}/challenge/daily?userId=${event.senderID}`);
      const { question, challengeDate, reward, streak } = res.data;

      const userName = await this.getUserName(api, event.senderID);

      const optText = question.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join("\n");

      const info = await message.reply(
        `🌟 𝗗é𝗳𝗶 𝗾𝘂𝗼𝘁𝗶𝗱𝗶𝗲𝗻\n━━━━━━━━━\n\n` +
        `📅 ${challengeDate}\n` +
        `🎯 Récompense bonus: +${reward} XP\n` +
        `🔥 Série quotidienne: ${streak}\n\n\n` +
        `❓ ${question.question}\n\n${optText}\n\n⏰ 30 secondes pour répondre !`
      );

      global.GoatBot.onReply.set(info.messageID, {
        commandName,
        author: event.senderID,
        messageID: info.messageID,
        answer: question.answer,
        questionId: question._id,
        startTime: Date.now(),
        isDailyChallenge: true,
        bonusReward: reward
      });

      setTimeout(() => {
        const r = global.GoatBot.onReply.get(info.messageID);
        if (r) {
          message.reply(`⏰ Temps écoulé ! La bonne réponse était: ${question.answer}`);
          message.unsend(info.messageID);
          global.GoatBot.onReply.delete(info.messageID);
        }
      }, 30000);
    } catch (err) {
      console.error("Erreur du défi quotidien:", err);
      return message.reply("⚠️ Impossible de créer le défi quotidien.");
    }
  },

  async handleTrueOrFalse(message, event, commandName, api) {
    try {
      const res = await axios.get(`${BASE_URL}/question?category=torf&userId=${event.senderID}`);
      const { _id, question, answer } = res.data;

      const info = await message.reply(this.langs.en.torfReply.replace("{question}", question));

      const correctAnswer = answer.toUpperCase();

      global.GoatBot.onReaction.set(info.messageID, {
        commandName,
        author: event.senderID,
        messageID: info.messageID,
        answer: correctAnswer,
        reacted: false,
        reward: 10000,
        questionId: _id,
        startTime: Date.now()
      });

      setTimeout(() => {
        const reaction = global.GoatBot.onReaction.get(info.messageID);
        if (reaction && !reaction.reacted) {
          const correctText = correctAnswer === "A" ? "Vrai" : "Faux";
          message.reply(this.langs.en.timeoutMessage.replace("{correctAnswer}", correctText));
          message.unsend(info.messageID);
          global.GoatBot.onReaction.delete(info.messageID);
        }
      }, 30000);
    } catch (err) {
      console.error("Erreur Vrai/Faux:", err);
      return message.reply("⚠️ Impossible de créer la question Vrai/Faux.");
    }
  },

  async handleFlagQuiz(message, event, commandName, api) {
    try {
      const res = await axios.get(`${BASE_URL}/question?category=flag&userId=${event.senderID}`, { timeout: 25000 });
      const { _id, question, options, answer, imageUrl } = res.data;
      
      if (!Array.isArray(options) || !options.length) {
        return message.reply("⚠️ Aucune question sur les drapeaux disponible pour le moment. Réessayez plus tard.");
      }

      const flagEmbed = {
        body: `🏁 𝗤𝘂𝗶𝘇
