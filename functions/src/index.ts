// Libs
import { onCall, CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

//Types
import { UserRecord } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';

//Collections
const USERS_COLLECTION = 'Users';
const ORGANIZATIONS_COLLECTION = 'Organizations';
const DONATIONS_COLLECTION = 'Donations';

admin.initializeApp();
const auth = admin.auth();
const db = admin.firestore();

//User-related
export const createnewuser = onCall(async (request: CallableRequest): Promise<UserRecord> => {
    try {
        const accountInfo = request.data;
        const { email, password, displayName, phoneNumber, organization, notes, title, termsAccepted } = accountInfo;

        if (!email || email.length === 0) return Promise.reject(new HttpsError('invalid-argument', 'A valid email address is required.'));
        if (!password || password.length === 0) return Promise.reject(new HttpsError('invalid-argument', 'Password is required.'));
        if (!displayName || displayName.length === 0) return Promise.reject(new HttpsError('invalid-argument', 'Display name is required.'));
        if (!phoneNumber || phoneNumber.length === 0) return Promise.reject(new HttpsError('invalid-argument', 'Phone number is required.'));

        const userRecord: UserRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: displayName,
            disabled: true
        });

        const userParams = {
            uid: userRecord.uid,
            isDisabled: true,
            email: userRecord.email,
            organization: organization,
            title: title,
            termsAccepted: termsAccepted,
            displayName: userRecord.displayName,
            phoneNumber: phoneNumber,
            requestedItems: [],
            notes: notes,
            createdAt: FieldValue.serverTimestamp(),
            modifiedAt: FieldValue.serverTimestamp()
        };

        const docRef = db.collection(USERS_COLLECTION).doc(userRecord.uid);
        const doc = await docRef.get();

        //If User exists in firestore, merge data
        if (doc.exists) {
            logger.error('User already exists in database', doc.data());
            docRef.set(userParams, { merge: true });
        } else {
            //Create new User in firestore
            docRef.set(userParams);
        }
        return userRecord;
    } catch (error) {
        logger.error('Error creating new user', error);
    }
    return Promise.reject(new HttpsError('unknown', 'An error occurred while trying to create a new user.'));
});

export const enableuser = onCall(async (request): Promise<void> => {
    if (!request.auth) {
        return Promise.reject(new HttpsError('unauthenticated', 'Must be signed in to enable user account.'));
    }
    if (request.auth && request.auth.token.admin != true) {
        return Promise.reject(new HttpsError('permission-denied', 'Only admins can enable user accounts.'));
    } else if (request.auth && request.auth.token.admin == true) {
        const userId = request.data.userId;
        if (!userId) {
            return Promise.reject(new HttpsError('invalid-argument', 'Must provide a user Id to enable a user account.'));
        } else {
            auth.updateUser(userId, { disabled: false })
                .then((user) => auth.setCustomUserClaims(user.uid, { 'aid-worker': true }))
                .then(() => console.log(`User ${userId} enabled`))
                .catch((error) => Promise.reject(new HttpsError('invalid-argument', 'Unable to update user account.')));
        }
    }
});

//Deletes firebase auth user
export const deleteuser = onCall(async (request): Promise<void> => {
    if (!request.auth) {
        return Promise.reject(new HttpsError('unauthenticated', 'Must be signed in to delete user account.'));
    }
    if (request.auth && request.auth.token.admin != true) {
        return Promise.reject(new HttpsError('permission-denied', 'Only admins can delete user accounts.'));
    } else if (request.auth && request.auth.token.admin == true) {
        const userId = request.data.userId;
        if (!userId) {
            return Promise.reject(new HttpsError('invalid-argument', 'Must provide a user Id to delete a user account.'));
        } else {
            auth.deleteUser(userId)
                .then(() => console.log(`User with ID: ${userId} deleted`))
                .catch((error) => Promise.reject(new HttpsError('invalid-argument', 'Unable to delete user account.')));
        }
    }
});

export const updateauthuser = onCall(async (request): Promise<UserRecord> => {
    if (!request.auth) {
        return Promise.reject(new HttpsError('unauthenticated', 'Must be signed in to list all users.'));
    }
    if (request.auth && !request.auth.token.admin) {
        return Promise.reject(new HttpsError('permission-denied', 'Only admins can update custom claims for users.'));
    }
    try {
        const { uid, accountInformation } = request.data;
        const updatedUser = await auth.updateUser(uid, accountInformation);
        return updatedUser;
    } catch (error) {
        logger.error('Error updating user', error);
    }
    return Promise.reject(new HttpsError('invalid-argument', 'Error updating user account.'));
});

export const isemailinuse = onCall(async (request): Promise<boolean> => {
    try {
        const email = request.data.email;
        const existingUser: UserRecord = await auth.getUserByEmail(email);
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
            logger.error('Error checking if email is in use', error);
        }
    }
    return true;
});

export const listallusers = onCall(async (request): Promise<UserRecord[]> => {
    if (!request.auth) {
        return Promise.reject(new HttpsError('unauthenticated', 'Must be signed in to list all users.'));
    }
    if (request.auth && !request.auth.token.admin) {
        return Promise.reject(new HttpsError('permission-denied', 'Only admins can list all user accounts.'));
    }
    try {
        const usersListresult = await auth.listUsers(1000);
        const usersList: UserRecord[] = usersListresult.users;
        return usersList;
    } catch (error) {
        logger.error('Error fetching list of users', error);
    }
    return Promise.reject(new HttpsError('unknown', 'An error occurred while trying to list all users.'));
});

export const setcustomclaims = onCall(async (request): Promise<void> => {
    if (!request.auth) {
        return Promise.reject(new HttpsError('unauthenticated', 'Must be signed in to list all users.'));
    }
    if (request.auth && !request.auth.token.admin) {
        return Promise.reject(new HttpsError('permission-denied', 'Only admins can update custom claims for users.'));
    }
    try {
        const { userId, claims } = request.data;
        await auth.setCustomUserClaims(userId, claims);
    } catch (error) {
        logger.error('Error updating custom claims', error);
    }
});

//Orgs-related
export const getorganizationnames = onCall(
    async (
        request
    ): Promise<{
        [key: string]: string;
    }> => {
        try {
            const orgNames: {
                [key: string]: string;
            } = {};
            const snapshot = await db.collection(ORGANIZATIONS_COLLECTION).orderBy('name', 'asc').get();
            snapshot.forEach((snap) => {
                const { name } = snap.data();
                orgNames[name] = snap.id;
            });
            return orgNames;
        } catch (error) {
            return Promise.reject(new HttpsError('unavailable', 'Unable to fetch organization names'));
        }
    }
);

export const aredonationsavailable = onCall(async (request): Promise<string[]> => {
    if (!request.auth) {
        return Promise.reject(new HttpsError('unauthenticated', 'Must be signed in to check if donations are available.'));
    }
    try {
        let unavailableDonations = [];
        const requestedDonationIds = request.data;
        for (const requestedDonationId of requestedDonationIds) {
            const docRef = db.collection(DONATIONS_COLLECTION).doc(requestedDonationId);
            const donationDoc = await docRef.get();
            if (donationDoc.exists) {
                const donationDocData = donationDoc.data();
                if (donationDocData && donationDocData.status !== 'available') {
                    unavailableDonations.push(requestedDonationId);
                }
            }
        }
        return unavailableDonations;
    } catch (error) {
        return Promise.reject(new HttpsError('unavailable', 'Error checking if requested donations are still available.'));
    }
});
