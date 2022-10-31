const mongoose = require('mongoose');
const { MongoDB } = require('../config.json');
const { user, password, cluster, database} = MongoDB;

module.exports = () => {
    mongoose.connect(`mongodb+srv://${user}:${password}@${cluster}.mongodb.net/${database}?retryWrites=true&w=majority`, {});
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        console.log('[Main] Connected to MongoDB.');
    });
};
