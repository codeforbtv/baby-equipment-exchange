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
    connectAuthEmulator,
    createUserWithEmailAndPassword
} from 'firebase/auth'
import { firebaseConfig } from '../../firebase-config'
import { NewUser } from '@/types/post-data'
import { setClaimForNewUser } from './firebase-admin'
import { addUser } from './firebase-users'

let app: FirebaseApp
const db: Firestore = initDb()
const storage: FirebaseStorage = initFirebaseStorage()
const auth: Auth = initFirebaseAuth()

function initDb(): Firestore {
    const _db: Firestore = getFirestore(getApp())
    if (
        (process?.env?.NODE_ENV === 'test' || process?.env?.NODE_ENV === 'development') &&
        process?.env?.NEXT_PUBLIC_FIREBASE_EMULATORS_IMPORT_DIRECTORY !== undefined
    ) {
        const FIREBASE_EMULATORS_FIRESTORE_PORT = Number.parseInt(process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_FIRESTORE_PORT ?? '8080')
        connectFirestoreEmulator(_db, '127.0.0.1', FIREBASE_EMULATORS_FIRESTORE_PORT)
    }
    return _db
}

function initFirebaseAuth() {
    const _auth: Auth = getAuth(getApp())
    if (
        (process?.env?.NODE_ENV === 'test' || process?.env?.NODE_ENV === 'development') &&
        process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_IMPORT_DIRECTORY !== undefined
    ) {
        const FIREBASE_EMULATORS_AUTH_PORT = Number.parseInt(process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_AUTH_PORT ?? '8099')
        connectAuthEmulator(_auth, `http://127.0.0.1:${FIREBASE_EMULATORS_AUTH_PORT}`)
    }
    return _auth
}

function initFirebaseStorage() {
    const _storage: FirebaseStorage = getStorage(getApp())
    if (
        (process?.env?.NODE_ENV === 'test' || process?.env?.NODE_ENV === 'development') &&
        process?.env?.NEXT_PUBLIC_FIREBASE_EMULATORS_IMPORT_DIRECTORY !== undefined
    ) {
        const FIREBASE_EMULATORS_STORAGE_PORT = Number.parseInt(process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_STORAGE_PORT ?? '8199')
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

export async function getAccountType(): Promise<string | undefined> {
    const _isAdmin = await isAdmin()
    const _isDonor = await isDonor()
    let accountType: string = ''

    if (_isAdmin) {
        accountType = 'Administrator'
    } else {
        accountType = 'Donor'
    }

    return accountType
}

export async function isAdmin(): Promise<boolean | undefined> {
    await getFirebaseAuth().authStateReady()
    const claims = (await getFirebaseAuth().currentUser?.getIdTokenResult(true))?.claims
    return (claims?.admin !== undefined && claims?.admin === true) ? true : false
}

export async function isDonor(): Promise<boolean | undefined> {
    await getFirebaseAuth().authStateReady()
    const claims = (await getFirebaseAuth().currentUser?.getIdTokenResult(true))?.claims
    return (claims?.donor !== undefined && claims?.donor === true) ? true : false
}

export function getUserEmail(): string | null | undefined {
    return getFirebaseAuth().currentUser?.email
}

export async function getUserId(): Promise<string | null | undefined> {
    await getFirebaseAuth().authStateReady()
    return getFirebaseAuth().currentUser?.uid
}

export async function createNewUser(newUser: NewUser, password: string) {
    const userCredential = await createUserWithEmailAndPassword(getFirebaseAuth(), newUser.email!, password)
    newUser.user = userCredential.user.uid

    await addUser(newUser)

    // Process on the server
    await setClaimForNewUser(newUser.user)

    // Force the client Firebase App instance to regenerate a new token
    await userCredential.user.getIdTokenResult(true)
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
