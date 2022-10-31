const { SlashCommandBuilder } = require('discord.js');
var ffmpeg = require('ffmpeg');
var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
var ffprobePath = require('@ffprobe-installer/ffprobe').path;
var ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('badapple')
        .setDescription('Plays Bad Apple!!')
        .setDMPermission(false),
    async execute(interaction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true })
            return;};
        if (queue) {
            await interaction.editReply({ content: 'Already playing something!'});
            return;
        }
        await interaction.reply({ content: 'Loading Content...'});
        const queue = interaction.client.player.getQueue(interaction.guildId);
        // convert video to gif
        // lenght : 3:39
        ffmpeg("video.mp4")
            .setStartTime('00:00:00')
            .setDuration('00:00:15')
            .output('../../../resources/badapple.gif')
    },
};