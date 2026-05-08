// ─────────────────────────────────────────────────────────────
//  VaultBot/src/database/sqlite.js
//  SQLite database handler using better-sqlite3
// ─────────────────────────────────────────────────────────────

const Database = require("better-sqlite3");
const path = require("path");
const logger = require("../utils/logger");

const DB_PATH = path.join(__dirname, "../../vault.db");

let db;

// ── Connect ───────────────────────────────────────────────────

function connect() {
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  logger.db("SQLite connected → vault.db");
  createTables();
}

// ── Tables ────────────────────────────────────────────────────

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS guild_settings (
      guild_id              TEXT PRIMARY KEY,
      currency_name         TEXT    DEFAULT 'Coins',
      currency_emoji        TEXT    DEFAULT '🪙',
      daily_salary          INTEGER DEFAULT 50,
      balance_prefix        TEXT    DEFAULT 'balance',
      salary_prefix         TEXT    DEFAULT 'salary',
      leaderboard_prefix    TEXT    DEFAULT 'top',
      balance_channels      TEXT    DEFAULT '[]',
      salary_channels       TEXT    DEFAULT '[]',
      leaderboard_channels  TEXT    DEFAULT '[]',
      allowed_roles         TEXT    DEFAULT '[]',
      language              TEXT    DEFAULT 'ar'
    );

    CREATE TABLE IF NOT EXISTS user_economy (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id     TEXT    NOT NULL,
      user_id      TEXT    NOT NULL,
      balance      INTEGER DEFAULT 0,
      last_salary  INTEGER DEFAULT 0,
      UNIQUE(guild_id, user_id)
    );
  `);
  logger.db("Tables verified (guild_settings, user_economy)");
}

// ── Guild Settings ────────────────────────────────────────────

function getGuildSettings(guildId) {
  let row = db
    .prepare("SELECT * FROM guild_settings WHERE guild_id = ?")
    .get(guildId);

  if (!row) {
    db.prepare("INSERT OR IGNORE INTO guild_settings (guild_id) VALUES (?)").run(
      guildId
    );
    row = db
      .prepare("SELECT * FROM guild_settings WHERE guild_id = ?")
      .get(guildId);
  }

  // Parse JSON arrays
  row.balance_channels     = JSON.parse(row.balance_channels);
  row.salary_channels      = JSON.parse(row.salary_channels);
  row.leaderboard_channels = JSON.parse(row.leaderboard_channels);
  row.allowed_roles        = JSON.parse(row.allowed_roles);

  return row;
}

function updateGuildSetting(guildId, key, value) {
  const serialized =
    typeof value === "object" ? JSON.stringify(value) : value;

  db.prepare(
    `UPDATE guild_settings SET ${key} = ? WHERE guild_id = ?`
  ).run(serialized, guildId);
}

// ── User Economy ──────────────────────────────────────────────

function getUser(guildId, userId) {
  db.prepare(
    "INSERT OR IGNORE INTO user_economy (guild_id, user_id) VALUES (?, ?)"
  ).run(guildId, userId);

  return db
    .prepare("SELECT * FROM user_economy WHERE guild_id = ? AND user_id = ?")
    .get(guildId, userId);
}

function setBalance(guildId, userId, amount) {
  db.prepare(
    "UPDATE user_economy SET balance = ? WHERE guild_id = ? AND user_id = ?"
  ).run(amount, guildId, userId);
}

function addBalance(guildId, userId, amount) {
  const user = getUser(guildId, userId);
  setBalance(guildId, userId, user.balance + amount);
}

function removeBalance(guildId, userId, amount) {
  const user = getUser(guildId, userId);
  const newBalance = Math.max(0, user.balance - amount);
  setBalance(guildId, userId, newBalance);
}

function setLastSalary(guildId, userId, timestamp) {
  db.prepare(
    "UPDATE user_economy SET last_salary = ? WHERE guild_id = ? AND user_id = ?"
  ).run(timestamp, guildId, userId);
}

function getLeaderboard(guildId, limit = 10) {
  return db
    .prepare(
      `SELECT user_id, balance FROM user_economy
       WHERE guild_id = ?
       ORDER BY balance DESC
       LIMIT ?`
    )
    .all(guildId, limit);
}

// ── Export ────────────────────────────────────────────────────

module.exports = {
  connect,
  getGuildSettings,
  updateGuildSetting,
  getUser,
  setBalance,
  addBalance,
  removeBalance,
  setLastSalary,
  getLeaderboard,
};
