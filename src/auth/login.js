require('dotenv').config()

const express = require('express');
const auth = express();

// bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 10;

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
                    res.status(409).json({ message: "user missing" });
                    return;
                }
                else {
                    if (bcrypt.compareSync(req.body.password, docs[0].password)) {

                        const userData = {
                            "_id": docs[0]._id,
                            "email": docs[0].email,
                            "userName": docs[0].userName,
                            "profPic": docs[0].profPic,
                        }

                        res.status(200).json(userData);
                        return;
                    }
                    else {
                        res.status(403).json({ message: "invalid password" });
                        return;
                    }
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