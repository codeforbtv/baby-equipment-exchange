import { FirebaseApp, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { UserCredential, signInWithEmailAndPassword, signOut, onAuthStateChanged, NextOrObserver, User, getAuth, sendPasswordResetEmail } from 'firebase/auth';

import { firebaseConfig } from './config';
import {
    addEvent,
    checkClaims,
    getImageAsSignedUrl,
    getUidByEmail,
    isEmailInUse,
    registerNewUser,
    setClaimForAdmin,
    setClaimForAidWorker,
    setClaimForDonationReadAccess,
    setClaimForDonor,
    setClaimForNewUser,
    setClaimForVerified,
    setClaimForVolunteer,
    setClaims,
    setUserAccount,
    toggleCanReadDonations,
    toggleClaimForAdmin,
    toggleClaimForAidWorker,
    toggleClaimForVerified,
    toggleClaimForVolunteer
} from './firebaseAdmin';

import { AccountInformation } from '@/types/post-data';

export const app: FirebaseApp = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export async function callCheckClaims(userId: string, ...claimNames: string[]): Promise<any> {
    if (claimNames.length === 0) {
        claimNames = ['admin', 'aid-worker', 'can-read-donations', 'donor', 'verified', 'volunteer'];
    }
    const response = await checkClaims({ userId: userId, claimNames: claimNames });
    const data: any = response.data;
    return data;
}

export async function callIsEmailInUse(email: string): Promise<boolean> {
    const response = await isEmailInUse({ email: email });
    return response;
}

export async function callSetClaimForNewUser(userId: string): Promise<void> {
    setClaimForNewUser({ userId: userId });
}

// Action based claims.
export async function callSetClaimForDonationReadAccess(userId: string, canReadDonations: boolean): Promise<void> {
    setClaimForDonationReadAccess({ userId: userId, canReadDonations: canReadDonations });
}

export async function callToggleCanReadDonations(userId: string): Promise<void> {
    toggleCanReadDonations({ userId: userId });
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

export async function callSetClaimForAdmin(userId: string, isAdmin: boolean): Promise<void> {
    setClaimForAdmin({ userId: userId, isAdmin: isAdmin });
}

export async function callSetClaimForAidWorker(userId: string, isAidWorker: boolean): Promise<void> {
    setClaimForAidWorker({ userId: userId, isAidWorker: isAidWorker });
}

export async function callSetClaimForDonor(userId: string, isDonor: boolean): Promise<void> {
    setClaimForDonor({ userId: userId, isDonor: isDonor });
}

export async function callSetClaimForVerified(userId: string, isVerified: boolean): Promise<void> {
    setClaimForVerified({ userId: userId, isVerified: isVerified });
}

export async function callSetClaimForVolunteer(userId: string, isVolunteer: boolean): Promise<void> {
    setClaimForVolunteer({ userId: userId, isVolunteer: isVolunteer });
}

export async function callToggleClaimForAdmin(userId: string): Promise<void> {
    toggleClaimForAdmin({ userId: userId });
}

export async function callToggleClaimForAidWorker(userId: string): Promise<void> {
    toggleClaimForAidWorker({ userId: userId });
}

export async function callToggleClaimForVerified(userId: string): Promise<void> {
    toggleClaimForVerified({ userId: userId });
}

export async function callToggleClaimForVolunteer(userId: string): Promise<void> {
    toggleClaimForVolunteer({ userId: userId });
}

// Utilitarian
export async function callAddEvent(object: any): Promise<void> {
    addEvent({ object: object });
}

export async function callGetImageAsSignedUrl(url: string): Promise<any> {
    try {
        const response = await getImageAsSignedUrl({ url: url });
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

export async function callGetUidByEmail(email: string): Promise<string> {
    await auth.authStateReady();
    const options = { email };
    const uid = await getUidByEmail({ options });
    return uid;
}

export async function getUserId(): Promise<string> {
    await auth.authStateReady();
    const currentUser = auth.currentUser?.uid;
    return currentUser ?? Promise.reject();
}

export async function callRegisterNewUser(options: any): Promise<any> {
    const response = await registerNewUser(options);
    const data: any = response.data;
    const okResponse = data.ok ?? false;
    return { ok: okResponse };
}

export async function callSetClaims(userId: string, claims: any): Promise<void> {
    const options = { userId, claims };
    await setClaims({ options });
}

export async function callSetUserAccount(userId: string, accountInformation: AccountInformation): Promise<void> {
    await setUserAccount({ userId: userId, accountInformation: accountInformation });
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

export async function resetPassword(email: string): Promise<void> {
    if (!email) Promise.reject();
    await sendPasswordResetEmail(auth, email);
}
