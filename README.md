# Fendi Discord Bot

A Discord bot with slash commands and Fendi AI chat through OpenRouter, with a local brain fallback.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Put your Discord bot token in `.env` as `DISCORD_TOKEN=...`.
4. Add your server ID as `DISCORD_GUILD_ID=...` for instant `/ping` registration.
5. Add your OpenRouter key in `.env` as `ANTHROPIC_AUTH_TOKEN=...`.
6. In the Discord Developer Portal, enable the **Message Content Intent** for the bot.
7. Invite the bot to your server with the required bot permissions.
8. Start the bot with `npm start`.

Never commit the `.env` file or share your bot token.

## Usage

- `/ping` checks that the bot is online and replies `yawa`.
- `/send channel:#channel message:your message image:[choose a file]` sends text, an optional image selected from your device, or both to a selected channel. Requires Manage Server permission.
- `/announce channel:#channel template:welcome message:Your body here` sends a cute pink embedded announcement. The template controls the fixed title and footer; `message` edits only the body. You can also send a template without a custom body, or a custom-body embed without a template. Requires Manage Server permission.
- `/welcome channel:#welcome web_channel:#web preview:true` enables random cozy welcome messages for new members, mentioning them in the selected channel and linking the selected web channel. Set `preview:true` to send a labeled preview immediately; it mentions the person who ran the command as a stand-in. The four welcome styles are chosen randomly. Requires Manage Server permission. The setting resets when the bot restarts.
- `/rolechange setup role1:@RoleA role2:@RoleB` lets a server manager choose up to five roles that members can switch between. Members use `/rolechange choose` to pick one; their previous role from the configured list is removed. The bot needs Manage Roles permission, and selectable roles must be below the bot's highest role. The setting resets when the bot restarts.
- `/translate state:on channel:#translations` enables automatic translation of non-English messages to English, sending results only to the selected channel. Use `/translate state:off` to disable it. Requires Manage Server permission. The setting resets when the bot restarts.
- Mention the bot followed by a question to chat with Fendi AI.

For example: `@YourBot What is HTML?`

Fendi responds to slash commands only; regular messages and mentions are ignored.


