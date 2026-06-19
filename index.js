require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");

const {
  joinVoiceChannel,
  entersState,
  VoiceConnectionStatus,
  getVoiceConnection,
} = require("@discordjs/voice");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;

let isTryingToJoin = false;

const commands = [
  new SlashCommandBuilder()
    .setName("join")
    .setDescription("Summon the AFK Bot to its assigned voice channel."),

  new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Make the AFK Bot leave the voice channel."),

  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Check the AFK Bot voice connection status."),
].map((command) => command.toJSON());

async function registerSlashCommands() {
  try {
    if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
      console.log("Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_ID in .env");
      return;
    }

    const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

    console.log("Registering slash commands...");

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("Slash commands registered.");
  } catch (error) {
    console.log("Failed to register slash commands.");
    console.log(error);
  }
}

async function joinPermanentVoice() {
  if (isTryingToJoin) {
    console.log("Already trying to join. Skipping duplicate attempt.");
    return false;
  }

  isTryingToJoin = true;

  try {
    if (!GUILD_ID || !VOICE_CHANNEL_ID) {
      console.log("Missing GUILD_ID or VOICE_CHANNEL_ID in .env");
      return false;
    }

    const guild = await client.guilds.fetch(GUILD_ID);
    const channel = await guild.channels.fetch(VOICE_CHANNEL_ID);

    if (!channel || !channel.isVoiceBased()) {
      console.log("Voice channel not found or invalid.");
      return false;
    }

    console.log(`Trying to join voice channel: ${channel.name}`);

    const existingConnection = getVoiceConnection(GUILD_ID);

    if (existingConnection) {
      console.log("Existing voice connection found. Destroying old connection first.");
      existingConnection.destroy();
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,

      // Bot joins deafened and muted
      selfDeaf: true,
      selfMute: true,
    });

    connection.on("stateChange", (oldState, newState) => {
      console.log(`Voice state changed: ${oldState.status} -> ${newState.status}`);
    });

    connection.on("error", (error) => {
      console.log("Voice connection error:");
      console.log(error);
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

    console.log(`Bot is fully connected to: ${channel.name}`);
    return true;
  } catch (error) {
    console.log("Failed to fully join voice channel.");
    console.log(error.message);
    return false;
  } finally {
    isTryingToJoin = false;
  }
}

function leaveVoice() {
  const connection = getVoiceConnection(GUILD_ID);

  if (!connection) {
    return false;
  }

  connection.destroy();
  return true;
}

client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  console.log("Servers the bot is in:");
  client.guilds.cache.forEach((guild) => {
    console.log(`${guild.name} - ${guild.id}`);
  });

  await registerSlashCommands();

  console.log("Bot is ready. Use /join in Discord to summon it.");
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "join") {
    await interaction.deferReply({ ephemeral: true });

    const joined = await joinPermanentVoice();

    if (joined) {
      await interaction.editReply("AFK Bot joined the assigned voice channel.");
    } else {
      await interaction.editReply("Failed to join the voice channel. Check permissions or channel ID.");
    }
  }

  if (interaction.commandName === "leave") {
    const left = leaveVoice();

    if (left) {
      await interaction.reply({ content: "AFK Bot left the voice channel.", ephemeral: true });
    } else {
      await interaction.reply({ content: "AFK Bot is not connected to a voice channel.", ephemeral: true });
    }
  }

  if (interaction.commandName === "status") {
    const connection = getVoiceConnection(GUILD_ID);

    if (!connection) {
      await interaction.reply({ content: "AFK Bot is online but not connected to voice.", ephemeral: true });
      return;
    }

    await interaction.reply({
      content: `AFK Bot voice status: ${connection.state.status}`,
      ephemeral: true,
    });
  }
});

client.on("error", (error) => {
  console.log("Discord client error:");
  console.log(error);
});

process.on("unhandledRejection", (error) => {
  console.log("Unhandled promise rejection:");
  console.log(error);
});

client.login(DISCORD_TOKEN);