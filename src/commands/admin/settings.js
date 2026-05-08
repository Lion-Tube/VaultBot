// ─────────────────────────────────────────────────────────────
//  VaultBot/src/commands/admin/settings.js
//  Slash command - full admin settings panel with menus and buttons
//  Session expires after 3 minutes of inactivity
// ─────────────────────────────────────────────────────────────

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
  ComponentType,
} = require("discord.js");

const db                                         = require("../../database/index");
const { t, getAvailableLanguages, isValidLanguage } = require("../../utils/i18n");
const logger                                     = require("../../utils/logger");

const TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

// ─────────────────────────────────────────────────────────────
//  BUTTON / SELECT ID CONSTANTS
// ─────────────────────────────────────────────────────────────

const BTN = {
  // Main menu navigation
  CURRENCY:    "vs_currency",
  SALARY:      "vs_salary",
  CHANNELS:    "vs_channels",
  ROLES:       "vs_roles",
  LANGUAGE:    "vs_language",
  PREFIX:      "vs_prefix",
  BACK:        "vs_back",

  // Currency sub-menu
  CURRENCY_NAME:  "vs_currency_name",
  CURRENCY_EMOJI: "vs_currency_emoji",

  // Salary sub-menu
  SALARY_CHANGE: "vs_salary_change",

  // Channels sub-menu (type selection)
  CH_BALANCE:     "vs_ch_balance",
  CH_SALARY:      "vs_ch_salary",
  CH_LEADERBOARD: "vs_ch_leaderboard",

  // Channels sub-menu (actions)
  CH_ADD:    "vs_ch_add",
  CH_REMOVE: "vs_ch_remove",
  CH_CLEAR:  "vs_ch_clear",
  CH_BACK:   "vs_ch_back",

  // Roles sub-menu
  ROLE_ADD:    "vs_role_add",
  ROLE_REMOVE: "vs_role_remove",
  ROLE_CLEAR:  "vs_role_clear",

  // Prefix sub-menu
  PFX_BALANCE:     "vs_pfx_balance",
  PFX_SALARY:      "vs_pfx_salary",
  PFX_LEADERBOARD: "vs_pfx_leaderboard",

  // Language select menu
  LANG_SELECT: "vs_lang_select",
};

// ─────────────────────────────────────────────────────────────
//  EMBED BUILDERS
// ─────────────────────────────────────────────────────────────

function buildMainEmbed(lang, settings) {
  return new EmbedBuilder()
    .setTitle(t(lang, "settings.title"))
    .setColor(0x5865f2)
    .setDescription(t(lang, "settings.description"))
    .addFields(
      { name: t(lang, "settings.menu.currency"), value: `${settings.currency_emoji} ${settings.currency_name}`, inline: true },
      { name: t(lang, "settings.menu.salary"),   value: `${settings.daily_salary}`,                             inline: true },
      { name: t(lang, "settings.menu.language"), value: settings.language.toUpperCase(),                        inline: true }
    )
    .setFooter({ text: t(lang, "settings.footer") })
    .setTimestamp();
}

function buildCurrencyEmbed(lang, settings) {
  return new EmbedBuilder()
    .setTitle(t(lang, "settings.currency.title"))
    .setColor(0xf5c518)
    .addFields(
      { name: t(lang, "settings.currency.name_label"),  value: settings.currency_name,  inline: true },
      { name: t(lang, "settings.currency.emoji_label"), value: settings.currency_emoji, inline: true }
    )
    .setFooter({ text: t(lang, "settings.footer") })
    .setTimestamp();
}

function buildSalaryEmbed(lang, settings) {
  return new EmbedBuilder()
    .setTitle(t(lang, "settings.salary.title"))
    .setColor(0xf5c518)
    .addFields({
      name:  t(lang, "settings.salary.current"),
      value: `**${settings.daily_salary}**`,
    })
    .setFooter({ text: t(lang, "settings.footer") })
    .setTimestamp();
}

function buildChannelsMenuEmbed(lang) {
  return new EmbedBuilder()
    .setTitle(t(lang, "settings.channels.title"))
    .setColor(0xf5c518)
    .setDescription(t(lang, "settings.channels.description"))
    .setFooter({ text: t(lang, "settings.footer") })
    .setTimestamp();
}

function buildChannelsEditEmbed(lang, settings, type) {
  const key      = `${type}_channels`;
  const channels = settings[key] || [];
  const value    = channels.length > 0
    ? channels.map((id) => `<#${id}>`).join(", ")
    : t(lang, "settings.channels.all_allowed");

  const titleSuffix = {
    balance:     t(lang, "settings.channels.balance_btn"),
    salary:      t(lang, "settings.channels.salary_btn"),
    leaderboard: t(lang, "settings.channels.leaderboard_btn"),
  }[type];

  return new EmbedBuilder()
    .setTitle(`${t(lang, "settings.channels.title")} — ${titleSuffix}`)
    .setColor(0xf5c518)
    .addFields({ name: t(lang, "settings.channels.current"), value })
    .setFooter({ text: t(lang, "settings.footer") })
    .setTimestamp();
}

function buildRolesEmbed(lang, settings) {
  const roles = settings.allowed_roles || [];
  const value = roles.length > 0
    ? roles.map((id) => `<@&${id}>`).join(", ")
    : t(lang, "settings.roles.no_roles");

  return new EmbedBuilder()
    .setTitle(t(lang, "settings.roles.title"))
    .setColor(0xf5c518)
    .setDescription(t(lang, "settings.roles.description"))
    .addFields({ name: t(lang, "settings.roles.current"), value })
    .setFooter({ text: t(lang, "settings.footer") })
    .setTimestamp();
}

function buildLanguageEmbed(lang, settings) {
  return new EmbedBuilder()
    .setTitle(t(lang, "settings.language.title"))
    .setColor(0xf5c518)
    .addFields({
      name:  t(lang, "settings.language.current"),
      value: settings.language.toUpperCase(),
    })
    .setFooter({ text: t(lang, "settings.footer") })
    .setTimestamp();
}

function buildPrefixEmbed(lang, settings) {
  return new EmbedBuilder()
    .setTitle(t(lang, "settings.prefix.title"))
    .setColor(0xf5c518)
    .setDescription(t(lang, "settings.prefix.description"))
    .addFields(
      { name: t(lang, "settings.prefix.balance_btn"),     value: `\`${settings.balance_prefix}\``,     inline: true },
      { name: t(lang, "settings.prefix.salary_btn"),      value: `\`${settings.salary_prefix}\``,      inline: true },
      { name: t(lang, "settings.prefix.leaderboard_btn"), value: `\`${settings.leaderboard_prefix}\``, inline: true }
    )
    .setFooter({ text: t(lang, "settings.footer") })
    .setTimestamp();
}

// ─────────────────────────────────────────────────────────────
//  ACTION ROW BUILDERS
// ─────────────────────────────────────────────────────────────

function backBtn(lang) {
  return new ButtonBuilder()
    .setCustomId(BTN.BACK)
    .setLabel(t(lang, "settings.back"))
    .setStyle(ButtonStyle.Secondary);
}

function buildMainRows(lang) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(BTN.CURRENCY).setLabel(t(lang, "settings.menu.currency")).setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(BTN.SALARY).setLabel(t(lang, "settings.menu.salary")).setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(BTN.CHANNELS).setLabel(t(lang, "settings.menu.channels")).setStyle(ButtonStyle.Primary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(BTN.ROLES).setLabel(t(lang, "settings.menu.roles")).setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(BTN.LANGUAGE).setLabel(t(lang, "settings.menu.language")).setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(BTN.PREFIX).setLabel(t(lang, "settings.menu.prefix")).setStyle(ButtonStyle.Primary)
    ),
  ];
}

function buildCurrencyRows(lang) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(BTN.CURRENCY_NAME).setLabel(t(lang, "settings.currency.name_btn")).setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(BTN.CURRENCY_EMOJI).setLabel(t(lang, "settings.currency.emoji_btn")).setStyle(ButtonStyle.Success),
    backBtn(lang)
  )];
}

function buildSalaryRows(lang) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(BTN.SALARY_CHANGE).setLabel(t(lang, "settings.salary.btn")).setStyle(ButtonStyle.Success),
    backBtn(lang)
  )];
}

function buildChannelsMenuRows(lang) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(BTN.CH_BALANCE).setLabel(t(lang, "settings.channels.balance_btn")).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(BTN.CH_SALARY).setLabel(t(lang, "settings.channels.salary_btn")).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(BTN.CH_LEADERBOARD).setLabel(t(lang, "settings.channels.leaderboard_btn")).setStyle(ButtonStyle.Primary),
    backBtn(lang)
  )];
}

function buildChannelsEditRows(lang) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(BTN.CH_ADD).setLabel(t(lang, "settings.channels.add_btn")).setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(BTN.CH_REMOVE).setLabel(t(lang, "settings.channels.remove_btn")).setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(BTN.CH_CLEAR).setLabel(t(lang, "settings.channels.clear_btn")).setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(BTN.CH_BACK).setLabel(t(lang, "settings.back")).setStyle(ButtonStyle.Secondary)
  )];
}

function buildRolesRows(lang) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(BTN.ROLE_ADD).setLabel(t(lang, "settings.roles.add_btn")).setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(BTN.ROLE_REMOVE).setLabel(t(lang, "settings.roles.remove_btn")).setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(BTN.ROLE_CLEAR).setLabel(t(lang, "settings.roles.clear_btn")).setStyle(ButtonStyle.Danger),
    backBtn(lang)
  )];
}

function buildLanguageRows(lang) {
  const options = getAvailableLanguages().map((l) => ({
    label: l.toUpperCase(),
    value: l,
  }));
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(BTN.LANG_SELECT)
        .setPlaceholder(t(lang, "settings.language.select"))
        .addOptions(options)
    ),
    new ActionRowBuilder().addComponents(backBtn(lang)),
  ];
}

function buildPrefixRows(lang) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(BTN.PFX_BALANCE).setLabel(t(lang, "settings.prefix.balance_btn")).setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(BTN.PFX_SALARY).setLabel(t(lang, "settings.prefix.salary_btn")).setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(BTN.PFX_LEADERBOARD).setLabel(t(lang, "settings.prefix.leaderboard_btn")).setStyle(ButtonStyle.Success),
    backBtn(lang)
  )];
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

// Waits for one text message from the user in the channel, then deletes it
async function awaitTextInput(interaction, promptText) {
  await interaction.followUp({ content: promptText, ephemeral: true });

  const collected = await interaction.channel
    .awaitMessages({
      filter: (m) => m.author.id === interaction.user.id,
      max:    1,
      time:   30_000,
      errors: ["time"],
    })
    .catch(() => null);

  if (!collected || collected.size === 0) return null;

  const msg = collected.first();
  await msg.delete().catch(() => {});
  return msg.content.trim();
}

// Disables all buttons and selects when the session expires
function disableAllComponents(rows) {
  return rows.map((row) => {
    const newRow = ActionRowBuilder.from(row);
    newRow.components = row.components.map((c) => {
      if (c.data.type === ComponentType.Button)       return ButtonBuilder.from(c).setDisabled(true);
      if (c.data.type === ComponentType.StringSelect) return StringSelectMenuBuilder.from(c).setDisabled(true);
      return c;
    });
    return newRow;
  });
}

// ─────────────────────────────────────────────────────────────
//  COMMAND EXPORT
// ─────────────────────────────────────────────────────────────

module.exports = {
  type: "slash",

  data: new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Open VaultBot settings panel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, settings) {
    const guildId = interaction.guildId;
    let lang      = settings.language;

    // Tracks which page and sub-page we are on
    let currentRows    = buildMainRows(lang);
    let currentSubPage = null; // "balance" | "salary" | "leaderboard" for channels

    // ── Send initial main menu ────────────────────────────────

    const reply = await interaction.reply({
      embeds:     [buildMainEmbed(lang, settings)],
      components: currentRows,
      ephemeral:  true,
      fetchReply: true,
    });

    // ── Collector: listens to buttons and selects ─────────────

    const collector = reply.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time:   TIMEOUT_MS,
    });

    // Refreshes settings from DB (needed after every save)
    async function refreshSettings() {
      settings = await db.getGuildSettings(guildId);
      lang     = settings.language;
    }

    // Navigates back to the main menu
    async function goMain(i) {
      await refreshSettings();
      currentSubPage = null;
      currentRows    = buildMainRows(lang);
      await i.update({
        embeds:     [buildMainEmbed(lang, settings)],
        components: currentRows,
      });
    }

    // ─────────────────────────────────────────────────────────
    //  COLLECTOR HANDLER
    // ─────────────────────────────────────────────────────────

    collector.on("collect", async (i) => {
      const id = i.customId;

      // ── Navigation: main menu buttons ────────────────────────

      if (id === BTN.BACK)    return goMain(i);
      if (id === BTN.CH_BACK) {
        currentSubPage = null;
        currentRows    = buildChannelsMenuRows(lang);
        return i.update({ embeds: [buildChannelsMenuEmbed(lang)], components: currentRows });
      }

      if (id === BTN.CURRENCY) {
        currentRows = buildCurrencyRows(lang);
        return i.update({ embeds: [buildCurrencyEmbed(lang, settings)], components: currentRows });
      }

      if (id === BTN.SALARY) {
        currentRows = buildSalaryRows(lang);
        return i.update({ embeds: [buildSalaryEmbed(lang, settings)], components: currentRows });
      }

      if (id === BTN.CHANNELS) {
        currentRows = buildChannelsMenuRows(lang);
        return i.update({ embeds: [buildChannelsMenuEmbed(lang)], components: currentRows });
      }

      if (id === BTN.ROLES) {
        currentRows = buildRolesRows(lang);
        return i.update({ embeds: [buildRolesEmbed(lang, settings)], components: currentRows });
      }

      if (id === BTN.LANGUAGE) {
        currentRows = buildLanguageRows(lang);
        return i.update({ embeds: [buildLanguageEmbed(lang, settings)], components: currentRows });
      }

      if (id === BTN.PREFIX) {
        currentRows = buildPrefixRows(lang);
        return i.update({ embeds: [buildPrefixEmbed(lang, settings)], components: currentRows });
      }

      // ── Channels: type selection ──────────────────────────────

      const chTypeMap = {
        [BTN.CH_BALANCE]:     "balance",
        [BTN.CH_SALARY]:      "salary",
        [BTN.CH_LEADERBOARD]: "leaderboard",
      };

      if (chTypeMap[id]) {
        currentSubPage = chTypeMap[id];
        currentRows    = buildChannelsEditRows(lang);
        return i.update({
          embeds:     [buildChannelsEditEmbed(lang, settings, currentSubPage)],
          components: currentRows,
        });
      }

      // ── Currency: change name ─────────────────────────────────

      if (id === BTN.CURRENCY_NAME) {
        await i.deferUpdate();
        const input = await awaitTextInput(i, t(lang, "settings.currency.send_name"));
        if (!input) return;
        await db.updateGuildSetting(guildId, "currency_name", input);
        await refreshSettings();
        currentRows = buildCurrencyRows(lang);
        return interaction.editReply({ embeds: [buildCurrencyEmbed(lang, settings)], components: currentRows });
      }

      // ── Currency: change emoji ────────────────────────────────

      if (id === BTN.CURRENCY_EMOJI) {
        await i.deferUpdate();
        const input = await awaitTextInput(i, t(lang, "settings.currency.send_emoji"));
        if (!input) return;

        const isCustom  = /^<a?:\w+:\d+>$/.test(input);
        const isUnicode = /^\p{Emoji}$/u.test(input);

        if (!isCustom && !isUnicode) {
          await interaction.followUp({ content: t(lang, "settings.currency.invalid_emoji"), ephemeral: true });
          return;
        }

        await db.updateGuildSetting(guildId, "currency_emoji", input);
        await refreshSettings();
        currentRows = buildCurrencyRows(lang);
        return interaction.editReply({ embeds: [buildCurrencyEmbed(lang, settings)], components: currentRows });
      }

      // ── Salary: change amount ─────────────────────────────────

      if (id === BTN.SALARY_CHANGE) {
        await i.deferUpdate();
        const input = await awaitTextInput(i, t(lang, "settings.salary.send"));
        if (!input) return;

        const value = parseInt(input, 10);
        if (isNaN(value) || value < 10 || value > 50) {
          await interaction.followUp({ content: t(lang, "settings.salary.invalid"), ephemeral: true });
          return;
        }

        await db.updateGuildSetting(guildId, "daily_salary", value);
        await refreshSettings();
        currentRows = buildSalaryRows(lang);
        return interaction.editReply({ embeds: [buildSalaryEmbed(lang, settings)], components: currentRows });
      }

      // ── Channels: add ─────────────────────────────────────────

      if (id === BTN.CH_ADD) {
        await i.deferUpdate();
        const input = await awaitTextInput(i, t(lang, "settings.channels.send_add"));
        if (!input) return;

        const channelId = input.replace(/[<#>]/g, "");
        const key       = `${currentSubPage}_channels`;
        const list      = [...(settings[key] || [])];

        if (list.includes(channelId)) {
          await interaction.followUp({ content: t(lang, "settings.channels.already_added"), ephemeral: true });
          return;
        }

        list.push(channelId);
        await db.updateGuildSetting(guildId, key, list);
        await refreshSettings();
        return interaction.editReply({
          embeds:     [buildChannelsEditEmbed(lang, settings, currentSubPage)],
          components: currentRows,
        });
      }

      // ── Channels: remove ──────────────────────────────────────

      if (id === BTN.CH_REMOVE) {
        await i.deferUpdate();
        const input = await awaitTextInput(i, t(lang, "settings.channels.send_remove"));
        if (!input) return;

        const channelId = input.replace(/[<#>]/g, "");
        const key       = `${currentSubPage}_channels`;
        const list      = [...(settings[key] || [])];
        const idx       = list.indexOf(channelId);

        if (idx === -1) {
          await interaction.followUp({ content: t(lang, "settings.channels.not_found"), ephemeral: true });
          return;
        }

        list.splice(idx, 1);
        await db.updateGuildSetting(guildId, key, list);
        await refreshSettings();
        return interaction.editReply({
          embeds:     [buildChannelsEditEmbed(lang, settings, currentSubPage)],
          components: currentRows,
        });
      }

      // ── Channels: clear ───────────────────────────────────────

      if (id === BTN.CH_CLEAR) {
        await i.deferUpdate();
        await db.updateGuildSetting(guildId, `${currentSubPage}_channels`, []);
        await refreshSettings();
        return interaction.editReply({
          embeds:     [buildChannelsEditEmbed(lang, settings, currentSubPage)],
          components: currentRows,
        });
      }

      // ── Roles: add ────────────────────────────────────────────

      if (id === BTN.ROLE_ADD) {
        await i.deferUpdate();
        const input = await awaitTextInput(i, t(lang, "settings.roles.send_add"));
        if (!input) return;

        const roleId = input.replace(/[<@&>]/g, "");
        const list   = [...(settings.allowed_roles || [])];

        if (list.includes(roleId)) {
          await interaction.followUp({ content: t(lang, "settings.roles.already_added"), ephemeral: true });
          return;
        }

        list.push(roleId);
        await db.updateGuildSetting(guildId, "allowed_roles", list);
        await refreshSettings();
        currentRows = buildRolesRows(lang);
        return interaction.editReply({ embeds: [buildRolesEmbed(lang, settings)], components: currentRows });
      }

      // ── Roles: remove ─────────────────────────────────────────

      if (id === BTN.ROLE_REMOVE) {
        await i.deferUpdate();
        const input = await awaitTextInput(i, t(lang, "settings.roles.send_remove"));
        if (!input) return;

        const roleId = input.replace(/[<@&>]/g, "");
        const list   = [...(settings.allowed_roles || [])];
        const idx    = list.indexOf(roleId);

        if (idx === -1) {
          await interaction.followUp({ content: t(lang, "settings.roles.not_found"), ephemeral: true });
          return;
        }

        list.splice(idx, 1);
        await db.updateGuildSetting(guildId, "allowed_roles", list);
        await refreshSettings();
        currentRows = buildRolesRows(lang);
        return interaction.editReply({ embeds: [buildRolesEmbed(lang, settings)], components: currentRows });
      }

      // ── Roles: clear ──────────────────────────────────────────

      if (id === BTN.ROLE_CLEAR) {
        await i.deferUpdate();
        await db.updateGuildSetting(guildId, "allowed_roles", []);
        await refreshSettings();
        currentRows = buildRolesRows(lang);
        return interaction.editReply({ embeds: [buildRolesEmbed(lang, settings)], components: currentRows });
      }

      // ── Language: select menu ─────────────────────────────────

      if (id === BTN.LANG_SELECT && i.isStringSelectMenu()) {
        const selected = i.values[0];
        if (!isValidLanguage(selected)) return i.deferUpdate();

        await db.updateGuildSetting(guildId, "language", selected);
        await refreshSettings();
        currentRows = buildLanguageRows(lang);
        return i.update({ embeds: [buildLanguageEmbed(lang, settings)], components: currentRows });
      }

      // ── Prefix: change ────────────────────────────────────────

      const prefixKeyMap = {
        [BTN.PFX_BALANCE]:     "balance_prefix",
        [BTN.PFX_SALARY]:      "salary_prefix",
        [BTN.PFX_LEADERBOARD]: "leaderboard_prefix",
      };

      if (prefixKeyMap[id]) {
        await i.deferUpdate();
        const input = await awaitTextInput(i, t(lang, "settings.prefix.send"));
        if (!input) return;

        if (/\s/.test(input)) {
          await interaction.followUp({ content: t(lang, "settings.prefix.invalid"), ephemeral: true });
          return;
        }

        await db.updateGuildSetting(guildId, prefixKeyMap[id], input.toLowerCase());
        await refreshSettings();
        currentRows = buildPrefixRows(lang);
        return interaction.editReply({ embeds: [buildPrefixEmbed(lang, settings)], components: currentRows });
      }
    });

    // ── Timeout: disable all components ──────────────────────

    collector.on("end", async (_, reason) => {
      if (reason !== "time") return;
      logger.info(`Settings session expired → ${interaction.user.tag} in ${interaction.guild.name}`);
      await interaction.editReply({
        content:    t(lang, "settings.timeout"),
        components: disableAllComponents(currentRows),
      }).catch(() => {});
    });
  },
};
