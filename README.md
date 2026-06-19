# Discord Stay VC Bot

A simple Discord bot that joins a designated voice channel on command and reports its connection status through slash commands.

## Features

- `/join` to make the bot join its assigned voice channel
- `/leave` to disconnect the bot from voice
- `/status` to check whether the bot is connected
- Guild-scoped slash command registration on startup
- Optional PM2 process management for keeping the bot running

## Requirements

- Node.js 18 or newer
- A Discord application and bot token
- A Discord server where the bot is installed

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root:

```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_client_id
GUILD_ID=your_discord_server_id
VOICE_CHANNEL_ID=your_voice_channel_id
```

## Environment Variables

- `DISCORD_TOKEN`: Your Discord bot token
- `CLIENT_ID`: Your Discord application client ID
- `GUILD_ID`: The server where slash commands will be registered
- `VOICE_CHANNEL_ID`: The voice channel the bot should join when `/join` is used

## Run Locally

```bash
node index.js
```

When the bot starts, it registers the slash commands for the configured guild and logs in.

## Slash Commands

- `/join`: Connects the bot to the configured voice channel
- `/leave`: Disconnects the bot from voice
- `/status`: Shows the current voice connection status

## Run With PM2

Install PM2:

```bash
npm install -g pm2
```

Start the bot:

```bash
pm2 start index.js --name discord-stay-vc-bot
```

Useful PM2 commands:

```bash
pm2 status
pm2 logs discord-stay-vc-bot
pm2 restart discord-stay-vc-bot
pm2 stop discord-stay-vc-bot
```

## Notes

- This bot only joins the single voice channel specified by `VOICE_CHANNEL_ID`.
- Slash commands are registered per guild, so they should appear faster during development than global commands.
