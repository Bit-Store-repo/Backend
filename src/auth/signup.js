require('dotenv').config()

// bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 10;

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

                    bcrypt.genSalt(saltRounds, (err, salt) => {
                        bcrypt.hash(req.body.password, salt, (err, hash) => {
                            const newUser = new User({
                                email: req.body.email,
                                userName: req.body.userName,
                                password: hash,
                                profPic: req.body.profPic,
                            });

                            newUser.save();

                            res.status(200).json(newUser);
                            return;
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

module.exports = auth;