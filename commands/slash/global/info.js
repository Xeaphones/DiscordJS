const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Get information about an user, a server or a channel.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('Get information about an user or yourself.')
                .addUserOption(option => option.setName('target').setDescription('The user')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('Get information about the server.')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'user') {
            const user = interaction.options.getUser('target');
            if (user) {
                return interaction.reply(`User's tag: ${user.tag}\nUser's ID: ${user.id}`);
            }
            return interaction.reply(`Your tag: ${interaction.user.tag}\nYour ID: ${interaction.user.id}`);
        } else if (subcommand === 'server') {
            if (!interaction.guild) { return interaction.reply('This command can only be used in a server!'); }
            return interaction.reply(`Server's name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`);
        }
    },
};