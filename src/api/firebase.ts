import { Notification } from '@/types/NotificationTypes';
import { convertToString } from '@/utils/utils';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { User, connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
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
}

export async function getAuthIdToken(): Promise<string> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Not authenticated');
    return token;
}

export async function callCheckClaims(...claimNames: string[]): Promise<any> {
    if (claimNames.length === 0) {
        claimNames = ['admin', 'aid-worker'];
    }
    const idToken = await auth.currentUser?.getIdToken();
    const response = await checkClaims({ idToken: idToken, claimNames: claimNames });
    return response;
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
