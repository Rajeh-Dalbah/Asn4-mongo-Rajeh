const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    console.log('✅ MongoDB already connected');
    return;
  }

  try {
    const conn = await mongoose.connect(
      "mongodb+srv://dalbahrajeh:humber@cluster0.b7ssrq.mongodb.net/moviesDB",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000
      }
    );
    isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

module.exports = connectDB;


/*
module.exports = {
  url: "mongodb+srv://dalbahrajeh:humber@cluster0.b7rssrq.mongodb.net/moviesDB?retryWrites=true&w=majority&appName=Cluster0"
};
*/