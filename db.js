const mongoose = require("mongoose");

mongoose.set("strictQuery", false); // Prevents deprecation warnings

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    // Retry only for network errors, not authentication errors
    if (error.message.includes("ECONNREFUSED") || error.message.includes("failed to connect")) {
      console.log("Retrying connection in 5 seconds...");
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1); // Stop the process if it's a fatal error
    }
  }
};

// Handle MongoDB disconnection
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected! Attempting to reconnect...");
  connectDB();
});

// Graceful shutdown on server stop
process.on("SIGINT", async () => {
  console.log("🛑 Shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = connectDB;
