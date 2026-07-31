import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let credential;
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
// Fallback: resolve relative to this file's directory so the path works
// regardless of which directory the server is started from.
const defaultServiceAccountPath = path.join(__dirname, 'secrets', 'firebase-service-account.json');

if (serviceAccountPath) {
  const fullPath = path.resolve(serviceAccountPath);
  if (fs.existsSync(fullPath)) {
    const raw = fs.readFileSync(fullPath, 'utf8');
    credential = admin.cert(JSON.parse(raw));
  } else if (fs.existsSync(defaultServiceAccountPath)) {
    console.warn(`FIREBASE_SERVICE_ACCOUNT_PATH "${fullPath}" not found. Falling back to bundled service account.`);
    const raw = fs.readFileSync(defaultServiceAccountPath, 'utf8');
    credential = admin.cert(JSON.parse(raw));
  } else {
    console.warn(`Firebase service account JSON not found at ${fullPath}. Firebase Admin SDK will not be initialized.`);
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    credential = admin.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
  } catch (err) {
    console.warn('Unable to parse FIREBASE_SERVICE_ACCOUNT_JSON; Firebase Admin SDK will not be initialized.', err.message);
  }
} else {
  try {
    credential = admin.applicationDefault();
  } catch (err) {
    console.warn('Firebase application default credential is not available. Firebase Admin SDK will not be initialized.', err.message);
  }
}

if (credential && !admin.getApps().length) {
  admin.initializeApp({ credential });
  console.info('Firebase Admin initialized.');
} else if (!credential) {
  console.warn('Firebase Admin SDK not initialized; FCM features will be disabled until credentials are configured.');
}

export default admin;
