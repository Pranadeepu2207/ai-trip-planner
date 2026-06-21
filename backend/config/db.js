const mongoose = require('mongoose');

let mongoServer;

const connectDB = async () => {
  try {
    let connStr = process.env.MONGO_URI;

    if (!connStr) {
      console.log('No MONGO_URI environment variable detected.');
      console.log('Initializing in-memory MongoDB Server fallback...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        connStr = mongoServer.getUri();
        console.log(`In-memory MongoDB Server successfully started at: ${connStr}`);
      } catch (innerError) {
        console.error('Failed to start in-memory MongoDB Server:', innerError.message);
        console.log('Defaulting back to local MongoDB port');
        connStr = 'mongodb://127.0.0.1:27017/ai-travel-planner';
      }
    } else {
      console.log(`Connecting to MongoDB at: ${connStr.replace(/:[^@]+@/, ':****@')}`);
    }

    const conn = await mongoose.connect(connStr);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
