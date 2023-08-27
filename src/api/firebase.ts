import { FirebaseApp, initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { firebaseConfig } from '../../firebase-config';
import { Auth, UserCredential, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';

let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;

const FIRESTORE_EMULATOR_PORT: number = Number.parseInt(process.env.FIREBASE_EMULATOR_FIRESTORE_PORT || '8080');

export function getApp(): FirebaseApp {
    if (app == null) {
        app = initializeApp(firebaseConfig);
    }
    return app;
}

export function getDb(): Firestore {
    if (db == null) {
        if (process !== undefined && process.env !== undefined && process.env.NODE_ENV === 'test') {
            db = getFirestore();
            connectFirestoreEmulator(db, '127.0.0,1', FIRESTORE_EMULATOR_PORT);
        } else {
            db = getFirestore(getApp());
        }
    }
    return db;
}

export function getFirebaseStorage(): FirebaseStorage {
    if (storage == null) {
        storage = getStorage(getApp());
    }
    return storage;
}

export const auth: Auth = getAuth(getApp());

export function signInAuthUserWithEmailAndPassword(email: string, password: string): void | Promise<UserCredential> {
    if (!email || !password) return;
    return signInWithEmailAndPassword(auth, email, password);
}

export function signOutUser(): void {
    signOut(auth);
}
