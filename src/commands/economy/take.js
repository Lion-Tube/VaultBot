// ─────────────────────────────────────────────────────────────
//  VaultBot/src/commands/economy/take.js
//  Slash command - remove currency from a user (admin/allowed roles)
// ─────────────────────────────────────────────────────────────

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const db    = require("../../database/index");
const { t } = require("../../utils/i18n");

module.exports = {
  type: "slash",

  data: new SlashCommandBuilder()
    .setName("take")
    .setDescription("Remove currency from a user")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("Target user").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt.setName("amount").setDescription("Amount to take").setMinValue(1).setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {object} settings
   */
  async execute(interaction, settings) {
    const lang    = settings.language;
    const guildId = interaction.guildId;

    // ── Permission check: admin or allowed roles ──────────────

    const member       = interaction.member;
    const allowedRoles = settings.allowed_roles || [];
    const isAdmin      = member.permissions.has(PermissionFlagsBits.Administrator);
    const hasRole      = allowedRoles.some((roleId) => member.roles.cache.has(roleId));

    if (!isAdmin && !hasRole) {
      return interaction.reply({
        content:   t(lang, "general.no_permission"),
        ephemeral: true,
      });
    }

    // ── Validate target ───────────────────────────────────────

    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    if (target.bot) {
      return interaction.reply({
        content:   t(lang, "general.bot_target"),
        ephemeral: true,
      });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({
        content:   t(lang, "general.self_target"),
        ephemeral: true,
      });
    }

    // ── Check target has enough balance ───────────────────────

    const targetData = await db.getUser(guildId, target.id);

    if (targetData.balance < amount) {
      return interaction.reply({
        content:   t(lang, "take.no_balance"),
        ephemeral: true,
      });
    }

    // ── Remove balance ────────────────────────────────────────

    await db.removeBalance(guildId, target.id, amount);

    const currency = `${settings.currency_emoji} ${settings.currency_name}`;

    const embed = new EmbedBuilder()
      .setTitle(t(lang, "take.title"))
      .setColor(0xed4245)
      .setDescription(
        t(lang, "take.success", {
          amount,
          currency: `${settings.currency_emoji} ${settings.currency_name}`,
          user:     `<@${target.id}>`,
        })
      )
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: t(lang, "take.footer") })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
