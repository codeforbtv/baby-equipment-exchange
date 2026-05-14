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
import sendMail from '@/api/nodemailer';
import adminUserCreated from '@/email-templates/adminUserCreated';
import adminUserEnabled from '@/email-templates/adminUserEnabled';
import userEnabled from '@/email-templates/userEnabled';
import type { IUser } from '@/models/user';

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

async function sendAdminNotificationEmail(message: ReturnType<typeof adminUserCreated> | ReturnType<typeof adminUserEnabled>, location: string): Promise<void> {
    try {
        await sendMail(message);
    } catch (emailError) {
        addErrorEvent(location, emailError);
    }
}

function serializeFirestoreData<T>(value: T): T {
    if (value == null) return value;
    if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
        return value.toDate().toISOString() as T;
    }
    if (Array.isArray(value)) {
        return value.map((item) => serializeFirestoreData(item)) as T;
    }
    if (typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, serializeFirestoreData(nestedValue)])) as T;
    }
    return value;
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

export async function getUserDetails(request: { idToken: string; userId: string }): Promise<IUser> {
    try {
        await _verifyAdminToken(request.idToken);
        const userSnapshot = await db.collection(USERS_COLLECTION).doc(request.userId).get();
        if (!userSnapshot.exists) {
            throw new Error('User not found');
        }
        return serializeFirestoreData({ uid: userSnapshot.id, ...userSnapshot.data() } as IUser);
    } catch (error) {
        addErrorEvent('getUserDetails', error);
        throw error;
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
    const { email, password, displayName, phoneNumber, organization, notes, title, termsAccepted } = request;

    if (!email || email.length === 0) throw new Error('A valid email address is required.');
    if (!password || password.length === 0) throw new Error('Password is required.');
    if (!displayName || displayName.length === 0) throw new Error('Display name is required.');
    if (!phoneNumber || phoneNumber.length === 0) throw new Error('Phone number is required.');

    let userRecord: UserRecord;
    try {
        userRecord = await auth.createUser({
            email,
            password,
            displayName,
            disabled: true
        });
    } catch (error) {
        addErrorEvent('createUser', error);
        throw new Error('An error occurred while trying to create a new user.');
    }

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

    try {
        await db.collection(USERS_COLLECTION).doc(userRecord.uid).set(userParams);
    } catch (firestoreError) {
        try {
            await auth.deleteUser(userRecord.uid);
        } catch (rollbackError) {
            addErrorEvent('createUser rollback failed', rollbackError);
        }
        addErrorEvent('createUser', firestoreError);
        throw new Error('An error occurred while trying to create a new user.');
    }

    await sendAdminNotificationEmail(adminUserCreated(userRecord.uid, request), 'createUser admin notification email');

    return JSON.parse(JSON.stringify(userRecord));
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
        await db.collection(USERS_COLLECTION).doc(userId).update({
            isDisabled: false,
            customClaims: { 'aid-worker': true },
            modifiedAt: FieldValue.serverTimestamp()
        });
        await sendAdminNotificationEmail(adminUserEnabled({ uid: user.uid, email: user.email, displayName: user.displayName }), 'enableUser admin notification email');
        await sendMail(userEnabled(user.email ?? '', user.displayName ?? ''));
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
        await db.collection(USERS_COLLECTION).doc(userId).delete();
    } catch (error) {
        addErrorEvent('deleteUser', error);
        throw error;
    }
}

export async function updateAuthUser(request: {
    idToken: string;
    uid: string;
    accountInformation: {
        displayName?: string;
        email?: string;
        phoneNumber?: string;
        organization?: { id: string; name: string } | null;
        title?: string;
    };
}): Promise<UserRecord> {
    try {
        await _verifyAdminToken(request.idToken);
        const { displayName, email, ...firestoreOnlyFields } = request.accountInformation;

        const authUpdate: { displayName?: string; email?: string } = {};
        if (displayName !== undefined) authUpdate.displayName = displayName;
        if (email !== undefined) authUpdate.email = email;
        const updatedUser = Object.keys(authUpdate).length > 0
            ? await auth.updateUser(request.uid, authUpdate)
            : await auth.getUser(request.uid);

        const firestoreUpdate: Record<string, any> = { modifiedAt: FieldValue.serverTimestamp() };
        if (displayName !== undefined) firestoreUpdate.displayName = displayName;
        if (email !== undefined) firestoreUpdate.email = email;
        for (const [key, value] of Object.entries(firestoreOnlyFields)) {
            if (value !== undefined) firestoreUpdate[key] = value;
        }
        await db.collection(USERS_COLLECTION).doc(request.uid).update(firestoreUpdate);

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
        await db.collection(USERS_COLLECTION).doc(request.userId).update({
            customClaims: request.claims,
            modifiedAt: FieldValue.serverTimestamp()
        });
    } catch (error) {
        addErrorEvent('setCustomClaims', error);
        throw error;
    }
}

export async function requestInventory(request: {
    idToken: string;
    donationIds: string[];
    user: { name: string; email: string };
}): Promise<{ orderId: string } | { unavailableIds: string[] }> {
    const decoded = await auth.verifyIdToken(request.idToken, true);
    const userId = decoded.uid;

    try {
        const orderId = await db.runTransaction(async (transaction) => {
            const donationRefs = request.donationIds.map(id =>
                db.collection(DONATIONS_COLLECTION).doc(id)
            );
            const donationSnaps = await Promise.all(
                donationRefs.map(ref => transaction.get(ref))
            );

            const unavailableIds: string[] = [];
            for (let i = 0; i < donationSnaps.length; i++) {
                const snap = donationSnaps[i];
                if (!snap.exists || snap.data()?.status !== 'available') {
                    unavailableIds.push(request.donationIds[i]);
                }
            }
            if (unavailableIds.length > 0) {
                throw { unavailableIds };
            }

            const orderRef = db.collection(ORDERS_COLLECTION).doc();
            const user = { id: userId, name: request.user.name, email: request.user.email };

            transaction.set(orderRef, {
                status: 'open',
                requestor: user,
                items: donationRefs,
                rejectedItems: [],
                createdAt: FieldValue.serverTimestamp(),
                modifiedAt: FieldValue.serverTimestamp()
            });

            for (const ref of donationRefs) {
                transaction.update(ref, {
                    status: 'requested',
                    requestor: user,
                    dateRequested: FieldValue.serverTimestamp(),
                    modifiedAt: FieldValue.serverTimestamp()
                });
            }

            return orderRef.id;
        });

        return { orderId };
    } catch (error: any) {
        if (error.unavailableIds) {
            return { unavailableIds: error.unavailableIds };
        }
        addErrorEvent('requestInventory', error);
        throw error;
    }
}
