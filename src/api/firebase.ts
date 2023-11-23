//Firebase modules
import { FirebaseApp, initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, doc, Firestore, getFirestore } from 'firebase/firestore'
import { connectFunctionsEmulator, httpsCallable, Functions, getFunctions } from 'firebase/functions'
import { connectStorageEmulator, FirebaseStorage, getStorage } from 'firebase/storage'
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
    createUserWithEmailAndPassword,
    ParsedToken
} from 'firebase/auth'
import { firebaseConfig } from '../../firebase-config'
import { UserBody } from '@/types/post-data'
import { USERS_COLLECTION, addUser } from './firebase-users'

export const app: FirebaseApp = initializeApp(firebaseConfig)
export const db: Firestore = initDb()
export const storage: FirebaseStorage = initFirebaseStorage()
export const auth: Auth = initFirebaseAuth()

const functions = initFunctions()

function initFunctions() {
    const _functions: Functions = getFunctions(app, "us-east1")
    if (
        (process?.env?.NODE_ENV === 'test' || process?.env?.NODE_ENV === 'development') &&
        process?.env?.NEXT_PUBLIC_FIREBASE_EMULATORS_IMPORT_DIRECTORY !== undefined
    ) {
        const FIREBASE_EMULATORS_FUNCTIONS_PORT = Number.parseInt(process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_FUNCTIONS_PORT ?? '5001')
        connectFunctionsEmulator(_functions, '127.0.0.1', FIREBASE_EMULATORS_FUNCTIONS_PORT)
    }
    return _functions
}

// Functions
const callIsEmailInUse = httpsCallable(functions, 'isEmailInUse')
const callSetClaimForDonationReadAccess = httpsCallable(functions, 'setClaimForDonationReadAccess')
const callToggleCanReadDonations = httpsCallable(functions, 'toggleCanReadDonations')
const callSetClaimForAdmin = httpsCallable(functions, 'setClaimForAdmin')
const callSetClaimForAidWorker = httpsCallable(functions, 'setClaimForAidWorker')
const callSetClaimForNewUser = httpsCallable(functions, 'setClaimForNewUser')
const callSetClaimForVerified = httpsCallable(functions, 'setClaimForVerified')
const callSetClaimForVolunteer = httpsCallable(functions, 'setClaimForVolunteer')
const callToggleClaimForAdmin = httpsCallable(functions, 'toggleClaimForAdmin')
const callToggleClaimForAidWorker = httpsCallable(functions, 'toggleClaimForAidWorker')
const callToggleClaimForVerified = httpsCallable(functions, 'toggleClaimForVerified')
const callToggleClaimForVolunteer = httpsCallable(functions, 'toggleClaimForVolunteer')
const callAddEvent = httpsCallable(functions, 'addEvent')
const callGetImageAsSignedUrl = httpsCallable(functions, 'getImageAsSignedUrl')

export async function isEmailInUse(email: string) {
    const response = await callIsEmailInUse({email: email})
    const data: any = response.data
    return data.value
}

export async function setClaimForNewUser(userId: string) {
    callSetClaimForNewUser({userId: userId})
}

// Action based claims.

export async function setClaimForDonationReadAccess(userId: string, canReadDonations: boolean) {
    callSetClaimForDonationReadAccess({userId: userId, canReadDonations: canReadDonations})
}

export async function toggleCanReadDonations(userId: string) {
    callToggleCanReadDonations({userId: userId})
}

// Role based claims.

export async function setClaimForAdmin(userId: string, isAdmin: boolean) {
    callSetClaimForAdmin({userId: userId, isAdmin: isAdmin})
}

export async function setClaimForAidWorker(userId: string, isAidWorker: boolean) {
    callSetClaimForAidWorker({userId: userId, isAidWorker: isAidWorker})
}

export async function setClaimForVerified(userId: string, isVerified: boolean) {
    callSetClaimForVerified({userId: userId, isVerified: isVerified})
}

export async function setClaimForVolunteer(userId: string, isVolunteer: boolean) {
    callSetClaimForVolunteer({userId: userId, isVolunteer: isVolunteer})
}

export async function toggleClaimForAdmin(userId: string) {
    callToggleClaimForAdmin({userId: userId})
}

export async function toggleClaimForAidWorker(userId: string) {
    callToggleClaimForAidWorker({userId: userId})
}

export async function toggleClaimForVerified(userId: string) {
    callToggleClaimForVerified({userId: userId})
}

export async function toggleClaimForVolunteer(userId: string) {
    callToggleClaimForVolunteer({userId: userId})
}

export async function addEvent(object: any) {
    callAddEvent({object: object})
}

export async function getImageAsSignedUrl(url: string) {
    const response = await callGetImageAsSignedUrl({url: url})
    const data: any = response.data
    return data.url
}

function initDb(): Firestore {
    const _db: Firestore = getFirestore(app)
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
    const _auth: Auth = getAuth(app)
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
    const _storage: FirebaseStorage = getStorage(app)
    if (
        (process?.env?.NODE_ENV === 'test' || process?.env?.NODE_ENV === 'development') &&
        process?.env?.NEXT_PUBLIC_FIREBASE_EMULATORS_IMPORT_DIRECTORY !== undefined
    ) {
        const FIREBASE_EMULATORS_STORAGE_PORT = Number.parseInt(process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_STORAGE_PORT ?? '8199')
        connectStorageEmulator(_storage, '127.0.0.1', FIREBASE_EMULATORS_STORAGE_PORT)
    }
    return _storage
}

export async function getAccountType(): Promise<string> {
    let accountType: string = ''
    const hasAdmin = await isAdmin()
    const hasVerified = await isVerified()
    if (hasAdmin) {
        accountType = 'Administrator'
    } else {
        accountType = 'Donor'
    }
    if (hasVerified) {
        accountType += ' (unverified)'
    }
    return accountType
}

export async function canReadDonations(): Promise<boolean> {
    return checkClaim('can-read-donations') 
}

export async function isAdmin(): Promise<boolean> {
    return checkClaim('admin')
}

export async function isAidWorker(): Promise<boolean> {
    return checkClaim('aid-worker')
}

export async function isDonor(): Promise<boolean> {
    return checkClaim('donor')
}

export async function isVerified(): Promise<boolean> {
    return checkClaim('verified')
}

export async function isVolunteer(): Promise<boolean> {
    return checkClaim('volunteer')
}

async function checkClaim(claimName: string): Promise<boolean> {
    await auth.authStateReady()
    const claims = (await auth.currentUser?.getIdTokenResult(true))?.claims
    if (claims === undefined || claims === null) {
        return Promise.reject()
    }
    const claimValue = claims[claimName];
    return (claimValue !== undefined && claimValue === true) ? true : false
}

export function getUserEmail(): string | null | undefined {
    return auth.currentUser?.email
}

export async function getUserId(): Promise<string> {
    await auth.authStateReady()
    const currentUser = auth.currentUser?.uid
    return currentUser ?? Promise.reject()
}

export async function createNewUser(newUser: UserBody, password: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, newUser.email!, password)
    const userId = userCredential.user.uid
    newUser.user = doc(db, `${USERS_COLLECTION}/${userId}`)

    await addUser(newUser)

    // Process on the server
    await setClaimForNewUser(userId)

    // Force the client Firebase App instance to regenerate a new token
    await userCredential.user.getIdTokenResult(true)
}

export async function signInAuthUserWithEmailAndPassword(email: string, password: string): Promise<null | User> {
    if (!email || !password) {
        return null
    }
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
}

export function signOutUser(): void {
    signOut(auth)
}

export function onAuthStateChangedListener(callback: NextOrObserver<User>) {
    onAuthStateChanged(auth, callback)
}
