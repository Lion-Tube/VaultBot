// ─────────────────────────────────────────────────────────────
//  VaultBot/src/events/ready.js
//  Fires once when the bot successfully connects to Discord
// ─────────────────────────────────────────────────────────────

const logger = require("../utils/logger");

module.exports = {
  name: "ready",
  once: true,

  execute(client) {
    logger.divider();
    logger.success(`VaultBot is online! Logged in as ${client.user.tag}`);
    logger.info(`Serving ${client.guilds.cache.size} guild(s)`);
    logger.info(`Prefix commands: ${client.prefixCommands.size}`);
    logger.info(`Slash commands : ${client.slashCommands.size}`);
    logger.divider();
  },
};
