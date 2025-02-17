'use server';

import 'server-only';

// Libs
import * as functionsV1 from 'firebase-functions/v1';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';

import * as admin from 'firebase-admin';
import { getAuth, ListUsersResult, UserRecord } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { applicationDefault, ServiceAccount } from 'firebase-admin/app';
import serviceAccount from '../../serviceAccount.json';
import { UserCardProps } from '@/types/post-data';

const credentials: ServiceAccount = {
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key
};

const region = 'us-east1';

setGlobalOptions({
    maxInstances: 10,
    region: region
});

const EVENTS_COLLECTION = 'Event';
const USERS_COLLECTION = 'Users';
const USER_DETAILS_COLLECTION = 'UserDetails';

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

    return admin.initializeApp({
        credential: admin.credential.cert(credentials)
    });
}

const app = await initAdmin();
const auth = getAuth(app);
const storage = getStorage(app);

export const checkClaims = async (request: any): Promise<any> => {
    try {
        const { idToken, claimNames } = request;
        const response = await _checkClaims(idToken, claimNames);
        return response;
    } catch (error) {
        _addEvent({ location: 'checkClaims' });
    }
    throw new HttpsError('internal', 'Internal error');
};

export const addEvent = async (request: any) => {
    try {
        const object = request.data.object;
        _addEvent(object);
    } catch (error) {
        logger.error(error);
    }
};

export const createNewUser = functionsV1
    .region(region)
    .auth.user()
    .onCreate(async (user: UserRecord) => {
        try {
            const db = getFirestore(app);
            await db
                .runTransaction(async (transaction) => {
                    const userRef = db.collection(USERS_COLLECTION).doc(user.uid);
                    if ((await userRef.get()).exists) {
                        logger.error({ error: `attempt to create an existing user ${user.uid} with https onCall method.`, data: user });
                        // Return if the user already exists.
                        return;
                    }

                    const userParams = {
                        name: user.displayName ?? '',
                        pendingDonations: [],
                        createdAt: FieldValue.serverTimestamp(),
                        modifiedAt: FieldValue.serverTimestamp()
                    };

                    const userDetailParams = {
                        user: userRef,
                        emails: [user.email],
                        phones: [],
                        addresses: [],
                        websites: [],
                        createdAt: FieldValue.serverTimestamp(),
                        modifiedAt: FieldValue.serverTimestamp(),
                        email: user.email
                    };

                    const userDetailRef = db.collection(USER_DETAILS_COLLECTION).doc(user.uid);

                    transaction.create(userRef, userParams);
                    transaction.create(userDetailRef, userDetailParams);
                })
                .catch((error) => logger.error({ location: 'createNewUser', error: error }));
            // Claims may have already been set elsewhere.

            const userRecord = await auth.getUser(user.uid);
            if (userRecord.customClaims == null || Object.keys(userRecord.customClaims).length == 0) {
                await auth.setCustomUserClaims(user.uid, {
                    donor: true,
                    verified: false
                });
            }
        } catch (error) {
            _addEvent({ location: 'createNewUser (onCall)', error: error, data: user });
        }
    });

export const updateUser = async (request: any): Promise<void> => {
    try {
        const { uid, accountInformation } = request;
        console.log(uid, accountInformation);
        await auth.updateUser(uid, accountInformation);
    } catch (error) {
        console.log('error updating user from firebaseAdmin', error);
    }
};

export const listAllUsers = async (): Promise<UserCardProps[]> => {
    try {
        const usersList = await auth.listUsers(1000);
        const listUsersResult: UserRecord[] = usersList.users;
        const listUsers: UserCardProps[] = listUsersResult.map((userRecord) => {
            const userCardProps: UserCardProps = {
                uid: userRecord.uid,
                email: userRecord.email,
                emailVerified: userRecord.emailVerified,
                displayName: userRecord.displayName,
                photoURL: userRecord.photoURL,
                phoneNumber: userRecord.phoneNumber,
                disabled: userRecord.disabled,
                metadata: userRecord.metadata,
                customClaims: userRecord.customClaims
            };
            //To prevent 'Only plain objects can be passed to Client Components from Server Components' error
            return JSON.parse(JSON.stringify(userCardProps));
        });
        return listUsers;
    } catch (error) {
        console.log('error listing users', error);
    }
    return Promise.reject();
};

export const getImageAsSignedUrl = async (request: any): Promise<any> => {
    let fileExists = null;
    try {
        _verifyAuthenticated(request);
        const bucket = storage.bucket().name;
        const url = request.data.url;
        const fileName = url.split('/')[3];
        const file = storage.bucket(bucket).file(fileName);
        const accessibleAtTime = new Date();
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 2);
        fileExists = await file.exists();
        const signedUrlResponse = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            accessibleAt: accessibleAtTime,
            expires: expirationTime
        });
        return signedUrlResponse[0];
    } catch (error: any) {
        const keys = [];
        for (const key in error) {
            keys.push(key);
        }
        _addEvent({
            location: 'getImageAsSignedUrl',
            fileExists: fileExists,
            keys: keys,
            auth: request.auth,
            data: request.data,
            header: request.rawrequest?.rawHeaders,
            code: error.code,
            name: error.name,
            details: error.details,
            errorInfo: error.errorInfo
        });
    }
    return Promise.reject();
};

export const getUidByEmail = async (request: any): Promise<string> => {
    try {
        _verifyAuthenticated(request);
        if (request.data == undefined) {
            throw new Error('Data was not provided in this request.');
        }
        const data = request.data;
        if (request.options == undefined) {
            throw new Error('Options were not provided in this request.');
        }
        const options = data.options;
        if (options.email == undefined) {
            throw new Error("'email' is not defined in options.");
        }
        const email = options.email;
        const uid = (await auth.getUserByEmail(email)).uid;
        return uid;
    } catch (error) {
        _addEvent({ location: 'getUidByEmail' });
    }
    return Promise.reject();
};

export const isEmailInUse = async (request: any) => {
    try {
        const email = request.email;
        const userRecord: UserRecord = await auth.getUserByEmail(email);
        if (userRecord !== undefined) {
            logger.error({ error: `${email} was queried via this onCall method.`, data: request.data });
            return true;
        } else {
            return false;
        }
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            return false;
        }

        if (error.code !== 'auth/invalid-email') {
            logger.error(error);
            _addEvent({ location: 'isEmailInUse', error: error, data: request.data });
        }
    }
    return true;
};

export const setClaimForNewUser = async (request: any) => {
    try {
        _verifyAuthenticated(request);
        const userId = request.data.userId;
        await auth.setCustomUserClaims(userId, {
            donor: true,
            verified: false
        });
    } catch (error) {
        _addEvent({ location: 'setClaimForNewUser' });
    }
};

//NOTE: Setting claims will overwrite existing claims! Must include all claims in requests.
export const setClaims = async (request: any) => {
    try {
        const { userId, claims } = request;
        auth.setCustomUserClaims(userId, claims);
    } catch (error) {
        _addEvent({ location: 'setClaimForNewUser', error: error });
    }
};

// Action based claims.
export const setClaimForDonationReadAccess = async (request: any) => {
    try {
        _verifyAuthenticated(request);
        await _verifyAdmin(request);
        const userId = request.data.userId;
        const canReadDonations = request.data.canReadDonations;
        const claimName = 'can-read-donations';
        _setClaim(userId, claimName, canReadDonations);
    } catch (error) {
        _addEvent({ location: 'setClaimForDonationReadAccess' });
    }
};

export const toggleCanReadDonations = async (request: any) => {
    try {
        _verifyAuthenticated(request);
        await _verifyAdmin(request);
        const userId = request.data.userId;
        const claimName = 'can-read-donations';
        const currentClaim = await _checkClaim(userId, claimName);
        _setClaim(userId, claimName, !currentClaim);
    } catch (error) {
        _addEvent({ location: 'toggleCanReadDonations' });
    }
};

// Role based claims.

export const setClaimForAdmin = async (request: any) => {
    try {
        _verifyAuthenticated(request);
        await _verifyAdmin(request);
        const userId = request.data.userId;
        const isAdmin = request.data.isAdmin;
        const claimName = 'admin';
        _setClaim(userId, claimName, isAdmin);
    } catch (error) {
        _addEvent({ location: 'setClaimForAdmin' });
    }
};

export const setClaimForAidWorker = async (request: any) => {
    try {
        _verifyAuthenticated(request);
        const userId = request.data.userId;
        const isAidWorker = request.data.isAidWorker;
        const claimName = 'aid-worker';
        _setClaim(userId, claimName, isAidWorker);
    } catch (error) {
        _addEvent({ location: 'setClaimForAidWorker' });
    }
};

export const setClaimForDonor = async (request: any) => {
    try {
        _verifyAuthenticated(request);
        const userId = request.data.userId;
        const isDonor = request.data.isDonor;
        const claimName = 'donor';
        _setClaim(userId, claimName, isDonor);
    } catch (error) {
        _addEvent({ location: 'setClaimForDonor' });
    }
};

export const setClaimForVerified = async (request: any) => {
    try {
        _verifyAuthenticated(request);
        await _verifyAdmin(request);
        const userId = request.data.userId;
        const isVerified = request.data.isVerified;
        const claimName = 'verified';
        _setClaim(userId, claimName, isVerified);
    } catch (error) {
        _addEvent({ location: 'setClaimForVerified' });
    }
};

export const setClaimForVolunteer = async (request: any) => {
    try {
        _verifyAuthenticated(request);
        const userId = request.data.userId;
        const isVolunteer = request.data.isVolunteer;
        const claimName = 'volunteer';
        _setClaim(userId, claimName, isVolunteer);
    } catch (error) {
        _addEvent({ location: 'setClaimForVolunteer' });
    }
};

export const registerNewUser = async (request: any): Promise<any> => {
    try {
        const data = request.data;
        _verifyAuthenticated(request);
        await _verifyAdmin(request);
        if (data.options == null) {
            throw new Error('Options were not provided in the request.');
        }
        const options = data.options;
        for (const key of ['displayName', 'email', 'password']) {
            if (options[key] == null) {
                throw new Error(`${key} was not provided in the request.`);
            }
        }
        const displayName = options.displayName;
        const email = options.email;
        const password = options.password;
        const properties = {
            displayName: displayName,
            email: email,
            password: password,
            emailVerified: false,
            disabled: false
        };
        const adminAuth = admin.auth();
        const userRecord = await adminAuth.createUser(properties);
        const claims = options.claims;
        await adminAuth.setCustomUserClaims(userRecord.uid, claims);
        return { ok: true };
    } catch (error) {
        _addEvent({ location: 'registerNewUser', error: error });
    }
    return { ok: false };
};

export const setUserAccount = async (request: any): Promise<any> => {
    let accountInformation: any = null;
    let userId: string | null | undefined;
    try {
        _verifyAuthenticated(request);
        const db = getFirestore(app);
        const data = request.data;
        userId = data.userId;
        accountInformation = data.accountInformation;
        if (userId == null) {
            throw new Error('userId is not defined.');
        }
        const userRef = await db.collection(USERS_COLLECTION).doc(userId);
        const userDocument = await userRef.get();
        const userDetailsRef = await db.collection(USER_DETAILS_COLLECTION).doc(userId);
        const userDetailsDocument = await userDetailsRef.get();
        if (userDocument.exists && userDetailsDocument.exists) {
            const userChanges: any = {};
            const userDetailChanges: any = {};
            const name: any = accountInformation.name;
            const photo: any = accountInformation.photo;
            const primaryContact: any = stripNullUndefined(accountInformation.contact);
            const primaryLocation: any = stripNullUndefined(accountInformation.location);

            if (name !== null && name !== undefined) {
                userChanges['name'] = name;
            }

            if (photo !== null && photo !== undefined) {
                userChanges['photo'] = photo;
            }

            if (primaryContact !== null && primaryContact !== undefined) {
                for (const key in primaryContact) {
                    if (primaryContact[key] !== null && primaryContact[key] !== undefined) {
                        userDetailChanges[key] = primaryContact[key];
                    }
                }

                if (userDetailChanges.email !== null && userDetailChanges.email !== undefined) {
                    userDetailChanges.emails = FieldValue.arrayUnion(userDetailChanges.email);
                }

                if (userDetailChanges.phone !== null && userDetailChanges.phone !== undefined) {
                    userDetailChanges.phones = FieldValue.arrayUnion(userDetailChanges.phone);
                }

                if (userDetailChanges.website !== null && userDetailChanges.website !== undefined) {
                    userDetailChanges.websites = FieldValue.arrayUnion(userDetailChanges.website);
                }
            }

            if (primaryLocation !== null && primaryLocation !== undefined) {
                if (userDetailChanges.address === null || userDetailChanges.address === undefined) {
                    userDetailChanges.address = {};
                }

                for (const key in primaryLocation) {
                    if (primaryLocation[key] !== null && primaryLocation[key] !== undefined) {
                        userDetailChanges['address'][key] = primaryLocation[key];
                    }
                }

                userDetailChanges.addresses = FieldValue.arrayUnion(userDetailChanges.address);
            }

            if (Object.keys(userChanges).length > 0) {
                userChanges['modifiedAt'] = FieldValue.serverTimestamp();
                stripNullUndefined(userChanges);
            }

            if (Object.keys(userDetailChanges).length > 0) {
                userDetailChanges['modifiedAt'] = FieldValue.serverTimestamp();
                stripNullUndefined(userDetailChanges);
            }

            db.runTransaction(async (transaction) => {
                transaction.set(userRef, userChanges);
                transaction.set(userDetailsRef, userDetailChanges);
                return Promise.resolve();
            });
        }
    } catch (error: any) {
        const keys = [];
        for (const key in error) {
            keys.push(key);
        }
        logger.error({
            error: error,
            location: 'setUserAccount',
            keys: keys,
            accountInformation: accountInformation,
            userId: userId ?? 'undefined'
        });
        _addEvent({
            location: 'setUserAccount',
            keys: keys,
            accountInformation: accountInformation,
            userId: userId ?? 'undefined'
        });
    }
    return new HttpsError('internal', 'Internal error.');
};

export const toggleClaimForAdmin = async (request: any) => {
    try {
        _verifyAuthenticated(request);
        await _verifyAdmin(request);
        const userId = request.data.userId;
        const claimName = 'admin';
        _toggleClaim(userId, claimName);
    } catch (error) {
        _addEvent({ location: 'toggleClaimForAdmin' });
    }
};

export const toggleClaimForAidWorker = async (request: any) => {
    try {
        _verifyAuthenticated(request);
        const userId = request.data.userId;
        const claimName = 'aid-worker';
        _toggleClaim(userId, claimName);
    } catch (error) {
        _addEvent({ location: 'toggleClaimForAidWorker' });
    }
};

export const toggleClaimForDonor = async (request: any) => {
    try {
        _verifyAuthenticated(request);
        const userId = request.data.userId;
        const claimName = 'donor';
        _toggleClaim(userId, claimName);
    } catch (error) {
        _addEvent({ location: 'toggleClaimForDonor' });
    }
};

export const toggleClaimForVerified = async (request: any) => {
    try {
        _verifyAuthenticated(request);
        await _verifyAdmin(request);
        const userId = request.data.userId;
        const claimName = 'verified';
        _toggleClaim(userId, claimName);
    } catch (error) {
        _addEvent({ location: 'toggleClaimForVerified' });
    }
};

export const toggleClaimForVolunteer = async (request: any) => {
    try {
        _verifyAuthenticated(request);
        const userId = request.data.userId;
        const claimName = 'volunteer';
        _toggleClaim(userId, claimName);
    } catch (error) {
        _addEvent({ location: 'toggleClaimForVolunteer' });
    }
};

// Non-exported utility methods
async function _checkClaims(idToken: string, claimNames: string[]) {
    try {
        let userClaims = {};
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
        _addEvent({ location: 'checkClaim' });
    }
    return Promise.reject();
}

async function _addEvent(object: any) {
    try {
        const currentTime = new Date();
        const currentTimeString = currentTime.toDateString();
        const db = getFirestore(app);
        const eventParams: Event = {
            type: '',
            note: JSON.stringify(object),
            createdBy: 'system',
            createdAt: currentTimeString,
            modifiedAt: currentTimeString
        };
        await db.collection(EVENTS_COLLECTION).add(eventParams);
    } catch (error) {
        logger.error(error);
    }
}

async function _checkClaim(userId: string, claimName: string) {
    try {
        const claims = (await auth.getUser(userId)).customClaims;
        if (claims === undefined || claims === null) {
            return Promise.reject();
        }
        const claimValue = claims[claimName];
        return claimValue !== undefined && claimValue === true ? true : false;
    } catch (error) {
        _addEvent({ location: 'checkClaim' });
    }
    return Promise.reject();
}

async function _toggleClaim(userId: string, claimName: string) {
    try {
        const claims = (await auth.getUser(userId)).customClaims;
        if (claims === undefined || claims === null) {
            return Promise.reject();
        }
        const claimValue = claims[claimName];
        if (claimValue === undefined || claimValue === null) {
            _setClaim(userId, claimName, false);
        } else {
            _setClaim(userId, claimName, !claimValue);
        }
    } catch (error) {
        _addEvent({ location: 'toggleClaim' });
    }
    return Promise.reject();
}

async function _setClaim(userId: string, claimName: string, claimValue: any) {
    try {
        const customClaims = (await auth.getUser(userId)).customClaims;
        auth.setCustomUserClaims(userId, {
            [claimName]: claimValue,
            ...customClaims
        });
    } catch (error) {
        _addEvent({ location: 'setClaim' });
    }
}

async function _verifyAdmin(request: any) {
    // const callee = await getAuth(app).getUser(request.userId);
    // const adminClaimValue = callee.customClaims?.admin;
    // console.log(callee, 'claimvalue: ', adminClaimValue);
    // if (adminClaimValue == null || adminClaimValue !== true) {
    //     throw new HttpsError('internal', 'Internal error');
    // }
    auth.verifyIdToken(request.idToken).then((claims) => console.log(claims));
}

function _verifyAuthenticated(request: any) {
    if (!request?.auth) {
        throw new HttpsError('internal', 'Internal error.');
    }
}

function stripNullUndefined(object: any) {
    for (const key in object) {
        if (object[key] instanceof Object) {
            stripNullUndefined(object[key]);
        }
        if (object[key] === undefined || object[key] === null) {
            delete object[key];
        }
    }
    return object;
}
