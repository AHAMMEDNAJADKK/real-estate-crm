import mongoose from 'mongoose';
import { config } from './environment.js';

export const connectDB = async (customUri = null) => {
  const uri = customUri || config.mongoUri;
  try {
    const conn = await mongoose.connect(uri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error]: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[Database] MongoDB Connection Closed');
  } catch (error) {
    console.error(`[Database Disconnect Error]: ${error.message}`);
  }
};
