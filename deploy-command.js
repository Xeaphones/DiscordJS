const fs = require('fs');
const path = require('path');

const { REST, Routes } = require('discord.js');
const config = require('./config.json');
const TOKEN = process.env.TOKEN || config.client.token;
const CLIENT_ID = process.env.CLIENT_ID || config.client.id;

const commands = [];
const commandsPath = path.join(__dirname, 'commands/slash/');
fs.readdirSync(commandsPath).forEach((dir) => {
	const commandFiles = fs.readdirSync(path.join(commandsPath, dir)).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		try {
			const command = require(path.join(commandsPath, dir, file));
			commands.push(command.data.toJSON());
		} catch (error) {
			const command = require(path.join(commandsPath, dir, file))();
			commands.push(command.data.toJSON());
		}
	}
});

const rest = new REST({ version: '10' }).setToken(TOKEN);

rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] })
	.then(() => console.log('Successfully unregistered application commands.'))
	.catch(console.error);

rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
