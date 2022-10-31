const client = require('../bot.js');
const fs = require('fs');
const path = require('path');

module.exports = () => {
	console.log('[Main] Loading slash commands...');
	const commandsPath = path.join(__dirname, '../commands/slash/');
	fs.readdirSync(commandsPath).forEach((dir) => {
		const commandFiles = fs.readdirSync(path.join(commandsPath, dir)).filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			let command
			try {
				command = require(path.join(commandsPath, dir, file))(client);
			} catch (error) {
				command = require(path.join(commandsPath, dir, file))
			}
			client.slash.set(command.data.name, command);
			console.log(`\t[*] ${command.data.name} loaded.`);
		}
	});
	console.log('[Main] Slash commands loaded.');
}