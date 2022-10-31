const { SlashCommandBuilder } = require('discord.js');

const roll = (dice, sides) => {
    const rolls = [];
    for (let i = 0; i < dice; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
    }
    return rolls;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Rolls a dice.')
        .addStringOption(option =>
            option.setName('dice')
            .setDescription('format: XdY, example: 2d6')
            .setRequired(true))
        .addIntegerOption(option =>
            option.setName('modifier')
            .setDescription('modifier to add to the result')),
    async execute(interaction) {
        await interaction.reply(`Rolling ${interaction.options.getString('dice')}...`);
        const dice = interaction.options.getString('dice');
        const modifier = interaction.options.getInteger('modifier') || 0;
        const [diceCount, sides] = dice.split('d');
        const rolls = roll(diceCount, sides);
        const total = rolls.reduce((a, b) => a + b) + modifier;
        await interaction.followUp(`(${rolls.join(' + ')}) + ${modifier} = ${total}`);
    },
};