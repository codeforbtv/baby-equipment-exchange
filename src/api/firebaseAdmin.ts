'use server';

import 'server-only';

import fs from 'fs';
import path from 'path';
import * as admin from 'firebase-admin';
import { getAuth, UserRecord } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

import { convertToString } from '@/utils/utils';
import { AuthUserRecord, NewUserAccountInfo } from '@/types/UserTypes';

const EVENTS_COLLECTION = 'Event';
const USERS_COLLECTION = 'Users';
const DONATIONS_COLLECTION = 'Donations';
const ORGANIZATIONS_COLLECTION = 'Organizations';

type Event = {
    type: string;
    note: string;
    createdBy: string;
    createdAt: string;
    modifiedAt: string;
};

export async function initAdmin() {
    if (admin.apps.length > 0) {
        return admin.app();
    }
    if (process.env.NODE_ENV === 'production') {
        return initializeApp();
    }
    return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
}

const app = await initAdmin();
const auth = getAuth(app);
const db = getFirestore(app);

function findPaths(fileNames: string[]): string[] {
    const filePaths = [];
    const directoryPath = process.env.IMPORT_DIRECTORY ? process.env.IMPORT_DIRECTORY : '';
    const files = fs.readdirSync(directoryPath, { withFileTypes: true });
    for (const file of files) {
        const filePath = path.join(directoryPath, file.name);
        if (fileNames && fileNames.includes(file.name)) filePaths.push(filePath);
    }
    return filePaths;
}

export const addEvent = async (request: any) => {
    try {
        _addEvent(request);
    } catch (error) {
        console.error(error);
    }
};

export const checkClaims = async (request: any): Promise<any> => {
    try {
        const { idToken, claimNames } = request;
        const response = await _checkClaims(idToken, claimNames);
        return response;
    } catch (error) {
        addErrorEvent('checkClaims', error);
    }
    throw new Error('Internal error');
};

export async function getAuthUserById(uid: string): Promise<AuthUserRecord> {
    try {
        const user = await auth.getUser(uid);
        const authUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            disabled: user.disabled,
            metadata: user.metadata,
            customClaims: user.customClaims
        };
        return JSON.parse(JSON.stringify(authUser));
    } catch (error) {
        console.log(error);
    }
    return Promise.reject();
}

async function _verifyAdminToken(idToken: string): Promise<void> {
    const decoded = await auth.verifyIdToken(idToken);
    if (decoded.admin !== true) {
        throw new Error('permission-denied: admin only');
    }
}

export const createUser = async (request: NewUserAccountInfo): Promise<UserRecord> => {
    try {
        const { email, password, displayName, phoneNumber, organization, notes, title, termsAccepted } = request;

        if (!email || email.length === 0) throw new Error('A valid email address is required.');
        if (!password || password.length === 0) throw new Error('Password is required.');
        if (!displayName || displayName.length === 0) throw new Error('Display name is required.');
        if (!phoneNumber || phoneNumber.length === 0) throw new Error('Phone number is required.');

        const userRecord: UserRecord = await auth.createUser({
            email,
            password,
            displayName,
            disabled: true
        });

        const userParams = {
            uid: userRecord.uid,
            isDisabled: true,
            email: userRecord.email,
            organization,
            title,
            termsAccepted,
            displayName: userRecord.displayName,
            phoneNumber,
            requestedItems: [],
            notes,
            createdAt: FieldValue.serverTimestamp(),
            modifiedAt: FieldValue.serverTimestamp()
        };

        const docRef = db.collection(USERS_COLLECTION).doc(userRecord.uid);
        const doc = await docRef.get();

        if (doc.exists) {
            console.error('User already exists in database', doc.data());
            docRef.set(userParams, { merge: true });
        } else {
            docRef.set(userParams);
        }
        return JSON.parse(JSON.stringify(userRecord));
    } catch (error) {
        addErrorEvent('createUser', error);
    }
    throw new Error('An error occurred while trying to create a new user.');
};

export const enableUser = async (request: { idToken: string; userId: string }): Promise<void> => {
    try {
        await _verifyAdminToken(request.idToken);
        const userId = request.userId;
        if (!userId) throw new Error('Must provide a user Id to enable a user account.');
        const user = await auth.updateUser(userId, { disabled: false });
        await auth.setCustomUserClaims(user.uid, { 'aid-worker': true });
    } catch (error) {
        addErrorEvent('enableUser', error);
        throw error;
    }
};

export const deleteUser = async (request: { idToken: string; userId: string }): Promise<void> => {
    try {
        await _verifyAdminToken(request.idToken);
        const userId = request.userId;
        if (!userId) throw new Error('Must provide a user Id to delete a user account.');
        await auth.deleteUser(userId);
    } catch (error) {
        addErrorEvent('deleteUser', error);
        throw error;
    }
};

export const updateAuthUser = async (request: {
    idToken: string;
    uid: string;
    accountInformation: { displayName?: string; email?: string };
}): Promise<UserRecord> => {
    try {
        await _verifyAdminToken(request.idToken);
        const updatedUser = await auth.updateUser(request.uid, request.accountInformation);
        return JSON.parse(JSON.stringify(updatedUser));
    } catch (error) {
        addErrorEvent('updateAuthUser', error);
    }
    throw new Error('Error updating user account.');
};

export const isEmailInUse = async (request: { email: string }): Promise<boolean> => {
    try {
        const existingUser = await auth.getUserByEmail(request.email);
        if (existingUser !== undefined) {
            return true;
        } else {
            return false;
        }
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            return false;
        }
        if (error.code !== 'auth/invalid-email') {
            addErrorEvent('isEmailInUse', error);
        }
    }
    return true;
};

export const listAllUsers = async (request: { idToken: string }): Promise<AuthUserRecord[]> => {
    try {
        await _verifyAdminToken(request.idToken);
        const usersListResult = await auth.listUsers(1000);
        const authUsers = usersListResult.users.map((user) => {
            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                disabled: user.disabled,
                metadata: user.metadata,
                customClaims: user.customClaims
            };
        });
        return JSON.parse(JSON.stringify(authUsers));
    } catch (error) {
        addErrorEvent('listAllUsers', error);
    }
    return Promise.reject();
};

export const setCustomClaims = async (request: { idToken: string; userId: string; claims: any }): Promise<void> => {
    try {
        await _verifyAdminToken(request.idToken);
        await auth.setCustomUserClaims(request.userId, request.claims);
    } catch (error) {
        addErrorEvent('setCustomClaims', error);
        throw error;
    }
};

export const getOrganizationNames = async (): Promise<{ [key: string]: string }> => {
    try {
        const orgNames: { [key: string]: string } = {};
        const snapshot = await db.collection(ORGANIZATIONS_COLLECTION).orderBy('name', 'asc').get();
        snapshot.forEach((snap) => {
            const { name } = snap.data();
            orgNames[name] = snap.id;
        });
        return orgNames;
    } catch (error) {
        addErrorEvent('getOrganizationNames', error);
        throw new Error('Unable to fetch organization names');
    }
};

export const areDonationsAvailable = async (request: { idToken: string; ids: string[] }): Promise<string[]> => {
    try {
        await auth.verifyIdToken(request.idToken);
        const unavailable: string[] = [];
        for (const id of request.ids) {
            const snap = await db.collection(DONATIONS_COLLECTION).doc(id).get();
            if (snap.exists && snap.data()?.status !== 'available') unavailable.push(id);
        }
        return unavailable;
    } catch (error) {
        addErrorEvent('areDonationsAvailable', error);
        throw error;
    }
};

// --- Private helpers ---

async function _checkClaims(idToken: string, claimNames: string[]) {
    try {
        const userClaims = {};
        const claims = await auth.verifyIdToken(idToken);
        if (claims === undefined || claims === null) {
            return Promise.reject();
        }
        for (const claimName of claimNames) {
            let claimValue = claims[claimName];
            claimValue = claimValue !== undefined && claimValue === true ? true : false;
            Object.defineProperty(userClaims, claimName, {
                value: claimValue,
                enumerable: true,
                writable: false
            });
        }
        return userClaims;
    } catch (error) {
        addErrorEvent('_checkClaims', error);
    }
    return Promise.reject();
}

async function _addEvent(object: any) {
    try {
        const currentTime = new Date();
        const currentTimeString = currentTime.toDateString();
        const eventParams: Event = {
            type: '',
            note: JSON.stringify(object),
            createdBy: 'system',
            createdAt: currentTimeString,
            modifiedAt: currentTimeString
        };
        await db.collection(EVENTS_COLLECTION).add(eventParams);
        console.warn(`Got event! ${JSON.stringify(object)}`);
    } catch (error) {
        console.error(error);
    }
}

async function addErrorEvent(location: string, error: any): Promise<void> {
    _addEvent({ location: location, error: convertToString(error) });
}
