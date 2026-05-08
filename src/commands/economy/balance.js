// ─────────────────────────────────────────────────────────────
//  VaultBot/src/commands/economy/balance.js
//  Prefix command - show own balance, another user's balance,
//  or transfer funds depending on arguments provided
// ─────────────────────────────────────────────────────────────

const { EmbedBuilder } = require("discord.js");
const db  = require("../../database/index");
const { t } = require("../../utils/i18n");

module.exports = {
  type: "prefix",
  id:   "balance",

  /**
   * @param {import("discord.js").Message} message
   * @param {string[]} args
   * @param {object}   settings
   */
  async execute(message, args, settings) {
    const lang     = settings.language;
    const currency = `${settings.currency_emoji} ${settings.currency_name}`;
    const guildId  = message.guild.id;

    // ── No args → show own balance ────────────────────────────

    if (args.length === 0) {
      const user = await db.getUser(guildId, message.author.id);

      const embed = new EmbedBuilder()
        .setTitle(t(lang, "balance.title"))
        .setColor(0xf5c518)
        .addFields({
          name:  t(lang, "balance.own"),
          value: `**${user.balance}** ${currency}`,
        })
        .setThumbnail(message.author.displayAvatarURL())
        .setFooter({ text: t(lang, "balance.footer") })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // ── Resolve target user from mention or ID ────────────────

    const rawTarget =
      message.mentions.users.first() ||
      (await message.guild.members.fetch(args[0]).catch(() => null))?.user;

    if (!rawTarget) {
      return message.reply(t(lang, "general.user_not_found"));
    }

    if (rawTarget.bot) {
      return message.reply(t(lang, "general.bot_target"));
    }

    // ── One arg (mention/ID only) → show that user's balance ──

    if (args.length === 1) {
      const targetData = await db.getUser(guildId, rawTarget.id);

      const embed = new EmbedBuilder()
        .setTitle(t(lang, "balance.title"))
        .setColor(0xf5c518)
        .addFields({
          name:  t(lang, "balance.other", { user: rawTarget.username }),
          value: `**${targetData.balance}** ${currency}`,
        })
        .setThumbnail(rawTarget.displayAvatarURL())
        .setFooter({ text: t(lang, "balance.footer") })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // ── Two args (mention/ID + amount) → transfer ─────────────

    if (args.length >= 2) {
      // Self-transfer check
      if (rawTarget.id === message.author.id) {
        return message.reply(t(lang, "general.self_target"));
      }

      const amount = parseInt(args[1], 10);

      if (isNaN(amount) || amount <= 0) {
        return message.reply(t(lang, "general.invalid_amount"));
      }

      const senderData = await db.getUser(guildId, message.author.id);

      if (senderData.balance < amount) {
        return message.reply(
          t(lang, "transfer.insufficient", {
            balance:  senderData.balance,
            currency: `${settings.currency_emoji} ${settings.currency_name}`,
          })
        );
      }

      // Perform transfer
      await db.removeBalance(guildId, message.author.id, amount);
      await db.addBalance(guildId, rawTarget.id, amount);

      const embed = new EmbedBuilder()
        .setTitle(t(lang, "transfer.title"))
        .setColor(0x57f287)
        .addFields(
          { name: t(lang, "transfer.from"),   value: `<@${message.author.id}>`, inline: true },
          { name: t(lang, "transfer.to"),     value: `<@${rawTarget.id}>`,      inline: true },
          { name: t(lang, "transfer.amount"), value: `**${amount}** ${currency}`, inline: true }
        )
        .setFooter({ text: t(lang, "transfer.footer") })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
};
