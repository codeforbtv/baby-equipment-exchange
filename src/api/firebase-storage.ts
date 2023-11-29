//Modules
import {
    collection,
    DocumentData,
    doc,
    getDocs,
    query,
    QueryDocumentSnapshot,
    serverTimestamp,
    setDoc,
    SnapshotOptions,
    Timestamp
} from 'firebase/firestore'
//Models
import { IStorage, Storage } from '@/models/storage'
import { StorageBody } from '@/types/post-data'
//Libs
import { db } from './firebase'

const STORAGE_COLLECTION = 'Storage'

const storageConverter = {
    toFirestore(storage: Storage): DocumentData {
        const storageData: IStorage = {
            active: storage.getActive(),
            name: storage.getName(),
            address: storage.getAddress(),
            pointOfContact: storage.getPointOfContact(),
            createdAt: storage.getCreatedAt(),
            modifiedAt: storage.getModifiedAt()
        }
        for (const key in storageData) {
            if (storageData[key] === undefined) {
                delete storageData[key]
            }
        }
        return storageData
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Storage {
        const data = snapshot.data(options)
        const storageData: IStorage = {
            active: data.active,
            name: data.name,
            address: data.address,
            pointOfContact: data.pointOfContact,
            createdAt: data.createdAt,
            modifiedAt: data.modifiedAt
        }
        return new Storage(storageData)
    }
}

export async function addStorage(newStorage: StorageBody) {
    const storageParams: IStorage = {
        active: newStorage.active,
        name: newStorage.name,
        address: newStorage.address,
        pointOfContact: newStorage.pointOfContact,
        createdAt: serverTimestamp() as Timestamp,
        modifiedAt: serverTimestamp() as Timestamp
    }
    const storage = new Storage(storageParams)
    const storageRef = doc(db, STORAGE_COLLECTION)
    await setDoc(storageRef, storage)
}

export async function getAllStorage(): Promise<Storage[]> {
    const q = query(collection(db, STORAGE_COLLECTION)).withConverter(storageConverter)
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
}
