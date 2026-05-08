// ─────────────────────────────────────────────────────────────
//  VaultBot/index.js
//  Main entry point - initializes the bot, database, and events
// ─────────────────────────────────────────────────────────────

require("dotenv").config();

const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs     = require("fs");
const path   = require("path");
const logger = require("./src/utils/logger");
const db     = require("./src/database/index");

// ── Validate environment variables ───────────────────────────

const REQUIRED_ENV = ["TOKEN", "CLIENT_ID", "GUILD_ID", "DB_TYPE"];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    logger.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

if (process.env.DB_TYPE === "mongodb" && !process.env.MONGODB_URI) {
  logger.error("DB_TYPE is set to mongodb but MONGODB_URI is missing.");
  process.exit(1);
}

// ── Create Discord client ─────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// ── Attach collections to client ──────────────────────────────

client.prefixCommands = new Collection(); // { id: command }
client.slashCommands  = new Collection(); // { name: command }

// ── Load prefix commands ──────────────────────────────────────

const prefixDir = path.join(__dirname, "src/commands/economy");

fs.readdirSync(prefixDir)
  .filter((f) => f.endsWith(".js"))
  .forEach((file) => {
    const command = require(path.join(prefixDir, file));
    if (command.type === "prefix" && command.id) {
      client.prefixCommands.set(command.id, command);
      logger.info(`Prefix command loaded → ${command.id} (${file})`);
    }
  });

// ── Load slash commands ───────────────────────────────────────

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
        client.slashCommands.set(command.data.name, command);
        logger.info(`Slash command loaded → /${command.data.name} (${file})`);
      }
    });
}

// ── Load events ───────────────────────────────────────────────

const eventsDir = path.join(__dirname, "src/events");

fs.readdirSync(eventsDir)
  .filter((f) => f.endsWith(".js"))
  .forEach((file) => {
    const event = require(path.join(eventsDir, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    logger.info(`Event loaded → ${event.name} (${file})`);
  });

// ── Connect database then login ───────────────────────────────

async function start() {
  logger.divider();
  logger.info("Starting VaultBot...");

  try {
    await db.connect();
  } catch (err) {
    logger.error("Failed to connect to database.", err);
    process.exit(1);
  }

  try {
    await client.login(process.env.TOKEN);
  } catch (err) {
    logger.error("Failed to login to Discord.", err);
    process.exit(1);
  }
}

start();

// ── Handle uncaught errors ────────────────────────────────────

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled promise rejection:", err);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception:", err);
});
