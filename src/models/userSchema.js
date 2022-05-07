const mongoose = require('mongoose');

const bdBoi = mongoose.Schema({
    email: String,
    userName: String,
    password: String,
    profPic: String,
    key: String,
    verified: Boolean
});

module.exports = mongoose.model('user', bdBoi);