//Libs
import { getDb } from './firebase'
//Models
import { IUser, User } from '@/models/user'
import { IUserDetail, UserDetail } from '@/models/user-detail'
//Modules
import { doc, DocumentData, QueryDocumentSnapshot, setDoc, SnapshotOptions, Timestamp } from 'firebase/firestore'
//Types
import { NewUser } from '@/types/post-data'

const USERS_COLLECTION = 'Users'
const USER_DETAILS_COLLECTION = 'UserDetails'

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
            modifiedAt: userDetail.getModifiedAt()
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
            modifiedAt: data.modifiedAt
        }
        return new UserDetail(userDetailData)
    }
}

export async function addUser(newUser: NewUser) {
    const currentTime = Date.now()
    const timestamp = Timestamp.fromMillis(currentTime)
    const userParams: IUser = {
        name: newUser.name!,
        pendingDonations: [],
        photo: newUser.photo!,
        createdAt: timestamp,
        modifiedAt: timestamp
    }

    const user = new User(userParams)

    const userDetailParams: IUserDetail = {
        user: newUser.user!,
        emails: [newUser.email!],
        phones: [],
        addresses: [],
        websites: [],
        notes: '',
        createdAt: timestamp,
        modifiedAt: timestamp
    }

    const userDetail = new UserDetail(userDetailParams)

    try {
        const userRef = await setDoc(doc(getDb(), USERS_COLLECTION, newUser.user!), userConverter.toFirestore(user))
        const userDetailRef = await setDoc(doc(getDb(), USER_DETAILS_COLLECTION, newUser.user!), userDetailConverter.toFirestore(userDetail))
    } catch (error) {
        // eslint-disable-line no-empty
    }
}
