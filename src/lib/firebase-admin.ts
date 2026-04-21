import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getMessaging, Messaging } from "firebase-admin/messaging";
import { getAuth, Auth } from "firebase-admin/auth";

let cachedApp: App | null = null;

function getAdminApp(): App {
  if (cachedApp) return cachedApp;
  if (getApps().length > 0) {
    cachedApp = getApps()[0]!;
    return cachedApp;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY env var is not set. Configure it in Vercel to enable admin features."
    );
  }

  const serviceAccount = JSON.parse(raw);
  cachedApp = initializeApp({ credential: cert(serviceAccount) });
  return cachedApp;
}

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get: (_t, prop) => Reflect.get(getFirestore(getAdminApp()), prop),
});

export const adminMessaging: Messaging = new Proxy({} as Messaging, {
  get: (_t, prop) => Reflect.get(getMessaging(getAdminApp()), prop),
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get: (_t, prop) => Reflect.get(getAuth(getAdminApp()), prop),
});
