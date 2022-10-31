const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { DisTube } = require('distube')
const { SpotifyPlugin } = require("@distube/spotify");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const { YtDlpPlugin } = require("@distube/yt-dlp");
const guild = require('./database/models/guild.js');

const config = require('./config.json');
const TOKEN = process.env.TOKEN || config.client.token;

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds,GatewayIntentBits.MessageContent,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildMessages,GatewayIntentBits.GuildVoiceStates] });
client.player = new DisTube(client, {
	emitNewSongOnly: true, 
	leaveOnEmpty: true, 
	leaveOnFinish: false,
	leaveOnStop: false,
	youtubeCookie: process.env.YOUTUBE_COOKIE || config.MusicPlayer.ytCookie,

	plugins: [new SpotifyPlugin(), new SoundCloudPlugin(), new YtDlpPlugin()]});
module.exports = client;


// Handlers
client.slash = new Collection();

["mongoose","slash","event"].forEach((file) => {
	require(`./handlers/${file}.js`)(client);
	console.log("");
});

client.player.on('error', (channel, e) => {
    if (channel) channel.send(`An error encountered: ${e}`)
    else console.error(e)
})

// Login to Discord with your client's token
client.login(TOKEN);