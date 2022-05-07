const express = require('express');
const app = express();
const PORT = 3000 || process.env.PORT;

// requring mongo connect
const mongoConnect = require('./src/dbConnect/connectDB');
mongoConnect();

// requring the authentication functionalities
const signupRouter = require('./src/auth/signup');
const loginRouter = require('./src/auth/login');
const logoutRouter = require('./src/auth/logout');
const forgotRouter = require('./src/auth/forgot');
// Using them
app.use('/signup', signupRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/resetpassword', forgotRouter);

// requring the user functionalities
const userRouter = require('./src/userFunc/userFunctions');
app.use('/user', userRouter);

app.listen(PORT, () => {
    console.log(`app is running on ${PORT}`);
});