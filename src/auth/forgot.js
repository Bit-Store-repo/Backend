require('dotenv').config()

const express = require('express');
const auth = express();

// bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 10;

// uuid
// uuid generates random but unique 16 digit id
const { v4: uuidv4 } = require('uuid');

// requiring the mail function
const sendMail = require('./authEmail');

// redis
const redisClient = require('../dbConnect/redisDB');

// requiring the mongo model
const User = require('../models/userSchema');

const bodyParser = require('body-parser');
auth.use(bodyParser.json());
auth.use(bodyParser.urlencoded({ extended: true }));

auth.post('/check/:email', (req, res) => {
    User.find({ email: req.params.email }).exec(async (err, docs) => {
        if (err) {
            console.log(err);
            res.status(400).json({ message: "server error" });
            return;
        }
        else {
            try {
                if (docs.length == 0) {
                    res.status(409).json({ message: "user missing" });
                    return;
                }
                else {

                    await redisClient.connect();
                    const forgotKey = Math.floor(100000 + Math.random() * 900000);
                    await redisClient.set(req.params.email, forgotKey);

                    await redisClient.quit();

                    sendMail(req.params.email, 'resetPassword', forgotKey);

                    res.status(200).json({ message: `reset email sent to ${req.body.email}` });
                    return;
                }
            }
            catch (error) {
                console.log(error);
                res.status(400).json({ message: "server error" });
                return;
            }
        }
    });

});

auth.post('/verify', async (req, res) => {
    try {
        await redisClient.connect();
        const otp = await redisClient.get(req.body.email);
        if (otp == null) {
            await redisClient.quit();
            res.status(403).json({ message: "Unauthorized access" });
            return;
        }
        else if (otp == req.body.otp) {
            const secretKey = uuidv4();
            await redisClient.set(req.body.email, secretKey);
            await redisClient.quit();
            res.status(200).json({ message: "OTP correct", secretKey });
            return;
        }
        else {
            await redisClient.quit();
            res.status(403).json({ message: "Unauthorized access" });
            return;
        }
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ message: "server error" });
        return;
    }
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

auth.post('/reset', (req, res) => {
    User.find({ email: req.body.email }).exec(async (err, docs) => {
        if (err) {
            console.log(err);
            res.status(400).json({ message: "server error" });
            return;
        }
        else {
            try {
                if (docs.length == 0) {
                    res.status(409).json({ message: "user missing" });
                    return;
                }
                else {

                    await redisClient.connect();
                    const secretKey = await redisClient.get(req.body.email);

                    if (secretKey == null) {
                        await redisClient.quit();
                        res.status(403).json({ message: "Unauthorized access" });
                        return;
                    }
                    else if (secretKey == req.body.secretKey) {

                        await redisClient.del(req.body.email);
                        await redisClient.quit();

                        const hash = bcrypt.hashSync(req.body.password, saltRounds);
                        const updated = await User.updateOne({ email: req.body.email }, { $set: { password: hash } });
                        res.status(200).json({ message: `password reset` });
                        return;

                    }
                    else {
                        await redisClient.quit();
                        res.status(403).json({ message: "Unauthorized access" });
                    }
                }
            }
            catch (error) {
                console.log(error);
                res.status(400).json({ message: "server error" });
                return;
            }
        }
    });

});

module.exports = auth;