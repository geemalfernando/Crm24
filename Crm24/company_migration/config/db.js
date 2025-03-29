require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000 // Close sockets after 45s of inactivity
    });
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    // Graceful shutdown for macOS
    process.exit(1);
  }
};

// Handle macOS process termination signals
process.on('SIGTERM', () => {
  mongoose.connection.close();
});

process.on('SIGINT', () => {
  mongoose.connection.close();
});

module.exports = connectDB;