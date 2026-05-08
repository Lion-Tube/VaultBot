// ─────────────────────────────────────────────────────────────
//  VaultBot/deploy-commands.js
//  Registers slash commands to the guild defined in .env
//  Deletes all old commands first, then registers new ones
//  Run with: npm run deploy
// ─────────────────────────────────────────────────────────────

require("dotenv").config();

const { REST, Routes } = require("discord.js");
const fs               = require("fs");
const path             = require("path");
const logger           = require("./src/utils/logger");

const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

// ── Validate environment variables ───────────────────────────

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  logger.error("Missing TOKEN, CLIENT_ID, or GUILD_ID in .env");
  process.exit(1);
}

// ── Collect all slash command data ────────────────────────────

const commands = [];

const slashDirs = [
  path.join(__dirname, "src/commands/economy"),
  path.join(__dirname, "src/commands/admin"),
];

for (const dir of slashDirs) {
  fs.readdirSync(dir)
    .filter((f) => f.endsWith(".js"))
    .forEach((file) => {
      const command = require(path.join(dir, file));
      if (command.type === "slash" && command.data) {
        commands.push(command.data.toJSON());
        logger.info(`Queued slash command → /${command.data.name}`);
      }
    });
}

// ── Deploy to Discord ─────────────────────────────────────────

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function deploy() {
  logger.divider();
  logger.info(`Deploying ${commands.length} slash command(s) to guild: ${GUILD_ID}`);

  try {
    // Delete all existing guild commands first
    logger.info("Clearing old slash commands...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: [],
    });
    logger.success("Old commands cleared.");

    // Register new commands
    logger.info("Registering new slash commands...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    logger.success(`Successfully registered ${commands.length} slash command(s).`);
  } catch (err) {
    logger.error("Failed to deploy slash commands.", err);
    process.exit(1);
  }

  logger.divider();
}

deploy();
