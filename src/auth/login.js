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

auth.post('/', (req, res) => {
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
                    if (bcrypt.compareSync(req.body.password, docs[0].password)) {

                        await redisClient.connect();
                        const redisKey = uuidv4();
                        await redisClient.set(docs[0]._id.toString(), redisKey);

                        const userData = {
                            "_id": docs[0]._id.toString(),
                            "email": docs[0].email,
                            "userName": docs[0].userName,
                            "profPic": docs[0].profPic,
                            "key": docs[0].key,
                            "verified": docs[0].verified
                        }

                        await redisClient.quit();

                        res.status(200).json(userData);
                        return;
                    }
                    else {
                        res.status(403).json({ message: "wrong password" });
                        return;
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