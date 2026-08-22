import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import {
  Client,
  Events,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType
} from 'discord.js';
import { createFendiBrain } from './fendi-brain.js';

const token = process.env.DISCORD_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;
const specialUserId = '923056791665926194';
const specialReplies = [
  'It’s been a while, Lex.',
  'It’s been quite some time, Lex.',
  'Been a while, Lex.',
  'It’s been some time, Lex.',
  'Long time no see, Lex.',
  'It’s been a minute, Lex.',
  'Been some time, Lex.',
  'It’s been a little while, Lex.',
  'It’s been a long while, Lex.',
  'Quite some time has passed, Lex.',
  'It’s been a while since we last spoke, Lex.'
];
const missYouReplies = [
  'I think it’s time for me to move on, Lex.'
];
const specialKeywords = [
  /\bfendi\b/,
  /\bhey\b/,
  /\bhi\b/,
  /\bhello\b/,
  /\bis it really you\b/,
  /\blong time no see\b/,
  /\bmiss me\b/,
  /\bremember me\b/ 
];
const announcementTemplates = {
  welcome: {
    title: '🌸 Welcome to the Fendi garden',
    body: 'Welcome everyone! We are glad to have you here. Please check the rules and enjoy your stay!'
  },
  event: {
    title: '🌸 A little event is blooming',
    body: 'A new event is coming soon. Keep an eye on this channel for details!'
  },
  maintenance: {
    title: '🌸 A tiny pause for maintenance',
    body: 'The server may be temporarily unavailable while updates are applied. Thank you for your patience!'
  },
  update: {
    title: '🌸 A fresh Fendi update',
    body: 'Hehehe~ there will be some **new updates coming soon** to the **Mirai Web**! ✨🌷\n\nMore details and further announcements will be provided later, so stay tuned! ♡'
  }
};
const announcementFooter = 'Fendi 🌸';
const welcomeMessages = {
  garden: {
    greeting: '🌸 Welcome to Mirai Anime! ✨',
    body: 'We hope you have lots of fun and enjoy your stay here! 💕',
    closing: 'Have fun, anime lovers! 🥰🎀'
  },
  starlight: {
    greeting: '✨ A new star has joined Mirai Anime! 🌙',
    body: 'We are so happy to have you here. Settle in, make friends, and enjoy the community! 💖',
    closing: 'Let the anime adventure begin! 🌟'
  },
  cozy: {
    greeting: '🎀 Welcome to your cozy corner of Mirai Anime! 🌸',
    body: 'Grab a snack, meet some wonderful people, and make yourself at home! 💕',
    closing: 'We are excited to have you with us! 🥰'
  },
  festival: {
    greeting: '🎉 The Mirai Anime festival is brighter with you here! ✨',
    body: 'Jump into the conversation, share your favorite anime, and enjoy everything our server has to offer! 🌷',
    closing: 'Welcome to the fun, anime lovers! 💫'
  }
};
const welcomeTypes = Object.keys(welcomeMessages);
const animeRecommendations = [
  { title: 'Frieren: Beyond Journey\'s End', genres: 'Adventure, Drama, Fantasy', description: 'A quiet, emotional journey about an elf mage learning what it means to treasure the people she once traveled with.', image: 'https://img.anili.st/media/154587' },
  { title: 'Fullmetal Alchemist: Brotherhood', genres: 'Action, Adventure, Fantasy', description: 'Two brothers search for the Philosopher\'s Stone while confronting the consequences of forbidden alchemy.', image: 'https://img.anili.st/media/5114' },
  { title: 'Spy x Family', genres: 'Action, Comedy, Family', description: 'A spy, an assassin, and a telepathic child pretend to be a family and somehow become one for real.', image: 'https://img.anili.st/media/140960' },
  { title: 'Mob Psycho 100', genres: 'Action, Comedy, Supernatural', description: 'A powerful psychic tries to grow as a person while navigating spirits, friendships, and everyday life.', image: 'https://img.anili.st/media/21507' },
  { title: 'Violet Evergarden', genres: 'Drama, Romance, Slice of Life', description: 'A former soldier discovers emotions and connection while writing letters for people who cannot find the words.', image: 'https://img.anili.st/media/21827' },
  { title: 'Haikyu!!', genres: 'Sports, Comedy, Drama', description: 'A determined volleyball player and his talented rival chase the dream of reaching the top.', image: 'https://img.anili.st/media/20464' },
  { title: 'The Apothecary Diaries', genres: 'Drama, Mystery, Historical', description: 'A clever young apothecary solves mysteries inside the imperial palace with sharp observation and dry wit.', image: 'https://img.anili.st/media/161645' },
  { title: 'One Punch Man', genres: 'Action, Comedy, Superhero', description: 'An unbeatable hero searches for a challenge while dealing with the surprisingly mundane problems of hero work.', image: 'https://img.anili.st/media/21087' },
  { title: 'A Place Further Than the Universe', genres: 'Adventure, Drama, Coming-of-Age', description: 'Four girls take an unforgettable journey toward Antarctica and discover how far courage can carry them.', image: 'https://img.anili.st/media/99426' },
  { title: 'Delicious in Dungeon', genres: 'Adventure, Comedy, Fantasy', description: 'An adventuring party explores a dungeon by cooking the monsters they encounter along the way.', image: 'https://img.anili.st/media/153518' }
];
const translationSettings = new Map();
const welcomeSettings = new Map();
const roleChangeSettings = new Map();
const reactionSettings = new Map();
const readOnlySettings = new Map();
const deleteChannelSettings = new Map();
const animeUpdateSettings = new Map();
const activePolls = new Map();
const activeGiveaways = new Map();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const settingsFilePath = path.join(__dirname, 'data', 'guild-settings.json');

async function ensureSettingsFile() {
  await fs.mkdir(path.dirname(settingsFilePath), { recursive: true });
  try {
    await fs.access(settingsFilePath);
  } catch {
    await fs.writeFile(settingsFilePath, '{}');
  }
}

async function readSettingsFile() {
  await ensureSettingsFile();
  const raw = await fs.readFile(settingsFilePath, 'utf8');
  if (!raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.error('Could not parse saved guild settings:', error.message);
    return {};
  }
}

async function writeSettingsFile(data) {
  await ensureSettingsFile();
  await fs.writeFile(settingsFilePath, JSON.stringify(data, null, 2));
}

function applySavedGuildSettings(guildId, guildSettings) {
  if (!guildId || !guildSettings) return;
  if (guildSettings.translation) {
    translationSettings.set(guildId, guildSettings.translation);
  }
  if (guildSettings.welcome) {
    welcomeSettings.set(guildId, guildSettings.welcome);
  }
  if (guildSettings.roleChange) {
    roleChangeSettings.set(guildId, guildSettings.roleChange);
  }
  if (guildSettings.reactions) {
    const rules = guildSettings.reactions.rules ?? (guildSettings.reactions.emojis ?? []).map(reaction => ({
      reaction,
      keywords: guildSettings.reactions.keywords ?? []
    }));
    reactionSettings.set(guildId, {
      rules,
      channelId: guildSettings.reactions.channelId ?? null
    });
  }
  if (guildSettings.readOnly) {
    readOnlySettings.set(guildId, guildSettings.readOnly);
  }
  if (guildSettings.deleteChannel) {
    deleteChannelSettings.set(guildId, guildSettings.deleteChannel);
  }
  if (guildSettings.animeUpdates) {
    animeUpdateSettings.set(guildId, guildSettings.animeUpdates);
  }
}

async function hydrateSettingsFromDisk() {
  const saved = await readSettingsFile();
  for (const [guildId, guildSettings] of Object.entries(saved)) {
    applySavedGuildSettings(guildId, guildSettings);
  }
}

async function saveGuildSettings(guildId) {
  const saved = await readSettingsFile();
  saved[guildId] = {
    translation: translationSettings.get(guildId) ?? null,
    welcome: welcomeSettings.get(guildId) ?? null,
    roleChange: roleChangeSettings.get(guildId) ?? null,
    reactions: reactionSettings.get(guildId) ?? null,
    readOnly: readOnlySettings.get(guildId) ?? null,
    deleteChannel: deleteChannelSettings.get(guildId) ?? null,
    animeUpdates: animeUpdateSettings.get(guildId) ?? null
  };
  await writeSettingsFile(saved);
  return saved[guildId];
}

async function loadGuildSettings(guildId) {
  const saved = await readSettingsFile();
  const guildSettings = saved[guildId];
  if (!guildSettings) return null;
  applySavedGuildSettings(guildId, guildSettings);
  return guildSettings;
}

async function checkAnimeUpdates() {
  if (!animeUpdateSettings.size) return;

  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startTimestamp = Math.floor(startOfDay.getTime() / 1000);
  const endTimestamp = startTimestamp + 86_400;
  const query = `
    query ($start: Int, $end: Int) {
      airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
        id
        airingAt
        episode
        media {
          title { romaji english native }
          coverImage { large }
          siteUrl
        }
      }
    }
  `;

  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { start: startTimestamp, end: endTimestamp } })
    });
    if (!response.ok) throw new Error(`AniList request failed with ${response.status}`);
    const result = await response.json();
    if (result.errors?.length) throw new Error(result.errors[0].message);

    for (const [guildId, setting] of animeUpdateSettings) {
      const channel = await client.channels.fetch(setting.channelId).catch(() => null);
      if (!channel?.isTextBased()) continue;

      const notifiedIds = new Set(setting.notifiedIds ?? []);
      for (const schedule of result.data?.airingSchedules ?? []) {
        if (notifiedIds.has(String(schedule.id))) continue;
        const title = schedule.media.title.english || schedule.media.title.romaji || schedule.media.title.native;
        try {
          await channel.send({
            content: `@everyone New anime episode today: **${title}**${schedule.episode ? `, episode ${schedule.episode}` : ''}!`,
            allowedMentions: { parse: ['everyone'] },
            embeds: [new EmbedBuilder()
              .setColor(0xff9fcf)
              .setTitle(`🌸 ${title}`)
              .setDescription('A new episode is airing today on MiraiAnimeIO.')
              .setImage(schedule.media.coverImage.large)
              .setURL(schedule.media.siteUrl)
              .setTimestamp(new Date(schedule.airingAt * 1000))
              .setFooter({ text: 'Anime update from Fendi' })]
          });
          notifiedIds.add(String(schedule.id));
        } catch (error) {
          console.error(`Could not send anime update in guild ${guildId}:`, error.message);
        }
      }

      setting.notifiedIds = [...notifiedIds].slice(-500);
      animeUpdateSettings.set(guildId, setting);
      await saveGuildSettings(guildId);
    }
  } catch (error) {
    console.error('Could not check anime updates:', error.message);
  }
}

function buildWelcomeMessage(member, webChannelId) {
  const type = welcomeTypes[Math.floor(Math.random() * welcomeTypes.length)];
  const welcome = welcomeMessages[type];
  return [
    `${welcome.greeting} <@${member.id}>`,
    welcome.body,
    `🌐 Here for the web? Just visit <#${webChannelId}>!`,
    welcome.closing
  ].join('\n');
}

async function translateToEnglish(text) {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'auto',
    tl: 'en',
    dt: 't',
    q: text
  });
  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`);
  if (!response.ok) throw new Error(`Translation request failed with ${response.status}`);

  const result = await response.json();
  const translatedText = result[0]
    ?.map(segment => segment[0])
    .filter(Boolean)
    .join('');
  const detectedLanguage = result[2];

  if (!translatedText || !detectedLanguage || detectedLanguage.toLowerCase() === 'en') return null;
  return { detectedLanguage, translatedText };
}

function parseReactionList(value, normalize = false) {
  return [...new Set(value
    .split(/[,\n]+/)
    .map(item => normalize ? item.trim().toLowerCase() : item.trim())
    .filter(Boolean))];
}

function reactionSettingsSummary(setting) {
  if (!setting) return 'Automatic reactions are not configured.';
  const rules = setting.rules ?? [];
  const channel = setting.channelId ? ` in <#${setting.channelId}>` : ' in every channel';
  return `Automatic reactions are enabled${channel}.\n${rules.map(rule => `${rule.reaction}: ${rule.keywords.join(', ')}`).join('\n')}`;
}

function parseDuration(minutes) {
  const duration = Number(minutes);
  return Number.isInteger(duration) && duration > 0 ? duration * 60_000 : null;
}

function chooseWinners(entries, winnerCount) {
  const available = [...entries];
  const winners = [];
  while (available.length && winners.length < winnerCount) {
    const index = Math.floor(Math.random() * available.length);
    winners.push(available.splice(index, 1)[0]);
  }
  return winners;
}

function pollComponents(poll, disabled = false) {
  return [new ActionRowBuilder().addComponents(poll.options.map((option, index) => new ButtonBuilder()
    .setCustomId(`poll:${poll.id}:${index}`)
    .setLabel(`${index + 1}. ${option.label} (${option.votes.size})`)
    .setStyle(ButtonStyle.Primary)
    .setDisabled(disabled)))];
}

function pollEmbed(poll, ended = false) {
  return new EmbedBuilder()
    .setColor(ended ? 0x808080 : 0xff9fcf)
    .setTitle(ended ? `Poll ended: ${poll.question}` : poll.question)
    .setDescription(`${poll.multiple ? 'Choose one or more options.' : 'Choose one option.'}\n${poll.options.map((option, index) => `**${index + 1}.** ${option.label} - ${option.votes.size} vote(s)`).join('\n')}`)
    .setFooter({ text: ended ? 'Voting is closed.' : `Voting ends in ${poll.durationMinutes} minute(s).` });
}

function scheduleGiveaway(giveaway, channel) {
  const timer = setTimeout(async () => {
    activeGiveaways.delete(giveaway.id);
    const winners = chooseWinners(giveaway.entries, giveaway.winnerCount);
    const result = winners.length
      ? winners.map(userId => `<@${userId}>`).join(', ')
      : 'Nobody entered.';
    await channel.send(`🎉 The giveaway for **${giveaway.prize}** has ended! Winner(s): ${result}`).catch(error => {
      console.error('Could not announce giveaway winner:', error.message);
    });
  }, giveaway.durationMs);
  activeGiveaways.set(giveaway.id, { ...giveaway, timer });
}

async function applyAutomaticReactions(message) {
  if (!message.guildId || !message.content.trim()) return;
  const setting = reactionSettings.get(message.guildId);
  if (!setting || (setting.channelId && setting.channelId !== message.channelId)) return;

  const text = message.content.toLowerCase();
  const reactions = new Set();
  for (const rule of setting.rules ?? []) {
    if (rule.keywords.some(keyword => text.includes(keyword))) reactions.add(rule.reaction);
  }
  if (!reactions.size) return;

  for (const emoji of reactions) {
    try {
      await message.react(emoji);
    } catch (error) {
      console.error(`Could not react with ${emoji}:`, error.message);
    }
  }
}

if (!token) {
  console.error('Missing DISCORD_TOKEN. Set it in a .env file before starting the bot.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});
const fendiBrain = createFendiBrain();
const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

async function getAiReply(messageText, userId) {
  if (!openaiClient) {
    return fendiBrain.reply(messageText, userId);
  }

  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.8,
      messages: [
        {
          role: 'system',
          content: 'You are Fendi, a cute helpful Discord bot. Keep answers short, warm, and playful, and avoid mentioning that you are an AI unless asked.'
        },
        { role: 'user', content: messageText }
      ]
    });

    const reply = response.choices?.[0]?.message?.content?.trim();
    if (reply) return reply;
  } catch (error) {
    console.error('OpenAI reply failed:', error.message);
  }

  return fendiBrain.reply(messageText, userId);
}

client.once(Events.ClientReady, readyClient => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  const pingCommand = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check that the bot is online.')
    .toJSON();
  const sendCommand = new SlashCommandBuilder()
    .setName('send')
    .setDescription('Send a message to a selected channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(option => option
      .setName('channel')
      .setDescription('Optional channel; defaults to the current channel.')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(false))
    .addStringOption(option => option
      .setName('message_id')
      .setDescription('Optional message ID to reply to.')
      .setMinLength(17)
      .setMaxLength(20))
    .addStringOption(option => option
      .setName('message')
      .setDescription('The message to send.')
      .setMaxLength(2000))
    .addStringOption(option => option
      .setName('reactions')
      .setDescription('Optional comma-separated reactions; up to four.')
      .setMaxLength(100))
    .addAttachmentOption(option => option
      .setName('image1')
      .setDescription('Optional first image from your device.'))
    .addAttachmentOption(option => option
      .setName('image2')
      .setDescription('Optional second image from your device.'))
    .addAttachmentOption(option => option
      .setName('image3')
      .setDescription('Optional third image from your device.'))
    .addAttachmentOption(option => option
      .setName('image4')
      .setDescription('Optional fourth image from your device.'))
    .addAttachmentOption(option => option
      .setName('image5')
      .setDescription('Optional fifth image from your device.'))
    .toJSON();
  const announceCommand = new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send a custom or template announcement to a channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(option => option
      .setName('channel')
      .setDescription('The channel that should receive the announcement.')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(true))
    .addStringOption(option => option
      .setName('template')
      .setDescription('Use a ready-made announcement template.')
      .addChoices(
        { name: 'Welcome', value: 'welcome' },
        { name: 'Event', value: 'event' },
        { name: 'Maintenance', value: 'maintenance' },
        { name: 'Update', value: 'update' }
      ))
    .addStringOption(option => option
      .setName('message')
      .setDescription('Write a custom announcement instead of using a template.')
      .setMaxLength(2000))
    .toJSON();
  const translateCommand = new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Turn automatic translation to English on or off for this server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option => option
      .setName('state')
      .setDescription('Enable or disable automatic translation.')
      .setRequired(true)
      .addChoices(
        { name: 'On', value: 'on' },
        { name: 'Off', value: 'off' }
      ))
    .addChannelOption(option => option
      .setName('channel')
      .setDescription('Channel where translations should be sent when enabled.')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(false))
    .toJSON();
  const readOnlyCommand = new SlashCommandBuilder()
    .setName('readonly')
    .setDescription('Make a selected text channel read-only or writable.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option => option
      .setName('state')
      .setDescription('Lock or unlock the selected channel.')
      .setRequired(true)
      .addChoices(
        { name: 'On', value: 'on' },
        { name: 'Off', value: 'off' }
      ))
    .addChannelOption(option => option
      .setName('channel')
      .setDescription('The text channel to lock or unlock.')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(true))
    .toJSON();
  const deleteOnMessageCommand = new SlashCommandBuilder()
    .setName('deleteonmessage')
    .setDescription('Delete messages sent in a selected channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option => option
      .setName('state')
      .setDescription('Enable or disable message deletion in the selected channel.')
      .setRequired(true)
      .addChoices(
        { name: 'On', value: 'on' },
        { name: 'Off', value: 'off' }
      ))
    .addChannelOption(option => option
      .setName('channel')
      .setDescription('The text channel to watch.')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(true))
    .addStringOption(option => option
      .setName('warning')
      .setDescription('Warning sent to the member before their message is deleted.')
      .setMaxLength(2000)
      .setRequired(false))
    .toJSON();
  const welcomeCommand = new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Send a welcome message to a selected channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(option => option
      .setName('channel')
      .setDescription('Channel where the welcome message should be sent.')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(true))
    .addChannelOption(option => option
      .setName('web_channel')
      .setDescription('Channel to mention in the web line of the welcome message.')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(true))
    .addBooleanOption(option => option
      .setName('preview')
      .setDescription('Send a preview to the selected welcome channel now.')
      .setRequired(false))
    .toJSON();
  const roleChangeCommand = new SlashCommandBuilder()
    .setName('rolechange')
    .setDescription('Let members choose from roles selected by the server manager.')
    .addSubcommand(subcommand => subcommand
      .setName('setup')
      .setDescription('Choose which roles members can switch between.')
      .addRoleOption(option => option
        .setName('role1')
        .setDescription('First role members can choose.')
        .setRequired(true))
      .addRoleOption(option => option
        .setName('role2')
        .setDescription('Second role members can choose.')
        .setRequired(false))
      .addRoleOption(option => option
        .setName('role3')
        .setDescription('Third role members can choose.')
        .setRequired(false))
      .addRoleOption(option => option
        .setName('role4')
        .setDescription('Fourth role members can choose.')
        .setRequired(false))
      .addRoleOption(option => option
        .setName('role5')
        .setDescription('Fifth role members can choose.')
        .setRequired(false)))
    .addSubcommand(subcommand => subcommand
      .setName('choose')
      .setDescription('Choose your role from the available options.')
      .addStringOption(option => option
        .setName('message')
        .setDescription('Message shown before members choose a role.')
        .setMaxLength(2000)
        .setRequired(false)))
    .toJSON();
  const kickCommand = new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(option => option
      .setName('user')
      .setDescription('The member to kick.')
      .setRequired(true))
    .addStringOption(option => option
      .setName('reason')
      .setDescription('Optional reason for the kick.')
      .setMaxLength(512))
    .toJSON();
  const timeoutCommand = new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Temporarily timeout a member.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option => option
      .setName('user')
      .setDescription('The member to timeout.')
      .setRequired(true))
    .addIntegerOption(option => option
      .setName('minutes')
      .setDescription('Duration in minutes.')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(40320))
    .addStringOption(option => option
      .setName('reason')
      .setDescription('Optional reason for the timeout.')
      .setMaxLength(512))
    .toJSON();
  const pollCommand = new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create an interactive poll.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option => option
      .setName('question')
      .setDescription('The question for the poll.')
      .setRequired(true)
      .setMaxLength(200))
    .addStringOption(option => option
      .setName('option1')
      .setDescription('First answer option.')
      .setRequired(true)
      .setMaxLength(60))
    .addStringOption(option => option
      .setName('option2')
      .setDescription('Second answer option.')
      .setRequired(true)
      .setMaxLength(60))
    .addStringOption(option => option
      .setName('option3')
      .setDescription('Optional third answer option.')
      .setMaxLength(60))
    .addStringOption(option => option
      .setName('option4')
      .setDescription('Optional fourth answer option.')
      .setMaxLength(60))
    .addStringOption(option => option
      .setName('option5')
      .setDescription('Optional fifth answer option.')
      .setMaxLength(60))
    .addStringOption(option => option
      .setName('options')
      .setDescription('Optional bulk list, separated by commas or new lines.')
      .setMaxLength(300))
    .addIntegerOption(option => option
      .setName('minutes')
      .setDescription('How long voting stays open.')
      .setMinValue(1)
      .setMaxValue(10080))
    .addBooleanOption(option => option
      .setName('multiple')
      .setDescription('Allow each member to choose multiple options.'))
    .toJSON();
  const giveawayCommand = new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Start an interactive giveaway.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option => option
      .setName('prize')
      .setDescription('What is being given away?')
      .setRequired(true)
      .setMaxLength(200))
    .addIntegerOption(option => option
      .setName('minutes')
      .setDescription('How long the giveaway stays open.')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(10080))
    .addIntegerOption(option => option
      .setName('winners')
      .setDescription('Number of winners.')
      .setMinValue(1)
      .setMaxValue(20))
    .toJSON();
  const reactionsCommand = new SlashCommandBuilder()
    .setName('reactions')
    .setDescription('Configure keyword reactions.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand => subcommand
      .setName('set')
      .setDescription('Replace the reaction rules.')
      .addStringOption(option => option
        .setName('reaction')
        .setDescription('Emoji to add, such as 🌸.')
        .setRequired(true)
        .setMaxLength(50))
      .addStringOption(option => option
        .setName('keywords')
        .setDescription('Comma-separated keywords or phrases.')
        .setRequired(true)
        .setMaxLength(1000))
      .addChannelOption(option => option
        .setName('channel')
        .setDescription('Only react in this channel; omit for every channel.')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)))
    .addSubcommand(subcommand => subcommand
      .setName('add')
      .setDescription('Add another reaction rule.')
      .addStringOption(option => option
        .setName('reaction')
        .setDescription('Emoji to add, such as ✨.')
        .setRequired(true)
        .setMaxLength(50))
      .addStringOption(option => option
        .setName('keywords')
        .setDescription('Comma-separated keywords or phrases.')
        .setRequired(true)
        .setMaxLength(1000)))
    .addSubcommand(subcommand => subcommand
      .setName('status')
      .setDescription('Show the current reaction rules.'))
    .addSubcommand(subcommand => subcommand
      .setName('clear')
      .setDescription('Disable all keyword reactions.'))
    .toJSON();
  const animeCommand = new SlashCommandBuilder()
    .setName('anime')
    .setDescription('Get an anime recommendation.')
    .addSubcommand(subcommand => subcommand
      .setName('recommend')
      .setDescription('Recommend a random anime.'))
    .addSubcommand(subcommand => subcommand
      .setName('update')
      .setDescription('Send new anime episode notifications to a channel.')
      .addChannelOption(option => option
        .setName('channel')
        .setDescription('Channel where anime updates should be sent.')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)))
    .toJSON();
  const settingsCommand = new SlashCommandBuilder()
    .setName('settings')
    .setDescription("Save or restore this server's bot settings.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand => subcommand
      .setName('save')
      .setDescription('Save the current welcome, translation, and role settings for this guild.'))
    .addSubcommand(subcommand => subcommand
      .setName('load')
      .setDescription('Load the saved settings for this guild back into the bot.'))
    .toJSON();
  const rest = new REST({ version: '10' }).setToken(token);

  const commandRoute = guildId
    ? Routes.applicationGuildCommands(readyClient.user.id, guildId)
    : Routes.applicationCommands(readyClient.user.id);
  rest.put(commandRoute, { body: [pingCommand, sendCommand, announceCommand, translateCommand, readOnlyCommand, deleteOnMessageCommand, welcomeCommand, roleChangeCommand, pollCommand, giveawayCommand, reactionsCommand, animeCommand, kickCommand, timeoutCommand, settingsCommand] })
    .then(() => console.log('Registered /ping, /send, /announce, /translate, /readonly, /deleteonmessage, /welcome, /rolechange, /poll, /giveaway, /reactions, /anime, /kick, /timeout, and /settings commands.'))
    .catch(error => console.error('Could not register slash commands:', error.message));
  checkAnimeUpdates();
  setInterval(checkAnimeUpdates, 60 * 60 * 1000);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith('rolechange:')) {
    const setting = roleChangeSettings.get(interaction.guildId);
    const roles = setting?.roles ?? [];
    const selectedRoleId = interaction.values[0];
    const selectedRole = interaction.guild.roles.cache.get(selectedRoleId);
    const member = interaction.member;
    if (!selectedRole || !roles.some(role => role.id === selectedRoleId)) {
      await interaction.update({ content: 'That role is no longer available.', components: [] });
      return;
    }
    if (!selectedRole.editable || selectedRole.managed) {
      await interaction.update({ content: 'I cannot manage that role. Move it below my highest role and try again.', components: [] });
      return;
    }
    try {
      await member.roles.remove(roles.filter(role => role.id !== selectedRoleId).map(role => role.id));
      await member.roles.add(selectedRole);
      await interaction.update({ content: `You now have the ${selectedRole} role.`, components: [] });
    } catch (error) {
      console.error('Could not change member role:', error.message);
      await interaction.update({ content: 'I could not change your role. Please ask a server manager to check my Manage Roles permission.', components: [] });
    }
    return;
  }

  if (interaction.isButton() && interaction.customId.startsWith('poll:')) {
    const [, pollId, optionIndexText] = interaction.customId.split(':');
    const poll = activePolls.get(pollId);
    const optionIndex = Number(optionIndexText);
    if (!poll || !poll.options[optionIndex]) {
      await interaction.reply({ content: 'That poll has ended.', ephemeral: true });
      return;
    }

    const selectedOption = poll.options[optionIndex];
    const hadSelectedOption = selectedOption.votes.has(interaction.user.id);
    if (!poll.multiple) {
      for (const option of poll.options) option.votes.delete(interaction.user.id);
    }
    if (hadSelectedOption) {
      selectedOption.votes.delete(interaction.user.id);
    } else {
      selectedOption.votes.add(interaction.user.id);
    }
    await interaction.update({ embeds: [pollEmbed(poll)], components: pollComponents(poll) });
    return;
  }

  if (interaction.isButton() && interaction.customId.startsWith('giveaway:')) {
    const [, giveawayId] = interaction.customId.split(':');
    const giveaway = activeGiveaways.get(giveawayId);
    if (!giveaway) {
      await interaction.reply({ content: 'That giveaway has ended.', ephemeral: true });
      return;
    }
    if (giveaway.entries.has(interaction.user.id)) {
      await interaction.reply({ content: 'You are already entered!', ephemeral: true });
      return;
    }
    giveaway.entries.add(interaction.user.id);
    await interaction.reply({ content: 'You are entered in the giveaway! Good luck! ^_^', ephemeral: true });
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong! Fendi is up and running smoothly.');
    return;
  }

  if (interaction.commandName === 'anime') {
    if (interaction.options.getSubcommand() === 'update') {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: 'You need Manage Server permission to configure anime updates.', ephemeral: true });
        return;
      }
      const channel = interaction.options.getChannel('channel', true);
      animeUpdateSettings.set(interaction.guildId, {
        channelId: channel.id,
        notifiedIds: animeUpdateSettings.get(interaction.guildId)?.notifiedIds ?? []
      });
      await saveGuildSettings(interaction.guildId);
      await interaction.reply({
        content: `Anime updates are enabled in ${channel}. I will check for new episodes every hour and notify members when one airs today.`,
        ephemeral: true
      });
      return;
    }

    const recommendation = animeRecommendations[Math.floor(Math.random() * animeRecommendations.length)];
    await interaction.reply({
      content: `Hmm, Fendi recommends **${recommendation.title}**!\nWatch it on MiraiAnimeIO by visiting <#1534843958126186526>.`,
      embeds: [new EmbedBuilder()
        .setColor(0xff9fcf)
        .setTitle('🌸 Anime recommendation')
        .setDescription(recommendation.description)
        .addFields({ name: 'Genres', value: recommendation.genres })
        .setImage(recommendation.image)
        .setFooter({ text: 'Random anime recommendation from Fendi' })]
    });
    return;
  }

  if (interaction.commandName === 'translate') {
    const state = interaction.options.getString('state', true);
    const channel = interaction.options.getChannel('channel');
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({ content: 'You need Manage Server permission to use this command.', ephemeral: true });
      return;
    }
    if (state === 'on' && !channel) {
      await interaction.reply({ content: 'Choose the channel where translations should be sent.', ephemeral: true });
      return;
    }
    translationSettings.set(interaction.guildId, {
      enabled: state === 'on',
      channelId: channel?.id
    });
    const destination = channel ? ` in ${channel}` : '';
    await interaction.reply(`Automatic translation to English is now **${state}**${destination}.`);
    return;
  }

  if (interaction.commandName === 'settings') {
    const action = interaction.options.getSubcommand();
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({ content: 'You need Manage Server permission to use this command.', ephemeral: true });
      return;
    }

    if (action === 'save') {
      const stored = await saveGuildSettings(interaction.guildId);
      const summary = [];
      if (stored.welcome) summary.push(`Welcome: ${stored.welcome.channelId ? `<#${stored.welcome.channelId}>` : 'not set'}`);
      if (stored.translation) summary.push(`Translation: ${stored.translation.enabled ? 'enabled' : 'disabled'}${stored.translation.channelId ? ` in <#${stored.translation.channelId}>` : ''}`);
      if (stored.roleChange) summary.push(`Role change: ${stored.roleChange.roles.length} selectable role(s)`);
      if (stored.reactions) summary.push(`Reactions: ${stored.reactions.rules.length} rule(s)`);
      await interaction.reply({
        content: summary.length
          ? `Saved this guild's settings.\n${summary.join('\n')}`
          : 'Saved this guild\'s settings, but there was nothing configured to save yet.',
        ephemeral: true
      });
      return;
    }

    const loaded = await loadGuildSettings(interaction.guildId);
    if (!loaded) {
      await interaction.reply({ content: 'There are no saved settings for this guild yet. Use /settings save first.', ephemeral: true });
      return;
    }

    const loadedSummary = [];
    if (loaded.welcome) loadedSummary.push(`Welcome channel: <#${loaded.welcome.channelId}>`);
    if (loaded.translation) loadedSummary.push(`Translation channel: ${loaded.translation.channelId ? `<#${loaded.translation.channelId}>` : 'not set'}`);
    if (loaded.roleChange) loadedSummary.push(`Role change roles: ${loaded.roleChange.roles.length}`);
    if (loaded.reactions) loadedSummary.push(`Reaction rules: ${loaded.reactions.rules?.length ?? loaded.reactions.emojis?.length ?? 0}`);
    await interaction.reply({
      content: loadedSummary.length
        ? `Restored saved settings for this guild.\n${loadedSummary.join('\n')}`
        : 'Restored saved settings for this guild.',
      ephemeral: true
    });
    return;
  }

  if (interaction.commandName === 'reactions') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({ content: 'You need Manage Server permission to configure keyword reactions.', ephemeral: true });
      return;
    }

    const action = interaction.options.getSubcommand();
    if (action === 'status') {
      await interaction.reply({ content: reactionSettingsSummary(reactionSettings.get(interaction.guildId)), ephemeral: true });
      return;
    }

    if (action === 'clear') {
      reactionSettings.delete(interaction.guildId);
      await saveGuildSettings(interaction.guildId);
      await interaction.reply({ content: 'Automatic keyword reactions are now disabled for this server.', ephemeral: true });
      return;
    }

    const reaction = interaction.options.getString('reaction', true).trim();
    const keywords = parseReactionList(interaction.options.getString('keywords', true), true);
    if (!reaction || !keywords.length) {
      await interaction.reply({ content: 'Add a reaction and at least one keyword. Separate keywords with commas.', ephemeral: true });
      return;
    }

    const current = reactionSettings.get(interaction.guildId);
    if (action === 'set') {
      const channel = interaction.options.getChannel('channel');
      reactionSettings.set(interaction.guildId, {
        rules: [{ reaction, keywords }],
        channelId: channel?.id ?? null
      });
    } else {
      const rules = [...(current?.rules ?? []), { reaction, keywords }];
      if (rules.length > 50) {
        await interaction.reply({ content: 'You can configure up to 50 separate reaction rules.', ephemeral: true });
        return;
      }
      reactionSettings.set(interaction.guildId, {
        rules,
        channelId: current?.channelId ?? null
      });
    }

    await saveGuildSettings(interaction.guildId);
    await interaction.reply({ content: reactionSettingsSummary(reactionSettings.get(interaction.guildId)), ephemeral: true });
    return;
  }

  if (interaction.commandName === 'poll') {
    const question = interaction.options.getString('question', true);
    const bulkOptions = interaction.options.getString('options');
    const optionLabels = bulkOptions
      ? bulkOptions.split(/[,\n]+/).map(option => option.trim()).filter(Boolean)
      : ['option1', 'option2', 'option3', 'option4', 'option5']
        .map(name => interaction.options.getString(name))
        .filter(Boolean);
    const options = [...new Set(optionLabels)]
      .map(label => ({ label, votes: new Set() }));
    if (options.length < 2 || options.length > 5 || options.some(option => option.label.length > 60)) {
      await interaction.reply({ content: 'A poll needs 2 to 5 unique options. Use the bulk options field or option1 through option5.', ephemeral: true });
      return;
    }
    const durationMinutes = interaction.options.getInteger('minutes') ?? 60;
    const poll = {
      id: `${interaction.guildId}-${Date.now()}`,
      question,
      options,
      multiple: interaction.options.getBoolean('multiple') ?? false,
      durationMinutes
    };
    activePolls.set(poll.id, poll);
    const sent = await interaction.reply({
      embeds: [pollEmbed(poll)],
      components: pollComponents(poll),
      fetchReply: true
    });
    setTimeout(async () => {
      activePolls.delete(poll.id);
      await sent.edit({ embeds: [pollEmbed(poll, true)], components: pollComponents(poll, true) }).catch(error => {
        console.error('Could not close poll:', error.message);
      });
    }, durationMinutes * 60_000);
    return;
  }

  if (interaction.commandName === 'giveaway') {
    const prize = interaction.options.getString('prize', true);
    const durationMinutes = interaction.options.getInteger('minutes', true);
    const winnerCount = interaction.options.getInteger('winners') ?? 1;
    const giveaway = {
      id: `${interaction.guildId}-${Date.now()}`,
      prize,
      winnerCount,
      durationMs: parseDuration(durationMinutes),
      entries: new Set()
    };
    const button = new ButtonBuilder()
      .setCustomId(`giveaway:${giveaway.id}`)
      .setLabel('Enter giveaway')
      .setEmoji('🎉')
      .setStyle(ButtonStyle.Success);
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xffd166)
        .setTitle('🎉 Giveaway')
        .setDescription(`**Prize:** ${prize}\n**Winners:** ${winnerCount}\n**Ends in:** ${durationMinutes} minute(s)\n\nClick the button below to enter!`)
        .setFooter({ text: 'Good luck!' })],
      components: [new ActionRowBuilder().addComponents(button)]
    });
    scheduleGiveaway(giveaway, interaction.channel);
    return;
  }

  if (interaction.commandName === 'kick') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.KickMembers)) {
      await interaction.reply({ content: 'You need Kick Members permission to use this command.', ephemeral: true });
      return;
    }
    const targetMember = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided.';
    if (!targetMember) {
      await interaction.reply({ content: 'That member could not be found.', ephemeral: true });
      return;
    }
    if (!targetMember.kickable) {
      await interaction.reply({ content: 'I cannot kick that member. Check my role hierarchy and permissions.', ephemeral: true });
      return;
    }
    try {
      await targetMember.kick(reason);
      await interaction.reply({ content: `${targetMember.user.tag} was kicked for: ${reason}`, ephemeral: false });
    } catch (error) {
      console.error('Could not kick member:', error.message);
      await interaction.reply({ content: 'I could not kick that member. Please check my permissions and role hierarchy.', ephemeral: true });
    }
    return;
  }

  if (interaction.commandName === 'timeout') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
      await interaction.reply({ content: 'You need Moderate Members permission to use this command.', ephemeral: true });
      return;
    }
    const targetMember = interaction.options.getMember('user');
    const minutes = interaction.options.getInteger('minutes', true);
    const reason = interaction.options.getString('reason') || 'No reason provided.';
    if (!targetMember) {
      await interaction.reply({ content: 'That member could not be found.', ephemeral: true });
      return;
    }
    if (!targetMember.moderatable) {
      await interaction.reply({ content: 'I cannot timeout that member. Check my role hierarchy and permissions.', ephemeral: true });
      return;
    }
    try {
      await targetMember.timeout(minutes * 60_000, reason);
      await interaction.reply({ content: `${targetMember.user.tag} was timed out for ${minutes} minute(s) for: ${reason}`, ephemeral: false });
    } catch (error) {
      console.error('Could not timeout member:', error.message);
      await interaction.reply({ content: 'I could not timeout that member. Please check my permissions and role hierarchy.', ephemeral: true });
    }
    return;
  }

  if (interaction.commandName === 'readonly') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({ content: 'You need Manage Server permission to use this command.', ephemeral: true });
      return;
    }
    const state = interaction.options.getString('state', true);
    const channel = interaction.options.getChannel('channel', true);
    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: state === 'on' ? false : null
      });
      if (state === 'on') {
        readOnlySettings.set(interaction.guildId, { channelId: channel.id });
      } else {
        readOnlySettings.delete(interaction.guildId);
      }
      await saveGuildSettings(interaction.guildId);
      await interaction.reply({
        content: state === 'on'
          ? `${channel} is now read-only for @everyone.`
          : `${channel} is writable again for @everyone.`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Could not update read-only channel:', error.message);
      await interaction.reply({ content: 'I could not update that channel. Check my Manage Channels permission.', ephemeral: true });
    }
    return;
  }

  if (interaction.commandName === 'deleteonmessage') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({ content: 'You need Manage Server permission to use this command.', ephemeral: true });
      return;
    }
    const state = interaction.options.getString('state', true);
    const channel = interaction.options.getChannel('channel', true);
    if (!interaction.guild.members.me?.permissionsIn(channel).has(PermissionFlagsBits.ManageMessages)) {
      await interaction.reply({ content: 'I need Manage Messages permission in that channel before I can use this feature.', ephemeral: true });
      return;
    }
    if (state === 'on') {
      deleteChannelSettings.set(interaction.guildId, {
        channelId: channel.id,
        warning: interaction.options.getString('warning') || 'Please do not send messages in this channel.'
      });
    } else {
      deleteChannelSettings.delete(interaction.guildId);
    }
    await saveGuildSettings(interaction.guildId);
    await interaction.reply({
      content: state === 'on'
        ? `Messages sent in ${channel} will be deleted, and the warning will be removed after five seconds.`
        : `Message-triggered deletion is disabled for ${channel}.`,
      ephemeral: true
    });
    return;
  }

  if (!['send', 'announce', 'welcome', 'rolechange'].includes(interaction.commandName)) return;
  const roleChangeAction = interaction.commandName === 'rolechange'
    ? interaction.options.getSubcommand()
    : null;
  if (interaction.commandName !== 'rolechange' && !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({ content: 'You need Manage Server permission to use this command.', ephemeral: true });
    return;
  }

  if (interaction.commandName === 'rolechange') {
    if (roleChangeAction === 'choose') {
      const setting = roleChangeSettings.get(interaction.guildId);
      if (!setting) {
        await interaction.reply({ content: 'A server manager has not configured any selectable roles yet.', ephemeral: true });
        return;
      }
      const message = interaction.options.getString('message') || 'Choose one role. Your previous role from this list will be removed.';
      const menu = new StringSelectMenuBuilder()
        .setCustomId(`rolechange:${interaction.guildId}`)
        .setPlaceholder('Choose your new role')
        .addOptions(setting.roles.map(role => ({ label: role.name, value: role.id })));
      await interaction.reply({
        content: message,
        components: [new ActionRowBuilder().addComponents(menu)],
        ephemeral: false
      });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({ content: 'Only server managers can configure selectable roles.', ephemeral: true });
      return;
    }
    const roles = ['role1', 'role2', 'role3', 'role4', 'role5']
      .map(name => interaction.options.getRole(name))
      .filter(Boolean);
    const botMember = interaction.guild.members.me;
    const invalidRole = roles.find(role => role.managed || !botMember || role.position >= botMember.roles.highest.position);
    if (invalidRole) {
      await interaction.reply({ content: `${invalidRole} cannot be managed by me. Make sure it is not an integration role and is below my highest role.`, ephemeral: true });
      return;
    }
    roleChangeSettings.set(interaction.guildId, {
      roles: roles.map(role => ({ id: role.id, name: role.name }))
    });
    await interaction.reply({
      content: `Members can now choose from: ${roles.join(', ')}. They can use /rolechange choose.`,
      ephemeral: true
    });
    return;
  }

  if (interaction.commandName === 'welcome') {
    const channel = interaction.options.getChannel('channel', true);
    const webChannel = interaction.options.getChannel('web_channel', true);
    const preview = interaction.options.getBoolean('preview') ?? false;
    welcomeSettings.set(interaction.guildId, {
      channelId: channel.id,
      webChannelId: webChannel.id
    });
    try {
      if (preview) {
        await channel.send(`**Welcome preview**\n${buildWelcomeMessage(interaction.member, webChannel.id)}`);
      }
      await interaction.reply({
        content: `Random cozy welcomes are enabled in ${channel}. New members will be mentioned there${preview ? ', and the preview was sent.' : '.'}`,
        ephemeral: true
      });
    } catch (error) {
      console.error(error.message);
      await interaction.reply({ content: 'The welcome settings were saved, but I could not send the preview. Check my permissions in the selected channel.', ephemeral: true });
    }
    return;
  }

  if (interaction.commandName === 'announce') {
    const channel = interaction.options.getChannel('channel', true);
    const template = interaction.options.getString('template');
    const customMessage = interaction.options.getString('message');
    if (!template && !customMessage) {
      await interaction.reply({ content: 'Choose a template, write a custom message, or both.', ephemeral: true });
      return;
    }

    const announcementTemplate = announcementTemplates[template];
    const title = announcementTemplate?.title || '🌸・Announcement!・🌸';
    const body = customMessage || announcementTemplate?.body;
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(body)
      .setColor(0xff9fcf)
      .setFooter({ text: announcementFooter });
    try {
      await channel.send({ embeds: [embed] });
      await interaction.reply({ content: `Announcement sent to ${channel}.`, ephemeral: true });
    } catch (error) {
      console.error(error.message);
      await interaction.reply({ content: 'I could not send that announcement. Check my permissions in the selected channel.', ephemeral: true });
    }
    return;
  }

  const channel = interaction.options.getChannel('channel') || interaction.channel;
  const messageId = interaction.options.getString('message_id');
  const message = interaction.options.getString('message');
  const reactions = parseReactionList(interaction.options.getString('reactions') || '');
  const images = ['image1', 'image2', 'image3', 'image4', 'image5']
    .map(name => interaction.options.getAttachment(name))
    .filter(Boolean);

  if (!message && images.length === 0) {
    await interaction.reply({ content: 'Add a message, at least one image, or both.', ephemeral: true });
    return;
  }

  if (reactions.length > 4) {
    await interaction.reply({ content: 'You can add up to four reactions, separated by commas.', ephemeral: true });
    return;
  }

  if (images.some(image => !image.contentType?.startsWith('image/') && !image.contentType?.startsWith('video/'))) {
    await interaction.reply({ content: 'Every uploaded file must be an image or video.', ephemeral: true });
    return;
  }
  await interaction.deferReply({ ephemeral: true });
  try {
    const replyOptions = {
      content: message || undefined,
      files: images.map(image => ({ attachment: image.url, name: image.name }))
    };
    let sentMessage;
    if (messageId) {
      const targetMessage = await channel.messages.fetch(messageId);
      sentMessage = await targetMessage.reply(replyOptions);
    } else {
      sentMessage = await channel.send(replyOptions);
    }
    for (const reaction of reactions) {
      await sentMessage.react(reaction).catch(error => {
        console.error(`Could not add reaction ${reaction}:`, error.message);
      });
    }
  } catch (error) {
    console.error(error.message);
    await interaction.editReply({ content: 'I could not send that message. Check my permissions in the selected channel.' }).catch(() => {});
    return;
  }

  await interaction.deleteReply().catch(() => {});
});

client.on(Events.GuildMemberAdd, async member => {
  const setting = welcomeSettings.get(member.guild.id);
  if (!setting) return;

  const channel = member.guild.channels.cache.get(setting.channelId);
  if (!channel) return;

  try {
    await channel.send(buildWelcomeMessage(member, setting.webChannelId));
  } catch (error) {
    console.error('Could not send welcome message:', error.message);
  }
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;

  const deleteSetting = message.guildId ? deleteChannelSettings.get(message.guildId) : null;
  if (deleteSetting?.channelId === message.channelId) {
    await message.delete().catch(error => {
      console.error('Could not delete triggering message:', error.message);
    });
    const warning = await message.channel.send(`${message.author} ${deleteSetting.warning}`).catch(error => {
      console.error('Could not send deletion warning:', error.message);
      return null;
    });
    setTimeout(async () => {
      await warning?.delete().catch(error => {
        console.error('Could not delete deletion warning:', error.message);
      });
    }, 5000);
    return;
  }

  await applyAutomaticReactions(message);

  const botMention = new RegExp(`<@!?${client.user.id}>`);
  const wasMentioned = botMention.test(message.content);

  if (wasMentioned) {
    const prompt = message.content.replace(botMention, '').trim();
    try {
      const reply = await getAiReply(prompt || message.content, message.author.id);
      await message.reply(reply);
      return;
    } catch (error) {
      console.error('Could not reply with AI:', error.message);
    }
  }

  const translationSetting = message.guildId ? translationSettings.get(message.guildId) : null;
  const translationChannel = translationSetting?.enabled
    ? message.guild.channels.cache.get(translationSetting.channelId)
    : null;
  if (translationChannel && message.content.trim()) {
    try {
      const translation = await translateToEnglish(message.content);
      if (translation) {
        const embed = new EmbedBuilder()
          .setColor(0x9b59b6)
          .setTitle('🌐 Translation')
          .setDescription(`Message from <@${message.author.id}>`)
          .addFields(
            { name: 'Original', value: message.content.length > 1024 ? `${message.content.slice(0, 1021)}...` : message.content || 'No text provided.', inline: false },
            { name: 'Translated to English', value: translation.translatedText.length > 1024 ? `${translation.translatedText.slice(0, 1021)}...` : translation.translatedText, inline: false }
          )
          .setTimestamp();
        await translationChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Could not translate message:', error.message);
    }
  }

  if (message.author.id !== specialUserId) return;

  const normalizedMessage = message.content
    .toLowerCase()
    .replace(/[!?.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!specialKeywords.some(keyword => keyword.test(normalizedMessage))) return;

  if (/\bi miss you\b[\s,!?]*\bfendi\b|\bfendi\b[\s,!?]*\bi miss you\b/.test(normalizedMessage)) {
    const reply = missYouReplies[Math.floor(Math.random() * missYouReplies.length)];
    await message.reply(reply);
    return;
  }

  const reply = specialReplies[Math.floor(Math.random() * specialReplies.length)];
  await message.reply(reply);
});

await hydrateSettingsFromDisk();
client.login(token);
