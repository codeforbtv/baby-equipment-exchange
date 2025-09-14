import { FirebaseApp, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import {
    UserCredential,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    NextOrObserver,
    User,
    getAuth,
    sendPasswordResetEmail,
    signInAnonymously
} from 'firebase/auth';

import { firebaseConfig } from './config';
import {
    addEvent,
    checkClaims,
    getImageAsSignedUrl,
    getUidByEmail,
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
    toggleClaimForVolunteer,
    getAuthUserById
} from './firebaseAdmin';

import { getFunctions, httpsCallable } from 'firebase/functions';

import { AccountInformation } from '@/types/UserTypes';
import { convertToString } from '@/utils/utils';
import { AuthUserRecord, newUserAccountInfo } from '@/types/UserTypes';
import { Auth, UserRecord } from 'firebase-admin/auth';
import { IUser } from '@/models/user';
import { OrganizationNames } from '@/types/OrganizationTypes';

export const app: FirebaseApp = initializeApp(firebaseConfig);

//Cloud functions
const functions = getFunctions(app);
const createNewUser = httpsCallable(functions, 'createnewuser');
const enableUser = httpsCallable(functions, 'enableuser');
const getOrganizationNames = httpsCallable(functions, 'getorganizationnames');
const isEMailInUse = httpsCallable(functions, 'isemailinuse');
const listAllUsers = httpsCallable(functions, 'listallusers');
const setCustomClaims = httpsCallable(functions, 'setcustomclaims');
const updateAuthUser = httpsCallable(functions, 'updateauthuser');

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export async function callCheckClaims(...claimNames: string[]): Promise<any> {
    if (claimNames.length === 0) {
        claimNames = ['admin', 'aid-worker'];
    }
    const idToken = await auth.currentUser?.getIdToken();
    const response = await checkClaims({ idToken: idToken, claimNames: claimNames });
    return response;
}

export async function callIsEmailInUse(email: string): Promise<boolean> {
    const response = await isEMailInUse({ email: email });
    return response.data as boolean;
}

export async function callListAllUsers(): Promise<AuthUserRecord[]> {
    try {
        const listUsersResult = await listAllUsers();
        const listUsers = listUsersResult.data as UserRecord[];
        const authUsers = listUsers.map((user) => {
            const authUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                disabled: user.disabled,
                metadata: user.metadata,
                customClaims: user.customClaims
            };
            return authUser;
        });
        return JSON.parse(JSON.stringify(authUsers));
    } catch (error) {
        addErrorEvent('Call list all users', error);
    }
    return Promise.reject();
}

export async function callUpdateAuthUser(uid: string, accountInformation: AccountInformation): Promise<UserRecord> {
    try {
        const updatedAuthUser = await updateAuthUser({ uid: uid, accountInformation: accountInformation });
        return updatedAuthUser.data as UserRecord;
    } catch (error) {
        addErrorEvent('Error calling update auth user', error);
    }
    return Promise.reject();
}

export async function callSetClaims(userId: string, claims: any): Promise<void> {
    try {
        await setCustomClaims({ userId: userId, claims: claims });
    } catch (error) {
        addErrorEvent('Error calling set claims', error);
    }
}

// export async function callSetClaimForNewUser(userId: string): Promise<void> {
//     setClaimForNewUser({ userId: userId });
// }

// Action based claims.
export async function callSetClaimForDonationReadAccess(userId: string, canReadDonations: boolean): Promise<void> {
    setClaimForDonationReadAccess({ userId: userId, canReadDonations: canReadDonations });
}

export async function callToggleCanReadDonations(userId: string): Promise<void> {
    toggleCanReadDonations({ userId: userId });
}

// Role based claims.
export async function checkIsAdmin(user: User): Promise<boolean> {
    try {
        const result = await user.getIdTokenResult();
        return result.claims.admin === true;
    } catch (error) {
        addErrorEvent('Check is admin', error);
    }
    return Promise.reject();
}

export async function checkIsAidWorker(user: User): Promise<boolean> {
    try {
        const result = await user.getIdTokenResult();
        return result.claims['aid-worker'] === true;
    } catch (error) {
        addErrorEvent('Check is aid worker', error);
    }
    return Promise.reject();
}

// Utilitarian
export async function addErrorEvent(location: string, error: any): Promise<void> {
    addEvent({ location: location, error: convertToString(error) });
}

export async function callGetImageAsSignedUrl(url: string): Promise<any> {
    try {
        const response = await getImageAsSignedUrl({ url: url });
        const signedUrl: any = response.data;
        return signedUrl;
    } catch (error) {
        await addErrorEvent('getImageAsSignedUrl', error);
    }
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

export async function getUserEmailById(id: string): Promise<string> {
    try {
        const user = await getAuthUserById(id);
        if (user.email) return user.email;
    } catch (error) {
        addErrorEvent('Get user email by ID', error);
    }
    return Promise.reject();
}

export async function callRegisterNewUser(options: any): Promise<any> {
    const response = await registerNewUser(options);
    const data: any = response.data;
    const okResponse = data.ok ?? false;
    return { ok: okResponse };
}

export async function callSetUserAccount(userId: string, accountInformation: AccountInformation): Promise<void> {
    await setUserAccount({ userId: userId, accountInformation: accountInformation });
}

export async function createUser(accountInfo: newUserAccountInfo): Promise<UserRecord> {
    try {
        const result = await createNewUser(accountInfo);
        return result.data as UserRecord;
    } catch (error) {
        addErrorEvent('Create user', error);
    }
    return Promise.reject();
}

export async function callEnableUser(userId: string): Promise<void> {
    try {
        await enableUser({ userId: userId });
    } catch (error) {
        addErrorEvent('Could not enable user', error);
    }
    return Promise.reject();
}

export async function callGetOrganizationNames(): Promise<{
    [key: string]: string;
}> {
    try {
        const orgNames = await getOrganizationNames();
        return orgNames.data as {
            [key: string]: string;
        };
    } catch (error) {
        addErrorEvent('Could not fetch organization names', error);
    }
    return Promise.reject();
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

export async function loginAnonymousUser(): Promise<User | null> {
    try {
        const userCredential = await signInAnonymously(auth);
        return userCredential.user;
    } catch (error) {
        addErrorEvent('Login anonymously', error);
    }
    return Promise.reject();
}
