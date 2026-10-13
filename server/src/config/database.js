import mongoose from 'mongoose';
import net from 'net';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { config, isLocalhostMongoUri, validateMongoUri } from './environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sanitizeMongoError = (message = '') =>
  String(message || 'Database connection error')
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"']+/gi, '[REDACTED_MONGODB_URI]')
    .replace(/:\/\/([^:]+):([^@]+)@/g, '://[REDACTED_USER]:[REDACTED_PASS]@')
    .replace(/(?:password|pwd)=[^&\s]+/gi, 'password=[REDACTED]');

export const extractSafeClusterHost = (uri = '') => {
  if (!uri) return 'unspecified';
  const match = uri.match(/@([^/?#:]+)/);
  if (match) return match[1];
  const localMatch = uri.match(/^mongodb:\/\/(?:[^@]+@)?([^/?#:]+)/);
  if (localMatch) return localMatch[1];
  return 'configured host';
};

export const diagnoseMongoError = (error, uri = '') => {
  const host = extractSafeClusterHost(uri);
  const rawMsg = error?.message || '';
  const errCode = error?.code;
  const errName = error?.name;
  const codeName = error?.codeName;

  // 1. Missing environment variables / configuration
  if (/missing/i.test(rawMsg)) {
    return {
      category: 'MISSING_CONFIGURATION',
      summary: 'MONGODB_URI environment variable is missing.',
      action: 'Configure MONGODB_URI (your MongoDB Atlas connection string) in Render Dashboard -> Environment Variables.'
    };
  }

  if (/Invalid MONGODB_URI|placeholder|Localhost MongoDB URI is not allowed/i.test(rawMsg)) {
    return {
      category: 'INVALID_CONFIGURATION',
      summary: sanitizeMongoError(rawMsg),
      action: 'Ensure MONGODB_URI is a valid MongoDB Atlas connection string (mongodb+srv://...) in Render Dashboard.'
    };
  }

  // 2. DNS / SRV resolution failure
  if (
    errCode === 'ENOTFOUND' ||
    errCode === 'ESERVFAIL' ||
    errCode === 'ETIMEOUT' ||
    /querySrv|getaddrinfo|ENOTFOUND/i.test(rawMsg)
  ) {
    return {
      category: 'DNS_SRV_RESOLUTION_FAILURE',
      summary: `Failed to resolve DNS/SRV record for MongoDB Atlas host "${host}".`,
      action: `Verify the cluster hostname in MONGODB_URI on Render (e.g. cluster0.xxxx.mongodb.net) and verify DNS resolution.`
    };
  }

  // 3. Authentication failure
  if (
    errCode === 8000 ||
    codeName === 'AtlasError' ||
    codeName === 'AuthenticationFailed' ||
    /bad auth|authentication failed/i.test(rawMsg)
  ) {
    return {
      category: 'AUTHENTICATION_FAILURE',
      summary: `MongoDB Atlas rejected database credentials for host "${host}".`,
      action: 'Check MongoDB Atlas -> Database Access. Verify username and password match MONGODB_URI on Render. Ensure special characters in password are URL-encoded.'
    };
  }

  // 4. Server Selection / Network Timeout (IP Whitelist / Firewall block)
  if (
    errName === 'MongoServerSelectionError' ||
    errName === 'MongooseServerSelectionError' ||
    /could not connect to any servers|server selection timed out|ETIMEDOUT|ECONNREFUSED/i.test(rawMsg)
  ) {
    let shardInfo = '';
    if (error?.reason?.servers && error.reason.servers.size > 0) {
      const serverNames = Array.from(error.reason.servers.keys());
      shardInfo = ` Discovered nodes: [${serverNames.join(', ')}].`;
    }
    return {
      category: 'SERVER_SELECTION_NETWORK_TIMEOUT',
      summary: `Could not connect to any servers in MongoDB Atlas cluster "${host}" within timeout.${shardInfo}`,
      action: 'CRITICAL: In MongoDB Atlas, go to "Network Access" -> "+ Add IP Address" -> choose "Allow Access from Anywhere" (0.0.0.0/0). Render uses dynamic cloud IPs; without 0.0.0.0/0, Atlas will block all Render connections.'
    };
  }

  // 5. TLS / SSL handshake failure
  if (/tls|ssl|handshake|certificate/i.test(rawMsg)) {
    return {
      category: 'TLS_HANDSHAKE_FAILURE',
      summary: `TLS/SSL handshake failed when connecting to Atlas cluster "${host}".`,
      action: 'Verify Node.js TLS/SSL configuration and ensure TLS 1.2+ is supported.'
    };
  }

  return {
    category: 'DATABASE_CONNECTION_ERROR',
    summary: sanitizeMongoError(rawMsg),
    action: 'Inspect MongoDB Atlas cluster status and verify MONGODB_URI in Render Dashboard.'
  };
};

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
  const logPath = path.join(dbPath, 'mongod.log');

  console.log('[Database] Local MongoDB service on 127.0.0.1:27017 is stopped. Starting local MongoDB daemon...');
  const cmdLine = `"${mongodBin}" --dbpath "${dbPath}" --logpath "${logPath}" --logappend --bind_ip 127.0.0.1 --port ${port} --setParameter diagnosticDataCollectionEnabled=false`;

  try {
    const psScript = `$s = New-CimInstance -ClassName Win32_ProcessStartup -Property @{ CreateFlags = [uint32]8; ShowWindow = [uint16]0 } -ClientOnly; Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = '${cmdLine.replace(/'/g, "''")}'; ProcessStartupInformation = $s } | Out-Null`;
    const ps = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', psScript],
      { detached: true, stdio: 'ignore', windowsHide: true }
    );
    ps.unref();
  } catch {
    try {
      const child = spawn(
        mongodBin,
        [
          '--dbpath',
          dbPath,
          '--logpath',
          logPath,
          '--logappend',
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
  }

  for (let i = 0; i < 30; i++) {
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
    const diagnosis = diagnoseMongoError(validationError, rawUri);
    console.error(`[Database Error] Category: [${diagnosis.category}]`);
    console.error(`[Database Error] Details: ${diagnosis.summary}`);
    console.error(`[Database Error] Recommended Action: ${diagnosis.action}`);
    const safeMsg = sanitizeMongoError(validationError.message);
    const sanitizedError = new Error(safeMsg);
    sanitizedError.diagnosis = diagnosis;
    throw sanitizedError;
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
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 30000,
      socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS) || 45000,
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 20,
      minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE) || 1,
      retryWrites: true,
      w: 'majority',
      ...(explicitDbMatch ? {} : { dbName: targetDbName })
    };

    const conn = await mongoose.connect(uri, connectOptions);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    const diagnosis = diagnoseMongoError(error, uri);
    console.error(`[Database Error] Category: [${diagnosis.category}]`);
    console.error(`[Database Error] Details: ${diagnosis.summary}`);
    console.error(`[Database Error] Recommended Action: ${diagnosis.action}`);
    const safeMessage = sanitizeMongoError(error.message);
    const sanitizedError = new Error(safeMessage);
    sanitizedError.diagnosis = diagnosis;
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


