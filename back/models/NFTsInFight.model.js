const mongoose = require('mongoose');

const NFTSchema = new mongoose.Schema({
    NFTid: {
        type: Number,
        require: true,
        unique: true
    },
    exOwner: {
        type: String,
        require: true
    },
    ownerToSend: {
        type: String
    }
});

module.exports = mongoose.model('NFTsInFight', NFTSchema);