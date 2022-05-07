require('dotenv').config()

// Using Node.js `require()` to require mongoose
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(
            process.env.MONGOURL,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }
        );

        console.log('MongoDB is Connected...');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};


module.exports = connectDB;