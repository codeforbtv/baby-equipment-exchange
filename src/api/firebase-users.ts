// Libs
import { addErrorEvent, db, auth } from './firebase';
import {
    doc,
    DocumentData,
    getDoc,
    QueryDocumentSnapshot,
    serverTimestamp,
    SnapshotOptions,
    updateDoc,
    where,
    collection,
    query,
    getDocs,
    deleteDoc
} from 'firebase/firestore';

//API
import { getAuthUserById } from './firebaseAdmin';

// Models
import { IUser, UserCollection } from '@/models/user';
import { Event, IEvent } from '@/models/event';
// Types
import { NoteBody } from '@/types/post-data';
// Utility methods
import { stripNullUndefined } from '@/utils/utils';

import {
    NextOrObserver,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInAnonymously,
    signInWithEmailAndPassword,
    signOut,
    User,
    UserCredential
} from 'firebase/auth';

export const USERS_COLLECTION = 'Users';

export const userConverter = {
    toFirestore(user: UserCollection): DocumentData {
        const userData: IUser = {
            uid: user.getUid(),
            email: user.getEmail(),
            displayName: user.getDisplayName(),
            customClaims: user.getCustomClaims(),
            isDisabled: user.getIsDisabled(),
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
            email: data.email,
            displayName: data.displayName,
            customClaims: data.customClaims,
            isDisabled: data.isDisabled,
            phoneNumber: data.phoneNumber,
            requestedItems: data.requestedItems,
            notes: data.notes,
            organization: data.organization,
            modifiedAt: data.modifiedAt
        };
        return new UserCollection(userData);
    }
};

export async function getAllDbUsers(): Promise<IUser[]> {
    try {
        let users: IUser[] = [];
        const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION).withConverter(userConverter));
        usersSnapshot.forEach((doc) => users.push(doc.data()));
        return users;
    } catch (error) {
        addErrorEvent('Error fetching all db users', error);
        throw error;
    }
}

export async function getAllActiveDbUsers(): Promise<IUser[]> {
    try {
        let users: IUser[] = [];
        const q = query(collection(db, USERS_COLLECTION), where('isDisabled', '==', false)).withConverter(userConverter);
        const activeUsersSnapshot = await getDocs(q);
        activeUsersSnapshot.forEach((doc) => users.push(doc.data()));
        return users;
    } catch (error) {
        addErrorEvent('Error fetching active users', error);
        throw error;
    }
}

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

export async function updateDbUser(uid: string, accountInformation: any): Promise<void> {
    if (!auth.currentUser) {
        return Promise.reject(new Error('Must be logged in to update db user'));
    }
    try {
        const userRef = doc(db, USERS_COLLECTION, uid).withConverter(userConverter);
        await updateDoc(userRef, {
            ...accountInformation,
            modifiedAt: serverTimestamp()
        });
    } catch (error) {
        addErrorEvent('Error updating db user', error);
    }
}

export async function deleteDbUser(uid: string): Promise<void> {
    try {
        await deleteDoc(doc(db, USERS_COLLECTION, uid));
    } catch (error) {
        addErrorEvent('Error deleting db User', error);
    }
}

export async function enableDbUser(uid: string): Promise<void> {
    try {
        const docRef = doc(db, USERS_COLLECTION, uid);
        await updateDoc(docRef, { isDisabled: false, customClaims: { 'aid-worker': true } });
    } catch (error) {
        addErrorEvent('Error enabling db User', error);
    }
}

//returns Auth User and db User details combined
export async function getUserDetails(uid: string): Promise<IUser> {
    try {
        const [authUser, dbUser] = await Promise.all([getAuthUserById(uid), getDbUser(uid)]);
        const userDetails: IUser = {
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

export async function getUsersNotifications(): Promise<IUser[]> {
    let users: IUser[] = [];
    try {
        const usersRef = collection(db, USERS_COLLECTION);
        const usersNotificationsQuery = query(usersRef, where('isDisabled', '==', true)).withConverter(userConverter);
        const usersNotificationsSnapshot = await getDocs(usersNotificationsQuery);
        for (const doc of usersNotificationsSnapshot.docs) {
            users.push(doc.data());
        }
        return users;
    } catch (error) {
        addErrorEvent('Get users notifications', error);
    }
    return Promise.reject();
}

export function getUserEmail(): string | null | undefined {
    return auth.currentUser?.email;
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
