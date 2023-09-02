//Firebase modules
import { FirebaseApp, initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, Firestore, getFirestore } from 'firebase/firestore'
import { FirebaseStorage, connectStorageEmulator, getStorage } from 'firebase/storage'
import {
    Auth,
    UserCredential,
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    NextOrObserver,
    User,
    connectAuthEmulator
} from 'firebase/auth'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const firebaseConfig = require('../../firebase-config') // Suppress the @typescript-eslint/no-var-requires rule.

let app: FirebaseApp
const db: Firestore = initDb()
const storage: FirebaseStorage = initFirebaseStorage()
const auth: Auth = initFirebaseAuth()

function initDb(): Firestore {
    const _db: Firestore = getFirestore(getApp())
    if (
        process !== undefined &&
        process.env !== undefined &&
        (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') &&
        process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_IMPORT_DIRECTORY !== undefined
    ) {
        const FIREBASE_EMULATORS_FIRESTORE_PORT = Number.parseInt(process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_FIRESTORE_PORT || '8080')
        connectFirestoreEmulator(_db, '127.0.0.1', FIREBASE_EMULATORS_FIRESTORE_PORT)
    }
    return _db
}

function initFirebaseAuth() {
    const _auth: Auth = getAuth(getApp())
    if (
        process !== undefined &&
        process.env !== undefined &&
        (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') &&
        process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_IMPORT_DIRECTORY !== undefined
    ) {
        const FIREBASE_EMULATORS_AUTH_PORT = Number.parseInt(process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_AUTH_PORT || '8099')
        connectAuthEmulator(_auth, `http://127.0.0.1:${FIREBASE_EMULATORS_AUTH_PORT}`)
    }
    return _auth
}

function initFirebaseStorage() {
    const _storage: FirebaseStorage = getStorage(getApp())
    if (
        process !== undefined &&
        process.env !== undefined &&
        (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') &&
        process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_IMPORT_DIRECTORY !== undefined
    ) {
        const FIREBASE_EMULATORS_STORAGE_PORT = Number.parseInt(process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_STORAGE_PORT || '8199')
        connectStorageEmulator(_storage, '127.0.0.1', FIREBASE_EMULATORS_STORAGE_PORT)
    }
    return _storage
}

export function getApp(): FirebaseApp {
    if (app === undefined) {
        app = initializeApp(firebaseConfig)
    }
    return app
}

export function getDb(): Firestore {
    return db
}

export function getFirebaseAuth() {
    return auth
}

export function getFirebaseStorage(): FirebaseStorage {
    return storage
}

export function getUserId(): string | undefined {
    return getFirebaseAuth().currentUser?.uid
}

export async function signInAuthUserWithEmailAndPassword(email: string, password: string): Promise<null | User> {
    if (!email || !password) {
        return null
    }
    const userCredential: UserCredential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
    return userCredential.user
}

export function signOutUser(): void {
    signOut(getFirebaseAuth())
}

export function onAuthStateChangedListener(callback: NextOrObserver<User>) {
    onAuthStateChanged(getFirebaseAuth(), callback)
}
