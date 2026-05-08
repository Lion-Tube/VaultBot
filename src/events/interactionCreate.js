// ─────────────────────────────────────────────────────────────
//  VaultBot/src/events/interactionCreate.js
//  Handles slash commands, buttons, and select menus interactions
// ─────────────────────────────────────────────────────────────

const logger = require("../utils/logger");
const db     = require("../database/index");
const { t }  = require("../utils/i18n");

module.exports = {
  name: "interactionCreate",
  once: false,

  async execute(interaction, client) {
    const guildId  = interaction.guildId;
    const settings = await db.getGuildSettings(guildId);
    const lang     = settings.language;

    // ── Slash Commands ────────────────────────────────────────

    if (interaction.isChatInputCommand()) {
      const command = client.slashCommands.get(interaction.commandName);

      if (!command) {
        logger.warn(`Unknown slash command received: /${interaction.commandName}`);
        return;
      }

      try {
        logger.cmd(
          `[SLASH] ${interaction.user.tag} → /${interaction.commandName} | guild: ${interaction.guild.name}`
        );
        await command.execute(interaction, settings, client);
      } catch (err) {
        logger.error(`Error in slash command "/${interaction.commandName}":`, err);

        const reply = { content: t(lang, "general.unknown_error"), ephemeral: true };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply).catch(() => {});
        } else {
          await interaction.reply(reply).catch(() => {});
        }
      }

      return;
    }

    // ── Buttons ───────────────────────────────────────────────

    if (interaction.isButton()) {
      // Settings buttons are handled inside the settings command
      // via collectors — so we only need to catch unhandled ones here
      const settingsCommand = client.slashCommands.get("settings");
      if (settingsCommand?.handleButton) {
        try {
          await settingsCommand.handleButton(interaction, settings, client);
        } catch (err) {
          logger.error("Error in button interaction:", err);
          await interaction.reply({
            content: t(lang, "general.unknown_error"),
            ephemeral: true,
          }).catch(() => {});
        }
      }
      return;
    }

    // ── Select Menus ──────────────────────────────────────────

    if (interaction.isStringSelectMenu()) {
      const settingsCommand = client.slashCommands.get("settings");
      if (settingsCommand?.handleSelect) {
        try {
          await settingsCommand.handleSelect(interaction, settings, client);
        } catch (err) {
          logger.error("Error in select menu interaction:", err);
          await interaction.reply({
            content: t(lang, "general.unknown_error"),
            ephemeral: true,
          }).catch(() => {});
        }
      }
      return;
    }
  },
};
