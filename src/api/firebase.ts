import { FirebaseApp, initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, Firestore, getFirestore } from 'firebase/firestore'
import { FirebaseStorage, getStorage } from 'firebase/storage'
import { firebaseConfig } from '../../firebase-config'
import { Auth, UserCredential, getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, NextOrObserver, User, Unsubscribe } from 'firebase/auth'

let app: FirebaseApp
let db: Firestore
let storage: FirebaseStorage

const FIRESTORE_EMULATOR_PORT: number = Number.parseInt(process.env.FIREBASE_EMULATOR_FIRESTORE_PORT || '8080')

export function getApp(): FirebaseApp {
    if (app == null) {
        app = initializeApp(firebaseConfig)
    }
    return app
}

export function getDb(): Firestore {
    if (db == null) {
        if (process !== undefined && process.env !== undefined && process.env.NODE_ENV === 'test') {
            db = getFirestore()
            connectFirestoreEmulator(db, '127.0.0,1', FIRESTORE_EMULATOR_PORT)
        } else {
            db = getFirestore(getApp())
        }
    }
    return db
}

export function getFirebaseStorage(): FirebaseStorage {
    if (storage == null) {
        storage = getStorage(getApp())
    }
    return storage
}

export const auth: Auth = getAuth(getApp())

export async function signInAuthUserWithEmailAndPassword(email: string, password: string): Promise<null | User> {
    if (!email || !password) return null
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
}

export function signOutUser(): void {
    signOut(auth)
}

export function onAuthStateChangedListener(callback: NextOrObserver<User>): Unsubscribe {
    return onAuthStateChanged(auth, callback)
}
