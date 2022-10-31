const { SlashCommandBuilder } = require('discord.js');

const clearMessage = async (interaction, count) => {
    const channel = interaction.channel;
    const messages = await channel.messages.fetch({ limit: count });
    await channel.bulkDelete(messages);
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears messages from a channel')
        .setDMPermission(false)
        .addIntegerOption(option => 
            option.setName('count')
            .setDescription('Number of messages to clear')
            .setRequired(true)),
    async execute(interaction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true })
            return;};
        await interaction.deferReply({ ephemeral: true });
        const count = interaction.options.getInteger('count');
        if (count < 1 || count > 100) {
            await interaction.reply('Count must be between 1 and 100');
            return;
        }
        await clearMessage(interaction, count);
        await interaction.editReply(`Cleared ${count} messages`);
    },
};