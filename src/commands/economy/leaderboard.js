// ─────────────────────────────────────────────────────────────
//  VaultBot/src/commands/economy/leaderboard.js
//  Prefix command - display top 10 richest members in the guild
// ─────────────────────────────────────────────────────────────

const { EmbedBuilder } = require("discord.js");
const db    = require("../../database/index");
const { t } = require("../../utils/i18n");

// ── Rank medals for top 3 ─────────────────────────────────────

const MEDALS = ["🥇", "🥈", "🥉"];

module.exports = {
  type: "prefix",
  id:   "leaderboard",

  /**
   * @param {import("discord.js").Message} message
   * @param {string[]} args
   * @param {object}   settings
   */
  async execute(message, args, settings) {
    const lang     = settings.language;
    const currency = `${settings.currency_emoji} ${settings.currency_name}`;
    const guildId  = message.guild.id;

    const rows = await db.getLeaderboard(guildId, 10);

    // ── Empty leaderboard ─────────────────────────────────────

    if (!rows || rows.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle(t(lang, "leaderboard.title"))
        .setColor(0xf5c518)
        .setDescription(t(lang, "leaderboard.empty"))
        .setFooter({ text: t(lang, "leaderboard.footer") })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // ── Build leaderboard rows ────────────────────────────────

    const lines = await Promise.all(
      rows.map(async (row, index) => {
        const medal  = MEDALS[index] || `**#${index + 1}**`;
        const user   = await message.client.users.fetch(row.user_id).catch(() => null);
        const name   = user ? user.username : `Unknown (${row.user_id})`;
        const amount = typeof row.balance === "number" ? row.balance : row.balance;

        return `${medal} **${name}** — ${amount} ${currency}`;
      })
    );

    const embed = new EmbedBuilder()
      .setTitle(t(lang, "leaderboard.title"))
      .setColor(0xf5c518)
      .setDescription(lines.join("\n"))
      .setFooter({ text: t(lang, "leaderboard.footer") })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
