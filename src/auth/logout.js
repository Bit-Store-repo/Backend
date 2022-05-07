require('dotenv').config()

const express = require('express');
const auth = express();

// bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 10;

// uuid
// uuid generates random but unique 16 digit id
const { v4: uuidv4 } = require('uuid');

// redis
const redisClient = require('../dbConnect/redisDB');

// requiring the mongo model
const User = require('../models/userSchema');

const bodyParser = require('body-parser');
auth.use(bodyParser.json());
auth.use(bodyParser.urlencoded({ extended: true }));

auth.get('/:user_id', (req, res) => {
    User.find({ _id: req.params.user_id }).exec(async (err, docs) => {
        if (err) {
            console.log(err);
            res.status(400).json({ message: "server error" });
            return;
        }
        else {
            try {
                if (docs.length == 0) {
                    res.status(403).json({ message: "user missing" });
                    return;
                }
                else {
                    await redisClient.connect();
                    await redisClient.del(req.params.user_id);
                    await redisClient.quit();

                    res.status(200).json({ message: "success" });
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

module.exports = auth;