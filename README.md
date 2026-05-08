# VaultBot

A per-guild economy bot for Discord built with Node.js and Discord.js.
Each server has its own independent currency, settings, and economy system.

---

## Features

- Per-guild currency with custom name and emoji
- Daily salary system with cooldown
- Balance check and transfer between members
- Leaderboard for top richest members
- Give and take currency (admin/allowed roles)
- Full settings panel via `/settings` with buttons and menus
- Supports Arabic and English (easily extendable)
- Supports SQLite (local) or MongoDB (remote)

---

## Requirements

- Node.js v18 or higher
- A Discord bot token
- SQLite (no setup needed) or a MongoDB URI

---

## Installation

**1. Clone the repository**
```bash
git clone https://github.com/lion-tube/VaultBot.git
cd VaultBot
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure environment variables**
```bash
cp .env.example .env
```

Open `.env` and fill in your values:
```env
TOKEN=your_bot_token
CLIENT_ID=your_bot_client_id
GUILD_ID=your_server_id

DB_TYPE=sqlite

# Only if DB_TYPE=mongodb
MONGODB_URI=mongodb+srv://...
```

**4. Deploy slash commands**
```bash
npm run deploy
```

**5. Start the bot**
```bash
npm start
```

---

## Commands

### Prefix Commands
Prefix for each command is configurable per server via `/settings`.

| Default Prefix | Usage | Description |
|----------------|-------|-------------|
| `balance` | `balance` | Show your own balance |
| `balance` | `balance @user` | Show another user's balance |
| `balance` | `balance @user 100` | Transfer 100 to a user |
| `salary` | `salary` | Claim your daily salary |
| `top` | `top` | Show top 10 richest members |

### Slash Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/give` | Give currency to a user | Admin or allowed role |
| `/take` | Take currency from a user | Admin or allowed role |
| `/settings` | Open the settings panel | Manage Server |

---

## Settings Panel

Run `/settings` to open the interactive settings panel.

```
/settings
├── 💰 Currency    → Change name and emoji
├── 💵 Salary      → Change daily salary amount (10–50)
├── 📢 Channels    → Set allowed channels per command
├── 🛡️ Roles       → Set roles allowed to use /give and /take
├── 🌐 Language    → Switch between Arabic and English
└── ⌨️ Prefix      → Change the prefix for each command
```

The session expires after **3 minutes** of inactivity.

---

## Adding a New Language

1. Create a new file in `src/locales/` named with the language code (e.g. `fr.json`)
2. Copy the structure from `ar.json` or `en.json` and translate all values
3. Restart the bot — the new language will appear automatically in `/settings`

---

## Project Structure

```
VaultBot/
├── src/
│   ├── commands/
│   │   ├── economy/
│   │   │   ├── balance.js       # Balance + transfer prefix command
│   │   │   ├── salary.js        # Daily salary prefix command
│   │   │   ├── leaderboard.js   # Leaderboard prefix command
│   │   │   ├── give.js          # Give slash command
│   │   │   └── take.js          # Take slash command
│   │   └── admin/
│   │       └── settings.js      # Settings slash command
│   ├── events/
│   │   ├── ready.js             # Bot ready event
│   │   ├── messageCreate.js     # Prefix command handler
│   │   └── interactionCreate.js # Slash command handler
│   ├── database/
│   │   ├── index.js             # Database selector (SQLite or MongoDB)
│   │   ├── sqlite.js            # SQLite handler
│   │   └── mongodb.js           # MongoDB handler
│   ├── utils/
│   │   ├── logger.js            # Terminal logging system
│   │   └── i18n.js              # Language system
│   └── locales/
│       ├── ar.json              # Arabic strings
│       └── en.json              # English strings
├── deploy-commands.js           # Slash command registration script
├── index.js                     # Main entry point
├── .env.example                 # Environment variables template
├── .gitignore
└── package.json
```

---

## License

ISC
