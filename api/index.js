const mongoose = require('mongoose');
const app = require('../app');

let isConnected = false;

module.exports = async (req, res) => {
  if (!isConnected) {
    await mongoose.connect(process.env.MONGODB_URI, { maxPoolSize: 10 });
    isConnected = true;
    console.log('✅ Mongoose connected (Vercel)');
  }
  return app(req, res);
};
