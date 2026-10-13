import mongoose from 'mongoose';
import net from 'net';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { config, isLocalhostMongoUri, validateMongoUri } from './environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sanitizeMongoError = (message = '') =>
  String(message || 'Database connection error').replace(
    /mongodb(?:\+srv)?:\/\/[^\s"']+/gi,
    '[REDACTED_MONGODB_URI]'
  );

const checkPortListening = (host, port, timeoutMs = 600) =>
  new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const done = (result) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(result);
      }
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host);
  });

const findLocalMongodBinary = () => {
  if (process.platform !== 'win32') return null;
  const baseDir = 'C:\\Program Files\\MongoDB\\Server';
  if (!fs.existsSync(baseDir)) return null;
  try {
    const versions = fs
      .readdirSync(baseDir)
      .sort()
      .reverse();
    for (const ver of versions) {
      const candidate = path.join(baseDir, ver, 'bin', 'mongod.exe');
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  } catch {
    return null;
  }
  return null;
};

const ensureLocalMongoRunning = async (uri) => {
  if (config.nodeEnv === 'production' || !isLocalhostMongoUri(uri)) {
    return;
  }
  if (process.env.DISABLE_AUTO_LOCAL_MONGO === 'true') {
    return;
  }

  const portMatch = uri.match(/:(\d+)(?:\/|$)/);
  const port = portMatch ? Number(portMatch[1]) : 27017;
  if (port !== 27017) return;

  const isListening = await checkPortListening('127.0.0.1', port);
  if (isListening) return;

  const mongodBin = findLocalMongodBinary();
  if (!mongodBin) return;

  const dbPath = path.resolve(__dirname, '../../.mongodb-data');
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  console.log('[Database] Local MongoDB service on 127.0.0.1:27017 is stopped. Starting local MongoDB daemon...');

  try {
    const child = spawn(
      mongodBin,
      [
        '--dbpath',
        dbPath,
        '--bind_ip',
        '127.0.0.1',
        '--port',
        String(port),
        '--setParameter',
        'diagnosticDataCollectionEnabled=false'
      ],
      {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      }
    );
    child.unref();
  } catch (err) {
    console.warn(`[Database] Failed to auto-start local MongoDB daemon: ${err.message}`);
    return;
  }

  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 300));
    if (await checkPortListening('127.0.0.1', port)) {
      return;
    }
  }
};

export const connectDB = async (customUri = null) => {
  const rawUri = customUri !== null ? customUri : config.mongoUri;
  let uri;
  try {
    uri = validateMongoUri(rawUri, { nodeEnv: config.nodeEnv });
  } catch (validationError) {
    const safeMsg = sanitizeMongoError(validationError.message);
    console.error(`[Database Error]: ${safeMsg}`);
    throw new Error(safeMsg);
  }

  try {
    const explicitDbMatch = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^/?]+)/i);
    const targetDbName = explicitDbMatch
      ? explicitDbMatch[1]
      : (process.env.MONGODB_DB_NAME || 'realestate_crm').trim();

    if (mongoose.connection.readyState === 1) {
      const currentDbName = mongoose.connection.name;
      if (!customUri || currentDbName === targetDbName) {
        return mongoose;
      }
      await mongoose.connection.close();
    } else if (mongoose.connection.readyState === 2) {
      await mongoose.connection.asPromise();
      if (!customUri || mongoose.connection.name === targetDbName) {
        return mongoose;
      }
      await mongoose.connection.close();
    }

    await ensureLocalMongoRunning(uri);

    const connectOptions = {
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000,
      connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS) || 10000,
      socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS) || 45000,
      ...(explicitDbMatch ? {} : { dbName: targetDbName })
    };

    const conn = await mongoose.connect(uri, connectOptions);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    const safeMessage = sanitizeMongoError(error.message);
    console.error(`[Database Error]: ${safeMessage}`);
    const sanitizedError = new Error(safeMessage);
    if (error.code) sanitizedError.code = error.code;
    throw sanitizedError;
  }
};

export const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('[Database] MongoDB Connection Closed');
    }
  } catch (error) {
    console.error(`[Database Disconnect Error]: ${sanitizeMongoError(error.message)}`);
  }
};


