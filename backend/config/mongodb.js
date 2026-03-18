import mongoose from "mongoose";

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI not set — skipping MongoDB connection');
    return;
  }
  mongoose.connection.on("connected", () => console.log("Database Connected!"));
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/arogyanidhi`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message || err);
  }
};

export default connectDB;
