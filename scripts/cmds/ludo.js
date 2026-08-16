const Canvas = require("canvas");
const { createCanvas } = Canvas;
const path = require("path");
const fs = require("fs");
const os = require("os");

let fonts;
try {
  fonts = require('../../func/font.js');
} catch {
  fonts = { bold: t => t, sansSerif: t => t, monospace: t => t };
}

Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Bold.ttf"), { family: "LudoFont", weight: "bold" });
Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Regular.ttf"), { family: "LudoFont", weight: "normal" });
Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-SemiBold.ttf"), { family: "LudoFont", weight: "600" });

const COLORS = [
  { key: "red", name: "Rouge", emoji: "🔴", hex: "#ef4444", dark: "#991b1b", start: 0, home: [[1,6],[2,6],[3,6],[4,6],[5,6],[6,6]], yard: [[2,2],[4,2],[2,4],[4,4]] },
  { key: "yellow", name: "Jaune", emoji: "🟡", hex: "#facc15", dark: "#a16207", start: 13, home: [[8,1],[8,2],[8,3],[8,4],[8,5],[8,6]], yard: [[10,2],[12,2],[10,4],[12,4]] },
  { key: "green", name: "Vert", emoji: "🟢", hex: "#22c55e", dark: "#166534", start: 26, home: [[13,8],[12,8],[11,8],[10,8],[9,8],[8,8]], yard: [[10,10],[12,10],[10,12],[12,12]] },
  { key: "blue", name: "Bleu", emoji: "🔵", hex: "#3b82f6", dark: "#1e40af", start: 39, home: [[6,13],[6,12],[6,11],[6,10],[6,9],[6,8]], yard: [[2,10],[4,10],[2,12],[4,12]] }
];

const TRACK = [
  [1,6],[2,6],[3,6],[4,6],[5,6],[6,5],[6,4],[6,3],[6,2],[6,1],[6,0],[7,0],[8,0],
  [8,1],[8,2],[8,3],[8,4],[8,5],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[14,7],[14,8],
  [13,8],[12,8],[11,8],[10,8],[9,8],[8,9],[8,10],[8,11],[8,12],[8,13],[8,14],[7,14],[6,14],
  [6,13],[6,12],[6,11],[6,10],[6,9],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8],[0,7],[0,6]
];

const SAFE_TRACK_INDEXES = new Set([0,8,13,21,26,34,39,47]);
const activeGames = new Map();
const GAME_EXPIRE_TIME = 1000 * 60 * 45;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = {
  config: {
    name: "ludo",
    aliases: ["ludoking", "ludogame"],
    version: "1.0",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: {
      fr: "🎲 Jeu de Ludo complet avec plateau Canvas, multijoueur, bots et paris."
    },
    category: "game",
    guide: {
      fr: `${fonts.sansSerif('🎲 LUDO ROYAL 🎲')}\n` +
        `${fonts.bold('Commandes :')}\n` +
        `• ${fonts.monospace('ludo bot')} : 1v1 contre un bot\n` +
        `• ${fonts.monospace('ludo bot 3')} : contre 2 bots\n` +
        `• ${fonts.monospace('ludo bot 4')} : contre 3 bots\n` +
        `• ${fonts.monospace('ludo 1v1 @joueur')} : 2 joueurs\n` +
        `• ${fonts.monospace('ludo 1v1v1 @p2 @p3')} : 3 joueurs\n` +
        `• ${fonts.monospace('ludo 1v1v1v1 @p2 @p3 @p4')} : 4 joueurs\n` +
        `• ${fonts.monospace('ludo 2v2 @p2 @p3 @p4')} : équipes (Rouge+Vert vs Jaune+Bleu)\n` +
        `• ${fonts.monospace('ludo stop')} : terminer la partie\n` +
        `• ${fonts.monospace('ludo status')} : afficher le plateau\n\n` +
        `${fonts.bold('Paris (multijoueur uniquement) :')}\n` +
        `• ${fonts.monospace('ludo 1v1 @joueur 500')} : 1v1 avec 500$ de mise chacun\n` +
        `• ${fonts.monospace('ludo 1v1v1 @p2 @p3 1000')} : 3 joueurs avec 1000$ chacun\n` +
        `• ${fonts.monospace('ludo 2v2 @p2 @p3 @p4 2000')} : équipes avec 2000$ chacun\n\n` +
        `${fonts.bold('Comment jouer :')}\n` +
        `1. Répondez ${fonts.monospace('roll')} pour lancer le dé.\n` +
        `2. Si plusieurs pions peuvent bouger, répondez 1, 2, 3 ou 4.\n` +
        `3. Un 6 permet de sortir un pion et rejoue.\n` +
        `4. Marchez sur un adversaire pour le capturer.\n` +
        `5. Ramenez vos 4 pions à la maison pour gagner.\n` +
        `★ Les cases étoiles protègent contre la capture.`
    }
  },

  onStart: async function ({ message, event, args, api, usersData, commandName }) {
    cleanupExpiredGames();
    const mode = (args[0] || "").toLowerCase();
    if (!mode || mode === "help") {
      return message.reply(this.config.guide.fr);
    }
    if (mode === "stop" || mode === "end") {
      const ended = endGamesForThread(event.threadID, event.senderID);
      if (!ended) return message.reply(fonts.bold("❌ Aucune partie de Ludo en cours pour vous dans ce groupe."));
      return message.reply(fonts.bold(`✅ ${ended} partie(s) terminée(s).`));
    }
    if (mode === "status") {
      for (const game of activeGames.values()) {
        if (game.threadID === event.threadID && game.players.some(p => p.id === event.senderID)) {
          await publishState(message, game, "📊 État du plateau");
          return;
        }
      }
      return message.reply(fonts.bold("❌ Aucune partie de Ludo en cours pour vous dans ce groupe."));
    }
    await handleLudoStart({ message, event, args, api, usersData, commandName });
  },

  onReply: async function ({ message, event, Reply, commandName, api, usersData }) {
    cleanupExpiredGames();
    const game = activeGames.get(Reply.gameKey || Reply.threadID);
    if (!game || game.id !== Reply.gameID) return;
    if (game.replyMessageID && global.GoatBot?.onReply) {
      global.GoatBot.onReply.delete(game.replyMessageID);
    }
    const current = game.players[game.turnIndex];
    if (!current || current.bot) return;
    if (event.senderID !== current.id) {
      return message.reply({
        body: fonts.bold(`❌ Ce n'est pas votre tour ! C'est à ${current.name}.`),
        mentions: [{ id: current.id, tag: current.name }]
      });
    }
    const input = (event.body || "").trim().toLowerCase();
    if (input === "stop" || input === "end") {
      if (game.bet > 0) await refundBets(game, usersData);
      endGame(game);
      return message.reply(fonts.bold("🛑 Partie de Ludo terminée. Paris remboursés."));
    }
    if (game.phase === "roll") {
      if (!["roll", "r", "dice", "🎲"].includes(input)) {
        await publishState(message, game, `${current.name}, répondez "roll" pour lancer le dé.`);
        return;
      }
      await rollAndMaybeMove(message, game, api, usersData);
      return;
    }
    if (game.phase === "move") {
      const tokenNumber = parseInt(input.replace(/[^1-4]/g, ""), 10);
      if (!tokenNumber || !game.legalMoves.includes(tokenNumber - 1)) {
        await publishState(message, game, `Choisissez un pion déplaçable : ${game.legalMoves.map(i => i + 1).join(", ")}`);
        return;
      }
      applyMove(game, game.turnIndex, tokenNumber - 1, game.lastRoll);
      afterHumanMove(game);
      const winnerMsg = getWinner(game);
      if (winnerMsg) {
        await payoutWinner(game, usersData);
        const finalMsg = buildWinMessage(game, winnerMsg);
        endGame(game);
        await publishState(message, game, finalMsg);
        return;
      }
      await publishState(message, game, `${current.name} a déplacé le pion ${tokenNumber}.`);
      await runBots(message, game, api, usersData);
    }
  }
};

function cleanupExpiredGames() {
  const now = Date.now();
  for (const game of activeGames.values()) {
    if (now - game.updatedAt > GAME_EXPIRE_TIME) endGame(game);
  }
}

function endGame(game) {
  activeGames.delete(game.key);
  if (game.replyMessageID && global.GoatBot?.onReply) {
    global.GoatBot.onReply.delete(game.replyMessageID);
  }
}

function endGamesForThread(threadID, senderID) {
  let ended = 0;
  for (const game of [...activeGames.values()]) {
    const belongsToSender = game.players.some(p => p.id === senderID);
    if (game.threadID === threadID && (!game.botGame || belongsToSender)) {
      endGame(game);
      ended++;
    }
  }
  return ended;
}

async function handleLudoStart({ message, event, args, api, usersData, commandName }) {
  const threadID = event.threadID;
  const senderID = event.senderID;
  const mode = (args[0] || "").toLowerCase();
  const humanName = await getUserName(api, usersData, senderID);

  let playerCount = 2, teamMode = false, isBotGame = false;
  if (mode === "1v1") playerCount = 2;
  else if (mode === "1v1v1") playerCount = 3;
  else if (mode === "1v1v1v1") playerCount = 4;
  else if (mode === "2v2") { playerCount = 4; teamMode = true; }
  else if (mode === "bot" || mode === "bots") {
    isBotGame = true;
    playerCount = Math.min(4, Math.max(2, parseInt(args[1], 10) || 2));
  }
  else {
    return message.reply(this.config.guide.fr);
  }

  const mentionedIDs = Object.keys(event.mentions || {}).filter(id => id !== senderID);
  const players = [{ id: senderID, name: humanName, bot: false }];
  for (let i = 0; i < Math.min(mentionedIDs.length, playerCount - 1); i++) {
    const id = mentionedIDs[i];
    const name = await getUserName(api, usersData, id);
    players.push({ id, name, bot: false });
  }
  while (players.length < playerCount) {
    players.push({ id: `bot_${players.length}_${Date.now()}`, name: `Bot Royal ${players.length}`, bot: true });
  }

  let betAmount = 0;
  if (!isBotGame) {
    const betArg = args.find(a => /^\d+$/.test(a) && parseInt(a,10) > 0);
    if (betArg) betAmount = parseInt(betArg,10);
  }
  if (betAmount > 0) {
    const humanPlayers = players.filter(p => !p.bot);
    for (const p of humanPlayers) {
      const ud = await usersData.get(p.id);
      const balance = ud?.money || 0;
      if (balance < betAmount) {
        return message.reply(fonts.bold(`💸 ${p.name} n'a pas assez d'argent !\nNécessaire : $${betAmount.toLocaleString()} | Balance : $${balance.toLocaleString()}`));
      }
    }
    for (const p of humanPlayers) {
      const ud = await usersData.get(p.id);
      await usersData.set(p.id, { money: (ud.money || 0) - betAmount });
    }
  }

  const game = createGame(threadID, players, teamMode, commandName, isBotGame, betAmount);
  game.usersData = usersData;
  activeGames.set(game.key, game);

  const betInfo = betAmount > 0 ? ` | Cagnotte : $${game.pot.toLocaleString()}` : "";
  const startMsg = `🎲 LUDO ROYAL a commencé !${betInfo} Répondez "roll" quand c'est votre tour.`;
  await publishState(message, game, startMsg);
  await runBots(message, game, api, usersData);
}

function createGame(threadID, rawPlayers, teamMode, commandName, botGame, bet = 0) {
  const players = rawPlayers.map((player, index) => ({
    ...player,
    color: COLORS[index].key,
    emoji: COLORS[index].emoji,
    colorData: COLORS[index],
    tokens: [-1, -1, -1, -1],
    finished: 0,
    team: teamMode ? (index % 2 === 0 ? "A" : "B") : null
  }));
  const key = botGame ? `${threadID}:${rawPlayers[0].id}` : threadID;
  const humanCount = rawPlayers.filter(p => !p.bot).length;
  return {
    id: `${threadID}_${Date.now()}`,
    key, botGame, threadID, commandName, players, teamMode,
    turnIndex: 0, phase: "roll", lastRoll: null, legalMoves: [],
    moveCount: 0, captures: [], log: ["Partie créée"],
    replyMessageID: null, updatedAt: Date.now(), startedAt: Date.now(),
    bet, pot: bet * humanCount, prizePerWinner: 0, usersData: null
  };
}

async function rollAndMaybeMove(message, game, api, usersData) {
  const player = game.players[game.turnIndex];
  const roll = randomDice();
  const legal = getLegalMoves(player, roll);
  game.lastRoll = roll;
  game.legalMoves = legal;
  if (!legal.length) {
    game.log.unshift(`${player.emoji} ${player.name} a fait ${roll} → aucun mouvement.`);
    nextTurn(game, roll);
    await publishState(message, game, `${player.emoji} ${player.name} a fait ${diceEmoji(roll)} : aucun pion ne peut bouger.`);
    await runBots(message, game, api, usersData);
    return;
  }
  if (legal.length === 1) {
    applyMove(game, game.turnIndex, legal[0], roll);
    afterHumanMove(game);
    const winnerMsg = getWinner(game);
    if (winnerMsg) {
      await payoutWinner(game, usersData);
      const finalMsg = buildWinMessage(game, winnerMsg);
      endGame(game);
      await publishState(message, game, finalMsg);
      return;
    }
    await publishState(message, game, `${player.name} a fait ${diceEmoji(roll)} et déplacé le pion ${legal[0] + 1}.`);
    await runBots(message, game, api, usersData);
    return;
  }
  game.phase = "move";
  await publishState(message, game, `${player.name} a fait ${diceEmoji(roll)} ! Choisissez un pion : ${legal.map(i => i+1).join(", ")}`);
}

async function runBots(message, game, api, usersData) {
  let safety = 0;
  while (activeGames.get(game.key) === game && game.players[game.turnIndex]?.bot && safety < 30) {
    safety++;
    const player = game.players[game.turnIndex];
    await sleep(900);
    const roll = randomDice();
    const legal = getLegalMoves(player, roll);
    game.lastRoll = roll;
    game.legalMoves = legal;
    if (!legal.length) {
      game.log.unshift(`${player.name} [BOT] a fait ${roll} → aucun mouvement.`);
      nextTurn(game, roll);
      continue;
    }
    const tokenIndex = chooseBotMove(game, game.turnIndex, legal, roll);
    applyMove(game, game.turnIndex, tokenIndex, roll);
    const winnerMsg = getWinner(game);
    if (winnerMsg) {
      await payoutWinner(game, usersData);
      const finalMsg = buildWinMessage(game, winnerMsg);
      endGame(game);
      await publishState(message, game, finalMsg);
      return;
    }
    const actionText = `${player.name} a fait ${diceEmoji(roll)} et déplacé le pion ${tokenIndex + 1}.`;
    game.log.unshift(`${player.name} [BOT] a fait ${roll} → T${tokenIndex+1}`);
    nextTurn(game, roll);
    if (!game.players[game.turnIndex]?.bot) {
      await publishState(message, game, `${actionText} Maintenant c'est à ${game.players[game.turnIndex].name} de jouer.`);
      return;
    }
  }
  if (activeGames.get(game.key) === game && game.players[game.turnIndex]?.bot === false) {
    await publishState(message, game, `C'est à ${game.players[game.turnIndex].name} de jouer — répondez "roll".`);
  }
}

function getLegalMoves(player, roll) {
  const moves = [];
  player.tokens.forEach((progress, index) => {
    if (progress === 57) return;
    if (progress === -1 && roll === 6) moves.push(index);
    else if (progress >= 0 && progress + roll <= 57) moves.push(index);
  });
  return moves;
}

function applyMove(game, playerIndex, tokenIndex, roll) {
  const player = game.players[playerIndex];
  const before = player.tokens[tokenIndex];
  const next = before === -1 ? 0 : before + roll;
  player.tokens[tokenIndex] = next;
  game.moveCount++;
  if (next === 57) {
    player.finished++;
    game.log.unshift(`${player.emoji} ${player.name} a ramené le pion ${tokenIndex+1} à la maison.`);
    return;
  }
  const position = getTokenPosition(player, next);
  if (!position || position.zone !== "track" || SAFE_TRACK_INDEXES.has(position.trackIndex)) return;
  for (const enemy of game.players) {
    if (enemy === player) continue;
    if (game.teamMode && enemy.team === player.team) continue;
    enemy.tokens.forEach((enemyProgress, enemyTokenIndex) => {
      const enemyPos = getTokenPosition(enemy, enemyProgress);
      if (enemyPos && enemyPos.zone === "track" && enemyPos.trackIndex === position.trackIndex) {
        enemy.tokens[enemyTokenIndex] = -1;
        enemy.finished = enemy.tokens.filter(t => t === 57).length;
        game.captures.push({ by: player.name, victim: enemy.name });
        game.log.unshift(`${player.emoji} ${player.name} a capturé le pion ${enemyTokenIndex+1} de ${enemy.emoji} ${enemy.name}.`);
      }
    });
  }
}

function chooseBotMove(game, playerIndex, legal, roll) {
  const player = game.players[playerIndex];
  let best = legal[0];
  let bestScore = -999;
  for (const tokenIndex of legal) {
    const progress = player.tokens[tokenIndex];
    const next = progress === -1 ? 0 : progress + roll;
    let score = next;
    if (progress === -1) score += 20;
    if (next === 57) score += 100;
    const pos = getTokenPosition(player, next);
    if (pos && pos.zone === "track") {
      for (const enemy of game.players) {
        if (enemy === player) continue;
        if (game.teamMode && enemy.team === player.team) continue;
        if (enemy.tokens.some(t => {
          const enemyPos = getTokenPosition(enemy, t);
          return enemyPos && enemyPos.zone === "track" && enemyPos.trackIndex === pos.trackIndex;
        })) score += 60;
      }
      if (SAFE_TRACK_INDEXES.has(pos.trackIndex)) score += 8;
    }
    if (score > bestScore) { bestScore = score; best = tokenIndex; }
  }
  return best;
}

function nextTurn(game, roll) {
  if (roll !== 6) game.turnIndex = (game.turnIndex + 1) % game.players.length;
  game.phase = "roll";
  game.lastRoll = null;
  game.legalMoves = [];
}

function afterHumanMove(game) {
  nextTurn(game, game.lastRoll);
  game.phase = "roll";
  game.lastRoll = null;
  game.legalMoves = [];
}

function getWinner(game) {
  if (game.teamMode) {
    const teamA = game.players.filter(p => p.team === "A");
    const teamB = game.players.filter(p => p.team === "B");
    if (teamA.every(p => p.tokens.every(t => t === 57))) return "🏆 L'équipe Rouge + Vert remporte la bataille 2v2 !";
    if (teamB.every(p => p.tokens.every(t => t === 57))) return "🏆 L'équipe Jaune + Bleu remporte la bataille 2v2 !";
    return null;
  }
  const winner = game.players.find(p => p.tokens.every(t => t === 57));
  return winner ? `🏆 ${winner.emoji} ${winner.name} remporte Ludo Royal !` : null;
}

function getTokenPosition(player, progress) {
  if (progress < 0) return null;
  if (progress <= 51) {
    const trackIndex = (player.colorData.start + progress) % TRACK.length;
    const [col, row] = TRACK[trackIndex];
    return { zone: "track", trackIndex, col, row };
  }
  if (progress <= 56) {
    const [col, row] = player.colorData.home[progress - 52];
    return { zone: "home", col, row };
  }
  return { zone: "finish", col: 7, row: 7 };
}

async function publishState(message, game, body) {
  game.updatedAt = Date.now();
  const current = game.players[game.turnIndex];
  const details = formatDetails(game, body);
  const oldReplyMessageID = game.replyMessageID;
  if (oldReplyMessageID && global.GoatBot?.onReply) {
    global.GoatBot.onReply.delete(oldReplyMessageID);
  }
  const tmpPath = path.join(os.tmpdir(), `ludo_${game.id}_${Date.now()}.png`);
  try {
    const canvas = renderGame(game, body);
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(tmpPath, buffer);
  } catch (err) {
    console.error("[Ludo] Erreur Canvas:", err);
    return message.reply(fonts.bold(`🎲 ${body}`));
  }
  const mentions = (current && !current.bot && current.id) ? [{ id: current.id, tag: current.name }] : [];
  return new Promise((resolve) => {
    message.reply({ body: details, attachment: fs.createReadStream(tmpPath), mentions }, (err, info) => {
      try { fs.unlinkSync(tmpPath); } catch (_) {}
      if (err) {
        console.error("[Ludo] Envoi erreur:", err);
        resolve();
        return;
      }
      game.replyMessageID = info.messageID;
      if (activeGames.get(game.key) === game && current && !current.bot && global.GoatBot?.onReply) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: game.commandName,
          messageID: info.messageID,
          author: current.id,
          threadID: game.threadID,
          gameKey: game.key,
          gameID: game.id
        });
      }
      resolve();
    });
  });
}

function formatDetails(game, body) {
  const current = game.players[game.turnIndex];
  const mode = game.teamMode ? "2v2 Combat par équipes" : `Partie ${game.players.length} joueurs`;
  const elapsed = Math.floor((Date.now() - game.startedAt) / 60000);
  const lines = [];
  lines.push(`🎲 LUDO ROYAL — ${mode}`);
  lines.push(`⏱ Temps : ${elapsed}m  |  Mouvements : ${game.moveCount}  |  Captures : ${game.captures.length}`);
  if (game.bet > 0) lines.push(`💰 Mise : $${game.bet.toLocaleString()} chacun  |  Cagnotte : $${game.pot.toLocaleString()}`);
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  if (game.lastRoll) {
    const rollLabel = game.lastRoll === 6 ? `${diceEmoji(game.lastRoll)} 6 — TOUR SUPPLEMENTAIRE !` : `${diceEmoji(game.lastRoll)} (${game.lastRoll})`;
    lines.push(`🎲 Dernier dé : ${rollLabel}`);
  }
  if (cur
