require('dotenv').config()

// bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 10;

// uuid
// uuid generates random but unique 16 digit id
const { v4: uuidv4 } = require('uuid');

// redis
const redisClient = require('../dbConnect/redisDB');

// requiring the mail function
const sendMail = require('../authEmail');

const express = require('express');
const auth = express();

// requiring the mongo model
const User = require('../models/userSchema');

const bodyParser = require('body-parser');
auth.use(bodyParser.json());
auth.use(bodyParser.urlencoded({ extended: true }));

auth.post('/', (req, res) => {
    User.find({ email: req.body.email }).exec((err, docs) => {
        if (err) {
            console.log(err);
            res.status(400).json({ message: "server error" });
            return;
        }
        else {
            try {
                if (docs.length == 0) {

                    bcrypt.genSalt(saltRounds, async (err, salt) => {
                        bcrypt.hash(req.body.password, salt, async (err, hash) => {

                            const newUser = new User({
                                email: req.body.email,
                                userName: req.body.userName,
                                password: hash,
                                profPic: req.body.profPic,
                                verified: false
                            });

                            await newUser.save();

                            User.find({ email: req.body.email }).exec(async (err, docs) => {
                                if (err) {
                                    console.log(err);
                                    res.status(400).json({ message: "server error" });
                                    return;
                                }
                                else {
                                    await redisClient.connect();
                                    const redisKey = uuidv4();
                                    const id = docs[0]._id.toString();
                                    await redisClient.set(id, redisKey);
                                    await redisClient.quit();

                                    const userData = {
                                        "_id": docs[0]._id.toString(),
                                        "email": docs[0].email,
                                        "userName": docs[0].userName,
                                        "profPic": docs[0].profPic,
                                        "key": redisKey,
                                        "verified": docs[0].verified
                                    }

                                    res.status(200).json(userData);
                                    return;
                                }
                            });
                        });
                    });
                }
                else {
                    res.status(409).json({ message: "email exists" });
                    return;
                }
            }
            catch {
                res.status(400).json({ message: "server error" });
                return;
            }
        }
    });

});


auth.post('/resendotp', async (req, res) => {
    try {
        await redisClient.connect();

        const forgotKey = Math.floor(100000 + Math.random() * 900000);
        await redisClient.set(req.body.email, forgotKey);

        await redisClient.quit();

        sendMail(req.body.email, 'resetPassword', forgotKey);
        res.status(200).json({ message: `reset email sent to ${req.body.email}` });

    }
    catch (error) {
        console.log(error);
        res.status(400).json({ message: "server error" });
        return;
    }
});

module.exports = auth;