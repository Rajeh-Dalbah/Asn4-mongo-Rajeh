const mongoose = require('mongoose');
const app = require('../app');

let isConnected = false;

module.exports = async (req, res) => {
  if (!isConnected) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000, 
        maxPoolSize: 10
      });
      isConnected = true;
      console.log('✅ MongoDB connected (Vercel)');
    } catch (err) {
      console.error('❌ MongoDB connection error:', err);
      return res.status(500).json({ error: 'Database connection failed' });
    }
  }

  return app(req, res);
};
