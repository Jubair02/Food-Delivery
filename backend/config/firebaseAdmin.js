import admin from "firebase-admin";
import fs from "fs";

/**
 * Initialises the Firebase Admin SDK exactly once.
 *
 * Credentials are resolved in this order:
 *   1. FIREBASE_SERVICE_ACCOUNT_PATH  → a JSON key file on disk (local dev)
 *   2. FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY  → inline env vars (hosting)
 */
let initialised = false;

export const initFirebaseAdmin = () => {
  if (initialised || admin.apps.length) {
    initialised = true;
    return;
  }

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  let credential;

  if (keyPath && fs.existsSync(keyPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
    credential = admin.credential.cert(serviceAccount);
  } else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Env vars store the newline-containing key as literal "\n" sequences.
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
  } else {
    throw new Error(
      "Firebase Admin credentials missing. Set FIREBASE_SERVICE_ACCOUNT_PATH " +
        "or the FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY trio in .env."
    );
  }

  admin.initializeApp({ credential });
  initialised = true;
  console.log("✅ Firebase Admin initialised");
};

export { admin };
