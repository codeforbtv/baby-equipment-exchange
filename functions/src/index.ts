// Libs
import { onCall, CallableRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

import { UserRecord } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';

const EVENTS_COLLECTION = 'Event';
const USERS_COLLECTION = 'Users';

type Event = {
    type: string;
    note: string;
    createdBy: string;
    createdAt: string;
    modifiedAt: string;
};

admin.initializeApp();
const auth = admin.auth();
const db = admin.firestore();

export const createNewUser = onCall(async (request: CallableRequest): Promise<void> => {
    try {
        const { email, password, displayName, phoneNumber } = request.data;

        const userRecord: UserRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: displayName,
            disabled: true
        });

        const docRef = db.collection(USERS_COLLECTION).doc(userRecord.uid);
        const doc = await docRef.get();
        if (doc.exists) {
            logger.error('User already exists in database', doc.data());
            return;
        } else {
            const userParams = {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                phoneNumber: phoneNumber,
                requestedItems: [],
                notes: [],
                modifiedAt: FieldValue.serverTimestamp()
            };
            docRef.set(userParams);
        }
    } catch (error) {
        logger.error('Error creating new user', error);
    }
});

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
    } catch (error) {
        logger.error(error);
    }
}

export const addEvent = onCall(async (request: any) => {
    try {
        const object = request.data.object;
        _addEvent(object);
    } catch (error) {
        logger.error(error);
    }
});

// export const checkClaims = onCall(async (request: any) => {
//     try {
//         _verifyAuthenticated(request);
//         await _verifyAdmin(request);
//         const userId = request.data.userId;
//         const claimNames = request.data.claimNames;
//         return await _checkClaims(userId, claimNames);
//     } catch (error) {
//         _addEvent({ location: 'checkClaims' });
//     }
//     throw new HttpsError('internal', 'Internal error');
// });

// export const getImageAsSignedUrl = onCall(async (request: any) => {
//     let fileExists = null;
//     try {
//         _verifyAuthenticated(request);
//         const bucket = storage.bucket().name;
//         const url = request.data.url;
//         const fileName = url.split('/')[3];
//         const file = storage.bucket(bucket).file(fileName);
//         const accessibleAtTime = new Date();
//         const expirationTime = new Date();
//         expirationTime.setMinutes(expirationTime.getMinutes() + 2);
//         fileExists = await file.exists();
//         const signedUrlResponse = await file.getSignedUrl({
//             version: 'v4',
//             action: 'read',
//             accessibleAt: accessibleAtTime,
//             expires: expirationTime
//         });
//         return signedUrlResponse[0];
//     } catch (error: any) {
//         const keys = [];
//         for (const key in error) {
//             keys.push(key);
//         }
//         _addEvent({
//             location: 'getImageAsSignedUrl',
//             fileExists: fileExists,
//             keys: keys,
//             auth: request.auth,
//             data: request.data,
//             header: request.rawrequest?.rawHeaders,
//             code: error.code,
//             name: error.name,
//             details: error.details,
//             errorInfo: error.errorInfo
//         });
//     }
//     return Promise.reject();
// });

// export const getUidByEmail = onCall(async (request: any): Promise<any> => {
//     try {
//         _verifyAuthenticated(request);
//         if (request.data == undefined) {
//             throw new Error('Data was not provided in this request.');
//         }
//         const data = request.data;
//         if (request.options == undefined) {
//             throw new Error('Options were not provided in this request.');
//         }
//         const options = data.options;
//         if (options.email == undefined) {
//             throw new Error("'email' is not defined in options.");
//         }
//         const email = options.email;
//         const adminAuth = getAuth(app);
//         const uid = (await adminAuth.getUserByEmail(email)).uid;
//         return uid;
//     } catch (error) {
//         _addEvent({ location: 'getUidByEmail' });
//     }
//     return Promise.reject();
// });

// export const isEmailInvalid = onCall(async (request: any) => {
//     try {
//         const email = request.data.email;
//         const userRecord: UserRecord = await getAuth(app).getUserByEmail(email);
//         if (userRecord !== undefined) {
//             logger.error({ error: `${email} was queried via this onCall method.`, data: request.data });
//             return { value: true };
//         } else {
//             return { value: false };
//         }
//     } catch (error: any) {
//         logger.error(error);
//         _addEvent({ location: 'isEmailInvalid', error: error, data: request.data });
//         if (error.code === 'auth/user-not-found') {
//             return { value: false };
//         }
//         if (error.code !== 'auth/invalid-email') {
//             _addEvent({ location: 'isEmailInvalid', error: error, data: request.data });
//         }
//     }
//     return { value: true };
// });

// export const setClaimForNewUser = onCall(async (request: any) => {
//     try {
//         _verifyAuthenticated(request);
//         const userId = request.data.userId;
//         await getAuth(app).setCustomUserClaims(userId, {
//             donor: true,
//             verified: false
//         });
//     } catch (error) {
//         _addEvent({ location: 'setClaimForNewUser' });
//     }
// });

// export const setClaims = onCall(async (request: any) => {
//     try {
//         _verifyAuthenticated(request);
//         await _verifyAdmin(request);
//         if (request.data == null) {
//             throw new Error('No data provided in the request.');
//         }
//         const data = request.data;
//         if (data.options == null) {
//             throw new Error('Options are not present in the request.');
//         }
//         const options = data.options;
//         if (options.userId == null) {
//             throw new Error('A userId is not supplied in the request');
//         }
//         const userId = options.userId;
//         if (options.claims == null) {
//             throw new Error('Claims are not supplied in the request.');
//         }
//         const claims = options.claims;
//         await getAuth(app).setCustomUserClaims(userId, claims);
//     } catch (error) {
//         _addEvent({ location: 'setClaimForNewUser', error: error });
//     }
// });

// // Action based claims.
// export const setClaimForDonationReadAccess = onCall(async (request: any) => {
//     try {
//         _verifyAuthenticated(request);
//         await _verifyAdmin(request);
//         const userId = request.data.userId;
//         const canReadDonations = request.data.canReadDonations;
//         const claimName = 'can-read-donations';
//         _setClaim(userId, claimName, canReadDonations);
//     } catch (error) {
//         _addEvent({ location: 'setClaimForDonationReadAccess' });
//     }
// });

// export const toggleCanReadDonations = onCall(async (request: any) => {
//     try {
//         _verifyAuthenticated(request);
//         await _verifyAdmin(request);
//         const userId = request.data.userId;
//         const claimName = 'can-read-donations';
//         const currentClaim = await _checkClaim(userId, claimName);
//         _setClaim(userId, claimName, !currentClaim);
//     } catch (error) {
//         _addEvent({ location: 'toggleCanReadDonations' });
//     }
// });

// // Role based claims.

// export const setClaimForAdmin = onCall(async (request: any) => {
//     try {
//         _verifyAuthenticated(request);
//         await _verifyAdmin(request);
//         const userId = request.data.userId;
//         const isAdmin = request.data.isAdmin;
//         const claimName = 'admin';
//         _setClaim(userId, claimName, isAdmin);
//     } catch (error) {
//         _addEvent({ location: 'setClaimForAdmin' });
//     }
// });

// export const setClaimForAidWorker = onCall(async (request: any) => {
//     try {
//         _verifyAuthenticated(request);
//         const userId = request.data.userId;
//         const isAidWorker = request.data.isAidWorker;
//         const claimName = 'aid-worker';
//         _setClaim(userId, claimName, isAidWorker);
//     } catch (error) {
//         _addEvent({ location: 'setClaimForAidWorker' });
//     }
// });

// export const setClaimForDonor = onCall(async (request: any) => {
//     try {
//         _verifyAuthenticated(request);
//         const userId = request.data.userId;
//         const isDonor = request.data.isDonor;
//         const claimName = 'donor';
//         _setClaim(userId, claimName, isDonor);
//     } catch (error) {
//         _addEvent({ location: 'setClaimForDonor' });
//     }
// });

// export const setClaimForVerified = onCall(async (request: any) => {
//     try {
//         _verifyAuthenticated(request);
//         await _verifyAdmin(request);
//         const userId = request.data.userId;
//         const isVerified = request.data.isVerified;
//         const claimName = 'verified';
//         _setClaim(userId, claimName, isVerified);
//     } catch (error) {
//         _addEvent({ location: 'setClaimForVerified' });
//     }
// });

// export const setClaimForVolunteer = onCall(async (request: any) => {
//     try {
//         _verifyAuthenticated(request);
//         const userId = request.data.userId;
//         const isVolunteer = request.data.isVolunteer;
//         const claimName = 'volunteer';
//         _setClaim(userId, claimName, isVolunteer);
//     } catch (error) {
//         _addEvent({ location: 'setClaimForVolunteer' });
//     }
// });

// export const registerNewUser = onCall(async (request: any) => {
//     try {
//         const data = request.data;
//         _verifyAuthenticated(request);
//         await _verifyAdmin(request);
//         if (data.options == null) {
//             throw new Error('Options were not provided in the request.');
//         }
//         const options = data.options;
//         for (const key of ['displayName', 'email', 'password']) {
//             if (options[key] == null) {
//                 throw new Error(`${key} was not provided in the request.`);
//             }
//         }
//         const displayName = options.displayName;
//         const email = options.email;
//         const password = options.password;
//         const properties = {
//             displayName: displayName,
//             email: email,
//             password: password,
//             emailVerified: false,
//             disabled: false
//         };
//         const adminAuth = admin.auth();
//         const userRecord = await adminAuth.createUser(properties);
//         const claims = options.claims;
//         await adminAuth.setCustomUserClaims(userRecord.uid, claims);
//         return { ok: true };
//     } catch (error) {
//         _addEvent({ location: 'registerNewUser', error: error });
//     }
//     return { ok: false };
// });

// export const setUserAccount = onCall(async (request: any) => {
//     let accountInformation: any = null;
//     let userId: string | null | undefined;
//     try {
//         _verifyAuthenticated(request);
//         const db = getFirestore(app);
//         const data = request.data;
//         userId = data.userId;
//         accountInformation = data.accountInformation;
//         if (userId == null) {
//             throw new Error('userId is not defined.');
//         }
//         const userRef = await db.collection(USERS_COLLECTION).doc(userId);
//         const userDocument = await userRef.get();
//         const userDetailsRef = await db.collection(USER_DETAILS_COLLECTION).doc(userId);
//         const userDetailsDocument = await userDetailsRef.get();
//         if (userDocument.exists && userDetailsDocument.exists) {
//             const userChanges: any = {};
//             const userDetailChanges: any = {};
//             const name: any = accountInformation.name;
//             const photo: any = accountInformation.photo;
//             const primaryContact: any = stripNullUndefined(accountInformation.contact);
//             const primaryLocation: any = stripNullUndefined(accountInformation.location);

//             if (name !== null && name !== undefined) {
//                 userChanges['name'] = name;
//             }

//             if (photo !== null && photo !== undefined) {
//                 userChanges['photo'] = photo;
//             }

//             if (primaryContact !== null && primaryContact !== undefined) {
//                 for (const key in primaryContact) {
//                     if (primaryContact[key] !== null && primaryContact[key] !== undefined) {
//                         userDetailChanges[key] = primaryContact[key];
//                     }
//                 }

//                 if (userDetailChanges.email !== null && userDetailChanges.email !== undefined) {
//                     userDetailChanges.emails = FieldValue.arrayUnion(userDetailChanges.email);
//                 }

//                 if (userDetailChanges.phone !== null && userDetailChanges.phone !== undefined) {
//                     userDetailChanges.phones = FieldValue.arrayUnion(userDetailChanges.phone);
//                 }

//                 if (userDetailChanges.website !== null && userDetailChanges.website !== undefined) {
//                     userDetailChanges.websites = FieldValue.arrayUnion(userDetailChanges.website);
//                 }
//             }

//             if (primaryLocation !== null && primaryLocation !== undefined) {
//                 if (userDetailChanges.address === null || userDetailChanges.address === undefined) {
//                     userDetailChanges.address = {};
//                 }

//                 for (const key in primaryLocation) {
//                     if (primaryLocation[key] !== null && primaryLocation[key] !== undefined) {
//                         userDetailChanges['address'][key] = primaryLocation[key];
//                     }
//                 }

//                 userDetailChanges.addresses = FieldValue.arrayUnion(userDetailChanges.address);
//             }

//             if (Object.keys(userChanges).length > 0) {
//                 userChanges['modifiedAt'] = FieldValue.serverTimestamp();
//                 stripNullUndefined(userChanges);
//             }

//             if (Object.keys(userDetailChanges).length > 0) {
//                 userDetailChanges['modifiedAt'] = FieldValue.serverTimestamp();
//                 stripNullUndefined(userDetailChanges);
//             }

//             db.runTransaction(async (transaction) => {
//                 transaction.set(userRef, userChanges);
//                 transaction.set(userDetailsRef, userDetailChanges);
//                 return Promise.resolve();
//             });
//         }
//     } catch (error: any) {
//         const keys = [];
//         for (const key in error) {
//             keys.push(key);
//         }
//         logger.error({
//             error: error,
//             location: 'setUserAccount',
//             keys: keys,
//             accountInformation: accountInformation,
//             userId: userId ?? 'undefined'
//         });
//         _addEvent({
//             location: 'setUserAccount',
//             keys: keys,
//             accountInformation: accountInformation,
//             userId: userId ?? 'undefined'
//         });
//     }
//     return new HttpsError('internal', 'Internal error.');
// });

// export const toggleClaimForAdmin = onCall(async (request: any) => {
//     try {
//         _verifyAuthenticated(request);
//         await _verifyAdmin(request);
//         const userId = request.data.userId;
//         const claimName = 'admin';
//         _toggleClaim(userId, claimName);
//     } catch (error) {
//         _addEvent({ location: 'toggleClaimForAdmin' });
//     }
// });

// export const toggleClaimForAidWorker = onCall(async (request: any) => {
//     try {
//         _verifyAuthenticated(request);
//         const userId = request.data.userId;
//         const claimName = 'aid-worker';
//         _toggleClaim(userId, claimName);
//     } catch (error) {
//         _addEvent({ location: 'toggleClaimForAidWorker' });
//     }
// });

// export const toggleClaimForDonor = onCall(async (request: any) => {
//     try {
//         _verifyAuthenticated(request);
//         const userId = request.data.userId;
//         const claimName = 'donor';
//         _toggleClaim(userId, claimName);
//     } catch (error) {
//         _addEvent({ location: 'toggleClaimForDonor' });
//     }
// });

// export const toggleClaimForVerified = onCall(async (request: any) => {
//     try {
//         _verifyAuthenticated(request);
//         await _verifyAdmin(request);
//         const userId = request.data.userId;
//         const claimName = 'verified';
//         _toggleClaim(userId, claimName);
//     } catch (error) {
//         _addEvent({ location: 'toggleClaimForVerified' });
//     }
// });

// export const toggleClaimForVolunteer = onCall(async (request: any) => {
//     try {
//         _verifyAuthenticated(request);
//         const userId = request.data.userId;
//         const claimName = 'volunteer';
//         _toggleClaim(userId, claimName);
//     } catch (error) {
//         _addEvent({ location: 'toggleClaimForVolunteer' });
//     }
// });

// // Non-exported utility methods
// async function _checkClaims(userId: string, ...claimNames: string[]) {
//     try {
//         let userClaims = {};
//         const adminAuth = getAuth(app);
//         const claims = (await adminAuth.getUser(userId)).customClaims;
//         if (claims === undefined || claims === null) {
//             return Promise.reject();
//         }
//         for (const claimName of claimNames) {
//             let claimValue = claims[claimName];
//             claimValue = claimValue !== undefined && claimValue === true ? true : false;
//             Object.defineProperty(userClaims, claimName, {
//                 value: claimValue,
//                 enumerable: true,
//                 writable: false
//             });
//         }
//         return userClaims;
//     } catch (error) {
//         _addEvent({ location: 'checkClaim' });
//     }
//     return Promise.reject();
// }

// async function _checkClaim(userId: string, claimName: string) {
//     try {
//         const adminAuth = getAuth(app);
//         const claims = (await adminAuth.getUser(userId)).customClaims;
//         if (claims === undefined || claims === null) {
//             return Promise.reject();
//         }
//         const claimValue = claims[claimName];
//         return claimValue !== undefined && claimValue === true ? true : false;
//     } catch (error) {
//         _addEvent({ location: 'checkClaim' });
//     }
//     return Promise.reject();
// }

// async function _toggleClaim(userId: string, claimName: string) {
//     try {
//         const adminAuth = getAuth(app);
//         const claims = (await adminAuth.getUser(userId)).customClaims;
//         if (claims === undefined || claims === null) {
//             return Promise.reject();
//         }
//         const claimValue = claims[claimName];
//         if (claimValue === undefined || claimValue === null) {
//             _setClaim(userId, claimName, false);
//         } else {
//             _setClaim(userId, claimName, !claimValue);
//         }
//     } catch (error) {
//         _addEvent({ location: 'toggleClaim' });
//     }
//     return Promise.reject();
// }

// async function _setClaim(userId: string, claimName: string, claimValue: any) {
//     try {
//         const adminAuth = getAuth(app);
//         const customClaims = (await adminAuth.getUser(userId)).customClaims;
//         adminAuth.setCustomUserClaims(userId, {
//             [claimName]: claimValue,
//             ...customClaims
//         });
//     } catch (error) {
//         _addEvent({ location: 'setClaim' });
//     }
// }

// async function _verifyAdmin(request: any) {
//     const callee = await getAuth(app).getUser(request.auth.uid);
//     const adminClaimValue = callee.customClaims?.admin;
//     if (adminClaimValue == null || adminClaimValue !== true) {
//         throw new HttpsError('internal', 'Internal error');
//     }
// }

// function _verifyAuthenticated(request: any) {
//     if (!request?.auth) {
//         throw new HttpsError('internal', 'Internal error.');
//     }
// }

// function stripNullUndefined(object: any) {
//     for (const key in object) {
//         if (object[key] instanceof Object) {
//             stripNullUndefined(object[key]);
//         }
//         if (object[key] === undefined || object[key] === null) {
//             delete object[key];
//         }
//     }
//     return object;
// }
