const client = require('../bot.js');
const fs = require('fs');
const path = require('path');

module.exports = () => {
    console.log('[Main] Loading events...');
    const eventsPath = path.join(__dirname, '../events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
        console.log(`\t[*] ${event.name} loaded.`);
    }
    console.log('[Main] Events loaded.');
};