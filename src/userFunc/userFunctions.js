require('dotenv').config()

// bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 10;

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

// file related to images
// filesystem used to store incoming image temporarily on the server
const fs = require("fs");
const { dirname } = require('path');
const appDir = dirname(require.main.filename);

// multer to recieve images
const multer = require('multer');
const upload = multer();

// firebase cloud storage to store images
// Auth..
const firebaseAdmin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const serviceAccount = require('../../fishing-backend-firebase-adminsdk-6suc4-711fa58c49.json');

const admin = firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
});
// firebase bucket
const storageRef = admin.storage().bucket(`gs://fishing-backend.appspot.com`);

// A function that takes care of uploading the image to my firebase storage
async function uploadImage(path, filename) {
    const storage = await storageRef.upload(path, {
        public: true,
        destination: `${filename}`,
        metadata: {
            firebaseStorageDownloadTokens: uuidv4(),
        }
    });
    return storage[0].metadata.mediaLink;
}

auth.post('/verify', async (req, res) => {
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
                    const verifyKey = Math.floor(100000 + Math.random() * 900000);
                    await redisClient.set(req.body.email, verifyKey);

                    await redisClient.quit();

                    sendMail(req.body.email, 'verifyMail', verifyKey);

                    res.status(200).json({ message: `verify email sent to ${req.body.email}` });
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

auth.patch('/verify', (req, res) => {
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
                    else if (secretKey == req.body.otp) {

                        await redisClient.del(req.body.email);
                        await redisClient.quit();

                        const updated = await User.updateOne({ email: req.body.email }, { $set: { verified: true } });
                        res.status(200).json({ message: `email verified` });
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

auth.patch('/profilepic', upload.single('ppic'), async (req, res) => {
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

                    const tempImageName = uuidv4();
                    const tempImage = `${tempImageName}.${req.file.mimetype.split('/')[1]}`
                    fs.writeFileSync(appDir + `/public/images/${tempImage}`, req.file.buffer);
                    const uploadLink = await uploadImage(appDir + `/public/images/${tempImage}`, `profilePics/${tempImage}`);

                    // deleting the image
                    fs.stat(appDir + `/public/images/${tempImage}`, function (err, stats) {
                        if (err) {
                            res.status(400).json({ message: "server error while checking for image validity" });
                        }

                        // deleting the file
                        fs.unlink(appDir + `/public/images/${tempImage}`, function (err) {
                            if (err) res.status(400).json({ message: "server error while deleting the image" });
                            console.log('file deleted successfully');
                        });
                    });

                    const updated = await User.updateOne({ email: req.body.email }, { $set: { profPic: uploadLink } });
                    res.status(200).json({ message: `image updated` });
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

auth.patch('/username', async (req, res) => {
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
                    const updated = await User.updateOne({ email: req.body.email }, { $set: { userName: req.body.userName } });
                    res.status(200).json({ message: `username updated` });
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

auth.post('/checkpassword', (req, res) => {
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
                        await redisClient.set(req.body.email, redisKey);
                        await redisClient.quit();

                        res.status(200).json({ message: `correct`, key: redisKey });
                        return;
                    }
                    else {
                        res.status(200).json({ message: `incorrect` });
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

auth.patch('/mail', (req, res) => {
    User.find({ email: req.body.newEmail }).exec(async (err, docs) => {
        if (err) {
            console.log(err);
            res.status(400).json({ message: "server error" });
            return;
        }
        else {
            try {
                if (docs.length == 0) {

                    await redisClient.connect();
                    const secretKey = await redisClient.get(req.body.email);

                    if (secretKey == null) {
                        await redisClient.quit();
                        res.status(403).json({ message: "Unauthorized access" });
                        return;
                    }
                    else if (secretKey == req.body.key) {

                        await redisClient.del(req.body.email);
                        await redisClient.quit();

                        const updated = await User.updateOne({ email: req.body.email }, { $set: { email: req.body.newEmail, verified: false } });
                        res.status(200).json({ message: `mail updated` });
                        return;

                    }
                    else {
                        await redisClient.quit();
                        res.status(403).json({ message: "Unauthorized access" });
                    }
                }
                else {
                    res.status(409).json({ message: `email exists` });
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

auth.patch('/password', (req, res) => {
    User.find({ email: req.body.email }).exec(async (err, docs) => {
        if (err) {
            console.log(err);
            res.status(400).json({ message: "server error" });
            return;
        }
        else {
            try {
                if (docs.length == 0) {
                    res.status(409).json({ message: `email exists` });
                }
                else {
                    await redisClient.connect();
                    const secretKey = await redisClient.get(req.body.email);

                    if (secretKey == null) {
                        await redisClient.quit();
                        res.status(403).json({ message: "Unauthorized access" });
                        return;
                    }
                    else if (secretKey == req.body.key) {

                        await redisClient.del(req.body.email);
                        await redisClient.quit();

                        const hash = bcrypt.hashSync(req.body.password, saltRounds);

                        const updated = await User.updateOne({ email: req.body.email }, { $set: { password: hash } });
                        res.status(200).json({ message: `password updated` });
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