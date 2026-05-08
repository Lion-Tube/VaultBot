// ─────────────────────────────────────────────────────────────
//  VaultBot/src/utils/logger.js
//  Terminal logging system with timestamps and colored levels
// ─────────────────────────────────────────────────────────────

const chalk = require("chalk");

// ── Helpers ──────────────────────────────────────────────────

function getTimestamp() {
  const now = new Date();
  const date = now.toLocaleDateString("en-GB"); // DD/MM/YYYY
  const time = now.toLocaleTimeString("en-GB"); // HH:MM:SS
  return `${date} ${time}`;
}

function formatTag(label, color) {
  return color(`[${label}]`);
}

// ── Log Levels ────────────────────────────────────────────────

const logger = {
  /**
   * General information
   * @param {string} message
   */
  info(message) {
    console.log(
      `${chalk.gray(getTimestamp())}  ${formatTag("INFO", chalk.cyan)}  ${message}`
    );
  },

  /**
   * Success messages
   * @param {string} message
   */
  success(message) {
    console.log(
      `${chalk.gray(getTimestamp())}  ${formatTag("OK", chalk.green)}    ${message}`
    );
  },

  /**
   * Warning messages
   * @param {string} message
   */
  warn(message) {
    console.warn(
      `${chalk.gray(getTimestamp())}  ${formatTag("WARN", chalk.yellow)}  ${message}`
    );
  },

  /**
   * Error messages
   * @param {string} message
   * @param {Error} [error]
   */
  error(message, error) {
    console.error(
      `${chalk.gray(getTimestamp())}  ${formatTag("ERR", chalk.red)}   ${message}`
    );
    if (error) console.error(chalk.red(error.stack || error));
  },

  /**
   * Database related logs
   * @param {string} message
   */
  db(message) {
    console.log(
      `${chalk.gray(getTimestamp())}  ${formatTag("DB", chalk.magenta)}    ${message}`
    );
  },

  /**
   * Command usage logs
   * @param {string} message
   */
  cmd(message) {
    console.log(
      `${chalk.gray(getTimestamp())}  ${formatTag("CMD", chalk.blue)}   ${message}`
    );
  },

  /**
   * Simple divider line for readability
   */
  divider() {
    console.log(chalk.gray("─".repeat(60)));
  },
};

module.exports = logger;
