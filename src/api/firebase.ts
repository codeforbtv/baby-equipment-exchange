import { Notification } from '@/types/NotificationTypes';
import { AccountInformation, AuthUserRecord, NewUserAccountInfo } from '@/types/UserTypes';
import { convertToString } from '@/utils/utils';
import { UserRecord } from 'firebase-admin/auth';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { User, connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { getDonationNotifications, getOrdersNotifications } from './firebase-donations';
import { getUsersNotifications } from './firebase-users';
import { addEvent, checkClaims } from './firebaseAdmin';

function initApp(): FirebaseApp {
    if (process.env.NODE_ENV === 'production') {
        // creds automatically injected with firebase app hosting
        return initializeApp();
    }
    // if not prod, then emulator
    return initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        apiKey: 'emulator-dummy-key'
    });
}

export const app = initApp();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
const functions = getFunctions(app);

// client sdk needs explicit connectFirestoreEmulator calls because it's designed for the browser (no env vars).
// server side sdk auto-detects FIRESTORE_EMULATOR_HOST set by `firebase emulators:exec`.
// this file is used by both client & server side, so we need to support both types of file access
const isCallerClientSide = typeof window !== 'undefined';
// prevents HMR re-init. emulator throws if called twice on the same instance.
const isFirstLoad = !(db as any)._settingsFrozen;
if (process.env.NODE_ENV !== 'production' && isCallerClientSide && isFirstLoad) {
    connectFirestoreEmulator(db, 'localhost', Number(process.env.NEXT_PUBLIC_EMULATOR_FIRESTORE_PORT));
    connectAuthEmulator(auth, `http://localhost:${process.env.NEXT_PUBLIC_EMULATOR_AUTH_PORT}`);
    connectStorageEmulator(storage, 'localhost', Number(process.env.NEXT_PUBLIC_EMULATOR_STORAGE_PORT));
    connectFunctionsEmulator(functions, 'localhost', Number(process.env.NEXT_PUBLIC_EMULATOR_FUNCTIONS_PORT));
}

const createNewUser = httpsCallable(functions, 'createnewuser');
const enableUser = httpsCallable(functions, 'enableuser');
const getOrganizationNames = httpsCallable(functions, 'getorganizationnames');
const isEMailInUse = httpsCallable(functions, 'isemailinuse');
const listAllUsers = httpsCallable(functions, 'listallusers');
const setCustomClaims = httpsCallable(functions, 'setcustomclaims');
const updateAuthUser = httpsCallable(functions, 'updateauthuser');
const deleteUser = httpsCallable(functions, 'deleteuser');
const areDonationsAvailable = httpsCallable(functions, 'aredonationsavailable');

//Cloud function calls
export async function callCreateUser(accountInfo: NewUserAccountInfo): Promise<UserRecord> {
    try {
        const result = await createNewUser(accountInfo);
        return result.data as UserRecord;
    } catch (error) {
        addErrorEvent('Create user', error);
    }
    return Promise.reject();
}

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
        //Filter out anonymous users
        const authUsers = listUsers
            .filter((user) => user.providerData.length !== 0)
            .map((user) => {
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

export async function callEnableUser(userId: string): Promise<void> {
    try {
        await enableUser({ userId: userId });
    } catch (error) {
        addErrorEvent('Could not enable user', error);
    }
}

export async function callDeleteUser(userId: string): Promise<void> {
    try {
        await deleteUser({ userId: userId });
    } catch (error) {
        addErrorEvent('Error deleting user', error);
    }
}

export async function callSetClaims(userId: string, claims: any): Promise<void> {
    try {
        await setCustomClaims({ userId: userId, claims: claims });
    } catch (error) {
        addErrorEvent('Error calling set claims', error);
    }
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

export async function callAreDonationsAvailable(ids: string[]): Promise<string[]> {
    try {
        const unavailableDonations = await areDonationsAvailable(ids);
        return unavailableDonations.data as string[];
    } catch (error) {
        addErrorEvent('Error calling are donations available', error);
        throw error;
    }
}

//Multi-collection query
export async function getNotifications(): Promise<Notification> {
    try {
        const [donationNotifications, userNotifications, orderNotifications] = await Promise.all([
            getDonationNotifications(),
            getUsersNotifications(),
            getOrdersNotifications()
        ]);

        return {
            donations: donationNotifications,
            users: userNotifications,
            orders: orderNotifications
        };
    } catch (error) {
        addErrorEvent('Error getting notifications', error);
    }
    return Promise.reject();
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
    try {
        await addEvent({ location: location, error: convertToString(error) });
    } catch (error) {
        console.log(error);
    }
}
