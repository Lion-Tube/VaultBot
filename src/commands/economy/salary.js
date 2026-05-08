// ─────────────────────────────────────────────────────────────
//  VaultBot/src/commands/economy/salary.js
//  Prefix command - claim daily salary with cooldown
// ─────────────────────────────────────────────────────────────

const { EmbedBuilder } = require("discord.js");
const db    = require("../../database/index");
const { t } = require("../../utils/i18n");

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── Helper: format remaining time ────────────────────────────

function formatTimeLeft(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours        = Math.floor(totalSeconds / 3600);
  const minutes      = Math.floor((totalSeconds % 3600) / 60);
  const seconds      = totalSeconds % 60;

  const parts = [];
  if (hours)   parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds) parts.push(`${seconds}s`);

  return parts.join(" ");
}

module.exports = {
  type: "prefix",
  id:   "salary",

  /**
   * @param {import("discord.js").Message} message
   * @param {string[]} args
   * @param {object}   settings
   */
  async execute(message, args, settings) {
    const lang     = settings.language;
    const currency = `${settings.currency_emoji} ${settings.currency_name}`;
    const guildId  = message.guild.id;
    const userId   = message.author.id;
    const now      = Date.now();

    const userData = await db.getUser(guildId, userId);

    // ── Cooldown check ────────────────────────────────────────

    const elapsed  = now - (userData.last_salary || 0);
    const timeLeft = COOLDOWN_MS - elapsed;

    if (timeLeft > 0) {
      return message.reply(
        t(lang, "salary.cooldown", { time: formatTimeLeft(timeLeft) })
      );
    }

    // ── Grant salary ──────────────────────────────────────────

    const salaryAmount = settings.daily_salary;

    await db.addBalance(guildId, userId, salaryAmount);
    await db.setLastSalary(guildId, userId, now);

    const updatedUser = await db.getUser(guildId, userId);

    const embed = new EmbedBuilder()
      .setTitle(t(lang, "salary.title"))
      .setColor(0xf5c518)
      .setDescription(t(lang, "salary.received"))
      .addFields(
        {
          name:   t(lang, "salary.amount"),
          value:  `**+${salaryAmount}** ${currency}`,
          inline: true,
        },
        {
          name:   t(lang, "salary.new_balance"),
          value:  `**${updatedUser.balance}** ${currency}`,
          inline: true,
        }
      )
      .setThumbnail(message.author.displayAvatarURL())
      .setFooter({ text: t(lang, "salary.footer") })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
