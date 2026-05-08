// ─────────────────────────────────────────────────────────────
//  VaultBot/src/events/messageCreate.js
//  Handles incoming messages and routes prefix commands
// ─────────────────────────────────────────────────────────────

const logger = require("../utils/logger");
const db     = require("../database/index");
const { t }  = require("../utils/i18n");

module.exports = {
  name: "messageCreate",
  once: false,

  async execute(message, client) {
    // Ignore bots and DMs
    if (message.author.bot) return;
    if (!message.guild)     return;

    const guildId  = message.guild.id;
    const settings = await db.getGuildSettings(guildId);
    const lang     = settings.language;

    // ── Build a map of prefix → command id ───────────────────
    // Each prefix command registers its own prefix key in settings
    // e.g. settings.balance_prefix = "money"
    //      settings.salary_prefix  = "salary"
    //      settings.leaderboard_prefix = "top"

    const prefixMap = {
      [settings.balance_prefix.toLowerCase()]:     "balance",
      [settings.salary_prefix.toLowerCase()]:      "salary",
      [settings.leaderboard_prefix.toLowerCase()]: "leaderboard",
    };

    const content = message.content.trim();
    const lower   = content.toLowerCase();

    // ── Match any registered prefix ───────────────────────────

    let matchedId  = null;
    let matchedKey = null;

    for (const [key, id] of Object.entries(prefixMap)) {
      // Must be exactly the key or start with key + space
      if (lower === key || lower.startsWith(key + " ")) {
        matchedId  = id;
        matchedKey = key;
        break;
      }
    }

    if (!matchedId) return;

    // ── Find the command handler ──────────────────────────────

    const command = client.prefixCommands.get(matchedId);
    if (!command) return;

    // ── Check allowed channels ────────────────────────────────

    const channelKey = `${matchedId}_channels`; // e.g. "balance_channels"
    const allowed    = settings[channelKey] || [];

    if (allowed.length > 0 && !allowed.includes(message.channel.id)) {
      return message.reply(t(lang, "general.wrong_channel"));
    }

    // ── Parse arguments (everything after the prefix) ─────────

    const args = content.slice(matchedKey.length).trim().split(/\s+/).filter(Boolean);

    // ── Execute the command ───────────────────────────────────

    try {
      logger.cmd(
        `[PREFIX] ${message.author.tag} → "${matchedKey}" | args: [${args.join(", ")}] | guild: ${message.guild.name}`
      );
      await command.execute(message, args, settings, client);
    } catch (err) {
      logger.error(`Error in prefix command "${matchedId}":`, err);
      await message.reply(t(lang, "general.unknown_error")).catch(() => {});
    }
  },
};
