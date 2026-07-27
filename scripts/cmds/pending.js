module.exports = {
	config: {
		name: "approve",
		aliases: ["pending", "pend", "pe"],
		version: "2.2.0",
		author: "ଓ.ᎩႮᏒ仒ꜝ",
		editor: "ଓ.ᎩႮᏒ仒ꜝ",
		countDown: 5,
		role: 2,
		shortDescription: "Gérer les demandes en attente",
		longDescription: "Approuver ou rejeter les demandes d'utilisateurs ou de groupes avec une interface propre.",
		category: "utility",
		guide: {
			fr: "{pn} user : Voir les utilisateurs en attente\n{pn} thread : Voir les groupes en attente\n{pn} all : Voir tout\n\nRépondez avec des numéros pour APPROUVER (ex: 1 2)\nRépondez avec 'r' + numéros pour REJETER (ex: r 1 2)\nRépondez 'c' pour annuler"
		}
	},

	onReply: async function ({ message, api, event, Reply }) {
		const { author, pending, messageID } = Reply;
		if (String(event.senderID) !== String(author)) return;

		const { body } = event;
		const trimmed = body.trim().toLowerCase();

		if (trimmed === "c") {
			api.unsendMessage(messageID);
			return message.reply(`❌ Annulé\nOpération annulée.`);
		}

		// Mode rejet : "r 1 2 3"
		const isReject = trimmed.startsWith("r ") || trimmed === "r";
		const rawIndexes = isReject ? trimmed.replace(/^r\s*/, "") : trimmed;
		const indexes = rawIndexes.split(/\s+/).map(Number).filter(n => !isNaN(n));

		if (indexes.length === 0)
			return message.reply(`❌ Erreur\nEntrée invalide. Entrez des numéros valides (ex: 1 2, ou r 1 2 pour rejeter).`);

		let successCount = 0;
		let failCount = 0;
		const prefix = global.GoatBot.config.prefix || "/";

		for (const idx of indexes) {
			if (idx <= 0 || idx > pending.length) continue;

			const target = pending[idx - 1];
			try {
				if (typeof api.handleMessageRequest !== "function") {
					failCount++;
					continue;
				}

				// Accepte ou refuse réellement la demande côté Facebook
				await api.handleMessageRequest(target.threadID, !isReject);

				if (!isReject) {
					// Notifie uniquement en cas d'approbation
					await api.sendMessage(
						`✅ Notification\nVotre demande a été approuvée par l'Admin.\n\nTapez ${prefix}help pour voir toutes les commandes.`,
						target.threadID
					);

					// Ne change le pseudo que dans un groupe (thread), pas en DM
					if (target.isGroup) {
						await api.changeNickname(
							`${global.GoatBot.config.nickNameBot || "Bot"}`,
							target.threadID,
							api.getCurrentUserID()
						);
					}
				}
				successCount++;
			} catch (err) {
				failCount++;
			}
		}

		const action = isReject ? "rejetée(s)" : "approuvée(s)";
		let resultMsg = `✅ Succès\n${successCount} demande(s) ${action}.`;
		if (failCount > 0) resultMsg += `\n❌ ${failCount} échec(s).`;

		return message.reply(resultMsg);
	},

	onStart: async function ({ message, api, event, args, usersData }) {
		const { threadID, messageID } = event;
		const type = args[0]?.toLowerCase();

		if (!type || !["user", "thread", "all"].some(t => type.startsWith(t))) {
			return message.reply(`ℹ️ Utilisation\n\n${this.config.name} user : Voir les utilisateurs en attente\n${this.config.name} thread : Voir les groupes en attente\n${this.config.name} all : Voir tout`);
		}

		try {
			const spam = (await api.getThreadList(100, null, ["OTHER"])) || [];
			const pending = (await api.getThreadList(100, null, ["PENDING"])) || [];
			const list = [...spam, ...pending];

			let filteredList = [];
			if (type.startsWith("u")) filteredList = list.filter((t) => !t.isGroup);
			else if (type.startsWith("t")) filteredList = list.filter((t) => t.isGroup);
			else filteredList = list;

			if (filteredList.length === 0) return message.reply(`❌ Info\nAucune demande en attente dans cette catégorie.`);

			let msg = `📋 Demandes en attente\n\n`;

			for (let i = 0; i < filteredList.length; i++) {
				const name = filteredList[i].name || (await usersData.getName(filteredList[i].threadID)) || "Utilisateur Inconnu";
				msg += `[ ${i + 1} ] ${name}\n`;
			}

			msg += `\nNuméros pour APPROUVER (ex: 1 2)\n"r" + numéros pour REJETER (ex: r 1 2)\n"c" pour Annuler.`;

			return api.sendMessage(msg, threadID, (error, info) => {
				global.GoatBot.onReply.set(info.messageID, {
					commandName: this.config.name,
					messageID: info.messageID,
					author: event.senderID,
					pending: filteredList,
				});
			}, messageID);

		} catch (error) {
			return message.reply(`❌ Erreur\nÉchec de récupération de la liste en 
  attente.`);
		}
	},
};
