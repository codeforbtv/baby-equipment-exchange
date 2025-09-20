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
    getDocs
} from 'firebase/firestore';

//API
import { getAuthUserById } from './firebaseAdmin';

// Models
import { AuthUserRecord, UserDetails } from '@/types/UserTypes';
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

export async function getUsersNotifications(): Promise<AuthUserRecord[]> {
    let users: AuthUserRecord[] = [];
    try {
        const usersRef = collection(db, USERS_COLLECTION);
        const usersNotificationsQuery = query(usersRef, where('isDisabled', '==', true)).withConverter(userConverter);
        const usersNotificationsSnapshot = await getDocs(usersNotificationsQuery);
        for (const doc of usersNotificationsSnapshot.docs) {
            const authUser = await getAuthUserById(doc.id);
            users.push(authUser);
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
