# Minecraft AFK Bot

A simple Minecraft bot that can stay AFK in public and Aternos servers while avoiding getting kicked for inactivity.

## Features

- Auto-reconnect if kicked or disconnected
- Random movements to prevent AFK detection
- Works with both premium and cracked servers
- Compatible with Aternos servers
- 24/7 operation capability

## Requirements

- Node.js (version 14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone or download this repository
2. Open a terminal in the project folder
3. Run `npm install` to install dependencies

## Configuration

Open `index.js` and modify the `BOT_CONFIG` object with your server details:

```javascript
const BOT_CONFIG = {
    host: 'localhost',     // Change this to your server IP
    port: 25565,          // Change this to your server port if different
    username: 'AFKBot',   // Change this to your desired bot username
    version: '1.20.1',    // Change this to match your server version
    auth: 'microsoft'     // Use 'microsoft' for premium accounts, remove for offline mode
};
```

For cracked/offline servers, remove the `auth` line from the config.

## Usage

1. Configure the bot settings as described above
2. Run the bot using:
```bash
npm start
```

## Keeping the Bot Running 24/7

To keep the bot running 24/7, you can use process managers like PM2:

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Start the bot with PM2:
```bash
pm2 start index.js --name minecraft-afk-bot
```

3. To make PM2 start the bot automatically on system restart:
```bash
pm2 startup
pm2 save
```

## Important Notes

- Some servers may have advanced AFK detection systems that this bot might not be able to bypass
- Use this bot responsibly and in accordance with server rules
- For premium servers, make sure to use valid Minecraft account credentials