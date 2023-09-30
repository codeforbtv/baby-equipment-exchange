//Libs
import { getDb, getUserId } from './firebase'
import { 
    arrayUnion,
    collection,
    doc,
    DocumentData,
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
    } from 'firebase/firestore'
//Models
import { IUser, User } from '@/models/user'
import { IUserDetail, UserDetail } from '@/models/user-detail'
//Modules
import {

} from 'firebase/firestore'
//Types
import { AccountInformation, NewUser, Note } from '@/types/post-data'
import { stripNullUndefined } from '@/utils/utils'
import { Event, IEvent } from '@/models/event'
import { addEvent } from './firebase-admin'

export const USERS_COLLECTION = 'Users'
export const USER_DETAILS_COLLECTION = 'UserDetails'

const userConverter = {
    toFirestore(user: User): DocumentData {
        const userData: IUser = {
            name: user.getName(),
            pendingDonations: user.getPendingDonations(),
            photo: user.getPhoto(),
            createdAt: user.getCreatedAt(),
            modifiedAt: user.getModifiedAt()
        }

        for (const key in userData) {
            if (userData[key] === undefined || userData[key] === null) {
                delete userData[key]
            }
        }

        return userData
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions) {
        const data = snapshot.data(options)!
        const userData: IUser = {
            name: data.name,
            pendingDonations: data.pendingDonations,
            photo: data.photo,
            createdAt: data.createdAt,
            modifiedAt: data.modifiedAt
        }
        return new User(userData)
    }
}

const userDetailConverter = {
    toFirestore(userDetail: UserDetail): DocumentData {
        const userDetailData: IUserDetail = {
            user: userDetail.getUser(),
            emails: userDetail.getEmails(),
            phones: userDetail.getPhones(),
            addresses: userDetail.getAddresses(),
            websites: userDetail.getWebsites(),
            notes: userDetail.getNotes(),
            createdAt: userDetail.getCreatedAt(),
            modifiedAt: userDetail.getModifiedAt(),
            address: userDetail.getPrimaryAddress(),
            email: userDetail.getPrimaryEmail(),
            phone: userDetail.getPrimaryPhone(),
            website: userDetail.getPrimaryWebsite()
        }

        for (const key in userDetailData) {
            if (userDetailData[key] === undefined || userDetailData[key] === null) {
                delete userDetailData[key]
            }
        }

        return userDetailData
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): UserDetail {
        const data = snapshot.data(options)!
        const userDetailData: IUserDetail = {
            user: data.user,
            emails: data.emails,
            phones: data.phones,
            addresses: data.addresses,
            websites: data.websites,
            notes: data.notes,
            createdAt: data.createdAt,
            modifiedAt: data.modifiedAt,
            address: data.address,
            email: data.email,
            phone: data.phone,
            website: data.website
        }
        return new UserDetail(userDetailData)
    }
}

export async function addUser(newUser: NewUser) {
    if ((!newUser.user as any) instanceof String) {
        return
    }

    const userParams: IUser = {
        name: newUser.name!,
        pendingDonations: [],
        photo: newUser.photo!,
        createdAt: serverTimestamp() as Timestamp,
        modifiedAt: serverTimestamp() as Timestamp
    }

    const userDetailParams: IUserDetail = {
        user: newUser.user!,
        emails: [newUser.email!],
        phones: [],
        addresses: [],
        websites: [],
        notes: '',
        createdAt: serverTimestamp() as Timestamp,
        modifiedAt: serverTimestamp() as Timestamp,
        address: undefined,
        email: undefined,
        phone: undefined,
        website: undefined
    }

    const user = new User(userParams)
    const userDetail = new UserDetail(userDetailParams)

    try {
        await runTransaction(getDb(), async (transaction) => {
            const userRef = doc(getDb(), USERS_COLLECTION, newUser.user!)
            const userDetailRef = doc(getDb(), USER_DETAILS_COLLECTION, newUser.user!)
            transaction.set(userRef, userConverter.toFirestore(user))
            transaction.set(userDetailRef, userDetailConverter.toFirestore(userDetail))
        })
    } catch (e) {
        // eslint-disable-line no-empty
    }
}

export async function getUserAccount(): Promise<AccountInformation> {
    const userId: string | null | undefined = await getUserId()
    return _getUserAccount(userId!)
}


export async function getAllUserAccounts() {

    const q = query(collection(getDb(), USERS_COLLECTION))
    const snapshot = await getDocs(q)
    const userIds: string[] = snapshot.docs.map((doc) => doc.id)
    const userAccounts: AccountInformation[] = []
    for (const id of userIds) {
        userAccounts.push(await _getUserAccount(id))
    }
    return userAccounts
}

async function _getUserAccount(userId: string): Promise<AccountInformation> {
    const userRef = doc(getDb(), USERS_COLLECTION, userId!).withConverter(userConverter)
    const userDocument: DocumentSnapshot<User> = await getDoc(userRef)
    const userDetailsRef = doc(getDb(), USER_DETAILS_COLLECTION, userId!).withConverter(userDetailConverter)
    const userDetailDocument: DocumentSnapshot<UserDetail> = await getDoc(userDetailsRef)
    let accountInformation: AccountInformation = {
        name: '',
        contact: {
            user: undefined,
            name: undefined,
            email: undefined,
            phone: undefined,
            website: undefined,
            notes: undefined
        },
        location: {
            line_1: undefined,
            line_2: undefined,
            city: undefined,
            state: undefined,
            zipcode: undefined,
            latitude: undefined,
            longitude: undefined
        },
        photo: undefined
    }

    if (userDocument.exists() && userDetailDocument.exists()) {
        const user: User = userDocument.data()
        const userDetail: UserDetail = userDetailDocument.data()
        accountInformation = {
            name: user.getName(),
            contact: {
                user: userDetail.getUser(),
                name: user.getName(),
                email: userDetail.getPrimaryEmail(),
                phone: userDetail.getPrimaryPhone(),
                website: userDetail.getPrimaryWebsite(),
                notes: userDetail.getNotes()
            },
            location: userDetail.getPrimaryAddress(),
            photo: user.getPhoto()
        }
    }

    return accountInformation
}

export async function setUserAccount(accountInformation: AccountInformation) {
    const userId: string | null | undefined = await getUserId()
    const userRef = doc(getDb(), USERS_COLLECTION, userId!).withConverter(userConverter)
    const userDocument: DocumentSnapshot<User> = await getDoc(userRef)
    const userDetailsRef = doc(getDb(), USER_DETAILS_COLLECTION, userId!).withConverter(userDetailConverter)
    const userDetailDocument: DocumentSnapshot<UserDetail> = await getDoc(userDetailsRef)
    if (userDocument.exists() && userDetailDocument.exists()) {
        const userChanges: any = {}
        const userDetailChanges: any = {}
        const name: any = accountInformation.name
        const photo: any = accountInformation.photo
        const primaryContact: any = stripNullUndefined(accountInformation.contact)
        const primaryLocation: any = stripNullUndefined(accountInformation.location)

        if (name !== null && name !== undefined) {
            userChanges['name'] = name
        }

        if (photo !== null && photo !== undefined) {
            userChanges['photo'] = photo
        }

        if (primaryContact !== null && primaryContact !== undefined) {
            for (const key in primaryContact) {
                if (primaryContact[key] !== null && primaryContact[key] !== undefined) {
                    userDetailChanges[key] = primaryContact[key]
                }
            }

            if (userDetailChanges.email !== null && userDetailChanges.email !== undefined) {
                userDetailChanges.emails = arrayUnion(userDetailChanges.email)
            }

            if (userDetailChanges.phone !== null && userDetailChanges.phone !== undefined) {
                userDetailChanges.phones = arrayUnion(userDetailChanges.phone)
            }

            if (userDetailChanges.website !== null && userDetailChanges.website !== undefined) {
                userDetailChanges.websites = arrayUnion(userDetailChanges.website)
            }
        }

        if (primaryLocation !== null && primaryLocation !== undefined) {
            if (userDetailChanges.address === null || userDetailChanges.address === undefined) {
                userDetailChanges.address = {}
            }

            for (const key in primaryLocation) {
                if (primaryLocation[key] !== null && primaryLocation[key] !== undefined) {
                    userDetailChanges['address'][key] = primaryLocation[key]
                }
            }

            userDetailChanges.addresses = arrayUnion(userDetailChanges.address)
        }

        if (Object.keys(userChanges).length > 0) {
            userChanges['modifiedAt'] = serverTimestamp()
            stripNullUndefined(userChanges)
            await updateDoc(userRef, userChanges)
        }

        if (Object.keys(userDetailChanges).length > 0) {
            userDetailChanges['modifiedAt'] = serverTimestamp()
            stripNullUndefined(userDetailChanges)
            await updateDoc(userDetailsRef, userDetailChanges)
        }
    }
}

export async function addNote(note: Note) {
    
    const userId: string | null | undefined = await getUserId()

    if (!((userId as any) instanceof String)) {
        // TODO
        addEvent(note)
        return
    }

    const eventParams: IEvent = {
        type: '',
        note: note.text,
        createdBy: userId!,
        createdAt: serverTimestamp() as  Timestamp,
        modifiedAt: serverTimestamp() as Timestamp
    }
    const event = new Event(eventParams)

    if (note.destinationCollection === USERS_COLLECTION) {
        const userDetailsRef = doc(getDb(), USER_DETAILS_COLLECTION, note.destinationId).withConverter(userDetailConverter)
        await updateDoc(
            userDetailsRef,
            {
                notes: arrayUnion(event)
            }
        )
    }
}