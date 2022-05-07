// this section can be used to solve login
// related issues like password reset and stuff

require('dotenv').config();

// the library that handles SMTP mails 
const nodemailer = require('nodemailer');

// creds from .env
const userName = process.env.mailUsername;
const mailPassword = process.env.mailPassword;

// instance of nodemailer with our creds
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: userName,
        pass: mailPassword
    }
});

// function that sends the mail
const sendMail = (email, type, secretID) => {
    if (type == 'resetPassword') {
        // type in the content of the mail here
        const url = "http://localhost:3000";

        const mailOptions = {
            from: 'tanunexus9@gmail.com',
            to: email,
            subject: `Reset Password!`,
            text: `Your OTP is ${secretID}`,
        };
        // this takes care of sending the mail
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return "error"
            } else {
                console.log('Email sent: ' + info.response);
                return "Success sending mail"
            }
        });
    }
};

module.exports = sendMail;