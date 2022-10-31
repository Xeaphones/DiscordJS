const { SlashCommandBuilder,EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Flips a coin.'),
    async execute(interaction) {
        const coin = Math.floor(Math.random() * 2);
        const embed = new EmbedBuilder()
            .setTitle(`${coin ? 'Heads' : 'Tails'}`)
            .setColor(0x0099FF)
            .setAuthor({ name: `${interaction.user.tag} Flipped a coin`, iconURL: interaction.user.avatarURL() })
            .setImage(coin ? "https://i.imgur.com/2pl8oi4.png" : 'https://i.imgur.com/jaWFP9T.png')
            .setTimestamp()
        await interaction.reply({ embeds: [embed] });
    },
};