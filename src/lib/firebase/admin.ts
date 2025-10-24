import admin from 'firebase-admin';

function getCredential() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (projectId && clientEmail && privateKey) {
    return admin.credential.cert({ projectId, clientEmail, privateKey: privateKey as string });
  }
  return admin.credential.applicationDefault();
}

const app = admin.apps.length
  ? admin.app()
  : admin.initializeApp({ credential: getCredential() });

export const adminDb = admin.firestore(app);
export const adminAuth = admin.auth(app);
export default app;
