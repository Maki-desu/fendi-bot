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
- `/send channel:#channel message:your message image:[choose a file]` sends text, an optional image or video selected from your device, or both to a selected channel. Requires Manage Server permission.
- `/announce channel:#channel template:welcome message:Your body here` sends a cute pink embedded announcement. The template controls the fixed title and footer; `message` edits only the body. You can also send a template without a custom body, or a custom-body embed without a template. Requires Manage Server permission.
- `/welcome channel:#welcome web_channel:#web preview:true` enables random cozy welcome messages for new members, mentioning them in the selected channel and linking the selected web channel. Set `preview:true` to send a labeled preview immediately; it mentions the person who ran the command as a stand-in. The four welcome styles are chosen randomly. Requires Manage Server permission. The setting resets when the bot restarts.
- `/rolechange setup role1:@RoleA role2:@RoleB` lets a server manager choose up to five roles that members can switch between. Use `/rolechange choose message:"Choose the role that fits you best!"` to show a custom message before the role menu. The bot needs Manage Roles permission, and selectable roles must be below the bot's highest role. The setting resets when the bot restarts.
- `/react setup emojis:🌸,✨,💖 keywords:hello,welcome channel:#general` makes Fendi add every configured emoji when a message contains any configured keyword. Use comma-separated lists for bulk setup; omit `channel` to enable it in every channel. Use `/react add` to add more emojis or keywords, `/react status` to inspect the setup, and `/react clear` to disable it. Changes are saved automatically.
- `/poll question:"What should we watch?" options:"Comedy, Action, Romance" minutes:60 multiple:true` creates a button-based poll with your own choices. You can also use `option1` through `option5`; members can vote for one option by default, or multiple when `multiple:true` is selected. Polls support up to five options and close automatically.
- `/giveaway prize:"Anime bundle" minutes:60 winners:2` creates a button-based giveaway. Members click **Enter giveaway**, and Fendi randomly announces the winners when the timer ends.
- `/translate state:on channel:#translations` enables automatic translation of non-English messages to English, sending results only to the selected channel. Use `/translate state:off` to disable it. Requires Manage Server permission. The setting resets when the bot restarts.
- `/readonly state:on channel:#rules` prevents @everyone from sending messages in the selected channel. Use `/readonly state:off channel:#rules` to make it writable again. Requires Manage Server and Manage Channels permissions.
- `/deleteonmessage state:on channel:#warning-room warning:"Please do not message here."` watches one channel, deletes the triggering message, sends a warning mentioning the author, then deletes the warning and channel after five seconds. Use `/deleteonmessage state:off channel:#warning-room` to disable it before anyone posts. This requires Manage Server and Manage Channels permissions and is intentionally destructive.
- Mention the bot followed by a question to chat with Fendi AI.

For example: `@YourBot What is HTML?`

Fendi responds to slash commands only; regular messages and mentions are ignored.


