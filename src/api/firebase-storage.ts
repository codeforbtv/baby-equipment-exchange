// Modules
import {
    collection,
    DocumentData,
    doc,
    getDoc,
    getDocs,
    query,
    QueryDocumentSnapshot,
    serverTimestamp,
    setDoc,
    SnapshotOptions,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
// Models
import { IStorage, Storage } from '@/models/storage';
import { StorageBody } from '@/types/post-data';
// Libs
import { addErrorEvent, db } from './firebase';

export const STORAGE_COLLECTION = 'Storage';

export const storageConverter = {
    toFirestore(storage: Storage): DocumentData {
        const storageData: Partial<IStorage> = {
            active: storage.getActive(),
            name: storage.getName(),
            address: storage.getAddress(),
            pointOfContact: storage.getPointOfContact(),
            createdAt: storage.getCreatedAt(),
            modifiedAt: storage.getModifiedAt()
        };
        for (const key in storageData) {
            if (storageData[key] === undefined) {
                delete storageData[key];
            }
        }
        return storageData;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Storage {
        const data = snapshot.data(options);
        const storageData: IStorage = {
            id: snapshot.id,
            active: data.active,
            name: data.name,
            address: data.address,
            pointOfContact: data.pointOfContact,
            createdAt: data.createdAt,
            modifiedAt: data.modifiedAt
        };
        return new Storage(storageData);
    }
};

export async function addStorage(newStorage: StorageBody): Promise<void> {
    try {
        const storageRef = doc(collection(db, STORAGE_COLLECTION));
        const storageParams: IStorage = {
            id: storageRef.id,
            active: newStorage.active,
            name: newStorage.name,
            address: newStorage.address,
            pointOfContact: newStorage.pointOfContact,
            createdAt: serverTimestamp() as Timestamp,
            modifiedAt: serverTimestamp() as Timestamp
        };
        const storage = new Storage(storageParams);
        await setDoc(storageRef, storageConverter.toFirestore(storage));
    } catch (error) {
        addErrorEvent('addStorage', error);
        throw error;
    }
}

export async function getAllStorage(): Promise<Storage[]> {
    try {
        const q = query(collection(db, STORAGE_COLLECTION)).withConverter(storageConverter);
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => doc.data());
    } catch (error) {
        addErrorEvent('getAllStorage', error);
        throw error;
    }
}

export async function getActiveStorage(): Promise<Storage[]> {
    try {
        const q = query(collection(db, STORAGE_COLLECTION), where('active', '==', true)).withConverter(storageConverter);
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => doc.data());
    } catch (error) {
        addErrorEvent('getActiveStorage', error);
        throw error;
    }
}

export async function getStorageById(id: string): Promise<Storage> {
    try {
        const storageRef = doc(db, `${STORAGE_COLLECTION}/${id}`).withConverter(storageConverter);
        const snapshot = await getDoc(storageRef);
        if (snapshot.exists()) {
            return snapshot.data();
        } else {
            return Promise.reject(new Error('Storage location not found'));
        }
    } catch (error) {
        addErrorEvent('getStorageById', error);
        throw error;
    }
}

export async function updateStorage(id: string, storageDetails: Partial<StorageBody>): Promise<void> {
    try {
        const storageRef = doc(db, STORAGE_COLLECTION, id);
        await updateDoc(storageRef, {
            ...storageDetails,
            modifiedAt: serverTimestamp()
        });
    } catch (error) {
        addErrorEvent('updateStorage', error);
        throw error;
    }
}

export async function deleteStorage(id: string): Promise<void> {
    try {
        const storageRef = doc(db, STORAGE_COLLECTION, id);
        await updateDoc(storageRef, {
            active: false,
            modifiedAt: serverTimestamp()
        });
    } catch (error) {
        addErrorEvent('deleteStorage (soft)', error);
        throw error;
    }
}
