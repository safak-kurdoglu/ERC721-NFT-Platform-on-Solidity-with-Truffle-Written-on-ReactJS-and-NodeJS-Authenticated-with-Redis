const mongoose = require('mongoose');

const NFTSchema = new mongoose.Schema({
    NFTid: {
        type: Number,
        require: true,
        unique: true
    },
    name: {
        type: String,
        require: true        
    },
    imageURL: {
        type: String,
        require: true         
    },
    power: {
        type: Number,
        require: true
    },
    owner: {
        type: String,
        require: true
    }
});

module.exports = mongoose.model('NFT', NFTSchema);