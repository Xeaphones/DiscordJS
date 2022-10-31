const { SlashCommandBuilder,EmbedBuilder,ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { RepeatMode,SearchResultType } = require("distube");
const lyricsFinder = require('lyrics-finder');
const translate = require('translate');

const parseDur = (s) => {
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    const min = Math.floor((s / 60) % 60).toString().padStart(2, '0');
    const hrs = Math.floor((s / 3600) % 60).toString().padStart(2, '0');
    return `${hrs}:${min}:${sec}`;
}

const playingEmbed = async (interaction,queue) => {
    const songs = queue.songs
    const song = songs[songs.length - 1]
    const embed = new EmbedBuilder()
        .setDescription(`**[${song.name}](${song.url})**`)
        .setColor(0x00FF00)
        .addFields(
            { name: 'Duration', value: song.formattedDuration, inline: true },
            { name: 'Channel', value: song.uploader.name, inline: true },)
        .setThumbnail(song.thumbnail)
        .setFooter({ text: `Requested by ${interaction.member.displayName}` })
    if (songs.length == 1) {
        embed.setTitle("Now playing:")
    } else {
        embed.setTitle("Added to queue:")
        const timeUntil = songs.slice(0, songs.length - 1).reduce((acc, song) => acc + song.duration, 0) - queue.currentTime
        embed.addFields(
            { name: `\u200b`, value: `\u200b`, inline: true },
            { name: "Estimated Time until playing", value: `${parseDur(timeUntil)}`, inline: true },
            { name: "Position in queue", value: `${songs.length - 1}`, inline: true })
    }
    return { embeds: [embed] }
}

const play = async (interaction,client) => {
    const name = interaction.options.getString('name');
    const { channel } = interaction.member.voice;
    if (!channel) return interaction.reply({ content: 'You need to join a voice channel first!', ephemeral: true });
    await interaction.reply(`searching for \`${name}\``);
    client.player.play(channel,name,{ 
        member: interaction.member,
        textChannel: interaction.channel,
        interaction})
        .then(async () => {
        const queue = client.player.getQueue(interaction.guild.id);
        
        await interaction.editReply(await playingEmbed(interaction,queue));
    });
}

const join = async (interaction,client) => {
    const { channel } = interaction.member.voice;
    const player = client.player.voices.get(interaction.guild.id);
    if (!channel) return interaction.reply({ content: 'You need to join a voice channel first!', ephemeral: true });
    if (!player) return interaction.reply({ content: 'I\'m not in a voice channel!', ephemeral: true });
    player.join(channel);
    await interaction.reply(`Joined ${channel.name}`);
}

const leave = async (interaction,client) => {
    const player = client.player.voices.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'I\'m not in a voice channel!', ephemeral: true });
    player.leave();
    await interaction.reply('Left the channel: ' + interaction.guild.channels.cache.get(player.channelId).name);
}

const pause = async (interaction,client) => {
    const player = client.player.voices.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'I\'m not in a voice channel!', ephemeral: true });
    client.player.pause(interaction.guild.id);
    await interaction.reply('Paused the current song.');
}

const resume = async (interaction,client) => {
    const player = client.player.voices.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'I\'m not in a voice channel!', ephemeral: true });
    client.player.resume(interaction.guild.id);
    await interaction.reply('Resumed the current song.');
}

const skip = async (interaction,client) => {
    const player = client.player.voices.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'I\'m not in a voice channel!', ephemeral: true });

    client.player.skip(interaction.guild.id).catch((error) => {
        return interaction.reply({ content: 'There is no song to skip!', ephemeral: true });
    });
    await interaction.reply('Skipped current song.')
}

const queue = async (interaction,client) => {
    const player = client.player.voices.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'I\'m not in a voice channel!', ephemeral: true });
    const queue = client.player.getQueue(interaction.guild.id);
    const songs = queue.songs;
    if (songs.length <= 1) return interaction.reply({ content: 'There are no songs in the queue!', ephemeral: true });
    let message = `\`1.\` **[${songs[1].name}](${songs[1].url}) - ${songs[1].formattedDuration}**`;
    message += songs.map((song, index) => {
        if (index > 1) { return `\`${index}.\` **[${song.name}](${song.url}) - ${song.formattedDuration}**` }
    }).join('\n');
    const embed = new EmbedBuilder()
        .setTitle('Current Queue')
        .setColor(0x00FF00)
        .setDescription(message)

    await interaction.reply({ embeds: [embed] });
}

const jump = async (interaction,client) => {
    const player = client.player.voices.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'I\'m not in a voice channel!', ephemeral: true });
    const number = interaction.options.getInteger('number');
    const queue = client.player.getQueue(interaction.guild.id);
    const songs = queue.songs;
    const song = songs[number];
    if (number > songs.length) return interaction.reply({ content: 'That song is not in the queue!', ephemeral: true });
    client.player.jump(interaction.guild.id, number);
    await interaction.reply(`Jumped to song \`${song.name}\``);
}

const remove = async (interaction,client) => {
    const player = client.player.voices.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'I\'m not in a voice channel!', ephemeral: true });
    const number = interaction.options.getInteger('number');
    const queue = client.player.getQueue(interaction.guild.id);
    const songs = queue.songs;
    const song = songs[number];
    if (number > songs.length) return interaction.reply({ content: 'That song is not in the queue!', ephemeral: true });
    queue.songs = songs.filter((song, index) => index !== number);
    await interaction.reply(`Removed song \`${song.name}\``);
}

const infoEmbed = async (queue) => {
    const songs = queue.songs;
    const song = songs[0];
    const progress = Math.round((queue.currentTime / song.duration) * 20);
    const progressBar = '▬'.repeat(progress) + '🔘' + '▬'.repeat(20 - progress);
    const repeatMode = queue.repeatMode ? queue.repeatMode === 2 ? 'Repeat Queue' : 'Repeat Song' : 'Off';
    const embed = new EmbedBuilder()
        .setTitle(`Now playing:`)
        .setColor(0x00FF00)
        .setDescription(`**[${song.name}](${song.url})**`)
        .addFields(
            { name: 'Duration', value: song.formattedDuration, inline: true },
            { name: 'Channel', value: `[${song.uploader.name}](${song.uploader.url})`, inline: true },
            { name: 'Looping', value: repeatMode, inline: true },
            { name: 'Likes', value: `${song.likes}`, inline: true },
            { name: 'Views', value: `${song.views}`, inline: true },
            { name: 'Playback position', value: `${queue.formattedCurrentTime} [${progressBar}] ${song.formattedDuration}` },
            { name: 'Next song', value: `${songs[1] !== undefined ? `[${songs[1].name}](${songs[1].url})` : 'Nothing next in queue'}` }
        )
        .setThumbnail(song.thumbnail)
        .setFooter({ text: `Requested by ${song.member.displayName}` })
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('play')
                .setLabel('▶️')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('pause')
                .setLabel('⏸️')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('restart')
                .setLabel('⏮️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('loop')
                .setLabel('🔁')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('skip')
                .setLabel('⏭️')
                .setStyle(ButtonStyle.Primary),
        )
    return { embeds: [embed], components: [row] };
}

const info = async (interaction,client) => {
    const player = client.player.voices.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'I\'m not in a voice channel!', ephemeral: true });
    const queue = client.player.getQueue(interaction.guild.id);
    await interaction.reply(await infoEmbed(queue));
    const collector = interaction.channel.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 60000 });
    collector.on('collect', async i => {
        if (i.customId === 'play') {
            client.player.resume(interaction.guild.id);
        } else if (i.customId === 'pause') {
            client.player.pause(interaction.guild.id);
        } else if (i.customId === 'restart') {
            client.player.seek(interaction.guild.id, 0);
        } else if (i.customId === 'skip') {
            const songs = queue.songs;
            if (songs.length <= 1) return interaction.followUp({ content: 'There are no songs in the queue!', ephemeral: true });
            client.player.skip(interaction.guild.id);
        } else if (i.customId === 'loop') {
            client.player.setRepeatMode(interaction.guild.id, RepeatMode.SONG);
        }
        await i.deferUpdate();
        if (i.customId === 'skip') {
            setTimeout(() => { }, 5000);
        }
        const newqueue = client.player.getQueue(interaction.guild.id);
        await i.editReply(await infoEmbed(newqueue));
    });
}

const lyrics = async (interaction,client) => {
    const player = client.player.voices.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'I\'m not in a voice channel!', ephemeral: true });
    await interaction.deferReply();
    const queue = client.player.getQueue(interaction.guild.id);
    const songs = queue.songs;
    const song = songs[0];
    let name = "";
    let uploader = "";
    if (song.name.includes('-')) {
        name = song.name.split('-')[1].trim();
        uploader = song.name.split('-')[0].trim();
    } else {
        name = song.name;
        uploader = song.uploader.name;
    }
    name = await translate(name.split('／')[0].split('/')[0].replace(/\(.*?\)|\[.*?\]/g, ''), { to: 'en' });
    uploader = await translate(uploader.split('／')[0].split('/')[0].replace(/\(.*?\)|\[.*?\]/g, ''), { to: 'en' });

    console.log(name,"\n",uploader);
    const lyrics = await lyricsFinder(uploader, name);
    if (!lyrics) return interaction.editReply({ content: 'No lyrics found!', ephemeral: true });
    const embed = new EmbedBuilder()
        .setTitle(`Lyrics for ${song.name}`)
        .setDescription(`\`\`\`${lyrics}\`\`\``)
        .setColor(0x00FF00)
    await interaction.editReply({ embeds: [embed] });
}

const loop = async (interaction,client) => {
    const player = client.player.voices.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'I\'m not in a voice channel!', ephemeral: true });
    const option = interaction.options.getString('mode');
    const queue = client.player.getQueue(interaction.guild.id);
    if (option === 'song') {
        client.player.setRepeatMode(interaction.guild.id, RepeatMode.SONG);
        await interaction.reply({ content: 'Looping song!', ephemeral: true });
    }
    if (option === 'queue') {
        client.player.setRepeatMode(interaction.guild.id, RepeatMode.QUEUE);
        await interaction.reply({ content: 'Looping queue!', ephemeral: true });
    }
    if (option === 'off') {
        client.player.setRepeatMode(interaction.guild.id, RepeatMode.DISABLED);
        await interaction.reply({ content: 'Looping disabled!', ephemeral: true });
    }
}

const shuffle = async (interaction,client) => {
    const player = client.player.voices.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'I\'m not in a voice channel!', ephemeral: true });
    client.player.shuffle(interaction.guild.id);
    await interaction.reply({ content: 'Shuffled queue!', ephemeral: true });
}

const autoplay = async (interaction,client) => {
    const player = client.player.voices.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'I\'m not in a voice channel!', ephemeral: true });
    const state = client.player.toggleAutoplay(interaction.guild.id);
    await interaction.reply({ content: `Autoplay is now ${state ? 'enabled' : 'disabled'}!`, ephemeral: true });
}

const search = async (interaction,client) => {
    const { channel } = interaction.member.voice;
            if (!channel) return interaction.reply({ content: 'You need to be in a voice channel!', ephemeral: true });
            const query = interaction.options.getString('name');
            const results = await client.player.search(query, { requestedBy: interaction.user, limit: 5, type: SearchResultType.VIDEO });
            if (!results || results.length === 0) return interaction.reply({ content: 'No results found!', ephemeral: true });
            const embed = new EmbedBuilder()
                .setTitle(`Search results for ${query}`)
                .setColor(0x00FF00)
                .setDescription(results.map((song, i) => {
                    return `${i + 1}. [${song.name}](${song.url}) - ${song.formattedDuration}`;
                }).join('\n'))
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('1')
                        .setLabel('1')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('2')
                        .setLabel('2')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('3')
                        .setLabel('3')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('4')
                        .setLabel('4')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('5')
                        .setLabel('5')
                        .setStyle(ButtonStyle.Primary)
                );
            await interaction.reply({ embeds: [embed], components: [row] });
            const filter = i => i.customId >= 1 && i.customId <= 5 && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });
            collector.on('collect', async i => {
                await i.update({ embeds: [embed], components: [] });
                const Song = results[parseInt(i.customId) - 1];
                client.player.play(channel, Song.url).then(async () => {
                const queue = client.player.getQueue(interaction.guild.id);
                await interaction.followUp(await playingEmbed(interaction,queue));
                });
            });
}

module.exports = {
    data: new SlashCommandBuilder()
    .setName('player')
    .setDescription('Control the music player.')
    .setDMPermission(false)
    .addSubcommand(subcommand =>
        subcommand
            .setName('play')
            .setDescription('Play a song.')
            .addStringOption(option => option.setName('name').setDescription('The name of the song/playlist').setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('join')
            .setDescription('Join the voice channel.'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('leave')
            .setDescription('Make the bot leave it\'s current channel.'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('pause')
            .setDescription('Pause the current song.'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('resume')
            .setDescription('Resume the current song.'))
    .addSubcommand(subcommand =>
        subcommand
            .setName("skip")
            .setDescription("Skip the current song."))
    .addSubcommand(subcommand =>
        subcommand
            .setName("queue")
            .setDescription("Show the current queue."))
    .addSubcommand(subcommand =>
        subcommand
            .setName("jump")
            .setDescription("Jump to a specific song in the queue.")
            .addIntegerOption(option => option.setName('number').setDescription('The number of the song in the queue.').setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName("remove")
            .setDescription("Remove a song from the queue.")
            .addIntegerOption(option => option.setName('number').setDescription('The number of the song in the queue.').setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName("info")
            .setDescription("Show information about the current song."))
    .addSubcommand(subcommand =>
        subcommand
            .setName("loop")
            .setDescription("Loop the current song.")
            .addStringOption(option => option.setName('mode').setDescription('The mode of the loop.').setRequired(true)
            .addChoices(
                { name: 'Off', value: 'off' },
                { name: 'Song', value: 'song' },
                { name: 'Queue', value: 'queue' },
            )))
    .addSubcommand(subcommand =>
        subcommand
            .setName("lyrics")
            .setDescription("Show the lyrics of the current song."))
    .addSubcommand(subcommand =>
        subcommand
            .setName("shuffle")
            .setDescription("Shuffle the queue."))
    .addSubcommand(subcommand =>
        subcommand
            .setName("autoplay")
            .setDescription("Toggle autoplay."))
    .addSubcommand(subcommand =>
        subcommand
            .setName("search")
            .setDescription("Search for a song.")
            .addStringOption(option => option.setName('name').setDescription('The name of the song.').setRequired(true))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const client = interaction.client
        switch (subcommand) {
            case 'play':
                play(interaction,client);
                break;
            case 'join':
                join(interaction,client);
                break;
            case 'leave':
                leave(interaction,client);
                break;
            case 'pause':
                pause(interaction,client);
                break;
            case 'resume':
                resume(interaction,client);
                break;
            case 'skip':
                skip(interaction,client);
                break;
            case 'queue':
                queue(interaction,client);
                break;
            case 'jump':
                jump(interaction,client);
                break;
            case 'remove':
                remove(interaction,client);
                break;
            case 'info':
                info(interaction,client);
                break;
            case 'loop':
                loop(interaction,client);
                break;
            case 'lyrics':
                lyrics(interaction,client);
                break;
            case 'shuffle':
                shuffle(interaction,client);
                break;
            case 'autoplay':
                autoplay(interaction,client);
                break;
            case 'search':
                search(interaction,client);
                break;
        }
    },
}