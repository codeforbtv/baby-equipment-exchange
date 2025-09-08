// Modules
import {
    DocumentData,
    QueryConstraint,
    QueryDocumentSnapshot,
    SnapshotOptions,
    Timestamp,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where,
    writeBatch,
    documentId,
    DocumentReference,
    FieldValue
} from 'firebase/firestore';

// Models
import { Donation, IDonation } from '@/models/donation';
import { InventoryItem, IInventoryItem } from '@/models/inventoryItem';
import { DonationStatusValues } from '@/models/donation';
import { DonationBody } from '@/types/post-data';

// Libs
import { db, auth, addErrorEvent, storage, checkIsAdmin, checkIsAidWorker } from './firebase';
import { deleteObject, ref } from 'firebase/storage';

// Imported constants

export const DONATIONS_COLLECTION = 'Donations';
export const BULK_DONATIONS_COLLECTION = 'BulkDonations';

const donationConverter = {
    toFirestore(donation: Donation): DocumentData {
        const donationData: IDonation = {
            id: donation.getId(),
            donorEmail: donation.getDonorEmail(),
            donorName: donation.getDonorName(),
            donorId: donation.getDonorId(),
            category: donation.getCategory(),
            brand: donation.getBrand(),
            model: donation.getModel(),
            description: donation.getDescription(),
            tagNumber: donation.getTagNumber(),
            notes: donation.getNotes(),
            status: donation.getStatus(),
            bulkCollection: donation.getBulkCollection(),
            images: donation.getImages(),
            createdAt: donation.getCreatedAt(),
            modifiedAt: donation.getModifiedAt(),
            dateReceived: donation.getDateReceived(),
            dateDistributed: donation.getDateDistributed(),
            requestor: donation.getRequestor()
        };
        for (const key in donationData) {
            if (donationData[key] === undefined || donationData[key] === null) {
                delete donationData[key];
            }
        }
        return donationData;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Donation {
        const data = snapshot.data(options);
        const donationData: IDonation = {
            id: data.id,
            donorEmail: data.donorEmail,
            donorName: data.donorName,
            donorId: data.donorId,
            category: data.category,
            brand: data.brand,
            model: data.model,
            description: data.description,
            tagNumber: data.tagNumber,
            notes: data.notes,
            status: data.status,
            bulkCollection: data.bulkCollection,
            images: data.images,
            createdAt: data.createdAt,
            modifiedAt: data.modifiedAt,
            dateReceived: data.dateReceived,
            dateDistributed: data.dateDistributed,
            requestor: data.requestor
        };
        return new Donation(donationData);
    }
};

const inventoryConverter = {
    toFirestore(inventory: InventoryItem): DocumentData {
        const inventoryData: IInventoryItem = {
            id: inventory.getId(),
            category: inventory.getCategory(),
            brand: inventory.getBrand(),
            model: inventory.getModel(),
            description: inventory.getDescription(),
            tagNumber: inventory.getTagNumber(),
            notes: inventory.getNotes(),
            status: inventory.getStatus(),
            bulkCollection: inventory.getBulkCollection(),
            images: inventory.getImages(),
            createdAt: inventory.getCreatedAt(),
            modifiedAt: inventory.getModifiedAt(),
            dateReceived: inventory.getDateReceived(),
            dateDistributed: inventory.getDateDistributed(),
            requestor: inventory.getRequestor()
        };
        for (const key in inventoryData) {
            if (inventoryData[key] === undefined || inventoryData[key] === null) {
                delete inventoryData[key];
            }
        }
        return inventoryData;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): InventoryItem {
        const data = snapshot.data(options);
        const inventoryData: IInventoryItem = {
            id: data.id,
            category: data.category,
            brand: data.brand,
            model: data.model,
            description: data.description,
            tagNumber: data.tagNumber,
            notes: data.notes,
            status: data.status,
            bulkCollection: data.bulkCollection,
            images: data.images,
            createdAt: data.createdAt,
            modifiedAt: data.modifiedAt,
            dateReceived: data.dateReceived,
            dateDistributed: data.dateDistributed,
            requestor: data.requestor
        };
        return new InventoryItem(inventoryData);
    }
};

export async function getAllDonations(): Promise<Donation[]> {
    try {
        let donations: Donation[] = [];
        const querySnapshot = await getDocs(collection(db, DONATIONS_COLLECTION).withConverter(donationConverter));
        querySnapshot.forEach((snapshot) => {
            donations.push(snapshot.data());
        });
        return donations;
    } catch (error) {
        addErrorEvent('Get all donations', error);
    }
    return Promise.reject();
}

export async function getInventory(): Promise<InventoryItem[]> {
    try {
        let inventory: InventoryItem[] = [];
        const collectionRef = collection(db, DONATIONS_COLLECTION);
        const contraints: QueryConstraint[] = [where('status', '==', 'available')];
        const q = query(collectionRef, ...contraints).withConverter(inventoryConverter);
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((snapshot) => {
            inventory.push(snapshot.data());
        });
        return inventory;
    } catch (error) {
        addErrorEvent('Get inventory', error);
    }
    return Promise.reject();
}

export async function getInventoryByIds(inventoryIds: string[]): Promise<InventoryItem[]> {
    try {
        let inventory: InventoryItem[] = [];
        const collectionRef = collection(db, DONATIONS_COLLECTION);
        const constraints: QueryConstraint[] = [where(documentId(), 'in', inventoryIds)];
        const q = query(collectionRef, ...constraints).withConverter(inventoryConverter);
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((snapshot) => {
            inventory.push(snapshot.data());
        });
        return inventory;
    } catch (error) {
        addErrorEvent('Get inventory by Ids', error);
    }
    return Promise.reject();
}

export async function getDonationById(id: string): Promise<Donation> {
    try {
        const donationRef = doc(db, `${DONATIONS_COLLECTION}/${id}`).withConverter(donationConverter);
        const donationSnapshot = await getDoc(donationRef);
        if (donationSnapshot.exists()) {
            return donationSnapshot.data();
        } else {
            return Promise.reject();
        }
    } catch (error: any) {
        addErrorEvent('getDonationById', error);
    }
    return Promise.reject();
}

export async function addBulkDonation(newDonations: DonationBody[]) {
    try {
        const bulkDonationsRef = doc(collection(db, BULK_DONATIONS_COLLECTION));
        const batch = writeBatch(db);
        batch.set(bulkDonationsRef, {
            donations: [],
            donorEmail: newDonations[0].donorEmail,
            donorName: newDonations[0].donorName,
            donorId: newDonations[0].donorId
        });
        for (const newDonation of newDonations) {
            const donationRef = doc(collection(db, DONATIONS_COLLECTION));
            const donationParams: IDonation = {
                id: donationRef.id,
                donorEmail: newDonation.donorEmail,
                donorName: newDonation.donorName,
                donorId: newDonation.donorId,
                category: newDonation.category,
                brand: newDonation.brand,
                model: newDonation.model,
                description: newDonation.description,
                tagNumber: null,
                notes: null,
                status: 'in processing',
                bulkCollection: bulkDonationsRef.id,
                images: newDonation.images,
                createdAt: serverTimestamp() as Timestamp,
                modifiedAt: serverTimestamp() as Timestamp,
                dateReceived: null,
                dateDistributed: null,
                requestor: null
            };
            const donation = new Donation(donationParams);
            batch.set(donationRef, donationConverter.toFirestore(donation));
            batch.update(bulkDonationsRef, {
                donations: arrayUnion(donationRef)
            });
        }
        await batch.commit();
    } catch (error) {
        addErrorEvent('addBulkDonation', error);
    }
}

export async function updateDonation(id: string, donationDetails: any): Promise<void> {
    if (!auth.currentUser || (auth.currentUser && !checkIsAdmin(auth.currentUser))) {
        return Promise.reject('Must be an admin to update donation status');
    }
    try {
        const donationRef = doc(db, DONATIONS_COLLECTION, id).withConverter(donationConverter);
        await updateDoc(donationRef, {
            ...donationDetails,
            modifiedAt: serverTimestamp()
        });
    } catch (error) {
        addErrorEvent('Error updating donation', error);
    }
}

export async function updateDonationStatus(id: string, status: DonationStatusValues): Promise<DonationStatusValues> {
    if (!auth.currentUser) {
        return Promise.reject('Must be logged in to change donation status');
    }
    if (auth.currentUser && (!checkIsAdmin(auth.currentUser) || !checkIsAidWorker(auth.currentUser))) {
        return Promise.reject('Only admins and aid workers can update a donation status');
    }
    try {
        const donationRef = doc(db, `${DONATIONS_COLLECTION}/${id}`).withConverter(donationConverter);

        let statusUpdate;

        if (status === 'available') {
            statusUpdate = {
                status: status,
                modfiedAt: serverTimestamp(),
                dateReceived: serverTimestamp()
            };
        } else if (status === 'distributed') {
            statusUpdate = {
                status: status,
                modfiedAt: serverTimestamp(),
                dateDistributed: serverTimestamp()
            };
        } else {
            statusUpdate = {
                status: status,
                modfiedAt: serverTimestamp()
            };
        }
        await updateDoc(donationRef, statusUpdate);
        return status;
    } catch (error) {
        addErrorEvent('updateDonationStatus', error);
        throw error;
    }
}

export async function deleteDonationById(id: string): Promise<void> {
    //to-do make admin only
    try {
        const donationRef = doc(db, `${DONATIONS_COLLECTION}/${id}`).withConverter(donationConverter);
        const donationSnapshot = await getDoc(donationRef);
        const donation = donationSnapshot.data();
        donation?.images.forEach(async (image) => {
            try {
                const imageRef = ref(storage, image as string);
                await deleteObject(imageRef);
            } catch (error) {
                addErrorEvent('Delete images in deleteDonationById', error);
            }
        });
        await deleteDoc(donationRef);
    } catch (error) {
        addErrorEvent('Delete donation by id', error);
    }
}

export async function requestInventoryItems(inventoryItemIds: string[], user: DocumentReference): Promise<void> {
    try {
        const batch = writeBatch(db);
        for (const inventoryItemId of inventoryItemIds) {
            const inventoryItemRef = doc(db, DONATIONS_COLLECTION, inventoryItemId);
            await updateDoc(inventoryItemRef, {
                status: 'requested',
                requestor: user
            });
            await batch.commit();
        }
    } catch (error) {
        addErrorEvent('Request inventory items', error);
    }
}
