//Libs
import { getDb, getFirebaseStorage, getUserId } from './firebase'
import { ref, uploadBytes } from 'firebase/storage'
//Models
import { IUser, User } from '@/models/user'
import { IUserDetail, UserDetail } from '@/models/user-detail'
//Modules
import { addDoc, collection, doc, DocumentData, getDoc, getFirestore, QueryDocumentSnapshot, setDoc, SnapshotOptions, Timestamp } from 'firebase/firestore'
//Types
import { NewUser } from '@/types/post-data'

const USERS_COLLECTION = 'Users'
const USER_DETAILS_COLLECTION = 'UserDetails'

const userConverter = {
    toFirestore(user: User): DocumentData {
        return {
            name: user.getName(),
            gender: user.getGender(),
            dob: user.getDob(),
            pendingDonations: user.getPendingDonations(),
            photo: user.getPhoto(),
            createdAt: user.getCreatedAt(),
            modifiedAt: user.getModifiedAt()
        }
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions) {
        const data = snapshot.data(options)!
        const userData: IUser = {
            name: data.name,
            gender: data.gender,
            dob: data.dob,
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
        return {
            user: userDetail.getUser(),
            emails: userDetail.getEmails(),
            phones: userDetail.getPhones(),
            addresses: userDetail.getAddresses(),
            websites: userDetail.getWebsites(),
            notes: userDetail.getNotes(),
            createdAt: userDetail.getCreatedAt(),
            modifiedAt: userDetail.getModifiedAt()
        }
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

export async function newUser(newUser: NewUser) {
    const currentTime = Date.now()
    const timestamp = Timestamp.fromMillis(currentTime)

    const userData: IUser = {
        name: newUser.name,
        gender: newUser.gender,
        dob: newUser.dob,
        pendingDonations: [],
        photo: newUser.photo,
        createdAt: timestamp,
        modifiedAt: timestamp
    }

    const userDetailData: IUserDetail = {
        user: newUser.user,
        emails: [newUser.email],
        phones: [],
        addresses: [],
        websites: [],
        notes: '',
        createdAt: timestamp,
        modifiedAt: timestamp
    }

    const userRef = await setDoc(doc(getDb(), USERS_COLLECTION, newUser.user), userData)

    const userDetailRef = await setDoc(doc(getDb(), USER_DETAILS_COLLECTION, newUser.user), userDetailData)
}
