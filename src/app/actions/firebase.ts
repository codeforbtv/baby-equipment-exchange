'use server';

import {
    auth,
    db,
    USERS_COLLECTION,
    DONATIONS_COLLECTION,
    ORGANIZATIONS_COLLECTION,
    ORDERS_COLLECTION,
    addErrorEvent
} from '@/api/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { UserRecord } from 'firebase-admin/auth';
import { AuthUserRecord, NewUserAccountInfo } from '@/types/UserTypes';

type RoleClaim = 'admin' | 'aid-worker' | 'donor' | 'verified' | 'volunteer';

interface CheckClaimsRequest {
    idToken: string;
    claimNames: string[];
}

interface EventRequest {
    location: string;
    error: string;
}

interface SetCustomClaimsRequest {
    idToken: string;
    userId: string;
    claims: Partial<Record<RoleClaim, boolean>>;
}

async function _verifyAdminToken(idToken: string): Promise<void> {
    const decoded = await auth.verifyIdToken(idToken, true);
    if (decoded.admin !== true) {
        throw new Error('permission-denied: admin only');
    }
}


export async function addEvent(request: EventRequest): Promise<void> {
    try {
        const currentTime = new Date().toDateString();
        await db.collection('Event').add({
            type: '',
            note: JSON.stringify(request),
            createdBy: 'system',
            createdAt: currentTime,
            modifiedAt: currentTime
        });
    } catch (error) {
        console.error(error);
    }
}

export async function getOrganizationNames(): Promise<{ [key: string]: string }> {
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
}

export async function isEmailInUse(request: { email: string }): Promise<boolean> {
    try {
        const existingUser = await auth.getUserByEmail(request.email);
        return existingUser !== undefined;
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') return false;
        if (error.code !== 'auth/invalid-email') addErrorEvent('isEmailInUse', error);
    }
    return true;
}

export async function createUser(request: NewUserAccountInfo): Promise<UserRecord> {
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
}


export async function checkClaims(request: CheckClaimsRequest): Promise<Record<string, boolean>> {
    try {
        const claims = await auth.verifyIdToken(request.idToken, true);
        if (!claims) throw new Error('Invalid token');
        const userClaims: Record<string, boolean> = {};
        for (const claimName of request.claimNames) {
            userClaims[claimName] = claims[claimName] === true;
        }
        return userClaims;
    } catch (error) {
        addErrorEvent('checkClaims', error);
    }
    throw new Error('Internal error');
}


export async function enableUser(request: { idToken: string; userId: string }): Promise<void> {
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
}

export async function deleteUser(request: { idToken: string; userId: string }): Promise<void> {
    try {
        await _verifyAdminToken(request.idToken);
        const userId = request.userId;
        if (!userId) throw new Error('Must provide a user Id to delete a user account.');
        await auth.deleteUser(userId);
    } catch (error) {
        addErrorEvent('deleteUser', error);
        throw error;
    }
}

export async function updateAuthUser(request: {
    idToken: string;
    uid: string;
    accountInformation: { displayName?: string; email?: string };
}): Promise<UserRecord> {
    try {
        await _verifyAdminToken(request.idToken);
        const updatedUser = await auth.updateUser(request.uid, request.accountInformation);
        return JSON.parse(JSON.stringify(updatedUser));
    } catch (error) {
        addErrorEvent('updateAuthUser', error);
    }
    throw new Error('Error updating user account.');
}

export async function listAllUsers(request: { idToken: string }): Promise<AuthUserRecord[]> {
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
}

export async function setCustomClaims(request: SetCustomClaimsRequest): Promise<void> {
    try {
        await _verifyAdminToken(request.idToken);
        await auth.setCustomUserClaims(request.userId, request.claims);
    } catch (error) {
        addErrorEvent('setCustomClaims', error);
        throw error;
    }
}

export async function areDonationsAvailable(request: { idToken: string; ids: string[] }): Promise<string[]> {
    try {
        await auth.verifyIdToken(request.idToken, true);
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
}
