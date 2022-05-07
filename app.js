const express = require('express');
const app = express();
const PORT = 3000 || process.env.PORT;

// requring mongo connect
const mongoConnect = require('./src/dbConnect/connectDB');
mongoConnect();

const signupRouter = require('./src/auth/signup');
const loginRouter = require('./src/auth/login');
app.use('/signup', signupRouter);
app.use('/login', loginRouter);

app.listen(PORT, () => {
    console.log(`app is running on ${PORT}`);
});