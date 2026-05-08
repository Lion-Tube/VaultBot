// ─────────────────────────────────────────────────────────────
//  VaultBot/src/database/index.js
//  Database entry point - selects SQLite or MongoDB based on DB_TYPE
// ─────────────────────────────────────────────────────────────

const logger = require("../utils/logger");

const DB_TYPE = (process.env.DB_TYPE || "sqlite").toLowerCase();

let db;

if (DB_TYPE === "mongodb") {
  db = require("./mongodb");
  logger.db("Database driver selected → MongoDB");
} else if (DB_TYPE === "sqlite") {
  db = require("./sqlite");
  logger.db("Database driver selected → SQLite");
} else {
  logger.error(`Unknown DB_TYPE: "${DB_TYPE}" — must be "sqlite" or "mongodb"`);
  process.exit(1);
}

module.exports = db;
