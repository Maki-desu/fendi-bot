import 'dotenv/config';
import {
  Client,
  Events,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} from 'discord.js';

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
const translationSettings = new Map();

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

if (!token) {
  console.error('Missing DISCORD_TOKEN. Set it in a .env file before starting the bot.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

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
    .toJSON();
  const rest = new REST({ version: '10' }).setToken(token);

  const commandRoute = guildId
    ? Routes.applicationGuildCommands(readyClient.user.id, guildId)
    : Routes.applicationCommands(readyClient.user.id);
  rest.put(commandRoute, { body: [pingCommand, sendCommand, announceCommand, translateCommand] })
    .then(() => console.log('Registered /ping, /send, /announce, and /translate commands.'))
    .catch(error => console.error('Could not register slash commands:', error.message));
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong! Fendi is up and running smoothly.');
    return;
  }

  if (interaction.commandName === 'translate') {
    const state = interaction.options.getString('state', true);
    translationSettings.set(interaction.guildId, state === 'on');
    await interaction.reply(`Automatic translation to English is now **${state}** for this server.`);
    return;
  }

  if (interaction.commandName !== 'send' && interaction.commandName !== 'announce') return;
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({ content: 'You need Manage Server permission to use this command.', ephemeral: true });
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
  const images = ['image1', 'image2', 'image3', 'image4', 'image5']
    .map(name => interaction.options.getAttachment(name))
    .filter(Boolean);

  if (!message && images.length === 0) {
    await interaction.reply({ content: 'Add a message, at least one image, or both.', ephemeral: true });
    return;
  }

  if (images.some(image => !image.contentType?.startsWith('image/'))) {
    await interaction.reply({ content: 'Every uploaded file must be an image.', ephemeral: true });
    return;
  }
  await interaction.deferReply({ ephemeral: true });
  try {
    const replyOptions = {
      content: message || undefined,
      files: images.map(image => ({ attachment: image.url, name: image.name }))
    };
    if (messageId) {
      const targetMessage = await channel.messages.fetch(messageId);
      await targetMessage.reply(replyOptions);
    } else {
      await channel.send(replyOptions);
    }
  } catch (error) {
    console.error(error.message);
    await interaction.editReply({ content: 'I could not send that message. Check my permissions in the selected channel.' }).catch(() => {});
    return;
  }

  await interaction.deleteReply().catch(() => {});
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;

  if (message.guildId && translationSettings.get(message.guildId) && message.content.trim()) {
    try {
      const translation = await translateToEnglish(message.content);
      if (translation) {
        await message.reply(`**English translation (${translation.detectedLanguage}):** ${translation.translatedText}`);
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

client.login(token);
