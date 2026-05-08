// ─────────────────────────────────────────────────────────────
//  VaultBot/src/utils/i18n.js
//  Language system - loads locale files and resolves strings
// ─────────────────────────────────────────────────────────────

const fs     = require("fs");
const path   = require("path");
const logger = require("./logger");

const LOCALES_DIR  = path.join(__dirname, "../locales");
const DEFAULT_LANG = "en";

// ── Load all locale files on startup ─────────────────────────

const locales = {};

fs.readdirSync(LOCALES_DIR).forEach((file) => {
  if (!file.endsWith(".json")) return;
  const lang = path.basename(file, ".json");
  try {
    locales[lang] = JSON.parse(
      fs.readFileSync(path.join(LOCALES_DIR, file), "utf-8")
    );
    logger.info(`Locale loaded → ${lang}`);
  } catch (err) {
    logger.error(`Failed to load locale: ${file}`, err);
  }
});

// ── Resolve nested key (e.g. "balance.title") ────────────────

function resolve(obj, key) {
  return key.split(".").reduce((acc, part) => {
    return acc && acc[part] !== undefined ? acc[part] : null;
  }, obj);
}

// ── Replace placeholders {key} with values ───────────────────

function interpolate(str, vars = {}) {
  if (!str) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => {
    return vars[key] !== undefined ? vars[key] : `{${key}}`;
  });
}

// ── Main translate function ───────────────────────────────────

/**
 * Get a translated string for a guild's language
 * @param {string} lang    - Language code (e.g. "ar", "en")
 * @param {string} key     - Dot-notation key (e.g. "balance.title")
 * @param {object} vars    - Placeholder values (e.g. { user: "Ahmed" })
 * @returns {string}
 */
function t(lang, key, vars = {}) {
  const locale = locales[lang] || locales[DEFAULT_LANG];

  if (!locale) {
    logger.warn(`No locale found for language: ${lang}`);
    return key;
  }

  const value = resolve(locale, key);

  if (value === null) {
    // Fallback to default language
    const fallback = resolve(locales[DEFAULT_LANG], key);
    if (fallback === null) {
      logger.warn(`Missing translation key: "${key}" in "${lang}"`);
      return key;
    }
    return interpolate(fallback, vars);
  }

  return interpolate(value, vars);
}

// ── Get available languages ───────────────────────────────────

function getAvailableLanguages() {
  return Object.keys(locales);
}

// ── Check if language exists ──────────────────────────────────

function isValidLanguage(lang) {
  return lang in locales;
}

module.exports = { t, getAvailableLanguages, isValidLanguage };
