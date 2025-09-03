// Libs
import { addErrorEvent, db, getUserId } from './firebase';
import {
    arrayUnion,
    collection,
    doc,
    DocumentData,
    DocumentReference,
    DocumentSnapshot,
    getDoc,
    getDocs,
    query,
    QueryDocumentSnapshot,
    runTransaction,
    serverTimestamp,
    SnapshotOptions,
    Timestamp,
    updateDoc
} from 'firebase/firestore';

//API
import { getAuthUserById } from './firebaseAdmin';

// Models
import { AuthUserRecord, UserDetails } from '@/types/UserTypes';
import { IUser, UserCollection } from '@/models/user';
import { Event, IEvent } from '@/models/event';
// Types
import { AccountInformation, UserBody, NoteBody } from '@/types/post-data';
// Utility methods
import { stripNullUndefined } from '@/utils/utils';

export const USERS_COLLECTION = 'Users';

export const userConverter = {
    toFirestore(user: UserCollection): DocumentData {
        const userData: IUser = {
            uid: user.getUid(),
            phoneNumber: user.getPhoneNumber(),
            requestedItems: user.getRequestedItems(),
            notes: user.getNotes(),
            organization: user.getOrganization(),
            modifiedAt: user.getModifiedAt()
        };

        for (const key in userData) {
            if (userData[key] === undefined || userData[key] === null) {
                delete userData[key];
            }
        }
        return userData;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions) {
        const data = snapshot.data(options)!;
        const userData: IUser = {
            uid: data.uid,
            phoneNumber: data.phoneNumber,
            requestedItems: data.requestedItems,
            notes: data.notes,
            organization: data.organization,
            modifiedAt: data.modifiedAt
        };
        return new UserCollection(userData);
    }
};

export async function getDbUser(uid: string): Promise<IUser> {
    try {
        const userRef = doc(db, `${USERS_COLLECTION}/${uid}`).withConverter(userConverter);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
            return snapshot.data();
        } else {
            Promise.reject('User not found');
        }
    } catch (error) {
        addErrorEvent('Error getting db User', error);
    }
    return Promise.reject();
}

//returns Auth User and db User details combined
export async function getUserDetails(uid: string): Promise<UserDetails> {
    try {
        const [authUser, dbUser] = await Promise.all([getAuthUserById(uid), getDbUser(uid)]);
        const userDetails: UserDetails = {
            uid: authUser.uid,
            email: authUser.email,
            displayName: authUser.displayName,
            disabled: authUser.disabled,
            metadata: authUser.metadata,
            customClaims: authUser.customClaims,
            phoneNumber: dbUser.phoneNumber,
            requestedItems: dbUser.requestedItems,
            notes: dbUser.notes,
            organization: dbUser.organization,
            modifiedAt: dbUser.modifiedAt
        };
        return userDetails;
    } catch (error) {
        addErrorEvent('Get User Details', error);
    }
    return Promise.reject();
}

// async function _getUserAccount(userId: string): Promise<AccountInformation> {
//     const userRef = doc(db, `${USERS_COLLECTION}/${userId}`).withConverter(userConverter);
//     const userDocument: DocumentSnapshot<User> = await getDoc(userRef);
//     const userDetailsRef = doc(db, USER_DETAILS_COLLECTION, userId).withConverter(userDetailConverter);
//     const userDetailDocument: DocumentSnapshot<UserDetail> = await getDoc(userDetailsRef);
//     let accountInformation: AccountInformation = {
//         name: '',
//         contact: {
//             user: undefined,
//             name: undefined,
//             email: undefined,
//             phone: undefined,
//             website: undefined,
//             notes: undefined
//         },
//         location: {
//             line_1: undefined,
//             line_2: undefined,
//             city: undefined,
//             state: undefined,
//             zipcode: undefined,
//             latitude: undefined,
//             longitude: undefined
//         },
//         photo: undefined
//     };

//     if (userDocument.exists() && userDetailDocument.exists()) {
//         const user: User = userDocument.data();
//         const userDetail: UserDetail = userDetailDocument.data();
//         accountInformation = {
//             name: user.getName(),
//             contact: {
//                 user: userRef,
//                 name: user.getName(),
//                 email: userDetail.getPrimaryEmail(),
//                 phone: userDetail.getPrimaryPhone(),
//                 website: userDetail.getPrimaryWebsite(),
//                 notes: userDetail.getNotes()
//             },
//             location: userDetail.getPrimaryAddress(),
//             photo: user.getPhoto()
//         };
//     } else {
//         return Promise.reject();
//     }

//     return accountInformation;
// }

// export async function setUserAccount(accountInformation: AccountInformation) {
//     try {
//         const userId: string = await getUserId();
//         const userRef = doc(db, `${USERS_COLLECTION}/${userId}`).withConverter(userConverter);
//         const userDocument: DocumentSnapshot<User> = await getDoc(userRef);
//         const userDetailsRef = doc(db, `${USER_DETAILS_COLLECTION}/${userId}`).withConverter(userDetailConverter);
//         const userDetailsDocument: DocumentSnapshot<UserDetail> = await getDoc(userDetailsRef);
//         if (userDocument.exists() && userDetailsDocument.exists()) {
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
//                     userDetailChanges.emails = arrayUnion(userDetailChanges.email);
//                 }

//                 if (userDetailChanges.phone !== null && userDetailChanges.phone !== undefined) {
//                     userDetailChanges.phones = arrayUnion(userDetailChanges.phone);
//                 }

//                 if (userDetailChanges.website !== null && userDetailChanges.website !== undefined) {
//                     userDetailChanges.websites = arrayUnion(userDetailChanges.website);
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

//                 userDetailChanges.addresses = arrayUnion(userDetailChanges.address);
//             }

//             if (Object.keys(userChanges).length > 0) {
//                 userChanges['modifiedAt'] = serverTimestamp();
//                 stripNullUndefined(userChanges);
//             }

//             if (Object.keys(userDetailChanges).length > 0) {
//                 userDetailChanges['modifiedAt'] = serverTimestamp();
//                 stripNullUndefined(userDetailChanges);
//             }

//             runTransaction(db, async (transaction) => {
//                 transaction.set(userRef, userChanges);
//                 transaction.set(userDetailsRef, userDetailChanges);
//             });
//         }
//     } catch (error) {
//         // eslint-disable-line no-empty
//     }
// }

export async function addNote(note: NoteBody) {
    try {
        const currentTime = new Date();
        const currentTimeString = currentTime.toDateString();
        const userId: string = await getUserId();
        const eventParams: IEvent = {
            type: '',
            note: note.text,
            createdBy: doc(db, `${USERS_COLLECTION}/${userId}`),
            createdAt: currentTimeString,
            modifiedAt: currentTimeString
        };
        const event = new Event(eventParams);
    } catch (error) {
        addErrorEvent('addNote', { error: error, note: note });
    }
}
