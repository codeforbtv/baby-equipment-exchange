import { FirebaseApp, initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, Firestore, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, httpsCallable, Functions, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, FirebaseStorage, getStorage } from 'firebase/storage';
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
} from 'firebase/auth';
import { AccountInformation, UserBody } from '@/types/post-data';

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG ?? '{}');

export const app: FirebaseApp = initializeApp(firebaseConfig);
export const db: Firestore = initDb();
export const storage: FirebaseStorage = initFirebaseStorage();
export const auth: Auth = initFirebaseAuth();
const functions = initFunctions();

function initDb(): Firestore {
    let _db: Firestore;
    if ((process?.env?.NODE_ENV === 'test' || process?.env?.NODE_ENV === 'development') && process?.env?.NEXT_PUBLIC_IMPORT_DIRECTORY != null) {
        const FIREBASE_EMULATORS_FIRESTORE_PORT = Number.parseInt(process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_FIRESTORE_PORT ?? '8080');
        _db = getFirestore(app);
        connectFirestoreEmulator(_db, '127.0.0.1', FIREBASE_EMULATORS_FIRESTORE_PORT);
    } else {
        _db = getFirestore(app);
    }
    return _db;
}

function initFirebaseAuth() {
    let _auth: Auth;
    if ((process?.env?.NODE_ENV === 'test' || process?.env?.NODE_ENV === 'development') && process.env.NEXT_PUBLIC_IMPORT_DIRECTORY != null) {
        const FIREBASE_EMULATORS_AUTH_PORT = Number.parseInt(process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_AUTH_PORT ?? '9099');
        _auth = getAuth(app);
        connectAuthEmulator(_auth, `http://127.0.0.1:${FIREBASE_EMULATORS_AUTH_PORT}`);
    } else {
        _auth = getAuth(app);
    }
    return _auth;
}

function initFirebaseStorage() {
    let _storage: FirebaseStorage;
    if ((process?.env?.NODE_ENV === 'test' || process?.env?.NODE_ENV === 'development') && process?.env?.NEXT_PUBLIC_IMPORT_DIRECTORY != null) {
        const FIREBASE_EMULATORS_STORAGE_PORT = Number.parseInt(process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_STORAGE_PORT ?? '9199');
        _storage = getStorage(app);
        connectStorageEmulator(_storage, '127.0.0.1', FIREBASE_EMULATORS_STORAGE_PORT);
    } else {
        _storage = getStorage(app);
    }
    return _storage;
}

function initFunctions() {
    let _functions: Functions;
    if ((process?.env?.NODE_ENV === 'test' || process?.env?.NODE_ENV === 'development') && process?.env?.NEXT_PUBLIC_IMPORT_DIRECTORY != null) {
        const FIREBASE_EMULATORS_FUNCTIONS_PORT = Number.parseInt(process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_FUNCTIONS_PORT ?? '5001');
        _functions = getFunctions(app, 'us-east1');
        connectFunctionsEmulator(_functions, '127.0.0.1', FIREBASE_EMULATORS_FUNCTIONS_PORT);
    } else {
        _functions = getFunctions(app, 'us-east1');
    }
    return _functions;
}

// Functions
const callAddEvent = httpsCallable(functions, 'addEvent');
const callCheckClaims = httpsCallable(functions, 'checkClaims');
const callGetImageAsSignedUrl = httpsCallable(functions, 'getImageAsSignedUrl');
const callGetUidByEmail = httpsCallable(functions, 'getUidByEmail');
const callIsEmailInvalid = httpsCallable(functions, 'isEmailInvalid');
const callRegisterNewUser = httpsCallable(functions, 'registerNewUser');
const callSetClaimForAdmin = httpsCallable(functions, 'setClaimForAdmin');
const callSetClaimForAidWorker = httpsCallable(functions, 'setClaimForAidWorker');
const callSetClaimForDonationReadAccess = httpsCallable(functions, 'setClaimForDonationReadAccess');
const callSetClaimForDonor = httpsCallable(functions, 'setClaimForDonor');
const callSetClaimForNewUser = httpsCallable(functions, 'setClaimForNewUser');
const callSetClaimForVerified = httpsCallable(functions, 'setClaimForVerified');
const callSetClaimForVolunteer = httpsCallable(functions, 'setClaimForVolunteer');
const callSetClaims = httpsCallable(functions, 'setClaims');
const callSetUserAccount = httpsCallable(functions, 'setUserAccount');
const callToggleCanReadDonations = httpsCallable(functions, 'toggleCanReadDonations');
const callToggleClaimForAdmin = httpsCallable(functions, 'toggleClaimForAdmin');
const callToggleClaimForAidWorker = httpsCallable(functions, 'toggleClaimForAidWorker');
const callToggleClaimForVerified = httpsCallable(functions, 'toggleClaimForVerified');
const callToggleClaimForVolunteer = httpsCallable(functions, 'toggleClaimForVolunteer');

export async function checkClaims(userId: string, ...claimNames: string[]): Promise<any> {
    if (claimNames.length === 0) {
        claimNames = ['admin', 'aid-worker', 'can-read-donations', 'donor', 'verified', 'volunteer'];
    }
    const response = await callCheckClaims({ userId: userId, claimNames: claimNames });
    const data: any = response.data;
    return data;
}

export async function isEmailInvalid(email: string) {
    const response = await callIsEmailInvalid({ email: email });
    const data: any = response.data;
    return data.value;
}

export async function setClaimForNewUser(userId: string) {
    callSetClaimForNewUser({ userId: userId });
}

// Action based claims.

export async function setClaimForDonationReadAccess(userId: string, canReadDonations: boolean) {
    callSetClaimForDonationReadAccess({ userId: userId, canReadDonations: canReadDonations });
}

export async function toggleCanReadDonations(userId: string) {
    callToggleCanReadDonations({ userId: userId });
}

// Role based claims.
export async function canReadDonations(): Promise<boolean> {
    return checkClaim('can-read-donations');
}

export async function isAdmin(): Promise<boolean> {
    return checkClaim('admin');
}

export async function isAidWorker(): Promise<boolean> {
    return checkClaim('aid-worker');
}

export async function isDonor(): Promise<boolean> {
    return checkClaim('donor');
}

export async function isVerified(): Promise<boolean> {
    return checkClaim('verified');
}

export async function isVolunteer(): Promise<boolean> {
    return checkClaim('volunteer');
}

export async function setClaimForAdmin(userId: string, isAdmin: boolean) {
    callSetClaimForAdmin({ userId: userId, isAdmin: isAdmin });
}

export async function setClaimForAidWorker(userId: string, isAidWorker: boolean) {
    callSetClaimForAidWorker({ userId: userId, isAidWorker: isAidWorker });
}

export async function setClaimForDonor(userId: string, isDonor: boolean) {
    callSetClaimForDonor({ userId: userId, isDonor: isDonor });
}

export async function setClaimForVerified(userId: string, isVerified: boolean) {
    callSetClaimForVerified({ userId: userId, isVerified: isVerified });
}

export async function setClaimForVolunteer(userId: string, isVolunteer: boolean) {
    callSetClaimForVolunteer({ userId: userId, isVolunteer: isVolunteer });
}

export async function toggleClaimForAdmin(userId: string) {
    callToggleClaimForAdmin({ userId: userId });
}

export async function toggleClaimForAidWorker(userId: string) {
    callToggleClaimForAidWorker({ userId: userId });
}

export async function toggleClaimForVerified(userId: string) {
    callToggleClaimForVerified({ userId: userId });
}

export async function toggleClaimForVolunteer(userId: string) {
    callToggleClaimForVolunteer({ userId: userId });
}

// Utilitarian

export async function addEvent(object: any) {
    callAddEvent({ object: object });
}

export async function getImageAsSignedUrl(url: string) {
    try {
        const response = await callGetImageAsSignedUrl({ url: url });
        await addEvent({ location: 'getImageAsSignedUrl', response: response });
        const signedUrl: any = response.data;
        return signedUrl;
    } catch (error) {
        await addEvent({ location: 'getImageAsSignedUrl', error: error });
    }
}

export async function getAccountType(): Promise<string> {
    let accountType: string = '';
    const hasAdmin = await isAdmin();
    const hasVerified = await isVerified();
    if (hasAdmin) {
        accountType = 'Administrator';
    } else {
        accountType = 'Donor';
    }
    if (hasVerified) {
        accountType += ' (unverified)';
    }
    return accountType;
}

async function checkClaim(claimName: string): Promise<boolean> {
    await auth.authStateReady();
    const claims = (await auth.currentUser?.getIdTokenResult(true))?.claims;
    if (claims === undefined || claims === null) {
        return Promise.reject();
    }
    const claimValue = claims[claimName];
    return claimValue !== undefined && claimValue === true ? true : false;
}

export function getUserEmail(): string | null | undefined {
    return auth.currentUser?.email;
}

export async function getUidByEmail(email: string) {
    await auth.authStateReady();
    const options = { email };
    const uid = await callGetUidByEmail({ options });
    return uid;
}

export async function getUserId(): Promise<string> {
    await auth.authStateReady();
    const currentUser = auth.currentUser?.uid;
    return currentUser ?? Promise.reject();
}

export async function registerNewUser(options: any): Promise<any> {
    const response = await callRegisterNewUser(options);
    const data: any = response.data;
    const okResponse = data.ok ?? false;
    return { ok: okResponse };
}

export async function setClaims(userId: string, claims: any) {
    const options = { userId, claims };
    await callSetClaims({ options });
}

export async function setUserAccount(userId: string, accountInformation: AccountInformation) {
    await callSetUserAccount({ userId: userId, accountInformation: accountInformation });
}

export async function signInAuthUserWithEmailAndPassword(email: string, password: string): Promise<null | User> {
    if (!email || !password) {
        return null;
    }
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export function signOutUser(): void {
    signOut(auth);
}

export function onAuthStateChangedListener(callback: NextOrObserver<User>) {
    onAuthStateChanged(auth, callback);
}
