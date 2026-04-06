import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let firebaseAdmin: admin.app.App;

export const initializeFirebaseAdmin = () => {
  if (!firebaseAdmin) {
    // Check if credentials are provided via individual environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    const serviceAccountFile = 'edgebalan-firebase-adminsdk-fbsvc-83507c72cb.json';
    const serviceAccountPath = path.join(process.cwd(), serviceAccountFile);
    
    if (projectId && clientEmail && privateKey) {
      // Initialize with individual fields
      try {
        firebaseAdmin = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
          }),
        });
        console.log('✅ Firebase Admin initialized using individual environment variables');
      } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin with environment variables:', error);
        throw new Error('Invalid Firebase environment configuration');
      }
    } else if (serviceAccountKey) {
      // Initialize with full service account JSON string
      try {
        const credentials = JSON.parse(serviceAccountKey);
        firebaseAdmin = admin.initializeApp({
          credential: admin.credential.cert(credentials),
        });
        console.log('✅ Firebase Admin initialized using FIREBASE_SERVICE_ACCOUNT_KEY JSON string');
      } catch (error) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON string:', error);
        throw new Error('Invalid Firebase JSON configuration');
      }
    } else if (fs.existsSync(serviceAccountPath)) {
      // ... existing file logic ...
      try {
        firebaseAdmin = admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
        });
        console.log(`✅ Firebase Admin initialized using service account file: ${serviceAccountFile}`);
      } catch (error) {
        console.error(`❌ Failed to initialize Firebase Admin from file ${serviceAccountFile}:`, error);
        throw new Error('Failed to initialize Firebase Admin from service account file');
      }
    } else {
      console.error('❌ Firebase configuration is missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.');
      throw new Error('Firebase configuration is missing');
    }
  }
  
  return firebaseAdmin;
};

export const verifyFirebaseToken = async (idToken: string): Promise<admin.auth.DecodedIdToken> => {
  try {
    const app = initializeFirebaseAdmin();
    const decodedToken = await admin.auth(app).verifyIdToken(idToken);
    return decodedToken;
  } catch (error: any) {
    console.error('❌ Error verifying Firebase token:', error.message || error);
    // Provide more specific error message if it's a known Firebase error
    if (error.code === 'auth/id-token-expired') {
      throw new Error('Firebase token has expired');
    } else if (error.code === 'auth/argument-error') {
      throw new Error('Invalid Firebase token format');
    }
    throw new Error('Invalid or expired Firebase token');
  }
};
