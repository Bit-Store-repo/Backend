const mongoose = require('mongoose');

const bdBoi = mongoose.Schema({
    email: String,
    userName: String,
    password: String,
    profPic: String,
});

module.exports = mongoose.model('user', bdBoi);