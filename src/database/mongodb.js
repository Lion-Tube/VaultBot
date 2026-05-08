// ─────────────────────────────────────────────────────────────
//  VaultBot/src/database/mongodb.js
//  MongoDB database handler using mongoose
// ─────────────────────────────────────────────────────────────

const mongoose = require("mongoose");
const logger = require("../utils/logger");

// ── Schemas ───────────────────────────────────────────────────

const guildSettingsSchema = new mongoose.Schema({
  guild_id:             { type: String, required: true, unique: true },
  currency_name:        { type: String, default: "Coins" },
  currency_emoji:       { type: String, default: "🪙" },
  daily_salary:         { type: Number, default: 50 },
  balance_prefix:       { type: String, default: "balance" },
  salary_prefix:        { type: String, default: "salary" },
  leaderboard_prefix:   { type: String, default: "top" },
  balance_channels:     { type: [String], default: [] },
  salary_channels:      { type: [String], default: [] },
  leaderboard_channels: { type: [String], default: [] },
  allowed_roles:        { type: [String], default: [] },
  language:             { type: String, default: "ar" },
});

const userEconomySchema = new mongoose.Schema({
  guild_id:    { type: String, required: true },
  user_id:     { type: String, required: true },
  balance:     { type: Number, default: 0 },
  last_salary: { type: Number, default: 0 },
});

userEconomySchema.index({ guild_id: 1, user_id: 1 }, { unique: true });

const GuildSettings = mongoose.model("GuildSettings", guildSettingsSchema);
const UserEconomy   = mongoose.model("UserEconomy", userEconomySchema);

// ── Connect ───────────────────────────────────────────────────

async function connect() {
  await mongoose.connect(process.env.MONGODB_URI);
  logger.db("MongoDB connected → " + process.env.MONGODB_URI);
}

// ── Guild Settings ────────────────────────────────────────────

async function getGuildSettings(guildId) {
  let doc = await GuildSettings.findOne({ guild_id: guildId });
  if (!doc) {
    doc = await GuildSettings.create({ guild_id: guildId });
  }
  return doc;
}

async function updateGuildSetting(guildId, key, value) {
  await GuildSettings.updateOne(
    { guild_id: guildId },
    { $set: { [key]: value } },
    { upsert: true }
  );
}

// ── User Economy ──────────────────────────────────────────────

async function getUser(guildId, userId) {
  let doc = await UserEconomy.findOne({ guild_id: guildId, user_id: userId });
  if (!doc) {
    doc = await UserEconomy.create({ guild_id: guildId, user_id: userId });
  }
  return doc;
}

async function setBalance(guildId, userId, amount) {
  await UserEconomy.updateOne(
    { guild_id: guildId, user_id: userId },
    { $set: { balance: amount } },
    { upsert: true }
  );
}

async function addBalance(guildId, userId, amount) {
  await UserEconomy.updateOne(
    { guild_id: guildId, user_id: userId },
    { $inc: { balance: amount } },
    { upsert: true }
  );
}

async function removeBalance(guildId, userId, amount) {
  const user = await getUser(guildId, userId);
  const newBalance = Math.max(0, user.balance - amount);
  await setBalance(guildId, userId, newBalance);
}

async function setLastSalary(guildId, userId, timestamp) {
  await UserEconomy.updateOne(
    { guild_id: guildId, user_id: userId },
    { $set: { last_salary: timestamp } },
    { upsert: true }
  );
}

async function getLeaderboard(guildId, limit = 10) {
  return await UserEconomy.find({ guild_id: guildId })
    .sort({ balance: -1 })
    .limit(limit)
    .select("user_id balance");
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
