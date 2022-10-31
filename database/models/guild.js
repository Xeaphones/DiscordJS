const { Schema, model} = require('mongoose');

const guildSchema = new Schema({
    guild_id: {
        type: String,
        required: true,
        unique: true,
    },
    prefix: {
        type: String,
        required: true,
        default: '!',
    },
    playlist: [{
        name: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
        duration: {
            type: Number,
            required: true,
        }
    }]
});

module.exports = model('guild', guildSchema);